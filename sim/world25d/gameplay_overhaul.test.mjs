import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadWorld25D() {
  const ctx = {
    window: {},
    globalThis: {},
    console,
    Math,
    Number,
    String,
    Array,
    Object,
    Date,
    RegExp,
    Float32Array,
    Int32Array,
    Uint8Array,
    isFinite,
    parseInt,
    parseFloat,
    setTimeout,
    clearTimeout
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  const code = fs.readFileSync(new URL('./engine_25d.js', import.meta.url), 'utf8');
  vm.runInNewContext(code, ctx, { filename: 'engine_25d.js' });
  return ctx.INFINITY.World25D;
}

describe('2.5D Exam Gameplay Overhaul (Orbiters, Strict Room Fog, Death Exam Boss)', () => {
  const api = loadWorld25D();

  it('spawns 0 floating orbiters for starter players with no owned items', () => {
    assert.equal(api.computePlayerOrbiterCount([], { orbiterCount: 2, orbiterType: 'kinetic_plate' }), 0);
    assert.equal(api.computePlayerOrbiterCount(null, { orbiterCount: 3 }), 0);
    assert.equal(api.computePlayerOrbiterCount([{ id: 'x1', name: '青冥剑' }], { orbiterCount: 2 }), 2);
    assert.equal(api.computePlayerOrbiterCount([{ id: 'x1' }], { orbiterCount: 9 }), 4);
  });

  it('detects passive recon items by tags, skill role, or name', () => {
    assert.equal(api.hasPassiveReconItem([]), false);
    assert.equal(api.hasPassiveReconItem([{ name: '铁剑', tags: ['近战'] }]), false);
    assert.equal(api.hasPassiveReconItem([{ name: '热成像护目镜', tags: ['科技'] }]), true);
    assert.equal(api.hasPassiveReconItem([{ name: '古铜镜', tags: ['侦察'] }]), true);
    assert.equal(api.hasPassiveReconItem([{ name: '灵识玉简', activeSkill: { role: 'recon' } }]), true);
  });

  it('strictly hides events in the next room unless player has active or passive recon', () => {
    // Different room, 10m away even with LOS -> hidden without recon
    assert.equal(
      api.evaluatePointVisibility({
        px: 20, pz: 20, tx: 30, tz: 20,
        playerZone: 'concourse', targetZone: 'corridor',
        hasLineOfSight: true, reconActive: false, hasPassiveRecon: false
      }),
      false
    );

    // Different room, 4m away through a wall -> hidden without recon
    assert.equal(
      api.evaluatePointVisibility({
        px: 20, pz: 20, tx: 24, tz: 20,
        playerZone: 'concourse', targetZone: 'corridor',
        hasLineOfSight: false, reconActive: false, hasPassiveRecon: false
      }),
      false
    );

    // Same room with LOS within 22m -> visible
    assert.equal(
      api.evaluatePointVisibility({
        px: 20, pz: 20, tx: 32, tz: 20,
        playerZone: 'concourse', targetZone: 'concourse',
        hasLineOfSight: true, reconActive: false, hasPassiveRecon: false
      }),
      true
    );

    // Same room behind wall -> hidden without recon
    assert.equal(
      api.evaluatePointVisibility({
        px: 20, pz: 20, tx: 28, tz: 20,
        playerZone: 'concourse', targetZone: 'concourse',
        hasLineOfSight: false, reconActive: false, hasPassiveRecon: false
      }),
      false
    );

    // Active recon skill reveals next room through walls up to 40m
    assert.equal(
      api.evaluatePointVisibility({
        px: 20, pz: 20, tx: 52, tz: 20,
        playerZone: 'concourse', targetZone: 'platform0',
        hasLineOfSight: false, reconActive: true, hasPassiveRecon: false
      }),
      true
    );

    // Passive recon item reveals next room through walls up to 26m
    assert.equal(
      api.evaluatePointVisibility({
        px: 20, pz: 20, tx: 42, tz: 20,
        playerZone: 'concourse', targetZone: 'corridor',
        hasLineOfSight: false, reconActive: false, hasPassiveRecon: true
      }),
      true
    );
  });

  it('enforces Death Exam Boss HP, lethality, Rule Armor mitigation, and Armor Break vulnerability', () => {
    const cfg = api.BOSS_DEATH_EXAM_CONFIG;
    assert.equal(cfg.maxHp, 520);
    assert.ok(cfg.lungeDamageP1 >= 55 && cfg.lungeDamageP2 >= 65);
    assert.ok(cfg.cleaveDamageP1 >= 40 && cfg.slamDamage >= 45);
    assert.ok(cfg.gazeDamage >= 30 && cfg.gazeSanityLoss >= 15);

    // Default Rule Armor mitigates damage (~58% passes through)
    const armored = api.computeBossDamageTaken(100, { armorBrokenTimer: 0, stunTimer: 0, overridePct: 0 });
    assert.equal(armored.damage, 58);
    assert.equal(armored.armorMitigated, true);
    assert.equal(armored.armorVulnerable, false);

    // Partial override weakens Rule Armor (75% passes through)
    const halfOverride = api.computeBossDamageTaken(100, { armorBrokenTimer: 0, stunTimer: 0, overridePct: 50 });
    assert.equal(halfOverride.damage, 75);
    assert.equal(halfOverride.armorMitigated, true);

    // Broken armor / stunned takes 1.45x vulnerability damage
    const broken = api.computeBossDamageTaken(100, { armorBrokenTimer: 3.5, stunTimer: 0, overridePct: 0 });
    assert.equal(broken.damage, 145);
    assert.equal(broken.armorVulnerable, true);
    assert.equal(broken.armorMitigated, false);

    // Counterplay skills (Parry / EMP / Seal Chain) bypass Rule Armor
    const bypass = api.computeBossDamageTaken(100, { armorBrokenTimer: 0, stunTimer: 0, ignoreRuleArmor: true });
    assert.equal(bypass.damage, 100);
    assert.equal(bypass.armorMitigated, false);
  });
});
