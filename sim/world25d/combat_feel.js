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

    if (key === 'onomatopoeia') {
      var onoCol = overrideColor || '#fff4d4';
      return {
        tier: 'onomatopoeia',
        fontSize: '34px',
        fontWeight: '900',
        fontFamily: '"Noto Serif SC","Songti SC","STSong","PingFang SC",serif',
        color: onoCol,
        letterSpacing: '2px',
        textShadow: '-3px -3px 0 #05070c, 3px -3px 0 #05070c, -3px 3px 0 #05070c, 3px 3px 0 #05070c, 0 6px 18px rgba(0,0,0,0.95)',
        ttl: 0.62,
        vy: 0.55,
        scalePop: 1.55,
        tiltDeg: -10
      };
    }

    if (key === 'parry') {
      var parryCol = overrideColor || (sem ? sem.parryGold : '#ffd86b');
      return {
        tier: 'parry',
        fontSize: '21px',
        fontWeight: '900',
        fontFamily: '"Noto Serif SC","Songti SC","PingFang SC",serif',
        color: parryCol,
        letterSpacing: '1.6px',
        textShadow: '-2px -2px 0 #06080e, 2px -2px 0 #06080e, -2px 2px 0 #06080e, 2px 2px 0 #06080e, 0 0 16px rgba(255,216,107,0.92), 0 4px 10px #000',
        ttl: 1.55,
        vy: 0.95,
        scalePop: 1.38,
        tiltDeg: -6
      };
    }

    if (key === 'resonance') {
      var resCol = overrideColor || '#c89eff';
      return {
        tier: 'resonance',
        fontSize: '17px',
        fontWeight: '900',
        fontFamily: '"Noto Serif SC","Songti SC","PingFang SC",serif',
        color: resCol,
        letterSpacing: '1.2px',
        textShadow: '-2px -2px 0 #06080e, 2px 2px 0 #06080e, 0 0 14px rgba(200,158,255,0.88), 0 3px 8px #000',
        ttl: 1.45,
        vy: 1.02,
        scalePop: 1.24,
        tiltDeg: -4
      };
    }

    if (key === 'crit') {
      var critCol = overrideColor || (sem ? sem.warning : '#ffbe48');
      return {
        tier: 'crit',
        fontSize: '20px',
        fontWeight: '900',
        fontFamily: '"Noto Serif SC","Songti SC","PingFang SC",serif',
        color: critCol,
        letterSpacing: '1px',
        textShadow: '-2px -2px 0 #06080e, 2px -2px 0 #06080e, -2px 2px 0 #06080e, 2px 2px 0 #06080e, 0 0 12px rgba(255,170,59,0.82), 0 3px 6px #000',
        ttl: 1.25,
        vy: 1.15,
        scalePop: 1.30,
        tiltDeg: -7
      };
    }

    return {
      tier: 'normal',
      fontSize: '14px',
      fontWeight: '900',
      fontFamily: '"JetBrains Mono","PingFang SC",sans-serif',
      color: overrideColor || '#edf3fa',
      letterSpacing: '0.5px',
      textShadow: '-1.5px -1.5px 0 #05070c, 1.5px 1.5px 0 #05070c, 0 2px 5px #000',
      ttl: 1.05,
      vy: 1.32,
      scalePop: 1.12,
      tiltDeg: -3
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Limbus-Style Director Timeline (Camera Zoom, Letterbox, Chromatic, Ink)
  // ---------------------------------------------------------------------------
  function createDirectorTimeline() {
    var zoomTarget = 1.0;
    var zoomCurrent = 1.0;
    var zoomHold = 0;
    var letterboxTarget = 0;
    var letterboxCurrent = 0;
    var letterboxHold = 0;
    var chromatic = 0;
    var inkEdge = 0;

    return {
      triggerBeat: function (opts) {
        var o = opts || {};
        var reqHold = clamp(Number(o.holdSec) || 0.36, 0.10, 1.2);
        if (typeof o.zoom === 'number') {
          var reqZoom = clamp(o.zoom, 0.54, 1.0);
          // Only refresh zoomHold if the new beat is tighter than or equal to current zoom, or previous hold expired
          if (zoomHold <= 0 || reqZoom <= zoomTarget + 0.02) {
            zoomTarget = Math.min(zoomHold > 0 ? zoomTarget : 1.0, reqZoom);
            zoomHold = Math.max(zoomHold, reqHold);
          }
        }
        if (typeof o.letterbox === 'number' && o.letterbox > 0) {
          letterboxTarget = Math.max(letterboxTarget, clamp(o.letterbox, 0, 0.11));
          letterboxHold = Math.max(letterboxHold, reqHold);
        }
        if (typeof o.chromatic === 'number') {
          chromatic = Math.max(chromatic, clamp(o.chromatic, 0, 1.0));
        }
        if (typeof o.inkEdge === 'number') {
          inkEdge = Math.max(inkEdge, clamp(o.inkEdge, 0, 1.0));
        }
      },
      step: function (dt, inCombat) {
        var safeDt = clamp(Number(dt) || 0.016, 0, 0.08);
        if (zoomHold > 0) {
          zoomHold = Math.max(0, zoomHold - safeDt);
        } else {
          zoomTarget = inCombat ? 0.80 : 1.0;
        }
        if (letterboxHold > 0) {
          letterboxHold = Math.max(0, letterboxHold - safeDt);
        } else {
          letterboxTarget = 0;
        }
        var zSpeed = zoomTarget < zoomCurrent ? 14.0 : 5.8;
        zoomCurrent += (zoomTarget - zoomCurrent) * (1 - Math.exp(-zSpeed * safeDt));
        var lbSpeed = letterboxTarget > letterboxCurrent ? 16.0 : 7.5;
        letterboxCurrent += (letterboxTarget - letterboxCurrent) * (1 - Math.exp(-lbSpeed * safeDt));
        chromatic *= Math.exp(-9.5 * safeDt);
        inkEdge *= Math.exp(-7.8 * safeDt);
        if (chromatic < 0.004) chromatic = 0;
        if (inkEdge < 0.004) inkEdge = 0;
        return {
          zoom: zoomCurrent,
          letterbox: letterboxCurrent,
          chromatic: chromatic,
          inkEdge: inkEdge
        };
      },
      reset: function () {
        zoomTarget = 1.0;
        zoomCurrent = 1.0;
        zoomHold = 0;
        letterboxTarget = 0;
        letterboxCurrent = 0;
        letterboxHold = 0;
        chromatic = 0;
        inkEdge = 0;
      }
    };
  }

  INFINITY.CombatFeel = {
    ARCHETYPE_FEEL: ARCHETYPE_FEEL,
    SHAKE_BUDGET_DEFAULTS: SHAKE_BUDGET_DEFAULTS,
    getArchetypeFeel: getArchetypeFeel,
    supportsAimPreview: supportsAimPreview,
    createShakeBudget: createShakeBudget,
    createDirectorTimeline: createDirectorTimeline,
    getFloatingTextStyle: getFloatingTextStyle
  };
})(typeof window !== 'undefined' ? window : globalThis);
