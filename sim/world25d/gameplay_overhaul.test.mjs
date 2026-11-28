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

  it('enforces infinite-flow NPC spatial dispersion and independent multi-zone auto routines', () => {
    const spawns = api.DEFAULT_NPC_SPAWNS;
    assert.ok(Array.isArray(spawns) && spawns.length === 4, 'Expected 4 squad NPCs');

    const spawnZones = new Set();
    for (const sp of spawns) {
      assert.notEqual(sp.zone, 'concourse', `NPC ${sp.id} must not spawn in player Z-01 concourse`);
      spawnZones.add(sp.zone);
    }
    assert.equal(spawnZones.size, 4, 'All 4 NPCs must spawn in 4 distinct non-concourse sectors');

    // Mock mapApi for autonomous goal checks
    const mockCenters = {
      concourse: { x: 41.5, z: 37.5 },
      corridor: { x: 122.5, z: 74.5 },
      dispatch: { x: 122.5, z: 24.5 },
      substation: { x: 41.5, z: 110.5 },
      tunnel: { x: 122.5, z: 124.5 },
      platform0: { x: 188.5, z: 74.5 }
    };
    const mockMap = {
      getZoneCenter: (z) => mockCenters[z] || mockCenters.corridor,
      resolveCircleWallCollision: (x, z) => ({ x, z })
    };
    const player = { x: 41.5, z: 37.5 };
    const farBoss = { x: 195.0, z: 130.0, alive: true };

    for (const id of ['yanci', 'lujin', 'xutan', 'shenyan']) {
      const npc = { id, x: 110, z: 70, order: 'auto', roamIndex: 0 };
      const goal = api.resolveAutonomousNpcGoal(npc, {
        player,
        inspector: farBoss,
        mapApi: mockMap,
        interactables: [],
        squadById: {}
      });
      const distToPlayer = Math.hypot(goal.x - player.x, goal.z - player.z);
      assert.ok(distToPlayer > 12, `Autonomous ${id} must not follow player in auto mode (dist=${distToPlayer.toFixed(1)})`);
      assert.ok(!goal.inspectClue, `Autonomous ${id} must not stall waiting to summon player to a clue`);
    }

    // Even when Xu Tan evades a nearby Inspector, he must evade to a safe non-concourse room
    const xutanEvade = api.resolveAutonomousNpcGoal(
      { id: 'xutan', x: 122, z: 24, order: 'auto', roamIndex: 0 },
      { player, inspector: { x: 125, z: 24, alive: true }, mapApi: mockMap, interactables: [], squadById: {} }
    );
    assert.equal(xutanEvade.evading, true);
    assert.ok(Math.hypot(xutanEvade.x - player.x, xutanEvade.z - player.z) > 15, 'Xu Tan evasion must not run back to player in concourse');

    // Explicit radio follow order still commands NPC to join player
    const explicitFollow = api.resolveAutonomousNpcGoal(
      { id: 'yanci', x: 110, z: 70, order: 'follow', roamIndex: 0 },
      { player, inspector: farBoss, mapApi: mockMap, interactables: [], squadById: {} }
    );
    assert.equal(explicitFollow.x, player.x);
    assert.equal(explicitFollow.z, player.z);
  });
});
