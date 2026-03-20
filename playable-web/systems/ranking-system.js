/**
 * RescapeR Ranking System
 * 글로벌 랭킹(명예의 퇴근 명부) 관리를 위한 시스템 모듈
 * 체크섬은 서버에서 생성/관리 — 클라이언트는 데이터만 전송
 */

const API_BASE_URL = '/rescaper-api'; // 호스트 Nginx가 ranking-server로 프록시
const STORAGE_QUEUE_KEY = 'rescaperRankingQueue';

export const RescapeRRankingSystem = {
  /**
   * 랭킹 기록 제출 (체크섬은 서버에서 생성)
   */
  async submitRecord(name, timeMs, pay) {
    const timeSec = parseFloat((timeMs / 1000).toFixed(2));

    try {
      const payload = {
        player_name: name,
        clear_time: timeSec,
        total_overtime_pay: pay
      };

      const response = await fetch(`${API_BASE_URL}/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Server error' };
      }

      return data;
    } catch (error) {
      console.error('Ranking submission failed, buffering locally:', error);
      this.bufferRecord(name, timeSec, pay);
      return { success: false, buffered: true };
    }
  },

  /**
   * 오프라인 시 로컬 스토리지에 기록 임시 저장
   */
  bufferRecord(name, time, pay) {
    const queue = JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY) || '[]');
    queue.push({ name, time, pay, timestamp: Date.now() });
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
  },

  /**
   * 대기 중인 기록 재전송 시도
   */
  async retryBufferedRecords() {
    const queue = JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    const remaining = [];
    for (const record of queue) {
      try {
        const success = await this.submitRecord(record.name, record.time * 1000, record.pay);
        if (!success.success && !success.buffered) remaining.push(record);
      } catch (e) {
        remaining.push(record);
      }
    }
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remaining));
  },

  /**
   * 상위 랭킹 데이터 가져오기
   */
  async fetchTopRankings() {
    try {
      const response = await fetch(`${API_BASE_URL}/rankings`);
      if (!response.ok) throw new Error('Failed to fetch rankings');
      return await response.json();
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return { top10: [] };
    }
  }
};
