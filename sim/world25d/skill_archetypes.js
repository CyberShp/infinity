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
  // 7B. 12-Motif Parametric VFX DNA Compiler (100% Coverage of 500+ Items)
  // ---------------------------------------------------------------------------
  var VFX_MOTIFS = {
    sword_qi: {
      id: 'sword_qi',
      label: '剑意锋芒',
      primary: '#5ce1c6',
      secondary: '#d2fff6',
      core: '#ffffff',
      sigilStyle: 'bagua',
      orbiterType: 'sword',
      particleStyle: 'slash_spark',
      ringLayers: 2
    },
    flame_solar: {
      id: 'flame_solar',
      label: '炽阳雷火',
      primary: '#ff7838',
      secondary: '#ffd25a',
      core: '#fff7d1',
      sigilStyle: 'bagua',
      orbiterType: 'talisman',
      particleStyle: 'ember',
      ringLayers: 2
    },
    thunder_emp: {
      id: 'thunder_emp',
      label: '高压雷暴',
      primary: '#48d1ff',
      secondary: '#9d7bff',
      core: '#e8fcff',
      sigilStyle: 'hex_grid',
      orbiterType: 'drone_bit',
      particleStyle: 'arc_bolt',
      ringLayers: 2
    },
    frost_cryo: {
      id: 'frost_cryo',
      label: '极寒凝霜',
      primary: '#7ce8ff',
      secondary: '#c8f6ff',
      core: '#ffffff',
      sigilStyle: 'arcane_star',
      orbiterType: 'void_prism',
      particleStyle: 'crystal',
      ringLayers: 2
    },
    blood_sanguine: {
      id: 'blood_sanguine',
      label: '血煞狂潮',
      primary: '#ff3b5c',
      secondary: '#b81d3d',
      core: '#ffd1d9',
      sigilStyle: 'blood_crest',
      orbiterType: 'blood_shard',
      particleStyle: 'crimson_mist',
      ringLayers: 2
    },
    void_space: {
      id: 'void_space',
      label: '裂隙折跃',
      primary: '#8f7cff',
      secondary: '#52d6ff',
      core: '#eef4ff',
      sigilStyle: 'arcane_star',
      orbiterType: 'void_prism',
      particleStyle: 'rift_shard',
      ringLayers: 2
    },
    holy_tao: {
      id: 'holy_tao',
      label: '玄门金印',
      primary: '#f2c766',
      secondary: '#76e8d4',
      core: '#fff8db',
      sigilStyle: 'bagua',
      orbiterType: 'talisman',
      particleStyle: 'rune_gold',
      ringLayers: 2
    },
    occult_meme: {
      id: 'occult_meme',
      label: '诡异收容',
      primary: '#e84a7f',
      secondary: '#c25bff',
      core: '#ffd6e8',
      sigilStyle: 'occult_eye',
      orbiterType: 'rune_orb',
      particleStyle: 'glitch_static',
      ringLayers: 2
    },
    bio_venom: {
      id: 'bio_venom',
      label: '生机净蚀',
      primary: '#58e89a',
      secondary: '#b2ff6e',
      core: '#e9fff0',
      sigilStyle: 'hex_grid',
      orbiterType: 'bio_helix',
      particleStyle: 'bio_cross',
      ringLayers: 2
    },
    cyber_tactical: {
      id: 'cyber_tactical',
      label: '赛博矩阵',
      primary: '#3ee8ff',
      secondary: '#ffb347',
      core: '#e8ffff',
      sigilStyle: 'tactical_hud',
      orbiterType: 'drone_bit',
      particleStyle: 'holo_grid',
      ringLayers: 2
    },
    shadow_ninja: {
      id: 'shadow_ninja',
      label: '影遁忍法',
      primary: '#9e82ff',
      secondary: '#5865a8',
      core: '#e0d6ff',
      sigilStyle: 'occult_eye',
      orbiterType: 'void_prism',
      particleStyle: 'shadow_wisp',
      ringLayers: 1
    },
    gravity_kinetic: {
      id: 'gravity_kinetic',
      label: '震岳重劲',
      primary: '#ff8a47',
      secondary: '#f2c464',
      core: '#fff0d4',
      sigilStyle: 'blood_crest',
      orbiterType: 'kinetic_plate',
      particleStyle: 'shock_debris',
      ringLayers: 2
    }
  };

  var VFX_MOTIF_RULES = [
    { id: 'sword_qi', nameRe: /剑|刀|刃|锋|斩|宵练|承影|干将|莫邪|太阿|诛仙|青锋|居合|飞剑/, descRe: /剑气|剑意|刀光|御剑|斩击|拔刀/, tag: '剑修' },
    { id: 'flame_solar', nameRe: /火|炎|焰|阳|金乌|焚|炽|爆|燃|熔|业火|朱雀|凤凰|三昧|云爆|烈日/, descRe: /灼烧|火焰|纯阳|爆炸|高温|炽烈/, tag: '火焰雷法' },
    { id: 'thunder_emp', nameRe: /雷|电|EMP|磁|电弧|闪电|雷法|五雷|掌心雷|脉冲|高压|静默塔|轨道|高斯|离子|黑客|破解/, descRe: /电磁|高压|瘫痪|雷击|电弧|骇客|短路/, tag: '电磁' },
    { id: 'frost_cryo', nameRe: /冰|霜|寒|雪|冻|液氮|极寒|玄冰|凛/, descRe: /冻结|冰霜|低温|减速|寒气/, tag: null },
    { id: 'blood_sanguine', nameRe: /血|暴君|狂暴|狼人|吸血|血族|将臣|修罗|嗜血|肉体|鬼神|黑光|屠|煞|猩红|恶魔/, descRe: /嗜血|吸血|狂暴|肉体畸变|血煞|撕裂/, tag: '赌命' },
    { id: 'void_space', nameRe: /空|跃|闪|折跃|飞雷神|缩地|时空|微尘|穿墙|维度|虚空|星|曲率|相位|黑洞|传送|时间/, descRe: /空间|折跃|瞬移|裂隙|维度|时间|相位/, tag: '空间' },
    { id: 'holy_tao', nameRe: /道|符|阵|佛|金钵|圣|律|天平|八卦|太极|注连绳|镇魂|桃木|法印|灵宝|昊天|昆仑|两仪|守心|净/, descRe: /结界|道门|符箓|佛光|镇煞|律令|阵法|神圣/, tag: '阵法' },
    { id: 'occult_meme', nameRe: /诡|鬼|灵|模因|收容|棺|尸|匣|怨|冥|死灵|克苏鲁|诅咒|纸人|扎纸|替身草人|拍立得|铜铃|招魂|异变|异常/, descRe: /模因|收容|规则|灵异|怨念|精神污染|诡异/, tag: '收容' },
    { id: 'bio_venom', nameRe: /毒|医|疗|药|剂|生|基因|细胞|净水|绷带|血清|圣水|再生|回春|解毒|丹|灵泉|青草|嗅盐/, descRe: /治疗|恢复|医疗|解毒|毒素|生化|再生|止血/, tag: '医疗' },
    { id: 'cyber_tactical', nameRe: /赛博|义体|机械|枪|炮|左轮|步枪|狙击|激光|无人机|雷达|热成像|凯夫拉|全息|纳米|外骨骼|机甲|神经|底盘|PKE|护目镜|探测/, descRe: /赛博|义体|枪械|弹道|无人机|全息|雷达|战术/, tag: '科技装备' },
    { id: 'shadow_ninja', nameRe: /影|隐|匿|潜|忍|苦无|迷彩|狐|幻|雾|夜|暗|消音|分身|替身术|逆模因/, descRe: /隐身|隐匿|潜行|忍术|光学迷彩|暗影|幻象/, tag: '隐蔽' },
    { id: 'gravity_kinetic', nameRe: /拳|体|力|重|泰坦|巨人|后土|金刚|石像鬼|霸王|龙|震|盾|甲|壁垒|背心|山魈|震地|破阵/, descRe: /重击|震地|破甲|体魄|冲击波|蛮力|硬直/, tag: '破甲' }
  ];

  var TIER_VFX_INTENSITY = {
    D: 0.82,
    C: 0.96,
    B: 1.14,
    A: 1.36,
    S: 1.62
  };

  function classifyVfxMotif(item, archetypeId) {
    var name = String((item && item.name) || '');
    var desc = sanitizePositiveDesc((item && item.desc) || '');
    var tags = Array.isArray(item && item.tags) ? item.tags : [];
    var energyType = String((item && item.energyType) || '通用');
    var category = String((item && item.category) || 'general');

    var tagSet = Object.create(null);
    for (var t = 0; t < tags.length; t++) tagSet[tags[t]] = true;

    var bestMotif = null;
    var bestScore = -1;
    var seed = stableHash((item && item.id) || name || archetypeId || 'vfx');

    for (var i = 0; i < VFX_MOTIF_RULES.length; i++) {
      var rule = VFX_MOTIF_RULES[i];
      var sc = 0;
      if (rule.nameRe && rule.nameRe.test(name)) sc += 12;
      if (rule.descRe && rule.descRe.test(desc)) sc += 5.5;
      if (rule.tag && tagSet[rule.tag]) sc += 4.5;

      // Energy & category synergy nudges
      if (rule.id === 'holy_tao' && energyType === '真元') sc += 2.2;
      if (rule.id === 'sword_qi' && energyType === '真元' && archetypeId === 'sword_arc') sc += 3.5;
      if (rule.id === 'cyber_tactical' && (energyType === '科技' || category === 'tech')) sc += 3.0;
      if (rule.id === 'thunder_emp' && energyType === '科技' && archetypeId === 'emp_blast') sc += 4.2;
      if (rule.id === 'occult_meme' && (energyType === '灵异' || category === 'anomaly')) sc += 3.0;
      if (rule.id === 'void_space' && (energyType === '魔力' || archetypeId === 'blink_mark')) sc += 2.6;
      if (rule.id === 'gravity_kinetic' && (energyType === '体魄' || archetypeId === 'berserk_strike')) sc += 3.0;
      if (rule.id === 'blood_sanguine' && category === 'bloodline' && energyType === '体魄') sc += 2.8;
      if (rule.id === 'bio_venom' && (archetypeId === 'heal_pulse' || tagSet['毒素生化'])) sc += 3.2;
      if (rule.id === 'shadow_ninja' && archetypeId === 'stealth_veil') sc += 3.8;

      if (sc > bestScore || (sc === bestScore && sc > 0 && ((seed + i * 11) % 17) > 8)) {
        bestScore = sc;
        bestMotif = rule.id;
      }
    }

    if (!bestMotif || bestScore <= 0) {
      var fallbackByArch = {
        sword_arc: 'sword_qi',
        ward_circle: 'holy_tao',
        emp_blast: 'thunder_emp',
        rail_shot: 'cyber_tactical',
        blink_mark: 'void_space',
        aegis_shield: 'holy_tao',
        overclock: 'cyber_tactical',
        heal_pulse: 'bio_venom',
        stealth_veil: 'shadow_ninja',
        seal_chain: 'occult_meme',
        recon_pulse: 'cyber_tactical',
        turret_drone: 'cyber_tactical',
        decoy_flare: 'shadow_ninja',
        berserk_strike: 'gravity_kinetic'
      };
      bestMotif = fallbackByArch[archetypeId] || 'cyber_tactical';
    }
    return bestMotif;
  }

  function buildVfxProfile(item, archetypeId, tier, resolvedColor) {
    var safeItem = item || {};
    var normTier = normalizeTier(tier || safeItem.tier);
    var motifId = classifyVfxMotif(safeItem, archetypeId);
    var motif = VFX_MOTIFS[motifId] || VFX_MOTIFS.cyber_tactical;
    var energyType = String(safeItem.energyType || '通用');
    var tags = Array.isArray(safeItem.tags) ? safeItem.tags : [];
    var isFused = Boolean(safeItem.id && /^FUS_|^CUSTOM_FUS_/.test(String(safeItem.id)));
    var isGamble = tags.indexOf('赌命') !== -1 || /赌命|自毁|献祭|燃血|禁术/.test(String(safeItem.name || ''));
    var hash = stableHash(String(safeItem.id || '') + '|' + String(safeItem.name || '') + '|' + archetypeId);
    var tierRank = TIER_RANK[normTier] || 0;
    var intensity = (TIER_VFX_INTENSITY[normTier] || 1.0) * (isFused ? 1.15 : 1.0);

    // Harmonize primary color between motif and energyType palette
    var primary = motif.primary || resolvedColor || '#6fd8ea';
    var secondary = motif.secondary || resolvedColor || '#ffffff';
    if (energyType === '灵异' && motifId !== 'blood_sanguine' && motifId !== 'occult_meme') {
      secondary = '#e05882';
    } else if (energyType === '真元' && motifId === 'cyber_tactical') {
      secondary = '#f0c975';
    } else if (energyType === '魔力' && motifId === 'sword_qi') {
      secondary = '#a97bff';
    } else if (isFused) {
      secondary = (ENERGY_PALETTES[energyType] && ENERGY_PALETTES[energyType].high) || '#ffe184';
    }

    return {
      motif: motifId,
      motifLabel: motif.label,
      labelTag: energyType + '·' + motif.label,
      primaryColor: primary,
      secondaryColor: secondary,
      coreColor: motif.core || '#ffffff',
      sigilStyle: motif.sigilStyle,
      orbiterType: motif.orbiterType,
      particleStyle: motif.particleStyle,
      ringLayers: Math.min(3, (motif.ringLayers || 2) + (tierRank >= 3 ? 1 : 0)),
      tier: normTier,
      tierRank: tierRank,
      tierIntensity: round2(intensity),
      isFused: isFused,
      isGamble: isGamble,
      isHighTier: tierRank >= 3,
      shapeVariant: hash % 4
    };
  }

  // Enrich built-in STARTER_SKILLS with deterministic vfxProfile & particlePreset
  for (var stIdx = 0; stIdx < STARTER_SKILLS.length; stIdx++) {
    var stSk = STARTER_SKILLS[stIdx];
    var stRaw = {
      id: stSk.itemId,
      name: stSk.name,
      tier: stSk.tier,
      energyType: stSk.energyType,
      category: stSk.category,
      desc: stSk.desc,
      tags: []
    };
    stSk.vfxProfile = buildVfxProfile(stRaw, stSk.archetype, stSk.tier, stSk.color);
    stSk.particlePreset = null; // populated immediately after ParticleVfx module init below
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
    var vfxProfile = buildVfxProfile(item, archetypeId, tier, color);
    var itemIdStr = String(item.id || ('CUSTOM_' + stableHash(item.name || 'skill')));
    var particlePreset = PARTICLE_CATALOG[itemIdStr] || buildParticlePreset(item, archetypeId, tier, vfxProfile);
    vfxProfile.particlePreset = particlePreset;
    var itemDesc = item.desc ? String(item.desc).trim() : '';
    var desc = itemDesc
      ? '[' + arch.name + '] ' + itemDesc
      : arch.desc;

    return {
      archetype: archetypeId,
      itemId: itemIdStr,
      name: String(item.name || arch.name),
      tier: tier,
      color: vfxProfile.primaryColor || color,
      cooldown: cooldown,
      energyCost: energyCost,
      power: power,
      radius: radius,
      duration: duration,
      desc: desc,
      icon: arch.icon,
      energyType: energyType,
      category: String(item.category || 'general'),
      tags: tags.slice(),
      noise: arch.noise,
      discounted: discounted,
      isStarter: false,
      vfxProfile: vfxProfile,
      particlePreset: particlePreset
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

    // Extract equipped bloodlines and evaluate Bloodline Resonance across all 4 slots & basic attack
    var equippedBloodlines = extractEquippedBloodlines(ownedItems, mappedSkills);

    // Attach slot metadata (`key: '1'..'4'`, `slotIndex: 0..3`) and Bloodline Resonance bonuses
    var slots = [];
    for (var idx = 0; idx < 4; idx++) {
      var slotSkill = Object.assign({}, chosen[idx]);
      slotSkill.slotIndex = idx;
      slotSkill.key = String(idx + 1);
      slotSkill.baseCooldown = slotSkill.cooldown;
      slotSkill.baseEnergyCost = slotSkill.energyCost;
      slotSkill.basePower = slotSkill.power;
      slotSkill.baseRadius = slotSkill.radius;
      slotSkill.baseDuration = slotSkill.duration;

      var slotRes = evaluateBloodlineResonance(equippedBloodlines, slotSkill);
      if (slotRes && slotRes.matched) {
        slotSkill.resonance = slotRes;
        slotSkill.cooldown = round1(clamp(slotSkill.cooldown * slotRes.bonuses.cooldownMult, 1.4, 18.0));
        slotSkill.energyCost = Math.max(4, Math.round(slotSkill.energyCost * slotRes.bonuses.energyCostMult));
        slotSkill.resonanceAppliedOnSlot = true;
      } else {
        slotSkill.resonance = null;
        slotSkill.resonanceAppliedOnSlot = false;
      }
      slots.push(slotSkill);
    }

    var basicAttack = buildBasicAttack(player, ownedItems, mappedSkills);
    var basicRes = evaluateBloodlineResonance(equippedBloodlines, basicAttack);
    basicAttack.resonance = (basicRes && basicRes.matched) ? basicRes : null;

    var passives = computePassives(player, ownedItems, mappedSkills);
    var resonanceSummary = buildLoadoutResonanceSummary(equippedBloodlines, slots, basicAttack);
    if (resonanceSummary && resonanceSummary.activeCount > 0) {
      var pb = resonanceSummary.passiveBonuses;
      passives.damageMult = round2(clamp(passives.damageMult + (pb.damageMultAdd || 0), 0.90, 2.55));
      passives.energyRegen = round1(clamp(passives.energyRegen + (pb.energyRegenAdd || 0), 4.0, 22.0));
      passives.maxHpBonus = Math.round(clamp(passives.maxHpBonus + (pb.maxHpAdd || 0), 0, 320));
      passives.moveSpeedMult = round2(clamp(passives.moveSpeedMult + (pb.moveSpeedAdd || 0), 0.85, 1.80));
      passives.memeResist = round2(clamp(passives.memeResist + (pb.memeResistAdd || 0), 0.0, 0.90));
      passives.noiseMult = round2(clamp(passives.noiseMult * (pb.noiseMult || 1.0), 0.35, 1.35));
    }
    var styleLabel = computeStyleLabel(ownedItems, mappedSkills);

    // Synthesize holistic 2.5D character visual aura, orbiting relics, and sigil from all equipped items/bloodlines
    var characterVisual = buildCharacterVisualProfile(ownedItems, mappedSkills, slots, basicAttack, styleLabel);
    basicAttack.vfxProfile = basicAttack.vfxProfile || {
      motif: characterVisual.primaryMotif,
      motifLabel: characterVisual.motifLabel,
      labelTag: characterVisual.labelTag,
      primaryColor: basicAttack.color || characterVisual.auraColor,
      secondaryColor: characterVisual.accentColor,
      coreColor: '#ffffff',
      sigilStyle: characterVisual.sigilStyle,
      orbiterType: characterVisual.orbiterType,
      particleStyle: characterVisual.particleStyle,
      ringLayers: 1,
      tier: characterVisual.highestTier,
      tierRank: characterVisual.tierRank,
      tierIntensity: round2(0.88 + characterVisual.tierRank * 0.14),
      isFused: characterVisual.hasFused,
      isGamble: characterVisual.hasGamble,
      isHighTier: characterVisual.tierRank >= 3,
      shapeVariant: characterVisual.tierRank % 4
    };
    basicAttack.particlePreset = buildParticlePreset(
      { id: 'BASIC_' + characterVisual.primaryMotif, name: basicAttack.name, tier: characterVisual.highestTier, energyType: '通用', tags: [] },
      basicAttack.mode === 'ranged' ? 'rail_shot' : 'sword_arc',
      characterVisual.highestTier,
      basicAttack.vfxProfile
    );
    basicAttack.vfxProfile.particlePreset = basicAttack.particlePreset;

    return {
      basicAttack: basicAttack,
      slots: slots,
      passives: passives,
      styleLabel: styleLabel,
      characterVisual: characterVisual,
      bloodlines: equippedBloodlines,
      resonanceSummary: resonanceSummary
    };
  }

  function buildCharacterVisualProfile(ownedItems, mappedSkills, slots, basicAttack, styleLabel) {
    var bestBloodline = null;
    var bestItem = null;
    var highestRank = -1;
    var hasFused = false;
    var hasGamble = false;
    var motifWeights = Object.create(null);

    for (var i = 0; i < ownedItems.length; i++) {
      var it = ownedItems[i];
      var sk = mappedSkills[i];
      if (!it || !sk) continue;
      var vp = sk.vfxProfile;
      var tr = TIER_RANK[normalizeTier(it.tier)] || 0;
      if (it.id && /^FUS_|^CUSTOM_FUS_/.test(String(it.id))) hasFused = true;
      if (vp && vp.isGamble) hasGamble = true;
      if (tr > highestRank) {
        highestRank = tr;
        bestItem = sk;
      }
      if (it.category === 'bloodline') {
        if (!bestBloodline || tr >= (TIER_RANK[bestBloodline.tier] || 0)) {
          bestBloodline = sk;
        }
      }
      if (vp && vp.motif) {
        var w = 1 + tr * 0.75 + (it.category === 'bloodline' ? 1.8 : 0) + (vp.isFused ? 2.5 : 0);
        motifWeights[vp.motif] = (motifWeights[vp.motif] || 0) + w;
      }
    }

    var primarySkill = bestBloodline || bestItem || (slots && slots[0]) || STARTER_SKILLS[0];
    var primaryVp = (primarySkill && primarySkill.vfxProfile) || buildVfxProfile(null, 'sword_arc', 'C', '#6fd8ea');

    // Pick secondary motif if player combines multiple systems
    var sortedMotifs = Object.keys(motifWeights).sort(function (a, b) {
      return motifWeights[b] - motifWeights[a];
    });
    var primaryMotifId = sortedMotifs[0] || primaryVp.motif || 'sword_qi';
    var secondaryMotifId = sortedMotifs[1] || primaryMotifId;
    var pMotif = VFX_MOTIFS[primaryMotifId] || VFX_MOTIFS.sword_qi;
    var sMotif = VFX_MOTIFS[secondaryMotifId] || pMotif;

    var tierRank = Math.max(0, highestRank);
    var tierNames = ['D', 'C', 'B', 'A', 'S'];
    var highestTier = tierNames[Math.min(4, tierRank)] || 'D';
    var orbiterCount = clamp(1 + Math.floor(tierRank * 0.75) + (hasFused ? 1 : 0), 1, 4);

    return {
      primaryMotif: primaryMotifId,
      secondaryMotif: secondaryMotifId,
      motifLabel: pMotif.label,
      labelTag: (primarySkill && primarySkill.energyType ? primarySkill.energyType : '通用') + '·' + pMotif.label,
      auraColor: primaryVp.primaryColor || pMotif.primary,
      accentColor: secondaryMotifId !== primaryMotifId ? sMotif.primary : (primaryVp.secondaryColor || pMotif.secondary),
      rimColor: pMotif.core || '#ffffff',
      sigilStyle: pMotif.sigilStyle || 'bagua',
      orbiterType: pMotif.orbiterType || 'sword',
      particleStyle: pMotif.particleStyle || 'slash_spark',
      orbiterCount: orbiterCount,
      tierRank: tierRank,
      highestTier: highestTier,
      hasFused: hasFused,
      hasGamble: hasGamble,
      bloodlineName: bestBloodline ? bestBloodline.name : (primarySkill ? primarySkill.name : '考生基础脉络'),
      weaponStyle: (basicAttack && basicAttack.style) || 'tactical',
      styleLabel: styleLabel || '多域战术求生者'
    };
  }

  // ---------------------------------------------------------------------------
  // 10. Three.js 500-Skill Parametric Particle VFX Module
  // Predefines distinct 3-tone color profiles & trigger choreography for all
  // 500 SHOP_CATALOG items (arc_shock, shield_refract, blade_vortex, etc.).
  // ---------------------------------------------------------------------------
  var PARTICLE_TRIGGER_ANIMS = {
    arc_shock: {
      id: 'arc_shock',
      label: '电弧震荡',
      desc: '强力爆发与雷电冲击：高能电弧粒子沿冲击波高频震荡，伴随多分支 3D 闪电丝裂变。',
      defaultDuration: 0.62,
      defaultSpeed: 6.4,
      defaultSpread: 2.8,
      oscillationFreq: 26.0,
      hasArcs: true
    },
    shield_refract: {
      id: 'shield_refract',
      label: '护盾折射光',
      desc: '防御壁垒与结界展开：球面晶格粒子包覆躯干并产生棱镜折射闪烁，双倾角折射环同步脉冲。',
      defaultDuration: 0.85,
      defaultSpeed: 2.1,
      defaultSpread: 1.55,
      oscillationFreq: 10.5,
      hasRefractRings: true
    },
    blade_vortex: {
      id: 'blade_vortex',
      label: '剑气星屑',
      desc: '弧光斩击与锋刃挥砍：扇面高速星屑沿瞄准方向横扫卷起螺旋余烬。',
      defaultDuration: 0.54,
      defaultSpeed: 7.2,
      defaultSpread: 3.2,
      oscillationFreq: 14.0
    },
    void_implode: {
      id: 'void_implode',
      label: '虚空坍缩',
      desc: '空间折跃与封禁锁链：先瞬时引力坍缩聚拢，再沿倾斜相位面爆裂散射。',
      defaultDuration: 0.76,
      defaultSpeed: 5.4,
      defaultSpread: 2.6,
      oscillationFreq: 16.0,
      hasPhaseRing: true
    },
    sanctuary_rise: {
      id: 'sanctuary_rise',
      label: '生机螺旋',
      desc: '急救与净化光环：双螺旋温润光尘自足底盘旋升腾，释放柔和复苏辉光。',
      defaultDuration: 0.98,
      defaultSpeed: 2.8,
      defaultSpread: 1.9,
      oscillationFreq: 6.5
    },
    stealth_dissolve: {
      id: 'stealth_dissolve',
      label: '幽影散逸',
      desc: '潜行迷彩与声噪幻象：扫描波纹自下而上将轮廓粒子化为离散幽影薄雾。',
      defaultDuration: 0.72,
      defaultSpeed: 2.4,
      defaultSpread: 1.75,
      oscillationFreq: 12.0
    },
    sonar_ripple: {
      id: 'sonar_ripple',
      label: '声呐波阵',
      desc: 'PKE 探测与全域洞察：双频量化声呐点阵贴地高速扩散，高亮周边波纹。',
      defaultDuration: 0.88,
      defaultSpeed: 8.5,
      defaultSpread: 4.5,
      oscillationFreq: 18.0,
      hasSonarRings: true
    },
    overdrive_stream: {
      id: 'overdrive_stream',
      label: '超频流光',
      desc: '神经超频与炮台布阵：高转速环形流光束环绕施法者盘旋加速并拉出上升光迹。',
      defaultDuration: 0.78,
      defaultSpeed: 4.8,
      defaultSpread: 1.85,
      oscillationFreq: 20.0,
      hasPhaseRing: true
    }
  };

  function parseHexToRgb01(hexStr) {
    var clean = String(hexStr || '#6fd8ea').replace('#', '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    var n = parseInt(clean, 16);
    if (isNaN(n)) n = 0x6fd8ea;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function rgb01ToHexInt(r, g, b) {
    var ri = clamp(Math.round(r * 255), 0, 255);
    var gi = clamp(Math.round(g * 255), 0, 255);
    var bi = clamp(Math.round(b * 255), 0, 255);
    return (ri << 16) | (gi << 8) | bi;
  }

  function hexIntToCss(hexInt) {
    return '#' + (hexInt >>> 0).toString(16).padStart(6, '0');
  }

  function shiftHexColor(hexStr, hueDeg, satDelta, lightDelta) {
    var rgb = parseHexToRgb01(hexStr);
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) * 0.5;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    h = (h + (hueDeg || 0) / 360) % 1;
    if (h < 0) h += 1;
    s = clamp(s + (satDelta || 0), 0.25, 1.0);
    l = clamp(l + (lightDelta || 0), 0.34, 0.86);

    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var nr = hue2rgb(p, q, h + 1 / 3);
    var ng = hue2rgb(p, q, h);
    var nb = hue2rgb(p, q, h - 1 / 3);
    return hexIntToCss(rgb01ToHexInt(nr, ng, nb));
  }

  function classifyParticleTriggerAnim(item, archetypeId, vfxProfile) {
    var arch = archetypeId || 'sword_arc';
    var motif = (vfxProfile && vfxProfile.motif) || 'cyber_tactical';
    var tags = Array.isArray(item && item.tags) ? item.tags : [];
    var isHigh = Boolean(vfxProfile && (vfxProfile.isHighTier || vfxProfile.isFused));

    // Defense & containment barriers -> Shield Refraction Light
    if (arch === 'aegis_shield' || arch === 'ward_circle' || tags.indexOf('护盾') !== -1) {
      return 'shield_refract';
    }
    // Heavy bursts, EMP, Rail shots, Thunder motif, or Gamble/S-tier heavy offense -> Arc Shock Oscillation
    if (
      arch === 'berserk_strike' ||
      arch === 'emp_blast' ||
      arch === 'rail_shot' ||
      motif === 'thunder_emp' ||
      (arch === 'sword_arc' && (vfxProfile && vfxProfile.isGamble) && isHigh)
    ) {
      return 'arc_shock';
    }
    if (arch === 'sword_arc') return 'blade_vortex';
    if (arch === 'blink_mark' || arch === 'seal_chain') return 'void_implode';
    if (arch === 'heal_pulse') return 'sanctuary_rise';
    if (arch === 'stealth_veil' || arch === 'decoy_flare') return 'stealth_dissolve';
    if (arch === 'recon_pulse') return 'sonar_ripple';
    if (arch === 'overclock' || arch === 'turret_drone') return 'overdrive_stream';
    return 'arc_shock';
  }

  function buildParticlePreset(item, archetypeId, tier, vfxProfile) {
    var safeItem = item || {};
    var normTier = normalizeTier(tier || safeItem.tier || (vfxProfile && vfxProfile.tier));
    var vp = vfxProfile || buildVfxProfile(safeItem, archetypeId, normTier, null);
    var tierRank = TIER_RANK[normTier] || 0;
    var itemId = String(safeItem.id || ('CUSTOM_' + stableHash(String(safeItem.name || archetypeId || 'skill'))));
    var hash = stableHash(itemId + '|' + String(safeItem.name || '') + '|' + archetypeId);

    var triggerAnim = classifyParticleTriggerAnim(safeItem, archetypeId, vp);
    var animMeta = PARTICLE_TRIGGER_ANIMS[triggerAnim] || PARTICLE_TRIGGER_ANIMS.arc_shock;

    // Deterministic per-item HSL signature so every one of the 500 items carries unique color nuances
    var hueJitter = ((hash % 29) - 14); // -14° .. +14°
    var secJitter = ((((hash >> 5) % 37) - 18)); // -18° .. +18°
    var satBoost = tierRank >= 3 ? 0.08 : 0.0;
    var lightShift = (((hash >> 10) % 9) - 4) * 0.015;

    var primaryColor = shiftHexColor(vp.primaryColor || '#6fd8ea', hueJitter, satBoost, lightShift);
    var secondaryColor = shiftHexColor(vp.secondaryColor || '#ffffff', secJitter, satBoost, lightShift * 0.6);
    var refractColor = triggerAnim === 'shield_refract'
      ? shiftHexColor(vp.primaryColor || '#6fd8ea', 52 + (hash % 35), 0.14, 0.14)
      : shiftHexColor(vp.coreColor || '#ffffff', hueJitter * 0.5, 0.05, 0.12);

    var primaryRgb = parseHexToRgb01(primaryColor);
    var secondaryRgb = parseHexToRgb01(secondaryColor);
    var refractRgb = parseHexToRgb01(refractColor);

    var baseCount = 28 + tierRank * 11 + (vp.isFused ? 12 : 0) + (hash % 7);
    var particleSize = round2((0.20 + tierRank * 0.032 + (vp.isHighTier ? 0.03 : 0)) * (triggerAnim === 'shield_refract' ? 1.08 : 1.0));
    var duration = round2(animMeta.defaultDuration * (0.94 + tierRank * 0.05));
    var speed = round2(animMeta.defaultSpeed * (0.92 + ((hash >> 3) % 7) * 0.04));
    var spread = round2(animMeta.defaultSpread * (0.92 + tierRank * 0.08));

    return {
      itemId: itemId,
      name: String(safeItem.name || (ARCHETYPES[archetypeId] && ARCHETYPES[archetypeId].name) || '技能粒子'),
      archetype: archetypeId || 'sword_arc',
      tier: normTier,
      tierRank: tierRank,
      motif: vp.motif,
      triggerAnim: triggerAnim,
      triggerLabel: animMeta.label,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      refractColor: refractColor,
      primaryHex: rgb01ToHexInt(primaryRgb[0], primaryRgb[1], primaryRgb[2]),
      secondaryHex: rgb01ToHexInt(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]),
      refractHex: rgb01ToHexInt(refractRgb[0], refractRgb[1], refractRgb[2]),
      primaryRgb: primaryRgb,
      secondaryRgb: secondaryRgb,
      refractRgb: refractRgb,
      count: baseCount,
      particleSize: particleSize,
      duration: duration,
      speed: speed,
      spread: spread,
      oscillationFreq: round1(animMeta.oscillationFreq * (0.9 + ((hash >> 7) % 5) * 0.06)),
      arcBranches: triggerAnim === 'arc_shock' ? (3 + Math.min(3, tierRank) + (vp.isFused ? 1 : 0)) : 0,
      refractLayers: triggerAnim === 'shield_refract' ? (2 + (tierRank >= 3 ? 1 : 0)) : 0,
      glowIntensity: round2(0.85 + tierRank * 0.14 + (vp.isFused ? 0.15 : 0)),
      isHighTier: Boolean(vp.isHighTier),
      isFused: Boolean(vp.isFused),
      isGamble: Boolean(vp.isGamble)
    };
  }

  // Eagerly precompile the complete 500-item particle preset registry
  var PARTICLE_CATALOG = Object.create(null);
  var PARTICLE_CATALOG_COUNT = 0;

  function populateParticleCatalog() {
    var list = Array.isArray(INFINITY.SHOP_CATALOG) ? INFINITY.SHOP_CATALOG : [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item || !item.id) continue;
      var idKey = String(item.id);
      if (PARTICLE_CATALOG[idKey]) continue;
      var archId = classifyArchetype(item);
      var normTier = normalizeTier(item.tier);
      var col = resolveNeonColor(item.energyType, archId, normTier);
      var vp = buildVfxProfile(item, archId, normTier, col);
      PARTICLE_CATALOG[idKey] = buildParticlePreset(item, archId, normTier, vp);
      PARTICLE_CATALOG_COUNT++;
    }
  }
  populateParticleCatalog();

  // Populate starter skills' particlePreset now that buildParticlePreset is ready
  for (var stp = 0; stp < STARTER_SKILLS.length; stp++) {
    var stItem = STARTER_SKILLS[stp];
    stItem.particlePreset = buildParticlePreset(
      { id: stItem.itemId, name: stItem.name, tier: stItem.tier, energyType: '通用', tags: [] },
      stItem.archetype,
      stItem.tier,
      stItem.vfxProfile
    );
    if (stItem.vfxProfile) stItem.vfxProfile.particlePreset = stItem.particlePreset;
  }

  function getParticlePreset(skillOrItemOrId) {
    if (!skillOrItemOrId) return STARTER_SKILLS[0].particlePreset;
    if (typeof skillOrItemOrId === 'string') {
      if (PARTICLE_CATALOG[skillOrItemOrId]) return PARTICLE_CATALOG[skillOrItemOrId];
      var found = lookupItem(skillOrItemOrId);
      if (found) {
        var archId = classifyArchetype(found);
        var tier = normalizeTier(found.tier);
        var vp = buildVfxProfile(found, archId, tier, resolveNeonColor(found.energyType, archId, tier));
        var preset = buildParticlePreset(found, archId, tier, vp);
        PARTICLE_CATALOG[skillOrItemOrId] = preset;
        return preset;
      }
      return STARTER_SKILLS[0].particlePreset;
    }
    if (skillOrItemOrId.particlePreset && skillOrItemOrId.particlePreset.triggerAnim) {
      return skillOrItemOrId.particlePreset;
    }
    var key = skillOrItemOrId.itemId || skillOrItemOrId.id;
    if (key && PARTICLE_CATALOG[String(key)]) {
      return PARTICLE_CATALOG[String(key)];
    }
    var arch = skillOrItemOrId.archetype || classifyArchetype(skillOrItemOrId);
    var t = normalizeTier(skillOrItemOrId.tier);
    var prof = skillOrItemOrId.vfxProfile || buildVfxProfile(skillOrItemOrId, arch, t, skillOrItemOrId.color);
    return buildParticlePreset(skillOrItemOrId, arch, t, prof);
  }

  // Cached procedural radial-glow particle sprite texture (shared, zero external files)
  var cachedParticleGlowTex = null;
  function getParticleGlowTexture(THREE) {
    if (cachedParticleGlowTex) return cachedParticleGlowTex;
    if (!THREE || typeof document === 'undefined' || !document.createElement) return null;
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      var ctx = canvas.getContext('2d');
      if (!ctx) return null;
      var grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
      grad.addColorStop(0.0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.32, 'rgba(255,255,255,0.88)');
      grad.addColorStop(0.68, 'rgba(255,255,255,0.28)');
      grad.addColorStop(1.0, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      var tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      cachedParticleGlowTex = tex;
      return tex;
    } catch (_) {
      return null;
    }
  }

  /**
   * Three.js Particle VFX Trigger Engine:
   * Spawns a complete, self-contained 3D particle + auxiliary geometry VFX handle
   * tailored to any of the 500 skills (or custom/fused skills).
   * Returns { group, preset, ttl, maxTtl, update(dt), dispose() }.
   */
  function triggerSkillParticleVfx(THREE, scene, skillOrItemOrId, opts) {
    if (!THREE || !scene) return null;
    var preset = getParticlePreset(skillOrItemOrId);
    var cfg = opts || {};
    var anim = cfg.triggerAnimOverride || preset.triggerAnim || 'arc_shock';
    var intensityScale = clamp(Number(cfg.intensityScale) || 1.0, 0.35, 1.8);
    var ox = Number(cfg.x) || 0;
    var oy = typeof cfg.y === 'number' ? cfg.y : 1.0;
    var oz = Number(cfg.z) || 0;
    var angle = Number(cfg.angle) || 0;
    var spread = (Number(cfg.radius) ? Math.min(Number(cfg.radius), preset.spread * 1.4) : preset.spread) * (0.75 + 0.25 * intensityScale);
    var dur = (Number(cfg.duration) || preset.duration) * (intensityScale < 0.7 ? 0.78 : 1.0);
    var count = Math.max(12, Math.round(preset.count * intensityScale));

    var pRgb = preset.primaryRgb;
    var sRgb = preset.secondaryRgb;
    var rRgb = preset.refractRgb;

    var group = new THREE.Group();
    group.position.set(ox, oy, oz);
    var geos = [];
    var mats = [];

    // Per-particle kinematic state buffers (zero allocations in update loop)
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var initPos = new Float32Array(count * 3);
    var vels = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var radii = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      var frac = i / count;
      var i3 = i * 3;
      phases[i] = frac * Math.PI * 2 + Math.random() * 1.4;

      // Blend primary / secondary / refract colors per particle
      var cPick = i % 5;
      var cSrc = cPick === 0 ? rRgb : (cPick % 2 === 0 ? sRgb : pRgb);
      colors[i3] = cSrc[0];
      colors[i3 + 1] = cSrc[1];
      colors[i3 + 2] = cSrc[2];

      if (anim === 'shield_refract') {
        // Fibonacci spherical crystalline shell around caster
        var phi = Math.acos(1 - 2 * ((i + 0.5) / count));
        var theta = Math.PI * (1 + Math.sqrt(5)) * i;
        var sr = 0.88 + (i % 3) * 0.14;
        radii[i] = sr;
        initPos[i3] = Math.sin(phi) * Math.cos(theta) * sr;
        initPos[i3 + 1] = Math.cos(phi) * sr * 0.92;
        initPos[i3 + 2] = Math.sin(phi) * Math.sin(theta) * sr;
        positions[i3] = initPos[i3] * 0.65;
        positions[i3 + 1] = initPos[i3 + 1] * 0.65;
        positions[i3 + 2] = initPos[i3 + 2] * 0.65;
      } else if (anim === 'blade_vortex') {
        // Directional crescent fan sweeping across aim angle
        var coneAng = angle + (frac - 0.5) * 1.75;
        var br = 0.45 + Math.random() * spread * 0.38;
        radii[i] = br;
        positions[i3] = Math.cos(coneAng) * br;
        positions[i3 + 1] = (Math.random() - 0.45) * 0.55;
        positions[i3 + 2] = Math.sin(coneAng) * br;
        var bSpd = preset.speed * (0.65 + Math.random() * 0.65);
        vels[i3] = Math.cos(coneAng) * bSpd;
        vels[i3 + 1] = 0.6 + Math.random() * 2.1;
        vels[i3 + 2] = Math.sin(coneAng) * bSpd;
      } else if (anim === 'void_implode') {
        // Start scattered on an inclined sphere, implode inward then burst out
        var va = Math.random() * Math.PI * 2;
        var vr = spread * (0.55 + Math.random() * 0.6);
        radii[i] = vr;
        initPos[i3] = Math.cos(va) * vr;
        initPos[i3 + 1] = (Math.random() - 0.5) * 1.6;
        initPos[i3 + 2] = Math.sin(va) * vr;
        positions[i3] = initPos[i3];
        positions[i3 + 1] = initPos[i3 + 1];
        positions[i3 + 2] = initPos[i3 + 2];
      } else if (anim === 'sanctuary_rise') {
        // Double-helix ascending sanctuary motes
        var ha = (i % 2) * Math.PI + frac * Math.PI * 4;
        var hr = 0.45 + (i % 4) * (spread * 0.16);
        radii[i] = hr;
        phases[i] = ha;
        positions[i3] = Math.cos(ha) * hr;
        positions[i3 + 1] = -0.8 + frac * 0.9;
        positions[i3 + 2] = Math.sin(ha) * hr;
        vels[i3 + 1] = 1.9 + Math.random() * 1.4;
      } else if (anim === 'stealth_dissolve') {
        // Vertical silhouette scatter drifting into shadowy mist
        var sa = Math.random() * Math.PI * 2;
        var sr2 = 0.25 + Math.random() * 0.65;
        positions[i3] = Math.cos(sa) * sr2;
        positions[i3 + 1] = -0.8 + Math.random() * 1.7;
        positions[i3 + 2] = Math.sin(sa) * sr2;
        vels[i3] = Math.cos(sa) * (1.2 + Math.random() * 1.6);
        vels[i3 + 1] = 0.9 + Math.random() * 1.3;
        vels[i3 + 2] = Math.sin(sa) * (1.2 + Math.random() * 1.6);
      } else if (anim === 'sonar_ripple') {
        // Concentric quantized sonar dots along ground plane
        var ringIdx = i % 2;
        var ra = frac * Math.PI * 2;
        radii[i] = ringIdx === 0 ? 1.0 : 0.64;
        phases[i] = ra;
        positions[i3] = Math.cos(ra) * 0.35;
        positions[i3 + 1] = -oy + 0.14 + ringIdx * 0.08;
        positions[i3 + 2] = Math.sin(ra) * 0.35;
      } else if (anim === 'overdrive_stream') {
        // High-RPM toroidal accelerator stream
        var oa = frac * Math.PI * 2;
        var orad = 0.72 + (i % 3) * 0.28;
        radii[i] = orad;
        phases[i] = oa;
        positions[i3] = Math.cos(oa) * orad;
        positions[i3 + 1] = -0.7 + Math.random() * 1.5;
        positions[i3 + 2] = Math.sin(oa) * orad;
        vels[i3 + 1] = 1.5 + Math.random() * 1.8;
      } else {
        // arc_shock (default heavy offensive burst): radial + aim-biased high-voltage explosion
        var aa = (i % 3 === 0)
          ? (angle + (Math.random() - 0.5) * 1.35)
          : (Math.random() * Math.PI * 2);
        var aSpd = preset.speed * (0.55 + Math.random() * 0.75);
        positions[i3] = (Math.random() - 0.5) * 0.28;
        positions[i3 + 1] = (Math.random() - 0.5) * 0.35;
        positions[i3 + 2] = (Math.random() - 0.5) * 0.28;
        vels[i3] = Math.cos(aa) * aSpd;
        vels[i3 + 1] = (Math.random() - 0.25) * 3.8;
        vels[i3 + 2] = Math.sin(aa) * aSpd;
        radii[i] = 0.12 + Math.random() * 0.22; // jitter amplitude
      }
    }

    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var glowTex = getParticleGlowTexture(THREE);
    var pMat = new THREE.PointsMaterial({
      size: preset.particleSize * (0.85 + 0.15 * intensityScale),
      map: glowTex || null,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(pGeo, pMat);
    group.add(pts);
    geos.push(pGeo);
    mats.push(pMat);

    // Auxiliary 3D animation accents (Arc Shock 3D Lightning Filaments / Shield Refraction Rings / Phase Rings)
    var arcEntries = [];
    var refractRings = [];
    var phaseRing = null;
    var phaseRingMat = null;

    if (anim === 'arc_shock') {
      var branchCount = Math.max(2, Math.round((preset.arcBranches || 4) * intensityScale));
      var segs = 6;
      for (var bi = 0; bi < branchCount; bi++) {
        var bAng = (bi < 2)
          ? (angle + (bi === 0 ? -0.35 : 0.35))
          : ((bi / branchCount) * Math.PI * 2 + Math.random() * 0.5);
        var bLen = spread * (0.72 + Math.random() * 0.42);
        var bEndY = -0.35 + Math.random() * 0.95;
        var aPos = new Float32Array((segs + 1) * 3);
        var aGeo = new THREE.BufferGeometry();
        aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
        var aMat = new THREE.LineBasicMaterial({
          color: bi % 2 === 0 ? preset.primaryHex : preset.refractHex,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        var aLine = new THREE.Line(aGeo, aMat);
        group.add(aLine);
        geos.push(aGeo);
        mats.push(aMat);
        arcEntries.push({
          geo: aGeo,
          mat: aMat,
          arr: aPos,
          segs: segs,
          ex: Math.cos(bAng) * bLen,
          ey: bEndY,
          ez: Math.sin(bAng) * bLen
        });
      }
    } else if (anim === 'shield_refract') {
      var layerCount = Math.max(2, preset.refractLayers || 2);
      for (var ri = 0; ri < layerCount; ri++) {
        var rGeo = new THREE.TorusGeometry(0.95 + ri * 0.24, 0.036, 6, 28);
        var rMat = new THREE.MeshBasicMaterial({
          color: ri === 0 ? preset.refractHex : (ri === 1 ? preset.primaryHex : preset.secondaryHex),
          transparent: true,
          opacity: 0.84,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        var rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.x = Math.PI * (0.32 + ri * 0.24);
        rMesh.rotation.y = ri * 1.05;
        group.add(rMesh);
        geos.push(rGeo);
        mats.push(rMat);
        refractRings.push({ mesh: rMesh, mat: rMat, idx: ri });
      }
    } else if (anim === 'void_implode' || anim === 'overdrive_stream' || anim === 'sonar_ripple') {
      var prGeo = new THREE.RingGeometry(0.78, 1.0, 32);
      prGeo.rotateX(-Math.PI / 2);
      phaseRingMat = new THREE.MeshBasicMaterial({
        color: preset.secondaryHex,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      phaseRing = new THREE.Mesh(prGeo, phaseRingMat);
      if (anim === 'sonar_ripple') phaseRing.position.y = -oy + 0.12;
      group.add(phaseRing);
      geos.push(prGeo);
      mats.push(phaseRingMat);
    }

    function refreshArcLines(progress) {
      var reach = clamp(progress * 3.2, 0.25, 1.0);
      var amp = 0.28 * (1 - progress * 0.4);
      for (var ai = 0; ai < arcEntries.length; ai++) {
        var ae = arcEntries[ai];
        var arr = ae.arr;
        for (var s = 0; s <= ae.segs; s++) {
          var f = (s / ae.segs) * reach;
          var env = (s === 0 || s === ae.segs) ? 0 : Math.sin((s / ae.segs) * Math.PI);
          arr[s * 3] = ae.ex * f + (Math.random() - 0.5) * 2 * amp * env;
          arr[s * 3 + 1] = ae.ey * f + (Math.random() - 0.5) * 1.6 * amp * env;
          arr[s * 3 + 2] = ae.ez * f + (Math.random() - 0.5) * 2 * amp * env;
        }
        ae.geo.attributes.position.needsUpdate = true;
      }
    }
    if (arcEntries.length > 0) refreshArcLines(0.05);

    scene.add(group);

    var elapsed = 0;
    var arcTick = 0;
    var oscFreq = preset.oscillationFreq || 18.0;

    return {
      group: group,
      preset: preset,
      ttl: dur,
      maxTtl: dur,
      update: function (dt) {
        var stepDt = Math.max(0.001, dt || 0.016);
        this.ttl -= stepDt;
        elapsed += stepDt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);
        var posAttr = pGeo.attributes.position;
        var colAttr = pGeo.attributes.color;
        var arr = posAttr.array;
        var cArr = colAttr.array;

        if (anim === 'arc_shock') {
          var drag = Math.exp(-2.8 * stepDt);
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            vels[k3] *= drag;
            vels[k3 + 1] = vels[k3 + 1] * drag - 2.6 * stepDt;
            vels[k3 + 2] *= drag;
            var jOsc = Math.sin(elapsed * oscFreq + phases[k]) * radii[k];
            arr[k3] += vels[k3] * stepDt + jOsc * stepDt * 6.5;
            arr[k3 + 1] = Math.max(-oy + 0.08, arr[k3 + 1] + vels[k3 + 1] * stepDt + Math.cos(elapsed * oscFreq * 1.3 + phases[k]) * 0.04);
            arr[k3 + 2] += vels[k3 + 2] * stepDt - jOsc * stepDt * 6.5;
          }
          arcTick += stepDt;
          if (arcTick >= 0.04) {
            arcTick = 0;
            refreshArcLines(p);
          }
          for (var ai = 0; ai < arcEntries.length; ai++) {
            arcEntries[ai].mat.opacity = 0.95 * Math.pow(1 - p, 1.15);
          }
        } else if (anim === 'shield_refract') {
          // Prismatic refractive shell expansion & shimmering hue glints
          var shellScale = 0.72 + Math.sin(Math.min(1, p * 1.6) * Math.PI * 0.5) * 0.55 + p * 0.12;
          var spin = elapsed * 2.4;
          var cosS = Math.cos(spin);
          var sinS = Math.sin(spin);
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            var ix = initPos[k3] * shellScale;
            var iy = initPos[k3 + 1] * shellScale;
            var iz = initPos[k3 + 2] * shellScale;
            arr[k3] = ix * cosS - iz * sinS;
            arr[k3 + 1] = iy + Math.sin(elapsed * 5.0 + phases[k]) * 0.06;
            arr[k3 + 2] = ix * sinS + iz * cosS;

            // Prismatic refraction glint cycling primary -> refract -> white-gold
            var glint = 0.5 + 0.5 * Math.sin(elapsed * oscFreq + phases[k] * 2.5);
            cArr[k3] = pRgb[0] + (rRgb[0] - pRgb[0]) * glint;
            cArr[k3 + 1] = pRgb[1] + (rRgb[1] - pRgb[1]) * glint;
            cArr[k3 + 2] = pRgb[2] + (rRgb[2] - pRgb[2]) * glint;
          }
          colAttr.needsUpdate = true;
          for (var ri = 0; ri < refractRings.length; ri++) {
            var rk = refractRings[ri];
            var rsc = 0.75 + p * (0.75 + rk.idx * 0.22);
            rk.mesh.scale.set(rsc, rsc, rsc);
            rk.mesh.rotation.z += stepDt * (3.2 + rk.idx * 1.6) * (rk.idx % 2 === 0 ? 1 : -1);
            rk.mesh.rotation.x += stepDt * 1.4;
            rk.mat.opacity = 0.84 * Math.pow(1 - p, 1.1);
          }
        } else if (anim === 'blade_vortex') {
          var bDrag = Math.exp(-3.4 * stepDt);
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            vels[k3] *= bDrag;
            vels[k3 + 2] *= bDrag;
            var swirl = elapsed * 4.5 + phases[k];
            arr[k3] += (vels[k3] + Math.cos(swirl) * 0.9) * stepDt;
            arr[k3 + 1] = Math.max(-oy + 0.08, arr[k3 + 1] + vels[k3 + 1] * stepDt);
            arr[k3 + 2] += (vels[k3 + 2] + Math.sin(swirl) * 0.9) * stepDt;
          }
        } else if (anim === 'void_implode') {
          // 0..0.30 implode inward -> 0.30..1.00 hyper-burst outward along tilted orbital plane
          var scaleF = p < 0.30
            ? (1.0 - (p / 0.30) * 0.88)
            : (0.12 + Math.pow((p - 0.30) / 0.70, 0.72) * 1.45);
          var vSpin = elapsed * (p < 0.30 ? 8.0 : -4.5);
          var vCos = Math.cos(vSpin);
          var vSin = Math.sin(vSpin);
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            var vx0 = initPos[k3] * scaleF;
            var vz0 = initPos[k3 + 2] * scaleF;
            arr[k3] = vx0 * vCos - vz0 * vSin;
            arr[k3 + 1] = initPos[k3 + 1] * scaleF;
            arr[k3 + 2] = vx0 * vSin + vz0 * vCos;
          }
          if (phaseRing && phaseRingMat) {
            var prSc = Math.max(0.18, scaleF * spread * 0.65);
            phaseRing.scale.set(prSc, 1, prSc);
            phaseRing.rotation.z = 0.28;
            phaseRing.rotation.y += stepDt * 5.0;
            phaseRingMat.opacity = 0.72 * (1 - p);
          }
        } else if (anim === 'sanctuary_rise') {
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            var ang = phases[k] + elapsed * 3.8;
            var hr = radii[k] * (0.9 + p * 0.35);
            arr[k3] = Math.cos(ang) * hr;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] = Math.sin(ang) * hr;
          }
        } else if (anim === 'stealth_dissolve') {
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            arr[k3] += (vels[k3] + Math.sin(elapsed * 9.0 + phases[k]) * 0.5) * stepDt;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] += (vels[k3 + 2] + Math.cos(elapsed * 9.0 + phases[k]) * 0.5) * stepDt;
          }
        } else if (anim === 'sonar_ripple') {
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            var rNow = 0.35 + p * spread * 1.45 * radii[k];
            var aNow = phases[k] + elapsed * 0.6;
            arr[k3] = Math.cos(aNow) * rNow;
            arr[k3 + 2] = Math.sin(aNow) * rNow;
          }
          if (phaseRing && phaseRingMat) {
            var sSc = 0.35 + p * spread * 1.45;
            phaseRing.scale.set(sSc, 1, sSc);
            phaseRingMat.opacity = 0.68 * (1 - p);
          }
        } else {
          // overdrive_stream
          for (var k = 0; k < count; k++) {
            var k3 = k * 3;
            var oa = phases[k] + elapsed * 9.2;
            var orad = radii[k] * (1.0 + p * 0.45);
            arr[k3] = Math.cos(oa) * orad;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] = Math.sin(oa) * orad;
          }
          if (phaseRing && phaseRingMat) {
            var oSc = 0.8 + p * 1.3;
            phaseRing.scale.set(oSc, 1, oSc);
            phaseRing.rotation.y -= stepDt * 8.5;
            phaseRingMat.opacity = 0.72 * (1 - p);
          }
        }

        posAttr.needsUpdate = true;
        pMat.opacity = 0.96 * Math.pow(1 - p, 1.15);
      },
      dispose: function () {
        scene.remove(group);
        for (var gi = 0; gi < geos.length; gi++) geos[gi].dispose();
        for (var mi = 0; mi < mats.length; mi++) mats[mi].dispose();
      }
    };
  }

  var ParticleVfx = {
    ANIM_PRESETS: PARTICLE_TRIGGER_ANIMS,
    CATALOG: PARTICLE_CATALOG,
    getCatalogCount: function () {
      if (PARTICLE_CATALOG_COUNT === 0) populateParticleCatalog();
      return PARTICLE_CATALOG_COUNT;
    },
    getPreset: getParticlePreset,
    buildPreset: buildParticlePreset,
    trigger: triggerSkillParticleVfx
  };

  // ---------------------------------------------------------------------------
  // 11. Bloodline Resonance System (血统共鸣系统)
  // Matches equipped bloodlines against skill attributes (elemental/affinity
  // domains, energy systems, tactical tags) to grant numeric combat bonuses
  // and trigger arena-wide global Three.js particle choreography.
  // ---------------------------------------------------------------------------
  var RESONANCE_AFFINITY_ORDER = [
    'frost',
    'pyro_storm',
    'sword_qi',
    'cyber_emp',
    'void_space',
    'occult_seal',
    'vital_sanctuary',
    'shadow_venom',
    'titan_body',
    'arcane_ether'
  ];

  var RESONANCE_AFFINITIES = {
    frost: {
      id: 'frost',
      label: '极寒霜域',
      shortLabel: '极寒共鸣',
      resonanceTitle: '极寒血统共鸣',
      desc: '寒冰血脉与霜冻技能同频共振，全域降下冰晶暴雪并大幅强化震荡威力与迟缓控制。',
      globalFxStyle: 'frost_blizzard',
      primaryColor: '#7be8ff',
      secondaryColor: '#d8f9ff',
      accentColor: '#3a9cff',
      keywords: /极寒|冰霜|寒冰|寒灵|霜|冻|雪|零度|冰封|寒气|冷冽|冰晶|玄冰|寒霜|凛冬/,
      curatedIds: { B099: 3.5, FUS_COLD_SPIRIT_ROOT: 3.5 },
      tags: ['冰霜', '极寒', '控制'],
      energyTypes: [],
      archetypes: ['emp_blast', 'ward_circle', 'seal_chain'],
      bonusProfile: {
        powerAdd: [0.22, 0.32, 0.44],
        radiusAdd: [0.18, 0.25, 0.34],
        durationAdd: [0.24, 0.34, 0.46],
        cooldownCut: [0.10, 0.14, 0.20],
        costCut: [0.12, 0.16, 0.22],
        noiseMult: 0.90,
        energyRefund: [4, 7, 11],
        hpBonus: [0, 0, 0],
        sanBonus: [2, 4, 6],
        sealBonusPct: [4, 7, 10],
        slowBonusSec: [1.5, 2.4, 3.5]
      }
    },
    pyro_storm: {
      id: 'pyro_storm',
      label: '炽雷焚天',
      shortLabel: '炎雷共鸣',
      resonanceTitle: '炽雷血统共鸣',
      desc: '炽炎与雷霆血脉共振引爆高能电弧余烬风暴，巨幅增幅爆发伤害并返还大量能量。',
      globalFxStyle: 'pyro_tempest',
      primaryColor: '#ff7338',
      secondaryColor: '#ffe066',
      accentColor: '#ff385c',
      keywords: /火|炎|焰|焚|炽|灼|金乌|不死鸟|雷|电|霆|霹雳|阳炎|等离子|熔岩|烈阳|天雷|火球|爆炎/,
      curatedIds: { B080: 3.2, B090: 3.0 },
      tags: ['火焰雷法', '爆发'],
      energyTypes: [],
      archetypes: ['emp_blast', 'berserk_strike', 'rail_shot'],
      bonusProfile: {
        powerAdd: [0.26, 0.38, 0.50],
        radiusAdd: [0.15, 0.22, 0.30],
        durationAdd: [0.14, 0.20, 0.28],
        cooldownCut: [0.10, 0.15, 0.20],
        costCut: [0.10, 0.14, 0.18],
        noiseMult: 1.0,
        energyRefund: [6, 10, 15],
        hpBonus: [0, 0, 0],
        sanBonus: [0, 0, 0],
        sealBonusPct: [0, 0, 0],
        slowBonusSec: [0.6, 1.0, 1.5]
      }
    },
    sword_qi: {
      id: 'sword_qi',
      label: '剑心通明',
      shortLabel: '剑意共鸣',
      resonanceTitle: '剑骨血统共鸣',
      desc: '先天剑脉与真元剑诀共振，全域垂落青锋星雨，显著提升斩击威力并大幅压缩冷却。',
      globalFxStyle: 'sword_domain',
      primaryColor: '#5ce1c6',
      secondaryColor: '#f5dc8a',
      accentColor: '#e8fffb',
      keywords: /剑|刀|刃|斩|居合|剑骨|剑意|剑气|剑诀|御剑|宵练|承影|灵根|丹田|真元|道胎/,
      curatedIds: { B026: 3.4, C001: 3.0, C002: 2.6, C066: 3.0 },
      tags: ['剑修', '东方修真'],
      energyTypes: ['真元'],
      archetypes: ['sword_arc', 'overclock'],
      bonusProfile: {
        powerAdd: [0.22, 0.32, 0.44],
        radiusAdd: [0.14, 0.20, 0.28],
        durationAdd: [0.16, 0.24, 0.32],
        cooldownCut: [0.15, 0.22, 0.28],
        costCut: [0.12, 0.18, 0.24],
        noiseMult: 0.92,
        energyRefund: [5, 9, 13],
        hpBonus: [0, 0, 0],
        sanBonus: [2, 4, 6],
        sealBonusPct: [0, 0, 0],
        slowBonusSec: [0.4, 0.8, 1.2]
      }
    },
    cyber_emp: {
      id: 'cyber_emp',
      label: '赛博超频',
      shortLabel: '电磁共鸣',
      resonanceTitle: '赛博神经共鸣',
      desc: '义体底盘与电磁科技武装高频同步，全域展开数字矩阵波纹，扩大扫描与火力覆盖。',
      globalFxStyle: 'cyber_matrix',
      primaryColor: '#38e8ff',
      secondaryColor: '#73a6ff',
      accentColor: '#b0fbff',
      keywords: /赛博|神经|义体|机械|纳米|量子|电磁|脉冲|黑客|光学|激光|无人机|机甲|基因|底盘|墨家|机关|炮|枪|EMP/,
      curatedIds: { B041: 3.2, B066: 3.2, FUS_MOJIA_CYBER: 3.5 },
      tags: ['电磁', '黑客', '科技装备', '侦察'],
      energyTypes: ['科技'],
      archetypes: ['emp_blast', 'rail_shot', 'overclock', 'turret_drone', 'recon_pulse'],
      bonusProfile: {
        powerAdd: [0.20, 0.30, 0.40],
        radiusAdd: [0.20, 0.28, 0.38],
        durationAdd: [0.18, 0.26, 0.36],
        cooldownCut: [0.14, 0.20, 0.26],
        costCut: [0.14, 0.20, 0.26],
        noiseMult: 0.92,
        energyRefund: [5, 8, 12],
        hpBonus: [0, 0, 0],
        sanBonus: [0, 2, 4],
        sealBonusPct: [0, 0, 0],
        slowBonusSec: [0.8, 1.3, 2.0]
      }
    },
    void_space: {
      id: 'void_space',
      label: '虚空折跃',
      shortLabel: '空间共鸣',
      resonanceTitle: '时空血统共鸣',
      desc: '时空脉络与折跃技能产生相位谐振，全域浮现逆重力星尘与次元光环，延伸射程与持续。',
      globalFxStyle: 'void_aurora',
      primaryColor: '#9d7bff',
      secondaryColor: '#66e8ff',
      accentColor: '#e8d4ff',
      keywords: /空间|时空|虚空|折跃|曲率|相位|瞬移|微尘|门|次元|星际|重力|飞雷神|缩地|穿墙|两仪/,
      curatedIds: { B091: 3.5, FUS_ABSOLUTE_REALM: 3.2 },
      tags: ['空间', '位移'],
      energyTypes: [],
      archetypes: ['blink_mark', 'ward_circle'],
      bonusProfile: {
        powerAdd: [0.18, 0.28, 0.38],
        radiusAdd: [0.22, 0.32, 0.42],
        durationAdd: [0.22, 0.32, 0.42],
        cooldownCut: [0.15, 0.22, 0.28],
        costCut: [0.14, 0.20, 0.26],
        noiseMult: 0.85,
        energyRefund: [5, 8, 12],
        hpBonus: [0, 0, 0],
        sanBonus: [2, 4, 6],
        sealBonusPct: [3, 5, 8],
        slowBonusSec: [0.7, 1.2, 1.8]
      }
    },
    occult_seal: {
      id: 'occult_seal',
      label: '镇煞律令',
      shortLabel: '灵异共鸣',
      resonanceTitle: '镇煞血统共鸣',
      desc: '灵异守心体质与收容封印术式共振，全域铺开朱砂符箓星尘，额外推进封印并稳固理智。',
      globalFxStyle: 'occult_eclipse',
      primaryColor: '#f06292',
      secondaryColor: '#ffd166',
      accentColor: '#c75cf5',
      keywords: /灵异|鬼|煞|咒|封印|收容|规则|模因|道门|守心|阴阳|镇压|法海|棺材|冥|亡灵|结界|阵法|画地|注连|纸|鬼道/,
      curatedIds: { B027: 3.4, B061: 3.2, FUS_DAO_GHOST_VESSEL: 3.5 },
      tags: ['灵异', '收容', '规则', '抗模因', '结界', '阵法'],
      energyTypes: ['灵异'],
      archetypes: ['seal_chain', 'ward_circle', 'recon_pulse'],
      bonusProfile: {
        powerAdd: [0.20, 0.30, 0.40],
        radiusAdd: [0.18, 0.26, 0.34],
        durationAdd: [0.24, 0.34, 0.44],
        cooldownCut: [0.11, 0.16, 0.22],
        costCut: [0.12, 0.18, 0.24],
        noiseMult: 0.90,
        energyRefund: [4, 7, 10],
        hpBonus: [0, 0, 0],
        sanBonus: [5, 9, 14],
        sealBonusPct: [6, 10, 15],
        slowBonusSec: [0.8, 1.3, 1.9]
      }
    },
    vital_sanctuary: {
      id: 'vital_sanctuary',
      label: '不朽生机',
      shortLabel: '圣愈共鸣',
      resonanceTitle: '生机血统共鸣',
      desc: '圣愈再生血脉与护盾/治疗技能共鸣，全域绽放金翠治愈光雨，附加即时生命与护盾强化。',
      globalFxStyle: 'sanctuary_bloom',
      primaryColor: '#5ce6a0',
      secondaryColor: '#ffe484',
      accentColor: '#c6ffe2',
      keywords: /圣|光|愈|疗|医|药|生机|再生|不死|木|森|精灵|净化|厚德|守护|护盾|天使|治疗|回春|复苏/,
      curatedIds: { B039: 2.8, B096: 3.2 },
      tags: ['医疗', '护盾', '团队'],
      energyTypes: [],
      archetypes: ['heal_pulse', 'aegis_shield'],
      bonusProfile: {
        powerAdd: [0.22, 0.32, 0.44],
        radiusAdd: [0.18, 0.26, 0.36],
        durationAdd: [0.22, 0.32, 0.42],
        cooldownCut: [0.11, 0.16, 0.22],
        costCut: [0.12, 0.18, 0.24],
        noiseMult: 0.92,
        energyRefund: [4, 6, 10],
        hpBonus: [8, 14, 22],
        sanBonus: [4, 7, 11],
        sealBonusPct: [0, 0, 0],
        slowBonusSec: [0, 0, 0]
      }
    },
    shadow_venom: {
      id: 'shadow_venom',
      label: '幽影蚀毒',
      shortLabel: '暗袭共鸣',
      resonanceTitle: '幽影血统共鸣',
      desc: '潜影蚀毒血脉与隐匿/诱饵术式共鸣，全域弥散暗紫蚀雾，极大幅度消音并延长隐匿时长。',
      globalFxStyle: 'shadow_mist',
      primaryColor: '#b48aff',
      secondaryColor: '#55f2a8',
      accentColor: '#7c52ff',
      keywords: /影|暗|隐|潜|忍|狐|毒|生化|血族|狼人|寄生|幻|魅|刺客|无声|迷彩|替身|青丘|下忍|中忍/,
      curatedIds: { B006: 2.8, B031: 3.2, B068: 3.0 },
      tags: ['隐蔽', '毒素生化', '侦察'],
      energyTypes: [],
      archetypes: ['stealth_veil', 'decoy_flare', 'recon_pulse'],
      bonusProfile: {
        powerAdd: [0.20, 0.30, 0.40],
        radiusAdd: [0.16, 0.22, 0.30],
        durationAdd: [0.24, 0.34, 0.46],
        cooldownCut: [0.12, 0.18, 0.24],
        costCut: [0.12, 0.16, 0.22],
        noiseMult: 0.58,
        energyRefund: [4, 7, 10],
        hpBonus: [0, 0, 0],
        sanBonus: [2, 4, 6],
        sealBonusPct: [0, 0, 0],
        slowBonusSec: [0.7, 1.1, 1.6]
      }
    },
    titan_body: {
      id: 'titan_body',
      label: '泰坦狂血',
      shortLabel: '霸体共鸣',
      resonanceTitle: '狂血体魄共鸣',
      desc: '巨力狂战血脉与重击破甲技共振，全域掀起炽金震地气浪，极大幅度放大破坏力与击退。',
      globalFxStyle: 'titan_quake',
      primaryColor: '#ff8c42',
      secondaryColor: '#ffd166',
      accentColor: '#ff4757',
      keywords: /体魄|巨力|泰坦|暴君|狂|龙|虎|霸体|金刚|铁布衫|古武|肌肉|冲锋|重击|破甲|山魈|白眼|战体/,
      curatedIds: { B022: 3.4, B032: 3.0, B073: 3.2 },
      tags: ['爆发', '破甲', '赌命'],
      energyTypes: ['体魄'],
      archetypes: ['berserk_strike', 'aegis_shield'],
      bonusProfile: {
        powerAdd: [0.26, 0.38, 0.50],
        radiusAdd: [0.16, 0.24, 0.34],
        durationAdd: [0.16, 0.24, 0.32],
        cooldownCut: [0.10, 0.14, 0.20],
        costCut: [0.10, 0.14, 0.20],
        noiseMult: 1.0,
        energyRefund: [4, 8, 12],
        hpBonus: [6, 10, 16],
        sanBonus: [0, 0, 0],
        sealBonusPct: [0, 0, 0],
        slowBonusSec: [0.6, 1.0, 1.5]
      }
    },
    arcane_ether: {
      id: 'arcane_ether',
      label: '以太秘法',
      shortLabel: '魔力共鸣',
      resonanceTitle: '以太血统共鸣',
      desc: '异域魔力血脉与秘术技能共鸣，全域浮现星图奥术光尘，大幅节省能耗并提升法术范围。',
      globalFxStyle: 'arcane_constellation',
      primaryColor: '#b388ff',
      secondaryColor: '#66e0ff',
      accentColor: '#ffe082',
      keywords: /魔力|法|秘|奥术|星辰|炼金|符文|元素|召唤|恶魔|神圣|炽天|学徒|魔药|秘术|魔法/,
      curatedIds: {},
      tags: ['异域神秘'],
      energyTypes: ['魔力'],
      archetypes: ['ward_circle', 'seal_chain', 'blink_mark', 'rail_shot'],
      bonusProfile: {
        powerAdd: [0.20, 0.30, 0.42],
        radiusAdd: [0.18, 0.26, 0.36],
        durationAdd: [0.18, 0.26, 0.36],
        cooldownCut: [0.12, 0.18, 0.24],
        costCut: [0.16, 0.22, 0.30],
        noiseMult: 0.92,
        energyRefund: [6, 10, 14],
        hpBonus: [0, 0, 0],
        sanBonus: [3, 5, 8],
        sealBonusPct: [3, 5, 8],
        slowBonusSec: [0.4, 0.7, 1.1]
      }
    }
  };

  function isBloodlineItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (item.category === 'bloodline') return true;
    var tags = Array.isArray(item.tags) ? item.tags : [];
    if (tags.indexOf('血统') !== -1) return true;
    var id = String(item.itemId || item.id || '');
    if (/^B\d{3}$|^FUS_|^CUSTOM_FUS_/.test(id)) return true;
    var name = String(item.name || '');
    if (/血统|血脉|基因|体质|灵根|剑骨|魔体|量子体|实验体|守心体|底盘|妖裔|狐裔|残血|薄血|道胎/.test(name)) return true;
    return false;
  }

  function extractItemAffinities(itemOrSkill) {
    var raw = itemOrSkill;
    if (typeof raw === 'string') raw = lookupItem(raw) || { id: raw, name: raw };
    if (!raw || typeof raw !== 'object') return [];

    // Enrich mapped skill with catalog entry if available so tags/desc are complete
    var catalogRef = (raw.itemId || raw.id) ? lookupItem(raw.itemId || raw.id) : null;
    var id = String(raw.itemId || raw.id || (catalogRef && catalogRef.id) || '');
    var name = String(raw.name || (catalogRef && catalogRef.name) || '');
    var desc = String(raw.desc || raw.summary || (catalogRef && (catalogRef.desc || catalogRef.summary)) || '');
    var energyType = String(raw.energyType || (catalogRef && catalogRef.energyType) || '通用');
    var archetype = String(raw.archetype || '');
    var rawTags = Array.isArray(raw.tags) ? raw.tags : [];
    var catTags = (catalogRef && Array.isArray(catalogRef.tags)) ? catalogRef.tags : [];
    var tagSet = Object.create(null);
    var ti;
    for (ti = 0; ti < rawTags.length; ti++) tagSet[rawTags[ti]] = true;
    for (ti = 0; ti < catTags.length; ti++) tagSet[catTags[ti]] = true;

    var combinedText = name + ' ' + desc;
    var scores = [];

    for (var i = 0; i < RESONANCE_AFFINITY_ORDER.length; i++) {
      var affId = RESONANCE_AFFINITY_ORDER[i];
      var aff = RESONANCE_AFFINITIES[affId];
      var weight = 0;
      var matchedBy = [];

      if (aff.curatedIds && id && aff.curatedIds[id]) {
        weight += aff.curatedIds[id];
        matchedBy.push('curated');
      }
      if (aff.keywords && aff.keywords.test(name)) {
        weight += 3.2;
        matchedBy.push('name');
      } else if (aff.keywords && aff.keywords.test(combinedText)) {
        weight += 1.65;
        matchedBy.push('desc');
      }
      for (var j = 0; j < aff.tags.length; j++) {
        if (tagSet[aff.tags[j]]) {
          weight += 1.55;
          matchedBy.push('tag:' + aff.tags[j]);
        }
      }
      if (energyType !== '通用' && aff.energyTypes.indexOf(energyType) !== -1) {
        weight += 1.35;
        matchedBy.push('energy:' + energyType);
      }
      if (archetype && aff.archetypes.indexOf(archetype) !== -1 && weight > 0) {
        weight += 0.45;
      }

      if (weight >= 1.1) {
        scores.push({
          id: affId,
          weight: round2(weight),
          strong: weight >= 2.4 || matchedBy.indexOf('name') !== -1 || matchedBy.indexOf('curated') !== -1,
          matchedBy: matchedBy
        });
      }
    }

    scores.sort(function (a, b) {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return RESONANCE_AFFINITY_ORDER.indexOf(a.id) - RESONANCE_AFFINITY_ORDER.indexOf(b.id);
    });

    // Guarantee at least one fallback affinity from energyType or archetype
    if (scores.length === 0) {
      var fallbackId = 'arcane_ether';
      if (energyType === '真元') fallbackId = 'sword_qi';
      else if (energyType === '科技') fallbackId = 'cyber_emp';
      else if (energyType === '灵异') fallbackId = 'occult_seal';
      else if (energyType === '体魄') fallbackId = 'titan_body';
      else if (energyType === '魔力') fallbackId = 'arcane_ether';
      else if (archetype === 'heal_pulse' || archetype === 'aegis_shield') fallbackId = 'vital_sanctuary';
      else if (archetype === 'stealth_veil' || archetype === 'decoy_flare') fallbackId = 'shadow_venom';
      else if (archetype === 'blink_mark') fallbackId = 'void_space';
      else if (archetype === 'sword_arc') fallbackId = 'sword_qi';
      else if (archetype === 'berserk_strike') fallbackId = 'titan_body';
      else if (archetype === 'emp_blast' || archetype === 'rail_shot' || archetype === 'turret_drone') fallbackId = 'cyber_emp';
      scores.push({ id: fallbackId, weight: 1.0, strong: false, matchedBy: ['fallback'] });
    }

    return scores;
  }

  function extractEquippedBloodlines(ownedItems, mappedSkills) {
    var list = Array.isArray(ownedItems) ? ownedItems : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (!it || !isBloodlineItem(it)) continue;
      var key = String(it.id || it.itemId || it.name || ('BL_' + i));
      if (seen[key]) continue;
      seen[key] = true;
      var sk = mappedSkills && mappedSkills[i] ? mappedSkills[i] : null;
      var affs = extractItemAffinities(it);
      out.push({
        id: key,
        name: String(it.name || '未知血统'),
        tier: normalizeTier(it.tier),
        tierRank: TIER_RANK[normalizeTier(it.tier)] || 0,
        energyType: String(it.energyType || '通用'),
        tags: Array.isArray(it.tags) ? it.tags.slice() : [],
        isFused: Boolean(/^FUS_|^CUSTOM_FUS_/.test(key)),
        archetype: sk ? sk.archetype : classifyArchetype(it),
        affinities: affs,
        primaryAffinity: affs[0] ? affs[0].id : 'arcane_ether'
      });
    }
    return out;
  }

  var RESONANCE_LEVEL_LABELS = ['', '微光共鸣', '同源共鸣', '绝巅共鸣'];

  function evaluateBloodlineResonance(bloodlinesOrPlayer, skillOrItem) {
    if (!bloodlinesOrPlayer || !skillOrItem) return null;

    var bloodlines = [];
    if (Array.isArray(bloodlinesOrPlayer)) {
      for (var bi = 0; bi < bloodlinesOrPlayer.length; bi++) {
        var bEntry = typeof bloodlinesOrPlayer[bi] === 'string' ? lookupItem(bloodlinesOrPlayer[bi]) : bloodlinesOrPlayer[bi];
        if (bEntry) bloodlines.push(bEntry);
      }
    } else if (bloodlinesOrPlayer.loadout || bloodlinesOrPlayer.ownedItems) {
      bloodlines = extractEquippedBloodlines(resolveOwnedItems(bloodlinesOrPlayer), null);
    } else {
      var singleB = typeof bloodlinesOrPlayer === 'string' ? lookupItem(bloodlinesOrPlayer) : bloodlinesOrPlayer;
      if (singleB) bloodlines.push(singleB);
    }

    if (bloodlines.length === 0) return null;

    var skillObj = typeof skillOrItem === 'string' ? (lookupItem(skillOrItem) || { id: skillOrItem, name: skillOrItem }) : skillOrItem;
    if (!skillObj || typeof skillObj !== 'object') return null;

    var skillCatRef = (skillObj.itemId || skillObj.id) ? lookupItem(skillObj.itemId || skillObj.id) : null;
    var skillId = String(skillObj.itemId || skillObj.id || (skillCatRef && skillCatRef.id) || 'SKILL_CUSTOM');
    var skillName = String(skillObj.name || (skillCatRef && skillCatRef.name) || '技能');
    var skillEnergy = String(skillObj.energyType || (skillCatRef && skillCatRef.energyType) || '通用');
    var skillTags = Array.isArray(skillObj.tags)
      ? skillObj.tags
      : ((skillCatRef && Array.isArray(skillCatRef.tags)) ? skillCatRef.tags : []);
    var skillAffs = extractItemAffinities(skillObj);

    var bestMatch = null;

    for (var i = 0; i < bloodlines.length; i++) {
      var bl = bloodlines[i];
      var blId = String(bl.id || bl.itemId || ('BL_' + i));
      var blName = String(bl.name || '血统');
      var blTier = normalizeTier(bl.tier);
      var blTierRank = TIER_RANK[blTier] || 0;
      var blEnergy = String(bl.energyType || '通用');
      var blTags = Array.isArray(bl.tags) ? bl.tags : [];
      var blIsFused = Boolean(bl.isFused || /^FUS_|^CUSTOM_FUS_/.test(blId));
      var blAffs = Array.isArray(bl.affinities) && bl.affinities.length ? bl.affinities : extractItemAffinities(bl);

      // 1) Shared affinity domain check (strongest channel, e.g. frost + frost)
      var sharedAff = null;
      var affOverlapScore = 0;
      for (var ba = 0; ba < blAffs.length; ba++) {
        for (var sa = 0; sa < skillAffs.length; sa++) {
          if (blAffs[ba].id === skillAffs[sa].id) {
            var pairScore = blAffs[ba].weight + skillAffs[sa].weight + (blAffs[ba].strong && skillAffs[sa].strong ? 2.4 : 0);
            // Ignore double fallback-only matches unless energy or tags also align
            var bothFallback = (blAffs[ba].matchedBy && blAffs[ba].matchedBy[0] === 'fallback') &&
              (skillAffs[sa].matchedBy && skillAffs[sa].matchedBy[0] === 'fallback');
            if (bothFallback) pairScore = 0.5;
            if (pairScore > affOverlapScore) {
              affOverlapScore = pairScore;
              sharedAff = {
                id: blAffs[ba].id,
                bothStrong: Boolean(blAffs[ba].strong && skillAffs[sa].strong),
                eitherStrong: Boolean(blAffs[ba].strong || skillAffs[sa].strong),
                bothFallback: bothFallback
              };
            }
          }
        }
      }

      // 2) Shared energy system check
      var energyMatch = (blEnergy !== '通用' && skillEnergy !== '通用' && blEnergy === skillEnergy);

      // 3) Shared tactical combat tag check (excluding generic '血统' / '耗材' / '原著')
      var sharedTags = [];
      for (var t = 0; t < blTags.length; t++) {
        var tg = blTags[t];
        if (tg === '血统' || tg === '耗材' || tg === '原著' || tg === '泛用战术') continue;
        if (skillTags.indexOf(tg) !== -1) sharedTags.push(tg);
      }

      // 4) Same-item bloodline active release (casting the bloodline's own active signature)
      var isSelfBloodlineSkill = (blId === skillId);

      // Determine whether resonance triggers
      var hasStrongAffinity = Boolean(sharedAff && !sharedAff.bothFallback && (sharedAff.bothStrong || (sharedAff.eitherStrong && affOverlapScore >= 3.2)));
      var hasNormalAffinity = Boolean(sharedAff && !sharedAff.bothFallback && affOverlapScore >= 2.5);
      var triggers = hasStrongAffinity || (hasNormalAffinity && (energyMatch || sharedTags.length > 0)) ||
        (energyMatch && sharedTags.length > 0) ||
        (energyMatch && !isSelfBloodlineSkill) ||
        sharedTags.length >= 1;

      // Require genuine attribute match; allow self-bloodline skill only if high tier / fused / strong affinity
      if (!triggers && isSelfBloodlineSkill && (blTierRank >= 2 || blIsFused || hasStrongAffinity)) {
        triggers = true;
      }

      if (!triggers) continue;

      var reasons = [];
      var totalScore = 0;
      if (hasStrongAffinity) {
        totalScore += 3.2;
        reasons.push(RESONANCE_AFFINITIES[sharedAff.id].label + '属性契合');
      } else if (hasNormalAffinity) {
        totalScore += 2.0;
        reasons.push(RESONANCE_AFFINITIES[sharedAff.id].label + '脉络呼应');
      }
      if (energyMatch) {
        totalScore += 1.6;
        reasons.push(blEnergy + '同源');
      }
      if (sharedTags.length > 0) {
        totalScore += Math.min(2.2, sharedTags.length * 1.15);
        reasons.push('特性「' + sharedTags[0] + '」增幅');
      }
      if (blIsFused) {
        totalScore += 1.25;
        reasons.push('融合血统超频');
      } else if (blTierRank >= 3) {
        totalScore += 0.8;
      }
      if (isSelfBloodlineSkill) {
        // Prefer cross-item bloodline + skill pairing slightly over self-only resonance when both exist
        totalScore -= 0.45;
      }

      var level = 1;
      if (totalScore >= 5.2 || (hasStrongAffinity && (blTierRank >= 3 || blIsFused || (energyMatch && sharedTags.length > 0)))) {
        level = 3;
      } else if (totalScore >= 3.0 || hasStrongAffinity || (energyMatch && sharedTags.length > 0)) {
        level = 2;
      }

      var chosenAffId = (sharedAff && !sharedAff.bothFallback)
        ? sharedAff.id
        : (blAffs[0] ? blAffs[0].id : 'arcane_ether');

      if (!bestMatch || totalScore > bestMatch.score) {
        bestMatch = {
          affinityId: chosenAffId,
          level: level,
          score: round2(totalScore),
          bloodlineId: blId,
          bloodlineName: blName,
          bloodlineTier: blTier,
          isFused: blIsFused,
          reasons: reasons
        };
      }
    }

    if (!bestMatch) return null;

    var affDef = RESONANCE_AFFINITIES[bestMatch.affinityId] || RESONANCE_AFFINITIES.arcane_ether;
    var lvIdx = clamp(bestMatch.level - 1, 0, 2);
    var bp = affDef.bonusProfile;
    var fusedBoost = bestMatch.isFused ? 0.06 : 0;

    var powerMult = round2(1 + bp.powerAdd[lvIdx] + fusedBoost);
    var radiusMult = round2(1 + bp.radiusAdd[lvIdx]);
    var durationMult = round2(1 + bp.durationAdd[lvIdx]);
    var cooldownMult = round2(clamp(1 - bp.cooldownCut[lvIdx], 0.65, 0.95));
    var energyCostMult = round2(clamp(1 - bp.costCut[lvIdx], 0.65, 0.95));
    var energyRefund = bp.energyRefund[lvIdx] || 0;
    var hpBonus = bp.hpBonus[lvIdx] || 0;
    var sanBonus = bp.sanBonus[lvIdx] || 0;
    var sealBonusPct = bp.sealBonusPct[lvIdx] || 0;
    var slowBonusSec = bp.slowBonusSec[lvIdx] || 0;

    var pRgb = parseHexToRgb01(affDef.primaryColor);
    var sRgb = parseHexToRgb01(affDef.secondaryColor);
    var aRgb = parseHexToRgb01(affDef.accentColor);

    var summaryParts = [
      '威力+' + Math.round((powerMult - 1) * 100) + '%',
      '范围+' + Math.round((radiusMult - 1) * 100) + '%'
    ];
    if (cooldownMult < 0.96) summaryParts.push('冷却-' + Math.round((1 - cooldownMult) * 100) + '%');
    if (slowBonusSec >= 1.2) summaryParts.push('冰滞+' + slowBonusSec.toFixed(1) + 's');
    else if (sealBonusPct > 0) summaryParts.push('封印+' + sealBonusPct + '%');
    else if (hpBonus > 0) summaryParts.push('回血+' + hpBonus);
    else if (energyRefund >= 6) summaryParts.push('返能+' + energyRefund);

    return {
      matched: true,
      affinityId: affDef.id,
      affinityLabel: affDef.label,
      resonanceName: affDef.resonanceTitle,
      badgeText: affDef.shortLabel + ' Lv.' + bestMatch.level,
      level: bestMatch.level,
      levelLabel: RESONANCE_LEVEL_LABELS[bestMatch.level] || '同源共鸣',
      score: bestMatch.score,
      bloodlineId: bestMatch.bloodlineId,
      bloodlineName: bestMatch.bloodlineName,
      bloodlineTier: bestMatch.bloodlineTier,
      skillId: skillId,
      skillName: skillName,
      matchReasons: bestMatch.reasons,
      globalFxStyle: affDef.globalFxStyle,
      desc: affDef.desc,
      colors: {
        primary: affDef.primaryColor,
        secondary: affDef.secondaryColor,
        accent: affDef.accentColor,
        primaryHex: rgb01ToHexInt(pRgb[0], pRgb[1], pRgb[2]),
        secondaryHex: rgb01ToHexInt(sRgb[0], sRgb[1], sRgb[2]),
        accentHex: rgb01ToHexInt(aRgb[0], aRgb[1], aRgb[2]),
        primaryRgb: pRgb,
        secondaryRgb: sRgb,
        accentRgb: aRgb
      },
      bonuses: {
        powerMult: powerMult,
        radiusMult: radiusMult,
        durationMult: durationMult,
        cooldownMult: cooldownMult,
        energyCostMult: energyCostMult,
        noiseMult: bp.noiseMult,
        energyRefund: energyRefund,
        hpBonus: hpBonus,
        sanBonus: sanBonus,
        sealBonusPct: sealBonusPct,
        slowBonusSec: slowBonusSec
      },
      summaryText: summaryParts.join(' · ')
    };
  }

  function buildLoadoutResonanceSummary(bloodlines, slots, basicAttack) {
    var blList = Array.isArray(bloodlines) ? bloodlines : [];
    var slList = Array.isArray(slots) ? slots : [];
    var activeSlots = [];
    var bestRes = null;
    var affinityCounts = Object.create(null);

    for (var i = 0; i < slList.length; i++) {
      var r = slList[i] && slList[i].resonance;
      if (r && r.matched) {
        activeSlots.push({
          slotIndex: i,
          key: slList[i].key || String(i + 1),
          skillName: slList[i].name,
          bloodlineName: r.bloodlineName,
          affinityId: r.affinityId,
          resonanceName: r.resonanceName,
          badgeText: r.badgeText,
          level: r.level,
          color: r.colors.primary,
          summaryText: r.summaryText
        });
        affinityCounts[r.affinityId] = (affinityCounts[r.affinityId] || 0) + r.level;
        if (!bestRes || r.level > bestRes.level || (r.level === bestRes.level && r.score > bestRes.score)) {
          bestRes = r;
        }
      }
    }

    var activeCount = activeSlots.length;
    var passiveBonuses = {
      damageMultAdd: round2(Math.min(0.24, activeCount * 0.045 + (bestRes ? bestRes.level * 0.02 : 0))),
      energyRegenAdd: round1(Math.min(3.5, activeCount * 0.55 + (bestRes ? bestRes.level * 0.3 : 0))),
      maxHpAdd: Math.round(Math.min(48, activeCount * 8 + (bestRes && bestRes.affinityId === 'vital_sanctuary' ? 16 : 0))),
      moveSpeedAdd: round2(Math.min(0.12, activeCount * 0.02 + (bestRes && bestRes.affinityId === 'void_space' ? 0.04 : 0))),
      memeResistAdd: round2(Math.min(0.16, activeCount * 0.025 + (bestRes && bestRes.affinityId === 'occult_seal' ? 0.06 : 0))),
      noiseMult: (bestRes && bestRes.affinityId === 'shadow_venom') ? 0.86 : 1.0
    };

    return {
      hasBloodline: blList.length > 0,
      bloodlineNames: blList.map(function (b) { return b.name; }),
      activeCount: activeCount,
      dominantAffinity: bestRes ? bestRes.affinityId : null,
      dominantName: bestRes ? bestRes.resonanceName : null,
      dominantBadge: bestRes ? bestRes.badgeText : null,
      dominantColor: bestRes ? bestRes.colors.primary : null,
      basicResonance: (basicAttack && basicAttack.resonance) ? basicAttack.resonance.badgeText : null,
      slots: activeSlots,
      passiveBonuses: passiveBonuses
    };
  }

  // Cached procedural crystalline 4-point star/hexagon sprite texture for global resonance particles
  var cachedResonanceCrystalTex = null;
  function getResonanceCrystalTexture(THREE) {
    if (cachedResonanceCrystalTex) return cachedResonanceCrystalTex;
    if (!THREE || typeof document === 'undefined' || !document.createElement) return null;
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      var ctx = canvas.getContext('2d');
      if (!ctx) return null;
      var grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0.0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.28, 'rgba(255,255,255,0.92)');
      grad.addColorStop(0.58, 'rgba(255,255,255,0.34)');
      grad.addColorStop(1.0, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Crisp crystalline diamond star flare inside sprite
      if (typeof ctx.beginPath === 'function') {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.moveTo(32, 4);
        ctx.lineTo(36, 28);
        ctx.lineTo(60, 32);
        ctx.lineTo(36, 36);
        ctx.lineTo(32, 60);
        ctx.lineTo(28, 36);
        ctx.lineTo(4, 32);
        ctx.lineTo(28, 28);
        ctx.closePath();
        ctx.fill();
      }
      var tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      cachedResonanceCrystalTex = tex;
      return tex;
    } catch (_) {
      return null;
    }
  }

  /**
   * Arena-Wide Global Three.js Particle VFX Engine for Bloodline Resonance:
   * Spawns a wide-field atmospheric particle storm (120-210 particles),
   * ground-sweeping horizon resonance waves, a sky-pillar prism veil, and
   * an orbital resonance halo crown. Strictly disposes all GPU resources.
   */
  function triggerGlobalResonanceVfx(THREE, scene, resonance, opts) {
    if (!THREE || !scene || !resonance) return null;
    var cfg = opts || {};
    var affDef = RESONANCE_AFFINITIES[resonance.affinityId] || RESONANCE_AFFINITIES.frost;
    var fxStyle = resonance.globalFxStyle || affDef.globalFxStyle || 'frost_blizzard';
    var level = clamp(Number(resonance.level) || 2, 1, 3);
    var ox = Number(cfg.x) || 0;
    var oz = Number(cfg.z) || 0;
    var angle = Number(cfg.angle) || 0;
    var arenaSpread = clamp(Number(cfg.spread) || (16.5 + level * 2.5), 10, 28);
    var dur = clamp(Number(cfg.duration) || (1.35 + level * 0.24), 0.9, 2.6);
    var count = Math.round((112 + level * 32) * clamp(Number(cfg.intensityScale) || 1.0, 0.5, 1.5));

    var cols = resonance.colors || {
      primaryHex: rgb01ToHexInt.apply(null, parseHexToRgb01(affDef.primaryColor)),
      secondaryHex: rgb01ToHexInt.apply(null, parseHexToRgb01(affDef.secondaryColor)),
      accentHex: rgb01ToHexInt.apply(null, parseHexToRgb01(affDef.accentColor)),
      primaryRgb: parseHexToRgb01(affDef.primaryColor),
      secondaryRgb: parseHexToRgb01(affDef.secondaryColor),
      accentRgb: parseHexToRgb01(affDef.accentColor)
    };

    var group = new THREE.Group();
    group.position.set(ox, 0, oz);
    var geos = [];
    var mats = [];

    // Layer 1: Global Battlefield Atmospheric Particle Cloud (THREE.Points)
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var vels = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var radii = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      var frac = i / count;
      var ang = Math.random() * Math.PI * 2;
      var dist = Math.sqrt(Math.random()) * arenaSpread;
      phases[i] = frac * Math.PI * 2 + Math.random() * 2.4;
      radii[i] = Math.max(0.8, dist);

      var cPick = i % 5;
      var cSrc = cPick === 0 ? cols.accentRgb : (cPick % 2 === 0 ? cols.secondaryRgb : cols.primaryRgb);
      colors[i3] = cSrc[0];
      colors[i3 + 1] = cSrc[1];
      colors[i3 + 2] = cSrc[2];

      if (fxStyle === 'frost_blizzard') {
        // Swirling glacial snowflakes & ice shards blanketing the whole viewport
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.35 + Math.random() * 7.8;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = Math.cos(angle + 0.6) * (3.2 + Math.random() * 3.4);
        vels[i3 + 1] = -(1.4 + Math.random() * 2.2);
        vels[i3 + 2] = Math.sin(angle + 0.6) * (3.2 + Math.random() * 3.4);
      } else if (fxStyle === 'pyro_tempest') {
        // Incandescent rising ember tempest across entire battlefield
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.15 + Math.random() * 2.8;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = -Math.sin(ang) * (2.6 + Math.random() * 2.8);
        vels[i3 + 1] = 3.0 + Math.random() * 3.6;
        vels[i3 + 2] = Math.cos(ang) * (2.6 + Math.random() * 2.8);
      } else if (fxStyle === 'sword_domain') {
        // Slanted luminous sword-qi rain sweeping across the corridor
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 2.6 + Math.random() * 6.5;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = Math.cos(angle) * (4.6 + Math.random() * 3.0);
        vels[i3 + 1] = -(3.8 + Math.random() * 2.6);
        vels[i3 + 2] = Math.sin(angle) * (4.6 + Math.random() * 3.0);
      } else if (fxStyle === 'cyber_matrix') {
        // Quantized vertical digital rain columns across the entire station
        var colX = Math.round((Math.random() - 0.5) * arenaSpread * 1.6);
        var colZ = Math.round((Math.random() - 0.5) * arenaSpread * 1.6);
        positions[i3] = colX;
        positions[i3 + 1] = 0.5 + Math.random() * 8.2;
        positions[i3 + 2] = colZ;
        vels[i3] = 0;
        vels[i3 + 1] = -(3.4 + (i % 4) * 1.1);
        vels[i3 + 2] = 0;
      } else if (fxStyle === 'void_aurora') {
        // Reverse-gravity starlight ascending through orbital drift
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.2 + Math.random() * 4.5;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = Math.cos(ang) * -1.4;
        vels[i3 + 1] = 2.0 + Math.random() * 2.5;
        vels[i3 + 2] = Math.sin(ang) * -1.4;
      } else if (fxStyle === 'occult_eclipse') {
        // Spiraling cinnabar-gold talisman motes sweeping around the arena
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.25 + Math.random() * 5.2;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = 0;
        vels[i3 + 1] = 1.4 + Math.random() * 1.8;
        vels[i3 + 2] = 0;
      } else if (fxStyle === 'sanctuary_bloom') {
        // Soft ascending golden-emerald healing pollen across the hall
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.15 + Math.random() * 3.4;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = (Math.random() - 0.5) * 1.0;
        vels[i3 + 1] = 1.6 + Math.random() * 1.8;
        vels[i3 + 2] = (Math.random() - 0.5) * 1.0;
      } else if (fxStyle === 'shadow_mist') {
        // Low-altitude phantom mist wisps gliding across the floor
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.2 + Math.random() * 2.2;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = Math.cos(ang + 1.2) * (2.5 + Math.random() * 2.2);
        vels[i3 + 1] = 0.4 + Math.random() * 0.7;
        vels[i3 + 2] = Math.sin(ang + 1.2) * (2.5 + Math.random() * 2.2);
      } else if (fxStyle === 'titan_quake') {
        // Explosive upward magma-gold seismic debris across the arena
        positions[i3] = Math.cos(ang) * (dist * 0.85);
        positions[i3 + 1] = 0.15 + Math.random() * 1.1;
        positions[i3 + 2] = Math.sin(ang) * (dist * 0.85);
        vels[i3] = Math.cos(ang) * (2.0 + Math.random() * 3.2);
        vels[i3 + 1] = 4.2 + Math.random() * 3.8;
        vels[i3 + 2] = Math.sin(ang) * (2.0 + Math.random() * 3.2);
      } else {
        // arcane_constellation: twinkling orbital starlight nodes
        positions[i3] = Math.cos(ang) * dist;
        positions[i3 + 1] = 0.8 + Math.random() * 6.0;
        positions[i3 + 2] = Math.sin(ang) * dist;
        vels[i3] = 0;
        vels[i3 + 1] = 0.8 + Math.random() * 1.2;
        vels[i3 + 2] = 0;
      }
    }

    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var crystalTex = getResonanceCrystalTexture(THREE) || getParticleGlowTexture(THREE);
    var pMat = new THREE.PointsMaterial({
      size: 0.42 + level * 0.08,
      map: crystalTex || null,
      vertexColors: true,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(pGeo, pMat);
    pts.frustumCulled = false;
    group.add(pts);
    geos.push(pGeo);
    mats.push(pMat);

    // Layer 2: Global Ground-Sweeping Resonance Wave Rings (2-3 concentric waves)
    var waveCount = level >= 3 ? 3 : 2;
    var waveRings = [];
    for (var wi = 0; wi < waveCount; wi++) {
      var segs = fxStyle === 'frost_blizzard' ? 6 : (fxStyle === 'cyber_matrix' ? 8 : 40);
      var wGeo = new THREE.RingGeometry(0.84, 1.0, segs);
      wGeo.rotateX(-Math.PI / 2);
      var wMat = new THREE.MeshBasicMaterial({
        color: wi === 0 ? cols.primaryHex : (wi === 1 ? cols.secondaryHex : cols.accentHex),
        transparent: true,
        opacity: 0.78 - wi * 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      var wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.y = 0.14 + wi * 0.06;
      group.add(wMesh);
      geos.push(wGeo);
      mats.push(wMat);
      waveRings.push({ mesh: wMesh, mat: wMat, delay: wi * 0.14, maxR: arenaSpread * (0.95 + wi * 0.15) });
    }

    // Layer 3: Theatrical Sky-Pillar Resonance Prism Veil & Orbital Crown
    var pillarGeo = new THREE.CylinderGeometry(0.85, 1.65, 11.5, fxStyle === 'frost_blizzard' ? 6 : 16, 1, true);
    var pillarMat = new THREE.MeshBasicMaterial({
      color: cols.primaryHex,
      transparent: true,
      opacity: 0.34 + level * 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.y = 5.75;
    group.add(pillarMesh);
    geos.push(pillarGeo);
    mats.push(pillarMat);

    // Elevated resonance crown ring hovering overhead
    var crownSegs = fxStyle === 'frost_blizzard' ? 6 : 24;
    var crownPts = [];
    for (var ci = 0; ci < crownSegs; ci++) {
      var ca = (ci / crownSegs) * Math.PI * 2;
      crownPts.push(new THREE.Vector3(Math.cos(ca) * 2.2, 0, Math.sin(ca) * 2.2));
    }
    var crownGeo = new THREE.BufferGeometry().setFromPoints(crownPts);
    var crownMat = new THREE.LineBasicMaterial({
      color: cols.secondaryHex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var crownLoop = new THREE.LineLoop(crownGeo, crownMat);
    crownLoop.position.y = 2.6;
    group.add(crownLoop);
    geos.push(crownGeo);
    mats.push(crownMat);

    scene.add(group);

    var elapsed = 0;
    return {
      group: group,
      resonance: resonance,
      ttl: dur,
      maxTtl: dur,
      update: function (dt) {
        var stepDt = Math.max(0.001, dt || 0.016);
        this.ttl -= stepDt;
        elapsed += stepDt;
        var p = 1 - clamp(this.ttl / this.maxTtl, 0, 1);

        var posAttr = pGeo.attributes.position;
        var arr = posAttr.array;

        for (var k = 0; k < count; k++) {
          var k3 = k * 3;
          if (fxStyle === 'frost_blizzard') {
            var sw = elapsed * 2.4 + phases[k];
            arr[k3] += (vels[k3] + Math.cos(sw) * 2.1) * stepDt;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] += (vels[k3 + 2] + Math.sin(sw) * 2.1) * stepDt;
            if (arr[k3 + 1] < 0.12) arr[k3 + 1] = 7.4;
          } else if (fxStyle === 'pyro_tempest') {
            arr[k3] += (vels[k3] + Math.sin(elapsed * 5.0 + phases[k]) * 1.4) * stepDt;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] += (vels[k3 + 2] + Math.cos(elapsed * 5.0 + phases[k]) * 1.4) * stepDt;
          } else if (fxStyle === 'sword_domain') {
            arr[k3] += vels[k3] * stepDt;
            arr[k3 + 1] = Math.max(0.14, arr[k3 + 1] + vels[k3 + 1] * stepDt);
            arr[k3 + 2] += vels[k3 + 2] * stepDt;
          } else if (fxStyle === 'cyber_matrix') {
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            if (arr[k3 + 1] < 0.14) arr[k3 + 1] = 8.0;
          } else if (fxStyle === 'occult_eclipse' || fxStyle === 'arcane_constellation') {
            var spinRate = fxStyle === 'occult_eclipse' ? 1.85 : 1.15;
            var curAng = phases[k] + elapsed * spinRate;
            var rCur = radii[k] * (fxStyle === 'occult_eclipse' ? (1.0 - p * 0.25) : (1.0 + p * 0.12));
            arr[k3] = Math.cos(curAng) * rCur;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] = Math.sin(curAng) * rCur;
          } else if (fxStyle === 'titan_quake') {
            vels[k3 + 1] -= 9.2 * stepDt;
            arr[k3] += vels[k3] * stepDt;
            arr[k3 + 1] = Math.max(0.12, arr[k3 + 1] + vels[k3 + 1] * stepDt);
            arr[k3 + 2] += vels[k3 + 2] * stepDt;
          } else {
            // void_aurora / sanctuary_bloom / shadow_mist
            arr[k3] += (vels[k3] + Math.cos(elapsed * 2.2 + phases[k]) * 0.65) * stepDt;
            arr[k3 + 1] += vels[k3 + 1] * stepDt;
            arr[k3 + 2] += (vels[k3 + 2] + Math.sin(elapsed * 2.2 + phases[k]) * 0.65) * stepDt;
          }
        }
        posAttr.needsUpdate = true;

        // Smooth fade envelope: fast rise -> hold -> graceful dissolve
        var env = p < 0.15 ? (p / 0.15) : Math.pow(1 - (p - 0.15) / 0.85, 1.15);
        pMat.opacity = 0.94 * clamp(env, 0, 1);

        // Expand global floor resonance waves
        for (var wi = 0; wi < waveRings.length; wi++) {
          var wr = waveRings[wi];
          var wp = clamp((p - wr.delay) / Math.max(0.25, 1 - wr.delay), 0, 1);
          var eased = 1 - Math.pow(1 - wp, 2.2);
          var sc = 0.9 + eased * wr.maxR;
          wr.mesh.scale.set(sc, 1, sc);
          wr.mesh.rotation.y += stepDt * (wi % 2 === 0 ? 1.2 : -1.5);
          wr.mat.opacity = (wp <= 0 ? 0 : (0.76 - wi * 0.12) * Math.pow(1 - wp, 1.3));
        }

        // Sky-pillar flares brightly in first 45% then dissolves smoothly
        var pilP = clamp(p / 0.65, 0, 1);
        var pilSc = 0.8 + pilP * (1.8 + level * 0.35);
        pillarMesh.scale.set(pilSc, 1 + pilP * 0.25, pilSc);
        pillarMesh.rotation.y += stepDt * 1.8;
        pillarMat.opacity = (0.34 + level * 0.06) * Math.pow(1 - pilP, 1.4);

        // Overhead resonance crown expands & rotates
        var crSc = 0.75 + p * (2.6 + level * 0.55);
        crownLoop.scale.set(crSc, 1, crSc);
        crownLoop.position.y = 2.4 + p * 2.4;
        crownLoop.rotation.y -= stepDt * 3.4;
        crownMat.opacity = 0.88 * Math.pow(1 - p, 1.2);
      },
      dispose: function () {
        scene.remove(group);
        for (var gi = 0; gi < geos.length; gi++) geos[gi].dispose();
        for (var mi = 0; mi < mats.length; mi++) mats[mi].dispose();
      }
    };
  }

  var BloodlineResonance = {
    AFFINITY_ORDER: RESONANCE_AFFINITY_ORDER,
    AFFINITIES: RESONANCE_AFFINITIES,
    isBloodlineItem: isBloodlineItem,
    extractAffinities: extractItemAffinities,
    extractEquippedBloodlines: extractEquippedBloodlines,
    evaluate: evaluateBloodlineResonance,
    buildLoadoutSummary: buildLoadoutResonanceSummary,
    triggerGlobalVfx: triggerGlobalResonanceVfx
  };

  // ---------------------------------------------------------------------------
  // 12. Public Export on window.INFINITY.Skills25D, ParticleVfx25D & BloodlineResonance25D
  // ---------------------------------------------------------------------------
  INFINITY.ParticleVfx25D = ParticleVfx;
  INFINITY.BloodlineResonance25D = BloodlineResonance;
  INFINITY.Skills25D = {
    ARCHETYPES: ARCHETYPES,
    ARCHETYPE_ORDER: ARCHETYPE_ORDER,
    STARTER_SKILLS: STARTER_SKILLS,
    VFX_MOTIFS: VFX_MOTIFS,
    PARTICLE_TRIGGER_ANIMS: PARTICLE_TRIGGER_ANIMS,
    PARTICLE_CATALOG: PARTICLE_CATALOG,
    RESONANCE_AFFINITIES: RESONANCE_AFFINITIES,
    ParticleVfx: ParticleVfx,
    BloodlineResonance: BloodlineResonance,
    buildVfxProfile: buildVfxProfile,
    buildParticlePreset: buildParticlePreset,
    getParticlePreset: getParticlePreset,
    evaluateBloodlineResonance: evaluateBloodlineResonance,
    triggerGlobalResonanceVfx: triggerGlobalResonanceVfx,
    mapItemToSkill: mapItemToSkill,
    buildCombatLoadout: buildCombatLoadout
  };
})(typeof window !== 'undefined' ? window : globalThis);
