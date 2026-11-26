# Infinity 2.5D HD-2D Real-Time Exam Engine — Interface Contract

All 2.5D scripts load via classic `<script defer>` after `sim/vendor/three.min.js` and attach to `window.INFINITY`.

## Script Load Order (`index.html` & `sim/index.html`)
1. `sim/vendor/three.min.js` -> `window.THREE` (r147)
2. `sim/data/shop_catalog.js`
3. `sim/data/world_cast.js`
4. `sim/data/scenario_station_zero.js`
5. `sim/engine/rule_engine.js`
6. `sim/engine/ai_director.js`
7. `sim/engine/audio_engine.js`
8. `sim/world25d/pixel_sprites.js` -> `window.INFINITY.PixelSprites`
9. `sim/world25d/station_map.js` -> `window.INFINITY.StationMap`
10. `sim/world25d/skill_archetypes.js` -> `window.INFINITY.Skills25D`
11. `sim/world25d/engine_25d.js` -> `window.INFINITY.World25D`
12. `sim/ui/tactical_canvas.js` (still used for Hall Crimson Vortex)
13. `sim/ui/app_ui.js`

---

## Module Contracts

### 1. `window.INFINITY.PixelSprites` (`sim/world25d/pixel_sprites.js`)
```js
window.INFINITY.PixelSprites = {
  getTileTexture(name),      // 'floor_slate' | 'floor_platform' | 'floor_hazard' | 'floor_rail' | 'wall_concrete' | 'wall_neon' | 'train_hull' -> THREE.CanvasTexture (Nearest mag, NearestMipmapLinear min)
  getCharTexture(id, frame, weaponStyle?), // id: 'player'|'yanci'|'lujin'|'xutan'|'shenyan'|'inspector', frame: 'idle'|'idle2'|'walk1'|'walk2'|'action'|'dash'|'channel'|'hurt'
                             // weaponStyle (optional): 'sword'|'cyber'|'occult'|'tactical' -> held weapon variant (WEAPON_BY_STYLE); NearestFilter
                             // getCharNormalTexture / getCharEmissiveTexture accept the same optional 3rd argument
  getPropTexture(name)       // 'console_off'|'console_on'|'clue_glow'|'exit_gate'|'ward_sigil'|'kunai'|'drone' -> THREE.CanvasTexture
};
```

### 2. `window.INFINITY.StationMap` (`sim/world25d/station_map.js`)
Seamless 56×38 grid (`TILE = 1.0`). Coordinate origin `(0, 0)` at grid `(0, 0)`, world `(x, z)` in `[0..56, 0..38]`.
Zones: `'concourse'`, `'corridor'`, `'dispatch'`, `'substation'`, `'tunnel'`, `'platform0'`.
```js
window.INFINITY.StationMap = {
  GRID_W: 56,
  GRID_H: 38,
  ZONES: {
    concourse:  { id: 'concourse',  name: 'B1 检票大厅',   code: 'Z-01', cx: 10, cz: 10, color: '#6fd8ea' },
    corridor:   { id: 'corridor',   name: 'B2 换乘长廊',   code: 'Z-02', cx: 26, cz: 18, color: '#d6b274' },
    dispatch:   { id: 'dispatch',   name: '信号调度室',    code: 'Z-03', cx: 30, cz: 7,  color: '#58c4a6' },
    substation: { id: 'substation', name: '旧变电间',      code: 'Z-04', cx: 11, cz: 29, color: '#6fa8ff' },
    tunnel:     { id: 'tunnel',     name: '废弃应急通道',  code: 'Z-05', cx: 34, cz: 30, color: '#b98ce0' },
    platform0:  { id: 'platform0',  name: '0号站台铁轨',   code: 'Z-06', cx: 47, cz: 18, color: '#e85d4a' }
  },
  isWalkable(gx, gz),
  resolveCircleWallCollision(x, z, radius), // returns { x, z, hit }
  hasLineOfSight(x0, z0, x1, z1),
  findPath(x0, z0, x1, z1),                 // BFS/A* returning [{ x, z }, ...]
  getZoneAt(x, z),                          // returns zoneId string
  getZoneCenter(zoneId),                    // returns { x, z }
  getGrid(),                                // 2D array (0=floor, 1=wall, 2=platform, 3=hazard, 4=rail_trench)
  getWalls(),                               // merged or tile wall list [{ x, z, w, d, h, neon }]
  getLights(),                              // [{ x, z, color, intensity, distance, flicker }]
  getInteractables()                        // [{ id, type: 'clue'|'console'|'exit', x, z, zoneId, label, clueId, overrideValue }]
};
```

