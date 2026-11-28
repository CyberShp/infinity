/* ============================================================================
 * Infinity Living Simulator — Three.js (r147) 2.5D HD-2D Real-Time Engine
 * 《零号回廊 · 停摆站台》 Action-Tactics Engine
 * Attaches cleanly to window.INFINITY.World25D (classic script, zero ES modules)
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  // ---------------------------------------------------------------------------
  // Constants & Fallback Blueprints
  // ---------------------------------------------------------------------------
  var WALL_HEIGHT = 2.6;
  var RAIL_Y = -0.58;
  var FLOOR_Y = 0.0;
  var PLATFORM_Y = 0.04;
  var HAZARD_Y = 0.05;
  var TRAIN_X = 213.5;
  var TRAIN_CYCLE_SEC = 55;
  var TRAIN_DWELL_SEC = 10;
  var EXAM_DURATION_SEC = 540; // 9 minutes real-time compressed exam clock
  var HUD_TICK_INTERVAL = 0.1; // ~10 Hz
  var INTERACT_RANGE = 2.4;

  // Dark-horror lighting: actors are lit by the scene; only selective emissive-map
  // accents (visors, blades, lantern) self-illuminate while body fabric stays <= 0.05.
  var ACTOR_EMISSIVE_BASE = 0.24;
  var ACTOR_EMISSIVE_BOSS = 0.50;

  // Art Bible Iron Rule 1 — 2.5D top-down golden proportions:
  // Player/Squad world height 1.70-1.85m (~11%-15% viewport height);
  // Inspector Boss 1.5x player height 2.60-2.85m (~18%-23% viewport height).
  var ACTOR_DIMENSIONS = {
    player:    { width: 1.54, height: 1.78 },
    squad:     { width: 1.50, height: 1.75 },
    inspector: { width: 2.24, height: 2.70 }
  };

  var CAMERA_25D_SPEC = {
    fov: 38.0,
    offsetY: 13.4,
    offsetZ: 13.8,
    lookAtY: 0.6,
    spriteTiltRad: 0.34
  };

  // Pooled station point lights: seconds to fade a slot out/in when it is reassigned.
  var LIGHT_POOL_FADE_SEC = 0.35;
  // Station fixtures within this radius of an EMP detonation black out.
  var EMP_BLACKOUT_RADIUS = 22.0;

  // Death Exam Boss ("零号检票员") authoritative tuning & counterplay parameters
  var BOSS_DEATH_EXAM_CONFIG = {
    maxHp: 520,
    phase2Threshold: 0.55,
    ruleArmorMult: 0.58,
    ruleArmorOverride50Mult: 0.75,
    armorBrokenMult: 1.45,
    armorBreakDuration: 4.5,
    stunImmuneDuration: 2.2,
    lungeDamageP1: 56,
    lungeDamageP2: 68,
    lungeSanityP2: 14,
    lungeAllyDamageP1: 42,
    lungeAllyDamageP2: 52,
    cleaveDamageP1: 40,
    cleaveDamageP2: 48,
    cleaveSanityP2: 8,
    gazeDamage: 34,
    gazeSanityLoss: 18,
    gazeBindSec: 1.4,
    slamDamage: 46,
    slamSanityLoss: 16,
    slamRadius: 7.8
  };

  function computePlayerOrbiterCount(ownedItems, charVis) {
    if (!Array.isArray(ownedItems) || ownedItems.length === 0) {
      return 0;
    }
    var raw = Number(charVis && charVis.orbiterCount);
    if (!isFinite(raw)) raw = 1;
    return Math.max(0, Math.min(4, Math.round(raw)));
  }

  function hasPassiveReconItem(ownedItems) {
    if (!Array.isArray(ownedItems) || ownedItems.length === 0) return false;
    var reconTagSet = {
      '侦察': true, '洞察': true, '雷达': true, '热成像': true, '阴阳眼': true,
      '声呐': true, '透视': true, '预知': true, '神识': true, '天眼': true,
      '望气': true, '灵视': true, '探测': true, '扫描': true, '全知': true
    };
    var reconNameRx = /(侦察|声呐|雷达|热成像|阴阳眼|天眼|灵视|透视|洞察|望气|预知|扫描|探测|写轮眼|白眼|直死|千里眼|心眼)/;
    for (var i = 0; i < ownedItems.length; i++) {
      var it = ownedItems[i];
      if (!it) continue;
      if (it.activeSkill && it.activeSkill.role === 'recon') return true;
      if (it.archetype === 'recon_pulse') return true;
      if (Array.isArray(it.tags)) {
        for (var t = 0; t < it.tags.length; t++) {
          if (reconTagSet[String(it.tags[t])]) return true;
        }
      }
      if (typeof it.name === 'string' && reconNameRx.test(it.name)) return true;
    }
    return false;
  }

  function evaluatePointVisibility(params) {
    if (!params) return false;
    var dx = (Number(params.tx) || 0) - (Number(params.px) || 0);
    var dz = (Number(params.tz) || 0) - (Number(params.pz) || 0);
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (params.reconActive) {
      return dist <= 40.0;
    }
    if (params.hasPassiveRecon) {
      return dist <= 26.0;
    }
    var sameZone = !params.playerZone || !params.targetZone || (params.playerZone === params.targetZone);
    if (!sameZone) {
      // Strictly block seeing into next rooms unless literally peering through an open doorway right in front
      return dist <= 6.2 && !!params.hasLineOfSight;
    }
    return dist <= 22.0 && !!params.hasLineOfSight;
  }

  function computeBossDamageTaken(rawAmount, state) {
    var base = Math.max(1, Number(rawAmount) || 1);
    var st = state || {};
    if (st.ignoreRuleArmor) {
      return { damage: Math.max(1, Math.round(base)), armorMitigated: false, armorVulnerable: false };
    }
    var broken = (Number(st.armorBrokenTimer) || 0) > 0 || (Number(st.stunTimer) || 0) > 0;
    if (broken) {
      return {
        damage: Math.max(1, Math.round(base * BOSS_DEATH_EXAM_CONFIG.armorBrokenMult)),
        armorMitigated: false,
        armorVulnerable: true
      };
    }
    var mult = (Number(st.overridePct) || 0) >= 50
      ? BOSS_DEATH_EXAM_CONFIG.ruleArmorOverride50Mult
      : BOSS_DEATH_EXAM_CONFIG.ruleArmorMult;
    return {
      damage: Math.max(1, Math.round(base * mult)),
      armorMitigated: true,
      armorVulnerable: false
    };
  }

  // Sub-stepped swept collision against StationMap walls (grid=1) and rail_trench (grid=4).
  // Prevents fast dashes, lunges or knockback from tunneling across walls or vaulting onto tracks.
  function resolveSweptMovement(mapApi, fromX, fromZ, toX, toZ, radius) {
    var r = (typeof radius === 'number' && radius > 0) ? radius : 0.4;
    if (!mapApi || typeof mapApi.resolveCircleWallCollision !== 'function') {
      return { x: toX, z: toZ, hit: false, hitWall: false, hitRailEdge: false, normalX: 0, normalZ: 0 };
    }
    var grid = (typeof mapApi.getGrid === 'function') ? mapApi.getGrid() : null;
    var gridW = mapApi.GRID_W || 224;
    var gridH = mapApi.GRID_H || 152;

    function cellTypeAt(gx, gz) {
      var ix = Math.floor(gx);
      var iz = Math.floor(gz);
      if (ix < 0 || iz < 0 || ix >= gridW || iz >= gridH) return 1;
      if (grid && grid[iz] && grid[iz][ix] !== undefined) return grid[iz][ix];
      return mapApi.isWalkable(ix, iz) ? 0 : 1;
    }

    var cx = fromX;
    var cz = fromZ;
    var totalDx = toX - fromX;
    var totalDz = toZ - fromZ;
    var totalDist = Math.sqrt(totalDx * totalDx + totalDz * totalDz);
    var maxStep = Math.max(0.16, r * 0.45);
    var steps = Math.max(1, Math.min(32, Math.ceil(totalDist / maxStep)));

    var anyHit = false;
    var hitWall = false;
    var hitRailEdge = false;
    var accNx = 0;
    var accNz = 0;

    for (var s = 1; s <= steps; s++) {
      var stepDx = totalDx / steps;
      var stepDz = totalDz / steps;
      var tryX = cx + stepDx;
      var tryZ = cz + stepDz;
      var res = mapApi.resolveCircleWallCollision(tryX, tryZ, r);

      // Extra hard guard: never allow center to end inside non-walkable / rail_trench (grid === 4)
      var finalCell = cellTypeAt(res.x, res.z);
      var forcedStop = false;
      if (finalCell === 1 || finalCell === 4 || (typeof mapApi.isWalkable === 'function' && !mapApi.isWalkable(res.x, res.z))) {
        res = { x: cx, z: cz, hit: true };
        forcedStop = true;
      }

      if (res.hit) {
        anyHit = true;
        var pushX = res.x - tryX;
        var pushZ = res.z - tryZ;
        if (forcedStop && Math.abs(pushX) + Math.abs(pushZ) < 1e-4) {
          pushX = -stepDx;
          pushZ = -stepDz;
        }
        accNx += pushX;
        accNz += pushZ;

        // Classify whether blocked by rail_trench (grid === 4) or solid wall/pillar (grid === 1)
        var probeLen = Math.sqrt(stepDx * stepDx + stepDz * stepDz);
        var px = res.x + (probeLen > 1e-5 ? (stepDx / probeLen) * (r + 0.16) : 0);
        var pz = res.z + (probeLen > 1e-5 ? (stepDz / probeLen) * (r + 0.16) : 0);
        var probeCell = cellTypeAt(px, pz);
        var rightCell = cellTypeAt(res.x + r + 0.16, res.z);
        if (probeCell === 4 || (stepDx > 0.001 && rightCell === 4)) {
          hitRailEdge = true;
        }
        if (probeCell === 1 || (!hitRailEdge && probeCell !== 4)) {
          hitWall = true;
        }
      }

      cx = res.x;
      cz = res.z;
    }

    var nLen = Math.sqrt(accNx * accNx + accNz * accNz);
    return {
      x: cx,
      z: cz,
      hit: anyHit,
      hitWall: hitWall,
      hitRailEdge: hitRailEdge,
      normalX: nLen > 1e-5 ? (accNx / nLen) : 0,
      normalZ: nLen > 1e-5 ? (accNz / nLen) : 0
    };
  }

  function readArtTokens() {
    return global.INFINITY && global.INFINITY.ArtTokens ? global.INFINITY.ArtTokens : null;
  }

  function semanticInt(key, fallback) {
    var tokens = readArtTokens();
    if (tokens && tokens.SEMANTIC && typeof tokens.SEMANTIC[key] === 'number') {
      return tokens.SEMANTIC[key];
    }
    return fallback;
  }

  // Shared VFX resources (userData.shared) are cached per session and released only
  // through the tracked-resource sweep in unmount().
  function disposeOwned(res) {
    if (!res || typeof res.dispose !== 'function') return;
    if (res.userData && res.userData.shared) return;
    res.dispose();
  }

  function maxActiveVfxBudget() {
    var tokens = readArtTokens();
    var n = tokens && tokens.BUDGETS ? Number(tokens.BUDGETS.maxActiveVfx) : NaN;
    return n > 0 ? n : 48;
  }

  var ORDER_LABELS = {
    auto: '自主行动',
    follow: '紧跟掩护',
    goto_dispatch: '前往调度室',
    goto_substation: '前往变电间',
    goto_platform0: '前往0号站台',
    goto_concourse: '退守检票厅',
    goto_corridor: '进驻长廊',
    hold: '原地警戒',
    engage: '正面牵制',
    regroup: '向我汇合'
  };

  // True Infinite-Flow dispersion: player spawns alone in Z-01 Concourse while all 4 examinees
  // enter separate sectors and execute independent multi-zone survival routines unless explicitly ordered.
  var DEFAULT_NPC_SPAWNS = [
    { id: 'yanci',   zone: 'corridor',   dx: -24.0, dz: -4.0,  hp: 110, speed: 6.6 },
    { id: 'lujin',   zone: 'platform0',  dx: -14.0, dz: -18.0, hp: 135, speed: 7.4 },
    { id: 'xutan',   zone: 'dispatch',   dx: -10.0, dz: 4.0,   hp: 95,  speed: 6.9 },
    { id: 'shenyan', zone: 'substation', dx: 14.0,  dz: 10.0,  hp: 115, speed: 6.7 }
  ];

  var NPC_PATROL_ROUTES = {
    yanci: [
      { zone: 'corridor',   x: 104.5, z: 68.5,  dwell: 6.5, task: 'corridor_survey' },
      { zone: 'dispatch',   x: 149.5, z: 16.5,  dwell: 7.0, task: 'archive_audit' },
      { zone: 'corridor',   x: 122.5, z: 92.5,  dwell: 5.5, task: 'gallery_scan' },
      { zone: 'tunnel',     x: 122.5, z: 114.5, dwell: 6.5, task: 'tunnel_trace' },
      { zone: 'substation', x: 66.5,  z: 116.5, dwell: 6.5, task: 'relay_check' }
    ],
    lujin: [
      { zone: 'platform0',  x: 182.5, z: 68.5,  dwell: 5.0, task: 'platform_watch' },
      { zone: 'corridor',   x: 151.5, z: 74.5,  dwell: 4.5, task: 'approach_sweep' },
      { zone: 'platform0',  x: 182.5, z: 30.5,  dwell: 5.0, task: 'north_exit_guard' },
      { zone: 'corridor',   x: 122.5, z: 74.5,  dwell: 4.5, task: 'hub_patrol' },
      { zone: 'tunnel',     x: 149.5, z: 134.5, dwell: 5.0, task: 'flank_check' }
    ],
    xutan: [
      { zone: 'dispatch',   x: 122.5, z: 19.5,  dwell: 6.0, task: 'signal_diag' },
      { zone: 'substation', x: 41.5,  z: 110.5, dwell: 6.0, task: 'grid_probe' },
      { zone: 'platform0',  x: 182.5, z: 24.5,  dwell: 7.0, task: 'exit_interlock' }
    ],
    shenyan: [
      { zone: 'substation', x: 66.5,  z: 116.5, dwell: 6.0, task: 'scavenge_east' },
      { zone: 'tunnel',     x: 122.5, z: 134.5, dwell: 6.5, task: 'culvert_lurk' },
      { zone: 'platform0',  x: 186.5, z: 124.5, dwell: 6.0, task: 'freight_prowl' },
      { zone: 'tunnel',     x: 95.5,  z: 134.5, dwell: 5.5, task: 'valve_hide' },
      { zone: 'substation', x: 16.5,  z: 116.5, dwell: 6.0, task: 'switchgear_snoop' }
    ]
  };

  var DEFAULT_ZONES = {
    concourse:  { id: 'concourse',  name: 'B1 检票大厅',   code: 'Z-01', cx: 10, cz: 10, color: '#68c8de' },
    corridor:   { id: 'corridor',   name: 'B2 换乘长廊',   code: 'Z-02', cx: 26, cz: 18, color: '#d6b274' },
    dispatch:   { id: 'dispatch',   name: '信号调度室',    code: 'Z-03', cx: 30, cz: 7,  color: '#52c4a2' },
    substation: { id: 'substation', name: '旧变电间',      code: 'Z-04', cx: 11, cz: 29, color: '#6e9eff' },
    tunnel:     { id: 'tunnel',     name: '废弃应急通道',  code: 'Z-05', cx: 34, cz: 30, color: '#a884e0' },
    platform0:  { id: 'platform0',  name: '0号站台铁轨',   code: 'Z-06', cx: 47, cz: 18, color: '#e69c3c' }
  };

  // Per-zone dynamic scene asset, lighting, fog, atmospheric particle, and audio configurations.
  // Driven by StationMap.ZONES / ArtTokens.ZONES so crossing any zone boundary transforms
  // the rendered atmosphere, active scene asset rig, background ambience, and HUD live.
  var ZONE_SCENE_CONFIGS = {
    concourse: {
      id: 'concourse',
      accentHex: 0x68c8de,
      bgColor: 0x060b12,
      fogColor: 0x070f18,
      fogDensity: 0.0195,
      ambientColor: 0x3b5876,
      ambientIntensity: 0.28,
      hemiSky: 0x76badc,
      hemiGround: 0x132230,
      hemiIntensity: 0.36,
      keyColor: 0xd8f4ff,
      keyIntensity: 0.42,
      rimColor: 0x68c8de,
      rimIntensity: 0.24,
      exposure: 1.16,
      flashColor: 0xdcf5ff,
      playerGlowColor: 0x7cc8e8,
      vignetteRgba: 'rgba(6, 16, 26, 0.70)',
      dust: { color: 0x8cd8f0, size: 0.11, opacity: 0.34, driftX: 0.14, driftY: 0.07, driftZ: 0.03 },
      ambientFx: 'fluorescent_motes',
      assetSet: { key: 'concourse_atrium_rig', groundHazeOpacity: 0.15, shaftOpacity: 0.16, pulseHz: 1.35 },
      audio: { id: 'concourse_fluorescent', sceneMode: 'station_tense', label: '日光灯镇流器 · 检票厅混响' }
    },
    corridor: {
      id: 'corridor',
      accentHex: 0xd6b274,
      bgColor: 0x0c0906,
      fogColor: 0x15100a,
      fogDensity: 0.0225,
      ambientColor: 0x5f4c34,
      ambientIntensity: 0.27,
      hemiSky: 0xdeb87c,
      hemiGround: 0x241a10,
      hemiIntensity: 0.35,
      keyColor: 0xffe5be,
      keyIntensity: 0.40,
      rimColor: 0xd69852,
      rimIntensity: 0.28,
      exposure: 1.14,
      flashColor: 0xfff0d8,
      playerGlowColor: 0xd6b274,
      vignetteRgba: 'rgba(20, 13, 6, 0.74)',
      dust: { color: 0xe6c288, size: 0.125, opacity: 0.40, driftX: 0.28, driftY: 0.05, driftZ: 0.02 },
      ambientFx: 'sodium_haze',
      assetSet: { key: 'corridor_sodium_rig', groundHazeOpacity: 0.18, shaftOpacity: 0.18, pulseHz: 1.05 },
      audio: { id: 'corridor_draft', sceneMode: 'station_tense', label: '钠灯穿堂风 · 通道回声' }
    },
    dispatch: {
      id: 'dispatch',
      accentHex: 0x52c4a2,
      bgColor: 0x040e0c,
      fogColor: 0x061713,
      fogDensity: 0.0205,
      ambientColor: 0x2b5e51,
      ambientIntensity: 0.29,
      hemiSky: 0x62cfa9,
      hemiGround: 0x0e231d,
      hemiIntensity: 0.37,
      keyColor: 0xc8ffec,
      keyIntensity: 0.41,
      rimColor: 0x52c4a2,
      rimIntensity: 0.29,
      exposure: 1.17,
      flashColor: 0xd4fff2,
      playerGlowColor: 0x52c4a2,
      vignetteRgba: 'rgba(4, 20, 15, 0.72)',
      dust: { color: 0x64e8be, size: 0.105, opacity: 0.38, driftX: 0.06, driftY: 0.12, driftZ: -0.04 },
      ambientFx: 'crt_scan_motes',
      assetSet: { key: 'dispatch_crt_rig', groundHazeOpacity: 0.17, shaftOpacity: 0.19, pulseHz: 2.15 },
      audio: { id: 'dispatch_crt_43hz', sceneMode: 'station_tense', label: '机柜散热 · 43.2Hz 载波滴答' }
    },
    substation: {
      id: 'substation',
      accentHex: 0x6e9eff,
      bgColor: 0x050915,
      fogColor: 0x070e21,
      fogDensity: 0.022,
      ambientColor: 0x324d82,
      ambientIntensity: 0.28,
      hemiSky: 0x74a8ff,
      hemiGround: 0x101833,
      hemiIntensity: 0.36,
      keyColor: 0xd4e7ff,
      keyIntensity: 0.40,
      rimColor: 0x6e9eff,
      rimIntensity: 0.31,
      exposure: 1.16,
      flashColor: 0xd8ecff,
      playerGlowColor: 0x6e9eff,
      vignetteRgba: 'rgba(6, 12, 28, 0.74)',
      dust: { color: 0x82b6ff, size: 0.12, opacity: 0.42, driftX: 0.09, driftY: 0.17, driftZ: 0.05 },
      ambientFx: 'ozone_sparks',
      assetSet: { key: 'substation_arc_rig', groundHazeOpacity: 0.18, shaftOpacity: 0.20, pulseHz: 3.1 },
      audio: { id: 'substation_hv_hum', sceneMode: 'station_tense', label: '50Hz 变压器嗡鸣 · 臭氧电弧' }
    },
    tunnel: {
      id: 'tunnel',
      accentHex: 0xa884e0,
      bgColor: 0x090612,
      fogColor: 0x110a1f,
      fogDensity: 0.0245,
      ambientColor: 0x4e3970,
      ambientIntensity: 0.26,
      hemiSky: 0xac88e4,
      hemiGround: 0x181026,
      hemiIntensity: 0.34,
      keyColor: 0xe6d6ff,
      keyIntensity: 0.37,
      rimColor: 0xa884e0,
      rimIntensity: 0.29,
      exposure: 1.13,
      flashColor: 0xeee4ff,
      playerGlowColor: 0xa884e0,
      vignetteRgba: 'rgba(15, 8, 26, 0.78)',
      dust: { color: 0xc29ef2, size: 0.135, opacity: 0.45, driftX: -0.10, driftY: -0.09, driftZ: 0.08 },
      ambientFx: 'steam_drip',
      assetSet: { key: 'tunnel_mist_rig', groundHazeOpacity: 0.22, shaftOpacity: 0.18, pulseHz: 0.88 },
      audio: { id: 'tunnel_steam_drip', sceneMode: 'station_tense', label: '蒸汽管嘶鸣 · 暗渠滴水回响' }
    },
    platform0: {
      id: 'platform0',
      accentHex: 0xe69c3c,
      bgColor: 0x0c0805,
      fogColor: 0x181008,
      fogDensity: 0.0185,
      ambientColor: 0x684a28,
      ambientIntensity: 0.30,
      hemiSky: 0xefb45a,
      hemiGround: 0x26160a,
      hemiIntensity: 0.38,
      keyColor: 0xffe2b4,
      keyIntensity: 0.44,
      rimColor: 0xe69c3c,
      rimIntensity: 0.33,
      exposure: 1.19,
      flashColor: 0xfff0d4,
      playerGlowColor: 0xe69c3c,
      vignetteRgba: 'rgba(22, 12, 4, 0.72)',
      dust: { color: 0xf4ba64, size: 0.125, opacity: 0.42, driftX: 0.04, driftY: 0.10, driftZ: 0.40 },
      ambientFx: 'rail_wind',
      assetSet: { key: 'platform0_rail_rig', groundHazeOpacity: 0.17, shaftOpacity: 0.20, pulseHz: 1.75 },
      audio: { id: 'platform0_rail_wind', sceneMode: 'station_tense', label: '轨道穿堂风 · 钢轨低频共鸣' }
    }
  };

  function resolveZoneSceneConfig(zoneId, mapApi) {
    var zid = ZONE_SCENE_CONFIGS[zoneId] ? zoneId : 'concourse';
    var base = ZONE_SCENE_CONFIGS[zid];
    var zInfo = getZoneInfo(mapApi, zid);
    var accentCss = (INFINITY.ArtTokens && typeof INFINITY.ArtTokens.getZoneColor === 'function')
      ? INFINITY.ArtTokens.getZoneColor(zid, zInfo.color)
      : (zInfo.color || '#68c8de');
    return {
      id: zid,
      code: zInfo.code,
      name: zInfo.name,
      accentCss: accentCss,
      accentHex: hexToInt(accentCss, base.accentHex),
      bgColor: base.bgColor,
      fogColor: base.fogColor,
      fogDensity: base.fogDensity,
      ambientColor: base.ambientColor,
      ambientIntensity: base.ambientIntensity,
      hemiSky: base.hemiSky,
      hemiGround: base.hemiGround,
      hemiIntensity: base.hemiIntensity,
      keyColor: base.keyColor,
      keyIntensity: base.keyIntensity,
      rimColor: base.rimColor,
      rimIntensity: base.rimIntensity,
      exposure: base.exposure,
      flashColor: base.flashColor,
      playerGlowColor: base.playerGlowColor,
      vignetteRgba: base.vignetteRgba,
      dust: base.dust,
      ambientFx: base.ambientFx,
      assetSet: base.assetSet,
      audio: base.audio
    };
  }

  var DEFAULT_SLOTS = [
    { archetype: 'sword_arc',   name: '宵练剑弧',   color: '#6fd8ea', cooldown: 3.2, energyCost: 14, power: 34, radius: 3.8, duration: 0.35, icon: '⚔' },
    { archetype: 'ward_circle', name: '画地界',     color: '#f0c46c', cooldown: 11,  energyCost: 22, power: 0,  radius: 3.4, duration: 7.0,  icon: '◎' },
    { archetype: 'emp_blast',   name: '定向EMP',    color: '#4de8ff', cooldown: 10,  energyCost: 20, power: 26, radius: 4.8, duration: 3.5,  icon: '⚡' },
    { archetype: 'recon_pulse', name: '频段声呐',   color: '#58c4a6', cooldown: 8.5, energyCost: 12, power: 0,  radius: 24,  duration: 6.5,  icon: '◉' }
  ];

  var DEFAULT_FAKE_BROADCASTS = [
    '【系统紧急通告】检测到零号列车提前进站，请全体考生立即前往0号站台越过黄线候车，延误者将直接扣除50点生存分。',
    '【系统校验提醒】检票大厅1号闸机已开放合法补票通道，请高声报出你的真实姓名与当前剩余积分以领取有效车票。',
    '【系统安全预警】信号调度室与旧变电间已被高危规则污染封锁，严禁触碰任何道岔开关；请听从资深考生沈砚引导直接登车。',
    '【系统最终倒计时】第三次鸣笛已提前触发！未在10秒内冲入车厢者将被就地抹杀！'
  ];

  // Active engine session (single active mount)
  var activeSession = null;
  var postFxGlobalEnabled = true;

  // ---------------------------------------------------------------------------
  // Math & Utility Helpers
  // ---------------------------------------------------------------------------
  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist2D(x1, z1, x2, z2) {
    var dx = x2 - x1;
    var dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function hexToInt(color, fallback) {
    if (typeof color === 'number' && !isNaN(color)) return color;
    if (typeof color === 'string') {
      var clean = color.trim().replace('#', '');
      if (clean.length === 3) {
        clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
      }
      var n = parseInt(clean, 16);
      if (!isNaN(n)) return n;
    }
    return fallback !== undefined ? fallback : 0x6fd8ea;
  }

  function safeAudio(method) {
    try {
      if (INFINITY.Audio && typeof INFINITY.Audio[method] === 'function') {
        var args = Array.prototype.slice.call(arguments, 1);
        INFINITY.Audio[method].apply(INFINITY.Audio, args);
      }
    } catch (_) {}
  }

  function playSfxSafe(name) {
    safeAudio('playSfx', name);
  }

  function setAudioThreatSafe(level) {
    safeAudio('setThreatLevel', clamp(level, 0, 100));
  }

  function getMapApi() {
    if (INFINITY.StationMap) return INFINITY.StationMap;
    // Ultra-safe minimal fallback if StationMap failed to load
    return {
      GRID_W: 224,
      GRID_H: 152,
      PLATFORM_START_X: 168,
      HAZARD_X: 207,
      RAIL_MIN_X: 208,
      RAIL_MAX_X: 219,
      TRAIN_X: 213.5,
      ZONES: DEFAULT_ZONES,
      isWalkable: function (gx, gz) { return gx > 0 && gx < 223 && gz > 0 && gz < 151; },
      resolveCircleWallCollision: function (x, z, r) {
        return { x: clamp(x, 1 + r, 223 - r), z: clamp(z, 1 + r, 151 - r), hit: false };
      },
      hasLineOfSight: function () { return true; },
      findPath: function (x0, z0, x1, z1) { return [{ x: x1, z: z1 }]; },
      getZoneAt: function () { return 'concourse'; },
      getZoneCenter: function (zid) {
        var z = DEFAULT_ZONES[zid] || DEFAULT_ZONES.concourse;
        return { x: z.cx, z: z.cz };
      },
      getGrid: function () {
        var g = [];
        for (var r = 0; r < 152; r++) {
          var row = [];
          for (var c = 0; c < 224; c++) {
            row.push(r === 0 || r === 151 || c === 0 || c === 223 ? 1 : (c >= 208 ? 4 : 0));
          }
          g.push(row);
        }
        return g;
      },
      getWalls: function () { return []; },
      getLights: function () { return []; },
      getInteractables: function () { return []; }
    };
  }

  function readGridCell(grid, gx, gz, gridW, gridH) {
    if (!grid || gx < 0 || gz < 0 || gx >= gridW || gz >= gridH) return 1;
    if (grid.length === gridH && grid[gz] && grid[gz].length === gridW) {
      return grid[gz][gx];
    }
    if (grid.length === gridW && grid[gx] && grid[gx].length === gridH) {
      return grid[gx][gz];
    }
    return 0;
  }

  function getZoneInfo(mapApi, zoneId) {
    var zones = (mapApi && mapApi.ZONES) || DEFAULT_ZONES;
    return zones[zoneId] || DEFAULT_ZONES[zoneId] || DEFAULT_ZONES.concourse;
  }

  function findClueMeta(clueId) {
    var sc = INFINITY.SCENARIOS && INFINITY.SCENARIOS.station_zero;
    if (sc && Array.isArray(sc.clues)) {
      for (var i = 0; i < sc.clues.length; i++) {
        if (sc.clues[i].id === clueId) return sc.clues[i];
      }
    }
    return null;
  }

  function getCastMeta(npcId) {
    var cast = INFINITY.CAST && INFINITY.CAST[npcId];
    if (cast) return cast;
    var fallback = {
      yanci:   { id: 'yanci',   name: '严辞', role: '执棋队长', accentColor: '#7ca7d9' },
      lujin:   { id: 'lujin',   name: '陆烬', role: '攻坚主C',  accentColor: '#d97b54' },
      xutan:   { id: 'xutan',   name: '许檀', role: '技术副队', accentColor: '#58c4a6' },
      shenyan: { id: 'shenyan', name: '沈砚', role: '并场老生', accentColor: '#c9a66b' }
    };
    return fallback[npcId] || { id: npcId, name: npcId, role: '队友', accentColor: '#88c0d0' };
  }

  // Fallback solid/grid pixel texture generator (only used if PixelSprites missing)
  function createFallbackTexture(THREE, colorHex, accentHex) {
    var c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    var ctx = c.getContext('2d');
    ctx.fillStyle = colorHex || '#242c38';
    ctx.fillRect(0, 0, 16, 16);
    if (accentHex) {
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 15, 15);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Engine Session Constructor
  // ---------------------------------------------------------------------------
  function EngineSession(containerEl, state, callbacks) {
    this.containerEl = containerEl;
    this.state = state || {};
    this.callbacks = callbacks || {};
    this.mounted = false;
    this.ended = false;
    this.webglFailed = false;

    this.THREE = global.THREE;
    this.mapApi = getMapApi();
    this.spritesApi = INFINITY.PixelSprites || null;
    this.skillsApi = INFINITY.Skills25D || null;
    this.combatFeelApi = INFINITY.CombatFeel || null;
    this.shakeBudget = (this.combatFeelApi && typeof this.combatFeelApi.createShakeBudget === 'function')
      ? this.combatFeelApi.createShakeBudget()
      : null;
    this.previewSlotIdx = -1;
    this.aimPreview = null;

    // Resource tracking for leak-free disposal (only engine-owned resources)
    this.ownedGeometries = [];
    this.ownedMaterials = [];
    this.ownedTextures = [];
    this.domListeners = [];
    this.resizeObserver = null;
    this.rafId = null;

    // Overlay DOM references
    this.overlayRoot = null;
    this.vignetteEl = null;
    this.bubblesLayer = null;
    this.floatersLayer = null;
    this.tagsLayer = null;
    this.promptEl = null;

    // Time & control states
    this.lastFrameTs = 0;
    this.elapsedReal = 0;
    this.elapsedSim = 0;
    this.hudAccum = 0;
    this.slowMo = false;
    this.inputPaused = false;
    this.hitStopTimer = 0;
    this.timeRemainingSec = EXAM_DURATION_SEC;
    this.focusWaypoint = null;

    // Input state
    this.keys = Object.create(null);
    this.mouseNdc = { x: 0, y: 0 };
    this.mouseActive = false;
    this.mouseDownLmb = false;
    this.aimWorld = { x: 12, z: 10 };

    // Camera state
    this.camPos = { x: 10, z: 10 };
    this.camLook = { x: 10, z: 10 };
    this.camKickX = 0;
    this.camKickZ = 0;
    this.camFovPunch = 0;
    this.shakeIntensity = 0;
    this.shakeTimer = 0;

    // Station & lighting pools
    this.ambientLight = null;
    this.hemiLight = null;
    this.dirKeyLight = null;
    this.dirRimLight = null;
    this.stationLightDefs = [];
    this.stationLightPool = [];
    this.stationBulbMat = null;
    this.flashLight = null;
    this.flashTarget = null;
    this.playerGlow = null;
    this.inspectorLantern = null;
    this.inspectorLanternOrb = null;
    this.dustPoints = null;
    this.dustDrift = { x: 0.14, y: 0.07, z: 0.03 };

    // Dynamic zone atmosphere, asset-rig & ambient audio state
    this.activeZoneId = null;
    this.activeSubZoneId = null;
    this.activeZoneConfig = null;
    this.activeZoneAudioId = null;
    this.zoneAssetRigs = Object.create(null);
    this.zoneFxTimer = 0;
    this.zoneBannerEl = null;
    this.zoneBannerTimer = 0;
    this._tmpColor = null;
    this._tmpClearColor = null;

    // EMP blackout, Fog-of-War LOS shadow & 2-pass WebGL PostFX
    this.empBlackoutTimer = 0;
    this.empBlackoutPos = { x: 0, z: 0 };
    this.empSparkAccum = 0;
    this.fogOfWar = null;
    this.fogGrid = null;
    this.fogRayPts = null;
    this.postFxEnabled = postFxGlobalEnabled;
    this.postFx = null;
    this.glitchAmount = 0;
    this.slowMoBlend = 0;
    this.lowHpBlend = 0;
    this.parryFlashTimer = 0;
    this.impactFrameTimer = 0;
    this.impactFrameDuration = 0.075;
    this.puddleZones = [];
    this.contactShadowTex = null;
    this.castShadowTex = null;

    // Entities & Gameplay
    this.loadout = null;
    this.passives = null;
    this.player = null;
    this.inspector = null;
    this.squad = [];
    this.squadById = Object.create(null);
    this.interactables = [];
    this.interactablesById = Object.create(null);
    this.destructibleCovers = [];
    this.sceneTriggers = [];
    this.discoveredClueIds = [];
    this.environmentClues = [];
    this.environmentCluesById = Object.create(null);
    this.latestEnvironmentClue = null;
    this.overridePct = 0;
    this.soundLevel = 8;
    this.threatLevel = 12;
    this.exitWarnTimer = 0;

    // Dynamic combat & VFX lists
    this.vfxList = [];          // temporary meshes/particles with update(dt)
    this.directorTimeline = (INFINITY.CombatFeel && typeof INFINITY.CombatFeel.createDirectorTimeline === 'function')
      ? INFINITY.CombatFeel.createDirectorTimeline()
      : null;
    this.directorState = { zoom: 1.0, letterbox: 0, chromatic: 0, inkEdge: 0 };
    this.combatFocusTimer = 0;
    this.cutInTimer = 0;
    this.playerTrailPrev = null;
    this.playerTrailAccum = 0;
    this.projectiles = [];      // bolts / emp orbs / decoy canisters
    this.wards = [];            // active physical-blocking ward circles
    this.drones = [];           // active turret drones
    this.decoys = [];           // active decoy flares
    this.soundRipples = [];     // floor acoustic wave meshes
    this.blinkBeacon = null;    // active kunai beacon
    this.reconRevealTimer = 0;  // sonar reveal through walls
    this.reconBeacons = [];     // holographic through-wall pillars

    // Train state
    this.train = null;
    this.trainCountdownSec = TRAIN_CYCLE_SEC;
    this.trainInStation = false;
    this.trainPhase = 'waiting'; // 'waiting' | 'arriving' | 'docked' | 'departing'
    this.trainTimer = 0;
    this.trainWarned = false;

    // Broadcast & ambient AI timers
    this.fakeBroadcastTimer = 28;
    this.fakeBroadcastIndex = 0;
    this.activeFakeBroadcastTimer = 0;
    this.pendingYanciExposeTimer = 0;
    this.stats = {
      damageDealt: 0,
      damageTaken: 0,
      parries: 0,
      skillsCast: 0,
      cluesFound: 0,
      coversDestroyed: 0,
      triggersActivated: 0,
      fakeBroadcastsCancelled: 0,
      inspectorDefeated: false,
      inspectorSealed: false,
      elapsedSec: 0
    };

    // Real-time Mission Progress, Triggered Logic Branches & Historical Log
    this.visitedZones = ['concourse'];
    this.missionLog = [];
    this.missionLogVersion = 0;
    this.missionFlags = Object.create(null);
    this.branches = {
      track_override: {
        id: 'track_override',
        name: '逆轨出环路线',
        routeTag: 'S级真破局',
        status: 'locked', // locked | active | triggered | completed | warning
        progressPct: 0,
        summary: '联动「信号调度室」与「旧变电间」反转主轨极性至 100%，解锁 0 号站台应急闸门。',
        outcome: '尚未启动任一轨控终端',
        updatedAt: null
      },
      inspector_hunt: {
        id: 'inspector_hunt',
        name: '正面肃清检票员',
        routeTag: 'A+级破局',
        status: 'locked',
        progressPct: 0,
        summary: '正面击杀或使用规则锁链 100% 封印零号检票员，直接破除黄线即决法则。',
        outcome: '尚未与零号检票员正式交锋',
        updatedAt: null
      },
      fake_broadcast: {
        id: 'fake_broadcast',
        name: '拟态假播报反制',
        routeTag: '规则陷阱',
        status: 'locked',
        progressPct: 0,
        summary: '43.2Hz 伪造系统播报将诱导考生越过黄线；可借腕表校时拆穿或以 EMP 脉冲切断。',
        outcome: '暂未截获拟态播报信号',
        updatedAt: null
      },
      yellow_line: {
        id: 'yellow_line',
        name: '黄线即决违例',
        routeTag: '高危判定',
        status: 'locked',
        progressPct: 0,
        summary: '道岔反转未满 100% 时踏入 0 号站台黄线内侧，将立刻触发检票员强制追猎锁定。',
        outcome: '尚未触犯黄线禁令',
        updatedAt: null
      },
      shenyan_secret: {
        id: 'shenyan_secret',
        name: '沈砚伪造车票暗线',
        routeTag: '隐藏情报',
        status: 'locked',
        progressPct: 0,
        summary: '查明独行老生沈砚的真实动机与应急通道遗留物证，识破诱导越线陷阱。',
        outcome: '尚未发现相关隐藏证物',
        updatedAt: null
      },
      ghost_train: {
        id: 'ghost_train',
        name: '零号列车强登分支',
        routeTag: 'B级次优撤离',
        status: 'locked',
        progressPct: 0,
        summary: '每周期停靠 0 号站台的幽灵列车；未反转道岔时强行登车可冒险脱出但错失高评。',
        outcome: '等待零号列车首次进站',
        updatedAt: null
      },
      squad_tactics: {
        id: 'squad_tactics',
        name: '活体小队战术协同',
        routeTag: '队伍联动',
        status: 'locked',
        progressPct: 0,
        summary: '通过加密短波向严辞、陆烬、许檀、沈砚下达分区执行或集火指令。',
        outcome: '小队按自主策略展开行动',
        updatedAt: null
      }
    };

    // UI overlay pools
    this.speechBubbles = Object.create(null); // actorId -> { el, text, ttl, maxTtl }
    this.floatingTexts = []; // { el, x, y, z, vy, ttl, maxTtl }
    this.worldTags = Object.create(null);     // actorId -> { el, hpFill, sealFill, nameEl }
    this.nearbyInteractable = null;
    this.activeChannelConsole = null;

    // Reusable scratch vectors (zero per-frame GC churn!)
    if (this.THREE) {
      this._v3a = new this.THREE.Vector3();
      this._v3b = new this.THREE.Vector3();
      this._v3proj = new this.THREE.Vector3();
      this._v2ndc = new this.THREE.Vector2();
      this._groundPlane = new this.THREE.Plane(new this.THREE.Vector3(0, 1, 0), 0);
      this._raycaster = new this.THREE.Raycaster();
      this._dummy = new this.THREE.Object3D();
    }
  }

  // ---------------------------------------------------------------------------
  // Resource Tracking Helpers
  // ---------------------------------------------------------------------------
  EngineSession.prototype.trackGeo = function (geo) {
    if (geo) this.ownedGeometries.push(geo);
    return geo;
  };

  EngineSession.prototype.trackMat = function (mat) {
    if (mat) this.ownedMaterials.push(mat);
    return mat;
  };

  EngineSession.prototype.trackTex = function (tex) {
    if (tex) this.ownedTextures.push(tex);
    return tex;
  };

  EngineSession.prototype.getTileTex = function (name, fallbackColor, fallbackAccent) {
    if (this.spritesApi && typeof this.spritesApi.getTileTexture === 'function') {
      try {
        var t = this.spritesApi.getTileTexture(name);
        if (t) return t;
      } catch (_) {}
    }
    return this.trackTex(createFallbackTexture(this.THREE, fallbackColor, fallbackAccent));
  };

  EngineSession.prototype.getWeaponStyleFor = function (id) {
    return id === 'player' ? (this.playerWeaponStyle || null) : null;
  };

  EngineSession.prototype.getCharTex = function (id, frame) {
    if (this.spritesApi && typeof this.spritesApi.getCharTexture === 'function') {
      try {
        var t = this.spritesApi.getCharTexture(id, frame || 'idle', this.getWeaponStyleFor(id));
        if (t) return t;
      } catch (_) {}
    }
    var tokens = INFINITY.ArtTokens;
    var fallbackCol = (tokens && typeof tokens.getCharacterColor === 'function')
      ? tokens.getCharacterColor(id, '#88aabb')
      : '#88aabb';
    return this.trackTex(createFallbackTexture(this.THREE, fallbackCol, '#ffffff'));
  };

  EngineSession.prototype.getCharNormalTex = function (id, frame) {
    if (this.spritesApi && typeof this.spritesApi.getCharNormalTexture === 'function') {
      try {
        var t = this.spritesApi.getCharNormalTexture(id, frame || 'idle', this.getWeaponStyleFor(id));
        if (t) return t;
      } catch (_) {}
    }
    return null;
  };

  EngineSession.prototype.getCharEmissiveTex = function (id, frame) {
    if (this.spritesApi && typeof this.spritesApi.getCharEmissiveTexture === 'function') {
      try {
        var t = this.spritesApi.getCharEmissiveTexture(id, frame || 'idle', this.getWeaponStyleFor(id));
        if (t) return t;
      } catch (_) {}
    }
    return null;
  };

  EngineSession.prototype.getPropTex = function (name, fallbackColor) {
    if (this.spritesApi && typeof this.spritesApi.getPropTexture === 'function') {
      try {
        var t = this.spritesApi.getPropTexture(name);
        if (t) return t;
      } catch (_) {}
    }
    return this.trackTex(createFallbackTexture(this.THREE, fallbackColor || '#58c4a6', '#ffffff'));
  };

  EngineSession.prototype.addListener = function (target, type, fn, opts) {
    if (!target || !target.addEventListener) return;
    target.addEventListener(type, fn, opts || false);
    this.domListeners.push({ target: target, type: type, fn: fn, opts: opts || false });
  };

  EngineSession.prototype.emitRadio = function (entry) {
    if (this.callbacks && typeof this.callbacks.onRadioEvent === 'function') {
      try { this.callbacks.onRadioEvent(entry); } catch (_) {}
    }
  };

  EngineSession.prototype.formatElapsedMMSS = function (sec) {
    var s = Math.max(0, Math.floor(Number(sec) || 0));
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  };

  EngineSession.prototype.recordMissionEvent = function (category, title, detail, opts) {
    var o = opts || {};
    var elapsed = Math.floor(this.stats ? this.stats.elapsedSec : 0);
    var pZoneId = (this.player && this.mapApi) ? (this.mapApi.getZoneAt(this.player.x, this.player.z) || 'concourse') : 'concourse';
    var pZone = getZoneInfo(this.mapApi, o.zoneId || pZoneId);
    var entry = {
      id: 'ML_' + (++this.missionLogVersion),
      elapsedSec: elapsed,
      timeLabel: this.formatElapsedMMSS(elapsed),
      zoneId: pZone.id,
      zoneCode: pZone.code,
      zoneName: pZone.name,
      category: category || 'progress', // progress | branch | clue | warning | squad
      title: String(title || '考场记录'),
      detail: String(detail || ''),
      branchId: o.branchId || null,
      badge: o.badge || null
    };
    this.missionLog.unshift(entry);
    if (this.missionLog.length > 80) {
      this.missionLog.length = 80;
    }
    return entry;
  };

  EngineSession.prototype.setBranchState = function (branchId, status, outcome, progressPct) {
    var b = this.branches && this.branches[branchId];
    if (!b) return null;
    var elapsed = Math.floor(this.stats ? this.stats.elapsedSec : 0);
    b.status = status || b.status;
    if (outcome) b.outcome = String(outcome);
    if (progressPct != null && isFinite(Number(progressPct))) {
      b.progressPct = clamp(Math.round(Number(progressPct)), 0, 100);
    }
    b.updatedAt = this.formatElapsedMMSS(elapsed);
    this.missionLogVersion += 1;
    return b;
  };

  EngineSession.prototype.getBranchesList = function () {
    var order = [
      'track_override',
      'inspector_hunt',
      'fake_broadcast',
      'yellow_line',
      'shenyan_secret',
      'ghost_train',
      'squad_tactics'
    ];
    var out = [];
    for (var i = 0; i < order.length; i++) {
      var b = this.branches[order[i]];
      if (b) {
        out.push({
          id: b.id,
          name: b.name,
          routeTag: b.routeTag,
          status: b.status,
          progressPct: b.progressPct,
          summary: b.summary,
          outcome: b.outcome,
          updatedAt: b.updatedAt
        });
      }
    }
    return out;
  };

  // ---------------------------------------------------------------------------
  // Mount & Scene Construction
  // ---------------------------------------------------------------------------
  EngineSession.prototype.mount = function () {
    if (!this.containerEl) return false;
    var THREE = this.THREE;
    if (!THREE) {
      this.renderFallbackError('Three.js r147 未加载，无法启动 2.5D 实时渲染引擎。');
      return false;
    }

    // Prepare container
    var cs = global.getComputedStyle ? global.getComputedStyle(this.containerEl) : null;
    if (cs && cs.position === 'static') {
      this.containerEl.style.position = 'relative';
    }
    this.containerEl.style.overflow = 'hidden';
    this.containerEl.innerHTML = '';

    var width = Math.max(this.containerEl.clientWidth || 960, 320);
    var height = Math.max(this.containerEl.clientHeight || 560, 240);

    // Detect software WebGL (SwiftShader / llvmpipe) to pace frames & keep rendering responsive
    var isSoftwareGl = false;
    try {
      var probeCanvas = document.createElement('canvas');
      var probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (probeGl) {
        var dbgExt = probeGl.getExtension('WEBGL_debug_renderer_info');
        var glName = dbgExt ? probeGl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) : probeGl.getParameter(probeGl.RENDERER);
        isSoftwareGl = /SwiftShader|llvmpipe|Software|Mesa/i.test(String(glName || ''));
      }
    } catch (_) {}
    this.isSoftwareGl = isSoftwareGl;

    // WebGL Renderer with graceful error guard
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      this.webglFailed = true;
      this.renderFallbackError('WebGL 上下文初始化失败：请检查浏览器硬件加速设置。');
      return false;
    }

    if (!this.renderer || !this.renderer.getContext()) {
      this.webglFailed = true;
      this.renderFallbackError('浏览器未提供可用的 WebGL 渲染上下文。');
      return false;
    }

    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(global.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0x04060b, 1);
    if (THREE.sRGBEncoding !== undefined) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    if (THREE.ACESFilmicToneMapping !== undefined) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.96;
    }
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.cursor = 'crosshair';
    this.containerEl.appendChild(this.renderer.domElement);

    // Build HTML overlay (speech bubbles, damage numbers, world HP tags, vignette, interact prompt)
    this.buildHtmlOverlay();

    // Scene & Atmospheric Depth Fog (calibrated for grand 4x mega-station sightlines with noir depth)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060b);
    this.scene.fog = new THREE.FogExp2(0x04060b, 0.023);

    // Elevated angled 2.5D camera (deep far plane for 224x152 mega-station scrolling)
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 190);

    // Preload all Style-1 external sprite sheets, player combat poses & 16f flipbooks upfront
    if (this.spritesApi && typeof this.spritesApi.preloadAllExternalSprites === 'function') {
      try { this.spritesApi.preloadAllExternalSprites(); } catch (_) {}
    }

    // Build combat loadout & entities
    this._tmpColor = new THREE.Color();
    this._tmpClearColor = new THREE.Color(0x070a10);
    this.initLoadout();
    this.buildLighting();
    this.buildStationGeometry();
    this.buildGhostTrain();
    this.buildInteractables();
    this.buildActors();
    this.buildReticle();
    this.buildAtmosphericDust();
    this.buildZoneSceneAssetRigs();
    this.buildFogOfWar();
    this.buildPostFx(width, height);

    // Snap camera immediately to player
    this.camPos.x = this.player.x;
    this.camPos.z = this.player.z;
    this.camLook.x = this.player.x;
    this.camLook.z = this.player.z;
    this.aimWorld.x = this.player.x + 2.5;
    this.aimWorld.z = this.player.z;
    this.updateCamera(0.016);
    this.updateFogOfWar(1.0);

    // Bind input & resize observers
    this.bindInputs();
    this.bindResize();

    this.mounted = true;
    this.lastFrameTs = performance.now();

    // Opening radio atmosphere, initial zone scene assets/ambience & HUD push
    if (INFINITY.Audio && typeof INFINITY.Audio.setScene === 'function') {
      try { INFINITY.Audio.setScene('station_tense'); } catch (_) {}
    }
    this.updateZoneEnvironment(0.016, true);
    this.recordMissionEvent(
      'progress',
      '接入《零号回廊 · 停摆站台》',
      '主目标：联动信号调度室与旧变电间反转主轨至 100%，或正面肃清/封印零号检票员后从 0 号站台撤离。',
      { zoneId: 'concourse' }
    );
    this.emitRadio({
      type: 'narration',
      text: '【考场切入】空间折跃存在离散偏差——其余考生已分散落入不同扇区各自行动。你独自处于 B1 检票大厅（Z-01）。'
    });
    this.emitHudSnapshot();

    // Start 60fps loop (with gentle yield pacing on software WebGL so UI/browser stays responsive)
    var self = this;
    function scheduleNext() {
      if (!self.mounted) return;
      if (self.isSoftwareGl) {
        self.rafId = global.setTimeout(function () {
          if (!self.mounted) return;
          self.rafId = global.requestAnimationFrame(tick);
        }, 28);
      } else {
        self.rafId = global.requestAnimationFrame(tick);
      }
    }
    function tick(now) {
      if (!self.mounted) return;
      self.frame(now);
      scheduleNext();
    }
    this.rafId = global.requestAnimationFrame(tick);
    return true;
  };

  EngineSession.prototype.renderFallbackError = function (msg) {
    if (!this.containerEl) return;
    this.containerEl.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
      'background:#08090d;color:#d6b274;font-family:monospace;padding:24px;text-align:center;">' +
      '<div><div style="font-size:16px;letter-spacing:2px;margin-bottom:8px;">[ 2.5D RENDERER OFFLINE ]</div>' +
      '<div style="font-size:13px;color:#9aa8bd;">' + msg + '</div></div></div>';
  };

  EngineSession.prototype.buildHtmlOverlay = function () {
    var root = document.createElement('div');
    root.className = 'w25d-overlay';
    root.style.cssText =
      'position:absolute;inset:0;pointer-events:none;overflow:hidden;user-select:none;' +
      'font-family:"JetBrains Mono","Fira Code","PingFang SC","Microsoft YaHei",sans-serif;z-index:5;';

    var vignette = document.createElement('div');
    vignette.style.cssText =
      'position:absolute;inset:0;pointer-events:none;transition:box-shadow 0.2s ease,opacity 0.2s ease;' +
      'box-shadow:inset 0 0 90px rgba(4,6,10,0.72);';
    root.appendChild(vignette);

    var tags = document.createElement('div');
    tags.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    root.appendChild(tags);

    var bubbles = document.createElement('div');
    bubbles.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    root.appendChild(bubbles);

    var floaters = document.createElement('div');
    floaters.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    root.appendChild(floaters);

    var prompt = document.createElement('div');
    prompt.style.cssText =
      'position:absolute;display:none;transform:translate(-50%,-100%);padding:4px 10px;' +
      'background:rgba(8,12,18,0.88);border:1px solid #6fd8ea;color:#eaf6ff;font-size:12px;' +
      'letter-spacing:0.5px;border-radius:3px;box-shadow:0 0 14px rgba(111,216,234,0.35);white-space:nowrap;';
    root.appendChild(prompt);

    var cutIn = document.createElement('div');
    cutIn.className = 'w25d-cutin-banner';
    cutIn.innerHTML =
      '<div class="w25d-cutin-art-wrap"><img class="w25d-cutin-art" alt="" /><div class="w25d-cutin-speedlines"></div></div>' +
      '<div class="w25d-cutin-copy"><div class="w25d-cutin-sub"></div><div class="w25d-cutin-title"></div></div>';
    root.appendChild(cutIn);

    // Non-blocking top-center Zone Transition Banner (zero backdrop-filter over WebGL!)
    var zoneBanner = document.createElement('div');
    zoneBanner.className = 'w25d-zone-banner';
    zoneBanner.setAttribute('aria-live', 'polite');
    zoneBanner.style.cssText =
      'position:absolute;top:16px;left:50%;transform:translate(-50%,-10px);opacity:0;' +
      'display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 22px 8px;' +
      'background:rgba(7,10,16,0.92);border:1px solid rgba(104,200,222,0.45);' +
      'border-top:2px solid #68c8de;border-radius:1px;pointer-events:none;white-space:nowrap;' +
      'box-shadow:0 6px 0 #04060a,0 10px 24px rgba(0,0,0,0.65);transition:opacity 0.3s ease,transform 0.3s ease;';
    root.appendChild(zoneBanner);

    this.containerEl.appendChild(root);
    this.overlayRoot = root;
    this.vignetteEl = vignette;
    this.tagsLayer = tags;
    this.bubblesLayer = bubbles;
    this.floatersLayer = floaters;
    this.promptEl = prompt;
    this.cutInBannerEl = cutIn;
    this.zoneBannerEl = zoneBanner;
  };

  EngineSession.prototype.triggerSkillCutIn = function (title, subtitle, accentCss, speakerId) {
    if (!this.cutInBannerEl || !title) return;
    var el = this.cutInBannerEl;
    var accent = accentCss || '#5ce8ff';
    var subEl = el.querySelector('.w25d-cutin-sub');
    var titleEl = el.querySelector('.w25d-cutin-title');
    var artEl = el.querySelector('.w25d-cutin-art');
    var isBossCut = speakerId === 'boss' || speakerId === 'inspector' ||
      (typeof accent === 'string' && /^#ff[0-3]/i.test(accent.trim()));
    if (artEl && INFINITY.ASSETS && typeof INFINITY.ASSETS.getCutInUrl === 'function') {
      var artUrl = INFINITY.ASSETS.getCutInUrl(speakerId || (isBossCut ? 'boss' : 'player'));
      if (artUrl) {
        artEl.src = artUrl;
        el.classList.add('has-art');
      }
    }
    el.classList.toggle('boss-cutin', isBossCut);
    if (subEl) subEl.textContent = subtitle || 'SKILL EXECUTION';
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.textShadow = '-2px -2px 0 #04060b, 2px 2px 0 #04060b, 0 0 16px ' + accent;
    }
    el.style.setProperty('--cutin-accent', accent);
    el.style.borderLeftColor = accent;
    el.style.borderBottomColor = accent;
    el.classList.remove('out');
    el.classList.add('active');
    this.cutInTimer = 0.82;
    // Trigger punchy comic clash camera zoom beat if DirectorTimeline is available
    if (this.directorTimeline && typeof this.directorTimeline.triggerBeat === 'function') {
      this.directorTimeline.triggerBeat({
        zoom: isBossCut ? 0.74 : 0.72,
        holdSec: 0.34,
        letterbox: 0.055,
        chromatic: isBossCut ? 0.55 : 0.25,
        inkEdge: 0.68
      });
    }
  };

  EngineSession.prototype.triggerOnomatopoeia = function (x, y, z, glyph, colorCss) {
    if (!glyph) return;
    this.spawnFloatingText(x, y, z, glyph, colorCss || '#fff3d1', 'onomatopoeia');
  };

  // ---------------------------------------------------------------------------
  // Loadout Initialization
  // ---------------------------------------------------------------------------
  EngineSession.prototype.initLoadout = function () {
    var playerState = (this.state && this.state.player) || {};
    var built = null;
    if (this.skillsApi && typeof this.skillsApi.buildCombatLoadout === 'function') {
      try {
        built = this.skillsApi.buildCombatLoadout(playerState);
      } catch (_) {
        built = null;
      }
    }

    var passives = (built && built.passives) || {};
    this.passives = {
      moveSpeedMult: clamp(Number(passives.moveSpeedMult) || 1.0, 0.7, 1.8),
      maxHpBonus: Number(passives.maxHpBonus) || 0,
      energyRegen: clamp(Number(passives.energyRegen) || 0, 0, 25),
      damageMult: clamp(Number(passives.damageMult) || 1.0, 0.6, 2.5),
      noiseMult: clamp(Number(passives.noiseMult) || 1.0, 0.25, 1.8),
      memeResist: clamp(Number(passives.memeResist) || 0, 0, 0.85)
    };

    var rawSlots = (built && Array.isArray(built.slots) && built.slots.length) ? built.slots : DEFAULT_SLOTS;
    var slots = [];
    for (var i = 0; i < 4; i++) {
      var src = rawSlots[i] || DEFAULT_SLOTS[i];
      var archId = src.archetype || DEFAULT_SLOTS[i].archetype;
      var slotColor = src.color || DEFAULT_SLOTS[i].color;
      var vfxProfile = src.vfxProfile || (
        this.skillsApi && typeof this.skillsApi.buildVfxProfile === 'function'
          ? this.skillsApi.buildVfxProfile(src, archId, src.tier || 'C', slotColor)
          : {
              motif: 'cyber_tactical',
              motifLabel: '战术霓虹',
              primaryColor: slotColor,
              secondaryColor: '#ffffff',
              coreColor: '#ffffff',
              sigilStyle: 'tactical_hud',
              orbiterType: 'drone_bit',
              particleStyle: 'holo_grid',
              ringLayers: 2,
              tier: src.tier || 'C',
              tierRank: 1,
              tierIntensity: 1.0,
              isFused: false,
              isGamble: false,
              isHighTier: false,
              shapeVariant: i % 4
            }
      );
      slots.push({
        index: i,
        key: String(i + 1),
        archetype: archId,
        itemId: src.itemId || null,
        name: src.name || DEFAULT_SLOTS[i].name,
        tier: src.tier || vfxProfile.tier || 'C',
        color: slotColor,
        cooldownMax: Math.max(0.8, Number(src.cooldown) || DEFAULT_SLOTS[i].cooldown),
        cooldownLeft: 0,
        energyCost: Math.max(0, Number(src.energyCost) || DEFAULT_SLOTS[i].energyCost),
        power: Number(src.power) || DEFAULT_SLOTS[i].power || 26,
        radius: Number(src.radius) || DEFAULT_SLOTS[i].radius || 3.6,
        duration: Number(src.duration) || DEFAULT_SLOTS[i].duration || 4.0,
        desc: src.desc || '',
        icon: src.icon || DEFAULT_SLOTS[i].icon,
        vfxProfile: vfxProfile,
        particlePreset: src.particlePreset || (this.skillsApi && typeof this.skillsApi.getParticlePreset === 'function' ? this.skillsApi.getParticlePreset(src) : null),
        resonance: src.resonance || null,
        resonanceAppliedOnSlot: Boolean(src.resonanceAppliedOnSlot),
        lastResonanceRadioAt: -99
      });
    }

    var basic = (built && built.basicAttack) || {
      name: '战术斩击',
      type: 'melee',
      power: 16,
      cooldown: 0.36,
      range: 3.1,
      color: '#6fd8ea'
    };
    if (!basic.vfxProfile) {
      basic.vfxProfile = slots[0] ? slots[0].vfxProfile : {
        motif: 'sword_qi',
        primaryColor: basic.color || '#6fd8ea',
        secondaryColor: '#ffffff',
        coreColor: '#ffffff',
        sigilStyle: 'bagua',
        tierIntensity: 1.0,
        shapeVariant: 0
      };
    }

    var charVisual = (built && built.characterVisual) || {
      primaryMotif: (slots[0] && slots[0].vfxProfile && slots[0].vfxProfile.motif) || 'sword_qi',
      secondaryMotif: (slots[1] && slots[1].vfxProfile && slots[1].vfxProfile.motif) || 'cyber_tactical',
      auraColor: (slots[0] && slots[0].color) || '#6fd8ea',
      accentColor: (slots[1] && slots[1].color) || '#f0c46c',
      rimColor: '#ffffff',
      sigilStyle: (slots[0] && slots[0].vfxProfile && slots[0].vfxProfile.sigilStyle) || 'bagua',
      orbiterType: (slots[0] && slots[0].vfxProfile && slots[0].vfxProfile.orbiterType) || 'sword',
      orbiterCount: 2,
      tierRank: 1,
      highestTier: 'C',
      hasFused: false,
      hasGamble: false,
      weaponStyle: basic.style || 'tactical'
    };

    this.loadout = {
      basicAttack: basic,
      slots: slots,
      styleLabel: (built && built.styleLabel) || '标准特勤构筑',
      characterVisual: charVisual,
      bloodlines: (built && Array.isArray(built.bloodlines)) ? built.bloodlines : [],
      resonanceSummary: (built && built.resonanceSummary) || null
    };
    // Held weapon sprite follows the basic-attack style (sword | cyber | occult | tactical).
    this.playerWeaponStyle = basic.style || (charVisual && charVisual.weaponStyle) || 'sword';
  };

  // ---------------------------------------------------------------------------
  // Lighting System (Dynamic Flashlight + Inspector Crimson Lantern + Pool)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildLighting = function () {
    var THREE = this.THREE;

    // Mignola high-contrast noir lighting: crush global ambient fill near pitch black
    // so motivated light pools sculpt the scene (crossfades per zone in updateZoneEnvironment).
    var amb = new THREE.AmbientLight(0x101828, 0.08);
    this.scene.add(amb);
    this.ambientLight = amb;

    var hemi = new THREE.HemisphereLight(0x243854, 0x04060b, 0.11);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    var dirKey = new THREE.DirectionalLight(0xc2e6ff, 0.15);
    dirKey.position.set(14, 18, 16);
    this.scene.add(dirKey);
    this.dirKeyLight = dirKey;

    var dirRim = new THREE.DirectionalLight(0xff9858, 0.12);
    dirRim.position.set(-18, 10, -14);
    this.scene.add(dirRim);
    this.dirRimLight = dirRim;

    // Player directional flashlight (SpotLight) + tight personal rim glow
    var flashTarget = new THREE.Object3D();
    flashTarget.position.set(12, 0.2, 10);
    this.scene.add(flashTarget);

    var flash = new THREE.SpotLight(0xdcf5ff, 4.4, 24, Math.PI / 4.2, 0.62, 1.35);
    flash.position.set(10, 2.15, 10);
    flash.target = flashTarget;
    this.scene.add(flash);
    this.flashLight = flash;
    this.flashTarget = flashTarget;

    var pGlow = new THREE.PointLight(0x74cbe8, 0.95, 6.8, 1.7);
    pGlow.position.set(10, 1.65, 10);
    this.scene.add(pGlow);
    this.playerGlow = pGlow;

    // Inspector's ominous crimson lantern (bleeds down corridors before sighting!)
    var iLantern = new THREE.PointLight(0xff162e, 5.6, 21.0, 1.35);
    iLantern.position.set(45, 1.7, 18);
    this.scene.add(iLantern);
    this.inspectorLantern = iLantern;

    // Station overhead flickering lights (pooled nearest 4 for shader safety)
    var defs = [];
    if (typeof this.mapApi.getLights === 'function') {
      try { defs = this.mapApi.getLights() || []; } catch (_) { defs = []; }
    }
    this.stationLightDefs = defs.map(function (d, idx) {
      return {
        x: Number(d.x) || 10,
        z: Number(d.z) || 10,
        color: hexToInt(d.color, 0x7fb8d8),
        intensity: (Number(d.intensity) || 1.35) * 1.48,
        distance: (Number(d.distance) || 13) * 0.92,
        flicker: typeof d.flicker === 'number' ? d.flicker : (d.flicker ? 0.22 : 0),
        seed: (idx + 1) * 1.73
      };
    });

    // Hanging industrial fluorescent fixtures + steel beams + volumetric light cones
    if (INFINITY.SceneArchitect && typeof INFINITY.SceneArchitect.buildLightFixtures === 'function') {
      this.stationBulbMat = INFINITY.SceneArchitect.buildLightFixtures(this, this.stationLightDefs);
    }

    var poolSize = Math.min(4, this.stationLightDefs.length);
    for (var pi = 0; pi < poolSize; pi++) {
      var pl = new THREE.PointLight(0x88b8d8, 0.0, 13, 1.5);
      pl.position.set(0, WALL_HEIGHT + 0.15, 0);
      this.scene.add(pl);
      this.stationLightPool.push(pl);
    }
  };

  // ---------------------------------------------------------------------------
  // Station 2.5D Geometry Builder (Instanced Crisp Pixel Floors & Extruded Walls)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildStationGeometry = function () {
    var trainX = (this.mapApi && this.mapApi.TRAIN_X) || TRAIN_X;
    if (INFINITY.SceneArchitect && typeof INFINITY.SceneArchitect.buildStation === 'function') {
      INFINITY.SceneArchitect.buildStation(this, {
        WALL_HEIGHT: WALL_HEIGHT,
        FLOOR_Y: FLOOR_Y,
        PLATFORM_Y: PLATFORM_Y,
        HAZARD_Y: HAZARD_Y,
        RAIL_Y: RAIL_Y,
        TRAIN_X: trainX
      });
      return;
    }
    var THREE = this.THREE;
    var mapApi = this.mapApi;
    var gridW = mapApi.GRID_W || 56;
    var gridH = mapApi.GRID_H || 38;
    var grid = (typeof mapApi.getGrid === 'function' ? mapApi.getGrid() : null) || [];
    var walls = (typeof mapApi.getWalls === 'function' ? mapApi.getWalls() : null) || [];

    // Group floor tiles by type: 0=slate, 2=platform, 3=hazard, 4=rail_trench
    var floorBuckets = { 0: [], 2: [], 3: [], 4: [] };
    var wallTileMap = Object.create(null); // "gx,gz" -> { neon: bool, h: number }

    for (var gz = 0; gz < gridH; gz++) {
      for (var gx = 0; gx < gridW; gx++) {
        var cell = readGridCell(grid, gx, gz, gridW, gridH);
        if (cell === 1) {
          if (walls.length === 0) {
            wallTileMap[gx + ',' + gz] = { gx: gx, gz: gz, neon: false, h: WALL_HEIGHT };
          }
        } else {
          var bucketKey = (cell === 2 || cell === 3 || cell === 4) ? cell : 0;
          floorBuckets[bucketKey].push({ gx: gx, gz: gz });
        }
      }
    }

    // Detect whether getWalls() uses center coords or top-left corner coords
    var wallsUseCenter = false;
    if (walls.length > 0) {
      var hasHalf = false;
      var hasZeroSpan = false;
      for (var wi = 0; wi < walls.length; wi++) {
        var wl = walls[wi];
        if ((wl.x === 0 && (wl.w || 1) > 1) || (wl.z === 0 && (wl.d || 1) > 1)) hasZeroSpan = true;
        if (Math.abs((wl.x % 1) - 0.5) < 0.02 || Math.abs((wl.z % 1) - 0.5) < 0.02) hasHalf = true;
      }
      wallsUseCenter = hasHalf && !hasZeroSpan;

      for (var wj = 0; wj < walls.length; wj++) {
        var wObj = walls[wj];
        var ww = Math.max(1, Math.round(wObj.w || 1));
        var wd = Math.max(1, Math.round(wObj.d || 1));
        var startX = wallsUseCenter ? Math.round(wObj.x - ww * 0.5) : Math.round(wObj.x);
        var startZ = wallsUseCenter ? Math.round(wObj.z - wd * 0.5) : Math.round(wObj.z);
        var wh = Number(wObj.h) || WALL_HEIGHT;
        for (var dz = 0; dz < wd; dz++) {
          for (var dx = 0; dx < ww; dx++) {
            var tx = startX + dx;
            var tz = startZ + dz;
            if (tx >= 0 && tx < gridW && tz >= 0 && tz < gridH) {
              var k = tx + ',' + tz;
              if (!wallTileMap[k]) {
                wallTileMap[k] = { gx: tx, gz: tz, neon: !!wObj.neon, h: wh };
              } else {
                if (wObj.neon) wallTileMap[k].neon = true;
                if (wObj.h) wallTileMap[k].h = wh;
              }
            }
          }
        }
      }
    }

    // Build instanced floor meshes (1 draw call per floor tile type)
    var tileGeo = this.trackGeo(new THREE.PlaneGeometry(1, 1));
    tileGeo.rotateX(-Math.PI / 2);

    var floorSpecs = [
      { key: 0, tex: 'floor_slate',    y: FLOOR_Y,    col: '#1d222c', rough: 0.92, metal: 0.08 },
      { key: 2, tex: 'floor_platform', y: PLATFORM_Y, col: '#282d36', rough: 0.88, metal: 0.10 },
      { key: 3, tex: 'floor_hazard',   y: HAZARD_Y,   col: '#c49b30', rough: 0.78, metal: 0.12 },
      { key: 4, tex: 'floor_rail',     y: RAIL_Y,     col: '#12141a', rough: 0.96, metal: 0.25 }
    ];

    for (var fi = 0; fi < floorSpecs.length; fi++) {
      var spec = floorSpecs[fi];
      var list = floorBuckets[spec.key];
      if (!list || list.length === 0) continue;
      var fTex = this.getTileTex(spec.tex, spec.col, '#10141c');
      var fMat = this.trackMat(new THREE.MeshLambertMaterial({
        map: fTex
      }));
      var fMesh = new THREE.InstancedMesh(tileGeo, fMat, list.length);
      for (var li = 0; li < list.length; li++) {
        this._dummy.position.set(list[li].gx + 0.5, spec.y, list[li].gz + 0.5);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.scale.set(1, 1, 1);
        this._dummy.updateMatrix();
        fMesh.setMatrixAt(li, this._dummy.matrix);
      }
      fMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(fMesh);
    }

    // Platform curb & steel railway tracks inside the recessed rail trench
    if (floorBuckets[4].length > 0) {
      var minRailX = 999;
      var maxRailX = 0;
      var minRailZ = 999;
      var maxRailZ = 0;
      for (var ri = 0; ri < floorBuckets[4].length; ri++) {
        var rc = floorBuckets[4][ri];
        if (rc.gx < minRailX) minRailX = rc.gx;
        if (rc.gx > maxRailX) maxRailX = rc.gx;
        if (rc.gz < minRailZ) minRailZ = rc.gz;
        if (rc.gz > maxRailZ) maxRailZ = rc.gz;
      }
      var railCenterZ = (minRailZ + maxRailZ + 1) * 0.5;
      var railSpanZ = Math.max(8, maxRailZ - minRailZ + 1);
      var railCenterX = (minRailX + maxRailX + 1) * 0.5;

      // Platform vertical drop curb
      var curbGeo = this.trackGeo(new THREE.BoxGeometry(0.16, 0.66, railSpanZ));
      var curbMat = this.trackMat(new THREE.MeshLambertMaterial({ color: 0x262a33}));
      var curbMesh = new THREE.Mesh(curbGeo, curbMat);
      curbMesh.position.set(minRailX - 0.04, -0.28, railCenterZ);
      this.scene.add(curbMesh);

      // Twin iron rails along TRAIN_X (or railCenterX)
      var trackX = Math.abs(railCenterX - TRAIN_X) < 3 ? TRAIN_X : railCenterX;
      var railGeo = this.trackGeo(new THREE.BoxGeometry(0.11, 0.12, railSpanZ + 4));
      var railMat = this.trackMat(new THREE.MeshLambertMaterial({
        color: 0x5c6472
      }));
      var leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(trackX - 0.72, RAIL_Y + 0.07, railCenterZ);
      var rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(trackX + 0.72, RAIL_Y + 0.07, railCenterZ);
      this.scene.add(leftRail, rightRail);

      // Wooden/iron crossties
      var tieCount = Math.floor(railSpanZ * 1.4);
      var tieGeo = this.trackGeo(new THREE.BoxGeometry(2.0, 0.06, 0.22));
      var tieMat = this.trackMat(new THREE.MeshLambertMaterial({ color: 0x241f1c}));
      var tieMesh = new THREE.InstancedMesh(tieGeo, tieMat, tieCount);
      for (var ti = 0; ti < tieCount; ti++) {
        this._dummy.position.set(trackX, RAIL_Y + 0.02, minRailZ + (ti / 1.4) + 0.35);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.scale.set(1, 1, 1);
        this._dummy.updateMatrix();
        tieMesh.setMatrixAt(ti, this._dummy.matrix);
      }
      tieMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(tieMesh);
    }

    // Build instanced 3D walls (concrete vs neon-accent walls)
    var concreteWalls = [];
    var neonWalls = [];
    var wallKeys = Object.keys(wallTileMap);
    for (var wk = 0; wk < wallKeys.length; wk++) {
      var wt = wallTileMap[wallKeys[wk]];
      if (wt.neon) neonWalls.push(wt);
      else concreteWalls.push(wt);
    }

    var wallGeo = this.trackGeo(new THREE.BoxGeometry(1, WALL_HEIGHT, 1));
    var capGeo = this.trackGeo(new THREE.BoxGeometry(1.02, 0.08, 1.02));
    var capMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0x0d1118 }));

    if (concreteWalls.length > 0) {
      var cTex = this.getTileTex('wall_concrete', '#2b3240', '#161b24');
      var cMat = this.trackMat(new THREE.MeshLambertMaterial({
        map: cTex
      }));
      var cMesh = new THREE.InstancedMesh(wallGeo, cMat, concreteWalls.length);
      var cCap = new THREE.InstancedMesh(capGeo, capMat, concreteWalls.length);
      for (var ci = 0; ci < concreteWalls.length; ci++) {
        var cw = concreteWalls[ci];
        var ch = cw.h || WALL_HEIGHT;
        this._dummy.position.set(cw.gx + 0.5, ch * 0.5, cw.gz + 0.5);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.scale.set(1, ch / WALL_HEIGHT, 1);
        this._dummy.updateMatrix();
        cMesh.setMatrixAt(ci, this._dummy.matrix);

        this._dummy.position.set(cw.gx + 0.5, ch + 0.03, cw.gz + 0.5);
        this._dummy.scale.set(1, 1, 1);
        this._dummy.updateMatrix();
        cCap.setMatrixAt(ci, this._dummy.matrix);
      }
      cMesh.instanceMatrix.needsUpdate = true;
      cCap.instanceMatrix.needsUpdate = true;
      this.scene.add(cMesh, cCap);
    }

    if (neonWalls.length > 0) {
      var nTex = this.getTileTex('wall_neon', '#233042', '#52d6ea');
      var nMat = this.trackMat(new THREE.MeshLambertMaterial({
        map: nTex,
        emissive: 0x164454,
        emissiveIntensity: 0.42
      }));
      var nMesh = new THREE.InstancedMesh(wallGeo, nMat, neonWalls.length);

      // Subtle glowing cyan neon trim strip wrapping neon walls
      var trimGeo = this.trackGeo(new THREE.BoxGeometry(1.03, 0.1, 1.03));
      var trimMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0x52e2f8 }));
      var trimMesh = new THREE.InstancedMesh(trimGeo, trimMat, neonWalls.length);

      for (var ni = 0; ni < neonWalls.length; ni++) {
        var nw = neonWalls[ni];
        var nh = nw.h || WALL_HEIGHT;
        this._dummy.position.set(nw.gx + 0.5, nh * 0.5, nw.gz + 0.5);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.scale.set(1, nh / WALL_HEIGHT, 1);
        this._dummy.updateMatrix();
        nMesh.setMatrixAt(ni, this._dummy.matrix);

        this._dummy.position.set(nw.gx + 0.5, nh - 0.18, nw.gz + 0.5);
        this._dummy.scale.set(1, 1, 1);
        this._dummy.updateMatrix();
        trimMesh.setMatrixAt(ni, this._dummy.matrix);
      }
      nMesh.instanceMatrix.needsUpdate = true;
      trimMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(nMesh, trimMesh);
    }
  };

  // ---------------------------------------------------------------------------
  // Ghost Train No.0 (4-Car Articulated Specter Train sliding down x = 51.5)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildGhostTrain = function () {
    var trainX = (this.mapApi && this.mapApi.TRAIN_X) || TRAIN_X;
    if (INFINITY.SceneArchitect && typeof INFINITY.SceneArchitect.buildGhostTrain === 'function') {
      this.train = INFINITY.SceneArchitect.buildGhostTrain(this, {
        RAIL_Y: RAIL_Y,
        TRAIN_X: trainX
      });
      return;
    }
    var THREE = this.THREE;
    var group = new THREE.Group();

    var hullTex = this.getTileTex('train_hull', '#181c24', '#4d2229');
    var hullMat = this.trackMat(new THREE.MeshLambertMaterial({
      map: hullTex,
      emissive: 0x160609,
      emissiveIntensity: 0.35
    }));
    var roofMat = this.trackMat(new THREE.MeshLambertMaterial({ color: 0x101318}));
    var winMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0xff2c40 }));
    var headMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0xff4658 }));

    var carGeo = this.trackGeo(new THREE.BoxGeometry(2.35, 2.55, 6.2));
    var roofGeo = this.trackGeo(new THREE.BoxGeometry(2.15, 0.22, 6.0));
    var winGeo = this.trackGeo(new THREE.PlaneGeometry(0.1, 1.1));
    var lampGeo = this.trackGeo(new THREE.BoxGeometry(0.32, 0.28, 0.14));

    for (var i = 0; i < 4; i++) {
      var cz = -i * 6.75;
      var car = new THREE.Mesh(carGeo, hullMat);
      car.position.set(0, 1.35, cz);
      group.add(car);

      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 2.72, cz);
      group.add(roof);

      // Eerie crimson windows facing west (toward Platform 0)
      for (var w = -1; w <= 1; w++) {
        var win = new THREE.Mesh(winGeo, winMat);
        win.position.set(-1.19, 1.55, cz + w * 1.75);
        win.rotation.y = -Math.PI / 2;
        win.scale.set(7.5, 0.62, 1);
        group.add(win);
      }
    }

    // Twin front crimson headlights on lead car (moving +Z)
    var lampL = new THREE.Mesh(lampGeo, headMat);
    lampL.position.set(-0.68, 1.1, 3.16);
    var lampR = new THREE.Mesh(lampGeo, headMat);
    lampR.position.set(0.68, 1.1, 3.16);
    group.add(lampL, lampR);

    // Volumetric crimson headlight beam cone
    var coneGeo = this.trackGeo(new THREE.ConeGeometry(2.8, 10, 14, 1, true));
    coneGeo.rotateX(-Math.PI / 2);
    var coneMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff1e33,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0.9, 8.2);
    group.add(cone);

    // Dynamic headlight point light
    var trainLight = new THREE.PointLight(0xff1c36, 4.0, 20, 1.3);
    trainLight.position.set(-0.5, 1.6, 5.2);
    group.add(trainLight);

    group.position.set(TRAIN_X, RAIL_Y + 0.12, -32);
    group.visible = false;
    this.scene.add(group);

    this.train = {
      group: group,
      light: trainLight,
      z: -32,
      speed: 0
    };
  };

  // ---------------------------------------------------------------------------
  // Interactable Props (Clues, Override Consoles, Exit Gate)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildInteractables = function () {
    if (INFINITY.SceneArchitect && typeof INFINITY.SceneArchitect.buildInteractables === 'function') {
      INFINITY.SceneArchitect.buildInteractables(this);
      return;
    }
    var THREE = this.THREE;
    var defs = [];
    if (typeof this.mapApi.getInteractables === 'function') {
      try { defs = this.mapApi.getInteractables() || []; } catch (_) { defs = []; }
    }

    var ringGeo = this.trackGeo(new THREE.RingGeometry(0.55, 0.72, 24));
    ringGeo.rotateX(-Math.PI / 2);
    var propPlaneGeo = this.trackGeo(new THREE.PlaneGeometry(1.15, 1.4));
    var exitPlaneGeo = this.trackGeo(new THREE.PlaneGeometry(1.9, 2.5));

    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var type = d.type || 'clue';
      var group = new THREE.Group();
      group.position.set(d.x, 0, d.z);

      var texName = type === 'console' ? 'console_off' : (type === 'exit' ? 'exit_gate' : 'clue_glow');
      var ringColor = type === 'console' ? 0xf2a944 : (type === 'exit' ? 0xe85d4a : 0x6fd8ea);
      var tex = this.getPropTex(texName, type === 'console' ? '#d68a38' : '#6fd8ea');

      var pMat = this.trackMat(new THREE.MeshLambertMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: type === 'clue' ? 0.65 : 0.48,
        transparent: true,
        alphaTest: 0.25,
        side: THREE.DoubleSide
      }));

      var sprite = new THREE.Mesh(type === 'exit' ? exitPlaneGeo : propPlaneGeo, pMat);
      sprite.position.y = type === 'exit' ? 1.28 : (type === 'clue' ? 0.78 : 0.75);
      sprite.rotation.x = -0.32;
      group.add(sprite);

      var rMat = this.trackMat(new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      var ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.y = 0.08;
      if (type === 'exit') ring.scale.set(1.65, 1.65, 1);
      group.add(ring);

      this.scene.add(group);

      var item = {
        id: d.id || ('obj_' + i),
        type: type,
        x: Number(d.x),
        z: Number(d.z),
        zoneId: d.zoneId || this.mapApi.getZoneAt(d.x, d.z),
        label: d.label || (type === 'console' ? '道岔控制台' : (type === 'exit' ? '0号站台撤离闸门' : '异常线索')),
        clueId: d.clueId || null,
        overrideValue: Number(d.overrideValue) || 50,
        done: false,
        progress: 0, // 0..100 for consoles
        group: group,
        sprite: sprite,
        mat: pMat,
        ring: ring,
        ringMat: rMat,
        bobPhase: i * 1.3
      };

      this.interactables.push(item);
      this.interactablesById[item.id] = item;
    }
  };

  // ---------------------------------------------------------------------------
  // Actors: Player, Squad (4 Autonomous NPCs), Inspector Boss
  // ---------------------------------------------------------------------------
  EngineSession.prototype.getContactShadowTex = function () {
    if (this.contactShadowTex) return this.contactShadowTex;
    var THREE = this.THREE;
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    g.addColorStop(0.0, 'rgba(0, 0, 0, 0.96)');
    g.addColorStop(0.50, 'rgba(0, 0, 0, 0.84)');
    g.addColorStop(0.78, 'rgba(2, 4, 8, 0.36)');
    g.addColorStop(1.0, 'rgba(2, 4, 8, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    var tex = this.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    this.contactShadowTex = tex;
    return tex;
  };

  EngineSession.prototype.getCastShadowTex = function () {
    if (this.castShadowTex) return this.castShadowTex;
    var THREE = this.THREE;
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(64, 108, 10, 64, 128, 118);
    g.addColorStop(0.0, 'rgba(2, 4, 8, 0.62)');
    g.addColorStop(0.42, 'rgba(2, 4, 8, 0.38)');
    g.addColorStop(0.78, 'rgba(2, 4, 8, 0.14)');
    g.addColorStop(1.0, 'rgba(2, 4, 8, 0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(64, 128, 44, 114, 0, 0, Math.PI * 2);
    ctx.fill();
    var tex = this.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    this.castShadowTex = tex;
    return tex;
  };

  EngineSession.prototype.createActorVisual = function (id, width, height, accentHex, isBoss) {
    var THREE = this.THREE;
    var group = new THREE.Group();

    // Dual-Layer Grounding Shadow (Art Bible Iron Rule 2):
    // Layer 1: Tight high-density heavy-ink Contact Shadow directly under boots (eliminates float)
    var shW = isBoss ? 1.56 : 1.02;
    var shD = isBoss ? 1.04 : 0.68;
    var shGeo = this.trackGeo(new THREE.PlaneGeometry(shW, shD));
    shGeo.rotateX(-Math.PI / 2);
    var shMat = this.trackMat(new THREE.MeshBasicMaterial({
      map: this.getContactShadowTex(),
      color: 0x000000,
      transparent: true,
      opacity: isBoss ? 0.96 : 0.92,
      depthWrite: false
    }));
    var shadow = new THREE.Mesh(shGeo, shMat);
    shadow.position.y = 0.059;
    shadow.renderOrder = 1;
    group.add(shadow);

    // Layer 2: Dynamic Directional Cast Shadow pivoted at feet (rotates & elongates away from
    // player flashlight, Inspector crimson lantern, and nearest overhead station lamps!)
    var castW = isBoss ? 1.44 : 0.92;
    var castLen = isBoss ? 2.55 : 1.72;
    var castGeo = this.trackGeo(new THREE.PlaneGeometry(castW, castLen));
    castGeo.rotateX(-Math.PI / 2);
    castGeo.translate(0, 0, castLen * 0.44);
    var castMat = this.trackMat(new THREE.MeshBasicMaterial({
      map: this.getCastShadowTex(),
      color: 0x020408,
      transparent: true,
      opacity: isBoss ? 0.62 : 0.52,
      depthWrite: false
    }));
    var castShadow = new THREE.Mesh(castGeo, castMat);
    castShadow.position.set(0, 0.055, 0);
    castShadow.rotation.y = 0.45;
    group.add(castShadow);

    // Restrained tactical footing anchor (low-glare, lets boots & contact shadow lead)
    var bGeo = this.trackGeo(new THREE.RingGeometry(isBoss ? 0.60 : 0.39, isBoss ? 0.66 : 0.43, 24));
    bGeo.rotateX(-Math.PI / 2);
    var bMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: hexToInt(accentHex, 0x6fd8ea),
      transparent: true,
      opacity: isBoss ? 0.44 : 0.20,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    var baseRing = new THREE.Mesh(bGeo, bMat);
    baseRing.position.y = 0.063;
    group.add(baseRing);

    // Angled 2.5D PBR billboard sprite plane with tangent-space Normal Map + Selective Emissive Map
    // Low base emissive ensures actors eat cold cyan station lamps, flashlight & crimson lantern!
    var texIdle = this.getCharTex(id, 'idle');
    var normIdle = this.getCharNormalTex(id, 'idle');
    var emIdle = this.getCharEmissiveTex(id, 'idle');
    var dims = (INFINITY.PixelSprites && typeof INFINITY.PixelSprites.getSpriteDimensions === 'function')
      ? INFINITY.PixelSprites.getSpriteDimensions(id)
      : { width: isBoss ? 160 : 128, height: isBoss ? 192 : 128 };
    var pGeo = this.trackGeo(new THREE.PlaneGeometry(width, height));
    var pMat = this.trackMat(new THREE.MeshStandardMaterial({
      map: texIdle,
      normalMap: normIdle || null,
      normalScale: new THREE.Vector2(1.35, 1.35),
      emissiveMap: emIdle || null,
      emissive: emIdle ? 0xffffff : 0x10141c,
      emissiveIntensity: isBoss ? ACTOR_EMISSIVE_BOSS : ACTOR_EMISSIVE_BASE,
      roughness: 0.60,
      metalness: 0.14,
      transparent: true,
      alphaTest: 0.14,
      side: THREE.DoubleSide
    }));
    var statusUniforms = this.applyActorStatusShader(pMat, {
      id: id,
      vitalColor: accentHex || (isBoss ? '#ff384c' : '#6fd8ea'),
      isHostile: isBoss,
      texelX: 1.0 / (dims.width || 128),
      texelY: 1.0 / (dims.height || 128)
    });
    var sprite = new THREE.Mesh(pGeo, pMat);
    sprite.position.y = height * 0.5 + 0.04;
    sprite.rotation.x = -CAMERA_25D_SPEC.spriteTiltRad;
    group.add(sprite);

    this.scene.add(group);
    return {
      group: group,
      sprite: sprite,
      mat: pMat,
      statusUniforms: statusUniforms,
      baseRing: baseRing,
      baseRingMat: bMat,
      shadow: shadow,
      castShadow: castShadow,
      castShadowMat: castMat,
      baseCastOpacity: isBoss ? 0.62 : 0.52
    };
  };

  EngineSession.prototype.applyActorStatusShader = function (mat, opts) {
    var THREE = this.THREE;
    var cfg = opts || {};
    var seedHash = 0;
    var idStr = String(cfg.id || 'actor');
    for (var i = 0; i < idStr.length; i++) {
      seedHash = ((seedHash << 5) - seedHash + idStr.charCodeAt(i)) | 0;
    }
    var glitchSeed = (Math.abs(seedHash) % 997) / 997.0;

    var uniforms = {
      uStatusTime: { value: 0.0 },
      uHpRatio: { value: 1.0 },
      uSanRatio: { value: 1.0 },
      uVitalColor: { value: new THREE.Color(hexToInt(cfg.vitalColor, 0x6fd8ea)) },
      uIsHostile: { value: cfg.isHostile ? 1.0 : 0.0 },
      uGlitchSeed: { value: glitchSeed },
      uTexelSize: { value: new THREE.Vector2(cfg.texelX || (1.0 / 32.0), cfg.texelY || (1.0 / 32.0)) }
    };

    mat.userData.statusUniforms = uniforms;
    mat.customProgramCacheKey = function () {
      return 'actor_hp_san_status_v1';
    };

    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uStatusTime = uniforms.uStatusTime;
      shader.uniforms.uHpRatio = uniforms.uHpRatio;
      shader.uniforms.uSanRatio = uniforms.uSanRatio;
      shader.uniforms.uVitalColor = uniforms.uVitalColor;
      shader.uniforms.uIsHostile = uniforms.uIsHostile;
      shader.uniforms.uGlitchSeed = uniforms.uGlitchSeed;
      shader.uniforms.uTexelSize = uniforms.uTexelSize;

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <map_pars_fragment>',
          [
            '#include <map_pars_fragment>',
            'uniform float uStatusTime;',
            'uniform float uHpRatio;',
            'uniform float uSanRatio;',
            'uniform vec3 uVitalColor;',
            'uniform float uIsHostile;',
            'uniform float uGlitchSeed;',
            'uniform vec2 uTexelSize;',
            'float actorHash21(vec2 p) {',
            '  p = fract(p * vec2(123.34, 456.21));',
            '  p += dot(p, p + 45.32);',
            '  return fract(p.x * p.y);',
            '}'
          ].join('\n')
        )
        .replace(
          '#include <map_fragment>',
          [
            'vec2 statusUv = vec2(0.5);',
            'float statusSanLow = smoothstep(0.68, 0.12, uSanRatio);',
            'float statusHpHigh = smoothstep(0.68, 0.96, uHpRatio);',
            'float statusHpLow = smoothstep(0.42, 0.10, uHpRatio);',
            'float statusRim = 0.0;',
            'float statusGlitchNoise = 0.0;',
            'float statusScanTear = 0.0;',
            '#ifdef USE_MAP',
            '  statusUv = vUv;',
            '  if (statusSanLow > 0.005) {',
            '    float bandId = floor(vUv.y * 26.0);',
            '    float timeStep = floor(uStatusTime * (10.0 + statusSanLow * 14.0));',
            '    float tearRand = actorHash21(vec2(bandId + uGlitchSeed * 17.0, timeStep));',
            '    float tearTrigger = step(0.84 - statusSanLow * 0.34, tearRand);',
            '    float tearDir = (actorHash21(vec2(bandId * 3.1, timeStep + 7.0)) - 0.5) * 2.0;',
            '    statusScanTear = tearTrigger;',
            '    statusUv.x = clamp(statusUv.x + tearTrigger * tearDir * (0.025 + statusSanLow * 0.075), 0.0, 1.0);',
            '  }',
            '  vec4 sampledDiffuseColor = texture2D( map, statusUv );',
            '  if (statusSanLow > 0.005) {',
            '    float rgbShift = (0.008 + statusSanLow * 0.024) * (0.65 + 0.35 * sin(uStatusTime * 19.0 + vUv.y * 24.0) + statusScanTear * 1.1);',
            '    vec4 sR = texture2D( map, clamp(statusUv + vec2(rgbShift, 0.0), 0.0, 1.0) );',
            '    vec4 sB = texture2D( map, clamp(statusUv - vec2(rgbShift, 0.0), 0.0, 1.0) );',
            '    float splitAlpha = max(sampledDiffuseColor.a, max(sR.a, sB.a) * (0.58 * statusSanLow));',
            '    vec3 baseRgb = sampledDiffuseColor.rgb;',
            '    vec3 ghostRgb = vec3(sR.r * sR.a, baseRgb.g * sampledDiffuseColor.a, sB.b * sB.a);',
            '    float coreMask = step(0.35, sampledDiffuseColor.a);',
            '    vec3 splitRgb = mix(',
            '      ghostRgb,',
            '      vec3(',
            '        mix(baseRgb.r, max(sR.r, baseRgb.r * 1.12), 0.72 * statusSanLow),',
            '        baseRgb.g * (1.0 - 0.16 * statusSanLow),',
            '        mix(baseRgb.b, max(sB.b, baseRgb.b * 1.15), 0.76 * statusSanLow)',
            '      ),',
            '      coreMask',
            '    );',
            '    vec2 cell = floor(statusUv / max(uTexelSize, vec2(0.01)));',
            '    float tCell = floor(uStatusTime * 18.0);',
            '    float grain = actorHash21(cell + vec2(tCell * 1.37, uGlitchSeed * 31.0));',
            '    float speckle = step(0.955 - statusSanLow * 0.15, grain);',
            '    statusGlitchNoise = grain;',
            '    float luma = dot(splitRgb, vec3(0.299, 0.587, 0.114));',
            '    vec3 eerieTint = mix(vec3(0.76, 0.62, 0.96), vec3(0.98, 0.36, 0.52), uIsHostile);',
            '    splitRgb = mix(splitRgb, vec3(luma) * eerieTint, statusSanLow * 0.36);',
            '    vec3 artifactCol = mix(vec3(0.38, 0.92, 1.0), vec3(1.0, 0.24, 0.58), step(0.5, fract(grain * 13.7)));',
            '    splitRgb = mix(splitRgb, artifactCol, speckle * statusSanLow * 0.78);',
            '    float scanBar = smoothstep(0.65, 1.0, sin(vUv.y * 95.0 - uStatusTime * 22.0));',
            '    splitRgb *= (1.0 - scanBar * statusSanLow * 0.24);',
            '    sampledDiffuseColor = vec4(splitRgb, splitAlpha);',
            '  }',
            '  if (sampledDiffuseColor.a > 0.35 && (statusHpHigh > 0.005 || statusHpLow > 0.005 || statusSanLow > 0.005)) {',
            '    float aL = texture2D( map, clamp(statusUv - vec2(uTexelSize.x, 0.0), 0.0, 1.0) ).a;',
            '    float aR = texture2D( map, clamp(statusUv + vec2(uTexelSize.x, 0.0), 0.0, 1.0) ).a;',
            '    float aU = texture2D( map, clamp(statusUv + vec2(0.0, uTexelSize.y), 0.0, 1.0) ).a;',
            '    float aD = texture2D( map, clamp(statusUv - vec2(0.0, uTexelSize.y), 0.0, 1.0) ).a;',
            '    float minNeighbor = min(min(aL, aR), min(aU, aD));',
            '    statusRim = clamp((sampledDiffuseColor.a - minNeighbor) * 1.45, 0.0, 1.0);',
            '  }',
            '  if (statusHpLow > 0.005) {',
            '    float hpLuma = dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114));',
            '    sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(hpLuma * 0.92, hpLuma * 0.72, hpLuma * 0.72), statusHpLow * 0.32);',
            '  }',
            '  diffuseColor *= sampledDiffuseColor;',
            '#endif'
          ].join('\n')
        )
        .replace(
          '#include <emissivemap_fragment>',
          [
            '#ifdef USE_EMISSIVEMAP',
            '  vec4 emissiveColor = texture2D( emissiveMap, statusUv );',
            '  totalEmissiveRadiance *= emissiveColor.rgb;',
            '#endif'
          ].join('\n')
        )
        .replace(
          '#include <tonemapping_fragment>',
          [
            '  // Healthy actors preserve pure heavy-ink silhouettes without white sticker rim glow;',
            '  // only critical low-HP pulse and low-SAN anomaly glitch add chromatic edge emission.',
            '  if (statusHpLow > 0.005) {',
            '    float beat1 = pow(max(0.0, sin(uStatusTime * 5.2 + uGlitchSeed)), 4.0);',
            '    float beat2 = pow(max(0.0, sin(uStatusTime * 5.2 + 0.75 + uGlitchSeed)), 6.0) * 0.65;',
            '    float pulse = 0.28 + 0.72 * max(beat1, beat2);',
            '    vec3 critCol = vec3(1.0, 0.16, 0.24);',
            '    gl_FragColor.rgb += critCol * (statusRim * 0.72 + 0.14) * pulse * statusHpLow;',
            '  }',
            '  if (statusSanLow > 0.005) {',
            '    vec3 sanEdgeCol = mix(vec3(0.76, 0.36, 1.0), vec3(0.32, 0.94, 1.0), step(0.5, statusGlitchNoise));',
            '    float flicker = 0.6 + 0.4 * sin(uStatusTime * 27.0 + uGlitchSeed * 11.0);',
            '    gl_FragColor.rgb += sanEdgeCol * (statusRim * 0.62 + statusScanTear * 0.26) * flicker * statusSanLow;',
            '  }',
            '  #include <tonemapping_fragment>'
          ].join('\n')
        );
    };

    return uniforms;
  };

  EngineSession.prototype.buildActors = function () {
    var THREE = this.THREE;
    var mapApi = this.mapApi;
    var pState = (this.state && this.state.player) || {};
    var startCenter = mapApi.getZoneCenter('concourse') || { x: 10, z: 10 };
    var pPos = mapApi.resolveCircleWallCollision(startCenter.x, startCenter.z, 0.42);

    var baseMaxHp = Math.max(80, Number(pState.maxHp) || 100) + this.passives.maxHpBonus;
    var startHp = clamp(Number(pState.hp) || baseMaxHp, 35, baseMaxHp);
    var maxEnergy = Math.max(80, Number(pState.maxEnergy) || 100);
    var maxSanity = Math.max(80, Number(pState.maxSanity) || 100);

    var charVis = (this.loadout && this.loadout.characterVisual) || {};
    var pVis = this.createActorVisual('player', ACTOR_DIMENSIONS.player.width, ACTOR_DIMENSIONS.player.height, charVis.auraColor || '#6fd8ea', false);
    pVis.group.position.set(pPos.x, 0, pPos.z);

    // Cache wet puddle zones from SceneArchitect for footsteps water splash ripples
    try {
      var propSpecs = INFINITY.SceneArchitect && typeof INFINITY.SceneArchitect.getZonePropSpecs === 'function'
        ? INFINITY.SceneArchitect.getZonePropSpecs()
        : null;
      this.puddleZones = (propSpecs && Array.isArray(propSpecs.puddles)) ? propSpecs.puddles : [];
    } catch (_) {
      this.puddleZones = [];
    }

    // Personal Fresnel Hex-Geodesic Aegis Shield Dome (hidden until aegis_shield active)
    var aegisBuilt = (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.buildAegisShield === 'function')
      ? INFINITY.VfxStudio.buildAegisShield(this, pVis.group, hexToInt(charVis.auraColor, 0x5ce8ff), hexToInt(charVis.accentColor, 0xf5cf76))
      : null;

    // Build-driven character aura sigil & orbiting relics reflecting the player's equipped bloodlines/items
    var playerAura = this.buildPlayerBuildAura(pVis.group, charVis);

    this.player = {
      id: 'player',
      name: pState.name || '考生',
      x: pPos.x,
      z: pPos.z,
      vx: 0,
      vz: 0,
      radius: 0.42,
      facingLeft: false,
      hp: startHp,
      maxHp: baseMaxHp,
      energy: maxEnergy,
      maxEnergy: maxEnergy,
      sanity: clamp(Number(pState.sanity) || maxSanity, 30, maxSanity),
      maxSanity: maxSanity,
      shieldHp: 0,
      shieldTimer: 0,
      shieldColor: 0x66e8ff,
      shieldMesh: aegisBuilt ? aegisBuilt.shieldMesh : new THREE.Group(),
      shieldShell: aegisBuilt ? aegisBuilt.shieldShell : null,
      shieldMat: aegisBuilt ? aegisBuilt.shieldMat : null,
      shieldCoreMat: aegisBuilt ? aegisBuilt.shieldCoreMat : null,
      shieldRing: aegisBuilt ? aegisBuilt.shieldRing : null,
      shieldOrbit2: aegisBuilt ? aegisBuilt.shieldOrbit2 : null,
      shieldRingMat: aegisBuilt ? aegisBuilt.shieldRingMat : null,
      aura: playerAura,
      auraPulse: 0,
      overclockTimer: 0,
      overclockColor: 0x4df8ff,
      overclockArcCd: 0,
      afterimageAccum: 0,
      stealthTimer: 0,
      stealthColor: 0x9e82ff,
      invulnTimer: 0,
      attackCd: 0,
      dashTimer: 0,
      dashVx: 0,
      dashVz: 0,
      dashColor: semanticInt('dashTrailInt', 0x52e5ff),
      channelTimer: 0,
      ruleBindTimer: 0,
      lowHpPulseCd: 0,
      footstepAccum: 0,
      stepRippleAccum: 0,
      squashX: 1,
      squashY: 1,
      leanZ: 0,
      animFrame: 'idle',
      animTimer: 0,
      idlePhase: 0,
      actionTimer: 0,
      hitFlash: 0,
      whiteFlash: 0,
      vis: pVis
    };

    // Build 4 Autonomous Squad NPCs dispersed across separate sectors (true infinite-flow survival start)
    var npcSpawns = DEFAULT_NPC_SPAWNS;

    for (var i = 0; i < npcSpawns.length; i++) {
      var sp = npcSpawns[i];
      var meta = getCastMeta(sp.id);
      var zc = mapApi.getZoneCenter(sp.zone) || { x: 122, z: 74 };
      var safePos = mapApi.resolveCircleWallCollision(zc.x + sp.dx, zc.z + sp.dz, 0.4);
      var vis = this.createActorVisual(sp.id, ACTOR_DIMENSIONS.squad.width, ACTOR_DIMENSIONS.squad.height, meta.accentColor, false);
      vis.group.position.set(safePos.x, 0, safePos.z);

      var npc = {
        id: sp.id,
        name: meta.name,
        role: meta.role,
        accentColor: meta.accentColor || '#7ca7d9',
        x: safePos.x,
        z: safePos.z,
        vx: 0,
        vz: 0,
        radius: 0.4,
        speed: sp.speed,
        hp: sp.hp,
        maxHp: sp.hp,
        sanity: sp.id === 'shenyan' ? 62 : (sp.id === 'lujin' ? 92 : (sp.id === 'xutan' ? 96 : 100)),
        maxSanity: 100,
        alive: true,
        facingLeft: false,
        order: 'auto',
        orderLabel: ORDER_LABELS.auto,
        holdX: safePos.x,
        holdZ: safePos.z,
        roamIndex: 0,
        dwellTimer: 1.5 + i * 0.8,
        loggedClues: Object.create(null),
        path: [],
        pathIndex: 0,
        repathTimer: 0.2 + i * 0.25,
        attackCd: 0,
        shoutCd: 0,
        sabotageCd: 18,
        animFrame: 'idle',
        animTimer: 0,
        actionTimer: 0,
        hitFlash: 0,
        vis: vis
      };

      this.squad.push(npc);
      this.squadById[npc.id] = npc;
      this.createWorldTag(npc.id, npc.name, npc.accentColor, false);
    }

    // Build Inspector Boss
    var bossCenter = mapApi.getZoneCenter('platform0') || { x: 46, z: 18 };
    var bossPos = mapApi.resolveCircleWallCollision(bossCenter.x - 2.0, bossCenter.z, 0.56);
    var bossVis = this.createActorVisual('inspector', ACTOR_DIMENSIONS.inspector.width, ACTOR_DIMENSIONS.inspector.height, '#ff2a3c', true);
    bossVis.group.position.set(bossPos.x, 0, bossPos.z);

    // Glowing crimson lantern orb attached to Inspector
    var orbGeo = this.trackGeo(new THREE.SphereGeometry(0.22, 10, 10));
    var orbMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0xff364a }));
    var orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0.45, 1.45, 0.3);
    bossVis.group.add(orb);
    this.inspectorLanternOrb = orb;

    // 0.9s Crimson Lunge Telegraph Cone/Wedge on floor
    var teleGeo = this.trackGeo(new THREE.PlaneGeometry(2.1, 5.4));
    teleGeo.rotateX(-Math.PI / 2);
    teleGeo.translate(0, 0, 2.7);
    var teleMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff1e33,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var teleMesh = new THREE.Mesh(teleGeo, teleMat);
    teleMesh.position.y = 0.11;
    teleMesh.visible = false;
    bossVis.group.add(teleMesh);

    // Telegraph progress fill bar
    var teleFillGeo = this.trackGeo(new THREE.PlaneGeometry(1.9, 5.2));
    teleFillGeo.rotateX(-Math.PI / 2);
    teleFillGeo.translate(0, 0, 2.6);
    var teleFillMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff6e7a,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var teleFill = new THREE.Mesh(teleFillGeo, teleFillMat);
    teleFill.position.y = 0.12;
    teleFill.scale.set(1, 1, 0.01);
    teleFill.visible = false;
    bossVis.group.add(teleFill);

    // Parry-window shears glint star on Inspector (flashes bright gold-white during optimal parry timing!)
    var glintGeo = this.trackGeo(new THREE.PlaneGeometry(1.35, 1.35));
    var glintMat = this.trackMat(new THREE.MeshBasicMaterial({
      map: this.getPropTex('vfx_impact_star', '#ffe484'),
      color: 0xffe484,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    }));
    var teleParryGlint = new THREE.Mesh(glintGeo, glintMat);
    teleParryGlint.position.set(0.65, 1.55, 0.2);
    teleParryGlint.visible = false;
    bossVis.group.add(teleParryGlint);

    // Volumetric crimson lantern light cone sweeping from Inspector's left arm
    var lConeGeo = this.trackGeo(new THREE.ConeGeometry(1.15, 2.5, 14, 1, true));
    lConeGeo.rotateX(Math.PI * 0.42);
    lConeGeo.translate(0, 0, 1.15);
    var lConeMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff2238,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var lanternCone = new THREE.Mesh(lConeGeo, lConeMat);
    lanternCone.position.set(-0.55, 1.25, 0.1);
    bossVis.group.add(lanternCone);

    // Progressive Golden Containment Seal Ring around Inspector (intensifies with sealedPct)
    var sealGroup = new THREE.Group();
    sealGroup.position.y = 0.14;
    sealGroup.visible = false;
    var sealDiscGeo = this.trackGeo(new THREE.PlaneGeometry(2.5, 2.5));
    sealDiscGeo.rotateX(-Math.PI / 2);
    var sealDiscMat = this.trackMat(new THREE.MeshBasicMaterial({
      map: this.getPropTex('sigil_occult_eye', '#f0c46c'),
      color: 0xf0c46c,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var sealDisc = new THREE.Mesh(sealDiscGeo, sealDiscMat);
    sealGroup.add(sealDisc);
    var sealBandGeo = this.trackGeo(new THREE.TorusGeometry(0.96, 0.045, 8, 28));
    sealBandGeo.rotateX(Math.PI / 2);
    var sealBandMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xffe082,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var sealBand = new THREE.Mesh(sealBandGeo, sealBandMat);
    sealBand.position.y = 1.15;
    sealGroup.add(sealBand);
    bossVis.group.add(sealGroup);

    // Close Shear Cleave crimson floor arc telegraph
    var cleaveGeo = this.trackGeo(new THREE.RingGeometry(0.9, 3.85, 24, 1, -Math.PI * 0.45, Math.PI * 0.9));
    cleaveGeo.rotateX(-Math.PI / 2);
    var cleaveMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff2238,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var cleaveMesh = new THREE.Mesh(cleaveGeo, cleaveMat);
    cleaveMesh.position.y = 0.12;
    cleaveMesh.visible = false;
    bossVis.group.add(cleaveMesh);

    // Ticket Audit Gaze lock-on beam (world-space positioned from Inspector to target)
    var gazeBeamGeo = this.trackGeo(new THREE.PlaneGeometry(0.24, 1.0));
    gazeBeamGeo.rotateX(-Math.PI / 2);
    gazeBeamGeo.translate(0, 0, 0.5);
    var gazeBeamMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xffd2d8,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var gazeBeam = new THREE.Mesh(gazeBeamGeo, gazeBeamMat);
    gazeBeam.position.y = 1.32;
    gazeBeam.visible = false;
    this.scene.add(gazeBeam);

    // Rule Shockwave Slam expanding ring telegraph
    var slamRingGeo = this.trackGeo(new THREE.RingGeometry(0.86, 1.0, 36));
    slamRingGeo.rotateX(-Math.PI / 2);
    var slamRingMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff2640,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var slamRing = new THREE.Mesh(slamRingGeo, slamRingMat);
    slamRing.position.y = 0.13;
    slamRing.visible = false;
    bossVis.group.add(slamRing);

    // Phase-2 / Vulnerability Exposed Core Weakpoint Reticle
    var weakpointVis = (INFINITY.CombatFeel && typeof INFINITY.CombatFeel.buildBossWeakpointVisual === 'function')
      ? INFINITY.CombatFeel.buildBossWeakpointVisual(THREE, bossVis.group, this.trackGeo.bind(this), this.trackMat.bind(this))
      : null;

    // Phase-2 Heavy-Ink Crimson Rule-Rift Mutation Rig (visible when ins.phase >= 2)
    var phase2AuraGroup = new THREE.Group();
    phase2AuraGroup.visible = false;
    var p2FloorGeo = this.trackGeo(new THREE.PlaneGeometry(3.2, 3.2));
    p2FloorGeo.rotateX(-Math.PI / 2);
    var p2FloorMat = this.trackMat(new THREE.MeshBasicMaterial({
      map: this.getPropTex('sigil_occult_eye', '#ff243c'),
      color: 0xff2038,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var p2FloorRing = new THREE.Mesh(p2FloorGeo, p2FloorMat);
    p2FloorRing.position.y = 0.085;
    phase2AuraGroup.add(p2FloorRing);
    var p2OrbitGeo = this.trackGeo(new THREE.TorusGeometry(1.18, 0.028, 6, 36));
    var p2OrbitMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff2842,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var p2BladeL = new THREE.Mesh(p2OrbitGeo, p2OrbitMat);
    p2BladeL.position.set(0, 1.38, 0);
    p2BladeL.rotation.x = Math.PI * 0.36;
    var p2BladeR = new THREE.Mesh(p2OrbitGeo, p2OrbitMat);
    p2BladeR.position.set(0, 1.38, 0);
    p2BladeR.rotation.x = -Math.PI * 0.36;
    p2BladeR.scale.set(0.84, 0.84, 0.84);
    phase2AuraGroup.add(p2BladeL, p2BladeR);
    bossVis.group.add(phase2AuraGroup);

    this.inspector = {
      id: 'inspector',
      name: '零号检票员',
      x: bossPos.x,
      z: bossPos.z,
      vx: 0,
      vz: 0,
      radius: 0.56,
      hp: BOSS_DEATH_EXAM_CONFIG.maxHp,
      maxHp: BOSS_DEATH_EXAM_CONFIG.maxHp,
      phase: 1,
      phase2AuraGroup: phase2AuraGroup,
      p2FloorRing: p2FloorRing,
      p2BladeL: p2BladeL,
      p2BladeR: p2BladeR,
      mutated: false,
      mutationTier: 'dormant',
      threatTier: 'low',
      skillCycleIndex: 0,
      sealedPct: 0,
      alive: true,
      state: 'PATROL', // 'PATROL' | 'INVESTIGATE' | 'HUNT'
      patrolZones: ['platform0', 'corridor', 'tunnel', 'substation', 'corridor', 'dispatch'],
      patrolIdx: 1,
      investigateTarget: null,
      investigateTimer: 0,
      huntTargetId: 'player',
      huntLoseTimer: 0,
      path: [],
      pathIndex: 0,
      repathTimer: 0.3,
      stunTimer: 0,
      stunImmuneTimer: 0,
      armorBrokenTimer: 0,
      armorMsgCd: 0,
      weakpointTimer: 0,
      weakpointMaxTimer: 0,
      weakpointReason: null,
      pendingWeakpoint: null,
      weakpointVis: weakpointVis,
      chainTimer: 0,
      chainMeshes: [],
      blinkCd: 4.5,
      blinkTelegraph: 0,
      blinkTelegraphMax: 0.48,
      blinkTargetX: bossPos.x,
      blinkTargetZ: bossPos.z,
      lungeCd: 2.0,
      lungeTelegraph: 0,
      lungeTelegraphMax: 0.85,
      lungeWindup: 0,
      lungeActive: 0,
      lungeDirX: 0,
      lungeDirZ: 1,
      lungeHitDone: false,
      cleaveCd: 1.4,
      cleaveTelegraph: 0,
      cleaveDirX: 0,
      cleaveDirZ: 1,
      gazeCd: 5.5,
      gazeTelegraph: 0,
      gazeTargetId: 'player',
      slamCd: 9.5,
      slamTelegraph: 0,
      kiteTimer: 0,
      teleMesh: teleMesh,
      teleFill: teleFill,
      teleParryGlint: teleParryGlint,
      teleParryGlintMat: glintMat,
      cleaveMesh: cleaveMesh,
      cleaveMat: cleaveMat,
      gazeBeam: gazeBeam,
      gazeBeamMat: gazeBeamMat,
      slamRing: slamRing,
      slamRingMat: slamRingMat,
      lanternCone: lanternCone,
      lanternConeMat: lConeMat,
      sealGroup: sealGroup,
      sealDisc: sealDisc,
      sealDiscMat: sealDiscMat,
      sealBand: sealBand,
      sealBandMat: sealBandMat,
      mistAccum: 0,
      rageArcAccum: 0,
      squashX: 1,
      squashY: 1,
      leanZ: 0,
      facingLeft: false,
      animFrame: 'idle',
      animTimer: 0,
      idlePhase: 0,
      actionTimer: 0,
      hitFlash: 0,
      whiteFlash: 0,
      vis: bossVis
    };

    this.createWorldTag('inspector', '零号检票员', '#ff3b4f', true);
  };

  // Build player build-driven rotating sigil & 1..4 floating orbiting relics (covering all 500 items/bloodlines)
  EngineSession.prototype.buildPlayerBuildAura = function (parentGroup, charVis) {
    var THREE = this.THREE;
    var auraGroup = new THREE.Group();
    var primaryHex = hexToInt(charVis && charVis.auraColor, 0x6fd8ea);
    var accentHex = hexToInt(charVis && charVis.accentColor, 0xf0c46c);
    var sigilKey = 'sigil_' + ((charVis && charVis.sigilStyle) || 'bagua');
    var orbiterType = (charVis && charVis.orbiterType) || 'sword';
    var ownedItems = (this.state && this.state.player && Array.isArray(this.state.player.ownedItems))
      ? this.state.player.ownedItems
      : [];
    var orbiterCount = computePlayerOrbiterCount(ownedItems, charVis);

    // Subtle etched under-foot build sigil (restrained idle presence, flares on cast pulse)
    var sigilGeo = this.trackGeo(new THREE.PlaneGeometry(1.28, 1.28));
    sigilGeo.rotateX(-Math.PI / 2);
    var sigilMat = this.trackMat(new THREE.MeshBasicMaterial({
      map: this.getPropTex(sigilKey, '#6fd8ea'),
      color: primaryHex,
      transparent: true,
      opacity: ownedItems.length === 0 ? 0.06 : (0.12 + Math.min(0.08, (Number(charVis && charVis.tierRank) || 0) * 0.02)),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var sigilMesh = new THREE.Mesh(sigilGeo, sigilMat);
    sigilMesh.position.y = 0.066;
    auraGroup.add(sigilMesh);

    // Optional S-tier / A-tier / Fused harmonic tilted halo ring
    var haloMesh = null;
    var haloMat = null;
    if (ownedItems.length > 0 && ((charVis && charVis.tierRank >= 3) || (charVis && charVis.hasFused))) {
      var haloGeo = this.trackGeo(new THREE.TorusGeometry(0.84, 0.024, 6, 32));
      haloMat = this.trackMat(new THREE.MeshBasicMaterial({
        color: charVis.hasFused ? accentHex : primaryHex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.y = 1.05;
      haloMesh.rotation.x = Math.PI * 0.36;
      auraGroup.add(haloMesh);
    }

    // Orbiting relics (only manifested once the player actually equips items/bloodlines)
    var orbiters = [];
    for (var i = 0; i < orbiterCount; i++) {
      var orbColor = (i % 2 === 1 && (charVis && charVis.hasFused)) ? accentHex : primaryHex;
      var mesh;
      var mat;
      if (orbiterType === 'sword' || orbiterType === 'talisman' || orbiterType === 'drone_bit') {
        var spriteKey = orbiterType === 'sword' ? 'vfx_sword_bit' : (orbiterType === 'talisman' ? 'vfx_talisman' : 'vfx_drone_bit');
        var oGeo = this.trackGeo(new THREE.PlaneGeometry(0.42, 0.42));
        mat = this.trackMat(new THREE.MeshBasicMaterial({
          map: this.getPropTex(spriteKey, '#ffffff'),
          color: orbiterType === 'talisman' ? 0xffffff : orbColor,
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        }));
        mesh = new THREE.Mesh(oGeo, mat);
        mesh.rotation.x = -0.28;
      } else if (orbiterType === 'blood_shard' || orbiterType === 'void_prism') {
        var cGeo = this.trackGeo(new THREE.OctahedronGeometry(0.13, 0));
        mat = this.trackMat(new THREE.MeshBasicMaterial({
          color: orbColor,
          wireframe: orbiterType === 'void_prism',
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending
        }));
        mesh = new THREE.Mesh(cGeo, mat);
        mesh.scale.set(0.85, 1.4, 0.85);
      } else if (orbiterType === 'bio_helix') {
        var bGeo = this.trackGeo(new THREE.PlaneGeometry(0.34, 0.34));
        mat = this.trackMat(new THREE.MeshBasicMaterial({
          map: this.getPropTex('vfx_heal_cross', '#58e89a'),
          color: orbColor,
          transparent: true,
          opacity: 0.76,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        }));
        mesh = new THREE.Mesh(bGeo, mat);
      } else if (orbiterType === 'kinetic_plate') {
        // Sleek translucent hex-glyph ring instead of a raw floating white box
        var kGeo = this.trackGeo(new THREE.RingGeometry(0.10, 0.16, 6));
        mat = this.trackMat(new THREE.MeshBasicMaterial({
          color: orbColor,
          transparent: true,
          opacity: 0.48,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
        mesh = new THREE.Mesh(kGeo, mat);
      } else {
        // rune_orb
        var rGeo = this.trackGeo(new THREE.SphereGeometry(0.10, 8, 8));
        mat = this.trackMat(new THREE.MeshBasicMaterial({
          color: orbColor,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending
        }));
        mesh = new THREE.Mesh(rGeo, mat);
      }
      auraGroup.add(mesh);
      orbiters.push({
        mesh: mesh,
        mat: mat,
        phase: (i / orbiterCount) * Math.PI * 2,
        heightOffset: 0.88 + (i % 2) * 0.34,
        radius: 0.74 + (i % 2) * 0.12
      });
    }

    parentGroup.add(auraGroup);
    return {
      group: auraGroup,
      sigilMesh: sigilMesh,
      sigilMat: sigilMat,
      baseSigilOpacity: sigilMat.opacity,
      haloMesh: haloMesh,
      haloMat: haloMat,
      orbiters: orbiters,
      angle: 0
    };
  };

  EngineSession.prototype.updatePlayerBuildAura = function (realDt) {
    var p = this.player;
    if (!p || !p.aura) return;
    var a = p.aura;
    var isOverclock = p.overclockTimer > 0;
    var isStealth = p.stealthTimer > 0;
    if (p.auraPulse > 0) p.auraPulse = Math.max(0, p.auraPulse - realDt * 2.8);

    var spinMult = isOverclock ? 3.2 : (1.0 + p.auraPulse * 2.4);
    a.angle += realDt * 1.45 * spinMult;
    a.sigilMesh.rotation.z -= realDt * 0.72 * spinMult;
    var sc = 1.0 + p.auraPulse * 0.32 + Math.sin(this.elapsedReal * 2.8) * 0.04;
    a.sigilMesh.scale.set(sc, sc, 1);

    var alphaScale = isStealth ? 0.22 : 1.0;
    a.sigilMat.opacity = clamp((a.baseSigilOpacity + p.auraPulse * 0.34) * alphaScale, 0.06, 0.85);

    if (a.haloMesh && a.haloMat) {
      a.haloMesh.rotation.z += realDt * 1.1 * spinMult;
      a.haloMesh.rotation.y += realDt * 0.65 * spinMult;
      a.haloMat.opacity = clamp((0.42 + p.auraPulse * 0.38) * alphaScale, 0.08, 0.88);
    }

    for (var i = 0; i < a.orbiters.length; i++) {
      var o = a.orbiters[i];
      var ang = a.angle + o.phase;
      var rad = o.radius + p.auraPulse * 0.28;
      o.mesh.position.set(
        Math.cos(ang) * rad,
        o.heightOffset + Math.sin(this.elapsedReal * 3.8 + o.phase) * 0.14,
        Math.sin(ang) * rad
      );
      o.mesh.rotation.y = -ang + Math.PI * 0.5;
      o.mat.opacity = (isOverclock ? 0.96 : 0.82) * alphaScale;
    }
  };

  EngineSession.prototype.triggerActorSquash = function (actor, sx, sy) {
    if (!actor) return;
    actor.squashX = sx;
    actor.squashY = sy;
  };

  EngineSession.prototype.createWorldTag = function (id, name, color, isBoss) {
    if (!this.tagsLayer) return;
    var el = document.createElement('div');
    el.style.cssText =
      'position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;' +
      'align-items:center;pointer-events:none;transition:opacity 0.15s ease;';

    var nameEl = document.createElement('div');
    nameEl.textContent = name;
    nameEl.style.cssText =
      'font-size:' + (isBoss ? '11px' : '10px') + ';font-weight:700;letter-spacing:0.5px;' +
      'color:' + color + ';text-shadow:0 1px 4px #000,0 0 8px rgba(0,0,0,0.9);margin-bottom:2px;white-space:nowrap;';
    el.appendChild(nameEl);

    var barBg = document.createElement('div');
    barBg.style.cssText =
      'width:' + (isBoss ? '66px' : '38px') + ';height:' + (isBoss ? '5px' : '3px') + ';' +
      'background:rgba(5,8,14,0.85);border:1px solid rgba(255,255,255,0.18);overflow:hidden;';
    var hpFill = document.createElement('div');
    hpFill.style.cssText = 'height:100%;width:100%;background:' + (isBoss ? '#ff334b' : color) + ';';
    barBg.appendChild(hpFill);
    el.appendChild(barBg);

    var sealFill = null;
    if (isBoss) {
      var sealBg = document.createElement('div');
      sealBg.style.cssText =
        'width:66px;height:3px;margin-top:1px;background:rgba(5,8,14,0.85);border:1px solid rgba(240,196,108,0.3);overflow:hidden;';
      sealFill = document.createElement('div');
      sealFill.style.cssText = 'height:100%;width:0%;background:#f0c46c;';
      sealBg.appendChild(sealFill);
      el.appendChild(sealBg);
    }

    this.tagsLayer.appendChild(el);
    this.worldTags[id] = { el: el, hpFill: hpFill, sealFill: sealFill, nameEl: nameEl };
  };

  EngineSession.prototype.buildReticle = function () {
    var THREE = this.THREE;
    var group = new THREE.Group();

    var outerGeo = this.trackGeo(new THREE.RingGeometry(0.32, 0.42, 24));
    outerGeo.rotateX(-Math.PI / 2);
    var outerMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0x6fd8ea,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var outer = new THREE.Mesh(outerGeo, outerMat);
    group.add(outer);

    var dotGeo = this.trackGeo(new THREE.CircleGeometry(0.08, 12));
    dotGeo.rotateX(-Math.PI / 2);
    var dot = new THREE.Mesh(dotGeo, outerMat);
    group.add(dot);

    group.position.set(12, 0.09, 10);
    this.scene.add(group);
    this.reticle = { group: group, outer: outer, mat: outerMat };

    // Aim-preview meshes for hold-1..4 targeting (circle area or directional line)
    var prevGroup = new THREE.Group();
    prevGroup.visible = false;

    var prevRingGeo = this.trackGeo(new THREE.RingGeometry(0.92, 1.0, 36));
    prevRingGeo.rotateX(-Math.PI / 2);
    var prevRingMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0x5ce8ff,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var prevRing = new THREE.Mesh(prevRingGeo, prevRingMat);
    prevRing.position.y = 0.095;

    var prevFillGeo = this.trackGeo(new THREE.CircleGeometry(0.92, 32));
    prevFillGeo.rotateX(-Math.PI / 2);
    var prevFillMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0x5ce8ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var prevFill = new THREE.Mesh(prevFillGeo, prevFillMat);
    prevFill.position.y = 0.09;

    var prevCircleGrp = new THREE.Group();
    prevCircleGrp.add(prevRing, prevFill);
    prevGroup.add(prevCircleGrp);

    var prevLineGeo = this.trackGeo(new THREE.PlaneGeometry(1.0, 1.0));
    prevLineGeo.rotateX(-Math.PI / 2);
    var prevLineMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0x5ce8ff,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var prevLine = new THREE.Mesh(prevLineGeo, prevLineMat);
    prevLine.position.y = 0.094;
    prevGroup.add(prevLine);

    this.scene.add(prevGroup);
    this.aimPreview = {
      group: prevGroup,
      circleGroup: prevCircleGrp,
      ring: prevRing,
      ringMat: prevRingMat,
      fillMat: prevFillMat,
      line: prevLine,
      lineMat: prevLineMat
    };
  };

  EngineSession.prototype.buildAtmosphericDust = function () {
    var THREE = this.THREE;
    var w = this.mapApi.GRID_W || 224;
    var h = this.mapApi.GRID_H || 152;
    var count = w > 160 ? 560 : (w > 80 ? 420 : 180);
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = Math.random() * w;
      positions[i * 3 + 1] = 0.35 + Math.random() * 2.8;
      positions[i * 3 + 2] = Math.random() * h;
    }
    var geo = this.trackGeo(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = this.trackMat(new THREE.PointsMaterial({
      color: 0x8eb8d4,
      size: 0.11,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    this.dustPoints = new THREE.Points(geo, mat);
    this.scene.add(this.dustPoints);
  };

  // ---------------------------------------------------------------------------
  // Dynamic Per-Zone Scene Asset Rigs, Atmosphere & Ambience Controller
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildZoneSceneAssetRigs = function () {
    var THREE = this.THREE;
    if (!this.scene || !this.mapApi) return;

    this.zoneAssetRigs = Object.create(null);

    // Shared soft radial mist/glow CanvasTexture for zone-scoped ground haze & light shafts
    var hazeCanvas = document.createElement('canvas');
    hazeCanvas.width = 256;
    hazeCanvas.height = 256;
    var hCtx = hazeCanvas.getContext('2d');
    var grad = hCtx.createRadialGradient(128, 128, 10, 128, 128, 126);
    grad.addColorStop(0, 'rgba(255,255,255,0.68)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.28)');
    grad.addColorStop(1, 'rgba(255,255,255,0.0)');
    hCtx.fillStyle = grad;
    hCtx.fillRect(0, 0, 256, 256);
    var hazeTex = this.trackTex(new THREE.CanvasTexture(hazeCanvas));
    if (THREE.sRGBEncoding !== undefined) hazeTex.encoding = THREE.sRGBEncoding;

    var shaftCanvas = document.createElement('canvas');
    shaftCanvas.width = 128;
    shaftCanvas.height = 256;
    var sCtx = shaftCanvas.getContext('2d');
    var sGrad = sCtx.createLinearGradient(0, 0, 0, 256);
    sGrad.addColorStop(0, 'rgba(255,255,255,0.42)');
    sGrad.addColorStop(0.55, 'rgba(255,255,255,0.14)');
    sGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 256);
    var shaftTex = this.trackTex(new THREE.CanvasTexture(shaftCanvas));
    if (THREE.sRGBEncoding !== undefined) shaftTex.encoding = THREE.sRGBEncoding;

    var hazeGeo = this.trackGeo(new THREE.PlaneGeometry(1, 1));
    hazeGeo.rotateX(-Math.PI / 2);
    var shaftGeo = this.trackGeo(new THREE.PlaneGeometry(4.2, 3.1));

    var boundsMap = (this.mapApi && this.mapApi.ZONE_BOUNDS) || null;
    var zoneIds = Object.keys(ZONE_SCENE_CONFIGS);
    var subZones = (this.mapApi && typeof this.mapApi.getSubZones === 'function')
      ? (this.mapApi.getSubZones() || [])
      : [];

    for (var i = 0; i < zoneIds.length; i++) {
      var zid = zoneIds[i];
      var cfg = resolveZoneSceneConfig(zid, this.mapApi);
      var b = boundsMap && boundsMap[zid];
      var zCenter = (this.mapApi && typeof this.mapApi.getZoneCenter === 'function')
        ? this.mapApi.getZoneCenter(zid)
        : { x: 41.5, z: 37.5 };
      var cx = b ? ((b.x0 + b.x1) * 0.5) : zCenter.x;
      var cz = b ? ((b.z0 + b.z1) * 0.5) : zCenter.z;
      var spanX = b ? Math.max(16, (b.x1 - b.x0) * 0.92) : 28;
      var spanZ = b ? Math.max(16, (b.z1 - b.z0) * 0.92) : 24;

      var group = new THREE.Group();
      group.name = 'zone_asset_rig_' + zid;
      group.visible = false;

      var hazeMat = this.trackMat(new THREE.MeshBasicMaterial({
        map: hazeTex,
        color: cfg.accentHex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      var hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
      hazeMesh.position.set(cx, FLOOR_Y + 0.055, cz);
      hazeMesh.scale.set(spanX, 1, spanZ);
      group.add(hazeMesh);

      var shaftMat = this.trackMat(new THREE.MeshBasicMaterial({
        map: shaftTex,
        color: cfg.accentHex,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));

      // Place volumetric accent light-shafts at each sub-zone focal anchor inside this zone
      var anchors = [];
      for (var si = 0; si < subZones.length; si++) {
        if (subZones[si] && subZones[si].zoneId === zid) {
          anchors.push({ x: subZones[si].cx, z: subZones[si].cz });
        }
      }
      if (anchors.length === 0) anchors.push({ x: cx, z: cz });

      var shafts = [];
      for (var ai = 0; ai < anchors.length; ai++) {
        var sh = new THREE.Mesh(shaftGeo, shaftMat);
        sh.position.set(anchors[ai].x, 1.75, anchors[ai].z);
        sh.rotation.y = (ai % 2 === 0 ? 0.18 : -0.18);
        group.add(sh);
        shafts.push(sh);
      }

      this.scene.add(group);
      this.zoneAssetRigs[zid] = {
        zoneId: zid,
        key: cfg.assetSet.key,
        group: group,
        hazeMat: hazeMat,
        shaftMat: shaftMat,
        shafts: shafts,
        weight: 0,
        targetHazeOpacity: cfg.assetSet.groundHazeOpacity,
        targetShaftOpacity: cfg.assetSet.shaftOpacity,
        pulseHz: cfg.assetSet.pulseHz
      };
    }
  };

  EngineSession.prototype.showZoneBanner = function (zoneInfo, subZoneInfo, cfg) {
    if (!this.zoneBannerEl || !zoneInfo) return;
    var accent = (cfg && cfg.accentCss) || zoneInfo.color || '#68c8de';
    var code = (subZoneInfo && subZoneInfo.code) || zoneInfo.code || 'Z-01';
    var title = zoneInfo.name || '零号回廊';
    var subText = (subZoneInfo && subZoneInfo.name) ? subZoneInfo.name : '';
    var audioLabel = (cfg && cfg.audio && cfg.audio.label) ? ('♪ ' + cfg.audio.label) : '';

    this.zoneBannerEl.style.borderColor = accent;
    this.zoneBannerEl.style.borderTopColor = accent;
    this.zoneBannerEl.innerHTML = '';

    var topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;align-items:center;gap:8px;';

    var codeSpan = document.createElement('span');
    codeSpan.style.cssText =
      'font-size:10.5px;font-weight:700;letter-spacing:0.08em;padding:1px 6px;border-radius:3px;' +
      'background:rgba(255,255,255,0.08);color:' + accent + ';';
    codeSpan.textContent = code;
    topRow.appendChild(codeSpan);

    var titleSpan = document.createElement('strong');
    titleSpan.style.cssText = 'font-size:14.5px;letter-spacing:0.1em;color:#f0f6fc;font-weight:700;';
    titleSpan.textContent = title;
    topRow.appendChild(titleSpan);
    this.zoneBannerEl.appendChild(topRow);

    if (subText || audioLabel) {
      var subRow = document.createElement('div');
      subRow.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:11px;color:#b8cade;letter-spacing:0.04em;';
      if (subText) {
        var s1 = document.createElement('span');
        s1.textContent = subText;
        subRow.appendChild(s1);
      }
      if (audioLabel) {
        var s2 = document.createElement('span');
        s2.style.color = accent;
        s2.style.opacity = '0.9';
        s2.textContent = audioLabel;
        subRow.appendChild(s2);
      }
      this.zoneBannerEl.appendChild(subRow);
    }

    this.zoneBannerEl.style.opacity = '1';
    this.zoneBannerEl.style.transform = 'translate(-50%,0px)';
    this.zoneBannerTimer = 2.6;
  };

  EngineSession.prototype.updateZoneEnvironment = function (realDt, forceSnap) {
    if (!this.mapApi || !this.player) return;
    var p = this.player;
    var curZoneId = this.mapApi.getZoneAt(p.x, p.z) || 'concourse';
    var curSubZone = (typeof this.mapApi.getSubZoneAt === 'function')
      ? this.mapApi.getSubZoneAt(p.x, p.z)
      : null;
    var curSubZoneId = curSubZone ? curSubZone.id : null;

    var zoneChanged = (curZoneId !== this.activeZoneId);
    var subZoneChanged = (curSubZoneId !== this.activeSubZoneId);

    if (zoneChanged) {
      var prevZoneId = this.activeZoneId;
      var cfg = resolveZoneSceneConfig(curZoneId, this.mapApi);
      var zInfo = getZoneInfo(this.mapApi, curZoneId);
      this.activeZoneId = curZoneId;
      this.activeSubZoneId = curSubZoneId;
      this.activeZoneConfig = cfg;
      this.activeZoneAudioId = cfg.audio ? cfg.audio.id : null;

      // Update particle drift profile for the newly entered zone
      if (cfg.dust) {
        this.dustDrift.x = cfg.dust.driftX;
        this.dustDrift.y = cfg.dust.driftY;
        this.dustDrift.z = cfg.dust.driftZ;
      }

      // Dynamically switch background environmental soundscape for this zone
      safeAudio('setZoneAmbience', curZoneId, cfg.audio);
      if (prevZoneId) {
        playSfxSafe('zone_enter');
        this.showZoneBanner(zInfo, curSubZone, cfg);
      }

      // Immediately push updated zone name & asset/audio state to the HUD
      this.emitHudSnapshot();
    } else if (subZoneChanged) {
      this.activeSubZoneId = curSubZoneId;
      if (this.activeZoneConfig) {
        this.showZoneBanner(getZoneInfo(this.mapApi, curZoneId), curSubZone, this.activeZoneConfig);
      }
      this.emitHudSnapshot();
    }

    var activeCfg = this.activeZoneConfig || resolveZoneSceneConfig(curZoneId, this.mapApi);
    if (!activeCfg || !this.THREE) return;

    var dt = Math.max(0.001, realDt || 0.016);
    var blend = forceSnap ? 1.0 : (1 - Math.exp(-3.2 * dt));
    var tmpC = this._tmpColor || (this._tmpColor = new this.THREE.Color());

    // 1. Smoothly transition global lighting rig (Ambient, Hemisphere, Key, Rim)
    if (this.ambientLight) {
      tmpC.setHex(activeCfg.ambientColor);
      this.ambientLight.color.lerp(tmpC, blend);
      this.ambientLight.intensity = lerp(this.ambientLight.intensity, activeCfg.ambientIntensity, blend);
    }
    if (this.hemiLight) {
      tmpC.setHex(activeCfg.hemiSky);
      this.hemiLight.color.lerp(tmpC, blend);
      tmpC.setHex(activeCfg.hemiGround);
      this.hemiLight.groundColor.lerp(tmpC, blend);
      this.hemiLight.intensity = lerp(this.hemiLight.intensity, activeCfg.hemiIntensity, blend);
    }
    if (this.dirKeyLight) {
      tmpC.setHex(activeCfg.keyColor);
      this.dirKeyLight.color.lerp(tmpC, blend);
      this.dirKeyLight.intensity = lerp(this.dirKeyLight.intensity, activeCfg.keyIntensity, blend);
    }
    if (this.dirRimLight) {
      tmpC.setHex(activeCfg.rimColor);
      this.dirRimLight.color.lerp(tmpC, blend);
      this.dirRimLight.intensity = lerp(this.dirRimLight.intensity, activeCfg.rimIntensity, blend);
    }
    if (this.flashLight) {
      tmpC.setHex(activeCfg.flashColor);
      this.flashLight.color.lerp(tmpC, blend);
    }

    // 2. Smoothly transition scene fog, background, clear color & exposure
    if (this.scene && this.scene.fog) {
      tmpC.setHex(activeCfg.fogColor);
      this.scene.fog.color.lerp(tmpC, blend);
      if (typeof this.scene.fog.density === 'number') {
        this.scene.fog.density = lerp(this.scene.fog.density, activeCfg.fogDensity, blend);
      }
    }
    if (this.scene && this.scene.background && this.scene.background.isColor) {
      tmpC.setHex(activeCfg.bgColor);
      this.scene.background.lerp(tmpC, blend);
      if (this.renderer && typeof this.renderer.setClearColor === 'function') {
        this.renderer.setClearColor(this.scene.background, 1);
      }
    }
    if (this.renderer && typeof this.renderer.toneMappingExposure === 'number') {
      this.renderer.toneMappingExposure = lerp(this.renderer.toneMappingExposure, activeCfg.exposure, blend);
    }

    // 3. Smoothly transition atmospheric dust material profile
    if (this.dustPoints && this.dustPoints.material && activeCfg.dust) {
      var dMat = this.dustPoints.material;
      tmpC.setHex(activeCfg.dust.color);
      dMat.color.lerp(tmpC, blend);
      dMat.size = lerp(dMat.size, activeCfg.dust.size, blend);
      dMat.opacity = lerp(dMat.opacity, activeCfg.dust.opacity, blend);
    }

    // 4. Dynamically activate & crossfade the current zone's scene asset rig
    if (this.zoneAssetRigs) {
      var rigKeys = Object.keys(this.zoneAssetRigs);
      for (var rk = 0; rk < rigKeys.length; rk++) {
        var rig = this.zoneAssetRigs[rigKeys[rk]];
        if (!rig) continue;
        var targetW = (rig.zoneId === curZoneId) ? 1.0 : 0.0;
        rig.weight = forceSnap ? targetW : lerp(rig.weight, targetW, blend);
        var active = rig.weight > 0.008;
        rig.group.visible = active;
        if (active) {
          var pulse = 0.86 + 0.14 * Math.sin(this.elapsedReal * rig.pulseHz * Math.PI * 2);
          rig.hazeMat.opacity = rig.targetHazeOpacity * rig.weight * pulse;
          rig.shaftMat.opacity = rig.targetShaftOpacity * rig.weight * (0.88 + 0.12 * Math.cos(this.elapsedReal * rig.pulseHz * 2.1));
        }
      }
    }

    // 5. Subtle per-zone ambient environmental micro-VFX near the player
    if (!forceSnap && !this.ended && this.scene) {
      this.zoneFxTimer += dt;
      if (this.zoneFxTimer >= 2.2) {
        this.zoneFxTimer = 0;
        var fxKind = activeCfg.ambientFx;
        if (fxKind === 'ozone_sparks' && typeof this.spawnSparkBurst === 'function') {
          this.spawnSparkBurst(
            p.x + (Math.random() - 0.5) * 9.0,
            2.15 + Math.random() * 0.7,
            p.z + (Math.random() - 0.5) * 7.0,
            0x78b4ff,
            4
          );
        } else if (fxKind === 'steam_drip' && typeof this.spawnRingPulse === 'function') {
          this.spawnRingPulse(
            p.x + (Math.random() - 0.5) * 8.0,
            p.z + (Math.random() - 0.5) * 6.0,
            0.75,
            0xa884e0,
            0.55
          );
        } else if (fxKind === 'rail_wind' && typeof this.spawnSparkBurst === 'function') {
          this.spawnSparkBurst(
            Math.min(207.0, p.x + 3.5 + Math.random() * 3.0),
            0.6 + Math.random() * 1.4,
            p.z + (Math.random() - 0.5) * 8.0,
            0xf0b258,
            3
          );
        }
      }
    }
  };

  // ---------------------------------------------------------------------------
  // True Wall-Occluded Line-of-Sight Shadow / Fog-of-War (72-Ray 2D DDA)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildFogOfWar = function () {
    var THREE = this.THREE;
    var gridW = this.mapApi.GRID_W || 224;
    var gridH = this.mapApi.GRID_H || 152;
    var scale = gridW > 160 ? 2 : (gridW > 80 ? 3 : 4); // crisp 448x304 canvas on 224x152 mega-station
    var cw = gridW * scale;
    var ch = gridH * scale;

    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(6, 7, 11, 0.78)';
    ctx.fillRect(0, 0, cw, ch);

    var tex = this.trackTex(new THREE.CanvasTexture(canvas));
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    var geo = this.trackGeo(new THREE.PlaneGeometry(gridW, gridH));
    geo.rotateX(-Math.PI / 2);
    var mat = this.trackMat(new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: 1.0
    }));

    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(gridW * 0.5, 2.68, gridH * 0.5);
    mesh.renderOrder = 5;
    this.scene.add(mesh);

    this.fogGrid = (typeof this.mapApi.getGrid === 'function' ? this.mapApi.getGrid() : null) || [];
    this.fogRayPts = new Float32Array(72 * 2);
    this.fogOfWar = {
      canvas: canvas,
      ctx: ctx,
      tex: tex,
      mesh: mesh,
      w: cw,
      h: ch,
      gridW: gridW,
      gridH: gridH,
      scale: scale,
      accum: 1.0,
      lastX: -999,
      lastZ: -999,
      lastAimAngle: -999
    };
  };

  EngineSession.prototype.hasPassiveReconCapability = function () {
    var owned = (this.state && this.state.player && Array.isArray(this.state.player.ownedItems))
      ? this.state.player.ownedItems
      : [];
    return hasPassiveReconItem(owned);
  };

  EngineSession.prototype.hasActiveReconVision = function () {
    return (this.reconRevealTimer || 0) > 0;
  };

  EngineSession.prototype.canSeeWorldPoint = function (x, z) {
    var p = this.player;
    var mapApi = this.mapApi;
    if (!p || !mapApi) return true;
    var pZone = mapApi.getZoneAt(p.x, p.z) || null;
    var tZone = mapApi.getZoneAt(x, z) || null;
    var hasLos = typeof mapApi.hasLineOfSight === 'function'
      ? mapApi.hasLineOfSight(p.x, p.z, x, z)
      : true;
    return evaluatePointVisibility({
      px: p.x,
      pz: p.z,
      tx: x,
      tz: z,
      playerZone: pZone,
      targetZone: tZone,
      hasLineOfSight: hasLos,
      reconActive: this.hasActiveReconVision(),
      hasPassiveRecon: this.hasPassiveReconCapability()
    });
  };

  EngineSession.prototype.updateFogOfWar = function (realDt) {
    var fog = this.fogOfWar;
    var p = this.player;
    if (!fog || !p) return;

    var hasRecon = this.hasActiveReconVision() || this.hasPassiveReconCapability();
    var reconChanged = (fog.lastHasRecon !== hasRecon);

    fog.accum += realDt;
    var aimAngle = Math.atan2(this.aimWorld.z - p.z, this.aimWorld.x - p.x);
    var movedSq = (p.x - fog.lastX) * (p.x - fog.lastX) + (p.z - fog.lastZ) * (p.z - fog.lastZ);
    var aimDiff = Math.abs(Math.atan2(Math.sin(aimAngle - fog.lastAimAngle), Math.cos(aimAngle - fog.lastAimAngle)));

    var shouldUpdate = reconChanged || (fog.accum >= 0.06) || (movedSq > 0.04) || (aimDiff > 0.14 && fog.accum >= 0.032);
    if (!shouldUpdate) return;

    fog.accum = 0;
    fog.lastX = p.x;
    fog.lastZ = p.z;
    fog.lastAimAngle = aimAngle;
    fog.lastHasRecon = hasRecon;

    var ctx = fog.ctx;
    var sc = fog.scale;
    var gridW = fog.gridW;
    var gridH = fog.gridH;
    var grid = this.fogGrid;
    var pts = this.fogRayPts;
    var mapApi = this.mapApi;
    var playerZone = (mapApi && typeof mapApi.getZoneAt === 'function') ? mapApi.getZoneAt(p.x, p.z) : null;
    var rayCount = 72;
    var coneHalf = 0.61086524; // +-35 deg flashlight cone
    var coneOuter = 0.76794487; // smooth outer feather to ~44 deg

    // 1. Fill deep obsidian shadow veil (strictly opaque for unrevealed next rooms unless recon active)
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, fog.w, fog.h);
    ctx.fillStyle = hasRecon ? 'rgba(6, 7, 11, 0.80)' : 'rgba(3, 4, 7, 0.99)';
    ctx.fillRect(0, 0, fog.w, fog.h);

    // 2. Cast 72 true 2D DDA rays from player position against StationMap walls & room boundaries
    for (var i = 0; i < rayCount; i++) {
      var angle = (i / rayCount) * Math.PI * 2;
      var diff = Math.abs(Math.atan2(Math.sin(angle - aimAngle), Math.cos(angle - aimAngle)));
      var maxDist = hasRecon ? 24.0 : 18.5;
      if (diff <= coneHalf) {
        maxDist = hasRecon ? 30.0 : 23.0;
      } else if (diff < coneOuter) {
        maxDist = lerp(hasRecon ? 30.0 : 23.0, hasRecon ? 24.0 : 18.5, (diff - coneHalf) / (coneOuter - coneHalf));
      }

      var rdx = Math.cos(angle);
      var rdz = Math.sin(angle);
      var mapX = Math.floor(p.x);
      var mapZ = Math.floor(p.z);
      var deltaDistX = Math.abs(rdx) < 1e-6 ? 1e30 : Math.abs(1.0 / rdx);
      var deltaDistZ = Math.abs(rdz) < 1e-6 ? 1e30 : Math.abs(1.0 / rdz);
      var stepX, sideDistX, stepZ, sideDistZ;

      if (rdx < 0) {
        stepX = -1;
        sideDistX = (p.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - p.x) * deltaDistX;
      }
      if (rdz < 0) {
        stepZ = -1;
        sideDistZ = (p.z - mapZ) * deltaDistZ;
      } else {
        stepZ = 1;
        sideDistZ = (mapZ + 1.0 - p.z) * deltaDistZ;
      }

      var hitDist = maxDist;
      var steps = 0;
      while (steps < 56) {
        steps++;
        var currDist;
        if (sideDistX < sideDistZ) {
          currDist = sideDistX;
          sideDistX += deltaDistX;
          mapX += stepX;
        } else {
          currDist = sideDistZ;
          sideDistZ += deltaDistZ;
          mapZ += stepZ;
        }
        if (currDist >= maxDist) {
          hitDist = maxDist;
          break;
        }
        if (mapX < 0 || mapZ < 0 || mapX >= gridW || mapZ >= gridH) {
          hitDist = currDist;
          break;
        }
        if (readGridCell(grid, mapX, mapZ, gridW, gridH) === 1) {
          // Reveal front lit face of visible wall while keeping behind-wall spaces completely dark
          hitDist = Math.min(maxDist, currDist + 0.30);
          break;
        }
        // Without recon skills, do not let vision spill deep into the next room/zone
        if (!hasRecon && playerZone && currDist > 5.0 && mapApi && typeof mapApi.getZoneAt === 'function') {
          var cellZone = mapApi.getZoneAt(mapX + 0.5, mapZ + 0.5);
          if (cellZone && cellZone !== playerZone) {
            hitDist = Math.min(maxDist, currDist);
            break;
          }
        }
      }

      pts[i * 2] = (p.x + rdx * hitDist) * sc;
      pts[i * 2 + 1] = (p.z + rdz * hitDist) * sc;
    }

    // 3. Punch smooth glowing LOS visibility polygon out of the obsidian veil
    var px = p.x * sc;
    var pz = p.z * sc;
    ctx.globalCompositeOperation = 'destination-out';

    var visGrad = ctx.createRadialGradient(px, pz, 1.5 * sc, px, pz, (hasRecon ? 26.0 : 21.0) * sc);
    visGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    visGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.96)');
    visGrad.addColorStop(0.80, 'rgba(0, 0, 0, 0.72)');
    visGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.08)');

    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (var j = 1; j < rayCount; j++) {
      ctx.lineTo(pts[j * 2], pts[j * 2 + 1]);
    }
    ctx.closePath();
    ctx.fillStyle = visGrad;
    ctx.fill();

    // Guaranteed personal visibility halo around player silhouette
    var haloGrad = ctx.createRadialGradient(px, pz, 0.5 * sc, px, pz, 3.0 * sc);
    haloGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    haloGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.beginPath();
    ctx.arc(px, pz, 3.0 * sc, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // 4. Crimson lantern cutout around Inspector ONLY when player can actually see/sense Inspector!
    var ins = this.inspector;
    if (ins && ins.alive && this.canSeeWorldPoint(ins.x, ins.z)) {
      var ix = ins.x * sc;
      var iz = ins.z * sc;
      var ir = 3.5 * sc;
      var lanternAlpha = ins.stunTimer > 0 ? 0.18 : 0.45;
      var lanGrad = ctx.createRadialGradient(ix, iz, 0.2 * sc, ix, iz, ir);
      lanGrad.addColorStop(0.0, 'rgba(0, 0, 0, ' + lanternAlpha + ')');
      lanGrad.addColorStop(0.55, 'rgba(0, 0, 0, ' + (lanternAlpha * 0.48).toFixed(3) + ')');
      lanGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      ctx.beginPath();
      ctx.arc(ix, iz, ir, 0, Math.PI * 2);
      ctx.fillStyle = lanGrad;
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    fog.tex.needsUpdate = true;
  };

  // ---------------------------------------------------------------------------
  // Lightweight 2-Pass WebGL Post-Processing (Selective Bloom + Vignette + Glitch)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildPostFx = function (width, height) {
    var THREE = this.THREE;
    if (!THREE || !this.renderer) return;

    try {
      var pr = typeof this.renderer.getPixelRatio === 'function' ? this.renderer.getPixelRatio() : 1;
      var rtW = Math.max(1, Math.floor(width * pr));
      var rtH = Math.max(1, Math.floor(height * pr));

      // The scene is written to the RT in linear space (three r147 forces LinearEncoding
      // for render targets). Prefer a half-float target so dark gradients do not band
      // before the post pass re-encodes to sRGB.
      var caps = this.renderer.capabilities || {};
      var exts = this.renderer.extensions;
      var canHalfFloat = Boolean(caps.isWebGL2 && exts && typeof exts.has === 'function' &&
        (exts.has('EXT_color_buffer_float') || exts.has('EXT_color_buffer_half_float')));
      var rt = new THREE.WebGLRenderTarget(rtW, rtH, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: canHalfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType,
        depthBuffer: true,
        stencilBuffer: false
      });
      if (rt.texture) {
        rt.texture.generateMipmaps = false;
      }

      var vertShader = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position.xy, 0.0, 1.0);',
        '}'
      ].join('\n');

      var fragShader = [
        'precision mediump float;',
        'uniform sampler2D tDiffuse;',
        'uniform vec2 uResolution;',
        'uniform float uTime;',
        'uniform float uGlitch;',
        'uniform float uSlowMo;',
        'uniform float uLowHp;',
        'uniform float uFlash;',
        'uniform float uImpactInvert;',
        'uniform float uChromatic;',
        'uniform float uLetterbox;',
        'uniform float uInkEdge;',
        'varying vec2 vUv;',
        '',
        '// Exact piecewise sRGB OETF. The RT holds linear color, so the post pass must',
        '// encode before output or PostFX-on renders darker than the direct path.',
        'vec3 linearToSRGB(vec3 c) {',
        '  c = max(c, vec3(0.0));',
        '  vec3 lo = c * 12.92;',
        '  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;',
        '  return mix(lo, hi, step(vec3(0.0031308), c));',
        '}',
        '',
        'vec3 brightPass(vec3 c) {',
        '  float luma = dot(c, vec3(0.299, 0.587, 0.114));',
        '  return c * smoothstep(0.76, 0.98, luma);',
        '}',
        '',
        'void main() {',
        '  vec2 uv = vUv;',
        '  vec2 texel = 1.0 / max(uResolution, vec2(1.0));',
        '  float glitch = clamp(uGlitch, 0.0, 1.0);',
        '',
        '  // Real-time horizontal scanline tear when uGlitch > 0',
        '  if (glitch > 0.005) {',
        '    float row = floor(uv.y * 56.0);',
        '    float tStep = floor(uTime * 34.0);',
        '    float rnd = fract(sin(row * 127.1 + tStep * 311.7) * 43758.5453);',
        '    float tear = step(0.66, rnd) * (rnd - 0.83) * 0.16 * glitch;',
        '    uv.x = clamp(uv.x + tear, 0.001, 0.999);',
        '  }',
        '',
        '  // Base sample + RGB chromatic aberration split during glitch or heavy hit pulse',
        '  vec4 baseSample = texture2D(tDiffuse, uv);',
        '  vec3 col = baseSample.rgb;',
        '  float caStrength = max(glitch > 0.005 ? (0.003 + 0.016 * glitch) * (0.65 + 0.35 * sin(uTime * 46.0)) : 0.0, uChromatic * 0.009);',
        '  if (caStrength > 0.0005) {',
        '    float rCh = texture2D(tDiffuse, clamp(uv + vec2(caStrength, 0.0), 0.001, 0.999)).r;',
        '    float bCh = texture2D(tDiffuse, clamp(uv - vec2(caStrength, 0.0), 0.001, 0.999)).b;',
        '    col = vec3(rCh, col.g, bCh);',
        '  }',
        '  if (glitch > 0.005) {',
        '    float scanBar = 0.5 + 0.5 * sin(uv.y * uResolution.y * 1.5 + uTime * 30.0);',
        '    col += vec3(0.06, 0.09, 0.12) * scanBar * glitch * 0.45;',
        '  }',
        '',
        '  // Selective 9-tap bright-pass neon bloom (calibrated threshold luma > 0.76, zero white washout!)',
        '  float spread = clamp(min(uResolution.x, uResolution.y) / 360.0, 1.1, 2.6);',
        '  vec2 o1 = texel * (1.7 * spread);',
        '  vec2 o2 = texel * (2.9 * spread);',
        '  vec3 bloom = brightPass(col) * 0.18;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(o1.x, 0.0), 0.0, 1.0)).rgb) * 0.11;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv - vec2(o1.x, 0.0), 0.0, 1.0)).rgb) * 0.11;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(0.0, o1.y), 0.0, 1.0)).rgb) * 0.11;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv - vec2(0.0, o1.y), 0.0, 1.0)).rgb) * 0.11;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(o2.x, o2.y), 0.0, 1.0)).rgb) * 0.07;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(-o2.x, o2.y), 0.0, 1.0)).rgb) * 0.07;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(o2.x, -o2.y), 0.0, 1.0)).rgb) * 0.07;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(-o2.x, -o2.y), 0.0, 1.0)).rgb) * 0.07;',
        '  col += bloom * vec3(1.04, 1.01, 1.04) * 0.36;',
        '',
        '  // Linear -> sRGB; noir color grading, vignette, grain and status tints below operate in display space',
        '  col = linearToSRGB(col);',
        '  col = clamp(col, 0.0, 1.0);',
        '',
        '  // Mignola noir S-curve contrast & cold slate shadow pull (clamped input avoids bright-channel inversion)',
        '  vec3 graded = col * col * (3.0 - 2.0 * col);',
        '  col = mix(col, graded, 0.34);',
        '  float lumaGrade = dot(col, vec3(0.299, 0.587, 0.114));',
        '  col = mix(col * vec3(0.84, 0.94, 1.06), col, smoothstep(0.08, 0.52, lumaGrade));',
        '',
        '  // Deep obsidian Mignola vignette + impact ink-edge framing + micro film grain',
        '  vec2 centered = vUv * 2.0 - 1.0;',
        '  float distSq = dot(centered, centered);',
        '  float vig = smoothstep(0.42, 1.75, distSq);',
        '  col = mix(col, vec3(0.010, 0.013, 0.022), clamp(vig * (0.62 + uInkEdge * 0.34), 0.0, 0.94));',
        '',
        '  float grain = (fract(sin(dot(vUv * uResolution + fract(uTime * 13.0) * 97.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.024;',
        '  col += grain;',
        '',
        '  // Bullet-time cool cyan rim tint',
        '  if (uSlowMo > 0.01) {',
        '    col += vec3(0.06, 0.30, 0.42) * vig * uSlowMo * 0.72;',
        '  }',
        '',
        '  // Low-HP pulsing crimson border (< 35% HP)',
        '  if (uLowHp > 0.01) {',
        '    float pulse = 0.52 + 0.48 * sin(uTime * 7.5);',
        '    col = mix(col, vec3(0.76, 0.05, 0.11), vig * uLowHp * pulse * 0.65);',
        '  }',
        '',
        '  // Golden parry flash punch',
        '  if (uFlash > 0.005) {',
        '    col += vec3(1.0, 0.88, 0.52) * uFlash * 0.24;',
        '  }',
        '',
        '  // Hades / Style-1 hard-binary B&W graphic woodcut Impact Frame (zero 50% grey fog wash)',
        '  if (uImpactInvert > 0.01) {',
        '    float impLuma = dot(col, vec3(0.299, 0.587, 0.114));',
        '    float inkCut = step(0.27, impLuma);',
        '    vec3 comicBw = mix(vec3(0.95, 0.97, 1.0), vec3(0.025, 0.032, 0.052), inkCut);',
        '    float edgeFocus = smoothstep(0.32, 1.38, distSq);',
        '    comicBw = mix(comicBw, vec3(0.02, 0.025, 0.04), edgeFocus * 0.42);',
        '    col = mix(col, comicBw, step(0.5, uImpactInvert));',
        '  }',
        '',
        '  // Cinematic skill cut-in letterbox bars (Limbus Company style beat framing)',
        '  if (uLetterbox > 0.002) {',
        '    float bar = step(vUv.y, uLetterbox) + step(1.0 - uLetterbox, vUv.y);',
        '    col = mix(col, vec3(0.012, 0.015, 0.022), clamp(bar, 0.0, 1.0));',
        '  }',
        '',
        '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
        '}'
      ].join('\n');

      var quadGeo = new THREE.PlaneGeometry(2, 2);
      var quadMat = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: rt.texture },
          uResolution: { value: new THREE.Vector2(rtW, rtH) },
          uTime: { value: 0 },
          uGlitch: { value: 0 },
          uSlowMo: { value: 0 },
          uLowHp: { value: 0 },
          uFlash: { value: 0 },
          uImpactInvert: { value: 0 },
          uChromatic: { value: 0 },
          uLetterbox: { value: 0 },
          uInkEdge: { value: 0 }
        },
        vertexShader: vertShader,
        fragmentShader: fragShader,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });

      var postScene = new THREE.Scene();
      var postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      var quadMesh = new THREE.Mesh(quadGeo, quadMat);
      quadMesh.frustumCulled = false;
      postScene.add(quadMesh);

      this.postFx = {
        rt: rt,
        scene: postScene,
        camera: postCamera,
        quadGeo: quadGeo,
        quadMat: quadMat,
        quadMesh: quadMesh
      };
    } catch (_) {
      this.postFx = null;
    }
  };

  EngineSession.prototype.resizePostFx = function (width, height) {
    if (!this.postFx || !this.postFx.rt || !this.renderer) return;
    try {
      var pr = typeof this.renderer.getPixelRatio === 'function' ? this.renderer.getPixelRatio() : 1;
      var rtW = Math.max(1, Math.floor(width * pr));
      var rtH = Math.max(1, Math.floor(height * pr));
      this.postFx.rt.setSize(rtW, rtH);
      if (this.postFx.quadMat && this.postFx.quadMat.uniforms && this.postFx.quadMat.uniforms.uResolution) {
        this.postFx.quadMat.uniforms.uResolution.value.set(rtW, rtH);
      }
    } catch (_) {}
  };

  EngineSession.prototype.renderPostFx = function (realDt) {
    var fx = this.postFx;
    if (!fx || !fx.rt || !this.postFxEnabled) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    try {
      var targetSlow = (this.slowMo || this.inputPaused) ? 1.0 : 0.0;
      this.slowMoBlend = lerp(this.slowMoBlend, targetSlow, 1 - Math.exp(-10 * realDt));

      var hpRatio = this.player ? (this.player.hp / Math.max(1, this.player.maxHp)) : 1.0;
      var targetLowHp = hpRatio < 0.35 ? clamp((0.35 - hpRatio) / 0.35, 0.25, 1.0) : 0.0;
      this.lowHpBlend = lerp(this.lowHpBlend, targetLowHp, 1 - Math.exp(-6 * realDt));

      var u = fx.quadMat.uniforms;
      u.tDiffuse.value = fx.rt.texture;
      u.uTime.value = this.elapsedReal;
      u.uGlitch.value = clamp(this.glitchAmount, 0, 1);
      u.uSlowMo.value = this.slowMoBlend;
      u.uLowHp.value = this.lowHpBlend;
      u.uFlash.value = clamp(this.parryFlashTimer / 0.22, 0, 1);
      if (u.uImpactInvert) {
        u.uImpactInvert.value = this.impactFrameTimer > 0 ? 1.0 : 0.0;
      }
      var dirSt = this.directorState || { letterbox: 0, chromatic: 0, inkEdge: 0 };
      if (u.uChromatic) u.uChromatic.value = clamp(dirSt.chromatic || 0, 0, 1);
      if (u.uLetterbox) u.uLetterbox.value = clamp(dirSt.letterbox || 0, 0, 0.12);
      if (u.uInkEdge) u.uInkEdge.value = clamp(dirSt.inkEdge || 0, 0, 1);

      // three r147 applies fog after output encoding and writes clear/background colors raw,
      // so all three are display-space values. Sync live zone-transitioned display colors into
      // pre-allocated linear Color buffers so PostFX tracks dynamic zone fog/background transitions!
      var fog = this.scene.fog;
      var bg = this.scene.background;
      var bgIsColor = bg && typeof bg.isColor === 'boolean' && bg.isColor;
      if (fog && fog.color) {
        if (!fx.fogDisplay) fx.fogDisplay = new this.THREE.Color();
        if (!fx.fogLinear) fx.fogLinear = new this.THREE.Color();
        fx.fogDisplay.copy(fog.color);
        fx.fogLinear.copy(fog.color).convertSRGBToLinear();
      }
      if (bgIsColor) {
        if (!fx.bgDisplay) fx.bgDisplay = new this.THREE.Color();
        if (!fx.bgLinear) fx.bgLinear = new this.THREE.Color();
        fx.bgDisplay.copy(bg);
        fx.bgLinear.copy(bg).convertSRGBToLinear();
      }
      if (!fx.clearDisplay) fx.clearDisplay = new this.THREE.Color();
      if (!fx.clearLinear) fx.clearLinear = new this.THREE.Color();
      this.renderer.getClearColor(fx.clearDisplay);
      fx.clearLinear.copy(fx.clearDisplay).convertSRGBToLinear();

      try {
        if (fog && fx.fogLinear) fog.color.copy(fx.fogLinear);
        if (bgIsColor && fx.bgLinear) bg.copy(fx.bgLinear);
        this.renderer.setClearColor(fx.clearLinear, 1);

        this.renderer.setRenderTarget(fx.rt);
        this.renderer.render(this.scene, this.camera);
      } finally {
        if (fog && fx.fogDisplay) fog.color.copy(fx.fogDisplay);
        if (bgIsColor && fx.bgDisplay) bg.copy(fx.bgDisplay);
        if (fx.clearDisplay) this.renderer.setClearColor(fx.clearDisplay, 1);
      }

      this.renderer.setRenderTarget(null);
      this.renderer.render(fx.scene, fx.camera);
    } catch (_) {
      // Automatic graceful fallback if RenderTarget fails at runtime
      this.disposePostFx();
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
  };

  EngineSession.prototype.disposePostFx = function () {
    if (!this.postFx) return;
    try { if (this.postFx.rt) this.postFx.rt.dispose(); } catch (_) {}
    try { if (this.postFx.quadGeo) this.postFx.quadGeo.dispose(); } catch (_) {}
    try { if (this.postFx.quadMat) this.postFx.quadMat.dispose(); } catch (_) {}
    this.postFx = null;
  };

  // ---------------------------------------------------------------------------
  // Inputs & Resize Binding
  // ---------------------------------------------------------------------------
  EngineSession.prototype.isTypingInDom = function () {
    if (this.inputPaused) return true;
    var el = document.activeElement;
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  EngineSession.prototype.bindInputs = function () {
    var self = this;
    var canvas = this.renderer.domElement;

    this.addListener(global, 'keydown', function (e) {
      if (!self.mounted || self.ended) return;
      if (self.isTypingInDom()) return;

      var code = e.code || '';
      var key = (e.key || '').toLowerCase();

      if (code === 'Space' || key === ' ') {
        e.preventDefault();
        if (!e.repeat) self.toggleSlowMo();
        return;
      }

      if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight') {
        e.preventDefault();
      }

      self.keys[key] = true;
      self.keys[code] = true;

      if (!e.repeat) {
        if (code === 'Escape' || key === 'escape') {
          if (self.previewSlotIdx >= 0) {
            e.preventDefault();
            self.cancelAimPreview();
          }
          return;
        }
        var slotPressed = -1;
        if (key === '1' || code === 'Digit1') slotPressed = 0;
        else if (key === '2' || code === 'Digit2') slotPressed = 1;
        else if (key === '3' || code === 'Digit3') slotPressed = 2;
        else if (key === '4' || code === 'Digit4') slotPressed = 3;

        if (slotPressed >= 0) {
          self.handleSlotKeyDown(slotPressed);
        } else if (key === 'e' || code === 'KeyE') {
          self.triggerInteract();
        }
      }
    });

    this.addListener(global, 'keyup', function (e) {
      var code = e.code || '';
      var key = (e.key || '').toLowerCase();
      self.keys[key] = false;
      self.keys[code] = false;

      var slotReleased = -1;
      if (key === '1' || code === 'Digit1') slotReleased = 0;
      else if (key === '2' || code === 'Digit2') slotReleased = 1;
      else if (key === '3' || code === 'Digit3') slotReleased = 2;
      else if (key === '4' || code === 'Digit4') slotReleased = 3;

      if (slotReleased >= 0 && self.previewSlotIdx === slotReleased) {
        self.cancelAimPreview();
        if (self.mounted && !self.ended && !self.isTypingInDom()) {
          self.castSlot(slotReleased);
        }
      }
    });

    this.addListener(global, 'blur', function () {
      self.keys = Object.create(null);
      self.mouseDownLmb = false;
      self.cancelAimPreview();
    });

    this.addListener(canvas, 'mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      self.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.mouseActive = true;
    });

    this.addListener(canvas, 'mousedown', function (e) {
      if (!self.mounted || self.ended || self.isTypingInDom()) return;
      if (INFINITY.Audio && typeof INFINITY.Audio.unlock === 'function') {
        try { INFINITY.Audio.unlock(); } catch (_) {}
      }
      if (e.button === 2 && self.previewSlotIdx >= 0) {
        self.cancelAimPreview();
        return;
      }
      if (e.button === 0) {
        var rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          self.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          self.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          self.mouseActive = true;
          self.updateMouseAim();
        }
        self.mouseDownLmb = true;
        self.performBasicAttack();
      }
    });

    this.addListener(global, 'mouseup', function (e) {
      if (e.button === 0) self.mouseDownLmb = false;
    });

    this.addListener(canvas, 'contextmenu', function (e) {
      e.preventDefault();
    });
  };

  EngineSession.prototype.bindResize = function () {
    var self = this;
    function handleResize() {
      if (!self.mounted || !self.renderer || !self.camera || !self.containerEl) return;
      var w = Math.max(self.containerEl.clientWidth || 960, 320);
      var h = Math.max(self.containerEl.clientHeight || 560, 240);
      self.camera.aspect = w / h;
      self.camera.updateProjectionMatrix();
      self.renderer.setSize(w, h, false);
      self.resizePostFx(w, h);
    }
    this.addListener(global, 'resize', handleResize);
    if (typeof global.ResizeObserver === 'function') {
      this.resizeObserver = new global.ResizeObserver(handleResize);
      this.resizeObserver.observe(this.containerEl);
    }
  };

  // ---------------------------------------------------------------------------
  // Main 60fps Game Loop
  // ---------------------------------------------------------------------------
  EngineSession.prototype.frame = function (now) {
    var realDt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTs) * 0.001));
    this.lastFrameTs = now;
    this.elapsedReal += realDt;

    // Determine effective time scale
    var timeScale = 1.0;
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= realDt;
      timeScale = 0.03;
    } else if (this.inputPaused) {
      timeScale = 0.08;
    } else if (this.slowMo) {
      timeScale = 0.12;
    }

    var simDt = realDt * timeScale;
    this.elapsedSim += simDt;

    if (!this.ended) {
      this.stats.elapsedSec += simDt;
      this.timeRemainingSec = Math.max(0, this.timeRemainingSec - simDt);

      this.updateMouseAim();
      this.updatePlayer(simDt, realDt);
      this.updateInteractables(simDt);
      this.updateSquad(simDt);
      this.updateInspector(simDt);
      this.updateGhostTrain(simDt);
      this.updateProjectiles(simDt);
      this.updateWards(simDt);
      this.updateDrones(simDt);
      this.updateDecoys(simDt);
      this.updateBroadcasts(simDt);
      this.updateSoundAndThreat(simDt);
      this.checkWinLoss();
    }

    // Smooth real-time decay for PostFX glitch, parry flash, impact frame & inspector white hit-flash
    if (this.glitchAmount > 0) {
      this.glitchAmount = Math.max(0, this.glitchAmount * Math.exp(-4.2 * realDt) - 0.04 * realDt);
    }
    if (this.parryFlashTimer > 0) {
      this.parryFlashTimer = Math.max(0, this.parryFlashTimer - realDt);
    }
    if (this.impactFrameTimer > 0) {
      this.impactFrameTimer = Math.max(0, this.impactFrameTimer - realDt);
    }
    if (this.combatFocusTimer > 0) {
      this.combatFocusTimer = Math.max(0, this.combatFocusTimer - realDt);
    }
    if (this.cutInTimer > 0) {
      this.cutInTimer = Math.max(0, this.cutInTimer - realDt);
      if (this.cutInTimer <= 0 && this.cutInBannerEl) {
        this.cutInBannerEl.classList.remove('active');
        this.cutInBannerEl.classList.add('out');
      }
    }
    if (this.inspector && this.inspector.whiteFlash > 0) {
      this.inspector.whiteFlash = Math.max(0, this.inspector.whiteFlash - realDt);
    }

    this.updateVfx(simDt, realDt);
    this.updateSoundRipples(simDt);
    this.updateZoneEnvironment(realDt, false);
    this.updateLights(realDt);
    if (INFINITY.SceneArchitect && typeof INFINITY.SceneArchitect.updateAmbientDynamics === 'function') {
      INFINITY.SceneArchitect.updateAmbientDynamics(this, realDt);
    }
    this.updateFogOfWar(realDt);
    this.updateSpatialAudio();
    this.updateDust(simDt);
    this.updateCamera(realDt);

    if (this.postFxEnabled && this.postFx && this.postFx.rt) {
      this.renderPostFx(realDt);
    } else {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }

    // Project 3D HTML overlays (bubbles, floating numbers, HP bars, [E] prompt)
    this.updateHtmlOverlays(realDt);

    // 10Hz HUD Snapshot
    this.hudAccum += realDt;
    if (this.hudAccum >= HUD_TICK_INTERVAL) {
      this.hudAccum = 0;
      this.emitHudSnapshot();
    }
  };

  // ---------------------------------------------------------------------------
  // Camera & Mouse Raycasting
  // ---------------------------------------------------------------------------
  EngineSession.prototype.updateMouseAim = function () {
    if (!this.mouseActive || !this.camera) return;
    this._v2ndc.set(this.mouseNdc.x, this.mouseNdc.y);
    this._raycaster.setFromCamera(this._v2ndc, this.camera);
    if (this._raycaster.ray.intersectPlane(this._groundPlane, this._v3a)) {
      this.aimWorld.x = clamp(this._v3a.x, 0.5, (this.mapApi.GRID_W || 224) - 0.5);
      this.aimWorld.z = clamp(this._v3a.z, 0.5, (this.mapApi.GRID_H || 152) - 0.5);
    }
    if (this.reticle) {
      this.reticle.group.position.set(this.aimWorld.x, 0.09, this.aimWorld.z);
      this.reticle.outer.rotation.z = this.elapsedReal * 2.2;
      var reticleColor = this.slowMo ? 0xf0c46c : (this.player.overclockTimer > 0 ? 0x4df8ff : 0x6fd8ea);
      this.reticle.mat.color.setHex(reticleColor);
    }
    this.updateAimPreview();
  };

  EngineSession.prototype.handleSlotKeyDown = function (slotIdx) {
    if (!this.mounted || this.ended) return false;
    var sl = this.loadout && this.loadout.slots ? this.loadout.slots[slotIdx] : null;
    if (!sl) return false;
    var feelApi = this.combatFeelApi || INFINITY.CombatFeel;
    var supports = feelApi && typeof feelApi.supportsAimPreview === 'function' && feelApi.supportsAimPreview(sl.archetype);
    if (!supports || sl.cooldownLeft > 0 || (this.player && this.player.energy < sl.energyCost)) {
      this.cancelAimPreview();
      return this.castSlot(slotIdx);
    }
    this.previewSlotIdx = slotIdx;
    this.updateAimPreview();
    return true;
  };

  EngineSession.prototype.cancelAimPreview = function () {
    this.previewSlotIdx = -1;
    if (this.aimPreview && this.aimPreview.group) {
      this.aimPreview.group.visible = false;
    }
  };

  EngineSession.prototype.updateAimPreview = function () {
    var ap = this.aimPreview;
    if (!ap || !ap.group) return;
    if (this.previewSlotIdx < 0 || !this.player || this.ended) {
      ap.group.visible = false;
      return;
    }
    var sl = this.loadout && this.loadout.slots ? this.loadout.slots[this.previewSlotIdx] : null;
    if (!sl) {
      ap.group.visible = false;
      return;
    }
    var feelApi = this.combatFeelApi || INFINITY.CombatFeel;
    var feel = feelApi && typeof feelApi.getArchetypeFeel === 'function'
      ? feelApi.getArchetypeFeel(sl.archetype)
      : { previewMode: 'instant' };
    if (feel.previewMode !== 'aim_circle' && feel.previewMode !== 'aim_line') {
      ap.group.visible = false;
      return;
    }

    var p = this.player;
    var dir = this.getAimDir();
    var colorHex = hexToInt((sl.vfxProfile && sl.vfxProfile.primaryColor) || sl.color, 0x5ce8ff);
    var pulse = 0.72 + Math.sin(this.elapsedReal * 9.0) * 0.22;
    ap.group.visible = true;

    if (feel.previewMode === 'aim_circle') {
      ap.circleGroup.visible = true;
      ap.line.visible = false;
      var cx = p.x;
      var cz = p.z;
      if (!feel.previewSelfOrigin) {
        if (feel.previewOffsetForward) {
          cx = p.x + dir.x * feel.previewOffsetForward;
          cz = p.z + dir.z * feel.previewOffsetForward;
        } else {
          var maxR = feel.previewMaxRange || 11.0;
          var dx = this.aimWorld.x - p.x;
          var dz = this.aimWorld.z - p.z;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > maxR && dist > 0.001) {
            cx = p.x + (dx / dist) * maxR;
            cz = p.z + (dz / dist) * maxR;
          } else {
            cx = this.aimWorld.x;
            cz = this.aimWorld.z;
          }
        }
      }
      var minRad = Number(feel.previewMinRadius) || 0;
      var rad = clamp(Math.max(minRad, Number(sl.radius) || 3.6), 1.4, 16.0);
      ap.circleGroup.position.set(cx, 0, cz);
      ap.circleGroup.scale.set(rad, 1, rad);
      ap.ring.rotation.z = this.elapsedReal * 1.4;
      ap.ringMat.color.setHex(colorHex);
      ap.ringMat.opacity = 0.72 * pulse;
      ap.fillMat.color.setHex(colorHex);
      ap.fillMat.opacity = 0.12 * pulse;
    } else {
      ap.circleGroup.visible = false;
      ap.line.visible = true;
      var maxLen = feel.previewLength || 12.0;
      var endPt = this.raycastWall(p.x, p.z, dir.x, dir.z, maxLen);
      var ldx = endPt.x - p.x;
      var ldz = endPt.z - p.z;
      var len = Math.max(0.8, Math.sqrt(ldx * ldx + ldz * ldz));
      var w = feel.previewWidth || 0.6;
      ap.line.position.set((p.x + endPt.x) * 0.5, 0.094, (p.z + endPt.z) * 0.5);
      ap.line.rotation.y = -Math.atan2(ldz, ldx);
      ap.line.scale.set(len, 1, w);
      ap.lineMat.color.setHex(colorHex);
      ap.lineMat.opacity = 0.36 * pulse;
    }
  };

  EngineSession.prototype.addCameraShake = function (amount, duration, freq) {
    if (this.shakeBudget) {
      this.shakeBudget.add(amount, duration || 0.22, freq);
      return;
    }
    this.shakeIntensity = Math.min(0.52, Math.max(this.shakeIntensity, amount));
    this.shakeTimer = Math.min(0.45, Math.max(this.shakeTimer, duration || 0.22));
  };

  EngineSession.prototype.addCameraKick = function (kx, kz) {
    this.camKickX = clamp(this.camKickX + (kx || 0), -1.2, 1.2);
    this.camKickZ = clamp(this.camKickZ + (kz || 0), -1.2, 1.2);
  };

  function computeCameraScrollBounds(mapApi) {
    var gridW = (mapApi && mapApi.GRID_W) || 224;
    var gridH = (mapApi && mapApi.GRID_H) || 152;
    var padX = Math.min(4.0, gridW * 0.12);
    var padZ = Math.min(4.0, gridH * 0.12);
    return {
      minX: padX,
      maxX: Math.max(padX, gridW - padX),
      minZ: padZ,
      maxZ: Math.max(padZ, gridH - padZ),
      gridW: gridW,
      gridH: gridH
    };
  }

  EngineSession.prototype.getCameraBounds = function () {
    return computeCameraScrollBounds(this.mapApi);
  };

  EngineSession.prototype.scrollCameraTo = function (worldX, worldZ, snap) {
    var b = this.getCameraBounds();
    var tx = clamp(Number(worldX) || 0, b.minX, b.maxX);
    var tz = clamp(Number(worldZ) || 0, b.minZ, b.maxZ);
    if (snap) {
      this.camPos.x = tx;
      this.camPos.z = tz;
      this.camLook.x = tx;
      this.camLook.z = tz;
    } else {
      this.camPos.x = lerp(this.camPos.x, tx, 0.35);
      this.camPos.z = lerp(this.camPos.z, tz, 0.35);
      this.camLook.x = lerp(this.camLook.x, tx, 0.35);
      this.camLook.z = lerp(this.camLook.z, tz, 0.35);
    }
    if (this.camera) {
      this.camera.position.set(this.camPos.x, CAMERA_25D_SPEC.offsetY, this.camPos.z + CAMERA_25D_SPEC.offsetZ);
      this.camera.lookAt(this.camLook.x, CAMERA_25D_SPEC.lookAtY, this.camLook.z);
    }
    return { x: this.camPos.x, z: this.camPos.z, bounds: b };
  };

  EngineSession.prototype.updateCamera = function (realDt) {
    if (!this.camera || !this.player) return;
    var p = this.player;
    var b = this.getCameraBounds();
    var leadX = clamp((this.aimWorld.x - p.x) * 0.22, -2.4, 2.4);
    var leadZ = clamp((this.aimWorld.z - p.z) * 0.18, -2.0, 2.0);

    var targetPosX = clamp(p.x + leadX * 0.65, b.minX, b.maxX);
    var targetPosZ = clamp(p.z + leadZ * 0.65, b.minZ, b.maxZ);
    var targetLookX = clamp(p.x + leadX, b.minX, b.maxX);
    var targetLookZ = clamp(p.z + leadZ, b.minZ, b.maxZ);

    var smooth = 1 - Math.exp(-7.8 * realDt);
    this.camPos.x = clamp(lerp(this.camPos.x, targetPosX, smooth), b.minX, b.maxX);
    this.camPos.z = clamp(lerp(this.camPos.z, targetPosZ, smooth), b.minZ, b.maxZ);
    this.camLook.x = clamp(lerp(this.camLook.x, targetLookX, smooth), b.minX, b.maxX);
    this.camLook.z = clamp(lerp(this.camLook.z, targetLookZ, smooth), b.minZ, b.maxZ);

    var kickDecay = Math.exp(-14.0 * realDt);
    this.camKickX *= kickDecay;
    this.camKickZ *= kickDecay;
    if (Math.abs(this.camKickX) < 0.002) this.camKickX = 0;
    if (Math.abs(this.camKickZ) < 0.002) this.camKickZ = 0;

    var sx = 0;
    var sy = 0;
    if (this.shakeBudget) {
      var sh = this.shakeBudget.step(realDt);
      sx = sh.x;
      sy = sh.y;
    } else if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - realDt);
      var mag = this.shakeIntensity * (this.shakeTimer > 0 ? 1 : 0);
      sx = (Math.random() * 2 - 1) * mag;
      sy = (Math.random() * 2 - 1) * mag * 0.7;
      this.shakeIntensity *= Math.exp(-6.0 * realDt);
    }

    // Dynamic 3-tier camera staging (Explore 1.0 -> Combat 0.80 -> Skill Cut-In 0.58)
    // Static CAMERA_25D_SPEC remains untouched per Art Bible Iron Rule 1.
    var bossNear = Boolean(this.inspector && this.inspector.alive && dist2D(p.x, p.z, this.inspector.x, this.inspector.z) < 12.5);
    var inCombat = (this.combatFocusTimer > 0) || bossNear;
    if (this.directorTimeline && typeof this.directorTimeline.step === 'function') {
      this.directorState = this.directorTimeline.step(realDt, inCombat);
    }
    var zoom = clamp((this.directorState && this.directorState.zoom) || 1.0, 0.54, 1.0);
    // Slightly flatten pitch during close-up cut-ins so heavy-ink character silhouettes dominate
    var pitchDrop = (1.0 - zoom) * 2.1;

    this.camera.position.set(
      this.camPos.x + sx + this.camKickX,
      Math.max(4.8, CAMERA_25D_SPEC.offsetY * zoom - pitchDrop) + sy,
      this.camPos.z + CAMERA_25D_SPEC.offsetZ * zoom + this.camKickZ
    );
    this.camera.lookAt(
      this.camLook.x + this.camKickX * 0.35,
      CAMERA_25D_SPEC.lookAtY + (1.0 - zoom) * 0.45,
      this.camLook.z + this.camKickZ * 0.35
    );

    if (this._cutawayFocus && this._cutawayFocus.value && p) {
      this._cutawayFocus.value.set(p.x, 0, p.z);
    }

    // Subtle dynamic FOV modulation for Bullet-Time / Overclock + impact zoom punch
    this.camFovPunch *= Math.exp(-11.5 * realDt);
    if (Math.abs(this.camFovPunch) < 0.02) this.camFovPunch = 0;
    var targetFov = ((this.slowMo || this.inputPaused) ? 35.8 : (p.overclockTimer > 0 ? 40.5 : CAMERA_25D_SPEC.fov)) + this.camFovPunch;
    if (Math.abs(this.camera.fov - targetFov) > 0.04) {
      this.camera.fov = lerp(this.camera.fov, targetFov, 1 - Math.exp(-9.5 * realDt));
      this.camera.updateProjectionMatrix();
    }
  };

  // ---------------------------------------------------------------------------
  // Player Movement, Aim, Cooldowns & Buffs
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Impact Frame, Swept Physics Collision, Wall Bounce & Puddle Interaction
  // ---------------------------------------------------------------------------
  EngineSession.prototype.triggerImpactFrame = function (durationSec) {
    var dur = clamp(Number(durationSec) || 0.075, 0.06, 0.095);
    this.impactFrameDuration = dur;
    this.impactFrameTimer = Math.max(this.impactFrameTimer || 0, dur);
  };

  EngineSession.prototype.moveEntityWithCollision = function (fromX, fromZ, toX, toZ, radius) {
    var res = resolveSweptMovement(this.mapApi, fromX, fromZ, toX, toZ, radius);
    var covers = this.destructibleCovers;
    if (covers && covers.length > 0) {
      var r = (typeof radius === 'number' && radius > 0) ? radius : 0.4;
      for (var i = 0; i < covers.length; i++) {
        var c = covers[i];
        if (!c || c.destroyed) continue;
        var minDist = r + (c.radius || 0.72);
        var dx = res.x - c.x;
        var dz = res.z - c.z;
        var d2 = dx * dx + dz * dz;
        if (d2 < minDist * minDist) {
          var dist = Math.sqrt(d2);
          var nx = dist > 1e-4 ? (dx / dist) : 1;
          var nz = dist > 1e-4 ? (dz / dist) : 0;
          var pushX = c.x + nx * minDist;
          var pushZ = c.z + nz * minDist;
          if (!this.mapApi || typeof this.mapApi.isWalkable !== 'function' || this.mapApi.isWalkable(Math.floor(pushX), Math.floor(pushZ))) {
            res.x = pushX;
            res.z = pushZ;
          } else {
            res.x = fromX;
            res.z = fromZ;
          }
          res.hit = true;
          res.hitWall = true;
          res.normalX = nx;
          res.normalZ = nz;
        }
      }
    }
    return res;
  };

  EngineSession.prototype.isPointInPuddle = function (x, z) {
    var list = this.puddleZones;
    if (!list || list.length === 0) return false;
    for (var i = 0; i < list.length; i++) {
      var pd = list[i];
      var dx = x - pd.x;
      var dz = z - pd.z;
      var cosR = Math.cos(-(pd.rot || 0));
      var sinR = Math.sin(-(pd.rot || 0));
      var lx = dx * cosR - dz * sinR;
      var lz = dx * sinR + dz * cosR;
      var rx = Math.max(0.4, (pd.sx || 2.0) * 0.48);
      var rz = Math.max(0.4, (pd.sz || 1.5) * 0.48);
      if ((lx * lx) / (rx * rx) + (lz * lz) / (rz * rz) <= 1.0) {
        return true;
      }
    }
    return false;
  };

  EngineSession.prototype.spawnPuddleSplash = function (x, z, isBoss) {
    var THREE = this.THREE;
    if (!THREE || !this.scene) return;
    // Cold-cyan concentric water ripple + tiny water droplet scatter
    this.spawnFootstepRipple(x, z, isBoss ? 0x8cc8e6 : 0x5ce8ff, isBoss ? 0.78 : 0.56);
    var count = isBoss ? 8 : 5;
    var positions = new Float32Array(count * 3);
    var vels = [];
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      var spd = (isBoss ? 1.5 : 1.05) + Math.random() * 0.85;
      positions[i * 3] = x + Math.cos(a) * 0.14;
      positions[i * 3 + 1] = 0.08;
      positions[i * 3 + 2] = z + Math.sin(a) * 0.14;
      vels.push({ vx: Math.cos(a) * spd, vy: 1.5 + Math.random() * 1.1, vz: Math.sin(a) * spd });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0x9cf0ff,
      size: isBoss ? 0.16 : 0.12,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    var self = this;
    this.vfxList.push({
      ttl: 0.30,
      maxTtl: 0.30,
      update: function (dt) {
        this.ttl -= dt;
        var attr = geo.attributes.position;
        for (var k = 0; k < count; k++) {
          vels[k].vy -= 9.8 * dt;
          attr.array[k * 3] += vels[k].vx * dt;
          attr.array[k * 3 + 1] = Math.max(0.05, attr.array[k * 3 + 1] + vels[k].vy * dt);
          attr.array[k * 3 + 2] += vels[k].vz * dt;
        }
        attr.needsUpdate = true;
        mat.opacity = 0.82 * clamp(this.ttl / this.maxTtl, 0, 1);
      },
      dispose: function () {
        self.scene.remove(pts);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnWallImpactDebris = function (x, z, nx, nz) {
    var THREE = this.THREE;
    if (!THREE || !this.scene) return;
    var baseAng = Math.atan2(nz || 0, nx || 1);
    var group = new THREE.Group();
    var chunkGeo = new THREE.DodecahedronGeometry(0.09, 0);
    var chunkMat = new THREE.MeshStandardMaterial({
      color: 0x626b7a,
      roughness: 0.88,
      metalness: 0.12,
      transparent: true,
      opacity: 0.96
    });
    var chunks = [];
    for (var i = 0; i < 7; i++) {
      var spread = baseAng + (Math.random() - 0.5) * 1.45;
      var spd = 2.2 + Math.random() * 2.6;
      var m = new THREE.Mesh(chunkGeo, chunkMat);
      m.position.set(x, 0.55 + Math.random() * 0.75, z);
      var sc = 0.65 + Math.random() * 0.7;
      m.scale.set(sc, sc * 0.8, sc);
      group.add(m);
      chunks.push({
        mesh: m,
        vx: Math.cos(spread) * spd,
        vy: 1.8 + Math.random() * 2.4,
        vz: Math.sin(spread) * spd,
        rx: (Math.random() - 0.5) * 14,
        ry: (Math.random() - 0.5) * 14
      });
    }
    this.scene.add(group);
    // Concrete impact sparks bouncing off wall face
    this.spawnSparkBurst(x + (nx || 0) * 0.15, 0.88, z + (nz || 0) * 0.15, 0xffc66e, 11);

    var self = this;
    this.vfxList.push({
      ttl: 0.46,
      maxTtl: 0.46,
      update: function (dt) {
        this.ttl -= dt;
        var ratio = clamp(this.ttl / this.maxTtl, 0, 1);
        chunkMat.opacity = 0.96 * ratio;
        for (var k = 0; k < chunks.length; k++) {
          var ch = chunks[k];
          ch.vy -= 12.0 * dt;
          ch.mesh.position.x += ch.vx * dt;
          ch.mesh.position.y = Math.max(0.06, ch.mesh.position.y + ch.vy * dt);
          ch.mesh.position.z += ch.vz * dt;
          ch.mesh.rotation.x += ch.rx * dt;
          ch.mesh.rotation.y += ch.ry * dt;
        }
      },
      dispose: function () {
        self.scene.remove(group);
        chunkGeo.dispose();
        chunkMat.dispose();
      }
    });
  };

  EngineSession.prototype.applyKnockbackWithWallBounce = function (actor, kbX, kbZ, scale, opts) {
    if (!actor || (!kbX && !kbZ)) return null;
    var factor = typeof scale === 'number' ? scale : 0.26;
    var targetX = actor.x + (kbX || 0) * factor;
    var targetZ = actor.z + (kbZ || 0) * factor;
    var res = this.moveEntityWithCollision(actor.x, actor.z, targetX, targetZ, actor.radius || 0.42);
    actor.x = res.x;
    actor.z = res.z;

    if (res.hit && res.hitWall) {
      var impactX = res.x - res.normalX * (actor.radius || 0.42);
      var impactZ = res.z - res.normalZ * (actor.radius || 0.42);
      // Rebound cleanly off wall/pillar surface
      if (Math.abs(res.normalX) + Math.abs(res.normalZ) > 0.05) {
        var reb = this.moveEntityWithCollision(
          actor.x,
          actor.z,
          actor.x + res.normalX * 0.26,
          actor.z + res.normalZ * 0.26,
          actor.radius || 0.42
        );
        actor.x = reb.x;
        actor.z = reb.z;
      }
      // 35ms micro hit-stop + concrete debris sparks + impact squash
      this.hitStopTimer = Math.max(this.hitStopTimer || 0, 0.035);
      this.triggerActorSquash(actor, 0.76, 1.26);
      this.spawnWallImpactDebris(impactX, impactZ, res.normalX, res.normalZ);
      this.addCameraShake(0.16, 0.14);
      if (opts && opts.announceWallSlam) {
        if (actor.id === 'inspector') {
          actor.armorBrokenTimer = Math.max(actor.armorBrokenTimer || 0, 3.8);
          this.exposeInspectorWeakpoint('wall_crash', 3.6);
        } else {
          this.spawnFloatingText(actor.x, 2.15, actor.z, '撞墙震荡!', '#ffbe6b');
        }
      }
    }
    return res;
  };

  // Dynamic dual-layer shadow updater: rotates & elongates directional cast shadow away from
  // the strongest nearby light source (player flashlight, Inspector red lantern, or station lamp).
  EngineSession.prototype.updateActorShadows = function (actor, bobOffset) {
    if (!actor || !actor.vis) return;
    var bob = bobOffset || 0;
    if (actor.vis.shadow) {
      var shScale = 1.0 - bob * 0.55;
      actor.vis.shadow.scale.set(shScale, 1, shScale);
    }
    var cast = actor.vis.castShadow;
    if (!cast) return;

    var sumDx = 0;
    var sumDz = 0;
    var totalW = 0;
    var bestStrength = 0;

    // 1. Player flashlight influence (casts strong directional shadows on Boss & teammates)
    if (this.flashLight && this.player) {
      var fx = actor.x - this.flashLight.position.x;
      var fz = actor.z - this.flashLight.position.z;
      var fDist = Math.sqrt(fx * fx + fz * fz);
      if (actor.id === 'player') {
        // Player holds flashlight forward -> cast subtle silhouette shadow behind aim direction
        var aim = this.getAimDir();
        sumDx += -aim.x * 0.42;
        sumDz += -aim.z * 0.42;
        totalW += 0.42;
        bestStrength = Math.max(bestStrength, 0.35);
      } else if (fDist > 0.25 && fDist < 16.0 && this.flashLight.intensity > 0.5) {
        var fW = clamp((1.0 - fDist / 16.0) * 1.85, 0.15, 1.85);
        sumDx += (fx / fDist) * fW;
        sumDz += (fz / fDist) * fW;
        totalW += fW;
        bestStrength = Math.max(bestStrength, fW * 0.55);
      }
    }

    // 2. Inspector's ominous crimson lantern (casts long dramatic shadows away from Boss)
    if (this.inspector && this.inspector.alive && this.inspectorLantern && this.inspectorLantern.intensity > 0.4) {
      var lx = actor.x - this.inspectorLantern.position.x;
      var lz = actor.z - this.inspectorLantern.position.z;
      var lDist = Math.sqrt(lx * lx + lz * lz);
      if (actor.id !== 'inspector' && lDist > 0.25 && lDist < 15.5) {
        var lW = clamp((1.0 - lDist / 15.5) * 1.95, 0.15, 1.95);
        sumDx += (lx / lDist) * lW;
        sumDz += (lz / lDist) * lW;
        totalW += lW;
        bestStrength = Math.max(bestStrength, lW * 0.6);
      }
    }

    // 3. Nearest active overhead station lamp in pool
    if (this.stationLightPool && this.stationLightPool.length > 0) {
      var bestLampDist = 14.0;
      var bestLamp = null;
      for (var i = 0; i < this.stationLightPool.length; i++) {
        var pl = this.stationLightPool[i];
        if (!pl || pl.intensity < 0.25) continue;
        var pd = dist2D(actor.x, actor.z, pl.position.x, pl.position.z);
        if (pd < bestLampDist) {
          bestLampDist = pd;
          bestLamp = pl;
        }
      }
      if (bestLamp) {
        var sx = actor.x - bestLamp.position.x;
        var sz = actor.z - bestLamp.position.z;
        var sLen = Math.sqrt(sx * sx + sz * sz);
        if (sLen > 0.2) {
          var sW = clamp((1.0 - sLen / 14.0) * 1.15, 0.2, 1.15);
          sumDx += (sx / sLen) * sW;
          sumDz += (sz / sLen) * sW;
          totalW += sW;
          bestStrength = Math.max(bestStrength, clamp(sLen / 6.5, 0.25, 1.0));
        }
      }
    }

    // 4. Fallback station directional key light (-14, -16)
    sumDx += -0.64 * 0.35;
    sumDz += -0.76 * 0.35;
    totalW += 0.35;

    var dirLen = Math.sqrt(sumDx * sumDx + sumDz * sumDz);
    var dirX = dirLen > 1e-4 ? (sumDx / dirLen) : -0.64;
    var dirZ = dirLen > 1e-4 ? (sumDz / dirLen) : -0.76;

    // Geometry extends along local +Z, so rotation.y = atan2(dirX, dirZ) points shadow along (dirX, dirZ)
    cast.rotation.y = Math.atan2(dirX, dirZ);
    var stretch = clamp(0.88 + bestStrength * 0.58 - bob * 0.4, 0.72, 1.62);
    var widthScale = 1.0 - bob * 0.3;
    cast.scale.set(widthScale, 1, stretch);
    if (actor.vis.castShadowMat) {
      var baseOp = actor.vis.baseCastOpacity || 0.46;
      actor.vis.castShadowMat.opacity = clamp(baseOp * (0.72 + bestStrength * 0.35), 0.24, 0.68);
    }
  };

  EngineSession.prototype.updatePlayer = function (simDt, realDt) {
    var p = this.player;
    var isOverclock = p.overclockTimer > 0;
    var playerDt = isOverclock ? simDt * 1.35 : simDt;

    // Regenerate energy
    var regen = Math.max(8.5, this.passives.energyRegen || 11.0) * (isOverclock ? 1.35 : 1.0);
    p.energy = Math.min(p.maxEnergy, p.energy + regen * simDt);

    // Passive ward circle benefits for player
    if (this.isInsideAnyWard(p.x, p.z)) {
      p.sanity = Math.min(p.maxSanity, p.sanity + 3.2 * simDt);
    }

    // Cooldowns & timers
    if (p.attackCd > 0) p.attackCd = Math.max(0, p.attackCd - playerDt);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - simDt);
    if (p.actionTimer > 0) p.actionTimer = Math.max(0, p.actionTimer - simDt);
    if (p.channelTimer > 0) p.channelTimer = Math.max(0, p.channelTimer - simDt);
    if (p.ruleBindTimer > 0) p.ruleBindTimer = Math.max(0, p.ruleBindTimer - simDt);
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - realDt);
    if (p.whiteFlash > 0) p.whiteFlash = Math.max(0, p.whiteFlash - realDt);
    if (this.exitWarnTimer > 0) this.exitWarnTimer = Math.max(0, this.exitWarnTimer - realDt);

    for (var si = 0; si < this.loadout.slots.length; si++) {
      var sl = this.loadout.slots[si];
      if (sl.cooldownLeft > 0) {
        sl.cooldownLeft = Math.max(0, sl.cooldownLeft - playerDt);
      }
    }

    // Fresnel Hex-Geodesic Shield timer & dual orbit spin
    if (p.shieldTimer > 0) {
      p.shieldTimer -= simDt;
      p.shieldMesh.visible = true;
      if (p.shieldMat && p.shieldMat.uniforms && p.shieldMat.uniforms.uTime) {
        p.shieldMat.uniforms.uTime.value = this.elapsedReal;
      }
      if (p.shieldShell) {
        p.shieldShell.rotation.y += realDt * 0.95;
      }
      if (p.shieldRing) {
        p.shieldRing.rotation.z -= realDt * 2.2;
      }
      if (p.shieldOrbit2) {
        p.shieldOrbit2.rotation.z += realDt * 2.6;
      }
      if (p.shieldTimer <= 0 || p.shieldHp <= 0) {
        p.shieldHp = 0;
        p.shieldTimer = 0;
        p.shieldMesh.visible = false;
      }
    } else if (p.shieldMesh.visible) {
      p.shieldMesh.visible = false;
    }

    // Overclock timer, motif-colored afterimages & crackling speed micro-arcs
    if (p.overclockTimer > 0) {
      p.overclockTimer = Math.max(0, p.overclockTimer - simDt);
      p.afterimageAccum += simDt;
      p.overclockArcCd = (p.overclockArcCd || 0) - realDt;
      var ocColor = p.overclockColor || 0x4df8ff;
      if (p.afterimageAccum >= 0.095) {
        p.afterimageAccum = 0;
        this.spawnAfterimage(p.x, p.z, 'player', p.facingLeft, ocColor, 0.36, p.dashTimer > 0 ? 'dash' : 'walk1');
      }
      if (p.overclockArcCd <= 0) {
        p.overclockArcCd = 0.24;
        var oa = Math.random() * Math.PI * 2;
        this.spawnLightningBolt(
          p.x + Math.cos(oa) * 0.25, 0.55 + Math.random() * 0.7, p.z + Math.sin(oa) * 0.25,
          p.x + Math.cos(oa + 1.4) * 0.95, 0.25 + Math.random() * 1.1, p.z + Math.sin(oa + 1.4) * 0.95,
          ocColor, 0.14, 4
        );
      }
    }

    // Stealth veil optical-camo scanline shimmer
    if (p.stealthTimer > 0) {
      p.stealthTimer = Math.max(0, p.stealthTimer - simDt);
      p.vis.mat.opacity = 0.26 + Math.sin(this.elapsedReal * 24) * 0.07;
    } else {
      p.vis.mat.opacity = 1.0;
    }

    // Low-HP crimson Infinity wristwatch heartbeat pulse (< 35% HP)
    if (p.hp > 0 && p.hp / Math.max(1, p.maxHp) <= 0.35) {
      p.lowHpPulseCd = (p.lowHpPulseCd || 0) - realDt;
      if (p.lowHpPulseCd <= 0) {
        p.lowHpPulseCd = 1.15;
        this.spawnShockRing(p.x, p.z, 1.35, 0xff2b44, 0.48);
      }
    }

    // Update build-driven aura sigil & orbiting relics
    this.updatePlayerBuildAura(realDt);

    // Blink beacon expiration & sculpted spatial rift animation
    if (this.blinkBeacon) {
      this.blinkBeacon.ttl -= simDt;
      if (this.blinkBeacon.crystal) {
        this.blinkBeacon.crystal.rotation.y += realDt * 3.0;
        this.blinkBeacon.crystal.position.y = 1.2 + Math.sin(this.elapsedReal * 4.2) * 0.14;
      } else if (this.blinkBeacon.mesh) {
        this.blinkBeacon.mesh.rotation.y += realDt * 3.0;
        this.blinkBeacon.mesh.position.y = 0.85 + Math.sin(this.elapsedReal * 5) * 0.12;
      }
      if (this.blinkBeacon.ringA) this.blinkBeacon.ringA.rotation.z += realDt * 2.2;
      if (this.blinkBeacon.ringB) this.blinkBeacon.ringB.rotation.z -= realDt * 2.6;
      if (this.blinkBeacon.sigil) this.blinkBeacon.sigil.rotation.z -= realDt * 1.4;
      if (this.blinkBeacon.riftMat && this.blinkBeacon.riftMat.uniforms) {
        this.blinkBeacon.riftMat.uniforms.uTime.value = this.elapsedReal;
      }
      if (this.blinkBeacon.ring) this.blinkBeacon.ring.rotation.z -= realDt * 1.8;
      if (this.blinkBeacon.ttl <= 0) {
        this.removeBlinkBeacon();
      }
    }

    // Recon reveal timer
    if (this.reconRevealTimer > 0) {
      this.reconRevealTimer = Math.max(0, this.reconRevealTimer - simDt);
      this.updateReconBeacons(realDt);
      if (this.reconRevealTimer <= 0) {
        this.clearReconBeacons();
      }
    }

    // Active objective waypoint guidance beacon & player compass arrow
    if (this.focusWaypoint) {
      this.updateFocusWaypoint(realDt);
    }

    // Movement input (WASD / Arrows) or Dash
    var mx = 0;
    var mz = 0;
    if (!this.isTypingInDom()) {
      if (this.keys['w'] || this.keys['KeyW'] || this.keys['ArrowUp']) mz -= 1;
      if (this.keys['s'] || this.keys['KeyS'] || this.keys['ArrowDown']) mz += 1;
      if (this.keys['a'] || this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
      if (this.keys['d'] || this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    }

    var bindMult = (p.ruleBindTimer > 0) ? 0.45 : 1.0;
    var speed = 8.8 * this.passives.moveSpeedMult * (isOverclock ? 1.65 : 1.0) * bindMult;
    if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - simDt);
      p.vx = p.dashVx;
      p.vz = p.dashVz;
      this.spawnAfterimage(p.x, p.z, 'player', p.facingLeft, p.dashColor || semanticInt('dashTrailInt', 0x52e5ff), 0.28, 'dash');
    } else if (mx !== 0 || mz !== 0) {
      var len = Math.sqrt(mx * mx + mz * mz);
      p.vx = (mx / len) * speed;
      p.vz = (mz / len) * speed;
    } else {
      p.vx = 0;
      p.vz = 0;
    }

    if (p.vx !== 0 || p.vz !== 0) {
      var prevX = p.x;
      var prevZ = p.z;
      var nx = p.x + p.vx * simDt;
      var nz = p.z + p.vz * simDt;
      var res = this.moveEntityWithCollision(p.x, p.z, nx, nz, p.radius);
      p.x = res.x;
      p.z = res.z;
      if (p.dashTimer > 0 && res.hit && res.hitWall) {
        p.dashTimer = 0;
        this.spawnWallImpactDebris(res.x - res.normalX * p.radius, res.z - res.normalZ * p.radius, res.normalX, res.normalZ);
      }

      var stepDist = Math.sqrt((p.x - prevX) * (p.x - prevX) + (p.z - prevZ) * (p.z - prevZ));
      // Stylistic graphic-novel ink brush ribbon trail behind dashes, overclock & rapid sprinting
      this.playerTrailAccum = (this.playerTrailAccum || 0) + stepDist;
      var trailStride = (p.dashTimer > 0 || isOverclock) ? 0.34 : 0.78;
      if (this.playerTrailAccum >= trailStride && p.stealthTimer <= 0) {
        this.playerTrailAccum = 0;
        if (this.playerTrailPrev && INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnInkBrushTrail === 'function') {
          var trailCol = p.dashTimer > 0
            ? (p.dashColor || semanticInt('dashTrailInt', 0x52e5ff))
            : (isOverclock ? (p.overclockColor || 0x4df8ff) : 0x3894b2);
          INFINITY.VfxStudio.spawnInkBrushTrail(this, this.playerTrailPrev.x, this.playerTrailPrev.z, p.x, p.z, trailCol, {
            width: (p.dashTimer > 0 || isOverclock) ? 0.76 : 0.42,
            duration: (p.dashTimer > 0 || isOverclock) ? 0.38 : 0.24,
            y: 0.08
          });
        }
        this.playerTrailPrev = { x: p.x, z: p.z };
      } else if (!this.playerTrailPrev) {
        this.playerTrailPrev = { x: p.x, z: p.z };
      }

      // Grounded wet-slate puddle splashes & stylized cel ink step dust puffs
      var inPuddle = this.isPointInPuddle(p.x, p.z);
      p.stepRippleAccum = (p.stepRippleAccum || 0) + stepDist;
      var rippleStride = inPuddle ? 0.62 : 1.18;
      if (p.stepRippleAccum >= rippleStride && p.stealthTimer <= 0) {
        p.stepRippleAccum = 0;
        if (inPuddle) {
          this.spawnPuddleSplash(p.x, p.z, false);
        } else {
          var platStartX = (this.mapApi && this.mapApi.PLATFORM_START_X) || 84;
          var rippleCol = isOverclock ? (p.overclockColor || 0x4df8ff) : (p.x >= platStartX - 1 ? 0x8a9eb6 : 0x5eaec4);
          this.spawnFootstepRipple(p.x, p.z, rippleCol, isOverclock ? 0.62 : 0.42, p.vx, p.vz);
        }
      }

      // Footsteps & acoustic ripples
      p.footstepAccum += stepDist;
      if (p.footstepAccum >= 2.2) {
        p.footstepAccum = 0;
        var noise = 24 * this.passives.noiseMult * (p.stealthTimer > 0 ? 0.2 : 1.0);
        if (this.isInsideAnyWard(p.x, p.z)) noise *= 0.45;
        if (noise >= 9) {
          this.emitSoundRipple(p.x, p.z, noise, 'player');
          playSfxSafe('footstep');
        }
      }
    }

    // Hold LMB continuous attack
    if (this.mouseDownLmb && !this.isTypingInDom() && p.attackCd <= 0) {
      this.performBasicAttack();
    }

    // Facing toward mouse aim
    p.facingLeft = (this.aimWorld.x < p.x);

    // Update sprite frame & kinematics
    var moving = (Math.abs(p.vx) + Math.abs(p.vz)) > 0.2;
    this.updateActorSprite(p, simDt, moving);

    // Track newly visited zones for real-time exploration progress & mission log
    if (this.mapApi) {
      var curZoneId = this.mapApi.getZoneAt(p.x, p.z);
      if (curZoneId && this.visitedZones.indexOf(curZoneId) === -1) {
        this.visitedZones.push(curZoneId);
        var zInfo = getZoneInfo(this.mapApi, curZoneId);
        this.recordMissionEvent(
          'progress',
          '抵达新区域 · ' + zInfo.name,
          '已勘探站台区域 ' + this.visitedZones.length + ' / 6（' + zInfo.code + '）。',
          { zoneId: curZoneId }
        );
      }
    }

    // Yellow line rule check (entering hazard/rail strip before overridePct >= 100)
    var hazardX = (this.mapApi && this.mapApi.HAZARD_X) || 103;
    if (p.x >= hazardX && this.overridePct < 100 && this.inspector.alive && this.inspector.state !== 'HUNT') {
      this.inspector.state = 'HUNT';
      this.inspector.huntTargetId = 'player';
      this.inspector.huntLoseTimer = 10;
      this.emitSoundRipple(p.x, p.z, 90, 'yellow_line');
      this.spawnFloatingText(p.x, 2.2, p.z, '越过黄线！检票员锁定！', '#ff3b4f');
      playSfxSafe('alert');
      if (!this.missionFlags.yellowLineViolated) {
        this.missionFlags.yellowLineViolated = true;
        this.setBranchState('yellow_line', 'warning', '未完成逆轨便越过 0 号站台黄线，触发检票员强制追猎！', 100);
        this.recordMissionEvent(
          'branch',
          '触发逻辑分支 · 黄线即决违例',
          '你在主轨极性未反转前踏入 0 号站台警戒黄线，零号检票员已切换为高危追猎锁定状态。',
          { branchId: 'yellow_line', zoneId: 'platform0' }
        );
      } else {
        this.recordMissionEvent(
          'warning',
          '再次越过黄线警戒区',
          '检票员重新锁定你的坐标，请迅速撤离黄线内侧或展开结界防线。',
          { branchId: 'yellow_line', zoneId: 'platform0' }
        );
      }
    }
  };

  EngineSession.prototype.updateActorSprite = function (actor, dt, moving) {
    var safeDt = Math.max(0.001, dt || 0.016);
    actor.idlePhase = (actor.idlePhase || 0) + safeDt;
    if (actor.channelTimer > 0 && actor.id !== 'player') {
      actor.channelTimer = Math.max(0, actor.channelTimer - safeDt);
    }

    var isDash = (actor.dashTimer > 0) || (actor.id === 'inspector' && actor.lungeActive > 0);
    var isHurt = (actor.hitFlash > 0.09);
    if (actor.combatPoseTimer > 0) {
      actor.combatPoseTimer = Math.max(0, actor.combatPoseTimer - safeDt);
    }
    var nextFrame = 'idle';
    if (isHurt) {
      nextFrame = 'hurt';
    } else if (actor.id === 'player' && actor.combatPoseTimer > 0 && actor.combatPose) {
      // Limbus-style hard pose-snapping sequence (windup -> smear -> cleave -> parry)
      nextFrame = actor.combatPose;
    } else if (isDash) {
      nextFrame = actor.id === 'player' ? 'smear' : 'dash';
    } else if (actor.actionTimer > 0) {
      nextFrame = actor.id === 'player'
        ? (actor.actionTimer > 0.21 ? 'windup' : (actor.actionTimer > 0.13 ? 'smear' : 'cleave'))
        : 'action';
    } else if (actor.channelTimer > 0) {
      nextFrame = actor.id === 'player' ? 'windup' : 'channel';
    } else if (moving) {
      actor.animTimer += safeDt * (actor.overclockTimer > 0 ? 11.2 : 8.2);
      nextFrame = (Math.floor(actor.animTimer) % 2 === 0) ? 'walk1' : 'walk2';
    } else {
      actor.animTimer = 0;
      // Breathing idle cadence (idle <-> idle2)
      nextFrame = (Math.sin(actor.idlePhase * 2.6) > 0.35) ? 'idle2' : 'idle';
    }

    if (actor.animFrame !== nextFrame) {
      actor.animFrame = nextFrame;
      var tex = this.getCharTex(actor.id, nextFrame);
      var norm = this.getCharNormalTex(actor.id, nextFrame);
      var emTex = this.getCharEmissiveTex(actor.id, nextFrame);
      if (tex && actor.vis.mat.map !== tex) {
        actor.vis.mat.map = tex;
        if (norm) actor.vis.mat.normalMap = norm;
        actor.vis.mat.emissiveMap = emTex || null;
        actor.vis.mat.needsUpdate = true;
      }
    }

    actor.vis.group.position.set(actor.x, 0, actor.z);

    // Smooth squash-and-stretch spring recovery + subtle breathing micro-scale
    var damp = 1 - Math.exp(-14 * safeDt);
    actor.squashX = lerp(actor.squashX || 1, 1, damp);
    actor.squashY = lerp(actor.squashY || 1, 1, damp);
    var breatheScaleY = moving ? 1.0 : (1.0 + Math.sin(actor.idlePhase * 2.6) * 0.018);
    var dirSign = actor.facingLeft ? -1 : 1;
    actor.vis.sprite.scale.set(dirSign * actor.squashX, actor.squashY * breatheScaleY, 1);

    // Velocity-driven body lean (tilts cleanly into movement & dashes!)
    var targetLean = 0;
    if (isHurt) {
      targetLean = actor.facingLeft ? -0.14 : 0.14;
    } else if (isDash) {
      targetLean = actor.facingLeft ? 0.16 : -0.16;
    } else if (moving && Math.abs(actor.vx || 0) > 0.25) {
      targetLean = clamp(-(actor.vx || 0) * 0.014, -0.09, 0.09);
    }
    actor.leanZ = lerp(actor.leanZ || 0, targetLean, 1 - Math.exp(-12 * safeDt));
    actor.vis.sprite.rotation.z = actor.leanZ;

    // Subtle grounded walk bob & dynamic dual-layer shadow sync
    var spriteH = (actor.id === 'inspector' ? ACTOR_DIMENSIONS.inspector.height : (actor.id === 'player' ? ACTOR_DIMENSIONS.player.height : ACTOR_DIMENSIONS.squad.height));
    var baseY = spriteH * 0.5 + 0.04;
    var bobOffset = moving ? Math.abs(Math.sin(actor.animTimer * Math.PI)) * 0.075 : 0;
    actor.vis.sprite.position.y = baseY + bobOffset + (actor.squashY - 1) * (spriteH * 0.35);
    this.updateActorShadows(actor, bobOffset);

    // Hit flash / status emissive tint (pure-white impact flash takes top priority!)
    if (actor.whiteFlash > 0) {
      actor.vis.mat.emissive.setHex(0xffffff);
      actor.vis.mat.emissiveIntensity = 3.2;
    } else if (actor.hitFlash > 0) {
      actor.vis.mat.emissive.setHex(0xff7788);
      actor.vis.mat.emissiveIntensity = 1.35;
    } else if (actor.id === 'inspector' && actor.stunTimer > 0) {
      actor.vis.mat.emissive.setHex(0x66e8ff);
      actor.vis.mat.emissiveIntensity = 1.15;
    } else if (actor.id === 'player' && actor.overclockTimer > 0) {
      actor.vis.mat.emissive.setHex(actor.overclockColor || 0x4df8ff);
      actor.vis.mat.emissiveIntensity = 1.05;
    } else if (actor.id === 'player' && actor.stealthTimer > 0) {
      actor.vis.mat.emissive.setHex(actor.stealthColor || 0x9e82ff);
      actor.vis.mat.emissiveIntensity = 0.85;
    } else {
      actor.vis.mat.emissive.setHex(0xffffff);
      actor.vis.mat.emissiveIntensity = actor.id === 'inspector' ? ACTOR_EMISSIVE_BOSS : ACTOR_EMISSIVE_BASE;
    }

    // Dynamic HP / SAN per-unit GLSL shader uniform updates (all combat units)
    if (actor.vis && actor.vis.statusUniforms) {
      var su = actor.vis.statusUniforms;
      var targetHpRatio = clamp((Number(actor.hp) || 0) / Math.max(1, Number(actor.maxHp) || 100), 0, 1);
      var targetSanRatio = 1.0;

      if (actor.id === 'inspector') {
        // Boss anomaly stability drops when sealed, EMP-stunned, seal-chained, or in Phase-2 frenzy
        var bossStab = 0.88 - (Number(actor.sealedPct) || 0) * 0.0068;
        if (actor.stunTimer > 0) bossStab -= 0.44;
        if (actor.chainTimer > 0) bossStab -= 0.22;
        if (targetHpRatio < 0.55) bossStab -= 0.26;
        targetSanRatio = clamp(bossStab, 0.06, 1.0);
      } else if (typeof actor.sanity === 'number') {
        targetSanRatio = clamp(actor.sanity / Math.max(1, Number(actor.maxSanity) || 100), 0, 1);
      }

      if (typeof actor.shaderHpRatio !== 'number') actor.shaderHpRatio = targetHpRatio;
      if (typeof actor.shaderSanRatio !== 'number') actor.shaderSanRatio = targetSanRatio;
      var shDamp = 1 - Math.exp(-7.5 * safeDt);
      actor.shaderHpRatio = lerp(actor.shaderHpRatio, targetHpRatio, shDamp);
      actor.shaderSanRatio = lerp(actor.shaderSanRatio, targetSanRatio, shDamp);

      su.uStatusTime.value = this.elapsedReal;
      su.uHpRatio.value = actor.shaderHpRatio;
      su.uSanRatio.value = actor.shaderSanRatio;
    }
  };

  // ---------------------------------------------------------------------------
  // Basic Attack (LMB) & All 14 Real-Time 3D Skill Archetypes
  // ---------------------------------------------------------------------------
  EngineSession.prototype.getAimDir = function () {
    var dx = this.aimWorld.x - this.player.x;
    var dz = this.aimWorld.z - this.player.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return { x: 1, z: 0, angle: 0 };
    return { x: dx / len, z: dz / len, angle: Math.atan2(dz, dx) };
  };

  EngineSession.prototype.performBasicAttack = function () {
    var p = this.player;
    if (p.attackCd > 0 || this.ended) return;

    var basic = this.loadout.basicAttack;
    var vfx = basic.vfxProfile || null;
    p.attackCd = Math.max(0.22, Number(basic.cooldown) || 0.36);
    p.actionTimer = 0.28;
    p.auraPulse = Math.max(p.auraPulse || 0, 0.35);
    this.combatFocusTimer = Math.max(this.combatFocusTimer || 0, 4.5);
    this.triggerActorSquash(p, 1.18, 0.88);
    if (this.directorTimeline) {
      this.directorTimeline.triggerBeat({ zoom: 0.78, holdSec: 0.20, inkEdge: 0.20 });
    }

    var dir = this.getAimDir();
    var colorHex = hexToInt((vfx && vfx.primaryColor) || basic.color, 0x6fd8ea);
    var secHex = hexToInt((vfx && vfx.secondaryColor) || basic.color, 0xffffff);
    var baseDmg = Number(basic.damage) || Number(basic.power) || 16;
    var dmg = Math.round(baseDmg * this.passives.damageMult);
    var kb = Number(basic.knockback) || 2.2;
    var isRanged = basic.mode === 'ranged' || basic.type === 'ranged' || (Number(basic.range) || 3.0) > 4.2;

    if (isRanged) {
      // Crisp muzzle flare + comet projectile + build particle signature
      this.spawnSparkBurst(p.x + dir.x * 0.65, 1.05, p.z + dir.z * 0.65, secHex, 5);
      this.spawnSkillParticleFx(basic, p.x + dir.x * 0.55, 1.05, p.z + dir.z * 0.55, dir.angle, 2.2, { intensityScale: 0.52 });
      this.spawnProjectile({
        owner: 'player',
        x: p.x + dir.x * 0.55,
        z: p.z + dir.z * 0.55,
        vx: dir.x * 22,
        vz: dir.z * 22,
        damage: dmg,
        knockback: kb,
        color: colorHex,
        secondaryColor: secHex,
        radius: 0.24,
        ttl: 0.9,
        vfxProfile: vfx
      });
      this.emitSoundRipple(p.x, p.z, 38 * this.passives.noiseMult, 'attack');
      playSfxSafe('ui_click');
    } else {
      // Crisp layered melee crescent arc
      var range = Number(basic.range) || 3.2;
      this.spawnSlashArc(p.x, p.z, dir.angle, range, colorHex, 0.23, false, vfx);
      this.spawnSkillParticleFx(basic, p.x, 1.0, p.z, dir.angle, range * 0.85, { intensityScale: 0.52 });
      this.emitSoundRipple(p.x, p.z, 30 * this.passives.noiseMult, 'attack');
      playSfxSafe('sword_slash');

      // Hit check against Inspector
      if (this.inspector.alive && this.isPointInArc(p.x, p.z, dir.x, dir.z, this.inspector.x, this.inspector.z, range + this.inspector.radius, 0.35)) {
        this.damageInspector(dmg, dir.x * Math.max(2.2, kb), dir.z * Math.max(2.2, kb), false, {
          playerImpact: true,
          hitStop: 0.048,
          impactColor: colorHex
        });
        this.addCameraShake(0.16, 0.15);
      }

      // Hit check against intact destructible covers
      this.damageDestructibleCoversInArc(p.x, p.z, dir.x, dir.z, range + 0.55, 0.25, Math.max(22, dmg));
    }
  };

  EngineSession.prototype.isPointInArc = function (ox, oz, dx, dz, tx, tz, maxDist, minDot) {
    var rx = tx - ox;
    var rz = tz - oz;
    var d = Math.sqrt(rx * rx + rz * rz);
    if (d > maxDist) return false;
    if (d < 0.001) return true;
    var dot = (rx / d) * dx + (rz / d) * dz;
    return dot >= minDot;
  };

  EngineSession.prototype.castSlot = function (slotIdx) {
    if (!this.mounted || this.ended) return false;
    var sl = this.loadout.slots[slotIdx];
    if (!sl) return false;

    var p = this.player;

    // Special 2-stage check for blink_mark: recall uses 0 energy and triggers full CD
    var isBlinkRecall = (sl.archetype === 'blink_mark' && this.blinkBeacon !== null);

    if (!isBlinkRecall && sl.cooldownLeft > 0) {
      this.spawnFloatingText(p.x, 2.0, p.z, '冷却中 ' + sl.cooldownLeft.toFixed(1) + 's', '#9aa8bd');
      return false;
    }
    if (!isBlinkRecall && p.energy < sl.energyCost) {
      this.spawnFloatingText(p.x, 2.0, p.z, '能量不足', '#ff8866');
      return false;
    }

    if (!isBlinkRecall) {
      p.energy = Math.max(0, p.energy - sl.energyCost);
    }
    p.actionTimer = 0.36;
    p.auraPulse = 1.0;
    this.combatFocusTimer = Math.max(this.combatFocusTimer || 0, 5.5);
    this.triggerActorSquash(p, 1.22, 0.84);
    this.stats.skillsCast += 1;

    // Limbus-style Skill Cut-In Banner + Director Camera Push + Letterbox Beat
    var isMajorCast = (sl.archetype === 'sword_arc' || sl.archetype === 'berserk_strike' || sl.archetype === 'emp_blast' || sl.archetype === 'rail_shot' || sl.archetype === 'seal_chain' || sl.archetype === 'overclock');
    this.triggerSkillCutIn(
      sl.name || '构筑释放',
      String(sl.archetype || 'SKILL').toUpperCase().replace(/_/g, ' ') + ' // SLOT ' + (slotIdx + 1),
      (sl.vfxProfile && sl.vfxProfile.primaryColor) || sl.color || '#5ce8ff'
    );
    if (this.directorTimeline) {
      this.directorTimeline.triggerBeat({
        zoom: isMajorCast ? 0.60 : 0.72,
        holdSec: isMajorCast ? 0.44 : 0.28,
        letterbox: isMajorCast ? 0.068 : 0.036,
        chromatic: isMajorCast ? 0.52 : 0.24,
        inkEdge: isMajorCast ? 0.58 : 0.32
      });
    }

    var dir = this.getAimDir();
    var vfx = sl.vfxProfile || {
      motif: 'cyber_tactical',
      primaryColor: sl.color || '#6fd8ea',
      secondaryColor: '#ffffff',
      coreColor: '#ffffff',
      sigilStyle: 'tactical_hud',
      tierIntensity: 1.0,
      isHighTier: false,
      isFused: false,
      isGamble: false,
      shapeVariant: slotIdx % 4
    };
    var colorHex = hexToInt(vfx.primaryColor || sl.color, 0x6fd8ea);
    var secHex = hexToInt(vfx.secondaryColor || sl.color, 0xffffff);
    var power = Math.round((sl.power || 28) * this.passives.damageMult);
    var radius = sl.radius || 3.6;
    var duration = sl.duration || 4.0;
    var ins = this.inspector;

    // Evaluate Bloodline Resonance (血统共鸣系统) — apply numeric bonuses & trigger arena-wide global VFX
    var resonance = sl.resonance;
    if (!resonance && this.skillsApi && this.skillsApi.BloodlineResonance && this.loadout && this.loadout.bloodlines && this.loadout.bloodlines.length > 0) {
      resonance = this.skillsApi.BloodlineResonance.evaluate(this.loadout.bloodlines, sl);
    }
    var activeResonance = (resonance && resonance.matched && !isBlinkRecall) ? resonance : null;
    if (activeResonance) {
      var rb = activeResonance.bonuses;
      power = Math.round(power * (rb.powerMult || 1.0));
      radius = Number((radius * (rb.radiusMult || 1.0)).toFixed(2));
      duration = Number((duration * (rb.durationMult || 1.0)).toFixed(2));
      if (rb.energyRefund > 0) {
        p.energy = Math.min(p.maxEnergy, p.energy + rb.energyRefund);
      }
      if (rb.hpBonus > 0) {
        p.hp = Math.min(p.maxHp, p.hp + rb.hpBonus);
      }
      if (rb.sanBonus > 0) {
        p.sanity = Math.min(p.maxSanity, p.sanity + rb.sanBonus);
      }
      if (rb.slowBonusSec > 0 && ins && ins.alive && dist2D(p.x, p.z, ins.x, ins.z) <= Math.max(radius + 4.5, 9.5)) {
        ins.chainTimer = Math.max(ins.chainTimer || 0, rb.slowBonusSec);
        if (activeResonance.affinityId === 'frost') {
          ins.stunTimer = Math.max(ins.stunTimer || 0, rb.slowBonusSec * 0.45);
        }
        this.spawnImpactStar(ins.x, 1.4, ins.z, activeResonance.colors.primaryHex, 2.3, 0.34);
      }
      this.spawnResonanceGlobalVfx(activeResonance, p.x, p.z, dir.angle);
      this.spawnFloatingText(
        p.x,
        2.55,
        p.z,
        '✦ ' + activeResonance.resonanceName + ' · ' + activeResonance.summaryText,
        activeResonance.colors.primary,
        'resonance'
      );
      var nowSec = this.stats.elapsedSec || 0;
      if (nowSec - (sl.lastResonanceRadioAt || -99) >= 12) {
        sl.lastResonanceRadioAt = nowSec;
        this.emitRadio({
          type: 'spark',
          speaker: '血统共鸣',
          text: '【' + activeResonance.badgeText + '】「' + activeResonance.bloodlineName + '」与「' + (sl.name || '技能') + '」产生共鸣：' + activeResonance.summaryText + '。'
        });
      }
    }

    // Apply per-archetype CombatFeel baseline (subtle cast impulse + brief channel windup pose)
    var feelApi = this.combatFeelApi || INFINITY.CombatFeel;
    var castFeel = (feelApi && typeof feelApi.getArchetypeFeel === 'function')
      ? feelApi.getArchetypeFeel(sl.archetype)
      : null;
    if (castFeel) {
      if (castFeel.windupSec > 0) p.channelTimer = Math.max(p.channelTimer || 0, castFeel.windupSec);
      if (castFeel.shakeAmp > 0) this.addCameraShake(castFeel.shakeAmp * 0.45, 0.16, castFeel.shakeFreq);
      if (castFeel.fovPunch) this.camFovPunch = clamp((this.camFovPunch || 0) + castFeel.fovPunch * 0.45, -4.0, 3.6);
    }

    // Strict <= 3 visual layers per cast (ArtTokens.BUDGETS.maxLayersPerCast = 3):
    //   Layer 1: Archetype primary 3D VFX (switch below)
    //   Layer 2: Motif-specific 3D secondary geometry burst (flame embers / ice prisms / glitch cubes / etc.)
    //   Layer 3: Either Resonance rim pulse (already spawned above) OR Skill particle/sigil accent
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnMotifSecondaryBurst === 'function') {
      INFINITY.VfxStudio.spawnMotifSecondaryBurst(this, p.x, 0.85, p.z, colorHex, vfx, radius);
    }
    if (!activeResonance) {
      if (vfx.isHighTier || vfx.isFused) {
        this.spawnSigilPulse(p.x, p.z, 2.2 * (vfx.tierIntensity || 1.1), vfx.sigilStyle, colorHex, 0.52);
      } else {
        this.spawnSkillParticleFx(sl, p.x, 1.02, p.z, dir.angle, radius, null);
      }
    }

    switch (sl.archetype) {
      case 'sword_arc': {
        var arcRange = Math.max(3.8, radius);
        this.spawnSlashArc(p.x, p.z, dir.angle, arcRange, colorHex, 0.36, true, vfx);
        this.spawnScorchDecal(p.x, p.z, dir.angle, arcRange, colorHex);
        // High-tier or variant 1/3 fires a follow-up cross-crescent!
        if (vfx.isHighTier || vfx.isFused || vfx.shapeVariant === 1) {
          this.spawnSlashArc(p.x, p.z, dir.angle + 0.14, arcRange * 0.92, secHex, 0.28, false, vfx);
        }
        playSfxSafe('sword_slash');
        this.emitSoundRipple(p.x, p.z, 46 * this.passives.noiseMult, 'skill');

        // Check PERFECT PARRY during Inspector red lunge or close shear cleave telegraph!
        var dIns = dist2D(p.x, p.z, ins.x, ins.z);
        var parryableWindow = (ins.lungeWindup > 0 || ins.lungeTelegraph > 0 || ins.lungeActive > 0 || ins.cleaveTelegraph > 0);
        if (ins.alive && parryableWindow && dIns <= arcRange + 1.2) {
          ins.lungeTelegraph = 0;
          ins.lungeWindup = 0;
          ins.lungeActive = 0;
          ins.cleaveTelegraph = 0;
          ins.blinkTelegraph = 0;
          ins.pendingWeakpoint = null;
          ins.teleMesh.visible = false;
          ins.teleFill.visible = false;
          if (ins.cleaveMesh) ins.cleaveMesh.visible = false;
          if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
          ins.stunTimer = Math.max(ins.stunTimer, 2.6);
          ins.armorBrokenTimer = Math.max(ins.armorBrokenTimer || 0, BOSS_DEATH_EXAM_CONFIG.armorBreakDuration);
          p.energy = Math.min(p.maxEnergy, p.energy + 25);
          this.stats.parries += 1;
          var parryDmg = Math.round(power * 1.9);
          this.damageInspector(parryDmg, dir.x * 6.5, dir.z * 6.5, true, {
            playerImpact: true,
            hitStop: 0.08,
            impactColor: 0xffe484,
            ignoreRuleArmor: true
          });
          if (ins.alive) {
            this.exposeInspectorWeakpoint('parry_shatter', 4.5);
          }
          this.hitStopTimer = 0.08;
          this.parryFlashTimer = 0.24;
          this.triggerImpactFrame(0.085);
          p.combatPose = 'parry';
          p.combatPoseTimer = 0.34;
          this.triggerSkillCutIn('完美弹反 · ' + (sl.name || '宵练断势'), 'CLASH WIN // COUNTER EXECUTION', '#ffd86b');
          this.triggerOnomatopoeia(ins.x, 2.2, ins.z, '鏗!', '#ffe484');
          if (this.directorTimeline) {
            this.directorTimeline.triggerBeat({ zoom: 0.56, holdSec: 0.52, letterbox: 0.082, chromatic: 0.78, inkEdge: 0.75 });
          }
          this.camFovPunch = -3.4;
          this.addCameraShake(0.48, 0.34);
          this.addCameraKick(dir.x * 0.62, dir.z * 0.62);
          this.spawnImpactStar(ins.x, 1.45, ins.z, 0xffe484, 3.2, 0.36);
          this.spawnShockRing(ins.x, ins.z, 5.2, 0xffe484, 0.50);
          this.spawnShockRing(ins.x, ins.z, 2.8, 0xffffff, 0.28);
          this.spawnSparkBurst(ins.x, 1.35, ins.z, 0xffe07d, 26);
          playSfxSafe('parry_clang');
          this.spawnFloatingText(ins.x, 3.0, ins.z, '✦ 完美弹反 · 规则破甲! ' + (sl.name || '宵练断势'), '#ffd86b', 'parry');
          this.emitRadio({
            type: 'spark',
            speaker: '系统校验',
            text: '【完美弹反 · 弱点暴露】你以「' + (sl.name || '宵练剑弧') + '」截断了零号检票员的处决攻势，震碎规则护甲并暴露胸口核心 4.5 秒，返还 25 点能量！'
          });
        } else if (ins.alive && this.isPointInArc(p.x, p.z, dir.x, dir.z, ins.x, ins.z, arcRange + ins.radius, 0.15)) {
          this.damageInspector(power, dir.x * 5.0, dir.z * 5.0, vfx.isHighTier, {
            playerImpact: true,
            hitStop: 0.055,
            impactColor: colorHex
          });
          this.spawnImpactStar(ins.x, 1.35, ins.z, colorHex, 1.9, 0.24);
          this.addCameraShake(0.24, 0.18);
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'ward_circle': {
        var wx = p.x + dir.x * 1.1;
        var wz = p.z + dir.z * 1.1;
        var wSafe = this.mapApi.resolveCircleWallCollision(wx, wz, 0.5);
        this.spawnWardCircle(wSafe.x, wSafe.z, Math.max(3.0, radius), Math.max(6.5, duration), colorHex, vfx);
        playSfxSafe('ward_hum');
        this.spawnFloatingText(wSafe.x, 2.1, wSafe.z, (sl.name || '结界展开') + ' · 阻断追踪', vfx.primaryColor || '#f0c46c');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'emp_blast': {
        var tx = this.aimWorld.x;
        var tz = this.aimWorld.z;
        var distT = dist2D(p.x, p.z, tx, tz);
        if (distT > 11.5) {
          tx = p.x + ((tx - p.x) / distT) * 11.5;
          tz = p.z + ((tz - p.z) / distT) * 11.5;
        }
        this.spawnArcProjectile({
          kind: 'emp',
          sx: p.x, sz: p.z,
          tx: tx, tz: tz,
          duration: Math.max(0.24, Math.min(0.45, distT * 0.04)),
          radius: Math.max(4.4, radius),
          power: power,
          stunSec: Math.max(3.5, duration),
          color: colorHex,
          vfxProfile: vfx
        });
        playSfxSafe('alert');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'rail_shot': {
        var endPt = this.raycastWall(p.x, p.z, dir.x, dir.z, 22);
        this.spawnLaserBeam(p.x, p.z, endPt.x, endPt.z, colorHex, 0.40, vfx);
        this.emitSoundRipple(p.x, p.z, 76 * this.passives.noiseMult, 'skill');
        this.addCameraShake(0.32, 0.22);
        this.addCameraKick(-dir.x * 0.48, -dir.z * 0.48);
        this.camFovPunch = 2.0;
        playSfxSafe('rail_fire');

        if (ins.alive && this.segmentCircleHit(p.x, p.z, endPt.x, endPt.z, ins.x, ins.z, ins.radius + 0.55)) {
          this.damageInspector(Math.round(power * 1.35), dir.x * 7.2, dir.z * 7.2, true, {
            playerImpact: true,
            hitStop: 0.06,
            impactColor: colorHex
          });
          this.spawnImpactStar(ins.x, 1.35, ins.z, colorHex, 2.4, 0.28);
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'blink_mark': {
        if (!this.blinkBeacon) {
          this.placeBlinkBeacon(p.x, p.z, colorHex, vfx);
          playSfxSafe('ward_place');
          this.spawnFloatingText(p.x, 2.0, p.z, (sl.name || '空间锚点') + '已布设 (再按召回)', vfx.primaryColor || '#66e8ff');
          sl.cooldownLeft = 0.4;
        } else {
          var ox = p.x;
          var oz = p.z;
          var bx = this.blinkBeacon.x;
          var bz = this.blinkBeacon.z;
          // Dimensional rift beam connecting origin -> destination
          this.spawnLaserBeam(ox, oz, bx, bz, colorHex, 0.34, vfx);
          this.spawnSigilPulse(ox, oz, 2.2, vfx.sigilStyle, secHex, 0.45);
          for (var ai = 0; ai < 6; ai++) {
            var frac = ai / 5;
            this.spawnAfterimage(lerp(ox, bx, frac), lerp(oz, bz, frac), 'player', p.facingLeft, ai % 2 === 0 ? colorHex : secHex, 0.46 - frac * 0.06, 'dash');
          }
          var safeBlink = this.mapApi.resolveCircleWallCollision(bx, bz, p.radius);
          p.x = safeBlink.x;
          p.z = safeBlink.z;
          this.playerTrailPrev = { x: p.x, z: p.z };
          this.playerTrailAccum = 0;
          p.invulnTimer = 0.55;
          this.triggerActorSquash(p, 0.82, 1.24);
          this.camFovPunch = -2.2;
          this.spawnShockRing(bx, bz, 2.8, colorHex, 0.38);
          this.spawnSigilPulse(bx, bz, 2.6, vfx.sigilStyle, colorHex, 0.52);
          this.spawnSparkBurst(bx, 1.1, bz, secHex, 16);
          this.removeBlinkBeacon();
          playSfxSafe('vortex_buy');
          this.spawnFloatingText(bx, 2.1, bz, '折跃回溯！', vfx.primaryColor || '#66e8ff');
          sl.cooldownLeft = sl.cooldownMax;
        }
        break;
      }

      case 'aegis_shield': {
        p.shieldHp = Math.max(45, Math.round(power * 1.1));
        p.shieldTimer = Math.max(7.5, duration);
        p.shieldColor = colorHex;
        p.shieldMesh.visible = true;
        if (p.shieldMat && p.shieldMat.uniforms) {
          // VfxStudio shader uniforms are linear (outputs pass through linearToOutputTexel)
          if (p.shieldMat.uniforms.uColorA) p.shieldMat.uniforms.uColorA.value.setHex(colorHex).convertSRGBToLinear();
          if (p.shieldMat.uniforms.uColorB) p.shieldMat.uniforms.uColorB.value.setHex(secHex).convertSRGBToLinear();
        } else if (p.shieldMat && p.shieldMat.color) {
          p.shieldMat.color.setHex(colorHex);
        }
        if (p.shieldRingMat && p.shieldRingMat.color) p.shieldRingMat.color.setHex(secHex);
        this.spawnShockRing(p.x, p.z, 2.4, colorHex, 0.40);
        if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnFlipbookVfx === 'function') {
          INFINITY.VfxStudio.spawnFlipbookVfx(this, {
            name: 'hades_heal_aegis',
            x: p.x,
            z: p.z,
            radius: 2.2,
            layer: 'ground',
            duration: 0.46,
            primaryColor: colorHex,
            secondaryColor: secHex
          });
        }
        playSfxSafe('ward_place');
        this.spawnFloatingText(p.x, 2.1, p.z, (sl.name || '护盾') + ' +' + p.shieldHp, vfx.primaryColor || '#66e8ff');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'overclock': {
        p.overclockTimer = Math.max(4.0, duration);
        p.overclockColor = colorHex;
        this.camFovPunch = 2.6;
        if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnOverclockBurstVfx === 'function') {
          INFINITY.VfxStudio.spawnOverclockBurstVfx(this, p.x, p.z, colorHex, vfx);
        } else {
          this.spawnShockRing(p.x, p.z, 3.6, colorHex, 0.44);
          this.spawnSparkBurst(p.x, 1.1, p.z, colorHex, 18);
        }
        playSfxSafe('crisis_freeze');
        this.spawnFloatingText(p.x, 2.1, p.z, (sl.name || '神经超频') + '! 移速×1.65', vfx.primaryColor || '#4df8ff');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'heal_pulse': {
        var hRad = Math.max(6.2, radius);
        this.spawnHealPillarVfx(p.x, p.z, hRad, colorHex, secHex, vfx);
        playSfxSafe('ward_place');
        p.hp = Math.min(p.maxHp, p.hp + 30);
        p.sanity = Math.min(p.maxSanity, p.sanity + 20);
        this.spawnFloatingText(p.x, 2.2, p.z, '+30 HP / +20 SAN', vfx.primaryColor || '#4af2a1');
        for (var hi = 0; hi < this.squad.length; hi++) {
          var ally = this.squad[hi];
          if (ally.alive && dist2D(p.x, p.z, ally.x, ally.z) <= hRad) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 30);
            ally.sanity = Math.min(ally.maxSanity || 100, (ally.sanity != null ? ally.sanity : 100) + 20);
            this.spawnHealPillarVfx(ally.x, ally.z, 1.6, colorHex, secHex, vfx);
            this.spawnFloatingText(ally.x, 2.1, ally.z, '+30 HP / +20 SAN', vfx.primaryColor || '#4af2a1');
          }
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'stealth_veil': {
        p.stealthTimer = Math.max(5.0, duration);
        p.stealthColor = colorHex;
        this.spawnStealthBurstVfx(p.x, p.z, colorHex, secHex, vfx);
        playSfxSafe('vortex_buy');
        this.spawnFloatingText(p.x, 2.1, p.z, (sl.name || '敛息隐匿') + ' · 仇恨脱离', vfx.primaryColor || '#b4a3ff');
        // Immediately drop Inspector aggro
        if (ins.alive && ins.state === 'HUNT' && ins.huntTargetId === 'player') {
          ins.state = 'INVESTIGATE';
          ins.investigateTarget = { x: p.x, z: p.z };
          ins.investigateTimer = 4.5;
          ins.lungeTelegraph = 0;
          ins.lungeWindup = 0;
          ins.teleMesh.visible = false;
          ins.teleFill.visible = false;
          if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'seal_chain': {
        var feelMin = (INFINITY.CombatFeel && INFINITY.CombatFeel.ARCHETYPE_FEEL && INFINITY.CombatFeel.ARCHETYPE_FEEL.seal_chain)
          ? (Number(INFINITY.CombatFeel.ARCHETYPE_FEEL.seal_chain.previewMinRadius) || 10.5)
          : 10.5;
        var chainRange = Math.max(feelMin, radius);
        var dToBoss = dist2D(p.x, p.z, ins.x, ins.z);
        if (ins.alive && dToBoss <= chainRange) {
          var sealAdd = 24 + (activeResonance && activeResonance.bonuses ? (activeResonance.bonuses.sealBonusPct || 0) : 0);
          ins.chainTimer = Math.max(ins.chainTimer, Math.max(5.0, duration));
          ins.armorBrokenTimer = Math.max(ins.armorBrokenTimer || 0, 4.2);
          ins.sealedPct = Math.min(100, ins.sealedPct + sealAdd);
          this.spawnSealChainsVfx(p.x, p.z, ins.x, ins.z, colorHex, vfx);
          this.damageInspector(Math.round(power * 0.75), 0, 0, false, { impactColor: colorHex, ignoreRuleArmor: true });
          if (ins.alive && ins.sealedPct < 100) {
            this.exposeInspectorWeakpoint('seal_shatter', 4.0);
          }
          this.spawnImpactStar(ins.x, 1.4, ins.z, colorHex, 2.1, 0.30);
          this.spawnFloatingText(ins.x, 2.8, ins.z, '规则封印 +' + sealAdd + '% · 破甲!', vfx.primaryColor || '#f0c46c');
          playSfxSafe('fusion');
          this.addCameraShake(0.28, 0.25);

          var sealPctNow = Math.round(ins.sealedPct);
          this.setBranchState(
            'inspector_hunt',
            sealPctNow >= 100 ? 'completed' : 'active',
            '规则锁链命中！当前封印进度 ' + sealPctNow + '%（剩余 HP ' + Math.round(ins.hp) + '）。',
            Math.max(sealPctNow, Math.round(((ins.maxHp - ins.hp) / Math.max(1, ins.maxHp)) * 100))
          );
          this.recordMissionEvent(
            'progress',
            '规则锁链封印推进至 ' + sealPctNow + '%',
            '「' + (sl.name || '规则锁链') + '」束缚住零号检票员，封印度提升 +28%。',
            { branchId: 'inspector_hunt' }
          );

          if (ins.sealedPct >= 100) {
            this.defeatInspector(true);
          }
        } else {
          // Lash forward along aim if out of range
          this.spawnSealChainsVfx(p.x, p.z, p.x + dir.x * 7.5, p.z + dir.z * 7.5, colorHex, vfx);
          this.spawnFloatingText(p.x, 2.1, p.z, '锁链未命中目标 (距检票员过远)', '#d6b274');
          playSfxSafe('blade_ring');
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'recon_pulse': {
        this.reconRevealTimer = Math.max(6.5, duration);
        this.spawnReconSweepVfx(p.x, p.z, Math.max(22, radius), colorHex, secHex, vfx);
        this.rebuildReconBeacons();
        playSfxSafe('alert');
        this.spawnFloatingText(p.x, 2.2, p.z, (sl.name || '声呐扫描') + ' · 目标显形', vfx.primaryColor || '#58e6d8');
        this.emitRadio({
          type: 'system',
          text: '【声呐回波】已穿透站台隔墙标记：零号检票员、沈砚坐标与全部未拾取线索。'
        });
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'turret_drone': {
        var dxPos = this.mapApi.resolveCircleWallCollision(p.x + dir.x * 1.2, p.z + dir.z * 1.2, 0.35);
        this.spawnTurretDrone(dxPos.x, dxPos.z, Math.max(14.0, duration), colorHex, vfx);
        playSfxSafe('vortex_buy');
        this.spawnFloatingText(dxPos.x, 2.1, dxPos.z, (sl.name || '浮游机炮') + ' 部署', vfx.primaryColor || '#58c4a6');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'decoy_flare': {
        var fx = this.aimWorld.x;
        var fz = this.aimWorld.z;
        var fd = dist2D(p.x, p.z, fx, fz);
        if (fd > 11.0) {
          fx = p.x + ((fx - p.x) / fd) * 11.0;
          fz = p.z + ((fz - p.z) / fd) * 11.0;
        }
        var fSafe = this.mapApi.resolveCircleWallCollision(fx, fz, 0.35);
        this.spawnArcProjectile({
          kind: 'decoy',
          sx: p.x, sz: p.z,
          tx: fSafe.x, tz: fSafe.z,
          duration: Math.max(0.24, Math.min(0.42, fd * 0.04)),
          flareDuration: Math.max(8.0, duration),
          color: colorHex,
          vfxProfile: vfx
        });
        playSfxSafe('ui_click');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'berserk_strike': {
        var dashDist = 4.2;
        p.dashTimer = 0.16;
        p.dashVx = dir.x * (dashDist / 0.16);
        p.dashVz = dir.z * (dashDist / 0.16);
        p.dashColor = colorHex;
        p.invulnTimer = Math.max(p.invulnTimer, 0.34);
        this.triggerActorSquash(p, 1.32, 0.76);
        this.spawnShockRing(p.x, p.z, 1.8, colorHex, 0.24);

        // Schedule ground-fissure shockwave slam at end of short dash
        var self = this;
        var slamRad = Math.max(3.6, radius);
        var slamDmg = Math.round(power * 1.45);
        this.vfxList.push({
          persistent: true, // gameplay timer: slam damage resolves on expiry
          ttl: 0.16,
          maxTtl: 0.16,
          update: function (dt) {
            this.ttl -= dt;
            if (this.ttl <= 0) {
              self.triggerActorSquash(p, 1.36, 0.70);
              self.camFovPunch = -2.8;
              self.spawnBerserkSlamVfx(p.x, p.z, slamRad, colorHex, secHex, vfx);
              self.addCameraShake(0.46, 0.30);
              self.emitSoundRipple(p.x, p.z, 72 * self.passives.noiseMult, 'skill');
              playSfxSafe('fusion');
              if (ins.alive && dist2D(p.x, p.z, ins.x, ins.z) <= slamRad + ins.radius) {
                var bx = ins.x - p.x;
                var bz = ins.z - p.z;
                var bl = Math.max(0.01, Math.sqrt(bx * bx + bz * bz));
                self.damageInspector(slamDmg, (bx / bl) * 6.8, (bz / bl) * 6.8, true, {
                  playerImpact: true,
                  hitStop: 0.065,
                  impactColor: colorHex
                });
                self.spawnImpactStar(ins.x, 1.35, ins.z, colorHex, 2.8, 0.32);
                ins.stunTimer = Math.max(ins.stunTimer, 1.0);
              }
            }
          },
          dispose: function () {}
        });
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      default: {
        // Safe fallback slash
        this.spawnSlashArc(p.x, p.z, dir.angle, 3.6, colorHex, 0.28, true, vfx);
        playSfxSafe('sword_slash');
        if (ins.alive && dist2D(p.x, p.z, ins.x, ins.z) <= 4.0) {
          this.damageInspector(power, dir.x * 3.5, dir.z * 3.5, false, {
            playerImpact: true,
            hitStop: 0.05,
            impactColor: colorHex
          });
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }
    }

    return true;
  };

  // ---------------------------------------------------------------------------
  // Skill Entities: Wards, Drones, Decoys, Blink Beacon, Recon Beacons
  // ---------------------------------------------------------------------------
  EngineSession.prototype.spawnWardCircle = function (x, z, radius, duration, colorHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.buildWardCircle === 'function') {
      var ward = INFINITY.VfxStudio.buildWardCircle(this, x, z, radius, duration, colorHex, vfx);
      ward.colorHex = colorHex || 0xf0c46c;
      this.wards.push(ward);
      if (this.inspector.alive) {
        this.enforceWardBlockOnInspector();
      }
      return;
    }
    var THREE = this.THREE;
    var group = new THREE.Group();
    group.position.set(x, 0.09, z);
    var secHex = hexToInt(vfx && vfx.secondaryColor, 0x6fd8ea);
    var sigilKey = (vfx && vfx.sigilStyle) ? ('sigil_' + vfx.sigilStyle) : 'sigil_bagua';
    var sigilTex = this.getPropTex(sigilKey, '#f0c46c');
    var discGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
    discGeo.rotateX(-Math.PI / 2);
    var discMat = new THREE.MeshBasicMaterial({ map: sigilTex, color: colorHex || 0xf0c46c, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending });
    var disc = new THREE.Mesh(discGeo, discMat);
    group.add(disc);
    this.scene.add(group);
    this.wards.push({ x: x, z: z, radius: radius, ttl: duration, maxTtl: duration, colorHex: colorHex || 0xf0c46c, group: group, disc: disc, ring: disc, geos: [discGeo], mats: [discMat] });
    if (this.inspector.alive) this.enforceWardBlockOnInspector();
  };

  EngineSession.prototype.updateWards = function (simDt) {
    for (var i = this.wards.length - 1; i >= 0; i--) {
      var w = this.wards[i];
      w.ttl -= simDt;
      if (typeof w.updateVisual === 'function') {
        w.updateVisual(simDt, this.elapsedReal);
      } else {
        if (w.disc) w.disc.rotation.y += simDt * 0.72;
        if (w.ring) w.ring.rotation.z -= simDt * 1.15;
      }
      if (w.ttl < 1.2) {
        var fade = clamp(w.ttl / 1.2, 0, 1);
        for (var mi = 0; mi < w.mats.length; mi++) {
          var mt = w.mats[mi];
          if (mt.uniforms && mt.uniforms.uOpacity) mt.uniforms.uOpacity.value = 0.68 * fade;
          else if (typeof mt.opacity === 'number') mt.opacity = Math.min(mt.opacity, fade);
        }
      }
      if (w.ttl <= 0) {
        this.spawnWardEmbers(w.x, w.z, w.radius);
        this.scene.remove(w.group);
        for (var g = 0; g < w.geos.length; g++) disposeOwned(w.geos[g]);
        for (var m = 0; m < w.mats.length; m++) disposeOwned(w.mats[m]);
        this.wards.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.isInsideAnyWard = function (x, z) {
    for (var i = 0; i < this.wards.length; i++) {
      if (dist2D(x, z, this.wards[i].x, this.wards[i].z) <= this.wards[i].radius) return true;
    }
    return false;
  };

  EngineSession.prototype.enforceWardBlockOnInspector = function () {
    var ins = this.inspector;
    if (!ins || !ins.alive) return false;
    var blocked = false;
    for (var i = 0; i < this.wards.length; i++) {
      var w = this.wards[i];
      var dx = ins.x - w.x;
      var dz = ins.z - w.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      var minDist = w.radius + ins.radius + 0.08;
      if (d < minDist) {
        var nx = d > 0.001 ? dx / d : 1;
        var nz = d > 0.001 ? dz / d : 0;
        var pushed = this.mapApi.resolveCircleWallCollision(w.x + nx * minDist, w.z + nz * minDist, ins.radius);
        ins.x = pushed.x;
        ins.z = pushed.z;
        if (ins.lungeActive > 0) {
          ins.lungeActive = 0;
          ins.stunTimer = Math.max(ins.stunTimer, 0.8);
          this.triggerActorSquash(ins, 0.78, 1.24);
          this.spawnFloatingText(ins.x, 2.5, ins.z, '结界弹阻！', '#f0c46c');
          this.spawnImpactStar(ins.x, 1.25, ins.z, w.colorHex || 0xf0c46c, 2.2, 0.28);
          this.spawnShockRing(ins.x, ins.z, 2.4, w.colorHex || 0xf0c46c, 0.35);
          this.spawnSparkBurst(ins.x, 1.0, ins.z, w.colorHex || 0xf0c46c, 16);
          playSfxSafe('ward_hum');
        }
        blocked = true;
      }
    }
    return blocked;
  };

  EngineSession.prototype.placeBlinkBeacon = function (x, z, colorHex, vfx) {
    this.removeBlinkBeacon();
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.buildBlinkBeacon === 'function') {
      var b = INFINITY.VfxStudio.buildBlinkBeacon(this, x, z, colorHex, vfx);
      b.ttl = 18.0;
      this.blinkBeacon = b;
      return;
    }
  };

  EngineSession.prototype.removeBlinkBeacon = function () {
    if (!this.blinkBeacon) return;
    this.scene.remove(this.blinkBeacon.group);
    for (var g = 0; g < this.blinkBeacon.geos.length; g++) disposeOwned(this.blinkBeacon.geos[g]);
    for (var m = 0; m < this.blinkBeacon.mats.length; m++) disposeOwned(this.blinkBeacon.mats[m]);
    this.blinkBeacon = null;
  };

  EngineSession.prototype.spawnTurretDrone = function (x, z, duration, colorHex, vfx) {
    if (this.drones.length >= 2) {
      var old = this.drones.shift();
      this.scene.remove(old.group);
      old.geos.forEach(disposeOwned);
      old.mats.forEach(disposeOwned);
    }
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.buildTurretDrone === 'function') {
      var d = INFINITY.VfxStudio.buildTurretDrone(this, x, z, duration, colorHex, vfx);
      d.colorHex = colorHex || 0x58f5c8;
      d.secHex = hexToInt(vfx && vfx.secondaryColor, 0x58f5c8);
      d.recoil = 0;
      this.drones.push(d);
    }
  };

  EngineSession.prototype.updateDrones = function (simDt) {
    var ins = this.inspector;
    for (var i = this.drones.length - 1; i >= 0; i--) {
      var dr = this.drones[i];
      dr.ttl -= simDt;
      dr.fireCd -= simDt;
      dr.recoil = Math.max(0, (dr.recoil || 0) - simDt * 5.0);
      dr.group.position.y = 1.38 + Math.sin(this.elapsedReal * 4.5 + i) * 0.14 + dr.recoil * 0.10;
      if (dr.ring) dr.ring.rotation.z += simDt * 2.8;
      if (ins.alive) {
        dr.group.rotation.y = Math.atan2(ins.x - dr.x, ins.z - dr.z);
      } else {
        dr.group.rotation.y += simDt * 1.2;
      }

      if (dr.fireCd <= 0 && ins.alive) {
        var d = dist2D(dr.x, dr.z, ins.x, ins.z);
        if (d <= 13.5 && this.mapApi.hasLineOfSight(dr.x, dr.z, ins.x, ins.z)) {
          dr.fireCd = 0.85;
          dr.recoil = 1.0;
          var dx = (ins.x - dr.x) / Math.max(0.01, d);
          var dz = (ins.z - dr.z) / Math.max(0.01, d);
          this.spawnSparkBurst(dr.x + dx * 0.35, 1.38, dr.z + dz * 0.35, dr.secHex || 0x58f5c8, 6);
          this.spawnProjectile({
            owner: 'drone',
            x: dr.x,
            z: dr.z,
            vx: dx * 19,
            vz: dz * 19,
            damage: Math.round(9 * this.passives.damageMult),
            knockback: 1.0,
            color: dr.colorHex || 0x58f5c8,
            secondaryColor: dr.secHex || 0xffffff,
            radius: 0.22,
            ttl: 0.9
          });
          playSfxSafe('ui_click');
        }
      }

      if (dr.ttl <= 0) {
        this.spawnSparkBurst(dr.x, 1.2, dr.z, dr.colorHex || 0x58f5c8, 10);
        this.scene.remove(dr.group);
        dr.geos.forEach(disposeOwned);
        dr.mats.forEach(disposeOwned);
        this.drones.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.spawnDecoyFlare = function (x, z, duration, colorHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.buildDecoyFlare === 'function') {
      var dc = INFINITY.VfxStudio.buildDecoyFlare(this, x, z, duration, colorHex, vfx);
      dc.colorHex = colorHex || 0xffa838;
      this.decoys.push(dc);
    }
    this.spawnFloatingText(x, 1.5, z, '全息声噪诱饵启动！', (vfx && vfx.primaryColor) || '#ffa838');
  };

  EngineSession.prototype.updateDecoys = function (simDt) {
    for (var i = this.decoys.length - 1; i >= 0; i--) {
      var dc = this.decoys[i];
      dc.ttl -= simDt;
      dc.pulseCd -= simDt;
      if (dc.orb) {
        dc.orb.rotation.y += simDt * 4.2;
        dc.orb.position.y = 1.25 + Math.sin(this.elapsedReal * 5 + i) * 0.12;
      }
      if (dc.holoMat && dc.holoMat.uniforms && dc.holoMat.uniforms.uTime) {
        dc.holoMat.uniforms.uTime.value = this.elapsedReal;
      }
      if (dc.pulseCd <= 0) {
        dc.pulseCd = 1.3;
        this.emitSoundRipple(dc.x, dc.z, 86, 'decoy');
        this.spawnShockRing(dc.x, dc.z, 2.8, dc.colorHex || 0xffa838, 0.55);
        this.spawnSparkBurst(dc.x, 0.65, dc.z, dc.colorHex || 0xffa838, 8);
      }
      if (dc.ttl <= 0) {
        this.scene.remove(dc.group);
        dc.geos.forEach(disposeOwned);
        dc.mats.forEach(disposeOwned);
        this.decoys.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.rebuildReconBeacons = function () {
    this.clearReconBeacons();
    var THREE = this.THREE;
    var targets = [];
    if (this.inspector.alive) targets.push({ ref: this.inspector, color: 0xff2c44, h: 4.5 });
    var shen = this.squadById['shenyan'];
    if (shen && shen.alive) targets.push({ ref: shen, color: 0xf0c46c, h: 3.4 });
    for (var i = 0; i < this.interactables.length; i++) {
      var it = this.interactables[i];
      if (it.type === 'clue' && !it.done) {
        targets.push({ ref: it, color: 0x58e6d8, h: 3.0 });
      }
    }

    for (var j = 0; j < targets.length; j++) {
      var t = targets[j];
      var geo = new THREE.CylinderGeometry(0.18, 0.32, t.h, 12, 1, true);
      var mat = new THREE.MeshBasicMaterial({
        color: t.color,
        transparent: true,
        opacity: 0.42,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(t.ref.x, t.h * 0.5, t.ref.z);
      mesh.renderOrder = 10;
      this.scene.add(mesh);
      this.reconBeacons.push({ ref: t.ref, mesh: mesh, geo: geo, mat: mat, h: t.h });
    }
  };

  EngineSession.prototype.updateReconBeacons = function (realDt) {
    for (var i = 0; i < this.reconBeacons.length; i++) {
      var b = this.reconBeacons[i];
      b.mesh.position.set(b.ref.x, b.h * 0.5, b.ref.z);
      b.mesh.rotation.y += realDt * 2.2;
      b.mat.opacity = 0.28 + Math.sin(this.elapsedReal * 7 + i) * 0.14;
    }
  };

  EngineSession.prototype.clearReconBeacons = function () {
    for (var i = 0; i < this.reconBeacons.length; i++) {
      this.scene.remove(this.reconBeacons[i].mesh);
      disposeOwned(this.reconBeacons[i].geo);
      disposeOwned(this.reconBeacons[i].mat);
    }
    this.reconBeacons = [];
  };

  EngineSession.prototype.clearFocusWaypoint = function () {
    var fw = this.focusWaypoint;
    if (!fw) return;
    if (this.scene) {
      if (fw.beaconGroup) this.scene.remove(fw.beaconGroup);
      if (fw.arrowMesh) this.scene.remove(fw.arrowMesh);
    }
    if (Array.isArray(fw.geos)) {
      for (var i = 0; i < fw.geos.length; i++) {
        try { disposeOwned(fw.geos[i]); } catch (_) {}
      }
    }
    if (Array.isArray(fw.mats)) {
      for (var j = 0; j < fw.mats.length; j++) {
        try { disposeOwned(fw.mats[j]); } catch (_) {}
      }
    }
    this.focusWaypoint = null;
  };

  EngineSession.prototype.focusObjectiveTarget = function (taskKey) {
    if (!this.mounted || !this.scene || !this.player) return null;
    var p = this.player;
    var key = String(taskKey || '');
    var target = null;
    var bestDist = Infinity;

    if (key.indexOf('console_') === 0) {
      var cid = key.slice('console_'.length);
      var exact = this.interactablesById[cid];
      if (exact && !exact.done) {
        target = { x: exact.x, z: exact.z, label: exact.label || cid, color: '#6fd8ea', hex: 0x6fd8ea, ref: null };
      }
    } else if (key === 'override') {
      for (var ci = 0; ci < this.interactables.length; ci++) {
        var con = this.interactables[ci];
        if (con.type === 'console' && !con.done) {
          var dc = dist2D(p.x, p.z, con.x, con.z);
          if (dc < bestDist) {
            bestDist = dc;
            target = { x: con.x, z: con.z, label: con.label || '轨控终端', color: '#6fd8ea', hex: 0x6fd8ea, ref: null };
          }
        }
      }
    } else if (key === 'inspector') {
      if (this.inspector && this.inspector.alive) {
        target = {
          x: this.inspector.x,
          z: this.inspector.z,
          label: '零号检票员',
          color: '#e85d4a',
          hex: 0xe85d4a,
          ref: this.inspector
        };
      }
    } else if (key === 'clues') {
      for (var cli = 0; cli < this.interactables.length; cli++) {
        var clue = this.interactables[cli];
        if (clue.type === 'clue' && !clue.done) {
          var dcl = dist2D(p.x, p.z, clue.x, clue.z);
          if (dcl < bestDist) {
            bestDist = dcl;
            target = { x: clue.x, z: clue.z, label: clue.label || '未破译线索', color: '#d6b274', hex: 0xd6b274, ref: null };
          }
        }
      }
    } else if (key === 'zones') {
      var zonesObj = (this.mapApi && this.mapApi.ZONES) || DEFAULT_ZONES;
      var zKeys = Object.keys(zonesObj);
      for (var zi = 0; zi < zKeys.length; zi++) {
        var zk = zKeys[zi];
        if (this.visitedZones.indexOf(zk) === -1) {
          var zInfo = zonesObj[zk];
          if (zInfo && zInfo.cx != null && zInfo.cz != null) {
            var dz = dist2D(p.x, p.z, zInfo.cx, zInfo.cz);
            if (dz < bestDist) {
              bestDist = dz;
              target = {
                x: zInfo.cx,
                z: zInfo.cz,
                label: (zInfo.code ? (zInfo.code + ' ') : '') + (zInfo.name || zk),
                color: '#6fd8ea',
                hex: 0x6fd8ea,
                ref: null
              };
            }
          }
        }
      }
    } else if (key === 'exit') {
      for (var ei = 0; ei < this.interactables.length; ei++) {
        var ex = this.interactables[ei];
        if (ex.type === 'exit') {
          target = { x: ex.x, z: ex.z, label: ex.label || '0号站台撤离锚点', color: '#58c4a6', hex: 0x58c4a6, ref: null };
          break;
        }
      }
      if (!target) {
        var p0 = getZoneInfo(this.mapApi, 'platform0');
        target = { x: p0.cx, z: p0.cz, label: '0号站台撤离通道', color: '#58c4a6', hex: 0x58c4a6, ref: null };
      }
    }

    if (!target) {
      return null;
    }

    this.clearFocusWaypoint();

    var THREE = this.THREE;
    var geos = [];
    var mats = [];

    // 1. Target beacon group (vertical beam + pulsing ground ring)
    var beaconGroup = new THREE.Group();
    beaconGroup.position.set(target.x, 0, target.z);

    var beamGeo = new THREE.CylinderGeometry(0.14, 0.34, 4.2, 14, 1, true);
    var beamMat = new THREE.MeshBasicMaterial({
      color: target.hex,
      transparent: true,
      opacity: 0.44,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    var beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 2.1;
    beamMesh.renderOrder = 11;
    beaconGroup.add(beamMesh);
    geos.push(beamGeo);
    mats.push(beamMat);

    var ringGeo = new THREE.RingGeometry(0.55, 0.85, 24);
    ringGeo.rotateX(-Math.PI / 2);
    var ringMat = new THREE.MeshBasicMaterial({
      color: target.hex,
      transparent: true,
      opacity: 0.78,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    var ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.08;
    ringMesh.renderOrder = 11;
    beaconGroup.add(ringMesh);
    geos.push(ringGeo);
    mats.push(ringMat);

    this.scene.add(beaconGroup);

    // 2. Orbiting ground directional chevron arrow around player pointing toward target
    var arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.42);
    arrowShape.lineTo(-0.24, -0.22);
    arrowShape.lineTo(0, -0.06);
    arrowShape.lineTo(0.24, -0.22);
    arrowShape.closePath();
    var arrowGeo = new THREE.ShapeGeometry(arrowShape);
    arrowGeo.rotateX(-Math.PI / 2);
    var arrowMat = new THREE.MeshBasicMaterial({
      color: target.hex,
      transparent: true,
      opacity: 0.88,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    var arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.set(p.x, 0.14, p.z);
    arrowMesh.renderOrder = 12;
    this.scene.add(arrowMesh);
    geos.push(arrowGeo);
    mats.push(arrowMat);

    var dMeters = Math.round(dist2D(p.x, p.z, target.x, target.z));
    this.focusWaypoint = {
      taskKey: key,
      x: target.x,
      z: target.z,
      label: target.label,
      color: target.color,
      ref: target.ref,
      ttl: 7.5,
      maxTtl: 7.5,
      beaconGroup: beaconGroup,
      beamMesh: beamMesh,
      beamMat: beamMat,
      ringMesh: ringMesh,
      ringMat: ringMat,
      arrowMesh: arrowMesh,
      arrowMat: arrowMat,
      geos: geos,
      mats: mats
    };

    this.updateFocusWaypoint(0);
    playSfxSafe('waypoint_ping');
    this.spawnFloatingText(p.x, 2.35, p.z, '指引 · ' + target.label + ' (' + dMeters + 'm)', target.color);
    this.emitHudSnapshot();
    return { label: target.label, dist: dMeters, color: target.color };
  };

  EngineSession.prototype.updateFocusWaypoint = function (realDt) {
    var fw = this.focusWaypoint;
    if (!fw || !this.player) return;

    if (fw.ref) {
      if (fw.ref.alive === false) {
        this.clearFocusWaypoint();
        return;
      }
      fw.x = fw.ref.x;
      fw.z = fw.ref.z;
    }

    fw.ttl -= realDt;
    var p = this.player;
    var dx = fw.x - p.x;
    var dz = fw.z - p.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (fw.ttl <= 0 || (dist <= 2.2 && !fw.ref && realDt > 0)) {
      this.clearFocusWaypoint();
      return;
    }

    var fade = fw.ttl < 1.2 ? clamp(fw.ttl / 1.2, 0, 1) : 1;
    var pulse = 0.5 + 0.5 * Math.sin(this.elapsedReal * 7.5);

    fw.beaconGroup.position.set(fw.x, 0, fw.z);
    fw.beamMesh.rotation.y += realDt * 2.4;
    fw.beamMat.opacity = (0.28 + pulse * 0.26) * fade;

    var ringScale = 0.85 + pulse * 0.55;
    fw.ringMesh.scale.set(ringScale, 1, ringScale);
    fw.ringMat.opacity = (0.85 - pulse * 0.42) * fade;

    if (dist > 1.8) {
      var nx = dx / dist;
      var nz = dz / dist;
      var orbitR = 1.42 + pulse * 0.14;
      fw.arrowMesh.visible = true;
      fw.arrowMesh.position.set(p.x + nx * orbitR, 0.14, p.z + nz * orbitR);
      // Shape tip points along -Z after rotateX(-PI/2), so align rotation.y with atan2(-dx, -dz)
      fw.arrowMesh.rotation.y = Math.atan2(-dx, -dz);
      fw.arrowMat.opacity = (0.65 + pulse * 0.3) * fade;
    } else {
      fw.arrowMesh.visible = false;
    }
  };

  // ---------------------------------------------------------------------------
  // Projectiles & EMP / Decoy Arc Projectiles
  // ---------------------------------------------------------------------------
  EngineSession.prototype.spawnProjectile = function (cfg) {
    var THREE = this.THREE;
    var group = new THREE.Group();
    var r = cfg.radius || 0.24;
    var col = cfg.color || 0x6fd8ea;
    var sec = cfg.secondaryColor || 0xffffff;

    // Bright core + elongated comet tail along velocity vector
    var coreGeo = new THREE.SphereGeometry(r * 0.72, 8, 8);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    var tailGeo = new THREE.ConeGeometry(r * 0.85, r * 4.4, 7);
    tailGeo.rotateX(-Math.PI / 2);
    tailGeo.translate(0, 0, -r * 2.0);
    var tailMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(tailGeo, tailMat));

    group.position.set(cfg.x, 1.05, cfg.z);
    group.rotation.y = Math.atan2(cfg.vx || 0, cfg.vz || 1);
    this.scene.add(group);

    this.projectiles.push({
      mode: 'linear',
      owner: cfg.owner,
      x: cfg.x,
      z: cfg.z,
      vx: cfg.vx,
      vz: cfg.vz,
      damage: cfg.damage || 10,
      knockback: cfg.knockback || 1.5,
      radius: r,
      ttl: cfg.ttl || 0.9,
      color: col,
      secondaryColor: sec,
      vfxProfile: cfg.vfxProfile || null,
      mesh: group,
      geos: [coreGeo, tailGeo],
      mats: [coreMat, tailMat]
    });
  };

  EngineSession.prototype.spawnArcProjectile = function (cfg) {
    var THREE = this.THREE;
    var geo = new THREE.OctahedronGeometry(0.26, 0);
    var mat = new THREE.MeshBasicMaterial({ color: cfg.color || 0x4de8ff });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cfg.sx, 1.2, cfg.sz);
    this.scene.add(mesh);

    this.projectiles.push({
      mode: 'arc',
      kind: cfg.kind,
      sx: cfg.sx,
      sz: cfg.sz,
      tx: cfg.tx,
      tz: cfg.tz,
      elapsed: 0,
      duration: cfg.duration || 0.32,
      radius: cfg.radius || 4.8,
      power: cfg.power || 24,
      stunSec: cfg.stunSec || 3.5,
      flareDuration: cfg.flareDuration || 8.0,
      color: cfg.color || 0x4de8ff,
      vfxProfile: cfg.vfxProfile || null,
      trailCd: 0,
      mesh: mesh,
      geos: [geo],
      mats: [mat]
    });
  };

  EngineSession.prototype.updateProjectiles = function (simDt) {
    var ins = this.inspector;
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var pr = this.projectiles[i];
      var remove = false;

      if (pr.mode === 'arc') {
        pr.elapsed += simDt;
        var t = clamp(pr.elapsed / pr.duration, 0, 1);
        var cx = lerp(pr.sx, pr.tx, t);
        var cz = lerp(pr.sz, pr.tz, t);
        var cy = 1.1 * (1 - t) + Math.sin(t * Math.PI) * 2.6 + 0.2;
        pr.mesh.position.set(cx, cy, cz);
        pr.mesh.rotation.y += simDt * 9;
        pr.mesh.rotation.x += simDt * 6;
        pr.trailCd = (pr.trailCd || 0) - simDt;
        if (pr.trailCd <= 0) {
          pr.trailCd = 0.045;
          this.spawnSparkBurst(cx, cy, cz, pr.color, 3);
        }

        if (t >= 1) {
          if (pr.kind === 'emp') {
            this.detonateEmp(pr.tx, pr.tz, pr.radius, pr.power, pr.stunSec, pr.color, pr.vfxProfile);
          } else if (pr.kind === 'decoy') {
            this.spawnDecoyFlare(pr.tx, pr.tz, pr.flareDuration, pr.color, pr.vfxProfile);
          }
          remove = true;
        }
      } else {
        pr.ttl -= simDt;
        pr.x += pr.vx * simDt;
        pr.z += pr.vz * simDt;
        pr.mesh.position.set(pr.x, 1.05, pr.z);

        // Wall hit check
        if (!this.mapApi.isWalkable(Math.floor(pr.x), Math.floor(pr.z))) {
          this.spawnSparkBurst(pr.x, 1.0, pr.z, pr.color, 7);
          remove = true;
        } else {
          // Destructible cover hit check
          var hitCov = null;
          if (this.destructibleCovers && this.destructibleCovers.length) {
            for (var ci = 0; ci < this.destructibleCovers.length; ci++) {
              var cov = this.destructibleCovers[ci];
              if (!cov || cov.destroyed) continue;
              if (dist2D(pr.x, pr.z, cov.x, cov.z) <= (cov.radius || 0.72) + (pr.radius || 0.24)) {
                hitCov = cov;
                break;
              }
            }
          }
          if (hitCov) {
            var pvLen = Math.max(0.01, Math.sqrt(pr.vx * pr.vx + pr.vz * pr.vz));
            this.damageDestructibleCover(hitCov, Math.max(20, pr.damage || 22), pr.vx / pvLen, pr.vz / pvLen, 'projectile');
            remove = true;
          } else if (ins.alive && dist2D(pr.x, pr.z, ins.x, ins.z) <= ins.radius + pr.radius + 0.22) {
            var vLen = Math.max(0.01, Math.sqrt(pr.vx * pr.vx + pr.vz * pr.vz));
            this.damageInspector(pr.damage, (pr.vx / vLen) * pr.knockback, (pr.vz / vLen) * pr.knockback, false, {
              impactColor: pr.color
            });
            this.spawnSparkBurst(pr.x, 1.1, pr.z, pr.secondaryColor || pr.color, 10);
            remove = true;
          } else if (pr.ttl <= 0) {
            remove = true;
          }
        }
      }

      if (remove) {
        this.scene.remove(pr.mesh);
        if (pr.geos) pr.geos.forEach(disposeOwned);
        else if (pr.geo) disposeOwned(pr.geo);
        if (pr.mats) pr.mats.forEach(disposeOwned);
        else if (pr.mat) disposeOwned(pr.mat);
        this.projectiles.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.detonateEmp = function (x, z, radius, power, stunSec, colorHex, vfx) {
    var mainCol = colorHex || 0x4de8ff;
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnEmpBlastVfx === 'function') {
      INFINITY.VfxStudio.spawnEmpBlastVfx(this, x, z, radius, mainCol, vfx);
    }
    this.addCameraShake(0.34, 0.24);
    this.emitSoundRipple(x, z, 70, 'emp');
    this.empBlackoutTimer = 3.5;
    this.empBlackoutPos.x = x;
    this.empBlackoutPos.z = z;
    this.empSparkAccum = 0;
    this.glitchAmount = Math.max(this.glitchAmount, 0.5);
    playSfxSafe('emp_boom');

    // Stun Inspector if in radius + snap direct lightning arc onto Inspector & shatter Rule Armor!
    var ins = this.inspector;
    if (ins.alive && dist2D(x, z, ins.x, ins.z) <= radius + ins.radius) {
      var effectiveStun = (ins.stunImmuneTimer || 0) > 0 ? Math.min(1.2, stunSec * 0.4) : stunSec;
      ins.stunTimer = Math.max(ins.stunTimer, effectiveStun);
      ins.armorBrokenTimer = Math.max(ins.armorBrokenTimer || 0, BOSS_DEATH_EXAM_CONFIG.armorBreakDuration);
      ins.lungeTelegraph = 0;
      ins.lungeWindup = 0;
      ins.lungeActive = 0;
      ins.cleaveTelegraph = 0;
      ins.gazeTelegraph = 0;
      ins.slamTelegraph = 0;
      ins.blinkTelegraph = 0;
      ins.pendingWeakpoint = null;
      ins.teleMesh.visible = false;
      ins.teleFill.visible = false;
      if (ins.cleaveMesh) ins.cleaveMesh.visible = false;
      if (ins.gazeBeam) ins.gazeBeam.visible = false;
      if (ins.slamRing) ins.slamRing.visible = false;
      if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
      this.spawnLightningBolt(x, 1.1, z, ins.x, 1.45, ins.z, 0xffffff, 0.42, 7);
      this.spawnImpactStar(ins.x, 1.45, ins.z, mainCol, 2.5, 0.30);
      this.damageInspector(power, 0, 0, true, { impactColor: mainCol, ignoreRuleArmor: true });
      if (ins.alive) {
        this.exposeInspectorWeakpoint('emp_shatter', 4.5);
      }
      this.spawnFloatingText(ins.x, 2.8, ins.z, 'EMP破甲瘫痪 ' + effectiveStun.toFixed(1) + 's!', (vfx && vfx.primaryColor) || '#4de8ff');
      this.recordMissionEvent(
        'branch',
        'EMP 电磁瘫痪零号检票员',
        '成功干扰其胸口对讲机频段，击碎规则护甲并使其陷入 ' + effectiveStun.toFixed(1) + ' 秒感知僵直。',
        { branchId: 'inspector_hunt' }
      );
    }

    // EMP shockwave also shatters nearby destructible covers
    this.damageDestructibleCoversInRadius(x, z, radius + 0.6, Math.max(40, power || 40));

    // Cancel active fake broadcasts!
    if (this.activeFakeBroadcastTimer > 0) {
      this.activeFakeBroadcastTimer = 0;
      this.stats.fakeBroadcastsCancelled += 1;
      this.spawnFloatingText(x, 2.2, z, '43.2Hz 假播报已切断!', '#4de8ff');
      this.emitRadio({
        type: 'system',
        text: '【电磁阻断成功】EMP 脉冲烧毁了正在传播的 43.2Hz 拟态假播报信号！全员理智稳固。'
      });
      this.player.sanity = Math.min(this.player.maxSanity, this.player.sanity + 10);
      this.setBranchState('fake_broadcast', 'completed', 'EMP 脉冲硬性切断 43.2Hz 拟态假播报（累计拦截 ' + this.stats.fakeBroadcastsCancelled + ' 次）。', 100);
      this.recordMissionEvent(
        'branch',
        '分支反制 · 切断 43.2Hz 假播报',
        'EMP 脉冲烧毁站台拟态信号，全员理智恢复 +10。',
        { branchId: 'fake_broadcast' }
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Interactables & Track Override Logic (`E` / triggerInteract)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.updateInteractables = function (simDt) {
    var p = this.player;
    var best = null;
    var bestDist = INTERACT_RANGE;
    var exitUnlocked = (this.overridePct >= 100 || !this.inspector.alive);

    var COL_PENDING  = semanticInt('interactInt', 0x5ce8c8);  // #5ce8c8 cyan
    var COL_ACTIVE   = semanticInt('parryGoldInt', 0xffd86b); // #ffd86b gold (in-progress)
    var COL_DONE     = semanticInt('healInt', 0x3fe69b);      // #3fe69b emerald (completed)
    var COL_WARNING  = semanticInt('warningInt', 0xffaa3b);   // #ffaa3b amber (exit locked)
    var COL_EXIT_RDY = 0xf3f6ff;                              // #f3f6ff platinum (exit ready)

    for (var i = 0; i < this.interactables.length; i++) {
      var it = this.interactables[i];
      it.bobPhase += simDt * 2.8;
      var statusHex = COL_PENDING;
      var pulseSpeed = 1.6;
      var pulseBaseScale = it.type === 'exit' ? 1.85 : 1.0;

      if (it.type === 'clue') {
        var baseY = it.spriteBaseY !== undefined ? it.spriteBaseY : 0.78;
        var bobAmp = it.spriteBobAmp !== undefined ? it.spriteBobAmp : 0.12;
        var baseRingOp = it.ringBaseOpacity !== undefined ? it.ringBaseOpacity : 0.38;
        it.sprite.position.y = baseY + Math.sin(it.bobPhase) * bobAmp;
        it.ring.rotation.z += simDt * 0.85;
        statusHex = it.done ? COL_DONE : (it.id === 'int_clue_concourse' ? 0xdcb46a : COL_PENDING);
        it.ringMat.color.setHex(statusHex);
        if (it.done) {
          it.mat.opacity = 0.16;
          it.ringMat.opacity = 0.08;
        } else {
          it.ringMat.opacity = baseRingOp + Math.sin(this.elapsedReal * 3.4 + i) * (baseRingOp * 0.25);
        }
        if (it.beaconMat && it.id === 'int_clue_concourse') {
          var sparkOn = !it.done && Math.sin(this.elapsedReal * 23.0) > -0.45;
          it.beaconMat.color.setHex(sparkOn ? 0xffa838 : 0x26180d);
        }
      } else if (it.type === 'console') {
        it.ring.rotation.z += simDt * (it.done ? 0.5 : 1.5);
        var inProg = !it.done && ((it.progress || 0) > 0 || this.activeChannelConsole === it);
        statusHex = it.done ? COL_DONE : (inProg ? COL_ACTIVE : COL_PENDING);
        pulseSpeed = inProg ? 3.2 : 1.8;
        it.ringMat.color.setHex(statusHex);
        it.ringMat.opacity = it.done ? 0.28 : (inProg ? 0.68 : 0.46);
        if (it.beaconMat) it.beaconMat.color.setHex(statusHex);
      } else if (it.type === 'exit') {
        it.ring.rotation.z += simDt * (exitUnlocked ? 2.4 : 0.7);
        statusHex = exitUnlocked ? COL_EXIT_RDY : (this.trainInStation ? COL_ACTIVE : COL_WARNING);
        pulseSpeed = exitUnlocked ? 2.8 : 1.2;
        it.ringMat.color.setHex(statusHex);
        it.ringMat.opacity = exitUnlocked ? (0.58 + Math.sin(this.elapsedReal * 6) * 0.16) : 0.36;
        if (it.mat && it.mat.color) {
          it.mat.color.setHex(statusHex);
          it.mat.opacity = exitUnlocked ? (0.56 + Math.sin(this.elapsedReal * 4) * 0.12) : 0.30;
        }
      } else if (it.type === 'destructible_cover') {
        it.ring.rotation.z += simDt * (it.destroyed ? 0.35 : 0.9);
        if (it.hitShake > 0) {
          it.hitShake = Math.max(0, it.hitShake - simDt * 4.5);
          if (it.intactGroup) {
            it.intactGroup.position.x = (Math.sin(this.elapsedReal * 65) * 0.09) * it.hitShake;
            it.intactGroup.position.z = (Math.cos(this.elapsedReal * 58) * 0.07) * it.hitShake;
          }
        } else if (it.intactGroup) {
          it.intactGroup.position.x = 0;
          it.intactGroup.position.z = 0;
        }
        if (it.hitFlash > 0) {
          it.hitFlash = Math.max(0, it.hitFlash - simDt * 5.0);
        }
        var damagedRatio = it.maxHp > 0 ? (it.hp / it.maxHp) : 0;
        statusHex = it.destroyed ? COL_DONE : (damagedRatio <= 0.5 ? 0xff6b35 : COL_WARNING);
        it.ringMat.color.setHex(statusHex);
        it.ringMat.opacity = it.destroyed ? 0.14 : (0.34 + Math.sin(this.elapsedReal * 3.8 + i) * 0.08);
        if (it.fractureMat) {
          it.fractureMat.color.setHex(it.hitFlash > 0.05 ? 0xffffff : (damagedRatio <= 0.5 ? 0xff5a2c : 0xffa838));
          it.fractureMat.opacity = it.destroyed ? 0 : (damagedRatio <= 0.5 ? 0.96 : 0.68);
        }
      } else if (it.type === 'scene_trigger') {
        it.ring.rotation.z += simDt * (it.done ? 0.45 : 1.5);
        var baseTrHex = it.triggerEffect === 'acoustic_lure' ? COL_WARNING : (it.triggerEffect === 'arc_surge' ? 0x6fa8ff : COL_PENDING);
        statusHex = it.done ? COL_DONE : baseTrHex;
        pulseSpeed = it.done ? 0.6 : 1.9;
        it.ringMat.color.setHex(statusHex);
        it.ringMat.opacity = it.done ? 0.22 : (0.42 + Math.sin(this.elapsedReal * 4.0 + i) * 0.10);
        if (it.beaconMat) it.beaconMat.color.setHex(statusHex);
        if (it.animPart) {
          if (it.triggerEffect === 'vent_purge') {
            it.animPart.rotation.z += simDt * (it.done ? 5.2 : 0.55);
          } else if (it.triggerEffect === 'sonar_relay') {
            it.animPart.rotation.y += simDt * (it.done ? 4.4 : 1.4);
          }
        }
      }

      if (it.pulseRing && it.pulseMat) {
        if (it.done && it.type !== 'exit') {
          it.pulseRing.visible = false;
        } else {
          it.pulseRing.visible = true;
          var ph = (this.elapsedReal * pulseSpeed * 0.45 + i * 0.27) % 1.0;
          var pSc = pulseBaseScale * (1.0 + ph * 0.65);
          it.pulseRing.scale.set(pSc, 1, pSc);
          it.pulseMat.color.setHex(statusHex);
          it.pulseMat.opacity = (1.0 - ph) * (exitUnlocked && it.type === 'exit' ? 0.40 : 0.24);
        }
      }

      var d = dist2D(p.x, p.z, it.x, it.z);
      var rangeLim = it.type === 'destructible_cover' ? (bestDist + 0.35) : bestDist;
      if (d <= rangeLim) {
        if (it.type === 'exit' || !it.done) {
          bestDist = Math.min(bestDist, d);
          best = it;
        }
      }
    }

    this.nearbyInteractable = best;

    // Auto-channeling active console while player stays within range
    if (this.activeChannelConsole) {
      var c = this.activeChannelConsole;
      if (c.done || dist2D(p.x, p.z, c.x, c.z) > INTERACT_RANGE + 0.4) {
        this.activeChannelConsole = null;
      } else {
        this.advanceConsole(c, 40 * simDt, 'player');
      }
    }
  };

  EngineSession.prototype.advanceConsole = function (consoleObj, deltaPct, actorTag) {
    if (!consoleObj || consoleObj.done) return;
    if (actorTag === 'player' && this.player) {
      this.player.channelTimer = 0.22;
    } else if (actorTag && this.squadById && this.squadById[actorTag]) {
      this.squadById[actorTag].channelTimer = 0.25;
    }
    var prev = consoleObj.progress;
    consoleObj.progress = clamp(consoleObj.progress + deltaPct, 0, 100);

    // Emit visible sound wave rings at 25/55/85% while hacking
    if (
      (prev < 25 && consoleObj.progress >= 25) ||
      (prev < 55 && consoleObj.progress >= 55) ||
      (prev < 85 && consoleObj.progress >= 85)
    ) {
      this.emitSoundRipple(consoleObj.x, consoleObj.z, actorTag === 'xutan' ? 42 : 70, 'console');
      this.spawnSparkBurst(consoleObj.x, 1.1, consoleObj.z, 0xf2a944, 8);
      if (actorTag === 'player') playSfxSafe('ui_click');
    }

    var startFlagKey = 'console_started_' + consoleObj.id;
    if (prev <= 0 && consoleObj.progress > 0 && !this.missionFlags[startFlagKey]) {
      this.missionFlags[startFlagKey] = true;
      var actorName = actorTag === 'xutan' ? '许檀' : (actorTag === 'yanci' ? '严辞' : '受试者');
      this.setBranchState('track_override', 'active', actorName + '已接入「' + consoleObj.label + '」，正在执行极性改写。', Math.max(this.overridePct, 10));
      this.recordMissionEvent(
        'progress',
        '启动轨控改写 · ' + consoleObj.label,
        actorName + '开始操作控制台，高分贝继电器声波可能吸引检票员注意。',
        { branchId: 'track_override', zoneId: consoleObj.zoneId }
      );
    }

    if (consoleObj.progress >= 100 && !consoleObj.done) {
      consoleObj.done = true;
      if (this.activeChannelConsole === consoleObj) this.activeChannelConsole = null;

      var onTex = this.getPropTex('console_on', '#4af2a1');
      consoleObj.mat.map = onTex;
      consoleObj.mat.emissiveMap = onTex;
      consoleObj.mat.needsUpdate = true;
      consoleObj.ringMat.color.setHex(0x4af2a1);

      this.overridePct = clamp(this.overridePct + (consoleObj.overrideValue || 50), 0, 100);
      this.spawnShockRing(consoleObj.x, consoleObj.z, 4.5, 0x4af2a1, 0.65);
      this.emitSoundRipple(consoleObj.x, consoleObj.z, 84, 'console_done');
      this.addCameraShake(0.24, 0.25);
      playSfxSafe('fusion');
      this.spawnFloatingText(consoleObj.x, 2.3, consoleObj.z, '联锁反转完成! ' + this.overridePct + '%', '#4af2a1');

      if (this.overridePct >= 100) {
        this.setBranchState('track_override', 'completed', '调度室与变电间双端联锁 100% 完成，0 号站台应急撤离闸门已解锁（S级真破局就绪）。', 100);
        this.recordMissionEvent(
          'branch',
          '主线达成 · 逆轨出环 100%',
          '「' + consoleObj.label + '」完成最终合闸！0 号站台应急闸门解锁，前往 0 号站台按 E 即可完美撤离。',
          { branchId: 'track_override', zoneId: consoleObj.zoneId }
        );
        this.emitRadio({
          type: 'system',
          text: '【主轨极性已彻底反转 100%】0号站台应急撤离闸门已解锁！全员立即前往0号站台撤离！'
        });
        this.showSpeechBubble('yanci', '道岔已全部反转！全员向0号站台闸门汇合撤离！');
      } else {
        this.setBranchState('track_override', 'active', '已完成「' + consoleObj.label + '」（进度 ' + this.overridePct + '%），还需完成另一处轨控终端。', this.overridePct);
        this.recordMissionEvent(
          'progress',
          '轨控节点完成 · ' + consoleObj.label + ' (' + this.overridePct + '%)',
          '该区域道岔联锁已锁死，请继续推进另一处轨控终端（调度室 / 变电间）。',
          { branchId: 'track_override', zoneId: consoleObj.zoneId }
        );
        this.emitRadio({
          type: 'narration',
          text: '【道岔联锁进度 ' + this.overridePct + '%】' + consoleObj.label + '已完成反转，继电器电弧声回荡在隧道中！'
        });
      }
    }
  };

  EngineSession.prototype.triggerInteract = function () {
    if (!this.mounted || this.ended) return false;
    var it = this.nearbyInteractable;
    if (!it) return false;

    this.player.actionTimer = 0.28;

    if (it.type === 'clue' && !it.done) {
      it.done = true;
      it.progress = 100;
      var cid = it.clueId || it.id;
      if (this.discoveredClueIds.indexOf(cid) === -1) {
        this.discoveredClueIds.push(cid);
      }
      this.stats.cluesFound = this.discoveredClueIds.length;
      this.player.sanity = Math.min(this.player.maxSanity, this.player.sanity + 6);
      this.spawnShockRing(it.x, it.z, 2.4, 0x6fd8ea, 0.45);
      playSfxSafe('vortex_buy');

      var meta = findClueMeta(cid);
      var title = (meta && meta.title) || it.label;
      var summary = (meta && meta.summary) || '已回收关键考场物证。';
      this.spawnFloatingText(it.x, 2.1, it.z, '发现线索: ' + title, '#6fd8ea');
      this.recordMissionEvent(
        'clue',
        '破译线索 · ' + title + ' (' + this.discoveredClueIds.length + '/6)',
        summary,
        { zoneId: it.zoneId, branchId: cid === 'clue_shenyan_ledger' ? 'shenyan_secret' : null }
      );
      if (cid === 'clue_shenyan_ledger') {
        this.setBranchState('shenyan_secret', 'triggered', '在废弃应急通道查获沈砚的失窃票夹：其持有伪造车票，意图诱导陌生考生越线抵扣历史罚分！', 100);
        this.recordMissionEvent(
          'branch',
          '隐藏暗线曝光 · 沈砚伪造车票',
          '已掌握沈砚背刺动机！切勿听信其关于 0 号站台直接登车的诱导。',
          { branchId: 'shenyan_secret', zoneId: it.zoneId }
        );
      }
      this.emitRadio({
        type: 'narration',
        text: '【发现线索 · ' + title + '】' + summary
      });
      return true;
    }

    if (it.type === 'console' && !it.done) {
      this.activeChannelConsole = it;
      this.advanceConsole(it, 28, 'player');
      this.spawnFloatingText(it.x, 2.0, it.z, '正在反转道岔 ' + Math.round(it.progress) + '%', '#f2a944');
      return true;
    }

    if (it.type === 'exit') {
      if (this.overridePct >= 100) {
        playSfxSafe('fusion');
        this.finishExam('perfect_override');
        return true;
      }
      if (!this.inspector.alive) {
        playSfxSafe('fusion');
        this.finishExam('kill_inspector');
        return true;
      }
      if (this.trainInStation) {
        if (this.exitWarnTimer > 0) {
          playSfxSafe('broadcast_static');
          this.finishExam('forced_board_survive');
          return true;
        }
        this.exitWarnTimer = 3.5;
        this.setBranchState('ghost_train', 'warning', '未反转道岔时靠近停靠列车触发「强行登车 (B级)」确认分支，再次按 E 将立即撤离。', 80);
        this.recordMissionEvent(
          'branch',
          '分支抉择 · 强行登车警告',
          '道岔联锁尚未完成！再次按 E 可冒险强行登车（B级次优结局），或返回完成调度室与变电间反转。',
          { branchId: 'ghost_train', zoneId: 'platform0' }
        );
        this.showSpeechBubble('player', '道岔尚未反转！再按一次 [E] 强行登车撤离！');
        this.emitRadio({
          type: 'system',
          text: '【警告】零号列车正在停靠但道岔未反转！再次按 [E] 可冒险强行登车（次优结局），或继续完成调度室与变电间联锁！'
        });
        return true;
      }
      this.spawnFloatingText(it.x, 2.2, it.z, '道岔进度 ' + this.overridePct + '% / 100%', '#e85d4a');
      this.showSpeechBubble('player', '闸门锁死！还需完成信号调度室与旧变电间的道岔反转。');
      return true;
    }

    if (it.type === 'destructible_cover' && !it.destroyed) {
      var bdx = it.x - this.player.x;
      var bdz = it.z - this.player.z;
      var bl = Math.max(0.01, Math.sqrt(bdx * bdx + bdz * bdz));
      this.damageDestructibleCover(it, 35, bdx / bl, bdz / bl, 'breach');
      return true;
    }

    if (it.type === 'scene_trigger' && !it.done) {
      this.activateSceneTrigger(it);
      return true;
    }

    return false;
  };

  EngineSession.prototype.discoverEnvironmentClue = function (clueSpec, sourceType, worldX, worldZ) {
    if (!clueSpec || !clueSpec.id) return null;
    if (this.environmentCluesById[clueSpec.id]) return this.environmentCluesById[clueSpec.id];

    var entry = {
      id: clueSpec.id,
      title: clueSpec.title || '环境物证线索',
      tag: clueSpec.tag || (sourceType === 'destructible_cover' ? '掩体破拆' : '场景触发器'),
      zoneId: clueSpec.zoneId || (this.mapApi ? this.mapApi.getZoneAt(worldX, worldZ) : 'concourse'),
      zoneCode: clueSpec.zoneCode || 'Z-01',
      summary: clueSpec.summary || '发现与零号回廊结构相关的隐藏环境线索。',
      effectText: clueSpec.effectText || '',
      sourceType: sourceType || 'scene_trigger',
      discoveredAt: Math.floor(this.stats.elapsedSec || 0)
    };
    this.environmentCluesById[entry.id] = entry;
    this.environmentClues.push(entry);
    this.latestEnvironmentClue = entry;

    var totalEnv = (this.destructibleCovers ? this.destructibleCovers.length : 0) + (this.sceneTriggers ? this.sceneTriggers.length : 0);
    this.recordMissionEvent(
      'clue',
      entry.tag + ' · ' + entry.title + ' (' + this.environmentClues.length + '/' + Math.max(1, totalEnv) + ')',
      entry.summary + (entry.effectText ? (' [' + entry.effectText + ']') : ''),
      { zoneId: entry.zoneId }
    );
    this.emitRadio({
      type: 'narration',
      text: '【环境线索 · ' + entry.title + '】' + entry.summary
    });
    if (typeof worldX === 'number' && typeof worldZ === 'number') {
      this.spawnFloatingText(worldX, 2.25, worldZ, '环境线索: ' + entry.title, '#5ce8c8');
    }
    this.emitHudSnapshot();
    return entry;
  };

  EngineSession.prototype.damageDestructibleCover = function (cover, amount, hitDirX, hitDirZ, sourceTag) {
    if (!cover || cover.destroyed) return false;
    var dmg = Math.max(1, Math.round(Number(amount) || 20));
    cover.hp = Math.max(0, cover.hp - dmg);
    cover.progress = Math.round((1 - cover.hp / Math.max(1, cover.maxHp)) * 100);
    cover.hitShake = 1.0;
    cover.hitFlash = 1.0;

    this.spawnSparkBurst(cover.x, 0.85, cover.z, 0xffaa3b, cover.hp <= 0 ? 18 : 8);
    this.emitSoundRipple(cover.x, cover.z, cover.hp <= 0 ? 48 : 26, 'cover_hit');
    playSfxSafe(cover.hp <= 0 ? 'emp_boom' : 'sword_slash');

    if (cover.hp > 0) {
      if (cover.hp <= cover.maxHp * 0.5 && cover.intactGroup) {
        cover.intactGroup.rotation.z = 0.08 * (hitDirX >= 0 ? -1 : 1);
      }
      this.spawnFloatingText(cover.x, 1.85, cover.z, '-' + dmg + ' 掩体耐久 ' + cover.hp + '/' + cover.maxHp, '#ffba52');
      this.addCameraShake(0.10, 0.12);
      this.emitHudSnapshot();
      return true;
    }

    // Cover shattered into walkable rubble
    cover.destroyed = true;
    cover.done = true;
    cover.progress = 100;
    if (cover.intactGroup) cover.intactGroup.visible = false;
    if (cover.rubbleGroup) cover.rubbleGroup.visible = true;
    this.stats.coversDestroyed = (this.stats.coversDestroyed || 0) + 1;
    this.hitStopTimer = Math.max(this.hitStopTimer || 0, 0.035);
    this.addCameraShake(0.22, 0.18);
    this.spawnShockRing(cover.x, cover.z, 2.6, 0xffaa3b, 0.45);
    this.spawnFloatingText(cover.x, 1.9, cover.z, '掩体击碎!', '#ffaa3b');

    // Minor tactical recovery from crate supplies / breather opening
    if (this.player) {
      if (cover.kind === 'crate_barricade') {
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 8);
      } else {
        this.player.sanity = Math.min(this.player.maxSanity, this.player.sanity + 4);
      }
    }

    if (cover.envClue) {
      this.discoverEnvironmentClue(cover.envClue, 'destructible_cover', cover.x, cover.z);
    } else {
      this.emitHudSnapshot();
    }
    return true;
  };

  EngineSession.prototype.damageDestructibleCoversInArc = function (ox, oz, dx, dz, maxDist, minDot, dmg) {
    var covers = this.destructibleCovers;
    if (!covers || !covers.length) return 0;
    var hits = 0;
    for (var i = 0; i < covers.length; i++) {
      var c = covers[i];
      if (!c || c.destroyed) continue;
      if (this.isPointInArc(ox, oz, dx, dz, c.x, c.z, maxDist + (c.radius || 0.72), minDot)) {
        if (this.damageDestructibleCover(c, dmg, dx, dz, 'melee')) hits++;
      }
    }
    return hits;
  };

  EngineSession.prototype.damageDestructibleCoversInRadius = function (x, z, radius, dmg) {
    var covers = this.destructibleCovers;
    if (!covers || !covers.length) return 0;
    var hits = 0;
    for (var i = 0; i < covers.length; i++) {
      var c = covers[i];
      if (!c || c.destroyed) continue;
      var d = dist2D(x, z, c.x, c.z);
      if (d <= radius + (c.radius || 0.72)) {
        var nx = d > 0.01 ? (c.x - x) / d : 1;
        var nz = d > 0.01 ? (c.z - z) / d : 0;
        if (this.damageDestructibleCover(c, dmg, nx, nz, 'aoe')) hits++;
      }
    }
    return hits;
  };

  EngineSession.prototype.activateSceneTrigger = function (trig) {
    if (!trig || trig.done) return false;
    trig.done = true;
    trig.progress = 100;
    this.stats.triggersActivated = (this.stats.triggersActivated || 0) + 1;

    if (trig.animPart && (trig.triggerEffect === 'acoustic_lure' || trig.triggerEffect === 'arc_surge')) {
      trig.animPart.rotation.z = 0.52;
      trig.animPart.rotation.x = -0.52;
    }

    var fx = trig.triggerEffect || 'acoustic_lure';
    if (fx === 'acoustic_lure') {
      var lureX = clamp(trig.x + 12, 8, (this.mapApi && this.mapApi.GRID_W ? this.mapApi.GRID_W - 14 : 210));
      var lureZ = clamp(trig.z + 6, 8, (this.mapApi && this.mapApi.GRID_H ? this.mapApi.GRID_H - 12 : 140));
      if (typeof this.spawnDecoyFlare === 'function') {
        this.spawnDecoyFlare(lureX, lureZ, 6.5, 0xffaa3b, null);
      }
      this.emitSoundRipple(lureX, lureZ, 88, 'decoy');
      this.soundLevel = Math.max(4, this.soundLevel - 18);
      if (this.player) this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 10);
      this.spawnShockRing(trig.x, trig.z, 3.8, 0xffaa3b, 0.55);
      playSfxSafe('alert');
    } else if (fx === 'vent_purge') {
      this.soundLevel = Math.max(4, this.soundLevel - 24);
      this.threatLevel = Math.max(6, this.threatLevel - 14);
      if (this.player) {
        this.player.sanity = Math.min(this.player.maxSanity, this.player.sanity + 10);
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 12);
      }
      this.spawnShockRing(trig.x, trig.z, 4.4, 0x5ce8c8, 0.65);
      this.spawnSparkBurst(trig.x, 1.35, trig.z, 0x8ef2ff, 14);
      playSfxSafe('fusion');
    } else if (fx === 'sonar_relay') {
      this.reconRevealTimer = Math.max(this.reconRevealTimer || 0, 8.0);
      if (this.player) this.player.sanity = Math.min(this.player.maxSanity, this.player.sanity + 8);
      this.spawnShockRing(trig.x, trig.z, 6.5, 0x5ce8c8, 0.72);
      this.spawnSparkBurst(trig.x, 1.55, trig.z, 0x5ce8c8, 14);
      playSfxSafe('vortex_buy');
    } else if (fx === 'arc_surge') {
      this.empBlackoutTimer = Math.max(this.empBlackoutTimer || 0, 2.2);
      this.empBlackoutPos.x = trig.x;
      this.empBlackoutPos.z = trig.z;
      if (this.player) this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 14);
      this.spawnShockRing(trig.x, trig.z, 5.2, 0x6fa8ff, 0.62);
      this.spawnSparkBurst(trig.x, 1.45, trig.z, 0x7cb8ff, 16);
      if (this.inspector && this.inspector.alive && dist2D(trig.x, trig.z, this.inspector.x, this.inspector.z) <= 14.5) {
        this.inspector.stunTimer = Math.max(this.inspector.stunTimer || 0, 2.4);
        if (typeof this.spawnLightningBolt === 'function') {
          this.spawnLightningBolt(trig.x, 1.4, trig.z, this.inspector.x, 1.4, this.inspector.z, 0x7cb8ff, 0.42, 6);
        }
        this.damageInspector(18, 0, 0, false, { impactColor: 0x6fa8ff });
      }
      playSfxSafe('emp_boom');
    }

    this.addCameraShake(0.18, 0.18);
    if (trig.envClue) {
      this.discoverEnvironmentClue(trig.envClue, 'scene_trigger', trig.x, trig.z);
    } else {
      this.emitHudSnapshot();
    }
    return true;
  };

  EngineSession.prototype.getDynamicInteractablesSummary = function () {
    return {
      destructiblesTotal: this.destructibleCovers ? this.destructibleCovers.length : 0,
      destructiblesBroken: this.stats.coversDestroyed || 0,
      triggersTotal: this.sceneTriggers ? this.sceneTriggers.length : 0,
      triggersActivated: this.stats.triggersActivated || 0,
      envCluesFound: this.environmentClues ? this.environmentClues.length : 0,
      envClues: this.environmentClues ? this.environmentClues.slice() : []
    };
  };

  // ---------------------------------------------------------------------------
  // Autonomous Living Squad AI (严辞 / 陆烬 / 许檀 / 沈砚)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.applySquadOrders = function (orders) {
    if (!Array.isArray(orders)) return;
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      if (!o || !o.npcId) continue;
      var npc = this.squadById[o.npcId];
      if (!npc || !npc.alive) continue;

      var ord = o.order || 'follow';
      npc.order = ord;
      npc.orderLabel = o.label || ORDER_LABELS[ord] || ord;
      npc.path = [];
      npc.pathIndex = 0;
      npc.repathTimer = 0;
      if (ord === 'hold') {
        npc.holdX = npc.x;
        npc.holdZ = npc.z;
      }

      var bubbleText = o.bubble || this.getOrderAckLine(npc.id, ord);
      if (bubbleText) {
        this.showSpeechBubble(npc.id, bubbleText);
      }

      this.setBranchState('squad_tactics', 'active', '最近指令：' + npc.name + ' → ' + npc.orderLabel, 50);
      this.recordMissionEvent(
        'squad',
        '战术调度 · ' + npc.name + ' → ' + npc.orderLabel,
        '通过加密短波改写队友行动目标：' + npc.orderLabel + '。',
        { branchId: 'squad_tactics' }
      );
    }
  };

  EngineSession.prototype.getOrderAckLine = function (npcId, order) {
    var ack = {
      yanci: {
        follow: '收到，我盯后翼。',
        regroup: '向你靠拢，注意听声波。',
        goto_dispatch: '我去调度室接管道岔。',
        goto_substation: '切去变电间，保持频段畅通。',
        goto_platform0: '推进至0号站台，勿越黄线。',
        goto_concourse: '回撤检票大厅重组。',
        goto_corridor: '进驻换乘长廊控场。',
        hold: '原地架设防线。',
        engage: '压制检票员，抓紧窗口。'
      },
      lujin: {
        follow: '收到，紧跟。',
        regroup: '马上到。',
        goto_dispatch: '我去保调度室。',
        goto_substation: '我去变电间顶着。',
        goto_platform0: '前压0号站台。',
        goto_concourse: '回检票厅。',
        goto_corridor: '我守长廊十字口。',
        hold: '原地顶死。',
        engage: '我正面拖住它，三秒够了！'
      },
      xutan: {
        follow: '收到，跟着你测PKE！',
        regroup: '正在往你坐标靠拢！',
        goto_dispatch: '直奔信号调度室控制台！',
        goto_substation: '去旧变电间合闸，注意掩护！',
        goto_platform0: '前往0号站台汇合！',
        goto_concourse: '退回检票大厅！',
        goto_corridor: '进换乘长廊侦察！',
        hold: '原地静默待命。',
        engage: '用电磁干扰拖慢它！'
      },
      shenyan: {
        follow: '行啊，我就跟在后头。',
        regroup: '这就来，别催。',
        goto_dispatch: '调度室？行，我顺路看看。',
        goto_substation: '变电间我熟，先走一步。',
        goto_platform0: '去0号站台？那可正好。',
        goto_concourse: '退回大厅稳妥些。',
        goto_corridor: '长廊见。',
        hold: '我就站这儿不动。',
        engage: '让我去招惹检票员？行吧，兜个圈。'
      }
    };
    return (ack[npcId] && ack[npcId][order]) || '收到战术指令。';
  };

  function pickSafestNonConcourseZone(mapApi, threatX, threatZ) {
    var candidates = ['tunnel', 'substation', 'dispatch', 'corridor'];
    var bestZone = 'tunnel';
    var bestDist = -1;
    for (var i = 0; i < candidates.length; i++) {
      var zc = mapApi.getZoneCenter(candidates[i]);
      if (!zc) continue;
      var d = dist2D(zc.x, zc.z, threatX, threatZ);
      if (d > bestDist) {
        bestDist = d;
        bestZone = candidates[i];
      }
    }
    return mapApi.getZoneCenter(bestZone) || { x: 122.5, z: 124.5 };
  }

  function resolveAutonomousNpcGoal(npc, ctx) {
    var p = ctx.player;
    var ins = ctx.inspector;
    var mapApi = ctx.mapApi;
    var interactables = ctx.interactables || [];
    var squadById = ctx.squadById || {};

    // Explicit player radio order always overrides autonomous routine
    if (npc.order && npc.order !== 'auto') {
      if (npc.order === 'follow' || npc.order === 'regroup') {
        return { x: p.x, z: p.z, stopDist: 2.0, explicitOrder: true };
      }
      if (npc.order === 'hold') {
        return { x: npc.holdX, z: npc.holdZ, stopDist: 0.45, explicitOrder: true };
      }
      if (npc.order === 'engage') {
        if (ins && ins.alive) return { x: ins.x, z: ins.z, stopDist: npc.id === 'lujin' ? 2.1 : 5.2, explicitOrder: true };
        return { x: npc.x, z: npc.z, stopDist: 1.0, explicitOrder: true };
      }
      if (npc.order.indexOf('goto_') === 0) {
        var zoneId = npc.order.slice(5);
        for (var ci = 0; ci < interactables.length; ci++) {
          var obj = interactables[ci];
          if (obj.type === 'console' && obj.zoneId === zoneId && !obj.done) {
            return { x: obj.x, z: obj.z, stopDist: 1.5, workConsole: obj, explicitOrder: true };
          }
        }
        var zc = mapApi.getZoneCenter(zoneId);
        return { x: zc.x, z: zc.z, stopDist: 1.6, explicitOrder: true };
      }
    }

    var route = NPC_PATROL_ROUTES[npc.id] || [];
    var rIdx = route.length > 0 ? ((npc.roamIndex || 0) % route.length) : 0;
    var wp = route[rIdx] || { x: 122.5, z: 74.5, dwell: 5.5, task: 'patrol' };

    // 1. Xu Tan — independent console hacker; evades to safest non-concourse room when Inspector closes in
    if (npc.id === 'xutan') {
      var dInsX = (ins && ins.alive) ? dist2D(npc.x, npc.z, ins.x, ins.z) : 99;
      if (dInsX < 9.5) {
        var safeEvade = pickSafestNonConcourseZone(mapApi, ins.x, ins.z);
        return { x: safeEvade.x, z: safeEvade.z, stopDist: 1.8, evading: true };
      }
      var dispCon = null;
      for (var xi = 0; xi < interactables.length; xi++) {
        if (interactables[xi].type === 'console' && !interactables[xi].done && interactables[xi].zoneId === 'dispatch') {
          dispCon = interactables[xi];
          break;
        }
      }
      if (!dispCon) {
        for (var xj = 0; xj < interactables.length; xj++) {
          if (interactables[xj].type === 'console' && !interactables[xj].done && interactables[xj].zoneId === 'substation') {
            dispCon = interactables[xj];
            break;
          }
        }
      }
      if (dispCon) {
        return { x: dispCon.x, z: dispCon.z, stopDist: 1.5, workConsole: dispCon };
      }
      return { x: wp.x, z: wp.z, stopDist: 2.0, patrolStop: wp };
    }

    // 2. Lu Jin — independent vanguard sweeping outer corridors & Platform 0, intercepting local threats on sight
    if (npc.id === 'lujin') {
      if (ins && ins.alive) {
        var xutan = squadById.xutan;
        var dInsXu = (xutan && xutan.alive) ? dist2D(ins.x, ins.z, xutan.x, xutan.z) : 99;
        var dInsLu = dist2D(npc.x, npc.z, ins.x, ins.z);
        if (dInsLu < 13.5 || dInsXu < 10.5) {
          return { x: ins.x, z: ins.z, stopDist: 2.1, intercept: true };
        }
      }
      return { x: wp.x, z: wp.z, stopDist: 2.0, patrolStop: wp };
    }

    // 3. Yan Ci — independent multi-sector rule investigator (never follows player or summons player to pick up clues)
    if (npc.id === 'yanci') {
      if (ins && ins.alive && dist2D(npc.x, npc.z, ins.x, ins.z) < 7.5) {
        var ax = npc.x - ins.x;
        var az = npc.z - ins.z;
        var al = Math.max(0.01, Math.sqrt(ax * ax + az * az));
        var safeKite = mapApi.resolveCircleWallCollision(npc.x + (ax / al) * 6.0, npc.z + (az / al) * 6.0, 0.5);
        return { x: safeKite.x, z: safeKite.z, stopDist: 1.0, evading: true };
      }
      return { x: wp.x, z: wp.z, stopDist: 1.8, patrolStop: wp };
    }

    // 4. Shen Yan — solitary opportunist prowling Substation/Tunnel/Platform South; drifts away if player crowds him
    if (npc.id === 'shenyan') {
      if (p && dist2D(npc.x, npc.z, p.x, p.z) < 8.5 && route.length > 1) {
        var nextWp = route[(rIdx + 1) % route.length];
        return { x: nextWp.x, z: nextWp.z, stopDist: 1.8, patrolStop: nextWp, advanceFromPlayer: true };
      }
      return { x: wp.x, z: wp.z, stopDist: 2.0, patrolStop: wp };
    }

    return { x: wp.x, z: wp.z, stopDist: 2.0, patrolStop: wp };
  }

  EngineSession.prototype.getNpcGoal = function (npc) {
    var goal = resolveAutonomousNpcGoal(npc, {
      player: this.player,
      inspector: this.inspector,
      mapApi: this.mapApi,
      interactables: this.interactables,
      squadById: this.squadById
    });
    if (npc.id === 'xutan' && goal.evading && npc.shoutCd <= 0) {
      npc.shoutCd = 18;
      var line = '【加密频段 · 许檀】调度通道出现异常提灯信号，我先绕去下层避开。';
      this.emitRadio({ type: 'dialogue', npcId: 'xutan', speaker: '许檀', text: line });
    }
    if (npc.id === 'shenyan' && goal.advanceFromPlayer) {
      var rLen = (NPC_PATROL_ROUTES.shenyan || []).length || 1;
      npc.roamIndex = ((npc.roamIndex || 0) + 1) % rLen;
      npc.dwellTimer = 2.0;
    }
    return goal;
  };

  EngineSession.prototype.findUnfinishedConsole = function (zoneId) {
    for (var i = 0; i < this.interactables.length; i++) {
      var it = this.interactables[i];
      if (it.type === 'console' && !it.done && (!zoneId || it.zoneId === zoneId)) return it;
    }
    return null;
  };

  EngineSession.prototype.updateSquad = function (simDt) {
    var ins = this.inspector;
    var p = this.player;

    for (var i = 0; i < this.squad.length; i++) {
      var npc = this.squad[i];
      if (!npc.alive) {
        npc.vis.group.visible = false;
        continue;
      }

      if (npc.attackCd > 0) npc.attackCd = Math.max(0, npc.attackCd - simDt);
      if (npc.shoutCd > 0) npc.shoutCd = Math.max(0, npc.shoutCd - simDt);
      if (npc.actionTimer > 0) npc.actionTimer = Math.max(0, npc.actionTimer - simDt);
      if (npc.hitFlash > 0) npc.hitFlash = Math.max(0, npc.hitFlash - simDt);
      if (npc.sabotageCd > 0) npc.sabotageCd = Math.max(0, npc.sabotageCd - simDt);

      // Dynamic squad NPC sanity pressure (Inspector dread aura vs safe ward calm)
      if (typeof npc.sanity === 'number') {
        var inWardNpc = this.isInsideAnyWard(npc.x, npc.z);
        var dInsNpc = ins.alive ? dist2D(npc.x, npc.z, ins.x, ins.z) : 99;
        if (ins.alive && dInsNpc < 8.5) {
          var drainRate = (dInsNpc < 4.5 ? 4.8 : 2.6) * (inWardNpc ? 0.35 : 1.0);
          npc.sanity = Math.max(12, npc.sanity - drainRate * simDt);
        } else {
          var recCap = npc.id === 'shenyan' ? 76 : (npc.maxSanity || 100);
          var recRate = inWardNpc ? 4.2 : 1.6;
          if (npc.sanity < recCap) npc.sanity = Math.min(recCap, npc.sanity + recRate * simDt);
        }
      }

      var goal = this.getNpcGoal(npc);
      var dGoal = dist2D(npc.x, npc.z, goal.x, goal.z);

      // Autonomous multi-zone patrol dwell & sector advancement
      if (goal.patrolStop && dGoal <= goal.stopDist + 0.4) {
        npc.dwellTimer = (npc.dwellTimer || 0) - simDt;
        if (npc.dwellTimer <= 0) {
          var myRoute = NPC_PATROL_ROUTES[npc.id] || [];
          if (myRoute.length > 1) {
            npc.roamIndex = ((npc.roamIndex || 0) + 1) % myRoute.length;
            npc.dwellTimer = myRoute[npc.roamIndex].dwell || 5.5;
            npc.repathTimer = 0;
          } else {
            npc.dwellTimer = 5.5;
          }
          if (npc.id === 'yanci') {
            this.spawnNpcSignatureVfx('yanci', npc.x, npc.z, 0);
          }
        }
      }

      // Repath via A*
      npc.repathTimer -= simDt;
      if (npc.repathTimer <= 0 && dGoal > goal.stopDist) {
        npc.repathTimer = 1.25 + Math.random() * 0.4;
        var newPath = this.mapApi.findPath(npc.x, npc.z, goal.x, goal.z);
        npc.path = Array.isArray(newPath) ? newPath : [];
        npc.pathIndex = 0;
      }

      // Steer along A* path
      var vx = 0;
      var vz = 0;
      if (dGoal > goal.stopDist) {
        var wp = (npc.path && npc.path[npc.pathIndex]) ? npc.path[npc.pathIndex] : goal;
        var wdx = wp.x - npc.x;
        var wdz = wp.z - npc.z;
        var wd = Math.sqrt(wdx * wdx + wdz * wdz);
        if (wd < 0.55 && npc.pathIndex < npc.path.length - 1) {
          npc.pathIndex++;
          wp = npc.path[npc.pathIndex];
          wdx = wp.x - npc.x;
          wdz = wp.z - npc.z;
          wd = Math.sqrt(wdx * wdx + wdz * wdz);
        }
        if (wd > 0.08) {
          vx = (wdx / wd) * npc.speed;
          vz = (wdz / wd) * npc.speed;
        }
      }

      // Soft separation so teammates never overlap
      for (var j = 0; j < this.squad.length; j++) {
        if (i === j || !this.squad[j].alive) continue;
        var ox = npc.x - this.squad[j].x;
        var oz = npc.z - this.squad[j].z;
        var od = Math.sqrt(ox * ox + oz * oz);
        if (od > 0.001 && od < 1.15) {
          vx += (ox / od) * 2.2;
          vz += (oz / od) * 2.2;
        }
      }

      npc.vx = vx;
      npc.vz = vz;
      if (Math.abs(vx) + Math.abs(vz) > 0.05) {
        var step = this.moveEntityWithCollision(npc.x, npc.z, npc.x + vx * simDt, npc.z + vz * simDt, npc.radius);
        npc.x = step.x;
        npc.z = step.z;
        if (Math.abs(vx) > 0.25) npc.facingLeft = vx < 0;
        if (this.isPointInPuddle(npc.x, npc.z)) {
          npc.puddleAccum = (npc.puddleAccum || 0) + Math.sqrt(vx * vx + vz * vz) * simDt;
          if (npc.puddleAccum >= 0.85) {
            npc.puddleAccum = 0;
            this.spawnPuddleSplash(npc.x, npc.z, false);
          }
        }
      }

      // Role special actions + NPC signature visual VFX!
      if (goal.workConsole && !goal.workConsole.done && dist2D(npc.x, npc.z, goal.workConsole.x, goal.workConsole.z) <= 2.3) {
        var workRate = npc.id === 'xutan' ? 4.8 : 2.6;
        this.advanceConsole(goal.workConsole, workRate * simDt, npc.id);
        npc.channelTimer = 0.24;
        npc.sigVfxCd = (npc.sigVfxCd || 0) - simDt;
        if (npc.id === 'xutan' && npc.sigVfxCd <= 0) {
          npc.sigVfxCd = 1.65;
          this.spawnNpcSignatureVfx('xutan', npc.x, npc.z, Math.atan2(goal.workConsole.z - npc.z, goal.workConsole.x - npc.x));
        }
      }

      // Yan Ci independently logs anomalies he passes in outer sectors (cold field note, never summoning player!)
      if (npc.id === 'yanci' && npc.shoutCd <= 0) {
        var yZone = this.mapApi.getZoneAt(npc.x, npc.z);
        if (yZone !== 'concourse') {
          for (var yci = 0; yci < this.interactables.length; yci++) {
            var yClue = this.interactables[yci];
            if (yClue.type === 'clue' && !yClue.done && !npc.loggedClues[yClue.id] && dist2D(npc.x, npc.z, yClue.x, yClue.z) <= 5.5) {
              npc.loggedClues[yClue.id] = true;
              npc.shoutCd = 28;
              this.spawnNpcSignatureVfx('yanci', npc.x, npc.z, 0);
              var zInfo = getZoneInfo(this.mapApi, yZone);
              this.emitRadio({
                type: 'narration',
                text: '【外勤记录 · 严辞】' + zInfo.name + '存有规则残片痕迹，已同步坐标备查，继续向下一扇区推进。'
              });
              break;
            }
          }
        }
      }

      // Lu Jin & Yan Ci fire tactical shots/slashes at Inspector with signature VFX!
      if (ins.alive && (npc.id === 'lujin' || npc.id === 'yanci' || npc.order === 'engage')) {
        var dBoss = dist2D(npc.x, npc.z, ins.x, ins.z);
        if (npc.attackCd <= 0 && dBoss <= 9.5 && this.mapApi.hasLineOfSight(npc.x, npc.z, ins.x, ins.z)) {
          npc.actionTimer = 0.28;
          this.triggerActorSquash(npc, 1.14, 0.90);
          npc.facingLeft = ins.x < npc.x;
          var bdx = (ins.x - npc.x) / Math.max(0.01, dBoss);
          var bdz = (ins.z - npc.z) / Math.max(0.01, dBoss);
          var aimAng = Math.atan2(bdz, bdx);

          if (npc.id === 'lujin' && dBoss <= 2.7) {
            npc.attackCd = 1.15;
            this.spawnSlashArc(npc.x, npc.z, aimAng, 2.7, 0xff9c3b, 0.24, false, { primaryColor: '#ff9c3b', secondaryColor: '#58e6ff', coreColor: '#fff5cc' });
            this.damageInspector(12, bdx * 2.8, bdz * 2.8, false, { impactColor: 0xff9c3b });
            if (npc.shoutCd <= 0) {
              npc.shoutCd = 16;
              this.showSpeechBubble('lujin', '正面交火中——别管我，各自干活！');
            }
          } else {
            npc.attackCd = npc.id === 'lujin' ? 1.3 : 1.9;
            if (npc.id === 'lujin') {
              this.spawnNpcSignatureVfx('lujin', npc.x + bdx * 0.55, npc.z + bdz * 0.55, aimAng);
            } else if (npc.id === 'yanci') {
              this.spawnNpcSignatureVfx('yanci', npc.x, npc.z, aimAng);
            }
            this.spawnProjectile({
              owner: npc.id,
              x: npc.x + bdx * 0.5,
              z: npc.z + bdz * 0.5,
              vx: bdx * (npc.id === 'lujin' ? 20 : 16),
              vz: bdz * (npc.id === 'lujin' ? 20 : 16),
              damage: npc.id === 'lujin' ? 8 : 6,
              knockback: 1.0,
              color: npc.id === 'lujin' ? 0xff9c3b : (npc.id === 'yanci' ? 0xf2c96b : hexToInt(npc.accentColor, 0x6fd8ea)),
              secondaryColor: npc.id === 'lujin' ? 0xffe49c : 0x7ca7d9,
              radius: 0.21,
              ttl: 0.85
            });
          }
        }
      }

      // Shen Yan suspicious sabotage noise spike + crimson forged-stopwatch pulse when alone
      if (npc.id === 'shenyan' && npc.sabotageCd <= 0 && dist2D(npc.x, npc.z, p.x, p.z) > 10.5) {
        npc.sabotageCd = 24;
        npc.actionTimer = 0.35;
        this.spawnNpcSignatureVfx('shenyan', npc.x, npc.z, 0);
        this.emitSoundRipple(npc.x, npc.z, 68, 'shenyan');
        if (Math.random() < 0.55) {
          this.emitRadio({
            type: 'narration',
            text: '【频段异响】' + getZoneInfo(this.mapApi, this.mapApi.getZoneAt(npc.x, npc.z)).name + '方向传来一声金属票夹坠地声——沈砚似乎故意制造了噪点。'
          });
        }
      }

      var moving = (Math.abs(vx) + Math.abs(vz)) > 0.35;
      this.updateActorSprite(npc, simDt, moving);
      npc.vis.group.visible = this.canSeeWorldPoint(npc.x, npc.z);
    }
  };

  // ---------------------------------------------------------------------------
  // Inspector Boss AI — Death Exam Grade Multi-Mechanic Boss
  // (Rule Armor + Execution Lunge + Close Shear Cleave + Audit Gaze + Rule Slam + Phase 2)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.exposeInspectorWeakpoint = function (eventType, fallbackDuration) {
    var ins = this.inspector;
    if (!ins || !ins.alive) return null;
    var trigger = (INFINITY.AI && typeof INFINITY.AI.computeWeakpointTrigger === 'function')
      ? INFINITY.AI.computeWeakpointTrigger(eventType, { threatLevel: this.threatLevel })
      : null;
    var dur = trigger ? trigger.duration : (Number(fallbackDuration) || 3.2);
    var callout = trigger ? trigger.callout : '✦ 核心弱点暴露!';
    ins.weakpointTimer = Math.max(ins.weakpointTimer || 0, dur);
    ins.weakpointMaxTimer = Math.max(ins.weakpointMaxTimer || 0, dur);
    ins.weakpointReason = eventType || 'exposed';
    ins.armorBrokenTimer = Math.max(ins.armorBrokenTimer || 0, dur);

    var wpSpec = (INFINITY.CombatFeel && typeof INFINITY.CombatFeel.getBossPhase2Feel === 'function')
      ? INFINITY.CombatFeel.getBossPhase2Feel('weakpoint_expose')
      : { shakeAmp: 0.22, shakeDur: 0.18, shakeFreq: 32, primaryColor: 0xffe875, secondaryColor: 0x4df8ff, ringRadius: 3.1 };
    this.addCameraShake(wpSpec.shakeAmp, wpSpec.shakeDur, wpSpec.shakeFreq);
    this.spawnShockRing(ins.x, ins.z, wpSpec.ringRadius || 3.1, wpSpec.secondaryColor || 0x4df8ff, 0.42);
    this.spawnShockRing(ins.x, ins.z, (wpSpec.ringRadius || 3.1) * 0.62, wpSpec.primaryColor || 0xffe875, 0.28);
    this.spawnFloatingText(ins.x, 3.05, ins.z, callout, '#ffe875', 'weakpoint');
    playSfxSafe('blade_ring');
    return { reason: ins.weakpointReason, duration: dur, callout: callout };
  };

  EngineSession.prototype.updateInspector = function (simDt) {
    var ins = this.inspector;
    if (!ins.alive) {
      ins.vis.group.visible = false;
      if (ins.gazeBeam) ins.gazeBeam.visible = false;
      if (ins.weakpointVis && ins.weakpointVis.group) ins.weakpointVis.group.visible = false;
      if (this.inspectorLantern) this.inspectorLantern.intensity = 0;
      return;
    }

    var p = this.player;
    var mapApi = this.mapApi;
    var cfg = BOSS_DEATH_EXAM_CONFIG;
    var canSeeIns = this.canSeeWorldPoint(ins.x, ins.z);
    ins.vis.group.visible = canSeeIns;

    if (ins.hitFlash > 0) ins.hitFlash = Math.max(0, ins.hitFlash - simDt);
    if (ins.whiteFlash > 0) ins.whiteFlash = Math.max(0, ins.whiteFlash - simDt);
    if (ins.actionTimer > 0) ins.actionTimer = Math.max(0, ins.actionTimer - simDt);
    if (ins.blinkCd > 0) ins.blinkCd = Math.max(0, ins.blinkCd - simDt);
    if (ins.lungeCd > 0) ins.lungeCd = Math.max(0, ins.lungeCd - simDt);
    if (ins.cleaveCd > 0) ins.cleaveCd = Math.max(0, ins.cleaveCd - simDt);
    if (ins.gazeCd > 0) ins.gazeCd = Math.max(0, ins.gazeCd - simDt);
    if (ins.slamCd > 0) ins.slamCd = Math.max(0, ins.slamCd - simDt);
    if (ins.chainTimer > 0) ins.chainTimer = Math.max(0, ins.chainTimer - simDt);
    if (ins.armorBrokenTimer > 0) ins.armorBrokenTimer = Math.max(0, ins.armorBrokenTimer - simDt);
    if (ins.stunImmuneTimer > 0) ins.stunImmuneTimer = Math.max(0, ins.stunImmuneTimer - simDt);
    if (ins.armorMsgCd > 0) ins.armorMsgCd = Math.max(0, ins.armorMsgCd - simDt);
    if (ins.weakpointTimer > 0) {
      ins.weakpointTimer = Math.max(0, ins.weakpointTimer - simDt);
      if (ins.weakpointTimer <= 0) {
        ins.weakpointReason = null;
        ins.weakpointMaxTimer = 0;
      }
    }

    if (ins.weakpointVis && INFINITY.CombatFeel && typeof INFINITY.CombatFeel.updateBossWeakpointVisual === 'function') {
      INFINITY.CombatFeel.updateBossWeakpointVisual(ins.weakpointVis, ins, this.elapsedReal);
    }

    // Phase-2 Mutation evaluation driven by HP threshold & live station threat level
    var mutEval = (INFINITY.AI && typeof INFINITY.AI.evaluateInspectorMutation === 'function')
      ? INFINITY.AI.evaluateInspectorMutation({
        hp: ins.hp,
        maxHp: ins.maxHp,
        threatLevel: this.threatLevel,
        alreadyMutated: ins.mutated,
        currentPhase: ins.phase
      })
      : {
        phase: (ins.phase >= 2 || (ins.hp / Math.max(1, ins.maxHp)) <= cfg.phase2Threshold) ? 2 : 1,
        mutated: (ins.phase >= 2 || (ins.hp / Math.max(1, ins.maxHp)) <= cfg.phase2Threshold),
        justMutated: ins.phase < 2 && ((ins.hp / Math.max(1, ins.maxHp)) <= cfg.phase2Threshold),
        mutationTier: ins.phase >= 2 ? 'mutated' : 'dormant',
        threatTier: 'low',
        speedMult: ins.phase >= 2 ? 1.22 : 1.0,
        damageMult: ins.phase >= 2 ? 1.18 : 1.0,
        cooldownMult: ins.phase >= 2 ? 0.82 : 1.0,
        blinkCooldownSec: 6.0,
        radioAlert: '【死考警戒 · 二阶段变异】零号检票员撕裂规则外壳，解锁瞬移奇袭与弱点核心机制！'
      };

    ins.mutationTier = mutEval.mutationTier;
    ins.threatTier = mutEval.threatTier;
    var isPhase2 = Boolean(mutEval.mutated || ins.phase >= 2);
    if (mutEval.justMutated) {
      ins.phase = 2;
      ins.mutated = true;
      ins.lungeTelegraph = 0;
      ins.lungeWindup = 0;
      ins.lungeActive = 0;
      ins.cleaveTelegraph = 0;
      ins.gazeTelegraph = 0;
      ins.blinkTelegraph = 0;
      if (ins.teleMesh) ins.teleMesh.visible = false;
      if (ins.teleFill) ins.teleFill.visible = false;
      if (ins.cleaveMesh) ins.cleaveMesh.visible = false;
      if (ins.gazeBeam) ins.gazeBeam.visible = false;
      if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
      ins.slamTelegraph = 0.92;
      ins.slamCd = Math.max(4.5, 8.5 * mutEval.cooldownMult);
      ins.blinkCd = Math.min(ins.blinkCd || 4.5, 2.2);
      ins.pendingWeakpoint = 'slam_recovery';
      playSfxSafe('alert');
      if (INFINITY.CombatFeel && typeof INFINITY.CombatFeel.triggerBossMutationAwakeningFeel === 'function') {
        INFINITY.CombatFeel.triggerBossMutationAwakeningFeel(this, ins.x, ins.z, {
          callout: mutEval.mutationTier === 'overdrive' ? '【高危异变 · 过载二阶段】' : '【二阶段变异 · 频段过载】'
        });
      } else {
        this.addCameraShake(0.48, 0.35);
        this.glitchAmount = Math.max(this.glitchAmount, 0.72);
        this.spawnFloatingText(ins.x, 3.05, ins.z, '【二阶段变异 · 频段过载】', '#ff2942', 'mutation');
      }
      this.triggerSkillCutIn(
        mutEval.mutationTier === 'overdrive' ? '高危异变 · 过载剪裁' : '二阶段变异 · 频段过载',
        'ANOMALY PHASE II // RULE OVERDRIVE',
        '#ff243c',
        'boss'
      );
      if (mutEval.radioAlert) {
        this.emitRadio({
          type: 'system',
          text: mutEval.radioAlert
        });
      }
    }

    // Boss Phase-2 visual mutation aura (rotating crimson occult floor sigil + slim counter-rotating orbital seal rings)
    if (ins.phase2AuraGroup) {
      ins.phase2AuraGroup.visible = isPhase2;
      if (isPhase2) {
        var p2Pulse = 0.92 + 0.10 * Math.sin(this.elapsedReal * 6.0);
        if (ins.p2FloorRing) {
          ins.p2FloorRing.rotation.y -= simDt * 1.15;
          ins.p2FloorRing.scale.set(p2Pulse, p2Pulse, p2Pulse);
        }
        if (ins.p2BladeL && ins.p2BladeR) {
          ins.p2BladeL.rotation.y += simDt * 1.85;
          ins.p2BladeL.rotation.z += simDt * 0.95;
          ins.p2BladeR.rotation.y -= simDt * 2.15;
          ins.p2BladeR.rotation.z -= simDt * 1.1;
        }
      }
    }

    // Boss volumetric crimson lantern sway, golden containment seal ring, & phase-2 rage fissures
    if (ins.lanternCone) {
      var lDir = ins.facingLeft ? -1 : 1;
      ins.lanternCone.position.x = -0.55 * lDir;
      ins.lanternCone.rotation.y = (ins.facingLeft ? -Math.PI * 0.45 : Math.PI * 0.45) + Math.sin(this.elapsedReal * 2.3) * 0.24;
      ins.lanternConeMat.opacity = ins.state === 'HUNT' ? (0.18 + Math.sin(this.elapsedReal * 10) * 0.04) : 0.11;
    }
    if (ins.sealGroup) {
      var sp = clamp((ins.sealedPct || 0) / 100, 0, 1);
      if (sp > 0.01 || ins.chainTimer > 0) {
        ins.sealGroup.visible = true;
        var sSpin = 0.8 + sp * 3.0;
        ins.sealDisc.rotation.z += simDt * sSpin;
        ins.sealBand.rotation.z -= simDt * sSpin * 1.4;
        ins.sealBand.rotation.x = Math.PI * 0.5 + Math.sin(this.elapsedReal * 2.5) * 0.22;
        ins.sealDiscMat.opacity = clamp(0.28 + sp * 0.55, 0.28, 0.88);
        ins.sealBandMat.opacity = clamp(0.32 + sp * 0.62, 0.32, 0.94);
      } else {
        ins.sealGroup.visible = false;
      }
    }
    // Phase-2 enraged crimson arcs (intensifies in overdrive threat tier)
    if (isPhase2 && canSeeIns) {
      ins.rageArcAccum = (ins.rageArcAccum || 0) - simDt;
      if (ins.rageArcAccum <= 0) {
        ins.rageArcAccum = mutEval.mutationTier === 'overdrive' ? 0.22 : 0.36;
        var ra = Math.random() * Math.PI * 2;
        this.spawnLightningBolt(
          ins.x, 1.4, ins.z,
          ins.x + Math.cos(ra) * 1.55, 0.3 + Math.random() * 1.4, ins.z + Math.sin(ra) * 1.55,
          mutEval.mutationTier === 'overdrive' ? 0xff4760 : 0xff2942, 0.18, 4
        );
      }
    }
    // Dark-red trailing mist & boot sparks while hunting
    if (ins.state === 'HUNT' && ins.stunTimer <= 0 && canSeeIns) {
      ins.mistAccum = (ins.mistAccum || 0) - simDt;
      if (ins.mistAccum <= 0) {
        ins.mistAccum = 0.24;
        this.spawnSparkBurst(ins.x, 0.35, ins.z, 0xb81628, 3);
      }
    }

    // Stunned (from EMP or Perfect Parry!) with brief stun-DR immunity on recovery
    if (ins.stunTimer > 0) {
      ins.stunTimer = Math.max(0, ins.stunTimer - simDt);
      if (ins.stunTimer <= 0) {
        ins.stunImmuneTimer = Math.max(ins.stunImmuneTimer || 0, cfg.stunImmuneDuration);
      }
      ins.teleMesh.visible = false;
      ins.teleFill.visible = false;
      if (ins.cleaveMesh) ins.cleaveMesh.visible = false;
      if (ins.gazeBeam) ins.gazeBeam.visible = false;
      if (ins.slamRing) ins.slamRing.visible = false;
      if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
      this.updateActorSprite(ins, simDt, false);
      this.enforceWardBlockOnInspector();
      return;
    }

    // Mechanic 0 (Phase-2 Mutation): Phantom Spatial Blink Ambush -> Chains into Parryable Shear Cleave + Core Overheat Weakpoint
    if (ins.blinkTelegraph > 0) {
      ins.blinkTelegraph = Math.max(0, ins.blinkTelegraph - simDt);
      ins.hitFlash = Math.max(ins.hitFlash, 0.08);
      ins.actionTimer = 0.22;
      if (canSeeIns && Math.random() < 0.42) {
        this.spawnSparkBurst(ins.x, 1.35, ins.z, 0xff2942, 3);
      }
      if (ins.blinkTelegraph <= 0) {
        var bTgt = (ins.huntTargetId === 'player') ? p : (this.squadById[ins.huntTargetId] || p);
        if (!bTgt || bTgt.alive === false) bTgt = p;
        var oldX = ins.x;
        var oldZ = ins.z;
        var bAng = Math.atan2(ins.z - bTgt.z, ins.x - bTgt.x) + Math.PI;
        var desiredX = bTgt.x + Math.cos(bAng) * 3.0;
        var desiredZ = bTgt.z + Math.sin(bAng) * 3.0;
        var blinkSafe = mapApi.resolveCircleWallCollision(desiredX, desiredZ, ins.radius);
        ins.x = blinkSafe.x;
        ins.z = blinkSafe.z;
        ins.facingLeft = bTgt.x < ins.x;
        ins.blinkCd = mutEval.blinkCooldownSec || 5.8;
        this.enforceWardBlockOnInspector();

        if (INFINITY.CombatFeel && typeof INFINITY.CombatFeel.spawnBossTeleportVfx === 'function') {
          INFINITY.CombatFeel.spawnBossTeleportVfx(this, oldX, oldZ, ins.x, ins.z, {
            facingLeft: ins.facingLeft
          });
        } else {
          this.spawnAfterimage(oldX, oldZ, 'inspector', ins.facingLeft, 0xff2238, 0.45, 'dash');
          this.spawnShockRing(ins.x, ins.z, 3.4, 0xff2942, 0.38);
        }
        playSfxSafe('alert');
        this.emitSoundRipple(ins.x, ins.z, 76, 'boss');

        // Immediately chain into a parryable Shear Cleave, then expose weakpoint via blink_overheat!
        var cdx = bTgt.x - ins.x;
        var cdz = bTgt.z - ins.z;
        var clen = Math.max(0.01, Math.sqrt(cdx * cdx + cdz * cdz));
        ins.cleaveDirX = cdx / clen;
        ins.cleaveDirZ = cdz / clen;
        ins.cleaveTelegraph = 0.48;
        ins.pendingWeakpoint = 'blink_overheat';
      }
      this.updateActorSprite(ins, simDt, false);
      return;
    }

    // Mechanic A: Rule Shockwave Slam (expanding floor ring -> heavy AOE + SAN drain + ward shred + Phase-2 weakpoint exposure)
    if (ins.slamTelegraph > 0) {
      ins.slamTelegraph = Math.max(0, ins.slamTelegraph - simDt);
      var sMax = isPhase2 ? 0.92 : 1.05;
      var sProg = 1 - clamp(ins.slamTelegraph / sMax, 0, 1);
      if (ins.slamRing && ins.slamRingMat) {
        ins.slamRing.visible = true;
        var srScale = Math.max(0.4, sProg * cfg.slamRadius);
        ins.slamRing.scale.set(srScale, srScale, 1);
        ins.slamRingMat.opacity = 0.35 + sProg * 0.55;
      }
      ins.actionTimer = 0.25;
      if (ins.slamTelegraph <= 0) {
        if (ins.slamRing) ins.slamRing.visible = false;
        ins.slamCd = Math.max(4.5, (isPhase2 ? 8.5 : 11.5) * mutEval.cooldownMult);
        this.addCameraShake(0.52, 0.34);
        this.spawnShockRing(ins.x, ins.z, cfg.slamRadius, 0xff2238, 0.55);
        this.spawnShockRing(ins.x, ins.z, cfg.slamRadius * 0.65, 0xffb3ba, 0.34);
        this.spawnSparkBurst(ins.x, 1.0, ins.z, 0xff2942, 24);
        playSfxSafe('emp_boom');
        this.emitSoundRipple(ins.x, ins.z, 86, 'boss');

        var slamDmg = Math.round(cfg.slamDamage * mutEval.damageMult);
        // Hit player if within slam radius
        var dSlamP = dist2D(ins.x, ins.z, p.x, p.z);
        if (dSlamP <= cfg.slamRadius) {
          var sdx = (p.x - ins.x) / Math.max(0.01, dSlamP);
          var sdz = (p.z - ins.z) / Math.max(0.01, dSlamP);
          p.sanity = Math.max(0, p.sanity - cfg.slamSanityLoss);
          this.damagePlayer(slamDmg, sdx * 6.8, sdz * 6.8);
        }
        // Hit allies in slam radius
        for (var sai = 0; sai < this.squad.length; sai++) {
          var sAlly = this.squad[sai];
          if (sAlly.alive && dist2D(ins.x, ins.z, sAlly.x, sAlly.z) <= cfg.slamRadius) {
            this.damageAlly(sAlly, Math.round(34 * mutEval.damageMult));
          }
        }
        // Degrade nearby protective wards
        for (var swi = 0; swi < this.wards.length; swi++) {
          var wObj = this.wards[swi];
          if (dist2D(ins.x, ins.z, wObj.x, wObj.z) <= cfg.slamRadius + (wObj.radius || 3.0)) {
            wObj.ttl = Math.max(0.2, wObj.ttl - 4.0);
          }
        }
        // Phase-2 Slam vents core heat, exposing Inspector's chest weakpoint!
        if (isPhase2 || ins.pendingWeakpoint === 'slam_recovery') {
          ins.pendingWeakpoint = null;
          this.exposeInspectorWeakpoint('slam_recovery', 3.4);
        }
      }
      this.updateActorSprite(ins, simDt, false);
      return;
    }

    // Mechanic B: Close Shear Cleave (wide crimson arc — parryable!)
    if (ins.cleaveTelegraph > 0) {
      ins.cleaveTelegraph = Math.max(0, ins.cleaveTelegraph - simDt);
      var cMax = isPhase2 ? 0.48 : 0.55;
      var cProg = 1 - clamp(ins.cleaveTelegraph / cMax, 0, 1);
      var cAng = Math.atan2(ins.cleaveDirZ, ins.cleaveDirX);
      if (ins.cleaveMesh && ins.cleaveMat) {
        ins.cleaveMesh.visible = true;
        ins.cleaveMesh.rotation.y = -cAng;
        ins.cleaveMat.opacity = 0.32 + cProg * 0.52;
      }
      if (ins.teleParryGlint && ins.teleParryGlintMat) {
        ins.teleParryGlint.visible = true;
        ins.teleParryGlint.position.x = ins.facingLeft ? -0.68 : 0.68;
        ins.teleParryGlint.rotation.z = this.elapsedReal * 9.0;
        ins.teleParryGlint.scale.set(0.85 + cProg * 0.45, 0.85 + cProg * 0.45, 1);
        ins.teleParryGlintMat.color.setHex(0xffe484);
        ins.teleParryGlintMat.opacity = 0.92;
      }
      ins.actionTimer = 0.2;
      if (ins.cleaveTelegraph <= 0) {
        if (ins.cleaveMesh) ins.cleaveMesh.visible = false;
        if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
        ins.cleaveCd = Math.max(1.5, (isPhase2 ? 2.4 : 3.2) * mutEval.cooldownMult);
        this.triggerActorSquash(ins, 1.24, 0.82);
        this.spawnSlashArc(ins.x, ins.z, cAng, 3.85, 0xff2238, 0.28, true, { primaryColor: '#ff2238', secondaryColor: '#ff99a4' });
        playSfxSafe('sword_slash');

        var cDmg = Math.round((isPhase2 ? cfg.cleaveDamageP2 : cfg.cleaveDamageP1) * mutEval.damageMult);
        if (this.isPointInArc(ins.x, ins.z, ins.cleaveDirX, ins.cleaveDirZ, p.x, p.z, 3.9 + p.radius, -0.15)) {
          if (isPhase2) p.sanity = Math.max(0, p.sanity - cfg.cleaveSanityP2);
          this.damagePlayer(cDmg, ins.cleaveDirX * 5.8, ins.cleaveDirZ * 5.8);
        }
        for (var cai = 0; cai < this.squad.length; cai++) {
          var cAlly = this.squad[cai];
          if (cAlly.alive && this.isPointInArc(ins.x, ins.z, ins.cleaveDirX, ins.cleaveDirZ, cAlly.x, cAlly.z, 3.9 + cAlly.radius, -0.15)) {
            this.damageAlly(cAlly, Math.round(cDmg * 0.78));
          }
        }
        // Post-Blink Ambush overheat exposes Inspector's chest weakpoint!
        if (ins.pendingWeakpoint === 'blink_overheat') {
          ins.pendingWeakpoint = null;
          this.exposeInspectorWeakpoint('blink_overheat', 3.2);
        }
      }
      this.updateActorSprite(ins, simDt, false);
      return;
    }

    // Mechanic C: Cold-White Lantern Ticket Audit Gaze (lock-on beam; break LOS or stealth to dodge & trigger weakpoint!)
    if (ins.gazeTelegraph > 0) {
      ins.gazeTelegraph = Math.max(0, ins.gazeTelegraph - simDt);
      var gTgt = (ins.gazeTargetId === 'player') ? p : (this.squadById[ins.gazeTargetId] || p);
      if (!gTgt || gTgt.alive === false) gTgt = p;
      var gDist = dist2D(ins.x, ins.z, gTgt.x, gTgt.z);
      var gLos = mapApi.hasLineOfSight(ins.x, ins.z, gTgt.x, gTgt.z) && !(gTgt === p && p.stealthTimer > 0);
      var gMax = isPhase2 ? 1.10 : 1.25;
      var gProg = 1 - clamp(ins.gazeTelegraph / gMax, 0, 1);

      if (ins.gazeBeam && ins.gazeBeamMat) {
        if (canSeeIns && gLos) {
          ins.gazeBeam.visible = true;
          ins.gazeBeam.position.set(ins.x, 1.32, ins.z);
          ins.gazeBeam.rotation.y = Math.atan2(gTgt.x - ins.x, gTgt.z - ins.z);
          ins.gazeBeam.scale.set(0.6 + gProg * 1.4, 1, Math.max(0.5, gDist));
          ins.gazeBeamMat.color.setHex(gProg > 0.72 ? 0xff2942 : 0xffe4e8);
          ins.gazeBeamMat.opacity = 0.45 + gProg * 0.48;
        } else {
          ins.gazeBeam.visible = false;
        }
      }
      ins.facingLeft = gTgt.x < ins.x;
      ins.actionTimer = 0.2;

      if (ins.gazeTelegraph <= 0) {
        if (ins.gazeBeam) ins.gazeBeam.visible = false;
        ins.gazeCd = Math.max(4.0, (isPhase2 ? 6.5 : 8.5) * mutEval.cooldownMult);
        if (gLos && gDist <= 18.0) {
          this.spawnLaserBeam(ins.x, ins.z, gTgt.x, gTgt.z, 0xff2942, 0.36, { primaryColor: '#ff2942', secondaryColor: '#ffffff' });
          playSfxSafe('rail_fire');
          if (gTgt === p) {
            p.sanity = Math.max(0, p.sanity - cfg.gazeSanityLoss);
            p.ruleBindTimer = Math.max(p.ruleBindTimer || 0, cfg.gazeBindSec);
            this.threatLevel = clamp(this.threatLevel + 24, 0, 100);
            this.damagePlayer(Math.round(cfg.gazeDamage * mutEval.damageMult), 0, 0);
            this.spawnFloatingText(p.x, 2.65, p.z, '查票锁定! 规则束缚 -' + cfg.gazeSanityLoss + ' SAN', '#ff6e7a');
          } else {
            this.damageAlly(gTgt, Math.round(30 * mutEval.damageMult));
          }
        } else {
          this.spawnFloatingText(p.x, 2.35, p.z, '凝视规避!', '#58e6d8');
          if (isPhase2) {
            this.exposeInspectorWeakpoint('gaze_evaded', 2.8);
          }
        }
      }
      this.updateActorSprite(ins, simDt, false);
      return;
    }

    // Active Lunge Dash execution (swept collision + wall bounce + walkable-clamped shears scar)
    if (ins.lungeActive > 0) {
      ins.lungeActive = Math.max(0, ins.lungeActive - simDt);
      var dashSpeed = isPhase2 ? 21.5 : 19.5;
      var nx = ins.x + ins.lungeDirX * dashSpeed * simDt;
      var nz = ins.z + ins.lungeDirZ * dashSpeed * simDt;
      var step = this.moveEntityWithCollision(ins.x, ins.z, nx, nz, ins.radius);
      ins.x = step.x;
      ins.z = step.z;
      this.enforceWardBlockOnInspector();
      if (canSeeIns) {
        this.spawnAfterimage(ins.x, ins.z, 'inspector', ins.facingLeft, 0xff2238, 0.24, 'dash');
      }
      if (step.hit && step.hitWall) {
        ins.lungeActive = 0;
        ins.stunTimer = Math.max(ins.stunTimer, 0.65);
        ins.armorBrokenTimer = Math.max(ins.armorBrokenTimer || 0, 3.0);
        this.hitStopTimer = Math.max(this.hitStopTimer || 0, 0.035);
        this.triggerActorSquash(ins, 0.78, 1.24);
        this.spawnWallImpactDebris(step.x - step.normalX * ins.radius, step.z - step.normalZ * ins.radius, step.normalX, step.normalZ);
        this.addCameraShake(0.24, 0.18);
        this.spawnScorchDecal(ins.x, ins.z, Math.atan2(ins.lungeDirZ, ins.lungeDirX), 1.9, 0xff2238);
        this.exposeInspectorWeakpoint('wall_crash', 3.6);
      } else if (ins.lungeActive <= 0) {
        this.spawnScorchDecal(ins.x, ins.z, Math.atan2(ins.lungeDirZ, ins.lungeDirX), 1.8, 0xff2238);
      }

      // Check Death Exam lethal damage to player or squad during lunge
      if (!ins.lungeHitDone) {
        if (dist2D(ins.x, ins.z, p.x, p.z) <= ins.radius + p.radius + 0.60) {
          ins.lungeHitDone = true;
          var lDmg = Math.round((isPhase2 ? cfg.lungeDamageP2 : cfg.lungeDamageP1) * mutEval.damageMult);
          if (isPhase2) p.sanity = Math.max(0, p.sanity - cfg.lungeSanityP2);
          this.damagePlayer(lDmg, ins.lungeDirX * 6.0, ins.lungeDirZ * 6.0);
        } else {
          for (var si = 0; si < this.squad.length; si++) {
            var al = this.squad[si];
            if (al.alive && dist2D(ins.x, ins.z, al.x, al.z) <= ins.radius + al.radius + 0.55) {
              ins.lungeHitDone = true;
              this.damageAlly(al, Math.round((isPhase2 ? cfg.lungeAllyDamageP2 : cfg.lungeAllyDamageP1) * mutEval.damageMult));
              break;
            }
          }
        }
      }

      ins.actionTimer = 0.25;
      this.updateActorSprite(ins, simDt, true);
      return;
    }

    // Crimson Lunge Telegraph wind-up (with clear gold-white PARRY WINDOW glint!)
    if (ins.lungeTelegraph > 0) {
      ins.lungeTelegraph = Math.max(0, ins.lungeTelegraph - simDt);
      ins.lungeWindup = ins.lungeTelegraph;
      var tMax = ins.lungeTelegraphMax || 0.85;
      var progress = 1 - clamp(ins.lungeTelegraph / tMax, 0, 1);
      ins.teleMesh.visible = true;
      ins.teleFill.visible = true;
      var yaw = Math.atan2(ins.lungeDirX, ins.lungeDirZ);
      ins.teleMesh.rotation.y = yaw;
      ins.teleFill.rotation.y = yaw;
      ins.teleFill.scale.set(1, 1, Math.max(0.02, progress));
      ins.actionTimer = 0.2;

      if (ins.teleParryGlint && ins.teleParryGlintMat) {
        ins.teleParryGlint.visible = true;
        ins.teleParryGlint.position.x = ins.facingLeft ? -0.68 : 0.68;
        ins.teleParryGlint.rotation.z = this.elapsedReal * 7.5;
        var inSweetSpot = progress >= 0.32;
        var gScale = inSweetSpot ? (0.9 + Math.sin(progress * Math.PI * 3) * 0.45) : (0.45 + progress * 0.5);
        ins.teleParryGlint.scale.set(gScale, gScale, 1);
        ins.teleParryGlintMat.color.setHex(inSweetSpot ? 0xffe484 : 0xff3b4f);
        ins.teleParryGlintMat.opacity = inSweetSpot ? 0.95 : 0.55;
      }

      if (ins.lungeTelegraph <= 0) {
        ins.lungeWindup = 0;
        ins.teleMesh.visible = false;
        ins.teleFill.visible = false;
        if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
        ins.lungeActive = isPhase2 ? 0.31 : 0.28;
        ins.lungeHitDone = false;
        ins.lungeCd = Math.max(1.4, (isPhase2 ? 2.1 : 2.9) * mutEval.cooldownMult);
        this.triggerActorSquash(ins, 1.28, 0.78);
        this.combatFocusTimer = Math.max(this.combatFocusTimer || 0, 5.0);
        this.spawnSlashArc(ins.x, ins.z, Math.atan2(ins.lungeDirZ, ins.lungeDirX), 3.6, 0xff2238, 0.42, true, {
          primaryColor: '#ff2238',
          secondaryColor: '#ff7852',
          coreColor: '#fff4f4',
          isBossCrimson: true
        });
        this.triggerOnomatopoeia(ins.x, 2.35, ins.z, '裂!', '#ff3b52');
        if (this.directorTimeline) {
          this.directorTimeline.triggerBeat({ zoom: 0.72, holdSec: 0.30, chromatic: 0.42, inkEdge: 0.55 });
        }
        playSfxSafe('sword_slash');
        this.emitSoundRipple(ins.x, ins.z, 68, 'boss');
      }
      this.updateActorSprite(ins, simDt, false);
      return;
    }

    // Vision & target selection (Decoys lure Inspector strongly!)
    var activeDecoy = this.decoys.length > 0 ? this.decoys[0] : null;
    if (activeDecoy && dist2D(ins.x, ins.z, activeDecoy.x, activeDecoy.z) < 34) {
      ins.state = 'INVESTIGATE';
      ins.investigateTarget = { x: activeDecoy.x, z: activeDecoy.z };
      ins.investigateTimer = 4.5;
    } else {
      // Check line-of-sight to player (Stealth Veil drastically cuts sight range)
      var sightRange = p.stealthTimer > 0 ? 5.2 : 21.5;
      var dPlayer = dist2D(ins.x, ins.z, p.x, p.z);
      var seesPlayer = (dPlayer <= sightRange && mapApi.hasLineOfSight(ins.x, ins.z, p.x, p.z));

      if (seesPlayer) {
        if (ins.state !== 'HUNT') {
          playSfxSafe('alert');
          this.spawnFloatingText(ins.x, 2.8, ins.z, '已锁定无票考生!', '#ff2c44');
        }
        ins.state = 'HUNT';
        ins.huntTargetId = 'player';
        ins.huntLoseTimer = 7.0;
      } else {
        // Also check Lu Jin intercepting close by
        var lujin = this.squadById['lujin'];
        if (lujin && lujin.alive && dist2D(ins.x, ins.z, lujin.x, lujin.z) < 8.5 && mapApi.hasLineOfSight(ins.x, ins.z, lujin.x, lujin.z)) {
          ins.state = 'HUNT';
          ins.huntTargetId = 'lujin';
          ins.huntLoseTimer = 4.5;
        }
      }
    }

    // Determine movement target based on state (scaled by Phase-2 mutation & threat tier)
    var targetX = ins.x;
    var targetZ = ins.z;
    var baseSpeed = (isPhase2 ? 5.8 : 5.2) * Math.min(1.22, mutEval.speedMult);

    if (ins.state === 'HUNT') {
      baseSpeed = 7.4 * mutEval.speedMult;
      var tgt = (ins.huntTargetId === 'player') ? p : (this.squadById[ins.huntTargetId] || p);
      if (tgt.alive === false) tgt = p;
      targetX = tgt.x;
      targetZ = tgt.z;

      var dTgt = dist2D(ins.x, ins.z, tgt.x, tgt.z);
      var hasLos = mapApi.hasLineOfSight(ins.x, ins.z, tgt.x, tgt.z);
      if (!hasLos || (tgt === p && p.stealthTimer > 0 && dTgt > 4.5)) {
        ins.kiteTimer = 0;
        ins.huntLoseTimer -= simDt;
        if (ins.huntLoseTimer <= 0) {
          ins.state = 'INVESTIGATE';
          ins.investigateTarget = { x: tgt.x, z: tgt.z };
          ins.investigateTimer = 4.5;
        }
      } else {
        ins.huntLoseTimer = 6.5;

        // Phase-2 Anti-Kite pressure accelerates Blink Ambush cooldown if player kites > 10.5m
        if (isPhase2 && dTgt >= 10.5) {
          ins.kiteTimer = (ins.kiteTimer || 0) + simDt;
          if (ins.kiteTimer >= 3.0) {
            ins.kiteTimer = 0;
            ins.blinkCd = 0;
          }
        } else {
          ins.kiteTimer = Math.max(0, (ins.kiteTimer || 0) - simDt * 1.5);
        }

        var ldx = tgt.x - ins.x;
        var ldz = tgt.z - ins.z;
        var ll = Math.max(0.01, Math.sqrt(ldx * ldx + ldz * ldz));
        var ndx = ldx / ll;
        var ndz = ldz / ll;

        // Threat-level-driven skill cycle via INFINITY.AI.selectInspectorSkillCycle
        var plan = (INFINITY.AI && typeof INFINITY.AI.selectInspectorSkillCycle === 'function')
          ? INFINITY.AI.selectInspectorSkillCycle({
            phase: ins.phase,
            mutated: isPhase2,
            threatLevel: this.threatLevel,
            distToTarget: dTgt,
            hasLos: hasLos,
            cycleIndex: ins.skillCycleIndex || 0,
            cooldowns: {
              blink_ambush: ins.blinkCd || 0,
              slam: ins.slamCd || 0,
              lunge: ins.lungeCd || 0,
              cleave: ins.cleaveCd || 0,
              gaze: ins.gazeCd || 0
            },
            isStunned: ins.stunTimer > 0
          })
          : { skill: 'pursue', nextCycleIndex: ins.skillCycleIndex || 0 };

        ins.skillCycleIndex = plan.nextCycleIndex || 0;

        if (plan.skill === 'blink_ambush') {
          ins.blinkTelegraphMax = plan.telegraphSec || 0.48;
          ins.blinkTelegraph = ins.blinkTelegraphMax;
          ins.blinkTargetX = tgt.x;
          ins.blinkTargetZ = tgt.z;
          ins.pendingWeakpoint = plan.weakpointReason || 'blink_overheat';
          ins.facingLeft = ndx < 0;
          this.spawnFloatingText(ins.x, 3.0, ins.z, plan.callout || '瞬移截击!', '#ff3b52', 'mutation');
          playSfxSafe('alert');
          return;
        }
        if (plan.skill === 'slam') {
          ins.slamTelegraph = plan.telegraphSec || (isPhase2 ? 0.92 : 1.05);
          ins.pendingWeakpoint = plan.exposeWeakpointAfter ? (plan.weakpointReason || 'slam_recovery') : null;
          this.spawnFloatingText(ins.x, 3.0, ins.z, plan.callout || '轨道压制波! 快撤出红圈', '#ff2942');
          playSfxSafe('alert');
          return;
        }
        if (plan.skill === 'lunge') {
          ins.lungeDirX = ndx;
          ins.lungeDirZ = ndz;
          ins.lungeTelegraphMax = plan.telegraphSec || (isPhase2 ? 0.68 : 0.85);
          ins.lungeTelegraph = ins.lungeTelegraphMax;
          ins.lungeWindup = ins.lungeTelegraph;
          ins.facingLeft = ins.lungeDirX < 0;
          this.spawnFloatingText(ins.x, 2.9, ins.z, plan.callout || '处决突刺! (可弹反/破甲)', '#ff3b4f');
          playSfxSafe('alert');
          return;
        }
        if (plan.skill === 'cleave') {
          ins.cleaveDirX = ndx;
          ins.cleaveDirZ = ndz;
          ins.cleaveTelegraph = plan.telegraphSec || (isPhase2 ? 0.48 : 0.55);
          ins.facingLeft = ins.cleaveDirX < 0;
          this.spawnFloatingText(ins.x, 2.85, ins.z, plan.callout || '铁剪横扫!', '#ff3b4f');
          playSfxSafe('alert');
          return;
        }
        if (plan.skill === 'gaze') {
          ins.gazeTargetId = (tgt === p) ? 'player' : tgt.id;
          ins.gazeTelegraph = plan.telegraphSec || (isPhase2 ? 1.10 : 1.25);
          ins.facingLeft = ndx < 0;
          this.spawnFloatingText(ins.x, 2.95, ins.z, plan.callout || '查票凝视! 找掩体/潜行', '#ffd2d8');
          playSfxSafe('alert');
          return;
        }
      }
    } else if (ins.state === 'INVESTIGATE' && ins.investigateTarget) {
      baseSpeed = isPhase2 ? 6.8 : 6.2;
      targetX = ins.investigateTarget.x;
      targetZ = ins.investigateTarget.z;
      ins.investigateTimer -= simDt;
      if (dist2D(ins.x, ins.z, targetX, targetZ) < 1.4 || ins.investigateTimer <= 0) {
        ins.state = 'PATROL';
        ins.investigateTarget = null;
      }
    } else {
      // PATROL route
      var pzId = ins.patrolZones[ins.patrolIdx % ins.patrolZones.length];
      var pz = mapApi.getZoneCenter(pzId);
      targetX = pz.x;
      targetZ = pz.z;
      if (dist2D(ins.x, ins.z, targetX, targetZ) < 2.2) {
        ins.patrolIdx = (ins.patrolIdx + 1) % ins.patrolZones.length;
        ins.repathTimer = 0;
      }
    }

    // Apply slows (Overclock 45% slow, Seal Chain 60% slow)
    if (p.overclockTimer > 0) baseSpeed *= 0.55;
    if (ins.chainTimer > 0) baseSpeed *= 0.40;

    // A* Pathfinding
    ins.repathTimer -= simDt;
    if (ins.repathTimer <= 0) {
      ins.repathTimer = ins.state === 'HUNT' ? 0.5 : 1.3;
      var bPath = mapApi.findPath(ins.x, ins.z, targetX, targetZ);
      ins.path = Array.isArray(bPath) ? bPath : [];
      ins.pathIndex = 0;
    }

    var wp = (ins.path && ins.path[ins.pathIndex]) ? ins.path[ins.pathIndex] : { x: targetX, z: targetZ };
    var dx = wp.x - ins.x;
    var dz = wp.z - ins.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.6 && ins.pathIndex < ins.path.length - 1) {
      ins.pathIndex++;
      wp = ins.path[ins.pathIndex];
      dx = wp.x - ins.x;
      dz = wp.z - ins.z;
      d = Math.sqrt(dx * dx + dz * dz);
    }

    var moving = false;
    if (d > 0.15) {
      var mx = (dx / d) * baseSpeed;
      var mz = (dz / d) * baseSpeed;
      var res = this.moveEntityWithCollision(ins.x, ins.z, ins.x + mx * simDt, ins.z + mz * simDt, ins.radius);
      ins.x = res.x;
      ins.z = res.z;
      if (Math.abs(mx) > 0.2) ins.facingLeft = mx < 0;
      moving = true;
      if (canSeeIns && this.isPointInPuddle(ins.x, ins.z)) {
        ins.puddleAccum = (ins.puddleAccum || 0) + baseSpeed * simDt;
        if (ins.puddleAccum >= 0.78) {
          ins.puddleAccum = 0;
          this.spawnPuddleSplash(ins.x, ins.z, true);
        }
      }
    }

    // Physical Ward Circle blocking enforcement!
    this.enforceWardBlockOnInspector();

    this.updateActorSprite(ins, simDt, moving);
    ins.vis.group.visible = this.canSeeWorldPoint(ins.x, ins.z);
  };

  // ---------------------------------------------------------------------------
  // Damage & Defeat Handling
  // ---------------------------------------------------------------------------
  EngineSession.prototype.damageInspector = function (amount, kbX, kbZ, isCrit, opts) {
    var ins = this.inspector;
    if (!ins.alive) return;

    var wpHit = false;
    var wpEval = null;
    if ((ins.weakpointTimer || 0) > 0 && INFINITY.AI && typeof INFINITY.AI.evaluateWeakpointExposure === 'function') {
      var isFlank = (this.player && ((this.player.x < ins.x) !== Boolean(ins.facingLeft)));
      wpEval = INFINITY.AI.evaluateWeakpointExposure({
        weakpointTimer: ins.weakpointTimer,
        weakpointMaxTimer: ins.weakpointMaxTimer,
        isCrit: Boolean(isCrit),
        isFlank: isFlank,
        baseDamage: amount
      });
      if (wpEval && wpEval.exposed) {
        wpHit = true;
      }
    }

    var calc = computeBossDamageTaken(amount, {
      armorBrokenTimer: ins.armorBrokenTimer,
      stunTimer: ins.stunTimer,
      overridePct: this.overridePct,
      ignoreRuleArmor: wpHit || !!(opts && opts.ignoreRuleArmor)
    });
    var dmg = wpHit ? wpEval.finalDamage : calc.damage;
    ins.hp = Math.max(0, ins.hp - dmg);
    ins.hitFlash = 0.16;
    this.triggerActorSquash(ins, 0.84, 1.18);
    this.stats.damageDealt += dmg;
    playSfxSafe(wpHit ? 'parry_clang' : 'hit_impact');

    if (wpHit) {
      if (wpEval.energyRefund > 0 && this.player) {
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + wpEval.energyRefund);
      }
      if (wpEval.bonusSealPct > 0) {
        ins.sealedPct = Math.min(100, (ins.sealedPct || 0) + wpEval.bonusSealPct);
      }
    }

    var impactCol = wpHit ? 0xffe875 : ((opts && opts.impactColor) || (isCrit ? 0xffe07d : 0xff3b4f));
    if (opts && opts.playerImpact) {
      ins.whiteFlash = Math.max(ins.whiteFlash || 0, wpHit ? 0.14 : 0.09);
      this.hitStopTimer = Math.max(this.hitStopTimer, opts.hitStop || 0.05);
      if (isCrit || wpHit) {
        this.triggerImpactFrame(0.068);
      }
      if (kbX || kbZ) {
        var kLen = Math.max(0.01, Math.sqrt((kbX || 0) * (kbX || 0) + (kbZ || 0) * (kbZ || 0)));
        this.addCameraKick(((kbX || 0) / kLen) * 0.42, ((kbZ || 0) / kLen) * 0.42);
      }
    }

    if (kbX || kbZ) {
      this.applyKnockbackWithWallBounce(ins, kbX, kbZ, 0.28, { announceWallSlam: !!(opts && opts.playerImpact) });
      this.enforceWardBlockOnInspector();
    }

    if (opts && opts.playerImpact) {
      this.combatFocusTimer = Math.max(this.combatFocusTimer || 0, 5.0);
      if (isCrit || wpHit) {
        this.triggerOnomatopoeia(ins.x + (Math.random() - 0.5) * 0.6, 1.95, ins.z, dmg >= 45 ? '轟!' : '斬!', '#ffd86b');
        if (this.directorTimeline) {
          this.directorTimeline.triggerBeat({ chromatic: 0.65, inkEdge: 0.65 });
        }
      } else if (Math.random() < 0.55) {
        this.triggerOnomatopoeia(ins.x + (Math.random() - 0.5) * 0.5, 1.85, ins.z, '斬!', '#78f0ff');
      }
    }
    if (wpHit && INFINITY.CombatFeel && typeof INFINITY.CombatFeel.triggerBossWeakpointHitFeel === 'function') {
      INFINITY.CombatFeel.triggerBossWeakpointHitFeel(this, ins.x, ins.z, dmg, { callout: wpEval.callout });
    } else {
      var dmgLabel = (isCrit ? '★-' : '-') + dmg + (calc.armorVulnerable ? ' 破防' : '');
      var dmgColor = calc.armorVulnerable ? '#ffd86b' : (calc.armorMitigated ? '#9fb3c8' : (isCrit ? '#ffd86b' : '#edf3fa'));
      this.spawnFloatingText(ins.x, 2.5, ins.z, dmgLabel, dmgColor, (isCrit || calc.armorVulnerable) ? 'crit' : 'normal');
      if (calc.armorMitigated && opts && opts.playerImpact && (ins.armorMsgCd || 0) <= 0) {
        ins.armorMsgCd = 3.5;
        this.spawnFloatingText(ins.x, 3.05, ins.z, '规则护甲减伤! (弹反/EMP/封印破甲)', '#a8c2d8');
      }
      this.spawnSparkBurst(ins.x, 1.3, ins.z, impactCol, isCrit ? 16 : 9);
      if (isCrit) {
        this.spawnImpactStar(ins.x, 1.4, ins.z, impactCol, 2.0, 0.24);
      }
    }

    // Taking damage alerts Inspector toward player if not stunned
    if (ins.stunTimer <= 0 && this.player.stealthTimer <= 0) {
      ins.state = 'HUNT';
      ins.huntTargetId = 'player';
      ins.huntLoseTimer = 7.5;
    }

    var hpDealtPct = Math.round(((ins.maxHp - ins.hp) / Math.max(1, ins.maxHp)) * 100);
    var combatPct = Math.max(hpDealtPct, Math.round(ins.sealedPct || 0));
    if (!this.missionFlags.inspectorEngaged) {
      this.missionFlags.inspectorEngaged = true;
      this.setBranchState('inspector_hunt', 'active', '已与零号检票员正面交锋（剩余 HP ' + Math.round(ins.hp) + '/' + Math.round(ins.maxHp) + '）。', combatPct);
      this.recordMissionEvent(
        'branch',
        '分支开启 · 正面交锋检票员',
        '首次对零号检票员造成有效伤害，解锁正面击杀 / 规则封印破局路径。',
        { branchId: 'inspector_hunt' }
      );
    } else if (ins.hp > 0 && hpDealtPct >= 50 && !this.missionFlags.inspectorHalfHp) {
      this.missionFlags.inspectorHalfHp = true;
      this.setBranchState('inspector_hunt', 'active', '零号检票员护壳受损过半（剩余 HP ' + Math.round(ins.hp) + '/' + Math.round(ins.maxHp) + '）。', combatPct);
      this.recordMissionEvent(
        'progress',
        '检票员生命削减过半 (' + hpDealtPct + '%)',
        '零号检票员已进入二阶段变异态，抓住大招收尾或破甲后的弱点核心窗口集火！',
        { branchId: 'inspector_hunt' }
      );
    } else if (ins.hp > 0) {
      this.branches.inspector_hunt.progressPct = combatPct;
      this.branches.inspector_hunt.outcome = '交战中 · 剩余 HP ' + Math.round(ins.hp) + '/' + Math.round(ins.maxHp) + ' · 封印 ' + Math.round(ins.sealedPct || 0) + '%';
    }

    if (ins.hp <= 0) {
      this.defeatInspector(false);
    } else if (ins.sealedPct >= 100) {
      this.defeatInspector(true);
    }
  };

  EngineSession.prototype.defeatInspector = function (sealed) {
    var ins = this.inspector;
    if (!ins.alive) return;
    ins.alive = false;
    ins.hp = 0;
    ins.weakpointTimer = 0;
    ins.weakpointMaxTimer = 0;
    ins.weakpointReason = null;
    ins.blinkTelegraph = 0;
    ins.pendingWeakpoint = null;
    ins.teleMesh.visible = false;
    ins.teleFill.visible = false;
    if (ins.cleaveMesh) ins.cleaveMesh.visible = false;
    if (ins.gazeBeam) ins.gazeBeam.visible = false;
    if (ins.slamRing) ins.slamRing.visible = false;
    if (ins.teleParryGlint) ins.teleParryGlint.visible = false;
    if (ins.weakpointVis && ins.weakpointVis.group) ins.weakpointVis.group.visible = false;
    ins.vis.group.visible = false;

    this.stats.inspectorDefeated = true;
    this.stats.inspectorSealed = !!sealed;
    this.hitStopTimer = 0.14;
    this.triggerImpactFrame(0.09);
    this.camFovPunch = -4.2;
    this.addCameraShake(0.65, 0.48);
    var finCol = sealed ? 0xf0c46c : 0xff3b4f;
    this.spawnImpactStar(ins.x, 1.55, ins.z, finCol, 4.4, 0.55);
    this.spawnSigilPulse(ins.x, ins.z, 5.2, sealed ? 'occult_eye' : 'blood_crest', finCol, 1.0);
    this.spawnShockRing(ins.x, ins.z, 7.2, finCol, 0.95);
    this.spawnShockRing(ins.x, ins.z, 4.2, 0xffffff, 0.55);
    this.spawnSparkBurst(ins.x, 1.4, ins.z, finCol, 34);
    playSfxSafe('fusion');

    this.setBranchState(
      'inspector_hunt',
      'completed',
      sealed ? '零号检票员已被 100% 规则封印，0 号站台撤离限制全面解除！' : '零号检票员已被正面击杀，斩断检票钳破局达成！',
      100
    );
    this.recordMissionEvent(
      'branch',
      sealed ? '破局达成 · 规则封印检票员' : '破局达成 · 击杀零号检票员',
      '规则实体已彻底瓦解，即将进入 A+ 级考场终局结算。',
      { branchId: 'inspector_hunt' }
    );

    this.emitRadio({
      type: 'system',
      text: sealed
        ? '【规则收容完成】零号检票员已被完全封印！0号站台撤离限制解除！'
        : '【目标击破】零号检票员已彻底瓦解，胸口拟态广播发射源化为黑灰！'
    });

    // Dramatic brief moment before triggering victory ending
    var self = this;
    this.vfxList.push({
      persistent: true, // gameplay timer: victory ending fires on expiry
      ttl: 1.55,
      maxTtl: 1.55,
      update: function (dt) {
        this.ttl -= dt;
        if (this.ttl <= 0 && !self.ended) {
          self.finishExam('kill_inspector');
        }
      },
      dispose: function () {}
    });
  };

  EngineSession.prototype.damagePlayer = function (amount, kbX, kbZ) {
    var p = this.player;
    if (p.invulnTimer > 0 || this.ended) return;

    var dmg = Math.max(1, Math.round(amount));
    if (this.isInsideAnyWard(p.x, p.z)) {
      dmg = Math.round(dmg * 0.55);
    }

    // Aegis Shield absorption + ripple reflection + shatter burst on break!
    if (p.shieldHp > 0) {
      var absorbed = Math.min(p.shieldHp, dmg);
      var shCol = p.shieldColor || 0x66e8ff;
      p.shieldHp -= absorbed;
      dmg -= absorbed;
      this.triggerActorSquash(p, 1.18, 0.86);
      this.spawnFloatingText(p.x, 2.3, p.z, '护盾吸收 ' + absorbed, '#66e8ff');
      this.spawnShockRing(p.x, p.z, 3.2, shCol, 0.38);
      this.spawnImpactStar(p.x, 1.15, p.z, shCol, 1.8, 0.22);
      this.spawnSkillParticleFx(
        { archetype: 'aegis_shield', tier: 'A', color: '#' + (shCol >>> 0).toString(16).padStart(6, '0') },
        p.x, 1.05, p.z, 0, 1.8,
        { triggerAnimOverride: 'shield_refract', intensityScale: 0.9 }
      );
      if (p.shieldHp <= 0) {
        this.spawnShieldShatter(p.x, 1.05, p.z, shCol);
        this.spawnFloatingText(p.x, 2.7, p.z, '护盾碎裂！', '#ff8866');
      }
      playSfxSafe('ward_place');
      if (this.inspector.alive && dist2D(p.x, p.z, this.inspector.x, this.inspector.z) < 4.5) {
        var rx = this.inspector.x - p.x;
        var rz = this.inspector.z - p.z;
        var rl = Math.max(0.01, Math.sqrt(rx * rx + rz * rz));
        this.damageInspector(12, (rx / rl) * 6.0, (rz / rl) * 6.0, false, { impactColor: shCol });
      }
      if (dmg <= 0) {
        p.invulnTimer = 0.45;
        return;
      }
    }

    p.hp = Math.max(0, p.hp - dmg);
    p.sanity = Math.max(0, p.sanity - 5);
    p.hitFlash = 0.26;
    p.invulnTimer = 0.65;
    this.triggerActorSquash(p, 0.78, 1.24);
    this.stats.damageTaken += dmg;
    this.glitchAmount = Math.max(this.glitchAmount, 0.65);
    this.addCameraShake(0.45, 0.28);
    this.hitStopTimer = 0.06;

    if (kbX || kbZ) {
      var kLenP = Math.max(0.01, Math.sqrt((kbX || 0) * (kbX || 0) + (kbZ || 0) * (kbZ || 0)));
      this.addCameraKick(((kbX || 0) / kLenP) * 0.48, ((kbZ || 0) / kLenP) * 0.48);
      this.applyKnockbackWithWallBounce(p, kbX, kbZ, 0.22, null);
    }

    this.spawnFloatingText(p.x, 2.3, p.z, '-' + dmg + ' HP', '#ff3b4f');
    playSfxSafe('hit_impact');

    if (p.hp <= 0) {
      this.finishExam('wipeout');
    }
  };

  EngineSession.prototype.damageAlly = function (ally, amount) {
    if (!ally || !ally.alive) return;
    var dmg = Math.max(1, Math.round(amount));
    if (this.isInsideAnyWard(ally.x, ally.z)) dmg = Math.round(dmg * 0.55);
    ally.hp = Math.max(0, ally.hp - dmg);
    if (typeof ally.sanity === 'number') {
      ally.sanity = Math.max(0, ally.sanity - Math.round(dmg * 0.45));
    }
    ally.hitFlash = 0.24;
    this.spawnFloatingText(ally.x, 2.2, ally.z, '-' + dmg, '#ff7766');
    if (ally.hp <= 0) {
      ally.alive = false;
      this.setBranchState('squad_tactics', 'warning', ally.name + '在考场内重伤失联，小队战力受损。', 100);
      this.recordMissionEvent(
        'warning',
        '队友失联 · ' + ally.name,
        ally.name + '生命体征归零，已退出本场实时协同。',
        { branchId: 'squad_tactics' }
      );
      this.emitRadio({
        type: 'system',
        text: '【队友重伤失联】' + ally.name + '已倒下，失去行动能力！'
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Ghost Train No.0 Animation (~55s cycle)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.updateGhostTrain = function (simDt) {
    if (!this.train) return;
    var tr = this.train;
    var trainX = (this.mapApi && this.mapApi.TRAIN_X) || TRAIN_X;
    var gridH = (this.mapApi && this.mapApi.GRID_H) || 152;
    var targetDockZ = Math.round(gridH * 0.72);
    var departEndZ = gridH + 66;

    if (this.trainPhase === 'waiting') {
      this.trainCountdownSec -= simDt;
      if (this.trainCountdownSec <= 5.5 && !this.trainWarned) {
        this.trainWarned = true;
        playSfxSafe('train_horn');
        this.emitRadio({
          type: 'broadcast',
          speaker: '站台铁轨震动',
          text: '【铁轨低频轰鸣】零号幽灵列车即将在 5 秒后驶入 0 号站台！请勿滞留铁轨与黄线边缘！'
        });
      }
      if (this.trainCountdownSec <= 0) {
        this.trainCountdownSec = 0;
        this.trainPhase = 'arriving';
        tr.z = -64;
        tr.group.visible = true;
        tr.group.position.set(trainX, RAIL_Y + 0.12, tr.z);
        playSfxSafe('train_horn');
      }
    } else if (this.trainPhase === 'arriving') {
      var rem = targetDockZ - tr.z;
      var spd = clamp(rem * 1.45, 4.0, 42);
      tr.z += spd * simDt;
      tr.group.position.z = tr.z;
      if (dist2D(this.player.x, this.player.z, trainX, gridH * 0.5) < 36) {
        this.addCameraShake(0.08, 0.1);
      }
      this.checkTrainCollision();
      if (tr.z >= targetDockZ - 0.15) {
        tr.z = targetDockZ;
        this.trainPhase = 'docked';
        this.trainInStation = true;
        this.trainTimer = TRAIN_DWELL_SEC;
        if (this.branches.ghost_train.status === 'locked') {
          this.setBranchState('ghost_train', 'active', '零号列车已停靠 0 号站台，车门短暂开启（未反转前强登将触发 B 级次优结局）。', 50);
        }
        this.recordMissionEvent(
          'progress',
          '零号幽灵列车进站停靠',
          '车门开启停靠 0 号站台；道岔未反转前切勿盲目越线登车。',
          { branchId: 'ghost_train', zoneId: 'platform0' }
        );
        this.emitRadio({
          type: 'narration',
          text: '【零号列车停靠】车门无声滑开，车厢内部漆黑一片；车灯正死死照向 0 号站台黄线。'
        });
      }
    } else if (this.trainPhase === 'docked') {
      this.trainTimer -= simDt;
      if (this.trainTimer <= 0) {
        this.trainPhase = 'departing';
        this.trainInStation = false;
        playSfxSafe('train_horn');
      }
    } else if (this.trainPhase === 'departing') {
      tr.z += 38 * simDt;
      tr.group.position.z = tr.z;
      this.checkTrainCollision();
      if (tr.z >= departEndZ) {
        tr.group.visible = false;
        this.trainPhase = 'waiting';
        this.trainCountdownSec = TRAIN_CYCLE_SEC;
        this.trainWarned = false;
      }
    }
  };

  EngineSession.prototype.checkTrainCollision = function () {
    var p = this.player;
    var trainX = (this.mapApi && this.mapApi.TRAIN_X) || TRAIN_X;
    if (p.x >= trainX - 1.65 && p.x <= trainX + 1.65 && p.z <= this.train.z + 3.4 && p.z >= this.train.z - 62) {
      this.damagePlayer(40, -10, 0);
      this.showSpeechBubble('player', '快退回月台！差点被零号列车卷进去！');
    }
  };

  // ---------------------------------------------------------------------------
  // Fake Broadcasts & Acoustic Ripple System
  // ---------------------------------------------------------------------------
  EngineSession.prototype.triggerFakeBroadcast = function (customText) {
    var list = (INFINITY.SCENARIOS && INFINITY.SCENARIOS.station_zero && INFINITY.SCENARIOS.station_zero.fakeBroadcasts) || null;
    var text = customText;
    if (!text) {
      if (list && list.length > 0) {
        var item = list[this.fakeBroadcastIndex % list.length];
        text = item.text || String(item);
      } else {
        text = DEFAULT_FAKE_BROADCASTS[this.fakeBroadcastIndex % DEFAULT_FAKE_BROADCASTS.length];
      }
      this.fakeBroadcastIndex++;
    }

    this.activeFakeBroadcastTimer = 5.5;
    this.pendingYanciExposeTimer = 2.2;
    this.glitchAmount = Math.max(this.glitchAmount, 0.85);
    playSfxSafe('glitch_burst');

    var sanHit = Math.round(7 * (1 - this.passives.memeResist));
    if (sanHit > 0) {
      this.player.sanity = Math.max(0, this.player.sanity - sanHit);
    }
    for (var fbi = 0; fbi < this.squad.length; fbi++) {
      var sqUnit = this.squad[fbi];
      if (sqUnit.alive && typeof sqUnit.sanity === 'number') {
        sqUnit.sanity = Math.max(8, sqUnit.sanity - 9);
      }
    }

    this.emitRadio({
      type: 'broadcast',
      speaker: '【疑似系统播报】',
      text: text,
      fake: true,
      timeGlitch: true
    });
    if (this.branches.fake_broadcast.status !== 'completed') {
      this.setBranchState('fake_broadcast', 'triggered', '截获 43.2Hz 伪造系统播报！可用 EMP 打断或等待严辞核对腕表拆穿。', 50);
    }
    this.recordMissionEvent(
      'branch',
      '触发规则陷阱 · 43.2Hz 拟态假播报',
      text.slice(0, 68) + (text.length > 68 ? '…' : ''),
      { branchId: 'fake_broadcast' }
    );
  };

  EngineSession.prototype.updateBroadcasts = function (simDt) {
    if (this.activeFakeBroadcastTimer > 0) {
      this.activeFakeBroadcastTimer = Math.max(0, this.activeFakeBroadcastTimer - simDt);
    }

    if (this.pendingYanciExposeTimer > 0) {
      this.pendingYanciExposeTimer -= simDt;
      if (this.pendingYanciExposeTimer <= 0) {
        var yc = this.squadById['yanci'];
        if (yc && yc.alive && this.activeFakeBroadcastTimer > 0) {
          var expose = '腕表秒针未震动，尾音滞后0.3秒——这是检票员的假播报，别上当！';
          this.showSpeechBubble('yanci', expose);
          this.emitRadio({ type: 'dialogue', npcId: 'yanci', speaker: '严辞', text: expose });
          if (this.branches.fake_broadcast.status !== 'completed') {
            this.setBranchState('fake_broadcast', 'completed', '严辞借腕表秒针相位差拆穿 0.3 秒延迟假播报，全队识破诱捕回路。', 100);
            this.recordMissionEvent(
              'branch',
              '分支破解 · 严辞拆穿假播报',
              '确认播报源为检票员胸口对讲机，剔除“强制登车”虚假指令。',
              { branchId: 'fake_broadcast' }
            );
          }
        }
      }
    }

    if (this.inspector.alive && this.inspector.stunTimer <= 0) {
      this.fakeBroadcastTimer -= simDt;
      if (this.fakeBroadcastTimer <= 0) {
        this.fakeBroadcastTimer = 42;
        this.triggerFakeBroadcast();
      }
    }
  };

  EngineSession.prototype.emitSoundRipple = function (x, z, strength, sourceTag) {
    var THREE = this.THREE;
    var s = clamp(Number(strength) || 30, 8, 100);
    if (sourceTag === 'player' || sourceTag === 'attack' || sourceTag === 'skill' || sourceTag === 'console') {
      this.soundLevel = clamp(Math.max(this.soundLevel, s * 0.9), 0, 100);
    }

    var color = 0x6fd8ea;
    if (sourceTag === 'console' || sourceTag === 'console_done' || sourceTag === 'decoy') color = 0xffa838;
    else if (sourceTag === 'boss' || sourceTag === 'yellow_line') color = 0xff2c44;
    else if (sourceTag === 'shenyan') color = 0xc9a66b;

    var isSubtleFootstep = (sourceTag === 'player' && s < 35);
    var maxRad = isSubtleFootstep ? (1.1 + s * 0.04) : (1.6 + s * 0.08);
    var baseOp = isSubtleFootstep ? 0.22 : 0.55;
    var geo = new THREE.RingGeometry(0.86, 1.0, 28);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: baseOp,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.09, z);
    mesh.scale.set(0.3, 0.3, 1);
    this.scene.add(mesh);

    this.soundRipples.push({
      mesh: mesh,
      geo: geo,
      mat: mat,
      baseOp: baseOp,
      ttl: isSubtleFootstep ? 0.45 : 0.72,
      maxTtl: isSubtleFootstep ? 0.45 : 0.72,
      maxRad: maxRad
    });

    // Alert Inspector if within hearing range
    var ins = this.inspector;
    if (ins && ins.alive && ins.stunTimer <= 0 && sourceTag !== 'boss') {
      var hearRange = 7.0 + s * 0.24;
      var d = dist2D(x, z, ins.x, ins.z);
      if (sourceTag === 'decoy' && d <= 28) {
        ins.state = 'INVESTIGATE';
        ins.investigateTarget = { x: x, z: z };
        ins.investigateTimer = 5.5;
        ins.repathTimer = 0;
      } else if ((d <= hearRange || s >= 78) && ins.state !== 'HUNT') {
        ins.state = 'INVESTIGATE';
        ins.investigateTarget = { x: x, z: z };
        ins.investigateTimer = 5.5;
        ins.repathTimer = 0;
      }
    }
  };

  EngineSession.prototype.updateSoundRipples = function (simDt) {
    for (var i = this.soundRipples.length - 1; i >= 0; i--) {
      var sr = this.soundRipples[i];
      sr.ttl -= simDt;
      var p = 1 - clamp(sr.ttl / sr.maxTtl, 0, 1);
      var sc = 0.3 + p * sr.maxRad;
      sr.mesh.scale.set(sc, sc, 1);
      sr.mat.opacity = (sr.baseOp || 0.55) * (1 - p);
      if (sr.ttl <= 0) {
        this.scene.remove(sr.mesh);
        disposeOwned(sr.geo);
        disposeOwned(sr.mat);
        this.soundRipples.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.updateSoundAndThreat = function (simDt) {
    this.soundLevel = Math.max(4, this.soundLevel - 16 * simDt);

    var ins = this.inspector;
    var targetThreat = 10;
    if (ins.alive) {
      var d = dist2D(this.player.x, this.player.z, ins.x, ins.z);
      var proxThreat = clamp((22 - d) * 3.8, 0, 75);
      var stateBonus = ins.state === 'HUNT' ? 28 : (ins.state === 'INVESTIGATE' ? 12 : 0);
      targetThreat = clamp(proxThreat + stateBonus + (this.activeFakeBroadcastTimer > 0 ? 12 : 0), 8, 100);
    }
    this.threatLevel = lerp(this.threatLevel, targetThreat, 1 - Math.exp(-3 * simDt));
    setAudioThreatSafe(this.threatLevel);
  };

  EngineSession.prototype.checkWinLoss = function () {
    if (this.ended) return;
    if (this.player.hp <= 0) {
      this.finishExam('wipeout');
    } else if (this.timeRemainingSec <= 0) {
      this.finishExam(this.overridePct >= 100 ? 'perfect_override' : 'forced_board_survive');
    }
  };

  EngineSession.prototype.finishExam = function (endingType) {
    if (this.ended) return;
    this.ended = true;
    this.emitHudSnapshot();
    if (this.callbacks && typeof this.callbacks.onExamEnd === 'function') {
      try {
        this.callbacks.onExamEnd(endingType, {
          endingType: endingType,
          overridePct: this.overridePct,
          cluesFoundCount: this.discoveredClueIds.length,
          discoveredClueIds: this.discoveredClueIds.slice(),
          hp: Math.round(this.player.hp),
          sanity: Math.round(this.player.sanity),
          damageDealt: this.stats.damageDealt,
          damageTaken: this.stats.damageTaken,
          parries: this.stats.parries,
          skillsCast: this.stats.skillsCast,
          fakeBroadcastsCancelled: this.stats.fakeBroadcastsCancelled,
          inspectorDefeated: this.stats.inspectorDefeated,
          inspectorSealed: this.stats.inspectorSealed,
          elapsedSec: Math.round(this.stats.elapsedSec),
          survivorIds: this.squad.filter(function (s) { return s.alive; }).map(function (s) { return s.id; })
        });
      } catch (_) {}
    }
  };

  // ---------------------------------------------------------------------------
  // 3D VFX Spawners (Multi-Layer Motif VFX: Slash, Beam, Chains, Bolts, Sigils,
  // Heal Pillar, Stealth Scan, Recon Radar, Berserk Slam, Shield Shatter, NPCs)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.spawnSkillParticleFx = function (skillOrId, x, y, z, angle, radius, extraOpts) {
    if (!this.skillsApi || !this.skillsApi.ParticleVfx || typeof this.skillsApi.ParticleVfx.trigger !== 'function') {
      return null;
    }
    var opts = Object.assign({
      x: x,
      y: typeof y === 'number' ? y : 1.0,
      z: z,
      angle: angle || 0,
      radius: radius
    }, extraOpts || {});
    var handle = this.skillsApi.ParticleVfx.trigger(this.THREE, this.scene, skillOrId, opts);
    if (handle) {
      this.vfxList.push(handle);
    }
    return handle;
  };

  EngineSession.prototype.spawnResonanceGlobalVfx = function (resonance, x, z, angle) {
    if (!resonance) return null;
    var pHex = (resonance.colors && resonance.colors.primaryHex != null) ? resonance.colors.primaryHex : 0xc89eff;
    var sHex = (resonance.colors && resonance.colors.secondaryHex != null) ? resonance.colors.secondaryHex : 0x52e5ff;
    // Downgraded from arena-wide screen clutter to a crisp caster rim pulse (keeps <= 3 layers per cast)
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnResonanceRimPulse === 'function') {
      INFINITY.VfxStudio.spawnResonanceRimPulse(this, x, z, pHex, sHex, resonance.level || 1);
    } else {
      this.spawnShockRing(x, z, 3.2 + (resonance.level || 1) * 0.6, pHex, 0.42);
    }
    this.camFovPunch = Math.min(this.camFovPunch || 0, -1.2);
    this.addCameraShake(0.14, 0.18, 28);
    if (this.playerGlow) {
      var glowRef = this.playerGlow;
      var origHex = glowRef.color.getHex();
      var origInt = glowRef.intensity;
      var peakInt = Math.max(origInt, 2.1 + (resonance.level || 1) * 0.3);
      glowRef.color.setHex(pHex);
      glowRef.intensity = peakInt;
      this.vfxList.push({
        ttl: 0.55,
        maxTtl: 0.55,
        update: function (dt) {
          this.ttl -= dt;
          var k = clamp(this.ttl / this.maxTtl, 0, 1);
          glowRef.intensity = origInt + (peakInt - origInt) * k;
        },
        dispose: function () {
          glowRef.color.setHex(origHex);
          glowRef.intensity = origInt;
        }
      });
    }
    return true;
  };

  EngineSession.prototype.spawnSlashArc = function (x, z, angle, radius, colorHex, duration, heavy, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnSlashArc === 'function') {
      INFINITY.VfxStudio.spawnSlashArc(this, x, z, angle, radius, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnLaserBeam = function (x0, z0, x1, z1, colorHex, duration, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnLaserBeam === 'function') {
      INFINITY.VfxStudio.spawnLaserBeam(this, x0, z0, x1, z1, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnSealChainsVfx = function (x0, z0, x1, z1, colorHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnSealChainsVfx === 'function') {
      INFINITY.VfxStudio.spawnSealChainsVfx(this, x0, z0, x1, z1, 2.4, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnShockRing = function (x, z, maxRadius, colorHex, duration) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnWaveRing === 'function') {
      INFINITY.VfxStudio.spawnWaveRing(this, x, z, maxRadius, colorHex, duration, 0);
    }
  };

  EngineSession.prototype.spawnSparkBurst = function (x, y, z, colorHex, count) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnSparkBurst === 'function') {
      INFINITY.VfxStudio.spawnSparkBurst(this, x, y, z, colorHex, count);
    }
  };

  EngineSession.prototype.spawnAfterimage = function (x, z, actorId, facingLeft, colorHex, duration, frame) {
    var THREE = this.THREE;
    var isBoss = actorId === 'inspector';
    var dim = isBoss ? ACTOR_DIMENSIONS.inspector : (actorId === 'player' ? ACTOR_DIMENSIONS.player : ACTOR_DIMENSIONS.squad);
    var resolvedFrame = (actorId === 'player' && frame === 'dash') ? 'smear' : (frame || 'action');
    var tex = this.getCharTex(actorId, resolvedFrame);
    var geo = new THREE.PlaneGeometry(dim.width, dim.height);
    // Ink-silhouette backing with crisp colored tint (eliminates washed-out white additive ghosts)
    var mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: colorHex || 0x4df8ff,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, dim.height * 0.5 + 0.04, z);
    mesh.rotation.x = -CAMERA_25D_SPEC.spriteTiltRad;
    mesh.scale.x = facingLeft ? -1 : 1;
    this.scene.add(mesh);

    var self = this;
    var dur = duration || 0.32;
    this.vfxList.push({
      ttl: dur,
      maxTtl: dur,
      update: function (dt) {
        this.ttl -= dt;
        var frac = clamp(this.ttl / this.maxTtl, 0, 1);
        mat.opacity = 0.44 * frac * frac;
      },
      dispose: function () {
        self.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnScorchDecal = function (x, z, angle, radius, colorHex) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnScorchDecal === 'function') {
      INFINITY.VfxStudio.spawnScorchDecal(this, x, z, (radius || 2.8) * 0.55, colorHex, 2.8);
    }
  };

  EngineSession.prototype.spawnLightningBolt = function (x0, y0, z0, x1, y1, z1, colorHex, duration, segments) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnLightningBolt === 'function') {
      INFINITY.VfxStudio.spawnLightningBolt(this, x0, y0, z0, x1, y1, z1, colorHex, duration, segments);
    }
  };

  EngineSession.prototype.spawnImpactStar = function (x, y, z, colorHex, scale, duration) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnImpactStar === 'function') {
      INFINITY.VfxStudio.spawnImpactStar(this, x, y, z, colorHex, scale, duration);
    }
  };

  EngineSession.prototype.spawnSigilPulse = function (x, z, size, sigilStyle, colorHex, duration) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnSigilPulse === 'function') {
      INFINITY.VfxStudio.spawnSigilPulse(this, x, z, (size || 2.4) * 0.55, sigilStyle, colorHex, duration);
    }
  };

  EngineSession.prototype.spawnFootstepRipple = function (x, z, colorHex, maxRadius, vx, vz) {
    var isPuddle = this.isPointInPuddle(x, z);
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnInkStepPuff === 'function') {
      INFINITY.VfxStudio.spawnInkStepPuff(this, x, z, vx || 0, vz || 0, colorHex, isPuddle);
      return;
    }
    var THREE = this.THREE;
    var maxR = maxRadius || 0.44;
    var geo = new THREE.RingGeometry(0.74, 1.0, 18);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x7ec8e8,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.045, z);
    mesh.scale.set(0.12, 1, 0.12);
    this.scene.add(mesh);

    var self = this;
    this.vfxList.push({
      ttl: 0.36,
      maxTtl: 0.36,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var sc = 0.12 + p * maxR;
        mesh.scale.set(sc, 1, sc);
        mat.opacity = 0.34 * (1 - p);
      },
      dispose: function () {
        self.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnHealPillarVfx = function (x, z, radius, colorHex, secHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnHealPillarVfx === 'function') {
      INFINITY.VfxStudio.spawnHealPillarVfx(this, x, z, radius, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnStealthBurstVfx = function (x, z, colorHex, secHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnStealthBurstVfx === 'function') {
      INFINITY.VfxStudio.spawnStealthBurstVfx(this, x, z, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnReconSweepVfx = function (x, z, maxRadius, colorHex, secHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnReconSweepVfx === 'function') {
      INFINITY.VfxStudio.spawnReconSweepVfx(this, x, z, maxRadius, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnBerserkSlamVfx = function (x, z, radius, colorHex, secHex, vfx) {
    if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnBerserkSlamVfx === 'function') {
      INFINITY.VfxStudio.spawnBerserkSlamVfx(this, x, z, radius, colorHex, vfx);
    }
  };

  EngineSession.prototype.spawnShieldShatter = function (x, y, z, colorHex) {
    var THREE = this.THREE;
    var col = colorHex || 0x58e6ff;
    var group = new THREE.Group();
    var geos = [];
    var mats = [];
    var shards = [];

    for (var i = 0; i < 12; i++) {
      var sGeo = new THREE.CircleGeometry(0.18 + Math.random() * 0.12, 3);
      var sMat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xffffff : col,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      var m = new THREE.Mesh(sGeo, sMat);
      var a = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      var rad = 0.45 + Math.random() * 0.25;
      m.position.set(x + Math.cos(a) * rad, (y || 1.05) + (Math.random() - 0.3) * 0.6, z + Math.sin(a) * rad);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      group.add(m);
      geos.push(sGeo);
      mats.push(sMat);
      var spd = 2.6 + Math.random() * 3.4;
      shards.push({
        mesh: m,
        mat: sMat,
        vx: Math.cos(a) * spd,
        vy: 1.4 + Math.random() * 2.8,
        vz: Math.sin(a) * spd,
        rx: (Math.random() - 0.5) * 14,
        ry: (Math.random() - 0.5) * 14
      });
    }

    this.scene.add(group);
    this.spawnShockRing(x, z, 2.2, col, 0.36);

    var self = this;
    this.vfxList.push({
      ttl: 0.56,
      maxTtl: 0.56,
      update: function (dt) {
        this.ttl -= dt;
        var frac = clamp(this.ttl / this.maxTtl, 0, 1);
        for (var k = 0; k < shards.length; k++) {
          var sh = shards[k];
          sh.mesh.position.x += sh.vx * dt;
          sh.mesh.position.y = Math.max(0.08, sh.mesh.position.y + sh.vy * dt);
          sh.mesh.position.z += sh.vz * dt;
          sh.vy -= 9.5 * dt;
          sh.mesh.rotation.x += sh.rx * dt;
          sh.mesh.rotation.y += sh.ry * dt;
          sh.mat.opacity = 0.95 * frac;
        }
      },
      dispose: function () {
        self.scene.remove(group);
        for (var gi = 0; gi < geos.length; gi++) disposeOwned(geos[gi]);
        for (var mi = 0; mi < mats.length; mi++) disposeOwned(mats[mi]);
      }
    });
  };

  EngineSession.prototype.spawnNpcSignatureVfx = function (npcId, x, z, angle) {
    var THREE = this.THREE;
    var ang = angle || 0;

    if (npcId === 'yanci') {
      // 严辞: Golden law-scale sigil + decree shock ring + golden motes
      this.spawnSigilPulse(x, z, 2.35, 'arcane_star', 0xf0c46c, 0.65);
      this.spawnShockRing(x, z, 2.1, 0xf0c46c, 0.45);
      this.spawnSparkBurst(x, 1.05, z, 0xffe484, 8);
      return;
    }

    if (npcId === 'lujin') {
      // 陆烬: Amber rail muzzle flare + hot brass sparks perpendicular to firing line
      this.spawnImpactStar(x, 1.08, z, 0xff9c3b, 1.35, 0.18);
      var perpA = ang + Math.PI * 0.5;
      this.spawnSparkBurst(x + Math.cos(perpA) * 0.18, 1.02, z + Math.sin(perpA) * 0.18, 0xffd27a, 7);
      return;
    }

    if (npcId === 'xutan') {
      // 许檀: Cyan holographic PKE radar fan sweep + tactical sigil
      this.spawnSigilPulse(x, z, 2.1, 'tactical_hud', 0x58e6ff, 0.6);
      var fanGeo = new THREE.RingGeometry(0.35, 3.6, 20, 1, -Math.PI * 0.2, Math.PI * 0.4);
      fanGeo.rotateX(-Math.PI / 2);
      var fanMat = new THREE.MeshBasicMaterial({
        color: 0x58e6ff,
        transparent: true,
        opacity: 0.44,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      var fanMesh = new THREE.Mesh(fanGeo, fanMat);
      fanMesh.position.set(x, 0.12, z);
      fanMesh.rotation.y = -ang;
      this.scene.add(fanMesh);
      var self = this;
      this.vfxList.push({
        ttl: 0.52,
        maxTtl: 0.52,
        update: function (dt) {
          this.ttl -= dt;
          var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
          var sc = 0.45 + p * 0.85;
          fanMesh.scale.set(sc, 1, sc);
          fanMesh.rotation.y = -ang + (p - 0.5) * 0.55;
          fanMat.opacity = 0.44 * (1 - p);
        },
        dispose: function () {
          self.scene.remove(fanMesh);
          fanGeo.dispose();
          fanMat.dispose();
        }
      });
      return;
    }

    if (npcId === 'shenyan') {
      // 沈砚: Dark-red forged stopwatch pulse + static lightning crackles
      this.spawnSigilPulse(x, z, 2.5, 'occult_eye', 0xa8509a, 0.7);
      this.spawnShockRing(x, z, 2.4, 0xa8509a, 0.5);
      for (var bi = 0; bi < 2; bi++) {
        var ba = Math.random() * Math.PI * 2;
        this.spawnLightningBolt(
          x, 1.0, z,
          x + Math.cos(ba) * 1.45, 0.35 + Math.random() * 0.9, z + Math.sin(ba) * 1.45,
          0xd8a860, 0.22, 5
        );
      }
    }
  };

  EngineSession.prototype.spawnWardEmbers = function (x, z, radius) {
    var THREE = this.THREE;
    var count = 22;
    var positions = new Float32Array(count * 3);
    var vels = [];
    var r = Math.max(1.8, radius || 3.4);
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      var rr = r * (0.45 + Math.random() * 0.6);
      positions[i * 3] = x + Math.cos(a) * rr;
      positions[i * 3 + 1] = 0.12 + Math.random() * 0.45;
      positions[i * 3 + 2] = z + Math.sin(a) * rr;
      vels.push({
        vx: (Math.random() - 0.5) * 0.55,
        vy: 0.9 + Math.random() * 1.45,
        vz: (Math.random() - 0.5) * 0.55
      });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xf7d06b,
      size: 0.22,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(geo, mat);
    this.scene.add(pts);

    var self = this;
    this.vfxList.push({
      ttl: 1.35,
      maxTtl: 1.35,
      update: function (dt) {
        this.ttl -= dt;
        var attr = geo.attributes.position;
        for (var k = 0; k < count; k++) {
          attr.array[k * 3] += vels[k].vx * dt;
          attr.array[k * 3 + 1] += vels[k].vy * dt;
          attr.array[k * 3 + 2] += vels[k].vz * dt;
        }
        attr.needsUpdate = true;
        mat.opacity = 0.92 * clamp(this.ttl / this.maxTtl, 0, 1);
      },
      dispose: function () {
        self.scene.remove(pts);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  // Handles with maxTtl above this are tied to gameplay objects (wards, drones, decoys)
  // and are never evicted by the VFX budget.
  var VFX_EVICTABLE_MAX_TTL = 2.5;

  EngineSession.prototype.enforceVfxBudget = function () {
    var budget = maxActiveVfxBudget();
    var excess = this.vfxList.length - budget;
    if (excess <= 0) return 0;
    var evicted = 0;
    // Oldest entries sit at the front; evict transient cosmetic handles first.
    for (var i = 0; i < this.vfxList.length && evicted < excess; ) {
      var v = this.vfxList[i];
      var transient = v && !v.persistent &&
        (typeof v.maxTtl !== 'number' || v.maxTtl <= VFX_EVICTABLE_MAX_TTL);
      if (transient) {
        try { v.dispose(); } catch (_) {}
        this.vfxList.splice(i, 1);
        evicted += 1;
      } else {
        i += 1;
      }
    }
    return evicted;
  };

  EngineSession.prototype.updateVfx = function (simDt, realDt) {
    this.enforceVfxBudget();
    for (var i = this.vfxList.length - 1; i >= 0; i--) {
      var v = this.vfxList[i];
      v.update(simDt, realDt);
      if (v.ttl <= 0) {
        v.dispose();
        this.vfxList.splice(i, 1);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Raycast & Geometry Hit Helpers
  // ---------------------------------------------------------------------------
  EngineSession.prototype.raycastWall = function (x0, z0, dx, dz, maxDist) {
    var step = 0.35;
    var d = step;
    while (d < maxDist) {
      var cx = x0 + dx * d;
      var cz = z0 + dz * d;
      if (!this.mapApi.isWalkable(Math.floor(cx), Math.floor(cz))) {
        return { x: cx, z: cz };
      }
      d += step;
    }
    return { x: x0 + dx * maxDist, z: z0 + dz * maxDist };
  };

  EngineSession.prototype.segmentCircleHit = function (x0, z0, x1, z1, cx, cz, r) {
    var dx = x1 - x0;
    var dz = z1 - z0;
    var lenSq = dx * dx + dz * dz;
    if (lenSq < 0.0001) return dist2D(x0, z0, cx, cz) <= r;
    var t = clamp(((cx - x0) * dx + (cz - z0) * dz) / lenSq, 0, 1);
    var px = x0 + t * dx;
    var pz = z0 + t * dz;
    return dist2D(px, pz, cx, cz) <= r;
  };

  // ---------------------------------------------------------------------------
  // Dynamic Lights & Atmospheric Dust Updates
  // ---------------------------------------------------------------------------
  EngineSession.prototype.updateLights = function (realDt) {
    var p = this.player;
    var ins = this.inspector;
    var t = this.elapsedReal;

    // Player flashlight aiming smoothly toward cursor
    if (this.flashLight && this.flashTarget) {
      var dir = this.getAimDir();
      this.flashLight.position.set(p.x, 2.15, p.z);
      this.flashTarget.position.set(p.x + dir.x * 7.2, 0.15, p.z + dir.z * 7.2);
      // Flashlight is the dominant key light under Mignola noir contrast
      this.flashLight.intensity = p.stealthTimer > 0 ? 1.55 : 4.4;
    }
    if (this.playerGlow) {
      this.playerGlow.position.set(p.x, 1.55, p.z);
      var zoneGlowHex = (this.activeZoneConfig && this.activeZoneConfig.playerGlowColor) || 0x7cc8e8;
      this.playerGlow.color.setHex(p.overclockTimer > 0 ? 0x4df8ff : zoneGlowHex);
    }

    // Inspector crimson lantern light (hidden when Inspector is in an unseen room!)
    if (this.inspectorLantern && ins.alive) {
      var insSeen = this.canSeeWorldPoint(ins.x, ins.z);
      this.inspectorLantern.position.set(ins.x + (ins.facingLeft ? -0.35 : 0.35), 1.65, ins.z + 0.25);
      if (!insSeen) {
        this.inspectorLantern.intensity = 0;
        if (this.inspectorLanternOrb) this.inspectorLanternOrb.visible = false;
      } else if (ins.stunTimer > 0) {
        this.inspectorLantern.intensity = (Math.sin(t * 48) > 0.65) ? 1.1 : 0.1;
        this.inspectorLanternOrb.visible = (Math.sin(t * 48) > 0.4);
      } else {
        var pulse = 3.3 + Math.sin(t * 7.5) * 0.45 + (ins.lungeTelegraph > 0 ? 1.8 : 0);
        this.inspectorLantern.intensity = pulse;
        this.inspectorLanternOrb.visible = true;
      }
    }

    // EMP Blackout timer & crackling cyan sparks near overhead station lights
    var empActive = false;
    if (this.empBlackoutTimer > 0) {
      empActive = true;
      this.empBlackoutTimer = Math.max(0, this.empBlackoutTimer - realDt);
      this.empSparkAccum += realDt;
      if (this.empSparkAccum >= 0.16) {
        this.empSparkAccum = 0;
        var sparked = false;
        for (var si = 0; si < this.stationLightDefs.length; si++) {
          var sDef = this.stationLightDefs[si];
          if (dist2D(sDef.x, sDef.z, this.empBlackoutPos.x, this.empBlackoutPos.z) <= 18.0 && Math.random() < 0.55) {
            this.spawnSparkBurst(sDef.x, 2.75, sDef.z, 0x4de8ff, 5);
            sparked = true;
          }
        }
        if (!sparked) {
          this.spawnSparkBurst(
            this.empBlackoutPos.x + (Math.random() - 0.5) * 3.5,
            2.4,
            this.empBlackoutPos.z + (Math.random() - 0.5) * 3.5,
            0x4de8ff,
            6
          );
        }
      }
    }

    // Per-fixture light level (flicker + local EMP blackout), shared by bulbs and pooled lights
    var defs = this.stationLightDefs;
    var levels = this.stationLightLevels || (this.stationLightLevels = []);
    var overrides = this.stationLightOverrides || (this.stationLightOverrides = []);
    for (var li = 0; li < defs.length; li++) {
      var def = defs[li];
      var flk = 1.0;
      var overrideHex = null;
      if (def.flicker > 0) {
        var wave = Math.sin(t * 11.3 + def.seed) * Math.sin(t * 27.1 + def.seed * 2);
        flk = wave > 0.72 ? Math.max(0.25, 1.0 - def.flicker * 2.1) : (1.0 - def.flicker * 0.35 + wave * def.flicker * 0.45);
      }
      if (empActive && dist2D(def.x, def.z, this.empBlackoutPos.x, this.empBlackoutPos.z) <= EMP_BLACKOUT_RADIUS) {
        if (this.empBlackoutTimer > 1.0) {
          var stutter = Math.sin(t * 53.0 + def.seed * 7.0);
          flk = stutter > 0.86 ? 0.28 : 0.03;
          if (stutter > 0.86) overrideHex = 0x4de8ff;
        } else {
          var recover = 1.0 - this.empBlackoutTimer;
          flk *= lerp(0.12, 1.0, recover) * (Math.sin(t * 37.0 + def.seed * 3.0) > -0.25 ? 1.0 : 0.14);
        }
      }
      levels[li] = flk;
      overrides[li] = overrideHex;
    }

    // Fixture bulbs: per-instance level so EMP blackout stays local to its radius
    var bulbs = this.stationBulbControl;
    if (bulbs && typeof bulbs.setLevel === 'function') {
      var bulbCount = Math.min(bulbs.count || 0, defs.length);
      for (var bi = 0; bi < bulbCount; bi++) {
        bulbs.setLevel(bi, levels[bi], overrides[bi]);
      }
      bulbs.commit();
    } else if (this.stationBulbMat) {
      // Legacy shared-material fallback (SceneArchitect unavailable)
      if (empActive) {
        var bPulse = (Math.sin(t * 49.0) > 0.72) ? 0x4de8ff : 0x162230;
        this.stationBulbMat.color.setHex(bPulse);
      } else {
        this.stationBulbMat.color.setHex(0xbfe8ff);
      }
    }

    // Pooled nearest station lights (<= 4). Slots fade out before being reassigned and
    // currently-held fixtures get a distance bias, so lights never pop when ranks swap.
    var pool = this.stationLightPool;
    if (pool.length > 0 && defs.length > 0) {
      var slots = this.stationLightSlots;
      if (!slots || slots.length !== pool.length) {
        slots = this.stationLightSlots = pool.map(function () { return { defIdx: -1, fade: 0 }; });
      }
      var heldBy = {};
      for (var hs = 0; hs < slots.length; hs++) {
        if (slots[hs].defIdx >= 0) heldBy[slots[hs].defIdx] = hs;
      }
      var ranked = [];
      for (var ri = 0; ri < defs.length; ri++) {
        var ddx = defs[ri].x - p.x;
        var ddz = defs[ri].z - p.z;
        var dsq = ddx * ddx + ddz * ddz;
        ranked.push({ idx: ri, score: heldBy[ri] !== undefined ? dsq * 0.72 : dsq });
      }
      ranked.sort(function (a, b) { return a.score - b.score; });
      var desired = {};
      var desiredOrder = [];
      for (var di = 0; di < Math.min(pool.length, ranked.length); di++) {
        desired[ranked[di].idx] = true;
        desiredOrder.push(ranked[di].idx);
      }
      var waiting = desiredOrder.filter(function (idx) { return heldBy[idx] === undefined; });

      var fadeStep = realDt / LIGHT_POOL_FADE_SEC;
      for (var si2 = 0; si2 < slots.length; si2++) {
        var slot = slots[si2];
        var pl = pool[si2];
        var keep = slot.defIdx >= 0 && desired[slot.defIdx];
        if (!keep && slot.fade <= 0.001) {
          slot.fade = 0;
          slot.defIdx = waiting.length > 0 ? waiting.shift() : -1;
          if (slot.defIdx >= 0) {
            var nd = defs[slot.defIdx];
            pl.position.set(nd.x, 3.25, nd.z);
            pl.distance = nd.distance;
          }
          keep = slot.defIdx >= 0;
        }
        slot.fade = clamp(slot.fade + (keep ? fadeStep : -fadeStep), 0, 1);
        if (slot.defIdx < 0) {
          pl.intensity = 0;
          continue;
        }
        var sd = defs[slot.defIdx];
        pl.color.setHex(overrides[slot.defIdx] !== null ? overrides[slot.defIdx] : sd.color);
        pl.intensity = sd.intensity * levels[slot.defIdx] * slot.fade;
      }
    }
  };

  EngineSession.prototype.updateSpatialAudio = function () {
    var p = this.player;
    if (!p) return;

    var ins = this.inspector;
    var insIntensity = 0;
    if (ins && ins.alive && !this.ended) {
      var dIns = dist2D(p.x, p.z, ins.x, ins.z);
      var stateScale = ins.stunTimer > 0 ? 0.15 : (ins.state === 'HUNT' ? 1.0 : (ins.state === 'INVESTIGATE' ? 0.82 : 0.58));
      insIntensity = clamp(1.0 - dIns / 24.0, 0, 1) * stateScale;
    }
    safeAudio('updateSpatialSource', 'inspector', ins ? (ins.x - p.x) : 99, ins ? (ins.z - p.z) : 99, insIntensity);

    var trainActive = !!(this.train && this.train.group && this.train.group.visible && this.trainPhase !== 'waiting' && !this.ended);
    var trainZ = this.train ? this.train.z : -46;
    var trainX = (this.mapApi && this.mapApi.TRAIN_X) || TRAIN_X;
    safeAudio('updateSpatialSource', 'train', trainX - p.x, trainZ - p.z, trainActive ? 1 : 0);

    safeAudio('setBulletTime', !!(this.slowMo || this.inputPaused));
  };

  EngineSession.prototype.updateDust = function (simDt) {
    if (!this.dustPoints) return;
    var attr = this.dustPoints.geometry.attributes.position;
    var arr = attr.array;
    var maxW = (this.mapApi && this.mapApi.GRID_W) || 224;
    var maxH = (this.mapApi && this.mapApi.GRID_H) || 152;
    var dx = this.dustDrift ? this.dustDrift.x : 0.12;
    var dy = this.dustDrift ? this.dustDrift.y : 0.08;
    var dz = this.dustDrift ? this.dustDrift.z : 0.0;
    for (var i = 0; i < arr.length; i += 3) {
      arr[i] += dx * simDt;
      arr[i + 1] += Math.sin(this.elapsedReal * 0.8 + i) * dy * simDt;
      arr[i + 2] += dz * simDt;
      if (arr[i] > maxW) arr[i] = 0.5;
      else if (arr[i] < 0.5) arr[i] = maxW - 0.5;
      if (arr[i + 2] > maxH) arr[i + 2] = 0.5;
      else if (arr[i + 2] < 0.5) arr[i + 2] = maxH - 0.5;
    }
    attr.needsUpdate = true;
  };

  // ---------------------------------------------------------------------------
  // HTML Overlays: Speech Bubbles, Damage Numbers, World Tags, [E] Prompt
  // ---------------------------------------------------------------------------
  EngineSession.prototype.projectToScreen = function (x, y, z) {
    if (!this.camera || !this.renderer) return null;
    this._v3proj.set(x, y, z);
    this._v3proj.project(this.camera);
    if (this._v3proj.z > 1) return null;
    var w = this.renderer.domElement.clientWidth || this.containerEl.clientWidth || 960;
    var h = this.renderer.domElement.clientHeight || this.containerEl.clientHeight || 560;
    return {
      x: (this._v3proj.x * 0.5 + 0.5) * w,
      y: (-this._v3proj.y * 0.5 + 0.5) * h
    };
  };

  EngineSession.prototype.getActorById = function (id) {
    if (id === 'player') return this.player;
    if (id === 'inspector') return this.inspector;
    return this.squadById[id] || null;
  };

  EngineSession.prototype.showSpeechBubble = function (actorId, text) {
    if (!this.bubblesLayer || !text) return;
    var actor = this.getActorById(actorId);
    if (!actor) return;
    // True infinite-flow spatial isolation: distant teammates in other sectors speak via radio log, not on-screen bubbles
    if (actorId !== 'player' && this.player) {
      var dBubble = dist2D(actor.x, actor.z, this.player.x, this.player.z);
      if (dBubble > 18.0 || !this.canSeeWorldPoint(actor.x, actor.z)) return;
    }

    var prev = this.speechBubbles[actorId];
    if (prev && prev.el && prev.el.parentNode) {
      prev.el.parentNode.removeChild(prev.el);
    }

    var accent = actorId === 'player' ? '#6fd8ea' : (actor.accentColor || '#d6b274');
    var el = document.createElement('div');
    el.style.cssText =
      'position:absolute;transform:translate(-50%,-100%);max-width:210px;padding:5px 9px;' +
      'background:rgba(8,11,17,0.92);border:1px solid ' + accent + ';border-left:3px solid ' + accent + ';' +
      'border-radius:3px;color:#edf3fa;font-size:11px;line-height:1.4;letter-spacing:0.2px;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.65);pointer-events:none;white-space:normal;word-break:break-word;';
    el.textContent = text;
    this.bubblesLayer.appendChild(el);

    this.speechBubbles[actorId] = {
      el: el,
      actorId: actorId,
      ttl: 4.5,
      maxTtl: 4.5
    };
  };

  EngineSession.prototype.spawnFloatingText = function (x, y, z, text, color, tierOrBold) {
    if (!this.floatersLayer) return;
    var tier = typeof tierOrBold === 'string' ? tierOrBold : (tierOrBold ? 'parry' : 'normal');
    var feelApi = this.combatFeelApi || INFINITY.CombatFeel;
    var st = (feelApi && typeof feelApi.getFloatingTextStyle === 'function')
      ? feelApi.getFloatingTextStyle(tier, color)
      : {
          fontSize: tier === 'normal' ? '12px' : '15px',
          fontWeight: '900',
          color: color || '#ffffff',
          letterSpacing: tier === 'normal' ? '0.4px' : '1.0px',
          textShadow: tier === 'normal'
            ? '0 1px 4px #000,0 0 8px rgba(0,0,0,0.95)'
            : '0 0 12px rgba(255,224,125,0.85),0 2px 6px #000,0 0 18px rgba(255,196,70,0.65)',
          ttl: tier === 'normal' ? 1.15 : 1.55,
          vy: tier === 'normal' ? 1.35 : 1.05
        };

    var el = document.createElement('div');
    el.textContent = text;
    var tilt = typeof st.tiltDeg === 'number' ? st.tiltDeg : 0;
    var popScale = typeof st.scalePop === 'number' ? st.scalePop : 1.0;
    el.style.cssText =
      'position:absolute;transform:translate(-50%,-50%) rotate(' + tilt + 'deg) scale(' + popScale + ');' +
      'font-size:' + st.fontSize + ';font-weight:' + st.fontWeight + ';' +
      (st.fontFamily ? 'font-family:' + st.fontFamily + ';' : '') +
      'color:' + st.color + ';text-shadow:' + st.textShadow + ';' +
      'white-space:nowrap;pointer-events:none;letter-spacing:' + st.letterSpacing + ';';
    this.floatersLayer.appendChild(el);

    var ttl = st.ttl || 1.15;
    var spawnX = x + (tier === 'normal' ? (Math.random() - 0.5) * 0.4 : 0);
    var spawnY = y;
    for (var fi = 0, bumps = 0; fi < this.floatingTexts.length && bumps < 4; fi++) {
      var prevFt = this.floatingTexts[fi];
      if (Math.abs(prevFt.x - spawnX) < 2.2 && Math.abs(prevFt.z - z) < 2.2 && Math.abs(prevFt.y - spawnY) < 0.52) {
        spawnY += 0.54;
        bumps++;
      }
    }
    this.floatingTexts.push({
      el: el,
      x: spawnX,
      y: spawnY,
      z: z,
      vy: st.vy || 1.25,
      tiltDeg: tilt,
      scalePop: popScale,
      ttl: ttl,
      maxTtl: ttl
    });
  };

  EngineSession.prototype.updateHtmlOverlays = function (realDt) {
    var w = this.containerEl.clientWidth || 960;
    var h = this.containerEl.clientHeight || 560;

    // Vignette state (Bullet-Time / Damage / Overclock / Stealth)
    if (this.vignetteEl) {
      if (this.player.hitFlash > 0) {
        this.vignetteEl.style.boxShadow = 'inset 0 0 110px rgba(232,45,65,0.68)';
      } else if (this.slowMo || this.inputPaused) {
        this.vignetteEl.style.boxShadow = 'inset 0 0 115px rgba(240,196,108,0.28), inset 0 0 24px rgba(111,216,234,0.24)';
      } else if (this.player.overclockTimer > 0) {
        this.vignetteEl.style.boxShadow = 'inset 0 0 95px rgba(77,248,255,0.34)';
      } else if (this.player.stealthTimer > 0) {
        this.vignetteEl.style.boxShadow = 'inset 0 0 105px rgba(110,88,210,0.35)';
      } else {
        var zoneVig = (this.activeZoneConfig && this.activeZoneConfig.vignetteRgba) || 'rgba(4,6,10,0.72)';
        this.vignetteEl.style.boxShadow = 'inset 0 0 90px ' + zoneVig;
      }
    }

    // Zone Transition Banner smooth auto-fade
    if (this.zoneBannerEl && this.zoneBannerTimer > 0) {
      this.zoneBannerTimer = Math.max(0, this.zoneBannerTimer - realDt);
      if (this.zoneBannerTimer <= 0) {
        this.zoneBannerEl.style.opacity = '0';
        this.zoneBannerEl.style.transform = 'translate(-50%,-10px)';
      }
    }

    // World-space mini HP/Name tags for Squad & Inspector (strictly gated by room/recon vision!)
    var tagIds = Object.keys(this.worldTags);
    for (var ti = 0; ti < tagIds.length; ti++) {
      var tid = tagIds[ti];
      var tag = this.worldTags[tid];
      var actor = this.getActorById(tid);
      if (!actor || !actor.alive) {
        tag.el.style.display = 'none';
        continue;
      }
      var yOff = tid === 'inspector' ? (ACTOR_DIMENSIONS.inspector.height + 0.14) : (ACTOR_DIMENSIONS.squad.height + 0.18);
      var scr = this.projectToScreen(actor.x, yOff, actor.z);
      var visibleInFog = this.canSeeWorldPoint(actor.x, actor.z);
      if (!scr || !visibleInFog || scr.x < -60 || scr.x > w + 60 || scr.y < -40 || scr.y > h + 40) {
        tag.el.style.display = 'none';
      } else {
        tag.el.style.display = 'flex';
        tag.el.style.left = Math.round(scr.x) + 'px';
        tag.el.style.top = Math.round(scr.y) + 'px';
        tag.hpFill.style.width = clamp((actor.hp / Math.max(1, actor.maxHp)) * 100, 0, 100) + '%';
        if (tag.sealFill) {
          tag.sealFill.style.width = clamp(actor.sealedPct || 0, 0, 100) + '%';
        }
      }
    }

    // Speech Bubbles projected cleanly above character heads (hidden if speaker is in an unseen room)
    var bIds = Object.keys(this.speechBubbles);
    for (var bi = 0; bi < bIds.length; bi++) {
      var bid = bIds[bi];
      var b = this.speechBubbles[bid];
      b.ttl -= realDt;
      if (b.ttl <= 0) {
        if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
        delete this.speechBubbles[bid];
        continue;
      }
      var bActor = this.getActorById(bid);
      if (!bActor || bActor.alive === false) {
        b.el.style.display = 'none';
        continue;
      }
      if (bid !== 'player' && !this.canSeeWorldPoint(bActor.x, bActor.z)) {
        b.el.style.display = 'none';
        continue;
      }
      var bScr = this.projectToScreen(bActor.x, 2.65, bActor.z);
      if (!bScr) {
        b.el.style.display = 'none';
      } else {
        b.el.style.display = 'block';
        b.el.style.left = clamp(Math.round(bScr.x), 110, w - 110) + 'px';
        b.el.style.top = clamp(Math.round(bScr.y), 48, h - 20) + 'px';
        b.el.style.opacity = b.ttl < 0.7 ? String(clamp(b.ttl / 0.7, 0, 1)) : '1';
      }
    }

    // Floating Damage / Status Numbers (hidden if occurring in an unseen room)
    for (var fi = this.floatingTexts.length - 1; fi >= 0; fi--) {
      var ft = this.floatingTexts[fi];
      ft.ttl -= realDt;
      ft.y += ft.vy * realDt;
      if (ft.ttl <= 0) {
        if (ft.el.parentNode) ft.el.parentNode.removeChild(ft.el);
        this.floatingTexts.splice(fi, 1);
        continue;
      }
      var nearPlayer = dist2D(this.player.x, this.player.z, ft.x, ft.z) <= 2.2;
      if (!nearPlayer && !this.canSeeWorldPoint(ft.x, ft.z)) {
        ft.el.style.display = 'none';
        continue;
      }
      var fScr = this.projectToScreen(ft.x, ft.y, ft.z);
      if (!fScr) {
        ft.el.style.display = 'none';
      } else {
        var age = 1.0 - clamp(ft.ttl / ft.maxTtl, 0, 1);
        var pop = ft.scalePop && ft.scalePop > 1.0
          ? lerp(ft.scalePop, 1.0, clamp(age / 0.22, 0, 1))
          : 1.0;
        ft.el.style.display = 'block';
        ft.el.style.left = Math.round(fScr.x) + 'px';
        ft.el.style.top = Math.round(fScr.y) + 'px';
        ft.el.style.transform = 'translate(-50%,-50%) rotate(' + (ft.tiltDeg || 0) + 'deg) scale(' + pop.toFixed(2) + ')';
        ft.el.style.opacity = String(clamp(ft.ttl / (ft.maxTtl * 0.45), 0, 1));
      }
    }

    // Floating [E] Interactable Prompt
    if (this.promptEl) {
      var ni = this.nearbyInteractable;
      if (!ni) {
        this.promptEl.style.display = 'none';
      } else {
        var pScr = this.projectToScreen(ni.x, ni.type === 'exit' ? 2.6 : 1.75, ni.z);
        if (!pScr) {
          this.promptEl.style.display = 'none';
        } else {
          var suffix = '';
          var prefixLabel = ni.label;
          if (ni.type === 'console') {
            suffix = ' (' + Math.round(ni.progress) + '%)';
          } else if (ni.type === 'exit') {
            suffix = (this.overridePct >= 100 || !this.inspector.alive) ? ' [可撤离]' : ' [道岔' + this.overridePct + '%]';
          } else if (ni.type === 'destructible_cover') {
            prefixLabel = (ni.actionLabel || '破拆掩体') + ' · ' + ni.label;
            suffix = ' (HP ' + Math.round(ni.hp) + '/' + Math.round(ni.maxHp) + ')';
          } else if (ni.type === 'scene_trigger') {
            prefixLabel = (ni.actionLabel || '启动机关') + ' · ' + ni.label;
          }
          this.promptEl.textContent = '[E] ' + prefixLabel + suffix;
          this.promptEl.style.display = 'block';
          this.promptEl.style.left = Math.round(pScr.x) + 'px';
          this.promptEl.style.top = Math.round(pScr.y) + 'px';
        }
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HUD Snapshot Builder (Matches CONTRACT_25D.md 100%)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.getSnapshot = function () {
    var p = this.player;
    var ins = this.inspector;
    var mapApi = this.mapApi;

    var pZoneId = mapApi.getZoneAt(p.x, p.z) || 'concourse';
    var pZone = getZoneInfo(mapApi, pZoneId);

    var insZoneId = mapApi.getZoneAt(ins.x, ins.z) || 'platform0';
    var dBoss = dist2D(p.x, p.z, ins.x, ins.z);
    var reconActive = this.hasActiveReconVision();
    var hasRecon = reconActive || this.hasPassiveReconCapability();
    var insVisible = ins.alive && this.canSeeWorldPoint(ins.x, ins.z);

    var cluesTotal = 0;
    var consolesMini = [];
    var consolesDetail = [];
    for (var i = 0; i < this.interactables.length; i++) {
      var it = this.interactables[i];
      if (it.type === 'clue') cluesTotal++;
      if (it.type === 'console') {
        var conZone = it.zoneId || mapApi.getZoneAt(it.x, it.z);
        if (hasRecon || !conZone || conZone === pZoneId || this.visitedZones.indexOf(conZone) !== -1) {
          consolesMini.push({ x: it.x, z: it.z, done: !!it.done });
        }
        consolesDetail.push({
          id: it.id,
          zoneId: it.zoneId,
          label: it.label,
          progress: Math.round(it.progress || 0),
          done: !!it.done,
          overrideValue: it.overrideValue || 50
        });
      }
    }

    var slotsSnap = this.loadout.slots.map(function (sl) {
      var isRecall = (sl.archetype === 'blink_mark' && this.blinkBeacon !== null);
      return {
        index: sl.index,
        key: sl.key,
        name: isRecall ? sl.name + '(召回)' : sl.name,
        archetype: sl.archetype,
        color: sl.color,
        cooldownLeft: Number(sl.cooldownLeft.toFixed(1)),
        cooldownMax: sl.cooldownMax,
        energyCost: isRecall ? 0 : sl.energyCost,
        icon: sl.icon,
        ready: isRecall || (sl.cooldownLeft <= 0 && p.energy >= sl.energyCost),
        resonance: sl.resonance ? {
          badgeText: sl.resonance.badgeText,
          resonanceName: sl.resonance.resonanceName,
          affinityLabel: sl.resonance.affinityLabel,
          level: sl.resonance.level,
          color: sl.resonance.colors.primary,
          summaryText: sl.resonance.summaryText,
          bloodlineName: sl.resonance.bloodlineName
        } : null
      };
    }, this);

    var squadSnap = this.squad.map(function (n) {
      var nZoneId = mapApi.getZoneAt(n.x, n.z) || 'concourse';
      var nZone = getZoneInfo(mapApi, nZoneId);
      return {
        id: n.id,
        name: n.name,
        role: n.role,
        accentColor: n.accentColor,
        zoneId: nZoneId,
        zoneName: nZone.name,
        hp: Math.round(n.hp),
        maxHp: Math.round(n.maxHp),
        order: n.order,
        orderLabel: n.orderLabel,
        alive: n.alive
      };
    });

    var squadMini = this.squad.filter(function (n) {
      return n.alive && (reconActive || this.canSeeWorldPoint(n.x, n.z));
    }, this).map(function (n) {
      return { id: n.id, x: n.x, z: n.z, color: n.accentColor };
    });

    var wardsMini = this.wards.map(function (w) {
      return { x: w.x, z: w.z, r: w.radius };
    });

    var near = this.nearbyInteractable ? {
      id: this.nearbyInteractable.id,
      label: this.nearbyInteractable.type === 'destructible_cover'
        ? ((this.nearbyInteractable.actionLabel || '破拆掩体') + ' · ' + this.nearbyInteractable.label)
        : (this.nearbyInteractable.type === 'scene_trigger'
          ? ((this.nearbyInteractable.actionLabel || '启动机关') + ' · ' + this.nearbyInteractable.label)
          : this.nearbyInteractable.label),
      type: this.nearbyInteractable.type,
      progress: Math.round(this.nearbyInteractable.progress)
    } : null;

    var dynamicMini = [];
    if (this.sceneTriggers && this.sceneTriggers.length) {
      for (var sti = 0; sti < this.sceneTriggers.length; sti++) {
        var stg = this.sceneTriggers[sti];
        var stgZone = stg.zoneId || mapApi.getZoneAt(stg.x, stg.z);
        if (hasRecon || stgZone === pZoneId || this.visitedZones.indexOf(stgZone) !== -1) {
          dynamicMini.push({ x: stg.x, z: stg.z, type: 'scene_trigger', done: !!stg.done });
        }
      }
    }
    if (this.destructibleCovers && this.destructibleCovers.length) {
      for (var dci = 0; dci < this.destructibleCovers.length; dci++) {
        var dcv = this.destructibleCovers[dci];
        var dcvZone = dcv.zoneId || mapApi.getZoneAt(dcv.x, dcv.z);
        if (hasRecon || dcvZone === pZoneId || this.visitedZones.indexOf(dcvZone) !== -1) {
          dynamicMini.push({ x: dcv.x, z: dcv.z, type: 'destructible_cover', done: !!dcv.destroyed });
        }
      }
    }

    var insOffscreen = dBoss > 7.5;
    var insScreenBearing = Math.atan2(ins.z - p.z, ins.x - p.x);
    if (this.camera && this.renderer && this.containerEl) {
      var vw = this.renderer.domElement.clientWidth || this.containerEl.clientWidth || 960;
      var vh = this.renderer.domElement.clientHeight || this.containerEl.clientHeight || 560;
      var proj = this.projectToScreen(ins.x, 1.0, ins.z);
      if (!proj) {
        insOffscreen = true;
      } else {
        insOffscreen = (proj.x < 24 || proj.x > vw - 24 || proj.y < 24 || proj.y > vh - 24);
        var sdx = proj.x - vw * 0.5;
        var sdy = proj.y - vh * 0.5;
        if (sdx * sdx + sdy * sdy > 1) {
          insScreenBearing = Math.atan2(sdy, sdx);
        }
      }
    }

    var destructiblesTotal = this.destructibleCovers ? this.destructibleCovers.length : 0;
    var triggersTotal = this.sceneTriggers ? this.sceneTriggers.length : 0;
    var pSubZone = (mapApi && typeof mapApi.getSubZoneAt === 'function')
      ? mapApi.getSubZoneAt(p.x, p.z)
      : null;

    var activeZoneCfg = this.activeZoneConfig || resolveZoneSceneConfig(pZoneId, mapApi);

    return {
      zoneId: pZoneId,
      zoneName: pZone.name,
      zoneCode: pZone.code,
      subZoneId: pSubZone ? pSubZone.id : null,
      subZoneCode: pSubZone ? pSubZone.code : pZone.code,
      subZoneName: pSubZone ? pSubZone.name : null,
      zoneSceneAssetKey: activeZoneCfg && activeZoneCfg.assetSet ? activeZoneCfg.assetSet.key : null,
      zoneAudioId: activeZoneCfg && activeZoneCfg.audio ? activeZoneCfg.audio.id : null,
      zoneAudioLabel: activeZoneCfg && activeZoneCfg.audio ? activeZoneCfg.audio.label : null,
      elapsedSec: Math.floor(this.stats.elapsedSec || 0),
      timeRemainingSec: Math.ceil(this.timeRemainingSec),
      trainCountdownSec: Math.ceil(this.trainCountdownSec),
      trainInStation: this.trainInStation,
      overridePct: Math.round(this.overridePct),
      cluesFoundCount: this.discoveredClueIds.length,
      cluesTotal: cluesTotal,
      discoveredClueIds: this.discoveredClueIds.slice(),
      environmentClues: this.environmentClues ? this.environmentClues.slice() : [],
      envCluesFoundCount: this.environmentClues ? this.environmentClues.length : 0,
      envCluesTotal: destructiblesTotal + triggersTotal,
      latestEnvironmentClue: this.latestEnvironmentClue || null,
      destructiblesTotal: destructiblesTotal,
      destructiblesBroken: this.stats.coversDestroyed || 0,
      triggersTotal: triggersTotal,
      triggersActivated: this.stats.triggersActivated || 0,
      consoles: consolesDetail,
      visitedZones: this.visitedZones.slice(),
      totalZones: 6,
      missionLogVersion: this.missionLogVersion,
      missionLog: this.missionLog.slice(),
      branches: this.getBranchesList(),
      hp: Math.round(p.hp),
      maxHp: Math.round(p.maxHp),
      energy: Math.round(p.energy),
      maxEnergy: Math.round(p.maxEnergy),
      sanity: Math.round(p.sanity),
      maxSanity: Math.round(p.maxSanity),
      soundLevel: Math.round(this.soundLevel),
      threatLevel: Math.round(this.threatLevel),
      slowMo: this.slowMo || this.inputPaused,
      inCombat: Boolean(this.combatFocusTimer > 0 || (ins && ins.alive && dBoss < 12.5)),
      inspector: {
        hp: Math.round(ins.hp),
        maxHp: Math.round(ins.maxHp),
        phase: ins.phase || 1,
        mutated: Boolean(ins.mutated),
        mutationTier: ins.mutationTier || 'dormant',
        threatTier: ins.threatTier || 'low',
        weakpointExposed: Boolean(ins.alive && (ins.weakpointTimer || 0) > 0),
        weakpointRemainingSec: Number(Math.max(0, ins.weakpointTimer || 0).toFixed(2)),
        weakpointReason: (ins.weakpointTimer || 0) > 0 ? (ins.weakpointReason || null) : null,
        skillCycleIndex: ins.skillCycleIndex || 0,
        ruleArmorActive: ins.alive && ins.stunTimer <= 0 && (ins.armorBrokenTimer || 0) <= 0,
        intelKnown: !ins.alive || insVisible,
        sealedPct: Math.round(ins.sealedPct),
        state: ins.alive ? (insVisible ? ins.state : 'UNKNOWN') : 'DEFEATED',
        zoneId: insVisible ? insZoneId : null,
        dx: Number((ins.x - p.x).toFixed(2)),
        dz: Number((ins.z - p.z).toFixed(2)),
        distToPlayer: Number(dBoss.toFixed(1)),
        bearingRad: Number(Math.atan2(ins.z - p.z, ins.x - p.x).toFixed(4)),
        offscreen: insOffscreen,
        screenBearingRad: Number(insScreenBearing.toFixed(4))
      },
      nearbyInteractable: near,
      slots: slotsSnap,
      resonanceSummary: (this.loadout && this.loadout.resonanceSummary) || null,
      squad: squadSnap,
      minimap: {
        player: { x: p.x, z: p.z },
        inspector: { x: ins.x, z: ins.z, visible: insVisible },
        squad: squadMini,
        wards: wardsMini,
        consoles: consolesMini,
        dynamicPoints: dynamicMini,
        hasRecon: hasRecon,
        reconActive: reconActive,
        currentZone: pZoneId,
        visitedZones: this.visitedZones.slice(),
        exitReady: (this.overridePct >= 100 || !ins.alive),
        focusWaypoint: this.focusWaypoint ? {
          x: this.focusWaypoint.x,
          z: this.focusWaypoint.z,
          label: this.focusWaypoint.label,
          color: this.focusWaypoint.color,
          ttl: Number(this.focusWaypoint.ttl.toFixed(1)),
          maxTtl: this.focusWaypoint.maxTtl
        } : null
      }
    };
  };

  EngineSession.prototype.emitHudSnapshot = function () {
    if (this.callbacks && typeof this.callbacks.onHudTick === 'function') {
      try {
        this.callbacks.onHudTick(this.getSnapshot());
      } catch (_) {}
    }
  };

  // ---------------------------------------------------------------------------
  // Slow-Mo & Pause Toggles
  // ---------------------------------------------------------------------------
  EngineSession.prototype.setSlowMo = function (enabled) {
    var next = !!enabled;
    if (this.slowMo === next) return;
    this.slowMo = next;
    playSfxSafe(next ? 'crisis_freeze' : 'ui_click');
    this.spawnFloatingText(this.player.x, 2.25, this.player.z, next ? '子弹时间 ON' : '实时速度', next ? '#f0c46c' : '#6fd8ea');
    this.emitHudSnapshot();
  };

  EngineSession.prototype.toggleSlowMo = function () {
    this.setSlowMo(!this.slowMo);
  };

  EngineSession.prototype.setInputPaused = function (paused) {
    this.inputPaused = !!paused;
    if (this.inputPaused) {
      this.keys = Object.create(null);
      this.mouseDownLmb = false;
      this.cancelAimPreview();
    }
    this.emitHudSnapshot();
  };

  // ---------------------------------------------------------------------------
  // Leak-Free Teardown (unmount)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.unmount = function () {
    this.mounted = false;

    if (this.rafId !== null) {
      try { global.cancelAnimationFrame(this.rafId); } catch (_) {}
      try { global.clearTimeout(this.rafId); } catch (_) {}
      this.rafId = null;
    }

    if (this.resizeObserver) {
      try { this.resizeObserver.disconnect(); } catch (_) {}
      this.resizeObserver = null;
    }

    for (var i = 0; i < this.domListeners.length; i++) {
      var l = this.domListeners[i];
      try { l.target.removeEventListener(l.type, l.fn, l.opts); } catch (_) {}
    }
    this.domListeners = [];

    // Dispose dynamic active VFX/entities
    for (var vi = 0; vi < this.vfxList.length; vi++) {
      try { this.vfxList[vi].dispose(); } catch (_) {}
    }
    this.vfxList = [];

    for (var pi = 0; pi < this.projectiles.length; pi++) {
      try {
        var prj = this.projectiles[pi];
        this.scene.remove(prj.mesh);
        if (prj.geos) {
          prj.geos.forEach(disposeOwned);
        } else if (prj.geo) {
          disposeOwned(prj.geo);
        }
        if (prj.mats) {
          prj.mats.forEach(disposeOwned);
        } else if (prj.mat) {
          disposeOwned(prj.mat);
        }
      } catch (_) {}
    }
    this.projectiles = [];

    for (var wi = 0; wi < this.wards.length; wi++) {
      try {
        this.scene.remove(this.wards[wi].group);
        this.wards[wi].geos.forEach(disposeOwned);
        this.wards[wi].mats.forEach(disposeOwned);
      } catch (_) {}
    }
    this.wards = [];

    for (var di = 0; di < this.drones.length; di++) {
      try {
        this.scene.remove(this.drones[di].group);
        this.drones[di].geos.forEach(disposeOwned);
        this.drones[di].mats.forEach(disposeOwned);
      } catch (_) {}
    }
    this.drones = [];

    for (var dci = 0; dci < this.decoys.length; dci++) {
      try {
        this.scene.remove(this.decoys[dci].group);
        this.decoys[dci].geos.forEach(disposeOwned);
        this.decoys[dci].mats.forEach(disposeOwned);
      } catch (_) {}
    }
    this.decoys = [];

    for (var sri = 0; sri < this.soundRipples.length; sri++) {
      try {
        this.scene.remove(this.soundRipples[sri].mesh);
        disposeOwned(this.soundRipples[sri].geo);
        disposeOwned(this.soundRipples[sri].mat);
      } catch (_) {}
    }
    this.soundRipples = [];

    this.removeBlinkBeacon();
    this.clearReconBeacons();
    this.clearFocusWaypoint();
    this.disposePostFx();

    // Silence spatial audio sources, zone ambience and reset bullet-time filter cleanly
    safeAudio('updateSpatialSource', 'inspector', 99, 99, 0);
    safeAudio('updateSpatialSource', 'train', 99, 99, 0);
    safeAudio('stopZoneAmbience');
    safeAudio('setBulletTime', false);
    this.zoneAssetRigs = Object.create(null);

    // Dispose all tracked engine-owned geometries, materials, fallback textures
    for (var gi = 0; gi < this.ownedGeometries.length; gi++) {
      try { this.ownedGeometries[gi].dispose(); } catch (_) {}
    }
    this.ownedGeometries = [];

    for (var mi = 0; mi < this.ownedMaterials.length; mi++) {
      try { this.ownedMaterials[mi].dispose(); } catch (_) {}
    }
    this.ownedMaterials = [];

    for (var ti = 0; ti < this.ownedTextures.length; ti++) {
      try { this.ownedTextures[ti].dispose(); } catch (_) {}
    }
    this.ownedTextures = [];

    if (this.renderer) {
      try { this.renderer.dispose(); } catch (_) {}
      this.renderer = null;
    }

    if (this.containerEl) {
      this.containerEl.innerHTML = '';
    }

    this.fogOfWar = null;
    this.fogGrid = null;
    this.fogRayPts = null;
    this.stationBulbMat = null;
    this.contactShadowTex = null;
    this.castShadowTex = null;
    this.scene = null;
    this.camera = null;
    this.speechBubbles = Object.create(null);
    this.floatingTexts = [];
    this.worldTags = Object.create(null);
  };

  // ---------------------------------------------------------------------------
  // Public Facade: window.INFINITY.World25D
  // ---------------------------------------------------------------------------
  INFINITY.World25D = {
    mount: function (containerEl, state, callbacks) {
      if (activeSession) {
        activeSession.unmount();
        activeSession = null;
      }
      var session = new EngineSession(containerEl, state, callbacks);
      activeSession = session;
      return session.mount();
    },

    unmount: function () {
      if (activeSession) {
        activeSession.unmount();
        activeSession = null;
      }
    },

    setSlowMo: function (enabled) {
      if (activeSession && activeSession.mounted) {
        activeSession.setSlowMo(enabled);
      }
    },

    toggleSlowMo: function () {
      if (activeSession && activeSession.mounted) {
        activeSession.toggleSlowMo();
      }
    },

    setInputPaused: function (paused) {
      if (activeSession && activeSession.mounted) {
        activeSession.setInputPaused(paused);
      }
    },

    castSlot: function (slotIdx) {
      if (activeSession && activeSession.mounted) {
        return activeSession.castSlot(slotIdx);
      }
      return false;
    },

    triggerInteract: function () {
      if (activeSession && activeSession.mounted) {
        return activeSession.triggerInteract();
      }
      return false;
    },

    applySquadOrders: function (orders) {
      if (activeSession && activeSession.mounted) {
        activeSession.applySquadOrders(orders);
      }
    },

    showSpeechBubble: function (npcId, text) {
      if (activeSession && activeSession.mounted) {
        activeSession.showSpeechBubble(npcId, text);
      }
    },

    triggerFakeBroadcast: function (text) {
      if (activeSession && activeSession.mounted) {
        activeSession.triggerFakeBroadcast(text);
      }
    },

    getSnapshot: function () {
      if (activeSession && activeSession.mounted) {
        return activeSession.getSnapshot();
      }
      return null;
    },

    focusObjectiveTarget: function (taskKey) {
      if (activeSession && activeSession.mounted) {
        return activeSession.focusObjectiveTarget(taskKey);
      }
      return null;
    },

    setPostFxEnabled: function (enabled) {
      postFxGlobalEnabled = !!enabled;
      if (activeSession) {
        activeSession.postFxEnabled = postFxGlobalEnabled;
      }
      return postFxGlobalEnabled;
    },

    isPostFxEnabled: function () {
      if (activeSession) {
        return !!activeSession.postFxEnabled;
      }
      return postFxGlobalEnabled;
    },

    ACTOR_DIMENSIONS: ACTOR_DIMENSIONS,
    CAMERA_25D_SPEC: CAMERA_25D_SPEC,
    ZONE_SCENE_CONFIGS: ZONE_SCENE_CONFIGS,
    BOSS_DEATH_EXAM_CONFIG: BOSS_DEATH_EXAM_CONFIG,
    DEFAULT_NPC_SPAWNS: DEFAULT_NPC_SPAWNS,
    NPC_PATROL_ROUTES: NPC_PATROL_ROUTES,
    resolveAutonomousNpcGoal: resolveAutonomousNpcGoal,
    computePlayerOrbiterCount: computePlayerOrbiterCount,
    hasPassiveReconItem: hasPassiveReconItem,
    evaluatePointVisibility: evaluatePointVisibility,
    computeBossDamageTaken: computeBossDamageTaken,
    resolveZoneSceneConfig: resolveZoneSceneConfig,
    resolveSweptMovement: resolveSweptMovement,
    computeCameraScrollBounds: computeCameraScrollBounds,

    _getSession: function () {
      return activeSession;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
