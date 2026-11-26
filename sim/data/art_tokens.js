/* ============================================================================
 * INFINITY // UNIFIED ART & SEMANTIC COLOR TOKENS (sim/data/art_tokens.js)
 * Single source of truth for semantic colors, rarity tiers, 12 VFX motifs,
 * 6 station zone palettes, character identity colors, and canonical tile keys.
 * Classic non-module script exposing window.INFINITY.ArtTokens
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  function hexToInt(hex, fallback) {
    if (typeof hex === 'number' && !isNaN(hex)) return hex;
    if (typeof hex === 'string') {
      var clean = hex.trim().replace(/^#/, '');
      if (clean.length === 3) {
        clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
      }
      var n = parseInt(clean, 16);
      if (!isNaN(n)) return n;
    }
    return fallback !== undefined ? fallback : 0x6fd8ea;
  }

  function hexToRgb(hex) {
    var n = hexToInt(hex, 0);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    };
  }

  function hexToHue(hex) {
    var rgb = hexToRgb(hex);
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    if (d === 0) return 0;
    var h;
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
    return h;
  }

  function hueDistanceDeg(hexA, hexB) {
    var ha = hexToHue(hexA);
    var hb = hexToHue(hexB);
    var diff = Math.abs(ha - hb);
    return diff > 180 ? 360 - diff : diff;
  }

  // Threat red (#ff1e36, H~354) is strictly reserved for the Inspector & lethal hazards.
  var SEMANTIC = {
    threat:      '#ff1e36',
    threatInt:   0xff1e36,
    threatGlow:  '#ff4b5e',
    player:      '#4ee4ff',
    playerInt:   0x4ee4ff,
    dashTrail:   '#52e5ff',
    dashTrailInt:0x52e5ff,
    heal:        '#3fe69b',
    healInt:     0x3fe69b,
    parryGold:   '#ffd86b',
    parryGoldInt:0xffd86b,
    interact:    '#5ce8c8',
    interactInt: 0x5ce8c8,
    warning:     '#ffaa3b',
    warningInt:  0xffaa3b
  };

  // Unified rarity language across Shop, Hotbar, Build Aura, and Settlement.
  // S-tier uses luminous platinum-prismatic instead of threat red.
  var TIERS = {
    D: { id: 'D', label: 'D', name: '灰哑',     color: '#9aa4b2', hexInt: 0x9aa4b2 },
    C: { id: 'C', label: 'C', name: '古铜',     color: '#d4945a', hexInt: 0xd4945a },
    B: { id: 'B', label: 'B', name: '银蓝',     color: '#78b8f0', hexInt: 0x78b8f0 },
    A: { id: 'A', label: 'A', name: '流金',     color: '#f2c96b', hexInt: 0xf2c96b },
    S: { id: 'S', label: 'S', name: '白金流光', color: '#f3f6ff', hexInt: 0xf3f6ff, accent: '#9ae6ff' }
  };

  // Single source of truth for all 12 thematic VFX motifs.
  // Every primary color stays >= 24 deg away in hue from SEMANTIC.threat (#ff1e36).
  var MOTIFS = {
    sword_qi: {
      id: 'sword_qi',
      primary: '#5ce8ff', secondary: '#f6d57a', core: '#ffffff',
      primaryInt: 0x5ce8ff, secondaryInt: 0xf6d57a, coreInt: 0xffffff,
      pattern: 'vfx_rune_strip', sigil: 'sigil_bagua', sigilStyle: 'bagua',
      orbiter: 'sword', particleShape: 'slash_spark', glyph: '剑'
    },
    flame_solar: {
      id: 'flame_solar',
      primary: '#ff8424', secondary: '#ffe066', core: '#fff8dc',
      primaryInt: 0xff8424, secondaryInt: 0xffe066, coreInt: 0xfff8dc,
      pattern: 'vfx_rune_strip', sigil: 'sigil_arcane_star', sigilStyle: 'arcane_star',
      orbiter: 'talisman', particleShape: 'ember', glyph: '焰'
    },
    thunder_emp: {
      id: 'thunder_emp',
      primary: '#48c6ff', secondary: '#9aa4ff', core: '#f0ffff',
      primaryInt: 0x48c6ff, secondaryInt: 0x9aa4ff, coreInt: 0xf0ffff,
      pattern: 'vfx_hex_pattern', sigil: 'sigil_hex_grid', sigilStyle: 'hex_grid',
      orbiter: 'drone_bit', particleShape: 'arc_spark', glyph: '雷'
    },
    frost_cryo: {
      id: 'frost_cryo',
      primary: '#8cf2ff', secondary: '#d8fbff', core: '#ffffff',
      primaryInt: 0x8cf2ff, secondaryInt: 0xd8fbff, coreInt: 0xffffff,
      pattern: 'vfx_hex_pattern', sigil: 'sigil_arcane_star', sigilStyle: 'arcane_star',
      orbiter: 'void_prism', particleShape: 'crystal', glyph: '霜'
    },
    blood_sanguine: {
      id: 'blood_sanguine',
      primary: '#c838a8', secondary: '#ff94d2', core: '#ffe8f7',
      primaryInt: 0xc838a8, secondaryInt: 0xff94d2, coreInt: 0xffe8f7,
      pattern: 'vfx_rune_strip', sigil: 'sigil_blood_crest', sigilStyle: 'blood_crest',
      orbiter: 'blood_shard', particleShape: 'crimson_petal', glyph: '血'
    },
    void_space: {
      id: 'void_space',
      primary: '#8f5cff', secondary: '#52e0ff', core: '#f4e8ff',
      primaryInt: 0x8f5cff, secondaryInt: 0x52e0ff, coreInt: 0xf4e8ff,
      pattern: 'vfx_hex_pattern', sigil: 'sigil_occult_eye', sigilStyle: 'occult_eye',
      orbiter: 'void_prism', particleShape: 'void_mote', glyph: '虚'
    },
    holy_tao: {
      id: 'holy_tao',
      primary: '#f5cf64', secondary: '#fff0b2', core: '#ffffff',
      primaryInt: 0xf5cf64, secondaryInt: 0xfff0b2, coreInt: 0xffffff,
      pattern: 'vfx_rune_strip', sigil: 'sigil_bagua', sigilStyle: 'bagua',
      orbiter: 'talisman', particleShape: 'rune_mote', glyph: '道'
    },
    occult_meme: {
      id: 'occult_meme',
      primary: '#c852ff', secondary: '#7a5cff', core: '#f6e8ff',
      primaryInt: 0xc852ff, secondaryInt: 0x7a5cff, coreInt: 0xf6e8ff,
      pattern: 'vfx_rune_strip', sigil: 'sigil_occult_eye', sigilStyle: 'occult_eye',
      orbiter: 'void_prism', particleShape: 'glitch_shard', glyph: '诡'
    },
    bio_venom: {
      id: 'bio_venom',
      primary: '#46e88a', secondary: '#b4ff6e', core: '#eafff2',
      primaryInt: 0x46e88a, secondaryInt: 0xb4ff6e, coreInt: 0xeafff2,
      pattern: 'vfx_hex_pattern', sigil: 'sigil_tactical_hud', sigilStyle: 'tactical_hud',
      orbiter: 'bio_helix', particleShape: 'spore', glyph: '生'
    },
    cyber_tactical: {
      id: 'cyber_tactical',
      primary: '#38d6d6', secondary: '#f2b852', core: '#ffffff',
      primaryInt: 0x38d6d6, secondaryInt: 0xf2b852, coreInt: 0xffffff,
      pattern: 'vfx_hex_pattern', sigil: 'sigil_tactical_hud', sigilStyle: 'tactical_hud',
      orbiter: 'drone_bit', particleShape: 'pixel_bit', glyph: '械'
    },
    shadow_ninja: {
      id: 'shadow_ninja',
      primary: '#6878ff', secondary: '#4ac8e8', core: '#e2dcff',
      primaryInt: 0x6878ff, secondaryInt: 0x4ac8e8, coreInt: 0xe2dcff,
      pattern: 'vfx_rune_strip', sigil: 'sigil_occult_eye', sigilStyle: 'occult_eye',
      orbiter: 'sword', particleShape: 'smoke_wisp', glyph: '影'
    },
    gravity_kinetic: {
      id: 'gravity_kinetic',
      primary: '#d4b84e', secondary: '#8ca8d8', core: '#fff7d6',
      primaryInt: 0xd4b84e, secondaryInt: 0x8ca8d8, coreInt: 0xfff7d6,
      pattern: 'vfx_hex_pattern', sigil: 'sigil_hex_grid', sigilStyle: 'hex_grid',
      orbiter: 'kinetic_plate', particleShape: 'debris', glyph: '重'
    }
  };

  // Station zone colors — Platform 0 shifted to warning amber (#e69c3c) so threat red stays exclusive.
  var ZONES = {
    concourse:  { color: '#68c8de', hexInt: 0x68c8de },
    corridor:   { color: '#d6b274', hexInt: 0xd6b274 },
    dispatch:   { color: '#52c4a2', hexInt: 0x52c4a2 },
    substation: { color: '#6e9eff', hexInt: 0x6e9eff },
    tunnel:     { color: '#a884e0', hexInt: 0xa884e0 },
    platform0:  { color: '#e69c3c', hexInt: 0xe69c3c }
  };

  // Unified character identity colors across world_cast, pixel_sprites, CRT HUD, and world tags.
  var CHARACTERS = {
    player:     { accent: '#4ee4ff', hexInt: 0x4ee4ff },
    yanci:      { accent: '#7ca7d9', hexInt: 0x7ca7d9 },
    lujin:      { accent: '#e88c4a', hexInt: 0xe88c4a },
    xutan:      { accent: '#52d6b4', hexInt: 0x52d6b4 },
    guhe:       { accent: '#4cc99b', hexInt: 0x4cc99b },
    shenyan:    { accent: '#c9a66b', hexInt: 0xc9a66b },
    yelin:      { accent: '#d4748c', hexInt: 0xd4748c },
    litianyang: { accent: '#b89c68', hexInt: 0xb89c68 },
    anke:       { accent: '#56b4d3', hexInt: 0x56b4d3 },
    hezheng:    { accent: '#d48c46', hexInt: 0xd48c46 },
    inspector:  { accent: '#ff1e36', hexInt: 0xff1e36 }
  };

  // Canonical 7 tile keys shared across PixelSprites, AssetManifest, ASSETS_GUIDE, and gen_comfyui_assets.py.
  var CANONICAL_TILES = [
    'floor_slate',
    'floor_platform',
    'floor_hazard',
    'floor_rail',
    'wall_concrete',
    'wall_neon',
    'train_hull'
  ];

  // Runtime VFX & lighting budget constants
  var BUDGETS = {
    maxActiveVfx: 48,
    maxActiveParticles: 240,
    maxLayersPerCast: 3,
    lightPoolSize: 4
  };

  INFINITY.ArtTokens = {
    SEMANTIC: SEMANTIC,
    TIERS: TIERS,
    MOTIFS: MOTIFS,
    ZONES: ZONES,
    CHARACTERS: CHARACTERS,
    CANONICAL_TILES: CANONICAL_TILES,
    BUDGETS: BUDGETS,
    hexToInt: hexToInt,
    hexToRgb: hexToRgb,
    hexToHue: hexToHue,
    hueDistanceDeg: hueDistanceDeg,
    getMotif: function (id) {
      return MOTIFS[id] || MOTIFS.cyber_tactical;
    },
    getCharacterColor: function (id, fallback) {
      var entry = CHARACTERS[String(id || '').toLowerCase()];
      return entry ? entry.accent : (fallback || SEMANTIC.player);
    },
    getZoneColor: function (zoneId, fallback) {
      var entry = ZONES[zoneId];
      return entry ? entry.color : (fallback || '#68c8de');
    },
    getTier: function (tierId) {
      return TIERS[String(tierId || 'D').toUpperCase()] || TIERS.D;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
