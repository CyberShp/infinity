/* ============================================================================
 * INFINITY // SUBTERRANEAN STATION ARCHITECT (scene_architect.js)
 * Classic non-module script exposing window.INFINITY.SceneArchitect
 *
 * Replaces bare tile grids, flat box walls, floating ceiling cubes, and flat
 * billboard interactables with rich architectural HD-2D subway staging:
 *   - PBR MeshStandardMaterial floors with per-tile variation, bump maps & wet puddles
 *   - Layered architectural concrete/ceramic & neon transit walls with trims & plinths
 *   - Reinforced steel cover-pillar cladding with hazard bands & zone beacons
 *   - Hanging industrial fluorescent light fixtures + overhead I-beams + volumetric light cones
 *   - Zone-specific 3D storytelling props across all 6 Station Zero zones
 *   - Composite 3D procedural Interactables (Consoles, Clues, Armored Blast Exit Gate)
 *   - Upgraded 4-car articulated Ghost Train No.0 with pantographs, mullions & twin beams
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = global.INFINITY = global.INFINITY || {};

  function hexToInt(hex, fallback) {
    if (typeof hex === 'number' && !isNaN(hex)) return hex;
    if (typeof hex === 'string') {
      var clean = hex.replace(/^#/, '');
      var n = parseInt(clean, 16);
      if (!isNaN(n)) return n;
    }
    return fallback !== undefined ? fallback : 0x6fd8ea;
  }

  function makeCanvas(w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    return { width: w, height: h, getContext: function () { return null; } };
  }

  function hash2D(x, z) {
    var n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  /* --------------------------------------------------------------------------
   * Procedural Backlit Signage & CRT Monitor Canvas Textures
   * -------------------------------------------------------------------------- */
  function createSignTexture(THREE, session, title, subtitle, accentCss, bgCss) {
    var c = makeCanvas(512, 128);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgCss || '#0a111a';
      ctx.fillRect(0, 0, 512, 128);

      // Subtle glowing frame & top color bar
      ctx.fillStyle = accentCss || '#5ce4ff';
      ctx.fillRect(0, 0, 512, 12);
      ctx.fillRect(0, 122, 512, 6);

      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 18, 496, 98);

      // Primary title
      ctx.fillStyle = '#eef8ff';
      ctx.font = 'bold 42px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 256, 58);

      // Technical sub-line
      ctx.fillStyle = accentCss || '#6fd8ea';
      ctx.font = 'bold 20px "JetBrains Mono",monospace';
      ctx.fillText(subtitle || 'STATION 00 // SECTOR', 256, 98);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createRouteMapTexture(THREE, session) {
    var c = makeCanvas(512, 256);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#09131e';
      ctx.fillRect(0, 0, 512, 256);

      // Grid lines
      ctx.strokeStyle = 'rgba(92, 210, 240, 0.14)';
      ctx.lineWidth = 1.5;
      for (var x = 24; x < 512; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 244); ctx.stroke();
      }
      for (var y = 24; y < 256; y += 32) {
        ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(500, y); ctx.stroke();
      }

      // Header bar
      ctx.fillStyle = '#12283a';
      ctx.fillRect(14, 14, 484, 38);
      ctx.fillStyle = '#6ce8ff';
      ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('零号地下线 // STATION ZERO TRANSIT MAP', 28, 40);

      // Transit lines (Cyan, Gold, Crimson Loop)
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#58e0ff';
      ctx.beginPath(); ctx.moveTo(42, 118); ctx.lineTo(240, 118); ctx.lineTo(310, 82); ctx.lineTo(466, 82); ctx.stroke();

      ctx.strokeStyle = '#f0c05a';
      ctx.beginPath(); ctx.moveTo(42, 186); ctx.lineTo(186, 186); ctx.lineTo(256, 148); ctx.lineTo(466, 148); ctx.stroke();

      ctx.strokeStyle = '#ff384e';
      ctx.beginPath(); ctx.moveTo(416, 62); ctx.lineTo(416, 224); ctx.stroke();

      // Station nodes
      var nodes = [
        [72, 118, '#58e0ff'], [168, 118, '#58e0ff'], [240, 118, '#ffffff'],
        [330, 82, '#58e0ff'], [416, 82, '#ff384e'], [416, 148, '#ff384e'],
        [102, 186, '#f0c05a'], [256, 148, '#f0c05a'], [416, 206, '#ff384e']
      ];
      for (var i = 0; i < nodes.length; i++) {
        ctx.fillStyle = '#09131e';
        ctx.beginPath(); ctx.arc(nodes[i][0], nodes[i][1], 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = nodes[i][2];
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // Warning badge bottom-left
      ctx.fillStyle = 'rgba(255, 56, 78, 0.22)';
      ctx.fillRect(28, 210, 210, 28);
      ctx.fillStyle = '#ff6b7c';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('LINE-00 // SIGNAL LOCKED', 38, 229);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createCrtBankTexture(THREE, session) {
    var c = makeCanvas(512, 192);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#071412';
      ctx.fillRect(0, 0, 512, 192);
      // 3 distinct CRT screen bezels
      for (var i = 0; i < 3; i++) {
        var bx = 12 + i * 166;
        ctx.fillStyle = '#0c2620';
        ctx.fillRect(bx, 14, 152, 164);
        ctx.strokeStyle = '#38c89e';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, 14, 152, 164);

        // Waveform / rail diagram per screen
        ctx.strokeStyle = i === 1 ? '#ff5868' : '#5cffc0';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(bx + 14, 128); ctx.lineTo(bx + 62, 128); ctx.lineTo(bx + 92, 74); ctx.lineTo(bx + 138, 74);
          ctx.moveTo(bx + 62, 128); ctx.lineTo(bx + 138, 128);
        } else if (i === 1) {
          for (var w = 0; w < 120; w += 6) {
            var yv = 96 + Math.sin(w * 0.22) * 26 * (w % 18 === 0 ? 1.4 : 0.7);
            if (w === 0) ctx.moveTo(bx + 16 + w, yv); else ctx.lineTo(bx + 16 + w, yv);
          }
        } else {
          ctx.arc(bx + 76, 98, 42, 0, Math.PI * 2);
          ctx.moveTo(bx + 76, 98); ctx.lineTo(bx + 110, 74);
        }
        ctx.stroke();

        // Status bars
        ctx.fillStyle = i === 1 ? '#ff6472' : '#5cffc0';
        ctx.fillRect(bx + 14, 28, 84, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(bx + 14, 152, 120, 6);
      }
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createPuddleTexture(THREE, session) {
    var c = makeCanvas(128, 128);
    var ctx = c.getContext('2d');
    if (ctx) {
      var g = ctx.createRadialGradient(64, 64, 6, 64, 64, 58);
      g.addColorStop(0, 'rgba(120, 185, 225, 0.32)');
      g.addColorStop(0.55, 'rgba(72, 128, 168, 0.16)');
      g.addColorStop(1, 'rgba(20, 40, 60, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(64, 64, 56, 38, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  /* --------------------------------------------------------------------------
   * Pure Non-Blocking Zone Prop Layout Spec (Testable against StationMap!)
   * Every ground-level prop sits cleanly against a perimeter wall or atop a pillar
   * so walkable lanes, doorways, spawns, and A* routes remain 100% unobstructed.
   * -------------------------------------------------------------------------- */
  function getZonePropSpecs() {
    return {
      // Concourse (x:2..19, z:2..18)
      turnstiles: [
        // Decorative ticket turnstile lane framing Concourse north entrance bay (z=2.7, clear of player 10,10)
        { x: 4.5, z: 2.85, rotY: 0 },
        { x: 6.2, z: 2.85, rotY: 0 },
        { x: 13.8, z: 2.85, rotY: 0 },
        { x: 15.5, z: 2.85, rotY: 0 },
        { x: 17.2, z: 2.85, rotY: 0 }
      ],
      benches: [
        // Concourse west & south wall edges
        { x: 2.58, z: 6.5, rotY: Math.PI * 0.5 },
        { x: 2.58, z: 14.5, rotY: Math.PI * 0.5 },
        { x: 15.5, z: 18.42, rotY: 0 },
        // Corridor wall edges (x:22..40, z:13..24)
        { x: 37.2, z: 13.48, rotY: 0 },
        { x: 24.5, z: 24.42, rotY: 0 },
        { x: 36.2, z: 24.42, rotY: 0 },
        // Platform 0 west wall benches (x=42.55, well clear of doorways z=17..20 & z=29..32)
        { x: 42.58, z: 8.5, rotY: Math.PI * 0.5 },
        { x: 42.58, z: 14.0, rotY: Math.PI * 0.5 },
        { x: 42.58, z: 24.0, rotY: Math.PI * 0.5 }
      ],
      wallSigns: [
        // Concourse north illuminated route-map kiosk (mounted flush on z=2.04 wall face)
        { kind: 'route_map', x: 10.0, y: 1.75, z: 2.06, rotY: 0, w: 3.6, h: 1.8 },
        // Concourse east exit header above Corridor doorway
        { kind: 'sign', title: 'B2 换乘长廊 →', sub: 'CORRIDOR // Z-02', accent: '#f0c46c', x: 19.92, y: 2.65, z: 16.0, rotY: -Math.PI * 0.5, w: 3.4, h: 0.72 },
        // Corridor overhead hanging directional transit signs (high overhead y=2.92 — zero collision!)
        { kind: 'hanging_sign', title: '← B1 检票大厅   |   0号站台 →', sub: 'DISPATCH ↑  //  TUNNEL ↓', accent: '#6fd8ea', x: 29.8, y: 2.88, z: 18.5, rotY: 0, w: 4.4, h: 0.72 },
        { kind: 'hanging_sign', title: '零号站台 · 禁止越过黄线', sub: 'PLATFORM 00 // DANGER', accent: '#ff5264', x: 45.8, y: 2.95, z: 14.5, rotY: 0, w: 4.2, h: 0.74 },
        { kind: 'hanging_sign', title: '00:00  停摆列车 // 延时未知', sub: 'NEXT TRAIN: LINE-00', accent: '#ffaa44', x: 45.8, y: 2.95, z: 24.5, rotY: 0, w: 4.2, h: 0.74 }
      ],
      crtBanks: [
        // Dispatch north wall CRT monitor wall (z=2.08, x=26..34)
        { x: 29.8, y: 1.78, z: 2.12, rotY: 0, w: 5.2, h: 1.65 }
      ],
      serverRacks: [
        // Dispatch NW/NE corners (strictly tucked into wall corners)
        { x: 22.55, z: 2.58, rotY: 0 },
        { x: 23.65, z: 2.58, rotY: 0 },
        { x: 37.95, z: 2.58, rotY: 0 },
        { x: 37.95, z: 3.78, rotY: -Math.PI * 0.5 }
      ],
      transformers: [
        // Mounted directly ON TOP of Substation's two existing non-walkable transformer pillar blocks!
        { x: 6.0, z: 25.5 },
        { x: 17.0, z: 25.5 }
      ],
      cratesAndBarricades: [
        // Tunnel wall-tucked maintenance crates (x:22..40, z:26..35)
        { x: 22.65, z: 26.65, rotY: 0.15 },
        { x: 23.55, z: 26.58, rotY: -0.2 },
        { x: 39.8, z: 26.65, rotY: 0.35 },
        { x: 22.65, z: 35.2, rotY: 0.1 },
        // Substation south-west breaker corner
        { x: 2.65, z: 35.1, rotY: 0.05 }
      ],
      // 6 Zone-Signature 3D Landmarks (1 per zone, >=2m from spawn, >=1.35m from interactables)
      landmarks: [
        { zone: 'concourse',  kind: 'clock_totem',   label: '停摆倒计时时钟塔', x: 18.5, z: 4.5,  color: '#68c8de' },
        { zone: 'corridor',   kind: 'transit_arch',  label: '换乘霓虹门拱',     x: 23.0, z: 14.2, color: '#d6b274' },
        { zone: 'dispatch',   kind: 'radar_tower',   label: '调度信号塔',       x: 23.5, z: 8.2,  color: '#52c4a2' },
        { zone: 'substation', kind: 'tesla_coil',    label: '高压共振线圈',     x: 16.5, z: 23.5, color: '#6e9eff' },
        { zone: 'tunnel',     kind: 'vent_turbine',  label: '废弃通风涡轮',     x: 24.0, z: 34.2, color: '#a884e0' },
        { zone: 'platform0',  kind: 'signal_mast',   label: '0号站台铁路信号灯柱', x: 43.2, z: 32.5, color: '#e69c3c' }
      ],
      puddles: [
        { x: 8.6, z: 12.2, sx: 2.4, sz: 1.7, rot: 0.3 },
        { x: 13.8, z: 9.4, sx: 1.9, sz: 1.4, rot: -0.4 },
        { x: 28.4, z: 18.8, sx: 2.6, sz: 1.6, rot: 0.15 },
        { x: 35.0, z: 19.2, sx: 2.1, sz: 1.5, rot: -0.25 },
        { x: 11.4, z: 29.8, sx: 2.8, sz: 2.0, rot: 0.5 },
        { x: 30.2, z: 30.4, sx: 2.5, sz: 1.8, rot: -0.1 },
        { x: 45.4, z: 19.6, sx: 2.7, sz: 1.9, rot: 0.2 }
      ]
    };
  }

  /* --------------------------------------------------------------------------
   * 1. Build Station Geometry, PBR Surfaces, Pillar Cladding & Architectural Props
   * -------------------------------------------------------------------------- */
  function buildStation(session, opts) {
    var THREE = session.THREE;
    var mapApi = session.mapApi;
    var cfg = opts || {};
    var WALL_HEIGHT = cfg.WALL_HEIGHT || 3.2;
    var FLOOR_Y = cfg.FLOOR_Y || 0.0;
    var PLATFORM_Y = cfg.PLATFORM_Y || 0.04;
    var HAZARD_Y = cfg.HAZARD_Y || 0.05;
    var RAIL_Y = cfg.RAIL_Y || -0.58;
    var TRAIN_X = cfg.TRAIN_X || 51.5;

    var gridW = mapApi.GRID_W || 56;
    var gridH = mapApi.GRID_H || 38;
    var grid = (typeof mapApi.getGrid === 'function' ? mapApi.getGrid() : null) || [];
    var walls = (typeof mapApi.getWalls === 'function' ? mapApi.getWalls() : null) || [];
    var dummy = session._dummy;

    function readCell(gx, gz) {
      if (gx < 0 || gz < 0 || gx >= gridW || gz >= gridH) return 1;
      if (Array.isArray(grid[gz])) return grid[gz][gx];
      return grid[gz * gridW + gx];
    }

    var floorBuckets = { 0: [], 2: [], 3: [], 4: [] };
    var wallTileMap = Object.create(null);

    for (var gz = 0; gz < gridH; gz++) {
      for (var gx = 0; gx < gridW; gx++) {
        var cell = readCell(gx, gz);
        if (cell === 1) {
          if (walls.length === 0) {
            wallTileMap[gx + ',' + gz] = { gx: gx, gz: gz, neon: false, h: WALL_HEIGHT, isPillar: false };
          }
        } else {
          var bKey = (cell === 2 || cell === 3 || cell === 4) ? cell : 0;
          floorBuckets[bKey].push({ gx: gx, gz: gz });
        }
      }
    }

    // Parse merged walls from StationMap
    if (walls.length > 0) {
      var hasHalf = false;
      var hasZeroSpan = false;
      for (var wi = 0; wi < walls.length; wi++) {
        var wl = walls[wi];
        if ((wl.x === 0 && (wl.w || 1) > 1) || (wl.z === 0 && (wl.d || 1) > 1)) hasZeroSpan = true;
        if (Math.abs((wl.x % 1) - 0.5) < 0.02 || Math.abs((wl.z % 1) - 0.5) < 0.02) hasHalf = true;
      }
      var wallsUseCenter = hasHalf && !hasZeroSpan;

      for (var wj = 0; wj < walls.length; wj++) {
        var wObj = walls[wj];
        var ww = Math.max(1, Math.round(wObj.w || 1));
        var wd = Math.max(1, Math.round(wObj.d || 1));
        var startX = wallsUseCenter ? Math.round(wObj.x - ww * 0.5) : Math.round(wObj.x);
        var startZ = wallsUseCenter ? Math.round(wObj.z - wd * 0.5) : Math.round(wObj.z);
        var wh = Number(wObj.h) || WALL_HEIGHT;
        var isPillar = wh < WALL_HEIGHT - 0.15;
        for (var dz = 0; dz < wd; dz++) {
          for (var dx = 0; dx < ww; dx++) {
            var tx = startX + dx;
            var tz = startZ + dz;
            if (tx >= 0 && tx < gridW && tz >= 0 && tz < gridH) {
              var k = tx + ',' + tz;
              if (!wallTileMap[k]) {
                wallTileMap[k] = { gx: tx, gz: tz, neon: !!wObj.neon, h: wh, isPillar: isPillar };
              } else {
                if (wObj.neon) wallTileMap[k].neon = true;
                if (wObj.h) wallTileMap[k].h = wh;
                if (isPillar) wallTileMap[k].isPillar = true;
              }
            }
          }
        }
      }
    }

    var spritesApi = INFINITY.PixelSprites || null;
    function getBump(name) {
      if (spritesApi && typeof spritesApi.getTileBumpTexture === 'function') {
        return spritesApi.getTileBumpTexture(name);
      }
      return null;
    }

    function getNormal(name) {
      if (spritesApi && typeof spritesApi.getTileNormalTexture === 'function') {
        return spritesApi.getTileNormalTexture(name);
      }
      return null;
    }

    function getRoughness(name) {
      if (spritesApi && typeof spritesApi.getTileRoughnessTexture === 'function') {
        return spritesApi.getTileRoughnessTexture(name);
      }
      return null;
    }

    // --- 1A. PBR INSTANCED FLOORS WITH NORMAL + ROUGHNESS MAPS & PER-TILE VARIATION ---
    var tileGeo = session.trackGeo(new THREE.PlaneGeometry(1, 1));
    tileGeo.rotateX(-Math.PI / 2);

    var floorSpecs = [
      { key: 0, tex: 'floor_slate',    y: FLOOR_Y,    col: '#262e3c', rough: 0.78, metal: 0.14, nScale: 0.95, varyRot: true },
      { key: 2, tex: 'floor_platform', y: PLATFORM_Y, col: '#2d3440', rough: 0.82, metal: 0.12, nScale: 1.05, varyRot: false },
      { key: 3, tex: 'floor_hazard',   y: HAZARD_Y,   col: '#d6a434', rough: 0.72, metal: 0.20, nScale: 1.15, varyRot: false },
      { key: 4, tex: 'floor_rail',     y: RAIL_Y,     col: '#151820', rough: 0.94, metal: 0.10, nScale: 1.35, varyRot: true }
    ];

    var instColor = new THREE.Color();
    for (var fi = 0; fi < floorSpecs.length; fi++) {
      var spec = floorSpecs[fi];
      var list = floorBuckets[spec.key];
      if (!list || list.length === 0) continue;

      var fTex = session.getTileTex(spec.tex, spec.col, '#10141c');
      var fNorm = getNormal(spec.tex);
      var fRough = getRoughness(spec.tex);
      var fMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: fTex,
        normalMap: fNorm || null,
        normalScale: new THREE.Vector2(spec.nScale, spec.nScale),
        roughnessMap: fRough || null,
        roughness: spec.rough,
        metalness: spec.metal
      }));

      var fMesh = new THREE.InstancedMesh(tileGeo, fMat, list.length);
      for (var li = 0; li < list.length; li++) {
        var gx2 = list[li].gx;
        var gz2 = list[li].gz;
        var hVal = hash2D(gx2, gz2);
        dummy.position.set(gx2 + 0.5, spec.y, gz2 + 0.5);
        dummy.rotation.set(0, spec.varyRot ? Math.floor(hVal * 4) * (Math.PI * 0.5) : 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        fMesh.setMatrixAt(li, dummy.matrix);

        // Subtle organic tile shading so adjacent floor slabs never look mechanically identical
        if (typeof fMesh.setColorAt === 'function') {
          var shade = spec.key === 3 ? (0.94 + hVal * 0.12) : (0.86 + hVal * 0.24);
          var coolShift = (hVal > 0.65 && spec.key === 0) ? 1.05 : 1.0;
          instColor.setRGB(shade, shade * 1.01, shade * coolShift);
          fMesh.setColorAt(li, instColor);
        }
      }
      fMesh.instanceMatrix.needsUpdate = true;
      if (fMesh.instanceColor) fMesh.instanceColor.needsUpdate = true;
      session.scene.add(fMesh);
    }

    // Scattered subtle damp floor sheen puddles (calibrated roughness prevents white specular blowout!)
    var propSpecs = getZonePropSpecs();
    var puddleTex = createPuddleTexture(THREE, session);
    var puddleGeo = session.trackGeo(new THREE.PlaneGeometry(1, 1));
    puddleGeo.rotateX(-Math.PI / 2);
    var puddleMat = session.trackMat(new THREE.MeshStandardMaterial({
      map: puddleTex,
      normalMap: getNormal('floor_slate') || null,
      normalScale: new THREE.Vector2(0.28, 0.28),
      color: 0x26445c,
      roughness: 0.36,
      metalness: 0.22,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    }));
    for (var pi = 0; pi < propSpecs.puddles.length; pi++) {
      var pd = propSpecs.puddles[pi];
      var pm = new THREE.Mesh(puddleGeo, puddleMat);
      pm.position.set(pd.x, FLOOR_Y + 0.025, pd.z);
      pm.rotation.y = pd.rot;
      pm.scale.set(pd.sx, 1, pd.sz);
      session.scene.add(pm);
    }

    // --- 1B. RECESSED RAIL TRENCH, STEEL I-BEAM TRACKS, THIRD RAIL & TUNNEL PORTALS ---
    if (floorBuckets[4].length > 0) {
      var minRailX = 999, maxRailX = 0, minRailZ = 999, maxRailZ = 0;
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
      var trackX = Math.abs(railCenterX - TRAIN_X) < 3 ? TRAIN_X : railCenterX;

      // Platform vertical drop curb with metallic edge nosing
      var curbGeo = session.trackGeo(new THREE.BoxGeometry(0.22, 0.70, railSpanZ));
      var curbMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x262d38, roughness: 0.75, metalness: 0.2 }));
      var curbMesh = new THREE.Mesh(curbGeo, curbMat);
      curbMesh.position.set(minRailX - 0.06, -0.28, railCenterZ);
      session.scene.add(curbMesh);

      var noseGeo = session.trackGeo(new THREE.BoxGeometry(0.14, 0.06, railSpanZ));
      var noseMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xd9a83c, roughness: 0.42, metalness: 0.45 }));
      var noseMesh = new THREE.Mesh(noseGeo, noseMat);
      noseMesh.position.set(minRailX - 0.03, PLATFORM_Y + 0.02, railCenterZ);
      session.scene.add(noseMesh);

      // Gleaming metallic steel rails
      var railGeo = session.trackGeo(new THREE.BoxGeometry(0.12, 0.14, railSpanZ + 4));
      var railMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x8692a6, roughness: 0.28, metalness: 0.85 }));
      var leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(trackX - 0.74, RAIL_Y + 0.08, railCenterZ);
      var rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(trackX + 0.74, RAIL_Y + 0.08, railCenterZ);
      session.scene.add(leftRail, rightRail);

      // Electrified 3rd-rail guard with faint crimson-amber hazard strip
      var thirdRailGeo = session.trackGeo(new THREE.BoxGeometry(0.10, 0.18, railSpanZ + 2));
      var thirdRailMat = session.trackMat(new THREE.MeshStandardMaterial({
        color: 0x5c3630,
        emissive: 0x6e1820,
        emissiveIntensity: 0.45,
        roughness: 0.45,
        metalness: 0.55
      }));
      var thirdRail = new THREE.Mesh(thirdRailGeo, thirdRailMat);
      thirdRail.position.set(trackX + 1.28, RAIL_Y + 0.12, railCenterZ);
      session.scene.add(thirdRail);

      // Concrete/timber rail sleepers
      var tieCount = Math.floor(railSpanZ * 1.45);
      var tieGeo = session.trackGeo(new THREE.BoxGeometry(2.15, 0.08, 0.24));
      var tieMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.88, metalness: 0.08 }));
      var tieMesh = new THREE.InstancedMesh(tieGeo, tieMat, tieCount);
      for (var ti = 0; ti < tieCount; ti++) {
        dummy.position.set(trackX, RAIL_Y + 0.03, minRailZ + (ti / 1.45) + 0.35);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tieMesh.setMatrixAt(ti, dummy.matrix);
      }
      tieMesh.instanceMatrix.needsUpdate = true;
      session.scene.add(tieMesh);

      // Dark arched subway tunnel portals framing North & South ends of track trench
      var archMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1a202b, roughness: 0.72, metalness: 0.35 }));
      var portalVoidMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x030407 }));
      var portalEnds = [minRailZ - 0.1, maxRailZ + 1.1];
      for (var pe = 0; pe < portalEnds.length; pe++) {
        var pz = portalEnds[pe];
        var pGroup = new THREE.Group();
        pGroup.position.set(trackX, RAIL_Y, pz);
        var pillarL = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.45, 3.6, 0.7)), archMat);
        pillarL.position.set(-1.75, 1.8, 0);
        var pillarR = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.45, 3.6, 0.7)), archMat);
        pillarR.position.set(1.75, 1.8, 0);
        var lintel = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(4.0, 0.65, 0.78)), archMat);
        lintel.position.set(0, 3.55, 0);
        var darkBack = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(3.2, 3.3)), portalVoidMat);
        darkBack.position.set(0, 1.7, pe === 0 ? -0.36 : 0.36);
        if (pe === 1) darkBack.rotation.y = Math.PI;
        pGroup.add(pillarL, pillarR, lintel, darkBack);
        session.scene.add(pGroup);
      }

      // Platform 0 Overhead Steel Canopy Ribs (y = 3.15, arching over platform & trench!)
      var ribMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x252d3a, roughness: 0.48, metalness: 0.62 }));
      var ribGeo = session.trackGeo(new THREE.BoxGeometry(11.6, 0.22, 0.26));
      for (var rbz = 6; rbz <= 34; rbz += 5.5) {
        var rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.set(47.6, 3.22, rbz);
        session.scene.add(rib);
      }
    }

    // --- 1C. PBR LAYERED WALLS, ARCHITECTURAL COPING & REINFORCED PILLAR CLADDING ---
    var concreteWalls = [];
    var neonWalls = [];
    var pillars = [];
    var wallKeys = Object.keys(wallTileMap);
    for (var wk = 0; wk < wallKeys.length; wk++) {
      var wt = wallTileMap[wallKeys[wk]];
      if (wt.isPillar) pillars.push(wt);
      else if (wt.neon) neonWalls.push(wt);
      else concreteWalls.push(wt);
    }

    var wallGeo = session.trackGeo(new THREE.BoxGeometry(1, WALL_HEIGHT, 1));
    var capGeo = session.trackGeo(new THREE.BoxGeometry(1.04, 0.12, 1.04));
    var capMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x131924, roughness: 0.55, metalness: 0.45 }));

    if (concreteWalls.length > 0) {
      var cTex = session.getTileTex('wall_concrete', '#2b3240', '#161b24');
      var cMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: cTex,
        normalMap: getNormal('wall_concrete') || null,
        normalScale: new THREE.Vector2(1.15, 1.15),
        roughnessMap: getRoughness('wall_concrete') || null,
        roughness: 0.84,
        metalness: 0.16
      }));
      var cMesh = new THREE.InstancedMesh(wallGeo, cMat, concreteWalls.length);
      var cCap = new THREE.InstancedMesh(capGeo, capMat, concreteWalls.length);
      for (var ci = 0; ci < concreteWalls.length; ci++) {
        var cw = concreteWalls[ci];
        var ch = cw.h || WALL_HEIGHT;
        dummy.position.set(cw.gx + 0.5, ch * 0.5, cw.gz + 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, ch / WALL_HEIGHT, 1);
        dummy.updateMatrix();
        cMesh.setMatrixAt(ci, dummy.matrix);

        dummy.position.set(cw.gx + 0.5, ch + 0.05, cw.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cCap.setMatrixAt(ci, dummy.matrix);

        if (typeof cMesh.setColorAt === 'function') {
          var whv = 0.88 + hash2D(cw.gx, cw.gz) * 0.18;
          instColor.setRGB(whv, whv, whv * 1.02);
          cMesh.setColorAt(ci, instColor);
        }
      }
      cMesh.instanceMatrix.needsUpdate = true;
      cCap.instanceMatrix.needsUpdate = true;
      if (cMesh.instanceColor) cMesh.instanceColor.needsUpdate = true;
      session.scene.add(cMesh, cCap);
    }

    if (neonWalls.length > 0) {
      var nTex = session.getTileTex('wall_neon', '#233042', '#52d6ea');
      var nMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: nTex,
        normalMap: getNormal('wall_neon') || null,
        normalScale: new THREE.Vector2(1.05, 1.05),
        roughnessMap: getRoughness('wall_neon') || null,
        roughness: 0.62,
        metalness: 0.34,
        emissive: 0x164458,
        emissiveIntensity: 0.52
      }));
      var nMesh = new THREE.InstancedMesh(wallGeo, nMat, neonWalls.length);
      var nCap = new THREE.InstancedMesh(capGeo, capMat, neonWalls.length);

      var trimGeo = session.trackGeo(new THREE.BoxGeometry(1.04, 0.09, 1.04));
      var trimMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x62e8ff }));
      var trimMesh = new THREE.InstancedMesh(trimGeo, trimMat, neonWalls.length);

      for (var ni = 0; ni < neonWalls.length; ni++) {
        var nw = neonWalls[ni];
        var nh = nw.h || WALL_HEIGHT;
        dummy.position.set(nw.gx + 0.5, nh * 0.5, nw.gz + 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, nh / WALL_HEIGHT, 1);
        dummy.updateMatrix();
        nMesh.setMatrixAt(ni, dummy.matrix);

        dummy.position.set(nw.gx + 0.5, nh + 0.05, nw.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nCap.setMatrixAt(ni, dummy.matrix);

        dummy.position.set(nw.gx + 0.5, nh - 0.16, nw.gz + 0.5);
        dummy.updateMatrix();
        trimMesh.setMatrixAt(ni, dummy.matrix);
      }
      nMesh.instanceMatrix.needsUpdate = true;
      nCap.instanceMatrix.needsUpdate = true;
      trimMesh.instanceMatrix.needsUpdate = true;
      session.scene.add(nMesh, nCap, trimMesh);
    }

    // Reinforced architectural cladding for interior cover pillars!
    if (pillars.length > 0) {
      var pilTex = session.getTileTex('wall_concrete', '#2e3848', '#151b24');
      var pilMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: pilTex,
        normalMap: getNormal('wall_concrete') || null,
        normalScale: new THREE.Vector2(1.15, 1.15),
        roughnessMap: getRoughness('wall_concrete') || null,
        roughness: 0.68,
        metalness: 0.32
      }));
      var plinthGeo = session.trackGeo(new THREE.BoxGeometry(1.12, 0.38, 1.12));
      var plinthMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2532, roughness: 0.42, metalness: 0.66 }));
      var bandGeo = session.trackGeo(new THREE.BoxGeometry(1.06, 0.22, 1.06));
      var bandMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: session.getTileTex('floor_hazard', '#d6a434', '#161a20'),
        normalMap: getNormal('floor_hazard') || null,
        normalScale: new THREE.Vector2(0.95, 0.95),
        roughness: 0.56,
        metalness: 0.22
      }));
      var lightRingGeo = session.trackGeo(new THREE.BoxGeometry(1.07, 0.07, 1.07));
      var lightRingMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x62e2ff }));

      var pMesh = new THREE.InstancedMesh(wallGeo, pilMat, pillars.length);
      var pPlinth = new THREE.InstancedMesh(plinthGeo, plinthMat, pillars.length);
      var pBand = new THREE.InstancedMesh(bandGeo, bandMat, pillars.length);
      var pRing = new THREE.InstancedMesh(lightRingGeo, lightRingMat, pillars.length);
      var pCap = new THREE.InstancedMesh(capGeo, capMat, pillars.length);

      for (var pli = 0; pli < pillars.length; pli++) {
        var pw = pillars[pli];
        var ph = pw.h || 2.6;
        dummy.rotation.set(0, 0, 0);

        dummy.position.set(pw.gx + 0.5, ph * 0.5, pw.gz + 0.5);
        dummy.scale.set(1, ph / WALL_HEIGHT, 1);
        dummy.updateMatrix();
        pMesh.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, 0.19, pw.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pPlinth.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, 0.62, pw.gz + 0.5);
        dummy.updateMatrix();
        pBand.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, ph - 0.18, pw.gz + 0.5);
        dummy.updateMatrix();
        pRing.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, ph + 0.05, pw.gz + 0.5);
        dummy.updateMatrix();
        pCap.setMatrixAt(pli, dummy.matrix);
      }
      pMesh.instanceMatrix.needsUpdate = true;
      pPlinth.instanceMatrix.needsUpdate = true;
      pBand.instanceMatrix.needsUpdate = true;
      pRing.instanceMatrix.needsUpdate = true;
      pCap.instanceMatrix.needsUpdate = true;
      session.scene.add(pMesh, pPlinth, pBand, pRing, pCap);
    }

    // --- 1D. PAINTED SCENE-A B1 CONCOURSE OVERLAY (Hand-inked Floor Plate, Wall Elevations & AO) ---
    buildConcoursePaintedStage(session, {
      WALL_HEIGHT: WALL_HEIGHT,
      FLOOR_Y: FLOOR_Y
    });

    // --- 1E. ZONE-SPECIFIC 3D / PAINTED 2.5D ARCHITECTURAL STORYTELLING PROPS ---
    buildZoneProps(session, propSpecs);

    // --- 1F. 6-LAYER AMBIENT LIVING WORLD DYNAMICS (Drips, Dust Shafts, Steam, CRT Glitch, Train Sweep) ---
    buildConcourseAmbientDynamics(session);
  }

  function loadSceneTextureSafe(THREE, session, assetKey, isColor, repeatX, repeatY) {
    if (typeof Image !== 'function' || !INFINITY.ASSETS || typeof INFINITY.ASSETS.getSceneAssetUrl !== 'function') {
      return null;
    }
    var url = INFINITY.ASSETS.getSceneAssetUrl(assetKey);
    if (!url || typeof THREE.TextureLoader !== 'function') return null;
    try {
      var loader = new THREE.TextureLoader();
      var tex = loader.load(url);
      session.trackTex(tex);
      if (isColor && THREE.sRGBEncoding !== undefined) {
        tex.encoding = THREE.sRGBEncoding;
      }
      if (repeatX && repeatY) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
      } else {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
      }
      tex.anisotropy = 8;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    } catch (_) {
      return null;
    }
  }

  function buildConcoursePaintedStage(session, cfg) {
    var THREE = session.THREE;
    var floorTex = loadSceneTextureSafe(THREE, session, 'concourse_floor', true, 0, 0);
    if (!floorTex) return;

    var floorNorm = loadSceneTextureSafe(THREE, session, 'concourse_floor_normal', false, 0, 0);
    var floorRough = loadSceneTextureSafe(THREE, session, 'concourse_floor_roughness', false, 0, 0);
    var wallTex = loadSceneTextureSafe(THREE, session, 'concourse_wall', true, 1, 1);
    var wallNorm = loadSceneTextureSafe(THREE, session, 'concourse_wall_normal', false, 1, 1);

    var WALL_H = cfg.WALL_HEIGHT || 2.6;
    var FLOOR_Y = cfg.FLOOR_Y || 0.0;

    // 1. Hand-inked full-room floor plate spanning B1 Concourse (x: 2..20, z: 2..19 -> 18m x 17m)
    var plateGeo = session.trackGeo(new THREE.PlaneGeometry(18.02, 17.02));
    plateGeo.rotateX(-Math.PI / 2);
    var plateMat = session.trackMat(new THREE.MeshStandardMaterial({
      map: floorTex,
      normalMap: floorNorm || null,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughnessMap: floorRough || null,
      roughness: 0.88,
      metalness: 0.16
    }));
    var plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(11.0, FLOOR_Y + 0.012, 10.5);
    session.scene.add(plateMesh);

    // 2. Heavy Mignola perimeter ink-shadow skirt & pillar base AO rings inside B1 Concourse
    var aoCanvas = makeCanvas(128, 128);
    var aoCtx = aoCanvas.getContext('2d');
    if (aoCtx) {
      var ag = aoCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
      ag.addColorStop(0, 'rgba(3, 5, 9, 0.92)');
      ag.addColorStop(0.58, 'rgba(4, 7, 13, 0.56)');
      ag.addColorStop(1, 'rgba(4, 7, 13, 0.0)');
      aoCtx.fillStyle = ag;
      aoCtx.fillRect(0, 0, 128, 128);
    }
    var aoTex = session.trackTex(new THREE.CanvasTexture(aoCanvas));
    var aoGeo = session.trackGeo(new THREE.PlaneGeometry(1, 1));
    aoGeo.rotateX(-Math.PI / 2);
    var aoMat = session.trackMat(new THREE.MeshBasicMaterial({
      map: aoTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    }));
    var pillarCoords = [[6.5, 6.5], [14.5, 6.5]];
    for (var pi = 0; pi < pillarCoords.length; pi++) {
      var pAo = new THREE.Mesh(aoGeo, aoMat);
      pAo.position.set(pillarCoords[pi][0], FLOOR_Y + 0.022, pillarCoords[pi][1]);
      pAo.scale.set(2.85, 1, 2.85);
      session.scene.add(pAo);
    }

    // 3. Hand-inked subway wall elevations facing into B1 Concourse (respecting doorways!)
    if (wallTex) {
      var makeWallStrip = function (w, h, px, py, pz, rotY, repX) {
        var stripTex = wallTex.clone();
        stripTex.needsUpdate = true;
        stripTex.wrapS = THREE.RepeatWrapping;
        stripTex.wrapT = THREE.ClampToEdgeWrapping;
        stripTex.repeat.set(Math.max(1, repX || (w / 5.4)), 1);
        session.trackTex(stripTex);

        var stripNorm = null;
        if (wallNorm) {
          stripNorm = wallNorm.clone();
          stripNorm.needsUpdate = true;
          stripNorm.wrapS = THREE.RepeatWrapping;
          stripNorm.wrapT = THREE.ClampToEdgeWrapping;
          stripNorm.repeat.set(Math.max(1, repX || (w / 5.4)), 1);
          session.trackTex(stripNorm);
        }

        var wMat = session.trackMat(new THREE.MeshStandardMaterial({
          map: stripTex,
          normalMap: stripNorm,
          normalScale: new THREE.Vector2(1.35, 1.35),
          roughness: 0.86,
          metalness: 0.14
        }));
        var wMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(w, h)), wMat);
        wMesh.position.set(px, py, pz);
        wMesh.rotation.y = rotY;
        session.scene.add(wMesh);
      };

      // North wall (z = 2.02, spans x = 2..20 -> 18m)
      makeWallStrip(18.0, WALL_H, 11.0, WALL_H * 0.5, 2.025, 0, 3.2);
      // West wall (x = 2.02, spans z = 2..19 -> 17m)
      makeWallStrip(17.0, WALL_H, 2.025, WALL_H * 0.5, 10.5, Math.PI * 0.5, 3.0);
      // East wall north segment (x = 19.97, z = 2..14 -> 12m, doorway is z=14..18)
      makeWallStrip(12.0, WALL_H, 19.975, WALL_H * 0.5, 8.0, -Math.PI * 0.5, 2.2);
      // East wall south segment (x = 19.97, z = 18..19 -> 1m)
      makeWallStrip(1.0, WALL_H, 19.975, WALL_H * 0.5, 18.5, -Math.PI * 0.5, 0.35);
      // South wall west segment (z = 18.97, x = 2..8 -> 6m, doorway is x=8..12)
      makeWallStrip(6.0, WALL_H, 5.0, WALL_H * 0.5, 18.975, Math.PI, 1.15);
      // South wall east segment (z = 18.97, x = 12..20 -> 8m)
      makeWallStrip(8.0, WALL_H, 16.0, WALL_H * 0.5, 18.975, Math.PI, 1.5);
    }

    // Store shared painted prop shadow geometry/material for Scene-A 30-deg sprite props
    session._sceneAAoGeo = aoGeo;
    session._sceneAAoMat = aoMat;
    session._sceneAEnabled = true;
  }

  function createPaintedPropBillboard(THREE, session, assetKey, x, z, width, height, opts) {
    var tex = loadSceneTextureSafe(THREE, session, assetKey, true, 0, 0);
    if (!tex) return null;
    var o = opts || {};
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // Grounded contact shadow ellipse
    if (session._sceneAAoGeo && session._sceneAAoMat) {
      var sh = new THREE.Mesh(session._sceneAAoGeo, session._sceneAAoMat);
      sh.position.set(0, 0.028, 0.06);
      sh.scale.set(width * (o.shadowScaleX || 1.12), 1, width * (o.shadowScaleZ || 0.72));
      group.add(sh);
    }

    var mat = session.trackMat(new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.14,
      roughness: 0.82,
      metalness: 0.16,
      side: THREE.DoubleSide
    }));
    var mesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(width, height)), mat);
    mesh.position.set(0, height * 0.48 + (o.yOffset || 0.02), 0);
    mesh.rotation.x = -(o.tiltRad !== undefined ? o.tiltRad : 0.34);
    if (o.flipX) mesh.scale.x = -1;
    group.add(mesh);

    if (o.emissiveColor) {
      var led = new THREE.Mesh(
        session.trackGeo(new THREE.SphereGeometry(0.055, 8, 8)),
        session.trackMat(new THREE.MeshBasicMaterial({ color: o.emissiveColor }))
      );
      led.position.set(o.ledX || 0, o.ledY || (height * 0.72), o.ledZ || 0.14);
      group.add(led);
      group.userData.ledMat = led.material;
    }

    session.scene.add(group);
    return group;
  }

  function buildConcourseAmbientDynamics(session) {
    var THREE = session.THREE;
    if (!THREE || !session.scene) return;

    var dyn = {
      drips: [],
      steams: [],
      dustPoints: null,
      dustBaseY: null,
      trainSweepMesh: null,
      trainSweepMat: null,
      trainSweepTimer: 7.5,
      trainSweepActive: 0,
      ledGroups: session._sceneALedGroups || []
    };

    // 1. Ceiling water drips falling onto B1 concourse puddles (triggers hard-edge water ripples on impact)
    var dripSpots = [
      { x: 8.6, z: 12.2, nextAt: 1.4 },
      { x: 13.8, z: 9.4, nextAt: 3.1 },
      { x: 5.8, z: 15.2, nextAt: 4.8 }
    ];
    var dripGeo = session.trackGeo(new THREE.BoxGeometry(0.035, 0.24, 0.035));
    var dripMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xaef4ff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    }));
    for (var di = 0; di < dripSpots.length; di++) {
      var dm = new THREE.Mesh(dripGeo, dripMat);
      dm.visible = false;
      session.scene.add(dm);
      dyn.drips.push({
        x: dripSpots[di].x,
        z: dripSpots[di].z,
        y: 3.1,
        vy: 0,
        active: false,
        cooldown: dripSpots[di].nextAt,
        mesh: dm
      });
    }

    // 2. Vent steam wisps rising near NW and SE walls (stylized cel smoke cards)
    var steamCanvas = makeCanvas(64, 64);
    var sctx = steamCanvas.getContext('2d');
    if (sctx) {
      sctx.clearRect(0, 0, 64, 64);
      sctx.fillStyle = 'rgba(130, 165, 188, 0.34)';
      sctx.strokeStyle = 'rgba(6, 10, 16, 0.65)';
      sctx.lineWidth = 3;
      sctx.beginPath();
      sctx.arc(32, 34, 18, 0, Math.PI * 2);
      sctx.arc(22, 36, 12, 0, Math.PI * 2);
      sctx.arc(43, 32, 13, 0, Math.PI * 2);
      sctx.fill();
      sctx.stroke();
    }
    var steamTex = session.trackTex(new THREE.CanvasTexture(steamCanvas));
    var steamGeo = session.trackGeo(new THREE.PlaneGeometry(1.15, 1.15));
    var ventOrigins = [
      { x: 2.55, z: 9.6 },
      { x: 19.35, z: 11.2 }
    ];
    for (var vi = 0; vi < ventOrigins.length; vi++) {
      for (var k = 0; k < 3; k++) {
        var smat = session.trackMat(new THREE.MeshBasicMaterial({
          map: steamTex,
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          side: THREE.DoubleSide
        }));
        var sm = new THREE.Mesh(steamGeo, smat);
        sm.rotation.x = -0.34;
        session.scene.add(sm);
        dyn.steams.push({
          ox: ventOrigins[vi].x,
          oz: ventOrigins[vi].z,
          phase: (vi * 0.5 + k / 3.0) % 1.0,
          speed: 0.24 + k * 0.04,
          driftX: vi === 0 ? 0.45 : -0.45,
          mesh: sm,
          mat: smat
        });
      }
    }

    // 3. Drifting volumetric light-shaft dust motes under B1 ceiling lamps
    var moteCount = 44;
    var motePos = new Float32Array(moteCount * 3);
    var moteSeeds = new Float32Array(moteCount);
    for (var mi = 0; mi < moteCount; mi++) {
      var lamp = mi % 2 === 0 ? { x: 7.5, z: 7.5 } : { x: 15.5, z: 14.5 };
      var ang = Math.random() * Math.PI * 2;
      var rad = Math.random() * 3.8;
      motePos[mi * 3] = lamp.x + Math.cos(ang) * rad;
      motePos[mi * 3 + 1] = 0.25 + Math.random() * 2.75;
      motePos[mi * 3 + 2] = lamp.z + Math.sin(ang) * rad;
      moteSeeds[mi] = Math.random() * 6.283;
    }
    var moteGeo = session.trackGeo(new THREE.BufferGeometry());
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    var moteMat = session.trackMat(new THREE.PointsMaterial({
      color: 0xa6e8f8,
      size: 0.09,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var motePts = new THREE.Points(moteGeo, moteMat);
    session.scene.add(motePts);
    dyn.dustPoints = motePts;
    dyn.dustSeeds = moteSeeds;

    // 4. Distant subterranean Ghost Train light-band sweeping across B1 Concourse floor every ~18s
    var sweepGeo = session.trackGeo(new THREE.PlaneGeometry(3.2, 22.0));
    sweepGeo.rotateX(-Math.PI / 2);
    var sweepMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff4638,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.position.set(11.0, 0.048, 10.5);
    sweepMesh.rotation.y = 0.36;
    sweepMesh.visible = false;
    session.scene.add(sweepMesh);
    dyn.trainSweepMesh = sweepMesh;
    dyn.trainSweepMat = sweepMat;

    session.ambientDynamics = dyn;
  }

  function updateAmbientDynamics(session, realDt) {
    var dyn = session && session.ambientDynamics;
    if (!dyn) return;
    var dt = Math.min(0.05, Math.max(0.001, realDt || 0.016));
    var t = session.elapsedReal || 0;

    // 1. Ceiling drips + puddle ripples
    for (var di = 0; di < dyn.drips.length; di++) {
      var d = dyn.drips[di];
      if (!d.active) {
        d.cooldown -= dt;
        if (d.cooldown <= 0) {
          d.active = true;
          d.y = 3.15;
          d.vy = -0.8;
          d.mesh.position.set(d.x, d.y, d.z);
          d.mesh.visible = true;
        }
      } else {
        d.vy -= 14.5 * dt;
        d.y += d.vy * dt;
        d.mesh.position.y = d.y;
        if (d.y <= 0.06) {
          d.active = false;
          d.mesh.visible = false;
          d.cooldown = 2.1 + Math.random() * 2.8;
          if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnInkStepPuff === 'function') {
            INFINITY.VfxStudio.spawnInkStepPuff(session, d.x, d.z, 0, 0, 0x6eeaff, true);
          }
        }
      }
    }

    // 2. Vent cel steam plumes
    for (var si = 0; si < dyn.steams.length; si++) {
      var st = dyn.steams[si];
      st.phase = (st.phase + dt * st.speed) % 1.0;
      var p = st.phase;
      st.mesh.position.set(
        st.ox + st.driftX * p + Math.sin(t * 1.8 + si) * 0.12,
        0.38 + p * 1.95,
        st.oz + Math.cos(t * 1.4 + si) * 0.1
      );
      var sc = 0.55 + p * 1.15;
      st.mesh.scale.set(sc, sc, 1);
      st.mat.opacity = Math.sin(p * Math.PI) * 0.28;
    }

    // 3. Drifting dust motes under lamp shafts
    if (dyn.dustPoints && dyn.dustPoints.geometry && dyn.dustPoints.geometry.attributes.position) {
      var arr = dyn.dustPoints.geometry.attributes.position.array;
      var seeds = dyn.dustSeeds;
      var cnt = seeds ? seeds.length : 0;
      for (var mi = 0; mi < cnt; mi++) {
        var idx = mi * 3;
        arr[idx] += Math.sin(t * 0.7 + seeds[mi]) * 0.08 * dt;
        arr[idx + 1] -= 0.14 * dt;
        arr[idx + 2] += Math.cos(t * 0.6 + seeds[mi]) * 0.06 * dt;
        if (arr[idx + 1] < 0.16) arr[idx + 1] = 2.95;
      }
      dyn.dustPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Turnstile / kiosk LED glitch pulse
    if (dyn.ledGroups && dyn.ledGroups.length) {
      for (var li = 0; li < dyn.ledGroups.length; li++) {
        var lg = dyn.ledGroups[li];
        if (lg && lg.userData && lg.userData.ledMat) {
          var flk = Math.sin(t * 19.0 + li * 2.7) > -0.78;
          lg.userData.ledMat.color.setHex(flk ? (li % 2 === 0 ? 0x5ce8ff : 0xff3b52) : 0x101822);
        }
      }
    }

    // 5. Subterranean Ghost Train rumble light-band sweep across B1 floor
    if (dyn.trainSweepMesh && dyn.trainSweepMat) {
      if (dyn.trainSweepActive > 0) {
        dyn.trainSweepActive -= dt;
        var sp = 1.0 - Math.max(0, dyn.trainSweepActive / 2.2);
        dyn.trainSweepMesh.position.x = 2.5 + sp * 17.5;
        dyn.trainSweepMat.opacity = Math.sin(sp * Math.PI) * 0.16;
        if (dyn.trainSweepActive <= 0) {
          dyn.trainSweepMesh.visible = false;
          dyn.trainSweepMat.opacity = 0;
        }
      } else {
        dyn.trainSweepTimer -= dt;
        if (dyn.trainSweepTimer <= 0) {
          dyn.trainSweepTimer = 18.0 + Math.random() * 6.0;
          dyn.trainSweepActive = 2.2;
          dyn.trainSweepMesh.visible = true;
          if (typeof session.addCameraShake === 'function') {
            session.addCameraShake(0.06, 0.9, 16);
          }
        }
      }
    }
  }

  function buildZoneProps(session, specs) {
    var THREE = session.THREE;
    var steelMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x3b4658, roughness: 0.34, metalness: 0.72 }));
    var darkMetalMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.45, metalness: 0.62 }));
    var woodSlatMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x4b3c32, roughness: 0.78, metalness: 0.08 }));
    var copperMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xb86d3c, roughness: 0.32, metalness: 0.82 }));
    var cyanLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x5aeaff }));
    var amberLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xffaa40 }));
    var redLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xff3b52 }));
    var greenLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x4af2a1 }));

    // 1. B1 Concourse Stainless-Steel Subway Ticket Turnstiles (检票闸机)
    var tsBodyGeo = session.trackGeo(new THREE.BoxGeometry(0.28, 0.96, 1.12));
    var tsTopGeo = session.trackGeo(new THREE.BoxGeometry(0.32, 0.08, 1.16));
    var tsGlassGeo = session.trackGeo(new THREE.BoxGeometry(0.46, 0.48, 0.05));
    var tsGlassMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff4058,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    var tsLedGeo = session.trackGeo(new THREE.BoxGeometry(0.18, 0.10, 0.04));

    session._sceneALedGroups = [];
    for (var ti = 0; ti < specs.turnstiles.length; ti++) {
      var ts = specs.turnstiles[ti];
      if (session._sceneAEnabled && ts.x <= 20 && ts.z <= 19) {
        var tsCard = createPaintedPropBillboard(THREE, session, 'prop_turnstile', ts.x, ts.z, 1.48, 1.48, {
          emissiveColor: ti % 2 === 0 ? 0x5aeaff : 0xff3b52,
          ledX: 0.18,
          ledY: 0.92,
          ledZ: 0.18
        });
        if (tsCard) {
          session._sceneALedGroups.push(tsCard);
          continue;
        }
      }
      var g = new THREE.Group();
      g.position.set(ts.x, 0, ts.z);
      g.rotation.y = ts.rotY || 0;
      var body = new THREE.Mesh(tsBodyGeo, steelMat);
      body.position.y = 0.48;
      var top = new THREE.Mesh(tsTopGeo, darkMetalMat);
      top.position.y = 0.98;
      var led = new THREE.Mesh(tsLedGeo, ti % 2 === 0 ? cyanLedMat : redLedMat);
      led.position.set(0, 0.82, 0.57);
      var flap = new THREE.Mesh(tsGlassGeo, tsGlassMat);
      flap.position.set(0.35, 0.56, 0.0);
      g.add(body, top, led, flap);
      session.scene.add(g);
    }

    // 2. Subway Waiting Benches (tucked flush along walls)
    var benchSeatGeo = session.trackGeo(new THREE.BoxGeometry(2.1, 0.09, 0.56));
    var benchBackGeo = session.trackGeo(new THREE.BoxGeometry(2.1, 0.44, 0.07));
    var benchLegGeo = session.trackGeo(new THREE.BoxGeometry(0.10, 0.44, 0.50));
    for (var bi = 0; bi < specs.benches.length; bi++) {
      var bn = specs.benches[bi];
      if (session._sceneAEnabled && bn.x <= 20 && bn.z <= 19) {
        if (createPaintedPropBillboard(THREE, session, 'prop_bench', bn.x, bn.z, 2.25, 1.45, {
          flipX: bn.x < 10,
          shadowScaleX: 1.05,
          shadowScaleZ: 0.55
        })) {
          continue;
        }
      }
      var bg = new THREE.Group();
      bg.position.set(bn.x, 0, bn.z);
      bg.rotation.y = bn.rotY || 0;
      var seat = new THREE.Mesh(benchSeatGeo, woodSlatMat);
      seat.position.y = 0.46;
      var back = new THREE.Mesh(benchBackGeo, steelMat);
      back.position.set(0, 0.72, -0.24);
      var legL = new THREE.Mesh(benchLegGeo, darkMetalMat);
      legL.position.set(-0.82, 0.22, 0);
      var legR = new THREE.Mesh(benchLegGeo, darkMetalMat);
      legR.position.set(0.82, 0.22, 0);
      bg.add(seat, back, legL, legR);
      session.scene.add(bg);
    }

    // 2B. B1 Concourse Painted Storytelling Clutter Clusters (wall/pillar-tucked, zero lane blocking)
    if (session._sceneAEnabled) {
      var clutterSpots = [
        { x: 2.95, z: 3.15, w: 1.38, h: 1.24, flip: false },
        { x: 18.85, z: 10.6, w: 1.32, h: 1.18, flip: true },
        { x: 6.5, z: 7.42, w: 1.18, h: 1.06, flip: false },
        { x: 14.5, z: 7.42, w: 1.22, h: 1.10, flip: true }
      ];
      for (var cl = 0; cl < clutterSpots.length; cl++) {
        var cs = clutterSpots[cl];
        createPaintedPropBillboard(THREE, session, 'prop_clutter', cs.x, cs.z, cs.w, cs.h, {
          flipX: cs.flip,
          shadowScaleX: 1.08,
          shadowScaleZ: 0.68
        });
      }
    }

    // 3. Illuminated Subway Route Map Kiosk & Overhead Directional Transit Signage
    var routeTex = createRouteMapTexture(THREE, session);
    for (var si = 0; si < specs.wallSigns.length; si++) {
      var sn = specs.wallSigns[si];
      var sg = new THREE.Group();
      sg.position.set(sn.x, sn.y, sn.z);
      sg.rotation.y = sn.rotY || 0;

      var frame = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(sn.w + 0.16, sn.h + 0.16, 0.14)), darkMetalMat);
      sg.add(frame);

      var faceTex = sn.kind === 'route_map'
        ? routeTex
        : createSignTexture(THREE, session, sn.title, sn.sub, sn.accent, '#09111a');
      var faceMat = session.trackMat(new THREE.MeshBasicMaterial({ map: faceTex }));
      var face = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(sn.w, sn.h)), faceMat);
      face.position.z = 0.08;
      sg.add(face);

      // Hanging suspension rods for overhead transit signs
      if (sn.kind === 'hanging_sign') {
        var faceBack = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(sn.w, sn.h)), faceMat);
        faceBack.position.z = -0.08;
        faceBack.rotation.y = Math.PI;
        sg.add(faceBack);
        var rodGeo = session.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 6));
        var rodL = new THREE.Mesh(rodGeo, steelMat);
        rodL.position.set(-sn.w * 0.36, sn.h * 0.5 + 0.32, 0);
        var rodR = new THREE.Mesh(rodGeo, steelMat);
        rodR.position.set(sn.w * 0.36, sn.h * 0.5 + 0.32, 0);
        sg.add(rodL, rodR);
      }
      session.scene.add(sg);
    }

    // 4. Signal Dispatch CRT Monitor Bank & Server Racks
    var crtTex = createCrtBankTexture(THREE, session);
    var crtMat = session.trackMat(new THREE.MeshBasicMaterial({ map: crtTex }));
    for (var ci = 0; ci < specs.crtBanks.length; ci++) {
      var cb = specs.crtBanks[ci];
      var cg = new THREE.Group();
      cg.position.set(cb.x, cb.y, cb.z);
      var housing = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(cb.w + 0.24, cb.h + 0.24, 0.28)), darkMetalMat);
      var scr = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(cb.w, cb.h)), crtMat);
      scr.position.z = 0.15;
      cg.add(housing, scr);
      session.scene.add(cg);
    }

    var rackGeo = session.trackGeo(new THREE.BoxGeometry(0.86, 2.35, 0.72));
    var ledStripGeo = session.trackGeo(new THREE.BoxGeometry(0.54, 0.06, 0.04));
    for (var sr = 0; sr < specs.serverRacks.length; sr++) {
      var rk = specs.serverRacks[sr];
      var rg = new THREE.Group();
      rg.position.set(rk.x, 0, rk.z);
      rg.rotation.y = rk.rotY || 0;
      var box = new THREE.Mesh(rackGeo, darkMetalMat);
      box.position.y = 1.18;
      rg.add(box);
      for (var ly = 0; ly < 4; ly++) {
        var lm = new THREE.Mesh(ledStripGeo, ly === 1 ? amberLedMat : (ly === 3 ? cyanLedMat : greenLedMat));
        lm.position.set(0, 0.65 + ly * 0.42, 0.37);
        rg.add(lm);
      }
      session.scene.add(rg);
    }

    // 5. Substation High-Voltage Copper-Coil Transformers (mounted on top of transformer blocks)
    var coilGeo = session.trackGeo(new THREE.CylinderGeometry(0.32, 0.36, 0.95, 12));
    var insGeo = session.trackGeo(new THREE.TorusGeometry(0.36, 0.055, 6, 14));
    insGeo.rotateX(Math.PI / 2);
    var capOrbGeo = session.trackGeo(new THREE.SphereGeometry(0.16, 10, 10));
    var ozoneMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x6ce4ff }));

    for (var tfi = 0; tfi < specs.transformers.length; tfi++) {
      var tf = specs.transformers[tfi];
      var tg = new THREE.Group();
      tg.position.set(tf.x, 2.62, tf.z);
      for (var side = -0.45; side <= 0.45; side += 0.9) {
        var coil = new THREE.Mesh(coilGeo, copperMat);
        coil.position.set(side, 0.48, 0);
        tg.add(coil);
        for (var ring = 0; ring < 3; ring++) {
          var ins = new THREE.Mesh(insGeo, steelMat);
          ins.position.set(side, 0.25 + ring * 0.26, 0);
          tg.add(ins);
        }
        var orb = new THREE.Mesh(capOrbGeo, ozoneMat);
        orb.position.set(side, 1.06, 0);
        tg.add(orb);
      }
      session.scene.add(tg);
    }

    // Overhead high-voltage steel busbar linking Substation transformers
    var busbar = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 11.2, 8)), copperMat);
    busbar.rotation.z = Math.PI / 2;
    busbar.position.set(11.5, 3.68, 25.5);
    session.scene.add(busbar);

    // 6. Tunnel Industrial Pipes & Tucked Maintenance Crates
    var pipeGeo = session.trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 17.5, 8));
    pipeGeo.rotateZ(Math.PI / 2);
    var pipe1 = new THREE.Mesh(pipeGeo, steelMat);
    pipe1.position.set(31.0, 2.35, 35.85);
    var pipe2 = new THREE.Mesh(pipeGeo, copperMat);
    pipe2.position.set(31.0, 2.02, 35.85);
    session.scene.add(pipe1, pipe2);

    var crateGeo = session.trackGeo(new THREE.BoxGeometry(0.76, 0.64, 0.76));
    var crateMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x353c48, roughness: 0.72, metalness: 0.35 }));
    var crateTrimGeo = session.trackGeo(new THREE.BoxGeometry(0.79, 0.10, 0.79));
    for (var cri = 0; cri < specs.cratesAndBarricades.length; cri++) {
      var cr = specs.cratesAndBarricades[cri];
      var cg2 = new THREE.Group();
      cg2.position.set(cr.x, 0, cr.z);
      cg2.rotation.y = cr.rotY || 0;
      var cb2 = new THREE.Mesh(crateGeo, crateMat);
      cb2.position.y = 0.32;
      var ct2 = new THREE.Mesh(crateTrimGeo, amberLedMat);
      ct2.position.y = 0.54;
      cg2.add(cb2, ct2);
      session.scene.add(cg2);
    }

    // 7. Floor Directional Guiding Strips (Concourse -> Corridor & Corridor -> Platform 0)
    var stripMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0x56d8f0,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    }));
    var strip1 = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(11.5, 0.16)), stripMat);
    strip1.rotation.x = -Math.PI / 2;
    strip1.position.set(16.2, 0.022, 15.8);
    var strip2 = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(16.5, 0.16)), stripMat);
    strip2.rotation.x = -Math.PI / 2;
    strip2.position.set(33.2, 0.022, 18.5);
    session.scene.add(strip1, strip2);

    // 8. 6 Zone-Signature 3D Landmarks (distinct silhouettes for instant zone orientation)
    var landmarks = specs.landmarks || [];
    var darkSteel = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1b222e, roughness: 0.48, metalness: 0.70 }));
    for (var lmi = 0; lmi < landmarks.length; lmi++) {
      var lm = landmarks[lmi];
      var zCol = (INFINITY.ArtTokens && typeof INFINITY.ArtTokens.getZoneColor === 'function')
        ? hexToInt(INFINITY.ArtTokens.getZoneColor(lm.zone, lm.color), 0x68c8de)
        : hexToInt(lm.color, 0x68c8de);
      var lmGlowMat = session.trackMat(new THREE.MeshBasicMaterial({ color: zCol }));
      var lmHaloMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: zCol,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      var g = new THREE.Group();
      g.position.set(lm.x, 0, lm.z);

      var basePad = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.62, 0.72, 0.14, 8)), darkSteel);
      basePad.position.y = 0.07;
      g.add(basePad);

      var floorHalo = new THREE.Mesh(session.trackGeo(new THREE.RingGeometry(0.70, 0.92, 24)), lmHaloMat);
      floorHalo.rotation.x = -Math.PI / 2;
      floorHalo.position.y = 0.04;
      g.add(floorHalo);

      if (lm.kind === 'clock_totem') {
        if (session._sceneAEnabled && createPaintedPropBillboard(THREE, session, 'prop_clock_totem', lm.x, lm.z, 1.78, 2.85, {
          emissiveColor: zCol,
          ledX: 0.02,
          ledY: 2.28,
          ledZ: 0.16,
          shadowScaleX: 0.85,
          shadowScaleZ: 0.55
        })) {
          continue;
        }
        var pillar = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.42, 2.35, 0.42)), steelMat);
        pillar.position.y = 1.24;
        var dialFrame = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.18, 16)), darkSteel);
        dialFrame.rotation.x = Math.PI / 2;
        dialFrame.position.set(0, 2.35, 0.16);
        var dialRing = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.46, 0.04, 8, 24)), lmGlowMat);
        dialRing.position.set(0, 2.35, 0.26);
        var handA = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.05, 0.34, 0.04)), lmGlowMat);
        handA.position.set(0, 2.48, 0.27);
        var handB = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.24, 0.05, 0.04)), lmGlowMat);
        handB.position.set(0.10, 2.35, 0.27);
        g.add(pillar, dialFrame, dialRing, handA, handB);
      } else if (lm.kind === 'transit_arch') {
        var postL = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.22, 2.6, 0.24)), steelMat);
        postL.position.set(-0.62, 1.3, 0);
        var postR = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.22, 2.6, 0.24)), steelMat);
        postR.position.set(0.62, 1.3, 0);
        var lintel = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.56, 0.28, 0.30)), darkSteel);
        lintel.position.set(0, 2.55, 0);
        var neonBar = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.36, 0.08, 0.34)), lmGlowMat);
        neonBar.position.set(0, 2.42, 0);
        g.add(postL, postR, lintel, neonBar);
      } else if (lm.kind === 'radar_tower') {
        var mast = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.12, 0.26, 2.2, 6)), steelMat);
        mast.position.y = 1.15;
        var dish = new THREE.Mesh(session.trackGeo(new THREE.ConeGeometry(0.55, 0.35, 12, 1, true)), darkSteel);
        dish.position.set(0, 2.32, 0);
        dish.rotation.x = 0.55;
        var tip = new THREE.Mesh(session.trackGeo(new THREE.OctahedronGeometry(0.18, 0)), lmGlowMat);
        tip.position.set(0, 2.55, 0.12);
        var ring1 = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.42, 0.03, 6, 20)), lmGlowMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 1.75;
        g.add(mast, dish, tip, ring1);
      } else if (lm.kind === 'tesla_coil') {
        var core = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 2.35, 10)), copperMat);
        core.position.y = 1.24;
        for (var ci = 0; ci < 3; ci++) {
          var coilRing = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.44 - ci * 0.05, 0.055, 8, 20)), steelMat);
          coilRing.rotation.x = Math.PI / 2;
          coilRing.position.y = 1.15 + ci * 0.45;
          g.add(coilRing);
        }
        var crown = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.36, 0.08, 8, 20)), lmGlowMat);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 2.45;
        g.add(core, crown);
      } else if (lm.kind === 'vent_turbine') {
        var shroud = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.42, 16, 1, true)), darkSteel);
        shroud.rotation.x = Math.PI / 2;
        shroud.position.set(0, 1.35, 0);
        var stand = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.85, 0.72, 0.45)), steelMat);
        stand.position.y = 0.42;
        var bladeGeo = session.trackGeo(new THREE.BoxGeometry(1.12, 0.14, 0.05));
        var bladeA = new THREE.Mesh(bladeGeo, steelMat);
        bladeA.position.set(0, 1.35, 0);
        var bladeB = new THREE.Mesh(bladeGeo, steelMat);
        bladeB.position.set(0, 1.35, 0);
        bladeB.rotation.z = Math.PI / 2;
        var hub = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.16, 10, 10)), lmGlowMat);
        hub.position.set(0, 1.35, 0.06);
        var rim = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.66, 0.035, 6, 24)), lmGlowMat);
        rim.position.set(0, 1.35, 0.21);
        g.add(shroud, stand, bladeA, bladeB, hub, rim);
      } else if (lm.kind === 'signal_mast') {
        var pole = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.10, 0.14, 2.75, 8)), steelMat);
        pole.position.y = 1.42;
        var box = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.36, 0.96, 0.28)), darkSteel);
        box.position.set(0, 2.35, 0.06);
        var lampTop = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.10, 10, 10)), lmGlowMat);
        lampTop.position.set(0, 2.62, 0.20);
        var lampMid = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.10, 10, 10)), lmGlowMat);
        lampMid.position.set(0, 2.35, 0.20);
        var arm = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.82, 0.09, 0.09)), lmGlowMat);
        arm.position.set(0.35, 1.78, 0);
        g.add(pole, box, lampTop, lampMid, arm);
      }
      session.scene.add(g);
    }
  }

  /* --------------------------------------------------------------------------
   * 2. Hanging Industrial Fluorescent Light Fixtures + Volumetric Light Cones
   * (Replaces the bare floating blue 0.45x0.12x0.45 squares!)
   * -------------------------------------------------------------------------- */
  function buildLightFixtures(session, lightDefs) {
    var THREE = session.THREE;
    if (!lightDefs || lightDefs.length === 0) return null;

    var count = lightDefs.length;
    var dummy = session._dummy;
    var col = new THREE.Color();

    // 1. Dark steel reflector housing + ceiling suspension bar
    var housingGeo = session.trackGeo(new THREE.BoxGeometry(1.48, 0.14, 0.34));
    var housingMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1a222e, roughness: 0.42, metalness: 0.72 }));
    var housingMesh = new THREE.InstancedMesh(housingGeo, housingMat, count);

    // 2. Glowing fluorescent tube bar nestled under the shroud
    var tubeGeo = session.trackGeo(new THREE.BoxGeometry(1.32, 0.07, 0.16));
    var tubeMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xdff6ff }));
    var tubeMesh = new THREE.InstancedMesh(tubeGeo, tubeMat, count);

    // 3. Soft translucent volumetric downward light cone (subtle pools of atmosphere!)
    // Additive blending happens in the linear PostFX target, where low alpha is lifted
    // strongly by the final sRGB encode; keep opacity low to stay a faint haze.
    var coneGeo = session.trackGeo(new THREE.ConeGeometry(2.35, 3.1, 16, 1, true));
    var coneMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.016,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var coneMesh = new THREE.InstancedMesh(coneGeo, coneMat, count);

    // 4. Overhead steel cross-beam supporting each light fixture
    var beamGeo = session.trackGeo(new THREE.BoxGeometry(3.8, 0.12, 0.14));
    var beamMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.6, metalness: 0.55 }));
    var beamMesh = new THREE.InstancedMesh(beamGeo, beamMat, count);

    for (var i = 0; i < count; i++) {
      var ld = lightDefs[i];
      var rotY = (ld.x > 40) ? Math.PI * 0.5 : 0;
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(1, 1, 1);

      dummy.position.set(ld.x, 4.68, ld.z);
      dummy.updateMatrix();
      beamMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(ld.x, 4.54, ld.z);
      dummy.updateMatrix();
      housingMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(ld.x, 4.46, ld.z);
      dummy.updateMatrix();
      tubeMesh.setMatrixAt(i, dummy.matrix);

      dummy.rotation.set(0, 0, 0);
      dummy.position.set(ld.x, 2.25, ld.z);
      dummy.updateMatrix();
      coneMesh.setMatrixAt(i, dummy.matrix);

      col.setHex(ld.color);
      if (typeof tubeMesh.setColorAt === 'function') tubeMesh.setColorAt(i, col);
      if (typeof coneMesh.setColorAt === 'function') coneMesh.setColorAt(i, col);
    }

    beamMesh.instanceMatrix.needsUpdate = true;
    housingMesh.instanceMatrix.needsUpdate = true;
    tubeMesh.instanceMatrix.needsUpdate = true;
    coneMesh.instanceMatrix.needsUpdate = true;
    if (tubeMesh.instanceColor) tubeMesh.instanceColor.needsUpdate = true;
    if (coneMesh.instanceColor) coneMesh.instanceColor.needsUpdate = true;

    session.scene.add(beamMesh, housingMesh, tubeMesh, coneMesh);

    // Per-fixture bulb control: each fixture owns its instance color, so flicker and
    // EMP blackout can be applied locally instead of through one shared material.
    var baseHex = [];
    for (var bi = 0; bi < count; bi++) {
      baseHex.push(hexToInt(lightDefs[bi].color, 0xdff6ff));
    }
    var levelCol = new THREE.Color();
    session.stationBulbControl = {
      count: count,
      positions: lightDefs.map(function (d) { return { x: Number(d.x) || 0, z: Number(d.z) || 0 }; }),
      setLevel: function (idx, level, overrideHex) {
        if (idx < 0 || idx >= count) return;
        var lv = Math.max(0, Math.min(1.5, Number(level)));
        if (isNaN(lv)) lv = 1;
        levelCol.setHex(typeof overrideHex === 'number' ? overrideHex : baseHex[idx]).multiplyScalar(lv);
        if (typeof tubeMesh.setColorAt === 'function') tubeMesh.setColorAt(idx, levelCol);
        if (typeof coneMesh.setColorAt === 'function') coneMesh.setColorAt(idx, levelCol);
      },
      commit: function () {
        if (tubeMesh.instanceColor) tubeMesh.instanceColor.needsUpdate = true;
        if (coneMesh.instanceColor) coneMesh.instanceColor.needsUpdate = true;
      }
    };
    return tubeMat;
  }

  /* --------------------------------------------------------------------------
   * 3. Upgraded 4-Car Articulated Ghost Train No.0
   * -------------------------------------------------------------------------- */
  function buildGhostTrain(session, opts) {
    var THREE = session.THREE;
    var cfg = opts || {};
    var RAIL_Y = cfg.RAIL_Y || -0.58;
    var TRAIN_X = cfg.TRAIN_X || 51.5;

    var group = new THREE.Group();
    var spritesApi = INFINITY.PixelSprites || null;
    var hullTex = session.getTileTex('train_hull', '#1d222c', '#6e2230');
    var hullNorm = (spritesApi && spritesApi.getTileNormalTexture) ? spritesApi.getTileNormalTexture('train_hull') : null;
    var hullRough = (spritesApi && spritesApi.getTileRoughnessTexture) ? spritesApi.getTileRoughnessTexture('train_hull') : null;

    var hullMat = session.trackMat(new THREE.MeshStandardMaterial({
      map: hullTex,
      normalMap: hullNorm || null,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: hullRough || null,
      roughness: 0.56,
      metalness: 0.58,
      emissive: 0x1e060b,
      emissiveIntensity: 0.42
    }));
    var darkSteelMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.52, metalness: 0.65 }));
    var winMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xff2c42 }));
    var winFrameMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.4, metalness: 0.8 }));
    var headMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xff6270 }));

    var carGeo = session.trackGeo(new THREE.BoxGeometry(2.42, 2.55, 6.2));
    var roofGeo = session.trackGeo(new THREE.BoxGeometry(2.14, 0.24, 6.0));
    var acGeo = session.trackGeo(new THREE.BoxGeometry(1.25, 0.24, 1.55));
    var bogieGeo = session.trackGeo(new THREE.BoxGeometry(2.05, 0.42, 1.45));
    var couplerGeo = session.trackGeo(new THREE.BoxGeometry(1.5, 1.9, 0.58));
    var winGeo = session.trackGeo(new THREE.PlaneGeometry(1.18, 0.78));
    var frameGeo = session.trackGeo(new THREE.BoxGeometry(0.08, 0.90, 1.32));
    var lampGeo = session.trackGeo(new THREE.CylinderGeometry(0.18, 0.20, 0.16, 12));
    lampGeo.rotateX(Math.PI / 2);

    for (var i = 0; i < 4; i++) {
      var cz = -i * 6.75;
      var car = new THREE.Mesh(carGeo, hullMat);
      car.position.set(0, 1.42, cz);
      group.add(car);

      var roof = new THREE.Mesh(roofGeo, darkSteelMat);
      roof.position.set(0, 2.78, cz);
      group.add(roof);

      var acUnit = new THREE.Mesh(acGeo, darkSteelMat);
      acUnit.position.set(0, 2.98, cz);
      group.add(acUnit);

      // Undercarriage bogie trucks
      var bogieF = new THREE.Mesh(bogieGeo, darkSteelMat);
      bogieF.position.set(0, 0.18, cz + 2.0);
      var bogieB = new THREE.Mesh(bogieGeo, darkSteelMat);
      bogieB.position.set(0, 0.18, cz - 2.0);
      group.add(bogieF, bogieB);

      // Flexible bellows coupling between cars
      if (i > 0) {
        var coupler = new THREE.Mesh(couplerGeo, darkSteelMat);
        coupler.position.set(0, 1.32, cz + 3.38);
        group.add(coupler);
      }

      // Recessed glowing crimson windows facing Platform 0
      for (var w = -1; w <= 1; w++) {
        var wz = cz + w * 1.82;
        var wFrame = new THREE.Mesh(frameGeo, winFrameMat);
        wFrame.position.set(-1.21, 1.62, wz);
        var win = new THREE.Mesh(winGeo, winMat);
        win.position.set(-1.255, 1.62, wz);
        win.rotation.y = -Math.PI / 2;
        group.add(wFrame, win);
      }
    }

    // Sloped cowcatcher & twin headlights on Lead Locomotive
    var nose = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.32, 0.65, 0.55)), darkSteelMat);
    nose.position.set(0, 0.48, 3.22);
    group.add(nose);

    var lampL = new THREE.Mesh(lampGeo, headMat);
    lampL.position.set(-0.72, 1.15, 3.16);
    var lampR = new THREE.Mesh(lampGeo, headMat);
    lampR.position.set(0.72, 1.15, 3.16);
    group.add(lampL, lampR);

    var coneGeo = session.trackGeo(new THREE.ConeGeometry(2.9, 10.5, 16, 1, true));
    coneGeo.rotateX(-Math.PI / 2);
    var coneMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff2238,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0.95, 8.4);
    group.add(cone);

    var trainLight = new THREE.PointLight(0xff1c36, 4.2, 22, 1.3);
    trainLight.position.set(-0.5, 1.65, 5.2);
    group.add(trainLight);

    group.position.set(TRAIN_X, RAIL_Y + 0.12, -32);
    group.visible = false;
    session.scene.add(group);

    return {
      group: group,
      light: trainLight,
      z: -32,
      speed: 0
    };
  }

  /* --------------------------------------------------------------------------
   * 4. Composite 3D Procedural Interactables (Consoles, Clues, Blast Exit Gate)
   * Preserves exact engine_25d item contract (group, sprite, mat, ring, ringMat)
   * -------------------------------------------------------------------------- */
  function buildInteractables(session) {
    var THREE = session.THREE;
    var defs = [];
    if (typeof session.mapApi.getInteractables === 'function') {
      try { defs = session.mapApi.getInteractables() || []; } catch (_) { defs = []; }
    }

    var steelMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x303a4b, roughness: 0.36, metalness: 0.72 }));
    var darkCaseMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x161c26, roughness: 0.48, metalness: 0.58 }));
    var brassMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xc99c4a, roughness: 0.35, metalness: 0.78 }));

    var ringGeo = session.trackGeo(new THREE.RingGeometry(0.58, 0.76, 28));
    ringGeo.rotateX(-Math.PI / 2);

    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var type = d.type || 'clue';
      var group = new THREE.Group();
      group.position.set(d.x, 0, d.z);

      var interactHex = (INFINITY.ArtTokens && INFINITY.ArtTokens.SEMANTIC && INFINITY.ArtTokens.SEMANTIC.interactInt) || 0x5ce8c8;
      var warningHex = (INFINITY.ArtTokens && INFINITY.ArtTokens.SEMANTIC && INFINITY.ArtTokens.SEMANTIC.warningInt) || 0xffaa3b;
      var ringColor = type === 'exit' ? warningHex : interactHex;
      var rMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.66,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      var ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.y = 0.08;
      if (type === 'exit') ring.scale.set(1.85, 1.85, 1);
      group.add(ring);

      // Unified outer pulse ring for high-readability ground affordance
      var pulseMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      var pulseRing = new THREE.Mesh(ringGeo, pulseMat);
      pulseRing.position.y = 0.075;
      group.add(pulseRing);

      var spriteMesh = null;
      var mainMat = null;
      var auxBeaconMat = null;

      if (type === 'console') {
        // Composite 7-part Heavy Industrial Track-Override Terminal
        var plinth = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.18, 0.16, 0.88)), darkCaseMat);
        plinth.position.y = 0.08;
        var pedestal = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.96, 0.92, 0.66)), steelMat);
        pedestal.position.y = 0.58;
        var desk = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.14, 0.18, 0.78)), darkCaseMat);
        desk.position.set(0, 1.06, 0.06);
        desk.rotation.x = 0.24;

        var monitorHood = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.96, 0.68, 0.42)), darkCaseMat);
        monitorHood.position.set(0, 1.44, -0.06);
        monitorHood.rotation.x = -0.18;

        var texOff = session.getPropTex('console_off', '#f2a944');
        mainMat = session.trackMat(new THREE.MeshStandardMaterial({
          map: texOff,
          emissiveMap: texOff,
          emissive: 0xffffff,
          emissiveIntensity: 0.95,
          roughness: 0.25,
          metalness: 0.15
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.84, 0.54)), mainMat);
        spriteMesh.position.set(0, 1.44, 0.16);
        spriteMesh.rotation.x = -0.18;

        // Mechanical switch lever + overhead status beacon
        var lever = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8)), brassMat);
        lever.position.set(0.42, 1.24, 0.18);
        lever.rotation.x = 0.4;
        var beaconPole = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.035, 0.04, 0.42, 8)), steelMat);
        beaconPole.position.set(-0.38, 1.92, -0.12);
        auxBeaconMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xffa838 }));
        var beaconBulb = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.10, 10, 10)), auxBeaconMat);
        beaconBulb.position.set(-0.38, 2.16, -0.12);

        group.add(plinth, pedestal, desk, monitorHood, spriteMesh, lever, beaconPole, beaconBulb);
      } else if (type === 'exit') {
        // Monumental Armored Subway Blast-Door Archway + Shimmering Forcefield Curtain
        var colGeo = session.trackGeo(new THREE.BoxGeometry(0.44, 2.72, 0.56));
        var colL = new THREE.Mesh(colGeo, steelMat);
        colL.position.set(-1.18, 1.36, 0);
        var colR = new THREE.Mesh(colGeo, steelMat);
        colR.position.set(1.18, 1.36, 0);
        var header = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.92, 0.48, 0.66)), darkCaseMat);
        header.position.set(0, 2.74, 0);

        var exitSignTex = createSignTexture(THREE, session, 'EXIT // 零号脱出闸门', 'OVERRIDE 100% OR PURGE BOSS', '#4af2a1', '#091815');
        var signMat = session.trackMat(new THREE.MeshBasicMaterial({ map: exitSignTex }));
        var signFace = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(2.55, 0.42)), signMat);
        signFace.position.set(0, 2.74, 0.34);

        var runeTex = session.getPropTex('vfx_hex_pattern', '#6fd8ea');
        mainMat = session.trackMat(new THREE.MeshBasicMaterial({
          map: runeTex,
          color: warningHex,
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(1.96, 2.48)), mainMat);
        spriteMesh.position.set(0, 1.26, 0);

        group.add(colL, colR, header, signFace, spriteMesh);
      } else {
        // Sculpted Holographic Evidence Pedestal + Floating Illuminated Dossier Prism
        var pad = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.42, 0.50, 0.10, 8)), darkCaseMat);
        pad.position.y = 0.05;
        var caseBox = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.48, 0.16, 0.34)), steelMat);
        caseBox.position.set(0, 0.17, 0);
        var clasp = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.14, 0.06, 0.36)), brassMat);
        clasp.position.set(0, 0.21, 0);

        // Soft vertical holographic projection cone
        var holoCone = new THREE.Mesh(
          session.trackGeo(new THREE.ConeGeometry(0.42, 1.15, 12, 1, true)),
          session.trackMat(new THREE.MeshBasicMaterial({
            color: 0x6fd8ea,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
          }))
        );
        holoCone.position.y = 0.72;
        holoCone.rotation.x = Math.PI;

        var clueTex = session.getPropTex('clue_glow', '#6fd8ea');
        mainMat = session.trackMat(new THREE.MeshBasicMaterial({
          map: clueTex,
          color: 0xffffff,
          transparent: true,
          opacity: 0.96,
          side: THREE.DoubleSide,
          depthWrite: false
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.86, 0.86)), mainMat);
        spriteMesh.position.y = 0.88;
        spriteMesh.rotation.x = -0.28;

        group.add(pad, caseBox, clasp, holoCone, spriteMesh);
      }

      session.scene.add(group);

      var item = {
        id: d.id || ('obj_' + i),
        type: type,
        x: Number(d.x),
        z: Number(d.z),
        zoneId: d.zoneId || session.mapApi.getZoneAt(d.x, d.z),
        label: d.label || (type === 'console' ? '道岔控制台' : (type === 'exit' ? '0号站台撤离闸门' : '异常线索')),
        clueId: d.clueId || null,
        overrideValue: Number(d.overrideValue) || 50,
        done: false,
        progress: 0,
        group: group,
        sprite: spriteMesh,
        mat: mainMat,
        beaconMat: auxBeaconMat,
        ring: ring,
        ringMat: rMat,
        pulseRing: pulseRing,
        pulseMat: pulseMat,
        bobPhase: i * 1.3
      };

      session.interactables.push(item);
      session.interactablesById[item.id] = item;
    }
  }

  INFINITY.SceneArchitect = {
    buildStation: buildStation,
    buildLightFixtures: buildLightFixtures,
    buildGhostTrain: buildGhostTrain,
    buildInteractables: buildInteractables,
    updateAmbientDynamics: updateAmbientDynamics,
    getZonePropSpecs: getZonePropSpecs
  };
})(typeof window !== 'undefined' ? window : globalThis);
