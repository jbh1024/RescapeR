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
      return this._validateMeta({
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
      });
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

  _validateMeta(meta) {
    const rules = {
      totalClears:   { min: 0, max: 99999 },
      bestTimeMs:    { min: 0, max: 86400000 },
      totalPlayTime: { min: 0, max: 999999999 },
      deathCount:    { min: 0, max: 99999 },
      recentDeaths:  { min: 0, max: 99999 },
      maxHpBonus:    { min: 0, max: 500 },
      speedBonus:    { min: 0, max: 1 },
      damageBonus:   { min: 0, max: 1 },
    };

    for (const [key, rule] of Object.entries(rules)) {
      const val = meta[key];
      if (typeof val !== 'number' || !Number.isFinite(val) || val < rule.min || val > rule.max) {
        meta[key] = rule.min;
      }
    }

    // items 객체 검증
    if (!meta.items || typeof meta.items !== 'object') {
      meta.items = { cpu: 0, ram: 0, badge: 0 };
    }
    for (const k of ['cpu', 'ram', 'badge']) {
      const v = meta.items[k];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 999) {
        meta.items[k] = 0;
      }
    }

    // 배열 필드 검증
    if (!Array.isArray(meta.unlockedItems)) meta.unlockedItems = [];
    if (!Array.isArray(meta.clearRecords)) meta.clearRecords = [];

    // ranking 객체 검증
    if (!meta.ranking || typeof meta.ranking !== 'object') {
      meta.ranking = { totalClears: 0, bestClearTimeMs: 0, lastClearTimeMs: 0 };
    }
    const rankingRules = {
      totalClears:    { min: 0, max: 99999 },
      bestClearTimeMs: { min: 0, max: 86400000 },
      lastClearTimeMs: { min: 0, max: 86400000 },
    };
    for (const [key, rule] of Object.entries(rankingRules)) {
      const val = meta.ranking[key];
      if (typeof val !== 'number' || !Number.isFinite(val) || val < rule.min || val > rule.max) {
        meta.ranking[key] = rule.min;
      }
    }

    return meta;
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
