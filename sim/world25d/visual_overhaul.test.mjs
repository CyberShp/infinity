import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

function loadClassicScripts(relPaths) {
  const sandbox = {
    Math,
    Number,
    String,
    Object,
    Array,
    Float32Array,
    Uint8Array,
    Int32Array,
    console,
    Set,
    Map,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    setTimeout,
    clearTimeout
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const rel of relPaths) {
    const full = path.resolve(process.cwd(), rel);
    const code = fs.readFileSync(full, 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

const sandbox = loadClassicScripts([
  'sim/data/art_tokens.js',
  'sim/data/asset_manifest.js',
  'sim/data/shop_catalog.js',
  'sim/world25d/station_map.js',
  'sim/world25d/pixel_sprites.js',
  'sim/world25d/skill_archetypes.js',
  'sim/world25d/scene_architect.js',
  'sim/world25d/vfx_studio.js',
  'sim/world25d/combat_feel.js',
  'sim/world25d/engine_25d.js',
  'sim/ui/icon_synth.js'
]);

const { ArtTokens, ASSETS, SHOP_CATALOG, StationMap, PixelSprites, Skills25D, SceneArchitect, VfxStudio, CombatFeel, World25D, IconSynth } = sandbox.INFINITY;

test('VfxStudio defines distinct visual signatures for all 14 skill archetypes', () => {
  const expectedArchetypes = [
    'sword_arc', 'ward_circle', 'emp_blast', 'rail_shot', 'blink_mark',
    'aegis_shield', 'overclock', 'heal_pulse', 'stealth_veil', 'seal_chain',
    'recon_pulse', 'turret_drone', 'decoy_flare', 'berserk_strike'
  ];
  const sigMap = VfxStudio.ARCHETYPE_VFX_SIGNATURE;
  const seenSilhouettes = new Set();
  const seenCombos = new Set();

  for (const id of expectedArchetypes) {
    const sig = sigMap[id];
    assert.ok(sig, `Missing VFX signature for archetype: ${id}`);
    assert.equal(typeof sig.shader, 'string');
    assert.equal(typeof sig.silhouette, 'string');
    assert.equal(typeof sig.ground, 'string');
    assert.equal(seenSilhouettes.has(sig.silhouette), false, `Duplicate silhouette for ${id}: ${sig.silhouette}`);
    seenSilhouettes.add(sig.silhouette);
    const combo = `${sig.shader}|${sig.silhouette}|${sig.ground}`;
    assert.equal(seenCombos.has(combo), false, `Duplicate VFX combo for ${id}`);
    seenCombos.add(combo);
  }
});

test('VfxStudio.resolveVfxColors returns valid distinct palettes across all 12 thematic motifs', () => {
  const motifs = [
    'sword_qi', 'flame_solar', 'thunder_emp', 'frost_cryo',
    'blood_sanguine', 'void_space', 'holy_tao', 'occult_meme',
    'bio_venom', 'cyber_tactical', 'shadow_ninja', 'gravity_kinetic'
  ];
  const primaries = new Set();
  for (const motif of motifs) {
    const res = VfxStudio.resolveVfxColors(null, { motif });
    assert.equal(typeof res.primary, 'number');
    assert.equal(typeof res.secondary, 'number');
    assert.equal(typeof res.core, 'number');
    assert.ok(res.primary >= 0 && res.primary <= 0xffffff);
    primaries.add(res.primary);
  }
  assert.ok(primaries.size >= 10, `Expected varied motif color palettes, got ${primaries.size}`);
});

test('PixelSprites upgraded resolutions: 256x256 tiles/props, 128x128 cast, 160x192 Boss', () => {
  const castIds = ['player', 'yanci', 'lujin', 'xutan', 'shenyan'];
  for (const id of castIds) {
    const dims = PixelSprites.getSpriteDimensions(id);
    assert.equal(dims.width, 128);
    assert.equal(dims.height, 128);
    const canvas = PixelSprites._buildCharCanvas(id, 'idle');
    assert.equal(canvas.width, 128);
    assert.equal(canvas.height, 128);
  }

  const bossDims = PixelSprites.getSpriteDimensions('inspector');
  assert.equal(bossDims.width, 160);
  assert.equal(bossDims.height, 192);
  const bossCanvas = PixelSprites._buildCharCanvas('inspector', 'action');
  assert.equal(bossCanvas.width, 160);
  assert.equal(bossCanvas.height, 192);

  for (const tile of ['floor_slate', 'floor_platform', 'floor_hazard', 'floor_rail', 'wall_concrete', 'wall_neon', 'train_hull']) {
    const c = PixelSprites._buildTileCanvas(tile);
    assert.equal(c.width, 256, `Tile ${tile} should be 256px wide`);
    assert.equal(c.height, 256, `Tile ${tile} should be 256px tall`);
    const n = PixelSprites._buildTileNormalCanvas(tile);
    assert.equal(n.width, 256, `Tile normal map ${tile} should be 256px wide`);
    assert.equal(n.height, 256, `Tile normal map ${tile} should be 256px tall`);
    const r = PixelSprites._buildTileRoughnessCanvas(tile);
    assert.equal(r.width, 256, `Tile roughness map ${tile} should be 256px wide`);
    assert.equal(r.height, 256, `Tile roughness map ${tile} should be 256px tall`);
  }

  for (const id of ['player', 'yanci', 'lujin', 'xutan', 'shenyan']) {
    const cn = PixelSprites._buildCharNormalCanvas(id, 'idle');
    assert.equal(cn.width, 128);
    assert.equal(cn.height, 128);
    const ce = PixelSprites._buildCharEmissiveCanvas(id, 'idle');
    assert.equal(ce.width, 128);
    assert.equal(ce.height, 128);
  }
  const bossN = PixelSprites._buildCharNormalCanvas('inspector', 'action');
  assert.equal(bossN.width, 160);
  assert.equal(bossN.height, 192);
  const bossE = PixelSprites._buildCharEmissiveCanvas('inspector', 'action');
  assert.equal(bossE.width, 160);
  assert.equal(bossE.height, 192);

  assert.equal(typeof PixelSprites.getTileNormalTexture, 'function');
  assert.equal(typeof PixelSprites.getTileRoughnessTexture, 'function');
  assert.equal(typeof PixelSprites.getCharNormalTexture, 'function');
  assert.equal(typeof PixelSprites.getCharEmissiveTexture, 'function');

  for (const prop of ['vfx_slash_crescent', 'vfx_fissure_crack', 'vfx_hex_pattern', 'sigil_bagua', 'console_off', 'clue_glow']) {
    const c = PixelSprites._buildPropCanvas(prop);
    assert.equal(c.width, 256, `Prop ${prop} should be 256px wide`);
    assert.equal(c.height, 256, `Prop ${prop} should be 256px tall`);
  }
});

test('SceneArchitect props stay clear of player spawn and interactables, and StationMap A* stays connected', () => {
  const specs = SceneArchitect.getZonePropSpecs();
  const interactables = StationMap.getInteractables();
  const spawn = StationMap.getZoneCenter('concourse');

  const groundProps = [
    ...specs.turnstiles,
    ...specs.benches,
    ...specs.serverRacks,
    ...specs.cratesAndBarricades
  ];
  assert.ok(groundProps.length >= 24, 'Expected rich ground storytelling props across 4x expanded zones');

  for (const p of groundProps) {
    const dSpawn = Math.hypot(p.x - spawn.x, p.z - spawn.z);
    assert.ok(dSpawn >= 2.0, `Prop at (${p.x},${p.z}) too close to player spawn (dist=${dSpawn.toFixed(2)})`);
    for (const inter of interactables) {
      const dInter = Math.hypot(p.x - inter.x, p.z - inter.z);
      assert.ok(dInter >= 1.35, `Prop at (${p.x},${p.z}) overlaps interactable ${inter.id} at (${inter.x},${inter.z})`);
    }
  }

  // Verify A* connectivity from spawn to key points in all 6 zones
  const zoneIds = ['dispatch', 'corridor', 'substation', 'tunnel', 'platform0'];
  for (const zId of zoneIds) {
    const wp = StationMap.getZoneCenter(zId);
    const pathPts = StationMap.findPath(spawn.x, spawn.z, wp.x, wp.z);
    assert.ok(Array.isArray(pathPts) && pathPts.length > 0, `A* path to ${zId} must remain connected`);
  }
});

test('ArtTokens semantic color guard: no player/zone/motif/tier-S primary collides with threat red', () => {
  const threat = ArtTokens.SEMANTIC.threat;
  const minHueGap = 24;

  // Dash trail, player color, platform0 zone color must stay far from threat red
  assert.ok(ArtTokens.hueDistanceDeg(ArtTokens.SEMANTIC.dashTrail, threat) >= minHueGap, 'dashTrail collides with threat red');
  assert.ok(ArtTokens.hueDistanceDeg(ArtTokens.SEMANTIC.player, threat) >= minHueGap, 'player color collides with threat red');
  assert.ok(ArtTokens.hueDistanceDeg(StationMap.ZONES.platform0.color, threat) >= minHueGap, 'platform0 zone color collides with threat red');

  // S-tier rarity must not be threat red (platinum/low-saturation or distant hue)
  const sRgb = ArtTokens.hexToRgb(ArtTokens.TIERS.S.color);
  const sSat = (Math.max(sRgb.r, sRgb.g, sRgb.b) - Math.min(sRgb.r, sRgb.g, sRgb.b)) / 255;
  assert.ok(sSat < 0.25 || ArtTokens.hueDistanceDeg(ArtTokens.TIERS.S.color, threat) >= minHueGap, 'tier-S must not use threat red');

  // Every motif primary in ArtTokens, Skills25D, and VfxStudio must match and stay >= 24 deg from threat red
  for (const [id, tok] of Object.entries(ArtTokens.MOTIFS)) {
    const dist = ArtTokens.hueDistanceDeg(tok.primary, threat);
    assert.ok(dist >= minHueGap, `Motif ${id} (${tok.primary}) too close to threat red (${dist.toFixed(1)} deg)`);

    const skMotif = Skills25D.VFX_MOTIFS[id];
    assert.ok(skMotif, `Skills25D.VFX_MOTIFS missing ${id}`);
    assert.equal(ArtTokens.hexToInt(skMotif.primary), tok.primaryInt, `Skills25D motif ${id} diverged from ArtTokens`);

    const vfxRes = VfxStudio.resolveVfxColors(null, { motif: id });
    assert.equal(vfxRes.primary, tok.primaryInt, `VfxStudio motif ${id} diverged from ArtTokens`);
  }
});

test('500-item catalog motif distribution & threat-red separation guard', () => {
  assert.equal(SHOP_CATALOG.length, 500);
  const counts = {};
  const threat = ArtTokens.SEMANTIC.threat;
  for (const item of SHOP_CATALOG) {
    const sk = Skills25D.mapItemToSkill(item);
    const vp = sk && sk.vfxProfile;
    assert.ok(vp && vp.motif, `Missing vfxProfile for ${item.id}`);
    counts[vp.motif] = (counts[vp.motif] || 0) + 1;
    const primaryHex = vp.primaryColor || vp.primary;
    assert.ok(primaryHex, `Missing primaryColor on vfxProfile for ${item.id}`);
    const dist = ArtTokens.hueDistanceDeg(primaryHex, threat);
    assert.ok(dist >= 24, `Item ${item.id} (${item.name}) primary ${primaryHex} collides with threat red (${dist.toFixed(1)} deg)`);
  }
  for (const id of Object.keys(ArtTokens.MOTIFS)) {
    const n = counts[id] || 0;
    assert.ok(n >= 8, `Motif ${id} under-represented: ${n} < 8`);
    assert.ok(n <= 125, `Motif ${id} over-represented: ${n} > 125 (25%)`);
  }
});

test('Canonical tile keys align across ArtTokens, PixelSprites, AssetManifest, and gen_comfyui_assets.py', () => {
  const canonical = ArtTokens.CANONICAL_TILES;
  assert.equal(canonical.length, 7);
  for (const key of canonical) {
    const c = PixelSprites._buildTileCanvas(key);
    assert.equal(c.width, 256, `Canonical tile ${key} failed to build 256px canvas`);
  }
  // Manifest registered tile overrides (if any) must be a subset of canonical tiles
  for (const key of Object.keys(ASSETS.tiles || {})) {
    assert.ok(canonical.includes(key), `AssetManifest tile key "${key}" is not in CANONICAL_TILES`);
  }
  // gen_comfyui_assets.py must cover all 7 canonical tiles
  const pySrc = fs.readFileSync(path.resolve(process.cwd(), 'tools/gen_comfyui_assets.py'), 'utf8');
  for (const key of canonical) {
    assert.ok(pySrc.includes(`"${key}"`), `gen_comfyui_assets.py missing prompt for canonical tile "${key}"`);
  }
});

test('Player sprite supports weaponStyle switching and ArtTokens defines VFX budgets', () => {
  for (const style of ['sword', 'cyber', 'occult', 'tactical']) {
    const c = PixelSprites._buildCharCanvas('player', 'idle', style);
    assert.equal(c.width, 128);
    assert.equal(c.height, 128);
  }
  assert.ok(ArtTokens.BUDGETS && ArtTokens.BUDGETS.maxActiveVfx >= 24 && ArtTokens.BUDGETS.maxActiveVfx <= 128);
});

test('PostFX shader includes linearToSRGB output encoding guard', () => {
  const engSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/world25d/engine_25d.js'), 'utf8');
  assert.ok(/linearToSRGB/.test(engSrc), 'engine_25d.js PostFX shader must encode linear RT output to sRGB');
  assert.ok(/disposeOwned/.test(engSrc), 'engine_25d.js must protect shared VFX resources via disposeOwned');
});

test('P1 CombatFeel covers all 14 archetypes with instant-parry split and clamped shake budget', () => {
  assert.ok(CombatFeel && CombatFeel.ARCHETYPE_FEEL, 'CombatFeel.ARCHETYPE_FEEL must be defined');
  const instantIds = ['sword_arc', 'blink_mark', 'aegis_shield', 'overclock', 'heal_pulse', 'stealth_veil'];
  const aimIds = ['ward_circle', 'emp_blast', 'rail_shot', 'seal_chain', 'recon_pulse', 'turret_drone', 'decoy_flare', 'berserk_strike'];
  for (const id of instantIds) {
    const cfg = CombatFeel.ARCHETYPE_FEEL[id];
    assert.ok(cfg, `Missing CombatFeel entry for ${id}`);
    assert.equal(cfg.previewMode, 'instant', `${id} must stay instant to preserve parry/escape responsiveness`);
  }
  for (const id of aimIds) {
    const cfg = CombatFeel.ARCHETYPE_FEEL[id];
    assert.ok(cfg, `Missing CombatFeel entry for ${id}`);
    assert.ok(cfg.previewMode === 'aim_circle' || cfg.previewMode === 'aim_line', `${id} should use aim_circle or aim_line`);
  }
  const budget = CombatFeel.createShakeBudget();
  for (let i = 0; i < 20; i++) budget.add(0.4, 24);
  const sample = budget.step(0.016);
  const mag = Math.hypot(sample.x || 0, sample.y || 0);
  assert.ok(mag <= 0.6, `Shake budget failed to clamp stacked impulses (got ${mag.toFixed(3)})`);
});

test('P1 VfxStudio motif secondary geometry, 6 zone landmarks, IconSynth, and VFX gallery exist', () => {
  assert.equal(typeof VfxStudio.spawnMotifSecondaryBurst, 'function');
  assert.equal(typeof VfxStudio.spawnResonanceRimPulse, 'function');
  for (const motif of Object.keys(ArtTokens.MOTIFS)) {
    assert.ok(VfxStudio.MOTIF_SECONDARY_SHAPES && VfxStudio.MOTIF_SECONDARY_SHAPES[motif], `Missing secondary shape for motif ${motif}`);
  }

  const specs = SceneArchitect.getZonePropSpecs();
  assert.ok(Array.isArray(specs.landmarks) && specs.landmarks.length === 6, 'Expected 6 distinct zone landmarks');
  const landmarkZones = new Set(specs.landmarks.map(l => l.zoneId || l.zone || StationMap.getZoneAt(l.x, l.z)));
  assert.equal(landmarkZones.size, 6, 'Each of the 6 station zones must have its own landmark');

  // IconSynth generates crisp SVG for every catalog item without falling back to raw emoji
  for (let i = 0; i < SHOP_CATALOG.length; i += 25) {
    const html = IconSynth.renderItemIcon(SHOP_CATALOG[i]);
    assert.ok(html.startsWith('<svg ') && html.endsWith('</svg>'), `IconSynth failed for ${SHOP_CATALOG[i].id}`);
  }
  assert.ok(fs.existsSync(path.resolve(process.cwd(), 'sim/world25d/vfx_gallery.html')), 'vfx_gallery.html sandbox must exist');
  assert.equal(CombatFeel.ARCHETYPE_FEEL.seal_chain.previewMode, 'aim_circle', 'seal_chain preview must match its radial lock-on range');
  assert.equal(CombatFeel.ARCHETYPE_FEEL.seal_chain.previewSelfOrigin, true, 'seal_chain preview must stay centered on player');
  const c046 = SHOP_CATALOG.find(it => it.id === 'C046');
  const c046Skill = c046 ? Skills25D.mapItemToSkill(c046) : { radius: 8.0 };
  const effectiveRange = Math.max(CombatFeel.ARCHETYPE_FEEL.seal_chain.previewMinRadius || 10.5, Number(c046Skill.radius) || 0);
  assert.ok(effectiveRange < 12.0, `12m target must lie outside seal_chain effective range (${effectiveRange}m)`);
});

test('P1 input guard: pausing input cancels aim preview and keyup checks isTypingInDom before casting', () => {
  const engSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/world25d/engine_25d.js'), 'utf8');
  const pauseBlock = engSrc.match(/EngineSession\.prototype\.setInputPaused[\s\S]*?\n  \};/);
  assert.ok(pauseBlock && /cancelAimPreview\(\)/.test(pauseBlock[0]), 'setInputPaused(true) must call cancelAimPreview()');
  const keyupBlock = engSrc.match(/this\.addListener\(global,\s*'keyup'[\s\S]*?\n    \}\);/);
  assert.ok(keyupBlock && /isTypingInDom\(\)/.test(keyupBlock[0]), 'keyup aim release must check isTypingInDom() before castSlot()');
});

test('P2 AssetManifest contract: 6 Style-1 sprite sheets and 6 Hades VFX flipbooks resolve cleanly', () => {
  const expectedSprites = ['player', 'yanci', 'lujin', 'xutan', 'shenyan', 'inspector'];
  const expectedFlipbooks = ['hades_cyan', 'hades_flame', 'hades_emp', 'hades_tao_ground', 'hades_occult_chain', 'hades_heal_aegis'];

  assert.equal(typeof ASSETS.getSpriteSheetUrls, 'function');
  assert.equal(typeof ASSETS.getVfxFlipbookUrl, 'function');

  for (const id of expectedSprites) {
    const urls = ASSETS.getSpriteSheetUrls(id);
    assert.ok(urls, `Missing sprite sheet entry for ${id}`);
    assert.ok(urls.sheet.endsWith(`assets/sprites/${id}_sheet.webp`), `Bad sheet path for ${id}: ${urls.sheet}`);
    assert.ok(urls.normal.endsWith(`assets/sprites/${id}_normal.webp`), `Bad normal path for ${id}: ${urls.normal}`);
    assert.ok(urls.emissive.endsWith(`assets/sprites/${id}_emissive.webp`), `Bad emissive path for ${id}: ${urls.emissive}`);
  }
  assert.equal(ASSETS.getSpriteSheetUrls('nonexistent'), null);

  for (const name of expectedFlipbooks) {
    const url = ASSETS.getVfxFlipbookUrl(name);
    assert.ok(url && url.endsWith(`assets/vfx/${name}.webp`), `Bad flipbook path for ${name}: ${url}`);
    const fbCanvas = PixelSprites._buildFlipbookCanvas(name);
    assert.equal(fbCanvas.width, 512, `Procedural flipbook fallback ${name} must be 512x512`);
    assert.equal(fbCanvas.height, 512, `Procedural flipbook fallback ${name} must be 512x512`);
  }
  assert.equal(typeof PixelSprites.getVfxFlipbookTexture, 'function');
  assert.equal(typeof PixelSprites.reloadExternalSprites, 'function');
  assert.equal(typeof PixelSprites.reloadExternalVfx, 'function');
});

test('P2 PostFX shader defines uImpactInvert after linearToSRGB and exposes triggerImpactFrame', () => {
  const engSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/world25d/engine_25d.js'), 'utf8');
  assert.ok(/uniform float uImpactInvert;/.test(engSrc), 'PostFX fragment shader must declare uniform float uImpactInvert');
  assert.ok(/uImpactInvert:\s*\{\s*value:\s*0\s*\}/.test(engSrc), 'PostFX quadMat must initialize uImpactInvert uniform');
  assert.ok(/EngineSession\.prototype\.triggerImpactFrame/.test(engSrc), 'EngineSession must expose triggerImpactFrame()');
  const srgbIdx = engSrc.indexOf('col = linearToSRGB(col);');
  const impactIdx = engSrc.indexOf('if (uImpactInvert > 0.01)');
  assert.ok(srgbIdx > 0 && impactIdx > srgbIdx, 'uImpactInvert must execute after linearToSRGB(col)');
});

test('P2 VfxStudio.spawnFlipbookVfx enforces dual-layer ink/bright rendering and ground vs 20-32 deg tilted slash planes', () => {
  assert.equal(typeof VfxStudio.spawnFlipbookVfx, 'function');
  assert.ok(VfxStudio.FLIPBOOK_PRESETS, 'VfxStudio.FLIPBOOK_PRESETS must exist');
  for (const name of ['hades_cyan', 'hades_flame', 'hades_emp', 'hades_tao_ground', 'hades_occult_chain', 'hades_heal_aegis']) {
    assert.ok(VfxStudio.FLIPBOOK_PRESETS[name], `Missing flipbook preset: ${name}`);
  }

  // Minimal mock Three.js runtime to verify actual 3D spatial hierarchy & dual-layer meshes
  function Vec3(x = 0, y = 0, z = 0) {
    return { x, y, z, set(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; } };
  }
  const MockTHREE = {
    DoubleSide: 2,
    NormalBlending: 1,
    AdditiveBlending: 2,
    Color: class {
      constructor(hex) { this.hex = hex; }
      convertSRGBToLinear() { return this; }
    },
    PlaneGeometry: class {
      constructor(w, h) { this.w = w; this.h = h; this.userData = {}; }
      rotateX(a) { this.rotX = a; }
      dispose() {}
    },
    ShaderMaterial: class {
      constructor(cfg) { Object.assign(this, cfg); }
      dispose() {}
    },
    Mesh: class {
      constructor(geo, mat) {
        this.geometry = geo;
        this.material = mat;
        this.position = Vec3();
        this.rotation = Vec3();
        this.scale = Vec3(1, 1, 1);
      }
    },
    Group: class {
      constructor() {
        this.children = [];
        this.position = Vec3();
        this.rotation = Vec3();
        this.scale = Vec3(1, 1, 1);
      }
      add(...objs) { this.children.push(...objs); }
    }
  };
  const session = {
    THREE: MockTHREE,
    mapApi: StationMap,
    scene: { objects: [], add(o) { this.objects.push(o); }, remove() {} },
    vfxList: [],
    trackGeo(g) { return g; }
  };

  const railMinX = StationMap.RAIL_MIN_X || 104;
  const platCenter = StationMap.getZoneCenter('platform0');
  const groundFx = VfxStudio.spawnFlipbookVfx(session, {
    name: 'hades_tao_ground',
    x: railMinX - 0.4,
    z: platCenter.z,
    radius: 2.8,
    layer: 'ground'
  });
  assert.ok(groundFx, 'Ground flipbook should spawn');
  assert.equal(groundFx.layer, 'ground');
  assert.equal(groundFx.y, 0.05, 'Ground flipbook must be strictly flattened at y = 0.05');
  assert.equal(groundFx.tiltDeg, 0, 'Ground flipbook must have 0 deg tilt');
  assert.equal(groundFx.group.children.length, 2, 'Flipbook must render dual-layer (ink backing + bright cel)');
  assert.equal(groundFx.inkMesh.material.blending, MockTHREE.NormalBlending);
  assert.equal(groundFx.brightMesh.material.blending, MockTHREE.AdditiveBlending);
  assert.ok(groundFx.group.position.x + groundFx.radius <= railMinX + 0.05, `Ground flipbook must clamp clear of rail_trench (x >= ${railMinX})`);

  const slashFx = VfxStudio.spawnFlipbookVfx(session, {
    name: 'hades_cyan',
    x: 12.0,
    z: 10.0,
    angle: 0.4,
    radius: 3.2,
    layer: 'slash',
    tiltDeg: 26
  });
  assert.ok(slashFx, 'Slash flipbook should spawn');
  assert.equal(slashFx.layer, 'slash');
  assert.ok(slashFx.tiltDeg >= 20 && slashFx.tiltDeg <= 32, `Slash tilt must stay in 20-32 deg (got ${slashFx.tiltDeg})`);
  assert.equal(slashFx.group.children.length, 2, 'Slash flipbook must render dual-layer (ink backing + bright cel)');
  assert.ok(session.vfxList.length === 2, 'Both flipbook animations must be scheduled on session.vfxList');
  session.vfxList[0].update(0.15);
  session.vfxList[1].update(0.15);
  assert.ok(slashFx.brightMesh.material.uniforms.uFrame.value >= 1, 'Flipbook uFrame must advance during update()');
});

test('P2 Art Bible Iron Rule 1: 2.5D golden actor/Boss world heights & viewport coverage ratios', () => {
  const dims = World25D.ACTOR_DIMENSIONS;
  const cam = World25D.CAMERA_25D_SPEC;
  assert.ok(dims && cam, 'World25D must expose ACTOR_DIMENSIONS and CAMERA_25D_SPEC');

  assert.ok(dims.player.height >= 1.70 && dims.player.height <= 1.85, `Player height ${dims.player.height}m outside 1.70-1.85m`);
  assert.ok(dims.squad.height >= 1.70 && dims.squad.height <= 1.85, `Squad height ${dims.squad.height}m outside 1.70-1.85m`);
  assert.ok(dims.inspector.height >= 2.60 && dims.inspector.height <= 2.85, `Inspector height ${dims.inspector.height}m outside 2.60-2.85m`);

  const bossRatio = dims.inspector.height / dims.player.height;
  assert.ok(bossRatio >= 1.45 && bossRatio <= 1.65, `Inspector/Player height ratio ${bossRatio.toFixed(2)}x outside 1.45x-1.65x`);

  // Verify camera pitch (35-45 deg) and projected viewport height coverage (11-15% player, 18-23% Boss)
  const dy = cam.offsetY - cam.lookAtY;
  const dz = cam.offsetZ;
  const pitchRad = Math.atan2(dy, dz);
  const pitchDeg = (pitchRad * 180) / Math.PI;
  assert.ok(pitchDeg >= 35 && pitchDeg <= 45, `Camera pitch ${pitchDeg.toFixed(1)} deg outside 35-45 deg`);

  const dist = Math.hypot(dy, dz);
  const viewHeight = 2 * dist * Math.tan(((cam.fov * 0.5) * Math.PI) / 180);
  const projFactor = Math.cos(pitchRad - cam.spriteTiltRad);
  const playerVp = (dims.player.height * projFactor) / viewHeight;
  const bossVp = (dims.inspector.height * projFactor) / viewHeight;
  assert.ok(playerVp >= 0.11 && playerVp <= 0.15, `Player viewport share ${(playerVp * 100).toFixed(1)}% outside 11%-15%`);
  assert.ok(bossVp >= 0.18 && bossVp <= 0.23, `Inspector viewport share ${(bossVp * 100).toFixed(1)}% outside 18%-23%`);
});

test('P2 Art Bible Iron Rule 4: swept knockback blocks rail_trench (grid=4) & walls, and clamps ground decals', () => {
  assert.equal(typeof World25D.resolveSweptMovement, 'function');
  const grid = StationMap.getGrid();

  const railMinX = StationMap.RAIL_MIN_X || 104;
  const trainX = StationMap.TRAIN_X || 106.5;
  const platZ = StationMap.getZoneCenter('platform0').z;

  // 1. Huge knockback near Platform 0 yellow line toward sunken rail_trench (grid === 4)
  const railPush = World25D.resolveSweptMovement(StationMap, railMinX - 0.8, platZ, railMinX + 3.8, platZ, 0.56);
  assert.equal(railPush.hit, true, 'Knockback toward rail_trench must register collision');
  assert.equal(railPush.hitRailEdge, true, 'Knockback toward rail_trench must flag hitRailEdge');
  assert.ok(railPush.x < railMinX, `Actor crossed into rail_trench (x=${railPush.x.toFixed(2)})`);
  assert.equal(StationMap.isWalkable(railPush.x, railPush.z), true, 'Final position must stay strictly walkable');
  assert.notEqual(grid[Math.floor(railPush.z)][Math.floor(railPush.x)], 4, 'Actor must never land on grid===4 rail_trench');

  // 2. High-speed knockback into Corridor cover pillar (x=94..95, z=62, grid === 1)
  const wallPush = World25D.resolveSweptMovement(StationMap, 93.3, 62.5, 97.4, 62.5, 0.42);
  assert.equal(wallPush.hit, true, 'Knockback into pillar must register collision');
  assert.equal(wallPush.hitWall, true, 'Knockback into pillar must flag hitWall for rebound/debris');
  assert.ok(wallPush.x < 94.0, `Actor tunneled through pillar (x=${wallPush.x.toFixed(2)})`);
  assert.equal(StationMap.isWalkable(wallPush.x, wallPush.z), true);

  // 3. Ground decal clamping near Platform 0 edge must never overhang into rail_trench
  const decal = VfxStudio.clampGroundDecal(StationMap, railMinX - 0.3, platZ, 2.4);
  assert.equal(decal.valid, true, 'Walkable platform edge decal should clamp validly');
  assert.equal(StationMap.isWalkable(decal.x, decal.z), true, 'Clamped decal center must stay walkable');
  assert.ok(decal.x + decal.radius <= railMinX + 0.05, `Ground decal overhangs rail edge (x=${decal.x.toFixed(2)}, r=${decal.radius.toFixed(2)})`);

  // 4. Ground decal deep inside non-walkable rail_trench / out-of-bounds must report valid: false and never push off-map
  const offRail = VfxStudio.clampGroundDecal(StationMap, trainX, platZ, 4.8);
  assert.equal(offRail.valid, false, 'Decal deep inside rail_trench must return valid: false');
  const offWall = VfxStudio.clampGroundDecal(StationMap, 0.2, 0.2, 3.0);
  assert.equal(offWall.valid, false, 'Decal inside outer wall must return valid: false');
});

test('P2 WebGL2 immutable texture guard: external sprite/flipbook hot-swap never mutates canvas width/height and covers all player weaponStyles', () => {
  const loadedImages = [];
  const drawLog = [];
  const mockSandbox = {
    Math, Number, String, Object, Array, Float32Array, Uint8Array, Int32Array,
    console, Set, Map, RegExp, parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout,
    document: {
      createElement(tag) {
        if (tag !== 'canvas') return {};
        const c = {
          width: 0,
          height: 0,
          _draws: 0,
          getContext() {
            return {
              imageSmoothingEnabled: true,
              clearRect() {},
              fillRect() {},
              strokeRect() {},
              beginPath() {},
              closePath() {},
              moveTo() {},
              lineTo() {},
              arc() {},
              ellipse() {},
              quadraticCurveTo() {},
              fill() {},
              stroke() {},
              save() {},
              restore() {},
              translate() {},
              rotate() {},
              scale() {},
              clip() {},
              rect() {},
              createLinearGradient() { return { addColorStop() {} }; },
              createRadialGradient() { return { addColorStop() {} }; },
              drawImage(src, ...args) {
                c._draws += 1;
                drawLog.push({ target: c, src, args });
              }
            };
          }
        };
        return c;
      }
    },
    THREE: {
      LinearFilter: 1006,
      NearestFilter: 1003,
      LinearMipmapLinearFilter: 1008,
      NearestMipmapLinearFilter: 1007,
      RepeatWrapping: 1000,
      ClampToEdgeWrapping: 1001,
      sRGBEncoding: 3001,
      CanvasTexture: class {
        constructor(image) {
          this.image = image;
          this.needsUpdate = false;
        }
      }
    },
    Image: class MockImage {
      constructor() {
        this.naturalWidth = 0;
        this.naturalHeight = 0;
        loadedImages.push(this);
      }
      set src(url) {
        this._src = url;
        if (url.includes('inspector_')) {
          this.naturalWidth = 1280;
          this.naturalHeight = 384;
        } else if (url.includes('assets/vfx/')) {
          this.naturalWidth = 1024;
          this.naturalHeight = 1024;
        } else if (url.includes('assets/tiles/')) {
          this.naturalWidth = 512;
          this.naturalHeight = 512;
        } else {
          this.naturalWidth = 1024;
          this.naturalHeight = 256;
        }
      }
      get src() { return this._src; }
    }
  };
  mockSandbox.window = mockSandbox;
  mockSandbox.globalThis = mockSandbox;
  vm.createContext(mockSandbox);
  for (const rel of ['sim/data/art_tokens.js', 'sim/data/asset_manifest.js', 'sim/world25d/pixel_sprites.js']) {
    const code = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    vm.runInContext(code, mockSandbox, { filename: rel });
  }

  const PS = mockSandbox.INFINITY.PixelSprites;
  const playerSwordTex = PS.getCharTexture('player', 'idle', 'sword');
  const playerTacticalTex = PS.getCharTexture('player', 'idle', 'tactical');
  const bossTex = PS.getCharTexture('inspector', 'idle');
  const fbTex = PS.getVfxFlipbookTexture('hades_cyan');
  const tileSlateTex = PS.getTileTexture('floor_slate', 4, 4);

  // Lock initial WebGL2 texStorage2D dimensions upfront
  assert.equal(playerSwordTex.image.width, 256);
  assert.equal(playerSwordTex.image.height, 256);
  assert.equal(playerTacticalTex.image.width, 256);
  assert.equal(playerTacticalTex.image.height, 256);
  assert.equal(bossTex.image.width, 320);
  assert.equal(bossTex.image.height, 384);
  assert.equal(fbTex.image.width, 1024);
  assert.equal(fbTex.image.height, 1024);
  assert.equal(tileSlateTex.image.width, 512);
  assert.equal(tileSlateTex.image.height, 512);

  const tacticalDrawsBefore = playerTacticalTex.image._draws;
  const swordDrawsBefore = playerSwordTex.image._draws;
  const bossDrawsBefore = bossTex.image._draws;
  const fbDrawsBefore = fbTex.image._draws;
  const tileDrawsBefore = tileSlateTex.image._draws;

  // Simulate async WebP image arrivals after first WebGL frame render
  for (const img of loadedImages) {
    if (typeof img.onload === 'function') img.onload();
  }

  // Dimensions MUST stay strictly immutable after external WebP hot-swap!
  assert.equal(playerSwordTex.image.width, 256);
  assert.equal(playerSwordTex.image.height, 256);
  assert.equal(playerTacticalTex.image.width, 256);
  assert.equal(playerTacticalTex.image.height, 256);
  assert.equal(bossTex.image.width, 320);
  assert.equal(bossTex.image.height, 384);
  assert.equal(fbTex.image.width, 1024);
  assert.equal(fbTex.image.height, 1024);
  assert.equal(tileSlateTex.image.width, 512);
  assert.equal(tileSlateTex.image.height, 512);

  // Hot-swap must apply Style-1 external sheet to both sword & default-spawn tactical player, inspector, flipbook, and tile
  assert.ok(playerSwordTex.image._draws > swordDrawsBefore, 'player sword sprite must hot-swap external sheet');
  assert.ok(playerTacticalTex.image._draws > tacticalDrawsBefore, 'player default tactical sprite must hot-swap external Style-1 sheet');
  assert.ok(bossTex.image._draws > bossDrawsBefore, 'inspector sprite must hot-swap external sheet');
  assert.ok(fbTex.image._draws > fbDrawsBefore, 'flipbook must hot-swap external WebP');
  assert.ok(tileSlateTex.image._draws > tileDrawsBefore, 'Style-1 external tile must hot-swap onto immutable 512x512 canvas');
});

test('Scene-A Vertical Slice contract: painted concourse plates, 4x4 16f flipbooks, combat key poses, ink trail & director timeline', () => {
  // 1. AssetManifest registers all Scene-A painted plates, props, combat poses, and 16-frame flipbooks
  const sceneKeys = [
    'concourse_floor', 'concourse_floor_normal', 'concourse_floor_roughness',
    'concourse_wall', 'concourse_wall_normal',
    'prop_turnstile', 'prop_bench', 'prop_clock_totem', 'prop_clutter'
  ];
  assert.equal(typeof ASSETS.getSceneAssetUrl, 'function');
  for (const key of sceneKeys) {
    const url = ASSETS.getSceneAssetUrl(key);
    assert.ok(url && url.includes('assets/scenes/'), `Missing Scene-A asset URL for ${key}`);
    const diskPath = path.resolve(process.cwd(), 'sim', url.replace(/^sim\//, ''));
    assert.ok(fs.existsSync(diskPath), `Scene-A asset missing on disk: ${diskPath}`);
  }

  const combatUrls = ASSETS.getCombatPoseSheetUrls('player');
  assert.ok(combatUrls && combatUrls.sheet && combatUrls.normal && combatUrls.emissive, 'Player combat pose sheet URLs required');
  for (const ch of ['sheet', 'normal', 'emissive']) {
    const diskPath = path.resolve(process.cwd(), 'sim', combatUrls[ch].replace(/^sim\//, ''));
    assert.ok(fs.existsSync(diskPath), `Player combat pose asset missing on disk: ${diskPath}`);
  }

  for (const fb of ['hades_cyan_16f', 'hades_crimson_boss_16f']) {
    const preset = VfxStudio.FLIPBOOK_PRESETS[fb];
    assert.ok(preset && preset.cols === 4 && preset.rows === 4, `${fb} must be 4x4 (16-frame) preset`);
    const url = ASSETS.getVfxFlipbookUrl(fb);
    assert.ok(url, `Missing manifest URL for ${fb}`);
    const diskPath = path.resolve(process.cwd(), 'sim', url.replace(/^sim\//, ''));
    assert.ok(fs.existsSync(diskPath), `16-frame flipbook missing on disk: ${diskPath}`);
  }

  // 2. Director timeline zooms cleanly into combat & cut-in beats and recovers
  assert.equal(typeof CombatFeel.createDirectorTimeline, 'function');
  const dir = CombatFeel.createDirectorTimeline();
  dir.triggerBeat({ zoom: 0.58, holdSec: 0.4, letterbox: 0.07, chromatic: 0.6, inkEdge: 0.7 });
  const beatState = dir.step(0.12, true);
  assert.ok(beatState.zoom < 0.85, `Expected camera cut-in zoom < 0.85, got ${beatState.zoom}`);
  assert.ok(beatState.letterbox > 0.02, `Expected letterbox > 0.02 during beat, got ${beatState.letterbox}`);

  // 3. Ink trail, ink step puff & ambient dynamics APIs exist
  assert.equal(typeof VfxStudio.spawnInkBrushTrail, 'function');
  assert.equal(typeof VfxStudio.spawnInkStepPuff, 'function');
  assert.equal(typeof SceneArchitect.updateAmbientDynamics, 'function');
  assert.equal(CombatFeel.getFloatingTextStyle('onomatopoeia').tier, 'onomatopoeia');
});

test('P3-A Style-1 heavy-ink scene unification: bespoke WebP tiles on disk, walkable crack/puddle decals, EdgesGeometry outlines, and willReadFrequently guard', () => {
  const expectedTiles = ['floor_slate', 'floor_platform', 'wall_concrete'];
  for (const key of expectedTiles) {
    const relUrl = ASSETS.tiles && ASSETS.tiles[key];
    assert.ok(relUrl && relUrl.endsWith(`assets/tiles/${key}.webp`), `Missing bespoke WebP tile entry for ${key}: ${relUrl}`);
    const diskPath = path.resolve(process.cwd(), 'sim', relUrl);
    assert.ok(fs.existsSync(diskPath), `Bespoke tile missing on disk: ${diskPath}`);
  }

  // All puddles and crack decals must stay strictly on walkable tiles and clear of rail_trench (grid === 4)
  const specs = SceneArchitect.getZonePropSpecs();
  const grid = StationMap.getGrid();
  assert.ok(Array.isArray(specs.puddles) && specs.puddles.length >= 6, 'Expected Style-1 damp puddles across station zones');
  assert.ok(Array.isArray(specs.crackDecals) && specs.crackDecals.length >= 10, 'Expected Style-1 floor fracture crack decals');

  for (const p of specs.puddles) {
    assert.equal(StationMap.isWalkable(p.x, p.z), true, `Puddle at (${p.x},${p.z}) must sit on walkable floor`);
    assert.notEqual(grid[Math.floor(p.z)][Math.floor(p.x)], 4, `Puddle at (${p.x},${p.z}) must not enter rail_trench`);
  }
  for (const c of specs.crackDecals) {
    assert.equal(StationMap.isWalkable(c.x, c.z), true, `Crack decal at (${c.x},${c.z}) must sit on walkable floor`);
    assert.notEqual(grid[Math.floor(c.z)][Math.floor(c.x)], 4, `Crack decal at (${c.x},${c.z}) must not enter rail_trench`);
  }

  // Architectural heavy-ink silhouette outlines and Canvas2D readback optimization guards
  const archSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/world25d/scene_architect.js'), 'utf8');
  assert.ok(/EdgesGeometry/.test(archSrc) && /addInkOutline/.test(archSrc), 'scene_architect.js must apply EdgesGeometry ink silhouettes');
  assert.ok(/createPillarAoTexture/.test(archSrc), 'scene_architect.js must ground cover pillars with base AO shadows');

  const spriteSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/world25d/pixel_sprites.js'), 'utf8');
  assert.ok(/willReadFrequently:\s*true/.test(spriteSrc), 'pixel_sprites.js must pass willReadFrequently: true on readback canvases');
});

test('4x Station Zero mega-scale expansion (224x152 = 34,048 m²): dynamic props/cover generation, A* reachability, and full 2.5D camera scroll bounds', () => {
  const area = StationMap.GRID_W * StationMap.GRID_H;
  assert.equal(StationMap.GRID_W, 224);
  assert.equal(StationMap.GRID_H, 152);
  assert.equal(area, 34048, `Expected exact 4x area of 112x76 (34048 m^2), got ${area}`);
  assert.equal(StationMap.PLATFORM_START_X, 168);
  assert.equal(StationMap.HAZARD_X, 207);
  assert.equal(StationMap.RAIL_MIN_X, 208);
  assert.equal(StationMap.RAIL_MAX_X, 219);
  assert.equal(StationMap.TRAIN_X, 213.5);

  const lights = StationMap.getLights();
  assert.ok(lights.length >= 64, `Expected >= 64 atmospheric zone lights for 224x152 station, got ${lights.length}`);

  // Dynamic procedural scene & cover generation in scene_architect.js
  assert.equal(typeof SceneArchitect.generateDynamicZoneProps, 'function');
  const dynSpecs = SceneArchitect.generateDynamicZoneProps(StationMap);
  assert.equal(dynSpecs.meta && dynSpecs.meta.dynamicGenerated, true);
  assert.equal(dynSpecs.meta.area, 34048);

  const totalGroundProps =
    (dynSpecs.turnstiles?.length || 0) +
    (dynSpecs.benches?.length || 0) +
    (dynSpecs.serverRacks?.length || 0) +
    (dynSpecs.cratesAndBarricades?.length || 0) +
    (dynSpecs.bollards?.length || 0);
  assert.ok(totalGroundProps >= 90, `Expected >= 90 dynamically generated environmental props, got ${totalGroundProps}`);
  assert.ok(dynSpecs.puddles.length >= 45, `Expected >= 45 dynamic puddles across 224x152 zones, got ${dynSpecs.puddles.length}`);
  assert.ok(dynSpecs.crackDecals.length >= 50, `Expected >= 50 dynamic crack decals across 224x152 zones, got ${dynSpecs.crackDecals.length}`);

  // Verify waist-high tactical cover barricades exist across the expanded station
  const coverRuns = StationMap.getWalls().filter(w => w.cover || (Number(w.h) > 0 && Number(w.h) <= 1.5));
  assert.ok(coverRuns.length >= 35, `Expected >= 35 waist-high tactical cover barricades, got ${coverRuns.length}`);

  // Verify every dynamically placed ground prop sits on walkable floor and clear of rail_trench
  const grid = StationMap.getGrid();
  for (const listName of ['turnstiles', 'benches', 'serverRacks', 'cratesAndBarricades', 'bollards', 'landmarks']) {
    for (const item of dynSpecs[listName] || []) {
      assert.equal(StationMap.isWalkable(item.x, item.z), true, `Dynamic ${listName} prop at (${item.x},${item.z}) must be walkable`);
      assert.notEqual(grid[Math.floor(item.z)][Math.floor(item.x)], 4, `Dynamic ${listName} prop at (${item.x},${item.z}) must not enter rail_trench`);
    }
  }

  // Verify spawn & every interactable across all 6 zones is walkable and A*-reachable
  const spawn = StationMap.getZoneCenter('concourse');
  assert.equal(StationMap.isWalkable(spawn.x, spawn.z), true, 'Spawn center must be walkable');
  for (const inter of StationMap.getInteractables()) {
    assert.equal(StationMap.isWalkable(inter.x, inter.z), true, `Interactable ${inter.id} at (${inter.x},${inter.z}) must be walkable`);
    const p = StationMap.findPath(spawn.x, spawn.z, inter.x, inter.z);
    assert.ok(Array.isArray(p) && p.length > 0, `Interactable ${inter.id} must be A*-reachable from spawn`);
  }

  // Verify 2.5D camera scroll bounds cover all 6 zones including far Platform 0 east/south corners
  assert.equal(typeof World25D.computeCameraScrollBounds, 'function');
  const bounds = World25D.computeCameraScrollBounds(StationMap);
  assert.ok(bounds.minX <= 4.0 && bounds.minZ <= 4.0, 'Camera scroll bounds must cover NW Concourse corner');
  assert.ok(bounds.maxX >= StationMap.HAZARD_X && bounds.maxZ >= 144, `Camera scroll bounds (${bounds.maxX}x${bounds.maxZ}) must cover far Platform 0 SE region`);
  for (const zId of Object.keys(StationMap.ZONES)) {
    const zc = StationMap.getZoneCenter(zId);
    assert.ok(zc.x >= bounds.minX && zc.x <= bounds.maxX && zc.z >= bounds.minZ && zc.z <= bounds.maxZ,
      `Zone ${zId} center (${zc.x},${zc.z}) must lie inside camera scroll bounds`);
  }
});

test('4x map dynamic interactive points: destructible covers, scene triggers, walkability/clearance, and environmental clues across all 6 zones', () => {
  assert.equal(typeof SceneArchitect.generateDynamicInteractables, 'function');
  const dyn = SceneArchitect.generateDynamicInteractables(StationMap);
  assert.ok(dyn && Array.isArray(dyn.destructibles) && Array.isArray(dyn.triggers),
    'generateDynamicInteractables must return { destructibles, triggers }');
  assert.ok(dyn.destructibles.length >= 10, `Expected >= 10 destructible covers, got ${dyn.destructibles.length}`);
  assert.ok(dyn.triggers.length >= 8, `Expected >= 8 scene triggers, got ${dyn.triggers.length}`);

  const allItems = [...dyn.destructibles, ...dyn.triggers];
  const seenIds = new Set();
  const seenClueIds = new Set();
  const coveredZones = new Set();
  const spawn = StationMap.getZoneCenter('concourse');
  const staticInts = StationMap.getInteractables();
  const grid = StationMap.getGrid();

  for (const item of allItems) {
    assert.ok(item.id && !seenIds.has(item.id), `Duplicate or missing dynamic interactable id: ${item.id}`);
    seenIds.add(item.id);

    assert.equal(StationMap.isWalkable(item.x, item.z), true,
      `Dynamic point ${item.id} at (${item.x},${item.z}) must sit on walkable floor`);
    assert.notEqual(grid[Math.floor(item.z)][Math.floor(item.x)], 4,
      `Dynamic point ${item.id} must not sit inside rail_trench`);

    const spawnDist = Math.hypot(item.x - spawn.x, item.z - spawn.z);
    assert.ok(spawnDist >= 2.8, `Dynamic point ${item.id} too close to spawn (${spawnDist.toFixed(2)}m)`);

    for (const si of staticInts) {
      const d = Math.hypot(item.x - si.x, item.z - si.z);
      assert.ok(d >= 2.4, `Dynamic point ${item.id} overlaps static interactable ${si.id} (${d.toFixed(2)}m)`);
    }

    assert.ok(item.envClue && item.envClue.id && !seenClueIds.has(item.envClue.id),
      `Dynamic point ${item.id} must carry a unique envClue.id`);
    seenClueIds.add(item.envClue.id);
    assert.ok(item.envClue.title && item.envClue.summary && item.envClue.tag && item.envClue.zoneCode,
      `Dynamic point ${item.id} envClue missing required display fields`);
    coveredZones.add(item.zoneId || item.envClue.zoneId);
  }

  for (const zId of Object.keys(StationMap.ZONES)) {
    assert.ok(coveredZones.has(zId), `Zone ${zId} must have at least one dynamic interactive point`);
  }

  for (const cov of dyn.destructibles) {
    assert.equal(cov.type, 'destructible_cover');
    assert.ok(cov.hp >= 50 && cov.hp <= 200, `Destructible cover ${cov.id} hp out of bounds: ${cov.hp}`);
    assert.ok(cov.radius > 0.4 && cov.radius < 2.0, `Destructible cover ${cov.id} radius out of bounds: ${cov.radius}`);
  }

  for (const trg of dyn.triggers) {
    assert.equal(trg.type, 'scene_trigger');
    assert.ok(['acoustic_lure', 'vent_purge', 'sonar_relay', 'arc_surge'].includes(trg.triggerEffect),
      `Unexpected triggerEffect ${trg.triggerEffect} on ${trg.id}`);
  }
});

test('21 architectural sub-zones, glazed partition walls, A* reachability, and bespoke set-pieces across all 6 zones', () => {
  assert.ok(Array.isArray(StationMap.SUBZONES) && StationMap.SUBZONES.length >= 21,
    `Expected >= 21 sub-zones, got ${StationMap.SUBZONES && StationMap.SUBZONES.length}`);
  assert.equal(typeof StationMap.getSubZoneAt, 'function');
  assert.equal(typeof StationMap.getPillarMask, 'function');

  const countByZone = Object.create(null);
  const spawn = StationMap.getZoneCenter('concourse');
  for (const sz of StationMap.SUBZONES) {
    countByZone[sz.zoneId] = (countByZone[sz.zoneId] || 0) + 1;
    assert.ok(sz.id && sz.code && sz.name && sz.style, `Sub-zone ${sz.id} missing metadata`);

    const sx = sz.cx + 0.5;
    const szz = sz.cz + 0.5;
    assert.equal(StationMap.isWalkable(sx, szz), true,
      `Sub-zone ${sz.id} center (${sx}, ${szz}) must be walkable`);
    const lookup = StationMap.getSubZoneAt(sx, szz);
    assert.equal(lookup.id, sz.id,
      `getSubZoneAt(${sx}, ${szz}) returned ${lookup && lookup.id} instead of ${sz.id}`);

    const path = StationMap.findPath(spawn.x, spawn.z, sx, szz);
    assert.ok(path.length > 0, `Sub-zone ${sz.id} (${sx}, ${szz}) must be A*-reachable from spawn`);
  }

  for (const zId of Object.keys(StationMap.ZONES)) {
    assert.ok((countByZone[zId] || 0) >= 3,
      `Zone ${zId} must have at least 3 distinct sub-zones, got ${countByZone[zId] || 0}`);
  }

  // Glazed architectural interior partitions must exist, block movement, yet allow glazed line-of-sight
  const partitionRuns = StationMap.getWalls().filter((w) => w.partition);
  assert.ok(partitionRuns.length >= 18, `Expected >= 18 glazed partition runs, got ${partitionRuns.length}`);
  // Concourse North Ticket Checkpoint partition at (25, 21) blocks walking but preserves glazed sightline across z=21
  assert.equal(StationMap.isWalkable(25.5, 21.5), false, 'Glazed partition at (25.5, 21.5) must block movement');
  assert.equal(StationMap.hasLineOfSight(25.5, 19.5, 25.5, 23.5), true,
    'Glazed partition at (25.5, 21.5) must allow elevated/glazed line of sight');

  // Bespoke 3D set-pieces must populate every single one of the 6 zones and stay clear of rail trench & walls
  const props = SceneArchitect.generateDynamicZoneProps(StationMap);
  assert.ok(props.zoneSetPieces, 'generateDynamicZoneProps must return zoneSetPieces');
  assert.ok(props.meta.partitionRunCount >= 18, `Expected partitionRunCount >= 18, got ${props.meta.partitionRunCount}`);
  for (const zId of Object.keys(StationMap.ZONES)) {
    const cnt = props.meta.subZoneSetPieces && props.meta.subZoneSetPieces[zId];
    assert.ok(cnt >= 5, `Zone ${zId} must have >= 5 bespoke architectural set-pieces, got ${cnt}`);
  }

  // Every walkable set-piece prop must sit on walkable floor off the rail trench
  const walkableBuckets = [
    ...props.zoneSetPieces.concourse.tvmBanks,
    ...props.zoneSetPieces.concourse.metalDetectors,
    ...props.zoneSetPieces.concourse.vendingMachines,
    ...props.zoneSetPieces.concourse.luggageClusters,
    ...props.zoneSetPieces.corridor.payphones,
    ...props.zoneSetPieces.dispatch.filingCabinets,
    ...props.zoneSetPieces.substation.switchgearCabinets,
    ...props.zoneSetPieces.substation.coolingTanks,
    ...props.zoneSetPieces.substation.cableSpools,
    ...props.zoneSetPieces.tunnel.maintenanceDrums,
    ...props.zoneSetPieces.platform0.freightStacks
  ];
  const grid = StationMap.getGrid();
  for (const wp of walkableBuckets) {
    assert.equal(StationMap.isWalkable(wp.x, wp.z), true,
      `Set-piece prop at (${wp.x}, ${wp.z}) must be walkable`);
    assert.notEqual(grid[Math.floor(wp.z)][Math.floor(wp.x)], 4,
      `Set-piece prop at (${wp.x}, ${wp.z}) must not sit inside rail trench`);
  }
});

test('Dynamic per-zone scene asset configs, PostFX sync, HUD banner, and zone environmental audio', () => {
  const zoneIds = Object.keys(StationMap.ZONES);
  assert.equal(zoneIds.length, 6, 'Expected 6 zones in StationMap.ZONES');

  assert.ok(World25D.ZONE_SCENE_CONFIGS, 'World25D.ZONE_SCENE_CONFIGS must be exported');
  assert.equal(typeof World25D.resolveZoneSceneConfig, 'function', 'World25D.resolveZoneSceneConfig must be exported');

  const fogColors = new Set();
  const assetKeys = new Set();
  const audioIds = new Set();

  for (const zId of zoneIds) {
    const cfg = World25D.resolveZoneSceneConfig(zId, StationMap);
    assert.ok(cfg, `Missing zone scene config for ${zId}`);
    assert.equal(cfg.id, zId, `Resolved id mismatch for ${zId}`);
    assert.equal(typeof cfg.fogColor, 'number');
    assert.ok(cfg.fogDensity > 0 && cfg.fogDensity < 0.08, `Unexpected fogDensity for ${zId}: ${cfg.fogDensity}`);
    assert.equal(typeof cfg.bgColor, 'number');
    assert.ok(cfg.exposure >= 0.8 && cfg.exposure <= 1.8, `Unexpected exposure for ${zId}: ${cfg.exposure}`);
    assert.equal(typeof cfg.ambientColor, 'number');
    assert.ok(cfg.ambientIntensity > 0, `Unexpected ambientIntensity for ${zId}`);
    assert.equal(typeof cfg.hemiSky, 'number');
    assert.equal(typeof cfg.hemiGround, 'number');
    assert.equal(typeof cfg.keyColor, 'number');
    assert.ok(cfg.keyIntensity > 0, `Unexpected keyIntensity for ${zId}`);
    assert.equal(typeof cfg.rimColor, 'number');
    assert.ok(cfg.rimIntensity > 0, `Unexpected rimIntensity for ${zId}`);
    assert.ok(cfg.dust && typeof cfg.dust.driftX === 'number' && typeof cfg.dust.driftY === 'number' && typeof cfg.dust.driftZ === 'number');
    assert.ok(cfg.assetSet && typeof cfg.assetSet.key === 'string' && cfg.assetSet.key.length > 0);
    assert.ok(cfg.audio && typeof cfg.audio.id === 'string' && cfg.audio.id.length > 0);

    fogColors.add(cfg.fogColor);
    assetKeys.add(cfg.assetSet.key);
    audioIds.add(cfg.audio.id);
  }

  assert.equal(fogColors.size, 6, 'All 6 zones must define distinct fog colors');
  assert.equal(assetKeys.size, 6, 'All 6 zones must define distinct scene asset set keys');
  assert.equal(audioIds.size, 6, 'All 6 zones must define distinct environmental audio profiles');

  // Unknown zone IDs fall back gracefully to concourse
  const fallback = World25D.resolveZoneSceneConfig('nonexistent_zone_xyz', StationMap);
  assert.equal(fallback.id, 'concourse');
  assert.equal(fallback.assetSet.key, World25D.ZONE_SCENE_CONFIGS.concourse.assetSet.key);

  // Verify dynamic zone rendering, PostFX live color sync, HUD snapshot & banner, and audio integration in source
  const engineSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/world25d/engine_25d.js'), 'utf8');
  for (const needle of [
    'buildZoneSceneAssetRigs',
    'updateZoneEnvironment',
    'showZoneBanner',
    "safeAudio('setZoneAmbience', curZoneId",
    "safeAudio('stopZoneAmbience')",
    'fx.fogDisplay.copy(fog.color)',
    'zoneSceneAssetKey',
    'zoneAudioId',
    'zoneAudioLabel'
  ]) {
    assert.ok(engineSrc.includes(needle), `engine_25d.js missing expected dynamic zone symbol: ${needle}`);
  }

  const audioSrc = fs.readFileSync(path.resolve(process.cwd(), 'sim/engine/audio_engine.js'), 'utf8');
  for (const needle of [
    'setZoneAmbience',
    'stopZoneAmbience',
    'getZoneAmbience',
    "if (name === 'zone_enter')"
  ]) {
    assert.ok(audioSrc.includes(needle), `audio_engine.js missing expected zone ambience symbol: ${needle}`);
  }
});
