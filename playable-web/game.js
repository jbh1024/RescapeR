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

const { ART_ASSET_PATHS, ART_FRAME_SPECS, FLOOR_PLAN, PLAYER_CALLSIGN, MONSTER_NAME_POOL, SKILL_TEMPLATES } = Config;
const ART_ASSETS = AssetManager.loadArtAssetsSync(ART_ASSET_PATHS);

const state = {
  rngSeed: Date.now() % 100000, floorIndex: 0, floor: null, cameraX: 0,
  mode: "playing", running: true, player: null, cameraShake: 0,
  particles: [], damageTexts: [], screenFx: [], dashTrails: [], runElapsedMs: 0, lastTs: 0,
  runDeathCount: 0,
  meta: SaveSystem.loadMeta(localStorage, META_STORAGE_KEY)
};
window.gameState = state; // Expose for testing

function log(msg) {
  const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  state.logs = state.logs || [];
  state.logs.unshift(`[${time}] ${msg}`);
  state.logs = state.logs.slice(0, 12);
  if (logEl) logEl.innerHTML = state.logs.map(x => `<div>${x}</div>`).join("");
}

function showNameInput() {
  state.mode = "nameInput";
  state.running = false;
  overlayEl.classList.remove("hidden");
  overlayEl.innerHTML = `
    <div style="text-align:center; background:rgba(0,0,0,0.8); padding:40px; border-radius:15px; border:2px solid #4a627a;">
      <h1 style="color:#ffcf6e; margin-bottom:30px;">입사 지원서 작성</h1>
      <p style="color:#fff; margin-bottom:10px;">당신의 사원명을 입력하세요:</p>
      <input type="text" id="player-name-input" value="야근러" maxlength="10" 
        style="padding:10px; font-size:1.2rem; text-align:center; background:#222; color:#fff; border:1,px solid #444; margin-bottom:20,px; width:200px;">
      <br>
      <button id="start-game-btn" style="padding:10px 30,px; font-size:1.1rem; cursor:pointer; background:#4a627a; color:#fff; border:none; border-radius:5px;">게임 시작</button>
    </div>
  `;

  const input = document.getElementById("player-name-input");
  const btn = document.getElementById("start-game-btn");

  const startWithInput = () => {
    const name = input.value.trim() || "야근러";
    startRun(name);
  };

  btn.onclick = startWithInput;
  input.onkeydown = (e) => {
    if (e.key === "Enter") startWithInput();
    e.stopPropagation(); // 게임 키 입력 방해 금지
  };
  input.focus();
}

function startRun(name = "야근러") {
  state.player = PlayerSystem.createBasePlayer(state.meta);
  state.player.codename = name; // 입력받은 이름 설정
  PlayerSystem.applyCombatStyle(state.player, "striker");
  state.floorIndex = 0;

  enterFloor(state.floorIndex, true);
  state.running = true; 
  state.mode = "playing"; 
  state.runStartTs = performance.now();
  overlayEl.classList.add("hidden");
  log(`신입사원 ${name}님, 탈출을 시작합니다.`);
}

function togglePause(forcePause = null) {
  if (state.mode !== "playing" && state.mode !== "shop" && state.mode !== "skillSelect") return;

  const targetState = forcePause !== null ? !forcePause : !state.running;
  if (state.running === targetState) return;

  state.running = targetState;
  if (!state.running) {
    const elapsedSec = Math.floor(state.runElapsedMs / 1000);
    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const timeStr = `${min}분 ${sec}초`;

    overlayEl.classList.remove("hidden");
    overlayEl.innerHTML = `
      <div style="text-align:center; line-height:1.6;">
        <h1 style="font-size:3rem; margin-bottom:20px; color:#ffcf6e;">일시정지</h1>
        <div style="background:rgba(0,0,0,0.5); padding:20px; border-radius:10px; border:1px solid #444; display:inline-block; min-width:300px;">
          <p style="font-size:1.2rem; margin:10px 0;"><b>현재 레벨:</b> ${state.player.level}</p>
          <p style="font-size:1.2rem; margin:10px 0;"><b>현재 스테이지:</b> ${state.floor.info.name}</p>
          <p style="font-size:1.2rem; margin:10px 0;"><b>플레이 시간:</b> ${timeStr}</p>
        </div>
        <p style="margin-top:30px; font-size:1rem; color:#aaa; animation: blink 1s infinite;">P를 눌러 재개</p>
      </div>
    `;
  } else {
    overlayEl.classList.add("hidden");
  }
}

