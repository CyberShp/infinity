// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.0 — 真实实录拟音与空间听梆音频引擎
// 严格使用 Codex 实录剪辑的 14+3 条 .mp3 音频，支持竹骨梆左右声道方位平移与距离衰减
// ============================================================================
(function (global) {
  'use strict';

  function readPref(key) {
    try { return localStorage.getItem('white_mist_av_' + key) !== 'off'; }
    catch { return true; }
  }
  function savePref(key, enabled) {
    try { localStorage.setItem('white_mist_av_' + key, enabled ? 'on' : 'off'); } catch {}
  }

  const AudioEngine = {
    fxEnabled: readPref('fx'),
    sfxEnabled: readPref('audio'),
    voiceEnabled: readPref('voice'),
    paceEnabled: readPref('pace'),
    ctx: null,
    bgmEl: null,
    voiceEl: null,
    currentBgmKey: null,
    unlocked: false,
    missing: new Set(),
    bufferCache: new Map(),

    setPref(key, val) {
      if (key === 'fx') this.fxEnabled = val;
      if (key === 'audio') {
        this.sfxEnabled = val;
        if (!val) {
          this.stopBgm();
          this.stopSystemBroadcast();
        } else if (this.currentBgmKey) {
          const k = this.currentBgmKey;
          this.currentBgmKey = null;
          this.playBgm(k);
        }
      }
      if (key === 'voice') {
        this.voiceEnabled = val;
        if (!val) this.stopSystemBroadcast();
      }
      if (key === 'pace') this.paceEnabled = val;
      savePref(key, val);
    },

    _bgmTargetVolume(key) {
      if (key === 'crisis') return 0.90;
      if (key === 'manor_quiet') return 0.88;
      return 0.82;
    },

    _duckBgm(duck) {
      if (!this.bgmEl) return;
      try {
        this.bgmEl.volume = duck ? 0.25 : this._bgmTargetVolume(this.currentBgmKey);
      } catch {}
    },

    unlock() {
      this.unlocked = true;
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (Ctx && !this.ctx) {
        try { this.ctx = new Ctx(); } catch {}
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.sfxEnabled && this.currentBgmKey) {
        if (this.bgmEl && this.bgmEl.paused) {
          this.bgmEl.play().catch(() => {});
        } else if (!this.bgmEl) {
          const k = this.currentBgmKey;
          this.currentBgmKey = null;
          this.playBgm(k);
        }
      }
    },

    playBgm(key) {
      const manifest = global.AV_MANIFEST;
      const src = manifest && manifest.bgm && manifest.bgm[key];
      if (!src || this.missing.has(src)) return;
      if (this.currentBgmKey === key && this.bgmEl && !this.bgmEl.paused) return;
      this.currentBgmKey = key;
      if (!this.sfxEnabled) return;

      try {
        if (this.bgmEl) {
          this.bgmEl.pause();
          this.bgmEl.src = '';
        }
        const el = new Audio(src);
        el.loop = true;
        el.volume = this._bgmTargetVolume(key);
        el.onerror = () => { this.missing.add(src); };
        this.bgmEl = el;
        const p = el.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch {}
    },

    stopBgm() {
      if (this.bgmEl) {
        try { this.bgmEl.pause(); } catch {}
      }
    },

    stopSystemBroadcast() {
      if (this.voiceEl) {
        try {
          this.voiceEl.pause();
          this.voiceEl.src = '';
        } catch {}
        this.voiceEl = null;
      }
      try {
        if (global.speechSynthesis && typeof global.speechSynthesis.cancel === 'function') {
          global.speechSynthesis.cancel();
        }
      } catch {}
      this._duckBgm(false);
    },

    _pickFemaleZhVoice() {
      try {
        const synth = global.speechSynthesis;
        if (!synth || typeof synth.getVoices !== 'function') return null;
        const voices = synth.getVoices() || [];
        const zhVoices = voices.filter(v => /zh|cmn|chinese/i.test(v.lang || ''));
        if (!zhVoices.length) return null;
        const maleRe = /kangkang|yunxi|yunjian|yunyang|yunze|danny|zhiwei|male|男/i;
        const femaleRe = /xiaoxiao|xiaoyi|ting-ting|tingting|meijia|mei-jia|lili|yaoyao|huihui|sin-ji|shanshan|yating|hanj|female|女|google 普通话/i;
        const preferred = zhVoices.find(v => femaleRe.test(v.name || '') && !maleRe.test(v.name || ''));
        if (preferred) return preferred;
        const nonMale = zhVoices.find(v => !maleRe.test(v.name || ''));
        return nonMale || zhVoices[0];
      } catch {
        return null;
      }
    },

    _speakCustomerServiceFemale(spokenText) {
      if (!spokenText || !this.sfxEnabled || !this.voiceEnabled) return;
      try {
        const synth = global.speechSynthesis;
        const Utter = global.SpeechSynthesisUtterance;
        if (!synth || typeof Utter !== 'function') return;
        synth.cancel();
        const u = new Utter(spokenText);
        u.lang = 'zh-CN';
        u.rate = 0.96;
        u.pitch = 1.06;
        u.volume = 0.95;
        const v = this._pickFemaleZhVoice();
        if (v) u.voice = v;
        this._duckBgm(true);
        u.onend = () => this._duckBgm(false);
        u.onerror = () => this._duckBgm(false);
        synth.speak(u);
      } catch {}
    },

    /**
     * 死考客服女声双轨播报：
     * 1) 优先播放预生成 zh-CN-XiaoxiaoNeural 客服女声 .mp3，同时柔和压低 BGM 音量
     * 2) 若离线/缺失则兜底使用中文女声 speechSynthesis（pitch 1.06，严排男声）
     */
    playSystemBroadcast(voiceKey, spokenText) {
      if (!this.sfxEnabled) return;
      this.stopSystemBroadcast();
      this.playSfx('watch', { volume: 0.65 });
      if (!this.voiceEnabled) return;

      const manifest = global.AV_MANIFEST;
      const src = manifest && manifest.voice && voiceKey && manifest.voice[voiceKey];
      if (src && !this.missing.has(src) && typeof Audio === 'function') {
        try {
          const el = new Audio(src);
          el.volume = 0.96;
          this._duckBgm(true);
          el.onended = () => {
            if (this.voiceEl === el) this.voiceEl = null;
            this._duckBgm(false);
          };
          el.onerror = () => {
            this.missing.add(src);
            if (this.voiceEl === el) this.voiceEl = null;
            this._duckBgm(false);
            this._speakCustomerServiceFemale(spokenText);
          };
          this.voiceEl = el;
          const p = el.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              if (this.voiceEl === el) this.voiceEl = null;
              this._duckBgm(false);
              this._speakCustomerServiceFemale(spokenText);
            });
          }
          return;
        } catch {}
      }
      this._speakCustomerServiceFemale(spokenText);
    },

    /**
     * 播放实录拟音 .mp3，支持 pan (-1左 ~ 1右) 与 gain (0.1 ~ 1.0) 实现“听梆辨位”
     */
    playSfx(key, opts) {
      if (!this.sfxEnabled) return;
      const manifest = global.AV_MANIFEST;
      const src = manifest && manifest.sfx && manifest.sfx[key];
      if (!src || this.missing.has(src)) return;

      const volume = Math.max(0.08, Math.min(1.0, (opts && typeof opts.volume === 'number') ? opts.volume : 0.72));
      const pan = (opts && typeof opts.pan === 'number') ? Math.max(-1, Math.min(1, opts.pan)) : 0;

      // 优先使用 WebAudio StereoPanner 精确呈现回廊方位
      if (this.ctx && pan !== 0 && typeof fetch === 'function') {
        this._playPanned(src, volume, pan).catch(() => this._playSimple(src, volume));
        return;
      }
      this._playSimple(src, volume);
    },

    _playSimple(src, volume) {
      try {
        const el = new Audio(src);
        el.volume = volume;
        el.onerror = () => { this.missing.add(src); };
        el.play().catch(() => {});
      } catch {}
    },

    async _playPanned(src, volume, pan) {
      if (!this.ctx) return this._playSimple(src, volume);
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      let buf = this.bufferCache.get(src);
      if (!buf) {
        const res = await fetch(src);
        if (!res.ok) { this.missing.add(src); return; }
        const arr = await res.arrayBuffer();
        buf = await this.ctx.decodeAudioData(arr);
        this.bufferCache.set(src, buf);
      }
      const srcNode = this.ctx.createBufferSource();
      srcNode.buffer = buf;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = volume;
      if (typeof this.ctx.createStereoPanner === 'function') {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = pan;
        srcNode.connect(panner);
        panner.connect(gainNode);
      } else {
        srcNode.connect(gainNode);
      }
      gainNode.connect(this.ctx.destination);
      srcNode.start(0);
    },

    /**
     * 根据账房伥巡区与玩家所在房间计算左右声道与远近音量，触发实录竹骨梆声
     */
    playWatchmanBang(watchmanZone, playerRoom) {
      const zonePos = {
        gate: { x: 0, y: 0 },
        courtyard: { x: 0, y: 1 },
        east: { x: 1, y: 2 },
        shrine: { x: 1, y: 1.5 },
        hall: { x: 0, y: 2 },
        west: { x: -1, y: 2 },
        corridor: { x: 0, y: 3 },
        inner_study: { x: 1, y: 3.5 },
        coffin_hall: { x: 0, y: 4 },
        embroidery_loft: { x: -1, y: 4 },
        well: { x: 0, y: 4.5 },
        canal: { x: 0, y: 5 }
      };
      const w = zonePos[watchmanZone] || { x: 0, y: 1 };
      const p = zonePos[playerRoom] || { x: 0, y: 2 };
      const dist = Math.hypot(w.x - p.x, w.y - p.y);
      const pan = Math.max(-0.85, Math.min(0.85, (w.x - p.x) * 0.65));
      const volume = Math.max(0.18, Math.min(0.95, 0.92 - dist * 0.19));
      this.playSfx('watchman_bang', { pan, volume });
    }
  };

  global.AudioEngine = AudioEngine;
})(typeof window !== 'undefined' ? window : globalThis);
