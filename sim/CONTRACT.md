# Infinity Living Simulator — Architecture & Interface Contract

All files live under `/home/antigravity/CyberShp/infinity/sim/` and attach to `window.INFINITY` using classic `<script defer>` (zero ES module CORS issues on both `file://` and GitHub Pages `https://`).

## Script Load Order in `sim/index.html`
1. `data/shop_catalog.js` -> `window.INFINITY.SHOP_CATALOG` (Array of 500 structured items) & `window.INFINITY.FUSION_RECIPES` (Array of curated fusion recipes)
2. `data/world_cast.js` -> `window.INFINITY.CAST` (Original squad + Canon squad character dossiers, anti-cringe voice rules, initial stats/relationships, world timeline events)
3. `data/scenario_station_zero.js` -> `window.INFINITY.SCENARIOS.station_zero` (Original Exam 2: 《零号回廊 · 停摆站台》 — 6 spatial nodes with canvas coordinates, clues, rules, Inspector enemy patrol/aggro mechanics, fake-broadcast traps, crisis templates, multi-build solution hooks)
4. `engine/rule_engine.js` -> `window.INFINITY.Engine` (Deterministic state machine, shop buy/sell/fusion/discount/loadout, world tick, scenario movement/action resolution, crisis reaction window, save/load localStorage)
5. `engine/ai_director.js` -> `window.INFINITY.AI` (BYOK DeepSeek/OpenAI-compatible client reading API key strictly from `localStorage` — NEVER hardcoded; Action Parser + Living Actor Dialogue + Director Narration + graceful offline tactical fallback)
6. `engine/audio_engine.js` -> `window.INFINITY.Audio` (Procedural Web Audio API layered soundscape: crimson vortex drone, rain/station ambience, wristwatch tick, threat low-pass heartbeat, vacuum-drop crisis freeze SFX, UI tactile clicks, mute/volume)
7. `ui/tactical_canvas.js` -> `window.INFINITY.Canvas` (Interactive HTML5 Canvas renderer: Hall Crimson Vortex + Living Tactical Map for Station Zero with animated fog, node graph, clickable rooms, player/squad/entity tokens, radar/sound ripples, ward/array glyphs, crisis vignette/shake)
8. `ui/app_ui.js` -> `window.INFINITY.UI` (Full interactive app controller & DOM renderer: Setup/Config modal with DeepSeek preset, Crimson Vortex Hall + 500-item Shop & Fusion Lab + World Radar + Hall Social/Sparring + Exam Tactical Console with free-text action input + quick tactical actions + Crisis Reaction Overlay)

---

## Core Data Contracts

### 1. Shop Item (`INFINITY.SHOP_CATALOG[i]`)
```js
{
  id: 'B026',                 // B001-B100, C001-C100, M001-M080, T001-T080, A001-A070, G001-G070
  name: '先天剑骨雏形',
  canon: false,               // true if [原著], false if [扩充]
  category: 'bloodline',      // 'bloodline' | 'cultivation' | 'myth' | 'tech' | 'anomaly' | 'general'
  categoryLabel: '血统与体质',
  tier: 'C',                  // 'D' | 'C' | 'B' | 'A' | 'S'
  source: '古典剑修',
  price: 45,                  // numeric integer points
  discountable: true,         // whether 60% drawback/limited variant can be purchased
  desc: '御剑灵性极高、剑意悟性倍增，兼修非剑类武学偏慢',
  tags: ['剑修', '体质', '灵性'], // derived tactical/system tags for search & engine synergy
  powerDelta: { phy: 1, agi: 2, obs: 2, wil: 3, energy: 20 }, // deterministic stat modifier when equipped
  energyType: '真元',         // '体魄' | '真元' | '魔力' | '科技' | '灵异' | '通用'
  activeSkill: {              // optional active/passive summary for combat & AI adjudication
    cost: 10,
    cooldown: 2,
    role: 'control'           // 'control' | 'defense' | 'burst' | 'mobility' | 'recon' | 'support' | 'passive'
  }
}
```

### 2. Fusion Recipe (`INFINITY.FUSION_RECIPES[i]`)
```js
{
  id: 'FUS_01',
  inputs: ['B022', 'B023'],   // item IDs
  extraCost: 90,
  reqGrade: 'B',              // 'C' | 'B' | 'A' | 'S'
  result: {
    id: 'FUS_CALM_TYRANT',
    name: '冷静暴君',
    tier: 'B',
    category: 'bloodline',
    desc: '保留狂暴体格与再生，以高意志压制失控；超负荷仍会反噬精神',
    tags: ['融合血统', '肉体', '再生', '高意志'],
    powerDelta: { phy: 6, agi: 3, obs: 4, wil: 5, energy: 35 },
    drawback: '超负荷使用将触发精神反噬（理智-12）'
  }
}
```

### 3. Character Dossier (`INFINITY.CAST[id]`)
IDs:
- Original Squad (`group: 'original'`): `'yanci'` (严辞), `'lujin'` (陆烬), `'xutan'` (许檀), `'guhe'` (顾禾), `'shenyan'` (沈砚 — Station Zero suspicious temporary ally)
- Canon Squad (`group: 'canon'`): `'yelin'` (夜林), `'litianyang'` (李天阳), `'anke'` (安可), `'hezheng'` (贺铮)

