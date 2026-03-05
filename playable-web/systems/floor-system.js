export const RescapeRFloorSystem = {
  floorDifficultyCurve(index) {
    return 1 + index * 0.12;
  },

  mobBehaviorForZone(zone, i) {
    const behaviors = ["chase", "kite", "flank"];
    return behaviors[i % behaviors.length];
  },

  buildFloor(opts) {
    const {
      index, info, rand, profile,
      worldWidth, groundY,
      pickMobArchetype, randomItemKey,
      executiveMiniBosses
    } = opts;

    const platforms = [
      { x: 0, y: groundY, w: worldWidth, h: 100 } // 기본 바닥
    ];

    // 무작위 공중 플랫폼 생성
    const platCount = 4 + Math.floor(rand() * 5);
    for (let i = 0; i < platCount; i++) {
      platforms.push({
        x: 200 + rand() * (worldWidth - 600),
        y: groundY - 120 - rand() * 200,
        w: 150 + rand() * 200,
        h: 24
      });
    }

    const enemies = [];
    const mobCount = info.safeZone ? 0 : (3 + Math.floor(index * 0.8));
    
    for (let i = 0; i < mobCount; i++) {
      const mobName = profile.mobNames[Math.floor(rand() * profile.mobNames.length)];
      const arch = pickMobArchetype(info.zone, mobName, index, rand);
      enemies.push({
        ...arch,
        name: mobName,
        type: "mob",
        x: 600 + rand() * (worldWidth - 800),
        y: groundY - 60,
        w: 32,
        h: 48,
        dir: -1,
        walkAnim: rand() * Math.PI,
        hitFlash: 0,
        stunTimer: 0,
        slowTimer: 0,
        variant: Math.floor(rand() * 3),
        zone: info.zone
      });
    }

    // 엘리트 적 (보스/임원)
    if (info.boss && !info.safeZone) {
      enemies.push({
        name: info.boss,
        type: info.finalBoss ? "boss" : "exec",
        hp: 400 + index * 150,
        maxHp: 400 + index * 150,
        speed: 1.5,
        damage: 25 + index * 5,
        xp: 200 + index * 50,
        x: worldWidth - 400,
        y: groundY - 80,
        w: 64,
        h: 80,
        dir: -1,
        walkAnim: 0,
        hitFlash: 0,
        stunTimer: 0,
        slowTimer: 0,
        zone: info.zone
      });
    }

    const pickups = [];
    if (info.safeZone) {
      pickups.push({
        x: 400, y: groundY - 30, w: 24, h: 24,
        type: "heal", heal: 50
      });
    }

    return {
      info,
      platforms,
      enemies,
      pickups,
      gate: { x: worldWidth - 150, y: groundY - 120, w: 80, h: 120 },
      gateOpen: info.safeZone,
      shop: info.safeZone ? { x: 600, y: groundY - 100, w: 100, h: 100 } : null
    };
  }
};
