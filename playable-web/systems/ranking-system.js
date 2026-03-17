/**
 * RescapeR Ranking System
 * 글로벌 랭킹(명예의 퇴근 명부) 관리를 위한 시스템 모듈
 */

const API_BASE_URL = 'http://localhost:3000/api'; // 프로덕션 환경에서는 실제 서버 URL로 변경 필요
const SECRET_KEY = 'rescaper_secret_token_2024';
const STORAGE_QUEUE_KEY = 'rescaperRankingQueue';

export const RescapeRRankingSystem = {
  /**
   * HMAC-SHA256 체크섬 생성 (Web Crypto API 사용)
   */
  async generateChecksum(name, time, pay) {
    // 부동 소수점 정밀도 및 타입 통일
    const timeStr = parseFloat(time).toFixed(2);
    const payStr = parseInt(pay).toString();
    const dataString = `${name}:${timeStr}:${payStr}`;
    
    console.log('[Ranking] Generating checksum for:', dataString); // 디버깅용

    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const msgData = encoder.encode(dataString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * 랭킹 기록 제출
   */
  async submitRecord(name, timeMs, pay) {
    const timeSec = parseFloat((timeMs / 1000).toFixed(2));
    
    try {
      const checksum = await this.generateChecksum(name, timeSec, pay);
      const payload = {
        player_name: name,
        clear_time: timeSec,
        total_overtime_pay: pay,
        checksum: checksum
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
