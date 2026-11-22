// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.0 — 世界基础数据（出身、10大节点、物品、六人档案、兑换目录）
// ============================================================================
(function (global) {
  'use strict';

  const ORIGINS = [
    {
      id: 'arch',
      name: '建筑／测绘毕业生',
      tag: '结构勘测 · OBS +2',
      portraitKey: 'arch',
      bond: '刚画完江南老宅测绘图，深夜撑伞路过拆迁旧巷时白雾骤起。',
      stats: { PHY: 9, AGI: 9, OBS: 12, WIL: 10 },
      startItem: 'steel_tape',
      note: '擅长识破暗格、夹壁厚度与宅院水脉高差。'
    },
    {
      id: 'climb',
      name: '户外攀岩／体能教练',
      tag: '爆发攀越 · PHY +2 / AGI +1',
      portraitKey: 'climb',
      bond: '岩馆收工顺路买宵夜，手里还提着装折刀与镁粉袋的旧双肩包。',
      stats: { PHY: 12, AGI: 11, OBS: 9, WIL: 9 },
      startItem: 'folding_knife',
      note: '开局自带锋利折刀，扛门、潜泳与翻墙容错极高。'
    },
    {
      id: 'archive',
      name: '历史／民俗档案馆实习生',
      tag: '古籍辨伪 · OBS +2 / WIL +1',
      portraitKey: 'archive',
      bond: '加班整理民国江浙地方志与契约旧档，出馆时街灯在白雾里逐盏熄灭。',
      stats: { PHY: 8, AGI: 9, OBS: 12, WIL: 11 },
      startItem: 'cold_penlight',
      note: '开局自带无热源冷光笔灯，对民国契约、鲁班尺门类与厌胜规制极其敏锐。'
    },
    {
      id: 'medic',
      name: '社区急诊护工',
      tag: '创伤处置 · WIL +2 / PHY +1',
      portraitKey: 'medic',
      bond: '刚下夜班，帆布急救包里还备着无菌纱布绷带与碘伏棉片。',
      stats: { PHY: 10, AGI: 9, OBS: 10, WIL: 12 },
      startItem: 'med_bandage',
      note: '开局自带厚纱布绷带（既能止血防尸煞循血索敌，又能裹手隔血拔丧门钉），对医用消毒水气味极敏感。'
    }
  ];

  // 物品分类：tool(工具/媒介，占5格背囊) / relic(特殊奇物，不占或占1格) / doc(原件自动进原件夹，不占背囊)
  const ITEMS = {
    // 开局出身物
    steel_tape:     { id: 'steel_tape',     name: '黑壳钢卷尺',       cat: 'tool',  desc: '带硬质钢钩的5米卷尺，可探夹壁空腔、勾取缝隙物件。' },
    folding_knife:  { id: 'folding_knife',  name: '户外折刀',         cat: 'tool',  desc: '薄而锋利的不锈钢折刀，适合裁开封底夹层、撬怀表盖、挑暗榫与刻木。' },
    cold_penlight:  { id: 'cold_penlight',  name: '冷光LED笔灯',      cat: 'tool',  desc: '零热源冷光照明（HEAT +0），方便暗处侧光查原件压痕而不惊动账房伥。' },
    med_bandage:    { id: 'med_bandage',    name: '厚纱布急救绷带',   cat: 'tool',  desc: '可包扎外伤止血（阻断裴氏尸煞循血索敌），也可厚裹掌心隔血起钉。' },

    // 一进外院搜集物
    cold_lard:      { id: 'cold_lard',      name: '陶罐冷猪油',       cat: 'tool',  desc: '西厢灶台冷透凝固的猪油，能润透朱砂封泥、润滑楠木钉卯与生锈千斤闸绞盘。' },
    damp_ash:       { id: 'damp_ash',       name: '湿阴香灰／冷灶灰', cat: 'tool',  desc: '掺有井水潮气的冷灶草木灰，可润封泥、洗血印，更是无声抹废《买命总契》的古法媒介。' },
    copper_kettle:  { id: 'copper_kettle',  name: '漏底盛水铜壶',     cat: 'tool',  desc: '底有细眼的老旧铜壶，悬于枯井或走廊可做延迟滴水坠落声饵，引偏无目账房伥。' },
    flat_chisel:    { id: 'flat_chisel',    name: '鲁门扁铁凿',       cat: 'tool',  desc: '东厢陈木匠遗留的薄口扁铁凿，可挑暖榻暗榫、撬水下石栓，亦能开尸颌。' },
    ink_line:       { id: 'ink_line',       name: '朱砂木工墨斗',     cat: 'tool',  desc: '尚存陈年朱砂墨汁的鲁门墨斗，东厢弹线拒煞与校准方位的关键法器。' },
    quicklime:      { id: 'quicklime',      name: '半袋生石灰',       cat: 'tool',  desc: '东厢墙角的干石灰粉，可铺槛阻隔寒雾湿气。' },
    wet_rag:        { id: 'wet_rag',        name: '厚麻布湿团',       cat: 'tool',  desc: '浸过井水的厚实粗麻布，可严密塞死夹壁惊魂铜铃舌，也可裹手防倒刺。' },
    crowbar:        { id: 'crowbar',        name: '生锈铁撬棍',       cat: 'tool',  desc: '前院杂物堆里的沉重铁撬棍——直接砸瓦瓮或干撬钉子极易爆出巨响反噬！' },
    lighter:        { id: 'lighter',        name: '煤油打火机',       cat: 'tool',  desc: '明火热源（HEAT 暴涨），焚烧阴契会彻底激怒全宅凶煞。' },

    // 核心脏物 / 剧情证据道具
    gold_watch:     { id: 'gold_watch',     name: '鎏金怀表（裴氏旧物）', cat: 'evidence', desc: '内盘刻“裴氏敬之清玩”。贴身携带计入【受主礼】！可进入原件台撬开背盖细查。' },
    wood_shavings:  { id: 'wood_shavings',  name: '带血酒精桐木屑',   cat: 'evidence', desc: '自鎏金怀表齿轮缝刮出的暗红桐木屑，散发刺鼻医用酒精味——拆穿或反杀沈岚的铁证。' },
    substitute_doll:{ id: 'substitute_doll',name: '桐木替死偶（D级）',cat: 'evidence', desc: '沈岚从黑市倾家荡产换来的替死木偶，左侧缺角与怀表木屑严丝合缝。' },
    peis_lock:      { id: 'peis_lock',      name: '裴氏银锁片',       cat: 'evidence', desc: '带有裴氏私印的阴冷旧银锁，沾身即计入【受主礼】。' },

    // 二进内宅搜集物与队友交付物
    sluice_key:     { id: 'sluice_key',     name: '水口千斤闸铜钥',   cat: 'tool',  desc: '内书房鲁班四象铜匣内藏黄铜钥匙，可无声解开后院枯井千斤水闸铁锁。' },
    cinnabar_powder:{ id: 'cinnabar_powder',name: '朱砂解毒散',       cat: 'tool',  desc: '西绣楼樟木药奁暗格秘药，可压制沈岚旧场阴咒发作或解除尸灰毒粉迷眼。' },
    tung_oil_hemp:  { id: 'tung_oil_hemp',  name: '桐油与麻絮',       cat: 'tool',  desc: '河埠船棚里的修船耗材，用于捻堵乌篷船底漏缝。' },
    iron_hook_rope: { id: 'iron_hook_rope', name: '铁钩麻绳',         cat: 'tool',  desc: '枯井边的打捞长绳，可用于黑水河埠打捞沉水铁匣。' },
    child_lock_deed:{ id: 'child_lock_deed',name: '秦小栓银锁与祭河死契', cat: 'evidence', desc: '河埠水底沉匣内的铁证！幼童长命银锁与血指印死契——直击无目账房伥秦伯残魂的唯一钥匙。' },
    yellow_talisman:{ id: 'yellow_talisman',name: 'D级镇宅黄符',      cat: 'tool',  desc: '赵川贴身珍藏的一次性道符（首夜救活赵川后交付），可强行定住裴氏盲目尸煞 1 回合！' },
    silver_scalpel: { id: 'silver_scalpel', name: '镀银手术刀',       cat: 'tool',  desc: '沈岚的随身锐器，锋利异常且含银抑煞，既可刻木偶八字，亦能挑断尸口红线。' },
    vib_sensor:     { id: 'vib_sensor',     name: '便携震动感应器',   cat: 'tool',  desc: '陈默的改装器材，贴于廊柱后可于拓扑图实时标出外院账房伥精确方位。' },

    // 拔出的三枚厌胜钉（不占5格背囊，记在专项进度里，同时也可作为证物展示）
    nail_1:         { id: 'nail_1',         name: '第一钉·子午封瓮钉', cat: 'nail', desc: '自西厢雕花暖榻下瓦瓮起出的镇宅铁钉。' },
    nail_2:         { id: 'nail_2',         name: '第二钉·倒插丧门钉', cat: 'nail', desc: '自宗祠昭穆总牌背底旋出的七寸倒刺丧门钉，可作 IF③ 反钉棺底的利器！' },
    nail_3:         { id: 'nail_3',         name: '第三钉·盲目连心钉', cat: 'nail', desc: '自正厅无目遗像双目砖缝起出的双股铜钉。' },

    // IF 线专属跨场奇物
    bone_clapper:   { id: 'bone_clapper',   name: '引魂竹骨梆（D+奇物）', cat: 'relic', desc: 'IF①唯一战利品：老仆秦伯自焚留下的规则竹梆，后续考场敲击可强制偏转低阶灵体仇恨。' },
    blood_jade:     { id: 'blood_jade',     name: '乙丑借命压舌血玉（C-邪物）', cat: 'relic', desc: 'IF②唯一战利品：裴敬之含于口中百年的邪玉，濒死可强行锁血一次，但每场额外扣除精血修复费。' }
  };

  // 二进十节点地图拓扑
  const ROOMS = {
    gate: {
      id: 'gate', name: '朱漆霜封大门', short: '正门', court: 1,
      sceneKey: 'gate', x: 50, y: 92,
      neighbors: ['courtyard'],
      descDay1: '两扇三寸厚的朱漆大门被白雾凝成的暗青黑霜死死焊住，门环结着硬冰，手一碰就会粘掉皮肉。',
      descDay2: '晨光勉强透进院墙，大门上的黑霜仍未融化，铁链锁扣死死咬合。',
      descNight2: '黑雾如墨浪翻涌在门缝之外，粗铁链绷得笔直，散发着刺骨阴寒。'
    },
    courtyard: {
      id: 'courtyard', name: '前院青石天井', short: '前院', court: 1,
      sceneKey: 'courtyard', x: 50, y: 74,
      neighbors: ['gate', 'west', 'hall', 'shrine', 'east'],
      descDay1: '青石板长满湿滑青苔，白雾在三丈高的马头墙头缓缓倒卷。西侧厢房门闩紧实，东侧宗祠香雾阴沉，正北主厅门扇半敞。',
      descDay2: '白昼院中雾气稍薄，石阶缝里凝着隔夜的黑水渍，正厅后方通往二进内宅的月洞门已无声洞开。',
      descNight2: '更梆声在青砖高墙间来回撞出冷硬回音，天井里没有任何遮蔽物，滞留极易与巡夜账房伥撞个正着。'
    },
    west: {
      id: 'west', name: '西厢·签押账灶房', short: '西厢', court: 1,
      sceneKey: 'west', x: 18, y: 58,
      neighbors: ['courtyard', 'hall'],
      descDay1: '外间是旧灶房，灶膛残留微弱灰烬与冷猪油罐；里间是账房，靠墙一张宽大雕花暖榻，案几摆着暗红账册与铜妆匣。厚实熟铁门闩完好。',
      descDay2: '晨光照进格栅窗，雕花暖榻下的地砖缝透着一股潮土腥气，账桌抽屉半开。',
      descNight2: '木门紧闭，窗纸外随时可能掠过无目账房伥佝偻的暗影。'
    },
    hall: {
      id: 'hall', name: '中央正厅·无目遗像堂', short: '正厅', court: 1,
      sceneKey: 'hall', x: 50, y: 56,
      neighbors: ['courtyard', 'west', 'east', 'corridor'],
      descDay1: '四面花格木窗朽烂漏风。正中太师壁上挂着一幅巨大的民国盐商行乐图——画中老人双目被人从背面硬生生捅成两个黑洞，下方神龛紧锁。',
      descDay2: '正厅后侧原本锁死的穿堂月洞门已豁然洞开，露出阴森深邃的二进院落。',
      descNight2: '画像那对黑洞洞的眼窝仿佛正盯着厅中每一个人，夹壁深处隐约传来铜铃细不可闻的震颤。'
    },
    east: {
      id: 'east', name: '东厢·木匠柴房', short: '东厢', court: 1,
      sceneKey: 'east', x: 82, y: 56,
      neighbors: ['courtyard', 'hall', 'shrine'],
      descDay1: '木窗半塌、门闩缺失的破旧柴房。角落干草堆里蜷缩着一具百年不腐的木匠干尸，十指指甲翻裂，怀中紧抱着油布册子与墨斗扁凿。',
      descDay2: '借着天光可见柴房门框内侧密密麻麻刻满指甲血痕，墙角还堆着半袋生石灰与朽木桌椅。',
      descNight2: '冷风顺着破窗灌进柴房，唯靠门槛上的朱砂墨线与斜撑木障才能隔绝阴煞。'
    },
    shrine: {
      id: 'shrine', name: '东侧宗祠·泄阴池', short: '宗祠', court: 1,
      sceneKey: 'shrine', x: 82, y: 74,
      neighbors: ['courtyard', 'east'],
      descDay1: '地势比天井低了两级台阶。三层黑漆楠木灵位森然排列，香炉里的香灰却潮湿结块，青砖缝隐隐泛着黑水寒气，仅有一扇正门无后窗。',
      descDay2: '隔夜倒灌的黑水已缓缓退回地砖缝中，留下满地滑腻淤泥与腥臭。供桌正中的《裴氏昭穆总牌》沉重异常。',
      descNight2: '祠堂地面再度渗出齐踝冰冷黑水，阴寒刺骨，水下石栓隐约传来暗渠空响。'
    },
    corridor: {
      id: 'corridor', name: '二进穿堂·更钟廊', short: '二进穿堂', court: 2,
      sceneKey: 'hall', x: 50, y: 40,
      neighbors: ['hall', 'inner_study', 'coffin_hall', 'embroidery_loft', 'well'],
      descDay1: '厚重的酸枝木月洞门从内侧反锁，铁栓纹丝不动。',
      descDay2: '连通前宅与后宅的回廊，檐下挂着一口青铜哑钟。东侧通往内书房，正北为后罩房停棺堂，西侧木梯上西绣楼，穿廊尽头通往后院枯井。',
      descNight2: '穿堂风声呜咽，这里既是外院账房伥巡线的折返点，也是内宅裴氏尸煞踏出停棺堂的必经之路。'
    },
    inner_study: {
      id: 'inner_study', name: '内书房·东家暗账阁', short: '内书房', court: 2,
      sceneKey: 'inner_study', x: 82, y: 34,
      neighbors: ['corridor', 'coffin_hall'],
      descDay2: '江南盐商的私密书斋。紫檀书案上静放着一只镶有四道黄铜鲁班滑尺的暗榫木匣，画筒里插着泛黄的《裴氏宗祠水脉改道图说》。',
      descNight2: '书房死寂，窗外白雾贴着窗棂翻滚，稍有重响便会惊动隔壁停棺堂里的东西。'
    },
    coffin_hall: {
      id: 'coffin_hall', name: '后罩房·川楠停棺堂', short: '停棺堂', court: 2,
      sceneKey: 'coffin_hall', x: 50, y: 24,
      neighbors: ['corridor', 'inner_study', 'well'],
      descDay2: '终年不见日光的森冷停棺堂。正中太师椅上端坐着穿暗红团花寿衣的裴敬之干尸，眼窝钉着两枚古铜钱，嘴唇死死抿合；椅旁停着一口未合盖的上等川楠木空寿材。',
      descNight2: '白烛无火自燃泛着青光，太师椅上的干尸随时可能离座索命，川楠寿材内散发着浓烈腐朽阴气。'
    },
    embroidery_loft: {
      id: 'embroidery_loft', name: '西绣楼·少奶奶旧居', short: '西绣楼', court: 2,
      sceneKey: 'embroidery_loft', x: 18, y: 34,
      neighbors: ['corridor', 'well'],
      descDay2: '幽暗破败的民国闺阁。绣绷上绷着半幅带暗褐血渍的鸳鸯素帕，梳妆台敞着一只樟木药奁，高处房梁垂着半截被剪断的旧白绫。',
      descNight2: '绣楼木地板踩上去极易发出吱呀声响，窗户正对后院枯井，视野极佳。'
    },
    well: {
      id: 'well', name: '后院枯井与千斤水闸', short: '后院枯井', court: 2,
      sceneKey: 'well', x: 50, y: 12,
      neighbors: ['corridor', 'coffin_hall', 'embroidery_loft', 'canal'],
      descDay2: '深不见底的石砌水井连着暗渠，井旁架着一台锈迹斑斑的熟铁千斤水闸绞盘，配有铜锁与粗铁链，边上搁着铁钩麻绳。',
      descNight2: '枯井深处传来黑水激荡的闷响，这里适合挂铜壶设声饵，也是开闸冲毁河埠铁栅的枢纽。'
    },
    canal: {
      id: 'canal', name: '后门·黑水河埠', short: '黑水河埠', court: 2,
      sceneKey: 'canal', x: 18, y: 12,
      neighbors: ['well'],
      descDay2: '青石台阶没入墨黑冰冷的河水。一道粗壮生锈的水封铁栅死死拦住河口；石阶旁拴着一艘船底裂了指宽缝隙的旧乌篷船，船棚角落扔着桐油桶与麻絮。浑浊水底隐约反着一点铁锈光。',
      descNight2: '黑水无波，浓白死雾低低贴在水面三寸之上。只要铁栅被激流冲开、船缝捻严，便能摇橹破雾逃生。'
    }
  };

  // 六名同行考生初始档案
  const NPC_TEMPLATES = {
    zhou: {
      id: 'zhou', code: 'CN-04118', name: '周衡', role: '前消防班长 · 历3场老手',
      gear: 'D+破邪消防短斧 / D级镇魂风灯',
      hp: 130, maxHp: 130, alive: true, room: 'courtyard',
      trust: 45, suspicion: 20, emotion: 'calm',
      secret: '早就瞥见沈岚袖口沾着桐木屑，但在你证明能不靠替死鬼破局前，他的底线是先保老搭档陈默和自己活。'
    },
    shen: {
      id: 'shen', code: 'CN-06302', name: '沈岚', role: '前急诊药师 · 历2场老手',
      gear: '镀银手术刀 / 治疗喷雾 / 冷光笔灯 / 黑市【桐木替死偶】',
      hp: 100, maxHp: 100, alive: true, room: 'courtyard',
      trust: 40, suspicion: 15, emotion: 'calm',
      cursed: true, exposed: false, alliedDark: false,
      secret: '上场染上必死阴咒，倾家荡产换来一次性桐木替死偶，企图借西厢暖榻与鎏金怀表找新人替死。'
    },
    chen: {
      id: 'chen', code: 'CN-06895', name: '陈默', role: '前汽修工 · 历2场老手',
      gear: '高频破拆改锥 / 便携震动感应器',
      hp: 110, maxHp: 110, alive: true, room: 'courtyard',
      trust: 50, suspicion: 10, emotion: 'calm',
      secret: '命是周衡救的，平时嘴贫护短，唯周衡马首是瞻；极擅长机械绞盘、铁闸与船体修补。'
    },
    zhao: {
      id: 'zhao', code: 'CN-08144', name: '赵川', role: '前长途司机 · 历1场老手',
      gear: '贴身藏匿的【D级低阶镇宅黄符】',
      hp: 105, maxHp: 105, alive: true, room: 'courtyard',
      trust: 30, suspicion: 35, emotion: 'tense',
      secret: '上场靠躲祠堂烧符侥幸活命，偏执地认定老考生排挤自己抢生路；但若被你救回一命会极讲义气。'
    },
    lin: {
      id: 'lin', code: 'CN-09472', name: '林哲', role: '投行经理 · 0场新人',
      gear: '凡人面板（金丝眼镜、湿皱西装）',
      hp: 85, maxHp: 85, alive: true, room: 'courtyard',
      trust: 35, suspicion: 25, emotion: 'tense',
      tabooGift: false, tabooCouch: false, tabooAnswer: false,
      secret: '精于算计却慕强短视，急于抱沈岚大腿而抢走怀表与暖榻；得知真相后甚至可能狗急跳墙嫁祸苏晓。'
    },
    su: {
      id: 'su', code: 'CN-09473', name: '苏晓', role: '古建系大三学生 · 0场新人',
      gear: '速写炭笔 / 木工小折尺',
      hp: 80, maxHp: 80, alive: true, room: 'courtyard',
      trust: 50, suspicion: 5, emotion: 'tense',
      secret: '胆小但有古建专业眼——看穿正厅画像眼窝是从背面硬捅穿的，且亲眼瞥见沈岚往怀表里刮带酒精味的白色木屑。'
    }
  };

  // 死考空间 · 深红旋涡兑换目录（支持 D 级基础权限 & IF③ 解锁的 C 级查看权限）
  const SHOP_ITEMS = [
    { id: 'C002', tier: 'D', cat: '古典神话', name: '青铜古法剑（凡胎破邪）', price: 20, desc: '青铜铸就、刻有辟邪云雷纹，对规则残灵与低阶尸煞具备稳定破防效果，是性价比极高的首考起手兵刃。' },
    { id: 'C003', tier: 'D', cat: '古典神话', name: '百年雷击枣木剑', price: 30, desc: '引天雷余威淬炼的道门法剑，对阴煞、尸毒与厌胜邪物造成额外灼烧压制，第2场《黑水船坞》利器。' },
    { id: 'B002', tier: 'D', cat: '血统', name: '下品伪灵根（青木／金）', price: 15, desc: '迈入古典修仙路线的最低门槛，可炼化极微弱真元温养法剑与符箓，为后续守御剑道打底。' },
    { id: 'B003', tier: 'D', cat: '血统', name: '古武横练胚子（铁布衫初阶）', price: 15, desc: '周衡同源的凡胎打熬底子，提升 PHY +2 与硬抗钝击/阴寒耐受度。' },
    { id: 'B008', tier: 'D', cat: '血统', name: '神经反射强化（基础版）', price: 20, desc: '轻微强化脊髓神经传导，提升 AGI +2 与危机反应容错。' },
    { id: 'T004', tier: 'D', cat: '科技', name: '战术冷光头灯＋微光夜视镜', price: 12, desc: '零热源军规光学器材，完全免疫对明火敏感的灵异考场惩罚。' },
    { id: 'T009', tier: 'D', cat: '科技', name: '改装高频震动传感套件', price: 15, desc: '陈默同款布防利器，可提前 30 米捕捉非视觉潜行目标的步频方位。' },
    { id: 'S005', tier: 'D', cat: '灵异', name: '镇宅破煞黄符（3 张一匣）', price: 12, desc: '一次性道门定身符，可硬控 D～C- 级尸煞或怨灵 1 个行动回合。' },
    { id: 'S011', tier: 'D', cat: '灵异', name: '阴契屏蔽银符（黑市散件）', price: 18, desc: '短时遮蔽活人气息与血脉共鸣，避免被凶宅类规则直接锁定。' },
    { id: 'G001', tier: 'D', cat: '耗材', name: '死考特制治疗喷雾（2 支）', price: 10, desc: '瞬间止血封口并恢复 45 点 HP，有效切断循血索敌类怪物的追踪。' },
    { id: 'G004', tier: 'D', cat: '耗材', name: '高能压缩干粮与强心针', price: 8,  desc: '长线多昼夜考场必备，恢复精力 STA 并抵抗失温与精神冲击。' },
    // C 级目录（默认锁定，IF③ 七人逆命真结局解锁 C 级查看权！）
    { id: 'C001', tier: 'C', cat: '古典神话', name: '《宵练剑经·守御残篇》', price: 45, requiresC: true, desc: '古典不杀守御剑道核心起手残篇！以剑气化障截断攻势与偏转重击，不求杀伐唯守生机。' },
    { id: 'B102', tier: 'C', cat: '血统', name: '上品灵根淬体液', price: 45, requiresC: true, desc: '洗伐凡胎浊气，大幅扩充真元经脉承载，直通二阶筑基门槛。' },
    { id: 'S104', tier: 'C', cat: '灵异', name: '鲁门厌胜镇界罗盘', price: 40, requiresC: true, desc: '一眼勘破阴宅阵眼、夹壁机关与水脉死位的高阶民俗法器。' }
  ];

  global.EXAM1_DATA = {
    ORIGINS,
    ITEMS,
    ROOMS,
    NPC_TEMPLATES,
    SHOP_ITEMS
  };
})(typeof window !== 'undefined' ? window : globalThis);