function updatePlayer(dt) {
  if (state.mode !== "playing" || !state.running) return;
  const p = state.player;
  PlayerSystem.updatePhysics(p, dt, InputSystem.keys, state.floor.platforms, GROUND_Y, WORLD_WIDTH);

  if (InputSystem.isPressed(" ")) {
    CombatSystem.handlePlayerAttack(state, FxSystem, AudioSystem, (e) => {
      e.defeated = true; 
      state.player.gold += 10;
      const xpGain = e.xp || 15;
      state.player.xp += xpGain;
      log(`격파: ${e.name} (XP +${xpGain})`);
      
      const roll = Math.random();
      if (roll < 0.1) {
        state.floor.pickups.push({ x: e.x + e.w / 2 - 12, y: e.y + e.h - 24, w: 24, h: 24, type: "heal", heal: 25 });
        log("몬스터가 회복 키트를 떨어뜨렸습니다!");
      } else if (roll < 0.4) {
        const bonusGold = Utils.randInt(15, 30);
        state.floor.pickups.push({ x: e.x + e.w / 2 - 12, y: e.y + e.h - 24, w: 24, h: 24, type: "gold", amount: bonusGold });
        log(`몬스터가 야근수당 ${bonusGold}을 떨어뜨렸습니다!`);
      }

      if (state.player.xp >= state.player.needXp) {
        state.player.level++;
        state.player.xp -= state.player.needXp;
        state.player.needXp = Math.round(state.player.needXp * 1.3 + 20);
        log(`레벨 업! 현재 레벨: ${state.player.level}`);
        FxSystem.spawnParticles(state, state.player.x + state.player.w/2, state.player.y, 15, "#ffff00", 3);
        showSkillSelection();
      }
      FxSystem.spawnParticles(state, e.x + e.w/2, e.y + e.h/2, 8, "#ff7b72", 2);
    });
  }

  if (InputSystem.isPressed("shift") || InputSystem.isPressed("Shift")) {
    if (p.dashTimer <= 0) {
      p.dashTimer = p.dashCd * (p.dashCdMul || 1);
      AudioSystem.playSfx(state, "dash");
      FxSystem.spawnParticles(state, p.x + p.w/2, p.y + p.h/2, 8, "rgba(255,255,255,0.7)", 2);
    }
  }



  const isDashing = p.dashTimer > (p.dashCd * (p.dashCdMul || 1)) - 200;
  if (isDashing) {
    state.dashTrails.push({ x: p.x, y: p.y, w: p.w, h: p.h, facing: p.facing, alpha: 0.5, styleId: p.styleId });
  }

  // 아이템 획득 로직 추가
  for (let i = state.floor.pickups.length - 1; i >= 0; i--) {
    const it = state.floor.pickups[i];
    if (CombatSystem.intersects(p, it)) {
      if (it.type === "gold") {
        const amt = it.amount || 10;
        state.player.gold += amt;
        log(`야근수당 ${amt}을 확보했습니다!`);
        AudioSystem.playSfx(state, "pickup"); // pickup SFX가 있는지 확인 필요, 없으면 hit이라도
      } else if (it.type === "heal") {
        const emptyIdx = p.inventory.findIndex(item => item === "빈 슬롯" || item === "사용함");
        if (emptyIdx !== -1) {
          p.inventory[emptyIdx] = "회복키트";
          log("회복 키트를 인벤토리에 보관했습니다. (Q 키로 사용)");
        } else {
          const healAmt = it.heal || 25;
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmt);
          log(`인벤토리가 가득 차 즉시 체력을 ${healAmt} 회복했습니다!`);
        }
        AudioSystem.playSfx(state, "pickup");
      }
      state.floor.pickups.splice(i, 1);
      FxSystem.spawnParticles(state, p.x + p.w/2, p.y + p.h/2, 5, "#ffd700", 2);
    }
  }

  for (let i = state.dashTrails.length - 1; i >= 0; i--) {
    state.dashTrails[i].alpha -= dt * 0.003;
    if (state.dashTrails[i].alpha <= 0) {
      state.dashTrails.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  if (state.mode !== "playing" || !state.running) return;
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

  if (state.running && state.floor) {
    updatePlayer(dt);
    updateEnemies(dt);
    state.cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, state.player.x - WIDTH * 0.35));
    state.runElapsedMs += dt;
    if (InputSystem.isPressed("e")) {
      // 1. 상점 체크 (B1 세이프존)
      if (state.floor.shop && CombatSystem.intersects(state.player, state.floor.shop)) {
        if (state.mode === "playing") showShop();
      } 
      // 2. 게이트 체크
      else if (state.floor.gateOpen && CombatSystem.intersects(state.player, state.floor.gate)) {
        nextFloor();
      }
    }
  }

  if (state.running) {
    FxSystem.updateParticles(state, dt);
    FxSystem.updateDamageTexts(state, dt);
    if (state.cameraShake > 0) state.cameraShake = Math.max(0, state.cameraShake - dt * 0.08);
  }

  // 층 정보가 없으면 배경만 검게 칠하고 리턴 (이름 입력 단계 등)
  if (!state.floor) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    requestAnimationFrame(loop);
    return;
  }

  RenderSystem.drawBackground(ctx, WIDTH, HEIGHT, state.floor.theme, ART_ASSETS, state.cameraX, state.floor.info.zone);
  ctx.save();
  const camX = Math.round(state.cameraX + (Math.random() - 0.5) * state.cameraShake);
  ctx.translate(-camX, 0);
  for (const plat of state.floor.platforms) RenderSystem.drawPlatform(ctx, plat, state.floor.theme, ART_ASSETS);
  for (const it of state.floor.pickups) RenderSystem.drawPickup(ctx, it);
  if (state.floor.shop) RenderSystem.drawShop(ctx, state.floor.shop, state.floor.theme);
  RenderSystem.drawGate(ctx, state.floor.gate, state.floor.gateOpen, state.floor.theme);
  for (const e of state.floor.enemies) RenderSystem.drawEnemy(ctx, e, ART_ASSETS, ART_FRAME_SPECS, state.floor.theme);
  for (const trail of state.dashTrails) RenderSystem.drawPlayerTrail(ctx, trail, ART_ASSETS, ART_FRAME_SPECS);
  RenderSystem.drawPlayer(ctx, state.player, ART_ASSETS, ART_FRAME_SPECS, state.floor.theme);
  RenderSystem.drawFx(ctx, state);
  ctx.restore();
  RenderSystem.drawHud(ctx, state.player, 
    () => state.floor.info.name, 
    state.runElapsedMs, 
    WIDTH, 
    state.floor.theme,
    state.floor.enemies.length
  );

  requestAnimationFrame(loop);
}

