import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

function createMockAudioParam(initialValue = 0) {
  const history = [];
  return {
    value: initialValue,
    history,
    setValueAtTime(val, t) {
      this.value = val;
      history.push({ op: 'setValueAtTime', val, t });
    },
    setTargetAtTime(val, t, tc) {
      this.value = val;
      history.push({ op: 'setTargetAtTime', val, t, tc });
    },
    linearRampToValueAtTime(val, t) {
      this.value = val;
      history.push({ op: 'linearRampToValueAtTime', val, t });
    },
    exponentialRampToValueAtTime(val, t) {
      this.value = val;
      history.push({ op: 'exponentialRampToValueAtTime', val, t });
    },
    cancelScheduledValues(t) {
      history.push({ op: 'cancelScheduledValues', t });
    }
  };
}

function createMockAudioContext() {
  const nodes = {
    gains: [],
    biquads: [],
    oscillators: [],
    bufferSources: [],
    compressors: []
  };

  class MockAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this.currentTime = 1.0;
      this.state = 'running';
      this.destination = { kind: 'destination' };
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    createGain() {
      const node = {
        kind: 'gain',
        gain: createMockAudioParam(1),
        connections: [],
        connect(dest) { this.connections.push(dest); return dest; },
        disconnect() {}
      };
      nodes.gains.push(node);
      return node;
    }
    createBiquadFilter() {
      const node = {
        kind: 'biquad',
        type: 'lowpass',
        frequency: createMockAudioParam(350),
        Q: createMockAudioParam(1),
        gain: createMockAudioParam(0),
        connections: [],
        connect(dest) { this.connections.push(dest); return dest; },
        disconnect() {}
      };
      nodes.biquads.push(node);
      return node;
    }
    createDynamicsCompressor() {
      const node = {
        kind: 'compressor',
        threshold: createMockAudioParam(-24),
        knee: createMockAudioParam(30),
        ratio: createMockAudioParam(12),
        attack: createMockAudioParam(0.003),
        release: createMockAudioParam(0.25),
        connections: [],
        connect(dest) { this.connections.push(dest); return dest; },
        disconnect() {}
      };
      nodes.compressors.push(node);
      return node;
    }
    createOscillator() {
      const node = {
        kind: 'oscillator',
        type: 'sine',
        frequency: createMockAudioParam(440),
        started: false,
        stopped: false,
        connections: [],
        connect(dest) { this.connections.push(dest); return dest; },
        disconnect() {},
        start() { this.started = true; },
        stop() { this.stopped = true; }
      };
      nodes.oscillators.push(node);
      return node;
    }
    createBuffer(channels, length) {
      const data = new Float32Array(length);
      return {
        numberOfChannels: channels,
        length,
        getChannelData() { return data; }
      };
    }
    createBufferSource() {
      const node = {
        kind: 'bufferSource',
        buffer: null,
        loop: false,
        started: false,
        connections: [],
        connect(dest) { this.connections.push(dest); return dest; },
        disconnect() {},
        start() { this.started = true; },
        stop() {}
      };
      nodes.bufferSources.push(node);
      return node;
    }
    createStereoPanner() {
      return {
        kind: 'panner',
        pan: createMockAudioParam(0),
        connect(dest) { return dest; },
        disconnect() {}
      };
    }
  }

  return { MockAudioContext, nodes };
}

function loadAudioEngine(withDom = false) {
  const { MockAudioContext, nodes } = createMockAudioContext();
  const timers = [];
  const intervals = [];
  let hudEl = null;
  const observers = [];

  class MockMutationObserver {
    constructor(cb) {
      this.cb = cb;
      this.target = null;
      observers.push(this);
    }
    observe(target) {
      this.target = target;
    }
    disconnect() {
      this.target = null;
    }
    trigger() {
      if (this.target) this.cb([]);
    }
  }

  if (withDom) {
    hudEl = {
      id: 'hud25d-threat-val',
      _text: '8 / 12',
      get textContent() { return this._text; },
      set textContent(val) {
        this._text = String(val);
        for (const obs of observers) {
          if (obs.target === hudEl) obs.trigger();
        }
      }
    };
  }

  const sandbox = {
    Math,
    Number,
    String,
    Object,
    Array,
    Float32Array,
    RegExp,
    console,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    AudioContext: MockAudioContext,
    setTimeout(fn, ms) {
      const id = timers.length + 1;
      timers.push({ id, fn, ms });
      return id;
    },
    clearTimeout() {},
    setInterval(fn, ms) {
      const id = intervals.length + 1;
      intervals.push({ id, fn, ms });
      return id;
    },
    clearInterval() {}
  };

  if (withDom) {
    sandbox.MutationObserver = MockMutationObserver;
    sandbox.document = {
      readyState: 'complete',
      getElementById(id) {
        return id === 'hud25d-threat-val' ? hudEl : null;
      },
      addEventListener() {}
    };
  }

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  const code = fs.readFileSync(path.resolve(process.cwd(), 'sim/engine/audio_engine.js'), 'utf8');
  vm.runInContext(code, sandbox, { filename: 'sim/engine/audio_engine.js' });

  return { Audio: sandbox.INFINITY.Audio, nodes, hudEl, observers };
}

