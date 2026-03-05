import { RescapeRConfig as Config } from './data-config.js';
import { RescapeRUtils as Utils } from './utils.js';

// ============================================
// SPRITE DATA
// ============================================
const PLAYER_SPRITE = {
  idle: [[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0,0],[0,0,1,2,3,2,3,1,0,0,0],[0,0,0,2,2,2,2,0,0,0,0],[0,0,0,1,4,4,1,0,0,0,0],[0,0,1,4,4,4,4,1,0,0,0],[0,1,1,4,5,5,4,1,1,0,0],[0,1,4,4,5,5,4,4,1,0,0],[0,1,4,4,4,4,4,4,1,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,0,0,4,4,0,0,0],[0,0,6,6,0,0,6,6,0,0,0],[0,0,6,6,0,0,6,6,0,0,0],[0,0,7,7,0,0,7,7,0,0,0]],
  walk1: [[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0,0],[0,0,1,2,3,2,3,1,0,0,0],[0,0,0,2,2,2,2,0,0,0,0],[0,0,0,1,4,4,1,0,0,0,0],[0,0,1,4,4,4,4,1,0,0,0],[0,1,1,4,5,5,4,1,1,0,0],[0,1,4,4,5,5,4,4,1,0,0],[0,1,4,4,4,4,4,4,1,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,6,0,0,4,4,0,0,0],[0,0,6,6,0,0,6,6,0,0,0],[0,0,7,7,0,0,0,0,0,0,0],[0,0,0,0,0,0,7,7,0,0,0]],
  walk2: [[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0,0],[0,0,1,2,3,2,3,1,0,0,0],[0,0,0,2,2,2,2,0,0,0,0],[0,0,0,1,4,4,1,0,0,0,0],[0,0,1,4,4,4,4,1,0,0,0],[0,1,1,4,5,5,4,1,1,0,0],[0,1,4,4,5,5,4,4,1,0,0],[0,1,4,4,4,4,4,4,1,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,0,0,6,4,0,0,0],[0,0,6,6,0,0,6,6,0,0,0],[0,0,0,0,0,0,7,7,0,0,0],[0,0,7,7,0,0,0,0,0,0,0]],
  jump: [[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0,0],[0,0,1,2,3,2,3,1,0,0,0],[0,0,0,2,2,2,2,0,0,0,0],[0,0,0,1,4,4,1,0,0,0,0],[0,0,1,4,4,4,4,1,0,0,0],[0,1,1,4,5,5,4,1,1,0,0],[0,1,4,4,5,5,4,4,1,0,0],[0,1,4,4,4,4,4,4,1,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,0,0,4,4,0,0,0],[0,0,6,6,0,0,6,6,0,0,0],[0,0,0,0,7,7,0,0,0,0,0],[0,0,7,7,0,0,7,7,0,0,0]],
  fall: [[0,0,0,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0,0],[0,0,1,2,3,2,3,1,0,0,0],[0,0,0,2,2,2,2,0,0,0,0],[0,0,0,1,4,4,1,0,0,0,0],[0,0,1,4,4,4,4,1,0,0,0],[0,1,1,4,5,5,4,1,1,0,0],[0,1,4,4,5,5,4,4,1,0,0],[0,1,4,4,4,4,4,4,1,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,4,4,4,4,0,0,0],[0,0,4,4,0,0,4,4,0,0,0],[0,0,6,6,0,0,6,6,0,0,0],[0,0,7,7,0,0,0,0,0,0,0],[0,0,0,0,7,7,7,7,0,0,0]],
  attack: [[0,0,0,1,1,1,1,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0,0,0,0],[0,0,1,2,2,2,2,1,0,0,0,0,0,0],[0,0,1,2,3,2,3,1,0,0,0,0,0,0],[0,0,0,2,2,2,2,0,0,0,0,0,0,0],[0,0,0,1,4,4,1,0,0,0,0,0,0,0],[0,0,1,4,4,4,4,1,0,8,8,8,0,0],[0,1,1,4,5,5,4,1,1,8,9,8,0,0],[0,1,4,4,5,5,4,4,1,8,8,8,0,0],[0,1,4,4,4,4,4,4,1,0,0,0,0,0],[0,0,4,4,4,4,4,4,0,0,0,0,0,0],[0,0,4,4,4,4,4,4,0,0,0,0,0,0],[0,0,4,4,0,0,4,4,0,0,0,0,0,0],[0,0,6,6,0,0,6,6,0,0,0,0,0,0],[0,0,6,6,0,0,6,6,0,0,0,0,0,0],[0,0,7,7,0,0,7,7,0,0,0,0,0,0]],
};

