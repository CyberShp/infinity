// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.0 — 八座「零空气墙」物理拆解台（部位 × 工具）
// 设计铁律：所有部位与工具槽全程开放，不设剧情前置锁；选错工具当场产生物理/民俗反噬！
// ============================================================================
(function (global) {
  'use strict';

  const LUBAN_GATES = ['财', '病', '离', '义', '官', '劫', '害', '本'];

  const WORKBENCHES = {
    wb_couch_jar: {
      id: 'wb_couch_jar',
      room: 'west',
      title: '西厢 · 雕花暖榻与纳魂瓦瓮',
      subtitle: '靠内墙的紫檀雕花暖榻，底板严丝合缝，透着阴湿土腥气',
      propKey: 'prop_couch_jar',
      parts: [
        { id: 'floorboard', name: '① 暖榻暗榫底板', desc: '整块雕花木板下藏着空腔，缝隙极紧。' },
        { id: 'seal_mud',   name: '② 瓦瓮朱砂封泥与铁箍', desc: '半埋潮土中的黑陶瓦瓮，口糊硬结朱砂封泥并箍着十字熟铁扣。' },
        { id: 'nail_1_slot',name: '③ 瓮顶子午镇宅铁钉', desc: '死死压在熟铁扣正中的古旧铁钉。' }
      ]
    },

    wb_shrine_nail: {
      id: 'wb_shrine_nail',
      room: 'shrine',
      title: '东侧宗祠 · 昭穆总牌与泄水石栓',
      subtitle: '低洼泄阴池正中的黑漆楠木大灵位，以及供桌正底部的暗渠石栓',
      propKey: 'prop_shrine_nail',
      parts: [
        { id: 'drain_plug',  name: '① 供桌水下泄水石栓', desc: '藏在供桌正底青砖缝间的圆石塞，通往二进后院枯井暗渠。' },
        { id: 'tablet_nail', name: '② 总牌底·七寸倒插丧门钉', desc: '翻转楠木底座可见一根七寸生铁长钉，满布倒刺与暗红血锈。' }
      ]
    },

    wb_hall_portrait: {
      id: 'wb_hall_portrait',
      room: 'hall',
      title: '中央正厅 · 无目遗像、夹壁铃与买命总契',
      subtitle: '太师壁上双目被捅穿的裴太爷画像，以及下方暗锁神龛',
      propKey: 'prop_ledger',
      parts: [
        { id: 'wall_bell',       name: '① 夹壁暗腔·惊魂铜铃', desc: '伸手探入画背墙洞，可摸到红丝连着一只悬空的旧黄铜铃。' },
        { id: 'portrait_nails',  name: '② 画目双孔·盲目连心钉', desc: '钉在画布挖空双目砖缝里的两枚青铜长钉，紧绷红丝。' },
        { id: 'master_contract', name: '③ 神龛暗格·《买命总契》', desc: '暗红血字母契，骑缝盖着渗霜的裴氏朱印。' }
      ]
    },

    wb_east_defense: {
      id: 'wb_east_defense',
      room: 'east',
      title: '东厢柴房 · 鲁门拒煞木障搭建台',
      subtitle: '破门框无铁闩、木窗半塌，必须借木匠遗物亲手构筑三道冷防线',
      propKey: 'prop_carpenter',
      parts: [
        { id: 'threshold_ink',  name: '① 门槛弹十字朱砂墨线', desc: '以鲁门墨斗在破门门槛弹出交错朱砂线阻煞。' },
        { id: 'threshold_lime', name: '② 窗下与门缝撒干生石灰', desc: '阻隔白雾阴湿与四更寒潮渗透。' },
        { id: 'door_brace',     name: '③ 朽木桌案三角斜撑', desc: '用扁铁凿凿出地面凹槽，将重木桌死死抵住破门板。' }
      ]
    },

    wb_lu_box: {
      id: 'wb_lu_box',
      room: 'inner_study',
      title: '内书房 · 鲁班四象暗榫铜匣',
      subtitle: '紫檀秘匣顶面镶嵌四道黄铜滑尺，刻“财病离义官劫害本”八门',
      propKey: 'prop_lu_box',
      isLuBanCipher: true,
      parts: [
        { id: 'luban_sliders', name: '① 拨动四道鲁班铜滑尺', desc: '调准四门刻度后按下铜钮开启，切忌错拨四吉门触动毒针。' },
        { id: 'box_force',     name: '② 强行铁器硬砸木匣', desc: '直接用重物砸毁铜匣（风险极高）。' }
      ]
    },

    wb_embroidery_box: {
      id: 'wb_embroidery_box',
      room: 'embroidery_loft',
      title: '西绣楼 · 血色绣绷与樟木药奁',
      subtitle: '梳妆台上敞开的旧樟木药奁，底板有夹层空响',
      propKey: 'prop_ledger',
      parts: [
        { id: 'embroidery_frame', name: '① 血色鸳鸯绣绷', desc: '绷着半幅血帕的木绷架，红线缠得极紧。' },
        { id: 'camphor_drawer',   name: '② 樟木药奁底板暗格', desc: '敲击发出空洞木响，边缘有极细暗扣。' }
      ]
    },

    wb_coffin_corpse: {
      id: 'wb_coffin_corpse',
      room: 'coffin_hall',
      title: '后罩房 · 川楠空寿材与裴敬之坐尸',
      subtitle: '太师椅上双目钉钱、死抿牙关的干尸，旁侧为上等川楠空棺',
      propKey: 'prop_blood_jade',
      parts: [
        { id: 'corpse_eyes',  name: '① 坐尸眼窝·镇魂古铜钱', desc: '死死钉入干尸双目的两枚乾隆通宝，泛着暗青煞气。' },
        { id: 'corpse_jaw',   name: '② 坐尸牙关·【借命压舌血玉】', desc: '紧咬的干枯嘴唇缝隙里隐约透出一线暗红邪光（IF② 核心）。' },
        { id: 'coffin_center',name: '③ 川楠空寿材·棺底子午暗槽', desc: '空棺正中刻着子午八卦阴纹，槽底积着一层微黏尸油（IF③ 核心）。' }
      ]
    },

    wb_sluice_boat: {
      id: 'wb_sluice_boat',
      room: 'well',
      title: '枯井与黑水河埠 · 千斤水闸、沉匣与乌篷船',
      subtitle: '连通宗祠暗渠的深井绞盘，以及后门水封铁栅旁的旧乌篷船',
      propKey: 'prop_sunken_box',
      parts: [
        { id: 'sluice_winch', name: '① 枯井千斤水闸绞盘', desc: '挂着熟铁铜锁、齿轮严重生锈的巨型提闸绞盘。' },
        { id: 'river_dredge', name: '② 黑水河埠·船底沉水铁光', desc: '乌篷船侧冰冷浑浊的河底，隐约沉着一只生锈小铁匣（IF① 核心）。' },
        { id: 'sampan_hull',  name: '③ 乌篷船·船底指宽漏缝', desc: '拴在石阶旁的旧木船，船板裂开渗水，无法直接下水远行。' }
      ]
    }
  };

  global.EXAM1_WORKBENCHES = WORKBENCHES;
  global.LUBAN_GATES = LUBAN_GATES;
})(typeof window !== 'undefined' ? window : globalThis);
