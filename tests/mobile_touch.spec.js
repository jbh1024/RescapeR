const { test, expect, devices } = require('@playwright/test');

const mobileDevice = devices['iPhone 13'];

test.describe('Mobile Touch Support', () => {

  test('모바일 뷰포트에서 가상 패드가 표시된다', async ({ browser }) => {
    const context = await browser.newContext({
      ...mobileDevice,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('./index.html?__test__');
    await page.waitForTimeout(500);

    const gamepad = page.locator('#touch-gamepad');
    await expect(gamepad).toHaveClass(/active/);

    // 패드 버튼 존재 확인
    await expect(page.locator('#touch-gamepad button[data-keycode="ArrowLeft"]')).toBeVisible();
    await expect(page.locator('#touch-gamepad button[data-keycode="ArrowRight"]')).toBeVisible();
    await expect(page.locator('#touch-gamepad button[data-keycode="ArrowUp"]')).toBeVisible();
    await expect(page.locator('#touch-gamepad button[data-keycode="Space"]')).toBeVisible();
    await expect(page.locator('#touch-gamepad button[data-keycode="ShiftLeft"]')).toBeVisible();
    await expect(page.locator('#touch-gamepad button[data-keycode="KeyE"]')).toBeVisible();
    await expect(page.locator('#touch-gamepad button[data-keycode="KeyQ"]')).toBeVisible();

    await context.close();
  });

  test('데스크톱 뷰포트에서 가상 패드가 숨겨진다', async ({ page }) => {
    await page.goto('./index.html?__test__');
    await page.waitForTimeout(500);

    const gamepad = page.locator('#touch-gamepad');
    // 데스크톱에서는 active 클래스가 없어야 함
    await expect(gamepad).not.toHaveClass(/active/);
  });

  test('상점 오버레이에서 클릭으로 아이템을 구매할 수 있다', async ({ page }) => {
    await page.goto('./index.html?__test__');
    await page.waitForTimeout(200);

    // 이름 입력 후 게임 시작
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    // 이스터에그 활성화
    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    // B1 보급소(index 5)까지 이동
    for (let i = 0; i < 5; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 골드 지급
    for (let i = 0; i < 2; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press('0');
      await page.keyboard.up('Control');
      await page.waitForTimeout(50);
    }

    // 플레이어를 상점 위치로 이동
    await page.evaluate(() => {
      const s = window.gameState;
      s.player.x = s.floor.shop.x;
      s.player.y = s.floor.shop.y;
    });
    await page.waitForTimeout(300);

    // E키로 상점 열기
    await page.keyboard.down('e');
    await page.waitForTimeout(200);
    await page.keyboard.up('e');
    await page.waitForTimeout(300);

    const shopMode = await page.evaluate(() => window.gameState.mode);
    expect(shopMode).toBe('shop');

    // 클릭으로 에너지 드링크 구매
    await page.locator('[data-shop-index="0"]').click();
    await page.waitForTimeout(300);

    const resultMode = await page.evaluate(() => window.gameState.mode);
    expect(resultMode).toBe('purchaseResult');

    // 클릭으로 결과 배너 닫기
    await page.locator('#overlay').click();
    await page.waitForTimeout(500);

    const modeAfter = await page.evaluate(() => window.gameState.mode);
    expect(modeAfter).toBe('shop');
  });

  test('상점 닫기 버튼이 동작한다', async ({ page }) => {
    await page.goto('./index.html?__test__');
    await page.waitForTimeout(200);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    // B1 보급소까지 이동
    for (let i = 0; i < 5; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 플레이어를 상점 위치로 이동 + 상점 열기
    await page.evaluate(() => {
      const s = window.gameState;
      s.player.x = s.floor.shop.x;
      s.player.y = s.floor.shop.y;
    });
    await page.waitForTimeout(300);
    await page.keyboard.down('e');
    await page.waitForTimeout(200);
    await page.keyboard.up('e');
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.gameState.mode)).toBe('shop');

    // 닫기 버튼 클릭
    await page.locator('#shop-close-btn').click();
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.gameState.mode)).toBe('playing');
  });

  test('카페 오버레이에서 클릭으로 메뉴를 이용할 수 있다', async ({ page }) => {
    await page.goto('./index.html?__test__');
    await page.waitForTimeout(200);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    // 7층 카페까지 이동
    for (let i = 0; i < 12; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 골드 지급
    for (let i = 0; i < 2; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press('0');
      await page.keyboard.up('Control');
      await page.waitForTimeout(50);
    }

    // 플레이어를 카페 위치로 이동
    await page.evaluate(() => {
      const s = window.gameState;
      s.player.x = s.floor.cafe.x;
      s.player.y = s.floor.cafe.y;
    });
    await page.waitForTimeout(300);

    // E키로 카페 열기
    await page.keyboard.down('e');
    await page.waitForTimeout(200);
    await page.keyboard.up('e');
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.gameState.mode)).toBe('cafe');

    // 클릭으로 도박 (index 0)
    await page.locator('[data-cafe-index="0"]').click();
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.gameState.mode)).toBe('purchaseResult');
  });

  test('출퇴근 조정신청 오버레이에서 클릭으로 옵션을 선택할 수 있다', async ({ page }) => {
    await page.goto('./index.html?__test__');
    await page.waitForTimeout(200);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    // 7층 카페까지 이동
    for (let i = 0; i < 12; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 골드 충분히 지급
    for (let i = 0; i < 15; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press('0');
      await page.keyboard.up('Control');
      await page.waitForTimeout(50);
    }

    // 카페 열기
    await page.evaluate(() => {
      const s = window.gameState;
      s.player.x = s.floor.cafe.x;
      s.player.y = s.floor.cafe.y;
    });
    await page.waitForTimeout(300);
    await page.keyboard.down('e');
    await page.waitForTimeout(200);
    await page.keyboard.up('e');
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.gameState.mode)).toBe('cafe');

    // 출퇴근 조정신청 클릭 (index 2)
    await page.locator('[data-cafe-index="2"]').click();
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.gameState.mode)).toBe('commute');

    // 반반차 클릭 (index 1)
    await page.locator('[data-commute-index="1"]').click();
    await page.waitForTimeout(300);

    // 출퇴근 사용 후 카페로 복귀
    const commuteUsed = await page.evaluate(() => window.gameState.player.commuteUsed);
    expect(commuteUsed).toBe(true);
  });
});
