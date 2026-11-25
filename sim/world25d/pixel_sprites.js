/* ============================================================================
 * Infinity 2.5D HD-2D Engine — Procedural Pixel-Neon Sprite & Tile Atlas
 * Inspired by Signalis & Hyper Light Drifter (NearestFilter crisp pixels)
 * Attaches cleanly to window.INFINITY.PixelSprites
 * ============================================================================ */
(function (global) {
  'use strict';
  var INFINITY = (global.INFINITY = global.INFINITY || {});

  var textureCache = Object.create(null);

  /* --------------------------------------------------------------------------
   * Low-Level Crisp Pixel Canvas Builder
   * -------------------------------------------------------------------------- */
  function createPixelCanvas(w, h) {
    var canvas = global.document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    function px(x, y, color) {
      x = x | 0;
      y = y | 0;
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }

    function rect(x, y, rw, rh, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x | 0, y | 0, rw | 0, rh | 0);
    }

    function line(x0, y0, x1, y1, color) {
      x0 |= 0;
      y0 |= 0;
      x1 |= 0;
      y1 |= 0;
      var dx = Math.abs(x1 - x0);
      var dy = Math.abs(y1 - y0);
      var sx = x0 < x1 ? 1 : -1;
      var sy = y0 < y1 ? 1 : -1;
      var err = dx - dy;
      ctx.fillStyle = color;
      while (true) {
        if (x0 >= 0 && x0 < w && y0 >= 0 && y0 < h) {
          ctx.fillRect(x0, y0, 1, 1);
        }
        if (x0 === x1 && y0 === y1) break;
        var e2 = err << 1;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
    }

    function circle(cx, cy, r, color, filled) {
      ctx.fillStyle = color;
      var r2 = r * r;
      var inner2 = (r - 1.1) * (r - 1.1);
      for (var y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          var dx = x - cx;
          var dy = y - cy;
          var d2 = dx * dx + dy * dy;
          if (filled ? d2 <= r2 : d2 <= r2 && d2 >= inner2) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    /* Auto 1px dark silhouette outline around opaque pixels for HD-2D readability */
    function outline(color) {
      var img = ctx.getImageData(0, 0, w, h);
      var data = img.data;
      var toDraw = [];
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var idx = (y * w + x) * 4;
          if (data[idx + 3] > 20) continue;
          var touch = false;
          if (x > 0 && data[idx - 4 + 3] > 180) touch = true;
          else if (x < w - 1 && data[idx + 4 + 3] > 180) touch = true;
          else if (y > 0 && data[idx - w * 4 + 3] > 180) touch = true;
          else if (y < h - 1 && data[idx + w * 4 + 3] > 180) touch = true;
          if (touch) toDraw.push(x, y);
        }
      }
      ctx.fillStyle = color || '#07090f';
      for (var i = 0; i < toDraw.length; i += 2) {
        ctx.fillRect(toDraw[i], toDraw[i + 1], 1, 1);
      }
    }

    function hash(x, y, seed) {
      var n = (x * 374761393 + y * 668265263 + (seed || 17) * 1442695041) | 0;
      n = (n ^ (n >> 13)) * 1274126177;
      return ((n ^ (n >> 16)) >>> 0) / 4294967296;
    }

    return {
      canvas: canvas,
      ctx: ctx,
      w: w,
      h: h,
      px: px,
      rect: rect,
      line: line,
      circle: circle,
      outline: outline,
      hash: hash
    };
  }

  function toTexture(canvas, wrapRepeat) {
    var THREE = global.THREE;
    if (!THREE) return canvas;
    var tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (wrapRepeat) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    } else {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    }
    tex.needsUpdate = true;
    return tex;
  }

  /* --------------------------------------------------------------------------
   * 1. Tile Textures (32x32 Seamless Pixel-Neon Architecture)
   * -------------------------------------------------------------------------- */
  function buildTileCanvas(name) {
    var g = createPixelCanvas(32, 32);
    var x, y, r;

    if (name === 'floor_slate') {
      // Wet dark subway slate tiles with recessed grout & cold cyan puddle glints
      g.rect(0, 0, 32, 32, '#131924');
      for (y = 0; y < 32; y++) {
        for (x = 0; x < 32; x++) {
          var isGrout = (x === 0 || x === 16 || y === 0 || y === 16);
          if (isGrout) {
            g.px(x, y, '#080b11');
            continue;
          }
          var tileId = ((x > 16 ? 1 : 0) + (y > 16 ? 2 : 0));
          var hVal = g.hash(x, y, 11 + tileId);
          var base = tileId % 2 === 0 ? '#151c28' : '#182130';
          if (hVal < 0.14) base = '#10151f';
          else if (hVal > 0.86) base = '#1f2a3c';
          g.px(x, y, base);
          // Subtle top-left bevel catch-light on each 16x16 slab
          if (x === 1 || x === 17 || y === 1 || y === 17) {
            if (hVal > 0.35) g.px(x, y, '#233044');
          }
        }
      }
      // Wet glossy puddle patch spanning lower-right slab
      g.rect(19, 19, 9, 6, '#172838');
      g.rect(20, 18, 6, 8, '#1b3145');
      g.rect(21, 20, 5, 4, '#24455d');
      g.px(22, 20, '#4d8ca8');
      g.px(23, 20, '#6fd8ea');
      g.px(25, 22, '#3c6e87');
      // Secondary micro puddle upper-left
      g.rect(5, 6, 5, 3, '#1a2e40');
      g.px(6, 7, '#3c6d87');
      g.px(7, 7, '#58a3bc');
      // Hairline fracture on slab
      g.line(4, 22, 10, 26, '#0b0e16');
      g.px(7, 24, '#243144');
      return g.canvas;
    }

    if (name === 'floor_platform') {
      // Dark concrete station platform with expansion seams & tactile grit
      g.rect(0, 0, 32, 32, '#1d222b');
      for (y = 0; y < 32; y++) {
        for (x = 0; x < 32; x++) {
          var n = g.hash(x, y, 31);
          if (n < 0.18) g.px(x, y, '#171b23');
          else if (n > 0.84) g.px(x, y, '#272e3b');
          else if (n > 0.94) g.px(x, y, '#323b4b');
        }
      }
      // Concrete slab expansion joints
      g.rect(0, 15, 32, 1, '#0e1118');
      g.rect(0, 16, 32, 1, '#2a3240');
      g.rect(15, 0, 1, 32, '#11151d');
      // Subtle oil / damp stain
      g.rect(6, 5, 6, 4, '#151922');
      g.rect(22, 21, 5, 5, '#151a23');
      // Tactile raised concrete studs along right third
      for (y = 3; y < 31; y += 4) {
        g.rect(27, y, 2, 2, '#2d3645');
        g.px(27, y, '#3d485c');
      }
      return g.canvas;
    }

    if (name === 'floor_hazard') {
      // Yellow-and-black worn diagonal warning strip for Platform 0 edge
      g.rect(0, 0, 32, 32, '#12151c');
      for (y = 0; y < 32; y++) {
        for (x = 0; x < 32; x++) {
          var band = ((x + y) >> 3) & 1;
          var wear = g.hash(x, y, 53);
          if (band === 0) {
            if (wear < 0.12) g.px(x, y, '#222732'); // chipped paint showing concrete
            else if (wear < 0.28) g.px(x, y, '#a4791b');
            else if (wear > 0.84) g.px(x, y, '#f4cf58');
            else g.px(x, y, '#d8a72b');
          } else {
            if (wear < 0.15) g.px(x, y, '#0a0c11');
            else if (wear > 0.85) g.px(x, y, '#222733');
            else g.px(x, y, '#141820');
          }
        }
      }
      // Crisp crimson-grime edge border on rail side (right edge) & platform border (left)
      g.rect(0, 0, 2, 32, '#0b0e14');
      g.rect(30, 0, 2, 32, '#0b0e14');
      g.rect(29, 0, 1, 32, '#692026');
      return g.canvas;
    }

    if (name === 'floor_rail') {
      // Recessed dark gravel ballast, sleepers & twin steel tracks
      g.rect(0, 0, 32, 32, '#0a0c12');
      for (y = 0; y < 32; y++) {
        for (x = 0; x < 32; x++) {
          var v = g.hash(x, y, 71);
          if (v < 0.25) g.px(x, y, '#07080d');
          else if (v < 0.55) g.px(x, y, '#11141d');
          else if (v < 0.82) g.px(x, y, '#181c27');
          else g.px(x, y, '#222836');
        }
      }
      // Horizontal railway sleepers (ties)
      var sleepers = [2, 10, 18, 26];
      for (var s = 0; s < sleepers.length; s++) {
        var sy = sleepers[s];
        g.rect(2, sy, 28, 4, '#1b1718');
        g.rect(2, sy, 28, 1, '#2c2526');
        g.rect(2, sy + 3, 28, 1, '#0d0b0e');
        // Rusted rail spikes
        g.px(6, sy + 1, '#6b3324');
        g.px(11, sy + 1, '#6b3324');
        g.px(20, sy + 1, '#6b3324');
        g.px(25, sy + 1, '#6b3324');
      }
      // Twin vertical steel rails with bright specular top gleam
      var rails = [7, 22];
      for (r = 0; r < rails.length; r++) {
        var rx = rails[r];
        g.rect(rx - 1, 0, 1, 32, '#07080d');
        g.rect(rx, 0, 3, 32, '#4a5568');
        g.rect(rx + 1, 0, 1, 32, '#8fa1ba');
        g.rect(rx + 3, 0, 1, 32, '#090b10');
        // Occasional crisp glint along rail top
        for (y = 1; y < 32; y += 7) {
          g.px(rx + 1, y, '#d2e2f5');
        }
      }
      return g.canvas;
    }

    if (name === 'wall_concrete' || name === 'wall_neon') {
      // Gritty dark subway concrete wall with baseboard & vertical damp streaks
      g.rect(0, 0, 32, 32, '#1c222e');
      for (y = 0; y < 32; y++) {
        for (x = 0; x < 32; x++) {
          var nv = g.hash(x, y, 97);
          var c = '#1c222e';
          if (y < 3) c = '#12161f';
          else if (nv < 0.16) c = '#151a24';
          else if (nv > 0.85) c = '#252d3c';
          g.px(x, y, c);
        }
      }
      // Panel seams & tie-rod concrete holes
      g.rect(0, 3, 32, 1, '#2d3749');
      g.rect(15, 3, 1, 23, '#10141c');
      g.rect(16, 3, 1, 23, '#262f3f');
      g.rect(6, 8, 2, 2, '#0e1118');
      g.rect(24, 8, 2, 2, '#0e1118');
      // Damp water streaks dripping down
      g.rect(9, 4, 2, 14, '#141b25');
      g.rect(10, 10, 1, 12, '#111820');
      g.rect(21, 5, 2, 18, '#131923');
      g.rect(22, 14, 1, 10, '#101720');
      // Heavy industrial baseboard at bottom
      g.rect(0, 26, 32, 1, '#0b0e14');
      g.rect(0, 27, 32, 4, '#131822');
      g.rect(0, 27, 32, 1, '#2b3446');
      g.rect(0, 31, 32, 1, '#080a0f');

      if (name === 'wall_neon') {
        // Signalis crimson & cyan emergency directional light strip
        g.rect(0, 12, 32, 7, '#0d1018');
        g.rect(0, 13, 32, 1, '#4a111a');
        g.rect(0, 14, 32, 2, '#e83546');
        g.rect(0, 14, 32, 1, '#ff7885');
        g.rect(0, 16, 32, 1, '#7a1622');
        // Subtle dithered crimson bloom above/below housing
        for (x = 0; x < 32; x += 2) {
          g.px(x, 11, '#3b1822');
          g.px(x + 1, 19, '#3b1822');
        }
        // Cyan tactical directional chevron + data ticks
        g.rect(0, 17, 32, 1, '#183f4a');
        g.rect(3, 17, 6, 1, '#55e8f5');
        g.rect(19, 17, 8, 1, '#55e8f5');
        // Glowing directional arrow icon on panel
        g.px(13, 13, '#7df4ff');
        g.px(14, 14, '#ffffff');
        g.px(15, 15, '#ffffff');
        g.px(14, 16, '#7df4ff');
        g.px(13, 17, '#55e8f5');
      }
      return g.canvas;
    }

    if (name === 'train_hull') {
      // Charred dark steel train car side with eerie dimly glowing red-tinted windows
      g.rect(0, 0, 32, 32, '#141821');
      // Roof overhang shadow
      g.rect(0, 0, 32, 3, '#0b0e14');
      g.rect(0, 3, 32, 1, '#2e3748');
      // Upper steel plating with soot & rivets
      for (y = 4; y < 22; y++) {
        for (x = 0; x < 32; x++) {
          var tn = g.hash(x, y, 131);
          if (tn < 0.18) g.px(x, y, '#0e1118');
          else if (tn > 0.85) g.px(x, y, '#232b38');
        }
      }
      // Twin eerie crimson-tinted windows
      var wins = [3, 18];
      for (var wi = 0; wi < wins.length; wi++) {
        var wx = wins[wi];
        g.rect(wx - 1, 6, 12, 11, '#080a0f'); // rubber frame
        g.rect(wx, 7, 10, 9, '#3d0b12');
        g.rect(wx + 1, 8, 8, 7, '#6e141f');
        g.rect(wx + 2, 9, 6, 5, '#a82230');
        // Ghostly silhouette shadow inside window
        g.rect(wx + 4, 10, 2, 5, '#2b070c');
        // Cold crimson glass reflection streak
        g.line(wx + 1, 8, wx + 3, 10, '#e85d68');
        g.px(wx + 7, 9, '#ff8e96');
      }
      // Weathered blood-crimson railway stripe
      g.rect(0, 19, 32, 2, '#691822');
      g.rect(0, 19, 32, 1, '#9e2633');
      // Lower corrugated steel siding
      for (y = 22; y < 31; y++) {
        g.rect(0, y, 32, 1, y % 2 === 0 ? '#1d2431' : '#0f131b');
      }
      // Rivet highlights
      for (x = 2; x < 32; x += 6) {
        g.px(x, 5, '#3b465b');
        g.px(x, 21, '#3b465b');
      }
      g.rect(0, 31, 32, 1, '#07080d');
      return g.canvas;
    }

    // Fallback dark slate
    g.rect(0, 0, 32, 32, '#18202c');
    return g.canvas;
  }

  /* --------------------------------------------------------------------------
   * 2. Character Pixel Sprites (32x32 Squad/Player, 40x48 Boss Inspector)
   * -------------------------------------------------------------------------- */
  function drawHumanoidBase(g, opts, frame) {
    var bob = (frame === 'walk1' || frame === 'walk2') ? 1 : 0;
    var action = frame === 'action';
    var walk1 = frame === 'walk1';
    var walk2 = frame === 'walk2';

    // Grounded contact shadow oval
    g.rect(10, 29, 12, 2, 'rgba(0,0,0,0.48)');
    g.rect(12, 28, 8, 1, 'rgba(0,0,0,0.32)');

    // Legs / boots with visibly distinct stride
    var lLegX = walk1 ? 10 : (walk2 ? 13 : (action ? 10 : 12));
    var lLegY = walk1 ? 23 : 24;
    var rLegX = walk2 ? 19 : (walk1 ? 16 : (action ? 19 : 17));
    var rLegY = walk2 ? 23 : 24;

    g.rect(lLegX, lLegY, 3, 5, opts.pants);
    g.rect(lLegX, 27, 3, 2, opts.boots);
    g.rect(rLegX, rLegY, 3, 5, opts.pants);
    g.rect(rLegX, 27, 3, 2, opts.boots);

    // Coat / torso body
    var torsoY = 13 + bob;
    var lean = action ? 1 : 0;
    g.rect(10 + lean, torsoY, 12, 11, opts.coatDark);
    g.rect(11 + lean, torsoY, 10, 10, opts.coatMain);
    // Coat hem flare during walk/action
    if (walk1) {
      g.rect(9, torsoY + 8, 3, 4, opts.coatDark);
      g.rect(19, torsoY + 9, 3, 3, opts.coatDark);
    } else if (walk2) {
      g.rect(10, torsoY + 9, 3, 3, opts.coatDark);
      g.rect(20, torsoY + 8, 3, 4, opts.coatDark);
    } else if (action) {
      g.rect(8, torsoY + 7, 4, 5, opts.coatDark);
      g.rect(20, torsoY + 8, 4, 4, opts.coatMain);
    } else {
      g.rect(10, torsoY + 9, 4, 3, opts.coatDark);
      g.rect(18, torsoY + 9, 4, 3, opts.coatDark);
    }

    // Inner chest / shirt / tactical vest
    g.rect(14 + lean, torsoY + 1, 4, 7, opts.inner);
    // Crisp HD-2D rim-light along left shoulder & lapel
    g.rect(10 + lean, torsoY, 1, 9, opts.rim);
    g.rect(11 + lean, torsoY, 3, 1, opts.rim);

    // Head & face
    var headY = 5 + bob;
    g.rect(12 + lean, headY + 1, 8, 7, opts.skin);
    g.rect(12 + lean, headY + 6, 8, 2, opts.skinShade);
    // Eyes
    g.px(14 + lean, headY + 4, opts.eye);
    g.px(18 + lean, headY + 4, opts.eye);
    // Hair / hood
    g.rect(11 + lean, headY, 10, 3, opts.hair);
    g.rect(11 + lean, headY + 2, 2, 4, opts.hair);
    g.rect(19 + lean, headY + 2, 2, 3, opts.hair);
    g.rect(12 + lean, headY, 4, 1, opts.hairHi);

    // Arms (default swing; character-specific details overlaid after)
    var lArmY = torsoY + (walk1 ? 0 : (walk2 ? 2 : 1));
    var rArmY = torsoY + (walk2 ? 0 : (walk1 ? 2 : 1));
    if (!action) {
      g.rect(8, lArmY, 3, 8, opts.coatDark);
      g.rect(9, lArmY, 1, 7, opts.coatMain);
      g.rect(21, rArmY, 3, 8, opts.coatDark);
      g.rect(21, rArmY, 1, 7, opts.coatMain);
    } else {
      // Back stabilizing arm + raised forward action arm
      g.rect(7, torsoY + 2, 4, 6, opts.coatDark);
      g.rect(22, torsoY - 1, 5, 3, opts.coatMain);
      g.rect(22, torsoY - 1, 5, 1, opts.rim);
    }

    return { bob: bob, torsoY: torsoY, headY: headY, lean: lean, action: action };
  }

  function buildInspectorCanvas(frame) {
    // 40x48 towering hunched conductor — Signalis boss presence!
    var g = createPixelCanvas(40, 48);
    var walk1 = frame === 'walk1';
    var walk2 = frame === 'walk2';
    var action = frame === 'action';
    var bob = (walk1 || walk2) ? 1 : 0;

    // Wide ominous shadow
    g.rect(10, 44, 20, 3, 'rgba(0,0,0,0.55)');
    g.rect(13, 43, 14, 1, 'rgba(0,0,0,0.35)');

    // Long stalking dark legs & iron-shod boots
    var lX = walk1 ? 12 : (walk2 ? 16 : 14);
    var rX = walk2 ? 24 : (walk1 ? 20 : 22);
    g.rect(lX, 34, 4, 10, '#0d1018');
    g.rect(lX, 42, 4, 3, '#1d222e');
    g.px(lX + 1, 43, '#5c6678');
    g.rect(rX, 34, 4, 10, '#0d1018');
    g.rect(rX, 42, 4, 3, '#1d222e');
    g.px(rX + 1, 43, '#5c6678');

    // Tall tattered black-indigo conductor trenchcoat
    var bodyY = 14 + bob;
    g.rect(11, bodyY, 18, 22, '#0c0f17');
    g.rect(13, bodyY + 1, 14, 20, '#141a26');
    g.rect(12, bodyY, 2, 18, '#283347'); // sharp cold shoulder rim
    // Ragged tattered coat hem
    var tShift = walk1 ? -1 : (walk2 ? 1 : 0);
    g.rect(10 + tShift, 34, 3, 6, '#0c0f17');
    g.rect(14, 35, 3, 5, '#141a26');
    g.rect(19, 34, 3, 6, '#0c0f17');
    g.rect(24 - tShift, 35, 3, 5, '#141a26');
    g.rect(27 - tShift, 33, 3, 5, '#0c0f17');

    // Double-breasted rusted brass railway buttons + chest mimic radio
    for (var by = 0; by < 3; by++) {
      g.px(16, bodyY + 6 + by * 4, '#8a6632');
      g.px(23, bodyY + 6 + by * 4, '#8a6632');
    }
    // Mimic handheld radio strapped on chest emitting crimson static LED
    g.rect(18, bodyY + 5, 4, 6, '#1f2633');
    g.px(19, bodyY + 3, '#6b788e');
    g.px(19, bodyY + 4, '#6b788e');
    g.px(20, bodyY + 6, action ? '#ff6b78' : '#e8293b');
    if (action) {
      g.px(18, bodyY + 2, '#ff3346');
      g.px(21, bodyY + 3, '#ff7d88');
    }

    // Hunched shoulders & shadowed head under peaked conductor cap
    var headY = 5 + bob + (action ? 1 : 0);
    g.rect(14, headY + 4, 12, 7, '#06070b'); // pitch-dark face void
    // Peaked conductor cap
    g.rect(13, headY, 14, 4, '#151c2c');
    g.rect(14, headY, 12, 1, '#2c3952');
    g.rect(12, headY + 4, 16, 2, '#0a0d14'); // heavy visor brim
    g.rect(18, headY + 1, 4, 2, '#9e7634'); // tarnished railway badge
    g.px(19, headY + 1, '#e8be63');
    // Piercing crimson pinprick eyes beneath brim
    g.px(17, headY + 7, '#ff2638');
    g.px(22, headY + 7, '#ff2638');
    if (action) {
      g.px(16, headY + 7, '#a81320');
      g.px(23, headY + 7, '#a81320');
    }

    // LEFT ARM (viewer's left): holding glowing crimson lantern!
    var lanY = bodyY + (walk1 ? 6 : (walk2 ? 9 : 7));
    if (action) lanY -= 3;
    g.rect(6, bodyY + 2, 6, 4, '#111622');
    g.rect(5, bodyY + 4, 3, 7, '#111622');
    // Lantern iron cage + blinding crimson core
    g.rect(3, lanY + 3, 7, 1, '#4c576b'); // lantern cap
    g.rect(3, lanY + 11, 7, 1, '#4c576b'); // lantern base
    g.rect(3, lanY + 4, 1, 7, '#2c3340');
    g.rect(9, lanY + 4, 1, 7, '#2c3340');
    g.rect(4, lanY + 4, 5, 7, '#b81628');
    g.rect(5, lanY + 5, 3, 5, '#ff3648');
    g.rect(6, lanY + 6, 1, 3, '#fff0f2'); // hot white-red filament
    // Soft dithered crimson glow pixels around lantern
    g.px(2, lanY + 6, 'rgba(255,46,66,0.55)');
    g.px(2, lanY + 8, 'rgba(255,46,66,0.55)');
    g.px(10, lanY + 7, 'rgba(255,46,66,0.55)');
    g.px(6, lanY + 12, 'rgba(255,46,66,0.55)');
    if (action) {
      g.px(1, lanY + 7, '#ff4757');
      g.px(6, lanY + 2, '#ff4757');
    }

    // RIGHT ARM (viewer's right): wielding oversized gleaming steel shears!
    g.rect(28, bodyY + 2, 5, 4, '#111622');
    g.rect(30, bodyY + 5, 4, 7, '#161c2b');
    if (!action) {
      var shY = bodyY + (walk2 ? 8 : 10);
      // Heavy iron ring handles
      g.rect(29, shY, 4, 3, '#4c5668');
      g.px(30, shY + 1, '#0b0e14');
      // Oversized scissor blades angled down-right
      g.line(31, shY + 3, 37, shY + 15, '#7e8fa6');
      g.line(32, shY + 3, 38, shY + 15, '#d6e4f5');
      g.line(30, shY + 4, 34, shY + 16, '#586478');
      g.line(31, shY + 4, 35, shY + 16, '#a8b9cf');
      // Pivot bolt & dried blood-rust flecks
      g.px(32, shY + 6, '#e8eef7');
      g.px(36, shY + 13, '#8a1b24');
      g.px(37, shY + 14, '#c42331');
    } else {
      // ACTION POSE: Shears raised & snapped WIDE OPEN with crimson slash gleam!
      g.rect(30, bodyY + 1, 5, 3, '#4c5668');
      // Upper blade raised high
      g.line(32, bodyY + 2, 39, bodyY - 9, '#93a6bf');
      g.line(33, bodyY + 2, 39, bodyY - 8, '#f0f7ff');
      // Lower blade jutting forward-down
      g.line(32, bodyY + 4, 39, bodyY + 14, '#7c8ea6');
      g.line(33, bodyY + 3, 39, bodyY + 13, '#e2effc');
      // Crimson execution arc between open blades
      g.line(38, bodyY - 6, 39, bodyY + 2, '#ff3346');
      g.line(39, bodyY + 2, 38, bodyY + 11, '#ff3346');
      g.px(37, bodyY + 2, '#ff9aa4');
    }

    g.outline('#05070b');
    return g.canvas;
  }

  function buildCharCanvas(id, frame) {
    if (id === 'inspector') {
      return buildInspectorCanvas(frame);
    }

    var g = createPixelCanvas(32, 32);
    var p;

    if (id === 'yanci') {
      // 严辞: tailored dark navy coat, gold tie & balance-scale gleam, cold steel-blue rim
      p = drawHumanoidBase(g, {
        coatDark: '#121826',
        coatMain: '#1f2b42',
        inner: '#d2dae6',
        pants: '#0f141e',
        boots: '#1b2230',
        skin: '#d9c0ae',
        skinShade: '#b39582',
        hair: '#141822',
        hairHi: '#34415c',
        eye: '#1c2638',
        rim: '#7ca7d9'
      }, frame);
      // Gleaming gold tie & collar pin
      g.rect(15 + p.lean, p.torsoY + 1, 2, 6, '#d9ab43');
      g.px(15 + p.lean, p.torsoY + 2, '#fff0a8');
      g.px(12 + p.lean, p.torsoY + 2, '#f2c96b'); // gold scale pin
      // Action: glowing golden-blue law-scale tactical sigil
      if (p.action) {
        g.rect(26, p.torsoY - 3, 4, 1, '#f2c96b');
        g.px(27, p.torsoY - 4, '#fff2b2');
        g.px(25, p.torsoY - 2, '#7ca7d9');
        g.px(29, p.torsoY - 2, '#7ca7d9');
        g.rect(27, p.torsoY - 2, 1, 4, '#f2c96b');
      }
      g.outline('#07090f');
      return g.canvas;
    }

    if (id === 'lujin') {
      // 陆烬: tactical combat jacket, amber visor & cyber rifle silhouette
      p = drawHumanoidBase(g, {
        coatDark: '#1c191a',
        coatMain: '#302928',
        inner: '#242933',
        pants: '#161921',
        boots: '#282321',
        skin: '#cfa992',
        skinShade: '#a67f68',
        hair: '#1b1615',
        hairHi: '#423632',
        eye: '#ff9c3b',
        rim: '#d97b54'
      }, frame);
      // Reinforced gunmetal shoulder pads
      g.rect(9 + p.lean, p.torsoY, 3, 3, '#464f5e');
      g.rect(20 + p.lean, p.torsoY, 3, 3, '#464f5e');
      // Glowing amber tactical visor across eyes
      g.rect(13 + p.lean, p.headY + 3, 7, 2, '#ff8f2b');
      g.rect(14 + p.lean, p.headY + 3, 4, 1, '#ffd980');
      // Cyber rifle silhouette
      if (!p.action) {
        g.line(18, p.torsoY + 6, 28, p.torsoY + 2, '#2d3545');
        g.line(19, p.torsoY + 6, 28, p.torsoY + 3, '#536078');
        g.px(27, p.torsoY + 2, '#ff9c3b');
      } else {
        // Levelled firing pose with glowing amber rail coil
        g.rect(20, p.torsoY, 10, 2, '#3d4759');
        g.rect(22, p.torsoY, 7, 1, '#7888a3');
        g.rect(27, p.torsoY, 2, 1, '#ffb14a');
        g.px(30, p.torsoY, '#fff0a8');
        g.px(31, p.torsoY - 1, '#ff8f2b');
        g.px(31, p.torsoY + 1, '#ff8f2b');
      }
      g.outline('#07090f');
      return g.canvas;
    }

    if (id === 'xutan') {
      // 许檀: hooded dark slate-teal tech jacket, cyan holographic scanner
      p = drawHumanoidBase(g, {
        coatDark: '#121f24',
        coatMain: '#1d333c',
        inner: '#101820',
        pants: '#101720',
        boots: '#1c2a33',
        skin: '#d6bfb0',
        skinShade: '#ad9485',
        hair: '#15272e',
        hairHi: '#345e6b',
        eye: '#58f2df',
        rim: '#58c4a6'
      }, frame);
      // Hood cowl framing head
      g.rect(10 + p.lean, p.headY - 1, 12, 3, '#1d333c');
      g.rect(10 + p.lean, p.headY + 1, 2, 6, '#15262e');
      g.rect(20 + p.lean, p.headY + 1, 2, 6, '#15262e');
      g.rect(11 + p.lean, p.headY - 1, 10, 1, '#4ca696');
      // Cyan holographic PKE scanner in right hand
      if (!p.action) {
        g.rect(22, p.torsoY + 4, 4, 3, '#1e3c47');
        g.rect(23, p.torsoY + 4, 2, 2, '#58f2df');
        g.px(24, p.torsoY + 3, '#aefcf3');
      } else {
        // Projecting stepped holographic radar fan
        g.rect(24, p.torsoY, 3, 3, '#254a57');
        g.rect(25, p.torsoY, 2, 2, '#7afcf0');
        g.line(27, p.torsoY + 1, 30, p.torsoY - 3, '#58f2df');
        g.line(27, p.torsoY + 1, 31, p.torsoY + 1, '#aefcf3');
        g.line(27, p.torsoY + 1, 30, p.torsoY + 5, '#58f2df');
      }
      g.outline('#07090f');
      return g.canvas;
    }

    if (id === 'shenyan') {
      // 沈砚: ash-gray coat, dark scarf, ominous dark-red forged pass glow
      p = drawHumanoidBase(g, {
        coatDark: '#262930',
        coatMain: '#3e434d',
        inner: '#1c1d22',
        pants: '#1a1c22',
        boots: '#24262e',
        skin: '#cfc0b4',
        skinShade: '#a69486',
        hair: '#2b2d33',
        hairHi: '#5a5f6b',
        eye: '#302327',
        rim: '#c9a66b'
      }, frame);
      // High ash scarf across chin
      g.rect(11 + p.lean, p.torsoY - 1, 10, 2, '#4e535e');
      g.rect(12 + p.lean, p.torsoY, 6, 1, '#2f323b');
      // Dark-red pass / stopwatch glow
      if (!p.action) {
        g.rect(22, p.torsoY + 5, 3, 3, '#6e1620');
        g.px(23, p.torsoY + 6, '#e8384a');
      } else {
        g.rect(25, p.torsoY - 2, 4, 4, '#8c1926');
        g.rect(26, p.torsoY - 1, 2, 2, '#ff4d5e');
        g.px(27, p.torsoY - 3, '#ff9aa4');
      }
      g.outline('#07090f');
      return g.canvas;
    }

    // Default: 'player' — dark trenchcoat, glowing crimson wristwatch, crisp cyan/gold rim
    p = drawHumanoidBase(g, {
      coatDark: '#121824',
      coatMain: '#1e283b',
      inner: '#10141d',
      pants: '#0f141e',
      boots: '#1b2230',
      skin: '#dcc4b3',
      skinShade: '#b59885',
      hair: '#131722',
      hairHi: '#3d4c69',
      eye: '#182233',
      rim: '#6fd8ea'
    }, frame);
    // Upturned trenchcoat collar + warm gold shoulder/lapel trim
    g.rect(11 + p.lean, p.torsoY - 1, 10, 2, '#283650');
    g.px(12 + p.lean, p.torsoY + 1, '#e8c16b');
    g.px(19 + p.lean, p.torsoY + 1, '#e8c16b');
    // Signature glowing crimson Infinity wristwatch on left wrist!
    if (!p.action) {
      g.rect(8, p.torsoY + 6, 3, 2, '#9e1928');
      g.px(9, p.torsoY + 6, '#ff3b4d');
      g.px(9, p.torsoY + 7, '#ff99a4');
    } else {
      // Action pose: crimson watch blazing + crisp cyan-gold energy blade/arc!
      g.rect(8, p.torsoY + 5, 3, 2, '#ff3b4d');
      g.px(9, p.torsoY + 5, '#ffd0d6');
      g.line(25, p.torsoY - 4, 30, p.torsoY + 4, '#6fd8ea');
      g.line(26, p.torsoY - 5, 31, p.torsoY + 3, '#ffffff');
      g.px(28, p.torsoY - 2, '#f2c96b');
      g.px(29, p.torsoY + 1, '#f2c96b');
    }
    g.outline('#07090f');
    return g.canvas;
  }

  /* --------------------------------------------------------------------------
   * 3. Prop Textures (32x32 Interactables, Effects & Tactical Entities)
   * -------------------------------------------------------------------------- */
  function buildPropCanvas(name) {
    var g = createPixelCanvas(32, 32);

    if (name === 'console_off' || name === 'console_on') {
      var on = name === 'console_on';
      // Ground shadow
      g.rect(5, 28, 22, 3, 'rgba(0,0,0,0.5)');
      // Steel pedestal cabinet
      g.rect(7, 16, 18, 13, '#1a202c');
      g.rect(8, 17, 16, 11, '#252e3e');
      g.rect(8, 17, 16, 1, '#3d4b63');
      // Warning stripe along cabinet base
      for (var sx = 8; sx < 24; sx += 4) {
        g.rect(sx, 26, 2, 2, '#c99824');
        g.rect(sx + 2, 26, 2, 2, '#10141c');
      }
      // Angled CRT terminal housing
      g.rect(6, 6, 20, 11, '#141923');
      g.rect(7, 7, 18, 9, '#232c3b');
      // CRT screen
      g.rect(9, 8, 12, 7, on ? '#0f3636' : '#2b1016');
      if (on) {
        // Active emerald-cyan override waveform
        g.rect(10, 9, 10, 5, '#195452');
        g.line(10, 12, 13, 10, '#58f2d8');
        g.line(13, 10, 16, 13, '#58f2d8');
        g.line(16, 13, 19, 9, '#b5fff3');
        // Status beacon LED top
        g.rect(14, 3, 4, 3, '#1e5c52');
        g.rect(15, 3, 2, 2, '#6bffea');
      } else {
        // Locked crimson error bars
        g.rect(10, 10, 10, 1, '#c92a3b');
        g.rect(10, 12, 7, 1, '#e84858');
        g.rect(14, 4, 4, 2, '#4a141b');
        g.px(15, 4, '#ff3b4d');
      }
      // Mechanical override lever on right side
      g.rect(22, 11, 2, 5, '#4b576b');
      if (on) {
        g.line(23, 12, 27, 7, '#899bb5');
        g.rect(26, 5, 3, 3, '#58f2d8');
      } else {
        g.line(23, 13, 27, 18, '#899bb5');
        g.rect(26, 17, 3, 3, '#d93848');
      }
      g.outline('#07090f');
      return g.canvas;
    }

    if (name === 'clue_glow') {
      // Luminous floating evidence dossier / stamped ticket with cyan-gold diamond aura
      g.circle(16, 16, 12, 'rgba(111,216,234,0.18)', true);
      g.circle(16, 16, 8, 'rgba(111,216,234,0.28)', true);
      // Ticket / dossier card tilted cleanly
      g.rect(10, 9, 12, 14, '#1b2636');
      g.rect(11, 10, 10, 12, '#e6d8b5');
      g.rect(12, 12, 8, 1, '#394a63');
      g.rect(12, 14, 6, 1, '#394a63');
      g.rect(12, 16, 7, 1, '#394a63');
      // Crimson station stamp seal on document
      g.rect(16, 18, 4, 3, '#c92a3b');
      g.px(17, 19, '#ff7885');
      // Crisp cyan-gold pixel sparkle crosshair
      g.rect(15, 3, 2, 4, '#6fd8ea');
      g.rect(15, 25, 2, 4, '#6fd8ea');
      g.rect(3, 15, 4, 2, '#6fd8ea');
      g.rect(25, 15, 4, 2, '#6fd8ea');
      g.px(16, 5, '#ffffff');
      g.px(26, 7, '#f2c96b');
      g.px(6, 24, '#f2c96b');
      g.outline('#07090f');
      return g.canvas;
    }

    if (name === 'exit_gate') {
      // Fortified emergency subway extraction gate with glowing cyan-emerald threshold
      g.rect(3, 28, 26, 3, 'rgba(0,0,0,0.52)');
      // Heavy armored frame stanchions
      g.rect(4, 5, 5, 24, '#1b2330');
      g.rect(5, 6, 3, 22, '#2d394d');
      g.rect(23, 5, 5, 24, '#1b2330');
      g.rect(24, 6, 3, 22, '#2d394d');
      // Top header beam with glowing EXIT neon strip
      g.rect(3, 3, 26, 5, '#141a24');
      g.rect(6, 4, 20, 3, '#0f3632');
      g.rect(7, 5, 18, 1, '#58f5d2');
      // Inner luminous extraction light field
      g.rect(9, 8, 14, 20, 'rgba(78,245,204,0.22)');
      g.rect(11, 9, 10, 18, 'rgba(111,240,224,0.34)');
      // Upward extraction chevron arrows inside threshold
      g.line(12, 17, 16, 13, '#88ffea');
      g.line(16, 13, 20, 17, '#88ffea');
      g.line(12, 22, 16, 18, '#58e8c8');
      g.line(16, 18, 20, 22, '#58e8c8');
      // Base warning bars
      g.rect(5, 26, 3, 2, '#d8a72b');
      g.rect(24, 26, 3, 2, '#d8a72b');
      g.outline('#07090f');
      return g.canvas;
    }

    if (name === 'ward_sigil') {
      // Crisp circular arcane/tactical ward seal (transparent ground sigil)
      g.circle(15.5, 15.5, 14, '#58d4e8', false);
      g.circle(15.5, 15.5, 11, '#f2c96b', false);
      g.circle(15.5, 15.5, 5, '#8cf5ff', false);
      // Geometric inner diamond & inverted square
      g.line(15, 4, 27, 15, '#6fd8ea');
      g.line(27, 15, 15, 27, '#6fd8ea');
      g.line(15, 27, 4, 15, '#6fd8ea');
      g.line(4, 15, 15, 4, '#6fd8ea');
      // 8 cardinal rune ticks
      g.rect(15, 0, 2, 3, '#fff0b2');
      g.rect(15, 29, 2, 3, '#fff0b2');
      g.rect(0, 15, 3, 2, '#fff0b2');
      g.rect(29, 15, 3, 2, '#fff0b2');
      g.px(15, 15, '#ffffff');
      g.px(16, 16, '#ffffff');
      return g.canvas;
    }

    if (name === 'kunai') {
      // High-contrast cyber throwing kunai / energy blade
      g.line(5, 26, 11, 20, '#3a4659'); // handle wrap
      g.line(6, 26, 12, 20, '#5a6a82');
      g.circle(4, 27, 2, '#7d8fa8', false); // ring pommel
      // Wide leaf blade pointing top-right
      g.line(11, 19, 26, 4, '#6fd8ea');
      g.line(12, 20, 27, 5, '#ffffff');
      g.line(13, 21, 26, 6, '#3ea8bf');
      g.line(10, 18, 22, 6, '#a8f4ff');
      // Crisp cyan energy wake pixels
      g.px(27, 4, '#ffffff');
      g.px(23, 4, '#6fd8ea');
      g.px(27, 8, '#6fd8ea');
      g.outline('#07090f');
      return g.canvas;
    }

    if (name === 'drone') {
      // Compact tactical recon/turret quad-drone
      // Rotor arms
      g.line(6, 11, 25, 20, '#354154');
      g.line(6, 20, 25, 11, '#354154');
      // Blurred high-speed rotor discs
      g.rect(3, 9, 7, 2, '#6fd8ea');
      g.rect(22, 9, 7, 2, '#6fd8ea');
      g.rect(3, 19, 7, 2, '#4ba8ba');
      g.rect(22, 19, 7, 2, '#4ba8ba');
      // Central carbon chassis
      g.rect(11, 11, 10, 9, '#19212e');
      g.rect(12, 12, 8, 7, '#2a364a');
      g.rect(13, 12, 6, 1, '#58708f');
      // Glowing cyan optical sensor eye
      g.rect(14, 14, 4, 3, '#174f5c');
      g.rect(15, 14, 2, 2, '#68fff0');
      g.px(15, 14, '#ffffff');
      // Under-slung amber micro-emitter
      g.rect(15, 20, 2, 2, '#f2a93b');
      g.outline('#07090f');
      return g.canvas;
    }

    // Generic fallback glowing diamond
    g.circle(16, 16, 6, '#6fd8ea', true);
    g.outline('#07090f');
    return g.canvas;
  }

  /* --------------------------------------------------------------------------
   * Public API (Cached NearestFilter THREE.CanvasTexture)
   * -------------------------------------------------------------------------- */
  function getTileTexture(name) {
    var key = 'tile:' + String(name || 'floor_slate');
    if (textureCache[key]) return textureCache[key];
    var canvas = buildTileCanvas(name);
    var tex = toTexture(canvas, true);
    textureCache[key] = tex;
    return tex;
  }

  function getCharTexture(id, frame) {
    var cid = String(id || 'player');
    var cframe = String(frame || 'idle');
    if (cframe !== 'idle' && cframe !== 'walk1' && cframe !== 'walk2' && cframe !== 'action') {
      cframe = 'idle';
    }
    var key = 'char:' + cid + ':' + cframe;
    if (textureCache[key]) return textureCache[key];
    var canvas = buildCharCanvas(cid, cframe);
    var tex = toTexture(canvas, false);
    textureCache[key] = tex;
    return tex;
  }

  function getPropTexture(name) {
    var key = 'prop:' + String(name || 'clue_glow');
    if (textureCache[key]) return textureCache[key];
    var canvas = buildPropCanvas(name);
    var tex = toTexture(canvas, false);
    textureCache[key] = tex;
    return tex;
  }

  INFINITY.PixelSprites = {
    getTileTexture: getTileTexture,
    getCharTexture: getCharTexture,
    getPropTexture: getPropTexture
  };
})(typeof window !== 'undefined' ? window : globalThis);
