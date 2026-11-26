/* ============================================================================
 * INFINITY // CUSTOM GLSL SHADER & 14-ARCHETYPE VFX STUDIO (vfx_studio.js)
 * Classic non-module script exposing window.INFINITY.VfxStudio
 *
 * Transforms every single skill archetype into an unmistakable, high-craft
 * 3D visual spectacle using Three.js r147 GLSL 1.0 ShaderMaterials, high-res
 * procedural alpha/rune/hex/slash/fissure textures, and distinct choreography:
 *   1. sword_arc      — Sweeping 3D GLSL crescent slash shader + cross-cut + glowing fissure
 *   2. ward_circle    — Dual rotating 256px sigil + Fresnel scrolling-rune curtain + 3D pylons
 *   3. emp_blast      — Hex Fresnel plasma dome + crossed-ribbon branching 3D lightning arcs
 *   4. rail_shot      — Scrolling plasma ribbon beam + spaced 3D Mach shock-cones + crater flare
 *   5. blink_mark     — Sculpted 3D spatial crystal + vertical dimensional rift slit + void rings
 *   6. aegis_shield   — Personal Fresnel hex-geodesic armor dome + twin tilted orbit rings
 *   7. overclock      — Chrono-wing speed ribbons + golden-cyan velocity halo + radial streaks
 *   8. heal_pulse     — Feathered volumetric sanctuary light shaft + double-helix ribbons + motes
 *   9. stealth_veil   — Vertical optical-camo sweep curtain + refractive dark mist puffs
 *  10. seal_chain     — Sculpted 3D interlocked chain links + rotating containment seal plates
 *  11. recon_pulse    — Expanding sonar radar dome + 360° volumetric sweep wedge + tick rings
 *  12. turret_drone   — Multi-part 3D hover turret with gyro ring, barrels & thruster glow
 *  13. decoy_flare    — Sculpted beacon canister + holographic silhouette + acoustic pulse waves
 *  14. berserk_strike — Branching glowing magma fissure crater + erupting 3D shards + impact dome
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = global.INFINITY = global.INFINITY || {};

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function hexToInt(hex, fallback) {
    if (typeof hex === 'number' && !isNaN(hex)) return hex;
    if (typeof hex === 'string') {
      var clean = hex.replace(/^#/, '');
      var n = parseInt(clean, 16);
      if (!isNaN(n)) return n;
    }
    return fallback !== undefined ? fallback : 0x6fd8ea;
  }

  // Thematic motif palettes & visual signatures.
  // Source of truth: INFINITY.ArtTokens.MOTIFS (sim/data/art_tokens.js).
  // The inline table is a fallback used only when art_tokens.js is not loaded,
  // and must stay byte-identical to the ArtTokens values.
  var MOTIF_STYLES_FALLBACK = {
    sword_qi:        { primary: 0x5ce8ff, secondary: 0xf6d57a, core: 0xffffff, pattern: 'vfx_rune_strip',  sigil: 'sigil_bagua' },
    flame_solar:     { primary: 0xff8424, secondary: 0xffe066, core: 0xfff8dc, pattern: 'vfx_rune_strip',  sigil: 'sigil_arcane_star' },
    thunder_emp:     { primary: 0x48c6ff, secondary: 0x9aa4ff, core: 0xf0ffff, pattern: 'vfx_hex_pattern', sigil: 'sigil_hex_grid' },
    frost_cryo:      { primary: 0x8cf2ff, secondary: 0xd8fbff, core: 0xffffff, pattern: 'vfx_hex_pattern', sigil: 'sigil_arcane_star' },
    blood_sanguine:  { primary: 0xc838a8, secondary: 0xff94d2, core: 0xffe8f7, pattern: 'vfx_rune_strip',  sigil: 'sigil_blood_crest' },
    void_space:      { primary: 0x8f5cff, secondary: 0x52e0ff, core: 0xf4e8ff, pattern: 'vfx_hex_pattern', sigil: 'sigil_occult_eye' },
    holy_tao:        { primary: 0xf5cf64, secondary: 0xfff0b2, core: 0xffffff, pattern: 'vfx_rune_strip',  sigil: 'sigil_bagua' },
    occult_meme:     { primary: 0xc852ff, secondary: 0x7a5cff, core: 0xf6e8ff, pattern: 'vfx_rune_strip',  sigil: 'sigil_occult_eye' },
    bio_venom:       { primary: 0x46e88a, secondary: 0xb4ff6e, core: 0xeafff2, pattern: 'vfx_hex_pattern', sigil: 'sigil_tactical_hud' },
    cyber_tactical:  { primary: 0x38d6d6, secondary: 0xf2b852, core: 0xffffff, pattern: 'vfx_hex_pattern', sigil: 'sigil_tactical_hud' },
    shadow_ninja:    { primary: 0x6878ff, secondary: 0x4ac8e8, core: 0xe2dcff, pattern: 'vfx_rune_strip',  sigil: 'sigil_occult_eye' },
    gravity_kinetic: { primary: 0xd4b84e, secondary: 0x8ca8d8, core: 0xfff7d6, pattern: 'vfx_hex_pattern', sigil: 'sigil_hex_grid' }
  };

  function buildMotifStyles() {
    var tokens = INFINITY.ArtTokens && INFINITY.ArtTokens.MOTIFS;
    var out = {};
    for (var id in MOTIF_STYLES_FALLBACK) {
      if (!Object.prototype.hasOwnProperty.call(MOTIF_STYLES_FALLBACK, id)) continue;
      var fb = MOTIF_STYLES_FALLBACK[id];
      var tk = tokens && tokens[id];
      if (!tk) {
        out[id] = fb;
        continue;
      }
      out[id] = {
        primary: hexToInt(tk.primaryInt !== undefined ? tk.primaryInt : tk.primary, fb.primary),
        secondary: hexToInt(tk.secondaryInt !== undefined ? tk.secondaryInt : tk.secondary, fb.secondary),
        core: hexToInt(tk.coreInt !== undefined ? tk.coreInt : tk.core, fb.core),
        pattern: tk.pattern || fb.pattern,
        sigil: tk.sigil || fb.sigil
      };
    }
    return out;
  }

  var MOTIF_STYLES = buildMotifStyles();

  /* --------------------------------------------------------------------------
   * Per-session shared geometry cache.
   * Cached geometries live on session._vfxGeoCache (never module-global), are
   * flagged userData.shared = true, and are registered through
   * session.trackGeo so the engine disposes them on unmount. Per-cast handles
   * must release resources through disposeIfOwned(), which skips shared ones.
   * -------------------------------------------------------------------------- */
  function getSharedGeo(session, key, factory) {
    var cache = session._vfxGeoCache;
    if (!cache) {
      cache = Object.create(null);
      session._vfxGeoCache = cache;
    }
    var geo = cache[key];
    if (!geo) {
      geo = factory(session.THREE);
      geo.userData = geo.userData || {};
      geo.userData.shared = true;
      if (typeof session.trackGeo === 'function') session.trackGeo(geo);
      cache[key] = geo;
    }
    return geo;
  }

  function disposeIfOwned(obj) {
    if (!obj || typeof obj.dispose !== 'function') return;
    if (obj.userData && obj.userData.shared) return;
    obj.dispose();
  }

  // Unit plane lying on the XZ ground plane (1 x 1); size via mesh.scale.x/z.
  function getUnitFloorPlane(session) {
    return getSharedGeo(session, 'floor_plane_1', function (THREE) {
      var g = new THREE.PlaneGeometry(1, 1);
      g.rotateX(-Math.PI / 2);
      return g;
    });
  }

  // Unit camera-facing style plane in XY (1 x 1); size via mesh.scale.x/y.
  function getUnitPlane(session) {
    return getSharedGeo(session, 'plane_1', function (THREE) {
      return new THREE.PlaneGeometry(1, 1);
    });
  }

  // Unit-radius partial dome; radius via mesh.scale.
  function getUnitDome(session, widthSeg, heightSeg, thetaFrac) {
    var key = 'dome_1_' + widthSeg + '_' + heightSeg + '_' + thetaFrac;
    return getSharedGeo(session, key, function (THREE) {
      return new THREE.SphereGeometry(1.0, widthSeg, heightSeg, 0, Math.PI * 2, 0, Math.PI * thetaFrac);
    });
  }

  // Open cylinder of height 1 along +Y; segment length via mesh.scale.y.
  function getUnitOpenCylinder(session, radius, radialSeg) {
    var key = 'cyl_open_h1_' + radius + '_' + radialSeg;
    return getSharedGeo(session, key, function (THREE) {
      return new THREE.CylinderGeometry(radius, radius, 1, radialSeg, 1, true);
    });
  }

  var SPARK_MAX = 34;
  var SPARK_VARIANTS = 3;

  // Spark burst geometry: each vertex stores its launch velocity (vx, vy, vz).
  // With Points.scale = t and Points.position.y = y0 - 0.5 * g * t^2 the
  // vertices follow p(t) = origin + v * t + 0.5 * g * t^2 without any
  // per-frame attribute upload, so one geometry is reusable across casts.
  function getSparkGeo(session, count, variant) {
    var key = 'spark_' + count + '_' + variant;
    return getSharedGeo(session, key, function (THREE) {
      var positions = new Float32Array(count * 3);
      var seed = (count * 7919 + variant * 104729 + 17) >>> 0;
      function rnd() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      }
      for (var i = 0; i < count; i++) {
        var a = rnd() * Math.PI * 2;
        var spd = 2.0 + rnd() * 4.4;
        positions[i * 3] = Math.cos(a) * spd;
        positions[i * 3 + 1] = 1.2 + rnd() * 3.4;
        positions[i * 3 + 2] = Math.sin(a) * spd;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.computeBoundingSphere();
      return g;
    });
  }

  function resolveVfxColors(colorHex, vfx) {
    var motif = (vfx && vfx.motif) || 'cyber_tactical';
    var style = MOTIF_STYLES[motif] || MOTIF_STYLES.cyber_tactical;
    return {
      motif: motif,
      primary: hexToInt((vfx && vfx.primaryColor) || colorHex, style.primary),
      secondary: hexToInt(vfx && vfx.secondaryColor, style.secondary),
      core: hexToInt(vfx && vfx.coreColor, style.core),
      pattern: style.pattern,
      sigil: 'sigil_' + ((vfx && vfx.sigilStyle) || style.sigil.replace(/^sigil_/, '')),
      intensity: clamp(Number(vfx && vfx.tierIntensity) || 1.0, 0.85, 1.55)
    };
  }

  function getTex(session, name) {
    if (INFINITY.PixelSprites && typeof INFINITY.PixelSprites.getPropTexture === 'function') {
      return INFINITY.PixelSprites.getPropTexture(name);
    }
    if (session && typeof session.getPropTex === 'function') {
      return session.getPropTex(name, '#ffffff');
    }
    return null;
  }

  // Shader uniforms take linear-space colors: the scene renders linear into the
  // PostFX render target and is sRGB-encoded once on output. Every custom
  // fragment shader ends with linearToOutputTexel() (injected by three r147 for
  // non-raw ShaderMaterial) so FX-on and FX-off paths match the authored colors.
  function linearColor(THREE, hex) {
    var c = new THREE.Color(hex);
    if (typeof c.convertSRGBToLinear === 'function') c.convertSRGBToLinear();
    return c;
  }

  /* --------------------------------------------------------------------------
   * Custom GLSL 1.0 ShaderMaterial Builders (Three.js r147 compatible)
   * -------------------------------------------------------------------------- */

  // 1. Sweeping Crescent Slash Arc Shader (fluid tapered blade reveal — NEVER a pie slice!)
  function createSlashShaderMaterial(THREE, primaryHex, secondaryHex, coreHex, slashTex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: slashTex },
        uColorA: { value: linearColor(THREE, primaryHex) },
        uColorB: { value: linearColor(THREE, secondaryHex) },
        uCore: { value: linearColor(THREE, coreHex) },
        uProgress: { value: 0.0 },
        uOpacity: { value: 1.0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform sampler2D uMap;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'uniform vec3 uCore;',
        'uniform float uProgress;',
        'uniform float uOpacity;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 p = vUv - vec2(0.5);',
        '  float ang = atan(p.y, p.x);', // -PI..PI, 0 is +X center
        '  float normAng = clamp((ang + 2.25) / 4.5, 0.0, 1.0);',
        '  // Dynamic sweep reveal head & eroding tail',
        '  float head = clamp(uProgress * 1.45, 0.0, 1.15);',
        '  float tail = clamp((uProgress - 0.28) * 1.4, 0.0, 1.0);',
        '  float sweepMask = smoothstep(tail - 0.14, tail + 0.12, normAng) * (1.0 - smoothstep(head - 0.08, head + 0.04, normAng));',
        '  vec4 tex = texture2D(uMap, vUv);',
        '  float mask = tex.a * sweepMask;',
        '  if (mask < 0.02) discard;',
        '  float r = length(p) * 2.0;',
        '  vec3 col = mix(uColorB, uColorA, smoothstep(0.42, 0.85, r));',
        '  float hotEdge = smoothstep(0.68, 0.96, tex.a) * smoothstep(0.62, 0.92, r);',
        '  col = mix(col, uCore, clamp(hotEdge * 1.15 + (1.0 - uProgress) * 0.25, 0.0, 1.0));',
        '  gl_FragColor = vec4(col * 1.25, mask * uOpacity);',
        '  gl_FragColor = linearToOutputTexel(gl_FragColor);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
  }

  // 2. Fresnel + Scrolling Energy Pattern Shader (Ward Curtain, Aegis Dome, EMP Sphere, Heal Pillar)
  function createBarrierShaderMaterial(THREE, primaryHex, secondaryHex, patternTex, opts) {
    var cfg = opts || {};
    return new THREE.ShaderMaterial({
      uniforms: {
        uPattern: { value: patternTex },
        uColorA: { value: linearColor(THREE, primaryHex) },
        uColorB: { value: linearColor(THREE, secondaryHex) },
        uTime: { value: 0.0 },
        uOpacity: { value: cfg.opacity !== undefined ? cfg.opacity : 0.72 },
        uRepeat: { value: new THREE.Vector2(cfg.repeatX || 4.0, cfg.repeatY || 2.0) },
        uScrollSpeed: { value: cfg.scrollSpeed !== undefined ? cfg.scrollSpeed : 0.55 },
        uFresnelPow: { value: cfg.fresnelPow || 2.1 },
        uVerticalFade: { value: cfg.verticalFade ? 1.0 : 0.0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormalW;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vUv = uv;',
        '  vec4 worldPos = modelMatrix * vec4(position, 1.0);',
        '  vNormalW = normalize(mat3(modelMatrix) * normal);',
        '  vViewDir = normalize(cameraPosition - worldPos.xyz);',
        '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform sampler2D uPattern;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'uniform float uTime;',
        'uniform float uOpacity;',
        'uniform vec2 uRepeat;',
        'uniform float uScrollSpeed;',
        'uniform float uFresnelPow;',
        'uniform float uVerticalFade;',
        'varying vec2 vUv;',
        'varying vec3 vNormalW;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  float ndotv = abs(dot(normalize(vNormalW), normalize(vViewDir)));',
        '  float fresnel = pow(clamp(1.0 - ndotv, 0.0, 1.0), uFresnelPow);',
        '  vec2 pUv = fract(vUv * uRepeat + vec2(uTime * 0.14, -uTime * uScrollSpeed));',
        '  float pat = texture2D(uPattern, pUv).a;',
        '  float scan = 0.5 + 0.5 * sin(vUv.y * 28.0 - uTime * 6.5);',
        '  float vFade = mix(1.0, smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.18, vUv.y), uVerticalFade);',
        '  float alpha = (0.14 + fresnel * 0.72 + pat * 0.42 + scan * 0.08) * vFade * uOpacity;',
        '  if (alpha < 0.015) discard;',
        '  vec3 col = mix(uColorA, uColorB, clamp(fresnel * 0.65 + pat * 0.5, 0.0, 1.0));',
        '  col += vec3(1.0) * pat * fresnel * 0.55;',
        '  gl_FragColor = vec4(col * 1.15, clamp(alpha, 0.0, 1.0));',
        '  gl_FragColor = linearToOutputTexel(gl_FragColor);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
  }

  // 3. Scrolling High-Energy Plasma / Rail Beam Ribbon Shader
  function createBeamShaderMaterial(THREE, primaryHex, coreHex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: linearColor(THREE, primaryHex) },
        uCore: { value: linearColor(THREE, coreHex) },
        uTime: { value: 0.0 },
        uOpacity: { value: 1.0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform vec3 uColorA;',
        'uniform vec3 uCore;',
        'uniform float uTime;',
        'uniform float uOpacity;',
        'varying vec2 vUv;',
        'void main() {',
        '  float dist = abs(vUv.y - 0.5) * 2.0;',
        '  float wave = sin(vUv.x * 26.0 - uTime * 36.0) * 0.08 + sin(vUv.x * 54.0 + uTime * 22.0) * 0.05;',
        '  float d = clamp(dist + wave, 0.0, 1.0);',
        '  float core = smoothstep(0.42, 0.0, d);',
        '  float halo = pow(clamp(1.0 - d, 0.0, 1.0), 1.85);',
        '  float endFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.92, vUv.x);',
        '  float alpha = halo * endFade * uOpacity;',
        '  if (alpha < 0.02) discard;',
        '  vec3 col = mix(uColorA, uCore, clamp(core * 1.25, 0.0, 1.0));',
        '  gl_FragColor = vec4(col * 1.35, alpha);',
        '  gl_FragColor = linearToOutputTexel(gl_FragColor);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
  }

  // 4. Expanding Floor Shockwave / Sonar / Harmonic Ring Shader
  function createWaveRingShaderMaterial(THREE, primaryHex, secondaryHex, mode) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: linearColor(THREE, primaryHex) },
        uColorB: { value: linearColor(THREE, secondaryHex) },
        uProgress: { value: 0.0 },
        uOpacity: { value: 0.92 },
        uMode: { value: mode || 0.0 } // 0=shockwave, 1=sonar_radar, 2=stealth_ripple
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'uniform float uProgress;',
        'uniform float uOpacity;',
        'uniform float uMode;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 p = (vUv - vec2(0.5)) * 2.0;',
        '  float r = length(p);',
        '  if (r > 1.0) discard;',
        '  float front = clamp(uProgress, 0.02, 1.0);',
        '  float ring1 = smoothstep(0.16, 0.0, abs(r - front));',
        '  float ring2 = smoothstep(0.10, 0.0, abs(r - front * 0.72)) * 0.55;',
        '  float ang = atan(p.y, p.x);',
        '  float ticks = 1.0;',
        '  if (uMode > 0.5 && uMode < 1.5) {',
        '    // Sonar radar distance grid & rotating sweep beam',
        '    float sweepAng = mod(ang - uProgress * 9.5 + 6.2831, 6.2831);',
        '    float wedge = smoothstep(1.35, 0.0, sweepAng) * smoothstep(front, 0.05, r) * 0.58;',
        '    float gridTick = step(0.86, abs(sin(ang * 12.0))) * smoothstep(0.05, 0.0, abs(r - front * 0.88)) * 0.7;',
        '    float a = (ring1 * 0.88 + ring2 * 0.45 + wedge * 0.72 + gridTick * 0.85) * (1.0 - uProgress * 0.85) * uOpacity;',
        '    if (a < 0.015) discard;',
        '    vec3 col = mix(uColorA, uColorB, ring1 * 0.65 + gridTick * 0.5);',
        '    gl_FragColor = vec4(col * 0.95, clamp(a, 0.0, 0.92));',
        '    gl_FragColor = linearToOutputTexel(gl_FragColor);',
        '    return;',
        '  }',
        '  float ripple = sin(r * 26.0 - uProgress * 18.0) * 0.5 + 0.5;',
        '  float trail = smoothstep(front, max(0.0, front - 0.30), r) * step(r, front) * (0.20 + 0.18 * ripple);',
        '  if (uMode > 1.5) ticks = 0.65 + 0.35 * sin(ang * 8.0 + uProgress * 10.0);',
        '  float alpha = (ring1 * 0.95 + ring2 * 0.78 + trail) * ticks * (1.0 - smoothstep(0.65, 1.0, uProgress)) * uOpacity;',
        '  if (alpha < 0.015) discard;',
        '  vec3 col2 = mix(uColorA, uColorB, ring1 * 0.72);',
        '  gl_FragColor = vec4(col2 * 0.96, clamp(alpha, 0.0, 0.92));',
        '  gl_FragColor = linearToOutputTexel(gl_FragColor);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
  }

  /* --------------------------------------------------------------------------
   * Core VFX Spawners (14 Distinct Archetypes + Reusable Shader Primitives)
   * -------------------------------------------------------------------------- */

  // 1. SWORD ARC: Sweeping 3D GLSL Crescent Blade Shader + Cross-Slash + Sparks
  function spawnSlashArc(session, x, z, angle, radius, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex, vfx);
    var r = Math.max(1.8, radius || 3.2) * (0.95 + (c.intensity - 1.0) * 0.25);
    var slashTex = getTex(session, 'vfx_slash_crescent');

    var group = new THREE.Group();
    group.position.set(x, 0.96, z);
    group.rotation.y = -angle;

    var planeGeo = getUnitFloorPlane(session);
    var slashSize = r * 2.15;

    var matMain = createSlashShaderMaterial(THREE, c.primary, c.secondary, c.core, slashTex);
    var meshMain = new THREE.Mesh(planeGeo, matMain);
    meshMain.scale.set(slashSize, 1, slashSize);
    meshMain.rotation.z = 0.22; // Dynamic angled sword cleave
    group.add(meshMain);

    // Secondary crossed counter-slash for depth & weapon-art flair
    var matEcho = createSlashShaderMaterial(THREE, c.secondary, c.primary, c.core, slashTex);
    var meshEcho = new THREE.Mesh(planeGeo, matEcho);
    meshEcho.position.y = 0.24;
    meshEcho.rotation.z = -0.28;
    meshEcho.scale.set(slashSize * 0.86, 1, slashSize * 0.86);
    group.add(meshEcho);

    // Bright ground cutting wave
    var waveGeo = planeGeo;
    var waveMat = createWaveRingShaderMaterial(THREE, c.primary, c.core, 0.0);
    var waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.scale.set(r * 2.0, 1, r * 2.0);
    waveMesh.position.y = -0.82;
    group.add(waveMesh);

    session.scene.add(group);

    // Directional glowing blade sparks fanning forward
    spawnSparkBurst(session, x + Math.cos(angle) * (r * 0.55), 0.95, z + Math.sin(angle) * (r * 0.55), c.primary, Math.round(12 * c.intensity));

    // Organic glowing floor slash scar (NOT a flat brown ring!)
    spawnScorchDecal(session, x + Math.cos(angle) * (r * 0.58), z + Math.sin(angle) * (r * 0.58), r * 0.58, c.primary, 2.4);

    var maxTtl = 0.34;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        matMain.uniforms.uProgress.value = p;
        matMain.uniforms.uOpacity.value = 1.0 - Math.pow(p, 2.2);
        matEcho.uniforms.uProgress.value = clamp((p - 0.08) * 1.15, 0, 1);
        matEcho.uniforms.uOpacity.value = 0.78 * (1.0 - Math.pow(p, 2.0));
        waveMat.uniforms.uProgress.value = p;
        waveMat.uniforms.uOpacity.value = 0.55 * (1 - p);
        meshMain.rotation.y = (p - 0.5) * 0.42;
        meshEcho.rotation.y = -(p - 0.5) * 0.36;
        var sc = 0.88 + p * 0.28;
        group.scale.set(sc, 1, sc);
      },
      dispose: function () {
        session.scene.remove(group);
        disposeIfOwned(planeGeo);
        disposeIfOwned(waveGeo);
        disposeIfOwned(matMain);
        disposeIfOwned(matEcho);
        disposeIfOwned(waveMat);
      }
    });
  }

  // Organic Glowing Ground Fissure / Scorch Decal (replaces ugly flat brown RingGeometry!)
  function spawnScorchDecal(session, x, z, radius, colorHex, duration) {
    var THREE = session.THREE;
    var r = Math.max(0.75, radius || 1.3);
    var fissureTex = getTex(session, 'vfx_fissure_crack');
    var geo = getUnitFloorPlane(session);
    var mat = new THREE.MeshBasicMaterial({
      map: fissureTex,
      color: hexToInt(colorHex, 0xff7838),
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(r * 2.1, 1, r * 2.1);
    mesh.position.set(x, 0.055, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    session.scene.add(mesh);

    var maxTtl = Math.max(1.2, duration || 3.2);
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var ratio = clamp(this.ttl / this.maxTtl, 0, 1);
        mat.opacity = 0.76 * Math.pow(ratio, 1.35);
      },
      dispose: function () {
        session.scene.remove(mesh);
        disposeIfOwned(geo);
        disposeIfOwned(mat);
      }
    });
  }

  // 2. WARD CIRCLE: Intricate Dual Sigil + Fresnel Scrolling-Rune Curtain + 3D Pylon Obelisks
  function buildWardCircle(session, x, z, radius, duration, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex, vfx);
    var group = new THREE.Group();
    group.position.set(x, 0, z);
    var geos = [];
    var mats = [];

    // Ground intricate 256px sigil formation
    var discGeo = new THREE.PlaneGeometry(radius * 2.08, radius * 2.08);
    discGeo.rotateX(-Math.PI / 2);
    var discMat = new THREE.MeshBasicMaterial({
      map: getTex(session, c.sigil),
      color: c.primary,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.085;
    group.add(disc);
    geos.push(discGeo); mats.push(discMat);

    // Secondary counter-rotating inner rune circle
    var innerGeo = new THREE.PlaneGeometry(radius * 1.24, radius * 1.24);
    innerGeo.rotateX(-Math.PI / 2);
    var innerMat = new THREE.MeshBasicMaterial({
      map: getTex(session, 'sigil_arcane_star'),
      color: c.secondary,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var innerDisc = new THREE.Mesh(innerGeo, innerMat);
    innerDisc.position.y = 0.095;
    group.add(innerDisc);
    geos.push(innerGeo); mats.push(innerMat);

    // Fresnel scrolling-rune translucent energy barrier curtain
    var wallGeo = new THREE.CylinderGeometry(radius, radius, 1.85, 36, 1, true);
    var wallMat = createBarrierShaderMaterial(THREE, c.primary, c.secondary, getTex(session, c.pattern), {
      opacity: 0.68,
      repeatX: 6.0,
      repeatY: 1.5,
      scrollSpeed: 0.45,
      fresnelPow: 1.8,
      verticalFade: true
    });
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 0.94;
    group.add(wall);
    geos.push(wallGeo); mats.push(wallMat);

    // Sculpted 3D floating perimeter obelisk/talisman pylons
    var pylonCount = 6;
    var pylonGeo = new THREE.OctahedronGeometry(0.18, 0);
    var pylonMat = new THREE.MeshBasicMaterial({
      color: c.secondary,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    var ringGeo = new THREE.TorusGeometry(radius, 0.032, 8, 42);
    ringGeo.rotateX(Math.PI / 2);
    var ringMat = new THREE.MeshBasicMaterial({
      color: c.core,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending
    });
    var topRing = new THREE.Mesh(ringGeo, ringMat);
    topRing.position.y = 1.48;
    group.add(topRing);
    geos.push(pylonGeo, ringGeo); mats.push(pylonMat, ringMat);

    var pylons = [];
    for (var i = 0; i < pylonCount; i++) {
      var a = (i / pylonCount) * Math.PI * 2;
      var py = new THREE.Mesh(pylonGeo, pylonMat);
      py.scale.set(0.8, 2.2, 0.8);
      py.position.set(Math.cos(a) * radius, 1.48, Math.sin(a) * radius);
      group.add(py);
      pylons.push(py);
    }

    session.scene.add(group);
    spawnWaveRing(session, x, z, radius * 1.15, c.primary, 0.55, 0);

    return {
      x: x,
      z: z,
      radius: radius,
      ttl: duration,
      maxTtl: duration,
      group: group,
      disc: disc,
      innerDisc: innerDisc,
      ring: topRing,
      wallMat: wallMat,
      pylons: pylons,
      geos: geos,
      mats: mats,
      pulseTimer: 0,
      updateVisual: function (dt, elapsed) {
        if (wallMat.uniforms && wallMat.uniforms.uTime) {
          wallMat.uniforms.uTime.value = elapsed;
        }
        disc.rotation.z += dt * 0.48;
        innerDisc.rotation.z -= dt * 0.92;
        topRing.position.y = 1.44 + Math.sin(elapsed * 3.2) * 0.08;
        for (var k = 0; k < pylons.length; k++) {
          pylons[k].rotation.y += dt * 2.4;
          pylons[k].position.y = 1.44 + Math.sin(elapsed * 3.4 + k * 1.1) * 0.14;
        }
      }
    };
  }

  // 3. EMP BLAST: Hexagonal Fresnel Plasma Dome + Crossed-Ribbon 3D Branching Lightning
  function spawnEmpBlastVfx(session, x, z, radius, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#4de8ff', vfx);
    var r = Math.max(3.2, radius || 4.8);

    // Expanding Hex Fresnel EMP Plasma Dome (crisp translucent hex grid + glowing rim)
    var domeGeo = getUnitDome(session, 24, 16, 0.52);
    var domeMat = createBarrierShaderMaterial(THREE, c.primary, c.secondary, getTex(session, 'vfx_hex_pattern'), {
      opacity: 0.62,
      repeatX: 5.0,
      repeatY: 3.0,
      scrollSpeed: 1.4,
      fresnelPow: 2.0,
      verticalFade: false
    });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(x, 0.06, z);
    dome.scale.set(0.25, 0.25, 0.25);
    session.scene.add(dome);

    // Dual expanding ground shockwaves + crisp core flash
    spawnWaveRing(session, x, z, r * 1.15, c.primary, 0.65, 0);
    spawnSigilPulse(session, x, z, r * 1.05, 'hex_grid', c.secondary, 0.72);
    spawnImpactStar(session, x, 0.95, z, c.primary, 1.9, 0.26);
    spawnSparkBurst(session, x, 0.85, z, c.primary, 20);

    // 7 thick crossed-ribbon 3D branching lightning bolts arcing outward
    for (var i = 0; i < 7; i++) {
      var a = (i / 7) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      var dist = r * (0.68 + Math.random() * 0.38);
      spawnLightningBolt(
        session,
        x, 1.05, z,
        x + Math.cos(a) * dist, 0.25 + Math.random() * 1.4, z + Math.sin(a) * dist,
        i % 2 === 0 ? c.primary : c.secondary,
        0.38,
        7
      );
    }

    var maxTtl = 0.62;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var sc = 0.25 + Math.pow(p, 0.55) * r;
        dome.scale.set(sc, sc * 0.78, sc);
        dome.rotation.y += dt * 1.8;
        domeMat.uniforms.uTime.value += dt * 2.2;
        domeMat.uniforms.uOpacity.value = 0.62 * (1.0 - Math.pow(p, 1.5));
      },
      dispose: function () {
        session.scene.remove(dome);
        disposeIfOwned(domeGeo);
        disposeIfOwned(domeMat);
      }
    });
  }

  // 4. RAIL SHOT: Scrolling Plasma Ribbon Beam + Spaced 3D Mach Shock-Cones + Impact Flare
  function spawnLaserBeam(session, x0, z0, x1, z1, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex, vfx);
    var dx = x1 - x0;
    var dz = z1 - z0;
    var len = Math.max(0.5, Math.sqrt(dx * dx + dz * dz));
    var angle = Math.atan2(dz, dx);

    var group = new THREE.Group();
    group.position.set(x0, 1.08, z0);
    group.rotation.y = -angle;
    var geos = [];
    var mats = [];

    // Crossed glowing plasma ribbon planes (always visible from elevated 2.5D camera!)
    var width = 0.78 * c.intensity;
    var ribbonGeo = new THREE.PlaneGeometry(len, width);
    ribbonGeo.translate(len * 0.5, 0, 0);
    var beamMat = createBeamShaderMaterial(THREE, c.primary, c.core);
    var rHoriz = new THREE.Mesh(ribbonGeo, beamMat);
    rHoriz.rotation.x = -Math.PI * 0.5;
    var rVert = new THREE.Mesh(ribbonGeo, beamMat);
    var rDiag = new THREE.Mesh(ribbonGeo, beamMat);
    rDiag.rotation.x = Math.PI * 0.25;
    group.add(rHoriz, rVert, rDiag);
    geos.push(ribbonGeo); mats.push(beamMat);

    // 5 Angled 3D Mach Shock-Cone Rings spaced cleanly along the beam trajectory
    var coneCount = clamp(Math.floor(len / 2.6), 2, 6);
    var coneGeo = new THREE.RingGeometry(0.24, 0.68, 22);
    var coneMat = new THREE.MeshBasicMaterial({
      color: c.secondary,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    geos.push(coneGeo); mats.push(coneMat);
    var cones = [];
    for (var i = 0; i < coneCount; i++) {
      var frac = (i + 0.6) / (coneCount + 0.4);
      var cm = new THREE.Mesh(coneGeo, coneMat);
      cm.position.set(len * frac, 0, 0);
      cm.rotation.y = Math.PI * 0.5;
      group.add(cm);
      cones.push(cm);
    }

    session.scene.add(group);

    // Muzzle charge flash & heavy impact crater flare
    spawnImpactStar(session, x0, 1.08, z0, c.core, 1.65, 0.22);
    spawnImpactStar(session, x1, 1.08, z1, c.primary, 2.8, 0.34);
    spawnSparkBurst(session, x1, 1.05, z1, c.secondary, 16);
    spawnScorchDecal(session, x1, z1, 1.25, c.primary, 2.6);

    var maxTtl = 0.42;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        beamMat.uniforms.uTime.value += dt;
        beamMat.uniforms.uOpacity.value = 1.0 - Math.pow(p, 1.6);
        var wScale = 1.15 - p * 0.82;
        rHoriz.scale.set(1, wScale, 1);
        rVert.scale.set(1, wScale, 1);
        rDiag.scale.set(1, wScale, 1);
        coneMat.opacity = 0.85 * (1 - p);
        for (var k = 0; k < cones.length; k++) {
          var sc = 0.65 + p * 1.45;
          cones[k].scale.set(sc, sc, 1);
        }
      },
      dispose: function () {
        session.scene.remove(group);
        for (var g = 0; g < geos.length; g++) disposeIfOwned(geos[g]);
        for (var m = 0; m < mats.length; m++) disposeIfOwned(mats[m]);
      }
    });
  }

  // 5. BLINK MARK: Sculpted 3D Spatial Crystal + Vertical Dimensional Rift Slit
  function buildBlinkBeacon(session, x, z, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#b46cff', vfx);
    var group = new THREE.Group();
    group.position.set(x, 0, z);
    var geos = [];
    var mats = [];

    // Vertical shimmering spatial rift tear
    var riftGeo = new THREE.PlaneGeometry(0.95, 2.25);
    var riftMat = createBeamShaderMaterial(THREE, c.primary, c.core);
    var rift1 = new THREE.Mesh(riftGeo, riftMat);
    rift1.position.y = 1.18;
    rift1.rotation.z = Math.PI * 0.5;
    var rift2 = new THREE.Mesh(riftGeo, riftMat);
    rift2.position.y = 1.18;
    rift2.rotation.z = Math.PI * 0.5;
    rift2.rotation.y = Math.PI * 0.5;
    group.add(rift1, rift2);
    geos.push(riftGeo); mats.push(riftMat);

    // Levitating faceted spatial crystal core
    var cryGeo = new THREE.OctahedronGeometry(0.28, 0);
    var cryMat = new THREE.MeshBasicMaterial({ color: c.core, transparent: true, opacity: 0.95 });
    var cry = new THREE.Mesh(cryGeo, cryMat);
    cry.position.y = 1.2;
    cry.scale.set(0.75, 1.55, 0.75);
    group.add(cry);
    geos.push(cryGeo); mats.push(cryMat);

    // Twin tilted counter-rotating void rings
    var tGeo = new THREE.TorusGeometry(0.62, 0.03, 8, 28);
    var tMat = new THREE.MeshBasicMaterial({ color: c.secondary, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending });
    var ringA = new THREE.Mesh(tGeo, tMat);
    ringA.position.y = 1.2;
    ringA.rotation.x = 0.85;
    var ringB = new THREE.Mesh(tGeo, tMat);
    ringB.position.y = 1.2;
    ringB.rotation.x = -0.85;
    group.add(ringA, ringB);
    geos.push(tGeo); mats.push(tMat);

    // Floor dimensional sigil
    var sGeo = new THREE.PlaneGeometry(1.75, 1.75);
    sGeo.rotateX(-Math.PI / 2);
    var sMat = new THREE.MeshBasicMaterial({
      map: getTex(session, 'sigil_occult_eye'),
      color: c.primary,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var sigil = new THREE.Mesh(sGeo, sMat);
    sigil.position.y = 0.08;
    group.add(sigil);
    geos.push(sGeo); mats.push(sMat);

    session.scene.add(group);
    spawnWaveRing(session, x, z, 2.2, c.primary, 0.45, 2);

    return {
      x: x,
      z: z,
      group: group,
      crystal: cry,
      ringA: ringA,
      ringB: ringB,
      sigil: sigil,
      riftMat: riftMat,
      geos: geos,
      mats: mats
    };
  }

  // 6. AEGIS SHIELD: Personal Fresnel Hex-Geodesic Armor Dome + Twin Tilted Orbits
  function buildAegisShield(session, parentGroup, primaryHex, secondaryHex) {
    var THREE = session.THREE;
    var shieldGroup = new THREE.Group();
    shieldGroup.position.y = 1.02;
    shieldGroup.visible = false;

    var domeGeo = session.trackGeo(new THREE.IcosahedronGeometry(1.16, 2));
    var domeMat = session.trackMat(createBarrierShaderMaterial(
      THREE,
      primaryHex || 0x5ce8ff,
      secondaryHex || 0xf5cf76,
      getTex(session, 'vfx_hex_pattern'),
      { opacity: 0.76, repeatX: 3.5, repeatY: 2.5, scrollSpeed: 0.55, fresnelPow: 1.75, verticalFade: false }
    ));
    var shieldShell = new THREE.Mesh(domeGeo, domeMat);
    shieldGroup.add(shieldShell);

    var ringGeo = session.trackGeo(new THREE.TorusGeometry(1.26, 0.032, 8, 36));
    var ringMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: secondaryHex || 0xf5cf76,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending
    }));
    var orbit1 = new THREE.Mesh(ringGeo, ringMat);
    orbit1.rotation.x = Math.PI * 0.42;
    var orbit2 = new THREE.Mesh(ringGeo, ringMat);
    orbit2.rotation.x = -Math.PI * 0.42;
    orbit2.rotation.y = Math.PI * 0.5;
    shieldGroup.add(orbit1, orbit2);

    parentGroup.add(shieldGroup);
    return {
      shieldMesh: shieldGroup,
      shieldShell: shieldShell,
      shieldMat: domeMat,
      shieldCoreMat: domeMat,
      shieldRing: orbit1,
      shieldOrbit2: orbit2,
      shieldRingMat: ringMat
    };
  }

  // 7. OVERCLOCK: Chrono-Wing Speed Ribbons + Velocity Halo + Burst
  function spawnOverclockBurstVfx(session, x, z, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#4df8ff', vfx);
    var group = new THREE.Group();
    group.position.set(x, 0.1, z);
    var geos = [];
    var mats = [];

    // 8 Ascending vertical speed-tunnel streaks surrounding caster
    var streakGeo = new THREE.PlaneGeometry(0.16, 2.5);
    var streakMat = createBeamShaderMaterial(THREE, c.primary, c.core);
    geos.push(streakGeo); mats.push(streakMat);
    var streaks = [];
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      var sm = new THREE.Mesh(streakGeo, streakMat);
      sm.position.set(Math.cos(a) * 1.15, 1.1, Math.sin(a) * 1.15);
      sm.rotation.y = -a + Math.PI * 0.5;
      group.add(sm);
      streaks.push(sm);
    }

    // Golden-cyan spinning chrono-clock halo
    var haloGeo = new THREE.TorusGeometry(1.35, 0.045, 8, 36);
    haloGeo.rotateX(Math.PI / 2);
    var haloMat = new THREE.MeshBasicMaterial({
      color: c.secondary,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    var halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 1.05;
    group.add(halo);
    geos.push(haloGeo); mats.push(haloMat);

    session.scene.add(group);
    spawnWaveRing(session, x, z, 3.6, c.primary, 0.52, 0);
    spawnSparkBurst(session, x, 1.0, z, c.secondary, 16);

    var maxTtl = 0.65;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        group.rotation.y += dt * 5.2;
        streakMat.uniforms.uTime.value += dt * 2.5;
        streakMat.uniforms.uOpacity.value = 1 - p;
        for (var k = 0; k < streaks.length; k++) {
          streaks[k].position.y = 0.8 + p * 1.65;
        }
        var hsc = 0.7 + p * 1.45;
        halo.scale.set(hsc, 1, hsc);
        haloMat.opacity = 0.9 * (1 - p);
      },
      dispose: function () {
        session.scene.remove(group);
        for (var g = 0; g < geos.length; g++) disposeIfOwned(geos[g]);
        for (var m = 0; m < mats.length; m++) disposeIfOwned(mats[m]);
      }
    });
  }

  // 8. HEAL PULSE: Feathered Volumetric Sanctuary Light Shaft + Double-Helix Ribbons + Motes
  function spawnHealPillarVfx(session, x, z, radius, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#58e89a', vfx);
    var r = Math.max(2.6, radius || 4.0);
    var group = new THREE.Group();
    group.position.set(x, 0, z);
    var geos = [];
    var mats = [];

    // Softly feathered volumetric sanctuary light column (zero hard cylinder edges!)
    var shaftGeo = new THREE.CylinderGeometry(r * 0.42, r * 0.52, 4.2, 28, 1, true);
    var shaftMat = createBarrierShaderMaterial(THREE, c.primary, c.core, getTex(session, 'vfx_rune_strip'), {
      opacity: 0.72,
      repeatX: 3.0,
      repeatY: 1.5,
      scrollSpeed: -0.95, // flows gently UPWARD!
      fresnelPow: 1.35,
      verticalFade: true
    });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 2.05;
    group.add(shaft);
    geos.push(shaftGeo); mats.push(shaftMat);

    // Blooming sanctuary lotus sigil on ground
    var sigGeo = new THREE.PlaneGeometry(r * 1.85, r * 1.85);
    sigGeo.rotateX(-Math.PI / 2);
    var sigMat = new THREE.MeshBasicMaterial({
      map: getTex(session, 'sigil_arcane_star'),
      color: c.primary,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var sig = new THREE.Mesh(sigGeo, sigMat);
    sig.position.y = 0.09;
    group.add(sig);
    geos.push(sigGeo); mats.push(sigMat);

    // 14 Gently rising glowing heal-cross & light motes swirling in a double helix
    var crossGeo = new THREE.PlaneGeometry(0.42, 0.42);
    var crossMat = new THREE.MeshBasicMaterial({
      map: getTex(session, 'vfx_heal_cross'),
      color: c.secondary,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    geos.push(crossGeo); mats.push(crossMat);
    var crosses = [];
    for (var i = 0; i < 14; i++) {
      var cm = new THREE.Mesh(crossGeo, crossMat);
      var a = (i / 14) * Math.PI * 4;
      var cr = 0.45 + (i % 3) * (r * 0.22);
      cm.position.set(Math.cos(a) * cr, 0.25 + (i % 5) * 0.22, Math.sin(a) * cr);
      cm.rotation.x = -0.35;
      group.add(cm);
      crosses.push({ mesh: cm, ang: a, rad: cr, spd: 1.4 + (i % 4) * 0.35 });
    }

    session.scene.add(group);
    spawnWaveRing(session, x, z, r, c.primary, 0.78, 0);

    var maxTtl = 1.15;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        shaftMat.uniforms.uTime.value += dt * 1.6;
        shaftMat.uniforms.uOpacity.value = 0.72 * Math.sin(p * Math.PI);
        sig.rotation.z += dt * 0.7;
        sigMat.opacity = 0.85 * (1 - p);
        crossMat.opacity = 0.95 * (1 - Math.pow(p, 1.4));
        for (var k = 0; k < crosses.length; k++) {
          var cr2 = crosses[k];
          cr2.ang += dt * 2.2;
          cr2.mesh.position.x = Math.cos(cr2.ang) * cr2.rad;
          cr2.mesh.position.z = Math.sin(cr2.ang) * cr2.rad;
          cr2.mesh.position.y += cr2.spd * dt;
        }
      },
      dispose: function () {
        session.scene.remove(group);
        for (var g = 0; g < geos.length; g++) disposeIfOwned(geos[g]);
        for (var m = 0; m < mats.length; m++) disposeIfOwned(mats[m]);
      }
    });
  }

  // 9. STEALTH VEIL: Sleek Vertical Optical-Camo Sweep Curtain + Refractive Shadow Mist
  function spawnStealthBurstVfx(session, x, z, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#8668ff', vfx);
    var group = new THREE.Group();
    group.position.set(x, 0, z);
    var geos = [];
    var mats = [];

    // Sweeping vertical optical-camo scan ring that slides from boots to head
    var scanGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.36, 28, 1, true);
    var scanMat = createBarrierShaderMaterial(THREE, c.primary, c.secondary, getTex(session, 'vfx_hex_pattern'), {
      opacity: 0.95,
      repeatX: 4.0,
      repeatY: 1.0,
      scrollSpeed: 1.8,
      fresnelPow: 1.3,
      verticalFade: true
    });
    var scanRing = new THREE.Mesh(scanGeo, scanMat);
    scanRing.position.y = 0.15;
    group.add(scanRing);
    geos.push(scanGeo); mats.push(scanMat);

    // 10 Drifting atmospheric shadow-refraction mist puffs
    var puffGeo = new THREE.PlaneGeometry(1.35, 1.35);
    var puffTex = getTex(session, 'vfx_smoke_puff');
    var puffMat = new THREE.MeshBasicMaterial({
      map: puffTex,
      color: c.primary,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    geos.push(puffGeo); mats.push(puffMat);
    var puffs = [];
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2;
      var pm = new THREE.Mesh(puffGeo, puffMat);
      pm.position.set(Math.cos(a) * 0.48, 0.4 + (i % 3) * 0.42, Math.sin(a) * 0.48);
      pm.rotation.x = -0.38;
      group.add(pm);
      puffs.push({ mesh: pm, vx: Math.cos(a) * 1.45, vy: 0.55 + (i % 3) * 0.25, vz: Math.sin(a) * 1.45 });
    }

    session.scene.add(group);
    spawnWaveRing(session, x, z, 2.6, c.primary, 0.65, 2);

    var maxTtl = 0.85;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        scanRing.position.y = 0.15 + p * 2.05;
        var sc = 1.05 - p * 0.35;
        scanRing.scale.set(sc, 1, sc);
        scanMat.uniforms.uTime.value += dt * 2.0;
        scanMat.uniforms.uOpacity.value = 0.95 * (1 - p);
        puffMat.opacity = 0.56 * (1 - p);
        for (var k = 0; k < puffs.length; k++) {
          var pf = puffs[k];
          pf.mesh.position.x += pf.vx * dt;
          pf.mesh.position.y += pf.vy * dt;
          pf.mesh.position.z += pf.vz * dt;
          var psc = 0.85 + p * 0.85;
          pf.mesh.scale.set(psc, psc, 1);
        }
      },
      dispose: function () {
        session.scene.remove(group);
        for (var g = 0; g < geos.length; g++) disposeIfOwned(geos[g]);
        for (var m = 0; m < mats.length; m++) disposeIfOwned(mats[m]);
      }
    });
  }

  // 10. SEAL CHAIN: Sculpted 3D Interlocked Chain Links + Rotating Containment Rings & Talismans
  function spawnSealChainsVfx(session, x0, z0, x1, z1, duration, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#f0c46c', vfx);
    var dx = x1 - x0;
    var dz = z1 - z0;
    var len = Math.max(0.6, Math.sqrt(dx * dx + dz * dz));
    var angle = Math.atan2(dz, dx);

    var group = new THREE.Group();
    var geos = [];
    var mats = [];

    // Sculpted 3D interlocked chain links spanning caster -> target!
    var linkCount = clamp(Math.floor(len * 2.8), 4, 24);
    var linkGeo = new THREE.TorusGeometry(0.14, 0.042, 6, 12);
    var linkMat = new THREE.MeshBasicMaterial({
      color: c.primary,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    geos.push(linkGeo); mats.push(linkMat);

    var chainGroup = new THREE.Group();
    chainGroup.position.set(x0, 1.15, z0);
    chainGroup.rotation.y = -angle;
    for (var i = 0; i < linkCount; i++) {
      var lk = new THREE.Mesh(linkGeo, linkMat);
      lk.position.set((i + 0.5) * (len / linkCount), Math.sin((i / linkCount) * Math.PI) * -0.18, 0);
      lk.scale.set(1.55, 0.82, 0.82);
      if (i % 2 === 1) lk.rotation.x = Math.PI * 0.5;
      chainGroup.add(lk);
    }
    group.add(chainGroup);

    // Interlocking 3D containment rings + 4 floating talisman plates orbiting bound target
    var cageGroup = new THREE.Group();
    cageGroup.position.set(x1, 1.25, z1);
    var lockGeo = new THREE.TorusGeometry(0.96, 0.048, 8, 32);
    var lockMat = new THREE.MeshBasicMaterial({
      color: c.secondary,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    var lockA = new THREE.Mesh(lockGeo, lockMat);
    lockA.rotation.x = Math.PI * 0.36;
    var lockB = new THREE.Mesh(lockGeo, lockMat);
    lockB.rotation.x = -Math.PI * 0.36;
    lockB.rotation.y = Math.PI * 0.5;
    cageGroup.add(lockA, lockB);
    geos.push(lockGeo); mats.push(lockMat);

    var talGeo = new THREE.PlaneGeometry(0.48, 0.82);
    var talMat = new THREE.MeshBasicMaterial({
      map: getTex(session, 'vfx_talisman'),
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    geos.push(talGeo); mats.push(talMat);
    for (var t = 0; t < 4; t++) {
      var ta = (t / 4) * Math.PI * 2;
      var tm = new THREE.Mesh(talGeo, talMat);
      tm.position.set(Math.cos(ta) * 1.15, 0, Math.sin(ta) * 1.15);
      tm.rotation.y = -ta + Math.PI * 0.5;
      cageGroup.add(tm);
    }
    group.add(cageGroup);

    session.scene.add(group);
    spawnSigilPulse(session, x1, z1, 2.8, 'occult_eye', c.primary, Math.min(2.2, duration || 2.0));
    spawnImpactStar(session, x1, 1.25, z1, c.core, 2.2, 0.35);

    var maxTtl = Math.max(1.2, Math.min(duration || 2.8, 3.8));
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var ratio = clamp(this.ttl / this.maxTtl, 0, 1);
        lockA.rotation.z += dt * 3.4;
        lockB.rotation.z -= dt * 2.9;
        cageGroup.rotation.y += dt * 1.8;
        linkMat.opacity = 0.95 * ratio;
        lockMat.opacity = 0.92 * ratio;
        talMat.opacity = 0.95 * ratio;
      },
      dispose: function () {
        session.scene.remove(group);
        for (var g = 0; g < geos.length; g++) disposeIfOwned(geos[g]);
        for (var m = 0; m < mats.length; m++) disposeIfOwned(mats[m]);
      }
    });
  }

  // 11. RECON PULSE: Expanding Volumetric Sonar Radar Dome + 360° Sweep Beam + Tick Rings
  function spawnReconSweepVfx(session, x, z, radius, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#52f0ff', vfx);
    var r = Math.max(8.0, radius || 13.5);

    // Custom GLSL 360-degree rotating sonar radar floor sweep
    var radarGeo = getUnitFloorPlane(session);
    var radarMat = createWaveRingShaderMaterial(THREE, c.primary, c.core, 1.0);
    var radar = new THREE.Mesh(radarGeo, radarMat);
    radar.scale.set(r * 2.1, 1, r * 2.1);
    radar.position.set(x, 0.11, z);
    session.scene.add(radar);

    // Rising translucent hemispheric scan shell
    var domeGeo = getUnitDome(session, 24, 14, 0.45);
    var domeMat = createBarrierShaderMaterial(THREE, c.primary, c.secondary, getTex(session, 'vfx_hex_pattern'), {
      opacity: 0.42,
      repeatX: 8.0,
      repeatY: 3.0,
      scrollSpeed: 0.9,
      fresnelPow: 2.2,
      verticalFade: false
    });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(x, 0.05, z);
    session.scene.add(dome);

    spawnSigilPulse(session, x, z, 3.4, 'tactical_hud', c.primary, 0.95);

    var maxTtl = 1.35;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        radarMat.uniforms.uProgress.value = p;
        radarMat.uniforms.uOpacity.value = 0.95 * (1 - p * 0.65);
        var sc = 0.4 + p * r * 0.72;
        dome.scale.set(sc, sc * 0.42, sc);
        domeMat.uniforms.uTime.value += dt * 2.0;
        domeMat.uniforms.uOpacity.value = 0.42 * (1 - p);
      },
      dispose: function () {
        session.scene.remove(radar, dome);
        disposeIfOwned(radarGeo); disposeIfOwned(radarMat);
        disposeIfOwned(domeGeo); disposeIfOwned(domeMat);
      }
    });
  }

  // 12. TURRET DRONE: Sculpted 7-Part 3D Hover Turret / Sword Array
  function buildTurretDrone(session, x, z, duration, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#52e6ff', vfx);
    var group = new THREE.Group();
    group.position.set(x, 1.35, z);
    var geos = [];
    var mats = [];

    var darkMat = new THREE.MeshStandardMaterial({ color: 0x222c3c, roughness: 0.35, metalness: 0.75 });
    var glowMat = new THREE.MeshBasicMaterial({ color: c.primary });
    var accentMat = new THREE.MeshBasicMaterial({ color: c.secondary, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending });
    mats.push(darkMat, glowMat, accentMat);

    // Armored chassis + glowing central core
    var bodyGeo = new THREE.OctahedronGeometry(0.32, 1);
    var body = new THREE.Mesh(bodyGeo, darkMat);
    body.scale.set(1.2, 0.7, 1.2);
    var coreGeo = new THREE.SphereGeometry(0.18, 12, 12);
    var core = new THREE.Mesh(coreGeo, glowMat);
    // Rotating gyro halo ring
    var ringGeo = new THREE.TorusGeometry(0.56, 0.036, 8, 28);
    ringGeo.rotateX(Math.PI / 2);
    var gyroRing = new THREE.Mesh(ringGeo, accentMat);
    // Twin protruding barrels
    var barrelGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.62, 8);
    barrelGeo.rotateX(Math.PI / 2);
    var barrelL = new THREE.Mesh(barrelGeo, darkMat);
    barrelL.position.set(-0.22, -0.05, 0.34);
    var barrelR = new THREE.Mesh(barrelGeo, darkMat);
    barrelR.position.set(0.22, -0.05, 0.34);
    // Thruster downward glow cone
    var thrustGeo = new THREE.ConeGeometry(0.22, 0.55, 10, 1, true);
    var thrust = new THREE.Mesh(thrustGeo, accentMat);
    thrust.position.y = -0.45;
    thrust.rotation.x = Math.PI;

    group.add(body, core, gyroRing, barrelL, barrelR, thrust);
    geos.push(bodyGeo, coreGeo, ringGeo, barrelGeo, thrustGeo);

    session.scene.add(group);
    spawnWaveRing(session, x, z, 1.8, c.primary, 0.45, 0);

    return {
      x: x,
      z: z,
      group: group,
      ring: gyroRing,
      ttl: duration,
      fireCd: 0.35,
      color: c.primary,
      vfxProfile: vfx,
      geos: geos,
      mats: mats
    };
  }

  // 13. DECOY FLARE: Sculpted Tactical Canister + Holographic Silhouette + Acoustic Pulses
  function buildDecoyFlare(session, x, z, duration, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#ffaa38', vfx);
    var group = new THREE.Group();
    group.position.set(x, 0, z);
    var geos = [];
    var mats = [];

    // Ground metallic acoustic canister
    var canGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.32, 12);
    var canMat = new THREE.MeshStandardMaterial({ color: 0x262e3d, roughness: 0.4, metalness: 0.7 });
    var can = new THREE.Mesh(canGeo, canMat);
    can.position.y = 0.16;

    // Glowing holographic decoy projection cone & silhouette beacon
    var holoGeo = new THREE.CylinderGeometry(0.42, 0.18, 1.55, 16, 1, true);
    var holoMat = createBarrierShaderMaterial(THREE, c.primary, c.secondary, getTex(session, 'vfx_hex_pattern'), {
      opacity: 0.68,
      repeatX: 3.0,
      repeatY: 2.0,
      scrollSpeed: 1.3,
      fresnelPow: 1.4,
      verticalFade: true
    });
    var holo = new THREE.Mesh(holoGeo, holoMat);
    holo.position.y = 1.02;

    var orbGeo = new THREE.OctahedronGeometry(0.24, 0);
    var orbMat = new THREE.MeshBasicMaterial({ color: c.core, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending });
    var orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 1.25;

    group.add(can, holo, orb);
    geos.push(canGeo, holoGeo, orbGeo);
    mats.push(canMat, holoMat, orbMat);

    session.scene.add(group);
    spawnWaveRing(session, x, z, 3.2, c.primary, 0.55, 1);

    return {
      x: x,
      z: z,
      group: group,
      orb: orb,
      holoMat: holoMat,
      ttl: duration,
      pulseCd: 0.1,
      color: c.primary,
      geos: geos,
      mats: mats
    };
  }

  // 14. BERSERK STRIKE: Glowing Branching Magma Fissure Crater + Erupting 3D Shards + Impact Dome
  function spawnBerserkSlamVfx(session, x, z, radius, colorHex, vfx) {
    var THREE = session.THREE;
    var c = resolveVfxColors(colorHex || '#ff9a38', vfx);
    var r = Math.max(2.6, radius || 3.8);

    // Massive glowing organic ground fissure crater (crisp fiery magma contrast, zero white washout!)
    spawnScorchDecal(session, x, z, r * 1.12, c.primary, 3.8);
    spawnWaveRing(session, x, z, r * 1.32, c.primary, 0.58, 0);
    spawnImpactStar(session, x, 0.72, z, c.secondary, 2.0, 0.25);
    spawnSparkBurst(session, x, 0.75, z, c.primary, 22);

    // Compressed kinetic shockwave impact dome
    var domeGeo = getUnitDome(session, 20, 14, 0.5);
    var domeMat = createBarrierShaderMaterial(THREE, c.primary, c.secondary, getTex(session, 'vfx_fissure_crack'), {
      opacity: 0.54,
      repeatX: 2.0,
      repeatY: 1.0,
      scrollSpeed: 0.8,
      fresnelPow: 2.1,
      verticalFade: false
    });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(x, 0.05, z);
    session.scene.add(dome);

    // 10 Jagged 3D erupting obsidian/magma shock-shards rocketing upward & outward
    var shardGeo = getSharedGeo(session, 'cone_shard_024_105_5', function (T) {
      return new T.ConeGeometry(0.24, 1.05, 5);
    });
    var shardMat = new THREE.MeshStandardMaterial({
      color: 0x262028,
      emissive: c.primary,
      emissiveIntensity: 1.2,
      roughness: 0.45,
      metalness: 0.35,
      transparent: true,
      opacity: 0.96
    });
    var shardGroup = new THREE.Group();
    shardGroup.position.set(x, 0, z);
    var shards = [];
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
      var sd = 0.55 + Math.random() * (r * 0.55);
      var sh = new THREE.Mesh(shardGeo, shardMat);
      sh.position.set(Math.cos(a) * sd, 0.15, Math.sin(a) * sd);
      sh.rotation.set((Math.random() - 0.5) * 0.65, a, (Math.random() - 0.5) * 0.65);
      var sc = 0.65 + Math.random() * 0.75;
      sh.scale.set(sc, sc * 1.25, sc);
      shardGroup.add(sh);
      shards.push({
        mesh: sh,
        vx: Math.cos(a) * (1.8 + Math.random() * 2.2),
        vy: 3.8 + Math.random() * 3.2,
        vz: Math.sin(a) * (1.8 + Math.random() * 2.2),
        spin: (Math.random() - 0.5) * 8.0
      });
    }
    session.scene.add(shardGroup);

    var maxTtl = 0.72;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var dsc = 0.35 + Math.pow(p, 0.45) * r * 0.95;
        dome.scale.set(dsc, dsc * 0.65, dsc);
        domeMat.uniforms.uOpacity.value = 0.54 * (1 - p);
        shardMat.opacity = 0.96 * (1 - Math.pow(p, 1.8));
        for (var k = 0; k < shards.length; k++) {
          var s = shards[k];
          s.vy -= 11.5 * dt;
          s.mesh.position.x += s.vx * dt;
          s.mesh.position.y = Math.max(0.05, s.mesh.position.y + s.vy * dt);
          s.mesh.position.z += s.vz * dt;
          s.mesh.rotation.x += s.spin * dt;
        }
      },
      dispose: function () {
        session.scene.remove(dome, shardGroup);
        disposeIfOwned(domeGeo); disposeIfOwned(domeMat);
        disposeIfOwned(shardGeo); disposeIfOwned(shardMat);
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Upgraded Universal Primitives (Wave Ring, Ribbon Lightning, Soft Sparks, Star, Sigil)
   * -------------------------------------------------------------------------- */
  function spawnWaveRing(session, x, z, maxRadius, colorHex, duration, mode) {
    var THREE = session.THREE;
    var r = Math.max(1.2, maxRadius || 3.4);
    var geo = getUnitFloorPlane(session);
    var mat = createWaveRingShaderMaterial(THREE, hexToInt(colorHex, 0x6fd8ea), 0xffffff, mode || 0);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(r * 2.1, 1, r * 2.1);
    mesh.position.set(x, 0.095, z);
    session.scene.add(mesh);

    var maxTtl = Math.max(0.24, duration || 0.48);
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        mat.uniforms.uProgress.value = p;
      },
      dispose: function () {
        session.scene.remove(mesh);
        disposeIfOwned(geo);
        disposeIfOwned(mat);
      }
    });
  }

  // Thick Crossed-Ribbon 3D Lightning Bolt (replaces ugly 1px WebGL THREE.Line!)
  function spawnLightningBolt(session, x0, y0, z0, x1, y1, z1, colorHex, duration, segments) {
    var THREE = session.THREE;
    var segs = Math.max(4, segments || 7);
    var dx = x1 - x0;
    var dy = y1 - y0;
    var dz = z1 - z0;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var jit = (i === 0 || i === segs) ? 0 : 0.34;
      pts.push(new THREE.Vector3(
        x0 + dx * t + (Math.random() - 0.5) * jit,
        y0 + dy * t + (Math.random() - 0.5) * jit * 0.85,
        z0 + dz * t + (Math.random() - 0.5) * jit
      ));
    }

    var group = new THREE.Group();
    var geos = [];
    var mats = [];
    var outerMat = new THREE.MeshBasicMaterial({
      color: hexToInt(colorHex, 0x52e6ff),
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    mats.push(outerMat, coreMat);

    var upVec = new THREE.Vector3(0, 1, 0);
    var dirVec = new THREE.Vector3();
    var segGeo = getUnitOpenCylinder(session, 0.048, 5);
    var coreGeo = getUnitOpenCylinder(session, 0.018, 4);
    for (var s = 0; s < segs; s++) {
      var a = pts[s];
      var b = pts[s + 1];
      dirVec.subVectors(b, a);
      var sLen = Math.max(0.05, dirVec.length());
      var midX = (a.x + b.x) * 0.5;
      var midY = (a.y + b.y) * 0.5;
      var midZ = (a.z + b.z) * 0.5;

      var q = new THREE.Quaternion().setFromUnitVectors(upVec, dirVec.clone().normalize());

      var mOut = new THREE.Mesh(segGeo, outerMat);
      mOut.position.set(midX, midY, midZ);
      mOut.quaternion.copy(q);
      mOut.scale.set(1, sLen, 1);

      var mCore = new THREE.Mesh(coreGeo, coreMat);
      mCore.position.set(midX, midY, midZ);
      mCore.quaternion.copy(q);
      mCore.scale.set(1, sLen, 1);

      group.add(mOut, mCore);
    }
    geos.push(segGeo, coreGeo);

    session.scene.add(group);
    var maxTtl = Math.max(0.14, duration || 0.28);
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var ratio = clamp(this.ttl / this.maxTtl, 0, 1);
        var flk = 0.65 + 0.35 * Math.sin(this.ttl * 95);
        outerMat.opacity = 0.92 * ratio * flk;
        coreMat.opacity = 0.98 * ratio;
      },
      dispose: function () {
        session.scene.remove(group);
        for (var g = 0; g < geos.length; g++) disposeIfOwned(geos[g]);
        for (var m = 0; m < mats.length; m++) disposeIfOwned(mats[m]);
      }
    });
  }

  // Soft Glowing Radial Orb Particle Burst (never harsh square GL points!)
  function spawnSparkBurst(session, x, y, z, colorHex, count) {
    var THREE = session.THREE;
    var n = Math.round(clamp(count || 12, 4, SPARK_MAX));
    var variant = Math.floor(Math.random() * SPARK_VARIANTS) % SPARK_VARIANTS;
    var geo = getSparkGeo(session, n, variant);
    var mat = new THREE.PointsMaterial({
      map: getTex(session, 'vfx_soft_glow'),
      color: hexToInt(colorHex, 0x6fd8ea),
      size: 0.42,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(geo, mat);
    var minScale = 0.0001;
    pts.position.set(x, y, z);
    pts.rotation.y = Math.random() * Math.PI * 2;
    pts.scale.setScalar(minScale);
    session.scene.add(pts);

    var maxTtl = 0.48;
    var halfGravity = 3.9; // 0.5 * 7.8
    var floorY = 0.06;
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var t = clamp(this.maxTtl - this.ttl, 0, this.maxTtl);
        pts.scale.setScalar(Math.max(minScale, t));
        pts.position.y = Math.max(floorY - y, -halfGravity * t * t) + y;
        mat.opacity = 0.98 * clamp(this.ttl / this.maxTtl, 0, 1);
      },
      dispose: function () {
        session.scene.remove(pts);
        disposeIfOwned(geo);
        disposeIfOwned(mat);
      }
    });
  }

  function spawnImpactStar(session, x, y, z, colorHex, scale, duration) {
    var THREE = session.THREE;
    var sc = Math.max(0.8, scale || 1.8);
    var geo = getUnitPlane(session);
    var mat = new THREE.MeshBasicMaterial({
      map: getTex(session, 'vfx_impact_star'),
      color: hexToInt(colorHex, 0xffffff),
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -0.35;
    mesh.scale.set(sc * 0.55, sc * 0.55, 1);
    session.scene.add(mesh);

    var maxTtl = Math.max(0.14, duration || 0.24);
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var s = (0.55 + Math.sin(p * Math.PI * 0.85) * 0.95) * sc;
        mesh.scale.set(s, s, 1);
        mesh.rotation.z += dt * 4.5;
        mat.opacity = 0.98 * (1 - p);
      },
      dispose: function () {
        session.scene.remove(mesh);
        disposeIfOwned(geo);
        disposeIfOwned(mat);
      }
    });
  }

  function spawnSigilPulse(session, x, z, radius, sigilStyle, colorHex, duration) {
    var THREE = session.THREE;
    var r = Math.max(1.2, radius || 2.5);
    var key = 'sigil_' + String(sigilStyle || 'bagua').replace(/^sigil_/, '');
    var size = r * 2.0;
    var geo = getUnitFloorPlane(session);
    var mat = new THREE.MeshBasicMaterial({
      map: getTex(session, key),
      color: hexToInt(colorHex, 0x6fd8ea),
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.088, z);
    mesh.scale.set(size * 0.55, 1, size * 0.55);
    session.scene.add(mesh);

    var maxTtl = Math.max(0.32, duration || 0.65);
    session.vfxList.push({
      ttl: maxTtl,
      maxTtl: maxTtl,
      update: function (dt) {
        this.ttl -= dt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var sc = (0.55 + Math.pow(p, 0.55) * 0.65) * size;
        mesh.scale.set(sc, 1, sc);
        mesh.rotation.y += dt * 1.35;
        mat.opacity = 0.88 * (1 - p);
      },
      dispose: function () {
        session.scene.remove(mesh);
        disposeIfOwned(geo);
        disposeIfOwned(mat);
      }
    });
  }

  // Pure archetype visual descriptor registry for deterministic testing & introspection
  var ARCHETYPE_VFX_SIGNATURE = {
    sword_arc:      { shader: 'slash_crescent',    silhouette: 'tilted_double_crescent', ground: 'branching_fissure' },
    ward_circle:    { shader: 'fresnel_barrier',   silhouette: 'curtain_and_pylons',     ground: 'dual_rotating_sigil' },
    emp_blast:      { shader: 'fresnel_hex_dome',  silhouette: 'plasma_dome_lightning',  ground: 'shockwave_circuit' },
    rail_shot:      { shader: 'plasma_beam',       silhouette: 'crossed_ribbon_mach',    ground: 'impact_crater' },
    blink_mark:     { shader: 'dimensional_rift',  silhouette: 'crystal_void_rings',     ground: 'occult_eye_sigil' },
    aegis_shield:   { shader: 'fresnel_hex_dome',  silhouette: 'personal_geodesic_orb',  ground: 'none_personal' },
    overclock:      { shader: 'plasma_streaks',    silhouette: 'chrono_wings_halo',      ground: 'velocity_ring' },
    heal_pulse:     { shader: 'volumetric_shaft',  silhouette: 'sanctuary_pillar_helix', ground: 'lotus_star_sigil' },
    stealth_veil:   { shader: 'optical_camo_scan', silhouette: 'camo_curtain_mist',      ground: 'refraction_ripple' },
    seal_chain:     { shader: 'sculpted_chains',   silhouette: 'chain_links_talisman',   ground: 'containment_seal' },
    recon_pulse:    { shader: 'sonar_radar_sweep', silhouette: 'hemisphere_sonar_wedge', ground: 'radar_grid_ticks' },
    turret_drone:   { shader: 'pbr_hover_turret',  silhouette: 'twin_barrel_gyro_drone', ground: 'deploy_wave' },
    decoy_flare:    { shader: 'hologram_canister', silhouette: 'holo_pillar_beacon',     ground: 'acoustic_sonar' },
    berserk_strike: { shader: 'fissure_impact',    silhouette: 'erupting_3d_shards',     ground: 'magma_fissure_crater' }
  };

  INFINITY.VfxStudio = {
    resolveVfxColors: resolveVfxColors,
    ARCHETYPE_VFX_SIGNATURE: ARCHETYPE_VFX_SIGNATURE,
    spawnSlashArc: spawnSlashArc,
    spawnScorchDecal: spawnScorchDecal,
    buildWardCircle: buildWardCircle,
    spawnEmpBlastVfx: spawnEmpBlastVfx,
    spawnLaserBeam: spawnLaserBeam,
    buildBlinkBeacon: buildBlinkBeacon,
    buildAegisShield: buildAegisShield,
    spawnOverclockBurstVfx: spawnOverclockBurstVfx,
    spawnHealPillarVfx: spawnHealPillarVfx,
    spawnStealthBurstVfx: spawnStealthBurstVfx,
    spawnSealChainsVfx: spawnSealChainsVfx,
    spawnReconSweepVfx: spawnReconSweepVfx,
    buildTurretDrone: buildTurretDrone,
    buildDecoyFlare: buildDecoyFlare,
    spawnBerserkSlamVfx: spawnBerserkSlamVfx,
    spawnWaveRing: spawnWaveRing,
    spawnLightningBolt: spawnLightningBolt,
    spawnSparkBurst: spawnSparkBurst,
    spawnImpactStar: spawnImpactStar,
    spawnSigilPulse: spawnSigilPulse
  };
})(typeof window !== 'undefined' ? window : globalThis);
