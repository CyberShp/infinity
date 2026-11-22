// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.0 — 三轮八幕剧本、自主NPC暗流与六大主线/IF线控制器
// ============================================================================
(function (global) {
  'use strict';

  const E = () => global.EXAM1_ENGINE;
  const DATA = () => global.EXAM1_DATA;

  const Story = {
    // ================= 序幕与开局出身 =================
    selectOrigin(originId) {
      const eng = E();
      const orig = DATA().ORIGINS.find(o => o.id === originId);
      if (!orig) return;

      eng.init('play');
      const S = eng.S;
      S.origin = originId;
      S.stats = Object.assign({}, orig.stats);
      eng.addItem(orig.startItem);

      if (global.AudioEngine) {
        global.AudioEngine.unlock();
        global.AudioEngine.playBgm('alley');
      }

      eng.pushLog({
        type: 'narration',
        text: `细雨敲打着江南旧巷的青石板。你是【${orig.name}】陆寻。${orig.bond}`
      });
      eng.pushLog({
        type: 'narration',
        text: '不知何时，浓稠得像湿棉絮一样的乳白色大雾顺着巷口漫了过来。手腕猛地一沉，一只毫无缝隙的哑黑色金属腕表死死扣在左腕皮肤上——脚下一空，整条老街在白雾里彻底消失。'
      });
      eng.pushLog({
        type: 'narration',
        text: '再睁眼时，你已经站在一座阴森寂静的民国二进青砖大宅前院里。院墙高达三丈，厚重的朱漆大门被白雾凝成的暗青黑霜死死焊住。天井里连你一共七个人，彼此脸上都写着惊疑与戒备。'
      });

      S.sceneId = 'intro_gate_shock';
      S.pendingChoices = [
        { label: '冷静退后半步，观察其余六人与大门黑霜', action: 'scene_gate_shock' }
      ];
      eng.emit();
    },

    scene_gate_shock() {
      const eng = E();
      const S = eng.S;
      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_quiet');
        global.AudioEngine.playSfx('door_slam', { volume: 0.55 });
      }

      eng.pushLog({
        type: 'dialog', speaker: '林哲（西装男）', portrait: 'lin', emotion: 'tense',
        text: '“什么三流密室逃脱剧组？把老子弄这儿来，知不知道我明天早上九点还有并购会！”'
      });
      eng.pushLog({
        type: 'narration',
        text: '林哲骂骂咧咧冲向朱漆大门，伸手一把攥住青铜门环猛拽——刺耳的焦糊声骤然响起！门环上的黑霜仿佛活物般粘掉他掌心一层皮，一股沛然阴寒将他整个人掀翻在青石板上。他痛叫着去掰手腕上的黑表，腕表瞬间弹出一道暗蓝电弧，把他的手指灼得焦黑。'
      });
      eng.pushLog({
        type: 'dialog', speaker: '周衡（拎斧男人）', portrait: 'zhou', emotion: 'calm',
        text: '“够了。自己试过，省得费口舌。”拎着短柄消防斧的男人收回目光，声音低沉沙哑，“陈默，把规矩说一遍。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
        text: '“诸位新人，欢迎来到【全球死考】。”瘦削的汽修工晃了晃手腕，“表是真的，鬼是真的，死在这儿就是真死。活着出去，不管你这轮拿多少分，回大厅先硬扣 60 分基础费，外加治伤修复费，扣成负分当场抹杀。别指望躺平混日子。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
        text: '穿暗灰冲锋衣的女人神色异常冷静，手指轻轻按在腕表边缘：“新人保护期马上开始。先报个称呼方便喊话——不必说真名，代号就行。我叫沈岚。”'
      });

      S.sceneId = 'choose_callsign';
      S.pendingChoices = [
        { label: '报真名「陆寻」，同时不动声色打量每个人的手部细节', action: 'set_callsign_real' },
        { label: '留个心眼，只报代号「七号」或姓氏「陆」', action: 'set_callsign_alias' }
      ];
      eng.emit();
    },

    finishCallsign(alias) {
      const eng = E();
      const S = eng.S;
      S.callsign = alias;
      S.clockMin = 20 * 60 + 42;
      S.phase = 'protect';
      S.round = 1;

      if (global.AudioEngine) global.AudioEngine.playSfx('watch');

      eng.pushLog({
        type: 'system',
        text: '【腕表震动 · 第一轮考题下发】\n【第一轮 · 投宿】白雾封门，择屋过夜，活过今夜五更天明（05:00）。（基础分：20｜新手保护期：10:00）'
      });
      eng.pushLog({
        type: 'narration',
        text: `你报了「${alias}」。趁众人议论的间隙，你注意到沈岚整理袖口时，指缝间掉出一点极细微的惨白木屑；而穿着皮夹克的赵川已经黑着脸盯向东侧宗祠，嘴里嘀咕着“鬼最怕祖宗牌位”。`
      });
      eng.pushLog({
        type: 'system',
        text: '【保护期自由勘察开始（20:42 – 20:52）】\n你仅有 10 分钟保护期！跨房耗时 1 分钟，搜查房间耗时 2 分钟。你不可能跑遍整个前院，请自行决定勘察重心，20:52 白雾压院时将爆发【选房交锋】！'
      });

      // 分散NPC保护期初始动向
      S.npcs.zhou.room = 'hall';
      S.npcs.chen.room = 'courtyard';
      S.npcs.shen.room = 'west';
      S.npcs.zhao.room = 'shrine';
      S.npcs.lin.room = 'courtyard';
      S.npcs.su.room = 'hall';

      S.sceneId = 'free_explore';
      S.pendingChoices = [];
      eng.emit();
    },

    // ================= 自由探索核心动作（跨房 / 搜查 / 对话 / 设饵） =================
    moveToRoom(roomId) {
      const eng = E();
      const S = eng.S;
      const target = DATA().ROOMS[roomId];
      if (!target) return;

      if (S.room === roomId) return;
      if (target.court === 2 && S.day === 1) {
        S.toast = '通往二进内宅的酸枝木月洞门从内侧死死反锁，今夜无法进入！';
        eng.emit();
        return;
      }

      // 第一夜选房锁房后限制（除非处于潜行阶段）
      if (S.phase === 'night1' && !S.flags.night1_free_move) {
        S.toast = '此刻夜雾封门、外院已有巡梆，请通过当前剧情选项行动。';
        eng.emit();
        return;
      }

      const cost = S.phase === 'day2' ? 15 : (S.phase === 'protect' ? 1 : 6);
      S.room = roomId;
      eng.advanceTime(cost);

      if (S.stage !== 'play') return;

      eng.pushLog({
        type: 'narration',
        text: `【${target.name}】${S.day === 1 ? target.descDay1 : (S.phase === 'day2' ? target.descDay2 : target.descNight2)}`
      });

      // 检查阶段时间触发器
      this.checkTimeTriggers();
      // 检查白昼二进专属相遇剧情
      if (S.phase === 'day2') this.checkDay2RoomEvents(roomId);
      eng.emit();
    },

    searchCurrentRoom() {
      const eng = E();
      const S = eng.S;
      const r = S.room;
      const cost = S.phase === 'day2' ? 20 : (S.phase === 'protect' ? 2 : 8);

      if (S.flags.searched[r + '_' + S.day]) {
        S.toast = '这间屋子的明面物件你已经搜检过一遍了——如需精细拆解机关，请直接打开本房【物理拆解台】或翻看【原件档案夹】。';
        eng.emit();
        return;
      }

      S.flags.searched[r + '_' + S.day] = true;
      eng.advanceTime(cost);
      if (S.stage !== 'play') return;

      if (r === 'courtyard') {
        eng.addItem('crowbar');
        eng.addItem('lighter');
        eng.pushLog({
          type: 'evidence',
          text: '你在前院廊柱杂物堆里翻出一根沉重的【生锈铁撬棍】和一只尚有余油的旧【煤油打火机】。（注意：铁撬棍干撬与打火机明火极易招煞，慎用！）'
        });
      } else if (r === 'west') {
        eng.addDoc('doc_ledger');
        eng.addItem('cold_lard');
        eng.addItem('damp_ash');
        eng.addItem('copper_kettle');
        eng.pushLog({
          type: 'evidence',
          text: '你在西厢灶台拿到半罐【陶罐冷猪油】、一捧潮湿的【湿阴香灰／冷灶灰】和一只底有细眼的【漏底盛水铜壶】；又从账桌抽屉翻出暗红洒金的《裴宅西厢 · 乙丑年岁奉支应册》（已收入原件夹，请亲手翻阅细查封底！）。'
        });
      } else if (r === 'east') {
        eng.addDoc('doc_carpenter');
        eng.addItem('flat_chisel');
        eng.addItem('ink_line');
        eng.addItem('quicklime');
        eng.pushLog({
          type: 'evidence',
          text: '你忍着阴寒翻检东厢木匠干尸怀中，摸出染血油布册《鲁门营造厌胜残谱 · 陈七绝笔》（已收入原件夹，记得翻转封底细看！），并拾起【鲁门扁铁凿】、【朱砂木工墨斗】与墙角的【半袋生石灰】。'
        });
      } else if (r === 'shrine') {
        eng.addDoc('doc_shrine_note');
        eng.pushLog({
          type: 'evidence',
          text: '你蹲下身探手摸向宗祠供桌底缝，抽出一张下半截被黑水泡烂的现代方格笔记本残页（已收入原件夹）。青砖缝冰冷刺骨，隐隐泛着黑水寒气。'
        });
      } else if (r === 'hall') {
        eng.addDoc('doc_master_contract');
        eng.addItem('wet_rag');
        eng.pushLog({
          type: 'evidence',
          text: '你绕到无目画像下方，在供桌暗格瞥见覆满寒霜的《乙丑岁奉买命总契》（已记入原件夹），又在廊边水桶旁拎起一块厚实的【厚麻布湿团】。'
        });
      } else if (r === 'inner_study') {
        eng.addDoc('doc_hydro_map');
        eng.pushLog({
          type: 'evidence',
          text: '你从内书房青瓷画筒抽出《裴氏宗祠水脉改道图说》（已收入原件夹）。紫檀书案正中摆着一只刻有鲁班八门铜滑尺的暗榫木匣，可直接在【物理拆解台】拨尺开启！'
        });
      } else if (r === 'embroidery_loft') {
        eng.pushLog({
          type: 'narration',
          text: '西绣楼梳妆台敞着一只樟木药奁，轻敲底板发出空洞暗响——请打开本房【物理拆解台】用薄刃挑开暗格！'
        });
      } else if (r === 'coffin_hall') {
        eng.pushLog({
          type: 'narration',
          text: '你屏息细看太师椅上的裴敬之干尸：眼窝铜钱渗着暗青寒霜，紧咬的嘴唇缝隙里隐约透出一丝血红玉光；旁侧川楠空棺底板刻着子午暗槽。可通过【物理拆解台】近距检视。'
        });
      } else if (r === 'well') {
        eng.addItem('iron_hook_rope');
        eng.pushLog({
          type: 'evidence',
          text: '你在后院枯井石台旁拾起一盘结实的【铁钩麻绳】（可用于黑水河埠打捞水底异物）。井旁架着一台带铜锁的千斤水闸绞盘。'
        });
      } else if (r === 'canal') {
        eng.addItem('tung_oil_hemp');
        eng.pushLog({
          type: 'evidence',
          text: '你在黑水河埠破船棚里找到一桶【桐油与麻絮】（可修补乌篷船漏缝）。低头望向乌篷船旁的墨黑河底，浑浊水下隐约反着一点铁锈微光——打开【枯井与河埠拆解台】即可用铁钩麻绳打捞！'
        });
      } else if (r === 'corridor' || r === 'gate') {
        eng.pushLog({
          type: 'narration',
          text: '你仔细勘察了墙体与砖缝，确认此处没有藏匿额外物件。'
        });
      }

      this.checkTimeTriggers();
      eng.emit();
    },

    // ================= 保护期结束 → 首夜选房大交锋（三路真分流） =================
    checkTimeTriggers() {
      const eng = E();
      const S = eng.S;

      if (S.phase === 'protect' && S.clockMin >= 20 * 60 + 52) {
        this.triggerShelterChoice();
      } else if (S.phase === 'day2') {
        const councilTime = S.worldState === 'W2' ? (24 * 60 + 17 * 60) : (24 * 60 + 17 * 60 + 30);
        if (S.clockMin >= councilTime && !S.flags.confronted_council) {
          this.triggerDay2Council();
        }
      } else if (S.phase === 'night2') {
        // 次夜 05:00 天明未离场则全宅封棺抹杀
        if (S.clockMin >= 24 * 60 + 29 * 60) {
          eng.triggerGameOver('五更天明钟响，你仍滞留于裴氏凶宅白雾之内！川楠寿材轰然合盖，黑雾倒灌窒息全院。');
        }
      }
    },

    triggerShelterChoice() {
      const eng = E();
      const S = eng.S;
      S.phase = 'night1';
      S.room = 'courtyard';
      S.watchman.active = true;
      S.watchman.zone = 'gate';

      if (global.AudioEngine) {
        global.AudioEngine.playSfx('watchman_bang', { volume: 0.75, pan: 0 });
      }

      eng.pushLog({
        type: 'danger',
        text: '【20:52 · 新手保护期结束】马头墙外的白雾轰然翻涌压进天井！远处回廊骤然响起一声干涩阴冷的竹骨梆响——“笃——梆！梆！”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
        text: '“老子上一场就是靠躲祠堂烧黄符活下来的！西厢阴森森的谁爱去谁去，我要进东侧宗祠！”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
        text: '“主厅木窗烂透了，祠堂地势低洼返潮，只有西厢熟铁门闩完好、灶膛还有余温。周队，建议全员进西厢。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
        text: '周衡目光淡淡扫过沈岚的袖口，又瞥了一眼你，没有拆台，只沉声道：“西厢门结实。进哪间屋，各自决定，没人替你的命兜底。”'
      });

      const choices = [];
      if (eng.hasDoc('doc_shrine_note')) {
        choices.push({
          label: '【出示祠堂方格纸】拦住赵川，随后全队进驻西厢（首夜路径A · 保下赵川）',
          action: 'n1_choose_west_save_zhao'
        });
      }
      choices.push({
        label: '跟随周衡与沈岚进驻【西厢 · 签押账房】（首夜路径A · 人心暗算局）',
        action: 'n1_choose_west'
      });
      choices.push({
        label: '识破西厢蹊跷，独守【东厢 · 木匠柴房】搭鲁门墨线木障（首夜路径B · 机关独守局）',
        action: 'n1_choose_east'
      });
      choices.push({
        label: '跟进【东侧宗祠】盯住赵川并探查泄阴池（首夜路径C · 溺水突围局）',
        action: 'n1_choose_shrine'
      });

      S.sceneId = 'night1_shelter_split';
      S.pendingChoices = choices;
    },

    // ================= 第一夜路径 A：西厢签押账房人心局 =================
    startNight1West(savedZhao) {
      const eng = E();
      const S = eng.S;
      S.night1Path = 'west';
      S.room = 'west';
      S.clockMin = 21 * 60 + 5;
      S.npcs.zhou.room = 'west';
      S.npcs.chen.room = 'west';
      S.npcs.shen.room = 'west';
      S.npcs.lin.room = 'west';
      S.npcs.su.room = 'west';

      if (savedZhao) {
        S.flags.zhao_warned = true;
        S.npcs.zhao.room = 'west';
        S.npcs.zhao.trust += 25;
        eng.pushLog({
          type: 'evidence',
          text: '你把泡烂的《宗祠方格纸》拍在赵川胸口。赵川看清“九点半黑水倒灌冻死外门”几行字，脸色发青地骂了句脏话，最终阴沉着脸跟着退进了西厢！'
        });
      } else {
        S.flags.zhao_trapped_shrine = true;
        S.npcs.zhao.room = 'shrine';
        eng.pushLog({
          type: 'narration',
          text: '赵川冷笑一声，头也不回摔门进了东侧宗祠。你随周衡、陈默、沈岚、林哲、苏晓反锁西厢熟铁门闩。'
        });
      }

      // 沈岚埋雷：让暖榻 + 递出鎏金怀表
      eng.pushLog({
        type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
        text: '“夜里寒气重，靠里那张雕花暖榻铺着厚毡子，给两位新人暖暖身子吧。”她顺手从案几铜妆匣拿起一枚黄铜鎏金旧怀表递出来，“黑表看时间太刺眼，这旧表虽然停了，拿着压压惊。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '林哲', portrait: 'lin', emotion: 'calm',
        text: '“还是沈姐周到！”林哲眼疾手快，抢在苏晓前面一把抓过【鎏金怀表】揣进西装内袋，一屁股坐上最里侧的雕花暖榻，还顺手把苏晓挤到外边冰冷长凳上。'
      });
      S.npcs.lin.tabooGift = true;
      S.npcs.lin.tabooCouch = true;

      eng.pushLog({
        type: 'narration',
        text: '苏晓缩在灶台角落，小声拉了拉你的衣袖：“陆哥……我刚才进门时，无意间看见沈岚背着身，用指甲往那块怀表盖里刮了点白色木屑进去，还有一股很呛的医院消毒水味……”'
      });
      S.flags.su_witness_heard = true;

      if (!savedZhao) {
        S.clockMin = 21 * 60 + 30;
        if (global.AudioEngine) global.AudioEngine.playSfx('door_slam');
        eng.pushLog({
          type: 'danger',
          text: '【21:30 · 二更半宗祠惨变】院外突然传来凄厉至极的拍门与嘶吼！浑身湿透、满脸青紫的赵川连滚带爬拍打西厢木门：“开门！祠堂底下冒黑水了！冻死老子了，救命啊！！”'
        });
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡按住门闩眼神冷硬：“外头梆声刚从东廊转过来，现在拉闩开门会泄进寒雾、还得扛他进屋。你要开吗？”'
        });
        S.sceneId = 'n1_west_zhao_rescue';
        S.pendingChoices = [
          { label: '果断配合周衡闪开半扇门，一把把赵川拽进西厢再死死插闩（耗时冒险，HP -8）', action: 'n1_rescue_zhao_yes' },
          { label: '按住门闩不开门，听任门外动静归于死寂（赵川必死，世界态转向 W1）', action: 'n1_rescue_zhao_no' }
        ];
      } else {
        this.enterNight1WestInvestigation();
      }
      eng.emit();
    },

    resolveWestZhaoRescue(saveHim) {
      const eng = E();
      const S = eng.S;
      if (saveHim) {
        S.flags.zhao_rescued = true;
        S.npcs.zhao.room = 'west';
        S.npcs.zhao.hp = 60;
        S.npcs.zhao.emotion = 'injured';
        S.npcs.zhao.trust += 40;
        S.npcs.zhou.trust += 10;
        eng.hurtPlayer(8, '拉门拽人时一股刀刮般的寒雾卷进西厢，你肩膀被门框撞青', false);
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'injured',
          text: '赵川浑身打摆子瘫在灶台边，咳出两口黑水，哑声冲你抱了抱拳：“兄弟，欠你一条命！我以前狗眼看人低，天亮后有件保命的东西我交给你。”'
        });
      } else {
        S.npcs.zhao.alive = false;
        S.npcs.zhao.emotion = 'injured';
        if (global.AudioEngine) global.AudioEngine.playSfx('watch');
        eng.pushLog({
          type: 'danger',
          text: '门外的拍打声很快被急促逼近的竹骨梆声吞没。一声短促惨叫过后，所有人腕表同时冰冷震动：【考生 CN-08144 已死亡】！西厢内死一般寂静。'
        });
      }
      this.enterNight1WestInvestigation();
      eng.emit();
    },

    enterNight1WestInvestigation() {
      const eng = E();
      const S = eng.S;
      S.clockMin = 22 * 60 + 15;
      // 如果还没搜西厢，默认让玩家可以在此时搜查或直接摸表
      eng.pushLog({
        type: 'system',
        text: '【22:15 · 西厢暗查阶段（距三更点卯还有 45 分钟）】\n你可以先借故借看林哲口袋里的【鎏金怀表】、搜查西厢《岁奉支应册》并用薄刃裁开封底、打开【西厢暖榻拆解台】查验榻底，再决定三更前如何处置沈岚的替死局！'
      });
      S.sceneId = 'n1_west_prep';
      this.refreshWestPrepChoices();
    },

    refreshWestPrepChoices() {
      const eng = E();
      const S = eng.S;
      const choices = [];
      if (!eng.hasDoc('doc_watch')) {
        choices.push({ label: '趁林哲炫耀时借看【鎏金怀表】（收入原件台亲手撬验背盖）', action: 'n1_borrow_watch' });
      }
      if (!S.flags.searched['west_1']) {
        choices.push({ label: '搜查西厢账桌与灶台（获取《岁奉支应册》、冷猪油、湿阴灰）', action: 'n1_quick_search_west' });
      }
      choices.push({ label: '打开【原件档案夹 / 西厢拆解台】继续亲手翻验（或直接进入三更处置）', action: 'n1_open_west_wb' });
      choices.push({
        label: '【三更处置 · 路线A】当众拍出物证拆穿沈岚，拽林哲下榻、全员硬守三更撞门！',
        action: 'n1_west_confront_open'
      });
      choices.push({
        label: '【三更处置 · 路线B】看破不说破，自己严守三忌、冷眼旁观林哲三更应劫填命',
        action: 'n1_west_route_b'
      });
      if (S.flags.watch_pried || eng.hasItem('wood_shavings')) {
        choices.push({
          label: '【三更处置 · 路线C】暗中反手调包！将带血桐木屑悄悄塞回沈岚冲锋衣口袋',
          action: 'n1_west_route_c'
        });
      }
      S.pendingChoices = choices;
    },

    // 三更点卯结算（西厢）
    resolveWestMidnight(route) {
      const eng = E();
      const S = eng.S;
      S.clockMin = 23 * 60;
      if (global.AudioEngine) {
        global.AudioEngine.playBgm('crisis');
        global.AudioEngine.playSfx('knock');
      }

      eng.pushLog({
        type: 'danger',
        text: '【23:00 · 三更点卯】“笃……笃……笃。”竹骨梆在西厢门外缓缓敲响三记。一张没有眼睛的惨白轮廓死死贴上窗纸，沙哑问账：“乙丑岁奉……西厢住客，哪位应账——”'
      });

      if (route === 'A') {
        S.flags.shen_exposed_n1 = true;
        S.flags.lin_saved_n1 = true;
        S.npcs.lin.tabooGift = false;
        S.npcs.lin.tabooCouch = false;
        S.npcs.shen.exposed = true;
        S.npcs.zhou.trust += 25;
        S.npcs.chen.trust += 15;
        eng.addItem('substitute_doll');
        eng.addDoc('doc_doll');
        eng.addContribution(8, '当众拍证拆穿沈岚替死局并保下林哲');

        if (global.AudioEngine) global.AudioEngine.playSfx('door_slam');
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '“好手段！”周衡扫过你拍在桌上的铁证，一把按住短斧柄盯着脸色骤变的沈岚，随即反手缴下她的【桐木替死偶】扔给你，又一把把吓傻的林哲拽下暖榻、用湿布捂住怀表，“全体熄灯！木楔抵死门闩！今晚没人替死，咱们硬扛十息！”'
        });
        eng.pushLog({
          type: 'narration',
          text: '门外三问无果、契印全无，无目账房伥骤然狂暴撞门！熟铁门闩在巨力下发出刺耳呻吟，梁灰簌簌落下。你与周衡死死顶住门板，陈默卡死门楔，苏晓捂紧林哲的嘴——煎熬十息过后，骨梆声终于恨恨远去！'
        });
      } else if (route === 'B') {
        S.npcs.lin.alive = false;
        S.npcs.lin.emotion = 'injured';
        S.flags.gate_cracked = true;
        if (global.AudioEngine) global.AudioEngine.playSfx('watch');
        eng.pushLog({
          type: 'danger',
          text: '暖榻下的黑瓦瓮与林哲怀里的鎏金怀表同时渗出暗青黑霜！林哲惊恐惨叫着想把怀表掏出来扔掉，却被黑霜死死粘在掌心。门闩未断，一股刺骨阴风透门而入，林哲当场七窍凝霜抽干气绝！腕表震动：【考生 CN-09472 已死亡】。前院传来铁链松动的脆响（大门霜裂一线）。'
        });
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡冷冷看了眼面无表情的沈岚，又深深瞥了你一眼，什么都没说，只把消防斧横在膝上守到天明。'
        });
      } else if (route === 'C') {
        S.flags.shen_swapped_n1 = true;
        S.flags.lin_saved_n1 = true;
        S.npcs.shen.alive = false;
        S.npcs.shen.emotion = 'injured';
        S.flags.gate_cracked = true;
        eng.addItem('silver_scalpel');
        eng.addItem('substitute_doll');
        eng.addDoc('doc_doll');
        eng.addContribution(8, '暗中调包木屑令替死偶反噬设局者沈岚');
        if (global.AudioEngine) global.AudioEngine.playSfx('watch');
        eng.pushLog({
          type: 'danger',
          text: '你趁暗早已把带血桐木屑连同铜表塞回沈岚冲锋衣外袋！三更梆响刹那，沈岚内袋里的【桐木替死偶】咔嚓寸断！她难以置信地低头看着自己手腕浮现三道青黑契印，连镀银手术刀都没来得及拔出，便遭替死反噬气绝倒地！腕表冰冷播报：【考生 CN-06302 已死亡】。'
        });
        eng.pushLog({
          type: 'narration',
          text: '周衡目光如刀刮过你的脸，沉默良久才压低声音道：“够狠……把她身上的手术刀收好，天亮还有硬仗。”'
        });
      }

      this.completeNight1ToDay2();
    },

    // ================= 第一夜路径 B：东厢木匠柴房机关独守局 =================
    startNight1East() {
      const eng = E();
      const S = eng.S;
      S.night1Path = 'east';
      S.room = 'east';
      S.clockMin = 21 * 60 + 10;
      S.flags.solo_bonus = true;

      S.npcs.zhou.room = 'west';
      S.npcs.chen.room = 'west';
      S.npcs.shen.room = 'west';
      S.npcs.lin.room = 'west';
      S.npcs.su.room = 'west';
      S.npcs.zhao.room = 'shrine';

      if (!S.flags.searched['east_1']) {
        S.flags.searched['east_1'] = true;
        eng.addDoc('doc_carpenter');
        eng.addItem('flat_chisel');
        eng.addItem('ink_line');
        eng.addItem('quicklime');
      }

      eng.pushLog({
        type: 'narration',
        text: '你识破西厢暗流，转身退入破败的东厢柴房。此处没有买命契忌讳，但木门无闩、破窗漏风。干尸怀中已取出《鲁门营造厌胜残谱》、扁铁凿、朱砂墨斗与生石灰——必须在三更前借【东厢拒煞木障拆解台】亲手搭齐三道冷防线！'
      });

      S.sceneId = 'n1_east_defend';
      S.pendingChoices = [
        { label: '打开【东厢鲁门拒煞拆解台】亲手布置墨线、石灰与三角斜撑', action: 'n1_open_east_wb' },
        { label: '布置完毕，熄灯屏息熬过三更刮门与四更寒潮', action: 'n1_east_endure' }
      ];
      eng.emit();
    },

    resolveEastEndure() {
      const eng = E();
      const S = eng.S;
      const wb = S.wb;
      S.clockMin = 25 * 60; // 次日 01:00
      if (global.AudioEngine) global.AudioEngine.playSfx('watchman_bang', { volume: 0.9, pan: 0 });

      let missing = 0;
      if (!wb.eastInkDone) {
        missing++;
        eng.hurtPlayer(22, '门槛未弹朱砂十字墨线！四更寒雾顺门缝倒灌进东厢，冻得你浑身僵麻', false);
      }
      if (!wb.eastLimeDone) {
        missing++;
        eng.hurtPlayer(15, '破窗下未撒生石灰阻潮，阴湿白雾直扑胸口剧烈呛咳', false);
      }
      if (!wb.eastBraceDone) {
        missing++;
        eng.hurtPlayer(25, '破门未用朽木桌斜撑卡死！无目账房伥贴门一推便险些破门而入，你拼死抵门肩头重创', true);
      }
      if (S.stage !== 'play') return;

      if (missing === 0) {
        eng.addContribution(6, '首夜独守东厢以鲁门三法完美拒煞无伤');
        eng.pushLog({
          type: 'system',
          text: '【鲁门三法显灵】子时与丑时，无目账房伥两次贴着东厢破窗缓缓刮过，但朱砂十字墨线、生石灰带与三角木撑死死锁住了阴气，它徘徊十息后只得敲着竹梆退去！'
        });
      }

      // 东厢视角：听到对面西厢与宗祠的惨变（赵川溺亡、林哲死于西厢）
      S.npcs.zhao.alive = false;
      S.npcs.lin.alive = false;
      S.flags.gate_cracked = true;
      if (global.AudioEngine) global.AudioEngine.playSfx('watch');
      eng.pushLog({
        type: 'danger',
        text: '深夜里，东侧宗祠与对面西厢先后传来凄厉惨叫，腕表两次冷酷震动：【考生 CN-08144 已死亡】、【考生 CN-09472 已死亡】。唯有你独守东厢全须全尾活到了天明！'
      });

      this.completeNight1ToDay2();
    },

    // ================= 第一夜路径 C：东侧宗祠泄阴池溺水突围局 =================
    startNight1Shrine() {
      const eng = E();
      const S = eng.S;
      S.night1Path = 'shrine';
      S.room = 'shrine';
      S.clockMin = 21 * 60 + 30;
      S.npcs.zhao.room = 'shrine';
      S.npcs.zhou.room = 'west';
      S.npcs.chen.room = 'west';
      S.npcs.shen.room = 'west';
      S.npcs.lin.room = 'west';
      S.npcs.su.room = 'west';

      if (global.AudioEngine) {
        global.AudioEngine.playBgm('crisis');
        global.AudioEngine.playSfx('sluice_rush');
      }

      eng.pushLog({
        type: 'danger',
        text: '【21:30 · 宗祠泄阴池黑水倒灌】刚过二更半，祠堂青砖缝里突然狂涌出刺骨腥臭的黑水，瞬间漫过膝盖！赵川疯了似的去拉宗祠木门——门闩从外面被黑霜冻死纹丝不动！'
      });
      eng.pushLog({
        type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'injured',
        text: '“怎么会这样！水在涨！供桌底下好像有暗渠水声——快帮我找排水口！”'
      });

      S.sceneId = 'n1_shrine_flood';
      S.pendingChoices = [
        { label: '憋气潜入冰水，打开【宗祠拆解台】用硬铁器撬开供桌水下【泄水石栓】', action: 'n1_open_shrine_wb' },
        { label: '水势已泄／豁出去合力撞开冻门，冒雾冲往西厢拍门求救！', action: 'n1_shrine_breakout' }
      ];
      eng.emit();
    },

    resolveShrineBreakout() {
      const eng = E();
      const S = eng.S;
      if (!S.wb.drainOpened) {
        eng.hurtPlayer(35, '未拔开水下泄水石栓强行顶水撞门！刺骨黑水没过胸口，你险些窒息溺毙才勉强撞裂冻门爬出', true);
        if (S.stage !== 'play') return;
      } else {
        eng.hurtPlayer(10, '泄水石栓撬开后水压骤降，你与赵川合力撞碎外门薄霜，冒着刺骨白雾冲向西厢', false);
      }

      S.flags.zhao_rescued = true;
      S.npcs.zhao.trust += 45;
      S.npcs.zhao.room = 'west';
      S.room = 'west';
      eng.pushLog({
        type: 'narration',
        text: '周衡听见动静拉闩把你和赵川拽进西厢！赵川劫后余生大口喘气，冲你重重点头：“兄弟，这条命你救的，天亮我就把贴身藏的宝贝交给你！”'
      });
      this.enterNight1WestInvestigation();
      eng.emit();
    },

    // ================= 黎明破晓 → 结算第一轮 → 开启第二轮《验契》（第2日白昼） =================
    completeNight1ToDay2() {
      const eng = E();
      const S = eng.S;
      S.roundDone[1] = true;
      S.day = 2;
      S.phase = 'day2';
      S.clockMin = 24 * 60 + 5 * 60 + 30; // 第2日 05:30
      S.round = 2;
      S.watchman.active = false;
      S.room = 'courtyard';

      const deadCount = Object.values(S.npcs).filter(n => !n.alive).length;
      S.worldState = deadCount > 0 ? 'W1' : 'W2';

      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_quiet');
        global.AudioEngine.playSfx('watch');
      }

      eng.addDoc('doc_autopsy');

      eng.pushLog({
        type: 'system',
        text: '【第 2 日 05:30 · 卯时晨钟响彻宅院】\n【第一轮 · 投宿 完成！（基础分 +20）】\n正厅后方原本死锁的酸枝木月洞门“嘎吱”一声无风自开——二进内宅（穿堂、内书房、后罩房停棺堂、西绣楼、后院枯井、黑水河埠）全面解锁！'
      });
      eng.pushLog({
        type: 'system',
        text: '【腕表震动 · 第二轮考题下发】\n【第二轮 · 验契】旧债未清，生人入册。日落酉时前，查明裴宅“岁奉买命”之主契根由，并于中堂落定今夜应账或退契章程。（基础分：35）'
      });
      eng.pushLog({
        type: 'evidence',
        text: S.worldState === 'W1'
          ? '【动态世界态 W1 · 首夜见血，尸煞回阳】清晨验尸记录已归档！二进后罩房里的裴敬之坐尸已吸食一魂，指甲暴长、铜钱渗血——今晚 20:00 便会提前离座索命！但前院大门黑霜已松动一分。'
          : '【动态世界态 W2 · 首夜零亡，凶宅饥渴】全员活过首夜！但凶宅岁奉落空、怨气翻涌——今日白雾将于 17:00 提前压境，且前院大门黑霜铁链彻底焊死，今夜唯有破阵、水路或逆命方可生还！'
      });

      // 安排第 2 日白昼 NPC 自主日程站位
      if (S.npcs.zhou.alive) S.npcs.zhou.room = 'coffin_hall';
      if (S.npcs.chen.alive) S.npcs.chen.room = 'canal';
      if (S.npcs.shen.alive) {
        S.npcs.shen.room = 'embroidery_loft';
        if (S.npcs.shen.cursed && !S.flags.shen_curse_resolved) S.npcs.shen.emotion = 'injured';
      }
      if (S.npcs.zhao.alive) S.npcs.zhao.room = 'east';
      if (S.npcs.lin.alive)  S.npcs.lin.room = 'west';
      if (S.npcs.su.alive)   S.npcs.su.room = 'inner_study';

      S.sceneId = 'free_explore';
      S.pendingChoices = [];
      eng.emit();
    },

    // ================= 第 2 日白昼：各房 NPC 自主剧情与 IF 线分支触发 =================
    checkDay2RoomEvents(roomId) {
      const eng = E();
      const S = eng.S;

      // 1. 西绣楼撞破旧咒发作的沈岚 → IF② 黑市同盟关键抉择！
      if (roomId === 'embroidery_loft' && S.npcs.shen.alive && !S.flags.day2_shen_event) {
        S.flags.day2_shen_event = true;
        eng.pushLog({
          type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'injured',
          text: '你推开西绣楼木门，撞见沈岚正死死捂着渗出黑血的手腕喘息，梳妆台旁散落着她的【镀银手术刀】。“别过来……上一场的阴咒提前发作了。后罩房那具裴氏干尸口中含着一枚百年【借命压舌血玉】，拿到它我就不用死了！”'
        });
        const choices = [];
        if (eng.hasItem('cinnabar_powder')) {
          choices.push({
            label: '【IF② 黑市暗盟】递上【朱砂解毒散】压住她的阴咒，秘密结盟今晚合谋撬棺盗血玉（将与周衡决裂！）',
            action: 'day2_shen_dark_ally'
          });
        } else {
          choices.push({
            label: '【IF② 黑市暗盟】秘不举报，与沈岚口头结盟：先找药奁解毒散，今晚撇开周衡一起撬棺盗血玉！',
            action: 'day2_shen_dark_ally'
          });
        }
        choices.push({
          label: '【正道施压】冷声震慑沈岚，收缴【桐木替死偶】与【镀银手术刀】，承诺带她破除母契一并解咒',
          action: 'day2_shen_redeem'
        });
        S.sceneId = 'day2_shen_choice';
        S.pendingChoices = choices;
      }

      // 2. 东厢偶遇被救活的赵川 → 交付【D级镇宅黄符】
      if (roomId === 'east' && S.npcs.zhao.alive && (S.flags.zhao_warned || S.flags.zhao_rescued) && !S.flags.zhao_gave_talisman) {
        S.flags.zhao_gave_talisman = true;
        eng.addItem('yellow_talisman');
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'calm',
          text: '“兄弟，昨晚多亏你拉我一把。”赵川从贴身内衣里郑重掏出一张叠成三角的【D级镇宅黄符】塞进你掌心，“这是我压箱底的保命符，真撞上后罩房那具死尸，拍出去能硬定住它一回合！”'
        });
      }

      // 3. 黑水河埠偶遇陈默 → 交付【便携震动感应器】＋提示水底铁光与破船
      if (roomId === 'canal' && S.npcs.chen.alive && !S.flags.chen_canal_event) {
        S.flags.chen_canal_event = true;
        eng.addItem('vib_sensor');
        eng.pushLog({
          type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
          text: '陈默蹲在乌篷船边敲了敲船底：“哥们，这水封铁栅锈死了硬掰不开，但枯井那头连着千斤水闸——要是能放水冲开铁栅、再用船棚的桐油麻絮把船缝捻严，今晚咱们直接划船溜出黑雾！对了，我这【便携震动感应器】交给你，入夜贴在穿堂廊柱上，外院那打更怪走到哪儿都能听得一清二楚！”'
        });
      }

      // 4. 西厢撞破崩溃的林哲试图往苏晓包里塞裴氏银锁嫁祸！
      if (roomId === 'west' && S.npcs.lin.alive && !S.flags.lin_framed_su_caught) {
        S.flags.lin_framed_su_caught = true;
        eng.addItem('peis_lock');
        eng.removeItem('peis_lock'); // 封存而非贴身佩戴
        eng.pushLog({
          type: 'dialog', speaker: '林哲', portrait: 'lin', emotion: 'tense',
          text: '你推门进西厢，正好撞见林哲哆哆嗦嗦要把一块裴氏旧银锁塞进苏晓的帆布包！见你撞破，林哲脸色惨白跪坐在地：“我不想死……今晚肯定还要死人填棺的！”'
        });
        eng.pushLog({
          type: 'narration',
          text: '你一把夺过银锁封进破布包扔进冷水缸，冷声喝止了林哲。林哲彻底垮下气焰，发誓今晚老老实实听你调遣、绝不再背后搞鬼。'
        });
      }

      // 5. 后罩房偶遇周衡
      if (roomId === 'coffin_hall' && S.npcs.zhou.alive && !S.flags.zhou_coffin_talk) {
        S.flags.zhou_coffin_talk = true;
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡握紧短斧站在川楠空寿材旁，压低声音：“我刚用斧背试过，椅子上这老鬼肉身硬得像铁，还闻得见活人血味。酉时中堂摊牌前，尽量把内书房和后门水路摸清。”'
        });
      }
    },

    resolveDay2Shen(mode) {
      const eng = E();
      const S = eng.S;
      if (mode === 'dark') {
        S.flags.shen_dark_ally = true;
        S.npcs.shen.alliedDark = true;
        if (eng.hasItem('cinnabar_powder')) eng.removeItem('cinnabar_powder');
        eng.addItem('silver_scalpel');
        eng.pushLog({
          type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
          text: '沈岚深吸一口气，将冰凉的【镀银手术刀】递到你手里，眼底闪过一丝孤注一掷的冷光：“成交。酉时中堂议事，你负责把周衡和陈默支去前院或枯井；入夜后我们去后罩房，我挑断尸口红线，你用扁凿撬牙关，拿到【借命压舌血玉】咱们立刻走水路撤离！”'
        });
      } else {
        S.npcs.shen.exposed = true;
        eng.addItem('substitute_doll');
        eng.addDoc('doc_doll');
        eng.addItem('silver_scalpel');
        eng.pushLog({
          type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'tense',
          text: '沈岚沉默半晌，苦笑一声把【桐木替死偶】与【镀银手术刀】一并推到你面前：“行，我赌你这一把。真能把裴宅母契反噬崩毁、连带斩断我手上的旧咒，今晚我把命交给你调遣。”'
        });
      }
      S.sceneId = 'free_explore';
      S.pendingChoices = [];
      eng.emit();
    },

    // ================= 酉时中堂拍证摊牌大会（完成第二轮 +35分） =================
    triggerDay2Council() {
      const eng = E();
      const S = eng.S;
      S.phase = 'council';
      S.room = 'hall';
      S.flags.confronted_council = true;

      if (global.AudioEngine) global.AudioEngine.playSfx('watch');
      eng.pushLog({
        type: 'system',
        text: '【酉时 · 中堂拍证摊牌大会】\n日落白雾重新漫上马头墙，所有幸存考生齐聚中央正厅！周衡把消防斧重重顿在八仙桌上：“天马上黑透，把你今天查出的硬证据拍到桌上来，定下今晚怎么活着走出这座裴宅！”'
      });

      S.sceneId = 'day2_council_wait';
      S.pendingChoices = [
        { label: '打开【当堂拍证台】，出示至少 2 份铁证并定下今夜总方略！', action: 'open_council_modal' }
      ];
      eng.emit();
    },

    completeCouncil(selectedIds, chosenPlan) {
      const eng = E();
      const S = eng.S;
      if (!selectedIds || selectedIds.length < 2) {
        S.toast = '空口白牙没人信！请至少勾选 2 份已搜集的原件或实物证物拍上桌面！';
        eng.emit();
        return false;
      }

      S.roundDone[2] = true;
      S.councilRoute = chosenPlan;
      S.phase = 'night2';
      S.round = 3;
      S.clockMin = 24 * 60 + 18 * 60 + 5; // 第2夜 18:05
      S.watchman.active = true;
      S.watchman.zone = 'gate';
      S.modal = null;

      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_stealth');
        global.AudioEngine.playSfx('watch');
      }

      eng.pushLog({
        type: 'system',
        text: '【第二轮 · 验契 完成！（基础分 +35）】\n【腕表震动 · 第三轮考题下发】\n【第三轮 · 断岁】三更催命，五更封棺。天明（05:00）之前，了结岁奉因果，活着离开白雾边界。（基础分：45）'
      });

      if (chosenPlan === 'IF2') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'well';
        if (S.npcs.chen.alive) S.npcs.chen.room = 'well';
        if (S.npcs.shen.alive) S.npcs.shen.room = 'coffin_hall';
        eng.pushLog({
          type: 'narration',
          text: '你不动声色抛出水路图说把周衡与陈默支去后院枯井勘察。沈岚冲你极轻地点了点头，先行滑进二进【后罩房·川楠停棺堂】等候你动手撬颌取玉！'
        });
      } else if (chosenPlan === 'M2') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'canal';
        if (S.npcs.chen.alive) S.npcs.chen.room = 'well';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '“好！不跟停棺堂里那老尸硬拼，走水路冲铁栅！陈默去枯井守绞盘，我去河埠断后，你速去宗祠拔泄水石栓、开闸修船！”'
        });
      } else if (chosenPlan === 'IF1') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'hall';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '“你要拿那孩子的银锁和死契直接去堵巡夜账房伥？太疯了……但我给你压阵！带着【秦小栓银锁与祭河死契】去【二进穿堂】直面骨梆吧！”'
        });
      } else if (chosenPlan === 'IF3') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'coffin_hall';
        if (S.npcs.zhao.alive) S.npcs.zhao.room = 'coffin_hall';
        if (S.npcs.shen.alive) S.npcs.shen.room = 'coffin_hall';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '“七个人一个都不死，把裴贼自己的八字刻上替死偶倒钉进棺材？好胆色！”周衡大笑一声提斧起身，“我和赵川去后罩房死架尸煞，你先起出宗祠丧门钉，随后直奔【后罩房】亲手钉棺逆命！”'
        });
      } else {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'hall';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '“就按鲁门残谱拔三钉、阴灰撕总契！记住：第二夜既有外院账房伥听声，又有内宅尸煞闻血，受了伤务必第一时间用绷带封口！”'
        });
      }

      S.sceneId = 'free_explore';
      S.pendingChoices = [];
      eng.emit();
      return true;
    },

    // ================= 第二夜辅助战术动作（部署震动器 / 挂铜壶声饵） =================
    deployVibSensor() {
      const eng = E();
      const S = eng.S;
      if (!eng.hasItem('vib_sensor')) return;
      S.flags.vib_deployed = true;
      eng.pushLog({
        type: 'system',
        text: '你将陈默的【便携震动感应器】贴死在廊柱暗处！右侧拓扑图现已开启实时红色雷达环，精确标示外院无目账房伥与内宅裴氏尸煞的当前巡区！'
      });
      eng.emit();
    },

    setKettleDecoy() {
      const eng = E();
      const S = eng.S;
      if (!eng.hasItem('copper_kettle')) return;
      S.watchman.decoyTurns = 2;
      S.watchman.decoyZone = S.room === 'well' ? 'well' : 'east';
      eng.removeItem('copper_kettle');
      eng.pushLog({
        type: 'system',
        text: `你将【漏底盛水铜壶】高高悬在【${DATA().ROOMS[S.watchman.decoyZone].short}】木梁上——细密水滴敲打青石板的清脆回音，将在接下来 2 个回合内把无目账房伥死死引偏！`
      });
      eng.emit();
    },

    // ================= 六大终局触发器（3 主线 + 3 真·IF 线） =================
    triggerEndingAction(endingKey) {
      const eng = E();
      const S = eng.S;

      // M1：正门崩霜堂堂正正走出
      if (endingKey === 'M1') {
        if (!S.flags.gate_unsealed) {
          S.toast = '大门黑霜铁链尚未崩断！请拔齐 3 枚锁宅钉后在正厅神龛以湿阴灰撕毁《买命总契》。';
          eng.emit();
          return;
        }
        const rank = S.wb.contractTorn ? 'A+ 级 · 鲁门破阵正门崩霜' : 'A 级 · 烈火破契冲出正门';
        eng.finishExam(
          'M1_orthodox',
          rank,
          '三钉尽拔，百年买命总契化作飞灰！前院朱漆大门黑霜铁链寸寸崩断，你与幸存队友堂堂正正迈出白雾古宅，周衡与陈默对你彻底折服，正式结为过命搭档。',
          S.npcs.zhou.alive ? 'zhou_squad' : 'lone_wolf',
          null
        );
      }

      // M2：黑水河埠撑乌篷船渡雾
      else if (endingKey === 'M2') {
        if (!S.wb.sluiceBlasted || !S.wb.boatRepaired) {
          S.toast = '水路尚未打通！须先拔宗祠泄水石栓→枯井提开千斤闸轰碎铁栅，并用桐油麻絮修妥乌篷船！';
          eng.emit();
          return;
        }
        if (global.AudioEngine) global.AudioEngine.playSfx('oar_water');
        eng.addContribution(15, '水口开闸轰碎铁栅并撑乌篷船夜渡黑水河');
        eng.finishExam(
          'M2_canal',
          'A+ 级 · 水口破栅舟渡黑雾',
          '千钧激流轰碎水封铁栅！周衡持斧断后逼退尸煞三息，你与陈默、苏晓摇动乌篷船木橹劈开墨黑死水，迎着破晓微光冲出白雾边界！',
          S.npcs.zhou.alive ? 'zhou_squad' : 'lone_wolf',
          null
        );
      }

      // M3：顺契抵命窄缝苟活
      else if (endingKey === 'M3') {
        if (!S.flags.gate_cracked) {
          S.toast = '前院正门黑霜严丝合缝！唯有宅内已有人填命上契（世界态 W1）大门才会裂开窄缝。';
          eng.emit();
          return;
        }
        eng.finishExam(
          'M3_sacrifice',
          'C- 级 · 顺契苟活窄缝脱逃',
          '你没有去碰那座吃人的大阵，趁着替死鬼填满买命契、正门黑霜松裂一线之机独自侧身挤出白雾。虽捡回一条命，但毫无破局贡献分，周衡对你只剩冷淡戒备。',
          'lone_wolf',
          null
        );
      }

      // IF①：二进穿堂拍出银锁死契，策反无目账房伥弑主！
      else if (endingKey === 'IF1') {
        if (!eng.hasItem('child_lock_deed')) {
          S.toast = '缺少【秦小栓银锁与祭河死契】！请先去黑水河埠用铁钩麻绳打捞沉水小铁匣。';
          eng.emit();
          return;
        }
        S.watchman.state = 'REBELLED';
        S.corpseBoss.sealed = true;
        eng.addContribution(15, '以幼童银锁死契策反无目账房伥弑主同归于尽');
        if (global.AudioEngine) {
          global.AudioEngine.playSfx('watchman_bang', { volume: 1.0, pan: 0 });
          setTimeout(() => global.AudioEngine.playSfx('coffin_slide'), 700);
        }
        eng.finishExam(
          'IF1_watchman_rebel',
          'S 级真·IF ① · 账房还魂反水弑主',
          '你在穿堂独自直面无目账房伥，将【秦小栓长命银锁与祭河死契】狠狠拍上竹骨梆！老仆秦伯空洞眼窝泣下两行黑血，仰天悲嚎着撞碎后罩房木门，死死抱住裴敬之尸煞滚入川楠寿材自焚俱灭！你在灰烬中拾得唯一跨场规则奇物【引魂竹骨梆（D+）】！',
          S.npcs.zhou.alive ? 'zhou_squad' : 'lone_wolf',
          'bone_clapper'
        );
      }

      // IF②：伙同沈岚开棺窃取【借命压舌血玉】，与周衡彻底决裂！
      else if (endingKey === 'IF2') {
        if (!S.corpseBoss.jadeTaken) {
          S.toast = '尚未取得【乙丑借命压舌血玉】！请在后罩房拆解台配合镀银手术刀与扁凿撬开坐尸牙关。';
          eng.emit();
          return;
        }
        S.flags.zhou_betrayed = true;
        eng.finishExam(
          'IF2_shen_blood_jade',
          'S 级真·IF ② · 黑市同盟开棺窃玉（邪道决裂）',
          '滚烫的【乙丑借命压舌血玉】落入掌心，裴氏尸煞狂暴掀翻太师椅！周衡闻变赶回挥斧硬架尸煞掩护新人，怒目盯着你与沈岚低喝“滚，下场别让我碰见你们”！你与沈岚借黑雾亡命脱出，跨场档案锁定为【黑市双人组】暗线切入第 2 场《黑水船坞》！',
          'black_market_duo',
          'blood_jade'
        );
      }

      // IF③：七人逆命·替死偶刻八字倒钉川楠寿材真结局！
      else if (endingKey === 'IF3') {
        if (!S.corpseBoss.sealed) {
          S.toast = '尚未完成反钉封棺！请在后罩房拆解台将【桐木替死偶】刻上裴敬之八字，以【第二钉·倒插丧门钉】倒钉入川楠空棺！';
          eng.emit();
          return;
        }
        const allAlive = Object.values(S.npcs).every(n => n.alive);
        const rank = allAlive
          ? 'SS 级真·IF ③ · 七人逆命替死反钉（完美宗师真结局）'
          : 'S+ 级真·IF ③ · 替死反钉逆转封棺（C级权限解锁）';
        eng.finishExam(
          'IF3_seven_survivors',
          rank,
          '七寸丧门钉贯透刻满裴贼八字的桐木替死偶死死钉入川楠寿材！整座买命大阵轰然倒转，裴氏尸煞被活生生吸进棺内合盖永封，沈岚手腕上的旧场黑咒亦随母契崩解烟消云散！幸存众人迎着破晓微光踏出正门，死考空间深红旋涡破格为你开放【C 级查看权限】！',
          'zhou_squad',
          null
        );
      }
    },

    // 分发按钮回调
    dispatch(action) {
      const eng = E();
      const S = eng.S;
      if (action === 'scene_gate_shock') return this.scene_gate_shock();
      if (action === 'set_callsign_real') return this.finishCallsign('陆寻');
      if (action === 'set_callsign_alias') return this.finishCallsign('七号');
      if (action === 'n1_choose_west_save_zhao') return this.startNight1West(true);
      if (action === 'n1_choose_west') return this.startNight1West(false);
      if (action === 'n1_choose_east') return this.startNight1East();
      if (action === 'n1_choose_shrine') return this.startNight1Shrine();
      if (action === 'n1_rescue_zhao_yes') return this.resolveWestZhaoRescue(true);
      if (action === 'n1_rescue_zhao_no') return this.resolveWestZhaoRescue(false);
      if (action === 'n1_borrow_watch') {
        eng.addDoc('doc_watch');
        eng.pushLog({ type: 'evidence', text: '你借口核对机械表工艺，从林哲手里借来【鎏金怀表】端详了一番（已收入原件台，快点开原件台撬开背盖细查！）。' });
        this.refreshWestPrepChoices();
        S.modal = { type: 'doc', id: 'doc_watch', pageIdx: 0 };
        eng.emit();
        return;
      }
      if (action === 'n1_quick_search_west') {
        this.searchCurrentRoom();
        this.refreshWestPrepChoices();
        eng.emit();
        return;
      }
      if (action === 'n1_open_west_wb') {
        S.modal = { type: 'wb', id: 'wb_couch_jar', partId: 'floorboard' };
        eng.emit();
        return;
      }
      if (action === 'n1_west_confront_open') {
        S.modal = { type: 'confront', context: 'night1_shen', selected: [] };
        eng.emit();
        return;
      }
      if (action === 'n1_west_route_b') return this.resolveWestMidnight('B');
      if (action === 'n1_west_route_c') return this.resolveWestMidnight('C');
      if (action === 'n1_open_east_wb') {
        S.modal = { type: 'wb', id: 'wb_east_defense', partId: 'threshold_ink' };
        eng.emit();
        return;
      }
      if (action === 'n1_east_endure') return this.resolveEastEndure();
      if (action === 'n1_open_shrine_wb') {
        S.modal = { type: 'wb', id: 'wb_shrine_nail', partId: 'drain_plug' };
        eng.emit();
        return;
      }
      if (action === 'n1_shrine_breakout') return this.resolveShrineBreakout();
      if (action === 'day2_shen_dark_ally') return this.resolveDay2Shen('dark');
      if (action === 'day2_shen_redeem') return this.resolveDay2Shen('redeem');
      if (action === 'open_council_modal') {
        S.modal = { type: 'confront', context: 'day2_council', selected: [], chosenPlan: 'M1' };
        eng.emit();
        return;
      }
    },

    // 首夜当堂拆穿沈岚拍证校验
    submitNight1Confront(selectedIds) {
      const eng = E();
      const S = eng.S;
      const hasWatchProof = selectedIds.includes('doc_watch') || selectedIds.includes('wood_shavings');
      const hasLedgerOrSu = selectedIds.includes('doc_ledger') || selectedIds.includes('doc_shrine_note');
      if (!hasWatchProof) {
        S.toast = '空口指责只会打草惊蛇！请先撬开【鎏金怀表】背盖取得带血酒精桐木屑，再把【鎏金怀表】或【桐木屑】拍在周衡面前！';
        eng.emit();
        return false;
      }
      if (!S.flags.watch_pried) {
        S.toast = '你还没撬开【鎏金怀表】的铜背盖，光靠表壳本身不足以证明沈岚做了手脚！';
        eng.emit();
        return false;
      }
      if (!hasLedgerOrSu && !S.flags.ledger_slit) {
        eng.pushLog({
          type: 'narration',
          text: '你把撬开的怀表与带血酒精桐木屑直接拍在桌上——虽然尚未裁开账册封底，但苏晓的目击与怀表里的鲜血木屑已经足够让周衡彻底看穿沈岚的杀局！'
        });
      }
      S.modal = null;
      this.resolveWestMidnight('A');
      return true;
    }
  };

  global.EXAM1_STORY = Story;
})(typeof window !== 'undefined' ? window : globalThis);
