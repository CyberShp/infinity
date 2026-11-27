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
    speakerGlitchTimer: null,
    activeSpeakerId: 'yanci',
    postFxEnabled: true,
    minimapBaseCanvas: null,
    hotbarSig: '',
    lastAudioThreat: -1,
    crisisTimerId: null,
    crisisActiveKey: null,
    crisisDeadline: 0,
    crisisTotalSec: 8,
    audioUnlocked: false,
    lastFeedCount: 0,
    missionPanelOpen: true,
    missionPanelExpanded: false,
    missionPanelTab: 'progress',
    missionLogFilter: 'all',
    missionProgressSig: '',
    missionLogRenderedVer: -1,
    missionLogRenderedFilter: '',
    missionCelebratedBars: {},
    missionProgressInitialized: false,
    lastCelebrationAt: 0,
    missionProgressHistory: [],
    missionHistoryVersion: 0,
    missionChartRenderedVer: -1,
    missionChartRenderedWidth: 0,
    missionChartRenderedHeight: 0,
    missionChartResizeObserver: null,
    missionForecastVisible: false,
    missionForecastLastPct: -1,
    missionForecastAnimAt: 0,
    lastStallWarnAt: 0,
    lastStallWarnActive: false,
    missionAllCompleted: false,
    missionHoloIgniteTimer: null,
    lastExamReview: null
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

  function getPortraitUrlSafe(id) {
    if (INFINITY.ASSETS && typeof INFINITY.ASSETS.getPortraitUrl === 'function') {
      return INFINITY.ASSETS.getPortraitUrl(id);
    }
    return null;
  }

  function renderCrtAvatarHtml(id, name, accentColor, extraClass) {
    var url = getPortraitUrlSafe(id);
    var accent = accentColor || '#d6b274';
    var initial = String(name || id || '?').slice(0, 1);
    var cls = 'crt-portrait-frame' + (extraClass ? ' ' + extraClass : '') + (url ? '' : ' no-img');
    var imgHtml = url
      ? '<img class="crt-portrait-img" src="' + esc(url) + '" alt="' + esc(name || id || '') + '" loading="lazy" onerror="this.style.display=\'none\';if(this.parentNode){this.parentNode.classList.add(\'no-img\');}" />'
      : '';
    return (
      '<div class="' + cls + '" style="--crt-accent:' + esc(accent) + ';">' +
        imgHtml +
        '<span class="crt-portrait-fallback" aria-hidden="true">' + esc(initial) + '</span>' +
        '<div class="crt-scanlines" aria-hidden="true"></div>' +
      '</div>'
    );
  }

  function syncFxToggleUi() {
    var btn = $('btn-fx-toggle');
    if (!btn) return;
    var enabled = uiState.postFxEnabled;
    if (INFINITY.World25D && typeof INFINITY.World25D.isPostFxEnabled === 'function') {
      try {
        enabled = Boolean(INFINITY.World25D.isPostFxEnabled());
        uiState.postFxEnabled = enabled;
      } catch (_) {}
    }
    btn.textContent = enabled ? 'FX: 开' : 'FX: 关';
    btn.classList.toggle('active', enabled);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
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
      if (uiState.speakerGlitchTimer) {
        clearTimeout(uiState.speakerGlitchTimer);
        uiState.speakerGlitchTimer = null;
      }
      if (INFINITY.World25D && typeof INFINITY.World25D.unmount === 'function') {
        try {
          INFINITY.World25D.unmount();
        } catch (_) {}
      }
    }
    syncMissionPanelCompletionState(false);
  }

  function syncSceneContainers(state) {
    var scene = getSceneName(state);
    var prev = uiState.currentScene;
    document.body.setAttribute('data-scene', scene);
    document.body.setAttribute('data-state', scene === 'exam' ? 'playing' : (scene === 'settlement' ? 'gameover' : 'title'));

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
          var iconHtml = (INFINITY.IconSynth && typeof INFINITY.IconSynth.renderItemIcon === 'function')
            ? '<span class="inv-chip-icon">' + INFINITY.IconSynth.renderItemIcon(item, { size: 28, showBadge: false }) + '</span>'
            : '';
          return (
            '<div class="inv-chip">' +
              iconHtml +
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

          var itemIconHtml = (INFINITY.IconSynth && typeof INFINITY.IconSynth.renderItemIcon === 'function')
            ? '<div class="item-card-icon">' + INFINITY.IconSynth.renderItemIcon(item, { size: 42 }) + '</div>'
            : '';
          var tierCardCls = ' tier-card-' + esc(item.tier || 'D');

          return (
            '<article class="item-card' + tierCardCls + (owned ? ' owned' : '') + '">' +
              '<div>' +
                '<div class="item-card-top">' +
                  '<div class="item-card-head-left">' +
                    itemIconHtml +
                    '<div>' +
                      '<div class="item-name">' + esc(item.name) + '</div>' +
                      '<div class="item-id-row">' +
                        '<span class="tier-badge tier-' + esc(item.tier) + '">' + esc(item.tier) + '</span>' +
                        '<span class="mono muted small">' + esc(item.id) + '</span>' +
                        (item.canon ? '<span class="canon-badge">原著</span>' : '') +
                        '<span class="muted small">' + esc(item.energyType || '') + '</span>' +
                      '</div>' +
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
            '<p class="eyebrow crimson">CURATED FUSION · 秘传血统融合</p>' +
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
            '<p class="eyebrow">PROCEDURAL FUSION · 自由同阶跨体系拼合</p>' +
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
          '<p class="eyebrow crimson">GENE CRUCIBLE · 血统融合炉</p>' +
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
          '<p class="eyebrow">CURATED ARCHIVE · 已知高阶融合配方 (' + recipes.length + ')</p>' +
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
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
            renderCrtAvatarHtml(id, c.name, c.accentColor, 'cast-avatar') +
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
            '<div class="hall-chat-head-id">' +
              renderCrtAvatarHtml(npc.id, npc.name, npc.accentColor, 'hall-chat-avatar') +
              '<div style="min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                  '<h3>' + esc(npc.name) + ' <span class="mono muted small">' + esc(npc.codename || '') + '</span></h3>' +
                '</div>' +
                '<div class="small muted" style="margin-top:3px;">' + esc(npc.statusText || npc.role || '') + '</div>' +
              '</div>' +
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

    // 6. Active Objective Waypoint Guidance (dashed vector + pulsing target radar)
    if (mm.focusWaypoint && mm.player) {
      var wp = mm.focusWaypoint;
      var wx = wp.x * scale;
      var wz = wp.z * scale;
      var ppx = mm.player.x * scale;
      var ppz = mm.player.z * scale;
      var wpColor = wp.color || '#6fd8ea';
      var wpPulse = (performance.now() * 0.004) % 1;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 3]);
      ctx.moveTo(ppx, ppz);
      ctx.lineTo(wx, wz);
      ctx.strokeStyle = wpColor;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);

      // Expanding outer radar ping
      ctx.beginPath();
      ctx.arc(wx, wz, 4 + wpPulse * 10, 0, Math.PI * 2);
      ctx.strokeStyle = wpColor;
      ctx.globalAlpha = (1 - wpPulse) * 0.85;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner lock ring + core diamond
      ctx.beginPath();
      ctx.arc(wx, wz, 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = wpColor;
      ctx.globalAlpha = 0.92;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(wx, wz - 3.5);
      ctx.lineTo(wx + 3.5, wz);
      ctx.lineTo(wx, wz + 3.5);
      ctx.lineTo(wx - 3.5, wz);
      ctx.closePath();
      ctx.fillStyle = '#fff5dc';
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.restore();
    }

    // 7. Player arrow/marker
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
    var basic = { name: '近战/射击', icon: '⚔', color: '#d6b274', style: 'sword' };
    var loadoutSlots = null;
    if (INFINITY.Skills25D && typeof INFINITY.Skills25D.buildCombatLoadout === 'function') {
      try {
        var lo = INFINITY.Skills25D.buildCombatLoadout(getPlayer(state));
        if (lo && lo.basicAttack) {
          basic = {
            name: lo.basicAttack.name || '基础攻击',
            icon: lo.basicAttack.icon || '⚔',
            color: lo.basicAttack.color || '#d6b274',
            style: lo.basicAttack.style || 'sword'
          };
        }
        if (lo && Array.isArray(lo.slots)) loadoutSlots = lo.slots;
      } catch (_) {}
    }

    var sig = basic.name + ':' + basic.style + '|' + slots.map(function (sl) {
      return (sl.key || sl.index) + ':' + (sl.name || '') + ':' + (sl.archetype || '') + ':' + (sl.resonance ? sl.resonance.badgeText : '');
    }).join('|');
    if (uiState.hotbarSig !== sig) {
      uiState.hotbarSig = sig;
      var basicIconHtml = (INFINITY.IconSynth && typeof INFINITY.IconSynth.renderBasicAttackIcon === 'function')
        ? INFINITY.IconSynth.renderBasicAttackIcon(basic, { size: 26 })
        : esc(basic.icon);
      var html =
        '<button class="hotbar-slot lmb-slot" type="button" data-lmb-hint="1" title="鼠标左键瞄准普攻">' +
          '<div class="hotbar-top"><span class="hotbar-key">LMB</span><span class="hotbar-cost">普攻</span></div>' +
          '<div class="hotbar-mid"><span class="hotbar-icon">' + basicIconHtml + '</span><span class="hotbar-name">' + esc(basic.name) + '</span></div>' +
          '<div class="hotbar-accent-bar" style="background:' + esc(basic.color) + ';"></div>' +
        '</button>';

      for (var i = 0; i < 4; i++) {
        var sl = slots[i] || { index: i, key: String(i + 1), name: '空槽位', icon: '◇', color: '#6fd8ea', energyCost: 0 };
        var loSl = (loadoutSlots && loadoutSlots[i]) ? loadoutSlots[i] : null;
        var res = sl.resonance || null;
        var resClass = res ? ' has-resonance' : '';
        var resTitle = res
          ? (sl.name || '') + ' (能耗 ' + (sl.energyCost || 0) + ') · ✦ ' + res.resonanceName + ' [' + res.bloodlineName + '] ' + res.summaryText
          : (sl.name || '') + ' (能耗 ' + (sl.energyCost || 0) + ')';
        var resStyle = res ? (' style="--res-color:' + esc(res.color || sl.color || '#6fd8ea') + ';"') : '';
        var resBadgeHtml = res
          ? '<span class="hotbar-res-tag" style="color:' + esc(res.color || '#7be8ff') + ';">✦' + esc(res.badgeText || '共鸣') + '</span>'
          : '';
        var slotIconHtml = (INFINITY.IconSynth && typeof INFINITY.IconSynth.renderSkillIcon === 'function' && (sl.archetype || (loSl && loSl.archetype)))
          ? INFINITY.IconSynth.renderSkillIcon({
              itemId: sl.itemId || (loSl && loSl.itemId),
              category: sl.category || (loSl && loSl.category) || 'tech',
              tier: sl.tier || (loSl && loSl.tier) || 'B',
              archetype: sl.archetype || (loSl && loSl.archetype),
              color: sl.color || (loSl && loSl.color),
              vfxProfile: sl.vfxProfile || (loSl && loSl.vfxProfile)
            }, { size: 26, showBadge: false })
          : esc(sl.icon || '✦');
        html +=
          '<button class="hotbar-slot' + resClass + '" type="button" data-cast-slot="' + i + '" id="hotbar-slot-' + i + '"' + resStyle + ' title="' + esc(resTitle) + '">' +
            '<div class="hotbar-top">' +
              '<span class="hotbar-key">' + esc(sl.key || String(i + 1)) + '</span>' +
              '<span class="hotbar-cost">' + (sl.energyCost ? ('EN ' + Math.round(sl.energyCost)) : '免费') + '</span>' +
            '</div>' +
            '<div class="hotbar-mid">' +
              '<span class="hotbar-icon">' + slotIconHtml + '</span>' +
              '<span class="hotbar-name">' + esc(sl.name || '技能') + '</span>' +
            '</div>' +
            resBadgeHtml +
            '<div class="hotbar-accent-bar" style="background:' + esc(res ? (res.color || sl.color || '#6fd8ea') : (sl.color || '#6fd8ea')) + ';"></div>' +
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

  var SPEAKER_CHANNELS = {
    yanci: 'CH-01 · 执棋频段',
    lujin: 'CH-02 · 突击频段',
    xutan: 'CH-03 · 侦察频段',
    shenyan: 'CH-09 · 未知频段',
    inspector: '伪造信号 · 频段劫持'
  };

  function getRadioSpeakerMeta(speakerId) {
    var id = String(speakerId || 'yanci').toLowerCase();
    if (id === 'inspector') {
      return {
        id: 'inspector',
        name: '零号检票员',
        codename: 'ANOMALY-00',
        role: '无面规则体 · 频段劫持源',
        accentColor: '#ff3b3b',
        signalText: SPEAKER_CHANNELS.inspector
      };
    }
    var cast = getCast();
    var c = cast[id];
    if (c) {
      return {
        id: c.id || id,
        name: c.name || id,
        codename: c.codename || 'LIVE',
        role: c.role || '考场联络员',
        accentColor: c.accentColor || '#6fd8ea',
        signalText: SPEAKER_CHANNELS[id] || 'CH-00 · 加密在线'
      };
    }
    return {
      id: id,
      name: id,
      codename: 'RADIO',
      role: '加密短波频段',
      accentColor: '#6fd8ea',
      signalText: 'CH-00 · 信号在线'
    };
  }

  function resolveSpeakerIdFromEntry(entry) {
    if (!entry) return null;
    if (entry.type === 'broadcast' && (entry.fake || entry.timeGlitch)) {
      return 'inspector';
    }
    var raw = entry.npcId || entry.speakerId || '';
    if (raw) {
      var low = String(raw).trim().toLowerCase();
      if (low === 'inspector' || getCast()[low]) return low;
    }
    var spName = String(entry.speaker || '').trim();
    if (spName) {
      if (spName.indexOf('检票员') !== -1) return 'inspector';
      var cast = getCast();
      var ids = Object.keys(cast);
      for (var i = 0; i < ids.length; i++) {
        if (cast[ids[i]].name && spName.indexOf(cast[ids[i]].name) !== -1) {
          return ids[i];
        }
      }
    }
    return null;
  }

  function setActiveRadioSpeaker(speakerId, opts) {
    var bar = $('hud25d-speaker-bar');
    var frame = $('hud25d-speaker-frame');
    var img = $('hud25d-speaker-img');
    var fallback = $('hud25d-speaker-fallback');
    var nameEl = $('hud25d-speaker-name');
    var metaEl = $('hud25d-speaker-meta');
    var sigTextEl = $('hud25d-speaker-signal-text');
    var sigEl = $('hud25d-speaker-signal');
    if (!bar) return;

    var o = opts || {};
    var meta = getRadioSpeakerMeta(speakerId);
    var isGlitch = Boolean(o.glitch || meta.id === 'inspector');
    var accent = isGlitch ? '#ff3b3b' : (meta.accentColor || '#6fd8ea');

    uiState.activeSpeakerId = meta.id;
    bar.setAttribute('data-speaker', meta.id);
    bar.style.setProperty('--crt-accent', accent);
    if (frame) frame.style.setProperty('--crt-accent', accent);

    if (nameEl) nameEl.textContent = meta.name;
    if (metaEl) metaEl.textContent = meta.codename + ' · ' + meta.role;

    var label = o.signalText || meta.signalText || 'CH-01 · 加密在线';
    if (sigTextEl) {
      sigTextEl.textContent = label;
    } else if (sigEl) {
      sigEl.textContent = label;
    }

    if (fallback) {
      fallback.textContent = String(meta.name || '?').slice(0, 1);
    }

    if (img && frame) {
      var url = getPortraitUrlSafe(meta.id);
      if (url) {
        img.alt = meta.name;
        img.onerror = function () {
          img.style.display = 'none';
          frame.classList.add('no-img');
        };
        img.onload = function () {
          img.style.display = 'block';
          frame.classList.remove('no-img');
        };
        if (img.getAttribute('src') !== url) {
          img.style.display = 'block';
          frame.classList.remove('no-img');
          img.src = url;
        } else if (img.complete && img.naturalWidth === 0) {
          img.style.display = 'none';
          frame.classList.add('no-img');
        }
      } else {
        img.removeAttribute('src');
        img.style.display = 'none';
        frame.classList.add('no-img');
      }
    }

    if (uiState.speakerGlitchTimer) {
      clearTimeout(uiState.speakerGlitchTimer);
      uiState.speakerGlitchTimer = null;
    }

    if (isGlitch) {
      bar.classList.add('glitch');
      if (frame) frame.classList.add('glitch');
      uiState.speakerGlitchTimer = setTimeout(function () {
        if (frame) frame.classList.remove('glitch');
        uiState.speakerGlitchTimer = null;
      }, 3600);
    } else {
      bar.classList.remove('glitch');
      if (frame) frame.classList.remove('glitch');
    }
  }

  function pushRadioEntry(entry) {
    if (!entry) return;
    uiState.radioLog.push(entry);
    if (uiState.radioLog.length > 40) {
      uiState.radioLog.shift();
    }
    var spId = resolveSpeakerIdFromEntry(entry);
    if (spId) {
      var isFake = Boolean(entry.type === 'broadcast' && (entry.fake || entry.timeGlitch));
      setActiveRadioSpeaker(spId, {
        glitch: isFake || spId === 'inspector',
        signalText: isFake ? '伪造播报 · 信号劫持' : undefined
      });
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

  function updateOffscreenThreatIndicator(snapshot, inspDone) {
    var host = $('scene-exam');
    if (!host) return;
    var el = $('hud25d-threat-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hud25d-threat-indicator';
      el.className = 'hud25d-threat-indicator hidden';
      el.innerHTML = '<span class="threat-arrow-chevron"></span><span class="threat-arrow-dist mono"></span>';
      host.appendChild(el);
    }
    var insp = snapshot && snapshot.inspector;
    var dist = insp && isFinite(Number(insp.distToPlayer)) ? Number(insp.distToPlayer) : 999;
    var isOffscreen = (insp && typeof insp.offscreen === 'boolean') ? insp.offscreen : (dist >= 5.5);
    // Show off-screen edge indicator only when Inspector is alive, off-screen, and within 28m
    if (inspDone || !insp || !isOffscreen || dist > 28) {
      el.classList.add('hidden');
      return;
    }
    var angle = null;
    if (typeof insp.screenBearingRad === 'number' && isFinite(insp.screenBearingRad)) {
      angle = insp.screenBearingRad;
    } else if (typeof insp.bearingRad === 'number' && isFinite(insp.bearingRad)) {
      angle = insp.bearingRad;
    } else if (snapshot.minimap && snapshot.minimap.player && snapshot.minimap.inspector) {
      var dx = snapshot.minimap.inspector.x - snapshot.minimap.player.x;
      var dz = snapshot.minimap.inspector.z - snapshot.minimap.player.z;
      if (dx * dx + dz * dz > 0.01) angle = Math.atan2(dz, dx);
    }
    if (angle === null) {
      el.classList.add('hidden');
      return;
    }
    // Project direction onto elliptical screen-edge ring (inset safely inside HUD margins)
    var rx = 41;
    var ry = 36;
    var cx = 50 + Math.cos(angle) * rx;
    var cy = 50 + Math.sin(angle) * ry;
    var deg = (angle * 180) / Math.PI + 90;
    var urgency = clamp(1 - (dist - 5.5) / 22.5, 0.2, 1.0);
    el.classList.remove('hidden');
    el.classList.toggle('urgent', dist <= 13 || insp.state === 'chase');
    el.style.left = cx.toFixed(1) + '%';
    el.style.top = cy.toFixed(1) + '%';
    el.style.opacity = (0.45 + urgency * 0.55).toFixed(2);
    var chev = el.querySelector('.threat-arrow-chevron');
    if (chev) chev.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
    var distEl = el.querySelector('.threat-arrow-dist');
    if (distEl) distEl.textContent = Math.round(dist) + 'm';
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
        hunt: '追猎锁定!',
        stunned: '僵直受制',
        sealed: '已封印',
        defeated: '已击杀'
      };
      var stateKey = String(insp.state || 'patrol').toLowerCase();
      var distTxt = isFinite(Number(insp.distToPlayer)) ? (Math.round(Number(insp.distToPlayer)) + 'm') : '--m';
      inspStatusEl.textContent = inspDone
        ? '检票员：已肃清'
        : ('检票员：' + (stateLabels[stateKey] || '巡逻中') + ' · ' + distTxt);
      inspStatusEl.classList.toggle('danger', !inspDone && (stateKey === 'chase' || stateKey === 'hunt' || Number(insp.distToPlayer) <= 10));
      inspStatusEl.classList.toggle('neutralized', inspDone);
    }

    updateOffscreenThreatIndicator(snapshot, inspDone);

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
    renderMissionPanel25D(snapshot, false);

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

  function syncMissionPanelLayout() {
    var panel = $('hud25d-mission-panel');
    var collapsedTab = $('hud25d-mission-collapsed-tab');
    var topBtn = $('btn-toggle-mission-panel');
    var expandBtn = $('btn-mission-expand');

    if (panel) {
      panel.classList.toggle('collapsed', !uiState.missionPanelOpen);
      panel.classList.toggle('expanded', uiState.missionPanelOpen && uiState.missionPanelExpanded);
    }
    if (collapsedTab) {
      collapsedTab.classList.toggle('hidden', uiState.missionPanelOpen);
    }
    if (topBtn) {
      topBtn.classList.toggle('active', uiState.missionPanelOpen);
      topBtn.setAttribute('aria-pressed', uiState.missionPanelOpen ? 'true' : 'false');
    }
    if (expandBtn) {
      expandBtn.classList.toggle('active', uiState.missionPanelExpanded);
      expandBtn.textContent = uiState.missionPanelExpanded ? '还原' : '扩展';
      expandBtn.setAttribute('aria-pressed', uiState.missionPanelExpanded ? 'true' : 'false');
    }

    var activeTab = uiState.missionPanelTab || 'progress';
    document.querySelectorAll('[data-mission-tab]').forEach(function (btn) {
      var isAct = btn.getAttribute('data-mission-tab') === activeTab;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });
    var panes = {
      progress: $('hud25d-tab-progress'),
      branches: $('hud25d-tab-branches'),
      log: $('hud25d-tab-log')
    };
    Object.keys(panes).forEach(function (k) {
      if (panes[k]) panes[k].classList.toggle('active', k === activeTab);
    });

    var activeFilter = uiState.missionLogFilter || 'all';
    document.querySelectorAll('[data-mission-filter]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mission-filter') === activeFilter);
    });

    if (uiState.missionPanelOpen && activeTab === 'progress') {
      if (typeof global.requestAnimationFrame === 'function') {
        global.requestAnimationFrame(function () {
          renderMissionProgressChart25D(true);
        });
      } else {
        renderMissionProgressChart25D(true);
      }
    }
  }

  function triggerObjectiveRowFlash(el) {
    if (!el) return;
    if (el._flashTimer) {
      clearTimeout(el._flashTimer);
      el._flashTimer = null;
    }
    el.classList.remove('obj-complete-flash');
    void el.offsetWidth;
    el.classList.add('obj-complete-flash');
    el._flashTimer = setTimeout(function () {
      el.classList.remove('obj-complete-flash');
      el._flashTimer = null;
    }, 1020);
  }

  function flashCompletedObjectiveRows(completedKeys) {
    if (!Array.isArray(completedKeys) || !completedKeys.length) return;
    var flashedHudIds = {};
    for (var i = 0; i < completedKeys.length; i++) {
      var key = completedKeys[i];
      if ((key === 'override' || key.indexOf('console_') === 0) && !flashedHudIds.override) {
        flashedHudIds.override = true;
        triggerObjectiveRowFlash($('hud25d-obj-override'));
      } else if (key === 'inspector' && !flashedHudIds.inspector) {
        flashedHudIds.inspector = true;
        triggerObjectiveRowFlash($('hud25d-obj-inspector'));
      }

      var progList = $('hud25d-mission-progress-list');
      if (progList) {
        var matching = progList.querySelectorAll('[data-task-key]');
        for (var m = 0; m < matching.length; m++) {
          if (matching[m].getAttribute('data-task-key') === key) {
            triggerObjectiveRowFlash(matching[m]);
          }
        }
      }
    }
  }

  function checkMissionProgressCelebration(progressBars) {
    if (!progressBars) return [];
    var keys = Object.keys(progressBars);
    if (!uiState.missionProgressInitialized) {
      for (var i = 0; i < keys.length; i++) {
        if (Number(progressBars[keys[i]] || 0) >= 100) {
          uiState.missionCelebratedBars[keys[i]] = true;
        }
      }
      uiState.missionProgressInitialized = true;
      return [];
    }

    var newlyCompletedKeys = [];
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      var pct = Number(progressBars[k] || 0);
      if (pct >= 100 && !uiState.missionCelebratedBars[k]) {
        uiState.missionCelebratedBars[k] = true;
        newlyCompletedKeys.push(k);
      }
    }

    if (newlyCompletedKeys.length > 0) {
      var nowMs = Date.now();
      if (nowMs - (uiState.lastCelebrationAt || 0) >= 350) {
        uiState.lastCelebrationAt = nowMs;
        if (INFINITY.Audio && typeof INFINITY.Audio.playSfx === 'function') {
          INFINITY.Audio.playSfx('mission_complete');
        }
      }
    }
    return newlyCompletedKeys;
  }

  function ensureMissionHoloOverlay(panel) {
    if (!panel) return null;
    var overlay = panel.querySelector('.hud25d-mp-holo-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'hud25d-mp-holo-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="hud25d-mp-holo-scan"></div>' +
        '<div class="hud25d-mp-holo-corners"><span></span><span></span><span></span><span></span></div>' +
        '<div class="hud25d-mp-holo-seal"><span class="holo-seal-mark">✦ 达成</span><span class="holo-seal-sub">ALL CLEAR</span></div>';
      panel.appendChild(overlay);
    }
    return overlay;
  }

  function syncMissionPanelCompletionState(allCompleted, stagesDone) {
    var next = Boolean(allCompleted);
    var prev = Boolean(uiState.missionAllCompleted);
    var panel = $('hud25d-mission-panel');
    var collapsedTab = $('hud25d-mission-collapsed-tab');
    var metaEl = $('hud25d-mission-overall-meta');

    if (panel) {
      if (next) ensureMissionHoloOverlay(panel);
      panel.classList.toggle('is-all-completed', next);
    }
    if (collapsedTab) {
      collapsedTab.classList.toggle('is-all-completed', next);
    }
    if (metaEl && typeof stagesDone === 'number') {
      metaEl.textContent = next ? ('✦ 达成 · ' + stagesDone + '/4 阶段') : (stagesDone + '/4 阶段');
    }

    if (next === prev) return;
    uiState.missionAllCompleted = next;

    if (uiState.missionHoloIgniteTimer) {
      clearTimeout(uiState.missionHoloIgniteTimer);
      uiState.missionHoloIgniteTimer = null;
    }

    if (next) {
      if (panel) {
        panel.classList.remove('holo-ignite');
        void panel.offsetWidth;
        panel.classList.add('holo-ignite');
        uiState.missionHoloIgniteTimer = setTimeout(function () {
          if (panel) panel.classList.remove('holo-ignite');
          uiState.missionHoloIgniteTimer = null;
        }, 1250);
      }
      if (INFINITY.Audio) {
        if (typeof INFINITY.Audio.startMissionClosureAmbience === 'function') {
          INFINITY.Audio.startMissionClosureAmbience();
        } else if (typeof INFINITY.Audio.playSfx === 'function') {
          INFINITY.Audio.playSfx('mission_all_clear');
        }
      }
    } else {
      if (panel) panel.classList.remove('holo-ignite');
      if (INFINITY.Audio && typeof INFINITY.Audio.stopMissionClosureAmbience === 'function') {
        INFINITY.Audio.stopMissionClosureAmbience();
      }
    }
  }

  function renderMissionPanel25D(snapshot, forceLog) {
    if (!snapshot) return;

    var ovPct = clamp(Math.round(Number(snapshot.overridePct || 0)), 0, 100);
    var insp = snapshot.inspector || { hp: 160, maxHp: 160, sealedPct: 0, state: 'patrol' };
    var inspHp = Math.max(0, Math.round(Number(insp.hp || 0)));
    var inspMaxHp = Math.max(1, Math.round(Number(insp.maxHp || 160)));
    var sealedPct = clamp(Math.round(Number(insp.sealedPct || 0)), 0, 100);
    var inspDmgPct = clamp(Math.round(((inspMaxHp - inspHp) / inspMaxHp) * 100), 0, 100);
    var inspDone = inspHp <= 0 || sealedPct >= 100;
    var inspBreakPct = inspDone ? 100 : Math.max(inspDmgPct, sealedPct);

    var cluesFound = Math.max(0, Number(snapshot.cluesFoundCount || 0));
    var cluesTotal = Math.max(1, Number(snapshot.cluesTotal || 6));
    var cluesPct = clamp(Math.round((cluesFound / cluesTotal) * 100), 0, 100);
    var discoveredClueIds = Array.isArray(snapshot.discoveredClueIds) ? snapshot.discoveredClueIds : [];

    var visitedZones = Array.isArray(snapshot.visitedZones) ? snapshot.visitedZones : ['concourse'];
    var totalZones = Math.max(1, Number(snapshot.totalZones || 6));
    var zonesPct = clamp(Math.round((visitedZones.length / totalZones) * 100), 0, 100);

    var exitReady = Boolean((snapshot.minimap && snapshot.minimap.exitReady) || ovPct >= 100 || inspDone);
    var mainBreakPct = Math.max(ovPct, inspBreakPct);
    var mainDone = ovPct >= 100 || inspDone;

    var stagesDone = (mainDone ? 1 : 0) + (cluesFound >= cluesTotal ? 1 : 0) + (visitedZones.length >= totalZones ? 1 : 0) + (exitReady ? 1 : 0);
    var overallPct = clamp(
      Math.round(mainBreakPct * 0.50 + cluesPct * 0.25 + zonesPct * 0.15 + (exitReady ? 10 : 0)),
      0,
      100
    );
    var allTasksCompleted = stagesDone >= 4 && overallPct >= 100;

    if ($('hud25d-mission-overall-pct')) $('hud25d-mission-overall-pct').textContent = overallPct + '%';
    if ($('hud25d-mission-collapsed-pct')) $('hud25d-mission-collapsed-pct').textContent = allTasksCompleted ? '达成' : (overallPct + '%');
    if ($('hud25d-mission-overall-bar')) {
      $('hud25d-mission-overall-bar').style.width = overallPct + '%';
    }
    syncMissionPanelCompletionState(allTasksCompleted, stagesDone);

    var consoles = Array.isArray(snapshot.consoles) ? snapshot.consoles : [];
    var progressBars = {
      overall: overallPct,
      override: ovPct,
      inspector: inspBreakPct,
      clues: cluesPct,
      zones: zonesPct,
      exit: exitReady ? 100 : 0
    };
    for (var pi = 0; pi < consoles.length; pi++) {
      var cItem = consoles[pi];
      if (cItem && cItem.id) {
        progressBars['console_' + cItem.id] = cItem.done ? 100 : clamp(Math.round(Number(cItem.progress || 0)), 0, 100);
      }
    }
    var newlyCompletedKeys = checkMissionProgressCelebration(progressBars);
    var elapsedSec = Number(snapshot.elapsedSec != null ? snapshot.elapsedSec : 0);
    recordMissionProgressPoint(elapsedSec, overallPct, newlyCompletedKeys, consoles);
    renderMissionProgressChart25D(false);
    var consoleSig = consoles.map(function (c) {
      return c.id + ':' + Math.round(Number(c.progress || 0)) + ':' + (c.done ? 1 : 0);
    }).join(',');
    var progSig = [
      ovPct,
      inspHp,
      sealedPct,
      insp.state || '',
      cluesFound,
      discoveredClueIds.join(','),
      visitedZones.join(','),
      exitReady ? 1 : 0,
      consoleSig
    ].join('|');

    if (progSig !== uiState.missionProgressSig) {
      uiState.missionProgressSig = progSig;
      var progList = $('hud25d-mission-progress-list');
      if (progList) {
        var scenario = getScenario();
        var clueNameMap = {};
        if (scenario && Array.isArray(scenario.clues)) {
          for (var ci = 0; ci < scenario.clues.length; ci++) {
            clueNameMap[scenario.clues[ci].id] = scenario.clues[ci].title || scenario.clues[ci].id;
          }
        }
        var foundNames = discoveredClueIds.slice(-2).map(function (cid) {
          return clueNameMap[cid] || cid;
        });
        var zoneCodeMap = {
          concourse: 'Z-01',
          corridor: 'Z-02',
          dispatch: 'Z-03',
          signal_room: 'Z-03',
          substation: 'Z-04',
          tunnel: 'Z-05',
          maintenance: 'Z-05',
          platform0: 'Z-06'
        };
        var visitedCodes = visitedZones.map(function (zid) {
          return zoneCodeMap[zid] || zid;
        }).join(' · ');

        var consoleSubHtml = consoles.length
          ? '<div class="mp-sub-list">' + consoles.map(function (c) {
              var cp = clamp(Math.round(Number(c.progress || 0)), 0, 100);
              var cDone = Boolean(c.done || cp >= 100);
              var subGuideAttrs = cDone
                ? ''
                : ' data-guide-task="console_' + esc(c.id) + '" role="button" tabindex="0" title="点击在场景与小地图定位此控制台"';
              return (
                '<div class="mp-sub-row' + (cDone ? '' : ' is-guidable') + '" data-task-key="console_' + esc(c.id) + '"' + subGuideAttrs + '>' +
                  '<div class="mp-sub-line">' +
                    '<span>' + esc(c.label || c.id) + '</span>' +
                    '<span class="mp-sub-right">' +
                      (cDone ? '' : '<span class="mp-guide-cue">定位</span>') +
                      '<strong class="' + (cDone ? 'accent-emerald' : 'accent-cyan') + '">' + (cDone ? '已完成' : (cp + '%')) + '</strong>' +
                    '</span>' +
                  '</div>' +
                  '<div class="mp-progress-mini"><div class="mp-progress-mini-fill' + (cDone ? ' done' : '') + '" style="width:' + cp + '%"></div></div>' +
                '</div>'
              );
            }).join('') + '</div>'
          : '';

        var inspStatusTxt = inspHp <= 0
          ? '已击杀 · 100%'
          : (sealedPct >= 100 ? '已封印 · 100%' : (inspBreakPct > 0 ? ('交战中 · ' + inspBreakPct + '%') : '警戒巡逻 · 0%'));
        var inspStatusCls = inspDone ? 'done' : (inspBreakPct > 0 ? 'danger' : 'muted');

        var ovGuidable = ovPct < 100;
        var inspGuidable = !inspDone;
        var cluesGuidable = cluesFound < cluesTotal;
        var zonesGuidable = visitedZones.length < totalZones;
        var exitGuidable = exitReady;

        function guideAttrs(enabled, key, tip) {
          if (!enabled) return '';
          return ' data-guide-task="' + esc(key) + '" role="button" tabindex="0" title="' + esc(tip) + '"';
        }

        progList.innerHTML =
          '<div class="mp-task-card' + (ovPct >= 100 ? ' done' : ' is-guidable') + '" data-task-key="override"' + guideAttrs(ovGuidable, 'override', '点击定位最近未完成控制台') + '>' +
            '<div class="mp-task-top">' +
              '<span class="mp-task-name">主线一 · 轨控逆转出环</span>' +
              '<span class="mp-task-status ' + (ovPct >= 100 ? 'done' : (ovPct > 0 ? 'active' : 'muted')) + '">' +
                (ovGuidable ? '<span class="mp-guide-cue">定位</span>' : '') +
                (ovPct >= 100 ? '已完成 · 100%' : (ovPct > 0 ? ('推进中 · ' + ovPct + '%') : '待启动 · 0%')) +
              '</span>' +
            '</div>' +
            '<div class="mp-progress-mini"><div class="mp-progress-mini-fill' + (ovPct >= 100 ? ' done' : '') + '" style="width:' + ovPct + '%"></div></div>' +
            consoleSubHtml +
          '</div>' +

          '<div class="mp-task-card' + (inspDone ? ' done' : ' is-guidable') + '" data-task-key="inspector"' + guideAttrs(inspGuidable, 'inspector', '点击定位零号检票员方向') + '>' +
            '<div class="mp-task-top">' +
              '<span class="mp-task-name">主线二 · 肃清或封印检票员</span>' +
              '<span class="mp-task-status ' + inspStatusCls + '">' +
                (inspGuidable ? '<span class="mp-guide-cue">定位</span>' : '') +
                esc(inspStatusTxt) +
              '</span>' +
            '</div>' +
            '<div class="mp-progress-mini"><div class="mp-progress-mini-fill ' + (inspDone ? 'done' : 'crimson') + '" style="width:' + inspBreakPct + '%"></div></div>' +
            '<div class="mp-task-meta"><span>当前 HP ' + inspHp + '/' + inspMaxHp + '</span><span class="mono">封印 ' + sealedPct + '%</span></div>' +
          '</div>' +

          '<div class="mp-task-card' + (cluesFound >= cluesTotal ? ' done' : ' is-guidable') + '" data-task-key="clues"' + guideAttrs(cluesGuidable, 'clues', '点击定位最近未破译线索') + '>' +
            '<div class="mp-task-top">' +
              '<span class="mp-task-name">情报破译 · 考场线索收集</span>' +
              '<span class="mp-task-status ' + (cluesFound >= cluesTotal ? 'done' : (cluesFound > 0 ? 'active' : 'muted')) + '">' +
                (cluesGuidable ? '<span class="mp-guide-cue">定位</span>' : '') +
                (cluesFound >= cluesTotal ? '已集齐 · ' : '搜集中 · ') + cluesFound + '/' + cluesTotal +
              '</span>' +
            '</div>' +
            '<div class="mp-progress-mini"><div class="mp-progress-mini-fill ' + (cluesFound >= cluesTotal ? 'done' : 'gold') + '" style="width:' + cluesPct + '%"></div></div>' +
            '<div class="mp-task-meta"><span>' + esc(foundNames.length ? ('最新：' + foundNames.join(' / ')) : '接近发光物证按 E 勘察') + '</span></div>' +
          '</div>' +

          '<div class="mp-task-card' + (visitedZones.length >= totalZones ? ' done' : ' is-guidable') + '" data-task-key="zones"' + guideAttrs(zonesGuidable, 'zones', '点击定位最近未探索区域') + '>' +
            '<div class="mp-task-top">' +
              '<span class="mp-task-name">空间勘察 · 站台区域探索</span>' +
              '<span class="mp-task-status ' + (visitedZones.length >= totalZones ? 'done' : 'active') + '">' +
                (zonesGuidable ? '<span class="mp-guide-cue">定位</span>' : '') +
                visitedZones.length + '/' + totalZones + ' 区' +
              '</span>' +
            '</div>' +
            '<div class="mp-progress-mini"><div class="mp-progress-mini-fill' + (visitedZones.length >= totalZones ? ' done' : '') + '" style="width:' + zonesPct + '%"></div></div>' +
            '<div class="mp-task-meta"><span class="mono">' + esc(visitedCodes) + '</span></div>' +
          '</div>' +

          '<div class="mp-task-card' + (exitReady ? ' done is-guidable' : '') + '" data-task-key="exit"' + guideAttrs(exitGuidable, 'exit', '点击定位 0 号站台撤离锚点') + '>' +
            '<div class="mp-task-top">' +
              '<span class="mp-task-name">终局撤离 · 0号站台出环通道</span>' +
              '<span class="mp-task-status ' + (exitReady ? 'done' : 'muted') + '">' +
                (exitGuidable ? '<span class="mp-guide-cue">定位</span>' : '') +
                (exitReady ? '已解锁 · 可撤离' : '通道锁定中') +
              '</span>' +
            '</div>' +
            '<div class="mp-progress-mini"><div class="mp-progress-mini-fill' + (exitReady ? ' done' : '') + '" style="width:' + (exitReady ? 100 : 0) + '%"></div></div>' +
            '<div class="mp-task-meta"><span>' + (exitReady ? '前往 Z-06 0号站台撤离锚点按 E 脱出考场' : '完成轨控改写 100% 或肃清检票员后解锁') + '</span></div>' +
          '</div>';
      }
    }

    if (newlyCompletedKeys.length > 0) {
      flashCompletedObjectiveRows(newlyCompletedKeys);
    }

    var logVer = Number(snapshot.missionLogVersion || 0);
    var filterKey = uiState.missionLogFilter || 'all';
    if (!forceLog && logVer === uiState.missionLogRenderedVer && filterKey === uiState.missionLogRenderedFilter) {
      return;
    }
    uiState.missionLogRenderedVer = logVer;
    uiState.missionLogRenderedFilter = filterKey;

    var branches = Array.isArray(snapshot.branches) ? snapshot.branches : [];
    var triggeredCount = 0;
    for (var bi = 0; bi < branches.length; bi++) {
      if (branches[bi] && branches[bi].status !== 'pending') triggeredCount += 1;
    }
    if ($('hud25d-branch-count')) {
      $('hud25d-branch-count').textContent = triggeredCount + '/' + branches.length;
    }

    var branchListEl = $('hud25d-mission-branches-list');
    if (branchListEl) {
      var statusOrder = { warning: 0, active: 1, triggered: 2, completed: 3, pending: 4 };
      var statusLabels = {
        completed: '已达成',
        active: '推进中',
        triggered: '已触发',
        warning: '高危警告',
        pending: '未触发'
      };
      var sortedBranches = branches.slice().sort(function (a, b) {
        var oa = statusOrder[a.status] != null ? statusOrder[a.status] : 9;
        var ob = statusOrder[b.status] != null ? statusOrder[b.status] : 9;
        return oa - ob;
      });
      branchListEl.innerHTML = sortedBranches.map(function (b) {
        var stKey = b.status || 'pending';
        var stLabel = statusLabels[stKey] || stKey;
        var bp = clamp(Math.round(Number(b.progressPct || 0)), 0, 100);
        var metaText = (b.routeTag || '逻辑分支') + (b.updatedAt ? (' · ' + b.updatedAt) : ' · 等待触发');
        var bodyText = stKey === 'pending' ? (b.summary || b.outcome || '') : (b.outcome || b.summary || '');
        var showBar = stKey !== 'pending' && bp > 0;
        var barTone = stKey === 'completed' ? ' done' : (stKey === 'warning' ? ' crimson' : (stKey === 'triggered' ? ' gold' : ''));
        return (
          '<article class="mp-branch-card status-' + esc(stKey) + '">' +
            '<div class="mp-branch-head">' +
              '<span class="mp-branch-name">' + esc(b.name || b.id) + '</span>' +
              '<span class="mp-branch-status status-' + esc(stKey) + '">' + esc(stLabel) + '</span>' +
            '</div>' +
            '<div class="mp-branch-meta">' + esc(metaText) + '</div>' +
            (showBar ? ('<div class="mp-progress-mini"><div class="mp-progress-mini-fill' + barTone + '" style="width:' + bp + '%"></div></div>') : '') +
            '<div class="mp-branch-outcome">' + esc(bodyText) + '</div>' +
          '</article>'
        );
      }).join('');
    }

    var logs = Array.isArray(snapshot.missionLog) ? snapshot.missionLog : [];
    if ($('hud25d-log-count')) {
      $('hud25d-log-count').textContent = String(logs.length);
    }

    var logListEl = $('hud25d-mission-log-list');
    if (logListEl) {
      var catLabels = {
        progress: '进度',
        branch: '分支',
        clue: '线索',
        warning: '警报',
        squad: '协同'
      };
      var filteredLogs = logs.filter(function (item) {
        if (filterKey === 'all') return true;
        if (filterKey === 'branch') return item.category === 'branch' || item.category === 'squad';
        return item.category === filterKey;
      });
      if (!filteredLogs.length) {
        logListEl.innerHTML = '<div class="mp-empty-state">当前分类下暂无已记录的任务日志。</div>';
      } else {
        logListEl.innerHTML = filteredLogs.map(function (item) {
          var cat = item.category || 'progress';
          var catLabel = catLabels[cat] || '记录';
          var where = (item.zoneCode ? (item.zoneCode + ' ') : '') + (item.zoneName || '');
          var logSec = item.elapsedSec != null ? Math.floor(Number(item.elapsedSec) || 0) : -1;
          return (
            '<article class="mp-log-item cat-' + esc(cat) + '" data-log-id="' + esc(item.id || '') + '" data-log-sec="' + logSec + '" data-log-time="' + esc(item.timeLabel || '00:00') + '">' +
              '<div class="mp-log-head">' +
                '<span>' + esc(item.timeLabel || '00:00') + (where ? (' · ' + esc(where)) : '') + '</span>' +
                '<span class="mp-log-cat cat-' + esc(cat) + '">' + esc(catLabel) + '</span>' +
              '</div>' +
              '<div class="mp-log-title">' + esc(item.title || '') + '</div>' +
              (item.detail ? ('<div class="mp-log-detail">' + esc(item.detail) + '</div>') : '') +
            '</article>'
          );
        }).join('');
      }
    }
  }

  function formatChartMMSS(totalSec) {
    var s = Math.max(0, Math.floor(Number(totalSec) || 0));
    var mins = Math.floor(s / 60);
    var secs = s % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function getMilestoneLabelForKey(key, consoles) {
    if (key === 'overall') return '考场总进度 100%';
    if (key === 'override') return '轨控逆转 100%';
    if (key === 'inspector') return '零号检票员肃清';
    if (key === 'clues') return '全线索破译完成';
    if (key === 'zones') return '站台全区勘察完成';
    if (key === 'exit') return '0号站台撤离解锁';
    if (key && key.indexOf('console_') === 0) {
      var cid = key.slice('console_'.length);
      if (Array.isArray(consoles)) {
        for (var i = 0; i < consoles.length; i++) {
          if (consoles[i] && consoles[i].id === cid) {
            return (consoles[i].label || cid) + '完成';
          }
        }
      }
      return '子控制台改写完成';
    }
    return null;
  }

  function recordMissionProgressPoint(elapsedSec, overallPct, newlyCompletedKeys, consoles) {
    var t = Math.max(0, Math.floor(Number(elapsedSec) || 0));
    var pct = clamp(Math.round(Number(overallPct) || 0), 0, 100);
    var history = uiState.missionProgressHistory;
    if (!Array.isArray(history)) {
      history = [];
      uiState.missionProgressHistory = history;
    }

    var milestoneLabels = [];
    var milestoneKeys = [];
    if (Array.isArray(newlyCompletedKeys) && newlyCompletedKeys.length) {
      for (var i = 0; i < newlyCompletedKeys.length; i++) {
        var lbl = getMilestoneLabelForKey(newlyCompletedKeys[i], consoles);
        if (lbl && milestoneLabels.indexOf(lbl) === -1) {
          milestoneLabels.push(lbl);
          milestoneKeys.push(newlyCompletedKeys[i]);
        }
      }
    }
    var milestoneText = milestoneLabels.length ? milestoneLabels.slice(0, 2).join(' · ') : null;

    if (!history.length) {
      history.push({
        t: t,
        timeLabel: formatChartMMSS(t),
        pct: pct,
        milestone: milestoneText,
        milestoneKeys: milestoneKeys.length ? milestoneKeys : null
      });
      uiState.missionHistoryVersion += 1;
      return;
    }

    var last = history[history.length - 1];
    if (milestoneText) {
      if (t <= last.t) {
        last.pct = pct;
        if (!last.milestone) {
          last.milestone = milestoneText;
        } else if (last.milestone.indexOf(milestoneText) === -1) {
          last.milestone = last.milestone + ' · ' + milestoneText;
        }
        if (milestoneKeys.length) {
          last.milestoneKeys = (last.milestoneKeys || []).concat(milestoneKeys);
        }
      } else {
        history.push({
          t: t,
          timeLabel: formatChartMMSS(t),
          pct: pct,
          milestone: milestoneText,
          milestoneKeys: milestoneKeys.length ? milestoneKeys : null
        });
      }
      uiState.missionHistoryVersion += 1;
    } else if (pct !== last.pct) {
      if (t <= last.t) {
        last.pct = pct;
      } else {
        history.push({
          t: t,
          timeLabel: formatChartMMSS(t),
          pct: pct,
          milestone: null,
          milestoneKeys: null
        });
      }
      uiState.missionHistoryVersion += 1;
    } else if (t - last.t >= 2) {
      history.push({
        t: t,
        timeLabel: formatChartMMSS(t),
        pct: pct,
        milestone: null,
        milestoneKeys: null
      });
      uiState.missionHistoryVersion += 1;
    }

    if (history.length > 260) {
      var compacted = [];
      var tailStart = history.length - 40;
      for (var k = 0; k < history.length; k++) {
        var pt = history[k];
        if (k === 0 || k >= tailStart || pt.milestone || k % 2 === 0) {
          compacted.push(pt);
        }
      }
      uiState.missionProgressHistory = compacted;
    }
  }

  var GRADE_BENCHMARKS = [
    { id: 'S', sec: 210, shortLabel: 'S 03:30', cls: 'bench-s' },
    { id: 'A', sec: 360, shortLabel: 'A 06:00', cls: 'bench-a' },
    { id: 'LIMIT', sec: 540, shortLabel: '限 09:00', cls: 'bench-limit' }
  ];

  function getProjectedGradeMeta(totalSec) {
    var s = Number(totalSec) || 0;
    if (s <= 210) return { code: 'S', label: '预计 S 级', cls: 'grade-s' };
    if (s <= 360) return { code: 'A', label: '预计 A 级', cls: 'grade-a' };
    if (s <= 540) return { code: 'B', label: '预计 B 级', cls: 'grade-b' };
    return { code: 'RISK', label: '超时风险', cls: 'grade-risk' };
  }

  function formatChartDuration(sec) {
    var s = Math.max(0, Math.round(Number(sec) || 0));
    if (s > 5999) return '>99:59';
    return formatChartMMSS(s);
  }

  function computeMissionForecast(points) {
    if (!Array.isArray(points) || !points.length) {
      return { status: 'awaiting', stallSec: 0, warningLevel: 'none', gradeMeta: null };
    }
    var basePt = points[0];
    var latestPt = points[points.length - 1];

    // Measure how long current progress has remained flat without advancing
    var lastGainT = latestPt.t;
    for (var si = points.length - 1; si >= 0; si--) {
      if (points[si].pct < latestPt.pct) {
        lastGainT = points[Math.min(points.length - 1, si + 1)].t;
        break;
      }
      lastGainT = points[si].t;
    }
    var stallSec = Math.max(0, latestPt.t - lastGainT);

    if (latestPt.pct >= 100) {
      return {
        status: 'complete',
        ratePctPerSec: 0,
        ratePerMin: 0,
        remainingSec: 0,
        etaTotalSec: latestPt.t,
        startT: latestPt.t,
        startPct: 100,
        stallSec: 0,
        warningLevel: 'none',
        gradeMeta: getProjectedGradeMeta(latestPt.t)
      };
    }

    var totalDt = Math.max(0, latestPt.t - basePt.t);
    var netGain = latestPt.pct - basePt.pct;
    var overallRate = 0;

    if (netGain > 0 && totalDt >= 1) {
      overallRate = netGain / totalDt;
    } else if (basePt.t >= 3 && latestPt.pct > 0) {
      overallRate = latestPt.pct / Math.max(1, latestPt.t);
    } else {
      var initWarn = latestPt.t >= 45 ? 'critical' : (latestPt.t >= 26 ? 'warn' : 'none');
      return { status: 'awaiting', stallSec: stallSec, warningLevel: initWarn, gradeMeta: null };
    }

    // Blend recent 45s pace (60%) with overall exam pace (40%) so trend responds to current speed without extreme jitter
    var winStart = latestPt.t - 45;
    var winPt = basePt;
    for (var i = points.length - 1; i >= 0; i--) {
      if (points[i].t <= winStart) {
        winPt = points[i];
        break;
      }
      winPt = points[i];
    }
    var winDt = Math.max(0, latestPt.t - winPt.t);
    var winGain = latestPt.pct - winPt.pct;
    var ratePctPerSec = (winDt >= 6 && winGain > 0)
      ? ((winGain / winDt) * 0.6 + overallRate * 0.4)
      : overallRate;

    if (!isFinite(ratePctPerSec) || ratePctPerSec <= 0.0005) {
      return { status: 'stalled', stallSec: stallSec, warningLevel: 'critical', gradeMeta: getProjectedGradeMeta(999) };
    }

    var remainingPct = Math.max(0, 100 - latestPt.pct);
    var remainingSec = Math.max(1, Math.round(remainingPct / ratePctPerSec));
    var etaTotalSec = latestPt.t + remainingSec;
    var gradeMeta = getProjectedGradeMeta(etaTotalSec);

    var warningLevel = 'none';
    if (etaTotalSec > 540 || stallSec >= 45) {
      warningLevel = 'critical';
    } else if (stallSec >= 24) {
      warningLevel = 'warn';
    }

    return {
      status: 'active',
      ratePctPerSec: ratePctPerSec,
      ratePerMin: ratePctPerSec * 60,
      remainingSec: remainingSec,
      etaTotalSec: etaTotalSec,
      startT: latestPt.t,
      startPct: latestPt.pct,
      stallSec: stallSec,
      warningLevel: warningLevel,
      gradeMeta: gradeMeta
    };
  }

  function parseMMSSLabel(label) {
    var m = String(label || '').match(/(\d+):(\d+)/);
    if (!m) return -1;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function jumpToMilestoneLog(milestonePt) {
    if (!milestonePt) return;
    playSfx('ui_tick');
    uiState.missionPanelOpen = true;
    uiState.missionPanelTab = 'log';
    uiState.missionLogFilter = 'all';
    syncMissionPanelLayout();
    if (uiState.lastSnapshot) {
      renderMissionPanel25D(uiState.lastSnapshot, true);
    }

    global.requestAnimationFrame(function () {
      var listEl = $('hud25d-mission-log-list');
      if (!listEl) return;
      var items = listEl.querySelectorAll('.mp-log-item');
      if (!items || !items.length) return;

      var targetT = Number(milestonePt.t) || 0;
      var keywords = [];
      var msText = String(milestonePt.milestone || '');
      if (msText.indexOf('轨控') !== -1 || msText.indexOf('控制台') !== -1) keywords.push('轨控', '调度', '变电', '控制台', '改写');
      if (msText.indexOf('检票员') !== -1) keywords.push('检票员', '肃清', '封印');
      if (msText.indexOf('线索') !== -1) keywords.push('线索', '破译');
      if (msText.indexOf('区域') !== -1 || msText.indexOf('勘察') !== -1) keywords.push('勘探', '区域');
      if (msText.indexOf('撤离') !== -1) keywords.push('撤离', '0号站台');

      var bestEl = items[0];
      var bestScore = -1e9;
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var secAttr = parseInt(el.getAttribute('data-log-sec'), 10);
        var logT = (!isNaN(secAttr) && secAttr >= 0) ? secAttr : parseMMSSLabel(el.getAttribute('data-log-time'));
        var diff = logT >= 0 ? Math.abs(logT - targetT) : 999;
        var score = -diff * 3;
        var txt = el.textContent || '';
        for (var ki = 0; ki < keywords.length; ki++) {
          if (txt.indexOf(keywords[ki]) !== -1) {
            score += 24;
            break;
          }
        }
        if (diff <= 3) score += 30;
        if (score > bestScore) {
          bestScore = score;
          bestEl = el;
        }
      }

      if (bestEl) {
        try {
          bestEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {
          bestEl.scrollIntoView();
        }
        bestEl.classList.remove('mp-log-jump-highlight');
        void bestEl.offsetWidth;
        bestEl.classList.add('mp-log-jump-highlight');
        global.setTimeout(function () {
          bestEl.classList.remove('mp-log-jump-highlight');
        }, 1850);
      }
    });
  }

  function renderMissionProgressChart25D(forceRedraw) {
    var history = Array.isArray(uiState.missionProgressHistory) ? uiState.missionProgressHistory : [];
    var points = history.length
      ? history
      : [{ t: 0, timeLabel: '00:00', pct: 0, milestone: null }];
    var latestPt = points[points.length - 1];
    var isComplete = latestPt.pct >= 100;
    var forecast = computeMissionForecast(points);

    var metaEl = $('hud25d-progress-chart-meta');
    if (metaEl) {
      var peakPct = 0;
      var milestoneCount = 0;
      for (var m = 0; m < history.length; m++) {
        if (history[m].pct > peakPct) peakPct = history[m].pct;
        if (history[m].milestone) milestoneCount += 1;
      }
      metaEl.textContent = '峰值 ' + peakPct + '% · ' + milestoneCount + ' 个里程碑';
    }

    var etaEl = $('hud25d-progress-chart-eta');
    var prevForecastPct = uiState.missionForecastLastPct;
    var pctDidUpdate = prevForecastPct >= 0 && latestPt.pct !== prevForecastPct;
    if (pctDidUpdate) {
      uiState.lastStallWarnActive = false;
    }

    // Trigger restrained stall warning audio once when entering stall/timeout warning (35s cooldown)
    if (forecast.warningLevel !== 'none') {
      var nowTs = Date.now();
      if (!uiState.lastStallWarnActive && (nowTs - (uiState.lastStallWarnAt || 0) >= 35000)) {
        uiState.lastStallWarnActive = true;
        uiState.lastStallWarnAt = nowTs;
        if (uiState.currentScene === 'exam' && !uiState.examEnded) {
          playSfx('stall_warn');
        }
      }
    } else {
      uiState.lastStallWarnActive = false;
    }

    if (etaEl) {
      etaEl.classList.remove('active', 'complete', 'warn', 'critical');
      if (forecast.status === 'complete') {
        var doneGrade = forecast.gradeMeta ? (' · ' + forecast.gradeMeta.code + '级节奏') : '';
        etaEl.textContent = '已达 100% · 用时 ' + formatChartMMSS(latestPt.t) + doneGrade;
        etaEl.classList.add('complete');
      } else if (forecast.status === 'active') {
        var gTag = forecast.gradeMeta ? (' · ' + forecast.gradeMeta.label) : '';
        if (forecast.warningLevel === 'critical') {
          etaEl.textContent = (forecast.etaTotalSec > 540 ? '超时风险' : ('停滞 ' + forecast.stallSec + 's')) +
            ' · 余 ' + formatChartDuration(forecast.remainingSec);
          etaEl.classList.add('critical');
        } else if (forecast.warningLevel === 'warn') {
          etaEl.textContent = '停滞 ' + forecast.stallSec + 's · 余 ' + formatChartDuration(forecast.remainingSec);
          etaEl.classList.add('warn');
        } else {
          etaEl.textContent = '预计余 ' + formatChartDuration(forecast.remainingSec) + gTag;
          etaEl.classList.add('active');
        }
        if (pctDidUpdate) {
          etaEl.classList.remove('eta-flash');
          void etaEl.offsetWidth;
          etaEl.classList.add('eta-flash');
        }
      } else if (forecast.status === 'stalled' || forecast.warningLevel !== 'none') {
        etaEl.textContent = '推进停滞 ' + forecast.stallSec + 's · 请加快节奏';
        etaEl.classList.add(forecast.warningLevel === 'critical' ? 'critical' : 'warn');
      } else {
        etaEl.textContent = '推进后测算剩余时间';
      }
    }

    if (!uiState.missionPanelOpen || uiState.missionPanelTab !== 'progress') {
      return;
    }

    var host = $('hud25d-progress-chart');
    if (!host) return;
    var tooltipEl = $('hud25d-progress-tooltip');

    var d3Lib = global.d3;
    if (!d3Lib || typeof d3Lib.select !== 'function') {
      var existingFb = host.querySelector('.mp-chart-fallback');
      if (!existingFb) {
        var fb = document.createElement('div');
        fb.className = 'mp-chart-fallback';
        fb.textContent = '折线图引擎加载中…';
        host.insertBefore(fb, tooltipEl || null);
      }
      return;
    }

    var width = Math.floor(host.clientWidth || 0);
    var height = Math.floor(host.clientHeight || 0);
    if (width < 80 || height < 48) {
      return;
    }

    if (
      !forceRedraw &&
      uiState.missionHistoryVersion === uiState.missionChartRenderedVer &&
      width === uiState.missionChartRenderedWidth &&
      height === uiState.missionChartRenderedHeight
    ) {
      return;
    }

    uiState.missionChartRenderedVer = uiState.missionHistoryVersion;
    uiState.missionChartRenderedWidth = width;
    uiState.missionChartRenderedHeight = height;

    var staleFb = host.querySelector('.mp-chart-fallback');
    if (staleFb && staleFb.parentNode) staleFb.parentNode.removeChild(staleFb);

    var plotPoints = points.length === 1
      ? [
          points[0],
          {
            t: Math.max(points[0].t + 1, 1),
            timeLabel: points[0].timeLabel,
            pct: points[0].pct,
            milestone: null,
            _synthetic: true
          }
        ]
      : points;

    var margin = { top: 10, right: 10, bottom: 18, left: 30 };
    var innerW = Math.max(40, width - margin.left - margin.right);
    var innerH = Math.max(32, height - margin.top - margin.bottom);

    var maxT = Math.max(60, latestPt.t);
    var hasForecastCurve = false;
    var forecastEndT = latestPt.t;
    var forecastEndPct = latestPt.pct;
    var forecastCapped = false;
    var forecastPoints = null;

    if (forecast.status === 'active') {
      var horizonCap = Math.round(Math.max(60, latestPt.t) * 2.6 + 60);
      forecastCapped = forecast.etaTotalSec > horizonCap;
      forecastEndT = forecastCapped ? horizonCap : forecast.etaTotalSec;
      forecastEndPct = forecastCapped
        ? clamp(latestPt.pct + forecast.ratePctPerSec * (forecastEndT - latestPt.t), latestPt.pct, 100)
        : 100;
      if (forecastEndT > latestPt.t) {
        hasForecastCurve = true;
        maxT = Math.max(maxT, forecastEndT);
        forecastPoints = [
          { t: latestPt.t, pct: latestPt.pct },
          { t: forecastEndT, pct: forecastEndPct }
        ];
      }
    }

    // Snap X-axis slightly outward to show the nearest upcoming grade benchmark (S 03:30 / A 06:00 / 限 09:00) when close
    for (var bIdx = 0; bIdx < GRADE_BENCHMARKS.length; bIdx++) {
      var bSec = GRADE_BENCHMARKS[bIdx].sec;
      if (bSec > maxT && bSec <= maxT * 1.24) {
        maxT = bSec;
        break;
      }
    }

    var xScale = d3Lib.scaleLinear().domain([0, maxT]).range([0, innerW]);
    var yScale = d3Lib.scaleLinear().domain([0, 100]).range([innerH, 0]);

    var prefersReducedMotion = Boolean(
      global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    var forecastJustAppeared = hasForecastCurve && !uiState.missionForecastVisible;
    var progressUpdated = latestPt.pct !== uiState.missionForecastLastPct;
    var shouldAnimateForecast = Boolean(
      hasForecastCurve &&
      !prefersReducedMotion &&
      (forecastJustAppeared || progressUpdated || forceRedraw)
    );
    uiState.missionForecastVisible = hasForecastCurve;
    uiState.missionForecastLastPct = latestPt.pct;

    var d3Host = d3Lib.select(host);
    var svg = d3Host.select('svg.hud25d-mp-chart-svg');
    if (svg.empty()) {
      svg = d3Host.insert('svg', '#hud25d-progress-tooltip')
        .attr('class', 'hud25d-mp-chart-svg')
        .attr('role', 'img')
        .attr('aria-label', '考场任务总进度百分比实时波动与预测趋势折线图');
    }
    svg.attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', width)
      .attr('height', height);
    if (typeof svg.selectAll('*').interrupt === 'function') {
      svg.selectAll('*').interrupt();
    }
    svg.selectAll('*').remove();

    var defs = svg.append('defs');
    var grad = defs.append('linearGradient')
      .attr('id', 'mp-progress-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isComplete ? '#58c4a6' : '#6fd8ea')
      .attr('stop-opacity', 0.24);
    grad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isComplete ? '#58c4a6' : '#6fd8ea')
      .attr('stop-opacity', 0.01);

    var g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Horizontal reference grid (0% / 50% / 100%)
    var gridG = g.append('g').attr('class', 'mp-chart-grid');
    [0, 50, 100].forEach(function (val) {
      gridG.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', yScale(val))
        .attr('y2', yScale(val));
    });

    // Grade time benchmark vertical reference lines (S 03:30 / A 06:00 / 限 09:00)
    var benchG = g.append('g').attr('class', 'mp-chart-benchmarks');
    for (var bi = 0; bi < GRADE_BENCHMARKS.length; bi++) {
      var bm = GRADE_BENCHMARKS[bi];
      if (bm.sec > 0 && bm.sec <= maxT) {
        var bx = xScale(bm.sec);
        benchG.append('line')
          .attr('class', 'mp-chart-bench-line ' + bm.cls)
          .attr('x1', bx)
          .attr('x2', bx)
          .attr('y1', 0)
          .attr('y2', innerH);
        var alignRight = bx > innerW - 34;
        benchG.append('text')
          .attr('class', 'mp-chart-bench-label ' + bm.cls)
          .attr('x', alignRight ? (bx - 3) : (bx + 3))
          .attr('y', 8)
          .attr('text-anchor', alignRight ? 'end' : 'start')
          .text(bm.id === 'LIMIT' ? '限' : bm.id);
      }
    }

    // Y Axis
    var yAxis = d3Lib.axisLeft(yScale)
      .tickValues([0, 50, 100])
      .tickSize(0)
      .tickPadding(5)
      .tickFormat(function (d) { return d + '%'; });
    g.append('g')
      .attr('class', 'mp-chart-axis mp-chart-y-axis')
      .call(yAxis)
      .call(function (sel) { sel.select('.domain').remove(); });

    // X Axis (00:00 -> current or mid -> domain max / ETA)
    var midTick = (hasForecastCurve && latestPt.t >= maxT * 0.22 && latestPt.t <= maxT * 0.78)
      ? latestPt.t
      : Math.round(maxT / 2);
    var xAxis = d3Lib.axisBottom(xScale)
      .tickValues([0, midTick, maxT])
      .tickSize(3)
      .tickPadding(4)
      .tickFormat(function (d) { return formatChartMMSS(d); });
    g.append('g')
      .attr('class', 'mp-chart-axis mp-chart-x-axis')
      .attr('transform', 'translate(0,' + innerH + ')')
      .call(xAxis);

    // Area under actual curve
    var areaGen = d3Lib.area()
      .x(function (d) { return xScale(d.t); })
      .y0(innerH)
      .y1(function (d) { return yScale(d.pct); })
      .curve(d3Lib.curveMonotoneX);

    g.append('path')
      .datum(plotPoints)
      .attr('fill', 'url(#mp-progress-area-grad)')
      .attr('d', areaGen);

    // Predictive dashed trend curve (based on current completion velocity)
    var forecastToneCls = forecast.warningLevel === 'critical'
      ? ' critical'
      : (forecast.warningLevel === 'warn' ? ' warn' : '');

    if (hasForecastCurve && forecastPoints) {
      var nowX = xScale(latestPt.t);
      var nowY = yScale(latestPt.pct);
      var endX = xScale(forecastEndT);
      var endY = yScale(forecastEndPct);
      var easeOut = d3Lib.easeCubicOut || function (t) { return 1 - Math.pow(1 - t, 3); };
      var easePop = d3Lib.easeBackOut ? d3Lib.easeBackOut.overshoot(1.6) : easeOut;

      var nowDivider = g.append('line')
        .attr('class', 'mp-chart-now-divider')
        .attr('x1', nowX)
        .attr('x2', nowX)
        .attr('y1', 0)
        .attr('y2', innerH);

      var forecastPath = g.append('path')
        .attr('class', 'mp-chart-forecast-line' + forecastToneCls);

      var canTransition = shouldAnimateForecast && typeof forecastPath.transition === 'function';

      if (canTransition) {
        var animNow = Date.now();
        var prevElapsed = animNow - (uiState.missionForecastAnimAt || 0);
        var isContinuing = !forecastJustAppeared && !forceRedraw && prevElapsed > 0 && prevElapsed < 520;
        var startFrac = isContinuing ? clamp(prevElapsed / 540, 0.2, 0.85) : 0;
        var sweepDuration = isContinuing ? Math.max(200, Math.round(540 * (1 - startFrac))) : 540;
        if (!isContinuing) {
          uiState.missionForecastAnimAt = animNow;
        }
        var initX = nowX + (endX - nowX) * startFrac;
        var initY = nowY + (endY - nowY) * startFrac;
        var initPathD = 'M' + nowX + ',' + nowY + 'L' + initX + ',' + initY;

        if (!isContinuing) {
          nowDivider
            .style('opacity', 0)
            .transition()
            .duration(240)
            .ease(easeOut)
            .style('opacity', 1);
        }

        var extendTween = function () {
          return function (t) {
            var frac = startFrac + (1 - startFrac) * t;
            var cx = nowX + (endX - nowX) * frac;
            var cy = nowY + (endY - nowY) * frac;
            return 'M' + nowX + ',' + nowY + 'L' + cx + ',' + cy;
          };
        };

        // Soft sweeping glow aura behind the extending dashed trend line
        g.insert('path', '.mp-chart-forecast-line')
          .attr('class', 'mp-chart-forecast-glow')
          .attr('d', initPathD)
          .style('opacity', 0.55)
          .transition()
          .duration(sweepDuration)
          .ease(easeOut)
          .attrTween('d', extendTween)
          .transition()
          .duration(260)
          .style('opacity', 0)
          .remove();

        // Main dashed forecast line extends smoothly from current point to forecast target
        forecastPath
          .attr('d', initPathD)
          .style('opacity', isContinuing ? 0.82 : 0.35)
          .transition()
          .duration(sweepDuration)
          .ease(easeOut)
          .attrTween('d', extendTween)
          .style('opacity', 0.92);

        // Luminous leading spark riding the tip of the extending dashed curve
        g.append('circle')
          .attr('class', 'mp-chart-forecast-head')
          .attr('cx', initX)
          .attr('cy', initY)
          .attr('r', 2.8)
          .style('opacity', 0.95)
          .transition()
          .duration(sweepDuration)
          .ease(easeOut)
          .attr('cx', endX)
          .attr('cy', endY)
          .transition()
          .duration(180)
          .attr('r', 0.6)
          .style('opacity', 0)
          .remove();
      } else {
        forecastPath.attr('d', 'M' + nowX + ',' + nowY + 'L' + endX + ',' + endY);
      }

      if (!forecastCapped) {
        var etaX = endX;
        var etaY = yScale(100);
        var forecastDrop = g.append('line')
          .attr('class', 'mp-chart-forecast-drop')
          .attr('x1', etaX)
          .attr('x2', etaX)
          .attr('y1', etaY)
          .attr('y2', canTransition ? etaY : innerH);

        var forecastTarget = g.append('circle')
          .attr('class', 'mp-chart-forecast-target')
          .attr('cx', etaX)
          .attr('cy', etaY)
          .attr('r', canTransition ? 0 : 3.2);

        if (canTransition) {
          var dropDelay = Math.max(80, Math.round(sweepDuration * 0.62));
          var targetDelay = Math.max(120, Math.round(sweepDuration * 0.76));

          forecastDrop
            .style('opacity', 0)
            .transition()
            .delay(dropDelay)
            .duration(220)
            .ease(easeOut)
            .attr('y2', innerH)
            .style('opacity', 1);

          forecastTarget
            .style('opacity', 0)
            .transition()
            .delay(targetDelay)
            .duration(220)
            .ease(easePop)
            .attr('r', 3.2)
            .style('opacity', 1);

          g.append('circle')
            .attr('class', 'mp-chart-forecast-ripple')
            .attr('cx', etaX)
            .attr('cy', etaY)
            .attr('r', 2.2)
            .style('opacity', 0)
            .transition()
            .delay(targetDelay + 20)
            .duration(1)
            .style('opacity', 0.8)
            .transition()
            .duration(420)
            .ease(easeOut)
            .attr('r', 9.5)
            .style('opacity', 0)
            .remove();
        }
      }
    }

    // Main actual progress curve
    var lineGen = d3Lib.line()
      .x(function (d) { return xScale(d.t); })
      .y(function (d) { return yScale(d.pct); })
      .curve(d3Lib.curveMonotoneX);

    g.append('path')
      .datum(plotPoints)
      .attr('class', 'mp-chart-line' + (isComplete ? ' complete' : ''))
      .attr('d', lineGen);

    // Milestone node markers
    var milestonePts = points.filter(function (d) { return Boolean(d.milestone); });
    g.selectAll('circle.mp-chart-milestone')
      .data(milestonePts)
      .enter()
      .append('circle')
      .attr('class', function (d) { return 'mp-chart-milestone' + (d.pct >= 100 ? ' complete' : ''); })
      .attr('cx', function (d) { return xScale(d.t); })
      .attr('cy', function (d) { return yScale(d.pct); })
      .attr('r', 3.5);

    // Live endpoint dot
    g.append('circle')
      .attr('class', 'mp-chart-endpoint' + (isComplete ? ' complete' : ''))
      .attr('cx', xScale(latestPt.t))
      .attr('cy', yScale(latestPt.pct))
      .attr('r', 3);

    // Crosshair & focus dot (hidden until hover)
    var crosshair = g.append('line')
      .attr('class', 'mp-chart-crosshair')
      .attr('y1', 0)
      .attr('y2', innerH)
      .style('opacity', 0);

    var focusDot = g.append('circle')
      .attr('class', 'mp-chart-focus-dot')
      .attr('r', 4)
      .style('opacity', 0);

    var bisectTime = d3Lib.bisector(function (d) { return d.t; }).left;
    var hoveredMilestonePt = null;
    var overlayRect = null;

    function findNearMilestone(mx, my) {
      var best = null;
      var bestDist = 14;
      for (var mi = 0; mi < milestonePts.length; mi++) {
        var mp = milestonePts[mi];
        var d = Math.hypot(mx - xScale(mp.t), my - yScale(mp.pct));
        if (d <= bestDist) {
          bestDist = d;
          best = mp;
        }
      }
      return best;
    }

    function hideHover() {
      hoveredMilestonePt = null;
      if (overlayRect) overlayRect.style('cursor', 'crosshair');
      crosshair.style('opacity', 0);
      focusDot.style('opacity', 0);
      if (tooltipEl) tooltipEl.classList.add('hidden');
    }

    function positionTooltip(cx, cy) {
      if (!tooltipEl) return;
      var ttW = tooltipEl.offsetWidth || 128;
      var ttH = tooltipEl.offsetHeight || 30;
      var anchorX = margin.left + cx;
      var anchorY = margin.top + cy;
      var tx = (anchorX + 10 + ttW <= width - 4) ? (anchorX + 10) : Math.max(4, anchorX - ttW - 10);
      var ty = clamp(anchorY - ttH - 6, 2, Math.max(2, height - ttH - 4));
      tooltipEl.style.transform = 'translate3d(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px,0)';
    }

    function updateHover(event) {
      if (!points.length) return;
      var coords = typeof d3Lib.pointer === 'function' ? d3Lib.pointer(event, this) : [0, 0];
      var mx = clamp(coords[0], 0, innerW);
      var my = clamp(coords[1], 0, innerH);
      var targetT = xScale.invert(mx);

      var nearMs = findNearMilestone(mx, my);
      hoveredMilestonePt = nearMs;
      if (overlayRect) overlayRect.style('cursor', nearMs ? 'pointer' : 'crosshair');

      if (!nearMs && hasForecastCurve && targetT > latestPt.t) {
        var hoverT = clamp(targetT, latestPt.t, forecastEndT);
        var hoverPct = clamp(
          Math.round(latestPt.pct + forecast.ratePctPerSec * (hoverT - latestPt.t)),
          latestPt.pct,
          100
        );
        var cxF = xScale(hoverT);
        var cyF = yScale(hoverPct);
        var deltaNow = Math.max(0, Math.round(hoverT - latestPt.t));
        var warnCls = forecast.warningLevel === 'critical' ? ' critical' : (forecast.warningLevel === 'warn' ? ' warn' : '');

        crosshair
          .attr('x1', cxF)
          .attr('x2', cxF)
          .classed('forecast', true)
          .style('opacity', 1);
        focusDot
          .attr('cx', cxF)
          .attr('cy', cyF)
          .classed('milestone', false)
          .classed('forecast', true)
          .style('opacity', 1);

        if (tooltipEl) {
          var gradeLine = forecast.gradeMeta
            ? (' · ' + esc(forecast.gradeMeta.label))
            : '';
          tooltipEl.innerHTML =
            '<div class="mp-chart-tt-row">' +
              '<span>预计 ' + esc(formatChartMMSS(hoverT)) + '</span>' +
              '<span class="mp-chart-tt-pct forecast' + warnCls + '">~' + hoverPct + '%</span>' +
            '</div>' +
            '<div class="mp-chart-tt-forecast">距今 +' + esc(formatChartDuration(deltaNow)) + ' · 达标余 ' + esc(formatChartDuration(forecast.remainingSec)) + '</div>' +
            '<div class="mp-chart-tt-forecast">速率 +' + forecast.ratePerMin.toFixed(1) + '%/分' + gradeLine + '</div>' +
            (forecast.warningLevel !== 'none'
              ? ('<div class="mp-chart-tt-warn">' + (forecast.etaTotalSec > 540 ? '按当前速度将超过 09:00 上限' : ('已停滞 ' + forecast.stallSec + ' 秒，建议推进目标')) + '</div>')
              : '');
          tooltipEl.classList.remove('hidden');
          positionTooltip(cxF, cyF);
        }
        return;
      }

      var chosen = nearMs;
      if (!chosen) {
        var idx = bisectTime(points, targetT, 1);
        var p0 = points[Math.max(0, idx - 1)];
        var p1 = points[Math.min(points.length - 1, idx)];
        chosen = (!p1 || (targetT - p0.t <= p1.t - targetT)) ? p0 : p1;
      }
      if (!chosen) return;

      var cx = xScale(chosen.t);
      var cy = yScale(chosen.pct);
      crosshair
        .attr('x1', cx)
        .attr('x2', cx)
        .classed('forecast', false)
        .style('opacity', 1);
      focusDot
        .attr('cx', cx)
        .attr('cy', cy)
        .classed('milestone', Boolean(chosen.milestone))
        .classed('forecast', false)
        .style('opacity', 1);

      if (tooltipEl) {
        tooltipEl.innerHTML =
          '<div class="mp-chart-tt-row">' +
            '<span>' + esc(chosen.timeLabel || formatChartMMSS(chosen.t)) + '</span>' +
            '<span class="mp-chart-tt-pct' + (chosen.pct >= 100 ? ' complete' : '') + '">' + chosen.pct + '%</span>' +
          '</div>' +
          (chosen.milestone ? ('<div class="mp-chart-tt-milestone">' + esc(chosen.milestone) + '</div>') : '') +
          (chosen.milestone ? '<div class="mp-chart-tt-hint">点击跳转对应日志 →</div>' : '');
        tooltipEl.classList.remove('hidden');
        positionTooltip(cx, cy);
      }
    }

    overlayRect = g.append('rect')
      .attr('class', 'mp-chart-overlay')
      .attr('width', innerW)
      .attr('height', innerH)
      .on('pointermove', updateHover)
      .on('pointerenter', updateHover)
      .on('pointerleave', hideHover)
      .on('click', function (event) {
        var coords = typeof d3Lib.pointer === 'function' ? d3Lib.pointer(event, this) : [0, 0];
        var mx = clamp(coords[0], 0, innerW);
        var my = clamp(coords[1], 0, innerH);
        var clickedMs = findNearMilestone(mx, my) || hoveredMilestonePt;
        if (clickedMs) {
          jumpToMilestoneLog(clickedMs);
        }
      });
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

    // Capture full mission progress curve, milestones & branches for post-exam debrief replay
    var reviewHistory = Array.isArray(uiState.missionProgressHistory)
      ? uiState.missionProgressHistory.map(function (pt) {
          return {
            t: Number(pt.t) || 0,
            timeLabel: pt.timeLabel || formatChartMMSS(pt.t),
            pct: clamp(Math.round(Number(pt.pct) || 0), 0, 100),
            milestone: pt.milestone || null
          };
        })
      : [];
    var finalElapsed = Math.max(
      0,
      Math.round(Number(endStats.elapsedSec != null ? endStats.elapsedSec : (snap.elapsedSec || (reviewHistory.length ? reviewHistory[reviewHistory.length - 1].t : 0))))
    );
    var finalPctVal = reviewHistory.length ? reviewHistory[reviewHistory.length - 1].pct : 0;
    if (endingType === 'perfect_override' || endingType === 'kill_inspector') {
      finalPctVal = Math.max(finalPctVal, 100);
    }
    if (!reviewHistory.length) {
      reviewHistory.push({ t: 0, timeLabel: '00:00', pct: 0, milestone: null });
    }
    if (finalElapsed > reviewHistory[reviewHistory.length - 1].t || finalPctVal !== reviewHistory[reviewHistory.length - 1].pct) {
      reviewHistory.push({
        t: Math.max(finalElapsed, reviewHistory[reviewHistory.length - 1].t),
        timeLabel: formatChartMMSS(Math.max(finalElapsed, reviewHistory[reviewHistory.length - 1].t)),
        pct: finalPctVal,
        milestone: finalPctVal >= 100 ? '考场目标达成 · 脱出结算' : null
      });
    }
    var reviewPeak = 0;
    var reviewMilestones = [];
    for (var ri = 0; ri < reviewHistory.length; ri++) {
      if (reviewHistory[ri].pct > reviewPeak) reviewPeak = reviewHistory[ri].pct;
      if (reviewHistory[ri].milestone) {
        reviewMilestones.push({
          t: reviewHistory[ri].t,
          timeLabel: reviewHistory[ri].timeLabel,
          pct: reviewHistory[ri].pct,
          label: reviewHistory[ri].milestone
        });
      }
    }
    var reviewBranches = Array.isArray(snap.branches)
      ? snap.branches.map(function (b) {
          return {
            id: b.id,
            name: b.name || b.id,
            status: b.status || 'pending',
            routeTag: b.routeTag || '逻辑分支',
            updatedAt: b.updatedAt || '',
            outcome: b.outcome || b.summary || ''
          };
        })
      : [];
    var reviewSnapshot = {
      history: reviewHistory,
      elapsedSec: Math.max(finalElapsed, reviewHistory[reviewHistory.length - 1].t),
      finalPct: finalPctVal,
      peakPct: reviewPeak,
      milestones: reviewMilestones,
      branches: reviewBranches,
      avgRatePerMin: finalElapsed > 0 ? Number(((finalPctVal / finalElapsed) * 60).toFixed(1)) : 0
    };
    uiState.lastExamReview = reviewSnapshot;

    if (INFINITY.Engine && typeof INFINITY.Engine.extractFromScenario === 'function') {
      INFINITY.Engine.extractFromScenario(mappedEnding);
      var postState = getStateSafe();
      if (postState && postState.lastSettlement) {
        postState.lastSettlement.review = reviewSnapshot;
        if (customMeta) {
          postState.lastSettlement.endingType = endingType;
          postState.lastSettlement.endingTitle = customMeta.title;
          postState.lastSettlement.endingLabel = customMeta.title;
          postState.lastSettlement.summary = customMeta.summary;
          postState.lastSettlement.overridePct = Math.round(Number(endStats.overridePct != null ? endStats.overridePct : (snap.overridePct || 0)));
        }
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
    uiState.missionPanelOpen = !(global.innerWidth && global.innerWidth <= 1280);
    uiState.missionPanelExpanded = false;
    uiState.missionPanelTab = 'progress';
    uiState.missionLogFilter = 'all';
    uiState.missionProgressSig = '';
    uiState.missionLogRenderedVer = -1;
    uiState.missionLogRenderedFilter = '';
    uiState.missionCelebratedBars = {};
    uiState.missionProgressInitialized = false;
    uiState.lastCelebrationAt = 0;
    uiState.missionProgressHistory = [];
    uiState.missionHistoryVersion = 0;
    uiState.missionChartRenderedVer = -1;
    uiState.missionChartRenderedWidth = 0;
    uiState.missionChartRenderedHeight = 0;
    uiState.missionForecastVisible = false;
    uiState.missionForecastLastPct = -1;
    uiState.missionForecastAnimAt = 0;
    uiState.lastStallWarnAt = 0;
    uiState.lastStallWarnActive = false;
    syncMissionPanelCompletionState(false);
    if ($('hud25d-progress-tooltip')) $('hud25d-progress-tooltip').classList.add('hidden');
    syncMissionPanelLayout();
    uiState.radioLog = [
      {
        type: 'system',
        text: '已接入《零号回廊 · 停摆站台》2.5D 实景。WASD 移动，左键瞄准普攻，1-4 释放构筑技能，接近线索/控制台按 E，按 Enter 实时呼叫小队下令。'
      }
    ];
    renderRadioLog25D();
    setActiveRadioSpeaker('yanci', { glitch: false, signalText: 'CH-01 · 加密待命' });
    setRadioFocused(false);

    if (INFINITY.World25D && typeof INFINITY.World25D.mount === 'function') {
      uiState.world25dMounted = true;
      INFINITY.World25D.mount(viewport, state, {
        onHudTick: handleWorld25DHudTick,
        onRadioEvent: handleWorld25DRadioEvent,
        onExamEnd: handleExam25DEnd
      });
      if (typeof INFINITY.World25D.setPostFxEnabled === 'function') {
        INFINITY.World25D.setPostFxEnabled(uiState.postFxEnabled);
      }
      syncFxToggleUi();
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

  function renderSettlementReviewChart(review) {
    var host = $('settlement-progress-chart');
    var tooltipEl = $('settlement-progress-tooltip');
    if (!host || !review || !Array.isArray(review.history) || !review.history.length) return;
    var d3Lib = global.d3;
    if (!d3Lib || typeof d3Lib.select !== 'function') {
      host.innerHTML = '<div class="mp-chart-fallback">复盘折线图引擎加载中…</div>';
      return;
    }

    var width = Math.floor(host.clientWidth || 720);
    var height = Math.floor(host.clientHeight || 176);
    if (width < 120 || height < 80) return;

    var points = review.history;
    var latestPt = points[points.length - 1];
    var isComplete = latestPt.pct >= 100;
    var plotPoints = points.length === 1
      ? [points[0], { t: Math.max(points[0].t + 1, 1), timeLabel: points[0].timeLabel, pct: points[0].pct, milestone: null }]
      : points;

    var margin = { top: 14, right: 16, bottom: 22, left: 36 };
    var innerW = Math.max(80, width - margin.left - margin.right);
    var innerH = Math.max(60, height - margin.top - margin.bottom);
    var maxT = Math.max(60, latestPt.t);
    for (var bi = 0; bi < GRADE_BENCHMARKS.length; bi++) {
      if (GRADE_BENCHMARKS[bi].sec > maxT && GRADE_BENCHMARKS[bi].sec <= maxT * 1.25) {
        maxT = GRADE_BENCHMARKS[bi].sec;
        break;
      }
    }

    var xScale = d3Lib.scaleLinear().domain([0, maxT]).range([0, innerW]);
    var yScale = d3Lib.scaleLinear().domain([0, 100]).range([innerH, 0]);

    var d3Host = d3Lib.select(host);
    var svg = d3Host.select('svg.settlement-review-svg');
    if (svg.empty()) {
      svg = d3Host.insert('svg', '#settlement-progress-tooltip')
        .attr('class', 'settlement-review-svg hud25d-mp-chart-svg')
        .attr('role', 'img')
        .attr('aria-label', '本局考场任务推进复盘折线图');
    }
    svg.attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', width)
      .attr('height', height);
    svg.selectAll('*').remove();

    var defs = svg.append('defs');
    var grad = defs.append('linearGradient')
      .attr('id', 'settlement-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isComplete ? '#58c4a6' : '#6fd8ea')
      .attr('stop-opacity', 0.28);
    grad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isComplete ? '#58c4a6' : '#6fd8ea')
      .attr('stop-opacity', 0.02);

    var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var gridG = g.append('g').attr('class', 'mp-chart-grid');
    [0, 25, 50, 75, 100].forEach(function (val) {
      gridG.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', yScale(val)).attr('y2', yScale(val));
    });

    // Benchmark reference lines
    var benchG = g.append('g').attr('class', 'mp-chart-benchmarks');
    for (var bj = 0; bj < GRADE_BENCHMARKS.length; bj++) {
      var bm = GRADE_BENCHMARKS[bj];
      if (bm.sec > 0 && bm.sec <= maxT) {
        var bx = xScale(bm.sec);
        benchG.append('line')
          .attr('class', 'mp-chart-bench-line ' + bm.cls)
          .attr('x1', bx).attr('x2', bx).attr('y1', 0).attr('y2', innerH);
        var alignRight = bx > innerW - 52;
        benchG.append('text')
          .attr('class', 'mp-chart-bench-label ' + bm.cls)
          .attr('x', alignRight ? (bx - 4) : (bx + 4))
          .attr('y', 10)
          .attr('text-anchor', alignRight ? 'end' : 'start')
          .text(bm.shortLabel);
      }
    }

    var yAxis = d3Lib.axisLeft(yScale).tickValues([0, 50, 100]).tickSize(0).tickPadding(6).tickFormat(function (d) { return d + '%'; });
    g.append('g').attr('class', 'mp-chart-axis mp-chart-y-axis').call(yAxis).call(function (sel) { sel.select('.domain').remove(); });

    var xAxis = d3Lib.axisBottom(xScale)
      .tickValues([0, Math.round(maxT * 0.25), Math.round(maxT * 0.5), Math.round(maxT * 0.75), maxT])
      .tickSize(3).tickPadding(5).tickFormat(function (d) { return formatChartMMSS(d); });
    g.append('g').attr('class', 'mp-chart-axis mp-chart-x-axis').attr('transform', 'translate(0,' + innerH + ')').call(xAxis);

    var areaGen = d3Lib.area()
      .x(function (d) { return xScale(d.t); })
      .y0(innerH)
      .y1(function (d) { return yScale(d.pct); })
      .curve(d3Lib.curveMonotoneX);
    g.append('path').datum(plotPoints).attr('fill', 'url(#settlement-area-grad)').attr('d', areaGen);

    var lineGen = d3Lib.line()
      .x(function (d) { return xScale(d.t); })
      .y(function (d) { return yScale(d.pct); })
      .curve(d3Lib.curveMonotoneX);
    g.append('path').datum(plotPoints).attr('class', 'mp-chart-line' + (isComplete ? ' complete' : '')).attr('d', lineGen);

    var milestonePts = points.filter(function (d) { return Boolean(d.milestone); });
    g.selectAll('circle.mp-chart-milestone')
      .data(milestonePts)
      .enter()
      .append('circle')
      .attr('class', function (d) { return 'mp-chart-milestone' + (d.pct >= 100 ? ' complete' : ''); })
      .attr('cx', function (d) { return xScale(d.t); })
      .attr('cy', function (d) { return yScale(d.pct); })
      .attr('r', 4.2);

    g.append('circle')
      .attr('class', 'mp-chart-endpoint' + (isComplete ? ' complete' : ''))
      .attr('cx', xScale(latestPt.t))
      .attr('cy', yScale(latestPt.pct))
      .attr('r', 3.6);

    var crosshair = g.append('line').attr('class', 'mp-chart-crosshair').attr('y1', 0).attr('y2', innerH).style('opacity', 0);
    var focusDot = g.append('circle').attr('class', 'mp-chart-focus-dot').attr('r', 4.5).style('opacity', 0);
    var bisectTime = d3Lib.bisector(function (d) { return d.t; }).left;

    function hideTt() {
      crosshair.style('opacity', 0);
      focusDot.style('opacity', 0);
      if (tooltipEl) tooltipEl.classList.add('hidden');
    }

    function moveTt(event) {
      var coords = typeof d3Lib.pointer === 'function' ? d3Lib.pointer(event, this) : [0, 0];
      var mx = clamp(coords[0], 0, innerW);
      var targetT = xScale.invert(mx);
      var idx = bisectTime(points, targetT, 1);
      var p0 = points[Math.max(0, idx - 1)];
      var p1 = points[Math.min(points.length - 1, idx)];
      var chosen = (!p1 || (targetT - p0.t <= p1.t - targetT)) ? p0 : p1;
      if (!chosen) return;

      var cx = xScale(chosen.t);
      var cy = yScale(chosen.pct);
      crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 1);
      focusDot.attr('cx', cx).attr('cy', cy).classed('milestone', Boolean(chosen.milestone)).style('opacity', 1);

      if (tooltipEl) {
        tooltipEl.innerHTML =
          '<div class="mp-chart-tt-row">' +
            '<span>' + esc(chosen.timeLabel || formatChartMMSS(chosen.t)) + '</span>' +
            '<span class="mp-chart-tt-pct' + (chosen.pct >= 100 ? ' complete' : '') + '">' + chosen.pct + '%</span>' +
          '</div>' +
          (chosen.milestone ? ('<div class="mp-chart-tt-milestone">' + esc(chosen.milestone) + '</div>') : '');
        tooltipEl.classList.remove('hidden');
        var ttW = tooltipEl.offsetWidth || 130;
        var ttH = tooltipEl.offsetHeight || 30;
        var anchorX = margin.left + cx;
        var anchorY = margin.top + cy;
        var tx = (anchorX + 12 + ttW <= width - 4) ? (anchorX + 12) : Math.max(4, anchorX - ttW - 12);
        var ty = clamp(anchorY - ttH - 8, 2, Math.max(2, height - ttH - 4));
        tooltipEl.style.transform = 'translate3d(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px,0)';
      }
    }

    g.append('rect')
      .attr('class', 'mp-chart-overlay')
      .attr('width', innerW)
      .attr('height', innerH)
      .on('pointermove', moveTt)
      .on('pointerenter', moveTt)
      .on('pointerleave', hideTt);
  }

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
    var review = s.review || uiState.lastExamReview || null;

    var reviewHtml = '';
    if (review && Array.isArray(review.history) && review.history.length) {
      var triggeredBranches = (review.branches || []).filter(function (b) { return b.status && b.status !== 'pending'; });
      var branchStatusLabels = { completed: '已达成', active: '推进中', triggered: '已触发', warning: '高危警报' };
      var milestonesHtml = (review.milestones && review.milestones.length)
        ? review.milestones.map(function (ms) {
            return (
              '<li class="settlement-ms-row">' +
                '<span class="mono settlement-ms-time">' + esc(ms.timeLabel || formatChartMMSS(ms.t)) + '</span>' +
                '<span class="settlement-ms-label">' + esc(ms.label) + '</span>' +
                '<span class="mono settlement-ms-pct">' + ms.pct + '%</span>' +
              '</li>'
            );
          }).join('')
        : '<li class="settlement-empty">本局尚未达成阶段性里程碑。</li>';

      var branchesHtml = triggeredBranches.length
        ? triggeredBranches.map(function (b) {
            var stLbl = branchStatusLabels[b.status] || b.status;
            return (
              '<li class="settlement-br-row">' +
                '<div class="settlement-br-top">' +
                  '<span class="settlement-br-name">' + esc(b.name) + '</span>' +
                  '<span class="mp-branch-status status-' + esc(b.status) + '">' + esc(stLbl) + '</span>' +
                '</div>' +
                '<div class="settlement-br-desc">' + esc(b.outcome || b.routeTag) + '</div>' +
              '</li>'
            );
          }).join('')
        : '<li class="settlement-empty">本局未触发特殊逻辑分支。</li>';

      reviewHtml =
        '<section class="settlement-review" aria-label="本局考场任务推进复盘">' +
          '<div class="settlement-review-head">' +
            '<span class="settlement-review-title">考场推进复盘曲线</span>' +
            '<span class="settlement-review-meta mono">' +
              '总用时 ' + esc(formatChartMMSS(review.elapsedSec)) +
              ' · 最终 ' + review.finalPct + '%' +
              ' · 均速 +' + (review.avgRatePerMin || 0) + '%/分' +
              ' · ' + (review.milestones ? review.milestones.length : 0) + ' 个里程碑' +
            '</span>' +
          '</div>' +
          '<div id="settlement-progress-chart" class="settlement-review-chart">' +
            '<div id="settlement-progress-tooltip" class="hud25d-mp-chart-tooltip hidden" role="tooltip"></div>' +
          '</div>' +
          '<div class="settlement-review-cols">' +
            '<div class="settlement-review-col">' +
              '<h3 class="settlement-col-title">关键里程碑时间轴</h3>' +
              '<ul class="settlement-ms-list">' + milestonesHtml + '</ul>' +
            '</div>' +
            '<div class="settlement-review-col">' +
              '<h3 class="settlement-col-title">已触发逻辑分支 (' + triggeredBranches.length + '/' + (review.branches ? review.branches.length : 0) + ')</h3>' +
              '<ul class="settlement-br-list">' + branchesHtml + '</ul>' +
            '</div>' +
          '</div>' +
        '</section>';
    }

    container.innerHTML =
      '<div class="settlement-card">' +
        '<div class="settlement-hero">' +
          '<div>' +
            '<p class="eyebrow crimson">考场终局结算</p>' +
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
        reviewHtml +
        '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">' +
          '<button id="btn-return-hall" class="cta-crimson compact" type="button">返回深红漩涡大厅 →</button>' +
        '</div>' +
      '</div>';

    if (review && Array.isArray(review.history) && review.history.length) {
      global.requestAnimationFrame(function () {
        renderSettlementReviewChart(review);
      });
    }

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

    // 2.5D PostFX / Bloom toggle
    if ($('btn-fx-toggle')) {
      $('btn-fx-toggle').addEventListener('click', function () {
        playSfx('ui_tick');
        var cur = uiState.postFxEnabled;
        if (INFINITY.World25D && typeof INFINITY.World25D.isPostFxEnabled === 'function') {
          try {
            cur = Boolean(INFINITY.World25D.isPostFxEnabled());
          } catch (_) {}
        }
        var next = !cur;
        uiState.postFxEnabled = next;
        if (INFINITY.World25D && typeof INFINITY.World25D.setPostFxEnabled === 'function') {
          INFINITY.World25D.setPostFxEnabled(next);
        }
        syncFxToggleUi();
        showToast(next ? '2.5D 霓虹泛光与后期特效已开启。' : '2.5D 后期特效已关闭（纯像素直出）。');
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

    function triggerTaskGuidance(guideNode) {
      if (!guideNode) return;
      var guideKey = guideNode.getAttribute('data-guide-task');
      if (guideKey && INFINITY.World25D && typeof INFINITY.World25D.focusObjectiveTarget === 'function') {
        var focusRes = INFINITY.World25D.focusObjectiveTarget(guideKey);
        if (focusRes) {
          guideNode.classList.remove('mp-task-guided');
          void guideNode.offsetWidth;
          guideNode.classList.add('mp-task-guided');
          global.setTimeout(function () {
            guideNode.classList.remove('mp-task-guided');
          }, 900);
        }
      }
    }

    if ($('hud25d-mission-progress-list')) {
      $('hud25d-mission-progress-list').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var guideNode = e.target && e.target.closest ? e.target.closest('[data-guide-task]') : null;
        if (!guideNode) return;
        e.preventDefault();
        triggerTaskGuidance(guideNode);
      });
    }

    // Delegated clicks inside Hall view, Loadout rail & Exam HUD
    document.addEventListener('click', function (e) {
      var guideNode = e.target && e.target.closest ? e.target.closest('[data-guide-task]') : null;
      if (guideNode) {
        triggerTaskGuidance(guideNode);
        return;
      }

      var target = e.target && e.target.closest ? e.target.closest('button') : null;
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

      // Mission side panel tab switch
      if (target.hasAttribute('data-mission-tab')) {
        playSfx('ui_tick');
        uiState.missionPanelTab = target.getAttribute('data-mission-tab') || 'progress';
        syncMissionPanelLayout();
        if (uiState.lastSnapshot) {
          renderMissionPanel25D(uiState.lastSnapshot, true);
        }
        return;
      }

      // Mission log category filter
      if (target.hasAttribute('data-mission-filter')) {
        playSfx('ui_tick');
        uiState.missionLogFilter = target.getAttribute('data-mission-filter') || 'all';
        syncMissionPanelLayout();
        if (uiState.lastSnapshot) {
          renderMissionPanel25D(uiState.lastSnapshot, true);
        }
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

    // Mission Progress & Historical Log Side Panel controls
    if ($('btn-toggle-mission-panel')) {
      $('btn-toggle-mission-panel').addEventListener('click', function () {
        playSfx('ui_tick');
        uiState.missionPanelOpen = !uiState.missionPanelOpen;
        if (!uiState.missionPanelOpen) uiState.missionPanelExpanded = false;
        syncMissionPanelLayout();
      });
    }
    if ($('btn-mission-collapse')) {
      $('btn-mission-collapse').addEventListener('click', function () {
        playSfx('ui_tick');
        uiState.missionPanelOpen = false;
        uiState.missionPanelExpanded = false;
        syncMissionPanelLayout();
      });
    }
    if ($('hud25d-mission-collapsed-tab')) {
      $('hud25d-mission-collapsed-tab').addEventListener('click', function () {
        playSfx('ui_tick');
        uiState.missionPanelOpen = true;
        syncMissionPanelLayout();
      });
    }
    if ($('btn-mission-expand')) {
      $('btn-mission-expand').addEventListener('click', function () {
        playSfx('ui_tick');
        uiState.missionPanelOpen = true;
        uiState.missionPanelExpanded = !uiState.missionPanelExpanded;
        syncMissionPanelLayout();
      });
    }

    // Observe chart container resizes for responsive D3 redraws
    var chartHost = $('hud25d-progress-chart');
    if (chartHost && typeof global.ResizeObserver === 'function' && !uiState.missionChartResizeObserver) {
      uiState.missionChartResizeObserver = new global.ResizeObserver(function () {
        if (uiState.currentScene === 'exam' && uiState.missionPanelOpen && uiState.missionPanelTab === 'progress') {
          renderMissionProgressChart25D(true);
        }
      });
      uiState.missionChartResizeObserver.observe(chartHost);
    } else if (chartHost) {
      global.addEventListener('resize', function () {
        if (uiState.currentScene === 'exam' && uiState.missionPanelOpen && uiState.missionPanelTab === 'progress') {
          renderMissionProgressChart25D(true);
        }
      });
    }

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

    // Global Enter / Escape / L shortcuts during 2.5D Exam
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
        if (uiState.missionPanelExpanded) {
          uiState.missionPanelExpanded = false;
          syncMissionPanelLayout();
          return;
        }
      }

      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !isAnyModalOpen()) {
        var tagL = document.activeElement && document.activeElement.tagName;
        if (tagL !== 'INPUT' && tagL !== 'TEXTAREA' && tagL !== 'SELECT') {
          e.preventDefault();
          playSfx('ui_tick');
          uiState.missionPanelOpen = !uiState.missionPanelOpen;
          if (!uiState.missionPanelOpen) uiState.missionPanelExpanded = false;
          syncMissionPanelLayout();
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

    syncFxToggleUi();

    var shouldAutostart = false;
    try {
      var params = new URLSearchParams(global.location && global.location.search ? global.location.search : '');
      shouldAutostart = params.get('autostart') === '1';
    } catch (_) {}

    if (shouldAutostart && INFINITY.Engine && typeof INFINITY.Engine.enterScenario === 'function') {
      uiState.lastFeedCount = 0;
      INFINITY.Engine.enterScenario('station_zero');
    }

    renderAll(getStateSafe());
  }

  INFINITY.UI = {
    init: init,
    render: renderAll,
    renderMissionPanel: renderMissionPanel25D,
    showToast: showToast,
    openAiModal: openAiModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
