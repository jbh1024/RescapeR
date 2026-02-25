(function attachUiSystem(global) {
  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function gradeByTime(ms) {
    const minutes = ms / 60000;
    if (minutes < 30) return "S (칼퇴의 신)";
    if (minutes < 45) return "A (모범 사원)";
    if (minutes < 60) return "B (성실 근무자)";
    return "C (야근 확정)";
  }

  global.RescapeRUiSystem = {
    formatDuration,
    gradeByTime,
  };
})(window);
