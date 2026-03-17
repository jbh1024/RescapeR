const { test, expect } = require('@playwright/test');

test.describe('RescapeR Ranking System Verification', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 로그 캡처
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    await page.goto('http://localhost:8000/playable-web/index.html');
    
    const input = page.locator('#player-name-input');
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('테스트사원');
    
    // 포커스 확인 후 엔터
    await input.focus();
    await page.keyboard.press('Enter');
    
    // 로그에 시작 메시지가 뜰 때까지 대기 (게임이 실제 시작됨을 보장)
    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 10000 });
    
    // 애니메이션/초기화 대기
    await page.waitForTimeout(500);
  });

  test('K key should open the ranking board', async ({ page }) => {
    const overlay = page.locator('#overlay');
    
    // K 키 입력
    await page.keyboard.press('k');
    
    // 랭킹 보드 타이틀 확인
    await expect(overlay).toContainText('🏆 명예의 퇴근 명부', { timeout: 5000 });
    
    // 닫기 버튼 작동 확인
    const closeBtn = page.locator('#close-ranking-btn');
    await closeBtn.click();
    await expect(overlay).toBeHidden();
  });

  test('Should submit ranking after winning the game', async ({ page }) => {
    const overlay = page.locator('#overlay');

    // 9층 대표이사실까지 층 이동 (이스터에그 활용: 15회 이동)
    for (let i = 0; i < 15; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(50);
    }

    // "퇴근 성공!" 확인
    await expect(overlay).toContainText('퇴근 성공!', { timeout: 10000 });
    
    // 테스트 안정성을 위해 게임 경과 시간을 30초 이상(예: 50초)으로 강제 설정
    await page.evaluate(() => {
      window.gameState.runElapsedMs = 50000;
    });

    // "명예의 전당 등록" 버튼 클릭
    const submitBtn = page.locator('#submit-ranking-btn');
    await expect(submitBtn).toBeVisible();
    
    // 브라우저 얼럿(alert) 핸들링
    page.on('dialog', async dialog => {
      console.log('ALERT:', dialog.message());
      expect(dialog.message()).toContain('등록되었습니다');
      await dialog.accept();
    });

    await submitBtn.click();

    // 등록 후 랭킹 보드가 자동으로 나타나는지 확인
    await expect(overlay).toContainText('🏆 명예의 퇴근 명부', { timeout: 10000 });
  });

  test('Ranking integrity check (HMAC validation test)', async ({ page }) => {
    // RankingSystem 모듈이 정상적으로 체크섬을 생성하고 전송하는지 런타임 확인
    const result = await page.evaluate(async () => {
      const { RescapeRRankingSystem } = await import('./systems/ranking-system.js');
      // 수동으로 제출 시도 (서버 3000포트와 통신 가능한지 확인)
      return await RescapeRRankingSystem.submitRecord('IntegrityTest', 45000, 500);
    });

    expect(result.success).toBe(true);
  });
});