InputSystem.init((e, wasDown) => {
  AudioSystem.unlockAudio();
  if (wasDown) return; // 연속 입력(키 유지) 방지

  const key = e.key.toLowerCase();
  
  if (key === "r" && (state.mode === "dead" || state.mode === "clearChoice")) {
    startRun();
  }
  
  if (key === "h") {
    const layout = document.querySelector(".layout");
    if (layout) {
      layout.classList.toggle("show-panels");
      logEl.classList.remove("hidden");
      log("UI 패널 토글");
    }
  }
  
  if (key === "p") {
    togglePause();
  }

  if (key === "q") {
    const p = state.player;
    if (p && state.mode === "playing" && state.running) {
      const kitIdx = p.inventory.findIndex(item => item === "회복키트");
      if (kitIdx !== -1 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 50);
        p.inventory[kitIdx] = "사용함";
        AudioSystem.playSfx(state, "hit");
        log("회복키트 사용: HP +50");
      }
    }
  }

  // 이스터에그: 층 이동 (+ / -)
  // + 키는 대개 shift와 함께 눌려 '=' 로 인식되거나 '+' 자체로 인식됨
  if (e.key === "+" || e.key === "=") {
    nextFloor();
    log("이스터에그: 다음 층으로 이동");
  }
  if (e.key === "-") {
    prevFloor();
    log("이스터에그: 이전 층으로 이동");
  }
  if (e.key === "0") {
    state.player.gold += 100;
    log("이스터에그: 야근수당 +100 확보!");
  }

  if (state.mode === "skillSelect") {
    if (key === "1") pickSkill(0);
    if (key === "2") pickSkill(1);
    if (key === "3") pickSkill(2);
  }

  if (state.mode === "shop") {
    if (key === "1") buyShopItem(0);
    if (key === "2") buyShopItem(1);
    if (key === "3") buyShopItem(2);
    if (key === "escape" || key === "e" || key === "p") closeShop();
  }
});