Each character object:
```js
{
  id: 'yanci',
  name: '严辞',
  codename: 'CN-10284',
  group: 'original',          // 'original' | 'canon'
  role: '执棋队长 · 律法破局',
  tier: 'C+',
  inStationZero: true,        // whether present in Exam 2 (canon squad MUST be false!)
  canMeetInHall: true,        // whether reachable in Space Hall / Public Corridor
  accentColor: '#7ca7d9',
  signatureItems: ['M021', 'M023', 'G011'],
  personality: '...',         // sharp, concise behavioral core
  speechStyle: '...',         // concrete cadence & sentence rhythm
  forbiddenTropes: ['...'],   // anti-cringe bans (no melodrama, no exposition dumps, no worship)
  initialTrust: 35,           // 0-100 履约信赖
  initialCaution: 55,         // 0-100 戒备心
  initialBond: 15,            // 0-100 私人牵挂/火花
  statusText: '在公共长廊复盘规则漏洞'
}
```

### 4. Engine State (`INFINITY.Engine.getState()`) & API
```js
// Engine exposes:
window.INFINITY.Engine = {
  init(),
  reset(options),             // options: { playerName, callsign, startPoints, permission }
  getState(),
  subscribe(fn),              // fn(state, event)
  save(),
  load(),

  // Shop & Build
  queryShop(filters),         // { q, category, tier, tag, canonOnly, affordableOnly }
  buyItem(itemId, discounted),// discounted=true -> 60% price with drawback flag
  refundItem(itemId),         // only allowed in Hall before exam lock (80% or 100% in prep)
  fuseBloodlines(idA, idB),   // curated recipe OR procedural same-tier fusion!
  setPlayerProfile(patch),

  // Hall & World
  talkInHall(npcId, userText),// returns Promise<{ ok, feedEntry, deltas }> (delegates to AI + applies deterministic deltas)
  runSparringTest(itemId),    // test equipped build in Hall training room
  advanceWorldFeed(),

  // Exam 2: Station Zero
  enterScenario(scenarioId),  // 'station_zero'
  moveToNode(nodeId),         // deterministic movement + sound/threat/enemy tick
  performQuickAction(actionId, payload),
  submitFreeAction(text),     // deterministic pre-check -> AI adjudication -> apply rule deltas -> trigger crisis if needed
  resolveCrisis(choiceOrText),// resolve active second-level reaction window
  placeWardOrMark(nodeId, itemId), // deploy array/spatial mark on tactical map
  extractFromScenario(endingType)  // settle score, grade, world timeline advancement, return to Hall
};
```

### 5. AI Director Contract (`INFINITY.AI`)
```js
window.INFINITY.AI = {
  STORAGE_KEY: 'infinity_sim_ai_config_v1',
  PRESETS: {
    deepseek: { label: 'DeepSeek (推荐)', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
    deepseek_r1: { label: 'DeepSeek Reasoner', baseUrl: 'https://api.deepseek.com', model: 'deepseek-reasoner' },
    openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    ollama: { label: '本地 Ollama', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5:14b' }
  },
  getConfig(),                // { provider, baseUrl, model, apiKey, enabled } — NEVER hardcoded!
  saveConfig(cfg),
  testConnection(),           // Promise<{ ok, latencyMs, error }>
  adjudicateExamAction(ctx),  // Promise<AdjudicationResult>
  generateHallInteraction(ctx),// Promise<HallDialogueResult>
  adjudicateCrisis(ctx)       // Promise<CrisisResult>
};
```

`AdjudicationResult` JSON schema returned by `AI.adjudicateExamAction(ctx)` (and offline fallback):
```js
{
  feasible: true,
  usedItems: ['C001'],        // MUST be subset of player's owned items (Rule Engine verifies!)
  energyCost: 15,
  hpDelta: 0,
  sanityDelta: -3,
  soundDelta: 10,
  threatDelta: 5,
  enemyStunTurns: 0,
  clueUnlocked: null,         // optional valid clueId
  nodeEffect: null,           // optional { nodeId, effect: 'warded'|'marked'|'blackout'|'cleared' }
  narration: '冷峻、克制、极具画面感的短段落（80-160字，绝不水字数）',
  dialogues: [
    { npcId: 'yanci', line: '简短真实、符合人设的活人台词', emotion: 'sharp', trustDelta: 4, cautionDelta: -3, bondDelta: 2 }
  ],
  systemBroadcast: null,      // optional { fake: boolean, text: string }
  sparkNote: '可选：一句话记录你与队友擦出的战术/认知火花',
  triggerCrisis: null         // optional crisisId or { title, countdownSec, threatText, suggestedCounters }
}
```

### 6. Audio Engine Contract (`INFINITY.Audio`)
```js
window.INFINITY.Audio = {
  unlock(),
  setMuted(bool),
  setVolume(0..1),
  isMuted(),
  setScene(mode),             // 'hall' | 'station_calm' | 'station_tense' | 'crisis' | 'settlement'
  setThreatLevel(0..100),     // smoothly modulates low-pass filter, sub-bass pulse, heartbeat rate
  playSfx(name)               // 'ui_tick' | 'vortex_buy' | 'fusion' | 'footstep' | 'ward_place' | 'crisis_freeze' | 'broadcast_static' | 'blade_ring' | 'alert'
};
```

### 7. Tactical Canvas Contract (`INFINITY.Canvas`)
```js
window.INFINITY.Canvas = {
  mountHallVortex(canvasEl),
  mountTacticalMap(canvasEl, callbacks), // callbacks: { onNodeClick(nodeId), onNodeHover(nodeId) }
  updateTacticalState(state),
  triggerPulse(nodeId, color, label),
  triggerShake(intensity),
  destroy()
};
```
