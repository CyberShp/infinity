(() => {
  "use strict";

  const saveKey = "infinity.menu.save.v1";
  const preferenceKeys = {
    motion: "infinity.menu.motion",
    sound: "infinity.menu.sound"
  };
  const memory = new Map();

  function read(key) {
    if (memory.has(key)) return memory.get(key);
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
      memory.delete(key);
      return true;
    } catch {
      memory.set(key, value);
      return false;
    }
  }

  function preference(name) {
    const stored = read(preferenceKeys[name]);
    if (stored === "on" || stored === "off") return stored;
    return name === "motion" && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "on" : "off";
  }

  function setPreference(name, value) {
    if (!Object.hasOwn(preferenceKeys, name) || !["on", "off"].includes(value)) return false;
    const saved = write(preferenceKeys[name], value);
    document.dispatchEvent(new Event("menu:preferences"));
    return saved;
  }

  // First return to the hall in chapters 31 (B级评价) and 32 (房间与兑换).
  const options = {
    exchange: {
      title: "查看兑换",
      result: "你把手伸进深红色旋涡，眼前展开了兑换光幕。考试所得的分数可以用来强化自己。第二天晚上，系统会给出下场考试的信息，到时再挑选也来得及。"
    },
    rooms: {
      title: "查看个人房间",
      result: "十四间房中，贺铮住在八号。门内是一整片住宅小区，有人骑着电动车上班，也有人出门遛狗。考生可以按自己的心意布置房间。"
    }
  };

  function getSave() {
    try {
      const save = JSON.parse(read(saveKey));
      if (typeof save?.name !== "string" || !save.name.trim()) return null;
      if (save.version === 1) return [null, "exit", "gear"].includes(save.choice) ? save : null;
      if (save.version !== 2) return null;
      return save.choice === null || (typeof save.choice === "string" && Object.hasOwn(options, save.choice)) ? save : null;
    } catch {
      return null;
    }
  }

  function storeSave(save) {
    const saved = write(saveKey, JSON.stringify(save));
    document.dispatchEvent(new Event("menu:save"));
    return saved;
  }

  function saveLocation() {
    if (!getSave()) return null;
    return memory.has(saveKey) ? "session" : "local";
  }

  window.InfinityMenu = { hasSave: () => Boolean(getSave()), saveLocation, preference, setPreference };

  const dialog = document.createElement("dialog");
  dialog.className = "menu-sheet";
  dialog.setAttribute("aria-labelledby", "menu-sheet-title");
  dialog.innerHTML = `
    <div class="menu-sheet__page">
      <button type="button" class="menu-sheet__close" aria-label="关闭面板" data-action="close">×</button>
      <div class="menu-sheet__eyebrow" aria-hidden="true"></div>
      <h2 id="menu-sheet-title" class="menu-sheet__title" tabindex="-1"></h2>
      <div class="menu-sheet__content"></div>
      <p class="menu-sheet__notice" role="status"></p>
    </div>`;
  document.body.append(dialog);

  const eyebrow = dialog.querySelector(".menu-sheet__eyebrow");
  const heading = dialog.querySelector(".menu-sheet__title");
  const content = dialog.querySelector(".menu-sheet__content");
  const notice = dialog.querySelector(".menu-sheet__notice");
  let opener;
  let pendingName;
  let viewedSave;

  function draw(section, title, html, focusSelector) {
    viewedSave = null;
    eyebrow.textContent = section;
    heading.textContent = title;
    content.innerHTML = html;
    notice.textContent = "";
    const target = focusSelector ? content.querySelector(focusSelector) : heading;
    target.focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }

  function newCandidate() {
    draw("CANDIDATE REGISTRATION", "考生登记", `
      <p>第一次考试结束。白光散去，你回到了死考空间的大厅。距离下场考试还有三天。</p>
      <form class="menu-sheet__form">
        <label for="candidate-name">你的考生代号</label>
        <input id="candidate-name" name="candidate" maxlength="20" required autocomplete="off" placeholder="输入考生代号">
        <button class="menu-sheet__primary" type="submit">登记考生 <span aria-hidden="true">→</span></button>
      </form>`, "#candidate-name");
    if (pendingName) content.querySelector("input").value = pendingName;
  }

  function confirmOverwrite(save) {
    draw("CANDIDATE REGISTRATION", "替换现有档案？", `
      <p>当前档案属于「<strong data-old-name></strong>」。确认后，新的考生记录会覆盖这份档案。</p>
      <div class="menu-sheet__actions">
        <button type="button" class="menu-sheet__secondary" data-action="edit">返回登记</button>
        <button type="button" class="menu-sheet__primary" data-action="replace">确认替换</button>
      </div>`, '[data-action="edit"]');
    content.querySelector("[data-old-name]").textContent = save.name;
    viewedSave = JSON.stringify(save);
  }

  function candidateRecord(save) {
    const outcome = options[save.choice];
    draw("EXAM HALL", "死考空间", `
      <div class="menu-sheet__identity"><span>考生</span><strong data-name></strong><span>第一场考后</span></div>
      ${outcome ? `
        <h3>${outcome.title}</h3>
        <p>${outcome.result}</p>
        <div class="menu-sheet__actions">
          <button class="menu-sheet__secondary" type="button" data-action="hall">回到大厅</button>
          <button class="menu-sheet__secondary" type="button" data-action="close">返回主菜单</button>
        </div>` : `
        <p>大厅呈半圆形。面前是深红色的旋涡，转过身，十四间私人房间沿弧线排开。你想先看哪里？</p>
        <div class="menu-sheet__choices">
          <button type="button" data-choice="exchange">${options.exchange.title}<span aria-hidden="true">↗</span></button>
          <button type="button" data-choice="rooms">${options.rooms.title}<span aria-hidden="true">↗</span></button>
        </div>`}
      <button class="menu-sheet__secondary" type="button" data-action="edit">另建大厅档案</button>`);
    content.querySelector("[data-name]").textContent = save.name;
    viewedSave = JSON.stringify(save);
    const messages = [];
    if (save.version === 1 && save.choice !== null) messages.push("已保留旧档案的考生代号，请选择你在大厅中的去处。");
    if (memory.has(saveKey)) messages.push("浏览器未能写入本地档案，本次打开期间仍可继续。");
    notice.textContent = messages.join(" ");
  }

  function register() {
    const id = crypto.getRandomValues(new Uint32Array(4)).join("-");
    const save = { version: 2, id, name: pendingName, choice: null };
    storeSave(save);
    pendingName = "";
    candidateRecord(save);
  }

  function checkViewedSave(current) {
    if (!dialog.open || !viewedSave || viewedSave === JSON.stringify(current)) return true;
    draw("CANDIDATE RECORD", "考生档案已更新", `
      <p>另一页更改了考生档案。请回到主菜单查看最新记录。</p>
      <button class="menu-sheet__secondary" type="button" data-action="close">返回主菜单</button>`);
    return false;
  }

  const exams = [
    ["神类起源", "第一场。考生在一座封闭的金属大厅里醒来，必须先找到离开这里的办法。"],
    ["新生", "第二场的考场在伦敦。两支队伍先后进入，要在丧尸危机中求生。"],
    ["希夷", "第三场。考生醒在村中，眼前是平顶房和一座旧祠堂。考题要求他们找到撤离点。"],
    ["超脱", "第四场以星体危机为背景。地球考生与其他文明的考生进入同一场团战。"]
  ];

  function archive() {
    draw("FIELD ARCHIVE", "考场图鉴", `
      <p>原著前四场考试的入场记录。</p>
      <div class="menu-sheet__archive">${exams.map(([title, description]) => `
        <details><summary>${title}</summary><p>${description}</p></details>`).join("")}</div>
      <div class="menu-sheet__actions">
        <button class="menu-sheet__secondary" type="button" data-action="rules">白雾古宅 · 考核规则</button>
        <button class="menu-sheet__secondary" type="button" data-action="hall-record">回归大厅</button>
      </div>`);
    content.querySelector("details").open = true;
  }

  function examRules() {
    draw("EXAM RULES", "白雾古宅 · 考核规则", `
      <h3>逐轮发布</h3><p>死考考题随阶段动态推送，腕表仅显示考生编号而不公开真名。</p>
      <h3>基础扣费</h3><p>普通考场通关强制扣除 60 分基础费，修复另计，负分抹杀。</p>
      <h3>自由调查与分队</h3><p>点击左侧场景热点自由查证，与不同房间队友交谈以甄别真伪。拒绝指挥后可以分队，甚至单人通关。</p>
      <button class="menu-sheet__secondary" type="button" data-action="archive">返回考场图鉴</button>`);
  }

  function settings() {
    draw("SYSTEM SETTINGS", "系统设置", `
      <div class="menu-sheet__settings">${[
        ["motion", "动态背景", "大厅中旋涡的转动与光影"],
        ["sound", "环境音", "死考空间的背景音"]
      ].map(([name, label, hint]) => `
        <label class="menu-sheet__setting">
          <span><strong>${label}</strong><small>${hint}</small></span>
          <input type="checkbox" role="switch" data-setting="${name}" aria-label="${label}" ${preference(name) === "on" ? "checked" : ""}>
          <span class="menu-sheet__switch" aria-hidden="true"></span>
        </label>`).join("")}</div>`);
  }

  document.addEventListener("menu:open", (event) => {
    if (event.detail === "new" || (event.detail === "continue" && WhiteMistSave.read())) {
      location.assign("game/exam1_white_mist.html#" + event.detail);
      return;
    }
    if (!["continue", "archive", "rules", "settings", "exchange"].includes(event.detail)) return;
    dialog.classList.toggle("from-vortex", event.detail === "exchange");
    if (!dialog.open) {
      opener = document.activeElement;
      dialog.showModal();
    }
    pendingName = "";
    switch (event.detail) {
      case "exchange":
        draw("EXCHANGE", "兑换光幕", `<p>${options.exchange.result}</p><button class="menu-sheet__secondary" type="button" data-action="close">收起光幕</button>`);
        break;
      case "continue": {
        const save = getSave();
        if (save) candidateRecord(save);
        else draw("CANDIDATE RECORD", "尚无考生档案", `<p>请先登记考生代号，再进入死考空间。</p><button type="button" class="menu-sheet__primary" data-action="edit">前往登记</button>`);
        break;
      }
      case "archive": archive(); break;
      case "rules": examRules(); break;
      case "settings": settings(); break;
    }
  });

  dialog.addEventListener("close", () => {
    if (!dialog.open && opener?.isConnected) opener.focus({ preventScroll: true });
  });

  dialog.addEventListener("input", (event) => {
    if (event.target.id === "candidate-name") event.target.setCustomValidity("");
  });

  dialog.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = content.querySelector("#candidate-name");
    pendingName = input.value.trim();
    if (!pendingName) {
      input.setCustomValidity("请输入考生代号。");
      input.reportValidity();
      return;
    }
    const old = getSave();
    if (old) confirmOverwrite(old);
    else register();
  });

  dialog.addEventListener("change", (event) => {
    const input = event.target;
    if (input.dataset.setting) {
      const saved = setPreference(input.dataset.setting, input.checked ? "on" : "off");
      notice.textContent = saved ? "" : "此设置仅对本次打开生效。";
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
      return;
    }
    const button = event.target.closest("button");
    if (!button) return;
    switch (button.dataset.action) {
      case "close": dialog.close(); return;
      case "edit": newCandidate(); return;
      case "rules": examRules(); return;
      case "archive": archive(); return;
      case "hall-record": {
        const save = getSave();
        if (save) candidateRecord(save);
        else newCandidate();
        return;
      }
      case "replace":
        if (checkViewedSave(getSave())) register();
        return;
    }
    if (button.dataset.choice || button.dataset.action === "hall") {
      const save = getSave();
      if (!checkViewedSave(save) || !save) return;
      save.version = 2;
      save.choice = button.dataset.choice || null;
      storeSave(save);
      candidateRecord(save);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === saveKey) {
      checkViewedSave(getSave());
      document.dispatchEvent(new Event("menu:save"));
    }
    if (event.key === WhiteMistSave.key) document.dispatchEvent(new Event("menu:save"));
    if (event.key === null || Object.values(preferenceKeys).includes(event.key)) {
      document.dispatchEvent(new Event("menu:preferences"));
    }
  });
  document.addEventListener("menu:preferences", () => {
    for (const input of content.querySelectorAll("[data-setting]")) {
      input.checked = preference(input.dataset.setting) === "on";
    }
  });
  if (location.hash === "#rules") {
    document.dispatchEvent(new CustomEvent("menu:open", { detail: "rules" }));
  }
})();
