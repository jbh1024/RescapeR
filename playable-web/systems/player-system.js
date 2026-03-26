import { RescapeRConfig as Config } from './data-config.js';

export const RescapeRPlayerSystem = {
  createBasePlayer(meta) {
    const p = {
      x: 0, y: 0, w: 32, h: 42, vx: 0, vy: 0, onGround: false,
      hp: 100, maxHp: 100,
      baseSpeed: 4.5, speedMul: 1 + (meta.speedBonus || 0),
      baseDamage: 25, damageMul: 1 + (meta.damageBonus || 0),
      attackCd: 250, attackCdMul: 1.0, 
      dashCd: 800, dashCdMul: 1.0, 
      attackTimer: 0, dashTimer: 0,
      level: 1, xp: 0, needXp: 50, gold: 0,
      inventory: ["빈 슬롯", "빈 슬롯", "빈 슬롯"],
      lifeStealOnKill: 0, critChance: 0.05, critDamageMul: 1.5, damageTakenMul: 1,
      regenPerSec: 0, regenTimer: 0, regenStacks: 0,
      dashCd: 800, dashTimer: 0, jumpCount: 0, maxJumps: 2,
      facing: 1, walkAnim: 0, invuln: 0, attackSwing: 0,
      skillNames: [], styleId: "none", weapon: null,
      tempBuffs: [], commuteUsed: false
    };
    p.hp = p.maxHp;
    // 기본 무기 장착
    this.equipWeapon(p, Config.WEAPON_CATALOG[0]);
    return p;
  },

  equipWeapon(p, weapon) {
    // 이전 무기 효과 제거 (현재는 단순화하여 무기 객체만 교체하고 배율을 직접 조정)
    // 실제로는 baseDamageMul 등을 두고 관리하는 것이 좋으나 기존 구조를 존중하여
    // 무기 교체 시 기존 무기 배율을 나누고 새 무기 배율을 곱하는 식으로 처리
    if (p.weapon) {
      p.damageMul /= p.weapon.attackMul;
      p.attackCdMul /= p.weapon.attackCdMul;
    }
    
    p.weapon = weapon;
    p.damageMul *= weapon.attackMul;
    p.attackCdMul *= weapon.attackCdMul;
  },

  applyCombatStyle(p, styleId) {
    const style = Config.CHARACTER_STYLES[styleId] || Config.CHARACTER_STYLES.striker;
    p.styleId = styleId;
    p.styleName = style.name;
    p.styleDesc = style.desc;
    p.styleAttackTint = style.attackTint;
    p.styleArmorMul = style.armorMul;
    p.styleDodgeChance = style.dodgeChance;
    
    p.speedMul *= style.speedMul;
    p.damageMul *= style.damageMul;
    p.attackCdMul *= style.attackCdMul;
    p.dashCdMul *= style.dashCdMul;
    p.maxHp += style.hpBonus;
    p.hp = p.maxHp;
  },

  updatePhysics(p, dt, keys, platforms, groundY, worldWidth) {
    const dtSec = dt * 0.001;
    let move = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) move--;
    if (keys["ArrowRight"] || keys["KeyD"]) move++;
    if (move !== 0) {
      p.facing = move;
      p.walkAnim += dtSec * 10;
    } else {
      p.walkAnim = 0;
    }

    const isDashing = p.dashTimer > (p.dashCd * (p.dashCdMul || 1)) - 200;
    if (isDashing) {
      p.vx = p.facing * p.baseSpeed * p.speedMul * 60 * 3.5;
    } else {
      p.vx = move * p.baseSpeed * p.speedMul * 60;
    }
    
    // 점프
    if ((keys["ArrowUp"] || keys["KeyW"]) && p.onGround) {
      p.vy = -750;
      p.onGround = false;
    }

    // 중력 및 마찰
    p.vy += 2100 * dtSec;
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;

    // 플랫폼 충돌
    p.onGround = false;
    for (const plat of platforms) {
      if (p.vy >= 0 && p.x + p.w > plat.x && p.x < plat.x + plat.w &&
          p.y + p.h >= plat.y && p.y + p.h <= plat.y + 15) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    }
    
    // 경계 처리
    p.x = Math.max(0, Math.min(worldWidth - p.w, p.x));
    if (p.y > groundY - p.h) {
      p.y = groundY - p.h;
      p.vy = 0;
      p.onGround = true;
    }

    // 타이머 업데이트
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    if (p.attackSwing > 0) p.attackSwing = Math.max(0, p.attackSwing - dt * 1.5);

    // 체력 재생 로직
    if (p.regenPerSec > 0 && p.hp < p.maxHp) {
      p.regenTimer += dt;
      if (p.regenTimer >= 1000) {
        p.hp = Math.min(p.maxHp, p.hp + p.regenPerSec);
        p.regenTimer -= 1000;
      }
    }
  }
};