const MOB_SPRITE = {
  idle: [[0,0,1,1,1,1,0,0],[0,1,1,2,2,1,1,0],[1,1,2,3,3,2,1,1],[1,2,2,2,2,2,2,1],[1,2,2,2,2,2,2,1],[0,1,2,2,2,2,1,0],[0,0,1,4,4,1,0,0],[0,1,1,0,0,1,1,0]],
  walk1: [[0,0,1,1,1,1,0,0],[0,1,1,2,2,1,1,0],[1,1,2,3,3,2,1,1],[1,2,2,2,2,2,2,1],[1,2,2,2,2,2,2,1],[0,1,2,2,2,2,1,0],[0,0,1,4,1,0,0,0],[0,0,0,0,1,1,0,0]],
  walk2: [[0,0,1,1,1,1,0,0],[0,1,1,2,2,1,1,0],[1,1,2,3,3,2,1,1],[1,2,2,2,2,2,2,1],[1,2,2,2,2,2,2,1],[0,1,2,2,2,2,1,0],[0,0,0,1,4,1,0,0],[0,0,1,1,0,0,0,0]],
};

const BOSS_SPRITE = {
  idle: [[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,1,1,2,2,2,2,1,1,0,0],[0,1,1,2,3,2,2,3,2,1,1,0],[0,1,2,2,2,2,2,2,2,2,1,0],[1,1,2,4,4,2,2,4,4,2,1,1],[1,2,2,4,4,2,2,4,4,2,2,1],[1,2,2,2,2,2,2,2,2,2,2,1],[1,2,5,5,2,2,2,2,5,5,2,1],[1,2,5,5,2,2,2,2,5,5,2,1],[0,1,2,2,2,2,2,2,2,2,1,0],[0,1,2,2,6,6,6,6,2,2,1,0],[0,0,1,2,2,6,6,2,2,1,0,0],[0,0,0,1,2,2,2,2,1,0,0,0],[0,0,0,0,1,1,1,1,0,0,0,0]],
  angry: [[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,1,1,2,2,2,2,1,1,0,0],[0,1,1,2,2,2,2,2,2,1,1,0],[0,1,2,4,4,2,2,4,4,2,1,0],[1,1,2,2,2,2,2,2,2,2,1,1],[1,2,2,2,2,2,2,2,2,2,2,1],[1,2,7,7,2,2,2,2,7,7,2,1],[1,2,7,8,2,2,2,2,8,7,2,1],[1,2,2,2,2,2,2,2,2,2,2,1],[0,1,2,5,5,2,2,5,5,2,1,0],[0,1,2,5,5,2,2,5,5,2,1,0],[0,0,1,2,6,6,6,6,2,1,0,0],[0,0,0,1,2,2,2,2,1,0,0,0],[0,0,0,0,1,1,1,1,0,0,0,0]],
};

