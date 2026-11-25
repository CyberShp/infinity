/* ============================================================================
 * Infinity Living Simulator — Deterministic Rule Engine
 * Attaches window.INFINITY.Engine (classic script, zero ES module imports)
 * Strictly enforces item ownership, permission tiers, resource clamping,
 * bloodline fusion, Hall social/sparring, and Exam 2 (Station Zero) state.
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  var STORAGE_KEY = 'infinity_sim_state_v1';
  var TIER_LIST = ['D', 'C', 'B', 'A', 'S'];
  var TIER_RANK = { D: 0, C: 1, B: 2, A: 3, S: 4 };

  var PROCEDURAL_FUSION_RULES = {
    D: { nextTier: 'C', extraCost: 30, reqGrade: 'C', bonus: { phy: 1, agi: 1, obs: 1, wil: 1, energy: 10 } },
    C: { nextTier: 'B', extraCost: 90, reqGrade: 'B', bonus: { phy: 2, agi: 2, obs: 2, wil: 2, energy: 20 } },
    B: { nextTier: 'A', extraCost: 240, reqGrade: 'A', bonus: { phy: 3, agi: 3, obs: 3, wil: 3, energy: 35 } }
  };

  // Curated starter presets (each strictly <= 150 points from SHOP_CATALOG)
  var PRESET_BUILDS = {
    sword_guard: {
      id: 'sword_guard',
      name: '剑意控防流',
      desc: '先天剑骨 + 宵练剑意 + 画地界封控 + 抗声模因耳塞（总计 148 分）',
      items: ['B026', 'C001', 'C002', 'C005', 'A008', 'G001']
    },
    cyber_recon: {
      id: 'cyber_recon',
      name: '赛博侦察破局流',
      desc: '军用神经底盘 + PKE/热成像双侦 + 门禁破解 + 战术手雷与注连绳（总计 148 分）',
      items: ['B041', 'T004', 'T006', 'T008', 'T002', 'M002', 'G001']
    },
    occult_control: {
      id: 'occult_control',
      name: '道门诡异收容流',
      desc: '道门守心体 + 黄金小匣 + 画地界 + 模因手册与无网拍立得（总计 143 分）',
      items: ['B027', 'A002', 'C005', 'A003', 'A004', 'G001']
    }
  };

  // Fallback Station Zero blueprint if scenario_station_zero.js is not yet loaded
  var FALLBACK_STATION_ZERO = {
    id: 'station_zero',
    title: '《零号回廊 · 停摆站台》',
    subtitle: '规则异常 · 封闭地下换乘站',
    startNode: 'concourse',
    maxTurns: 24,
    trainCycleTurns: 5,
    nodes: [
      { id: 'concourse', name: '候车中庭', code: 'S-01', x: 0.18, y: 0.30, neighbors: ['ticket_gate', 'security_room'], desc: '穹顶渗水，电子时刻表停在 23:45，广播杂音断续。', clues: ['CLUE_TIMETABLE'] },
      { id: 'ticket_gate', name: '检票长廊', code: 'S-02', x: 0.48, y: 0.25, neighbors: ['concourse', 'platform_main', 'control_booth'], desc: '十二道锈蚀闸机半开，地面留有潮湿的检票钳划痕。', clues: ['CLUE_TICKET_STUB'] },
      { id: 'control_booth', name: '轨控值班室', code: 'S-03', x: 0.80, y: 0.26, neighbors: ['ticket_gate', 'signal_tunnel'], desc: '控制台指示灯暗红闪烁，录音磁带机仍在低速空转。', clues: ['CLUE_FAKE_BROADCAST'] },
      { id: 'security_room', name: '安检暗室', code: 'S-04', x: 0.22, y: 0.72, neighbors: ['concourse', 'platform_main'], desc: 'X光传送带静止，防爆柜内残留旧批次考生留下的血字折页。', clues: ['CLUE_INSPECTOR_RULE'] },
      { id: 'platform_main', name: '零号主站台', code: 'S-05', x: 0.52, y: 0.72, neighbors: ['ticket_gate', 'security_room', 'signal_tunnel'], desc: '黄线外漆黑一片，每十五分钟传出极低频铁轨共振。', clues: ['CLUE_RAIL_RESONANCE'] },
      { id: 'signal_tunnel', name: '信号检修隧道', code: 'S-06', x: 0.84, y: 0.70, neighbors: ['control_booth', 'platform_main'], desc: '潮湿冷风裹挟铁锈味，尽头矗立着停摆的手动道岔与应急封存锚点。', clues: ['CLUE_MANUAL_SWITCH'] }
    ],
    clues: [
      { id: 'CLUE_TIMETABLE', nodeId: 'concourse', title: '停摆时刻表', summary: '物理机械表与站台电子屏相差 17 秒，电子屏读数不可信。' },
      { id: 'CLUE_TICKET_STUB', nodeId: 'ticket_gate', title: '打孔残票', summary: '检票员只对“未持有效凭证却发出高声响”的目标触发必杀判定。' },
      { id: 'CLUE_FAKE_BROADCAST', nodeId: 'control_booth', title: '拟态广播母带', summary: '催促“立刻登上进站列车”的播报源自站内异常体伪造，真撤离口在人工道岔。' },
      { id: 'CLUE_INSPECTOR_RULE', nodeId: 'security_room', title: '安检血字折页', summary: '结界/盐线/阵牌可短时阻断检票员跨区追踪，但强光会激怒其进入冲锋。' },
      { id: 'CLUE_RAIL_RESONANCE', nodeId: 'platform_main', title: '铁轨低频共振', summary: '列车进站前 1 回合噪声阈值减半，必须保持静默或躲入结界。' },
      { id: 'CLUE_MANUAL_SWITCH', nodeId: 'signal_tunnel', title: '手动道岔应急锁', summary: '同步切断假广播并扳动应急道岔，可开启真·安全撤离通道。' }
    ],
    enemy: {
      id: 'inspector',
      name: '无面检票员',
      startNode: 'signal_tunnel',
      patrolRoute: ['signal_tunnel', 'platform_main', 'ticket_gate', 'control_booth', 'ticket_gate', 'concourse', 'security_room', 'platform_main']
    },
    initialNpcPositions: {
      yanci: 'concourse',
      lujin: 'ticket_gate',
      xutan: 'security_room',
      shenyan: 'platform_main'
    },
    crises: [
      {
        id: 'CRISIS_INSPECTOR_AMBUSH',
        title: '检票钳贴面逼近',
        countdownSec: 10,
        threatText: '黑暗中响起金属检票钳清脆的咬合声，无面检票员已锁定你的呼吸频率，三秒内将完成“无票处决”判定！',
        suggestedCounters: ['展开画地界/注连绳阻断', '投掷闪光或烟雾弹脱离', '亮出打孔残票并屏息后撤']
      },
      {
        id: 'CRISIS_FAKE_BOARDING',
        title: '拟态系统强征广播',
        countdownSec: 12,
        threatText: '刺耳的电流声炸响，拟态播报以死考系统音色下令：“全体考生立即跨过黄线登车，违者抹杀！”认知压迫正撕扯你的理智。',
        suggestedCounters: ['启用抗声模因耳塞/守心稳神', '核对物理机械表识破假播报', '借助严辞/许檀的加密频道反制']
      }
    ]
  };

  var state = null;
  var listeners = [];

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------
  function clamp(val, min, max) {
    var n = Number(val);
    if (isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function clampInt(val, min, max) {
    return Math.round(clamp(val, min, max));
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function nowTimeStr() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }

  function hasPermission(playerPerm, reqTier) {
    var p = TIER_RANK[String(playerPerm || 'D').toUpperCase()];
    var r = TIER_RANK[String(reqTier || 'D').toUpperCase()];
    if (p === undefined) p = 0;
    if (r === undefined) r = 0;
    return p >= r;
  }

  function getCatalog() {
    return Array.isArray(INFINITY.SHOP_CATALOG) ? INFINITY.SHOP_CATALOG : [];
  }

  function getCatalogMap() {
    var list = getCatalog();
    var map = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id) map[list[i].id] = list[i];
    }
    return map;
  }

  function getFusionRecipes() {
    return Array.isArray(INFINITY.FUSION_RECIPES) ? INFINITY.FUSION_RECIPES : [];
  }

  function getCast() {
    return INFINITY.CAST && typeof INFINITY.CAST === 'object' ? INFINITY.CAST : {};
  }

  function getWorldFeedList() {
    return Array.isArray(INFINITY.WORLD_FEED) ? INFINITY.WORLD_FEED : [];
  }

  // Safe Audio & Canvas bridges
  function safeAudio(method) {
    try {
      var audio = INFINITY.Audio;
      if (audio && typeof audio[method] === 'function') {
        var args = Array.prototype.slice.call(arguments, 1);
        audio[method].apply(audio, args);
      }
    } catch (e) {
      // Never let audio errors interrupt deterministic rules
    }
  }

  function safeCanvas(method) {
    try {
      var canvas = INFINITY.Canvas;
      if (canvas && typeof canvas[method] === 'function') {
        var args = Array.prototype.slice.call(arguments, 1);
        canvas[method].apply(canvas, args);
      }
    } catch (e) {
      // Never let canvas errors interrupt deterministic rules
    }
  }

  function syncAudioAndCanvas(pulseNodeId, pulseColor, pulseLabel, shakeIntensity) {
    if (!state) return;
    if (state.mode === 'exam' && state.exam) {
      var threat = clamp(state.exam.threat, 0, 100);
      safeAudio('setThreatLevel', threat);
      if (state.exam.activeCrisis) {
        safeAudio('setScene', 'crisis');
      } else if (threat >= 55) {
        safeAudio('setScene', 'station_tense');
      } else {
        safeAudio('setScene', 'station_calm');
      }
      safeCanvas('updateTacticalState', state);
      if (pulseNodeId) {
        safeCanvas('triggerPulse', pulseNodeId, pulseColor || '#58c4a6', pulseLabel || '');
      }
      if (shakeIntensity && shakeIntensity > 0) {
        safeCanvas('triggerShake', shakeIntensity);
      }
    } else if (state.mode === 'settlement') {
      safeAudio('setScene', 'settlement');
    } else {
      safeAudio('setScene', 'hall');
    }
  }

  // ---------------------------------------------------------------------------
  // Scenario Normalization (handles both Array and Object-Map nodes/clues/crises)
  // ---------------------------------------------------------------------------
  function getScenarioDef(scenarioId) {
    var id = scenarioId || 'station_zero';
    var raw = INFINITY.SCENARIOS && INFINITY.SCENARIOS[id];
    return raw || FALLBACK_STATION_ZERO;
  }

  function normalizeNodes(rawNodes) {
    var list = [];
    var byId = Object.create(null);
    if (!rawNodes) return { list: list, byId: byId };

    if (Array.isArray(rawNodes)) {
      for (var i = 0; i < rawNodes.length; i++) {
        var n = rawNodes[i];
        if (!n || !n.id) continue;
        var copy = clone(n);
        copy.neighbors = Array.isArray(copy.neighbors)
          ? copy.neighbors
          : (Array.isArray(copy.links) ? copy.links : (Array.isArray(copy.exits) ? copy.exits : []));
        list.push(copy);
        byId[copy.id] = copy;
      }
    } else if (typeof rawNodes === 'object') {
      var keys = Object.keys(rawNodes);
      for (var k = 0; k < keys.length; k++) {
        var nid = keys[k];
        var item = rawNodes[nid];
        if (!item || typeof item !== 'object') continue;
        var obj = clone(item);
        if (!obj.id) obj.id = nid;
        obj.neighbors = Array.isArray(obj.neighbors)
          ? obj.neighbors
          : (Array.isArray(obj.links) ? obj.links : (Array.isArray(obj.exits) ? obj.exits : []));
        list.push(obj);
        byId[obj.id] = obj;
      }
    }
    return { list: list, byId: byId };
  }

  function normalizeClues(rawClues) {
    var list = [];
    var byId = Object.create(null);
    if (!rawClues) return { list: list, byId: byId };

    if (Array.isArray(rawClues)) {
      for (var i = 0; i < rawClues.length; i++) {
        var c = rawClues[i];
        if (!c || !c.id) continue;
        var copy = clone(c);
        list.push(copy);
        byId[copy.id] = copy;
      }
    } else if (typeof rawClues === 'object') {
      var keys = Object.keys(rawClues);
      for (var k = 0; k < keys.length; k++) {
        var cid = keys[k];
        var item = rawClues[cid];
        if (!item || typeof item !== 'object') continue;
        var obj = clone(item);
        if (!obj.id) obj.id = cid;
        list.push(obj);
        byId[obj.id] = obj;
      }
    }
    return { list: list, byId: byId };
  }

  function normalizeCrises(rawCrises) {
    var list = [];
    var byId = Object.create(null);
    if (!rawCrises) return { list: list, byId: byId };

    if (Array.isArray(rawCrises)) {
      for (var i = 0; i < rawCrises.length; i++) {
        var cr = rawCrises[i];
        if (!cr) continue;
        var copy = clone(cr);
        if (!copy.id) copy.id = 'CRISIS_' + (i + 1);
        list.push(copy);
        byId[copy.id] = copy;
      }
    } else if (typeof rawCrises === 'object') {
      var keys = Object.keys(rawCrises);
      for (var k = 0; k < keys.length; k++) {
        var crId = keys[k];
        var item = rawCrises[crId];
        if (!item || typeof item !== 'object') continue;
        var obj = clone(item);
        if (!obj.id) obj.id = crId;
        list.push(obj);
        byId[obj.id] = obj;
      }
    }
    return { list: list, byId: byId };
  }

  // ---------------------------------------------------------------------------
  // State Creation, Derived Stats, Persistence & Subscription
  // ---------------------------------------------------------------------------
  function buildInitialRelationships() {
    var cast = getCast();
    var rels = {};
    var ids = Object.keys(cast);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var c = cast[id];
      rels[id] = {
        trust: clampInt(c.initialTrust != null ? c.initialTrust : 30, 0, 100),
        caution: clampInt(c.initialCaution != null ? c.initialCaution : 50, 0, 100),
        bond: clampInt(c.initialBond != null ? c.initialBond : 10, 0, 100),
        interactions: 0,
        lastNote: c.statusText || '',
        memories: []
      };
    }
    return rels;
  }

  function recalcDerivedStats(player, topUpInHall) {
    if (!player) return;
    var base = player.baseStats || { phy: 10, agi: 10, obs: 10, wil: 10 };
    var phy = Number(base.phy) || 10;
    var agi = Number(base.agi) || 10;
    var obs = Number(base.obs) || 10;
    var wil = Number(base.wil) || 10;
    var energyBonus = 0;

    var loadout = Array.isArray(player.loadout) ? player.loadout : [];
    for (var i = 0; i < loadout.length; i++) {
      var it = loadout[i];
      if (!it || !it.powerDelta) continue;
      phy += Number(it.powerDelta.phy) || 0;
      agi += Number(it.powerDelta.agi) || 0;
      obs += Number(it.powerDelta.obs) || 0;
      wil += Number(it.powerDelta.wil) || 0;
      energyBonus += Number(it.powerDelta.energy) || 0;
    }

    var maxHp = Math.max(80, 100 + Math.max(0, (phy - 10) * 6));
    var maxEnergy = Math.max(60, 100 + energyBonus);
    var maxSanity = Math.max(80, 100 + Math.max(0, (wil - 10) * 4));

    player.derivedStats = {
      phy: phy,
      agi: agi,
      obs: obs,
      wil: wil,
      maxHp: maxHp,
      maxEnergy: maxEnergy,
      maxSanity: maxSanity
    };

    player.maxHp = maxHp;
    player.maxEnergy = maxEnergy;
    player.maxSanity = maxSanity;

    if (topUpInHall) {
      player.hp = maxHp;
      player.energy = maxEnergy;
      player.sanity = maxSanity;
    } else {
      player.hp = clampInt(player.hp, 0, maxHp);
      player.energy = clampInt(player.energy, 0, maxEnergy);
      player.sanity = clampInt(player.sanity, 0, maxSanity);
    }
  }

  function createFreshState(options) {
    var opts = options && typeof options === 'object' ? options : {};
    var startPoints = opts.startPoints != null ? clampInt(opts.startPoints, 0, 99999) : 150;
    var perm = TIER_RANK[String(opts.permission || 'C').toUpperCase()] !== undefined
      ? String(opts.permission || 'C').toUpperCase()
      : 'C';

    var s = {
      version: 1,
      mode: 'hall',
      cycle: 1,
      player: {
        name: String(opts.playerName || '林彻').trim().slice(0, 20) || '林彻',
        callsign: String(opts.callsign || 'CN-10302').trim().slice(0, 20) || 'CN-10302',
        points: startPoints,
        permission: perm,
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
        sanity: 100,
        maxSanity: 100,
        baseStats: { phy: 10, agi: 10, obs: 10, wil: 10 },
        derivedStats: { phy: 10, agi: 10, obs: 10, wil: 10, maxHp: 100, maxEnergy: 100, maxSanity: 100 },
        loadout: [],
        cooldowns: {},
        examsCleared: 1,
        history: []
      },
      relationships: buildInitialRelationships(),
      worldFeed: {
        unlockedCount: Math.min(4, getWorldFeedList().length || 4),
        customBulletins: []
      },
      hallLog: [
        {
          id: 'LOG_INIT',
          time: nowTimeStr(),
          type: 'system',
          speaker: '空间大厅 · 血色漩涡',
          text: '腕表冷却完毕。你当前持有 ' + startPoints + ' 积分与 ' + perm + ' 级兑换权限。第二场死考《零号回廊 · 停摆站台》备战窗口已开启。'
        }
      ],
      sparringStats: { count: 0, lastResult: null },
      exam: null,
      lastSettlement: null
    };

    recalcDerivedStats(s.player, true);
    return s;
  }

  function ensureCastRelationships() {
    if (!state) return;
    if (!state.relationships || typeof state.relationships !== 'object') {
      state.relationships = {};
    }
    var cast = getCast();
    var ids = Object.keys(cast);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (!state.relationships[id]) {
        var c = cast[id];
        state.relationships[id] = {
          trust: clampInt(c.initialTrust != null ? c.initialTrust : 30, 0, 100),
          caution: clampInt(c.initialCaution != null ? c.initialCaution : 50, 0, 100),
          bond: clampInt(c.initialBond != null ? c.initialBond : 10, 0, 100),
          interactions: 0,
          lastNote: c.statusText || '',
          memories: []
        };
      }
    }
  }

  function emit(eventName, detail) {
    var evt = { type: eventName || 'state:change', detail: detail || null, ts: Date.now() };
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](state, evt);
      } catch (err) {
        // Isolate subscriber errors
      }
    }
  }

  function save() {
    if (!state) return false;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  function load() {
    try {
      if (!global.localStorage) return null;
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.player) return null;
      state = parsed;
      ensureCastRelationships();
      recalcDerivedStats(state.player, state.mode === 'hall');
      return state;
    } catch (e) {
      return null;
    }
  }

  function init() {
    if (!load()) {
      state = createFreshState();
      save();
    }
    syncAudioAndCanvas();
    emit('engine:init');
    return state;
  }

  function reset(options) {
    state = createFreshState(options);
    save();
    syncAudioAndCanvas();
    emit('engine:reset', options || null);
    return state;
  }

  function getState() {
    if (!state) init();
    return state;
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function unsubscribe() {
      var idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function pushHallLog(type, speaker, text, meta) {
    if (!state) return null;
    var entry = {
      id: 'HL_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      time: nowTimeStr(),
      type: type || 'info',
      speaker: speaker || '系统',
      text: String(text || ''),
      meta: meta || null
    };
    state.hallLog.unshift(entry);
    if (state.hallLog.length > 60) state.hallLog.length = 60;
    return entry;
  }

  function pushExamLog(type, speaker, text, meta) {
    if (!state || !state.exam) return null;
    var entry = {
      id: 'EL_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      turn: state.exam.turn,
      time: nowTimeStr(),
      type: type || 'narration',
      speaker: speaker || '考场记录',
      text: String(text || ''),
      meta: meta || null
    };
    state.exam.log.push(entry);
    if (state.exam.log.length > 100) {
      state.exam.log.shift();
    }
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Owned Item Helpers
  // ---------------------------------------------------------------------------
  function getOwnedMap() {
    var map = Object.create(null);
    var loadout = (state && state.player && state.player.loadout) || [];
    for (var i = 0; i < loadout.length; i++) {
      if (loadout[i] && loadout[i].id) map[loadout[i].id] = loadout[i];
    }
    return map;
  }

  function findOwnedByRoleOrTag(roles, tagKeywords) {
    var loadout = (state && state.player && state.player.loadout) || [];
    for (var i = 0; i < loadout.length; i++) {
      var it = loadout[i];
      if (!it) continue;
      if (roles && it.activeSkill && roles.indexOf(it.activeSkill.role) >= 0) return it;
      if (tagKeywords && Array.isArray(it.tags)) {
        for (var j = 0; j < tagKeywords.length; j++) {
          if (it.tags.indexOf(tagKeywords[j]) >= 0) return it;
        }
      }
      if (tagKeywords && it.name) {
        for (var k = 0; k < tagKeywords.length; k++) {
          if (it.name.indexOf(tagKeywords[k]) >= 0) return it;
        }
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Shop, Presets, Refund & Bloodline Fusion
  // ---------------------------------------------------------------------------
  function queryShop(filters) {
    if (!state) init();
    var f = filters && typeof filters === 'object' ? filters : {};
    var catalog = getCatalog();
    var q = f.q ? String(f.q).trim().toLowerCase() : '';
    var cat = f.category && f.category !== 'all' ? String(f.category) : '';
    var tier = f.tier && f.tier !== 'all' ? String(f.tier).toUpperCase() : '';
    var tag = f.tag ? String(f.tag).trim().toLowerCase() : '';
    var canonOnly = !!f.canonOnly;
    var affordableOnly = !!f.affordableOnly;
    var permittedOnly = !!f.permittedOnly;
    var points = state.player.points;
    var perm = state.player.permission;

    var results = [];
    for (var i = 0; i < catalog.length; i++) {
      var item = catalog[i];
      if (!item) continue;
      if (cat && item.category !== cat) continue;
      if (tier && String(item.tier).toUpperCase() !== tier) continue;
      if (canonOnly && !item.canon) continue;
      if (permittedOnly && !hasPermission(perm, item.tier)) continue;
      if (affordableOnly) {
        var minCost = item.discountable ? Math.max(1, Math.round(item.price * 0.6)) : item.price;
        if (minCost > points) continue;
      }
      if (tag) {
        var tagHit = false;
        if (Array.isArray(item.tags)) {
          for (var t = 0; t < item.tags.length; t++) {
            if (String(item.tags[t]).toLowerCase().indexOf(tag) >= 0) {
              tagHit = true;
              break;
            }
          }
        }
        if (!tagHit) continue;
      }
      if (q) {
        var hay = [
          item.id,
          item.name,
          item.desc,
          item.source,
          item.categoryLabel,
          item.energyType,
          Array.isArray(item.tags) ? item.tags.join(' ') : ''
        ].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) continue;
      }
      results.push(item);
    }

    if (f.sortBy === 'price_asc') {
      results.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    } else if (f.sortBy === 'price_desc') {
      results.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    } else if (f.sortBy === 'tier_asc') {
      results.sort(function (a, b) { return (TIER_RANK[a.tier] || 0) - (TIER_RANK[b.tier] || 0); });
    } else if (f.sortBy === 'tier_desc') {
      results.sort(function (a, b) { return (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0); });
    }

    return results;
  }

  function buyItem(itemId, discounted) {
    if (!state) init();
    if (state.mode !== 'hall') {
      return { ok: false, error: '考场锁定期间无法连接血色漩涡兑换终端。' };
    }
    var map = getCatalogMap();
    var item = map[itemId];
    if (!item) {
      return { ok: false, error: '未在兑换目录中找到条目：' + itemId };
    }

    var owned = getOwnedMap();
    if (owned[itemId]) {
      return { ok: false, error: '你已持有「' + item.name + '」，不可重复兑换。' };
    }

    if (!hasPermission(state.player.permission, item.tier)) {
      return {
        ok: false,
        error: '权限不足：「' + item.name + '」需要 ' + item.tier + ' 级权限（当前 ' + state.player.permission + ' 级）。'
      };
    }

    var useDiscount = !!discounted;
    if (useDiscount && !item.discountable) {
      return { ok: false, error: '「' + item.name + '」不支持 60% 折价限次兑换。' };
    }

    var cost = useDiscount ? Math.max(1, Math.round(item.price * 0.6)) : item.price;
    if (state.player.points < cost) {
      return {
        ok: false,
        error: '积分不足：需要 ' + cost + ' 分，当前仅剩 ' + state.player.points + ' 分。'
      };
    }

    state.player.points -= cost;
    var ownedCopy = clone(item);
    ownedCopy.discounted = useDiscount;
    ownedCopy.paidPrice = cost;
    ownedCopy.drawbackFlag = useDiscount;
    ownedCopy.drawbackNote = useDiscount
      ? '折价限次/高反噬版（能量消耗+20%，高压下可能触发副作用）'
      : (item.drawback || '');
    ownedCopy.acquiredInCycle = state.cycle;
    ownedCopy.refundable = true;

    state.player.loadout.push(ownedCopy);
    recalcDerivedStats(state.player, true);

    pushHallLog(
      'shop',
      '兑换终端',
      '已兑换「' + item.name + '」' + (useDiscount ? '（60%折价限次版）' : '') + '，消耗 ' + cost + ' 积分，剩余 ' + state.player.points + ' 积分。',
      { itemId: item.id, cost: cost, discounted: useDiscount }
    );

    safeAudio('playSfx', 'vortex_buy');
    save();
    emit('shop:buy', { item: ownedCopy, cost: cost, discounted: useDiscount });
    return { ok: true, item: ownedCopy, cost: cost, remainingPoints: state.player.points };
  }

  function refundItem(itemId) {
    if (!state) init();
    if (state.mode !== 'hall') {
      return { ok: false, error: '仅可在空间大厅备战期退换装备。' };
    }
    var loadout = state.player.loadout;
    var idx = -1;
    for (var i = 0; i < loadout.length; i++) {
      if (loadout[i] && loadout[i].id === itemId) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      return { ok: false, error: '当前配置中未找到该条目。' };
    }

    var target = loadout[idx];
    var paid = Number(target.paidPrice != null ? target.paidPrice : target.price) || 0;
    var rate = target.refundable && target.acquiredInCycle === state.cycle ? 1.0 : 0.8;
    var refundAmount = Math.floor(paid * rate);

    loadout.splice(idx, 1);
    state.player.points += refundAmount;
    recalcDerivedStats(state.player, true);

    pushHallLog(
      'shop',
      '兑换终端',
      '已退还「' + target.name + '」，返还 ' + refundAmount + ' 积分（' + Math.round(rate * 100) + '%），当前积分 ' + state.player.points + '。',
      { itemId: target.id, refundAmount: refundAmount }
    );

    safeAudio('playSfx', 'ui_tick');
    save();
    emit('shop:refund', { itemId: itemId, refundAmount: refundAmount });
    return { ok: true, itemId: itemId, refundAmount: refundAmount, remainingPoints: state.player.points };
  }

  function applyPresetBuild(presetId) {
    if (!state) init();
    if (state.mode !== 'hall') {
      return { ok: false, error: '仅可在空间大厅备战期套用预设方案。' };
    }
    var preset = PRESET_BUILDS[presetId];
    if (!preset) {
      return { ok: false, error: '未知的预设流派：' + presetId };
    }

    // Refund current-cycle prep items cleanly before applying preset
    var toRefund = [];
    for (var i = 0; i < state.player.loadout.length; i++) {
      var it = state.player.loadout[i];
      if (it && it.refundable && it.acquiredInCycle === state.cycle) {
        toRefund.push(it.id);
      }
    }
    for (var r = 0; r < toRefund.length; r++) {
      refundItem(toRefund[r]);
    }

    var bought = [];
    var skipped = [];
    var totalSpent = 0;

    for (var j = 0; j < preset.items.length; j++) {
      var id = preset.items[j];
      var res = buyItem(id, false);
      if (res.ok) {
        bought.push(res.item);
        totalSpent += res.cost;
      } else {
        skipped.push({ itemId: id, reason: res.error });
      }
    }

    pushHallLog(
      'shop',
      '战术配装方案',
      '已载入预设「' + preset.name + '」：成功购入 ' + bought.length + ' 项（共消耗 ' + totalSpent + ' 积分，剩余 ' + state.player.points + ' 积分）。',
      { presetId: presetId, boughtCount: bought.length, totalSpent: totalSpent }
    );

    save();
    emit('shop:preset', { presetId: presetId, bought: bought, skipped: skipped, totalSpent: totalSpent });
    return {
      ok: bought.length > 0,
      preset: preset,
      bought: bought,
      skipped: skipped,
      totalSpent: totalSpent,
      remainingPoints: state.player.points
    };
  }

  function isBloodlineItem(item) {
    if (!item) return false;
    if (item.category === 'bloodline') return true;
    if (Array.isArray(item.tags)) {
      return item.tags.indexOf('血统') >= 0 || item.tags.indexOf('融合血统') >= 0;
    }
    return false;
  }

  function fuseBloodlines(idA, idB) {
    if (!state) init();
    if (state.mode !== 'hall') {
      return { ok: false, error: '血统融合必须在空间大厅的血色漩涡下完成。' };
    }
    if (!idA || !idB || idA === idB) {
      return { ok: false, error: '请选择两项不同的已持有血统进行融合。' };
    }

    var owned = getOwnedMap();
    var itemA = owned[idA];
    var itemB = owned[idB];
    if (!itemA || !itemB) {
      return { ok: false, error: '融合材料不足：你必须同时持有这两项血统。' };
    }

    // 1. Check curated fusion recipes first
    var recipes = getFusionRecipes();
    var matchedRecipe = null;
    for (var i = 0; i < recipes.length; i++) {
      var rec = recipes[i];
      if (!rec || !Array.isArray(rec.inputs) || rec.inputs.length !== 2) continue;
      if (
        (rec.inputs[0] === idA && rec.inputs[1] === idB) ||
        (rec.inputs[0] === idB && rec.inputs[1] === idA)
      ) {
        matchedRecipe = rec;
        break;
      }
    }

    var fusedItem = null;
    var extraCost = 0;

    if (matchedRecipe) {
      if (!hasPermission(state.player.permission, matchedRecipe.reqGrade)) {
        return {
          ok: false,
          error: '权限不足：配方「' + matchedRecipe.result.name + '」需要 ' + matchedRecipe.reqGrade + ' 级权限。'
        };
      }
      extraCost = Number(matchedRecipe.extraCost) || 0;
      if (state.player.points < extraCost) {
        return {
          ok: false,
          error: '积分不足：定制融合需额外支付 ' + extraCost + ' 积分。'
        };
      }
      fusedItem = clone(matchedRecipe.result);
      fusedItem.category = fusedItem.category || 'bloodline';
      fusedItem.categoryLabel = fusedItem.categoryLabel || '融合血统';
      fusedItem.fused = true;
      fusedItem.curatedFusion = true;
      fusedItem.sourceInputs = [idA, idB];
      fusedItem.drawbackFlag = !!fusedItem.drawback;
      fusedItem.drawbackNote = fusedItem.drawback || '';
    } else {
      // 2. Procedural same-tier bloodline fusion (D+D->C, C+C->B, B+B->A)
      if (!isBloodlineItem(itemA) || !isBloodlineItem(itemB)) {
        return { ok: false, error: '常规融合仅支持两项血统/体质类条目。' };
      }
      var tierA = String(itemA.tier || '').toUpperCase();
      var tierB = String(itemB.tier || '').toUpperCase();
      if (tierA !== tierB) {
        return { ok: false, error: '非配方融合要求两项血统处于同一等阶（当前：' + tierA + ' 与 ' + tierB + '）。' };
      }
      var rule = PROCEDURAL_FUSION_RULES[tierA];
      if (!rule) {
        return { ok: false, error: tierA + ' 级血统已达程序化融合上限，需专属配方。' };
      }
      if (!hasPermission(state.player.permission, rule.reqGrade)) {
        return {
          ok: false,
          error: '权限不足：升阶至 ' + rule.nextTier + ' 级融合血统需要 ' + rule.reqGrade + ' 级权限。'
        };
      }
      extraCost = rule.extraCost;
      if (state.player.points < extraCost) {
        return {
          ok: false,
          error: '积分不足：同阶融合需额外支付 ' + extraCost + ' 积分。'
        };
      }

      var pdA = itemA.powerDelta || {};
      var pdB = itemB.powerDelta || {};
      var mergedTags = ['融合血统'];
      var rawTags = (itemA.tags || []).concat(itemB.tags || []);
      for (var t = 0; t < rawTags.length; t++) {
        if (mergedTags.indexOf(rawTags[t]) < 0 && mergedTags.length < 6) {
          mergedTags.push(rawTags[t]);
        }
      }

      var shortA = String(itemA.name || '').slice(0, 4);
      var shortB = String(itemB.name || '').slice(0, 4);
      var sortedIds = [idA, idB].sort();

      fusedItem = {
        id: 'FUS_PROC_' + sortedIds[0] + '_' + sortedIds[1],
        name: shortA + '·' + shortB + '共鸣体',
        canon: false,
        category: 'bloodline',
        categoryLabel: '融合血统',
        tier: rule.nextTier,
        source: '跨体系同阶融合',
        price: (Number(itemA.price) || 0) + (Number(itemB.price) || 0) + extraCost,
        discountable: false,
        desc: '由「' + itemA.name + '」与「' + itemB.name + '」跨体系淬炼而成的 ' + rule.nextTier + ' 级复合血统，兼具双侧特性并形成互锁制衡。',
        tags: mergedTags,
        powerDelta: {
          phy: Math.ceil(((pdA.phy || 0) + (pdB.phy || 0)) * 0.75) + rule.bonus.phy,
          agi: Math.ceil(((pdA.agi || 0) + (pdB.agi || 0)) * 0.75) + rule.bonus.agi,
          obs: Math.ceil(((pdA.obs || 0) + (pdB.obs || 0)) * 0.75) + rule.bonus.obs,
          wil: Math.ceil(((pdA.wil || 0) + (pdB.wil || 0)) * 0.75) + rule.bonus.wil,
          energy: Math.ceil(((pdA.energy || 0) + (pdB.energy || 0)) * 0.8) + rule.bonus.energy
        },
        energyType: itemA.energyType === itemB.energyType ? itemA.energyType : (itemA.energyType + '/' + itemB.energyType),
        activeSkill: {
          cost: 14 + TIER_RANK[rule.nextTier] * 4,
          cooldown: 2,
          role: (itemA.activeSkill && itemA.activeSkill.role !== 'passive')
            ? itemA.activeSkill.role
            : ((itemB.activeSkill && itemB.activeSkill.role) || 'control')
        },
        drawback: '双体系超频时将产生排异震荡（理智与精力额外消耗）。',
        drawbackFlag: true,
        drawbackNote: '双体系超频时将产生排异震荡（理智与精力额外消耗）。',
        fused: true,
        curatedFusion: false,
        sourceInputs: [idA, idB]
      };
    }

    // Consume materials & points
    state.player.points -= extraCost;
    var paidTotal = (Number(itemA.paidPrice || itemA.price) || 0) + (Number(itemB.paidPrice || itemB.price) || 0) + extraCost;
    fusedItem.paidPrice = paidTotal;
    fusedItem.acquiredInCycle = state.cycle;
    fusedItem.refundable = false;

    state.player.loadout = state.player.loadout.filter(function (it) {
      return it && it.id !== idA && it.id !== idB;
    });
    state.player.loadout.push(fusedItem);
    recalcDerivedStats(state.player, true);

    pushHallLog(
      'fusion',
      '血统融合实验室',
      '融合成功！「' + itemA.name + '」+「' + itemB.name + '」→ ' + fusedItem.tier + ' 级「' + fusedItem.name + '」（消耗 ' + extraCost + ' 积分）。',
      { resultId: fusedItem.id, curated: !!fusedItem.curatedFusion }
    );

    safeAudio('playSfx', 'fusion');
    save();
    emit('shop:fusion', { result: fusedItem, consumed: [idA, idB], extraCost: extraCost });
    return { ok: true, result: fusedItem, extraCost: extraCost, remainingPoints: state.player.points };
  }

  // ---------------------------------------------------------------------------
  // Profile, Hall Social, Sparring & World Feed
  // ---------------------------------------------------------------------------
  function setPlayerProfile(patch) {
    if (!state) init();
    if (!patch || typeof patch !== 'object') return { ok: false, error: '无效的档案更新。' };

    if (patch.name != null) {
      var n = String(patch.name).trim().slice(0, 20);
      if (n) state.player.name = n;
    }
    if (patch.callsign != null) {
      var c = String(patch.callsign).trim().slice(0, 20);
      if (c) state.player.callsign = c;
    }

    safeAudio('playSfx', 'ui_tick');
    save();
    emit('profile:update', { player: state.player });
    return { ok: true, player: state.player };
  }

  function applyRelationshipDeltas(npcId, trustD, cautionD, bondD, memoryNote) {
    ensureCastRelationships();
    var rel = state.relationships[npcId];
    if (!rel) return null;

    var td = clampInt(trustD || 0, -10, 10);
    var cd = clampInt(cautionD || 0, -10, 10);
    var bd = clampInt(bondD || 0, -8, 8);

    rel.trust = clampInt(rel.trust + td, 0, 100);
    rel.caution = clampInt(rel.caution + cd, 0, 100);
    rel.bond = clampInt(rel.bond + bd, 0, 100);
    rel.interactions = (rel.interactions || 0) + 1;

    if (memoryNote && String(memoryNote).trim()) {
      var note = String(memoryNote).trim().slice(0, 120);
      rel.lastNote = note;
      rel.memories = Array.isArray(rel.memories) ? rel.memories : [];
      rel.memories.unshift({ cycle: state.cycle, note: note, time: nowTimeStr() });
      if (rel.memories.length > 12) rel.memories.length = 12;
    }

    return { trustDelta: td, cautionDelta: cd, bondDelta: bd, current: clone(rel) };
  }

  function buildOfflineHallReply(npc, userText) {
    var txt = String(userText || '');
    var trustDelta = 2;
    var cautionDelta = -1;
    var bondDelta = 1;
    var reply = npc.hallOpeningHook || ('「' + npc.name + '」短暂停下手中动作，看了你一眼：“先把下一场的保命底牌配齐再谈合作。”');

    if (/合作|分工|战术|掩护|规则|线索/.test(txt)) {
      trustDelta = 4;
      cautionDelta = -3;
      bondDelta = 2;
      reply = '“思路够清楚。进场后别把所有筹码押在单一体系上——我会盯住我的防区，剩下的控场窗口交给你。”';
    } else if (/情报|广播|站台|异常|检票/.test(txt)) {
      trustDelta = 3;
      cautionDelta = -2;
      bondDelta = 1;
      reply = '“公共频道里刚流过风声：封闭轨道类考场最忌盲信系统口播。进场后先对物理表，再动脚。”';
    } else if (/试探|威胁|不信|底牌|交出/.test(txt)) {
      trustDelta = -4;
      cautionDelta = 6;
      bondDelta = -2;
      reply = '“把语气收一收。在空间大厅里亮爪子没意义，真到了死考里，谁能活下来靠的不是虚张声势。”';
    }

    return {
      reply: reply,
      emotion: trustDelta >= 0 ? 'composed' : 'guarded',
      trustDelta: trustDelta,
      cautionDelta: cautionDelta,
      bondDelta: bondDelta,
      memoryNote: '大厅交谈：' + (txt.slice(0, 28) || '简短交换了备战情报')
    };
  }

  function talkInHall(npcId, userText) {
    if (!state) init();
    var cast = getCast();
    var npc = cast[npcId];
    if (!npc) {
      return Promise.resolve({ ok: false, error: '未找到指定角色：' + npcId });
    }
    if (npc.canMeetInHall === false) {
      return Promise.resolve({ ok: false, error: npc.name + '当前不在空间大厅公共区。' });
    }

    var cleanText = String(userText || '').trim().slice(0, 260);
    if (!cleanText) {
      return Promise.resolve({ ok: false, error: '请输入你想说的话。' });
    }

    ensureCastRelationships();
    var ctx = {
      npc: clone(npc),
      relationship: clone(state.relationships[npcId]),
      player: {
        name: state.player.name,
        callsign: state.player.callsign,
        permission: state.player.permission,
        points: state.player.points,
        loadout: state.player.loadout.map(function (it) { return { id: it.id, name: it.name, tier: it.tier, category: it.category }; })
      },
      userText: cleanText,
      cycle: state.cycle
    };

    var aiPromise;
    if (INFINITY.AI && typeof INFINITY.AI.generateHallInteraction === 'function') {
      aiPromise = Promise.resolve().then(function () {
        return INFINITY.AI.generateHallInteraction(ctx);
      }).catch(function () {
        return buildOfflineHallReply(npc, cleanText);
      });
    } else {
      aiPromise = Promise.resolve(buildOfflineHallReply(npc, cleanText));
    }

    return aiPromise.then(function (rawRes) {
      var res = rawRes && typeof rawRes === 'object' ? rawRes : buildOfflineHallReply(npc, cleanText);
      var replyText = String(res.reply || res.line || res.text || npc.hallOpeningHook || '……').trim().slice(0, 420);
      var applied = applyRelationshipDeltas(
        npcId,
        res.trustDelta,
        res.cautionDelta,
        res.bondDelta,
        res.memoryNote || ('大厅对话：' + cleanText.slice(0, 32))
      );

      pushHallLog('player', state.player.name + ' → ' + npc.name, cleanText, { npcId: npcId });
      var feedEntry = pushHallLog('dialogue', npc.name, replyText, {
        npcId: npcId,
        emotion: res.emotion || 'composed',
        deltas: applied
      });

      safeAudio('playSfx', 'ui_tick');
      save();
      emit('hall:talk', { npcId: npcId, feedEntry: feedEntry, deltas: applied });

      return {
        ok: true,
        npcId: npcId,
        reply: replyText,
        feedEntry: feedEntry,
        deltas: applied,
        relationship: applied ? applied.current : state.relationships[npcId]
      };
    });
  }

  function runSparringTest(itemId) {
    if (!state) init();
    if (state.mode !== 'hall') {
      return { ok: false, error: '训练靶场仅在空间大厅开放。' };
    }

    var owned = getOwnedMap();
    var focusItem = null;
    if (itemId) {
      focusItem = owned[itemId];
      if (!focusItem) {
        return { ok: false, error: '你未持有该装备，无法在靶场进行实战测试。' };
      }
    }

    var ds = state.player.derivedStats;
    var loadout = state.player.loadout;
    var roles = { control: 0, defense: 0, burst: 0, mobility: 0, recon: 0, support: 0, passive: 0 };
    var drawbackCount = 0;

    for (var i = 0; i < loadout.length; i++) {
      var it = loadout[i];
      if (it.activeSkill && it.activeSkill.role && roles[it.activeSkill.role] !== undefined) {
        roles[it.activeSkill.role] += 1;
      }
      if (it.drawbackFlag) drawbackCount += 1;
    }

    var combatPower = Math.round(ds.phy * 2.4 + ds.agi * 2.2 + ds.obs * 1.8 + ds.wil * 2.0 + loadout.length * 6);
    var survivalIndex = clampInt(45 + (roles.defense + roles.control + roles.support) * 12 + (ds.wil - 10) * 3 - drawbackCount * 4, 20, 99);
    var reconIndex = clampInt(35 + roles.recon * 18 + (ds.obs - 10) * 4, 15, 99);

    var focusLine = focusItem
      ? '重点校测「' + focusItem.name + '」（' + focusItem.tier + ' 级 / ' + focusItem.energyType + '）响应稳定' + (focusItem.drawbackFlag ? '，但检测到折价限次反噬波动。' : '，能量回路无异常。')
      : '全装综合演练完成：已配置 ' + loadout.length + ' 项条目。';

    var advice = survivalIndex < 65
      ? '建议补充结界/抗模因或治疗手段，以应对规则杀考场。'
      : (reconIndex < 60 ? '侦察读数偏低，建议在考场内配合许檀或增配探测道具。' : '控防与侦察结构均衡，已具备硬拆 C–B 级规则考场的底气。');

    var result = {
      focusItemId: focusItem ? focusItem.id : null,
      combatPower: combatPower,
      survivalIndex: survivalIndex,
      reconIndex: reconIndex,
      drawbackCount: drawbackCount,
      summary: focusLine + ' 综合战力 ' + combatPower + ' · 规则抗压 ' + survivalIndex + '% · 侦察敏锐 ' + reconIndex + '%。' + advice
    };

    state.sparringStats.count = (state.sparringStats.count || 0) + 1;
    state.sparringStats.lastResult = result;

    pushHallLog('sparring', '训练靶场 · 演练报告', result.summary, result);
    safeAudio('playSfx', 'blade_ring');
    save();
    emit('hall:spar', result);
    return { ok: true, result: result };
  }

  function advanceWorldFeed() {
    if (!state) init();
    var all = getWorldFeedList();
    var total = all.length;
    var wf = state.worldFeed || { unlockedCount: 0, customBulletins: [] };
    var newlyUnlocked = null;

    if (wf.unlockedCount < total) {
      newlyUnlocked = all[wf.unlockedCount];
      wf.unlockedCount += 1;
    } else if (total > 0) {
      // Cycle spotlight on latest bulletin
      newlyUnlocked = all[total - 1];
    }

    state.worldFeed = wf;
    if (newlyUnlocked) {
      pushHallLog('world', '世界脉动 · ' + newlyUnlocked.source, '【' + newlyUnlocked.title + '】' + newlyUnlocked.body, { feedId: newlyUnlocked.id });
    }

    safeAudio('playSfx', 'broadcast_static');
    save();
    emit('world:feed', { bulletin: newlyUnlocked, unlockedCount: wf.unlockedCount });
    return { ok: true, bulletin: newlyUnlocked, unlockedCount: wf.unlockedCount, total: total };
  }

  // ---------------------------------------------------------------------------
  // Exam 2: Station Zero — Deterministic Rules, Enemy AI, Clamping & Crisis
  // ---------------------------------------------------------------------------
  function buildDefaultNodeStates(nodesList) {
    var map = {};
    for (var i = 0; i < nodesList.length; i++) {
      var n = nodesList[i];
      map[n.id] = {
        warded: false,
        marked: false,
        blackout: false,
        cleared: false,
        wardName: '',
        label: '',
        effects: []
      };
    }
    return map;
  }

  function buildInitialNpcPositions(scenario, nodesList) {
    var cast = getCast();
    var pos = {};
    var presetPos = scenario.initialNpcPositions || {};
    var nodeIds = nodesList.map(function (n) { return n.id; });
    var fallbackIdx = 0;

    var castIds = Object.keys(cast);
    for (var i = 0; i < castIds.length; i++) {
      var id = castIds[i];
      var c = cast[id];
      // Canon squad MUST NEVER appear inside Station Zero!
      if (!c || c.inStationZero !== true) continue;
      if (presetPos[id] && nodeIds.indexOf(presetPos[id]) >= 0) {
        pos[id] = presetPos[id];
      } else if (nodeIds.length > 0) {
        pos[id] = nodeIds[fallbackIdx % nodeIds.length];
        fallbackIdx++;
      }
    }
    return pos;
  }

  function enterScenario(scenarioId) {
    if (!state) init();
    var id = scenarioId || 'station_zero';
    var scenario = getScenarioDef(id);
    var normNodes = normalizeNodes(scenario.nodes);
    var startNode = (scenario.startNode && normNodes.byId[scenario.startNode])
      ? scenario.startNode
      : (normNodes.list[0] ? normNodes.list[0].id : 'concourse');

    var enemyCfg = scenario.enemy || FALLBACK_STATION_ZERO.enemy;
    var enemyStart = (enemyCfg.startNode && normNodes.byId[enemyCfg.startNode])
      ? enemyCfg.startNode
      : (normNodes.list[normNodes.list.length - 1] ? normNodes.list[normNodes.list.length - 1].id : 'signal_tunnel');

    recalcDerivedStats(state.player, true);
    state.player.cooldowns = {};

    state.mode = 'exam';
    state.exam = {
      scenarioId: id,
      title: scenario.title || '《零号回廊 · 停摆站台》',
      subtitle: scenario.subtitle || '规则异常考场',
      turn: 1,
      maxTurns: Number(scenario.maxTurns) || 24,
      trainCycleTurns: Number(scenario.trainCycleTurns) || 5,
      trainCountdown: Number(scenario.trainCycleTurns) || 5,
      currentNode: startNode,
      visitedNodes: [startNode],
      sound: 10,
      threat: 15,
      cluesFound: [],
      overrideProgress: 0,
      rulesVerified: [],
      falseBroadcastsSeen: 0,
      crisisSurvived: 0,
      nodeStates: buildDefaultNodeStates(normNodes.list),
      npcPositions: buildInitialNpcPositions(scenario, normNodes.list),
      enemy: {
        id: enemyCfg.id || 'inspector',
        name: enemyCfg.name || '无面检票员',
        nodeId: enemyStart,
        detected: false,
        alertLevel: 15,
        stunnedTurns: 0,
        patrolIndex: 0,
        patrolRoute: Array.isArray(enemyCfg.patrolRoute) && enemyCfg.patrolRoute.length > 0
          ? enemyCfg.patrolRoute.slice()
          : normNodes.list.map(function (n) { return n.id; })
      },
      activeCrisis: null,
      sparkNotes: [],
      log: [],
      ended: false
    };

    var startDef = normNodes.byId[startNode];
    pushExamLog(
      'system',
      '考场降临 · ' + state.exam.title,
      '血色失重感退去。你正站在「' + (startDef ? startDef.name : startNode) + '」。' + (startDef && startDef.desc ? startDef.desc : '腕表冷光跳动，铁轨深处隐约传来低频共振。')
    );

    syncAudioAndCanvas(startNode, '#7ca7d9', '降临点');
    save();
    emit('exam:enter', { scenarioId: id, currentNode: startNode });
    return { ok: true, exam: state.exam };
  }

  function findNextStepToward(byId, fromId, targetId) {
    if (fromId === targetId) return fromId;
    var queue = [[fromId]];
    var visited = Object.create(null);
    visited[fromId] = true;

    while (queue.length > 0) {
      var path = queue.shift();
      var curr = path[path.length - 1];
      var node = byId[curr];
      if (!node || !Array.isArray(node.neighbors)) continue;
      for (var i = 0; i < node.neighbors.length; i++) {
        var nb = node.neighbors[i];
        if (visited[nb]) continue;
        var nextPath = path.concat([nb]);
        if (nb === targetId) return nextPath[1] || targetId;
        visited[nb] = true;
        queue.push(nextPath);
      }
    }
    return fromId;
  }

  function triggerCrisisFromTemplate(crisisInput) {
    if (!state || !state.exam) return null;
    var scenario = getScenarioDef(state.exam.scenarioId);
    var normCrises = normalizeCrises(scenario.crises || FALLBACK_STATION_ZERO.crises);

    var template = null;
    if (typeof crisisInput === 'string' && normCrises.byId[crisisInput]) {
      template = normCrises.byId[crisisInput];
    } else if (crisisInput && typeof crisisInput === 'object') {
      template = {
        id: crisisInput.id || 'CRISIS_DYNAMIC_' + state.exam.turn,
        title: String(crisisInput.title || '突发致命危机').slice(0, 40),
        countdownSec: clampInt(crisisInput.countdownSec != null ? crisisInput.countdownSec : 10, 5, 20),
        threatText: String(crisisInput.threatText || '高危规则实体已锁定你的位置，立即做出反制！').slice(0, 260),
        suggestedCounters: Array.isArray(crisisInput.suggestedCounters) && crisisInput.suggestedCounters.length > 0
          ? crisisInput.suggestedCounters.slice(0, 4).map(function (s) { return String(s).slice(0, 60); })
          : ['动用护身/控场道具', '就地屏息后撤', '呼应队友火力掩护']
      };
    } else {
      template = normCrises.list[0] || FALLBACK_STATION_ZERO.crises[0];
    }

    state.exam.activeCrisis = clone(template);
    state.exam.activeCrisis.countdownSec = clampInt(state.exam.activeCrisis.countdownSec || 10, 5, 20);
    state.exam.activeCrisis.startedAt = Date.now();

    pushExamLog('crisis', '⚡ 秒级反应窗口 · ' + state.exam.activeCrisis.title, state.exam.activeCrisis.threatText);
    safeAudio('playSfx', 'crisis_freeze');
    syncAudioAndCanvas(state.exam.currentNode, '#e04f4f', '危机锁定', 0.85);
    return state.exam.activeCrisis;
  }

  function tickExamWorld(normNodes) {
    var exam = state.exam;
    if (!exam) return;

    exam.turn += 1;

    // Tick item cooldowns
    var cds = state.player.cooldowns || {};
    var cdKeys = Object.keys(cds);
    for (var c = 0; c < cdKeys.length; c++) {
      cds[cdKeys[c]] = Math.max(0, (cds[cdKeys[c]] || 0) - 1);
      if (cds[cdKeys[c]] === 0) delete cds[cdKeys[c]];
    }

    // Train cycle countdown (15-min resonance pulse)
    exam.trainCountdown -= 1;
    if (exam.trainCountdown <= 0) {
      exam.trainCountdown = exam.trainCycleTurns || 5;
      exam.threat = clampInt(exam.threat + 8, 0, 100);
      exam.falseBroadcastsSeen += 1;
      pushExamLog(
        'broadcast',
        '【疑似拟态广播】',
        '站台喇叭炸出刺耳静电：“零号列车已进站，请全体考生立刻跨过黄线登车——” 腕表倒计时纹丝未动。'
      );
      safeAudio('playSfx', 'broadcast_static');
      if (exam.currentNode === 'platform_main' && exam.sound >= 35 && !exam.activeCrisis) {
        triggerCrisisFromTemplate('CRISIS_FAKE_BOARDING');
      }
    }

    // Natural sound decay
    exam.sound = clampInt(exam.sound - 3, 0, 100);

    // Enemy patrol / hunting AI
    var enemy = exam.enemy;
    if (enemy) {
      if (enemy.stunnedTurns > 0) {
        enemy.stunnedTurns -= 1;
        pushExamLog('system', '敌情监控', enemy.name + '仍处于封锁/僵直状态（剩余 ' + enemy.stunnedTurns + ' 回合）。');
      } else {
        var nextEnemyNode = enemy.nodeId;
        var hunting = exam.sound >= 45 || exam.threat >= 55;
        if (hunting) {
          nextEnemyNode = findNextStepToward(normNodes.byId, enemy.nodeId, exam.currentNode);
        } else if (Array.isArray(enemy.patrolRoute) && enemy.patrolRoute.length > 0) {
          enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolRoute.length;
          var candidate = enemy.patrolRoute[enemy.patrolIndex];
          if (normNodes.byId[candidate]) nextEnemyNode = candidate;
        }

        // Ward check: warded nodes repel/slow the Inspector once
        var targetState = exam.nodeStates[nextEnemyNode];
        if (targetState && targetState.warded && nextEnemyNode !== enemy.nodeId) {
          enemy.stunnedTurns = 1;
          exam.threat = clampInt(exam.threat - 6, 0, 100);
          pushExamLog(
            'system',
            '阵法/结界生效',
            enemy.name + '试图逼近「' + (normNodes.byId[nextEnemyNode] ? normNodes.byId[nextEnemyNode].name : nextEnemyNode) + '」，被「' + (targetState.wardName || '封锁结界') + '」硬生生阻断 1 回合！'
          );
          safeCanvas('triggerPulse', nextEnemyNode, '#d4af37', '结界阻断');
        } else {
          enemy.nodeId = nextEnemyNode;
        }
      }

      enemy.alertLevel = clampInt(Math.round((exam.threat * 0.65) + (exam.sound * 0.35)), 0, 100);

      // Detection check: adjacent, same node, or player owns recon tool
      var curNodeDef = normNodes.byId[exam.currentNode];
      var isAdjacent = curNodeDef && Array.isArray(curNodeDef.neighbors) && curNodeDef.neighbors.indexOf(enemy.nodeId) >= 0;
      var hasRecon = !!findOwnedByRoleOrTag(['recon'], ['侦察', 'PKE', '热成像', '观察']);
      enemy.detected = (enemy.nodeId === exam.currentNode) || isAdjacent || (hasRecon && enemy.alertLevel >= 30);

      // Encounter check -> Crisis!
      if (enemy.nodeId === exam.currentNode && enemy.stunnedTurns <= 0 && !exam.activeCrisis) {
        var curState = exam.nodeStates[exam.currentNode];
        if (curState && curState.warded) {
          exam.threat = clampInt(exam.threat + 10, 0, 100);
          pushExamLog('system', '结界护佑', enemy.name + '在结界边缘徘徊，检票钳刮擦着边界却未能立刻破入！');
        } else {
          triggerCrisisFromTemplate('CRISIS_INSPECTOR_AMBUSH');
        }
      }
    }

    // Check max turns pressure
    if (exam.turn >= exam.maxTurns && !exam.activeCrisis) {
      exam.threat = clampInt(exam.threat + 12, 0, 100);
    }
  }

  function moveToNode(nodeId) {
    if (!state) init();
    if (state.mode !== 'exam' || !state.exam) {
      return { ok: false, error: '当前不在考场中。' };
    }
    if (state.exam.activeCrisis) {
      return { ok: false, error: '致命危机已锁定！必须先应对当前危机窗口。' };
    }

    var scenario = getScenarioDef(state.exam.scenarioId);
    var normNodes = normalizeNodes(scenario.nodes);
    var target = normNodes.byId[nodeId];
    var current = normNodes.byId[state.exam.currentNode];

    if (!target) {
      return { ok: false, error: '无效的考场节点：' + nodeId };
    }
    if (nodeId === state.exam.currentNode) {
      return { ok: false, error: '你已经位于「' + target.name + '」。' };
    }
    if (!current || !Array.isArray(current.neighbors) || current.neighbors.indexOf(nodeId) < 0) {
      return { ok: false, error: '「' + target.name + '」与当前区域不相连，无法直接移动。' };
    }

    state.exam.currentNode = nodeId;
    if (state.exam.visitedNodes.indexOf(nodeId) < 0) {
      state.exam.visitedNodes.push(nodeId);
    }

    var hasStealth = !!findOwnedByRoleOrTag(['mobility'], ['潜行', '敏捷', '暗影', '隐匿']);
    var soundAdd = hasStealth ? 3 : 7;
    state.exam.sound = clampInt(state.exam.sound + soundAdd, 0, 100);
    state.exam.threat = clampInt(state.exam.threat + 3, 0, 100);

    pushExamLog(
      'move',
      '战术转移 → ' + target.name,
      (target.desc || '你压低脚步切入该区域。') + '（声响 +' + soundAdd + '）'
    );

    safeAudio('playSfx', 'footstep');
    tickExamWorld(normNodes);
    syncAudioAndCanvas(nodeId, '#58c4a6', target.name);
    save();
    emit('exam:move', { nodeId: nodeId, node: target });
    return { ok: true, node: target, exam: state.exam };
  }

  function placeWardOrMark(nodeId, itemId) {
    if (!state) init();
    if (state.mode !== 'exam' || !state.exam) {
      return { ok: false, error: '当前不在考场中。' };
    }

    var scenario = getScenarioDef(state.exam.scenarioId);
    var normNodes = normalizeNodes(scenario.nodes);
    var targetId = nodeId || state.exam.currentNode;
    var targetNode = normNodes.byId[targetId];
    if (!targetNode) {
      return { ok: false, error: '无效的布阵节点：' + targetId };
    }

    var owned = getOwnedMap();
    var item = itemId ? owned[itemId] : findOwnedByRoleOrTag(['control', 'defense'], ['结界', '阵法', '封锁', '注连绳', '盐线', '画地界', '黄金']);
    if (!item) {
      return { ok: false, error: '你未持有可用于布设结界或空间锚点的装备。' };
    }

    var baseCost = (item.activeSkill && Number(item.activeSkill.cost)) || 12;
    var cost = item.drawbackFlag ? Math.ceil(baseCost * 1.2) : baseCost;
    if (state.player.energy < cost) {
      return { ok: false, error: '能量不足：布设「' + item.name + '」需要 ' + cost + ' 点能量。' };
    }

    state.player.energy = clampInt(state.player.energy - cost, 0, state.player.maxEnergy);
    var ns = state.exam.nodeStates[targetId] || { warded: false, marked: false, blackout: false, cleared: false, effects: [] };
    ns.warded = true;
    ns.marked = true;
    ns.wardName = item.name;
    ns.label = item.name;
    if (ns.effects.indexOf('warded') < 0) ns.effects.push('warded');
    state.exam.nodeStates[targetId] = ns;

    state.exam.threat = clampInt(state.exam.threat - 8, 0, 100);
    state.exam.sound = clampInt(state.exam.sound + 4, 0, 100);

    pushExamLog(
      'ward',
      '布阵封控 · ' + targetNode.name,
      '你消耗 ' + cost + ' 能量，在「' + targetNode.name + '」布下「' + item.name + '」，区域防线已确立（威胁 -8）。',
      { nodeId: targetId, itemId: item.id }
    );

    safeAudio('playSfx', 'ward_place');
    syncAudioAndCanvas(targetId, '#d4af37', item.name);
    save();
    emit('exam:ward', { nodeId: targetId, item: item });
    return { ok: true, nodeId: targetId, item: item, nodeState: ns };
  }

  function performQuickAction(actionId, payload) {
    if (!state) init();
    if (state.mode !== 'exam' || !state.exam) {
      return { ok: false, error: '当前不在考场中。' };
    }
    if (state.exam.activeCrisis) {
      return { ok: false, error: '必须先处理当前危机反应窗口！' };
    }

    var p = payload && typeof payload === 'object' ? payload : {};
    var scenario = getScenarioDef(state.exam.scenarioId);
    var normNodes = normalizeNodes(scenario.nodes);
    var normClues = normalizeClues(scenario.clues || FALLBACK_STATION_ZERO.clues);
    var curId = state.exam.currentNode;
    var curNode = normNodes.byId[curId];
    var act = String(actionId || '').toLowerCase();

    if (act === 'ward' || act === 'mark') {
      return placeWardOrMark(p.nodeId || curId, p.itemId);
    }

    if (act === 'extract') {
      return extractFromScenario(p.endingType || 'manual');
    }

    if (act === 'search' || act === 'inspect') {
      var foundClue = null;
      for (var i = 0; i < normClues.list.length; i++) {
        var cl = normClues.list[i];
        if (cl.nodeId === curId && state.exam.cluesFound.indexOf(cl.id) < 0) {
          foundClue = cl;
          break;
        }
      }
      state.exam.sound = clampInt(state.exam.sound + 5, 0, 100);
      if (state.exam.nodeStates[curId]) state.exam.nodeStates[curId].cleared = true;

      if (foundClue) {
        state.exam.cluesFound.push(foundClue.id);
        state.exam.threat = clampInt(state.exam.threat - 4, 0, 100);
        pushExamLog('clue', '线索勘查 · ' + foundClue.title, '你在「' + (curNode ? curNode.name : curId) + '」发现关键证据：' + foundClue.summary);
        safeAudio('playSfx', 'ui_tick');
      } else {
        pushExamLog('narration', '区域勘查 · ' + (curNode ? curNode.name : curId), '你仔细翻查了角落与缝隙，未再发现新的有效记录。');
        safeAudio('playSfx', 'ui_tick');
      }
    } else if (act === 'listen' || act === 'scan') {
      var reconItem = findOwnedByRoleOrTag(['recon'], ['侦察', 'PKE', '热成像', '观察']);
      state.exam.sound = clampInt(state.exam.sound - 4, 0, 100);
      state.exam.enemy.detected = true;
      var enemyNodeDef = normNodes.byId[state.exam.enemy.nodeId];
      pushExamLog(
        'recon',
        reconItem ? ('频段扫描 · ' + reconItem.name) : '静默倾听',
        '捕捉到金属检票钳的摩擦方位：' + state.exam.enemy.name + '当前位于「' + (enemyNodeDef ? enemyNodeDef.name : state.exam.enemy.nodeId) + '」（警戒度 ' + state.exam.enemy.alertLevel + '%）。'
      );
      safeAudio('playSfx', 'ui_tick');
      safeCanvas('triggerPulse', state.exam.enemy.nodeId, '#e07a5f', '敌情锁定');
    } else if (act === 'hide' || act === 'suppress' || act === 'stealth') {
      state.exam.sound = clampInt(state.exam.sound - 16, 0, 100);
      state.exam.threat = clampInt(state.exam.threat - 8, 0, 100);
      state.player.energy = clampInt(state.player.energy + 10, 0, state.player.maxEnergy);
      pushExamLog('narration', '屏息潜行', '你贴近承重柱阴影调整呼吸，压低一切能量外泄（声响 -16，威胁 -8，能量 +10）。');
      safeAudio('playSfx', 'ui_tick');
    } else if (act === 'decode_broadcast' || act === 'expose_broadcast') {
      var hasFreqClue = state.exam.cluesFound.indexOf('clue_broadcast_freq') >= 0;
      state.exam.falseBroadcastsSeen = (state.exam.falseBroadcastsSeen || 0) + 1;
      state.exam.threat = clampInt(state.exam.threat - (hasFreqClue ? 12 : 6), 0, 100);
      state.player.sanity = clampInt(state.player.sanity + 6, 0, state.player.maxSanity);
      if (!hasFreqClue && normClues.byId.clue_broadcast_freq) {
        state.exam.cluesFound.push('clue_broadcast_freq');
      }
      pushExamLog(
        'broadcast',
        '频段比对 · 拆解假播报',
        '你将腕表基准时钟与站台广播声纹做了 0.3 秒延迟比对：确认进站提示混杂 43.2Hz 拟态载波，属于异常体诱导登车的伪造口播！全队认知抗性提升（威胁下降，理智 +6）。'
      );
      safeAudio('playSfx', 'broadcast_static');
    } else if (act === 'override_track' || act === 'override') {
      var canOverrideHere = !!(curNode && curNode.canOverrideTrack) || curId === 'dispatch' || curId === 'substation' || curId === 'control_booth';
      if (!canOverrideHere) {
        pushExamLog(
          'narration',
          '轨控接入失败 · ' + (curNode ? curNode.name : curId),
          '当前区域没有道岔或供电接口。需前往「信号调度室」或「旧变电间」改写零号轨道极性（当前改写进度 ' + (state.exam.overrideProgress || 0) + '%）。'
        );
        safeAudio('playSfx', 'alert');
      } else {
        var boost = findOwnedByRoleOrTag(['recon'], ['黑客', '破解', '算力', '机关', '阵']) ? 50 : 35;
        state.exam.overrideProgress = clampInt((state.exam.overrideProgress || 0) + boost, 0, 100);
        state.exam.sound = clampInt(state.exam.sound + 12, 0, 100);
        state.exam.threat = clampInt(state.exam.threat + 8, 0, 100);
        pushExamLog(
          'action',
          '轨控改写 · ' + state.exam.overrideProgress + '%',
          state.exam.overrideProgress >= 100
            ? '信号继电器发出清脆合闸声！零号回廊循环轨道已被强行反接至逃生侧线——现在前往「0号站台铁轨」或点击上方撤离即可完美破局！'
            : '你切入「' + (curNode ? curNode.name : curId) + '」手动总线，强行反写道岔极性（进度推进至 ' + state.exam.overrideProgress + '%，注意声响上升）。'
        );
        safeAudio('playSfx', 'ward_place');
      }
    } else if (act === 'consult' || act === 'comms') {
      var cast = getCast();
      var nearbyNpc = null;
      var posMap = state.exam.npcPositions || {};
      var npcIds = Object.keys(posMap);
      for (var n = 0; n < npcIds.length; n++) {
        if (posMap[npcIds[n]] === curId && cast[npcIds[n]]) {
          nearbyNpc = cast[npcIds[n]];
          break;
        }
      }
      if (!nearbyNpc && cast.yanci) nearbyNpc = cast.yanci;
      state.exam.threat = clampInt(state.exam.threat - 4, 0, 100);
      if (nearbyNpc) {
        applyRelationshipDeltas(nearbyNpc.id, 2, -1, 1, '零号回廊简短战术协同');
        pushExamLog(
          'dialogue',
          nearbyNpc.name + '（加密短波）',
          '“收到你的定位。目前已知线索 ' + state.exam.cluesFound.length + ' 条，别信进站广播——优先盯紧道岔与检票员动向。”'
        );
      }
      safeAudio('playSfx', 'ui_tick');
    } else if (act === 'use_item') {
      var owned = getOwnedMap();
      var it = owned[p.itemId];
      if (!it) return { ok: false, error: '你未持有该道具：' + p.itemId };
      var role = (it.activeSkill && it.activeSkill.role) || 'passive';
      var eCost = (it.activeSkill && Number(it.activeSkill.cost)) || 8;
      if (state.player.energy < eCost) return { ok: false, error: '能量不足，无法催动「' + it.name + '」。' };
      state.player.energy = clampInt(state.player.energy - eCost, 0, state.player.maxEnergy);

      if (role === 'support' || /治疗|喷雾|止血|绷带/.test(it.name)) {
        state.player.hp = clampInt(state.player.hp + 22, 0, state.player.maxHp);
        state.player.sanity = clampInt(state.player.sanity + 10, 0, state.player.maxSanity);
        pushExamLog('action', '道具启用 · ' + it.name, '迅速处理创伤并稳住心率（生命 +22，理智 +10）。');
      } else if (role === 'control' || role === 'burst') {
        state.exam.enemy.stunnedTurns = clampInt(state.exam.enemy.stunnedTurns + 1, 0, 3);
        state.exam.sound = clampInt(state.exam.sound + 8, 0, 100);
        pushExamLog('action', '战术压制 · ' + it.name, '你借「' + it.name + '」打断异常体步调（检票员僵直 +1 回合）。');
        safeAudio('playSfx', 'blade_ring');
      } else {
        state.exam.threat = clampInt(state.exam.threat - 8, 0, 100);
        pushExamLog('action', '道具启用 · ' + it.name, '你启动「' + it.name + '」稳住局势（威胁 -8）。');
      }
    } else {
      return { ok: false, error: '未知的快捷战术指令：' + actionId };
    }

    tickExamWorld(normNodes);
    syncAudioAndCanvas(curId, '#7ca7d9', act);
    save();
    emit('exam:action', { actionId: act, exam: state.exam });
    return { ok: true, exam: state.exam };
  }

  // Offline deterministic fallback adjudicator when AI is disabled or offline
  function buildOfflineExamAdjudication(ctx) {
    var text = String(ctx.actionText || '');
    var owned = ctx.player.loadout || [];
    var used = [];
    for (var i = 0; i < owned.length; i++) {
      if (text.indexOf(owned[i].name) >= 0 || text.indexOf(owned[i].id) >= 0) {
        used.push(owned[i].id);
        break;
      }
    }
    if (used.length === 0 && owned.length > 0 && /剑|阵|探测|手雷|喷雾|耳塞|匣|破解/.test(text)) {
      used.push(owned[0].id);
    }

    var isStealth = /安静|屏息|潜行|躲|隐藏|轻手轻脚|关灯/.test(text);
    var isLoud = /炸|轰|砍|冲|喊|砸|开枪|强行/.test(text);
    var isWard = /阵|结界|画地界|盐|注连绳|封锁|标记/.test(text);
    var isSearch = /查|搜|看|听|扫|检查|分析|破解|道岔/.test(text);

    var clueUnlocked = null;
    if (isSearch && Array.isArray(ctx.nodeUndiscoveredClues) && ctx.nodeUndiscoveredClues.length > 0) {
      clueUnlocked = ctx.nodeUndiscoveredClues[0].id;
    }

    var nodeEffect = isWard ? { nodeId: ctx.currentNode.id, effect: 'warded' } : null;
    var soundDelta = isStealth ? -10 : (isLoud ? 18 : 5);
    var threatDelta = isWard ? -8 : (isLoud ? 12 : -2);
    var enemyStunTurns = (isLoud && used.length > 0) ? 1 : 0;

    var narration = '你在「' + ctx.currentNode.name + '」果断执行了指令：' + text.slice(0, 48) + '。' +
      (clueUnlocked ? '冷光扫过细节，一条此前被忽略的规则破绽浮出水面。' : '潮湿的铁锈味在空气中翻涌，你的动作精准而克制。');

    var dialogues = [];
    if (Array.isArray(ctx.presentNpcs) && ctx.presentNpcs.length > 0) {
      var speaker = ctx.presentNpcs[0];
      dialogues.push({
        npcId: speaker.id,
        line: isLoud ? '“动静太大了，准备好接下一轮反扑。”' : '“稳妥。保持这个节奏，别给检票员抓到声纹。”',
        emotion: isLoud ? 'sharp' : 'composed',
        trustDelta: isLoud ? -1 : 3,
        cautionDelta: isLoud ? 2 : -2,
        bondDelta: 1
      });
    }

    return {
      feasible: true,
      usedItems: used,
      energyCost: used.length > 0 ? 12 : 4,
      hpDelta: 0,
      sanityDelta: isLoud ? -4 : -1,
      soundDelta: soundDelta,
      threatDelta: threatDelta,
      enemyStunTurns: enemyStunTurns,
      clueUnlocked: clueUnlocked,
      nodeEffect: nodeEffect,
      narration: narration,
      dialogues: dialogues,
      systemBroadcast: null,
      sparkNote: clueUnlocked ? '你在离线高压环境下独立拆出了节点规则破绽。' : null,
      triggerCrisis: (isLoud && ctx.exam.threat >= 60) ? 'CRISIS_INSPECTOR_AMBUSH' : null
    };
  }

  function submitFreeAction(text) {
    if (!state) init();
    if (state.mode !== 'exam' || !state.exam) {
      return Promise.resolve({ ok: false, error: '当前不在考场中。' });
    }
    if (state.exam.activeCrisis) {
      return Promise.resolve({ ok: false, error: '危机反应窗口激活中，请先通过危机面板反制！' });
    }

    var cleanText = String(text || '').trim().slice(0, 320);
    if (!cleanText) {
      return Promise.resolve({ ok: false, error: '请输入你的战术行动描述。' });
    }

    var scenario = getScenarioDef(state.exam.scenarioId);
    var normNodes = normalizeNodes(scenario.nodes);
    var normClues = normalizeClues(scenario.clues || FALLBACK_STATION_ZERO.clues);
    var cast = getCast();
    var curNode = normNodes.byId[state.exam.currentNode];

    var undiscoveredHere = normClues.list.filter(function (c) {
      return c.nodeId === state.exam.currentNode && state.exam.cluesFound.indexOf(c.id) < 0;
    });

    var presentNpcs = [];
    var posMap = state.exam.npcPositions || {};
    Object.keys(posMap).forEach(function (nid) {
      if (posMap[nid] === state.exam.currentNode && cast[nid] && cast[nid].inStationZero === true) {
        presentNpcs.push(clone(cast[nid]));
      }
    });

    var ctx = {
      scenarioId: state.exam.scenarioId,
      scenarioTitle: state.exam.title,
      actionText: cleanText,
      currentNode: clone(curNode),
      neighbors: (curNode && curNode.neighbors || []).map(function (id) { return normNodes.byId[id] ? { id: id, name: normNodes.byId[id].name } : { id: id, name: id }; }),
      nodeUndiscoveredClues: clone(undiscoveredHere),
      allClues: clone(normClues.list),
      exam: clone(state.exam),
      presentNpcs: presentNpcs,
      player: {
        name: state.player.name,
        callsign: state.player.callsign,
        hp: state.player.hp,
        maxHp: state.player.maxHp,
        energy: state.player.energy,
        maxEnergy: state.player.maxEnergy,
        sanity: state.player.sanity,
        maxSanity: state.player.maxSanity,
        derivedStats: clone(state.player.derivedStats),
        loadout: state.player.loadout.map(function (it) {
          return { id: it.id, name: it.name, tier: it.tier, category: it.category, desc: it.desc, tags: it.tags, discounted: !!it.discounted };
        })
      }
    };

    var aiPromise;
    if (INFINITY.AI && typeof INFINITY.AI.adjudicateExamAction === 'function') {
      aiPromise = Promise.resolve().then(function () {
        return INFINITY.AI.adjudicateExamAction(ctx);
      }).catch(function () {
        return buildOfflineExamAdjudication(ctx);
      });
    } else {
      aiPromise = Promise.resolve(buildOfflineExamAdjudication(ctx));
    }

    return aiPromise.then(function (rawRes) {
      var res = rawRes && typeof rawRes === 'object' ? rawRes : buildOfflineExamAdjudication(ctx);
      var ownedMap = getOwnedMap();

      // 1. STRICT ownership verification: never allow AI to invent unowned items
      var rawUsed = Array.isArray(res.usedItems) ? res.usedItems : [];
      var validUsedItems = [];
      var rejectedItems = [];
      for (var i = 0; i < rawUsed.length; i++) {
        var uid = String(rawUsed[i] || '');
        if (ownedMap[uid]) {
          if (validUsedItems.indexOf(uid) < 0) validUsedItems.push(uid);
        } else if (uid) {
          rejectedItems.push(uid);
        }
      }

      // 2. Deterministic resource & delta clamping
      var energyCost = clampInt(res.energyCost != null ? res.energyCost : 0, 0, 40);
      var hasDiscountedUsed = validUsedItems.some(function (id) { return ownedMap[id] && ownedMap[id].drawbackFlag; });
      if (hasDiscountedUsed && energyCost > 0) {
        energyCost = clampInt(Math.ceil(energyCost * 1.2), 0, 45);
      }

      var hpDelta = clampInt(res.hpDelta || 0, -35, 25);
      var sanityDelta = clampInt(res.sanityDelta || 0, -25, 20);
      var soundDelta = clampInt(res.soundDelta || 0, -25, 35);
      var threatDelta = clampInt(res.threatDelta || 0, -25, 35);
      var enemyStunTurns = clampInt(res.enemyStunTurns || 0, 0, 3);

      // If player lacks energy, clamp cost and add mild backlash
      if (energyCost > state.player.energy) {
        energyCost = state.player.energy;
        sanityDelta = clampInt(sanityDelta - 4, -25, 20);
      }

      state.player.energy = clampInt(state.player.energy - energyCost, 0, state.player.maxEnergy);
      state.player.hp = clampInt(state.player.hp + hpDelta, 0, state.player.maxHp);
      state.player.sanity = clampInt(state.player.sanity + sanityDelta, 0, state.player.maxSanity);
      state.exam.sound = clampInt(state.exam.sound + soundDelta, 0, 100);
      state.exam.threat = clampInt(state.exam.threat + threatDelta, 0, 100);

      if (enemyStunTurns > 0 && state.exam.enemy) {
        state.exam.enemy.stunnedTurns = clampInt(state.exam.enemy.stunnedTurns + enemyStunTurns, 0, 4);
      }

      // 3. Log player action & AI narration
      pushExamLog('player', state.player.name, cleanText, { usedItems: validUsedItems, rejectedItems: rejectedItems });

      var narration = String(res.narration || '你的行动在站台阴影中激起一阵短促的回响。').trim().slice(0, 520);
      pushExamLog('narration', '考场裁定', narration, {
        feasible: res.feasible !== false,
        usedItems: validUsedItems,
        deltas: { energyCost: energyCost, hpDelta: hpDelta, sanityDelta: sanityDelta, soundDelta: soundDelta, threatDelta: threatDelta }
      });

      // 4. Clue validation (must exist in scenario & not duplicate)
      var unlockedClue = null;
      if (res.clueUnlocked && normClues.byId[res.clueUnlocked] && state.exam.cluesFound.indexOf(res.clueUnlocked) < 0) {
        unlockedClue = normClues.byId[res.clueUnlocked];
        state.exam.cluesFound.push(unlockedClue.id);
        pushExamLog('clue', '线索解锁 · ' + unlockedClue.title, unlockedClue.summary);
      }

      // 5. Node effect validation
      var validEffects = ['warded', 'marked', 'blackout', 'cleared'];
      if (res.nodeEffect && typeof res.nodeEffect === 'object') {
        var effNodeId = res.nodeEffect.nodeId;
        var effType = res.nodeEffect.effect;
        if (normNodes.byId[effNodeId] && validEffects.indexOf(effType) >= 0) {
          var ns = state.exam.nodeStates[effNodeId] || { warded: false, marked: false, blackout: false, cleared: false, effects: [] };
          ns[effType] = true;
          if (ns.effects.indexOf(effType) < 0) ns.effects.push(effType);
          if (effType === 'warded' && !ns.wardName) {
            ns.wardName = validUsedItems[0] && ownedMap[validUsedItems[0]] ? ownedMap[validUsedItems[0]].name : '临时结界';
          }
          state.exam.nodeStates[effNodeId] = ns;
        }
      }

      // 6. Dialogue validation (ONLY inStationZero NPCs allowed!)
      var appliedDialogues = [];
      if (Array.isArray(res.dialogues)) {
        for (var d = 0; d < res.dialogues.length; d++) {
          var dlg = res.dialogues[d];
          if (!dlg || !dlg.npcId) continue;
          var npc = cast[dlg.npcId];
          if (!npc || npc.inStationZero !== true) continue;
          var line = String(dlg.line || '').trim().slice(0, 260);
          if (!line) continue;
          var relApplied = applyRelationshipDeltas(dlg.npcId, dlg.trustDelta, dlg.cautionDelta, dlg.bondDelta, '零号回廊并肩行动');
          pushExamLog('dialogue', npc.name, line, { npcId: npc.id, emotion: dlg.emotion || 'composed', deltas: relApplied });
          appliedDialogues.push({ npcId: npc.id, line: line, deltas: relApplied });
        }
      }

      // 7. System broadcast
      if (res.systemBroadcast && res.systemBroadcast.text) {
        var isFake = !!res.systemBroadcast.fake;
        if (isFake) state.exam.falseBroadcastsSeen += 1;
        pushExamLog('broadcast', isFake ? '【异常拟态播报】' : '【死考系统播报】', String(res.systemBroadcast.text).slice(0, 240));
        safeAudio('playSfx', 'broadcast_static');
      }

      // 8. Spark note
      if (res.sparkNote && String(res.sparkNote).trim()) {
        state.exam.sparkNotes.push(String(res.sparkNote).trim().slice(0, 140));
      }

      // 9. Trigger crisis if requested
      if (res.triggerCrisis && !state.exam.activeCrisis) {
        triggerCrisisFromTemplate(res.triggerCrisis);
      }

      // 10. Tick world unless defeated
      if (state.player.hp <= 0 || state.player.sanity <= 0) {
        return extractFromScenario('fallen');
      }

      tickExamWorld(normNodes);

      var pulseColor = hpDelta < 0 ? '#e04f4f' : (unlockedClue ? '#d4af37' : '#58c4a6');
      var shake = hpDelta < -10 ? 0.65 : 0;
      syncAudioAndCanvas(state.exam.currentNode, pulseColor, unlockedClue ? '线索' : '行动', shake);
      save();
      emit('exam:free_action', {
        usedItems: validUsedItems,
        rejectedItems: rejectedItems,
        unlockedClue: unlockedClue,
        dialogues: appliedDialogues,
        exam: state.exam
      });

      return {
        ok: true,
        usedItems: validUsedItems,
        rejectedItems: rejectedItems,
        unlockedClue: unlockedClue,
        exam: state.exam
      };
    });
  }

  function buildOfflineCrisisResolution(ctx) {
    var choice = String(ctx.choiceOrText || '');
    var owned = ctx.player.loadout || [];
    var used = [];
    for (var i = 0; i < owned.length; i++) {
      if (choice.indexOf(owned[i].name) >= 0 || choice.indexOf(owned[i].id) >= 0) {
        used.push(owned[i].id);
        break;
      }
    }

    var hasCounter = used.length > 0 || /结界|耳塞|机械表|闪光|烟雾|残票|屏息|守心|道岔|结界|画地界|注连绳/.test(choice);
    var wardedHere = !!(ctx.nodeState && ctx.nodeState.warded);
    var success = hasCounter || wardedHere;

    return {
      survived: true,
      success: success,
      usedItems: used,
      hpDelta: success ? -4 : -22,
      sanityDelta: success ? -2 : -12,
      threatDelta: success ? -18 : 6,
      enemyStunTurns: success ? 2 : 0,
      narration: success
        ? '千钧一发之际，你的反制精准卡死了规则判定缝隙！金属检票钳擦着肩胛滑空，你借势拉开身位。'
        : '仓促闪避虽保住了要害，但寒意与钝痛瞬间贯穿胸口，检票员的锁定仍未完全松开。'
    };
  }

  function resolveCrisis(choiceOrText) {
    if (!state) init();
    if (state.mode !== 'exam' || !state.exam || !state.exam.activeCrisis) {
      return Promise.resolve({ ok: false, error: '当前没有激活的危机反应窗口。' });
    }

    var cleanChoice = String(choiceOrText || '').trim().slice(0, 260) || '紧急闪避';
    var crisis = clone(state.exam.activeCrisis);
    var ctx = {
      crisis: crisis,
      choiceOrText: cleanChoice,
      nodeState: clone(state.exam.nodeStates[state.exam.currentNode] || {}),
      exam: clone(state.exam),
      player: {
        name: state.player.name,
        hp: state.player.hp,
        energy: state.player.energy,
        sanity: state.player.sanity,
        derivedStats: clone(state.player.derivedStats),
        loadout: state.player.loadout.map(function (it) { return { id: it.id, name: it.name, tier: it.tier, tags: it.tags }; })
      }
    };

    var aiPromise;
    if (INFINITY.AI && typeof INFINITY.AI.adjudicateCrisis === 'function') {
      aiPromise = Promise.resolve().then(function () {
        return INFINITY.AI.adjudicateCrisis(ctx);
      }).catch(function () {
        return buildOfflineCrisisResolution(ctx);
      });
    } else {
      aiPromise = Promise.resolve(buildOfflineCrisisResolution(ctx));
    }

    return aiPromise.then(function (rawRes) {
      var res = rawRes && typeof rawRes === 'object' ? rawRes : buildOfflineCrisisResolution(ctx);
      var ownedMap = getOwnedMap();
      var validUsed = (Array.isArray(res.usedItems) ? res.usedItems : []).filter(function (id) { return !!ownedMap[id]; });

      var hpDelta = clampInt(res.hpDelta != null ? res.hpDelta : -8, -40, 10);
      var sanityDelta = clampInt(res.sanityDelta != null ? res.sanityDelta : -4, -25, 10);
      var threatDelta = clampInt(res.threatDelta != null ? res.threatDelta : -12, -30, 20);
      var stunTurns = clampInt(res.enemyStunTurns || 0, 0, 3);

      state.player.hp = clampInt(state.player.hp + hpDelta, 0, state.player.maxHp);
      state.player.sanity = clampInt(state.player.sanity + sanityDelta, 0, state.player.maxSanity);
      state.exam.threat = clampInt(state.exam.threat + threatDelta, 0, 100);
      if (stunTurns > 0 && state.exam.enemy) {
        state.exam.enemy.stunnedTurns = clampInt(state.exam.enemy.stunnedTurns + stunTurns, 0, 4);
      }

      state.exam.activeCrisis = null;
      state.exam.crisisSurvived = (state.exam.crisisSurvived || 0) + 1;

      var narration = String(res.narration || '你硬生生从秒级绝境中撕开了一道生机。').trim().slice(0, 420);
      pushExamLog('player', state.player.name + '（危机反制）', cleanChoice, { usedItems: validUsed });
      pushExamLog('narration', '危机解除', narration, { hpDelta: hpDelta, sanityDelta: sanityDelta, threatDelta: threatDelta });

      if (state.player.hp <= 0 || state.player.sanity <= 0) {
        return extractFromScenario('fallen');
      }

      safeAudio('playSfx', res.success !== false ? 'blade_ring' : 'alert');
      syncAudioAndCanvas(state.exam.currentNode, res.success !== false ? '#58c4a6' : '#e04f4f', '危机解除', res.success !== false ? 0.35 : 0.75);
      save();
      emit('exam:crisis_resolved', { crisis: crisis, usedItems: validUsed, exam: state.exam });
      return { ok: true, usedItems: validUsed, exam: state.exam };
    });
  }

  function extractFromScenario(endingType) {
    if (!state) init();
    if (!state.exam) {
      return { ok: false, error: '当前没有可结算的考场记录。' };
    }

    var exam = state.exam;
    var ending = String(endingType || 'standard');
    var clueCount = exam.cluesFound.length;

    // Auto-classify ending if 'manual' or 'auto'
    if (ending === 'manual' || ending === 'auto') {
      if (clueCount >= 4 && exam.currentNode === 'signal_tunnel') {
        ending = 'true_break';
      } else if (clueCount >= 2) {
        ending = 'tactical_extract';
      } else {
        ending = 'emergency_escape';
      }
    }

    var score = 0;
    var grade = 'C';
    var endingLabel = '常规撤离';
    var pointsReward = 80;

    if (ending === 'fallen') {
      endingLabel = '濒死强行拉回（高额修复扣费）';
      grade = 'D';
      pointsReward = 25;
      score = 35;
    } else if (ending === 'true_break') {
      endingLabel = '真·规则破局（切断拟态广播并扳动应急道岔）';
      grade = 'S';
      pointsReward = 220;
      score = 96;
    } else if (ending === 'tactical_extract') {
      endingLabel = '战术保全撤离（识破陷阱并完整带回情报）';
      grade = clueCount >= 3 && state.player.hp >= 60 ? 'A' : 'B';
      pointsReward = grade === 'A' ? 165 : 125;
      score = grade === 'A' ? 86 : 75;
    } else {
      endingLabel = '险象逃生（保留基础生存分）';
      grade = 'C';
      pointsReward = 85;
      score = 62;
    }

    // Bonus for crisis survival & remaining vitals
    var bonus = (exam.crisisSurvived || 0) * 15 + (state.player.hp >= 80 ? 15 : 0);
    if (ending === 'fallen') bonus = 0;
    var totalReward = pointsReward + bonus;

    state.player.points += totalReward;
    state.player.examsCleared += 1;
    state.cycle += 1;

    // Permission promotion on B / A / S clear
    var promotedTo = null;
    if ((grade === 'B' || grade === 'A' || grade === 'S') && TIER_RANK[state.player.permission] < TIER_RANK.B) {
      state.player.permission = 'B';
      promotedTo = 'B';
    } else if (grade === 'S' && TIER_RANK[state.player.permission] < TIER_RANK.A) {
      state.player.permission = 'A';
      promotedTo = 'A';
    }

    var settlement = {
      scenarioId: exam.scenarioId,
      title: exam.title,
      endingType: ending,
      endingLabel: endingLabel,
      grade: grade,
      score: score,
      cluesFoundCount: clueCount,
      turnsUsed: exam.turn,
      crisisSurvived: exam.crisisSurvived || 0,
      pointsReward: totalReward,
      promotedTo: promotedTo,
      sparkNotes: exam.sparkNotes.slice(),
      settledAt: nowTimeStr()
    };

    state.player.history.unshift(settlement);
    state.lastSettlement = settlement;
    state.exam.ended = true;
    state.exam.activeCrisis = null;
    state.mode = 'settlement';

    // Append dynamic bulletin to world feed
    state.worldFeed.customBulletins = state.worldFeed.customBulletins || [];
    state.worldFeed.customBulletins.unshift({
      id: 'WF_PLAYER_' + Date.now(),
      cycle: state.cycle,
      source: '战区结算播报',
      tag: '你的战绩',
      title: state.player.callsign + ' 以 ' + grade + ' 级评级走出' + exam.title,
      body: endingLabel + '。共勘破 ' + clueCount + ' 条核心线索，获授 ' + totalReward + ' 积分' + (promotedTo ? '，兑换权限晋升至 ' + promotedTo + ' 级。' : '。'),
      relatedCast: ['yanci', 'lujin', 'xutan'],
      impactHint: '返回空间大厅后可继续兑换高阶条目或进行血统融合。'
    });

    syncAudioAndCanvas();
    save();
    emit('exam:settled', settlement);
    return { ok: true, settlement: settlement };
  }

  function returnToHall() {
    if (!state) init();
    state.mode = 'hall';
    if (state.exam) state.exam.activeCrisis = null;

    // Lock prior-cycle loadout items to 80% resale rate
    for (var i = 0; i < state.player.loadout.length; i++) {
      if (state.player.loadout[i]) state.player.loadout[i].refundable = false;
    }

    recalcDerivedStats(state.player, true);
    pushHallLog(
      'system',
      '空间大厅 · 归来',
      '你已返回血色漩涡之下。当前积分 ' + state.player.points + '，兑换权限 ' + state.player.permission + ' 级。'
    );

    syncAudioAndCanvas();
    save();
    emit('hall:return', { player: state.player });
    return { ok: true, state: state };
  }

  // ---------------------------------------------------------------------------
  // Public API (strictly matching CONTRACT.md)
  // ---------------------------------------------------------------------------
  INFINITY.Engine = {
    STORAGE_KEY: STORAGE_KEY,
    PRESETS: PRESET_BUILDS,

    init: init,
    reset: reset,
    getState: getState,
    subscribe: subscribe,
    save: save,
    load: load,

    // Shop & Build
    queryShop: queryShop,
    buyItem: buyItem,
    refundItem: refundItem,
    applyPresetBuild: applyPresetBuild,
    fuseBloodlines: fuseBloodlines,
    setPlayerProfile: setPlayerProfile,

    // Hall & World
    talkInHall: talkInHall,
    runSparringTest: runSparringTest,
    advanceWorldFeed: advanceWorldFeed,

    // Exam 2: Station Zero
    enterScenario: enterScenario,
    moveToNode: moveToNode,
    performQuickAction: performQuickAction,
    submitFreeAction: submitFreeAction,
    resolveCrisis: resolveCrisis,
    placeWardOrMark: placeWardOrMark,
    extractFromScenario: extractFromScenario,
    returnToHall: returnToHall
  };
})(typeof window !== 'undefined' ? window : globalThis);
