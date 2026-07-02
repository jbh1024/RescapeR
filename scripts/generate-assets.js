#!/usr/bin/env node
/**
 * RescapeR 세계관 픽셀아트 에셋 생성기 (의존성 없음 — Node 내장 zlib PNG 인코딩)
 *
 * "퇴근을 위해 회사라는 던전을 탈출하라!" — IT 오피스 던전 테마의
 * 고해상도 픽셀아트를 결정적(deterministic)으로 생성한다.
 *
 * 사용법:
 *   node scripts/generate-assets.js [all|player|boss|backgrounds|tiles|ui|monsters] [--preview=<path>]
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const ASSET_BASE = path.join(__dirname, '..', 'playable-web', 'assets', 'sprites');

// ============================================================
// PNG 인코더 (RGBA 8bit, filter 0)
// ============================================================
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(surf) {
  const { w, h, d } = surf;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(d.buffer, d.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ============================================================
// Surface + 색상 유틸
// ============================================================
const colorCache = new Map();
function hexToRGBA(c) {
  if (Array.isArray(c)) return c;
  let v = colorCache.get(c);
  if (v) return v;
  let s = c.slice(1);
  if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
  v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16),
       s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255];
  colorCache.set(c, v);
  return v;
}

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }

function shade(c, f) {
  const [r, g, b] = hexToRGBA(c);
  const to2 = n => clamp255(n).toString(16).padStart(2, '0');
  return `#${to2(r * f)}${to2(g * f)}${to2(b * f)}`;
}

function mixHex(a, b, t) {
  const A = hexToRGBA(a), B = hexToRGBA(b);
  const to2 = i => clamp255(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0');
  return `#${to2(0)}${to2(1)}${to2(2)}`;
}

// 5톤 램프: 어두운 외곽 → 하이라이트
function ramp(base) {
  return { d2: shade(base, 0.42), d: shade(base, 0.66), b: base, l: mixHex(base, '#ffffff', 0.22), l2: mixHex(base, '#ffffff', 0.45) };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Surface {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8Array(w * h * 4);
  }
  px(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = hexToRGBA(c);
    const i = (y * this.w + x) * 4;
    if (a >= 255) {
      this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255;
    } else if (a > 0) {
      const t = a / 255, u = 1 - t;
      const da = this.d[i + 3] / 255;
      const outA = t + da * u;
      if (outA <= 0) return;
      this.d[i] = clamp255((r * t + this.d[i] * da * u) / outA);
      this.d[i + 1] = clamp255((g * t + this.d[i + 1] * da * u) / outA);
      this.d[i + 2] = clamp255((b * t + this.d[i + 2] * da * u) / outA);
      this.d[i + 3] = clamp255(outA * 255);
    }
  }
  rect(x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  outlineRect(x, y, w, h, c) {
    for (let xx = x; xx < x + w; xx++) { this.px(xx, y, c); this.px(xx, y + h - 1, c); }
    for (let yy = y; yy < y + h; yy++) { this.px(x, yy, c); this.px(x + w - 1, yy, c); }
  }
  hline(x, y, w, c) { for (let i = 0; i < w; i++) this.px(x + i, y, c); }
  vline(x, y, h, c) { for (let i = 0; i < h; i++) this.px(x, y + i, c); }
  line(x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.px(x, y, c);
      }
  }
  dither(x, y, w, h, c, p, rng) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (rng() < p) this.px(xx, yy, c);
  }
  checker(x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((xx + yy) % 2 === 0) this.px(xx, yy, c);
  }
  alphaAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }
  blit(src, dx, dy, scale = 1) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      if (src.d[i + 3] === 0) continue;
      const c = [src.d[i], src.d[i + 1], src.d[i + 2], src.d[i + 3]];
      if (scale === 1) this.px(dx + x, dy + y, c);
      else this.rect(dx + x * scale, dy + y * scale, scale, scale, c);
    }
  }
}

// 자동 외곽선: 불투명 픽셀에 인접한 투명 픽셀을 외곽선 색으로
function autoOutline(s, color) {
  const src = s.d.slice();
  const A = (x, y) => (x < 0 || y < 0 || x >= s.w || y >= s.h) ? 0 : src[(y * s.w + x) * 4 + 3];
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    if (A(x, y) > 40) continue;
    if (A(x - 1, y) > 40 || A(x + 1, y) > 40 || A(x, y - 1) > 40 || A(x, y + 1) > 40) s.px(x, y, color);
  }
}

// 상단 림라이트: 위가 비어있는 불투명 픽셀을 밝게
function rimLight(s, amount = 0.3, skipColor = null) {
  const skip = skipColor ? hexToRGBA(skipColor) : null;
  const src = s.d.slice();
  const A = (x, y) => (y < 0) ? 0 : src[(y * s.w + x) * 4 + 3];
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const i = (y * s.w + x) * 4;
    if (src[i + 3] < 200 || A(x, y - 1) > 40) continue;
    if (skip && src[i] === skip[0] && src[i + 1] === skip[1] && src[i + 2] === skip[2]) continue;
    s.d[i] = clamp255(src[i] + (255 - src[i]) * amount);
    s.d[i + 1] = clamp255(src[i + 1] + (255 - src[i + 1]) * amount);
    s.d[i + 2] = clamp255(src[i + 2] + (255 - src[i + 2]) * amount);
  }
}

// 단위 스케일 페인터 (설계 그리드 → 실픽셀)
function painter(s, u = 2, ox = 0, oy = 0) {
  return {
    s, u,
    px: (x, y, c) => s.rect(ox + x * u, oy + y * u, u, u, c),
    rect: (x, y, w, h, c) => s.rect(ox + x * u, oy + y * u, w * u, h * u, c),
    hline: (x, y, w, c) => s.rect(ox + x * u, oy + y * u, w * u, u, c),
    vline: (x, y, h, c) => s.rect(ox + x * u, oy + y * u, u, h * u, c),
    ellipse: (cx, cy, rx, ry, c) => {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
        for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry;
          if (nx * nx + ny * ny <= 1) s.rect(ox + x * u, oy + y * u, u, u, c);
        }
    },
    line: (x0, y0, x1, y1, c) => {
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        s.rect(ox + x0 * u, oy + y0 * u, u, u, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    },
  };
}

// ============================================================
// 저장 + 컨택트시트 수집
// ============================================================
const SHEET_ENTRIES = [];

function savePNG(surf, relPath) {
  const fullPath = path.join(ASSET_BASE, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, encodePNG(surf));
  SHEET_ENTRIES.push({ name: relPath, surf });
  console.log(`  ✓ ${relPath} (${surf.w}×${surf.h})`);
}

// ============================================================
// 공통 팔레트
// ============================================================
const OUTLINE = '#141324';
const SKIN = ramp('#f0c8a0');
const SKIN_PALE = ramp('#e3c4c9');

// ============================================================
// P0: 플레이어 — 야근 개발자 3종 (64×96 × 13프레임)
// 프레임 슬롯: 0-1 idle / 2-5 walk / 6 jump / 7 fall / 8-9 attack / 10-11 dash / 12 hurt
// ============================================================
const PLAYER_STYLES = {
  vanguard: { // Back-end Architect: 남색 니트조끼 + 하늘색 셔츠 + 넥타이 + 안경
    hair: ramp('#3a4256'), skin: SKIN, shirt: ramp('#a8cbe8'), vest: ramp('#31548c'),
    pants: ramp('#2c3550'), shoe: ramp('#23202e'), tie: ramp('#c0504f'),
    glasses: true, hood: false, kbBody: ramp('#31548c'), kbGlow: '#9dd6ff', lanyard: '#5d9cec',
  },
  striker: { // Full-stack Developer: 체크셔츠 + 티셔츠 + RGB 키보드
    hair: ramp('#6b4a2f'), skin: SKIN, shirt: ramp('#e8e4da'), vest: ramp('#c96f3b'),
    pants: ramp('#3f5064'), shoe: ramp('#8c3f34'), tie: null,
    glasses: false, hood: false, kbBody: ramp('#3a3a4a'), kbGlow: '#ffd28a', lanyard: '#ffb14e', rgbKeys: true,
  },
  phantom: { // Security Researcher: 다크 후드티 (후드업) + 보라 글로우
    hair: ramp('#241d38'), skin: SKIN_PALE, shirt: ramp('#3a2f57'), vest: ramp('#2a2342'),
    pants: ramp('#201c30'), shoe: ramp('#181523'), tie: null,
    glasses: false, hood: true, kbBody: ramp('#1d1a2c'), kbGlow: '#d8b7ff', lanyard: '#9a7bd8', glowEyes: '#c9a6ff',
  },
};

// 키보드 무기 (가로/사선 두 방향)
function drawKeyboard(P, x, y, st, mode = 'flat', frame = 0) {
  const kb = st.kbBody;
  const rgbCols = ['#ff6b6b', '#ffd93d', '#6bff8f', '#6bc5ff', '#c86bff'];
  if (mode === 'flat') {
    P.rect(x, y + 1, 11, 3, kb.d);
    P.rect(x, y, 11, 3, kb.b);
    P.hline(x, y, 11, kb.l);
    for (let i = 0; i < 5; i++) {
      const kc = st.rgbKeys ? rgbCols[(i + frame) % 5] : (i % 2 ? kb.l2 : kb.l);
      P.px(x + 1 + i * 2, y + 1, kc);
    }
    P.hline(x, y + 4, 11, st.kbGlow + '');
  } else if (mode === 'up') { // 사선 들어올림 (오른쪽 위)
    for (let i = 0; i < 9; i++) {
      P.rect(x + i, y - i, 3, 2, i % 3 === 2 ? kb.d : kb.b);
      if (i % 2 === 0) P.px(x + i + 1, y - i, st.rgbKeys ? rgbCols[(i / 2) % 5 | 0] : kb.l2);
    }
    P.line(x, y + 2, x + 9, y - 7, st.kbGlow);
  }
}

// 개발자 캐릭터 (32×48 그리드, 오른쪽 향함)
function drawDev(P, st, pose = {}) {
  const bob = pose.bob || 0;
  const lean = pose.lean || 0; // +값: 앞(오른쪽)으로 기울임
  const legMode = pose.legs !== undefined ? pose.legs : 'stand';
  const oy = bob;

  // ---- 뒷팔 (몸통 뒤) ----
  const shY = 18 + oy;
  if (pose.arms === 'up' || pose.arms === 'flail') {
    P.rect(9 + lean, shY - 5, 3, 7, st.vest.d);
    P.px(9 + lean, shY - 6, st.skin.b);
  } else if (pose.arms === 'windup') {
    P.rect(8 + lean, shY - 2, 3, 6, st.vest.d);
  } else {
    const sw = pose.armSwing || 0;
    P.rect(9 + lean - sw, shY, 3, 8, st.vest.d);
    P.px(9 + lean - sw, shY + 8, st.skin.d);
  }

  // ---- 다리 + 신발 ----
  const legY = 31 + oy;
  const drawLeg = (lx, ly, len, back) => {
    const pr = st.pants;
    P.rect(lx, ly, 4, len, back ? pr.d : pr.b);
    P.vline(lx, ly, len, back ? pr.d2 : pr.d);
    P.rect(lx - 1, ly + len, 6, 2, back ? st.shoe.d : st.shoe.b);
    P.hline(lx - 1, ly + len + 2, 6, '#fffcf0');
  };
  if (legMode === 'jump') {
    drawLeg(11, legY + 1, 8, true);
    drawLeg(17, legY - 1, 9, false);
  } else if (legMode === 'fall') {
    drawLeg(10, legY, 10, true);
    drawLeg(18, legY + 1, 10, false);
  } else if (typeof legMode === 'number') {
    drawLeg(12 - legMode, legY + (legMode > 0 ? 1 : 0), 11 - Math.abs(legMode > 0 ? 1 : 0), true);
    drawLeg(17 + legMode, legY + (legMode < 0 ? 1 : 0), 11, false);
  } else if (legMode === 'dash') {
    drawLeg(10 + lean - 2, legY + 1, 9, true);
    drawLeg(17 + lean + 1, legY, 11, false);
  } else {
    drawLeg(12, legY, 11, true);
    drawLeg(17, legY, 11, false);
  }

  // ---- 몸통 ----
  const tx = 10 + lean;
  const ty = 16 + oy;
  P.rect(tx, ty, 13, 15, st.vest.b);
  P.vline(tx, ty, 15, st.vest.l);
  P.vline(tx + 12, ty, 15, st.vest.d);
  P.rect(tx + 11, ty + 2, 2, 13, st.vest.d);
  // 셔츠 (안쪽 V / 후드는 목선)
  if (st.hood) {
    P.rect(tx + 4, ty, 6, 2, st.shirt.d);
    // 후드 끈
    P.vline(tx + 5, ty + 2, 4, st.kbGlow);
    P.vline(tx + 8, ty + 2, 4, st.kbGlow);
    // 배 주머니
    P.rect(tx + 3, ty + 9, 7, 4, st.vest.d);
    P.hline(tx + 3, ty + 9, 7, st.vest.d2);
  } else {
    P.rect(tx + 4, ty, 5, 6, st.shirt.b);
    P.px(tx + 3, ty, st.shirt.l2);
    P.px(tx + 9, ty, st.shirt.l2);
    if (st.tie) { P.vline(tx + 6, ty, 6, st.tie.b); P.px(tx + 6, ty + 6, st.tie.d); }
  }
  // 사원증 목걸이
  P.vline(tx + 3, ty + 1, 5, st.lanyard);
  P.rect(tx + 2, ty + 6, 3, 4, '#f4f6fb');
  P.px(tx + 3, ty + 7, '#4a90d9');
  P.hline(tx + 2, ty + 9, 3, '#c3cad6');

  // ---- 머리 ----
  const hx = 10 + lean + (pose.headTilt || 0);
  const hy = 4 + oy + (pose.headDrop || 0);
  if (st.hood) {
    // 후드 (둥근 실루엣 + 정수리 꼭지)
    P.rect(hx, hy + 1, 14, 11, st.vest.b);
    P.rect(hx + 1, hy, 12, 2, st.vest.b);
    P.rect(hx + 3, hy - 1, 7, 1, st.vest.b);
    P.px(hx + 6, hy - 2, st.vest.d); // 꼭지
    P.vline(hx, hy + 2, 9, st.vest.l);
    P.hline(hx + 2, hy, 9, st.vest.l);
    P.rect(hx + 12, hy + 2, 2, 10, st.vest.d);
    // 후드 안 얼굴 (그림자 속 창백한 얼굴)
    P.rect(hx + 4, hy + 4, 8, 8, st.vest.d2);
    P.rect(hx + 5, hy + 5, 6, 6, mixHex(st.skin.d, '#241d38', 0.4));
    // 글로우 눈
    const ec = pose.hurt ? '#ff6b6b' : st.glowEyes;
    P.rect(hx + 6, hy + 7, 2, 2, ec);
    P.rect(hx + 10, hy + 7, 2, 2, ec);
    P.px(hx + 6, hy + 7, '#ffffff');
    P.px(hx + 10, hy + 7, '#ffffff');
  } else {
    // 얼굴
    P.rect(hx + 1, hy + 3, 11, 9, st.skin.b);
    P.vline(hx + 11, hy + 4, 8, st.skin.d);
    P.hline(hx + 2, hy + 11, 9, st.skin.d);
    // 헤어
    P.rect(hx, hy, 13, 4, st.hair.b);
    P.rect(hx, hy + 4, 2, 5, st.hair.b);
    P.rect(hx, hy, 13, 1, st.hair.l);
    P.rect(hx + 10, hy + 1, 3, 3, st.hair.d);
    if (pose.legs === 'fall') P.rect(hx + 2, hy - 1, 9, 1, st.hair.l); // 낙하 시 머리 뜸
    // 눈/입
    const eyeY = hy + 6;
    if (pose.hurt) {
      P.px(hx + 4, eyeY, OUTLINE); P.px(hx + 6, eyeY, OUTLINE);
      P.px(hx + 5, eyeY + 1, OUTLINE);
      P.px(hx + 9, eyeY, OUTLINE); P.px(hx + 11, eyeY, OUTLINE);
      P.px(hx + 10, eyeY + 1, OUTLINE);
      P.rect(hx + 6, hy + 9, 3, 2, '#8c3a3a'); // 벌린 입
    } else if (st.glasses) {
      P.rect(hx + 3, eyeY - 1, 4, 3, '#2a3040');
      P.rect(hx + 8, eyeY - 1, 4, 3, '#2a3040');
      P.px(hx + 7, eyeY, '#2a3040');
      P.rect(hx + 4, eyeY, 2, 1, '#bfe3ff');
      P.rect(hx + 9, eyeY, 2, 1, '#bfe3ff');
    } else {
      P.rect(hx + 4, eyeY, 2, 2, '#2b2b3a');
      P.rect(hx + 9, eyeY, 2, 2, '#2b2b3a');
    }
    if (!pose.hurt) P.hline(hx + 6, hy + 10, 3, mixHex(st.skin.d, '#8c5a4a', 0.5));
    // 다크서클 (야근의 흔적)
    P.hline(hx + 4, eyeY + 2, 2, mixHex(st.skin.b, '#7a86b8', 0.18));
    P.hline(hx + 9, eyeY + 2, 2, mixHex(st.skin.b, '#7a86b8', 0.18));
  }

  // ---- 앞팔 + 키보드 ----
  const armY = 18 + oy;
  const ax = tx + 9;
  if (pose.arms === 'slam') {
    P.rect(ax - 1, armY + 3, 6, 3, st.vest.b);
    P.rect(ax + 5, armY + 3, 2, 3, st.skin.b);
    drawKeyboard(P, ax + 3, armY + 6, st, 'flat', pose.frame || 0);
  } else if (pose.arms === 'windup') {
    P.rect(ax, armY - 3, 3, 6, st.vest.b);
    P.px(ax + 1, armY - 4, st.skin.b);
    drawKeyboard(P, ax + 1, armY - 5, st, 'up', pose.frame || 0);
  } else if (pose.arms === 'up' || pose.arms === 'flail') {
    P.rect(ax + 1, armY - 5, 3, 7, st.vest.b);
    P.px(ax + 1, armY - 6, st.skin.b);
  } else {
    const sw = pose.armSwing || 0;
    P.rect(ax + sw, armY, 3, 8, st.vest.b);
    P.px(ax + sw, armY + 8, st.skin.b);
    drawKeyboard(P, ax + sw - 3, armY + 9, st, 'flat', pose.frame || 0);
  }
}

function generatePlayerAssets() {
  console.log('\n👔 P0: 야근 개발자 스프라이트 3종 생성');
  const FW = 64, FH = 96, U = 2;

  for (const [styleId, st] of Object.entries(PLAYER_STYLES)) {
    const sheet = new Surface(FW * 13, FH);
    const drawFrame = (fi, pose) => {
      const cell = new Surface(FW, FH);
      const P = painter(cell, U);
      // 대시 잔상 라인
      if (pose.dashFx) {
        for (let i = 0; i < 3; i++) cell.hline(2, 40 + i * 14 + (i % 2) * 4, 16 - i * 4, st.kbGlow + 'aa');
      }
      drawDev(P, st, pose);
      autoOutline(cell, OUTLINE);
      rimLight(cell, 0.22);
      // 공격 슬램 궤적
      if (pose.arms === 'slam') {
        for (let i = 0; i < 3; i++) {
          cell.line(44, 22 + i * 3, 60, 34 + i * 4, i === 1 ? '#ffffffcc' : st.kbGlow + '99');
        }
      }
      sheet.blit(cell, fi * FW, 0);
    };

    drawFrame(0, { legs: 'stand' });
    drawFrame(1, { legs: 'stand', bob: 1 });
    drawFrame(2, { legs: 2, armSwing: 1 });
    drawFrame(3, { legs: 0, bob: 1 });
    drawFrame(4, { legs: -2, armSwing: -1 });
    drawFrame(5, { legs: 0, bob: 1 });
    drawFrame(6, { legs: 'jump', arms: 'up', bob: -2 });
    drawFrame(7, { legs: 'fall', arms: 'up', bob: 1, headDrop: -1 });
    drawFrame(8, { legs: 'stand', arms: 'windup', lean: -1 });
    drawFrame(9, { legs: 2, arms: 'slam', lean: 2, frame: 1 });
    drawFrame(10, { legs: 'dash', lean: 3, dashFx: true });
    drawFrame(11, { legs: 'dash', lean: 3, bob: 1, dashFx: true });
    drawFrame(12, { legs: 'stand', hurt: true, lean: -2, headTilt: -1 });

    savePNG(sheet, `player/rescaper_player_${styleId}_sheet.png`);
  }

  // 사망 시트: 쓰러지는 개발자 + 흩날리는 서류
  {
    const st = PLAYER_STYLES.striker;
    const sheet = new Surface(FW * 4, FH);
    for (let f = 0; f < 4; f++) {
      const cell = new Surface(FW, FH);
      const P = painter(cell, 2);
      const rng = mulberry32(77 + f);
      if (f < 2) {
        drawDev(P, st, { hurt: true, lean: -2 - f * 2, bob: f * 3, headTilt: -1 - f });
      } else {
        // 바닥에 쓰러진 자세 (가로)
        const gy = 38 + (f - 2) * 2;
        P.rect(6, gy + 2, 20, 5, st.vest.b);   // 몸통
        P.rect(4, gy + 3, 4, 4, st.pants.b);   // 다리쪽
        P.rect(2, gy + 4, 3, 3, st.shoe.b);
        P.rect(25, gy, 6, 6, st.skin.b);       // 머리
        P.rect(25, gy, 6, 2, st.hair.b);
        P.px(27, gy + 3, OUTLINE); P.px(29, gy + 3, OUTLINE);
        P.rect(12, gy + 1, 8, 2, st.vest.d);   // 팔
      }
      autoOutline(cell, OUTLINE);
      // 흩날리는 서류
      for (let i = 0; i < 5 + f * 2; i++) {
        const px2 = 6 + rng() * 50, py2 = 8 + rng() * (30 + f * 12);
        cell.rect(px2, py2, 5, 4, '#f4f6fb');
        cell.hline(px2 + 1, py2 + 1, 3, '#b9c2d4');
        cell.hline(px2 + 1, py2 + 2, 2, '#b9c2d4');
      }
      sheet.blit(cell, f * FW, 0);
    }
    savePNG(sheet, 'player/rescaper_player_death_sheet.png');
  }
}

// ============================================================
// P3: 일반 몬스터 8종 — 오피스 크리처 (3프레임)
// ============================================================
function monsterSheet(key, gw, gh, drawFn) {
  const U = 2;
  const sheet = new Surface(gw * U * 3, gh * U);
  for (let f = 0; f < 3; f++) {
    const cell = new Surface(gw * U, gh * U);
    drawFn(painter(cell, U), f, cell);
    autoOutline(cell, OUTLINE);
    rimLight(cell, 0.18);
    sheet.blit(cell, f * gw * U, 0);
  }
  savePNG(sheet, `monsters/rescaper_${key}_anim.png`);
}

function generateMonsterAssets() {
  console.log('\n👾 P3: 오피스 크리처 8종 생성');

  // 서류 고블린 — 넥타이 맨 초록 그렘린, 서류뭉치 들고 다님
  monsterSheet('goblin', 32, 32, (P, f) => {
    const g = ramp('#5da24e');
    const bob = f === 1 ? 1 : 0;
    P.rect(9, 8 + bob, 15, 8, g.b);                     // 머리
    P.rect(9, 8 + bob, 15, 2, g.l);
    P.px(7, 9 + bob, g.b); P.px(25, 9 + bob, g.b);      // 귀
    P.px(6, 8 + bob, g.d); P.px(26, 8 + bob, g.d);
    const ec = f === 2 ? '#ff5b4d' : '#ffe14d';
    P.rect(12, 11 + bob, 3, 2, ec); P.rect(19, 11 + bob, 3, 2, ec);
    P.px(12, 11 + bob, '#fff'); P.px(19, 11 + bob, '#fff');
    P.hline(13, 14 + bob, 7, g.d2);                     // 씩 웃는 입
    P.px(14, 15 + bob, '#fff'); P.px(18, 15 + bob, '#fff'); // 이빨
    P.rect(11, 16 + bob, 11, 9, g.b);                   // 몸
    P.vline(21, 16 + bob, 9, g.d);
    P.hline(13, 16 + bob, 7, '#f4f6fb');                // 셔츠 칼라
    P.vline(16, 17 + bob, 4, '#c0504f');                // 넥타이
    P.px(16, 21 + bob, '#8c3a3a');
    P.rect(6, 18 + bob, 5, 6, '#f4f6fb');               // 서류뭉치
    P.hline(7, 19 + bob, 3, '#8f9ab0'); P.hline(7, 21 + bob, 3, '#8f9ab0');
    const step = f === 1 ? 1 : 0;
    P.rect(12, 25 + bob, 4, 4 - step, g.d);             // 다리
    P.rect(18, 25 + bob, 4, 4, g.d);
    P.rect(11, 28 + bob, 5, 2, ramp('#3a3f52').b);
    P.rect(18, 28 + bob - step, 5, 2, ramp('#3a3f52').b);
  });

  // 클릭베이트 박쥐 — 마우스 커서 얼굴의 보라 박쥐
  monsterSheet('bat', 32, 32, (P, f) => {
    const b = ramp('#7452a8');
    const wingUp = f !== 1;
    const bodyY = 12 + (f === 1 ? 2 : 0);
    // 날개
    if (wingUp) {
      P.line(4, bodyY - 5, 10, bodyY + 2, b.d); P.line(5, bodyY - 5, 10, bodyY + 3, b.b);
      P.rect(4, bodyY - 5, 3, 4, b.b); P.rect(2, bodyY - 3, 3, 3, b.d);
      P.line(27, bodyY - 5, 21, bodyY + 2, b.d); P.line(26, bodyY - 5, 21, bodyY + 3, b.b);
      P.rect(25, bodyY - 5, 3, 4, b.b); P.rect(27, bodyY - 3, 3, 3, b.d);
    } else {
      P.rect(2, bodyY + 2, 8, 4, b.b); P.rect(3, bodyY + 5, 6, 2, b.d);
      P.rect(22, bodyY + 2, 8, 4, b.b); P.rect(23, bodyY + 5, 6, 2, b.d);
    }
    // 몸통
    P.ellipse(16, bodyY + 4, 6, 6, b.b);
    P.ellipse(15, bodyY + 3, 4, 3, b.l);
    P.px(11, bodyY - 1, b.d); P.px(20, bodyY - 1, b.d); // 귀
    const ec = f === 2 ? '#ff5b4d' : '#ffe14d';
    P.rect(13, bodyY + 2, 2, 2, ec); P.rect(18, bodyY + 2, 2, 2, ec);
    // 흰 커서 화살표 (클릭베이트!)
    P.px(15, bodyY + 6, '#fff'); P.rect(15, bodyY + 7, 2, 1, '#fff'); P.rect(15, bodyY + 8, 3, 1, '#fff');
  });

  // 404 개구리 — 초록 개구리, 등에 404 에러 표식
  monsterSheet('frog', 32, 32, (P, f) => {
    const g = ramp('#4fae6b');
    const squat = f === 1 ? 2 : 0;
    P.ellipse(16, 22 + squat / 2, 10, 7 - squat / 2, g.b);           // 몸
    P.ellipse(14, 20 + squat / 2, 7, 4, g.l);
    P.rect(8, 12 + squat, 6, 5, g.b); P.rect(18, 12 + squat, 6, 5, g.b); // 눈두덩
    const ec = f === 2 ? '#ff5b4d' : '#ffffff';
    P.rect(10, 13 + squat, 3, 3, ec); P.rect(20, 13 + squat, 3, 3, ec);
    P.px(11, 14 + squat, '#1d2430'); P.px(21, 14 + squat, '#1d2430');
    P.hline(11, 20 + squat, 10, g.d2);                                // 입
    // 배: "404"
    P.rect(11, 23 + squat, 10, 4, '#e8f3e0');
    P.vline(12, 24 + squat, 2, '#5a7a54'); P.px(13, 25 + squat, '#5a7a54');
    P.rect(15, 24 + squat, 2, 2, '#5a7a54');
    P.vline(18, 24 + squat, 2, '#5a7a54'); P.px(19, 25 + squat, '#5a7a54');
    // 다리
    P.rect(6, 26 + squat, 5, 3, g.d); P.rect(21, 26 + squat, 5, 3, g.d);
    P.hline(5, 28 + squat, 6, g.d2); P.hline(21, 28 + squat, 6, g.d2);
  });

  // 이메일 달팽이 — @ 무늬 껍질 (수신확인 안 한 메일 500통)
  monsterSheet('snail', 32, 32, (P, f) => {
    const sh = ramp('#4a7fc9');
    const bd = ramp('#e0c690');
    const slide = f === 1 ? 1 : 0;
    // 몸통
    P.rect(4 + slide, 22, 22, 6, bd.b);
    P.hline(4 + slide, 22, 22, bd.l);
    P.rect(4 + slide, 16, 4, 7, bd.b);                  // 목
    P.px(3 + slide, 13, bd.b); P.px(7 + slide, 13, bd.b); // 더듬이
    P.vline(3 + slide, 14, 3, bd.d); P.vline(7 + slide, 14, 3, bd.d);
    const ec = f === 2 ? '#ff5b4d' : '#2b2b3a';
    P.px(3 + slide, 12, ec); P.px(7 + slide, 12, ec);
    // 껍질 + @ 무늬
    P.ellipse(18, 16, 9, 9, sh.b);
    P.ellipse(16, 14, 5, 5, sh.l);
    P.ellipse(18, 16, 5, 5, sh.d);
    P.ellipse(18, 16, 3, 3, sh.l2);
    P.px(20, 17, sh.d2); P.vline(21, 14, 4, sh.d2);
    P.hline(4 + slide, 28, 24, mixHex(bd.d, '#8bd9c9', 0.5)); // 점액
  });

  // 커피 슬라임 (64×48) — 쏟아진 아메리카노, 거품 해골 얼굴
  monsterSheet('skull_slime', 32, 24, (P, f) => {
    const c = ramp('#6b4226');
    const wob = f === 1 ? 1 : 0;
    P.ellipse(16, 15 + wob / 2, 13, 8 - wob, c.b);        // 커피 방울 몸체
    P.ellipse(16, 12 + wob, 9, 5, c.l);
    P.px(10, 6 + wob, c.b); P.rect(9, 7 + wob, 3, 3, c.b); // 튀는 방울
    P.px(24, 5 + wob, c.d); P.rect(23, 7 + wob, 2, 2, c.b);
    // 거품 해골 얼굴
    const foam = '#f3ead9';
    P.ellipse(16, 14 + wob, 7, 4, foam);
    const ec = f === 2 ? '#ff5b4d' : c.d2;
    P.rect(12, 13 + wob, 3, 3, ec); P.rect(18, 13 + wob, 3, 3, ec);
    P.rect(15, 16 + wob, 3, 1, c.d2);
    P.px(14, 17 + wob, foam); P.px(16, 17 + wob, foam); P.px(18, 17 + wob, foam);
    P.hline(4, 21, 25, c.d2);                            // 바닥 얼룩
    P.hline(2, 22, 28, c.d + '88');
  });

  // 버그 버섯 — 빨간 에러 램프 갓 + 곤충 더듬이 (버그 리포트의 화신)
  monsterSheet('mushroom', 32, 32, (P, f) => {
    const cap = ramp('#c94540');
    const stem = ramp('#e8ddc8');
    const bob = f === 1 ? 1 : 0;
    // 더듬이 (버그!)
    P.line(12, 5 + bob, 10, 2 + bob, cap.d); P.line(20, 5 + bob, 22, 2 + bob, cap.d);
    P.px(9, 1 + bob, '#ffe14d'); P.px(22, 1 + bob, '#ffe14d');
    // 갓
    P.ellipse(16, 12 + bob, 11, 6, cap.b);
    P.rect(5, 12 + bob, 22, 3, cap.b);
    P.ellipse(13, 10 + bob, 6, 3, cap.l);
    P.rect(9, 9 + bob, 3, 2, '#f3ead9'); P.rect(19, 12 + bob, 3, 2, '#f3ead9'); // 점박이
    P.px(15, 7 + bob, '#f3ead9');
    // 줄기 + 얼굴
    P.rect(11, 15 + bob, 10, 12, stem.b);
    P.vline(19, 15 + bob, 12, stem.d);
    const ec = f === 2 ? '#ff5b4d' : '#2b2b3a';
    P.rect(13, 18 + bob, 2, 3, ec); P.rect(17, 18 + bob, 2, 3, ec);
    P.hline(14, 23 + bob, 4, stem.d);
    // 발
    P.rect(10, 27 + bob, 5, 2, stem.d); P.rect(17, 27 + bob, 5, 2, stem.d);
  });

  // 복합기 골렘 — 프린터 괴수 (용지걸림의 분노)
  monsterSheet('golem', 32, 32, (P, f) => {
    const m = ramp('#8a94a6');
    const dk = ramp('#525c70');
    const stomp = f === 1 ? 1 : 0;
    // 상판 (스캐너 덮개)
    P.rect(7, 6 + stomp, 18, 3, m.l);
    P.hline(7, 6 + stomp, 18, m.l2);
    // 본체
    P.rect(6, 9 + stomp, 20, 13, m.b);
    P.vline(24, 9 + stomp, 13, m.d);
    P.rect(6, 9 + stomp, 2, 13, m.l);
    // 눈 (상태 표시등)
    const ec = f === 2 ? '#ff5b4d' : '#5adfff';
    P.rect(10, 11 + stomp, 4, 3, ec); P.rect(18, 11 + stomp, 4, 3, ec);
    P.px(10, 11 + stomp, '#fff'); P.px(18, 11 + stomp, '#fff');
    // 용지 배출구 (입) — 씹다 만 종이
    P.rect(9, 17 + stomp, 14, 3, dk.d2);
    P.rect(11, 16 + stomp, 7, 2, '#f4f6fb');
    P.hline(12, 16 + stomp, 4, '#b9c2d4');
    // LED 줄
    P.px(8, 15 + stomp, '#6bff8f'); P.px(10, 15 + stomp, '#ffe14d'); P.px(12, 15 + stomp, f === 2 ? '#ff5b4d' : '#6bff8f');
    // 팔
    P.rect(2, 12 + stomp, 4, 8, dk.b); P.rect(26, 12 + stomp, 4, 8, dk.b);
    P.rect(1, 19 + stomp, 5, 3, dk.d); P.rect(26, 19 + stomp, 5, 3, dk.d);
    // 다리 (캐터필러 느낌)
    P.rect(8, 22 + stomp, 7, 7 - stomp, dk.b);
    P.rect(17, 22, 7, 7, dk.b);
    P.hline(8, 28, 7, dk.d2); P.hline(17, 28, 7, dk.d2);
    P.px(10, 25, dk.l); P.px(19, 25, dk.l);
  });

  // 야근 망령 — 카디건 걸친 반투명 유령 (퇴근 못 한 자의 최후)
  monsterSheet('necromancer', 32, 32, (P, f) => {
    const gh = ramp('#8f86b8');
    const cd = ramp('#4a4462');
    const fl = f === 1 ? 1 : 0;
    // 하체 (연기처럼 흩어짐)
    P.rect(10, 20 - fl, 12, 5, cd.b);
    P.px(9, 25 - fl, cd.d); P.px(13, 26 - fl, cd.d); P.px(18, 25 - fl, cd.b); P.px(22, 26 - fl, cd.d);
    P.px(11, 28 - fl, cd.d + 'aa'); P.px(16, 29 - fl, cd.d + 'aa'); P.px(21, 28 - fl, cd.d + 'aa');
    // 카디건 상체
    P.rect(9, 13 - fl, 14, 8, cd.b);
    P.vline(9, 13 - fl, 8, cd.l);
    P.vline(21, 13 - fl, 8, cd.d);
    P.vline(15, 14 - fl, 7, cd.d2); // 단추선
    // 머리 (창백)
    P.rect(10, 5 - fl, 12, 9, gh.b);
    P.rect(10, 5 - fl, 12, 2, gh.l);
    const ec = f === 2 ? '#ff5b4d' : '#c9f6ff';
    P.rect(12, 8 - fl, 3, 3, ec); P.rect(17, 8 - fl, 3, 3, ec);
    P.rect(13, 12 - fl, 6, 1, gh.d); // 허탈한 입
    // 손에 든 미결재 서류
    P.rect(23, 15 - fl, 6, 8, '#f4f6fb');
    P.hline(24, 17 - fl, 4, '#8f9ab0'); P.hline(24, 19 - fl, 4, '#8f9ab0');
    P.rect(23, 15 - fl, 6, 2, '#ff9d9d'); // 반려 도장
    // 사원증 (영혼도 출입증은 필요)
    P.vline(15, 13 - fl, 3, '#ffe14d');
    P.rect(14, 16 - fl, 3, 3, '#f4f6fb');
  });
}

// ============================================================
// P0-B: 보스 7종 (2프레임: 평상/분노)
// ============================================================
function bossSheet(key, gw, gh, drawFn) {
  const U = 2;
  const sheet = new Surface(gw * U * 2, gh * U);
  for (let f = 0; f < 2; f++) {
    const cell = new Surface(gw * U, gh * U);
    drawFn(painter(cell, U), f === 1, cell);
    autoOutline(cell, OUTLINE);
    rimLight(cell, 0.2);
    sheet.blit(cell, f * gw * U, 0);
  }
  savePNG(sheet, `monsters/rescaper_boss_${key}.png`);
}

function generateBossAssets() {
  console.log('\n💼 P0: 층 보스 7종 생성');

  // B층 주차장 — "차단기 집행관": 주차 차단봉을 휘두르는 경비 로봇
  bossSheet('parking_boss', 32, 40, (P, angry) => {
    const bd = ramp('#3d4b63');
    const ec = angry ? '#ff5b4d' : '#ffd93d';
    // 경광등 머리
    P.rect(12, 2, 8, 4, angry ? ramp('#c94540').b : ramp('#e8a23d').b);
    P.rect(13, 1, 6, 1, angry ? '#ff8f84' : '#ffd98a');
    // 머리 (모니터)
    P.rect(8, 6, 16, 9, bd.b);
    P.rect(8, 6, 2, 9, bd.l);
    P.rect(9, 7, 14, 7, '#161c2c');
    P.rect(11, 9, 3, 3, ec); P.rect(18, 9, 3, 3, ec);
    if (angry) { P.hline(10, 8, 4, ec); P.hline(18, 8, 4, ec); }
    // 몸통 (제복)
    P.rect(7, 15, 18, 13, bd.b);
    P.vline(7, 15, 13, bd.l); P.vline(24, 15, 13, bd.d);
    P.rect(14, 15, 4, 13, bd.d);
    P.px(15, 17, '#ffd93d'); P.px(15, 20, '#ffd93d'); P.px(15, 23, '#ffd93d'); // 단추
    P.rect(9, 16, 4, 2, '#ffd93d'); // 견장
    P.rect(19, 16, 4, 2, '#ffd93d');
    // 차단봉 팔 (줄무늬 바)
    P.rect(24, 17, 3, 4, bd.d);
    if (angry) {
      for (let i = 0; i < 12; i++) P.rect(27, 6 + i * 2, 3, 2, i % 2 ? '#e8493d' : '#f2ead9');
    } else {
      for (let i = 0; i < 3; i++) P.rect(25 + i * 3, 20, 3, 3, i % 2 ? '#e8493d' : '#f2ead9');
    }
    // 왼팔
    P.rect(4, 16, 4, 9, bd.d);
    P.rect(3, 24, 5, 3, bd.d2);
    // 다리
    P.rect(10, 28, 5, 8, bd.d);
    P.rect(17, 28, 5, 8, bd.d);
    P.rect(9, 36, 7, 3, ramp('#23202e').b);
    P.rect(16, 36, 7, 3, ramp('#23202e').b);
  });

  // 1F 로비 — "유결점 게이트": 사원증 게이트 골렘
  bossSheet('lobby_boss', 28, 36, (P, angry) => {
    const m = ramp('#9aa7ba');
    const ec = angry ? '#ff5b4d' : '#5adfff';
    // 게이트 기둥 몸체
    P.rect(4, 6, 8, 24, m.b); P.vline(4, 6, 24, m.l); P.vline(11, 6, 24, m.d);
    P.rect(16, 6, 8, 24, m.b); P.vline(16, 6, 24, m.l); P.vline(23, 6, 24, m.d);
    // CCTV 눈 (상단 브릿지)
    P.rect(6, 2, 16, 5, m.d);
    P.ellipse(14, 4, 3, 2, '#161c2c');
    P.rect(13, 3, 3, 2, ec);
    // 카드 리더기
    P.rect(5, 12, 6, 4, '#161c2c');
    P.rect(6, 13, 4, 2, ec);
    P.rect(17, 12, 6, 4, '#161c2c');
    P.rect(18, 13, 4, 2, angry ? '#ff5b4d' : '#6bff8f');
    // 차단 플랩 (팔)
    if (angry) {
      P.rect(11, 14, 6, 3, '#e8493d');
      P.rect(12, 13, 4, 1, '#ff8f84');
    } else {
      P.rect(11, 16, 3, 2, '#c3cad6');
      P.rect(14, 18, 3, 2, '#c3cad6');
    }
    // 경고 스트라이프 베이스
    for (let i = 0; i < 7; i++) P.rect(2 + i * 4, 30, 4, 3, i % 2 ? '#ffd93d' : '#23283a');
    P.rect(2, 33, 25, 2, m.d2);
  });

  // 3F 회의실 — "5분만더": 시계 얼굴 회의중독자
  bossSheet('conference_boss', 28, 36, (P, angry) => {
    const suit = ramp('#4c5468');
    const ec = angry ? '#ff5b4d' : '#ffe14d';
    // 시계 머리
    P.ellipse(14, 8, 8, 7, '#e8e4da');
    P.ellipse(14, 8, 8, 7, '#00000000');
    P.px(14, 3, '#3a3f52'); P.px(14, 13, '#3a3f52'); P.px(8, 8, '#3a3f52'); P.px(20, 8, '#3a3f52');
    // 시계바늘: 18시(칼퇴각)를 한참 지남
    P.line(14, 8, 14, 4, angry ? '#e8493d' : '#3a3f52');
    P.line(14, 8, 18, 10, '#3a3f52');
    if (angry) { P.rect(9, 5, 3, 1, ec); P.rect(17, 5, 3, 1, ec); }
    // 정장 몸통
    P.rect(6, 15, 16, 12, suit.b);
    P.vline(6, 15, 12, suit.l); P.vline(21, 15, 12, suit.d);
    P.rect(12, 15, 4, 8, '#e8e4da');
    P.vline(14, 15, 6, '#8c5db0'); // 보라 넥타이
    // 팔: 회의록 뭉치 + 마이크
    P.rect(2, 17, 5, 8, suit.d);
    P.rect(1, 24, 6, 5, '#f4f6fb');
    P.hline(2, 26, 4, '#8f9ab0');
    P.rect(21, 17, 5, 7, suit.d);
    P.rect(23, 14, 3, 4, '#2b2b3a'); // 마이크
    P.px(24, 13, ec);
    // 다리
    P.rect(9, 27, 4, 7, suit.d2);
    P.rect(15, 27, 4, 7, suit.d2);
    P.rect(8, 33, 6, 2, '#23202e'); P.rect(15, 33, 6, 2, '#23202e');
  });

  // 5F 서버실 — "스택오버플로우": 서버랙 타이탄
  bossSheet('server_boss', 28, 36, (P, angry) => {
    const rk = ramp('#2a3245');
    const ec = angry ? '#ff5b4d' : '#6bff8f';
    // 랙 본체
    P.rect(5, 3, 18, 28, rk.b);
    P.vline(5, 3, 28, rk.l); P.vline(22, 3, 28, rk.d);
    // 유닛 슬롯 + LED
    for (let i = 0; i < 6; i++) {
      const uy = 5 + i * 4;
      P.rect(7, uy, 14, 3, i === 2 ? '#161c2c' : rk.d);
      P.px(8, uy + 1, (i + (angry ? 1 : 0)) % 3 === 0 ? ec : '#ffd93d');
      P.px(10, uy + 1, (i + 1) % 2 === 0 ? '#5adfff' : ec);
      P.hline(13, uy + 1, 6, rk.d2);
    }
    // 코어 눈
    P.rect(10, 13, 8, 4, '#161c2c');
    P.rect(11, 14, 2, 2, ec); P.rect(15, 14, 2, 2, ec);
    // 케이블 팔
    P.line(4, 10, 1, 16, '#e8a23d'); P.line(1, 16, 3, 22, '#e8a23d');
    P.line(23, 10, 26, 16, '#5adfff'); P.line(26, 16, 24, 22, '#5adfff');
    P.px(3, 23, angry ? ec : '#ffd93d'); P.px(24, 23, angry ? ec : '#5adfff'); // 케이블 스파크
    if (angry) {
      P.px(1, 14, '#ffd93d'); P.px(26, 13, '#ffd93d');
      P.rect(9, 1, 2, 2, '#8f9ab0'); P.rect(17, 0, 2, 2, '#8f9ab0'); // 연기
    }
    // 받침 다리
    P.rect(6, 31, 6, 3, rk.d2);
    P.rect(16, 31, 6, 3, rk.d2);
  });

  // 6F 글리치 — "아몰라안됨": RGB 분리된 손상 휴머노이드
  bossSheet('glitch_boss', 28, 36, (P, angry, cell) => {
    const gb = ramp('#3f3a5c');
    const rng = mulberry32(angry ? 999 : 555);
    // RGB 잔상 (좌우 오프셋)
    P.rect(7, 6, 14, 22, '#ff3b3b55');
    P.rect(9, 6, 14, 22, '#3bb8ff55');
    // 본체
    P.rect(8, 6, 14, 10, gb.b);
    const ec = angry ? '#ff5b4d' : '#7dffde';
    P.rect(10, 9, 3, 3, ec); P.rect(16, 9, 3, 3, ec);
    if (angry) P.rect(10, 13, 9, 2, '#161c2c');
    P.rect(8, 16, 14, 12, gb.d);
    P.vline(8, 16, 12, gb.l);
    // 글리치 블록 노이즈
    for (let i = 0; i < (angry ? 14 : 8); i++) {
      const gx = 2 + Math.floor(rng() * 24), gy = 4 + Math.floor(rng() * 28);
      const gw2 = 2 + Math.floor(rng() * 4);
      const gc = ['#ff3b6b', '#3bffd0', '#ffe14d', gb.l2][Math.floor(rng() * 4)];
      P.rect(gx, gy, gw2, 1, gc);
    }
    // 반쯤 소실된 하체 (스캔라인)
    for (let y = 28; y < 35; y++) {
      if (y % 2 === 0) P.rect(9 + (y % 4 === 0 ? 2 : 0), y, 10, 1, gb.d + 'bb');
    }
    // 떠 있는 분리 조각
    P.rect(2, 10, 3, 3, gb.b); P.rect(24, 18, 3, 2, gb.d);
  });

  // 8F 마케팅 — "ROAS제로": 확성기 머리 세일즈 괴인
  bossSheet('marketing_boss', 28, 36, (P, angry) => {
    const suit = ramp('#b06232');
    const ec = angry ? '#ff5b4d' : '#ffe14d';
    // 확성기 머리
    P.rect(6, 4, 6, 8, ramp('#c3cad6').b);
    for (let i = 0; i < 5; i++) P.rect(12 + i, 3 - (i > 2 ? 1 : 0), 1, 10 + i * 2, ramp('#e8493d').b);
    P.rect(17, 1, 3, 16, ramp('#e8493d').l);
    P.vline(19, 1, 16, ramp('#e8493d').d);
    if (angry) { // 음파
      P.vline(22, 4, 10, '#ffffffaa'); P.vline(24, 2, 14, '#ffffff66'); P.vline(26, 0, 18, '#ffffff33');
    }
    // 몸통 (체크 자켓)
    P.rect(5, 13, 16, 12, suit.b);
    P.vline(5, 13, 12, suit.l); P.vline(20, 13, 12, suit.d);
    for (let y = 14; y < 25; y += 3) P.hline(5, y, 16, suit.d + '66');
    for (let x = 8; x < 21; x += 4) P.vline(x, 13, 12, suit.d + '66');
    P.rect(11, 13, 4, 7, '#f4f6fb');
    // 상승 차트 창 (들고 있는 방패)
    P.rect(1, 15, 8, 8, '#f4f6fb');
    P.hline(1, 15, 8, '#4a90d9');
    P.line(2, 21, 4, 19, '#e8493d'); P.line(4, 19, 5, 20, '#e8493d'); P.line(5, 20, 7, 17, '#e8493d');
    P.px(7, 16, ec);
    // 팔
    P.rect(20, 14, 4, 8, suit.d);
    // 다리
    P.rect(8, 25, 4, 8, ramp('#3f3a4c').b);
    P.rect(14, 25, 4, 8, ramp('#3f3a4c').b);
    P.rect(7, 33, 6, 2, '#23202e'); P.rect(14, 33, 6, 2, '#23202e');
  });

  // 9F 임원실 — "야근 선언자": 모니터 헤드 AI 대표이사
  bossSheet('ceo_boss', 40, 48, (P, angry) => {
    const suit = ramp('#232338');
    const ec = angry ? '#ff5b4d' : '#5adfff';
    // 모니터 머리
    P.rect(11, 2, 18, 13, ramp('#3a3f52').b);
    P.rect(12, 3, 16, 11, '#10141f');
    P.rect(11, 2, 18, 1, ramp('#3a3f52').l);
    // 화면 얼굴: 캔들차트 눈 + 파형 입
    P.rect(15, 6, 2, 4, ec); P.vline(15, 5, 1, ec); P.vline(16, 10, 1, ec);
    P.rect(23, 6, 2, 4, ec); P.vline(23, 10, 1, ec); P.vline(24, 5, 1, ec);
    if (angry) {
      P.hline(14, 12, 12, ec);
      P.px(17, 11, ec); P.px(21, 13, ec);
      P.rect(12, 3, 16, 1, '#ff3b3b44'); // 상단 경고 스캔라인
    } else {
      P.hline(16, 12, 8, ec);
    }
    P.px(27, 4, '#6bff8f'); // 전원 LED
    // 목 스탠드
    P.rect(18, 15, 4, 2, ramp('#3a3f52').d);
    // 정장 몸통 (넓은 어깨)
    P.rect(8, 17, 24, 17, suit.b);
    P.rect(8, 17, 3, 17, suit.l);
    P.rect(29, 17, 3, 17, suit.d);
    P.rect(6, 17, 4, 3, suit.b); P.rect(30, 17, 4, 3, suit.b); // 어깨 패드
    // 와이셔츠 + 붉은 넥타이
    P.rect(17, 17, 6, 10, '#e8e4da');
    P.rect(19, 17, 2, 9, ramp('#c0392b').b);
    P.px(19, 26, ramp('#c0392b').d);
    // 금장 배지 + 포켓치프
    P.px(13, 19, '#ffd93d');
    P.rect(25, 20, 3, 2, '#e8e4da');
    // 팔: 서류가방 / 도장
    P.rect(4, 20, 4, 12, suit.d);
    P.rect(2, 32, 8, 6, ramp('#5c3a24').b); // 서류가방
    P.hline(2, 32, 8, ramp('#5c3a24').l);
    P.rect(5, 31, 2, 1, '#ffd93d');
    P.rect(32, 20, 4, 10, suit.d);
    P.rect(31, 30, 6, 4, ramp('#c0392b').b); // 결재 도장
    P.rect(33, 28, 2, 2, ramp('#5c3a24').b);
    // 다리
    P.rect(13, 34, 6, 11, suit.d);
    P.rect(22, 34, 6, 11, suit.d);
    P.rect(12, 45, 8, 3, '#191722');
    P.rect(21, 45, 8, 3, '#191722');
    // 오라
    if (angry) {
      P.px(6, 8, '#ff5b4d'); P.px(34, 6, '#ff5b4d'); P.px(3, 14, '#ff5b4d99'); P.px(37, 12, '#ff5b4d99');
    }
  });
}

// ============================================================
// P1: 배경 8종 (800×450, 가로 타일링 필수 — 게임에서 2장 이어붙임)
// ============================================================
function bgSurface(drawFn, seed = 1) {
  const W = 800, H = 450;
  const s = new Surface(W, H);
  const P = painter(s, 2); // 400×225 그리드
  drawFn(P, 400, 225, mulberry32(seed), s);
  return s;
}

// 창밖 야경 (창문 내부에 그림)
function drawNightWindow(P, x, y, w, h, rng) {
  P.rect(x, y, w, h, '#141b30');
  for (let i = 0; i < w * h / 14; i++) {
    const bx = x + 1 + Math.floor(rng() * (w - 2));
    const by = y + 2 + Math.floor(rng() * (h - 3));
    P.px(bx, by, rng() < 0.6 ? '#ffd98a' : '#8fd4ff');
  }
  // 달
  P.ellipse(x + w - 5, y + 4, 2, 2, '#f3ead9');
}

function generateBackgrounds() {
  console.log('\n🏢 P1: 오피스 배경 8종 생성 (800×450, 가로 타일링)');

  // ---- 지하주차장 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, 150, '#232c3b');
    P.rect(0, 0, W, 24, '#1a212e');            // 천장
    P.rect(0, 150, W, H - 150, '#1c222e');     // 바닥
    P.hline(0, 150, W, '#2e3a4e');
    // 천장 파이프 + 조명
    P.hline(0, 14, W, '#39455c');
    P.hline(0, 16, W, '#2c3648');
    for (let x = 30; x < W; x += 100) {
      P.rect(x, 22, 22, 3, '#e8e8d8');
      P.rect(x + 2, 25, 18, 1, '#fffbe0');
      // 조명 빛 웅덩이
      P.rect(x - 6, 150, 36, 4, '#39455c');
    }
    // 기둥 (100 간격 → 타일링 OK)
    for (let x = 60; x < W; x += 200) {
      P.rect(x, 24, 18, 126, '#333f54');
      P.vline(x, 24, 126, '#455571');
      P.vline(x + 17, 24, 126, '#232c3b');
      for (let i = 0; i < 4; i++) P.rect(x, 108 + i * 5, 18, 5, i % 2 ? '#ffd93d' : '#23283a');
      P.rect(x + 4, 60, 10, 8, '#e8e14d'); // "B4" 표지판 자리
      P.rect(x + 6, 62, 2, 4, '#23283a'); P.rect(x + 10, 62, 3, 4, '#23283a');
    }
    // 주차된 차 실루엣
    const carColors = ['#3f5064', '#5c4a63', '#3a5a55', '#5f4438'];
    for (let i = 0; i < 4; i++) {
      const cx = 100 + i * 200;
      const cc = carColors[i];
      P.rect(cx, 128, 56, 16, cc);
      P.rect(cx + 8, 118, 36, 12, shade(cc, 1.25));
      P.rect(cx + 12, 120, 13, 8, '#141b30');
      P.rect(cx + 28, 120, 13, 8, '#141b30');
      P.ellipse(cx + 12, 145, 6, 6, '#10141f');
      P.ellipse(cx + 44, 145, 6, 6, '#10141f');
      P.px(cx + 54, 132, '#ffd98a');
    }
    // 바닥 주차선
    for (let x = 90; x < W; x += 200) {
      P.rect(x - 2, 152, 3, 40, '#c3cad655');
      P.rect(x + 74, 152, 3, 40, '#c3cad655');
    }
    P.hline(0, 200, W, '#2e3a4e44');
  }, 41), 'backgrounds/rescaper_bg_office_parking.png');

  // ---- 로비 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, 160, '#d8dde4');
    P.rect(0, 0, W, 20, '#b9c2cf');
    P.rect(0, 160, W, H - 160, '#aab3c0');
    P.hline(0, 160, W, '#8f9aa9');
    // 대형 유리창 (100 간격)
    for (let x = 20; x < W; x += 100) {
      drawNightWindow(P, x, 30, 60, 100, rng);
      P.rect(x, 30, 60, 2, '#8f9aa9'); P.rect(x, 128, 60, 2, '#8f9aa9');
      P.vline(x, 30, 100, '#8f9aa9'); P.vline(x + 59, 30, 100, '#8f9aa9');
      P.vline(x + 29, 30, 100, '#8f9aa966');
    }
    // 리셉션 데스크
    for (let x = 130; x < W; x += 400) {
      P.rect(x, 120, 90, 40, '#5c6a80');
      P.rect(x, 120, 90, 6, '#7b8ba5');
      P.rect(x + 8, 112, 30, 8, '#39455c'); // 로고판
      P.px(x + 12, 115, '#5adfff'); P.rect(x + 16, 114, 18, 3, '#c3cad6');
      P.rect(x + 60, 112, 12, 8, '#e8e4da'); // 모니터
    }
    // 스피드게이트
    for (let x = 300; x < W; x += 400) {
      for (let g = 0; g < 3; g++) {
        P.rect(x + g * 26, 128, 8, 32, '#8f9aa9');
        P.rect(x + g * 26, 128, 8, 4, '#aab6c4');
        P.px(x + g * 26 + 3, 134, g === 1 ? '#ff5b4d' : '#6bff8f');
      }
    }
    // 화분
    for (let x = 60; x < W; x += 200) {
      P.rect(x, 140, 14, 20, '#8a6248');
      P.ellipse(x + 7, 132, 10, 9, '#3e7d4e');
      P.ellipse(x + 4, 128, 5, 5, '#5da24e');
    }
    // 바닥 대리석 반사
    for (let x = 0; x < W; x += 50) P.line(x, 224, x + 20, 162, '#c3cad622');
  }, 42), 'backgrounds/rescaper_bg_office_lobby.png');

  // ---- 일반 사무 플로어 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, 155, '#3a4258');
    P.rect(0, 155, W, H - 155, '#2c3345');
    P.hline(0, 155, W, '#4a5470');
    // 천장 형광등
    P.rect(0, 0, W, 12, '#2e3548');
    for (let x = 20; x < W; x += 80) {
      P.rect(x, 8, 40, 3, '#e8f4ff');
      P.rect(x + 4, 11, 32, 1, '#bfe3ff');
    }
    // 창문 야경
    for (let x = 10; x < W; x += 200) drawNightWindow(P, x, 26, 70, 44, rng);
    // 파티션 + 책상 + 모니터 (100 간격)
    for (let x = 0; x < W; x += 100) {
      // 파티션
      P.rect(x + 4, 96, 80, 60, '#4a5470');
      P.rect(x + 4, 96, 80, 4, '#5d6a8c');
      // 책상
      P.rect(x + 10, 128, 68, 5, '#7a6248');
      P.rect(x + 12, 133, 4, 22, '#5c4a38');
      P.rect(x + 72, 133, 4, 22, '#5c4a38');
      // 듀얼 모니터 (켜져 있음 — 아직 야근 중)
      const mc = ['#5adfff', '#6bff8f', '#ffd98a', '#c9a6ff'][Math.floor(rng() * 4)];
      P.rect(x + 18, 108, 22, 16, '#161c2c');
      P.rect(x + 20, 110, 18, 12, mc + 'cc');
      for (let i = 0; i < 4; i++) P.hline(x + 21, 112 + i * 2, 8 + Math.floor(rng() * 8), '#ffffff55');
      P.rect(x + 44, 110, 18, 14, '#161c2c');
      P.rect(x + 46, 112, 14, 10, shade(mc, 0.8) + 'cc');
      P.rect(x + 26, 124, 4, 4, '#23283a');
      P.rect(x + 50, 124, 4, 4, '#23283a');
      // 의자
      P.rect(x + 30, 138, 18, 4, '#23283a');
      P.rect(x + 36, 142, 4, 12, '#23283a');
      // 커피잔
      P.rect(x + 66, 124, 5, 4, '#e8e4da');
      P.px(x + 71, 125, '#e8e4da');
    }
  }, 43), 'backgrounds/rescaper_bg_office_floor.png');

  // ---- 서버실 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, H, '#0d1420');
    P.rect(0, 170, W, H - 170, '#0a0f18');
    P.hline(0, 170, W, '#1d2b3f');
    // 천장 케이블 트레이
    P.rect(0, 6, W, 4, '#1d2b3f');
    for (let x = 0; x < W; x += 40) P.vline(x + 20, 10, 6, '#2c3f5c');
    // 서버랙 (80 간격)
    for (let x = 10; x < W; x += 80) {
      P.rect(x, 30, 56, 140, '#1a2334');
      P.vline(x, 30, 140, '#2c3f5c');
      P.vline(x + 55, 30, 140, '#0d1420');
      for (let u = 0; u < 13; u++) {
        const uy = 34 + u * 10;
        P.rect(x + 4, uy, 48, 7, u % 4 === 3 ? '#10141f' : '#232f45');
        // LED 클러스터
        for (let l = 0; l < 5; l++) {
          const on = rng();
          const lc = on < 0.5 ? '#2ecc71' : on < 0.75 ? '#5adfff' : on < 0.9 ? '#ffd93d' : '#ff5b4d';
          if (rng() < 0.75) P.px(x + 7 + l * 3, uy + 2, lc);
        }
        P.rect(x + 30, uy + 2, 18, 3, '#161c2c');
        if (rng() < 0.4) P.hline(x + 31, uy + 3, 4 + Math.floor(rng() * 10), '#2ecc7166');
      }
    }
    // 바닥 녹색 글로우 + 타일 라인
    P.rect(0, 170, W, 3, '#2ecc7133');
    for (let x = 0; x < W; x += 50) P.line(x, 224, x + 16, 172, '#1d2b3f66');
    // 늘어진 케이블
    for (let x = 40; x < W; x += 160) {
      P.line(x, 10, x + 12, 30, '#e8a23d88');
      P.line(x + 80, 10, x + 70, 30, '#5adfff66');
    }
  }, 44), 'backgrounds/rescaper_bg_office_server.png');

  // ---- 사내카페 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, 158, '#4a3226');
    P.rect(0, 158, W, H - 158, '#38251b');
    P.hline(0, 158, W, '#5c4030');
    // 벽 나무 패널
    for (let y = 20; y < 158; y += 24) P.hline(0, y, W, '#3e2a1f');
    // 매달린 전구 (66 간격)
    for (let x = 33; x < W; x += 66) {
      P.vline(x, 0, 26, '#241812');
      P.ellipse(x, 30, 3, 4, '#ffd98a');
      P.ellipse(x, 29, 1, 1, '#fff3c9');
      P.rect(x - 8, 158, 17, 3, '#ffd98a22'); // 빛 웅덩이
    }
    // 메뉴 칠판
    for (let x = 50; x < W; x += 400) {
      P.rect(x, 36, 70, 48, '#25301f');
      P.rect(x - 3, 33, 76, 3, '#5c4030');
      P.rect(x - 3, 84, 76, 3, '#5c4030');
      P.hline(x + 8, 46, 30, '#e8e4da'); // "MENU" 흉내 낙서
      P.hline(x + 8, 54, 40, '#c9d4a3');
      P.hline(x + 8, 62, 34, '#c9d4a3');
      P.hline(x + 8, 70, 42, '#e8a23d');
      P.ellipse(x + 58, 50, 5, 5, '#e8e4da'); // 커피잔 그림
    }
    // 카운터 + 에스프레소 머신
    for (let x = 220; x < W; x += 400) {
      P.rect(x, 110, 120, 48, '#5c4030');
      P.rect(x, 110, 120, 6, '#7a5a42');
      P.rect(x, 116, 120, 4, '#4a3226');
      P.rect(x + 14, 88, 36, 22, '#8f9aa9'); // 머신
      P.rect(x + 14, 88, 36, 4, '#aab6c4');
      P.rect(x + 20, 104, 5, 6, '#39455c');
      P.rect(x + 36, 104, 5, 6, '#39455c');
      P.px(x + 44, 92, '#ff5b4d'); P.px(x + 47, 92, '#6bff8f');
      P.rect(x + 70, 98, 8, 12, '#c94540'); // 사이폰/텀블러
      P.rect(x + 86, 102, 20, 8, '#e8e4da'); // 컵 진열
      P.rect(x + 88, 96, 6, 6, '#e8e4da');
    }
    // 스툴
    for (let x = 120; x < W; x += 200) {
      P.rect(x, 138, 22, 5, '#7a5a42');
      P.rect(x + 9, 143, 4, 15, '#3e2a1f');
    }
    // 커피 김 모락모락
    for (let x = 160; x < W; x += 400) {
      P.px(x, 100, '#e8e4da66'); P.px(x + 1, 96, '#e8e4da55'); P.px(x, 92, '#e8e4da44');
    }
  }, 45), 'backgrounds/rescaper_bg_office_cafe.png');

  // ---- 임원실 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, 160, '#221c33');
    P.rect(0, 160, W, H - 160, '#181225');
    P.hline(0, 160, W, '#3a2f57');
    // 벽 패널 + 금장 몰딩
    for (let x = 0; x < W; x += 100) {
      P.rect(x + 6, 16, 88, 132, '#2a2342');
      P.vline(x + 6, 16, 132, '#3a2f57');
      P.rect(x + 6, 16, 88, 2, '#8a6f3a');
    }
    P.hline(0, 12, W, '#c9a84c');
    P.hline(0, 150, W, '#c9a84c');
    // 초대형 야경 창
    for (let x = 30; x < W; x += 200) {
      drawNightWindow(P, x, 30, 120, 100, rng);
      P.rect(x - 2, 28, 124, 2, '#8a6f3a');
      P.rect(x - 2, 130, 124, 2, '#8a6f3a');
      P.vline(x - 2, 28, 104, '#8a6f3a'); P.vline(x + 121, 28, 104, '#8a6f3a');
      // 커튼
      P.rect(x - 8, 30, 8, 100, '#4a1f3d');
      P.rect(x + 120, 30, 8, 100, '#4a1f3d');
      P.vline(x - 6, 30, 100, '#5f2a4e');
      P.vline(x + 122, 30, 100, '#3a1830');
    }
    // 회장 초상화
    for (let x = 170; x < W; x += 400) {
      P.rect(x, 40, 40, 56, '#8a6f3a');
      P.rect(x + 3, 43, 34, 50, '#181225');
      P.rect(x + 12, 52, 16, 12, '#e0c690'); // 얼굴
      P.rect(x + 10, 64, 20, 24, '#232338'); // 정장
      P.rect(x + 18, 64, 4, 12, '#c0392b');
      P.rect(x + 12, 48, 16, 5, '#3a3f52');  // 머리
    }
    // 긴 결재 테이블 + 의자
    for (let x = 260; x < W; x += 400) {
      P.rect(x, 128, 130, 10, '#3d2c20');
      P.rect(x, 128, 130, 3, '#5c4030');
      P.rect(x + 8, 138, 6, 20, '#2a1c14');
      P.rect(x + 116, 138, 6, 20, '#2a1c14');
      for (let c2 = 0; c2 < 4; c2++) {
        P.rect(x + 14 + c2 * 30, 112, 14, 16, '#1d1830');
        P.rect(x + 14 + c2 * 30, 112, 14, 3, '#2e2648');
      }
    }
    // 샹들리에
    for (let x = 100; x < W; x += 200) {
      P.vline(x, 0, 14, '#8a6f3a');
      P.rect(x - 10, 14, 21, 3, '#c9a84c');
      for (let i = 0; i < 5; i++) P.px(x - 8 + i * 4, 18, '#ffe9a3');
    }
    // 바닥 카펫 라인
    P.rect(0, 176, W, 30, '#3a1f35');
    P.hline(0, 176, W, '#5f2a4e');
    P.hline(0, 205, W, '#5f2a4e');
  }, 46), 'backgrounds/rescaper_bg_office_executive.png');

  // ---- 글리치 (QA/AI) ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, H, '#0c0a14');
    // 손상된 사무 플로어 잔상
    for (let x = 0; x < W; x += 100) {
      P.rect(x + 10, 100, 70, 56, '#1d1830aa');
      P.rect(x + 16, 112, 20, 14, '#161c2c');
      P.rect(x + 18, 114, 16, 10, '#ff3b6b44');
      P.rect(x + 44, 112, 20, 14, '#161c2c');
      P.rect(x + 46, 114, 16, 10, '#3bffd033');
    }
    P.rect(0, 156, W, H - 156, '#120e1d');
    P.hline(0, 156, W, '#ff3b6b55');
    // 에러 팝업 창
    for (let x = 40; x < W; x += 160) {
      const py = 30 + (x % 320 === 40 ? 0 : 24);
      P.rect(x, py, 56, 36, '#1d2438');
      P.rect(x, py, 56, 7, '#8c1f2d');
      P.px(x + 51, py + 2, '#fff'); P.px(x + 53, py + 4, '#fff'); P.px(x + 53, py + 2, '#fff'); P.px(x + 51, py + 4, '#fff');
      P.rect(x + 6, py + 12, 10, 10, '#ffd93d'); // ⚠
      P.px(x + 11, py + 14, '#161c2c'); P.px(x + 11, py + 16, '#161c2c'); P.px(x + 11, py + 19, '#161c2c');
      P.hline(x + 20, py + 14, 28, '#8f9ab0');
      P.hline(x + 20, py + 18, 22, '#8f9ab0');
      P.rect(x + 18, py + 26, 20, 6, '#39455c');
    }
    // 글리치 스캔 블록
    for (let i = 0; i < 90; i++) {
      const gx = Math.floor(rng() * 400), gy = Math.floor(rng() * 225);
      const gw2 = 3 + Math.floor(rng() * 20);
      const gc = ['#ff3b6b', '#3bffd0', '#ffe14d', '#7452a8', '#ffffff'][Math.floor(rng() * 5)];
      P.rect(Math.min(gx, 400 - gw2), gy, gw2, rng() < 0.3 ? 2 : 1, gc + (rng() < 0.5 ? '55' : '99'));
    }
    // 대형 404 잔상
    for (let x = 90; x < W; x += 200) {
      const fy = 70;
      P.vline(x, fy, 10, '#ff3b6b77'); P.hline(x, fy + 6, 6, '#ff3b6b77'); P.vline(x + 6, fy, 16, '#ff3b6b77');
      P.rect(x + 10, fy + 4, 8, 10, '#3bffd000');
      P.vline(x + 10, fy + 4, 10, '#3bffd077'); P.vline(x + 17, fy + 4, 10, '#3bffd077');
      P.hline(x + 10, fy + 4, 8, '#3bffd077'); P.hline(x + 10, fy + 13, 8, '#3bffd077');
      P.vline(x + 21, fy, 10, '#ffe14d77'); P.hline(x + 21, fy + 6, 6, '#ffe14d77'); P.vline(x + 27, fy, 16, '#ffe14d77');
    }
    // 수평 티어링 라인
    for (let y = 10; y < 225; y += 34) P.hline(0, y, 400, '#ffffff11');
  }, 47), 'backgrounds/rescaper_bg_office_glitch.png');

  // ---- 마케팅 ----
  savePNG(bgSurface((P, W, H, rng) => {
    P.rect(0, 0, W, 156, '#e8ddc8');
    P.rect(0, 0, W, 14, '#d4c8ae');
    P.rect(0, 156, W, H - 156, '#c9b995');
    P.hline(0, 156, W, '#a8956e');
    // 배너 현수막 (200 간격)
    for (let x = 20; x < W; x += 200) {
      P.rect(x, 20, 64, 30, '#e8493d');
      P.rect(x, 20, 64, 4, '#c93a30');
      P.hline(x + 8, 30, 48, '#fff');
      P.hline(x + 8, 38, 34, '#ffd98a');
      P.px(x + 2, 50, '#c93a30'); P.px(x + 61, 50, '#c93a30');
    }
    // 상승 차트 대형 스크린
    for (let x = 120; x < W; x += 200) {
      P.rect(x, 60, 70, 44, '#161c2c');
      P.rect(x + 3, 63, 64, 38, '#1d2b3f');
      P.line(x + 8, 94, x + 22, 82, '#6bff8f');
      P.line(x + 22, 82, x + 34, 88, '#6bff8f');
      P.line(x + 34, 88, x + 60, 68, '#6bff8f');
      P.px(x + 60, 67, '#fff');
      for (let b = 0; b < 5; b++) P.rect(x + 10 + b * 11, 96 - b * 4, 6, b * 4 + 2, '#4a90d9aa');
    }
    // 칸반 보드
    for (let x = 40; x < W; x += 200) {
      P.rect(x, 108, 56, 40, '#f4f6fb');
      P.rect(x, 108, 56, 5, '#8f9ab0');
      for (let c2 = 0; c2 < 3; c2++) {
        P.vline(x + 18 + c2 * 18, 113, 35, '#c3cad6');
        for (let n = 0; n < 3; n++) {
          const nc = ['#ffe14d', '#9dffb0', '#ffb3c1', '#a3d9ff'][Math.floor(rng() * 4)];
          P.rect(x + 3 + c2 * 18, 116 + n * 10, 12, 7, nc);
        }
      }
    }
    // 풍선
    for (let x = 160; x < W; x += 200) {
      P.ellipse(x, 30, 6, 8, '#ff7ba6');
      P.ellipse(x - 2, 27, 2, 3, '#ffc1d6');
      P.line(x, 38, x - 2, 56, '#8f9ab0');
      P.ellipse(x + 14, 36, 6, 8, '#4a90d9');
      P.ellipse(x + 12, 33, 2, 3, '#a3d9ff');
      P.line(x + 14, 44, x + 16, 60, '#8f9ab0');
    }
    // 바닥 스포트라이트
    for (let x = 50; x < W; x += 100) P.rect(x, 158, 30, 3, '#fff3c955');
  }, 48), 'backgrounds/rescaper_bg_office_marketing.png');
}

// ============================================================
// P2-A: 타일 9종 (24×24) + 엘리베이터 게이트
// ============================================================
function tileSurface(drawFn, seed = 1) {
  const s = new Surface(24, 24);
  drawFn(s, mulberry32(seed));
  return s;
}

function generateTiles() {
  console.log('\n🧱 P2: 바닥 타일 9종 생성 (24×24)');

  // 콘크리트 — 골재 스펙클 + 크랙
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#6e7687');
    s.rect(0, 0, 24, 24, c.b);
    s.dither(0, 0, 24, 24, c.d, 0.12, rng);
    s.dither(0, 0, 24, 24, c.l, 0.08, rng);
    s.hline(0, 0, 24, c.l2); s.hline(0, 1, 24, c.l);
    s.hline(0, 23, 24, c.d2);
    s.line(4, 8, 9, 14, c.d2); s.line(9, 14, 8, 19, c.d2);
    s.line(17, 3, 15, 9, c.d2 + '99');
    s.px(20, 18, c.d2); s.px(5, 21, c.d2);
  }, 11), 'tiles/rescaper_tile_concrete.png');

  // 대리석 — 사선 베인
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#dfe4ea');
    s.rect(0, 0, 24, 24, c.b);
    s.hline(0, 0, 24, '#ffffff');
    s.hline(0, 23, 24, c.d);
    s.vline(23, 0, 24, c.d + '88');
    s.line(2, 20, 12, 4, '#b9c2cf');
    s.line(3, 21, 13, 5, '#cdd5df');
    s.line(14, 22, 22, 10, '#b9c2cf99');
    s.line(18, 2, 21, 7, '#c3ccd8');
    s.dither(0, 0, 24, 24, '#ffffff', 0.05, rng);
  }, 12), 'tiles/rescaper_tile_marble.png');

  // 카펫 — 직조 디더
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#b0603a');
    s.rect(0, 0, 24, 24, c.b);
    s.checker(0, 0, 24, 24, c.d);
    for (let y = 0; y < 24; y += 6) for (let x = 0; x < 24; x += 6)
      if ((x + y) % 12 === 0) s.px(x + 2, y + 2, c.l);
    s.hline(0, 0, 24, c.l);
    s.hline(0, 23, 24, c.d2);
  }, 13), 'tiles/rescaper_tile_carpet.png');

  // 금속판 — 리벳 + 브러시드
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#4c5670');
    s.rect(0, 0, 24, 24, c.b);
    for (let y = 2; y < 24; y += 3) s.hline(0, y, 24, c.d + '55');
    s.hline(0, 0, 24, c.l2); s.hline(0, 1, 24, c.l);
    s.hline(0, 23, 24, c.d2);
    s.px(2, 3, c.l2); s.px(21, 3, c.l2); s.px(2, 20, c.l2); s.px(21, 20, c.l2);
    s.px(3, 4, c.d2); s.px(22, 4, c.d2); s.px(3, 21, c.d2); s.px(22, 21, c.d2);
    s.line(10, 10, 14, 14, c.l + '66');
  }, 14), 'tiles/rescaper_tile_metallic.png');

  // 원목 — 플랭크 + 나뭇결
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#8a5a36');
    s.rect(0, 0, 24, 24, c.b);
    s.hline(0, 0, 24, c.l);
    s.hline(0, 11, 24, c.d2);
    s.hline(0, 12, 24, c.l + '88');
    s.hline(0, 23, 24, c.d2);
    s.vline(7, 0, 11, c.d2 + 'aa');
    s.vline(17, 12, 12, c.d2 + 'aa');
    for (let i = 0; i < 5; i++) s.hline(2 + i * 4, 3 + i * 4, 6 + (i % 3) * 4, c.d + '77');
    s.ellipse(12, 6, 2, 1, c.d);
    s.px(12, 6, c.d2);
  }, 15), 'tiles/rescaper_tile_wood.png');

  // 럭셔리 — 다크 퍼플 + 금 다이아 인레이
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#4a2f63');
    const gold = '#c9a84c';
    s.rect(0, 0, 24, 24, c.b);
    s.hline(0, 0, 24, c.l);
    s.hline(0, 23, 24, c.d2);
    s.line(11, 4, 18, 11, gold); s.line(18, 11, 11, 18, gold);
    s.line(11, 18, 4, 11, gold); s.line(4, 11, 11, 4, gold);
    s.px(11, 11, '#ffe9a3');
    s.px(0, 0, gold); s.px(23, 0, gold); s.px(0, 23, gold); s.px(23, 23, gold);
    s.dither(0, 0, 24, 24, c.l, 0.05, rng);
  }, 16), 'tiles/rescaper_tile_luxury.png');

  // 테크 — 회로 트레이스
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#1d2b45');
    const tr = '#3f6f9e';
    s.rect(0, 0, 24, 24, c.b);
    s.hline(0, 0, 24, c.l);
    s.hline(0, 23, 24, c.d2);
    s.hline(2, 6, 10, tr); s.vline(12, 6, 8, tr); s.hline(12, 14, 8, tr);
    s.vline(5, 10, 10, tr + 'aa'); s.hline(5, 20, 12, tr + 'aa');
    s.px(2, 6, '#5adfff'); s.px(20, 14, '#5adfff'); s.px(17, 20, '#6bff8f');
    s.rect(18, 4, 4, 4, c.d);
    s.rect(19, 5, 2, 2, '#5adfff88');
  }, 17), 'tiles/rescaper_tile_tech.png');

  // 브라이트 — 밝은 오피스 타일 + 광택
  savePNG(tileSurface((s, rng) => {
    const c = ramp('#e0b93d');
    s.rect(0, 0, 24, 24, c.b);
    s.hline(0, 0, 24, c.l2);
    s.hline(0, 23, 24, c.d);
    s.vline(0, 0, 24, c.l);
    s.vline(23, 0, 24, c.d);
    s.line(4, 8, 10, 2, '#fff3c9');
    s.line(6, 10, 14, 2, '#fff3c977');
    s.dither(0, 12, 24, 12, c.d, 0.06, rng);
  }, 18), 'tiles/rescaper_tile_bright.png');

  // stoneMid 별칭용 콘크리트는 동일 파일 사용 (data-config에서 concrete 매핑)

  // 엘리베이터 게이트 (32×48 ×2: 닫힘/열림)
  {
    const s = new Surface(64, 48);
    const m = ramp('#5c6a80');
    // 닫힌 문
    s.rect(0, 0, 32, 48, m.d2);
    s.rect(1, 1, 30, 46, m.b);
    s.rect(2, 2, 13, 44, m.l);
    s.rect(17, 2, 13, 44, m.l);
    s.vline(15, 2, 44, m.d2); s.vline(16, 2, 44, m.d2);
    s.rect(12, 20, 3, 6, m.d); s.rect(17, 20, 3, 6, m.d);
    s.rect(13, 0, 6, 2, '#ffd93d'); // 층 표시
    // 열린 문 (어두운 내부 + 빛)
    s.rect(32, 0, 32, 48, m.d2);
    s.rect(33, 1, 30, 46, '#10141f');
    s.rect(33, 1, 4, 46, m.b);
    s.rect(59, 1, 4, 46, m.b);
    s.rect(40, 6, 16, 36, '#1d2438');
    s.vline(47, 6, 36, '#ffd93d44');
    s.rect(45, 0, 6, 2, '#6bff8f');
    savePNG(s, 'tiles/rescaper_elevator_gate.png');
  }
}

// ============================================================
// P2-B: UI — 스킬 아이콘 12종 + 아이템 6종 + 프레임 + 전환
// ============================================================
function iconSurface(bgColor, drawFn) {
  const s = new Surface(24, 24);
  const bg = ramp(bgColor);
  // 라운드 사각 배경
  s.rect(1, 1, 22, 22, bg.d);
  s.rect(2, 2, 20, 20, bg.b);
  s.rect(2, 2, 20, 3, bg.l);
  s.px(1, 1, '#00000000'); s.px(22, 1, '#00000000'); s.px(1, 22, '#00000000'); s.px(22, 22, '#00000000');
  drawFn(s);
  autoOutline(s, OUTLINE);
  return s;
}

function generateUIAssets() {
  console.log('\n🎨 P2: UI 아이콘/프레임 생성');

  const skillIcons = {
    power: ['#8c2f2f', s => { // 주먹
      s.rect(8, 9, 9, 7, '#f0c8a0');
      s.rect(8, 9, 9, 2, '#ffe0bd');
      for (let i = 0; i < 4; i++) s.vline(9 + i * 2, 9, 2, '#c99b74');
      s.rect(6, 11, 3, 4, '#f0c8a0');
      s.px(17, 8, '#fff'); s.px(19, 6, '#ffd93d'); s.px(18, 12, '#ffd93d');
    }],
    vital: ['#8c4a5c', s => { // 하트
      s.rect(7, 8, 4, 3, '#ff5b6e'); s.rect(13, 8, 4, 3, '#ff5b6e');
      s.rect(6, 10, 12, 4, '#ff5b6e');
      s.rect(8, 14, 8, 2, '#e0384f'); s.rect(10, 16, 4, 2, '#c22740');
      s.px(11, 18, '#c22740'); s.px(12, 18, '#c22740');
      s.rect(8, 9, 2, 2, '#ffb3c1');
    }],
    swift: ['#2f6a8c', s => { // 날개 달린 부츠
      s.rect(9, 7, 5, 9, '#5d9cec');
      s.rect(9, 14, 9, 4, '#5d9cec');
      s.rect(9, 16, 9, 2, '#3a6fb8');
      s.hline(9, 18, 10, '#e8f4ff');
      s.hline(4, 8, 5, '#fff'); s.hline(5, 10, 4, '#dbe9ff'); s.hline(6, 12, 3, '#fff');
    }],
    blade: ['#6a6f8c', s => { // 교차 슬래시
      s.line(6, 17, 16, 5, '#e8f4ff'); s.line(7, 18, 17, 6, '#8fb8e8');
      s.line(17, 17, 8, 6, '#fff'); s.line(18, 16, 9, 5, '#c9dcf5');
      s.px(6, 5, '#fff'); s.px(18, 18, '#fff');
    }],
    dash: ['#3d6a4f', s => { // 더블 셰브런
      for (let i = 0; i < 5; i++) {
        s.px(6 + i, 7 + i, '#9dffb0'); s.px(6 + i, 15 - i, '#9dffb0');
        s.px(7 + i, 7 + i, '#6bff8f'); s.px(7 + i, 15 - i, '#6bff8f');
        s.px(12 + i, 7 + i, '#e2ffe8'); s.px(12 + i, 15 - i, '#e2ffe8');
        s.px(13 + i, 7 + i, '#9dffb0'); s.px(13 + i, 15 - i, '#9dffb0');
      }
    }],
    leech: ['#6e2438', s => { // 핏방울
      s.px(11, 5, '#ff5b6e'); s.px(12, 5, '#ff5b6e');
      s.rect(10, 7, 4, 3, '#ff5b6e');
      s.rect(9, 9, 6, 6, '#e0384f');
      s.rect(10, 15, 4, 2, '#c22740');
      s.rect(10, 8, 2, 3, '#ffb3c1');
      s.px(16, 17, '#ff5b6e'); s.px(17, 19, '#e0384f');
    }],
    crit: ['#8c6a2f', s => { // 크로스헤어
      s.hline(7, 12, 3, '#ffd93d'); s.hline(15, 12, 3, '#ffd93d');
      s.vline(12, 5, 3, '#ffd93d'); s.vline(12, 17, 3, '#ffd93d');
      s.hline(9, 8, 7, '#ffe9a3'); s.hline(9, 16, 7, '#ffe9a3');
      s.vline(8, 9, 7, '#ffe9a3'); s.vline(16, 9, 7, '#ffe9a3');
      s.px(12, 12, '#ff5b4d'); s.px(11, 12, '#ff8f84'); s.px(13, 12, '#ff8f84');
      s.px(12, 11, '#ff8f84'); s.px(12, 13, '#ff8f84');
    }],
    critdmg: ['#8c3d2f', s => { // 폭발 스타버스트
      s.line(12, 4, 12, 20, '#ffd93d');
      s.line(4, 12, 20, 12, '#ffd93d');
      s.line(6, 6, 18, 18, '#ff8f4d');
      s.line(18, 6, 6, 18, '#ff8f4d');
      s.rect(10, 10, 5, 5, '#fff');
      s.rect(11, 11, 3, 3, '#ffe14d');
      s.px(12, 12, '#ff5b4d');
    }],
    guard: ['#2f4a6a', s => { // 방패
      s.rect(8, 6, 9, 3, '#8fb8e8');
      s.rect(7, 8, 11, 6, '#5d9cec');
      s.rect(8, 14, 9, 2, '#3a6fb8');
      s.rect(9, 16, 7, 2, '#2c5590');
      s.rect(11, 18, 3, 2, '#234677');
      s.vline(12, 7, 12, '#dbe9ff');
      s.hline(8, 10, 9, '#dbe9ff66');
    }],
    regen: ['#2f6a4a', s => { // 하트 + 십자
      s.rect(7, 8, 4, 2, '#6bd48f'); s.rect(13, 8, 4, 2, '#6bd48f');
      s.rect(6, 10, 12, 4, '#6bd48f');
      s.rect(8, 14, 8, 2, '#4aa86b'); s.rect(10, 16, 4, 2, '#3d8c58');
      s.vline(11, 9, 6, '#fff'); s.vline(12, 9, 6, '#fff');
      s.hline(9, 11, 6, '#fff'); s.hline(9, 12, 6, '#fff');
    }],
    reach: ['#6a5a2f', s => { // 양방향 화살
      s.hline(5, 12, 15, '#ffd98a');
      s.hline(5, 11, 15, '#e8b56a');
      for (let i = 0; i < 4; i++) {
        s.px(5 + i, 8 + i, '#ffd98a'); s.px(5 + i, 15 - i, '#ffd98a');
        s.px(19 - i, 8 + i, '#ffd98a'); s.px(19 - i, 15 - i, '#ffd98a');
      }
    }],
    execute: ['#4a2438', s => { // 해골
      s.rect(8, 6, 9, 8, '#f3ead9');
      s.rect(9, 5, 7, 1, '#f3ead9');
      s.rect(9, 14, 7, 3, '#e0d4bd');
      s.rect(10, 9, 2, 3, '#4a2438'); s.rect(14, 9, 2, 3, '#4a2438');
      s.px(10, 9, '#ff5b4d'); s.px(14, 9, '#ff5b4d');
      s.px(12, 12, '#8f7d68'); s.px(13, 12, '#8f7d68');
      s.px(10, 15, '#8f7d68'); s.px(12, 15, '#8f7d68'); s.px(14, 15, '#8f7d68');
      s.px(11, 16, '#f3ead9'); s.px(13, 16, '#f3ead9');
    }],
  };

  for (const [key, [bg, fn]] of Object.entries(skillIcons)) {
    savePNG(iconSurface(bg, fn), `ui/rescaper_skill_${key}.png`);
  }

  const itemIcons = {
    energy_drink: ['#1d3a4a', s => { // 에너지 드링크 캔
      s.rect(9, 6, 7, 13, '#2fc98c');
      s.rect(9, 6, 7, 2, '#8fe8c4');
      s.rect(9, 17, 7, 2, '#1d8c5e');
      s.rect(10, 4, 5, 2, '#c3cad6');
      s.px(12, 3, '#8f9ab0');
      s.line(13, 8, 11, 12, '#ffe14d'); s.line(11, 12, 14, 12, '#ffe14d'); s.line(14, 12, 12, 16, '#ffe14d');
    }],
    overtime_coin: ['#4a3a1d', s => { // 야근수당 동전
      s.ellipse(12, 12, 7, 7, '#e8b93d');
      s.ellipse(12, 12, 5, 5, '#ffd95e');
      s.ellipse(10, 10, 2, 2, '#fff3c9');
      // ₩ 글자
      s.line(10, 9, 11, 15, '#8c6a1d'); s.line(12, 9, 12, 15, '#8c6a1d'); s.line(14, 9, 13, 15, '#8c6a1d');
      s.hline(9, 11, 7, '#8c6a1d'); s.hline(9, 13, 7, '#8c6a1d');
    }],
    keyboard_weapon: ['#2a2a3d', s => { // 기계식 키보드
      s.rect(4, 9, 16, 7, '#3a3a4a');
      s.rect(4, 9, 16, 1, '#5a5a70');
      s.rect(4, 15, 16, 1, '#23232e');
      const kc = ['#ff6b6b', '#ffd93d', '#6bff8f', '#6bc5ff', '#c86bff', '#ff9d6b'];
      for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++)
        s.rect(5 + i * 2.5 | 0, 10 + r * 3, 2, 2, kc[(i + r) % 6]);
      s.hline(4, 17, 16, '#9dd6ff66');
    }],
    artifact: ['#3a2a4a', s => { // 반도체 칩 아티팩트
      s.rect(8, 8, 9, 9, '#2fa88c');
      s.rect(9, 9, 7, 7, '#161c2c');
      s.rect(11, 11, 3, 3, '#7dffde');
      s.px(12, 12, '#fff');
      for (let i = 0; i < 3; i++) {
        s.px(6, 9 + i * 3, '#c9a84c'); s.px(18, 9 + i * 3, '#c9a84c');
        s.px(9 + i * 3, 6, '#c9a84c'); s.px(9 + i * 3, 18, '#c9a84c');
      }
    }],
    buff_up: ['#1d4a2e', s => { // 상승 화살표
      for (let i = 0; i < 6; i++) s.hline(12 - i, 6 + i, i * 2 + 1, '#6bff8f');
      s.rect(10, 12, 5, 7, '#4aa86b');
      s.rect(11, 12, 3, 7, '#6bff8f');
      s.px(12, 7, '#e2ffe8');
    }],
    debuff_down: ['#4a1d24', s => { // 하락 화살표
      s.rect(10, 5, 5, 7, '#c22740');
      s.rect(11, 5, 3, 7, '#ff5b6e');
      for (let i = 0; i < 6; i++) s.hline(12 - i, 17 - i + 1, i * 2 + 1, '#ff5b6e');
      s.px(12, 17, '#ffb3c1');
    }],
  };

  for (const [key, [bg, fn]] of Object.entries(itemIcons)) {
    savePNG(iconSurface(bg, fn), `ui/rescaper_item_${key}.png`);
  }

  // UI 프레임 (200×160) — 사원증 스타일 패널
  {
    const s = new Surface(200, 160);
    s.rect(4, 4, 192, 152, '#141828ee');
    s.rect(4, 4, 192, 24, '#1d2438ee');
    s.hline(4, 28, 192, '#c9a84c');
    // 이중 테두리
    s.outlineRect(4, 4, 192, 152, '#c9a84c');
    s.outlineRect(6, 6, 188, 148, '#8a6f3a');
    // 코너 악센트
    for (const [cx, cy] of [[4, 4], [193, 4], [4, 153], [193, 153]]) {
      s.rect(cx - 1, cy - 1, 4, 4, '#ffe9a3');
    }
    // 헤더 사원증 홀 + 스트라이프
    s.rect(94, 8, 12, 4, '#0c0f1c');
    s.rect(96, 9, 8, 2, '#39455c');
    savePNG(s, 'ui/rescaper_ui_frame.png');
  }

  // 층간 전환 (800×450) — 엘리베이터 문
  {
    const s = new Surface(800, 450);
    const P = painter(s, 2);
    const m = ramp('#39455c');
    P.rect(0, 0, 400, 225, m.d2);
    // 좌우 문짝 (브러시드 메탈)
    P.rect(4, 8, 192, 217, m.b);
    P.rect(204, 8, 192, 217, m.b);
    for (let y = 12; y < 220; y += 4) {
      P.hline(6, y, 188, m.d + '44');
      P.hline(206, y, 188, m.d + '44');
    }
    P.rect(4, 8, 6, 217, m.l);
    P.rect(390, 8, 6, 217, m.d);
    P.vline(196, 8, 217, m.d2); P.vline(197, 8, 217, '#0c0f1c'); P.vline(198, 8, 217, '#0c0f1c');
    P.vline(199, 8, 217, m.d2);
    P.vline(200, 8, 217, m.d2); P.vline(201, 8, 217, '#0c0f1c'); P.vline(202, 8, 217, '#0c0f1c');
    P.vline(203, 8, 217, m.d2);
    // 문 패널 홈
    P.rect(30, 30, 140, 170, m.d + '33');
    P.rect(230, 30, 140, 170, m.d + '33');
    // 상단 층 표시기
    P.rect(160, 0, 80, 8, '#10141f');
    P.px(180, 3, '#ff5b4d');
    P.rect(190, 2, 8, 4, '#ffd93d');
    P.rect(204, 2, 8, 4, '#ffd93d33');
    P.px(220, 3, '#6bff8f');
    // 호출 버튼
    P.rect(196, 110, 8, 16, '#161c2c');
    P.ellipse(200, 114, 2, 2, '#ffd93d');
    P.ellipse(200, 121, 2, 2, '#5adfff');
    savePNG(s, 'ui/rescaper_transition_elevator.png');
  }
}

// ============================================================
// 컨택트시트
// ============================================================
function composeContactSheet(outPath) {
  const PAD = 8, SCALE = Number(process.env.PREVIEW_SCALE || 1), COLS = 4;
  const cellW = Math.max(...SHEET_ENTRIES.map(e => e.surf.w)) + PAD;
  // 그룹별 간단 그리드 (원본 크기 그대로, 큰 배경은 축소 없이)
  let x = PAD, y = PAD, rowH = 0, maxW = 1680;
  const placements = [];
  for (const e of SHEET_ENTRIES) {
    const w = e.surf.w * SCALE, h = e.surf.h * SCALE;
    if (x + w + PAD > maxW) { x = PAD; y += rowH + PAD + 12; rowH = 0; }
    placements.push({ e, x, y });
    x += w + PAD;
    rowH = Math.max(rowH, h);
  }
  const totalH = y + rowH + PAD;
  const sheet = new Surface(maxW, totalH);
  sheet.rect(0, 0, maxW, totalH, '#262b38');
  for (let yy = 0; yy < totalH; yy += 16) for (let xx = 0; xx < maxW; xx += 16)
    if (((xx + yy) / 16) % 2 === 0) sheet.rect(xx, yy, 16, 16, '#2b3140');
  for (const p of placements) sheet.blit(p.e.surf, p.x, p.y, SCALE);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, encodePNG(sheet));
  console.log(`\n🖼  컨택트시트: ${outPath} (${maxW}×${totalH})`);
}

// ============================================================
// main
// ============================================================
function main() {
  const args = process.argv.slice(2);
  const cat = args.find(a => !a.startsWith('--')) || 'all';
  const previewArg = args.find(a => a.startsWith('--preview'));

  const tasks = {
    player: generatePlayerAssets,
    monsters: generateMonsterAssets,
    boss: generateBossAssets,
    backgrounds: generateBackgrounds,
    tiles: generateTiles,
    ui: generateUIAssets,
  };

  if (cat === 'all') Object.values(tasks).forEach(fn => fn());
  else if (tasks[cat]) tasks[cat]();
  else { console.error(`알 수 없는 카테고리: ${cat}`); process.exit(1); }

  if (previewArg) {
    const p = previewArg.includes('=') ? previewArg.split('=')[1] : path.join(__dirname, '.preview', 'contact-sheet.png');
    composeContactSheet(p);
  }
  console.log('\n✅ 에셋 생성 완료!');
}

main();
