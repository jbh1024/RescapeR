#!/usr/bin/env node
/**
 * RescapeR Player Character Sprite Generator v2
 *
 * 캐릭터 컨셉: "안경을 쓰고, 셔츠+바지를 입은 피곤해보이는 회사원"
 * - 측면(오른쪽을 바라보는) 시점
 * - 세로로 긴 비율 (24×48 프레임)
 * - 반쯤 감긴 눈, 다크서클, 뿔테 안경
 * - 셔츠 + 느슨한 넥타이 + 바지 + 구두
 * - 키보드 무기
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'playable-web', 'assets', 'sprites', 'player');

function savePNG(canvas, filename) {
  fs.writeFileSync(path.join(ASSET_DIR, filename), canvas.toBuffer('image/png'));
  console.log(`  ✓ ${filename} (${canvas.width}×${canvas.height})`);
}

// 1px 찍기
function px(ctx, x, y, c) { if(c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); } }
// 가로줄 찍기 (null은 건너뜀)
function row(ctx, x, y, cols) { cols.forEach((c, i) => { if(c) px(ctx, x+i, y, c); }); }
// 세로줄
function col(ctx, x, y, cols) { cols.forEach((c, i) => { if(c) px(ctx, x, y+i, c); }); }
// 사각형
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// ============================================
// 컬러 팔레트
// ============================================
const C = {
  hair:     '#2a2a3a', hairL:   '#3a3a4a', hairH:   '#1a1a2a',
  skin:     '#e8cfa0', skinS:   '#d4b888', skinD:   '#c0a070',
  glassFr:  '#1a1a2e', glassL:  '#90b8d8',
  eyeW:     '#e0e0e0', eyeP:    '#1a1a1a', tired:   '#c09080',
  shirt:    '#e8e8f0', shirtS:  '#c8c8d4', shirtD:  '#b0b0c0',
  tie:      '#4a6a9a', tieL:    '#6a8aba',
  pants:    '#2a3040', pantsS:  '#1a2030', pantsH:  '#3a4050',
  shoe:     '#1a1a1a', shoeH:   '#2a2020',
  kb:       '#555555', kbK:     '#dddddd', kbKS:    '#aaaaaa',
  sweat:    '#80c0e0', white:   '#ffffff',
  belt:     '#3a3020',
};

// ============================================
// 측면 뷰 idle (24×48, 오른쪽을 바라봄)
// ============================================
function drawSideIdle(ctx, ox, oy) {
  const X = ox, Y = oy;

  // ─── 머리카락 (Y+0~Y+5) ───
  //    머리 왼쪽(뒤통수)이 약간 볼록, 오른쪽(앞머리)이 이마까지
  row(ctx, X+7,  Y+0,  [C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair]);
  row(ctx, X+6,  Y+1,  [C.hair, C.hairL, C.hair, C.hair, C.hair, C.hair, C.hairL, C.hair, C.hair]);
  row(ctx, X+6,  Y+2,  [C.hair, C.hair, C.hairL, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair]);
  row(ctx, X+6,  Y+3,  [C.hairH, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hairH, C.hair]);
  row(ctx, X+7,  Y+4,  [C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair]);
  // 이마
  row(ctx, X+7,  Y+5,  [C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin]);
  px(ctx, X+6, Y+5, C.hairH); // 구레나룻

  // ─── 얼굴 측면 (Y+6~Y+11) ───
  // Y+6: 안경 상단 프레임
  row(ctx, X+7,  Y+6,  [C.skin, C.glassFr, C.glassFr, C.glassFr, C.glassFr, C.skin, C.skin]);
  px(ctx, X+6, Y+6, C.hairH);

  // Y+7: 안경 렌즈 + 반감긴 눈
  px(ctx, X+6, Y+7, C.hairH);
  px(ctx, X+7, Y+7, C.skin);
  px(ctx, X+8, Y+7, C.glassFr);
  px(ctx, X+9, Y+7, C.skinS);   // 반감긴 윗눈꺼풀
  px(ctx, X+10, Y+7, C.eyeP);   // 동공
  px(ctx, X+11, Y+7, C.glassL); // 렌즈 반사
  px(ctx, X+12, Y+7, C.glassFr);// 안경테 앞
  px(ctx, X+13, Y+7, C.skin);

  // Y+8: 안경 하단 + 다크서클 + 코
  px(ctx, X+6, Y+8, C.hairH);
  px(ctx, X+7, Y+8, C.skin);
  row(ctx, X+8, Y+8, [C.glassFr, C.tired, C.tired, C.glassFr]);
  row(ctx, X+12, Y+8, [C.skin, C.skin, C.skinD]); // 코 돌출

  // Y+9: 코, 볼
  px(ctx, X+6, Y+9, C.hairH);
  row(ctx, X+7, Y+9, [C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, C.skinD, C.skinD]);

  // Y+10: 입 (살짝 찡그림)
  px(ctx, X+6, Y+10, C.skin);
  row(ctx, X+7, Y+10, [C.skin, C.skin, C.skin, C.skinD, C.skinD, C.skin, C.skin]);

  // Y+11: 턱
  row(ctx, X+7, Y+11, [C.skin, C.skin, C.skinS, C.skinS, C.skinS, C.skin, C.skin]);

  // ─── 목 (Y+12~Y+13) ───
  row(ctx, X+8, Y+12, [C.skin, C.skin, C.skin, C.skin, C.skin]);
  row(ctx, X+8, Y+13, [C.shirt, C.shirt, C.shirt, C.shirt, C.shirt]); // 칼라

  // ─── 어깨 + 셔츠 (Y+14~Y+24) ───
  // 어깨 (측면이라 한쪽 팔만 보임)
  row(ctx, X+6, Y+14, [C.shirtS, C.shirt, C.shirt, C.tie, C.tieL, C.shirt, C.shirt, C.shirt, C.shirtS]);
  row(ctx, X+6, Y+15, [C.shirtS, C.shirt, C.shirt, C.shirt, C.tie, C.shirt, C.shirt, C.shirt, C.shirtS]);
  row(ctx, X+6, Y+16, [C.shirtD, C.shirt, C.shirt, C.shirt, C.tie, C.shirt, C.shirt, C.shirt, C.shirtD]);
  row(ctx, X+6, Y+17, [C.shirtD, C.shirt, C.shirtS, C.shirt, C.tie, C.shirt, C.shirtS, C.shirt, C.shirtD]);
  row(ctx, X+7, Y+18, [C.shirtS, C.shirt, C.shirt, C.tieL, C.shirt, C.shirt, C.shirtS]);
  row(ctx, X+7, Y+19, [C.shirtD, C.shirtS, C.shirt, C.tie, C.shirt, C.shirtS, C.shirtD]);

  // 팔 (측면 — 몸 앞쪽에 한쪽 팔)
  px(ctx, X+14, Y+15, C.shirt);
  px(ctx, X+14, Y+16, C.shirt);
  px(ctx, X+14, Y+17, C.shirt);
  px(ctx, X+14, Y+18, C.shirtS);
  px(ctx, X+15, Y+19, C.skinS); // 손
  px(ctx, X+15, Y+20, C.skinS);

  // Y+20: 셔츠 밑단
  row(ctx, X+7, Y+20, [C.shirtD, C.shirtS, C.shirtS, C.tieL, C.shirtS, C.shirtS, C.shirtD]);

  // ─── 벨트 (Y+21) ───
  row(ctx, X+7, Y+21, [C.belt, C.belt, C.belt, C.belt, C.belt, C.belt, C.belt]);

  // ─── 바지 (Y+22~Y+35) ───
  row(ctx, X+7, Y+22, [C.pants, C.pants, C.pants, C.pantsS, C.pants, C.pants, C.pants]);
  row(ctx, X+7, Y+23, [C.pants, C.pants, C.pants, C.pantsS, C.pants, C.pants, C.pants]);
  row(ctx, X+7, Y+24, [C.pants, C.pantsH, C.pants, C.pantsS, C.pants, C.pantsH, C.pants]);
  row(ctx, X+7, Y+25, [C.pants, C.pants, C.pants, C.pantsS, C.pants, C.pants, C.pants]);
  row(ctx, X+7, Y+26, [C.pants, C.pants, C.pantsH, C.pantsS, C.pantsH, C.pants, C.pants]);
  // 다리 분리 (측면이라 앞뒤 다리)
  row(ctx, X+7, Y+27, [C.pants, C.pants, C.pants, null, null, C.pants, C.pants]);
  row(ctx, X+7, Y+28, [C.pantsS, C.pants, C.pants, null, null, C.pants, C.pantsS]);
  row(ctx, X+7, Y+29, [C.pants, C.pantsH, C.pants, null, null, C.pants, C.pantsH]);
  row(ctx, X+8, Y+30, [C.pants, C.pants, null, null, null, C.pants, C.pants]);
  row(ctx, X+8, Y+31, [C.pantsS, C.pants, null, null, null, C.pants, C.pantsS]);
  row(ctx, X+8, Y+32, [C.pants, C.pants, null, null, null, C.pants, C.pants]);
  row(ctx, X+8, Y+33, [C.pants, C.pantsS, null, null, null, C.pantsS, C.pants]);

  // ─── 구두 (Y+34~Y+37) ───
  // 앞다리 구두
  row(ctx, X+8, Y+34, [C.shoe, C.shoe, C.shoe]);
  row(ctx, X+7, Y+35, [C.shoeH, C.shoe, C.shoe, C.shoe]);
  // 뒷다리 구두
  row(ctx, X+12, Y+34, [C.shoe, C.shoe, C.shoe]);
  row(ctx, X+12, Y+35, [C.shoe, C.shoe, C.shoe, C.shoeH]);

  // 땀방울 (피곤)
  px(ctx, X+15, Y+4, C.sweat);
  px(ctx, X+15, Y+5, C.sweat);
}

// ============================================
// 걷기 1 (왼발 앞)
// ============================================
function drawSideWalk1(ctx, ox, oy) {
  drawSideIdle(ctx, ox, oy);
  const X = ox, Y = oy;
  // 다리 덮기
  ctx.clearRect(X+7, Y+27, 9, 9);
  // 앞다리 (앞으로 벌림)
  row(ctx, X+9, Y+27, [C.pants, C.pants]);
  row(ctx, X+10, Y+28, [C.pants, C.pants]);
  row(ctx, X+11, Y+29, [C.pants, C.pants]);
  row(ctx, X+11, Y+30, [C.pantsS, C.pants]);
  row(ctx, X+12, Y+31, [C.pants, C.pants]);
  row(ctx, X+12, Y+32, [C.pants, C.pantsS]);
  row(ctx, X+12, Y+33, [C.shoe, C.shoe]);
  row(ctx, X+11, Y+34, [C.shoeH, C.shoe, C.shoe, C.shoe]);
  // 뒷다리 (뒤로)
  row(ctx, X+7, Y+27, [C.pants, C.pants]);
  row(ctx, X+7, Y+28, [C.pantsS, C.pants]);
  row(ctx, X+7, Y+29, [C.pants, C.pants]);
  row(ctx, X+7, Y+30, [C.pants, C.pantsS]);
  row(ctx, X+7, Y+31, [C.pants, C.pants]);
  row(ctx, X+7, Y+32, [C.shoe, C.shoe]);
  ctx.clearRect(X+7, Y+35, 4, 1);
  row(ctx, X+7, Y+33, [C.shoe, C.shoe, C.shoeH]);
}

// ============================================
// 걷기 2 (오른발 앞)
// ============================================
function drawSideWalk2(ctx, ox, oy) {
  drawSideIdle(ctx, ox, oy);
  const X = ox, Y = oy;
  ctx.clearRect(X+7, Y+27, 9, 9);
  // 앞다리 (뒤로)
  row(ctx, X+7, Y+27, [C.pants, C.pants]);
  row(ctx, X+7, Y+28, [C.pants, C.pantsS]);
  row(ctx, X+7, Y+29, [C.pantsS, C.pants]);
  row(ctx, X+7, Y+30, [C.pants, C.pants]);
  row(ctx, X+8, Y+31, [C.pants, C.pants]);
  row(ctx, X+8, Y+32, [C.pantsS, C.pants]);
  row(ctx, X+8, Y+33, [C.shoe, C.shoe]);
  row(ctx, X+7, Y+34, [C.shoeH, C.shoe, C.shoe, C.shoe]);
  // 뒷다리 (앞으로)
  row(ctx, X+12, Y+27, [C.pants, C.pants]);
  row(ctx, X+12, Y+28, [C.pantsS, C.pants]);
  row(ctx, X+11, Y+29, [C.pants, C.pants]);
  row(ctx, X+11, Y+30, [C.pants, C.pantsS]);
  row(ctx, X+10, Y+31, [C.pants, C.pants]);
  row(ctx, X+10, Y+32, [C.shoe, C.shoe]);
  ctx.clearRect(X+12, Y+35, 4, 1);
  row(ctx, X+10, Y+33, [C.shoe, C.shoe, C.shoeH]);
}

// ============================================
// 점프
// ============================================
function drawSideJump(ctx, ox, oy) {
  drawSideIdle(ctx, ox, oy - 2); // 전체 약간 위로
  const X = ox, Y = oy;
  // 다리를 모음
  ctx.clearRect(X+7, Y+25, 9, 12);
  row(ctx, X+8, Y+25, [C.pants, C.pants, C.pants, null, C.pants, C.pants]);
  row(ctx, X+8, Y+26, [C.pantsS, C.pants, null, null, null, C.pants]);
  row(ctx, X+8, Y+27, [C.pants, C.pants, null, null, C.pants, C.pants]);
  row(ctx, X+7, Y+28, [C.shoe, C.shoe, C.shoe, null, null, C.shoe, C.shoe, C.shoe]);
  // 넥타이 펄럭
  px(ctx, X+11, Y+19, C.tieL);
  px(ctx, X+12, Y+20, C.tie);
}

// ============================================
// 낙하
// ============================================
function drawSideFall(ctx, ox, oy) {
  drawSideIdle(ctx, ox, oy + 2);
  const X = ox, Y = oy;
  // 다리 벌림
  ctx.clearRect(X+6, Y+29, 12, 10);
  // 앞다리 (앞으로 벌림)
  row(ctx, X+11, Y+30, [C.pants, C.pants]);
  row(ctx, X+12, Y+31, [C.pants, C.pants]);
  row(ctx, X+13, Y+32, [C.pants, C.pantsS]);
  row(ctx, X+13, Y+33, [C.shoe, C.shoe]);
  row(ctx, X+13, Y+34, [C.shoe, C.shoe, C.shoeH]);
  // 뒷다리 (뒤로 벌림)
  row(ctx, X+8, Y+30, [C.pants, C.pants]);
  row(ctx, X+7, Y+31, [C.pantsS, C.pants]);
  row(ctx, X+6, Y+32, [C.pants, C.pants]);
  row(ctx, X+6, Y+33, [C.shoe, C.shoe]);
  row(ctx, X+5, Y+34, [C.shoeH, C.shoe, C.shoe]);
}

// ============================================
// 공격 (키보드 스윙)
// ============================================
function drawSideAttack(ctx, ox, oy) {
  drawSideIdle(ctx, ox, oy);
  const X = ox, Y = oy;
  // 팔 + 키보드 (오른쪽으로 스윙)
  ctx.clearRect(X+14, Y+15, 10, 8);
  // 팔 뻗기
  px(ctx, X+14, Y+14, C.shirt);
  px(ctx, X+15, Y+14, C.shirt);
  px(ctx, X+16, Y+15, C.skinS);
  // 키보드 (가로로 스윙)
  row(ctx, X+16, Y+12, [C.kb, C.kb, C.kb, C.kb, C.kb, C.kb]);
  row(ctx, X+16, Y+13, [C.kbK, C.kbKS, C.kbK, C.kbKS, C.kbK, C.kbKS]);
  row(ctx, X+16, Y+14, [C.kb, C.kb, C.kb, C.kb, C.kb, C.kb]);
  row(ctx, X+16, Y+15, [C.kbK, C.kbK, C.kbKS, C.kbK, C.kbK, C.kbKS]);
  row(ctx, X+16, Y+16, [C.kb, C.kb, C.kb, C.kb, C.kb, C.kb]);
  // 충격 이펙트
  px(ctx, X+22, Y+13, C.white);
  px(ctx, X+23, Y+14, '#ffff00');
  px(ctx, X+22, Y+15, C.white);
}

// ============================================
// 피격
// ============================================
function drawSideHurt(ctx, ox, oy) {
  drawSideIdle(ctx, ox + 1, oy + 1);
  const X = ox, Y = oy;
  // 눈을 X로
  px(ctx, X+10, Y+8, '#ff4444');
  px(ctx, X+11, Y+8, '#ff4444');
  // 충격 별
  px(ctx, X+4, Y+6, C.white);
  px(ctx, X+18, Y+3, C.white);
  px(ctx, X+3, Y+12, '#ffff00');
}

// ============================================
// 메인 생성
// ============================================
function main() {
  console.log('🧑‍💼 RescapeR 주인공 스프라이트 v2 (측면뷰, 세로 2배)');
  console.log('프레임 크기: 24×48\n');

  // 1. stand: 48×48 이미지 (2개 프레임: idle@(0,0), walk1/alt@(24,0))
  {
    const canvas = createCanvas(48, 48);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawSideIdle(ctx, 0, 0);
    drawSideWalk1(ctx, 24, 0);
    savePNG(canvas, 'rescaper_player_idle.png');
  }

  // 2. jump: 48×48 (fall@(0,0), jump@(24,0))
  {
    const canvas = createCanvas(48, 48);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawSideFall(ctx, 0, 0);
    drawSideJump(ctx, 24, 0);
    savePNG(canvas, 'rescaper_player_jump.png');
  }

  // 3. hurt: 72×96 (hurt 변형들)
  {
    const canvas = createCanvas(72, 96);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawSideHurt(ctx, 0, 0);
    drawSideHurt(ctx, 24, 0);
    drawSideAttack(ctx, 48, 0);
    drawSideHurt(ctx, 0, 48);
    drawSideHurt(ctx, 24, 48);
    drawSideFall(ctx, 48, 48);
    savePNG(canvas, 'rescaper_player_fall.png');
  }

  console.log('\n✅ 생성 완료! ART_FRAME_SPECS.player의 h를 24→48로 변경 필요');
}

main();
