/* ============================================================================
 * Infinity Living Simulator — Shop Catalog (500 Items) & Fusion Recipes (10)
 * Auto-generated from /design/shop/01..06 + README.md
 * Attaches cleanly to window.INFINITY (no ES modules, zero hardcoded secrets)
 * ============================================================================ */
(function (global) {
  'use strict';
  var INFINITY = (global.INFINITY = global.INFINITY || {});

  INFINITY.SHOP_CATALOG = [
  {
    "id": "B001",
    "name": "下忍天赋",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "全球死考／火影",
    "price": 15,
    "discountable": true,
    "desc": "提炼基础查克拉、提升基础敏捷与体术，不含高阶忍术",
    "tags": [
      "血统",
      "火焰雷法",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B002",
    "name": "伪灵根",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "全球死考／修真",
    "price": 15,
    "discountable": true,
    "desc": "修真最低入场资质，修炼缓慢，可驱动基础法器",
    "tags": [
      "血统",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B003",
    "name": "古武练气胚子",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "东方武侠",
    "price": 15,
    "discountable": true,
    "desc": "气血充沛、经脉通畅，习练内家拳剑速度加快",
    "tags": [
      "血统",
      "剑修"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B004",
    "name": "阴阳眼（微弱）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "东方民俗",
    "price": 15,
    "discountable": true,
    "desc": "可模糊察觉低阶灵异与阴气残留，无法主动关闭，易受惊吓",
    "tags": [
      "血统",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B005",
    "name": "药人底子",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "东方医毒",
    "price": 15,
    "discountable": true,
    "desc": "对常规生物毒素与麻药具基础抗性，嗅觉偏敏",
    "tags": [
      "血统",
      "医疗",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B006",
    "name": "初级狼人血脉",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "西方奇幻",
    "price": 15,
    "discountable": true,
    "desc": "力量与嗅觉小幅强化，满月或剧痛时易暴躁",
    "tags": [
      "血统",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B007",
    "name": "低阶血奴体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "西方奇幻",
    "price": 15,
    "discountable": true,
    "desc": "夜间视力与轻伤自愈提升，惧强紫外线与银器",
    "tags": [
      "血统",
      "医疗"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B008",
    "name": "学徒魔力回路",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "西方奇幻",
    "price": 15,
    "discountable": true,
    "desc": "具备微量魔力感知与基础施法资格，魔力池极小",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B009",
    "name": "猎魔人青草试炼残效",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "猎魔人",
    "price": 15,
    "discountable": true,
    "desc": "感官敏锐、心率可控、抗低阶毒素，情绪趋于冷淡",
    "tags": [
      "血统",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B010",
    "name": "基因优化凡人",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "科幻",
    "price": 15,
    "discountable": true,
    "desc": "全面消除遗传病，耐力、反应与记忆力达人类精英上限",
    "tags": [
      "血统",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 0
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B011",
    "name": "基础义体兼容体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "赛博朋克",
    "price": 15,
    "discountable": true,
    "desc": "神经排异率大幅降低，可安全加装 1–2 件低阶义体",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B012",
    "name": "微弱灵能敏感者",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "科幻灵能",
    "price": 15,
    "discountable": true,
    "desc": "对精神波动与隐藏敌意具直觉预警，无主动攻击力",
    "tags": [
      "血统",
      "隐蔽",
      "侦察",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "B013",
    "name": "深潜抗压体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "科幻生存",
    "price": 15,
    "discountable": true,
    "desc": "憋气时长翻倍，适应高压、低温与稀薄空气环境",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B014",
    "name": "僵尸抗尸毒体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "港式灵异",
    "price": 15,
    "discountable": true,
    "desc": "对常规尸毒与阴寒入体具缓冲，体温偏低",
    "tags": [
      "血统",
      "灵异",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B015",
    "name": "通灵媒介体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "现代灵异",
    "price": 15,
    "discountable": true,
    "desc": "易与灵体建立沟通或请神，同时极易招惹游魂附身",
    "tags": [
      "血统",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B016",
    "name": "咒力微觉醒",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "日漫灵异",
    "price": 15,
    "discountable": true,
    "desc": "察觉咒灵残秽并凝聚微弱咒力护手，输出极低",
    "tags": [
      "血统",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B017",
    "name": "百兽亲和体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "上古神话",
    "price": 15,
    "discountable": true,
    "desc": "普通野兽不易主动攻击，便于驯养侦察动物或低阶妖宠",
    "tags": [
      "血统",
      "侦察"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 2,
      "wil": 1,
      "energy": 0
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "B018",
    "name": "夜行者视觉",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "科幻／奇幻",
    "price": 15,
    "discountable": true,
    "desc": "暗光与红外边缘视觉，强闪光弹下更易致盲",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "B019",
    "name": "痛觉钝化体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "现代改造",
    "price": 15,
    "discountable": true,
    "desc": "重伤下仍能维持精细操作，但易忽略致命内伤出血",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B020",
    "name": "模因钝感者（微弱）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "D",
    "source": "异常模因",
    "price": 15,
    "discountable": true,
    "desc": "对低阶认知污染具轻微延迟发作效果，思维反应略慢",
    "tags": [
      "血统",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B021",
    "name": "强化体魄·兵王模板",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "全球死考",
    "price": 45,
    "discountable": true,
    "desc": "综合体能、格斗与枪械直觉大幅跃升，无超凡能量",
    "tags": [
      "血统",
      "原著"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "B022",
    "name": "暴君实验体",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "全球死考／生化",
    "price": 45,
    "discountable": true,
    "desc": "极强肉体力量、抗击打与再生，存在严重精神失控风险",
    "tags": [
      "血统",
      "医疗",
      "抗模因",
      "毒素生化",
      "赌命"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 20
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B023",
    "name": "观察者",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "全球死考",
    "price": 45,
    "discountable": true,
    "desc": "极度冷静、超强动态视觉与细节推理，极佳的融合稳定器",
    "tags": [
      "血统",
      "侦察",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 4,
      "wil": 2,
      "energy": 20
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "B024",
    "name": "中忍查克拉体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "火影",
    "price": 45,
    "discountable": true,
    "desc": "查克拉量与经络控制成形，可修习常规忍术与基础封印",
    "tags": [
      "血统",
      "收容",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "B025",
    "name": "单系真灵根",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "东方修真",
    "price": 45,
    "discountable": true,
    "desc": "炼气速度显著提升，契合单一五行功法与法器",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B026",
    "name": "先天剑骨雏形",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "古典剑修",
    "price": 45,
    "discountable": true,
    "desc": "御剑灵性极高、剑意悟性倍增，兼修非剑类武学偏慢",
    "tags": [
      "血统",
      "剑修"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B027",
    "name": "道门守心体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "道教传统",
    "price": 45,
    "discountable": true,
    "desc": "意志稳固、抗魅惑与低阶夺舍，极适合与失控血统融合",
    "tags": [
      "血统",
      "抗模因",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B028",
    "name": "将臣残血（初阶）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "港式神话",
    "price": 45,
    "discountable": true,
    "desc": "极强物理抗性与断肢接续，需压制嗜血冲动，惧强阳雷火",
    "tags": [
      "血统",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "B029",
    "name": "南疆百蛊之躯",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "东方民俗",
    "price": 45,
    "discountable": true,
    "desc": "体内可豢养 2–3 种实用蛊虫，抗常规剧毒，需定期喂养",
    "tags": [
      "血统",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B030",
    "name": "傩神请神体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "上古巫傩",
    "price": 45,
    "discountable": true,
    "desc": "戴傩面可短时借请地方神将护体驱邪，退神后虚弱",
    "tags": [
      "血统",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "B031",
    "name": "青丘狐裔（薄血）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "山海经",
    "price": 45,
    "discountable": true,
    "desc": "擅长微弱幻术遮蔽气息与高敏身法，防御脆弱",
    "tags": [
      "血统",
      "结界",
      "隐蔽",
      "位移"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B032",
    "name": "山魈巨力血脉",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "东方志怪",
    "price": 45,
    "discountable": true,
    "desc": "极强负重与近身爆发，惧爆竹与烈火惊扰",
    "tags": [
      "血统",
      "火焰雷法",
      "爆发"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B033",
    "name": "墨家机关手改造",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "先秦诸子",
    "price": 45,
    "discountable": true,
    "desc": "双手精密微操与机关拆解极强，便于高速布阵与修器",
    "tags": [
      "血统",
      "阵法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "B034",
    "name": "游魂灵体（半虚）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "东方灵异",
    "price": 45,
    "discountable": true,
    "desc": "可短时半虚化穿墙或规避实体打击，惧阳刚气血与雷法",
    "tags": [
      "血统",
      "隐蔽",
      "电磁",
      "灵异",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "mobility"
    }
  },
  {
    "id": "B035",
    "name": "高阶吸血鬼子爵",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "西方奇幻",
    "price": 45,
    "discountable": true,
    "desc": "血雾短距闪避、强自愈与夜战压制，惧阳光、圣水与木桩",
    "tags": [
      "血统",
      "医疗",
      "灵异",
      "毒素生化",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "B036",
    "name": "银月狼人",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "西方奇幻",
    "price": 45,
    "discountable": true,
    "desc": "可控半兽化、极速扑杀与惊人嗅觉，惧银质武器",
    "tags": [
      "血统",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 1,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "B037",
    "name": "变异猎魔人（完整）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "猎魔人",
    "price": 45,
    "discountable": true,
    "desc": "完整魔药耐受、剑术反射与基础法印承载",
    "tags": [
      "血统",
      "剑修",
      "医疗"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B038",
    "name": "死灵学徒体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "西方奇幻",
    "price": 45,
    "discountable": true,
    "desc": "亲和死气、可操控低阶骸骨与亡灵，受圣光与净化克制",
    "tags": [
      "血统",
      "灵异",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B039",
    "name": "森林精灵血脉",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "西方奇幻",
    "price": 45,
    "discountable": true,
    "desc": "极致动态视力、自然亲和与轻身步法，近身承伤差",
    "tags": [
      "血统",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 2,
      "wil": 1,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "mobility"
    }
  },
  {
    "id": "B040",
    "name": "超级士兵血清",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "科幻漫威风",
    "price": 45,
    "discountable": true,
    "desc": "全面强化体能、恢复与代谢，稳定无失控副作用",
    "tags": [
      "血统",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B041",
    "name": "军用赛博神经底盘",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "赛博朋克",
    "price": 45,
    "discountable": true,
    "desc": "支持中阶义体与外接战术算力，惧强电磁脉冲",
    "tags": [
      "血统",
      "破甲",
      "电磁",
      "黑客"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B042",
    "name": "初级灵能者",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "科幻灵能",
    "price": 45,
    "discountable": true,
    "desc": "具备念力微操与短距心灵传讯，过载会引发剧烈偏头痛",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B043",
    "name": "辐射变异适应体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "废土科幻",
    "price": 45,
    "discountable": true,
    "desc": "免疫常规核辐射与化学毒雾，外貌略显异化",
    "tags": [
      "血统",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B044",
    "name": "深潜者混血（初阶）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "克苏鲁",
    "price": 45,
    "discountable": true,
    "desc": "水下极速与厚韧鳞皮，长期接触深海低语有理智滑坡风险",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B045",
    "name": "低阶契约驭鬼者（平衡态）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "C",
    "source": "现代灵异",
    "price": 45,
    "discountable": true,
    "desc": "体内寄宿一只低阶拼图，具备规则级小能力，过度使用会复苏",
    "tags": [
      "血统",
      "医疗",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B046",
    "name": "修仙者（筑基模板）",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "全球死考／修真",
    "price": 135,
    "discountable": true,
    "desc": "一步筑基，具真元护体、御剑与驱动中阶阵器法宝的完整承载",
    "tags": [
      "血统",
      "剑修",
      "阵法",
      "护盾",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 4,
      "obs": 3,
      "wil": 4,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "B047",
    "name": "奥能术士",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "全球死考／奇幻",
    "price": 135,
    "discountable": true,
    "desc": "高效奥术回路，擅长护盾、力场、解析与远程控场",
    "tags": [
      "血统",
      "结界",
      "护盾",
      "原著"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 5,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "B048",
    "name": "高等吸血鬼",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "全球死考／奇幻",
    "price": 135,
    "discountable": true,
    "desc": "极强血能再生、化蝠与控血，仍惧烈日与高阶圣光",
    "tags": [
      "血统",
      "医疗",
      "灵异",
      "火焰雷法",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B049",
    "name": "假面武装（基础驱动）",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "全球死考／特摄",
    "price": 135,
    "discountable": true,
    "desc": "变身装甲攻防兼备、招式直观，核心驱动器被毁则解甲",
    "tags": [
      "血统",
      "护盾",
      "原著"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 5,
      "energy": 40
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "B050",
    "name": "干涉者（观察者升阶）",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "全球死考",
    "price": 135,
    "discountable": true,
    "desc": "在极度冷静洞察之上，可微幅干涉环境与敌方发力节点",
    "tags": [
      "血统",
      "侦察",
      "规则",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 7,
      "wil": 3,
      "energy": 40
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "B051",
    "name": "上清存思道体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "道藏《云笈七签》",
    "price": 135,
    "discountable": true,
    "desc": "存思身神护脏腑、稳元神，对夺舍、幻境与精神污染抗性极佳",
    "tags": [
      "血统",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 3,
      "wil": 5,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B052",
    "name": "白泽残裔",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "山海经",
    "price": 135,
    "discountable": true,
    "desc": "天生亲和辨识天下鬼神精怪之情状，调查与破局效率倍增",
    "tags": [
      "血统",
      "侦察",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 7,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "B053",
    "name": "玄武灵血（初阶）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "中国四象神话",
    "price": 135,
    "discountable": true,
    "desc": "极高物理与水寒抗性，稳固下盘与阵基，机动速度偏慢",
    "tags": [
      "血统",
      "阵法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 4,
      "obs": 3,
      "wil": 4,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "B054",
    "name": "应龙薄血",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "山海经",
    "price": 135,
    "discountable": true,
    "desc": "亲和云雨雷电与强韧龙鳞，施展水雷术法威力大增",
    "tags": [
      "血统",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B055",
    "name": "太阴剑体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "古典剑修",
    "price": 135,
    "discountable": true,
    "desc": "剑气清冷内敛、极易隐蔽与控场，契合承影／含光剑意",
    "tags": [
      "血统",
      "剑修",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 7,
      "obs": 3,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "mobility"
    }
  },
  {
    "id": "B056",
    "name": "血族亲王血裔",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "西方奇幻",
    "price": 135,
    "discountable": true,
    "desc": "鲜血护盾、高速再生与血契救援，需定期补充高能血液",
    "tags": [
      "血统",
      "结界",
      "医疗",
      "毒素生化",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 4,
      "obs": 3,
      "wil": 4,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "B057",
    "name": "日向血统／白眼（无笼中鸟）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "火影",
    "price": 135,
    "discountable": true,
    "desc": "近 360 度警戒与查克拉透视，留盲区与过度使用力竭代价",
    "tags": [
      "血统",
      "侦察",
      "火焰雷法",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 7,
      "wil": 3,
      "energy": 40
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "B058",
    "name": "阿斯莫 Aasimar（2024 版）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "D&D",
    "price": 135,
    "discountable": true,
    "desc": "天界抗性、黑暗视觉、治疗之手与天界启示，顶尖救援底座",
    "tags": [
      "血统",
      "医疗"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 5,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "B059",
    "name": "布莱顿 Breton（ESO U21）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "上古卷轴",
    "price": 120,
    "discountable": true,
    "desc": "高魔力池、法术抗性与 Magicka 减耗，适合长时防护施法",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B060",
    "name": "死神灵魂适配体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "BLEACH",
    "price": 135,
    "discountable": true,
    "desc": "开启灵压修炼、鬼道与浅打磨合资格，不含现成名刀",
    "tags": [
      "血统",
      "灵异"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 4,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "B061",
    "name": "间流结界师灵体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "结界师",
    "price": 135,
    "discountable": true,
    "desc": "独立结界灵力池与空间感，大幅提升间流结界成形速度",
    "tags": [
      "血统",
      "阵法",
      "结界",
      "空间"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 4,
      "obs": 2,
      "wil": 4,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "B062",
    "name": "北欧卢恩铭刻之躯",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "北欧神话",
    "price": 130,
    "discountable": true,
    "desc": "肉身与兵器天然承载卢恩符文，降低多符并发的反噬",
    "tags": [
      "血统",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B063",
    "name": "凯尔特德鲁伊自然体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "凯尔特神话",
    "price": 135,
    "discountable": true,
    "desc": "感应地脉、催生植物掩体与基础自然治愈，在纯金属空间受限",
    "tags": [
      "血统",
      "空间"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 5,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "B064",
    "name": "原力敏感者（成熟）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "星球大战",
    "price": 140,
    "discountable": true,
    "desc": "敏锐危险预知、念力推拉与光剑偏转基础，需长期心境训练",
    "tags": [
      "血统",
      "剑修"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 5,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B065",
    "name": "星际灵能特工",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "星际科幻",
    "price": 135,
    "discountable": true,
    "desc": "灵能护盾、心灵侦察与短距幽能折跃，过载伤脑",
    "tags": [
      "血统",
      "结界",
      "侦察",
      "空间",
      "护盾"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 7,
      "wil": 3,
      "energy": 40
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "B066",
    "name": "机械义脑超频者",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "赛博朋克",
    "price": 135,
    "discountable": true,
    "desc": "极强多线并行计算、弹道解算与黑客入侵，惧 EMP 瘫痪",
    "tags": [
      "血统",
      "电磁",
      "黑客",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 6,
      "wil": 2,
      "energy": 40
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "B067",
    "name": "纳米共生体（可控）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "科幻",
    "price": 135,
    "discountable": true,
    "desc": "体内纳米虫自动止血、修补外甲与临时塑形，高耗热量",
    "tags": [
      "血统",
      "医疗",
      "毒素生化",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 5,
      "energy": 40
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "B068",
    "name": "克里／斯库鲁拟态基因",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "科幻",
    "price": 135,
    "discountable": true,
    "desc": "拟态外貌与声纹、强化体格，极适合潜入与反侦察",
    "tags": [
      "血统",
      "隐蔽",
      "侦察"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 7,
      "wil": 3,
      "energy": 40
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "B069",
    "name": "石像鬼石化之躯",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "西方奇幻",
    "price": 135,
    "discountable": true,
    "desc": "主动进入高防石肤硬抗重击，石肤期间大幅降低移速",
    "tags": [
      "血统",
      "破甲",
      "灵异",
      "护盾"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 3,
      "obs": 2,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "B070",
    "name": "古埃及祭司真名体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "埃及神话",
    "price": 135,
    "discountable": true,
    "desc": "灵魂锚定稳固，抵抗改名、夺舍与身份篡改类规则攻击",
    "tags": [
      "血统",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 6,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "B071",
    "name": "茅山正统法脉体质",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "东方民俗",
    "price": 130,
    "discountable": true,
    "desc": "符箓画制与法坛请神效率倍增，对尸鬼阴煞具天然压制",
    "tags": [
      "血统",
      "阵法",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 4,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "B072",
    "name": "阴阳师灵脉体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "日本阴阳道",
    "price": 135,
    "discountable": true,
    "desc": "式神契约上限提升、方位感知敏锐，近身搏杀偏弱",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 5,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "B073",
    "name": "泰坦半神血脉（薄血）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "希腊神话",
    "price": 140,
    "discountable": true,
    "desc": "极强巨力、抗压与高韧性躯体，适合前排主 C 或重坦",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 3,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B074",
    "name": "时间感知异能体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "科幻／奇幻",
    "price": 145,
    "discountable": true,
    "desc": "危机瞬间触发主观时间放缓（子弹时间），高耗神经耐力",
    "tags": [
      "血统",
      "规则",
      "位移"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 3,
      "wil": 2,
      "energy": 40
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "mobility"
    }
  },
  {
    "id": "B075",
    "name": "稳定现实锚定体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "B",
    "source": "异常模因",
    "price": 140,
    "discountable": true,
    "desc": "自身休谟指数偏高，对现实扭曲与低阶模因具天然抵抗",
    "tags": [
      "血统",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 6,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "B076",
    "name": "结丹剑修模板",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "东方修真",
    "price": 320,
    "discountable": true,
    "desc": "丹成真元浑厚，可同时御使成套本命剑与驱动高阶阵法",
    "tags": [
      "血统",
      "剑修",
      "阵法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 7,
      "obs": 5,
      "wil": 6,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "B077",
    "name": "莲花化身（哪吒版重构）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "封神演义",
    "price": 340,
    "discountable": true,
    "desc": "化身法非血肉重构躯体，免除常规生理毒素与血肉寄生，需重新迁移经脉",
    "tags": [
      "血统",
      "毒素生化",
      "位移"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B078",
    "name": "大禹后裔·定水灵体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "上古神话",
    "price": 300,
    "discountable": true,
    "desc": "天然擅长卸力疏导、抗洪流与空间重压，对水系与镇压法门加成极高",
    "tags": [
      "血统",
      "收容",
      "空间"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B079",
    "name": "重明鸟残血",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "拾遗记／上古",
    "price": 310,
    "discountable": true,
    "desc": "双瞳破妄，看穿高阶幻境、拟态与隐形异常，过载灼伤双目",
    "tags": [
      "血统",
      "隐蔽",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 6,
      "obs": 6,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B080",
    "name": "金乌薄血",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "山海经",
    "price": 340,
    "discountable": true,
    "desc": "炽烈纯阳之躯，极度克制阴邪鬼物与寒毒，难隐蔽气息",
    "tags": [
      "血统",
      "隐蔽",
      "灵异",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 10,
      "obs": 4,
      "wil": 3,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "mobility"
    }
  },
  {
    "id": "B081",
    "name": "高阶龙裔（东方青龙）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "中国四象",
    "price": 350,
    "discountable": true,
    "desc": "极强生机、呼风唤雨与龙威压制，进阶与维持消耗大",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 7,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "B082",
    "name": "炽天使微光圣裔",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "西方神话衍生",
    "price": 340,
    "discountable": true,
    "desc": "强力净化光翼、群体庇护与圣疗，受深渊暗影法则敌视",
    "tags": [
      "血统",
      "位移"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B083",
    "name": "瓦尔基里英灵体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "北欧神话",
    "price": 320,
    "discountable": true,
    "desc": "极强战场护持与濒死牵引，可短时稳住队友不死状态",
    "tags": [
      "血统",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B084",
    "name": "大魔导师奥术之躯",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "西方奇幻",
    "price": 330,
    "discountable": true,
    "desc": "元素化瞬避、高阶反制法术与广域护盾，纯物理肉身偏脆",
    "tags": [
      "血统",
      "结界",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 7,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "B085",
    "name": "十刃级破面／假面灵体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "BLEACH",
    "price": 330,
    "discountable": true,
    "desc": "钢皮硬防、响转高速机动与高额灵压爆发",
    "tags": [
      "血统",
      "爆发"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 7,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B086",
    "name": "学园都市 Level 4.5 演算脑",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "魔禁衍生",
    "price": 350,
    "discountable": true,
    "desc": "超高速矢量／力场解算底座，极度依赖大脑供氧与防精神冲击",
    "tags": [
      "血统",
      "结界",
      "黑客",
      "抗模因",
      "爆发"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 5,
      "obs": 8,
      "wil": 6,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "recon"
    }
  },
  {
    "id": "B087",
    "name": "星际高阶圣堂武士",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "星际争霸",
    "price": 330,
    "discountable": true,
    "desc": "高强度灵能护盾、心灵风暴与相位折跃协调",
    "tags": [
      "血统",
      "结界",
      "空间",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 8,
      "obs": 5,
      "wil": 3,
      "energy": 60
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "mobility"
    }
  },
  {
    "id": "B088",
    "name": "战锤灵能导航者（受控）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "科幻战锤风",
    "price": 340,
    "discountable": true,
    "desc": "第三只眼看穿亚空间与空间裂隙，慎用直视以防腐化",
    "tags": [
      "血统",
      "空间"
    ],
    "powerDelta": {
      "phy": 8,
      "agi": 6,
      "obs": 3,
      "wil": 3,
      "energy": 60
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "B089",
    "name": "机械飞升·全碳纳米躯",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "科幻",
    "price": 320,
    "discountable": true,
    "desc": "免疫常规生物瘟疫与缺氧，极高物理防御与模块化武器接口",
    "tags": [
      "血统",
      "结界",
      "毒素生化",
      "位移"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B090",
    "name": "不死鸟重生血脉（限次）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "东西方神话",
    "price": 380,
    "discountable": true,
    "desc": "每季触发 1 次濒死浴火重塑肉身，不免疫灵魂抹杀与规则抹除",
    "tags": [
      "血统",
      "规则",
      "灵异",
      "火焰雷法",
      "护盾"
    ],
    "powerDelta": {
      "phy": 6,
      "agi": 5,
      "obs": 2,
      "wil": 6,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "B091",
    "name": "时空行者雏形",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "科幻／奇幻",
    "price": 360,
    "discountable": true,
    "desc": "天然免疫低阶时间停滞与空间错位，便于配合空间阵法",
    "tags": [
      "血统",
      "阵法",
      "规则",
      "空间"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 7,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "B092",
    "name": "高阶平衡驭鬼体（双拼图）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "现代灵异",
    "price": 340,
    "discountable": true,
    "desc": "体内两只灵异互相死机平衡，具备规则级对抗力，失衡即厉鬼复苏",
    "tags": [
      "血统",
      "医疗",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B093",
    "name": "旧日低语抗性体（清醒者）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "A",
    "source": "克苏鲁",
    "price": 310,
    "discountable": true,
    "desc": "直视不可名状存在时大幅减免理智崩解，代价是常伴幻听",
    "tags": [
      "血统",
      "赌命"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 5,
      "obs": 5,
      "wil": 5,
      "energy": 60
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B094",
    "name": "星神恶魔融合体（标杆）",
    "canon": true,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "全球死考",
    "price": 580,
    "discountable": true,
    "desc": "越阶三阶战力、可赋四名队友“星辰”半额强化、星能未尽则不死；激战数秒耗尽",
    "tags": [
      "血统",
      "护盾",
      "团队",
      "原著"
    ],
    "powerDelta": {
      "phy": 8,
      "agi": 7,
      "obs": 7,
      "wil": 8,
      "energy": 95
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B095",
    "name": "元婴剑尊残躯模板",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "东方修真",
    "price": 560,
    "discountable": true,
    "desc": "一步元婴承载、元婴出窍保命与百剑并发；与凡俗躯体磨合期易灵力反噬",
    "tags": [
      "血统",
      "剑修",
      "赌命"
    ],
    "powerDelta": {
      "phy": 7,
      "agi": 11,
      "obs": 6,
      "wil": 7,
      "energy": 95
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B096",
    "name": "后土厚德残血",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "中国上古神话",
    "price": 550,
    "discountable": true,
    "desc": "脚踏大地即获恐怖承伤与地脉恢复，可分摊全队致命重击；离地则威能锐减",
    "tags": [
      "血统",
      "破甲",
      "团队"
    ],
    "powerDelta": {
      "phy": 12,
      "agi": 6,
      "obs": 6,
      "wil": 6,
      "energy": 95
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B097",
    "name": "烛阴昼夜瞳（残）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "山海经",
    "price": 580,
    "discountable": true,
    "desc": "睁眼为昼驱散绝大部分灵异迷雾、闭眼为夜隐匿全队行迹；每次动用剧烈灼伤寿命与双眼",
    "tags": [
      "血统",
      "隐蔽",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 6,
      "agi": 9,
      "obs": 10,
      "wil": 6,
      "energy": 95
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B098",
    "name": "泰坦神王雷霆真血",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "希腊神话",
    "price": 550,
    "discountable": true,
    "desc": "极端雷霆威压与不朽神体雏形，极易吸引异族高阶存在仇恨",
    "tags": [
      "血统",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 12,
      "agi": 6,
      "obs": 6,
      "wil": 6,
      "energy": 95
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B099",
    "name": "绝对零度量子体",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "硬科幻",
    "price": 560,
    "discountable": true,
    "desc": "短时将自身与周边物理熵降至冰点、冻结能量攻击；超时将导致自身意识冻结",
    "tags": [
      "血统"
    ],
    "powerDelta": {
      "phy": 8,
      "agi": 7,
      "obs": 7,
      "wil": 8,
      "energy": 95
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "B100",
    "name": "逆模因存在体（残缺）",
    "canon": false,
    "category": "bloodline",
    "categoryLabel": "血统与体质",
    "tier": "S",
    "source": "SCP 异常",
    "price": 540,
    "discountable": true,
    "desc": "主动开启时令敌方无法记忆与锁定你的存在；副作用是队友同样可能遗忘你的位置",
    "tags": [
      "血统",
      "收容",
      "抗模因",
      "团队"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 5,
      "obs": 8,
      "wil": 13,
      "energy": 95
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "C001",
    "name": "宵练剑意·入门残篇",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《列子·汤问》｜技法",
    "price": 35,
    "discountable": true,
    "desc": "非杀伐剑意起步：剑过不血刃，截断低阶术法前摇、实体线路与冷兵器势能",
    "tags": [
      "东方修真",
      "剑修",
      "爆发"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C002",
    "name": "青铜古法剑",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "古代礼器｜器物",
    "price": 20,
    "discountable": true,
    "desc": "稳固导引真元与符箓，允许损耗或遗弃的可靠起手剑",
    "tags": [
      "东方修真",
      "剑修",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C003",
    "name": "雷击枣木剑",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "道教传统｜器物",
    "price": 30,
    "discountable": true,
    "desc": "对低阶阴煞与游魂具破邪效果，物理硬度弱于精钢",
    "tags": [
      "东方修真",
      "剑修",
      "电磁",
      "灵异",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C004",
    "name": "黄神越章泥封（三枚）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《抱朴子·登涉》｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "掷于通道断低阶精怪、恶神与野兽去路，一次性消耗",
    "tags": [
      "东方修真",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C005",
    "name": "闭以金关·画地界（初级）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《抱朴子·登涉》｜技法",
    "price": 25,
    "discountable": true,
    "desc": "持剑闭炁画地作方，立下固定边界阻隔常规实体与低阶灵异；移动则界散",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "defense"
    }
  },
  {
    "id": "C006",
    "name": "六甲秘祝·护心篇",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《抱朴子·登涉》｜技法",
    "price": 20,
    "discountable": true,
    "desc": "临场稳心抗恐惧与低阶幻觉，不免疫高阶模因",
    "tags": [
      "东方修真",
      "抗模因",
      "护盾"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "defense"
    }
  },
  {
    "id": "C007",
    "name": "低阶定身咒",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《西游记》衍化｜技法",
    "price": 30,
    "discountable": true,
    "desc": "定住普通人或低阶目标 2–3 秒，对强敌仅顿半息，需目视指诀",
    "tags": [
      "东方修真",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 0
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C008",
    "name": "画壁残纸（一张）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《聊斋志异》｜耗材",
    "price": 35,
    "discountable": true,
    "desc": "贴墙令 1 人短时藏入画境避祸（30 秒），画纸被毁即强行弹出",
    "tags": [
      "东方修真",
      "隐蔽",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "mobility"
    }
  },
  {
    "id": "C009",
    "name": "崂山穿墙术（残）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《聊斋志异》｜技法",
    "price": 35,
    "discountable": true,
    "desc": "短距穿透普通砖石门墙，心念动摇或遇特制阵壁会卡阻受伤",
    "tags": [
      "东方修真",
      "阵法",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 0
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C010",
    "name": "青元剑诀·前三层",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《凡人修仙传》｜功法",
    "price": 35,
    "discountable": true,
    "desc": "炼气期真元运行与青元剑芒，用于断索、拆门与逼退近敌",
    "tags": [
      "东方修真",
      "剑修"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 0
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "C011",
    "name": "基础御剑术（单剑）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "修真通用｜技法",
    "price": 30,
    "discountable": true,
    "desc": "十米内隔空御使 1 柄常规飞剑拦截或探路",
    "tags": [
      "东方修真",
      "剑修",
      "位移"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C012",
    "name": "基础机关木傀儡",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "《凡人》／墨家｜器物",
    "price": 30,
    "discountable": true,
    "desc": "远程探路、触发机关、搬运轻型物证，无战斗力",
    "tags": [
      "东方修真"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 0
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C013",
    "name": "朱砂镇煞符（五张）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "道教民俗｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "贴门窗封阴气、短时震慑低阶鬼物",
    "tags": [
      "东方修真",
      "收容",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C014",
    "name": "辟谷丹（一瓶）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "修真通用｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "长期潜伏或困守阵地时维系体能，不疗伤",
    "tags": [
      "东方修真",
      "阵法",
      "医疗",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "C015",
    "name": "回气散（三包）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "修真通用｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "战间快速缓和真元承压状态，连续服用药效递减",
    "tags": [
      "东方修真",
      "医疗",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "C016",
    "name": "七星铜钱绳",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "民俗道教｜器物",
    "price": 25,
    "discountable": true,
    "desc": "缠缚低阶阴邪或警示暗处异动",
    "tags": [
      "东方修真",
      "收容"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C017",
    "name": "传音纸鹤（五只）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "仙侠通用｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "绕过常规电子屏蔽向队友传递短讯，速度较慢",
    "tags": [
      "东方修真",
      "电磁",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "defense"
    }
  },
  {
    "id": "C018",
    "name": "替身草人（粗制）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "D",
    "source": "民俗巫术｜耗材",
    "price": 35,
    "discountable": true,
    "desc": "代承一次低阶诅咒或锁定追踪，触发即焚毁",
    "tags": [
      "东方修真",
      "侦察",
      "收容",
      "灵异",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 0,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "C019",
    "name": "炼气守御心法",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "道门修真｜功法",
    "price": 55,
    "discountable": true,
    "desc": "偏重防御续航与稳固气机的筑基前主修心法",
    "tags": [
      "东方修真",
      "结界"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "C020",
    "name": "大衍诀·第一层（残本）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《凡人修仙传》｜技法",
    "price": 50,
    "discountable": true,
    "desc": "扩张神识并初步分神，支持 1 剑＋1 傀儡并发；直扫模因有暴露风险",
    "tags": [
      "东方修真",
      "剑修",
      "侦察",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C021",
    "name": "颠倒五行阵·试制阵盘",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《凡人修仙传》｜器物",
    "price": 65,
    "discountable": true,
    "desc": "便携遮蔽与迷困阵具，无主动杀敌功能，启动后固定于布阵点",
    "tags": [
      "东方修真",
      "阵法",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C022",
    "name": "桃木七星镇坛剑",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "道教法器｜器物",
    "price": 50,
    "discountable": true,
    "desc": "兼作法印媒介与阵眼，立阵时阵法稳固度显著提升",
    "tags": [
      "东方修真",
      "剑修",
      "阵法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C023",
    "name": "七星禹步·初阶",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《抱朴子》｜身法",
    "price": 55,
    "discountable": true,
    "desc": "踏步借微弱地势稳身避险，降低地形陷阱与重力干扰",
    "tags": [
      "东方修真",
      "电磁",
      "空间",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C024",
    "name": "燕赤霞镇邪符剑术",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《倩女幽魂》｜技法",
    "price": 65,
    "discountable": true,
    "desc": "法剑配刚猛驱邪咒印，专克鬼魅幻境与近身扑杀",
    "tags": [
      "东方修真",
      "剑修",
      "抗模因",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "C025",
    "name": "白泽图残页（三类）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《山海经》／古籍｜知识",
    "price": 55,
    "discountable": true,
    "desc": "记载特定精怪与规则异常弱点，提供可验证的调查假说",
    "tags": [
      "东方修真",
      "侦察",
      "规则"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 3,
      "wil": 1,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "C026",
    "name": "金光神咒（基础护体）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "道教／《一人之下》｜技法",
    "price": 70,
    "discountable": true,
    "desc": "凝聚金光护体防拳脚与低阶阴邪侵蚀，持续消耗炁／真元",
    "tags": [
      "东方修真",
      "灵异",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "C027",
    "name": "五行遁·土行残篇",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《封神演义》｜技法",
    "price": 80,
    "discountable": true,
    "desc": "短距潜入实体泥土避开火力或绕后救人，遇精钢与封地阵失效",
    "tags": [
      "东方修真",
      "阵法",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C028",
    "name": "照妖镜·仿制铜鉴",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《封神》云中子｜器物",
    "price": 75,
    "discountable": true,
    "desc": "照破低中阶拟态、画皮与幻身，强目标仅现模糊重影",
    "tags": [
      "东方修真",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C029",
    "name": "五雷正法·掌心引雷",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "道教雷法｜技法",
    "price": 70,
    "discountable": true,
    "desc": "瞬发小股阳雷驱邪破障、打断施法，非大范围杀伤",
    "tags": [
      "东方修真",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "C030",
    "name": "归元剑阵（三剑雏形）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "仙侠通用｜技法",
    "price": 85,
    "discountable": true,
    "desc": "三柄飞剑结成简易防壁与困敌三角，需配套飞剑与神识",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "侦察",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 1,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C031",
    "name": "墨家非攻·折叠剑盾",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "先秦墨家｜器物",
    "price": 60,
    "discountable": true,
    "desc": "机括变形于短剑与圆盾之间，纯物理高韧性守御",
    "tags": [
      "东方修真",
      "剑修",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "C032",
    "name": "定风珠（微粒）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《西游记》衍化｜器物",
    "price": 65,
    "discountable": true,
    "desc": "半径五米内平息狂风、毒雾与冲击气流，不挡实体弹丸",
    "tags": [
      "东方修真",
      "毒素生化",
      "爆发"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "C033",
    "name": "避水珠（残）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "古典神魔｜器物",
    "price": 50,
    "discountable": true,
    "desc": "水下开辟呼吸空间并稳住身形，承压有限",
    "tags": [
      "东方修真",
      "空间"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C034",
    "name": "神行甲马（三套）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "民俗／水浒｜耗材",
    "price": 45,
    "discountable": true,
    "desc": "贴于腿部大幅提升长途奔袭与撤离速度，单次限时 10 分钟",
    "tags": [
      "东方修真",
      "护盾",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C035",
    "name": "还魂草汁（两剂）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "《白蛇传》衍化｜耗材",
    "price": 85,
    "discountable": true,
    "desc": "濒死吊命、强行稳住重伤队友心跳 5 分钟争取救治，无法起死回生",
    "tags": [
      "东方修真",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "C036",
    "name": "百鬼夜行幡（低阶）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "东方玄幻｜器物",
    "price": 80,
    "discountable": true,
    "desc": "释放少量阴魂雾气遮蔽视野与干扰敌方锁定，易引正道或克邪手段反制",
    "tags": [
      "东方修真",
      "隐蔽",
      "电磁",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C037",
    "name": "乾坤袋（小型）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "古典神魔｜器物",
    "price": 60,
    "discountable": true,
    "desc": "随身收纳 2 立方米死物与阵具，无法装入活体",
    "tags": [
      "东方修真",
      "阵法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C038",
    "name": "缚妖索（麻绳仿制）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "古典神魔｜器物",
    "price": 75,
    "discountable": true,
    "desc": "自动缠绕并压制中低阶妖魔与灵体行动，可被强力斩断",
    "tags": [
      "东方修真",
      "收容"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C039",
    "name": "青竹精铁备用剑（三柄）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "修真通用｜器物",
    "price": 60,
    "discountable": true,
    "desc": "专为阵修准备的高一致性制式飞剑，便于多点布桩",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C040",
    "name": "护脉固元丹（两颗）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "C",
    "source": "修真通用｜耗材",
    "price": 55,
    "discountable": true,
    "desc": "强行压制真元反噬与经脉撕裂，保住关键时刻的施法能力",
    "tags": [
      "东方修真",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 5,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C041",
    "name": "本命守御剑胚孕养法",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《剑来》／道门｜知识＋器物",
    "price": 120,
    "discountable": true,
    "desc": "孕养 1–2 柄本命非杀伐剑（如控界剑＋护身剑），人剑相通，剑毁伤神识",
    "tags": [
      "东方修真",
      "剑修",
      "侦察",
      "爆发"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "C042",
    "name": "宵练剑意·小成",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《列子·汤问》｜技法",
    "price": 110,
    "discountable": true,
    "desc": "剑过不血刃而专断“势”：斩断中阶供能连接、仪式媒介与持续引导技",
    "tags": [
      "东方修真",
      "剑修"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 1,
      "wil": 1,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "C043",
    "name": "五岳真形图·单岳拓本",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《汉武帝内传》｜器物",
    "price": 140,
    "discountable": true,
    "desc": "任选一岳摹本（嵩山镇稳／恒山止煞等），借单岳虚影护防线，有冷却充能",
    "tags": [
      "东方修真",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C044",
    "name": "十二律吕·单律剑鸣",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《淮南子》｜技法",
    "price": 125,
    "discountable": true,
    "desc": "剑鸣应古律：选「黄钟」稳心抗模因提振队友，或「应钟」滞缓敌方连招半拍",
    "tags": [
      "东方修真",
      "剑修",
      "抗模因",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 4,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "C045",
    "name": "画地为牢（简版）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《西游记》｜技法",
    "price": 130,
    "discountable": true,
    "desc": "以剑划圆瞬发三息规则边界，护伤员或短时圈禁强敌，超载崩碎",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "规则"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "C046",
    "name": "捆仙绳·仿制丝（限 5 次）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《封神演义》｜器物",
    "price": 115,
    "discountable": true,
    "desc": "专精单体硬控，命中锁死敌方四肢与常规挣脱，需队友补刀或收容",
    "tags": [
      "东方修真",
      "收容",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C047",
    "name": "太乙五烟罗·残片",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《蜀山剑侠传》｜器物",
    "price": 150,
    "discountable": true,
    "desc": "展开三步方圆五色烟岚，抵御高强度物理与法术集火，持续耗真元",
    "tags": [
      "东方修真",
      "剑修",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C048",
    "name": "青元剑诀·筑基剑盾篇",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《凡人修仙传》｜功法",
    "price": 120,
    "discountable": true,
    "desc": "解锁护体剑盾保障布阵与撤离安全，保留修行偏慢特征",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "收容",
      "护盾"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C049",
    "name": "金雷竹成材（三剑份）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《凡人修仙传》｜材料",
    "price": 120,
    "discountable": true,
    "desc": "炼制附带辟邪神雷的克邪飞剑，仅克制阴邪魔功，需另行炼化",
    "tags": [
      "东方修真",
      "剑修",
      "电磁",
      "火焰雷法",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C050",
    "name": "大衍诀·中阶分神",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《凡人修仙传》｜技法",
    "price": 145,
    "discountable": true,
    "desc": "神识多线程操控 3–6 柄飞剑与傀儡，兼顾外围警戒与阵枢微调",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "侦察",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 3,
      "wil": 2,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C051",
    "name": "法海金钵（仿制）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《白蛇传》｜器物",
    "price": 155,
    "discountable": true,
    "desc": "罩住并强力镇压中阶妖鬼实体，维持期间施术者难以自由移动",
    "tags": [
      "东方修真",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C052",
    "name": "云中子通天神火柱（单柱）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《封神演义》｜器物",
    "price": 160,
    "discountable": true,
    "desc": "预埋封路与高温拒止，单柱可封窄口通道，难成八柱绝杀阵",
    "tags": [
      "东方修真",
      "阵法",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C053",
    "name": "地煞术·解厄（初阶）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《历代神仙通鉴》｜技法",
    "price": 140,
    "discountable": true,
    "desc": "转移或化解队友身上一次致命厄运／诅咒标记，冷却极长",
    "tags": [
      "东方修真",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C054",
    "name": "地煞术·障服／假形",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《历代神仙通鉴》｜技法",
    "price": 125,
    "discountable": true,
    "desc": "高阶易容与隐匿气机，用于侦察渗透与保护关键目标撤离",
    "tags": [
      "东方修真",
      "隐蔽",
      "侦察",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 4,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "C055",
    "name": "地煞术·支离（保命）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《历代神仙通鉴》｜技法",
    "price": 150,
    "discountable": true,
    "desc": "危急瞬间令躯干局部解离规避致命贯穿，随后重组，极耗元气",
    "tags": [
      "东方修真",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C056",
    "name": "缩地成寸（短距）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《神仙传》｜技法",
    "price": 145,
    "discountable": true,
    "desc": "一步跨出数十米调整阵位或抢救近处伤员，无法穿透实体厚壁",
    "tags": [
      "东方修真",
      "阵法",
      "空间"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C057",
    "name": "玄门金光镜盾",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "道教衍化｜器物",
    "price": 130,
    "discountable": true,
    "desc": "可展开为半透明光幕折射能量射线，对高能激光有承载上限",
    "tags": [
      "东方修真",
      "破甲",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "C058",
    "name": "通天箓·入门（候选）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《一人之下》｜技法",
    "price": 165,
    "discountable": true,
    "desc": "虚空快速画制已学基础符箓，大幅压缩临场布阵前摇，符式需另学",
    "tags": [
      "东方修真",
      "阵法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C059",
    "name": "紫青双剑（残灵）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《蜀山》｜器物",
    "price": 180,
    "discountable": true,
    "desc": "高攻速剑修主 C 器物，双剑合璧威能倍增，非守御向",
    "tags": [
      "东方修真",
      "剑修"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "C060",
    "name": "轩辕法剑（燕赤霞传承）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《倩女幽魂》｜器物",
    "price": 170,
    "discountable": true,
    "desc": "阳刚正气剑器，对千年厉鬼与阴域幻象具极强破法力",
    "tags": [
      "东方修真",
      "剑修",
      "灵异",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C061",
    "name": "墨家机关玄武甲",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "先秦墨家｜器物",
    "price": 150,
    "discountable": true,
    "desc": "重型联动护甲，展开成固定掩体护住身后队友",
    "tags": [
      "东方修真",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C062",
    "name": "替死纸人（精制）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "东方民俗｜耗材",
    "price": 130,
    "discountable": true,
    "desc": "预置后可代承一次中阶必杀物理或诅咒打击，触发即化灰",
    "tags": [
      "东方修真",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "C063",
    "name": "九宫八卦阵盘（便携）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "古典阵道｜器物",
    "price": 145,
    "discountable": true,
    "desc": "预设九处阵点干扰敌方方位感并增幅阵内己方闪避",
    "tags": [
      "东方修真",
      "阵法",
      "电磁",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C064",
    "name": "龙虎山天师法印（授权）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "道教传统｜器物",
    "price": 155,
    "discountable": true,
    "desc": "强化符箓与敕令效力，对体系匹配的精怪阴灵具权威压制",
    "tags": [
      "东方修真",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "C065",
    "name": "醉仙望月步",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "B",
    "source": "《仙剑》｜身法",
    "price": 135,
    "discountable": true,
    "desc": "飘忽诡谲的高闪避步法，适合贴身拉扯与救援脱身",
    "tags": [
      "东方修真",
      "剑修",
      "灵异",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 3,
      "energy": 40
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "C066",
    "name": "承影剑意",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《列子·汤问》｜技法",
    "price": 280,
    "discountable": true,
    "desc": "明暗交界立无形影壁、锁敌影限位移、隔绝高阶灵异贴身，剑意护心",
    "tags": [
      "东方修真",
      "剑修",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C067",
    "name": "小界壶天葫芦",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《神仙传》｜器物",
    "price": 320,
    "discountable": true,
    "desc": "纳藏至多 4 名伤员或 1 件失控异常短时避死（3 分钟），葫芦破则内物俱毁",
    "tags": [
      "东方修真",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C068",
    "name": "落宝金钱·仿铸（限 3 次）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《封神演义》｜器物",
    "price": 300,
    "discountable": true,
    "desc": "强行令敌方关键法宝、武装或科技核心脱手失效，对纯肉身与概念无效",
    "tags": [
      "东方修真",
      "规则"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C069",
    "name": "阴阳镜·单面残器",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《封神演义》｜器物",
    "price": 360,
    "discountable": true,
    "desc": "仅存白面（照濒死队友吊命回光返照并提势）或黑面（强效定魂），每场限 1 次",
    "tags": [
      "东方修真",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 6,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C070",
    "name": "低阶弥尘幡",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《蜀山剑侠传》｜器物",
    "price": 290,
    "discountable": true,
    "desc": "云幢护身＋高速远遁，限携 2 人脱战；在大阵与强禁空间场内失效",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "空间"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C071",
    "name": "禹步借势·地脉托举",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《抱朴子》／大禹｜技法",
    "price": 270,
    "discountable": true,
    "desc": "踏七星禹步落剑定桩，引地脉厚重之势分摊全队重击伤害，需依托大地",
    "tags": [
      "东方修真",
      "剑修",
      "破甲",
      "团队"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 3,
      "wil": 3,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C072",
    "name": "息壤残土（一捧）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《山海经》｜器物",
    "price": 310,
    "discountable": true,
    "desc": "遇水或真元自生蔓延，瞬时筑起遇毁自补的超高韧性掩体与阵基",
    "tags": [
      "东方修真",
      "阵法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C073",
    "name": "笼中雀·剑界雏形",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《剑来》衍化｜技法",
    "price": 340,
    "discountable": true,
    "desc": "本命剑展开十米小天地压低敌势、抬高己势，强行逆转局部攻守",
    "tags": [
      "东方修真",
      "剑修"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C074",
    "name": "井中月·虚实承伤",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《剑来》衍化｜技法",
    "price": 330,
    "discountable": true,
    "desc": "令自身或 1 名队友短暂化作水中月影，规避一次致命锁定并转嫁冲击",
    "tags": [
      "东方修真",
      "剑修",
      "收容",
      "爆发",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C075",
    "name": "青竹蜂云剑·十二剑组（金雷竹）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《凡人修仙传》｜器物",
    "price": 360,
    "discountable": true,
    "desc": "成套本命飞剑，兼顾多点拦截、护阵枢与辟邪神雷克魔",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C076",
    "name": "剑影分光术",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《凡人修仙传》｜技法",
    "price": 260,
    "discountable": true,
    "desc": "将成套飞剑化出成倍剑光，封锁大范围空域与迫使敌人交位移",
    "tags": [
      "东方修真",
      "剑修",
      "收容",
      "位移"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C077",
    "name": "袖里乾坤·残篇",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《西游记》｜技法",
    "price": 350,
    "discountable": true,
    "desc": "短距吞纳敌方远程攻击或强行收摄中阶目标入袖，承重超限会震伤双臂",
    "tags": [
      "东方修真"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C078",
    "name": "指地成钢（天罡法）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《历代神仙通鉴》｜技法",
    "price": 280,
    "discountable": true,
    "desc": "瞬时固化大范围地形与防线结构，阻止塌方、地遁与重型突进",
    "tags": [
      "东方修真"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C079",
    "name": "纵地金光（初阶）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《封神演义》｜身法",
    "price": 320,
    "discountable": true,
    "desc": "极速金光遁行抢救远端队友或切入战场，直线轨迹易被预判拦截",
    "tags": [
      "东方修真",
      "位移",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C080",
    "name": "大禹锁链·龟山仿制",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《古岳渎经》｜器物",
    "price": 310,
    "discountable": true,
    "desc": "专精锁镇巨型水妖、实验体与狂暴实体强敌，需落锚固定",
    "tags": [
      "东方修真",
      "收容"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 6,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C081",
    "name": "五色神光·单色残羽",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《封神演义》｜器物",
    "price": 340,
    "discountable": true,
    "desc": "仅具五行中单一色泽（如黑水／黄土），可刷落对应属性攻击与器物",
    "tags": [
      "东方修真"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C082",
    "name": "昊天镜·裂片",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《蜀山传》｜器物",
    "price": 330,
    "discountable": true,
    "desc": "映照破除高阶幻域并折射一次强光／能量束，裂片过载会碎裂",
    "tags": [
      "东方修真"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C083",
    "name": "炼妖壶·低阶仿器",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《轩辕剑》｜器物",
    "price": 350,
    "discountable": true,
    "desc": "强行收容虚弱态异常生物并提炼基础材料，无法直接收入全盛强敌",
    "tags": [
      "东方修真",
      "剑修",
      "收容"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C084",
    "name": "大须弥正反九宫阵（缩略版）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《蜀山剑侠传》｜阵图＋器物",
    "price": 370,
    "discountable": true,
    "desc": "高阶据点困锁大阵，依赖预置阵眼彻底封死入侵者退路",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "收容"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C085",
    "name": "玉虚杏黄旗·微缩令旗",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《封神演义》｜器物",
    "price": 390,
    "discountable": true,
    "desc": "展旗化金莲护住自身与身旁 2 人硬扛高阶重击，持续极耗真元",
    "tags": [
      "东方修真",
      "破甲"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C086",
    "name": "南明离火剑（残火）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "《蜀山传》｜器物",
    "price": 360,
    "discountable": true,
    "desc": "主 C 向高阶阳火神剑，净化血魔与秽物，兼具微弱涅槃护持",
    "tags": [
      "东方修真",
      "剑修",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C087",
    "name": "太乙救苦护命符（一枚）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "A",
    "source": "道藏传统｜耗材",
    "price": 300,
    "discountable": true,
    "desc": "预贴队友身上，在遭遇即死规则或灵魂溃散时强行保住一缕真灵不灭",
    "tags": [
      "东方修真",
      "规则",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 3,
      "energy": 25
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "C088",
    "name": "宝莲灯·一缕灯芯火种",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《宝莲灯》｜一次性",
    "price": 500,
    "discountable": true,
    "desc": "点燃撑起 7 秒莲华不破界挡绝杀，并将积蓄愿力全数渡给主 C 与全队打出越阶一击；燃尽即灭",
    "tags": [
      "东方修真",
      "火焰雷法",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "C089",
    "name": "五岳真形·一次性齐聚法诏",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《汉武帝内传》｜一次性",
    "price": 520,
    "discountable": true,
    "desc": "焚诏引五岳虚影镇死绝杀与空间崩塌 5–7 秒，同时散逸地脉生气反哺全队；用完即毁",
    "tags": [
      "东方修真",
      "空间",
      "火焰雷法",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "C090",
    "name": "含光剑意·一剑借势符",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《列子·汤问》｜一次性",
    "price": 480,
    "discountable": true,
    "desc": "十息内步入“泯然无际”无相守御，全盘卸转敌方必杀势能反哺队友；本命剑重创需大修",
    "tags": [
      "东方修真",
      "剑修",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 3,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "C091",
    "name": "两仪微尘·单门残枢",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《蜀山剑侠传》｜残缺阵枢",
    "price": 560,
    "discountable": true,
    "desc": "仅开「生门／死门」二门残阵：绝境改写局部空间通路，护全队撤出或短时放逐强敌；单场限 1 次",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "空间",
      "团队"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 7,
      "obs": 5,
      "wil": 6,
      "energy": 95
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "C092",
    "name": "黄钟大吕·逆律符钟",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《淮南子》｜限 3 次法器",
    "price": 500,
    "discountable": true,
    "desc": "剑鸣撞钟拖慢战区时空节律半拍，同时黄钟启阳将全队状态瞬时抬至巅峰爆发",
    "tags": [
      "东方修真",
      "剑修",
      "爆发",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 7,
      "obs": 5,
      "wil": 6,
      "energy": 95
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C093",
    "name": "山河社稷图·残卷（一次性）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《封神演义》｜一次性",
    "price": 580,
    "discountable": true,
    "desc": "展卷强行将战区拖入局部山河画境 15 秒：隔绝外界支援并由地脉反哺全队；卷尽化灰",
    "tags": [
      "东方修真",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C094",
    "name": "移星换斗·借势残阵",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《历代神仙通鉴》｜一次性",
    "price": 540,
    "discountable": true,
    "desc": "以本命剑阵引斗柄拨转敌我命势，将敌方最高爆发势能强行转移至己方主 C 身上；施术者重伤脱力",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "爆发",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 3,
      "wil": 3,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C095",
    "name": "颠倒阴阳·瞬息逆转",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《历代神仙通鉴》｜高代价技",
    "price": 550,
    "discountable": true,
    "desc": "短暂倒置局部战场的攻防、虚实或治愈／伤害判定 3 秒，施术后承受严重阴阳反噬",
    "tags": [
      "东方修真",
      "赌命"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 8,
      "energy": 95
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 62,
      "cooldown": 6,
      "role": "support"
    }
  },
  {
    "id": "C096",
    "name": "大庚剑阵（三十六剑残阵）",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《凡人修仙传》｜阵图＋庚精",
    "price": 600,
    "discountable": true,
    "desc": "恐怖困杀与外侧拒止杀阵，需极高神识与大量剑器支撑，非纯守御向",
    "tags": [
      "东方修真",
      "剑修",
      "阵法",
      "侦察"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 6,
      "obs": 8,
      "wil": 5,
      "energy": 20
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "C097",
    "name": "昆仑镜·瞬息回溯片",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《轩辕剑》｜一次性",
    "price": 620,
    "discountable": true,
    "desc": "将直径 20 米内刚刚发生的 3 秒物理状态强行回拨（不含跨界因果与已死抹杀），用后镜碎",
    "tags": [
      "东方修真",
      "剑修",
      "规则",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 1,
      "wil": 2,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "C098",
    "name": "女娲石·一息续命屑",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《轩辕剑》｜一次性",
    "price": 550,
    "discountable": true,
    "desc": "瞬间将 1 名刚断气（30 秒内、灵魂未散）的队友拉回生门并恢复基础战力；一次性消耗",
    "tags": [
      "东方修真",
      "剑修",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 4,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C099",
    "name": "伏羲琴·安魂定世残弦",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《轩辕剑》｜一次性",
    "price": 490,
    "discountable": true,
    "desc": "拨动断弦强行镇压全场精神失控、模因暴走与狂暴异兽 10 秒，弦断即废",
    "tags": [
      "东方修真",
      "剑修",
      "收容",
      "抗模因",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 4,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "C100",
    "name": "诛仙剑意·借斩一剑",
    "canon": false,
    "category": "cultivation",
    "categoryLabel": "古典神话与修真",
    "tier": "S",
    "source": "《封神演义》｜一次性",
    "price": 580,
    "discountable": true,
    "desc": "纯主 C 终局斩杀底牌，极度锋锐破防，施展后大幅透支气血与兵器耐久",
    "tags": [
      "东方修真",
      "剑修",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 1,
      "wil": 2,
      "energy": 35
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "burst"
    }
  },
  {
    "id": "M001",
    "name": "抛光铜镜盾",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "希腊·珀尔修斯｜器物",
    "price": 15,
    "discountable": true,
    "desc": "间接观察拐角与直视凝视类威胁，不防影像或语义模因",
    "tags": [
      "异域神秘",
      "侦察",
      "抗模因",
      "护盾"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "M002",
    "name": "注连绳与纸垂套件",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "日本神道｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "标定仪式边界并感知外力破界，防护效力由配套阵法提供",
    "tags": [
      "异域神秘",
      "阵法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M003",
    "name": "粗制圣水（三瓶）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "基督教传统｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "灼伤低阶恶魔、亡灵与不洁实体，对普通物理怪物无效",
    "tags": [
      "异域神秘",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 0
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M004",
    "name": "白银盐线包",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "欧美驱魔民俗｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "封门窗阻挡低阶游魂与恶灵越界，易被气流或物理动作破坏",
    "tags": [
      "异域神秘",
      "收容",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M005",
    "name": "基础卢恩刻刀与木片",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "北欧神话｜器物",
    "price": 20,
    "discountable": true,
    "desc": "刻画一次性微弱预警或加固符文，需配合卢恩知识使用",
    "tags": [
      "异域神秘",
      "侦察",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "M006",
    "name": "护身圣甲虫挂坠",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "埃及神话｜器物",
    "price": 25,
    "discountable": true,
    "desc": "微幅降低低阶死灵诅咒与木乃伊尸毒侵蚀",
    "tags": [
      "异域神秘",
      "灵异",
      "毒素生化",
      "护盾"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M007",
    "name": "神道禊仪净水包",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "日本神道｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "仪式前净身准备，降低已识别秽污对后续术式的干扰",
    "tags": [
      "异域神秘",
      "电磁",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "M008",
    "name": "凯尔特槲寄生枝",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "凯尔特神话｜耗材",
    "price": 25,
    "discountable": true,
    "desc": "破除低阶自然迷雾与精灵类幻惑，一次性干枯失效",
    "tags": [
      "异域神秘",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M009",
    "name": "简易所罗门防护粉笔",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "所罗门传统｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "勾画基础防护圆，短时隔绝低阶召唤物反噬",
    "tags": [
      "异域神秘",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 2,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M010",
    "name": "奥林匹斯橄榄油膏",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "希腊传统｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "缓解肌肉撕裂与剧烈疲劳，加速体能恢复",
    "tags": [
      "异域神秘",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "mobility"
    }
  },
  {
    "id": "M011",
    "name": "基础忍具包（苦无＋起爆符）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "火影｜耗材",
    "price": 25,
    "discountable": true,
    "desc": "牵制、布设简易拌雷与远距留标载体",
    "tags": [
      "异域神秘",
      "电磁",
      "火焰雷法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M012",
    "name": "灵子感知眼镜",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "BLEACH 衍生｜器物",
    "price": 30,
    "discountable": true,
    "desc": "令普通人肉眼可见灵体与灵压残留，不提供防护",
    "tags": [
      "异域神秘"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 0
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M013",
    "name": "印度檀香定神膏",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "印度瑜伽传统｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "迅速平复惊恐与心率飙升，便于精密施术",
    "tags": [
      "异域神秘",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M014",
    "name": "塔罗启示牌组（基础）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "D",
    "source": "西方神秘学｜器物",
    "price": 35,
    "discountable": true,
    "desc": "每场提供 1 次模糊吉凶征兆提示，不直给具体谜底",
    "tags": [
      "异域神秘"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M015",
    "name": "摩吕神草（两株）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "希腊《奥德赛》｜耗材",
    "price": 45,
    "discountable": true,
    "desc": "针对变形术与对应迷咒的应急抗性，不覆盖模因与病毒",
    "tags": [
      "异域神秘",
      "抗模因",
      "灵异",
      "毒素生化",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "M016",
    "name": "《高人的箴言》单门魔歌",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "北欧神话｜技法",
    "price": 65,
    "discountable": true,
    "desc": "任选「脱缚」或「止可见飞矢」一门，临场即时施放",
    "tags": [
      "异域神秘",
      "收容",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M017",
    "name": "《女武神之歌》铭刻入门",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "北欧神话｜知识",
    "price": 60,
    "discountable": true,
    "desc": "在剑器或载具上铭刻基础胜利／航行／疗伤符文，占维护时间",
    "tags": [
      "异域神秘",
      "剑修",
      "医疗",
      "规则",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "M018",
    "name": "小型侦察式神契约",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "日本阴阳道｜契约",
    "price": 50,
    "discountable": true,
    "desc": "巡路、递符与低带宽信号回报，避免共享高危视听",
    "tags": [
      "异域神秘",
      "侦察",
      "黑客",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 3,
      "wil": 1,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "M019",
    "name": "神道大祓祝词（基础）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "日本神道｜技法",
    "price": 55,
    "discountable": true,
    "desc": "战后清理营地秽污与解除低阶诅咒，施法需耗时",
    "tags": [
      "异域神秘",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M020",
    "name": "鬼道·缚道低阶三术",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "BLEACH｜技法",
    "price": 75,
    "discountable": true,
    "desc": "习得塞、赤火炮（改控）、匍匐绳等低阶束缚与牵制术，需灵压",
    "tags": [
      "异域神秘",
      "收容",
      "灵异",
      "火焰雷法",
      "爆发"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M021",
    "name": "阿努比斯天平挂坠",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "埃及神话｜器物",
    "price": 70,
    "discountable": true,
    "desc": "感知目标是否撒谎或携带强烈杀意，对高阶伪装与机械无效",
    "tags": [
      "异域神秘",
      "隐蔽",
      "规则"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M022",
    "name": "《亡灵书》护魂残章",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "埃及神话｜知识",
    "price": 80,
    "discountable": true,
    "desc": "诵读稳固濒死队友三魂不散，对抗低中阶摄魂与亡灵侵袭",
    "tags": [
      "异域神秘",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "M023",
    "name": "凯尔特 Geas 誓约戒",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "凯尔特神话｜器物",
    "price": 85,
    "discountable": true,
    "desc": "主动立下一条严苛行为禁忌换取当场全属性小幅提升，违誓遭重创",
    "tags": [
      "异域神秘",
      "规则",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M024",
    "name": "所罗门第一防护五芒符",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "《所罗门之钥》｜器物",
    "price": 75,
    "discountable": true,
    "desc": "专司抵御常规召唤灵与低阶恶魔的精神压迫与物理扑击",
    "tags": [
      "异域神秘",
      "抗模因",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M025",
    "name": "《以弗所书》信德护心祝",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "基督教意象｜技法",
    "price": 65,
    "discountable": true,
    "desc": "稳固心智、抵御诱惑与特定附体侵蚀，需保持心志坚定",
    "tags": [
      "异域神秘"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "M026",
    "name": "《诗篇》91 营地庇护祷文",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "基督教意象｜技法",
    "price": 70,
    "discountable": true,
    "desc": "于休整点建立短时安宁空间，降低夜间突袭与恶灵渗透",
    "tags": [
      "异域神秘",
      "空间"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M027",
    "name": "赫尔墨斯羽鞋（仿制）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "希腊神话｜器物",
    "price": 80,
    "discountable": true,
    "desc": "短时离地滑翔与极速闪避，续航仅 30 秒且承载有限",
    "tags": [
      "异域神秘",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 1,
      "wil": 1,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "mobility"
    }
  },
  {
    "id": "M028",
    "name": "替身术（忍者基础）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "火影｜技法",
    "price": 65,
    "discountable": true,
    "desc": "受击瞬间与近处木桩／预置物体换位保命，需查克拉与预判",
    "tags": [
      "异域神秘",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "M029",
    "name": "查克拉传导金属短刃",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "火影｜器物",
    "price": 55,
    "discountable": true,
    "desc": "高效传导查克拉与留设空间标记的优质副手载体",
    "tags": [
      "异域神秘",
      "空间",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M030",
    "name": "印度法螺（震慑）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "印度神话｜器物",
    "price": 65,
    "discountable": true,
    "desc": "吹响发出高频音波震散低阶幻雾、打断施法并提振队友士气",
    "tags": [
      "异域神秘",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "M031",
    "name": "苏美尔泥板真名拓片",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "苏美尔神话｜耗材",
    "price": 80,
    "discountable": true,
    "desc": "记录 1 名目标的真实称谓或核心代号，使其更易被后续封印锁定",
    "tags": [
      "异域神秘",
      "收容",
      "规则",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "M032",
    "name": "猎魔人昆恩法印",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "C",
    "source": "猎魔人｜技法",
    "price": 70,
    "discountable": true,
    "desc": "瞬发贴身个人护盾硬吃一次中阶物理冲击，破盾后有冷却",
    "tags": [
      "异域神秘",
      "结界",
      "护盾",
      "爆发"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 20
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "M033",
    "name": "间流结界术（基础完整）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "《结界师》｜资质＋知识",
    "price": 140,
    "discountable": true,
    "desc": "方围、定础、结、解；临场承托、作墙与多层变轨，独立灵力体系",
    "tags": [
      "异域神秘",
      "阵法",
      "结界"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "M034",
    "name": "赫尔墨斯金杖·授权仿品",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "希腊《奥德赛》｜器物",
    "price": 150,
    "discountable": true,
    "desc": "具备「唤醒队友」「单目标催眠」与「低阶引魂」三项独立辅助能力",
    "tags": [
      "异域神秘",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 4,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "M035",
    "name": "珀尔修斯凝视防盾",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "希腊神话｜器物",
    "price": 135,
    "discountable": true,
    "desc": "专项免疫石化、直视致死等凝视类规则攻击，兼作坚固盾牌",
    "tags": [
      "异域神秘",
      "规则",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "M036",
    "name": "海姆达尔守望者赐福",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "北欧神话｜祝福",
    "price": 145,
    "discountable": true,
    "desc": "极敏远程听觉与阵锚破损预警，可按通道关闭以防模因过载",
    "tags": [
      "异域神秘",
      "阵法",
      "侦察",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "M037",
    "name": "《高人的箴言》三歌合修",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "北欧神话｜技法",
    "price": 165,
    "discountable": true,
    "desc": "兼修脱缚、止可见飞矢、钝敌刃，构成完整的防护魔歌体系",
    "tags": [
      "异域神秘",
      "收容",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M038",
    "name": "所罗门仪式召唤阵盘",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "《所罗门之钥》｜器物",
    "price": 175,
    "discountable": true,
    "desc": "经充分准备后可针对特定目标布设强力拘束与反制阵区",
    "tags": [
      "异域神秘",
      "阵法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M039",
    "name": "守护天使短时契约",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "基督教传统｜契约",
    "price": 180,
    "discountable": true,
    "desc": "约定警戒、护送与危急时一次短时挡灾，违背誓约则契约断裂",
    "tags": [
      "异域神秘",
      "规则"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M040",
    "name": "BLEACH 浅打（个人磨合）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "BLEACH｜器物",
    "price": 130,
    "discountable": true,
    "desc": "无名斩魄刀胚胎，随灵压与灵魂磨合觉醒专属始解能力",
    "tags": [
      "异域神秘",
      "灵异"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 2,
      "obs": 1,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "M041",
    "name": "鬼道·六十一·六杖光牢",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "BLEACH｜技法",
    "price": 160,
    "discountable": true,
    "desc": "六道光片封锁目标腰腹行动，强力单体硬控，舍弃咏唱威力衰减",
    "tags": [
      "异域神秘",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M042",
    "name": "鬼道·八十一·断空（残）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "BLEACH｜技法",
    "price": 185,
    "discountable": true,
    "desc": "展开透明光壁硬挡中阶能量与鬼道轰击，极耗灵压",
    "tags": [
      "异域神秘",
      "灵异"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 2,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "M043",
    "name": "草薙剑·护持灵格投影",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "日本神话｜授权",
    "price": 175,
    "discountable": true,
    "desc": "强化护卫、刈草破围与保住退路，不附带全元素免疫",
    "tags": [
      "异域神秘",
      "剑修"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M044",
    "name": "天之尾羽张·截流剑意",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "《古事记》｜技法",
    "price": 165,
    "discountable": true,
    "desc": "斩断水流、气流与中阶能量通道，专司割裂战场",
    "tags": [
      "异域神秘",
      "剑修"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 1,
      "wil": 1,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "M045",
    "name": "新阴流·简易领域（初阶）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "咒术回战｜技法",
    "price": 155,
    "discountable": true,
    "desc": "半径两米余的贴身反击与护卫领域，护住身边关键队友",
    "tags": [
      "异域神秘",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M046",
    "name": "埃及玛阿特秩序羽毛",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "埃及神话｜器物",
    "price": 170,
    "discountable": true,
    "desc": "短时压制局部混乱与失控状态，令敌我双方短暂回到公平物理对抗",
    "tags": [
      "异域神秘",
      "规则",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M047",
    "name": "荷鲁斯之眼护符",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "埃及神话｜器物",
    "price": 150,
    "discountable": true,
    "desc": "抵御一次精神控制或幻象侵袭，并加速轻中度外伤愈合",
    "tags": [
      "异域神秘",
      "抗模因",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 2,
      "wil": 2,
      "energy": 40
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "mobility"
    }
  },
  {
    "id": "M048",
    "name": "凯尔特卢格长矛（仿制）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "凯尔特神话｜器物",
    "price": 175,
    "discountable": true,
    "desc": "主 C 向高命中投掷／突刺魔枪，附带微弱必中修正",
    "tags": [
      "异域神秘",
      "破甲"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 2,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "M049",
    "name": "阿瓦隆晨露（一瓶）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "亚瑟王传说｜耗材",
    "price": 140,
    "discountable": true,
    "desc": "迅速治愈重度外伤与中阶魔法毒素，无法断肢重生",
    "tags": [
      "异域神秘",
      "毒素生化",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "support"
    }
  },
  {
    "id": "M050",
    "name": "印度毗湿奴护轮（仿制）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "印度神话｜器物",
    "price": 165,
    "discountable": true,
    "desc": "旋飞拦截远程投射物并自动回手，兼顾中距骚扰",
    "tags": [
      "异域神秘",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M051",
    "name": "英雄联盟·调和命运（残印）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "游戏跨界｜技法",
    "price": 185,
    "discountable": true,
    "desc": "令指定小区域内敌我全部进入 2.5 秒不可选中凝滞态，极吃施放时机",
    "tags": [
      "异域神秘",
      "规则"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M052",
    "name": "Dota 2·推推棒（原力法杖）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "B",
    "source": "游戏跨界｜器物",
    "price": 135,
    "discountable": true,
    "desc": "瞬时将自身、队友或敌人沿朝向强行推离 15 米，顶级廉价救人／打断神具",
    "tags": [
      "异域神秘",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 40
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M053",
    "name": "格莱普尼尔·仿制拘束带",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "北欧神话｜器物",
    "price": 320,
    "discountable": true,
    "desc": "闭合落锚后锁死实体强敌移动与肢体动作，需剑器护锚，不封心灵",
    "tags": [
      "异域神秘",
      "剑修",
      "收容"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 3,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M054",
    "name": "埃癸斯·护阵授权",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "希腊神话｜器物／授权",
    "price": 330,
    "discountable": true,
    "desc": "定向高强护幕拦截重击，并对可受恐惧影响的越界敌人施加威慑",
    "tags": [
      "异域神秘",
      "阵法",
      "破甲"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M055",
    "name": "哈迪斯之帽（受限）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "希腊《书库》｜器物",
    "price": 310,
    "discountable": true,
    "desc": "顶级视觉隐身，专用于潜入布阵、抢救伤员与取证；不抹气味热源",
    "tags": [
      "异域神秘",
      "阵法",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M056",
    "name": "斯瓦林·隔热阵眼",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "北欧神话｜器物",
    "price": 300,
    "discountable": true,
    "desc": "构筑极强隔热庇护区，无视反应堆高温与烈焰焚烧，不防辐射精神",
    "tags": [
      "异域神秘",
      "阵法",
      "抗模因",
      "火焰雷法",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 6,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M057",
    "name": "双鱼理·受限复刻",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "BLEACH｜器物＋适配",
    "price": 340,
    "discountable": true,
    "desc": "吸收承载内的远程／能量攻击并经五枚札调速返还，需灵魂适配",
    "tags": [
      "异域神秘",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 3,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M058",
    "name": "千本樱·始解复刻",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "BLEACH｜器物＋适配",
    "price": 350,
    "discountable": true,
    "desc": "刀刃化千片细刃实施多向封路与截击，对无实体规则无效",
    "tags": [
      "异域神秘",
      "规则"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 4,
      "obs": 2,
      "wil": 2,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "M059",
    "name": "水门版飞雷神（基础救援）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "火影忍者｜技法＋训练",
    "price": 300,
    "discountable": true,
    "desc": "依托预设标记自救与单人接应，传送不净化乘客，标记点可被占领",
    "tags": [
      "异域神秘",
      "电磁",
      "空间",
      "火焰雷法",
      "位移"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "support"
    }
  },
  {
    "id": "M060",
    "name": "间流·绝界",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "《结界师》｜技法",
    "price": 320,
    "discountable": true,
    "desc": "个人高阶攻防排斥结界，可折断来袭兵刃，排斥性不天然区分友军",
    "tags": [
      "异域神秘",
      "阵法",
      "结界"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 2,
      "obs": 2,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "M061",
    "name": "间流·无想心境",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "《结界师》｜技法",
    "price": 280,
    "discountable": true,
    "desc": "剥离情绪波动、大幅提升多结界与多剑并发稳定性，不免疫模因",
    "tags": [
      "异域神秘",
      "剑修",
      "阵法",
      "结界",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 2,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "M062",
    "name": "八咫镜·神道见证器",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "日本神话｜器物",
    "price": 310,
    "discountable": true,
    "desc": "建立高阶神道契约、身份锚定与真伪见证，非泛用能量反射盾",
    "tags": [
      "异域神秘",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 2,
      "wil": 5,
      "energy": 60
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "M063",
    "name": "伊西斯复活秘药（假死吊命）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "埃及神话｜耗材",
    "price": 340,
    "discountable": true,
    "desc": "将重创濒死者强行拉入稳定假死态保存 24 小时，带回空间修复",
    "tags": [
      "异域神秘",
      "医疗",
      "空间",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 3,
      "energy": 25
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "M064",
    "name": "巴比伦天命泥板（微片）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "苏美尔神话｜耗材",
    "price": 360,
    "discountable": true,
    "desc": "单次改写一项已触发的局部判定结果（如闪避一次必中锁头），用后碎裂",
    "tags": [
      "异域神秘",
      "收容",
      "位移",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 2,
      "energy": 25
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M065",
    "name": "英雄联盟·羊灵生息（缩略域）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "游戏跨界｜技法",
    "price": 380,
    "discountable": true,
    "desc": "展开 4 秒保命域，域内敌我皆无法跌破死线并结束时微幅回血，敌我共享",
    "tags": [
      "异域神秘"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M066",
    "name": "Dota 2·黑洞（引导残印）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "游戏跨界｜技法",
    "price": 370,
    "discountable": true,
    "desc": "持续 3 秒强力聚拢并压制区域内所有敌人，引导期间极易被打断",
    "tags": [
      "异域神秘"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M067",
    "name": "天之锁·仿制链段",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "Fate 候选｜器物",
    "price": 350,
    "discountable": true,
    "desc": "拘束力随目标神性增强，对无神性目标仅作极坚固锁链，需命中维持",
    "tags": [
      "异域神秘",
      "收容"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M068",
    "name": "阴阳道·十二天将契约（其一）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "日本阴阳道｜契约",
    "price": 330,
    "discountable": true,
    "desc": "契约六合／玄武／青龙之一协助护阵、侦察或防御，消耗高额灵力",
    "tags": [
      "异域神秘",
      "阵法",
      "结界",
      "侦察"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 7,
      "wil": 3,
      "energy": 60
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "recon"
    }
  },
  {
    "id": "M069",
    "name": "印度阿修罗战鼓（鼓槌）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "印度神话｜器物",
    "price": 290,
    "discountable": true,
    "desc": "擂响激发全队狂热抗痛与攻击提速，结束后陷入深度疲惫",
    "tags": [
      "异域神秘",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 60
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M070",
    "name": "所罗门魔神临时契约（防护柱）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "A",
    "source": "所罗门传统｜耗材",
    "price": 340,
    "discountable": true,
    "desc": "依仪式召唤防护向魔神代扛一轮灾难，事后须支付约定代价",
    "tags": [
      "异域神秘",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 25
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "M071",
    "name": "炽天覆七重圆环（单次投影卷轴）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "Fate｜一次性",
    "price": 460,
    "discountable": true,
    "desc": "对投射类毁灭打击提供七层概念拦截，每破一层反噬施术者痛楚震伤",
    "tags": [
      "异域神秘",
      "规则",
      "爆发",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 35
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "burst"
    }
  },
  {
    "id": "M072",
    "name": "神剑·八镜剑（单次借影）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "BLEACH｜一次性",
    "price": 520,
    "discountable": true,
    "desc": "承接匹配的神力毁灭打击并向八方分散；须提前清空友军避让方向",
    "tags": [
      "异域神秘",
      "剑修",
      "爆发",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 1,
      "wil": 2,
      "energy": 35
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "burst"
    }
  },
  {
    "id": "M073",
    "name": "彩虹桥·短距锚点桥（限 2 次）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "北欧神话｜器物",
    "price": 540,
    "discountable": true,
    "desc": "在两枚预设阵锚间强行架设跨战区撤离火桥，无法突破考场离场封锁",
    "tags": [
      "异域神秘",
      "阵法",
      "收容",
      "抗模因",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 4,
      "obs": 5,
      "wil": 9,
      "energy": 95
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "M074",
    "name": "Dota 2·时间结界（残印）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "游戏跨界｜高代价技",
    "price": 560,
    "discountable": true,
    "desc": "展开直径 40 米、持续 5 秒的绝对时间冻结域，波及区内未豁免友军",
    "tags": [
      "异域神秘",
      "阵法",
      "结界",
      "规则",
      "赌命"
    ],
    "powerDelta": {
      "phy": 7,
      "agi": 3,
      "obs": 3,
      "wil": 7,
      "energy": 95
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "defense"
    }
  },
  {
    "id": "M075",
    "name": "英雄联盟·宇宙之辉（一次性星冠）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "游戏跨界｜一次性",
    "price": 540,
    "discountable": true,
    "desc": "经 2.5 秒明显延迟降临星辉，令全队获得 2.5 秒无敌反打窗口，延迟期易被打断",
    "tags": [
      "异域神秘",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 35
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M076",
    "name": "间流·真界雏形（一次性秘卷）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "《结界师》｜一次性",
    "price": 580,
    "discountable": true,
    "desc": "归零并重构直径 10 米可生存空间，保全队友并排除承载内外来干涉；施术者濒死脱力",
    "tags": [
      "异域神秘",
      "阵法",
      "结界",
      "规则",
      "空间"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 35
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "M077",
    "name": "水门版飞雷神·导雷（终局技）",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "火影忍者｜高代价技",
    "price": 520,
    "discountable": true,
    "desc": "展开时空结界将敌方超规格能量轰击整发转移至预设标记点，极耗查克拉",
    "tags": [
      "异域神秘",
      "阵法",
      "结界",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 7,
      "agi": 3,
      "obs": 3,
      "wil": 7,
      "energy": 95
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "defense"
    }
  },
  {
    "id": "M078",
    "name": "矢量操作·十秒全反射过载",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "魔禁衍生｜一次性",
    "price": 550,
    "discountable": true,
    "desc": "依托外置演算阵列强行维持 10 秒全矢量反射（不含纯语义规则），用后阵列烧毁",
    "tags": [
      "异域神秘",
      "阵法",
      "黑客",
      "规则",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 5,
      "wil": 2,
      "energy": 35
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "recon"
    }
  },
  {
    "id": "M079",
    "name": "埃及太阳船护佑诏书",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "埃及神话｜一次性",
    "price": 510,
    "discountable": true,
    "desc": "召唤太阳船虚影护全队强闯暗域／鬼域 10 秒，驱散高阶阴暗法则",
    "tags": [
      "异域神秘",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 35
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "M080",
    "name": "英灵殿·英灵降临号角",
    "canon": false,
    "category": "myth",
    "categoryLabel": "异域神话与神秘学",
    "tier": "S",
    "source": "北欧神话｜一次性",
    "price": 560,
    "discountable": true,
    "desc": "吹响号角令全队 10 秒内免于倒地、战力拔升至巅峰并附带亡魂护卫，结束后全员力竭",
    "tags": [
      "异域神秘",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 5,
      "energy": 35
    },
    "energyType": "魔力",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T001",
    "name": "常规制式枪械与弹药",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "全球死考｜器物",
    "price": 10,
    "discountable": false,
    "desc": "手枪／突击步枪与基础弹药，对高甲与灵异目标乏力",
    "tags": [
      "科技装备",
      "破甲",
      "医疗",
      "灵异",
      "护盾"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "T002",
    "name": "破片／闪光／烟雾战术手雷套",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "全球死考｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "破门、致盲、遮蔽视野与诱饵爆破（原著首场经典用法）",
    "tags": [
      "科技装备",
      "隐蔽",
      "电磁",
      "火焰雷法",
      "爆发"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 0,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "T003",
    "name": "防弹凯夫拉战术背心",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 15,
    "discountable": true,
    "desc": "抵御普通手枪与流弹破片，防不住穿甲弹与超凡重击",
    "tags": [
      "科技装备",
      "破甲",
      "护盾"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 0
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "defense"
    }
  },
  {
    "id": "T004",
    "name": "PKE 灵质探测器",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "《Ghostbusters》2009｜器物",
    "price": 25,
    "discountable": true,
    "desc": "探测灵质波动与隐形异常，需电池维护",
    "tags": [
      "科技装备",
      "隐蔽",
      "侦察",
      "电磁"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T005",
    "name": "加密短波战术耳麦（五人套）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 15,
    "discountable": true,
    "desc": "团队实时语音通联，易受强电磁干扰与灵异窃听",
    "tags": [
      "科技装备",
      "破甲",
      "电磁",
      "黑客",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "T006",
    "name": "便携热成像／夜视双模目镜",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 25,
    "discountable": true,
    "desc": "暗室侦察与识别活体热源，对低温尸体与隐热目标失效",
    "tags": [
      "科技装备",
      "隐蔽",
      "侦察",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 0,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T007",
    "name": "微型光纤内窥镜",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 10,
    "discountable": false,
    "desc": "门缝与管道侦察，低风险获取视觉情报",
    "tags": [
      "科技装备",
      "侦察"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T008",
    "name": "电子开锁与门禁破解器",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 20,
    "discountable": true,
    "desc": "破解常规电子锁与设施安保终端，老旧机械锁需另配工具",
    "tags": [
      "科技装备",
      "电磁",
      "黑客",
      "收容"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T009",
    "name": "高强度碳纤维索降与破拆套",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 15,
    "discountable": true,
    "desc": "救援吊装、快速垂降与物理破门",
    "tags": [
      "科技装备"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "T010",
    "name": "便携生化防毒面具与滤罐",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 20,
    "discountable": true,
    "desc": "隔绝常规毒气、粉尘与气溶胶病原体，不防模因",
    "tags": [
      "科技装备",
      "抗模因",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "T011",
    "name": "一次性 EMP 微型脉冲雷",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "科幻｜耗材",
    "price": 30,
    "discountable": true,
    "desc": "瘫痪半径 10 米内普通监控、摄像头与低阶机械单位",
    "tags": [
      "科技装备",
      "电磁",
      "火焰雷法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 0,
      "energy": 0
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T012",
    "name": "微型折叠侦察无人机",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 35,
    "discountable": true,
    "desc": "远程探路、携带轻量阵符或标记物，续航 20 分钟且易被击落",
    "tags": [
      "科技装备",
      "阵法",
      "侦察",
      "黑客",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T013",
    "name": "便携化学发光信标（十支）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜耗材",
    "price": 5,
    "discountable": false,
    "desc": "无电子信号的物理路标，专用于鬼域与电磁失效区",
    "tags": [
      "科技装备",
      "破甲",
      "电磁",
      "黑客",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "T014",
    "name": "液氮速冻喷罐",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "工业科技｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "脆化金属锁具、临时延缓火焰或低阶生物行动",
    "tags": [
      "科技装备",
      "收容",
      "火焰雷法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "T015",
    "name": "便携便携式除颤与外伤缝合包",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代医疗｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "常规急救稳态，需基础医疗操作技能",
    "tags": [
      "科技装备",
      "医疗",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "T016",
    "name": "法拉第电磁屏蔽袋（三个）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "D",
    "source": "现代科技｜器物",
    "price": 15,
    "discountable": true,
    "desc": "隔绝内部设备信号外泄或阻挡外部远程追踪激活",
    "tags": [
      "科技装备",
      "侦察",
      "破甲",
      "电磁",
      "黑客"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "T017",
    "name": "电磁步枪",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "全球死考｜器物",
    "price": 55,
    "discountable": true,
    "desc": "高初速电磁动能穿甲，需专用电池弹匣，连射发热",
    "tags": [
      "科技装备",
      "破甲",
      "电磁",
      "护盾",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "T018",
    "name": "《沙丘》个人护盾（桌游版）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻｜器物",
    "price": 75,
    "discountable": true,
    "desc": "拦截高速动能火力，允许慢速近战穿透；遇激光类武器有爆炸风险",
    "tags": [
      "科技装备",
      "结界",
      "破甲",
      "火焰雷法",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "T019",
    "name": "便携声波驱散器",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻｜器物",
    "price": 55,
    "discountable": true,
    "desc": "定向次声波／超声波打断生物扑杀、克制特定生物机甲内部弱点",
    "tags": [
      "科技装备",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "T020",
    "name": "光学迷彩斗篷（低阶）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "赛博科幻｜器物",
    "price": 80,
    "discountable": true,
    "desc": "静止或缓行时近乎隐形，高速移动会出现明显轮廓波纹",
    "tags": [
      "科技装备",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T021",
    "name": "外骨骼助力腿甲",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻｜器物",
    "price": 70,
    "discountable": true,
    "desc": "负重翻倍、便于背负重伤队友高速撤离，依赖电力续航",
    "tags": [
      "科技装备",
      "电磁",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T022",
    "name": "灵能黑客便携终端",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻灵能｜器物",
    "price": 85,
    "discountable": true,
    "desc": "许檀向核心装备：远程入侵设施主机、改写敌方炮台识别码",
    "tags": [
      "科技装备",
      "黑客",
      "爆发"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 3,
      "wil": 1,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "T023",
    "name": "布阵无人机编队（三机）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻衍生｜器物",
    "price": 85,
    "discountable": true,
    "desc": "携符箓阵盘或空间标记同步飞赴预设点，大幅缩短布阵时间",
    "tags": [
      "科技装备",
      "阵法",
      "黑客",
      "规则",
      "空间"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "T024",
    "name": "遮音隔热隐蔽紧身衣",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻特工｜器物",
    "price": 65,
    "discountable": true,
    "desc": "抹除红外热源与脚步声，配合隐身装备构成多通道潜行",
    "tags": [
      "科技装备",
      "隐蔽"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "mobility"
    }
  },
  {
    "id": "T025",
    "name": "高能等离子切割枪",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻工程｜器物",
    "price": 60,
    "discountable": true,
    "desc": "快速切开合金舱门与重型锁具，近战射程极短",
    "tags": [
      "科技装备",
      "破甲",
      "收容"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T026",
    "name": "微型定向力场盾（腕载）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻｜器物",
    "price": 75,
    "discountable": true,
    "desc": "瞬发半米宽能量圆盾硬挡步枪与流弹，能量耗尽需充能",
    "tags": [
      "科技装备",
      "结界",
      "破甲",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "T027",
    "name": "肾上腺素超频注射器（三支）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻医疗｜耗材",
    "price": 50,
    "discountable": true,
    "desc": "30 秒内无视疼痛、大幅提升反应与移速，药效后严重虚脱",
    "tags": [
      "科技装备",
      "医疗",
      "位移",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 0,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "mobility"
    }
  },
  {
    "id": "T028",
    "name": "纳米止血喷雾（三罐）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻医疗｜耗材",
    "price": 60,
    "discountable": true,
    "desc": "瞬间封堵动脉大出血与贯穿伤，加速组织粘合",
    "tags": [
      "科技装备",
      "医疗",
      "毒素生化",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "T029",
    "name": "全频段信号干扰器",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "电子战｜器物",
    "price": 65,
    "discountable": true,
    "desc": "阻断半径 50 米内无线通讯与遥控引爆，同时影响己方常规电台",
    "tags": [
      "科技装备",
      "电磁",
      "黑客",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T030",
    "name": "便携式折叠安全舱",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻生存｜器物",
    "price": 80,
    "discountable": true,
    "desc": "展开为 3 人密封合金舱，自带 2 小时供氧，抵御毒气与碎石塌方",
    "tags": [
      "科技装备",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T031",
    "name": "磁力吸附捕获网枪",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻｜器物",
    "price": 60,
    "discountable": true,
    "desc": "发射高张力导电束缚网限制人形或机械目标移动",
    "tags": [
      "科技装备",
      "电磁",
      "收容"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T032",
    "name": "自动警戒微型机枪塔",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "科幻工程｜器物",
    "price": 90,
    "discountable": true,
    "desc": "部署于通道口自动压制追兵，弹药有限且易被重火力摧毁",
    "tags": [
      "科技装备",
      "医疗",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T033",
    "name": "义眼战术辅助模块",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "赛博朋克｜义体",
    "price": 75,
    "discountable": true,
    "desc": "实时标注弹道预测、测距与队友生命体征，需义体兼容",
    "tags": [
      "科技装备",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "T034",
    "name": "工业级热熔炸药包（两套）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "C",
    "source": "现代科技｜耗材",
    "price": 55,
    "discountable": true,
    "desc": "精准定向爆破承重结构或摧毁敌方核心装置",
    "tags": [
      "科技装备",
      "医疗",
      "爆发",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "T035",
    "name": "Ghostbusters 捕获束＋陷阱套件",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "2009 游戏版｜器物",
    "price": 130,
    "discountable": true,
    "desc": "Stasis 固定灵质＋捕获束牵引＋陷阱封存，连射过热",
    "tags": [
      "科技装备"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T036",
    "name": "便携式子弹车（高速载具）",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "全球死考｜器物",
    "price": 140,
    "discountable": true,
    "desc": "折叠收纳、展开为高机动全地形装甲快车，适合大地图长途转场",
    "tags": [
      "科技装备",
      "护盾",
      "位移",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 2,
      "wil": 1,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "mobility"
    }
  },
  {
    "id": "T037",
    "name": "投射屏障发生器（大锤盾）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "《守望先锋》｜器物",
    "price": 160,
    "discountable": true,
    "desc": "展开宽幅硬光屏障护住身后全队推进，承受上限归零后破碎冷却",
    "tags": [
      "科技装备",
      "结界",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "T038",
    "name": "外置战术演算阵列（副脑）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻衍生｜器物",
    "price": 175,
    "discountable": true,
    "desc": "自动解算多方向来袭弹道与阵眼状态，大幅释放玩家并行注意力",
    "tags": [
      "科技装备",
      "阵法",
      "黑客"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 5,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "T039",
    "name": "浮游拦截盾阵（四枚）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻衍生｜器物",
    "price": 185,
    "discountable": true,
    "desc": "环绕指定队友自动拦截流弹与偷袭，每枚独立储能与耐久",
    "tags": [
      "科技装备",
      "阵法",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T040",
    "name": "微型重力井发生器",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻衍生｜器物",
    "price": 165,
    "discountable": true,
    "desc": "掷地后半径 8 米重力倍增，强行拖慢高速突进与飞行目标",
    "tags": [
      "科技装备",
      "空间",
      "位移"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 2,
      "wil": 1,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "mobility"
    }
  },
  {
    "id": "T041",
    "name": "光剑（标准晶核）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "《星球大战》｜器物",
    "price": 150,
    "discountable": true,
    "desc": "极高切割力与偏转能量束载体，无原力训练极易误伤自身",
    "tags": [
      "科技装备",
      "剑修"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T042",
    "name": "赛博斯安威斯坦（神经加速）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "赛博朋克｜义体",
    "price": 190,
    "discountable": true,
    "desc": "主动触发 5 秒极速反应与行动窗口，高频使用会引发神经灼伤与赛博精神病",
    "tags": [
      "科技装备",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "mobility"
    }
  },
  {
    "id": "T043",
    "name": "高能等离子步枪",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻｜器物",
    "price": 155,
    "discountable": true,
    "desc": "主 C 向高温破甲武器，对重装甲与生化躯体杀伤极强",
    "tags": [
      "科技装备",
      "破甲",
      "毒素生化",
      "护盾"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "T044",
    "name": "便携纳米医疗无人机",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻医疗｜器物",
    "price": 170,
    "discountable": true,
    "desc": "医疗向装备：自动巡航为受伤队友注射纳米修复液并监测生命体征",
    "tags": [
      "科技装备",
      "黑客",
      "医疗",
      "毒素生化",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "T045",
    "name": "量子加密短讯对讲机（双机）",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "全球死考｜器物",
    "price": 180,
    "discountable": true,
    "desc": "跨远距甚至特殊干扰区实现零延迟基础信息传递，需认证配对",
    "tags": [
      "科技装备",
      "电磁",
      "黑客",
      "团队",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T046",
    "name": "全息诱饵投射器",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻｜器物",
    "price": 130,
    "discountable": true,
    "desc": "生成含模拟热源与声纹的逼真队友假象，骗出敌方关键先手",
    "tags": [
      "科技装备",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T047",
    "name": "相位护盾发生器（单人）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻衍生｜器物",
    "price": 165,
    "discountable": true,
    "desc": "高规格能量护盾，可吸收实体冲击与常规射线，充能期脆弱",
    "tags": [
      "科技装备",
      "结界",
      "护盾",
      "爆发"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "T048",
    "name": "重型动力外骨骼装甲",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻｜器物",
    "price": 210,
    "discountable": true,
    "desc": "全身密闭供氧、抗冲击与力量倍增，机动灵活性略降",
    "tags": [
      "科技装备",
      "护盾",
      "爆发"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "T049",
    "name": "反物质微型电池组",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻｜耗材",
    "price": 145,
    "discountable": true,
    "desc": "为高能耗科技装备或大型阵法提供巨额瞬时供电，破损会剧烈爆炸",
    "tags": [
      "科技装备",
      "阵法",
      "电磁",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "T050",
    "name": "电磁轨道狙击枪",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻｜器物",
    "price": 195,
    "discountable": true,
    "desc": "超远程穿甲点杀与破坏敌方核心装置，后坐力与蓄能声响大",
    "tags": [
      "科技装备",
      "破甲",
      "电磁",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "T051",
    "name": "声学与激光窃听破译仪",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "间谍科技｜器物",
    "price": 120,
    "discountable": true,
    "desc": "隔墙还原谈话与破解高阶加密协议，情报战利器",
    "tags": [
      "科技装备",
      "破甲",
      "黑客"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 5,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "T052",
    "name": "便携式低温休眠急救袋",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "科幻医疗｜器物",
    "price": 155,
    "discountable": true,
    "desc": "将重伤濒死队友迅速降温休眠锁住生命体征，保命带回空间",
    "tags": [
      "科技装备",
      "医疗",
      "收容",
      "空间",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "T053",
    "name": "高能云爆手雷（两枚）",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "全球死考｜耗材",
    "price": 160,
    "discountable": true,
    "desc": "狭小封闭空间内产生毁灭性超压与缺氧冲击，极易误伤己方",
    "tags": [
      "科技装备",
      "电磁",
      "空间",
      "火焰雷法",
      "爆发"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 11,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "T054",
    "name": "全地形微型工程拆弹机器人",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "B",
    "source": "现代科技｜器物",
    "price": 140,
    "discountable": true,
    "desc": "替代人员进入高辐射、高毒或未知模因区执行物理操作",
    "tags": [
      "科技装备",
      "抗模因",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 2,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "T055",
    "name": "A+ 级机械核心（可融合）",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "全球死考｜核心材料",
    "price": 360,
    "discountable": true,
    "desc": "极高能源供给与机械重构核心，可定向融合其他能力实现补能质变",
    "tags": [
      "科技装备",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T056",
    "name": "重力喷涌发射器（查莉娅版）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "《守望先锋》｜器物",
    "price": 320,
    "discountable": true,
    "desc": "制造 4 秒微型奇点将区域内敌人强行聚拢控死，为主 C 创造完美爆发窗",
    "tags": [
      "科技装备",
      "空间",
      "爆发"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T057",
    "name": "星际相位棱镜（缩略部署型）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "《星际争霸》｜器物",
    "price": 350,
    "discountable": true,
    "desc": "展开能量场支撑科技阵地并短距折跃接应 1–2 名队友，本体脆弱",
    "tags": [
      "科技装备",
      "阵法",
      "空间",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T058",
    "name": "便携式能量护盾穹顶（展开要塞）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻衍生｜器物",
    "price": 340,
    "discountable": true,
    "desc": "展开直径 15 米的半球形高强护盾保护全队与设施，需核心供能与散热",
    "tags": [
      "科技装备",
      "结界",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 2,
      "obs": 2,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "T059",
    "name": "铁幕发生器（单单位授权）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "《红色警戒》｜器物",
    "price": 330,
    "discountable": true,
    "desc": "令 1 台机械载具或重装机甲 10 秒内绝对无敌，对无护甲肉体致命",
    "tags": [
      "科技装备",
      "护盾",
      "位移"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 5,
      "obs": 3,
      "wil": 2,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "mobility"
    }
  },
  {
    "id": "T060",
    "name": "粒子洪流护臂（受限）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻｜器物",
    "price": 350,
    "discountable": true,
    "desc": "主 C 向持续高能光束破防武器，连射极快过热",
    "tags": [
      "科技装备"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T061",
    "name": "微型曲率跃迁腰带（限 3 次）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "硬科幻｜器物",
    "price": 340,
    "discountable": true,
    "desc": "瞬间折跃百米脱离合围，落点存在微米级误差，禁止盲穿实体墙",
    "tags": [
      "科技装备",
      "空间"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 6,
      "obs": 3,
      "wil": 2,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "mobility"
    }
  },
  {
    "id": "T062",
    "name": "纳米集群重构医疗舱（折叠）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻医疗｜器物",
    "price": 370,
    "discountable": true,
    "desc": "战地快速重塑断裂骨骼与严重脏器损伤，耗材昂贵且需 3 分钟静置",
    "tags": [
      "科技装备",
      "毒素生化",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T063",
    "name": "量子态隐身力场",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "硬科幻｜器物",
    "price": 330,
    "discountable": true,
    "desc": "同步隔绝可见光、红外、雷达与常规声波侦测，攻击或施法即破隐",
    "tags": [
      "科技装备",
      "结界",
      "隐蔽",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T064",
    "name": "A.T.力场发生器（试验适配型）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "EVA 衍生｜器物",
    "price": 380,
    "discountable": true,
    "desc": "展开八角形高强度绝对隔离壁硬抗重炮，极度依赖适格同步率与精神耐力",
    "tags": [
      "科技装备",
      "结界",
      "抗模因",
      "爆发"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 5,
      "obs": 1,
      "wil": 4,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "T065",
    "name": "反重力悬浮剑台／无人机母巢",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻衍生｜器物",
    "price": 310,
    "discountable": true,
    "desc": "携带 12 架微型浮游单元协同布阵、构筑立体拦截网与弹道偏转",
    "tags": [
      "科技装备",
      "剑修",
      "阵法",
      "黑客",
      "空间"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T066",
    "name": "空间折返信标（单次召回）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻｜耗材",
    "price": 300,
    "discountable": true,
    "desc": "将携带配对信标的 1 名队友在 1 秒内强行拉回发信器旁，受强空间封锁阻断",
    "tags": [
      "科技装备",
      "收容",
      "空间",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "T067",
    "name": "高阶人工智能战术副官（离线核）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻｜器物",
    "price": 340,
    "discountable": true,
    "desc": "实时分析敌方行动模式、推演撤离最优解并接管常规防御自动化",
    "tags": [
      "科技装备",
      "结界"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T068",
    "name": "热力学熵减冻结枪",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "硬科幻｜器物",
    "price": 320,
    "discountable": true,
    "desc": "瞬时抽取目标区域热能，将高速冲锋敌方或爆炸临界装置冻住数秒",
    "tags": [
      "科技装备"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 6,
      "obs": 2,
      "wil": 2,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "T069",
    "name": "跨频道量子黑客侵入针",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "科幻｜耗材",
    "price": 290,
    "discountable": true,
    "desc": "物理刺入敌方高科技机甲或基地中枢，强行夺取 30 秒控制权",
    "tags": [
      "科技装备",
      "黑客",
      "护盾",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 4,
      "wil": 1,
      "energy": 20
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "T070",
    "name": "生物机甲外壳（三阶初试作）",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "A",
    "source": "全球死考｜器物",
    "price": 390,
    "discountable": true,
    "desc": "仿照回声恶魔原理打造的外覆式生物装甲，大幅提升抗伤与爆发，内部惧超声",
    "tags": [
      "科技装备",
      "护盾",
      "爆发",
      "原著"
    ],
    "powerDelta": {
      "phy": 5,
      "agi": 2,
      "obs": 2,
      "wil": 5,
      "energy": 45
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "T071",
    "name": "Limbo 裂隙战甲（受限试验型）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "《Warframe》｜器物",
    "price": 580,
    "discountable": true,
    "desc": "展开限时 Cataclysm 裂隙区与 Stasis 冻结，分离伤员与追兵，高额维护供能",
    "tags": [
      "科技装备",
      "护盾"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 7,
      "energy": 70
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "T072",
    "name": "零号方舟·折叠防线核心（一次性）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "本作科幻衍生｜一次性",
    "price": 540,
    "discountable": true,
    "desc": "瞬时展开覆盖 50 米的复合力场要塞：硬接毁灭级主炮并锁死敌方增援 10 秒，用后熔毁",
    "tags": [
      "科技装备",
      "结界",
      "收容",
      "爆发",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "T073",
    "name": "局部时间泡发生器（5 秒）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "硬科幻｜限 2 次",
    "price": 560,
    "discountable": true,
    "desc": "将半径 15 米内流速减缓至外界的 1/20，或加速己方行动，极易引发物理过载",
    "tags": [
      "科技装备",
      "规则"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 10,
      "obs": 4,
      "wil": 3,
      "energy": 70
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "mobility"
    }
  },
  {
    "id": "T074",
    "name": "微型反物质湮灭弹",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "硬科幻｜一次性",
    "price": 550,
    "discountable": true,
    "desc": "纯攻坚终局核弹级底牌，无差别湮灭半径百米内一切常规物质，慎防波及全队",
    "tags": [
      "科技装备",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "T075",
    "name": "《信条》局部熵逆转旋转门（便携一次性）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "影视硬科幻｜一次性",
    "price": 580,
    "discountable": true,
    "desc": "令 1 名角色或关键设备进入 10 秒逆熵态回溯伤势或拆解必杀，严防接触正熵自身",
    "tags": [
      "科技装备",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "T076",
    "name": "空间折叠放逐炮（单发）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "硬科幻｜一次性",
    "price": 520,
    "discountable": true,
    "desc": "不杀伤而强行将目标撕入亚空间放逐 60 秒，为全队赢得完成任务或撤离窗口",
    "tags": [
      "科技装备",
      "空间",
      "爆发",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "T077",
    "name": "全域绝对静默塔（一次性）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "科幻电子战｜一次性",
    "price": 480,
    "discountable": true,
    "desc": "半径 500 米内彻底瘫痪一切电子、光学与能量回路 30 秒（敌我无差别）",
    "tags": [
      "科技装备",
      "电磁",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "T078",
    "name": "星舰级偏导护盾发生核（过载版）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "太空歌剧｜一次性",
    "price": 540,
    "discountable": true,
    "desc": "强行偏转一次足以夷平街区的定向轨道打击，开启 5 秒后核心彻底烧毁",
    "tags": [
      "科技装备",
      "结界",
      "护盾",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "defense"
    }
  },
  {
    "id": "T079",
    "name": "意识上传急救黑匣（单次备份）",
    "canon": false,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "硬科幻｜一次性",
    "price": 500,
    "discountable": true,
    "desc": "肉身彻底毁灭瞬间保存完整记忆与意识数据，带回空间另行花巨资重塑躯体（需确认人格连续性）",
    "tags": [
      "科技装备",
      "黑客",
      "医疗",
      "抗模因",
      "空间"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "support"
    }
  },
  {
    "id": "T080",
    "name": "微型戴森光束引导器（一次性）",
    "canon": true,
    "category": "tech",
    "categoryLabel": "科幻与赛博工程",
    "tier": "S",
    "source": "全球死考衍生｜一次性",
    "price": 560,
    "discountable": true,
    "desc": "借考场恒星或强光源折射出致盲与高能诱导光束，改写超大规模战场走向",
    "tags": [
      "科技装备",
      "耗材",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "科技",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A001",
    "name": "墨斗线／糯米套件",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "《僵尸先生》｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "封门、限位、验明特定尸类规则实体，对模因与热成像无效",
    "tags": [
      "异常灵异",
      "收容",
      "抗模因",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A002",
    "name": "便携黄金小匣",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "《神秘复苏》｜器物",
    "price": 30,
    "discountable": true,
    "desc": "封闭收容小型灵异媒介，隔绝灵异渗透，仅具普通金属物理强度",
    "tags": [
      "异常灵异",
      "医疗",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 0
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A003",
    "name": "信息隔离与模因辨识手册",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "SCP 设定参考｜知识",
    "price": 20,
    "discountable": true,
    "desc": "区分视觉／听觉／语义传播通道，建立低信息回报与防交叉感染流程",
    "tags": [
      "异常灵异",
      "结界",
      "侦察",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "A004",
    "name": "老式无网拍立得与机械表",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "灵异生存｜器物",
    "price": 15,
    "discountable": true,
    "desc": "规避电子信号篡改与数字模因污染，检验时间错乱与影像异常",
    "tags": [
      "异常灵异",
      "电磁",
      "黑客",
      "抗模因",
      "规则"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "A005",
    "name": "朱砂黑狗血喷雾",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "东方民俗｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "显形低阶隐形阴灵、逼退附身游魂，对高阶规则鬼物无效",
    "tags": [
      "异常灵异",
      "隐蔽",
      "规则",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "A006",
    "name": "护身银十字架与驱魔鉴别录",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "欧美驱魔传统｜器物＋知识",
    "price": 25,
    "discountable": true,
    "desc": "先鉴别疾病、精神错乱与真实附体，再执行基础安抚与驱离",
    "tags": [
      "异常灵异",
      "抗模因",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "A007",
    "name": "粗制防认知涂黑目镜",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "异常模因｜器物",
    "price": 25,
    "discountable": true,
    "desc": "强行降低视觉分辨率并滤除文字细节，以牺牲视野换取规避图文模因",
    "tags": [
      "异常灵异",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "defense"
    }
  },
  {
    "id": "A008",
    "name": "一次性工业降噪耳塞（抗声模因）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "异常模因｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "物理隔绝低阶诱导低语与听觉污染，同时丧失队友口头预警",
    "tags": [
      "异常灵异",
      "侦察",
      "抗模因",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "A009",
    "name": "灵异体温与阴气试纸（十片）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "现代灵异｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "接触环境快速变色预警异常降温与鬼域边缘，不具主动防御",
    "tags": [
      "异常灵异",
      "结界",
      "侦察",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 0,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "A010",
    "name": "纯金丝手套（一副）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "《神秘复苏》衍生｜器物",
    "price": 35,
    "discountable": true,
    "desc": "允许安全触碰低阶灵异媒介而不直接触发皮肤接触杀人规则",
    "tags": [
      "异常灵异",
      "医疗",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "A011",
    "name": "基础记忆删除剂（A 级微量喷雾）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "SCP｜耗材",
    "price": 35,
    "discountable": true,
    "desc": "抹除目标最近 5 分钟记忆以切断刚接触的记忆型模因，易致短暂失忆眩晕",
    "tags": [
      "异常灵异",
      "抗模因",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 0,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "A012",
    "name": "白蜡烛（引鬼探测用）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "《神秘复苏》衍化｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "点燃可刻意吸引附近游荡低阶鬼物以测试触发规律，极度危险",
    "tags": [
      "异常灵异",
      "侦察",
      "医疗",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 0,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "A013",
    "name": "铜铃警报线（三卷）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "东方灵异｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "拉设于营地外围，有灵体或隐形生物越界即自鸣示警",
    "tags": [
      "异常灵异",
      "隐蔽",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A014",
    "name": "简易精神锚点怀表",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "D",
    "source": "异常模因｜器物",
    "price": 30,
    "discountable": true,
    "desc": "预设个人真实记忆暗号，协助在幻境与记忆篡改中校验自身认知",
    "tags": [
      "异常灵异",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "defense"
    }
  },
  {
    "id": "A015",
    "name": "鬼发圈",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "全球死考｜特殊遗物",
    "price": 85,
    "discountable": true,
    "desc": "特定灵异触发型遗物，具束缚与异常互动特性",
    "tags": [
      "异常灵异",
      "收容",
      "灵异",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A016",
    "name": "标准黄金收容器（箱型）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《神秘复苏》｜器物",
    "price": 70,
    "discountable": true,
    "desc": "封闭收容已被压制的灵异实体，封闭时无法内外传感与供能",
    "tags": [
      "异常灵异",
      "医疗",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A017",
    "name": "半截红色鬼烛",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《神秘复苏》｜耗材",
    "price": 60,
    "discountable": true,
    "desc": "点燃后烛光内抵御匹配鬼物袭击；燃烧速度随威胁剧烈波动",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 5,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "A018",
    "name": "恶魔陷阱便携阵布",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《邪恶力量》｜器物",
    "price": 45,
    "discountable": true,
    "desc": "预设环形符阵，诱入匹配恶魔／附体目标即锁死行动，破线即失效",
    "tags": [
      "异常灵异",
      "阵法",
      "收容",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A019",
    "name": "SCP-714 疲惫玉戒",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "SCP｜器物",
    "price": 70,
    "discountable": true,
    "desc": "抵抗部分即时精神／模因影响，佩戴期间行动思维大幅迟缓并昏睡",
    "tags": [
      "异常灵异",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "A020",
    "name": "观众魔药（序列 9 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《诡秘之主》｜魔药",
    "price": 80,
    "discountable": true,
    "desc": "极强微表情洞察、情绪观察与保持旁观冷静，保留消化与失控风险",
    "tags": [
      "异常灵异",
      "侦察",
      "医疗",
      "灵异",
      "赌命"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 3,
      "wil": 1,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "A021",
    "name": "学徒魔药（序列 9 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《诡秘之主》｜魔药",
    "price": 85,
    "discountable": true,
    "desc": "穿门过墙、辨识封锁漏洞与绝境寻生路，极易迷失于异常空间",
    "tags": [
      "异常灵异",
      "侦察",
      "医疗",
      "收容",
      "空间"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 1,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "A022",
    "name": "偷盗者魔药（序列 9 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《诡秘之主》｜魔药",
    "price": 80,
    "discountable": true,
    "desc": "极其灵巧的顺手牵羊、隐匿与机关破解，克制依赖随身物品的敌人",
    "tags": [
      "异常灵异",
      "隐蔽",
      "黑客",
      "医疗",
      "灵异"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 2,
      "obs": 2,
      "wil": 1,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "A023",
    "name": "记忆强化抗遗忘药剂（两支）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "SCP 逆模因｜耗材",
    "price": 75,
    "discountable": true,
    "desc": "15 分钟内强行记住逆模因异常而不被抹除感知，药效后剧烈头痛",
    "tags": [
      "异常灵异",
      "医疗",
      "抗模因",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A024",
    "name": "便携认知过滤护目镜",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "SCP 衍生｜器物",
    "price": 85,
    "discountable": true,
    "desc": "内置脱敏算法将危险模因图像实时打码转译为安全几何轮廓，惧 EMP",
    "tags": [
      "异常灵异",
      "电磁",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A025",
    "name": "裹尸布（低阶灵异隔离布）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《神秘复苏》衍生｜器物",
    "price": 80,
    "discountable": true,
    "desc": "罩住失控媒介或低阶鬼物暂时阻断其杀人规律触发，不可持久",
    "tags": [
      "异常灵异",
      "结界",
      "医疗",
      "灵异",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "A026",
    "name": "替死鬼瓷（裂纹次品）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《神秘复苏》衍生｜耗材",
    "price": 95,
    "discountable": true,
    "desc": "滴血绑定后可代承一次中低阶灵异必死袭击，触发即彻底碎裂",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A027",
    "name": "《黑猫》镇魂铜铃",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "现代灵异｜器物",
    "price": 65,
    "discountable": true,
    "desc": "摇响强行唤醒被拉入梦境、幻觉或鬼打墙中的队友",
    "tags": [
      "异常灵异",
      "抗模因",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "support"
    }
  },
  {
    "id": "A028",
    "name": "招魂香（三支）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "东方灵异｜耗材",
    "price": 55,
    "discountable": true,
    "desc": "引出死亡不久者的残留执念获取最后线索，易招来周围游魂围观",
    "tags": [
      "异常灵异",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "A029",
    "name": "纯金弹头特制左轮",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "《神秘复苏》衍生｜器物",
    "price": 75,
    "discountable": true,
    "desc": "物理压制并击退具备实体的低中阶灵异，仅靠黄金物理打断而非消灭",
    "tags": [
      "异常灵异",
      "医疗",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A030",
    "name": "负情绪吸收水晶（封印物雏形）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "C",
    "source": "异常装备｜器物",
    "price": 70,
    "discountable": true,
    "desc": "吸收全队恐惧与疯狂情绪防崩盘，蓄满后若不泄放会反过来引爆狂躁",
    "tags": [
      "异常灵异",
      "收容",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A031",
    "name": "完整红色鬼烛",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《神秘复苏》｜耗材",
    "price": 110,
    "discountable": true,
    "desc": "较长窗口的对鬼避险灯火，遇极高阶厉鬼仍会急速燃尽",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "火焰雷法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "defense"
    }
  },
  {
    "id": "A032",
    "name": "读心者／心理医生（序列 8–7 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《诡秘之主》｜魔药",
    "price": 160,
    "discountable": true,
    "desc": "安抚失控边缘队友、情绪引导与识别拟态异常；擅读队友内心损关系",
    "tags": [
      "异常灵异",
      "隐蔽",
      "医疗",
      "灵异",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A033",
    "name": "戏法大师（学徒序列 8 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《诡秘之主》｜魔药",
    "price": 155,
    "discountable": true,
    "desc": "丰富的小型控场戏法（闪光、滑冰、迷雾、翻滚）与逃生专精",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A034",
    "name": "律师／野蛮人（黑皇帝序列 9–8 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《诡秘之主》｜魔药",
    "price": 165,
    "discountable": true,
    "desc": "敏锐捕捉规则漏洞并加以利用，克制严苛条款型考题与契约敌人",
    "tags": [
      "异常灵异",
      "医疗",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A035",
    "name": "大型黄金衬层收容箱",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《神秘复苏》｜器物",
    "price": 150,
    "discountable": true,
    "desc": "内衬加厚黄金、外覆高强度合金，可收容重型狂暴灵异并承受撞击",
    "tags": [
      "异常灵异",
      "医疗",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A036",
    "name": "鬼邮局信纸（一次性通联）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "现代灵异衍生｜耗材",
    "price": 140,
    "discountable": true,
    "desc": "绕过鬼域隔绝向指定活人投递一条关键情报或小件媒介",
    "tags": [
      "异常灵异",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A037",
    "name": "便携逆模因遮蔽器（单人）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "SCP 逆模因｜器物",
    "price": 175,
    "discountable": true,
    "desc": "开启 15 秒令自身难以被敌方主动注意与锁定，攻击即解除且有长冷却",
    "tags": [
      "异常灵异",
      "隐蔽",
      "收容",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A038",
    "name": "《控制 Control》HRA 共鸣器（仿制）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "异常科幻｜器物",
    "price": 165,
    "discountable": true,
    "desc": "持续发射个人共振频段，显著抵御声波／频率类精神侵入与同化",
    "tags": [
      "异常灵异",
      "抗模因"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A039",
    "name": "替死鬼瓷（完好）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《神秘复苏》衍生｜耗材",
    "price": 190,
    "discountable": true,
    "desc": "代承一次中阶灵异必死规律袭击，触发即碎，无法阻挡物理轰杀",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "burst"
    }
  },
  {
    "id": "A040",
    "name": "鬼剪刀（仿制残刃）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "《神秘复苏》衍生｜器物",
    "price": 185,
    "discountable": true,
    "desc": "剪断 1 条附着于队友身上的低中阶诅咒连线，使用时须承受诅咒反噬",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "赌命",
      "团队"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 2,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 28,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "A041",
    "name": "捕灵网（可控便携版）",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "全球死考｜器物",
    "price": 170,
    "discountable": true,
    "desc": "展开静电／灵能封锁网隔离鬼物通路，需持续供电且存在能量开口弱点",
    "tags": [
      "异常灵异",
      "结界",
      "电磁",
      "收容",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A042",
    "name": "人皮灯笼（低阶鬼域破雾）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "东方灵异｜器物",
    "price": 145,
    "discountable": true,
    "desc": "提灯在鬼打墙与迷雾中照出真实出口方向，灯油耗尽会反引厉鬼",
    "tags": [
      "异常灵异",
      "灵异"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A043",
    "name": "假死电极诱导仪（酆都同款）",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "全球死考｜器物",
    "price": 130,
    "discountable": true,
    "desc": "诱发可控假死令灵魂离体探查特殊灵界（入境后肉身强化通常失效），需专人看护肉身",
    "tags": [
      "异常灵异",
      "电磁",
      "灵异",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A044",
    "name": "安神定魂香炉（团队）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "东方灵异｜器物",
    "price": 135,
    "discountable": true,
    "desc": "休整与布阵时点燃，稳定全队理智并缓慢清除轻度精神污染",
    "tags": [
      "异常灵异",
      "阵法",
      "抗模因",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A045",
    "name": "真理之镜（审讯与测谎）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "异常装备｜器物",
    "price": 150,
    "discountable": true,
    "desc": "照出低中阶拟态者的真实轮廓，对高阶概念伪装仅起轻微波动",
    "tags": [
      "异常灵异",
      "隐蔽",
      "规则"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 4,
      "wil": 2,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "recon"
    }
  },
  {
    "id": "A046",
    "name": "诅咒转移绷带（两卷）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "B",
    "source": "现代灵异｜耗材",
    "price": 140,
    "discountable": true,
    "desc": "将缠绕于队友伤口的灵异侵蚀暂时吸附至绷带，随后必须封入黄金匣",
    "tags": [
      "异常灵异",
      "收容",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "A047",
    "name": "永恒书页（第一封印）",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "全球死考｜特殊器物",
    "price": 360,
    "discountable": true,
    "desc": "灵魂绑定；「光影」按熟悉度与样本模拟所见人物练战，高精神消耗、死亡体验真实",
    "tags": [
      "异常灵异",
      "收容",
      "抗模因",
      "灵异",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 6,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A048",
    "name": "应雷戒／怨匣",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "全球死考｜特殊器物",
    "price": 310,
    "discountable": true,
    "desc": "吸纳雷霆／怨力并作高阶交互媒介，蕴含未知反噬风险",
    "tags": [
      "异常灵异",
      "电磁",
      "火焰雷法",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 42,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "A049",
    "name": "问答之书",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "全球死考｜特殊器物",
    "price": 340,
    "discountable": true,
    "desc": "支付对应代价换取高价值世界真相，顶级机密仍受权限拦截",
    "tags": [
      "异常灵异",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 6,
      "wil": 3,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "recon"
    }
  },
  {
    "id": "A050",
    "name": "《康斯坦丁》收魔镜",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "电影（2005）｜器物",
    "price": 280,
    "discountable": true,
    "desc": "配合控场将宿主内附着物抽出封入镜中，镜碎则逃逸，限匹配附体目标",
    "tags": [
      "异常灵异",
      "电磁"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A051",
    "name": "便携现实稳定锚（SRA 残次版）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "SCP｜器物",
    "price": 350,
    "discountable": true,
    "desc": "半径 15 米强行稳定休谟指数 30 秒，压制现实扭曲与异常规则，用后过热大修",
    "tags": [
      "异常灵异",
      "抗模因",
      "规则"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 6,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A052",
    "name": "黄金棺材（大型终极收容）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "《神秘复苏》｜器物",
    "price": 310,
    "discountable": true,
    "desc": "封存极高危厉鬼或失控核心，极重需团队搬运或空间袋配合",
    "tags": [
      "异常灵异",
      "医疗",
      "收容",
      "空间",
      "灵异"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A053",
    "name": "替死娃娃（高阶规则代死）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "《神秘复苏》衍生｜耗材",
    "price": 340,
    "discountable": true,
    "desc": "代承一次高阶即死规则袭击（触发后娃娃瞬间腐烂成灰）",
    "tags": [
      "异常灵异",
      "医疗",
      "规则",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A054",
    "name": "鬼画残片（单次隔离避难）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "现代灵异衍生｜耗材",
    "price": 360,
    "discountable": true,
    "desc": "将全队拉入画中鬼域避开外界毁灭 10 秒，超时将被画中异物同化",
    "tags": [
      "异常灵异",
      "结界",
      "灵异",
      "爆发",
      "团队"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 2,
      "obs": 1,
      "wil": 1,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 16,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "A055",
    "name": "贿赂者／腐化男爵（序列 7–6 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "《诡秘之主》｜魔药",
    "price": 350,
    "discountable": true,
    "desc": "扭曲敌方攻击意图、弱化敌方防御并放大己方优势，极度依赖规则博弈",
    "tags": [
      "异常灵异",
      "结界",
      "医疗",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A056",
    "name": "记录官（学徒序列 6 候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "《诡秘之主》｜魔药",
    "price": 360,
    "discountable": true,
    "desc": "记录并复现见过的数项高阶超凡能力（含队友或敌人），次数有限且受位格压制",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A057",
    "name": "盗火人／窃梦家（偷盗者高阶候选）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "《诡秘之主》｜魔药",
    "price": 370,
    "discountable": true,
    "desc": "短暂窃取敌方一项正在发动的能力或距离，失败将遭反噬",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "火焰雷法",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 42,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "A058",
    "name": "W 级记忆强化剂（全队套装）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "SCP 逆模因｜耗材",
    "price": 300,
    "discountable": true,
    "desc": "全队 1 小时内彻底免疫低中阶逆模因遗忘，允许正面围猎信息隐形怪物",
    "tags": [
      "异常灵异",
      "隐蔽",
      "抗模因",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A059",
    "name": "反模因信息防火墙（便携服务器）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "异常模因｜器物",
    "price": 330,
    "discountable": false,
    "desc": "阻断考场内模因经由通讯网络与监控画面的二次广播扩散",
    "tags": [
      "异常灵异",
      "抗模因",
      "火焰雷法",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "support"
    }
  },
  {
    "id": "A060",
    "name": "鬼香（一次性压制）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "《神秘复苏》衍生｜耗材",
    "price": 320,
    "discountable": true,
    "desc": "点燃后令周围强敌与厉鬼陷入 15 秒沉睡压制，严禁吸入烟雾",
    "tags": [
      "异常灵异",
      "医疗",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 20
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "A061",
    "name": "特殊场景强退物／酆都钥匙（参考）",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "A",
    "source": "全球死考｜特殊遗物",
    "price": 380,
    "discountable": false,
    "desc": "极少数离开者或特殊考场遗留的规则钥匙，具备改写进出场条件之效",
    "tags": [
      "异常灵异",
      "规则",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A062",
    "name": "灵棺",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "全球死考（李天阳）｜技能／器物",
    "price": 520,
    "discountable": true,
    "desc": "强力封印、吸收异常能量、强行打断高阶厉鬼杀人动作；超载时灵棺崩裂反噬自身",
    "tags": [
      "异常灵异",
      "收容",
      "灵异",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 7,
      "energy": 70
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 62,
      "cooldown": 6,
      "role": "control"
    }
  },
  {
    "id": "A063",
    "name": "逆转阴阳",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "全球死考（李天阳）｜高代价技",
    "price": 520,
    "discountable": true,
    "desc": "以巨大自身代价强行扭转局势、弥补阶位鸿沟",
    "tags": [
      "异常灵异",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 7,
      "energy": 70
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "A064",
    "name": "不朽之罪（第一罪·标杆）",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "全球死考｜禁忌级",
    "price": 620,
    "discountable": false,
    "desc": "吞噬物质修复生命精神、形成粒子洪流，附带无法自停、物质永久缺失与未知注视",
    "tags": [
      "异常灵异",
      "医疗",
      "抗模因",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 5,
      "wil": 10,
      "energy": 70
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "support"
    }
  },
  {
    "id": "A065",
    "name": "死机棺材钉（仿制一次性）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "《神秘复苏》衍生｜一次性",
    "price": 580,
    "discountable": true,
    "desc": "钉入实体厉鬼或规则核心，强行令其彻底沉寂 60 秒为主 C 或收容创窗；用后锈蚀",
    "tags": [
      "异常灵异",
      "医疗",
      "收容",
      "规则",
      "灵异"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A066",
    "name": "大型斯克兰顿稳定锚（过载一次性）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "SCP｜一次性",
    "price": 540,
    "discountable": true,
    "desc": "半径 80 米强行把一切超自然规则与现实扭曲压回纯物理基准 15 秒，随后熔毁",
    "tags": [
      "异常灵异",
      "规则",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 5,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A067",
    "name": "逆模因自毁炸弹（信息抹除）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "SCP 逆模因｜一次性",
    "price": 550,
    "discountable": true,
    "desc": "彻底销毁一片区域内所有已暴露的模因传播链与载体记忆，同时抹除施术者当日记忆",
    "tags": [
      "异常灵异",
      "抗模因",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "A068",
    "name": "奇迹师许愿签（单次微愿）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "《诡秘之主》衍生｜一次性",
    "price": 580,
    "discountable": true,
    "desc": "兑现一次符合逻辑边界的小规模“奇迹”（如令崩塌的撤离通道强行撑住 10 秒）",
    "tags": [
      "异常灵异",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "A069",
    "name": "秩序崩塌律令（一次性黑皇帝牌）",
    "canon": false,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "《诡秘之主》衍生｜一次性",
    "price": 540,
    "discountable": true,
    "desc": "强行宣布“此地禁止复活／禁止增援／禁止瞬移”之一生效 10 秒，严苛反噬",
    "tags": [
      "异常灵异",
      "规则",
      "空间",
      "灵异",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "support"
    }
  },
  {
    "id": "A070",
    "name": "还魂珠碎片（单次保魂）",
    "canon": true,
    "category": "anomaly",
    "categoryLabel": "现代灵异与异常模因",
    "tier": "S",
    "source": "全球死考衍生｜一次性",
    "price": 600,
    "discountable": true,
    "desc": "极端灵异绝境中护住 1 名队友灵魂不被鬼域吞噬抹杀，为其保留带回空间复活的可能",
    "tags": [
      "异常灵异",
      "空间",
      "灵异",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 5,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "support"
    }
  },
  {
    "id": "G001",
    "name": "治疗喷雾／治疗胶囊",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "医疗｜耗材",
    "price": 8,
    "discountable": false,
    "desc": "紧急止血、稳定轻中度外伤；重伤与灵魂损伤需回空间修复",
    "tags": [
      "泛用战术",
      "医疗",
      "空间",
      "灵异",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G002",
    "name": "基础收费查询",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "情报｜服务",
    "price": 10,
    "discountable": false,
    "desc": "按权限检索概念或条件筛选商品，高阶机密受权限拦截",
    "tags": [
      "泛用战术",
      "规则",
      "原著"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 0,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G003",
    "name": "高热量压缩口粮与净水片（七日份）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "生存｜耗材",
    "price": 5,
    "discountable": false,
    "desc": "长期困守或荒野求生维系体能",
    "tags": [
      "泛用战术",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 0
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G004",
    "name": "广谱解毒与抗辐射针剂（三支）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "医疗｜耗材",
    "price": 20,
    "discountable": true,
    "desc": "中和常规化学毒剂、蛇毒与低剂核辐射，不解超凡剧毒",
    "tags": [
      "泛用战术",
      "医疗",
      "毒素生化",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G005",
    "name": "战场止血绷带与骨夹板套",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "医疗｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "顾禾向常规外伤处置耗材",
    "tags": [
      "泛用战术",
      "医疗",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G006",
    "name": "基础近身格斗精通",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "通用｜技能",
    "price": 25,
    "discountable": true,
    "desc": "擒拿、卸力、防身与冷兵器基础动作规范",
    "tags": [
      "泛用战术"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "G007",
    "name": "基础枪械与掩体射击精通",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "通用｜技能",
    "price": 25,
    "discountable": true,
    "desc": "稳准射控、快速换弹与利用地形规避弹道",
    "tags": [
      "泛用战术"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "G008",
    "name": "野外追踪与反追踪入门",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "侦察｜技能",
    "price": 20,
    "discountable": true,
    "desc": "辨识足迹、血迹、伪装与抹除队伍行进痕迹",
    "tags": [
      "泛用战术",
      "隐蔽",
      "侦察"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "G009",
    "name": "基础急救与战地清创术",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "医疗｜技能",
    "price": 25,
    "discountable": true,
    "desc": "令非医疗队友也能完成紧急止血与气道维持",
    "tags": [
      "泛用战术",
      "医疗",
      "团队"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G010",
    "name": "潜行与脚步消音技巧",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "侦察｜技能",
    "price": 25,
    "discountable": true,
    "desc": "显著降低移动声响与阴影中暴露概率",
    "tags": [
      "泛用战术",
      "隐蔽",
      "侦察"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 0,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "G011",
    "name": "基础谈判与心理博弈入门",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "队长｜技能",
    "price": 25,
    "discountable": true,
    "desc": "严辞向：捕捉 NPC 利益诉求与话术漏洞，提高交涉成功率",
    "tags": [
      "泛用战术",
      "团队"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "G012",
    "name": "机械开锁与简易陷阱拆解",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "侦察｜技能",
    "price": 25,
    "discountable": true,
    "desc": "拆解常规机械锁、绊雷与建筑机关",
    "tags": [
      "泛用战术",
      "侦察",
      "电磁",
      "收容",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "recon"
    }
  },
  {
    "id": "G013",
    "name": "冷兵器武器养护与应急修补",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "通用｜技能",
    "price": 20,
    "discountable": true,
    "desc": "战间修复常规剑器与防具轻度缺口",
    "tags": [
      "泛用战术",
      "剑修",
      "医疗"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G014",
    "name": "团队手语与无声暗号体系",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "团队｜知识",
    "price": 10,
    "discountable": false,
    "desc": "在禁声、监听或模因干扰下维持五人默契配合",
    "tags": [
      "泛用战术",
      "侦察",
      "电磁",
      "抗模因",
      "团队"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "G015",
    "name": "基础爆破与结构弱点识别",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "攻坚｜技能",
    "price": 30,
    "discountable": true,
    "desc": "识别承重墙、管线与闸门弱点，以最小炸药开路",
    "tags": [
      "泛用战术",
      "医疗",
      "爆发"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 10
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "burst"
    }
  },
  {
    "id": "G016",
    "name": "基础游泳与水下憋气训练",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "生存｜技能",
    "price": 15,
    "discountable": true,
    "desc": "应对水淹设施与水下撤离场景",
    "tags": [
      "泛用战术"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 6,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "G017",
    "name": "强心醒神嗅盐（五支）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "医疗｜耗材",
    "price": 15,
    "discountable": true,
    "desc": "迅速唤醒昏迷、休克或轻微催眠中的队友",
    "tags": [
      "泛用战术",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 0,
      "wil": 0,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G018",
    "name": "一次性储能阵牌",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "D",
    "source": "阵法｜耗材",
    "price": 10,
    "discountable": false,
    "desc": "为阵法或法器补充单次能源，不消除冷却与过载",
    "tags": [
      "泛用战术",
      "阵法",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 0,
      "wil": 1,
      "energy": 5
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 2,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "G019",
    "name": "基础属性专项强化（10 点档）",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "通用｜强化",
    "price": 50,
    "discountable": true,
    "desc": "定向补齐力量、敏捷、体质或意志（原著意志系统直强上限 80）",
    "tags": [
      "泛用战术",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "G020",
    "name": "私人房间造人服务",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "空间｜服务",
    "price": 50,
    "discountable": false,
    "desc": "模拟熟悉人物外貌与人格表现用于慰藉或对练，非原人复活",
    "tags": [
      "泛用战术",
      "空间",
      "原著"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "support"
    }
  },
  {
    "id": "G021",
    "name": "双 D 血统融合手续",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "融合｜服务",
    "price": 30,
    "discountable": false,
    "desc": "将两项 D 级血统合成为定制 C 级血统",
    "tags": [
      "泛用战术",
      "原著"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "support"
    }
  },
  {
    "id": "G022",
    "name": "中阶外伤再生注射液（两支）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "医疗｜耗材",
    "price": 65,
    "discountable": true,
    "desc": "1 分钟内愈合重度撕裂伤与骨折，无法接续已失断肢",
    "tags": [
      "泛用战术",
      "医疗",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "G023",
    "name": "战地精神舒缓针（两支）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "医疗｜耗材",
    "price": 60,
    "discountable": true,
    "desc": "强行压制濒临崩溃的恐慌、幻觉与轻度理智下滑",
    "tags": [
      "泛用战术",
      "抗模因",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 0,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "control"
    }
  },
  {
    "id": "G024",
    "name": "队长战术沙盘推演",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "队长｜技能",
    "price": 70,
    "discountable": true,
    "desc": "严辞向：结合已知线索快速标注最优撤退路线与埋伏风险点",
    "tags": [
      "泛用战术",
      "团队"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 2,
      "obs": 2,
      "wil": 1,
      "energy": 15
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "G025",
    "name": "重击蓄势·破甲一击",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "主 C｜技能",
    "price": 75,
    "discountable": true,
    "desc": "陆烬向：蓄力 2 秒打出极高穿透重击，需控防队友掩护前摇",
    "tags": [
      "泛用战术",
      "破甲",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "G026",
    "name": "危机直觉·第六感预警",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "通用｜技能",
    "price": 80,
    "discountable": true,
    "desc": "遭遇致命伏击或狙击锁定时提前半秒产生寒意警兆",
    "tags": [
      "泛用战术",
      "侦察",
      "收容"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 1,
      "energy": 15
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "G027",
    "name": "精准投掷与抛物线直觉",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "通用｜技能",
    "price": 55,
    "discountable": true,
    "desc": "大幅提升手雷、泥封、阵旗与救援绳索的远距命中精度",
    "tags": [
      "泛用战术",
      "阵法",
      "电磁",
      "火焰雷法",
      "爆发"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 4,
      "cooldown": 1,
      "role": "support"
    }
  },
  {
    "id": "G028",
    "name": "异常生理与灵魂伤势鉴别",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "医疗｜技能",
    "price": 70,
    "discountable": true,
    "desc": "顾禾向：一眼分辨队友伤势属物理、毒素、寄生还是灵魂受损",
    "tags": [
      "泛用战术",
      "灵异",
      "毒素生化",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "G029",
    "name": "高效阵眼伪装与隐蔽布设",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "控防｜技能",
    "price": 65,
    "discountable": true,
    "desc": "令预埋的阵盘、坐标与陷阱极难被常规侦察手段识破",
    "tags": [
      "泛用战术",
      "阵法",
      "隐蔽",
      "侦察"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 2,
      "obs": 2,
      "wil": 1,
      "energy": 15
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "recon"
    }
  },
  {
    "id": "G030",
    "name": "跨体系能源微调手册",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "构筑｜知识",
    "price": 85,
    "discountable": true,
    "desc": "降低双核切换时的能量滞涩，减少一次切换动作的僵直",
    "tags": [
      "泛用战术"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 15
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 0,
      "cooldown": 0,
      "role": "passive"
    }
  },
  {
    "id": "G031",
    "name": "低价赌命货：燃血疾行术",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "赌命｜技法",
    "price": 45,
    "discountable": true,
    "desc": "剧烈燃烧自身鲜血换取 10 秒三倍移速，结束后严重失血虚脱",
    "tags": [
      "泛用战术",
      "位移",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 16,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "G032",
    "name": "低价赌命货：破釜沉舟盾",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "赌命｜技法",
    "price": 50,
    "discountable": true,
    "desc": "以接下来 30 秒无法移动为代价，瞬时将自身格挡承伤上限翻倍",
    "tags": [
      "泛用战术",
      "护盾",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 15
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 16,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "G033",
    "name": "低价赌命货：过载引爆器",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "赌命｜耗材",
    "price": 55,
    "discountable": true,
    "desc": "强行引爆一件自带能量的己方装备产生越阶炸裂，装备永久损毁",
    "tags": [
      "泛用战术",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 0,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 5
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 5,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "G034",
    "name": "团队共享契约徽章（五枚）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "C",
    "source": "团队｜器物",
    "price": 80,
    "discountable": true,
    "desc": "方便队友在阵法与领域中自动识别己方通行标记，降低误伤",
    "tags": [
      "泛用战术",
      "阵法",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 2,
      "energy": 15
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 12,
      "cooldown": 2,
      "role": "control"
    }
  },
  {
    "id": "G035",
    "name": "双 C 血统融合手续",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "融合｜服务",
    "price": 90,
    "discountable": false,
    "desc": "将两项 C 级血统合成为定制 B 级血统（原著暴君＋观察者同款）",
    "tags": [
      "泛用战术",
      "侦察",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "G036",
    "name": "血色冲击",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "赌命主 C｜技能",
    "price": 60,
    "discountable": true,
    "desc": "燃烧自身生命力换取极高瞬间爆发，高危搏命技",
    "tags": [
      "泛用战术",
      "爆发",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 2,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 28,
      "cooldown": 4,
      "role": "burst"
    }
  },
  {
    "id": "G037",
    "name": "小队正式建队凭证",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "团队｜服务",
    "price": 100,
    "discountable": false,
    "desc": "建立正式小队，解锁队长权限、成员面板互看、特殊商店与团战匹配",
    "tags": [
      "泛用战术",
      "收容",
      "团队",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "G038",
    "name": "群体净化·驱毒清污术",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "医疗｜技能",
    "price": 150,
    "discountable": true,
    "desc": "顾禾向：清除五人范围内中阶毒素、病菌与低阶阴邪侵蚀",
    "tags": [
      "泛用战术",
      "毒素生化"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "G039",
    "name": "灵魂缝合·急救稳态",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "医疗｜技能",
    "price": 165,
    "discountable": true,
    "desc": "顾禾向：强行粘合濒临溃散的灵魂裂隙，保住队友不致当场魂飞魄散",
    "tags": [
      "泛用战术",
      "医疗",
      "灵异",
      "位移",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "G040",
    "name": "主 C 破核连斩",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "主 C｜技能",
    "price": 175,
    "discountable": true,
    "desc": "陆烬向：对已被控住或破防的目标打出三段递增斩杀，专收残血强敌",
    "tags": [
      "泛用战术",
      "破甲",
      "爆发"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 1,
      "wil": 2,
      "energy": 30
    },
    "energyType": "体魄",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "burst"
    }
  },
  {
    "id": "G041",
    "name": "全局撤退令（团队提速）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "队长｜技能",
    "price": 140,
    "discountable": true,
    "desc": "严辞向：发布既定撤退口令后全队 8 秒内移速与抗硬直显著提升",
    "tags": [
      "泛用战术",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 2,
      "wil": 1,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "mobility"
    }
  },
  {
    "id": "G042",
    "name": "器物定向熔炼凭证（B 级）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "融合｜服务",
    "price": 120,
    "discountable": false,
    "desc": "将两种材料或中阶器物熔炼为复合法器（如金雷竹融入本命剑胚）",
    "tags": [
      "泛用战术",
      "剑修",
      "电磁",
      "火焰雷法"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 1,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "G043",
    "name": "替伤契约·分担重压",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "控防｜技法",
    "price": 145,
    "discountable": true,
    "desc": "将 1 名队友承受的半数物理／能量伤害转嫁至自己护盾或躯体上",
    "tags": [
      "泛用战术",
      "结界",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 1,
      "obs": 1,
      "wil": 3,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 20,
      "cooldown": 3,
      "role": "defense"
    }
  },
  {
    "id": "G044",
    "name": "低价赌命货：盲目死守誓约",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "赌命控防｜技法",
    "price": 105,
    "discountable": true,
    "desc": "主动封闭自身视觉 15 秒，换取身前 5 米防线承伤强度飙升至 A 级门槛",
    "tags": [
      "泛用战术",
      "规则",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 28,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "G045",
    "name": "低价赌命货：断臂求生解缚",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "赌命｜技法",
    "price": 100,
    "discountable": true,
    "desc": "自断一肢或损毁一件核心护具，强行挣脱高于自身一阶的绝境束缚",
    "tags": [
      "泛用战术",
      "收容",
      "赌命"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 2,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 28,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "G046",
    "name": "低价赌命货：狂暴透支药剂",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "赌命｜耗材",
    "price": 110,
    "discountable": true,
    "desc": "30 秒内全属性强行拔升一阶，药效结束后陷入 10 分钟重度昏迷",
    "tags": [
      "泛用战术",
      "医疗",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 11,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "G047",
    "name": "低价赌命货：以命换时沙漏",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "赌命控防｜耗材",
    "price": 125,
    "discountable": true,
    "desc": "消耗自身大量气血与耐力，强行令当前正在维持的阵法／结界额外续命 5 秒",
    "tags": [
      "泛用战术",
      "阵法",
      "结界",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 11,
      "cooldown": 3,
      "role": "control"
    }
  },
  {
    "id": "G048",
    "name": "战后完美修复应急券（单次）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "B",
    "source": "空间｜耗材",
    "price": 130,
    "discountable": true,
    "desc": "抵扣一次昂贵的重伤空间完美修复费用，避免负分抹杀风险",
    "tags": [
      "泛用战术",
      "医疗",
      "空间",
      "耗材"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 1,
      "wil": 2,
      "energy": 10
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 8,
      "cooldown": 2,
      "role": "support"
    }
  },
  {
    "id": "G049",
    "name": "双 B 血统融合手续",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "融合｜服务",
    "price": 270,
    "discountable": false,
    "desc": "将两项 B 级血统合成为定制 A 级血统",
    "tags": [
      "泛用战术",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "support"
    }
  },
  {
    "id": "G050",
    "name": "高阶定向能力融合凭证",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "融合｜服务",
    "price": 300,
    "discountable": false,
    "desc": "将两项高阶能力或核心定向融合产生新特性（如能源核心融入主能力）",
    "tags": [
      "泛用战术",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "support"
    }
  },
  {
    "id": "G051",
    "name": "团队同心·势能共鸣",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "控防赋能｜技法",
    "price": 310,
    "discountable": true,
    "desc": "将自身积蓄的守御势能与真元通过阵法渡给主 C，令其下一击附带破盾与越阶威能",
    "tags": [
      "泛用战术",
      "阵法",
      "护盾",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "G052",
    "name": "绝境回光·群体强心域",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "医疗｜技法",
    "price": 340,
    "discountable": true,
    "desc": "顾禾向：6 秒内令半径 15 米内重伤队友无视濒死硬直继续行动，结束后需立刻抢救",
    "tags": [
      "泛用战术",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "G053",
    "name": "破妄真言·洞悉破绽",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "侦察／队长｜技法",
    "price": 290,
    "discountable": true,
    "desc": "强行标定敌方首领的供能连接、核心弱点与下一拍必杀落点",
    "tags": [
      "泛用战术",
      "侦察"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 3,
      "obs": 7,
      "wil": 3,
      "energy": 45
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "recon"
    }
  },
  {
    "id": "G054",
    "name": "孤注一掷·必中破核枪／斩",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "主 C｜技法",
    "price": 350,
    "discountable": true,
    "desc": "陆烬向：3 秒蓄力后无视常规闪避直击核心，蓄力期完全丧失自保能力",
    "tags": [
      "泛用战术",
      "破甲",
      "位移"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 7,
      "obs": 3,
      "wil": 2,
      "energy": 45
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "mobility"
    }
  },
  {
    "id": "G055",
    "name": "低价赌命货：七伤借力诀",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "赌命控防｜技法",
    "price": 240,
    "discountable": true,
    "desc": "强行硬接高于自身一阶的轰击并将七成威力反射，自身五脏同步受创",
    "tags": [
      "泛用战术",
      "赌命"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 6,
      "obs": 2,
      "wil": 2,
      "energy": 45
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 42,
      "cooldown": 5,
      "role": "burst"
    }
  },
  {
    "id": "G056",
    "name": "低价赌命货：燃魂守界",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "赌命控防｜技法",
    "price": 250,
    "discountable": true,
    "desc": "灼烧灵魂本源令已成阵势的防线强度跃升至准 S 级持续 6 秒，战后须耗巨资修魂",
    "tags": [
      "泛用战术",
      "阵法",
      "灵异",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 6,
      "energy": 45
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 42,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "G057",
    "name": "低价赌命货：同归于尽锁链",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "赌命硬控｜器物",
    "price": 245,
    "discountable": true,
    "desc": "将自身与强敌强行锁死在 3 米内无法脱离 10 秒，双方均无法使用空间位移",
    "tags": [
      "泛用战术",
      "收容",
      "空间",
      "赌命"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 3,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 42,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "G058",
    "name": "低价赌命货：禁咒·血祭换位",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "赌命救援｜技法",
    "price": 255,
    "discountable": true,
    "desc": "瞬间将绝境中即将吃必杀的队友与自己互换位置，替其硬扛致命一击",
    "tags": [
      "泛用战术",
      "灵异",
      "赌命",
      "团队"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 4,
      "wil": 5,
      "energy": 45
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 42,
      "cooldown": 5,
      "role": "support"
    }
  },
  {
    "id": "G059",
    "name": "高阶多线并行自动器灵（寄宿体）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "构筑｜器物",
    "price": 330,
    "discountable": true,
    "desc": "寄宿于本命阵盘或剑匣中，接管常规防御与飞剑保持动作，大幅解放玩家操作",
    "tags": [
      "泛用战术",
      "剑修",
      "阵法",
      "结界",
      "位移"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 5,
      "obs": 4,
      "wil": 4,
      "energy": 45
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 30,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "G060",
    "name": "精英称号模拟特权体验卡（单场）",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "A",
    "source": "空间｜耗材",
    "price": 300,
    "discountable": true,
    "desc": "单场获得提前 24 小时知晓下场基础题型与一次免费基础修复的便利",
    "tags": [
      "泛用战术",
      "医疗",
      "空间",
      "耗材",
      "原著"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 1,
      "obs": 2,
      "wil": 3,
      "energy": 20
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 12,
      "cooldown": 3,
      "role": "support"
    }
  },
  {
    "id": "G061",
    "name": "毁灭之力",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命主 C｜技能",
    "price": 500,
    "discountable": true,
    "desc": "极高毁灭级破坏力，施放时同步剧烈毁坏使用者自身躯体",
    "tags": [
      "泛用战术",
      "爆发",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 7,
      "agi": 8,
      "obs": 3,
      "wil": 3,
      "energy": 70
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 62,
      "cooldown": 6,
      "role": "burst"
    }
  },
  {
    "id": "G062",
    "name": "天劫",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命清场｜技能",
    "price": 500,
    "discountable": true,
    "desc": "引动大范围恐怖天劫轰击战区，需严控发动时间、目标与终止条件",
    "tags": [
      "泛用战术",
      "规则",
      "爆发",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 8,
      "agi": 6,
      "obs": 3,
      "wil": 3,
      "energy": 70
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 62,
      "cooldown": 6,
      "role": "burst"
    }
  },
  {
    "id": "G063",
    "name": "天魔解体",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命爆发｜技能",
    "price": 480,
    "discountable": true,
    "desc": "彻底透支本源换取短时越阶爆发，战后近乎废人需天价修复",
    "tags": [
      "泛用战术",
      "医疗",
      "爆发",
      "赌命",
      "原著"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 4,
      "obs": 6,
      "wil": 8,
      "energy": 70
    },
    "energyType": "灵异",
    "activeSkill": {
      "cost": 62,
      "cooldown": 6,
      "role": "support"
    }
  },
  {
    "id": "G064",
    "name": "双 A 血统融合手续",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "融合｜服务",
    "price": 500,
    "discountable": false,
    "desc": "将两项 A 级血统合成为定制 S 级血统（第一季极难凑齐）",
    "tags": [
      "泛用战术",
      "原著"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 45,
      "cooldown": 5,
      "role": "support"
    }
  },
  {
    "id": "G065",
    "name": "终局团队合击阵符（五人共铸）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "团队底牌｜一次性",
    "price": 520,
    "discountable": true,
    "desc": "五人各自注入本命之力：你撑界控敌、顾禾稳态、许檀锁核、严辞定策、陆烬斩出超越上限的合击一剑",
    "tags": [
      "泛用战术",
      "剑修",
      "阵法",
      "收容",
      "团队"
    ],
    "powerDelta": {
      "phy": 1,
      "agi": 4,
      "obs": 3,
      "wil": 3,
      "energy": 30
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 18,
      "cooldown": 4,
      "role": "control"
    }
  },
  {
    "id": "G066",
    "name": "低价赌命 S：十息不死身（透支版）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命前排｜一次性",
    "price": 450,
    "discountable": true,
    "desc": "10 秒内无论承受何等物理与能量轰击皆不倒地，第 11 秒所有累积伤害瞬间结算",
    "tags": [
      "泛用战术",
      "护盾",
      "赌命",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "burst"
    }
  },
  {
    "id": "G067",
    "name": "低价赌命 S：绝境代劫契（一次性）",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命控防｜一次性",
    "price": 460,
    "discountable": true,
    "desc": "将全队即将承受的一次团灭级必杀规则全部收束至自身与本命器物承担，大概率重创濒死换全队生机",
    "tags": [
      "泛用战术",
      "规则",
      "赌命",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 3,
      "obs": 2,
      "wil": 2,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "burst"
    }
  },
  {
    "id": "G068",
    "name": "低价赌命 S：逆流燃命渡力",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命赋能｜一次性",
    "price": 470,
    "discountable": true,
    "desc": "抽干自身全部真元、储备与半数生命力强行灌入 1 名队友体内，令其 10 秒内临时跨入高一阶战力",
    "tags": [
      "泛用战术",
      "赌命",
      "团队",
      "耗材"
    ],
    "powerDelta": {
      "phy": 2,
      "agi": 2,
      "obs": 3,
      "wil": 4,
      "energy": 30
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "control"
    }
  },
  {
    "id": "G069",
    "name": "低价赌命 S：因果暂借券",
    "canon": false,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "赌命规则｜一次性",
    "price": 490,
    "discountable": true,
    "desc": "强行向死考空间预支下场 300 分战力当场兑现为一次性爆发／护盾，下场结算须连本带利偿还 450 分，违约抹杀",
    "tags": [
      "泛用战术",
      "结界",
      "规则",
      "空间",
      "护盾"
    ],
    "powerDelta": {
      "phy": 4,
      "agi": 2,
      "obs": 2,
      "wil": 4,
      "energy": 30
    },
    "energyType": "通用",
    "activeSkill": {
      "cost": 25,
      "cooldown": 5,
      "role": "defense"
    }
  },
  {
    "id": "G070",
    "name": "复活前置·真灵保存匣（空）",
    "canon": true,
    "category": "general",
    "categoryLabel": "泛用技能与赌命禁术",
    "tier": "S",
    "source": "空间｜高阶器物",
    "price": 580,
    "discountable": true,
    "desc": "在队友肉身彻底毁灭时完整封存其真实意识与灵魂带回空间，为后续漫长复活任务保留唯一火种",
    "tags": [
      "泛用战术",
      "空间",
      "灵异",
      "火焰雷法",
      "爆发"
    ],
    "powerDelta": {
      "phy": 3,
      "agi": 3,
      "obs": 5,
      "wil": 10,
      "energy": 70
    },
    "energyType": "真元",
    "activeSkill": {
      "cost": 62,
      "cooldown": 6,
      "role": "support"
    }
  }
];

  INFINITY.FUSION_RECIPES = [
  {
    "id": "FUS_01",
    "inputs": [
      "B022",
      "B023"
    ],
    "extraCost": 90,
    "reqGrade": "B",
    "result": {
      "id": "FUS_CALM_TYRANT",
      "name": "冷静暴君",
      "tier": "B",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": true,
      "energyType": "体魄",
      "desc": "原著标杆融合：保留狂暴体格与高速再生，以观察者的高意志压制失控；超负荷仍会反噬精神",
      "tags": [
        "融合血统",
        "肉体",
        "再生",
        "高意志",
        "原著"
      ],
      "powerDelta": {
        "phy": 7,
        "agi": 3,
        "obs": 5,
        "wil": 6,
        "energy": 35
      },
      "activeSkill": {
        "cost": 18,
        "cooldown": 3,
        "role": "burst"
      },
      "drawback": "超负荷狂暴状态结束时触发精神反噬（理智-12）"
    }
  },
  {
    "id": "FUS_02",
    "inputs": [
      "B026",
      "B034"
    ],
    "extraCost": 90,
    "reqGrade": "B",
    "result": {
      "id": "FUS_CHENGYING_SWORD",
      "name": "承影灵剑体",
      "tier": "B",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "真元",
      "desc": "剑意天然穿透虚实，大幅强化宵练与承影剑道，可短时半虚化规避实体斩击；肉身抗纯物理钝击偏弱",
      "tags": [
        "融合血统",
        "剑修",
        "虚实穿透",
        "隐蔽"
      ],
      "powerDelta": {
        "phy": 2,
        "agi": 6,
        "obs": 5,
        "wil": 5,
        "energy": 40
      },
      "activeSkill": {
        "cost": 16,
        "cooldown": 2,
        "role": "mobility"
      },
      "drawback": "半虚化期间受阳刚雷法伤害加深，纯物理承伤偏弱"
    }
  },
  {
    "id": "FUS_03",
    "inputs": [
      "B028",
      "B027"
    ],
    "extraCost": 90,
    "reqGrade": "B",
    "result": {
      "id": "FUS_ZHENSHA_BODY",
      "name": "镇煞不死躯",
      "tier": "B",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "真元",
      "desc": "极高物理耐受、断肢接续与抗毒能力，以道门守心压住嗜血冲动；仍惧强阳雷火",
      "tags": [
        "融合血统",
        "护盾",
        "再生",
        "抗模因"
      ],
      "powerDelta": {
        "phy": 7,
        "agi": 2,
        "obs": 3,
        "wil": 6,
        "energy": 35
      },
      "activeSkill": {
        "cost": 18,
        "cooldown": 3,
        "role": "defense"
      },
      "drawback": "受强阳刚雷火灼伤时自愈停滞，重伤失血过半需压制嗜血冲动"
    }
  },
  {
    "id": "FUS_04",
    "inputs": [
      "B046",
      "B066"
    ],
    "extraCost": 270,
    "reqGrade": "A",
    "result": {
      "id": "FUS_ARRAY_CALC_BODY",
      "name": "阵算一体道躯",
      "tier": "A",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "真元",
      "desc": "真元运转与多线阵法推演算力合流，可并行御剑、布阵与破解电子协议；惧强电磁脉冲与灵力反噬双威胁",
      "tags": [
        "融合血统",
        "阵法",
        "黑客",
        "剑修",
        "多线并行"
      ],
      "powerDelta": {
        "phy": 4,
        "agi": 6,
        "obs": 9,
        "wil": 7,
        "energy": 65
      },
      "activeSkill": {
        "cost": 26,
        "cooldown": 3,
        "role": "control"
      },
      "drawback": "同时惧怕强电磁脉冲与经脉灵力过载，双线崩盘将陷入 1 回合僵直"
    }
  },
  {
    "id": "FUS_05",
    "inputs": [
      "B052",
      "B050"
    ],
    "extraCost": 270,
    "reqGrade": "A",
    "result": {
      "id": "FUS_DONGWEI_BODY",
      "name": "洞微辨诡体",
      "tier": "A",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "灵异",
      "desc": "白泽辨诡与干涉者洞察合流，极速看破精怪、规则破绽与发力死角，专克希夷与模因伪装；过度直视高阶异常会触发精神灼伤",
      "tags": [
        "融合血统",
        "侦察",
        "规则",
        "抗模因",
        "原著衍生"
      ],
      "powerDelta": {
        "phy": 3,
        "agi": 5,
        "obs": 10,
        "wil": 8,
        "energy": 60
      },
      "activeSkill": {
        "cost": 24,
        "cooldown": 3,
        "role": "recon"
      },
      "drawback": "直视 A 级以上规则异常本体时将触发双目与理智灼伤"
    }
  },
  {
    "id": "FUS_06",
    "inputs": [
      "B056",
      "B058"
    ],
    "extraCost": 270,
    "reqGrade": "A",
    "result": {
      "id": "FUS_TWILIGHT_WARDEN",
      "name": "暮光守望者",
      "tier": "A",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "魔力",
      "desc": "兼得血族亲王高速再生、鲜血护盾与阿斯莫天界治疗之手，大幅减轻日光弱点，顶尖战地救援与抗压前排",
      "tags": [
        "融合血统",
        "医疗",
        "再生",
        "护盾"
      ],
      "powerDelta": {
        "phy": 7,
        "agi": 6,
        "obs": 5,
        "wil": 8,
        "energy": 65
      },
      "activeSkill": {
        "cost": 25,
        "cooldown": 3,
        "role": "support"
      },
      "drawback": "需定期平衡体内光暗冲突，连续施放天界治愈会加速血能消耗"
    }
  },
  {
    "id": "FUS_07",
    "inputs": [
      "B033",
      "B041"
    ],
    "extraCost": 90,
    "reqGrade": "B",
    "result": {
      "id": "FUS_MOJIA_CYBER",
      "name": "非攻义体机枢",
      "tier": "B",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "科技",
      "desc": "墨家精密机关微操与军用赛博神经底盘合流，极速完成阵盘组装、锁具拆解与弹道校准，兼顾古代机关与现代电子协议",
      "tags": [
        "融合血统",
        "阵法",
        "黑客",
        "科技装备",
        "微操"
      ],
      "powerDelta": {
        "phy": 4,
        "agi": 6,
        "obs": 6,
        "wil": 3,
        "energy": 35
      },
      "activeSkill": {
        "cost": 15,
        "cooldown": 2,
        "role": "control"
      },
      "drawback": "强电磁脉冲会令义体神经短时掉帧，需靠手工机械锁死回退"
    }
  },
  {
    "id": "FUS_08",
    "inputs": [
      "B045",
      "B027"
    ],
    "extraCost": 90,
    "reqGrade": "B",
    "result": {
      "id": "FUS_DAO_GHOST_VESSEL",
      "name": "太乙镇魂胎",
      "tier": "B",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "灵异",
      "desc": "以道门守心稳固元神、锁死体内契约灵异拼图的复苏阈值，可安全借用规则级压制并大幅削弱精神污染",
      "tags": [
        "融合血统",
        "灵异",
        "规则",
        "收容",
        "抗模因"
      ],
      "powerDelta": {
        "phy": 3,
        "agi": 3,
        "obs": 5,
        "wil": 8,
        "energy": 40
      },
      "activeSkill": {
        "cost": 20,
        "cooldown": 3,
        "role": "control"
      },
      "drawback": "真元与意志枯竭时体内拼图会加速异动，需立刻中断规则借用"
    }
  },
  {
    "id": "FUS_09",
    "inputs": [
      "B061",
      "B075"
    ],
    "extraCost": 270,
    "reqGrade": "A",
    "result": {
      "id": "FUS_ABSOLUTE_REALM",
      "name": "定界真锚灵躯",
      "tier": "A",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "灵异",
      "desc": "间流结界自带高休谟现实锚定，结界立成即可硬截鬼域扩张、规则篡改与空间折跃，是小队死守安全区的终极屏障",
      "tags": [
        "融合血统",
        "结界",
        "空间",
        "抗模因",
        "收容"
      ],
      "powerDelta": {
        "phy": 4,
        "agi": 5,
        "obs": 7,
        "wil": 10,
        "energy": 70
      },
      "activeSkill": {
        "cost": 28,
        "cooldown": 4,
        "role": "defense"
      },
      "drawback": "展开大范围真锚结界极耗精神与能量，结界碎裂会同步震伤识海"
    }
  },
  {
    "id": "FUS_10",
    "inputs": [
      "B002",
      "B009"
    ],
    "extraCost": 30,
    "reqGrade": "C",
    "result": {
      "id": "FUS_COLD_SPIRIT_ROOT",
      "name": "寒铁净心灵根",
      "tier": "C",
      "category": "bloodline",
      "categoryLabel": "血统与体质",
      "canon": false,
      "energyType": "真元",
      "desc": "以猎魔人青草试炼的冷静心率提纯伪灵根，显著加快炼气与控剑稳度，抗常规毒素与恐慌干扰，低成本跨体系起手模板",
      "tags": [
        "融合血统",
        "东方修真",
        "抗模因",
        "起手过渡"
      ],
      "powerDelta": {
        "phy": 2,
        "agi": 3,
        "obs": 3,
        "wil": 4,
        "energy": 25
      },
      "activeSkill": {
        "cost": 10,
        "cooldown": 2,
        "role": "defense"
      },
      "drawback": "长期压制情绪波动导致共情偏冷，深度灵性爆发上限止步中阶"
    }
  }
];

})(typeof window !== "undefined" ? window : globalThis);
