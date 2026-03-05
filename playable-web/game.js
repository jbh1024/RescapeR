import { RescapeRUtils as Utils } from './systems/utils.js';
import { RescapeRConfig as Config } from './systems/data-config.js';
import { RescapeRAudioSystem as AudioSystem } from './systems/audio-system.js';
import { RescapeRFxSystem as FxSystem } from './systems/fx-system.js';
import { RescapeRAssetManager as AssetManager } from './systems/asset-manager.js';
import { RescapeRSaveSystem as SaveSystem } from './systems/save-system.js';
import { RescapeRCombatSystem as CombatSystem } from './systems/combat-system.js';
import { RescapeRUiSystem as UiSystem } from './systems/ui-system.js';
import { RescapeRRenderSystem as RenderSystem } from './systems/render-system.js';
import { RescapeRMonsterArchetypeSystem as MonsterArchetypeSystem } from './systems/monster-archetype-system.js';
import { RescapeRFloorSystem as FloorSystem } from './systems/floor-system.js';
import { RescapeRPlayerSystem as PlayerSystem } from './systems/player-system.js';
import { RescapeRAISystem as AISystem } from './systems/ai-system.js';
import { RescapeRInputSystem as InputSystem } from './systems/input-system.js';

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const logEl = document.getElementById("log");
const overlayEl = document.getElementById("overlay");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = HEIGHT - 75;
const WORLD_WIDTH = 3200;
const APP_VERSION = "1.1.0-final";
const SAVE_STORAGE_KEY = "rescaperSave";
const META_STORAGE_KEY = "rescaperMeta";

const { ART_ASSET_PATHS, ART_FRAME_SPECS, FLOOR_PLAN, PLAYER_CALLSIGN, MONSTER_NAME_POOL } = Config;
const ART_ASSETS = AssetManager.loadArtAssetsSync(ART_ASSET_PATHS);

const state = {
  rngSeed: Date.now() % 100000, floorIndex: 0, floor: null, cameraX: 0,
  mode: "playing", running: true, player: null, cameraShake: 0,
  particles: [], damageTexts: [], screenFx: [], runElapsedMs: 0, lastTs: 0,
  meta: SaveSystem.loadMeta(localStorage, META_STORAGE_KEY)
};

function log(msg) {
  const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  state.logs = state.logs || [];
  state.logs.unshift(`[${time}] ${msg}`);
  state.logs = state.logs.slice(0, 12);
  if (logEl) logEl.innerHTML = state.logs.map(x => `<div>${x}</div>`).join("");
}

function startRun() {
  const saved = SaveSystem.loadRunSave(localStorage, SAVE_STORAGE_KEY);
  state.player = saved ? PlayerSystem.createBasePlayer(state.meta) : PlayerSystem.createBasePlayer(state.meta);
  if (!saved) {
    PlayerSystem.applyCombatStyle(state.player, "striker");
    state.floorIndex = 0;
  } else {
    state.floorIndex = saved.player.floorIndex;
  }
  enterFloor(state.floorIndex, true);
  state.running = true; state.mode = "playing"; state.runStartTs = performance.now();
  overlayEl.classList.add("hidden");
  log("런 시작: IT 회사 탈출을 시작합니다.");
}

function enterFloor(index, first = false) {
  state.floorIndex = index;
  const info = FLOOR_PLAN[index];
  state.floor = FloorSystem.buildFloor({
    index, info, rand: (function(seed){ let s=seed; return () => { s=(s*1664525+1013904223)%4294967296; return s/4294967296; }; })(state.rngSeed + index),
    profile: { playerName: PLAYER_CALLSIGN[info.zone], mobNames: MONSTER_NAME_POOL[info.zone] },
    worldWidth: WORLD_WIDTH, groundY: GROUND_Y,
    pickMobArchetype: MonsterArchetypeSystem.pickArchetype,
    randomItemKey: () => "cpu"
  });
  state.player.x = 80; state.player.y = GROUND_Y - state.player.h;
  state.player.vx = state.player.vy = 0; state.cameraX = 0;
  log(`${info.name} 진입 완료.`);
  SaveSystem.saveRunSnapshot(localStorage, SAVE_STORAGE_KEY, state, n => n < 0 ? `B${Math.abs(n)}` : `${n}F`);
}

