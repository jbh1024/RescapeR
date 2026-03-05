let audioCtx = null;
let audioUnlocked = false;

function ensureAudioContext() {
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

export const RescapeRAudioSystem = {
  unlockAudio() {
    const ctxRef = ensureAudioContext();
    if (!ctxRef) return;
    if (ctxRef.state === "suspended") {
      ctxRef.resume().catch(() => {});
    }
    audioUnlocked = true;
  },

  playSfx(state, kind) {
    if (!audioUnlocked) return;
    const ctxRef = ensureAudioContext();
    if (!ctxRef) return;
    const volume = Math.max(0, Math.min(1, state.sfxVolume ?? 0.55));
    if (volume <= 0.001) return;

    const now = ctxRef.currentTime;
    const osc = ctxRef.createOscillator();
    const gain = ctxRef.createGain();

    const profiles = {
      hit: { type: "square", base: 170, rise: 1.5, dur: 0.12, amp: 0.8 },
      alert: { type: "triangle", base: 240, rise: 2.1, dur: 0.14, amp: 0.72 },
      boss: { type: "sawtooth", base: 105, rise: 1.7, dur: 0.24, amp: 1 },
      ceo: { type: "sawtooth", base: 88, rise: 1.42, dur: 0.3, amp: 1.1 },
      server: { type: "square", base: 300, rise: 1.3, dur: 0.12, amp: 0.6 },
      glitch: { type: "triangle", base: 140, rise: 2.7, dur: 0.12, amp: 0.72 },
      executive: { type: "sawtooth", base: 95, rise: 1.55, dur: 0.21, amp: 0.95 },
    };

    const p = profiles[kind] || profiles.hit;
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.base, now);
    osc.frequency.exponentialRampToValueAtTime(p.base * p.rise, now + p.dur * 0.72);
    
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05 * volume * p.amp, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);

    osc.connect(gain);
    gain.connect(ctxRef.destination);
    osc.start(now);
    osc.stop(now + p.dur + 0.02);
  }
};
