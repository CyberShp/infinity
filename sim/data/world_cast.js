/* ============================================================================
 * Infinity Living Simulator — World Cast & Living Universe Feed
 * Original Squad (5) + Canon Squad (4) + 12 Atmospheric World Feed Bulletins
 * Attaches cleanly to window.INFINITY (no ES modules, zero hardcoded secrets)
 * ============================================================================ */
(function (global) {
  'use strict';
  var INFINITY = (global.INFINITY = global.INFINITY || {});

  INFINITY.CAST = {
    yanci: {
      id: 'yanci',
      name: '严辞',
      codename: 'CN-10284',
      group: 'original',
      role: '执棋队长 · 律法破局',
      tier: 'C+',
      inStationZero: true,
      canMeetInHall: true,
      accentColor: '#7ca7d9',
      signatureItems: ['M021', 'M023', 'G011', 'A034'],
      personality: '23岁政法系刑侦与博弈论双料出身。极度冷静、锋利、重程序与契约底线；习惯先拆解考题措辞与利益结构，再分配风险。骨子里孤傲护短，宁可自己兜底也不肯卖队友，但绝不接受无证据的直觉拍板。',
      speechStyle: '短句、冷冽、结构化。常以反问或“两条前提/三点漏洞”切入，极少用感叹号；对队友直呼其名或称代号，认可他人时仅以极短的事实确认收尾。',
      forbiddenTropes: [
        '禁止中二宣誓或发表长篇大论说教',
        '禁止对玩家无条件崇拜或盲从',
        '禁止在危机时情绪崩溃或廉价煽情',
        '禁止像百科全书一样替系统做设定科普'
      ],
      initialTrust: 42,
      initialCaution: 48,
      initialBond: 18,
      statusText: '在公共长廊核对上一场的扣分明细与播报录音',
      hallOpeningHook: '“你刚从兑换终端过来？把你打算带的保命底牌报个类型就行，不用报细节——下一场如果是规则考，我们得先确认谁能兜住前十五分钟。”'
    },

    lujin: {
      id: 'lujin',
      name: '陆烬',
      codename: 'CN-10291',
      group: 'original',
      role: '攻坚主C · 赛博体魄',
      tier: 'C+',
      inStationZero: true,
      canMeetInHall: true,
      accentColor: '#d97b54',
      signatureItems: ['B041', 'T017', 'G025', 'T042'],
      personality: '21岁前青年散打冠军兼山地救援志愿者。寡言、行动力极强、临危拥有野兽级动态直觉；不爱扯虚词，信奉“欠命就用命还”。现实中妹妹患罕见病卧床，因此对分数与晋升节奏极度克制务实，绝不冲动送死。',
      speechStyle: '干脆利落、惜字如金，多动词和方位判断。不顺耳的话直接顶回去，确认战术时只回“收到”“我顶左翼”“三秒够了”。',
      forbiddenTropes: [
        '禁止写成无脑莽夫或喊招式名的热血笨蛋',
        '禁止动不动把妹妹挂在嘴边卖惨',
        '禁止无故暴躁挑衅队友',
        '禁止对玩家阿谀奉承'
      ],
      initialTrust: 48,
      initialCaution: 36,
      initialBond: 24,
      statusText: '在训练靶场校准电磁步枪后坐力与神经响应延迟',
      hallOpeningHook: '“上次气闸口那一下，算我欠你半条命。站着别动——你握剑的左肩比三天前沉了一点，换新强化了？”'
    },

    xutan: {
      id: 'xutan',
      name: '许檀',
      codename: 'CN-10297',
      group: 'original',
      role: '副队长 · 侦察与灵能技术',
      tier: 'C',
      inStationZero: true,
      canMeetInHall: true,
      accentColor: '#58c4a6',
      signatureItems: ['T004', 'T008', 'T012', 'T022'],
      personality: '22岁密码学与嵌入式系统研究生。敏锐、好奇心重、擅长拆解硬件协议与频段异常；早先仍带点“把死考当硬核密室解”的侥幸，在几次贴着死线擦过后正迅速脱敏冷硬起来。严辞不在时能稳住副队决断。',
      speechStyle: '语速偏快但逻辑清晰，爱用读数、延迟毫秒、频段和样本误差说话；紧张时会不自觉敲表盘或压低声线报数据。',
      forbiddenTropes: [
        '禁止满嘴二次元烂梗或油腻宅男腔',
        '禁止在生死场里嬉皮笑脸把死人当儿戏',
        '禁止万能黑客一键破解所有超凡规则',
        '禁止长段技术术语堆砌水字数'
      ],
      initialTrust: 40,
      initialCaution: 44,
      initialBond: 20,
      statusText: '蹲在兑换柱阴影下改装折叠无人机的非电子频段天线',
      hallOpeningHook: '“别靠太近，这台 PKE 探头刚焊了法拉第屏蔽层，靠近高真元目标读数会漂。对了，公共频道刚刷了两条匿名榜单传闻，要听吗？”'
    },

    guhe: {
      id: 'guhe',
      name: '顾禾',
      codename: 'CN-08914',
      group: 'original',
      role: '创伤医疗 · 异常净化（外队独活者）',
      tier: 'C+',
      inStationZero: false,
      canMeetInHall: true,
      accentColor: '#c98bb9',
      signatureItems: ['G001', 'G028', 'T028', 'B058'],
      personality: '28岁原急诊创伤科医生，目前仍隶属外队“赤霄队”编制但已目睹太多伤员因付不起空间天价修复费被抹杀。冷静、边界感极强、拒绝廉价同情；救人先看存活率与感染风险，亲手关得上隔离门。',
      speechStyle: '平缓、克制、带急诊医生的职业冷感。用体征、失血量、污染层级评估一切，从不承诺“一定没事”。',
      forbiddenTropes: [
        '禁止写成圣母白莲花或无脑见死必救',
        '禁止对陌生考生主动倾诉创伤博取安慰',
        '禁止暧昧发糖或刻意柔弱求助',
        '禁止空洞的心理鸡汤'
      ],
      initialTrust: 26,
      initialCaution: 68,
      initialBond: 10,
      statusText: '在医疗补给终端前逐项核对止血喷雾与灵魂缝合价目',
      hallOpeningHook: '“手腕内侧那道旧痂还没完全退干净，说明你上次回来省了完美修复的钱。别误会，我只是职业病——真进下一个场，别指望普通喷雾能兜住内出血。”'
    },

    shenyan: {
      id: 'shenyan',
      name: '沈砚',
      codename: 'CN-07419',
      group: 'original',
      role: '临时并场老生 · 情报掮客',
      tier: 'C+',
      inStationZero: true,
      canMeetInHall: false,
      accentColor: '#c9a66b',
      signatureItems: ['A004', 'A014', 'G010', 'A017'],
      personality: '自称经历过三场灵异考的独行老考生，实则背负高额系统扣罚、在《零号回廊》中接到了与玩家小队冲突的隐蔽加分条款。八面玲珑却处处留后手，给的情报七分真三分毒，永远把自己的退路藏在协议缝隙里。',
      speechStyle: '温和圆滑、半真半假，喜欢先抛一点货真价实的保命经验博取信任，再用“我只是多嘴提醒一句”埋下误导前提。',
      forbiddenTropes: [
        '禁止把“我是反派我要背刺”写在脸上',
        '禁止浮夸阴险冷笑或自曝全部阴谋',
        '禁止无脑送人头或被一句嘴炮感化洗白',
        '禁止脱离自身求生利益做纯粹损人不利己的蠢事'
      ],
      initialTrust: 18,
      initialCaution: 78,
      initialBond: 5,
      statusText: '滞留在《零号回廊》检票大厅阴影柱后，手里夹着一枚老式机械秒表',
      hallOpeningHook: '“哟，新面孔？别急着拔家伙——看表盘，检票厅的灯每隔七分钟闪一次，那是零号站台给活人留的呼吸窗。想少死两个人，先听我把这里的规矩说完？”'
    },

    yelin: {
      id: 'yelin',
      name: '夜林',
      codename: 'CN-11001',
      group: 'canon',
      role: '灵安小队核心 · 认知破局者',
      tier: 'B+',
      inStationZero: false,
      canMeetInHall: true,
      accentColor: '#e05a5a',
      signatureItems: ['B022', 'B023', 'A047', 'T002'],
      personality: '原著核心人物。极度清醒、冷静近乎残酷的实用主义推理者，擅长从最细微的制度反常反推考场底层真相。对陌生人只谈筹码与风险隔离，绝不轻易暴露底牌；但在认定的队友身上愿意承担真实代价。',
      speechStyle: '平静、寡淡、句句戳在利害与逻辑死穴上。很少提高音量，审视陌生考生时像在评估一份可能带毒的情报样本。',
      forbiddenTropes: [
        '禁止替玩家解决考场问题或强行加入玩家小队',
        '禁止把原著后期未公开底牌直接抖给陌生人',
        '禁止写成装逼龙傲天或油腻高冷霸总',
        '禁止无缘无故对玩家展露熟稔或好感'
      ],
      initialTrust: 15,
      initialCaution: 82,
      initialBond: 4,
      statusText: '在空间广场边缘翻看一份手写折页，似乎刚结束《新生》后的复盘',
      hallOpeningHook: '“你盯着我腕表看了两秒，又扫了眼我左手虎口的老茧。如果是来打听《新生》场里伦敦隔离区的情报，免谈——无偿交换的信息，一般最贵。”'
    },

    litianyang: {
      id: 'litianyang',
      name: '李天阳',
      codename: 'CN-04118',
      group: 'canon',
      role: '资深强攻与收容者 · 灵棺持有者',
      tier: 'A-',
      inStationZero: false,
      canMeetInHall: true,
      accentColor: '#9b87d9',
      signatureItems: ['A062', 'A063', 'A041', 'B021'],
      personality: '原著资深老生，经历过原队覆灭与迟归断层。表面温和沉稳、带点过来人的克制善意，实则对灵异规则和失踪异常保持着近乎偏执的警觉；话只说七分，提到“旧版本界面”或“仙门后”会立刻闭口。',
      speechStyle: '低沉、缓慢、带一点疲惫的稳重。愿意顺手提醒新人一两句保命常识，但涉及核心秘密时立刻冷处理收声。',
      forbiddenTropes: [
        '禁止无代价充当保姆或代打',
        '禁止直接剧透仙门与旧版本系统的核心谜底',
        '禁止过度悲情卖惨或强行说教',
        '禁止忽略自身的戒备边界'
      ],
      initialTrust: 28,
      initialCaution: 64,
      initialBond: 10,
      statusText: '靠在血色漩涡外环石栏旁擦拭一截暗沉捕灵网扣件',
      hallOpeningHook: '“看你站姿，应该刚撑过两场？提个不值钱的建议：下一场如果听到系统口播催你快上车、快签字、快回头，先看自己腕表跳不跳秒，别信耳朵。”'
    },

    anke: {
      id: 'anke',
      name: '安可',
      codename: 'CN-06302',
      group: 'canon',
      role: '灵安老牌骨干 · 远程控场与战术统筹',
      tier: 'B',
      inStationZero: false,
      canMeetInHall: true,
      accentColor: '#56b4d3',
      signatureItems: ['B047', 'T017', 'T045', 'G019'],
      personality: '六场以上资历的冷静老手。干练、务实、永远留着至少一层信息差与保命后手；对死考空间的交易规则与强队生态极其熟悉，不轻信口头承诺，但欣赏做事有分寸、懂止损的同行。',
      speechStyle: '清脆利落、带一点老手审视同行的克制分寸，直指核心筹码，绝不浪费客套。',
      forbiddenTropes: [
        '禁止写成刻板花瓶或情绪化角色',
        '禁止白送高价值情报或装备',
        '禁止与玩家产生莫名其妙的暧昧互动',
        '禁止无视灵安小队的独立立场'
      ],
      initialTrust: 22,
      initialCaution: 72,
      initialBond: 8,
      statusText: '在公共通道调试双机加密通讯器，顺手抄录高阶强化折扣清单',
      hallOpeningHook: '“能活着在公共长廊挑折价货的人，通常比那些满口冲分的新人活得久。要换基础场次消息可以，拿你见过的一条异常规则来换，等价。”'
    },

    hezheng: {
      id: 'hezheng',
      name: '贺铮',
      codename: 'CN-09215',
      group: 'canon',
      role: '灵安近战前排 · 绝境断后手',
      tier: 'B-',
      inStationZero: false,
      canMeetInHall: true,
      accentColor: '#d48c46',
      signatureItems: ['B021', 'T001', 'T002', 'G036'],
      personality: '怕死却从不在关键时刻往后缩的硬汉。务实、糙中带细、心里始终挂着回家和杨巧的念想；对空间造人服务保持清醒的刺痛感，宁可多买两颗战术手雷保队友活命，也不信虚无缥缈的运气。',
      speechStyle: '直白、接地气、略带烟火气与自嘲，不端架子，但一谈到实战配合立刻严肃精准。',
      forbiddenTropes: [
        '禁止写成无脑愣头青或只会喊口号的炮灰',
        '禁止过度廉价煽情',
        '禁止背离自身务实求生的底线',
        '禁止替玩家免费出头'
      ],
      initialTrust: 32,
      initialCaution: 54,
      initialBond: 14,
      statusText: '在私人房间走廊口抽完半支烟，手里拎着刚清点完的战术手雷盒',
      hallOpeningHook: '“兄弟，借个火——算了，看你身上这股清凉劲儿也不像抽烟的。刚准备买保命装备？听句实在的，别光看评分高的，狭小地形里两颗闪光和烟雾比花架子管用。”'
    }
  };

  INFINITY.WORLD_FEED = [
    {
      id: 'WF_01',
      cycle: 1,
      source: '公共长廊匿名公告板',
      tag: '原著波动',
      title: '《新生》隔离考场结算异常：伦敦片区出现高额信息污染警告',
      body: '数名刚从《新生》退出的外队生还者低价甩卖抗病毒血清，传闻某支新锐“灵安小队”里有人在考场内硬拆了“完美者”进化陷阱，另有同名双人异常记录被系统强行打码。',
      relatedCast: ['yelin', 'anke'],
      impactHint: '模因与信息传播型考题在近期权重上升，建议备置无网记录或抗认知干扰道具。'
    },
    {
      id: 'WF_02',
      cycle: 1,
      source: '空间血色漩涡 · 兑换异动',
      tag: '融合传闻',
      title: '双C血统融合标杆再现：“暴君＋观察者”样本被系统收录',
      body: '兑换柱底层查询栏短暂闪过一次 B 级定制血统登记波动——以高意志洞察血统压制生化狂暴失控。不少老考生开始跟风检索“守心/观察”类稳态基底，相关价格暗涨。',
      relatedCast: ['yelin'],
      impactHint: '血统融合实验室现已支持以毒攻毒制衡配方与跨体系同阶融合。'
    },
    {
      id: 'WF_03',
      cycle: 2,
      source: '东亚战区筹备频道（未公开）',
      tag: '规则警报',
      title: '疑似“拟态系统口播”案例首次被老生实名上报',
      body: '一名刚从山村灵异场逃出的资深考生在长廊留言警告：部分高危灵异实体能直接借用死考系统的提示音发布假指令，“凡催促立即上车、开门、报真名者，一律以腕表物理倒计时为准”。',
      relatedCast: ['litianyang', 'xutan'],
      impactHint: '《零号回廊》考场内极可能存在伪造系统播报，务必交叉核验线索。'
    },
    {
      id: 'WF_04',
      cycle: 2,
      source: '公共长廊 · 医疗补给区',
      tag: '小队动态',
      title: '“赤霄队”补给异常：两名伤员未购完美修复强行休眠',
      body: '急诊科出身的顾禾在补给终端前独自买走了整批纳米止血喷雾与灵魂伤势鉴别手册。有人听见她低声算账：“下次进场前，谁再乱碰无来源文字，我直接锁门。”',
      relatedCast: ['guhe'],
      impactHint: '可在空间大厅与顾禾交流，了解医疗成本与污染隔离的残酷边界。'
    },
    {
      id: 'WF_05',
      cycle: 3,
      source: '训练靶场日志',
      tag: '原队动态',
      title: '严辞与陆烬完成《坠星列车》复盘：确认下场采取“双核控防”站位',
      body: '严辞在白板上划掉了三条依赖纯火力的突破路线，陆烬则把神经超频延迟压到了 0.14 秒。两人达成共识：遇到打不死的规则体，第一时间把终结与封存窗口交给控防位。',
      relatedCast: ['yanci', 'lujin'],
      impactHint: '《零号回廊》内严辞与陆烬将优先配合你的封存/破局战术。'
    },
    {
      id: 'WF_06',
      cycle: 3,
      source: '灵安小队外围流言',
      tag: '原著波动',
      title: '六场老手安可与新人夜林正式建队，贺铮承担前排火力',
      body: '长廊里不少老队原本等着看那支混编新队在第二场折戟，结果他们不仅整建制活了出来，还反手吃下了一笔高额隐藏结算。安可在换购加密对讲机时被认出，未作任何回应。',
      relatedCast: ['yelin', 'anke', 'hezheng'],
      impactHint: '空间大厅偶遇灵安成员时，对方不会无偿分享底牌，但认可等价的逻辑交换。'
    },
    {
      id: 'WF_07',
      cycle: 4,
      source: '许檀的离线截包笔记',
      tag: '考场预兆',
      title: '腕表倒计时出现 0.3 秒周期抖动：指向封闭地下轨道异常区',
      body: '许檀拆开备用 PKE 探测器时截获到一段 15 分钟为周期的极低频铁轨共振杂音——频率不属于空间大厅，而像是一座早已停运的旧地铁换乘站。',
      relatedCast: ['xutan', 'yanci'],
      impactHint: '进入《零号回廊》后，每 15 分钟的列车进站周期将是生死节奏轴。'
    },
    {
      id: 'WF_08',
      cycle: 4,
      source: '黑市情报贩子口风',
      tag: '原著波动',
      title: '《希夷》传闻流出：有人看见编号缺失的资深者在仙门外围现身',
      body: '关于“希夷”山村与道观的残缺口述开始在 B 级权限区低声流传。有目击者称李天阳在迟归后带回了一口能硬截厉鬼动作的异常灵棺，但没人敢当面核实那段断层记忆。',
      relatedCast: ['litianyang'],
      impactHint: '空间大厅与李天阳交谈时，切忌反复追问其编号异常与仙门细节。'
    },
    {
      id: 'WF_09',
      cycle: 5,
      source: '自由并场匹配日志',
      tag: '危险预警',
      title: '独行老生“沈砚”连续三场以同队全灭、个人低伤存活结算',
      body: '系统并场记录显示，编号 CN-07419 曾三次被临时编入不同中小队伍，均在终局前精准抽身。没有确凿的违规击杀扣分，但所有与他合作过的队伍都没能走出站台类副本。',
      relatedCast: ['shenyan', 'yanci'],
      impactHint: '《零号回廊》中遇到沈砚，务必对其“热心指路”与“共同上车”提议保持高度戒备。'
    },
    {
      id: 'WF_10',
      cycle: 5,
      source: '空间大厅 · 现实世界暗流',
      tag: '世界观',
      title: '现实侧高考失踪统计被紧急加密，多地地铁末班车出现集体失联秒差',
      body: '据刚回归的现实联络者透露，外界并非静止不动——军方与异常研究组已开始比对失踪考生的生前轨迹。每一场死考带回去的情报，都可能改写现实侧的防线。',
      relatedCast: ['yelin', 'hezheng'],
      impactHint: '你的每一次考场生存与破局评级，都在悄悄改变这片战区的生存底线。'
    },
    {
      id: 'WF_11',
      cycle: 6,
      source: '兑换柱 · 折价专区刷新',
      tag: '战术补给',
      title: '本轮折价货架更新：一次性阵牌、电磁干扰雷与非电子锚点走俏',
      body: '越来越多老生意识到“堆满面板”不等于“扛得住规则杀”。带限次或副作用的 60% 折价专精道具成了 C–B 级小队破局的首选筹码。',
      relatedCast: ['xutan', 'lujin'],
      impactHint: '商城中多数装备支持 60% 折价入手（附带限次/代价标记），善用预算搭配多体系解法。'
    },
    {
      id: 'WF_12',
      cycle: 6,
      source: '战区排行榜（灰度预热）',
      tag: '原著波动',
      title: '系统底层监测到“战区榜单”测试帧：灵安小队与无名控防队同步建档',
      body: '血色漩涡顶端闪过不到半秒的灰度编号序列，随后迅速隐没。严辞抬头看了一眼便收回视线：“看来留给新人慢慢发育的窗口期，没剩几场了。”',
      relatedCast: ['yanci', 'yelin', 'litianyang'],
      impactHint: '下一场《零号回廊 · 停摆站台》的评级将直接决定你们能否摸到 B 级权限门槛。'
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
