const { test, expect } = require('@playwright/test');

test.describe('Opening Sequence', () => {
  test('오프닝 텍스트가 타이핑 효과로 표시된 후 게임이 시작된다', async ({ page }) => {
    await page.goto('./index.html?__test__');

    const input = page.locator('#player-name-input');
    await expect(input).toBeVisible();

    const overlay = page.locator('#overlay');

    // 게임 시작
    await page.keyboard.press('Enter');

    // 시네마틱 텍스트 컨테이너가 나타남
    const cinematicText = page.locator('#cinematic-text');
    await expect(cinematicText).toBeVisible({ timeout: 3000 });

    // 타이핑이 진행되어 텍스트가 나타남
    await expect(cinematicText).not.toBeEmpty({ timeout: 5000 });

    // 오프닝 종료 후 게임 시작 확인
    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });
  });
});

test.describe('Ending Sequence', () => {
  test('보스 클리어 후 엔딩 멘트가 표시되고 퇴근 성공 화면이 나온다', async ({ page }) => {
    await page.goto('./index.html?__test__');

    const input = page.locator('#player-name-input');
    await expect(input).toBeVisible();
    await page.keyboard.press('Enter');

    // 오프닝 종료 대기
    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    // 이스터에그 활성화를 위해 UI 패널 열기
    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    const overlay = page.locator('#overlay');

    // 이스터에그로 마지막 층 넘어서 onWin 트리거
    for (let i = 0; i < 15; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 엔딩 시네마틱 후 퇴근 성공 화면 확인
    await expect(overlay).toContainText('퇴근 성공', { timeout: 25000 });
    await expect(overlay).toContainText('총 소요 시간:', { timeout: 5000 });
    await expect(overlay).toContainText('최종 평가:', { timeout: 5000 });
  });
});
