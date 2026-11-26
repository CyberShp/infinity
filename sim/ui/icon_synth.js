/* ============================================================================
 * INFINITY // PROCEDURAL SVG ICON SYNTHESIZER (sim/ui/icon_synth.js)
 * Composes crisp, zero-emoji tactical icons from:
 *   6 category frames x 5 rarity tiers x 12 motif glyphs x 14 archetype badges.
 * Supports external hot-swap via window.INFINITY.ASSETS.getIconUrl(id).
 * Classic non-module script exposing window.INFINITY.IconSynth
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  function escAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getTokens() {
    return INFINITY.ArtTokens || null;
  }

  function getTierMeta(tier) {
    var t = String(tier || 'D').toUpperCase();
    var tok = getTokens();
    if (tok && tok.TIERS && tok.TIERS[t]) {
      return tok.TIERS[t];
    }
    var fallback = {
      D: { id: 'D', color: '#9aa4b2' },
      C: { id: 'C', color: '#d4945a' },
      B: { id: 'B', color: '#78b8f0' },
      A: { id: 'A', color: '#f2c96b' },
      S: { id: 'S', color: '#f3f6ff', accent: '#9ae6ff' }
    };
    return fallback[t] || fallback.D;
  }

  function getMotifMeta(motifId) {
    var m = String(motifId || 'cyber_tactical');
    var tok = getTokens();
    if (tok && tok.MOTIFS && tok.MOTIFS[m]) {
      return tok.MOTIFS[m];
    }
    return { id: m, primary: '#38d6d6', secondary: '#f2b852', core: '#ffffff' };
  }

  // 6 Category Frame Geometry (64x64 viewBox)
  function buildCategoryFrame(category, borderCol, bgFill, isSTier) {
    var strokeW = isSTier ? '2.4' : '1.9';
    var inner = '';
    switch (category) {
      case 'bloodline':
        // Double-ring bio/lineage crest
        inner =
          '<circle cx="32" cy="32" r="27" fill="' + bgFill + '" stroke="' + borderCol + '" stroke-width="' + strokeW + '"/>' +
          '<circle cx="32" cy="32" r="22.5" fill="none" stroke="' + borderCol + '" stroke-width="0.9" stroke-dasharray="4 3" opacity="0.72"/>';
        break;
      case 'cultivation':
        // Octagonal Daoist seal
        inner =
          '<polygon points="20,5 44,5 59,20 59,44 44,59 20,59 5,44 5,20" fill="' + bgFill + '" stroke="' + borderCol + '" stroke-width="' + strokeW + '"/>' +
          '<polygon points="22,9.5 42,9.5 54.5,22 54.5,42 42,54.5 22,54.5 9.5,42 9.5,22" fill="none" stroke="' + borderCol + '" stroke-width="0.85" opacity="0.55"/>';
        break;
      case 'myth':
        // Diamond relic stele
        inner =
          '<polygon points="32,4 58,20 58,44 32,60 6,44 6,20" fill="' + bgFill + '" stroke="' + borderCol + '" stroke-width="' + strokeW + '"/>' +
          '<polygon points="32,9 53,22 53,42 32,55 11,42 11,22" fill="none" stroke="' + borderCol + '" stroke-width="0.85" opacity="0.5"/>';
        break;
      case 'tech':
        // Chamfered tactical microchip frame
        inner =
          '<polygon points="13,6 51,6 58,13 58,51 51,58 13,58 6,51 6,13" fill="' + bgFill + '" stroke="' + borderCol + '" stroke-width="' + strokeW + '"/>' +
          '<path d="M12,15 L15,12 M52,15 L49,12 M12,49 L15,52 M52,49 L49,52" stroke="' + borderCol + '" stroke-width="1.4" opacity="0.75"/>';
        break;
      case 'anomaly':
        // Fractured containment frame
        inner =
          '<rect x="6" y="6" width="52" height="52" rx="4" fill="' + bgFill + '" stroke="' + borderCol + '" stroke-width="' + strokeW + '" stroke-dasharray="18 3 12 3"/>' +
          '<path d="M9,14 L14,9 M55,50 L50,55 M9,50 L15,50 M49,14 L55,14" stroke="' + borderCol + '" stroke-width="1.2" opacity="0.7"/>';
        break;
      default:
        // General tactical square
        inner =
          '<rect x="6" y="6" width="52" height="52" rx="9" fill="' + bgFill + '" stroke="' + borderCol + '" stroke-width="' + strokeW + '"/>' +
          '<rect x="10.5" y="10.5" width="43" height="43" rx="6" fill="none" stroke="' + borderCol + '" stroke-width="0.85" opacity="0.45"/>';
        break;
    }
    return inner;
  }

  // 5 Rarity Tier Corner Accents
  function buildTierAccents(tier, borderCol, accentCol) {
    switch (tier) {
      case 'C':
        return '<circle cx="11" cy="11" r="1.7" fill="' + borderCol + '"/><circle cx="53" cy="11" r="1.7" fill="' + borderCol + '"/>';
      case 'B':
        return '<path d="M6,16 L6,6 L16,6 M48,6 L58,6 L58,16" fill="none" stroke="' + borderCol + '" stroke-width="2.4" stroke-linecap="square"/>';
      case 'A':
        return (
          '<polygon points="32,2 35.5,6.5 32,11 28.5,6.5" fill="' + borderCol + '"/>' +
          '<path d="M6,17 L6,6 L17,6 M47,6 L58,6 L58,17 M6,47 L6,58 L17,58" fill="none" stroke="' + borderCol + '" stroke-width="2.2"/>'
        );
      case 'S':
        return (
          '<polygon points="32,1.5 36.5,6.5 32,11.5 27.5,6.5" fill="' + borderCol + '"/>' +
          '<polygon points="32,52.5 35.5,57 32,61.5 28.5,57" fill="' + accentCol + '"/>' +
          '<path d="M5,18 L5,5 L18,5 M46,5 L59,5 L59,18 M5,46 L5,59 L18,59 M46,59 L59,59 L59,46" fill="none" stroke="' + accentCol + '" stroke-width="2.1" opacity="0.9"/>'
        );
      default:
        return '';
    }
  }

  // 12 Thematic Motif Center Vector Glyphs (centered around 32,32)
  function buildMotifGlyph(motifId, primary, secondary, core) {
    switch (motifId) {
      case 'sword_qi':
        return (
          '<path d="M18,46 C26,38 36,26 47,16" stroke="' + primary + '" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
          '<path d="M22,42 L45,18" stroke="' + core + '" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path d="M17,28 C25,18 39,17 47,26" stroke="' + secondary + '" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.9"/>' +
          '<path d="M16,44 L22,50" stroke="' + secondary + '" stroke-width="2.6" stroke-linecap="round"/>'
        );
      case 'flame_solar':
        return (
          '<path d="M32,14 C39,23 45,29 44,38 C43,45 38,49 32,49 C25,49 20,44 20,37 C20,31 24,26 27,22 C27,26 29,28 31,26 C30,21 31,17 32,14 Z" fill="' + primary + '" stroke="' + secondary + '" stroke-width="1.6"/>' +
          '<path d="M32,27 C36,32 38,36 37,41 C36,44 34,46 32,46 C29,46 27,43 27,40 C27,36 30,32 32,27 Z" fill="' + core + '" opacity="0.9"/>'
        );
      case 'thunder_emp':
        return (
          '<polygon points="36,13 21,34 31,34 27,51 44,29 33,29" fill="' + primary + '" stroke="' + core + '" stroke-width="1.3" stroke-linejoin="round"/>' +
          '<circle cx="32" cy="32" r="18" fill="none" stroke="' + secondary + '" stroke-width="1.1" stroke-dasharray="5 4" opacity="0.7"/>'
        );
      case 'frost_cryo':
        return (
          '<g stroke="' + primary + '" stroke-width="2.2" stroke-linecap="round">' +
            '<line x1="32" y1="14" x2="32" y2="50"/>' +
            '<line x1="16" y1="23" x2="48" y2="41"/>' +
            '<line x1="48" y1="23" x2="16" y2="41"/>' +
          '</g>' +
          '<polygon points="32,23 39,27.5 39,36.5 32,41 25,36.5 25,27.5" fill="' + secondary + '" fill-opacity="0.35" stroke="' + core + '" stroke-width="1.4"/>'
        );
      case 'blood_sanguine':
        return (
          '<path d="M32,15 C38,24 44,31 44,38 C44,45 38.6,49 32,49 C25.4,49 20,45 20,38 C20,31 26,24 32,15 Z" fill="' + primary + '" fill-opacity="0.88" stroke="' + secondary + '" stroke-width="1.6"/>' +
          '<path d="M27,38 C27,42 30,44 34,44" stroke="' + core + '" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
          '<path d="M17,22 L23,28 M47,22 L41,28" stroke="' + secondary + '" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>'
        );
      case 'void_space':
        return (
          '<ellipse cx="32" cy="32" rx="18" ry="8" transform="rotate(-24 32 32)" fill="none" stroke="' + primary + '" stroke-width="2.3"/>' +
          '<ellipse cx="32" cy="32" rx="18" ry="8" transform="rotate(24 32 32)" fill="none" stroke="' + secondary + '" stroke-width="1.6" opacity="0.85"/>' +
          '<polygon points="32,22 38,32 32,42 26,32" fill="' + core + '" stroke="' + primary + '" stroke-width="1.4"/>'
        );
      case 'holy_tao':
        return (
          '<circle cx="32" cy="32" r="16" fill="none" stroke="' + primary + '" stroke-width="2.2"/>' +
          '<polygon points="32,17 44,39 20,39" fill="none" stroke="' + secondary + '" stroke-width="1.6"/>' +
          '<polygon points="32,47 44,25 20,25" fill="none" stroke="' + primary + '" stroke-width="1.4" opacity="0.85"/>' +
          '<circle cx="32" cy="32" r="3.2" fill="' + core + '"/>'
        );
      case 'occult_meme':
        return (
          '<path d="M14,32 C20,22 44,22 50,32 C44,42 20,42 14,32 Z" fill="' + primary + '" fill-opacity="0.22" stroke="' + primary + '" stroke-width="2.2"/>' +
          '<circle cx="32" cy="32" r="6.5" fill="' + secondary + '" stroke="' + core + '" stroke-width="1.3"/>' +
          '<line x1="32" y1="26" x2="32" y2="38" stroke="#0c0f18" stroke-width="2.2"/>' +
          '<path d="M15,20 L21,20 M43,44 L49,44" stroke="' + core + '" stroke-width="1.5" opacity="0.75"/>'
        );
      case 'bio_venom':
        return (
          '<path d="M22,16 C32,21 32,29 42,32 C32,35 32,43 22,48" fill="none" stroke="' + primary + '" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path d="M42,16 C32,21 32,29 22,32 C32,35 32,43 42,48" fill="none" stroke="' + secondary + '" stroke-width="2.1" stroke-linecap="round"/>' +
          '<line x1="25" y1="22" x2="39" y2="22" stroke="' + core + '" stroke-width="1.3" opacity="0.8"/>' +
          '<line x1="25" y1="42" x2="39" y2="42" stroke="' + core + '" stroke-width="1.3" opacity="0.8"/>'
        );
      case 'shadow_ninja':
        return (
          '<path d="M32,14 L36,28 L50,32 L36,36 L32,50 L28,36 L14,32 L28,28 Z" fill="' + primary + '" fill-opacity="0.85" stroke="' + secondary + '" stroke-width="1.4" stroke-linejoin="round"/>' +
          '<circle cx="32" cy="32" r="3.6" fill="#0d111a" stroke="' + core + '" stroke-width="1.4"/>'
        );
      case 'gravity_kinetic':
        return (
          '<circle cx="32" cy="32" r="15" fill="none" stroke="' + primary + '" stroke-width="2.1" stroke-dasharray="9 4"/>' +
          '<circle cx="32" cy="32" r="8.5" fill="' + primary + '" fill-opacity="0.32" stroke="' + secondary + '" stroke-width="1.8"/>' +
          '<path d="M32,12 L32,20 M32,44 L32,52 M12,32 L20,32 M44,32 L52,32" stroke="' + core + '" stroke-width="1.7" stroke-linecap="round"/>'
        );
      default:
        // cyber_tactical reticle
        return (
          '<circle cx="32" cy="32" r="14" fill="none" stroke="' + primary + '" stroke-width="2.2"/>' +
          '<path d="M32,13 L32,21 M32,43 L32,51 M13,32 L21,32 M43,32 L51,32" stroke="' + secondary + '" stroke-width="2.2" stroke-linecap="round"/>' +
          '<rect x="28.5" y="28.5" width="7" height="7" transform="rotate(45 32 32)" fill="' + core + '"/>'
        );
    }
  }

  // 14 Archetype Mini Corner Badge (bottom-right 44..60)
  function buildArchetypeBadge(archetype, accent) {
    if (!archetype) return '';
    var glyph = '';
    switch (archetype) {
      case 'sword_arc':
      case 'berserk_strike':
        glyph = '<path d="M47,55 L56,46 M51,46 L56,46 L56,51" stroke="' + accent + '" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
        break;
      case 'rail_shot':
        glyph = '<path d="M46,51 L57,51 M53,47 L57,51 L53,55" stroke="' + accent + '" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
        break;
      case 'ward_circle':
      case 'emp_blast':
        glyph = '<circle cx="51.5" cy="51.5" r="4.5" fill="none" stroke="' + accent + '" stroke-width="1.7"/><circle cx="51.5" cy="51.5" r="1.5" fill="' + accent + '"/>';
        break;
      case 'aegis_shield':
        glyph = '<path d="M51.5,46 L56.5,48.5 L55.5,54 L51.5,56.5 L47.5,54 L46.5,48.5 Z" fill="none" stroke="' + accent + '" stroke-width="1.6"/>';
        break;
      case 'heal_pulse':
        glyph = '<path d="M51.5,47 L51.5,56 M47,51.5 L56,51.5" stroke="' + accent + '" stroke-width="2.2" stroke-linecap="round"/>';
        break;
      case 'blink_mark':
      case 'overclock':
        glyph = '<path d="M47,55 L51.5,47 L56,55" fill="none" stroke="' + accent + '" stroke-width="1.8" stroke-linejoin="round"/>';
        break;
      case 'stealth_veil':
        glyph = '<path d="M46.5,51.5 C48.5,48 54.5,48 56.5,51.5 C54.5,55 48.5,55 46.5,51.5 Z" fill="none" stroke="' + accent + '" stroke-width="1.5"/>';
        break;
      case 'seal_chain':
        glyph = '<rect x="47.5" y="48.5" width="8" height="6" rx="2" fill="none" stroke="' + accent + '" stroke-width="1.6"/>';
        break;
      case 'recon_pulse':
        glyph = '<path d="M47,55 A7,7 0 0,1 56,47" fill="none" stroke="' + accent + '" stroke-width="1.7"/><circle cx="48" cy="54" r="1.6" fill="' + accent + '"/>';
        break;
      case 'turret_drone':
      case 'decoy_flare':
        glyph = '<polygon points="51.5,46.5 56.5,55 46.5,55" fill="none" stroke="' + accent + '" stroke-width="1.6"/>';
        break;
      default:
        glyph = '<circle cx="51.5" cy="51.5" r="3" fill="' + accent + '"/>';
        break;
    }
    return (
      '<rect x="43" y="43" width="17" height="17" rx="4" fill="#090d16" fill-opacity="0.92" stroke="' + accent + '" stroke-width="1.1"/>' +
      glyph
    );
  }

  function getIconSvg(spec) {
    var s = spec || {};
    var tier = String(s.tier || 'D').toUpperCase();
    var tierMeta = getTierMeta(tier);
    var motifMeta = getMotifMeta(s.motif || 'cyber_tactical');
    var primary = s.primaryColor || motifMeta.primary || '#38d6d6';
    var secondary = s.secondaryColor || motifMeta.secondary || '#f2b852';
    var core = motifMeta.core || '#ffffff';
    var borderCol = tierMeta.color || '#9aa4b2';
    var accentCol = tierMeta.accent || primary;
    var size = Number(s.size) || 44;
    var cls = s.className ? (' class="' + escAttr(s.className) + '"') : '';
    var bgFill = tier === 'S' ? '#141d2e' : '#0c111b';

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="' + size + '" height="' + size + '"' + cls + ' aria-hidden="true">' +
        buildCategoryFrame(s.category || 'general', borderCol, bgFill, tier === 'S') +
        buildTierAccents(tier, borderCol, accentCol) +
        buildMotifGlyph(s.motif || 'cyber_tactical', primary, secondary, core) +
        (s.showBadge !== false && s.archetype ? buildArchetypeBadge(s.archetype, primary) : '') +
      '</svg>';
    return svg;
  }

  function resolveItemVisualSpec(item) {
    var spec = {
      id: item && item.id,
      category: (item && item.category) || 'general',
      tier: (item && item.tier) || 'D',
      motif: 'cyber_tactical',
      archetype: null,
      primaryColor: null,
      secondaryColor: null
    };
    if (item && INFINITY.Skills25D && typeof INFINITY.Skills25D.mapItemToSkill === 'function') {
      try {
        var mapped = INFINITY.Skills25D.mapItemToSkill(item);
        if (mapped) {
          spec.archetype = mapped.archetype || null;
          if (mapped.vfxProfile) {
            spec.motif = mapped.vfxProfile.motif || spec.motif;
            spec.primaryColor = mapped.vfxProfile.primaryColor || null;
            spec.secondaryColor = mapped.vfxProfile.secondaryColor || null;
          }
        }
      } catch (_) {}
    }
    return spec;
  }

  function renderItemIcon(item, opts) {
    var o = opts || {};
    var size = Number(o.size) || 42;
    var extUrl = (item && item.id && INFINITY.ASSETS && typeof INFINITY.ASSETS.getIconUrl === 'function')
      ? INFINITY.ASSETS.getIconUrl(item.id)
      : null;
    if (extUrl) {
      return '<img class="synth-icon-img ' + escAttr(o.className || '') + '" src="' + escAttr(extUrl) + '" width="' + size + '" height="' + size + '" alt="" loading="lazy">';
    }
    var spec = resolveItemVisualSpec(item);
    spec.size = size;
    spec.className = 'synth-icon-svg ' + (o.className || '');
    spec.showBadge = o.showBadge !== false;
    return getIconSvg(spec);
  }

  function renderSkillIcon(slot, opts) {
    var o = opts || {};
    var size = Number(o.size) || 30;
    var itemId = slot && slot.itemId;
    var extUrl = (itemId && INFINITY.ASSETS && typeof INFINITY.ASSETS.getIconUrl === 'function')
      ? INFINITY.ASSETS.getIconUrl(itemId)
      : null;
    if (extUrl) {
      return '<img class="synth-icon-img ' + escAttr(o.className || '') + '" src="' + escAttr(extUrl) + '" width="' + size + '" height="' + size + '" alt="">';
    }
    var vp = (slot && slot.vfxProfile) || {};
    var spec = {
      category: (slot && slot.category) || 'tech',
      tier: (slot && slot.tier) || 'B',
      motif: vp.motif || (slot && slot.motif) || 'cyber_tactical',
      archetype: (slot && slot.archetype) || null,
      primaryColor: vp.primaryColor || (slot && slot.color) || null,
      secondaryColor: vp.secondaryColor || null,
      size: size,
      className: 'synth-icon-svg ' + (o.className || ''),
      showBadge: o.showBadge !== false
    };
    return getIconSvg(spec);
  }

  function renderBasicAttackIcon(basic, opts) {
    var o = opts || {};
    var style = (basic && basic.style) || 'sword';
    var motifMap = {
      sword: 'sword_qi',
      cyber: 'cyber_tactical',
      occult: 'occult_meme',
      tactical: 'gravity_kinetic'
    };
    var archMap = {
      sword: 'sword_arc',
      cyber: 'rail_shot',
      occult: 'ward_circle',
      tactical: 'berserk_strike'
    };
    return getIconSvg({
      category: style === 'cyber' ? 'tech' : (style === 'occult' ? 'anomaly' : 'general'),
      tier: 'A',
      motif: motifMap[style] || 'sword_qi',
      archetype: archMap[style] || 'sword_arc',
      primaryColor: (basic && basic.color) || null,
      size: Number(o.size) || 28,
      className: 'synth-icon-svg ' + (o.className || ''),
      showBadge: false
    });
  }

  INFINITY.IconSynth = {
    getIconSvg: getIconSvg,
    resolveItemVisualSpec: resolveItemVisualSpec,
    renderItemIcon: renderItemIcon,
    renderSkillIcon: renderSkillIcon,
    renderBasicAttackIcon: renderBasicAttackIcon
  };
})(typeof window !== 'undefined' ? window : globalThis);