### 3. `window.INFINITY.Skills25D` (`sim/world25d/skill_archetypes.js`)
14 Real-Time 2.5D Archetypes:
`'sword_arc'`, `'ward_circle'`, `'emp_blast'`, `'rail_shot'`, `'blink_mark'`, `'aegis_shield'`, `'overclock'`, `'heal_pulse'`, `'stealth_veil'`, `'seal_chain'`, `'recon_pulse'`, `'turret_drone'`, `'decoy_flare'`, `'berserk_strike'`.
```js
window.INFINITY.Skills25D = {
  ARCHETYPES: { /* metadata for all 14 archetypes */ },
  mapItemToSkill(item),       // returns { archetype, itemId, name, tier, color, cooldown, energyCost, power, radius, duration, desc, icon }
  buildCombatLoadout(player)  // returns { basicAttack, slots: [4 skills], passives: { moveSpeedMult, maxHpBonus, energyRegen, damageMult, noiseMult, memeResist }, styleLabel }
};
```

### 4. `window.INFINITY.World25D` (`sim/world25d/engine_25d.js`)
```js
window.INFINITY.World25D = {
  mount(containerEl, state, callbacks),
  // callbacks: {
  //   onHudTick(snapshot),         // ~10Hz HUD update
  //   onRadioEvent(entry),         // { type: 'narration'|'dialogue'|'broadcast'|'spark'|'system', npcId?, speaker?, text, fake?, timeGlitch? }
  //   onExamEnd(endingType, stats) // 'perfect_override' | 'kill_inspector' | 'forced_board_survive' | 'wipeout'
  // }
  unmount(),
  setSlowMo(enabled),
  toggleSlowMo(),
  setInputPaused(paused),          // true while typing in radio input (sets timeScale = 0.08)
  castSlot(slotIdx),               // 0..3
  triggerInteract(),
  applySquadOrders(orders),        // [{ npcId, order: 'follow'|'goto_dispatch'|'goto_substation'|'goto_platform0'|'goto_concourse'|'hold'|'engage'|'regroup', bubble? }]
  showSpeechBubble(npcId, text),
  triggerFakeBroadcast(text),
  getSnapshot()
};
```

`snapshot` shape emitted to `onHudTick(snapshot)`:
```js
{
  zoneId, zoneName, zoneCode,
  timeRemainingSec, trainCountdownSec, trainInStation,
  overridePct, cluesFoundCount, cluesTotal, discoveredClueIds,
  hp, maxHp, energy, maxEnergy, sanity, maxSanity,
  soundLevel, threatLevel, slowMo,
  inspector: { hp, maxHp, sealedPct, state, zoneId, distToPlayer },
  nearbyInteractable: null | { id, label, type, progress },
  slots: [{ index, key, name, archetype, color, cooldownLeft, cooldownMax, energyCost, icon, ready }],
  squad: [{ id, name, role, accentColor, zoneId, zoneName, hp, maxHp, order, orderLabel, alive }],
  minimap: { player: {x,z}, inspector: {x,z,visible}, squad: [{id,x,z,color}], wards: [{x,z,r}], consoles: [{x,z,done}], exitReady }
}
```

### 5. `window.INFINITY.AI.handleLiveRadio(ctx)` (`sim/engine/ai_director.js`)
Input `ctx`: `{ text, snapshot, player, relationships, recentRadio }`.
Returns `Promise<{ replyNpcId, dialogues: [{ npcId, line, trustDelta, cautionDelta, bondDelta }], squadOrders: [{ npcId, order, label }], sparkNote?, narration?, fallbackUsed? }>`.
Valid `order` values: `'follow' | 'goto_dispatch' | 'goto_substation' | 'goto_platform0' | 'goto_concourse' | 'goto_corridor' | 'hold' | 'engage' | 'regroup'`.
