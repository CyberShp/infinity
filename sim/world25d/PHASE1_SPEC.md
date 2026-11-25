# Phase 1 · Visual, Audio & Game-Feel Overhaul Spec (v4)

All modules attach to `window.INFINITY` and preserve 100% backward compatibility with Hall tabs (`shop`, `fusion`, `living`, `sparring`), DeepSeek live radio, and 2.5D Exam.

## 1. Asset Manifest & Hot-Swap Loader (`sim/data/asset_manifest.js`)
```js
window.INFINITY.ASSETS = {
  resolvePath(relPath),        // resolves 'assets/...' -> 'sim/assets/...' when on root index.html, or 'assets/...' when on sim/index.html
  portraits: {
    yanci: 'assets/portraits/yanci.webp',
    lujin: 'assets/portraits/lujin.webp',
    xutan: 'assets/portraits/xutan.webp',
    shenyan: 'assets/portraits/shenyan.webp',
    yelin: 'assets/portraits/yelin.webp',
    litianyang: 'assets/portraits/litianyang.webp',
    guhe: 'assets/portraits/guhe.webp',
    inspector: 'assets/portraits/inspector.webp'
  },
  tiles: {
    // Optional ComfyUI/MJ seamless tile overrides; empty by default until user drops files in sim/assets/tiles/
    // e.g. floor_slate: 'assets/tiles/floor_slate.webp'
  },
  getPortraitUrl(id),          // returns resolved URL string or null
  getTileUrl(name)             // returns resolved URL string or null
};
```

## 2. WebGL Post-Processing, True Line-of-Sight Shadow & Game Feel (`sim/world25d/engine_25d.js` + `pixel_sprites.js`)
- `PixelSprites`: checks `INFINITY.ASSETS.getTileUrl(name)` (only if non-null -> ZERO 404 console errors!); asynchronously loads external tile into the cached `THREE.CanvasTexture` with `NearestFilter` and `needsUpdate = true` when available.
- `World25D` upgrades:
  1. **True Wall-Occluded Fog-of-War / Line-of-Sight Shadow**:
     - 72-ray 2D visibility polygon around player computed against `StationMap` walls (`isWalkable`), rendered onto a GPU `CanvasTexture` ground-overlay plane (`y = 0.09` or `y = 2.65` semi-transparent dark shadow veil so walls behind occluders fall into obsidian darkness, while the Inspector's crimson lantern bleed & sound ripples remain eerily visible at edges!).
     - Automatically refreshes smoothly as player moves/turns.
  2. **2-Pass Custom WebGL Post-Processing (`PostFX` inside `engine_25d.js`, zero external CDN scripts)**:
     - Pass 1 renders scene to `THREE.WebGLRenderTarget` (`NearestFilter`).
     - Pass 2 draws fullscreen quad with custom GLSL fragment shader providing:
       - Selective Bright-Pass Neon Bloom (bright pixels `luma > 0.56` bloom outward so sword arcs, golden wards, cyan rail shots, neon trim, and crimson lantern genuinely glow!).
       - Subtle obsidian vignette & micro film grain; cyan rim tint during `Space` bullet-time; crimson pulse at low HP.
       - `uGlitch` uniform (RGB chromatic aberration + scanline horizontal tear) triggered on Fake Broadcasts, damage hits, and EMP blasts!
     - Expose `World25D.setPostFxEnabled(bool)` and `World25D.isPostFxEnabled()` (default `true`, graceful fallback to direct render if RenderTarget fails).
  3. **Game Feel / Juice**:
     - **Perfect Parry**: 70ms freeze-frame hit-stop + golden shockwave flash + `Audio.playSfx('parry_clang')` + `+25` energy refund when `sword_arc` interrupts Inspector's lunge telegraph!
     - **Hit-Stop & White Flash**: 50ms micro hit-stop + 90ms Inspector pure-white emissive flash + directional camera kick on attacks.
     - **Persistent Ground Marks & EMP Blackout**: sword slash scorch decals on floor (fade over 6s), golden ward dissipation embers, and 3.5s local overhead bulb blackout when EMP detonates!
     - **3D Spatial Audio Bridge**: each tick calls `Audio.updateSpatialSource('inspector', dx, dz, intensity)` and `Audio.updateSpatialSource('train', dx, dz, trainActive)`, plus `Audio.setBulletTime(slowMo)`!

## 3. 3D Spatial Audio & 3-Stem Adaptive BGM (`sim/engine/audio_engine.js`)
Keep all existing API methods (`unlock`, `setMuted`, `setVolume`, `isMuted`, `setScene`, `setThreatLevel`, `playSfx`) AND add:
```js
window.INFINITY.Audio.updateSpatialSource(id, dx, dz, intensity); // id: 'inspector' | 'train'
window.INFINITY.Audio.setBulletTime(enabled);                     // sweeps master filter to ~480Hz
```
New/upgraded SFX keys: `'parry_clang'` (70ms ambience duck + crisp crystalline blade-bell ring + sub-thud), `'sword_slash'`, `'emp_boom'`, `'rail_fire'`, `'ward_hum'`, `'hit_impact'`, `'glitch_burst'`, `'train_horn'`.
3-stem adaptive soundtrack in exam (`explore` -> `stalk` -> `combat`) smoothly crossfaded by threat level.

## 4. CRT Radio Portrait HUD & Asset Pipeline (`sim/ui/app_ui.js`, `sim/sim.css`, `index.html`, `sim/index.html`)
- Load `sim/data/asset_manifest.js?v=4` before `pixel_sprites.js` in both HTML files; bump all scripts/CSS to `?v=4`.
- **2.5D Live Radio CRT Portrait Speaker Bar**: inside `#hud25d-radio-panel`, show the active speaker's crisp pixelated CRT portrait (`64×64` frame with scanline sheen & color-coded signal LED for `yanci`/`lujin`/`xutan`/`shenyan`/`inspector` + glitch static when Fake Broadcast hits!).
- **Living Hall Character Portraits**: show crisp pixel CRT portraits in the Living Hall cast list and active chat header!
- **Top HUD FX Toggle (`#btn-fx-toggle`)**: lets players toggle Bloom/PostFX on/off cleanly (`World25D.setPostFxEnabled`).
- **STRICT RULE**: ZERO `backdrop-filter` anywhere in `sim/sim.css`! ZERO hardcoded API keys!
