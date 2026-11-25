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
  var TRAIN_X = 51.5;
  var TRAIN_CYCLE_SEC = 55;
  var TRAIN_DWELL_SEC = 10;
  var EXAM_DURATION_SEC = 540; // 9 minutes real-time compressed exam clock
  var HUD_TICK_INTERVAL = 0.1; // ~10 Hz
  var INTERACT_RANGE = 2.4;

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

  var DEFAULT_ZONES = {
    concourse:  { id: 'concourse',  name: 'B1 检票大厅',   code: 'Z-01', cx: 10, cz: 10, color: '#6fd8ea' },
    corridor:   { id: 'corridor',   name: 'B2 换乘长廊',   code: 'Z-02', cx: 26, cz: 18, color: '#d6b274' },
    dispatch:   { id: 'dispatch',   name: '信号调度室',    code: 'Z-03', cx: 30, cz: 7,  color: '#58c4a6' },
    substation: { id: 'substation', name: '旧变电间',      code: 'Z-04', cx: 11, cz: 29, color: '#6fa8ff' },
    tunnel:     { id: 'tunnel',     name: '废弃应急通道',  code: 'Z-05', cx: 34, cz: 30, color: '#b98ce0' },
    platform0:  { id: 'platform0',  name: '0号站台铁轨',   code: 'Z-06', cx: 47, cz: 18, color: '#e85d4a' }
  };

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
      GRID_W: 56,
      GRID_H: 38,
      ZONES: DEFAULT_ZONES,
      isWalkable: function (gx, gz) { return gx > 0 && gx < 55 && gz > 0 && gz < 37; },
      resolveCircleWallCollision: function (x, z, r) {
        return { x: clamp(x, 1 + r, 55 - r), z: clamp(z, 1 + r, 37 - r), hit: false };
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
        for (var r = 0; r < 38; r++) {
          var row = [];
          for (var c = 0; c < 56; c++) {
            row.push(r === 0 || r === 37 || c === 0 || c === 55 ? 1 : (c >= 50 ? 4 : 0));
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
    this.shakeIntensity = 0;
    this.shakeTimer = 0;

    // Station & lighting pools
    this.stationLightDefs = [];
    this.stationLightPool = [];
    this.stationBulbMat = null;
    this.flashLight = null;
    this.flashTarget = null;
    this.playerGlow = null;
    this.inspectorLantern = null;
    this.inspectorLanternOrb = null;
    this.dustPoints = null;

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

    // Entities & Gameplay
    this.loadout = null;
    this.passives = null;
    this.player = null;
    this.inspector = null;
    this.squad = [];
    this.squadById = Object.create(null);
    this.interactables = [];
    this.interactablesById = Object.create(null);
    this.discoveredClueIds = [];
    this.overridePct = 0;
    this.soundLevel = 8;
    this.threatLevel = 12;
    this.exitWarnTimer = 0;

    // Dynamic combat & VFX lists
    this.vfxList = [];          // temporary meshes/particles with update(dt)
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
      fakeBroadcastsCancelled: 0,
      inspectorDefeated: false,
      inspectorSealed: false,
      elapsedSec: 0
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

  EngineSession.prototype.getCharTex = function (id, frame) {
    if (this.spritesApi && typeof this.spritesApi.getCharTexture === 'function') {
      try {
        var t = this.spritesApi.getCharTexture(id, frame || 'idle');
        if (t) return t;
      } catch (_) {}
    }
    var colors = {
      player: '#6fd8ea', yanci: '#7ca7d9', lujin: '#d97b54',
      xutan: '#58c4a6', shenyan: '#c9a66b', inspector: '#e83848'
    };
    return this.trackTex(createFallbackTexture(this.THREE, colors[id] || '#88aabb', '#ffffff'));
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

    // WebGL Renderer with graceful error guard
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
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

    this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0x08090d, 1);
    if (THREE.ACESFilmicToneMapping !== undefined) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.06;
    }
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.imageRendering = 'pixelated';
    this.renderer.domElement.style.cursor = 'crosshair';
    this.containerEl.appendChild(this.renderer.domElement);

    // Build HTML overlay (speech bubbles, damage numbers, world HP tags, vignette, interact prompt)
    this.buildHtmlOverlay();

    // Scene & Fog (Signalis / HLD obsidian atmosphere)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08090d);
    this.scene.fog = new THREE.FogExp2(0x08090d, 0.036);

    // Elevated angled 2.5D camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 120);

    // Build combat loadout & entities
    this.initLoadout();
    this.buildLighting();
    this.buildStationGeometry();
    this.buildGhostTrain();
    this.buildInteractables();
    this.buildActors();
    this.buildReticle();
    this.buildAtmosphericDust();
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

    // Opening radio atmosphere & HUD push
    if (INFINITY.Audio && typeof INFINITY.Audio.setScene === 'function') {
      try { INFINITY.Audio.setScene('station_tense'); } catch (_) {}
    }
    this.showSpeechBubble('yanci', '全员核对腕表秒针。别信未经校验的站台广播。');
    this.showSpeechBubble('xutan', '我去信号调度室查道岔协议，有情况立刻切无线电！');
    this.showSpeechBubble('lujin', '我守换乘长廊，检票员露头我会第一时间拦住。');
    this.emitHudSnapshot();

    // Start 60fps loop
    var self = this;
    function tick(now) {
      if (!self.mounted) return;
      self.rafId = global.requestAnimationFrame(tick);
      self.frame(now);
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

    this.containerEl.appendChild(root);
    this.overlayRoot = root;
    this.vignetteEl = vignette;
    this.tagsLayer = tags;
    this.bubblesLayer = bubbles;
    this.floatersLayer = floaters;
    this.promptEl = prompt;
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
      slots.push({
        index: i,
        key: String(i + 1),
        archetype: src.archetype || DEFAULT_SLOTS[i].archetype,
        itemId: src.itemId || null,
        name: src.name || DEFAULT_SLOTS[i].name,
        color: src.color || DEFAULT_SLOTS[i].color,
        cooldownMax: Math.max(0.8, Number(src.cooldown) || DEFAULT_SLOTS[i].cooldown),
        cooldownLeft: 0,
        energyCost: Math.max(0, Number(src.energyCost) || DEFAULT_SLOTS[i].energyCost),
        power: Number(src.power) || DEFAULT_SLOTS[i].power || 26,
        radius: Number(src.radius) || DEFAULT_SLOTS[i].radius || 3.6,
        duration: Number(src.duration) || DEFAULT_SLOTS[i].duration || 4.0,
        desc: src.desc || '',
        icon: src.icon || DEFAULT_SLOTS[i].icon
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

    this.loadout = {
      basicAttack: basic,
      slots: slots,
      styleLabel: (built && built.styleLabel) || '标准特勤构筑'
    };
  };

  // ---------------------------------------------------------------------------
  // Lighting System (Dynamic Flashlight + Inspector Crimson Lantern + Pool)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildLighting = function () {
    var THREE = this.THREE;

    // Deep moody base lighting
    var amb = new THREE.AmbientLight(0x27344a, 0.62);
    this.scene.add(amb);

    var hemi = new THREE.HemisphereLight(0x3b4f6e, 0x090b10, 0.42);
    this.scene.add(hemi);

    // Player directional flashlight (SpotLight) + soft personal halo
    var flashTarget = new THREE.Object3D();
    flashTarget.position.set(12, 0.2, 10);
    this.scene.add(flashTarget);

    var flash = new THREE.SpotLight(0xd4f2ff, 2.35, 22, Math.PI / 4.0, 0.58, 1.35);
    flash.position.set(10, 2.1, 10);
    flash.target = flashTarget;
    this.scene.add(flash);
    this.flashLight = flash;
    this.flashTarget = flashTarget;

    var pGlow = new THREE.PointLight(0x7cc8e8, 0.95, 7.2, 1.7);
    pGlow.position.set(10, 1.6, 10);
    this.scene.add(pGlow);
    this.playerGlow = pGlow;

    // Inspector's ominous crimson lantern (bleeds down corridors before sighting!)
    var iLantern = new THREE.PointLight(0xff1e36, 3.6, 17.5, 1.45);
    iLantern.position.set(45, 1.7, 18);
    this.scene.add(iLantern);
    this.inspectorLantern = iLantern;

    // Station overhead flickering lights (pooled nearest 8 for 60fps shader safety)
    var defs = [];
    if (typeof this.mapApi.getLights === 'function') {
      try { defs = this.mapApi.getLights() || []; } catch (_) { defs = []; }
    }
    this.stationLightDefs = defs.map(function (d, idx) {
      return {
        x: Number(d.x) || 10,
        z: Number(d.z) || 10,
        color: hexToInt(d.color, 0x7fb8d8),
        intensity: Number(d.intensity) || 1.15,
        distance: Number(d.distance) || 11,
        flicker: typeof d.flicker === 'number' ? d.flicker : (d.flicker ? 0.22 : 0),
        seed: (idx + 1) * 1.73
      };
    });

    // Visual glowing ceiling/fixture bulbs for ALL station lights (1 InstancedMesh)
    if (this.stationLightDefs.length > 0) {
      var bulbGeo = this.trackGeo(new THREE.BoxGeometry(0.45, 0.12, 0.45));
      var bulbMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0xbfe8ff }));
      this.stationBulbMat = bulbMat;
      var bulbMesh = new THREE.InstancedMesh(bulbGeo, bulbMat, this.stationLightDefs.length);
      var col = new THREE.Color();
      for (var bi = 0; bi < this.stationLightDefs.length; bi++) {
        var ld = this.stationLightDefs[bi];
        this._dummy.position.set(ld.x, 3.26, ld.z);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.scale.set(1, 1, 1);
        this._dummy.updateMatrix();
        bulbMesh.setMatrixAt(bi, this._dummy.matrix);
        col.setHex(ld.color);
        if (typeof bulbMesh.setColorAt === 'function') {
          bulbMesh.setColorAt(bi, col);
        }
      }
      bulbMesh.instanceMatrix.needsUpdate = true;
      if (bulbMesh.instanceColor) bulbMesh.instanceColor.needsUpdate = true;
      this.scene.add(bulbMesh);
    }

    var poolSize = Math.min(4, this.stationLightDefs.length);
    for (var pi = 0; pi < poolSize; pi++) {
      var pl = new THREE.PointLight(0x88b8d8, 0.0, 12, 1.6);
      pl.position.set(0, WALL_HEIGHT + 0.2, 0);
      this.scene.add(pl);
      this.stationLightPool.push(pl);
    }
  };

  // ---------------------------------------------------------------------------
  // Station 2.5D Geometry Builder (Instanced Crisp Pixel Floors & Extruded Walls)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildStationGeometry = function () {
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
  EngineSession.prototype.createActorVisual = function (id, width, height, accentHex, isBoss) {
    var THREE = this.THREE;
    var group = new THREE.Group();

    // Contact shadow disc
    var shGeo = this.trackGeo(new THREE.CircleGeometry(isBoss ? 0.68 : 0.44, 18));
    shGeo.rotateX(-Math.PI / 2);
    var shMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0x020306,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    }));
    var shadow = new THREE.Mesh(shGeo, shMat);
    shadow.position.y = 0.06;
    group.add(shadow);

    // Subtle role accent base ring
    var bGeo = this.trackGeo(new THREE.RingGeometry(isBoss ? 0.62 : 0.40, isBoss ? 0.74 : 0.49, 24));
    bGeo.rotateX(-Math.PI / 2);
    var bMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: hexToInt(accentHex, 0x6fd8ea),
      transparent: true,
      opacity: isBoss ? 0.65 : 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    var baseRing = new THREE.Mesh(bGeo, bMat);
    baseRing.position.y = 0.07;
    group.add(baseRing);

    // Angled HD-2D billboard sprite plane (receives dynamic lighting!)
    var texIdle = this.getCharTex(id, 'idle');
    var pGeo = this.trackGeo(new THREE.PlaneGeometry(width, height));
    var pMat = this.trackMat(new THREE.MeshLambertMaterial({
      map: texIdle,
      emissiveMap: texIdle,
      emissive: 0xffffff,
      emissiveIntensity: isBoss ? 0.48 : 0.34,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide
    }));
    var sprite = new THREE.Mesh(pGeo, pMat);
    sprite.position.y = height * 0.5 + 0.05;
    sprite.rotation.x = -0.34;
    group.add(sprite);

    this.scene.add(group);
    return {
      group: group,
      sprite: sprite,
      mat: pMat,
      baseRing: baseRing,
      baseRingMat: bMat,
      shadow: shadow
    };
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

    var pVis = this.createActorVisual('player', 1.35, 1.85, '#6fd8ea', false);
    pVis.group.position.set(pPos.x, 0, pPos.z);

    // Translucent hex shield sphere (hidden until aegis_shield active)
    var shieldGeo = this.trackGeo(new THREE.IcosahedronGeometry(1.18, 1));
    var shieldMat = this.trackMat(new THREE.MeshBasicMaterial({
      color: 0x66e8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    }));
    var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.y = 1.0;
    shieldMesh.visible = false;
    pVis.group.add(shieldMesh);

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
      shieldMesh: shieldMesh,
      overclockTimer: 0,
      afterimageAccum: 0,
      stealthTimer: 0,
      invulnTimer: 0,
      attackCd: 0,
      dashTimer: 0,
      dashVx: 0,
      dashVz: 0,
      footstepAccum: 0,
      animFrame: 'idle',
      animTimer: 0,
      actionTimer: 0,
      hitFlash: 0,
      vis: pVis
    };

    // Build 4 Autonomous Squad NPCs
    var npcSpawns = [
      { id: 'yanci',   zone: 'concourse', dx: -2.0, dz: 1.5,  hp: 110, speed: 4.5 },
      { id: 'lujin',   zone: 'corridor',  dx: -2.5, dz: 0.0,  hp: 135, speed: 5.0 },
      { id: 'xutan',   zone: 'concourse', dx: 2.2,  dz: -1.4, hp: 95,  speed: 4.7 },
      { id: 'shenyan', zone: 'concourse', dx: 3.4,  dz: 2.6,  hp: 115, speed: 4.6 }
    ];

    for (var i = 0; i < npcSpawns.length; i++) {
      var sp = npcSpawns[i];
      var meta = getCastMeta(sp.id);
      var zc = mapApi.getZoneCenter(sp.zone) || { x: 10, z: 10 };
      var safePos = mapApi.resolveCircleWallCollision(zc.x + sp.dx, zc.z + sp.dz, 0.4);
      var vis = this.createActorVisual(sp.id, 1.32, 1.82, meta.accentColor, false);
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
        alive: true,
        facingLeft: false,
        order: 'auto',
        orderLabel: ORDER_LABELS.auto,
        holdX: safePos.x,
        holdZ: safePos.z,
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
    var bossVis = this.createActorVisual('inspector', 1.85, 2.6, '#ff2a3c', true);
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

    this.inspector = {
      id: 'inspector',
      name: '零号检票员',
      x: bossPos.x,
      z: bossPos.z,
      vx: 0,
      vz: 0,
      radius: 0.56,
      hp: 260,
      maxHp: 260,
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
      chainTimer: 0,
      chainMeshes: [],
      lungeCd: 2.0,
      lungeTelegraph: 0,
      lungeWindup: 0,
      lungeActive: 0,
      lungeDirX: 0,
      lungeDirZ: 1,
      lungeHitDone: false,
      teleMesh: teleMesh,
      teleFill: teleFill,
      facingLeft: false,
      animFrame: 'idle',
      animTimer: 0,
      actionTimer: 0,
      hitFlash: 0,
      whiteFlash: 0,
      vis: bossVis
    };

    this.createWorldTag('inspector', '零号检票员', '#ff3b4f', true);
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
  };

  EngineSession.prototype.buildAtmosphericDust = function () {
    var THREE = this.THREE;
    var count = 180;
    var positions = new Float32Array(count * 3);
    var w = this.mapApi.GRID_W || 56;
    var h = this.mapApi.GRID_H || 38;
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
  // True Wall-Occluded Line-of-Sight Shadow / Fog-of-War (72-Ray 2D DDA)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.buildFogOfWar = function () {
    var THREE = this.THREE;
    var gridW = this.mapApi.GRID_W || 56;
    var gridH = this.mapApi.GRID_H || 38;
    var scale = 4; // 224x152 offscreen canvas (4x station grid)
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

  EngineSession.prototype.updateFogOfWar = function (realDt) {
    var fog = this.fogOfWar;
    var p = this.player;
    if (!fog || !p) return;

    fog.accum += realDt;
    var aimAngle = Math.atan2(this.aimWorld.z - p.z, this.aimWorld.x - p.x);
    var movedSq = (p.x - fog.lastX) * (p.x - fog.lastX) + (p.z - fog.lastZ) * (p.z - fog.lastZ);
    var aimDiff = Math.abs(Math.atan2(Math.sin(aimAngle - fog.lastAimAngle), Math.cos(aimAngle - fog.lastAimAngle)));

    var shouldUpdate = (fog.accum >= 0.06) || (movedSq > 0.04) || (aimDiff > 0.14 && fog.accum >= 0.032);
    if (!shouldUpdate) return;

    fog.accum = 0;
    fog.lastX = p.x;
    fog.lastZ = p.z;
    fog.lastAimAngle = aimAngle;

    var ctx = fog.ctx;
    var sc = fog.scale;
    var gridW = fog.gridW;
    var gridH = fog.gridH;
    var grid = this.fogGrid;
    var pts = this.fogRayPts;
    var rayCount = 72;
    var coneHalf = 0.61086524; // +-35 deg flashlight cone
    var coneOuter = 0.76794487; // smooth outer feather to ~44 deg

    // 1. Fill deep obsidian shadow veil
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, fog.w, fog.h);
    ctx.fillStyle = 'rgba(6, 7, 11, 0.78)';
    ctx.fillRect(0, 0, fog.w, fog.h);

    // 2. Cast 72 true 2D DDA rays from player position against StationMap walls
    for (var i = 0; i < rayCount; i++) {
      var angle = (i / rayCount) * Math.PI * 2;
      var diff = Math.abs(Math.atan2(Math.sin(angle - aimAngle), Math.cos(angle - aimAngle)));
      var maxDist = 15.0;
      if (diff <= coneHalf) {
        maxDist = 20.0;
      } else if (diff < coneOuter) {
        maxDist = lerp(20.0, 15.0, (diff - coneHalf) / (coneOuter - coneHalf));
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
      while (steps < 48) {
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
          // Reveal front lit face of visible wall while keeping behind-wall spaces dark
          hitDist = Math.min(maxDist, currDist + 0.35);
          break;
        }
      }

      pts[i * 2] = (p.x + rdx * hitDist) * sc;
      pts[i * 2 + 1] = (p.z + rdz * hitDist) * sc;
    }

    // 3. Punch smooth glowing LOS visibility polygon out of the obsidian veil
    var px = p.x * sc;
    var pz = p.z * sc;
    ctx.globalCompositeOperation = 'destination-out';

    var visGrad = ctx.createRadialGradient(px, pz, 1.5 * sc, px, pz, 20.5 * sc);
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
    var haloGrad = ctx.createRadialGradient(px, pz, 0.5 * sc, px, pz, 3.2 * sc);
    haloGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    haloGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.beginPath();
    ctx.arc(px, pz, 3.2 * sc, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // 4. Ominous crimson lantern dim cutout around Inspector ONLY when within 16 tiles
    var ins = this.inspector;
    if (ins && ins.alive) {
      var dIns = dist2D(p.x, p.z, ins.x, ins.z);
      if (dIns <= 16.0) {
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

      var rt = new THREE.WebGLRenderTarget(rtW, rtH, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
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
        'varying vec2 vUv;',
        '',
        'vec3 brightPass(vec3 c) {',
        '  float luma = dot(c, vec3(0.299, 0.587, 0.114));',
        '  return c * smoothstep(0.56, 0.86, luma);',
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
        '  // Base sample + RGB chromatic aberration split during glitch',
        '  vec4 baseSample = texture2D(tDiffuse, uv);',
        '  vec3 col = baseSample.rgb;',
        '  if (glitch > 0.005) {',
        '    float ca = (0.003 + 0.016 * glitch) * (0.65 + 0.35 * sin(uTime * 46.0));',
        '    float rCh = texture2D(tDiffuse, clamp(uv + vec2(ca, 0.0), 0.001, 0.999)).r;',
        '    float bCh = texture2D(tDiffuse, clamp(uv - vec2(ca, 0.0), 0.001, 0.999)).b;',
        '    col = vec3(rCh, col.g, bCh);',
        '    float scanBar = 0.5 + 0.5 * sin(uv.y * uResolution.y * 1.5 + uTime * 30.0);',
        '    col += vec3(0.06, 0.09, 0.12) * scanBar * glitch * 0.45;',
        '  }',
        '',
        '  // Selective 9-tap bright-pass neon bloom (luma > 0.56)',
        '  float spread = clamp(min(uResolution.x, uResolution.y) / 340.0, 1.2, 3.0);',
        '  vec2 o1 = texel * (1.8 * spread);',
        '  vec2 o2 = texel * (3.1 * spread);',
        '  vec3 bloom = brightPass(col) * 0.20;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(o1.x, 0.0), 0.0, 1.0)).rgb) * 0.12;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv - vec2(o1.x, 0.0), 0.0, 1.0)).rgb) * 0.12;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(0.0, o1.y), 0.0, 1.0)).rgb) * 0.12;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv - vec2(0.0, o1.y), 0.0, 1.0)).rgb) * 0.12;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(o2.x, o2.y), 0.0, 1.0)).rgb) * 0.08;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(-o2.x, o2.y), 0.0, 1.0)).rgb) * 0.08;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(o2.x, -o2.y), 0.0, 1.0)).rgb) * 0.08;',
        '  bloom += brightPass(texture2D(tDiffuse, clamp(uv + vec2(-o2.x, -o2.y), 0.0, 1.0)).rgb) * 0.08;',
        '  col += bloom * vec3(1.08, 1.03, 1.06) * 0.68;',
        '',
        '  // Obsidian vignette + subtle micro film grain',
        '  vec2 centered = vUv * 2.0 - 1.0;',
        '  float distSq = dot(centered, centered);',
        '  float vig = smoothstep(0.55, 1.95, distSq);',
        '  col = mix(col, vec3(0.015, 0.018, 0.030), vig * 0.44);',
        '',
        '  float grain = (fract(sin(dot(vUv * uResolution + fract(uTime * 13.0) * 97.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.022;',
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
          uFlash: { value: 0 }
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

      this.renderer.setRenderTarget(fx.rt);
      this.renderer.render(this.scene, this.camera);
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
        if (key === '1' || code === 'Digit1') self.castSlot(0);
        else if (key === '2' || code === 'Digit2') self.castSlot(1);
        else if (key === '3' || code === 'Digit3') self.castSlot(2);
        else if (key === '4' || code === 'Digit4') self.castSlot(3);
        else if (key === 'e' || code === 'KeyE') self.triggerInteract();
      }
    });

    this.addListener(global, 'keyup', function (e) {
      var code = e.code || '';
      var key = (e.key || '').toLowerCase();
      self.keys[key] = false;
      self.keys[code] = false;
    });

    this.addListener(global, 'blur', function () {
      self.keys = Object.create(null);
      self.mouseDownLmb = false;
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

    // Smooth real-time decay for PostFX glitch, parry flash & inspector white hit-flash
    if (this.glitchAmount > 0) {
      this.glitchAmount = Math.max(0, this.glitchAmount * Math.exp(-4.2 * realDt) - 0.04 * realDt);
    }
    if (this.parryFlashTimer > 0) {
      this.parryFlashTimer = Math.max(0, this.parryFlashTimer - realDt);
    }
    if (this.inspector && this.inspector.whiteFlash > 0) {
      this.inspector.whiteFlash = Math.max(0, this.inspector.whiteFlash - realDt);
    }

    this.updateVfx(simDt, realDt);
    this.updateSoundRipples(simDt);
    this.updateLights(realDt);
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
      this.aimWorld.x = clamp(this._v3a.x, 0.5, (this.mapApi.GRID_W || 56) - 0.5);
      this.aimWorld.z = clamp(this._v3a.z, 0.5, (this.mapApi.GRID_H || 38) - 0.5);
    }
    if (this.reticle) {
      this.reticle.group.position.set(this.aimWorld.x, 0.09, this.aimWorld.z);
      this.reticle.outer.rotation.z = this.elapsedReal * 2.2;
      var reticleColor = this.slowMo ? 0xf0c46c : (this.player.overclockTimer > 0 ? 0x4df8ff : 0x6fd8ea);
      this.reticle.mat.color.setHex(reticleColor);
    }
  };

  EngineSession.prototype.addCameraShake = function (amount, duration) {
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
    this.shakeTimer = Math.max(this.shakeTimer, duration || 0.22);
  };

  EngineSession.prototype.addCameraKick = function (kx, kz) {
    this.camKickX = clamp(this.camKickX + (kx || 0), -1.2, 1.2);
    this.camKickZ = clamp(this.camKickZ + (kz || 0), -1.2, 1.2);
  };

  EngineSession.prototype.updateCamera = function (realDt) {
    var p = this.player;
    var leadX = clamp((this.aimWorld.x - p.x) * 0.22, -2.2, 2.2);
    var leadZ = clamp((this.aimWorld.z - p.z) * 0.18, -1.8, 1.8);

    var smooth = 1 - Math.exp(-7.5 * realDt);
    this.camPos.x = lerp(this.camPos.x, p.x + leadX * 0.65, smooth);
    this.camPos.z = lerp(this.camPos.z, p.z + leadZ * 0.65, smooth);
    this.camLook.x = lerp(this.camLook.x, p.x + leadX, smooth);
    this.camLook.z = lerp(this.camLook.z, p.z + leadZ, smooth);

    var kickDecay = Math.exp(-14.0 * realDt);
    this.camKickX *= kickDecay;
    this.camKickZ *= kickDecay;
    if (Math.abs(this.camKickX) < 0.002) this.camKickX = 0;
    if (Math.abs(this.camKickZ) < 0.002) this.camKickZ = 0;

    var sx = 0;
    var sy = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - realDt);
      var mag = this.shakeIntensity * (this.shakeTimer > 0 ? 1 : 0);
      sx = (Math.random() * 2 - 1) * mag;
      sy = (Math.random() * 2 - 1) * mag * 0.7;
      this.shakeIntensity *= Math.exp(-6.0 * realDt);
    }

    // Elevated angled 2.5D perspective offset (0, 16.5, 13.5)
    this.camera.position.set(this.camPos.x + sx + this.camKickX, 16.5 + sy, this.camPos.z + 13.5 + this.camKickZ);
    this.camera.lookAt(this.camLook.x + this.camKickX * 0.35, 0.6, this.camLook.z + this.camKickZ * 0.35);

    // Subtle dynamic FOV modulation for Bullet-Time / Overclock
    var targetFov = (this.slowMo || this.inputPaused) ? 35.8 : (p.overclockTimer > 0 ? 40.5 : 38.0);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = lerp(this.camera.fov, targetFov, 1 - Math.exp(-8 * realDt));
      this.camera.updateProjectionMatrix();
    }
  };

  // ---------------------------------------------------------------------------
  // Player Movement, Aim, Cooldowns & Buffs
  // ---------------------------------------------------------------------------
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
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - realDt);
    if (this.exitWarnTimer > 0) this.exitWarnTimer = Math.max(0, this.exitWarnTimer - realDt);

    for (var si = 0; si < this.loadout.slots.length; si++) {
      var sl = this.loadout.slots[si];
      if (sl.cooldownLeft > 0) {
        sl.cooldownLeft = Math.max(0, sl.cooldownLeft - playerDt);
      }
    }

    // Shield timer
    if (p.shieldTimer > 0) {
      p.shieldTimer -= simDt;
      p.shieldMesh.visible = true;
      p.shieldMesh.rotation.y += realDt * 1.4;
      p.shieldMesh.rotation.x += realDt * 0.6;
      if (p.shieldTimer <= 0 || p.shieldHp <= 0) {
        p.shieldHp = 0;
        p.shieldTimer = 0;
        p.shieldMesh.visible = false;
      }
    } else if (p.shieldMesh.visible) {
      p.shieldMesh.visible = false;
    }

    // Overclock timer & cyan afterimage trails
    if (p.overclockTimer > 0) {
      p.overclockTimer = Math.max(0, p.overclockTimer - simDt);
      p.afterimageAccum += simDt;
      if (p.afterimageAccum >= 0.11) {
        p.afterimageAccum = 0;
        this.spawnAfterimage(p.x, p.z, 'player', p.facingLeft, 0x4df8ff, 0.38);
      }
    }

    // Stealth veil visual opacity
    if (p.stealthTimer > 0) {
      p.stealthTimer = Math.max(0, p.stealthTimer - simDt);
      p.vis.mat.opacity = 0.34;
    } else {
      p.vis.mat.opacity = 1.0;
    }

    // Blink beacon expiration
    if (this.blinkBeacon) {
      this.blinkBeacon.ttl -= simDt;
      this.blinkBeacon.mesh.rotation.y += realDt * 3.0;
      this.blinkBeacon.mesh.position.y = 0.85 + Math.sin(this.elapsedReal * 5) * 0.12;
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

    // Movement input (WASD / Arrows) or Dash
    var mx = 0;
    var mz = 0;
    if (!this.isTypingInDom()) {
      if (this.keys['w'] || this.keys['KeyW'] || this.keys['ArrowUp']) mz -= 1;
      if (this.keys['s'] || this.keys['KeyS'] || this.keys['ArrowDown']) mz += 1;
      if (this.keys['a'] || this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
      if (this.keys['d'] || this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    }

    var speed = 6.2 * this.passives.moveSpeedMult * (isOverclock ? 1.65 : 1.0);
    if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - simDt);
      p.vx = p.dashVx;
      p.vz = p.dashVz;
      this.spawnAfterimage(p.x, p.z, 'player', p.facingLeft, 0xff4658, 0.26);
    } else if (mx !== 0 || mz !== 0) {
      var len = Math.sqrt(mx * mx + mz * mz);
      p.vx = (mx / len) * speed;
      p.vz = (mz / len) * speed;
    } else {
      p.vx = 0;
      p.vz = 0;
    }

    if (p.vx !== 0 || p.vz !== 0) {
      var nx = p.x + p.vx * simDt;
      var nz = p.z + p.vz * simDt;
      var res = this.mapApi.resolveCircleWallCollision(nx, nz, p.radius);
      p.x = res.x;
      p.z = res.z;

      // Footsteps & acoustic ripples
      p.footstepAccum += Math.sqrt(p.vx * p.vx + p.vz * p.vz) * simDt;
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

    // Update sprite frame & position
    var moving = (Math.abs(p.vx) + Math.abs(p.vz)) > 0.2;
    this.updateActorSprite(p, simDt, moving);

    // Yellow line rule check (entering hazard/rail strip before overridePct >= 100)
    if (p.x >= 49.0 && this.overridePct < 100 && this.inspector.alive && this.inspector.state !== 'HUNT') {
      this.inspector.state = 'HUNT';
      this.inspector.huntTargetId = 'player';
      this.inspector.huntLoseTimer = 10;
      this.emitSoundRipple(p.x, p.z, 90, 'yellow_line');
      this.spawnFloatingText(p.x, 2.2, p.z, '越过黄线！检票员锁定！', '#ff3b4f');
      playSfxSafe('alert');
    }
  };

  EngineSession.prototype.updateActorSprite = function (actor, dt, moving) {
    var nextFrame = 'idle';
    if (actor.actionTimer > 0) {
      nextFrame = 'action';
    } else if (moving) {
      actor.animTimer += dt * 7.2;
      nextFrame = (Math.floor(actor.animTimer) % 2 === 0) ? 'walk1' : 'walk2';
    } else {
      actor.animTimer = 0;
      nextFrame = 'idle';
    }

    if (actor.animFrame !== nextFrame) {
      actor.animFrame = nextFrame;
      var tex = this.getCharTex(actor.id, nextFrame);
      if (tex && actor.vis.mat.map !== tex) {
        actor.vis.mat.map = tex;
        actor.vis.mat.emissiveMap = tex;
        actor.vis.mat.needsUpdate = true;
      }
    }

    actor.vis.group.position.set(actor.x, 0, actor.z);
    actor.vis.sprite.scale.x = actor.facingLeft ? -1 : 1;

    // Subtle walk bob
    var baseY = (actor.id === 'inspector' ? 2.6 : 1.85) * 0.5 + 0.05;
    actor.vis.sprite.position.y = baseY + (moving ? Math.abs(Math.sin(actor.animTimer * Math.PI)) * 0.08 : 0);

    // Hit flash tint (pure-white emissive impact flash takes top priority!)
    if (actor.whiteFlash > 0) {
      actor.vis.mat.emissive.setHex(0xffffff);
      actor.vis.mat.emissiveIntensity = 3.2;
    } else if (actor.hitFlash > 0) {
      actor.vis.mat.emissive.setHex(0xff7788);
      actor.vis.mat.emissiveIntensity = 0.95;
    } else if (actor.id === 'inspector' && actor.stunTimer > 0) {
      actor.vis.mat.emissive.setHex(0x66e8ff);
      actor.vis.mat.emissiveIntensity = 0.72;
    } else {
      actor.vis.mat.emissive.setHex(0xffffff);
      actor.vis.mat.emissiveIntensity = actor.id === 'inspector' ? 0.48 : 0.34;
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
    p.attackCd = Math.max(0.22, Number(basic.cooldown) || 0.36);
    p.actionTimer = 0.24;

    var dir = this.getAimDir();
    var colorHex = hexToInt(basic.color, 0x6fd8ea);
    var baseDmg = Number(basic.damage) || Number(basic.power) || 16;
    var dmg = Math.round(baseDmg * this.passives.damageMult);
    var kb = Number(basic.knockback) || 2.2;
    var isRanged = basic.mode === 'ranged' || basic.type === 'ranged' || (Number(basic.range) || 3.0) > 4.2;

    if (isRanged) {
      this.spawnProjectile({
        owner: 'player',
        x: p.x + dir.x * 0.55,
        z: p.z + dir.z * 0.55,
        vx: dir.x * 21,
        vz: dir.z * 21,
        damage: dmg,
        knockback: kb,
        color: colorHex,
        radius: 0.28,
        ttl: 0.9
      });
      this.emitSoundRipple(p.x, p.z, 38 * this.passives.noiseMult, 'attack');
      playSfxSafe('ui_click');
    } else {
      // Crisp melee crescent arc
      var range = Number(basic.range) || 3.2;
      this.spawnSlashArc(p.x, p.z, dir.angle, range, colorHex, 0.22, false);
      this.emitSoundRipple(p.x, p.z, 30 * this.passives.noiseMult, 'attack');
      playSfxSafe('sword_slash');

      // Hit check against Inspector
      if (this.inspector.alive && this.isPointInArc(p.x, p.z, dir.x, dir.z, this.inspector.x, this.inspector.z, range + this.inspector.radius, 0.35)) {
        this.damageInspector(dmg, dir.x * Math.max(2.2, kb), dir.z * Math.max(2.2, kb), false, {
          playerImpact: true,
          hitStop: 0.05
        });
        this.addCameraShake(0.16, 0.15);
      }
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
    p.actionTimer = 0.32;
    this.stats.skillsCast += 1;

    var dir = this.getAimDir();
    var colorHex = hexToInt(sl.color, 0x6fd8ea);
    var power = Math.round((sl.power || 28) * this.passives.damageMult);
    var radius = sl.radius || 3.6;
    var duration = sl.duration || 4.0;
    var ins = this.inspector;

    switch (sl.archetype) {
      case 'sword_arc': {
        var arcRange = Math.max(3.8, radius);
        this.spawnSlashArc(p.x, p.z, dir.angle, arcRange, colorHex, 0.34, true);
        this.spawnScorchDecal(p.x, p.z, dir.angle, arcRange);
        playSfxSafe('sword_slash');
        this.emitSoundRipple(p.x, p.z, 46 * this.passives.noiseMult, 'skill');

        // Check PERFECT PARRY during Inspector red lunge telegraph (lungeWindup > 0) or active lunge!
        var dIns = dist2D(p.x, p.z, ins.x, ins.z);
        if (ins.alive && (ins.lungeWindup > 0 || ins.lungeTelegraph > 0 || ins.lungeActive > 0) && dIns <= arcRange + 1.1) {
          ins.lungeTelegraph = 0;
          ins.lungeWindup = 0;
          ins.lungeActive = 0;
          ins.teleMesh.visible = false;
          ins.teleFill.visible = false;
          ins.stunTimer = Math.max(ins.stunTimer, 2.8);
          p.energy = Math.min(p.maxEnergy, p.energy + 25);
          this.stats.parries += 1;
          var parryDmg = Math.round(power * 1.8);
          this.damageInspector(parryDmg, dir.x * 6.5, dir.z * 6.5, true, {
            playerImpact: true,
            hitStop: 0.075
          });
          this.hitStopTimer = 0.075;
          this.parryFlashTimer = 0.22;
          this.addCameraShake(0.48, 0.34);
          this.addCameraKick(dir.x * 0.62, dir.z * 0.62);
          this.spawnShockRing(ins.x, ins.z, 4.8, 0xffe484, 0.48);
          this.spawnShockRing(ins.x, ins.z, 2.6, 0xffffff, 0.28);
          this.spawnSparkBurst(ins.x, 1.35, ins.z, 0xffe07d, 22);
          playSfxSafe('parry_clang');
          this.spawnFloatingText(ins.x, 3.0, ins.z, '✦ 完美弹反! 宵练断势', '#ffe484', true);
          this.emitRadio({
            type: 'spark',
            speaker: '系统校验',
            text: '【完美弹反】你以宵练剑弧截断了零号检票员的处决突刺，使其陷入 2.8 秒硬直并返还 25 点能量！'
          });
        } else if (ins.alive && this.isPointInArc(p.x, p.z, dir.x, dir.z, ins.x, ins.z, arcRange + ins.radius, 0.15)) {
          this.damageInspector(power, dir.x * 5.0, dir.z * 5.0, false, {
            playerImpact: true,
            hitStop: 0.05
          });
          this.addCameraShake(0.24, 0.18);
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'ward_circle': {
        var wx = p.x + dir.x * 1.1;
        var wz = p.z + dir.z * 1.1;
        var wSafe = this.mapApi.resolveCircleWallCollision(wx, wz, 0.5);
        this.spawnWardCircle(wSafe.x, wSafe.z, Math.max(3.0, radius), Math.max(6.5, duration), colorHex);
        playSfxSafe('ward_hum');
        this.spawnFloatingText(wSafe.x, 2.1, wSafe.z, '结界展开 · 阻断追踪', '#f0c46c');
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
          color: colorHex
        });
        playSfxSafe('alert');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'rail_shot': {
        var endPt = this.raycastWall(p.x, p.z, dir.x, dir.z, 22);
        this.spawnLaserBeam(p.x, p.z, endPt.x, endPt.z, colorHex, 0.36);
        this.emitSoundRipple(p.x, p.z, 76 * this.passives.noiseMult, 'skill');
        this.addCameraShake(0.32, 0.22);
        this.addCameraKick(-dir.x * 0.45, -dir.z * 0.45);
        playSfxSafe('rail_fire');

        if (ins.alive && this.segmentCircleHit(p.x, p.z, endPt.x, endPt.z, ins.x, ins.z, ins.radius + 0.5)) {
          this.damageInspector(Math.round(power * 1.35), dir.x * 7.2, dir.z * 7.2, true, {
            playerImpact: true,
            hitStop: 0.05
          });
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'blink_mark': {
        if (!this.blinkBeacon) {
          this.placeBlinkBeacon(p.x, p.z, colorHex);
          playSfxSafe('ward_place');
          this.spawnFloatingText(p.x, 2.0, p.z, '空间锚点已布设 (再按召回)', '#66e8ff');
          sl.cooldownLeft = 0.4;
        } else {
          var ox = p.x;
          var oz = p.z;
          var bx = this.blinkBeacon.x;
          var bz = this.blinkBeacon.z;
          for (var ai = 0; ai < 5; ai++) {
            var frac = ai / 4;
            this.spawnAfterimage(lerp(ox, bx, frac), lerp(oz, bz, frac), 'player', p.facingLeft, colorHex, 0.45 - frac * 0.06);
          }
          p.x = bx;
          p.z = bz;
          p.invulnTimer = 0.5;
          this.spawnShockRing(bx, bz, 2.4, colorHex, 0.35);
          this.removeBlinkBeacon();
          playSfxSafe('vortex_buy');
          this.spawnFloatingText(bx, 2.1, bz, '折跃回溯！', '#66e8ff');
          sl.cooldownLeft = sl.cooldownMax;
        }
        break;
      }

      case 'aegis_shield': {
        p.shieldHp = 45;
        p.shieldTimer = Math.max(7.5, duration);
        p.shieldMesh.visible = true;
        this.spawnShockRing(p.x, p.z, 2.2, colorHex, 0.35);
        playSfxSafe('ward_place');
        this.spawnFloatingText(p.x, 2.1, p.z, '护盾 +45 (反弹击退)', '#66e8ff');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'overclock': {
        p.overclockTimer = Math.max(4.0, duration);
        this.spawnShockRing(p.x, p.z, 3.2, 0x4df8ff, 0.42);
        playSfxSafe('crisis_freeze');
        this.spawnFloatingText(p.x, 2.1, p.z, '神经超频! 移速×1.65', '#4df8ff');
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'heal_pulse': {
        var hRad = Math.max(6.2, radius);
        this.spawnShockRing(p.x, p.z, hRad, 0x4af2a1, 0.65);
        playSfxSafe('ward_place');
        p.hp = Math.min(p.maxHp, p.hp + 30);
        p.sanity = Math.min(p.maxSanity, p.sanity + 20);
        this.spawnFloatingText(p.x, 2.2, p.z, '+30 HP / +20 SAN', '#4af2a1');
        for (var hi = 0; hi < this.squad.length; hi++) {
          var ally = this.squad[hi];
          if (ally.alive && dist2D(p.x, p.z, ally.x, ally.z) <= hRad) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 30);
            this.spawnFloatingText(ally.x, 2.1, ally.z, '+30 HP', '#4af2a1');
          }
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'stealth_veil': {
        p.stealthTimer = Math.max(5.0, duration);
        this.spawnShockRing(p.x, p.z, 2.2, 0x8b7be8, 0.38);
        playSfxSafe('vortex_buy');
        this.spawnFloatingText(p.x, 2.1, p.z, '敛息隐匿 · 仇恨脱离', '#b4a3ff');
        // Immediately drop Inspector aggro
        if (ins.alive && ins.state === 'HUNT' && ins.huntTargetId === 'player') {
          ins.state = 'INVESTIGATE';
          ins.investigateTarget = { x: p.x, z: p.z };
          ins.investigateTimer = 4.5;
          ins.lungeTelegraph = 0;
          ins.lungeWindup = 0;
          ins.teleMesh.visible = false;
          ins.teleFill.visible = false;
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'seal_chain': {
        var chainRange = Math.max(10.5, radius);
        var dToBoss = dist2D(p.x, p.z, ins.x, ins.z);
        if (ins.alive && dToBoss <= chainRange) {
          ins.chainTimer = Math.max(ins.chainTimer, Math.max(5.0, duration));
          ins.sealedPct = Math.min(100, ins.sealedPct + 28);
          this.spawnSealChainsVfx(p.x, p.z, ins.x, ins.z, 0xf0c46c);
          this.damageInspector(Math.round(power * 0.75), 0, 0, false);
          this.spawnFloatingText(ins.x, 2.8, ins.z, '规则封印 +28% (' + Math.round(ins.sealedPct) + '%)', '#f0c46c');
          playSfxSafe('fusion');
          this.addCameraShake(0.28, 0.25);

          if (ins.sealedPct >= 100) {
            this.defeatInspector(true);
          }
        } else {
          // Lash forward along aim if out of range
          this.spawnSealChainsVfx(p.x, p.z, p.x + dir.x * 7.5, p.z + dir.z * 7.5, 0xf0c46c);
          this.spawnFloatingText(p.x, 2.1, p.z, '锁链未命中目标 (距检票员过远)', '#d6b274');
          playSfxSafe('blade_ring');
        }
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'recon_pulse': {
        this.reconRevealTimer = Math.max(6.5, duration);
        this.spawnShockRing(p.x, p.z, Math.max(22, radius), 0x58e6d8, 0.9);
        this.rebuildReconBeacons();
        playSfxSafe('alert');
        this.spawnFloatingText(p.x, 2.2, p.z, '声呐穿透扫描 · 目标显形', '#58e6d8');
        this.emitRadio({
          type: 'system',
          text: '【声呐回波】已穿透站台隔墙标记：零号检票员、沈砚坐标与全部未拾取线索。'
        });
        sl.cooldownLeft = sl.cooldownMax;
        break;
      }

      case 'turret_drone': {
        var dxPos = this.mapApi.resolveCircleWallCollision(p.x + dir.x * 1.2, p.z + dir.z * 1.2, 0.35);
        this.spawnTurretDrone(dxPos.x, dxPos.z, Math.max(14.0, duration), colorHex);
        playSfxSafe('vortex_buy');
        this.spawnFloatingText(dxPos.x, 2.1, dxPos.z, '浮游机炮部署 (14s)', '#58c4a6');
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
          color: 0xffa838
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
        p.invulnTimer = Math.max(p.invulnTimer, 0.32);

        // Schedule shockwave slam at end of short dash
        var self = this;
        var slamRad = Math.max(3.6, radius);
        var slamDmg = Math.round(power * 1.45);
        this.vfxList.push({
          ttl: 0.16,
          maxTtl: 0.16,
          update: function (dt) {
            this.ttl -= dt;
            if (this.ttl <= 0) {
              self.spawnShockRing(p.x, p.z, slamRad, 0xff2c44, 0.45);
              self.spawnSparkBurst(p.x, 0.5, p.z, 0xff3b4f, 18);
              self.addCameraShake(0.42, 0.28);
              self.emitSoundRipple(p.x, p.z, 72 * self.passives.noiseMult, 'skill');
              playSfxSafe('fusion');
              if (ins.alive && dist2D(p.x, p.z, ins.x, ins.z) <= slamRad + ins.radius) {
                var bx = ins.x - p.x;
                var bz = ins.z - p.z;
                var bl = Math.max(0.01, Math.sqrt(bx * bx + bz * bz));
                self.damageInspector(slamDmg, (bx / bl) * 6.8, (bz / bl) * 6.8, true, {
                  playerImpact: true,
                  hitStop: 0.05
                });
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
        this.spawnSlashArc(p.x, p.z, dir.angle, 3.6, colorHex, 0.28, true);
        playSfxSafe('sword_slash');
        if (ins.alive && dist2D(p.x, p.z, ins.x, ins.z) <= 4.0) {
          this.damageInspector(power, dir.x * 3.5, dir.z * 3.5, false, {
            playerImpact: true,
            hitStop: 0.05
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
  EngineSession.prototype.spawnWardCircle = function (x, z, radius, duration, colorHex) {
    var THREE = this.THREE;
    var group = new THREE.Group();
    group.position.set(x, 0.09, z);

    var sigilTex = this.getPropTex('ward_sigil', '#f0c46c');
    var discGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
    discGeo.rotateX(-Math.PI / 2);
    var discMat = new THREE.MeshBasicMaterial({
      map: sigilTex,
      color: colorHex || 0xf0c46c,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var disc = new THREE.Mesh(discGeo, discMat);
    group.add(disc);

    var ringGeo = new THREE.RingGeometry(radius - 0.14, radius, 40);
    ringGeo.rotateX(-Math.PI / 2);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x6fd8ea,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    group.add(ring);

    // Translucent vertical cylinder barrier wall
    var wallGeo = new THREE.CylinderGeometry(radius, radius, 1.35, 32, 1, true);
    var wallMat = new THREE.MeshBasicMaterial({
      color: colorHex || 0xf0c46c,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 0.68;
    group.add(wall);

    this.scene.add(group);
    this.wards.push({
      x: x,
      z: z,
      radius: radius,
      ttl: duration,
      maxTtl: duration,
      group: group,
      disc: disc,
      ring: ring,
      geos: [discGeo, ringGeo, wallGeo],
      mats: [discMat, ringMat, wallMat]
    });

    // If Inspector is already inside newly deployed ward, push it cleanly outside!
    if (this.inspector.alive) {
      this.enforceWardBlockOnInspector();
    }
  };

  EngineSession.prototype.updateWards = function (simDt) {
    for (var i = this.wards.length - 1; i >= 0; i--) {
      var w = this.wards[i];
      w.ttl -= simDt;
      w.disc.rotation.y += simDt * 0.65;
      w.ring.rotation.z -= simDt * 1.1;
      if (w.ttl < 1.2) {
        var fade = clamp(w.ttl / 1.2, 0, 1);
        w.mats[0].opacity = 0.58 * fade;
        w.mats[1].opacity = 0.85 * fade;
        w.mats[2].opacity = 0.12 * fade;
      }
      if (w.ttl <= 0) {
        this.spawnWardEmbers(w.x, w.z, w.radius);
        this.scene.remove(w.group);
        for (var g = 0; g < w.geos.length; g++) w.geos[g].dispose();
        for (var m = 0; m < w.mats.length; m++) w.mats[m].dispose();
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
          this.spawnFloatingText(ins.x, 2.5, ins.z, '结界弹阻！', '#f0c46c');
          this.spawnSparkBurst(ins.x, 1.0, ins.z, 0xf0c46c, 12);
          playSfxSafe('ward_hum');
        }
        blocked = true;
      }
    }
    return blocked;
  };

  EngineSession.prototype.placeBlinkBeacon = function (x, z, colorHex) {
    var THREE = this.THREE;
    this.removeBlinkBeacon();

    var group = new THREE.Group();
    group.position.set(x, 0, z);

    var tex = this.getPropTex('kunai', '#66e8ff');
    var kGeo = new THREE.PlaneGeometry(0.9, 0.9);
    var kMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(kGeo, kMat);
    mesh.position.y = 0.85;
    group.add(mesh);

    var rGeo = new THREE.RingGeometry(0.45, 0.62, 20);
    rGeo.rotateX(-Math.PI / 2);
    var rMat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x66e8ff,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var ring = new THREE.Mesh(rGeo, rMat);
    ring.position.y = 0.09;
    group.add(ring);

    this.scene.add(group);
    this.blinkBeacon = {
      x: x,
      z: z,
      ttl: 18.0,
      group: group,
      mesh: mesh,
      geos: [kGeo, rGeo],
      mats: [kMat, rMat]
    };
  };

  EngineSession.prototype.removeBlinkBeacon = function () {
    if (!this.blinkBeacon) return;
    this.scene.remove(this.blinkBeacon.group);
    for (var g = 0; g < this.blinkBeacon.geos.length; g++) this.blinkBeacon.geos[g].dispose();
    for (var m = 0; m < this.blinkBeacon.mats.length; m++) this.blinkBeacon.mats[m].dispose();
    this.blinkBeacon = null;
  };

  EngineSession.prototype.spawnTurretDrone = function (x, z, duration, colorHex) {
    var THREE = this.THREE;
    // Cap active drones at 2
    if (this.drones.length >= 2) {
      var old = this.drones.shift();
      this.scene.remove(old.group);
      old.geos.forEach(function (g) { g.dispose(); });
      old.mats.forEach(function (m) { m.dispose(); });
    }

    var group = new THREE.Group();
    group.position.set(x, 0, z);

    var tex = this.getPropTex('drone', '#58c4a6');
    var pGeo = new THREE.PlaneGeometry(0.95, 0.95);
    var pMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    var sprite = new THREE.Mesh(pGeo, pMat);
    sprite.position.y = 1.45;
    sprite.rotation.x = -0.32;
    group.add(sprite);

    var rGeo = new THREE.RingGeometry(0.35, 0.48, 18);
    rGeo.rotateX(-Math.PI / 2);
    var rMat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x58c4a6,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var ring = new THREE.Mesh(rGeo, rMat);
    ring.position.y = 0.09;
    group.add(ring);

    this.scene.add(group);
    this.drones.push({
      x: x,
      z: z,
      ttl: duration,
      fireCd: 0.35,
      group: group,
      sprite: sprite,
      ring: ring,
      geos: [pGeo, rGeo],
      mats: [pMat, rMat]
    });
  };

  EngineSession.prototype.updateDrones = function (simDt) {
    var ins = this.inspector;
    for (var i = this.drones.length - 1; i >= 0; i--) {
      var dr = this.drones[i];
      dr.ttl -= simDt;
      dr.fireCd -= simDt;
      dr.sprite.position.y = 1.45 + Math.sin(this.elapsedReal * 5.2 + i) * 0.14;
      dr.ring.rotation.z += simDt * 2.4;

      if (dr.fireCd <= 0 && ins.alive) {
        var d = dist2D(dr.x, dr.z, ins.x, ins.z);
        if (d <= 13.5 && this.mapApi.hasLineOfSight(dr.x, dr.z, ins.x, ins.z)) {
          dr.fireCd = 0.85;
          var dx = (ins.x - dr.x) / Math.max(0.01, d);
          var dz = (ins.z - dr.z) / Math.max(0.01, d);
          this.spawnProjectile({
            owner: 'drone',
            x: dr.x,
            z: dr.z,
            vx: dx * 18,
            vz: dz * 18,
            damage: Math.round(9 * this.passives.damageMult),
            knockback: 1.0,
            color: 0x58f5c8,
            radius: 0.22,
            ttl: 0.9
          });
          playSfxSafe('ui_click');
        }
      }

      if (dr.ttl <= 0) {
        this.scene.remove(dr.group);
        dr.geos.forEach(function (g) { g.dispose(); });
        dr.mats.forEach(function (m) { m.dispose(); });
        this.drones.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.spawnDecoyFlare = function (x, z, duration) {
    var THREE = this.THREE;
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    var cGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.42, 10);
    var cMat = new THREE.MeshBasicMaterial({ color: 0xffa838 });
    var mesh = new THREE.Mesh(cGeo, cMat);
    mesh.position.y = 0.22;
    group.add(mesh);

    var rGeo = new THREE.RingGeometry(0.35, 0.55, 20);
    rGeo.rotateX(-Math.PI / 2);
    var rMat = new THREE.MeshBasicMaterial({
      color: 0xffa838,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var ring = new THREE.Mesh(rGeo, rMat);
    ring.position.y = 0.09;
    group.add(ring);

    this.scene.add(group);
    this.decoys.push({
      x: x,
      z: z,
      ttl: duration,
      pulseCd: 0.05,
      group: group,
      geos: [cGeo, rGeo],
      mats: [cMat, rMat]
    });
    this.spawnFloatingText(x, 1.5, z, '声学诱饵启动！', '#ffa838');
  };

  EngineSession.prototype.updateDecoys = function (simDt) {
    for (var i = this.decoys.length - 1; i >= 0; i--) {
      var dc = this.decoys[i];
      dc.ttl -= simDt;
      dc.pulseCd -= simDt;
      if (dc.pulseCd <= 0) {
        dc.pulseCd = 1.3;
        this.emitSoundRipple(dc.x, dc.z, 86, 'decoy');
        this.spawnSparkBurst(dc.x, 0.4, dc.z, 0xffa838, 6);
      }
      if (dc.ttl <= 0) {
        this.scene.remove(dc.group);
        dc.geos.forEach(function (g) { g.dispose(); });
        dc.mats.forEach(function (m) { m.dispose(); });
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
      this.reconBeacons[i].geo.dispose();
      this.reconBeacons[i].mat.dispose();
    }
    this.reconBeacons = [];
  };

  // ---------------------------------------------------------------------------
  // Projectiles & EMP / Decoy Arc Projectiles
  // ---------------------------------------------------------------------------
  EngineSession.prototype.spawnProjectile = function (cfg) {
    var THREE = this.THREE;
    var geo = new THREE.SphereGeometry(cfg.radius || 0.24, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: cfg.color || 0x6fd8ea });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cfg.x, 1.05, cfg.z);
    this.scene.add(mesh);

    this.projectiles.push({
      mode: 'linear',
      owner: cfg.owner,
      x: cfg.x,
      z: cfg.z,
      vx: cfg.vx,
      vz: cfg.vz,
      damage: cfg.damage || 10,
      knockback: cfg.knockback || 1.5,
      radius: cfg.radius || 0.24,
      ttl: cfg.ttl || 0.9,
      color: cfg.color || 0x6fd8ea,
      mesh: mesh,
      geo: geo,
      mat: mat
    });
  };

  EngineSession.prototype.spawnArcProjectile = function (cfg) {
    var THREE = this.THREE;
    var geo = new THREE.SphereGeometry(0.26, 10, 10);
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
      mesh: mesh,
      geo: geo,
      mat: mat
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

        if (t >= 1) {
          if (pr.kind === 'emp') {
            this.detonateEmp(pr.tx, pr.tz, pr.radius, pr.power, pr.stunSec, pr.color);
          } else if (pr.kind === 'decoy') {
            this.spawnDecoyFlare(pr.tx, pr.tz, pr.flareDuration);
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
          this.spawnSparkBurst(pr.x, 1.0, pr.z, pr.color, 6);
          remove = true;
        } else if (ins.alive && dist2D(pr.x, pr.z, ins.x, ins.z) <= ins.radius + pr.radius + 0.2) {
          var vLen = Math.max(0.01, Math.sqrt(pr.vx * pr.vx + pr.vz * pr.vz));
          this.damageInspector(pr.damage, (pr.vx / vLen) * pr.knockback, (pr.vz / vLen) * pr.knockback, false);
          this.spawnSparkBurst(pr.x, 1.1, pr.z, pr.color, 8);
          remove = true;
        } else if (pr.ttl <= 0) {
          remove = true;
        }
      }

      if (remove) {
        this.scene.remove(pr.mesh);
        pr.geo.dispose();
        pr.mat.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  };

  EngineSession.prototype.detonateEmp = function (x, z, radius, power, stunSec, colorHex) {
    var THREE = this.THREE;
    // Expanding translucent electric sphere
    var sGeo = new THREE.SphereGeometry(1, 18, 14);
    var sMat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x4de8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending
    });
    var sphere = new THREE.Mesh(sGeo, sMat);
    sphere.position.set(x, 0.9, z);
    this.scene.add(sphere);

    var self = this;
    this.vfxList.push({
      ttl: 0.48,
      maxTtl: 0.48,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var sc = 0.4 + p * radius;
        sphere.scale.set(sc, sc * 0.65, sc);
        sphere.rotation.y += dt * 5;
        sMat.opacity = 0.72 * (1 - p);
      },
      dispose: function () {
        self.scene.remove(sphere);
        sGeo.dispose();
        sMat.dispose();
      }
    });

    this.spawnShockRing(x, z, radius, colorHex || 0x4de8ff, 0.55);
    this.spawnSparkBurst(x, 1.0, z, 0x4de8ff, 18);
    this.addCameraShake(0.32, 0.24);
    this.emitSoundRipple(x, z, 70, 'emp');
    this.empBlackoutTimer = 3.5;
    this.empBlackoutPos.x = x;
    this.empBlackoutPos.z = z;
    this.empSparkAccum = 0;
    this.glitchAmount = Math.max(this.glitchAmount, 0.5);
    playSfxSafe('emp_boom');

    // Stun Inspector if in radius
    var ins = this.inspector;
    if (ins.alive && dist2D(x, z, ins.x, ins.z) <= radius + ins.radius) {
      ins.stunTimer = Math.max(ins.stunTimer, stunSec);
      ins.lungeTelegraph = 0;
      ins.lungeWindup = 0;
      ins.lungeActive = 0;
      ins.teleMesh.visible = false;
      ins.teleFill.visible = false;
      this.damageInspector(power, 0, 0, true);
      this.spawnFloatingText(ins.x, 2.8, ins.z, 'EMP瘫痪 ' + stunSec.toFixed(1) + 's!', '#4de8ff');
    }

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

    for (var i = 0; i < this.interactables.length; i++) {
      var it = this.interactables[i];
      it.bobPhase += simDt * 2.8;

      if (it.type === 'clue') {
        it.sprite.position.y = 0.78 + Math.sin(it.bobPhase) * 0.12;
        it.ring.rotation.z += simDt * 1.4;
        if (it.done) {
          it.mat.opacity = 0.22;
          it.ringMat.opacity = 0.12;
        }
      } else if (it.type === 'console') {
        it.ring.rotation.z += simDt * (it.done ? 0.5 : 1.5);
        if (it.done) {
          it.ringMat.color.setHex(0x4af2a1);
        }
      } else if (it.type === 'exit') {
        it.ring.rotation.z += simDt * (exitUnlocked ? 2.4 : 0.6);
        it.ringMat.color.setHex(exitUnlocked ? 0x4af2a1 : (this.trainInStation ? 0xffa838 : 0xe85d4a));
        it.ringMat.opacity = exitUnlocked ? (0.65 + Math.sin(this.elapsedReal * 6) * 0.25) : 0.45;
      }

      var d = dist2D(p.x, p.z, it.x, it.z);
      if (d <= bestDist) {
        if (it.type === 'exit' || !it.done) {
          bestDist = d;
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
        this.emitRadio({
          type: 'system',
          text: '【主轨极性已彻底反转 100%】0号站台应急撤离闸门已解锁！全员立即前往0号站台撤离！'
        });
        this.showSpeechBubble('yanci', '道岔已全部反转！全员向0号站台闸门汇合撤离！');
      } else {
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

    return false;
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

  EngineSession.prototype.getNpcGoal = function (npc) {
    var p = this.player;
    var ins = this.inspector;
    var mapApi = this.mapApi;

    // Explicit player order overrides autonomous routine
    if (npc.order && npc.order !== 'auto') {
      if (npc.order === 'follow' || npc.order === 'regroup') {
        return { x: p.x, z: p.z, stopDist: 2.0 };
      }
      if (npc.order === 'hold') {
        return { x: npc.holdX, z: npc.holdZ, stopDist: 0.45 };
      }
      if (npc.order === 'engage') {
        if (ins.alive) return { x: ins.x, z: ins.z, stopDist: npc.id === 'lujin' ? 2.1 : 5.2 };
        return { x: p.x, z: p.z, stopDist: 2.2 };
      }
      if (npc.order.indexOf('goto_') === 0) {
        var zoneId = npc.order.slice(5);
        // If ordered to dispatch/substation and there's an unfinished console there, walk right to it!
        for (var ci = 0; ci < this.interactables.length; ci++) {
          var obj = this.interactables[ci];
          if (obj.type === 'console' && obj.zoneId === zoneId && !obj.done) {
            return { x: obj.x, z: obj.z, stopDist: 1.5, workConsole: obj };
          }
        }
        var zc = mapApi.getZoneCenter(zoneId);
        return { x: zc.x, z: zc.z, stopDist: 1.6 };
      }
    }

    // Autonomous Role AI
    if (npc.id === 'xutan') {
      var dInsX = ins.alive ? dist2D(npc.x, npc.z, ins.x, ins.z) : 99;
      if (dInsX < 9.5) {
        if (npc.shoutCd <= 0) {
          npc.shoutCd = 14;
          var line = '检票员摸过来了！红色提灯光就在走廊外，快拦一下！';
          this.showSpeechBubble('xutan', line);
          this.emitRadio({ type: 'dialogue', npcId: 'xutan', speaker: '许檀', text: line });
        }
        // Flee away from Inspector toward concourse or player
        var fleeCenter = mapApi.getZoneCenter('concourse');
        return { x: fleeCenter.x, z: fleeCenter.z, stopDist: 1.6 };
      }
      // Work on dispatch console first, then substation console
      var dispCon = this.findUnfinishedConsole('dispatch') || this.findUnfinishedConsole('substation');
      if (dispCon) {
        return { x: dispCon.x, z: dispCon.z, stopDist: 1.5, workConsole: dispCon };
      }
      var p0 = mapApi.getZoneCenter('platform0');
      return { x: p0.x - 1.5, z: p0.z, stopDist: 2.0 };
    }

    if (npc.id === 'lujin') {
      if (ins.alive) {
        var dInsP = dist2D(ins.x, ins.z, p.x, p.z);
        var xutan = this.squadById['xutan'];
        var dInsXu = (xutan && xutan.alive) ? dist2D(ins.x, ins.z, xutan.x, xutan.z) : 99;
        if (dInsP < 14 || dInsXu < 12 || dist2D(npc.x, npc.z, ins.x, ins.z) < 11) {
          return { x: ins.x, z: ins.z, stopDist: 2.1, intercept: true };
        }
      }
      var corr = mapApi.getZoneCenter('corridor');
      return { x: corr.x, z: corr.z, stopDist: 2.2 };
    }

    if (npc.id === 'yanci') {
      if (ins.alive && dist2D(npc.x, npc.z, ins.x, ins.z) < 6.5) {
        // Smart tactical kite away from Inspector
        var ax = npc.x - ins.x;
        var az = npc.z - ins.z;
        var al = Math.max(0.01, Math.sqrt(ax * ax + az * az));
        var safeKite = mapApi.resolveCircleWallCollision(npc.x + (ax / al) * 5.5, npc.z + (az / al) * 5.5, 0.5);
        return { x: safeKite.x, z: safeKite.z, stopDist: 1.0 };
      }
      // Inspect nearest undiscovered clue in concourse/corridor, else escort player
      for (var k = 0; k < this.interactables.length; k++) {
        var cl = this.interactables[k];
        if (cl.type === 'clue' && !cl.done && (cl.zoneId === 'concourse' || cl.zoneId === 'corridor')) {
          return { x: cl.x, z: cl.z, stopDist: 1.8, inspectClue: cl };
        }
      }
      return { x: p.x, z: p.z, stopDist: 3.4 };
    }

    if (npc.id === 'shenyan') {
      // Sneak between substation and platform0, emitting suspicious noise spikes when alone
      var targetZone = (Math.floor(this.elapsedSim / 24) % 2 === 0) ? 'substation' : 'platform0';
      var sz = mapApi.getZoneCenter(targetZone);
      return { x: sz.x - 1.5, z: sz.z + 1.0, stopDist: 2.0 };
    }

    return { x: p.x, z: p.z, stopDist: 2.5 };
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

      var goal = this.getNpcGoal(npc);
      var dGoal = dist2D(npc.x, npc.z, goal.x, goal.z);

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
        var step = this.mapApi.resolveCircleWallCollision(npc.x + vx * simDt, npc.z + vz * simDt, npc.radius);
        npc.x = step.x;
        npc.z = step.z;
        if (Math.abs(vx) > 0.25) npc.facingLeft = vx < 0;
      }

      // Role special actions
      if (goal.workConsole && !goal.workConsole.done && dist2D(npc.x, npc.z, goal.workConsole.x, goal.workConsole.z) <= 2.3) {
        var workRate = npc.id === 'xutan' ? 4.8 : 2.6;
        this.advanceConsole(goal.workConsole, workRate * simDt, npc.id);
        npc.actionTimer = 0.2;
      }

      // Yan Ci flags nearby clue on radio
      if (npc.id === 'yanci' && goal.inspectClue && !goal.inspectClue.done && dist2D(npc.x, npc.z, goal.inspectClue.x, goal.inspectClue.z) <= 2.4 && npc.shoutCd <= 0) {
        npc.shoutCd = 18;
        var cMsg = '我这边发现一处物证（' + goal.inspectClue.label + '），你过来回收一下。';
        this.showSpeechBubble('yanci', cMsg);
        this.emitRadio({ type: 'dialogue', npcId: 'yanci', speaker: '严辞', text: cMsg });
      }

      // Lu Jin & Yan Ci fire tactical shots/slashes at Inspector!
      if (ins.alive && (npc.id === 'lujin' || npc.id === 'yanci' || npc.order === 'engage')) {
        var dBoss = dist2D(npc.x, npc.z, ins.x, ins.z);
        if (npc.attackCd <= 0 && dBoss <= 9.5 && this.mapApi.hasLineOfSight(npc.x, npc.z, ins.x, ins.z)) {
          npc.actionTimer = 0.28;
          npc.facingLeft = ins.x < npc.x;
          var bdx = (ins.x - npc.x) / Math.max(0.01, dBoss);
          var bdz = (ins.z - npc.z) / Math.max(0.01, dBoss);

          if (npc.id === 'lujin' && dBoss <= 2.7) {
            npc.attackCd = 1.15;
            this.spawnSlashArc(npc.x, npc.z, Math.atan2(bdz, bdx), 2.6, 0x58e6ff, 0.22, false);
            this.damageInspector(12, bdx * 2.8, bdz * 2.8, false);
            if (npc.shoutCd <= 0) {
              npc.shoutCd = 12;
              this.showSpeechBubble('lujin', '我顶住正面！趁现在拉道岔！');
            }
          } else {
            npc.attackCd = npc.id === 'lujin' ? 1.3 : 1.9;
            this.spawnProjectile({
              owner: npc.id,
              x: npc.x + bdx * 0.5,
              z: npc.z + bdz * 0.5,
              vx: bdx * 16,
              vz: bdz * 16,
              damage: npc.id === 'lujin' ? 8 : 6,
              knockback: 1.0,
              color: hexToInt(npc.accentColor, 0x6fd8ea),
              radius: 0.2,
              ttl: 0.8
            });
          }
        }
      }

      // Shen Yan suspicious sabotage noise spike when alone
      if (npc.id === 'shenyan' && npc.sabotageCd <= 0 && dist2D(npc.x, npc.z, p.x, p.z) > 10.5) {
        npc.sabotageCd = 24;
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
    }
  };

  // ---------------------------------------------------------------------------
  // Inspector Boss AI (PATROL -> INVESTIGATE -> HUNT + 0.9s Crimson Lunge)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.updateInspector = function (simDt) {
    var ins = this.inspector;
    if (!ins.alive) {
      ins.vis.group.visible = false;
      if (this.inspectorLantern) this.inspectorLantern.intensity = 0;
      return;
    }

    var p = this.player;
    var mapApi = this.mapApi;

    if (ins.hitFlash > 0) ins.hitFlash = Math.max(0, ins.hitFlash - simDt);
    if (ins.actionTimer > 0) ins.actionTimer = Math.max(0, ins.actionTimer - simDt);
    if (ins.lungeCd > 0) ins.lungeCd = Math.max(0, ins.lungeCd - simDt);
    if (ins.chainTimer > 0) ins.chainTimer = Math.max(0, ins.chainTimer - simDt);

    // Stunned (from EMP or Perfect Parry!)
    if (ins.stunTimer > 0) {
      ins.stunTimer = Math.max(0, ins.stunTimer - simDt);
      ins.teleMesh.visible = false;
      ins.teleFill.visible = false;
      this.updateActorSprite(ins, simDt, false);
      this.enforceWardBlockOnInspector();
      return;
    }

    // Active Lunge Dash execution
    if (ins.lungeActive > 0) {
      ins.lungeActive = Math.max(0, ins.lungeActive - simDt);
      var dashSpeed = 19.0;
      var nx = ins.x + ins.lungeDirX * dashSpeed * simDt;
      var nz = ins.z + ins.lungeDirZ * dashSpeed * simDt;
      var step = mapApi.resolveCircleWallCollision(nx, nz, ins.radius);
      ins.x = step.x;
      ins.z = step.z;
      this.enforceWardBlockOnInspector();

      // Check damage to player or squad during lunge
      if (!ins.lungeHitDone) {
        if (dist2D(ins.x, ins.z, p.x, p.z) <= ins.radius + p.radius + 0.55) {
          ins.lungeHitDone = true;
          this.damagePlayer(34, ins.lungeDirX * 5.2, ins.lungeDirZ * 5.2);
        } else {
          for (var si = 0; si < this.squad.length; si++) {
            var al = this.squad[si];
            if (al.alive && dist2D(ins.x, ins.z, al.x, al.z) <= ins.radius + al.radius + 0.5) {
              ins.lungeHitDone = true;
              this.damageAlly(al, 26);
              break;
            }
          }
        }
      }

      ins.actionTimer = 0.25;
      this.updateActorSprite(ins, simDt, true);
      return;
    }

    // 0.9s Crimson Lunge Telegraph wind-up!
    if (ins.lungeTelegraph > 0) {
      ins.lungeTelegraph = Math.max(0, ins.lungeTelegraph - simDt);
      ins.lungeWindup = ins.lungeTelegraph;
      var progress = 1 - clamp(ins.lungeTelegraph / 0.9, 0, 1);
      ins.teleMesh.visible = true;
      ins.teleFill.visible = true;
      var yaw = Math.atan2(ins.lungeDirX, ins.lungeDirZ);
      ins.teleMesh.rotation.y = yaw;
      ins.teleFill.rotation.y = yaw;
      ins.teleFill.scale.set(1, 1, Math.max(0.02, progress));
      ins.actionTimer = 0.2;

      if (ins.lungeTelegraph <= 0) {
        ins.lungeWindup = 0;
        ins.teleMesh.visible = false;
        ins.teleFill.visible = false;
        ins.lungeActive = 0.28;
        ins.lungeHitDone = false;
        ins.lungeCd = 3.2;
        playSfxSafe('sword_slash');
        this.emitSoundRipple(ins.x, ins.z, 65, 'boss');
      }
      this.updateActorSprite(ins, simDt, false);
      return;
    }

    // Vision & target selection (Decoys lure Inspector strongly!)
    var activeDecoy = this.decoys.length > 0 ? this.decoys[0] : null;
    if (activeDecoy && dist2D(ins.x, ins.z, activeDecoy.x, activeDecoy.z) < 26) {
      ins.state = 'INVESTIGATE';
      ins.investigateTarget = { x: activeDecoy.x, z: activeDecoy.z };
      ins.investigateTimer = 4.0;
    } else {
      // Check line-of-sight to player (Stealth Veil drastically cuts sight range)
      var sightRange = p.stealthTimer > 0 ? 4.2 : 13.8;
      var dPlayer = dist2D(ins.x, ins.z, p.x, p.z);
      var seesPlayer = (dPlayer <= sightRange && mapApi.hasLineOfSight(ins.x, ins.z, p.x, p.z));

      if (seesPlayer) {
        if (ins.state !== 'HUNT') {
          playSfxSafe('alert');
          this.spawnFloatingText(ins.x, 2.8, ins.z, '已锁定目标!', '#ff2c44');
        }
        ins.state = 'HUNT';
        ins.huntTargetId = 'player';
        ins.huntLoseTimer = 6.5;
      } else {
        // Also check Lu Jin intercepting close by
        var lujin = this.squadById['lujin'];
        if (lujin && lujin.alive && dist2D(ins.x, ins.z, lujin.x, lujin.z) < 7.0 && mapApi.hasLineOfSight(ins.x, ins.z, lujin.x, lujin.z)) {
          ins.state = 'HUNT';
          ins.huntTargetId = 'lujin';
          ins.huntLoseTimer = 4.5;
        }
      }
    }

    // Determine movement target based on state
    var targetX = ins.x;
    var targetZ = ins.z;
    var baseSpeed = 3.35;

    if (ins.state === 'HUNT') {
      baseSpeed = 4.65;
      var tgt = (ins.huntTargetId === 'player') ? p : (this.squadById[ins.huntTargetId] || p);
      if (tgt.alive === false) tgt = p;
      targetX = tgt.x;
      targetZ = tgt.z;

      var dTgt = dist2D(ins.x, ins.z, tgt.x, tgt.z);
      var hasLos = mapApi.hasLineOfSight(ins.x, ins.z, tgt.x, tgt.z);
      if (!hasLos || (tgt === p && p.stealthTimer > 0 && dTgt > 4.5)) {
        ins.huntLoseTimer -= simDt;
        if (ins.huntLoseTimer <= 0) {
          ins.state = 'INVESTIGATE';
          ins.investigateTarget = { x: tgt.x, z: tgt.z };
          ins.investigateTimer = 4.5;
        }
      } else {
        ins.huntLoseTimer = 6.0;
        // Initiate 0.9s Crimson Lunge Telegraph when in strike distance!
        if (dTgt <= 4.9 && ins.lungeCd <= 0) {
          var ldx = tgt.x - ins.x;
          var ldz = tgt.z - ins.z;
          var ll = Math.max(0.01, Math.sqrt(ldx * ldx + ldz * ldz));
          ins.lungeDirX = ldx / ll;
          ins.lungeDirZ = ldz / ll;
          ins.lungeTelegraph = 0.9;
          ins.lungeWindup = 0.9;
          ins.facingLeft = ins.lungeDirX < 0;
          this.spawnFloatingText(ins.x, 2.9, ins.z, '处决蓄力! (可弹反/结界)', '#ff3b4f');
          playSfxSafe('alert');
          return;
        }
      }
    } else if (ins.state === 'INVESTIGATE' && ins.investigateTarget) {
      baseSpeed = 3.95;
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

    // Apply slows (Overclock 45% slow, Seal Chain 65% slow)
    if (p.overclockTimer > 0) baseSpeed *= 0.55;
    if (ins.chainTimer > 0) baseSpeed *= 0.35;

    // A* Pathfinding
    ins.repathTimer -= simDt;
    if (ins.repathTimer <= 0) {
      ins.repathTimer = ins.state === 'HUNT' ? 0.55 : 1.3;
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
      var res = mapApi.resolveCircleWallCollision(ins.x + mx * simDt, ins.z + mz * simDt, ins.radius);
      ins.x = res.x;
      ins.z = res.z;
      if (Math.abs(mx) > 0.2) ins.facingLeft = mx < 0;
      moving = true;
    }

    // Physical Ward Circle blocking enforcement!
    this.enforceWardBlockOnInspector();

    this.updateActorSprite(ins, simDt, moving);
  };

  // ---------------------------------------------------------------------------
  // Damage & Defeat Handling
  // ---------------------------------------------------------------------------
  EngineSession.prototype.damageInspector = function (amount, kbX, kbZ, isCrit, opts) {
    var ins = this.inspector;
    if (!ins.alive) return;
    var dmg = Math.max(1, Math.round(amount));
    ins.hp = Math.max(0, ins.hp - dmg);
    ins.hitFlash = 0.16;
    this.stats.damageDealt += dmg;
    playSfxSafe('hit_impact');

    if (opts && opts.playerImpact) {
      ins.whiteFlash = Math.max(ins.whiteFlash || 0, 0.09);
      this.hitStopTimer = Math.max(this.hitStopTimer, opts.hitStop || 0.05);
      if (kbX || kbZ) {
        var kLen = Math.max(0.01, Math.sqrt((kbX || 0) * (kbX || 0) + (kbZ || 0) * (kbZ || 0)));
        this.addCameraKick(((kbX || 0) / kLen) * 0.42, ((kbZ || 0) / kLen) * 0.42);
      }
    }

    if (kbX || kbZ) {
      var kbRes = this.mapApi.resolveCircleWallCollision(ins.x + (kbX || 0) * 0.28, ins.z + (kbZ || 0) * 0.28, ins.radius);
      ins.x = kbRes.x;
      ins.z = kbRes.z;
      this.enforceWardBlockOnInspector();
    }

    this.spawnFloatingText(ins.x, 2.5, ins.z, (isCrit ? '★-' : '-') + dmg, isCrit ? '#ffe07d' : '#ff6b78');
    this.spawnSparkBurst(ins.x, 1.3, ins.z, isCrit ? 0xffe07d : 0xff3b4f, isCrit ? 14 : 8);

    // Taking damage alerts Inspector toward player if not stunned
    if (ins.stunTimer <= 0 && this.player.stealthTimer <= 0) {
      ins.state = 'HUNT';
      ins.huntTargetId = 'player';
      ins.huntLoseTimer = 7.0;
    }

    if (ins.hp <= 0) {
      this.defeatInspector(false);
    }
  };

  EngineSession.prototype.defeatInspector = function (sealed) {
    var ins = this.inspector;
    if (!ins.alive) return;
    ins.alive = false;
    ins.hp = 0;
    ins.teleMesh.visible = false;
    ins.teleFill.visible = false;
    ins.vis.group.visible = false;

    this.stats.inspectorDefeated = true;
    this.stats.inspectorSealed = !!sealed;
    this.hitStopTimer = 0.12;
    this.addCameraShake(0.6, 0.45);
    this.spawnShockRing(ins.x, ins.z, 6.5, sealed ? 0xf0c46c : 0xff3b4f, 0.9);
    this.spawnSparkBurst(ins.x, 1.4, ins.z, sealed ? 0xf0c46c : 0xff4d60, 28);
    playSfxSafe('fusion');

    this.emitRadio({
      type: 'system',
      text: sealed
        ? '【规则收容完成】零号检票员已被完全封印！0号站台撤离限制解除！'
        : '【目标击破】零号检票员已彻底瓦解，胸口拟态广播发射源化为黑灰！'
    });

    // Dramatic brief moment before triggering victory ending
    var self = this;
    this.vfxList.push({
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

    // Aegis Shield absorption + knockback reflection!
    if (p.shieldHp > 0) {
      var absorbed = Math.min(p.shieldHp, dmg);
      p.shieldHp -= absorbed;
      dmg -= absorbed;
      this.spawnFloatingText(p.x, 2.3, p.z, '护盾吸收 ' + absorbed, '#66e8ff');
      this.spawnShockRing(p.x, p.z, 2.8, 0x66e8ff, 0.35);
      playSfxSafe('ward_place');
      if (this.inspector.alive && dist2D(p.x, p.z, this.inspector.x, this.inspector.z) < 4.5) {
        var rx = this.inspector.x - p.x;
        var rz = this.inspector.z - p.z;
        var rl = Math.max(0.01, Math.sqrt(rx * rx + rz * rz));
        this.damageInspector(12, (rx / rl) * 6.0, (rz / rl) * 6.0, false);
      }
      if (dmg <= 0) {
        p.invulnTimer = 0.45;
        return;
      }
    }

    p.hp = Math.max(0, p.hp - dmg);
    p.sanity = Math.max(0, p.sanity - 5);
    p.hitFlash = 0.25;
    p.invulnTimer = 0.65;
    this.stats.damageTaken += dmg;
    this.glitchAmount = Math.max(this.glitchAmount, 0.65);
    this.addCameraShake(0.45, 0.28);
    this.hitStopTimer = 0.06;

    if (kbX || kbZ) {
      var kLenP = Math.max(0.01, Math.sqrt((kbX || 0) * (kbX || 0) + (kbZ || 0) * (kbZ || 0)));
      this.addCameraKick(((kbX || 0) / kLenP) * 0.48, ((kbZ || 0) / kLenP) * 0.48);
      var res = this.mapApi.resolveCircleWallCollision(p.x + kbX * 0.22, p.z + kbZ * 0.22, p.radius);
      p.x = res.x;
      p.z = res.z;
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
    ally.hitFlash = 0.24;
    this.spawnFloatingText(ally.x, 2.2, ally.z, '-' + dmg, '#ff7766');
    if (ally.hp <= 0) {
      ally.alive = false;
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
        tr.z = -24;
        tr.group.visible = true;
        tr.group.position.set(TRAIN_X, RAIL_Y + 0.12, tr.z);
        playSfxSafe('train_horn');
      }
    } else if (this.trainPhase === 'arriving') {
      var targetZ = 27;
      var rem = targetZ - tr.z;
      var spd = clamp(rem * 1.45, 2.5, 26);
      tr.z += spd * simDt;
      tr.group.position.z = tr.z;
      if (dist2D(this.player.x, this.player.z, TRAIN_X, 18) < 15) {
        this.addCameraShake(0.08, 0.1);
      }
      this.checkTrainCollision();
      if (tr.z >= targetZ - 0.15) {
        tr.z = targetZ;
        this.trainPhase = 'docked';
        this.trainInStation = true;
        this.trainTimer = TRAIN_DWELL_SEC;
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
      tr.z += 22 * simDt;
      tr.group.position.z = tr.z;
      this.checkTrainCollision();
      if (tr.z >= 72) {
        tr.group.visible = false;
        this.trainPhase = 'waiting';
        this.trainCountdownSec = TRAIN_CYCLE_SEC;
        this.trainWarned = false;
      }
    }
  };

  EngineSession.prototype.checkTrainCollision = function () {
    var p = this.player;
    if (p.x >= TRAIN_X - 1.65 && p.x <= TRAIN_X + 1.65 && p.z <= this.train.z + 3.2 && p.z >= this.train.z - 22) {
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

    this.emitRadio({
      type: 'broadcast',
      speaker: '【疑似系统播报】',
      text: text,
      fake: true,
      timeGlitch: true
    });
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

    var maxRad = 1.6 + s * 0.08;
    var geo = new THREE.RingGeometry(0.84, 1.0, 28);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.55,
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
      ttl: 0.72,
      maxTtl: 0.72,
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
      sr.mat.opacity = 0.55 * (1 - p);
      if (sr.ttl <= 0) {
        this.scene.remove(sr.mesh);
        sr.geo.dispose();
        sr.mat.dispose();
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
  // 3D VFX Spawners (Slash Arc, Laser Beam, Chains, Shock Ring, Sparks, Ghosts)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.spawnSlashArc = function (x, z, angle, radius, colorHex, duration, heavy) {
    var THREE = this.THREE;
    var arcLen = heavy ? Math.PI * 0.72 : Math.PI * 0.56;
    var geo = new THREE.RingGeometry(radius * 0.42, radius, 22, 1, -arcLen * 0.5, arcLen);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x6fd8ea,
      transparent: true,
      opacity: heavy ? 0.92 : 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.95, z);
    mesh.rotation.y = -angle;
    this.scene.add(mesh);

    var self = this;
    this.vfxList.push({
      ttl: duration,
      maxTtl: duration,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        mesh.scale.set(0.85 + p * 0.35, 1, 0.85 + p * 0.35);
        mesh.rotation.y = -angle + (p - 0.5) * 0.55;
        mat.opacity = (heavy ? 0.92 : 0.78) * (1 - p);
      },
      dispose: function () {
        self.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnLaserBeam = function (x0, z0, x1, z1, colorHex, duration) {
    var THREE = this.THREE;
    var dx = x1 - x0;
    var dz = z1 - z0;
    var len = Math.max(0.2, Math.sqrt(dx * dx + dz * dz));

    var coreGeo = new THREE.CylinderGeometry(0.11, 0.11, len, 8);
    coreGeo.rotateX(Math.PI / 2);
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending
    });

    var glowGeo = new THREE.CylinderGeometry(0.32, 0.32, len, 8);
    glowGeo.rotateX(Math.PI / 2);
    var glowMat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x4de8ff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var group = new THREE.Group();
    group.add(new THREE.Mesh(coreGeo, coreMat));
    group.add(new THREE.Mesh(glowGeo, glowMat));
    group.position.set((x0 + x1) * 0.5, 1.05, (z0 + z1) * 0.5);
    group.rotation.y = Math.atan2(dx, dz);
    this.scene.add(group);

    this.spawnSparkBurst(x1, 1.0, z1, colorHex || 0x4de8ff, 14);

    var self = this;
    this.vfxList.push({
      ttl: duration,
      maxTtl: duration,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var w = Math.max(0.05, 1 - p);
        group.scale.set(w, w, 1);
        coreMat.opacity = 1 - p;
        glowMat.opacity = 0.6 * (1 - p);
      },
      dispose: function () {
        self.scene.remove(group);
        coreGeo.dispose();
        glowGeo.dispose();
        coreMat.dispose();
        glowMat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnSealChainsVfx = function (x0, z0, x1, z1, colorHex) {
    var THREE = this.THREE;
    var dx = x1 - x0;
    var dz = z1 - z0;
    var len = Math.max(0.5, Math.sqrt(dx * dx + dz * dz));

    var group = new THREE.Group();
    var geos = [];
    var mats = [];

    for (var c = -1; c <= 1; c++) {
      var geo = new THREE.CylinderGeometry(0.06, 0.06, len, 6);
      geo.rotateX(Math.PI / 2);
      var mat = new THREE.MeshBasicMaterial({
        color: c === 0 ? 0xff4658 : (colorHex || 0xf0c46c),
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending
      });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(c * 0.25, c * 0.18, 0);
      group.add(m);
      geos.push(geo);
      mats.push(mat);
    }
    group.position.set((x0 + x1) * 0.5, 1.15, (z0 + z1) * 0.5);
    group.rotation.y = Math.atan2(dx, dz);
    this.scene.add(group);
    this.spawnShockRing(x1, z1, 2.2, 0xf0c46c, 0.6);

    var self = this;
    this.vfxList.push({
      ttl: 1.15,
      maxTtl: 1.15,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        for (var mi = 0; mi < mats.length; mi++) mats[mi].opacity = 0.88 * (1 - p);
      },
      dispose: function () {
        self.scene.remove(group);
        geos.forEach(function (g) { g.dispose(); });
        mats.forEach(function (m) { m.dispose(); });
      }
    });
  };

  EngineSession.prototype.spawnShockRing = function (x, z, maxRadius, colorHex, duration) {
    var THREE = this.THREE;
    var geo = new THREE.RingGeometry(0.75, 1.0, 32);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshBasicMaterial({
      color: colorHex || 0x6fd8ea,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.11, z);
    mesh.scale.set(0.25, 0.25, 1);
    this.scene.add(mesh);

    var self = this;
    this.vfxList.push({
      ttl: duration,
      maxTtl: duration,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var sc = 0.25 + p * maxRadius;
        mesh.scale.set(sc, sc, 1);
        mat.opacity = 0.85 * (1 - p);
      },
      dispose: function () {
        self.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnSparkBurst = function (x, y, z, colorHex, count) {
    var THREE = this.THREE;
    var n = count || 10;
    var positions = new Float32Array(n * 3);
    var vels = [];
    for (var i = 0; i < n; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      var a = Math.random() * Math.PI * 2;
      var spd = 2.0 + Math.random() * 5.2;
      vels.push({ vx: Math.cos(a) * spd, vy: 1.5 + Math.random() * 3.5, vz: Math.sin(a) * spd });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: colorHex || 0x6fd8ea,
      size: 0.24,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(geo, mat);
    this.scene.add(pts);

    var self = this;
    this.vfxList.push({
      ttl: 0.42,
      maxTtl: 0.42,
      update: function (dt) {
        this.ttl -= dt;
        var attr = geo.attributes.position;
        for (var k = 0; k < n; k++) {
          attr.array[k * 3] += vels[k].vx * dt;
          attr.array[k * 3 + 1] = Math.max(0.08, attr.array[k * 3 + 1] + vels[k].vy * dt);
          attr.array[k * 3 + 2] += vels[k].vz * dt;
          vels[k].vy -= 9.5 * dt;
        }
        attr.needsUpdate = true;
        mat.opacity = clamp(this.ttl / this.maxTtl, 0, 1);
      },
      dispose: function () {
        self.scene.remove(pts);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnAfterimage = function (x, z, actorId, facingLeft, colorHex, duration) {
    var THREE = this.THREE;
    var tex = this.getCharTex(actorId, 'action');
    var geo = new THREE.PlaneGeometry(1.35, 1.85);
    var mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: colorHex || 0x4df8ff,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.98, z);
    mesh.rotation.x = -0.34;
    mesh.scale.x = facingLeft ? -1 : 1;
    this.scene.add(mesh);

    var self = this;
    this.vfxList.push({
      ttl: duration || 0.35,
      maxTtl: duration || 0.35,
      update: function (dt) {
        this.ttl -= dt;
        mat.opacity = 0.48 * clamp(this.ttl / this.maxTtl, 0, 1);
      },
      dispose: function () {
        self.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    });
  };

  EngineSession.prototype.spawnScorchDecal = function (x, z, angle, radius) {
    var THREE = this.THREE;
    var arcLen = Math.PI * 0.68;
    var rOuter = Math.max(2.4, radius || 3.8);
    var rInner = rOuter * 0.54;
    var decalY = (x >= 41 && x < 50) ? 0.06 : 0.03;

    var group = new THREE.Group();
    group.position.set(x, decalY, z);
    group.rotation.y = -angle;

    // Dark charred arc base
    var charGeo = new THREE.RingGeometry(rInner * 0.92, rOuter * 1.04, 22, 1, -arcLen * 0.5, arcLen);
    charGeo.rotateX(-Math.PI / 2);
    var charMat = new THREE.MeshBasicMaterial({
      color: 0x181008,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    group.add(new THREE.Mesh(charGeo, charMat));

    // Glowing dark-gold scorch streak overlay
    var glowGeo = new THREE.RingGeometry(rInner * 1.04, rOuter * 0.94, 22, 1, -arcLen * 0.46, arcLen * 0.92);
    glowGeo.rotateX(-Math.PI / 2);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xd99636,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.y = 0.005;
    group.add(glowMesh);

    this.scene.add(group);

    var self = this;
    this.vfxList.push({
      ttl: 6.0,
      maxTtl: 6.0,
      update: function (dt) {
        this.ttl -= dt;
        var frac = clamp(this.ttl / this.maxTtl, 0, 1);
        charMat.opacity = 0.52 * frac;
        glowMat.opacity = 0.72 * Math.pow(frac, 1.35);
      },
      dispose: function () {
        self.scene.remove(group);
        charGeo.dispose();
        glowGeo.dispose();
        charMat.dispose();
        glowMat.dispose();
      }
    });
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

  EngineSession.prototype.updateVfx = function (simDt, realDt) {
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
      this.flashLight.intensity = p.stealthTimer > 0 ? 1.1 : 2.35;
    }
    if (this.playerGlow) {
      this.playerGlow.position.set(p.x, 1.55, p.z);
      this.playerGlow.color.setHex(p.overclockTimer > 0 ? 0x4df8ff : 0x7cc8e8);
    }

    // Inspector crimson lantern light (flickers dead when EMP-stunned!)
    if (this.inspectorLantern && ins.alive) {
      this.inspectorLantern.position.set(ins.x + (ins.facingLeft ? -0.35 : 0.35), 1.65, ins.z + 0.25);
      if (ins.stunTimer > 0) {
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

    if (this.stationBulbMat) {
      if (empActive) {
        var bPulse = (Math.sin(t * 49.0) > 0.72) ? 0x4de8ff : 0x162230;
        this.stationBulbMat.color.setHex(bPulse);
      } else {
        this.stationBulbMat.color.setHex(0xbfe8ff);
      }
    }

    // Pooled nearest station flickering lights around camera (<=4 pooled lights)
    if (this.stationLightPool.length > 0 && this.stationLightDefs.length > 0) {
      var sorted = this.stationLightDefs.slice().sort(function (a, b) {
        var da = (a.x - p.x) * (a.x - p.x) + (a.z - p.z) * (a.z - p.z);
        var db = (b.x - p.x) * (b.x - p.x) + (b.z - p.z) * (b.z - p.z);
        return da - db;
      });
      for (var i = 0; i < this.stationLightPool.length; i++) {
        var pl = this.stationLightPool[i];
        var def = sorted[i];
        if (!def) {
          pl.intensity = 0;
          continue;
        }
        pl.position.set(def.x, 3.25, def.z);
        pl.color.setHex(def.color);
        pl.distance = def.distance;
        var flk = 1.0;
        if (def.flicker > 0) {
          var wave = Math.sin(t * 11.3 + def.seed) * Math.sin(t * 27.1 + def.seed * 2);
          flk = wave > 0.72 ? Math.max(0.25, 1.0 - def.flicker * 2.1) : (1.0 - def.flicker * 0.35 + wave * def.flicker * 0.45);
        }
        if (empActive && dist2D(def.x, def.z, this.empBlackoutPos.x, this.empBlackoutPos.z) <= 22.0) {
          if (this.empBlackoutTimer > 1.0) {
            var stutter = Math.sin(t * 53.0 + def.seed * 7.0);
            flk = stutter > 0.86 ? 0.28 : 0.03;
            pl.color.setHex(stutter > 0.86 ? 0x4de8ff : def.color);
          } else {
            var recover = 1.0 - this.empBlackoutTimer;
            flk *= lerp(0.12, 1.0, recover) * (Math.sin(t * 37.0 + def.seed * 3.0) > -0.25 ? 1.0 : 0.14);
          }
        }
        pl.intensity = def.intensity * flk;
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
    var trainZ = this.train ? this.train.z : -32;
    safeAudio('updateSpatialSource', 'train', TRAIN_X - p.x, trainZ - p.z, trainActive ? 1 : 0);

    safeAudio('setBulletTime', !!(this.slowMo || this.inputPaused));
  };

  EngineSession.prototype.updateDust = function (simDt) {
    if (!this.dustPoints) return;
    var attr = this.dustPoints.geometry.attributes.position;
    var arr = attr.array;
    for (var i = 0; i < arr.length; i += 3) {
      arr[i + 1] += Math.sin(this.elapsedReal * 0.8 + i) * 0.08 * simDt;
      arr[i] += 0.12 * simDt;
      if (arr[i] > 56) arr[i] = 0.5;
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

  EngineSession.prototype.spawnFloatingText = function (x, y, z, text, color, isBoldCallout) {
    if (!this.floatersLayer) return;
    var el = document.createElement('div');
    el.textContent = text;
    var fontSize = isBoldCallout ? '15px' : '12px';
    var shadow = isBoldCallout
      ? '0 0 12px rgba(255,224,125,0.85),0 2px 6px #000,0 0 18px rgba(255,196,70,0.65)'
      : '0 1px 4px #000,0 0 8px rgba(0,0,0,0.95)';
    el.style.cssText =
      'position:absolute;transform:translate(-50%,-50%);font-size:' + fontSize + ';font-weight:900;' +
      'color:' + (color || '#ffffff') + ';text-shadow:' + shadow + ';' +
      'white-space:nowrap;pointer-events:none;letter-spacing:' + (isBoldCallout ? '1.0px' : '0.4px') + ';';
    this.floatersLayer.appendChild(el);

    var ttl = isBoldCallout ? 1.55 : 1.15;
    this.floatingTexts.push({
      el: el,
      x: x + (isBoldCallout ? 0 : (Math.random() - 0.5) * 0.4),
      y: y,
      z: z,
      vy: isBoldCallout ? 1.05 : 1.35,
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
        this.vignetteEl.style.boxShadow = 'inset 0 0 90px rgba(4,6,10,0.72)';
      }
    }

    // World-space mini HP/Name tags for Squad & Inspector
    var tagIds = Object.keys(this.worldTags);
    for (var ti = 0; ti < tagIds.length; ti++) {
      var tid = tagIds[ti];
      var tag = this.worldTags[tid];
      var actor = this.getActorById(tid);
      if (!actor || !actor.alive) {
        tag.el.style.display = 'none';
        continue;
      }
      var yOff = tid === 'inspector' ? 2.85 : 2.12;
      var scr = this.projectToScreen(actor.x, yOff, actor.z);
      var visibleInFog = (tid !== 'inspector') || (dist2D(this.player.x, this.player.z, actor.x, actor.z) < 18 || this.reconRevealTimer > 0);
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

    // Speech Bubbles projected cleanly above character heads
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

    // Floating Damage / Status Numbers
    for (var fi = this.floatingTexts.length - 1; fi >= 0; fi--) {
      var ft = this.floatingTexts[fi];
      ft.ttl -= realDt;
      ft.y += ft.vy * realDt;
      if (ft.ttl <= 0) {
        if (ft.el.parentNode) ft.el.parentNode.removeChild(ft.el);
        this.floatingTexts.splice(fi, 1);
        continue;
      }
      var fScr = this.projectToScreen(ft.x, ft.y, ft.z);
      if (!fScr) {
        ft.el.style.display = 'none';
      } else {
        ft.el.style.display = 'block';
        ft.el.style.left = Math.round(fScr.x) + 'px';
        ft.el.style.top = Math.round(fScr.y) + 'px';
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
          if (ni.type === 'console') suffix = ' (' + Math.round(ni.progress) + '%)';
          else if (ni.type === 'exit') suffix = (this.overridePct >= 100 || !this.inspector.alive) ? ' [可撤离]' : ' [道岔' + this.overridePct + '%]';
          this.promptEl.textContent = '[E] ' + ni.label + suffix;
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
    var insVisible = ins.alive && (
      this.reconRevealTimer > 0 ||
      dBoss <= 11.5 ||
      (dBoss <= 16 && mapApi.hasLineOfSight(p.x, p.z, ins.x, ins.z))
    );

    var cluesTotal = 0;
    var consolesMini = [];
    for (var i = 0; i < this.interactables.length; i++) {
      var it = this.interactables[i];
      if (it.type === 'clue') cluesTotal++;
      if (it.type === 'console') {
        consolesMini.push({ x: it.x, z: it.z, done: !!it.done });
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
        ready: isRecall || (sl.cooldownLeft <= 0 && p.energy >= sl.energyCost)
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

    var squadMini = this.squad.filter(function (n) { return n.alive; }).map(function (n) {
      return { id: n.id, x: n.x, z: n.z, color: n.accentColor };
    });

    var wardsMini = this.wards.map(function (w) {
      return { x: w.x, z: w.z, r: w.radius };
    });

    var near = this.nearbyInteractable ? {
      id: this.nearbyInteractable.id,
      label: this.nearbyInteractable.label,
      type: this.nearbyInteractable.type,
      progress: Math.round(this.nearbyInteractable.progress)
    } : null;

    return {
      zoneId: pZoneId,
      zoneName: pZone.name,
      zoneCode: pZone.code,
      timeRemainingSec: Math.ceil(this.timeRemainingSec),
      trainCountdownSec: Math.ceil(this.trainCountdownSec),
      trainInStation: this.trainInStation,
      overridePct: Math.round(this.overridePct),
      cluesFoundCount: this.discoveredClueIds.length,
      cluesTotal: cluesTotal,
      discoveredClueIds: this.discoveredClueIds.slice(),
      hp: Math.round(p.hp),
      maxHp: Math.round(p.maxHp),
      energy: Math.round(p.energy),
      maxEnergy: Math.round(p.maxEnergy),
      sanity: Math.round(p.sanity),
      maxSanity: Math.round(p.maxSanity),
      soundLevel: Math.round(this.soundLevel),
      threatLevel: Math.round(this.threatLevel),
      slowMo: this.slowMo || this.inputPaused,
      inspector: {
        hp: Math.round(ins.hp),
        maxHp: Math.round(ins.maxHp),
        sealedPct: Math.round(ins.sealedPct),
        state: ins.alive ? ins.state : 'DEFEATED',
        zoneId: insZoneId,
        distToPlayer: Number(dBoss.toFixed(1))
      },
      nearbyInteractable: near,
      slots: slotsSnap,
      squad: squadSnap,
      minimap: {
        player: { x: p.x, z: p.z },
        inspector: { x: ins.x, z: ins.z, visible: insVisible },
        squad: squadMini,
        wards: wardsMini,
        consoles: consolesMini,
        exitReady: (this.overridePct >= 100 || !ins.alive)
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
    }
    this.emitHudSnapshot();
  };

  // ---------------------------------------------------------------------------
  // Leak-Free Teardown (unmount)
  // ---------------------------------------------------------------------------
  EngineSession.prototype.unmount = function () {
    this.mounted = false;

    if (this.rafId !== null) {
      global.cancelAnimationFrame(this.rafId);
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
        this.scene.remove(this.projectiles[pi].mesh);
        this.projectiles[pi].geo.dispose();
        this.projectiles[pi].mat.dispose();
      } catch (_) {}
    }
    this.projectiles = [];

    for (var wi = 0; wi < this.wards.length; wi++) {
      try {
        this.scene.remove(this.wards[wi].group);
        this.wards[wi].geos.forEach(function (g) { g.dispose(); });
        this.wards[wi].mats.forEach(function (m) { m.dispose(); });
      } catch (_) {}
    }
    this.wards = [];

    for (var di = 0; di < this.drones.length; di++) {
      try {
        this.scene.remove(this.drones[di].group);
        this.drones[di].geos.forEach(function (g) { g.dispose(); });
        this.drones[di].mats.forEach(function (m) { m.dispose(); });
      } catch (_) {}
    }
    this.drones = [];

    for (var dci = 0; dci < this.decoys.length; dci++) {
      try {
        this.scene.remove(this.decoys[dci].group);
        this.decoys[dci].geos.forEach(function (g) { g.dispose(); });
        this.decoys[dci].mats.forEach(function (m) { m.dispose(); });
      } catch (_) {}
    }
    this.decoys = [];

    for (var sri = 0; sri < this.soundRipples.length; sri++) {
      try {
        this.scene.remove(this.soundRipples[sri].mesh);
        this.soundRipples[sri].geo.dispose();
        this.soundRipples[sri].mat.dispose();
      } catch (_) {}
    }
    this.soundRipples = [];

    this.removeBlinkBeacon();
    this.clearReconBeacons();
    this.disposePostFx();

    // Silence spatial audio sources and reset bullet-time filter cleanly
    safeAudio('updateSpatialSource', 'inspector', 99, 99, 0);
    safeAudio('updateSpatialSource', 'train', 99, 99, 0);
    safeAudio('setBulletTime', false);

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
    }
  };
})(window);
