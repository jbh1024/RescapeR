import { RescapeRUtils as Utils } from './systems/utils.js';
import { RescapeRConfig as Config } from './systems/data-config.js';
import { RescapeRAudioSystem as AudioSystem } from './systems/audio-system.js';
import { RescapeRFxSystem as FxSystem } from './systems/fx-system.js';
import { RescapeRAssetManager as AssetManager } from './systems/asset-manager.js';
import { RescapeRSaveSystem as SaveSystem } from './systems/save-system.js';
import { RescapeRCombatSystem as CombatSystem } from './systems/combat-system.js';
import { RescapeRUiSystem as UiSystem } from './systems/ui-system.js';
import { RescapeRRankingSystem as RankingSystem } from './systems/ranking-system.js';
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
const APP_VERSION = "v1.2.0";
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
  // 새 게임 시작 시 이전 런 데이터 및 영구 업그레이드 초기화
  localStorage.clear();
  state.meta = SaveSystem.loadMeta(localStorage, META_STORAGE_KEY);
  
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

  // 대기 중인 랭킹 기록이 있다면 재전송 시도
  RankingSystem.retryBufferedRecords();
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

  // 우측 하단 바닥면 버전 표시
  ctx.save();
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  ctx.fillText(APP_VERSION, WIDTH - 10, GROUND_Y - 5);
  ctx.restore();

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

  if (key === "k") {
    if (state.mode === "ranking") {
      // 1. 이미 랭킹 보드가 열려있는 경우 -> 닫기
      overlayEl.classList.add("hidden");
      state.mode = state.prevMode || "playing";
      if (state.mode === "playing") state.running = true;
    } else if (state.mode === "playing") {
      // 2. 게임 플레이 중인 경우 -> 랭킹 보드 열기
      state.prevMode = state.mode;
      state.mode = "ranking";
      state.running = false; // 게임 일시정지
      
      UiSystem.showRankingBoard(overlayEl, RankingSystem, () => {
        // '닫기' 버튼(DOM) 클릭 시 처리
        if (state.mode === "ranking") {
          state.mode = state.prevMode || "playing";
          if (state.mode === "playing") state.running = true;
        }
      });
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

  const isPanelOpen = document.querySelector(".layout")?.classList.contains("show-panels");

  if (isPanelOpen && e.ctrlKey) {
    if (e.code === "BracketLeft") prevFloor();
    if (e.code === "BracketRight") nextFloor();
    if (e.code === "Digit0") state.player.gold += 100;
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

  const timeStr = UiSystem.formatDuration(state.runElapsedMs);
  const grade = UiSystem.gradeByTime(state.runElapsedMs);
  const finalPay = state.player.gold || 0;

  overlayEl.classList.remove("hidden");
  
  // 공통 버튼 스타일 정의
  const btnStyle = `
    padding: 15px 30px;
    font-size: 1.2rem;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    transition: transform 0.2s, background 0.2s;
    min-width: 200px;
  `;

  overlayEl.innerHTML = `
    <div style="text-align:center; background:rgba(0,0,0,0.85); padding:40px; border-radius:20px; border:3px solid #ffd700; box-shadow:0 0 30px rgba(255,215,0,0.3);">
      <h1 style="color:#ffd700; font-size:4rem; margin-bottom:10px; text-shadow:2px 2px 4px rgba(0,0,0,0.5);">퇴근 성공!</h1>
      <p style="font-size:1.5rem; color:#fff; margin-bottom:30px;">축하합니다! 무사히 회사를 탈출했습니다!</p>
      
      <div style="background:rgba(255,255,255,0.1); padding:20px; border-radius:15px; margin-bottom:30px; display:inline-block; min-width:350px;">
        <p style="font-size:1.2rem; color:#ffd700; margin:10px 0;"><b>총 소요 시간:</b> <span style="font-size:1.8rem; color:#fff; margin-left:10px;">${timeStr}</span></p>
        <p style="font-size:1.2rem; color:#ffd700; margin:10px 0;"><b>남은 야근수당:</b> <span style="font-size:1.8rem; color:#fff; margin-left:10px;">${finalPay.toLocaleString()}</span></p>
        <p style="font-size:1.2rem; color:#8de0c3; margin:10px 0;"><b>최종 평가:</b> <span style="font-size:1.8rem; color:#fff; margin-left:10px;">${grade}</span></p>
      </div>
      
      <br>
      <div style="display:flex; justify-content:center; gap:20px;">
        <button id="submit-ranking-btn" style="${btnStyle} background:#ffd700; color:#000;">명예의 전당 등록</button>
        <button id="skip-ranking-btn" style="${btnStyle} background:#444; color:#fff;">그냥 퇴근하기</button>
      </div>
    </div>
  `;

  document.getElementById("submit-ranking-btn").onclick = async () => {
    const btn = document.getElementById("submit-ranking-btn");
    btn.disabled = true;
    btn.innerText = "제출 중...";
    
    const result = await RankingSystem.submitRecord(state.player.codename, state.runElapsedMs, state.player.gold);
    if (result.success) {
      alert("명예의 퇴근 명부에 등록되었습니다!");
      // 랭킹 보드 표시 후 닫으면 새로고침(초기화면)
      UiSystem.showRankingBoard(overlayEl, RankingSystem, () => {
        location.reload();
      });
    } else if (result.buffered) {
      alert("서버 연결 실패로 인해 기록이 로컬에 저장되었습니다. 나중에 자동으로 전송됩니다.");
      location.reload();
    } else {
      const errMsg = result.error || "등록에 실패했습니다.";
      alert(`등록 실패: ${errMsg}`);
      btn.disabled = false;
      btn.innerText = "명예의 전당 등록";
    }
  };

  document.getElementById("skip-ranking-btn").onclick = () => {
    location.reload();
  };
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
      <div style="margin-top:15px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; display:inline-block; text-align:left; font-size:0.8rem; color:#999; line-height:1.5; border:1px solid #333;">
        <div style="margin-bottom:4px;"><b>[스킬별 제한 사항]</b></div>
        • <b>회복호흡</b>: 초당 재생량 최대 2, 최대 2중첩까지만 적용<br>
        • <b>강철몸</b>: 받는 피해 감소 효과는 최대 -50%까지만 제한<br>
        • <b>정밀사격</b>: 치명타 확률은 최대 30%까지만 중첩 가능
      </div>
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
