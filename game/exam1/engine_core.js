// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.0 — 核心状态机、双煞AI、物理拆解与结算引擎
// ============================================================================
(function (global) {
  'use strict';

  const WATCHMAN_PATROL_DAY1 = ['gate', 'courtyard', 'east', 'hall', 'west', 'courtyard'];
  const WATCHMAN_PATROL_DAY2 = ['gate', 'courtyard', 'east', 'hall', 'corridor', 'west', 'courtyard'];
  const CORPSE_PATROL = ['coffin_hall', 'inner_study', 'corridor', 'hall', 'corridor', 'coffin_hall'];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function createInitialState(stage) {
    const DATA = global.EXAM1_DATA;
    return {
      version: '3.1',
      stage: stage || 'char_select', // char_select | play | space | gameover
      day: 1,                        // 1 = 第1夜, 2 = 第2日白昼 / 第2夜
      phase: 'prologue',             // prologue | protect | night1 | day2 | council | night2 | ending
      clockMin: 20 * 60 + 30,        // 从第1夜 20:30 雨巷起步
      round: 0,                      // 0 未发题 | 1 第一轮投宿 | 2 第二轮验契 | 3 第三轮断岁
      roundDone: { 1: false, 2: false, 3: false },
      worldState: 'W0',              // W1(首夜死人·尸煞回阳) | W2(首夜零亡·凶宅饥渴)
      night1Path: null,              // 'west' | 'east' | 'shrine'
      councilRoute: null,            // 'M1' | 'M2' | 'M3' | 'IF1' | 'IF2' | 'IF3'

      // 玩家底盘
      origin: null,
      playerName: '陆寻',
      callsign: '陆寻',
      usedRealName: false,
      playerCode: 'CN-09471',
      stats: { PHY: 10, AGI: 10, OBS: 10, WIL: 10 },
      hp: 100,
      maxHp: 100,
      sta: 100,
      maxSta: 100,
      bleeding: false,
      blinded: false,
      room: 'courtyard',

      // 5格工具背囊 + 独立证物/原件夹 + 房间地面暂存
      bag: [],
      bagCap: 5,
      roomDrops: {},
      evidence: [],
      docs: [],
      clues: [],

      // 环境与双煞 AI 数值
      sound: 10,
      heat: 5,
      playerTaboos: { gift: false, couch: false, answer: false },
      bloodMarks: 0,
      watchman: {
        active: false,
        zoneIdx: 0,
        zone: 'gate',
        decoyTurns: 0,
        decoyZone: null,
        state: 'PATROL',
        alertTarget: null
      },
      corpseBoss: {
        awake: false,
        zoneIdx: 0,
        zone: 'coffin_hall',
        stunnedTurns: 0,
        sealed: false,
        jadeTaken: false
      },

      // 八座物理拆解台持久状态
      wb: {
        couchOpened: false,
        sealSoftened: false,
        jarSmashed: false,
        nail1Pulled: false,

        drainOpened: false,
        nail2HandWrapped: false,
        nail2Oiled: false,
        nail2Pulled: false,

        bellPlugged: false,
        nail3Pulled: false,
        contractTorn: false,
        contractBurned: false,

        eastInkDone: false,
        eastLimeDone: false,
        eastBraceDone: false,

        lubanSliders: [0, 0, 0, 0],
        lubanOpened: false,

        embroideryOpened: false,
        sunkenBoxDredged: false,
        sluiceUnlocked: false,
        sluiceOiled: false,
        sluiceBlasted: false,
        boatRepaired: false,
        dollCarved: false
      },

      // 六名同行考生状态机
      npcs: clone(DATA.NPC_TEMPLATES),

      // 剧情标志位与进度
      flags: {
        troll_alias: false,
        ledger_slit: false,
        carpenter_flipped: false,
        watch_pried: false,
        zhao_warned: false,
        zhao_trapped_shrine: false,
        zhao_rescued: false,
        shen_exposed_n1: false,
        shen_swapped_n1: false,
        shen_dark_ally: false,
        shen_curse_resolved: false,
        lin_saved_n1: false,
        lin_framed_su_caught: false,
        su_witness_heard: false,
        autopsy_done: false,
        vib_deployed: false,
        gate_cracked: false,
        gate_unsealed: false,
        zhou_betrayed: false,
        confronted_council: false,
        solo_bonus: false,
        searched: {},
        talked: {}
      },

      // 当前剧情节拍与弹窗状态
      sceneId: 'intro_alley',
      pendingChoices: [],
      modal: null,
      history: [],
      toast: null,

      // 结算与死考空间大厅
      contributionScore: 0,
      contributionLog: [],
      settlement: null,
      points: 0,
      cTierUnlocked: false,
      restAP: 6,
      spaceNote: '',
      spaceEnded: false,
      shopFilter: '全部',
      shopBought: [],
      hallEdition: (function () {
        try { return localStorage.getItem('death_exam_hall_edition') || 'numinous'; }
        catch { return 'numinous'; }
      })()
    };
  }

  const Engine = {
    S: null,
    listeners: [],

    onUpdate(fn) { this.listeners.push(fn); },
    emit() {
      this.save();
      this.listeners.forEach(fn => { try { fn(this.S); } catch (e) { console.error(e); } });
    },

    init(stage) {
      if (global.AudioEngine && typeof global.AudioEngine.stopSystemBroadcast === 'function') {
        global.AudioEngine.stopSystemBroadcast();
      }
      this.S = createInitialState(stage);
      return this.S;
    },

    save() {
      if (!this.S || this.S.stage === 'char_select') return;
      if (global.WhiteMistSave) {
        global.WhiteMistSave.write(this.S);
      } else {
        try { localStorage.setItem('death_exam_s1e1_save_v4', JSON.stringify(this.S)); } catch {}
      }
    },

    load() {
      let data = null;
      if (global.WhiteMistSave) data = global.WhiteMistSave.read();
      else {
        try { data = JSON.parse(localStorage.getItem('death_exam_s1e1_save_v4')); } catch {}
      }
      if (data && data.version === '3.1') {
        this.S = data;
        return true;
      }
      return false;
    },

    getRoomName(roomId) {
      const r = global.EXAM1_DATA && global.EXAM1_DATA.ROOMS && global.EXAM1_DATA.ROOMS[roomId];
      if (!r) return roomId || '';
      const S = this.S;
      if (!S) return r.initialName || r.name;
      const unlocked =
        (r.revealFlag && S.flags && S.flags[r.revealFlag]) ||
        (r.revealDoc && Array.isArray(S.docs) && S.docs.includes(r.revealDoc));
      return unlocked ? (r.revealedName || r.name) : (r.initialName || r.name);
    },

    formatClock(min) {
      const m = ((min % 1440) + 1440) % 1440;
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    },

    getWatchLabel() {
      const m = this.S.clockMin % 1440;
      if (this.S.phase === 'prologue') return '第1夜 · 现实雨巷';
      if (this.S.phase === 'day2' || this.S.phase === 'council') {
        if (m < 9 * 60) return '第2日 · 卯辰之交';
        if (m < 13 * 60) return '第2日 · 巳午白昼';
        if (m < 17 * 60) return '第2日 · 未申薄雾';
        return '第2日 · 酉时摊牌';
      }
      const prefix = this.S.day === 1 ? '第1夜' : '第2夜';
      if (m >= 19 * 60 && m < 21 * 60) return `${prefix} · 戌时初更`;
      if (m >= 21 * 60 && m < 23 * 60) return `${prefix} · 亥时二更`;
      if (m >= 23 * 60 || m < 1 * 60)  return `${prefix} · 子时三更`;
      if (m >= 1 * 60 && m < 3 * 60)   return `${prefix} · 丑时四更`;
      return `${prefix} · 寅卯五更`;
    },

    pushLog(entry) {
      const id = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const item = Object.assign({
        id,
        time: this.formatClock(this.S.clockMin),
        type: 'narration' // narration | dialog | system | broadcast | danger | evidence
      }, entry);
      this.S.history.push(item);
      if (this.S.history.length > 160) this.S.history.shift();
      return item;
    },

    pushBroadcast(voiceKey, spokenText, displayText) {
      if (global.AudioEngine && typeof global.AudioEngine.playSystemBroadcast === 'function') {
        global.AudioEngine.playSystemBroadcast(voiceKey, spokenText || displayText);
      } else if (global.AudioEngine) {
        global.AudioEngine.playSfx('watch');
      }
      return this.pushLog({
        type: 'broadcast',
        voiceKey: voiceKey || '',
        text: displayText || spokenText
      });
    },

    classifyCallsign(raw) {
      const cleaned = String(raw || '').replace(/[\r\n\t]+/g, '').trim();
      if (!cleaned) {
        return { kind: 'invalid', msg: '先报个称呼，空白没法喊人。' };
      }
      if (cleaned.length > 8) {
        return { kind: 'invalid', msg: '称呼太长（限 8 字以内），危急关头念不完。' };
      }
      if (cleaned === '陆寻') {
        return { kind: 'real', name: '陆寻' };
      }
      const npcList = Object.values(this.S.npcs || {});
      const matchedNpc = npcList.find(n => n.name === cleaned);
      if (matchedNpc) {
        return { kind: 'npc_conflict', npcId: matchedNpc.id, name: cleaned };
      }

      // 恶趣味 / 侮辱性 / 伦理占便宜 / 18禁低俗词检测
      const norm = cleaned.toLowerCase().replace(/[\s·\-_.,，。!！?？]/g, '');
      const trollPattern = /(傻逼|煞笔|沙雕|智障|脑残|废物|垃圾|蠢货|混蛋|王八蛋|滚蛋|草泥马|操你|肏|日你|妈的|尼玛|你妈|你爹|你爸|爸爸|爹爹|爷爷|祖宗|太爷|儿子|孙子|老公|老婆|主人|大爷|狗东西|畜生|贱人|婊子|荡妇|骚货|妓女|鸡巴|几把|jb|jj|逼|屄|阴茎|阴道|乳房|奶子|屁眼|肛门|做爱|性交|口交|足交|自慰|手淫|射精|高潮|裸体|色情|黄片|av|porn|sex|fuck|shit|bitch|dick|cock|pussy|asshole|cunt|hentai|nsfw|18禁|拉屎|吃屎|大便|尿尿|狗屎|马桶|二狗子|铁柱|翠花|歪嘴龙王|龙傲天|叶良辰|日天|牛逼|装逼|sb|nmsl|cnm|tmd|wcnm|qnmd|rnm)/i;
      if (trollPattern.test(norm) || /^[\d]+$/.test(norm) && norm.length >= 6) {
        return { kind: 'troll', name: cleaned };
      }
      return { kind: 'alias', name: cleaned };
    },

    addContribution(pts, reason) {
      if (this.S.contributionLog.some(x => x.reason === reason)) return;
      this.S.contributionLog.push({ pts, reason });
      this.S.contributionScore = Math.min(45, this.S.contributionScore + pts);
    },

    hasItem(itemId) {
      return this.S.bag.includes(itemId) || this.S.evidence.includes(itemId);
    },

    hasDoc(docId) {
      return this.S.docs.includes(docId);
    },

    addItem(itemId) {
      const item = global.EXAM1_DATA.ITEMS[itemId];
      if (!item) return { ok: false, msg: '未知物件' };
      if (this.hasItem(itemId)) return { ok: true, msg: `随身已有【${item.name}】` };

      if (item.cat === 'tool') {
        if (this.S.bag.length >= this.S.bagCap) {
          const r = this.S.room || 'courtyard';
          if (!this.S.roomDrops) this.S.roomDrops = {};
          if (!this.S.roomDrops[r]) this.S.roomDrops[r] = [];
          if (!this.S.roomDrops[r].includes(itemId)) this.S.roomDrops[r].push(itemId);
          this.S.toast = `5 格背囊已满！【${item.name}】已暂放于本室地面，丢弃一件不需要的工具后即可随时拾取。`;
          return { ok: false, msg: this.S.toast };
        }
        this.S.bag.push(itemId);
      } else {
        this.S.evidence.push(itemId);
      }
      if (itemId === 'gold_watch' || itemId === 'peis_lock') {
        this.S.playerTaboos.gift = true;
      }
      this.S.clues = Array.from(new Set(this.S.clues.concat([itemId])));
      return { ok: true, msg: `获得【${item.name}】` };
    },

    pickupRoomDrop(itemId) {
      const r = this.S.room;
      const list = (this.S.roomDrops && this.S.roomDrops[r]) || [];
      if (!list.includes(itemId)) return;
      const res = this.addItem(itemId);
      if (res.ok) {
        this.S.roomDrops[r] = list.filter(x => x !== itemId);
        this.S.toast = res.msg;
      }
      this.emit();
    },

    removeItem(itemId, dropToFloor) {
      const item = global.EXAM1_DATA.ITEMS[itemId];
      this.S.bag = this.S.bag.filter(x => x !== itemId);
      this.S.evidence = this.S.evidence.filter(x => x !== itemId);
      if (dropToFloor && item && item.cat === 'tool') {
        const r = this.S.room || 'courtyard';
        if (!this.S.roomDrops) this.S.roomDrops = {};
        if (!this.S.roomDrops[r]) this.S.roomDrops[r] = [];
        if (!this.S.roomDrops[r].includes(itemId)) this.S.roomDrops[r].push(itemId);
      }
      if (!this.hasItem('gold_watch') && !this.hasItem('peis_lock')) {
        this.S.playerTaboos.gift = false;
      }
    },

    addDoc(docId) {
      if (!this.S.docs.includes(docId)) {
        this.S.docs.push(docId);
        this.S.clues = Array.from(new Set(this.S.clues.concat([docId])));
        if (global.AudioEngine) global.AudioEngine.playSfx('paper_flip');
      }
    },

    getNailCount() {
      const wb = this.S.wb;
      return (wb.nail1Pulled ? 1 : 0) + (wb.nail2Pulled ? 1 : 0) + (wb.nail3Pulled ? 1 : 0);
    },

    getPlayerTabooCount() {
      const t = this.S.playerTaboos;
      return (t.gift ? 1 : 0) + (t.couch ? 1 : 0) + (t.answer ? 1 : 0);
    },

    hurtPlayer(dmg, reason, causesBleed) {
      this.S.hp = Math.max(0, this.S.hp - dmg);
      if (causesBleed) this.S.bleeding = true;
      this.pushLog({
        type: 'danger',
        text: `${reason}（生命 -${dmg}${causesBleed ? '，伤口渗血！第二夜极易引来盲目尸煞' : ''}）`
      });
      if (this.S.hp <= 0) {
        this.triggerGameOver('伤重失血，倒毙于裴氏凶宅白雾之中。腕表冰冷播报：【考生 CN-09471 已死亡】。');
        return true;
      }
      return false;
    },

    // 使用急救绷带止血 / 使用朱砂解毒散解除迷眼
    useConsumable(itemId) {
      if (!this.hasItem(itemId)) return;
      if (itemId === 'med_bandage') {
        if (!this.S.bleeding && this.S.hp >= this.S.maxHp) {
          this.S.toast = '当前并无外伤流血，留着绷带既可止血，也可裹手拔丧门钉。';
          return;
        }
        this.S.bleeding = false;
        this.S.hp = Math.min(this.S.maxHp, this.S.hp + 20);
        this.pushLog({ type: 'system', text: '你用无菌厚纱布严密包扎好伤口，彻底止住了血腥气（HP +20，解除流血状态）。' });
      } else if (itemId === 'cinnabar_powder') {
        if (this.S.blinded) {
          this.S.blinded = false;
          this.S.stats.OBS += 3;
          this.removeItem('cinnabar_powder');
          this.pushLog({ type: 'system', text: '你服下西绣楼的【朱砂解毒散】并以冷水洗目，生石灰尸毒的刺痛迅速消退，视野恢复清明！' });
        } else {
          this.S.toast = '【朱砂解毒散】既可解尸毒迷眼，更能在西绣楼或白昼用来压制沈岚发作的旧场阴咒！';
        }
      }
      this.emit();
    },

    // 推进时钟并同步驱动双煞巡逻与声热衰减
    advanceTime(minutes) {
      const S = this.S;
      S.clockMin += minutes;
      S.sound = Math.max(5, S.sound - Math.floor(minutes * 1.4));
      S.heat = Math.max(5, S.heat - Math.floor(minutes * 0.8));

      // 夜间驱动无目账房伥巡更
      if ((S.phase === 'night1' || S.phase === 'night2') && S.watchman.active && S.watchman.state !== 'REBELLED') {
        this.stepWatchman();
      }
      // 第二夜驱动裴氏盲目尸煞
      if (S.phase === 'night2' && !S.corpseBoss.sealed) {
        this.stepCorpseBoss();
      }
    },

    stepWatchman() {
      const S = this.S;
      const w = S.watchman;
      const patrol = S.day === 1 ? WATCHMAN_PATROL_DAY1 : WATCHMAN_PATROL_DAY2;

      if (w.decoyTurns > 0) {
        w.decoyTurns -= 1;
        w.zone = w.decoyZone;
        this.pushLog({
          type: 'system',
          text: `远处【${global.EXAM1_DATA.ROOMS[w.zone].short}】方向传来急促的竹骨梆声——账房伥仍被你的声饵死死钉在那边！`
        });
      } else {
        w.zoneIdx = (w.zoneIdx + 1) % patrol.length;
        w.zone = patrol[w.zoneIdx];
      }

      if (global.AudioEngine) {
        global.AudioEngine.playWatchmanBang(w.zone, S.room);
      }

      // 判定高声响/明火触发强攻
      if (S.sound >= 65 || S.heat >= 55) {
        w.state = 'HUNT';
        w.zone = S.room;
        if (global.AudioEngine) global.AudioEngine.playSfx('door_slam');
        this.hurtPlayer(22, '剧烈异响／明火瞬间锁死了无目账房伥的听觉！一道枯槁黑影贴墙疾掠扑来，木门与窗棂在巨力撞击下剧烈震颤', true);
        S.sound = 25;
        S.heat = 15;
      } else if (w.zone === S.room && (S.room === 'courtyard' || S.room === 'corridor' || S.room === 'gate')) {
        // 露天同区遭遇
        const dodge = S.stats.AGI >= 11;
        if (dodge) {
          this.pushLog({
            type: 'danger',
            text: `【听梆惊险】竹骨梆声就在三步外炸响！你凭敏锐身手屏息滚入廊柱死角，冷汗浸透脊背，躲过了无目账房伥的枯爪！`
          });
        } else {
          if (global.AudioEngine) global.AudioEngine.playSfx('door_slam');
          this.hurtPlayer(18, '在露天回廊与巡夜的无目账房伥迎面撞了个正着！冰冷枯爪擦过肩头带出三道深可见骨的寒伤', true);
        }
      }
    },

    stepCorpseBoss() {
      const S = this.S;
      const b = S.corpseBoss;
      const wakeClock = S.worldState === 'W1' ? (24 * 60 + 20 * 60) : (24 * 60 + 23 * 60);
      if (!b.awake && (S.clockMin >= wakeClock || this.getNailCount() >= 2)) {
        b.awake = true;
        if (global.AudioEngine) global.AudioEngine.playSfx('coffin_slide');
        this.pushLog({
          type: 'danger',
          text: '二进后罩房深处传来一声沉闷刺耳的楠木摩擦重响——端坐太师椅上的裴敬之干尸缓缓站了起来！内宅进入【双煞巡游】状态！'
        });
      }
      if (!b.awake) return;
      if (b.stunnedTurns > 0) {
        b.stunnedTurns -= 1;
        this.pushLog({ type: 'system', text: '镇宅黄符的赤光仍死死压在裴氏尸煞额头，它一时动弹不得！' });
        return;
      }

      // 循血索敌
      if (S.bleeding && global.EXAM1_DATA.ROOMS[S.room].court === 2) {
        b.zone = S.room;
        if (global.AudioEngine) global.AudioEngine.playSfx('door_slam');
        this.hurtPlayer(28, '你身上未包扎的伤口血腥气隔墙引来了裴氏盲目尸煞！暗红寿衣化作残影扑面压下', false);
        return;
      }

      b.zoneIdx = (b.zoneIdx + 1) % CORPSE_PATROL.length;
      b.zone = CORPSE_PATROL[b.zoneIdx];
      if (b.zone === S.room) {
        // 如果周衡在同房或持有黄符可化解
        if (this.hasItem('yellow_talisman')) {
          this.pushLog({
            type: 'danger',
            text: '裴氏盲目尸煞阴森踏入本室！你眼疾手快扬手拍出【D级镇宅黄符】，赤芒爆闪将它硬生生定在原地一回合！'
          });
          this.removeItem('yellow_talisman');
          b.stunnedTurns = 1;
        } else if (S.npcs.zhou.alive && !S.flags.zhou_betrayed && S.npcs.zhou.room === S.room) {
          this.pushLog({
            type: 'danger',
            text: '裴氏尸煞直扑而来！周衡低吼一声横练筋骨暴起，举起破邪消防短斧硬生生架住尸爪三息，掩护你脱身退开！'
          });
          S.npcs.zhou.hp = Math.max(20, S.npcs.zhou.hp - 20);
          S.npcs.zhou.emotion = 'injured';
        } else {
          this.hurtPlayer(26, '你与内宅巡游的裴氏盲目尸煞撞个正着！刺骨阴煞狠狠震在胸口', true);
        }
      }
    },

    // ================= 原件台交互动作 =================
    runDocAction(actionId) {
      const S = this.S;
      if (actionId === 'inspect_ledger_backlit') {
        this.pushLog({
          type: 'evidence',
          text: '你借冷光侧照账册封底，发现暗红硬壳背面夹着一层极薄的朱砂纸，封口用陈年浆糊粘死——需要用薄刃裁开。'
        });
        S.toast = '发现封底暗层！请用折刀、扁凿或手术刀裁开。';
      } else if (actionId === 'slit_ledger_flap') {
        if (!['folding_knife', 'flat_chisel', 'silver_scalpel'].some(k => this.hasItem(k))) {
          S.toast = '手里没有薄刃工具（户外折刀 / 鲁门扁铁凿 / 镀银手术刀），徒手撕扯会毁坏夹层字迹！';
          return;
        }
        S.flags.ledger_slit = true;
        if (global.AudioEngine) global.AudioEngine.playSfx('paper_flip');
        this.addContribution(4, '裁开《岁奉支应册》封底暗页');
        this.pushLog({
          type: 'evidence',
          text: '你屏息沿封底夹缝稳稳裁开，抽出一张朱砂小楷写就的《乙丑岁奉签押定例》！请切换至第四折亲手细读。'
        });
        if (S.modal && S.modal.type === 'doc') S.modal.pageIdx = 3;
      } else if (actionId === 'flip_carpenter_back') {
        S.flags.carpenter_flipped = true;
        if (global.AudioEngine) global.AudioEngine.playSfx('paper_flip');
        this.pushLog({
          type: 'evidence',
          text: '你将油布残谱翻至牛皮封底凑近细辨——粗糙皮面上密密麻麻刻满了陈七爷临终用断甲蘸血划出的破契与反钉绝笔！'
        });
        if (S.modal && S.modal.type === 'doc') S.modal.pageIdx = 2;
      } else if (actionId === 'pry_gold_watch') {
        if (!['folding_knife', 'flat_chisel', 'silver_scalpel', 'steel_tape'].some(k => this.hasItem(k))) {
          S.toast = '表盖卡得太紧，需要薄刃工具或钢卷尺片撬开背盖。';
          return;
        }
        S.flags.watch_pried = true;
        this.addItem('wood_shavings');
        this.addContribution(4, '撬开鎏金怀表发现带血酒精桐木屑');
        this.pushLog({
          type: 'evidence',
          text: '咔哒一声轻响，铜背盖弹开——黄铜齿轮间赫然塞着一撮染有暗红血丝、散发刺鼻医用酒精味的苍白桐木碎屑！'
        });
        if (S.modal && S.modal.type === 'doc') S.modal.pageIdx = 1;
      }
      this.emit();
    },

    // ================= 八座零空气墙物理拆解台判定引擎 =================
    useToolOnWorkbench(wbId, partId, toolId) {
      const S = this.S;
      const wb = S.wb;
      const itemName = toolId === 'bare_hands' ? '徒手操作' : (global.EXAM1_DATA.ITEMS[toolId]?.name || toolId);
      let msg = '';

      // 1. 西厢雕花暖榻与纳魂瓦瓮
      if (wbId === 'wb_couch_jar') {
        if (partId === 'floorboard') {
          if (wb.couchOpened) return this._wbFeedback('暖榻底板已经挑开，下方露出半埋的纳魂黑瓦瓮。');
          if (toolId === 'bare_hands') {
            S.sound = Math.min(100, S.sound + 35);
            return this._wbFeedback('你徒手硬掰雕花榻板，暗榫咬死纹丝不动，反而发出刺耳木板嘎吱声（SOUND +35）！');
          }
          if (['folding_knife', 'flat_chisel', 'silver_scalpel', 'crowbar'].includes(toolId)) {
            wb.couchOpened = true;
            S.sound = Math.min(100, S.sound + (toolId === 'crowbar' ? 25 : 6));
            return this._wbFeedback(`你以【${itemName}】顺缝轻挑暗榫，整块暖榻底板悄无声息掀起——潮湿灰土中赫然半埋着一只贴满朱砂封泥、箍着十字熟铁扣的黑陶瓦瓮！`);
          }
          return this._wbFeedback(`【${itemName}】伸不进暖榻暗榫缝隙。`);
        }
        if (partId === 'seal_mud') {
          if (!wb.couchOpened) return this._wbFeedback('底板尚未挑开，请先处理①暖榻暗榫底板。');
          if (wb.sealSoftened) return this._wbFeedback('朱砂封泥已被湿灰/油脂彻底润软，可以对③子午镇宅铁钉下手了。');
          if (toolId === 'crowbar' || toolId === 'bare_hands') {
            wb.jarSmashed = true;
            S.sound = Math.min(100, S.sound + 75);
            S.blinded = true;
            S.stats.OBS = Math.max(5, S.stats.OBS - 3);
            if (global.AudioEngine) global.AudioEngine.playSfx('jar_crack');
            this.hurtPlayer(20, '【大凶反噬】粗陶瓦瓮在暴力撞击下轰然炸碎！滚滚生石灰尸毒粉劈头盖脸喷进双眼（OBS -3），巨响瞬间传遍全院', false);
            return this._wbFeedback('瓦瓮爆碎反噬！生石灰毒粉迷眼（需西绣楼【朱砂解毒散】解除），且惊动了外院账房伥！');
          }
          if (toolId === 'damp_ash' || toolId === 'cold_lard') {
            wb.sealSoftened = true;
            return this._wbFeedback(`你按古法将【${itemName}】厚厚涂抹在硬结的朱砂封泥与铁箍接缝处——不过半刻，板结的红泥变得酥软湿润，不再发出半点摩擦脆响！`);
          }
          return this._wbFeedback(`直接用【${itemName}】硬刮干硬封泥毫无进展，反而差点崩裂陶口。`);
        }
        if (partId === 'nail_1_slot') {
          if (!wb.couchOpened) return this._wbFeedback('底板尚未挑开。');
          if (wb.nail1Pulled) return this._wbFeedback('【第一钉·子午封瓮钉】已被成功拔除，西厢暖榻吸魂之效彻底废除！');
          if (!wb.sealSoftened) {
            S.sound = Math.min(100, S.sound + 55);
            if (global.AudioEngine) global.AudioEngine.playSfx('jar_crack');
            return this._wbFeedback('封泥未润透就强行起钉！铁箍崩出一声刺耳金石锐响（SOUND +55），瓦瓮裂纹滋滋渗出黑气！');
          }
          if (['folding_knife', 'flat_chisel', 'silver_scalpel'].includes(toolId)) {
            wb.nail1Pulled = true;
            this.addItem('nail_1');
            this.addContribution(5, '古法润泥无声拔除第一钉·子午封瓮钉');
            if (global.AudioEngine) global.AudioEngine.playSfx('nail_pull');
            S.sound = Math.min(100, S.sound + 5);
            return this._wbFeedback('你寻准子午卯酉四扣，以薄刃轻巧一挑——【第一钉·子午封瓮钉】悄无声息滑出瓮口！西厢暖榻的阴寒吸魂之效立时瓦解！');
          }
          return this._wbFeedback(`需要薄口扁刃（折刀 / 扁铁凿 / 手术刀）挑开润软的熟铁四扣。`);
        }
      }

      // 2. 东侧宗祠：泄水石栓与昭穆总牌丧门钉
      if (wbId === 'wb_shrine_nail') {
        if (partId === 'drain_plug') {
          if (wb.drainOpened) return this._wbFeedback('供桌水下的【泄水石栓】已撬开，祠堂黑水正顺着暗渠源源不断涌向二进后院枯井！');
          if (['flat_chisel', 'crowbar', 'folding_knife'].includes(toolId)) {
            wb.drainOpened = true;
            if (global.AudioEngine) global.AudioEngine.playSfx('sluice_rush');
            this.addContribution(5, '撬开宗祠水下泄水石栓导水入井');
            return this._wbFeedback(`你以【${itemName}】死死卡进青砖缝隙发力一别——圆石栓轰然松脱！积聚在宗祠的刺骨黑水打着漩涡急泻入暗渠，直冲二进后院枯井蓄压！`);
          }
          return this._wbFeedback('水下石栓被淤泥咬死，必须用硬铁器（扁铁凿 / 铁撬棍 / 户外折刀）发力撬起！');
        }
        if (partId === 'tablet_nail') {
          if (wb.nail2Pulled) return this._wbFeedback('【第二钉·倒插丧门钉】已稳妥收入随身证物！');
          if (toolId === 'bare_hands') {
            S.bloodMarks += 2;
            this.hurtPlayer(12, '【血契大凶】你徒手去拧七寸丧门钉，生锈倒刺瞬间割破掌心见血！鲜血渗入楠木榫眼，你手腕凭空浮现两道青黑血契印，铁钉纹丝不动', true);
            return this._wbFeedback('血契反噬！切忌生人皮肉直触丧门钉，务必先厚布裹手、冷油脂滑卯！');
          }
          if (toolId === 'med_bandage' || toolId === 'wet_rag') {
            wb.nail2HandWrapped = true;
            return this._wbFeedback(`你将【${itemName}】在掌心严严实实缠了三圈，彻底隔绝倒刺割伤见血的风险！`);
          }
          if (toolId === 'cold_lard') {
            wb.nail2Oiled = true;
            return this._wbFeedback('你将【陶罐冷猪油】仔细涂抹渗入楠木底座钉卯缝隙，干涩死咬的木纹渐渐润泽顺滑。');
          }
          if (['flat_chisel', 'crowbar', 'folding_knife'].includes(toolId)) {
            if (!wb.nail2HandWrapped) {
              S.bloodMarks += 1;
              this.hurtPlayer(10, '未裹手便发力拧钉，铁钉倒刺崩滑划破虎口渗出血珠（血契印 +1）', true);
              return this._wbFeedback('必须先用【急救绷带】或【厚麻布湿团】裹手隔血！');
            }
            if (!wb.nail2Oiled) {
              S.sound = Math.min(100, S.sound + 65);
              return this._wbFeedback('未用冷油脂润卯就强行干撬！生铁刮擦百年老楠木爆出凄厉尖啸（SOUND +65），险些把门外账房伥直接招来！');
            }
            wb.nail2Pulled = true;
            this.addItem('nail_2');
            this.addContribution(5, '裹布滑卯无伤旋出第二钉·倒插丧门钉');
            if (global.AudioEngine) global.AudioEngine.playSfx('nail_pull');
            S.sound = Math.min(100, S.sound + 6);
            return this._wbFeedback('厚布隔血、猪油润卯！你稳稳逆旋三周——七寸长的【第二钉·倒插丧门钉】悄无声息脱离楠木底座！');
          }
          return this._wbFeedback(`【${itemName}】无法直接起出这枚七寸倒插丧门钉。`);
        }
      }

      // 3. 中央正厅：惊魂铜铃、连心铜钉与神龛《买命总契》
      if (wbId === 'wb_hall_portrait') {
        if (partId === 'wall_bell') {
          if (wb.bellPlugged) return this._wbFeedback('夹壁里的惊魂铜铃已被湿布严严实实塞死铃舌，绝不会再作响。');
          if (toolId === 'wet_rag' || toolId === 'med_bandage') {
            wb.bellPlugged = true;
            return this._wbFeedback(`你屏住呼吸顺着画背墙洞探手摸到悬空铜铃，将【${itemName}】死死塞满铃口卡住铜舌——现在扯动红丝也不会发声了！`);
          }
          S.sound = Math.min(100, S.sound + 45);
          if (global.AudioEngine) global.AudioEngine.playSfx('bell_ring');
          return this._wbFeedback(`用【${itemName}】碰触夹壁铜铃，反而撞出一串刺耳急促的铜铃脆响（SOUND +45）！需用柔软厚实的湿布或绷带塞死铃舌。`);
        }
        if (partId === 'portrait_nails') {
          if (wb.nail3Pulled) return this._wbFeedback('【第三钉·盲目连心钉】已全部卸除，通往神龛总契的红丝松垮垂落。');
          if (!wb.bellPlugged) {
            S.sound = Math.min(100, S.sound + 85);
            if (global.AudioEngine) global.AudioEngine.playSfx('bell_ring');
            return this._wbFeedback('【惊魂铃大作】你未塞铜铃便妄动画钉！夹壁内铜铃疯狂炸响（SOUND +85），无目账房伥瞬间锁死正厅！');
          }
          if (['folding_knife', 'flat_chisel', 'silver_scalpel', 'crowbar', 'bare_hands'].includes(toolId)) {
            wb.nail3Pulled = true;
            this.addItem('nail_3');
            this.addContribution(5, '塞死惊魂铃无声拔除第三钉·盲目连心钉');
            if (global.AudioEngine) global.AudioEngine.playSfx('nail_pull');
            return this._wbFeedback('铜铃哑然无声！你稳稳拔出画目双孔里的【第三钉·盲目连心钉】，背连神龛的暗红丝线应声崩断！');
          }
          return this._wbFeedback(`用【${itemName}】不好捏住砖缝里的铜钉。`);
        }
        if (partId === 'master_contract') {
          if (wb.contractTorn || wb.contractBurned) return this._wbFeedback('《乙丑岁奉买命总契》已彻底毁去！');
          if (this.getNailCount() < 3) {
            this.hurtPlayer(25, '【三钉护契反噬】三枚锁宅钉尚未尽拔！你的手刚触到暗红总契，纸面黑霜骤然暴涨，阴寒如刀狠狠冻伤双掌', false);
            return this._wbFeedback(`当前仅拔除 ${this.getNailCount()}/3 枚锁宅钉，总契水火不侵！请先卸尽三钉！`);
          }
          if (toolId === 'damp_ash') {
            wb.contractTorn = true;
            S.flags.gate_unsealed = true;
            this.addContribution(15, '三钉尽拔后阴灰覆印无声撕毁《买命总契》');
            if (global.AudioEngine) {
              global.AudioEngine.playSfx('seal_tear');
              setTimeout(() => global.AudioEngine.playSfx('gate_unseal'), 900);
            }
            return this._wbFeedback('【真·民俗完美退契】你将【湿阴香灰／冷灶灰】厚厚抹没骑缝朱印，双手猛力一撕！暗红总契化作漫天飞灰，前院传来百年黑霜铁链轰然崩断的巨响——正门彻底解封！');
          }
          if (toolId === 'lighter') {
            wb.contractBurned = true;
            S.flags.gate_unsealed = true;
            S.heat = 95;
            S.sound = 85;
            this.addContribution(10, '以明火强焚《买命总契》硬破大门');
            if (global.AudioEngine) global.AudioEngine.playSfx('gate_unseal');
            this.hurtPlayer(20, '明火点燃总契瞬间全院白雾沸腾，暴怒的阴风卷起残火灼伤手臂！快冲往正门逃生', true);
            return this._wbFeedback('总契被烧毁、正门铁链崩断，但明火激怒了整座凶宅！立即前往【朱漆霜封大门】脱逃！');
          }
          return this._wbFeedback('单凭此物无法抹去骑缝朱印（提示：还记得陈木匠残谱牛皮封底的血刻吗？取冷湿阴灰覆印撕裂）。');
        }
      }

      // 4. 东厢鲁门拒煞木障（首夜东厢独守核心）
      if (wbId === 'wb_east_defense') {
        if (partId === 'threshold_ink') {
          if (wb.eastInkDone) return this._wbFeedback('门槛已弹出工整的十字朱砂墨线。');
          if (toolId === 'ink_line') {
            wb.eastInkDone = true;
            return this._wbFeedback('你拉直【朱砂木工墨斗】墨线，“啪、啪”两声在东厢门槛弹出笔直交错的十字朱砂线，门外阴寒立时一滞！');
          }
          return this._wbFeedback('需使用东厢干尸旁的【朱砂木工墨斗】。');
        }
        if (partId === 'threshold_lime') {
          if (wb.eastLimeDone) return this._wbFeedback('破窗下与门缝已撒满厚厚一层干生石灰。');
          if (toolId === 'quicklime') {
            wb.eastLimeDone = true;
            return this._wbFeedback('你将【半袋生石灰】沿破窗窗台与门槛内侧细细铺满，刺骨湿雾遇碱嘶嘶作响，再难渗透进屋！');
          }
          return this._wbFeedback('需使用柴房墙角的【半袋生石灰】。');
        }
        if (partId === 'door_brace') {
          if (wb.eastBraceDone) return this._wbFeedback('朽木重桌已稳稳卡入地面凿槽，顶死柴房破门。');
          if (toolId === 'flat_chisel' || toolId === 'crowbar') {
            wb.eastBraceDone = true;
            return this._wbFeedback(`你以【${itemName}】在青砖地凿出两寸深卡槽，将厚重朽木桌斜斜死抵住破门板，形成稳固的鲁门三角斜撑！`);
          }
          return this._wbFeedback('需用【鲁门扁铁凿】或铁器凿出卡槽才能抵稳木桌。');
        }
      }

      // 5. 内书房鲁班四象暗榫铜匣
      if (wbId === 'wb_lu_box') {
        if (partId === 'box_force') {
          if (wb.lubanOpened) return this._wbFeedback('暗榫铜匣早已开启。');
          S.sound = Math.min(100, S.sound + 55);
          this.hurtPlayer(12, '暴力硬砸触发匣内暗簧毒针，手背一阵麻痛', true);
          return this._wbFeedback('硬砸不仅射出毒针，险些震碎匣内物证！请调准四道鲁班铜滑尺无声开启。');
        }
      }

      // 6. 西绣楼血色绣绷与樟木药奁
      if (wbId === 'wb_embroidery_box') {
        if (partId === 'embroidery_frame') {
          if (toolId === 'bare_hands') {
            this.hurtPlayer(6, '扯动绣绷红线时不慎被残留的生锈绣针扎破指尖', true);
            return this._wbFeedback('绣帕上隐隐有血书，真正的遗物与药方藏在②樟木药奁底板暗格里。');
          }
          return this._wbFeedback('你小心拨开血帕，确认少奶奶沈氏确系被裴敬之逼死于此。');
        }
        if (partId === 'camphor_drawer') {
          if (wb.embroideryOpened) return this._wbFeedback('樟木药奁暗格已开启，内藏素帕与朱砂解毒散均已取出。');
          if (['folding_knife', 'flat_chisel', 'silver_scalpel', 'steel_tape'].includes(toolId)) {
            wb.embroideryOpened = true;
            this.addDoc('doc_embroidery');
            this.addItem('cinnabar_powder');
            this.addContribution(4, '开启西绣楼樟木药奁暗格');
            return this._wbFeedback('暗扣轻弹，药奁底板滑开！你取出《少奶奶沈氏绝命素帕与药理笔记》（已入原件夹）以及一包封蜡完好的【朱砂解毒散】！');
          }
          return this._wbFeedback('暗扣缝隙极细，需用薄刃工具或钢卷尺片挑开。');
        }
      }

      // 7. 后罩房川楠空寿材与裴敬之坐尸（IF② & IF③ 核心台面）
      if (wbId === 'wb_coffin_corpse') {
        if (partId === 'corpse_eyes') {
          S.corpseBoss.awake = true;
          this.hurtPlayer(30, '【大忌】你伸手去扣裴敬之眼窝里的镇魂古铜钱！干尸猛然暴睁血洞双目，阴风炸裂将你狠狠震飞', true);
          return this._wbFeedback('绝不可妄动眼窝镇魂铜钱！');
        }
        if (partId === 'corpse_jaw') {
          if (S.corpseBoss.jadeTaken) return this._wbFeedback('【乙丑借命压舌血玉】已落入你手！');
          if (S.phase === 'day2' && !S.flags.shen_dark_ally) {
            return this._wbFeedback('白昼干尸牙关死咬如铁，且周衡正在穿堂附近巡查——若要强行开颌盗取血玉，必须与沈岚达成【黑市暗盟】（IF②）并于第二夜配合镀银手术刀与扁凿联手下手！');
          }
          if (['flat_chisel', 'silver_scalpel', 'folding_knife'].includes(toolId)) {
            if (!S.flags.shen_dark_ally && this.getNailCount() < 2) {
              S.corpseBoss.awake = true;
              this.hurtPlayer(28, '尸煞护体阴气未泄、也无沈岚手术刀挑断尸口红线，硬撬牙关当场惊醒坐尸反扑', true);
              return this._wbFeedback('硬撬失败！需先卸除至少 2 枚锁宅钉泄气，或与沈岚黑市结盟协力开颌！');
            }
            S.corpseBoss.jadeTaken = true;
            S.corpseBoss.awake = true;
            this.addItem('blood_jade');
            this.addContribution(15, '撬开裴氏坐尸牙关剜出【乙丑借命压舌血玉】');
            if (global.AudioEngine) global.AudioEngine.playSfx('coffin_slide');
            return this._wbFeedback('【IF② 核心达成】沈岚以镀银手术刀精准挑断尸口红线，你持扁铁凿撬开死咬牙关，滚烫邪异的【乙丑借命压舌血玉】落入掌心！坐尸轰然暴起——快触发终局决裂逃亡！');
          }
          return this._wbFeedback('必须用扁铁凿、镀银手术刀或户外折刀撬开干尸牙关。');
        }
        if (partId === 'coffin_center') {
          if (S.corpseBoss.sealed) return this._wbFeedback('川楠寿材已反噬封棺！');
          if (toolId === 'folding_knife' || toolId === 'silver_scalpel') {
            if (!this.hasItem('substitute_doll') || !this.hasDoc('doc_pei_memoir')) {
              return this._wbFeedback('需要同时掌握【桐木替死偶】与内书房《裴敬之八字红庚帖》，才能在木偶背面刻下裴贼生辰八字！');
            }
            wb.dollCarved = true;
            return this._wbFeedback('你运刃如飞，在【桐木替死偶】背面刻下「清同治十四年乙亥七月十五子时 · 裴敬之」，并蘸满棺底阴冷尸油！现在只需以【第二钉·倒插丧门钉】倒钉入棺底子午阵眼！');
          }
          if (toolId === 'nail_2' || toolId === 'substitute_doll') {
            if (!wb.dollCarved) {
              return this._wbFeedback('尚未在【桐木替死偶】背面刻下裴敬之完整生辰八字！请先用折刀或镀银手术刀对准棺底暗槽完成刻偶蘸油。');
            }
            if (!wb.nail2Pulled) {
              return this._wbFeedback('缺少宗祠起出的七寸【第二钉·倒插丧门钉】作镇棺反钉！');
            }
            S.corpseBoss.sealed = true;
            S.flags.gate_unsealed = true;
            S.flags.shen_curse_resolved = true;
            this.addContribution(15, '以裴敬之八字替死偶倒钉川楠棺逆转买命大阵');
            if (global.AudioEngine) {
              global.AudioEngine.playSfx('coffin_slide');
              setTimeout(() => global.AudioEngine.playSfx('gate_unseal'), 800);
            }
            return this._wbFeedback('【IF③ 逆命封棺达成】七寸丧门钉贯透刻满裴贼八字的桐木替死偶，死死钉入川楠空棺子午阵眼！买命大阵轰然倒转，裴氏尸煞发出凄厉哀嚎被活生生吸进寿材合盖封死，沈岚腕间黑咒亦随之寸寸崩解！');
          }
          return this._wbFeedback('棺底子午暗槽需先以利刃刻就裴贼八字替死偶，再以七寸丧门钉倒钉入棺。');
        }
      }

      // 8. 枯井千斤水闸、河埠沉匣与乌篷船（M2 & IF① 核心台面）
      if (wbId === 'wb_sluice_boat') {
        if (partId === 'sluice_winch') {
          if (wb.sluiceBlasted) return this._wbFeedback('千斤水闸已放水冲碎后门水封铁栅！河口彻底打通！');
          if (toolId === 'sluice_key') {
            wb.sluiceUnlocked = true;
            return this._wbFeedback('咔哒一声，内书房取来的【水口千斤闸铜钥】无声解开了缠在绞盘上的大铜锁！');
          }
          if (toolId === 'cold_lard') {
            wb.sluiceOiled = true;
            return this._wbFeedback('你用【陶罐冷猪油】把锈死咬合的千斤闸齿轮与铁链滚轴彻底润透！');
          }
          if (toolId === 'bare_hands' || toolId === 'crowbar') {
            if (!wb.sluiceUnlocked) return this._wbFeedback('绞盘铜锁尚未打开！请先去二进内书房开启鲁班暗匣取得【水口千斤闸铜钥】。');
            if (!wb.sluiceOiled) {
              S.sound = Math.min(100, S.sound + 60);
              return this._wbFeedback('生锈绞盘未涂冷油脂强行拉动，铁链摩擦发出震耳欲聋的金属尖啸（SOUND +60）且卡死半途！');
            }
            if (!wb.drainOpened) {
              return this._wbFeedback('枯井底积水尚浅，水压不够冲开铁栅！请先去一进【东侧宗祠】撬开供桌水下的【泄水石栓】导水蓄压！');
            }
            wb.sluiceBlasted = true;
            this.addContribution(10, '引宗祠阴水提开千斤闸轰碎河埠水封铁栅');
            if (global.AudioEngine) global.AudioEngine.playSfx('sluice_rush');
            return this._wbFeedback('【千钧激流破栅】你猛力摇起润透的千斤水闸！蓄满枯井的黑水化作怒龙咆哮冲出暗渠，一声巨响将后门黑水河埠的水封锈铁栅生生轰碎！');
          }
          return this._wbFeedback(`【${itemName}】无法操作这台千斤水闸绞盘。`);
        }
        if (partId === 'river_dredge') {
          if (wb.sunkenBoxDredged) return this._wbFeedback('河底沉水小铁匣已打捞上岸，【秦小栓银锁与祭河死契】就在你手里！');
          if (toolId === 'iron_hook_rope' || toolId === 'steel_tape') {
            wb.sunkenBoxDredged = true;
            this.addDoc('doc_sunken_box');
            this.addItem('child_lock_deed');
            this.addContribution(8, '从黑水河埠捞起秦小栓沉水铁匣与祭河死契');
            return this._wbFeedback(`你甩出【${itemName}】反复钩探浑浊冰冷的河底，沉甸甸拉上一只挂满黑泥的生锈小铁匣！撬开后竟藏着【秦小栓长命银锁与血指印祭河死契】！（已开启 IF① 策反账房伥前置）`);
          }
          return this._wbFeedback('河水刺骨且深不见底，必须使用【铁钩麻绳】或长钩工具下水打捞！');
        }
        if (partId === 'sampan_hull') {
          if (wb.boatRepaired) return this._wbFeedback('乌篷船船底漏缝已用桐油麻絮严密捻实，随时可摇橹渡河！');
          if (toolId === 'tung_oil_hemp') {
            wb.boatRepaired = true;
            this.addContribution(5, '以桐油麻絮修妥黑水河埠旧乌篷船');
            return this._wbFeedback('你熟练地将浸透桐油的粗麻絮死死塞进船底指宽裂缝，反复敲打捻严——旧乌篷船浮力恢复，完全可以载人破雾渡河！');
          }
          return this._wbFeedback('船底裂开指宽漏缝，需在河埠船棚取用【桐油与麻絮】捻缝修补！');
        }
      }

      return this._wbFeedback(msg || `用【${itemName}】对当前部位操作没有明显反应。`);
    },

    // 鲁班四象暗榫铜匣拨尺判定（正解：[1,2,6,7] = 病·离·害·本）
    cycleLubanSlider(idx) {
      const S = this.S;
      if (S.wb.lubanOpened) return;
      S.wb.lubanSliders[idx] = (S.wb.lubanSliders[idx] + 1) % 8;
      if (global.AudioEngine) global.AudioEngine.playSfx('watch');
      this.emit();
    },

    submitLubanCipher() {
      const S = this.S;
      if (S.wb.lubanOpened) return;
      const g = S.wb.lubanSliders;
      const gates = global.LUBAN_GATES;
      const str = g.map(i => gates[i]).join('·');
      if (g[0] === 1 && g[1] === 2 && g[2] === 6 && g[3] === 7) {
        S.wb.lubanOpened = true;
        this.addDoc('doc_pei_memoir');
        this.addItem('sluice_key');
        this.addContribution(7, '独立推算鲁班尺【病·离·害·本】无损开启内书房暗匣');
        if (global.AudioEngine) global.AudioEngine.playSfx('paper_flip');
        this._wbFeedback(`【机括轻响 · 病·离·害·本】四道铜尺严丝合缝！紫檀暗匣无声弹开，露出大红《裴敬之八字庚帖与借寿私记》以及一枚沉甸甸的【水口千斤闸铜钥】！`);
      } else {
        this.hurtPlayer(12, `拨定【${str}】按下铜钮——匣缝骤然弹出一根乌黑细针刺中指腹（错拨机关反噬）`, true);
        this._wbFeedback(`密码【${str}】有误，触动毒针！请重读东厢《鲁门营造厌胜残谱》内页关于裴贼三凶一正的提示。`);
      }
    },

    _wbFeedback(text) {
      this.S.toast = text;
      this.pushLog({ type: 'system', text });
      this.emit();
      return text;
    },

    // ================= 终局结算与死考空间大厅 =================
    finishExam(routeId, rankTitle, rankDesc, teamAlignment, uniqueRelic) {
      const S = this.S;
      S.roundDone[3] = true;
      const base = (S.roundDone[1] ? 20 : 0) + (S.roundDone[2] ? 35 : 0) + (S.roundDone[3] ? 45 : 0);
      const bonus = S.contributionScore;
      const fee = 60;
      const missingHp = S.maxHp - S.hp;
      let repair = 0;
      if (missingHp >= 65) repair = 45;
      else if (missingHp >= 35) repair = 25;
      else if (missingHp >= 10 || S.bleeding) repair = 10;

      const net = base + bonus - fee - repair;
      const survivors = Object.values(S.npcs).filter(n => n.alive).map(n => n.id);
      if (uniqueRelic) this.addItem(uniqueRelic);
      if (routeId === 'IF3_seven_survivors') S.cTierUnlocked = true;

      S.settlement = {
        routeId,
        rank: rankTitle,
        rankDesc,
        teamAlignment,
        uniqueRelic: uniqueRelic || 'none',
        base,
        bonus,
        fee,
        repair,
        net,
        survivors
      };

      if (net < 0) {
        this.triggerGameOver(
          `你虽逃出白雾古宅，但三轮基础分(+${base})＋贡献(+${bonus})扣除死考空间基础费(-${fee})与躯体修复费(-${repair})后，净积分跌破零点（${net} 分）。深红旋涡轰然压下，白光将你当场抹杀。`,
          '结算净分低于零点，执行抹杀。'
        );
        return;
      }

      S.points = net;
      S.stage = 'space';
      S.phase = 'ending';
      S.modal = null;

      // 写入跨场继承存档协议（直连第 2 场《黑水船坞》）
      const s1Save = {
        exam1_cleared: true,
        player_origin: S.origin,
        route_id: routeId,
        team_alignment: teamAlignment,
        survivors,
        shen_curse_resolved: !!S.flags.shen_curse_resolved,
        unique_relic: uniqueRelic || 'none',
        net_points_remaining: S.points,
        c_tier_unlocked: !!S.cTierUnlocked,
        redeemed_loadout: S.shopBought
      };
      try { localStorage.setItem('DEATH_EXAM_S1_SAVE', JSON.stringify(s1Save)); } catch {}
      if (global.AudioEngine) {
        global.AudioEngine.playBgm('manor_quiet');
        global.AudioEngine.playSfx('gate_unseal');
        global.AudioEngine.playSystemBroadcast(
          'sys_exam_clear',
          '第三轮考核完成。正在传回死考空间，执行基础费用与躯体修复清算。'
        );
      }
      this.emit();
    },

    triggerGameOver(reason, spokenOverride) {
      this.S.stage = 'gameover';
      this.S.modal = null;
      this.S.gameOverReason = reason;
      if (global.AudioEngine) {
        global.AudioEngine.playSystemBroadcast(
          'sys_dead_player',
          spokenOverride || '考生，C-N-零九四七一，已死亡。'
        );
      }
      this.emit();
    },

    buyShopItem(itemId) {
      const S = this.S;
      const it = global.EXAM1_DATA.SHOP_ITEMS.find(x => x.id === itemId);
      if (!it) return;
      if (it.requiresC && !S.cTierUnlocked) return;
      if (S.shopBought.includes(itemId) || S.points < it.price) return;
      S.points -= it.price;
      S.shopBought.push(itemId);
      S.spaceNote = `指尖触碰深红旋涡，扣除 ${it.price} 积分——【${it.name}】在白光中凝实落入手中！已同步写入第 2 场《黑水船坞》跨场构筑档案。`;
      try {
        const raw = localStorage.getItem('DEATH_EXAM_S1_SAVE');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.net_points_remaining = S.points;
          parsed.redeemed_loadout = S.shopBought;
          localStorage.setItem('DEATH_EXAM_S1_SAVE', JSON.stringify(parsed));
        }
      } catch {}
      this.emit();
    },

    spaceRest(action) {
      const S = this.S;
      if (action === 'finish') {
        S.spaceEnded = true;
        const align = S.settlement?.teamAlignment;
        S.spaceNote = align === 'black_market_duo'
          ? '72 小时休整结束！沈岚将镀银手术刀收回袖口，冷淡瞥了一眼远处持斧的周衡。深红旋涡轰鸣开启——你与沈岚以【黑市双人组】暗线身份踏入第 2 场《黑水船坞》！'
          : (align === 'zhou_squad'
            ? '72 小时休整结束！周衡拍了拍你的肩膀，陈默咧嘴亮出新改装的震动器。全队并肩踏入深红旋涡——第 2 场《黑水船坞》即将载入！'
            : '72 小时休整结束！你独自攥紧刚兑换的装备，在冰冷腕表倒计时归零的瞬间迈入深红旋涡，直面第 2 场《黑水船坞》！');
        this.emit();
        return;
      }
      if (S.restAP <= 0) return;
      S.restAP -= 1;
      if (action === 'tea') {
        const align = S.settlement?.teamAlignment;
        S.spaceNote = align === 'black_market_duo'
          ? '你在弧廊角落与沈岚低声核对了【压舌血玉】的代偿条款。周衡远远望来一眼，眉头紧锁转身进了自己的房门。'
          : (S.npcs.zhou.alive && !S.flags.zhou_betrayed
            ? '周衡用 1 积分在公共大厅换了两杯模拟热茶，沉声教你死考铁律：“活人别省保命钱，但也别乱买花架子。下场《黑水船坞》水鬼横行，有把破邪兵器比枪靠谱。”'
            : '你独自坐在半圆大厅的长椅上，反复复盘裴宅十份原件与死考的冷酷扣费机制，心志愈发沉稳。');
      } else if (action === 'train') {
        S.stats.PHY += 1;
        S.spaceNote = '你推开写着 CN-09471 的私人房门，在重力模拟室里适应刚兑换的装备与呼吸节奏（PHY +1）。';
      } else if (action === 'watch') {
        S.spaceNote = '你触碰深红旋涡边缘核对下场前兆：腕表隐约浮现潮汐盐雾与锈蚀铁锚的暗纹——第 2 场《黑水船坞》将是比白雾古宅更凶险的封闭港区死局。';
      }
      this.emit();
    }
  };

  global.EXAM1_ENGINE = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
