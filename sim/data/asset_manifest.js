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
   * Optional ComfyUI / Midjourney / Aseprite seamless pixel-art tile overrides.
   * Kept empty by default so PixelSprites uses procedural HD-2D canvas textures
   * with ZERO 404 console errors. Drop seamless 128x128 or 256x256 .webp/.png
   * files into sim/assets/tiles/ and uncomment the matching canonical entries:
   *
   *   floor_slate:    'assets/tiles/floor_slate.webp',
   *   floor_platform: 'assets/tiles/floor_platform.webp',
   *   floor_hazard:   'assets/tiles/floor_hazard.webp',
   *   floor_rail:     'assets/tiles/floor_rail.webp',
   *   wall_concrete:  'assets/tiles/wall_concrete.webp',
   *   wall_neon:      'assets/tiles/wall_neon.webp',
   *   train_hull:     'assets/tiles/train_hull.webp'
   */
  var TILES = {};

  // Optional external icon & sprite overrides (zero-404 fallback to procedural synth)
  var ICONS = {};
  var SPRITES = {};

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

  function getSpriteUrl(id) {
    if (!id) return null;
    var key = String(id).trim().toLowerCase();
    var rel = SPRITES[key];
    return rel ? resolvePath(rel) : null;
  }

  INFINITY.ASSETS = {
    basePrefix: BASE_PREFIX,
    portraits: PORTRAITS,
    tiles: TILES,
    icons: ICONS,
    sprites: SPRITES,
    resolvePath: resolvePath,
    getPortraitUrl: getPortraitUrl,
    getTileUrl: getTileUrl,
    getIconUrl: getIconUrl,
    getSpriteUrl: getSpriteUrl
  };
})(typeof window !== 'undefined' ? window : globalThis);
