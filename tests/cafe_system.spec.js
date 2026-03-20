const { test, expect } = require('@playwright/test');

test.describe('RescapeR Cafe System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./index.html?__test__');

    const input = page.locator('#player-name-input');
    await expect(input).toBeVisible();
    await page.keyboard.press('Enter');

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

    // UI 패널 열기 (이스터에그 활성화)
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
  });

  test('7층 사내카페는 Safe Zone이며 상점과 카페 오브젝트가 존재한다', async ({ page }) => {
    // 7층(index 12)까지 이동
    for (let i = 0; i < 12; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    const floorInfo = await page.evaluate(() => ({
      name: window.gameState.floor.info.name,
      safeZone: window.gameState.floor.info.safeZone,
      zone: window.gameState.floor.info.zone,
      hasShop: !!window.gameState.floor.shop,
      hasCafe: !!window.gameState.floor.cafe,
      gateOpen: window.gameState.floor.gateOpen,
      enemyCount: window.gameState.floor.enemies.length,
    }));

    expect(floorInfo.name).toBe('7층 사내카페');
    expect(floorInfo.safeZone).toBe(true);
    expect(floorInfo.zone).toBe('cafe');
    expect(floorInfo.hasShop).toBe(true);
    expect(floorInfo.hasCafe).toBe(true);
    expect(floorInfo.gateOpen).toBe(true);
    expect(floorInfo.enemyCount).toBe(0);
  });

  test('8층 보스명이 "ROAS제로(세일즈포스)"이다', async ({ page }) => {
    // 8층(index 13)까지 이동
    for (let i = 0; i < 13; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    const floorInfo = await page.evaluate(() => ({
      name: window.gameState.floor.info.name,
      boss: window.gameState.floor.info.boss,
    }));

    expect(floorInfo.name).toBe('8층 마케팅 & 기술지원');
    expect(floorInfo.boss).toBe('ROAS제로(세일즈포스)');
  });

  test('카페에서 도박 시 결과 배너가 오버레이에 표시된다', async ({ page }) => {
    // 7층까지 이동
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

    const mode = await page.evaluate(() => window.gameState.mode);
    expect(mode).toBe('cafe');

    // 도박 실행 (4키)
    await page.keyboard.press('4');
    await page.waitForTimeout(300);

    // 결과 배너가 오버레이에 표시되는지 확인
    const overlay = page.locator('#overlay');
    const resultMode = await page.evaluate(() => window.gameState.mode);
    expect(resultMode).toBe('purchaseResult');

    // 도박 결과 텍스트 중 하나가 표시되어야 함 (꽝/1.5배/2배/JACKPOT)
    const overlayText = await overlay.innerText();
    const hasResult = overlayText.includes('꽝') ||
                      overlayText.includes('1.5배') ||
                      overlayText.includes('2배') ||
                      overlayText.includes('JACKPOT');
    expect(hasResult).toBe(true);

    // "아무 키나 눌러 계속..." 안내 텍스트가 있는지 확인
    await expect(overlay).toContainText('아무 키나 눌러 계속');

    // 아무 키를 누르면 카페 메뉴로 복귀
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const modeAfter = await page.evaluate(() => window.gameState.mode);
    expect(modeAfter).toBe('cafe');
    await expect(overlay).toContainText('사내카페');

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('도박 결과');
  });

  test('버프 뽑기 시 결과 배너에 버프 내역이 표시되고 HUD에 임시 버프가 나온다', async ({ page }) => {
    // 7층까지 이동
    for (let i = 0; i < 12; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 골드 충분히 지급
    for (let i = 0; i < 3; i++) {
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

    // 버프 뽑기 (5키)
    await page.keyboard.press('5');
    await page.waitForTimeout(300);

    // 결과 배너가 purchaseResult 모드로 표시되는지 확인
    const resultMode = await page.evaluate(() => window.gameState.mode);
    expect(resultMode).toBe('purchaseResult');

    // 오버레이에 버프명이 표시되는지 확인 (5개 버프 중 하나)
    const overlay = page.locator('#overlay');
    const overlayText = await overlay.innerText();
    const buffNames = ['에스프레소 샷', '아메리카노 부스트', '카페인 러쉬', '따뜻한 라떼', '허브티 힐링'];
    const hasBuff = buffNames.some(name => overlayText.includes(name));
    expect(hasBuff).toBe(true);

    // "2층 동안 지속" 안내도 표시되는지 확인
    await expect(overlay).toContainText('2층 동안 지속');

    // state에 버프가 저장되었는지 확인
    const buffData = await page.evaluate(() => {
      const b = window.gameState.player.tempBuffs[0];
      return b ? { label: b.label, floorsRemaining: b.floorsRemaining } : null;
    });
    expect(buffData).not.toBeNull();
    expect(buffData.floorsRemaining).toBe(2);
    expect(buffNames).toContain(buffData.label);

    // 아무 키를 눌러 카페로 복귀
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // 카페 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // HUD 캔버스에 임시 버프가 렌더링되는지 검증 (픽셀 검사)
    // TEMP BUFFS 영역은 좌측 HUD 하단에 그려짐 — 해당 영역이 투명(검정)이 아닌지 확인
    const hudPixelCheck = await page.evaluate(() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      // TEMP BUFFS 텍스트가 그려지는 대략적 영역 (x=30, y=248~300 근처)
      // artifacts가 없으면 y=248부터 시작, 있으면 그 아래
      const artCount = window.gameState.player.artifacts ? window.gameState.player.artifacts.length : 0;
      const baseY = 248 + (artCount > 0 ? (15 + artCount * 20 + 5) : 0);
      // 해당 영역의 픽셀을 샘플링하여 HUD 배경(반투명 검정)이 그려졌는지 확인
      const pixel = ctx.getImageData(30, baseY + 10, 1, 1).data;
      // HUD 배경이 있으면 alpha > 0 이고 완전 투명이 아님
      return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
    });
    // HUD 배경이 그려졌으면 alpha > 0
    expect(hudPixelCheck.a).toBeGreaterThan(0);

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('버프 획득');

    // 8층으로 이동 (1층 소모)
    await page.keyboard.down('Control');
    await page.keyboard.press(']');
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);

    const buffAfter1 = await page.evaluate(() => window.gameState.player.tempBuffs[0]?.floorsRemaining);
    expect(buffAfter1).toBe(1);

    // 9층으로 이동 (2층 소모 → 버프 만료)
    await page.keyboard.down('Control');
    await page.keyboard.press(']');
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);

    const buffCountFinal = await page.evaluate(() => window.gameState.player.tempBuffs.length);
    expect(buffCountFinal).toBe(0);
    await expect(logElement).toContainText('버프 만료');
  });

  test('보급소 아이템 구매 시 결과 배너가 표시된다', async ({ page }) => {
    // B1 보급소(index 5)까지 이동
    for (let i = 0; i < 5; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // B1 보급소인지 확인
    const floorName = await page.evaluate(() => window.gameState.floor.info.name);
    expect(floorName).toBe('지하 1층 보급소');

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

    // 에너지 드링크 구매 (1키)
    await page.keyboard.press('1');
    await page.waitForTimeout(300);

    // purchaseResult 모드로 전환되고 결과 배너가 표시되는지 확인
    const resultMode = await page.evaluate(() => window.gameState.mode);
    expect(resultMode).toBe('purchaseResult');

    const overlay = page.locator('#overlay');
    await expect(overlay).toContainText('에너지 드링크');
    await expect(overlay).toContainText('아무 키나 눌러 계속');

    // 아무 키를 눌러 상점으로 복귀
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const modeAfter = await page.evaluate(() => window.gameState.mode);
    expect(modeAfter).toBe('shop');

    // 상점 UI가 다시 표시되는지 확인
    await expect(overlay).toContainText('보급소');
  });

  test('출퇴근 조정신청은 1회만 사용 가능하다', async ({ page }) => {
    // 7층까지 이동
    for (let i = 0; i < 12; i++) {
      await page.keyboard.down('Control');
      await page.keyboard.press(']');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
    }

    // 골드 충분히 지급
    for (let i = 0; i < 12; i++) {
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

    // 출퇴근 조정신청 진입 (6키)
    await page.keyboard.press('6');
    await page.waitForTimeout(200);

    const mode = await page.evaluate(() => window.gameState.mode);
    expect(mode).toBe('commute');

    const overlay = page.locator('#overlay');
    await expect(overlay).toContainText('출퇴근 조정신청');

    // runElapsedMs 확인
    const timeBefore = await page.evaluate(() => window.gameState.runElapsedMs);

    // 반차 선택 (1키, 비용 1000g, ratio 0.5)
    await page.keyboard.press('1');
    await page.waitForTimeout(200);

    const timeAfter = await page.evaluate(() => window.gameState.runElapsedMs);
    expect(timeAfter).toBeLessThan(timeBefore);

    const commuteUsed = await page.evaluate(() => window.gameState.player.commuteUsed);
    expect(commuteUsed).toBe(true);

    const logElement = page.locator('#log');
    await expect(logElement).toContainText('출퇴근 조정');

    // 다시 출퇴근 조정신청 시도 → 차단되어야 함
    await page.keyboard.press('6');
    await page.waitForTimeout(200);

    await expect(logElement).toContainText('이미 사용했습니다');
  });
});
