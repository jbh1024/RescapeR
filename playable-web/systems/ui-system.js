export const RescapeRUiSystem = {
  formatDuration(ms) {
    if (typeof ms !== "number" || isNaN(ms)) return "00:00";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  },

  gradeByTime(ms) {
    const sec = ms / 1000;
    if (sec < 480) return "S+ (전설의 퇴근러)";
    if (sec < 660) return "S (칼퇴의 달인)";
    if (sec < 900) return "A (우수 사원)";
    if (sec < 1200) return "B (평범한 직장인)";
    return "C (야근 확정)";
  }
};
