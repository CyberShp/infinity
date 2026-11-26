/* ============================================================================
 * INFINITY // COMBAT FEEL, AIM PREVIEW & SHAKE BUDGET (sim/world25d/combat_feel.js)
 * Classic non-module script exposing window.INFINITY.CombatFeel
 *
 * Centralizes:
 *   1. Per-archetype combat feel & cast preview specs (ARCHETYPE_FEEL)
 *      - Instant / parry / survival archetypes fire immediately on key press
 *        (previewMode: 'instant') so parry and dodge responsiveness stay crisp.
 *      - Area / ballistic / deployable archetypes support hold-to-preview,
 *        release-to-cast, RMB/Esc-to-cancel ('aim_circle' | 'aim_line').
 *   2. Shake budget manager with hard amplitude cap & smooth exponential decay
 *      so rapid multi-casts never cause motion sickness.
 *   3. Tiered floating damage / callout typography ('normal' | 'crit' | 'parry' | 'resonance').
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function getArtTokens() {
    return INFINITY.ArtTokens || null;
  }

  // ---------------------------------------------------------------------------
  // 1. 14-Archetype Combat Feel & Cast Preview Table
  // ---------------------------------------------------------------------------
  var ARCHETYPE_FEEL = {
    // Instant / Parry / Survival — never gated by hold-preview
    sword_arc: {
      archetype: 'sword_arc',
      windupSec: 0.0,
      hitStopMs: 55,
      parryHitStopMs: 80,
      shakeAmp: 0.24,
      shakeFreq: 34,
      fovPunch: -1.1,
      flashAlpha: 0.0,
      previewMode: 'instant'
    },
    blink_mark: {
      archetype: 'blink_mark',
      windupSec: 0.0,
      hitStopMs: 0,
      shakeAmp: 0.14,
      shakeFreq: 28,
      fovPunch: -2.2,
      flashAlpha: 0.08,
      previewMode: 'instant'
    },
    aegis_shield: {
      archetype: 'aegis_shield',
      windupSec: 0.0,
      hitStopMs: 25,
      shakeAmp: 0.12,
      shakeFreq: 24,
      fovPunch: -0.8,
      flashAlpha: 0.06,
      previewMode: 'instant'
    },
    overclock: {
      archetype: 'overclock',
      windupSec: 0.0,
      hitStopMs: 0,
      shakeAmp: 0.16,
      shakeFreq: 36,
      fovPunch: 2.6,
      flashAlpha: 0.10,
      previewMode: 'instant'
    },
    heal_pulse: {
      archetype: 'heal_pulse',
      windupSec: 0.0,
      hitStopMs: 0,
      shakeAmp: 0.08,
      shakeFreq: 18,
      fovPunch: -0.6,
      flashAlpha: 0.08,
      previewMode: 'instant'
    },
    stealth_veil: {
      archetype: 'stealth_veil',
      windupSec: 0.0,
      hitStopMs: 0,
      shakeAmp: 0.06,
      shakeFreq: 20,
      fovPunch: -1.2,
      flashAlpha: 0.0,
      previewMode: 'instant'
    },

    // Area / Ballistic / Deployable — hold 1-4 to preview, release to cast, RMB/Esc to cancel
    ward_circle: {
      archetype: 'ward_circle',
      windupSec: 0.10,
      hitStopMs: 20,
      shakeAmp: 0.16,
      shakeFreq: 22,
      fovPunch: -0.9,
      flashAlpha: 0.06,
      previewMode: 'aim_circle',
      previewMaxRange: 2.0,
      previewOffsetForward: 1.1
    },
    emp_blast: {
      archetype: 'emp_blast',
      windupSec: 0.12,
      hitStopMs: 65,
      shakeAmp: 0.38,
      shakeFreq: 40,
      fovPunch: 1.8,
      flashAlpha: 0.18,
      previewMode: 'aim_circle',
      previewMaxRange: 11.5
    },
    rail_shot: {
      archetype: 'rail_shot',
      windupSec: 0.11,
      hitStopMs: 60,
      shakeAmp: 0.32,
      shakeFreq: 42,
      fovPunch: 2.0,
      flashAlpha: 0.14,
      previewMode: 'aim_line',
      previewLength: 22.0,
      previewWidth: 0.55
    },
    seal_chain: {
      archetype: 'seal_chain',
      windupSec: 0.10,
      hitStopMs: 45,
      shakeAmp: 0.22,
      shakeFreq: 30,
      fovPunch: -1.3,
      flashAlpha: 0.10,
      previewMode: 'aim_circle',
      previewSelfOrigin: true,
      previewMinRadius: 10.5
    },
    recon_pulse: {
      archetype: 'recon_pulse',
      windupSec: 0.09,
      hitStopMs: 0,
      shakeAmp: 0.10,
      shakeFreq: 20,
      fovPunch: 1.1,
      flashAlpha: 0.05,
      previewMode: 'aim_circle',
      previewSelfOrigin: true
    },
    turret_drone: {
      archetype: 'turret_drone',
      windupSec: 0.10,
      hitStopMs: 0,
      shakeAmp: 0.12,
      shakeFreq: 24,
      fovPunch: -0.5,
      flashAlpha: 0.05,
      previewMode: 'aim_circle',
      previewMaxRange: 2.5,
      previewOffsetForward: 1.2
    },
    decoy_flare: {
      archetype: 'decoy_flare',
      windupSec: 0.09,
      hitStopMs: 0,
      shakeAmp: 0.10,
      shakeFreq: 24,
      fovPunch: 0.4,
      flashAlpha: 0.04,
      previewMode: 'aim_circle',
      previewMaxRange: 11.0
    },
    berserk_strike: {
      archetype: 'berserk_strike',
      windupSec: 0.14,
      hitStopMs: 75,
      shakeAmp: 0.44,
      shakeFreq: 38,
      fovPunch: -2.4,
      flashAlpha: 0.20,
      previewMode: 'aim_line',
      previewLength: 4.8,
      previewWidth: 1.4
    }
  };

  var DEFAULT_FEEL = {
    archetype: 'default',
    windupSec: 0.0,
    hitStopMs: 40,
    shakeAmp: 0.18,
    shakeFreq: 28,
    fovPunch: 0.0,
    flashAlpha: 0.0,
    previewMode: 'instant'
  };

  function getArchetypeFeel(archetypeId) {
    return ARCHETYPE_FEEL[archetypeId] || DEFAULT_FEEL;
  }

  function supportsAimPreview(archetypeId) {
    var f = getArchetypeFeel(archetypeId);
    return f.previewMode === 'aim_circle' || f.previewMode === 'aim_line';
  }

  // ---------------------------------------------------------------------------
  // 2. Shake Budget Manager (Hard Cap + Trauma Decay + Harmonic Oscillation)
  // ---------------------------------------------------------------------------
  var SHAKE_BUDGET_DEFAULTS = {
    maxAmplitude: 0.52,
    maxDuration: 0.45,
    decayRate: 7.2,
    defaultFreq: 30.0
  };

  function createShakeBudget(opts) {
    var cfg = Object.assign({}, SHAKE_BUDGET_DEFAULTS, opts || {});
    var amp = 0;
    var timer = 0;
    var freq = cfg.defaultFreq;
    var phase = 0;
    var impulseBudget = 1.0;

    return {
      add: function (amount, duration, customFreq) {
        var reqAmp = Math.max(0, Number(amount) || 0);
        if (reqAmp <= 0) return;
        // Diminishing returns when stacking multiple shakes in rapid succession
        var scale = 0.45 + 0.55 * impulseBudget;
        var nextAmp = amp + reqAmp * scale * 0.65;
        amp = clamp(Math.max(amp, nextAmp), 0, cfg.maxAmplitude);
        timer = clamp(Math.max(timer, Number(duration) || 0.22), 0, cfg.maxDuration);
        if (typeof customFreq === 'number' && customFreq > 0) {
          freq = clamp(customFreq, 12, 55);
        }
        impulseBudget = Math.max(0.15, impulseBudget - 0.35);
      },
      step: function (dt) {
        var safeDt = clamp(Number(dt) || 0.016, 0, 0.1);
        impulseBudget = Math.min(1.0, impulseBudget + safeDt * 1.6);
        if (timer <= 0 || amp <= 0.001) {
          amp = 0;
          timer = 0;
          return { x: 0, y: 0, active: false };
        }
        timer = Math.max(0, timer - safeDt);
        phase += safeDt * freq;
        var envelope = amp * (timer > 0 ? 1 : 0);
        var sx = (Math.sin(phase * 1.13) * 0.68 + Math.sin(phase * 2.41 + 1.3) * 0.32) * envelope;
        var sy = (Math.cos(phase * 1.37 + 0.7) * 0.65 + Math.sin(phase * 2.83) * 0.35) * envelope * 0.68;
        amp *= Math.exp(-cfg.decayRate * safeDt);
        if (amp < 0.002) {
          amp = 0;
          timer = 0;
        }
        return { x: sx, y: sy, active: true };
      },
      getAmplitude: function () {
        return amp;
      },
      getMaxAmplitude: function () {
        return cfg.maxAmplitude;
      },
      reset: function () {
        amp = 0;
        timer = 0;
        phase = 0;
        impulseBudget = 1.0;
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Tiered Floating Damage / Callout Typography
  //    tier: 'normal' | 'crit' | 'parry' | 'resonance'
  // ---------------------------------------------------------------------------
  function getFloatingTextStyle(tier, overrideColor) {
    var tokens = getArtTokens();
    var sem = tokens && tokens.SEMANTIC ? tokens.SEMANTIC : null;
    var key = String(tier || 'normal');

    if (key === 'parry') {
      var parryCol = overrideColor || (sem ? sem.parryGold : '#ffd86b');
      return {
        tier: 'parry',
        fontSize: '17px',
        fontWeight: '900',
        color: parryCol,
        letterSpacing: '1.2px',
        textShadow: '0 0 14px rgba(255,216,107,0.92), 0 0 24px rgba(255,196,70,0.65), 0 2px 6px #000',
        ttl: 1.65,
        vy: 1.0,
        scalePop: 1.25
      };
    }

    if (key === 'resonance') {
      var resCol = overrideColor || '#c89eff';
      return {
        tier: 'resonance',
        fontSize: '15px',
        fontWeight: '900',
        color: resCol,
        letterSpacing: '1.0px',
        textShadow: '0 0 12px rgba(200,158,255,0.85), 0 0 20px rgba(82,229,255,0.45), 0 2px 5px #000',
        ttl: 1.55,
        vy: 1.08,
        scalePop: 1.18
      };
    }

    if (key === 'crit') {
      var critCol = overrideColor || (sem ? sem.warning : '#ffaa3b');
      return {
        tier: 'crit',
        fontSize: '15px',
        fontWeight: '900',
        color: critCol,
        letterSpacing: '0.8px',
        textShadow: '0 0 10px rgba(255,170,59,0.78), 0 2px 5px #000',
        ttl: 1.35,
        vy: 1.2,
        scalePop: 1.14
      };
    }

    return {
      tier: 'normal',
      fontSize: '12px',
      fontWeight: '800',
      color: overrideColor || '#edf3fa',
      letterSpacing: '0.4px',
      textShadow: '0 1px 4px #000, 0 0 8px rgba(0,0,0,0.95)',
      ttl: 1.12,
      vy: 1.35,
      scalePop: 1.0
    };
  }

  INFINITY.CombatFeel = {
    ARCHETYPE_FEEL: ARCHETYPE_FEEL,
    SHAKE_BUDGET_DEFAULTS: SHAKE_BUDGET_DEFAULTS,
    getArchetypeFeel: getArchetypeFeel,
    supportsAimPreview: supportsAimPreview,
    createShakeBudget: createShakeBudget,
    getFloatingTextStyle: getFloatingTextStyle
  };
})(typeof window !== 'undefined' ? window : globalThis);
