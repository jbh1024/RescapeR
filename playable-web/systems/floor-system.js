(function attachFloorSystem(global) {
  function floorDifficultyCurve(index) {
    const t = index + 1;
    const ramp = 1 + Math.pow(t / 14, 1.35) * 1.75;
    return {
      mobHp: Math.round(22 + ramp * 7.5),
      mobDamage: Math.round(6 + ramp * 2.1),
      mobSpeedBase: 1.05 + t * 0.05,
      bossHpMul: 0.88 + ramp * 0.66,
      bossDamageMul: 0.9 + ramp * 0.24,
      skillCdMul: Math.max(0.74, 1.08 - t * 0.02),
    };
  }

  function mobBehaviorForZone(zone, i) {
    const table = {
      parking: ["rush", "rush", "flank"],
      cafeteria: ["rush", "kite", "flank"],
      lobby: ["kite", "rush", "kite"],
      showroom: ["kite", "flank", "rush"],
      mobile: ["flank", "kite", "rush"],
      server: ["kite", "kite", "flank"],
      glitch: ["flank", "rush", "kite"],
      marketing: ["kite", "flank", "kite"],
      support: ["rush", "flank", "kite"],
      executive: ["flank", "kite", "rush"],
    };
    const arr = table[zone] || ["rush", "flank", "kite"];
    return arr[i % arr.length];
  }

  function buildFloor({
    index,
    info,
    rand,
    profile,
    worldWidth,
    groundY,
    pickMobArchetype,
    randomItemKey,
    executiveMiniBosses,
  }) {
    const curve = floorDifficultyCurve(index);
    const platforms = [{ x: 0, y: groundY, w: worldWidth, h: 80 }];
    const enemies = [];
    const pickups = [];

    for (let i = 0; i < 14; i++) {
      const w = 170 + rand() * 180;
      const x = 180 + rand() * (worldWidth - 500);
      const y = 160 + rand() * (groundY - 210);
      platforms.push({ x, y, w, h: 20 });
    }

    const difficulty = index + 1;
    const hasBoss = Boolean(info.boss);
    const normalCount = info.safeZone ? 0 : (hasBoss
      ? 2 + Math.floor(rand() * 2) + Math.floor(difficulty / 5)
      : 5 + Math.floor(rand() * 3) + Math.floor(difficulty / 4));

    for (let i = 0; i < normalCount; i++) {
      const mobHp = curve.mobHp + Math.round(rand() * 10);
      const mobName = profile.mobNames[Math.floor(rand() * profile.mobNames.length)] || "업무 스트레스체";
      enemies.push({
        x: 350 + rand() * (worldWidth - 650),
        y: groundY - 44,
        w: 32,
        h: 44,
        hp: mobHp,
        maxHp: mobHp,
        damage: curve.mobDamage + Math.floor(rand() * 2),
        speed: curve.mobSpeedBase + rand() * 1.1,
        dir: rand() < 0.5 ? -1 : 1,
        type: "mob",
        name: mobName,
        archetype: pickMobArchetype(info.zone, mobName, i, rand),
        zone: info.zone,
        variant: Math.floor(rand() * 3),
        xp: 16 + difficulty * 2,
        hitFlash: 0,
        slowTimer: 0,
        dotTimer: 0,
        dotTick: 0,
        dotDamage: 0,
        stunTimer: 0,
        skillCd: Math.round(1800 * curve.skillCdMul),
        skillTimer: 880 + rand() * 820,
        walkAnim: rand() * 10,
        behavior: mobBehaviorForZone(info.zone, i),
        aiCooldown: 500 + rand() * 700,
        defeated: false,
      });
    }

    if (hasBoss && !info.safeZone) {
      const bossBaseHp = info.finalBoss ? 620 : 280;
      const bossBaseDamage = info.finalBoss ? 34 : 18;
      enemies.push({
        x: worldWidth - 320,
        y: groundY - 84,
        w: 64,
        h: 84,
        hp: Math.round((bossBaseHp + difficulty * 9) * curve.bossHpMul),
        maxHp: Math.round((bossBaseHp + difficulty * 9) * curve.bossHpMul),
        damage: Math.round(bossBaseDamage * curve.bossDamageMul),
        speed: (info.finalBoss ? 2.1 : 1.4) + difficulty * 0.03,
        dir: -1,
        type: "boss",
        name: info.boss,
        zone: info.zone,
        variant: Math.floor(rand() * 3),
        xp: info.finalBoss ? 220 : 120,
        hitFlash: 0,
        slowTimer: 0,
        dotTimer: 0,
        dotTick: 0,
        dotDamage: 0,
        stunTimer: 0,
        skillCd: Math.round((info.finalBoss ? 1300 : 1850) * curve.skillCdMul),
        skillTimer: 900 + rand() * 900,
        walkAnim: rand() * 10,
        phaseIndex: 1,
        defeated: false,
      });
    }

    if (info.finalBoss) {
      const executivePool = [...executiveMiniBosses];
      for (let i = 0; i < 2; i++) {
        const pickIndex = Math.floor(rand() * executivePool.length);
        const execName = executivePool.splice(pickIndex, 1)[0];
        enemies.push({
          x: worldWidth - 900 + i * 220,
          y: groundY - 72,
          w: 54,
          h: 72,
          hp: Math.round((240 + difficulty * 9) * (curve.bossHpMul * 0.88)),
          maxHp: Math.round((240 + difficulty * 9) * (curve.bossHpMul * 0.88)),
          damage: Math.round(18 * curve.bossDamageMul),
          speed: 1.55 + difficulty * 0.03,
          dir: -1,
          type: "exec",
          name: execName,
          zone: info.zone,
          variant: Math.floor(rand() * 3),
          xp: 95,
          hitFlash: 0,
          slowTimer: 0,
          dotTimer: 0,
          dotTick: 0,
          dotDamage: 0,
          stunTimer: 0,
          skillCd: Math.round((1600 + rand() * 500) * curve.skillCdMul),
          skillTimer: 780 + rand() * 700,
          walkAnim: rand() * 10,
          phaseIndex: 1,
          defeated: false,
        });
      }
    }

    if (!info.safeZone && rand() < 0.85) {
      const key = randomItemKey(rand);
      pickups.push({
        x: 400 + rand() * (worldWidth - 800),
        y: groundY - 28,
        w: 24,
        h: 24,
        type: "artifact",
        key,
      });
    }

    if (rand() < (info.safeZone ? 1 : 0.65)) {
      pickups.push({
        x: 300 + rand() * (worldWidth - 600),
        y: groundY - 24,
        w: 20,
        h: 20,
        type: "heal",
        heal: 28,
      });
    }

    return {
      info,
      platforms,
      enemies,
      pickups,
      gateOpen: info.safeZone,
      gate: { x: worldWidth - 150, y: groundY - 86, w: 42, h: 86 },
      shop: info.safeZone ? { x: 220, y: groundY - 90, w: 58, h: 90 } : null,
    };
  }

  global.RescapeRFloorSystem = {
    floorDifficultyCurve,
    mobBehaviorForZone,
    buildFloor,
  };
})(window);
