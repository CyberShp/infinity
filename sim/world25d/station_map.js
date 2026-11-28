/* ============================================================================
 * Infinity 2.5D HD-2D Engine — Station Zero Seamless 224x152 Mega-Subway Map
 * 4x Expansion over 112x76 (34,048 m²): 6 Monumental Interconnected Zones,
 * Multi-Bay Colonnades, Waist-High Tactical Cover Barricades, Multi-Route
 * Flanking Corridors, Smooth Circle-AABB Sliding, DDA LOS & Stamp-Cached A*
 * Attaches cleanly to window.INFINITY.StationMap
 * ============================================================================ */
(function (global) {
  'use strict';
  var INFINITY = (global.INFINITY = global.INFINITY || {});

  var GRID_W = 224;
  var GRID_H = 152;
  var TILE = 1.0;

  // Canonical spatial anchors (exported so Engine25D, SceneArchitect, and tests stay fully dynamic)
  var PLATFORM_START_X = 168;
  var HAZARD_X = 207;
  var RAIL_MIN_X = 208;
  var RAIL_MAX_X = 219;
  var TRAIN_X = 213.5;

  // Tile type constants:
  // 0 = floor_slate (walkable)
  // 1 = wall / pillar / tactical cover (solid, blocks movement)
  // 2 = floor_platform (walkable)
  // 3 = floor_hazard (walkable Platform 0 warning edge)
  // 4 = floor_rail (recessed Ghost Train trench — blocks movement, open LOS)
  var T_FLOOR = 0;
  var T_WALL = 1;
  var T_PLATFORM = 2;
  var T_HAZARD = 3;
  var T_RAIL = 4;

  // Zone colors are sourced from INFINITY.ArtTokens.ZONES (single source of truth).
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
    concourse:  { id: 'concourse',  name: 'B1 检票大厅',   code: 'Z-01', cx: 41,  cz: 37,  color: resolveZoneColor('concourse') },
    corridor:   { id: 'corridor',   name: 'B2 换乘长廊',   code: 'Z-02', cx: 122, cz: 74,  color: resolveZoneColor('corridor') },
    dispatch:   { id: 'dispatch',   name: '信号调度室',    code: 'Z-03', cx: 122, cz: 24,  color: resolveZoneColor('dispatch') },
    substation: { id: 'substation', name: '旧变电间',      code: 'Z-04', cx: 41,  cz: 110, color: resolveZoneColor('substation') },
    tunnel:     { id: 'tunnel',     name: '废弃应急通道',  code: 'Z-05', cx: 122, cz: 124, color: resolveZoneColor('tunnel') },
    platform0:  { id: 'platform0',  name: '0号站台铁轨',   code: 'Z-06', cx: 188, cz: 74,  color: resolveZoneColor('platform0') }
  };

  // Canonical interior zone rectangles exported for SceneArchitect procedural dressing & cover generation
  var ZONE_BOUNDS = {
    concourse:  { x0: 4,   z0: 4,   x1: 78,  z1: 70 },
    corridor:   { x0: 84,  z0: 50,  x1: 160, z1: 98 },
    dispatch:   { x0: 84,  z0: 4,   x1: 160, z1: 44 },
    substation: { x0: 4,   z0: 76,  x1: 78,  z1: 144 },
    tunnel:     { x0: 84,  z0: 104, x1: 160, z1: 144 },
    platform0:  { x0: 168, z0: 6,   x1: 206, z1: 144 }
  };

  // 21 Architectural Sub-Zones dividing the 6 grand sectors into unmistakable functional rooms & wings
  var SUBZONES = [
    // Z-01 B1 检票大厅 (4 sub-zones)
    { id: 'concourse_ticket_lobby', zoneId: 'concourse',  code: 'Z-01A', name: '北部购票闸口厅', x0: 4,   z0: 4,   x1: 78,  z1: 20,  cx: 41,  cz: 16,  style: 'ticket_lobby' },
    { id: 'concourse_security_bay', zoneId: 'concourse',  code: 'Z-01C', name: '西侧安检行李区', x0: 4,   z0: 21,  x1: 22,  z1: 70,  cx: 14,  cz: 40,  style: 'security_bay' },
    { id: 'concourse_east_lounge',  zoneId: 'concourse',  code: 'Z-01D', name: '东侧商业候车廊', x0: 60,  z0: 21,  x1: 78,  z1: 70,  cx: 67,  cz: 40,  style: 'lounge_kiosk' },
    { id: 'concourse_clock_atrium', zoneId: 'concourse',  code: 'Z-01B', name: '中央时钟中庭',   x0: 23,  z0: 21,  x1: 59,  z1: 70,  cx: 41,  cz: 37,  style: 'clock_atrium' },

    // Z-02 B2 换乘长廊 (5 sub-zones)
    { id: 'corridor_west_gate',     zoneId: 'corridor',   code: 'Z-02A', name: '西段换乘闸口',   x0: 84,  z0: 50,  x1: 104, z1: 98,  cx: 92,  cz: 74,  style: 'transfer_gate' },
    { id: 'corridor_north_gallery', zoneId: 'corridor',   code: 'Z-02B', name: '北侧泥污灯箱廊', x0: 105, z0: 50,  x1: 141, z1: 62,  cx: 122, cz: 55,  style: 'ad_gallery' },
    { id: 'corridor_south_gallery', zoneId: 'corridor',   code: 'Z-02D', name: '南侧卷帘商业廊', x0: 105, z0: 86,  x1: 141, z1: 98,  cx: 122, cz: 92,  style: 'shop_gallery' },
    { id: 'corridor_east_approach', zoneId: 'corridor',   code: 'Z-02E', name: '东段站台前导厅', x0: 142, z0: 50,  x1: 160, z1: 98,  cx: 151, cz: 74,  style: 'platform_approach' },
    { id: 'corridor_central_hub',   zoneId: 'corridor',   code: 'Z-02C', name: '中枢换乘十字厅', x0: 105, z0: 63,  x1: 141, z1: 85,  cx: 122, cz: 74,  style: 'transfer_hub' },

    // Z-03 信号调度室 (4 sub-zones)
    { id: 'dispatch_server_vault',  zoneId: 'dispatch',   code: 'Z-03A', name: '西侧中继服务器库', x0: 84,  z0: 4,   x1: 106, z1: 44,  cx: 95,  cz: 26,  style: 'server_vault' },
    { id: 'dispatch_archive_room',  zoneId: 'dispatch',   code: 'Z-03C', name: '东侧时刻表档案室', x0: 138, z0: 4,   x1: 160, z1: 44,  cx: 149, cz: 16,  style: 'archive_room' },
    { id: 'dispatch_control_deck',  zoneId: 'dispatch',   code: 'Z-03B', name: '中央主调度操作台', x0: 107, z0: 4,   x1: 137, z1: 30,  cx: 122, cz: 19,  style: 'control_deck' },
    { id: 'dispatch_obs_gallery',   zoneId: 'dispatch',   code: 'Z-03D', name: '南侧防爆玻璃观测廊', x0: 107, z0: 31,  x1: 137, z1: 44,  cx: 122, cz: 37,  style: 'obs_gallery' },

    // Z-04 旧变电间 (4 sub-zones)
    { id: 'substation_workshop',    zoneId: 'substation', code: 'Z-04A', name: '北侧工务检修区', x0: 4,   z0: 76,  x1: 78,  z1: 90,  cx: 41,  cz: 83,  style: 'workshop' },
    { id: 'substation_switchgear',  zoneId: 'substation', code: 'Z-04B', name: '西侧高压开关柜廊', x0: 4,   z0: 91,  x1: 26,  z1: 144, cx: 14,  cz: 116, style: 'switchgear' },
    { id: 'substation_cooling_bay', zoneId: 'substation', code: 'Z-04D', name: '东侧冷却电容间', x0: 56,  z0: 91,  x1: 78,  z1: 144, cx: 68,  cz: 116, style: 'cooling_bay' },
    { id: 'substation_transformer', zoneId: 'substation', code: 'Z-04C', name: '中央变压器主厅', x0: 27,  z0: 91,  x1: 55,  z1: 144, cx: 41,  cz: 110, style: 'transformer_hall' },

    // Z-05 废弃应急通道 (4 sub-zones)
    { id: 'tunnel_pipe_gallery',    zoneId: 'tunnel',     code: 'Z-05A', name: '北侧高压管廊道', x0: 84,  z0: 104, x1: 160, z1: 123, cx: 122, cz: 114, style: 'pipe_gallery' },
    { id: 'tunnel_valve_chamber',   zoneId: 'tunnel',     code: 'Z-05B', name: '西侧蓄水阀门室', x0: 84,  z0: 124, x1: 106, z1: 144, cx: 95,  cz: 134, style: 'valve_chamber' },
    { id: 'tunnel_culvert_alcove',  zoneId: 'tunnel',     code: 'Z-05C', name: '中央暗格排水渠', x0: 107, z0: 124, x1: 138, z1: 144, cx: 122, cz: 134, style: 'culvert_alcove' },
    { id: 'tunnel_bulkhead_east',   zoneId: 'tunnel',     code: 'Z-05D', name: '东侧防爆检修口', x0: 139, z0: 124, x1: 160, z1: 144, cx: 149, cz: 134, style: 'bulkhead_east' },

    // Z-06 0号站台铁轨 (3 walkable platform bays; rail trench is x: 208..219)
    { id: 'platform0_north_exit',   zoneId: 'platform0',  code: 'Z-06A', name: '北段应急脱出站厅', x0: 168, z0: 6,   x1: 207, z1: 44,  cx: 188, cz: 26,  style: 'north_terminal' },
    { id: 'platform0_central_bay',  zoneId: 'platform0',  code: 'Z-06B', name: '中段零号候车月台', x0: 168, z0: 45,  x1: 207, z1: 102, cx: 188, cz: 74,  style: 'boarding_bay' },
    { id: 'platform0_south_freight',zoneId: 'platform0',  code: 'Z-06C', name: '南段货运信号端',   x0: 168, z0: 103, x1: 207, z1: 144, cx: 188, cz: 124, style: 'freight_end' }
  ];

  /* --------------------------------------------------------------------------
   * Build 224x152 Mega-Station Grid Layout (4.0x Area of 112x76 -> 34,048 m²)
   * pillarMask: 0 = full wall (3.2m), 1 = structural pillar (2.6m),
   *             2 = waist-high tactical cover barricade (1.25m, open sightlines!),
   *             3 = architectural glazed/framed interior partition (2.35m, open sightlines!)
   * -------------------------------------------------------------------------- */
  var grid = [];
  var pillarMask = [];

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
            if (val !== T_WALL) pillarMask[zz][xx] = 0;
          }
        }
      }
    }

    function addWall(x0, z0, x1, z1) {
      for (var zz = z0; zz <= z1; zz++) {
        for (var xx = x0; xx <= x1; xx++) {
          if (xx >= 0 && xx < GRID_W && zz >= 0 && zz < GRID_H) {
            grid[zz][xx] = T_WALL;
            pillarMask[zz][xx] = 0;
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

    function addCover(x0, z0, x1, z1) {
      for (var zz = z0; zz <= z1; zz++) {
        for (var xx = x0; xx <= x1; xx++) {
          grid[zz][xx] = T_WALL;
          pillarMask[zz][xx] = 2;
        }
      }
    }

    function addPartition(x0, z0, x1, z1) {
      for (var zz = z0; zz <= z1; zz++) {
        for (var xx = x0; xx <= x1; xx++) {
          if (xx >= 0 && xx < GRID_W && zz >= 0 && zz < GRID_H) {
            grid[zz][xx] = T_WALL;
            pillarMask[zz][xx] = 3;
          }
        }
      }
    }

    // 1. Concourse (B1 检票大厅): x: 4..78, z: 4..70 (partitioned into 4 distinct sub-zones)
    fillRect(4, 4, 78, 70, T_FLOOR);

    // Z-01A North Ticket Checkpoint Glazed Partition (z=21) with 3 wide turnstile gateways
    addPartition(4, 21, 14, 21);
    addPartition(23, 21, 35, 21);
    addPartition(47, 21, 59, 21);
    addPartition(68, 21, 78, 21);
    // Staffed Glass Ticket Office Booth inside North Ticket Lobby (leaves wide corridor behind & front)
    addPartition(38, 11, 44, 13);

    // Z-01C West Security & Baggage Bay Glazed Partition (x=22) with 3 wide portals (z=30..36, 47..53, 63..67)
    addPartition(22, 22, 22, 29);
    addPartition(22, 37, 22, 46);
    addPartition(22, 54, 22, 62);
    addPartition(22, 68, 22, 70);
    // Solid X-ray baggage scanner beds inside West Security Bay (clear of clue at 18.5, 40.5)
    addCover(10, 31, 13, 32);
    addCover(10, 48, 13, 49);

    // Z-01D East Passenger Lounge & Kiosk Wing Partition (x=60) with 3 wide portals
    addPartition(60, 22, 60, 29);
    addPartition(60, 37, 60, 46);
    addPartition(60, 54, 60, 62);
    addPartition(60, 68, 60, 70);
    // Shuttered Metro Convenience Kiosk / Newsstand booths along East Lounge wall
    addPartition(73, 27, 76, 32);
    addPartition(73, 40, 76, 45);

    // Z-01B Central B1 Concourse — Authentic Real-World Asymmetric Subway Layout around spawn (41.5, 37.5)
    addPillar(26, 25, 27, 25);
    addPillar(55, 25, 56, 25);
    addPillar(26, 51, 27, 51);
    addPillar(55, 51, 56, 51);
    addPillar(18, 13, 19, 13);
    addPillar(63, 13, 64, 13);
    // NW Recessed TVM Wall Alcove & Beefy 2x2 East Ceramic-Tiled Subway Structural Pier
    addWall(29, 27, 35, 27);
    addPillar(46, 30, 47, 31);
    addPillar(33, 45, 33, 45);
    addPillar(48, 45, 48, 45);
    // West Customer Service Center Booth, East Sunken B2 Escalator Shaft & Shuttered Convenience Store
    addPartition(30, 35, 32, 39);
    addPartition(49, 32, 52, 35);
    addPartition(49, 37, 51, 40);
    // Atrium Security X-Ray Scanner Bed beside Service Center + South Concourse Tactical Benches/Covers
    addCover(33, 32, 34, 33);
    addCover(30, 45, 32, 45);
    addCover(50, 45, 52, 45);
    addCover(27, 62, 29, 62);
    addCover(53, 62, 55, 62);
    addCover(65, 33, 67, 33);
    addCover(65, 48, 67, 48);

    // 2. Corridor (B2 换乘长廊): x: 84..160, z: 50..98 (partitioned into Central Hub + North/South Galleries + West/East Gates)
    fillRect(84, 50, 160, 98, T_FLOOR);
    // Preserve test pillar at (94..95, 62) and frame North & South Galleries with glazed ad-wall dividers
    addPillar(94, 62, 95, 62);
    addPillar(94, 86, 95, 86);
    addPartition(106, 62, 114, 62);
    addPillar(115, 62, 116, 62);
    addPartition(129, 62, 137, 62);
    addPillar(138, 62, 139, 62);
    addPillar(149, 62, 150, 62);

    addPartition(106, 86, 114, 86);
    addPillar(115, 86, 116, 86);
    addPartition(129, 86, 137, 86);
    addPillar(138, 86, 139, 86);
    addPillar(149, 86, 150, 86);

    // West & East checkpoint wing jambs demarcating Z-02A / Z-02C / Z-02E
    addWall(104, 50, 104, 54);
    addWall(104, 94, 104, 98);
    addWall(142, 50, 142, 54);
    addWall(142, 94, 142, 98);

    // Tactical waist-high boulevard cover islands & shop counters
    addCover(101, 69, 103, 69);
    addCover(141, 69, 143, 69);
    addCover(101, 79, 103, 79);
    addCover(141, 79, 143, 79);
    addCover(115, 56, 116, 56);
    addCover(128, 56, 129, 56);
    addCover(115, 92, 116, 92);
    addCover(128, 92, 129, 92);
    addCover(89, 73, 90, 75);
    addCover(154, 73, 155, 75);

    // 3. Dispatch (信号调度室): x: 84..160, z: 4..44 (partitioned into West Server Vault, Central Control Deck, East Archive, South Obs Gallery)
    fillRect(84, 4, 160, 44, T_FLOOR);

    // Z-03A West Server Vault Bulkhead Wall (x=106) with wide 8-tile doors at z=11..18 & z=28..35
    addWall(106, 4, 106, 10);
    addWall(106, 19, 106, 27);
    addWall(106, 36, 106, 44);
    // Server vault aisle rack footprints (clear of radar_tower at 92.5, 34.5)
    addCover(90, 12, 91, 18);
    addCover(98, 12, 99, 18);

    // Z-03C East Timetable Archive Glazed Partition Wall (x=138) with wide 8-tile doors at z=11..18 & z=28..35
    addPartition(138, 4, 138, 10);
    addPartition(138, 19, 138, 27);
    addPartition(138, 36, 138, 44);
    // Central illuminated Railway Map Table inside East Archive (clear of clue at 150.5, 13.5 & east doorway)
    addCover(147, 23, 151, 25);

    // Z-03B Central Master Control Deck Blast-Glass Observation Partition (z=30) with twin 6-tile entryways
    addPartition(113, 30, 131, 30);
    addPillar(112, 20, 113, 20);
    addPillar(131, 20, 132, 20);
    // Flanking curved operator console desks inside Control Deck (clear of console at 122.5, 11.5)
    addCover(114, 14, 117, 15);
    addCover(127, 14, 130, 15);
    addCover(121, 36, 123, 36);

    // 4. Substation (旧变电间): x: 4..78, z: 76..144 (partitioned into North Workshop, West Switchgear, Central Transformer Hall, East Cooling Bay)
    fillRect(4, 76, 78, 144, T_FLOOR);

    // Z-04A North Workshop Safety Divider (z=90) with 3 wide vehicle/equipment bays
    addCover(6, 90, 15, 90);
    addCover(29, 90, 36, 90);
    addCover(46, 90, 53, 90);
    addCover(67, 90, 76, 90);

    // Z-04B West HV Switchgear Bulkhead Partition (x=26) with 3 wide bays (z=98..105, 115..122, 132..139)
    addWall(26, 91, 26, 97);
    addPartition(26, 106, 26, 114);
    addWall(26, 123, 26, 131);
    addWall(26, 140, 26, 144);

    // Z-04D East Cooling & Capacitor Bulkhead Partition (x=56) with 3 wide bays
    addWall(56, 91, 56, 97);
    addPartition(56, 106, 56, 114);
    addWall(56, 123, 56, 131);
    addWall(56, 140, 56, 144);

    // 6 heavy 2x2 high-voltage transformer blocks (3x2 turbine hall array)
    addPillar(18, 94, 19, 95);
    addPillar(40, 94, 41, 95);
    addPillar(62, 94, 63, 95);
    addPillar(18, 124, 19, 125);
    addPillar(40, 124, 41, 125);
    addPillar(62, 124, 63, 125);
    // Tactical waist-high breaker cover barriers inside central hall & workshop
    addCover(31, 102, 33, 102);
    addCover(49, 102, 51, 102);
    addCover(31, 117, 33, 117);
    addCover(49, 117, 51, 117);
    addCover(10, 109, 11, 110);
    addCover(71, 109, 72, 110);
    addCover(31, 134, 33, 134);
    addCover(49, 134, 51, 134);

    // 5. Tunnel (废弃应急通道): x: 84..160, z: 104..144 (carved into twin parallel maintenance galleries + 3 vaulted chambers)
    fillRect(84, 104, 160, 144, T_FLOOR);

    // Central Concrete Tunnel Spine Bulkhead (z=124) splitting North Pipe Gallery from South Chambers
    // Leaves open vestibules at x=84..87 & x=157..160 plus 3 wide 8-tile cross-passages!
    addWall(88, 124, 96, 124);
    addWall(105, 124, 118, 124);
    addWall(127, 124, 139, 124);
    addWall(148, 124, 156, 124);

    // South Chamber Bulkhead Dividers (x=106 & x=138, z=125..144) with 8-tile arched passages (z=130..137)
    addWall(106, 125, 106, 129);
    addWall(106, 138, 106, 144);
    addWall(138, 125, 138, 129);
    addWall(138, 138, 138, 144);

    // Tactical maintenance cover barricades along North Pipe Gallery & South Alcove
    addCover(102, 113, 104, 113);
    addCover(121, 113, 123, 113);
    addCover(140, 113, 142, 113);
    addCover(113, 136, 115, 136);
    addCover(129, 136, 131, 136);

    // 6. Platform 0 (0号站台铁轨): x: 168..219, z: 6..144 (partitioned into North Exit Terminal, Central Boarding Bay, South Freight End)
    fillRect(PLATFORM_START_X, 6, HAZARD_X - 1, 144, T_PLATFORM); // 39m-wide walkable concrete esplanade (x: 168..206)
    fillRect(HAZARD_X, 6, HAZARD_X, 144, T_HAZARD);               // yellow-black hazard strip (x: 207, walkable!)
    fillRect(RAIL_MIN_X, 6, RAIL_MAX_X, 144, T_RAIL);             // recessed 12m rail trench (x: 208..219)

    // Z-06A North Terminal Glazed Divider (z=44) + Stationmaster Booth (clear of exit gate 190.5, 16.5)
    addPartition(182, 44, 194, 44);
    addPartition(171, 13, 175, 17);

    // Z-06C South Freight Divider (z=103)
    addCover(182, 103, 194, 103);

    // Monumental Platform 0 colonnade of 7 reinforced pillars along x=178..179
    var platPilZ = [20, 38, 56, 74, 92, 110, 128];
    for (var pi = 0; pi < platPilZ.length; pi++) {
      addPillar(178, platPilZ[pi], 179, platPilZ[pi]);
    }
    // Glazed Waiting Shelter backings in Central Boarding Bay (x=186..187)
    addPartition(186, 53, 186, 55);
    addPartition(186, 91, 186, 93);
    // Staggered waist-high tactical boarding cover barricades along x=194..195 (wide 11m Boss esplanade stays clear east!)
    var platCovZ = [29, 49, 65, 83, 101, 119, 135];
    for (var pci = 0; pci < platCovZ.length; pci++) {
      addCover(194, platCovZ[pci], 195, platCovZ[pci]);
    }

    // --- Wide Multi-Route Doorways (every gateway is 7-15 tiles wide for fluid squad & Boss movement!) ---
    // Concourse <-> Corridor (x=79..83, z=54..66 — 13 tiles wide)
    fillRect(79, 54, 83, 66, T_FLOOR);
    // Concourse <-> Substation (main central 15-tile hall + west service bypass)
    fillRect(34, 71, 48, 75, T_FLOOR);
    fillRect(14, 71, 20, 75, T_FLOOR);
    // Corridor <-> Dispatch (TWO wide 11-tile gateways for tactical flanking!)
    fillRect(94, 45, 104, 49, T_FLOOR);
    fillRect(138, 45, 148, 49, T_FLOOR);
    // Corridor <-> Tunnel (TWO wide 11-tile gateways!)
    fillRect(94, 99, 104, 103, T_FLOOR);
    fillRect(138, 99, 148, 103, T_FLOOR);
    // Substation <-> Tunnel (x=79..83, z=116..128 — 13 tiles wide)
    fillRect(79, 116, 83, 128, T_FLOOR);
    // Dispatch <-> Platform 0 (north overlook passage: x=161..167, z=18..28 — 11 tiles wide)
    fillRect(161, 18, 167, 28, T_PLATFORM);
    // Corridor <-> Platform 0 (grand central concourse gate: x=161..167, z=68..80 — 13 tiles wide)
    fillRect(161, 68, 167, 80, T_PLATFORM);
    // Tunnel <-> Platform 0 (south underpass: x=161..167, z=118..128 — 11 tiles wide)
    fillRect(161, 118, 167, 128, T_FLOOR);
  })();

  /* --------------------------------------------------------------------------
   * Precomputed Merged Horizontal Wall Runs (Low Draw Calls)
   * -------------------------------------------------------------------------- */
  function isNeonWallCell(gx, gz) {
    if (grid[gz][gx] !== T_WALL) return false;
    if (pillarMask[gz][gx] !== 0) return false;
    if ((gz === 45 || gz === 49) && gx >= 84 && gx <= 160) return true;   // Dispatch/Corridor divider
    if ((gz === 99 || gz === 103) && gx >= 84 && gx <= 160) return true;  // Corridor/Tunnel divider
    if ((gx === 161 || gx === 167) && gz >= 29 && gz <= 117) return true; // Platform 0 gateway wall
    if (gz === 3 && gx >= 22 && gx <= 60) return true;                    // Concourse north signage wall
    if (gz === 3 && gx >= 102 && gx <= 142) return true;                  // Dispatch north command wall
    if (gz === 71 && gx >= 52 && gx <= 76) return true;                   // Concourse south directional strip
    if (gx === 83 && gz >= 52 && gz <= 96) return true;                   // Corridor west transition wall
    if (gz === 124 && gx >= 88 && gx <= 156) return true;                 // Tunnel spine directional beacon band
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
        var pMask = pillarMask[gz][gx];
        var neon = isNeonWallCell(gx, gz);
        var h = pMask === 2 ? 1.25 : (pMask === 3 ? 2.35 : (pMask === 1 ? 2.6 : 3.2));
        var startX = gx;
        gx++;
        while (
          gx < GRID_W &&
          grid[gz][gx] === T_WALL &&
          hasAdjacentNonWall(gx, gz) &&
          pillarMask[gz][gx] === pMask &&
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
          neon: neon,
          cover: pMask === 2,
          partition: pMask === 3
        });
      }
    }
    return list;
  })();

  /* --------------------------------------------------------------------------
   * 72 Atmospheric Zone Ceiling & Neon Lights (Pooled Dynamically by Engine25D)
   * -------------------------------------------------------------------------- */
  var LIGHTS = (function buildZoneLights() {
    var arr = [];
    function addGridLights(xs, zs, colors, intensity, dist, baseFlicker) {
      for (var zi = 0; zi < zs.length; zi++) {
        for (var xi = 0; xi < xs.length; xi++) {
          var idx = zi * xs.length + xi;
          arr.push({
            x: xs[xi],
            z: zs[zi],
            color: colors[idx % colors.length],
            intensity: intensity,
            distance: dist,
            flicker: baseFlicker + ((idx % 3) * 0.05)
          });
        }
      }
    }
    // Z-01 Concourse (16 architectural cold-vs-warm light pools: warm booth desk lamp, cold AFC tube, sparking gate, warm B2 escalator shaft)
    arr.push(
      { x: 33.4, z: 37.5, color: '#ffaa42', intensity: 3.1, distance: 12.0, flicker: 0.03 }, // Warm amber Service Booth interior lamp spill
      { x: 41.0, z: 29.8, color: '#6ee6fa', intensity: 2.7, distance: 14.0, flicker: 0.05 }, // Cold cyan fluorescent tube above AFC turnstiles
      { x: 41.6, z: 30.2, color: '#ff9630', intensity: 2.3, distance: 8.5,  flicker: 0.34 }, // Orange-gold sparking broken turnstile gate
      { x: 49.4, z: 34.4, color: '#ff9c38', intensity: 2.7, distance: 12.0, flicker: 0.06 }, // Warm amber emergency stair light from B2 escalator shaft
      { x: 48.2, z: 38.8, color: '#5ad0ee', intensity: 1.8, distance: 9.0,  flicker: 0.04 }, // Cool cyan vending machine spill beside shuttered store
      { x: 32.5, z: 28.4, color: '#58b8cc', intensity: 1.4, distance: 10.0, flicker: 0.05 }, // NW recessed TVM bank glow
      { x: 18.5, z: 40.5, color: '#f2a44c', intensity: 2.0, distance: 13.0, flicker: 0.14 }, // Z-01C Security bay dramatic amber pool over clue vignette
      { x: 13.5, z: 12.5, color: '#509eb4', intensity: 1.4, distance: 18.0, flicker: 0.08 },
      { x: 41.5, z: 12.5, color: '#62b8cc', intensity: 1.6, distance: 18.0, flicker: 0.06 },
      { x: 69.5, z: 12.5, color: '#509eb4', intensity: 1.4, distance: 18.0, flicker: 0.08 },
      { x: 13.5, z: 30.5, color: '#4d92a8', intensity: 1.3, distance: 17.0, flicker: 0.08 },
      { x: 69.5, z: 30.5, color: '#589eb2', intensity: 1.4, distance: 17.0, flicker: 0.08 },
      { x: 13.5, z: 58.5, color: '#498ca0', intensity: 1.3, distance: 18.0, flicker: 0.08 },
      { x: 34.5, z: 58.5, color: '#4f96aa', intensity: 1.3, distance: 18.0, flicker: 0.07 },
      { x: 52.5, z: 58.5, color: '#569cb0', intensity: 1.4, distance: 18.0, flicker: 0.07 },
      { x: 69.5, z: 58.5, color: '#d4a664', intensity: 1.6, distance: 18.0, flicker: 0.09 }  // Warm spill toward Z-02 corridor gateway
    );
    // Z-02 Corridor (12 warm sodium & amber boulevard lamps)
    addGridLights([93.5, 112.5, 131.5, 150.5], [58.5, 74.5, 90.5], ['#d6b274', '#e2bc7a', '#e0965c'], 2.1, 26, 0.10);
    // Z-03 Dispatch (10 CRT emerald-teal + amber lockout lamps)
    addGridLights([94.5, 108.5, 122.5, 136.5, 150.5], [14.5, 34.5], ['#58c4a6', '#4cb096', '#ff9644', '#58c4a6', '#ff8a3b'], 2.0, 24, 0.12);
    // Z-04 Substation (12 ozone blue high-voltage arc lamps)
    addGridLights([14.5, 32.5, 50.5, 68.5], [86.5, 110.5, 134.5], ['#6fa8ff', '#5a94f0', '#7ab2ff', '#4b7ee0'], 2.1, 26, 0.16);
    // Z-05 Tunnel (10 eerie violet service gallery strips)
    addGridLights([94.5, 108.5, 122.5, 136.5, 150.5], [114.5, 134.5], ['#b98ce0', '#a87ad8', '#9b6bd4'], 1.9, 24, 0.18);
    // Z-06 Platform 0 (12 warning amber & sodium rail-edge floods along 139m platform; threat red reserved for Inspector)
    addGridLights([174.5, 196.5], [16.5, 40.5, 64.5, 88.5, 112.5, 134.5], ['#e69c3c', '#f0a848', '#d89444', '#6ec4da'], 2.3, 28, 0.10);
    return arr;
  })();

  /* --------------------------------------------------------------------------
   * Interactables: 6 Clues + 2 Track Override Consoles + 1 Extraction Gate
   * -------------------------------------------------------------------------- */
  var INTERACTABLES = [
    // 6 Clues (one per zone, aligned with scenario_station_zero.js)
    {
      id: 'int_clue_concourse',
      type: 'clue',
      x: 18.5,
      z: 40.5,
      zoneId: 'concourse',
      label: '残缺钢印票根',
      clueId: 'clue_ticket_stub',
      overrideValue: 0
    },
    {
      id: 'int_clue_corridor',
      type: 'clue',
      x: 122.5,
      z: 55.5,
      zoneId: 'corridor',
      label: '血字《检票守则残页》',
      clueId: 'clue_inspector_sight',
      overrideValue: 0
    },
    {
      id: 'int_clue_dispatch',
      type: 'clue',
      x: 150.5,
      z: 13.5,
      zoneId: 'dispatch',
      label: '停摆时刻表',
      clueId: 'clue_loop_timetable',
      overrideValue: 0
    },
    {
      id: 'int_clue_substation',
      type: 'clue',
      x: 67.5,
      z: 136.5,
      zoneId: 'substation',
      label: '逆极继电器铭牌',
      clueId: 'clue_relay_polarity',
      overrideValue: 0
    },
    {
      id: 'int_clue_tunnel',
      type: 'clue',
      x: 122.5,
      z: 136.5,
      zoneId: 'tunnel',
      label: '失窃票夹与隐蔽条款',
      clueId: 'clue_shenyan_ledger',
      overrideValue: 0
    },
    {
      id: 'int_clue_platform0',
      type: 'clue',
      x: 201.5,
      z: 112.5,
      zoneId: 'platform0',
      label: '黄线铜牌细则',
      clueId: 'clue_yellow_line_clause',
      overrideValue: 0
    },
    // 2 Track Override Consoles (50% each -> 100% Track Override)
    {
      id: 'int_console_dispatch',
      type: 'console',
      x: 122.5,
      z: 11.5,
      zoneId: 'dispatch',
      label: '信号道岔反转台',
      clueId: 'clue_switch_protocol',
      overrideValue: 50
    },
    {
      id: 'int_console_substation',
      type: 'console',
      x: 14.5,
      z: 136.5,
      zoneId: 'substation',
      label: 'B相逆极高压闸刀',
      clueId: 'clue_relay_polarity',
      overrideValue: 50
    },
    // 1 Extraction Gate at Platform 0
    {
      id: 'int_exit_platform0',
      type: 'exit',
      x: 190.5,
      z: 16.5,
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
    // Waist-high tactical cover (pillarMask === 2) and glazed interior partitions (pillarMask === 3)
    // block movement while preserving elevated/glazed sightlines.
    return grid[iz][ix] === T_WALL && pillarMask[iz][ix] !== 2 && pillarMask[iz][ix] !== 3;
  }

  function resolveCircleWallCollision(x, z, radius) {
    var r = (typeof radius === 'number' && radius > 0) ? radius : 0.35;
    var cx = Math.max(r, Math.min(GRID_W - r, x));
    var cz = Math.max(r, Math.min(GRID_H - r, z));
    var hit = (cx !== x || cz !== z);
    var r2 = r * r;

    for (var pass = 0; pass < 3; pass++) {
      var minGx = Math.max(0, Math.floor(cx - r) - 1);
      var maxGx = Math.min(GRID_W - 1, Math.floor(cx + r) + 1);
      var minGz = Math.max(0, Math.floor(cz - r) - 1);
      var maxGz = Math.min(GRID_H - 1, Math.floor(cz + r) + 1);
      var moved = false;

      for (var gz = minGz; gz <= maxGz; gz++) {
        for (var gx = minGx; gx <= maxGx; gx++) {
          if (isWalkable(gx, gz)) continue;

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
   * Exact 2D Grid DDA Line-of-Sight (Full walls & pillars block LOS; rail & low cover open)
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

    var maxSteps = GRID_W + GRID_H + 16;
    for (var i = 0; i < maxSteps; i++) {
      if (tMaxX < tMaxZ) {
        tMaxX += tDeltaX;
        gx += stepX;
      } else if (tMaxZ < tMaxX) {
        tMaxZ += tDeltaZ;
        gz += stepZ;
      } else {
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
   * Stamp-Cached Fast A* Pathfinding (Zero Full-Array Reset Across 34,048 Cells)
   * -------------------------------------------------------------------------- */
  var TOTAL_CELLS = GRID_W * GRID_H;
  var aStarG = new Float32Array(TOTAL_CELLS);
  var aStarF = new Float32Array(TOTAL_CELLS);
  var aStarFrom = new Int32Array(TOTAL_CELLS);
  var aStarSeen = new Uint32Array(TOTAL_CELLS);
  var aStarClosed = new Uint32Array(TOTAL_CELLS);
  var aStarStamp = 0;

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
    for (var rad = 1; rad <= 8; rad++) {
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
    var dx = x1 - x0;
    var dz = z1 - z0;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.05) return true;
    var steps = Math.ceil(dist * 2.5);
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

    aStarStamp++;
    if (aStarStamp >= 0x7fffffff) {
      aStarSeen.fill(0);
      aStarClosed.fill(0);
      aStarStamp = 1;
    }
    var stamp = aStarStamp;

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

    aStarSeen[startIdx] = stamp;
    aStarFrom[startIdx] = -1;
    aStarG[startIdx] = 0;
    var h0 = Math.abs(goal.x - start.x) + Math.abs(goal.z - start.z);
    aStarF[startIdx] = h0;
    heapPush(startIdx);

    var found = false;
    while (heap.length > 0) {
      var curr = heapPop();
      if (aStarClosed[curr] === stamp) continue;
      if (curr === goalIdx) {
        found = true;
        break;
      }
      aStarClosed[curr] = stamp;

      var cx = curr % GRID_W;
      var cz = (curr - cx) / GRID_W;
      var baseG = aStarG[curr];

      for (var d = 0; d < 8; d++) {
        var dx = DIRS[d][0];
        var dz = DIRS[d][1];
        var nx = cx + dx;
        var nz = cz + dz;
        if (!isWalkable(nx, nz)) continue;

        if (dx !== 0 && dz !== 0) {
          if (!isWalkable(cx + dx, cz) || !isWalkable(cx, cz + dz)) continue;
        }

        var nIdx = nz * GRID_W + nx;
        if (aStarClosed[nIdx] === stamp) continue;

        var tentativeG = baseG + DIRS[d][2] + wallPenalty[nIdx];
        if (aStarSeen[nIdx] !== stamp || tentativeG < aStarG[nIdx]) {
          aStarSeen[nIdx] = stamp;
          aStarFrom[nIdx] = curr;
          aStarG[nIdx] = tentativeG;
          var adx = Math.abs(goal.x - nx);
          var adz = Math.abs(goal.z - nz);
          var h = (adx + adz) + (1.4142 - 2.0) * (adx < adz ? adx : adz);
          aStarF[nIdx] = tentativeG + h;
          heapPush(nIdx);
        }
      }
    }

    if (!found) return [];

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

    if (smooth.length > 1) smooth.shift();
    return smooth;
  }

  /* --------------------------------------------------------------------------
   * Zone Lookup & Accessors
   * -------------------------------------------------------------------------- */
  function getZoneAt(x, z) {
    if (x >= PLATFORM_START_X - 3.5) return 'platform0';
    if (x < 81.5) {
      return z < 73.5 ? 'concourse' : 'substation';
    }
    if (z < 47.5) return 'dispatch';
    if (z >= 101.5) return 'tunnel';
    return 'corridor';
  }

  function getSubZoneAt(x, z) {
    for (var i = 0; i < SUBZONES.length; i++) {
      var sz = SUBZONES[i];
      if (x >= sz.x0 && x <= sz.x1 + 1 && z >= sz.z0 && z <= sz.z1 + 1) {
        return sz;
      }
    }
    var parentZone = getZoneAt(x, z);
    var fallback = null;
    for (var j = 0; j < SUBZONES.length; j++) {
      if (SUBZONES[j].zoneId === parentZone) {
        fallback = SUBZONES[j];
      }
    }
    return fallback || SUBZONES[0];
  }

  function getSubZones() {
    return SUBZONES;
  }

  function getZoneCenter(zoneId) {
    var z = ZONES[zoneId] || ZONES.concourse;
    return { x: z.cx + 0.5, z: z.cz + 0.5 };
  }

  function getGrid() {
    return grid;
  }

  function getPillarMask() {
    return pillarMask;
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

  function getZoneBounds() {
    return ZONE_BOUNDS;
  }

  INFINITY.StationMap = {
    GRID_W: GRID_W,
    GRID_H: GRID_H,
    PLATFORM_START_X: PLATFORM_START_X,
    HAZARD_X: HAZARD_X,
    RAIL_MIN_X: RAIL_MIN_X,
    RAIL_MAX_X: RAIL_MAX_X,
    TRAIN_X: TRAIN_X,
    ZONES: ZONES,
    SUBZONES: SUBZONES,
    ZONE_BOUNDS: ZONE_BOUNDS,
    isWalkable: isWalkable,
    resolveCircleWallCollision: resolveCircleWallCollision,
    hasLineOfSight: hasLineOfSight,
    findPath: findPath,
    getZoneAt: getZoneAt,
    getSubZoneAt: getSubZoneAt,
    getSubZones: getSubZones,
    getZoneCenter: getZoneCenter,
    getZoneBounds: getZoneBounds,
    getGrid: getGrid,
    getPillarMask: getPillarMask,
    getWalls: getWalls,
    getLights: getLights,
    getInteractables: getInteractables
  };
})(typeof window !== 'undefined' ? window : globalThis);
