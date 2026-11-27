import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

function loadBrowserModules() {
  const sandbox = {
    window: null,
    globalThis: null,
    console,
    Math,
    Date,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    Infinity,
    NaN,
    isFinite,
    isNaN,
    parseInt,
    parseFloat,
    setTimeout,
    clearTimeout,
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);

  const files = [
    'sim/world25d/combat_feel.js',
    'sim/engine/ai_director.js'
  ];
  for (const rel of files) {
    const abs = path.resolve(process.cwd(), rel);
    const code = fs.readFileSync(abs, 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }
  return ctx.INFINITY;
}

const INF = loadBrowserModules();

test('AI Director: threat tiers map cleanly to low, high, and critical', () => {
  const AI = INF.AI;
  assert.equal(AI.getThreatTier(0), 'low');
  assert.equal(AI.getThreatTier(34), 'low');
  assert.equal(AI.getThreatTier(35), 'high');
  assert.equal(AI.getThreatTier(69), 'high');
  assert.equal(AI.getThreatTier(70), 'critical');
  assert.equal(AI.getThreatTier(100), 'critical');
});

test('AI Director: Phase-2 mutation triggers on HP <= 55% or early high-threat >= 85 with HP <= 72%', () => {
  const AI = INF.AI;

  const p1 = AI.evaluateInspectorMutation({ hp: 460, maxHp: 520, threatLevel: 20, alreadyMutated: false, currentPhase: 1 });
  assert.equal(p1.phase, 1);
  assert.equal(p1.mutated, false);
  assert.equal(p1.justMutated, false);
  assert.equal(p1.mutationTier, 'dormant');
  assert.equal(p1.radioAlert, null);

  // Early high-threat mutation at 70% HP & threat 90
  const earlyMut = AI.evaluateInspectorMutation({ hp: 364, maxHp: 520, threatLevel: 90, alreadyMutated: false, currentPhase: 1 });
  assert.equal(earlyMut.phase, 2);
  assert.equal(earlyMut.mutated, true);
  assert.equal(earlyMut.justMutated, true);
  assert.equal(earlyMut.mutationTier, 'overdrive');
  assert.ok(earlyMut.speedMult > 1.3);
  assert.ok(earlyMut.damageMult > 1.3);
  assert.ok(earlyMut.cooldownMult < 0.7);
  assert.ok(earlyMut.radioAlert && earlyMut.radioAlert.includes('提前变异'));

  // Standard HP threshold mutation at 50% HP & moderate threat
  const hpMut = AI.evaluateInspectorMutation({ hp: 260, maxHp: 520, threatLevel: 45, alreadyMutated: false, currentPhase: 1 });
  assert.equal(hpMut.phase, 2);
  assert.equal(hpMut.mutated, true);
  assert.equal(hpMut.justMutated, true);
  assert.equal(hpMut.mutationTier, 'mutated');
  assert.ok(hpMut.radioAlert && hpMut.radioAlert.includes('二阶段变异'));

  // Idempotent once already mutated
  const repeat = AI.evaluateInspectorMutation({ hp: 200, maxHp: 520, threatLevel: 80, alreadyMutated: true, currentPhase: 2 });
  assert.equal(repeat.mutated, true);
  assert.equal(repeat.justMutated, false);
  assert.equal(repeat.radioAlert, null);
});

test('AI Director: threat-level skill cycle unlocks blink_ambush in Phase 2 and advances cycleIndex', () => {
  const AI = INF.AI;

  // Phase 1 never triggers blink_ambush even at 12m
  const p1Mid = AI.selectInspectorSkillCycle({
    phase: 1,
    mutated: false,
    threatLevel: 20,
    distToTarget: 12,
    hasLos: true,
    cycleIndex: 0,
    cooldowns: { blink_ambush: 0, slam: 0, lunge: 0, cleave: 0, gaze: 0 }
  });
  assert.equal(p1Mid.skill, 'gaze');
  assert.equal(p1Mid.exposeWeakpointAfter, false);

  // Phase 2 critical threat at 10m prioritizes blink_ambush and flags weakpoint exposure after
  const p2Crit = AI.selectInspectorSkillCycle({
    phase: 2,
    mutated: true,
    threatLevel: 82,
    distToTarget: 10,
    hasLos: true,
    cycleIndex: 0,
    cooldowns: { blink_ambush: 0, slam: 0, lunge: 0, cleave: 0, gaze: 0 }
  });
  assert.equal(p2Crit.skill, 'blink_ambush');
  assert.equal(p2Crit.threatTier, 'critical');
  assert.equal(p2Crit.exposeWeakpointAfter, true);
  assert.equal(p2Crit.weakpointReason, 'blink_overheat');
  assert.equal(p2Crit.nextCycleIndex, 1);

  // Next cycle step at close range (5m) selects slam and flags slam_recovery weakpoint
  const p2Next = AI.selectInspectorSkillCycle({
    phase: 2,
    mutated: true,
    threatLevel: 82,
    distToTarget: 5.0,
    hasLos: true,
    cycleIndex: p2Crit.nextCycleIndex,
    cooldowns: { blink_ambush: 4.2, slam: 0, lunge: 0, cleave: 0, gaze: 0 }
  });
  assert.equal(p2Next.skill, 'slam');
  assert.equal(p2Next.exposeWeakpointAfter, true);
  assert.equal(p2Next.weakpointReason, 'slam_recovery');
  assert.equal(p2Next.nextCycleIndex, 2);

  // Stunned returns stunned without advancing cycle
  const stunned = AI.selectInspectorSkillCycle({
    phase: 2,
    mutated: true,
    threatLevel: 82,
    distToTarget: 4.0,
    hasLos: true,
    cycleIndex: 2,
    isStunned: true,
    cooldowns: {}
  });
  assert.equal(stunned.skill, 'stunned');
  assert.equal(stunned.nextCycleIndex, 2);
});

test('AI Director: weakpoint trigger & damage amplification reward exposed windows', () => {
  const AI = INF.AI;

  const normalWin = AI.computeWeakpointTrigger('blink_overheat', { threatLevel: 40 });
  const critWin = AI.computeWeakpointTrigger('blink_overheat', { threatLevel: 85 });
  assert.ok(normalWin && critWin);
  assert.ok(critWin.duration < normalWin.duration, 'Critical threat tightens weakpoint window slightly');

  const closed = AI.evaluateWeakpointExposure({ weakpointTimer: 0, baseDamage: 40, isCrit: false, isFlank: false });
  assert.equal(closed.exposed, false);
  assert.equal(closed.finalDamage, 40);
  assert.equal(closed.energyRefund, 0);

  const exposed = AI.evaluateWeakpointExposure({ weakpointTimer: 2.5, baseDamage: 40, isCrit: false, isFlank: false });
  assert.equal(exposed.exposed, true);
  assert.equal(exposed.damageMult, 1.75);
  assert.equal(exposed.finalDamage, 70);
  assert.equal(exposed.bonusSealPct, 5);
  assert.equal(exposed.energyRefund, 10);

  const exposedFlank = AI.evaluateWeakpointExposure({ weakpointTimer: 2.5, baseDamage: 40, isCrit: false, isFlank: true });
  assert.equal(exposedFlank.damageMult, 2.0);
  assert.equal(exposedFlank.finalDamage, 80);

  // Stateful director factory
  const dir = AI.createInspectorDirector();
  assert.equal(dir.getState().mutated, false);
  const m = dir.evaluateMutation({ hp: 250, maxHp: 520, threatLevel: 75 });
  assert.equal(m.justMutated, true);
  assert.equal(dir.getState().mutated, true);
  const s = dir.selectSkill({ threatLevel: 75, distToTarget: 9, hasLos: true, cooldowns: {} });
  assert.equal(s.skill, 'blink_ambush');
  assert.equal(dir.getState().cycleIndex, 1);
  dir.reset();
  assert.deepEqual({ ...dir.getState() }, { mutated: false, cycleIndex: 0 });
});

test('CombatFeel: weakpoint/mutation typography, teleport VFX, and 3D weakpoint reticle updater', () => {
  const CF = INF.CombatFeel;

  const wpStyle = CF.getFloatingTextStyle('weakpoint');
  assert.equal(wpStyle.tier, 'weakpoint');
  assert.equal(wpStyle.fontSize, '18px');

  const mutStyle = CF.getFloatingTextStyle('mutation');
  assert.equal(mutStyle.tier, 'mutation');
  assert.equal(mutStyle.fontSize, '18px');

  // Mock session for spawnBossTeleportVfx & awakening/weakpoint hit feel
  const calls = {
    afterimages: 0,
    shockRings: 0,
    sparks: 0,
    bolts: 0,
    lasers: 0,
    stars: 0,
    shakes: 0,
    floating: [],
    impactFrames: 0
  };
  const mockSession = {
    glitchAmount: 0,
    camFovPunch: 0,
    hitStopTimer: 0,
    spawnAfterimage: () => { calls.afterimages++; },
    spawnShockRing: () => { calls.shockRings++; },
    spawnSparkBurst: () => { calls.sparks++; },
    spawnLightningBolt: () => { calls.bolts++; },
    spawnLaserBeam: () => { calls.lasers++; },
    spawnImpactStar: () => { calls.stars++; },
    addCameraShake: () => { calls.shakes++; },
    triggerImpactFrame: () => { calls.impactFrames++; },
    spawnFloatingText: (_x, _y, _z, txt, _c, tier) => { calls.floating.push({ txt, tier }); }
  };

  const blinkRes = CF.spawnBossTeleportVfx(mockSession, 0, 0, 8, 4, { facingLeft: true });
  assert.equal(blinkRes.triggered, true);
  assert.ok(calls.afterimages >= 4, 'Departure + intermediate glitch ghosts rendered');
  assert.ok(calls.bolts >= 2, 'Spatial rift lightning rendered');
  assert.equal(calls.lasers, 1, 'Spatial rift beam rendered');
  assert.ok(calls.shockRings >= 3, 'Departure + arrival shockwaves rendered');
  assert.equal(calls.stars, 1);
  assert.equal(calls.shakes, 1);
  assert.ok(mockSession.glitchAmount >= 0.4);
  assert.ok(mockSession.camFovPunch < 0);
  assert.ok(mockSession.hitStopTimer > 0);

  const mutRes = CF.triggerBossMutationAwakeningFeel(mockSession, 4, 2);
  assert.equal(mutRes.triggered, true);
  assert.equal(calls.impactFrames, 1);
  assert.equal(calls.floating[0].tier, 'mutation');

  const wpHitRes = CF.triggerBossWeakpointHitFeel(mockSession, 4, 2, 95, { callout: '✦ 弱点贯通 -95' });
  assert.equal(wpHitRes.triggered, true);
  assert.equal(calls.impactFrames, 2);
  assert.equal(calls.floating[1].tier, 'weakpoint');

  // Mock Three.js primitives for buildBossWeakpointVisual + updateBossWeakpointVisual
  class MockVec {
    constructor() { this.x = 0; this.y = 0; this.z = 0; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; }
  }
  class MockObj {
    constructor() {
      this.position = new MockVec();
      this.rotation = new MockVec();
      this.scale = new MockVec();
      this.visible = true;
      this.children = [];
    }
    add(child) { this.children.push(child); }
  }
  const MockTHREE = {
    AdditiveBlending: 2,
    DoubleSide: 2,
    Group: MockObj,
    OctahedronGeometry: class { constructor() {} },
    RingGeometry: class { constructor() {} rotateX() {} },
    MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); } },
    Mesh: class extends MockObj {
      constructor(g, m) { super(); this.geometry = g; this.material = m; }
    }
  };
  const parent = new MockObj();
  const wpVis = CF.buildBossWeakpointVisual(MockTHREE, parent);
  assert.ok(wpVis && wpVis.group);
  assert.equal(wpVis.group.visible, false);
  assert.equal(parent.children.length, 1);

  CF.updateBossWeakpointVisual(wpVis, { alive: true, weakpointTimer: 2.4, weakpointMaxTimer: 3.2 }, 1.25);
  assert.equal(wpVis.group.visible, true);
  assert.ok(wpVis.coreMesh.rotation.y > 0);
  assert.ok(wpVis.outerRing.rotation.z > 0);

  CF.updateBossWeakpointVisual(wpVis, { alive: true, weakpointTimer: 0, weakpointMaxTimer: 3.2 }, 1.5);
  assert.equal(wpVis.group.visible, false);
});
