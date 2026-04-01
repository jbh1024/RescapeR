#!/usr/bin/env node
/**
 * RescapeR AI Asset Generator — 세계관 기반 (Clean Illustration Style)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSET_BASE = path.join(__dirname, '..', 'playable-web', 'assets', 'sprites');

function savePNG(canvas, relPath) {
  const fullPath = path.join(ASSET_BASE, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, canvas.toBuffer('image/png'));
  console.log(`  ✓ ${relPath} (${canvas.width}×${canvas.height})`);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function px(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * s, y * s, s, s);
}

function outlinedRect(ctx, x, y, w, h, fill, outline) {
  ctx.fillStyle = outline;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

// ============================================
// P0-A: 플레이어 (Clean Illustration Style)
// ============================================
function generatePlayerAssets() {
  console.log('\n👔 P0: 야근하는 개발자 스프라이트시트 생성 (Clean Pixel Illustration Style)');

  const styles = {
    vanguard: { main: '#3498db', dark: '#2980b9', line: '#1a3a5a', skin: '#f5e6c8', hair: '#2c3e50', hairL: '#34495e' },
    striker: { main: '#9b59b6', dark: '#8e44ad', line: '#2e1a4a', skin: '#ffe8c8', hair: '#1a1a2a', hairL: '#2a2a3a' },
    phantom: { main: '#34495e', dark: '#2c3e50', line: '#0f1a2a', skin: '#e8c8d8', hair: '#3a2a4a', hairL: '#4a3a5a', hoodUp: true },
  };

  const FW = 64, FH = 96;

  for (const [styleId, c] of Object.entries(styles)) {
    const canvas = createCanvas(FW * 13, FH);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    function drawDev(frameIndex, opts = {}) {
      const ox = (frameIndex * FW) + 24;
      const oy = (opts.offsetY || 16);

      if (!c.hoodUp || !opts.hoodieOn) {
        outlinedRect(ctx, ox - 6, oy - 4, 16, 14, c.hair, c.line);
        rect(ctx, ox - 4, oy - 4, 10, 4, c.hairL);
      } else {
        outlinedRect(ctx, ox - 8, oy - 6, 20, 18, c.main, c.line);
        rect(ctx, ox - 6, oy - 4, 16, 14, c.dark);
      }

      outlinedRect(ctx, ox - 2, oy + 6, 12, 14, c.skin, c.line);
      ctx.strokeStyle = c.line; ctx.lineWidth = 1;
      ctx.strokeRect(ox + 2, oy + 9, 4, 4); ctx.strokeRect(ox + 7, oy + 9, 4, 4); 
      rect(ctx, ox + 3, oy + 10, 2, 1, '#222'); rect(ctx, ox + 8, oy + 10, 2, 1, '#222');

      const bodyY = oy + 20;
      outlinedRect(ctx, ox - 4, bodyY, 14, 28, c.main, c.line);
      rect(ctx, ox - 4, bodyY, 4, 28, c.dark);
      rect(ctx, ox + 1, bodyY - 1, 4, 3, '#fff'); rect(ctx, ox + 5, bodyY - 1, 4, 3, '#fff');

      const armAngle = opts.keyboardSwing ? (opts.swingUp ? -40 : 40) : 0;
      ctx.save(); ctx.translate(ox + 3, bodyY + 6); ctx.rotate(armAngle * Math.PI / 180);
      outlinedRect(ctx, 0, 0, 16, 6, c.main, c.line);
      rect(ctx, 16, 0, 4, 6, c.skin);
      const kx = 18, ky = -2;
      outlinedRect(ctx, kx, ky, 24, 10, '#333', '#111');
      for(let i=0; i<4; i++) rect(ctx, kx + 3 + i * 5, ky + 3, 3, 3, (frameIndex + i) % 2 === 0 ? '#555' : '#777');
      ctx.restore();

      const legY = bodyY + 28;
      function drawLeg(ldx, ldy, isFront) {
        const lx = ox + ldx; const ly = legY + ldy; const base = isFront ? c.dark : c.line;
        outlinedRect(ctx, lx, ly, 8, 18, base, c.line);
        outlinedRect(ctx, lx - 1, ly + 18, 10, 5, '#111', '#000');
      }
      if (opts.isJump) { drawLeg(-3, -4, true); drawLeg(3, -2, false); }
      else if (opts.walkPhase !== undefined) { const wp = opts.walkPhase * 2; drawLeg(wp, 0, true); drawLeg(-wp, 0, false); }
      else { drawLeg(0, 0, true); drawLeg(3, 0, false); }
    }

    let fi = 0;
    for (let f=0; f<2; f++) drawDev(fi++, { keyboard: true, offsetY: 16, hoodieOn: c.hoodUp });
    const phases = [3, 0, -3, 0];
    for (let f=0; f<4; f++) drawDev(fi++, { keyboard: true, walkPhase: phases[f], hoodieOn: c.hoodUp });
    drawDev(fi++, { keyboard: true, isJump: true, offsetY: 10, hoodieOn: c.hoodUp });
    drawDev(fi++, { keyboard: true, isJump: true, offsetY: 22, hoodieOn: c.hoodUp });
    drawDev(fi++, { keyboardSwing: true, swingUp: true, angry: true, hoodieOn: c.hoodUp }); fi++;
    drawDev(fi++, { keyboardSwing: true, swingUp: false, angry: true, hoodieOn: c.hoodUp }); fi++;
    for (let f=0; f<2; f++) drawDev(fi++, { keyboard: true, walkPhase: 4, offsetY: 18, hoodieOn: c.hoodUp });
    drawDev(fi++, { angry: false, offsetY: 20, hoodieOn: c.hoodUp });
    savePNG(canvas, `player/rescaper_player_${styleId}_sheet.png`);
  }

  {
    const dCanvas = createCanvas(FW * 4, FH); const dCtx = dCanvas.getContext('2d');
    for (let f = 0; f < 4; f++) {
      const ox = f * FW + FW/2; dCtx.save(); dCtx.translate(ox, FH/2 + f*12); dCtx.rotate((f * 35) * Math.PI / 180);
      outlinedRect(dCtx, -15, -25, 30, 50, '#2c3e50', '#0f1a2a'); dCtx.restore();
    }
    savePNG(dCanvas, 'player/rescaper_player_death_sheet.png');
  }
}

// ============================================
// P0-B: 보스 (Clean Illustration Style)
// ============================================
function generateBossAssets() {
  console.log('\n💼 P0: 보스 생성 (Clean Illustration Style)');

  const bossDefs = [
    {
      key: 'parking_boss', w: 64, h: 80,
      draw(ctx, w, h, angry) {
        const line = '#0f1a2a'; const main = '#34495e'; const dark = '#2c3e50';
        outlinedRect(ctx, 8, 20, w-16, h-32, main, line); rect(ctx, 8, 20, 10, h-32, dark);
        outlinedRect(ctx, 12, 24, w-24, 12, '#c7ecff', line);
        const eyeC = angry ? '#e74c3c' : '#f1c40f';
        outlinedRect(ctx, 14, 40, 12, 10, eyeC, line); outlinedRect(ctx, w-26, 40, 12, 10, eyeC, line);
        outlinedRect(ctx, w/2-12, h-24, 24, 8, '#fff', line);
      }
    },
    {
      key: 'server_boss', w: 56, h: 72,
      draw(ctx, w, h, angry) {
        outlinedRect(ctx, 6, 4, w-12, h-8, '#1a1a1a', '#000');
        for(let i=0; i<5; i++) {
          const unitY = 10 + i * 12; outlinedRect(ctx, 10, unitY, w-20, 8, '#333', '#000');
          px(ctx, 14, unitY+3, 1, (i % 2 === 0) ? '#2ecc71' : '#f1c40f');
        }
      }
    },
    {
      key: 'ceo_boss', w: 80, h: 96,
      draw(ctx, w, h, angry) {
        const line = '#0f172a'; const suit = '#1a1a2e'; const face = '#f5e6c8';
        outlinedRect(ctx, w/2-12, 8, 24, 20, face, line); rect(ctx, w/2-14, 4, 28, 8, '#111');
        outlinedRect(ctx, w/2-22, 28, 44, 48, suit, line); outlinedRect(ctx, w/2-2, 28, 4, 28, '#e74c3c', line);
      }
    }
  ];

  for (const boss of bossDefs) {
    const bCanvas = createCanvas(boss.w * 2, boss.h); const bCtx = bCanvas.getContext('2d');
    boss.draw(bCtx, boss.w, boss.h, false);
    bCtx.translate(boss.w, 0); boss.draw(bCtx, boss.w, boss.h, true);
    savePNG(bCanvas, `monsters/rescaper_boss_${boss.key}.png`);
  }
}

// ============================================
// P1: 배경 (Clean Illustration Style)
// ============================================
function generateBackgrounds() {
  console.log('\n🏢 P1: 배경 생성 (Clean Illustration Style)');
  const W = 340, H = 240;

  const bgs = {
    office_parking: { wall: '#2c3e50', line: '#1a252f', accent: '#f1c40f' },
    office_lobby: { wall: '#ecf0f1', line: '#bdc3c7', accent: '#3498db' },
    office_floor: { wall: '#f5e6c8', line: '#d4b888', accent: '#9b59b6' },
    office_server: { wall: '#0f172a', line: '#020617', accent: '#2ecc71' },
    office_cafe: { wall: '#3e2723', line: '#1b0000', accent: '#8b5e3c' },
    office_executive: { wall: '#1a1a2e', line: '#0f0f1a', accent: '#f1c40f' },
    office_glitch: { wall: '#000', line: '#7f1d1d', accent: '#ef4444' },
    office_marketing: { wall: '#fdf5e6', line: '#d4b888', accent: '#e67e22' },
  };

  for (const [key, c] of Object.entries(bgs)) {
    const bgCanvas = createCanvas(W, H); const bgCtx = bgCanvas.getContext('2d');
    rect(bgCtx, 0, 0, W, H, c.wall); rect(bgCtx, 0, H/2, W, H/2, c.line + '22');
    outlinedRect(bgCtx, 40, 40, 20, H, c.line, c.line); // Pillars
    outlinedRect(bgCtx, 280, 40, 20, H, c.line, c.line);
    savePNG(bgCanvas, `backgrounds/rescaper_bg_${key}.png`);
  }
}

// ============================================
// P2-A: 타일 (Clean Illustration Style)
// ============================================
function generateTiles() {
  console.log('\n🧱 P2: 타일 생성 (Clean Illustration Style)');
  const S = 24;
  const tiles = {
    concrete: '#7f8c8d', marble: '#ecf0f1', carpet: '#e67e22', metallic: '#34495e',
    wood: '#8b5e3c', luxury: '#9b59b6', tech: '#3498db', bright: '#f1c40f',
  };
  for (const [key, fill] of Object.entries(tiles)) {
    const tCanvas = createCanvas(S, S); const tCtx = tCanvas.getContext('2d');
    outlinedRect(tCtx, 2, 2, S-4, S-4, fill, '#0002');
    savePNG(tCanvas, `tiles/rescaper_tile_${key}.png`);
  }
  {
    const gw = 32, gh = 48; const gCanvas = createCanvas(gw*2, gh); const gCtx = gCanvas.getContext('2d');
    outlinedRect(gCtx, 2, 2, gw-4, gh-4, '#34495e', '#0f1a2a');
    rect(gCtx, gw, 0, gw, gh, '#1a1a1a');
    savePNG(gCanvas, 'tiles/rescaper_elevator_gate.png');
  }
}

// ============================================
// P2-B: UI (Clean Illustration Style)
// ============================================
function generateUIAssets() {
  console.log('\n🎨 P2: UI 생성 (Clean Illustration Style)');
  const IC = 24;
  const skills = ['power', 'vital', 'swift', 'blade', 'dash', 'leech', 'crit', 'critdmg', 'guard', 'regen', 'reach', 'execute'];
  const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#c0392b', '#e67e22', '#8e44ad', '#34495e', '#1abc9c', '#16a085', '#7f1d1d'];
  
  skills.forEach((sk, i) => {
    const sCanvas = createCanvas(IC, IC); const sCtx = sCanvas.getContext('2d');
    sCtx.fillStyle = colors[i]; sCtx.beginPath(); sCtx.arc(IC/2, IC/2, IC/2-1, 0, Math.PI*2); sCtx.fill();
    savePNG(sCanvas, `ui/rescaper_skill_${sk}.png`);
  });

  const items = ['energy_drink', 'overtime_coin', 'keyboard_weapon', 'artifact', 'buff_up', 'debuff_down'];
  items.forEach(it => {
    const iCanvas = createCanvas(IC, IC); const iCtx = iCanvas.getContext('2d');
    outlinedRect(iCtx, 6, 6, 12, 12, '#f1c40f', '#000');
    savePNG(iCanvas, `ui/rescaper_item_${it}.png`);
  });

  const fw=200, fh=160; const fCanvas = createCanvas(fw, fh); const fCtx = fCanvas.getContext('2d');
  outlinedRect(fCtx, 4, 4, fw-8, fh-8, 'rgba(26, 26, 46, 0.95)', '#f1c40f');
  savePNG(fCanvas, 'ui/rescaper_ui_frame.png');

  const tw=340, th=240; const tCanvas = createCanvas(tw, th); const tCtx = tCanvas.getContext('2d');
  rect(tCtx, 0, 0, tw, th, '#0f172a');
  savePNG(tCanvas, 'ui/rescaper_transition_elevator.png');
}

// ============================================
// P3: 일반 몬스터 (Clean Illustration Style)
// ============================================
function generateMonsterAssets() {
  console.log('\n👾 P3: 일반 몬스터 생성 (Clean Illustration Style)');
  const mobs = {
    mushroom: '#e74c3c', golem: '#7f8c8d', frog: '#2ecc71',
    snail: '#bdc3c7', bat: '#8e44ad', goblin: '#27ae60',
  };

  for (const [key, fill] of Object.entries(mobs)) {
    const mw = 64, mh = 64; const mCanvas = createCanvas(mw * 3, mh); const mCtx = mCanvas.getContext('2d');
    for (let f = 0; f < 3; f++) {
      const ox = f * mw; const bx = ox + 16, by = 16;
      outlinedRect(mCtx, bx, by, 32, 36, fill, '#000');
      rect(mCtx, bx + 8, by + 10, 4, 4, f === 2 ? '#e74c3c' : '#000');
      rect(mCtx, bx + 20, by + 10, 4, 4, f === 2 ? '#e74c3c' : '#000');
    }
    savePNG(mCanvas, `monsters/rescaper_${key}_anim.png`);
  }
}

function main() {
  const cat = process.argv[2] || 'all';
  const tasks = { player: generatePlayerAssets, boss: generateBossAssets, backgrounds: generateBackgrounds, tiles: generateTiles, ui: generateUIAssets, monsters: generateMonsterAssets };
  if (cat === 'all') Object.values(tasks).forEach(fn => fn());
  else if (tasks[cat]) tasks[cat]();
  else process.exit(1);
  console.log('\n✅ 에셋 생성 완료!');
}
main();
