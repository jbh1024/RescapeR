(function attachCombatSystem(global) {
  function isBackAttack(player, enemy) {
    return player.facing === enemy.dir;
  }

  function comboMultiplier(comboHits) {
    if (comboHits >= 30) return 1.2;
    if (comboHits >= 20) return 1.14;
    if (comboHits >= 10) return 1.08;
    if (comboHits >= 5) return 1.04;
    return 1;
  }

  global.RescapeRCombatSystem = {
    isBackAttack,
    comboMultiplier,
  };
})(window);