function nextFloor() {
  if (state.floorIndex >= FLOOR_PLAN.length - 1) { winGame(); return; }
  enterFloor(state.floorIndex + 1);
}

function winGame() {
  state.running = false; state.mode = "clearChoice";
  overlayEl.classList.remove("hidden");
  overlayEl.textContent = "축하합니다! 전 층 정복 완료.\nR 키로 다시 시작";
}

function onDeath() {
  state.running = false; state.mode = "dead";
  overlayEl.classList.remove("hidden");
  overlayEl.textContent = "퇴근 실패...\nR 키로 재시작";
}

function updatePlayer(dt) {
  const p = state.player;
  PlayerSystem.updatePhysics(p, dt, InputSystem.keys, state.floor.platforms, GROUND_Y, WORLD_WIDTH);
  if (InputSystem.isPressed(" ") && p.attackTimer <= 0) {
    CombatSystem.handlePlayerAttack(state, FxSystem, AudioSystem, (e) => {
      e.defeated = true; state.player.gold += 10;
      FxSystem.spawnParticles(state, e.x + e.w/2, e.y + e.h/2, 8, "#ff7b72", 2);
      log(`격파: ${e.name}`);
    });
  }
}

function updateEnemies(dt) {
  for (const e of state.floor.enemies) {
    if (e.hp <= 0) continue;
    AISystem.updateEnemyAI(e, state.player, dt, WORLD_WIDTH);
    if (CombatSystem.intersects(e, state.player)) {
      CombatSystem.takeDamage(state, e.damage / 10, FxSystem, AudioSystem, onDeath);
    }
  }
  state.floor.enemies = state.floor.enemies.filter(e => e.hp > 0);
  if (state.floor.enemies.length === 0) state.floor.gateOpen = true;
}

function loop(now) {
  if (!state.lastTs) state.lastTs = now;
  const dt = Math.min(33, now - state.lastTs);
  state.lastTs = now;

  if (state.running) {
    updatePlayer(dt);
    updateEnemies(dt);
    state.cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, state.player.x - WIDTH * 0.35));
    state.runElapsedMs += dt;
    if (state.floor.gateOpen && InputSystem.isPressed("e") && CombatSystem.intersects(state.player, state.floor.gate)) {
      nextFloor();
    }
  }

  FxSystem.updateParticles(state, dt);
  FxSystem.updateDamageTexts(state, dt);

  RenderSystem.drawBackground(ctx, WIDTH, HEIGHT, state.floor.theme);
  ctx.save();
  ctx.translate(-state.cameraX + (Math.random()-0.5)*state.cameraShake, 0);
  for (const plat of state.floor.platforms) RenderSystem.drawPixelRect(ctx, plat.x, plat.y, plat.w, plat.h, state.floor.theme.floor);
  for (const it of state.floor.pickups) RenderSystem.drawPickup(ctx, it);
  for (const e of state.floor.enemies) RenderSystem.drawEnemy(ctx, e, ART_ASSETS, ART_FRAME_SPECS, state.floor.theme);
  RenderSystem.drawPlayer(ctx, state.player, ART_ASSETS, ART_FRAME_SPECS, state.floor.theme);
  ctx.restore();
  RenderSystem.drawHud(ctx, state.player, n => n, state.runElapsedMs, WIDTH, state.floor.theme);

  requestAnimationFrame(loop);
}

InputSystem.init((e) => {
  AudioSystem.unlockAudio();
  if ((e.key === "r" || e.key === "R") && (state.mode === "dead" || state.mode === "clearChoice")) startRun();
});

startRun();
requestAnimationFrame(loop);
