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
  },

  /**
   * 명예의 퇴근 명부(랭킹보드) UI 표시
   */
  async showRankingBoard(overlayEl, RankingSystem, onClose) {
    overlayEl.classList.remove("hidden");
    overlayEl.innerHTML = `
      <div style="text-align:center; background:rgba(15, 21, 31, 0.95); padding:30px; border-radius:15px; border:2px solid #4a627a; min-width:500px; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
        <h2 style="color:#ffcf6e; margin-bottom:20px; font-size:2rem; border-bottom:1px solid #4a627a; padding-bottom:10px;">🏆 명예의 퇴근 명부</h2>
        <div id="ranking-list-container" style="margin-bottom:20px; max-height:400px; overflow-y:auto;">
          <p style="color:#aaa;">데이터를 불러오는 중...</p>
        </div>
        <button id="close-ranking-btn" style="padding:10px 30px; font-size:1rem; cursor:pointer; background:#4a627a; color:#fff; border:none; border-radius:5px;">닫기</button>
      </div>
    `;

    const container = document.getElementById("ranking-list-container");
    const closeBtn = document.getElementById("close-ranking-btn");
    
    closeBtn.onclick = () => {
      overlayEl.classList.add("hidden");
      if (onClose) onClose();
    };

    try {
      const data = await RankingSystem.fetchTopRankings();
      if (!data.top10 || data.top10.length === 0) {
        container.innerHTML = `<p style="color:#888; padding:20px;">아직 등록된 퇴근 기록이 없습니다.</p>`;
      } else {
        let html = `
          <table style="width:100%; border-collapse:collapse; color:#eee; font-size:1.1rem; text-align:center;">
            <thead>
              <tr style="border-bottom:2px solid #333; color:#ffcf6e;">
                <th style="padding:10px;">순위</th>
                <th style="padding:10px;">사원명</th>
                <th style="padding:10px;">칼퇴 시간</th>
                <th style="padding:10px;">야근수당</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        data.top10.forEach((item, idx) => {
          const isTop3 = idx < 3;
          const rowStyle = isTop3 ? `color:#ffd700; font-weight:bold;` : '';
          const rankLabel = isTop3 ? ['🥇', '🥈', '🥉'][idx] : (idx + 1);
          
          html += `
            <tr style="border-bottom:1px solid #222; ${rowStyle}">
              <td style="padding:10px;">${rankLabel}</td>
              <td style="padding:10px;">${item.player_name}</td>
              <td style="padding:10px;">${this.formatDuration(item.clear_time * 1000)}</td>
              <td style="padding:10px;">${item.total_overtime_pay.toLocaleString()}</td>
            </tr>
          `;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
      }
    } catch (err) {
      container.innerHTML = `<p style="color:#ff6b6b; padding:20px;">기록을 불러오지 못했습니다. <br>(서버 연결 확인 필요)</p>`;
    }
  }
};
