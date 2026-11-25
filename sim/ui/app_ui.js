/**
 * Infinity Living Simulator — Interactive Terminal UI Controller
 * Attaches to window.INFINITY.UI
 * Wires sim/index.html to Engine, AI, Audio, and Canvas.
 */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  var uiState = {
    currentScene: null,
    hallTab: 'shop',
    shopFilters: {
      q: '',
      category: 'all',
      tier: 'all',
      canonOnly: false,
      affordableOnly: false
    },
    shopPage: 1,
    shopPageSize: 24,
    pendingPresetId: null,
    fusionSlotA: null,
    fusionSlotB: null,
    selectedNpcId: 'yanci',
    hallChats: {}, // npcId -> [{ role, text, deltas, spark }]
    hallChatBusy: false,
    sparringLog: [],
    examBusy: false,
    world25dMounted: false,
    lastSnapshot: null,
    radioLog: [],
    radioBusy: false,
    radioFocused: false,
    examEnded: false,
    clockGlitchTimer: null,
    minimapBaseCanvas: null,
    hotbarSig: '',
    lastAudioThreat: -1,
    crisisTimerId: null,
    crisisActiveKey: null,
    crisisDeadline: 0,
    crisisTotalSec: 8,
    audioUnlocked: false,
    lastFeedCount: 0
  };

  var STARTER_PRESETS = [
    {
      id: 'sword_guard',
      label: '剑意控防流 (148分)',
      desc: '先天剑骨雏形 + 宵练剑意 + 青铜古法剑 + 画地界 + 抗声模因耳塞 + 治疗喷雾',
      preferIds: ['B026', 'C001', 'C002', 'C005', 'A008', 'G001']
    },
    {
      id: 'cyber_recon',
      label: '赛博侦察流 (148分)',
      desc: '军用赛博神经底盘 + PKE监测仪 + 门禁破解器 + 电磁脉冲手雷 + 战术闪光弹 + 急救包',
      preferIds: ['B041', 'T004', 'T008', 'T015', 'T010', 'G001']
    },
    {
      id: 'occult_control',
      label: '规则抗异流 (143分)',
      desc: '道门守心体 + 观察者（可融双C或换防具）+ 抗声模因耳塞 + 灵异控场件',
      preferIds: ['B027', 'B023', 'A008', 'A005', 'G001']
    }
  ];

  var CATEGORY_LABELS = {
    all: '全部分类',
    bloodline: '血统与体质',
    cultivation: '功法与武学',
    myth: '奇幻与神秘',
    tech: '科技与军械',
    anomaly: '灵异与规则',
    general: '通用与消耗'
  };

  /* ===================== HELPERS ===================== */

  function $(id) {
    return document.getElementById(id);
  }

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function playSfx(name) {
    if (INFINITY.Audio && typeof INFINITY.Audio.playSfx === 'function') {
      INFINITY.Audio.playSfx(name);
    }
  }

  function showToast(msg, tone) {
    var stack = $('toast-stack');
    if (!stack) return;
    var el = document.createElement('div');
    el.className = 'toast' + (tone ? ' ' + tone : '');
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(4px)';
      el.style.transition = 'all 0.25s ease';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 260);
    }, 3200);
  }

  function getCatalog() {
    return Array.isArray(INFINITY.SHOP_CATALOG) ? INFINITY.SHOP_CATALOG : [];
  }

  function getCatalogMap() {
    var map = {};
    var list = getCatalog();
    for (var i = 0; i < list.length; i++) {
      map[list[i].id] = list[i];
    }
    return map;
  }

  function getCast() {
    return INFINITY.CAST || {};
  }

  function getScenario() {
    return (INFINITY.SCENARIOS && INFINITY.SCENARIOS.station_zero) || null;
  }

  function getStateSafe() {
    if (INFINITY.Engine && typeof INFINITY.Engine.getState === 'function') {
      return INFINITY.Engine.getState() || {};
    }
    return {};
  }

  function getPlayer(state) {
    return (state && state.player) || {
      name: '受试者',
      callsign: 'CN-10309',
      points: 180,
      permission: 'C',
      hp: 100,
      maxHp: 100,
      energy: 100,
      maxEnergy: 100,
      sanity: 100,
      maxSanity: 100,
      stats: { phy: 10, agi: 10, obs: 10, wil: 10 },
      ownedItems: []
    };
  }

  function getOwnedEntries(player) {
    var raw = player.loadout || player.ownedItems || player.inventory || player.items || [];
    var catMap = getCatalogMap();
    return raw.map(function (entry) {
      if (typeof entry === 'string') {
        var found = catMap[entry];
        return found ? Object.assign({ discounted: false }, found) : { id: entry, name: entry, tier: 'D', category: 'general', price: 0 };
      }
      var base = entry.id && catMap[entry.id] ? catMap[entry.id] : {};
      return Object.assign({}, base, entry);
    });
  }

  function hasOwnedId(player, itemId) {
    var list = getOwnedEntries(player);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === itemId) return true;
    }
    return false;
  }

  function getSceneName(state) {
    var s = state.scene || state.mode || state.phase || 'hall';
    if (s === 'station_zero' || s === 'exam' || s === 'scenario') return 'exam';
    if (s === 'settlement' || s === 'result' || s === 'summary') return 'settlement';
    return 'hall';
  }

  function getRelMap(state) {
    return (state && (state.relationships || state.relations || state.castState)) || {};
  }

  function getNpcRelation(state, npcId) {
    var cast = getCast();
    var base = cast[npcId] || {};
    var rel = getRelMap(state)[npcId] || {};
    return {
      trust: rel.trust != null ? rel.trust : (base.initialTrust != null ? base.initialTrust : 30),
      caution: rel.caution != null ? rel.caution : (base.initialCaution != null ? base.initialCaution : 50),
      bond: rel.bond != null ? rel.bond : (base.initialBond != null ? base.initialBond : 10)
    };
  }

  function formatDeltaSummary(pd) {
    if (!pd) return '';
    var parts = [];
    if (pd.phy) parts.push('体+' + pd.phy);
    if (pd.agi) parts.push('敏+' + pd.agi);
    if (pd.obs) parts.push('察+' + pd.obs);
    if (pd.wil) parts.push('意+' + pd.wil);
    if (pd.energy) parts.push('能+' + pd.energy);
    return parts.join(' · ');
  }

  /* ===================== AUDIO UNLOCK & SCENE SYNC ===================== */

  function bindAudioUnlockOnce() {
    function unlock() {
      if (uiState.audioUnlocked) return;
      uiState.audioUnlocked = true;
      if (INFINITY.Audio && typeof INFINITY.Audio.unlock === 'function') {
        INFINITY.Audio.unlock();
        syncAudioForState(getStateSafe());
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    }
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  function syncAudioForState(state) {
    if (!INFINITY.Audio || typeof INFINITY.Audio.setScene !== 'function') return;
    var scene = getSceneName(state);
    if (scene === 'hall') {
      INFINITY.Audio.setScene('hall');
    } else if (scene === 'settlement') {
      INFINITY.Audio.setScene('settlement');
    } else if (scene === 'exam') {
      var exam = state.exam || {};
      var threat = Number(exam.threat != null ? exam.threat : 15) || 0;
      if (typeof INFINITY.Audio.setThreatLevel === 'function') {
        INFINITY.Audio.setThreatLevel(threat);
      }
      if (exam.activeCrisis) {
        INFINITY.Audio.setScene('crisis');
      } else if (threat >= 45) {
        INFINITY.Audio.setScene('station_tense');
      } else {
        INFINITY.Audio.setScene('station_calm');
      }
    }
  }

  /* ===================== HUD & AI STATUS RENDER ===================== */

  function renderHud(state) {
    var p = getPlayer(state);
    var nameEl = $('hud-player-name');
    var codeEl = $('hud-player-code');
    var ptsEl = $('hud-points');
    var permEl = $('hud-permission');

    if (nameEl) nameEl.textContent = p.name || '受试者';
    if (codeEl) codeEl.textContent = p.callsign || p.code || 'CN-10309';
    if (ptsEl) ptsEl.textContent = Math.floor(Number(p.points) || 0);
    if (permEl) permEl.textContent = (p.permission || 'C') + '级权限';

    var hp = Number(p.hp != null ? p.hp : 100);
    var maxHp = Number(p.maxHp || 100);
    var en = Number(p.energy != null ? p.energy : 100);
    var maxEn = Number(p.maxEnergy || 100);
    var san = Number(p.sanity != null ? p.sanity : 100);
    var maxSan = Number(p.maxSanity || 100);

    if ($('bar-hp')) $('bar-hp').style.width = clamp((hp / maxHp) * 100, 0, 100) + '%';
    if ($('val-hp')) $('val-hp').textContent = Math.round(hp);
    if ($('bar-en')) $('bar-en').style.width = clamp((en / maxEn) * 100, 0, 100) + '%';
    if ($('val-en')) $('val-en').textContent = Math.round(en);
    if ($('bar-san')) $('bar-san').style.width = clamp((san / maxSan) * 100, 0, 100) + '%';
    if ($('val-san')) $('val-san').textContent = Math.round(san);

    renderAiStatusPill();
  }

  function renderAiStatusPill() {
    var pill = $('btn-ai-config');
    var txt = $('ai-status-text');
    if (!pill || !txt) return;
    var cfg = INFINITY.AI && typeof INFINITY.AI.getConfig === 'function' ? INFINITY.AI.getConfig() : null;
    var isOnline = !!(cfg && cfg.enabled && (cfg.apiKey || /localhost|127\.0\.0\.1/i.test(cfg.baseUrl || '')));
    pill.classList.toggle('online', isOnline);
    pill.classList.toggle('offline', !isOnline);
    if (isOnline) {
      var label = /deepseek/i.test(cfg.baseUrl || cfg.model || '') ? 'DeepSeek 在线' : (cfg.model || 'AI 在线');
      txt.textContent = label;
    } else {
      txt.textContent = '离线推演';
    }
  }

  /* ===================== SCENE SWITCHING ===================== */

  function unmountWorld25DIfNeeded() {
    if (uiState.world25dMounted) {
      uiState.world25dMounted = false;
      uiState.radioFocused = false;
      if (uiState.clockGlitchTimer) {
        clearTimeout(uiState.clockGlitchTimer);
        uiState.clockGlitchTimer = null;
      }
      if (INFINITY.World25D && typeof INFINITY.World25D.unmount === 'function') {
        try {
          INFINITY.World25D.unmount();
        } catch (_) {}
      }
    }
  }

  function syncSceneContainers(state) {
    var scene = getSceneName(state);
    var prev = uiState.currentScene;
    document.body.setAttribute('data-scene', scene);

    ['hall', 'exam', 'settlement'].forEach(function (name) {
      var el = $('scene-' + name);
      if (el) el.classList.toggle('active', name === scene);
    });

    if (prev !== scene) {
      uiState.currentScene = scene;

      if (scene !== 'exam') {
        unmountWorld25DIfNeeded();
      }

      if (scene === 'hall') {
        if (INFINITY.Canvas && $('hall-vortex-canvas')) {
          INFINITY.Canvas.mountHallVortex($('hall-vortex-canvas'));
        }
      } else if (scene === 'exam') {
        if (INFINITY.Canvas) {
          INFINITY.Canvas.destroy();
        }
        mountExam25DScene(state);
      } else {
        if (INFINITY.Canvas) {
          INFINITY.Canvas.destroy();
        }
      }

      syncAudioForState(state);
    } else if (scene === 'exam' && !uiState.world25dMounted) {
      mountExam25DScene(state);
    }
  }

  /* ===================== SCENE 1: SPACE HALL ===================== */

  function renderLoadoutRail(state) {
    var p = getPlayer(state);
    var owned = getOwnedEntries(p);
    var stats = p.derivedStats || p.stats || { phy: 10, agi: 10, obs: 10, wil: 10 };

    if ($('rail-item-count')) $('rail-item-count').textContent = owned.length + ' 项武装';
    if ($('shop-total-badge')) $('shop-total-badge').textContent = String(getCatalog().length || 500);

    var sg = $('rail-stats-grid');
    if (sg) {
      sg.innerHTML = [
        { k: '体魄 PHY', v: stats.phy != null ? stats.phy : 10 },
        { k: '敏捷 AGI', v: stats.agi != null ? stats.agi : 10 },
        { k: '洞察 OBS', v: stats.obs != null ? stats.obs : 10 },
        { k: '意志 WIL', v: stats.wil != null ? stats.wil : 10 }
      ].map(function (st) {
        return '<div class="stat-pill"><span class="stat-pill-k">' + st.k + '</span><span class="stat-pill-v">' + Math.round(st.v) + '</span></div>';
      }).join('');
    }

    var inv = $('rail-inventory');
    if (inv) {
      if (!owned.length) {
        inv.innerHTML = '<div class="muted small" style="padding:10px 4px;">尚未兑换任何强化或装备。可在深红商城挑选单品，或一键套用起手构筑。</div>';
      } else {
        inv.innerHTML = owned.map(function (item) {
          var badge = item.discounted ? '<span class="accent-gold">60%折价·含代价</span>' : '<span>' + esc(item.energyType || '通用') + '</span>';
          return (
            '<div class="inv-chip">' +
              '<div class="inv-chip-main">' +
                '<div class="inv-chip-title"><span class="tier-badge tier-' + esc(item.tier || 'D') + '">' + esc(item.tier || 'D') + '</span> ' + esc(item.name) + '</div>' +
                '<div class="inv-chip-meta"><span class="mono">' + esc(item.id) + '</span>' + badge + '</div>' +
              '</div>' +
              '<button class="inv-refund-btn" type="button" data-refund-id="' + esc(item.id) + '">退换</button>' +
            '</div>'
          );
        }).join('');
      }
    }
  }

  function renderHallWorkspace(state) {
    var container = $('hall-view-container');
    if (!container) return;

    document.querySelectorAll('.hall-tab').forEach(function (btn) {
      var active = btn.getAttribute('data-hall-tab') === uiState.hallTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (uiState.hallTab === 'shop') {
      renderShopView(container, state);
    } else if (uiState.hallTab === 'fusion') {
      renderFusionView(container, state);
    } else if (uiState.hallTab === 'living') {
      renderLivingHallView(container, state);
    } else if (uiState.hallTab === 'sparring') {
      renderSparringView(container, state);
    }
  }

  /* --- Hall Tab 1: 500-Item Shop --- */

  function queryShopItems(state) {
    var f = uiState.shopFilters;
    if (INFINITY.Engine && typeof INFINITY.Engine.queryShop === 'function') {
      try {
        var res = INFINITY.Engine.queryShop({
          q: f.q,
          category: f.category === 'all' ? '' : f.category,
          tier: f.tier === 'all' ? '' : f.tier,
          canonOnly: f.canonOnly,
          affordableOnly: f.affordableOnly
        });
        if (Array.isArray(res)) return res;
      } catch (_) {}
    }

    var p = getPlayer(state);
    var q = (f.q || '').trim().toLowerCase();
    return getCatalog().filter(function (item) {
      if (f.category !== 'all' && item.category !== f.category) return false;
      if (f.tier !== 'all' && item.tier !== f.tier) return false;
      if (f.canonOnly && !item.canon) return false;
      if (f.affordableOnly) {
        var minPrice = item.discountable ? Math.round(item.price * 0.6) : item.price;
        if (minPrice > (p.points || 0)) return false;
      }
      if (q) {
        var hay = [item.id, item.name, item.desc, item.source, item.energyType, (item.tags || []).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderShopView(container, state) {
    var p = getPlayer(state);
    var items = queryShopItems(state);
    var totalPages = Math.max(1, Math.ceil(items.length / uiState.shopPageSize));
    uiState.shopPage = clamp(uiState.shopPage, 1, totalPages);
    var start = (uiState.shopPage - 1) * uiState.shopPageSize;
    var pageItems = items.slice(start, start + uiState.shopPageSize);

    var presetsHtml = STARTER_PRESETS.map(function (pr) {
      var activeCls = uiState.pendingPresetId === pr.id ? ' active' : '';
      return '<button class="preset-build-btn' + activeCls + '" type="button" data-preset-build="' + pr.id + '" title="' + esc(pr.desc) + '">' + esc(pr.label) + '</button>';
    }).join('');
    var presetConfirmHtml = '';
    if (uiState.pendingPresetId) {
      var pendingPr = STARTER_PRESETS.filter(function (x) { return x.id === uiState.pendingPresetId; })[0];
      if (pendingPr) {
        var catMap = getCatalogMap();
        var itemListText = pendingPr.preferIds.map(function (id) {
          var it = catMap[id];
          return it ? (it.name + '(' + it.price + ')') : id;
        }).join(' + ');
        presetConfirmHtml =
          '<div class="preset-confirm-bar">' +
            '<div class="preset-confirm-info">' +
              '<div><strong class="accent-gold">预览构筑：' + esc(pendingPr.label) + '</strong> <span class="small muted">（将自动全额退还本轮已选备战装备并购入以下整套）</span></div>' +
              '<div class="small" style="color:var(--text-secondary);">' + esc(itemListText) + '</div>' +
            '</div>' +
            '<div class="preset-confirm-actions">' +
              '<button class="cta-crimson compact" type="button" data-preset-confirm="' + esc(pendingPr.id) + '">确认套用构筑</button>' +
              '<button class="ghost-btn" type="button" data-preset-cancel="1">取消</button>' +
            '</div>' +
          '</div>';
      }
    }

    var catOptions = Object.keys(CATEGORY_LABELS).map(function (k) {
      return '<option value="' + k + '"' + (uiState.shopFilters.category === k ? ' selected' : '') + '>' + CATEGORY_LABELS[k] + '</option>';
    }).join('');

    var tierOptions = ['all', 'D', 'C', 'B', 'A', 'S'].map(function (t) {
      return '<option value="' + t + '"' + (uiState.shopFilters.tier === t ? ' selected' : '') + '>' + (t === 'all' ? '全部评级' : t + ' 级') + '</option>';
    }).join('');

    var cardsHtml = pageItems.length
      ? pageItems.map(function (item) {
          var owned = hasOwnedId(p, item.id);
          var discPrice = Math.max(1, Math.round(item.price * 0.6));
          var canFull = !owned && (p.points || 0) >= item.price;
          var canDisc = !owned && item.discountable && (p.points || 0) >= discPrice;
          var deltaStr = formatDeltaSummary(item.powerDelta);
          var tagsHtml = (item.tags || []).slice(0, 4).map(function (tg) {
            return '<span class="tag-chip">' + esc(tg) + '</span>';
          }).join('');

          return (
            '<article class="item-card' + (owned ? ' owned' : '') + '">' +
              '<div>' +
                '<div class="item-card-top">' +
                  '<div>' +
                    '<div class="item-name">' + esc(item.name) + '</div>' +
                    '<div class="item-id-row">' +
                      '<span class="tier-badge tier-' + esc(item.tier) + '">' + esc(item.tier) + '</span>' +
                      '<span class="mono muted small">' + esc(item.id) + '</span>' +
                      (item.canon ? '<span class="canon-badge">原著</span>' : '') +
                      '<span class="muted small">' + esc(item.energyType || '') + '</span>' +
                    '</div>' +
                  '</div>' +
                  '<div class="item-price">' + item.price + ' <span class="small muted">pts</span></div>' +
                '</div>' +
                '<p class="item-desc" style="margin-top:8px;">' + esc(item.desc) + '</p>' +
              '</div>' +
              '<div>' +
                (deltaStr ? '<div class="item-delta-line" style="margin-bottom:6px;">' + esc(deltaStr) + '</div>' : '') +
                '<div class="item-tags" style="margin-bottom:8px;">' + tagsHtml + '</div>' +
                '<div class="item-actions">' +
                  (owned
                    ? '<button class="buy-btn" type="button" disabled>已装备</button><button class="inv-refund-btn" type="button" data-refund-id="' + esc(item.id) + '">退换</button>'
                    : '<button class="buy-btn" type="button" data-buy-id="' + esc(item.id) + '" data-buy-disc="0"' + (canFull ? '' : ' disabled') + '>全价 ' + item.price + '</button>' +
                      (item.discountable
                        ? '<button class="buy-btn discount" type="button" data-buy-id="' + esc(item.id) + '" data-buy-disc="1"' + (canDisc ? '' : ' disabled') + ' title="60% 折价兑换，附带限次或副作用代价">折价 ' + discPrice + '</button>'
                        : '')
                  ) +
                '</div>' +
              '</div>' +
            '</article>'
          );
        }).join('')
      : '<div class="muted" style="padding:36px;text-align:center;">未检索到符合条件的商城条目，请放宽筛选条件。</div>';

    container.innerHTML =
      '<div class="shop-toolbar">' +
        '<div class="shop-presets-row">' +
          '<span class="shop-presets-label">快速起手构筑：</span>' +
          presetsHtml +
        '</div>' +
        presetConfirmHtml +
        '<div class="shop-filter-row">' +
          '<input id="shop-search-input" class="shop-search" type="search" placeholder="检索 500 项血统 / 功法 / 阵牌 / 军械 / 规则道具（名称、标签、编号）…" value="' + esc(uiState.shopFilters.q) + '">' +
          '<select id="shop-cat-select" class="shop-select">' + catOptions + '</select>' +
          '<select id="shop-tier-select" class="shop-select">' + tierOptions + '</select>' +
          '<label class="filter-toggle"><input id="shop-canon-chk" type="checkbox"' + (uiState.shopFilters.canonOnly ? ' checked' : '') + '> 仅看原著</label>' +
          '<label class="filter-toggle"><input id="shop-afford-chk" type="checkbox"' + (uiState.shopFilters.affordableOnly ? ' checked' : '') + '> 仅看买得起</label>' +
        '</div>' +
        '<div class="shop-meta-bar">' +
          '<span>共匹配 <strong class="mono accent-gold">' + items.length + '</strong> / ' + getCatalog().length + ' 项</span>' +
          '<span class="mono">第 ' + uiState.shopPage + ' / ' + totalPages + ' 页</span>' +
        '</div>' +
      '</div>' +
      '<div class="shop-grid">' + cardsHtml + '</div>' +
      (totalPages > 1
        ? '<div class="shop-pagination">' +
            '<button class="ghost-btn" type="button" data-shop-page="' + (uiState.shopPage - 1) + '"' + (uiState.shopPage <= 1 ? ' disabled' : '') + '>上一页</button>' +
            '<span class="mono small muted">' + uiState.shopPage + ' / ' + totalPages + '</span>' +
            '<button class="ghost-btn" type="button" data-shop-page="' + (uiState.shopPage + 1) + '"' + (uiState.shopPage >= totalPages ? ' disabled' : '') + '>下一页</button>' +
          '</div>'
        : '');

    var searchEl = $('shop-search-input');
    if (searchEl) {
      searchEl.addEventListener('input', function (e) {
        uiState.shopFilters.q = e.target.value;
        uiState.shopPage = 1;
        renderHallWorkspace(getStateSafe());
        var refocused = $('shop-search-input');
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }
    if ($('shop-cat-select')) {
      $('shop-cat-select').addEventListener('change', function (e) {
        uiState.shopFilters.category = e.target.value;
        uiState.shopPage = 1;
        renderHallWorkspace(getStateSafe());
      });
    }
    if ($('shop-tier-select')) {
      $('shop-tier-select').addEventListener('change', function (e) {
        uiState.shopFilters.tier = e.target.value;
        uiState.shopPage = 1;
        renderHallWorkspace(getStateSafe());
      });
    }
    if ($('shop-canon-chk')) {
      $('shop-canon-chk').addEventListener('change', function (e) {
        uiState.shopFilters.canonOnly = e.target.checked;
        uiState.shopPage = 1;
        renderHallWorkspace(getStateSafe());
      });
    }
    if ($('shop-afford-chk')) {
      $('shop-afford-chk').addEventListener('change', function (e) {
        uiState.shopFilters.affordableOnly = e.target.checked;
        uiState.shopPage = 1;
        renderHallWorkspace(getStateSafe());
      });
    }
  }

  function applyStarterPreset(presetId) {
    var preset = STARTER_PRESETS.filter(function (x) { return x.id === presetId; })[0];
    if (!preset) return;
    uiState.pendingPresetId = null;

    if (INFINITY.Engine && typeof INFINITY.Engine.applyPresetBuild === 'function') {
      var res = INFINITY.Engine.applyPresetBuild(presetId);
      if (res && res.ok) {
        playSfx('vortex_buy');
        var count = (res.bought && res.bought.length) || 0;
        showToast('已套用「' + preset.label + '」，右侧构筑栏已入库 ' + count + ' 项武装（花费 ' + (res.totalSpent || 0) + ' 积分）。', 'emerald');
        renderAll(getStateSafe());
        return;
      }
    }

    if (!INFINITY.Engine || typeof INFINITY.Engine.buyItem !== 'function') return;
    var catMap = getCatalogMap();
    var bought = 0;
    for (var i = 0; i < preset.preferIds.length; i++) {
      var id = preset.preferIds[i];
      var item = catMap[id];
      if (!item) continue;
      var p = getPlayer(getStateSafe());
      if (hasOwnedId(p, id)) continue;
      var useDisc = (p.points || 0) < item.price && item.discountable;
      var r = INFINITY.Engine.buyItem(id, useDisc);
      if (r && r.ok !== false) bought++;
    }
    if (bought > 0) {
      playSfx('vortex_buy');
      showToast('已套用「' + preset.label + '」，入库 ' + bought + ' 项武装。', 'emerald');
    } else {
      showToast('积分不足或该构筑核心组件已装备。', 'crimson');
    }
    renderAll(getStateSafe());
  }

  /* --- Hall Tab 2: Bloodline Fusion Lab --- */

  function findCuratedRecipe(idA, idB) {
    var recipes = Array.isArray(INFINITY.FUSION_RECIPES) ? INFINITY.FUSION_RECIPES : [];
    for (var i = 0; i < recipes.length; i++) {
      var inp = recipes[i].inputs || [];
      if ((inp[0] === idA && inp[1] === idB) || (inp[0] === idB && inp[1] === idA)) {
        return recipes[i];
      }
    }
    return null;
  }

  function renderFusionView(container, state) {
    var p = getPlayer(state);
    var owned = getOwnedEntries(p);
    var bloodlines = owned.filter(function (it) { return it.category === 'bloodline'; });
    var catMap = getCatalogMap();
    var recipes = Array.isArray(INFINITY.FUSION_RECIPES) ? INFINITY.FUSION_RECIPES : [];

    // Validate slots still owned
    if (uiState.fusionSlotA && !hasOwnedId(p, uiState.fusionSlotA)) uiState.fusionSlotA = null;
    if (uiState.fusionSlotB && !hasOwnedId(p, uiState.fusionSlotB)) uiState.fusionSlotB = null;

    var itemA = uiState.fusionSlotA ? bloodlines.filter(function (b) { return b.id === uiState.fusionSlotA; })[0] : null;
    var itemB = uiState.fusionSlotB ? bloodlines.filter(function (b) { return b.id === uiState.fusionSlotB; })[0] : null;

    var previewHtml = '';
    if (itemA && itemB) {
      var curated = findCuratedRecipe(itemA.id, itemB.id);
      if (curated) {
        previewHtml =
          '<div class="fusion-preview-card">' +
            '<p class="eyebrow crimson">CURATED FUSION // 秘传血统融合</p>' +
            '<h4>' + esc(curated.result.name) + ' <span class="tier-badge tier-' + esc(curated.result.tier) + '">' + esc(curated.result.tier) + '</span></h4>' +
            '<p class="item-desc" style="margin:6px 0;">' + esc(curated.result.desc) + '</p>' +
            '<div class="item-delta-line">' + esc(formatDeltaSummary(curated.result.powerDelta)) + '</div>' +
            '<p class="small accent-crimson" style="margin:6px 0 12px;">代价：' + esc(curated.result.drawback || '融合排异反应') + '</p>' +
            '<button id="btn-execute-fusion" class="cta-crimson compact" type="button">消耗 ' + (curated.extraCost || 30) + ' 积分执行融合</button>' +
          '</div>';
      } else {
        var tierCosts = { D: 30, C: 90, B: 270, A: 500 };
        var sameTier = itemA.tier === itemB.tier;
        var estCost = tierCosts[itemA.tier] || 30;
        previewHtml =
          '<div class="fusion-preview-card">' +
            '<p class="eyebrow">PROCEDURAL FUSION // 自由同阶跨体系拼合</p>' +
            '<h4>' + esc(itemA.name) + ' × ' + esc(itemB.name) + '</h4>' +
            (sameTier
              ? '<p class="item-desc" style="margin:6px 0;">未命中固定秘方，将通过主神基因熔炉合成高一阶定制复合血统（D+D→C需30分，C+C→B需90分）。</p>' +
                '<button id="btn-execute-fusion" class="cta-crimson compact" type="button">消耗 ' + estCost + ' 积分执行动态融合</button>'
              : '<p class="small accent-crimson" style="margin:6px 0;">动态融合要求两项血统为同一评级（当前为 ' + esc(itemA.tier) + ' 级与 ' + esc(itemB.tier) + ' 级）。请再购入同级血统或凑齐右侧秘传配方。</p>') +
          '</div>';
      }
    } else {
      previewHtml = '<div class="muted small" style="margin-top:12px;">请从下方已拥有的血统中任选 2 项填入熔炉槽位。</div>';
    }

    var ownedListHtml = bloodlines.length
      ? bloodlines.map(function (b) {
          var sel = b.id === uiState.fusionSlotA || b.id === uiState.fusionSlotB;
          return (
            '<button class="fusion-pick-btn' + (sel ? ' selected' : '') + '" type="button" data-fusion-pick="' + esc(b.id) + '">' +
              '<span><span class="tier-badge tier-' + esc(b.tier) + '">' + esc(b.tier) + '</span> ' + esc(b.name) + '</span>' +
              '<span class="mono small muted">' + esc(b.id) + '</span>' +
            '</button>'
          );
        }).join('')
      : '<div class="muted small" style="padding:12px 0;">当前尚未持有血统类强化，请先前往「深红商城」筛选【血统与体质】购买至少 2 项。</div>';

    var recipesHtml = recipes.map(function (r) {
      var a = catMap[r.inputs[0]];
      var b = catMap[r.inputs[1]];
      var hasA = hasOwnedId(p, r.inputs[0]);
      var hasB = hasOwnedId(p, r.inputs[1]);
      var ready = hasA && hasB;
      return (
        '<div class="recipe-item' + (ready ? ' ready' : '') + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<strong>' + esc(r.result.name) + ' <span class="tier-badge tier-' + esc(r.result.tier) + '">' + esc(r.result.tier) + '</span></strong>' +
            '<span class="mono small accent-gold">+' + r.extraCost + ' pts</span>' +
          '</div>' +
          '<div class="small muted" style="margin-bottom:4px;">材料：' +
            '<span class="' + (hasA ? 'accent-emerald' : '') + '">' + esc(a ? a.name : r.inputs[0]) + (hasA ? ' ✓' : '') + '</span> + ' +
            '<span class="' + (hasB ? 'accent-emerald' : '') + '">' + esc(b ? b.name : r.inputs[1]) + (hasB ? ' ✓' : '') + '</span>' +
          '</div>' +
          '<div class="small" style="color:var(--text-secondary);">' + esc(r.result.desc) + '</div>' +
        '</div>'
      );
    }).join('');

    container.innerHTML =
      '<div class="fusion-layout">' +
        '<div class="fusion-panel">' +
          '<p class="eyebrow crimson">GENE CRUCIBLE // 血统融合炉</p>' +
          '<h3>双血统熔合槽</h3>' +
          '<div class="fusion-slots">' +
            '<div class="fusion-slot' + (itemA ? ' filled' : '') + '">' +
              '<span class="mono small muted">SLOT A</span>' +
              '<strong>' + (itemA ? esc(itemA.name) : '未选择') + '</strong>' +
            '</div>' +
            '<div class="fusion-plus">＋</div>' +
            '<div class="fusion-slot' + (itemB ? ' filled' : '') + '">' +
              '<span class="mono small muted">SLOT B</span>' +
              '<strong>' + (itemB ? esc(itemB.name) : '未选择') + '</strong>' +
            '</div>' +
          '</div>' +
          previewHtml +
          '<div class="rail-section-label" style="margin-top:16px;">已持有血统（点击装入 / 取消）</div>' +
          '<div class="fusion-bloodline-list">' + ownedListHtml + '</div>' +
        '</div>' +
        '<div class="fusion-panel">' +
          '<p class="eyebrow">CURATED ARCHIVE // 已知高阶融合配方 (' + recipes.length + ')</p>' +
          '<h3>秘传血统图谱</h3>' +
          '<div class="recipe-list">' + recipesHtml + '</div>' +
        '</div>' +
      '</div>';

    if ($('btn-execute-fusion')) {
      $('btn-execute-fusion').addEventListener('click', function () {
        if (!INFINITY.Engine || typeof INFINITY.Engine.fuseBloodlines !== 'function') return;
        var res = INFINITY.Engine.fuseBloodlines(uiState.fusionSlotA, uiState.fusionSlotB);
        if (res && res.ok !== false) {
          playSfx('fusion');
          showToast('血统融合完成：' + (res.result ? res.result.name : '新血统已生成'), 'emerald');
          uiState.fusionSlotA = null;
          uiState.fusionSlotB = null;
          renderAll(getStateSafe());
        } else {
          showToast((res && res.error) || '融合失败：请检查积分或权限等级。', 'crimson');
        }
      });
    }
  }

  /* --- Hall Tab 3: Living World & Hall Social --- */

  function renderLivingHallView(container, state) {
    var cast = getCast();
    var castIds = Object.keys(cast).filter(function (id) { return cast[id].canMeetInHall !== false; });
    if (!cast[uiState.selectedNpcId] && castIds.length) {
      uiState.selectedNpcId = castIds[0];
    }

    var baseFeed = Array.isArray(INFINITY.WORLD_FEED) ? INFINITY.WORLD_FEED : [];
    var visibleFeed = [];
    if (Array.isArray(state.worldFeed)) {
      visibleFeed = state.worldFeed.slice(0, Math.max(4, state.worldFeedIndex || 6));
    } else if (state.worldFeed && typeof state.worldFeed === 'object') {
      var custom = Array.isArray(state.worldFeed.customBulletins) ? state.worldFeed.customBulletins : [];
      var count = Math.max(4, Number(state.worldFeed.unlockedCount) || 6);
      visibleFeed = custom.concat(baseFeed.slice(0, count));
    } else {
      visibleFeed = baseFeed.slice(0, 6);
    }

    var radarHtml = visibleFeed.map(function (ev) {
      return (
        '<div class="radar-card">' +
          '<div class="radar-card-head"><span>' + esc(ev.source || ev.channel || '空间暗流') + '</span><span class="accent-gold">' + esc(ev.tag || ev.time || '动态') + '</span></div>' +
          '<h4>' + esc(ev.title || '死考世界动态') + '</h4>' +
          '<p>' + esc(ev.body || ev.text || ev.summary || '') + '</p>' +
        '</div>'
      );
    }).join('');

    var rosterHtml = castIds.map(function (id) {
      var c = cast[id];
      var rel = getNpcRelation(state, id);
      var groupTag = c.group === 'canon' ? '原著线' : '原创队';
      return (
        '<button class="cast-btn' + (id === uiState.selectedNpcId ? ' active' : '') + '" type="button" data-select-npc="' + esc(id) + '">' +
          '<div style="display:flex;align-items:center;gap:9px;min-width:0;">' +
            '<span class="cast-dot" style="background:' + esc(c.accentColor || '#d6b274') + ';"></span>' +
            '<div style="min-width:0;">' +
              '<div style="font-weight:600;font-size:13px;">' + esc(c.name) + ' <span class="mono muted small">' + esc(c.tier || '') + '</span></div>' +
              '<div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(c.role || '') + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0;">' +
            '<div class="small" style="color:' + (c.group === 'canon' ? 'var(--gold)' : 'var(--cyan)') + ';">' + groupTag + '</div>' +
            '<div class="mono small muted">信' + rel.trust + ' 戒' + rel.caution + '</div>' +
          '</div>' +
        '</button>'
      );
    }).join('');

    var npc = cast[uiState.selectedNpcId] || { id: 'yanci', name: '严辞', role: '', statusText: '', hallOpeningHook: '' };
    var npcRel = getNpcRelation(state, npc.id);
    var history = uiState.hallChats[npc.id] || [];
    if (!history.length && npc.hallOpeningHook) {
      history = [{ role: 'npc', text: npc.hallOpeningHook }];
      uiState.hallChats[npc.id] = history;
    }

    var chatHtml = history.map(function (m) {
      var deltasHtml = '';
      if (m.deltas) {
        var bits = [];
        if (m.deltas.trustDelta) bits.push('<span class="delta-badge ' + (m.deltas.trustDelta > 0 ? 'delta-pos' : 'delta-neg') + '">信赖 ' + (m.deltas.trustDelta > 0 ? '+' : '') + m.deltas.trustDelta + '</span>');
        if (m.deltas.cautionDelta) bits.push('<span class="delta-badge ' + (m.deltas.cautionDelta < 0 ? 'delta-pos' : 'delta-neg') + '">戒备 ' + (m.deltas.cautionDelta > 0 ? '+' : '') + m.deltas.cautionDelta + '</span>');
        if (m.deltas.bondDelta) bits.push('<span class="delta-badge delta-gold">火花 +' + m.deltas.bondDelta + '</span>');
        if (bits.length) deltasHtml = '<div class="delta-badges" style="margin-top:6px;">' + bits.join('') + '</div>';
      }
      return '<div class="chat-bubble ' + m.role + '">' + esc(m.text) + deltasHtml + '</div>';
    }).join('');

    container.innerHTML =
      '<div class="living-layout">' +
        '<div class="living-col">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span class="rail-section-label" style="margin:0;">活体世界雷达</span>' +
            '<button id="btn-advance-radar" class="ghost-btn" type="button">刷新暗流</button>' +
          '</div>' +
          '<div class="radar-feed">' + radarHtml + '</div>' +
          '<div class="rail-section-label" style="margin:4px 0 0;">大厅可碰头人员（原创 + 原著平行线）</div>' +
          '<div class="cast-roster">' + rosterHtml + '</div>' +
        '</div>' +
        '<div class="hall-chat-box">' +
          '<div class="hall-chat-head">' +
            '<div>' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span class="cast-dot" style="background:' + esc(npc.accentColor || '#d6b274') + ';"></span>' +
                '<h3>' + esc(npc.name) + ' <span class="mono muted small">' + esc(npc.codename || '') + '</span></h3>' +
              '</div>' +
              '<div class="small muted" style="margin-top:3px;">' + esc(npc.statusText || npc.role || '') + '</div>' +
            '</div>' +
            '<div class="rel-pills">' +
              '<span class="rel-pill accent-emerald">信赖 ' + npcRel.trust + '</span>' +
              '<span class="rel-pill accent-crimson">戒备 ' + npcRel.caution + '</span>' +
              '<span class="rel-pill accent-gold">牵挂 ' + npcRel.bond + '</span>' +
            '</div>' +
          '</div>' +
          '<div id="hall-chat-log" class="hall-chat-log">' + chatHtml + '</div>' +
          '<div class="hall-chat-prompts">' +
            '<button class="hall-prompt-chip" type="button" data-hall-prompt="我刚换完这一轮装备，你怎么评价我这套构筑的短板？">点评我的当前构筑</button>' +
            '<button class="hall-prompt-chip" type="button" data-hall-prompt="下一场考场你打算怎么打？有没有需要我兜底的环节？">试探下场战术分工</button>' +
            '<button class="hall-prompt-chip" type="button" data-hall-prompt="听说最近空间里其他队伍出了不少变故，你知道内情吗？">打听平行队伍暗流</button>' +
          '</div>' +
          '<form id="hall-chat-form" class="hall-chat-form">' +
            '<input id="hall-chat-input" type="text" placeholder="向 ' + esc(npc.name) + ' 自由发言、试探情报或约定战术分工…"' + (uiState.hallChatBusy ? ' disabled' : '') + '>' +
            '<button class="cta-crimson compact" type="submit"' + (uiState.hallChatBusy ? ' disabled' : '') + '>' + (uiState.hallChatBusy ? '推演中…' : '交谈') + '</button>' +
          '</form>' +
        '</div>' +
      '</div>';

    var logEl = $('hall-chat-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;

    if ($('btn-advance-radar')) {
      $('btn-advance-radar').addEventListener('click', function () {
        playSfx('ui_tick');
        if (INFINITY.Engine && typeof INFINITY.Engine.advanceWorldFeed === 'function') {
          INFINITY.Engine.advanceWorldFeed();
        }
        renderHallWorkspace(getStateSafe());
      });
    }

    if ($('hall-chat-form')) {
      $('hall-chat-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = $('hall-chat-input');
        var text = inp ? inp.value.trim() : '';
        if (!text || uiState.hallChatBusy) return;
        submitHallChat(npc.id, text);
      });
    }
  }

  function submitHallChat(npcId, text) {
    playSfx('ui_tick');
    uiState.hallChatBusy = true;
    uiState.hallChats[npcId] = uiState.hallChats[npcId] || [];
    uiState.hallChats[npcId].push({ role: 'player', text: text });
    renderHallWorkspace(getStateSafe());

    var p = (INFINITY.Engine && typeof INFINITY.Engine.talkInHall === 'function')
      ? INFINITY.Engine.talkInHall(npcId, text)
      : Promise.resolve({ ok: true, feedEntry: { line: '对方只是看了一眼你的腕表编号，并未多言。' } });

    Promise.resolve(p).then(function (res) {
      uiState.hallChatBusy = false;
      var entry = (res && (res.feedEntry || res.reply || res)) || {};
      var line = entry.line || entry.text || entry.reply || '对方微微颔首，将你的话记在了心里。';
      var deltas = (res && res.deltas) || {
        trustDelta: entry.trustDelta || 0,
        cautionDelta: entry.cautionDelta || 0,
        bondDelta: entry.bondDelta || 0
      };
      uiState.hallChats[npcId].push({ role: 'npc', text: line, deltas: deltas });
      renderAll(getStateSafe());
    }).catch(function () {
      uiState.hallChatBusy = false;
      showToast('大厅通讯暂时波动，请重试。', 'crimson');
      renderHallWorkspace(getStateSafe());
    });
  }

  /* --- Hall Tab 4: Training Room Sparring --- */

  function renderSparringView(container, state) {
    var p = getPlayer(state);
    var owned = getOwnedEntries(p);

    var itemBtns = owned.length
      ? owned.map(function (it) {
          return (
            '<button class="fusion-pick-btn" type="button" data-spar-id="' + esc(it.id) + '">' +
              '<span><span class="tier-badge tier-' + esc(it.tier) + '">' + esc(it.tier) + '</span> ' + esc(it.name) + '</span>' +
              '<span class="accent-cyan small">实测 →</span>' +
            '</button>'
          );
        }).join('')
      : '<div class="muted small">尚未装备任何能力或军械，请先前往深红商城兑换。</div>';

    var logHtml = uiState.sparringLog.length
      ? uiState.sparringLog.map(function (entry) {
          return '<div class="sparring-entry">' + esc(entry) + '</div>';
        }).join('')
      : '<div class="muted small">点击左侧任意已装备的血统、功法或武器，即可在全息训练靶场进行能耗、连招与控场实测。</div>';

    container.innerHTML =
      '<div class="sparring-grid">' +
        '<div class="fusion-panel">' +
          '<p class="eyebrow">HOLOGRAPHIC RANGE // 训练场实测</p>' +
          '<h3>选择待测武装</h3>' +
          '<div class="fusion-bloodline-list" style="max-height:390px;">' + itemBtns + '</div>' +
        '</div>' +
        '<div class="fusion-panel">' +
          '<p class="eyebrow">TELEMETRY LOG // 实测回放</p>' +
          '<h3>靶场反馈记录</h3>' +
          '<div class="sparring-log">' + logHtml + '</div>' +
        '</div>' +
      '</div>';
  }

  /* ===================== SCENE 2: 2.5D HD-2D REAL-TIME EXAM ===================== */

  function getExamObj(state) {
    return (state && state.exam) || {};
  }

  function formatClockMMSS(sec) {
    var s = Math.max(0, Math.floor(Number(sec) || 0));
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  function triggerClockGlitch() {
    var box = $('hud25d-clock-box');
    if (!box) return;
    box.classList.remove('glitch-crimson');
    // Force reflow to restart animation on rapid broadcasts
    void box.offsetWidth;
    box.classList.add('glitch-crimson');
    if (uiState.clockGlitchTimer) clearTimeout(uiState.clockGlitchTimer);
    uiState.clockGlitchTimer = setTimeout(function () {
      box.classList.remove('glitch-crimson');
      uiState.clockGlitchTimer = null;
    }, 360);
  }

  function buildMinimapBase() {
    var mapMod = INFINITY.StationMap;
    if (!mapMod || typeof mapMod.getGrid !== 'function') return null;
    var grid = mapMod.getGrid();
    if (!Array.isArray(grid) || !grid.length) return null;

    var W = mapMod.GRID_W || 56;
    var H = mapMod.GRID_H || 38;
    var scale = 4;
    var off = document.createElement('canvas');
    off.width = W * scale;
    off.height = H * scale;
    var ctx = off.getContext('2d');

    ctx.fillStyle = '#07080d';
    ctx.fillRect(0, 0, off.width, off.height);

    for (var z = 0; z < H; z++) {
      var row = grid[z];
      if (!row) continue;
      for (var x = 0; x < W; x++) {
        var tile = row[x];
        if (tile === 1) {
          ctx.fillStyle = '#2d3344';
        } else if (tile === 2) {
          ctx.fillStyle = '#212735';
        } else if (tile === 3) {
          ctx.fillStyle = '#6f5522';
        } else if (tile === 4) {
          ctx.fillStyle = '#140c10';
        } else {
          ctx.fillStyle = '#131722';
        }
        ctx.fillRect(x * scale, z * scale, scale, scale);
      }
    }

    // Subtle zone center labels
    if (mapMod.ZONES) {
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      Object.keys(mapMod.ZONES).forEach(function (zid) {
        var zn = mapMod.ZONES[zid];
        ctx.fillStyle = 'rgba(226, 212, 188, 0.34)';
        ctx.fillText(zn.code || zid, zn.cx * scale, zn.cz * scale);
      });
    }

    uiState.minimapBaseCanvas = off;
    return off;
  }

  function renderMinimap25D(snapshot) {
    var canvas = $('exam-minimap');
    if (!canvas || !snapshot || !snapshot.minimap) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var base = uiState.minimapBaseCanvas || buildMinimapBase();
    var scale = 4;
    if (base) {
      if (canvas.width !== base.width || canvas.height !== base.height) {
        canvas.width = base.width;
        canvas.height = base.height;
      }
      ctx.drawImage(base, 0, 0);
    } else {
      ctx.fillStyle = '#08090e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    var mm = snapshot.minimap;

    // 1. Active Wards
    if (Array.isArray(mm.wards)) {
      for (var w = 0; w < mm.wards.length; w++) {
        var ward = mm.wards[w];
        ctx.beginPath();
        ctx.arc(ward.x * scale, ward.z * scale, Math.max(4, (ward.r || 3) * scale), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(214, 178, 116, 0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(214, 178, 116, 0.72)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 2. Consoles (Dispatch + Substation)
    if (Array.isArray(mm.consoles)) {
      for (var c = 0; c < mm.consoles.length; c++) {
        var con = mm.consoles[c];
        var cx = con.x * scale;
        var cz = con.z * scale;
        ctx.fillStyle = con.done ? '#58c4a6' : '#d6b274';
        ctx.fillRect(cx - 3, cz - 3, 6, 6);
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 3, cz - 3, 6, 6);
      }
    }

    // 3. Exit Gate beacon on Platform 0 when ready
    if (mm.exitReady && INFINITY.StationMap && typeof INFINITY.StationMap.getInteractables === 'function') {
      var ints = INFINITY.StationMap.getInteractables() || [];
      for (var ei = 0; ei < ints.length; ei++) {
        if (ints[ei].type === 'exit') {
          var ex = ints[ei].x * scale;
          var ez = ints[ei].z * scale;
          var pulse = 4 + Math.sin(performance.now() * 0.008) * 2;
          ctx.beginPath();
          ctx.arc(ex, ez, pulse + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(88, 196, 166, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#84f5d5';
          ctx.fillRect(ex - 3, ez - 3, 6, 6);
        }
      }
    }

    // 4. Squad dots
    if (Array.isArray(mm.squad)) {
      for (var s = 0; s < mm.squad.length; s++) {
        var sq = mm.squad[s];
        ctx.beginPath();
        ctx.arc(sq.x * scale, sq.z * scale, 3, 0, Math.PI * 2);
        ctx.fillStyle = sq.color || '#6fd8ea';
        ctx.fill();
        ctx.strokeStyle = '#07080d';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 5. Inspector ping
    if (mm.inspector && mm.inspector.visible) {
      var ix = mm.inspector.x * scale;
      var iz = mm.inspector.z * scale;
      var ipulse = 5 + Math.sin(performance.now() * 0.012) * 2.5;
      ctx.beginPath();
      ctx.arc(ix, iz, ipulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(232, 93, 74, 0.85)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ix, iz, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5447';
      ctx.fill();
    }

    // 6. Player arrow/marker
    if (mm.player) {
      var px = mm.player.x * scale;
      var pz = mm.player.z * scale;
      ctx.beginPath();
      ctx.arc(px, pz, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 246, 224, 0.22)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, pz, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6e0';
      ctx.fill();
      ctx.strokeStyle = '#6fd8ea';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function renderHotbar25D(snapshot, state) {
    var hotbar = $('hud25d-hotbar');
    if (!hotbar) return;

    var slots = (snapshot && Array.isArray(snapshot.slots)) ? snapshot.slots : [];
    var basic = { name: '近战/射击', icon: '⚔', color: '#d6b274' };
    if (INFINITY.Skills25D && typeof INFINITY.Skills25D.buildCombatLoadout === 'function') {
      try {
        var lo = INFINITY.Skills25D.buildCombatLoadout(getPlayer(state));
        if (lo && lo.basicAttack) {
          basic = {
            name: lo.basicAttack.name || '基础攻击',
            icon: lo.basicAttack.icon || '⚔',
            color: lo.basicAttack.color || '#d6b274'
          };
        }
      } catch (_) {}
    }

    var sig = basic.name + '|' + slots.map(function (sl) { return (sl.key || sl.index) + ':' + (sl.name || ''); }).join('|');
    if (uiState.hotbarSig !== sig) {
      uiState.hotbarSig = sig;
      var html =
        '<button class="hotbar-slot lmb-slot" type="button" data-lmb-hint="1" title="鼠标左键瞄准普攻">' +
          '<div class="hotbar-top"><span class="hotbar-key">LMB</span><span class="hotbar-cost">普攻</span></div>' +
          '<div class="hotbar-mid"><span class="hotbar-icon">' + esc(basic.icon) + '</span><span class="hotbar-name">' + esc(basic.name) + '</span></div>' +
          '<div class="hotbar-accent-bar" style="background:' + esc(basic.color) + ';"></div>' +
        '</button>';

      for (var i = 0; i < 4; i++) {
        var sl = slots[i] || { index: i, key: String(i + 1), name: '空槽位', icon: '◇', color: '#6fd8ea', energyCost: 0 };
        html +=
          '<button class="hotbar-slot" type="button" data-cast-slot="' + i + '" id="hotbar-slot-' + i + '" title="' + esc(sl.name || '') + ' (能耗 ' + (sl.energyCost || 0) + ')">' +
            '<div class="hotbar-top">' +
              '<span class="hotbar-key">' + esc(sl.key || String(i + 1)) + '</span>' +
              '<span class="hotbar-cost">' + (sl.energyCost ? ('EN ' + Math.round(sl.energyCost)) : '免费') + '</span>' +
            '</div>' +
            '<div class="hotbar-mid">' +
              '<span class="hotbar-icon">' + esc(sl.icon || '✦') + '</span>' +
              '<span class="hotbar-name">' + esc(sl.name || '技能') + '</span>' +
            '</div>' +
            '<div class="hotbar-accent-bar" style="background:' + esc(sl.color || '#6fd8ea') + ';"></div>' +
            '<div class="hotbar-cd-mask" id="hotbar-cd-mask-' + i + '"></div>' +
            '<div class="hotbar-cd-text hidden" id="hotbar-cd-text-' + i + '"></div>' +
          '</button>';
      }
      hotbar.innerHTML = html;
    }

    // Fast 10Hz cooldown & energy update without destroying click targets
    var curEn = snapshot && snapshot.energy != null ? Number(snapshot.energy) : 100;
    for (var j = 0; j < 4; j++) {
      var s = slots[j];
      var btn = $('hotbar-slot-' + j);
      var mask = $('hotbar-cd-mask-' + j);
      var txt = $('hotbar-cd-text-' + j);
      if (!btn || !s) continue;
      var cdLeft = Math.max(0, Number(s.cooldownLeft) || 0);
      var cdMax = Math.max(0.1, Number(s.cooldownMax) || 1);
      var onCd = cdLeft > 0.05;
      var lowEn = curEn < (Number(s.energyCost) || 0);
      btn.classList.toggle('on-cd', onCd);
      btn.classList.toggle('no-energy', !onCd && lowEn);
      if (mask) {
        mask.style.height = onCd ? (clamp((cdLeft / cdMax) * 100, 0, 100).toFixed(1) + '%') : '0%';
      }
      if (txt) {
        txt.classList.toggle('hidden', !onCd);
        if (onCd) txt.textContent = cdLeft >= 10 ? String(Math.ceil(cdLeft)) : cdLeft.toFixed(1) + 's';
      }
    }
  }

  function renderSquad25D(snapshot) {
    var listEl = $('hud25d-squad-list');
    if (!listEl || !snapshot || !Array.isArray(snapshot.squad)) return;

    listEl.innerHTML = snapshot.squad.map(function (m) {
      var hpPct = clamp(((Number(m.hp) || 0) / Math.max(1, Number(m.maxHp) || 100)) * 100, 0, 100);
      var alive = m.alive !== false && hpPct > 0;
      return (
        '<button class="hud25d-sq-row' + (alive ? '' : ' downed') + '" type="button" data-radio-target="' + esc(m.name) + '" title="点击呼叫 ' + esc(m.name) + '">' +
          '<div class="hud25d-sq-top">' +
            '<span class="hud25d-sq-name"><span class="cast-dot" style="background:' + esc(m.accentColor || '#6fd8ea') + ';"></span>' + esc(m.name) + '</span>' +
            '<span class="hud25d-sq-zone">' + esc(m.zoneName || '回廊') + '</span>' +
          '</div>' +
          '<div class="hud25d-sq-bottom">' +
            '<div class="hud25d-sq-hp-track"><div class="hud25d-sq-hp-fill' + (hpPct < 35 ? ' low' : '') + '" style="width:' + hpPct.toFixed(0) + '%"></div></div>' +
            '<span class="hud25d-sq-order">' + esc(alive ? (m.orderLabel || '待命') : '失联') + '</span>' +
          '</div>' +
        '</button>'
      );
    }).join('');
  }

  function pushRadioEntry(entry) {
    if (!entry) return;
    uiState.radioLog.push(entry);
    if (uiState.radioLog.length > 40) {
      uiState.radioLog.shift();
    }
    renderRadioLog25D();
  }

  function renderRadioLog25D() {
    var el = $('hud25d-radio-log');
    if (!el) return;
    var cast = getCast();

    el.innerHTML = uiState.radioLog.map(function (item) {
      var kind = item.type || 'system';
      if (kind === 'player') {
        return '<div class="radio-entry player">▸ ' + esc(item.text) + '</div>';
      }
      if (kind === 'broadcast') {
        return (
          '<div class="radio-entry broadcast' + (item.fake ? ' fake' : '') + '">' +
            '<strong>' + (item.fake ? '[伪造播报]' : '[站台广播]') + '</strong> ' + esc(item.text) +
          '</div>'
        );
      }
      if (kind === 'order') {
        return '<div class="radio-entry order">▸ ' + esc(item.text) + '</div>';
      }
      if (kind === 'spark') {
        return '<div class="radio-entry spark">✦ ' + esc(item.text) + '</div>';
      }
      if (kind === 'dialogue') {
        var npc = cast[item.npcId] || { name: item.speaker || item.npcId || '队友', accentColor: '#6fd8ea' };
        var badges = [];
        if (item.trustDelta) badges.push('<span class="delta-badge ' + (item.trustDelta > 0 ? 'delta-pos' : 'delta-neg') + '">信' + (item.trustDelta > 0 ? '+' : '') + item.trustDelta + '</span>');
        if (item.cautionDelta) badges.push('<span class="delta-badge ' + (item.cautionDelta < 0 ? 'delta-pos' : 'delta-neg') + '">戒' + (item.cautionDelta > 0 ? '+' : '') + item.cautionDelta + '</span>');
        if (item.bondDelta) badges.push('<span class="delta-badge delta-gold">绊+' + item.bondDelta + '</span>');
        return (
          '<div class="radio-entry dialogue" style="border-left-color:' + esc(npc.accentColor || '#6fd8ea') + ';">' +
            '<div class="radio-entry-head">' +
              '<span class="radio-speaker" style="color:' + esc(npc.accentColor || '#6fd8ea') + ';">' + esc(npc.name) + '</span>' +
              (badges.length ? '<div class="delta-badges">' + badges.join('') + '</div>' : '') +
            '</div>' +
            '<div>' + esc(item.text) + '</div>' +
          '</div>'
        );
      }
      return '<div class="radio-entry system">' + esc(item.text) + '</div>';
    }).join('');

    el.scrollTop = el.scrollHeight;
  }

  function handleWorld25DHudTick(snapshot) {
    if (!snapshot || uiState.currentScene !== 'exam') return;
    uiState.lastSnapshot = snapshot;

    // 1. Sync top wristwatch bar vitals at 10Hz
    var hp = Number(snapshot.hp != null ? snapshot.hp : 100);
    var maxHp = Math.max(1, Number(snapshot.maxHp || 100));
    var en = Number(snapshot.energy != null ? snapshot.energy : 100);
    var maxEn = Math.max(1, Number(snapshot.maxEnergy || 100));
    var san = Number(snapshot.sanity != null ? snapshot.sanity : 100);
    var maxSan = Math.max(1, Number(snapshot.maxSanity || 100));

    if ($('bar-hp')) $('bar-hp').style.width = clamp((hp / maxHp) * 100, 0, 100) + '%';
    if ($('val-hp')) $('val-hp').textContent = Math.round(hp);
    if ($('bar-en')) $('bar-en').style.width = clamp((en / maxEn) * 100, 0, 100) + '%';
    if ($('val-en')) $('val-en').textContent = Math.round(en);
    if ($('bar-san')) $('bar-san').style.width = clamp((san / maxSan) * 100, 0, 100) + '%';
    if ($('val-san')) $('val-san').textContent = Math.round(san);

    // Keep state.exam.cluesFound synced silently so Clues Modal reflects 2.5D discoveries live
    var st = getStateSafe();
    if (st && st.exam && Array.isArray(snapshot.discoveredClueIds)) {
      st.exam.cluesFound = snapshot.discoveredClueIds.slice();
    }

    // 2. Top-Left Objective Tracker & Zone
    if ($('hud25d-zone-code')) $('hud25d-zone-code').textContent = snapshot.zoneCode || 'Z-01';
    if ($('hud25d-zone-name')) $('hud25d-zone-name').textContent = snapshot.zoneName || '零号回廊';
    if ($('hud25d-clock-val')) $('hud25d-clock-val').textContent = formatClockMMSS(snapshot.timeRemainingSec);

    var trainEl = $('hud25d-train-val');
    if (trainEl) {
      trainEl.textContent = snapshot.trainInStation ? '进站停靠!' : formatClockMMSS(snapshot.trainCountdownSec);
      trainEl.classList.toggle('train-hot', Boolean(snapshot.trainInStation) || Number(snapshot.trainCountdownSec) <= 15);
    }

    if ($('hud25d-threat-val')) {
      $('hud25d-threat-val').textContent = Math.round(Number(snapshot.soundLevel || 0)) + ' / ' + Math.round(Number(snapshot.threatLevel || 0));
    }

    var ovPct = clamp(Number(snapshot.overridePct || 0), 0, 100);
    if ($('hud25d-override-pct')) $('hud25d-override-pct').textContent = Math.round(ovPct) + '%';
    if ($('hud25d-override-bar')) $('hud25d-override-bar').style.width = ovPct + '%';
    if ($('hud25d-obj-override')) $('hud25d-obj-override').classList.toggle('done', ovPct >= 100);

    var insp = snapshot.inspector || { hp: 160, maxHp: 160, sealedPct: 0, state: 'patrol', distToPlayer: 30 };
    var inspHp = Math.max(0, Math.round(Number(insp.hp || 0)));
    var inspMaxHp = Math.max(1, Number(insp.maxHp || 160));
    var sealedPct = clamp(Math.round(Number(insp.sealedPct || 0)), 0, 100);
    var inspDone = inspHp <= 0 || sealedPct >= 100;

    if ($('hud25d-inspector-metric')) {
      $('hud25d-inspector-metric').textContent = inspHp <= 0
        ? '已击杀'
        : (sealedPct >= 100 ? '已封印' : ('HP ' + inspHp + ' · 封 ' + sealedPct + '%'));
    }
    if ($('hud25d-inspector-bar')) {
      $('hud25d-inspector-bar').style.width = (inspDone ? 0 : clamp((inspHp / inspMaxHp) * 100, 0, 100)) + '%';
    }
    if ($('hud25d-obj-inspector')) $('hud25d-obj-inspector').classList.toggle('done', inspDone);

    if ($('hud25d-clues-val')) {
      $('hud25d-clues-val').textContent = (snapshot.cluesFoundCount || 0) + '/' + (snapshot.cluesTotal || 6);
    }

    var inspStatusEl = $('hud25d-inspector-status');
    if (inspStatusEl) {
      var stateLabels = {
        patrol: '巡逻中',
        investigate: '循声搜查',
        chase: '追猎锁定!',
        stunned: '僵直受制',
        sealed: '已封印',
        defeated: '已击杀'
      };
      var distTxt = isFinite(Number(insp.distToPlayer)) ? (Math.round(Number(insp.distToPlayer)) + 'm') : '--m';
      inspStatusEl.textContent = inspDone
        ? '检票员：已肃清'
        : ('检票员：' + (stateLabels[insp.state] || insp.state || '巡逻中') + ' · ' + distTxt);
      inspStatusEl.classList.toggle('danger', !inspDone && (insp.state === 'chase' || Number(insp.distToPlayer) <= 10));
      inspStatusEl.classList.toggle('neutralized', inspDone);
    }

    // 3. Top-Right Exit badge + 2D Minimap + Squad strip
    var exitReady = Boolean((snapshot.minimap && snapshot.minimap.exitReady) || ovPct >= 100);
    var exitBadge = $('hud25d-exit-badge');
    if (exitBadge) {
      exitBadge.textContent = exitReady ? '0号站台可撤离' : '出口锁定';
      exitBadge.classList.toggle('ready', exitReady);
    }
    renderMinimap25D(snapshot);
    renderSquad25D(snapshot);

    // 4. Bottom-Center Contextual [E] Interact, [Space] Bullet-Time & Skill Hotbar
    var intPill = $('hud25d-interact-pill');
    var intLbl = $('hud25d-interact-label');
    var intProg = $('hud25d-interact-prog');
    if (intPill) {
      var near = snapshot.nearbyInteractable;
      if (near && near.label) {
        intPill.classList.remove('hidden');
        if (intLbl) intLbl.textContent = near.label;
        if (intProg) {
          var prog = Number(near.progress || 0);
          intProg.classList.toggle('hidden', !(prog > 0.01 && prog < 1));
          if (prog > 0.01 && prog < 1) intProg.textContent = Math.round(prog * 100) + '%';
        }
      } else {
        intPill.classList.add('hidden');
      }
    }

    var slowActive = Boolean(snapshot.slowMo);
    var slowPill = $('hud25d-slowmo-pill');
    var slowLbl = $('hud25d-slowmo-label');
    var slowFrame = $('exam-slowmo-frame');
    if (slowPill) slowPill.classList.toggle('active', slowActive || uiState.radioFocused);
    if (slowLbl) slowLbl.textContent = slowActive ? '子弹时间：开启' : (uiState.radioFocused ? '无线电缓速' : '子弹时间：关');
    if (slowFrame) slowFrame.classList.toggle('hidden', !(slowActive || uiState.radioFocused));

    renderHotbar25D(snapshot, st);

    // 5. Dynamic audio threat level sync
    var threatRounded = Math.round(Number(snapshot.threatLevel || 0) / 5) * 5;
    if (threatRounded !== uiState.lastAudioThreat && INFINITY.Audio) {
      uiState.lastAudioThreat = threatRounded;
      if (typeof INFINITY.Audio.setThreatLevel === 'function') {
        INFINITY.Audio.setThreatLevel(threatRounded);
      }
      if (typeof INFINITY.Audio.setScene === 'function') {
        INFINITY.Audio.setScene(threatRounded >= 50 ? 'station_tense' : 'station_calm');
      }
    }
  }

  function handleWorld25DRadioEvent(entry) {
    if (!entry) return;
    if (entry.timeGlitch || (entry.type === 'broadcast' && entry.fake)) {
      triggerClockGlitch();
      playSfx('broadcast_static');
    } else if (entry.type === 'broadcast') {
      playSfx('broadcast_static');
    } else if (entry.type === 'spark') {
      playSfx('ui_tick');
    }
    pushRadioEntry(entry);
  }

  function setRadioFocused(focused) {
    uiState.radioFocused = Boolean(focused);
    var panel = $('hud25d-radio-panel');
    var modeEl = $('hud25d-radio-mode');
    var slowFrame = $('exam-slowmo-frame');
    if (panel) panel.classList.toggle('radio-active', uiState.radioFocused);
    if (modeEl) modeEl.textContent = uiState.radioFocused ? '时间缓速 · Enter 发送 / Esc 返回' : '按 Enter 呼叫小队';
    if (slowFrame && !(uiState.lastSnapshot && uiState.lastSnapshot.slowMo)) {
      slowFrame.classList.toggle('hidden', !uiState.radioFocused);
    }
    if (INFINITY.World25D && typeof INFINITY.World25D.setInputPaused === 'function') {
      INFINITY.World25D.setInputPaused(uiState.radioFocused);
    }
  }

  function applyLiveRadioRelationships(dialogues) {
    var st = getStateSafe();
    if (!st || !st.relationships || !Array.isArray(dialogues)) return;
    var changed = false;
    for (var i = 0; i < dialogues.length; i++) {
      var d = dialogues[i];
      if (!d || !d.npcId) continue;
      var rel = st.relationships[d.npcId];
      if (!rel) continue;
      var td = Number(d.trustDelta) || 0;
      var cd = Number(d.cautionDelta) || 0;
      var bd = Number(d.bondDelta) || 0;
      if (td || cd || bd) {
        rel.trust = clamp((rel.trust != null ? rel.trust : 35) + td, 0, 100);
        rel.caution = clamp((rel.caution != null ? rel.caution : 50) + cd, 0, 100);
        rel.bond = clamp((rel.bond != null ? rel.bond : 15) + bd, 0, 100);
        rel.interactions = (rel.interactions || 0) + 1;
        changed = true;
      }
    }
    if (changed && INFINITY.Engine && typeof INFINITY.Engine.save === 'function') {
      INFINITY.Engine.save();
    }
  }

  function submitLiveRadio(text) {
    var clean = String(text || '').trim();
    if (!clean || uiState.radioBusy) return;

    playSfx('ui_tick');
    uiState.radioBusy = true;
    pushRadioEntry({ type: 'player', text: clean });

    var thinking = $('hud25d-radio-thinking');
    var sendBtn = $('hud25d-radio-send');
    if (thinking) thinking.classList.remove('hidden');
    if (sendBtn) sendBtn.disabled = true;

    var st = getStateSafe();
    var snap = (INFINITY.World25D && typeof INFINITY.World25D.getSnapshot === 'function' && INFINITY.World25D.getSnapshot()) || uiState.lastSnapshot || {};
    var recent = uiState.radioLog.slice(-6).map(function (r) {
      return { type: r.type, npcId: r.npcId || null, text: r.text };
    });

    var aiCall = (INFINITY.AI && typeof INFINITY.AI.handleLiveRadio === 'function')
      ? INFINITY.AI.handleLiveRadio({
          text: clean,
          snapshot: snap,
          player: getPlayer(st),
          relationships: getRelMap(st),
          recentRadio: recent
        })
      : Promise.resolve({
          replyNpcId: 'yanci',
          dialogues: [{ npcId: 'yanci', line: '“短波在线，收到。”', trustDelta: 1, cautionDelta: 0, bondDelta: 0 }],
          squadOrders: []
        });

    Promise.resolve(aiCall).then(function (res) {
      uiState.radioBusy = false;
      if (thinking) thinking.classList.add('hidden');
      if (sendBtn) sendBtn.disabled = false;
      if (!res || uiState.currentScene !== 'exam') return;

      if (res.narration) {
        pushRadioEntry({ type: 'system', text: res.narration });
      }

      var bubbleMap = {};
      if (Array.isArray(res.dialogues)) {
        applyLiveRadioRelationships(res.dialogues);
        for (var i = 0; i < res.dialogues.length; i++) {
          var d = res.dialogues[i];
          if (!d || !d.line) continue;
          bubbleMap[d.npcId] = d.line;
          pushRadioEntry({
            type: 'dialogue',
            npcId: d.npcId,
            text: d.line,
            trustDelta: d.trustDelta || 0,
            cautionDelta: d.cautionDelta || 0,
            bondDelta: d.bondDelta || 0
          });
          if (INFINITY.World25D && typeof INFINITY.World25D.showSpeechBubble === 'function') {
            INFINITY.World25D.showSpeechBubble(d.npcId, d.line);
          }
        }
      }

      if (Array.isArray(res.squadOrders) && res.squadOrders.length > 0) {
        var ordersPayload = res.squadOrders.map(function (o) {
          return {
            npcId: o.npcId,
            order: o.order,
            label: o.label,
            bubble: bubbleMap[o.npcId] || undefined
          };
        });
        if (INFINITY.World25D && typeof INFINITY.World25D.applySquadOrders === 'function') {
          INFINITY.World25D.applySquadOrders(ordersPayload);
        }
        var cast = getCast();
        var summary = ordersPayload.map(function (o) {
          var cname = (cast[o.npcId] && cast[o.npcId].name) || o.npcId;
          return cname + ' → ' + (o.label || o.order);
        }).join(' · ');
        pushRadioEntry({ type: 'order', text: '战术指令：' + summary });
        playSfx('ui_tick');
      }

      if (res.sparkNote) {
        pushRadioEntry({ type: 'spark', text: res.sparkNote });
        if (st && st.exam && Array.isArray(st.exam.sparkNotes)) {
          st.exam.sparkNotes.push(res.sparkNote);
        }
      }
    }).catch(function () {
      uiState.radioBusy = false;
      if (thinking) thinking.classList.add('hidden');
      if (sendBtn) sendBtn.disabled = false;
      pushRadioEntry({ type: 'system', text: '短波杂音干扰，请重新呼叫。' });
    });
  }

  function handleExam25DEnd(endingType, stats) {
    if (uiState.examEnded) return;
    uiState.examEnded = true;
    unmountWorld25DIfNeeded();

    var st = getStateSafe();
    var snap = uiState.lastSnapshot || {};
    var endStats = stats || {};

    // Sync 2.5D discoveries & vitals back into deterministic Rule Engine state before settlement
    if (st && st.player) {
      if (endStats.hp != null || snap.hp != null) {
        st.player.hp = clamp(Math.round(Number(endStats.hp != null ? endStats.hp : snap.hp)), 0, st.player.maxHp || 100);
      }
      if (endStats.energy != null || snap.energy != null) {
        st.player.energy = clamp(Math.round(Number(endStats.energy != null ? endStats.energy : snap.energy)), 0, st.player.maxEnergy || 100);
      }
      if (endStats.sanity != null || snap.sanity != null) {
        st.player.sanity = clamp(Math.round(Number(endStats.sanity != null ? endStats.sanity : snap.sanity)), 0, st.player.maxSanity || 100);
      }
    }
    if (st && st.exam) {
      var foundIds = Array.isArray(endStats.discoveredClueIds)
        ? endStats.discoveredClueIds
        : (Array.isArray(snap.discoveredClueIds) ? snap.discoveredClueIds : []);
      if (foundIds.length) {
        st.exam.cluesFound = foundIds.slice();
      }
    }

    var mappedEnding = 'manual';
    var customMeta = {
      perfect_override: {
        mapped: 'true_break',
        title: '轨控改写 · 真破局撤离',
        summary: '你与原创小队联动信号调度室与旧变电间完成了100%轨控改写，在零号列车第三次鸣笛前切出幽灵环线，全员从0号站台成功脱出！'
      },
      kill_inspector: {
        mapped: 'true_break',
        title: '斩断规则 · 肃清零号检票员',
        summary: '你们正面击溃或彻底封印了无面规则体【零号检票员】，强行撕开了零号回廊的封闭闭环，以压倒性战绩结束本场死考！'
      },
      forced_board_survive: {
        mapped: 'tactical_extract',
        title: '强行登车 · 险象撤离',
        summary: '未能在轨控改写完成前脱身，你在高压追猎下强行卡着门缝登车撤离，带回了部分站台情报并保住了性命。'
      },
      wipeout: {
        mapped: 'fallen',
        title: '体征归零 · 空间紧急拉回',
        summary: '你在零号回廊的高烈度规则猎杀中力竭倒下，腕表触发紧急拉回程序并扣除了高额空间修复费。'
      }
    }[endingType] || null;

    if (customMeta) {
      mappedEnding = customMeta.mapped;
    }

    if (INFINITY.Engine && typeof INFINITY.Engine.extractFromScenario === 'function') {
      INFINITY.Engine.extractFromScenario(mappedEnding);
      var postState = getStateSafe();
      if (postState && postState.lastSettlement && customMeta) {
        postState.lastSettlement.endingType = endingType;
        postState.lastSettlement.endingTitle = customMeta.title;
        postState.lastSettlement.endingLabel = customMeta.title;
        postState.lastSettlement.summary = customMeta.summary;
        postState.lastSettlement.overridePct = Math.round(Number(endStats.overridePct != null ? endStats.overridePct : (snap.overridePct || 0)));
        if (typeof INFINITY.Engine.save === 'function') {
          INFINITY.Engine.save();
        }
      }
    }

    playSfx(endingType === 'wipeout' ? 'alert' : 'vortex_buy');
    renderAll(getStateSafe());
  }

  function mountExam25DScene(state) {
    var viewport = $('exam-25d-viewport');
    if (!viewport) return;

    unmountWorld25DIfNeeded();
    uiState.examEnded = false;
    uiState.radioBusy = false;
    uiState.radioFocused = false;
    uiState.lastSnapshot = null;
    uiState.hotbarSig = '';
    uiState.lastAudioThreat = -1;
    uiState.radioLog = [
      {
        type: 'system',
        text: '已接入《零号回廊 · 停摆站台》2.5D 实景。WASD 移动，左键瞄准普攻，1-4 释放构筑技能，接近线索/控制台按 E，按 Enter 实时呼叫小队下令。'
      }
    ];
    renderRadioLog25D();
    setRadioFocused(false);

    if (INFINITY.World25D && typeof INFINITY.World25D.mount === 'function') {
      uiState.world25dMounted = true;
      INFINITY.World25D.mount(viewport, state, {
        onHudTick: handleWorld25DHudTick,
        onRadioEvent: handleWorld25DRadioEvent,
        onExamEnd: handleExam25DEnd
      });
      var initialSnap = typeof INFINITY.World25D.getSnapshot === 'function' ? INFINITY.World25D.getSnapshot() : null;
      if (initialSnap) {
        handleWorld25DHudTick(initialSnap);
      }
    } else {
      pushRadioEntry({ type: 'system', text: '2.5D 实景引擎模块尚未就绪，请刷新重试。' });
    }
  }

  function renderExamConsole(state) {
    // 2.5D HUD is driven at ~10Hz via World25D onHudTick; ensure mount & keep hotbar ready
    if (!uiState.world25dMounted) {
      mountExam25DScene(state);
    } else if (uiState.lastSnapshot) {
      renderHotbar25D(uiState.lastSnapshot, state);
    }
  }

  /* ===================== CRISIS REACTION WINDOW ===================== */

  function stopCrisisTimer() {
    if (uiState.crisisTimerId) {
      clearInterval(uiState.crisisTimerId);
      uiState.crisisTimerId = null;
    }
    uiState.crisisActiveKey = null;
  }

  function syncCrisisOverlay(state) {
    var overlay = $('crisis-overlay');
    if (!overlay) return;
    var exam = getExamObj(state);
    var crisis = exam.activeCrisis;

    if (!crisis || getSceneName(state) !== 'exam') {
      overlay.classList.add('hidden');
      stopCrisisTimer();
      return;
    }

    overlay.classList.remove('hidden');
    var key = (crisis.id || crisis.title || 'crisis') + '::' + (crisis.startedAt || crisis.countdownSec || '');
    if (uiState.crisisActiveKey === key) return;

    stopCrisisTimer();
    uiState.crisisActiveKey = key;
    playSfx('crisis_freeze');
    if (INFINITY.Canvas) INFINITY.Canvas.triggerShake(10);

    if ($('crisis-title')) $('crisis-title').textContent = crisis.title || '致命危机窗口';
    if ($('crisis-threat-text')) $('crisis-threat-text').textContent = crisis.threatText || crisis.desc || '检票员的冷白探灯已锁定你的位置！';

    // Build skill-based counter buttons
    var btnWrap = $('crisis-counter-buttons');
    if (btnWrap) {
      var suggestions = Array.isArray(crisis.suggestedCounters) ? crisis.suggestedCounters.slice() : [];
      var owned = getOwnedEntries(getPlayer(state));
      owned.slice(0, 3).forEach(function (it) {
        if (it.activeSkill && it.activeSkill.role !== 'passive') {
          suggestions.push({
            label: '瞬发【' + it.name + '】反制',
            tag: it.tier + '级武装',
            payload: '立即动用【' + it.name + '】截断危机'
          });
        }
      });
      if (!suggestions.length) {
        suggestions.push({ label: '低姿翻滚脱离黄线并屏息', tag: '紧急规避', payload: '低姿翻滚脱离黄线并屏息' });
      }
      btnWrap.innerHTML = suggestions.slice(0, 4).map(function (c, idx) {
        var label = typeof c === 'string' ? c : (c.label || c.text || ('应对方案 ' + (idx + 1)));
        var payload = typeof c === 'string' ? c : (c.payload || c.id || label);
        var tag = typeof c === 'object' && c.tag ? c.tag : '瞬时应对';
        return '<button class="crisis-choice-btn" type="button" data-crisis-choice="' + esc(payload) + '"><span>' + esc(label) + '</span><span class="mono small accent-gold">' + esc(tag) + '</span></button>';
      }).join('');
    }

    var totalSec = Number(crisis.countdownSec || 8);
    uiState.crisisTotalSec = totalSec;
    uiState.crisisDeadline = performance.now() + totalSec * 1000;
    var circumference = 213.63;

    uiState.crisisTimerId = setInterval(function () {
      var remainMs = Math.max(0, uiState.crisisDeadline - performance.now());
      var remainSec = remainMs / 1000;
      if ($('crisis-timer-text')) $('crisis-timer-text').textContent = remainSec.toFixed(1) + 's';
      var ring = $('crisis-ring-fg');
      if (ring) {
        var frac = clamp(remainSec / uiState.crisisTotalSec, 0, 1);
        ring.style.strokeDashoffset = String(circumference * (1 - frac));
      }
      if (remainMs <= 0) {
        resolveCrisisChoice('timeout');
      }
    }, 80);
  }

  function resolveCrisisChoice(choiceOrText) {
    stopCrisisTimer();
    if ($('crisis-overlay')) $('crisis-overlay').classList.add('hidden');
    if (!INFINITY.Engine || typeof INFINITY.Engine.resolveCrisis !== 'function') return;
    playSfx('blade_ring');
    Promise.resolve(INFINITY.Engine.resolveCrisis(choiceOrText)).then(function () {
      renderAll(getStateSafe());
    });
  }

  /* ===================== SCENE 3: SETTLEMENT ===================== */

  function renderSettlement(state) {
    var container = $('settlement-container');
    if (!container) return;
    var s = state.lastSettlement || state.settlement || {};
    var grade = s.grade || 'B';
    var earned = s.pointsReward != null
      ? s.pointsReward
      : (s.pointsAwarded != null ? s.pointsAwarded : (s.pointsEarned != null ? s.pointsEarned : (s.rewardPoints || 120)));
    var endingTitle = s.endingTitle || s.endingLabel || s.title || '《零号回廊 · 停摆站台》结算完成';
    var summary = s.summary || s.epilogue || '你们在零号列车第三次鸣笛前改写了死局，活着回到了深红漩涡大厅。';
    var cluesTotal = s.cluesFoundCount != null ? s.cluesFoundCount : (s.cluesFound != null ? s.cluesFound : 0);

    container.innerHTML =
      '<div class="settlement-card">' +
        '<div class="settlement-hero">' +
          '<div>' +
            '<p class="eyebrow crimson">EXAM SETTLEMENT // 死考终局评级</p>' +
            '<h1 class="scene-title">' + esc(endingTitle) + '</h1>' +
            '<p class="item-desc" style="margin-top:8px;">' + esc(summary) + '</p>' +
          '</div>' +
          '<div class="grade-stamp">' + esc(grade) + '</div>' +
        '</div>' +
        '<div class="settlement-grid">' +
          '<div class="settlement-stat"><span class="tele-k">本次结算积分</span><div class="mono accent-gold" style="font-size:22px;font-weight:700;">+' + earned + ' pts</div></div>' +
          '<div class="settlement-stat"><span class="tele-k">破译线索数</span><div class="mono accent-cyan" style="font-size:22px;font-weight:700;">' + cluesTotal + '</div></div>' +
          '<div class="settlement-stat"><span class="tele-k">当前权限等级</span><div class="mono accent-emerald" style="font-size:22px;font-weight:700;">' + esc((getPlayer(state).permission || 'C') + ' 级') + '</div></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
          '<button id="btn-return-hall" class="cta-crimson compact" type="button">返回深红漩涡大厅 →</button>' +
        '</div>' +
      '</div>';

    if ($('btn-return-hall')) {
      $('btn-return-hall').addEventListener('click', function () {
        playSfx('vortex_buy');
        if (INFINITY.Engine && typeof INFINITY.Engine.returnToHall === 'function') {
          INFINITY.Engine.returnToHall();
        } else {
          var st = getStateSafe();
          st.scene = 'hall';
        }
        renderAll(getStateSafe());
      });
    }
  }

  /* ===================== MODALS: DEEPSEEK CONFIG & CLUES ===================== */

  function isAnyModalOpen() {
    var aiM = $('ai-config-modal');
    var clM = $('clues-modal');
    return Boolean((aiM && !aiM.classList.contains('hidden')) || (clM && !clM.classList.contains('hidden')));
  }

  function syncModalPause25D() {
    if (uiState.currentScene !== 'exam' || !INFINITY.World25D || typeof INFINITY.World25D.setInputPaused !== 'function') return;
    INFINITY.World25D.setInputPaused(isAnyModalOpen() || uiState.radioFocused);
  }

  function openAiModal() {
    var modal = $('ai-config-modal');
    if (!modal) return;
    var ai = INFINITY.AI;
    var cfg = ai && typeof ai.getConfig === 'function' ? ai.getConfig() : { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', apiKey: '', enabled: true };
    var presets = (ai && ai.PRESETS) || {
      deepseek: { label: 'DeepSeek (推荐)', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
      deepseek_r1: { label: 'DeepSeek Reasoner', baseUrl: 'https://api.deepseek.com', model: 'deepseek-reasoner' },
      openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      ollama: { label: '本地 Ollama', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5:14b' }
    };

    var pillsEl = $('ai-preset-pills');
    if (pillsEl) {
      pillsEl.innerHTML = Object.keys(presets).map(function (key) {
        var pr = presets[key];
        return '<button class="preset-pill' + (cfg.provider === key ? ' active' : '') + '" type="button" data-ai-preset="' + esc(key) + '">' + esc(pr.label) + '</button>';
      }).join('');
    }

    if ($('ai-base-url')) $('ai-base-url').value = cfg.baseUrl || '';
    if ($('ai-model')) $('ai-model').value = cfg.model || '';
    if ($('ai-api-key')) {
      $('ai-api-key').value = cfg.apiKey || '';
      $('ai-api-key').type = 'password';
    }
    if ($('btn-toggle-key-vis')) $('btn-toggle-key-vis').textContent = '显示';
    if ($('ai-enabled')) $('ai-enabled').checked = cfg.enabled !== false;
    if ($('ai-test-result')) $('ai-test-result').classList.add('hidden');

    modal.classList.remove('hidden');
    syncModalPause25D();
  }

  function openCluesModal() {
    var modal = $('clues-modal');
    var body = $('clues-modal-body');
    if (!modal || !body) return;
    var state = getStateSafe();
    var exam = getExamObj(state);
    var unlocked = (uiState.lastSnapshot && Array.isArray(uiState.lastSnapshot.discoveredClueIds))
      ? uiState.lastSnapshot.discoveredClueIds
      : (Array.isArray(exam.cluesFound) ? exam.cluesFound : (Array.isArray(exam.unlockedClues) ? exam.unlockedClues : (Array.isArray(exam.clues) ? exam.clues : [])));
    var scenario = getScenario();
    var allClues = (scenario && scenario.clues) || [];

    var matched = allClues.filter(function (c) { return unlocked.indexOf(c.id) !== -1; });
    if (!matched.length) {
      body.innerHTML = '<div class="muted small">尚未破译任何关键线索。在 2.5D 站台中靠近发光物证并按 E 即可破译收集。</div>';
    } else {
      body.innerHTML = matched.map(function (c) {
        return (
          '<div class="clue-card">' +
            '<div style="font-weight:600;margin-bottom:4px;">' + esc(c.title) + ' <span class="mono small muted">' + esc(c.id) + '</span></div>' +
            '<div class="small" style="color:var(--text-secondary);">' + esc(c.summary) + '</div>' +
          '</div>'
        );
      }).join('');
    }
    modal.classList.remove('hidden');
    syncModalPause25D();
  }

  /* ===================== MASTER RENDER & EVENT WIRING ===================== */

  function renderAll(state) {
    var st = state || getStateSafe();
    renderHud(st);
    syncSceneContainers(st);
    var scene = getSceneName(st);
    if (scene === 'hall') {
      renderLoadoutRail(st);
      renderHallWorkspace(st);
    } else if (scene === 'exam') {
      renderExamConsole(st);
    } else if (scene === 'settlement') {
      renderSettlement(st);
    }
  }

  function bindGlobalEvents() {
    // Player profile rename
    if ($('btn-player-profile')) {
      $('btn-player-profile').addEventListener('click', function () {
        playSfx('ui_tick');
        var p = getPlayer(getStateSafe());
        var nextName = window.prompt('修改受试者姓名：', p.name || '受试者');
        if (nextName && nextName.trim() && INFINITY.Engine && typeof INFINITY.Engine.setPlayerProfile === 'function') {
          INFINITY.Engine.setPlayerProfile({ name: nextName.trim() });
          renderAll(getStateSafe());
        }
      });
    }

    // Audio controls
    if ($('btn-audio-toggle')) {
      $('btn-audio-toggle').addEventListener('click', function () {
        if (!INFINITY.Audio) return;
        INFINITY.Audio.unlock();
        var nextMuted = !INFINITY.Audio.isMuted();
        INFINITY.Audio.setMuted(nextMuted);
        $('btn-audio-toggle').classList.toggle('muted-on', nextMuted);
        $('btn-audio-toggle').setAttribute('aria-pressed', nextMuted ? 'true' : 'false');
        $('btn-audio-toggle').textContent = nextMuted ? '✕' : '♪';
      });
    }
    if ($('audio-volume')) {
      $('audio-volume').addEventListener('input', function (e) {
        if (!INFINITY.Audio) return;
        INFINITY.Audio.unlock();
        INFINITY.Audio.setVolume(parseFloat(e.target.value));
      });
    }

    // Save / Reset
    if ($('btn-save')) {
      $('btn-save').addEventListener('click', function () {
        playSfx('ui_tick');
        if (INFINITY.Engine && typeof INFINITY.Engine.save === 'function') {
          INFINITY.Engine.save();
          showToast('当前进度已写入本地腕表存档。', 'emerald');
        }
      });
    }
    if ($('btn-reset')) {
      $('btn-reset').addEventListener('click', function () {
        if (!window.confirm('确认重置当前受试者进度与考场状态？（AI 密钥配置会保留）')) return;
        playSfx('alert');
        unmountWorld25DIfNeeded();
        uiState.hallChats = {};
        uiState.sparringLog = [];
        uiState.fusionSlotA = null;
        uiState.fusionSlotB = null;
        uiState.lastFeedCount = 0;
        uiState.radioLog = [];
        if (INFINITY.Engine && typeof INFINITY.Engine.reset === 'function') {
          INFINITY.Engine.reset();
        }
        renderAll(getStateSafe());
        showToast('已重置至初始休整状态。');
      });
    }

    // Hall tab switching
    document.querySelectorAll('.hall-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        playSfx('ui_tick');
        uiState.hallTab = btn.getAttribute('data-hall-tab') || 'shop';
        renderHallWorkspace(getStateSafe());
      });
    });

    // Enter Station Zero
    if ($('btn-enter-station-zero')) {
      $('btn-enter-station-zero').addEventListener('click', function () {
        playSfx('vortex_buy');
        uiState.lastFeedCount = 0;
        if (INFINITY.Engine && typeof INFINITY.Engine.enterScenario === 'function') {
          INFINITY.Engine.enterScenario('station_zero');
        }
        renderAll(getStateSafe());
      });
    }

    // Delegated clicks inside Hall view & Loadout rail
    document.addEventListener('click', function (e) {
      var target = e.target.closest('button');
      if (!target) return;

      // Shop buy
      if (target.hasAttribute('data-buy-id')) {
        var id = target.getAttribute('data-buy-id');
        var disc = target.getAttribute('data-buy-disc') === '1';
        if (INFINITY.Engine && typeof INFINITY.Engine.buyItem === 'function') {
          var res = INFINITY.Engine.buyItem(id, disc);
          if (res && res.ok !== false) {
            playSfx('vortex_buy');
            showToast('兑换成功：' + (res.item ? res.item.name : id), 'emerald');
          } else {
            playSfx('alert');
            showToast((res && res.error) || '积分不足或无法兑换。', 'crimson');
          }
          renderAll(getStateSafe());
        }
        return;
      }

      // Refund
      if (target.hasAttribute('data-refund-id')) {
        var rid = target.getAttribute('data-refund-id');
        if (INFINITY.Engine && typeof INFINITY.Engine.refundItem === 'function') {
          var rres = INFINITY.Engine.refundItem(rid);
          if (rres && rres.ok !== false) {
            playSfx('ui_tick');
            showToast('已退换该项武装并返还积分。');
          } else {
            showToast((rres && rres.error) || '当前无法退换。', 'crimson');
          }
          renderAll(getStateSafe());
        }
        return;
      }

      // Starter preset preview toggle (never stealth-spend!)
      if (target.hasAttribute('data-preset-build')) {
        playSfx('ui_tick');
        var pid = target.getAttribute('data-preset-build');
        uiState.pendingPresetId = uiState.pendingPresetId === pid ? null : pid;
        renderHallWorkspace(getStateSafe());
        return;
      }
      if (target.hasAttribute('data-preset-confirm')) {
        applyStarterPreset(target.getAttribute('data-preset-confirm'));
        return;
      }
      if (target.hasAttribute('data-preset-cancel')) {
        playSfx('ui_tick');
        uiState.pendingPresetId = null;
        renderHallWorkspace(getStateSafe());
        return;
      }
      if (target.hasAttribute('data-hall-prompt')) {
        var promptText = target.getAttribute('data-hall-prompt');
        if (promptText && !uiState.hallChatBusy) {
          submitHallChat(uiState.selectedNpcId, promptText);
        }
        return;
      }

      // Shop pagination
      if (target.hasAttribute('data-shop-page')) {
        playSfx('ui_tick');
        uiState.shopPage = parseInt(target.getAttribute('data-shop-page'), 10) || 1;
        renderHallWorkspace(getStateSafe());
        return;
      }

      // Fusion pick
      if (target.hasAttribute('data-fusion-pick')) {
        playSfx('ui_tick');
        var fid = target.getAttribute('data-fusion-pick');
        if (uiState.fusionSlotA === fid) uiState.fusionSlotA = null;
        else if (uiState.fusionSlotB === fid) uiState.fusionSlotB = null;
        else if (!uiState.fusionSlotA) uiState.fusionSlotA = fid;
        else uiState.fusionSlotB = fid;
        renderHallWorkspace(getStateSafe());
        return;
      }

      // Select Hall NPC
      if (target.hasAttribute('data-select-npc')) {
        playSfx('ui_tick');
        uiState.selectedNpcId = target.getAttribute('data-select-npc');
        renderHallWorkspace(getStateSafe());
        return;
      }

      // Sparring test
      if (target.hasAttribute('data-spar-id')) {
        playSfx('blade_ring');
        var sid = target.getAttribute('data-spar-id');
        var sres = INFINITY.Engine && typeof INFINITY.Engine.runSparringTest === 'function'
          ? INFINITY.Engine.runSparringTest(sid)
          : { summary: '靶场测试完成，灵力与体能输出曲线稳定。' };
        var msg = (sres && ((sres.result && sres.result.summary) || sres.summary || sres.report || sres.text)) || '靶场实测完成。';
        uiState.sparringLog.unshift(msg);
        renderHallWorkspace(getStateSafe());
        return;
      }

      // 2.5D Hotbar skill cast (clickable)
      if (target.hasAttribute('data-cast-slot')) {
        var slotIdx = parseInt(target.getAttribute('data-cast-slot'), 10);
        if (!isNaN(slotIdx) && INFINITY.World25D && typeof INFINITY.World25D.castSlot === 'function') {
          INFINITY.World25D.castSlot(slotIdx);
        }
        return;
      }

      // Click squad row -> prefill radio callsign & slow-mo focus
      if (target.hasAttribute('data-radio-target')) {
        var npcName = target.getAttribute('data-radio-target');
        var radioInp = $('hud25d-radio-input');
        if (radioInp && npcName) {
          radioInp.value = npcName + ' ';
          radioInp.focus();
          radioInp.setSelectionRange(radioInp.value.length, radioInp.value.length);
        }
        return;
      }

      // Crisis counter button
      if (target.hasAttribute('data-crisis-choice')) {
        resolveCrisisChoice(target.getAttribute('data-crisis-choice'));
        return;
      }

      // AI Preset pill
      if (target.hasAttribute('data-ai-preset')) {
        var pk = target.getAttribute('data-ai-preset');
        var presets = (INFINITY.AI && INFINITY.AI.PRESETS) || {};
        var pr = presets[pk];
        if (pr) {
          if ($('ai-base-url')) $('ai-base-url').value = pr.baseUrl || '';
          if ($('ai-model')) $('ai-model').value = pr.model || '';
          document.querySelectorAll('.preset-pill').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-ai-preset') === pk);
          });
        }
      }
    });

    // 2.5D Contextual [E] Interact & [Space] Bullet-Time clickable pills
    if ($('hud25d-interact-pill')) {
      $('hud25d-interact-pill').addEventListener('click', function () {
        if (INFINITY.World25D && typeof INFINITY.World25D.triggerInteract === 'function') {
          INFINITY.World25D.triggerInteract();
        }
      });
    }
    if ($('hud25d-slowmo-pill')) {
      $('hud25d-slowmo-pill').addEventListener('click', function () {
        if (INFINITY.World25D && typeof INFINITY.World25D.toggleSlowMo === 'function') {
          INFINITY.World25D.toggleSlowMo();
        }
      });
    }

    // 2.5D Live Radio focus/blur (slow-mo while typing) & submit
    var radioForm = $('hud25d-radio-form');
    var radioInput = $('hud25d-radio-input');
    if (radioInput) {
      radioInput.addEventListener('focus', function () {
        if (uiState.currentScene === 'exam') {
          setRadioFocused(true);
        }
      });
      radioInput.addEventListener('blur', function () {
        if (uiState.currentScene === 'exam') {
          setRadioFocused(false);
          syncModalPause25D();
        }
      });
      radioInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          radioInput.blur();
          setRadioFocused(false);
        }
      });
    }
    if (radioForm) {
      radioForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = radioInput ? radioInput.value.trim() : '';
        if (radioInput) {
          radioInput.value = '';
          radioInput.blur();
        }
        setRadioFocused(false);
        if (text) {
          submitLiveRadio(text);
        }
      });
    }

    // Global Enter / Escape shortcuts during 2.5D Exam
    document.addEventListener('keydown', function (e) {
      if (uiState.currentScene !== 'exam') return;

      if (e.key === 'Escape') {
        if ($('ai-config-modal') && !$('ai-config-modal').classList.contains('hidden')) {
          $('ai-config-modal').classList.add('hidden');
          syncModalPause25D();
          return;
        }
        if ($('clues-modal') && !$('clues-modal').classList.contains('hidden')) {
          $('clues-modal').classList.add('hidden');
          syncModalPause25D();
          return;
        }
      }

      if (e.key === 'Enter' && !isAnyModalOpen()) {
        var activeTag = document.activeElement && document.activeElement.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
          var inp = $('hud25d-radio-input');
          if (inp) {
            e.preventDefault();
            inp.focus();
            setRadioFocused(true);
          }
        }
      }
    });

    // Crisis custom counter form
    if ($('crisis-custom-form')) {
      $('crisis-custom-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = $('crisis-custom-input');
        var text = inp ? inp.value.trim() : '';
        if (text) {
          inp.value = '';
          resolveCrisisChoice(text);
        }
      });
    }

    // Exam Clues & Extract
    if ($('btn-show-clues')) $('btn-show-clues').addEventListener('click', openCluesModal);
    if ($('btn-close-clues')) {
      $('btn-close-clues').addEventListener('click', function () {
        if ($('clues-modal')) $('clues-modal').classList.add('hidden');
        syncModalPause25D();
      });
    }
    if ($('btn-extract-exam')) {
      $('btn-extract-exam').addEventListener('click', function () {
        if (INFINITY.World25D && typeof INFINITY.World25D.setInputPaused === 'function') {
          INFINITY.World25D.setInputPaused(true);
        }
        var confirmed = window.confirm('确认现在触发撤离并进行本场考场结算？');
        if (!confirmed) {
          syncModalPause25D();
          return;
        }
        var snap = uiState.lastSnapshot || {};
        var insp = snap.inspector || {};
        var ending = 'forced_board_survive';
        if (Number(snap.overridePct || 0) >= 100) {
          ending = 'perfect_override';
        } else if (Number(insp.hp) <= 0 || Number(insp.sealedPct) >= 100) {
          ending = 'kill_inspector';
        }
        handleExam25DEnd(ending, {
          hp: snap.hp,
          energy: snap.energy,
          sanity: snap.sanity,
          overridePct: snap.overridePct,
          discoveredClueIds: snap.discoveredClueIds
        });
      });
    }

    // AI Config Modal controls
    if ($('btn-ai-config')) $('btn-ai-config').addEventListener('click', openAiModal);
    if ($('btn-close-ai-modal')) {
      $('btn-close-ai-modal').addEventListener('click', function () {
        if ($('ai-config-modal')) $('ai-config-modal').classList.add('hidden');
        syncModalPause25D();
      });
    }
    if ($('btn-toggle-key-vis')) {
      $('btn-toggle-key-vis').addEventListener('click', function () {
        var inp = $('ai-api-key');
        if (!inp) return;
        var isPwd = inp.type === 'password';
        inp.type = isPwd ? 'text' : 'password';
        $('btn-toggle-key-vis').textContent = isPwd ? '隐藏' : '显示';
      });
    }
    if ($('btn-clear-ai-key')) {
      $('btn-clear-ai-key').addEventListener('click', function () {
        if ($('ai-api-key')) $('ai-api-key').value = '';
        if (INFINITY.AI && typeof INFINITY.AI.saveConfig === 'function') {
          var cur = INFINITY.AI.getConfig();
          cur.apiKey = '';
          INFINITY.AI.saveConfig(cur);
        }
        renderAiStatusPill();
        showToast('已清空本地存储的 API Key。');
      });
    }
    if ($('btn-save-ai')) {
      $('btn-save-ai').addEventListener('click', function () {
        if (!INFINITY.AI || typeof INFINITY.AI.saveConfig !== 'function') return;
        var activePill = document.querySelector('.preset-pill.active');
        INFINITY.AI.saveConfig({
          provider: activePill ? activePill.getAttribute('data-ai-preset') : 'deepseek',
          baseUrl: ($('ai-base-url') && $('ai-base-url').value.trim()) || 'https://api.deepseek.com',
          model: ($('ai-model') && $('ai-model').value.trim()) || 'deepseek-chat',
          apiKey: ($('ai-api-key') && $('ai-api-key').value.trim()) || '',
          enabled: $('ai-enabled') ? $('ai-enabled').checked : true
        });
        renderAiStatusPill();
        if ($('ai-config-modal')) $('ai-config-modal').classList.add('hidden');
        syncModalPause25D();
        showToast('AI 导演配置已保存至本机 localStorage。', 'emerald');
      });
    }
    if ($('btn-test-ai')) {
      $('btn-test-ai').addEventListener('click', function () {
        var resBox = $('ai-test-result');
        if (!INFINITY.AI || typeof INFINITY.AI.testConnection !== 'function') return;
        // Save current form inputs before testing
        var activePill = document.querySelector('.preset-pill.active');
        INFINITY.AI.saveConfig({
          provider: activePill ? activePill.getAttribute('data-ai-preset') : 'deepseek',
          baseUrl: ($('ai-base-url') && $('ai-base-url').value.trim()) || 'https://api.deepseek.com',
          model: ($('ai-model') && $('ai-model').value.trim()) || 'deepseek-chat',
          apiKey: ($('ai-api-key') && $('ai-api-key').value.trim()) || '',
          enabled: $('ai-enabled') ? $('ai-enabled').checked : true
        });
        if (resBox) {
          resBox.className = 'test-result';
          resBox.textContent = '正在探测模型接口连通性…';
          resBox.classList.remove('hidden');
        }
        Promise.resolve(INFINITY.AI.testConnection()).then(function (r) {
          renderAiStatusPill();
          if (!resBox) return;
          if (r && r.ok) {
            resBox.className = 'test-result ok';
            resBox.textContent = '连接成功！延迟 ' + (r.latencyMs || 0) + ' ms，已就绪。';
          } else {
            resBox.className = 'test-result err';
            resBox.textContent = '连接失败：' + ((r && r.error) || '请检查 Base URL、模型名或 API Key');
          }
        });
      });
    }
  }

  function init() {
    bindAudioUnlockOnce();
    bindGlobalEvents();

    if (INFINITY.Engine) {
      if (typeof INFINITY.Engine.init === 'function') {
        INFINITY.Engine.init();
      }
      if (typeof INFINITY.Engine.subscribe === 'function') {
        INFINITY.Engine.subscribe(function (state) {
          renderAll(state);
        });
      }
    }

    renderAll(getStateSafe());
  }

  INFINITY.UI = {
    init: init,
    render: renderAll,
    showToast: showToast,
    openAiModal: openAiModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
