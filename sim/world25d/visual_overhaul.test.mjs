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
  'sim/world25d/vfx_studio.js'
]);

const { ArtTokens, ASSETS, SHOP_CATALOG, StationMap, PixelSprites, Skills25D, SceneArchitect, VfxStudio } = sandbox.INFINITY;

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
