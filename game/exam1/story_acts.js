// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.1 — 三轮八幕剧本、机械女声播报、同房交谈与六大主线/IF线控制器
// ============================================================================
(function (global) {
  'use strict';

  const E = () => global.EXAM1_ENGINE;
  const DATA = () => global.EXAM1_DATA;

  function addressPlayer(S, politeSuffix) {
    if (S.flags.troll_alias) return '你';
    if (politeSuffix && S.callsign && S.callsign.length <= 2) return S.callsign;
    return S.callsign || '你';
  }

  const Story = {
    // ================= 序幕三拍：雨巷白雾 → 60秒倒计时与机械女声 → 坠入裴宅 =================
    selectOrigin(originId) {
      const eng = E();
      const orig = DATA().ORIGINS.find(o => o.id === originId);
      if (!orig) return;

      eng.init('play');
      const S = eng.S;
      S.origin = originId;
      S.stats = Object.assign({}, orig.stats);
      S.phase = 'prologue';
      S.clockMin = 20 * 60 + 30;
      S.room = 'courtyard';
      eng.addItem(orig.startItem);

      if (global.AudioEngine) {
        global.AudioEngine.unlock();
        global.AudioEngine.playBgm('alley');
      }

      eng.pushLog({
        type: 'narration',
        text: `细雨落在江南旧巷的青石板上。你是【${orig.name}】陆寻。${orig.bond}`
      });
      eng.pushLog({
        type: 'narration',
        text: '巷口那盏老式钠灯滋滋闪了两下，彻底暗了下去。浓得化不开的灰白雾气贴着墙根逆风漫过鞋背，气温在几秒内骤降十余度，连雨点砸在伞面和瓦片上的声音都被雾层吞得一干二净。'
      });

      S.sceneId = 'prologue_mist';
      S.pendingChoices = [
        { label: '摸出手机查看信号与时间', action: 'prologue_probe_phone' },
        { label: '贴着潮湿砖墙快步退回街口', action: 'prologue_probe_walk' },
        { label: '停在原地，按职业本能观察雾气与体感异常', action: 'prologue_probe_sense' }
      ];
      eng.emit();
    },

    prologueProbe(mode) {
      const eng = E();
      const S = eng.S;
      S.clockMin = 20 * 60 + 33;

      if (mode === 'phone') {
        eng.pushLog({
          type: 'narration',
          text: '屏幕亮起刺眼的冷白光。右上角满格信号已经变成一个陌生的灰白色「×」，紧急呼叫拨不出去，时间死死停在 20:32，跳动不了一秒。'
        });
      } else if (mode === 'walk') {
        eng.pushLog({
          type: 'narration',
          text: '你加快步子往来路疾退。沿着墙根走出三十余步，手掌按上的却仍是刚才那块缺了半角的青砖。巷口彻底没了去路，四周安静得只剩你自己的呼吸声。'
        });
      } else {
        const senseText = {
          arch: '你伸手接了一缕飘过指尖的白雾——掌心没有湿润水汽，反而起了一层极薄的干冷白霜。雾线像被无形穹顶死死压在两丈高处，绝非自然气象。',
          climb: '你屈膝稳住重心，深吸了一口气。空气干燥发涩，气压比刚才低了一截，体表热量正在以反常的速度往外散。',
          archive: '你辨出雾里混着一股潮湿腐木与陈年冷香灰的味道——和老巷里常见的雨水腥气完全不同，倒像推开了封死几十年的阴湿老宅。',
          medic: '你两指按住自己颈动脉数了五秒：心率偏快但节律规整，视野边缘没有散瞳或眩晕感。不是迷药，也不是致幻。'
        };
        eng.pushLog({
          type: 'narration',
          text: senseText[S.origin] || '你强迫自己稳住呼吸，确认眼前的白雾并非幻觉。'
        });
      }

      eng.pushLog({
        type: 'narration',
        text: '左手腕骨猛地一沉。一只通体哑黑、找不到任何卡扣接缝的金属腕表不知何时死死贴合在皮肤上，冷得像块刚从冰水里捞出的铁片。表盘暗红微光亮起，跳出一串编号【CN-09471】与猩红倒计时【00:59】。'
      });
      eng.pushLog({
        type: 'narration',
        text: '下一瞬，一道毫无起伏、听不出半点活人情绪的冰冷机械女声，在白雾与颅骨深处同时响起——'
      });
      eng.pushBroadcast(
        'sys_intro_60s',
        '已锁定适格考生，编号 C-N-零九四七一。欢迎来到全球死考。首场考核将在六十秒后载入。考核期间，一切死亡均为真实死亡；严禁强行剥离或损毁腕表，违者即刻抹杀。',
        '【机械女声通告】\n「已锁定适格考生：CN-09471。欢迎来到全球死考。首场考核将在 60 秒后载入。考核期间，一切死亡均为真实死亡；严禁强行剥离或损毁腕表，违者即刻抹杀。」'
      );

      S.sceneId = 'prologue_countdown';
      S.pendingChoices = [
        { label: '借手边硬物硬撬金属表带', action: 'prologue_cd_pry' },
        { label: '压住心悸，低头核对表盘并确认随身物件在手', action: 'prologue_cd_check' },
        { label: '趁倒计时未归零，从墙根摸半块沉手青砖揣进兜里', action: 'prologue_cd_brick' }
      ];
      eng.emit();
    },

    prologueCountdown(mode) {
      const eng = E();
      const S = eng.S;
      S.clockMin = 20 * 60 + 35;

      if (mode === 'pry') {
        S.hp = Math.max(1, S.hp - 4);
        eng.pushLog({
          type: 'danger',
          text: '你发力去别表带边缘，表背瞬间弹出一道暗蓝电弧，左腕皮肤一阵焦麻剧痛，表身纹丝不动（HP -4）。'
        });
        eng.pushBroadcast(
          'sys_intro_warn',
          '警告。检测到剥离腕表企图。再次尝试，即刻抹杀。',
          '【机械女声通告】\n「警告。检测到剥离腕表企图。再次尝试，即刻抹杀。」'
        );
      } else if (mode === 'check') {
        S.stats.WIL += 1;
        eng.pushLog({
          type: 'narration',
          text: '你逼自己移开视线不再纠结表带，快速扫过表盘：除编号、时间、心率折线和倒计时外，其余栏位全暗。你伸手按了按随身物件，确认它仍在触手可及的位置（意志 +1）。'
        });
      } else if (mode === 'brick') {
        eng.addItem('wet_brick');
        eng.pushLog({
          type: 'narration',
          text: '你俯身从湿冷墙根摸起半块边缘粗糙的湿青砖塞进外套口袋。不管雾后面是什么，手里多一块能砸出响动的硬物总没坏处。'
        });
      }

      eng.pushLog({
        type: 'narration',
        text: '表盘猩红数字滑至最后三秒。白雾骤然向内坍缩，冷硬的女声一字一顿砸在耳膜上——'
      });
      eng.pushBroadcast(
        'sys_intro_zero',
        '三、二、一。场景投送完成。',
        '【机械女声通告】\n「三、二、一。场景投送完成。」'
      );
      eng.pushLog({
        type: 'narration',
        text: '脚下青石板瞬间踏空。失重感猛地砸落，鞋底狠狠磕在另一片冰冷湿滑的青石地上。腐木、潮土与陈年阴灰的气息灌入鼻腔——你已经站在一座荒废多年的民国二进青砖大宅前院里，厚重的朱漆大门在身后沉闷合死，三丈马头墙外翻涌着密不透风的白雾。'
      });

      S.sceneId = 'intro_courtyard_awake';
      S.pendingChoices = [
        { label: '稳住重心，迅速扫视院内其余六人', action: 'scene_gate_shock' }
      ];
      eng.emit();
    },

    // ================= 第一幕：前院初醒、下马威、冷酷交底与自定义报号 =================
    scene_gate_shock() {
      const eng = E();
      const S = eng.S;
      S.clockMin = 20 * 60 + 40;
      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_quiet');
        global.AudioEngine.playSfx('door_slam', { volume: 0.55 });
      }

      eng.pushLog({
        type: 'narration',
        text: '天井里连你在内一共七个人。你身侧跌坐着一男一女——穿湿皱西装的年轻男人，和一个背着帆布包、半边眼镜摔歪在地的女生。而对面廊檐台阶下早已分开站着四个神色冷硬的人：一个拎着短柄暗青消防斧的寸头男人，一个蹲在石阶边检查工具包的工装青年，一个靠在廊柱阴影里的暗灰冲锋衣女人，以及正烦躁扯着皮夹克往大门张望的胡茬汉子。'
      });
      eng.pushLog({
        type: 'dialog', speaker: '帆布包女生', portrait: 'su', emotion: 'tense',
        text: '女生发着抖扶正眼镜，摸着死机的手机声音发颤：“刚才巷子里那个女声……你们脑子里也听见了吗？这到底是哪儿……”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '西装男', portrait: 'lin', emotion: 'tense',
        text: '西装男扶着石板爬起来，目光死死盯住周衡手里的消防斧，声音发紧却强撑着镇定：“你们是什么人？绑架勒索还是搞暗网直播？要钱好商量，别动家伙——”'
      });
      eng.pushLog({
        type: 'narration',
        text: '话音未落，他瞥见身后虚掩般的朱漆大门，转身两步冲过去一把攥住青铜门环猛拉。工装青年刚抬手想出声拦，拎斧的男人伸手按住他肩头，没动。下一瞬，门环上那层暗青硬霜骤然粘破西装男掌心，一股刺骨寒力将他整个人掀翻在青石板上。他惨叫着去扯左腕黑表，表背爆出一缕蓝白电弧，把他手指灼得一片焦黑。'
      });
      eng.pushLog({
        type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
        text: '拎斧男人扫了一眼门缝外没有异动的白雾，收回目光，声音低沉平淡：“不吃亏不长记性。陈默，趁还没发题，把死考的底交了。赵川，手离门栓远点。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
        text: '叫陈默的工装青年把金属改锥插回裤袋，蹲在台阶边，语气冷淡实在：“省省力气别找摄像头了。前阵子网上闹得沸沸扬扬、后来全网删干净的那些事——大雾里活人凭空消失，隔几天从半空黑窟窿里掉出死尸——不是谣言，那就是没活着出考场的考生。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
        text: '“手腕这玩意儿叫死考腕表，咱们现在在【全球死考】的考场里。考场什么路数都有：我头一回碰见的是地底吃人的怪物，上一场是见血就疯的活尸。至于这座老宅里藏着什么杀招，等腕表发了题、摸出线索才知道，没见着正主前谁也别瞎猜。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
        text: '“活命的规矩就两条。第一，考核一般分几轮发题，除了保底基础分，破局出力越多额外贡献分越高；第二，就算活着通关回‘死考空间’，系统先硬扣 60 分基础费，缺胳膊少腿要修复另算——净分扣成负数，当场抹杀。别指望躲在角落混日子，咱们几个老手犯不着白害你们，但也绝不会拿命给蠢货兜底。”'
      });

      S.sceneId = 'intro_courtyard_probe';
      S.pendingChoices = [
        { label: '打量四人随身器物，向陈默追问“老手资历与空间兑换”', action: 'intro_probe_gear' },
        { label: '直视周衡询问底线：“真撞上死局，老手会拿新人探路吗？”', action: 'intro_probe_zhou' },
        { label: '蹲下帮发抖的女生稳住呼吸，顺带细看西装男掌心的冻痕', action: 'intro_probe_su' }
      ];
      eng.emit();
    },

    introCourtyardProbe(mode) {
      const eng = E();
      const S = eng.S;
      S.clockMin = 20 * 60 + 41;

      if (mode === 'gear') {
        S.npcs.chen.trust += 8;
        eng.pushLog({
          type: 'narration',
          text: '你目光掠过周衡手里的暗青短斧与陈默腰间的改锥，平静发问：“这些家伙，都是你说的死考空间里换的？”'
        });
        eng.pushLog({
          type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
          text: '陈默扯了扯嘴角：“眼挺尖。通关扣完 60 分剩下的净分，能在空间里换装备、药剂甚至超凡强化。周队历过三场，我跟沈姐两场，老赵一场。不过别迷信手里那点硬货——碰上讲规矩的考场，踩错线照样一秒死。”'
        });
      } else if (mode === 'zhou') {
        S.npcs.zhou.trust += 10;
        eng.pushLog({
          type: 'narration',
          text: '你迎着周衡的视线开口：“规矩听明白了。但我怎么确定，真遇上死路时你们不会推新人垫背？”'
        });
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '旁边的赵川嗤了一声想顶嘴，被周衡抬手按住。周衡神色不动：“进死考前我干了八年消防班长。我不拿活人探雷，但也绝不替找死的人卖命。待会儿发了题各凭本事查，谁说得对、拿得出硬证据，就听谁的。”'
        });
      } else {
        S.npcs.su.trust += (S.origin === 'medic' ? 16 : 10);
        eng.pushLog({
          type: 'narration',
          text: S.origin === 'medic'
            ? '你半蹲下来轻按女生手腕帮她放慢过度换气的节奏，同时瞥了眼西装男发青的伤口——创面边缘凝着微细冰晶，不是普通低温，更像表皮热量被瞬间抽干。'
            : '你蹲下来递过纸巾让女生缓口气，余光扫过西装男手掌——冻伤边缘界限极齐，表皮发青发脆，碰一下就可能裂口。'
        });
        eng.pushLog({
          type: 'dialog', speaker: '苏晓', portrait: 'su', emotion: 'tense',
          text: '女生攥紧纸巾吸了口气，声音轻了不少：“谢谢……我、我叫苏晓。”'
        });
      }

      eng.pushLog({
        type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
        text: '穿皮夹克的赵川不耐烦地一挥手：“行了，我叫赵川。你们三个新来的赶紧报个称呼，待会儿乌漆嘛黑的连喊人都抓瞎。”'
      });
      eng.pushLog({
        type: 'narration',
        text: '地上的西装男捂着焦黑手腕喘息着报了“林哲”，女生也低声确认自己叫“苏晓”。'
      });
      eng.pushLog({
        type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
        text: '一直靠在廊柱阴影里的暗灰冲锋衣女人走近两步，从兜里摸出一片独立包装的医用酒精棉扔到林哲膝边，声音冷静平稳：“沈岚，进这儿前在急诊科。你手上是表皮冻裂加轻度电灼，先把渗血按住。——这位朋友，怎么称呼？”'
      });

      S.sceneId = 'choose_callsign';
      S.pendingChoices = [];
      eng.emit();
    },

    submitCallsign(rawInput) {
      const eng = E();
      const S = eng.S;
      const res = eng.classifyCallsign(rawInput);

      if (res.kind === 'invalid') {
        S.toast = res.msg;
        eng.emit();
        return false;
      }

      if (res.kind === 'npc_conflict') {
        const target = S.npcs[res.npcId];
        if (target) target.trust = Math.max(0, target.trust - 8);
        S.toast = null;
        eng.pushLog({
          type: 'narration',
          text: `你脱口报了个「${res.name}」。`
        });
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡眼神冷了下来：“拿同场活人的名字寻开心？别浪费时间，重报一个。”'
        });
        eng.emit();
        return false;
      }

      S.toast = null;
      S.callsign = res.name;
      S.usedRealName = (res.kind === 'real');
      S.clockMin = 20 * 60 + 42;
      S.phase = 'protect';
      S.round = 1;

      if (res.kind === 'troll') {
        S.flags.troll_alias = true;
        Object.values(S.npcs).forEach(n => {
          n.trust = Math.max(0, n.trust - 15);
          n.suspicion = Math.min(100, n.suspicion + 15);
        });
        eng.pushLog({
          type: 'narration',
          text: `你面不改色地报了个「${res.name}」。天井里骤然死寂了两秒。`
        });
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
          text: '赵川冷笑一声啐了口唾沫：“死到临头还犯贱，这种货色活不过上半夜。”'
        });
        eng.pushLog({
          type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
          text: '沈岚眼神瞬间冷得像在看一具尸体，不再多看你一眼，转身退回廊下。'
        });
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡面无表情瞥了你一眼：“嘴不干净没人替你收尸。管好你自己。”'
        });
      } else {
        eng.pushLog({
          type: 'narration',
          text: res.kind === 'real'
            ? '你报出自己的名字：“陆寻。”周衡和沈岚各自微微颔首记下，没人多话。'
            : `面对一群来历不明且带着利器的陌生人，你随口报了个称呼：“${res.name}。”周衡和沈岚不动声色记下，谁也没多问。`
        });
      }

      eng.pushBroadcast(
        'sys_round1_start',
        '第一轮考核：投宿。白雾封门，择屋过夜，活过今夜五更天明。基础分，二十分。新手保护期，十分钟，计时开始。',
        '【机械女声通告 · 第一轮考题下发】\n「第一轮考核：投宿。白雾封门，择屋过夜，活过今夜五更天明（05:00）。基础分：20。新手保护期：10:00，计时开始。」'
      );
      eng.pushLog({
        type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
        text: '周衡看了一眼腕表：“保护期只有十分钟，跨屋查东西费时间，一个人跑不完整个前院。各自挑片地方摸底，20:52 保护期结束前在前院碰头定过夜的屋子。”'
      });
      eng.pushLog({
        type: 'narration',
        text: '话音未落，几人迅速散开：周衡拎着短斧进了正厅，沈岚快步转向西厢，赵川阴沉着脸往东侧宗祠走去，陈默、林哲与苏晓暂留在前院附近。'
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
      return true;
    },

    // ================= 自由探索核心动作（跨房 / 搜查 / 同房交谈 / 声饵） =================
    moveToRoom(roomId) {
      const eng = E();
      const S = eng.S;
      const target = DATA().ROOMS[roomId];
      if (!target) return;

      if (S.room === roomId) return;
      if (target.court === 2 && S.day === 1) {
        S.toast = '通往二进内宅的酸枝木月洞门从内侧死死反锁，今夜推不开。';
        eng.emit();
        return;
      }

      if (S.phase === 'night1' && !S.flags.night1_free_move) {
        S.toast = '夜雾已封门，请通过当前局面选项行动。';
        eng.emit();
        return;
      }

      const cost = S.phase === 'day2' ? 15 : (S.phase === 'protect' ? 1 : 6);
      S.room = roomId;
      eng.advanceTime(cost);

      if (S.stage !== 'play') return;

      eng.pushLog({
        type: 'narration',
        text: `【${eng.getRoomName(roomId)}】${S.day === 1 ? target.descDay1 : (S.phase === 'day2' ? target.descDay2 : target.descNight2)}`
      });

      this.checkTimeTriggers();
      if (S.phase === 'day2') this.checkDay2RoomEvents(roomId);
      eng.emit();
    },

    searchCurrentRoom() {
      const eng = E();
      const S = eng.S;
      const r = S.room;
      const cost = S.phase === 'day2' ? 20 : (S.phase === 'protect' ? 2 : 8);

      if (S.flags.searched[r + '_' + S.day]) {
        S.toast = '明面物件已经翻检过了。如需拆检器物机关，可直接打开本室拆解台或翻看原件档案夹。';
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
          text: '你在前院廊柱杂物堆里翻出一根沉手的【生锈铁撬棍】和一只尚有余油的旧【煤油打火机】。'
        });
      } else if (r === 'west') {
        eng.addDoc('doc_ledger');
        eng.addItem('cold_lard');
        eng.addItem('damp_ash');
        eng.addItem('copper_kettle');
        eng.pushLog({
          type: 'evidence',
          text: '你在外间灶台收起半罐凝固的【陶罐冷猪油】、一捧潮冷的【湿阴香灰／冷灶灰】和一只底有细眼的【漏底盛水铜壶】；里间账桌抽屉里压着一册暗红洒金的《裴宅西厢 · 乙丑年岁奉支应册》（已收入原件夹）。'
        });
      } else if (r === 'east') {
        eng.addDoc('doc_carpenter');
        eng.addItem('flat_chisel');
        eng.addItem('ink_line');
        eng.addItem('quicklime');
        eng.pushLog({
          type: 'evidence',
          text: '你从干尸僵硬的怀里抽出一卷染血油布册《鲁门营造厌胜残谱 · 陈七绝笔》（已收入原件夹），又拾起地上的【鲁门扁铁凿】、【朱砂木工墨斗】与墙角【半袋生石灰】。'
        });
      } else if (r === 'shrine') {
        eng.addDoc('doc_shrine_note');
        eng.pushLog({
          type: 'evidence',
          text: '你蹲下身探手摸进供桌底缝，抽出一张下半截被黑水泡烂的现代方格笔记本残页（已收入原件夹）。青砖缝冷得刺骨，指尖沾了一层发腥的湿泥。'
        });
      } else if (r === 'hall') {
        eng.addDoc('doc_master_contract');
        eng.addItem('wet_rag');
        eng.pushLog({
          type: 'evidence',
          text: '你绕到无目画像下方，透过神龛木栅缝隙看见里面供着一纸覆满白霜的《乙丑岁奉买命总契》（已记入原件夹），又在廊边旧水桶旁拎起一块厚实的【厚麻布湿团】。'
        });
      } else if (r === 'inner_study') {
        eng.addDoc('doc_hydro_map');
        eng.pushLog({
          type: 'evidence',
          text: '你从青瓷画筒里抽出一卷发黄的《裴氏宗祠水脉改道图说》（已收入原件夹）。紫檀书案正中摆着一只镶有四道黄铜滑尺的暗榫木匣。'
        });
      } else if (r === 'embroidery_loft') {
        eng.pushLog({
          type: 'narration',
          text: '梳妆台上敞着一只旧樟木药奁，指节轻敲底板发出空洞木响，缝隙极细。'
        });
      } else if (r === 'coffin_hall') {
        S.flags.autopsy_done = true;
        eng.pushLog({
          type: 'narration',
          text: S.worldState === 'W1'
            ? '太师椅上的干尸眼窝铜钱正渗着暗红血丝，十指指甲比寻常死尸长出寸许，紧抿的唇缝里隐约透出一线血红玉光；旁侧川楠空棺底板刻着子午暗槽。'
            : '太师椅上的干尸眼窝钉着两枚暗青铜钱，双唇死死咬合，缝隙里隐约透出一线暗红微光；旁侧川楠空棺底板刻着子午暗槽，槽底泛着一层黏腻阴油。'
        });
      } else if (r === 'well') {
        eng.addItem('iron_hook_rope');
        eng.pushLog({
          type: 'evidence',
          text: '你在枯井石台旁拾起一盘结实的【铁钩麻绳】。井旁架着一台挂了大铜锁的熟铁绞盘。'
        });
      } else if (r === 'canal') {
        eng.addItem('tung_oil_hemp');
        eng.pushLog({
          type: 'evidence',
          text: '你在河埠破船棚里找到一桶【桐油与麻絮】。低头望向乌篷船旁的墨黑河底，浑浊水下隐约反着一点生锈铁光。'
        });
      } else if (r === 'corridor' || r === 'gate') {
        eng.pushLog({
          type: 'narration',
          text: '你沿着墙根和砖缝仔细走了一圈，没有发现额外遗留物件。'
        });
      }

      this.checkTimeTriggers();
      eng.emit();
    },

    // ================= 同房在场考生自由交谈（保护期 ＋ 次日白昼） =================
    talkToNpc(npcId) {
      const eng = E();
      const S = eng.S;
      const npc = S.npcs[npcId];
      if (!npc || !npc.alive || npc.room !== S.room) return;

      const cost = S.phase === 'day2' ? 10 : (S.phase === 'protect' ? 1 : 0);
      if (cost > 0) eng.advanceTime(cost);
      if (S.stage !== 'play') return;

      const key = `${npcId}_${S.phase}_${S.room}`;
      const repeated = !!S.flags.talked[key];
      S.flags.talked[key] = true;
      const cold = !!S.flags.troll_alias;

      if (S.phase === 'protect') {
        if (npcId === 'zhou') {
          eng.pushLog({
            type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
            text: cold
              ? '周衡只瞥了你一眼：“正厅四面木窗朽烂，晚上守不住。没正经线索别挡路。”'
              : (repeated
                ? '周衡盯着画像黑洞洞的眼窝：“这幅画的木框后面像有夹层，敲起来发空，先别乱捅。”'
                : '周衡用斧背轻敲了敲朽烂的花格木窗：“主厅透风，门板也薄，今晚肯定不能住这儿。画后面那堵太师壁有点古怪，留着天亮再说。”')
          });
        } else if (npcId === 'shen') {
          eng.pushLog({
            type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
            text: cold
              ? '沈岚正从里间出来，左手指腹贴着一小块医用创可贴，冷冷扫你一眼：“西厢熟铁门闩完好，爱来不来。”'
              : (repeated
                ? '沈岚收回落在妆匣上的目光，语气平稳：“灶房冷灰和油罐我都看过了，没什么机关。时间不多，你可以去东边看看。”'
                : '你走进西厢时，沈岚刚合上案几上的铜妆匣，空气里飘过一丝极淡的医用酒精味。她神色如常：“这里熟铁门闩结实，窗棂也是双层厚木，比主厅和东边柴房稳妥得多。”')
          });
        } else if (npcId === 'chen') {
          eng.pushLog({
            type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
            text: cold
              ? '陈默懒得抬眼：“老老实实查你的，别净整些没用的。”'
              : (repeated
                ? '陈默蹲在门环三步外：“这黑霜怕不是普通结冰，连铜环的导热都断了，硬撬没用。”'
                : '陈默指了指东侧：“赵川那脾气一进院就往祠堂钻，说上一场靠烧符活的。我总觉得那祠堂地势比天井矮两级，潮得不太对劲。”')
          });
        } else if (npcId === 'zhao') {
          if (eng.hasDoc('doc_shrine_note') && !S.flags.zhao_warned) {
            S.flags.zhao_warned = true;
            S.npcs.zhao.trust += 20;
            eng.pushLog({
              type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
              text: cold
                ? '你把泡烂的方格纸递过去。赵川嫌恶地皱眉扫了两行，脸色瞬间沉了下去：“你小子嘴臭归嘴臭，但这张纸假不了……九点半冒黑水冻死门？操，老子今晚不去这儿送死！”'
                : '你把供桌底抽出的方格残页递给赵川。他看清上面前批考生的死亡编号与“九点半黑水倒灌”几行字，脸色发青地低骂了一句：“妈的，差点信了老经验……行，兄弟，今晚我不守祠堂了！”'
            });
          } else {
            eng.pushLog({
              type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
              text: cold
                ? '赵川冷着脸哼了一声：“滚远点，祠堂地方小，不伺候。”'
                : '赵川拍了拍兜里露出一角的黄纸：“老宅子里阴气重，祖宗牌位前头最稳当。西厢那边黑灯瞎火的，谁爱跟他们挤谁去。”'
            });
          }
        } else if (npcId === 'lin') {
          eng.pushLog({
            type: 'dialog', speaker: '林哲', portrait: 'lin', emotion: 'tense',
            text: '林哲正用沈岚给的酒精棉小心按着焦黑的掌心，声音发虚：“刚才那个姓沈的姐看着挺靠谱……待会儿选屋子，咱们最好跟紧老手吧？”'
          });
        } else if (npcId === 'su') {
          eng.pushLog({
            type: 'dialog', speaker: '苏晓', portrait: 'su', emotion: 'tense',
            text: cold
              ? '苏晓缩了缩肩膀，小声道：“那个……我学古建的，正厅画像的眼睛不是画黑的，是从背面拿硬东西捅穿的……”'
              : '苏晓指着太师壁上的行乐图压低声音：“我学古建的。那幅画的眼窝是从背面硬捅穿的，背后墙体肯定留了暗腔。还有……刚才我路过西厢窗根，好像听见里面有金属盒咔哒响了一声。”'
          });
        }
      } else if (S.phase === 'day2') {
        if (npcId === 'zhou') {
          eng.pushLog({
            type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
            text: cold
              ? '周衡握着短斧站在一旁：“椅子上那具尸身硬得像铁，而且对活人血味极敏感。有发现就留到酉时中堂拿证据说话。”'
              : '周衡压低声音：“我拿斧背试过，椅子上这死尸皮肉僵如生铁，手指刚划破一点皮，它衣袖就无风自动。白天把内书房和后门水路摸透，酉时中堂拍板。”'
          });
        } else if (npcId === 'chen') {
          eng.pushLog({
            type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
            text: '陈默敲了敲乌篷船底裂开的木板：“河口铁栅锈死了，蛮力掰不开，得看枯井那头的水闸有没有暗渠连通。船缝倒不难补，棚子里有桐油麻絮。”'
          });
        } else if (npcId === 'zhao') {
          eng.pushLog({
            type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'calm',
            text: '赵川靠在柴房门框边抽了口冷气：“前院这边我盯着。今晚不管走哪条路，真撞上后罩房那死东西，喊一声。”'
          });
        } else if (npcId === 'lin') {
          eng.pushLog({
            type: 'dialog', speaker: '林哲', portrait: 'lin', emotion: 'tense',
            text: '林哲缩在墙角脸色发白：“我昨晚真是昏了头……今晚你说让我干嘛我就干嘛，绝不添乱。”'
          });
        } else if (npcId === 'su') {
          eng.pushLog({
            type: 'dialog', speaker: '苏晓', portrait: 'su', emotion: 'calm',
            text: '苏晓摊开速写本比划着：“我测了步距和高差，一进宗祠地面比二进枯井高出足足一丈多，暗渠水压肯定不小。”'
          });
        } else if (npcId === 'shen') {
          eng.pushLog({
            type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: S.npcs.shen.emotion,
            text: S.flags.shen_dark_ally
              ? '沈岚低声道：“酉时中堂按说好的办，把周衡和陈默支去枯井，入夜后罩房见。”'
              : '沈岚按着缠满纱布的手腕，眼神冷淡：“该交的我已交了。母契若真能反噬崩毁，我欠你一条命。”'
          });
        }
      }

      this.checkTimeTriggers();
      eng.emit();
    },

    // ================= 保护期结束 → 首夜选房大交锋 =================
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
        if (S.clockMin >= 24 * 60 + 29 * 60) {
          eng.triggerGameOver('五更天明，你仍滞留于白雾边界之内。川楠寿材合盖，黑雾倒灌窒息全院。');
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

      eng.pushBroadcast(
        'sys_protect_end',
        '新手保护期结束。',
        '【机械女声通告】\n「新手保护期结束。」'
      );
      eng.pushLog({
        type: 'danger',
        text: '马头墙外的白雾轰然翻涌压进天井。远处回廊骤然响起一声干涩阴冷的竹骨梆响——“笃——梆！梆！”'
      });

      if (S.flags.zhao_warned) {
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
          text: '赵川脸色发青地瞥了一眼东侧宗祠，最终阴沉着脸站到了西厢这边：“祠堂那鬼地方不能待，我跟你们进西厢。”'
        });
      } else {
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'tense',
          text: '“老子上一场就是躲在香火地界烧符活下来的！西厢黑灯瞎火的谁爱挤谁去，我进东侧宗祠！”'
        });
      }

      eng.pushLog({
        type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
        text: '“主厅木窗烂透了，祠堂地势低洼返潮，只有西厢熟铁门闩完好、双层木窗挡风。周队，建议全员进西厢。”'
      });
      eng.pushLog({
        type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
        text: '周衡目光平淡扫过众人：“西厢门最结实。住哪间屋各自拿主意，没人替你的命兜底。”'
      });

      const choices = [];
      if (eng.hasDoc('doc_shrine_note') && !S.flags.zhao_warned) {
        choices.push({
          label: '掏出《宗祠方格残页》拦住赵川，随后随众人进西厢',
          action: 'n1_choose_west_save_zhao'
        });
      }
      choices.push({
        label: '随周衡、沈岚等人进驻【西厢房】',
        action: 'n1_choose_west'
      });
      choices.push({
        label: '拒绝挤在西厢，独自退守【东厢柴房】',
        action: 'n1_choose_east'
      });
      if (!S.flags.zhao_warned) {
        choices.push({
          label: '跟进【东侧宗祠】盯住赵川',
          action: 'n1_choose_shrine'
        });
      } else {
        choices.push({
          label: '反其道而行，独入【东侧宗祠】查探水下暗渠',
          action: 'n1_choose_shrine'
        });
      }

      S.sceneId = 'night1_shelter_split';
      S.pendingChoices = choices;
    },

    // ================= 第一夜路径 A：西厢人心暗流局 =================
    startNight1West(savedZhaoNow) {
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

      const zhaoSafe = savedZhaoNow || S.flags.zhao_warned;
      if (zhaoSafe) {
        S.flags.zhao_warned = true;
        S.npcs.zhao.room = 'west';
        if (savedZhaoNow) {
          S.npcs.zhao.trust += 25;
          eng.pushLog({
            type: 'evidence',
            text: S.flags.troll_alias
              ? '你把泡烂的方格纸直接拍到赵川眼前。他看清上面“九点半黑水倒灌”几行字，咬着牙冷哼一声：“嘴臭归嘴臭，这张纸假不了。”最终黑着脸退进了西厢。'
              : '你把泡烂的《宗祠方格残页》拍在赵川胸口。赵川看清“九点半黑水倒灌冻死外门”几行字，脸色发青低骂一声，最终阴沉着脸跟着退进了西厢。'
          });
        }
      } else {
        S.flags.zhao_trapped_shrine = true;
        S.npcs.zhao.room = 'shrine';
        eng.pushLog({
          type: 'narration',
          text: '赵川冷笑一声，头也不回摔门进了东侧宗祠。你随周衡、陈默、沈岚、林哲、苏晓退入西厢，反手插死厚重的熟铁门闩。'
        });
      }

      // 沈岚自然顺水推舟（绝不蠢到当众塞停表）
      eng.pushLog({
        type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'calm',
        text: '沈岚靠在门侧阴影里，语气平淡：“夜里腕表屏幕太亮，没事别乱点。里间那张雕花暖榻铺着厚毡子，你们两个新人要是扛不住冻，就去里头靠着，我们几个守门边和灶口。”'
      });
      eng.pushLog({
        type: 'narration',
        text: '刚受过沈岚酒精棉照顾的林哲二话不说快步抢占了最里侧的雕花暖榻，顺手把苏晓挤到外边冰冷长凳上。他闲得发慌，又顺手掀开案几上的铜妆匣，拎出一枚沉甸甸的黄铜鎏金旧怀表嘀咕了句“指针停在十一点，壳子倒真沉”，直接揣进了西装内袋。'
      });
      S.npcs.lin.tabooGift = true;
      S.npcs.lin.tabooCouch = true;

      const suCall = S.flags.troll_alias ? '那个……' : `${addressPlayer(S)}，`;
      eng.pushLog({
        type: 'narration',
        text: `苏晓缩在灶台角落，极轻地扯了扯你的衣袖，声音几乎贴着耳根：“${suCall}刚才保护期我路过西厢窗根，听见沈姐一个人在里头拨弄金属盒子咔哒响，出来时她左手指腹缠了创可贴。而且……我学古建的，里间那张雕花暖榻四面封死没留透气眼，下面像压着什么土窖……”`
      });
      S.flags.su_witness_heard = true;

      if (!zhaoSafe) {
        S.clockMin = 21 * 60 + 30;
        if (global.AudioEngine) global.AudioEngine.playSfx('door_slam');
        eng.pushLog({
          type: 'danger',
          text: '【21:30 · 二更半】院外突然传来凄厉拍门与嘶吼。浑身湿透、脸色青紫的赵川连滚带爬拍打西厢木门：“开门！祠堂砖缝底下冒黑水了！冻死老子了，救命——”'
        });
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡按住门闩眼神冷硬：“外头梆声刚从东廊转过来，现在拉闩会灌进寒雾，还得硬拽他进屋。你要开吗？”'
        });
        S.sceneId = 'n1_west_zhao_rescue';
        S.pendingChoices = [
          { label: '配合周衡闪开半扇门，一把将赵川拽进西厢再死死插闩', action: 'n1_rescue_zhao_yes' },
          { label: '按住门闩不开门，任由门外动静归于死寂', action: 'n1_rescue_zhao_no' }
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
        eng.hurtPlayer(8, '拉门拽人时一股刀刮般的寒雾卷进西厢，你肩头被门框撞青', false);
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'injured',
          text: S.flags.troll_alias
            ? '赵川浑身打摆子瘫在灶台边，咳出两口腥臭黑水，盯着你哑声道：“刚才是我狗眼看人低。欠你一条命，天亮后有件保命的东西归你。”'
            : '赵川浑身打摆子瘫在灶台边，咳出两口黑水，哑声冲你抱了抱拳：“兄弟，欠你一条命。天亮后有件压箱底的东西交给你。”'
        });
      } else {
        S.npcs.zhao.alive = false;
        S.npcs.zhao.emotion = 'injured';
        eng.pushLog({
          type: 'danger',
          text: '门外的拍打声很快被急促逼近的竹骨梆声吞没。一声短促惨叫过后，天井归于死寂。'
        });
        eng.pushBroadcast(
          'sys_dead_zhao',
          '考生，C-N-零八一四四，已死亡。',
          '【机械女声通告】\n「考生 CN-08144，已死亡。」'
        );
      }
      this.enterNight1WestInvestigation();
      eng.emit();
    },

    enterNight1WestInvestigation() {
      const eng = E();
      const S = eng.S;
      S.clockMin = 22 * 60 + 15;
      eng.pushLog({
        type: 'narration',
        text: '【22:15 · 西厢静默】屋外竹骨梆声时远时近，距三更还有三刻钟。林哲蜷在里间暖榻上把玩着怀表，周衡靠在门边擦拭斧刃，沈岚闭目养神。你还有时间暗中查验屋里的账册、怀表与暖榻，再决定三更怎么应对。'
      });
      S.sceneId = 'n1_west_prep';
      this.refreshWestPrepChoices();
    },

    refreshWestPrepChoices() {
      const eng = E();
      const S = eng.S;
      const choices = [];
      if (!eng.hasDoc('doc_watch')) {
        choices.push({ label: '借口核对机芯工艺，从林哲手里借看【鎏金怀表】', action: 'n1_borrow_watch' });
      }
      if (!S.flags.searched['west_1']) {
        choices.push({ label: '趁暗搜检西厢账桌与外间灶台', action: 'n1_quick_search_west' });
      }
      choices.push({ label: '蹲身查验雕花暖榻底板（打开西厢拆解台）', action: 'n1_open_west_wb' });
      choices.push({
        label: '【三更前摊牌】当众拍出物证拆穿暗算，拽林哲下榻全员死守门闩',
        action: 'n1_west_confront_open'
      });
      choices.push({
        label: '【按兵不动】什么也不说，自己远离暖榻与裴氏旧物，冷眼等三更过关',
        action: 'n1_west_route_b'
      });
      if (S.flags.watch_pried || eng.hasItem('wood_shavings')) {
        choices.push({
          label: '【暗中反手调包】借夜色将带血桐木屑悄悄塞回沈岚冲锋衣口袋',
          action: 'n1_west_route_c'
        });
      }
      S.pendingChoices = choices;
    },

    // 三更点卯 ＋ 四更寒潮过渡（西厢）
    resolveWestMidnight(route) {
      const eng = E();
      const S = eng.S;
      S.clockMin = 23 * 60;
      if (global.AudioEngine) {
        global.AudioEngine.playBgm('crisis');
        global.AudioEngine.playSfx('knock');
      }

      const rollCallText = S.usedRealName
        ? '【23:00 · 三更点卯】“笃……笃……笃。”竹骨梆在西厢门外缓缓敲响三记。一道没有眼睛的惨白轮廓死死贴上窗纸，沙哑问账：“乙丑岁奉……西厢住客，陆寻……林哲……哪位应账——”你死死咬住牙关，一字未吐。'
        : '【23:00 · 三更点卯】“笃……笃……笃。”竹骨梆在西厢门外缓缓敲响三记。一道没有眼睛的惨白轮廓死死贴上窗纸，沙哑问账：“乙丑岁奉……西厢住客，哪位应账——”';

      eng.pushLog({
        type: 'danger',
        text: rollCallText
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
          text: '周衡扫过你拍在桌上的带血木屑，反手按住短斧柄盯着骤然变色的沈岚，顺势从她内袋缴下【桐木替死偶】抛给你，又一把将吓呆的林哲拽下暖榻、用湿布死死裹住怀表：“熄光，顶门。今晚没人替死，硬扛过去。”'
        });
        eng.pushLog({
          type: 'narration',
          text: '门外三问无果，窗外黑影骤然发狂撞门。熟铁门闩在巨力下发出刺耳呻吟，梁灰簌簌砸落。你与周衡死抵门板，陈默卡死木楔，苏晓捂紧林哲的嘴——十息死扛过后，竹骨梆声终于恨恨远去。'
        });
      } else if (route === 'B') {
        S.npcs.lin.alive = false;
        S.npcs.lin.emotion = 'injured';
        S.flags.gate_cracked = true;
        eng.pushLog({
          type: 'danger',
          text: '暖榻下的黑瓦瓮与林哲怀里的鎏金怀表同时渗出暗青黑霜。林哲惊恐惨叫着想把怀表掏出来甩掉，却被黑霜死死粘在掌心。门闩未断，一股刺骨阴风透门而入，林哲当场七窍凝霜抽干气绝。前院隐约传来铁链松动的脆响。'
        });
        eng.pushBroadcast(
          'sys_dead_lin',
          '考生，C-N-零九四七二，已死亡。',
          '【机械女声通告】\n「考生 CN-09472，已死亡。」'
        );
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡冷冷扫过面无表情的沈岚，又深深看了你一眼，什么都没说，只把消防斧横在膝上守着门缝。'
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
        eng.pushLog({
          type: 'danger',
          text: '你早已借夜色把那撮带血桐木屑悄悄塞回沈岚冲锋衣外袋。三更梆响刹那，沈岚内袋里的【桐木替死偶】咔嚓寸断。她难以置信地低头看着自己手腕浮现三道青黑契印，连手术刀都没拔出便遭反噬气绝倒地。'
        });
        eng.pushBroadcast(
          'sys_dead_shen',
          '考生，C-N-零六三零二，已死亡。',
          '【机械女声通告】\n「考生 CN-06302，已死亡。」'
        );
        eng.pushLog({
          type: 'narration',
          text: '周衡目光如刀刮过你的脸，沉默良久才压低声音：“够狠。把她身上的手术刀收好，天亮还有硬仗。”'
        });
      }

      // 四更寒潮过渡拍
      S.clockMin = 24 * 60 + 3 * 60 + 30;
      eng.pushLog({
        type: 'narration',
        text: '【03:30 · 四更寒潮】后半夜气温跌至冰点，白雾顺着窗纸缝隙结出一层厚霜，竹骨梆在回廊外又缓慢转了两圈，直到五更天边泛起一线灰白才彻底沉寂。'
      });

      this.completeNight1ToDay2();
    },

    // ================= 第一夜路径 B：东厢柴房机关独守局 =================
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
      S.npcs.zhao.room = S.flags.zhao_warned ? 'west' : 'shrine';

      if (!S.flags.searched['east_1']) {
        S.flags.searched['east_1'] = true;
        eng.addDoc('doc_carpenter');
        eng.addItem('flat_chisel');
        eng.addItem('ink_line');
        eng.addItem('quicklime');
      }

      eng.pushLog({
        type: 'narration',
        text: '你转身退入破败的东厢柴房。木门缺闩，半扇木窗坍塌漏风。干尸怀中取出的《鲁门营造厌胜残谱》、扁铁凿、朱砂墨斗与墙角生石灰就在手边——三更之前，你得靠自己把这间破屋的防线搭稳。'
      });

      S.sceneId = 'n1_east_defend';
      S.pendingChoices = [
        { label: '打开【东厢柴房拆解台】布置防线', action: 'n1_open_east_wb' },
        { label: '布置完毕，熄光屏息熬过三更与四更寒潮', action: 'n1_east_endure' }
      ];
      eng.emit();
    },

    resolveEastEndure() {
      const eng = E();
      const S = eng.S;
      const wb = S.wb;
      S.clockMin = 25 * 60;
      if (global.AudioEngine) global.AudioEngine.playSfx('watchman_bang', { volume: 0.9, pan: 0 });

      let missing = 0;
      if (!wb.eastInkDone) {
        missing++;
        eng.hurtPlayer(22, '门槛未弹朱砂十字墨线，四更寒雾顺门缝倒灌进屋，冻得你四肢僵麻', false);
      }
      if (!wb.eastLimeDone) {
        missing++;
        eng.hurtPlayer(15, '破窗下未撒生石灰阻潮，阴湿白雾直扑胸口引发剧烈呛咳', false);
      }
      if (!wb.eastBraceDone) {
        missing++;
        eng.hurtPlayer(25, '破门未用朽木桌斜撑卡死，门外枯影贴门一推险些撞开木板，你拼死抵门肩头重创', true);
      }
      if (S.stage !== 'play') return;

      if (missing === 0) {
        eng.addContribution(6, '首夜独守东厢以鲁门三法完美拒煞无伤');
        eng.pushLog({
          type: 'narration',
          text: '子时与丑时，那道提着竹骨梆的枯影两次贴着破窗缓缓刮过。朱砂十字墨线、生石灰带与三角木撑死死抵住了阴寒，它在窗外徘徊十息，终于敲着梆子退入白雾。'
        });
      }

      // 严格尊重保护期是否劝住赵川的状态，不再强制写死赵川！
      if (!S.flags.zhao_warned) {
        S.npcs.zhao.alive = false;
        eng.pushLog({
          type: 'danger',
          text: '二更半，东侧宗祠传来凄厉拍门与溺水般的嘶吼，很快被竹骨梆声吞没。'
        });
        eng.pushBroadcast(
          'sys_dead_zhao',
          '考生，C-N-零八一四四，已死亡。',
          '【机械女声通告】\n「考生 CN-08144，已死亡。」'
        );
      }
      S.npcs.lin.alive = false;
      S.flags.gate_cracked = true;
      eng.pushLog({
        type: 'danger',
        text: '三更整，对面西厢传出一声短促凄厉的惨叫，随即重归死寂。'
      });
      eng.pushBroadcast(
        'sys_dead_lin',
        '考生，C-N-零九四七二，已死亡。',
        '【机械女声通告】\n「考生 CN-09472，已死亡。」'
      );

      this.completeNight1ToDay2();
    },

    // ================= 第一夜路径 C：东侧宗祠黑水突围局 =================
    startNight1Shrine() {
      const eng = E();
      const S = eng.S;
      S.night1Path = 'shrine';
      S.room = 'shrine';
      S.clockMin = 21 * 60 + 30;
      S.npcs.zhou.room = 'west';
      S.npcs.chen.room = 'west';
      S.npcs.shen.room = 'west';
      S.npcs.lin.room = 'west';
      S.npcs.su.room = 'west';
      if (!S.flags.zhao_warned) S.npcs.zhao.room = 'shrine';

      if (global.AudioEngine) {
        global.AudioEngine.playBgm('crisis');
        global.AudioEngine.playSfx('sluice_rush');
      }

      if (S.wb.drainOpened) {
        eng.pushLog({
          type: 'danger',
          text: '【21:30 · 宗祠异变】刚过二更半，青砖缝骤然涌出刺骨黑水，但你保护期已撬开供桌下的泄水石栓，积水打着漩涡急泻入暗渠并未漫高！只是外门已被黑霜冻死，必须趁梆声未至合力撞门撤往西厢。'
        });
      } else {
        eng.pushLog({
          type: 'danger',
          text: '【21:30 · 宗祠黑水倒灌】刚过二更半，青砖缝里突然狂涌出刺骨腥臭的黑水，瞬间漫过膝盖！木门从外侧被黑霜彻底冻死，推之不动。'
        });
        if (!S.flags.zhao_warned) {
          eng.pushLog({
            type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'injured',
            text: '赵川脸色惨白死命砸门：“水在涨！供桌底下好像有暗渠水声——快找排水口！”'
          });
        }
      }

      S.sceneId = 'n1_shrine_flood';
      S.pendingChoices = [
        { label: '憋气潜入冰水，打开【宗祠拆解台】查验供桌底石栓', action: 'n1_open_shrine_wb' },
        { label: '发力撞裂外门薄霜，冒雾冲往西厢拍门求援', action: 'n1_shrine_breakout' }
      ];
      eng.emit();
    },

    resolveShrineBreakout() {
      const eng = E();
      const S = eng.S;
      if (!S.wb.drainOpened) {
        eng.hurtPlayer(35, '未拔开水下泄水石栓强行顶水撞门，刺骨黑水没过胸口，你险些溺毙才勉强撞裂冻门爬出', true);
        if (S.stage !== 'play') return;
      } else {
        eng.hurtPlayer(10, '水压骤降后你趁势撞碎外门薄霜，冒着刺骨白雾冲向西厢', false);
      }

      if (!S.flags.zhao_warned) {
        S.flags.zhao_rescued = true;
        S.npcs.zhao.trust += 45;
        S.npcs.zhao.room = 'west';
      }
      S.room = 'west';
      eng.pushLog({
        type: 'narration',
        text: !S.flags.zhao_warned
          ? '周衡听见动静拉闩把你和赵川拽进西厢。赵川劫后余生大口喘气，哑声道：“这条命你救的，天亮有件保命的东西归你。”'
          : '周衡听见动静拉闩把你拽进西厢，顺手插死铁闩，冷声扫了你一眼：“命大。”'
      });
      this.enterNight1WestInvestigation();
      eng.emit();
    },

    // ================= 黎明破晓 → 结算第一轮 → 开启第二轮《验契》 =================
    completeNight1ToDay2() {
      const eng = E();
      const S = eng.S;
      S.roundDone[1] = true;
      S.day = 2;
      S.phase = 'day2';
      S.clockMin = 24 * 60 + 5 * 60 + 30;
      S.round = 2;
      S.watchman.active = false;
      S.room = 'courtyard';

      const deadCount = Object.values(S.npcs).filter(n => !n.alive).length;
      S.worldState = deadCount > 0 ? 'W1' : 'W2';

      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_quiet');
      }

      eng.addDoc('doc_autopsy');

      eng.pushLog({
        type: 'narration',
        text: '【第 2 日 05:30 · 卯时晨钟】内院深处响起一声沉闷铜钟。正厅后方原本死锁的酸枝木月洞门嘎吱一声无风自开，露出阴森深邃的二进内宅。'
      });
      eng.pushBroadcast(
        'sys_r1_done_r2',
        '第一轮考核完成，基础分二十，已计入。第二轮考核：验契。旧债未清，生人入册。日落酉时前，查明岁奉主契根由，于中堂落定章程。基础分，三十五分。',
        '【机械女声通告 · 第一轮结算 / 第二轮考题下发】\n「第一轮考核完成（基础分 +20）。\n第二轮考核：验契。旧债未清，生人入册。日落酉时前，查明裴宅岁奉主契根由，于中堂落定今夜章程。（基础分：35）」'
      );
      eng.pushLog({
        type: 'narration',
        text: deadCount > 0
          ? '清晨冷光透进天井，昨夜的现场勘验已记入档案夹。前院大门上的黑霜似乎比昨夜松动了微不可察的一分，但院内气氛冷得让人窒息。'
          : '全员熬过了第一夜。但抬头望去，马头墙头的白雾比昨夜翻涌得更急，天色压得极低，正门上的黑霜铁链纹丝未动——今天天黑恐怕会比寻常早得多。'
      });

      // 第 2 日白昼 NPC 自主站位
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

    // ================= 第 2 日白昼：各房 NPC 自主剧情与 IF 线前置 =================
    checkDay2RoomEvents(roomId) {
      const eng = E();
      const S = eng.S;

      // 1. 西绣楼撞破旧咒发作的沈岚（修复重复收缴替死偶 Bug，去见面秒自爆台词）
      if (roomId === 'embroidery_loft' && S.npcs.shen.alive && !S.flags.day2_shen_event) {
        S.flags.day2_shen_event = true;
        const alreadyExposed = !!S.flags.shen_exposed_n1 || eng.hasItem('substitute_doll');
        eng.pushLog({
          type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'injured',
          text: alreadyExposed
            ? '推开绣楼木门，沈岚正死死按着渗出黑血的左手腕，脚边掉着她的镀银手术刀。她抬头冷笑一声：“替死偶都让你缴了，来看我等死？后罩堂屋那具坐尸嘴里含着一枚借命血玉——要么帮我拿到它，要么就证明你能把母契连根拔了。”'
            : '推开绣楼木门，沈岚正死死按着渗出黑血的左手腕，神色罕见地失了镇定。见你进来，她抓起梳妆台上的镀银手术刀抵在身前，声音发紧：“别过来。我上场染的阴咒提前反噬了，这屋里没找着解药——后罩堂屋那具干尸口中含着能压阴咒的东西。你是打算去跟周衡告密，还是跟我做笔交易？”'
        });
        const choices = [];
        if (eng.hasItem('cinnabar_powder')) {
          choices.push({
            label: '递出【朱砂解毒散】暂压她的阴咒，私下结盟今晚撇开周衡盗取血玉',
            action: 'day2_shen_dark_ally'
          });
        } else {
          choices.push({
            label: '秘不声张，与沈岚达成口头暗盟：今晚支开周衡，联手去后罩堂屋开颌取玉',
            action: 'day2_shen_dark_ally'
          });
        }
        choices.push({
          label: alreadyExposed
            ? '冷声施压，收缴【镀银手术刀】，要她今晚老实配合破除母契解咒'
            : '冷声震慑，收缴她的【桐木替死偶】与【镀银手术刀】，以破除母契解咒换她配合',
          action: 'day2_shen_redeem'
        });
        S.sceneId = 'day2_shen_choice';
        S.pendingChoices = choices;
      }

      // 2. 东厢偶遇被救活的赵川 → 交付【D级镇宅黄符】（删掉“定住一回合”桌游词）
      if (roomId === 'east' && S.npcs.zhao.alive && (S.flags.zhao_warned || S.flags.zhao_rescued) && !S.flags.zhao_gave_talisman) {
        S.flags.zhao_gave_talisman = true;
        eng.addItem('yellow_talisman');
        eng.pushLog({
          type: 'dialog', speaker: '赵川', portrait: 'zhao', emotion: 'calm',
          text: '赵川从贴身内袋摸出一张叠成三角的【D级镇宅黄符】按进你掌心：“昨晚欠你的。我压箱底的保命货，真撞上后罩堂屋那死东西，拍出去能硬镇住它片刻喘口气。”'
        });
      }

      // 3. 黑水河埠偶遇陈默 → 交付【便携震动感应器】（不再直接背诵全套 M2 攻略）
      if (roomId === 'canal' && S.npcs.chen.alive && !S.flags.chen_canal_event) {
        S.flags.chen_canal_event = true;
        eng.addItem('vib_sensor');
        eng.pushLog({
          type: 'dialog', speaker: '陈默', portrait: 'chen', emotion: 'calm',
          text: '陈默蹲在石阶边敲了敲锈死的河口铁栅：“铁栅吃死在砖缝里，靠人力锯不断。船底也裂了口子，但河水底下似乎连着院里的暗渠。对了，这枚【便携震动感应器】归你——入夜贴在穿堂廊柱上，能听清步频方位。”'
        });
      }

      // 4. 西厢撞破崩溃的林哲试图塞银锁嫁祸苏晓
      if (roomId === 'west' && S.npcs.lin.alive && !S.flags.lin_framed_su_caught) {
        S.flags.lin_framed_su_caught = true;
        eng.pushLog({
          type: 'dialog', speaker: '林哲', portrait: 'lin', emotion: 'tense',
          text: '你推门进西厢，正好撞见林哲哆哆嗦嗦要把一块刻着裴氏私印的旧银锁塞进苏晓的帆布包。四目相对，他手一抖银锁掉在青砖上，声音发颤：“昨晚没死人，今晚肯定要填棺的……我不想死！”'
        });
        eng.pushLog({
          type: 'narration',
          text: '你拾起银锁用破布裹死扔进冷水缸，冷冷看着他。林哲彻底泄了气，缩回墙角再不敢出声。'
        });
      }

      // 5. 后罩堂屋偶遇周衡
      if (roomId === 'coffin_hall' && S.npcs.zhou.alive && !S.flags.zhou_coffin_talk) {
        S.flags.zhou_coffin_talk = true;
        S.flags.autopsy_done = true;
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '周衡握紧短斧站在川楠空棺旁，压低声音：“我用斧背试过，椅子上这死尸硬得像铁，还闻得见活人血味。酉时中堂摊牌前，把内书房和后门水路摸清。”'
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
          text: '沈岚深吸一口气，将冰凉的【镀银手术刀】递给你，眼底透出一丝孤注一掷的冷光：“成交。酉时中堂议事，你把周衡和陈默支去枯井；入夜后罩堂屋见，我挑尸口红线，你撬牙关，拿到血玉立刻脱身。”'
        });
      } else {
        const hadDoll = eng.hasItem('substitute_doll') || S.flags.shen_exposed_n1;
        S.npcs.shen.exposed = true;
        if (!hadDoll) {
          eng.addItem('substitute_doll');
          eng.addDoc('doc_doll');
        }
        eng.addItem('silver_scalpel');
        eng.pushLog({
          type: 'dialog', speaker: '沈岚', portrait: 'shen', emotion: 'tense',
          text: hadDoll
            ? '沈岚沉默片刻，把【镀银手术刀】推到你面前：“行，我赌你这一把。真能把裴宅母契反噬崩毁、连带斩断我手上的旧咒，今晚我听你调遣。”'
            : '沈岚沉默片刻，苦笑一声把【桐木替死偶】与【镀银手术刀】一并推到你面前：“行，我赌你这一把。真能把母契崩毁斩断旧咒，今晚我听你调遣。”'
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
        type: 'narration',
        text: '【酉时 · 中堂摊牌】白雾重新漫上马头墙，所有幸存考生齐聚中央正厅。周衡将消防短斧重重顿在八仙桌上：“天快黑透了。把今天查出来的硬证据拍上桌面，定下今晚怎么活着走出这院子。”'
      });

      S.sceneId = 'day2_council_wait';
      S.pendingChoices = [
        { label: '打开【当堂拍证台】，出示至少 2 份铁证并敲定今夜方略', action: 'open_council_modal' }
      ];
      eng.emit();
    },

    getAvailableCouncilPlans() {
      const eng = E();
      const S = eng.S;
      const plans = [
        { id: 'M1', name: '按鲁门残谱拔除三枚锁宅钉，以湿阴灰撕毁神龛总契破正门' }
      ];
      if (eng.hasDoc('doc_hydro_map') || S.wb.sluiceUnlocked || S.flags.searched['canal_2']) {
        plans.push({ id: 'M2', name: '宗祠放水入枯井提开千斤闸冲碎铁栅，河埠撑乌篷船渡雾' });
      }
      if (eng.hasItem('child_lock_deed') || eng.hasDoc('doc_sunken_box')) {
        plans.push({ id: 'IF1', name: '入夜立于二进穿堂，以秦小栓银锁与祭河死契直面账房伥' });
      }
      if (S.npcs.shen.alive && S.flags.shen_dark_ally) {
        plans.push({ id: 'IF2', name: '表面抛出水路方案支开周衡陈默，实则与沈岚潜入后罩堂屋开颌取玉' });
      }
      if (eng.hasDoc('doc_pei_memoir') && eng.hasItem('substitute_doll')) {
        plans.push({ id: 'IF3', name: '刻裴敬之八字于替死偶，协力以丧门钉倒钉川楠空棺逆转大阵' });
      }
      if (S.flags.gate_cracked) {
        plans.push({ id: 'M3', name: '不硬碰凶宅大阵，入夜伺机从正门黑霜窄缝独自脱逃' });
      }
      return plans;
    },

    completeCouncil(selectedIds, chosenPlan) {
      const eng = E();
      const S = eng.S;
      if (!selectedIds || selectedIds.length < 2) {
        S.toast = '空口白牙没人信。至少勾选 2 份已搜集的原件或实物证物拍上桌面。';
        eng.emit();
        return false;
      }

      // 严格前置校验，杜绝死人诈尸或无据选 IF 线
      if (chosenPlan === 'IF2' && (!S.npcs.shen.alive || !S.flags.shen_dark_ally)) {
        S.toast = '你并未与存活的沈岚达成暗盟，无法执行此方案。';
        eng.emit();
        return false;
      }
      if (chosenPlan === 'IF1' && !eng.hasItem('child_lock_deed')) {
        S.toast = '尚未从黑水河埠捞出秦小栓银锁与祭河死契，无据可凭。';
        eng.emit();
        return false;
      }
      if (chosenPlan === 'IF3' && (!eng.hasDoc('doc_pei_memoir') || !eng.hasItem('substitute_doll'))) {
        S.toast = '缺少裴敬之八字庚帖或桐木替死偶，无法实施反钉封棺。';
        eng.emit();
        return false;
      }

      S.roundDone[2] = true;
      S.councilRoute = chosenPlan;
      S.phase = 'night2';
      S.round = 3;
      S.clockMin = 24 * 60 + 18 * 60 + 5;
      S.watchman.active = true;
      S.watchman.zone = 'gate';
      S.modal = null;

      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_stealth');
      }

      eng.pushBroadcast(
        'sys_r2_done_r3',
        '第二轮考核完成，基础分三十五，已计入。第三轮考核：断岁。三更催命，五更封棺。天明之前，了结岁奉因果，离开白雾边界。基础分，四十五分。',
        '【机械女声通告 · 第二轮结算 / 第三轮考题下发】\n「第二轮考核完成（基础分 +35）。\n第三轮考核：断岁。三更催命，五更封棺。天明（05:00）之前，了结岁奉因果，离开白雾边界。（基础分：45）」'
      );

      if (chosenPlan === 'IF2') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'well';
        if (S.npcs.chen.alive) S.npcs.chen.room = 'well';
        if (S.npcs.shen.alive) S.npcs.shen.room = 'coffin_hall';
        eng.pushLog({
          type: 'narration',
          text: '你不动声色抛出水路图说，把周衡与陈默支去后院枯井勘察。沈岚极轻地点了下头，先行滑入二进后罩堂屋等你动手。'
        });
      } else if (chosenPlan === 'M2') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'canal';
        if (S.npcs.chen.alive) S.npcs.chen.room = 'well';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '“好，不跟后罩房那死尸硬碰，走水路冲铁栅。陈默守枯井绞盘，我去河埠断后，你速去宗祠拔石栓、开闸修船。”'
        });
      } else if (chosenPlan === 'IF1') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'hall';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'tense',
          text: '“拿那孩子的银锁和死契直接去堵巡夜账房伥？太险了……但我给你压阵。带着东西去二进穿堂直面骨梆吧。”'
        });
      } else if (chosenPlan === 'IF3') {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'coffin_hall';
        if (S.npcs.zhao.alive) S.npcs.zhao.room = 'coffin_hall';
        if (S.npcs.shen.alive) S.npcs.shen.room = 'coffin_hall';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '“把裴贼自己的八字刻上替死偶倒钉进棺材？好胆色。”周衡提斧起身，“我和赵川去后罩堂屋死架尸煞，你先起出宗祠丧门钉，随后直奔后罩堂屋钉棺。”'
        });
      } else {
        if (S.npcs.zhou.alive) S.npcs.zhou.room = 'hall';
        eng.pushLog({
          type: 'dialog', speaker: '周衡', portrait: 'zhou', emotion: 'calm',
          text: '“就按残谱拔三钉、阴灰撕总契。记住，外院那东西听声，内宅那具尸闻血，受了伤第一时间包扎封口。”'
        });
      }

      S.sceneId = 'free_explore';
      S.pendingChoices = [];
      eng.emit();
      return true;
    },

    // ================= 第二夜战术动作（震动器 / 铜壶声饵 / 湿青砖投掷） =================
    deployVibSensor() {
      const eng = E();
      const S = eng.S;
      if (!eng.hasItem('vib_sensor')) return;
      S.flags.vib_deployed = true;
      eng.pushLog({
        type: 'system',
        text: '你将陈默的【便携震动感应器】贴死在廊柱暗处。拓扑图已接入实时步频标定。'
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
        text: `你将【漏底盛水铜壶】悬在【${DATA().ROOMS[S.watchman.decoyZone].short}】木梁上。细密水滴敲击青石板的回音，将在接下来 2 个回合内把账房伥引偏。`
      });
      eng.emit();
    },

    throwWetBrick() {
      const eng = E();
      const S = eng.S;
      if (!eng.hasItem('wet_brick')) return;
      const targetZone = S.room === 'courtyard' ? 'gate' : (S.room === 'east' ? 'shrine' : 'courtyard');
      S.watchman.decoyTurns = 1;
      S.watchman.decoyZone = targetZone;
      eng.removeItem('wet_brick');
      if (global.AudioEngine) global.AudioEngine.playSfx('jar_crack', { volume: 0.45 });
      eng.pushLog({
        type: 'system',
        text: `你借着暗影将兜里的【半块湿青砖】狠狠甩向【${DATA().ROOMS[targetZone].short}】方向！砖块砸碎青瓦发出一声闷响，巡夜的竹骨梆声立刻调头朝那边掠去。`
      });
      eng.emit();
    },

    // ================= 六大终局触发器（3 主线 + 3 真·IF 线） =================
    triggerEndingAction(endingKey) {
      const eng = E();
      const S = eng.S;

      if (endingKey === 'M1') {
        if (!S.flags.gate_unsealed) {
          S.toast = '大门黑霜铁链尚未崩断。请拔齐 3 枚锁宅钉后在正厅神龛以湿阴灰撕毁《买命总契》。';
          eng.emit();
          return;
        }
        const rank = S.wb.contractTorn ? 'A+ 级 · 鲁门破阵正门崩霜' : 'A 级 · 烈火破契冲出正门';
        eng.finishExam(
          'M1_orthodox',
          rank,
          '三钉尽拔，百年买命总契化作飞灰。前院朱漆大门黑霜铁链寸寸崩断，你与幸存众人踏出白雾古宅。',
          S.npcs.zhou.alive ? 'zhou_squad' : 'lone_wolf',
          null
        );
      } else if (endingKey === 'M2') {
        if (!S.wb.sluiceBlasted || !S.wb.boatRepaired) {
          S.toast = '水路尚未打通：须先拔宗祠泄水石栓→枯井提开千斤闸冲碎铁栅，并以桐油麻絮修妥乌篷船。';
          eng.emit();
          return;
        }
        if (global.AudioEngine) global.AudioEngine.playSfx('oar_water');
        eng.addContribution(15, '水口开闸轰碎铁栅并撑乌篷船夜渡黑水河');
        eng.finishExam(
          'M2_canal',
          'A+ 级 · 水口破栅舟渡黑雾',
          '千钧激流轰碎水封铁栅。周衡持斧断后逼退尸煞，你与陈默、苏晓摇动乌篷船木橹劈开墨黑死水，冲出白雾边界。',
          S.npcs.zhou.alive ? 'zhou_squad' : 'lone_wolf',
          null
        );
      } else if (endingKey === 'M3') {
        if (!S.flags.gate_cracked) {
          S.toast = '前院正门黑霜严丝合缝，目前无隙可钻。';
          eng.emit();
          return;
        }
        eng.finishExam(
          'M3_sacrifice',
          'C- 级 · 顺契苟活窄缝脱逃',
          '你没有触碰大阵，趁着替死鬼填满买命契、正门黑霜松裂一线之机独自侧身挤出白雾。虽保住性命，却无半分破局贡献。',
          'lone_wolf',
          null
        );
      } else if (endingKey === 'IF1') {
        if (!eng.hasItem('child_lock_deed')) {
          S.toast = '缺少【秦小栓银锁与祭河死契】。';
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
          '你在穿堂独自直面无目账房伥，将【秦小栓长命银锁与祭河死契】重重拍上竹骨梆。老仆秦伯空洞眼窝泣下两行黑血，仰天悲嚎着撞碎后罩堂屋木门，死死抱住裴敬之尸煞滚入川楠寿材自焚俱灭。你在灰烬中拾得【引魂竹骨梆（D+）】。',
          S.npcs.zhou.alive ? 'zhou_squad' : 'lone_wolf',
          'bone_clapper'
        );
      } else if (endingKey === 'IF2') {
        if (!S.corpseBoss.jadeTaken) {
          S.toast = '尚未取得【乙丑借命压舌血玉】。';
          eng.emit();
          return;
        }
        S.flags.zhou_betrayed = true;
        eng.finishExam(
          'IF2_shen_blood_jade',
          'S 级真·IF ② · 黑市同盟开棺窃玉（邪道决裂）',
          '滚烫的【乙丑借命压舌血玉】落入掌心，裴氏尸煞狂暴掀翻太师椅。周衡闻变赶回挥斧硬架尸煞掩护新人，冷目盯着你与沈岚低喝“滚，下场别让我碰见你们”。你与沈岚借雾亡命脱出，跨场锁定为【黑市双人组】。',
          'black_market_duo',
          'blood_jade'
        );
      } else if (endingKey === 'IF3') {
        if (!S.corpseBoss.sealed) {
          S.toast = '尚未完成反钉封棺。';
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
          '七寸丧门钉贯透刻满裴贼八字的桐木替死偶死死钉入川楠寿材。整座买命大阵轰然倒转，裴氏尸煞被生生吸进棺内合盖永封，沈岚手腕上的旧场黑咒亦随母契崩解。幸存众人踏出正门，死考空间深红旋涡破格为你开放【C 级查看权限】。',
          'zhou_squad',
          null
        );
      }
    },

    // ================= 按钮回调分发 =================
    dispatch(action) {
      const eng = E();
      const S = eng.S;
      if (action === 'prologue_probe_phone') return this.prologueProbe('phone');
      if (action === 'prologue_probe_walk') return this.prologueProbe('walk');
      if (action === 'prologue_probe_sense') return this.prologueProbe('sense');
      if (action === 'prologue_cd_pry') return this.prologueCountdown('pry');
      if (action === 'prologue_cd_check') return this.prologueCountdown('check');
      if (action === 'prologue_cd_brick') return this.prologueCountdown('brick');
      if (action === 'scene_gate_shock') return this.scene_gate_shock();
      if (action === 'intro_probe_gear') return this.introCourtyardProbe('gear');
      if (action === 'intro_probe_zhou') return this.introCourtyardProbe('zhou');
      if (action === 'intro_probe_su') return this.introCourtyardProbe('su');
      if (action === 'n1_choose_west_save_zhao') return this.startNight1West(true);
      if (action === 'n1_choose_west') return this.startNight1West(false);
      if (action === 'n1_choose_east') return this.startNight1East();
      if (action === 'n1_choose_shrine') return this.startNight1Shrine();
      if (action === 'n1_rescue_zhao_yes') return this.resolveWestZhaoRescue(true);
      if (action === 'n1_rescue_zhao_no') return this.resolveWestZhaoRescue(false);
      if (action === 'n1_borrow_watch') {
        eng.addDoc('doc_watch');
        eng.pushLog({ type: 'evidence', text: '你借口看机芯工艺，从林哲手里借来【鎏金怀表】端详了一番（已收入原件夹）。' });
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
        const plans = this.getAvailableCouncilPlans();
        S.modal = { type: 'confront', context: 'day2_council', selected: [], chosenPlan: plans[0] ? plans[0].id : 'M1' };
        eng.emit();
        return;
      }
    },

    // 首夜当堂拆穿沈岚拍证校验（只认铁证，绝不因低好感卡死）
    submitNight1Confront(selectedIds) {
      const eng = E();
      const S = eng.S;
      const hasWatchProof = selectedIds.includes('doc_watch') || selectedIds.includes('wood_shavings');
      if (!hasWatchProof) {
        S.toast = '空口指责只会打草惊蛇。先撬开【鎏金怀表】背盖取得内部异物，再拍在周衡面前。';
        eng.emit();
        return false;
      }
      if (!S.flags.watch_pried) {
        S.toast = '还没撬开【鎏金怀表】的铜背盖，单凭表壳不足以坐实手脚。';
        eng.emit();
        return false;
      }
      S.modal = null;
      this.resolveWestMidnight('A');
      return true;
    }
  };

  global.EXAM1_STORY = Story;
})(typeof window !== 'undefined' ? window : globalThis);
