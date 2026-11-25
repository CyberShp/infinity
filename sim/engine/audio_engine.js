/**
 * Infinity Living Simulator — 3D Spatial Web Audio, 3-Stem Adaptive BGM & Tactical Foley SFX Engine
 * Attaches to window.INFINITY.Audio
 * Zero external audio assets; smooth setTargetAtTime / linearRampToValueAtTime transitions throughout.
 */
(function () {
  'use strict';

  window.INFINITY = window.INFINITY || {};

  var ctx = null;
  var masterGain = null;
  var masterLimiter = null;
  var compressor = null;
  var bulletTimeFilter = null;
  var duckGain = null;
  var ambienceBus = null;
  var ambienceFilter = null;
  var spatialBus = null;
  var sfxBus = null;

  var pinkBuffer = null;
  var whiteBuffer = null;

  var unlocked = false;
  var muted = false;
  var volume = 0.65;
  var currentScene = null;
  var threatLevel = 0; // 0..100
  var bulletTimeEnabled = false;

  // Non-exam / shared scene lifecycle tracking
  var activeNodes = [];
  var activeIntervals = [];
  var heartbeatTimer = null;
  var watchTickTimer = null;
  var shimmerTimer = null;
  var activeSceneGain = null;

  // 3-Stem Adaptive Exam BGM state (explore / stalk / combat)
  var examStems = null;
  var examStepTimer = null;
  var examStep = 0;
  var EXAM_STEP_MS = 129; // ~116 BPM 16th-note grid

  // Persistent 3D spatial channels ('inspector' | 'train')
  var spatialChannels = {};
  var spatialPending = {
    inspector: { dx: 0, dz: 30, intensity: 0 },
    train: { dx: 12, dz: 40, intensity: 0 }
  };

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function isExamScene(mode) {
    return mode === 'station_calm' || mode === 'station_tense' || mode === 'crisis';
  }

  function safeSetTarget(param, value, startTime, timeConstant) {
    if (!param) return;
    try {
      param.setTargetAtTime(value, startTime, timeConstant);
    } catch (_) {
      try {
        param.setValueAtTime(value, startTime);
      } catch (__) {}
    }
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

  /**
   * Cross-browser stereo panner wrapper:
   * 1) Native StereoPannerNode (Chrome, Firefox, Edge, modern Safari, headless Chromium)
   * 2) Equal-power PannerNode fallback (legacy Safari/WebKit)
   * 3) Constant-power L/R gain splitter+merger fallback
   */
  function createSafePanner(audioCtx) {
    if (typeof audioCtx.createStereoPanner === 'function') {
      try {
        var sp = audioCtx.createStereoPanner();
        sp.pan.setValueAtTime(0, audioCtx.currentTime);
        return {
          input: sp,
          output: sp,
          setPan: function (panVal, now, tc) {
            safeSetTarget(sp.pan, clamp(panVal, -0.95, 0.95), now, tc || 0.06);
          },
          disconnect: function () {
            try { sp.disconnect(); } catch (_) {}
          }
        };
      } catch (_) {}
    }

    if (typeof audioCtx.createPanner === 'function') {
      try {
        var p3d = audioCtx.createPanner();
        p3d.panningModel = 'equalpower';
        p3d.distanceModel = 'linear';
        p3d.refDistance = 1;
        p3d.maxDistance = 10;
        p3d.rolloffFactor = 0;
        if (typeof p3d.positionX !== 'undefined') {
          p3d.positionX.setValueAtTime(0, audioCtx.currentTime);
          p3d.positionY.setValueAtTime(0, audioCtx.currentTime);
          p3d.positionZ.setValueAtTime(-1, audioCtx.currentTime);
        } else if (typeof p3d.setPosition === 'function') {
          p3d.setPosition(0, 0, -1);
        }
        return {
          input: p3d,
          output: p3d,
          setPan: function (panVal, now, tc) {
            var x = clamp(panVal, -0.95, 0.95);
            var z = -Math.sqrt(Math.max(0.02, 1 - x * x));
            if (typeof p3d.positionX !== 'undefined') {
              safeSetTarget(p3d.positionX, x, now, tc || 0.06);
              safeSetTarget(p3d.positionZ, z, now, tc || 0.06);
            } else if (typeof p3d.setPosition === 'function') {
              try { p3d.setPosition(x, 0, z); } catch (_) {}
            }
          },
          disconnect: function () {
            try { p3d.disconnect(); } catch (_) {}
          }
        };
      } catch (_) {}
    }

    // Pure constant-power gain-panning fallback
    var inGain = audioCtx.createGain();
    var leftG = audioCtx.createGain();
    var rightG = audioCtx.createGain();
    var merger = audioCtx.createChannelMerger(2);
    leftG.gain.setValueAtTime(0.707, audioCtx.currentTime);
    rightG.gain.setValueAtTime(0.707, audioCtx.currentTime);
    inGain.connect(leftG);
    inGain.connect(rightG);
    leftG.connect(merger, 0, 0);
    rightG.connect(merger, 0, 1);

    return {
      input: inGain,
      output: merger,
      setPan: function (panVal, now, tc) {
        var p = clamp(panVal, -0.95, 0.95);
        var angle = (p + 1) * Math.PI * 0.25;
        safeSetTarget(leftG.gain, Math.cos(angle), now, tc || 0.06);
        safeSetTarget(rightG.gain, Math.sin(angle), now, tc || 0.06);
      },
      disconnect: function () {
        try { inGain.disconnect(); } catch (_) {}
        try { leftG.disconnect(); } catch (_) {}
        try { rightG.disconnect(); } catch (_) {}
        try { merger.disconnect(); } catch (_) {}
      }
    };
  }

  function ensureContext() {
    if (ctx) return true;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      ctx = new AudioCtx();
      var now = ctx.currentTime;

      // Primary glue compressor
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-15, now);
      compressor.knee.setValueAtTime(18, now);
      compressor.ratio.setValueAtTime(5, now);
      compressor.attack.setValueAtTime(0.004, now);
      compressor.release.setValueAtTime(0.16, now);

      // Transparent peak safety limiter to prevent digital clipping
      masterLimiter = ctx.createDynamicsCompressor();
      masterLimiter.threshold.setValueAtTime(-2.5, now);
      masterLimiter.knee.setValueAtTime(3, now);
      masterLimiter.ratio.setValueAtTime(20, now);
      masterLimiter.attack.setValueAtTime(0.001, now);
      masterLimiter.release.setValueAtTime(0.06, now);

      // Master bullet-time lowpass filter (16000Hz normal -> 480Hz slow-mo/typing)
      bulletTimeFilter = ctx.createBiquadFilter();
      bulletTimeFilter.type = 'lowpass';
      bulletTimeFilter.frequency.setValueAtTime(bulletTimeEnabled ? 480 : 16000, now);
      bulletTimeFilter.Q.setValueAtTime(bulletTimeEnabled ? 1.35 : 0.707, now);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0.0001 : Math.max(volume, 0.0001), now);

      // Ambience ducking bus (used by parry_clang for 70ms 75% duck without ducking SFX)
      duckGain = ctx.createGain();
      duckGain.gain.setValueAtTime(1.0, now);

      ambienceFilter = ctx.createBiquadFilter();
      ambienceFilter.type = 'lowpass';
      ambienceFilter.frequency.setValueAtTime(3200, now);
      ambienceFilter.Q.setValueAtTime(0.8, now);

      ambienceBus = ctx.createGain();
      ambienceBus.gain.setValueAtTime(0.85, now);

      spatialBus = ctx.createGain();
      spatialBus.gain.setValueAtTime(0.95, now);

      sfxBus = ctx.createGain();
      sfxBus.gain.setValueAtTime(1.0, now);

      ambienceBus.connect(ambienceFilter);
      ambienceFilter.connect(duckGain);
      spatialBus.connect(duckGain);
      duckGain.connect(bulletTimeFilter);
      sfxBus.connect(bulletTimeFilter);

      bulletTimeFilter.connect(compressor);
      compressor.connect(masterLimiter);
      masterLimiter.connect(masterGain);
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
    if (examStepTimer) {
      clearInterval(examStepTimer);
      examStepTimer = null;
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
      examStems = null;
      return;
    }

    var now = ctx.currentTime;
    var oldGain = activeSceneGain;
    var oldNodes = activeNodes.slice();
    var oldSheenGain = examStems && examStems.crisisSheenGain ? examStems.crisisSheenGain : null;
    activeNodes = [];
    activeSceneGain = null;
    examStems = null;

    if (oldGain) {
      try {
        oldGain.gain.cancelScheduledValues(now);
        oldGain.gain.setValueAtTime(Math.max(oldGain.gain.value, 0.0001), now);
        oldGain.gain.linearRampToValueAtTime(0.0001, now + 0.65);
      } catch (_) {}
    }

    if (oldSheenGain) {
      try {
        oldSheenGain.gain.cancelScheduledValues(now);
        oldSheenGain.gain.setValueAtTime(Math.max(oldSheenGain.gain.value, 0.0001), now);
        oldSheenGain.gain.linearRampToValueAtTime(0.0001, now + 0.45);
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

  function makeNoiseLoop(buffer, filterType, freq, q, gainVal, dest, nodeList) {
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

    (nodeList || activeNodes).push(src, filter, g);
    return { src: src, filter: filter, gain: g };
  }

  function makeOsc(type, freq, gainVal, dest, nodeList) {
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    var g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);

    osc.connect(g);
    g.connect(dest);
    osc.start();

    (nodeList || activeNodes).push(osc, g);
    return { osc: osc, gain: g };
  }

  // =========================================================================
  // 1. TRUE 3D SPATIAL AUDIO TRACKING ('inspector' & 'train')
  // =========================================================================

  function ensureInspectorSpatialChannel() {
    if (!ctx) return null;
    if (spatialChannels.inspector) return spatialChannels.inspector;

    var now = ctx.currentTime;
    var panner = createSafePanner(ctx);
    var outGain = ctx.createGain();
    outGain.gain.setValueAtTime(0.0001, now);

    // Distance-modulated presence filter (distant = muffled dark scrape, close = biting metallic shear)
    var distFilter = ctx.createBiquadFilter();
    distFilter.type = 'lowpass';
    distFilter.frequency.setValueAtTime(900, now);
    distFilter.Q.setValueAtTime(1.1, now);

    distFilter.connect(panner.input);
    panner.output.connect(outGain);
    outGain.connect(spatialBus);

    // Subtle eerie metallic shear-scrape (dual resonant bandpass noise + slow LFO sweep)
    var scrapeNodes = [];
    var scrape1 = makeNoiseLoop(pinkBuffer, 'bandpass', 1420, 9.5, 0.16, distFilter, scrapeNodes);
    var scrape2 = makeNoiseLoop(whiteBuffer, 'bandpass', 2680, 12.0, 0.045, distFilter, scrapeNodes);

    var scrapeLfo = ctx.createOscillator();
    var scrapeLfoGain1 = ctx.createGain();
    var scrapeLfoGain2 = ctx.createGain();
    scrapeLfo.type = 'sine';
    scrapeLfo.frequency.setValueAtTime(0.27, now);
    scrapeLfoGain1.gain.setValueAtTime(290, now);
    scrapeLfoGain2.gain.setValueAtTime(-420, now);
    scrapeLfo.connect(scrapeLfoGain1);
    scrapeLfo.connect(scrapeLfoGain2);
    scrapeLfoGain1.connect(scrape1.filter.frequency);
    scrapeLfoGain2.connect(scrape2.filter.frequency);
    scrapeLfo.start();

    // Cold iron hum undertone
    var droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'bandpass';
    droneFilter.frequency.setValueAtTime(280, now);
    droneFilter.Q.setValueAtTime(4.5, now);
    droneFilter.connect(distFilter);
    makeOsc('sawtooth', 92, 0.055, droneFilter, scrapeNodes);

    var channel = {
      panner: panner,
      outGain: outGain,
      distFilter: distFilter,
      effectiveGain: 0,
      intensity: 0,
      bootTimer: null,
      nodes: scrapeNodes.concat([scrapeLfo, scrapeLfoGain1, scrapeLfoGain2, droneFilter])
    };
    spatialChannels.inspector = channel;
    return channel;
  }

  function triggerInspectorBootThump(channel) {
    if (!ctx || muted || ctx.state !== 'running' || !channel) return;
    if (channel.effectiveGain <= 0.025) return;

    var now = ctx.currentTime;
    var power = clamp(0.45 + channel.effectiveGain * 0.55, 0.35, 1.0);

    // Heavy iron-boot sub thump routed directly through Inspector's 3D stereo panner
    var sub = ctx.createOscillator();
    var subLp = ctx.createBiquadFilter();
    var subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(84, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.13);
    subLp.type = 'lowpass';
    subLp.frequency.setValueAtTime(160, now);
    subG.gain.setValueAtTime(0.0001, now);
    subG.gain.linearRampToValueAtTime(0.34 * power, now + 0.01);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    sub.connect(subLp);
    subLp.connect(subG);
    subG.connect(channel.panner.input);
    sub.start(now);
    sub.stop(now + 0.22);

    // Iron heel strike / concrete grit
    var grit = ctx.createBufferSource();
    grit.buffer = whiteBuffer;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1750 + Math.random() * 240, now);
    bp.Q.setValueAtTime(4.2, now);
    var gg = ctx.createGain();
    gg.gain.setValueAtTime(0.0001, now);
    gg.gain.linearRampToValueAtTime(0.11 * power, now + 0.005);
    gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    grit.connect(bp);
    bp.connect(gg);
    gg.connect(channel.panner.input);
    grit.start(now);
    grit.stop(now + 0.07);

    // Faint metallic shear clink on boot step
    var clink = ctx.createOscillator();
    var cg = ctx.createGain();
    clink.type = 'triangle';
    clink.frequency.setValueAtTime(640 + Math.random() * 45, now + 0.004);
    clink.frequency.exponentialRampToValueAtTime(510, now + 0.08);
    cg.gain.setValueAtTime(0.0001, now + 0.004);
    cg.gain.linearRampToValueAtTime(0.045 * power, now + 0.01);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    clink.connect(cg);
    cg.connect(channel.panner.input);
    clink.start(now + 0.004);
    clink.stop(now + 0.095);
  }

  function scheduleInspectorBoot() {
    var ch = spatialChannels.inspector;
    if (!ctx || !ch || ch.effectiveGain <= 0.025) {
      if (ch) ch.bootTimer = null;
      return;
    }

    triggerInspectorBootThump(ch);

    // Stride cadence accelerates smoothly from slow stalk (~880ms) to relentless pursuit (~440ms)
    var urgency = clamp(ch.effectiveGain * 0.7 + ch.intensity * 0.3, 0, 1);
    var nextMs = Math.round(880 - urgency * 430);
    ch.bootTimer = setTimeout(scheduleInspectorBoot, nextMs);
  }

  function ensureTrainSpatialChannel() {
    if (!ctx) return null;
    if (spatialChannels.train) return spatialChannels.train;

    var now = ctx.currentTime;
    var panner = createSafePanner(ctx);
    var outGain = ctx.createGain();
    outGain.gain.setValueAtTime(0.0001, now);

    // Distance-swept rail body lowpass filter
    var distFilter = ctx.createBiquadFilter();
    distFilter.type = 'lowpass';
    distFilter.frequency.setValueAtTime(320, now);
    distFilter.Q.setValueAtTime(1.2, now);

    distFilter.connect(panner.input);
    panner.output.connect(outGain);
    outGain.connect(spatialBus);

    var trainNodes = [];
    // Deep sub-bass rail rumble
    makeOsc('sine', 35, 0.30, distFilter, trainNodes);
    makeOsc('triangle', 52.5, 0.14, distFilter, trainNodes);
    makeOsc('sawtooth', 70, 0.065, distFilter, trainNodes);
    makeNoiseLoop(pinkBuffer, 'lowpass', 150, 0.9, 0.34, distFilter, trainNodes);

    // Rhythmic steel-on-rail clack rumble modulated by LFO
    var railTrack = makeNoiseLoop(pinkBuffer, 'bandpass', 560, 2.2, 0.12, distFilter, trainNodes);
    var clackLfo = ctx.createOscillator();
    var clackGain = ctx.createGain();
    clackLfo.type = 'triangle';
    clackLfo.frequency.setValueAtTime(4.1, now);
    clackGain.gain.setValueAtTime(0.08, now);
    clackLfo.connect(clackGain);
    clackGain.connect(railTrack.gain.gain);
    clackLfo.start();

    // Subtle ghostly flange wheel shimmer
    makeNoiseLoop(whiteBuffer, 'bandpass', 1420, 14.0, 0.018, distFilter, trainNodes);

    var channel = {
      panner: panner,
      outGain: outGain,
      distFilter: distFilter,
      effectiveGain: 0,
      nodes: trainNodes.concat([clackLfo, clackGain])
    };
    spatialChannels.train = channel;
    return channel;
  }

  function applySpatialUpdate(id, dx, dz, intensity) {
    if (!ctx) return;
    var now = ctx.currentTime;
    var safeDx = Number.isFinite(dx) ? dx : 0;
    var safeDz = Number.isFinite(dz) ? dz : 0;
    var safeInt = clamp(Number.isFinite(intensity) ? intensity : 0, 0, 1.25);

    // Silence spatial channels smoothly when outside exam scenes (if a non-exam scene is explicitly active)
    if (currentScene && !isExamScene(currentScene)) {
      safeInt = 0;
    }

    var dist = Math.hypot(safeDx, safeDz);
    var pan = clamp(safeDx / 12, -0.95, 0.95);

    if (id === 'inspector') {
      var ch = ensureInspectorSpatialChannel();
      if (!ch) return;

      var atten = clamp(1 - dist / 22, 0, 1) * clamp(safeInt, 0, 1);
      ch.effectiveGain = atten;
      ch.intensity = clamp(safeInt, 0, 1);

      // Smooth stereo pan & gain updates with setTargetAtTime (zero zipper noise)
      ch.panner.setPan(pan, now, 0.055);
      safeSetTarget(ch.outGain.gain, Math.max(0.0001, atten * 0.72), now, 0.07);
      safeSetTarget(ch.distFilter.frequency, 420 + atten * 3400, now, 0.09);

      if (atten > 0.025 && !ch.bootTimer) {
        scheduleInspectorBoot();
      }
      return;
    }

    if (id === 'train') {
      var tr = ensureTrainSpatialChannel();
      if (!tr) return;

      // Train rumble audible from slightly wider range along Platform 0, smoothly attenuating with distance
      var trainAtten = clamp(1 - dist / 28, 0, 1) * clamp(safeInt, 0, 1);
      tr.effectiveGain = trainAtten;

      tr.panner.setPan(pan, now, 0.065);
      safeSetTarget(tr.outGain.gain, Math.max(0.0001, trainAtten * 0.82), now, 0.08);
      safeSetTarget(tr.distFilter.frequency, 160 + trainAtten * 1150, now, 0.1);
    }
  }

  function silenceSpatialChannels() {
    if (!ctx) return;
    var now = ctx.currentTime;
    if (spatialChannels.inspector) {
      spatialChannels.inspector.effectiveGain = 0;
      safeSetTarget(spatialChannels.inspector.outGain.gain, 0.0001, now, 0.12);
      if (spatialChannels.inspector.bootTimer) {
        clearTimeout(spatialChannels.inspector.bootTimer);
        spatialChannels.inspector.bootTimer = null;
      }
    }
    if (spatialChannels.train) {
      spatialChannels.train.effectiveGain = 0;
      safeSetTarget(spatialChannels.train.outGain.gain, 0.0001, now, 0.12);
    }
  }

  // =========================================================================
  // 2. 3-STEM ADAPTIVE EXAM BGM (explore / stalk / combat) & BULLET-TIME
  // =========================================================================

  function computeExamStemTargets() {
    var effThreat = threatLevel;
    if (currentScene === 'station_tense') {
      effThreat = Math.max(threatLevel, 28);
    } else if (currentScene === 'crisis') {
      effThreat = Math.max(threatLevel, 84);
    }

    var t = clamp(effThreat / 100, 0, 1);
    // Stem 1 (explore): active 0..100, subtly eases back at high combat threat to preserve headroom
    var explore = 0.88 - t * 0.28;
    // Stem 2 (stalk): ramps in smoothly at threat >= 25
    var stalk = effThreat >= 25 ? clamp((effThreat - 25) / 40, 0, 1) : 0;
    // Stem 3 (combat): ramps in smoothly at threat >= 60
    var combat = effThreat >= 60 ? clamp((effThreat - 60) / 34, 0, 1) : 0;

    return {
      effThreat: effThreat,
      explore: explore,
      stalk: stalk,
      combat: combat
    };
  }

  function applyExamStemMix() {
    if (!ctx || !examStems) return;
    var now = ctx.currentTime;
    var mix = computeExamStemTargets();
    examStems.mix = mix;

    safeSetTarget(examStems.exploreGain.gain, Math.max(0.0001, mix.explore), now, 0.28);
    safeSetTarget(examStems.stalkGain.gain, Math.max(0.0001, mix.stalk * 0.88), now, 0.28);
    safeSetTarget(examStems.combatGain.gain, Math.max(0.0001, mix.combat * 0.85), now, 0.24);

    if (examStems.crisisSheenGain) {
      var sheenTarget = currentScene === 'crisis' ? 1.0 : 0.0001;
      safeSetTarget(examStems.crisisSheenGain.gain, sheenTarget, now, 0.2);
    }
  }

  function triggerExploreShimmer(dest) {
    if (!ctx || muted || ctx.state !== 'running') return;
    var now = ctx.currentTime;
    // Cold distant D-minor-9 harmonic shimmer
    var notes = [293.66, 440.0, 523.25, 659.25, 698.46, 880.0];
    var f = notes[Math.floor(Math.random() * notes.length)];

    var osc = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var lp = ctx.createBiquadFilter();
    var g = ctx.createGain();

    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(f, now);
    osc2.frequency.setValueAtTime(f * 1.003, now);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, now);
    lp.frequency.exponentialRampToValueAtTime(520, now + 2.8);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.022, now + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(lp);
    osc2.connect(lp);
    lp.connect(g);
    g.connect(dest);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.3);
    osc2.stop(now + 3.3);
  }

  function triggerStalkPulse(step, dest) {
    if (!ctx || muted || ctx.state !== 'running') return;
    // Syncopated dark low-pass rhythmic pulse (16-step bar)
    var accentMap = [1.0, 0, 0, 0.65, 0, 0, 0.82, 0, 0.92, 0, 0, 0.6, 0, 0, 0.78, 0];
    var vel = accentMap[step % 16];
    if (vel <= 0) return;

    var now = ctx.currentTime;
    var noteFreq = (step % 32 >= 24) ? 69.30 : 73.42; // C#2 tension turn -> D2 root

    var osc = ctx.createOscillator();
    var sub = ctx.createOscillator();
    var lp = ctx.createBiquadFilter();
    var g = ctx.createGain();

    osc.type = 'sawtooth';
    sub.type = 'sine';
    osc.frequency.setValueAtTime(noteFreq, now);
    sub.frequency.setValueAtTime(noteFreq * 0.5, now);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(290 + vel * 150, now);
    lp.frequency.exponentialRampToValueAtTime(95, now + 0.16);
    lp.Q.setValueAtTime(3.2, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.11 * vel, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

    osc.connect(lp);
    sub.connect(lp);
    lp.connect(g);
    g.connect(dest);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.21);
    sub.stop(now + 0.21);
  }

  function triggerCombatStep(step, dest) {
    if (!ctx || muted || ctx.state !== 'running') return;
    var now = ctx.currentTime;
    var s16 = step % 16;

    // 1. Crisp dark industrial percussive tick (every 16th with metallic accent)
    var tickAccent = (s16 === 0 || s16 === 4 || s16 === 8 || s16 === 12) ? 1.0
      : (s16 === 2 || s16 === 6 || s16 === 10 || s16 === 14) ? 0.68 : 0.35;

    var n = ctx.createBufferSource();
    n.buffer = whiteBuffer;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(s16 % 4 === 2 ? 4800 : 3200, now);
    bp.Q.setValueAtTime(s16 % 4 === 2 ? 5.5 : 3.0, now);
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.linearRampToValueAtTime(0.055 * tickAccent, now + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + (s16 % 4 === 2 ? 0.045 : 0.024));
    n.connect(bp);
    bp.connect(ng);
    ng.connect(dest);
    n.start(now);
    n.stop(now + 0.055);

    // Industrial anvil hit on beats 2 & 4 (steps 4 & 12)
    if (s16 === 4 || s16 === 12) {
      var clang = ctx.createOscillator();
      var cg = ctx.createGain();
      clang.type = 'square';
      clang.frequency.setValueAtTime(s16 === 4 ? 780 : 930, now);
      clang.frequency.exponentialRampToValueAtTime(420, now + 0.07);
      var cbp = ctx.createBiquadFilter();
      cbp.type = 'bandpass';
      cbp.frequency.setValueAtTime(1600, now);
      cbp.Q.setValueAtTime(4.0, now);
      cg.gain.setValueAtTime(0.0001, now);
      cg.gain.linearRampToValueAtTime(0.048, now + 0.003);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
      clang.connect(cbp);
      cbp.connect(cg);
      cg.connect(dest);
      clang.start(now);
      clang.stop(now + 0.095);
    }

    // 2. Tense minor-fifth bass ostinato (8th notes: D2 - A2 - D2 - F2 - A2 - Bb2 - A2 - Eb2)
    if (step % 2 === 0) {
      var ostinato = [73.42, 110.0, 73.42, 87.31, 110.0, 116.54, 110.0, 77.78];
      var idx = Math.floor((step % 16) / 2);
      var freq = ostinato[idx];

      var bass = ctx.createOscillator();
      var fifth = ctx.createOscillator();
      var blp = ctx.createBiquadFilter();
      var bg = ctx.createGain();

      bass.type = 'sawtooth';
      fifth.type = 'triangle';
      bass.frequency.setValueAtTime(freq, now);
      fifth.frequency.setValueAtTime(freq * 1.498, now); // tense fifth harmonic

      blp.type = 'lowpass';
      blp.frequency.setValueAtTime(680, now);
      blp.frequency.exponentialRampToValueAtTime(190, now + 0.17);
      blp.Q.setValueAtTime(2.6, now);

      bg.gain.setValueAtTime(0.0001, now);
      bg.gain.linearRampToValueAtTime(0.095, now + 0.008);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

      bass.connect(blp);
      fifth.connect(blp);
      blp.connect(bg);
      bg.connect(dest);

      bass.start(now);
      fifth.start(now);
      bass.stop(now + 0.21);
      fifth.stop(now + 0.21);
    }
  }

  function runExamSequencerTick() {
    if (!ctx || !examStems || !isExamScene(currentScene)) return;
    var mix = examStems.mix || computeExamStemTargets();

    // Stem 1 cold distant harmonic shimmer on bar boundaries
    if (examStep % 32 === 4) {
      triggerExploreShimmer(examStems.exploreGain);
    }

    // Stem 2 muted low-pass rhythmic pulse (only schedules nodes when active)
    if (mix.stalk > 0.01) {
      triggerStalkPulse(examStep, examStems.stalkGain);
    }

    // Stem 3 industrial percussive tick + minor fifth bass ostinato
    if (mix.combat > 0.01) {
      triggerCombatStep(examStep, examStems.combatGain);
    }

    examStep = (examStep + 1) % 64;
  }

  function buildExamSoundscape() {
    var now = ctx.currentTime;
    var sceneGain = ctx.createGain();
    sceneGain.gain.setValueAtTime(0.0001, now);
    sceneGain.gain.linearRampToValueAtTime(1.0, now + 0.95);
    sceneGain.connect(ambienceBus);
    activeSceneGain = sceneGain;

    var exploreGain = ctx.createGain();
    var stalkGain = ctx.createGain();
    var combatGain = ctx.createGain();
    exploreGain.gain.setValueAtTime(0.8, now);
    stalkGain.gain.setValueAtTime(0.0001, now);
    combatGain.gain.setValueAtTime(0.0001, now);

    exploreGain.connect(sceneGain);
    stalkGain.connect(sceneGain);
    combatGain.connect(sceneGain);
    activeNodes.push(exploreGain, stalkGain, combatGain);

    // Stem 1 (explore): deep obsidian subway hum + damp mist airflow + subtle harmonic bed
    makeOsc('sine', 48, 0.075, exploreGain);
    makeOsc('triangle', 96, 0.022, exploreGain);
    makeOsc('sine', 144, 0.011, exploreGain);
    makeNoiseLoop(pinkBuffer, 'bandpass', 380, 0.85, 0.115, exploreGain);
    makeNoiseLoop(pinkBuffer, 'highpass', 1850, 0.65, 0.020, exploreGain);

    // Stem 2 (stalk) subtle sub-pressure undertone that breathes with stalk gain
    var stalkBedLp = ctx.createBiquadFilter();
    stalkBedLp.type = 'lowpass';
    stalkBedLp.frequency.setValueAtTime(140, now);
    stalkBedLp.Q.setValueAtTime(2.0, now);
    stalkBedLp.connect(stalkGain);
    activeNodes.push(stalkBedLp);
    makeOsc('sawtooth', 73.42, 0.038, stalkBedLp);

    // Crisis vacuum tension sheen (routes past ambienceFilter to sfxBus, muted except during 'crisis')
    var crisisSheenGain = ctx.createGain();
    crisisSheenGain.gain.setValueAtTime(currentScene === 'crisis' ? 1.0 : 0.0001, now);
    crisisSheenGain.connect(sfxBus);
    activeNodes.push(crisisSheenGain);
    makeOsc('sine', 1760, 0.013, crisisSheenGain);
    makeOsc('sine', 1766, 0.010, crisisSheenGain);

    examStems = {
      exploreGain: exploreGain,
      stalkGain: stalkGain,
      combatGain: combatGain,
      crisisSheenGain: crisisSheenGain,
      mix: null
    };

    examStep = 0;
    applyExamStemMix();
    examStepTimer = setInterval(runExamSequencerTick, EXAM_STEP_MS);
    scheduleStationRailGroan();
  }

  function syncExamSecondaryTimers() {
    if (!ctx || !isExamScene(currentScene)) return;
    if (currentScene === 'station_tense' || currentScene === 'crisis') {
      if (!heartbeatTimer) scheduleHeartbeatLoop(currentScene === 'crisis');
      if (!watchTickTimer) scheduleWatchTick();
    } else {
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (watchTickTimer) {
        clearTimeout(watchTickTimer);
        watchTickTimer = null;
      }
    }
  }

  function applyBulletTimeFilter() {
    if (!ctx || !bulletTimeFilter) return;
    var now = ctx.currentTime;
    var targetFreq = bulletTimeEnabled ? 480 : 16000;
    var targetQ = bulletTimeEnabled ? 1.35 : 0.707;
    var tc = bulletTimeEnabled ? 0.055 : 0.085;
    safeSetTarget(bulletTimeFilter.frequency, targetFreq, now, tc);
    safeSetTarget(bulletTimeFilter.Q, targetQ, now, tc);
  }

  // =========================================================================
  // EXISTING AMBIENT TIMERS & SCENE BUILDERS
  // =========================================================================

  function playHeartbeatPulse(intensity) {
    if (!ctx || muted || ctx.state !== 'running') return;
    var now = ctx.currentTime;
    var amp = clamp(0.07 + intensity * 0.20, 0.05, 0.28);

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
    if (!ctx || (currentScene !== 'station_tense' && currentScene !== 'crisis')) {
      heartbeatTimer = null;
      return;
    }

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
    var peak = subtle ? 0.028 : 0.048;
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
    if (!ctx || (currentScene !== 'station_tense' && currentScene !== 'crisis')) {
      watchTickTimer = null;
      return;
    }
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
    if (!ctx || !isExamScene(currentScene)) return;
    if (!muted && ctx.state === 'running' && currentScene !== 'crisis') {
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
      g.gain.linearRampToValueAtTime(0.024, now + 1.1);
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
      targetFreq = 520;
      targetQ = 2.0;
    } else if (currentScene === 'station_tense') {
      var t = clamp(threatLevel / 100, 0, 1);
      // Keep headroom open enough for combat industrial ticks when threat >= 60
      targetFreq = t >= 0.6 ? (1900 + (t - 0.6) * 2600) : (2600 - t * 1400);
      targetQ = 0.95 + t * 1.15;
    } else if (currentScene === 'station_calm') {
      targetFreq = 2800;
      targetQ = 0.85;
    } else if (currentScene === 'hall') {
      targetFreq = 1800;
      targetQ = 1.2;
    } else if (currentScene === 'settlement') {
      targetFreq = 2200;
      targetQ = 0.7;
    }

    safeSetTarget(ambienceFilter.frequency, targetFreq, now, 0.22);
    safeSetTarget(ambienceFilter.Q, targetQ, now, 0.22);
  }

  function buildScene(mode) {
    if (!ctx) return;
    var now = ctx.currentTime;

    // Seamless in-place crossfade between exam scenes (keeps 3-stem sequencer phase-locked!)
    if (isExamScene(mode) && examStems && activeSceneGain) {
      applyExamStemMix();
      syncExamSecondaryTimers();
      if (mode === 'crisis') {
        try {
          ambienceFilter.frequency.cancelScheduledValues(now);
          ambienceFilter.frequency.setValueAtTime(Math.max(ambienceFilter.frequency.value, 140), now);
          ambienceFilter.frequency.exponentialRampToValueAtTime(180, now + 0.25);
        } catch (_) {}
      } else {
        applyThreatFilter();
      }
      return;
    }

    fadeOutCurrentScene();

    if (isExamScene(mode)) {
      buildExamSoundscape();
      syncExamSecondaryTimers();
      if (mode === 'crisis') {
        try {
          ambienceFilter.frequency.cancelScheduledValues(now);
          ambienceFilter.frequency.setValueAtTime(Math.max(ambienceFilter.frequency.value, 180), now);
          ambienceFilter.frequency.exponentialRampToValueAtTime(180, now + 0.28);
        } catch (_) {}
      } else {
        applyThreatFilter();
      }
      // Restore any pending spatial sources
      if (spatialPending.inspector && spatialPending.inspector.intensity > 0) {
        applySpatialUpdate('inspector', spatialPending.inspector.dx, spatialPending.inspector.dz, spatialPending.inspector.intensity);
      }
      if (spatialPending.train && spatialPending.train.intensity > 0) {
        applySpatialUpdate('train', spatialPending.train.dx, spatialPending.train.dz, spatialPending.train.intensity);
      }
      return;
    }

    // Non-exam scenes silence spatial channels cleanly
    silenceSpatialChannels();

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

  // =========================================================================
  // 3. SIGNATURE TACTILE FOLEY SFX (playSfx)
  // =========================================================================

  function triggerAmbienceDuck(duckRatio, holdSec, recoverSec) {
    if (!ctx || !duckGain) return;
    var now = ctx.currentTime;
    try {
      var cur = clamp(duckGain.gain.value, 0.05, 1.0);
      duckGain.gain.cancelScheduledValues(now);
      duckGain.gain.setValueAtTime(cur, now);
      duckGain.gain.linearRampToValueAtTime(duckRatio, now + 0.008);
      duckGain.gain.setValueAtTime(duckRatio, now + holdSec);
      duckGain.gain.linearRampToValueAtTime(1.0, now + holdSec + recoverSec);
    } catch (_) {}
  }

  function playSfxInternal(name) {
    if (!ctx || muted) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    var now = ctx.currentTime;

    // ---- Existing SFX keys (100% preserved) ----

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
      dg.gain.linearRampToValueAtTime(0.30, now + 0.02);
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
      return;
    }

    // ---- New / Upgraded Phase-1 Signature Tactile Foley SFX ----

    if (name === 'parry_clang') {
      // 1) Briefly duck ambience & spatial gain by 75% (to 0.25) for 70ms
      triggerAmbienceDuck(0.25, 0.07, 0.22);

      var strikeAt = now + 0.012;

      // 2) Deep kinetic sub-thud on blade lock
      var pSub = ctx.createOscillator();
      var pSubG = ctx.createGain();
      pSub.type = 'sine';
      pSub.frequency.setValueAtTime(148, strikeAt);
      pSub.frequency.exponentialRampToValueAtTime(36, strikeAt + 0.24);
      pSubG.gain.setValueAtTime(0.0001, strikeAt);
      pSubG.gain.linearRampToValueAtTime(0.28, strikeAt + 0.007);
      pSubG.gain.exponentialRampToValueAtTime(0.0001, strikeAt + 0.30);
      pSub.connect(pSubG);
      pSubG.connect(sfxBus);
      pSub.start(strikeAt);
      pSub.stop(strikeAt + 0.33);

      // 3) High-Q metallic bell resonator excited by crisp steel impulse
      [
        { freq: 2480, q: 26, gain: 0.26, dur: 0.72 },
        { freq: 4120, q: 30, gain: 0.18, dur: 0.85 }
      ].forEach(function (res) {
        var exc = ctx.createBufferSource();
        exc.buffer = whiteBuffer;
        var resBp = ctx.createBiquadFilter();
        resBp.type = 'bandpass';
        resBp.frequency.setValueAtTime(res.freq, strikeAt);
        resBp.Q.setValueAtTime(res.q, strikeAt);
        var rg = ctx.createGain();
        rg.gain.setValueAtTime(0.0001, strikeAt);
        rg.gain.linearRampToValueAtTime(res.gain, strikeAt + 0.003);
        rg.gain.exponentialRampToValueAtTime(0.0001, strikeAt + res.dur);
        exc.connect(resBp);
        resBp.connect(rg);
        rg.connect(sfxBus);
        exc.start(strikeAt);
        exc.stop(strikeAt + res.dur + 0.05);
      });

      // 4) Crystalline sword-ring shimmering inharmonic partials + slight chorus detune
      var partials = [
        { f: 1760, a: 0.095, d: 0.85, type: 'triangle' },
        { f: 1767, a: 0.065, d: 0.90, type: 'sine' },
        { f: 2637, a: 0.075, d: 0.98, type: 'sine' },
        { f: 3951, a: 0.052, d: 1.08, type: 'sine' },
        { f: 5274, a: 0.032, d: 0.75, type: 'sine' }
      ];
      partials.forEach(function (p) {
        var po = ctx.createOscillator();
        var pg = ctx.createGain();
        po.type = p.type;
        po.frequency.setValueAtTime(p.f, strikeAt);
        po.frequency.exponentialRampToValueAtTime(p.f * 0.992, strikeAt + p.d);
        pg.gain.setValueAtTime(0.0001, strikeAt);
        pg.gain.linearRampToValueAtTime(p.a, strikeAt + 0.005);
        pg.gain.exponentialRampToValueAtTime(0.0001, strikeAt + p.d);
        po.connect(pg);
        pg.connect(sfxBus);
        po.start(strikeAt);
        po.stop(strikeAt + p.d + 0.04);
      });
      return;
    }

    if (name === 'sword_slash') {
      // Sharp filtered white-noise air slice
      var slice = ctx.createBufferSource();
      slice.buffer = whiteBuffer;
      var sbp = ctx.createBiquadFilter();
      sbp.type = 'bandpass';
      sbp.frequency.setValueAtTime(3800, now);
      sbp.frequency.exponentialRampToValueAtTime(680, now + 0.14);
      sbp.Q.setValueAtTime(2.2, now);
      var sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, now);
      sg.gain.linearRampToValueAtTime(0.24, now + 0.008);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.165);
      slice.connect(sbp);
      sbp.connect(sg);
      sg.connect(sfxBus);
      slice.start(now);
      slice.stop(now + 0.18);

      // Air displacement whoosh body
      var whoosh = ctx.createBufferSource();
      whoosh.buffer = pinkBuffer;
      var wlp = ctx.createBiquadFilter();
      wlp.type = 'bandpass';
      wlp.frequency.setValueAtTime(920, now);
      wlp.frequency.exponentialRampToValueAtTime(280, now + 0.15);
      wlp.Q.setValueAtTime(1.1, now);
      var wg = ctx.createGain();
      wg.gain.setValueAtTime(0.0001, now);
      wg.gain.linearRampToValueAtTime(0.18, now + 0.014);
      wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
      whoosh.connect(wlp);
      wlp.connect(wg);
      wg.connect(sfxBus);
      whoosh.start(now);
      whoosh.stop(now + 0.19);

      // Subtle steel ring
      [2180, 3290].forEach(function (f, idx) {
        var so = ctx.createOscillator();
        var sog = ctx.createGain();
        so.type = 'sine';
        so.frequency.setValueAtTime(f, now + 0.006);
        so.frequency.exponentialRampToValueAtTime(f * 0.975, now + 0.24);
        sog.gain.setValueAtTime(0.0001, now + 0.006);
        sog.gain.linearRampToValueAtTime(idx === 0 ? 0.045 : 0.025, now + 0.012);
        sog.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        so.connect(sog);
        sog.connect(sfxBus);
        so.start(now + 0.006);
        so.stop(now + 0.27);
      });
      return;
    }

    if (name === 'emp_boom') {
      // 1) Downward frequency electromagnetic zap
      var zap = ctx.createOscillator();
      var zap2 = ctx.createOscillator();
      var zlp = ctx.createBiquadFilter();
      var zg = ctx.createGain();
      zap.type = 'sawtooth';
      zap2.type = 'square';
      zap.frequency.setValueAtTime(1480, now);
      zap.frequency.exponentialRampToValueAtTime(62, now + 0.24);
      zap2.frequency.setValueAtTime(740, now);
      zap2.frequency.exponentialRampToValueAtTime(48, now + 0.26);

      zlp.type = 'lowpass';
      zlp.frequency.setValueAtTime(3200, now);
      zlp.frequency.exponentialRampToValueAtTime(140, now + 0.28);
      zlp.Q.setValueAtTime(3.0, now);

      zg.gain.setValueAtTime(0.0001, now);
      zg.gain.linearRampToValueAtTime(0.16, now + 0.008);
      zg.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

      zap.connect(zlp);
      zap2.connect(zlp);
      zlp.connect(zg);
      zg.connect(sfxBus);
      zap.start(now);
      zap2.start(now);
      zap.stop(now + 0.32);
      zap2.stop(now + 0.32);

      // 2) Heavy sub-bass drop
      var esub = ctx.createOscillator();
      var esg = ctx.createGain();
      esub.type = 'sine';
      esub.frequency.setValueAtTime(135, now + 0.01);
      esub.frequency.exponentialRampToValueAtTime(28, now + 0.56);
      esg.gain.setValueAtTime(0.0001, now + 0.01);
      esg.gain.linearRampToValueAtTime(0.30, now + 0.025);
      esg.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      esub.connect(esg);
      esg.connect(sfxBus);
      esub.start(now + 0.01);
      esub.stop(now + 0.65);

      // 3) Electric crackle tail (staggered micro-arcs)
      var crackleOffsets = [0.12, 0.19, 0.28, 0.37, 0.48, 0.59, 0.70];
      crackleOffsets.forEach(function (off, idx) {
        var t = now + off + Math.random() * 0.02;
        var cr = ctx.createBufferSource();
        cr.buffer = whiteBuffer;
        var chp = ctx.createBiquadFilter();
        chp.type = 'bandpass';
        chp.frequency.setValueAtTime(3200 + (idx % 3) * 1100, t);
        chp.Q.setValueAtTime(3.2, t);
        var cg = ctx.createGain();
        var pk = 0.085 * (1 - idx / (crackleOffsets.length + 1));
        cg.gain.setValueAtTime(0.0001, t);
        cg.gain.linearRampToValueAtTime(pk, t + 0.002);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.026);
        cr.connect(chp);
        chp.connect(cg);
        cg.connect(sfxBus);
        cr.start(t);
        cr.stop(t + 0.035);
      });
      return;
    }

    if (name === 'rail_fire') {
      // 1) Tight metallic snap + punch transient
      var snap = ctx.createBufferSource();
      snap.buffer = whiteBuffer;
      var sbp2 = ctx.createBiquadFilter();
      sbp2.type = 'bandpass';
      sbp2.frequency.setValueAtTime(3400, now);
      sbp2.Q.setValueAtTime(3.4, now);
      var snG = ctx.createGain();
      snG.gain.setValueAtTime(0.0001, now);
      snG.gain.linearRampToValueAtTime(0.24, now + 0.002);
      snG.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
      snap.connect(sbp2);
      sbp2.connect(snG);
      snG.connect(sfxBus);
      snap.start(now);
      snap.stop(now + 0.065);

      var kick = ctx.createOscillator();
      var kg = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(210, now);
      kick.frequency.exponentialRampToValueAtTime(52, now + 0.08);
      kg.gain.setValueAtTime(0.0001, now);
      kg.gain.linearRampToValueAtTime(0.22, now + 0.004);
      kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      kick.connect(kg);
      kg.connect(sfxBus);
      kick.start(now);
      kick.stop(now + 0.13);

      // 2) Crisp high-energy capacitor discharge chirp
      var cap = ctx.createOscillator();
      var cap2 = ctx.createOscillator();
      var capG = ctx.createGain();
      cap.type = 'triangle';
      cap2.type = 'sine';
      cap.frequency.setValueAtTime(3100, now);
      cap.frequency.exponentialRampToValueAtTime(380, now + 0.15);
      cap2.frequency.setValueAtTime(1620, now);
      cap2.frequency.exponentialRampToValueAtTime(760, now + 0.22);

      capG.gain.setValueAtTime(0.0001, now);
      capG.gain.linearRampToValueAtTime(0.14, now + 0.004);
      capG.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      cap.connect(capG);
      cap2.connect(capG);
      capG.connect(sfxBus);
      cap.start(now);
      cap2.start(now);
      cap.stop(now + 0.26);
      cap2.stop(now + 0.26);
      return;
    }

    if (name === 'ward_hum') {
      // Resonant fifth-interval golden chime (D4, A4, D5, A5 + soft chorus)
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2800, now);
      lp.frequency.exponentialRampToValueAtTime(860, now + 1.25);
      lp.connect(sfxBus);

      var voices = [
        { f: 293.66, a: 0.085, d: 1.25, t: 'sine' },
        { f: 440.00, a: 0.075, d: 1.30, t: 'triangle' },
        { f: 441.60, a: 0.045, d: 1.25, t: 'sine' },
        { f: 587.33, a: 0.052, d: 1.15, t: 'sine' },
        { f: 880.00, a: 0.030, d: 0.95, t: 'sine' }
      ];
      voices.forEach(function (v) {
        var vo = ctx.createOscillator();
        var vg = ctx.createGain();
        vo.type = v.t;
        vo.frequency.setValueAtTime(v.f, now);
        vg.gain.setValueAtTime(0.0001, now);
        vg.gain.linearRampToValueAtTime(v.a, now + 0.025);
        vg.gain.exponentialRampToValueAtTime(0.0001, now + v.d);
        vo.connect(vg);
        vg.connect(lp);
        vo.start(now);
        vo.stop(now + v.d + 0.05);
      });
      return;
    }

    if (name === 'hit_impact') {
      // Punchy low-mid thud
      var thud = ctx.createOscillator();
      var body = ctx.createOscillator();
      var tg = ctx.createGain();
      thud.type = 'sine';
      body.type = 'triangle';
      thud.frequency.setValueAtTime(165, now);
      thud.frequency.exponentialRampToValueAtTime(44, now + 0.11);
      body.frequency.setValueAtTime(340, now);
      body.frequency.exponentialRampToValueAtTime(110, now + 0.055);
      tg.gain.setValueAtTime(0.0001, now);
      tg.gain.linearRampToValueAtTime(0.26, now + 0.005);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      thud.connect(tg);
      body.connect(tg);
      tg.connect(sfxBus);
      thud.start(now);
      body.start(now);
      thud.stop(now + 0.17);
      body.stop(now + 0.17);

      // Crisp transient snap
      var hitSnap = ctx.createBufferSource();
      hitSnap.buffer = pinkBuffer;
      var hbp = ctx.createBiquadFilter();
      hbp.type = 'bandpass';
      hbp.frequency.setValueAtTime(1550, now);
      hbp.Q.setValueAtTime(1.8, now);
      var hg = ctx.createGain();
      hg.gain.setValueAtTime(0.0001, now);
      hg.gain.linearRampToValueAtTime(0.22, now + 0.003);
      hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);
      hitSnap.connect(hbp);
      hbp.connect(hg);
      hg.connect(sfxBus);
      hitSnap.start(now);
      hitSnap.stop(now + 0.06);
      return;
    }

    if (name === 'glitch_burst') {
      // Short digital static stutter (3 gated bursts)
      var stutters = [
        { off: 0.00, freq: 2900, dur: 0.036, pk: 0.14 },
        { off: 0.055, freq: 1450, dur: 0.032, pk: 0.11 },
        { off: 0.115, freq: 3700, dur: 0.044, pk: 0.13 }
      ];
      stutters.forEach(function (st) {
        var t = now + st.off;
        var gn = ctx.createBufferSource();
        gn.buffer = whiteBuffer;
        var gbp = ctx.createBiquadFilter();
        gbp.type = 'bandpass';
        gbp.frequency.setValueAtTime(st.freq, t);
        gbp.Q.setValueAtTime(3.6, t);
        var gg = ctx.createGain();
        gg.gain.setValueAtTime(0.0001, t);
        gg.gain.linearRampToValueAtTime(st.pk, t + 0.003);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + st.dur);
        gn.connect(gbp);
        gbp.connect(gg);
        gg.connect(sfxBus);
        gn.start(t);
        gn.stop(t + st.dur + 0.01);
      });

      // Pitch-dropped corrupted radio tone
      var gt = ctx.createOscillator();
      var gtlp = ctx.createBiquadFilter();
      var gtg = ctx.createGain();
      gt.type = 'square';
      gt.frequency.setValueAtTime(1160, now + 0.015);
      gt.frequency.setValueAtTime(540, now + 0.085);
      gt.frequency.exponentialRampToValueAtTime(155, now + 0.25);

      gtlp.type = 'bandpass';
      gtlp.frequency.setValueAtTime(1500, now + 0.015);
      gtlp.Q.setValueAtTime(2.0, now + 0.015);

      gtg.gain.setValueAtTime(0.0001, now + 0.015);
      gtg.gain.linearRampToValueAtTime(0.065, now + 0.025);
      gtg.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);

      gt.connect(gtlp);
      gtlp.connect(gtg);
      gtg.connect(sfxBus);
      gt.start(now + 0.015);
      gt.stop(now + 0.29);
      return;
    }

    if (name === 'train_horn') {
      // Ominous distant low-brass dual-tone subway horn (A2 + C3 eerie minor third + subtle detune)
      var hlp = ctx.createBiquadFilter();
      hlp.type = 'lowpass';
      hlp.frequency.setValueAtTime(360, now);
      hlp.frequency.linearRampToValueAtTime(760, now + 0.35);
      hlp.frequency.exponentialRampToValueAtTime(290, now + 1.95);
      hlp.Q.setValueAtTime(2.1, now);

      var hGain = ctx.createGain();
      hGain.gain.setValueAtTime(0.0001, now);
      hGain.gain.linearRampToValueAtTime(0.18, now + 0.22);
      hGain.gain.setValueAtTime(0.17, now + 0.95);
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.05);

      hlp.connect(hGain);
      hGain.connect(sfxBus);

      var hornTones = [110.0, 110.65, 130.81, 131.35, 164.81];
      hornTones.forEach(function (f, idx) {
        var ho = ctx.createOscillator();
        var hg = ctx.createGain();
        ho.type = idx < 4 ? 'sawtooth' : 'triangle';
        ho.frequency.setValueAtTime(f * 0.985, now);
        ho.frequency.linearRampToValueAtTime(f, now + 0.24);
        ho.frequency.linearRampToValueAtTime(f * 0.978, now + 2.0);
        hg.gain.setValueAtTime(idx < 4 ? 0.24 : 0.10, now);
        ho.connect(hg);
        hg.connect(hlp);
        ho.start(now);
        ho.stop(now + 2.1);
      });

      // Faint pneumatic tunnel air hiss
      var air = ctx.createBufferSource();
      air.buffer = pinkBuffer;
      var abp = ctx.createBiquadFilter();
      abp.type = 'bandpass';
      abp.frequency.setValueAtTime(520, now);
      abp.Q.setValueAtTime(1.4, now);
      var ag = ctx.createGain();
      ag.gain.setValueAtTime(0.0001, now);
      ag.gain.linearRampToValueAtTime(0.045, now + 0.25);
      ag.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);
      air.connect(abp);
      abp.connect(ag);
      ag.connect(sfxBus);
      air.start(now);
      air.stop(now + 1.9);
    }
  }

  // =========================================================================
  // PUBLIC API (window.INFINITY.Audio)
  // =========================================================================

  window.INFINITY.Audio = {
    unlock: function () {
      if (!ensureContext()) return false;
      unlocked = true;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      applyBulletTimeFilter();
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
      applyExamStemMix();
    },

    updateSpatialSource: function (id, dx, dz, intensity) {
      if (id !== 'inspector' && id !== 'train') return;
      spatialPending[id] = {
        dx: Number(dx) || 0,
        dz: Number(dz) || 0,
        intensity: clamp(Number(intensity) || 0, 0, 1.25)
      };
      if (!unlocked || !ctx) return;
      applySpatialUpdate(id, spatialPending[id].dx, spatialPending[id].dz, spatialPending[id].intensity);
    },

    setBulletTime: function (enabled) {
      var next = !!enabled;
      if (bulletTimeEnabled === next) return;
      bulletTimeEnabled = next;
      applyBulletTimeFilter();
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
