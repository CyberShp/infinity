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

    // --- 1D. ZONE-SPECIFIC 3D ARCHITECTURAL STORYTELLING PROPS ---
    buildZoneProps(session, propSpecs);
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

    for (var ti = 0; ti < specs.turnstiles.length; ti++) {
      var ts = specs.turnstiles[ti];
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
    var coneGeo = session.trackGeo(new THREE.ConeGeometry(2.35, 3.1, 16, 1, true));
    var coneMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.055,
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

      dummy.position.set(ld.x, 3.36, ld.z);
      dummy.updateMatrix();
      beamMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(ld.x, 3.24, ld.z);
      dummy.updateMatrix();
      housingMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(ld.x, 3.16, ld.z);
      dummy.updateMatrix();
      tubeMesh.setMatrixAt(i, dummy.matrix);

      dummy.rotation.set(0, 0, 0);
      dummy.position.set(ld.x, 1.62, ld.z);
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

      var ringColor = type === 'console' ? 0xf2a944 : (type === 'exit' ? 0xe85d4a : 0x6fd8ea);
      var rMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      var ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.y = 0.08;
      if (type === 'exit') ring.scale.set(1.85, 1.85, 1);
      group.add(ring);

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
          color: 0xe85d4a,
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
    getZonePropSpecs: getZonePropSpecs
  };
})(typeof window !== 'undefined' ? window : globalThis);
