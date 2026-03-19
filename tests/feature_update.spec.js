const { test, expect } = require('@playwright/test');

test.describe('RescapeR Feature Updates', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 메시지 캡처
    page.on('console', msg => {
      if (msg.text().includes('Key:')) console.log('BROWSER LOG:', msg.text());
    });
    
    // 게임 시작 페이지로 이동
    await page.goto('./index.html');
    // 게임 시작 페이지로 이동
    await page.goto('./index.html');
    
    // 사원명 입력 및 게임 시작 (기본값 '야근러'로 시작)
    const input = page.locator('#player-name-input');
    await expect(input).toBeVisible();
    await page.keyboard.press('Enter');
    
    // 게임 시작 로그 확인
    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    // 이스터에그 활성화를 위해 UI 패널 열기 (h 키)
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
  });

  test('Easter egg keys (Ctrl + [ / Ctrl + ]) trigger floor transition', async ({ page }) => {
    const logElement = page.locator('#log');

    // 1. Ctrl + ] (다음 층 이동) 테스트
    await page.keyboard.down('Control');
    await page.keyboard.press(']');
    await page.keyboard.up('Control');
    
    // 로그에 이스터에그 메시지 확인
    await expect(logElement).toContainText('이스터에그: 다음 층으로 이동', { timeout: 5000 });
    
    // 2. Ctrl + [ (이전 층 이동) 테스트
    await page.keyboard.down('Control');
    await page.keyboard.press('[');
    await page.keyboard.up('Control');
    
    await expect(logElement).toContainText('이스터에그: 이전 층으로 이동', { timeout: 5000 });
    
    // 3. Ctrl + 0 (야근수당 추가) 테스트
    await page.keyboard.down('Control');
    await page.keyboard.press('0');
    await page.keyboard.up('Control');
    
    await expect(logElement).toContainText('이스터에그: 야근수당 +100 확보!', { timeout: 5000 });
  });

  test('Clear screen shows total play time and grade', async ({ page }) => {
    const logElement = page.locator('#log');
    const overlay = page.locator('#overlay');

    // 9층 대표이사실까지 층 이동 (이스터에그 활용)
    for (let i = 0; i < 15; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 엔딩 시네마틱 후 "퇴근 성공!" 텍스트 확인
    await expect(overlay).toContainText('퇴근 성공!', { timeout: 25000 });
    
    // 총 소요 시간 및 최종 평가 텍스트가 표시되는지 확인
    await expect(overlay).toContainText('총 소요 시간:', { timeout: 5000 });
    await expect(overlay).toContainText('최종 평가:', { timeout: 5000 });
    
    // 시간 형식(MM:SS)이 포함되어 있는지 정규식으로 확인 (00:00~99:59)
    const overlayText = await overlay.innerText();
    expect(overlayText).toMatch(/\d{2}:\d{2}/);
  });
});
