// ============================================================================
// 《白雾古宅 · 裴宅买命契》v3.0 — 暗调中式民俗 UI、原件翻验台、物理拆解台与死考空间大厅
// ============================================================================
(function (global) {
  'use strict';

  const E = () => global.EXAM1_ENGINE;
  const SRef = () => global.EXAM1_ENGINE.S;
  const DATA = () => global.EXAM1_DATA;
  const DOCS = () => global.EXAM1_DOCS;
  const WBS = () => global.EXAM1_WORKBENCHES;

  const missingAssets = new Set();

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function resolveSceneImg(sceneKey) {
    const m = global.AV_MANIFEST && global.AV_MANIFEST.scenes;
    const primary = m && m[sceneKey];
    if (primary && !missingAssets.has(primary)) return primary;
    // 二进场景若 Codex Batch 3 尚未推图，平滑回退到现有主厅/河埠/古宅场景
    const fallbackMap = {
      coffin_hall: 'hall',
      inner_study: 'west',
      embroidery_loft: 'west',
      corridor: 'hall'
    };
    const fbKey = fallbackMap[sceneKey] || 'courtyard';
    return (m && m[fbKey]) || 'assets/exam1_courtyard.jpg';
  }

  function resolvePropImg(propKey) {
    const m = global.AV_MANIFEST && global.AV_MANIFEST.props;
    const primary = m && m[propKey];
    if (primary && !missingAssets.has(primary)) return primary;
    return (m && m.prop_ledger) || 'assets/props/prop_ledger.webp';
  }

  function resolvePortrait(npcId, emotion) {
    const m = global.AV_MANIFEST && global.AV_MANIFEST.portraits;
    const pack = m && m[npcId];
    if (!pack) return '';
    return pack[emotion] || pack.calm || '';
  }

  function resolveHallImg(edition) {
    const m = global.AV_MANIFEST && global.AV_MANIFEST.scenes;
    return edition === 'judgment'
      ? (m && m.hall_judgment) || '../assets/hall-judgment.webp'
      : (m && m.space) || '../assets/hall-vortex.webp';
  }

  function getRoomWorkbenchId(roomId) {
    const map = {
      west: 'wb_couch_jar',
      shrine: 'wb_shrine_nail',
      hall: 'wb_hall_portrait',
      east: 'wb_east_defense',
      inner_study: 'wb_lu_box',
      embroidery_loft: 'wb_embroidery_box',
      coffin_hall: 'wb_coffin_corpse',
      well: 'wb_sluice_boat',
      canal: 'wb_sluice_boat'
    };
    return map[roomId] || null;
  }

  function getDynamicAutopsyLines(S) {
    const lines = [];
    const deadNpcs = Object.values(S.npcs).filter(n => !n.alive);
    if (deadNpcs.length === 0) {
      lines.push('【首夜零伤亡 · 世界态 W2】昨夜竟无一人折损。但推开二进后罩房时，太师椅上的裴敬之干尸指甲干枯、怨气翻涌——凶宅岁奉落空，今日白雾将于 17:00 提前合拢，大门黑霜铁链彻底焊死！');
    } else {
      lines.push(`【首夜见血 · 世界态 W1】昨夜遇难者：${deadNpcs.map(n => `${n.name}(${n.code})`).join('、')}。尸身手腕均浮现青黑买命契印，心口冰冷空虚。`);
      lines.push('对照二进后罩房坐尸：裴敬之干尸指尖隐现暗红血气，眼窝古铜钱渗出鲜血——已吸食活人魂魄回阳，今夜 20:00 便会提前离座巡游内宅！');
    }
    return lines;
  }

  // ================= 主渲染入口 =================
  function render() {
    const root = document.getElementById('root');
    if (!root) return;
    const S = SRef();
    if (!S) return;

    if (S.stage === 'char_select') {
      root.innerHTML = renderCharSelect();
    } else if (S.stage === 'space') {
      root.innerHTML = renderSpaceHall(S);
    } else if (S.stage === 'gameover') {
      root.innerHTML = renderGameOver(S);
    } else {
      root.innerHTML = renderPlayScreen(S);
      const feed = document.getElementById('story-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }
  }

  // ================= 1. 开局出身选择 =================
  function renderCharSelect() {
    const origins = DATA().ORIGINS;
    const portraits = (global.AV_MANIFEST && global.AV_MANIFEST.playerPortraits) || {};
    return `
    <div class="relative min-h-screen w-full flex items-center justify-center p-5 md:p-8 text-[#e8e2d5]" style="background:#0c0c0e;">
      <img src="${resolveSceneImg('alley')}" referrerPolicy="no-referrer" onerror="window.UI.onImgError(this)" alt="" class="fixed inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none" />
      <div class="fixed inset-0 bg-gradient-to-b from-black/75 via-black/65 to-[#09090b]/95 pointer-events-none"></div>
      <div class="relative z-10 w-full max-w-3xl bg-[#111216]/96 border border-amber-200/18 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5">
        <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div class="text-[11px] tracking-[0.25em] text-amber-300/80 uppercase font-sans-ui">第一季第 1 场 · 两天两夜标准三轮制</div>
            <h1 class="text-2xl md:text-3xl font-bold font-serif text-stone-100 mt-1 tracking-wide">白雾古宅 · 裴宅买命契</h1>
            <p class="text-xs text-stone-400 mt-1.5 leading-5">选定你的现实身份与随身物件。本场为「零高亮原件翻验 ＋ 零空气墙物理拆解 ＋ 双煞潜行 ＋ 三主线与三真·IF线」完整版。</p>
          </div>
          <a href="../index.html" class="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-stone-300 transition">返回死考大厅</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${origins.map(o => {
            const pSrc = portraits[o.portraitKey] || '';
            const stItem = DATA().ITEMS[o.startItem];
            return `
            <button type="button" onclick="window.UI.chooseOrigin('${o.id}')" class="text-left flex gap-3.5 p-4 rounded-xl bg-white/[0.03] hover:bg-amber-950/25 border border-white/10 hover:border-amber-400/50 transition group">
              ${pSrc ? `<img src="${pSrc}" referrerPolicy="no-referrer" onerror="window.UI.onPortraitError(this)" alt="${esc(o.name)}" class="w-16 h-22 object-cover rounded-lg border border-white/15 shrink-0 bg-[#141311]" />` : ''}
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-semibold text-stone-100 group-hover:text-amber-200 transition">${esc(o.name)}</span>
                </div>
                <div class="text-[10px] font-mono-ui text-amber-300/80 mt-0.5">${esc(o.tag)}</div>
                <p class="text-[11.5px] text-stone-400 mt-1.5 leading-5">${esc(o.bond)}</p>
                <div class="mt-2 pt-1.5 border-t border-white/5 text-[11px] text-emerald-300/90">随身物：${esc(stItem.name)}</div>
                <div class="text-[10.5px] text-stone-500 mt-0.5">${esc(o.note)}</div>
              </div>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  // ================= 2. 考场主游玩界面 =================
  function renderPlayScreen(S) {
    const eng = E();
    const isPrologue = S.phase === 'prologue';
    const room = DATA().ROOMS[S.room] || DATA().ROOMS.courtyard;
    const activeSceneKey = isPrologue
      ? 'alley'
      : ((S.watchman.state === 'HUNT' || S.sceneId === 'n1_west_zhao_rescue')
          ? 'crisis_window'
          : room.sceneKey);
    const sceneSrc = resolveSceneImg(activeSceneKey);
    const wbId = isPrologue ? null : getRoomWorkbenchId(S.room);
    const nailCount = eng.getNailCount();
    const roundTitles = {
      0: isPrologue ? '序幕 · 雨巷白雾' : '序幕 · 前院初醒',
      1: '第一轮 · 投宿 (20分)',
      2: '第二轮 · 验契 (35分)',
      3: '第三轮 · 断岁 (45分)'
    };

    const isFreeExplore = S.sceneId === 'free_explore';
    const isNight = S.phase === 'night1' || S.phase === 'night2';
    const locationLabel = isPrologue ? '江南旧巷' : eng.getRoomName(S.room);
    const visibleItems = eng.getVisibleSceneItems();
    const totalSceneItems = eng.getCurrentSceneItems().length;
    const hasMoreBeats = eng.hasUnrevealedBeats();
    const remainingBeats = Math.max(0, totalSceneItems - visibleItems.length);
    const hasPastHistory = (S.sceneStartIdx || 0) > 0;

    return `
    <div class="relative w-screen h-screen overflow-hidden flex flex-col text-[#e7e1d6] bg-[#0b0b0d] font-sans-ui">
      <!-- 场景底图与暗调雾层 -->
      <img src="${sceneSrc}" referrerPolicy="no-referrer" onerror="window.UI.onImgError(this)" alt="" class="fixed inset-0 w-full h-full object-cover opacity-35 pointer-events-none select-none transition-all duration-700" />
      <div class="fixed inset-0 bg-gradient-to-b from-[#0a0b0e]/85 via-[#0c0d11]/75 to-[#09090b]/95 pointer-events-none"></div>

      <!-- 顶部腕表状态栏 -->
      <header class="relative z-20 shrink-0 px-4 py-2.5 bg-[#0b0c10]/96 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="px-2.5 py-1 rounded-md bg-red-950/60 border border-red-500/40 text-amber-200 text-xs font-mono-ui font-semibold">${esc(eng.formatClock(S.clockMin))} · ${esc(eng.getWatchLabel())}</span>
          <span class="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-stone-200 text-xs">${roundTitles[S.round] || ''}</span>
          <span class="text-xs text-stone-300">当前位置：<b class="text-amber-200">${esc(locationLabel)}</b></span>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="font-mono-ui ${S.hp <= 40 ? 'text-rose-400 font-bold' : 'text-emerald-300'}">HP ${S.hp}/${S.maxHp}${S.bleeding ? ' 🩸流血' : ''}${S.blinded ? ' 👁迷眼' : ''}</span>
          ${!isPrologue ? `
            <span class="font-mono-ui ${S.sound >= 50 ? 'text-rose-400' : 'text-stone-400'}">声响 ${S.sound}</span>
            <span class="font-mono-ui ${S.heat >= 40 ? 'text-amber-400' : 'text-stone-400'}">热源 ${S.heat}</span>
            <span class="font-mono-ui text-amber-300">拔钉 ${nailCount}/3</span>
          ` : ''}
          ${hasPastHistory ? `<button type="button" onclick="window.UI.openHistory()" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-amber-200">📜 前情回看</button>` : ''}
          <button type="button" onclick="window.UI.togglePace()" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-[11px]">${!global.AudioEngine || global.AudioEngine.paceEnabled ? '📖 逐段展开' : '⚡ 全段瞬显'}</button>
          <button type="button" onclick="window.UI.toggleVoice()" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-[11px]">${global.AudioEngine && global.AudioEngine.voiceEnabled ? '🎙 语音开' : '🔇 语音关'}</button>
          <button type="button" onclick="window.UI.toggleAudio()" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-[11px]">${global.AudioEngine && global.AudioEngine.sfxEnabled ? '🔊 音乐/音效开' : '🔇 静音'}</button>
          <a href="../index.html" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-stone-300">返回大厅</a>
        </div>
      </header>

      <!-- 主体双栏布局 -->
      <div class="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <!-- 左主舞台：当前场景独立叙事流 + 行动指令区 -->
        <main class="flex-1 min-w-0 flex flex-col min-h-0 border-r border-white/10">
          ${S.toast ? `
          <div class="shrink-0 mx-4 mt-3 px-3.5 py-2 rounded-lg bg-amber-950/75 border border-amber-400/40 text-xs text-amber-100 flex items-center justify-between gap-3">
            <span>${esc(S.toast)}</span>
            <button type="button" onclick="window.UI.clearToast()" class="text-amber-300 hover:text-white text-xs">✕</button>
          </div>` : ''}

          <!-- 当前场景独立滚动叙事流（点击空白处逐段推进） -->
          <div id="story-feed" ${hasMoreBeats ? 'onclick="window.UI.nextBeat()"' : ''} class="flex-1 min-h-0 overflow-y-auto px-4 md:px-7 py-5 space-y-3.5 scroll-thin ${hasMoreBeats ? 'cursor-pointer select-none' : ''}">
            ${S.sceneTitle ? `
            <div class="flex items-center justify-between pb-2.5 mb-1 border-b border-amber-200/15">
              <div class="text-xs font-mono-ui tracking-[0.18em] text-amber-300/85 uppercase">◈ ${esc(S.sceneTitle)}</div>
              <div class="text-[10px] font-mono-ui text-stone-500">${visibleItems.length} / ${totalSceneItems}</div>
            </div>` : ''}
            ${visibleItems.map((item, idx) => renderLogItem(item, idx === visibleItems.length - 1)).join('')}
          </div>

          <!-- 底部操作台：未读完本幕前仅显示叙事推进条，读完才浮现抉择 -->
          <section class="shrink-0 p-4 bg-[#0d0e13]/95 border-t border-white/10 space-y-2.5 max-h-[38vh] overflow-y-auto scroll-thin">
            ${hasMoreBeats
              ? `<div class="flex items-center gap-2.5">
                  <button type="button" onclick="window.UI.nextBeat()" class="flex-1 px-4 py-3 rounded-xl bg-amber-950/45 hover:bg-amber-900/55 border border-amber-400/45 hover:border-amber-300/80 text-xs md:text-sm text-amber-100 font-medium transition flex items-center justify-between">
                    <span>点击继续阅读（或按空格键）</span>
                    <span class="text-[11px] font-mono-ui text-amber-300/80">剩余 ${remainingBeats} 段 ▾</span>
                  </button>
                  <button type="button" onclick="window.UI.revealAll()" class="shrink-0 px-3.5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/15 text-xs text-stone-400 hover:text-stone-200 transition">
                    展开本幕
                  </button>
                </div>`
              : (S.sceneId === 'choose_callsign'
                  ? renderCallsignPanel()
                  : (S.pendingChoices && S.pendingChoices.length > 0
                      ? `<div class="space-y-2">
                          ${S.pendingChoices.map(c => `
                            <button type="button" onclick="window.UI.dispatchStory('${esc(c.action)}')" class="w-full text-left px-4 py-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/45 border border-amber-400/35 hover:border-amber-300/70 text-xs md:text-sm text-stone-100 transition">
                              ▸ ${esc(c.label)}
                            </button>`).join('')}
                         </div>`
                      : renderFreeActionBar(S, wbId, isFreeExplore, isNight)))}
          </section>
        </main>

        <!-- 右侧情报与拓扑面板 -->
        <aside class="w-full lg:w-[390px] xl:w-[420px] shrink-0 bg-[#0b0c10]/95 flex flex-col min-h-0 max-h-[42vh] lg:max-h-none overflow-y-auto scroll-thin p-4 space-y-4">
          ${isPrologue
            ? renderPrologueSidebar(S)
            : `${renderTopologyMap(S)}${renderInventoryAndDocs(S)}${renderNpcRoster(S)}`}
        </aside>
      </div>

      ${S.modal ? renderModal(S) : ''}
    </div>`;
  }

  function renderPrologueSidebar(S) {
    return `
    <div class="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2.5">
      <div class="text-[11px] font-mono-ui tracking-widest text-slate-400 uppercase">WATCH TERMINAL · CN-09471</div>
      <div class="text-xs text-stone-300 leading-6">当前尚未载入考场拓扑。</div>
      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono-ui text-stone-400">
        <div>体魄 PHY：${S.stats.PHY}</div>
        <div>敏捷 AGI：${S.stats.AGI}</div>
        <div>观察 OBS：${S.stats.OBS}</div>
        <div>意志 WIL：${S.stats.WIL}</div>
      </div>
    </div>
    ${renderInventoryAndDocs(S)}`;
  }

  function renderCallsignPanel() {
    return `
    <div class="space-y-2.5">
      <button type="button" onclick="window.UI.submitRealName()" class="w-full text-left px-4 py-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/45 border border-amber-400/35 hover:border-amber-300/70 text-xs md:text-sm text-stone-100 transition">
        ▸ 如实答道：“陆寻。”
      </button>
      <div class="flex flex-col sm:flex-row gap-2">
        <input id="callsign-input" type="text" maxlength="8" placeholder="或输入你想报出的化名（1～8字）" onkeydown="if(event.key==='Enter'){window.UI.submitCustomCallsign();}" class="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/20 focus:border-amber-400/70 focus:outline-none text-xs md:text-sm text-stone-100 placeholder:text-stone-500" />
        <button type="button" onclick="window.UI.submitCustomCallsign()" class="shrink-0 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-amber-900/50 border border-white/20 hover:border-amber-400/60 text-xs md:text-sm text-stone-100 font-medium transition">
          报出此称呼
        </button>
      </div>
    </div>`;
  }

  function renderLogItem(item, isLatest) {
    const anim = isLatest ? ' beat-enter' : '';
    if (item.type === 'broadcast') {
      return `
      <div class="px-4 py-3 rounded-xl bg-slate-950/85 border border-slate-500/45 shadow-inner text-xs md:text-[13px] leading-6 text-slate-200 font-mono-ui whitespace-pre-line${anim}">
        <div class="flex items-center justify-between text-[10px] tracking-[0.18em] text-slate-400 uppercase mb-1">
          <span>◈ GLOBAL DEATH EXAM · VOICE BROADCAST</span>
          <span>[${esc(item.time)}]</span>
        </div>
        <div>${esc(item.text)}</div>
      </div>`;
    }
    if (item.type === 'dialog') {
      const pSrc = item.portrait ? resolvePortrait(item.portrait, item.emotion || 'calm') : '';
      return `
      <div class="flex gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10${anim}">
        ${pSrc ? `<img src="${pSrc}" referrerPolicy="no-referrer" onerror="window.UI.onPortraitError(this)" alt="" class="w-11 h-14 object-cover rounded-lg border border-white/15 shrink-0 bg-[#141311]" />` : ''}
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between text-[11px] text-amber-300/90 font-medium">
            <span>${esc(item.speaker || '')}</span>
            <span class="font-mono-ui text-stone-500">${esc(item.time)}</span>
          </div>
          <p class="text-[13.5px] leading-6 text-stone-100 mt-1 whitespace-pre-line">${esc(item.text)}</p>
        </div>
      </div>`;
    }
    if (item.type === 'system') {
      return `
      <div class="px-3.5 py-2.5 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs md:text-[13px] leading-6 text-amber-100 whitespace-pre-line${anim}">
        <span class="font-mono-ui text-[10px] text-amber-400/70 mr-2">[${esc(item.time)}]</span>${esc(item.text)}
      </div>`;
    }
    if (item.type === 'danger') {
      return `
      <div class="px-3.5 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/45 text-xs md:text-[13px] leading-6 text-rose-100 whitespace-pre-line${anim}">
        <span class="font-mono-ui text-[10px] text-rose-300 mr-2">[${esc(item.time)}]</span>${esc(item.text)}
      </div>`;
    }
    if (item.type === 'evidence') {
      return `
      <div class="px-3.5 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/35 text-xs md:text-[13px] leading-6 text-emerald-100 whitespace-pre-line${anim}">
        <span class="font-mono-ui text-[10px] text-emerald-300 mr-2">[${esc(item.time)}]</span>${esc(item.text)}
      </div>`;
    }
    return `
    <div class="px-1 text-[13.5px] leading-7 text-stone-300 whitespace-pre-line${anim}">
      <span class="font-mono-ui text-[10px] text-stone-500 mr-1.5">${esc(item.time)}</span>${esc(item.text)}
    </div>`;
  }

  function renderFreeActionBar(S, wbId, isFreeExplore, isNight) {
    const eng = E();
    const btns = [];

    // 搜查当前房间
    btns.push(`<button type="button" onclick="window.UI.searchRoom()" class="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-stone-100 transition">🔍 细致搜查本室</button>`);

    // 打开当前房间物理拆解台
    if (wbId && WBS()[wbId]) {
      btns.push(`<button type="button" onclick="window.UI.openWorkbench('${wbId}')" class="px-3.5 py-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-400/50 text-xs text-amber-100 font-medium transition">🛠 拆解台：${esc(WBS()[wbId].title.split('·')[1] || WBS()[wbId].title)}</button>`);
    }

    // 同房存活考生交谈按钮（保护期 & 次日白昼）
    if (S.phase === 'protect' || S.phase === 'day2') {
      const present = Object.values(S.npcs).filter(n => n.alive && n.room === S.room);
      present.forEach(n => {
        btns.push(`<button type="button" onclick="window.UI.talkNpc('${n.id}')" class="px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-xs text-stone-200 transition">💬 与${esc(n.name)}交谈</button>`);
      });
    }

    // 随身医疗/解毒
    if (eng.hasItem('med_bandage') && (S.bleeding || S.hp < S.maxHp)) {
      btns.push(`<button type="button" onclick="window.UI.useConsumable('med_bandage')" class="px-3 py-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-400/40 text-xs text-emerald-200">🩹 绷带止血包扎</button>`);
    }
    if (eng.hasItem('cinnabar_powder') && S.blinded) {
      btns.push(`<button type="button" onclick="window.UI.useConsumable('cinnabar_powder')" class="px-3 py-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-400/40 text-xs text-emerald-200">🧪 服朱砂解毒散</button>`);
    }

    // 保护期提前触发选房
    if (S.phase === 'protect') {
      btns.push(`<button type="button" onclick="window.UI.forceShelter()" class="px-3 py-2 rounded-lg bg-rose-950/45 hover:bg-rose-900/55 border border-rose-500/40 text-xs text-rose-200">⏳ 回前院集合 · 定屋过夜</button>`);
    }

    // 第 2 日白昼：提前开启酉时中堂摊牌
    if (S.phase === 'day2' && !S.flags.confronted_council) {
      btns.push(`<button type="button" onclick="window.UI.forceCouncil()" class="px-3 py-2 rounded-lg bg-amber-900/40 hover:bg-amber-800/55 border border-amber-400/50 text-xs text-amber-100">⚖️ 前往正厅 · 发起酉时摊牌</button>`);
    }

    // 第二夜战术辅助
    if (S.phase === 'night2') {
      if (eng.hasItem('vib_sensor') && !S.flags.vib_deployed) {
        btns.push(`<button type="button" onclick="window.UI.deployVib()" class="px-3 py-2 rounded-lg bg-sky-950/55 hover:bg-sky-900/65 border border-sky-400/45 text-xs text-sky-200">📡 部署震动感应器</button>`);
      }
      if (eng.hasItem('copper_kettle') && (S.room === 'well' || S.room === 'east')) {
        btns.push(`<button type="button" onclick="window.UI.setDecoy()" class="px-3 py-2 rounded-lg bg-sky-950/55 hover:bg-sky-900/65 border border-sky-400/45 text-xs text-sky-200">💧 悬挂滴水铜壶</button>`);
      }
      if (eng.hasItem('wet_brick')) {
        btns.push(`<button type="button" onclick="window.UI.throwBrick()" class="px-3 py-2 rounded-lg bg-sky-950/55 hover:bg-sky-900/65 border border-sky-400/45 text-xs text-sky-200">🧱 远处掷出湿青砖诱声</button>`);
      }

      // 六大终局动作入口
      if (S.room === 'gate' && S.flags.gate_unsealed) {
        btns.push(`<button type="button" onclick="window.UI.triggerEnding('M1')" class="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white shadow-lg">🚪 踏出崩霜正门，离开白雾边界</button>`);
      }
      if (S.room === 'gate' && S.flags.gate_cracked && !S.flags.gate_unsealed) {
        btns.push(`<button type="button" onclick="window.UI.triggerEnding('M3')" class="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-xs font-semibold text-amber-100">🚪 侧身挤出正门黑霜窄缝</button>`);
      }
      if (S.room === 'canal' && S.wb.sluiceBlasted && S.wb.boatRepaired) {
        btns.push(`<button type="button" onclick="window.UI.triggerEnding('M2')" class="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-xs font-bold text-white shadow-lg">🚣 摇动乌篷船冲破黑水河浓雾</button>`);
      }
      if (S.room === 'corridor' && eng.hasItem('child_lock_deed')) {
        btns.push(`<button type="button" onclick="window.UI.triggerEnding('IF1')" class="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white shadow-lg">🔥 立于穿堂直面账房伥，拍出秦小栓银锁与祭河死契</button>`);
      }
      if (S.room === 'coffin_hall' && S.corpseBoss.jadeTaken) {
        btns.push(`<button type="button" onclick="window.UI.triggerEnding('IF2')" class="px-4 py-2 rounded-lg bg-purple-800 hover:bg-purple-700 text-xs font-bold text-white shadow-lg">🩸 携【借命压舌血玉】与沈岚亡命脱逃</button>`);
      }
      if (S.room === 'coffin_hall' && S.corpseBoss.sealed) {
        btns.push(`<button type="button" onclick="window.UI.triggerEnding('IF3')" class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-stone-950 shadow-lg">✨ 川楠棺已反噬封死，带众人踏出正门</button>`);
      }
    }

    return `
    <div class="flex flex-wrap gap-2">${btns.join('')}</div>
    <div class="text-[11px] text-stone-500">点击右侧拓扑图已解锁房间即可移动；随时点击【原件档案夹】亲手翻验。</div>`;
  }

  // ================= 3. 二进十节点实时拓扑图（含听梆声纹与双煞预警） =================
  function renderTopologyMap(S) {
    const rooms = DATA().ROOMS;
    const isNight = S.phase === 'night1' || S.phase === 'night2';
    const edges = [
      ['gate', 'courtyard'], ['courtyard', 'west'], ['courtyard', 'hall'], ['courtyard', 'shrine'], ['courtyard', 'east'],
      ['west', 'hall'], ['hall', 'east'], ['east', 'shrine'],
      ['hall', 'corridor'], ['corridor', 'inner_study'], ['corridor', 'coffin_hall'], ['corridor', 'embroidery_loft'], ['corridor', 'well'],
      ['inner_study', 'coffin_hall'], ['coffin_hall', 'well'], ['embroidery_loft', 'well'], ['well', 'canal']
    ];

    const watchmanHint = isNight && S.watchman.active
      ? (S.flags.vib_deployed
        ? `📡 震动锁定：账房伥在【${rooms[S.watchman.zone].short}】`
        : `🎋 听梆辨位：梆声似自【${rooms[S.watchman.zone].short}】方向传来`)
      : (S.day === 1 ? '二进月洞门暂锁（次日 05:30 洞开）' : '白昼二进全宅 10 节点全面开放');

    return `
    <div class="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-amber-200/90">裴宅二进拓扑 · 点击移动</span>
        <span class="text-[10px] text-stone-400">${esc(watchmanHint)}</span>
      </div>
      <div class="relative w-full h-56 rounded-lg bg-[#08090c] border border-white/10 overflow-hidden">
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <!-- 分界线：一进 / 二进 -->
          <line x1="4" y1="48" x2="96" y2="48" stroke="rgba(255,215,150,0.16)" stroke-dasharray="2,2" stroke-width="0.5" />
          <text x="6" y="46" fill="rgba(255,215,150,0.4)" font-size="3.2">二进内宅${S.day === 1 ? ' (锁)' : ''}</text>
          <text x="6" y="52.5" fill="rgba(255,215,150,0.4)" font-size="3.2">一进外院</text>

          ${edges.map(([a, b]) => {
            const ra = rooms[a], rb = rooms[b];
            const locked = (ra.court === 2 || rb.court === 2) && S.day === 1;
            return `<line x1="${ra.x}" y1="${ra.y}" x2="${rb.x}" y2="${rb.y}" stroke="${locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.22)'}" stroke-width="0.7" />`;
          }).join('')}

          ${Object.values(rooms).map(r => {
            const locked = r.court === 2 && S.day === 1;
            const isHere = S.room === r.id;
            const hasWatchman = isNight && S.watchman.active && S.watchman.zone === r.id;
            const hasBoss = S.phase === 'night2' && S.corpseBoss.awake && !S.corpseBoss.sealed && S.corpseBoss.zone === r.id;
            const fill = isHere ? '#d97706' : (hasBoss ? '#9333ea' : (hasWatchman ? '#be123c' : (locked ? '#1c1d22' : '#262933')));
            const stroke = isHere ? '#fde68a' : (hasWatchman || hasBoss ? '#fda4af' : 'rgba(255,255,255,0.25)');
            return `
            <g class="${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}" onclick="window.UI.moveTo('${r.id}')">
              ${hasWatchman ? `<circle cx="${r.x}" cy="${r.y}" r="6.5" fill="rgba(225,29,72,0.28)" />` : ''}
              ${hasBoss ? `<circle cx="${r.x}" cy="${r.y}" r="7.5" fill="rgba(147,51,234,0.32)" />` : ''}
              <rect x="${r.x - 11}" y="${r.y - 4.2}" width="22" height="8.4" rx="2.2" fill="${fill}" stroke="${stroke}" stroke-width="${isHere ? '0.9' : '0.5'}" />
              <text x="${r.x}" y="${r.y + 1.2}" text-anchor="middle" fill="${isHere ? '#fff' : '#e5e0d5'}" font-size="3.1" font-weight="${isHere ? 'bold' : 'normal'}">${esc(r.short)}</text>
            </g>`;
          }).join('')}
        </svg>
      </div>
    </div>`;
  }

  // ================= 4. 5格工具背囊 ＋ 证物 ＋ 原件档案夹 =================
  function renderInventoryAndDocs(S) {
    const items = DATA().ITEMS;
    const docs = DOCS();
    return `
    <div class="rounded-xl bg-white/[0.03] border border-white/10 p-3 space-y-3">
      <div>
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span class="font-semibold text-stone-200">随身工具背囊（${S.bag.length}/${S.bagCap} 格）</span>
          <span class="text-[10px] text-stone-500">满格可丢弃腾位</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${S.bag.length === 0
            ? '<span class="text-[11px] text-stone-500">空</span>'
            : S.bag.map(id => {
                const it = items[id];
                return `<span title="${esc(it.desc)}" class="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-[11px] text-stone-200">
                  ${esc(it.name)}
                  <button type="button" onclick="window.UI.dropItem('${id}')" class="text-stone-500 hover:text-rose-300 ml-0.5" title="丢弃">×</button>
                </span>`;
              }).join('')}
        </div>
      </div>

      ${S.evidence.length > 0 ? `
      <div class="pt-2 border-t border-white/10">
        <div class="text-xs font-semibold text-emerald-300/90 mb-1.5">证物 · 锁宅钉 · 奇物（不占背囊格）</div>
        <div class="flex flex-wrap gap-1.5">
          ${S.evidence.map(id => {
            const it = items[id];
            return `<span title="${esc(it.desc)}" class="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200">${esc(it.name)}</span>`;
          }).join('')}
        </div>
      </div>` : ''}

      <div class="pt-2 border-t border-white/10">
        <div class="text-xs font-semibold text-amber-200/90 mb-1.5">原件档案夹（点击亲手翻页／翻背／撬验）</div>
        <div class="space-y-1">
          ${S.docs.length === 0
            ? '<div class="text-[11px] text-stone-500">尚未搜集到古旧原件</div>'
            : S.docs.map(docId => {
                const d = docs[docId];
                return `<button type="button" onclick="window.UI.openDoc('${docId}')" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-amber-950/25 hover:bg-amber-900/40 border border-amber-500/25 text-[11.5px] text-amber-100 transition flex items-center justify-between">
                  <span class="truncate">📜 ${esc(d.title)}</span>
                  <span class="text-[10px] text-amber-300/70 shrink-0 ml-2">翻验 →</span>
                </button>`;
              }).join('')}
        </div>
      </div>
    </div>`;
  }

  // ================= 5. 六位同行考生实时花名册 =================
  function renderNpcRoster(S) {
    const rooms = DATA().ROOMS;
    return `
    <div class="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <div class="text-xs font-semibold text-stone-200 mb-2">同行考生状态（腕表仅记编号）</div>
      <div class="grid grid-cols-2 gap-2">
        ${Object.values(S.npcs).map(n => {
          const pSrc = resolvePortrait(n.id, n.alive ? n.emotion : 'injured');
          return `
          <div class="flex items-center gap-2 p-1.5 rounded-lg border ${n.alive ? 'bg-white/[0.025] border-white/10' : 'bg-rose-950/25 border-rose-500/30 opacity-60'}">
            ${pSrc ? `<img src="${pSrc}" referrerPolicy="no-referrer" onerror="window.UI.onPortraitError(this)" alt="" class="w-8 h-10 object-cover rounded border border-white/15 shrink-0 bg-[#141311] ${n.alive ? '' : 'grayscale'}" />` : ''}
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-medium text-stone-100 truncate">${esc(n.name)} <span class="text-[9px] text-stone-500">${esc(n.code)}</span></div>
              <div class="text-[10px] ${n.alive ? 'text-stone-400' : 'text-rose-300'} truncate">
                ${n.alive ? `位置：${esc(rooms[n.room]?.short || n.room)}` : '已死亡'}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ================= 6. 四大交互弹窗（原件翻验台 / 物理拆解台 / 当堂拍证台 / 前情回看） =================
  function renderModal(S) {
    const m = S.modal;
    if (m.type === 'doc') return renderDocModal(S, m);
    if (m.type === 'wb') return renderWorkbenchModal(S, m);
    if (m.type === 'confront') return renderConfrontModal(S, m);
    if (m.type === 'history') return renderHistoryModal(S);
    return '';
  }

  function renderHistoryModal(S) {
    const past = S.history.slice(0, Math.max(0, S.sceneStartIdx || 0));
    return `
    <div class="fixed inset-0 z-50 bg-black/84 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl max-h-[86vh] bg-[#121318] border border-amber-500/35 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div class="shrink-0 p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#171820]">
          <div>
            <div class="text-[10px] tracking-[0.2em] text-amber-400/80 uppercase">ARCHIVE · PAST SCENES</div>
            <h3 class="text-base font-bold text-stone-100 mt-0.5">前情回看（共 ${past.length} 条记录）</h3>
          </div>
          <button type="button" onclick="window.UI.closeModal()" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-stone-200">关闭</button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-3 scroll-thin">
          ${past.length === 0
            ? '<div class="text-xs text-stone-500">暂无前序场景记录。</div>'
            : past.map(item => renderLogItem(item, false)).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderDocModal(S, m) {
    const d = DOCS()[m.id];
    if (!d) return '';
    const pageIdx = m.pageIdx || 0;
    const page = d.pages[pageIdx] || d.pages[0];
    const isLocked = page.hiddenUntilFlag && !S.flags[page.hiddenUntilFlag];
    const bodyLines = page.dynamicBody === 'autopsy_dynamic' ? getDynamicAutopsyLines(S) : (page.body || []);

    return `
    <div class="fixed inset-0 z-50 bg-black/84 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl max-h-[88vh] bg-[#141311] border border-amber-500/35 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div class="shrink-0 p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#191714]">
          <div>
            <div class="text-[10px] tracking-[0.2em] text-amber-400/80 uppercase">原件亲手翻验台（零高亮 · 自主辨伪）</div>
            <h3 class="text-base font-bold text-stone-100 mt-0.5">${esc(d.title)}</h3>
          </div>
          <button type="button" onclick="window.UI.closeModal()" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-stone-200">合上原件</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 scroll-thin">
          <div class="w-full h-44 rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <img src="${resolvePropImg(d.propKey)}" referrerPolicy="no-referrer" onerror="window.UI.onImgError(this)" alt="" class="w-full h-full object-cover" />
          </div>

          <!-- 翻页标签 -->
          <div class="flex flex-wrap gap-1.5">
            ${d.pages.map((p, idx) => `
              <button type="button" onclick="window.UI.setDocPage(${idx})" class="px-3 py-1.5 rounded-lg text-xs border transition ${idx === pageIdx ? 'bg-amber-900/55 border-amber-400/70 text-amber-100 font-medium' : 'bg-white/[0.04] border-white/10 text-stone-400 hover:text-stone-200'}">
                ${esc(p.label)}
              </button>`).join('')}
          </div>

          <!-- 原件正文（严禁标黄） -->
          <div class="p-4 rounded-xl bg-[#1c1a16] border border-amber-200/15 space-y-3 text-[13.5px] leading-7 text-stone-200 font-serif">
            ${isLocked
              ? `<p class="text-stone-400 italic">${esc(page.lockedHint)}</p>`
              : bodyLines.map(line => `<p>${esc(line)}</p>`).join('')}
          </div>

          <!-- 物理检查动作（翻背面 / 侧光 / 裁开夹层 / 撬表盖） -->
          ${d.inspectActions && d.inspectActions.length > 0 ? `
          <div class="pt-2 border-t border-white/10 space-y-2">
            <div class="text-[11px] text-stone-400">实物动手勘验操作：</div>
            <div class="flex flex-wrap gap-2">
              ${d.inspectActions.map(act => `
                <button type="button" onclick="window.UI.runDocAction('${act.action}')" class="px-3.5 py-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-400/45 text-xs text-amber-100 transition">
                  🔎 ${esc(act.label)}
                </button>`).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderWorkbenchModal(S, m) {
    const wb = WBS()[m.id];
    if (!wb) return '';
    const partId = m.partId || wb.parts[0].id;
    const allTools = ['bare_hands'].concat(S.bag).concat(S.evidence);
    const items = DATA().ITEMS;
    const gates = global.LUBAN_GATES;

    return `
    <div class="fixed inset-0 z-50 bg-black/84 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl max-h-[90vh] bg-[#131418] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div class="shrink-0 p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#181920]">
          <div>
            <div class="text-[10px] tracking-[0.2em] text-amber-400/80 uppercase">零空气墙物理拆解台（选错工具当场反噬）</div>
            <h3 class="text-base font-bold text-stone-100 mt-0.5">${esc(wb.title)}</h3>
          </div>
          <button type="button" onclick="window.UI.closeModal()" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-stone-200">离开台面</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 scroll-thin">
          <div class="w-full h-40 rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <img src="${resolvePropImg(wb.propKey)}" referrerPolicy="no-referrer" onerror="window.UI.onImgError(this)" alt="" class="w-full h-full object-cover" />
          </div>

          ${S.toast ? `<div class="p-3 rounded-lg bg-amber-950/60 border border-amber-400/50 text-xs text-amber-100 leading-5">${esc(S.toast)}</div>` : ''}

          <!-- 鲁班四象铜滑尺专属交互组件 -->
          ${wb.isLuBanCipher ? `
          <div class="p-4 rounded-xl bg-[#1a1815] border border-amber-400/35 space-y-3">
            <div class="text-xs font-semibold text-amber-200">鲁班四象铜滑尺（点击各簧拨动八门刻度）</div>
            <div class="grid grid-cols-4 gap-2">
              ${S.wb.lubanSliders.map((val, idx) => `
                <button type="button" onclick="window.UI.cycleLuban(${idx})" ${S.wb.lubanOpened ? 'disabled' : ''} class="py-3 rounded-lg bg-amber-950/45 hover:bg-amber-900/60 border border-amber-400/50 text-center transition">
                  <div class="text-[10px] text-stone-400">第 ${idx + 1} 簧</div>
                  <div class="text-xl font-bold text-amber-200 mt-0.5">${gates[val]}</div>
                </button>`).join('')}
            </div>
            <button type="button" onclick="window.UI.submitLuban()" ${S.wb.lubanOpened ? 'disabled' : ''} class="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs transition">
              ${S.wb.lubanOpened ? '✓ 暗榫铜匣已无声弹开' : '按下黄铜机括钮 · 尝试开匣'}
            </button>
          </div>` : ''}

          <!-- 部位选择 -->
          <div>
            <div class="text-xs font-semibold text-stone-300 mb-2">第一步：选择要下手的器物部位</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${wb.parts.map(p => `
                <button type="button" onclick="window.UI.setWbPart('${p.id}')" class="text-left p-2.5 rounded-lg border transition ${partId === p.id ? 'bg-amber-950/50 border-amber-400/70 text-amber-100' : 'bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.07]'}">
                  <div class="text-xs font-semibold">${esc(p.name)}</div>
                  <div class="text-[11px] text-stone-400 mt-0.5">${esc(p.desc)}</div>
                </button>`).join('')}
            </div>
          </div>

          <!-- 工具选择并执行 -->
          <div class="pt-2 border-t border-white/10">
            <div class="text-xs font-semibold text-stone-300 mb-2">第二步：选择随身工具／媒介直接下手</div>
            <div class="flex flex-wrap gap-2">
              ${allTools.map(tid => {
                const label = tid === 'bare_hands' ? '✋ 徒手直接操作' : (items[tid]?.name || tid);
                return `<button type="button" onclick="window.UI.useWbTool('${wb.id}', '${partId}', '${tid}')" class="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-amber-900/50 border border-white/15 hover:border-amber-400/60 text-xs text-stone-100 transition">${esc(label)}</button>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderConfrontModal(S, m) {
    const docs = DOCS();
    const items = DATA().ITEMS;
    const isCouncil = m.context === 'day2_council';
    const selected = m.selected || [];

    // 玩家手头所有可拍上桌面的原件与证物
    const pool = [];
    S.docs.forEach(docId => {
      const d = docs[docId];
      if (d && d.canEvidence) pool.push({ id: docId, label: '📜 ' + d.evidenceLabel });
    });
    S.evidence.forEach(evId => {
      const it = items[evId];
      if (it) pool.push({ id: evId, label: '🔎 ' + it.name });
    });

    const plans = isCouncil && global.EXAM1_STORY && typeof global.EXAM1_STORY.getAvailableCouncilPlans === 'function'
      ? global.EXAM1_STORY.getAvailableCouncilPlans()
      : [{ id: 'M1', name: '按鲁门残谱拔除三枚锁宅钉，以湿阴灰撕毁神龛总契破正门' }];

    return `
    <div class="fixed inset-0 z-50 bg-black/84 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl max-h-[90vh] bg-[#141418] border border-rose-500/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div class="shrink-0 p-4 border-b border-white/10 flex items-center justify-between bg-[#1b1518]">
          <div>
            <div class="text-[10px] tracking-[0.2em] text-rose-300 uppercase">${isCouncil ? '酉时中堂拍证摊牌大会' : '西厢当堂砸证拆穿'}</div>
            <h3 class="text-base font-bold text-stone-100 mt-0.5">${isCouncil ? '请拍出至少 2 份铁证，并敲定今夜破局总方略' : '请拍出揭穿沈岚怀表嫁祸的铁证'}</h3>
          </div>
          <button type="button" onclick="window.UI.closeModal()" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-stone-200">暂缓</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 scroll-thin">
          ${S.toast ? `<div class="p-3 rounded-lg bg-rose-950/60 border border-rose-400/50 text-xs text-rose-100">${esc(S.toast)}</div>` : ''}

          <div>
            <div class="text-xs font-semibold text-amber-200 mb-2">勾选你要拍在桌面上的原件或实物赃物（已选 ${selected.length} 项）：</div>
            <div class="space-y-1.5">
              ${pool.length === 0
                ? '<div class="text-xs text-stone-500">你目前手里空空如也！请先回房间搜查原件与证物。</div>'
                : pool.map(p => {
                    const checked = selected.includes(p.id);
                    return `<button type="button" onclick="window.UI.toggleEvidence('${p.id}')" class="w-full text-left px-3 py-2 rounded-lg border text-xs transition ${checked ? 'bg-amber-900/50 border-amber-400 text-amber-100 font-medium' : 'bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.07]'}">
                      ${checked ? '☑ ' : '☐ '} ${esc(p.label)}
                    </button>`;
                  }).join('')}
            </div>
          </div>

          ${isCouncil ? `
          <div class="pt-3 border-t border-white/10">
            <div class="text-xs font-semibold text-amber-200 mb-2">选定今夜第三轮《断岁》行动总方略：</div>
            <div class="space-y-1.5">
              ${plans.map(pl => `
                <button type="button" onclick="window.UI.setCouncilPlan('${pl.id}')" class="w-full text-left px-3 py-2 rounded-lg border text-xs transition ${m.chosenPlan === pl.id ? 'bg-rose-950/60 border-rose-400 text-rose-100 font-medium' : 'bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.07]'}">
                  ${m.chosenPlan === pl.id ? '● ' : '○ '} ${esc(pl.name)}
                </button>`).join('')}
            </div>
          </div>` : ''}

          <button type="button" onclick="window.UI.submitConfront()" class="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition">
            重重拍上桌面 · 当堂摊牌！
          </button>
        </div>
      </div>
    </div>`;
  }

  // ================= 7. 死考空间 · 半圆大厅与深红旋涡兑换 =================
  function renderSpaceHall(S) {
    const st = S.settlement;
    const cats = ['全部', '古典神话', '血统', '科技', '灵异', '耗材'];
    const items = DATA().SHOP_ITEMS.filter(i => S.shopFilter === '全部' || i.cat === S.shopFilter);
    const survivorNames = st.survivors.map(id => S.npcs[id]?.name).filter(Boolean);
    const ed = S.hallEdition || 'numinous';

    return `
    <div class="relative w-screen h-screen overflow-hidden flex flex-col lg:flex-row text-[#e6e1d6] font-sans-ui bg-[#0e0d0f]">
      <img src="${resolveHallImg(ed)}" referrerPolicy="no-referrer" onerror="window.UI.onImgError(this)" alt="死考空间大厅" class="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none select-none" />
      <div class="absolute inset-0 bg-black/60 pointer-events-none"></div>

      <div class="relative z-10 w-full lg:w-[43%] h-[48vh] lg:h-full p-5 flex flex-col gap-4 overflow-y-auto scroll-thin">
        <div class="bg-[#0b0d11]/95 border border-white/15 rounded-2xl p-5 shadow-2xl space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] tracking-[0.2em] text-amber-300/80 uppercase">死考空间 · 半圆大厅</span>
              <h2 class="text-lg font-bold text-stone-100 mt-0.5">${esc(st.rank)}</h2>
            </div>
            <div class="text-right shrink-0">
              <div class="text-[10px] text-stone-400">距第2场传召</div>
              <div class="font-mono-ui text-base font-bold text-amber-200">${S.spaceEnded ? '00:00:00' : '72:00:00'}</div>
            </div>
          </div>
          <p class="text-xs leading-5 text-stone-300">${esc(st.rankDesc)}</p>
          <div class="text-xs text-stone-400">共同生还者：${survivorNames.length ? survivorNames.join('、') : '仅你一人独活'} ｜ 跨场阵营：<b class="text-amber-200">${st.teamAlignment === 'black_market_duo' ? '黑市双人组（与周衡决裂）' : (st.teamAlignment === 'zhou_squad' ? '周衡老队结义' : '独行孤狼')}</b></div>
          ${st.uniqueRelic && st.uniqueRelic !== 'none' ? `<div class="px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-400/40 text-xs text-purple-200">唯一跨场奇物：${esc(DATA().ITEMS[st.uniqueRelic]?.name || st.uniqueRelic)}</div>` : ''}

          <div class="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-y-1 text-xs">
            <span class="text-stone-400">标准三轮基础分（20+35+45）</span><span class="text-right font-mono-ui text-stone-200">+${st.base}</span>
            <span class="text-stone-400">破局与探索个人贡献</span><span class="text-right font-mono-ui text-emerald-300">+${st.bonus}</span>
            <span class="text-stone-400">死考空间基础扣费</span><span class="text-right font-mono-ui text-rose-300">-${st.fee}</span>
            <span class="text-stone-400">白光躯体修复费</span><span class="text-right font-mono-ui text-rose-300">-${st.repair}</span>
            <div class="col-span-2 mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <span class="font-medium text-stone-200">当前净余积分</span>
              <span class="font-mono-ui text-2xl font-bold text-amber-300">${S.points} <span class="text-xs font-normal text-stone-400">分</span></span>
            </div>
          </div>
        </div>

        <div class="bg-[#0b0d11]/95 border border-white/15 rounded-2xl p-5 shadow-2xl space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-stone-200">72 小时休整与私人房门</span>
            <span class="font-mono-ui text-amber-300">行动点 ${S.restAP}/6</span>
          </div>
          ${S.spaceNote ? `<div class="text-xs leading-5 text-amber-100 bg-white/[0.05] border border-amber-400/30 rounded-xl p-3">${esc(S.spaceNote)}</div>` : ''}
          <div class="grid grid-cols-1 gap-2 text-xs">
            <button type="button" onclick="window.UI.spaceRest('tea')" ${S.restAP <= 0 ? 'disabled' : ''} class="text-left px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 disabled:opacity-40">大厅复盘首考得失与队友余波 <span class="float-right text-stone-400">-1 AP</span></button>
            <button type="button" onclick="window.UI.spaceRest('train')" ${S.restAP <= 0 ? 'disabled' : ''} class="text-left px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 disabled:opacity-40">进入私人房门适应装备与体魄训练 <span class="float-right text-stone-400">-1 AP</span></button>
            <button type="button" onclick="window.UI.spaceRest('watch')" ${S.restAP <= 0 ? 'disabled' : ''} class="text-left px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 disabled:opacity-40">触碰旋涡核对第2场《黑水船坞》前兆 <span class="float-right text-stone-400">-1 AP</span></button>
            <button type="button" onclick="window.UI.spaceRest('finish')" ${S.spaceEnded ? 'disabled' : ''} class="text-left px-3.5 py-2 rounded-xl bg-red-700/85 hover:bg-red-600/85 border border-red-500/50 text-white font-semibold disabled:opacity-40">结束休整 · 写入跨场存档踏入《黑水船坞》 →</button>
          </div>
          <div class="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex gap-1.5">
              <button type="button" onclick="window.UI.setHallEdition('judgment')" class="px-2 py-1 rounded border text-[11px] ${ed === 'judgment' ? 'bg-amber-900/50 border-amber-400 text-amber-100' : 'bg-white/5 border-white/10 text-stone-400'}">A 即梦</button>
              <button type="button" onclick="window.UI.setHallEdition('numinous')" class="px-2 py-1 rounded border text-[11px] ${ed === 'numinous' ? 'bg-amber-900/50 border-amber-400 text-amber-100' : 'bg-white/5 border-white/10 text-stone-400'}">B MJ</button>
            </div>
            <div class="flex gap-2">
              <button type="button" onclick="window.UI.restartExam()" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15">再开周目（探索其他 IF 线）</button>
              <a href="../index.html" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15">返回主菜单</a>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 w-full lg:w-[57%] h-[52vh] lg:h-full p-5 flex flex-col overflow-hidden">
        <div class="flex-1 min-h-0 bg-[#0b0d11]/95 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div class="shrink-0 p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-[10px] tracking-[0.2em] text-red-300 uppercase">Crimson Vortex Exchange</div>
              <h3 class="text-base font-bold text-stone-100">深红旋涡兑换光幕（${S.cTierUnlocked ? '✨ 已破格解锁 C 级权限' : 'D 级基础权限'}）</h3>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${cats.map(c => `<button type="button" onclick="window.UI.setShopFilter('${c}')" class="px-2.5 py-1 rounded-full text-[11px] border transition ${S.shopFilter === c ? 'bg-red-700/80 border-red-400 text-white' : 'bg-white/[0.04] border-white/10 text-stone-300'}">${c}</button>`).join('')}
            </div>
          </div>
          <div class="flex-1 min-h-0 overflow-y-auto scroll-thin p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
            ${items.map(it => {
              const locked = it.requiresC && !S.cTierUnlocked;
              const owned = S.shopBought.includes(it.id);
              const canBuy = !locked && !owned && S.points >= it.price;
              return `
              <div class="p-3.5 rounded-xl border ${locked ? 'bg-white/[0.015] border-white/5 opacity-50' : (owned ? 'bg-emerald-950/35 border-emerald-500/40' : 'bg-white/[0.03] border-white/10')}">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="font-mono-ui text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-amber-200">${it.tier}级</span>
                    <span class="text-xs font-semibold text-stone-100 ml-1">${esc(it.name)}</span>
                  </div>
                  <span class="font-mono-ui text-xs font-bold text-amber-300">${it.price}分</span>
                </div>
                <p class="text-[11px] leading-5 text-stone-400 mt-1.5">${esc(it.desc)}</p>
                <div class="mt-2.5 flex items-center justify-between text-[10px]">
                  <span class="text-stone-500">${it.cat} · ${it.id}</span>
                  ${locked ? '<span class="text-stone-500">🔒 需 IF③ 解锁 C 级权</span>' : (owned ? '<span class="text-emerald-300 font-semibold">✓ 已兑换</span>' : `<button type="button" onclick="window.UI.buyItem('${it.id}')" ${canBuy ? '' : 'disabled'} class="px-2.5 py-1 rounded bg-red-700/85 hover:bg-red-600 disabled:bg-white/5 disabled:text-stone-500 text-white text-[11px]">触碰兑换</button>`)}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }

  // ================= 8. 死亡／负分抹杀画面 =================
  function renderGameOver(S) {
    return `
    <div class="min-h-screen w-full flex items-center justify-center p-6 bg-[#08080a] text-stone-200 font-sans-ui">
      <div class="max-w-lg w-full bg-[#131114] border border-rose-500/45 rounded-2xl p-7 shadow-2xl space-y-4 text-center">
        <div class="text-xs tracking-[0.28em] text-rose-400 uppercase">GLOBAL DEATH EXAM · TERMINATED</div>
        <h2 class="text-2xl font-bold text-rose-200">考生 CN-09471 已死亡</h2>
        <p class="text-sm leading-7 text-stone-300">${esc(S.gameOverReason || '你在裴氏凶宅中耗尽生机。')}</p>
        <div class="pt-3 flex items-center justify-center gap-3">
          <button type="button" onclick="window.UI.restartExam()" class="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold">重新开始本场死考</button>
          <a href="../index.html" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs">返回死考大厅</a>
        </div>
      </div>
    </div>`;
  }

  // ================= 全局交互控制器 =================
  global.UI = {
    render,
    onImgError(el) {
      const src = el.getAttribute('src');
      if (src) missingAssets.add(src);
      el.onerror = null;
      el.src = 'assets/exam1_courtyard.jpg';
    },
    onPortraitError(el) {
      const src = el.getAttribute('src');
      if (src) missingAssets.add(src);
      el.onerror = null;
      el.style.display = 'none';
    },
    chooseOrigin(id) { global.EXAM1_STORY.selectOrigin(id); },
    nextBeat() { E().advanceBeat(); },
    revealAll() { E().revealAllBeats(); },
    openHistory() { SRef().modal = { type: 'history' }; render(); },
    togglePace() {
      if (global.AudioEngine) {
        const next = !global.AudioEngine.paceEnabled;
        global.AudioEngine.setPref('pace', next);
        if (!next) E().revealAllBeats();
        else render();
      }
    },
    dispatchStory(action) { global.EXAM1_STORY.dispatch(action); },
    submitRealName() { global.EXAM1_STORY.submitCallsign('陆寻'); },
    submitCustomCallsign() {
      const el = document.getElementById('callsign-input');
      const val = el ? el.value : '';
      global.EXAM1_STORY.submitCallsign(val);
    },
    moveTo(roomId) { global.EXAM1_STORY.moveToRoom(roomId); },
    searchRoom() { global.EXAM1_STORY.searchCurrentRoom(); },
    talkNpc(npcId) { global.EXAM1_STORY.talkToNpc(npcId); },
    openDoc(docId) {
      SRef().modal = { type: 'doc', id: docId, pageIdx: 0 };
      if (global.AudioEngine) global.AudioEngine.playSfx('paper_flip');
      render();
    },
    setDocPage(idx) {
      if (SRef().modal && SRef().modal.type === 'doc') {
        SRef().modal.pageIdx = idx;
        if (global.AudioEngine) global.AudioEngine.playSfx('paper_flip');
        render();
      }
    },
    runDocAction(act) { E().runDocAction(act); },
    openWorkbench(wbId) {
      const wb = WBS()[wbId];
      SRef().modal = { type: 'wb', id: wbId, partId: wb.parts[0].id };
      SRef().toast = null;
      render();
    },
    setWbPart(partId) {
      if (SRef().modal && SRef().modal.type === 'wb') {
        SRef().modal.partId = partId;
        render();
      }
    },
    useWbTool(wbId, partId, toolId) { E().useToolOnWorkbench(wbId, partId, toolId); },
    cycleLuban(idx) { E().cycleLubanSlider(idx); },
    submitLuban() { E().submitLubanCipher(); },
    dropItem(id) { E().removeItem(id, true); E().emit(); },
    pickupDrop(id) { E().pickupRoomDrop(id); },
    useConsumable(id) { E().useConsumable(id); },
    forceShelter() { global.EXAM1_STORY.triggerShelterChoice(); E().emit(); },
    forceCouncil() { global.EXAM1_STORY.triggerDay2Council(); },
    deployVib() { global.EXAM1_STORY.deployVibSensor(); },
    setDecoy() { global.EXAM1_STORY.setKettleDecoy(); },
    throwBrick() { global.EXAM1_STORY.throwWetBrick(); },
    triggerEnding(key) { global.EXAM1_STORY.triggerEndingAction(key); },
    toggleEvidence(id) {
      const m = SRef().modal;
      if (!m || m.type !== 'confront') return;
      m.selected = m.selected || [];
      if (m.selected.includes(id)) m.selected = m.selected.filter(x => x !== id);
      else m.selected.push(id);
      render();
    },
    setCouncilPlan(planId) {
      const m = SRef().modal;
      if (m && m.type === 'confront') { m.chosenPlan = planId; render(); }
    },
    submitConfront() {
      const m = SRef().modal;
      if (!m || m.type !== 'confront') return;
      if (m.context === 'night1_shen') global.EXAM1_STORY.submitNight1Confront(m.selected || []);
      else if (m.context === 'day2_council') global.EXAM1_STORY.completeCouncil(m.selected || [], m.chosenPlan || 'M1');
    },
    closeModal() { SRef().modal = null; render(); },
    clearToast() { SRef().toast = null; render(); },
    toggleAudio() {
      if (global.AudioEngine) {
        global.AudioEngine.unlock();
        global.AudioEngine.setPref('audio', !global.AudioEngine.sfxEnabled);
        render();
      }
    },
    toggleVoice() {
      if (global.AudioEngine) {
        global.AudioEngine.unlock();
        global.AudioEngine.setPref('voice', !global.AudioEngine.voiceEnabled);
        render();
      }
    },
    buyItem(id) { E().buyShopItem(id); },
    spaceRest(act) { E().spaceRest(act); },
    setShopFilter(cat) { SRef().shopFilter = cat; render(); },
    setHallEdition(ed) {
      SRef().hallEdition = ed;
      try { localStorage.setItem('death_exam_hall_edition', ed); } catch {}
      render();
    },
    restartExam() { E().init('char_select'); render(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
