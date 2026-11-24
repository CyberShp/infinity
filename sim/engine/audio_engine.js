/**
 * Infinity Living Simulator — Procedural Web Audio Soundscape & Tactical SFX Engine
 * Attaches to window.INFINITY.Audio
 * Zero external audio assets; smooth linearRampToValueAtTime transitions throughout.
 */
(function () {
  'use strict';

  window.INFINITY = window.INFINITY || {};

  var ctx = null;
  var masterGain = null;
  var ambienceBus = null;
  var ambienceFilter = null;
  var sfxBus = null;
  var compressor = null;

  var pinkBuffer = null;
  var whiteBuffer = null;

  var unlocked = false;
  var muted = false;
  var volume = 0.65;
  var currentScene = null;
  var threatLevel = 0; // 0..100

  var activeNodes = [];
  var activeIntervals = [];
  var heartbeatTimer = null;
  var watchTickTimer = null;
  var shimmerTimer = null;
  var activeSceneGain = null;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function createNoiseBuffers(audioCtx) {
    var sr = audioCtx.sampleRate;
    var length = sr * 3;

    var wBuf = audioCtx.createBuffer(1, length, sr);
    var wData = wBuf.getChannelData(0);
    for (var i = 0; i < length; i++) {
      wData[i] = Math.random() * 2 - 1;
    }

    var pBuf = audioCtx.createBuffer(1, length, sr);
    var pData = pBuf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var j = 0; j < length; j++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pData[j] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    whiteBuffer = wBuf;
    pinkBuffer = pBuf;
  }

  function ensureContext() {
    if (ctx) return true;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      ctx = new AudioCtx();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(18, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.006, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0.0001 : volume, ctx.currentTime);

      ambienceFilter = ctx.createBiquadFilter();
      ambienceFilter.type = 'lowpass';
      ambienceFilter.frequency.setValueAtTime(3200, ctx.currentTime);
      ambienceFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      ambienceBus = ctx.createGain();
      ambienceBus.gain.setValueAtTime(0.85, ctx.currentTime);

      sfxBus = ctx.createGain();
      sfxBus.gain.setValueAtTime(1.0, ctx.currentTime);

      ambienceBus.connect(ambienceFilter);
      ambienceFilter.connect(compressor);
      sfxBus.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      createNoiseBuffers(ctx);
      return true;
    } catch (err) {
      ctx = null;
      return false;
    }
  }

  function clearSceneTimers() {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (watchTickTimer) {
      clearTimeout(watchTickTimer);
      watchTickTimer = null;
    }
    if (shimmerTimer) {
      clearTimeout(shimmerTimer);
      shimmerTimer = null;
    }
    for (var i = 0; i < activeIntervals.length; i++) {
      clearInterval(activeIntervals[i]);
    }
    activeIntervals = [];
  }

  function fadeOutCurrentScene() {
    clearSceneTimers();
    if (!ctx) {
      activeNodes = [];
      activeSceneGain = null;
      return;
    }

    var now = ctx.currentTime;
    var oldGain = activeSceneGain;
    var oldNodes = activeNodes.slice();
    activeNodes = [];
    activeSceneGain = null;

    if (oldGain) {
      try {
        oldGain.gain.cancelScheduledValues(now);
        oldGain.gain.setValueAtTime(Math.max(oldGain.gain.value, 0.0001), now);
        oldGain.gain.linearRampToValueAtTime(0.0001, now + 0.65);
      } catch (_) {}
    }

    setTimeout(function () {
      for (var i = 0; i < oldNodes.length; i++) {
        try {
          if (typeof oldNodes[i].stop === 'function') oldNodes[i].stop();
        } catch (_) {}
        try {
          if (typeof oldNodes[i].disconnect === 'function') oldNodes[i].disconnect();
        } catch (_) {}
      }
      if (oldGain) {
        try { oldGain.disconnect(); } catch (_) {}
      }
    }, 760);
  }

  function makeNoiseLoop(buffer, filterType, freq, q, gainVal, dest) {
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    var filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.Q.setValueAtTime(q, ctx.currentTime);

    var g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);

    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start();

    activeNodes.push(src, filter, g);
    return { src: src, filter: filter, gain: g };
  }

  function makeOsc(type, freq, gainVal, dest) {
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    var g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);

    osc.connect(g);
    g.connect(dest);
    osc.start();

    activeNodes.push(osc, g);
    return { osc: osc, gain: g };
  }

  function playHeartbeatPulse(intensity) {
    if (!ctx || muted || ctx.state !== 'running') return;
    var now = ctx.currentTime;
    var amp = clamp(0.08 + intensity * 0.24, 0.06, 0.34);

    function thump(offset, startFreq, endFreq, peakGain) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(140, now + offset);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + offset + 0.14);

      g.gain.setValueAtTime(0.0001, now + offset);
      g.gain.linearRampToValueAtTime(peakGain, now + offset + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);

      osc.connect(lp);
      lp.connect(g);
      g.connect(sfxBus);
      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
    }

    thump(0, 68, 33, amp);
    thump(0.19, 56, 29, amp * 0.68);
  }

  function scheduleHeartbeatLoop(isCrisis) {
    if (!ctx || (currentScene !== 'station_tense' && currentScene !== 'crisis')) return;

    var effThreat = isCrisis ? Math.max(82, threatLevel) : threatLevel;
    var intensity = clamp(effThreat / 100, 0.15, 1);

    if (isCrisis || effThreat >= 18) {
      playHeartbeatPulse(intensity);
    }

    // BPM scales from ~54 bpm to ~118 bpm
    var bpm = isCrisis ? 108 : (54 + intensity * 62);
    var ms = Math.round(60000 / bpm);
    heartbeatTimer = setTimeout(function () {
      scheduleHeartbeatLoop(currentScene === 'crisis');
    }, ms);
  }

  function playWatchTick(subtle) {
    if (!ctx || muted || ctx.state !== 'running') return;
    var now = ctx.currentTime;

    var src = ctx.createBufferSource();
    src.buffer = whiteBuffer;

    var hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(4200, now);
    hp.Q.setValueAtTime(6, now);

    var g = ctx.createGain();
    var peak = subtle ? 0.032 : 0.055;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    src.connect(hp);
    hp.connect(g);
    g.connect(sfxBus);
    src.start(now);
    src.stop(now + 0.025);
  }

  function scheduleWatchTick() {
    if (!ctx || (currentScene !== 'station_tense' && currentScene !== 'crisis')) return;
    playWatchTick(currentScene !== 'crisis');
    var intervalMs = currentScene === 'crisis' ? 500 : 1000;
    watchTickTimer = setTimeout(scheduleWatchTick, intervalMs);
  }

  function scheduleHallShimmer() {
    if (!ctx || currentScene !== 'hall') return;
    if (!muted && ctx.state === 'running') {
      var now = ctx.currentTime;
      var notes = [587.33, 659.25, 880.0, 1046.5, 1174.66];
      var f = notes[Math.floor(Math.random() * notes.length)];
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.018, now + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(g);
      g.connect(ambienceBus);
      osc.start(now);
      osc.stop(now + 3.3);
    }
    shimmerTimer = setTimeout(scheduleHallShimmer, 5200 + Math.random() * 5400);
  }

  function scheduleStationRailGroan() {
    if (!ctx || (currentScene !== 'station_calm' && currentScene !== 'station_tense')) return;
    if (!muted && ctx.state === 'running') {
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var bp = ctx.createBiquadFilter();
      var g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(62 + Math.random() * 14, now);
      osc.frequency.linearRampToValueAtTime(51, now + 2.8);

      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(210, now);
      bp.Q.setValueAtTime(7, now);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.026, now + 1.1);
      g.gain.linearRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(bp);
      bp.connect(g);
      g.connect(ambienceBus);
      osc.start(now);
      osc.stop(now + 3.4);
    }
    shimmerTimer = setTimeout(scheduleStationRailGroan, 8500 + Math.random() * 7500);
  }

  function applyThreatFilter() {
    if (!ctx || !ambienceFilter) return;
    var now = ctx.currentTime;
    var targetFreq = 3000;
    var targetQ = 0.8;

    if (currentScene === 'crisis') {
      targetFreq = 220;
      targetQ = 2.6;
    } else if (currentScene === 'station_tense') {
      var t = clamp(threatLevel / 100, 0, 1);
      targetFreq = 2400 - t * 1850; // tightens down toward 550Hz
      targetQ = 1.0 + t * 2.2;
    } else if (currentScene === 'station_calm') {
      targetFreq = 2600;
      targetQ = 0.9;
    } else if (currentScene === 'hall') {
      targetFreq = 1800;
      targetQ = 1.2;
    } else if (currentScene === 'settlement') {
      targetFreq = 2200;
      targetQ = 0.7;
    }

    try {
      ambienceFilter.frequency.cancelScheduledValues(now);
      ambienceFilter.frequency.setValueAtTime(ambienceFilter.frequency.value, now);
      ambienceFilter.frequency.linearRampToValueAtTime(targetFreq, now + 0.55);
      ambienceFilter.Q.linearRampToValueAtTime(targetQ, now + 0.55);
    } catch (_) {}
  }

  function buildScene(mode) {
    if (!ctx) return;
    fadeOutCurrentScene();

    var now = ctx.currentTime;
    var sceneGain = ctx.createGain();
    sceneGain.gain.setValueAtTime(0.0001, now);
    sceneGain.gain.linearRampToValueAtTime(1.0, now + 1.1);
    sceneGain.connect(ambienceBus);
    activeSceneGain = sceneGain;

    if (mode === 'hall') {
      // Obsidian sub-harmonic crimson vortex drone
      var droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(240, now);
      droneFilter.Q.setValueAtTime(2.8, now);
      droneFilter.connect(sceneGain);
      activeNodes.push(droneFilter);

      // Slow resonant LFO sweep
      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.09, now);
      lfoGain.gain.setValueAtTime(85, now);
      lfo.connect(lfoGain);
      lfoGain.connect(droneFilter.frequency);
      lfo.start();
      activeNodes.push(lfo, lfoGain);

      makeOsc('sine', 43.65, 0.22, droneFilter);     // F1 sub
      makeOsc('triangle', 43.95, 0.10, droneFilter); // detuned shimmer
      makeOsc('sawtooth', 65.41, 0.045, droneFilter);// C2 dark fifth
      makeOsc('sine', 130.81, 0.032, droneFilter);   // C3 aura
      makeNoiseLoop(pinkBuffer, 'bandpass', 190, 1.4, 0.075, sceneGain);

      scheduleHallShimmer();
    } else if (mode === 'station_calm') {
      // Cold underground station fluorescent/HVAC hum + damp mist airflow
      makeOsc('sine', 50, 0.055, sceneGain);
      makeOsc('triangle', 100, 0.018, sceneGain);
      makeOsc('sine', 150, 0.009, sceneGain);
      makeNoiseLoop(pinkBuffer, 'bandpass', 420, 0.7, 0.12, sceneGain);
      makeNoiseLoop(pinkBuffer, 'highpass', 1800, 0.6, 0.022, sceneGain);
      scheduleStationRailGroan();
    } else if (mode === 'station_tense') {
      // Tighter station hum + low ominous sub + heartbeat + wristwatch tick
      makeOsc('sine', 48, 0.09, sceneGain);
      makeOsc('sawtooth', 96, 0.024, sceneGain);
      makeNoiseLoop(pinkBuffer, 'bandpass', 320, 1.3, 0.10, sceneGain);
      scheduleStationRailGroan();
      scheduleHeartbeatLoop(false);
      scheduleWatchTick();
    } else if (mode === 'crisis') {
      // Vacuum-drop tension sheen + heavy heartbeat + rapid watch tick
      var sheen = makeOsc('sine', 1760, 0.014, sfxBus); // bypasses ambience vacuum cut slightly
      var sheen2 = makeOsc('sine', 1766, 0.011, sfxBus);
      var subHold = makeOsc('sine', 38, 0.14, sceneGain);
      activeNodes.push(sheen.osc, sheen.gain, sheen2.osc, sheen2.gain, subHold.osc, subHold.gain);

      // Immediate vacuum cut sweep
      try {
        ambienceFilter.frequency.cancelScheduledValues(now);
        ambienceFilter.frequency.setValueAtTime(ambienceFilter.frequency.value, now);
        ambienceFilter.frequency.exponentialRampToValueAtTime(135, now + 0.28);
      } catch (_) {}

      scheduleHeartbeatLoop(true);
      scheduleWatchTick();
    } else if (mode === 'settlement') {
      // Dignified dark amber chord pad
      var padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(480, now);
      padFilter.connect(sceneGain);
      activeNodes.push(padFilter);

      makeOsc('sine', 73.42, 0.11, padFilter);   // D2
      makeOsc('triangle', 110.0, 0.06, padFilter); // A2
      makeOsc('sine', 164.81, 0.04, padFilter);  // E3
      makeOsc('sine', 220.0, 0.025, padFilter);  // A3
      makeNoiseLoop(pinkBuffer, 'lowpass', 300, 0.6, 0.03, sceneGain);
    }

    applyThreatFilter();
  }

  function playSfxInternal(name) {
    if (!ctx || muted) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    var now = ctx.currentTime;

    if (name === 'ui_tick') {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.018);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.075, now + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);
      osc.connect(g);
      g.connect(sfxBus);
      osc.start(now);
      osc.stop(now + 0.03);
      return;
    }

    if (name === 'vortex_buy') {
      // Deep vortex sweep + warm bronze lock
      var o1 = ctx.createOscillator();
      var g1 = ctx.createGain();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(110, now);
      o1.frequency.exponentialRampToValueAtTime(330, now + 0.22);
      g1.gain.setValueAtTime(0.0001, now);
      g1.gain.linearRampToValueAtTime(0.14, now + 0.04);
      g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      o1.connect(g1);
      g1.connect(sfxBus);
      o1.start(now);
      o1.stop(now + 0.42);

      var o2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(659.25, now + 0.09);
      g2.gain.setValueAtTime(0.0001, now + 0.09);
      g2.gain.linearRampToValueAtTime(0.09, now + 0.11);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      o2.connect(g2);
      g2.connect(sfxBus);
      o2.start(now + 0.09);
      o2.stop(now + 0.6);
      return;
    }

    if (name === 'fusion') {
      // Two voices converging + sub impact + crystalline bloom
      var fa = ctx.createOscillator();
      var fb = ctx.createOscillator();
      var fg = ctx.createGain();
      fa.type = 'sawtooth';
      fb.type = 'triangle';
      fa.frequency.setValueAtTime(146.83, now);
      fa.frequency.exponentialRampToValueAtTime(440, now + 0.55);
      fb.frequency.setValueAtTime(659.25, now);
      fb.frequency.exponentialRampToValueAtTime(440, now + 0.55);

      var flp = ctx.createBiquadFilter();
      flp.type = 'lowpass';
      flp.frequency.setValueAtTime(400, now);
      flp.frequency.exponentialRampToValueAtTime(3200, now + 0.55);

      fg.gain.setValueAtTime(0.0001, now);
      fg.gain.linearRampToValueAtTime(0.13, now + 0.48);
      fg.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

      fa.connect(flp);
      fb.connect(flp);
      flp.connect(fg);
      fg.connect(sfxBus);
      fa.start(now);
      fb.start(now);
      fa.stop(now + 1.2);
      fb.stop(now + 1.2);

      // Sub impact at convergence
      var sub = ctx.createOscillator();
      var sg = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now + 0.52);
      sub.frequency.exponentialRampToValueAtTime(36, now + 1.0);
      sg.gain.setValueAtTime(0.0001, now + 0.52);
      sg.gain.linearRampToValueAtTime(0.24, now + 0.54);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
      sub.connect(sg);
      sg.connect(sfxBus);
      sub.start(now + 0.52);
      sub.stop(now + 1.2);
      return;
    }

    if (name === 'footstep') {
      // Wet concrete tactical step (double micro-thump)
      [0, 0.16].forEach(function (off, idx) {
        var n = ctx.createBufferSource();
        n.buffer = pinkBuffer;
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(idx === 0 ? 520 : 610, now + off);
        bp.Q.setValueAtTime(1.6, now + off);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now + off);
        g.gain.linearRampToValueAtTime(idx === 0 ? 0.18 : 0.14, now + off + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.11);
        n.connect(bp);
        bp.connect(g);
        g.connect(sfxBus);
        n.start(now + off);
        n.stop(now + off + 0.13);
      });
      return;
    }

    if (name === 'ward_place') {
      // Geometric sigil lock-in triad
      [523.25, 659.25, 987.77].forEach(function (freq, idx) {
        var t = now + idx * 0.075;
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.085, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        o.connect(g);
        g.connect(sfxBus);
        o.start(t);
        o.stop(t + 0.48);
      });
      return;
    }

    if (name === 'crisis_freeze') {
      // Cinematic vacuum drop + sub-bass dive + tense metallic ring
      var drop = ctx.createOscillator();
      var dg = ctx.createGain();
      drop.type = 'sine';
      drop.frequency.setValueAtTime(190, now);
      drop.frequency.exponentialRampToValueAtTime(30, now + 0.48);
      dg.gain.setValueAtTime(0.0001, now);
      dg.gain.linearRampToValueAtTime(0.32, now + 0.02);
      dg.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      drop.connect(dg);
      dg.connect(sfxBus);
      drop.start(now);
      drop.stop(now + 0.7);

      var ping = ctx.createOscillator();
      var pg = ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(2093, now + 0.05);
      pg.gain.setValueAtTime(0.0001, now + 0.05);
      pg.gain.linearRampToValueAtTime(0.075, now + 0.07);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      ping.connect(pg);
      pg.connect(sfxBus);
      ping.start(now + 0.05);
      ping.stop(now + 0.95);
      return;
    }

    if (name === 'broadcast_static') {
      // PA intercom static burst + distorted 960Hz chime
      var ns = ctx.createBufferSource();
      ns.buffer = whiteBuffer;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1950, now);
      bp.Q.setValueAtTime(2.5, now);
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.linearRampToValueAtTime(0.11, now + 0.015);
      ng.gain.linearRampToValueAtTime(0.03, now + 0.14);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      ns.connect(bp);
      bp.connect(ng);
      ng.connect(sfxBus);
      ns.start(now);
      ns.stop(now + 0.3);

      var tone = ctx.createOscillator();
      var tg = ctx.createGain();
      tone.type = 'square';
      tone.frequency.setValueAtTime(920, now + 0.05);
      tone.frequency.linearRampToValueAtTime(860, now + 0.22);
      var tlp = ctx.createBiquadFilter();
      tlp.type = 'bandpass';
      tlp.frequency.setValueAtTime(1100, now + 0.05);
      tg.gain.setValueAtTime(0.0001, now + 0.05);
      tg.gain.linearRampToValueAtTime(0.045, now + 0.07);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      tone.connect(tlp);
      tlp.connect(tg);
      tg.connect(sfxBus);
      tone.start(now + 0.05);
      tone.stop(now + 0.28);
      return;
    }

    if (name === 'blade_ring') {
      // Metallic steel resonance partials
      [1680, 2540, 3890].forEach(function (f, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = i === 0 ? 'triangle' : 'sine';
        o.frequency.setValueAtTime(f, now);
        o.frequency.exponentialRampToValueAtTime(f * 0.985, now + 0.65);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.07 / (i + 1), now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55 + i * 0.14);
        o.connect(g);
        g.connect(sfxBus);
        o.start(now);
        o.stop(now + 0.85);
      });
      return;
    }

    if (name === 'alert') {
      // Wristwatch double-pulse tactical alert
      [0, 0.14].forEach(function (off, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(i === 0 ? 880 : 660, now + off);
        g.gain.setValueAtTime(0.0001, now + off);
        g.gain.linearRampToValueAtTime(0.11, now + off + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.11);
        o.connect(g);
        g.connect(sfxBus);
        o.start(now + off);
        o.stop(now + off + 0.13);
      });
    }
  }

  window.INFINITY.Audio = {
    unlock: function () {
      if (!ensureContext()) return false;
      unlocked = true;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      if (currentScene && !activeSceneGain) {
        buildScene(currentScene);
      }
      return true;
    },

    setMuted: function (bool) {
      muted = !!bool;
      if (ctx && masterGain) {
        var now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
        masterGain.gain.linearRampToValueAtTime(muted ? 0.0001 : Math.max(volume, 0.0001), now + 0.12);
      }
    },

    setVolume: function (val) {
      volume = clamp(Number(val) || 0, 0, 1);
      if (ctx && masterGain && !muted) {
        var now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
        masterGain.gain.linearRampToValueAtTime(Math.max(volume, 0.0001), now + 0.08);
      }
    },

    isMuted: function () {
      return muted;
    },

    getVolume: function () {
      return volume;
    },

    setScene: function (mode) {
      if (!mode) return;
      if (currentScene === mode && activeSceneGain) return;
      currentScene = mode;
      if (!unlocked) return;
      if (!ensureContext()) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      buildScene(mode);
    },

    setThreatLevel: function (level) {
      threatLevel = clamp(Number(level) || 0, 0, 100);
      applyThreatFilter();
    },

    playSfx: function (name) {
      if (!unlocked) {
        // Attempt graceful unlock if called inside user gesture
        if (!ensureContext()) return;
        unlocked = true;
      }
      playSfxInternal(name);
    }
  };
})();