window.addEventListener("blur", () => {
  togglePause(true);
});

showNameInput();
requestAnimationFrame(loop);

function enterFloor(idx, resetPlayerPos = false) {
  const info = FLOOR_PLAN[idx];
  if (!info) return;
  state.floorIndex = idx;

  const rand = () => Math.random();
  const profile = {
    mobNames: MONSTER_NAME_POOL[info.zone] || ["업무 스트레스"],
  };

  state.floor = FloorSystem.buildFloor({
    index: idx,
    info,
    rand,
    profile,
    worldWidth: WORLD_WIDTH,
    groundY: GROUND_Y,
    pickMobArchetype: (zone, name, floorIdx, r) => {
      return MonsterArchetypeSystem.pickArchetype(zone, name, floorIdx, r);
    },
    randomItemKey: () => "cpu",
    executiveMiniBosses: Config.EXECUTIVE_MINI_BOSSES
  });
  // 테마 정보 할당 (렌더링에 필수)
  state.floor.theme = Config.THEMES[info.zone] || Config.THEMES.parking;

  if (resetPlayerPos) {
    state.player.x = 90;
    state.player.y = GROUND_Y - state.player.h;
  }
  state.cameraX = 0;
  log(`${info.name} 진입`);
}

function nextFloor() {
  if (state.floorIndex < FLOOR_PLAN.length - 1) {
    enterFloor(state.floorIndex + 1, true);
  } else {
    onWin();
  }
}

function prevFloor() {
  if (state.floorIndex > 0) {
    enterFloor(state.floorIndex - 1, true);
  }
}

function onDeath() {
  state.mode = "dead";
  state.running = false;

  // 사망 시 런 정보 초기화
  SaveSystem.clearRunSnapshot(localStorage, SAVE_STORAGE_KEY);

  overlayEl.classList.remove("hidden");
  overlayEl.innerHTML = `
    <div style="text-align:center;">
      <h1 style="color:#ff4444; font-size:3rem;">K.O.</h1>
      <p>과로로 쓰러졌습니다...</p>
      <button onclick="location.reload()" style="padding:10px 20px; font-size:1.2rem; cursor:pointer; background:#444; color:#fff; border:none; border-radius:5px;">다시 시작 (R)</button>
    </div>
  `;
}

function onWin() {
  state.mode = "clear";
  state.running = false;
  
  // 클리어 시 진행 중인 런 세이브 삭제
  SaveSystem.clearRunSnapshot(localStorage, SAVE_STORAGE_KEY);

  overlayEl.classList.remove("hidden");
  overlayEl.innerHTML = `
    <div style="text-align:center;">
      <h1 style="color:#ffd700; font-size:3rem;">퇴근 성공!</h1>
      <p>무사히 회사를 탈출했습니다!</p>
      <button onclick="location.reload()" style="padding:10px 20px; font-size:1.2rem; cursor:pointer; background:#ffd700; color:#000; border:none; border-radius:5px;">처음으로</button>
    </div>
  `;
}

