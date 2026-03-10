export const RescapeRCombatSystem = {
  intersects(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  },

  isBackAttack(player, enemy) {
    return player.facing === enemy.dir;
  },

  comboMultiplier(comboHits) {
    if (comboHits >= 30) return 1.2;
    if (comboHits >= 20) return 1.14;
    if (comboHits >= 10) return 1.08;
    if (comboHits >= 5) return 1.04;
    return 1;
  },

  calculateDamage(player) {
    let damage = Math.round(player.baseDamage * player.damageMul);
    let isCrit = false;
    if (player.critChance > 0 && Math.random() < player.critChance) {
      damage = Math.round(damage * player.critDamageMul);
      isCrit = true;
    }
    return { damage, isCrit };
  },

  handlePlayerAttack(state, FxSystem, AudioSystem, onEnemyDefeatedFn) {
    const p = state.player;
    if (p.attackTimer > 0) return;

    p.attackTimer = p.attackCd * (p.attackCdMul || 1);
    p.attackSwing = 160;
    AudioSystem.playSfx(state, "hit");
    
    const range = {
      x: p.facing > 0 ? p.x + p.w : p.x - 60 - (p.skillReachBonus || 0),
      y: p.y,
      w: 60 + (p.skillReachBonus || 0),
      h: p.h
    };

    for (const e of state.floor.enemies) {
      if (e.hp > 0 && this.intersects(range, e)) {
        const { damage, isCrit } = this.calculateDamage(p);
        e.hp -= damage;
        e.hitFlash = 100;
        
        const color = isCrit ? "#fff1b3" : "#ffffff";
        FxSystem.spawnDamageText(state, e.x + e.w / 2, e.y, damage, color, isCrit);
        
        if (e.hp <= 0) {
          onEnemyDefeatedFn(e);
        }
      }
    }
  },

  takeDamage(state, amount, FxSystem, AudioSystem, onDeathFn) {
    const p = state.player;
    if (p.invuln > 0) return;
    
    const finalDmg = Math.round(amount);
    p.hp -= finalDmg;
    p.invuln = 500;
    
    FxSystem.addShake(state, 4);
    FxSystem.addScreenFx(state, "damage");
    FxSystem.spawnDamageText(state, p.x + p.w / 2, p.y - 20, finalDmg, "#ff5555", false);
    AudioSystem.playSfx(state, "boss");
    
    if (p.hp <= 0) {
      p.hp = 0;
      onDeathFn();
    }
  }
};
