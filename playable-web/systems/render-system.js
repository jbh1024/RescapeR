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
  gold: [[0,1,1,1,0],[1,2,2,2,1],[1,2,3,2,1],[1,2,2,2,1],[0,1,1,1,0]], // 동전 모양
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
    
    let artKey = "stand";
    let spriteState = "idle";
    const isDashing = p.dashTimer > (p.dashCd * (p.dashCdMul || 1)) - 200;

    if (isDashing) {
      artKey = "jump";
      spriteState = "walk1";
    } else if (p.attackSwing > 0) {
      artKey = "stand";
      spriteState = "attack";
    } else if (!p.onGround) {
      artKey = "jump";
      spriteState = "jump";
    } else if (p.vx !== 0) {
      artKey = "stand";
      spriteState = Math.floor(p.walkAnim) % 2 === 0 ? "walk1" : "walk2";
    }

    if (blink) {
      artKey = "hurt";
      spriteState = "fall";
    }

    const frame = ART_FRAME_SPECS.player[artKey];
    this.drawGroundShadow(ctx, p.x + p.w * 0.5, p.y + p.h + 3, 26, p.onGround ? 0.25 : 0.14);
    
    let drawnImage = false;
    if (ART_ASSETS.player[artKey]) {
      drawnImage = this.drawImageSprite(ctx, ART_ASSETS.player[artKey], p.x, p.y, p.w, p.h, p.facing < 0, blink ? 0.6 : 1, frame);
      
      // 공격 시 무기 잔상 효과 (이미지 모드일 때 추가)
      if (drawnImage && p.attackSwing > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        const swingProgress = p.attackSwing / 160;
        const swingLength = 40 + (p.skillReachBonus || 0);
        if (p.facing > 0) {
          ctx.fillRect(p.x + p.w - 10, p.y + p.h / 2 - 10 * swingProgress, swingLength * swingProgress, 20);
        } else {
          ctx.fillRect(p.x - swingLength * swingProgress + 10, p.y + p.h / 2 - 10 * swingProgress, swingLength * swingProgress, 20);
        }
        ctx.restore();
      }
    }

    if (!drawnImage) {
      const spriteMap = PLAYER_STYLE_SPRITES[styleId][spriteState] || PLAYER_STYLE_SPRITES[styleId].idle;
      this.drawSprite(ctx, p.x, p.y, 2.6, spriteMap, PLAYER_STYLE_PALETTES[styleId], p.facing < 0);
    }

    // 머리 위 이름 및 체력바
    const centerX = p.x + p.w / 2;
    const topY = p.y - 12;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(p.codename || "플레이어", centerX, topY - 10);

    // 미니 체력바
    this.drawPixelRect(ctx, centerX - 20, topY - 6, 40, 4, "rgba(0,0,0,0.5)");
    const hpWidth = Math.max(0, (p.hp / p.maxHp) * 40);
    this.drawPixelRect(ctx, centerX - 20, topY - 6, hpWidth, 4, "#44ff44");
    ctx.textAlign = "start"; // 원복
  },

  drawPlayerTrail(ctx, trail, ART_ASSETS, ART_FRAME_SPECS) {
    const styleId = trail.styleId || "striker";
    const frame = ART_FRAME_SPECS.player["jump"]; // dash utilizes jump image mostly
    const drawnImage = this.drawImageSprite(ctx, ART_ASSETS.player["jump"], trail.x, trail.y, trail.w, trail.h, trail.facing < 0, trail.alpha, frame);
    if (!drawnImage) {
      ctx.save();
      ctx.globalAlpha = trail.alpha;
      const spriteMap = PLAYER_STYLE_SPRITES[styleId].walk1;
      this.drawSprite(ctx, trail.x, trail.y, 2.6, spriteMap, PLAYER_STYLE_PALETTES[styleId], trail.facing < 0);
      ctx.restore();
    }
  },

  drawPlatform(ctx, plat, theme, ART_ASSETS) {
    const tileImg = ART_ASSETS.tiles && ART_ASSETS.tiles.stoneMid;
    if (tileImg && tileImg.complete && tileImg.naturalWidth) {
      ctx.save();
      const pattern = ctx.createPattern(tileImg, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.translate(plat.x, plat.y);
        ctx.fillRect(0, 0, plat.w, plat.h);
      }
      ctx.restore();
      
      // 발판 시인성을 위한 테두리 추가
      this.drawPixelRect(ctx, plat.x, plat.y, plat.w, 3, "rgba(255,255,255,0.3)");
      this.drawPixelRect(ctx, plat.x, plat.y + plat.h - 3, plat.w, 3, "rgba(0,0,0,0.6)");
    } else {
      this.drawPixelRect(ctx, plat.x, plat.y, plat.w, plat.h, theme.floor);
      this.drawPixelRect(ctx, plat.x, plat.y, plat.w, 4, "rgba(255,255,255,0.2)");
    }
  },

  drawEnemy(ctx, e, ART_ASSETS, ART_FRAME_SPECS, theme) {
    this.drawGroundShadow(ctx, e.x + e.w * 0.5, e.y + e.h + 4, e.type === "boss" ? 42 : 22, 0.2);
    
    const blink = e.hitFlash > 0;
    const imgKey = e.type === "boss" ? "golem" : (e.imgKey || "dark_guard");
    const img = ART_ASSETS.monsters[imgKey];
    const frame = ART_FRAME_SPECS.monsters[imgKey] || { w: 32, h: 32 };
    
    if (!this.drawImageSprite(ctx, img, e.x, e.y, e.w, e.h, e.dir > 0, blink ? 0.7 : 1, frame)) {
      const color = e.type === "boss" ? "#ff6464" : (e.type === "exec" ? "#d78bff" : theme.accent);
      this.drawPixelRect(ctx, e.x, e.y, e.w, e.h, this.withAlpha(color, 0.8));
    }

    if (e.hitFlash > 0) {
      this.drawPixelRect(ctx, e.x, e.y, e.w, e.h, "rgba(255,255,255,0.4)");
    }

    // 머리 위 이름 및 체력바
    const centerX = e.x + e.w / 2;
    const topY = e.y - 10;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = e.type === "boss" ? "#ff6464" : (e.type === "exec" ? "#d78bff" : "#fff");
    ctx.fillText(e.name || "적", centerX, topY - 8);

    // 미니 체력바 (항상 표시하여 가독성 확보)
    this.drawPixelRect(ctx, centerX - 15, topY - 4, 30, 3, "rgba(0,0,0,0.5)");
    const hpWidth = Math.max(0, (e.hp / e.maxHp) * 30);
    this.drawPixelRect(ctx, centerX - 15, topY - 4, hpWidth, 3, "#ff4444");
    ctx.textAlign = "start";
  },

  drawPickup(ctx, it) {
    const bounce = Math.sin(performance.now() * 0.01) * 3;
    let sprite = ITEM_SPRITES.artifact;
    let palette = {1:"#d4af37",2:"#ffd700",3:"#fff8dc"}; // default gold/artifact colors

    if (it.type === "heal") {
      sprite = ITEM_SPRITES.heal;
      palette = {1:"#2d6a4f",2:"#40916c",3:"#74c69d"};
    } else if (it.type === "gold") {
      sprite = ITEM_SPRITES.gold;
      palette = {1:"#8b4513",2:"#ffd700",3:"#fff8dc"};
    }

    this.drawSprite(ctx, it.x, it.y + bounce, 3, sprite, palette);
  },

  drawGate(ctx, gate, isOpen, theme) {
    // 문 프레임
    this.drawPixelRect(ctx, gate.x, gate.y, gate.w, gate.h, "#1a1a1a");
    this.drawPixelRect(ctx, gate.x + 5, gate.y + 5, gate.w - 10, gate.h - 5, isOpen ? theme.accent : "#333");
    
    // 문 장식 (격차)
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    for(let i=1; i<4; i++) {
      const lx = gate.x + (gate.w / 4) * i;
      ctx.beginPath(); ctx.moveTo(lx, gate.y); ctx.lineTo(lx, gate.y + gate.h); ctx.stroke();
    }
    ctx.restore();

    // E.V 표기
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("E.V", gate.x + gate.w / 2, gate.y + gate.h / 2);
    ctx.restore();

    if (isOpen) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("E: 다음 층", gate.x + gate.w / 2, gate.y - 15);
      ctx.textAlign = "start";
    }
  },

  drawShop(ctx, shop, theme) {
    if (!shop) return;
    
    // 상점 본체 (자판기/가판대 느낌)
    this.drawPixelRect(ctx, shop.x, shop.y, shop.w, shop.h, "#2c3e50");
    this.drawPixelRect(ctx, shop.x + 5, shop.y + 5, shop.w - 10, shop.h - 10, "#34495e");
    
    // 상단 간판
    this.drawPixelRect(ctx, shop.x - 5, shop.y - 20, shop.w + 10, 25, "#e67e22");
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SHOP", shop.x + shop.w / 2, shop.y - 3);
    
    // 화면 부분
    this.drawPixelRect(ctx, shop.x + 15, shop.y + 20, shop.w - 30, 30, "#1abc9c");
    
    // 버튼들
    for(let i=0; i<3; i++) {
      this.drawPixelRect(ctx, shop.x + 20 + i*22, shop.y + 60, 15, 15, "#95a5a6");
    }

    // 안내 메시지
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("E: 상점 열기", shop.x + shop.w / 2, shop.y - 35);
    ctx.textAlign = "start";
  },

  drawCafe(ctx, cafe, theme) {
    if (!cafe) return;

    // 카페 본체 (카운터 느낌)
    this.drawPixelRect(ctx, cafe.x, cafe.y, cafe.w, cafe.h, "#4a2f1d");
    this.drawPixelRect(ctx, cafe.x + 5, cafe.y + 5, cafe.w - 10, cafe.h - 10, "#5c3d2e");

    // 상단 간판
    this.drawPixelRect(ctx, cafe.x - 5, cafe.y - 20, cafe.w + 10, 25, "#8b5e3c");
    ctx.fillStyle = "#f5deb3";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CAFE", cafe.x + cafe.w / 2, cafe.y - 3);

    // 커피잔 아이콘 (간단한 픽셀)
    this.drawPixelRect(ctx, cafe.x + 35, cafe.y + 20, 30, 25, "#d2691e");
    this.drawPixelRect(ctx, cafe.x + 38, cafe.y + 15, 24, 8, "#f5deb3"); // 거품
    this.drawPixelRect(ctx, cafe.x + 65, cafe.y + 25, 8, 12, "#d2691e"); // 손잡이

    // 하단 장식
    for(let i=0; i<3; i++) {
      this.drawPixelRect(ctx, cafe.x + 20 + i*22, cafe.y + 60, 15, 15, "#8b5e3c");
    }

    // 안내 메시지
    ctx.fillStyle = "#f5deb3";
    ctx.font = "bold 14px monospace";
    ctx.fillText("E: 카페 열기", cafe.x + cafe.w / 2, cafe.y - 35);
    ctx.textAlign = "start";
  },

  drawBackground(ctx, width, height, theme, ART_ASSETS, cameraX, zone = "") {
    // 1. 기본 그래디언트 배경
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, theme.bg[0]); grad.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = grad; 
    ctx.fillRect(0, 0, width, height);

    // 2. 테마별 배경 이미지 (Parallax 효과)
    if (theme.bgImg && ART_ASSETS.backgrounds[theme.bgImg]) {
      const img = ART_ASSETS.backgrounds[theme.bgImg];
      const scrollX = (cameraX * 0.2) % width;
      
      ctx.save();
      ctx.globalAlpha = 0.4;
      // 두 장을 이어서 그려서 무한 루프 구현
      ctx.drawImage(img, -scrollX, 0, width, height);
      ctx.drawImage(img, width - scrollX, 0, width, height);
      ctx.restore();
    }

    // 3. 특정 층 전용 배경 문구 (예: 9층 임원실)
    if (zone === "executive") {
      ctx.save();
      ctx.font = "bold 40px 'Nanum Gothic', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const text = "우리는 남들이 가지 않는 길을 간다";
      const centerX = width / 2;
      const centerY = height / 2 - 40;
      
      // 약간의 네온 효과/그림자
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillText(text, centerX, centerY);
      ctx.restore();
    }
  },


  drawFx(ctx, state) {
    // 1. 파티클 그리기
    for (const p of state.particles) {
      const alpha = Math.min(1, p.life / 100);
      this.drawPixelRect(ctx, p.x, p.y, p.size, p.size, this.withAlpha(p.color, alpha));
    }

    // 2. 데미지 텍스트 그리기
    for (const d of state.damageTexts) {
      const alpha = Math.min(1, d.life / 200);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.font = `bold ${d.size}px monospace`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(d.text, d.x, d.y);
      ctx.restore();
    }
  },

  drawHud(ctx, p, floorLabel, runTime, width, theme, enemyCount) {
    // 1. 좌측 상단 기본 정보 HUD
    ctx.textAlign = "start";
    this.drawPixelRect(ctx, 18, 18, 300, 85, "rgba(0,0,0,0.7)");
    
    const kitCount = p.inventory.filter(item => item === "회복키트").length;
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 15px monospace";
    ctx.fillText(`${p.codename || "야근러"} [LV ${p.level}] (회복키트: ${kitCount})`, 30, 40);

    // ... (HP 바 로직 생략되지 않음)
    const hpRatio = p.hp / p.maxHp;
    let hpColor = "#44ff44";
    if (hpRatio < 0.2) hpColor = "#ff4444";
    else if (hpRatio < 0.5) hpColor = "#ff9900";

    this.drawPixelRect(ctx, 30, 48, 220, 10, "#441111");
    const hpWidth = Math.max(0, hpRatio * 220);
    this.drawPixelRect(ctx, 30, 48, hpWidth, 10, hpColor);
    
    ctx.font = "11px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText(`HP ${Math.ceil(p.hp)}/${p.maxHp}`, 30, 72);
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`야근수당: ${p.gold}`, 130, 72);
    ctx.fillStyle = "#8de0c3";
    ctx.fillText(`XP ${p.xp}/${p.needXp}`, 210, 72);

    // 2. 캐릭터 상태값 상세 (레이아웃 겹침 방지를 위해 2열 3행으로 변경)
    this.drawPixelRect(ctx, 18, 108, 300, 80, "rgba(0,0,0,0.6)");
    ctx.font = "11px monospace";
    ctx.textAlign = "start";
    
    const atkValue = Math.round(p.baseDamage * (p.damageMul || 1.0));
    const moveSpdValue = Math.round((p.speedMul || 1.0) * 100);
    const atkSpdValue = Math.round((1 / (p.attackCdMul || 1.0)) * 100);
    const defValue = Math.round((2 - (p.damageTakenMul || 1.0)) * 100);
    const critDmgValue = Math.round((p.critDamageMul || 1.5) * 100);
    const critValue = Math.round((p.critChance || 0) * 100);

    const col1 = 30;
    const col2 = 160;
    const row1 = 126;
    const row2 = 148;
    const row3 = 170;

    ctx.fillStyle = "#ffa07a"; ctx.fillText(`공격력: ${atkValue}`, col1, row1);
    ctx.fillStyle = "#87cefa"; ctx.fillText(`이동속도: ${moveSpdValue}%`, col2, row1);
    
    ctx.fillStyle = "#add8e6"; ctx.fillText(`공격속도: ${atkSpdValue}%`, col1, row2);
    ctx.fillStyle = "#f0e68c"; ctx.fillText(`방어력: ${defValue}%`, col2, row2);
    
    ctx.fillStyle = "#dda0dd"; ctx.fillText(`크리티컬데미지: ${critDmgValue}%`, col1, row3);
    ctx.fillStyle = "#ff6b6b"; ctx.fillText(`치명타율: ${critValue}%`, col2, row3);

    // 장착 무기(키보드) 정보
    if (p.weapon) {
      const tierColors = { Common: "#ccc", Rare: "#4a90e2", Epic: "#a335ee", Legendary: "#ff8000" };
      const color = tierColors[p.weapon.tier] || "#fff";
      
      const weaponStartY = 195;
      this.drawPixelRect(ctx, 18, weaponStartY, 300, 45, "rgba(0,0,0,0.6)");
      ctx.fillStyle = color;
      ctx.font = "bold 12px monospace";
      ctx.fillText(`KEY: ${p.weapon.name}`, 30, weaponStartY + 18);
      
      ctx.fillStyle = "#aaa";
      ctx.font = "10px monospace";
      ctx.fillText(`${p.weapon.tier} | ${p.weapon.feature}`, 30, weaponStartY + 35);
    }

    // 영구 업그레이드(Artifacts) 정보
    let nextSectionY = 248;
    if (p.artifacts && p.artifacts.length > 0) {
      const artHeight = 15 + p.artifacts.length * 20;
      this.drawPixelRect(ctx, 18, nextSectionY, 300, artHeight, "rgba(0,0,0,0.5)");

      ctx.fillStyle = "#8de0c3";
      ctx.font = "bold 11px monospace";
      ctx.fillText("PERMANENT UPGRADES:", 30, nextSectionY + 15);

      p.artifacts.forEach((art, i) => {
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.fillText(`• ${art.label}: ${art.desc}`, 30, nextSectionY + 32 + i * 18);
      });
      nextSectionY += artHeight + 5;
    }

    // 임시 버프(Temp Buffs) 정보
    if (p.tempBuffs && p.tempBuffs.length > 0) {
      const buffHeight = 15 + p.tempBuffs.length * 20;
      this.drawPixelRect(ctx, 18, nextSectionY, 300, buffHeight, "rgba(0,0,0,0.5)");

      ctx.fillStyle = "#f5deb3";
      ctx.font = "bold 11px monospace";
      ctx.fillText("TEMP BUFFS:", 30, nextSectionY + 15);

      const pulse = 0.7 + Math.sin(performance.now() * 0.004) * 0.3;
      p.tempBuffs.forEach((b, i) => {
        ctx.fillStyle = this.withAlpha("#f5deb3", pulse);
        ctx.font = "10px monospace";
        ctx.fillText(`• ${b.label}: ${b.desc} (${b.floorsRemaining}층 남음)`, 30, nextSectionY + 32 + i * 18);
      });
    }

    // 3. 우측 상단 스테이지 정보
    const floorText = floorLabel();
    ctx.textAlign = "right";
    this.drawPixelRect(ctx, width - 240, 18, 222, 68, "rgba(0,0,0,0.6)");
    ctx.fillStyle = "#ffcf6e";
    ctx.font = "bold 16px monospace";
    ctx.fillText(floorText, width - 30, 40);
    
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.fillText(enemyCount > 0 ? `남은 적: ${enemyCount}명` : "층 클리어! 다음 문으로", width - 30, 58);

    // 플레이타임 표시 추가
    const totalSec = Math.floor(runTime / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    ctx.fillStyle = "#87cefa";
    ctx.fillText(`진행 시간: ${timeStr}`, width - 30, 75);

    // 4. 버프/스킬 효과 표시 (캐릭터 정보 우측)
    if (p.skillNames && p.skillNames.length > 0) {
      const buffStartX = 310;
      const buffStartY = 18;
      const buffHeight = 22;
      
      ctx.textAlign = "start";
      p.skillNames.forEach((name, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const bx = buffStartX + col * 125;
        const by = buffStartY + row * (buffHeight + 5);
        
        this.drawPixelRect(ctx, bx, by, 120, buffHeight, "rgba(74, 98, 122, 0.5)");
        this.drawPixelRect(ctx, bx, by, 4, buffHeight, "#8de0c3"); // 포인트 바
        
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.fillText(name, bx + 10, by + 15);
      });
    }

    ctx.textAlign = "start";
  }
};
