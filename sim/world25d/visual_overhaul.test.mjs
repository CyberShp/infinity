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
  const spawn = { x: 10.5, z: 10.5 };

  const groundProps = [
    ...specs.turnstiles,
    ...specs.benches,
    ...specs.serverRacks,
    ...specs.cratesAndBarricades
  ];
  assert.ok(groundProps.length >= 10, 'Expected rich ground storytelling props across zones');

  for (const p of groundProps) {
    const dSpawn = Math.hypot(p.x - spawn.x, p.z - spawn.z);
    assert.ok(dSpawn >= 2.0, `Prop at (${p.x},${p.z}) too close to player spawn (dist=${dSpawn.toFixed(2)})`);
    for (const inter of interactables) {
      const dInter = Math.hypot(p.x - inter.x, p.z - inter.z);
      assert.ok(dInter >= 1.35, `Prop at (${p.x},${p.z}) overlaps interactable ${inter.id} at (${inter.x},${inter.z})`);
    }
  }

  // Verify A* connectivity from spawn to key points in all 6 zones
  const zoneWaypoints = [
    { name: 'dispatch', x: 30.5, z: 6.5 },
    { name: 'corridor', x: 31.5, z: 18.5 },
    { name: 'substation', x: 11.5, z: 28.5 },
    { name: 'tunnel', x: 31.5, z: 30.5 },
    { name: 'platform0', x: 45.5, z: 18.5 }
  ];
  for (const wp of zoneWaypoints) {
    const pathPts = StationMap.findPath(spawn.x, spawn.z, wp.x, wp.z);
    assert.ok(Array.isArray(pathPts) && pathPts.length > 0, `A* path to ${wp.name} must remain connected`);
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

  const groundFx = VfxStudio.spawnFlipbookVfx(session, {
    name: 'hades_tao_ground',
    x: 49.6,
    z: 18.5,
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
  assert.ok(groundFx.group.position.x + groundFx.radius <= 50.05, 'Ground flipbook must clamp clear of rail_trench (x >= 50)');

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

  // 1. Huge knockback near Platform 0 yellow line toward sunken rail_trench (x = 50..53, grid === 4)
  const railPush = World25D.resolveSweptMovement(StationMap, 49.2, 18.5, 53.8, 18.5, 0.56);
  assert.equal(railPush.hit, true, 'Knockback toward rail_trench must register collision');
  assert.equal(railPush.hitRailEdge, true, 'Knockback toward rail_trench must flag hitRailEdge');
  assert.ok(railPush.x < 50.0, `Actor crossed into rail_trench (x=${railPush.x.toFixed(2)})`);
  assert.equal(StationMap.isWalkable(railPush.x, railPush.z), true, 'Final position must stay strictly walkable');
  assert.notEqual(grid[Math.floor(railPush.z)][Math.floor(railPush.x)], 4, 'Actor must never land on grid===4 rail_trench');

  // 2. High-speed knockback into Corridor cover pillar (x=25..26, z=16, grid === 1)
  const wallPush = World25D.resolveSweptMovement(StationMap, 24.3, 16.5, 28.4, 16.5, 0.42);
  assert.equal(wallPush.hit, true, 'Knockback into pillar must register collision');
  assert.equal(wallPush.hitWall, true, 'Knockback into pillar must flag hitWall for rebound/debris');
  assert.ok(wallPush.x < 25.0, `Actor tunneled through pillar (x=${wallPush.x.toFixed(2)})`);
  assert.equal(StationMap.isWalkable(wallPush.x, wallPush.z), true);

  // 3. Ground decal clamping near Platform 0 edge must never overhang into rail_trench
  const decal = VfxStudio.clampGroundDecal(StationMap, 49.7, 18.5, 2.4);
  assert.equal(decal.valid, true, 'Walkable platform edge decal should clamp validly');
  assert.equal(StationMap.isWalkable(decal.x, decal.z), true, 'Clamped decal center must stay walkable');
  assert.ok(decal.x + decal.radius <= 50.05, `Ground decal overhangs rail edge (x=${decal.x.toFixed(2)}, r=${decal.radius.toFixed(2)})`);

  // 4. Ground decal deep inside non-walkable rail_trench / out-of-bounds must report valid: false and never push off-map
  const offRail = VfxStudio.clampGroundDecal(StationMap, 52.5, 18.5, 4.8);
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

