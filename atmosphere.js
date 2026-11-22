(() => {
  'use strict';

  const world = document.querySelector('.world');
  const soundButton = document.getElementById('sound-toggle');
  const menu = window.InfinityMenu;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const painting = world.querySelector('.world-art');
  const surface = document.createElement('canvas');
  surface.className = 'hall-current';
  surface.setAttribute('aria-hidden', 'true');
  painting.append(surface);

  const ctx = surface.getContext('2d');
  const shaderSurface = document.createElement('canvas');
  shaderSurface.className = 'hall-current hall-current--shader';
  shaderSurface.setAttribute('aria-hidden', 'true');
  let activeSurface = surface;
  let renderer;
  let shaderUnavailable = false;
  let image;
  let giltImage;
  let layers = [];
  let bufferContext;
  let silhouette;
  let inward = false;
  let direction = 1;
  let lastFrame = 0;
  let elapsed = 0;
  let timer = 0;
  let lastLight = '';

  function makeCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    return canvas;
  }

  function showSurface(next) {
    if (activeSurface !== next) {
      activeSurface.replaceWith(next);
      activeSurface = next;
    }
  }

  function makeSilhouette(size, sourceTransform, cx, cy) {
    // Trace the edge of the red strands against the ceiling and the floor in
    // the 1208 × 680 Midjourney painting. This matte stays fixed as ink moves.
    const mask = makeCanvas(Math.min(256, size));
    const brush = mask.getContext('2d');
    const ratio = mask.width / size;
    brush.scale(ratio, ratio);
    brush.transform(sourceTransform.a, sourceTransform.b, sourceTransform.c,
      sourceTransform.d, sourceTransform.e, sourceTransform.f);
    brush.translate(-cx, -cy);
    brush.scale(image.naturalWidth / 1208, image.naturalHeight / 680);
    brush.beginPath();
    brush.moveTo(491, 615);
    brush.bezierCurveTo(546, 577, 590, 539, 620, 501);
    brush.bezierCurveTo(695, 412, 759, 393, 834, 365);
    brush.bezierCurveTo(976, 313, 1091, 283, 1220, 249);
    brush.lineTo(1220, 615);
    brush.closePath();
    brush.filter = 'blur(2px)';
    brush.fillStyle = '#fff';
    brush.fill();
    return mask;
  }

  function buildFlow() {
    if (!image?.complete || !image.naturalWidth) return;
    const css = getComputedStyle(painting);
    const number = (property, fallback) => {
      const value = parseFloat(css.getPropertyValue(property));
      return Number.isFinite(value) ? value : fallback;
    };
    const cx = image.naturalWidth * number('--vortex-x', 72) / 100;
    const cy = image.naturalHeight * number('--vortex-y', 44) / 100;
    const sourceWidth = image.naturalWidth * number('--vortex-width', 25) / 100;
    const sourceHeight = sourceWidth / number('--vortex-aspect', 1);
    const size = Math.max(64, Math.min(680, Math.ceil(Math.max(sourceWidth, sourceHeight))));
    direction = number('--vortex-spin', 1);
    const tilt = inward ? number('--vortex-tilt', 0) * Math.PI / 180 : 0;
    const source = makeCanvas(size);
    const brush = source.getContext('2d');
    if (!brush) return;
    brush.translate(size / 2, size / 2);
    brush.scale(size / sourceWidth, size / sourceHeight);
    brush.rotate(-tilt);
    brush.drawImage(image, -cx, -cy);
    let gilt;
    if (inward && giltImage?.naturalWidth) {
      gilt = makeCanvas(size);
      const goldBrush = gilt.getContext('2d');
      goldBrush.setTransform(brush.getTransform());
      goldBrush.drawImage(giltImage, -cx, -cy);
    }
    silhouette = inward ? makeSilhouette(size, brush.getTransform(), cx, cy) : null;
    if (silhouette) {
      // Fill missing source material with strands from the far side of the eye.
      // A reverse-traced particle must never carry a floor line into the vortex.
      brush.setTransform(1, 0, 0, 1, 0, 0);
      brush.globalCompositeOperation = 'destination-in';
      brush.drawImage(silhouette, 0, 0, size, size);
      brush.globalCompositeOperation = 'destination-over';
      brush.setTransform(-1, 0, 0, -1, size, size);
      brush.drawImage(source, 0, 0);
    }

    // File URLs can display images in 2D but cannot upload their pixels as
    // WebGL textures in all browsers. Use the same paint in concentric layers.
    if (inward && !shaderUnavailable && location.protocol !== 'file:') {
      try {
        renderer ??= window.createVortexRenderer?.(shaderSurface);
        if (renderer) {
          renderer.setPainting(source, silhouette, gilt, direction, number('--vortex-core', .13));
          renderer.paint(elapsed);
          showSurface(shaderSurface);
          return;
        }
        shaderUnavailable = true;
      } catch {
        shaderUnavailable = true;
      }
    }

    showSurface(surface);
    if (!ctx || surface.hidden) return;
    surface.width = surface.height = size;
    bufferContext = makeCanvas(size).getContext('2d');
    if (!bufferContext) return;

    layers = [];
    const bands = inward ? 18 : 9;
    for (let i = 0; i < bands; i++) {
      const radius = 1 - i / bands;
      const sample = makeCanvas(Math.ceil(size * radius));
      const band = sample.getContext('2d');
      if (!band) {
        layers = [];
        return;
      }
      const half = sample.width / 2;
      const crop = size * radius;
      const inset = (size - crop) / 2;
      band.drawImage(source, inset, inset, crop, crop, 0, 0, sample.width, sample.height);
      band.globalCompositeOperation = 'destination-in';
      const edge = band.createRadialGradient(half, half, 0, half, half, half);
      edge.addColorStop(Math.max(0, 1 - (inward ? .13 : .21) / radius), '#000');
      edge.addColorStop(1, 'transparent');
      band.fillStyle = edge;
      band.fillRect(0, 0, sample.width, sample.height);
      let glints;
      if (gilt && radius >= .20 && radius <= .74) {
        glints = makeCanvas(sample.width);
        const goldBrush = glints.getContext('2d');
        goldBrush.drawImage(gilt, inset, inset, crop, crop, 0, 0, sample.width, sample.height);
        goldBrush.globalCompositeOperation = 'destination-in';
        goldBrush.fillStyle = edge;
        goldBrush.fillRect(0, 0, sample.width, sample.height);
      }
      layers.push({ sample, glints, flow: .04 + .96 * (1 - radius) ** .72 });
    }
  }

  function drawStream(target, phase) {
    const half = surface.width / 2;
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.clearRect(0, 0, surface.width, surface.height);
    for (const { sample, glints, flow } of layers) {
      const travel = phase * flow;
      const angle = inward ? direction * (2 * Math.PI / 9.6 * elapsed + 4.6 * travel) : .95 * travel;
      const scale = inward ? Math.exp(-.68 * travel) : 1 - .12 * travel;
      const cosine = Math.cos(angle) * scale;
      const sine = Math.sin(angle) * scale;
      target.setTransform(cosine, sine, -sine, cosine, half, half);
      target.drawImage(sample, -sample.width / 2, -sample.height / 2);
      if (glints) {
        const catchLight = .5 + .5 * Math.cos(elapsed * 2 * Math.PI / 9.6 + flow * 18);
        target.globalAlpha = .40 + .58 * catchLight;
        target.drawImage(glints, -sample.width / 2, -sample.height / 2);
        target.globalAlpha = 1;
      }
    }
    target.setTransform(1, 0, 0, 1, 0, 0);
  }

  function paint(now) {
    timer = 0;
    if (lastFrame && now - lastFrame < 1000 / 25) {
      schedule();
      return;
    }
    if (lastFrame) elapsed += Math.min(now - lastFrame, 150) / 1000;
    lastFrame = now;
    const light = (.49 + .33 * Math.sin(elapsed * .69 - .28) +
      .16 * Math.sin(elapsed * .32 + .72)).toFixed(2);
    if (light !== lastLight) {
      document.documentElement.style.setProperty('--hall-light', light);
      lastLight = light;
    }
    if (activeSurface === shaderSurface) {
      renderer.paint(elapsed);
    } else if (layers.length) {
      const phase = elapsed / (inward ? 4.8 : 8) % 1;
      const otherPhase = (phase + .5) % 1;
      const weight = .5 - .5 * Math.cos(2 * Math.PI * phase);
      ctx.globalAlpha = 1;
      drawStream(ctx, otherPhase - .5);
      drawStream(bufferContext, phase - .5);
      ctx.globalAlpha = weight;
      ctx.drawImage(bufferContext.canvas, 0, 0);
      ctx.globalAlpha = 1;
      if (silhouette) {
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(silhouette, 0, 0, surface.width, surface.height);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    schedule();
  }

  function schedule() {
    timer = requestAnimationFrame(paint);
  }

  function syncMotion() {
    world.dataset.motion = menu.preference('motion');
    world.toggleAttribute('data-sleeping', document.hidden);
    if (world.dataset.motion === 'on' && !document.hidden) {
      if (inward && activeSurface === surface && !layers.length) buildFlow();
      if (!timer) schedule();
    } else {
      cancelAnimationFrame(timer);
      timer = 0;
      lastFrame = 0;
    }
  }

  function loadPainting() {
    layers = [];
    bufferContext = null;
    inward = document.documentElement.dataset.edition === 'numinous';
    showSurface(surface);
    ctx?.clearRect(0, 0, surface.width, surface.height);
    const artworkUrl = getComputedStyle(painting).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    image = null;
    if (!artworkUrl) return;
    if (inward && !giltImage) {
      giltImage = new Image();
      giltImage.onload = () => {
        if (inward && world.dataset.motion === 'on' && !document.hidden) buildFlow();
      };
      giltImage.src = 'assets/hall-vortex-gilt.webp';
    }
    const next = new Image();
    image = next;
    next.onload = () => {
      if (image === next && (!inward || (world.dataset.motion === 'on' && !document.hidden))) buildFlow();
    };
    next.src = artworkUrl[1];
  }

  shaderSurface.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    shaderUnavailable = true;
    renderer = null;
    if (activeSurface === shaderSurface) {
      showSurface(surface);
      buildFlow();
    }
  });
  shaderSurface.addEventListener('webglcontextrestored', () => {
    shaderUnavailable = false;
    if (inward && world.dataset.motion === 'on' && !document.hidden) buildFlow();
  });
  surface.addEventListener('contextlost', () => {
    layers = [];
    surface.hidden = true;
  });
  surface.addEventListener('contextrestored', () => {
    surface.hidden = false;
    if (activeSurface === surface) buildFlow();
  });
  document.addEventListener('menu:edition', loadPainting);
  loadPainting();

  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  let audio;
  let output;
  let suspendTimer;
  let userInteracted = false;

  function startResonance() {
    audio = new AudioEngine();
    output = audio.createGain();
    output.gain.value = 0;
    output.connect(audio.destination);

    const sources = audio.createGain();
    sources.connect(output);
    const delay = audio.createDelay(.8);
    delay.delayTime.value = .43;
    const wall = audio.createBiquadFilter();
    wall.type = 'lowpass';
    wall.frequency.value = 370;
    const reflection = audio.createGain();
    reflection.gain.value = .25;
    sources.connect(delay).connect(wall).connect(reflection).connect(output);

    // The bass is almost still. Distant upper resonances arrive and recede
    // at different rates, with a single diffuse return from the far wall.
    for (const [frequency, amplitude, rate] of [[55, .11, 0], [82.2, .12, 0],
      [82.48, .06, 0], [165.1, .033, .051], [248.1, .024, .073], [412, .009, .039]]) {
      const oscillator = audio.createOscillator();
      const level = audio.createGain();
      oscillator.frequency.value = frequency;
      level.gain.value = amplitude;
      if (rate) {
        const swell = audio.createOscillator();
        const depth = audio.createGain();
        swell.frequency.value = rate;
        depth.gain.value = amplitude * .78;
        swell.connect(depth).connect(level.gain);
        swell.start();
      }
      oscillator.connect(level).connect(sources);
      oscillator.start();
    }
  }

  function syncSound() {
    const enabled = menu.preference('sound') === 'on' && Boolean(AudioEngine);
    soundButton.setAttribute('aria-pressed', String(enabled));
    const label = enabled ? '关闭环境音' : '开启环境音';
    soundButton.setAttribute('aria-label', label);
    soundButton.title = label;
    clearTimeout(suspendTimer);

    if (enabled && !document.hidden && userInteracted) {
      if (!audio) {
        try {
          startResonance();
        } catch {
          return;
        }
      }
      if (audio.state !== 'running') audio.resume().catch(() => {});
      output.gain.setTargetAtTime(.12, audio.currentTime, .25);
    } else if (audio) {
      output.gain.setTargetAtTime(0, audio.currentTime, .045);
      if (document.hidden) audio.suspend().catch(() => {});
      else suspendTimer = setTimeout(() => audio.suspend().catch(() => {}), 240);
    }
  }

  function unlockAudio() {
    userInteracted = true;
    if (menu.preference('sound') === 'on' && audio?.state !== 'running') syncSound();
  }

  function syncPreferences() {
    syncMotion();
    syncSound();
  }

  soundButton.addEventListener('click', () => {
    menu.setPreference('sound', menu.preference('sound') === 'on' ? 'off' : 'on');
  });
  document.addEventListener('menu:preferences', syncPreferences);
  document.addEventListener('visibilitychange', syncPreferences);
  document.addEventListener('pointerup', unlockAudio, { capture: true, passive: true });
  document.addEventListener('keydown', unlockAudio, { capture: true });
  document.addEventListener('click', unlockAudio, { capture: true });
  reducedMotion.addEventListener('change', syncMotion);
  syncPreferences();
})();
