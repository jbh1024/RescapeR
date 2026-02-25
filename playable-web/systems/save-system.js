(function attachSaveSystem(global) {
  const DEFAULT_SETTINGS = { sfxVolume: 0.55, reducedFx: false };
  const DEFAULT_META = {
    items: { cpu: 0, ram: 0, badge: 0 },
    damageBonus: 0,
    maxHpBonus: 0,
    speedBonus: 0,
    deathCount: 0,
    recentDeaths: 0,
    totalClears: 0,
    bestTimeMs: 0,
    bestCombo: 0,
    totalPlayTime: 0,
    unlockedItems: [],
  };

  function loadSettings(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(raw);
      return {
        sfxVolume: typeof parsed.sfxVolume === "number"
          ? Math.max(0, Math.min(1, parsed.sfxVolume))
          : DEFAULT_SETTINGS.sfxVolume,
        reducedFx: Boolean(parsed.reducedFx),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(storage, key, settings) {
    storage.setItem(key, JSON.stringify({
      sfxVolume: settings.sfxVolume,
      reducedFx: settings.reducedFx,
    }));
  }

  function loadMeta(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) return { ...DEFAULT_META, items: { ...DEFAULT_META.items }, unlockedItems: [] };
    try {
      const parsed = JSON.parse(raw);
      const unlockedItems = Array.isArray(parsed.unlockedItems) ? parsed.unlockedItems : [];
      return {
        ...DEFAULT_META,
        ...parsed,
        items: { ...DEFAULT_META.items, ...(parsed.items || {}) },
        unlockedItems,
      };
    } catch {
      return { ...DEFAULT_META, items: { ...DEFAULT_META.items }, unlockedItems: [] };
    }
  }

  function saveMeta(storage, key, meta) {
    storage.setItem(key, JSON.stringify(meta));
  }

  function loadRunSave(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.player || !parsed.meta) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveRunSnapshot(storage, key, state, floorLabelFn) {
    if (!state.player || !state.floor) return;
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
        weapon: state.player.weapon,
        styleId: state.player.styleId || "striker",
        damageMul: state.player.damageMul / ((state.player.weaponDamageMul || 1) * (state.player.styleDamageMul || 1)),
        speedMul: state.player.speedMul / (state.player.styleSpeedMul || 1),
        maxHp: state.player.maxHp,
        maxHpBase: state.player.maxHp - (state.player.styleHpBonus || 0),
        lifeStealOnKill: state.player.lifeStealOnKill,
        attackCdMul: state.player.attackCdMul / ((state.player.weaponAttackCdMul || 1) * (state.player.styleAttackCdMul || 1)),
        dashCdMul: state.player.dashCdMul / (state.player.styleDashCdMul || 1),
      },
      meta: {
        totalPlayTime: Math.round(state.meta.totalPlayTime + state.runElapsedMs / 1000),
        deathCount: state.runDeathCount,
        unlockedItems: [...state.meta.unlockedItems],
      },
    };
    storage.setItem(key, JSON.stringify(payload));
  }

  function clearRunSnapshot(storage, key) {
    storage.removeItem(key);
  }

  global.RescapeRSaveSystem = {
    loadSettings,
    saveSettings,
    loadMeta,
    saveMeta,
    loadRunSave,
    saveRunSnapshot,
    clearRunSnapshot,
  };
})(window);
