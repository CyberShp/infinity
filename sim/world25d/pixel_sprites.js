/* ============================================================================
 * INFINITY // HD-2D HIGH-CRAFT ART & PROCEDURAL TEXTURE ATLAS (pixel_sprites.js)
 * Classic non-module script exposing window.INFINITY.PixelSprites
 *
 * Upgraded HD-2D visual pipeline:
 *   - 256x256 procedural PBR tile textures (albedo + bump + roughness)
 *     for realistic subterranean subway architecture without grid repetition
 *   - 128x128 illustrated HD-2D humanoid character sprites (5 unique cast members)
 *     and 160x192 towering Inspector Boss sprites with 8 expressive stances
 *   - 256x256 high-resolution procedural VFX textures (sweeping crescent slash,
 *     branching fissures, intricate arcane/tactical sigils, hex shields,
 *     lightning ribbons, scrolling rune curtains, soft glow & mist puffs)
 *   - 100% backwards-compatible INFINITY.PixelSprites public API
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = global.INFINITY = global.INFINITY || {};
  var textureCache = Object.create(null);

  /* --------------------------------------------------------------------------
   * Deterministic PRNG & Canvas Helpers
   * -------------------------------------------------------------------------- */
  function createRng(seed) {
    var s = (seed >>> 0) || 1337;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function makeCanvas(w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    return {
      width: w,
      height: h,
      getContext: function () { return null; }
    };
  }

  function toTexture(canvas, repeat, opts) {
    var THREE = global.THREE;
    if (!THREE) return null;
    var cfg = opts || {};
    var tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = cfg.mipmaps !== false;
    if (cfg.nearest) {
      // Crisp HD-2D pixel edges on magnification; mipmapped textures keep a filtered
      // minification chain so perspective floors do not shimmer at distance.
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = tex.generateMipmaps ? THREE.NearestMipmapLinearFilter : THREE.NearestFilter;
    } else {
      tex.minFilter = tex.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
    }
    tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    if (cfg.srgb && THREE.sRGBEncoding !== undefined) {
      tex.encoding = THREE.sRGBEncoding;
    }
    tex.anisotropy = cfg.anisotropy || 4;
    tex.needsUpdate = true;
    return tex;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    var rad = Math.min(r || 0, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function addMicroGrain(ctx, w, h, rng, count, alphaScale, lightCol, darkCol) {
    for (var i = 0; i < count; i++) {
      var gx = rng() * w;
      var gy = rng() * h;
      var gs = 1 + rng() * 2.5;
      var bright = rng() > 0.52;
      ctx.fillStyle = bright ? (lightCol || 'rgba(255,255,255,' + (0.04 * alphaScale).toFixed(3) + ')')
                             : (darkCol || 'rgba(0,0,0,' + (0.08 * alphaScale).toFixed(3) + ')');
      ctx.fillRect(gx, gy, gs, gs);
    }
  }

  /* --------------------------------------------------------------------------
   * 1. HIGH-RES 256x256 PROCEDURAL PBR TILES (ALBEDO + BUMP + ROUGHNESS)
   * -------------------------------------------------------------------------- */
  function buildTileCanvas(name) {
    var S = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (!ctx) return c;
    ctx.imageSmoothingEnabled = true;

    if (name === 'floor_slate') {
      var rng = createRng(1041);
      // Base weathered dark architectural terrazzo / slate
      var bg = ctx.createLinearGradient(0, 0, S, S);
      bg.addColorStop(0, '#272f3d');
      bg.addColorStop(0.5, '#222a36');
      bg.addColorStop(1, '#1e2530');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, S, S);

      // 2x2 large beveled stone slabs with subtle per-slab tone shift
      var half = S / 2;
      var slabTints = ['#2a3342', '#252d3b', '#232b38', '#283140'];
      for (var sy = 0; sy < 2; sy++) {
        for (var sx = 0; sx < 2; sx++) {
          var ox = sx * half;
          var oy = sy * half;
          ctx.fillStyle = slabTints[sy * 2 + sx];
          ctx.fillRect(ox + 3, oy + 3, half - 6, half - 6);

          // Soft internal stone clouding
          var sg = ctx.createRadialGradient(ox + half * 0.45, oy + half * 0.4, 8, ox + half * 0.5, oy + half * 0.5, half * 0.72);
          sg.addColorStop(0, 'rgba(130, 160, 195, 0.055)');
          sg.addColorStop(1, 'rgba(8, 12, 18, 0.14)');
          ctx.fillStyle = sg;
          ctx.fillRect(ox + 3, oy + 3, half - 6, half - 6);

          // Top-left bevel highlight & bottom-right shadow
          ctx.fillStyle = 'rgba(165, 195, 228, 0.09)';
          ctx.fillRect(ox + 3, oy + 3, half - 6, 2);
          ctx.fillRect(ox + 3, oy + 3, 2, half - 6);
          ctx.fillStyle = 'rgba(5, 8, 12, 0.34)';
          ctx.fillRect(ox + 3, oy + half - 5, half - 6, 2);
          ctx.fillRect(ox + half - 5, oy + 3, 2, half - 6);
        }
      }

      // Recessed mortar grout seams
      ctx.fillStyle = '#121720';
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, half - 2, S, 4);
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(0, 0, 3, S);
      ctx.fillRect(half - 2, 0, 4, S);
      ctx.fillRect(S - 3, 0, 3, S);

      // Subtle mineral aggregate flecks & hairline scuff
      addMicroGrain(ctx, S, S, rng, 420, 1.0);
      ctx.strokeStyle = 'rgba(10, 14, 20, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(42, 74);
      ctx.lineTo(68, 86);
      ctx.lineTo(95, 81);
      ctx.stroke();
      return c;
    }

    if (name === 'floor_platform') {
      var rngP = createRng(2083);
      ctx.fillStyle = '#2d333f';
      ctx.fillRect(0, 0, S, S);

      // Cast ribbed station platform concrete slabs
      var grad = ctx.createLinearGradient(0, 0, S, 0);
      grad.addColorStop(0, '#323946');
      grad.addColorStop(0.5, '#2b313d');
      grad.addColorStop(1, '#262c37');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);

      // Horizontal expansion joints
      ctx.fillStyle = '#161a22';
      ctx.fillRect(0, 0, S, 4);
      ctx.fillRect(0, 126, S, 4);
      ctx.fillStyle = 'rgba(180, 200, 224, 0.08)';
      ctx.fillRect(0, 4, S, 2);
      ctx.fillRect(0, 130, S, 2);

      // Subtle anti-slip micro grooves
      for (var gy = 16; gy < S; gy += 16) {
        if (gy === 128) continue;
        ctx.fillStyle = 'rgba(12, 16, 22, 0.16)';
        ctx.fillRect(0, gy, S, 1.5);
        ctx.fillStyle = 'rgba(195, 212, 232, 0.05)';
        ctx.fillRect(0, gy + 1.5, S, 1);
      }

      // Vertical seam
      ctx.fillStyle = 'rgba(12, 15, 20, 0.45)';
      ctx.fillRect(S - 3, 0, 3, S);
      addMicroGrain(ctx, S, S, rngP, 380, 1.1);
      return c;
    }

    if (name === 'floor_hazard') {
      var rngH = createRng(3019);
      ctx.fillStyle = '#1c2028';
      ctx.fillRect(0, 0, S, S);

      // Crisp metallic frame rails left & right
      ctx.fillStyle = '#38404e';
      ctx.fillRect(0, 0, 16, S);
      ctx.fillRect(S - 16, 0, 16, S);
      ctx.fillStyle = '#12151b';
      ctx.fillRect(16, 0, 4, S);
      ctx.fillRect(S - 20, 0, 4, S);

      // Diagonal safety stripes clipped to center strip
      ctx.save();
      ctx.beginPath();
      ctx.rect(20, 0, S - 40, S);
      ctx.clip();

      ctx.fillStyle = '#191d24';
      ctx.fillRect(20, 0, S - 40, S);

      var stripeW = 36;
      for (var d = -S; d < S * 2; d += stripeW * 2) {
        var yGrad = ctx.createLinearGradient(0, d, S, d + S);
        yGrad.addColorStop(0, '#d8a634');
        yGrad.addColorStop(0.5, '#e8bc4a');
        yGrad.addColorStop(1, '#c49028');
        ctx.fillStyle = yGrad;
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(d + stripeW, 0);
        ctx.lineTo(d + stripeW - S, S);
        ctx.lineTo(d - S, S);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Tactile warning dots along inner edge & industrial scuffing
      for (var ty = 16; ty < S; ty += 32) {
        ctx.fillStyle = 'rgba(255, 232, 152, 0.28)';
        ctx.beginPath();
        ctx.arc(8, ty, 3, 0, Math.PI * 2);
        ctx.arc(S - 8, ty, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      addMicroGrain(ctx, S, S, rngH, 460, 1.35);
      return c;
    }

    if (name === 'floor_rail') {
      var rngR = createRng(4099);
      ctx.fillStyle = '#13161d';
      ctx.fillRect(0, 0, S, S);

      // Crushed basalt gravel ballast pebbles
      var pebbleCols = ['#1b2029', '#222834', '#161a22', '#282f3c', '#12151b'];
      for (var p = 0; p < 520; p++) {
        var px = rngR() * S;
        var py = rngR() * S;
        var prx = 2.5 + rngR() * 5.5;
        var pry = 2.0 + rngR() * 4.2;
        ctx.fillStyle = pebbleCols[Math.floor(rngR() * pebbleCols.length)];
        ctx.beginPath();
        ctx.ellipse(px, py, prx, pry, rngR() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Oil sheen dark band down center
      var oil = ctx.createLinearGradient(0, 0, S, 0);
      oil.addColorStop(0, 'rgba(6, 8, 12, 0.35)');
      oil.addColorStop(0.5, 'rgba(18, 24, 34, 0.55)');
      oil.addColorStop(1, 'rgba(6, 8, 12, 0.35)');
      ctx.fillStyle = oil;
      ctx.fillRect(0, 0, S, S);

      // Subtle rusted metallic flecks
      for (var rf = 0; rf < 70; rf++) {
        ctx.fillStyle = 'rgba(110, 62, 42, 0.22)';
        ctx.fillRect(rngR() * S, rngR() * S, 3, 2);
      }
      return c;
    }

    if (name === 'wall_concrete') {
      var rngW = createRng(5107);
      // Upper architectural cast concrete (y: 0..118)
      var topGrad = ctx.createLinearGradient(0, 0, 0, 118);
      topGrad.addColorStop(0, '#2a3342');
      topGrad.addColorStop(0.6, '#333e50');
      topGrad.addColorStop(1, '#2a3444');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, S, 118);

      // Cast concrete form-tie holes & vertical joint
      ctx.fillStyle = '#181e28';
      ctx.fillRect(0, 0, S, 10); // top shadow lip
      ctx.fillRect(126, 10, 3, 108);
      for (var fh = 0; fh < 4; fh++) {
        var fhx = 32 + fh * 64;
        ctx.fillStyle = '#19202b';
        ctx.beginPath();
        ctx.arc(fhx, 42, 4, 0, Math.PI * 2);
        ctx.arc(fhx, 92, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(170, 195, 224, 0.14)';
        ctx.beginPath();
        ctx.arc(fhx, 43.5, 3, 0, Math.PI);
        ctx.fill();
      }

      // Steel chair-rail molding divider (y: 118..134)
      var railGrad = ctx.createLinearGradient(0, 118, 0, 134);
      railGrad.addColorStop(0, '#506078');
      railGrad.addColorStop(0.35, '#2b3545');
      railGrad.addColorStop(1, '#141922');
      ctx.fillStyle = railGrad;
      ctx.fillRect(0, 118, S, 16);

      // Classic subterranean subway glazed ceramic brick wainscot (y: 134..228)
      ctx.fillStyle = '#1d2531';
      ctx.fillRect(0, 134, S, 94);
      var brickH = 18;
      var brickW = 42;
      for (var row = 0; row < 5; row++) {
        var by = 136 + row * brickH;
        var shift = (row % 2) * (brickW * 0.5);
        for (var bx = -brickW; bx < S + brickW; bx += brickW) {
          var shade = 36 + Math.floor(rngW() * 14);
          ctx.fillStyle = 'rgb(' + shade + ',' + (shade + 9) + ',' + (shade + 22) + ')';
          ctx.fillRect(bx + shift + 1.5, by + 1.5, brickW - 3, brickH - 3);
          ctx.fillStyle = 'rgba(180, 212, 240, 0.08)';
          ctx.fillRect(bx + shift + 1.5, by + 1.5, brickW - 3, 2);
        }
      }

      // Heavy steel kickplate baseboard (y: 228..256)
      var baseGrad = ctx.createLinearGradient(0, 228, 0, S);
      baseGrad.addColorStop(0, '#3a4556');
      baseGrad.addColorStop(0.25, '#212834');
      baseGrad.addColorStop(1, '#10141c');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 228, S, 28);

      // Subtle vertical damp streaks
      for (var ds = 0; ds < 7; ds++) {
        var sx2 = rngW() * S;
        var stg = ctx.createLinearGradient(sx2, 10, sx2, 220);
        stg.addColorStop(0, 'rgba(6, 10, 16, 0.28)');
        stg.addColorStop(0.7, 'rgba(6, 10, 16, 0.08)');
        stg.addColorStop(1, 'rgba(6, 10, 16, 0)');
        ctx.fillStyle = stg;
        ctx.fillRect(sx2, 10, 4 + rngW() * 9, 210);
      }

      addMicroGrain(ctx, S, S, rngW, 380, 0.9);
      return c;
    }

    if (name === 'wall_neon') {
      var rngN = createRng(6203);
      // Dark architectural metallic transit wall
      var nBg = ctx.createLinearGradient(0, 0, 0, S);
      nBg.addColorStop(0, '#1e2838');
      nBg.addColorStop(0.45, '#243245');
      nBg.addColorStop(0.55, '#1b2636');
      nBg.addColorStop(1, '#121822');
      ctx.fillStyle = nBg;
      ctx.fillRect(0, 0, S, S);

      // Brushed cladding panel seams
      ctx.fillStyle = '#0e141e';
      ctx.fillRect(0, 0, S, 10);
      ctx.fillRect(84, 10, 3, S - 36);
      ctx.fillRect(170, 10, 3, S - 36);
      ctx.fillStyle = 'rgba(130, 200, 235, 0.09)';
      ctx.fillRect(87, 10, 2, S - 36);
      ctx.fillRect(173, 10, 2, S - 36);

      // Recessed light trough + glowing cyan transit guide bar (y: 108..134)
      ctx.fillStyle = '#0b1119';
      ctx.fillRect(0, 106, S, 30);

      // Soft neon bloom spill onto adjacent wall panels
      var spill = ctx.createLinearGradient(0, 68, 0, 174);
      spill.addColorStop(0, 'rgba(72, 214, 240, 0)');
      spill.addColorStop(0.38, 'rgba(72, 214, 240, 0.22)');
      spill.addColorStop(0.5, 'rgba(175, 248, 255, 0.55)');
      spill.addColorStop(0.62, 'rgba(72, 214, 240, 0.22)');
      spill.addColorStop(1, 'rgba(72, 214, 240, 0)');
      ctx.fillStyle = spill;
      ctx.fillRect(0, 68, S, 106);

      // Crisp bright fluorescent core bar
      ctx.fillStyle = '#56e2fa';
      ctx.fillRect(0, 114, S, 14);
      ctx.fillStyle = '#dcfbff';
      ctx.fillRect(0, 118, S, 6);

      // Subtle golden transit line sub-stripe & station markings
      ctx.fillStyle = '#d4a348';
      ctx.fillRect(0, 142, S, 4);
      ctx.fillStyle = 'rgba(220, 244, 255, 0.35)';
      ctx.fillRect(18, 48, 48, 4);
      ctx.fillRect(18, 58, 30, 3);
      ctx.fillRect(104, 48, 52, 4);
      ctx.fillRect(188, 48, 44, 4);

      // Lower kickplate
      ctx.fillStyle = '#141a24';
      ctx.fillRect(0, 224, S, 32);
      ctx.fillStyle = '#2d3a4d';
      ctx.fillRect(0, 224, S, 3);

      addMicroGrain(ctx, S, S, rngN, 260, 0.8);
      return c;
    }

    if (name === 'train_hull') {
      var rngT = createRng(7321);
      var tGrad = ctx.createLinearGradient(0, 0, 0, S);
      tGrad.addColorStop(0, '#272c38');
      tGrad.addColorStop(0.5, '#1d222c');
      tGrad.addColorStop(1, '#14171f');
      ctx.fillStyle = tGrad;
      ctx.fillRect(0, 0, S, S);

      // Corrugated steel carriage ribs
      for (var ry = 20; ry < S - 24; ry += 14) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, ry, S, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.34)';
        ctx.fillRect(0, ry + 5, S, 3);
      }

      // Crimson spectral transit livery stripe
      ctx.fillStyle = '#781d2a';
      ctx.fillRect(0, 136, S, 24);
      ctx.fillStyle = '#c43245';
      ctx.fillRect(0, 143, S, 6);
      ctx.fillStyle = '#e8c47a';
      ctx.fillRect(0, 162, S, 3);

      // Vertical carriage panel seams & rivets
      ctx.fillStyle = '#0d1016';
      ctx.fillRect(64, 0, 3, S);
      ctx.fillRect(192, 0, 3, S);
      for (var rv = 14; rv < S; rv += 24) {
        ctx.fillStyle = '#3d4556';
        ctx.beginPath();
        ctx.arc(58, rv, 2.2, 0, Math.PI * 2);
        ctx.arc(72, rv, 2.2, 0, Math.PI * 2);
        ctx.arc(186, rv, 2.2, 0, Math.PI * 2);
        ctx.arc(200, rv, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      addMicroGrain(ctx, S, S, rngT, 320, 1.0);
      return c;
    }

    // Fallback slate
    return buildTileCanvas('floor_slate');
  }

  function buildTileBumpCanvas(name) {
    var S = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (!ctx) return c;
    var rng = createRng(name === 'wall_concrete' ? 911 : (name === 'floor_slate' ? 922 : (name === 'floor_hazard' ? 944 : 933)));

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, S, S);

    if (name === 'floor_slate') {
      var half = S / 2;
      // Chamfered 2x2 architectural basalt/terrazzo slabs with subtle internal micro-relief
      for (var sy = 0; sy < 2; sy++) {
        for (var sx = 0; sx < 2; sx++) {
          var ox = sx * half;
          var oy = sy * half;
          ctx.fillStyle = '#929292';
          ctx.fillRect(ox + 3, oy + 3, half - 6, half - 6);
          ctx.fillStyle = '#aaaaaa';
          ctx.fillRect(ox + 7, oy + 7, half - 14, half - 14);
          // Subtle inner stone undulation
          var ug = ctx.createRadialGradient(ox + half * 0.45, oy + half * 0.45, 6, ox + half * 0.5, oy + half * 0.5, half * 0.65);
          ug.addColorStop(0, 'rgba(235,235,235,0.16)');
          ug.addColorStop(1, 'rgba(55,55,55,0.16)');
          ctx.fillStyle = ug;
          ctx.fillRect(ox + 7, oy + 7, half - 14, half - 14);
        }
      }
      // Deeply recessed mortar grout channels
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, half - 2, S, 4);
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(0, 0, 3, S);
      ctx.fillRect(half - 2, 0, 4, S);
      ctx.fillRect(S - 3, 0, 3, S);
      // Hairline stone crack relief
      ctx.strokeStyle = '#242424';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(42, 74); ctx.lineTo(68, 86); ctx.lineTo(95, 81);
      ctx.stroke();
      addMicroGrain(ctx, S, S, rng, 520, 1.8, 'rgba(230,230,230,0.16)', 'rgba(25,25,25,0.20)');
    } else if (name === 'floor_platform') {
      // Ribbed anti-slip station platform pavers + recessed drainage seams
      for (var y = 0; y < S; y += 16) {
        ctx.fillStyle = '#404040';
        ctx.fillRect(0, y, S, 3);
        ctx.fillStyle = '#b4b4b4';
        ctx.fillRect(0, y + 3, S, 11);
      }
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, S, 4);
      ctx.fillRect(0, 126, S, 5);
      ctx.fillRect(S - 4, 0, 4, S);
      addMicroGrain(ctx, S, S, rng, 360, 1.5, 'rgba(220,220,220,0.14)', 'rgba(20,20,20,0.18)');
    } else if (name === 'floor_hazard') {
      // Raised steel side rails + embossed tactile diamond-plate warning studs
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(0, 0, 16, S);
      ctx.fillRect(S - 16, 0, 16, S);
      ctx.fillStyle = '#202020';
      ctx.fillRect(16, 0, 4, S);
      ctx.fillRect(S - 20, 0, 4, S);
      // Tactile blister studs across center safety strip
      for (var hy = 12; hy < S; hy += 24) {
        for (var hx = 30; hx < S - 26; hx += 24) {
          var gStud = ctx.createRadialGradient(hx, hy, 1, hx, hy, 6.5);
          gStud.addColorStop(0, '#ededed');
          gStud.addColorStop(0.65, '#a8a8a8');
          gStud.addColorStop(1, '#686868');
          ctx.fillStyle = gStud;
          ctx.beginPath();
          ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      addMicroGrain(ctx, S, S, rng, 320, 1.4, 'rgba(220,220,220,0.12)', 'rgba(25,25,25,0.16)');
    } else if (name === 'floor_rail') {
      // High-relief angular crushed granite ballast stones
      ctx.fillStyle = '#484848';
      ctx.fillRect(0, 0, S, S);
      for (var p = 0; p < 580; p++) {
        var px = rng() * S;
        var py = rng() * S;
        var prx = 2.8 + rng() * 6.0;
        var pry = 2.2 + rng() * 4.5;
        var v = 90 + Math.floor(rng() * 135);
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        ctx.beginPath();
        ctx.ellipse(px, py, prx, pry, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (name === 'wall_concrete' || name === 'wall_neon') {
      // Upper formwork concrete + deep chair-rail molding + beveled glazed subway bricks
      ctx.fillStyle = '#202020';
      ctx.fillRect(0, 0, S, 10);
      ctx.fillRect(126, 10, 4, 108);
      // Recessed tie-rod dimples
      for (var fh = 0; fh < 4; fh++) {
        var fhx = 32 + fh * 64;
        ctx.fillStyle = '#262626';
        ctx.beginPath();
        ctx.arc(fhx, 42, 4.5, 0, Math.PI * 2);
        ctx.arc(fhx, 92, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#dadada';
      ctx.fillRect(0, 118, S, 13);
      ctx.fillStyle = '#242424';
      ctx.fillRect(0, 131, S, 4);
      if (name === 'wall_concrete') {
        for (var r = 0; r < 5; r++) {
          var by = 136 + r * 18;
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(0, by, S, 3);
          var sh = (r % 2) * 21;
          for (var bx = -42; bx < S + 42; bx += 42) {
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(bx + sh, by, 3, 18);
            ctx.fillStyle = '#b8b8b8';
            ctx.fillRect(bx + sh + 4, by + 4, 34, 11);
          }
        }
        ctx.fillStyle = '#c4c4c4';
        ctx.fillRect(0, 228, S, 28);
      } else {
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(84, 10, 4, S - 36);
        ctx.fillRect(170, 10, 4, S - 36);
        ctx.fillRect(0, 106, S, 30);
        ctx.fillStyle = '#eaeaea';
        ctx.fillRect(0, 114, S, 14);
      }
      addMicroGrain(ctx, S, S, rng, 340, 1.4, 'rgba(220,220,220,0.12)', 'rgba(25,25,25,0.16)');
    } else if (name === 'train_hull') {
      for (var ry = 20; ry < S - 24; ry += 14) {
        ctx.fillStyle = '#d4d4d4';
        ctx.fillRect(0, ry, S, 5);
        ctx.fillStyle = '#303030';
        ctx.fillRect(0, ry + 6, S, 3);
      }
      ctx.fillStyle = '#181818';
      ctx.fillRect(64, 0, 3, S);
      ctx.fillRect(192, 0, 3, S);
      for (var rv = 14; rv < S; rv += 24) {
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(58, rv, 2.8, 0, Math.PI * 2);
        ctx.arc(72, rv, 2.8, 0, Math.PI * 2);
        ctx.arc(186, rv, 2.8, 0, Math.PI * 2);
        ctx.arc(200, rv, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      addMicroGrain(ctx, S, S, rng, 420, 2.0, 'rgba(235,235,235,0.2)', 'rgba(20,20,20,0.22)');
    }
    return c;
  }

  /* --------------------------------------------------------------------------
   * Tangent-Space RGB Normal Map (Sobel Gradient) & PBR Roughness Map Builders
   * -------------------------------------------------------------------------- */
  function heightCanvasToNormalCanvas(heightCanvas, strength, wrapEdges) {
    var w = heightCanvas.width || 256;
    var h = heightCanvas.height || 256;
    var out = makeCanvas(w, h);
    var srcCtx = heightCanvas.getContext ? heightCanvas.getContext('2d') : null;
    var dstCtx = out.getContext ? out.getContext('2d') : null;
    if (!srcCtx || !dstCtx || typeof srcCtx.getImageData !== 'function') return out;

    var src = srcCtx.getImageData(0, 0, w, h).data;
    var dstImg = dstCtx.createImageData(w, h);
    var dst = dstImg.data;
    var str = Number(strength) || 2.4;

    function sampleH(x, y) {
      if (wrapEdges) {
        x = (x % w + w) % w;
        y = (y % h + h) % h;
      } else {
        x = x < 0 ? 0 : (x >= w ? w - 1 : x);
        y = y < 0 ? 0 : (y >= h ? h - 1 : y);
      }
      return src[(y * w + x) * 4] / 255.0;
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var tl = sampleH(x - 1, y - 1);
        var t  = sampleH(x,     y - 1);
        var tr = sampleH(x + 1, y - 1);
        var l  = sampleH(x - 1, y);
        var r  = sampleH(x + 1, y);
        var bl = sampleH(x - 1, y + 1);
        var b  = sampleH(x,     y + 1);
        var br = sampleH(x + 1, y + 1);

        var dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        var dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

        var nx = -dX * str;
        var ny =  dY * str;
        var nz =  1.0;
        var invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx *= invLen;
        ny *= invLen;
        nz *= invLen;

        var idx = (y * w + x) * 4;
        dst[idx]     = Math.max(0, Math.min(255, Math.round((nx * 0.5 + 0.5) * 255)));
        dst[idx + 1] = Math.max(0, Math.min(255, Math.round((ny * 0.5 + 0.5) * 255)));
        dst[idx + 2] = Math.max(0, Math.min(255, Math.round((nz * 0.5 + 0.5) * 255)));
        dst[idx + 3] = 255;
      }
    }

    dstCtx.putImageData(dstImg, 0, 0);
    return out;
  }

  function buildTileNormalCanvas(name) {
    var bumpCanvas = buildTileBumpCanvas(name);
    var strength = (name === 'floor_rail' || name === 'floor_hazard') ? 3.4
      : (name === 'wall_concrete' || name === 'train_hull') ? 2.8
      : 2.3;
    return heightCanvasToNormalCanvas(bumpCanvas, strength, true);
  }

  function buildTileRoughnessCanvas(name) {
    var S = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (!ctx) return c;
    var rng = createRng(name === 'wall_concrete' ? 7711 : (name === 'floor_slate' ? 7722 : 7733));

    if (name === 'floor_slate') {
      // Polished damp terrazzo slab interiors (0.42..0.58) vs matte dusty grout joints (0.92)
      ctx.fillStyle = '#848484';
      ctx.fillRect(0, 0, S, S);
      var half = S / 2;
      for (var sy = 0; sy < 2; sy++) {
        for (var sx = 0; sx < 2; sx++) {
          var ox = sx * half;
          var oy = sy * half;
          var g = ctx.createRadialGradient(ox + half * 0.5, oy + half * 0.5, 8, ox + half * 0.5, oy + half * 0.5, half * 0.65);
          g.addColorStop(0, '#6a6a6a'); // smoother worn foot-traffic center catches subtle specular!
          g.addColorStop(1, '#989898');
          ctx.fillStyle = g;
          ctx.fillRect(ox + 4, oy + 4, half - 8, half - 8);
        }
      }
      ctx.fillStyle = '#e8e8e8'; // rough grout seams
      ctx.fillRect(0, 0, S, 4);
      ctx.fillRect(0, half - 2, S, 4);
      ctx.fillRect(0, S - 4, S, 4);
      ctx.fillRect(0, 0, 4, S);
      ctx.fillRect(half - 2, 0, 4, S);
      ctx.fillRect(S - 4, 0, 4, S);
      addMicroGrain(ctx, S, S, rng, 420, 1.5, 'rgba(240,240,240,0.16)', 'rgba(60,60,60,0.18)');
    } else if (name === 'wall_concrete') {
      // Upper matte poured concrete (0.84) + glossy glazed ceramic subway tile wainscot (0.36) + brushed steel kickplate (0.45)
      ctx.fillStyle = '#d6d6d6';
      ctx.fillRect(0, 0, S, 118);
      ctx.fillStyle = '#6c6c6c'; // metallic dado rail
      ctx.fillRect(0, 118, S, 16);
      ctx.fillStyle = '#5c5c5c'; // glossy ceramic subway tiles!
      ctx.fillRect(0, 134, S, 94);
      ctx.fillStyle = '#dcdcdc'; // matte mortar lines between glossy bricks
      for (var r = 0; r < 5; r++) {
        var by = 136 + r * 18;
        ctx.fillRect(0, by, S, 2.5);
        var sh = (r % 2) * 21;
        for (var bx = -42; bx < S + 42; bx += 42) {
          ctx.fillRect(bx + sh, by, 2.5, 18);
        }
      }
      ctx.fillStyle = '#747474';
      ctx.fillRect(0, 228, S, 28);
      addMicroGrain(ctx, S, S, rng, 300, 1.2, 'rgba(235,235,235,0.14)', 'rgba(60,60,60,0.14)');
    } else if (name === 'wall_neon') {
      // Brushed metal panels (0.52) + glossy glass light diffuser (0.18)
      ctx.fillStyle = '#828282';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#2e2e2e';
      ctx.fillRect(0, 110, S, 22);
      addMicroGrain(ctx, S, S, rng, 240, 1.1, 'rgba(220,220,220,0.1)', 'rgba(40,40,40,0.12)');
    } else if (name === 'floor_hazard') {
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#686868';
      ctx.fillRect(0, 0, 16, S);
      ctx.fillRect(S - 16, 0, 16, S);
      addMicroGrain(ctx, S, S, rng, 340, 1.6, 'rgba(240,240,240,0.18)', 'rgba(60,60,60,0.18)');
    } else if (name === 'train_hull') {
      ctx.fillStyle = '#707070';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#4e4e4e';
      ctx.fillRect(0, 136, S, 26);
      addMicroGrain(ctx, S, S, rng, 280, 1.4, 'rgba(220,220,220,0.14)', 'rgba(40,40,40,0.16)');
    } else {
      ctx.fillStyle = '#b4b4b4';
      ctx.fillRect(0, 0, S, S);
      addMicroGrain(ctx, S, S, rng, 360, 1.5, 'rgba(240,240,240,0.16)', 'rgba(80,80,80,0.16)');
    }
    return c;
  }

  /* --------------------------------------------------------------------------
   * 2. HIGH-CRAFT 128x128 ILLUSTRATED HD-2D CHARACTERS & 160x192 BOSS
   * -------------------------------------------------------------------------- */
  var CHAR_PROFILES = {
    player: {
      hair: '#1b2434',
      hairHi: '#425878',
      skin: '#f0ccb0',
      skinShade: '#c99878',
      coat: '#1c2636',
      coatHi: '#344764',
      coatDark: '#0f1520',
      shirt: '#e3edf7',
      pants: '#151b26',
      accent: '#4ee4ff',
      accentSoft: 'rgba(78, 228, 255, 0.45)',
      gold: '#f0c46c',
      eye: '#68e8ff',
      weapon: 'energy_blade',
      accessory: 'wristwatch'
    },
    yanci: {
      hair: '#1e222e',
      hairHi: '#48526e',
      skin: '#f2d0b6',
      skinShade: '#cc9c7d',
      coat: '#262e40',
      coatHi: '#414f6e',
      coatDark: '#141924',
      shirt: '#edf1f7',
      pants: '#1a202d',
      accent: '#7ca7d9',
      accentSoft: 'rgba(124, 167, 217, 0.45)',
      gold: '#f7d688',
      eye: '#bcd6f2',
      weapon: 'law_ledger',
      accessory: 'glasses_tie'
    },
    lujin: {
      hair: '#2a1d17',
      hairHi: '#5e4032',
      skin: '#e6b898',
      skinShade: '#bc8867',
      coat: '#2e2b2b',
      coatHi: '#4d4745',
      coatDark: '#171515',
      shirt: '#3c3634',
      pants: '#1c1b1d',
      accent: '#e88c4a',
      accentSoft: 'rgba(232, 140, 74, 0.48)',
      gold: '#ffb95e',
      eye: '#ffb454',
      weapon: 'rail_carbine',
      accessory: 'amber_scarf'
    },
    xutan: {
      hair: '#192935',
      hairHi: '#3b6278',
      skin: '#f3d4be',
      skinShade: '#cc9f84',
      coat: '#1c333f',
      coatHi: '#2f5669',
      coatDark: '#0f1d25',
      shirt: '#d6eef5',
      pants: '#17232c',
      accent: '#52d6b4',
      accentSoft: 'rgba(82, 214, 180, 0.48)',
      gold: '#8ceeff',
      eye: '#6ef0d0',
      weapon: 'pke_tablet',
      accessory: 'visor_hood'
    },
    shenyan: {
      hair: '#2e2d35',
      hairHi: '#8a8d9e',
      skin: '#e8c4b0',
      skinShade: '#ba8e7a',
      coat: '#3b1922',
      coatHi: '#692a3a',
      coatDark: '#1e0b11',
      shirt: '#20191e',
      pants: '#18141a',
      accent: '#c9a66b',
      accentSoft: 'rgba(201, 166, 107, 0.48)',
      gold: '#d8aa58',
      eye: '#e8b860',
      weapon: 'pocket_watch',
      accessory: 'high_collar'
    }
  };

  function strokeOutlinedPath(ctx, fillStyle, strokeStyle, lineW) {
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineW || 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // Basic-attack style -> held weapon sprite variant (player loadout visualization).
  var WEAPON_BY_STYLE = {
    sword: 'energy_blade',
    cyber: 'rail_carbine',
    occult: 'occult_talisman',
    tactical: 'tactical_baton'
  };

  function resolveWeaponStyle(weaponStyle) {
    var key = weaponStyle ? String(weaponStyle) : '';
    return WEAPON_BY_STYLE[key] ? key : '';
  }

  function buildCharCanvas(id, frame, weaponStyle) {
    if (id === 'inspector') {
      return buildInspectorCanvas(frame);
    }

    var S = 128;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (!ctx) return c;
    ctx.imageSmoothingEnabled = true;

    var p = CHAR_PROFILES[id] || CHAR_PROFILES.player;
    var styleKey = resolveWeaponStyle(weaponStyle);
    if (styleKey && WEAPON_BY_STYLE[styleKey] !== p.weapon) {
      p = Object.assign({}, p, { weapon: WEAPON_BY_STYLE[styleKey] });
    }
    var f = String(frame || 'idle');
    var isWalk1 = f === 'walk1';
    var isWalk2 = f === 'walk2';
    var isIdle2 = f === 'idle2';
    var isAction = f === 'action';
    var isDash = f === 'dash';
    var isChannel = f === 'channel';
    var isHurt = f === 'hurt';

    var bobY = isIdle2 ? -2.2 : (isWalk1 || isWalk2 ? -3.0 : (isDash ? 3.5 : (isHurt ? 2.0 : 0)));
    var leanX = isDash ? 7.5 : (isAction ? 4.0 : (isHurt ? -5.0 : 0));
    var stride = isWalk1 ? 8 : (isWalk2 ? -8 : (isDash ? 11 : (isAction ? 6 : 0)));

    ctx.save();
    ctx.translate(64 + leanX, 118 + bobY);
    if (isDash) ctx.rotate(0.11);
    else if (isHurt) ctx.rotate(-0.12);

    // Subtle ground aura reflection under boots
    var footGlow = ctx.createRadialGradient(0, 2, 4, 0, 2, 30);
    footGlow.addColorStop(0, p.accentSoft);
    footGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = footGlow;
    ctx.beginPath();
    ctx.ellipse(0, 2, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 1. BACK COAT TAIL (billows behind legs) ---
    var coatFlare = isDash ? -16 : (isAction ? -9 : (isWalk1 ? -5 : (isWalk2 ? 3 : 0)));
    ctx.beginPath();
    ctx.moveTo(-14, -50);
    ctx.quadraticCurveTo(-24 + coatFlare, -26, -26 + coatFlare, -7);
    ctx.lineTo(18 + coatFlare * 0.3, -9);
    ctx.quadraticCurveTo(16, -32, 13, -50);
    ctx.closePath();
    strokeOutlinedPath(ctx, p.coatDark, '#080b12', 2.4);

    // --- 2. LEGS & TACTICAL BOOTS ---
    function drawLeg(hipX, footX, footY, isBack) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hipX - 5, -38);
      ctx.lineTo(footX - 5.5, footY - 8);
      ctx.lineTo(footX + 6.5, footY - 8);
      ctx.lineTo(hipX + 5.5, -38);
      ctx.closePath();
      strokeOutlinedPath(ctx, isBack ? '#0e131c' : p.pants, '#070a10', 2.2);

      // Combat boot with sole & highlight
      ctx.beginPath();
      ctx.moveTo(footX - 6, footY - 12);
      ctx.lineTo(footX + 6.5, footY - 12);
      ctx.lineTo(footX + 10.5, footY - 2);
      ctx.lineTo(footX + 10, footY + 2);
      ctx.lineTo(footX - 6.5, footY + 2);
      ctx.closePath();
      strokeOutlinedPath(ctx, isBack ? '#0a0d14' : '#141923', '#05070b', 2.2);
      // Boot accent buckle
      ctx.fillStyle = p.accent;
      ctx.fillRect(footX - 3, footY - 9, 6, 2);
      ctx.restore();
    }
    drawLeg(-6, -7 - stride, isWalk1 ? -3 : 0, true);
    drawLeg(6, 7 + stride, isWalk2 ? -3 : 0, false);

    // --- 3. BACK ARM ---
    ctx.save();
    var backArmAngle = isAction ? -0.65 : (isChannel ? -1.05 : (isDash ? 0.65 : (isWalk1 ? 0.35 : -0.25)));
    ctx.translate(-14, -64);
    ctx.rotate(backArmAngle);
    drawRoundedRect(ctx, -5.5, 0, 11, 26, 5);
    strokeOutlinedPath(ctx, p.coatDark, '#070a10', 2.2);
    // Gloved hand
    ctx.beginPath();
    ctx.arc(0, 26, 4.5, 0, Math.PI * 2);
    strokeOutlinedPath(ctx, '#1b2230', '#070a10', 1.8);
    // Player glowing wristwatch on back/left wrist!
    if (p.accessory === 'wristwatch') {
      ctx.fillStyle = p.accent;
      ctx.fillRect(-4.5, 19, 9, 4.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, 20.2, 4, 2);
    }
    ctx.restore();

    // --- 4. TORSO, INNER SHIRT & LAYERED TRENCHCOAT ---
    // Inner torso shirt/vest
    ctx.beginPath();
    ctx.moveTo(-13, -72);
    ctx.lineTo(13, -72);
    ctx.lineTo(11, -36);
    ctx.lineTo(-11, -36);
    ctx.closePath();
    strokeOutlinedPath(ctx, p.shirt, '#080b12', 2.0);

    // Character-specific necktie / harness
    if (p.accessory === 'glasses_tie') {
      ctx.fillStyle = '#a82235';
      ctx.beginPath();
      ctx.moveTo(0, -68);
      ctx.lineTo(3.5, -52);
      ctx.lineTo(0, -45);
      ctx.lineTo(-3.5, -52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = p.gold;
      ctx.fillRect(-2.5, -60, 5, 2.2);
    } else {
      // Tactical chest harness strap
      ctx.strokeStyle = '#151b26';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-10, -70);
      ctx.lineTo(10, -42);
      ctx.stroke();
      ctx.fillStyle = p.accent;
      ctx.fillRect(-2, -57, 5, 4);
    }

    // Left & Right front coat panels with gradient fold shading
    var coatGrad = ctx.createLinearGradient(-20, -74, 20, -18);
    coatGrad.addColorStop(0, p.coatHi);
    coatGrad.addColorStop(0.55, p.coat);
    coatGrad.addColorStop(1, p.coatDark);

    // Left lapel & panel
    ctx.beginPath();
    ctx.moveTo(-16, -73);
    ctx.lineTo(-4, -71);
    ctx.lineTo(-5, -36);
    ctx.quadraticCurveTo(-11, -20, -21 + coatFlare * 0.4, -10);
    ctx.lineTo(-24 + coatFlare * 0.5, -18);
    ctx.quadraticCurveTo(-19, -46, -16, -73);
    ctx.closePath();
    strokeOutlinedPath(ctx, coatGrad, '#070a10', 2.3);

    // Right lapel & panel
    ctx.beginPath();
    ctx.moveTo(16, -73);
    ctx.lineTo(4, -71);
    ctx.lineTo(5, -36);
    ctx.quadraticCurveTo(13, -20, 21, -11);
    ctx.lineTo(24, -19);
    ctx.quadraticCurveTo(19, -46, 16, -73);
    ctx.closePath();
    strokeOutlinedPath(ctx, coatGrad, '#070a10', 2.3);

    // Glowing coat seam trim / belt
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(-9, -42);
    ctx.moveTo(17, -24);
    ctx.lineTo(9, -42);
    ctx.stroke();

    // Belt with metallic buckle
    ctx.fillStyle = '#121620';
    ctx.fillRect(-13, -42, 26, 5.5);
    ctx.fillStyle = p.gold;
    ctx.fillRect(-4, -41.5, 8, 4.5);

    // Shoulder pads / collar details
    if (p.accessory === 'amber_scarf') {
      // Lujin's billowing amber scarf
      ctx.beginPath();
      ctx.moveTo(-15, -72);
      ctx.quadraticCurveTo(-28 + coatFlare, -66, -34 + coatFlare, -52);
      ctx.quadraticCurveTo(-22 + coatFlare, -54, -12, -62);
      ctx.closePath();
      strokeOutlinedPath(ctx, '#d66f1c', '#070a10', 2.0);
      drawRoundedRect(ctx, -15, -75, 30, 10, 4);
      strokeOutlinedPath(ctx, '#f59836', '#070a10', 2.0);
    } else if (p.accessory === 'high_collar') {
      // Shenyan's dramatic popped crimson collar
      ctx.beginPath();
      ctx.moveTo(-17, -71);
      ctx.lineTo(-20, -86);
      ctx.lineTo(-8, -79);
      ctx.lineTo(8, -79);
      ctx.lineTo(20, -86);
      ctx.lineTo(17, -71);
      ctx.closePath();
      strokeOutlinedPath(ctx, p.coatHi, '#070a10', 2.2);
    } else if (p.accessory === 'visor_hood') {
      // Xutan's techwear collar & hood drape
      ctx.beginPath();
      ctx.moveTo(-19, -70);
      ctx.quadraticCurveTo(0, -82, 19, -70);
      ctx.lineTo(14, -63);
      ctx.quadraticCurveTo(0, -68, -14, -63);
      ctx.closePath();
      strokeOutlinedPath(ctx, p.coatHi, '#070a10', 2.2);
    } else {
      // Crisp popped tactical lapels
      ctx.beginPath();
      ctx.moveTo(-14, -72);
      ctx.lineTo(-5, -62);
      ctx.lineTo(-10, -76);
      ctx.closePath();
      strokeOutlinedPath(ctx, p.coatHi, '#070a10', 1.8);
      ctx.beginPath();
      ctx.moveTo(14, -72);
      ctx.lineTo(5, -62);
      ctx.lineTo(10, -76);
      ctx.closePath();
      strokeOutlinedPath(ctx, p.coatHi, '#070a10', 1.8);
    }

    // --- 5. HEAD, EXPRESSIVE FACE & LAYERED HAIR ---
    // Neck
    ctx.fillStyle = p.skinShade;
    ctx.fillRect(-4.5, -79, 9, 8);

    // Head base (clean anime/HD-2D tactical proportions)
    var headY = -91;
    var faceGrad = ctx.createLinearGradient(-12, headY - 14, 14, headY + 14);
    faceGrad.addColorStop(0, p.skin);
    faceGrad.addColorStop(0.75, p.skin);
    faceGrad.addColorStop(1, p.skinShade);

    ctx.beginPath();
    ctx.moveTo(-13.5, headY - 6);
    ctx.quadraticCurveTo(-14, headY + 9, -2, headY + 14);
    ctx.quadraticCurveTo(13, headY + 11, 14, headY - 4);
    ctx.quadraticCurveTo(14, headY - 17, 0, headY - 17);
    ctx.quadraticCurveTo(-13.5, headY - 17, -13.5, headY - 6);
    ctx.closePath();
    strokeOutlinedPath(ctx, faceGrad, '#080b12', 2.3);

    // Eyes (looking slightly right in canonical +X orientation)
    function drawEye(ex, ey) {
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(ex - 2.6, ey - 2.6, 5.2, 4.8);
      ctx.fillStyle = p.eye;
      ctx.fillRect(ex - 1.6, ey - 1.4, 3.6, 3.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex - 1.5, ey - 1.8, 1.8, 1.6);
    }
    if (!isHurt) {
      drawEye(-2.5, headY + 1);
      drawEye(7.5, headY + 1);
    } else {
      // Wincing hurt expression
      ctx.strokeStyle = '#121620';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, headY - 1); ctx.lineTo(0, headY + 2); ctx.lineTo(-5, headY + 4);
      ctx.moveTo(10, headY - 1); ctx.lineTo(5, headY + 2); ctx.lineTo(10, headY + 4);
      ctx.stroke();
    }

    // Subtle jaw/nose shading & determined mouth
    ctx.fillStyle = 'rgba(130, 82, 62, 0.45)';
    ctx.fillRect(2.5, headY + 3.5, 2, 2.5);
    ctx.fillStyle = '#754638';
    ctx.fillRect(0.5, headY + 8.5, 5, 1.6);

    // Glasses / Visor / Monocle accessories
    if (p.accessory === 'glasses_tie') {
      ctx.strokeStyle = '#d9b566';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-6.5, headY - 3, 7.5, 6);
      ctx.strokeRect(3.5, headY - 3, 7.5, 6);
      ctx.beginPath();
      ctx.moveTo(1, headY); ctx.lineTo(3.5, headY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 232, 160, 0.25)';
      ctx.fillRect(-6, headY - 2.5, 6.5, 5);
      ctx.fillRect(4, headY - 2.5, 6.5, 5);
    } else if (p.accessory === 'visor_hood') {
      // Glowing cyan holographic eyepiece on Xutan
      ctx.fillStyle = 'rgba(82, 240, 255, 0.36)';
      ctx.strokeStyle = '#7ef8ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(2.5, headY - 4.5, 11.5, 8.5, 2.5) : ctx.rect(2.5, headY - 4.5, 11.5, 8.5);
      ctx.fill();
      ctx.stroke();
    }

    // Layered Hair Silhouette + Specular Highlight
    var hairGrad = ctx.createLinearGradient(-16, headY - 22, 16, headY + 4);
    hairGrad.addColorStop(0, p.hairHi);
    hairGrad.addColorStop(0.55, p.hair);
    hairGrad.addColorStop(1, '#0c1018');

    ctx.beginPath();
    ctx.moveTo(-16, headY - 2);
    ctx.quadraticCurveTo(-19, headY - 19, -4, headY - 22);
    ctx.quadraticCurveTo(10, headY - 24, 17, headY - 11);
    ctx.lineTo(15, headY - 2);
    // Sweeping front bangs
    ctx.lineTo(11, headY - 8);
    ctx.lineTo(7, headY - 2);
    ctx.lineTo(2, headY - 10);
    ctx.lineTo(-3, headY - 2);
    ctx.lineTo(-9, headY - 9);
    ctx.lineTo(-13, headY + 4);
    ctx.closePath();
    strokeOutlinedPath(ctx, hairGrad, '#070a10', 2.3);

    // Hair specular rim arc
    ctx.strokeStyle = 'rgba(220, 240, 255, 0.42)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, headY - 10, 10.5, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();

    // Lujin's tactical goggles resting on forehead
    if (p.accessory === 'amber_scarf') {
      ctx.fillStyle = '#242022';
      ctx.fillRect(-13, headY - 15, 27, 5);
      ctx.fillStyle = '#ff9838';
      ctx.strokeStyle = '#080b12';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(-4, headY - 12.5, 5, 3.6, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(8, headY - 12.5, 5, 3.6, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(-6, headY - 14, 3, 1.5);
      ctx.fillRect(6, headY - 14, 3, 1.5);
    }

    // --- 6. FRONT ARM & SIGNATURE WEAPON / EQUIPMENT ---
    ctx.save();
    var frontArmAngle = isAction ? -1.15 : (isChannel ? -0.78 : (isDash ? -0.55 : (isWalk2 ? 0.35 : -0.18)));
    ctx.translate(14, -64);
    ctx.rotate(frontArmAngle);

    // Coat sleeve
    drawRoundedRect(ctx, -5.5, 0, 11.5, 26, 5);
    strokeOutlinedPath(ctx, coatGrad, '#070a10', 2.2);
    // Cuff accent
    ctx.fillStyle = p.accent;
    ctx.fillRect(-4.5, 20, 9, 2.5);
    // Hand
    ctx.beginPath();
    ctx.arc(0, 27, 4.6, 0, Math.PI * 2);
    strokeOutlinedPath(ctx, '#1b2230', '#070a10', 1.8);

    // Distinct Signature Equipment per Character
    if (p.weapon === 'energy_blade') {
      // Sleek glowing cyan/gold tactical energy sword
      ctx.save();
      ctx.translate(2, 27);
      ctx.rotate(isAction ? -0.35 : 0.45);
      // Hilt & guard
      ctx.fillStyle = '#263345';
      ctx.fillRect(-2.5, -6, 5, 11);
      ctx.fillStyle = p.gold;
      ctx.fillRect(-7, -7, 14, 3.2);
      // Glowing blade with bright core
      var bGrad = ctx.createLinearGradient(0, -7, 0, -44);
      bGrad.addColorStop(0, '#ffffff');
      bGrad.addColorStop(0.35, p.accent);
      bGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
      ctx.beginPath();
      ctx.moveTo(-3.5, -7);
      ctx.lineTo(0, -45);
      ctx.lineTo(3.8, -7);
      ctx.closePath();
      strokeOutlinedPath(ctx, bGrad, '#0a1c28', 1.4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, -39);
      ctx.stroke();
      ctx.restore();
    } else if (p.weapon === 'law_ledger') {
      // Yanci's glowing golden Law Ledger
      ctx.save();
      ctx.translate(4, 25);
      ctx.rotate(0.2);
      drawRoundedRect(ctx, -6, -9, 14, 18, 2);
      strokeOutlinedPath(ctx, '#2b2434', '#080a10', 2.0);
      ctx.strokeStyle = p.gold;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-3.5, -6.5, 9, 13);
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.weapon === 'rail_carbine') {
      // Lujin's heavy amber-coil kinetic rail carbine
      ctx.save();
      ctx.translate(4, 26);
      ctx.rotate(isAction ? -0.15 : 0.35);
      drawRoundedRect(ctx, -6, -5, 34, 9.5, 2.5);
      strokeOutlinedPath(ctx, '#282d36', '#070a10', 2.0);
      ctx.fillStyle = p.accent;
      ctx.fillRect(6, -2.5, 18, 4.2);
      ctx.fillStyle = '#fff3c0';
      ctx.fillRect(10, -1.3, 12, 1.8);
      ctx.restore();
    } else if (p.weapon === 'pke_tablet') {
      // Xutan's glowing cyan PKE holo-scanner
      ctx.save();
      ctx.translate(5, 24);
      drawRoundedRect(ctx, -5, -7, 15, 12, 2);
      strokeOutlinedPath(ctx, '#12222d', '#070a10', 1.8);
      ctx.fillStyle = p.accent;
      ctx.fillRect(-3, -5, 11, 8);
      // Floating holographic wave projection
      var hGrad = ctx.createRadialGradient(3, -10, 1, 3, -10, 13);
      hGrad.addColorStop(0, 'rgba(130, 250, 255, 0.8)');
      hGrad.addColorStop(1, 'rgba(82, 240, 255, 0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(3, -10, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.weapon === 'pocket_watch') {
      // Shenyan's crimson-brass anomalous pocket watch on chain
      ctx.save();
      ctx.translate(4, 27);
      ctx.strokeStyle = p.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(3, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, 15, 5.5, 0, Math.PI * 2);
      strokeOutlinedPath(ctx, '#7a3550', '#d8aa58', 2.0);
      ctx.fillStyle = '#ffe4ea';
      ctx.beginPath();
      ctx.arc(3, 15, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.weapon === 'occult_talisman') {
      // Fanned paper talismans with accent-inked seal glyphs
      ctx.save();
      ctx.translate(4, 25);
      ctx.rotate(isAction ? -0.4 : 0.15);
      for (var ti = -1; ti <= 1; ti++) {
        ctx.save();
        ctx.rotate(ti * 0.32);
        drawRoundedRect(ctx, -3.2, -22, 6.4, 20, 1);
        strokeOutlinedPath(ctx, '#e9dcc0', '#070a10', 1.4);
        ctx.fillStyle = p.accent;
        ctx.fillRect(-1.4, -19, 2.8, 3.2);
        ctx.fillRect(-0.7, -14.5, 1.4, 9);
        ctx.restore();
      }
      ctx.restore();
    } else if (p.weapon === 'tactical_baton') {
      // Collapsible tactical baton with accent grip band
      ctx.save();
      ctx.translate(2, 27);
      ctx.rotate(isAction ? -0.55 : 0.5);
      drawRoundedRect(ctx, -2.2, -34, 4.4, 40, 1.8);
      strokeOutlinedPath(ctx, '#2a303a', '#070a10', 1.6);
      ctx.fillStyle = '#5a6474';
      ctx.fillRect(-1, -32, 2, 22);
      ctx.fillStyle = p.accent;
      ctx.fillRect(-2.6, -2, 5.2, 3.2);
      ctx.restore();
    }
    ctx.restore();

    // Channeling halo glow around caster
    if (isChannel) {
      var chGlow = ctx.createRadialGradient(0, -56, 8, 0, -56, 42);
      chGlow.addColorStop(0, 'rgba(255,255,255,0)');
      chGlow.addColorStop(0.6, p.accentSoft);
      chGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = chGlow;
      ctx.beginPath();
      ctx.arc(0, -56, 42, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return c;
  }

  function buildInspectorCanvas(frame) {
    var W = 160;
    var H = 192;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (!ctx) return c;
    ctx.imageSmoothingEnabled = true;

    var f = String(frame || 'idle');
    var isWalk1 = f === 'walk1';
    var isWalk2 = f === 'walk2';
    var isAction = f === 'action';
    var isDash = f === 'dash';
    var isHurt = f === 'hurt';
    var bobY = f === 'idle2' ? -3 : (isWalk1 || isWalk2 ? -4 : (isDash ? 5 : 0));
    var stride = isWalk1 ? 10 : (isWalk2 ? -10 : (isDash ? 14 : 0));

    ctx.save();
    ctx.translate(80 + (isDash ? 10 : (isHurt ? -8 : 0)), 180 + bobY);
    if (isDash) ctx.rotate(0.14);
    else if (isHurt) ctx.rotate(-0.12);

    // Spectral crimson mist shadow under boots
    var mist = ctx.createRadialGradient(0, -4, 10, 0, -4, 54);
    mist.addColorStop(0, 'rgba(255, 28, 52, 0.42)');
    mist.addColorStop(0.6, 'rgba(120, 12, 28, 0.20)');
    mist.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.ellipse(0, -4, 52, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tattered midnight conductor greatcoat rear cloak
    ctx.beginPath();
    ctx.moveTo(-26, -110);
    ctx.quadraticCurveTo(-48, -60, -44, -10);
    ctx.lineTo(-28, -22);
    ctx.lineTo(-14, -8);
    ctx.lineTo(0, -20);
    ctx.lineTo(18, -8);
    ctx.lineTo(36, -18);
    ctx.quadraticCurveTo(42, -62, 26, -110);
    ctx.closePath();
    strokeOutlinedPath(ctx, '#0c101b', '#04060a', 3.0);

    // Tall gaunt legs
    function drawBossLeg(hx, fx, isBack) {
      ctx.beginPath();
      ctx.moveTo(hx - 6, -64);
      ctx.lineTo(fx - 6, -4);
      ctx.lineTo(fx + 8, -4);
      ctx.lineTo(hx + 6, -64);
      ctx.closePath();
      strokeOutlinedPath(ctx, isBack ? '#0a0d15' : '#141926', '#04060a', 2.6);
      // Heavy iron-toed conductor boot
      ctx.beginPath();
      ctx.moveTo(fx - 7, -14);
      ctx.lineTo(fx + 14, -4);
      ctx.lineTo(fx + 13, 2);
      ctx.lineTo(fx - 8, 2);
      ctx.closePath();
      strokeOutlinedPath(ctx, '#0d1018', '#04060a', 2.4);
    }
    drawBossLeg(-9, -11 - stride, true);
    drawBossLeg(9, 11 + stride, false);

    // Towering hunched uniform torso
    var coatGrad = ctx.createLinearGradient(-30, -126, 32, -26);
    coatGrad.addColorStop(0, '#222b40');
    coatGrad.addColorStop(0.5, '#151b2a');
    coatGrad.addColorStop(1, '#090c14');

    ctx.beginPath();
    ctx.moveTo(-28, -118);
    ctx.quadraticCurveTo(0, -130, 28, -118);
    ctx.lineTo(24, -44);
    ctx.lineTo(34, -16);
    ctx.lineTo(8, -28);
    ctx.lineTo(0, -48);
    ctx.lineTo(-10, -24);
    ctx.lineTo(-34, -14);
    ctx.lineTo(-24, -44);
    ctx.closePath();
    strokeOutlinedPath(ctx, coatGrad, '#04060a', 3.0);

    // Double-breasted tarnished brass buttons & crimson sash
    ctx.strokeStyle = '#8a1828';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-20, -114);
    ctx.lineTo(18, -56);
    ctx.stroke();

    for (var b = 0; b < 4; b++) {
      var by = -102 + b * 14;
      ctx.fillStyle = '#c89e52';
      ctx.beginPath();
      ctx.arc(-9, by, 2.8, 0, Math.PI * 2);
      ctx.arc(9, by, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Broad armored epaulettes
    ctx.fillStyle = '#c89e52';
    ctx.fillRect(-31, -122, 16, 6);
    ctx.fillRect(15, -122, 16, 6);

    // --- LEFT ARM: WROUGHT-IRON CRIMSON STORM LANTERN ---
    ctx.save();
    ctx.translate(-26, -110);
    ctx.rotate(isAction ? 0.35 : 0.18);
    drawRoundedRect(ctx, -7, 0, 14, 42, 6);
    strokeOutlinedPath(ctx, '#121724', '#04060a', 2.6);

    // Glowing lantern hanging from left claw
    ctx.translate(-3, 46);
    var lanHalo = ctx.createRadialGradient(0, 12, 4, 0, 12, 34);
    lanHalo.addColorStop(0, 'rgba(255, 86, 108, 0.92)');
    lanHalo.addColorStop(0.45, 'rgba(255, 24, 52, 0.42)');
    lanHalo.addColorStop(1, 'rgba(255, 20, 40, 0)');
    ctx.fillStyle = lanHalo;
    ctx.beginPath();
    ctx.arc(0, 12, 34, 0, Math.PI * 2);
    ctx.fill();

    // Iron lantern cage
    drawRoundedRect(ctx, -10, 0, 20, 24, 4);
    strokeOutlinedPath(ctx, '#ff2a44', '#16141a', 2.8);
    ctx.fillStyle = '#ffd6dc';
    ctx.beginPath();
    ctx.ellipse(0, 12, 4.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#181b24';
    ctx.fillRect(-12, -4, 24, 5);
    ctx.fillRect(-11, 22, 22, 4);
    ctx.restore();

    // --- HEAD: SHADOWED FACE + PEAKED CONDUCTOR CAP + GLOWING CRIMSON EYES ---
    var hy = -138;
    // Shadowed skull/mask
    ctx.beginPath();
    ctx.ellipse(3, hy + 4, 15, 17, 0, 0, Math.PI * 2);
    strokeOutlinedPath(ctx, '#0c0e16', '#040508', 2.6);

    // Glowing crimson slit eyes with subtle bloom
    var eyeGlow = ctx.createRadialGradient(8, hy + 4, 2, 8, hy + 4, 16);
    eyeGlow.addColorStop(0, 'rgba(255, 42, 68, 0.75)');
    eyeGlow.addColorStop(1, 'rgba(255, 20, 40, 0)');
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(8, hy + 4, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff2842';
    ctx.fillRect(-2, hy + 2, 7, 3.2);
    ctx.fillRect(9, hy + 2, 7.5, 3.2);
    ctx.fillStyle = '#fff0f2';
    ctx.fillRect(0.5, hy + 2.8, 3, 1.6);
    ctx.fillRect(11.5, hy + 2.8, 3, 1.6);

    // Tall Peaked Conductor Cap with Gold Emblem
    ctx.beginPath();
    ctx.moveTo(-22, hy - 7);
    ctx.lineTo(-26, hy - 22);
    ctx.quadraticCurveTo(2, hy - 34, 30, hy - 20);
    ctx.lineTo(24, hy - 7);
    ctx.closePath();
    strokeOutlinedPath(ctx, '#1b2234', '#05070c', 2.8);
    // Visor brim
    ctx.beginPath();
    ctx.moveTo(-20, hy - 7);
    ctx.quadraticCurveTo(6, hy - 1, 30, hy - 6);
    ctx.lineTo(25, hy - 11);
    ctx.lineTo(-18, hy - 11);
    ctx.closePath();
    strokeOutlinedPath(ctx, '#090c12', '#040508', 2.2);
    // Brass cap band & "0" badge
    ctx.fillStyle = '#d4a652';
    ctx.fillRect(-19, hy - 13, 41, 4);
    ctx.beginPath();
    ctx.arc(5, hy - 19, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // --- RIGHT ARM: COLOSSAL ARTICULATED TICKET SHEARS ---
    ctx.save();
    ctx.translate(26, -110);
    ctx.rotate(isAction ? -1.15 : (isDash ? -0.82 : -0.25));
    drawRoundedRect(ctx, -7, 0, 14, 44, 6);
    strokeOutlinedPath(ctx, '#182032', '#04060a', 2.6);

    // Colossal metallic shears emerging from right hand
    ctx.translate(2, 42);
    var shearOpen = isAction ? 0.34 : (isDash ? 0.22 : 0.12);

    function drawShearBlade(ang, flip) {
      ctx.save();
      ctx.rotate(ang);
      var sg = ctx.createLinearGradient(0, -10, 48, 0);
      sg.addColorStop(0, '#c2ccd8');
      sg.addColorStop(0.55, '#eef5ff');
      sg.addColorStop(1, '#7e8ba0');
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(52, flip ? -4 : 4);
      ctx.lineTo(42, flip ? -12 : 12);
      ctx.lineTo(-4, flip ? -7 : 7);
      ctx.closePath();
      strokeOutlinedPath(ctx, sg, '#06080d', 2.2);
      // Crimson blood-etched edge glint
      ctx.strokeStyle = '#ff4058';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, flip ? -2 : 2);
      ctx.lineTo(48, flip ? -4 : 4);
      ctx.stroke();
      ctx.restore();
    }
    drawShearBlade(-shearOpen, true);
    drawShearBlade(shearOpen, false);

    // Brass pivot bolt
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    strokeOutlinedPath(ctx, '#d4a652', '#05070b', 2.0);
    ctx.restore();

    ctx.restore();
    return c;
  }

  /* --------------------------------------------------------------------------
   * Volumetric Character Normal Map & Selective Emissive Glow Map Generators
   * Computes pixel-accurate 3D sculpted normals (spherical head, cylindrical
   * torso/coat folds, angled edges + Sobel luminance detail) and selective
   * emissive masks (weapons, eyes, watches, holo-scanners, Boss crimson lantern)
   * so characters react realistically to station lamps, flashlight & skill VFX!
   * -------------------------------------------------------------------------- */
  var charCanvasCache = Object.create(null);

  function charCacheKey(id, frame, weaponStyle) {
    var styleKey = id === 'inspector' ? '' : resolveWeaponStyle(weaponStyle);
    return String(id || 'player') + ':' + String(frame || 'idle') + (styleKey ? ':' + styleKey : '');
  }

  function getCachedCharCanvas(id, frame, weaponStyle) {
    var key = charCacheKey(id, frame, weaponStyle);
    if (!charCanvasCache[key]) {
      charCanvasCache[key] = buildCharCanvas(id, frame, weaponStyle);
    }
    return charCanvasCache[key];
  }

  function buildCharNormalCanvas(id, frame, weaponStyle) {
    var srcCanvas = getCachedCharCanvas(id, frame, weaponStyle);
    var w = srcCanvas.width || 128;
    var h = srcCanvas.height || 128;
    var out = makeCanvas(w, h);
    var srcCtx = srcCanvas.getContext ? srcCanvas.getContext('2d') : null;
    var dstCtx = out.getContext ? out.getContext('2d') : null;
    if (!srcCtx || !dstCtx || typeof srcCtx.getImageData !== 'function') return out;

    var src = srcCtx.getImageData(0, 0, w, h).data;
    var dstImg = dstCtx.createImageData(w, h);
    var dst = dstImg.data;
    var heightField = new Float32Array(w * h);

    // Pass 1: Build smooth volumetric depth profile inside character silhouette
    // Combines horizontal cylindrical body curve + vertical edge-bevel + painted luminance detail
    for (var y = 0; y < h; y++) {
      var minX = w;
      var maxX = -1;
      for (var x = 0; x < w; x++) {
        if (src[(y * w + x) * 4 + 3] > 32) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      if (maxX <= minX) continue;
      var span = Math.max(4, maxX - minX);
      var midX = (minX + maxX) * 0.5;
      var yNorm = y / h;
      // Head region (top ~35%) gets fuller spherical bulge
      var headBoost = yNorm < 0.38 ? 1.25 : 0.92;

      for (var x2 = minX; x2 <= maxX; x2++) {
        var idx = (y * w + x2) * 4;
        var alpha = src[idx + 3] / 255.0;
        if (alpha < 0.12) continue;
        var u = (x2 - midX) / (span * 0.5); // -1..+1 across local body silhouette
        var cyl = Math.sqrt(Math.max(0.0, 1.0 - Math.min(1.0, u * u)));
        var luma = (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255.0;
        // Blend smooth volumetric cylinder/sphere dome with painted shading folds
        heightField[y * w + x2] = (cyl * 0.72 * headBoost + luma * 0.28) * alpha;
      }
    }

    // Pass 2: Extract tangent-space RGB normals via Sobel filter on sculpted heightfield
    var strength = 3.2;
    function readHF(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0.0;
      return heightField[y * w + x];
    }

    for (var py = 0; py < h; py++) {
      for (var px = 0; px < w; px++) {
        var oIdx = (py * w + px) * 4;
        if (src[oIdx + 3] < 20) {
          dst[oIdx] = 128;
          dst[oIdx + 1] = 128;
          dst[oIdx + 2] = 255;
          dst[oIdx + 3] = 255;
          continue;
        }
        var tl = readHF(px - 1, py - 1);
        var t  = readHF(px,     py - 1);
        var tr = readHF(px + 1, py - 1);
        var l  = readHF(px - 1, py);
        var r  = readHF(px + 1, py);
        var bl = readHF(px - 1, py + 1);
        var b  = readHF(px,     py + 1);
        var br = readHF(px + 1, py + 1);

        var dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        var dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

        var nx = -dX * strength;
        var ny =  dY * strength;
        var nz =  1.0;
        var inv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx *= inv;
        ny *= inv;
        nz *= inv;

        dst[oIdx]     = Math.max(0, Math.min(255, Math.round((nx * 0.5 + 0.5) * 255)));
        dst[oIdx + 1] = Math.max(0, Math.min(255, Math.round((ny * 0.5 + 0.5) * 255)));
        dst[oIdx + 2] = Math.max(0, Math.min(255, Math.round((nz * 0.5 + 0.5) * 255)));
        dst[oIdx + 3] = 255;
      }
    }

    dstCtx.putImageData(dstImg, 0, 0);
    return out;
  }

  function buildCharEmissiveCanvas(id, frame, weaponStyle) {
    var srcCanvas = getCachedCharCanvas(id, frame, weaponStyle);
    var w = srcCanvas.width || 128;
    var h = srcCanvas.height || 128;
    var out = makeCanvas(w, h);
    var srcCtx = srcCanvas.getContext ? srcCanvas.getContext('2d') : null;
    var dstCtx = out.getContext ? out.getContext('2d') : null;
    if (!srcCtx || !dstCtx || typeof srcCtx.getImageData !== 'function') return out;

    var src = srcCtx.getImageData(0, 0, w, h).data;
    var dstImg = dstCtx.createImageData(w, h);
    var dst = dstImg.data;
    var isBoss = (id === 'inspector');

    for (var i = 0; i < src.length; i += 4) {
      var a = src[i + 3];
      if (a < 24) {
        dst[i] = 0; dst[i + 1] = 0; dst[i + 2] = 0; dst[i + 3] = 0;
        continue;
      }
      var r = src[i] / 255.0;
      var g = src[i + 1] / 255.0;
      var b = src[i + 2] / 255.0;
      var maxC = Math.max(r, Math.max(g, b));
      var minC = Math.min(r, Math.min(g, b));
      var sat = maxC > 0.001 ? (maxC - minC) / maxC : 0.0;
      var luma = r * 0.299 + g * 0.587 + b * 0.114;

      // Preserve glowing accents (weapons, visors, cyan/amber/crimson eyes, storm lantern) at high emissive,
      // while keeping coats/skin <= 0.05 so scene lighting (cold cyan lamps, flashlight, crimson lantern) sculpts the figure.
      var isGlowAccent = (maxC > 0.72 && sat > 0.42) || (luma > 0.90) || (isBoss && r > 0.75 && g < 0.38);
      var weight = isGlowAccent ? 1.0 : 0.05;

      dst[i]     = Math.min(255, Math.round(src[i] * weight));
      dst[i + 1] = Math.min(255, Math.round(src[i + 1] * weight));
      dst[i + 2] = Math.min(255, Math.round(src[i + 2] * weight));
      dst[i + 3] = a;
    }

    dstCtx.putImageData(dstImg, 0, 0);
    return out;
  }

  /* --------------------------------------------------------------------------
   * 3. HIGH-RES 256x256 PROPS, SIGILS & DEDICATED VFX TEXTURE LIBRARY
   * -------------------------------------------------------------------------- */
  function buildPropCanvas(name) {
    var S = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (!ctx) return c;
    ctx.imageSmoothingEnabled = true;

    var cx = S * 0.5;
    var cy = S * 0.5;

    // --- 256x256 SWEEPING CRESCENT SLASH ENERGY TEXTURE ---
    if (name === 'vfx_slash_crescent') {
      ctx.save();
      // Paint a rich tapered crescent arc occupying the upper-right to lower-right half of UV
      // so UV-mapped rings/arcs or custom slash shaders get razor-sharp fluid motion!
      for (var pass = 0; pass < 3; pass++) {
        var rOuter = 118 - pass * 4;
        var rInner = 64 + pass * 15;
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, -Math.PI * 0.72, Math.PI * 0.72, false);
        ctx.arc(cx - 10, cy, rInner, Math.PI * 0.68, -Math.PI * 0.68, true);
        ctx.closePath();
        var g = ctx.createRadialGradient(cx + 12, cy, rInner * 0.85, cx, cy, rOuter);
        if (pass === 0) {
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
          g.addColorStop(0.88, 'rgba(255,255,255,0.92)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
        } else if (pass === 1) {
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(0.7, 'rgba(255,255,255,0.85)');
          g.addColorStop(0.95, 'rgba(255,255,255,1)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
        } else {
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(0.82, 'rgba(255,255,255,0.95)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
        }
        ctx.fillStyle = g;
        ctx.fill();
      }
      // Fine aerodynamic energy streaks curving inside the crescent
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      for (var st = 0; st < 7; st++) {
        ctx.lineWidth = 1.2 + (st % 3) * 0.9;
        ctx.beginPath();
        ctx.arc(cx - 3, cy, 80 + st * 5.2, -Math.PI * (0.58 - st * 0.03), Math.PI * (0.62 - st * 0.02));
        ctx.stroke();
      }
      ctx.restore();
      return c;
    }

    // --- 256x256 ORGANIC BRANCHING GROUND FISSURE CRACK DECAL ---
    if (name === 'vfx_fissure_crack') {
      var rngF = createRng(8842);
      // Soft glowing magma/energy pit center
      var pit = ctx.createRadialGradient(cx, cy, 4, cx, cy, 108);
      pit.addColorStop(0, 'rgba(255,255,255,0.95)');
      pit.addColorStop(0.24, 'rgba(255,255,255,0.52)');
      pit.addColorStop(0.65, 'rgba(255,255,255,0.14)');
      pit.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = pit;
      ctx.beginPath();
      ctx.arc(cx, cy, 108, 0, Math.PI * 2);
      ctx.fill();

      // 10 jagged branching fracture rays
      var branches = 10;
      for (var bi = 0; bi < branches; bi++) {
        var ang = (bi / branches) * Math.PI * 2 + (rngF() - 0.5) * 0.35;
        var x = cx;
        var y = cy;
        var segs = 6;
        for (var si = 0; si < segs; si++) {
          var step = 14 + rngF() * 10;
          ang += (rngF() - 0.5) * 0.55;
          var nx = x + Math.cos(ang) * step;
          var ny = y + Math.sin(ang) * step;
          var wOuter = Math.max(1.2, (1 - si / segs) * 8.5);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.88 - si * 0.12).toFixed(2) + ')';
          ctx.lineWidth = wOuter;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // Secondary forked crack
          if (si === 2 || si === 3) {
            var fAng = ang + (rngF() > 0.5 ? 0.65 : -0.65);
            ctx.lineWidth = wOuter * 0.45;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(nx + Math.cos(fAng) * 24, ny + Math.sin(fAng) * 24);
            ctx.stroke();
          }
          x = nx;
          y = ny;
        }
      }
      return c;
    }

    // --- 256x256 SOFT RADIAL GLOW ORB ---
    if (name === 'vfx_soft_glow') {
      var sg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 120);
      sg.addColorStop(0, 'rgba(255,255,255,1)');
      sg.addColorStop(0.22, 'rgba(255,255,255,0.78)');
      sg.addColorStop(0.55, 'rgba(255,255,255,0.22)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, S, S);
      return c;
    }

    // --- 256x256 SEAMLESS HEXAGONAL SHIELD / BARRIER PATTERN ---
    if (name === 'vfx_hex_pattern') {
      var r = 24;
      var dx = r * 1.5;
      var dy = r * Math.sqrt(3);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.2;
      for (var row = -1; row < 10; row++) {
        for (var col = -1; col < 10; col++) {
          var hx = col * dx;
          var hy = row * dy + (col % 2 === 0 ? 0 : dy * 0.5);
          ctx.beginPath();
          for (var k = 0; k < 6; k++) {
            var a = (Math.PI / 3) * k;
            var px = hx + Math.cos(a) * (r - 2);
            var py = hy + Math.sin(a) * (r - 2);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          if ((row + col) % 3 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fill();
          }
        }
      }
      return c;
    }

    // --- 256x256 SCROLLING VERTICAL RUNE / ENERGY CURTAIN STRIP ---
    if (name === 'vfx_rune_strip') {
      // Soft vertical glowing bands + mystic geometric glyphs
      for (var col2 = 0; col2 < 4; col2++) {
        var rx = 32 + col2 * 64;
        var band = ctx.createLinearGradient(rx - 18, 0, rx + 18, 0);
        band.addColorStop(0, 'rgba(255,255,255,0)');
        band.addColorStop(0.5, 'rgba(255,255,255,0.22)');
        band.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = band;
        ctx.fillRect(rx - 18, 0, 36, S);

        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 2.6;
        for (var gy = 20; gy < S; gy += 48) {
          ctx.beginPath();
          ctx.arc(rx, gy, 10, 0, Math.PI * 2);
          ctx.moveTo(rx - 14, gy); ctx.lineTo(rx + 14, gy);
          ctx.moveTo(rx, gy - 15); ctx.lineTo(rx, gy + 15);
          ctx.stroke();
          ctx.strokeRect(rx - 7, gy + 20, 14, 14);
        }
      }
      return c;
    }

    // --- 256x256 VOLUMETRIC MIST / SMOKE PUFF ---
    if (name === 'vfx_smoke_puff') {
      var rngSm = createRng(9912);
      for (var sp = 0; sp < 14; sp++) {
        var sa = rngSm() * Math.PI * 2;
        var sd = rngSm() * 42;
        var sr = 42 + rngSm() * 44;
        var sx = cx + Math.cos(sa) * sd;
        var sy = cy + Math.sin(sa) * sd;
        var smg = ctx.createRadialGradient(sx, sy, 2, sx, sy, sr);
        smg.addColorStop(0, 'rgba(255,255,255,0.34)');
        smg.addColorStop(0.6, 'rgba(255,255,255,0.12)');
        smg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = smg;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      return c;
    }

    // --- 256x256 CINEMATIC 8-POINT IMPACT LENS FLARE STAR ---
    if (name === 'vfx_impact_star') {
      var coreG = ctx.createRadialGradient(cx, cy, 2, cx, cy, 118);
      coreG.addColorStop(0, 'rgba(255,255,255,1)');
      coreG.addColorStop(0.2, 'rgba(255,255,255,0.75)');
      coreG.addColorStop(0.55, 'rgba(255,255,255,0.15)');
      coreG.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = coreG;
      ctx.fillRect(0, 0, S, S);

      function spike(ang, len, wid) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(-len, 0);
        ctx.quadraticCurveTo(0, -wid, len, 0);
        ctx.quadraticCurveTo(0, wid, -len, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();
        ctx.restore();
      }
      spike(0, 124, 14);
      spike(Math.PI * 0.5, 124, 14);
      spike(Math.PI * 0.25, 78, 8);
      spike(-Math.PI * 0.25, 78, 8);
      return c;
    }

    // --- 256x256 HIGH-CRAFT ARCANE / TACTICAL FLOOR SIGILS ---
    if (name && name.indexOf('sigil_') === 0) {
      // Soft radial inner aura
      var aura = ctx.createRadialGradient(cx, cy, 12, cx, cy, 122);
      aura.addColorStop(0, 'rgba(255,255,255,0.22)');
      aura.addColorStop(0.7, 'rgba(255,255,255,0.08)');
      aura.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, 122, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';

      // Outer twin precision rings
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(cx, cy, 114, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, 102, 0, Math.PI * 2); ctx.stroke();

      if (name === 'sigil_bagua') {
        // Authentic 8-trigram compass + inner octagon + taiji curves
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
          var a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          var px = cx + Math.cos(a) * 68;
          var py = cy + Math.sin(a) * 68;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();

        for (var t = 0; t < 8; t++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((t / 8) * Math.PI * 2);
          for (var bar = 0; bar < 3; bar++) {
            var yy = -78 - bar * 7.5;
            var broken = ((t >> bar) & 1) === 1;
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            if (broken) {
              ctx.moveTo(-14, yy); ctx.lineTo(-3, yy);
              ctx.moveTo(3, yy); ctx.lineTo(14, yy);
            } else {
              ctx.moveTo(-14, yy); ctx.lineTo(14, yy);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.lineWidth = 3.0;
        ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy - 19, 19, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy + 19, 19, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy - 19, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy + 19, 5, 0, Math.PI * 2); ctx.stroke();
        return c;
      }

      if (name === 'sigil_hex_grid') {
        // High-tech cyber hex matrix + precision degree ticks
        ctx.lineWidth = 3.0;
        for (var rad = 44; rad <= 88; rad += 44) {
          ctx.beginPath();
          for (var h = 0; h < 6; h++) {
            var ha = (h / 6) * Math.PI * 2 - Math.PI / 6;
            var hx = cx + Math.cos(ha) * rad;
            var hy = cy + Math.sin(ha) * rad;
            if (h === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
          }
          ctx.closePath(); ctx.stroke();
        }
        for (var tk = 0; tk < 24; tk++) {
          var ta = (tk / 24) * Math.PI * 2;
          var len = tk % 4 === 0 ? 14 : 6;
          ctx.lineWidth = tk % 4 === 0 ? 3.2 : 1.6;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ta) * 102, cy + Math.sin(ta) * 102);
          ctx.lineTo(cx + Math.cos(ta) * (102 - len), cy + Math.sin(ta) * (102 - len));
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
        return c;
      }

      if (name === 'sigil_occult_eye') {
        // Almond mystic eye + radiating eyelashes + inscribed glyphs
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(cx - 86, cy);
        ctx.quadraticCurveTo(cx, cy - 58, cx + 86, cy);
        ctx.quadraticCurveTo(cx, cy + 58, cx - 86, cy);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, cy, 9, 24, 0, 0, Math.PI * 2); ctx.fill();
        for (var r2 = 0; r2 < 16; r2++) {
          var ra = (r2 / 16) * Math.PI * 2;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ra) * 88, cy + Math.sin(ra) * 88);
          ctx.lineTo(cx + Math.cos(ra) * 108, cy + Math.sin(ra) * 108);
          ctx.stroke();
        }
        return c;
      }

      if (name === 'sigil_arcane_star') {
        // Interlocked sacred hexagram / octagram + inner halo
        ctx.lineWidth = 3.2;
        for (var rot = 0; rot < 2; rot++) {
          ctx.beginPath();
          for (var p3 = 0; p3 < 3; p3++) {
            var pa = (p3 / 3) * Math.PI * 2 - Math.PI * 0.5 + rot * Math.PI;
            var px3 = cx + Math.cos(pa) * 98;
            var py3 = cy + Math.sin(pa) * 98;
            if (p3 === 0) ctx.moveTo(px3, py3); else ctx.lineTo(px3, py3);
          }
          ctx.closePath(); ctx.stroke();
        }
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
        return c;
      }

      if (name === 'sigil_blood_crest') {
        // Gothic crimson thorn-diamond + 8 barbed lance tips
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        for (var b2 = 0; b2 < 8; b2++) {
          var ba = (b2 / 8) * Math.PI * 2;
          var rB = b2 % 2 === 0 ? 104 : 52;
          var bx2 = cx + Math.cos(ba) * rB;
          var by2 = cy + Math.sin(ba) * rB;
          if (b2 === 0) ctx.moveTo(bx2, by2); else ctx.lineTo(bx2, by2);
        }
        ctx.closePath(); ctx.stroke();
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
        return c;
      }

      // Default: sigil_tactical_hud (military rangefinder brackets + crosshairs)
      ctx.lineWidth = 4.0;
      for (var q = 0; q < 4; q++) {
        var qa = q * Math.PI * 0.5 + Math.PI * 0.25;
        ctx.beginPath();
        ctx.arc(cx, cy, 84, qa - 0.32, qa + 0.32);
        ctx.stroke();
      }
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - 108, cy); ctx.lineTo(cx - 42, cy);
      ctx.moveTo(cx + 42, cy); ctx.lineTo(cx + 108, cy);
      ctx.moveTo(cx, cy - 108); ctx.lineTo(cx, cy - 42);
      ctx.moveTo(cx, cy + 42); ctx.lineTo(cx, cy + 108);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
      return c;
    }

    // --- HIGH-RES FLOATING ORBITER & PARTICLE SPRITES ---
    if (name === 'vfx_talisman') {
      drawRoundedRect(ctx, 84, 34, 88, 188, 6);
      strokeOutlinedPath(ctx, '#ffefb8', '#d48d28', 6);
      ctx.strokeStyle = '#d42a38';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(104, 62); ctx.lineTo(152, 62);
      ctx.moveTo(128, 52); ctx.lineTo(128, 198);
      ctx.moveTo(106, 94); ctx.lineTo(150, 118);
      ctx.moveTo(150, 118); ctx.lineTo(104, 152);
      ctx.moveTo(104, 184); ctx.lineTo(152, 184);
      ctx.stroke();
      return c;
    }

    if (name === 'vfx_sword_bit') {
      var glowS = ctx.createRadialGradient(cx, cy - 10, 6, cx, cy - 10, 86);
      glowS.addColorStop(0, 'rgba(255,255,255,0.65)');
      glowS.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glowS;
      ctx.fillRect(0, 0, S, S);

      ctx.beginPath();
      ctx.moveTo(cx, 18);
      ctx.lineTo(cx + 16, 174);
      ctx.lineTo(cx - 16, 174);
      ctx.closePath();
      strokeOutlinedPath(ctx, '#e4fbff', '#1a384a', 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, 30, 8, 140);
      drawRoundedRect(ctx, cx - 34, 172, 68, 14, 4);
      strokeOutlinedPath(ctx, '#f2c96b', '#261b08', 4);
      ctx.fillStyle = '#263448';
      ctx.fillRect(cx - 7, 186, 14, 44);
      return c;
    }

    if (name === 'vfx_heal_cross') {
      var hc = ctx.createRadialGradient(cx, cy, 8, cx, cy, 110);
      hc.addColorStop(0, 'rgba(255,255,255,0.95)');
      hc.addColorStop(0.55, 'rgba(180,255,215,0.45)');
      hc.addColorStop(1, 'rgba(120,255,190,0)');
      ctx.fillStyle = hc;
      ctx.fillRect(0, 0, S, S);
      drawRoundedRect(ctx, cx - 22, 42, 44, 172, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      drawRoundedRect(ctx, 42, cy - 22, 172, 44, 10);
      ctx.fill();
      return c;
    }

    if (name === 'vfx_drone_bit') {
      ctx.beginPath();
      ctx.moveTo(cx, 24);
      ctx.lineTo(232, cy);
      ctx.lineTo(cx, 232);
      ctx.lineTo(24, cy);
      ctx.closePath();
      strokeOutlinedPath(ctx, '#26445c', '#e6fbff', 6);
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      strokeOutlinedPath(ctx, '#8ef8ff', '#ffffff', 5);
      return c;
    }

    // --- HIGH-RES INTERACTABLE PROP TEXTURES (console / clue / exit) ---
    if (name === 'console_off' || name === 'console_on') {
      var isOn = name === 'console_on';
      ctx.fillStyle = '#121822';
      ctx.fillRect(0, 0, S, S);
      // CRT monitor screen artwork
      var scrGrad = ctx.createLinearGradient(0, 0, 0, S);
      scrGrad.addColorStop(0, isOn ? '#124a38' : '#3a2210');
      scrGrad.addColorStop(1, isOn ? '#08241c' : '#1e1008');
      ctx.fillStyle = scrGrad;
      ctx.fillRect(14, 14, S - 28, S - 28);

      // Rail schematic grid lines
      ctx.strokeStyle = isOn ? 'rgba(84, 245, 172, 0.32)' : 'rgba(245, 168, 72, 0.28)';
      ctx.lineWidth = 2;
      for (var g2 = 32; g2 < S - 20; g2 += 28) {
        ctx.beginPath();
        ctx.moveTo(18, g2); ctx.lineTo(S - 18, g2);
        ctx.moveTo(g2, 18); ctx.lineTo(g2, S - 18);
        ctx.stroke();
      }
      // Track switch schematic line
      ctx.strokeStyle = isOn ? '#5cffb4' : '#ffab44';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(32, 180); ctx.lineTo(116, 180); ctx.lineTo(164, 96); ctx.lineTo(224, 96);
      ctx.stroke();
      ctx.strokeStyle = isOn ? '#a6ffd8' : '#ff4d5a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(116, 180); ctx.lineTo(224, 180);
      ctx.stroke();
      // Status indicator bar
      ctx.fillStyle = isOn ? '#5cffb4' : '#ff5260';
      ctx.fillRect(32, 36, 92, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, 40, isOn ? 84 : 32, 10);
      return c;
    }

    if (name === 'clue_glow') {
      var cg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 118);
      cg.addColorStop(0, 'rgba(130, 242, 255, 0.92)');
      cg.addColorStop(0.5, 'rgba(82, 210, 240, 0.32)');
      cg.addColorStop(1, 'rgba(82, 210, 240, 0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, S, S);
      drawRoundedRect(ctx, 64, 42, 128, 172, 12);
      strokeOutlinedPath(ctx, '#f2e8cf', '#28364a', 6);
      ctx.fillStyle = '#c83444';
      ctx.fillRect(82, 62, 62, 16);
      ctx.fillStyle = '#38465a';
      for (var ln = 0; ln < 5; ln++) {
        ctx.fillRect(82, 96 + ln * 20, ln === 4 ? 56 : 92, 8);
      }
      return c;
    }

    if (name === 'exit_gate') {
      var eg = ctx.createLinearGradient(0, 0, 0, S);
      eg.addColorStop(0, '#2a3444');
      eg.addColorStop(1, '#121822');
      ctx.fillStyle = eg;
      ctx.fillRect(16, 16, S - 32, S - 16);
      ctx.fillStyle = '#4af2a1';
      ctx.fillRect(58, 30, S - 116, 26);
      ctx.strokeStyle = '#6fd8ea';
      ctx.lineWidth = 6;
      ctx.strokeRect(24, 24, S - 48, S - 32);
      return c;
    }

    // Generic fallback glowing diamond
    var fg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 90);
    fg.addColorStop(0, 'rgba(140, 240, 255, 0.95)');
    fg.addColorStop(1, 'rgba(111, 216, 234, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  /* --------------------------------------------------------------------------
   * External Tile Hot-Swap Loader (Manifest-Driven, Zero 404 Console Errors)
   * -------------------------------------------------------------------------- */
  var tileEntries = Object.create(null);

  function resolveExternalTileUrl(name) {
    try {
      if (INFINITY.ASSETS && typeof INFINITY.ASSETS.getTileUrl === 'function') {
        var url = INFINITY.ASSETS.getTileUrl(name);
        if (typeof url === 'string' && url.length > 0) return url;
      }
    } catch (_) {}
    return null;
  }

  function applyExternalTile(entry, forceReload) {
    if (!entry || !entry.canvas || !entry.tex) return;
    var url = resolveExternalTileUrl(entry.name);

    if (!url) {
      if (entry.loadedUrl) {
        var fallback = buildTileCanvas(entry.name);
        entry.canvas.width = fallback.width;
        entry.canvas.height = fallback.height;
        var fctx = entry.canvas.getContext('2d');
        fctx.imageSmoothingEnabled = true;
        fctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
        fctx.drawImage(fallback, 0, 0);
        entry.loadedUrl = null;
        if (entry.tex && typeof entry.tex === 'object') {
          entry.tex.needsUpdate = true;
        }
      }
      return;
    }

    if (!forceReload && entry.loadedUrl === url) return;
    if (typeof global.Image !== 'function') return;

    var img = new global.Image();
    if (/^https?:\/\//i.test(url) && global.location && global.location.origin && url.indexOf(global.location.origin) !== 0) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = function () {
      try {
        var nw = img.naturalWidth || img.width || 256;
        var nh = img.naturalHeight || img.height || 256;
        var targetSize = (nw >= 256 && nh >= 256) ? 256 : ((nw >= 128 && nh >= 128) ? 128 : 64);
        if (entry.canvas.width !== targetSize || entry.canvas.height !== targetSize) {
          entry.canvas.width = targetSize;
          entry.canvas.height = targetSize;
        }
        var ctx = entry.canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, 0, 0, targetSize, targetSize);
        entry.loadedUrl = url;
        if (entry.tex && typeof entry.tex === 'object') {
          entry.tex.needsUpdate = true;
        }
      } catch (_) {}
    };
    img.onerror = function () {};
    img.src = url;
  }

  /* --------------------------------------------------------------------------
   * Public API (Cached High-Res LinearFilter THREE.CanvasTexture)
   * -------------------------------------------------------------------------- */
  function getTileTexture(name) {
    var tileName = String(name || 'floor_slate');
    var key = 'tile:' + tileName;
    if (textureCache[key]) return textureCache[key];
    var canvas = buildTileCanvas(tileName);
    var tex = toTexture(canvas, true, { srgb: true, mipmaps: true, anisotropy: 4, nearest: true });
    textureCache[key] = tex;
    var entry = { name: tileName, canvas: canvas, tex: tex, loadedUrl: null };
    tileEntries[tileName] = entry;
    applyExternalTile(entry, false);
    return tex;
  }

  function getTileBumpTexture(name) {
    var tileName = String(name || 'floor_slate');
    var key = 'tileBump:' + tileName;
    if (textureCache[key]) return textureCache[key];
    var canvas = buildTileBumpCanvas(tileName);
    var tex = toTexture(canvas, true, { srgb: false, mipmaps: true, anisotropy: 4, nearest: true });
    textureCache[key] = tex;
    return tex;
  }

  function getTileNormalTexture(name) {
    var tileName = String(name || 'floor_slate');
    var key = 'tileNormal:' + tileName;
    if (textureCache[key]) return textureCache[key];
    var canvas = buildTileNormalCanvas(tileName);
    var tex = toTexture(canvas, true, { srgb: false, mipmaps: true, anisotropy: 4, nearest: true });
    textureCache[key] = tex;
    return tex;
  }

  function getTileRoughnessTexture(name) {
    var tileName = String(name || 'floor_slate');
    var key = 'tileRough:' + tileName;
    if (textureCache[key]) return textureCache[key];
    var canvas = buildTileRoughnessCanvas(tileName);
    var tex = toTexture(canvas, true, { srgb: false, mipmaps: true, anisotropy: 4, nearest: true });
    textureCache[key] = tex;
    return tex;
  }

  function reloadExternalTiles() {
    var names = Object.keys(tileEntries);
    for (var i = 0; i < names.length; i++) {
      applyExternalTile(tileEntries[names[i]], true);
    }
  }

  /* --------------------------------------------------------------------------
   * External Sprite Sheet (4x1 Style-1 WebP) & 2x2 Hades VFX Flipbook Loader
   * Async hot-swap with silent procedural fallback (zero runtime errors if missing)
   * -------------------------------------------------------------------------- */
  var FRAME_TO_SHEET_INDEX = {
    idle: 0,
    idle2: 0,
    channel: 0,
    walk1: 1,
    walk2: 2,
    action: 3,
    dash: 3,
    hurt: 3
  };

  var COMBAT_FRAME_TO_SHEET_INDEX = {
    windup: 0,
    smear: 1,
    cleave: 2,
    parry: 3
  };

  function isCombatPoseFrame(frame) {
    return COMBAT_FRAME_TO_SHEET_INDEX[frame] !== undefined;
  }

  function resolveExternalCombatPoseUrls(cid) {
    try {
      if (INFINITY.ASSETS && typeof INFINITY.ASSETS.getCombatPoseSheetUrls === 'function') {
        return INFINITY.ASSETS.getCombatPoseSheetUrls(cid);
      }
    } catch (_) {}
    return null;
  }

  var charTexRegistries = Object.create(null); // cid -> { albedo:[], normal:[], emissive:[] }
  var charExternalState = Object.create(null); // cid -> { sheetStatus, normalStatus, emissiveStatus, sheetImg, normalImg, emissiveImg }
  var flipbookEntries = Object.create(null);   // name -> { name, canvas, tex, loadedUrl, status }

  // Fixed immutable GPU texture dimensions for WebGL2 texStorage2D compatibility:
  // External WebP hot-swaps draw into these locked canvases without ever mutating width/height.
  var FLIPBOOK_TEX_SIZE = 1024;

  function getFixedCharCanvasSize(cid) {
    if (cid === 'inspector') return { width: 320, height: 384 };
    return { width: 256, height: 256 };
  }

  function shouldUseExternalSprite(cid, weaponStyle) {
    // Until dedicated per-weapon Style-1 heavy-ink sheets are produced, all player weaponStyles
    // (including default-spawn 'tactical', 'sword', 'cyber', 'occult') use Style-1 player_sheet.webp
    // so the player never regresses to legacy chibi procedural sprites next to Lineup-A cast/Boss.
    void cid;
    void weaponStyle;
    return true;
  }

  function cloneCanvasToFixedSize(src, targetW, targetH) {
    var w = Math.max(16, Number(targetW) || (src && src.width) || 256);
    var h = Math.max(16, Number(targetH) || (src && src.height) || 256);
    var c = makeCanvas(w, h);
    var ctx = c.getContext ? c.getContext('2d') : null;
    if (ctx && src && typeof ctx.drawImage === 'function') {
      try {
        ctx.imageSmoothingEnabled = true;
        if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(src, 0, 0, w, h);
      } catch (_) {}
    }
    return c;
  }

  function resolveExternalSpriteUrls(cid) {
    try {
      if (INFINITY.ASSETS && typeof INFINITY.ASSETS.getSpriteSheetUrls === 'function') {
        return INFINITY.ASSETS.getSpriteSheetUrls(cid);
      }
      if (INFINITY.ASSETS && typeof INFINITY.ASSETS.getSpriteUrl === 'function') {
        var s = INFINITY.ASSETS.getSpriteUrl(cid);
        if (s) return { sheet: s, normal: null, emissive: null };
      }
    } catch (_) {}
    return null;
  }

  function resolveExternalFlipbookUrl(name) {
    try {
      if (INFINITY.ASSETS && typeof INFINITY.ASSETS.getVfxFlipbookUrl === 'function') {
        var url = INFINITY.ASSETS.getVfxFlipbookUrl(name);
        if (typeof url === 'string' && url.length > 0) return url;
      }
    } catch (_) {}
    return null;
  }

  function getCharRegistry(cid) {
    if (!charTexRegistries[cid]) {
      charTexRegistries[cid] = { albedo: [], normal: [], emissive: [] };
    }
    return charTexRegistries[cid];
  }

  function getCharExtState(cid) {
    if (!charExternalState[cid]) {
      charExternalState[cid] = {
        sheetStatus: 'idle',
        normalStatus: 'idle',
        emissiveStatus: 'idle',
        sheetImg: null,
        normalImg: null,
        emissiveImg: null
      };
    }
    return charExternalState[cid];
  }

  function applyLinearSpriteFiltering(tex) {
    var THREE = global.THREE;
    if (!tex || !THREE) return;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }

  function sliceSheetImageIntoEntry(img, entry) {
    if (!img || !entry || !entry.canvas) return false;
    var nw = img.naturalWidth || img.width || 0;
    var nh = img.naturalHeight || img.height || 0;
    if (nw < 4 || nh < 4) return false;

    // Never resize entry.canvas after creation (WebGL2 texStorage2D allocates immutable storage)
    var dstW = entry.canvas.width || 256;
    var dstH = entry.canvas.height || 256;
    var frameW = Math.floor(nw / 4);
    var frameH = nh;
    var ctx = entry.canvas.getContext ? entry.canvas.getContext('2d') : null;
    if (!ctx) return false;
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, dstW, dstH);
    var idx = isCombatPoseFrame(entry.frame)
      ? COMBAT_FRAME_TO_SHEET_INDEX[entry.frame]
      : FRAME_TO_SHEET_INDEX[entry.frame];
    if (typeof idx !== 'number') idx = 0;
    ctx.drawImage(img, idx * frameW, 0, frameW, frameH, 0, 0, dstW, dstH);
    applyLinearSpriteFiltering(entry.tex);
    return true;
  }

  function deriveNormalFromAlbedoCanvas(albedoCanvas, targetCanvas) {
    if (!albedoCanvas || !targetCanvas) return false;
    var w = targetCanvas.width || albedoCanvas.width || 256;
    var h = targetCanvas.height || albedoCanvas.height || 256;
    var srcWork = (albedoCanvas.width === w && albedoCanvas.height === h)
      ? albedoCanvas
      : cloneCanvasToFixedSize(albedoCanvas, w, h);
    var srcCtx = srcWork.getContext ? srcWork.getContext('2d') : null;
    if (!srcCtx || typeof srcCtx.getImageData !== 'function') return false;
    var dstCtx = targetCanvas.getContext ? targetCanvas.getContext('2d') : null;
    if (!dstCtx) return false;

    var src = srcCtx.getImageData(0, 0, w, h).data;
    var dstImg = dstCtx.createImageData(w, h);
    var dst = dstImg.data;
    var hf = new Float32Array(w * h);

    for (var y = 0; y < h; y++) {
      var minX = w;
      var maxX = -1;
      for (var x = 0; x < w; x++) {
        if (src[(y * w + x) * 4 + 3] > 28) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      if (maxX <= minX) continue;
      var span = Math.max(4, maxX - minX);
      var midX = (minX + maxX) * 0.5;
      for (var x2 = minX; x2 <= maxX; x2++) {
        var idx = (y * w + x2) * 4;
        var a = src[idx + 3] / 255.0;
        if (a < 0.1) continue;
        var u = (x2 - midX) / (span * 0.5);
        var cyl = Math.sqrt(Math.max(0.0, 1.0 - Math.min(1.0, u * u)));
        var luma = (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255.0;
        hf[y * w + x2] = (cyl * 0.7 + luma * 0.3) * a;
      }
    }

    function readH(px, py) {
      if (px < 0 || py < 0 || px >= w || py >= h) return 0.0;
      return hf[py * w + px];
    }

    for (var py = 0; py < h; py++) {
      for (var px = 0; px < w; px++) {
        var oIdx = (py * w + px) * 4;
        if (src[oIdx + 3] < 20) {
          dst[oIdx] = 128; dst[oIdx + 1] = 128; dst[oIdx + 2] = 255; dst[oIdx + 3] = 255;
          continue;
        }
        var dX = (readH(px + 1, py - 1) + 2.0 * readH(px + 1, py) + readH(px + 1, py + 1)) -
                 (readH(px - 1, py - 1) + 2.0 * readH(px - 1, py) + readH(px - 1, py + 1));
        var dY = (readH(px - 1, py + 1) + 2.0 * readH(px, py + 1) + readH(px + 1, py + 1)) -
                 (readH(px - 1, py - 1) + 2.0 * readH(px, py - 1) + readH(px + 1, py - 1));
        var nx = -dX * 2.8;
        var ny = dY * 2.8;
        var nz = 1.0;
        var inv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        dst[oIdx]     = Math.max(0, Math.min(255, Math.round((nx * inv * 0.5 + 0.5) * 255)));
        dst[oIdx + 1] = Math.max(0, Math.min(255, Math.round((ny * inv * 0.5 + 0.5) * 255)));
        dst[oIdx + 2] = Math.max(0, Math.min(255, Math.round((nz * inv * 0.5 + 0.5) * 255)));
        dst[oIdx + 3] = 255;
      }
    }
    dstCtx.putImageData(dstImg, 0, 0);
    return true;
  }

  function deriveEmissiveFromAlbedoCanvas(albedoCanvas, targetCanvas, isBoss) {
    if (!albedoCanvas || !targetCanvas) return false;
    var w = targetCanvas.width || albedoCanvas.width || 256;
    var h = targetCanvas.height || albedoCanvas.height || 256;
    var srcWork = (albedoCanvas.width === w && albedoCanvas.height === h)
      ? albedoCanvas
      : cloneCanvasToFixedSize(albedoCanvas, w, h);
    var srcCtx = srcWork.getContext ? srcWork.getContext('2d') : null;
    if (!srcCtx || typeof srcCtx.getImageData !== 'function') return false;
    var dstCtx = targetCanvas.getContext ? targetCanvas.getContext('2d') : null;
    if (!dstCtx) return false;

    var src = srcCtx.getImageData(0, 0, w, h).data;
    var dstImg = dstCtx.createImageData(w, h);
    var dst = dstImg.data;
    for (var i = 0; i < src.length; i += 4) {
      var a = src[i + 3];
      if (a < 24) {
        dst[i] = 0; dst[i + 1] = 0; dst[i + 2] = 0; dst[i + 3] = 0;
        continue;
      }
      var r = src[i] / 255.0;
      var g = src[i + 1] / 255.0;
      var b = src[i + 2] / 255.0;
      var maxC = Math.max(r, Math.max(g, b));
      var minC = Math.min(r, Math.min(g, b));
      var sat = maxC > 0.001 ? (maxC - minC) / maxC : 0.0;
      var luma = r * 0.299 + g * 0.587 + b * 0.114;
      var isGlow = (maxC > 0.72 && sat > 0.45) || (luma > 0.92) || (isBoss && r > 0.72 && g < 0.36);
      var wt = isGlow ? 1.0 : 0.04;
      dst[i] = Math.min(255, Math.round(src[i] * wt));
      dst[i + 1] = Math.min(255, Math.round(src[i + 1] * wt));
      dst[i + 2] = Math.min(255, Math.round(src[i + 2] * wt));
      dst[i + 3] = a;
    }
    dstCtx.putImageData(dstImg, 0, 0);
    return true;
  }

  function syncDerivedCharMaps(cid) {
    var st = getCharExtState(cid);
    if (st.sheetStatus !== 'loaded' || !st.sheetImg) return;
    var reg = getCharRegistry(cid);
    var isBoss = (cid === 'inspector');

    if (st.normalStatus === 'error') {
      for (var ni = 0; ni < reg.normal.length; ni++) {
        var nEnt = reg.normal[ni];
        var tmpN = makeCanvas(nEnt.canvas.width || 256, nEnt.canvas.height || 256);
        if (sliceSheetImageIntoEntry(st.sheetImg, { canvas: tmpN, tex: null, frame: nEnt.frame })) {
          if (deriveNormalFromAlbedoCanvas(tmpN, nEnt.canvas)) {
            applyLinearSpriteFiltering(nEnt.tex);
          }
        }
      }
    }
    if (st.emissiveStatus === 'error') {
      for (var ei = 0; ei < reg.emissive.length; ei++) {
        var eEnt = reg.emissive[ei];
        var tmpE = makeCanvas(eEnt.canvas.width || 256, eEnt.canvas.height || 256);
        if (sliceSheetImageIntoEntry(st.sheetImg, { canvas: tmpE, tex: null, frame: eEnt.frame })) {
          if (deriveEmissiveFromAlbedoCanvas(tmpE, eEnt.canvas, isBoss)) {
            applyLinearSpriteFiltering(eEnt.tex);
          }
        }
      }
    }
  }

  function loadExternalCharChannel(cid, kind, url, forceReload) {
    if (!url || typeof global.Image !== 'function') return;
    var st = getCharExtState(cid);
    var statusKey = kind === 'albedo' ? 'sheetStatus' : (kind === 'normal' ? 'normalStatus' : 'emissiveStatus');
    var imgKey = kind === 'albedo' ? 'sheetImg' : (kind === 'normal' ? 'normalImg' : 'emissiveImg');

    if (!forceReload && (st[statusKey] === 'loading' || st[statusKey] === 'loaded' || st[statusKey] === 'error')) {
      return;
    }
    st[statusKey] = 'loading';

    var img = new global.Image();
    if (/^https?:\/\//i.test(url) && global.location && global.location.origin && url.indexOf(global.location.origin) !== 0) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = function () {
      try {
        st[imgKey] = img;
        st[statusKey] = 'loaded';
        var reg = getCharRegistry(cid);
        var list = reg[kind] || [];
        for (var i = 0; i < list.length; i++) {
          sliceSheetImageIntoEntry(img, list[i]);
        }
        if (kind === 'albedo') {
          syncDerivedCharMaps(cid);
        }
      } catch (_) {}
    };
    img.onerror = function () {
      st[statusKey] = 'error';
      if (kind !== 'albedo' && st.sheetStatus === 'loaded') {
        try { syncDerivedCharMaps(cid); } catch (_) {}
      }
    };
    img.src = url;
  }

  function triggerExternalSpriteLoad(cid, forceReload) {
    var isCombatKey = typeof cid === 'string' && cid.slice(-7) === ':combat';
    var urls = isCombatKey
      ? resolveExternalCombatPoseUrls(cid.slice(0, -7))
      : resolveExternalSpriteUrls(cid);
    if (!urls) return;
    if (urls.sheet) loadExternalCharChannel(cid, 'albedo', urls.sheet, forceReload);
    if (urls.normal) loadExternalCharChannel(cid, 'normal', urls.normal, forceReload);
    if (urls.emissive) loadExternalCharChannel(cid, 'emissive', urls.emissive, forceReload);
  }

  function reloadExternalSprites() {
    var ids = Object.keys(charTexRegistries);
    for (var i = 0; i < ids.length; i++) {
      triggerExternalSpriteLoad(ids[i], true);
    }
  }

  /* --------------------------------------------------------------------------
   * Procedural 2x2 Hades Hard-Edge VFX Flipbook Fallback (512x512, black bg)
   * Provides 4 distinct stepped animation frames immediately before/without WebP.
   * -------------------------------------------------------------------------- */
  function buildFlipbookCanvas(name) {
    var S = 512;
    var F = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext ? c.getContext('2d') : null;
    if (!ctx) return c;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, S, S);
    ctx.imageSmoothingEnabled = true;

    var key = String(name || 'hades_cyan').toLowerCase();
    var palettes = {
      hades_cyan:         { pri: '#5ce8ff', sec: '#f6d57a', core: '#ffffff', smoke: '#142636' },
      hades_flame:        { pri: '#ff8424', sec: '#c852ff', core: '#fff8dc', smoke: '#2a1228' },
      hades_emp:          { pri: '#48c6ff', sec: '#9aa4ff', core: '#f0ffff', smoke: '#121d38' },
      hades_tao_ground:   { pri: '#f5cf64', sec: '#fff0b2', core: '#ffffff', smoke: '#261e10' },
      hades_occult_chain: { pri: '#c852ff', sec: '#f5cf64', core: '#f6e8ff', smoke: '#20102c' },
      hades_heal_aegis:   { pri: '#46e88a', sec: '#5ce8ff', core: '#eafff2', smoke: '#102820' }
    };
    var pal = palettes[key] || palettes.hades_cyan;
    var rng = createRng(key.length * 1337 + 91);

    for (var frame = 0; frame < 4; frame++) {
      var col = frame % 2;
      var row = Math.floor(frame / 2);
      var ox = col * F;
      var oy = row * F;
      var cx = ox + F * 0.5;
      var cy = oy + F * 0.5;
      var p = frame / 3;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, F, F);
      ctx.clip();

      // Subtle smoke/ink aura halo behind hard-edge cel bands
      var smR = 54 + p * 52;
      var smGrad = ctx.createRadialGradient(cx, cy, smR * 0.25, cx, cy, smR);
      smGrad.addColorStop(0, pal.smoke);
      smGrad.addColorStop(0.7, 'rgba(18, 22, 32, 0.35)');
      smGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = smGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, smR, 0, Math.PI * 2);
      ctx.fill();

      if (key === 'hades_cyan' || key === 'hades_flame') {
        // Hard-edge stepped crescent cleave expanding across frames 0..3
        var startA = -Math.PI * (0.68 - p * 0.14);
        var endA = Math.PI * (0.35 + p * 0.38);
        var rOut = 72 + p * 42;
        var rMid = rOut - (34 - p * 14);
        var rIn = Math.max(22, rOut - (52 - p * 18));

        // Outer cel band (secondary)
        ctx.fillStyle = pal.sec;
        ctx.beginPath();
        ctx.arc(cx, cy, rOut, startA, endA, false);
        ctx.arc(cx - 10, cy, rIn, endA, startA, true);
        ctx.closePath();
        ctx.fill();

        // Main cel band (primary)
        ctx.fillStyle = pal.pri;
        ctx.beginPath();
        ctx.arc(cx, cy, rOut - 4, startA + 0.08, endA - 0.04, false);
        ctx.arc(cx - 6, cy, rMid, endA - 0.04, startA + 0.08, true);
        ctx.closePath();
        ctx.fill();

        // Razor white core leading edge
        ctx.strokeStyle = pal.core;
        ctx.lineWidth = Math.max(2.5, 9 - p * 5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, rOut - 6, startA + 0.16, endA - 0.06, false);
        ctx.stroke();

        // Hard-edge diamond sparks flying outward
        for (var sp = 0; sp < 8; sp++) {
          var sa = startA + (endA - startA) * ((sp + 0.5) / 8);
          var sr = rOut + 6 + p * 16 + (rng() * 14);
          var sx = cx + Math.cos(sa) * sr;
          var sy = cy + Math.sin(sa) * sr;
          var ds = (1.1 - p * 0.55) * (5 + (sp % 3) * 2.5);
          ctx.fillStyle = sp % 2 === 0 ? pal.core : pal.pri;
          ctx.beginPath();
          ctx.moveTo(sx, sy - ds);
          ctx.lineTo(sx + ds * 0.6, sy);
          ctx.lineTo(sx, sy + ds);
          ctx.lineTo(sx - ds * 0.6, sy);
          ctx.closePath();
          ctx.fill();
        }
      } else if (key === 'hades_emp') {
        // Hard-edge jagged shockwave ring + branching electric bolts
        var empR = 38 + p * 74;
        ctx.strokeStyle = pal.pri;
        ctx.lineWidth = Math.max(3, 12 - p * 6);
        ctx.beginPath();
        ctx.arc(cx, cy, empR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = pal.core;
        ctx.lineWidth = Math.max(2, 5 - p * 2.5);
        ctx.beginPath();
        ctx.arc(cx, cy, empR, 0, Math.PI * 2);
        ctx.stroke();
        for (var b = 0; b < 6; b++) {
          var ba = (b / 6) * Math.PI * 2 + frame * 0.4;
          ctx.strokeStyle = b % 2 === 0 ? pal.core : pal.sec;
          ctx.lineWidth = 3.2 - p * 1.4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(ba + 0.18) * (empR * 0.55), cy + Math.sin(ba + 0.18) * (empR * 0.55));
          ctx.lineTo(cx + Math.cos(ba - 0.12) * (empR * 1.05), cy + Math.sin(ba - 0.12) * (empR * 1.05));
          ctx.stroke();
        }
      } else if (key === 'hades_tao_ground') {
        // Ground-flattened octagonal Tao sigil + crack flares
        var taoR = 52 + p * 56;
        ctx.strokeStyle = pal.pri;
        ctx.lineWidth = Math.max(3, 10 - p * 4);
        ctx.beginPath();
        for (var o = 0; o < 8; o++) {
          var oa = (o / 8) * Math.PI * 2 + frame * 0.18;
          var px = cx + Math.cos(oa) * taoR;
          var py = cy + Math.sin(oa) * taoR;
          if (o === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = pal.core;
        ctx.lineWidth = Math.max(2, 5 - p * 2);
        ctx.beginPath();
        ctx.arc(cx, cy, taoR * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        for (var r2 = 0; r2 < 8; r2++) {
          var ra2 = (r2 / 8) * Math.PI * 2 + frame * 0.18;
          ctx.strokeStyle = r2 % 2 === 0 ? pal.sec : pal.pri;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ra2) * (taoR * 0.62), cy + Math.sin(ra2) * (taoR * 0.62));
          ctx.lineTo(cx + Math.cos(ra2) * (taoR * 1.12), cy + Math.sin(ra2) * (taoR * 1.12));
          ctx.stroke();
        }
      } else if (key === 'hades_occult_chain') {
        // Crossed diagonal occult binding chains + seal flash
        var chR = 46 + p * 60;
        ctx.strokeStyle = pal.pri;
        ctx.lineWidth = Math.max(4, 11 - p * 4);
        ctx.beginPath();
        ctx.moveTo(cx - chR, cy - chR * 0.72); ctx.lineTo(cx + chR, cy + chR * 0.72);
        ctx.moveTo(cx + chR, cy - chR * 0.72); ctx.lineTo(cx - chR, cy + chR * 0.72);
        ctx.stroke();
        ctx.strokeStyle = pal.sec;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, chR * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = pal.core;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(6, 22 - p * 12), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // hades_heal_aegis: layered sanctuary lotus/hex ring + rising cross motes
        var hR = 44 + p * 64;
        ctx.strokeStyle = pal.pri;
        ctx.lineWidth = Math.max(3, 11 - p * 5);
        ctx.beginPath();
        ctx.arc(cx, cy, hR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = pal.sec;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, hR * 0.68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = pal.core;
        var cw = Math.max(4, 12 - p * 6);
        var cl = 26 + p * 18;
        ctx.fillRect(cx - cw * 0.5, cy - cl * 0.5, cw, cl);
        ctx.fillRect(cx - cl * 0.5, cy - cw * 0.5, cl, cw);
      }

      ctx.restore();
    }
    return c;
  }

  function applyExternalFlipbook(entry, forceReload) {
    if (!entry || !entry.canvas) return;
    var url = resolveExternalFlipbookUrl(entry.name);
    if (!url) return;
    if (!forceReload && (entry.status === 'loading' || entry.status === 'loaded' || entry.status === 'error')) {
      return;
    }
    if (typeof global.Image !== 'function') return;

    entry.status = 'loading';
    var img = new global.Image();
    if (/^https?:\/\//i.test(url) && global.location && global.location.origin && url.indexOf(global.location.origin) !== 0) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = function () {
      try {
        // Never resize entry.canvas after creation (WebGL2 texStorage2D immutable storage)
        var dstW = entry.canvas.width || FLIPBOOK_TEX_SIZE;
        var dstH = entry.canvas.height || FLIPBOOK_TEX_SIZE;
        var ctx = entry.canvas.getContext ? entry.canvas.getContext('2d') : null;
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, dstW, dstH);
        ctx.drawImage(img, 0, 0, dstW, dstH);
        entry.loadedUrl = url;
        entry.status = 'loaded';
        applyLinearSpriteFiltering(entry.tex);
      } catch (_) {}
    };
    img.onerror = function () {
      entry.status = 'error';
    };
    img.src = url;
  }

  function getVfxFlipbookTexture(name) {
    var fbName = String(name || 'hades_cyan').trim().toLowerCase();
    var key = 'flipbook:' + fbName;
    if (textureCache[key]) return textureCache[key];
    var fallbackCanvas = buildFlipbookCanvas(fbName);
    var canvas = cloneCanvasToFixedSize(fallbackCanvas, FLIPBOOK_TEX_SIZE, FLIPBOOK_TEX_SIZE);
    var tex = toTexture(canvas, false, { srgb: true, mipmaps: false, anisotropy: 4, nearest: false });
    textureCache[key] = tex;
    var entry = { name: fbName, canvas: canvas, tex: tex, loadedUrl: null, status: 'idle' };
    flipbookEntries[fbName] = entry;
    applyExternalFlipbook(entry, false);
    return tex;
  }

  function reloadExternalVfx() {
    var names = Object.keys(flipbookEntries);
    for (var i = 0; i < names.length; i++) {
      applyExternalFlipbook(flipbookEntries[names[i]], true);
    }
  }

  var VALID_CHAR_FRAMES = {
    idle: true,
    idle2: true,
    walk1: true,
    walk2: true,
    action: true,
    dash: true,
    channel: true,
    hurt: true,
    windup: true,
    smear: true,
    cleave: true,
    parry: true
  };

  function normalizeCharFrame(frame) {
    var cframe = String(frame || 'idle');
    return VALID_CHAR_FRAMES[cframe] ? cframe : 'idle';
  }

  function resolveCharExtChannelId(cid, cframe) {
    if (isCombatPoseFrame(cframe) && resolveExternalCombatPoseUrls(cid)) {
      return cid + ':combat';
    }
    return cid;
  }

  function fallbackFrameForProcedural(cframe) {
    if (cframe === 'windup') return 'channel';
    if (cframe === 'smear') return 'dash';
    if (cframe === 'cleave' || cframe === 'parry') return 'action';
    return cframe;
  }

  // Optional 3rd arg weaponStyle ('sword' | 'cyber' | 'occult' | 'tactical'); 2-arg calls unchanged.
  // Locks GPU CanvasTexture size upfront (256x256 cast, 320x384 inspector) for WebGL2 texStorage2D safety.
  // All player weaponStyles prefer Style-1 external player_sheet.webp when available, falling back to procedural.
  function getCharTexture(id, frame, weaponStyle) {
    var cid = String(id || 'player');
    var cframe = normalizeCharFrame(frame);
    var key = 'char:' + charCacheKey(cid, cframe, weaponStyle);
    if (textureCache[key]) return textureCache[key];
    var fixed = getFixedCharCanvasSize(cid);
    var canvas = cloneCanvasToFixedSize(getCachedCharCanvas(cid, fallbackFrameForProcedural(cframe), weaponStyle), fixed.width, fixed.height);
    var tex = toTexture(canvas, false, { srgb: true, mipmaps: false, anisotropy: 4, nearest: false });
    textureCache[key] = tex;

    if (shouldUseExternalSprite(cid, weaponStyle)) {
      var extId = resolveCharExtChannelId(cid, cframe);
      var entry = { frame: cframe, canvas: canvas, tex: tex };
      getCharRegistry(extId).albedo.push(entry);
      var st = getCharExtState(extId);
      if (st.sheetStatus === 'loaded' && st.sheetImg) {
        sliceSheetImageIntoEntry(st.sheetImg, entry);
      } else {
        triggerExternalSpriteLoad(extId, false);
      }
    }
    return tex;
  }

  function getCharNormalTexture(id, frame, weaponStyle) {
    var cid = String(id || 'player');
    var cframe = normalizeCharFrame(frame);
    var key = 'charNormal:' + charCacheKey(cid, cframe, weaponStyle);
    if (textureCache[key]) return textureCache[key];
    var fixed = getFixedCharCanvasSize(cid);
    var canvas = cloneCanvasToFixedSize(buildCharNormalCanvas(cid, fallbackFrameForProcedural(cframe), weaponStyle), fixed.width, fixed.height);
    var tex = toTexture(canvas, false, { srgb: false, mipmaps: false, anisotropy: 4, nearest: false });
    textureCache[key] = tex;

    if (shouldUseExternalSprite(cid, weaponStyle)) {
      var extId = resolveCharExtChannelId(cid, cframe);
      var entry = { frame: cframe, canvas: canvas, tex: tex };
      getCharRegistry(extId).normal.push(entry);
      var st = getCharExtState(extId);
      if (st.normalStatus === 'loaded' && st.normalImg) {
        sliceSheetImageIntoEntry(st.normalImg, entry);
      } else if (st.sheetStatus === 'loaded' && st.normalStatus === 'error') {
        syncDerivedCharMaps(extId);
      } else {
        triggerExternalSpriteLoad(extId, false);
      }
    }
    return tex;
  }

  function getCharEmissiveTexture(id, frame, weaponStyle) {
    var cid = String(id || 'player');
    var cframe = normalizeCharFrame(frame);
    var key = 'charEmissive:' + charCacheKey(cid, cframe, weaponStyle);
    if (textureCache[key]) return textureCache[key];
    var fixed = getFixedCharCanvasSize(cid);
    var canvas = cloneCanvasToFixedSize(buildCharEmissiveCanvas(cid, fallbackFrameForProcedural(cframe), weaponStyle), fixed.width, fixed.height);
    var tex = toTexture(canvas, false, { srgb: true, mipmaps: false, anisotropy: 4, nearest: false });
    textureCache[key] = tex;

    if (shouldUseExternalSprite(cid, weaponStyle)) {
      var extId = resolveCharExtChannelId(cid, cframe);
      var entry = { frame: cframe, canvas: canvas, tex: tex };
      getCharRegistry(extId).emissive.push(entry);
      var st = getCharExtState(extId);
      if (st.emissiveStatus === 'loaded' && st.emissiveImg) {
        sliceSheetImageIntoEntry(st.emissiveImg, entry);
      } else if (st.sheetStatus === 'loaded' && st.emissiveStatus === 'error') {
        syncDerivedCharMaps(extId);
      } else {
        triggerExternalSpriteLoad(extId, false);
      }
    }
    return tex;
  }

  function getPropTexture(name) {
    var propName = String(name || 'clue_glow');
    var key = 'prop:' + propName;
    if (textureCache[key]) return textureCache[key];
    var canvas = buildPropCanvas(propName);
    var isRepeat = (propName === 'vfx_hex_pattern' || propName === 'vfx_rune_strip');
    var tex = toTexture(canvas, isRepeat, { srgb: false, mipmaps: true, anisotropy: 4 });
    textureCache[key] = tex;
    return tex;
  }

  function getSpriteDimensions(id) {
    if (id === 'inspector') return { width: 160, height: 192 };
    return { width: 128, height: 128 };
  }

  INFINITY.PixelSprites = {
    getTileTexture: getTileTexture,
    getTileBumpTexture: getTileBumpTexture,
    getTileNormalTexture: getTileNormalTexture,
    getTileRoughnessTexture: getTileRoughnessTexture,
    reloadExternalTiles: reloadExternalTiles,
    reloadExternalSprites: reloadExternalSprites,
    reloadExternalVfx: reloadExternalVfx,
    getCharTexture: getCharTexture,
    getCharNormalTexture: getCharNormalTexture,
    getCharEmissiveTexture: getCharEmissiveTexture,
    getVfxFlipbookTexture: getVfxFlipbookTexture,
    getPropTexture: getPropTexture,
    getSpriteDimensions: getSpriteDimensions,
    WEAPON_BY_STYLE: WEAPON_BY_STYLE,
    // Expose pure builders for deterministic unit tests
    _buildTileCanvas: buildTileCanvas,
    _buildTileBumpCanvas: buildTileBumpCanvas,
    _buildTileNormalCanvas: buildTileNormalCanvas,
    _buildTileRoughnessCanvas: buildTileRoughnessCanvas,
    _buildCharCanvas: buildCharCanvas,
    _buildCharNormalCanvas: buildCharNormalCanvas,
    _buildCharEmissiveCanvas: buildCharEmissiveCanvas,
    _buildFlipbookCanvas: buildFlipbookCanvas,
    _buildPropCanvas: buildPropCanvas
  };
})(typeof window !== 'undefined' ? window : globalThis);
