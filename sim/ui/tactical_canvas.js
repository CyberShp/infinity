/**
 * Infinity Living Simulator — High-DPI Interactive HTML5 Canvas Renderer
 * Attaches to window.INFINITY.Canvas
 * Modes:
 *   1. mountHallVortex(canvasEl) — Obsidian & Crimson-Gilt Living Spiral Vortex
 *   2. mountTacticalMap(canvasEl, callbacks) — Station Zero 6-Node Architectural Blueprint
 */
(function () {
  'use strict';

  window.INFINITY = window.INFINITY || {};

  var rafId = null;
  var resizeObserver = null;
  var currentCanvas = null;
  var currentCtx = null;
  var currentMode = null; // 'vortex' | 'tactical'
  var dpr = 1;
  var width = 0;
  var height = 0;
  var startTime = 0;

  // Pointer & interaction state
  var pointer = { x: 0.5, y: 0.5, active: false, px: -999, py: -999 };
  var hoveredNodeId = null;
  var mapCallbacks = {};
  var boundListeners = [];

  // VFX state
  var pulses = []; // { nodeId, x, y, color, label, born, duration }
  var shakeIntensity = 0;
  var tacticalState = null;

  // Vortex particles
  var vortexParticles = [];
  var vortexRunes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  var fogWisps = [];

  // Fallback 6-node blueprint if scenario data is not yet loaded
  var FALLBACK_NODES = [
    { id: 'concourse', name: '候车中庭', code: 'S-01', x: 0.18, y: 0.30, neighbors: ['ticket_gate', 'security_room'] },
    { id: 'ticket_gate', name: '检票长廊', code: 'S-02', x: 0.48, y: 0.25, neighbors: ['concourse', 'platform_main', 'control_booth'] },
    { id: 'control_booth', name: '轨控值班室', code: 'S-03', x: 0.80, y: 0.26, neighbors: ['ticket_gate', 'signal_tunnel'] },
    { id: 'security_room', name: '安检暗室', code: 'S-04', x: 0.22, y: 0.72, neighbors: ['concourse', 'platform_main'] },
    { id: 'platform_main', name: '零号停摆站台', code: 'S-05', x: 0.52, y: 0.70, neighbors: ['ticket_gate', 'security_room', 'signal_tunnel'] },
    { id: 'signal_tunnel', name: '信号维修井道', code: 'S-06', x: 0.83, y: 0.72, neighbors: ['control_booth', 'platform_main'] }
  ];

  function initVortexParticles() {
    vortexParticles = [];
    for (var i = 0; i < 165; i++) {
      var r = 0.12 + Math.pow(Math.random(), 0.78) * 0.86;
      vortexParticles.push({
        angle: Math.random() * Math.PI * 2,
        r: r,
        speed: (0.14 + (1 - r) * 0.52) * (0.75 + Math.random() * 0.5),
        size: 0.9 + Math.random() * 2.1,
        gilt: Math.random() < 0.26,
        alpha: 0.25 + Math.random() * 0.65,
        inward: 0.018 + Math.random() * 0.032
      });
    }
  }

  function initFogWisps() {
    fogWisps = [];
    for (var i = 0; i < 16; i++) {
      fogWisps.push({
        x: Math.random(),
        y: Math.random(),
        rx: 0.16 + Math.random() * 0.22,
        ry: 0.08 + Math.random() * 0.12,
        vx: (0.006 + Math.random() * 0.012) * (Math.random() < 0.5 ? 1 : -1),
        alpha: 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function addListener(el, type, fn) {
    el.addEventListener(type, fn);
    boundListeners.push({ el: el, type: type, fn: fn });
  }

  function cleanup() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (resizeObserver) {
      try { resizeObserver.disconnect(); } catch (_) {}
      resizeObserver = null;
    }
    for (var i = 0; i < boundListeners.length; i++) {
      var b = boundListeners[i];
      b.el.removeEventListener(b.type, b.fn);
    }
    boundListeners = [];
    currentCanvas = null;
    currentCtx = null;
    currentMode = null;
    hoveredNodeId = null;
    pulses = [];
    shakeIntensity = 0;
  }

  function syncSize() {
    if (!currentCanvas) return;
    var rect = currentCanvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    var targetW = Math.round(width * dpr);
    var targetH = Math.round(height * dpr);
    if (currentCanvas.width !== targetW || currentCanvas.height !== targetH) {
      currentCanvas.width = targetW;
      currentCanvas.height = targetH;
    }
  }

  function getScenarioNodes() {
    var scenario = window.INFINITY.SCENARIOS && window.INFINITY.SCENARIOS.station_zero;
    var raw = scenario && scenario.nodes;
    if (!raw) return FALLBACK_NODES;

    var list = Array.isArray(raw)
      ? raw
      : Object.keys(raw).map(function (k) {
          var n = raw[k];
          return Object.assign({ id: k }, n);
        });

    if (!list.length) return FALLBACK_NODES;

    // Normalize coordinates (supports 0..1, 0..100, or pixel spaces)
    var maxX = 0;
    var maxY = 0;
    for (var i = 0; i < list.length; i++) {
      var nx = Number(list[i].x != null ? list[i].x : (list[i].pos && list[i].pos.x));
      var ny = Number(list[i].y != null ? list[i].y : (list[i].pos && list[i].pos.y));
      if (!isNaN(nx) && nx > maxX) maxX = nx;
      if (!isNaN(ny) && ny > maxY) maxY = ny;
    }

    var divX = maxX > 1.2 ? (maxX > 105 ? maxX * 1.15 : 100) : 1;
    var divY = maxY > 1.2 ? (maxY > 105 ? maxY * 1.15 : 100) : 1;

    return list.map(function (node, idx) {
      var fb = FALLBACK_NODES[idx % FALLBACK_NODES.length];
      var rx = node.x != null ? node.x : (node.pos && node.pos.x);
      var ry = node.y != null ? node.y : (node.pos && node.pos.y);
      var xNorm = rx != null && !isNaN(Number(rx)) ? Number(rx) / divX : fb.x;
      var yNorm = ry != null && !isNaN(Number(ry)) ? Number(ry) / divY : fb.y;
      // Keep comfortable margin inside canvas
      xNorm = Math.max(0.11, Math.min(0.89, xNorm));
      yNorm = Math.max(0.17, Math.min(0.83, yNorm));
      var links = node.neighbors || node.connections || node.adjacent || node.links || fb.neighbors;
      return {
        id: node.id || fb.id,
        name: node.name || node.title || fb.name,
        code: node.code || ('S-0' + (idx + 1)),
        x: xNorm,
        y: yNorm,
        neighbors: Array.isArray(links) ? links : [],
        isRail: !!(node.isRail || node.rail || /platform|rail|tunnel|站台|井道/i.test(String(node.id) + String(node.name)))
      };
    });
  }

  function extractExamSnapshot() {
    var s = tacticalState || {};
    var exam = s.exam || s;
    var playerNode = exam.currentNode || exam.playerNode || exam.nodeId || null;
    var threat = Number(exam.threat != null ? exam.threat : (exam.threatLevel != null ? exam.threatLevel : 15)) || 0;
    var sound = Number(exam.sound != null ? exam.sound : (exam.noise != null ? exam.noise : 10)) || 0;
    var activeCrisis = exam.activeCrisis || null;

    // Extract node effects / wards / marks / blackout
    var nodeEffects = {};
    var rawNodeStates = exam.nodeStates || exam.nodes || exam.wards || {};
    if (rawNodeStates && typeof rawNodeStates === 'object') {
      Object.keys(rawNodeStates).forEach(function (nid) {
        var st = rawNodeStates[nid];
        if (!st) return;
        if (typeof st === 'string') {
          nodeEffects[nid] = { effect: st };
        } else {
          nodeEffects[nid] = {
            warded: !!(st.warded || st.effect === 'warded' || (Array.isArray(st.effects) && st.effects.indexOf('warded') >= 0) || (Array.isArray(st.wards) && st.wards.length > 0)),
            marked: !!(st.marked || st.effect === 'marked' || (Array.isArray(st.effects) && st.effects.indexOf('marked') >= 0)),
            blackout: !!(st.blackout || st.effect === 'blackout' || (Array.isArray(st.effects) && st.effects.indexOf('blackout') >= 0)),
            cleared: !!(st.cleared || st.searched || st.effect === 'cleared'),
            label: st.wardName || st.label || ''
          };
        }
      });
    }

    // Extract NPC positions
    var npcMap = {};
    var rawNpcs = exam.npcPositions || exam.squadPositions || exam.npcs || {};
    if (rawNpcs && typeof rawNpcs === 'object') {
      Object.keys(rawNpcs).forEach(function (npcId) {
        var val = rawNpcs[npcId];
        if (typeof val === 'string') {
          npcMap[npcId] = val;
        } else if (val && typeof val === 'object') {
          var pos = val.nodeId || val.node || val.location;
          if (pos && val.alive !== false && val.present !== false) {
            npcMap[npcId] = pos;
          }
        }
      });
    }

    // Extract Inspector enemy
    var enemyObj = exam.enemy || exam.inspector || null;
    var enemy = null;
    if (enemyObj && typeof enemyObj === 'object') {
      enemy = {
        nodeId: enemyObj.nodeId || enemyObj.node || enemyObj.currentNode || null,
        detected: enemyObj.detected !== false,
        alert: Number(enemyObj.alertLevel != null ? enemyObj.alertLevel : threat) || 0,
        stunnedTurns: Number(enemyObj.stunnedTurns || enemyObj.stunTurns || 0) || 0,
        name: enemyObj.name || '检票员'
      };
    }

    return {
      playerNode: playerNode,
      threat: threat,
      sound: sound,
      activeCrisis: activeCrisis,
      nodeEffects: nodeEffects,
      npcMap: npcMap,
      enemy: enemy
    };
  }

  /* ===================== HALL CRIMSON VORTEX RENDERER ===================== */

  function renderHallVortex(t) {
    var ctx = currentCtx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear with obsidian depth
    var cx = width * 0.52 + (pointer.x - 0.5) * 28;
    var cy = height * 0.48 + (pointer.y - 0.5) * 20;
    var maxR = Math.min(width, height) * 0.48;

    var bg = ctx.createRadialGradient(cx, cy, maxR * 0.04, cx, cy, Math.max(width, height) * 0.78);
    bg.addColorStop(0, '#1e0807');
    bg.addColorStop(0.26, '#130708');
    bg.addColorStop(0.62, '#0b090a');
    bg.addColorStop(1, '#070607');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle breathing aura
    var breath = 0.5 + 0.5 * Math.sin(t * 0.9);
    var aura = ctx.createRadialGradient(cx, cy, maxR * 0.14, cx, cy, maxR * (0.86 + breath * 0.08));
    aura.addColorStop(0, 'rgba(182, 42, 26, 0.28)');
    aura.addColorStop(0.45, 'rgba(138, 26, 20, 0.14)');
    aura.addColorStop(0.78, 'rgba(218, 134, 62, 0.04)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    // Outer tactical wristwatch bezel rings & Roman/data tick marks
    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = 'rgba(228, 215, 190, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, maxR * 0.96, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(t * 0.025);
    for (var tick = 0; tick < 60; tick++) {
      var a = (tick / 60) * Math.PI * 2;
      var major = tick % 5 === 0;
      var r1 = maxR * (major ? 0.90 : 0.935);
      var r2 = maxR * 0.96;
      ctx.strokeStyle = major ? 'rgba(229, 167, 85, 0.28)' : 'rgba(228, 215, 190, 0.10)';
      ctx.lineWidth = major ? 1.3 : 0.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.font = '600 9px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = 'rgba(228, 215, 190, 0.22)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var rn = 0; rn < 12; rn++) {
      var ra = (rn / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(vortexRunes[rn], Math.cos(ra) * maxR * 0.84, Math.sin(ra) * maxR * 0.84);
    }
    ctx.restore();

    // Logarithmic crimson-gilt spiral strands (inspired by repo vortex aesthetic)
    var arms = 7;
    for (var arm = 0; arm < arms; arm++) {
      var baseAngle = (arm / arms) * Math.PI * 2 + t * 0.22;
      var isGilt = arm % 3 === 0;
      ctx.beginPath();
      var steps = 42;
      for (var s = 0; s <= steps; s++) {
        var f = s / steps;
        var rad = maxR * (0.14 + f * 0.78);
        var swirl = baseAngle - Math.log(f + 0.16) * 2.15 + Math.sin(f * 5 - t * 1.4) * 0.08;
        var px = Math.cos(swirl) * rad;
        var py = Math.sin(swirl) * rad * 0.88;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      var grad = ctx.createRadialGradient(0, 0, maxR * 0.15, 0, 0, maxR * 0.88);
      if (isGilt) {
        grad.addColorStop(0, 'rgba(244, 178, 92, 0.36)');
        grad.addColorStop(0.45, 'rgba(214, 72, 34, 0.22)');
        grad.addColorStop(1, 'rgba(120, 20, 18, 0)');
      } else {
        grad.addColorStop(0, 'rgba(218, 52, 32, 0.44)');
        grad.addColorStop(0.55, 'rgba(148, 22, 20, 0.22)');
        grad.addColorStop(1, 'rgba(80, 12, 14, 0)');
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = isGilt ? 1.8 : 2.8;
      ctx.stroke();
    }

    // Orbiting crimson & gilt data dust
    var dt = 0.016;
    for (var i = 0; i < vortexParticles.length; i++) {
      var p = vortexParticles[i];
      p.angle += p.speed * dt;
      p.r -= p.inward * dt * (0.4 + (1 - p.r) * 1.4);
      if (p.r < 0.13) {
        p.r = 0.88 + Math.random() * 0.12;
        p.angle = Math.random() * Math.PI * 2;
      }
      var pr = p.r * maxR;
      var x = Math.cos(p.angle) * pr;
      var y = Math.sin(p.angle) * pr * 0.88;
      var fade = Math.min(1, (p.r - 0.13) * 5) * Math.min(1, (1 - p.r) * 4);
      var aVal = p.alpha * fade;

      ctx.fillStyle = p.gilt
        ? 'rgba(246, 196, 118, ' + aVal.toFixed(3) + ')'
        : 'rgba(222, 68, 44, ' + (aVal * 0.92).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark obsidian eye core with burnished crimson rim
    var coreR = maxR * (0.145 + breath * 0.012);
    var eyeGrad = ctx.createRadialGradient(0, 0, coreR * 0.4, 0, 0, coreR * 1.65);
    eyeGrad.addColorStop(0, '#050405');
    eyeGrad.addColorStop(0.62, '#0c0506');
    eyeGrad.addColorStop(0.76, 'rgba(226, 78, 36, 0.72)');
    eyeGrad.addColorStop(0.86, 'rgba(245, 178, 92, 0.28)');
    eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreR * 1.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  /* ===================== STATION ZERO TACTICAL MAP RENDERER ===================== */

  function getNodeCoords(node) {
    return {
      x: node.x * width,
      y: node.y * height
    };
  }

  function findNodeAtPoint(px, py, nodes) {
    var hitRadius = Math.max(28, Math.min(width, height) * 0.075);
    var best = null;
    var bestDist = hitRadius;
    for (var i = 0; i < nodes.length; i++) {
      var pos = getNodeCoords(nodes[i]);
      var dx = px - pos.x;
      var dy = py - pos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = nodes[i];
      }
    }
    return best;
  }

  function renderTacticalMap(t) {
    var ctx = currentCtx;
    var nodes = getScenarioNodes();
    var snap = extractExamSnapshot();
    var cast = window.INFINITY.CAST || {};

    ctx.save();
    ctx.scale(dpr, dpr);

    // Camera shake
    var sx = 0;
    var sy = 0;
    if (shakeIntensity > 0.15) {
      sx = (Math.random() * 2 - 1) * shakeIntensity;
      sy = (Math.random() * 2 - 1) * shakeIntensity;
      shakeIntensity *= 0.89;
    } else {
      shakeIntensity = 0;
    }

    // Background obsidian blueprint surface
    var bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0b0e');
    bgGrad.addColorStop(0.55, '#0e1014');
    bgGrad.addColorStop(1, '#090a0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(sx, sy);

    // Architectural drafting grid
    var gridStep = 28;
    ctx.strokeStyle = 'rgba(136, 158, 178, 0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = gridStep; gx < width; gx += gridStep) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
    }
    for (var gy = gridStep; gy < height; gy += gridStep) {
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
    }
    ctx.stroke();

    // Subterranean metro twin rail lines along the lower axis
    var railY = height * 0.72;
    ctx.save();
    ctx.strokeStyle = 'rgba(218, 176, 118, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, railY - 12);
    ctx.lineTo(width, railY - 12);
    ctx.moveTo(0, railY + 12);
    ctx.lineTo(width, railY + 12);
    ctx.stroke();

    // Rail sleeper ties
    ctx.strokeStyle = 'rgba(196, 180, 152, 0.07)';
    ctx.lineWidth = 2;
    for (var rx = 8; rx < width; rx += 18) {
      ctx.beginPath();
      ctx.moveTo(rx, railY - 16);
      ctx.lineTo(rx, railY + 16);
      ctx.stroke();
    }

    // Subtle moving ghost-train light sweep along rail when threat is high
    var sweepX = ((t * 58) % (width + 240)) - 120;
    var railGlow = ctx.createLinearGradient(sweepX - 90, 0, sweepX + 90, 0);
    railGlow.addColorStop(0, 'rgba(220, 62, 42, 0)');
    railGlow.addColorStop(0.5, snap.threat > 55 ? 'rgba(220, 62, 42, 0.16)' : 'rgba(92, 194, 214, 0.08)');
    railGlow.addColorStop(1, 'rgba(220, 62, 42, 0)');
    ctx.fillStyle = railGlow;
    ctx.fillRect(0, railY - 14, width, 28);
    ctx.restore();

    // Animated drifting subterranean fog wisps
    for (var f = 0; f < fogWisps.length; f++) {
      var wisp = fogWisps[f];
      wisp.x += wisp.vx * 0.016;
      if (wisp.x < -0.3) wisp.x = 1.3;
      if (wisp.x > 1.3) wisp.x = -0.3;
      var wx = wisp.x * width;
      var wy = wisp.y * height + Math.sin(t * 0.4 + wisp.phase) * 8;
      var rad = wisp.rx * width;
      var fg = ctx.createRadialGradient(wx, wy, 4, wx, wy, rad);
      fg.addColorStop(0, 'rgba(148, 165, 182, ' + wisp.alpha.toFixed(3) + ')');
      fg.addColorStop(1, 'rgba(14, 16, 20, 0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(wx, wy, rad, wisp.ry * height, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Build lookup for nodes
    var nodeById = {};
    for (var ni = 0; ni < nodes.length; ni++) {
      nodeById[nodes[ni].id] = nodes[ni];
    }

    // Determine player's adjacent reachable nodes
    var playerObj = snap.playerNode ? nodeById[snap.playerNode] : null;
    var adjacentSet = {};
    if (playerObj && Array.isArray(playerObj.neighbors)) {
      for (var ai = 0; ai < playerObj.neighbors.length; ai++) {
        adjacentSet[playerObj.neighbors[ai]] = true;
      }
    }

    // Draw corridors (deduplicated)
    var drawnEdges = {};
    for (var i = 0; i < nodes.length; i++) {
      var nA = nodes[i];
      var pA = getNodeCoords(nA);
      for (var j = 0; j < nA.neighbors.length; j++) {
        var targetId = nA.neighbors[j];
        var nB = nodeById[targetId];
        if (!nB) continue;
        var key = nA.id < nB.id ? (nA.id + '::' + nB.id) : (nB.id + '::' + nA.id);
        if (drawnEdges[key]) continue;
        drawnEdges[key] = true;

        var pB = getNodeCoords(nB);
        var isReachable = (snap.playerNode === nA.id || snap.playerNode === nB.id);
        var isHoverEdge = (hoveredNodeId === nA.id || hoveredNodeId === nB.id);

        // Corridor outer glow
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.strokeStyle = isReachable
          ? 'rgba(92, 194, 214, 0.24)'
          : 'rgba(180, 170, 154, 0.08)';
        ctx.lineWidth = isReachable ? 6 : 4;
        ctx.stroke();

        // Crisp center blueprint line
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        if (isReachable) {
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = -t * 18;
          ctx.strokeStyle = isHoverEdge ? 'rgba(244, 198, 120, 0.85)' : 'rgba(116, 216, 232, 0.65)';
          ctx.lineWidth = 1.6;
        } else {
          ctx.strokeStyle = 'rgba(196, 186, 168, 0.25)';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw sound-wave & tactical pulses behind node labels
    var nowMs = performance.now();
    for (var pi = pulses.length - 1; pi >= 0; pi--) {
      var pulse = pulses[pi];
      var age = (nowMs - pulse.born) / pulse.duration;
      if (age >= 1) {
        pulses.splice(pi, 1);
        continue;
      }
      var targetNode = pulse.nodeId ? nodeById[pulse.nodeId] : null;
      var pc = targetNode ? getNodeCoords(targetNode) : { x: width * 0.5, y: height * 0.5 };
      var radius = 16 + age * 76;
      var alpha = (1 - age) * 0.85;

      ctx.save();
      ctx.strokeStyle = pulse.color || '#5cc2d6';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.2 - age * 1.2;
      ctx.beginPath();
      ctx.arc(pc.x, pc.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(pc.x, pc.y, radius * 0.62, 0, Math.PI * 2);
      ctx.stroke();

      if (pulse.label) {
        ctx.globalAlpha = Math.min(1, (1 - age) * 1.4);
        ctx.font = '600 11px "SFMono-Regular", Consolas, monospace';
        ctx.fillStyle = pulse.color || '#f2d5c3';
        ctx.textAlign = 'center';
        ctx.fillText(pulse.label, pc.x, pc.y - 34 - age * 22);
      }
      ctx.restore();
    }

    // Draw each spatial node
    for (var k = 0; k < nodes.length; k++) {
      var node = nodes[k];
      var pt = getNodeCoords(node);
      var isPlayerHere = snap.playerNode === node.id;
      var isAdjacent = !!adjacentSet[node.id];
      var isHovered = hoveredNodeId === node.id;
      var fx = snap.nodeEffects[node.id] || {};
      var isEnemyHere = snap.enemy && snap.enemy.nodeId === node.id && snap.enemy.detected;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      // Deployed Ward / Spatial Mark rotating geometric sigil
      if (fx.warded || fx.marked) {
        ctx.save();
        ctx.rotate(t * (fx.warded ? 0.55 : -0.45));
        var sigilR = 36;
        ctx.strokeStyle = fx.warded ? 'rgba(232, 186, 98, 0.72)' : 'rgba(132, 212, 198, 0.72)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var v = 0; v < 6; v++) {
          var va = (v / 6) * Math.PI * 2;
          var vx = Math.cos(va) * sigilR;
          var vy = Math.sin(va) * sigilR;
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, sigilR - 5, 0, Math.PI * 2);
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // Inspector Enemy predator radar ring
      if (isEnemyHere) {
        var ePulse = 0.5 + 0.5 * Math.sin(t * 5.2);
        ctx.save();
        ctx.strokeStyle = 'rgba(232, 54, 42, ' + (0.45 + ePulse * 0.45).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 32 + ePulse * 11, 0, Math.PI * 2);
        ctx.stroke();

        // Corner predator lock brackets
        ctx.strokeStyle = '#ff4b3e';
        ctx.lineWidth = 1.8;
        var br = 28;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) {
          ctx.beginPath();
          ctx.moveTo(c[0] * br, c[1] * (br - 8));
          ctx.lineTo(c[0] * br, c[1] * br);
          ctx.lineTo(c[0] * (br - 8), c[1] * br);
          ctx.stroke();
        });
        ctx.restore();
      }

      // Architectural beveled room octagon plate
      var rPlate = isPlayerHere ? 25 : (isHovered ? 24 : 21);
      var cut = 7;
      ctx.beginPath();
      ctx.moveTo(-rPlate + cut, -rPlate);
      ctx.lineTo(rPlate - cut, -rPlate);
      ctx.lineTo(rPlate, -rPlate + cut);
      ctx.lineTo(rPlate, rPlate - cut);
      ctx.lineTo(rPlate - cut, rPlate);
      ctx.lineTo(-rPlate + cut, rPlate);
      ctx.lineTo(-rPlate, rPlate - cut);
      ctx.lineTo(-rPlate, -rPlate + cut);
      ctx.closePath();

      if (fx.blackout) {
        ctx.fillStyle = 'rgba(8, 8, 10, 0.94)';
      } else if (isPlayerHere) {
        ctx.fillStyle = 'rgba(20, 44, 54, 0.92)';
      } else if (isEnemyHere) {
        ctx.fillStyle = 'rgba(56, 16, 16, 0.90)';
      } else if (isAdjacent) {
        ctx.fillStyle = isHovered ? 'rgba(42, 34, 24, 0.92)' : 'rgba(22, 26, 32, 0.88)';
      } else {
        ctx.fillStyle = 'rgba(16, 18, 22, 0.86)';
      }
      ctx.fill();

      ctx.lineWidth = isPlayerHere || isHovered ? 2 : 1.2;
      if (isPlayerHere) {
        ctx.strokeStyle = '#6fd8ea';
      } else if (isEnemyHere) {
        ctx.strokeStyle = '#ef483b';
      } else if (isHovered && isAdjacent) {
        ctx.strokeStyle = '#f2c16b';
      } else if (isAdjacent) {
        ctx.strokeStyle = 'rgba(111, 216, 234, 0.58)';
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(228, 215, 190, 0.65)';
      } else {
        ctx.strokeStyle = 'rgba(180, 174, 162, 0.28)';
      }
      ctx.stroke();

      // Room code inside plate
      ctx.font = '600 9.5px "SFMono-Regular", Consolas, monospace';
      ctx.fillStyle = isPlayerHere ? '#a8f0fc' : 'rgba(228, 215, 190, 0.58)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.code, 0, isPlayerHere ? -9 : 0);

      // Player animated cyan-gold diamond marker
      if (isPlayerHere) {
        var pGlow = 0.5 + 0.5 * Math.sin(t * 3.6);
        ctx.save();
        ctx.translate(0, 6);
        ctx.strokeStyle = 'rgba(111, 216, 234, ' + (0.35 + pGlow * 0.45).toFixed(2) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, 10 + pGlow * 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f4c76c';
        ctx.strokeStyle = '#6fd8ea';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -6.5);
        ctx.lineTo(6.5, 0);
        ctx.lineTo(0, 6.5);
        ctx.lineTo(-6.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Node Name plate below
      ctx.font = '600 11.5px "PingFang SC", "Noto Sans SC", sans-serif';
      var nameW = ctx.measureText(node.name).width + 14;
      ctx.fillStyle = 'rgba(10, 11, 14, 0.84)';
      ctx.fillRect(-nameW / 2, rPlate + 6, nameW, 18);
      ctx.strokeStyle = isPlayerHere ? 'rgba(111, 216, 234, 0.45)' : 'rgba(228, 215, 190, 0.16)';
      ctx.lineWidth = 0.9;
      ctx.strokeRect(-nameW / 2, rPlate + 6, nameW, 18);
      ctx.fillStyle = isPlayerHere ? '#f5ead6' : '#d6cab4';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, 0, rPlate + 15);

      // Small status tag above node if warded / blackout / enemy
      var badges = [];
      if (fx.warded) badges.push({ text: '阵域', color: '#e8ba62' });
      if (fx.marked) badges.push({ text: '空间标', color: '#7be0ce' });
      if (fx.blackout) badges.push({ text: '断电', color: '#9aa4b2' });
      if (isEnemyHere) {
        badges.push({
          text: snap.enemy.stunnedTurns > 0 ? (snap.enemy.name + '·定身') : snap.enemy.name,
          color: '#ff5c4d'
        });
      }
      if (badges.length) {
        var bx = -((badges.length - 1) * 24);
        for (var bi = 0; bi < badges.length; bi++) {
          ctx.font = '600 9.5px "PingFang SC", sans-serif';
          ctx.fillStyle = badges[bi].color;
          ctx.fillText(badges[bi].text, bx + bi * 48, -rPlate - 10);
        }
      }

      // Squad NPC markers orbiting cleanly around top-right/sides of this node
      var npcsHere = [];
      Object.keys(snap.npcMap).forEach(function (nid) {
        if (snap.npcMap[nid] === node.id) npcsHere.push(nid);
      });
      for (var si = 0; si < npcsHere.length; si++) {
        var npcId = npcsHere[si];
        var dossier = cast[npcId] || { name: npcId, accentColor: '#9fb8d4' };
        var ang = -Math.PI * 0.25 + si * 0.72;
        var ox = Math.cos(ang) * (rPlate + 13);
        var oy = Math.sin(ang) * (rPlate + 11);

        ctx.fillStyle = dossier.accentColor || '#8ab4dc';
        ctx.beginPath();
        ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#090a0d';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.font = '600 9.5px "PingFang SC", sans-serif';
        ctx.fillStyle = dossier.accentColor || '#c8d6e5';
        ctx.textAlign = ox >= 0 ? 'left' : 'right';
        ctx.fillText(dossier.name || npcId, ox + (ox >= 0 ? 7 : -7), oy + 1);
      }

      ctx.restore();
    }

    ctx.restore(); // end shake translate

    // Threat / Crisis crimson edge vignette
    var vigStrength = snap.activeCrisis
      ? 0.42 + 0.14 * Math.sin(t * 7.5)
      : Math.max(0, (snap.threat - 38) / 100) * 0.36;
    if (vigStrength > 0.01) {
      var vig = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.24, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(186, 22, 18, ' + vigStrength.toFixed(3) + ')');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    // Subtle HUD corner telemetry caption
    ctx.font = '500 10px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = 'rgba(228, 215, 190, 0.44)';
    ctx.textAlign = 'left';
    ctx.fillText('SECTOR // STATION-00  [点击相邻节点移动]', 12, 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = snap.threat >= 65 ? '#ff6454' : 'rgba(111, 216, 234, 0.65)';
    ctx.fillText('THREAT ' + Math.round(snap.threat) + '%  |  NOISE ' + Math.round(snap.sound), width - 12, 18);

    ctx.restore();
  }

  function loop(now) {
    if (!currentCanvas || !currentCtx) return;
    syncSize();
    if (width > 10 && height > 10) {
      var t = (now - startTime) * 0.001;
      if (currentMode === 'vortex') {
        renderHallVortex(t);
      } else if (currentMode === 'tactical') {
        renderTacticalMap(t);
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  function mountCommon(canvasEl, mode) {
    cleanup();
    if (!canvasEl) return;
    currentCanvas = canvasEl;
    currentCtx = canvasEl.getContext('2d');
    currentMode = mode;
    startTime = performance.now();

    syncSize();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvasEl);
    } else {
      addListener(window, 'resize', syncSize);
    }

    rafId = requestAnimationFrame(loop);
  }

  window.INFINITY.Canvas = {
    mountHallVortex: function (canvasEl) {
      initVortexParticles();
      mountCommon(canvasEl, 'vortex');
      if (!canvasEl) return;

      addListener(window, 'mousemove', function (e) {
        if (!currentCanvas || currentMode !== 'vortex') return;
        var rect = currentCanvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pointer.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        pointer.y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      });
    },

    mountTacticalMap: function (canvasEl, callbacks) {
      initFogWisps();
      mapCallbacks = callbacks || {};
      mountCommon(canvasEl, 'tactical');
      if (!canvasEl) return;

      addListener(canvasEl, 'mousemove', function (e) {
        var rect = canvasEl.getBoundingClientRect();
        var px = e.clientX - rect.left;
        var py = e.clientY - rect.top;
        pointer.px = px;
        pointer.py = py;
        var hit = findNodeAtPoint(px, py, getScenarioNodes());
        var nextHover = hit ? hit.id : null;
        canvasEl.style.cursor = nextHover ? 'pointer' : 'default';
        if (nextHover !== hoveredNodeId) {
          hoveredNodeId = nextHover;
          if (typeof mapCallbacks.onNodeHover === 'function') {
            mapCallbacks.onNodeHover(hoveredNodeId);
          }
        }
      });

      addListener(canvasEl, 'mouseleave', function () {
        if (hoveredNodeId !== null) {
          hoveredNodeId = null;
          canvasEl.style.cursor = 'default';
          if (typeof mapCallbacks.onNodeHover === 'function') {
            mapCallbacks.onNodeHover(null);
          }
        }
      });

      addListener(canvasEl, 'click', function (e) {
        var rect = canvasEl.getBoundingClientRect();
        var px = e.clientX - rect.left;
        var py = e.clientY - rect.top;
        var hit = findNodeAtPoint(px, py, getScenarioNodes());
        if (hit) {
          window.INFINITY.Canvas.triggerPulse(hit.id, '#f2c16b', '');
          if (typeof mapCallbacks.onNodeClick === 'function') {
            mapCallbacks.onNodeClick(hit.id);
          }
        }
      });
    },

    updateTacticalState: function (state) {
      tacticalState = state || null;
    },

    triggerPulse: function (nodeId, color, label) {
      pulses.push({
        nodeId: nodeId,
        color: color || '#6fd8ea',
        label: label || '',
        born: performance.now(),
        duration: 1350
      });
    },

    triggerShake: function (intensity) {
      shakeIntensity = Math.max(shakeIntensity, Number(intensity) || 6);
    },

    destroy: function () {
      cleanup();
    }
  };
})();
