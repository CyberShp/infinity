(() => {
  const menu = document.querySelector('.menu');
  const entries = Array.from(menu.querySelectorAll('.entry'));
  const resume = menu.querySelector('[data-action="continue"]');
  const saveLabel = document.getElementById('save-label');
  const fullscreen = document.getElementById('fullscreen-toggle');
  let selected = entries[0];

  const editionKey = 'infinity.menu.edition';
  const editionButtons = document.querySelectorAll('[data-edition-choice]');
  const root = document.documentElement;

  function showEdition(preference) {
    const edition = preference === 'judgment' ? 'judgment' : 'numinous';
    for (const button of editionButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.editionChoice === edition));
    }
    if (root.dataset.edition === edition) return;
    root.dataset.edition = edition;
    document.dispatchEvent(new Event('menu:edition'));
  }

  function chooseEdition(edition) {
    showEdition(edition);
    try {
      localStorage.setItem(editionKey, edition);
    } catch {
      // The choice still applies for this visit when storage is unavailable.
    }
  }

  function restoreEdition() {
    try {
      showEdition(localStorage.getItem(editionKey));
    } catch {
      showEdition(root.dataset.edition);
    }
  }

  for (const button of editionButtons) {
    button.addEventListener('click', () => chooseEdition(button.dataset.editionChoice));
  }
  window.addEventListener('storage', event => {
    if (event.key === editionKey || event.key === null) restoreEdition();
  });
  restoreEdition();

  function select(entry) {
    if (entry.disabled || selected === entry) return;
    selected.classList.remove('selected');
    selected = entry;
    selected.classList.add('selected');
  }

  function syncSave() {
    const exam = WhiteMistSave.read();
    const hall = window.InfinityMenu.saveLocation();
    const available = Boolean(exam || hall);
    const firstCheck = resume.dataset.checked !== 'true';
    resume.disabled = !available;
    resume.dataset.checked = 'true';
    resume.title = exam ? '继续白雾古宅考核' : hall ? '打开大厅考生档案' : '开始考核后可继续';
    saveLabel.textContent = exam ? '白雾古宅 · 已有进度' : hall === 'session' ? '大厅档案 · 仅本次有效' : hall ? '已有大厅档案' : '暂无本地档案';
    saveLabel.parentElement.classList.toggle('has-save', available);
    if ((firstCheck && available) || selected.disabled) select(available ? resume : entries[0]);
  }

  for (const entry of entries) {
    entry.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') select(entry);
    });
    entry.addEventListener('focus', () => select(entry));
    entry.addEventListener('click', () => {
      select(entry);
      entry.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('menu:open', { detail: entry.dataset.action }));
    });
  }

  const vortex = document.querySelector('.vortex-touch');
  vortex.addEventListener('click', () => {
    vortex.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('menu:open', { detail: 'exchange' }));
  });

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.isComposing || document.querySelector('dialog[open]') ||
        event.target.isContentEditable || event.target.closest?.('input, textarea, select')) return;
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'b') {
      event.preventDefault();
      if (!event.repeat) chooseEdition(key === 'a' ? 'judgment' : 'numinous');
      return;
    }
    const onPage = event.target === document.body || event.target === document.documentElement;
    if (!onPage && !menu.contains(event.target)) return;
    const choices = entries.filter(entry => !entry.disabled);
    const index = choices.indexOf(selected);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      choices[(index + step + choices.length) % choices.length].focus({ preventScroll: true });
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      choices[event.key === 'Home' ? 0 : choices.length - 1].focus({ preventScroll: true });
    } else if (event.key === 'Enter' && (onPage || event.target !== selected) && !event.repeat) {
      event.preventDefault();
      selected.click();
    }
  });

  const frame = document.documentElement;
  const fullElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  function syncFullscreen() {
    const active = Boolean(fullElement());
    fullscreen.setAttribute('aria-pressed', String(active));
    fullscreen.title = active ? '退出全屏' : '进入全屏';
    fullscreen.setAttribute('aria-label', fullscreen.title);
    fullscreen.querySelector('use').setAttribute('href', active ? '#i-exit-full' : '#i-full');
  }

  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
    fullscreen.addEventListener('click', async () => {
      try {
        if (fullElement()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else await (frame.requestFullscreen || frame.webkitRequestFullscreen).call(frame);
      } catch {
        fullscreen.title = '当前窗口无法切换全屏';
      }
    });
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
  } else {
    fullscreen.hidden = true;
    document.querySelector('.tool-rule').hidden = true;
  }
  document.addEventListener('menu:save', syncSave);
  window.addEventListener('pageshow', syncSave);
  syncSave();
})();
