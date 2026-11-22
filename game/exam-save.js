(() => {
  const key = "death_exam_s1e1_save_v4";

  function read() {
    try {
      const state = JSON.parse(localStorage.getItem(key));
      return typeof state?.stage === "string" && state.flags && state.npcs &&
        Array.isArray(state.history) && Array.isArray(state.clues) ? state : null;
    } catch {
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  window.WhiteMistSave = { key, read, write };
})();
