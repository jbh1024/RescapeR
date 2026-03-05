export const RescapeRSaveSystem = {
  loadSettings(storage, key) {
    try {
      const s = storage.getItem(key);
      if (!s) return { sfxVolume: 0.55, reducedFx: false };
      return JSON.parse(s);
    } catch {
      return { sfxVolume: 0.55, reducedFx: false };
    }
  },

  saveSettings(storage, key, settings) {
    storage.setItem(key, JSON.stringify(settings));
  },

  loadMeta(storage, key) {
    try {
      const s = storage.getItem(key);
      const meta = s ? JSON.parse(s) : {};
      return {
        totalClears: 0,
        bestTimeMs: 0,
        totalPlayTime: 0,
        deathCount: 0,
        recentDeaths: 0,
        maxHpBonus: 0,
        speedBonus: 0,
        damageBonus: 0,
        items: { cpu: 0, ram: 0, badge: 0 },
        unlockedItems: [],
        clearRecords: [],
        ranking: { totalClears: 0, bestClearTimeMs: 0, lastClearTimeMs: 0 },
        ...meta,
      };
    } catch {
      return {
        totalClears: 0,
        bestTimeMs: 0,
        totalPlayTime: 0,
        deathCount: 0,
        recentDeaths: 0,
        maxHpBonus: 0,
        speedBonus: 0,
        damageBonus: 0,
        items: { cpu: 0, ram: 0, badge: 0 },
        unlockedItems: [],
        clearRecords: [],
        ranking: { totalClears: 0, bestClearTimeMs: 0, lastClearTimeMs: 0 },
      };
    }
  },

  saveMeta(storage, key, meta) {
    storage.setItem(key, JSON.stringify(meta));
  },

  loadRunSave(storage, key) {
    try {
      const s = storage.getItem(key);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },

  saveRunSnapshot(storage, key, state, floorLabelFn) {
    if (!state.player) return;
    const payload = {
      player: {
        currentFloor: floorLabelFn(state.floor.info.n),
        floorIndex: state.floorIndex,
        hp: Math.max(1, Math.round(state.player.hp)),
        gold: state.player.gold,
        inventory: [...state.player.inventory],
        codename: state.player.codename,
        level: state.player.level,
        xp: state.player.xp,
        needXp: state.player.needXp,
        skillNames: [...state.player.skillNames],
        skillIds: [...(state.player.skillIds || [])],
        weapon: state.player.weapon,
        styleId: state.player.styleId,
        damageMul: state.player.damageMul / ((state.player.weaponDamageMul || 1) * (state.player.styleDamageMul || 1)),
        speedMul: state.player.speedMul / (state.player.styleSpeedMul || 1),
        maxHp: state.player.maxHp,
        maxHpBase: state.player.maxHp - (state.player.styleHpBonus || 0),
        lifeStealOnKill: state.player.lifeStealOnKill,
        attackCdMul: state.player.attackCdMul / ((state.player.weaponAttackCdMul || 1) * (state.player.styleAttackCdMul || 1)),
        dashCdMul: state.player.dashCdMul / (state.player.styleDashCdMul || 1),
        critChance: state.player.critChance || 0,
        critDamageMul: state.player.critDamageMul || 1.5,
        damageTakenMul: state.player.damageTakenMul || 1,
        regenPerSec: state.player.regenPerSec || 0,
        skillReachBonus: state.player.skillReachBonus || 0,
        executeThreshold: state.player.executeThreshold || 0,
        executeDamageMul: state.player.executeDamageMul || 0,
      },
      meta: {
        totalPlayTime: Math.round(state.meta.totalPlayTime),
        deathCount: state.runDeathCount,
        unlockedItems: [...state.meta.unlockedItems],
      },
    };
    storage.setItem(key, JSON.stringify(payload));
  },

  clearRunSnapshot(storage, key) {
    storage.removeItem(key);
  }
};
