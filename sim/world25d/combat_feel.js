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

    if (key === 'weakpoint') {
      var wpCol = overrideColor || '#ffe875';
      return {
        tier: 'weakpoint',
        fontSize: '18px',
        fontWeight: '900',
        color: wpCol,
        letterSpacing: '1.3px',
        textShadow: '0 0 14px rgba(255,232,117,0.95), 0 0 26px rgba(77,248,255,0.65), 0 2px 6px #000',
        ttl: 1.75,
        vy: 0.92,
        scalePop: 1.32
      };
    }

    if (key === 'mutation') {
      var mutCol = overrideColor || '#ff3b52';
      return {
        tier: 'mutation',
        fontSize: '18px',
        fontWeight: '900',
        color: mutCol,
        letterSpacing: '1.4px',
        textShadow: '0 0 16px rgba(255,41,66,0.95), 0 0 28px rgba(255,140,156,0.62), 0 2px 6px #000',
        ttl: 1.85,
        vy: 0.85,
        scalePop: 1.30
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

  // ---------------------------------------------------------------------------
  // 4. Boss Phase-2 Mutation Feel, Phantom Teleport VFX & Weakpoint Feedback
  // ---------------------------------------------------------------------------
  var BOSS_PHASE2_FEEL = {
    mutation_awakening: {
      hitStopSec: 0.11,
      impactInvertSec: 0.085,
      shakeAmp: 0.50,
      shakeDur: 0.42,
      shakeFreq: 42,
      glitchAmount: 0.78,
      fovPunch: -3.6,
      primaryColor: 0xff2238,
      secondaryColor: 0xffb3c1
    },
    phase2_blink: {
      hitStopSec: 0.035,
      shakeAmp: 0.34,
      shakeDur: 0.26,
      shakeFreq: 46,
      glitchAmount: 0.46,
      fovPunch: -2.2,
      trailSteps: 4,
      primaryColor: 0xff1e38,
      secondaryColor: 0xffdce2,
      sparkCount: 18
    },
    weakpoint_expose: {
      shakeAmp: 0.22,
      shakeDur: 0.18,
      shakeFreq: 32,
      primaryColor: 0xffe875,
      secondaryColor: 0x4df8ff,
      ringRadius: 3.1
    },
    weakpoint_hit: {
      hitStopSec: 0.085,
      impactInvertSec: 0.075,
      shakeAmp: 0.42,
      shakeDur: 0.28,
      shakeFreq: 44,
      fovPunch: -2.6,
      primaryColor: 0xffe875,
      secondaryColor: 0x4df8ff,
      sparkCount: 24
    }
  };

  function getBossPhase2Feel(eventKey) {
    return BOSS_PHASE2_FEEL[eventKey] || BOSS_PHASE2_FEEL.phase2_blink;
  }

  // Builds a chest-mounted Exposed Core Weakpoint Reticle attached to Inspector group
  function buildBossWeakpointVisual(THREE, parentGroup, trackGeo, trackMat) {
    if (!THREE || !parentGroup) return null;
    var wrapGeo = typeof trackGeo === 'function' ? trackGeo : function (g) { return g; };
    var wrapMat = typeof trackMat === 'function' ? trackMat : function (m) { return m; };

    var group = new THREE.Group();
    group.position.set(0, 1.48, 0.28);
    group.visible = false;

    // Pulsing golden-crimson core diamond
    var coreGeo = wrapGeo(new THREE.OctahedronGeometry(0.24, 0));
    var coreMat = wrapMat(new THREE.MeshBasicMaterial({
      color: 0xffe875,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.scale.set(0.85, 1.35, 0.85);
    group.add(coreMesh);

    // Outer target-lock reticle ring (rotates rapidly during exposure)
    var outerGeo = wrapGeo(new THREE.RingGeometry(0.42, 0.52, 6));
    var outerMat = wrapMat(new THREE.MeshBasicMaterial({
      color: 0x4df8ff,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var outerRing = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerRing);

    // Inner counter-rotating crimson fracture halo
    var innerGeo = wrapGeo(new THREE.RingGeometry(0.28, 0.34, 4));
    var innerMat = wrapMat(new THREE.MeshBasicMaterial({
      color: 0xff3b52,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var innerRing = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerRing);

    // Ground highlight ring beneath boss so weakpoint exposure reads clearly from 2.5D top-down camera
    var floorGeo = wrapGeo(new THREE.RingGeometry(1.05, 1.32, 28));
    floorGeo.rotateX(-Math.PI / 2);
    var floorMat = wrapMat(new THREE.MeshBasicMaterial({
      color: 0xffe875,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var floorRing = new THREE.Mesh(floorGeo, floorMat);
    floorRing.position.set(0, -1.36, -0.28);
    group.add(floorRing);

    parentGroup.add(group);
    return {
      group: group,
      coreMesh: coreMesh,
      coreMat: coreMat,
      outerRing: outerRing,
      outerMat: outerMat,
      innerRing: innerRing,
      innerMat: innerMat,
      floorRing: floorRing,
      floorMat: floorMat
    };
  }

  function updateBossWeakpointVisual(vis, state, elapsedReal) {
    if (!vis || !vis.group) return;
    var rem = Number(state && state.weakpointTimer) || 0;
    var maxT = Math.max(0.1, Number(state && state.weakpointMaxTimer) || 3.5);
    var visible = rem > 0 && !(state && state.alive === false);
    vis.group.visible = visible;
    if (!visible) return;

    var t = Number(elapsedReal) || 0;
    var urgency = clamp(1 - rem / maxT, 0, 1);
    var blinkFast = rem < 1.0 ? (0.55 + Math.abs(Math.sin(t * 28)) * 0.45) : 1.0;
    var pulse = 1.0 + Math.sin(t * 14) * 0.16;

    vis.coreMesh.rotation.y = t * 4.2;
    vis.coreMesh.scale.set(0.85 * pulse, 1.35 * pulse, 0.85 * pulse);
    vis.coreMat.opacity = clamp(0.92 * blinkFast, 0.25, 1.0);

    vis.outerRing.rotation.z = t * (3.2 + urgency * 3.5);
    vis.outerRing.scale.set(1.0 + Math.sin(t * 10) * 0.12, 1.0 + Math.sin(t * 10) * 0.12, 1);
    vis.outerMat.opacity = clamp(0.86 * blinkFast, 0.2, 0.96);

    vis.innerRing.rotation.z = -t * (4.8 + urgency * 3.0);
    vis.innerMat.opacity = clamp(0.82 * blinkFast, 0.2, 0.94);

    var floorSc = 0.92 + Math.sin(t * 9.5) * 0.14;
    vis.floorRing.scale.set(floorSc, floorSc, 1);
    vis.floorMat.opacity = clamp((0.52 + (1 - urgency) * 0.28) * blinkFast, 0.18, 0.85);
  }

  // Dramatic Phase-2 Phantom Teleport VFX: departure implosion -> rift trail -> arrival shockwave
  function spawnBossTeleportVfx(session, fromX, fromZ, toX, toZ, opts) {
    if (!session) return { triggered: false };
    var spec = BOSS_PHASE2_FEEL.phase2_blink;
    var o = opts || {};
    var facingLeft = Boolean(o.facingLeft);
    var steps = Math.max(2, Number(o.trailSteps) || spec.trailSteps);
    var primaryCol = o.primaryColor || spec.primaryColor;
    var secCol = o.secondaryColor || spec.secondaryColor;

    // 1. Departure implosion & phantom silhouette
    if (typeof session.spawnAfterimage === 'function') {
      session.spawnAfterimage(fromX, fromZ, 'inspector', facingLeft, primaryCol, 0.52, 'dash');
    }
    if (typeof session.spawnShockRing === 'function') {
      session.spawnShockRing(fromX, fromZ, 2.6, primaryCol, 0.32);
    }
    if (typeof session.spawnSparkBurst === 'function') {
      session.spawnSparkBurst(fromX, 1.25, fromZ, primaryCol, Math.round(spec.sparkCount * 0.7));
    }

    // 2. Spatial distortion rift beam & intermediate glitch ghosts
    if (typeof session.spawnLightningBolt === 'function') {
      session.spawnLightningBolt(fromX, 1.35, fromZ, toX, 1.35, toZ, primaryCol, 0.30, 8);
      session.spawnLightningBolt(fromX, 1.10, fromZ, toX, 1.10, toZ, secCol, 0.22, 6);
    }
    if (typeof session.spawnLaserBeam === 'function') {
      session.spawnLaserBeam(fromX, fromZ, toX, toZ, primaryCol, 0.26, {
        primaryColor: '#ff1e38',
        secondaryColor: '#ffdce2'
      });
    }
    if (typeof session.spawnAfterimage === 'function') {
      for (var i = 1; i < steps; i++) {
        var frac = i / steps;
        var gx = fromX + (toX - fromX) * frac;
        var gz = fromZ + (toZ - fromZ) * frac;
        session.spawnAfterimage(gx, gz, 'inspector', facingLeft, i % 2 === 0 ? secCol : primaryCol, 0.34 - frac * 0.08, 'dash');
      }
    }

    // 3. Arrival burst, camera trauma & glitch pulse
    if (typeof session.spawnShockRing === 'function') {
      session.spawnShockRing(toX, toZ, 3.8, primaryCol, 0.42);
      session.spawnShockRing(toX, toZ, 2.1, secCol, 0.26);
    }
    if (typeof session.spawnImpactStar === 'function') {
      session.spawnImpactStar(toX, 1.45, toZ, primaryCol, 2.6, 0.28);
    }
    if (typeof session.spawnSparkBurst === 'function') {
      session.spawnSparkBurst(toX, 1.3, toZ, primaryCol, spec.sparkCount);
    }
    if (typeof session.addCameraShake === 'function') {
      session.addCameraShake(spec.shakeAmp, spec.shakeDur, spec.shakeFreq);
    }
    if (typeof session.glitchAmount === 'number') {
      session.glitchAmount = Math.max(session.glitchAmount, spec.glitchAmount);
    }
    if (typeof session.camFovPunch === 'number') {
      session.camFovPunch = Math.min(session.camFovPunch, spec.fovPunch);
    }
    if (typeof session.hitStopTimer === 'number') {
      session.hitStopTimer = Math.max(session.hitStopTimer, spec.hitStopSec);
    }

    return {
      triggered: true,
      trailSteps: steps,
      shakeAmp: spec.shakeAmp,
      glitchAmount: spec.glitchAmount
    };
  }

  function triggerBossMutationAwakeningFeel(session, x, z, opts) {
    if (!session) return { triggered: false };
    var spec = BOSS_PHASE2_FEEL.mutation_awakening;
    var label = (opts && opts.callout) || '【二阶段变异 · 频段过载】';
    if (typeof session.addCameraShake === 'function') {
      session.addCameraShake(spec.shakeAmp, spec.shakeDur, spec.shakeFreq);
    }
    if (typeof session.triggerImpactFrame === 'function') {
      session.triggerImpactFrame(spec.impactInvertSec);
    }
    if (typeof session.hitStopTimer === 'number') {
      session.hitStopTimer = Math.max(session.hitStopTimer, spec.hitStopSec);
    }
    if (typeof session.glitchAmount === 'number') {
      session.glitchAmount = Math.max(session.glitchAmount, spec.glitchAmount);
    }
    if (typeof session.camFovPunch === 'number') {
      session.camFovPunch = spec.fovPunch;
    }
    if (typeof session.spawnShockRing === 'function') {
      session.spawnShockRing(x, z, 6.2, spec.primaryColor, 0.65);
      session.spawnShockRing(x, z, 3.6, spec.secondaryColor, 0.40);
    }
    if (typeof session.spawnImpactStar === 'function') {
      session.spawnImpactStar(x, 1.55, z, spec.primaryColor, 3.6, 0.42);
    }
    if (typeof session.spawnSparkBurst === 'function') {
      session.spawnSparkBurst(x, 1.4, z, spec.primaryColor, 28);
    }
    if (typeof session.spawnFloatingText === 'function') {
      session.spawnFloatingText(x, 3.15, z, label, '#ff3b52', 'mutation');
    }
    return { triggered: true, hitStopSec: spec.hitStopSec, glitchAmount: spec.glitchAmount };
  }

  function triggerBossWeakpointHitFeel(session, x, z, dmg, opts) {
    if (!session) return { triggered: false };
    var spec = BOSS_PHASE2_FEEL.weakpoint_hit;
    var label = (opts && opts.callout) || ('✦ 弱点贯通 -' + Math.round(Number(dmg) || 0));
    if (typeof session.addCameraShake === 'function') {
      session.addCameraShake(spec.shakeAmp, spec.shakeDur, spec.shakeFreq);
    }
    if (typeof session.triggerImpactFrame === 'function') {
      session.triggerImpactFrame(spec.impactInvertSec);
    }
    if (typeof session.hitStopTimer === 'number') {
      session.hitStopTimer = Math.max(session.hitStopTimer, spec.hitStopSec);
    }
    if (typeof session.camFovPunch === 'number') {
      session.camFovPunch = Math.min(session.camFovPunch, spec.fovPunch);
    }
    if (typeof session.spawnImpactStar === 'function') {
      session.spawnImpactStar(x, 1.5, z, spec.primaryColor, 3.0, 0.34);
    }
    if (typeof session.spawnShockRing === 'function') {
      session.spawnShockRing(x, z, 3.6, spec.secondaryColor, 0.42);
      session.spawnShockRing(x, z, 2.2, spec.primaryColor, 0.28);
    }
    if (typeof session.spawnSparkBurst === 'function') {
      session.spawnSparkBurst(x, 1.45, z, spec.primaryColor, spec.sparkCount);
    }
    if (typeof session.spawnFloatingText === 'function') {
      session.spawnFloatingText(x, 2.85, z, label, '#ffe875', 'weakpoint');
    }
    return { triggered: true, hitStopSec: spec.hitStopSec };
  }

  INFINITY.CombatFeel = {
    ARCHETYPE_FEEL: ARCHETYPE_FEEL,
    SHAKE_BUDGET_DEFAULTS: SHAKE_BUDGET_DEFAULTS,
    BOSS_PHASE2_FEEL: BOSS_PHASE2_FEEL,
    getArchetypeFeel: getArchetypeFeel,
    getBossPhase2Feel: getBossPhase2Feel,
    supportsAimPreview: supportsAimPreview,
    createShakeBudget: createShakeBudget,
    getFloatingTextStyle: getFloatingTextStyle,
    buildBossWeakpointVisual: buildBossWeakpointVisual,
    updateBossWeakpointVisual: updateBossWeakpointVisual,
    spawnBossTeleportVfx: spawnBossTeleportVfx,
    triggerBossMutationAwakeningFeel: triggerBossMutationAwakeningFeel,
    triggerBossWeakpointHitFeel: triggerBossWeakpointHitFeel
  };
})(typeof window !== 'undefined' ? window : globalThis);