const EXEC_SPRITE = {
  idle: [[0,0,0,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0],[0,1,2,3,2,2,3,2,1,0],[0,1,2,2,2,2,2,2,1,0],[0,1,4,4,4,4,4,4,1,0],[0,1,4,5,5,5,5,4,1,0],[0,1,4,5,6,6,5,4,1,0],[0,1,4,4,4,4,4,4,1,0],[0,0,4,4,0,0,4,4,0,0],[0,0,7,7,0,0,7,7,0,0],[0,0,8,8,0,0,8,8,0,0]],
  alert: [[0,0,0,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,1,0,0],[0,1,2,9,2,2,9,2,1,0],[0,1,2,2,2,2,2,2,1,0],[0,1,4,4,4,4,4,4,1,0],[0,1,4,5,5,5,5,4,1,0],[0,1,4,5,6,6,5,4,1,0],[0,1,4,4,4,4,4,4,1,0],[0,0,4,4,0,0,4,4,0,0],[0,0,7,7,0,0,7,7,0,0],[0,0,8,8,0,0,8,8,0,0]],
};

const ITEM_SPRITES = {
  heal: [[0,1,1,1,0],[1,2,2,2,1],[1,2,3,2,1],[1,2,2,2,1],[0,1,1,1,0]],
  artifact: [[0,0,1,0,0],[0,1,2,1,0],[1,2,3,2,1],[0,1,2,1,0],[0,0,1,0,0]],
};

const PLAYER_PALETTE = { 1: "#2a3242", 2: "#e8c5a4", 3: "#182032", 4: "#3f5f8d", 5: "#79a2d8", 6: "#263244", 7: "#121825", 8: "#dff2ff", 9: "#ffcf6e" };
const MOB_PALETTE = { 1: "#4a5568", 2: "#718096", 3: "#f6e05e", 4: "#2d3748" };
const BOSS_PALETTE = { 1: "#1a1a2e", 2: "#b34552", 3: "#ffd6a5", 4: "#ffffff", 5: "#8b2635", 6: "#2d1b1e", 7: "#ff6b6b", 8: "#000000" };
const EXEC_PALETTE = { 1: "#1a1a2e", 2: "#f3d6c6", 3: "#202a44", 4: "#2f3f66", 5: "#8aa4d9", 6: "#f4e19d", 7: "#1f2937", 8: "#0f172a", 9: "#ff6b6b" };

const PLAYER_STYLE_PALETTES = {
  vanguard: { ...PLAYER_PALETTE, 1: "#2f3f58", 4: "#4f7ba8", 5: "#9fd4ff", 8: "#dbf3ff", 9: "#9dd6ff" },
  striker: { ...PLAYER_PALETTE, 1: "#34324a", 4: "#5d68a1", 5: "#f6c56d", 8: "#fff0d5", 9: "#ffd28a" },
  phantom: { ...PLAYER_PALETTE, 1: "#2f2744", 4: "#5d4a8a", 5: "#be9df2", 8: "#f5dcff", 9: "#d8b7ff" },
};

function cloneSprite(s) { return s.map(r => r.slice()); }

const PLAYER_STYLE_SPRITES = {
  vanguard: (function(){ const c={}; for(const [k,f] of Object.entries(PLAYER_SPRITE)) c[k]=cloneSprite(f); c.idle[8][1]=8; c.idle[9][1]=8; return c; })(),
  striker: (function(){ const c={}; for(const [k,f] of Object.entries(PLAYER_SPRITE)) c[k]=cloneSprite(f); c.attack[6][10]=8; c.attack[6][11]=9; return c; })(),
  phantom: (function(){ const c={}; for(const [k,f] of Object.entries(PLAYER_SPRITE)) c[k]=cloneSprite(f); c.idle[10][8]=5; c.idle[11][8]=5; return c; })(),
};

