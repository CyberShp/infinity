/* ============================================================================
 * Infinity Living Simulator — Exam 2 Scenario: 《零号回廊 · 停摆站台》
 * Original C- Rule-Labyrinth & Mimic-Broadcast Hunt (ZERO Canon Squad Presence)
 * Attaches cleanly to window.INFINITY.SCENARIOS.station_zero
 * ============================================================================ */
(function (global) {
  'use strict';
  var INFINITY = (global.INFINITY = global.INFINITY || {});
  INFINITY.SCENARIOS = INFINITY.SCENARIOS || {};

  INFINITY.SCENARIOS.station_zero = {
    id: 'station_zero',
    title: '零号回廊 · 停摆站台',
    subtitle: '第二场原创考核 · 规则迷宫与假播报猎场',
    difficulty: 'C-',
    timeLimitMin: 90,
    trainCycleMin: 15,
    startNode: 'concourse',
    squadIds: ['yanci', 'lujin', 'xutan'],
    externalAllyId: 'shenyan',

    briefing:
      '【第二场考核 · 零号回廊】\n' +
      '在零号列车第三次鸣笛前，确认合法车票并离开零号站台；未持有效凭证者禁止越过黄线。\n' +
      '—— 腕表物理倒计时：90:00 ｜ 列车进站周期：15 分钟',
    briefingTrap:
      '考题仅要求“确认合法车票并离开零号站台”，从未强制“乘坐零号列车”。未反转道岔前，零号列车只会在封闭幽灵环线内循环吞噬乘客；合法离开的真正方式是联动【信号调度室】与【旧变电间】反转主轨极性，将第三次进站列车改道出环，或借道岔解锁应急闸门脱出。',

    nodeOrder: ['concourse', 'corridor', 'dispatch', 'substation', 'tunnel', 'platform0'],

    nodes: {
      concourse: {
        id: 'concourse',
        name: 'B1 检票大厅',
        code: 'Z-01',
        x: 0.18,
        y: 0.45,
        neighbors: ['corridor', 'substation'],
        desc: '潮湿泛绿的旧式地下检票厅。六台锈蚀闸机停在“00:00”，荧光灯每隔七分钟骤暗一秒；立柱阴影后站着一名自称老生的独行者沈砚。',
        ambientTag: 'fluorescents_hum',
        initialClueIds: ['clue_ticket_stub', 'clue_broadcast_echo'],
        canOverrideTrack: false,
        isExit: false
      },
      corridor: {
        id: 'corridor',
        name: 'B2 换乘长廊',
        code: 'Z-02',
        x: 0.44,
        y: 0.45,
        neighbors: ['concourse', 'dispatch', 'tunnel', 'platform0'],
        desc: '四通八达的盲区十字长廊，墙面广告灯箱全部被黑泥涂抹。铁靴与金属检票钳碰撞的回声常在通风口里折射，极易误判来向。',
        ambientTag: 'echoing_concrete',
        initialClueIds: ['clue_inspector_sight'],
        canOverrideTrack: false,
        isExit: false
      },
      dispatch: {
        id: 'dispatch',
        name: '信号调度室',
        code: 'Z-03',
        x: 0.46,
        y: 0.18,
        neighbors: ['corridor'],
        desc: '半掩着防爆玻璃的狭小控制室。控制台上的红绿道岔灯锁死在“内环闭锁”状态，老式机械广播麦克风的指示灯却在无人操作时自行亮起。',
        ambientTag: 'relay_clicks',
        initialClueIds: ['clue_switch_protocol', 'clue_loop_timetable'],
        canOverrideTrack: true,
        isExit: false
      },
      substation: {
        id: 'substation',
        name: '旧变电间',
        code: 'Z-04',
        x: 0.24,
        y: 0.78,
        neighbors: ['concourse', 'tunnel'],
        desc: '弥漫臭氧与机油味的地下配电室。三组高压闸刀覆盖着凝霜，主母排的接地铜条被人刻意拧松了半圈，只要接通反转回路便会引发全站短时跳闸。',
        ambientTag: 'transformer_buzz',
        initialClueIds: ['clue_relay_polarity'],
        canOverrideTrack: true,
        isExit: false
      },
      tunnel: {
        id: 'tunnel',
        name: '废弃应急通道',
        code: 'Z-05',
        x: 0.64,
        y: 0.76,
        neighbors: ['corridor', 'substation', 'platform0'],
        desc: '紧贴铁轨侧壁的狭窄检修廊道，积水没过鞋底。墙角残留着上一批考生的血手印与半截断掉的机械表带，是绕开长廊正面巡逻的唯一暗线。',
        ambientTag: 'dripping_tunnel',
        initialClueIds: ['clue_shenyan_ledger'],
        canOverrideTrack: false,
        isExit: false
      },
      platform0: {
        id: 'platform0',
        name: '0号站台铁轨',
        code: 'Z-00',
        x: 0.82,
        y: 0.45,
        neighbors: ['corridor', 'tunnel'],
        desc: '漆黑无尽的地下站台，鲜黄色警戒线像刀锋一样切开月台与深渊。每逢十五分钟整点，无灯的零号列车便会带着刺骨铁锈风擦轨停靠。',
        ambientTag: 'rail_wind',
        initialClueIds: ['clue_yellow_line_clause'],
        canOverrideTrack: false,
        isExit: true
      }
    },

    clues: [
      {
        id: 'clue_ticket_stub',
        nodeId: 'concourse',
        title: '残缺钢印票根',
        summary: '检票口垃圾桶深处藏着半张浸透黑水的硬纸车票，背面用针刻着：“钢印缺角的都是死票，真正能过闸的只有盖过调度室红章的乘务通行证。”',
        unlocksTruth: 'forged_tickets'
      },
      {
        id: 'clue_broadcast_echo',
        nodeId: 'concourse',
        title: '0.3秒副载波延迟',
        summary: '检票厅广播喇叭在系统提示音结束后仍拖着0.3秒的43.2Hz电流尾音——且播报响起时，所有人腕表的物理秒针根本没有触发震动校验。',
        unlocksTruth: 'fake_broadcast_freq'
      },
      {
        id: 'clue_inspector_sight',
        nodeId: 'corridor',
        title: '血字《检票守则残页》',
        summary: '长廊消防栓内侧贴着前人撕下的记录：“它看不见静止且说真话的人。大声嘶吼、撒谎圆场、或瞬间爆发高烈度真元/魔力，都会让它的检票钳直接锁死你的喉咙。”',
        unlocksTruth: 'inspector_blindspot'
      },
      {
        id: 'clue_switch_protocol',
        nodeId: 'dispatch',
        title: '道岔反转操作单',
        summary: '调度台压板下锁着发黄的联锁规程：想把零号列车从“封闭环线”切出到“地面出站轨”，必须先在旧变电间合上B相逆极闸刀，再于调度室按下手动反转键。',
        unlocksTruth: 'track_override_step1'
      },
      {
        id: 'clue_loop_timetable',
        nodeId: 'dispatch',
        title: '停摆时刻表',
        summary: '1999年后的零号列车从未有终点站——每一班发车十五分钟后都会原封不动回到0号站台，车厢内多出的不是乘客，而是被剥离编号的空壳。',
        unlocksTruth: 'ghost_loop_truth'
      },
      {
        id: 'clue_relay_polarity',
        nodeId: 'substation',
        title: '逆极继电器铭牌',
        summary: '高压柜内侧刻着维修工的警告：拉下B相逆极闸刀会制造6秒全站断电与剧烈电弧声，足以直接引来检票员，必须有人在外围做声学诱饵或阵法隔音。',
        unlocksTruth: 'track_override_step2'
      },
      {
        id: 'clue_shenyan_ledger',
        nodeId: 'tunnel',
        title: '失窃票夹与隐蔽条款',
        summary: '应急通道暗格里塞着一枚带沈砚指纹的铁皮票夹，里面是一张刮改过日期的伪造车票，以及一张抄录纸条：“诱导至少两名陌生考生无票越过黄线，可抵消个人60分历史扣罚。”',
        unlocksTruth: 'shenyan_forged_ticket'
      },
      {
        id: 'clue_yellow_line_clause',
        nodeId: 'platform0',
        title: '黄线铜牌细则',
        summary: '站台黄线内嵌着一块被泥垢糊住的蚀刻铜牌：“凭证以轨道信号为准；未反转道岔前，任何踏入黄线内侧者均视为逃票，检票员拥有即决处决权。”',
        unlocksTruth: 'yellow_line_rule'
      }
    ],

    enemy: {
      id: 'inspector',
      name: '零号检票员',
      title: '【零号检票员】',
      hp: 160,
      maxHp: 160,
      startNode: 'platform0',
      patrolRoute: ['platform0', 'corridor', 'concourse', 'corridor', 'tunnel', 'platform0'],
      desc: '身着褪色深蓝铁路制服的高挑人形规则体，帽檐压死眼眶，右手提着一柄沾满干涸血锈的 oversized 铁质检票钳，胸口挂着一台不断漏出杂音的旧式手持对讲机。',
      rules: [
        '【静默盲区】检票员对完全静止、压低呼吸且仅陈述客观事实的目标判定权重极低，除非目标已持有伪造车票或越过黄线。',
        '【谎言与噪点锁定】任何刻意撒谎、高分贝声响、或未经收敛的原始能量爆发（真元/魔力/灵异读数骤升）都会立即触发跨区索敌。',
        '【黄线即决】未持合法凭证（或未完成道岔反转）越过0号站台黄线，将直接触发秒级必杀夹击窗口。',
        '【假播报同源】它胸口的旧式对讲机正是拟态系统播报的发射源；摧毁或以EMP/静音阵干扰该频段，可使其陷入2回合感知瘫痪。'
      ],
      buildHooks: {
        sword_array: {
          label: '剑修 / 阵法体系',
          tags: ['剑修', '阵法', '剑意', '符箓', '灵性'],
          effect: '以剑气斩断其对讲机天线或布设隔音/困灵阵封死黄线边界，可强行打断索敌并造成规则级实伤。',
          bonusDamage: 38,
          stunTurns: 2,
          tacticalHint: '切忌无遮掩爆发剑气——先以阵法敛息，再一剑截断发射源。'
        },
        tech_emp: {
          label: '科技 / EMP 体系',
          tags: ['科技', 'EMP', '电磁', '热成像', '侦察', '枪械'],
          effect: '电磁脉冲或定向频段干扰可直接烧毁43.2Hz拟态播报器，瘫痪检票员2回合并暴露其真实巡逻节点。',
          bonusDamage: 32,
          stunTurns: 2,
          tacticalHint: '配合许檀的PKE读数在长廊或变电间设伏，效果翻倍。'
        },
        spatial: {
          label: '空间 / 锚点体系',
          tags: ['空间', '锚点', '传送', '位移', '折跃'],
          effect: '空间锚点可绕过“越过黄线”的物理触发判定，在列车门闭合瞬间强行将队友拉出必杀夹角。',
          bonusDamage: 24,
          stunTurns: 1,
          tacticalHint: '提前在调度室或应急通道埋设回溯锚点，可在危急时刻无伤脱身。'
        },
        anomaly: {
          label: '灵异 / 规则体系',
          tags: ['灵异', '规则', '封印', '魂器', '抗污染', '诡异'],
          effect: '以同等规则器物反向质询“零号列车无终点站”的制度悖论，可撕裂检票员的免疫护壳并大幅削减其生命值。',
          bonusDamage: 42,
          stunTurns: 2,
          tacticalHint: '必须先掌握《停摆时刻表》或《残缺钢印票根》真相，否则反噬理智。'
        }
      }
    },

    fakeBroadcasts: [
      {
        id: 'fb_01',
        triggerTurn: 2,
        text: '【系统紧急通告】检测到零号列车提前进站，请全体考生立即前往0号站台越过黄线候车，延误者将直接扣除50点生存分。',
        truthHint: '腕表秒针未震动，且尾音残留0.3秒电流杂音——这是检票员在诱导无票者踏过黄线。'
      },
      {
        id: 'fb_02',
        triggerTurn: 5,
        text: '【系统校验提醒】检票大厅1号闸机已开放合法补票通道，请高声报出你的真实姓名与当前剩余积分以领取有效车票。',
        truthHint: '高声报出信息会立刻暴露精确坐标并触发检票员的噪点锁定。'
      },
      {
        id: 'fb_03',
        triggerTurn: 8,
        text: '【系统安全预警】信号调度室与旧变电间已被高危规则污染封锁，严禁触碰任何道岔开关；请听从资深考生沈砚引导直接登车。',
        truthHint: '拟态播报正试图阻止你们反转道岔，并配合沈砚把小队赶进幽灵环线。'
      },
      {
        id: 'fb_04',
        triggerTurn: 11,
        text: '【系统最终倒计时】第三次鸣笛已提前触发！未在10秒内冲入车厢者将被就地抹杀！',
        truthHint: '核对腕表物理计时即可识破——真正的第三次鸣笛尚未到来，切勿失控狂奔。'
      }
    ],

    crises: {
      inspector_ambush: {
        id: 'inspector_ambush',
        title: '检票钳贴喉 · 静态死线',
        countdownSec: 8,
        threatText:
          '通风口骤然传来铁锈腥风！零号检票员无声滑出阴影，冰冷的巨大铁钳已经抵在许檀颈侧半寸，对讲机嘶嘶作响：“请出示有效车票，或说明你为何在此。”',
        targetNpc: 'xutan',
        suggestedCounters: [
          '立刻示意全员静止屏息，冷静报出客观事实拖延判定',
          '抛出EMP/定向干扰器瘫痪其胸口对讲机并由陆烬拉开许檀',
          '以剑气或阵法瞬间斩断铁钳力线，掩护全员退入应急通道'
        ]
      },
      train_door_pull: {
        id: 'train_door_pull',
        title: '车门引力 · 黄线吞噬',
        countdownSec: 7,
        threatText:
          '漆黑的零号列车呼啸刹停，车门洞开涌出令人窒息的负压狂风！未反转的幽灵车厢像一张巨口将众人扯向黄线边缘，严辞脚下碎石已开始打滑。',
        targetNpc: 'yanci',
        suggestedCounters: [
          '启动空间锚点或位移强化，把严辞强行拉回黄线安全侧',
          '借陆烬的体魄固定支点，以阵法/重器钉死地面扛过负压',
          '趁车门洞开向车厢内投入爆燃/灵异封镇物强行触发车门紧急闭合'
        ]
      },
      shenyan_betrayal: {
        id: 'shenyan_betrayal',
        title: '背刺夺票 · 假老生翻牌',
        countdownSec: 6,
        threatText:
          '变电间反转闸刀即将合闸的瞬间，沈砚突然反手锁死铁门外插销，晃了晃手里刮改过的伪造车票，声音依旧温和：“别怪我，你们三个越了黄线，我的扣罚就能清零。”',
        targetNpc: 'shenyan',
        suggestedCounters: [
          '直接亮出应急通道找到的失窃票夹真相，当场拆穿其伪造车票引来检票员反锁沈砚',
          '以剑刃/爆破强拆插销并由陆烬近身夺下机械秒表',
          '用空间/灵异手段隔门反锁沈砚在长廊巡逻线上，逼其交出通行密钥'
        ]
      }
    },

    endings: {
      perfect_override: {
        id: 'perfect_override',
        title: 'S 级破局 · 逆轨出环',
        baseScore: 145,
        grade: 'S',
        epilogue:
          '旧变电间的逆极闸刀与信号调度室的手动联锁在第三次鸣笛前十秒精准咬合。刺耳的铁轨摩擦声撕裂了停摆二十余年的幽灵环线，零号列车被迫切入地面出站轨。车门开启时，腕表首次发出清脆真实的系统结算提示——你们带着全员完整的编制与一手规则样本，踏出了零号回廊。',
        worldImpact:
          '东亚战区匿名榜首次记录到“无名控防队”以零减员硬拆拟态系统播报考场；严辞正式获得 B- 级权限试算资格，公共长廊对“假播报反制方案”的求购价瞬间翻倍。'
      },
      kill_inspector: {
        id: 'kill_inspector',
        title: 'A+ 级破局 · 斩断检票钳',
        baseScore: 120,
        grade: 'A+',
        epilogue:
          '在多重体系的精密围猎下，零号检票员胸口的43.2Hz拟态播报器被彻底击碎，失去了规则庇护的检票钳断成两截。随着猎杀者崩解成漫天褪色票屑，0号站台的黄线法则随之失效，应急出站闸门缓缓升起。虽然小队付出了一定的消耗，但你们证明了规则体并非不可击杀。',
        worldImpact:
          '高阶规则体击杀记录在血色漩涡短暂公示，引起灵安小队与多名资深老生的暗中关注；你的战斗风格被空间标记为“高破局威胁”。'
      },
      forced_board_survive: {
        id: 'forced_board_survive',
        title: 'B 级生还 · 擦线登车',
        baseScore: 75,
        grade: 'B',
        epilogue:
          '未能彻底反转主轨，但在第三次鸣笛响彻站台前的最后一秒，你们凭借抢到的有效通行凭证硬扛过车门负压，在幽灵环线重启的夹缝中被系统判定满足最低“离开站台”条件强行抽离。回到血色漩涡时，每个人耳边仍回荡着挥之不去的铁轨冷风。',
        worldImpact:
          '小队惊险保住全员性命但错失隐藏高额加分；沈砚在混乱中下落不明，公共频道开始流传关于零号站台仍未彻底收容的警告。'
      },
      wipeout: {
        id: 'wipeout',
        title: 'D 级折戟 · 停摆车厢',
        baseScore: 20,
        grade: 'D',
        epilogue:
          '第三次鸣笛落下，黄线内侧的检票钳合拢在最后一丝呼吸之前。你的意识在剧烈的耳鸣与失重中被空间紧急回溯至血色漩涡边缘，腕表冰冷地扣除惨重生存分——下一次再踏进规则考场前，你必须重新审视每一句看似善意的系统播报。',
        worldImpact:
          '小队元气大伤，原有信任与战术默契跌入低谷；空间大厅的残酷淘汰率再次提醒你，任何一次轻信都将用命买单。'
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
