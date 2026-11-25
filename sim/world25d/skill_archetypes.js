/* ============================================================================
 * Infinity 2.5D Real-Time Exam Engine — 14 Skill Archetypes & 500-Item Mapper
 * Attaches window.INFINITY.Skills25D (classic script, zero ES module imports)
 * Maps all 500 SHOP_CATALOG items + curated/procedural fused bloodlines into
 * real-time 2.5D combat skills, basic attacks, passives, and build styles.
 * ============================================================================ */
(function (global) {
  'use strict';

  var INFINITY = (global.INFINITY = global.INFINITY || {});

  // ---------------------------------------------------------------------------
  // 1. 14 Real-Time 2.5D Combat Archetypes
  // ---------------------------------------------------------------------------
  var ARCHETYPE_ORDER = [
    'sword_arc',
    'ward_circle',
    'emp_blast',
    'rail_shot',
    'blink_mark',
    'aegis_shield',
    'overclock',
    'heal_pulse',
    'stealth_veil',
    'seal_chain',
    'recon_pulse',
    'turret_drone',
    'decoy_flare',
    'berserk_strike'
  ];

  var ARCHETYPES = {
    sword_arc: {
      id: 'sword_arc',
      name: '剑气弧光斩',
      shortName: '剑弧',
      role: 'offense',
      icon: '⚔',
      defaultColor: '#5ce1c6',
      desc: '挥出扇形弧光剑气，造成范围斩击与击退，并可弹反打断敌方扑击前摇。',
      basePower: 28,
      baseRadius: 3.4,
      baseDuration: 0.45,
      baseCooldown: 3.2,
      baseEnergyCost: 12,
      noise: 18
    },
    ward_circle: {
      id: 'ward_circle',
      name: '画地界·实体结界',
      shortName: '结界',
      role: 'control',
      icon: '◈',
      defaultColor: '#f0c975',
      desc: '在脚下展开旋转发光阵圈，形成实体拒止边界，物理阻挡检票员跨入安全区。',
      basePower: 30,
      baseRadius: 3.8,
      baseDuration: 9.0,
      baseCooldown: 10.5,
      baseEnergyCost: 20,
      noise: 10
    },
    emp_blast: {
      id: 'emp_blast',
      name: 'EMP·雷暴震荡弹',
      shortName: '雷震',
      role: 'control',
      icon: '⚡',
      defaultColor: '#48d1ff',
      desc: '释放环形高压电弧与电磁冲击，短时瘫痪检票员行动并压制站内拟态假播报。',
      basePower: 24,
      baseRadius: 5.2,
      baseDuration: 3.2,
      baseCooldown: 9.0,
      baseEnergyCost: 22,
      noise: 30
    },
    rail_shot: {
      id: 'rail_shot',
      name: '电磁·灵能贯通射线',
      shortName: '贯通',
      role: 'offense',
      icon: '➤',
      defaultColor: '#38f2ff',
      desc: '发射高速穿透光束或特制穿甲弹道，远距精准打击并附带高额破甲效果。',
      basePower: 38,
      baseRadius: 10.5,
      baseDuration: 0.4,
      baseCooldown: 4.5,
      baseEnergyCost: 16,
      noise: 26
    },
    blink_mark: {
      id: 'blink_mark',
      name: '飞雷神·空间闪现',
      shortName: '闪现',
      role: 'mobility',
      icon: '✦',
      defaultColor: '#8fa8ff',
      desc: '掷出空间坐标印记或瞬间折跃位移；再次触发可极速闪回标点脱离绝境。',
      basePower: 18,
      baseRadius: 7.5,
      baseDuration: 8.0,
      baseCooldown: 7.0,
      baseEnergyCost: 16,
      noise: 8
    },
    aegis_shield: {
      id: 'aegis_shield',
      name: '护盾·力场壁垒',
      shortName: '护盾',
      role: 'defense',
      icon: '⛨',
      defaultColor: '#f5b963',
      desc: '构筑环身护体光罩或硬光力场壁，吸收致命伤害并在近身受击时震退敌人。',
      basePower: 42,
      baseRadius: 2.6,
      baseDuration: 6.5,
      baseCooldown: 9.5,
      baseEnergyCost: 18,
      noise: 12
    },
    overclock: {
      id: 'overclock',
      name: '神经超频·剑意极速',
      shortName: '超频',
      role: 'mobility',
      icon: '⏩',
      defaultColor: '#66e3ff',
      desc: '进入神经极速与时间压制态：移速与攻速骤增并留下残影，周遭敌方动作显著变慢。',
      basePower: 26,
      baseRadius: 4.5,
      baseDuration: 5.0,
      baseCooldown: 11.0,
      baseEnergyCost: 22,
      noise: 10
    },
    heal_pulse: {
      id: 'heal_pulse',
      name: '急救·净化光环',
      shortName: '急救',
      role: 'support',
      icon: '✚',
      defaultColor: '#6be585',
      desc: '释放战地医疗或清心净化脉冲，持续恢复自身及附近队友的生命值与理智值。',
      basePower: 26,
      baseRadius: 5.0,
      baseDuration: 3.5,
      baseCooldown: 10.0,
      baseEnergyCost: 18,
      noise: 6
    },
    stealth_veil: {
      id: 'stealth_veil',
      name: '隐匿·屏息潜行',
      shortName: '潜行',
      role: 'stealth',
      icon: '◐',
      defaultColor: '#a29bfe',
      desc: '进入半透明光学/气息遮蔽态，大幅降低脚步声响与存在感，强行脱离检票员锁定。',
      basePower: 22,
      baseRadius: 2.2,
      baseDuration: 6.5,
      baseCooldown: 11.0,
      baseEnergyCost: 15,
      noise: 0
    },
    seal_chain: {
      id: 'seal_chain',
      name: '天之锁·镇煞封禁',
      shortName: '封禁',
      role: 'control',
      icon: '⛓',
      defaultColor: '#e05882',
      desc: '射出规则锁链或镇压媒介，锁死敌方移动速度并持续叠加异常收容封印进度。',
      basePower: 24,
      baseRadius: 6.2,
      baseDuration: 4.8,
      baseCooldown: 8.5,
      baseEnergyCost: 18,
      noise: 14
    },
    recon_pulse: {
      id: 'recon_pulse',
      name: 'PKE·洞察声呐',
      shortName: '洞察',
      role: 'recon',
      icon: '◎',
      defaultColor: '#68e3b7',
      desc: '发射穿墙灵质/声呐扫描波，实时高亮检票员位置、沈砚动向与隐藏线索点。',
      basePower: 20,
      baseRadius: 16.0,
      baseDuration: 6.0,
      baseCooldown: 8.0,
      baseEnergyCost: 12,
      noise: 4
    },
    turret_drone: {
      id: 'turret_drone',
      name: '布阵无人机·召唤炮台',
      shortName: '炮台',
      role: 'summon',
      icon: '❖',
      defaultColor: '#5ca4ff',
      desc: '在当前位置部署自动警戒无人机、机关傀儡或浮游阵台，持续索敌射击并压制通道。',
      basePower: 22,
      baseRadius: 6.5,
      baseDuration: 12.0,
      baseCooldown: 13.0,
      baseEnergyCost: 24,
      noise: 16
    },
    decoy_flare: {
      id: 'decoy_flare',
      name: '声噪诱饵·幻象投掷',
      shortName: '诱饵',
      role: 'stealth',
      icon: '✧',
      defaultColor: '#ffd166',
      desc: '向目标方向投掷声噪诱饵、替身草人或全息幻象，制造高分贝假声波引开检票员。',
      basePower: 20,
      baseRadius: 8.5,
      baseDuration: 6.5,
      baseCooldown: 9.0,
      baseEnergyCost: 14,
      noise: 4
    },
    berserk_strike: {
      id: 'berserk_strike',
      name: '暴君·近战重击',
      shortName: '重击',
      role: 'offense',
      icon: '☄',
      defaultColor: '#ff7b47',
      desc: '短距爆发突进并发动势大力沉的震地重砸，造成极高伤害、强硬直与剧烈震屏。',
      basePower: 46,
      baseRadius: 3.2,
      baseDuration: 0.7,
      baseCooldown: 5.5,
      baseEnergyCost: 18,
      noise: 34
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Tier & EnergyType Scaling Tables
  // ---------------------------------------------------------------------------
  var TIER_RANK = { D: 0, C: 1, B: 2, A: 3, S: 4 };

  var TIER_SCALE = {
    D: { power: 1.00, radius: 1.00, duration: 1.00, cooldown: 1.00, cost: 1.00 },
    C: { power: 1.25, radius: 1.10, duration: 1.14, cooldown: 0.95, cost: 1.15 },
    B: { power: 1.55, radius: 1.22, duration: 1.28, cooldown: 0.90, cost: 1.30 },
    A: { power: 1.95, radius: 1.35, duration: 1.44, cooldown: 0.85, cost: 1.48 },
    S: { power: 2.45, radius: 1.50, duration: 1.62, cooldown: 0.80, cost: 1.68 }
  };

  // Neon VFX colors keyed by energyType + archetype accent nuance
  var ENERGY_PALETTES = {
    '真元': {
      primary: '#f0c975',
      secondary: '#5ce1c6',
      high: '#ffe184',
      byArchetype: {
        sword_arc: '#5ce1c6',
        ward_circle: '#f0c975',
        aegis_shield: '#f5cf76',
        heal_pulse: '#6be8b8',
        blink_mark: '#66f0d8',
        overclock: '#72f2d2',
        recon_pulse: '#5ce1c6',
        seal_chain: '#e8b95a',
        emp_blast: '#6ce8df',
        rail_shot: '#76f2d8',
        stealth_veil: '#65ccb8',
        turret_drone: '#e6c26e',
        decoy_flare: '#f5d782',
        berserk_strike: '#f0b85b'
      }
    },
    '科技': {
      primary: '#48d1ff',
      secondary: '#38f2ff',
      high: '#70e4ff',
      byArchetype: {
        emp_blast: '#48d1ff',
        rail_shot: '#38f2ff',
        overclock: '#63d8ff',
        turret_drone: '#5ca4ff',
        recon_pulse: '#4ae8d5',
        aegis_shield: '#52b8ff',
        stealth_veil: '#6b9cff',
        decoy_flare: '#ffd166',
        heal_pulse: '#5ce6a0',
        blink_mark: '#78b7ff',
        ward_circle: '#48d1ff',
        sword_arc: '#4ef0ff',
        seal_chain: '#5e9eff',
        berserk_strike: '#ff8a5c'
      }
    },
    '灵异': {
      primary: '#e05882',
      secondary: '#c75cf5',
      high: '#ff6699',
      byArchetype: {
        seal_chain: '#e05882',
        ward_circle: '#d45ea8',
        stealth_veil: '#b66dff',
        recon_pulse: '#e872a8',
        decoy_flare: '#df6ce0',
        aegis_shield: '#e6637c',
        heal_pulse: '#d978c4',
        blink_mark: '#c75cf5',
        rail_shot: '#f05688',
        emp_blast: '#d65cf0',
        turret_drone: '#c95c9e',
        sword_arc: '#eb577a',
        overclock: '#d468f2',
        berserk_strike: '#f04a6c'
      }
    },
    '体魄': {
      primary: '#ff7b47',
      secondary: '#ff9f43',
      high: '#ff965a',
      byArchetype: {
        berserk_strike: '#ff7b47',
        aegis_shield: '#ff9f43',
        overclock: '#ff884d',
        sword_arc: '#ff9457',
        rail_shot: '#ff6b47',
        blink_mark: '#ffaa5c',
        heal_pulse: '#f7b267',
        ward_circle: '#eb8c4c',
        emp_blast: '#ff7f3f',
        stealth_veil: '#e38768',
        seal_chain: '#e66b4c',
        recon_pulse: '#ffb067',
        turret_drone: '#f28d52',
        decoy_flare: '#ffbe55'
      }
    },
    '魔力': {
      primary: '#a97bff',
      secondary: '#7d8cff',
      high: '#c89eff',
      byArchetype: {
        ward_circle: '#b584ff',
        seal_chain: '#c978ff',
        blink_mark: '#7d8cff',
        aegis_shield: '#9d8cff',
        heal_pulse: '#7ae8c8',
        emp_blast: '#8ea8ff',
        rail_shot: '#b07aff',
        sword_arc: '#9980ff',
        overclock: '#8c9eff',
        stealth_veil: '#9c7ae6',
        recon_pulse: '#87b5ff',
        turret_drone: '#a882ff',
        decoy_flare: '#d48cff',
        berserk_strike: '#d46bff'
      }
    },
    '通用': {
      primary: '#68e3b7',
      secondary: '#ffd166',
      high: '#8ef0cc',
      byArchetype: null
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Curated Exact Overrides (Iconic Canon, Presets, & Fused Bloodlines)
  // ---------------------------------------------------------------------------
  var CURATED_ARCHETYPE_BY_ID = {
    // Starter preset items (ensure distinct, lore-accurate kits)
    B026: 'sword_arc',      // 先天剑骨雏形
    C001: 'sword_arc',      // 宵练剑意·入门残篇
    C002: 'sword_arc',      // 青铜古法剑
    C005: 'ward_circle',    // 画地界（入门阵牌）
    A008: 'aegis_shield',   // 抗声模因隔音耳塞（隔绝听觉污染防护）
    G001: 'heal_pulse',     // 治疗喷雾／治疗胶囊

    B041: 'overclock',      // 军用赛博神经底盘
    T001: 'rail_shot',      // 常规制式枪械与弹药
    T002: 'decoy_flare',    // 破片／闪光／烟雾战术手雷套（诱饵爆破/脱战）
    T003: 'aegis_shield',   // 防弹凯夫拉战术背心
    T004: 'recon_pulse',    // PKE 灵质探测器
    T006: 'recon_pulse',    // 红外热成像仪
    T008: 'emp_blast',      // 门禁与电子锁破解器
    M002: 'ward_circle',    // 注连绳与纸垂套件

    B027: 'aegis_shield',   // 道门守心体
    A002: 'seal_chain',     // 便携黄金小匣
    A003: 'recon_pulse',    // 信息隔离与模因辨识手册
    A004: 'recon_pulse',    // 老式无网拍立得与机械表

    // Signature canon & high-tier items
    B009: 'overclock',      // 猎魔人青草试炼残效
    B022: 'berserk_strike', // 暴君实验体
    B031: 'stealth_veil',   // 青丘狐裔（薄血）
    B061: 'ward_circle',    // 间流结界师灵体
    B066: 'overclock',      // 机械义脑超频者
    B079: 'recon_pulse',    // 重明鸟残血（双瞳破妄）
    B080: 'berserk_strike', // 金乌薄血（炽烈纯阳之躯）
    B091: 'blink_mark',     // 时空行者雏形
    B096: 'aegis_shield',   // 后土厚德残血
    C009: 'blink_mark',     // 崂山穿墙术（残）
    C012: 'turret_drone',   // 基础机关木傀儡
    C017: 'recon_pulse',    // 传音纸鹤（跨屏蔽通讯侦察）
    C018: 'decoy_flare',    // 替身草人（粗制）
    C046: 'seal_chain',     // 捆仙绳·仿制丝
    C051: 'seal_chain',     // 法海金钵
    C056: 'blink_mark',     // 缩地成寸（短距）
    C061: 'aegis_shield',   // 墨家机关玄武甲
    C066: 'sword_arc',      // 承影剑意
    C091: 'blink_mark',     // 两仪微尘·单门残枢
    M011: 'decoy_flare',    // 基础忍具包（苦无＋起爆符）
    M028: 'decoy_flare',    // 替身术（忍者基础）
    M041: 'seal_chain',     // 鬼道·六十一·六杖光牢
    M071: 'aegis_shield',   // 炽天覆七重圆环
    M076: 'ward_circle',    // 间流·真界雏形
    T029: 'emp_blast',      // 全频段信号干扰器
    T037: 'aegis_shield',   // 投射屏障发生器（大锤盾）
    T041: 'sword_arc',      // 光剑（标准晶核）
    T057: 'blink_mark',     // 星际相位棱镜
    T061: 'blink_mark',     // 微型曲率跃迁腰带
    T065: 'turret_drone',   // 反重力悬浮剑台／无人机母巢
    T073: 'overclock',      // 局部时间泡发生器
    T077: 'emp_blast',      // 全域绝对静默塔
    A017: 'aegis_shield',   // 半截红色鬼烛
    A021: 'blink_mark',     // 学徒魔药
    A029: 'rail_shot',      // 纯金弹头特制左轮
    A033: 'decoy_flare',    // 戏法大师
    A037: 'stealth_veil',   // 便携逆模因遮蔽器
    A065: 'seal_chain',     // 死机棺材钉
    G025: 'berserk_strike', // 重击蓄势·破甲一击
    G041: 'overclock',      // 全局撤退令（团队提速）
    G057: 'seal_chain',     // 同归于尽锁链
    G061: 'berserk_strike', // 毁灭之力

    // Fused bloodlines
    FUS_MOJIA_CYBER: 'turret_drone',
    FUS_DAO_GHOST_VESSEL: 'seal_chain',
    FUS_ABSOLUTE_REALM: 'ward_circle',
    FUS_COLD_SPIRIT_ROOT: 'sword_arc'
  };

  // ---------------------------------------------------------------------------
  // 4. Weighted Keyword & Metadata Classification Rules (All 14 Archetypes)
  // ---------------------------------------------------------------------------
  var ARCHETYPE_RULES = [
    {
      id: 'sword_arc',
      nameStrong: /剑|刀|刃|斩|居合|剑意|剑骨|剑气|剑诀|御剑|冷兵器|剑修|剑胚|剑阵/,
      nameWeak: /锋|劈|刺|武学|枪剑/,
      descStrong: /斩击|御剑|飞剑|剑气|剑意|剑光|冷兵器|劈斩|弹反|截断.*势能|长刀|短剑|剑修/,
      descWeak: /挥砍|剑器|刀锋|近战武器|古武/,
      tags: { '剑修': 4.5, '爆发': 0.6 },
      roles: { burst: 0.9 }
    },
    {
      id: 'ward_circle',
      nameStrong: /画地界|结界|阵盘|阵法|阵眼|注连绳|盐线|法坛|庇护|真界|定界|安全区|阵符|八卦|奇门|道场|墨斗|护界|营地/,
      nameWeak: /阵|界|符坛|隔热|法脉|结界师|灵根|筑基/,
      descStrong: /结界|阵圈|阻挡.*越界|实体边界|仪式边界|封门窗|安全区|鬼域|隔离.*通道|布阵|阵地|庇护区|护住营地|限位|拒止/,
      descWeak: /阵法|符箓|法坛|边界|领域|空间通路/,
      tags: { '结界': 4.8, '阵法': 3.2, '东方修真': 0.5 },
      roles: { control: 1.0, defense: 0.7 }
    },
    {
      id: 'emp_blast',
      nameStrong: /EMP|电磁脉冲|雷暴|雷法|雷击|五雷|掌心雷|闪电|电弧|干扰器|静默塔|震撼弹|破解器|黑客|侵入针|磁暴|断电|雷霆|过载|云爆|短路/,
      nameWeak: /雷|电|电磁|脉冲|微波|闪光|频段|高压|信号|病毒|干扰/,
      descStrong: /电磁脉冲|瘫痪.*电子|瘫痪|干扰.*通讯|无线通讯|信号干扰|高压电弧|雷击|雷电|黑客入侵|门禁|电子锁|静默|震荡|短路|夺取.*控制权|压制.*广播/,
      descWeak: /电弧|电磁|闪电|爆破|超压|电流/,
      tags: { '电磁': 2.6, '黑客': 3.4, '火焰雷法': 1.4 },
      roles: { control: 0.9, burst: 0.7 }
    },
    {
      id: 'rail_shot',
      nameStrong: /枪|炮|左轮|步枪|狙击|电磁炮|高斯|激光|等离子|射线|光束|轨道炮|热熔|穿甲|弹头|弹药|飞矢|弓|弩|暗器|飞刀|火器|炮击|重火力|灵能炮|子弹|长矛/,
      nameWeak: /射|弹道|远程|狙|箭|发射器|破甲|火炮|弹/,
      descStrong: /枪械|射击|弹药|穿甲|弹道|光束|射线|激光|穿透|火器|左轮|狙击|远程打击|击穿|飞矢|箭矢|能量束|点射/,
      descWeak: /射程|高甲|破甲|发射|炮火|口径/,
      tags: { '破甲': 3.2, '科技装备': 0.9 },
      roles: { burst: 1.3 }
    },
    {
      id: 'blink_mark',
      nameStrong: /飞雷神|瞬移|闪现|缩地成寸|跃迁|折跃|传送|曲率|相位|时空|空间门|穿梭|遁术|瞬步|鬼影步|空间坐标|学徒魔药|两仪微尘|星门|闪步|穿墙/,
      nameWeak: /空间|位移|穿门|换位|闪烁|行者|步法|折返|坐标|半虚/,
      descStrong: /瞬移|折跃|跃迁|缩地|穿门过墙|半虚化穿墙|空间折跃|空间位移|一步跨出|脱离合围|瞬间移动|传送|坐标.*闪|放逐|穿梭空间|改写局部空间/,
      descWeak: /位移|空间|机动|跨出|短距折跃|身法|穿墙/,
      tags: { '位移': 4.4, '空间': 3.4 },
      roles: { mobility: 3.0 }
    },
    {
      id: 'aegis_shield',
      nameStrong: /护盾|圆盾|大锤盾|镜盾|背心|防弹|装甲|护甲|玄武甲|力场|屏障|金光神咒|护体|壁垒|霸体|护心|圆环|鬼烛|替死|后土|守心|防护服|防毒面具|耳塞|盾|铁布衫|甲/,
      nameWeak: /防护|护具|承伤|防御|隔绝|护身|守御|防爆|抗压|甲虫|护符|滤罐|适应体/,
      descStrong: /护盾|力场|屏障|防弹|护体|吸收.*伤害|抵御.*袭击|硬光屏障|分摊.*重击|承伤|固定掩体|概念拦截|代承.*即死|护住身后|金光护体|格挡|物理抗性|隔绝.*毒气|免疫.*辐射|高韧性躯体/,
      descWeak: /防御|护甲|抗击打|守御|减伤|保命|稳心|抗压|隔绝/,
      tags: { '护盾': 4.5, '抗模因': 1.2 },
      roles: { defense: 2.8 }
    },
    {
      id: 'overclock',
      nameStrong: /超频|神经底盘|义脑|演算脑|时间泡|时停|子弹时间|斯安威斯坦|无想心境|撤退令|加速|极速|神速|八门|肾上腺|神经反射|时间感知|疾行|风步/,
      nameWeak: /神经|时间|演算|提速|迅捷|反应|敏捷|并发|流速|体术|基因优化|下忍|义体兼容/,
      descStrong: /流速减缓|加速己方|神经.*超频|并行计算|提速|移速.*提升|极速|时间停滞|反应速度|敏捷与体术|弹道解算|多线并发|无想|冷静心率|加速/,
      descWeak: /高速|敏捷|神经|算力|时序|身法|反应/,
      tags: { '位移': 1.8, '黑客': 1.2, '团队': 0.5 },
      roles: { mobility: 2.0, support: 0.6 }
    },
    {
      id: 'heal_pulse',
      nameStrong: /治疗|急救|止血|绷带|夹板|清创|喷雾|胶囊|药|圣水|解毒|抗辐射|口粮|净水|醒神|嗅盐|丹药|灵丹|再生|自愈|药人|安神|回魂|疗伤|护生|生机/,
      nameWeak: /医|血奴|血契|净化|回复|恢复|维系体能|稳神|清心|休补|续命/,
      descStrong: /止血|外伤|急救|清创|恢复|治疗|再生|自愈|断肢接续|解毒|抗辐射|唤醒昏迷|维系体能|稳心抗恐惧|精神污染|净化|生命体征|回血|理智|生机/,
      descWeak: /医疗|毒素.*抗性|伤势|疗愈|续航|稳态|安神/,
      tags: { '医疗': 2.6, '团队': 0.8 },
      roles: { support: 2.2 }
    },
    {
      id: 'stealth_veil',
      nameStrong: /隐身|隐匿|潜行|屏息|逆模因|遮蔽|隐形|迷彩|光学迷彩|消音|暗影|匿踪|夜行|狐裔|伪装|百鬼夜行|藏匿|潜伏|无声|遁形|隐蔽/,
      nameWeak: /雾|烟|影|静音|降噪|暗|隐|收敛|气息/,
      descStrong: /难以被.*注意|遮蔽气息|遮蔽视野|光学迷彩|隐身|隐匿|潜行|逆模因|消音|降低.*存在感|无声|脱离锁定|极难被.*识破|暗中|隐蔽布设/,
      descWeak: /伪装|雾气|隐藏|低调|悄声|潜伏/,
      tags: { '隐蔽': 2.4, '抗模因': 0.8 },
      roles: { stealth: 2.8 }
    },
    {
      id: 'seal_chain',
      nameStrong: /天之锁|锁链|捆仙绳|黄金小匣|棺材钉|金钵|六杖光牢|捕灵网|裹尸布|铜钱绳|真名|封印|封禁|镇压|镇煞|镇魂|收容|律令|黑洞|调和命运|拘束|禁锢|锁死|封魔|镇妖/,
      nameWeak: /收容|封|锁|镇|钉|绳|网|钵|匣|压制|规则|凝滞|秩序|枷锁|咒力|蛊/,
      descStrong: /封印|封禁|收容|镇压|锁死|缠缚|束缚|硬控|封锁.*行动|阻断.*杀人规律|彻底沉寂|不可选中|聚拢并压制|隔绝灵异|规则级压制|定身|禁锢|禁止瞬移/,
      descWeak: /控场|压制|锁敌|限制|镇魂|收容|规则/,
      tags: { '收容': 4.4, '规则': 2.0, '灵异': 1.1 },
      roles: { control: 1.4 }
    },
    {
      id: 'recon_pulse',
      nameStrong: /PKE|探测器|雷达|热成像|义眼|洞察|侦察|扫描|阴阳眼|试纸|警报|铜铃|拍立得|机械表|查询|真理之镜|破妄|守望者|天平|问答之书|手册|望远|夜视|听觉|罗盘|寻踪|测谎|观察者|传音|昊天镜/,
      nameWeak: /探测|预警|感知|辨识|视|眼|镜|表|读数|追踪|显形|信息|监测|瞳|槲寄生/,
      descStrong: /探测|侦察|热成像|扫描|预警|察觉.*灵异|辨识|照出.*真实|看穿.*幻|破除.*迷雾|破除.*幻|标定.*弱点|听觉|检验时间错乱|显形|自鸣示警|透视|测距|撒谎|杀意|查询|真相|传递短讯/,
      descWeak: /观察|感知|视野|洞察|发现|定位|预警|双瞳/,
      tags: { '侦察': 4.8, '抗模因': 0.8 },
      roles: { recon: 3.6 }
    },
    {
      id: 'turret_drone',
      nameStrong: /无人机|炮台|浮游|母巢|傀儡|木傀儡|机关手|哨戒|兵马|式神|纸人|魔偶|自律|机器人|机械狗|蜂群|剑台|阴兵|召唤|大衍诀|机关兽|自动机枪|构装/,
      nameWeak: /机关|分神|单元|阵台|布设|部署|联动|阴阳师|召唤物|傀/,
      descStrong: /浮游单元|协同布阵|自动攻击|无人机|傀儡|机关.*组装|召唤|式神|分神操控|炮台|哨戒|自主警戒|拦截网|替身.*执行|机甲|部署.*阵/,
      descWeak: /机械|机关|自动化|阵列|单位|操控/,
      tags: { '阵法': 1.4, '黑客': 1.0 },
      roles: { summon: 3.5, support: 0.4 }
    },
    {
      id: 'decoy_flare',
      nameStrong: /诱饵|幻象|分身|影分身|戏法|全息|假声|声噪|替身草人|替身术|烟雾.*手雷|战术手雷|拌雷|起爆符|信号弹|迷魂|幻术|稻草人|假目标|颠倒五行|拟态诱饵/,
      nameWeak: /迷雾|诱|假象|闪光|戏|欺骗|干扰弹|烟火|爆竹|障眼/,
      descStrong: /诱饵|引开|制造.*假|幻象|分身|替身|戏法|致盲.*遮蔽|拌雷|迷困|假声波|吸引注意|误导|混淆|逃生专精|牵制/,
      descWeak: /迷雾|闪光|脱战|干扰|迷惑|牵制/,
      tags: { '隐蔽': 1.0, '耗材': 0.7 },
      roles: { control: 0.5 }
    },
    {
      id: 'berserk_strike',
      nameStrong: /暴君|重击|狂暴|狼人|巨人|泰坦|蓄势|破甲一击|毁灭之力|兵王|兽化|龙裔|应龙|金乌|怪力|霸王|狂战|金刚|拳|重锤|战斧|铁拳|撞击|冲锋|过载引爆|断臂求生|血怒|肉身|石像鬼|卢恩|山魈|将臣/,
      nameWeak: /体魄|力量|近战|搏击|猛击|撕裂|暴力|巨力|蛮力|硬撼|搏杀|纯阳|半神/,
      descStrong: /重击|穿透重击|毁灭级|扑杀|半兽化|近战|格斗|力量.*强化|极强巨力|爆发.*破坏|引爆.*炸裂|龙威|冲锋|剧烈震|猛砸|挣脱|撕裂|硬碰硬|体能|纯阳之躯|前排主/,
      descWeak: /体魄|暴力|爆发|近身|气血|格斗|狂躁|巨力|嗜血/,
      tags: { '爆发': 3.2, '赌命': 1.8 },
      roles: { burst: 1.8 }
    }
  ];

  // ---------------------------------------------------------------------------
  // 5. Practical Survival Starter Skills (pads hotbar to 4 distinct active keys)
  // ---------------------------------------------------------------------------
  var STARTER_SKILLS = [
    {
      archetype: 'sword_arc',
      itemId: 'STARTER_PARRY_STRIKE',
      name: '剑意格挡/重击',
      tier: 'D',
      color: '#5ce1c6',
      cooldown: 3.5,
      energyCost: 10,
      power: 22,
      radius: 3.1,
      duration: 0.45,
      desc: '求生基础技：以武器或劲气挥出短距弧光斩，击退逼近目标并可打断检票员扑击。',
      icon: ARCHETYPES.sword_arc.icon,
      isStarter: true
    },
    {
      archetype: 'stealth_veil',
      itemId: 'STARTER_HOLD_BREATH',
      name: '屏息潜行',
      tier: 'D',
      color: '#a29bfe',
      cooldown: 10.5,
      energyCost: 12,
      power: 18,
      radius: 2.0,
      duration: 5.5,
      desc: '求生基础技：压低呼吸与脚步频率进入半隐匿态，大幅降噪并干扰检票员声纹追踪。',
      icon: ARCHETYPES.stealth_veil.icon,
      isStarter: true
    },
    {
      archetype: 'recon_pulse',
      itemId: 'STARTER_ACOUSTIC_SCAN',
      name: '声纹倾听',
      tier: 'D',
      color: '#68e3b7',
      cooldown: 7.5,
      energyCost: 10,
      power: 16,
      radius: 13.5,
      duration: 5.0,
      desc: '求生基础技：凝神捕捉地下站台回声与铁轨震动，短时高亮附近敌人、沈砚与关键线索。',
      icon: ARCHETYPES.recon_pulse.icon,
      isStarter: true
    },
    {
      archetype: 'heal_pulse',
      itemId: 'STARTER_FIRST_AID',
      name: '应急止血',
      tier: 'D',
      color: '#6be585',
      cooldown: 10.5,
      energyCost: 14,
      power: 20,
      radius: 4.0,
      duration: 3.0,
      desc: '求生基础技：快速压迫止血并调整呼吸稳住理智，恢复自身及贴身队友少量生命与理智。',
      icon: ARCHETYPES.heal_pulse.icon,
      isStarter: true
    },
    {
      archetype: 'decoy_flare',
      itemId: 'STARTER_DECOY_TOSS',
      name: '掷物诱声',
      tier: 'D',
      color: '#ffd166',
      cooldown: 9.0,
      energyCost: 10,
      power: 16,
      radius: 7.2,
      duration: 5.0,
      desc: '求生备选技：向远端掷出金属杂物制造清脆回响，诱使检票员偏离当前通道。',
      icon: ARCHETYPES.decoy_flare.icon,
      isStarter: true
    },
    {
      archetype: 'aegis_shield',
      itemId: 'STARTER_BRACE_GUARD',
      name: '应急护身壁',
      tier: 'D',
      color: '#f5b963',
      cooldown: 9.5,
      energyCost: 14,
      power: 32,
      radius: 2.4,
      duration: 5.0,
      desc: '求生备选技：凝神架势形成临时防护，吸收即将落下的重击并震退近身威胁。',
      icon: ARCHETYPES.aegis_shield.icon,
      isStarter: true
    }
  ];

  // ---------------------------------------------------------------------------
  // 6. Helper Utilities
  // ---------------------------------------------------------------------------
  function clamp(val, min, max) {
    var n = Number(val);
    if (isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function round1(val) {
    return Math.round(val * 10) / 10;
  }

  function round2(val) {
    return Math.round(val * 100) / 100;
  }

  function normalizeTier(tier) {
    var t = String(tier || 'D').toUpperCase().trim();
    return TIER_SCALE[t] ? t : 'D';
  }

  function lookupItem(itemOrId) {
    if (!itemOrId) return null;
    if (typeof itemOrId === 'object') return itemOrId;
    var id = String(itemOrId);
    var catalog = Array.isArray(INFINITY.SHOP_CATALOG) ? INFINITY.SHOP_CATALOG : [];
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i] && catalog[i].id === id) return catalog[i];
    }
    var recipes = Array.isArray(INFINITY.FUSION_RECIPES) ? INFINITY.FUSION_RECIPES : [];
    for (var j = 0; j < recipes.length; j++) {
      if (recipes[j] && recipes[j].result && recipes[j].result.id === id) {
        return recipes[j].result;
      }
    }
    return { id: id, name: id, tier: 'D', category: 'general', energyType: '通用', desc: '', tags: [] };
  }

  function stableHash(str) {
    var s = String(str || '');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function resolveNeonColor(energyType, archetypeId, tier) {
    var arch = ARCHETYPES[archetypeId] || ARCHETYPES.sword_arc;
    var palette = ENERGY_PALETTES[energyType];
    if (!palette) {
      return arch.defaultColor;
    }
    if (palette.byArchetype && palette.byArchetype[archetypeId]) {
      return palette.byArchetype[archetypeId];
    }
    if (energyType === '通用') {
      return arch.defaultColor;
    }
    if (tier === 'S' || tier === 'A') {
      return palette.high || palette.primary;
    }
    return palette.primary || arch.defaultColor;
  }

  // Strip weakness / negation clauses ("惧强阳雷火", "难隐蔽气息", "不防模因", "防不住穿甲弹")
  // so drawbacks do not misclassify an item into its counter-archetype.
  function sanitizePositiveDesc(rawDesc) {
    return String(rawDesc || '')
      .replace(/(?:惧|畏惧|难隐蔽|不防|防不住|不免疫|不含|无法|对.*无效|对.*乏力)[^，。；！]*/g, ' ');
  }

  // ---------------------------------------------------------------------------
  // 7. Deterministic Archetype Resolver for ANY Item (500 Catalog + Custom)
  // ---------------------------------------------------------------------------
  function classifyArchetype(item) {
    if (!item || typeof item !== 'object') return 'sword_arc';

    // 1) Exact curated match for iconic / preset / fused IDs
    if (item.id && CURATED_ARCHETYPE_BY_ID[item.id]) {
      return CURATED_ARCHETYPE_BY_ID[item.id];
    }

    var name = String(item.name || '');
    var desc = sanitizePositiveDesc(item.desc || '');
    var source = String(item.source || '');
    var category = String(item.category || '');
    var energyType = String(item.energyType || '');
    var tags = Array.isArray(item.tags) ? item.tags : [];
    var role = item.activeSkill && item.activeSkill.role ? String(item.activeSkill.role) : '';

    var tagSet = Object.create(null);
    for (var t = 0; t < tags.length; t++) {
      tagSet[tags[t]] = true;
    }

    var scores = Object.create(null);
    for (var i = 0; i < ARCHETYPE_ORDER.length; i++) {
      scores[ARCHETYPE_ORDER[i]] = 0;
    }

    // 2) Weighted pattern matching across all 14 archetypes
    for (var r = 0; r < ARCHETYPE_RULES.length; r++) {
      var rule = ARCHETYPE_RULES[r];
      var s = 0;

      if (rule.nameStrong && rule.nameStrong.test(name)) s += 13.5;
      if (rule.nameWeak && rule.nameWeak.test(name)) s += 5.5;
      if (rule.descStrong && rule.descStrong.test(desc)) s += 7.0;
      if (rule.descWeak && rule.descWeak.test(desc)) s += 2.8;

      if (rule.tags) {
        var tKeys = Object.keys(rule.tags);
        for (var k = 0; k < tKeys.length; k++) {
          if (tagSet[tKeys[k]]) s += rule.tags[tKeys[k]];
        }
      }

      if (rule.roles && role && rule.roles[role]) {
        s += rule.roles[role];
      }

      scores[rule.id] += s;
    }

    // 3) Subtle category, energyType, and source thematic nudges
    if (category === 'cultivation') {
      scores.sword_arc += 1.4;
      scores.ward_circle += 1.3;
    } else if (category === 'tech') {
      scores.rail_shot += 1.1;
      scores.emp_blast += 1.1;
      scores.turret_drone += 0.8;
      scores.overclock += 0.8;
    } else if (category === 'anomaly') {
      scores.seal_chain += 1.5;
      scores.recon_pulse += 1.1;
      scores.stealth_veil += 0.9;
    } else if (category === 'myth') {
      scores.ward_circle += 1.1;
      scores.seal_chain += 1.1;
      scores.aegis_shield += 0.9;
    } else if (category === 'bloodline') {
      if (energyType === '体魄') scores.berserk_strike += 2.4;
      if (energyType === '科技') scores.overclock += 1.8;
      if (energyType === '真元') scores.sword_arc += 1.4;
      if (energyType === '灵异') scores.seal_chain += 1.1;
    } else if (category === 'general') {
      scores.heal_pulse += 0.9;
      scores.decoy_flare += 0.7;
    }

    if (source) {
      if (/火影|忍者/.test(source)) {
        scores.blink_mark += 1.8;
        scores.decoy_flare += 1.6;
      }
      if (/赛博|科幻|星际|机甲|战锤|生化/.test(source)) {
        scores.rail_shot += 0.9;
        scores.emp_blast += 0.8;
      }
      if (/剑|武侠|蜀山|修真|诛仙|凡人/.test(source)) {
        scores.sword_arc += 1.2;
      }
      if (/诡秘|神秘复苏|SCP|克苏鲁|民俗|道/.test(source)) {
        scores.seal_chain += 1.0;
        scores.recon_pulse += 0.8;
      }
    }

    // 4) Disambiguation heuristics for common overlapping combos
    if (/盾|甲|背心|防护|壁垒|圆环|防毒面具|耳塞/.test(name) && !/剑意|御剑|剑阵|光剑/.test(name)) {
      scores.aegis_shield += 5.0;
    }
    if (/枪|炮|左轮|步枪|狙击|激光|高斯|轨道炮|射线/.test(name)) {
      scores.rail_shot += 5.5;
    }
    if (/无人机|炮台|浮游|母巢|傀儡|式神|纸人|兵马|哨戒|魔偶/.test(name)) {
      scores.turret_drone += 6.0;
    }
    if (/诱饵|幻象|分身|戏法|替身草人|替身术|全息|声噪|拌雷/.test(name)) {
      scores.decoy_flare += 6.5;
    }
    if (/飞雷神|缩地|跃迁|折跃|传送|曲率|相位|瞬移|闪现|空间门/.test(name)) {
      scores.blink_mark += 6.0;
    }
    if (/治疗|急救|止血|绷带|解毒|口粮|净水|醒神|嗅盐|圣水|清创|疗伤|再生/.test(name)) {
      scores.heal_pulse += 5.5;
    }
    if (/隐身|隐匿|潜行|逆模因|光学迷彩|迷彩|消音|匿踪/.test(name)) {
      scores.stealth_veil += 6.0;
    }
    if (/探测|雷达|热成像|义眼|拍立得|机械表|阴阳眼|破妄|查询|试纸|警报|铜铃|辨识手册|问答之书|天平|真理之镜|守望者|观察者|昊天镜/.test(name)) {
      scores.recon_pulse += 6.0;
    }
    if (/EMP|电磁脉冲|干扰器|静默塔|破解器|侵入针|五雷|掌心雷|雷暴|磁暴|震撼弹|云爆/.test(name)) {
      scores.emp_blast += 6.0;
    }
    if (/暴君|重击|狼人|巨人|泰坦|毁灭之力|兵王|应龙|龙裔|霸王|狂暴|金刚|石像鬼|蓄势|山魈|将臣|金乌/.test(name)) {
      scores.berserk_strike += 5.5;
    }
    if (/天之锁|锁链|捆仙绳|棺材钉|金钵|六杖光牢|黄金小匣|捕灵网|裹尸布|镇魂|律令|收容|封印|封禁|黑洞/.test(name)) {
      scores.seal_chain += 6.0;
    }
    if (/超频|神经底盘|义脑|演算脑|时间泡|无想心境|撤退令|时间感知|子弹时间/.test(name)) {
      scores.overclock += 6.0;
    }
    if (/血统融合手续|建队凭证|契约/.test(name)) {
      scores.heal_pulse += 3.0;
      scores.overclock += 2.5;
    }

    // 5) Select highest scoring archetype (deterministic tie-break using item id hash)
    var bestId = ARCHETYPE_ORDER[0];
    var bestScore = -1;
    var tieSeed = stableHash(item.id || name);

    for (var idx = 0; idx < ARCHETYPE_ORDER.length; idx++) {
      var aid = ARCHETYPE_ORDER[idx];
      var val = scores[aid];
      if (val > bestScore) {
        bestScore = val;
        bestId = aid;
      } else if (val === bestScore && bestScore > 0) {
        if (((tieSeed + idx * 7) % 13) > ((tieSeed + ARCHETYPE_ORDER.indexOf(bestId) * 7) % 13)) {
          bestId = aid;
        }
      }
    }

    if (bestScore <= 0) {
      bestId = ARCHETYPE_ORDER[tieSeed % ARCHETYPE_ORDER.length];
    }

    return bestId;
  }

  // ---------------------------------------------------------------------------
  // 8. mapItemToSkill(item)
  // ---------------------------------------------------------------------------
  function mapItemToSkill(itemOrId) {
    var item = lookupItem(itemOrId);
    if (!item) {
      return Object.assign({}, STARTER_SKILLS[0]);
    }

    var archetypeId = classifyArchetype(item);
    var arch = ARCHETYPES[archetypeId] || ARCHETYPES.sword_arc;
    var tier = normalizeTier(item.tier);
    var scale = TIER_SCALE[tier];
    var energyType = String(item.energyType || '通用');
    var discounted = Boolean(item.discounted);

    // Compute scaled combat metrics
    var power = Math.round(arch.basePower * scale.power);
    var radius = round1(arch.baseRadius * scale.radius);
    var duration = round1(arch.baseDuration * scale.duration);

    // Respect item's explicit activeSkill cooldown/cost gently if present, clamped to real-time feel
    var rawCooldown = arch.baseCooldown * scale.cooldown;
    if (item.activeSkill && Number(item.activeSkill.cooldown) > 0) {
      // Blend catalog turn-based cooldown flavor into real-time seconds
      var flavorCd = clamp(Number(item.activeSkill.cooldown) * 2.2, 2.5, 16.0);
      rawCooldown = rawCooldown * 0.78 + flavorCd * 0.22;
    }
    var cooldown = round1(clamp(rawCooldown, 2.0, 18.0));

    var rawCost = arch.baseEnergyCost * scale.cost;
    if (item.activeSkill && Number(item.activeSkill.cost) > 0) {
      var flavorCost = clamp(Number(item.activeSkill.cost), 6, 45);
      rawCost = rawCost * 0.72 + flavorCost * 0.28;
    }
    var energyCost = Math.max(6, Math.round(rawCost));

    // Discounted (打折劣质/高耗) penalty: strictly +20% energyCost
    if (discounted) {
      energyCost = Math.max(energyCost + 1, Math.round(energyCost * 1.2));
    }

    // Power boost for gamble/burst items ("赌命" or "爆发")
    var tags = Array.isArray(item.tags) ? item.tags : [];
    if (tags.indexOf('赌命') !== -1) {
      power = Math.round(power * 1.15);
    }

    var color = resolveNeonColor(energyType, archetypeId, tier);
    var itemDesc = item.desc ? String(item.desc).trim() : '';
    var desc = itemDesc
      ? '[' + arch.name + '] ' + itemDesc
      : arch.desc;

    return {
      archetype: archetypeId,
      itemId: String(item.id || ('CUSTOM_' + stableHash(item.name || 'skill'))),
      name: String(item.name || arch.name),
      tier: tier,
      color: color,
      cooldown: cooldown,
      energyCost: energyCost,
      power: power,
      radius: radius,
      duration: duration,
      desc: desc,
      icon: arch.icon,
      energyType: energyType,
      category: String(item.category || 'general'),
      noise: arch.noise,
      discounted: discounted,
      isStarter: false
    };
  }

  // ---------------------------------------------------------------------------
  // 9. Basic Attack, Passives, Style Label & buildCombatLoadout(player)
  // ---------------------------------------------------------------------------
  function resolveOwnedItems(player) {
    if (!player || typeof player !== 'object') return [];
    var raw = Array.isArray(player.loadout)
      ? player.loadout
      : (Array.isArray(player.ownedItems) ? player.ownedItems : []);
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var resolved = lookupItem(raw[i]);
      if (resolved) out.push(resolved);
    }
    return out;
  }

  function buildBasicAttack(player, ownedItems, mappedSkills) {
    var stats = (player && player.derivedStats) || (player && player.baseStats) || { phy: 10, agi: 10, obs: 10, wil: 10 };
    var phy = Number(stats.phy) || 10;
    var agi = Number(stats.agi) || 10;
    var obs = Number(stats.obs) || 10;
    var wil = Number(stats.wil) || 10;

    var styleScores = { sword: 0, cyber: 0, occult: 0, tactical: 0 };
    var maxTierRank = 0;

    for (var i = 0; i < ownedItems.length; i++) {
      var it = ownedItems[i];
      var sk = mappedSkills[i];
      var tr = TIER_RANK[normalizeTier(it.tier)] || 0;
      if (tr > maxTierRank) maxTierRank = tr;

      var tags = Array.isArray(it.tags) ? it.tags : [];
      var name = String(it.name || '');

      if (sk.archetype === 'sword_arc' || tags.indexOf('剑修') !== -1 || /剑|刀|刃/.test(name)) {
        styleScores.sword += 3 + tr * 0.7;
      }
      if (it.energyType === '真元' && it.category === 'cultivation') {
        styleScores.sword += 1.2;
      }

      if (it.energyType === '科技' || it.category === 'tech' || sk.archetype === 'rail_shot' || sk.archetype === 'emp_blast' || sk.archetype === 'turret_drone') {
        styleScores.cyber += 2.6 + tr * 0.6;
        if (/枪|炮|左轮|步枪|激光|光束/.test(name)) styleScores.cyber += 2.5;
      }

      if (it.energyType === '灵异' || it.energyType === '魔力' || it.category === 'anomaly' || it.category === 'myth') {
        styleScores.occult += 2.2 + tr * 0.5;
        if (sk.archetype === 'seal_chain' || sk.archetype === 'ward_circle') styleScores.occult += 1.2;
      }

      if (it.energyType === '体魄' || sk.archetype === 'berserk_strike' || it.category === 'general') {
        styleScores.tactical += 1.5 + tr * 0.4;
        if (sk.archetype === 'berserk_strike') styleScores.tactical += 2.5;
      }
    }

    var primaryStyle = 'tactical';
    var bestVal = 0.5;
    var styleKeys = ['sword', 'cyber', 'occult', 'tactical'];
    for (var k = 0; k < styleKeys.length; k++) {
      var key = styleKeys[k];
      if (styleScores[key] > bestVal) {
        bestVal = styleScores[key];
        primaryStyle = key;
      }
    }

    var tierBonus = maxTierRank * 4;
    var speedBonus = clamp((agi - 10) * 0.008, 0, 0.14);

    if (primaryStyle === 'sword') {
      return {
        id: 'basic_sword',
        style: 'sword',
        mode: 'melee',
        archetype: 'sword_arc',
        name: '青锋弧斩',
        icon: '⚔',
        color: '#5ce1c6',
        damage: Math.round(16 + Math.max(0, (phy + wil - 20) * 0.65) + tierBonus),
        range: 2.9,
        arcDeg: 115,
        cooldown: round2(clamp(0.46 - speedBonus, 0.28, 0.55)),
        knockback: 1.6,
        noise: 12,
        desc: '贴身宽幅剑气连斩，兼具轻度击退与格挡势能。'
      };
    }

    if (primaryStyle === 'cyber') {
      return {
        id: 'basic_cyber',
        style: 'cyber',
        mode: 'ranged',
        archetype: 'rail_shot',
        name: '战术脉冲点射',
        icon: '➤',
        color: '#48d1ff',
        damage: Math.round(14 + Math.max(0, (obs + agi - 20) * 0.6) + tierBonus),
        range: 8.6,
        arcDeg: 16,
        cooldown: round2(clamp(0.42 - speedBonus, 0.26, 0.52)),
        knockback: 0.7,
        noise: 18,
        desc: '高速赛博脉冲点射，远距离精准压制目标并保持安全走位。'
      };
    }

    if (primaryStyle === 'occult') {
      return {
        id: 'basic_occult',
        style: 'occult',
        mode: 'ranged',
        archetype: 'seal_chain',
        name: '灵能贯矛',
        icon: '✦',
        color: '#e05882',
        damage: Math.round(15 + Math.max(0, (wil + obs - 20) * 0.65) + tierBonus),
        range: 6.8,
        arcDeg: 24,
        cooldown: round2(clamp(0.50 - speedBonus, 0.30, 0.58)),
        knockback: 1.1,
        noise: 11,
        desc: '凝聚异质灵能射出中距灵矛，对规则异常体附带额外镇压干扰。'
      };
    }

    return {
      id: 'basic_tactical',
      style: 'tactical',
      mode: 'melee',
      archetype: 'berserk_strike',
      name: '战术警棍连击',
      icon: '☄',
      color: '#ff7b47',
      damage: Math.round(15 + Math.max(0, (phy - 10) * 1.0) + tierBonus),
      range: 2.5,
      arcDeg: 95,
      cooldown: round2(clamp(0.48 - speedBonus, 0.30, 0.56)),
      knockback: 1.8,
      noise: 13,
      desc: '干净利落的近身挥击，低噪实用且能震退逼近的威胁。'
    };
  }

  function computePassives(player, ownedItems, mappedSkills) {
    var stats = (player && player.derivedStats) || (player && player.baseStats) || { phy: 10, agi: 10, obs: 10, wil: 10 };
    var phy = Number(stats.phy) || 10;
    var agi = Number(stats.agi) || 10;
    var obs = Number(stats.obs) || 10;
    var wil = Number(stats.wil) || 10;

    var moveSpeedMult = 1.0 + Math.max(0, agi - 10) * 0.012;
    var maxHpBonus = Math.max(0, phy - 10) * 5;
    var energyRegen = 5.0 + Math.max(0, wil - 10) * 0.18 + Math.max(0, obs - 10) * 0.08;
    var damageMult = 1.0 + Math.max(0, phy - 10) * 0.015 + Math.max(0, wil - 10) * 0.01;
    var noiseMult = 1.0;
    var memeResist = 0.08 + Math.max(0, wil - 10) * 0.014;

    for (var i = 0; i < ownedItems.length; i++) {
      var it = ownedItems[i];
      var sk = mappedSkills[i];
      var tierFactor = 1 + (TIER_RANK[normalizeTier(it.tier)] || 0) * 0.45;
      var tags = Array.isArray(it.tags) ? it.tags : [];

      if (tags.indexOf('位移') !== -1 || sk.archetype === 'overclock' || sk.archetype === 'blink_mark') {
        moveSpeedMult += 0.045 * tierFactor;
      }
      if (tags.indexOf('护盾') !== -1 || tags.indexOf('血统') !== -1 || it.energyType === '体魄') {
        maxHpBonus += Math.round(10 * tierFactor);
      }
      if (tags.indexOf('医疗') !== -1) {
        maxHpBonus += Math.round(6 * tierFactor);
        energyRegen += 0.35 * tierFactor;
      }
      if (it.energyType === '真元' || it.energyType === '魔力' || tags.indexOf('阵法') !== -1) {
        energyRegen += 0.55 * tierFactor;
      }
      if (it.energyType === '科技') {
        energyRegen += 0.35 * tierFactor;
      }
      if (tags.indexOf('剑修') !== -1 || tags.indexOf('爆发') !== -1 || tags.indexOf('破甲') !== -1 || tags.indexOf('赌命') !== -1) {
        damageMult += 0.055 * tierFactor;
      }
      if (tags.indexOf('隐蔽') !== -1 || sk.archetype === 'stealth_veil') {
        noiseMult -= 0.11 * (0.8 + tierFactor * 0.2);
      } else if (tags.indexOf('侦察') !== -1) {
        noiseMult -= 0.04;
      } else if (sk.archetype === 'berserk_strike' || sk.archetype === 'emp_blast') {
        noiseMult += 0.04;
      }
      if (tags.indexOf('抗模因') !== -1) {
        memeResist += 0.14 * (0.75 + tierFactor * 0.25);
      } else if (tags.indexOf('结界') !== -1 || tags.indexOf('规则') !== -1 || it.energyType === '灵异') {
        memeResist += 0.045;
      }

      // Discounted items draw slightly more energy -> slight regen friction
      if (it.discounted) {
        energyRegen -= 0.25;
      }
    }

    return {
      moveSpeedMult: round2(clamp(moveSpeedMult, 0.85, 1.65)),
      maxHpBonus: Math.round(clamp(maxHpBonus, 0, 260)),
      energyRegen: round1(clamp(energyRegen, 4.0, 18.0)),
      damageMult: round2(clamp(damageMult, 0.90, 2.25)),
      noiseMult: round2(clamp(noiseMult, 0.45, 1.35)),
      memeResist: round2(clamp(memeResist, 0.0, 0.85))
    };
  }

  function computeStyleLabel(ownedItems, mappedSkills) {
    if (!ownedItems || ownedItems.length === 0) {
      return '凡人求生者';
    }

    var cats = Object.create(null);
    var energies = Object.create(null);
    var archs = Object.create(null);
    var tags = Object.create(null);
    var hasFused = false;

    for (var i = 0; i < ownedItems.length; i++) {
      var it = ownedItems[i];
      var sk = mappedSkills[i];
      cats[it.category] = (cats[it.category] || 0) + 1;
      energies[it.energyType] = (energies[it.energyType] || 0) + 1;
      archs[sk.archetype] = (archs[sk.archetype] || 0) + 1;
      if (it.id && /^FUS_|^CUSTOM_FUS_/.test(it.id)) hasFused = true;
      var tList = Array.isArray(it.tags) ? it.tags : [];
      for (var t = 0; t < tList.length; t++) {
        tags[tList[t]] = (tags[tList[t]] || 0) + 1;
      }
    }

    var distinctSystems = 0;
    var sysList = ['真元', '科技', '灵异', '魔力', '体魄'];
    for (var s = 0; s < sysList.length; s++) {
      if ((energies[sysList[s]] || 0) > 0) distinctSystems++;
    }

    // Specific iconic archetypes first
    if ((hasFused || distinctSystems >= 3) && ((tags['规则'] || 0) > 0 || (tags['收容'] || 0) > 0 || (tags['抗模因'] || 0) > 0)) {
      return '跨体系规则猎手';
    }
    if ((tags['剑修'] || 0) >= 2 && ((archs.ward_circle || 0) > 0 || (archs.aegis_shield || 0) > 0 || (tags['结界'] || 0) > 0)) {
      return '古典守御剑修';
    }
    if ((energies['科技'] || 0) >= 2 && ((archs.recon_pulse || 0) > 0 || (tags['侦察'] || 0) > 0 || (tags['黑客'] || 0) > 0)) {
      return '赛博战术侦察';
    }
    if ((energies['灵异'] || 0) >= 2 && ((tags['收容'] || 0) > 0 || (tags['规则'] || 0) > 0 || (archs.seal_chain || 0) > 0)) {
      return '道门诡异收容者';
    }
    if ((tags['剑修'] || 0) >= 2 || (archs.sword_arc || 0) >= 2) {
      return '御剑破邪修士';
    }
    if ((energies['科技'] || 0) >= 2 || (cats.tech || 0) >= 2) {
      return '义体火力专家';
    }
    if ((energies['真元'] || 0) >= 2 || (cats.cultivation || 0) >= 2) {
      return '东方玄门阵师';
    }
    if ((energies['魔力'] || 0) >= 2 || (cats.myth || 0) >= 2) {
      return '异域秘术行者';
    }
    if ((energies['体魄'] || 0) >= 2 || (archs.berserk_strike || 0) >= 2) {
      return '近战重装破阵手';
    }
    if ((archs.stealth_veil || 0) > 0 && ((archs.decoy_flare || 0) > 0 || (archs.blink_mark || 0) > 0)) {
      return '暗影潜行斥候';
    }
    if ((tags['医疗'] || 0) >= 2 && (tags['团队'] || 0) >= 1) {
      return '战地医疗支援官';
    }
    if (hasFused || distinctSystems >= 3) {
      return '跨界融合行者';
    }
    return '多域战术求生者';
  }

  function scoreSlotCandidate(item, skill) {
    var score = 0;
    var tierRank = TIER_RANK[skill.tier] || 0;
    score += tierRank * 14;

    // Prefer items with explicit active skills over passive bloodlines of adjacent tier,
    // while keeping high-tier and fused bloodlines prominent!
    var role = item.activeSkill && item.activeSkill.role ? item.activeSkill.role : '';
    if (role && role !== 'passive') {
      score += 20;
    } else if (item.category !== 'bloodline') {
      score += 12;
    } else {
      score += 4;
    }

    // Fused bloodlines are signature centerpieces
    if (item.id && /^FUS_|^CUSTOM_FUS_/.test(item.id)) {
      score += 26;
    }

    // Slight preference for high-impact tactical archetypes in Station Zero
    if (skill.archetype === 'ward_circle' || skill.archetype === 'recon_pulse' || skill.archetype === 'sword_arc' || skill.archetype === 'emp_blast' || skill.archetype === 'seal_chain') {
      score += 4;
    }

    return score;
  }

  function buildCombatLoadout(player) {
    var ownedItems = resolveOwnedItems(player);
    var mappedSkills = [];
    var candidates = [];

    for (var i = 0; i < ownedItems.length; i++) {
      var it = ownedItems[i];
      var sk = mapItemToSkill(it);
      mappedSkills.push(sk);
      candidates.push({
        item: it,
        skill: sk,
        order: i,
        priority: scoreSlotCandidate(it, sk)
      });
    }

    // Sort candidates by priority descending (deterministic tie-break by loadout order)
    candidates.sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.order - b.order;
    });

    var chosen = [];
    var usedArchetypes = Object.create(null);
    var usedItemIds = Object.create(null);

    // Pass 1: Pick up to 4 skills with DISTINCT archetypes from owned items
    for (var c = 0; c < candidates.length && chosen.length < 4; c++) {
      var cand = candidates[c];
      if (usedArchetypes[cand.skill.archetype]) continue;
      if (usedItemIds[cand.skill.itemId]) continue;
      usedArchetypes[cand.skill.archetype] = true;
      usedItemIds[cand.skill.itemId] = true;
      chosen.push(Object.assign({}, cand.skill));
    }

    // Pass 2: Pad any unfilled slots (< 4) with practical survival starter skills,
    // skipping archetypes already equipped so all 4 keys remain distinct & immediately useful
    for (var s = 0; s < STARTER_SKILLS.length && chosen.length < 4; s++) {
      var st = STARTER_SKILLS[s];
      if (usedArchetypes[st.archetype]) continue;
      usedArchetypes[st.archetype] = true;
      chosen.push(Object.assign({}, st));
    }

    // Safety guarantee: always strictly 4 slots
    for (var s2 = 0; s2 < STARTER_SKILLS.length && chosen.length < 4; s2++) {
      chosen.push(Object.assign({}, STARTER_SKILLS[s2]));
    }

    // Attach slot metadata (`key: '1'..'4'`, `slotIndex: 0..3`)
    var slots = [];
    for (var idx = 0; idx < 4; idx++) {
      var slotSkill = Object.assign({}, chosen[idx]);
      slotSkill.slotIndex = idx;
      slotSkill.key = String(idx + 1);
      slots.push(slotSkill);
    }

    var basicAttack = buildBasicAttack(player, ownedItems, mappedSkills);
    var passives = computePassives(player, ownedItems, mappedSkills);
    var styleLabel = computeStyleLabel(ownedItems, mappedSkills);

    return {
      basicAttack: basicAttack,
      slots: slots,
      passives: passives,
      styleLabel: styleLabel
    };
  }

  // ---------------------------------------------------------------------------
  // 10. Public Export on window.INFINITY.Skills25D
  // ---------------------------------------------------------------------------
  INFINITY.Skills25D = {
    ARCHETYPES: ARCHETYPES,
    ARCHETYPE_ORDER: ARCHETYPE_ORDER,
    STARTER_SKILLS: STARTER_SKILLS,
    mapItemToSkill: mapItemToSkill,
    buildCombatLoadout: buildCombatLoadout
  };
})(typeof window !== 'undefined' ? window : globalThis);