test('computeThreatLowFreqVibration stays inactive at or below threshold 12 and escalates above 12', () => {
  const { Audio } = loadAudioEngine(false);

  assert.equal(Audio.LOW_FREQ_VIBRATION_THRESHOLD, 12);

  for (const level of [0, 5, 11.9, 12]) {
    const res = Audio.computeThreatLowFreqVibration(level, 'station_calm');
    assert.equal(res.active, false, `Expected inactive at threat ${level}`);
    assert.equal(res.intensity, 0);
    assert.equal(res.lowShelfGainDb, 0);
    assert.equal(res.subDroneGain, 0);
    assert.equal(res.lfoDepthRatio, 0);
    assert.equal(res.lfoDepth, 0);
  }

  const levels = [12.1, 13, 20, 45, 75, 100];
  let prev = null;
  for (const level of levels) {
    const res = Audio.computeThreatLowFreqVibration(level, 'station_calm');
    assert.equal(res.active, true, `Expected active at threat ${level}`);
    assert.ok(res.intensity > 0 && res.intensity <= 1);
    assert.ok(res.lowShelfGainDb > 0);
    assert.ok(res.subDroneGain > 0);
    assert.ok(res.lfoDepthRatio > 0);
    assert.ok(res.lfoDepth > 0);
    if (prev) {
      assert.ok(res.intensity > prev.intensity, `intensity should increase from ${prev.threatLevel} to ${level}`);
      assert.ok(res.lowShelfGainDb > prev.lowShelfGainDb, `lowShelfGainDb should increase from ${prev.threatLevel} to ${level}`);
      assert.ok(res.subDroneGain > prev.subDroneGain, `subDroneGain should increase from ${prev.threatLevel} to ${level}`);
      assert.ok(res.lfoRateHz > prev.lfoRateHz, `lfoRateHz should increase from ${prev.threatLevel} to ${level}`);
      assert.ok(res.lfoDepth > prev.lfoDepth, `lfoDepth should increase from ${prev.threatLevel} to ${level}`);
      assert.ok(res.subBaseFreqHz < prev.subBaseFreqHz, `subBaseFreqHz should deepen from ${prev.threatLevel} to ${level}`);
    }
    prev = res;
  }
});

test('computeThreatLowFreqVibration stays calm in non-exam scenes and spikes during crisis', () => {
  const { Audio } = loadAudioEngine(false);

  assert.equal(Audio.computeThreatLowFreqVibration(80, 'hall').active, false);
  assert.equal(Audio.computeThreatLowFreqVibration(80, 'settlement').active, false);

  const crisis = Audio.computeThreatLowFreqVibration(5, 'crisis');
  assert.equal(crisis.active, true);
  assert.ok(crisis.intensity >= 0.85);
  assert.ok(crisis.lowShelfGainDb >= 9);
});

test('parseHudThreatLevel extracts threat number from HUD readout formats', () => {
  const { Audio } = loadAudioEngine(false);

  assert.equal(Audio.parseHudThreatLevel('10 / 15'), 15);
  assert.equal(Audio.parseHudThreatLevel('8 / 12'), 12);
  assert.equal(Audio.parseHudThreatLevel('42 / 78.5'), 78.5);
  assert.equal(Audio.parseHudThreatLevel('30'), 30);
  assert.equal(Audio.parseHudThreatLevel('140'), 100);
  assert.equal(Audio.parseHudThreatLevel(''), null);
  assert.equal(Audio.parseHudThreatLevel(null), null);
});

test('Web Audio graph boosts lowshelf & sub-bass LFO vibration when threat exceeds 12', () => {
  const { Audio, nodes } = loadAudioEngine(false);

  Audio.unlock();
  Audio.setScene('station_calm');
  Audio.setThreatLevel(12);

  const lowShelf = nodes.biquads.find((b) => b.type === 'lowshelf');
  assert.ok(lowShelf, 'Expected ambienceLowShelf BiquadFilterNode to exist');
  assert.equal(lowShelf.frequency.value, 105);
  assert.equal(lowShelf.gain.value, 0);
  assert.equal(Audio.getLowFreqVibrationState().active, false);

  // Raise threat above 12 -> low-frequency shelf and sub-bass vibration ramp up
  Audio.setThreatLevel(18);
  const st18 = Audio.getLowFreqVibrationState();
  assert.equal(st18.active, true);
  assert.ok(lowShelf.gain.value > 2.5, `Expected lowshelf boost > 2.5dB, got ${lowShelf.gain.value}`);

  // Escalate further -> stronger low-frequency vibration amplitude
  Audio.setThreatLevel(70);
  const st70 = Audio.getLowFreqVibrationState();
  assert.ok(st70.lowShelfGainDb > st18.lowShelfGainDb);
  assert.ok(st70.subDroneGain > st18.subDroneGain);
  assert.ok(st70.lfoDepth > st18.lfoDepth);
  assert.equal(lowShelf.gain.value, st70.lowShelfGainDb);

  // Drop back to 12 -> smoothly returns to inactive baseline
  Audio.setThreatLevel(12);
  assert.equal(Audio.getLowFreqVibrationState().active, false);
  assert.equal(lowShelf.gain.value, 0);
});

test('HUD #hud25d-threat-val mutations automatically sync low-frequency vibration in exam scenes', () => {
  const { Audio, hudEl } = loadAudioEngine(true);

  Audio.unlock();
  Audio.setScene('station_calm');
  Audio.setThreatLevel(10);
  assert.equal(Audio.getLowFreqVibrationState().active, false);

  // Mutate HUD readout to threat = 12 (boundary, not exceeding 12)
  hudEl.textContent = '9 / 12';
  assert.equal(Audio.getLowFreqVibrationState().active, false);

  // Mutate HUD readout to threat = 28 (> 12)
  hudEl.textContent = '14 / 28';
  const st28 = Audio.getLowFreqVibrationState();
  assert.equal(st28.active, true);
  assert.equal(st28.threatLevel, 28);
  assert.ok(st28.lowShelfGainDb > 3);
  assert.ok(st28.subDroneGain > 0.05);

  // Switching to hall silences exam low-frequency threat vibration
  Audio.setScene('hall');
  assert.equal(Audio.getLowFreqVibrationState().active, false);
});
