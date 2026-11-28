/* ============================================================================
 * INFINITY // SUBTERRANEAN STATION ARCHITECT (scene_architect.js)
 * Classic non-module script exposing window.INFINITY.SceneArchitect
 *
 * Replaces bare tile grids, flat box walls, floating ceiling cubes, and flat
 * billboard interactables with rich architectural HD-2D subway staging:
 *   - PBR MeshStandardMaterial floors with per-tile variation, bump maps & wet puddles
 *   - Layered architectural concrete/ceramic & neon transit walls with trims & plinths
 *   - Reinforced steel cover-pillar cladding with hazard bands & zone beacons
 *   - Hanging industrial fluorescent light fixtures + overhead I-beams + volumetric light cones
 *   - Zone-specific 3D storytelling props across all 6 Station Zero zones
 *   - Composite 3D procedural Interactables (Consoles, Clues, Armored Blast Exit Gate)
 *   - Upgraded 4-car articulated Ghost Train No.0 with pantographs, mullions & twin beams
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = global.INFINITY = global.INFINITY || {};

  function hexToInt(hex, fallback) {
    if (typeof hex === 'number' && !isNaN(hex)) return hex;
    if (typeof hex === 'string') {
      var clean = hex.replace(/^#/, '');
      var n = parseInt(clean, 16);
      if (!isNaN(n)) return n;
    }
    return fallback !== undefined ? fallback : 0x6fd8ea;
  }

  function makeCanvas(w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    return { width: w, height: h, getContext: function () { return null; } };
  }

  function hash2D(x, z) {
    var n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  /* --------------------------------------------------------------------------
   * Procedural Backlit Signage & CRT Monitor Canvas Textures
   * -------------------------------------------------------------------------- */
  function createSignTexture(THREE, session, title, subtitle, accentCss, bgCss) {
    var W = 640;
    var H = 160;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgCss || '#0a111a';
      ctx.fillRect(0, 0, W, H);

      // Clean architectural backlit frame & top/bottom indicator bars
      ctx.fillStyle = accentCss || '#5ce4ff';
      ctx.fillRect(0, 0, W, 10);
      ctx.fillRect(0, H - 6, W, 6);

      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(10, 18, W - 20, H - 32);

      // Primary title (bounded maxWidth prevents clipping or stretching)
      ctx.fillStyle = '#edf5fc';
      ctx.font = 'bold 38px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, W * 0.5, 66, W - 56);

      // Technical sub-line cleanly padded above bottom border
      ctx.fillStyle = accentCss || '#6fd8ea';
      ctx.font = 'bold 19px "JetBrains Mono",monospace';
      ctx.fillText(subtitle || 'STATION 00 · SECTOR', W * 0.5, 118, W - 64);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createRouteMapTexture(THREE, session) {
    var c = makeCanvas(512, 256);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#09131e';
      ctx.fillRect(0, 0, 512, 256);

      // Grid lines
      ctx.strokeStyle = 'rgba(92, 210, 240, 0.14)';
      ctx.lineWidth = 1.5;
      for (var x = 24; x < 512; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 244); ctx.stroke();
      }
      for (var y = 24; y < 256; y += 32) {
        ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(500, y); ctx.stroke();
      }

      // Header bar
      ctx.fillStyle = '#12283a';
      ctx.fillRect(14, 14, 484, 38);
      ctx.fillStyle = '#6ce8ff';
      ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('零号地下线 · STATION ZERO TRANSIT MAP', 28, 40);

      // Transit lines (Cyan, Gold, Crimson Loop)
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#58e0ff';
      ctx.beginPath(); ctx.moveTo(42, 118); ctx.lineTo(240, 118); ctx.lineTo(310, 82); ctx.lineTo(466, 82); ctx.stroke();

      ctx.strokeStyle = '#f0c05a';
      ctx.beginPath(); ctx.moveTo(42, 186); ctx.lineTo(186, 186); ctx.lineTo(256, 148); ctx.lineTo(466, 148); ctx.stroke();

      ctx.strokeStyle = '#ff384e';
      ctx.beginPath(); ctx.moveTo(416, 62); ctx.lineTo(416, 224); ctx.stroke();

      // Station nodes
      var nodes = [
        [72, 118, '#58e0ff'], [168, 118, '#58e0ff'], [240, 118, '#ffffff'],
        [330, 82, '#58e0ff'], [416, 82, '#ff384e'], [416, 148, '#ff384e'],
        [102, 186, '#f0c05a'], [256, 148, '#f0c05a'], [416, 206, '#ff384e']
      ];
      for (var i = 0; i < nodes.length; i++) {
        ctx.fillStyle = '#09131e';
        ctx.beginPath(); ctx.arc(nodes[i][0], nodes[i][1], 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = nodes[i][2];
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // Warning badge bottom-left
      ctx.fillStyle = 'rgba(255, 56, 78, 0.22)';
      ctx.fillRect(28, 210, 210, 28);
      ctx.fillStyle = '#ff6b7c';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('LINE-00 // SIGNAL LOCKED', 38, 229);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createCrtBankTexture(THREE, session) {
    var c = makeCanvas(512, 192);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#071412';
      ctx.fillRect(0, 0, 512, 192);
      // 3 distinct CRT screen bezels
      for (var i = 0; i < 3; i++) {
        var bx = 12 + i * 166;
        ctx.fillStyle = '#0c2620';
        ctx.fillRect(bx, 14, 152, 164);
        ctx.strokeStyle = '#38c89e';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, 14, 152, 164);

        // Waveform / rail diagram per screen
        ctx.strokeStyle = i === 1 ? '#ff5868' : '#5cffc0';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(bx + 14, 128); ctx.lineTo(bx + 62, 128); ctx.lineTo(bx + 92, 74); ctx.lineTo(bx + 138, 74);
          ctx.moveTo(bx + 62, 128); ctx.lineTo(bx + 138, 128);
        } else if (i === 1) {
          for (var w = 0; w < 120; w += 6) {
            var yv = 96 + Math.sin(w * 0.22) * 26 * (w % 18 === 0 ? 1.4 : 0.7);
            if (w === 0) ctx.moveTo(bx + 16 + w, yv); else ctx.lineTo(bx + 16 + w, yv);
          }
        } else {
          ctx.arc(bx + 76, 98, 42, 0, Math.PI * 2);
          ctx.moveTo(bx + 76, 98); ctx.lineTo(bx + 110, 74);
        }
        ctx.stroke();

        // Status bars
        ctx.fillStyle = i === 1 ? '#ff6472' : '#5cffc0';
        ctx.fillRect(bx + 14, 28, 84, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(bx + 14, 152, 120, 6);
      }
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function getInkLineMat(THREE, session) {
    if (session._style1InkLineMat) return session._style1InkLineMat;
    var mat = session.trackMat(new THREE.LineBasicMaterial({
      color: 0x05070b,
      transparent: true,
      opacity: 0.90
    }));
    session._style1InkLineMat = mat;
    return mat;
  }

  function addInkOutline(THREE, session, mesh, thresholdDeg) {
    if (!mesh || !mesh.geometry || typeof THREE.EdgesGeometry !== 'function' || typeof THREE.LineSegments !== 'function') {
      return null;
    }
    var edgesGeo = session.trackGeo(new THREE.EdgesGeometry(mesh.geometry, thresholdDeg || 24));
    var lines = new THREE.LineSegments(edgesGeo, getInkLineMat(THREE, session));
    lines.scale.set(1.004, 1.004, 1.004);
    mesh.add(lines);
    return lines;
  }

  function createPuddleTexture(THREE, session) {
    var S = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (ctx) {
      // Style-1 Heavy-Ink organic multi-lobed subway puddle (matching anchor_stage_platform0.webp):
      // irregular asymmetric coastline + thin black ink outline + smooth dark teal-slate water + soft cyan sheen.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(46, 134);
      ctx.bezierCurveTo(32, 108, 48, 78, 84, 74);
      ctx.bezierCurveTo(106, 72, 118, 52, 148, 56);
      ctx.bezierCurveTo(184, 60, 206, 86, 198, 114);
      ctx.bezierCurveTo(192, 134, 218, 146, 208, 170);
      ctx.bezierCurveTo(198, 194, 158, 194, 132, 180);
      ctx.bezierCurveTo(108, 168, 92, 190, 64, 178);
      ctx.bezierCurveTo(44, 170, 56, 152, 46, 134);
      ctx.closePath();

      // Flat cel-shaded deep slate-teal water fill
      var g = ctx.createLinearGradient(44, 58, 204, 190);
      g.addColorStop(0.0, 'rgba(22, 44, 58, 0.84)');
      g.addColorStop(0.55, 'rgba(13, 27, 38, 0.88)');
      g.addColorStop(1.0, 'rgba(19, 39, 52, 0.82)');
      ctx.fillStyle = g;
      ctx.fill();

      // Clipped interior cel reflection crescent along upper-left coast (no geometric stripes!)
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(104, 168, 194, 0.24)';
      ctx.beginPath();
      ctx.moveTo(52, 112);
      ctx.bezierCurveTo(64, 80, 114, 68, 164, 72);
      ctx.bezierCurveTo(148, 92, 106, 98, 66, 122);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(146, 208, 228, 0.20)';
      ctx.beginPath();
      ctx.moveTo(136, 158);
      ctx.bezierCurveTo(158, 148, 184, 150, 196, 164);
      ctx.bezierCurveTo(182, 174, 156, 172, 136, 158);
      ctx.closePath();
      ctx.fill();

      // Subtle cool rim highlight tracing inside upper contour
      ctx.strokeStyle = 'rgba(130, 192, 214, 0.22)';
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();

      // Crisp thin Style-1 hand-inked coastline
      ctx.strokeStyle = 'rgba(6, 9, 14, 0.90)';
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Two organic satellite water droplets (matching Art Bible anchor puddle clusters)
      ctx.beginPath();
      ctx.moveTo(208, 106);
      ctx.bezierCurveTo(212, 96, 228, 96, 232, 106);
      ctx.bezierCurveTo(234, 114, 222, 120, 212, 116);
      ctx.closePath();
      ctx.fillStyle = 'rgba(18, 38, 52, 0.84)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 9, 14, 0.88)';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(30, 164);
      ctx.bezierCurveTo(32, 158, 44, 158, 46, 165);
      ctx.bezierCurveTo(47, 172, 36, 174, 30, 164);
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 34, 48, 0.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 9, 14, 0.86)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createCrackDecalTexture(THREE, session) {
    var S = 256;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Subtle dark cel-shaded spall patch around fracture core
      ctx.fillStyle = 'rgba(8, 12, 18, 0.36)';
      ctx.beginPath();
      ctx.moveTo(96, 114);
      ctx.lineTo(142, 102);
      ctx.lineTo(166, 134);
      ctx.lineTo(128, 152);
      ctx.lineTo(88, 138);
      ctx.closePath();
      ctx.fill();

      // Crisp pale edge chip highlight on one side of main crack
      ctx.strokeStyle = 'rgba(140, 168, 196, 0.16)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(28, 124); ctx.lineTo(84, 118); ctx.lineTo(128, 128); ctx.lineTo(182, 114); ctx.lineTo(230, 128);
      ctx.stroke();

      // Primary heavy-ink jagged fracture network (#06090e)
      ctx.strokeStyle = 'rgba(6, 9, 14, 0.92)';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(26, 122); ctx.lineTo(82, 116); ctx.lineTo(126, 126); ctx.lineTo(180, 112); ctx.lineTo(228, 126);
      ctx.stroke();

      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(82, 116); ctx.lineTo(64, 72); ctx.lineTo(44, 52);
      ctx.moveTo(126, 126); ctx.lineTo(114, 174); ctx.lineTo(94, 206);
      ctx.moveTo(126, 126); ctx.lineTo(156, 164); ctx.lineTo(186, 194);
      ctx.moveTo(180, 112); ctx.lineTo(198, 72); ctx.lineTo(214, 54);
      ctx.stroke();

      // Fine hairline branches & rubble ink specks
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(64, 72); ctx.lineTo(92, 58);
      ctx.moveTo(156, 164); ctx.lineTo(146, 196);
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 9, 14, 0.85)';
      var specks = [[74, 138, 3.2], [142, 112, 2.8], [164, 148, 3.5], [108, 96, 2.4], [192, 134, 2.6]];
      for (var i = 0; i < specks.length; i++) {
        ctx.beginPath();
        ctx.arc(specks[i][0], specks[i][1], specks[i][2], 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createPillarAoTexture(THREE, session) {
    var S = 128;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (ctx) {
      var g = ctx.createRadialGradient(64, 64, 24, 64, 64, 62);
      g.addColorStop(0.0, 'rgba(4, 6, 10, 0.86)');
      g.addColorStop(0.62, 'rgba(4, 6, 10, 0.56)');
      g.addColorStop(1.0, 'rgba(4, 6, 10, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  /* --------------------------------------------------------------------------
   * Zone-Specific Architectural Storytelling & Floor Inlay CanvasTextures
   * -------------------------------------------------------------------------- */
  function createFloorCompassTexture(THREE, session) {
    var S = 512;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (ctx) {
      var cx = S * 0.5, cy = S * 0.5;
      // Weathered dark slate-terrazzo recessed metro concourse medallion (subtle, grounded, non-arcade)
      ctx.strokeStyle = 'rgba(5, 8, 13, 0.90)';
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(cx, cy, 232, 0, Math.PI * 2); ctx.stroke();

      var grad = ctx.createRadialGradient(cx, cy, 28, cx, cy, 230);
      grad.addColorStop(0.0, 'rgba(30, 42, 56, 0.42)');
      grad.addColorStop(0.62, 'rgba(20, 29, 40, 0.46)');
      grad.addColorStop(0.92, 'rgba(12, 18, 26, 0.54)');
      grad.addColorStop(1.0, 'rgba(10, 15, 22, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, 230, 0, Math.PI * 2); ctx.fill();

      // Subtle inlaid tarnished-brass & slate architectural rings
      ctx.strokeStyle = 'rgba(182, 152, 102, 0.34)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, 214, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(92, 152, 172, 0.24)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, 166, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(182, 152, 102, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 98, 0, Math.PI * 2); ctx.stroke();

      // Grout joints dividing terrazzo stone slabs
      for (var i = 0; i < 8; i++) {
        var ang = (i * Math.PI) / 4;
        ctx.strokeStyle = 'rgba(5, 8, 13, 0.65)';
        ctx.lineWidth = (i % 2 === 0) ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 58, cy + Math.sin(ang) * 58);
        ctx.lineTo(cx + Math.cos(ang) * 228, cy + Math.sin(ang) * 228);
        ctx.stroke();
      }

      // Worn central brass station emblem
      ctx.fillStyle = 'rgba(10, 15, 22, 0.78)';
      ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(196, 164, 108, 0.52)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'rgba(198, 172, 122, 0.72)';
      ctx.font = 'bold 30px "JetBrains Mono",monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('00', cx, cy - 5);
      ctx.font = 'bold 11px "JetBrains Mono",monospace';
      ctx.fillStyle = 'rgba(148, 178, 192, 0.62)';
      ctx.fillText('B1 CONCOURSE', cx, cy + 20);

      // Subtle architectural boot scuffs & dark ink grime weathering
      ctx.fillStyle = 'rgba(5, 8, 12, 0.24)';
      for (var sc = 0; sc < 26; sc++) {
        var sx = cx + Math.cos(sc * 2.1) * (60 + (sc * 19) % 150);
        var sy = cy + Math.sin(sc * 1.7) * (60 + (sc * 23) % 150);
        ctx.fillRect(sx, sy, 8 + (sc % 14), 3 + (sc % 5));
      }
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createTactilePavingTexture(THREE, session) {
    var W = 128, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      // Weathered ochre subway blind-guide tactile paving strip (盲道砖)
      ctx.fillStyle = '#8b6a24';
      ctx.fillRect(0, 0, W, H);
      // Heavy-ink outer concrete border
      ctx.fillStyle = '#070a10';
      ctx.fillRect(0, 0, 8, H);
      ctx.fillRect(W - 8, 0, 8, H);
      // Tile joints
      ctx.fillStyle = 'rgba(8, 11, 16, 0.78)';
      ctx.fillRect(0, 0, W, 6);
      ctx.fillRect(0, H * 0.5 - 3, W, 6);
      // Four longitudinal raised guide ribs with top highlight & ink shadow
      var ribX = [22, 46, 70, 94];
      for (var i = 0; i < ribX.length; i++) {
        ctx.fillStyle = '#b98f32';
        ctx.fillRect(ribX[i], 10, 12, H * 0.5 - 18);
        ctx.fillRect(ribX[i], H * 0.5 + 8, 12, H * 0.5 - 18);
        ctx.fillStyle = 'rgba(7, 10, 15, 0.62)';
        ctx.fillRect(ribX[i] + 10, 12, 4, H * 0.5 - 18);
        ctx.fillRect(ribX[i] + 10, H * 0.5 + 10, 4, H * 0.5 - 18);
      }
      // Grime wear patches so it feels decades old
      ctx.fillStyle = 'rgba(12, 15, 20, 0.28)';
      ctx.fillRect(10, 44, 108, 18);
      ctx.fillRect(14, 188, 96, 22);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createWayfindingStripeTexture(THREE, session, hexColor, labelText) {
    var W = 512, H = 96;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, W, H);
      // Heavy-ink dark painted metro floor tape backing
      ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
      ctx.fillRect(4, 10, W - 8, H - 20);
      // Colored transit line bands (top & bottom rail stripes)
      ctx.fillStyle = hexColor || '#d69b3c';
      ctx.globalAlpha = 0.78;
      ctx.fillRect(8, 14, W - 16, 10);
      ctx.fillRect(8, H - 24, W - 16, 10);
      // Stenciled transit typography inside stripe
      ctx.globalAlpha = 0.86;
      ctx.fillStyle = '#dce6ef';
      ctx.font = 'bold 26px "PingFang SC","Microsoft YaHei","JetBrains Mono",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText || 'B2 换乘长廊 →', W * 0.5, H * 0.5 + 1, W - 36);
      // Worn shoe-scuff breaks for realistic painted floor feel
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgba(10, 14, 20, 0.42)';
      ctx.fillRect(72, 12, 14, 72);
      ctx.fillRect(398, 12, 18, 72);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createIncidentClueDecalTexture(THREE, session) {
    var S = 512;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, S, S);
      // Heavy-ink oil/ash impact stain under sheared turnstile
      var sg = ctx.createRadialGradient(240, 260, 18, 256, 256, 210);
      sg.addColorStop(0.0, 'rgba(6, 9, 14, 0.84)');
      sg.addColorStop(0.55, 'rgba(10, 14, 20, 0.42)');
      sg.addColorStop(1.0, 'rgba(10, 14, 20, 0.0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, S, S);

      // Dried dark-crimson drag streak leading west toward security lane
      ctx.save();
      ctx.strokeStyle = 'rgba(122, 22, 30, 0.78)';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(378, 240);
      ctx.bezierCurveTo(310, 265, 225, 250, 118, 292);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(68, 10, 16, 0.82)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(356, 254);
      ctx.bezierCurveTo(286, 278, 210, 266, 134, 304);
      ctx.stroke();
      ctx.restore();

      // Scattered punched cream-white metro ticket stubs & torn timetable scraps
      var papers = [
        { x: 184, y: 178, w: 34, h: 18, rot: -0.42, stub: true },
        { x: 294, y: 318, w: 38, h: 20, rot: 0.35, stub: true },
        { x: 342, y: 204, w: 32, h: 17, rot: 0.78, stub: true },
        { x: 158, y: 332, w: 46, h: 32, rot: -0.22, stub: false },
        { x: 256, y: 146, w: 30, h: 16, rot: 0.14, stub: true },
        { x: 374, y: 310, w: 42, h: 28, rot: -0.64, stub: false }
      ];
      for (var pi = 0; pi < papers.length; pi++) {
        var pp = papers[pi];
        ctx.save();
        ctx.translate(pp.x, pp.y);
        ctx.rotate(pp.rot);
        ctx.fillStyle = '#05070c';
        ctx.fillRect(-pp.w * 0.5 - 3, -pp.h * 0.5 - 3, pp.w + 6, pp.h + 6);
        ctx.fillStyle = pp.stub ? '#dfd6be' : '#c6ccd4';
        ctx.fillRect(-pp.w * 0.5, -pp.h * 0.5, pp.w, pp.h);
        if (pp.stub) {
          ctx.fillStyle = '#9c2c34';
          ctx.fillRect(-pp.w * 0.5 + 4, -3, 10, 6);
          ctx.fillStyle = '#182230';
          ctx.fillRect(2, -4, 10, 3);
          ctx.fillRect(2, 2, 8, 2);
        } else {
          ctx.fillStyle = '#243040';
          ctx.fillRect(-pp.w * 0.5 + 5, -8, pp.w - 10, 3);
          ctx.fillRect(-pp.w * 0.5 + 5, -1, pp.w - 14, 3);
          ctx.fillRect(-pp.w * 0.5 + 5, 6, pp.w - 18, 3);
        }
        ctx.restore();
      }
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createVendingFrontTexture(THREE, session) {
    var W = 128, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      // Heavy-ink dark vending glass recess
      ctx.fillStyle = '#0a121b';
      ctx.fillRect(0, 0, W, H);
      // Subtle interior cool tube glow
      var vg = ctx.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0.0, 'rgba(92, 184, 212, 0.36)');
      vg.addColorStop(0.65, 'rgba(42, 86, 112, 0.24)');
      vg.addColorStop(1.0, 'rgba(10, 16, 24, 0.90)');
      ctx.fillStyle = vg;
      ctx.fillRect(6, 6, W - 12, H - 12);

      // 4 dark-ink product shelves with silhouette drink cans/bottles
      var canCols = ['#529ab2', '#b8883c', '#8c343e', '#468c74', '#6c7c92'];
      for (var row = 0; row < 4; row++) {
        var sy = 44 + row * 46;
        ctx.fillStyle = '#060a10';
        ctx.fillRect(8, sy, W - 16, 6);
        for (var col = 0; col < 5; col++) {
          var cx = 14 + col * 21;
          var ch = 22 + ((row + col) % 3) * 4;
          ctx.fillStyle = '#05080d';
          ctx.fillRect(cx - 2, sy - ch - 2, 16, ch + 2);
          ctx.fillStyle = canCols[(row * 3 + col) % canCols.length];
          ctx.fillRect(cx, sy - ch, 12, ch);
          ctx.fillStyle = 'rgba(220, 242, 250, 0.45)';
          ctx.fillRect(cx + 2, sy - ch + 2, 3, ch - 4);
        }
      }
      // Pickup chute & coin slot panel at bottom
      ctx.fillStyle = '#05080d';
      ctx.fillRect(14, 214, W - 28, 28);
      ctx.strokeStyle = '#3b5166';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, W - 8, H - 8);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createMudSmearedAdTexture(THREE, session, variant) {
    var W = 512, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      var bgCols = ['#1b232e', '#261f18', '#152524'];
      var accentCols = ['#d6b274', '#68c8de', '#e69c3c'];
      var titles = ['零号地铁专线 · 末班 00:00', '地下商业街 · 全面停业', '请勿回应 43.2Hz 广播'];
      var subs = ['LINE-00 EXPRESS // TICKET REQUIRED', 'UNDERGROUND ARCADE // CLOSED', 'SAFETY NOTICE // DO NOT LISTEN'];
      var idx = Math.abs(variant || 0) % 3;

      ctx.fillStyle = bgCols[idx];
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = accentCols[idx];
      ctx.fillRect(0, 0, W, 14);
      ctx.fillRect(0, H - 10, W, 10);

      // Subtle poster graphics
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(24, 34, 150, 176);
      ctx.strokeStyle = accentCols[idx];
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 34, 150, 176);

      // Poster typography
      ctx.fillStyle = '#e8eef5';
      ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(titles[idx], 194, 96, 296);
      ctx.fillStyle = accentCols[idx];
      ctx.font = 'bold 16px "JetBrains Mono",monospace';
      ctx.fillText(subs[idx], 194, 142, 296);
      ctx.fillStyle = 'rgba(220,232,244,0.48)';
      ctx.fillRect(194, 166, 240, 8);
      ctx.fillRect(194, 184, 180, 8);

      // Heavy black mud hand-smears & dripping streaks (scenario lore: 广告灯箱全部被黑泥涂抹)
      ctx.save();
      ctx.fillStyle = 'rgba(8, 10, 13, 0.86)';
      ctx.beginPath();
      ctx.moveTo(74 + idx * 36, 28);
      ctx.bezierCurveTo(148, 18, 250, 56, 338, 42);
      ctx.bezierCurveTo(420, 32, 468, 92, 434, 158);
      ctx.bezierCurveTo(382, 212, 240, 224, 148, 198);
      ctx.bezierCurveTo(64, 178, 36, 98, 74 + idx * 36, 28);
      ctx.closePath();
      ctx.fill();

      // Diagonal mud drag streaks & vertical drips
      ctx.strokeStyle = 'rgba(5, 7, 10, 0.94)';
      ctx.lineCap = 'round';
      for (var d = 0; d < 7; d++) {
        ctx.lineWidth = 10 + (d % 3) * 6;
        ctx.beginPath();
        var sx = 54 + d * 64 + idx * 9;
        ctx.moveTo(sx, 26 + (d % 2) * 30);
        ctx.lineTo(sx - 18, 185 + (d % 3) * 20);
        ctx.stroke();
      }
      // Scratched warning tally marks in pale chalk
      ctx.strokeStyle = 'rgba(218, 232, 240, 0.42)';
      ctx.lineWidth = 2.2;
      for (var t = 0; t < 4; t++) {
        ctx.beginPath();
        ctx.moveTo(226 + t * 14, 106);
        ctx.lineTo(222 + t * 14, 144);
        ctx.stroke();
      }
      ctx.restore();
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createSwitchgearFaceTexture(THREE, session) {
    var W = 256, H = 512;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#070a0f';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, W - 8, H - 8);

      // Top louver vents
      ctx.fillStyle = '#0c1118';
      for (var vy = 22; vy < 92; vy += 14) {
        ctx.fillRect(24, vy, W - 48, 7);
      }

      // 3 Analog Voltmeter Dials
      for (var mi = 0; mi < 3; mi++) {
        var mx = 48 + mi * 80;
        ctx.fillStyle = '#0d1520';
        ctx.fillRect(mx - 28, 114, 56, 52);
        ctx.strokeStyle = '#6e9eff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(mx - 28, 114, 56, 52);
        ctx.strokeStyle = '#d4e8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, 156, 20, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.strokeStyle = mi === 1 ? '#ffaa3b' : '#5ce8c8';
        ctx.beginPath();
        ctx.moveTo(mx, 156);
        ctx.lineTo(mx + (mi - 1) * 12, 132);
        ctx.stroke();
      }

      // High-voltage warning triangle plate
      ctx.fillStyle = '#e0a234';
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 198);
      ctx.lineTo(W * 0.5 + 38, 260);
      ctx.lineTo(W * 0.5 - 38, 260);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#070a0f';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#070a0f';
      ctx.font = 'bold 34px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', W * 0.5, 250);

      // Indicator lamps (blue/green/amber)
      var lampCols = ['#5ce8c8', '#6e9eff', '#ffaa3b', '#5ce8c8'];
      for (var li = 0; li < 4; li++) {
        ctx.fillStyle = lampCols[li];
        ctx.beginPath();
        ctx.arc(46 + li * 54, 296, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Heavy rotary breaker handle & lower panel door
      ctx.strokeStyle = '#0c1118';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 326, W - 40, 162);
      ctx.fillStyle = '#2d3b4e';
      ctx.fillRect(W * 0.5 - 12, 360, 24, 72);
      ctx.fillStyle = '#c88c38';
      ctx.fillRect(W * 0.5 - 24, 386, 48, 16);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createFloorGrateTexture(THREE, session, accentCss) {
    var W = 256, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#080c12';
      ctx.fillRect(0, 0, W, H);
      // Heavy industrial diamond/slatted grate ribs
      ctx.fillStyle = '#252f3d';
      for (var x = 0; x < W; x += 24) {
        ctx.fillRect(x, 0, 8, H);
      }
      for (var y = 0; y < H; y += 32) {
        ctx.fillRect(0, y, W, 9);
      }
      // Side steel channel border + subtle safety stripe
      ctx.fillStyle = '#364355';
      ctx.fillRect(0, 0, W, 14);
      ctx.fillRect(0, H - 14, W, 14);
      if (accentCss) {
        ctx.fillStyle = accentCss;
        ctx.fillRect(0, 14, W, 5);
        ctx.fillRect(0, H - 19, W, 5);
      }
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createPlatformBayStencilTexture(THREE, session, bayCode, bayLabel, accentCss) {
    var W = 512, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = accentCss || '#e69c3c';
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, W - 24, H - 24);

      ctx.fillStyle = 'rgba(12, 18, 26, 0.34)';
      ctx.fillRect(16, 16, W - 32, H - 32);

      ctx.fillStyle = accentCss || '#e69c3c';
      ctx.font = 'bold 74px "JetBrains Mono",monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(bayCode, 38, 102);

      ctx.fillStyle = 'rgba(232, 240, 248, 0.80)';
      ctx.font = 'bold 34px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(bayLabel, 38, 186, 320);

      // Boarding arrow pointing east toward train doors
      ctx.fillStyle = accentCss || '#e69c3c';
      ctx.beginPath();
      ctx.moveTo(394, 72);
      ctx.lineTo(466, 128);
      ctx.lineTo(394, 184);
      ctx.lineTo(394, 150);
      ctx.lineTo(352, 150);
      ctx.lineTo(352, 106);
      ctx.lineTo(394, 106);
      ctx.closePath();
      ctx.fill();
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createTrackMapTableTexture(THREE, session) {
    var W = 512, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#081a17';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(82, 196, 162, 0.22)';
      ctx.lineWidth = 1.5;
      for (var gx = 16; gx < W; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx, 8); ctx.lineTo(gx, H - 8); ctx.stroke();
      }
      for (var gy = 16; gy < H; gy += 24) {
        ctx.beginPath(); ctx.moveTo(8, gy); ctx.lineTo(W - 8, gy); ctx.stroke();
      }
      // Luminous track interlock lines
      ctx.strokeStyle = '#52c4a2';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(34, 88); ctx.lineTo(476, 88);
      ctx.moveTo(34, 168); ctx.lineTo(476, 168);
      ctx.moveTo(156, 88); ctx.lineTo(224, 168);
      ctx.moveTo(316, 168); ctx.lineTo(384, 88);
      ctx.stroke();
      // Amber locked switch nodes
      ctx.fillStyle = '#ffaa3b';
      var pts = [[156, 88], [224, 168], [316, 168], [384, 88]];
      for (var pi = 0; pi < pts.length; pi++) {
        ctx.beginPath(); ctx.arc(pts[pi][0], pts[pi][1], 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#9cf5d8';
      ctx.font = 'bold 20px "JetBrains Mono",monospace';
      ctx.fillText('DISPATCH ARCHIVE // TRACK INTERLOCK BLUEPRINT', 26, 36);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function createZoneFloorFrameTexture(THREE, session, label, accentCss) {
    var W = 512, H = 256;
    var c = makeCanvas(W, H);
    var ctx = c.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = accentCss || '#e6a83c';
      ctx.lineWidth = 10;
      ctx.setLineDash([28, 16]);
      ctx.strokeRect(14, 14, W - 28, H - 28);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(8, 12, 18, 0.24)';
      ctx.fillRect(22, 22, W - 44, H - 44);
      if (label) {
        ctx.fillStyle = accentCss || '#e6a83c';
        ctx.font = 'bold 28px "JetBrains Mono","PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, W * 0.5, H - 44, W - 80);
      }
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  /* --------------------------------------------------------------------------
   * Procedural / Dynamic Zone Prop, Cover & Decal Generator (Scaled for 224x152)
   * Reads StationMap bounds, walkability, walls, and interactables dynamically
   * so the 4x expanded Station Zero (34,048 m²) is richly populated with zero
   * pathfinding obstructions and zero rail-trench overhang.
   * -------------------------------------------------------------------------- */
  function generateDynamicZoneProps(mapApiArg) {
    var mapApi = mapApiArg || INFINITY.StationMap || null;
    var gridW = (mapApi && mapApi.GRID_W) || 224;
    var gridH = (mapApi && mapApi.GRID_H) || 152;
    var platformStartX = (mapApi && mapApi.PLATFORM_START_X) || 168;
    var hazardX = (mapApi && mapApi.HAZARD_X) || 207;
    var railMinX = (mapApi && mapApi.RAIL_MIN_X) || 208;
    var grid = (mapApi && typeof mapApi.getGrid === 'function') ? mapApi.getGrid() : null;
    var interactables = (mapApi && typeof mapApi.getInteractables === 'function') ? (mapApi.getInteractables() || []) : [];
    var spawn = (mapApi && typeof mapApi.getZoneCenter === 'function')
      ? (mapApi.getZoneCenter('concourse') || { x: 41.5, z: 37.5 })
      : { x: 41.5, z: 37.5 };

    var defaultBounds = {
      concourse:  { x0: 4,   z0: 4,   x1: 78,  z1: 70 },
      corridor:   { x0: 84,  z0: 50,  x1: 160, z1: 98 },
      dispatch:   { x0: 84,  z0: 4,   x1: 160, z1: 44 },
      substation: { x0: 4,   z0: 76,  x1: 78,  z1: 144 },
      tunnel:     { x0: 84,  z0: 104, x1: 160, z1: 144 },
      platform0:  { x0: 168, z0: 6,   x1: 206, z1: 144 }
    };
    var bounds = (mapApi && typeof mapApi.getZoneBounds === 'function')
      ? (mapApi.getZoneBounds() || defaultBounds)
      : defaultBounds;

    function getCell(gx, gz) {
      if (gx < 0 || gz < 0 || gx >= gridW || gz >= gridH) return 1;
      if (!grid) return 0;
      if (Array.isArray(grid[gz])) return grid[gz][gx];
      return grid[gz * gridW + gx];
    }

    function isWalkableSafe(x, z) {
      var ix = Math.floor(x);
      var iz = Math.floor(z);
      if (ix < 1 || iz < 1 || ix >= gridW - 1 || iz >= gridH - 1) return false;
      var cell = getCell(ix, iz);
      if (cell === 1 || cell === 4) return false;
      if (mapApi && typeof mapApi.isWalkable === 'function') {
        return !!mapApi.isWalkable(x, z);
      }
      return true;
    }

    var occupied = [];
    function isClearForProp(x, z, minSep, spawnPad, interPad) {
      if (!isWalkableSafe(x, z)) return false;
      // Ensure footprint margin stays off solid walls and rail trench
      if (!isWalkableSafe(x - 0.35, z) || !isWalkableSafe(x + 0.35, z) ||
          !isWalkableSafe(x, z - 0.35) || !isWalkableSafe(x, z + 0.35)) {
        return false;
      }
      var sp = typeof spawnPad === 'number' ? spawnPad : 2.8;
      if (sp > 0) {
        var sdx = x - spawn.x;
        var sdz = z - spawn.z;
        if (sdx * sdx + sdz * sdz < sp * sp) return false;
      }
      var ip = typeof interPad === 'number' ? interPad : 2.1;
      if (ip > 0) {
        for (var ii = 0; ii < interactables.length; ii++) {
          var it = interactables[ii];
          var idx = x - it.x;
          var idz = z - it.z;
          if (idx * idx + idz * idz < ip * ip) return false;
        }
      }
      var sep = typeof minSep === 'number' ? minSep : 1.4;
      var sepSq = sep * sep;
      for (var oi = 0; oi < occupied.length; oi++) {
        var ox = x - occupied[oi].x;
        var oz = z - occupied[oi].z;
        if (ox * ox + oz * oz < sepSq) return false;
      }
      return true;
    }

    function reserveProp(x, z) {
      occupied.push({ x: x, z: z });
    }

    var cB = bounds.concourse || defaultBounds.concourse;
    var rB = bounds.corridor || defaultBounds.corridor;
    var dB = bounds.dispatch || defaultBounds.dispatch;
    var sB = bounds.substation || defaultBounds.substation;
    var tB = bounds.tunnel || defaultBounds.tunnel;
    var pB = bounds.platform0 || defaultBounds.platform0;

    // 1. 6 Zone-Signature 3D Landmarks (reserve first so dynamic props keep wide clearance)
    var landmarks = [
      { zone: 'concourse',  kind: 'clock_totem',  label: '停摆倒计时时钟塔',   x: 41.5,  z: 29.5,  color: '#68c8de' },
      { zone: 'corridor',   kind: 'transit_arch', label: '换乘霓虹门拱',       x: 86.5,  z: 74.5,  color: '#d6b274' },
      { zone: 'dispatch',   kind: 'radar_tower',  label: '调度信号塔',         x: 92.5,  z: 34.5,  color: '#52c4a2' },
      { zone: 'substation', kind: 'tesla_coil',   label: '高压共振线圈',       x: 70.5,  z: 84.5,  color: '#6e9eff' },
      { zone: 'tunnel',     kind: 'vent_turbine', label: '废弃通风涡轮',       x: 92.5,  z: 136.5, color: '#a884e0' },
      { zone: 'platform0',  kind: 'signal_mast',  label: '0号站台铁路信号灯柱', x: 172.5, z: 136.5, color: '#e69c3c' }
    ];
    for (var lri = 0; lri < landmarks.length; lri++) {
      reserveProp(landmarks[lri].x, landmarks[lri].z);
    }

    // 2. Dynamic Subway Ticket Turnstiles (North Lobby Entrance Banks + z=21 Checkpoint Gateways + East Transfer Gates)
    var turnstiles = [];
    for (var tx = cB.x0 + 6.5; tx <= cB.x1 - 5.5; tx += 2.2) {
      // Leave central illuminated route-map kiosk approach clear (x: 35..48)
      if (tx > 34.5 && tx < 48.5) continue;
      var tz = cB.z0 + 0.92;
      if (isClearForProp(tx, tz, 1.3, 2.5, 2.0)) {
        turnstiles.push({ x: Number(tx.toFixed(2)), z: Number(tz.toFixed(2)), rotY: 0 });
        reserveProp(tx, tz);
      }
    }
    // z=21 North Ticket Checkpoint portal turnstiles (flank edges of the 3 gateways, leaving wide 6m centers open!)
    var cpTurnstileX = [16.2, 21.8, 37.2, 45.8, 61.2, 66.8];
    for (var cpt = 0; cpt < cpTurnstileX.length; cpt++) {
      if (isClearForProp(cpTurnstileX[cpt], 21.5, 1.2, 2.5, 1.9)) {
        turnstiles.push({ x: cpTurnstileX[cpt], z: 21.5, rotY: 0 });
        reserveProp(cpTurnstileX[cpt], 21.5);
      }
    }
    // Z-01B Inner Atrium Entry Turnstile Banks framing the Clock Totem between inner columns (33.5 & 49.5)
    var atriumTurnstileX = [35.2, 36.7, 38.2, 44.8, 46.3, 47.8];
    for (var atx = 0; atx < atriumTurnstileX.length; atx++) {
      if (isClearForProp(atriumTurnstileX[atx], 29.5, 1.15, 2.5, 1.9)) {
        turnstiles.push({ x: atriumTurnstileX[atx], z: 29.5, rotY: 0 });
        reserveProp(atriumTurnstileX[atx], 29.5);
      }
    }
    // Concourse east transfer gate turnstile wing (flanking doorway z=54..66)
    var eastTsZ = [47.5, 49.5, 51.5, 68.5];
    for (var et = 0; et < eastTsZ.length; et++) {
      var etx = cB.x1 - 0.85;
      var etz = eastTsZ[et];
      if (isClearForProp(etx, etz, 1.2, 2.5, 2.0)) {
        turnstiles.push({ x: Number(etx.toFixed(2)), z: Number(etz.toFixed(2)), rotY: -Math.PI * 0.5 });
        reserveProp(etx, etz);
      }
    }

    // 3. Dynamic Waiting Benches across Concourse, Corridor & Platform 0
    var benches = [];
    function tryAddBench(x, z, rotY) {
      if (isClearForProp(x, z, 2.4, 3.2, 2.2)) {
        benches.push({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)), rotY: rotY });
        reserveProp(x, z);
      }
    }
    // Grounded benches backed against Z-01B inner column planters & flanking booths (zero floating open-floor benches)
    tryAddBench(31.2, 44.0, 0);
    tryAddBench(51.8, 44.0, 0);
    tryAddBench(31.8, 32.4, 0);
    tryAddBench(51.2, 32.4, 0);
    // East Lounge clustered passenger benches
    tryAddBench(66.5, 28.5, 0);
    tryAddBench(66.5, 42.5, 0);
    // Concourse west & east walls (step 9m, skipping east doorway z=52..68)
    for (var cbz = cB.z0 + 7.5; cbz <= cB.z1 - 6.5; cbz += 9.5) {
      tryAddBench(cB.x0 + 0.65, cbz, Math.PI * 0.5);
      if (cbz < 50.5 || cbz > 69.0) {
        tryAddBench(cB.x1 - 0.65, cbz, -Math.PI * 0.5);
      }
    }
    // Concourse south wall (skipping doorways x=13..21 and x=33..49)
    for (var cbx = cB.x0 + 5.5; cbx <= cB.x1 - 5.5; cbx += 9.5) {
      if ((cbx >= 12.0 && cbx <= 22.5) || (cbx >= 32.0 && cbx <= 50.5)) continue;
      tryAddBench(cbx, cB.z1 - 0.62, 0);
    }
    // Corridor north & south boulevard walls (skipping Dispatch & Tunnel doorways x=92..106 and x=136..150)
    for (var rbx = rB.x0 + 5.5; rbx <= rB.x1 - 5.5; rbx += 9.5) {
      if ((rbx >= 91.5 && rbx <= 106.5) || (rbx >= 135.5 && rbx <= 150.5)) continue;
      tryAddBench(rbx, rB.z0 + 0.62, 0);
      tryAddBench(rbx, rB.z1 - 0.62, 0);
    }
    // Platform 0 grand west wall (skipping doorways z=16..30, z=66..82, z=116..130)
    for (var pbz = pB.z0 + 5.5; pbz <= pB.z1 - 5.5; pbz += 9.5) {
      if ((pbz >= 16.0 && pbz <= 30.5) || (pbz >= 66.0 && pbz <= 82.5) || (pbz >= 116.0 && pbz <= 130.5)) continue;
      tryAddBench(pB.x0 + 0.65, pbz, Math.PI * 0.5);
    }

    // 4. Illuminated Subway Route Map Kiosk & Sub-Zone Overhead Directional Transit Signage
    var wallSigns = [
      // Concourse north illuminated route-map kiosk (mounted flush on north wall face)
      { kind: 'route_map', x: 41.5, y: 1.78, z: cB.z0 + 0.08, rotY: 0, w: 5.6, h: 2.35 },
      // Concourse sub-zone headers (Z-01A Ticket Lobby, Z-01B Clock Atrium, Z-01C Security Bay, Z-01D East Lounge)
      { kind: 'hanging_sign', title: 'B1 检票闸口 · GATE 01–08', sub: 'LINE-00 · 00:00 SUSPENDED · 售票厅 ↑', accent: '#68c8de', x: 41.5, y: 3.22, z: 29.5, rotY: 0, w: 5.6, h: 0.94 },
      { kind: 'hanging_sign', title: '← 西侧安检 · 东侧换乘 B2 →', sub: 'Z-01B ATRIUM  ·  SUB-04 旧变电间 ↓', accent: '#d6b274', x: 41.5, y: 3.16, z: 48.6, rotY: 0, w: 5.2, h: 0.92 },
      { kind: 'hanging_sign', title: 'B1 检票大厅 · 零号换乘中枢', sub: 'CONCOURSE Z-01A  ·  TICKET CHECKPOINT', accent: '#68c8de', x: 41.5, y: 2.98, z: 19.6, rotY: 0, w: 5.4, h: 0.98 },
      { kind: 'hanging_sign', title: '自助售票机 / 补票窗口', sub: 'Z-01A  ·  TICKET MACHINES', accent: '#68c8de', x: 19.5, y: 2.94, z: 14.5, rotY: 0, w: 4.4, h: 0.94 },
      { kind: 'hanging_sign', title: '← 西侧安检与行李扫描区', sub: 'Z-01C  ·  SECURITY & X-RAY BAY', accent: '#ffaa3b', x: 14.0, y: 2.94, z: 39.5, rotY: 0, w: 4.4, h: 0.94 },
      { kind: 'hanging_sign', title: '东侧商业候车廊 · 便利店停业 →', sub: 'Z-01D  ·  EAST PASSENGER LOUNGE', accent: '#d6b274', x: 68.0, y: 2.94, z: 39.5, rotY: 0, w: 4.6, h: 0.94 },
      // Concourse east & south exit headers above Corridor & Substation gateways
      { kind: 'sign', title: 'B2 换乘长廊 →', sub: 'CORRIDOR · Z-02', accent: '#f0c46c', x: cB.x1 + 0.92, y: 2.68, z: 60.5, rotY: -Math.PI * 0.5, w: 4.4, h: 0.94 },
      { kind: 'sign', title: '旧变电间 ↓', sub: 'SUBSTATION · Z-04', accent: '#6e9eff', x: 41.5, y: 2.68, z: cB.z1 + 0.92, rotY: Math.PI, w: 4.4, h: 0.94 },
      // Corridor overhead hanging directional transit signs along the central boulevard & galleries
      { kind: 'hanging_sign', title: '← B1 检票大厅   ·   0号站台 →', sub: 'Z-02A WEST GATE · DISPATCH ↑', accent: '#6fd8ea', x: 96.5, y: 2.94, z: 74.5, rotY: 0, w: 4.6, h: 1.0 },
      { kind: 'hanging_sign', title: '中枢换乘十字厅 · 商业廊道', sub: 'Z-02C CENTRAL TRANSFER HUB', accent: '#d6b274', x: 122.5, y: 2.94, z: 74.5, rotY: 0, w: 4.6, h: 1.0 },
      { kind: 'hanging_sign', title: '前导区 · 0号站台主通道 →', sub: 'Z-02E PLATFORM 00 EXPRESS', accent: '#f0c46c', x: 148.5, y: 2.94, z: 74.5, rotY: 0, w: 4.6, h: 1.0 },
      // Dispatch sub-zone headers (Z-03A Server Vault, Z-03B Control Deck, Z-03C Archive Room)
      { kind: 'hanging_sign', title: '西侧中继服务器库 · 高压机柜', sub: 'Z-03A  ·  RELAY SERVER VAULT', accent: '#52c4a2', x: 95.0, y: 2.94, z: 22.5, rotY: 0, w: 4.4, h: 0.94 },
      { kind: 'hanging_sign', title: '信号调度中枢 · 道岔联锁台', sub: 'Z-03B  ·  CONTROL DECK · OVERRIDE A', accent: '#52c4a2', x: 122.5, y: 2.94, z: 24.5, rotY: 0, w: 4.8, h: 1.0 },
      { kind: 'hanging_sign', title: '东侧时刻表与轨道档案室', sub: 'Z-03C  ·  TIMETABLE ARCHIVE', accent: '#52c4a2', x: 149.0, y: 2.94, z: 18.5, rotY: 0, w: 4.4, h: 0.94 },
      // Substation sub-zone headers (Z-04A Workshop, Z-04B Switchgear, Z-04C Transformer Hall, Z-04D Cooling)
      { kind: 'hanging_sign', title: '北侧工务检修与线缆储备区', sub: 'Z-04A  ·  MAINTENANCE WORKSHOP', accent: '#6e9eff', x: 41.5, y: 2.94, z: 83.5, rotY: 0, w: 4.8, h: 0.96 },
      { kind: 'hanging_sign', title: '西侧高压开关柜廊 · 勿触刀闸', sub: 'Z-04B  ·  HV SWITCHGEAR CORRIDOR', accent: '#ffaa3b', x: 15.0, y: 2.94, z: 112.5, rotY: 0, w: 4.4, h: 0.94 },
      { kind: 'hanging_sign', title: '旧高压变电主厅 · 严禁靠近母线', sub: 'Z-04C  ·  TRANSFORMER HALL · OVERRIDE B', accent: '#6e9eff', x: 41.5, y: 2.94, z: 110.5, rotY: 0, w: 4.8, h: 1.0 },
      { kind: 'hanging_sign', title: '东侧绝缘油冷却与电容间', sub: 'Z-04D  ·  COOLING & CAPACITOR BAY', accent: '#6e9eff', x: 67.5, y: 2.94, z: 112.5, rotY: 0, w: 4.4, h: 0.94 },
      // Tunnel sub-zone headers (Z-05A Pipe Gallery, Z-05B Valve Chamber, Z-05C Culvert)
      { kind: 'hanging_sign', title: '废弃应急管廊 · 蒸汽高压管道', sub: 'Z-05A  ·  NORTH PIPE GALLERY', accent: '#a884e0', x: 122.5, y: 2.92, z: 114.5, rotY: 0, w: 4.6, h: 0.96 },
      { kind: 'hanging_sign', title: '西侧蓄水阀门室 · 泄洪暗渠', sub: 'Z-05B  ·  VALVE & CULVERT CHAMBER', accent: '#a884e0', x: 96.0, y: 2.92, z: 133.5, rotY: 0, w: 4.4, h: 0.94 },
      { kind: 'hanging_sign', title: '中央排水暗渠 · 检修死角', sub: 'Z-05C  ·  DRAINAGE CULVERT ALCOVE', accent: '#a884e0', x: 122.5, y: 2.92, z: 133.5, rotY: 0, w: 4.4, h: 0.94 },
      // Platform 0 overhead hanging warning & timetable boards (cleanly centered between canopy ribs)
      { kind: 'hanging_sign', title: '零号站台北段 · 应急脱出站厅', sub: 'Z-06A  ·  NORTH EXIT TERMINAL', accent: '#ff5264', x: 186.5, y: 2.96, z: 25.0, rotY: 0, w: 4.6, h: 1.0 },
      { kind: 'hanging_sign', title: '00:00 停摆列车 · 延时未知', sub: 'NEXT TRAIN · LINE-00', accent: '#ffaa44', x: 186.5, y: 2.96, z: 51.0, rotY: 0, w: 4.6, h: 1.0 },
      { kind: 'hanging_sign', title: '零号站台中段 · 候车月台主区', sub: 'Z-06B  ·  CENTRAL BOARDING BAY', accent: '#68c8de', x: 186.5, y: 2.96, z: 75.0, rotY: 0, w: 4.6, h: 1.0 },
      { kind: 'hanging_sign', title: '南段货运信号端 · 严禁滞留', sub: 'Z-06C  ·  SOUTH FREIGHT END', accent: '#ff5264', x: 186.5, y: 2.96, z: 105.0, rotY: 0, w: 4.6, h: 1.0 },
      { kind: 'hanging_sign', title: '零号列车折返区 · 警戒边界', sub: 'PLATFORM 00 · TERMINAL', accent: '#ff5264', x: 186.5, y: 2.96, z: 131.0, rotY: 0, w: 4.6, h: 1.0 }
    ];

    // 5. Signal Dispatch CRT Monitor Banks (4 banks along Dispatch north wall)
    var crtBanks = [
      { x: 96.5,  y: 1.78, z: dB.z0 + 0.12, rotY: 0, w: 5.6, h: 1.65 },
      { x: 113.5, y: 1.78, z: dB.z0 + 0.12, rotY: 0, w: 5.6, h: 1.65 },
      { x: 131.5, y: 1.78, z: dB.z0 + 0.12, rotY: 0, w: 5.6, h: 1.65 },
      { x: 148.5, y: 1.78, z: dB.z0 + 0.12, rotY: 0, w: 5.6, h: 1.65 }
    ];

    // 6. Dynamic Server Racks along Dispatch perimeter walls
    var serverRacks = [];
    function tryAddRack(x, z, rotY) {
      if (isClearForProp(x, z, 1.15, 2.5, 2.0)) {
        serverRacks.push({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)), rotY: rotY });
        reserveProp(x, z);
      }
    }
    for (var dnx = dB.x0 + 1.0; dnx <= dB.x0 + 7.5; dnx += 1.4) {
      tryAddRack(dnx, dB.z0 + 0.65, 0);
    }
    for (var dnx2 = dB.x1 - 7.5; dnx2 <= dB.x1 - 1.0; dnx2 += 1.4) {
      tryAddRack(dnx2, dB.z0 + 0.65, 0);
    }
    for (var dwz = dB.z0 + 3.0; dwz <= dB.z1 - 3.0; dwz += 4.2) {
      tryAddRack(dB.x0 + 0.65, dwz, Math.PI * 0.5);
      // Skip east doorway to Platform 0 (z=17..29)
      if (dwz < 16.5 || dwz > 30.0) {
        tryAddRack(dB.x1 - 0.65, dwz, -Math.PI * 0.5);
      }
    }

    // 7. 6 High-Voltage Copper-Coil Transformers mounted atop Substation's 6 2x2 transformer blocks
    var transformers = [
      { x: 19.0, z: 95.0 },
      { x: 41.0, z: 95.0 },
      { x: 63.0, z: 95.0 },
      { x: 19.0, z: 125.0 },
      { x: 41.0, z: 125.0 },
      { x: 63.0, z: 125.0 }
    ];

    // 8. Dynamic Maintenance Crates & Industrial Equipment Stacks across Tunnel, Substation & Service Corners
    var cratesAndBarricades = [];
    function tryAddCrate(x, z, rotY) {
      if (isClearForProp(x, z, 1.35, 3.0, 2.2)) {
        cratesAndBarricades.push({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)), rotY: rotY });
        reserveProp(x, z);
      }
    }
    // Tunnel north & south walls (skipping north doorways x=92..106 and x=136..150)
    for (var tcx = tB.x0 + 2.5; tcx <= tB.x1 - 2.5; tcx += 7.5) {
      if (!((tcx >= 91.5 && tcx <= 106.5) || (tcx >= 135.5 && tcx <= 150.5))) {
        tryAddCrate(tcx, tB.z0 + 0.82, (hash2D(tcx, tB.z0) - 0.5) * 0.5);
      }
      tryAddCrate(tcx + 1.4, tB.z1 - 0.85, (hash2D(tcx, tB.z1) - 0.5) * 0.5);
    }
    // Substation perimeter maintenance alcoves (skipping east doorway z=114..130)
    for (var scz = sB.z0 + 4.5; scz <= sB.z1 - 4.5; scz += 10.5) {
      tryAddCrate(sB.x0 + 0.85, scz, (hash2D(sB.x0, scz) - 0.5) * 0.4);
      if (scz < 113.5 || scz > 130.5) {
        tryAddCrate(sB.x1 - 0.85, scz, (hash2D(sB.x1, scz) - 0.5) * 0.4);
      }
    }
    // Concourse & Corridor tactical service crates tucked beside pillars/corners
    var extraCrateAnchors = [
      [cB.x0 + 1.2, cB.z0 + 1.2], [cB.x1 - 1.2, cB.z0 + 1.2],
      [cB.x0 + 1.2, cB.z1 - 1.2], [cB.x1 - 1.2, cB.z1 - 1.2],
      [rB.x0 + 1.2, rB.z0 + 1.2], [rB.x1 - 1.2, rB.z0 + 1.2],
      [rB.x0 + 1.2, rB.z1 - 1.2], [rB.x1 - 1.2, rB.z1 - 1.2],
      [pB.x0 + 1.2, pB.z0 + 1.4], [pB.x0 + 1.2, pB.z1 - 1.4]
    ];
    for (var ec = 0; ec < extraCrateAnchors.length; ec++) {
      tryAddCrate(extraCrateAnchors[ec][0], extraCrateAnchors[ec][1], (ec % 2 === 0 ? 0.18 : -0.22));
    }

    // 9. Dynamic Safety Bollards & Metro Stanchions (framing colonnades & Platform 0 bay edges)
    var bollards = [];
    function tryAddBollard(x, z) {
      if (isClearForProp(x, z, 1.6, 3.2, 2.2)) {
        bollards.push({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) });
        reserveProp(x, z);
      }
    }
    // Concourse central promenade stanchions
    var concBollards = [
      [34.5, 34.5], [48.5, 34.5], [34.5, 42.5], [48.5, 42.5],
      [23.5, 18.5], [59.5, 18.5], [23.5, 54.5], [59.5, 54.5]
    ];
    for (var cb = 0; cb < concBollards.length; cb++) {
      tryAddBollard(concBollards[cb][0], concBollards[cb][1]);
    }
    // Corridor boulevard guidance bollards
    for (var rbx2 = 98.5; rbx2 <= 146.5; rbx2 += 12.0) {
      tryAddBollard(rbx2, 65.5);
      tryAddBollard(rbx2, 83.5);
    }
    // Platform 0 boarding zone bollards along colonnade aisle (strictly west of hazard strip)
    for (var pbz2 = 14.5; pbz2 <= 136.5; pbz2 += 14.0) {
      tryAddBollard(183.5, pbz2);
      tryAddBollard(201.5, pbz2);
    }

    // 9B. Bespoke Zone-Specific Architectural Storytelling Set-Pieces across all 21 Sub-Zones
    function collectWalkable(list, candidates, sep, spPad, itPad) {
      for (var i = 0; i < candidates.length; i++) {
        var pt = candidates[i];
        if (isClearForProp(pt.x, pt.z, sep || 1.3, spPad || 2.8, itPad || 2.0)) {
          list.push(pt);
          reserveProp(pt.x, pt.z);
        }
      }
    }

    // Z-01 Concourse Set-Pieces
    var tvmBanks = [];
    collectWalkable(tvmBanks, [
      { x: 26.5, z: 4.85, rotY: 0 }, { x: 28.6, z: 4.85, rotY: 0 }, { x: 30.7, z: 4.85, rotY: 0 },
      { x: 52.3, z: 4.85, rotY: 0 }, { x: 54.4, z: 4.85, rotY: 0 }, { x: 56.5, z: 4.85, rotY: 0 }
    ], 1.1, 2.5, 2.0);
    var metalDetectors = [];
    collectWalkable(metalDetectors, [
      { x: 19.6, z: 31.8, rotY: Math.PI * 0.5 },
      { x: 19.6, z: 34.8, rotY: Math.PI * 0.5 },
      { x: 19.6, z: 48.8, rotY: Math.PI * 0.5 },
      { x: 19.6, z: 51.8, rotY: Math.PI * 0.5 }
    ], 1.3, 2.5, 1.9);
    var vendingMachines = [];
    collectWalkable(vendingMachines, [
      { x: 51.35, z: 36.2, rotY: -Math.PI * 0.5 },
      { x: 51.35, z: 38.6, rotY: -Math.PI * 0.5 },
      { x: 77.3, z: 23.8, rotY: -Math.PI * 0.5 },
      { x: 77.3, z: 25.4, rotY: -Math.PI * 0.5 },
      { x: 77.3, z: 35.8, rotY: -Math.PI * 0.5 },
      { x: 77.3, z: 37.4, rotY: -Math.PI * 0.5 },
      { x: 112.5, z: 97.4, rotY: Math.PI },
      { x: 131.5, z: 97.4, rotY: Math.PI }
    ], 1.1, 2.5, 1.9);
    var luggageClusters = [];
    collectWalkable(luggageClusters, [
      { x: 8.2, z: 32.2, rotY: 0.35 }, { x: 8.5, z: 49.4, rotY: -0.42 },
      { x: 15.2, z: 27.6, rotY: 0.22 }, { x: 15.6, z: 56.4, rotY: -0.25 },
      { x: 31.4, z: 40.6, rotY: 0.42 }, { x: 51.6, z: 40.6, rotY: -0.34 },
      { x: 16.4, z: 42.6, rotY: 0.28 }, { x: 64.8, z: 52.5, rotY: -0.40 }
    ], 1.2, 2.8, 1.9);

    // Z-02 Corridor Set-Pieces (Mud-Smeared Ad Lightboxes, Fire Hydrant Cabinets, Payphone Alcoves)
    var adLightboxes = [
      { x: 110.5, y: 1.65, z: 63.06, rotY: 0, variant: 0 },
      { x: 133.5, y: 1.65, z: 63.06, rotY: 0, variant: 1 },
      { x: 110.5, y: 1.65, z: 85.94, rotY: Math.PI, variant: 2 },
      { x: 133.5, y: 1.65, z: 85.94, rotY: Math.PI, variant: 0 },
      { x: 112.5, y: 1.65, z: rB.z0 + 0.12, rotY: 0, variant: 1 },
      { x: 122.5, y: 1.65, z: rB.z0 + 0.12, rotY: 0, variant: 2 },
      { x: 131.5, y: 1.65, z: rB.z0 + 0.12, rotY: 0, variant: 0 },
      { x: 122.5, y: 1.65, z: rB.z1 + 0.88, rotY: Math.PI, variant: 1 }
    ];
    var fireCabinets = [
      { x: 25.0, y: 1.35, z: cB.z0 + 0.12, rotY: 0 },
      { x: 58.0, y: 1.35, z: cB.z0 + 0.12, rotY: 0 },
      { x: 88.5, y: 1.35, z: rB.z0 + 0.12, rotY: 0 },
      { x: 155.5, y: 1.35, z: rB.z0 + 0.12, rotY: 0 },
      { x: 168.12, y: 1.35, z: 42.0, rotY: Math.PI * 0.5 },
      { x: 168.12, y: 1.35, z: 98.0, rotY: Math.PI * 0.5 }
    ];
    var payphones = [];
    collectWalkable(payphones, [
      { x: 118.5, z: 97.5, rotY: Math.PI },
      { x: 120.5, z: 97.5, rotY: Math.PI },
      { x: 124.5, z: 97.5, rotY: Math.PI },
      { x: 126.5, z: 97.5, rotY: Math.PI }
    ], 1.1, 2.5, 1.9);

    // Z-03 Dispatch Set-Pieces (Archive Filing Cabinets, Vault Server Stacks, Console Desks & 43.2Hz Mic)
    var filingCabinets = [];
    collectWalkable(filingCabinets, [
      { x: 141.5, z: 4.8, rotY: 0 }, { x: 143.0, z: 4.8, rotY: 0 }, { x: 144.5, z: 4.8, rotY: 0 },
      { x: 156.5, z: 36.5, rotY: -Math.PI * 0.5 }, { x: 156.5, z: 38.2, rotY: -Math.PI * 0.5 }, { x: 156.5, z: 40.0, rotY: -Math.PI * 0.5 }
    ], 1.0, 2.5, 1.9);

    // Z-04 Substation Set-Pieces (West HV Switchgear Cabinets, East Cooling Oil Tanks, North Workshop Cable Spools)
    var switchgearCabinets = [];
    for (var swz = 94.5; swz <= 139.5; swz += 4.8) {
      if (isClearForProp(sB.x0 + 0.72, swz, 1.1, 2.5, 2.0)) {
        switchgearCabinets.push({ x: Number((sB.x0 + 0.72).toFixed(2)), z: Number(swz.toFixed(2)), rotY: Math.PI * 0.5 });
        reserveProp(sB.x0 + 0.72, swz);
      }
    }
    var coolingTanks = [];
    var tankZ = [95.5, 101.5, 108.5, 134.5, 139.5, 142.5];
    for (var tki = 0; tki < tankZ.length; tki++) {
      if (isClearForProp(sB.x1 - 1.15, tankZ[tki], 1.4, 2.5, 2.0)) {
        coolingTanks.push({ x: Number((sB.x1 - 1.15).toFixed(2)), z: tankZ[tki] });
        reserveProp(sB.x1 - 1.15, tankZ[tki]);
      }
    }
    var cableSpools = [];
    collectWalkable(cableSpools, [
      { x: 10.5, z: 81.5 }, { x: 25.5, z: 83.5 }, { x: 52.5, z: 81.5 },
      { x: 64.5, z: 83.5 }, { x: 73.5, z: 88.2 }
    ], 1.5, 2.5, 2.0);

    // Z-05 Tunnel Set-Pieces (Maintenance Drums & Pipe Valve Manifolds)
    var maintenanceDrums = [];
    collectWalkable(maintenanceDrums, [
      { x: 89.2, z: 121.8 }, { x: 90.4, z: 122.2 }, { x: 109.5, z: 122.0 }, { x: 111.0, z: 122.2 },
      { x: 132.0, z: 122.0 }, { x: 133.4, z: 121.8 }, { x: 151.5, z: 122.0 }, { x: 152.8, z: 121.8 },
      { x: 89.5, z: 127.5 }, { x: 98.5, z: 141.5 }, { x: 116.5, z: 141.5 }, { x: 126.5, z: 141.5 },
      { x: 144.5, z: 141.5 }, { x: 154.5, z: 127.5 }
    ], 1.0, 2.5, 1.9);
    var valveManifolds = [
      { x: 92.5, z: 123.6, rotY: Math.PI },
      { x: 112.0, z: 123.6, rotY: Math.PI },
      { x: 133.0, z: 123.6, rotY: Math.PI },
      { x: 152.0, z: 123.6, rotY: Math.PI },
      { x: 92.5, z: 125.4, rotY: 0 },
      { x: 112.0, z: 125.4, rotY: 0 },
      { x: 133.0, z: 125.4, rotY: 0 },
      { x: 152.0, z: 125.4, rotY: 0 }
    ];

    // Z-06 Platform 0 Set-Pieces (Freight Tie Stacks & Signal Relay Cabinets in South Freight End)
    var freightStacks = [];
    collectWalkable(freightStacks, [
      { x: 172.5, z: 112.5, rotY: 0.08 },
      { x: 172.5, z: 121.5, rotY: -0.05 },
      { x: 172.5, z: 131.5, rotY: 0.12 },
      { x: 184.5, z: 138.5, rotY: 0 },
      { x: 192.5, z: 140.5, rotY: 0.15 }
    ], 1.6, 2.5, 2.2);

    var zoneSetPieces = {
      concourse: {
        ticketBooth: { x: 41.5, z: 12.5, w: 7.0, d: 3.0 },
        atriumDutyBooth: { x: 29.5, z: 37.5, w: 3.0, d: 5.0 },
        atriumNewsstand: { x: 53.5, z: 37.5, w: 3.0, d: 5.0 },
        atriumClockPlinth: { x: 41.5, z: 29.5 },
        atriumGirders: [
          { x: 41.5, z: 21.5, spanX: 38.0 },
          { x: 41.5, z: 29.5, spanX: 38.0 },
          { x: 41.5, z: 45.5, spanX: 38.0 },
          { x: 41.5, z: 60.5, spanX: 38.0 }
        ],
        tvmBanks: tvmBanks,
        xrayScanners: [{ x: 12.0, z: 32.0 }, { x: 12.0, z: 49.0 }],
        metalDetectors: metalDetectors,
        kiosks: [
          { x: 75.0, z: 30.0, title: '零号便利店 · 停业', sub: 'CONVENIENCE KIOSK · CLOSED', accent: '#68c8de' },
          { x: 75.0, z: 43.0, title: '地铁报刊亭 · 封存', sub: 'NEWSSTAND · SEALED', accent: '#d6b274' }
        ],
        vendingMachines: vendingMachines,
        luggageClusters: luggageClusters
      },
      corridor: {
        adLightboxes: adLightboxes,
        fireCabinets: fireCabinets,
        payphones: payphones
      },
      dispatch: {
        consoleDesks: [{ x: 116.0, z: 15.0 }, { x: 129.0, z: 15.0 }],
        broadcastMic: { x: 122.5, z: 17.4 },
        vaultRackBlocks: [{ x: 91.0, z: 15.5, d: 7.0 }, { x: 99.0, z: 15.5, d: 7.0 }],
        archiveMapTable: { x: 149.5, z: 24.5, w: 5.0, d: 3.0 },
        filingCabinets: filingCabinets
      },
      substation: {
        switchgearCabinets: switchgearCabinets,
        coolingTanks: coolingTanks,
        cableSpools: cableSpools
      },
      tunnel: {
        maintenanceDrums: maintenanceDrums,
        valveManifolds: valveManifolds
      },
      platform0: {
        stationmasterBooth: { x: 173.5, z: 15.5, w: 5.0, d: 5.0 },
        waitingShelters: [
          { x: 186.5, z: 54.5 },
          { x: 186.5, z: 92.5 }
        ],
        freightStacks: freightStacks
      }
    };

    // 10. Dynamic Stratified Style-1 Damp Floor Puddles & Concrete Fracture Crack Decals
    // Strictly walkable & clear of rail_trench (grid !== 4 and x <= hazardX - 1.5)
    var puddles = [];
    var crackDecals = [];
    var zoneList = [
      { id: 'concourse',  b: cB, cols: 4, rows: 3 },
      { id: 'corridor',   b: rB, cols: 4, rows: 3 },
      { id: 'dispatch',   b: dB, cols: 3, rows: 2 },
      { id: 'substation', b: sB, cols: 4, rows: 3 },
      { id: 'tunnel',     b: tB, cols: 3, rows: 2 },
      { id: 'platform0',  b: pB, cols: 2, rows: 7 }
    ];

    function isDecalFloorSafe(x, z) {
      if (x >= railMinX - 1.6) return false;
      return isWalkableSafe(x, z) &&
        isWalkableSafe(x - 0.6, z) && isWalkableSafe(x + 0.6, z) &&
        isWalkableSafe(x, z - 0.6) && isWalkableSafe(x, z + 0.6);
    }

    // Hero spawn-plaza damp puddles so opening frame always exhibits Style-1 wet reflections
    var heroPuddles = [
      { x: 35.8, z: 35.2, sx: 2.7, sz: 1.90, rot: 0.28 },
      { x: 47.4, z: 34.4, sx: 2.4, sz: 1.65, rot: -0.36 },
      { x: 39.2, z: 42.4, sx: 2.3, sz: 1.60, rot: 0.16 }
    ];
    for (var hp = 0; hp < heroPuddles.length; hp++) {
      if (isDecalFloorSafe(heroPuddles[hp].x, heroPuddles[hp].z)) {
        puddles.push(heroPuddles[hp]);
      }
    }

    for (var zi = 0; zi < zoneList.length; zi++) {
      var zl = zoneList[zi];
      var zb = zl.b;
      var maxX = zl.id === 'platform0' ? Math.min(zb.x1 - 2.0, hazardX - 2.0) : (zb.x1 - 2.0);
      var minX = zb.x0 + 2.0;
      var minZ = zb.z0 + 2.0;
      var maxZ = zb.z1 - 2.0;
      var spanX = Math.max(4, maxX - minX);
      var spanZ = Math.max(4, maxZ - minZ);

      for (var r = 0; r < zl.rows; r++) {
        for (var c = 0; c < zl.cols; c++) {
          var seedA = hash2D(zi * 31 + c * 7 + 3, r * 19 + 5);
          var seedB = hash2D(zi * 17 + c * 13 + 11, r * 23 + 9);
          var px = minX + ((c + 0.25 + seedA * 0.5) / zl.cols) * spanX;
          var pz = minZ + ((r + 0.25 + seedB * 0.5) / zl.rows) * spanZ;
          // Nudge into nearest walkable tile if candidate landed on a pillar/cover
          var foundP = false;
          var offsets = [[0, 0], [2.2, 0], [-2.2, 0], [0, 2.2], [0, -2.2], [3.2, 2.2]];
          for (var po = 0; po < offsets.length; po++) {
            var txp = px + offsets[po][0];
            var tzp = pz + offsets[po][1];
            if (isDecalFloorSafe(txp, tzp)) {
              puddles.push({
                x: Number(txp.toFixed(2)),
                z: Number(tzp.toFixed(2)),
                sx: Number((2.1 + seedA * 0.95).toFixed(2)),
                sz: Number((1.45 + seedB * 0.65).toFixed(2)),
                rot: Number(((seedA - 0.5) * 1.4).toFixed(2))
              });
              foundP = true;
              break;
            }
          }

          // Generate 1-2 crack decals per cell at offset jitter
          var cx1 = minX + ((c + 0.18 + seedB * 0.62) / zl.cols) * spanX;
          var cz1 = minZ + ((r + 0.18 + seedA * 0.62) / zl.rows) * spanZ;
          for (var co = 0; co < offsets.length; co++) {
            var txc = cx1 + offsets[co][0];
            var tzc = cz1 + offsets[co][1];
            if (isDecalFloorSafe(txc, tzc)) {
              crackDecals.push({
                x: Number(txc.toFixed(2)),
                z: Number(tzc.toFixed(2)),
                sx: Number((1.9 + seedB * 0.65).toFixed(2)),
                sz: Number((1.5 + seedA * 0.50).toFixed(2)),
                rot: Number(((seedB - 0.5) * 1.8).toFixed(2))
              });
              break;
            }
          }
          if (!foundP) {
            // Secondary crack fallback for dense areas
            var cx2 = minX + ((c + 0.5) / zl.cols) * spanX;
            var cz2 = minZ + ((r + 0.5) / zl.rows) * spanZ;
            if (isDecalFloorSafe(cx2, cz2)) {
              crackDecals.push({
                x: Number(cx2.toFixed(2)),
                z: Number(cz2.toFixed(2)),
                sx: 2.1,
                sz: 1.6,
                rot: 0.35
              });
            }
          }
        }
      }
    }

    // Count tactical waist-high cover & glazed architectural partition runs from StationMap
    var tacticalCoverCount = 0;
    var partitionRunCount = 0;
    if (mapApi && typeof mapApi.getWalls === 'function') {
      var wallRuns = mapApi.getWalls() || [];
      for (var wr = 0; wr < wallRuns.length; wr++) {
        if (wallRuns[wr] && (wallRuns[wr].cover || (Number(wallRuns[wr].h) > 0 && Number(wallRuns[wr].h) <= 1.5))) {
          tacticalCoverCount++;
        } else if (wallRuns[wr] && wallRuns[wr].partition) {
          partitionRunCount++;
        }
      }
    }

    var subZoneSetPieces = {
      concourse: 1 + tvmBanks.length + zoneSetPieces.concourse.xrayScanners.length + metalDetectors.length + zoneSetPieces.concourse.kiosks.length + vendingMachines.length + luggageClusters.length,
      corridor: adLightboxes.length + fireCabinets.length + payphones.length,
      dispatch: zoneSetPieces.dispatch.consoleDesks.length + 1 + zoneSetPieces.dispatch.vaultRackBlocks.length + 1 + filingCabinets.length,
      substation: switchgearCabinets.length + coolingTanks.length + cableSpools.length,
      tunnel: maintenanceDrums.length + valveManifolds.length,
      platform0: 1 + zoneSetPieces.platform0.waitingShelters.length + freightStacks.length
    };

    return {
      turnstiles: turnstiles,
      benches: benches,
      wallSigns: wallSigns,
      crtBanks: crtBanks,
      serverRacks: serverRacks,
      transformers: transformers,
      cratesAndBarricades: cratesAndBarricades,
      bollards: bollards,
      landmarks: landmarks,
      puddles: puddles,
      crackDecals: crackDecals,
      zoneSetPieces: zoneSetPieces,
      meta: {
        gridW: gridW,
        gridH: gridH,
        area: gridW * gridH,
        dynamicGenerated: true,
        tacticalCoverCount: tacticalCoverCount,
        partitionRunCount: partitionRunCount,
        subZoneSetPieces: subZoneSetPieces
      }
    };
  }

  function getZonePropSpecs(mapApiArg) {
    return generateDynamicZoneProps(mapApiArg);
  }

  /* --------------------------------------------------------------------------
   * 1. Build Station Geometry, PBR Surfaces, Pillar Cladding, Waist-High Cover
   *    Barricades & Instanced Architectural Props (Optimized for 224x152!)
   * -------------------------------------------------------------------------- */
  function buildStation(session, opts) {
    var THREE = session.THREE;
    var mapApi = session.mapApi;
    var cfg = opts || {};
    var WALL_HEIGHT = cfg.WALL_HEIGHT || 3.2;
    var FLOOR_Y = cfg.FLOOR_Y || 0.0;
    var PLATFORM_Y = cfg.PLATFORM_Y || 0.04;
    var HAZARD_Y = cfg.HAZARD_Y || 0.05;
    var RAIL_Y = cfg.RAIL_Y || -0.58;
    var PLATFORM_START_X = mapApi.PLATFORM_START_X || 168;
    var TRAIN_X = cfg.TRAIN_X || mapApi.TRAIN_X || 213.5;

    var gridW = mapApi.GRID_W || 224;
    var gridH = mapApi.GRID_H || 152;
    var grid = (typeof mapApi.getGrid === 'function' ? mapApi.getGrid() : null) || [];
    var walls = (typeof mapApi.getWalls === 'function' ? mapApi.getWalls() : null) || [];
    var dummy = session._dummy;

    function readCell(gx, gz) {
      if (gx < 0 || gz < 0 || gx >= gridW || gz >= gridH) return 1;
      if (Array.isArray(grid[gz])) return grid[gz][gx];
      return grid[gz * gridW + gx];
    }

    var floorBuckets = { 0: [], 2: [], 3: [], 4: [] };
    var wallTileMap = Object.create(null);

    for (var gz = 0; gz < gridH; gz++) {
      for (var gx = 0; gx < gridW; gx++) {
        var cell = readCell(gx, gz);
        if (cell === 1) {
          if (walls.length === 0) {
            wallTileMap[gx + ',' + gz] = { gx: gx, gz: gz, neon: false, h: WALL_HEIGHT, isPillar: false, isCover: false };
          }
        } else {
          var bKey = (cell === 2 || cell === 3 || cell === 4) ? cell : 0;
          floorBuckets[bKey].push({ gx: gx, gz: gz });
        }
      }
    }

    // Parse merged walls, colonnade pillars (h=2.6), and waist-high tactical cover barricades (h=1.25, cover=true)
    if (walls.length > 0) {
      var hasHalf = false;
      var hasZeroSpan = false;
      for (var wi = 0; wi < walls.length; wi++) {
        var wl = walls[wi];
        if ((wl.x === 0 && (wl.w || 1) > 1) || (wl.z === 0 && (wl.d || 1) > 1)) hasZeroSpan = true;
        if (Math.abs((wl.x % 1) - 0.5) < 0.02 || Math.abs((wl.z % 1) - 0.5) < 0.02) hasHalf = true;
      }
      var wallsUseCenter = hasHalf && !hasZeroSpan;

      for (var wj = 0; wj < walls.length; wj++) {
        var wObj = walls[wj];
        var ww = Math.max(1, Math.round(wObj.w || 1));
        var wd = Math.max(1, Math.round(wObj.d || 1));
        var startX = wallsUseCenter ? Math.round(wObj.x - ww * 0.5) : Math.round(wObj.x);
        var startZ = wallsUseCenter ? Math.round(wObj.z - wd * 0.5) : Math.round(wObj.z);
        var wh = Number(wObj.h) || WALL_HEIGHT;
        var isCover = !!wObj.cover || wh <= 1.5;
        var isPartition = !isCover && (!!wObj.partition || Math.abs(wh - 2.35) < 0.08);
        var isPillar = !isCover && !isPartition && (wh < WALL_HEIGHT - 0.15);
        for (var dz = 0; dz < wd; dz++) {
          for (var dx = 0; dx < ww; dx++) {
            var tx = startX + dx;
            var tz = startZ + dz;
            if (tx >= 0 && tx < gridW && tz >= 0 && tz < gridH) {
              var k = tx + ',' + tz;
              if (!wallTileMap[k]) {
                wallTileMap[k] = { gx: tx, gz: tz, neon: !!wObj.neon, h: wh, isPillar: isPillar, isCover: isCover, isPartition: isPartition };
              } else {
                if (wObj.neon) wallTileMap[k].neon = true;
                if (wObj.h) wallTileMap[k].h = wh;
                if (isCover) { wallTileMap[k].isCover = true; wallTileMap[k].isPillar = false; wallTileMap[k].isPartition = false; }
                else if (isPartition && !wallTileMap[k].isCover) { wallTileMap[k].isPartition = true; wallTileMap[k].isPillar = false; }
                else if (isPillar && !wallTileMap[k].isCover && !wallTileMap[k].isPartition) wallTileMap[k].isPillar = true;
              }
            }
          }
        }
      }
    }

    var spritesApi = INFINITY.PixelSprites || null;
    function getNormal(name) {
      if (spritesApi && typeof spritesApi.getTileNormalTexture === 'function') {
        return spritesApi.getTileNormalTexture(name);
      }
      return null;
    }

    function getRoughness(name) {
      if (spritesApi && typeof spritesApi.getTileRoughnessTexture === 'function') {
        return spritesApi.getTileRoughnessTexture(name);
      }
      return null;
    }

    // --- 1A. PBR INSTANCED FLOORS WITH NORMAL + ROUGHNESS MAPS & PER-TILE VARIATION ---
    var tileGeo = session.trackGeo(new THREE.PlaneGeometry(1, 1));
    tileGeo.rotateX(-Math.PI / 2);

    var floorSpecs = [
      { key: 0, tex: 'floor_slate',    y: FLOOR_Y,    col: '#262e3c', matColor: 0x9fb8c6, rough: 0.92, metal: 0.06, nScale: 0.70, varyRot: true },
      { key: 2, tex: 'floor_platform', y: PLATFORM_Y, col: '#2d3440', matColor: 0x89a8b8, rough: 0.92, metal: 0.06, nScale: 0.74, varyRot: false },
      { key: 3, tex: 'floor_hazard',   y: HAZARD_Y,   col: '#c29332', matColor: 0xcabaa0, rough: 0.86, metal: 0.08, nScale: 0.80, varyRot: false },
      { key: 4, tex: 'floor_rail',     y: RAIL_Y,     col: '#151820', matColor: 0xc8d4e0, rough: 0.95, metal: 0.08, nScale: 1.15, varyRot: true }
    ];

    var instColor = new THREE.Color();
    var ZONE_FLOOR_TINT = {
      concourse:  [0.95, 1.01, 1.09],
      corridor:   [1.10, 1.00, 0.85],
      dispatch:   [0.80, 1.05, 0.96],
      substation: [0.85, 0.92, 1.08],
      tunnel:     [0.82, 0.78, 0.96],
      platform0:  [1.00, 1.02, 1.04]
    };
    var SUBZONE_STYLE_TINT = {
      ticket_lobby:     [0.98, 1.03, 1.08],
      clock_atrium:     [1.04, 1.06, 1.12],
      security_bay:     [1.04, 0.98, 0.92],
      lounge_kiosk:     [1.06, 1.00, 0.94],
      transfer_hub:     [1.12, 1.02, 0.88],
      ad_gallery:       [0.96, 0.88, 0.78],
      shop_gallery:     [0.98, 0.90, 0.80],
      server_vault:     [0.72, 0.94, 0.88],
      control_deck:     [0.86, 1.12, 1.02],
      archive_room:     [0.84, 1.00, 0.94],
      workshop:         [0.94, 0.96, 1.02],
      switchgear:       [0.88, 0.92, 1.08],
      transformer_hall: [0.78, 0.86, 1.04],
      cooling_bay:      [0.82, 0.94, 1.10],
      pipe_gallery:     [0.84, 0.80, 0.98],
      valve_chamber:    [0.76, 0.74, 0.92],
      culvert_alcove:   [0.74, 0.72, 0.90],
      north_terminal:   [1.04, 1.06, 1.08],
      boarding_bay:     [1.00, 1.02, 1.04],
      freight_end:      [0.92, 0.90, 0.94]
    };
    var hasZoneAt = typeof mapApi.getZoneAt === 'function';
    var hasSubZoneAt = typeof mapApi.getSubZoneAt === 'function';

    for (var fi = 0; fi < floorSpecs.length; fi++) {
      var spec = floorSpecs[fi];
      var list = floorBuckets[spec.key];
      if (!list || list.length === 0) continue;

      var fTex = session.getTileTex(spec.tex, spec.col, '#10141c');
      var fNorm = getNormal(spec.tex);
      var fRough = getRoughness(spec.tex);
      var fMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: fTex,
        color: spec.matColor || 0xffffff,
        normalMap: fNorm || null,
        normalScale: new THREE.Vector2(spec.nScale, spec.nScale),
        roughnessMap: fRough || null,
        roughness: spec.rough,
        metalness: spec.metal
      }));

      var fMesh = new THREE.InstancedMesh(tileGeo, fMat, list.length);
      for (var li = 0; li < list.length; li++) {
        var gx2 = list[li].gx;
        var gz2 = list[li].gz;
        var hVal = hash2D(gx2, gz2);
        dummy.position.set(gx2 + 0.5, spec.y, gz2 + 0.5);
        dummy.rotation.set(0, spec.varyRot ? Math.floor(hVal * 4) * (Math.PI * 0.5) : 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        fMesh.setMatrixAt(li, dummy.matrix);

        // Zone- and sub-zone-coded tile shading + subtle organic slab variation
        if (typeof fMesh.setColorAt === 'function') {
          var shade = spec.key === 3 ? (0.94 + hVal * 0.10) : (0.88 + hVal * 0.18);
          var zt = [1.0, 1.0, 1.0];
          if (spec.key === 0 || spec.key === 2) {
            var szObj = hasSubZoneAt ? mapApi.getSubZoneAt(gx2 + 0.5, gz2 + 0.5) : null;
            if (szObj && szObj.style && SUBZONE_STYLE_TINT[szObj.style]) {
              zt = SUBZONE_STYLE_TINT[szObj.style];
            } else if (hasZoneAt) {
              var zId = mapApi.getZoneAt(gx2 + 0.5, gz2 + 0.5);
              if (ZONE_FLOOR_TINT[zId]) zt = ZONE_FLOOR_TINT[zId];
            }
          }
          // Subtle architectural checkerboard sheen in Concourse Atrium & Corridor Central Hub
          var checker = ((gx2 + gz2) % 2 === 0) ? 1.03 : 0.97;
          if (spec.key === 0 && ((gx2 >= 23 && gx2 <= 59 && gz2 >= 21 && gz2 <= 70) || (gx2 >= 105 && gx2 <= 141 && gz2 >= 63 && gz2 <= 85))) {
            shade *= checker;
          }
          instColor.setRGB(shade * zt[0], shade * zt[1], shade * zt[2]);
          fMesh.setColorAt(li, instColor);
        }
      }
      fMesh.instanceMatrix.needsUpdate = true;
      if (fMesh.instanceColor) fMesh.instanceColor.needsUpdate = true;
      session.scene.add(fMesh);
    }

    // --- 1A-2. ARCHITECTURAL SUB-ZONE FLOOR INLAYS, GRATING TRENCHES & SECTOR STENCILS ---
    function addFloorInlay(tex, wx, wy, wz, sw, sd, opacity, repeatX, repeatY, rotY) {
      if (repeatX || repeatY) {
        tex.repeat.set(repeatX || 1, repeatY || 1);
      }
      var mat = session.trackMat(new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: opacity !== undefined ? opacity : 0.88,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      }));
      var geo = session.trackGeo(new THREE.PlaneGeometry(sw, sd));
      geo.rotateX(-Math.PI / 2);
      var m = new THREE.Mesh(geo, mat);
      m.position.set(wx, wy, wz);
      if (rotY) m.rotation.y = rotY;
      session.scene.add(m);
    }

    // Z-01B Concourse Weathered Terrazzo Station Crest under Central Atrium
    addFloorInlay(createFloorCompassTexture(THREE, session), 41.5, FLOOR_Y + 0.020, 37.5, 6.8, 6.8, 0.72);
    // Z-01 Subway Tactile Blind-Guide Paving (盲道砖) framing central atrium aisles & branching into Z-01C Security Bay
    var tactileTexNS = createTactilePavingTexture(THREE, session);
    addFloorInlay(tactileTexNS, 37.6, FLOOR_Y + 0.024, 45.5, 0.56, 36.0, 0.86, 1, 22);
    var tactileTexNS2 = createTactilePavingTexture(THREE, session);
    addFloorInlay(tactileTexNS2, 45.4, FLOOR_Y + 0.024, 45.5, 0.56, 36.0, 0.86, 1, 22);
    var tactileTexWest = createTactilePavingTexture(THREE, session);
    addFloorInlay(tactileTexWest, 27.2, FLOOR_Y + 0.024, 33.0, 0.56, 19.6, 0.86, 1, 12, Math.PI * 0.5);
    var tactileTexEast = createTactilePavingTexture(THREE, session);
    addFloorInlay(tactileTexEast, 61.5, FLOOR_Y + 0.024, 60.5, 0.56, 34.0, 0.86, 1, 20, Math.PI * 0.5);
    // Z-01 Diegetic Painted Metro Floor Wayfinding Ribbons (cleanly offset from tactile strips & HUD corners)
    addFloorInlay(createWayfindingStripeTexture(THREE, session, '#d89b3c', '← Z-01C 安检通道 · SECURITY'), 34.4, FLOOR_Y + 0.028, 34.25, 4.9, 0.90, 0.88);
    addFloorInlay(createWayfindingStripeTexture(THREE, session, '#d89b3c', 'B2 换乘长廊 / 0号站台 →'), 48.4, FLOOR_Y + 0.028, 40.9, 5.1, 0.90, 0.88);
    addFloorInlay(createWayfindingStripeTexture(THREE, session, '#58b4cc', '↑ 售票大厅 · TICKETS'), 41.5, FLOOR_Y + 0.028, 32.8, 4.6, 0.86, 0.88);
    addFloorInlay(createWayfindingStripeTexture(THREE, session, '#5d84d4', '↓ 旧变电间 · SUB-04'), 41.5, FLOOR_Y + 0.028, 43.2, 4.6, 0.86, 0.88);
    // Z-01C West Security Bay Floor Frame
    addFloorInlay(createZoneFloorFrameTexture(THREE, session, 'SECURITY X-RAY CHECK · 安检通道', '#ffaa3b'), 13.0, FLOOR_Y + 0.014, 40.5, 14.5, 22.0, 0.68);
    // Z-03B Dispatch Control Deck Anti-Static Technical Floor Overlay
    addFloorInlay(createZoneFloorFrameTexture(THREE, session, 'SIGNAL CONTROL DECK · 主调度区', '#52c4a2'), 122.5, FLOOR_Y + 0.014, 17.5, 25.0, 21.0, 0.62);
    // Z-04 Substation Transformer Containment Hazard Frames & Recessed Cable Grate Trenches
    var subFrameTex = createZoneFloorFrameTexture(THREE, session, 'HV 110kV · 高压警戒', '#e6a83c');
    var subFrames = [
      [19.0, 95.0], [41.0, 95.0], [63.0, 95.0],
      [19.0, 125.0], [41.0, 125.0], [63.0, 125.0]
    ];
    for (var sfi = 0; sfi < subFrames.length; sfi++) {
      addFloorInlay(subFrameTex, subFrames[sfi][0], FLOOR_Y + 0.015, subFrames[sfi][1], 5.6, 5.6, 0.72);
    }
    var subGrateTex = createFloorGrateTexture(THREE, session, '#6e9eff');
    addFloorInlay(subGrateTex, 41.0, FLOOR_Y + 0.016, 110.0, 2.2, 46.0, 0.84, 1, 18);
    // Z-05 Tunnel Recessed Drainage Culvert Grates along North Pipe Gallery & South Culvert
    var tunGrateTex = createFloorGrateTexture(THREE, session, '#a884e0');
    addFloorInlay(tunGrateTex, 122.0, FLOOR_Y + 0.016, 118.5, 68.0, 2.0, 0.86, 26, 1);
    var tunGrateTex2 = createFloorGrateTexture(THREE, session, '#6e52a8');
    addFloorInlay(tunGrateTex2, 122.0, FLOOR_Y + 0.016, 133.5, 28.0, 1.8, 0.82, 11, 1);
    // Z-06 Platform 0 Painted Sector Stencils (BAY A / BAY B / BAY C)
    addFloorInlay(createPlatformBayStencilTexture(THREE, session, 'BAY A', '北段应急脱出站厅', '#68c8de'), 201.2, PLATFORM_Y + 0.015, 24.5, 7.6, 3.8, 0.78);
    addFloorInlay(createPlatformBayStencilTexture(THREE, session, 'BAY B', '零号站台主候车区', '#e69c3c'), 201.2, PLATFORM_Y + 0.015, 74.5, 7.6, 3.8, 0.82);
    addFloorInlay(createPlatformBayStencilTexture(THREE, session, 'BAY C', '南段货运信号端', '#ff6472'), 201.2, PLATFORM_Y + 0.015, 124.5, 7.6, 3.8, 0.78);

    // Generate dynamic procedural prop & decal specs from live mapApi
    var propSpecs = generateDynamicZoneProps(mapApi);

    // Style-1 heavy-ink irregular damp floor puddles (1 InstancedMesh draw call across entire 224x152 map!)
    var puddleGeo = session.trackGeo(new THREE.PlaneGeometry(1, 1));
    puddleGeo.rotateX(-Math.PI / 2);
    if (propSpecs.puddles.length > 0) {
      var puddleTex = createPuddleTexture(THREE, session);
      var puddleMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: puddleTex,
        color: 0xffffff,
        roughness: 0.28,
        metalness: 0.14,
        transparent: true,
        opacity: 0.84,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      }));
      var puddleInst = new THREE.InstancedMesh(puddleGeo, puddleMat, propSpecs.puddles.length);
      for (var pi = 0; pi < propSpecs.puddles.length; pi++) {
        var pd = propSpecs.puddles[pi];
        var pBaseY = (pd.x >= PLATFORM_START_X) ? PLATFORM_Y : FLOOR_Y;
        dummy.position.set(pd.x, pBaseY + 0.022, pd.z);
        dummy.rotation.set(0, pd.rot || 0, 0);
        dummy.scale.set(pd.sx, 1, pd.sz);
        dummy.updateMatrix();
        puddleInst.setMatrixAt(pi, dummy.matrix);
      }
      puddleInst.instanceMatrix.needsUpdate = true;
      session.scene.add(puddleInst);
    }

    // Style-1 heavy-ink floor fracture decals (1 InstancedMesh draw call across entire 224x152 map!)
    var crackDecals = propSpecs.crackDecals || [];
    if (crackDecals.length > 0) {
      var crackTex = createCrackDecalTexture(THREE, session);
      var crackMat = session.trackMat(new THREE.MeshBasicMaterial({
        map: crackTex,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      }));
      var crackInst = new THREE.InstancedMesh(puddleGeo, crackMat, crackDecals.length);
      for (var cdi = 0; cdi < crackDecals.length; cdi++) {
        var cd = crackDecals[cdi];
        var cdBaseY = (cd.x >= PLATFORM_START_X) ? PLATFORM_Y : FLOOR_Y;
        dummy.position.set(cd.x, cdBaseY + 0.018, cd.z);
        dummy.rotation.set(0, cd.rot || 0, 0);
        dummy.scale.set(cd.sx || 1.8, 1, cd.sz || 1.5);
        dummy.updateMatrix();
        crackInst.setMatrixAt(cdi, dummy.matrix);
      }
      crackInst.instanceMatrix.needsUpdate = true;
      session.scene.add(crackInst);
    }

    // --- 1B. RECESSED RAIL TRENCH, STEEL I-BEAM TRACKS, THIRD RAIL & TUNNEL PORTALS ---
    if (floorBuckets[4].length > 0) {
      var minRailX = 999, maxRailX = 0, minRailZ = 999, maxRailZ = 0;
      for (var ri = 0; ri < floorBuckets[4].length; ri++) {
        var rc = floorBuckets[4][ri];
        if (rc.gx < minRailX) minRailX = rc.gx;
        if (rc.gx > maxRailX) maxRailX = rc.gx;
        if (rc.gz < minRailZ) minRailZ = rc.gz;
        if (rc.gz > maxRailZ) maxRailZ = rc.gz;
      }
      var railCenterZ = (minRailZ + maxRailZ + 1) * 0.5;
      var railSpanZ = Math.max(8, maxRailZ - minRailZ + 1);
      var railCenterX = (minRailX + maxRailX + 1) * 0.5;
      var trackX = Math.abs(railCenterX - TRAIN_X) < 3 ? TRAIN_X : railCenterX;

      // Platform vertical drop curb with metallic edge nosing
      var curbGeo = session.trackGeo(new THREE.BoxGeometry(0.22, 0.70, railSpanZ));
      var curbMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x222934, roughness: 0.86, metalness: 0.12 }));
      var curbMesh = new THREE.Mesh(curbGeo, curbMat);
      curbMesh.position.set(minRailX - 0.06, -0.28, railCenterZ);
      addInkOutline(THREE, session, curbMesh, 24);
      session.scene.add(curbMesh);

      var noseGeo = session.trackGeo(new THREE.BoxGeometry(0.14, 0.06, railSpanZ));
      var noseMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xd49d34, roughness: 0.62, metalness: 0.28 }));
      var noseMesh = new THREE.Mesh(noseGeo, noseMat);
      noseMesh.position.set(minRailX - 0.03, PLATFORM_Y + 0.02, railCenterZ);
      addInkOutline(THREE, session, noseMesh, 24);
      session.scene.add(noseMesh);

      // Gleaming metallic steel rails
      var railGeo = session.trackGeo(new THREE.BoxGeometry(0.12, 0.14, railSpanZ + 4));
      var railMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x8692a6, roughness: 0.32, metalness: 0.78 }));
      var leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(trackX - 0.74, RAIL_Y + 0.08, railCenterZ);
      addInkOutline(THREE, session, leftRail, 24);
      var rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(trackX + 0.74, RAIL_Y + 0.08, railCenterZ);
      addInkOutline(THREE, session, rightRail, 24);
      session.scene.add(leftRail, rightRail);

      // Electrified 3rd-rail guard with faint crimson-amber hazard strip
      var thirdRailGeo = session.trackGeo(new THREE.BoxGeometry(0.10, 0.18, railSpanZ + 2));
      var thirdRailMat = session.trackMat(new THREE.MeshStandardMaterial({
        color: 0x5c3630,
        emissive: 0x6e1820,
        emissiveIntensity: 0.45,
        roughness: 0.55,
        metalness: 0.45
      }));
      var thirdRail = new THREE.Mesh(thirdRailGeo, thirdRailMat);
      thirdRail.position.set(trackX + 1.28, RAIL_Y + 0.12, railCenterZ);
      addInkOutline(THREE, session, thirdRail, 24);
      session.scene.add(thirdRail);

      // Concrete/timber rail sleepers (Instanced)
      var tieCount = Math.floor(railSpanZ * 1.45);
      var tieGeo = session.trackGeo(new THREE.BoxGeometry(2.15, 0.08, 0.24));
      var tieMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.92, metalness: 0.06 }));
      var tieMesh = new THREE.InstancedMesh(tieGeo, tieMat, tieCount);
      for (var ti = 0; ti < tieCount; ti++) {
        dummy.position.set(trackX, RAIL_Y + 0.03, minRailZ + (ti / 1.45) + 0.35);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tieMesh.setMatrixAt(ti, dummy.matrix);
      }
      tieMesh.instanceMatrix.needsUpdate = true;
      session.scene.add(tieMesh);

      // Dark arched subway tunnel portals framing North & South ends of track trench
      var archMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1a202b, roughness: 0.84, metalness: 0.22 }));
      var portalVoidMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x030407 }));
      var portalEnds = [minRailZ - 0.1, maxRailZ + 1.1];
      for (var pe = 0; pe < portalEnds.length; pe++) {
        var pz = portalEnds[pe];
        var pGroup = new THREE.Group();
        pGroup.position.set(trackX, RAIL_Y, pz);
        var pillarL = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.45, 3.6, 0.7)), archMat);
        pillarL.position.set(-1.75, 1.8, 0);
        addInkOutline(THREE, session, pillarL, 24);
        var pillarR = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.45, 3.6, 0.7)), archMat);
        pillarR.position.set(1.75, 1.8, 0);
        addInkOutline(THREE, session, pillarR, 24);
        var lintel = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(4.0, 0.65, 0.78)), archMat);
        lintel.position.set(0, 3.55, 0);
        addInkOutline(THREE, session, lintel, 24);
        var darkBack = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(3.2, 3.3)), portalVoidMat);
        darkBack.position.set(0, 1.7, pe === 0 ? -0.36 : 0.36);
        if (pe === 1) darkBack.rotation.y = Math.PI;
        pGroup.add(pillarL, pillarR, lintel, darkBack);
        session.scene.add(pGroup);
      }

      // Platform 0 Overhead Steel Canopy Ribs (Instanced cleanly over the rail trench & hazard curb)
      var ribMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x111720, roughness: 0.90, metalness: 0.14 }));
      var ribSpanX = Math.max(6.4, (maxRailX - minRailX) + 3.0);
      var ribCenterX = (minRailX + maxRailX + 1.0) * 0.5 - 0.25;
      var ribStepZ = railSpanZ > 90 ? 10.0 : (railSpanZ > 45 ? 7.5 : 5.5);
      var ribPositions = [];
      for (var rbz = minRailZ + 4; rbz <= maxRailZ - 2; rbz += ribStepZ) {
        ribPositions.push(rbz);
      }
      if (ribPositions.length > 0) {
        var ribGeo = session.trackGeo(new THREE.BoxGeometry(ribSpanX, 0.24, 0.30));
        var ribMesh = new THREE.InstancedMesh(ribGeo, ribMat, ribPositions.length);
        for (var rbi = 0; rbi < ribPositions.length; rbi++) {
          dummy.position.set(ribCenterX, 3.55, ribPositions[rbi]);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          ribMesh.setMatrixAt(rbi, dummy.matrix);
        }
        ribMesh.instanceMatrix.needsUpdate = true;
        session.scene.add(ribMesh);
      }
    }

    // --- 1C. PBR LAYERED WALLS, GLAZED INTERIOR PARTITIONS, PILLARS & WAIST-HIGH TACTICAL COVER ---
    var concreteWalls = [];
    var neonWalls = [];
    var pillars = [];
    var partitions = [];
    var lowCovers = [];
    var wallKeys = Object.keys(wallTileMap);
    for (var wk = 0; wk < wallKeys.length; wk++) {
      var wt = wallTileMap[wallKeys[wk]];
      if (wt.isCover) lowCovers.push(wt);
      else if (wt.isPartition) partitions.push(wt);
      else if (wt.isPillar) pillars.push(wt);
      else if (wt.neon) neonWalls.push(wt);
      else concreteWalls.push(wt);
    }

    var ZONE_ACCENT_HEX = {
      concourse:  0x68c8de,
      corridor:   0xd6b274,
      dispatch:   0x52c4a2,
      substation: 0x6e9eff,
      tunnel:     0xa884e0,
      platform0:  0xe69c3c
    };
    function getZoneAccentInt(gx, gz) {
      if (!hasZoneAt) return 0x68c8de;
      var zid = mapApi.getZoneAt(gx + 0.5, gz + 0.5);
      if (INFINITY.ArtTokens && typeof INFINITY.ArtTokens.getZoneColor === 'function') {
        return hexToInt(INFINITY.ArtTokens.getZoneColor(zid), ZONE_ACCENT_HEX[zid] || 0x68c8de);
      }
      return ZONE_ACCENT_HEX[zid] || 0x68c8de;
    }

    if (!session._cutawayFocus) {
      session._cutawayFocus = { value: new THREE.Vector3(41.5, 0, 37.5) };
    }
    function applyWallCutawayShader(mat, cacheKey) {
      if (!mat || !session._cutawayFocus) return mat;
      var focusUniform = session._cutawayFocus;
      mat.customProgramCacheKey = function () { return 'wall_cutaway_v1_' + cacheKey; };
      mat.onBeforeCompile = function (shader) {
        shader.uniforms.uCutawayFocus = focusUniform;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vCutawayWorldPos;')
          .replace(
            '#include <project_vertex>',
            [
              '#include <project_vertex>',
              'vec4 cwWp = vec4(transformed, 1.0);',
              '#ifdef USE_INSTANCING',
              '  cwWp = instanceMatrix * cwWp;',
              '#endif',
              'cwWp = modelMatrix * cwWp;',
              'vCutawayWorldPos = cwWp.xyz;'
            ].join('\n')
          );
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uCutawayFocus;\nvarying vec3 vCutawayWorldPos;')
          .replace(
            '#include <clipping_planes_fragment>',
            [
              '#include <clipping_planes_fragment>',
              'if (vCutawayWorldPos.y > 0.92 && vCutawayWorldPos.z > uCutawayFocus.z + 0.55 && vCutawayWorldPos.z < uCutawayFocus.z + 10.5 && abs(vCutawayWorldPos.x - uCutawayFocus.x) < 5.8) {',
              '  discard;',
              '}'
            ].join('\n')
          );
      };
      return mat;
    }

    session._applyOverheadCutaway = function (mat, cacheKey) {
      if (!mat || !session._cutawayFocus) return mat;
      var focusUniform = session._cutawayFocus;
      mat.customProgramCacheKey = function () { return 'overhead_cutaway_v1_' + cacheKey; };
      mat.onBeforeCompile = function (shader) {
        shader.uniforms.uCutawayFocus = focusUniform;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vCutawayWorldPos;')
          .replace(
            '#include <project_vertex>',
            [
              '#include <project_vertex>',
              'vec4 cwWp = vec4(transformed, 1.0);',
              '#ifdef USE_INSTANCING',
              '  cwWp = instanceMatrix * cwWp;',
              '#endif',
              'cwWp = modelMatrix * cwWp;',
              'vCutawayWorldPos = cwWp.xyz;'
            ].join('\n')
          );
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uCutawayFocus;\nvarying vec3 vCutawayWorldPos;')
          .replace(
            '#include <clipping_planes_fragment>',
            [
              '#include <clipping_planes_fragment>',
              'if (vCutawayWorldPos.z > uCutawayFocus.z + 0.4 && vCutawayWorldPos.z < uCutawayFocus.z + 11.5 && abs(vCutawayWorldPos.x - uCutawayFocus.x) < 12.0) {',
              '  discard;',
              '}'
            ].join('\n')
          );
      };
      return mat;
    };

    var wallGeo = session.trackGeo(new THREE.BoxGeometry(1, WALL_HEIGHT, 1));
    var capGeo = session.trackGeo(new THREE.BoxGeometry(1.06, 0.14, 1.06));
    var capMat = applyWallCutawayShader(
      session.trackMat(new THREE.MeshStandardMaterial({ color: 0x0b0f16, roughness: 0.86, metalness: 0.22 })),
      'cap'
    );
    var baseTrimGeo = session.trackGeo(new THREE.BoxGeometry(1.04, 0.10, 1.04));
    var baseTrimMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x06080d }));

    var sharedAoGeo = session.trackGeo(new THREE.PlaneGeometry(1.85, 1.85));
    sharedAoGeo.rotateX(-Math.PI / 2);
    var sharedAoMat = session.trackMat(new THREE.MeshBasicMaterial({
      map: createPillarAoTexture(THREE, session),
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    }));

    var hazardBandMat = session.trackMat(new THREE.MeshStandardMaterial({
      map: session.getTileTex('floor_hazard', '#d6a434', '#161a20'),
      normalMap: getNormal('floor_hazard') || null,
      normalScale: new THREE.Vector2(0.80, 0.80),
      roughness: 0.74,
      metalness: 0.14
    }));

    if (concreteWalls.length > 0) {
      var cTex = session.getTileTex('wall_concrete', '#2b3240', '#161b24');
      var cMat = applyWallCutawayShader(session.trackMat(new THREE.MeshStandardMaterial({
        map: cTex,
        normalMap: getNormal('wall_concrete') || null,
        normalScale: new THREE.Vector2(0.78, 0.78),
        roughnessMap: getRoughness('wall_concrete') || null,
        roughness: 0.92,
        metalness: 0.08
      })), 'concrete');
      var cMesh = new THREE.InstancedMesh(wallGeo, cMat, concreteWalls.length);
      var cCap = new THREE.InstancedMesh(capGeo, capMat, concreteWalls.length);
      var cBase = new THREE.InstancedMesh(baseTrimGeo, baseTrimMat, concreteWalls.length);
      for (var ci = 0; ci < concreteWalls.length; ci++) {
        var cw = concreteWalls[ci];
        var ch = cw.h || WALL_HEIGHT;
        dummy.position.set(cw.gx + 0.5, ch * 0.5, cw.gz + 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, ch / WALL_HEIGHT, 1);
        dummy.updateMatrix();
        cMesh.setMatrixAt(ci, dummy.matrix);

        dummy.position.set(cw.gx + 0.5, ch + 0.05, cw.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cCap.setMatrixAt(ci, dummy.matrix);

        dummy.position.set(cw.gx + 0.5, 0.05, cw.gz + 0.5);
        dummy.updateMatrix();
        cBase.setMatrixAt(ci, dummy.matrix);

        if (typeof cMesh.setColorAt === 'function') {
          var whv = 0.88 + hash2D(cw.gx, cw.gz) * 0.16;
          instColor.setRGB(whv, whv, whv * 1.02);
          cMesh.setColorAt(ci, instColor);
        }
      }
      cMesh.instanceMatrix.needsUpdate = true;
      cCap.instanceMatrix.needsUpdate = true;
      cBase.instanceMatrix.needsUpdate = true;
      if (cMesh.instanceColor) cMesh.instanceColor.needsUpdate = true;
      session.scene.add(cMesh, cCap, cBase);
    }

    if (neonWalls.length > 0) {
      var nTex = session.getTileTex('wall_neon', '#233042', '#52d6ea');
      var nMat = applyWallCutawayShader(session.trackMat(new THREE.MeshStandardMaterial({
        map: nTex,
        normalMap: getNormal('wall_neon') || null,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughnessMap: getRoughness('wall_neon') || null,
        roughness: 0.88,
        metalness: 0.12,
        emissive: 0x0a202c,
        emissiveIntensity: 0.16
      })), 'neon');
      var nMesh = new THREE.InstancedMesh(wallGeo, nMat, neonWalls.length);
      var nCap = new THREE.InstancedMesh(capGeo, capMat, neonWalls.length);
      var nBase = new THREE.InstancedMesh(baseTrimGeo, baseTrimMat, neonWalls.length);

      // Restrained industrial light trough trim (avoids glaring fullbright cyan/white plastic strips)
      var trimGeo = session.trackGeo(new THREE.BoxGeometry(1.03, 0.06, 1.03));
      var trimMat = applyWallCutawayShader(session.trackMat(new THREE.MeshBasicMaterial({
        color: 0xa6bac8,
        transparent: true,
        opacity: 0.68
      })), 'trim');
      var trimMesh = new THREE.InstancedMesh(trimGeo, trimMat, neonWalls.length);

      for (var ni = 0; ni < neonWalls.length; ni++) {
        var nw = neonWalls[ni];
        var nh = nw.h || WALL_HEIGHT;
        dummy.position.set(nw.gx + 0.5, nh * 0.5, nw.gz + 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, nh / WALL_HEIGHT, 1);
        dummy.updateMatrix();
        nMesh.setMatrixAt(ni, dummy.matrix);

        dummy.position.set(nw.gx + 0.5, nh + 0.05, nw.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nCap.setMatrixAt(ni, dummy.matrix);

        dummy.position.set(nw.gx + 0.5, 0.05, nw.gz + 0.5);
        dummy.updateMatrix();
        nBase.setMatrixAt(ni, dummy.matrix);

        dummy.position.set(nw.gx + 0.5, nh - 0.16, nw.gz + 0.5);
        dummy.updateMatrix();
        trimMesh.setMatrixAt(ni, dummy.matrix);

        if (typeof trimMesh.setColorAt === 'function') {
          instColor.setHex(getZoneAccentInt(nw.gx, nw.gz));
          trimMesh.setColorAt(ni, instColor);
        }
      }
      nMesh.instanceMatrix.needsUpdate = true;
      nCap.instanceMatrix.needsUpdate = true;
      nBase.instanceMatrix.needsUpdate = true;
      trimMesh.instanceMatrix.needsUpdate = true;
      if (trimMesh.instanceColor) trimMesh.instanceColor.needsUpdate = true;
      session.scene.add(nMesh, nCap, nBase, trimMesh);
    }

    // Reinforced architectural cladding + heavy-ink grounding AO for interior structural pillars
    if (pillars.length > 0) {
      var pilTex = session.getTileTex('wall_concrete', '#2e3848', '#151b24');
      var pilMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: pilTex,
        normalMap: getNormal('wall_concrete') || null,
        normalScale: new THREE.Vector2(0.78, 0.78),
        roughnessMap: getRoughness('wall_concrete') || null,
        roughness: 0.84,
        metalness: 0.14
      }));
      var plinthGeo = session.trackGeo(new THREE.BoxGeometry(1.12, 0.38, 1.12));
      var plinthMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x161c26, roughness: 0.72, metalness: 0.34 }));
      var inkCollarGeo = session.trackGeo(new THREE.BoxGeometry(1.16, 0.07, 1.16));
      var bandGeo = session.trackGeo(new THREE.BoxGeometry(1.06, 0.22, 1.06));
      var lightRingGeo = session.trackGeo(new THREE.BoxGeometry(1.07, 0.07, 1.07));
      var lightRingMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));

      var pMesh = new THREE.InstancedMesh(wallGeo, pilMat, pillars.length);
      var pPlinth = new THREE.InstancedMesh(plinthGeo, plinthMat, pillars.length);
      var pInkCollar = new THREE.InstancedMesh(inkCollarGeo, baseTrimMat, pillars.length);
      var pBand = new THREE.InstancedMesh(bandGeo, hazardBandMat, pillars.length);
      var pRing = new THREE.InstancedMesh(lightRingGeo, lightRingMat, pillars.length);
      var pCap = new THREE.InstancedMesh(capGeo, capMat, pillars.length);
      var pAo = new THREE.InstancedMesh(sharedAoGeo, sharedAoMat, pillars.length);

      for (var pli = 0; pli < pillars.length; pli++) {
        var pw = pillars[pli];
        var ph = pw.h || 2.6;
        var pFloorY = (pw.gx >= PLATFORM_START_X) ? PLATFORM_Y : FLOOR_Y;
        dummy.rotation.set(0, 0, 0);

        dummy.position.set(pw.gx + 0.5, ph * 0.5, pw.gz + 0.5);
        dummy.scale.set(1, ph / WALL_HEIGHT, 1);
        dummy.updateMatrix();
        pMesh.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, 0.19, pw.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pPlinth.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, 0.39, pw.gz + 0.5);
        dummy.updateMatrix();
        pInkCollar.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, 0.62, pw.gz + 0.5);
        dummy.updateMatrix();
        pBand.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, ph - 0.18, pw.gz + 0.5);
        dummy.updateMatrix();
        pRing.setMatrixAt(pli, dummy.matrix);

        if (typeof pRing.setColorAt === 'function') {
          instColor.setHex(getZoneAccentInt(pw.gx, pw.gz));
          pRing.setColorAt(pli, instColor);
        }

        dummy.position.set(pw.gx + 0.5, ph + 0.05, pw.gz + 0.5);
        dummy.updateMatrix();
        pCap.setMatrixAt(pli, dummy.matrix);

        dummy.position.set(pw.gx + 0.5, pFloorY + 0.016, pw.gz + 0.5);
        dummy.updateMatrix();
        pAo.setMatrixAt(pli, dummy.matrix);
      }
      pMesh.instanceMatrix.needsUpdate = true;
      pPlinth.instanceMatrix.needsUpdate = true;
      pInkCollar.instanceMatrix.needsUpdate = true;
      pBand.instanceMatrix.needsUpdate = true;
      pRing.instanceMatrix.needsUpdate = true;
      pCap.instanceMatrix.needsUpdate = true;
      pAo.instanceMatrix.needsUpdate = true;
      if (pRing.instanceColor) pRing.instanceColor.needsUpdate = true;
      session.scene.add(pMesh, pPlinth, pInkCollar, pBand, pRing, pCap, pAo);
    }

    // Glazed Steel-and-Glass Architectural Interior Partition Walls (pillarMask === 3, h=2.35m, 5 InstancedMesh draw calls!)
    if (partitions.length > 0) {
      var partDadoGeo = session.trackGeo(new THREE.BoxGeometry(0.96, 0.96, 0.96));
      var partDadoMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: session.getTileTex('wall_concrete', '#253040', '#121822'),
        normalMap: getNormal('wall_concrete') || null,
        normalScale: new THREE.Vector2(0.70, 0.70),
        roughness: 0.76,
        metalness: 0.30
      }));
      var partGlassGeo = session.trackGeo(new THREE.BoxGeometry(0.92, 1.20, 0.92));
      var partGlassMat = session.trackMat(new THREE.MeshStandardMaterial({
        color: 0x2c465a,
        roughness: 0.32,
        metalness: 0.18,
        transparent: true,
        opacity: 0.24,
        depthWrite: false
      }));
      var partRailGeo = session.trackGeo(new THREE.BoxGeometry(1.02, 0.12, 1.02));
      var partRailMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x101620, roughness: 0.52, metalness: 0.58 }));
      var partTrimGeo = session.trackGeo(new THREE.BoxGeometry(1.03, 0.06, 1.03));
      var partTrimMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x8ea8b8, transparent: true, opacity: 0.72 }));
      var partMullionGeo = session.trackGeo(new THREE.BoxGeometry(0.14, 1.32, 0.14));

      var partDadoInst = new THREE.InstancedMesh(partDadoGeo, partDadoMat, partitions.length);
      var partGlassInst = new THREE.InstancedMesh(partGlassGeo, partGlassMat, partitions.length);
      var partRailInst = new THREE.InstancedMesh(partRailGeo, partRailMat, partitions.length * 2);
      var partMullionInst = new THREE.InstancedMesh(partMullionGeo, partRailMat, partitions.length);
      var partTrimInst = new THREE.InstancedMesh(partTrimGeo, partTrimMat, partitions.length);
      var partAoInst = new THREE.InstancedMesh(sharedAoGeo, sharedAoMat, partitions.length);

      for (var pti = 0; pti < partitions.length; pti++) {
        var pt = partitions[pti];
        var ptFloorY = (pt.gx >= PLATFORM_START_X) ? PLATFORM_Y : FLOOR_Y;
        var accentHex = getZoneAccentInt(pt.gx, pt.gz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);

        dummy.position.set(pt.gx + 0.5, ptFloorY + 0.48, pt.gz + 0.5);
        dummy.updateMatrix();
        partDadoInst.setMatrixAt(pti, dummy.matrix);

        dummy.position.set(pt.gx + 0.5, ptFloorY + 1.58, pt.gz + 0.5);
        dummy.updateMatrix();
        partGlassInst.setMatrixAt(pti, dummy.matrix);

        dummy.position.set(pt.gx + 0.5, ptFloorY + 0.98, pt.gz + 0.5);
        dummy.updateMatrix();
        partRailInst.setMatrixAt(pti * 2, dummy.matrix);

        dummy.position.set(pt.gx + 0.5, ptFloorY + 2.24, pt.gz + 0.5);
        dummy.updateMatrix();
        partRailInst.setMatrixAt(pti * 2 + 1, dummy.matrix);

        dummy.position.set(pt.gx + 0.5, ptFloorY + 1.62, pt.gz + 0.5);
        dummy.updateMatrix();
        partMullionInst.setMatrixAt(pti, dummy.matrix);

        dummy.position.set(pt.gx + 0.5, ptFloorY + 2.33, pt.gz + 0.5);
        dummy.updateMatrix();
        partTrimInst.setMatrixAt(pti, dummy.matrix);

        if (typeof partTrimInst.setColorAt === 'function') {
          instColor.setHex(accentHex);
          partTrimInst.setColorAt(pti, instColor);
        }
        if (typeof partGlassInst.setColorAt === 'function') {
          instColor.setHex(accentHex);
          instColor.lerp(new THREE.Color(0x283e50), 0.72);
          partGlassInst.setColorAt(pti, instColor);
        }

        dummy.position.set(pt.gx + 0.5, ptFloorY + 0.015, pt.gz + 0.5);
        dummy.scale.set(0.95, 1, 0.95);
        dummy.updateMatrix();
        partAoInst.setMatrixAt(pti, dummy.matrix);
      }
      partDadoInst.instanceMatrix.needsUpdate = true;
      partGlassInst.instanceMatrix.needsUpdate = true;
      partRailInst.instanceMatrix.needsUpdate = true;
      partMullionInst.instanceMatrix.needsUpdate = true;
      partTrimInst.instanceMatrix.needsUpdate = true;
      partAoInst.instanceMatrix.needsUpdate = true;
      if (partTrimInst.instanceColor) partTrimInst.instanceColor.needsUpdate = true;
      if (partGlassInst.instanceColor) partGlassInst.instanceColor.needsUpdate = true;
      session.scene.add(partDadoInst, partGlassInst, partRailInst, partMullionInst, partTrimInst, partAoInst);
    }

    // Waist-High Style-1 Reinforced Tactical Cover Barricades (h=1.25m, 4 InstancedMesh draw calls!)
    if (lowCovers.length > 0) {
      var covBodyGeo = session.trackGeo(new THREE.BoxGeometry(0.96, 1.06, 0.88));
      var covBodyMat = session.trackMat(new THREE.MeshStandardMaterial({
        map: session.getTileTex('wall_concrete', '#303b4d', '#151b24'),
        normalMap: getNormal('wall_concrete') || null,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: 0.78,
        metalness: 0.24
      }));
      var covStripeGeo = session.trackGeo(new THREE.BoxGeometry(1.01, 0.20, 0.93));
      var covRailGeo = session.trackGeo(new THREE.BoxGeometry(1.04, 0.18, 0.96));
      var covRailMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x10151e, roughness: 0.55, metalness: 0.52 }));

      var covBodyInst = new THREE.InstancedMesh(covBodyGeo, covBodyMat, lowCovers.length);
      var covStripeInst = new THREE.InstancedMesh(covStripeGeo, hazardBandMat, lowCovers.length);
      var covRailInst = new THREE.InstancedMesh(covRailGeo, covRailMat, lowCovers.length);
      var covAoInst = new THREE.InstancedMesh(sharedAoGeo, sharedAoMat, lowCovers.length);

      for (var lci = 0; lci < lowCovers.length; lci++) {
        var lc = lowCovers[lci];
        var lcFloorY = (lc.gx >= PLATFORM_START_X) ? PLATFORM_Y : FLOOR_Y;
        var lch = lc.h || 1.25;
        dummy.rotation.set(0, 0, 0);

        dummy.position.set(lc.gx + 0.5, lcFloorY + lch * 0.44, lc.gz + 0.5);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        covBodyInst.setMatrixAt(lci, dummy.matrix);

        dummy.position.set(lc.gx + 0.5, lcFloorY + 0.78, lc.gz + 0.5);
        dummy.updateMatrix();
        covStripeInst.setMatrixAt(lci, dummy.matrix);

        dummy.position.set(lc.gx + 0.5, lcFloorY + lch - 0.08, lc.gz + 0.5);
        dummy.updateMatrix();
        covRailInst.setMatrixAt(lci, dummy.matrix);

        dummy.position.set(lc.gx + 0.5, lcFloorY + 0.015, lc.gz + 0.5);
        dummy.scale.set(0.92, 1, 0.92);
        dummy.updateMatrix();
        covAoInst.setMatrixAt(lci, dummy.matrix);
      }
      covBodyInst.instanceMatrix.needsUpdate = true;
      covStripeInst.instanceMatrix.needsUpdate = true;
      covRailInst.instanceMatrix.needsUpdate = true;
      covAoInst.instanceMatrix.needsUpdate = true;
      session.scene.add(covBodyInst, covStripeInst, covRailInst, covAoInst);
    }

    // --- 1D. PAINTED SCENE-A B1 CONCOURSE OVERLAY (Adapts seamlessly to 224x152 mega-station bounds) ---
    buildConcoursePaintedStage(session, {
      WALL_HEIGHT: WALL_HEIGHT,
      FLOOR_Y: FLOOR_Y
    });

    // --- 1E. ZONE-SPECIFIC 3D / PAINTED 2.5D ARCHITECTURAL STORYTELLING PROPS (INSTANCED FOR 224x152) ---
    buildZoneProps(session, propSpecs);

    // --- 1F. 6-LAYER AMBIENT LIVING WORLD DYNAMICS (Drips, Dust Shafts, Steam, CRT Glitch, Train Sweep) ---
    buildConcourseAmbientDynamics(session);
  }

  function loadSceneTextureSafe(THREE, session, assetKey, isColor, repeatX, repeatY) {
    if (typeof Image !== 'function' || !INFINITY.ASSETS || typeof INFINITY.ASSETS.getSceneAssetUrl !== 'function') {
      return null;
    }
    var url = INFINITY.ASSETS.getSceneAssetUrl(assetKey);
    if (!url || typeof THREE.TextureLoader !== 'function') return null;
    try {
      var loader = new THREE.TextureLoader();
      var tex = loader.load(url);
      session.trackTex(tex);
      if (isColor && THREE.sRGBEncoding !== undefined) {
        tex.encoding = THREE.sRGBEncoding;
      }
      if (repeatX && repeatY) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
      } else {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
      }
      tex.anisotropy = 8;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    } catch (_) {
      return null;
    }
  }

  function buildConcoursePaintedStage(session, cfg) {
    var THREE = session.THREE;
    var mapApi = session.mapApi || INFINITY.StationMap || null;
    var bounds = (mapApi && mapApi.ZONE_BOUNDS && mapApi.ZONE_BOUNDS.concourse)
      ? mapApi.ZONE_BOUNDS.concourse
      : { x0: 2, z0: 2, x1: 19, z1: 18 };
    var spanW = Math.max(18, (bounds.x1 - bounds.x0 + 1));
    var spanD = Math.max(17, (bounds.z1 - bounds.z0 + 1));
    var centerX = (bounds.x0 + bounds.x1 + 1) * 0.5;
    var centerZ = (bounds.z0 + bounds.z1 + 1) * 0.5;
    var repX = spanW > 24 ? Math.max(2, Math.round(spanW / 24)) : 0;
    var repZ = spanD > 24 ? Math.max(2, Math.round(spanD / 24)) : 0;

    var floorTex = loadSceneTextureSafe(THREE, session, 'concourse_floor', true, repX, repZ);
    if (!floorTex) return;

    var floorNorm = loadSceneTextureSafe(THREE, session, 'concourse_floor_normal', false, repX, repZ);
    var floorRough = loadSceneTextureSafe(THREE, session, 'concourse_floor_roughness', false, repX, repZ);
    var wallTex = loadSceneTextureSafe(THREE, session, 'concourse_wall', true, 1, 1);
    var wallNorm = loadSceneTextureSafe(THREE, session, 'concourse_wall_normal', false, 1, 1);

    var WALL_H = cfg.WALL_HEIGHT || 3.2;
    var FLOOR_Y = cfg.FLOOR_Y || 0.0;

    // 1. Hand-inked floor plate spanning full B1 Concourse bounds
    var plateGeo = session.trackGeo(new THREE.PlaneGeometry(spanW + 0.04, spanD + 0.04));
    plateGeo.rotateX(-Math.PI / 2);
    var plateMat = session.trackMat(new THREE.MeshStandardMaterial({
      map: floorTex,
      normalMap: floorNorm || null,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughnessMap: floorRough || null,
      roughness: 0.88,
      metalness: 0.16
    }));
    var plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(centerX, FLOOR_Y + 0.012, centerZ);
    session.scene.add(plateMesh);

    // 2. Heavy Mignola perimeter ink-shadow skirt & AO texture shared by painted props
    var aoCanvas = makeCanvas(128, 128);
    var aoCtx = aoCanvas.getContext('2d');
    if (aoCtx) {
      var ag = aoCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
      ag.addColorStop(0, 'rgba(3, 5, 9, 0.92)');
      ag.addColorStop(0.58, 'rgba(4, 7, 13, 0.56)');
      ag.addColorStop(1, 'rgba(4, 7, 13, 0.0)');
      aoCtx.fillStyle = ag;
      aoCtx.fillRect(0, 0, 128, 128);
    }
    var aoTex = session.trackTex(new THREE.CanvasTexture(aoCanvas));
    var aoGeo = session.trackGeo(new THREE.PlaneGeometry(1, 1));
    aoGeo.rotateX(-Math.PI / 2);
    var aoMat = session.trackMat(new THREE.MeshBasicMaterial({
      map: aoTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    }));

    // 3. Hand-inked subway wall elevations facing into B1 Concourse north & west perimeters
    if (wallTex) {
      var makeWallStrip = function (w, h, px, py, pz, rotY, rx) {
        var stripTex = wallTex.clone();
        stripTex.needsUpdate = true;
        stripTex.wrapS = THREE.RepeatWrapping;
        stripTex.wrapT = THREE.ClampToEdgeWrapping;
        stripTex.repeat.set(Math.max(1, rx || (w / 5.4)), 1);
        session.trackTex(stripTex);

        var stripNorm = null;
        if (wallNorm) {
          stripNorm = wallNorm.clone();
          stripNorm.needsUpdate = true;
          stripNorm.wrapS = THREE.RepeatWrapping;
          stripNorm.wrapT = THREE.ClampToEdgeWrapping;
          stripNorm.repeat.set(Math.max(1, rx || (w / 5.4)), 1);
          session.trackTex(stripNorm);
        }

        var wMat = session.trackMat(new THREE.MeshStandardMaterial({
          map: stripTex,
          normalMap: stripNorm,
          normalScale: new THREE.Vector2(1.35, 1.35),
          roughness: 0.86,
          metalness: 0.14
        }));
        var wMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(w, h)), wMat);
        wMesh.position.set(px, py, pz);
        wMesh.rotation.y = rotY;
        session.scene.add(wMesh);
      };

      makeWallStrip(spanW, WALL_H, centerX, WALL_H * 0.5, bounds.z0 + 0.025, 0, Math.round(spanW / 5.5));
      makeWallStrip(spanD, WALL_H, bounds.x0 + 0.025, WALL_H * 0.5, centerZ, Math.PI * 0.5, Math.round(spanD / 5.5));
    }

    session._sceneAAoGeo = aoGeo;
    session._sceneAAoMat = aoMat;
    session._sceneAConcourseBounds = bounds;
    session._sceneAEnabled = true;
  }

  function createPaintedPropBillboard(THREE, session, assetKey, x, z, width, height, opts) {
    var tex = loadSceneTextureSafe(THREE, session, assetKey, true, 0, 0);
    if (!tex) return null;
    var o = opts || {};
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // Grounded contact shadow ellipse
    if (session._sceneAAoGeo && session._sceneAAoMat) {
      var sh = new THREE.Mesh(session._sceneAAoGeo, session._sceneAAoMat);
      sh.position.set(0, 0.028, 0.06);
      sh.scale.set(width * (o.shadowScaleX || 1.12), 1, width * (o.shadowScaleZ || 0.72));
      group.add(sh);
    }

    var mat = session.trackMat(new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.14,
      roughness: 0.82,
      metalness: 0.16,
      side: THREE.DoubleSide
    }));
    var mesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(width, height)), mat);
    mesh.position.set(0, height * 0.48 + (o.yOffset || 0.02), 0);
    mesh.rotation.x = -(o.tiltRad !== undefined ? o.tiltRad : 0.34);
    if (o.flipX) mesh.scale.x = -1;
    group.add(mesh);

    if (o.emissiveColor) {
      var led = new THREE.Mesh(
        session.trackGeo(new THREE.SphereGeometry(0.055, 8, 8)),
        session.trackMat(new THREE.MeshBasicMaterial({ color: o.emissiveColor }))
      );
      led.position.set(o.ledX || 0, o.ledY || (height * 0.72), o.ledZ || 0.14);
      group.add(led);
      group.userData.ledMat = led.material;
    }

    session.scene.add(group);
    return group;
  }

  function buildConcourseAmbientDynamics(session) {
    var THREE = session.THREE;
    if (!THREE || !session.scene) return;

    var dyn = {
      drips: [],
      steams: [],
      dustPoints: null,
      dustBaseY: null,
      trainSweepMesh: null,
      trainSweepMat: null,
      trainSweepTimer: 7.5,
      trainSweepActive: 0,
      ledGroups: session._sceneALedGroups || []
    };

    // 1. Ceiling water drips falling onto B1 concourse puddles (anchors around concourse center on 224x152 or 56x38)
    var bnd = session._sceneAConcourseBounds || { x0: 2, z0: 2, x1: 19, z1: 18 };
    var cx = (bnd.x0 + bnd.x1 + 1) * 0.5;
    var cz = (bnd.z0 + bnd.z1 + 1) * 0.5;
    var dripSpots = [
      { x: cx - 3.2, z: cz + 2.4, nextAt: 1.4 },
      { x: cx + 3.6, z: cz - 1.8, nextAt: 3.1 },
      { x: cx - 5.4, z: cz + 4.8, nextAt: 4.8 }
    ];
    var dripGeo = session.trackGeo(new THREE.BoxGeometry(0.035, 0.24, 0.035));
    var dripMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xaef4ff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    }));
    for (var di = 0; di < dripSpots.length; di++) {
      var dm = new THREE.Mesh(dripGeo, dripMat);
      dm.visible = false;
      session.scene.add(dm);
      dyn.drips.push({
        x: dripSpots[di].x,
        z: dripSpots[di].z,
        y: 3.1,
        vy: 0,
        active: false,
        cooldown: dripSpots[di].nextAt,
        mesh: dm
      });
    }

    // 2. Vent steam wisps rising near NW and SE walls (stylized cel smoke cards)
    var steamCanvas = makeCanvas(64, 64);
    var sctx = steamCanvas.getContext('2d');
    if (sctx) {
      sctx.clearRect(0, 0, 64, 64);
      sctx.fillStyle = 'rgba(130, 165, 188, 0.34)';
      sctx.strokeStyle = 'rgba(6, 10, 16, 0.65)';
      sctx.lineWidth = 3;
      sctx.beginPath();
      sctx.arc(32, 34, 18, 0, Math.PI * 2);
      sctx.arc(22, 36, 12, 0, Math.PI * 2);
      sctx.arc(43, 32, 13, 0, Math.PI * 2);
      sctx.fill();
      sctx.stroke();
    }
    var steamTex = session.trackTex(new THREE.CanvasTexture(steamCanvas));
    var steamGeo = session.trackGeo(new THREE.PlaneGeometry(1.15, 1.15));
    var ventOrigins = [
      { x: cx - 7.8, z: cz - 3.6 },
      { x: cx + 8.2, z: cz + 3.2 }
    ];
    for (var vi = 0; vi < ventOrigins.length; vi++) {
      for (var k = 0; k < 3; k++) {
        var smat = session.trackMat(new THREE.MeshBasicMaterial({
          map: steamTex,
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          side: THREE.DoubleSide
        }));
        var sm = new THREE.Mesh(steamGeo, smat);
        sm.rotation.x = -0.34;
        session.scene.add(sm);
        dyn.steams.push({
          ox: ventOrigins[vi].x,
          oz: ventOrigins[vi].z,
          phase: (vi * 0.5 + k / 3.0) % 1.0,
          speed: 0.24 + k * 0.04,
          driftX: vi === 0 ? 0.45 : -0.45,
          mesh: sm,
          mat: smat
        });
      }
    }

    // 3. Drifting volumetric light-shaft dust motes under B1 ceiling lamps
    var moteCount = 44;
    var motePos = new Float32Array(moteCount * 3);
    var moteSeeds = new Float32Array(moteCount);
    for (var mi = 0; mi < moteCount; mi++) {
      var lamp = mi % 2 === 0 ? { x: cx - 3.5, z: cz - 2.5 } : { x: cx + 4.0, z: cz + 3.0 };
      var ang = Math.random() * Math.PI * 2;
      var rad = Math.random() * 5.2;
      motePos[mi * 3] = lamp.x + Math.cos(ang) * rad;
      motePos[mi * 3 + 1] = 0.25 + Math.random() * 2.75;
      motePos[mi * 3 + 2] = lamp.z + Math.sin(ang) * rad;
      moteSeeds[mi] = Math.random() * 6.283;
    }
    var moteGeo = session.trackGeo(new THREE.BufferGeometry());
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    var moteMat = session.trackMat(new THREE.PointsMaterial({
      color: 0xa6e8f8,
      size: 0.09,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var motePts = new THREE.Points(moteGeo, moteMat);
    session.scene.add(motePts);
    dyn.dustPoints = motePts;
    dyn.dustSeeds = moteSeeds;

    // 4. Distant subterranean Ghost Train light-band sweeping across B1 Concourse floor every ~18s
    var sweepGeo = session.trackGeo(new THREE.PlaneGeometry(3.2, 22.0));
    sweepGeo.rotateX(-Math.PI / 2);
    var sweepMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff4638,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.position.set(cx, 0.048, cz);
    sweepMesh.rotation.y = 0.36;
    sweepMesh.visible = false;
    session.scene.add(sweepMesh);
    dyn.trainSweepMesh = sweepMesh;
    dyn.trainSweepMat = sweepMat;
    dyn.trainSweepOriginX = cx - 9.0;
    dyn.trainSweepSpanX = 18.0;

    session.ambientDynamics = dyn;
  }

  function updateAmbientDynamics(session, realDt) {
    var dyn = session && session.ambientDynamics;
    if (!dyn) return;
    var dt = Math.min(0.05, Math.max(0.001, realDt || 0.016));
    var t = session.elapsedReal || 0;

    // 1. Ceiling drips + puddle ripples
    for (var di = 0; di < dyn.drips.length; di++) {
      var d = dyn.drips[di];
      if (!d.active) {
        d.cooldown -= dt;
        if (d.cooldown <= 0) {
          d.active = true;
          d.y = 3.15;
          d.vy = -0.8;
          d.mesh.position.set(d.x, d.y, d.z);
          d.mesh.visible = true;
        }
      } else {
        d.vy -= 14.5 * dt;
        d.y += d.vy * dt;
        d.mesh.position.y = d.y;
        if (d.y <= 0.06) {
          d.active = false;
          d.mesh.visible = false;
          d.cooldown = 2.1 + Math.random() * 2.8;
          if (INFINITY.VfxStudio && typeof INFINITY.VfxStudio.spawnInkStepPuff === 'function') {
            INFINITY.VfxStudio.spawnInkStepPuff(session, d.x, d.z, 0, 0, 0x6eeaff, true);
          }
        }
      }
    }

    // 2. Vent cel steam plumes
    for (var si = 0; si < dyn.steams.length; si++) {
      var st = dyn.steams[si];
      st.phase = (st.phase + dt * st.speed) % 1.0;
      var p = st.phase;
      st.mesh.position.set(
        st.ox + st.driftX * p + Math.sin(t * 1.8 + si) * 0.12,
        0.38 + p * 1.95,
        st.oz + Math.cos(t * 1.4 + si) * 0.1
      );
      var sc = 0.55 + p * 1.15;
      st.mesh.scale.set(sc, sc, 1);
      st.mat.opacity = Math.sin(p * Math.PI) * 0.28;
    }

    // 3. Drifting dust motes under lamp shafts
    if (dyn.dustPoints && dyn.dustPoints.geometry && dyn.dustPoints.geometry.attributes.position) {
      var arr = dyn.dustPoints.geometry.attributes.position.array;
      var seeds = dyn.dustSeeds;
      var cnt = seeds ? seeds.length : 0;
      for (var mi = 0; mi < cnt; mi++) {
        var idx = mi * 3;
        arr[idx] += Math.sin(t * 0.7 + seeds[mi]) * 0.08 * dt;
        arr[idx + 1] -= 0.14 * dt;
        arr[idx + 2] += Math.cos(t * 0.6 + seeds[mi]) * 0.06 * dt;
        if (arr[idx + 1] < 0.16) arr[idx + 1] = 2.95;
      }
      dyn.dustPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Turnstile / kiosk LED glitch pulse
    if (dyn.ledGroups && dyn.ledGroups.length) {
      for (var li = 0; li < dyn.ledGroups.length; li++) {
        var lg = dyn.ledGroups[li];
        if (lg && lg.userData && lg.userData.ledMat) {
          var flk = Math.sin(t * 19.0 + li * 2.7) > -0.78;
          lg.userData.ledMat.color.setHex(flk ? (li % 2 === 0 ? 0x5ce8ff : 0xff3b52) : 0x101822);
        }
      }
    }

    // 5. Subterranean Ghost Train rumble light-band sweep across B1 floor
    if (dyn.trainSweepMesh && dyn.trainSweepMat) {
      if (dyn.trainSweepActive > 0) {
        dyn.trainSweepActive -= dt;
        var sp = 1.0 - Math.max(0, dyn.trainSweepActive / 2.2);
        dyn.trainSweepMesh.position.x = (dyn.trainSweepOriginX || 2.5) + sp * (dyn.trainSweepSpanX || 17.5);
        dyn.trainSweepMat.opacity = Math.sin(sp * Math.PI) * 0.16;
        if (dyn.trainSweepActive <= 0) {
          dyn.trainSweepMesh.visible = false;
          dyn.trainSweepMat.opacity = 0;
        }
      } else {
        dyn.trainSweepTimer -= dt;
        if (dyn.trainSweepTimer <= 0) {
          dyn.trainSweepTimer = 18.0 + Math.random() * 6.0;
          dyn.trainSweepActive = 2.2;
          dyn.trainSweepMesh.visible = true;
          if (typeof session.addCameraShake === 'function') {
            session.addCameraShake(0.06, 0.9, 16);
          }
        }
      }
    }
  }

  function buildZoneProps(session, specs) {
    var THREE = session.THREE;
    var dummy = session._dummy || new THREE.Object3D();
    var steelMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x344052, roughness: 0.62, metalness: 0.44 }));
    var darkMetalMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x161c26, roughness: 0.68, metalness: 0.36 }));
    var woodSlatMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x45372e, roughness: 0.86, metalness: 0.06 }));
    var copperMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xaa6436, roughness: 0.48, metalness: 0.62 }));
    var cyanLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x5aeaff }));
    var amberLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xffaa40 }));
    var redLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xff3b52 }));
    var greenLedMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x4af2a1 }));

    // Helper to position an instanced child offset in local (lx, ly, lz) rotated around Y
    function setLocalInstance(inst, idx, wx, wy, wz, rotY, lx, ly, lz) {
      var cosR = Math.cos(rotY || 0);
      var sinR = Math.sin(rotY || 0);
      dummy.position.set(
        wx + lx * cosR + lz * sinR,
        wy + ly,
        wz - lx * sinR + lz * cosR
      );
      dummy.rotation.set(0, rotY || 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);
    }

    var cbnd = session._sceneAConcourseBounds || { x0: 2, z0: 2, x1: 20, z1: 19 };
    var inConcourse = function (px, pz) {
      return px >= cbnd.x0 - 1 && px <= cbnd.x1 + 1 && pz >= cbnd.z0 - 1 && pz <= cbnd.z1 + 1;
    };

    // 1. B1 Concourse Ticket Turnstiles (Painted 30-deg Scene-A sprites inside B1 + Instanced Batch elsewhere)
    session._sceneALedGroups = [];
    var turnstilesAll = specs.turnstiles || [];
    var turnstiles = [];
    for (var tsi = 0; tsi < turnstilesAll.length; tsi++) {
      var tsCand = turnstilesAll[tsi];
      if (session._sceneAEnabled && inConcourse(tsCand.x, tsCand.z)) {
        var tsCard = createPaintedPropBillboard(THREE, session, 'prop_turnstile', tsCand.x, tsCand.z, 1.48, 1.48, {
          emissiveColor: tsi % 2 === 0 ? 0x5aeaff : 0xff3b52,
          ledX: 0.18,
          ledY: 0.92,
          ledZ: 0.18
        });
        if (tsCard) {
          session._sceneALedGroups.push(tsCard);
          continue;
        }
      }
      turnstiles.push(tsCand);
    }
    if (turnstiles.length > 0) {
      var tsBodyGeo = session.trackGeo(new THREE.BoxGeometry(0.28, 0.96, 1.12));
      var tsTopGeo = session.trackGeo(new THREE.BoxGeometry(0.32, 0.08, 1.16));
      var tsGlassGeo = session.trackGeo(new THREE.BoxGeometry(0.46, 0.48, 0.05));
      var tsGlassMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: 0xff4058,
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      var tsLedGeo = session.trackGeo(new THREE.BoxGeometry(0.18, 0.10, 0.04));

      var tsBodyInst = new THREE.InstancedMesh(tsBodyGeo, steelMat, turnstiles.length);
      var tsTopInst = new THREE.InstancedMesh(tsTopGeo, darkMetalMat, turnstiles.length);
      var tsGlassInst = new THREE.InstancedMesh(tsGlassGeo, tsGlassMat, turnstiles.length);
      var tsLedInst = new THREE.InstancedMesh(tsLedGeo, cyanLedMat, turnstiles.length);
      var ledCol = new THREE.Color();

      for (var ti = 0; ti < turnstiles.length; ti++) {
        var ts = turnstiles[ti];
        setLocalInstance(tsBodyInst, ti, ts.x, 0, ts.z, ts.rotY, 0, 0.48, 0);
        setLocalInstance(tsTopInst, ti, ts.x, 0, ts.z, ts.rotY, 0, 0.98, 0);
        setLocalInstance(tsGlassInst, ti, ts.x, 0, ts.z, ts.rotY, 0.35, 0.56, 0);
        setLocalInstance(tsLedInst, ti, ts.x, 0, ts.z, ts.rotY, 0, 0.82, 0.57);
        if (typeof tsLedInst.setColorAt === 'function') {
          ledCol.setHex(ti % 2 === 0 ? 0x5aeaff : 0xff3b52);
          tsLedInst.setColorAt(ti, ledCol);
        }
      }
      tsBodyInst.instanceMatrix.needsUpdate = true;
      tsTopInst.instanceMatrix.needsUpdate = true;
      tsGlassInst.instanceMatrix.needsUpdate = true;
      tsLedInst.instanceMatrix.needsUpdate = true;
      if (tsLedInst.instanceColor) tsLedInst.instanceColor.needsUpdate = true;
      session.scene.add(tsBodyInst, tsTopInst, tsGlassInst, tsLedInst);
    }

    // 2. Subway Waiting Benches (Painted 30-deg Scene-A sprites inside B1 + Instanced Batch across all 224x152 zones)
    var benchesAll = specs.benches || [];
    var benches = [];
    for (var bni = 0; bni < benchesAll.length; bni++) {
      var bnCand = benchesAll[bni];
      if (session._sceneAEnabled && inConcourse(bnCand.x, bnCand.z)) {
        if (createPaintedPropBillboard(THREE, session, 'prop_bench', bnCand.x, bnCand.z, 2.25, 1.45, {
          flipX: bnCand.x < (cbnd.x0 + cbnd.x1) * 0.5,
          shadowScaleX: 1.05,
          shadowScaleZ: 0.55
        })) {
          continue;
        }
      }
      benches.push(bnCand);
    }
    if (benches.length > 0) {
      var benchSeatGeo = session.trackGeo(new THREE.BoxGeometry(2.1, 0.09, 0.56));
      var benchBackGeo = session.trackGeo(new THREE.BoxGeometry(2.1, 0.44, 0.07));
      var benchLegGeo = session.trackGeo(new THREE.BoxGeometry(0.10, 0.44, 0.50));

      var bSeatInst = new THREE.InstancedMesh(benchSeatGeo, woodSlatMat, benches.length);
      var bBackInst = new THREE.InstancedMesh(benchBackGeo, steelMat, benches.length);
      var bLegInst = new THREE.InstancedMesh(benchLegGeo, darkMetalMat, benches.length * 2);

      for (var bi = 0; bi < benches.length; bi++) {
        var bn = benches[bi];
        setLocalInstance(bSeatInst, bi, bn.x, 0, bn.z, bn.rotY, 0, 0.46, 0);
        setLocalInstance(bBackInst, bi, bn.x, 0, bn.z, bn.rotY, 0, 0.72, -0.24);
        setLocalInstance(bLegInst, bi * 2, bn.x, 0, bn.z, bn.rotY, -0.82, 0.22, 0);
        setLocalInstance(bLegInst, bi * 2 + 1, bn.x, 0, bn.z, bn.rotY, 0.82, 0.22, 0);
      }
      bSeatInst.instanceMatrix.needsUpdate = true;
      bBackInst.instanceMatrix.needsUpdate = true;
      bLegInst.instanceMatrix.needsUpdate = true;
      session.scene.add(bSeatInst, bBackInst, bLegInst);
    }

    // 2B. B1 Concourse Painted Storytelling Clutter Clusters (wall/pillar/booth-tucked, zero lane blocking)
    if (session._sceneAEnabled) {
      var clutterSpots = [
        { x: 31.35, z: 34.4, w: 1.44, h: 1.26, flip: false },
        { x: 31.55, z: 40.2, w: 1.32, h: 1.16, flip: true },
        { x: 51.45, z: 34.4, w: 1.42, h: 1.24, flip: true },
        { x: 51.55, z: 40.3, w: 1.30, h: 1.14, flip: false },
        { x: 34.15, z: 28.4, w: 1.22, h: 1.08, flip: false },
        { x: 48.85, z: 28.4, w: 1.24, h: 1.10, flip: true },
        { x: 16.20, z: 35.8, w: 1.34, h: 1.18, flip: false },
        { x: 16.20, z: 44.8, w: 1.36, h: 1.20, flip: true }
      ];
      for (var cl = 0; cl < clutterSpots.length; cl++) {
        var cs = clutterSpots[cl];
        createPaintedPropBillboard(THREE, session, 'prop_clutter', cs.x, cs.z, cs.w, cs.h, {
          flipX: cs.flip,
          shadowScaleX: 1.08,
          shadowScaleZ: 0.68
        });
      }
    }

    // 3. Illuminated Subway Route Map Kiosk & Overhead Directional Transit Signage
    var routeTex = createRouteMapTexture(THREE, session);
    for (var si = 0; si < specs.wallSigns.length; si++) {
      var sn = specs.wallSigns[si];
      var sg = new THREE.Group();
      sg.position.set(sn.x, sn.y, sn.z);
      sg.rotation.y = sn.rotY || 0;

      var frame = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(sn.w + 0.16, sn.h + 0.16, 0.14)), darkMetalMat);
      addInkOutline(THREE, session, frame, 24);
      sg.add(frame);

      var faceTex = sn.kind === 'route_map'
        ? routeTex
        : createSignTexture(THREE, session, sn.title, sn.sub, sn.accent, '#09111a');
      var faceMat = session.trackMat(new THREE.MeshBasicMaterial({ map: faceTex }));
      var face = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(sn.w, sn.h)), faceMat);
      face.position.z = 0.08;
      sg.add(face);

      // Hanging suspension rods for overhead transit signs
      if (sn.kind === 'hanging_sign') {
        var faceBack = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(sn.w, sn.h)), faceMat);
        faceBack.position.z = -0.08;
        faceBack.rotation.y = Math.PI;
        sg.add(faceBack);
        var rodGeo = session.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 6));
        var rodL = new THREE.Mesh(rodGeo, steelMat);
        rodL.position.set(-sn.w * 0.36, sn.h * 0.5 + 0.32, 0);
        var rodR = new THREE.Mesh(rodGeo, steelMat);
        rodR.position.set(sn.w * 0.36, sn.h * 0.5 + 0.32, 0);
        sg.add(rodL, rodR);
      }
      session.scene.add(sg);
    }

    // 4. Signal Dispatch CRT Monitor Banks & Instanced Server Racks
    var crtTex = createCrtBankTexture(THREE, session);
    var crtMat = session.trackMat(new THREE.MeshBasicMaterial({ map: crtTex }));
    for (var ci = 0; ci < specs.crtBanks.length; ci++) {
      var cb = specs.crtBanks[ci];
      var cg = new THREE.Group();
      cg.position.set(cb.x, cb.y, cb.z);
      var housing = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(cb.w + 0.24, cb.h + 0.24, 0.28)), darkMetalMat);
      addInkOutline(THREE, session, housing, 24);
      var scr = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(cb.w, cb.h)), crtMat);
      scr.position.z = 0.15;
      cg.add(housing, scr);
      session.scene.add(cg);
    }

    var serverRacks = specs.serverRacks || [];
    if (serverRacks.length > 0) {
      var rackGeo = session.trackGeo(new THREE.BoxGeometry(0.86, 2.35, 0.72));
      var ledStripGeo = session.trackGeo(new THREE.BoxGeometry(0.54, 0.06, 0.04));
      var rackInst = new THREE.InstancedMesh(rackGeo, darkMetalMat, serverRacks.length);
      var ledAmberInst = new THREE.InstancedMesh(ledStripGeo, amberLedMat, serverRacks.length);
      var ledCyanInst = new THREE.InstancedMesh(ledStripGeo, cyanLedMat, serverRacks.length);
      var ledGreenInst = new THREE.InstancedMesh(ledStripGeo, greenLedMat, serverRacks.length * 2);

      for (var sr = 0; sr < serverRacks.length; sr++) {
        var rk = serverRacks[sr];
        setLocalInstance(rackInst, sr, rk.x, 0, rk.z, rk.rotY, 0, 1.18, 0);
        setLocalInstance(ledGreenInst, sr * 2, rk.x, 0, rk.z, rk.rotY, 0, 0.65, 0.37);
        setLocalInstance(ledAmberInst, sr, rk.x, 0, rk.z, rk.rotY, 0, 1.07, 0.37);
        setLocalInstance(ledGreenInst, sr * 2 + 1, rk.x, 0, rk.z, rk.rotY, 0, 1.49, 0.37);
        setLocalInstance(ledCyanInst, sr, rk.x, 0, rk.z, rk.rotY, 0, 1.91, 0.37);
      }
      rackInst.instanceMatrix.needsUpdate = true;
      ledAmberInst.instanceMatrix.needsUpdate = true;
      ledCyanInst.instanceMatrix.needsUpdate = true;
      ledGreenInst.instanceMatrix.needsUpdate = true;
      session.scene.add(rackInst, ledAmberInst, ledCyanInst, ledGreenInst);
    }

    // 5. Substation High-Voltage Copper-Coil Transformers (mounted on top of 6 transformer blocks)
    var coilGeo = session.trackGeo(new THREE.CylinderGeometry(0.32, 0.36, 0.95, 10));
    var insGeo = session.trackGeo(new THREE.TorusGeometry(0.36, 0.055, 6, 12));
    insGeo.rotateX(Math.PI / 2);
    var capOrbGeo = session.trackGeo(new THREE.SphereGeometry(0.16, 8, 8));
    var ozoneMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0x6ce4ff }));

    for (var tfi = 0; tfi < specs.transformers.length; tfi++) {
      var tf = specs.transformers[tfi];
      var tg = new THREE.Group();
      tg.position.set(tf.x, 2.62, tf.z);
      for (var side = -0.45; side <= 0.45; side += 0.9) {
        var coil = new THREE.Mesh(coilGeo, copperMat);
        coil.position.set(side, 0.48, 0);
        tg.add(coil);
        for (var ring = 0; ring < 3; ring++) {
          var ins = new THREE.Mesh(insGeo, steelMat);
          ins.position.set(side, 0.25 + ring * 0.26, 0);
          tg.add(ins);
        }
        var orb = new THREE.Mesh(capOrbGeo, ozoneMat);
        orb.position.set(side, 1.06, 0);
        tg.add(orb);
      }
      session.scene.add(tg);
    }

    // Overhead high-voltage copper busbars spanning Substation's 6 transformers (3x2 turbine hall)
    var busbarGeo = session.trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 44.0, 8));
    var busbarN = new THREE.Mesh(busbarGeo, copperMat);
    busbarN.rotation.z = Math.PI / 2;
    busbarN.position.set(41.0, 3.68, 95.0);
    var busbarS = new THREE.Mesh(busbarGeo, copperMat);
    busbarS.rotation.z = Math.PI / 2;
    busbarS.position.set(41.0, 3.68, 125.0);
    session.scene.add(busbarN, busbarS);

    // 6. Tunnel Industrial Pipes (mounted along Z-05 Tunnel south wall z=144.7) & Instanced Maintenance Crates
    var pipeGeo = session.trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 72.0, 8));
    pipeGeo.rotateZ(Math.PI / 2);
    var pipe1 = new THREE.Mesh(pipeGeo, steelMat);
    pipe1.position.set(122.0, 2.38, 144.7);
    var pipe2 = new THREE.Mesh(pipeGeo, copperMat);
    pipe2.position.set(122.0, 2.02, 144.7);
    session.scene.add(pipe1, pipe2);

    var crates = specs.cratesAndBarricades || [];
    if (crates.length > 0) {
      var crateGeo = session.trackGeo(new THREE.BoxGeometry(0.78, 0.66, 0.78));
      var crateMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x303744, roughness: 0.84, metalness: 0.22 }));
      var crateTrimGeo = session.trackGeo(new THREE.BoxGeometry(0.81, 0.10, 0.81));

      var crateInst = new THREE.InstancedMesh(crateGeo, crateMat, crates.length);
      var crateTrimInst = new THREE.InstancedMesh(crateTrimGeo, amberLedMat, crates.length);
      for (var cri = 0; cri < crates.length; cri++) {
        var cr = crates[cri];
        setLocalInstance(crateInst, cri, cr.x, 0, cr.z, cr.rotY, 0, 0.33, 0);
        setLocalInstance(crateTrimInst, cri, cr.x, 0, cr.z, cr.rotY, 0, 0.56, 0);
      }
      crateInst.instanceMatrix.needsUpdate = true;
      crateTrimInst.instanceMatrix.needsUpdate = true;
      session.scene.add(crateInst, crateTrimInst);
    }

    // 6B. Instanced Safety Bollards & Metro Stanchions (framing colonnades & Platform 0 boarding bays)
    var bollards = specs.bollards || [];
    if (bollards.length > 0) {
      var bolPostGeo = session.trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.88, 8));
      var bolBandGeo = session.trackGeo(new THREE.CylinderGeometry(0.125, 0.125, 0.16, 8));
      var bolCapGeo = session.trackGeo(new THREE.SphereGeometry(0.115, 8, 6));

      var bolPostInst = new THREE.InstancedMesh(bolPostGeo, darkMetalMat, bollards.length);
      var bolBandInst = new THREE.InstancedMesh(bolBandGeo, amberLedMat, bollards.length);
      var bolCapInst = new THREE.InstancedMesh(bolCapGeo, steelMat, bollards.length);

      for (var bli = 0; bli < bollards.length; bli++) {
        var bl = bollards[bli];
        setLocalInstance(bolPostInst, bli, bl.x, 0, bl.z, 0, 0, 0.44, 0);
        setLocalInstance(bolBandInst, bli, bl.x, 0, bl.z, 0, 0, 0.66, 0);
        setLocalInstance(bolCapInst, bli, bl.x, 0, bl.z, 0, 0, 0.90, 0);
      }
      bolPostInst.instanceMatrix.needsUpdate = true;
      bolBandInst.instanceMatrix.needsUpdate = true;
      bolCapInst.instanceMatrix.needsUpdate = true;
      session.scene.add(bolPostInst, bolBandInst, bolCapInst);
    }

    // 7. Floor Directional Guiding Strips (aligned to 224x152 Station Zero grand concourse/corridor/platform lanes)
    var stripMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0x4ccce6,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    }));
    // Concourse eastbound promenade into Corridor gateway (z=60.5)
    var strip1 = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(46.0, 0.18)), stripMat);
    strip1.rotation.x = -Math.PI / 2;
    strip1.position.set(60.5, 0.022, 60.5);
    // Corridor central grand boulevard into Platform 0 (z=74.5)
    var strip2 = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(86.0, 0.18)), stripMat);
    strip2.rotation.x = -Math.PI / 2;
    strip2.position.set(132.0, 0.022, 74.5);
    // Platform 0 north-south boarding spine (x=186.5)
    var strip4 = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.18, 124.0)), stripMat);
    strip4.rotation.x = -Math.PI / 2;
    strip4.position.set(186.5, 0.062, 75.0);
    session.scene.add(strip1, strip2, strip4);

    // 8. 6 Zone-Signature 3D Landmarks (distinct ink-outlined silhouettes for instant zone orientation)
    var landmarks = specs.landmarks || [];
    var darkSteel = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x161c26, roughness: 0.70, metalness: 0.42 }));
    for (var lmi = 0; lmi < landmarks.length; lmi++) {
      var lm = landmarks[lmi];
      var zCol = (INFINITY.ArtTokens && typeof INFINITY.ArtTokens.getZoneColor === 'function')
        ? hexToInt(INFINITY.ArtTokens.getZoneColor(lm.zone, lm.color), 0x68c8de)
        : hexToInt(lm.color, 0x68c8de);
      var lmGlowMat = session.trackMat(new THREE.MeshBasicMaterial({ color: zCol }));
      var lmHaloMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: zCol,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var g = new THREE.Group();
      g.position.set(lm.x, 0, lm.z);

      var basePad = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.62, 0.72, 0.14, 8)), darkSteel);
      basePad.position.y = 0.07;
      addInkOutline(THREE, session, basePad, 24);
      g.add(basePad);

      var floorHalo = new THREE.Mesh(session.trackGeo(new THREE.RingGeometry(0.72, 0.82, 24)), lmHaloMat);
      floorHalo.rotation.x = -Math.PI / 2;
      floorHalo.position.y = 0.04;
      g.add(floorHalo);

      if (lm.kind === 'clock_totem') {
        if (session._sceneAEnabled && createPaintedPropBillboard(THREE, session, 'prop_clock_totem', lm.x, lm.z, 1.78, 2.85, {
          emissiveColor: zCol,
          ledX: 0.02,
          ledY: 2.28,
          ledZ: 0.16,
          shadowScaleX: 0.85,
          shadowScaleZ: 0.55
        })) {
          continue;
        }
        var pillar = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.42, 2.35, 0.42)), steelMat);
        pillar.position.y = 1.24;
        addInkOutline(THREE, session, pillar, 24);
        var dialFrame = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.18, 12)), darkSteel);
        dialFrame.rotation.x = Math.PI / 2;
        dialFrame.position.set(0, 2.35, 0.16);
        addInkOutline(THREE, session, dialFrame, 26);
        var dialRing = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.46, 0.04, 8, 24)), lmGlowMat);
        dialRing.position.set(0, 2.35, 0.26);
        var handA = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.05, 0.34, 0.04)), lmGlowMat);
        handA.position.set(0, 2.48, 0.27);
        var handB = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.24, 0.05, 0.04)), lmGlowMat);
        handB.position.set(0.10, 2.35, 0.27);
        g.add(pillar, dialFrame, dialRing, handA, handB);
      } else if (lm.kind === 'transit_arch') {
        var postL = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.22, 2.6, 0.24)), steelMat);
        postL.position.set(-0.62, 1.3, 0);
        addInkOutline(THREE, session, postL, 24);
        var postR = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.22, 2.6, 0.24)), steelMat);
        postR.position.set(0.62, 1.3, 0);
        addInkOutline(THREE, session, postR, 24);
        var lintel = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.56, 0.28, 0.30)), darkSteel);
        lintel.position.set(0, 2.55, 0);
        addInkOutline(THREE, session, lintel, 24);
        var neonBar = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.36, 0.08, 0.34)), lmGlowMat);
        neonBar.position.set(0, 2.42, 0);
        g.add(postL, postR, lintel, neonBar);
      } else if (lm.kind === 'radar_tower') {
        var mast = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.12, 0.26, 2.2, 6)), steelMat);
        mast.position.y = 1.15;
        addInkOutline(THREE, session, mast, 24);
        var dish = new THREE.Mesh(session.trackGeo(new THREE.ConeGeometry(0.55, 0.35, 10, 1, true)), darkSteel);
        dish.position.set(0, 2.32, 0);
        dish.rotation.x = 0.55;
        addInkOutline(THREE, session, dish, 26);
        var tip = new THREE.Mesh(session.trackGeo(new THREE.OctahedronGeometry(0.18, 0)), lmGlowMat);
        tip.position.set(0, 2.55, 0.12);
        var ring1 = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.42, 0.03, 6, 20)), lmGlowMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 1.75;
        g.add(mast, dish, tip, ring1);
      } else if (lm.kind === 'tesla_coil') {
        var core = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 2.35, 8)), copperMat);
        core.position.y = 1.24;
        addInkOutline(THREE, session, core, 26);
        for (var tci = 0; tci < 3; tci++) {
          var coilRing = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.44 - tci * 0.05, 0.055, 8, 20)), steelMat);
          coilRing.rotation.x = Math.PI / 2;
          coilRing.position.y = 1.15 + tci * 0.45;
          g.add(coilRing);
        }
        var crown = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.36, 0.08, 8, 20)), lmGlowMat);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 2.45;
        g.add(core, crown);
      } else if (lm.kind === 'vent_turbine') {
        var shroud = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.42, 12, 1, true)), darkSteel);
        shroud.rotation.x = Math.PI / 2;
        shroud.position.set(0, 1.35, 0);
        addInkOutline(THREE, session, shroud, 26);
        var stand = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.85, 0.72, 0.45)), steelMat);
        stand.position.y = 0.42;
        addInkOutline(THREE, session, stand, 24);
        var bladeGeo = session.trackGeo(new THREE.BoxGeometry(1.12, 0.14, 0.05));
        var bladeA = new THREE.Mesh(bladeGeo, steelMat);
        bladeA.position.set(0, 1.35, 0);
        var bladeB = new THREE.Mesh(bladeGeo, steelMat);
        bladeB.position.set(0, 1.35, 0);
        bladeB.rotation.z = Math.PI / 2;
        var hub = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.16, 10, 10)), lmGlowMat);
        hub.position.set(0, 1.35, 0.06);
        var rim = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.66, 0.035, 6, 24)), lmGlowMat);
        rim.position.set(0, 1.35, 0.21);
        g.add(shroud, stand, bladeA, bladeB, hub, rim);
      } else if (lm.kind === 'signal_mast') {
        var pole = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.10, 0.14, 2.75, 8)), steelMat);
        pole.position.y = 1.42;
        addInkOutline(THREE, session, pole, 26);
        var sbox = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.36, 0.96, 0.28)), darkSteel);
        sbox.position.set(0, 2.35, 0.06);
        addInkOutline(THREE, session, sbox, 24);
        var lampTop = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.10, 10, 10)), lmGlowMat);
        lampTop.position.set(0, 2.62, 0.20);
        var lampMid = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.10, 10, 10)), lmGlowMat);
        lampMid.position.set(0, 2.35, 0.20);
        var arm = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.82, 0.09, 0.09)), lmGlowMat);
        arm.position.set(0.35, 1.78, 0);
        g.add(pole, sbox, lampTop, lampMid, arm);
      }
      session.scene.add(g);
    }

    // 9. Bespoke Zone-Specific 3D Architectural Storytelling Set-Pieces across all 6 Zones
    var zsp = specs.zoneSetPieces || {};
    var glassPaneMat = session.trackMat(new THREE.MeshStandardMaterial({
      color: 0x9ad8ee,
      roughness: 0.16,
      metalness: 0.25,
      transparent: true,
      opacity: 0.34,
      depthWrite: false
    }));
    var shutterMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x263140, roughness: 0.72, metalness: 0.45 }));
    var brassValveMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: 0.44, metalness: 0.66 }));
    var hazardYellowMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xdca032, roughness: 0.60, metalness: 0.18 }));
    var rustDrumMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x4b3830, roughness: 0.84, metalness: 0.24 }));

    // --- 9A. Z-01 CONCOURSE SET-PIECES ---
    if (zsp.concourse) {
      var conc = zsp.concourse;

      // Staffed Glass Ticket Office Fascia, Counter Shelf & Illuminated Sign atop (38..44, 11..13)
      if (conc.ticketBooth) {
        var tb = conc.ticketBooth;
        var tbg = new THREE.Group();
        tbg.position.set(tb.x, 0, tb.z);
        var tbRoof = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(tb.w + 0.5, 0.28, tb.d + 0.5)), darkSteel);
        tbRoof.position.y = 2.52;
        addInkOutline(THREE, session, tbRoof, 24);
        var tbCounterS = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(tb.w + 0.2, 0.12, 0.42)), steelMat);
        tbCounterS.position.set(0, 1.02, tb.d * 0.5 + 0.16);
        var tbSignTex = createSignTexture(THREE, session, '售票 / 补票处 · TICKETS', 'Z-01A  ·  MANUAL TICKET OFFICE', '#68c8de', '#091520');
        var tbSign = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(5.6, 0.62)), session.trackMat(new THREE.MeshBasicMaterial({ map: tbSignTex })));
        tbSign.position.set(0, 2.52, tb.d * 0.5 + 0.27);
        // Interior glowing clerk monitors visible through glass partition
        var clerkScr = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.62, 0.40, 0.08)), cyanLedMat);
        clerkScr.position.set(-1.4, 1.32, 0.2);
        var clerkScr2 = clerkScr.clone();
        clerkScr2.position.set(1.4, 1.32, 0.2);
        tbg.add(tbRoof, tbCounterS, tbSign, clerkScr, clerkScr2);
        session.scene.add(tbg);
      }

      // West Atrium Staffed Station Inquiry & Duty Booth atop (28..30, 35..39) — directly visible in opening frame
      if (conc.atriumDutyBooth) {
        var db = conc.atriumDutyBooth;
        var dbg = new THREE.Group();
        dbg.position.set(db.x, 0, db.z);
        var dbRoof = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(db.w + 0.55, 0.30, db.d + 0.55)), darkSteel);
        dbRoof.position.y = 2.52;
        addInkOutline(THREE, session, dbRoof, 24);
        // Counter ledge facing east into central atrium
        var dbCounterE = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.38, 0.12, db.d - 0.3)), steelMat);
        dbCounterE.position.set(db.w * 0.5 + 0.16, 1.02, 0);
        addInkOutline(THREE, session, dbCounterE, 24);
        var dbBrassTray = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.24, 0.04, 0.84)), brassValveMat);
        dbBrassTray.position.set(db.w * 0.5 + 0.20, 1.09, 0.2);
        // Illuminated canopy signage facing East (towards spawn) and South
        var dbSignTex = createSignTexture(THREE, session, '站务问询 · 补票亭', 'B1 STATION OFFICE · INQUIRY', '#68c8de', '#091520');
        var dbSignMat = session.trackMat(new THREE.MeshBasicMaterial({ map: dbSignTex }));
        var dbSignE = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(4.4, 0.54)), dbSignMat);
        dbSignE.position.set(db.w * 0.5 + 0.29, 2.52, 0);
        dbSignE.rotation.y = Math.PI * 0.5;
        var dbSignS = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(2.7, 0.50)), dbSignMat);
        dbSignS.position.set(0, 2.52, db.d * 0.5 + 0.29);
        // Interior clerk monitors + warm amber desk lamp glowing through the glazed window
        var dbDesk = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.1, 0.10, 3.2)), darkMetalMat);
        dbDesk.position.set(0.2, 1.02, 0);
        var dbMon1 = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.08, 0.42, 0.58)), cyanLedMat);
        dbMon1.position.set(0.35, 1.36, -0.75);
        var dbMon2 = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.08, 0.38, 0.52)), amberLedMat);
        dbMon2.position.set(0.35, 1.34, 0.72);
        var dbLampShade = new THREE.Mesh(session.trackGeo(new THREE.ConeGeometry(0.22, 0.16, 8)), brassValveMat);
        dbLampShade.position.set(-0.1, 1.62, 0.05);
        var dbLampBulb = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.11, 8, 8)), amberLedMat);
        dbLampBulb.position.set(-0.1, 1.52, 0.05);
        // Illuminated Subway Map framed on south face of booth
        var dbMapFrame = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.1, 1.25, 0.12)), darkMetalMat);
        dbMapFrame.position.set(0, 1.48, db.d * 0.5 + 0.04);
        addInkOutline(THREE, session, dbMapFrame, 24);
        var dbMapFace = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(1.92, 1.08)), session.trackMat(new THREE.MeshBasicMaterial({ map: routeTex })));
        dbMapFace.position.set(0, 1.48, db.d * 0.5 + 0.11);
        dbg.add(dbRoof, dbCounterE, dbBrassTray, dbSignE, dbSignS, dbDesk, dbMon1, dbMon2, dbLampShade, dbLampBulb, dbMapFrame, dbMapFace);
        session.scene.add(dbg);
      }

      // East Atrium Shuttered Metro Newsstand / Convenience Kiosk atop (52..54, 35..39)
      if (conc.atriumNewsstand) {
        var ns = conc.atriumNewsstand;
        var nsg = new THREE.Group();
        nsg.position.set(ns.x, 0, ns.z);
        var nsRoof = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(ns.w + 0.55, 0.30, ns.d + 0.55)), darkSteel);
        nsRoof.position.y = 2.52;
        addInkOutline(THREE, session, nsRoof, 24);
        // Half-jammed corrugated steel shutter facing west into atrium
        var nsShutter = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.16, 1.68, 4.1)), shutterMat);
        nsShutter.position.set(-ns.w * 0.5 - 0.04, 1.38, 0);
        nsShutter.rotation.x = 0.025;
        addInkOutline(THREE, session, nsShutter, 24);
        // Horizontal shutter rib seams
        for (var sr = 0; sr < 5; sr++) {
          var sRib = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.20, 0.04, 4.05)), darkMetalMat);
          sRib.position.set(-ns.w * 0.5 - 0.05, 0.72 + sr * 0.32, 0);
          nsg.add(sRib);
        }
        // Backlit fascia sign facing west (toward spawn) and south
        var nsSignTex = createSignTexture(THREE, session, '零号报刊便利亭 · 封存', 'METRO NEWSSTAND · CLOSED 00:00', '#d6b274', '#13161e');
        var nsSignMat = session.trackMat(new THREE.MeshBasicMaterial({ map: nsSignTex }));
        var nsSignW = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(4.4, 0.54)), nsSignMat);
        nsSignW.position.set(-ns.w * 0.5 - 0.29, 2.52, 0);
        nsSignW.rotation.y = -Math.PI * 0.5;
        var nsSignS = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(2.7, 0.50)), nsSignMat);
        nsSignS.position.set(0, 2.52, ns.d * 0.5 + 0.29);
        // Mud-smeared metro ad lightbox on south facade facing oncoming corridor traffic
        var nsAdTex = createMudSmearedAdTexture(THREE, session, 1);
        var nsAdFrame = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.25, 1.18, 0.14)), darkMetalMat);
        nsAdFrame.position.set(0, 1.44, ns.d * 0.5 + 0.05);
        addInkOutline(THREE, session, nsAdFrame, 24);
        var nsAdFace = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(2.08, 1.02)), session.trackMat(new THREE.MeshBasicMaterial({ map: nsAdTex })));
        nsAdFace.position.set(0, 1.44, ns.d * 0.5 + 0.13);
        nsg.add(nsRoof, nsShutter, nsSignW, nsSignS, nsAdFrame, nsAdFace);
        session.scene.add(nsg);
      }

      // Grounded Architectural Octagonal Curb Plinth & Twin Metro Bins anchoring Clock Totem (41.5, 29.5)
      if (conc.atriumClockPlinth) {
        var cp = conc.atriumClockPlinth;
        var cpg = new THREE.Group();
        cpg.position.set(cp.x, 0, cp.z);
        var cpBase = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(1.18, 1.32, 0.22, 8)), darkSteel);
        cpBase.position.y = 0.11;
        addInkOutline(THREE, session, cpBase, 24);
        // Subtle brass outer collar ring with inset dark-slate terrazzo top cap
        var cpTrim = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(1.22, 1.22, 0.04, 8)), brassValveMat);
        cpTrim.position.y = 0.21;
        var cpTopCap = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(1.12, 1.14, 0.05, 8)), steelMat);
        cpTopCap.position.y = 0.23;
        addInkOutline(THREE, session, cpTopCap, 24);
        // Twin dark-steel subway waste bins flanking the clock pedestal
        var binGeo = session.trackGeo(new THREE.BoxGeometry(0.46, 0.82, 0.42));
        var binTopGeo = session.trackGeo(new THREE.BoxGeometry(0.50, 0.08, 0.46));
        var binL = new THREE.Mesh(binGeo, steelMat);
        binL.position.set(-1.72, 0.41, 0.18);
        addInkOutline(THREE, session, binL, 24);
        var binLTop = new THREE.Mesh(binTopGeo, darkMetalMat);
        binLTop.position.set(-1.72, 0.85, 0.18);
        var binR = new THREE.Mesh(binGeo, steelMat);
        binR.position.set(1.72, 0.41, 0.18);
        addInkOutline(THREE, session, binR, 24);
        var binRTop = new THREE.Mesh(binTopGeo, darkMetalMat);
        binRTop.position.set(1.72, 0.85, 0.18);
        cpg.add(cpBase, cpTrim, cpTopCap, binL, binLTop, binR, binRTop);
        session.scene.add(cpg);
      }

      // Overhead Z-01B Heavy-Ink Subway Ceiling Steel I-Beams & Hanging Conduit Pipes (with dynamic player cutaway)
      var girders = conc.atriumGirders || [];
      if (girders.length > 0) {
        var applyOhCut = typeof session._applyOverheadCutaway === 'function' ? session._applyOverheadCutaway : function (m) { return m; };
        var girderMat = applyOhCut(session.trackMat(new THREE.MeshStandardMaterial({ color: 0x0d121a, roughness: 0.86, metalness: 0.34 })), 'girder');
        var flangeMat = applyOhCut(session.trackMat(new THREE.MeshStandardMaterial({ color: 0x161c26, roughness: 0.68, metalness: 0.36 })), 'flange');
        var pipeMat = applyOhCut(session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1d2634, roughness: 0.68, metalness: 0.52 })), 'pipe');
        var tubeLampMat = applyOhCut(session.trackMat(new THREE.MeshBasicMaterial({ color: 0x9cdcf0, transparent: true, opacity: 0.58 })), 'tube');
        for (var gi = 0; gi < girders.length; gi++) {
          var gd = girders[gi];
          var gg = new THREE.Group();
          gg.position.set(gd.x, 3.62, gd.z);
          var beam = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(gd.spanX, 0.28, 0.34)), girderMat);
          var flange = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(gd.spanX, 0.06, 0.46)), flangeMat);
          flange.position.y = -0.15;
          var conduit = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.05, 0.05, gd.spanX, 6)), pipeMat);
          conduit.rotation.z = Math.PI * 0.5;
          conduit.position.set(0, -0.22, 0.20);
          gg.add(beam, flange, conduit);
          // Recessed fluorescent tube segments along underside of girder
          var lampOffsets = [-11.5, -4.5, 4.5, 11.5];
          for (var lo = 0; lo < lampOffsets.length; lo++) {
            var tube = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.6, 0.05, 0.14)), tubeLampMat);
            tube.position.set(lampOffsets[lo], -0.20, 0);
            gg.add(tube);
          }
          session.scene.add(gg);
        }
      }

      // Automatic Ticket Vending Machine (TVM) Banks (Instanced)
      var tvms = conc.tvmBanks || [];
      if (tvms.length > 0) {
        var tvmBodyGeo = session.trackGeo(new THREE.BoxGeometry(1.15, 2.02, 0.72));
        var tvmScrGeo = session.trackGeo(new THREE.BoxGeometry(0.76, 0.58, 0.05));
        var tvmHeadGeo = session.trackGeo(new THREE.BoxGeometry(1.18, 0.22, 0.76));
        var tvmBodyInst = new THREE.InstancedMesh(tvmBodyGeo, steelMat, tvms.length);
        var tvmScrInst = new THREE.InstancedMesh(tvmScrGeo, cyanLedMat, tvms.length);
        var tvmHeadInst = new THREE.InstancedMesh(tvmHeadGeo, darkMetalMat, tvms.length);
        for (var tv = 0; tv < tvms.length; tv++) {
          setLocalInstance(tvmBodyInst, tv, tvms[tv].x, 0, tvms[tv].z, tvms[tv].rotY, 0, 1.01, 0);
          setLocalInstance(tvmScrInst, tv, tvms[tv].x, 0, tvms[tv].z, tvms[tv].rotY, 0, 1.34, 0.37);
          setLocalInstance(tvmHeadInst, tv, tvms[tv].x, 0, tvms[tv].z, tvms[tv].rotY, 0, 2.06, 0);
        }
        tvmBodyInst.instanceMatrix.needsUpdate = true;
        tvmScrInst.instanceMatrix.needsUpdate = true;
        tvmHeadInst.instanceMatrix.needsUpdate = true;
        session.scene.add(tvmBodyInst, tvmScrInst, tvmHeadInst);
      }

      // West Security Bay: 2 X-Ray Baggage Conveyor Scanners atop (10..13, 31..32) & (10..13, 48..49)
      var xrays = conc.xrayScanners || [];
      for (var xi = 0; xi < xrays.length; xi++) {
        var xr = xrays[xi];
        var xrg = new THREE.Group();
        xrg.position.set(xr.x, 1.24, xr.z);
        var tunnelHood = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.15, 1.08, 1.62)), steelMat);
        tunnelHood.position.set(0, 0.54, 0);
        addInkOutline(THREE, session, tunnelHood, 24);
        var belt = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(3.85, 0.14, 1.18)), darkMetalMat);
        belt.position.set(0, 0.08, 0);
        addInkOutline(THREE, session, belt, 24);
        var leadCurtainL = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.08, 0.84, 1.16)), darkSteel);
        leadCurtainL.position.set(-1.08, 0.48, 0);
        var leadCurtainR = leadCurtainL.clone();
        leadCurtainR.position.set(1.08, 0.48, 0);
        var xrScreen = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.68, 0.44, 0.08)), amberLedMat);
        xrScreen.position.set(0.25, 1.32, 0.52);
        var xrBeacon = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.20, 8)), amberLedMat);
        xrBeacon.position.set(-0.72, 1.18, 0);
        xrg.add(tunnelHood, belt, leadCurtainL, leadCurtainR, xrScreen, xrBeacon);
        session.scene.add(xrg);
      }

      // Walk-Through Metal Detector Arches (Instanced)
      var dets = conc.metalDetectors || [];
      if (dets.length > 0) {
        var detLegGeo = session.trackGeo(new THREE.BoxGeometry(0.18, 2.26, 0.58));
        var detTopGeo = session.trackGeo(new THREE.BoxGeometry(1.18, 0.24, 0.62));
        var detLedGeo = session.trackGeo(new THREE.BoxGeometry(0.76, 0.08, 0.66));
        var detLegInst = new THREE.InstancedMesh(detLegGeo, steelMat, dets.length * 2);
        var detTopInst = new THREE.InstancedMesh(detTopGeo, darkMetalMat, dets.length);
        var detLedInst = new THREE.InstancedMesh(detLedGeo, greenLedMat, dets.length);
        for (var md = 0; md < dets.length; md++) {
          setLocalInstance(detLegInst, md * 2, dets[md].x, 0, dets[md].z, dets[md].rotY, -0.50, 1.13, 0);
          setLocalInstance(detLegInst, md * 2 + 1, dets[md].x, 0, dets[md].z, dets[md].rotY, 0.50, 1.13, 0);
          setLocalInstance(detTopInst, md, dets[md].x, 0, dets[md].z, dets[md].rotY, 0, 2.24, 0);
          setLocalInstance(detLedInst, md, dets[md].x, 0, dets[md].z, dets[md].rotY, 0, 2.24, 0);
        }
        detLegInst.instanceMatrix.needsUpdate = true;
        detTopInst.instanceMatrix.needsUpdate = true;
        detLedInst.instanceMatrix.needsUpdate = true;
        session.scene.add(detLegInst, detTopInst, detLedInst);
      }

      // East Lounge Wing: Shuttered Metro Convenience Kiosks atop (73..76, 27..32) & (73..76, 40..45)
      var kiosks = conc.kiosks || [];
      for (var ki = 0; ki < kiosks.length; ki++) {
        var kk = kiosks[ki];
        var kg = new THREE.Group();
        kg.position.set(kk.x, 0, kk.z);
        var kRoof = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(4.4, 0.34, 6.4)), darkSteel);
        kRoof.position.y = 2.54;
        addInkOutline(THREE, session, kRoof, 24);
        var kShutter = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.16, 1.92, 5.2)), shutterMat);
        kShutter.position.set(-2.02, 1.18, 0);
        addInkOutline(THREE, session, kShutter, 24);
        var kSignTex = createSignTexture(THREE, session, kk.title, kk.sub, kk.accent, '#101822');
        var kSign = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(5.2, 0.72)), session.trackMat(new THREE.MeshBasicMaterial({ map: kSignTex })));
        kSign.position.set(-2.22, 2.54, 0);
        kSign.rotation.y = -Math.PI * 0.5;
        kg.add(kRoof, kShutter, kSign);
        session.scene.add(kg);
      }

      // Heavy-Ink Subway Beverage/Snack Vending Machines (Instanced with detailed drink-shelf texture)
      var vms = conc.vendingMachines || [];
      if (vms.length > 0) {
        var vmBodyGeo = session.trackGeo(new THREE.BoxGeometry(1.10, 2.15, 0.78));
        var vmGlassGeo = session.trackGeo(new THREE.BoxGeometry(0.86, 1.38, 0.05));
        var vmGlowMat = session.trackMat(new THREE.MeshBasicMaterial({ map: createVendingFrontTexture(THREE, session) }));
        var vmBodyInst = new THREE.InstancedMesh(vmBodyGeo, darkMetalMat, vms.length);
        var vmGlassInst = new THREE.InstancedMesh(vmGlassGeo, vmGlowMat, vms.length);
        for (var vi = 0; vi < vms.length; vi++) {
          setLocalInstance(vmBodyInst, vi, vms[vi].x, 0, vms[vi].z, vms[vi].rotY, 0, 1.08, 0);
          setLocalInstance(vmGlassInst, vi, vms[vi].x, 0, vms[vi].z, vms[vi].rotY, 0, 1.24, 0.40);
        }
        vmBodyInst.instanceMatrix.needsUpdate = true;
        vmGlassInst.instanceMatrix.needsUpdate = true;
        session.scene.add(vmBodyInst, vmGlassInst);
      }

      // Abandoned Passenger Rolling Suitcases (Style-1 Heavy-Ink Textured Cases + Brass Strap + Handle)
      var lugs = conc.luggageClusters || [];
      if (lugs.length > 0) {
        var lugGeo = session.trackGeo(new THREE.BoxGeometry(0.58, 0.72, 0.34));
        var lugStrapGeo = session.trackGeo(new THREE.BoxGeometry(0.60, 0.12, 0.36));
        var lugHandleGeo = session.trackGeo(new THREE.BoxGeometry(0.28, 0.34, 0.06));
        var lugMat = session.trackMat(new THREE.MeshStandardMaterial({
          map: createStyle1PropTexture(THREE, session, 'dark_case'),
          roughness: 0.78,
          metalness: 0.20
        }));
        var lugInst = new THREE.InstancedMesh(lugGeo, lugMat, lugs.length);
        var lugStrapInst = new THREE.InstancedMesh(lugStrapGeo, brassValveMat, lugs.length);
        var lugHInst = new THREE.InstancedMesh(lugHandleGeo, darkMetalMat, lugs.length);
        for (var li2 = 0; li2 < lugs.length; li2++) {
          setLocalInstance(lugInst, li2, lugs[li2].x, 0, lugs[li2].z, lugs[li2].rotY, 0, 0.36, 0);
          setLocalInstance(lugStrapInst, li2, lugs[li2].x, 0, lugs[li2].z, lugs[li2].rotY, 0, 0.38, 0);
          setLocalInstance(lugHInst, li2, lugs[li2].x, 0, lugs[li2].z, lugs[li2].rotY, 0, 0.84, 0);
        }
        lugInst.instanceMatrix.needsUpdate = true;
        lugStrapInst.instanceMatrix.needsUpdate = true;
        lugHInst.instanceMatrix.needsUpdate = true;
        session.scene.add(lugInst, lugStrapInst, lugHInst);
      }
    }

    // --- 9B. Z-02 CORRIDOR SET-PIECES ---
    if (zsp.corridor) {
      var corr = zsp.corridor;
      // Mud-Smeared Glowing Advertising Lightboxes (Scenario Lore: 广告灯箱全部被黑泥涂抹)
      var adTexList = [
        createMudSmearedAdTexture(THREE, session, 0),
        createMudSmearedAdTexture(THREE, session, 1),
        createMudSmearedAdTexture(THREE, session, 2)
      ];
      var ads = corr.adLightboxes || [];
      for (var ai = 0; ai < ads.length; ai++) {
        var ad = ads[ai];
        var adg = new THREE.Group();
        adg.position.set(ad.x, ad.y, ad.z);
        adg.rotation.y = ad.rotY || 0;
        var adFrame = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(3.45, 1.56, 0.16)), darkMetalMat);
        addInkOutline(THREE, session, adFrame, 24);
        var adFace = new THREE.Mesh(
          session.trackGeo(new THREE.PlaneGeometry(3.25, 1.38)),
          session.trackMat(new THREE.MeshBasicMaterial({ map: adTexList[ad.variant % 3] }))
        );
        adFace.position.z = 0.09;
        adg.add(adFrame, adFace);
        session.scene.add(adg);
      }

      // Recessed Red-Framed Fire Hydrant Wall Cabinets (Instanced)
      var fires = corr.fireCabinets || [];
      if (fires.length > 0) {
        var fcBoxGeo = session.trackGeo(new THREE.BoxGeometry(0.76, 1.05, 0.24));
        var fcRedMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x8f242c, roughness: 0.54, metalness: 0.30 }));
        var fcGlassGeo = session.trackGeo(new THREE.BoxGeometry(0.56, 0.64, 0.05));
        var fcBoxInst = new THREE.InstancedMesh(fcBoxGeo, fcRedMat, fires.length);
        var fcGlassInst = new THREE.InstancedMesh(fcGlassGeo, glassPaneMat, fires.length);
        for (var fi2 = 0; fi2 < fires.length; fi2++) {
          setLocalInstance(fcBoxInst, fi2, fires[fi2].x, fires[fi2].y, fires[fi2].z, fires[fi2].rotY, 0, 0, 0);
          setLocalInstance(fcGlassInst, fi2, fires[fi2].x, fires[fi2].y, fires[fi2].z, fires[fi2].rotY, 0, 0.06, 0.12);
        }
        fcBoxInst.instanceMatrix.needsUpdate = true;
        fcGlassInst.instanceMatrix.needsUpdate = true;
        session.scene.add(fcBoxInst, fcGlassInst);
      }

      // Vintage Metro Payphone Alcoves (Instanced)
      var phones = corr.payphones || [];
      if (phones.length > 0) {
        var phHoodGeo = session.trackGeo(new THREE.BoxGeometry(0.72, 1.15, 0.54));
        var phUnitGeo = session.trackGeo(new THREE.BoxGeometry(0.32, 0.56, 0.18));
        var phHoodInst = new THREE.InstancedMesh(phHoodGeo, steelMat, phones.length);
        var phUnitInst = new THREE.InstancedMesh(phUnitGeo, darkMetalMat, phones.length);
        for (var phi = 0; phi < phones.length; phi++) {
          setLocalInstance(phHoodInst, phi, phones[phi].x, 0, phones[phi].z, phones[phi].rotY, 0, 1.56, 0);
          setLocalInstance(phUnitInst, phi, phones[phi].x, 0, phones[phi].z, phones[phi].rotY, 0, 1.44, 0.14);
        }
        phHoodInst.instanceMatrix.needsUpdate = true;
        phUnitInst.instanceMatrix.needsUpdate = true;
        session.scene.add(phHoodInst, phUnitInst);
      }

      // Overhead Corridor Concrete Architectural Beams spanning Z-02 (Instanced, framing central hub cleanly)
      var corrBeamGeo = session.trackGeo(new THREE.BoxGeometry(0.36, 0.34, 48.0));
      var corrBeamXs = [90.5, 102.5, 114.5, 130.5, 142.5, 154.5];
      var corrBeamInst = new THREE.InstancedMesh(corrBeamGeo, darkSteel, corrBeamXs.length);
      for (var cbi = 0; cbi < corrBeamXs.length; cbi++) {
        dummy.position.set(corrBeamXs[cbi], 3.56, 74.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        corrBeamInst.setMatrixAt(cbi, dummy.matrix);
      }
      corrBeamInst.instanceMatrix.needsUpdate = true;
      session.scene.add(corrBeamInst);
    }

    // --- 9C. Z-03 DISPATCH SET-PIECES ---
    if (zsp.dispatch) {
      var disp = zsp.dispatch;

      // Horseshoe Operator Multi-Monitor Console Desks atop (114..117, 14..15) & (127..130, 14..15)
      var desks = disp.consoleDesks || [];
      for (var dki = 0; dki < desks.length; dki++) {
        var dk = desks[dki];
        var dkg = new THREE.Group();
        dkg.position.set(dk.x, 1.24, dk.z);
        var deskTop = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(4.1, 0.12, 1.95)), darkMetalMat);
        deskTop.position.y = 0.06;
        addInkOutline(THREE, session, deskTop, 24);
        dkg.add(deskTop);
        // 3 angled emerald-glowing CRT dispatch monitors per operator bay
        for (var mi = -1; mi <= 1; mi++) {
          var monCase = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.86, 0.58, 0.36)), darkSteel);
          monCase.position.set(mi * 1.12, 0.42, -0.34);
          monCase.rotation.y = -mi * 0.22;
          addInkOutline(THREE, session, monCase, 24);
          var monScr = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.74, 0.46)), crtMat);
          monScr.position.set(0, 0, 0.19);
          monCase.add(monScr);
          dkg.add(monCase);
        }
        session.scene.add(dkg);
      }

      // Iconic 43.2Hz Mimic Broadcast Microphone Stand (Scenario Lore centerpiece!)
      if (disp.broadcastMic) {
        var bm = disp.broadcastMic;
        var bmg = new THREE.Group();
        bmg.position.set(bm.x, 0, bm.z);
        var bmBase = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.32, 0.38, 0.10, 10)), darkSteel);
        bmBase.position.y = 0.05;
        var bmPole = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.035, 0.045, 1.56, 8)), steelMat);
        bmPole.position.y = 0.84;
        var bmArm = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.62, 6)), steelMat);
        bmArm.position.set(0.18, 1.66, 0.10);
        bmArm.rotation.z = -0.72;
        var bmHead = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.08, 0.07, 0.22, 8)), brassValveMat);
        bmHead.position.set(0.40, 1.84, 0.14);
        bmHead.rotation.z = 0.55;
        var bmTally = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.08, 8, 8)), redLedMat);
        bmTally.position.set(0, 1.68, 0);
        bmg.add(bmBase, bmPole, bmArm, bmHead, bmTally);
        session.scene.add(bmg);
      }

      // West Server Vault Tall Server Rack Stacks atop (90..91, 12..18) & (98..99, 12..18) + Overhead Cable Trays
      var vBlocks = disp.vaultRackBlocks || [];
      for (var vb = 0; vb < vBlocks.length; vb++) {
        var blk = vBlocks[vb];
        var vbg = new THREE.Group();
        vbg.position.set(blk.x, 1.25, blk.z);
        var rackBody = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.78, 1.38, blk.d - 0.2)), darkMetalMat);
        rackBody.position.y = 0.69;
        addInkOutline(THREE, session, rackBody, 24);
        var ledStripE = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.06, 0.10, blk.d - 0.8)), greenLedMat);
        ledStripE.position.set(0.92, 0.96, 0);
        var ledStripW = ledStripE.clone();
        ledStripW.position.set(-0.92, 0.96, 0);
        var ledStripE2 = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.06, 0.08, blk.d - 0.8)), cyanLedMat);
        ledStripE2.position.set(0.92, 0.56, 0);
        vbg.add(rackBody, ledStripE, ledStripW, ledStripE2);
        session.scene.add(vbg);
      }
      // Overhead galvanized cable trays spanning West Server Vault
      var trayGeo = session.trackGeo(new THREE.BoxGeometry(20.0, 0.12, 0.68));
      var tray1 = new THREE.Mesh(trayGeo, steelMat);
      tray1.position.set(95.0, 3.35, 15.5);
      var tray2 = new THREE.Mesh(trayGeo, steelMat);
      tray2.position.set(95.0, 3.35, 29.5);
      session.scene.add(tray1, tray2);

      // East Timetable Archive: Illuminated Railway Track Map Table atop (147..151, 23..25)
      if (disp.archiveMapTable) {
        var mt = disp.archiveMapTable;
        var mtg = new THREE.Group();
        mtg.position.set(mt.x, 1.25, mt.z);
        var mtBezel = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(mt.w + 0.1, 0.18, mt.d + 0.1)), darkSteel);
        mtBezel.position.y = 0.09;
        addInkOutline(THREE, session, mtBezel, 24);
        var mtTex = createTrackMapTableTexture(THREE, session);
        var mtGlass = new THREE.Mesh(
          session.trackGeo(new THREE.PlaneGeometry(mt.w - 0.25, mt.d - 0.25)),
          session.trackMat(new THREE.MeshBasicMaterial({ map: mtTex }))
        );
        mtGlass.rotation.x = -Math.PI / 2;
        mtGlass.position.y = 0.20;
        mtg.add(mtBezel, mtGlass);
        session.scene.add(mtg);
      }

      // Steel Archive Filing Cabinets (Instanced)
      var fils = disp.filingCabinets || [];
      if (fils.length > 0) {
        var filGeo = session.trackGeo(new THREE.BoxGeometry(0.84, 1.62, 0.64));
        var filInst = new THREE.InstancedMesh(filGeo, steelMat, fils.length);
        for (var fl = 0; fl < fils.length; fl++) {
          setLocalInstance(filInst, fl, fils[fl].x, 0, fils[fl].z, fils[fl].rotY, 0, 0.81, 0);
        }
        filInst.instanceMatrix.needsUpdate = true;
        session.scene.add(filInst);
      }
    }

    // --- 9D. Z-04 SUBSTATION SET-PIECES ---
    if (zsp.substation) {
      var sub = zsp.substation;
      // West HV Switchgear Breaker Cabinets with Analog Voltmeter Faces (Instanced)
      var sws = sub.switchgearCabinets || [];
      if (sws.length > 0) {
        var swTex = createSwitchgearFaceTexture(THREE, session);
        var swFaceMat = session.trackMat(new THREE.MeshBasicMaterial({ map: swTex }));
        var swBodyGeo = session.trackGeo(new THREE.BoxGeometry(1.16, 2.38, 0.78));
        var swFaceGeo = session.trackGeo(new THREE.PlaneGeometry(1.02, 2.16));
        var swBodyInst = new THREE.InstancedMesh(swBodyGeo, darkMetalMat, sws.length);
        var swFaceInst = new THREE.InstancedMesh(swFaceGeo, swFaceMat, sws.length);
        for (var swi = 0; swi < sws.length; swi++) {
          setLocalInstance(swBodyInst, swi, sws[swi].x, 0, sws[swi].z, sws[swi].rotY, 0, 1.19, 0);
          setLocalInstance(swFaceInst, swi, sws[swi].x, 0, sws[swi].z, sws[swi].rotY, 0, 1.19, 0.40);
        }
        swBodyInst.instanceMatrix.needsUpdate = true;
        swFaceInst.instanceMatrix.needsUpdate = true;
        session.scene.add(swBodyInst, swFaceInst);
      }

      // East Cooling & Capacitor Bay: Cylindrical Industrial Cooling Oil Tanks (Instanced)
      var tanks = sub.coolingTanks || [];
      if (tanks.length > 0) {
        var tkCylGeo = session.trackGeo(new THREE.CylinderGeometry(0.76, 0.80, 2.35, 12));
        var tkCapGeo = session.trackGeo(new THREE.CylinderGeometry(0.42, 0.62, 0.28, 12));
        var tkBandGeo = session.trackGeo(new THREE.CylinderGeometry(0.82, 0.82, 0.22, 12));
        var tkCylInst = new THREE.InstancedMesh(tkCylGeo, steelMat, tanks.length);
        var tkCapInst = new THREE.InstancedMesh(tkCapGeo, darkSteel, tanks.length);
        var tkBandInst = new THREE.InstancedMesh(tkBandGeo, hazardYellowMat, tanks.length);
        for (var tki = 0; tki < tanks.length; tki++) {
          setLocalInstance(tkCylInst, tki, tanks[tki].x, 0, tanks[tki].z, 0, 0, 1.18, 0);
          setLocalInstance(tkCapInst, tki, tanks[tki].x, 0, tanks[tki].z, 0, 0, 2.48, 0);
          setLocalInstance(tkBandInst, tki, tanks[tki].x, 0, tanks[tki].z, 0, 0, 1.72, 0);
        }
        tkCylInst.instanceMatrix.needsUpdate = true;
        tkCapInst.instanceMatrix.needsUpdate = true;
        tkBandInst.instanceMatrix.needsUpdate = true;
        session.scene.add(tkCylInst, tkCapInst, tkBandInst);
      }

      // North Maintenance Workshop: Giant Industrial Cable Spool Drums (Instanced)
      var spools = sub.cableSpools || [];
      if (spools.length > 0) {
        var spFlangeGeo = session.trackGeo(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 12));
        var spCoreGeo = session.trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.84, 12));
        var spFlangeInst = new THREE.InstancedMesh(spFlangeGeo, woodSlatMat, spools.length * 2);
        var spCoreInst = new THREE.InstancedMesh(spCoreGeo, copperMat, spools.length);
        for (var spi = 0; spi < spools.length; spi++) {
          setLocalInstance(spFlangeInst, spi * 2, spools[spi].x, 0, spools[spi].z, 0, 0, 0.08, 0);
          setLocalInstance(spFlangeInst, spi * 2 + 1, spools[spi].x, 0, spools[spi].z, 0, 0, 0.92, 0);
          setLocalInstance(spCoreInst, spi, spools[spi].x, 0, spools[spi].z, 0, 0, 0.50, 0);
        }
        spFlangeInst.instanceMatrix.needsUpdate = true;
        spCoreInst.instanceMatrix.needsUpdate = true;
        session.scene.add(spFlangeInst, spCoreInst);
      }
    }

    // --- 9E. Z-05 TUNNEL SET-PIECES ---
    if (zsp.tunnel) {
      var tun = zsp.tunnel;
      // Overhead Vaulted Concrete Tunnel Arch Ribs spanning both North Pipe Gallery & South Chambers (Instanced!)
      var archXs = [88.5, 96.5, 104.5, 112.5, 120.5, 128.5, 136.5, 144.5, 152.5];
      var archTopGeo = session.trackGeo(new THREE.BoxGeometry(0.44, 0.42, 40.5));
      var archTopInst = new THREE.InstancedMesh(archTopGeo, darkSteel, archXs.length);
      for (var axi = 0; axi < archXs.length; axi++) {
        dummy.position.set(archXs[axi], 3.42, 124.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        archTopInst.setMatrixAt(axi, dummy.matrix);
      }
      archTopInst.instanceMatrix.needsUpdate = true;
      session.scene.add(archTopInst);

      // Additional Parallel Steam & Drainage Pipe Runs along Tunnel Central Spine Wall (z=124.5)
      var spinePipeGeo = session.trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 68.0, 8));
      spinePipeGeo.rotateZ(Math.PI / 2);
      var sPipe1 = new THREE.Mesh(spinePipeGeo, steelMat);
      sPipe1.position.set(122.0, 2.52, 123.85);
      var sPipe2 = new THREE.Mesh(spinePipeGeo, copperMat);
      sPipe2.position.set(122.0, 2.12, 123.85);
      var sPipe3 = new THREE.Mesh(spinePipeGeo, steelMat);
      sPipe3.position.set(122.0, 2.52, 125.15);
      session.scene.add(sPipe1, sPipe2, sPipe3);

      // Wall-Mounted Valve Manifolds with Brass Valve Wheels (Instanced)
      var valves = tun.valveManifolds || [];
      if (valves.length > 0) {
        var vBoxGeo = session.trackGeo(new THREE.BoxGeometry(0.54, 0.62, 0.28));
        var vWheelGeo = session.trackGeo(new THREE.TorusGeometry(0.24, 0.045, 6, 14));
        var vBoxInst = new THREE.InstancedMesh(vBoxGeo, steelMat, valves.length);
        var vWheelInst = new THREE.InstancedMesh(vWheelGeo, brassValveMat, valves.length);
        for (var vvi = 0; vvi < valves.length; vvi++) {
          setLocalInstance(vBoxInst, vvi, valves[vvi].x, 1.38, valves[vvi].z, valves[vvi].rotY, 0, 0, 0);
          setLocalInstance(vWheelInst, vvi, valves[vvi].x, 1.38, valves[vvi].z, valves[vvi].rotY, 0, 0, 0.22);
        }
        vBoxInst.instanceMatrix.needsUpdate = true;
        vWheelInst.instanceMatrix.needsUpdate = true;
        session.scene.add(vBoxInst, vWheelInst);
      }

      // Rusted 55-Gallon Industrial Maintenance Drums (Instanced)
      var drums = tun.maintenanceDrums || [];
      if (drums.length > 0) {
        var drumGeo = session.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.92, 10));
        var drumRingGeo = session.trackGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 10));
        var drumInst = new THREE.InstancedMesh(drumGeo, rustDrumMat, drums.length);
        var drumRingInst = new THREE.InstancedMesh(drumRingGeo, hazardYellowMat, drums.length);
        for (var dri = 0; dri < drums.length; dri++) {
          setLocalInstance(drumInst, dri, drums[dri].x, 0, drums[dri].z, 0, 0, 0.46, 0);
          setLocalInstance(drumRingInst, dri, drums[dri].x, 0, drums[dri].z, 0, 0, 0.68, 0);
        }
        drumInst.instanceMatrix.needsUpdate = true;
        drumRingInst.instanceMatrix.needsUpdate = true;
        session.scene.add(drumInst, drumRingInst);
      }
    }

    // --- 9F. Z-06 PLATFORM 0 SET-PIECES ---
    if (zsp.platform0) {
      var p0 = zsp.platform0;
      // Stationmaster Control Cabin Roof & Illuminated Header atop (171..175, 13..17)
      if (p0.stationmasterBooth) {
        var sb = p0.stationmasterBooth;
        var sbg = new THREE.Group();
        sbg.position.set(sb.x, 0.04, sb.z);
        var sbRoof = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(sb.w + 0.5, 0.32, sb.d + 0.5)), darkSteel);
        sbRoof.position.y = 2.52;
        addInkOutline(THREE, session, sbRoof, 24);
        var sbSignTex = createSignTexture(THREE, session, '0号站长值班室 · 封锁', 'Z-06A  ·  STATIONMASTER CABIN', '#e69c3c', '#14120c');
        var sbSign = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(4.4, 0.64)), session.trackMat(new THREE.MeshBasicMaterial({ map: sbSignTex })));
        sbSign.position.set(sb.w * 0.5 + 0.27, 2.52, 0);
        sbSign.rotation.y = Math.PI * 0.5;
        sbg.add(sbRoof, sbSign);
        session.scene.add(sbg);
      }

      // Glazed Platform Waiting Shelters atop (186, 53..55) & (186, 91..93)
      var shelters = p0.waitingShelters || [];
      for (var shi = 0; shi < shelters.length; shi++) {
        var sh = shelters[shi];
        var shg = new THREE.Group();
        shg.position.set(sh.x, 0.04, sh.z);
        var shCanopy = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.65, 0.16, 4.2)), darkSteel);
        shCanopy.position.set(0.55, 2.52, 0);
        addInkOutline(THREE, session, shCanopy, 24);
        var shStrip = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.12, 0.08, 3.8)), amberLedMat);
        shStrip.position.set(1.78, 2.48, 0);
        var shBench = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.54, 0.10, 2.4)), woodSlatMat);
        shBench.position.set(0.82, 0.48, 0);
        var shMap = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(2.1, 1.05)), session.trackMat(new THREE.MeshBasicMaterial({ map: routeTex })));
        shMap.position.set(0.52, 1.48, 0);
        shMap.rotation.y = Math.PI * 0.5;
        shg.add(shCanopy, shStrip, shBench, shMap);
        session.scene.add(shg);
      }

      // Full-Width Overhead Platform 0 Canopy Steel Trusses spanning x=170..208 (Instanced)
      var trussZs = [20, 38, 56, 74, 92, 110, 128];
      var trussGeo = session.trackGeo(new THREE.BoxGeometry(36.0, 0.28, 0.34));
      var trussInst = new THREE.InstancedMesh(trussGeo, darkSteel, trussZs.length);
      for (var tri = 0; tri < trussZs.length; tri++) {
        dummy.position.set(189.0, 3.58, trussZs[tri]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        trussInst.setMatrixAt(tri, dummy.matrix);
      }
      trussInst.instanceMatrix.needsUpdate = true;
      session.scene.add(trussInst);

      // South Freight End: Stacked Rail Ties & Signal Relay Boxes (Instanced)
      var freights = p0.freightStacks || [];
      if (freights.length > 0) {
        var fTieGeo = session.trackGeo(new THREE.BoxGeometry(2.1, 0.42, 0.96));
        var fBoxGeo = session.trackGeo(new THREE.BoxGeometry(0.82, 0.68, 0.64));
        var fTieInst = new THREE.InstancedMesh(fTieGeo, woodSlatMat, freights.length);
        var fBoxInst = new THREE.InstancedMesh(fBoxGeo, steelMat, freights.length);
        for (var fri = 0; fri < freights.length; fri++) {
          setLocalInstance(fTieInst, fri, freights[fri].x, 0.04, freights[fri].z, freights[fri].rotY, 0, 0.21, 0);
          setLocalInstance(fBoxInst, fri, freights[fri].x, 0.04, freights[fri].z, freights[fri].rotY, 0.35, 0.72, 0);
        }
        fTieInst.instanceMatrix.needsUpdate = true;
        fBoxInst.instanceMatrix.needsUpdate = true;
        session.scene.add(fTieInst, fBoxInst);
      }
    }
  }

  /* --------------------------------------------------------------------------
   * 2. Hanging Industrial Fluorescent Light Fixtures + Volumetric Light Cones
   * -------------------------------------------------------------------------- */
  function buildLightFixtures(session, lightDefs) {
    var THREE = session.THREE;
    if (!lightDefs || lightDefs.length === 0) return null;

    var count = lightDefs.length;
    var dummy = session._dummy;
    var col = new THREE.Color();

    var housingGeo = session.trackGeo(new THREE.BoxGeometry(1.48, 0.14, 0.34));
    var housingMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x1a222e, roughness: 0.42, metalness: 0.72 }));
    var housingMesh = new THREE.InstancedMesh(housingGeo, housingMat, count);

    var tubeGeo = session.trackGeo(new THREE.BoxGeometry(1.32, 0.07, 0.16));
    var tubeMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xdff6ff }));
    var tubeMesh = new THREE.InstancedMesh(tubeGeo, tubeMat, count);

    var coneGradTex = null;
    if (typeof document !== 'undefined') {
      var cc = document.createElement('canvas');
      cc.width = 4;
      cc.height = 64;
      var cctx = cc.getContext('2d');
      cctx.fillStyle = '#000000';
      cctx.fillRect(0, 0, 4, 64);
      var cgrad = cctx.createLinearGradient(0, 0, 0, 64);
      cgrad.addColorStop(0.0, '#000000');
      cgrad.addColorStop(0.12, '#c8c8c8');
      cgrad.addColorStop(0.42, '#444444');
      cgrad.addColorStop(0.75, '#0e0e0e');
      cgrad.addColorStop(1.0, '#000000');
      cctx.fillStyle = cgrad;
      cctx.fillRect(0, 0, 4, 64);
      coneGradTex = session.trackTex(new THREE.CanvasTexture(cc));
      coneGradTex.needsUpdate = true;
    }

    var coneGeo = session.trackGeo(new THREE.ConeGeometry(1.72, 2.15, 16, 1, true));
    var coneMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: coneGradTex,
      alphaMap: coneGradTex,
      transparent: true,
      opacity: coneGradTex ? 0.014 : 0.004,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var coneMesh = new THREE.InstancedMesh(coneGeo, coneMat, count);

    var beamGeo = session.trackGeo(new THREE.BoxGeometry(1.78, 0.08, 0.10));
    var beamMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.6, metalness: 0.55 }));
    var beamMesh = new THREE.InstancedMesh(beamGeo, beamMat, count);
    var platformStartX = (session.mapApi && session.mapApi.PLATFORM_START_X) ? session.mapApi.PLATFORM_START_X : 168;

    for (var i = 0; i < count; i++) {
      var ld = lightDefs[i];
      var rotY = (ld.x >= platformStartX - 2) ? Math.PI * 0.5 : 0;
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(1, 1, 1);

      dummy.position.set(ld.x, 4.68, ld.z);
      dummy.updateMatrix();
      beamMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(ld.x, 4.54, ld.z);
      dummy.updateMatrix();
      housingMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(ld.x, 4.46, ld.z);
      dummy.updateMatrix();
      tubeMesh.setMatrixAt(i, dummy.matrix);

      dummy.rotation.set(0, 0, 0);
      dummy.position.set(ld.x, 2.58, ld.z);
      dummy.updateMatrix();
      coneMesh.setMatrixAt(i, dummy.matrix);

      col.setHex(ld.color);
      if (typeof tubeMesh.setColorAt === 'function') tubeMesh.setColorAt(i, col);
      if (typeof coneMesh.setColorAt === 'function') coneMesh.setColorAt(i, col);
    }

    beamMesh.instanceMatrix.needsUpdate = true;
    housingMesh.instanceMatrix.needsUpdate = true;
    tubeMesh.instanceMatrix.needsUpdate = true;
    coneMesh.instanceMatrix.needsUpdate = true;
    if (tubeMesh.instanceColor) tubeMesh.instanceColor.needsUpdate = true;
    if (coneMesh.instanceColor) coneMesh.instanceColor.needsUpdate = true;

    session.scene.add(beamMesh, housingMesh, tubeMesh, coneMesh);

    var baseHex = [];
    for (var bi = 0; bi < count; bi++) {
      baseHex.push(hexToInt(lightDefs[bi].color, 0xdff6ff));
    }
    var levelCol = new THREE.Color();
    session.stationBulbControl = {
      count: count,
      positions: lightDefs.map(function (d) { return { x: Number(d.x) || 0, z: Number(d.z) || 0 }; }),
      setLevel: function (idx, level, overrideHex) {
        if (idx < 0 || idx >= count) return;
        var lv = Math.max(0, Math.min(1.5, Number(level)));
        if (isNaN(lv)) lv = 1;
        levelCol.setHex(typeof overrideHex === 'number' ? overrideHex : baseHex[idx]).multiplyScalar(lv);
        if (typeof tubeMesh.setColorAt === 'function') tubeMesh.setColorAt(idx, levelCol);
        if (typeof coneMesh.setColorAt === 'function') coneMesh.setColorAt(idx, levelCol);
      },
      commit: function () {
        if (tubeMesh.instanceColor) tubeMesh.instanceColor.needsUpdate = true;
        if (coneMesh.instanceColor) coneMesh.instanceColor.needsUpdate = true;
      }
    };
    return tubeMat;
  }

  /* --------------------------------------------------------------------------
   * 3. Upgraded 10-Car Articulated Ghost Train No.0 (Scaled for 139m Platform 0)
   * -------------------------------------------------------------------------- */
  function buildGhostTrain(session, opts) {
    var THREE = session.THREE;
    var cfg = opts || {};
    var RAIL_Y = cfg.RAIL_Y || -0.58;
    var TRAIN_X = cfg.TRAIN_X || (session.mapApi && session.mapApi.TRAIN_X) || 213.5;

    var group = new THREE.Group();
    var spritesApi = INFINITY.PixelSprites || null;
    var hullTex = session.getTileTex('train_hull', '#1d222c', '#6e2230');
    var hullNorm = (spritesApi && spritesApi.getTileNormalTexture) ? spritesApi.getTileNormalTexture('train_hull') : null;
    var hullRough = (spritesApi && spritesApi.getTileRoughnessTexture) ? spritesApi.getTileRoughnessTexture('train_hull') : null;

    var hullMat = session.trackMat(new THREE.MeshStandardMaterial({
      map: hullTex,
      normalMap: hullNorm || null,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: hullRough || null,
      roughness: 0.56,
      metalness: 0.58,
      emissive: 0x1e060b,
      emissiveIntensity: 0.42
    }));
    var darkSteelMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.52, metalness: 0.65 }));
    var winMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xff2c42 }));
    var winFrameMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.4, metalness: 0.8 }));
    var headMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xff6270 }));

    var carGeo = session.trackGeo(new THREE.BoxGeometry(2.42, 2.55, 6.2));
    var roofGeo = session.trackGeo(new THREE.BoxGeometry(2.14, 0.24, 6.0));
    var acGeo = session.trackGeo(new THREE.BoxGeometry(1.25, 0.24, 1.55));
    var bogieGeo = session.trackGeo(new THREE.BoxGeometry(2.05, 0.42, 1.45));
    var couplerGeo = session.trackGeo(new THREE.BoxGeometry(1.5, 1.9, 0.58));
    var winGeo = session.trackGeo(new THREE.PlaneGeometry(1.18, 0.78));
    var frameGeo = session.trackGeo(new THREE.BoxGeometry(0.08, 0.90, 1.32));
    var lampGeo = session.trackGeo(new THREE.CylinderGeometry(0.18, 0.20, 0.16, 12));
    lampGeo.rotateX(Math.PI / 2);

    var carCount = 10;
    for (var i = 0; i < carCount; i++) {
      var cz = -i * 6.75;
      var car = new THREE.Mesh(carGeo, hullMat);
      car.position.set(0, 1.42, cz);
      addInkOutline(THREE, session, car, 24);
      group.add(car);

      var roof = new THREE.Mesh(roofGeo, darkSteelMat);
      roof.position.set(0, 2.78, cz);
      addInkOutline(THREE, session, roof, 24);
      group.add(roof);

      var acUnit = new THREE.Mesh(acGeo, darkSteelMat);
      acUnit.position.set(0, 2.98, cz);
      group.add(acUnit);

      var bogieF = new THREE.Mesh(bogieGeo, darkSteelMat);
      bogieF.position.set(0, 0.18, cz + 2.0);
      var bogieB = new THREE.Mesh(bogieGeo, darkSteelMat);
      bogieB.position.set(0, 0.18, cz - 2.0);
      group.add(bogieF, bogieB);

      if (i > 0) {
        var coupler = new THREE.Mesh(couplerGeo, darkSteelMat);
        coupler.position.set(0, 1.32, cz + 3.38);
        group.add(coupler);
      }

      for (var w = -1; w <= 1; w++) {
        var wz = cz + w * 1.82;
        var wFrame = new THREE.Mesh(frameGeo, winFrameMat);
        wFrame.position.set(-1.21, 1.62, wz);
        var win = new THREE.Mesh(winGeo, winMat);
        win.position.set(-1.255, 1.62, wz);
        win.rotation.y = -Math.PI / 2;
        group.add(wFrame, win);
      }
    }

    var nose = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.32, 0.65, 0.55)), darkSteelMat);
    nose.position.set(0, 0.48, 3.22);
    addInkOutline(THREE, session, nose, 24);
    group.add(nose);

    var lampL = new THREE.Mesh(lampGeo, headMat);
    lampL.position.set(-0.72, 1.15, 3.16);
    var lampR = new THREE.Mesh(lampGeo, headMat);
    lampR.position.set(0.72, 1.15, 3.16);
    group.add(lampL, lampR);

    var coneGeo = session.trackGeo(new THREE.ConeGeometry(2.9, 10.5, 16, 1, true));
    coneGeo.rotateX(-Math.PI / 2);
    var coneMat = session.trackMat(new THREE.MeshBasicMaterial({
      color: 0xff2238,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0.95, 8.4);
    group.add(cone);

    var trainLight = new THREE.PointLight(0xff1c36, 4.4, 24, 1.3);
    trainLight.position.set(-0.5, 1.65, 5.2);
    group.add(trainLight);

    group.position.set(TRAIN_X, RAIL_Y + 0.12, -72);
    group.visible = false;
    session.scene.add(group);

    return {
      group: group,
      light: trainLight,
      z: -72,
      speed: 0
    };
  }

  /* --------------------------------------------------------------------------
   * 3B. Dynamic Interactive Points Generator (Destructible Cover & Scene Triggers)
   * Scales across the 4x (224x152) Station Zero map with strict walkability checks.
   * -------------------------------------------------------------------------- */
  function findSafeWalkableSpot(mapApi, tx, tz, spawnPos, staticPts, usedPts) {
    var gridW = (mapApi && mapApi.GRID_W) || 224;
    var gridH = (mapApi && mapApi.GRID_H) || 152;

    function isClearSpot(cx, cz) {
      var ix = Math.floor(cx);
      var iz = Math.floor(cz);
      if (ix < 3 || ix > gridW - 4 || iz < 3 || iz > gridH - 4) return false;
      if (mapApi && typeof mapApi.isWalkable === 'function') {
        if (!mapApi.isWalkable(ix, iz)) return false;
        // Ensure at least 3 cardinal neighbors are walkable so actor never gets wedged
        var openNeighbors = 0;
        if (mapApi.isWalkable(ix + 1, iz)) openNeighbors++;
        if (mapApi.isWalkable(ix - 1, iz)) openNeighbors++;
        if (mapApi.isWalkable(ix, iz + 1)) openNeighbors++;
        if (mapApi.isWalkable(ix, iz - 1)) openNeighbors++;
        if (openNeighbors < 3) return false;
      }
      if (spawnPos) {
        var sdx = cx - spawnPos.x;
        var sdz = cz - spawnPos.z;
        if (sdx * sdx + sdz * sdz < 3.0 * 3.0) return false;
      }
      for (var i = 0; i < staticPts.length; i++) {
        var pdx = cx - staticPts[i].x;
        var pdz = cz - staticPts[i].z;
        if (pdx * pdx + pdz * pdz < 2.8 * 2.8) return false;
      }
      for (var j = 0; j < usedPts.length; j++) {
        var udx = cx - usedPts[j].x;
        var udz = cz - usedPts[j].z;
        if (udx * udx + udz * udz < 3.2 * 3.2) return false;
      }
      return true;
    }

    var baseX = Math.floor(tx) + 0.5;
    var baseZ = Math.floor(tz) + 0.5;
    if (isClearSpot(baseX, baseZ)) return { x: baseX, z: baseZ };

    for (var rad = 1; rad <= 6; rad++) {
      for (var dz = -rad; dz <= rad; dz++) {
        for (var dx = -rad; dx <= rad; dx++) {
          if (Math.abs(dx) !== rad && Math.abs(dz) !== rad) continue;
          var cx = baseX + dx;
          var cz = baseZ + dz;
          if (isClearSpot(cx, cz)) return { x: cx, z: cz };
        }
      }
    }
    return null;
  }

  function generateDynamicInteractables(mapApi) {
    var api = mapApi || INFINITY.StationMap || null;
    var gridW = (api && api.GRID_W) || 224;
    var gridH = (api && api.GRID_H) || 152;
    var scaleX = gridW / 224;
    var scaleZ = gridH / 152;

    var spawnPos = (api && typeof api.getZoneCenter === 'function')
      ? api.getZoneCenter('concourse')
      : { x: 41.5 * scaleX, z: 37.5 * scaleZ };
    var staticPts = (api && typeof api.getInteractables === 'function')
      ? (api.getInteractables() || [])
      : [];

    var usedPts = [];

    // 12 Destructible Tactical Covers across all 6 expanded zones
    var coverBlueprints = [
      {
        id: 'dcov_concourse_east', zoneId: 'concourse', zoneCode: 'Z-01', kind: 'crate_barricade',
        x: 46.5, z: 35.5, hp: 60, label: '裂缝补给箱垒',
        envClue: {
          id: 'env_clue_cov_concourse_1', tag: '掩体破拆', zoneId: 'concourse', zoneCode: 'Z-01',
          title: '封存站务应急清单',
          summary: '箱体夹层掉出一张被炭灰熏黑的检修单：零号站台所有 43.2Hz 广播回路都在检票大厅西侧断路箱串接，切断可降低假播报干扰。',
          effectText: '掩体已瓦解为可通行碎渣，并回收 +8 能量补给'
        }
      },
      {
        id: 'dcov_concourse_south', zoneId: 'concourse', zoneCode: 'Z-01', kind: 'cracked_jersey',
        x: 26.5, z: 58.5, hp: 60, label: '风化防撞石墩',
        envClue: {
          id: 'env_clue_cov_concourse_2', tag: '掩体破拆', zoneId: 'concourse', zoneCode: 'Z-01',
          title: '旧版逃生通道涂鸦',
          summary: '碎裂混凝土背面刻着前批考生的短剑划痕：「别走中轴直道，从南侧变电间折返可以避开检票员第一轮巡线」。',
          effectText: '开辟新的侧翼穿行缺口，理智 +4'
        }
      },
      {
        id: 'dcov_corridor_west', zoneId: 'corridor', zoneCode: 'Z-02', kind: 'crate_barricade',
        x: 98.5, z: 70.5, hp: 65, label: '倾倒检票杂物堆',
        envClue: {
          id: 'env_clue_cov_corridor_1', tag: '掩体破拆', zoneId: 'corridor', zoneCode: 'Z-02',
          title: '带血的黄线测距尺',
          summary: '残骸下压着一把折断的工务钢尺，标尺红漆标出 0 号站台警戒线外侧 2 米即是检票员红灯感知阈值。',
          effectText: '打通换乘长廊西侧掩体火线，能量 +8'
        }
      },
      {
        id: 'dcov_corridor_east', zoneId: 'corridor', zoneCode: 'Z-02', kind: 'cracked_jersey',
        x: 146.5, z: 78.5, hp: 65, label: '裂纹隔离护栏',
        envClue: {
          id: 'env_clue_cov_corridor_2', tag: '掩体破拆', zoneId: 'corridor', zoneCode: 'Z-02',
          title: '零号列车制动记录带',
          summary: '纸带显示零号列车每轮进站仅停靠短暂窗口；若未完成双端轨控改写强行登车，将触发次级惩罚分支。',
          effectText: '破除长廊东端阻滞路障，理智 +4'
        }
      },
      {
        id: 'dcov_dispatch_west', zoneId: 'dispatch', zoneCode: 'Z-03', kind: 'crate_barricade',
        x: 102.5, z: 24.5, hp: 60, label: '旧信号机备件箱',
        envClue: {
          id: 'env_clue_cov_dispatch_1', tag: '掩体破拆', zoneId: 'dispatch', zoneCode: 'Z-03',
          title: '调度员值班便签',
          summary: '便签写明：「调度室道岔反转只占联锁 50%，必须与旧变电间 B 相逆极闸刀同步合闸，0 号闸门才会彻底解锁。」',
          effectText: '回收高频继电器备件，能量 +10'
        }
      },
      {
        id: 'dcov_dispatch_east', zoneId: 'dispatch', zoneCode: 'Z-03', kind: 'cracked_jersey',
        x: 144.5, z: 32.5, hp: 60, label: '龟裂配电护墩',
        envClue: {
          id: 'env_clue_cov_dispatch_2', tag: '掩体破拆', zoneId: 'dispatch', zoneCode: 'Z-03',
          title: '残破加密频道卡片',
          summary: '卡片印着执棋小队的短波暗语，提示可随时通过加密短波指挥严辞与许檀分头合闸以缩短滞留时间。',
          effectText: '清空调度室东侧撤离转角，理智 +4'
        }
      },
      {
        id: 'dcov_substation_north', zoneId: 'substation', zoneCode: 'Z-04', kind: 'crate_barricade',
        x: 24.5, z: 96.5, hp: 70, label: '绝缘瓷瓶货箱',
        envClue: {
          id: 'env_clue_cov_substation_1', tag: '掩体破拆', zoneId: 'substation', zoneCode: 'Z-04',
          title: '高压电弧干扰笔记',
          summary: '维修工批注：「EMP 与过载电容释放的瞬间脉冲会直接烧灼检票员胸口对讲机，令其陷入数秒感知僵直。」',
          effectText: '回收稳压绝缘片，能量 +10'
        }
      },
      {
        id: 'dcov_substation_south', zoneId: 'substation', zoneCode: 'Z-04', kind: 'cracked_jersey',
        x: 54.5, z: 128.5, hp: 70, label: '焦黑防爆隔离墩',
        envClue: {
          id: 'env_clue_cov_substation_2', tag: '掩体破拆', zoneId: 'substation', zoneCode: 'Z-04',
          title: '变电间接地日志',
          summary: '日志指出旧变电间地面积水导电率极高，但沿南侧干燥通道绕行可大幅压低脚步声纹。',
          effectText: '打通变电间南侧逃生通道，理智 +4'
        }
      },
      {
        id: 'dcov_tunnel_west', zoneId: 'tunnel', zoneCode: 'Z-05', kind: 'crate_barricade',
        x: 102.5, z: 122.5, hp: 60, label: '废弃工务工具箱',
        envClue: {
          id: 'env_clue_cov_tunnel_1', tag: '掩体破拆', zoneId: 'tunnel', zoneCode: 'Z-05',
          title: '沈砚遗落的折角票套',
          summary: '票套内侧残留暗红印泥，与检票大厅查获的真票钢印存在细微错位——说明应急通道有人刻意伪造通行凭据。',
          effectText: '清除隧道西口障碍，能量 +8'
        }
      },
      {
        id: 'dcov_tunnel_east', zoneId: 'tunnel', zoneCode: 'Z-05', kind: 'cracked_jersey',
        x: 146.5, z: 126.5, hp: 60, label: '渗水混凝土残垣',
        envClue: {
          id: 'env_clue_cov_tunnel_2', tag: '掩体破拆', zoneId: 'tunnel', zoneCode: 'Z-05',
          title: '应急隧道气压记录',
          summary: '压力表残片显示每当列车驶入 0 号站台，隧道气压骤降，开启排水与通风阀可迅速吹散异常声纹。',
          effectText: '开辟隧道直通站台近路，理智 +5'
        }
      },
      {
        id: 'dcov_platform0_north', zoneId: 'platform0', zoneCode: 'Z-06', kind: 'crate_barricade',
        x: 186.5, z: 42.5, hp: 70, label: '站台检修围挡',
        envClue: {
          id: 'env_clue_cov_platform0_1', tag: '掩体破拆', zoneId: 'platform0', zoneCode: 'Z-06',
          title: '0号站台遗留手电',
          summary: '手电筒外壳贴着工务签条：「检票员提灯红光虽具威慑，但在掩体转角后卡视野可打断其直线突刺。」',
          effectText: '清理站台北段机动空间，能量 +10'
        }
      },
      {
        id: 'dcov_platform0_south', zoneId: 'platform0', zoneCode: 'Z-06', kind: 'cracked_jersey',
        x: 192.5, z: 118.5, hp: 70, label: '站台碎裂防撞墩',
        envClue: {
          id: 'env_clue_cov_platform0_2', tag: '掩体破拆', zoneId: 'platform0', zoneCode: 'Z-06',
          title: '铁轨边缘刻痕警告',
          summary: '碎石底座压着半张焦黄告示：「轨槽带电且深陷，交战击退时务必背对站台内侧，切勿逼近铁轨边缘。」',
          effectText: '清空站台东南决战区，理智 +5'
        }
      }
    ];

    // 10 Interactive Scene Triggers across all 6 expanded zones
    var triggerBlueprints = [
      {
        id: 'trig_concourse_breaker', zoneId: 'concourse', zoneCode: 'Z-01', triggerEffect: 'acoustic_lure',
        x: 35.5, z: 35.5, label: '应急广播断路箱', actionLabel: '拉闸诱饵',
        envClue: {
          id: 'env_clue_trig_concourse_1', tag: '场景触发器', zoneId: 'concourse', zoneCode: 'Z-01',
          title: '43.2Hz 广播回环日志',
          summary: '断路箱主板打印出最后一条故障码：站内循环播报源自 0 号轨控中枢的伪造声频，反相拉闸会在远处产生声纹诱饵吸引检票员。',
          effectText: '已向换乘方向释放声纹诱饵波，临时压低本地声纹 -18'
        }
      },
      {
        id: 'trig_concourse_vent', zoneId: 'concourse', zoneCode: 'Z-01', triggerEffect: 'vent_purge',
        x: 56.5, z: 22.5, label: '大厅排烟稳压阀', actionLabel: '开启排压',
        envClue: {
          id: 'env_clue_trig_concourse_2', tag: '场景触发器', zoneId: 'concourse', zoneCode: 'Z-01',
          title: '地下站空气循环简报',
          summary: '排烟管道涌出干冷新风，表盘显示大厅滞留的微弱模因雾气已被吹散，小队认知负荷显著下降。',
          effectText: '净化区域雾气：理智 +10 · 能量 +12 · 威胁值下降'
        }
      },
      {
        id: 'trig_corridor_sonar', zoneId: 'corridor', zoneCode: 'Z-02', triggerEffect: 'sonar_relay',
        x: 122.5, z: 74.5, label: '声呐回波中继器', actionLabel: '启动扫描',
        envClue: {
          id: 'env_clue_trig_corridor_1', tag: '场景触发器', zoneId: 'corridor', zoneCode: 'Z-02',
          title: '站台全频回波快照',
          summary: '中继天线瞬间完成 224×152 全回廊穿墙扫描，检票员实时位置与残余未破译线索已同步标注至战术终端。',
          effectText: '开启 8 秒穿墙声呐透视，锁定零号检票员实时动向'
        }
      },
      {
        id: 'trig_corridor_alarm', zoneId: 'corridor', zoneCode: 'Z-02', triggerEffect: 'acoustic_lure',
        x: 108.5, z: 88.5, label: '长廊消防警铃箱', actionLabel: '敲响声诱',
        envClue: {
          id: 'env_clue_trig_corridor_2', tag: '场景触发器', zoneId: 'corridor', zoneCode: 'Z-02',
          title: '站台联防警铃预案',
          summary: '警铃箱内贴着应急规程：尖锐铜铃声优先度高于普通脚步声，可用于将巡逻中的异常体调离道岔控制台。',
          effectText: '在长廊南侧引爆声波诱饵，转移检票员注意力'
        }
      },
      {
        id: 'trig_dispatch_blackbox', zoneId: 'dispatch', zoneCode: 'Z-03', triggerEffect: 'sonar_relay',
        x: 118.5, z: 22.5, label: '旧站务黑匣子', actionLabel: '读取记录',
        envClue: {
          id: 'env_clue_trig_dispatch_1', tag: '场景触发器', zoneId: 'dispatch', zoneCode: 'Z-03',
          title: '停摆前 60 秒行车录音',
          summary: '黑匣子磁带揭示了停摆真相：零号列车在 00:00:00 进入死循环前，曾有两名未知乘务员强行锁死了双向道岔。',
          effectText: '同步全站轨道信标，开启 8 秒穿墙侦察并恢复 +8 理智'
        }
      },
      {
        id: 'trig_substation_capacitor', zoneId: 'substation', zoneCode: 'Z-04', triggerEffect: 'arc_surge',
        x: 40.5, z: 110.5, label: '过载电容泄压闸', actionLabel: '释放电弧',
        envClue: {
          id: 'env_clue_trig_substation_1', tag: '场景触发器', zoneId: 'substation', zoneCode: 'Z-04',
          title: 'B相高压回路拓扑图',
          summary: '合闸瞬间电弧横扫变电间，配电柜内测绘图标明变电间泄压会瞬时过载周边灯具并压制半径 14 米内的异常实体。',
          effectText: '释放高压电磁脉冲，震慑附近检票员并回复 +15 能量'
        }
      },
      {
        id: 'trig_substation_vent', zoneId: 'substation', zoneCode: 'Z-04', triggerEffect: 'vent_purge',
        x: 62.5, z: 96.5, label: '变压器冷却排风阀', actionLabel: '泄压降温',
        envClue: {
          id: 'env_clue_trig_substation_2', tag: '场景触发器', zoneId: 'substation', zoneCode: 'Z-04',
          title: '变电冷却液异常检测',
          summary: '白色冷雾自管口喷涌，传感器读数显示臭氧浓度恢复安全线，同时抹除了此前的脚步声纹痕迹。',
          effectText: '区域降温降噪：声纹大幅回落，理智 +10 · 能量 +10'
        }
      },
      {
        id: 'trig_tunnel_drain', zoneId: 'tunnel', zoneCode: 'Z-05', triggerEffect: 'vent_purge',
        x: 126.5, z: 118.5, label: '隧道应急排水阀', actionLabel: '启动泄洪',
        envClue: {
          id: 'env_clue_trig_tunnel_1', tag: '场景触发器', zoneId: 'tunnel', zoneCode: 'Z-05',
          title: '排水槽金属铭牌',
          summary: '水流冲刷出沟底一块编号牌，证明应急通道曾是旧线秘密检修口，直通 0 号站台东南侧死角。',
          effectText: '水声掩盖移动噪音，威胁值下降且理智 +10'
        }
      },
      {
        id: 'trig_platform0_beacon', zoneId: 'platform0', zoneCode: 'Z-06', triggerEffect: 'arc_surge',
        x: 184.5, z: 74.5, label: '轨道监测高压信标', actionLabel: '过载信标',
        envClue: {
          id: 'env_clue_trig_platform0_1', tag: '场景触发器', zoneId: 'platform0', zoneCode: 'Z-06',
          title: '零号轨感应线圈读数',
          summary: '过载信标测得 0 号站台铁轨磁场正随列车倒计时剧烈波动，电弧脉冲可短时干扰靠近站台的检票员。',
          effectText: '触发站台电弧浪涌，震荡附近敌人并回复 +14 能量'
        }
      },
      {
        id: 'trig_platform0_buzzer', zoneId: 'platform0', zoneCode: 'Z-06', triggerEffect: 'acoustic_lure',
        x: 188.5, z: 114.5, label: '站台警示蜂鸣器', actionLabel: '触发蜂鸣',
        envClue: {
          id: 'env_clue_trig_platform0_2', tag: '场景触发器', zoneId: 'platform0', zoneCode: 'Z-06',
          title: '站台末班车调度密文',
          summary: '蜂鸣器控制台弹出最后一条加密指令：「当双端联锁达到 100% 或检票员被肃清，0 号撤离闸门即刻解除封锁。」',
          effectText: '在站台东南释放高频诱饵蜂鸣，声纹诱敌 + 能量 +10'
        }
      }
    ];

    var destructibles = [];
    for (var ci = 0; ci < coverBlueprints.length; ci++) {
      var cb = coverBlueprints[ci];
      var cSpot = findSafeWalkableSpot(api, cb.x * scaleX, cb.z * scaleZ, spawnPos, staticPts, usedPts);
      if (!cSpot) continue;
      usedPts.push(cSpot);
      destructibles.push({
        id: cb.id,
        type: 'destructible_cover',
        kind: cb.kind,
        x: cSpot.x,
        z: cSpot.z,
        zoneId: cb.zoneId,
        zoneCode: cb.zoneCode,
        label: cb.label,
        actionLabel: '破拆掩体',
        hp: cb.hp,
        maxHp: cb.hp,
        radius: 0.72,
        envClue: cb.envClue
      });
    }

    var triggers = [];
    for (var ti = 0; ti < triggerBlueprints.length; ti++) {
      var tb = triggerBlueprints[ti];
      var tSpot = findSafeWalkableSpot(api, tb.x * scaleX, tb.z * scaleZ, spawnPos, staticPts, usedPts);
      if (!tSpot) continue;
      usedPts.push(tSpot);
      triggers.push({
        id: tb.id,
        type: 'scene_trigger',
        triggerEffect: tb.triggerEffect,
        x: tSpot.x,
        z: tSpot.z,
        zoneId: tb.zoneId,
        zoneCode: tb.zoneCode,
        label: tb.label,
        actionLabel: tb.actionLabel || '启动机关',
        envClue: tb.envClue
      });
    }

    return {
      destructibles: destructibles,
      triggers: triggers,
      all: destructibles.concat(triggers)
    };
  }

  /* --------------------------------------------------------------------------
   * 4. Composite 3D Procedural Interactables (Consoles, Clues, Blast Exit Gate,
   *    + Dynamic Destructible Covers & Interactive Scene Triggers)
   * Preserves exact engine_25d item contract (group, sprite, mat, ring, ringMat)
   * -------------------------------------------------------------------------- */
  function createStyle1PropTexture(THREE, session, variant) {
    var key = '_s1PropTex_' + variant;
    if (session[key]) return session[key];
    var S = 128;
    var c = makeCanvas(S, S);
    var ctx = c.getContext('2d');
    if (ctx) {
      if (variant === 'hazard') {
        ctx.fillStyle = '#151922';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#c8922e';
        for (var d = -S; d < S * 2; d += 36) {
          ctx.beginPath();
          ctx.moveTo(d, 0); ctx.lineTo(d + 18, 0);
          ctx.lineTo(d + 18 - S, S); ctx.lineTo(d - S, S);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#05070b';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else if (variant === 'concrete') {
        ctx.fillStyle = '#2d3744';
        ctx.fillRect(0, 0, S, S);
        // Hard oblique cel shadow block
        ctx.fillStyle = '#1d2530';
        ctx.beginPath();
        ctx.moveTo(0, S); ctx.lineTo(S, S); ctx.lineTo(S, S * 0.28); ctx.lineTo(S * 0.18, S * 0.72);
        ctx.closePath();
        ctx.fill();
        // Ink fractures & cross-hatching
        ctx.strokeStyle = '#06080d';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(14, 24); ctx.lineTo(44, 42); ctx.lineTo(36, 78); ctx.lineTo(66, 108);
        ctx.moveTo(82, 16); ctx.lineTo(106, 48); ctx.lineTo(92, 86);
        ctx.stroke();
        ctx.lineWidth = 1.3;
        for (var hx = 10; hx < S; hx += 12) {
          ctx.beginPath(); ctx.moveTo(hx, S - 26); ctx.lineTo(hx + 10, S - 6); ctx.stroke();
        }
      } else if (variant === 'dark_case') {
        ctx.fillStyle = '#121822';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#1b2432';
        ctx.fillRect(8, 8, S - 16, S - 16);
        ctx.fillStyle = '#0c1018';
        ctx.beginPath();
        ctx.moveTo(8, S - 8); ctx.lineTo(S - 8, S - 8); ctx.lineTo(S - 8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#05070b';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, S - 20, S - 20);
        // Industrial vent slats
        ctx.fillStyle = '#06080d';
        for (var vy = 26; vy < 76; vy += 12) ctx.fillRect(22, vy, S - 44, 5);
      } else {
        // Heavy-ink riveted industrial steel crate / stanchion
        ctx.fillStyle = '#253140';
        ctx.fillRect(0, 0, S, S);
        ctx.fillStyle = '#19222e';
        ctx.beginPath();
        ctx.moveTo(0, S); ctx.lineTo(S, S); ctx.lineTo(S, 0);
        ctx.closePath();
        ctx.fill();
        // Diagonal recessed crate brace
        ctx.strokeStyle = '#06080d';
        ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, S - 10, S - 10);
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, S - 30, S - 30);
        ctx.beginPath(); ctx.moveTo(16, 16); ctx.lineTo(S - 16, S - 16); ctx.stroke();
        // Highlight lip
        ctx.strokeStyle = 'rgba(136, 198, 224, 0.24)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(10, S - 12); ctx.lineTo(10, 10); ctx.lineTo(S - 12, 10); ctx.stroke();
        // Corner rivets
        ctx.fillStyle = '#05070b';
        var rv = [[12,12],[S-12,12],[12,S-12],[S-12,S-12]];
        for (var ri = 0; ri < rv.length; ri++) {
          ctx.beginPath(); ctx.arc(rv[ri][0], rv[ri][1], 3.2, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Universal bold heavy-ink outer perimeter seam
      ctx.strokeStyle = '#04060a';
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, S, S);
    }
    var tex = session.trackTex(new THREE.CanvasTexture(c));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    session[key] = tex;
    return tex;
  }

  function buildInteractables(session) {
    var THREE = session.THREE;
    var defs = [];
    if (typeof session.mapApi.getInteractables === 'function') {
      try { defs = session.mapApi.getInteractables() || []; } catch (_) { defs = []; }
    }

    var steelTex = createStyle1PropTexture(THREE, session, 'steel');
    var darkCaseTex = createStyle1PropTexture(THREE, session, 'dark_case');
    var concreteTex = createStyle1PropTexture(THREE, session, 'concrete');
    var hazardTex = createStyle1PropTexture(THREE, session, 'hazard');

    var steelMat = session.trackMat(new THREE.MeshStandardMaterial({ map: steelTex, color: 0xbcd0e2, roughness: 0.72, metalness: 0.30 }));
    var darkCaseMat = session.trackMat(new THREE.MeshStandardMaterial({ map: darkCaseTex, color: 0xadbcd0, roughness: 0.78, metalness: 0.24 }));
    var brassMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0xc29544, roughness: 0.48, metalness: 0.56 }));
    var hazardMat = session.trackMat(new THREE.MeshStandardMaterial({ map: hazardTex, color: 0xe6c88a, roughness: 0.68, metalness: 0.12 }));
    var concreteMat = session.trackMat(new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xbfd0dc, roughness: 0.88, metalness: 0.08 }));
    var rubbleMat = session.trackMat(new THREE.MeshStandardMaterial({ map: concreteTex, color: 0x7a8898, roughness: 0.94, metalness: 0.06 }));

    var propAoGeo = session.trackGeo(new THREE.PlaneGeometry(2.05, 1.85));
    propAoGeo.rotateX(-Math.PI / 2);
    var propAoMat = session.trackMat(new THREE.MeshBasicMaterial({
      map: createPillarAoTexture(THREE, session),
      transparent: true,
      opacity: 0.86,
      depthWrite: false
    }));

    var ringGeo = session.trackGeo(new THREE.RingGeometry(0.56, 0.65, 28));
    ringGeo.rotateX(-Math.PI / 2);

    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var type = d.type || 'clue';
      var group = new THREE.Group();
      group.position.set(d.x, 0, d.z);
      var iAo = new THREE.Mesh(propAoGeo, propAoMat);
      iAo.position.y = 0.024;
      group.add(iAo);

      var interactHex = (INFINITY.ArtTokens && INFINITY.ArtTokens.SEMANTIC && INFINITY.ArtTokens.SEMANTIC.interactInt) || 0x5ce8c8;
      var warningHex = (INFINITY.ArtTokens && INFINITY.ArtTokens.SEMANTIC && INFINITY.ArtTokens.SEMANTIC.warningInt) || 0xffaa3b;
      var ringColor = type === 'exit' ? warningHex : interactHex;
      var rMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.44,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.y = 0.068;
      if (type === 'exit') ring.scale.set(1.85, 1.85, 1);
      group.add(ring);

      // Restrained outer pulse ring (no blown-out white floor disc)
      var pulseMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var pulseRing = new THREE.Mesh(ringGeo, pulseMat);
      pulseRing.position.y = 0.064;
      group.add(pulseRing);

      var spriteMesh = null;
      var mainMat = null;
      var auxBeaconMat = null;

      if (type === 'console') {
        // Composite 7-part Heavy Industrial Track-Override Terminal
        var plinth = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.18, 0.16, 0.88)), darkCaseMat);
        plinth.position.y = 0.08;
        addInkOutline(THREE, session, plinth, 24);
        var pedestal = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.96, 0.92, 0.66)), steelMat);
        pedestal.position.y = 0.58;
        addInkOutline(THREE, session, pedestal, 24);
        var desk = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.14, 0.18, 0.78)), darkCaseMat);
        desk.position.set(0, 1.06, 0.06);
        desk.rotation.x = 0.24;
        addInkOutline(THREE, session, desk, 24);

        var monitorHood = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.96, 0.68, 0.42)), darkCaseMat);
        monitorHood.position.set(0, 1.44, -0.06);
        monitorHood.rotation.x = -0.18;
        addInkOutline(THREE, session, monitorHood, 24);

        var texOff = session.getPropTex('console_off', '#f2a944');
        mainMat = session.trackMat(new THREE.MeshStandardMaterial({
          map: texOff,
          emissiveMap: texOff,
          emissive: 0xffffff,
          emissiveIntensity: 0.90,
          roughness: 0.35,
          metalness: 0.12
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.84, 0.54)), mainMat);
        spriteMesh.position.set(0, 1.44, 0.16);
        spriteMesh.rotation.x = -0.18;

        // Mechanical switch lever + overhead status beacon
        var lever = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8)), brassMat);
        lever.position.set(0.42, 1.24, 0.18);
        lever.rotation.x = 0.4;
        var beaconPole = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.035, 0.04, 0.42, 8)), steelMat);
        beaconPole.position.set(-0.38, 1.92, -0.12);
        auxBeaconMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xffa838 }));
        var beaconBulb = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.10, 10, 10)), auxBeaconMat);
        beaconBulb.position.set(-0.38, 2.16, -0.12);

        group.add(plinth, pedestal, desk, monitorHood, spriteMesh, lever, beaconPole, beaconBulb);
      } else if (type === 'exit') {
        // Monumental Armored Subway Blast-Door Archway + Shimmering Forcefield Curtain
        var colGeo = session.trackGeo(new THREE.BoxGeometry(0.44, 2.72, 0.56));
        var colL = new THREE.Mesh(colGeo, steelMat);
        colL.position.set(-1.18, 1.36, 0);
        addInkOutline(THREE, session, colL, 24);
        var colR = new THREE.Mesh(colGeo, steelMat);
        colR.position.set(1.18, 1.36, 0);
        addInkOutline(THREE, session, colR, 24);
        var header = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(2.92, 0.48, 0.66)), darkCaseMat);
        header.position.set(0, 2.74, 0);
        addInkOutline(THREE, session, header, 24);

        var exitSignTex = createSignTexture(THREE, session, 'EXIT // 零号脱出闸门', 'OVERRIDE 100% OR PURGE BOSS', '#4af2a1', '#091815');
        var signMat = session.trackMat(new THREE.MeshBasicMaterial({ map: exitSignTex }));
        var signFace = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(2.55, 0.42)), signMat);
        signFace.position.set(0, 2.74, 0.34);

        var runeTex = session.getPropTex('vfx_hex_pattern', '#6fd8ea');
        mainMat = session.trackMat(new THREE.MeshBasicMaterial({
          map: runeTex,
          color: warningHex,
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(1.96, 2.48)), mainMat);
        spriteMesh.position.set(0, 1.26, 0);

        group.add(colL, colR, header, signFace, spriteMesh);
      } else if (d.id === 'int_clue_concourse') {
        // Z-01 Hero Environmental Storytelling Micro-Vignette:
        // Violently sheared subway turnstile + crimson drag-mark + spilled leather briefcase + scattered punched ticket stubs
        var decalGeo = session.trackGeo(new THREE.PlaneGeometry(2.75, 2.35));
        decalGeo.rotateX(-Math.PI / 2);
        var decalMat = session.trackMat(new THREE.MeshBasicMaterial({
          map: createIncidentClueDecalTexture(THREE, session),
          transparent: true,
          opacity: 0.94,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        }));
        var incidentDecal = new THREE.Mesh(decalGeo, decalMat);
        incidentDecal.position.set(0.05, 0.028, 0.04);

        // Violently tilted/sheared steel turnstile post on the right flank
        var shearedBody = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.32, 0.96, 0.92)), steelMat);
        shearedBody.position.set(0.56, 0.44, -0.22);
        shearedBody.rotation.set(0.14, 0.22, -0.34);
        addInkOutline(THREE, session, shearedBody, 24);

        var shearedCap = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.36, 0.09, 0.96)), darkCaseMat);
        shearedCap.position.set(0.72, 0.88, -0.15);
        shearedCap.rotation.set(0.14, 0.22, -0.34);
        addInkOutline(THREE, session, shearedCap, 24);

        // Short-circuiting amber spark LED on broken card reader
        auxBeaconMat = session.trackMat(new THREE.MeshBasicMaterial({ color: 0xffa838 }));
        var sparkLed = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.16, 0.08, 0.06)), auxBeaconMat);
        sparkLed.position.set(0.62, 0.72, 0.24);

        // Snapped stainless turnstile barrier arm lying across the floor
        var snappedArm = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.76, 8)), steelMat);
        snappedArm.rotation.set(Math.PI * 0.5, 0, 0.62);
        snappedArm.position.set(0.06, 0.045, 0.34);
        addInkOutline(THREE, session, snappedArm, 24);

        // Dropped battered leather commuter briefcase cracked open on its side
        var leatherMat = session.trackMat(new THREE.MeshStandardMaterial({ color: 0x3b271e, roughness: 0.84, metalness: 0.14 }));
        var briefcaseBase = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.56, 0.14, 0.38)), leatherMat);
        briefcaseBase.position.set(-0.34, 0.09, 0.14);
        briefcaseBase.rotation.y = 0.42;
        addInkOutline(THREE, session, briefcaseBase, 24);
        var briefcaseLid = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.54, 0.05, 0.36)), leatherMat);
        briefcaseLid.position.set(-0.46, 0.22, -0.02);
        briefcaseLid.rotation.set(-0.72, 0.42, 0.08);
        addInkOutline(THREE, session, briefcaseLid, 24);
        var caseClasp = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.10, 0.06, 0.06)), brassMat);
        caseClasp.position.set(-0.24, 0.14, 0.32);

        // Tipped yellow-black security stanchion post framing the struggle site
        var stanchionPost = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 0.86, 8)), darkCaseMat);
        stanchionPost.position.set(-0.62, 0.08, -0.44);
        stanchionPost.rotation.set(1.42, 0.35, -0.62);
        addInkOutline(THREE, session, stanchionPost, 24);

        // Subtle warm paper-glint interactable indicator hovering gently over the spilled ticket stubs (no sci-fi cone)
        var clueTex = session.getPropTex('clue_glow', '#e8c47a');
        mainMat = session.trackMat(new THREE.MeshBasicMaterial({
          map: clueTex,
          color: 0xf4dca4,
          transparent: true,
          opacity: 0.68,
          side: THREE.DoubleSide,
          depthWrite: false
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.46, 0.46)), mainMat);
        spriteMesh.position.set(-0.18, 0.44, 0.10);
        spriteMesh.rotation.x = -0.28;

        // Restrain ground rings to a quiet forensic glint
        rMat.opacity = 0.14;
        pulseMat.opacity = 0.08;

        group.add(
          incidentDecal, shearedBody, shearedCap, sparkLed, snappedArm,
          briefcaseBase, briefcaseLid, caseClasp, stanchionPost, spriteMesh
        );
      } else {
        // Grounded Heavy-Ink Forensic Evidence Case + Subtle Diegetic Paper Glint (no arcade hologram cone)
        var pad = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.68, 0.06, 0.52)), darkCaseMat);
        pad.position.y = 0.03;
        addInkOutline(THREE, session, pad, 24);
        var caseBox = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.52, 0.18, 0.36)), steelMat);
        caseBox.position.set(0, 0.15, 0);
        caseBox.rotation.y = 0.24;
        addInkOutline(THREE, session, caseBox, 24);
        var clasp = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.14, 0.06, 0.38)), brassMat);
        clasp.position.set(0, 0.19, 0);
        clasp.rotation.y = 0.24;

        var clueTex2 = session.getPropTex('clue_glow', '#d8be84');
        mainMat = session.trackMat(new THREE.MeshBasicMaterial({
          map: clueTex2,
          color: 0xeed9a6,
          transparent: true,
          opacity: 0.72,
          side: THREE.DoubleSide,
          depthWrite: false
        }));
        spriteMesh = new THREE.Mesh(session.trackGeo(new THREE.PlaneGeometry(0.54, 0.54)), mainMat);
        spriteMesh.position.y = 0.54;
        spriteMesh.rotation.x = -0.28;
        rMat.opacity = 0.18;
        pulseMat.opacity = 0.10;

        group.add(pad, caseBox, clasp, spriteMesh);
      }

      session.scene.add(group);

      var item = {
        id: d.id || ('obj_' + i),
        type: type,
        x: Number(d.x),
        z: Number(d.z),
        zoneId: d.zoneId || session.mapApi.getZoneAt(d.x, d.z),
        label: d.label || (type === 'console' ? '道岔控制台' : (type === 'exit' ? '0号站台撤离闸门' : '异常线索')),
        clueId: d.clueId || null,
        overrideValue: Number(d.overrideValue) || 50,
        done: false,
        progress: 0,
        group: group,
        sprite: spriteMesh,
        mat: mainMat,
        beaconMat: auxBeaconMat,
        ring: ring,
        ringMat: rMat,
        pulseRing: pulseRing,
        pulseMat: pulseMat,
        spriteBaseY: d.id === 'int_clue_concourse' ? 0.44 : (type === 'clue' ? 0.54 : undefined),
        spriteBobAmp: d.id === 'int_clue_concourse' ? 0.04 : (type === 'clue' ? 0.06 : undefined),
        ringBaseOpacity: d.id === 'int_clue_concourse' ? 0.14 : (type === 'clue' ? 0.18 : undefined),
        bobPhase: i * 1.3
      };

      session.interactables.push(item);
      session.interactablesById[item.id] = item;
    }

    // --- 4B. Dynamic Destructible Covers & Interactive Scene Triggers for 4x Map ---
    if (!session.destructibleCovers) session.destructibleCovers = [];
    if (!session.sceneTriggers) session.sceneTriggers = [];

    var dynSet = generateDynamicInteractables(session.mapApi);
    var coverRingGeo = session.trackGeo(new THREE.RingGeometry(0.68, 0.78, 24));
    coverRingGeo.rotateX(-Math.PI / 2);

    // Build Composite 3D Destructible Cover Barricades
    for (var di = 0; di < dynSet.destructibles.length; di++) {
      var dc = dynSet.destructibles[di];
      var dcGroup = new THREE.Group();
      dcGroup.position.set(dc.x, 0, dc.z);
      var dcAo = new THREE.Mesh(propAoGeo, propAoMat);
      dcAo.position.y = 0.024;
      dcAo.scale.set(1.12, 1.12, 1);
      dcGroup.add(dcAo);

      var dcRingMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: 0xe69f2e,
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var dcRing = new THREE.Mesh(coverRingGeo, dcRingMat);
      dcRing.position.y = 0.062;
      dcGroup.add(dcRing);

      var dcPulseMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: 0xe69f2e,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var dcPulse = new THREE.Mesh(coverRingGeo, dcPulseMat);
      dcPulse.position.y = 0.058;
      dcGroup.add(dcPulse);

      var intactGroup = new THREE.Group();
      var fractureMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: 0xffa838,
        transparent: true,
        opacity: 0.72
      }));

      if (dc.kind === 'crate_barricade') {
        var crateBase = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.16, 0.76, 0.94)), steelMat);
        crateBase.position.set(0, 0.38, 0);
        addInkOutline(THREE, session, crateBase, 24);
        var crateTop = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.72, 0.44, 0.64)), concreteMat);
        crateTop.position.set(-0.14, 0.98, -0.06);
        crateTop.rotation.y = 0.18;
        addInkOutline(THREE, session, crateTop, 24);
        var hazBand = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.20, 0.14, 0.98)), hazardMat);
        hazBand.position.set(0, 0.62, 0);
        var seamA = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.08, 0.56, 1.00)), fractureMat);
        seamA.position.set(0.16, 0.38, 0);
        seamA.rotation.z = 0.22;
        var capBar = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.18, 0.08, 0.18)), darkCaseMat);
        capBar.position.set(0, 0.78, 0.38);
        intactGroup.add(crateBase, crateTop, hazBand, seamA, capBar);
      } else {
        var jerseyFoot = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.28, 0.34, 0.88)), darkCaseMat);
        jerseyFoot.position.set(0, 0.17, 0);
        addInkOutline(THREE, session, jerseyFoot, 24);
        var jerseyCore = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.14, 0.72, 0.62)), concreteMat);
        jerseyCore.position.set(0, 0.68, 0);
        addInkOutline(THREE, session, jerseyCore, 24);
        var jerseyStripe = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.18, 0.15, 0.66)), hazardMat);
        jerseyStripe.position.set(0, 0.82, 0);
        var jerseyRail = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(1.22, 0.10, 0.46)), steelMat);
        jerseyRail.position.set(0, 1.08, 0);
        addInkOutline(THREE, session, jerseyRail, 24);
        var seamB = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.09, 0.64, 0.68)), fractureMat);
        seamB.position.set(-0.10, 0.66, 0);
        seamB.rotation.z = -0.26;
        intactGroup.add(jerseyFoot, jerseyCore, jerseyStripe, jerseyRail, seamB);
      }
      dcGroup.add(intactGroup);

      // Shattered walkable rubble pile (revealed when hp <= 0)
      var rubbleGroup = new THREE.Group();
      var rChunk1 = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.56, 0.14, 0.42)), rubbleMat);
      rChunk1.position.set(-0.28, 0.07, 0.16);
      rChunk1.rotation.y = 0.42;
      var rChunk2 = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.48, 0.11, 0.38)), concreteMat);
      rChunk2.position.set(0.30, 0.055, -0.18);
      rChunk2.rotation.y = -0.58;
      var rChunk3 = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.32, 0.08, 0.24)), hazardMat);
      rChunk3.position.set(0.04, 0.04, 0.22);
      rChunk3.rotation.y = 0.85;
      var clueRemnantMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: 0x5ce8c8,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var clueRemnant = new THREE.Mesh(session.trackGeo(new THREE.CircleGeometry(0.28, 12)), clueRemnantMat);
      clueRemnant.rotation.x = -Math.PI / 2;
      clueRemnant.position.y = 0.048;
      rubbleGroup.add(rChunk1, rChunk2, rChunk3, clueRemnant);
      rubbleGroup.visible = false;
      dcGroup.add(rubbleGroup);

      session.scene.add(dcGroup);

      var covItem = {
        id: dc.id,
        type: 'destructible_cover',
        kind: dc.kind,
        x: dc.x,
        z: dc.z,
        zoneId: dc.zoneId,
        zoneCode: dc.zoneCode,
        label: dc.label,
        actionLabel: dc.actionLabel,
        hp: dc.hp,
        maxHp: dc.maxHp,
        radius: dc.radius,
        destroyed: false,
        hitShake: 0,
        hitFlash: 0,
        done: false,
        progress: 0,
        envClue: dc.envClue,
        group: dcGroup,
        intactGroup: intactGroup,
        rubbleGroup: rubbleGroup,
        sprite: intactGroup,
        mat: fractureMat,
        fractureMat: fractureMat,
        ring: dcRing,
        ringMat: dcRingMat,
        pulseRing: dcPulse,
        pulseMat: dcPulseMat,
        bobPhase: di * 0.9
      };
      session.destructibleCovers.push(covItem);
      session.interactables.push(covItem);
      session.interactablesById[covItem.id] = covItem;
    }

    // Build Composite 3D Interactive Scene Triggers
    for (var ti = 0; ti < dynSet.triggers.length; ti++) {
      var tr = dynSet.triggers[ti];
      var trGroup = new THREE.Group();
      trGroup.position.set(tr.x, 0, tr.z);
      var trAo = new THREE.Mesh(propAoGeo, propAoMat);
      trAo.position.y = 0.024;
      trAo.scale.set(0.92, 0.92, 1);
      trGroup.add(trAo);

      var trColor = tr.triggerEffect === 'acoustic_lure'
        ? 0xffaa3b
        : (tr.triggerEffect === 'arc_surge' ? 0x6fa8ff : 0x5ce8c8);

      var trRingMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: trColor,
        transparent: true,
        opacity: 0.44,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var trRing = new THREE.Mesh(ringGeo, trRingMat);
      trRing.position.y = 0.068;
      trGroup.add(trRing);

      var trPulseMat = session.trackMat(new THREE.MeshBasicMaterial({
        color: trColor,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      var trPulse = new THREE.Mesh(ringGeo, trPulseMat);
      trPulse.position.y = 0.064;
      trGroup.add(trPulse);

      var trBeaconMat = session.trackMat(new THREE.MeshBasicMaterial({ color: trColor }));
      var trPlinth = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.46, 0.54, 0.14, 8)), darkCaseMat);
      trPlinth.position.y = 0.07;
      addInkOutline(THREE, session, trPlinth, 24);
      trGroup.add(trPlinth);

      var animPart = null;
      if (tr.triggerEffect === 'vent_purge') {
        var pipeBody = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.22, 0.26, 1.18, 10)), steelMat);
        pipeBody.position.y = 0.72;
        addInkOutline(THREE, session, pipeBody, 24);
        var hoodCap = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.56, 0.24, 0.56)), darkCaseMat);
        hoodCap.position.y = 1.38;
        addInkOutline(THREE, session, hoodCap, 24);
        var wheel = new THREE.Mesh(session.trackGeo(new THREE.TorusGeometry(0.24, 0.045, 8, 16)), brassMat);
        wheel.position.set(0, 0.88, 0.26);
        var gauge = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.09, 10, 10)), trBeaconMat);
        gauge.position.set(0, 1.54, 0);
        trGroup.add(pipeBody, hoodCap, wheel, gauge);
        animPart = wheel;
      } else if (tr.triggerEffect === 'sonar_relay') {
        var mast = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.08, 0.18, 1.24, 8)), steelMat);
        mast.position.y = 0.74;
        addInkOutline(THREE, session, mast, 24);
        var dish = new THREE.Mesh(session.trackGeo(new THREE.ConeGeometry(0.38, 0.26, 12, 1, true)), darkCaseMat);
        dish.position.set(0, 1.44, 0);
        dish.rotation.x = 0.52;
        addInkOutline(THREE, session, dish, 24);
        var crystal = new THREE.Mesh(session.trackGeo(new THREE.OctahedronGeometry(0.14, 0)), trBeaconMat);
        crystal.position.set(0, 1.68, 0.06);
        trGroup.add(mast, dish, crystal);
        animPart = crystal;
      } else if (tr.triggerEffect === 'arc_surge') {
        var cab = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.76, 1.12, 0.52)), darkCaseMat);
        cab.position.y = 0.68;
        addInkOutline(THREE, session, cab, 24);
        var coilL = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.09, 0.11, 0.48, 8)), brassMat);
        coilL.position.set(-0.22, 1.44, 0);
        var coilR = new THREE.Mesh(session.trackGeo(new THREE.CylinderGeometry(0.09, 0.11, 0.48, 8)), brassMat);
        coilR.position.set(0.22, 1.44, 0);
        var arcCore = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.50, 0.10, 0.10)), trBeaconMat);
        arcCore.position.set(0, 1.62, 0);
        var switchArm = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.08, 0.36, 0.08)), hazardMat);
        switchArm.position.set(0, 0.92, 0.30);
        switchArm.rotation.x = 0.48;
        trGroup.add(cab, coilL, coilR, arcCore, switchArm);
        animPart = switchArm;
      } else {
        // acoustic_lure: breaker box + twin speakers + pull lever
        var boxBody = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.70, 1.16, 0.44)), steelMat);
        boxBody.position.y = 0.70;
        addInkOutline(THREE, session, boxBody, 24);
        var horn = new THREE.Mesh(session.trackGeo(new THREE.ConeGeometry(0.24, 0.36, 10, 1, true)), darkCaseMat);
        horn.position.set(0, 1.44, 0.10);
        horn.rotation.x = Math.PI * 0.42;
        addInkOutline(THREE, session, horn, 24);
        var pullLever = new THREE.Mesh(session.trackGeo(new THREE.BoxGeometry(0.08, 0.38, 0.08)), brassMat);
        pullLever.position.set(0.40, 0.86, 0.08);
        pullLever.rotation.z = -0.45;
        var lamp = new THREE.Mesh(session.trackGeo(new THREE.SphereGeometry(0.09, 10, 10)), trBeaconMat);
        lamp.position.set(-0.20, 1.38, 0.16);
        trGroup.add(boxBody, horn, pullLever, lamp);
        animPart = pullLever;
      }

      session.scene.add(trGroup);

      var trigItem = {
        id: tr.id,
        type: 'scene_trigger',
        triggerEffect: tr.triggerEffect,
        x: tr.x,
        z: tr.z,
        zoneId: tr.zoneId,
        zoneCode: tr.zoneCode,
        label: tr.label,
        actionLabel: tr.actionLabel,
        done: false,
        progress: 0,
        envClue: tr.envClue,
        group: trGroup,
        sprite: animPart || trGroup,
        animPart: animPart,
        mat: trBeaconMat,
        beaconMat: trBeaconMat,
        ring: trRing,
        ringMat: trRingMat,
        pulseRing: trPulse,
        pulseMat: trPulseMat,
        bobPhase: ti * 1.15
      };
      session.sceneTriggers.push(trigItem);
      session.interactables.push(trigItem);
      session.interactablesById[trigItem.id] = trigItem;
    }
  }

  INFINITY.SceneArchitect = {
    buildStation: buildStation,
    buildLightFixtures: buildLightFixtures,
    buildGhostTrain: buildGhostTrain,
    buildInteractables: buildInteractables,
    updateAmbientDynamics: updateAmbientDynamics,
    generateDynamicZoneProps: generateDynamicZoneProps,
    generateDynamicInteractables: generateDynamicInteractables,
    getZonePropSpecs: getZonePropSpecs
  };
})(typeof window !== 'undefined' ? window : globalThis);
