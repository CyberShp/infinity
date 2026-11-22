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
    paceEnabled: readPref('pace'),
    ctx: null,
    bgmEl: null,
    currentBgmKey: null,
    unlocked: false,
    missing: new Set(),
    bufferCache: new Map(),

    setPref(key, val) {
      if (key === 'fx') this.fxEnabled = val;
      if (key === 'audio') {
        this.sfxEnabled = val;
        if (!val) this.stopBgm();
        else if (this.currentBgmKey) {
          const k = this.currentBgmKey;
          this.currentBgmKey = null;
          this.playBgm(k);
        }
      }
      if (key === 'pace') this.paceEnabled = val;
      savePref(key, val);
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
      if (this.sfxEnabled && this.currentBgmKey && (!this.bgmEl || this.bgmEl.paused)) {
        const k = this.currentBgmKey;
        this.currentBgmKey = null;
        this.playBgm(k);
      }
    },

    playBgm(key) {
      const manifest = global.AV_MANIFEST;
      const src = manifest && manifest.bgm && manifest.bgm[key];
      if (!src || this.missing.has(src)) return;
      if (this.currentBgmKey === key && this.bgmEl && !this.bgmEl.paused) return;
      this.currentBgmKey = key;
      if (!this.sfxEnabled || !this.unlocked) return;

      try {
        if (this.bgmEl) {
          this.bgmEl.pause();
          this.bgmEl.src = '';
        }
        const el = new Audio(src);
        el.loop = true;
        el.volume = key === 'crisis' ? 0.42 : 0.32;
        el.onerror = () => { this.missing.add(src); };
        el.play().catch(() => {});
        this.bgmEl = el;
      } catch {}
    },

    stopBgm() {
      if (this.bgmEl) {
        try { this.bgmEl.pause(); } catch {}
      }
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