export const RescapeRRenderSystem = {
  withAlpha(hex, alpha) {
    if (typeof hex !== "string") return `rgba(255,255,255,${alpha.toFixed(2)})`;
    if (hex.startsWith("rgba(")) {
      const m = hex.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(2)})`;
    }
    if (!hex.startsWith("#")) return hex;
    const c = hex.slice(1);
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  },

  drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },

  drawImageSprite(ctx, img, x, y, w, h, flip = false, alpha = 1, frameSpec = null) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (frameSpec) { sx = frameSpec.x || 0; sy = frameSpec.y || 0; sw = frameSpec.w; sh = frameSpec.h; }
    ctx.save(); ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(Math.round(x + w), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, sx, sy, sw, sh, 0, 0, Math.round(w), Math.round(h)); }
    else ctx.drawImage(img, sx, sy, sw, sh, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.restore(); return true;
  },

  drawSprite(ctx, x, y, pixelSize, spriteMap, palette, flip = false) {
    for (let r = 0; r < spriteMap.length; r++) {
      for (let c = 0; c < spriteMap[r].length; c++) {
        const colCode = spriteMap[r][c];
        if (colCode !== 0 && palette[colCode]) {
          const dc = flip ? (spriteMap[r].length - 1 - c) : c;
          this.drawPixelRect(ctx, x + dc * pixelSize, y + r * pixelSize, pixelSize, pixelSize, palette[colCode]);
        }
      }
    }
  },

  drawGroundShadow(ctx, cx, y, w, alpha = 0.22) {
    this.drawPixelRect(ctx, cx - w * 0.5, y, w, 3, `rgba(0,0,0,${alpha})`);
  },

  drawPlayer(ctx, p, ART_ASSETS, ART_FRAME_SPECS, theme) {
    const styleId = p.styleId || "striker";
    const blink = p.invuln > 0 && Math.floor(performance.now() / 60) % 2 === 0;
    const artKey = blink ? "hurt" : (!p.onGround ? "jump" : "stand");
    const frame = ART_FRAME_SPECS.player[artKey];
    this.drawGroundShadow(ctx, p.x + p.w * 0.5, p.y + p.h + 3, 26, p.onGround ? 0.25 : 0.14);
    if (!this.drawImageSprite(ctx, ART_ASSETS.player[artKey], p.x, p.y, p.w, p.h, p.facing < 0, blink ? 0.6 : 1, frame)) {
      this.drawSprite(ctx, p.x, p.y, 2.6, PLAYER_STYLE_SPRITES[styleId].idle, PLAYER_STYLE_PALETTES[styleId], p.facing < 0);
    }
  },

  drawEnemy(ctx, e, ART_ASSETS, ART_FRAME_SPECS, theme) {
    this.drawGroundShadow(ctx, e.x + e.w * 0.5, e.y + e.h + 4, e.type === "boss" ? 42 : 22, 0.2);
    const color = e.type === "boss" ? "#ff6464" : (e.type === "exec" ? "#d78bff" : theme.accent);
    this.drawPixelRect(ctx, e.x, e.y, e.w, e.h, this.withAlpha(color, 0.8));
    if (e.hitFlash > 0) {
      this.drawPixelRect(ctx, e.x, e.y, e.w, e.h, "rgba(255,255,255,0.5)");
    }
  },

  drawPickup(ctx, it) {
    const bounce = Math.sin(performance.now() * 0.01) * 3;
    this.drawSprite(ctx, it.x, it.y + bounce, 3, it.type === "heal" ? ITEM_SPRITES.heal : ITEM_SPRITES.artifact, it.type === "heal" ? {1:"#2d6a4f",2:"#40916c",3:"#74c69d"} : {1:"#d4af37",2:"#ffd700",3:"#fff8dc"});
  },

  drawBackground(ctx, width, height, theme) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, theme.bg[0]); grad.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
  },

  drawHud(ctx, p, floorLabel, runTime, width, theme) {
    this.drawPixelRect(ctx, 18, 18, 200, 40, "rgba(0,0,0,0.5)");
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px monospace";
    ctx.fillText(`LV${p.level} HP ${Math.ceil(p.hp)}/${p.maxHp}`, 30, 36);
    ctx.fillText(`GOLD ${p.gold} XP ${p.xp}/${p.needXp}`, 30, 50);
  }
};
