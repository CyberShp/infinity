/* ============================================================================
 * Infinity 2.5D HD-2D Engine — Station Zero Seamless 56x38 Subway Map
 * 6 Interconnected Zones, Smooth Circle-AABB Sliding, DDA LOS & Fast A*
 * Attaches cleanly to window.INFINITY.StationMap
 * ============================================================================ */
(function (global) {
  'use strict';
  var INFINITY = (global.INFINITY = global.INFINITY || {});

  var GRID_W = 56;
  var GRID_H = 38;
  var TILE = 1.0;

  // Tile type constants:
  // 0 = floor_slate (walkable)
  // 1 = wall (solid, blocks movement & LOS)
  // 2 = floor_platform (walkable)
  // 3 = floor_hazard (walkable Platform 0 warning edge)
  // 4 = floor_rail (recessed Ghost Train trench — blocks movement, open LOS)
  var T_FLOOR = 0;
  var T_WALL = 1;
  var T_PLATFORM = 2;
  var T_HAZARD = 3;
  var T_RAIL = 4;

  // Zone colors are sourced from INFINITY.ArtTokens.ZONES (single source of truth).
  // Inline fallbacks mirror art_tokens.js so the map stays valid if tokens fail to load.
  // Platform 0 uses warning amber: threat red is reserved for the Inspector.
  var ZONE_COLOR_FALLBACK = {
    concourse:  '#68c8de',
    corridor:   '#d6b274',
    dispatch:   '#52c4a2',
    substation: '#6e9eff',
    tunnel:     '#a884e0',
    platform0:  '#e69c3c'
  };

  function resolveZoneColor(zoneId) {
    var tokens = INFINITY.ArtTokens;
    if (tokens && tokens.ZONES && tokens.ZONES[zoneId] && tokens.ZONES[zoneId].color) {
      return tokens.ZONES[zoneId].color;
    }
    return ZONE_COLOR_FALLBACK[zoneId];
  }

  var ZONES = {
    concourse:  { id: 'concourse',  name: 'B1 检票大厅',   code: 'Z-01', cx: 10, cz: 10, color: resolveZoneColor('concourse') },
    corridor:   { id: 'corridor',   name: 'B2 换乘长廊',   code: 'Z-02', cx: 26, cz: 18, color: resolveZoneColor('corridor') },
    dispatch:   { id: 'dispatch',   name: '信号调度室',    code: 'Z-03', cx: 30, cz: 7,  color: resolveZoneColor('dispatch') },
    substation: { id: 'substation', name: '旧变电间',      code: 'Z-04', cx: 11, cz: 29, color: resolveZoneColor('substation') },
    tunnel:     { id: 'tunnel',     name: '废弃应急通道',  code: 'Z-05', cx: 34, cz: 30, color: resolveZoneColor('tunnel') },
    platform0:  { id: 'platform0',  name: '0号站台铁轨',   code: 'Z-06', cx: 47, cz: 18, color: resolveZoneColor('platform0') }
  };

  /* --------------------------------------------------------------------------
   * Build 56x38 Grid Layout
   * -------------------------------------------------------------------------- */
  var grid = [];
  var pillarMask = []; // marks interior tactical cover pillars (lower height)

  (function buildLayout() {
    var x, z;
    for (z = 0; z < GRID_H; z++) {
      var row = new Array(GRID_W);
      var pRow = new Array(GRID_W);
      for (x = 0; x < GRID_W; x++) {
        row[x] = T_WALL;
        pRow[x] = 0;
      }
      grid.push(row);
      pillarMask.push(pRow);
    }

    function fillRect(x0, z0, x1, z1, val) {
      for (var zz = z0; zz <= z1; zz++) {
        for (var xx = x0; xx <= x1; xx++) {
          if (xx >= 0 && xx < GRID_W && zz >= 0 && zz < GRID_H) {
            grid[zz][xx] = val;
          }
        }
      }
    }

    function addPillar(x0, z0, x1, z1) {
      for (var zz = z0; zz <= z1; zz++) {
        for (var xx = x0; xx <= x1; xx++) {
          grid[zz][xx] = T_WALL;
          pillarMask[zz][xx] = 1;
        }
      }
    }

    // 1. Concourse (B1 检票大厅): x: 2..19, z: 2..18
    fillRect(2, 2, 19, 18, T_FLOOR);
    // Two subtle concourse support columns (leaving center 10,10 & all lanes wide open)
    addPillar(6, 6, 6, 6);
    addPillar(14, 6, 14, 6);

    // 2. Corridor (B2 换乘长廊): x: 22..40, z: 13..24
    fillRect(22, 13, 40, 24, T_FLOOR);
    // 4 tactical cover pillars with 3-5 tile wide lanes on ALL sides!
    // Center (26,18) is in the 4-tile wide central avenue (z=17..20)
    addPillar(25, 16, 26, 16);
    addPillar(34, 16, 35, 16);
    addPillar(25, 21, 26, 21);
    addPillar(34, 21, 35, 21);

    // 3. Dispatch (信号调度室): x: 22..38, z: 2..11
    fillRect(22, 2, 38, 11, T_FLOOR);

    // 4. Substation (旧变电间): x: 2..20, z: 21..35 (separated from corridor by x=21 wall)
    fillRect(2, 21, 20, 35, T_FLOOR);
    // Two high-voltage transformer blocks well clear of center (11,29) & doorways
    addPillar(5, 25, 6, 25);
    addPillar(16, 25, 17, 25);

    // 5. Tunnel (废弃应急通道): x: 22..40, z: 26..35
    fillRect(22, 26, 40, 35, T_FLOOR);

    // 6. Platform 0 (0号站台铁轨): x: 42..53, z: 3..35
    fillRect(42, 3, 48, 35, T_PLATFORM); // walkable concrete platform
    fillRect(49, 3, 49, 35, T_HAZARD);   // yellow-black hazard edge (walkable!)
    fillRect(50, 3, 53, 35, T_RAIL);     // recessed rail trench for Ghost Train

    // --- Wide Doorways (every single doorway is 4 tiles wide >= 3 tiles!) ---
    // Concourse <-> Corridor (x=20..21, z=14..17)
    fillRect(20, 14, 21, 17, T_FLOOR);
    // Concourse <-> Substation (x=8..11, z=19..20)
    fillRect(8, 19, 11, 20, T_FLOOR);
    // Corridor <-> Dispatch (TWO wide 4-tile doorways for flanking!)
    fillRect(25, 12, 28, 12, T_FLOOR);
    fillRect(33, 12, 36, 12, T_FLOOR);
    // Corridor <-> Tunnel (x=28..31, z=25)
    fillRect(28, 25, 31, 25, T_FLOOR);
    // Substation <-> Tunnel (x=21, z=29..32)
    fillRect(21, 29, 21, 32, T_FLOOR);
    // Corridor <-> Platform 0 (x=41, z=17..20)
    fillRect(41, 17, 41, 20, T_PLATFORM);
    // Tunnel <-> Platform 0 (x=41, z=29..32)
    fillRect(41, 29, 41, 32, T_FLOOR);
  })();

  /* --------------------------------------------------------------------------
   * Precomputed Merged Horizontal Wall Runs (Low Draw Calls)
   * -------------------------------------------------------------------------- */
  function isNeonWallCell(gx, gz) {
    if (grid[gz][gx] !== T_WALL) return false;
    // Emergency directional neon stripes along key subway walls facing walkable corridors
    if (gz === 12 && gx >= 21 && gx <= 40) return true;   // Dispatch/Corridor wall
    if (gz === 25 && gx >= 21 && gx <= 40) return true;   // Corridor/Tunnel wall
    if (gx === 41 && gz >= 13 && gz <= 33) return true;   // Platform 0 gateway wall
    if (gz === 1 && gx >= 6 && gx <= 15) return true;     // Concourse north signage wall
    if (gz === 1 && gx >= 26 && gx <= 34) return true;    // Dispatch north wall
    if (gz === 19 && gx >= 13 && gx <= 18) return true;   // Concourse south directional strip
    if (pillarMask[gz][gx] === 1) return false;
    return false;
  }

  function hasAdjacentNonWall(gx, gz) {
    for (var dz = -1; dz <= 1; dz++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dz === 0) continue;
        var nx = gx + dx;
        var nz = gz + dz;
        if (nx >= 0 && nx < GRID_W && nz >= 0 && nz < GRID_H) {
          if (grid[nz][nx] !== T_WALL) return true;
        }
      }
    }
    return false;
  }

  var mergedWalls = (function buildMergedWalls() {
    var list = [];
    for (var gz = 0; gz < GRID_H; gz++) {
      var gx = 0;
      while (gx < GRID_W) {
        if (grid[gz][gx] !== T_WALL || !hasAdjacentNonWall(gx, gz)) {
          gx++;
          continue;
        }
        var isPillar = pillarMask[gz][gx] === 1;
        var neon = isNeonWallCell(gx, gz);
        var h = isPillar ? 2.6 : 3.2;
        var startX = gx;
        gx++;
        while (
          gx < GRID_W &&
          grid[gz][gx] === T_WALL &&
          hasAdjacentNonWall(gx, gz) &&
          (pillarMask[gz][gx] === 1) === isPillar &&
          isNeonWallCell(gx, gz) === neon
        ) {
          gx++;
        }
        var runW = gx - startX;
        list.push({
          x: startX + runW * 0.5,
          z: gz + 0.5,
          w: runW * TILE,
          d: TILE,
          h: h,
          neon: neon
        });
      }
    }
    return list;
  })();

  /* --------------------------------------------------------------------------
   * 12 Atmospheric Zone Ceiling & Neon Lights
   * -------------------------------------------------------------------------- */
  var LIGHTS = [
    // Concourse (cold cyan subway fluorescents)
    { x: 7.5,  z: 7.5,  color: '#6fd8ea', intensity: 2.1, distance: 16, flicker: 0.12 },
    { x: 15.5, z: 14.5, color: '#56b8cc', intensity: 1.8, distance: 15, flicker: 0.25 },
    // Corridor (sodium amber & dim warm emergency lamps)
    { x: 25.5, z: 18.5, color: '#d6b274', intensity: 2.0, distance: 16, flicker: 0.08 },
    { x: 36.5, z: 18.5, color: '#e08d58', intensity: 1.9, distance: 16, flicker: 0.18 },
    // Dispatch (CRT emerald-teal + amber switch-lockout warning beacon)
    { x: 30.5, z: 6.5,  color: '#58c4a6', intensity: 2.2, distance: 15, flicker: 0.05 },
    { x: 25.5, z: 5.5,  color: '#ff8a3b', intensity: 1.4, distance: 11, flicker: 0.30 },
    // Substation (ozone blue arc lamps)
    { x: 11.5, z: 28.5, color: '#6fa8ff', intensity: 2.2, distance: 16, flicker: 0.22 },
    { x: 5.5,  z: 32.5, color: '#4b7ee0', intensity: 1.6, distance: 13, flicker: 0.35 },
    // Tunnel (eerie violet maintenance strips)
    { x: 27.5, z: 30.5, color: '#b98ce0', intensity: 1.7, distance: 14, flicker: 0.20 },
    { x: 37.5, z: 30.5, color: '#9b6bd4', intensity: 1.6, distance: 14, flicker: 0.28 },
    // Platform 0 (warning amber & sodium rail-edge flood; threat red reserved for the Inspector)
    { x: 46.5, z: 10.5, color: '#e69c3c', intensity: 2.3, distance: 18, flicker: 0.15 },
    { x: 46.5, z: 26.5, color: '#f0a848', intensity: 2.1, distance: 18, flicker: 0.10 }
  ];

  /* --------------------------------------------------------------------------
   * Interactables: 6 Clues + 2 Track Override Consoles + 1 Extraction Gate
   * -------------------------------------------------------------------------- */
  var INTERACTABLES = [
    // 6 Clues (one per zone, aligned with scenario_station_zero.js)
    {
      id: 'int_clue_concourse',
      type: 'clue',
      x: 5.5,
      z: 10.5,
      zoneId: 'concourse',
      label: '残缺钢印票根',
      clueId: 'clue_ticket_stub',
      overrideValue: 0
    },
    {
      id: 'int_clue_corridor',
      type: 'clue',
      x: 30.5,
      z: 14.5,
      zoneId: 'corridor',
      label: '血字《检票守则残页》',
      clueId: 'clue_inspector_sight',
      overrideValue: 0
    },
    {
      id: 'int_clue_dispatch',
      type: 'clue',
      x: 35.5,
      z: 4.5,
      zoneId: 'dispatch',
      label: '停摆时刻表',
      clueId: 'clue_loop_timetable',
      overrideValue: 0
    },
    {
      id: 'int_clue_substation',
      type: 'clue',
      x: 16.5,
      z: 32.5,
      zoneId: 'substation',
      label: '逆极继电器铭牌',
      clueId: 'clue_relay_polarity',
      overrideValue: 0
    },
    {
      id: 'int_clue_tunnel',
      type: 'clue',
      x: 31.5,
      z: 33.5,
      zoneId: 'tunnel',
      label: '失窃票夹与隐蔽条款',
      clueId: 'clue_shenyan_ledger',
      overrideValue: 0
    },
    {
      id: 'int_clue_platform0',
      type: 'clue',
      x: 47.5,
      z: 27.5,
      zoneId: 'platform0',
      label: '黄线铜牌细则',
      clueId: 'clue_yellow_line_clause',
      overrideValue: 0
    },
    // 2 Track Override Consoles (50% each -> 100% Track Override)
    {
      id: 'int_console_dispatch',
      type: 'console',
      x: 30.5,
      z: 4.5,
      zoneId: 'dispatch',
      label: '信号道岔反转台',
      clueId: 'clue_switch_protocol',
      overrideValue: 50
    },
    {
      id: 'int_console_substation',
      type: 'console',
      x: 5.5,
      z: 31.5,
      zoneId: 'substation',
      label: 'B相逆极高压闸刀',
      clueId: 'clue_relay_polarity',
      overrideValue: 50
    },
    // 1 Extraction Gate at Platform 0
    {
      id: 'int_exit_platform0',
      type: 'exit',
      x: 45.5,
      z: 6.5,
      zoneId: 'platform0',
      label: '0号站台应急脱出闸门',
      clueId: null,
      overrideValue: 0
    }
  ];

  /* --------------------------------------------------------------------------
   * Spatial Queries & Smooth Circle-vs-Wall Collision Sliding
   * -------------------------------------------------------------------------- */
  function isWalkable(gx, gz) {
    var ix = Math.floor(gx);
    var iz = Math.floor(gz);
    if (ix < 0 || ix >= GRID_W || iz < 0 || iz >= GRID_H) return false;
    var t = grid[iz][ix];
    return t === T_FLOOR || t === T_PLATFORM || t === T_HAZARD;
  }

  function isOpaqueWall(gx, gz) {
    var ix = Math.floor(gx);
    var iz = Math.floor(gz);
    if (ix < 0 || ix >= GRID_W || iz < 0 || iz >= GRID_H) return true;
    return grid[iz][ix] === T_WALL;
  }

  function resolveCircleWallCollision(x, z, radius) {
    var r = (typeof radius === 'number' && radius > 0) ? radius : 0.35;
    var cx = Math.max(r, Math.min(GRID_W - r, x));
    var cz = Math.max(r, Math.min(GRID_H - r, z));
    var hit = (cx !== x || cz !== z);
    var r2 = r * r;

    // 3 relaxation passes guarantee clean sliding along corners & concave junctions
    for (var pass = 0; pass < 3; pass++) {
      var minGx = Math.max(0, Math.floor(cx - r) - 1);
      var maxGx = Math.min(GRID_W - 1, Math.floor(cx + r) + 1);
      var minGz = Math.max(0, Math.floor(cz - r) - 1);
      var maxGz = Math.min(GRID_H - 1, Math.floor(cz + r) + 1);
      var moved = false;

      for (var gz = minGz; gz <= maxGz; gz++) {
        for (var gx = minGx; gx <= maxGx; gx++) {
          if (isWalkable(gx, gz)) continue;

          // Closest point on solid tile AABB [gx, gx+1] x [gz, gz+1]
          var closestX = cx < gx ? gx : (cx > gx + 1 ? gx + 1 : cx);
          var closestZ = cz < gz ? gz : (cz > gz + 1 ? gz + 1 : cz);
          var dx = cx - closestX;
          var dz = cz - closestZ;
          var distSq = dx * dx + dz * dz;

          if (distSq < r2) {
            hit = true;
            moved = true;
            if (distSq > 1e-8) {
              var dist = Math.sqrt(distSq);
              var push = r - dist;
              cx += (dx / dist) * push;
              cz += (dz / dist) * push;
            } else {
              // Center penetrated inside tile: push out via nearest face
              var dLeft = cx - gx;
              var dRight = (gx + 1) - cx;
              var dTop = cz - gz;
              var dBottom = (gz + 1) - cz;
              var minD = Math.min(dLeft, dRight, dTop, dBottom);
              if (minD === dLeft) cx = gx - r;
              else if (minD === dRight) cx = gx + 1 + r;
              else if (minD === dTop) cz = gz - r;
              else cz = gz + 1 + r;
            }
          }
        }
      }
      if (!moved) break;
    }

    return { x: cx, z: cz, hit: hit };
  }

  /* --------------------------------------------------------------------------
   * Exact 2D Grid DDA Line-of-Sight (Walls block LOS; rail trench is open)
   * -------------------------------------------------------------------------- */
  function hasLineOfSight(x0, z0, x1, z1) {
    var gx = Math.floor(x0);
    var gz = Math.floor(z0);
    var endGx = Math.floor(x1);
    var endGz = Math.floor(z1);

    if (isOpaqueWall(gx, gz) || isOpaqueWall(endGx, endGz)) return false;
    if (gx === endGx && gz === endGz) return true;

    var dx = x1 - x0;
    var dz = z1 - z0;
    var stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    var stepZ = dz > 0 ? 1 : (dz < 0 ? -1 : 0);

    var tDeltaX = stepX !== 0 ? Math.abs(1.0 / dx) : 1e9;
    var tDeltaZ = stepZ !== 0 ? Math.abs(1.0 / dz) : 1e9;

    var tMaxX = stepX > 0 ? (gx + 1 - x0) * tDeltaX : (stepX < 0 ? (x0 - gx) * tDeltaX : 1e9);
    var tMaxZ = stepZ > 0 ? (gz + 1 - z0) * tDeltaZ : (stepZ < 0 ? (z0 - gz) * tDeltaZ : 1e9);

    var maxSteps = GRID_W + GRID_H + 8;
    for (var i = 0; i < maxSteps; i++) {
      if (tMaxX < tMaxZ) {
        tMaxX += tDeltaX;
        gx += stepX;
      } else if (tMaxZ < tMaxX) {
        tMaxZ += tDeltaZ;
        gz += stepZ;
      } else {
        // Exact corner crossing: check both orthogonal cells to avoid corner peeking
        if (isOpaqueWall(gx + stepX, gz) || isOpaqueWall(gx, gz + stepZ)) return false;
        tMaxX += tDeltaX;
        tMaxZ += tDeltaZ;
        gx += stepX;
        gz += stepZ;
      }
      if (isOpaqueWall(gx, gz)) return false;
      if (gx === endGx && gz === endGz) return true;
    }
    return true;
  }

  /* --------------------------------------------------------------------------
   * Fast A* Pathfinding (8-dir, No Corner-Cutting, Wall-Clearance Bias)
   * -------------------------------------------------------------------------- */
  var TOTAL_CELLS = GRID_W * GRID_H;
  var aStarG = new Float32Array(TOTAL_CELLS);
  var aStarF = new Float32Array(TOTAL_CELLS);
  var aStarFrom = new Int32Array(TOTAL_CELLS);
  var aStarClosed = new Uint8Array(TOTAL_CELLS);
  var aStarInOpen = new Uint8Array(TOTAL_CELLS);

  // Precompute subtle wall-adjacency penalty so AI stays centered in corridors
  var wallPenalty = new Float32Array(TOTAL_CELLS);
  (function buildWallPenalty() {
    for (var z = 0; z < GRID_H; z++) {
      for (var x = 0; x < GRID_W; x++) {
        var pen = 0;
        if (!isWalkable(x - 1, z) || !isWalkable(x + 1, z) || !isWalkable(x, z - 1) || !isWalkable(x, z + 1)) {
          pen = 0.22;
        }
        wallPenalty[z * GRID_W + x] = pen;
      }
    }
  })();

  function snapToNearestWalkable(gx, gz) {
    if (isWalkable(gx, gz)) return { x: gx, z: gz };
    for (var rad = 1; rad <= 5; rad++) {
      for (var dz = -rad; dz <= rad; dz++) {
        for (var dx = -rad; dx <= rad; dx++) {
          if (Math.abs(dx) !== rad && Math.abs(dz) !== rad) continue;
          if (isWalkable(gx + dx, gz + dz)) {
            return { x: gx + dx, z: gz + dz };
          }
        }
      }
    }
    return null;
  }

  function hasClearWalkLOS(x0, z0, x1, z1) {
    // Check center + 4 parallel clearance offsets so smoothed paths never brush walls/rail edge
    var dx = x1 - x0;
    var dz = z1 - z0;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.05) return true;
    var steps = Math.ceil(dist * 3);
    var nx = (-dz / dist) * 0.34;
    var nz = (dx / dist) * 0.34;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var px = x0 + dx * t;
      var pz = z0 + dz * t;
      if (!isWalkable(px, pz)) return false;
      if (!isWalkable(px + nx, pz + nz)) return false;
      if (!isWalkable(px - nx, pz - nz)) return false;
    }
    return true;
  }

  var DIRS = [
    [1, 0, 1.0],
    [-1, 0, 1.0],
    [0, 1, 1.0],
    [0, -1, 1.0],
    [1, 1, 1.4142],
    [1, -1, 1.4142],
    [-1, 1, 1.4142],
    [-1, -1, 1.4142]
  ];

  function findPath(x0, z0, x1, z1) {
    var start = snapToNearestWalkable(Math.floor(x0), Math.floor(z0));
    var goal = snapToNearestWalkable(Math.floor(x1), Math.floor(z1));
    if (!start || !goal) return [];

    if (start.x === goal.x && start.z === goal.z) {
      return [{ x: goal.x + 0.5, z: goal.z + 0.5 }];
    }

    var startIdx = start.z * GRID_W + start.x;
    var goalIdx = goal.z * GRID_W + goal.x;

    aStarG.fill(1e9);
    aStarFrom.fill(-1);
    aStarClosed.fill(0);
    aStarInOpen.fill(0);

    // Binary min-heap of cell indices ordered by aStarF[idx]
    var heap = [];
    function heapPush(idx) {
      heap.push(idx);
      var i = heap.length - 1;
      while (i > 0) {
        var p = (i - 1) >> 1;
        if (aStarF[heap[i]] >= aStarF[heap[p]]) break;
        var tmp = heap[i];
        heap[i] = heap[p];
        heap[p] = tmp;
        i = p;
      }
    }
    function heapPop() {
      var top = heap[0];
      var last = heap.pop();
      if (heap.length > 0) {
        heap[0] = last;
        var i = 0;
        var len = heap.length;
        while (true) {
          var l = (i << 1) + 1;
          var r = l + 1;
          var smallest = i;
          if (l < len && aStarF[heap[l]] < aStarF[heap[smallest]]) smallest = l;
          if (r < len && aStarF[heap[r]] < aStarF[heap[smallest]]) smallest = r;
          if (smallest === i) break;
          var tmp = heap[i];
          heap[i] = heap[smallest];
          heap[smallest] = tmp;
          i = smallest;
        }
      }
      return top;
    }

    aStarG[startIdx] = 0;
    var h0 = Math.abs(goal.x - start.x) + Math.abs(goal.z - start.z);
    aStarF[startIdx] = h0;
    aStarInOpen[startIdx] = 1;
    heapPush(startIdx);

    var found = false;
    while (heap.length > 0) {
      var curr = heapPop();
      if (aStarClosed[curr]) continue;
      if (curr === goalIdx) {
        found = true;
        break;
      }
      aStarClosed[curr] = 1;

      var cx = curr % GRID_W;
      var cz = (curr - cx) / GRID_W;
      var baseG = aStarG[curr];

      for (var d = 0; d < 8; d++) {
        var dx = DIRS[d][0];
        var dz = DIRS[d][1];
        var nx = cx + dx;
        var nz = cz + dz;
        if (!isWalkable(nx, nz)) continue;

        // Prevent diagonal corner cutting!
        if (dx !== 0 && dz !== 0) {
          if (!isWalkable(cx + dx, cz) || !isWalkable(cx, cz + dz)) continue;
        }

        var nIdx = nz * GRID_W + nx;
        if (aStarClosed[nIdx]) continue;

        var tentativeG = baseG + DIRS[d][2] + wallPenalty[nIdx];
        if (tentativeG < aStarG[nIdx]) {
          aStarFrom[nIdx] = curr;
          aStarG[nIdx] = tentativeG;
          // Octile heuristic
          var adx = Math.abs(goal.x - nx);
          var adz = Math.abs(goal.z - nz);
          var h = (adx + adz) + (1.4142 - 2.0) * (adx < adz ? adx : adz);
          aStarF[nIdx] = tentativeG + h;
          aStarInOpen[nIdx] = 1;
          heapPush(nIdx);
        }
      }
    }

    if (!found) return [];

    // Reconstruct raw world-center path (excluding start cell so entity moves immediately)
    var raw = [];
    var cur = goalIdx;
    while (cur !== -1) {
      var rx = cur % GRID_W;
      var rz = (cur - rx) / GRID_W;
      raw.push({ x: rx + 0.5, z: rz + 0.5 });
      if (cur === startIdx) break;
      cur = aStarFrom[cur];
    }
    raw.reverse();

    // Clearance-safe string pulling so squad & Inspector move smoothly without zig-zagging
    if (raw.length <= 2) {
      return raw.length === 2 ? [raw[1]] : raw;
    }

    var smooth = [raw[0]];
    var anchor = 0;
    while (anchor < raw.length - 1) {
      var furthest = anchor + 1;
      for (var probe = raw.length - 1; probe > anchor + 1; probe--) {
        if (hasClearWalkLOS(raw[anchor].x, raw[anchor].z, raw[probe].x, raw[probe].z)) {
          furthest = probe;
          break;
        }
      }
      smooth.push(raw[furthest]);
      anchor = furthest;
    }

    // Drop the initial anchor (caller's current tile) so first waypoint is next target
    if (smooth.length > 1) smooth.shift();
    return smooth;
  }

  /* --------------------------------------------------------------------------
   * Zone Lookup & Accessors
   * -------------------------------------------------------------------------- */
  function getZoneAt(x, z) {
    if (x >= 41.5) return 'platform0';
    if (x < 21.0) {
      return z < 19.5 ? 'concourse' : 'substation';
    }
    if (z < 12.5) return 'dispatch';
    if (z >= 25.5) return 'tunnel';
    return 'corridor';
  }

  function getZoneCenter(zoneId) {
    var z = ZONES[zoneId] || ZONES.concourse;
    return { x: z.cx + 0.5, z: z.cz + 0.5 };
  }

  function getGrid() {
    return grid;
  }

  function getWalls() {
    return mergedWalls;
  }

  function getLights() {
    return LIGHTS;
  }

  function getInteractables() {
    return INTERACTABLES;
  }

  INFINITY.StationMap = {
    GRID_W: GRID_W,
    GRID_H: GRID_H,
    ZONES: ZONES,
    isWalkable: isWalkable,
    resolveCircleWallCollision: resolveCircleWallCollision,
    hasLineOfSight: hasLineOfSight,
    findPath: findPath,
    getZoneAt: getZoneAt,
    getZoneCenter: getZoneCenter,
    getGrid: getGrid,
    getWalls: getWalls,
    getLights: getLights,
    getInteractables: getInteractables
  };
})(typeof window !== 'undefined' ? window : globalThis);
