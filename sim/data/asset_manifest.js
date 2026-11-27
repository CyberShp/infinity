/* ============================================================================
 * Infinity Living Simulator — HD-2D Asset Manifest & Hot-Swap Loader
 * Attaches to window.INFINITY.ASSETS (classic defer script, zero ES modules)
 * Automatically detects root index.html ('sim/') vs sim/index.html ('') prefix.
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  function detectBasePrefix() {
    try {
      var scriptEl = null;
      if (typeof document !== 'undefined') {
        scriptEl = document.currentScript ||
          (document.querySelector && document.querySelector('script[src*="asset_manifest.js"]'));
      }
      if (scriptEl) {
        var rawSrc = scriptEl.getAttribute('src') || '';
        var cleanSrc = rawSrc.split('?')[0].split('#')[0];
        var marker = 'data/asset_manifest.js';
        var idx = cleanSrc.lastIndexOf(marker);
        if (idx !== -1) {
          return cleanSrc.slice(0, idx);
        }
      }
      if (typeof global.location !== 'undefined' && global.location && global.location.pathname) {
        return /\/sim\/([^/]*\.html)?$/i.test(global.location.pathname) ? '' : 'sim/';
      }
    } catch (_) {}
    return 'sim/';
  }

  var BASE_PREFIX = detectBasePrefix();

  var PORTRAITS = {
    yanci: 'assets/portraits/yanci.webp',
    lujin: 'assets/portraits/lujin.webp',
    xutan: 'assets/portraits/xutan.webp',
    shenyan: 'assets/portraits/shenyan.webp',
    yelin: 'assets/portraits/yelin.webp',
    litianyang: 'assets/portraits/litianyang.webp',
    guhe: 'assets/portraits/guhe.webp',
    inspector: 'assets/portraits/inspector.webp'
  };

  /*
   * Style-1 Heavy-Ink seamless tile overrides (Limbus Company x Hades).
   * Remaining canonical tiles (floor_hazard, floor_rail, wall_neon, train_hull)
   * render from synchronized Style-1 heavy-ink procedural canvases with zero 404s.
   */
  var TILES = {
    floor_slate: 'assets/tiles/floor_slate.webp',
    floor_platform: 'assets/tiles/floor_platform.webp',
    wall_concrete: 'assets/tiles/wall_concrete.webp'
  };

  // Optional external icon overrides (zero-404 fallback to procedural synth)
  var ICONS = {};

  // Style-1 heavy-ink 4x1 horizontal transparent WebP character sprite sheets
  // Frame order: [idle, walk1, walk2, action]. Missing files silently fall back to procedural canvases.
  var SPRITES = {
    player: {
      sheet: 'assets/sprites/player_sheet.webp',
      normal: 'assets/sprites/player_normal.webp',
      emissive: 'assets/sprites/player_emissive.webp'
    },
    yanci: {
      sheet: 'assets/sprites/yanci_sheet.webp',
      normal: 'assets/sprites/yanci_normal.webp',
      emissive: 'assets/sprites/yanci_emissive.webp'
    },
    lujin: {
      sheet: 'assets/sprites/lujin_sheet.webp',
      normal: 'assets/sprites/lujin_normal.webp',
      emissive: 'assets/sprites/lujin_emissive.webp'
    },
    xutan: {
      sheet: 'assets/sprites/xutan_sheet.webp',
      normal: 'assets/sprites/xutan_normal.webp',
      emissive: 'assets/sprites/xutan_emissive.webp'
    },
    shenyan: {
      sheet: 'assets/sprites/shenyan_sheet.webp',
      normal: 'assets/sprites/shenyan_normal.webp',
      emissive: 'assets/sprites/shenyan_emissive.webp'
    },
    inspector: {
      sheet: 'assets/sprites/inspector_sheet.webp',
      normal: 'assets/sprites/inspector_normal.webp',
      emissive: 'assets/sprites/inspector_emissive.webp'
    }
  };

  // Hades hard-edge 2x2 black-ground VFX Flipbook sheets (graceful procedural fallback if missing)
  var VFX_FLIPBOOKS = {
    hades_cyan: 'assets/vfx/hades_cyan.webp',
    hades_flame: 'assets/vfx/hades_flame.webp',
    hades_emp: 'assets/vfx/hades_emp.webp',
    hades_tao_ground: 'assets/vfx/hades_tao_ground.webp',
    hades_occult_chain: 'assets/vfx/hades_occult_chain.webp',
    hades_heal_aegis: 'assets/vfx/hades_heal_aegis.webp',
    hades_cyan_16f: 'assets/vfx/hades_cyan_16f.webp',
    hades_crimson_boss_16f: 'assets/vfx/hades_crimson_boss_16f.webp'
  };

  // Style-1 Painted Scene-A Plates & 30-deg Painted 2.5D Props (B1 Concourse Vertical Slice)
  var SCENE_ASSETS = {
    concourse_floor: 'assets/scenes/concourse_floor_plate.webp',
    concourse_floor_normal: 'assets/scenes/concourse_floor_normal.webp',
    concourse_floor_roughness: 'assets/scenes/concourse_floor_roughness.webp',
    concourse_wall: 'assets/scenes/concourse_wall_plate.webp',
    concourse_wall_normal: 'assets/scenes/concourse_wall_normal.webp',
    prop_turnstile: 'assets/scenes/prop_turnstile.webp',
    prop_bench: 'assets/scenes/prop_bench.webp',
    prop_clock_totem: 'assets/scenes/prop_clock_totem.webp',
    prop_clutter: 'assets/scenes/prop_clutter.webp'
  };

  // Dedicated 4-pose Limbus-style combat key-pose sheet (windup / smear / cleave / parry)
  var COMBAT_POSE_SHEETS = {
    player: {
      sheet: 'assets/sprites/player_combat_sheet.webp',
      normal: 'assets/sprites/player_combat_normal.webp',
      emissive: 'assets/sprites/player_combat_emissive.webp'
    }
  };

  function resolvePath(relPath) {
    if (!relPath || typeof relPath !== 'string') return null;
    var trimmed = relPath.trim();
    if (!trimmed) return null;
    if (/^(https?:\/\/|data:|blob:|\/)/i.test(trimmed)) {
      return trimmed;
    }
    var cleaned = trimmed.replace(/^\.\//, '');
    if (BASE_PREFIX && cleaned.indexOf(BASE_PREFIX) === 0) {
      return cleaned;
    }
    return BASE_PREFIX + cleaned;
  }

  function getPortraitUrl(id) {
    if (!id) return null;
    var key = String(id).trim().toLowerCase();
    var rel = PORTRAITS[key];
    return rel ? resolvePath(rel) : null;
  }

  function getTileUrl(name) {
    if (!name) return null;
    var key = String(name).trim();
    var rel = TILES[key];
    return rel ? resolvePath(rel) : null;
  }

  function getIconUrl(id) {
    if (!id) return null;
    var key = String(id).trim();
    var rel = ICONS[key];
    return rel ? resolvePath(rel) : null;
  }

  function getSpriteSheetUrls(id) {
    if (!id) return null;
    var key = String(id).trim().toLowerCase();
    var entry = SPRITES[key];
    if (!entry) return null;
    if (typeof entry === 'string') {
      var single = resolvePath(entry);
      return single ? { sheet: single, normal: null, emissive: null } : null;
    }
    return {
      sheet: entry.sheet ? resolvePath(entry.sheet) : null,
      normal: entry.normal ? resolvePath(entry.normal) : null,
      emissive: entry.emissive ? resolvePath(entry.emissive) : null
    };
  }

  function getSpriteUrl(id) {
    var urls = getSpriteSheetUrls(id);
    return urls ? urls.sheet : null;
  }

  function getVfxFlipbookUrl(name) {
    if (!name) return null;
    var key = String(name).trim().toLowerCase();
    var rel = VFX_FLIPBOOKS[key];
    return rel ? resolvePath(rel) : null;
  }

  function getSceneAssetUrl(name) {
    if (!name) return null;
    var key = String(name).trim().toLowerCase();
    var rel = SCENE_ASSETS[key];
    return rel ? resolvePath(rel) : null;
  }

  function getCombatPoseSheetUrls(id) {
    if (!id) return null;
    var key = String(id).trim().toLowerCase();
    var entry = COMBAT_POSE_SHEETS[key];
    if (!entry) return null;
    return {
      sheet: entry.sheet ? resolvePath(entry.sheet) : null,
      normal: entry.normal ? resolvePath(entry.normal) : null,
      emissive: entry.emissive ? resolvePath(entry.emissive) : null
    };
  }

  INFINITY.ASSETS = {
    basePrefix: BASE_PREFIX,
    portraits: PORTRAITS,
    tiles: TILES,
    icons: ICONS,
    sprites: SPRITES,
    vfxFlipbooks: VFX_FLIPBOOKS,
    sceneAssets: SCENE_ASSETS,
    combatPoseSheets: COMBAT_POSE_SHEETS,
    resolvePath: resolvePath,
    getPortraitUrl: getPortraitUrl,
    getTileUrl: getTileUrl,
    getIconUrl: getIconUrl,
    getSpriteUrl: getSpriteUrl,
    getSpriteSheetUrls: getSpriteSheetUrls,
    getVfxFlipbookUrl: getVfxFlipbookUrl,
    getSceneAssetUrl: getSceneAssetUrl,
    getCombatPoseSheetUrls: getCombatPoseSheetUrls
  };
})(typeof window !== 'undefined' ? window : globalThis);