function showSkillSelection() {
  state.mode = "skillSelect";
  state.running = false;
  
  // 랜덤 스킬 3개 추첨
  const pools = SKILL_TEMPLATES.map(t => ({ ...t, rolled: t.roll() }));
  const shuffled = pools.sort(() => 0.5 - Math.random()).slice(0, 3);
  state.pendingSkills = shuffled;

  overlayEl.classList.remove("hidden");
  overlayEl.innerHTML = `
    <div style="text-align:center; width:100%;">
      <h2 style="color:#8de0c3; margin-bottom:20px;">레벨 업! 스킬을 선택하세요</h2>
      <div style="display:flex; justify-content:center; gap:20px;">
        ${shuffled.map((s, i) => `
          <div style="background:rgba(0,0,0,0.7); border:2px solid #444; padding:15px; width:200px; cursor:pointer;" onclick="window.gameState.pickSkill(${i})">
            <h3 style="margin:0; color:#fff;">${i+1}. ${s.label}</h3>
            <p style="font-size:0.9rem; color:#ccc;">${s.rolled.desc}</p>
          </div>
        `).join('')}
      </div>
      <p style="margin-top:20px; font-size:0.9rem; color:#aaa;">숫자 키 1, 2, 3 을 눌러 선택하세요</p>
    </div>
  `;
}

function pickSkill(index) {
  if (state.mode !== "skillSelect") return;
  const s = state.pendingSkills[index];
  if (!s) return;

  s.rolled.apply(state.player);
  state.player.skillNames.push(s.rolled.tag);
  log(`선택됨: ${s.label} (${s.rolled.desc})`);
  
  state.mode = "playing";
  state.running = true;
  overlayEl.classList.add("hidden");
  state.pendingSkills = null;
}
window.gameState.pickSkill = pickSkill; // 글로벌 노출

function showShop() {
  state.mode = "shop";
  state.running = false;
  overlayEl.classList.remove("hidden");
  overlayEl.innerHTML = `
    <div style="text-align:center; width:100%;">
      <h2 style="color:#ffd700; margin-bottom:20px;">지하 1층 보급소 (보유 야근수당: ${state.player.gold})</h2>
      <div style="display:flex; justify-content:center; gap:20px;">
        ${Config.SHOP_OPTIONS.map((opt, i) => `
          <div style="background:rgba(0,0,0,0.7); border:2px solid #e67e22; padding:15px; width:220px;">
            <h3 style="margin:0; color:#fff;">${i+1}. ${opt.label}</h3>
            <p style="font-size:0.85rem; color:#ccc;">${opt.desc}</p>
            <p style="color:#ffd700; font-weight:bold;">비용: ${opt.cost}</p>
          </div>
        `).join('')}
      </div>
      <p style="margin-top:20px; color:#aaa;">숫자 키 1, 2, 3 을 눌러 구매 | <b>ESC / P / E</b> 키로 나가기</p>
    </div>
  `;
}

function buyShopItem(index) {
  if (state.mode !== "shop") return;
  const opt = Config.SHOP_OPTIONS[index];
  if (!opt) return;

  if (state.player.gold < opt.cost) {
    log(`야근수당이 부족합니다! (필요: ${opt.cost})`);
    return;
  }

  state.player.gold -= opt.cost;
  
  if (opt.id === "heal") {
    const emptyIdx = state.player.inventory.findIndex(item => item === "빈 슬롯" || item === "사용함");
    if (emptyIdx !== -1) {
      state.player.inventory[emptyIdx] = "회복키트";
      log("회복 키트를 구매했습니다.");
    } else {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 60);
      log("인벤토리가 가득 차 즉시 체력을 회복했습니다.");
    }
  } else if (opt.id === "reroll") {
    const w = Config.WEAPON_CATALOG[Math.floor(Math.random() * Config.WEAPON_CATALOG.length)];
    PlayerSystem.equipWeapon(state.player, w);
    log(`구매 완료: 키보드 교체 (${w.name} 장착!)`);
  } else if (opt.id === "artifact") {
    const keys = Object.keys(Config.itemCatalog);
    const itemId = keys[Math.floor(Math.random() * keys.length)];
    const item = Config.itemCatalog[itemId];
    
    if (itemId === "cpu") state.player.damageMul += 0.04;
    else if (itemId === "ram") { state.player.maxHp += 5; state.player.hp += 5; }
    else if (itemId === "badge") state.player.speedMul += 0.03;
    
    if (!state.player.artifacts) state.player.artifacts = [];
    state.player.artifacts.push({ id: itemId, label: item.label, desc: item.desc });
    log(`구매 완료: 영구 업그레이드 (${item.label} 획득)`);
  }

  showShop();
}

function closeShop() {
  state.mode = "playing";
  state.running = true;
  overlayEl.classList.add("hidden");
  log("상점을 나옵니다.");
}
