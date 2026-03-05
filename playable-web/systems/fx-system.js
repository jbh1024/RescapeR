export const RescapeRFxSystem = {
  addScreenFx(state, type, opts = {}) {
    if (state.reducedFx && type !== "boss") return;
    const presets = {
      damage: { life: 180, color: "255,90,90", strength: 0.2, mode: "flash" },
      slash: { life: 120, color: "255,220,130", strength: 0.12, mode: "flash" },
      alert: { life: 340, color: "255,196,120", strength: 0.13, mode: "scan" },
      boss: { life: 420, color: "236,160,255", strength: 0.16, mode: "vignette" },
    };
    const p = presets[type] || presets.slash;
    state.screenFx.push({
      life: opts.life || p.life,
      maxLife: opts.life || p.life,
      color: opts.color || p.color,
      strength: (opts.strength || p.strength) * (state.reducedFx ? 0.58 : 1),
      mode: opts.mode || p.mode,
    });
  },

  addShake(state, amount) {
    state.cameraShake = Math.min(14, state.cameraShake + amount);
  },

  spawnParticles(state, x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (0.4 + Math.random()) * speed;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 240 + Math.random() * 220,
        maxLife: 320,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  },

  updateParticles(state, dt) {
    const dtSec = dt * 0.001;
    state.particles = state.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dtSec * 60;
      p.y += p.vy * dtSec * 60;
      p.vy += 0.04 * dtSec * 3600;
      p.vx *= Math.pow(0.985, dtSec * 60);
      return p.life > 0;
    });
  },

  spawnDamageText(state, x, y, value, color = "#ffe3a5", isCrit = false) {
    state.damageTexts.push({
      x,
      y,
      vy: isCrit ? -1.35 : -1.1,
      life: isCrit ? 760 : 620,
      maxLife: isCrit ? 760 : 620,
      text: String(value),
      color,
      size: isCrit ? 14 : 12,
    });
  },

  updateDamageTexts(state, dt) {
    const dtSec = dt * 0.001;
    state.damageTexts = state.damageTexts.filter((d) => {
      d.life -= dt;
      d.y += d.vy * dtSec * 60;
      d.vy += 0.035 * dtSec * 3600;
      return d.life > 0;
    });
  }
};
