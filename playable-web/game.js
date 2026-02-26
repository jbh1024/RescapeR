const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const statsEl = document.getElementById("stats");
const logEl = document.getElementById("log");
const controlsEl = document.getElementById("controls");
const layoutEl = document.querySelector(".layout");
const overlayEl = document.getElementById("overlay");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = HEIGHT - 75;
const WORLD_WIDTH = 3200;
const ENABLE_RANGED_ATTACKS = false;
const ENEMY_AOE_SCALE = 0.78;
const APP_VERSION = "1.0.7-gameplay2";
const META_STORAGE_KEY = "rescaperMeta";
const SAVE_STORAGE_KEY = "rescaperSave";
const SETTINGS_STORAGE_KEY = "rescaperSettings";
let audioCtx = null;
let audioUnlocked = false;
const SaveSystem = window.RescapeRSaveSystem;
const CombatSystem = window.RescapeRCombatSystem;
const UiSystem = window.RescapeRUiSystem;
const RenderSystem = window.RescapeRRenderSystem;
const MonsterArchetypeSystem = window.RescapeRMonsterArchetypeSystem;
const FloorSystem = window.RescapeRFloorSystem;

if (!SaveSystem || !CombatSystem || !UiSystem || !RenderSystem || !MonsterArchetypeSystem || !FloorSystem) {
  throw new Error("RescapeR system scripts are missing.");
}

const ART_ASSET_PATHS = {
  player: {
    stand: "assets/sprites/player/wishforge_player_idle.png",
    jump: "assets/sprites/player/wishforge_player_jump.png",
    hurt: "assets/sprites/player/wishforge_player_fall.png",
  },
  monsters: {
    dark_guard: "assets/sprites/monsters/wishforge_enemy_dark_guard.png",
    necromancer: "assets/sprites/monsters/wishforge_enemy_necromancer.png",
    goblin: "assets/sprites/monsters/wishforge_enemy_goblin.png",
    goblin_hog: "assets/sprites/monsters/wishforge_enemy_goblin_hog.png",
    bat: "assets/sprites/monsters/wishforge_enemy_bat.png",
    frog: "assets/sprites/monsters/wishforge_enemy_frog.png",
    snail: "assets/sprites/monsters/wishforge_enemy_snail.png",
    skull_slime: "assets/sprites/monsters/wishforge_enemy_skull_slime.png",
    golem: "assets/sprites/monsters/wishforge_enemy_golem.png",
    mushroom: "assets/sprites/monsters/wishforge_enemy_mushroom.png",
  },
  tiles: {
    stoneMid: "assets/sprites/tiles/wishforge_tile_01.png",
    grassMid: "assets/sprites/tiles/wishforge_tile_14.png",
    brickWall: "assets/sprites/tiles/wishforge_cave_under_tile.png",
  },
  ui: {
    lives: "assets/sprites/ui/wishforge_ui_lives.png",
    boss: "assets/sprites/ui/wishforge_ui_boss_icon.png",
    popupBg: "assets/sprites/ui/wishforge_ui_popup_bg.png",
  },
  backgrounds: {
    mergedDark: "assets/sprites/backgrounds/wishforge_bg_merged_dark.png",
    sky: "assets/sprites/backgrounds/wishforge_bg_sky.png",
    mountains: "assets/sprites/backgrounds/wishforge_bg_mountains.png",
    trees01: "assets/sprites/backgrounds/wishforge_bg_trees_01.png",
    trees02: "assets/sprites/backgrounds/wishforge_bg_trees_02.png",
  },
};

const ART_FRAME_SPECS = {
  player: {
    stand: { x: 0, y: 0, w: 24, h: 24 },
    jump: { x: 24, y: 0, w: 24, h: 24 },
    hurt: { x: 0, y: 0, w: 24, h: 24 },
  },
  monsters: {
    dark_guard: { w: 39, h: 49 },
    necromancer: { w: 32, h: 32 },
    goblin: { w: 32, h: 32 },
    goblin_hog: { w: 32, h: 32 },
    bat: { w: 32, h: 32 },
    frog: { w: 24, h: 24 },
    snail: { w: 24, h: 24 },
    skull_slime: { w: 32, h: 24 },
    golem: { w: 48, h: 48 },
    mushroom: { w: 24, h: 24 },
  },
  ui: {
    lives: { w: 11, h: 11 },
  },
};

function loadImageAsset(src) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return img;
}

function loadArtAssets(tree) {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    out[key] = typeof value === "string" ? loadImageAsset(value) : loadArtAssets(value);
  }
  return out;
}

const ART_ASSETS = loadArtAssets(ART_ASSET_PATHS);

let infoPanelsVisible = false;

function ensureRankingMeta(meta) {
  if (!meta.ranking || typeof meta.ranking !== "object") {
    meta.ranking = { totalClears: 0, bestClearTimeMs: 0, lastClearTimeMs: 0 };
  } else {
    meta.ranking.totalClears = Math.max(0, meta.ranking.totalClears || 0);
    meta.ranking.bestClearTimeMs = Math.max(0, meta.ranking.bestClearTimeMs || 0);
    meta.ranking.lastClearTimeMs = Math.max(0, meta.ranking.lastClearTimeMs || 0);
  }
  if (!Array.isArray(meta.clearRecords)) {
    meta.clearRecords = [];
  }
  meta.clearRecords = meta.clearRecords
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      clearCount: Math.max(0, r.clearCount || 0),
      clearTimeMs: Math.max(0, r.clearTimeMs || 0),
      deathCount: Math.max(0, r.deathCount || 0),
      at: typeof r.at === "number" ? r.at : Date.now(),
    }));
  meta.ranking.totalClears = Math.max(meta.ranking.totalClears, meta.totalClears || 0);
  if (!meta.ranking.bestClearTimeMs || ((meta.bestTimeMs || 0) > 0 && meta.bestTimeMs < meta.ranking.bestClearTimeMs)) {
    meta.ranking.bestClearTimeMs = meta.bestTimeMs || meta.ranking.bestClearTimeMs;
  }
}

function rankingRecordCompare(a, b) {
  if ((a.clearCount || 0) !== (b.clearCount || 0)) return (b.clearCount || 0) - (a.clearCount || 0);
  if ((a.clearTimeMs || 0) !== (b.clearTimeMs || 0)) return (a.clearTimeMs || 0) - (b.clearTimeMs || 0);
  return (a.at || 0) - (b.at || 0);
}

function getSortedRankingRecords(limit = 5) {
  ensureRankingMeta(state.meta);
  return [...state.meta.clearRecords]
    .sort(rankingRecordCompare)
    .slice(0, Math.max(1, limit));
}

function buildRankingLines(limit = 5) {
  const rows = getSortedRankingRecords(limit);
  if (!rows.length) return ["기록 없음"];
  return rows.map((r, idx) =>
    `${idx + 1}. ${r.clearCount}회 / ${formatDuration(r.clearTimeMs)} / 데스 ${r.deathCount}`
  );
}

// ============================================
// 상수 및 설정
// ============================================
const FLOOR_PLAN = [
  { n: -6, name: "지하 6층 심연 주차장", zone: "parking", boss: "주차관리 팀장 · 휘슬러" },
  { n: -5, name: "지하 5층 심연 주차장", zone: "parking", boss: "주차관리 팀장 · 휘슬러" },
  { n: -4, name: "지하 4층 심연 주차장", zone: "parking", boss: "주차관리 팀장 · 휘슬러" },
  { n: -3, name: "지하 3층 심연 주차장", zone: "parking", boss: "주차관리 팀장 · 휘슬러" },
  { n: -2, name: "지하 2층 심연 주차장", zone: "parking", boss: "주차관리 팀장 · 휘슬러" },
  { n: -1, name: "지하 1층 보급소", zone: "cafeteria", safeZone: true },
  { n: 1, name: "1층 관문 로비", zone: "lobby", boss: "보안실장 · 무결점 게이트" },
  { n: 2, name: "2층 전시 쇼룸", zone: "showroom", boss: "PPT 빌런 · 512슬라이드" },
  { n: 3, name: "3층 전시 쇼룸", zone: "showroom", boss: "PPT 빌런 · 512슬라이드" },
  { n: 4, name: "4층 혼돈 모바일/UX", zone: "mobile", boss: "가챠 중독자 · 확률조작단" },
  { n: 5, name: "5층 서버 웹/클라우드", zone: "server", boss: "풀스택 거미 · 스레드 위버" },
  { n: 6, name: "6층 글리치 QA/AI", zone: "glitch", boss: "버그 헌터 · 리포트 파쇄자" },
  { n: 7, name: "7층 확산 마케팅", zone: "marketing", boss: "바이럴 확성기 · 클릭 유도왕" },
  { n: 8, name: "8층 지원 센터", zone: "support", boss: "실적 압박맨 · KPI 집행자" },
  { n: 9, name: "9층 권력 임원실", zone: "executive", boss: "대표이사 (CEO) · 야근 선언자", finalBoss: true },
];

const THEMES = {
  parking: { bg: ["#1f2b36", "#0f151f"], wall: "#2c3e50", floor: "#1f2937", accent: "#4a627a" },
  cafeteria: { bg: ["#4a2d12", "#24160a"], wall: "#e67e22", floor: "#6a3a14", accent: "#ffb266" },
  lobby: { bg: ["#bdc3c7", "#6c757d"], wall: "#ecf0f1", floor: "#8f9ca7", accent: "#ffffff" },
  showroom: { bg: ["#1abc9c", "#0c6a59"], wall: "#67dac7", floor: "#12947f", accent: "#d6fff7" },
  mobile: { bg: ["#9b59b6", "#4b2a59"], wall: "#c184db", floor: "#6f3f83", accent: "#f0cfff" },
  server: { bg: ["#2ecc71", "#12683b"], wall: "#78e6a6", floor: "#1d9152", accent: "#e5ffef" },
  glitch: { bg: ["#e74c3c", "#7b1f16"], wall: "#ff8f84", floor: "#b5372a", accent: "#ffe4e1" },
  marketing: { bg: ["#f1c40f", "#7f6608"], wall: "#ffe27a", floor: "#ba980d", accent: "#fff7d1" },
  support: { bg: ["#d35400", "#6b2800"], wall: "#ee8d4d", floor: "#a74200", accent: "#ffd8bf" },
  executive: { bg: ["#8e44ad", "#3f1f4d"], wall: "#b786ca", floor: "#6c3383", accent: "#f2d9ff" },
};

const ELEVATOR_QUOTES = [
  "오늘 점심 메뉴가 뭐였지...",
  "아무 말 없이 숫자만 올라간다.",
  "어색한 침묵이 엘리베이터를 채운다.",
  "누군가 한숨 쉬는 소리가 들린다.",
  "눈을 마주치지 않으려 모두 바닥만 본다.",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pctText(v) {
  return `${Math.round(v * 100)}%`;
}

function inferSkillIdsFromNames(names) {
  if (!Array.isArray(names)) return [];
  const map = {
    power: ["강공"],
    vital: ["강인함"],
    swift: ["민첩"],
    blade: ["연속베기"],
    dash: ["가속대시"],
    leech: ["흡혈"],
    crit: ["정밀사격"],
    critdmg: ["치명강타"],
    guard: ["강철몸"],
    regen: ["회복호흡"],
    reach: ["리치확장"],
    execute: ["마무리"],
  };
  const found = [];
  for (const [id, keys] of Object.entries(map)) {
    if (names.some((n) => typeof n === "string" && keys.some((k) => n.includes(k)))) {
      found.push(id);
    }
  }
  return found;
}

const SKILL_TEMPLATES = [
  {
    id: "power",
    label: "강공",
    roll: () => {
      const v = randInt(10, 26) / 100;
      return { desc: `공격력 +${pctText(v)}`, tag: `강공+${pctText(v)}`, apply: (p) => { p.damageMul += v; } };
    },
  },
  {
    id: "vital",
    label: "강인함",
    roll: () => {
      const v = randInt(12, 36);
      return { desc: `HP +${v}`, tag: `강인함+${v}`, apply: (p) => { p.maxHp += v; p.hp += v; } };
    },
  },
  {
    id: "swift",
    label: "민첩",
    roll: () => {
      const v = randInt(6, 18) / 100;
      return { desc: `이동속도 +${pctText(v)}`, tag: `민첩+${pctText(v)}`, apply: (p) => { p.speedMul += v; } };
    },
  },
  {
    id: "blade",
    label: "연속베기",
    roll: () => {
      const v = randInt(8, 24) / 100;
      return { desc: `공격 쿨타임 -${pctText(v)}`, tag: `연속-${pctText(v)}`, apply: (p) => { p.attackCdMul *= (1 - v); } };
    },
  },
  {
    id: "dash",
    label: "가속대시",
    roll: () => {
      const v = randInt(10, 26) / 100;
      return { desc: `대시 쿨타임 -${pctText(v)}`, tag: `대시-${pctText(v)}`, apply: (p) => { p.dashCdMul *= (1 - v); } };
    },
  },
  {
    id: "leech",
    label: "흡혈",
    roll: () => {
      const v = randInt(2, 8);
      return { desc: `처치시 HP +${v}`, tag: `흡혈+${v}`, apply: (p) => { p.lifeStealOnKill += v; } };
    },
  },
  {
    id: "crit",
    label: "정밀사격",
    roll: () => {
      const v = randInt(4, 14) / 100;
      return { desc: `치명타 확률 +${pctText(v)}`, tag: `치확+${pctText(v)}`, apply: (p) => { p.critChance += v; } };
    },
  },
  {
    id: "critdmg",
    label: "치명강타",
    roll: () => {
      const v = randInt(12, 35) / 100;
      return { desc: `치명타 피해 +${pctText(v)}`, tag: `치피+${pctText(v)}`, apply: (p) => { p.critDamageMul += v; } };
    },
  },
  {
    id: "guard",
    label: "강철몸",
    roll: () => {
      const v = randInt(5, 16) / 100;
      return { desc: `받는 피해 -${pctText(v)}`, tag: `방어-${pctText(v)}`, apply: (p) => { p.damageTakenMul *= (1 - v); } };
    },
  },
  {
    id: "regen",
    label: "회복호흡",
    roll: () => {
      const v = randInt(1, 4);
      return { desc: `초당 HP +${v} 재생`, tag: `재생+${v}`, apply: (p) => { p.regenPerSec += v; } };
    },
  },
  {
    id: "reach",
    label: "리치확장",
    roll: () => {
      const v = randInt(4, 14);
      return { desc: `근접 사거리 +${v}`, tag: `사거리+${v}`, apply: (p) => { p.skillReachBonus += v; } };
    },
  },
  {
    id: "execute",
    label: "마무리",
    roll: () => {
      const threshold = randInt(20, 35) / 100;
      const mul = randInt(12, 35) / 100;
      return {
        desc: `적 HP ${pctText(threshold)} 이하 공격 시 피해 +${pctText(mul)}`,
        tag: `마무리+${pctText(mul)}`,
        apply: (p) => {
          p.executeThreshold = Math.max(p.executeThreshold, threshold);
          p.executeDamageMul += mul;
        },
      };
    },
  },
];

const itemCatalog = {
  cpu: { label: "튜닝된 CPU", desc: "공격력 +4%", apply: (m) => (m.damageBonus += 0.04) },
  ram: { label: "증설 RAM", desc: "HP +5", apply: (m) => (m.maxHpBonus += 5) },
  badge: { label: "출입증 배지", desc: "이동속도 +3%", apply: (m) => (m.speedBonus += 0.03) },
};

const WEAPON_CATALOG = [
  { id: "weapon_keyboard_membrane", tier: "Common", name: "번들 멤브레인", desc: "기본 지급품", attackMul: 1.0, attackCdMul: 1.0, feature: "기본 공격" },
  { id: "weapon_keyboard_dusty", tier: "Common", name: "비품실 키보드", desc: "먼지가 풀풀", attackMul: 1.05, attackCdMul: 1.03, feature: "먼지 이펙트" },
  { id: "weapon_keyboard_blue", tier: "Rare", name: "PC방 청축", desc: "소음공해", attackMul: 1.12, attackCdMul: 0.95, feature: "치명타 확률 증가" },
  { id: "weapon_keyboard_red", tier: "Rare", name: "저소음 적축", desc: "암살", attackMul: 1.15, attackCdMul: 0.92, feature: "후방 공격 강화" },
  { id: "weapon_keyboard_rgb", tier: "Epic", name: "RGB 게이밍", desc: "LED 잔상", attackMul: 1.25, attackCdMul: 0.9, feature: "속성 장판" },
  { id: "weapon_keyboard_aluminum", tier: "Epic", name: "풀 알루미늄", desc: "통울림", attackMul: 1.35, attackCdMul: 1.12, feature: "강경직" },
  { id: "weapon_keyboard_capacitive", tier: "Legendary", name: "무접점 끝판왕", desc: "정숙 극타", attackMul: 1.4, attackCdMul: 0.95, feature: "근접 타건 안정화" },
  { id: "weapon_keyboard_split", tier: "Legendary", name: "인체공학 스플릿", desc: "이도류", attackMul: 1.2, attackCdMul: 0.75, feature: "초고속 연타" },
];

const WEAPON_AFFIXES = [
  { id: "sticky", label: "Sticky", feature: "적 이동속도 감소" },
  { id: "wireless", label: "Wireless", feature: "근접 입력 지연 감소" },
  { id: "macro", label: "Macro", feature: "버튼 유지 자동 연타" },
];

const SHOP_OPTIONS = [
  { id: "heal", key: "1", label: "에너지 드링크", cost: 30, desc: "HP +60 (최대치까지)" },
  { id: "reroll", key: "2", label: "키보드 재보급", cost: 120, desc: "무기/어픽스 랜덤 재지급" },
  { id: "artifact", key: "3", label: "영구 업그레이드", cost: 180, desc: "영구 아이템 1개 랜덤 획득" },
];

const ENEMY_MUTATORS = {
  berserk: {
    label: "광폭",
    color: "#ff9f7a",
    apply: (e) => {
      e.speed *= 1.24;
      e.damage = Math.round(e.damage * 1.15);
      e.hp = Math.round(e.hp * 0.92);
      e.maxHp = Math.round(e.maxHp * 0.92);
      e.xp = Math.round(e.xp * 1.18);
      e.goldBonusMul = 1.12;
    },
  },
  fortress: {
    label: "요새",
    color: "#9bd6ff",
    apply: (e) => {
      e.speed *= 0.85;
      e.damage = Math.round(e.damage * 1.05);
      e.hp = Math.round(e.hp * 1.45);
      e.maxHp = Math.round(e.maxHp * 1.45);
      e.xp = Math.round(e.xp * 1.28);
      e.goldBonusMul = 1.18;
    },
  },
  blink: {
    label: "질주",
    color: "#c7b4ff",
    apply: (e) => {
      e.speed *= 1.38;
      e.damage = Math.round(e.damage * 1.08);
      e.hp = Math.round(e.hp * 0.86);
      e.maxHp = Math.round(e.maxHp * 0.86);
      e.xp = Math.round(e.xp * 1.22);
      e.goldBonusMul = 1.16;
    },
  },
};

const SPECIAL_EVENT_ROOM_BY_ZONE = {
  parking: [
    { id: "overclock_charge", label: "비상 발전실", hint: "오버클럭 충전", color: "#87d9ff" },
    { id: "payroll_cache", label: "현금 정산기", hint: "야근수당 인출", color: "#ffe08a" },
  ],
  lobby: [
    { id: "armor_patch", label: "보안 프로토콜", hint: "피해 완화", color: "#b8e3ff" },
    { id: "payroll_cache", label: "경비 예산 금고", hint: "야근수당 인출", color: "#ffe08a" },
  ],
  showroom: [
    { id: "skill_cache", label: "데모 스테이지", hint: "전투 경험치", color: "#9dffe8" },
    { id: "overclock_charge", label: "조명 제어실", hint: "오버클럭 충전", color: "#8ff7ff" },
  ],
  mobile: [
    { id: "risk_trade", label: "가챠 단말기", hint: "위험-보상 거래", color: "#e6b8ff" },
    { id: "skill_cache", label: "AB 테스트 랩", hint: "전투 경험치", color: "#d5c2ff" },
  ],
  server: [
    { id: "weapon_tune", label: "서버 튜닝실", hint: "무기 가속", color: "#9dffc9" },
    { id: "overclock_charge", label: "UPS 제어실", hint: "오버클럭 충전", color: "#a8ffd7" },
  ],
  glitch: [
    { id: "recovery_pod", label: "핫픽스 스테이션", hint: "긴급 회복", color: "#ffb5b5" },
    { id: "weapon_tune", label: "패치 컴파일러", hint: "무기 가속", color: "#ffcc9d" },
  ],
  marketing: [
    { id: "gold_contract", label: "바이럴 계약실", hint: "골드 보너스", color: "#fff3a0" },
    { id: "payroll_cache", label: "성과급 정산기", hint: "야근수당 인출", color: "#ffe08a" },
  ],
  support: [
    { id: "recovery_pod", label: "상담 회복실", hint: "긴급 회복", color: "#ffd8b0" },
    { id: "armor_patch", label: "매뉴얼 보정실", hint: "피해 완화", color: "#ffd0bf" },
  ],
  executive: [
    { id: "artifact_vault", label: "비밀 결재함", hint: "아티팩트 지급", color: "#f1c8ff" },
    { id: "gold_contract", label: "특별 인센티브실", hint: "골드 보너스", color: "#e7b3ff" },
  ],
};

const PLAYER_CALLSIGN = {
  parking: "지하 탈출러",
  cafeteria: "식권 검객",
  lobby: "출입증 파쇄자",
  showroom: "회의 브레이커",
  mobile: "알림 차단자",
  server: "트래픽 도살자",
  glitch: "버그 정리반",
  marketing: "노이즈 사일런서",
  support: "민원 종결자",
  executive: "칼퇴 집행관",
};

const MONSTER_NAME_POOL = {
  parking: ["세단 미믹", "매연 유령", "불법주차 골렘", "후진 알람 정령", "주차딱지 집행관", "차단기 망령"],
  cafeteria: ["식판 병사", "식권 수금봇", "국밥 연기 요정", "잔반 심판관", "국자 드론", "셀프바 포식자"],
  lobby: ["CCTV 비홀더", "출입게이트 파수견", "보안 로그 핏덩이", "QR 인증 파수병", "방문증 몰수자", "대리석 잔향체"],
  showroom: ["마네킹 예스맨", "레이저 포인터령", "회의실 반사체", "유리벽 스토커", "데모 장표 악령", "베스트프랙티스 망령"],
  mobile: ["터치 제스처", "푸시 알림 떼", "랜덤박스 임프", "무한스크롤 정령", "팝톡 스팸러", "리텐션 집착귀"],
  server: ["버그 떼", "패킷 거머리", "스택트레이스 망령", "CPU 스로틀러", "로그 폭풍령", "케이블 덩굴괴수"],
  glitch: ["도플갱어", "404 잔상", "예외처리 망령", "Null 포식자", "테스트 누락체", "리그레션 환영"],
  marketing: ["팝업창 방패병", "클릭베이트 박쥐", "브랜딩 메아리", "CTR 유혹자", "바이럴 스피커", "광고소재 미믹"],
  support: ["콜센터 히드라", "대기열 포식자", "실적 스캐너", "클레임 되감기", "전화벨 폴터가이스트", "상담 스크립트 골렘"],
  executive: ["인사팀 암살자", "결재 도장 골렘", "리스크 심사관", "회의록 검열관", "보고서 사냥개", "비용절감 감찰관"],
};

const EXECUTIVE_MINI_BOSSES = [
  "전략총괄 상무 · KPI 브리처",
  "재무총괄 전무 · 코스트 커터",
  "인사총괄 전무 · 평가 집행관",
  "법무실장 · 컴플라이언스 블레이드",
];
const CHARACTER_STYLES = {
  vanguard: {
    name: "선봉형",
    hpBonus: 34,
    damageMul: 1.08,
    speedMul: 0.94,
    attackCdMul: 1.06,
    dashCdMul: 1.08,
    reachBonus: 4,
    armorMul: 0.88,
    dodgeChance: 0,
    attackTint: "#9dd6ff",
    desc: "생존력이 높고 전선 유지에 강함",
  },
  striker: {
    name: "돌격형",
    hpBonus: 12,
    damageMul: 1.16,
    speedMul: 1.04,
    attackCdMul: 0.93,
    dashCdMul: 0.96,
    reachBonus: 8,
    armorMul: 1,
    dodgeChance: 0,
    attackTint: "#ffd28a",
    desc: "표준형 대비 화력과 압박이 강함",
  },
  phantom: {
    name: "유령형",
    hpBonus: -14,
    damageMul: 1.06,
    speedMul: 1.22,
    attackCdMul: 0.82,
    dashCdMul: 0.8,
    reachBonus: 12,
    armorMul: 1.02,
    dodgeChance: 0.2,
    attackTint: "#d8b7ff",
    desc: "고기동 암살형, 회피 확률 보유",
  },
};

function randomCombatStyleId() {
  const keys = Object.keys(CHARACTER_STYLES);
  return keys[Math.floor(Math.random() * keys.length)] || "striker";
}

function nextCombatStyleId(currentId) {
  const keys = Object.keys(CHARACTER_STYLES);
  const idx = keys.indexOf(currentId);
  return keys[(idx + 1 + keys.length) % keys.length];
}

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

function unlockAudio() {
  const ctxRef = ensureAudioContext();
  if (!ctxRef) return;
  if (ctxRef.state === "suspended") {
    ctxRef.resume().catch(() => {});
  }
  audioUnlocked = true;
}

function playSfx(kind = "hit") {
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

function addScreenFx(type, opts = {}) {
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
}

function loadSettings() {
  return SaveSystem.loadSettings(localStorage, SETTINGS_STORAGE_KEY);
}

function saveSettings() {
  SaveSystem.saveSettings(localStorage, SETTINGS_STORAGE_KEY, {
    sfxVolume: state.sfxVolume,
    reducedFx: state.reducedFx,
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (location.protocol !== "https:" && !isLocal) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// ============================================
// 게임 상태
// ============================================
const initialSettings = loadSettings();
const state = {
  rngSeed: Date.now() % 100000,
  floorIndex: 0,
  floor: null,
  cameraX: 0,
  mode: "playing",
  running: true,
  choosingSkill: false,
  pendingLevelUps: 0,
  skillOptions: [],
  logs: [],
  keys: {},
  message: "",
  messageTimer: 0,
  bossIntroTimer: 0,
  bossIntroName: "",
  runStartTs: performance.now(),
  runElapsedMs: 0,
  runDeathCount: 0,
  endingReached: false,
  result: null,
  clearChoice: null,
  elevatorQuote: "",
  shopOptions: SHOP_OPTIONS,
  player: null,
  cameraShake: 0,
  particles: [],
  damageTexts: [],
  screenFx: [],
  projectiles: [],
  enemyProjectiles: [],
  enemyTelegraphs: [],
  hazards: [],
  ceoCutinTimer: 0,
  ceoCutinTitle: "",
  ceoCutinText: "",
  sfxVolume: initialSettings.sfxVolume,
  reducedFx: initialSettings.reducedFx,
  comboHits: 0,
  comboTimer: 0,
  comboBest: 0,
  battleHeat: 0,
  overdriveTier: 0,
  overdriveTimer: 0,
  floorKillCount: 0,
  weaponPassivePulse: 0,
  weaponPassiveHint: "",
  meta: loadMeta(),
};

function loadMeta() {
  const meta = SaveSystem.loadMeta(localStorage, META_STORAGE_KEY);
  ensureRankingMeta(meta);
  return meta;
}

function saveMeta() {
  ensureRankingMeta(state.meta);
  SaveSystem.saveMeta(localStorage, META_STORAGE_KEY, state.meta);
}

function loadRunSave() {
  return SaveSystem.loadRunSave(localStorage, SAVE_STORAGE_KEY);
}

function saveRunSnapshot() {
  SaveSystem.saveRunSnapshot(localStorage, SAVE_STORAGE_KEY, state, floorLabel);
}

function clearRunSnapshot() {
  SaveSystem.clearRunSnapshot(localStorage, SAVE_STORAGE_KEY);
}

function floorLabel(n) {
  return n < 0 ? `B${Math.abs(n)}` : `${n}F`;
}

function formatDuration(ms) {
  return UiSystem.formatDuration(ms);
}

function gradeByTime(ms) {
  return UiSystem.gradeByTime(ms);
}

function floorProfile(info) {
  const zone = info.zone;
  return {
    playerName: PLAYER_CALLSIGN[zone] || "퇴근 집행자",
    mobNames: MONSTER_NAME_POOL[zone] || ["업무 스트레스체"],
  };
}

function pickFrom(rand, arr) {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(rand() * arr.length)];
}

function rollWeapon() {
  const tierRoll = Math.random();
  let candidates = WEAPON_CATALOG.filter((w) => w.tier === "Common");
  if (tierRoll > 0.92) candidates = WEAPON_CATALOG.filter((w) => w.tier === "Legendary");
  else if (tierRoll > 0.72) candidates = WEAPON_CATALOG.filter((w) => w.tier === "Epic");
  else if (tierRoll > 0.45) candidates = WEAPON_CATALOG.filter((w) => w.tier === "Rare");
  const weapon = candidates[Math.floor(Math.random() * candidates.length)];
  const affix = WEAPON_AFFIXES[Math.floor(Math.random() * WEAPON_AFFIXES.length)];
  return {
    ...weapon,
    affix,
  };
}

function applyWeaponToPlayer(p, weapon) {
  if (!weapon) return;
  const prevDamageMul = p.weaponDamageMul || 1;
  const prevAttackCdMul = p.weaponAttackCdMul || 1;
  p.damageMul = (p.damageMul / prevDamageMul) * weapon.attackMul;
  p.attackCdMul = (p.attackCdMul / prevAttackCdMul) * weapon.attackCdMul;
  p.weaponDamageMul = weapon.attackMul;
  p.weaponAttackCdMul = weapon.attackCdMul;
  p.weapon = weapon;
}

function applyCombatStyle(p, styleId) {
  const style = CHARACTER_STYLES[styleId] || CHARACTER_STYLES.striker;
  const prev = {
    hpBonus: p.styleHpBonus || 0,
    damageMul: p.styleDamageMul || 1,
    speedMul: p.styleSpeedMul || 1,
    attackCdMul: p.styleAttackCdMul || 1,
    dashCdMul: p.styleDashCdMul || 1,
  };
  p.damageMul = (p.damageMul / prev.damageMul) * style.damageMul;
  p.speedMul = (p.speedMul / prev.speedMul) * style.speedMul;
  p.attackCdMul = (p.attackCdMul / prev.attackCdMul) * style.attackCdMul;
  p.dashCdMul = (p.dashCdMul / prev.dashCdMul) * style.dashCdMul;
  p.maxHp = Math.max(60, p.maxHp - prev.hpBonus + style.hpBonus);
  p.hp = Math.min(p.maxHp, Math.max(1, p.hp + (style.hpBonus - prev.hpBonus)));
  p.styleId = styleId;
  p.styleName = style.name;
  p.styleDesc = style.desc;
  p.styleAttackTint = style.attackTint;
  p.styleArmorMul = style.armorMul;
  p.styleDodgeChance = style.dodgeChance;
  p.styleReachBonus = style.reachBonus;
  p.styleHpBonus = style.hpBonus;
  p.styleDamageMul = style.damageMul;
  p.styleSpeedMul = style.speedMul;
  p.styleAttackCdMul = style.attackCdMul;
  p.styleDashCdMul = style.dashCdMul;
}

function applyAdaptiveAssist(p) {
  const recent = state.meta.recentDeaths || 0;
  if (recent < 2) {
    p.assistActive = false;
    p.assistArmorMul = 1;
    p.assistDamageMul = 1;
    return;
  }
  p.assistActive = true;
  p.assistArmorMul = recent >= 5 ? 0.78 : (recent >= 3 ? 0.84 : 0.9);
  p.assistDamageMul = recent >= 5 ? 1.14 : (recent >= 3 ? 1.1 : 1.06);
  p.damageMul *= p.assistDamageMul;
  p.maxHp = Math.round(p.maxHp * (recent >= 5 ? 1.18 : 1.1));
  p.hp = p.maxHp;
}

function log(msg) {
  const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  state.logs.unshift(`[${time}] ${msg}`);
  state.logs = state.logs.slice(0, 12);
  logEl.innerHTML = state.logs.map((x) => `<div>${x}</div>`).join("");
}

function applyInfoPanelsVisibility() {
  layoutEl.classList.toggle("show-panels", infoPanelsVisible);
  controlsEl.classList.toggle("hidden", !infoPanelsVisible);
  logEl.classList.toggle("hidden", !infoPanelsVisible);
  statsEl.classList.add("hidden");
}

function basePlayer() {
  const p = {
    x: 90,
    y: GROUND_Y - 68,
    w: 36,
    h: 60,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    hp: 120,
    maxHp: 120 + state.meta.maxHpBonus,
    baseSpeed: 4.5,
    speedMul: 1 + state.meta.speedBonus,
    baseDamage: 18,
    damageMul: 1 + state.meta.damageBonus,
    weaponDamageMul: 1,
    attackTimer: 0,
    attackHeld: false,
    attackCd: 260,
    attackCdMul: 1,
    weaponAttackCdMul: 1,
    landTimer: 0,
    extraAttackTimer: 0,
    throwCd: 900,
    lastThrow: 0,
    dashTimer: 0,
    dashCd: 950,
    dashCdMul: 1,
    invuln: 0,
    level: 1,
    xp: 0,
    needXp: 45,
    gold: 0,
    inventory: ["회복키트", "빈 슬롯"],
    codename: "퇴근 집행자",
    weapon: null,
    skillNames: [],
    skillIds: [],
    lifeStealOnKill: 0,
    critChance: 0,
    critDamageMul: 1.5,
    damageTakenMul: 1,
    regenPerSec: 0,
    skillReachBonus: 0,
    executeThreshold: 0,
    executeDamageMul: 0,
    walkAnim: 0,
    attackSwing: 0,
    lastAttackRange: null,
    styleId: "",
    styleName: "",
    styleDesc: "",
    styleAttackTint: "#ffd369",
    styleArmorMul: 1,
    styleDodgeChance: 0,
    styleReachBonus: 0,
    styleHpBonus: 0,
    styleDamageMul: 1,
    styleSpeedMul: 1,
    styleAttackCdMul: 1,
    styleDashCdMul: 1,
    assistActive: false,
    assistArmorMul: 1,
    assistDamageMul: 1,
  };
  p.hp = p.maxHp;
  return p;
}

function restorePlayerFromSave(saved) {
  const p = basePlayer();
  if (!saved) return p;
  p.maxHp = saved.maxHpBase || saved.maxHp || p.maxHp;
  p.gold = typeof saved.gold === "number" ? saved.gold : p.gold;
  p.inventory = Array.isArray(saved.inventory) && saved.inventory.length
    ? saved.inventory.slice(0, 2)
    : p.inventory;
  p.codename = saved.codename || p.codename;
  p.level = saved.level || p.level;
  p.xp = saved.xp || p.xp;
  p.needXp = saved.needXp || p.needXp;
  p.speedMul = saved.speedMul || p.speedMul;
  p.lifeStealOnKill = saved.lifeStealOnKill || p.lifeStealOnKill;
  p.dashCdMul = saved.dashCdMul || p.dashCdMul;
  p.skillNames = Array.isArray(saved.skillNames) ? [...saved.skillNames] : p.skillNames;
  p.skillIds = Array.isArray(saved.skillIds) ? [...saved.skillIds] : inferSkillIdsFromNames(p.skillNames);
  p.damageMul = saved.damageMul || p.damageMul;
  p.attackCdMul = saved.attackCdMul || p.attackCdMul;
  p.critChance = saved.critChance || p.critChance;
  p.critDamageMul = saved.critDamageMul || p.critDamageMul;
  p.damageTakenMul = saved.damageTakenMul || p.damageTakenMul;
  p.regenPerSec = saved.regenPerSec || p.regenPerSec;
  p.skillReachBonus = saved.skillReachBonus || p.skillReachBonus;
  p.executeThreshold = saved.executeThreshold || p.executeThreshold;
  p.executeDamageMul = saved.executeDamageMul || p.executeDamageMul;
  applyCombatStyle(p, saved.styleId || randomCombatStyleId());
  applyWeaponToPlayer(p, saved.weapon || rollWeapon());
  p.hp = Math.min(p.maxHp, Math.max(1, saved.hp || p.hp));
  return p;
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function themeByFloor(n) {
  const info = FLOOR_PLAN.find((f) => f.n === n);
  if (!info) return THEMES.parking;
  return THEMES[info.zone] || THEMES.parking;
}

function floorDifficultyCurve(index) {
  return FloorSystem.floorDifficultyCurve(index);
}

function mobBehaviorForZone(zone, i) {
  return FloorSystem.mobBehaviorForZone(zone, i);
}

function zoneArchetypePlan(zone) {
  return MonsterArchetypeSystem.zonePlan(zone);
}

function pickMobArchetype(zone, mobName, index, rand) {
  return MonsterArchetypeSystem.pickArchetype(zone, mobName, index, rand);
}

function makeFloor(index) {
  const info = FLOOR_PLAN[index];
  const rand = seededRandom(state.rngSeed + index * 9991 + state.player.level * 111);
  const profile = floorProfile(info);
  const floor = FloorSystem.buildFloor({
    index,
    info,
    rand,
    profile,
    worldWidth: WORLD_WIDTH,
    groundY: GROUND_Y,
    pickMobArchetype,
    randomItemKey,
    executiveMiniBosses: EXECUTIVE_MINI_BOSSES,
  });
  return {
    ...floor,
    eventRoom: rollSpecialEventRoom(info, index, rand),
    eventGoldMul: 1,
    theme: themeByFloor(info.n),
  };
}

function applyEnemyMutatorsForFloor(index) {
  const rand = seededRandom(state.rngSeed + index * 2137 + state.player.level * 59);
  const pool = Object.keys(ENEMY_MUTATORS);
  const chance = Math.min(0.45, 0.22 + index * 0.015);
  let applied = 0;
  for (const e of state.floor.enemies) {
    if (e.type !== "mob") continue;
    if (rand() > chance) continue;
    const id = pool[Math.floor(rand() * pool.length)];
    const mut = ENEMY_MUTATORS[id];
    if (!mut) continue;
    e.mutatorId = id;
    e.mutatorLabel = mut.label;
    mut.apply(e);
    applied += 1;
  }
  if (applied > 0) {
    const sample = state.floor.enemies
      .filter((e) => e.type === "mob" && e.mutatorLabel)
      .slice(0, 3)
      .map((e) => `${e.name}(${e.mutatorLabel})`);
    log(`층 변이 감지: ${sample.join(", ")}${applied > 3 ? " ..." : ""}`);
  }
}

function randomItemKey(rand) {
  const keys = Object.keys(itemCatalog);
  return keys[Math.floor(rand() * keys.length)];
}

function rollSpecialEventRoom(info, index, rand) {
  if (!info || info.safeZone) return null;
  const chance = Math.min(0.72, 0.32 + index * 0.025);
  if (rand() > chance) return null;
  const pool = SPECIAL_EVENT_ROOM_BY_ZONE[info.zone] || SPECIAL_EVENT_ROOM_BY_ZONE.parking;
  if (!pool || pool.length === 0) return null;
  const pick = pool[Math.floor(rand() * pool.length)];
  return {
    id: pick.id,
    label: pick.label,
    hint: pick.hint,
    color: pick.color,
    used: false,
    x: 460 + rand() * (WORLD_WIDTH - 1080),
    y: GROUND_Y - 94,
    w: 68,
    h: 94,
  };
}

function triggerWeaponPassiveHint(text) {
  if (!text) return;
  state.weaponPassiveHint = text;
  state.weaponPassivePulse = 920;
}

function startRun() {
  const saved = loadRunSave();
  if (saved?.player?.floorIndex >= 0 && saved.player.floorIndex < FLOOR_PLAN.length) {
    state.player = restorePlayerFromSave(saved.player);
    state.floorIndex = saved.player.floorIndex;
    state.meta.totalPlayTime = Math.max(state.meta.totalPlayTime, saved.meta.totalPlayTime || 0);
    state.runDeathCount = saved.meta.deathCount || 0;
    state.meta.unlockedItems = Array.isArray(saved.meta.unlockedItems) ? [...saved.meta.unlockedItems] : state.meta.unlockedItems;
    enterFloor(state.floorIndex, true);
    log(`자동 저장 불러오기: ${state.floor.info.name}부터 재개합니다.`);
    if (state.player.weapon) {
      log(`장착 무기: ${state.player.weapon.name} [${state.player.weapon.affix.label}]`);
    }
  } else {
    state.player = basePlayer();
    applyCombatStyle(state.player, randomCombatStyleId());
    applyWeaponToPlayer(state.player, rollWeapon());
    applyAdaptiveAssist(state.player);
    state.floorIndex = 0;
    state.runDeathCount = 0;
    enterFloor(0, true);
    log("런 시작: 지하 6층에서 탈출을 시작합니다.");
    log(`지급 무기: ${state.player.weapon.name} [${state.player.weapon.affix.label}]`);
  }
  state.mode = "playing";
  state.running = true;
  state.choosingSkill = false;
  state.pendingLevelUps = 0;
  state.battleHeat = 0;
  state.overdriveTier = 0;
  state.overdriveTimer = 0;
  state.floorKillCount = 0;
  state.weaponPassivePulse = 0;
  state.weaponPassiveHint = "";
  state.runElapsedMs = 0;
  state.runStartTs = performance.now();
  state.endingReached = false;
  state.result = null;
  state.clearChoice = null;
  state.screenFx = [];
  state.damageTexts = [];
  state.projectiles = [];
  state.enemyProjectiles = [];
  state.enemyTelegraphs = [];
  state.hazards = [];
  state.cameraShake = 0;
  state.bossIntroTimer = 0;
  state.bossIntroName = "";
  state.ceoCutinTimer = 0;
  state.ceoCutinTitle = "";
  state.ceoCutinText = "";
  state.comboHits = 0;
  state.comboTimer = 0;
  if (state.player.assistActive) {
    log(`적응형 보조 적용: 피해 완화 ${(100 - Math.round(state.player.assistArmorMul * 100))}%`);
  }
  log(`빌드 버전: ${APP_VERSION}`);
  log(`전투 스타일: ${state.player.styleName} (${state.player.styleDesc})`);
  hideOverlay();
}

function enterFloor(index, first = false) {
  state.floorIndex = index;
  state.floor = makeFloor(index);
  applyEnemyMutatorsForFloor(index);
  state.floorKillCount = 0;
  state.player.codename = floorProfile(state.floor.info).playerName;
  state.player.x = 80;
  state.player.y = GROUND_Y - state.player.h;
  state.player.vx = 0;
  state.player.vy = 0;
  state.screenFx = [];
  state.damageTexts = [];
  state.projectiles = [];
  state.enemyProjectiles = [];
  state.enemyTelegraphs = [];
  state.hazards = [];
  state.cameraShake = 0;
  state.ceoCutinTimer = 0;
  state.ceoCutinTitle = "";
  state.ceoCutinText = "";
  state.comboHits = 0;
  state.comboTimer = 0;
  state.weaponPassivePulse = 0;
  state.weaponPassiveHint = "";
  state.cameraX = 0;
  state.elevatorQuote = ELEVATOR_QUOTES[Math.floor(Math.random() * ELEVATOR_QUOTES.length)];
  state.message = `${state.floor.info.name}\n${state.elevatorQuote}`;
  state.messageTimer = 3000;
  if (!first) log(`${state.floor.info.name} 도착 · "${state.elevatorQuote}"`);
  if (state.floor.info.safeZone) {
    log("B1 보급소: 안전 구역입니다. 잠시 정비하고 올라가세요.");
  }
  if (state.floor.eventRoom && !state.floor.eventRoom.used) {
    log(`특수 이벤트 룸 발견: ${state.floor.eventRoom.label} (E로 활성화)`);
  }
  const mobPreview = [...new Set(state.floor.enemies.filter((e) => e.type === "mob").map((e) => e.name))].slice(0, 3);
  if (mobPreview.length) {
    log(`출현 몬스터: ${mobPreview.join(", ")}`);
  }
  const elitePreview = state.floor.enemies.filter((e) => e.type === "boss" || e.type === "exec").map((e) => e.name);
  if (elitePreview.length) {
    log(`주의 대상: ${elitePreview.join(", ")}`);
    state.bossIntroName = elitePreview[0];
    state.bossIntroTimer = first ? 0 : 1800;
  }
  saveRunSnapshot();
}

function nextFloor() {
  if (state.floorIndex >= FLOOR_PLAN.length - 1) {
    reachEndingFloor();
    return;
  }
  enterFloor(state.floorIndex + 1);
}

function easterEggMoveFloor(delta) {
  if (state.mode === "dead" || state.mode === "clearChoice") return;
  const target = Math.max(0, Math.min(FLOOR_PLAN.length - 1, state.floorIndex + delta));
  if (target === state.floorIndex) return;
  state.mode = "playing";
  state.running = true;
  state.choosingSkill = false;
  hideOverlay();
  enterFloor(target);
  log(`이스터에그 이동: ${floorLabel(FLOOR_PLAN[target].n)} ${FLOOR_PLAN[target].name}`);
}

function reachEndingFloor() {
  state.endingReached = true;
  winGame();
}

function buildCarryOverSnapshot(player, floorIndex = 0) {
  return {
    player: {
      currentFloor: floorLabel(FLOOR_PLAN[floorIndex]?.n ?? -6),
      floorIndex,
      hp: Math.max(1, Math.round(player.hp)),
      gold: player.gold,
      inventory: [...player.inventory],
      codename: player.codename,
      level: player.level,
      xp: player.xp,
      needXp: player.needXp,
      skillNames: [...player.skillNames],
      skillIds: [...(player.skillIds || [])],
      weapon: player.weapon,
      styleId: player.styleId || "striker",
      damageMul: player.damageMul / ((player.weaponDamageMul || 1) * (player.styleDamageMul || 1)),
      speedMul: player.speedMul / (player.styleSpeedMul || 1),
      maxHp: player.maxHp,
      maxHpBase: player.maxHp - (player.styleHpBonus || 0),
      lifeStealOnKill: player.lifeStealOnKill,
      attackCdMul: player.attackCdMul / ((player.weaponAttackCdMul || 1) * (player.styleAttackCdMul || 1)),
      dashCdMul: player.dashCdMul / (player.styleDashCdMul || 1),
      critChance: player.critChance || 0,
      critDamageMul: player.critDamageMul || 1.5,
      damageTakenMul: player.damageTakenMul || 1,
      regenPerSec: player.regenPerSec || 0,
      skillReachBonus: player.skillReachBonus || 0,
      executeThreshold: player.executeThreshold || 0,
      executeDamageMul: player.executeDamageMul || 0,
    },
    meta: {
      totalPlayTime: Math.round(state.meta.totalPlayTime),
      deathCount: 0,
      unlockedItems: [...state.meta.unlockedItems],
    },
  };
}

function saveCarryOverRunSnapshot() {
  const payload = buildCarryOverSnapshot(state.player, 0);
  localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
}

function winGame() {
  state.running = false;
  state.mode = "clearChoice";
  const totalTime = state.runElapsedMs;
  const grade = gradeByTime(totalTime);
  state.result = { totalTime, deathCount: state.runDeathCount, grade };
  ensureRankingMeta(state.meta);
  state.meta.totalClears = Math.max(0, state.meta.totalClears || 0) + 1;
  state.meta.ranking.totalClears = state.meta.totalClears;
  state.meta.ranking.lastClearTimeMs = totalTime;
  if (!state.meta.ranking.bestClearTimeMs || totalTime < state.meta.ranking.bestClearTimeMs) {
    state.meta.ranking.bestClearTimeMs = totalTime;
  }
  state.meta.bestCombo = Math.max(state.meta.bestCombo || 0, state.comboBest || 0);
  if (!state.meta.bestTimeMs || totalTime < state.meta.bestTimeMs) {
    state.meta.bestTimeMs = totalTime;
  }
  state.meta.clearRecords.push({
    clearCount: state.meta.totalClears,
    clearTimeMs: totalTime,
    deathCount: state.runDeathCount,
    at: Date.now(),
  });
  if (state.meta.clearRecords.length > 30) {
    state.meta.clearRecords = state.meta.clearRecords.slice(-30);
  }
  const sorted = [...state.meta.clearRecords].sort(rankingRecordCompare);
  const currentRank = sorted.findIndex((r) =>
    r.at === state.meta.clearRecords[state.meta.clearRecords.length - 1].at
    && r.clearCount === state.meta.totalClears
    && r.clearTimeMs === totalTime
  ) + 1;
  state.meta.recentDeaths = 0;
  state.meta.totalPlayTime += totalTime * 0.001;
  saveMeta();
  state.clearChoice = {
    totalClears: state.meta.ranking.totalClears,
    bestClearTimeMs: state.meta.ranking.bestClearTimeMs,
    lastClearTimeMs: state.meta.ranking.lastClearTimeMs,
  };
  const rankingLines = buildRankingLines(5);
  showOverlay(
    "10F 옥상 도착 - 랭킹 기록 저장\n\n" +
    `이번 클리어: ${formatDuration(totalTime)} / 사망 ${state.runDeathCount} / ${grade}\n` +
    `총 클리어: ${state.meta.ranking.totalClears}회\n` +
    `최고 클리어타임: ${state.meta.ranking.bestClearTimeMs ? formatDuration(state.meta.ranking.bestClearTimeMs) : "-"}\n` +
    `이번 기록 랭크: #${currentRank || "-"}\n\n` +
    "[랭킹 TOP 5]\n" +
    `${rankingLines.join("\n")}\n\n` +
    "랭킹 기준: 총 클리어 수 우선, 동률이면 클리어타임 우선\n\n" +
    "1: 캐릭터 상태 초기화 후 B6 재시작\n" +
    "2: 현재 캐릭터 상태 유지 후 B6 재도전"
  );
  clearRunSnapshot();
  log(`게임 클리어: 결과 ${grade}, 소요 ${formatDuration(totalTime)}`);
}

function restartAfterClear(keepCharacterState) {
  hideOverlay();
  state.clearChoice = null;
  state.result = null;
  if (keepCharacterState) {
    saveCarryOverRunSnapshot();
    log("클리어 선택: 상태 유지 후 B6 재도전");
    startRun();
    return;
  }
  clearRunSnapshot();
  log("클리어 선택: 상태 초기화 후 B6 재시작");
  startRun();
}

function onDeath() {
  state.running = false;
  state.mode = "dead";
  state.runDeathCount += 1;
  state.meta.deathCount += 1;
  state.meta.recentDeaths = (state.meta.recentDeaths || 0) + 1;
  saveMeta();
  saveRunSnapshot();
  showOverlay(
    `<div class="overlay-fail-wrap"><div class="overlay-title">퇴근 실패!</div><div class="overlay-sub">스킬과 레벨은 초기화됩니다. 아이템은 유지됩니다.\n연속 사망 시 자동 보조가 강화됩니다.\nR 키로 재시작</div></div>`,
    "fail",
    true
  );
  log("사망: 스킬이 초기화되고 아이템만 유지됩니다.");
}

function restartAfterDeath() {
  const now = performance.now();
  state.runElapsedMs += now - state.runStartTs;
  state.meta.totalPlayTime += (now - state.runStartTs) * 0.001;
  saveMeta();
  clearRunSnapshot();
  startRun();
}

function showOverlay(text, style = "", allowHtml = false) {
  overlayEl.classList.remove("hidden");
  overlayEl.classList.toggle("fail", style === "fail");
  if (allowHtml) {
    overlayEl.innerHTML = text;
  } else {
    overlayEl.textContent = text;
  }
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
  overlayEl.classList.remove("fail");
  overlayEl.textContent = "";
}

function inShopZone() {
  return Boolean(state.floor.shop && intersects(state.player, state.floor.shop));
}

function inEventRoomZone() {
  const room = state.floor?.eventRoom;
  return Boolean(room && !room.used && intersects(state.player, room));
}

function tryUseEventRoom() {
  if (state.mode !== "playing" || !state.running) return false;
  const room = state.floor?.eventRoom;
  if (!room || room.used || !intersects(state.player, room)) return false;
  const p = state.player;
  room.used = true;
  const rewardX = Math.max(40, Math.min(WORLD_WIDTH - 64, room.x + room.w * 0.5 - 12));
  let msg = `${room.label} 활성화`;
  if (room.id === "recovery_pod") {
    const heal = Math.max(24, Math.round(p.maxHp * 0.34));
    p.hp = Math.min(p.maxHp, p.hp + heal);
    msg = `${room.label}: HP +${heal}`;
  } else if (room.id === "overclock_charge") {
    addBattleHeat(38);
    p.attackTimer = Math.max(0, p.attackTimer - 140);
    msg = `${room.label}: 전투 열기 +38`;
  } else if (room.id === "payroll_cache") {
    const gold = randInt(52, 104);
    p.gold += gold;
    msg = `${room.label}: 야근수당 +${gold}G`;
  } else if (room.id === "weapon_tune") {
    p.attackCdMul = Math.max(0.55, p.attackCdMul * 0.92);
    msg = `${room.label}: 공격 속도 강화`;
  } else if (room.id === "skill_cache") {
    const xp = Math.round(p.needXp * 0.58);
    gainXp(xp);
    msg = `${room.label}: 경험치 +${xp}`;
  } else if (room.id === "gold_contract") {
    state.floor.eventGoldMul = Math.max(1.18, state.floor.eventGoldMul || 1);
    msg = `${room.label}: 층 보상 골드 +18%`;
  } else if (room.id === "armor_patch") {
    p.damageTakenMul *= 0.92;
    msg = `${room.label}: 받는 피해 8% 감소`;
  } else if (room.id === "artifact_vault") {
    state.floor.pickups.push({
      x: rewardX,
      y: GROUND_Y - 28,
      w: 24,
      h: 24,
      type: "artifact",
      key: randomItemKey(() => Math.random()),
    });
    msg = `${room.label}: 아티팩트 박스 지급`;
  } else if (room.id === "risk_trade") {
    const hpCost = Math.max(10, Math.round(p.maxHp * 0.12));
    p.hp = Math.max(1, p.hp - hpCost);
    const gold = randInt(95, 180);
    p.gold += gold;
    msg = `${room.label}: HP -${hpCost}, 야근수당 +${gold}G`;
  }
  triggerWeaponPassiveHint(room.hint || "이벤트 발동");
  log(`특수 이벤트: ${msg}`);
  saveRunSnapshot();
  return true;
}

function openShop() {
  if (!state.floor.info.safeZone || !inShopZone()) {
    log("상점 단말기 앞에서 E를 눌러야 이용할 수 있습니다.");
    return;
  }
  state.mode = "shop";
  state.running = false;
  const p = state.player;
  const lines = ["B1 보급소 상점", `보유 골드: ${p.gold}G`, ""];
  state.shopOptions.forEach((opt) => {
    lines.push(`${opt.key}. ${opt.label} (${opt.cost}G)`);
    lines.push(`   - ${opt.desc}`);
  });
  lines.push("");
  lines.push("ESC 또는 E: 상점 닫기");
  showOverlay(lines.join("\n"));
}

function closeShop() {
  if (state.mode !== "shop") return;
  state.mode = "playing";
  state.running = true;
  hideOverlay();
}

function togglePause() {
  if (state.mode === "dead" || state.mode === "result" || state.mode === "clearChoice" || state.mode === "shop" || state.mode === "choosingSkill") return;
  if (state.mode === "paused") {
    state.mode = "playing";
    state.running = true;
    hideOverlay();
    return;
  }
  if (state.mode === "playing") {
    state.mode = "paused";
    state.running = false;
    showOverlay("일시정지\n\nP: 계속하기\nM: 음소거\nV: 이펙트 간소화 토글");
  }
}

function buyFromShop(idx) {
  if (state.mode !== "shop") return;
  const opt = state.shopOptions[idx];
  if (!opt) return;
  const p = state.player;
  if (p.gold < opt.cost) {
    log(`골드 부족: ${opt.label} 구매에 ${opt.cost}G 필요`);
    openShop();
    return;
  }
  p.gold -= opt.cost;
  if (opt.id === "heal") {
    p.hp = Math.min(p.maxHp, p.hp + 60);
    log(`상점 구매: ${opt.label} (+60 HP)`);
  } else if (opt.id === "reroll") {
    applyWeaponToPlayer(p, rollWeapon());
    log(`상점 구매: ${opt.label} -> ${p.weapon.name} [${p.weapon.affix.label}]`);
  } else if (opt.id === "artifact") {
    const key = randomItemKey(() => Math.random());
    const entry = itemCatalog[key];
    if (key) {
      state.meta.items[key] += 1;
      if (!state.meta.unlockedItems.includes(key)) state.meta.unlockedItems.push(key);
      entry.apply(state.meta);
      saveMeta();
      log(`상점 구매: 영구 아이템 획득 (${entry.label})`);
    }
  }
  saveRunSnapshot();
  openShop();
}

function isBackAttack(player, enemy) {
  return CombatSystem.isBackAttack(player, enemy);
}

function spawnKeyboardProjectile(opts = {}) {
  if (!ENABLE_RANGED_ATTACKS) return;
  const p = state.player;
  const projectile = {
    x: p.x + p.w / 2,
    y: p.y + p.h * 0.5,
    w: 16,
    h: 8,
    vx: (opts.dir || p.facing) * (opts.speed || 11),
    startX: p.x + p.w / 2,
    maxDist: opts.maxDist || 420,
    returning: Boolean(opts.returning),
    canReturn: Boolean(opts.canReturn),
    life: opts.life || 900,
    damage: opts.damage || Math.round(p.baseDamage * currentPlayerDamageMul() * 0.8),
    hitSet: new Set(),
    color: opts.color || "#d7ebff",
  };
  state.projectiles.push(projectile);
}

function applyOnHitEffects(enemy) {
  const p = state.player;
  if (!p.weapon) return;
  const weaponId = p.weapon.id;
  const affixId = p.weapon.affix?.id;
  if (weaponId === "weapon_keyboard_rgb") {
    enemy.dotTimer = Math.max(enemy.dotTimer, 2500);
    enemy.dotDamage = Math.max(enemy.dotDamage || 0, Math.round(Math.max(6, p.baseDamage * 0.22)));
  }
  if (weaponId === "weapon_keyboard_aluminum") {
    enemy.stunTimer = Math.max(enemy.stunTimer, 450);
  }
  if (affixId === "sticky") {
    enemy.slowTimer = Math.max(enemy.slowTimer, 1600);
  }
}

function addShake(amount) {
  state.cameraShake = Math.min(14, state.cameraShake + amount);
}

function triggerCeoCutin(title, text) {
  state.ceoCutinTitle = title;
  state.ceoCutinText = text;
  state.ceoCutinTimer = 1350;
  state.bossIntroName = title;
  state.bossIntroTimer = 1200;
  addScreenFx("boss", { life: 560, strength: 0.24 });
  playSfx("boss");
}

function resolveEnemyPhaseIndex(e) {
  const ratio = e.hp / Math.max(1, e.maxHp);
  if (ratio > 0.7) return 1;
  if (ratio > 0.4) return 2;
  return 3;
}

function onElitePhaseShift(e, phase) {
  e.phaseIndex = phase;
  if (e.type === "boss" && e.name.includes("CEO")) {
    triggerCeoCutin(`대표이사 페이즈 ${phase}`, phase === 2 ? "임원진 긴급 결재 회의" : "최종 통보: 야근 확정");
    addShake(5.6);
    log(`대표이사 페이즈 전환: ${phase}`);
    return;
  }
  if (e.type === "boss") {
    state.bossIntroName = `${e.name} · PHASE ${phase}`;
    state.bossIntroTimer = 980;
    addShake(2.4 + phase * 0.9);
    log(`${e.name}: 전투 페이즈 ${phase}`);
    return;
  }
  log(`${e.name}: 전술 변경 (페이즈 ${phase})`);
}

function currentOverdriveDamageMul() {
  if (state.overdriveTimer <= 0) return 1;
  return state.overdriveTier >= 2 ? 1.22 : 1.12;
}

function currentOverdriveSpeedMul() {
  if (state.overdriveTimer <= 0) return 1;
  return state.overdriveTier >= 2 ? 1.16 : 1.08;
}

function currentOverdriveGoldMul() {
  if (state.overdriveTimer <= 0) return 1;
  return state.overdriveTier >= 2 ? 1.3 : 1.15;
}

function currentPlayerDamageMul() {
  return state.player.damageMul * currentOverdriveDamageMul();
}

function activateOverdrive(tier) {
  if (tier <= state.overdriveTier && state.overdriveTimer > 1000) {
    state.overdriveTimer = Math.max(state.overdriveTimer, 5000);
    return;
  }
  state.overdriveTier = tier;
  state.overdriveTimer = 8000;
  log(`오버드라이브 ${tier}단계 발동: 화력/기동/보상 증가`);
  addScreenFx("slash", { strength: tier >= 2 ? 0.2 : 0.14 });
  spawnParticles(state.player.x + state.player.w * 0.5, state.player.y + state.player.h * 0.5, 14, "#9de9ff", 2.8);
}

function addBattleHeat(amount) {
  state.battleHeat = Math.max(0, Math.min(100, state.battleHeat + amount));
  if (state.battleHeat >= 80) {
    activateOverdrive(2);
  } else if (state.battleHeat >= 40) {
    activateOverdrive(1);
  }
}

function comboMultiplier() {
  return CombatSystem.comboMultiplier(state.comboHits);
}

function registerComboHit() {
  state.comboHits += 1;
  state.comboTimer = 1800;
  state.comboBest = Math.max(state.comboBest, state.comboHits);
}

function maybeDropEmergencyHeal(e) {
  const p = state.player;
  const lowHp = p.hp / p.maxHp < 0.28;
  if (!lowHp) return;
  const healCount = state.floor.pickups.filter((it) => it.type === "heal").length;
  if (healCount >= 2) return;
  const chance = e.type === "mob" ? 0.14 : 0.3;
  if (Math.random() < chance) {
    state.floor.pickups.push({
      x: Math.max(40, Math.min(WORLD_WIDTH - 60, e.x + e.w * 0.5 - 10)),
      y: GROUND_Y - 24,
      w: 20,
      h: 20,
      type: "heal",
      heal: 24,
    });
    log("긴급 보급품 투하: 회복 키트 생성");
  }
}

function maybeSpawnKillStreakReward(e) {
  state.floorKillCount += 1;
  if (state.floorKillCount <= 0 || state.floorKillCount % 10 !== 0) return;
  const isHeal = state.player.hp / state.player.maxHp < 0.52 || Math.random() < 0.55;
  const x = Math.max(40, Math.min(WORLD_WIDTH - 60, e.x + e.w * 0.5 - 10));
  state.floor.pickups.push({
    x,
    y: GROUND_Y - 24,
    w: 20,
    h: 20,
    type: isHeal ? "heal" : "artifact",
    heal: isHeal ? 28 : undefined,
    key: isHeal ? undefined : randomItemKey(() => Math.random()),
  });
  log(`연속 처치 보상: ${state.floorKillCount}킬 달성 (${isHeal ? "회복" : "아티팩트"})`);
}

function onEnemyDefeated(e, source = "hit") {
  if (e.defeated) return;
  e.defeated = true;
  const p = state.player;
  const mul = comboMultiplier();
  gainXp(Math.round(e.xp * mul));
  const baseGold = (e.type === "boss" ? 40 : (e.type === "exec" ? 28 : 10));
  const mutatorGoldMul = e.goldBonusMul || 1;
  const roomGoldMul = state.floor?.eventGoldMul || 1;
  p.gold += Math.round(baseGold * mul * currentOverdriveGoldMul() * mutatorGoldMul * roomGoldMul);
  addBattleHeat(e.type === "mob" ? 10 : 26);
  if (p.lifeStealOnKill > 0) p.hp = Math.min(p.maxHp, p.hp + p.lifeStealOnKill);
  maybeDropEmergencyHeal(e);
  maybeSpawnKillStreakReward(e);
  if (e.type !== "mob") log(`격파: ${e.name}`);
  if (source === "projectile") addScreenFx("slash", { strength: 0.15 });
  spawnDamageText(e.x + e.w * 0.5, e.y - 16, "K.O", e.type === "mob" ? "#d8f0ff" : "#ffd6de", true);
}

function takeDamage(amount) {
  const p = state.player;
  if (p.invuln > 0) return;
  if (p.styleDodgeChance > 0 && Math.random() < p.styleDodgeChance) {
    p.invuln = 160;
    spawnParticles(p.x + p.w / 2, p.y + p.h / 2, 8, p.styleAttackTint || "#c5c5ff", 2);
    log(`${p.styleName} 회피 발동`);
    return;
  }
  const finalDamage = Math.max(1, Math.round(amount * (p.styleArmorMul || 1) * (p.assistArmorMul || 1) * (p.damageTakenMul || 1)));
  p.hp -= finalDamage;
  spawnDamageText(p.x + p.w * 0.5, p.y - 8, `-${finalDamage}`, "#ff9ea1", true);
  state.comboHits = 0;
  state.comboTimer = 0;
  p.invuln = 500;
  addShake(3.8);
  addScreenFx("damage");
  playSfx("boss");
  spawnParticles(p.x + p.w / 2, p.y + p.h / 2, 10, "#ff7b72", 2.8);
  if (p.hp <= 0) {
    p.hp = 0;
    onDeath();
  }
}

function gainXp(amount) {
  const p = state.player;
  p.xp += amount;
  while (p.xp >= p.needXp) {
    p.xp -= p.needXp;
    p.level += 1;
    p.needXp = Math.round(p.needXp * 1.3 + 14);
    state.pendingLevelUps += 1;
  }
  processLevelUps();
}

function processLevelUps() {
  if (state.choosingSkill || state.pendingLevelUps <= 0) return;
  while (state.pendingLevelUps > 0) {
    state.pendingLevelUps -= 1;
    levelUp();
    if (state.choosingSkill) return;
  }
}

function levelUp() {
  const p = state.player;
  const picked = new Set(p.skillIds || []);
  const available = SKILL_TEMPLATES.filter((s) => !picked.has(s.id));
  if (available.length === 0) {
    p.maxHp += 8;
    p.hp += 8;
    log("레벨업: 추가 스킬이 없어 HP +8");
    return;
  }

  const opts = [];
  while (opts.length < Math.min(3, available.length)) {
    const candidate = available[Math.floor(Math.random() * available.length)];
    if (!opts.find((o) => o.id === candidate.id)) {
      const rolled = candidate.roll();
      opts.push({
        id: candidate.id,
        label: candidate.label,
        desc: rolled.desc,
        tag: rolled.tag || candidate.label,
        apply: rolled.apply,
      });
    }
  }

  state.skillOptions = opts;
  state.choosingSkill = true;
  state.mode = "choosingSkill";
  state.running = false;
  const lines = ["레벨업 - 스킬 선택", "1/2/3 키를 눌러 선택"]; 
  opts.forEach((o, idx) => lines.push(`${idx + 1}. ${o.label} - ${o.desc}`));
  showOverlay(lines.join("\n"));
}

function chooseSkill(idx) {
  if (!state.choosingSkill) return;
  const opt = state.skillOptions[idx];
  if (!opt) return;
  opt.apply(state.player);
  state.player.skillIds.push(opt.id);
  state.player.skillNames.push(opt.tag || opt.label);
  log(`스킬 획득: ${opt.label} (${opt.desc})`);
  state.choosingSkill = false;
  state.mode = "playing";
  state.running = true;
  hideOverlay();
  processLevelUps();
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlayer(dt) {
  const p = state.player;
  const dtSec = dt * 0.001;
  const speedPerSec = p.baseSpeed * p.speedMul * currentOverdriveSpeedMul() * 60;
  const wasOnGround = p.onGround;
  const weaponId = p.weapon?.id;
  const affixId = p.weapon?.affix?.id;

  let move = 0;
  if (state.keys["ArrowLeft"]) move -= 1;
  if (state.keys["ArrowRight"]) move += 1;

  if (move !== 0) p.facing = move;

  if (p.dashTimer > 0) {
    p.vx = p.facing * 14 * 60;
    p.dashTimer -= dt;
  } else {
    p.vx = move * speedPerSec;
    if (state.keys["ArrowUp"] && p.onGround) {
      // 점프 초기 속도는 프레임 시간과 무관한 상수여야 높이가 안정된다.
      p.vy = -12.5 * 60;
      p.onGround = false;
      spawnParticles(p.x + p.w / 2, p.y + p.h, 7, "#a9d6ff", 2.2);
    }
  }

  p.vy += (0.58 * 60 * 60) * dtSec;
  p.attackTimer -= dt;
  p.invuln -= dt;
  p.landTimer = Math.max(0, (p.landTimer || 0) - dt);
  if (state.running && p.regenPerSec > 0) {
    p.hp = Math.min(p.maxHp, p.hp + (p.regenPerSec * dt * 0.001));
  }

  p.x += p.vx * dtSec;
  p.y += p.vy * dtSec;
  const landingSpeed = p.vy;

  if (p.x < 0) p.x = 0;
  if (p.x + p.w > WORLD_WIDTH) p.x = WORLD_WIDTH - p.w;

  p.onGround = false;
  for (const plat of state.floor.platforms) {
    if (p.vy >= 0 && p.x + p.w > plat.x && p.x < plat.x + plat.w) {
      const prevY = p.y - p.vy * dtSec;
      if (prevY + p.h <= plat.y && p.y + p.h >= plat.y) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    }
  }

  if (!wasOnGround && p.onGround && landingSpeed > 300) {
    spawnParticles(p.x + p.w / 2, p.y + p.h, 9, "#d9e1f0", 1.6);
    p.landTimer = 130;
  }

  if (p.y > HEIGHT + 100) {
    takeDamage(999);
  }

  if (state.keys["Shift"] && p.dashTimer <= 0 && (!p.lastDash || performance.now() - p.lastDash > p.dashCd * p.dashCdMul)) {
    p.dashTimer = 120;
    p.lastDash = performance.now();
    p.invuln = Math.max(p.invuln, 120);
    spawnParticles(p.x + p.w / 2, p.y + p.h / 2, 12, "#7de2d1", 3.5);
  }

  const attackKeyDown = Boolean(state.keys[" "]);
  const canHoldAttack = affixId === "macro";
  if (attackKeyDown && p.attackTimer <= 0 && (canHoldAttack || !p.attackHeld)) {
    doAttack();
    p.attackTimer = p.attackCd * p.attackCdMul;
    if (weaponId === "weapon_keyboard_split") {
      p.extraAttackTimer = 70;
      triggerWeaponPassiveHint("스플릿 예비 타격");
    }
    p.attackSwing = 160;
  }
  p.attackHeld = attackKeyDown;

  if (p.extraAttackTimer > 0) {
    p.extraAttackTimer -= dt;
    if (p.extraAttackTimer <= 0) {
      doAttack({ isExtra: true, noProjectile: true });
    }
  }

  if (ENABLE_RANGED_ATTACKS && (weaponId === "weapon_keyboard_capacitive" || affixId === "wireless") && state.keys["l"]) {
    if (!p.lastThrow || performance.now() - p.lastThrow > p.throwCd) {
      p.lastThrow = performance.now();
      spawnKeyboardProjectile({
        canReturn: weaponId === "weapon_keyboard_capacitive",
        returning: false,
        maxDist: weaponId === "weapon_keyboard_capacitive" ? 520 : 380,
        damage: Math.round(p.baseDamage * currentPlayerDamageMul() * (weaponId === "weapon_keyboard_capacitive" ? 1.05 : 0.75)),
        color: affixId === "wireless" ? "#ffd369" : "#bfe3ff",
      });
      log(weaponId === "weapon_keyboard_capacitive" ? "무접점 강화 입력 발동" : "Wireless 안정화 발동");
    }
  }

  if (Math.abs(p.vx) > 24 && p.onGround) p.walkAnim += dt * 0.025;
  p.attackSwing = Math.max(0, p.attackSwing - dt);
  if (p.attackSwing <= 0) p.lastAttackRange = null;
}

function doAttack(opts = {}) {
  const p = state.player;
  playSfx("hit");
  const reach = (p.styleReachBonus || 0) + (p.skillReachBonus || 0);
  const range = {
    x: p.facing > 0 ? p.x + p.w : p.x - (60 + reach),
    y: p.y + 8,
    w: 60 + reach,
    h: p.h - 16,
  };
  p.lastAttackRange = { ...range };
  const weaponId = p.weapon?.id;
  const affixId = p.weapon?.affix?.id;
  const baseDamage = Math.round(p.baseDamage * currentPlayerDamageMul() * (opts.isExtra ? 0.6 : 1));
  let hit = false;
  let passiveHint = "";

  for (const e of state.floor.enemies) {
    if (e.hp <= 0) continue;
    if (intersects(range, e)) {
      let damage = baseDamage;
      let isCrit = false;
      if (weaponId === "weapon_keyboard_blue" && Math.random() < 0.15) {
        damage = Math.round(damage * 1.7);
        isCrit = true;
        addScreenFx("slash", { strength: 0.16 });
        if (!passiveHint) passiveHint = "청축 치명타";
      }
      if (weaponId === "weapon_keyboard_red" && isBackAttack(p, e)) {
        damage = Math.round(damage * 1.5);
        isCrit = true;
        if (!passiveHint) passiveHint = "적축 백어택";
      }
      if (!isCrit && p.critChance > 0 && Math.random() < p.critChance) {
        damage = Math.round(damage * (p.critDamageMul || 1.5));
        isCrit = true;
      }
      if (p.executeThreshold > 0 && e.hp / Math.max(1, e.maxHp) <= p.executeThreshold) {
        damage = Math.round(damage * (1 + (p.executeDamageMul || 0)));
      }
      e.hp -= damage;
      spawnDamageText(e.x + e.w * 0.5, e.y - 4, damage, isCrit ? "#fff1b3" : "#ffe3a5", isCrit);
      e.x += p.facing * (e.type === "boss" ? 3 : 7);
      e.hitFlash = 120;
      applyOnHitEffects(e);
      hit = true;
      registerComboHit();
      addScreenFx("slash");
      spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.type === "boss" ? 12 : 6, "#ffd369", e.type === "boss" ? 3.2 : 2.4);
      if (weaponId === "weapon_keyboard_dusty") {
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 14, "#b8b6ad", 1.4);
        if (!passiveHint) passiveHint = "먼지 타격";
      } else if (weaponId === "weapon_keyboard_rgb" && !passiveHint) {
        passiveHint = "RGB 도트 점화";
      } else if (weaponId === "weapon_keyboard_aluminum" && !passiveHint) {
        passiveHint = "알루미늄 경직";
      }
      if (affixId === "sticky" && !passiveHint) passiveHint = "Sticky 감속";
      if (e.hp <= 0) {
        onEnemyDefeated(e, "hit");
      }
    }
  }
  if (hit) {
    playSfx("alert");
    if (!opts.isExtra) log("공격 적중");
    const x = p.facing > 0 ? range.x + range.w - 8 : range.x + 8;
    spawnParticles(x, range.y + range.h / 2, 5, "#ffffff", 1.4);
    if (passiveHint) triggerWeaponPassiveHint(passiveHint);
  }

  if (ENABLE_RANGED_ATTACKS && !opts.noProjectile && weaponId === "weapon_keyboard_capacitive") {
    spawnKeyboardProjectile({
      canReturn: true,
      maxDist: 520,
      damage: Math.round(baseDamage * 0.85),
      color: "#bfe3ff",
    });
  } else if (ENABLE_RANGED_ATTACKS && !opts.noProjectile && affixId === "wireless" && Math.random() < 0.35) {
    spawnKeyboardProjectile({
      canReturn: false,
      maxDist: 360,
      damage: Math.round(baseDamage * 0.6),
      color: "#ffd369",
    });
  }
}

function updateEnemies(dt) {
  const p = state.player;
  const dtSec = dt * 0.001;
  for (const e of state.floor.enemies) {
    if (e.hp <= 0) continue;
    e.hitFlash -= dt;
    e.walkAnim += dt * 0.015;
    e.stunTimer = Math.max(0, e.stunTimer - dt);
    e.slowTimer = Math.max(0, e.slowTimer - dt);
    e.dotTimer = Math.max(0, e.dotTimer - dt);
    if (e.dotTimer > 0) {
      e.dotTick = (e.dotTick || 0) - dt;
      if (e.dotTick <= 0) {
        e.dotTick = 300;
        e.hp -= Math.max(1, e.dotDamage || 3);
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 4, "#ff8f70", 0.9);
      }
    }
    if (e.hp <= 0) continue;

    if (e.type === "boss" || e.type === "exec") {
      const phase = resolveEnemyPhaseIndex(e);
      if (phase > (e.phaseIndex || 1)) {
        onElitePhaseShift(e, phase);
      }
    }

    if ((e.type === "boss" || e.type === "exec") && e.skillTimer != null) {
      e.skillTimer -= dt;
      if (e.skillTimer <= 0) {
        const phase = e.phaseIndex || resolveEnemyPhaseIndex(e);
        if (e.type === "exec") castExecutiveSkill(e, p, phase);
        else castBossSkill(e, p, phase);
        const phaseCdMul = Math.max(0.58, 1 - (phase - 1) * 0.14);
        e.skillTimer = (e.skillCd || 1800) * phaseCdMul;
      }
    }

    const dist = p.x - e.x;
    const absDist = Math.abs(dist);
    const aggro = (e.type === "boss" || e.type === "exec") ? 900 : 380;
    if (Math.abs(dist) < aggro) {
      e.dir = dist > 0 ? 1 : -1;
    }

    if (e.stunTimer <= 0) {
      const speedMul = e.slowTimer > 0 ? 0.55 : 1;
      if (e.type === "mob") {
        e.aiCooldown = (e.aiCooldown || 0) - dt;
        if (e.behavior === "kite") {
          if (absDist < 130) e.dir = dist > 0 ? -1 : 1;
          if (absDist > 210) e.dir = dist > 0 ? 1 : -1;
          if (e.aiCooldown <= 0 && absDist < 360) {
            const dir = dist > 0 ? 1 : -1;
            spawnEnemyProjectile(e.x + e.w * 0.5, e.y + e.h * 0.35, dir * 3.5, 0, {
              color: "rgba(255,225,170,0.9)",
              damage: Math.max(4, Math.round(e.damage * 0.55)),
              w: 8,
              h: 6,
              life: 1200,
            });
            e.aiCooldown = 850 + Math.random() * 700;
          }
        } else if (e.behavior === "flank") {
          const offset = dist > 0 ? -80 : 80;
          const target = p.x + offset;
          e.dir = target > e.x ? 1 : -1;
          if (e.aiCooldown <= 0 && absDist < 180) {
            e.x += e.dir * 28;
            e.aiCooldown = 780 + Math.random() * 640;
          }
        } else {
          e.dir = dist > 0 ? 1 : -1;
        }
      }
      const phaseSpeedMul = (e.type === "boss" || e.type === "exec")
        ? (1 + Math.max(0, (e.phaseIndex || 1) - 1) * 0.12)
        : 1;
      e.x += e.dir * e.speed * speedMul * phaseSpeedMul * dtSec * 60;
      if (e.x < 90) e.dir = 1;
      if (e.x + e.w > WORLD_WIDTH - 90) e.dir = -1;
    }

    if (e.stunTimer <= 0 && intersects(e, p)) {
      takeDamage(e.damage);
      p.x += e.dir * 2.8 * dtSec * 60;
    }
  }

  state.floor.enemies = state.floor.enemies.filter((e) => e.hp > 0);
  if (!state.floor.gateOpen && state.floor.enemies.length === 0) {
    state.floor.gateOpen = true;
    log("출구 활성화: E로 다음 층 이동");
  }
}

function updatePickups() {
  const p = state.player;
  state.floor.pickups = state.floor.pickups.filter((it) => {
    if (!intersects(it, p)) return true;
    if (it.type === "heal") {
      p.hp = Math.min(p.maxHp, p.hp + it.heal);
      log(`회복 키트 사용: +${it.heal} HP`);
      return false;
    }
    if (it.type === "artifact") {
      const entry = itemCatalog[it.key];
      state.meta.items[it.key] += 1;
      if (!state.meta.unlockedItems.includes(it.key)) state.meta.unlockedItems.push(it.key);
      entry.apply(state.meta);
      saveMeta();
      log(`영구 아이템 획득: ${entry.label} (${entry.desc})`);
      return false;
    }
    return true;
  });
}

function updateCamera() {
  state.cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, state.player.x - WIDTH * 0.35));
}

function spawnParticles(x, y, count, color, speed) {
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
}

function spawnDamageText(x, y, value, color = "#ffe3a5", isCrit = false) {
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
}

function updateParticles(dt) {
  const dtSec = dt * 0.001;
  state.particles = state.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dtSec * 60;
    p.y += p.vy * dtSec * 60;
    p.vy += 0.04 * dtSec * 3600;
    p.vx *= Math.pow(0.985, dtSec * 60);
    return p.life > 0;
  });
}

function updateDamageTexts(dt) {
  const dtSec = dt * 0.001;
  state.damageTexts = state.damageTexts.filter((d) => {
    d.life -= dt;
    d.y += d.vy * dtSec * 60;
    d.vy += 0.035 * dtSec * 3600;
    return d.life > 0;
  });
}

function updateProjectiles(dt) {
  const dtSec = dt * 0.001;
  state.projectiles = state.projectiles.filter((prj) => {
    prj.life -= dt;
    if (prj.life <= 0) return false;
    if (prj.canReturn && !prj.returning && Math.abs(prj.x - prj.startX) >= prj.maxDist) {
      prj.returning = true;
    }
    if (prj.returning) {
      const px = state.player.x + state.player.w / 2;
      const dir = px > prj.x ? 1 : -1;
      prj.vx = dir * Math.abs(prj.vx);
      if (Math.abs(px - prj.x) < 20) return false;
    }
    prj.x += prj.vx * dtSec * 60;

    for (const e of state.floor.enemies) {
      if (e.hp <= 0) continue;
      if (prj.hitSet.has(e)) continue;
      if (intersects(prj, e)) {
        e.hp -= prj.damage;
        spawnDamageText(e.x + e.w * 0.5, e.y - 4, prj.damage, "#d7f0ff", false);
        e.hitFlash = 100;
        applyOnHitEffects(e);
        registerComboHit();
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, 6, prj.color, 1.5);
        prj.hitSet.add(e);
        if (e.hp <= 0) {
          onEnemyDefeated(e, "projectile");
        }
        if (!prj.canReturn) return false;
      }
    }
    return prj.x > -50 && prj.x < WORLD_WIDTH + 50;
  });
}

function spawnEnemyProjectile(x, y, vx, vy, opts = {}) {
  if (!ENABLE_RANGED_ATTACKS) return;
  state.enemyProjectiles.push({
    x,
    y,
    w: opts.w || 10,
    h: opts.h || 10,
    vx,
    vy,
    life: opts.life || 1800,
    damage: opts.damage || 10,
    color: opts.color || "#ff9f7a",
  });
}

function spawnHazard(x, y, w, h, opts = {}) {
  const sw = Math.max(36, w * ENEMY_AOE_SCALE);
  const sh = Math.max(24, h * ENEMY_AOE_SCALE);
  const isGroundBound = Math.abs((y + h) - GROUND_Y) <= 4;
  const sx = x + (w - sw) * 0.5;
  const sy = isGroundBound ? (y + h - sh) : (y + (h - sh) * 0.5);
  state.hazards.push({
    x: sx,
    y: sy,
    w: sw,
    h: sh,
    life: opts.life || 1700,
    damage: opts.damage || 10,
    tick: 0,
    interval: opts.interval || 350,
    color: opts.color || "rgba(255,120,120,0.32)",
    border: opts.border || "rgba(255,170,170,0.9)",
    label: opts.label || "",
  });
}

function spawnEnemyTelegraph(x, y, w, h, opts = {}) {
  const sw = Math.max(36, w * ENEMY_AOE_SCALE);
  const sh = Math.max(24, h * ENEMY_AOE_SCALE);
  const isGroundBound = Math.abs((y + h) - GROUND_Y) <= 4;
  const sx = x + (w - sw) * 0.5;
  const sy = isGroundBound ? (y + h - sh) : (y + (h - sh) * 0.5);
  state.enemyTelegraphs.push({
    x: sx,
    y: sy,
    w: sw,
    h: sh,
    life: opts.life || 480,
    label: opts.label || "WARNING",
    color: opts.color || "rgba(255,110,110,0.2)",
    border: opts.border || "rgba(255,190,190,0.88)",
    onTrigger: typeof opts.onTrigger === "function" ? opts.onTrigger : null,
  });
}

function castExecutiveSkill(e, p, phase = 1) {
  const cx = e.x + e.w * 0.5;
  const cy = e.y + e.h * 0.5;
  const phaseDamageMul = 1 + (Math.max(1, phase) - 1) * 0.18;
  addShake(1.8);
  addScreenFx("alert");
  playSfx("executive");
  if (!ENABLE_RANGED_ATTACKS) {
    const hx = Math.max(80, Math.min(WORLD_WIDTH - 190, p.x - 45));
    spawnEnemyTelegraph(hx, GROUND_Y - 42, 130, 42, {
      life: 460,
      label: "결재라인 봉쇄",
      color: "rgba(225,170,255,0.22)",
      border: "rgba(242,210,255,0.9)",
      onTrigger: () => {
        spawnHazard(hx, GROUND_Y - 42, 130, 42, {
          life: 1500,
          damage: Math.round(9 * phaseDamageMul),
          interval: 260,
          color: "rgba(225,170,255,0.28)",
          border: "rgba(242,210,255,0.9)",
          label: "결재라인 봉쇄",
        });
      },
    });
    log(`${e.name}: 결재라인 봉쇄`);
    return;
  }
  if (e.name.includes("전략총괄")) {
    const tx = Math.max(60, Math.min(WORLD_WIDTH - 220, p.x - 60));
    const ty = Math.max(70, Math.min(GROUND_Y - 140, p.y - 24));
    spawnEnemyTelegraph(tx, ty, 180, 54, {
      life: 560,
      label: "KPI 폭격 지시",
      color: "rgba(255,220,140,0.2)",
      border: "rgba(255,232,170,0.92)",
      onTrigger: () => {
        const dx = p.x + p.w * 0.5 - cx;
        const dy = p.y + p.h * 0.5 - cy;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / len;
        const ny = dy / len;
        for (const spread of [-0.25, 0, 0.25]) {
          spawnEnemyProjectile(cx, cy, (nx + spread) * 4.6, (ny + spread * 0.5) * 4.2, {
            color: "#ffd38a",
            damage: Math.round(12 * phaseDamageMul),
            life: 2200,
          });
        }
      },
    });
    log(`${e.name}: KPI 폭격 지시`);
    return;
  }
  if (e.name.includes("재무총괄")) {
    spawnEnemyTelegraph(cx - 54, cy - 54, 108, 108, {
      life: 520,
      label: "코스트 커터 룰렛",
      color: "rgba(255,228,125,0.2)",
      border: "rgba(255,244,184,0.94)",
      onTrigger: () => {
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          spawnEnemyProjectile(cx, cy, Math.cos(a) * 3.6, Math.sin(a) * 3.6, {
            color: "#ffe07a",
            damage: Math.round(10 * phaseDamageMul),
            w: 8,
            h: 8,
            life: 1600,
          });
        }
      },
    });
    log(`${e.name}: 코스트 커터 룰렛`);
    return;
  }
  if (e.name.includes("인사총괄")) {
    const hx = Math.max(80, Math.min(WORLD_WIDTH - 180, p.x - 40));
    spawnEnemyTelegraph(hx, GROUND_Y - 40, 120, 40, {
      life: 520,
      label: "다면평가 지옥",
      color: "rgba(220,150,255,0.22)",
      border: "rgba(240,200,255,0.9)",
      onTrigger: () => {
        spawnHazard(hx, GROUND_Y - 40, 120, 40, {
          life: 2100,
          damage: Math.round(8 * phaseDamageMul),
          interval: 280,
          color: "rgba(220,150,255,0.26)",
          border: "rgba(240,200,255,0.9)",
          label: "다면평가 지옥",
        });
      },
    });
    log(`${e.name}: 다면평가 지옥 전개`);
    return;
  }
  if (e.name.includes("법무")) {
    const dir = p.x > e.x ? 1 : -1;
    const lx = dir > 0 ? cx : cx - 160;
    spawnEnemyTelegraph(lx, cy - 20, 160, 44, {
      life: 460,
      label: "컴플라이언스 통보",
      color: "rgba(213,185,255,0.2)",
      border: "rgba(235,215,255,0.9)",
      onTrigger: () => {
        for (let i = 0; i < 2; i++) {
          spawnEnemyProjectile(cx, cy - 10 + i * 18, dir * 4.8, 0, {
            color: "#d5b9ff",
            damage: Math.round(13 * phaseDamageMul),
            w: 18,
            h: 8,
            life: 1700,
          });
        }
      },
    });
    log(`${e.name}: 컴플라이언스 통보`);
    return;
  }
  if (phase >= 3 && !ENABLE_RANGED_ATTACKS) {
    const hx = Math.max(80, Math.min(WORLD_WIDTH - 190, p.x - 45));
    spawnHazard(hx, GROUND_Y - 42, 130, 42, {
      life: 900,
      damage: Math.round(7 * phaseDamageMul),
      interval: 230,
      color: "rgba(245,190,255,0.26)",
      border: "rgba(245,220,255,0.86)",
      label: "임원 보조 결재",
    });
  }
}

function castBossSkill(e, p, phase = 1) {
  const cx = e.x + e.w * 0.5;
  const cy = e.y + e.h * 0.45;
  const zone = e.zone || state.floor.info.zone;
  const isCeo = e.name.includes("CEO");
  addShake(isCeo ? 2.8 : 1.7);
  addScreenFx(isCeo ? "boss" : "alert", { strength: isCeo ? 0.2 : 0.13 });
  if (isCeo) playSfx("ceo");
  else if (zone === "server") playSfx("server");
  else if (zone === "glitch") playSfx("glitch");
  else if (zone === "executive") playSfx("executive");
  else playSfx("boss");
  if (!ENABLE_RANGED_ATTACKS) {
    const phaseNow = Math.max(1, phase || e.phaseIndex || 1);
    const phaseMul = 1 + (phaseNow - 1) * 0.2;
    const telegraphW = Math.round(150 * (1 + (phaseNow - 1) * 0.18));
    const telegraphH = Math.round(46 * (1 + (phaseNow - 1) * 0.1));
    const hx = Math.max(90, Math.min(WORLD_WIDTH - 230, p.x - 65));
    const meleeLabelByZone = {
      parking: "호루라기 돌진",
      lobby: "무결점 방패 밀어내기",
      showroom: "회의실 레이저 브리핑",
      mobile: "랜덤박스 폭주 소환",
      server: "키보드 사지 난타",
      glitch: "잠자리채 버그 스윕",
      marketing: "확성기 소음 과부하",
      support: "돈다발 KPI 세례",
      executive: "임원실 결재 폭압",
    };
    const label = isCeo ? "야근 확정 공표" : (meleeLabelByZone[zone] || "근접 제압");
    spawnEnemyTelegraph(hx, GROUND_Y - telegraphH, telegraphW, telegraphH, {
      life: Math.max(360, 520 - (phaseNow - 1) * 55),
      label,
      color: isCeo ? "rgba(255,150,190,0.22)" : "rgba(255,150,130,0.2)",
      border: isCeo ? "rgba(255,205,228,0.92)" : "rgba(255,205,186,0.9)",
      onTrigger: () => {
        const baseDamage = isCeo ? 12 : 10;
        spawnHazard(hx, GROUND_Y - telegraphH, telegraphW, telegraphH, {
          life: (isCeo ? 1700 : 1400) + (phaseNow - 1) * 180,
          damage: Math.round(baseDamage * phaseMul),
          interval: 260,
          color: isCeo ? "rgba(255,150,190,0.3)" : "rgba(255,150,130,0.27)",
          border: isCeo ? "rgba(255,205,228,0.92)" : "rgba(255,205,186,0.9)",
          label,
        });
        if (phaseNow >= 2) {
          const sideW = Math.round(telegraphW * 0.62);
          const sideX = Math.max(90, Math.min(WORLD_WIDTH - sideW - 90, hx + (p.x > e.x ? -46 : 46)));
          spawnHazard(sideX, GROUND_Y - telegraphH, sideW, telegraphH, {
            life: 900 + (phaseNow - 2) * 180,
            damage: Math.max(5, Math.round(baseDamage * phaseMul * 0.68)),
            interval: 240,
            color: isCeo ? "rgba(255,166,200,0.24)" : "rgba(255,170,140,0.24)",
            border: isCeo ? "rgba(255,220,236,0.82)" : "rgba(255,218,198,0.8)",
            label: `${label} - 확장`,
          });
        }
        if (phaseNow >= 3) {
          const pressureX = Math.max(86, Math.min(WORLD_WIDTH - 186, p.x - 58));
          spawnEnemyTelegraph(pressureX, GROUND_Y - 42, 128, 42, {
            life: 290,
            label: "압박 재시전",
            color: isCeo ? "rgba(255,132,178,0.2)" : "rgba(255,142,118,0.2)",
            border: isCeo ? "rgba(255,210,228,0.86)" : "rgba(255,212,188,0.84)",
            onTrigger: () => {
              spawnHazard(pressureX, GROUND_Y - 42, 128, 42, {
                life: 760,
                damage: Math.max(6, Math.round(baseDamage * phaseMul * 0.72)),
                interval: 210,
                color: isCeo ? "rgba(255,130,170,0.26)" : "rgba(255,150,120,0.24)",
                border: isCeo ? "rgba(255,220,236,0.84)" : "rgba(255,212,188,0.82)",
                label: "압박 재시전",
              });
            },
          });
        }
      },
    });
    log(`${e.name}: ${label} (P${phaseNow})`);
    return;
  }

  if (isCeo) {
    const phase = e.hp / e.maxHp;
    if (phase > 0.66) {
      const hx = Math.max(90, Math.min(WORLD_WIDTH - 250, p.x - 70));
      spawnEnemyTelegraph(hx, GROUND_Y - 46, 150, 46, {
        life: 560,
        label: "야근 확정 결재 폭주",
        color: "rgba(255,120,150,0.2)",
        border: "rgba(255,180,205,0.95)",
        onTrigger: () => {
          spawnHazard(hx, GROUND_Y - 46, 150, 46, {
            life: 1500,
            damage: 10,
            interval: 260,
            color: "rgba(255,120,150,0.28)",
            border: "rgba(255,180,205,0.95)",
            label: "야근 확정 결재 폭주",
          });
        },
      });
    }
    else if (phase > 0.33) {
      const dir = p.x > e.x ? 1 : -1;
      const lx = dir > 0 ? cx : cx - 220;
      spawnEnemyTelegraph(lx, cy - 26, 220, 52, {
        life: 470,
        label: "대표실 결재 연타",
        color: "rgba(255,143,174,0.2)",
        border: "rgba(255,196,214,0.9)",
        onTrigger: () => {
          for (const vy of [-1.2, 0, 1.2]) {
            spawnEnemyProjectile(cx, cy, (dir) * 5.2, vy * 2.1, {
              color: "#ff8fae",
              damage: 13,
              life: 2100,
            });
          }
        },
      });
    }
    else {
      spawnEnemyTelegraph(cx - 76, cy - 76, 152, 152, {
        life: 520,
        label: "이사회 만장일치",
        color: "rgba(243,183,255,0.2)",
        border: "rgba(251,224,255,0.94)",
        onTrigger: () => {
          for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12;
            spawnEnemyProjectile(cx, cy, Math.cos(a) * 4.1, Math.sin(a) * 4.1, {
              color: "#f3b7ff",
              damage: 12,
              w: 9,
              h: 9,
              life: 1700,
            });
          }
        },
      });
    }
    log(`${e.name}: 임원실 프로토콜`);
    return;
  }

  if (zone === "server") {
    const dir = p.x > e.x ? 1 : -1;
    const lx = dir > 0 ? cx : cx - 220;
    spawnEnemyTelegraph(lx, cy - 26, 220, 52, {
      life: 420,
      label: "트래픽 폭주 핑",
      color: "rgba(143,255,208,0.2)",
      border: "rgba(191,255,230,0.9)",
      onTrigger: () => {
        for (let i = -2; i <= 2; i++) {
          spawnEnemyProjectile(cx, cy + i * 10, dir * 5.3, 0, {
            color: "#8fffd0",
            damage: 10,
            w: 12,
            h: 6,
          });
        }
      },
    });
    return;
  }
  if (zone === "glitch") {
    const hx = Math.max(90, Math.min(WORLD_WIDTH - 180, p.x - 50 + (Math.random() * 120 - 60)));
    spawnEnemyTelegraph(hx, GROUND_Y - 36, 100, 36, {
      life: 500,
      label: "치명적 예외",
      color: "rgba(255,130,130,0.2)",
      border: "rgba(255,180,180,0.95)",
      onTrigger: () => {
        spawnHazard(hx, GROUND_Y - 36, 100, 36, {
          life: 1400,
          damage: 9,
          interval: 250,
          color: "rgba(255,130,130,0.3)",
          border: "rgba(255,180,180,0.95)",
          label: "치명적 예외",
        });
      },
    });
    return;
  }
  if (zone === "marketing") {
    const tx = Math.max(70, Math.min(WORLD_WIDTH - 200, p.x - 55));
    const ty = Math.max(70, Math.min(GROUND_Y - 140, p.y - 20));
    spawnEnemyTelegraph(tx, ty, 160, 52, {
      life: 430,
      label: "바이럴 음파",
      color: "rgba(255,229,143,0.2)",
      border: "rgba(255,243,190,0.9)",
      onTrigger: () => {
        const dx = p.x + p.w * 0.5 - cx;
        const dy = p.y + p.h * 0.5 - cy;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / len;
        const ny = dy / len;
        for (const s of [-0.22, 0, 0.22]) {
          spawnEnemyProjectile(cx, cy, (nx + s) * 4.4, (ny + s * 0.45) * 4.2, {
            color: "#ffe58f",
            damage: 10,
          });
        }
      },
    });
    return;
  }
  if (zone === "support") {
    const dir = p.x > e.x ? 1 : -1;
    const lx = dir > 0 ? cx : cx - 170;
    spawnEnemyTelegraph(lx, cy - 24, 170, 48, {
      life: 430,
      label: "콜 대기열 포화",
      color: "rgba(255,190,144,0.2)",
      border: "rgba(255,220,190,0.9)",
      onTrigger: () => {
        for (let i = 0; i < 4; i++) {
          spawnEnemyProjectile(cx, cy - 12 + i * 8, dir * 4.5, 0, {
            color: "#ffbe90",
            damage: 9,
          });
        }
      },
    });
    return;
  }
  const dir = p.x > e.x ? 1 : -1;
  spawnEnemyTelegraph(dir > 0 ? cx : cx - 160, cy - 20, 160, 40, {
    life: 380,
    label: "업무 지시 포격",
    color: "rgba(255,159,122,0.18)",
    border: "rgba(255,195,170,0.9)",
    onTrigger: () => {
      spawnEnemyProjectile(cx, cy, dir * 5.1, 0, {
        color: "#ff9f7a",
        damage: 10,
        w: 16,
        h: 8,
      });
    },
  });
}

function updateEnemyAttacks(dt) {
  const p = state.player;
  const dtSec = dt * 0.001;
  state.enemyTelegraphs = state.enemyTelegraphs.filter((tg) => {
    tg.life -= dt;
    if (tg.life <= 0) {
      if (tg.onTrigger) tg.onTrigger();
      return false;
    }
    return true;
  });

  state.enemyProjectiles = state.enemyProjectiles.filter((prj) => {
    prj.life -= dt;
    if (prj.life <= 0) return false;
    prj.x += prj.vx * dtSec * 60;
    prj.y += prj.vy * dtSec * 60;
    if (intersects(prj, p)) {
      takeDamage(prj.damage);
      return false;
    }
    return prj.x > -60 && prj.x < WORLD_WIDTH + 60 && prj.y > -40 && prj.y < HEIGHT + 80;
  });

  state.hazards = state.hazards.filter((hz) => {
    hz.life -= dt;
    hz.tick -= dt;
    if (hz.life <= 0) return false;
    if (intersects(hz, p) && hz.tick <= 0) {
      takeDamage(hz.damage);
      hz.tick = hz.interval;
    }
    return true;
  });
}

function tryExit() {
  if (!state.floor.gateOpen) return;
  if (intersects(state.player, state.floor.gate)) {
    nextFloor();
  }
}

function useConsumable(slotIdx) {
  const p = state.player;
  const slot = p.inventory[slotIdx];
  if (slotIdx !== 0 || slot !== "회복키트") {
    log("해당 슬롯에 사용할 소비 아이템이 없습니다.");
    return;
  }
  const cost = 35;
  if (p.gold < cost) {
    log(`골드 부족: 회복키트 사용에 ${cost}G 필요`);
    return;
  }
  p.gold -= cost;
  p.hp = Math.min(p.maxHp, p.hp + 40);
  spawnParticles(p.x + p.w / 2, p.y, 8, "#74c69d", 2);
  log(`Q 슬롯 사용: 회복키트 발동 (+40 HP, -${cost}G)`);
}

// ============================================
// 픽셀 아트 렌더링 시스템
// ============================================

// 픽셀 단위로 사각형 그리기 (픽셀 아트용)
function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function resolveFrameRect(img, frameSpec) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;
  if (!frameSpec || !frameSpec.w || !frameSpec.h) {
    return { sx: 0, sy: 0, sw: img.naturalWidth, sh: img.naturalHeight };
  }
  const sx = Math.max(0, Math.min(frameSpec.x || 0, img.naturalWidth - 1));
  const sy = Math.max(0, Math.min(frameSpec.y || 0, img.naturalHeight - 1));
  return {
    sx,
    sy,
    sw: Math.max(1, Math.min(frameSpec.w, img.naturalWidth - sx)),
    sh: Math.max(1, Math.min(frameSpec.h, img.naturalHeight - sy)),
  };
}

function drawImageSprite(img, x, y, w, h, flip = false, alpha = 1, frameSpec = null) {
  if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return false;
  const src = resolveFrameRect(img, frameSpec);
  if (!src) return false;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(Math.round(x + w), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, Math.round(w), Math.round(h));
  } else {
    ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  ctx.restore();
  return true;
}

function tileArtKeyForZone(zone) {
  if (zone === "parking" || zone === "server") return "stoneMid";
  if (zone === "cafeteria" || zone === "marketing") return "grassMid";
  return "brickWall";
}

function monsterArtKeyForArchetype(archetype) {
  switch (archetype) {
    case "crawler":
      return "snail";
    case "drone":
      return "bat";
    case "watcher":
      return "dark_guard";
    case "caster":
      return "necromancer";
    case "wisp":
      return "skull_slime";
    case "beast":
      return "goblin_hog";
    case "bulky":
      return "golem";
    case "glitcher":
      return "skull_slime";
    case "agent":
      return "dark_guard";
    default:
      return "goblin";
  }
}

function monsterArtKeyForEnemy(enemy) {
  const name = (enemy?.name || "").toLowerCase();
  if (name.includes("골렘") || name.includes("golem")) return "golem";
  if (name.includes("유령") || name.includes("망령") || name.includes("ghost")) return "necromancer";
  if (name.includes("박쥐") || name.includes("bat") || name.includes("드론")) return "bat";
  if (name.includes("슬라임") || name.includes("glitch") || name.includes("도플")) return "skull_slime";
  if (name.includes("달팽") || name.includes("snail")) return "snail";
  if (name.includes("개구") || name.includes("frog")) return "frog";
  if (name.includes("버섯") || name.includes("mushroom")) return "mushroom";
  if (name.includes("집행관") || name.includes("검열관") || name.includes("guard")) return "dark_guard";
  if (name.includes("사냥개") || name.includes("포식자") || name.includes("hog")) return "goblin_hog";
  return monsterArtKeyForArchetype(enemy?.archetype);
}

function eliteArtKeyForEnemy(enemy) {
  const name = (enemy?.name || "").toLowerCase();
  if (name.includes("ceo") || name.includes("대표") || name.includes("이사")) return "dark_guard";
  if (name.includes("골렘") || name.includes("golem")) return "golem";
  if (name.includes("헌터") || name.includes("망령") || name.includes("necro")) return "necromancer";
  if (name.includes("거미") || name.includes("사냥개") || name.includes("hog")) return "goblin_hog";
  if (enemy?.type === "boss") return "dark_guard";
  return "necromancer";
}

function drawGroundShadow(cx, y, w, alpha = 0.22) {
  const width = Math.max(10, w);
  drawPixelRect(cx - width * 0.5, y, width, 3, `rgba(0,0,0,${alpha})`);
  drawPixelRect(cx - width * 0.43, y + 2, width * 0.86, 2, `rgba(0,0,0,${alpha * 0.42})`);
  drawPixelRect(cx - width * 0.34, y - 1, width * 0.68, 1, `rgba(0,0,0,${alpha * 0.65})`);
  drawPixelRect(cx - width * 0.22, y - 2, width * 0.44, 1, `rgba(255,255,255,${alpha * 0.08})`);
}

function drawStatusPips(e, x, y) {
  let px = x;
  if (e.mutatorId) {
    const c = ENEMY_MUTATORS[e.mutatorId]?.color || "#d0d7de";
    drawPixelRect(px, y, 6, 6, c);
    px += 8;
  }
  if (e.stunTimer > 0) {
    drawPixelRect(px, y, 6, 6, "#ffd369");
    px += 8;
  }
  if (e.slowTimer > 0) {
    drawPixelRect(px, y, 6, 6, "#8fd3ff");
    px += 8;
  }
  if (e.dotTimer > 0) {
    drawPixelRect(px, y, 6, 6, "#ff8f70");
  }
}

function uiPaletteForZone(zone) {
  const ui = {
    parking: { panel: "rgba(13,19,27,0.86)", panelSoft: "rgba(34,47,64,0.88)", accent: "#8fb4d7", accentSoft: "#dbeaff" },
    cafeteria: { panel: "rgba(34,18,8,0.86)", panelSoft: "rgba(79,42,18,0.88)", accent: "#ffbe7a", accentSoft: "#ffe6cc" },
    lobby: { panel: "rgba(27,33,39,0.82)", panelSoft: "rgba(72,85,97,0.84)", accent: "#d7e7f7", accentSoft: "#f6fbff" },
    showroom: { panel: "rgba(8,34,32,0.84)", panelSoft: "rgba(17,75,69,0.88)", accent: "#99fff0", accentSoft: "#eafffb" },
    mobile: { panel: "rgba(23,12,34,0.86)", panelSoft: "rgba(63,37,88,0.88)", accent: "#dfb8ff", accentSoft: "#f6e7ff" },
    server: { panel: "rgba(10,30,19,0.86)", panelSoft: "rgba(24,86,51,0.88)", accent: "#9affc1", accentSoft: "#e9fff2" },
    glitch: { panel: "rgba(36,12,12,0.86)", panelSoft: "rgba(96,35,35,0.88)", accent: "#ffb3b3", accentSoft: "#ffecec" },
    marketing: { panel: "rgba(39,30,8,0.84)", panelSoft: "rgba(99,80,15,0.88)", accent: "#ffe083", accentSoft: "#fff5d2" },
    support: { panel: "rgba(38,16,8,0.86)", panelSoft: "rgba(96,41,12,0.88)", accent: "#ffc199", accentSoft: "#ffeadf" },
    executive: { panel: "rgba(30,11,41,0.86)", panelSoft: "rgba(82,41,102,0.88)", accent: "#e8beff", accentSoft: "#faeaff" },
  };
  return ui[zone] || ui.parking;
}

function zoneTint(zone, variant = 0) {
  const tints = {
    parking: ["rgba(130,170,210,0.1)", "rgba(160,190,220,0.09)", "rgba(110,150,190,0.1)"],
    cafeteria: ["rgba(240,180,120,0.1)", "rgba(255,200,140,0.09)", "rgba(220,150,90,0.1)"],
    lobby: ["rgba(220,230,240,0.1)", "rgba(240,245,250,0.09)", "rgba(200,215,230,0.1)"],
    showroom: ["rgba(130,230,220,0.1)", "rgba(160,245,235,0.09)", "rgba(100,210,200,0.1)"],
    mobile: ["rgba(210,150,240,0.1)", "rgba(230,180,255,0.09)", "rgba(180,120,220,0.1)"],
    server: ["rgba(150,240,180,0.1)", "rgba(180,255,205,0.09)", "rgba(120,220,160,0.1)"],
    glitch: ["rgba(255,140,140,0.1)", "rgba(255,170,170,0.09)", "rgba(230,110,110,0.1)"],
    marketing: ["rgba(255,220,130,0.1)", "rgba(255,235,160,0.09)", "rgba(235,195,95,0.1)"],
    support: ["rgba(245,175,120,0.1)", "rgba(255,200,150,0.09)", "rgba(225,140,80,0.1)"],
    executive: ["rgba(230,170,255,0.1)", "rgba(245,200,255,0.09)", "rgba(205,130,240,0.1)"],
  };
  const arr = tints[zone] || tints.parking;
  return arr[variant % arr.length];
}

function ambientSpecByZone(zone) {
  const t = {
    parking: { haze: "rgba(170,200,230,0.05)", spark: "rgba(210,230,255,0.22)", band: "rgba(130,160,190,0.08)" },
    cafeteria: { haze: "rgba(255,204,150,0.05)", spark: "rgba(255,230,195,0.22)", band: "rgba(210,138,78,0.08)" },
    lobby: { haze: "rgba(220,232,244,0.05)", spark: "rgba(246,251,255,0.22)", band: "rgba(166,188,210,0.08)" },
    showroom: { haze: "rgba(164,255,240,0.05)", spark: "rgba(212,255,247,0.22)", band: "rgba(90,208,194,0.08)" },
    mobile: { haze: "rgba(225,176,255,0.05)", spark: "rgba(245,220,255,0.22)", band: "rgba(148,92,192,0.08)" },
    server: { haze: "rgba(168,255,198,0.05)", spark: "rgba(219,255,234,0.22)", band: "rgba(86,188,124,0.08)" },
    glitch: { haze: "rgba(255,176,176,0.05)", spark: "rgba(255,214,214,0.22)", band: "rgba(198,84,84,0.08)" },
    marketing: { haze: "rgba(255,226,142,0.05)", spark: "rgba(255,244,204,0.22)", band: "rgba(194,164,58,0.08)" },
    support: { haze: "rgba(255,192,144,0.05)", spark: "rgba(255,224,202,0.22)", band: "rgba(196,108,58,0.08)" },
    executive: { haze: "rgba(236,188,255,0.05)", spark: "rgba(250,226,255,0.22)", band: "rgba(162,92,202,0.08)" },
  };
  return t[zone] || t.parking;
}

function mobPaletteByZone(zone) {
  return MOB_ZONE_PALETTES[zone] || MOB_PALETTE;
}

function bossPaletteByZone(zone) {
  return BOSS_ZONE_PALETTES[zone] || BOSS_PALETTE;
}

function execPaletteByZone(zone) {
  return EXEC_ZONE_PALETTES[zone] || EXEC_PALETTE;
}

function drawMobAccessory(e, x, y, pixelSize) {
  const archetype = e.archetype || mobArchetypeFromName(e.name || "");
  const tint = zoneTint(e.zone, e.variant || 0);
  const v = (e.variant || 0) % 3;
  const blink = 0.7 + Math.abs(Math.sin(performance.now() * 0.01 + (e.x || 0) * 0.02)) * 0.3;
  const soft = `rgba(255,255,255,${0.22 * blink})`;
  if (e.zone === "parking") {
    if (archetype === "drone") {
      // 세단 미믹: 전면 라이트 + 번호판
      drawPixelRect(x + 0, y + 2, 2, 2, `rgba(240,248,255,${0.9 * blink})`);
      drawPixelRect(x + 6, y + 2, 2, 2, `rgba(240,248,255,${0.9 * blink})`);
      drawPixelRect(x + 2, y + 5, 4, 1, "rgba(188,218,246,0.84)");
      drawPixelRect(x + 2, y + 6, 4, 1, "rgba(94,126,158,0.84)");
    } else if (archetype === "wisp") {
      // 매연 유령: 연기 꼬리
      drawPixelRect(x + 3, y + 0, 2, 1, "rgba(218,236,255,0.62)");
      drawPixelRect(x + 2, y + 1, 4, 1, "rgba(184,210,238,0.52)");
      drawPixelRect(x + 1, y + 6, 6, 1, "rgba(154,186,220,0.58)");
    } else if (archetype === "bulky") {
      // 불법주차 골렘: 경고 스티커
      drawPixelRect(x + 2, y + 2, 4, 1, "rgba(255,228,120,0.9)");
      drawPixelRect(x + 2, y + 3, 4, 1, "rgba(198,88,76,0.9)");
      drawPixelRect(x + 3, y + 6, 2, 1, "rgba(214,194,176,0.78)");
    } else if (archetype === "caster") {
      // 후진 알람 정령: 경광등
      drawPixelRect(x + 3, y + 0, 2, 1, "rgba(255,112,112,0.92)");
      drawPixelRect(x + 2, y + 1, 4, 1, "rgba(255,232,186,0.76)");
      drawPixelRect(x + 3, y + 5, 2, 2, `rgba(255,156,120,${0.82 * blink})`);
    } else if (archetype === "agent") {
      // 주차딱지 집행관: 딱지 클립보드
      drawPixelRect(x + 6, y + 2, 2, 3, "rgba(255,216,140,0.92)");
      drawPixelRect(x + 6, y + 5, 2, 1, "rgba(184,140,92,0.9)");
      drawPixelRect(x + 1, y + 6, 2, 1, "rgba(176,202,230,0.8)");
    } else {
      // 차단기 망령/기타: 차단봉 스트라이프
      drawPixelRect(x + 0, y + 1, 1, 6, "rgba(255,116,116,0.86)");
      drawPixelRect(x + 1, y + 1, 1, 6, "rgba(255,244,196,0.82)");
      drawPixelRect(x + 6, y + 6, 2, 1, "rgba(156,188,222,0.78)");
    }
    if (v === 1) drawPixelRect(x + 3, y + 1, 2, 1, "rgba(255,235,185,0.82)");
    if (v === 2) drawPixelRect(x + 0, y + 6, 2, 1, "rgba(120,164,200,0.78)");
  } else if (e.zone === "cafeteria") {
    // 식판 + 김
    drawPixelRect(x + 2, y + 6, 4, 1, "rgba(186,130,86,0.82)");
    drawPixelRect(x + 1, y + 7, 6, 1, "rgba(236,178,120,0.88)");
    drawPixelRect(x + 3, y + 1, 1, 2, "rgba(255,228,204,0.58)");
    drawPixelRect(x + 5, y + 0, 1, 2, "rgba(255,228,204,0.48)");
    if (v === 1) drawPixelRect(x + 0, y + 5, 2, 1, "rgba(255,205,152,0.85)");
    if (v === 2) drawPixelRect(x + 6, y + 5, 2, 1, "rgba(255,205,152,0.85)");
  } else if (e.zone === "lobby") {
    // 보안 배지 + CCTV 렌즈
    drawPixelRect(x + 3, y + 5, 2, 3, "rgba(220,232,246,0.9)");
    drawPixelRect(x + 3, y + 6, 2, 1, "rgba(76,98,122,0.92)");
    drawPixelRect(x + 6, y + 2, 1, 1, `rgba(232,244,255,${0.9 * blink})`);
    if (v !== 0) drawPixelRect(x + 1, y + 2 + v, 1, 1, "rgba(190,220,250,0.9)");
  } else if (e.zone === "showroom") {
    // 레이저 포인터 + 반사 하이라이트
    drawPixelRect(x + 6, y + 3, 2, 1, "rgba(146,255,236,0.86)");
    drawPixelRect(x + 5, y + 2, 1, 1, "rgba(122,245,222,0.8)");
    drawPixelRect(x + 1, y + 1, 1, 4, soft);
    if (v === 1) drawPixelRect(x + 7, y + 1, 1, 1, "rgba(186,255,242,0.9)");
    if (v === 2) drawPixelRect(x + 6, y + 5, 2, 1, "rgba(112,220,206,0.86)");
  } else if (e.zone === "mobile") {
    // 앱 아이콘 + 알림 배지
    drawPixelRect(x + 5, y + 2, 2, 3, "rgba(222,172,255,0.86)");
    drawPixelRect(x + 5, y + 5, 2, 1, "rgba(170,112,210,0.86)");
    drawPixelRect(x + 7, y + 1, 1, 1, "rgba(255,102,154,0.95)");
    if (v === 1) drawPixelRect(x + 4, y + 1, 1, 1, "rgba(255,176,215,0.9)");
    if (v === 2) drawPixelRect(x + 5, y + 0, 2, 1, "rgba(204,154,242,0.9)");
  } else if (e.zone === "server") {
    // 랙 LED + 케이블
    drawPixelRect(x + 1, y + 1, 6, 1, "rgba(156,255,196,0.84)");
    drawPixelRect(x + 2, y + 3, 1, 1, `rgba(188,255,218,${0.9 * blink})`);
    drawPixelRect(x + 5, y + 3, 1, 1, `rgba(120,255,176,${0.9 * blink})`);
    drawPixelRect(x + 0, y + 6, 8, 1, "rgba(90,164,122,0.75)");
    if (v === 1) drawPixelRect(x + 3, y + 0, 2, 1, "rgba(130,240,178,0.85)");
    if (v === 2) drawPixelRect(x + 7, y + 2, 1, 4, "rgba(100,190,142,0.8)");
  } else if (e.zone === "glitch") {
    // 깨진 픽셀 노이즈
    drawPixelRect(x + 0, y + 0, 2, 1, "rgba(255,170,170,0.95)");
    drawPixelRect(x + 6, y + 5, 2, 1, "rgba(255,130,130,0.95)");
    drawPixelRect(x + 3, y + 2, 1, 1, "rgba(255,210,210,0.95)");
    drawPixelRect(x + 1, y + 6, 2, 1, "rgba(220,90,90,0.85)");
    if (v === 1) drawPixelRect(x + 4, y + 0, 2, 1, "rgba(255,170,210,0.82)");
    if (v === 2) drawPixelRect(x + 0, y + 4, 1, 2, "rgba(210,70,140,0.85)");
  } else if (e.zone === "marketing") {
    // 확성기/배너 포인트
    drawPixelRect(x + 2, y + 0, 4, 1, "rgba(255,238,166,0.92)");
    drawPixelRect(x + 5, y + 2, 2, 2, "rgba(252,212,106,0.9)");
    drawPixelRect(x + 1, y + 4, 2, 1, "rgba(255,250,210,0.72)");
    if (v === 1) drawPixelRect(x + 0, y + 1, 2, 1, "rgba(255,232,150,0.85)");
    if (v === 2) drawPixelRect(x + 6, y + 4, 2, 1, "rgba(255,216,112,0.9)");
  } else if (e.zone === "support") {
    // 헤드셋 + 마이크 붐
    drawPixelRect(x + 1, y + 2, 1, 3, "rgba(255,204,182,0.88)");
    drawPixelRect(x + 6, y + 2, 1, 3, "rgba(255,204,182,0.88)");
    drawPixelRect(x + 2, y + 1, 4, 1, "rgba(255,226,206,0.78)");
    drawPixelRect(x + 6, y + 5, 2, 1, "rgba(245,170,120,0.9)");
    if (v === 1) drawPixelRect(x + 0, y + 5, 2, 1, "rgba(255,190,142,0.9)");
    if (v === 2) drawPixelRect(x + 5, y + 0, 1, 1, "rgba(255,226,186,0.8)");
  } else if (e.zone === "executive") {
    // 넥타이 + 금장 배지
    drawPixelRect(x + 3, y + 2, 1, 3, "rgba(246,226,255,0.9)");
    drawPixelRect(x + 4, y + 2, 1, 3, "rgba(194,144,226,0.9)");
    drawPixelRect(x + 2, y + 1, 1, 1, "rgba(255,224,150,0.92)");
    if (v === 1) drawPixelRect(x + 5, y + 1, 1, 1, "rgba(255,224,154,0.9)");
    if (v === 2) drawPixelRect(x + 1, y + 2, 1, 2, "rgba(214,164,244,0.85)");
  }
  if (archetype === "drone") {
    drawPixelRect(x + 1, y - 1, 6, 1, "rgba(220,245,255,0.72)");
    drawPixelRect(x + 2, y - 2, 4, 1, "rgba(160,220,245,0.68)");
  } else if (archetype === "crawler") {
    drawPixelRect(x - 1, y + 6, 2, 1, "rgba(214,232,244,0.72)");
    drawPixelRect(x + 7, y + 6, 2, 1, "rgba(214,232,244,0.72)");
  } else if (archetype === "caster") {
    drawPixelRect(x + 3, y - 1, 2, 1, "rgba(236,216,255,0.78)");
    drawPixelRect(x + 2, y - 2, 4, 1, "rgba(196,156,242,0.68)");
  } else if (archetype === "glitcher") {
    drawPixelRect(x + 0, y + 3, 2, 1, "rgba(255,150,200,0.85)");
    drawPixelRect(x + 6, y + 1, 2, 1, "rgba(170,245,255,0.82)");
  }
  drawPixelRect(x - 1, y + 2, 1, 3, tint);
  drawPixelRect(x + 8, y + 3, 1, 2, withAlpha(tint, 0.7));
}

function eliteAuraColor(e) {
  if (e.type === "boss") {
    if (e.zone === "server") return "rgba(120,255,190,";
    if (e.zone === "glitch") return "rgba(255,140,140,";
    if (e.zone === "executive") return "rgba(220,160,255,";
    return "rgba(255,120,120,";
  }
  if (e.zone === "executive") return "rgba(230,170,255,";
  if (e.zone === "lobby") return "rgba(190,220,255,";
  return "rgba(220,160,255,";
}

function drawEliteAccessory(e, x, y) {
  const pulse = 0.68 + Math.abs(Math.sin(performance.now() * 0.008 + x * 0.01)) * 0.32;
  if (e.type === "boss") {
    if (e.zone === "parking") {
      drawPixelRect(x + 7, y + 2, 8, 2, `rgba(240,250,255,${0.72 * pulse})`);
      drawPixelRect(x + 5, y + 8, 3, 1, "rgba(255,220,150,0.78)");
    } else if (e.zone === "lobby") {
      drawPixelRect(x + 8, y + 2, 6, 2, `rgba(226,240,255,${0.74 * pulse})`);
      drawPixelRect(x + 6, y + 10, 4, 2, "rgba(188,220,255,0.72)");
    } else if (e.zone === "showroom") {
      drawPixelRect(x + 9, y + 2, 6, 1, "rgba(178,255,242,0.78)");
      drawPixelRect(x + 6, y + 10, 4, 2, "rgba(136,238,224,0.72)");
    } else if (e.zone === "mobile") {
      drawPixelRect(x + 8, y + 2, 6, 2, "rgba(234,194,255,0.78)");
      drawPixelRect(x + 13, y + 1, 2, 2, "rgba(255,130,176,0.9)");
    } else if (e.zone === "server") {
      drawPixelRect(x + 6, y + 2, 8, 2, `rgba(178,255,206,${0.76 * pulse})`);
      drawPixelRect(x + 6, y + 10, 6, 1, "rgba(102,192,132,0.76)");
    } else if (e.zone === "glitch") {
      drawPixelRect(x + 8, y + 2, 6, 2, "rgba(255,180,180,0.78)");
      drawPixelRect(x + 5, y + 10, 4, 2, "rgba(220,110,142,0.8)");
    } else if (e.zone === "marketing") {
      drawPixelRect(x + 8, y + 2, 6, 2, "rgba(255,236,164,0.8)");
      drawPixelRect(x + 6, y + 10, 6, 1, "rgba(246,198,94,0.78)");
    } else if (e.zone === "support") {
      drawPixelRect(x + 8, y + 2, 6, 2, "rgba(255,215,182,0.8)");
      drawPixelRect(x + 5, y + 9, 2, 4, "rgba(248,170,126,0.82)");
    } else {
      drawPixelRect(x + 8, y + 2, 6, 2, "rgba(255,255,255,0.72)");
      drawPixelRect(x + 2, y + 10, 3, 3, "rgba(255,215,150,0.65)");
    }
    return;
  }
  drawPixelRect(x + 5, y + 1, 4, 2, `rgba(255,255,255,${0.64 + pulse * 0.2})`);
  drawPixelRect(x + 3, y + 8, 6, 1, "rgba(240,220,255,0.72)");
  if (e.name.includes("전략총괄")) {
    drawPixelRect(x + 2, y + 5, 2, 2, "rgba(255,232,170,0.86)");
  } else if (e.name.includes("재무총괄")) {
    drawPixelRect(x + 8, y + 6, 2, 2, "rgba(255,222,120,0.88)");
  } else if (e.name.includes("인사총괄")) {
    drawPixelRect(x + 4, y + 6, 1, 3, "rgba(226,180,255,0.86)");
  } else if (e.name.includes("법무")) {
    drawPixelRect(x + 2, y + 6, 6, 1, "rgba(214,186,255,0.86)");
  }
}

// 픽셀 아트 스프라이트 그리기 (2D 배열 기반)
function drawSprite(x, y, pixelSize, spriteMap, palette, flip = false) {
  const rows = spriteMap.length;
  const cols = spriteMap[0].length;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const colorCode = spriteMap[row][col];
      if (colorCode !== 0 && palette[colorCode]) {
        const drawCol = flip ? (cols - 1 - col) : col;
        drawPixelRect(
          x + drawCol * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize,
          palette[colorCode]
        );
      }
    }
  }
}

// ============================================
// 픽셀 아트 스프라이트 정의
// ============================================

// 플레이어 스프라이트 (16x20 기준)
const PLAYER_SPRITE = {
  idle: [
    [0,0,0,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,0,0],
    [0,1,4,4,4,4,4,4,1,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,0,0,4,4,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,7,7,0,0,7,7,0,0,0],
  ],
  walk1: [
    [0,0,0,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,0,0],
    [0,1,4,4,4,4,4,4,1,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,6,0,0,4,4,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,7,7,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,7,7,0,0,0],
  ],
  walk2: [
    [0,0,0,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,0,0],
    [0,1,4,4,4,4,4,4,1,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,0,0,6,4,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,0,0,0,0,7,7,0,0,0],
    [0,0,7,7,0,0,0,0,0,0,0],
  ],
  jump: [
    [0,0,0,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,0,0],
    [0,1,4,4,4,4,4,4,1,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,0,0,4,4,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,0,0,7,7,0,0,0,0,0],
    [0,0,7,7,0,0,7,7,0,0,0],
  ],
  fall: [
    [0,0,0,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,0,0],
    [0,1,4,4,4,4,4,4,1,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,0,0,4,4,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,7,7,0,0,0,0,0,0,0],
    [0,0,0,0,7,7,7,7,0,0,0],
  ],
  land: [
    [0,0,0,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,0,0],
    [0,1,4,4,4,4,4,4,1,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0],
    [0,0,4,4,0,0,4,4,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0],
    [0,0,7,7,7,7,7,7,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
  dash: [
    [0,0,0,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0,0],
    [0,0,1,4,4,4,4,1,1,0,0,0],
    [0,1,1,4,5,5,4,1,1,1,0,0],
    [0,1,4,4,5,5,4,4,1,1,0,0],
    [0,1,4,4,4,4,4,4,1,1,0,0],
    [0,0,4,4,4,4,4,4,1,0,0,0],
    [0,0,4,4,4,4,4,4,1,0,0,0],
    [0,0,4,4,0,0,4,4,1,0,0,0],
    [0,0,6,6,0,0,6,6,1,0,0,0],
    [0,0,7,7,0,0,7,7,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  attack: [
    [0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,1,2,2,2,2,1,0,0,0,0,0,0],
    [0,0,1,2,3,2,3,1,0,0,0,0,0,0],
    [0,0,0,2,2,2,2,0,0,0,0,0,0,0],
    [0,0,0,1,4,4,1,0,0,0,0,0,0,0],
    [0,0,1,4,4,4,4,1,0,8,8,8,0,0],
    [0,1,1,4,5,5,4,1,1,8,9,8,0,0],
    [0,1,4,4,5,5,4,4,1,8,8,8,0,0],
    [0,1,4,4,4,4,4,4,1,0,0,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0,0,0,0],
    [0,0,4,4,4,4,4,4,0,0,0,0,0,0],
    [0,0,4,4,0,0,4,4,0,0,0,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0,0,0,0],
    [0,0,6,6,0,0,6,6,0,0,0,0,0,0],
    [0,0,7,7,0,0,7,7,0,0,0,0,0,0],
  ],
};

function buildStyleSpriteSet(base, styleId) {
  const clone = {};
  for (const [k, frame] of Object.entries(base)) {
    clone[k] = frame.map((r) => r.slice());
  }
  if (styleId === "vanguard") {
    // 넓은 자세 + 키보드 가드
    clone.idle[8][1] = 8; clone.idle[9][1] = 8;
    clone.walk1[8][1] = 8; clone.walk2[8][1] = 8;
    clone.attack[9][1] = 8; clone.attack[10][1] = 8;
    clone.attack[6][9] = 8; clone.attack[6][10] = 8; clone.attack[6][11] = 9;
    clone.attack[7][9] = 8; clone.attack[7][10] = 9; clone.attack[7][11] = 9;
  } else if (styleId === "phantom") {
    // 후드형 실루엣 + 빠른 타건 잔상
    clone.idle[10][8] = 5; clone.idle[11][8] = 5;
    clone.walk1[10][8] = 5; clone.walk2[10][8] = 5;
    clone.attack[7][11] = 9; clone.attack[8][11] = 9;
    clone.attack[6][10] = 8; clone.attack[6][11] = 9;
    clone.attack[7][9] = 8; clone.attack[8][10] = 9;
  } else {
    // 돌격형은 키보드 타건 코어 강화
    clone.attack[6][10] = 8; clone.attack[6][11] = 9;
    clone.attack[7][9] = 8; clone.attack[7][10] = 9; clone.attack[7][11] = 9;
    clone.attack[8][10] = 9; clone.attack[8][11] = 8;
  }
  return clone;
}

const PLAYER_PALETTE = {
  1: "#2a3242",  // 머리카락/후드
  2: "#e8c5a4",  // 피부
  3: "#182032",  // 눈/안경
  4: "#3f5f8d",  // 상의
  5: "#79a2d8",  // 포인트(배지/스트랩)
  6: "#263244",  // 하의
  7: "#121825",  // 신발
  8: "#dff2ff",  // 키보드 윤곽
  9: "#ffcf6e",  // 키보드 코어
};

const PLAYER_STYLE_PALETTES = {
  vanguard: { ...PLAYER_PALETTE, 1: "#2f3f58", 4: "#4f7ba8", 5: "#9fd4ff", 8: "#dbf3ff", 9: "#9dd6ff" },
  striker: { ...PLAYER_PALETTE, 1: "#34324a", 4: "#5d68a1", 5: "#f6c56d", 8: "#fff0d5", 9: "#ffd28a" },
  phantom: { ...PLAYER_PALETTE, 1: "#2f2744", 4: "#5d4a8a", 5: "#be9df2", 8: "#f5dcff", 9: "#d8b7ff" },
};

const PLAYER_STYLE_SPRITES = {
  vanguard: buildStyleSpriteSet(PLAYER_SPRITE, "vanguard"),
  striker: buildStyleSpriteSet(PLAYER_SPRITE, "striker"),
  phantom: buildStyleSpriteSet(PLAYER_SPRITE, "phantom"),
};

function keyboardPaletteByTier(tier) {
  if (tier === "Legendary") return { body: "#e7dcff", key: "#b49cff", glow: "#ceb8ff" };
  if (tier === "Epic") return { body: "#d8f7ff", key: "#7ee7ff", glow: "#87e8ff" };
  if (tier === "Rare") return { body: "#e3ecff", key: "#95b5ff", glow: "#a9c6ff" };
  return { body: "#d5dfec", key: "#95a9c0", glow: "#aec4de" };
}

function drawPlayerDeveloperDetails(p, drawX, drawY, styleId) {
  const facing = p.facing >= 0 ? 1 : -1;
  const tier = p.weapon?.tier || "Common";
  const kb = keyboardPaletteByTier(tier);
  const handY = drawY + 19;
  const keyboardX = facing > 0 ? drawX + 17 : drawX + 3;
  const glow = 0.18 + Math.abs(Math.sin(performance.now() * 0.01)) * 0.16;
  const zone = state.floor?.info?.zone || "lobby";
  const zoneUi = uiPaletteForZone(zone);

  // 안경/이어폰/사원증 디테일
  drawPixelRect(drawX + 8, drawY + 7, 3, 1, "rgba(228,236,246,0.92)");
  drawPixelRect(drawX + 12, drawY + 7, 3, 1, "rgba(228,236,246,0.92)");
  drawPixelRect(drawX + 11, drawY + 7, 1, 1, "rgba(166,186,206,0.9)");
  drawPixelRect(drawX + (styleId === "phantom" ? 16 : 6), drawY + 12, 2, 4, "rgba(118,162,214,0.78)");
  drawPixelRect(drawX + 9, drawY + 16, 4, 1, withAlpha(zoneUi.accent, 0.58));

  // 스타일별 실루엣
  if (styleId === "vanguard") {
    drawPixelRect(drawX + 0, drawY + 16, 4, 9, "rgba(176,220,255,0.58)");
    drawPixelRect(drawX + 3, drawY + 17, 2, 7, "rgba(224,244,255,0.42)");
  } else if (styleId === "striker") {
    drawPixelRect(drawX + 18, drawY + 17, 5, 2, "rgba(255,214,142,0.5)");
    drawPixelRect(drawX + 20, drawY + 20, 4, 1, "rgba(255,238,180,0.46)");
  } else if (styleId === "phantom") {
    drawPixelRect(drawX + 22, drawY + 14, 6, 3, "rgba(204,164,255,0.46)");
    drawPixelRect(drawX + 24, drawY + 18, 4, 2, "rgba(224,198,255,0.38)");
  }

  // 키보드 무기 (항상 손에 들림)
  drawPixelRect(keyboardX, handY, 12, 4, kb.body);
  drawPixelRect(keyboardX + 1, handY + 1, 10, 2, kb.key);
  drawPixelRect(keyboardX + 0, handY + 4, 12, 1, "rgba(35,48,70,0.8)");
  for (let i = 0; i < 5; i++) {
    drawPixelRect(keyboardX + 2 + i * 2, handY + 2, 1, 1, "rgba(248,252,255,0.82)");
  }
  drawPixelRect(keyboardX - 2, handY + 1, 2, 1, "rgba(90,112,142,0.82)");
  drawPixelRect(keyboardX - 3, handY + 1, 1, 3, "rgba(76,100,132,0.82)");
  drawPixelRect(keyboardX - 5, handY + 3, 2, 1, "rgba(126,166,206,0.78)");
  drawPixelRect(keyboardX - 1, handY - 1, 14, 1, withAlpha(kb.glow, glow));
  drawPixelRect(keyboardX + 1, handY + 5, 10, 1, withAlpha(zoneUi.accentSoft, 0.28));
}

function drawKeyboardSwingFx(p, baseX, baseY, styleId) {
  const t = p.attackSwing / 160;
  const tier = p.weapon?.tier || "Common";
  const kb = keyboardPaletteByTier(tier);
  const dir = p.facing > 0 ? 1 : -1;
  const seg = styleId === "vanguard" ? 5 : (styleId === "phantom" ? 7 : 6);
  const step = styleId === "vanguard" ? 8 : 7;
  const rise = styleId === "phantom" ? 4 : 3;
  const fade = 0.22 + t * 0.28;
  for (let i = 0; i < seg; i++) {
    const px = baseX + dir * (i * step + (1 - t) * 16);
    const py = baseY - i * rise + Math.sin((i + t) * 0.8) * 1.4;
    drawPixelRect(px, py, 6, 2, withAlpha(kb.key, fade - i * 0.025));
    drawPixelRect(px + dir * 2, py - 1, 3, 1, withAlpha(kb.body, fade - i * 0.03));
  }
}

// 일반 적 스프라이트 (슬라임/버그 타입)
const MOB_SPRITE = {
  idle: [
    [0,0,1,1,1,1,0,0],
    [0,1,1,2,2,1,1,0],
    [1,1,2,3,3,2,1,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,1,0],
    [0,0,1,4,4,1,0,0],
    [0,1,1,0,0,1,1,0],
  ],
  walk1: [
    [0,0,1,1,1,1,0,0],
    [0,1,1,2,2,1,1,0],
    [1,1,2,3,3,2,1,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,1,0],
    [0,0,1,4,1,0,0,0],
    [0,0,0,0,1,1,0,0],
  ],
  walk2: [
    [0,0,1,1,1,1,0,0],
    [0,1,1,2,2,1,1,0],
    [1,1,2,3,3,2,1,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,1,0],
    [0,0,0,1,4,1,0,0],
    [0,0,1,1,0,0,0,0],
  ],
};

function cloneSpriteSet(base) {
  const c = {};
  for (const [k, frame] of Object.entries(base)) {
    c[k] = frame.map((r) => r.slice());
  }
  return c;
}

function buildMobSpriteSet(kind) {
  const s = cloneSpriteSet(MOB_SPRITE);
  if (kind === "bulky") {
    // 골렘/중장형: 어깨와 하체 볼륨 강조
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][1][0] = 1; s[key][1][7] = 1;
      s[key][3][0] = 1; s[key][3][7] = 1;
      s[key][6][2] = 4; s[key][6][5] = 4;
    }
  } else if (kind === "wisp") {
    // 유령/정령형: 상체 집중 + 하단 잔상
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][0][2] = 0; s[key][0][5] = 0;
      s[key][6][3] = 0; s[key][6][4] = 0;
      s[key][7][1] = 0; s[key][7][6] = 0;
      s[key][7][2] = 1; s[key][7][5] = 1;
    }
  } else if (kind === "watcher") {
    // 감시자/비홀더형: 단안 센서 강조
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][2][3] = 0; s[key][2][4] = 3;
      s[key][3][2] = 2; s[key][3][5] = 2;
      s[key][6][3] = 4; s[key][6][4] = 0;
    }
  } else if (kind === "beast") {
    // 거미/히드라/포식자형: 다리 강조
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][6][1] = 4; s[key][6][6] = 4;
      s[key][7][0] = 1; s[key][7][7] = 1;
      s[key][7][2] = 0; s[key][7][5] = 0;
    }
  } else if (kind === "agent") {
    // 암살자/심사관형: 날렵한 몸체
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][1][1] = 0; s[key][1][6] = 0;
      s[key][3][1] = 2; s[key][3][6] = 2;
      s[key][7][3] = 4; s[key][7][4] = 4;
    }
  } else if (kind === "drone") {
    // 드론/기계형: 상단 로터 + 중심 코어
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][0][1] = 4; s[key][0][2] = 4; s[key][0][5] = 4; s[key][0][6] = 4;
      s[key][1][0] = 1; s[key][1][7] = 1;
      s[key][2][3] = 3; s[key][2][4] = 3;
      s[key][6][2] = 0; s[key][6][5] = 0;
      s[key][7][1] = 0; s[key][7][6] = 0;
    }
  } else if (kind === "crawler") {
    // 포식/하층형: 저중심 + 다리 강조
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][0][2] = 0; s[key][0][5] = 0;
      s[key][1][1] = 2; s[key][1][6] = 2;
      s[key][5][0] = 4; s[key][5][7] = 4;
      s[key][6][0] = 4; s[key][6][7] = 4;
      s[key][7][2] = 4; s[key][7][5] = 4;
    }
  } else if (kind === "caster") {
    // 정령/주술형: 상체 집중 + 하단 흐름
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][0][3] = 3; s[key][0][4] = 3;
      s[key][1][2] = 1; s[key][1][5] = 1;
      s[key][2][1] = 2; s[key][2][6] = 2;
      s[key][6][3] = 0; s[key][6][4] = 0;
      s[key][7][2] = 1; s[key][7][5] = 1;
    }
  } else if (kind === "glitcher") {
    // 글리치형: 비대칭 파손 실루엣
    for (const key of ["idle", "walk1", "walk2"]) {
      s[key][1][0] = 0; s[key][1][7] = 1;
      s[key][2][2] = 3; s[key][2][5] = 0;
      s[key][3][1] = 4; s[key][3][6] = 2;
      s[key][5][0] = 1; s[key][5][7] = 4;
      s[key][7][3] = 0; s[key][7][4] = 4;
    }
  }
  return s;
}

const MOB_ARCHETYPE_SPRITES = {
  base: MOB_SPRITE,
  bulky: buildMobSpriteSet("bulky"),
  wisp: buildMobSpriteSet("wisp"),
  watcher: buildMobSpriteSet("watcher"),
  beast: buildMobSpriteSet("beast"),
  agent: buildMobSpriteSet("agent"),
  drone: buildMobSpriteSet("drone"),
  crawler: buildMobSpriteSet("crawler"),
  caster: buildMobSpriteSet("caster"),
  glitcher: buildMobSpriteSet("glitcher"),
};

function mobArchetypeFromName(name = "") {
  return MonsterArchetypeSystem.resolveNameArchetype(name);
}

function mobVisualProfile(e) {
  const archetype = e.archetype || mobArchetypeFromName(e.name || "");
  if (archetype === "drone") return { spriteSet: MOB_ARCHETYPE_SPRITES.drone, pixelSize: 2.14, lift: -1 };
  if (archetype === "watcher") return { spriteSet: MOB_ARCHETYPE_SPRITES.watcher, pixelSize: 2.25, lift: 2 };
  if (archetype === "caster") return { spriteSet: MOB_ARCHETYPE_SPRITES.caster, pixelSize: 2.2, lift: 0 };
  if (archetype === "wisp") return { spriteSet: MOB_ARCHETYPE_SPRITES.wisp, pixelSize: 2.15, lift: 1 };
  if (archetype === "beast") return { spriteSet: MOB_ARCHETYPE_SPRITES.beast, pixelSize: 2.28, lift: 3 };
  if (archetype === "crawler") return { spriteSet: MOB_ARCHETYPE_SPRITES.crawler, pixelSize: 2.35, lift: 4 };
  if (archetype === "bulky") return { spriteSet: MOB_ARCHETYPE_SPRITES.bulky, pixelSize: 2.3, lift: 3 };
  if (archetype === "glitcher") return { spriteSet: MOB_ARCHETYPE_SPRITES.glitcher, pixelSize: 2.24, lift: 2 };
  if (archetype === "agent") return { spriteSet: MOB_ARCHETYPE_SPRITES.agent, pixelSize: 2.18, lift: 2 };
  return { spriteSet: MOB_ARCHETYPE_SPRITES.base, pixelSize: 2.2, lift: 2 };
}

const MOB_PALETTE = {
  1: "#4a5568",
  2: "#718096",
  3: "#f6e05e",  // 눈
  4: "#2d3748",
};

const MOB_ZONE_PALETTES = {
  parking: {
    1: "#46586b",
    2: "#71879b",
    3: "#f6e05e",
    4: "#2a3642",
  },
  cafeteria: {
    1: "#6b4f38",
    2: "#9e7b5a",
    3: "#ffd59e",
    4: "#4b3526",
  },
  lobby: {
    1: "#6c7683",
    2: "#9eaab8",
    3: "#eff8ff",
    4: "#48515d",
  },
  showroom: {
    1: "#3a7270",
    2: "#56a8a3",
    3: "#d0fff8",
    4: "#2b5956",
  },
  mobile: {
    1: "#5d4675",
    2: "#8d67af",
    3: "#f1d6ff",
    4: "#402f50",
  },
  server: {
    1: "#3f7050",
    2: "#64b584",
    3: "#dbffe7",
    4: "#2f5840",
  },
  glitch: {
    1: "#7a4343",
    2: "#c96a6a",
    3: "#ffe0e0",
    4: "#5a2f2f",
  },
  marketing: {
    1: "#7e6a34",
    2: "#ccb15d",
    3: "#fff3b8",
    4: "#5e512a",
  },
  support: {
    1: "#7a4f36",
    2: "#be7a55",
    3: "#ffd9c7",
    4: "#5a3a28",
  },
  executive: {
    1: "#5b3e70",
    2: "#a174c7",
    3: "#f5ddff",
    4: "#3e2a4d",
  },
};

// 보스 스프라이트
const BOSS_SPRITE = {
  idle: [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,2,2,2,2,1,1,0,0],
    [0,1,1,2,3,2,2,3,2,1,1,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [1,1,2,4,4,2,2,4,4,2,1,1],
    [1,2,2,4,4,2,2,4,4,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,5,5,2,2,2,2,5,5,2,1],
    [1,2,5,5,2,2,2,2,5,5,2,1],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [0,1,2,2,6,6,6,6,2,2,1,0],
    [0,0,1,2,2,6,6,2,2,1,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
  ],
  angry: [
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,2,2,2,2,1,1,0,0],
    [0,1,1,2,2,2,2,2,2,1,1,0],
    [0,1,2,4,4,2,2,4,4,2,1,0],
    [1,1,2,2,2,2,2,2,2,2,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,7,7,2,2,2,2,7,7,2,1],
    [1,2,7,8,2,2,2,2,8,7,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,1],
    [0,1,2,5,5,2,2,5,5,2,1,0],
    [0,1,2,5,5,2,2,5,5,2,1,0],
    [0,0,1,2,6,6,6,6,2,1,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
  ],
};

const BOSS_PALETTE = {
  1: "#1a1a2e",
  2: "#b34552",
  3: "#ffd6a5",
  4: "#ffffff",
  5: "#8b2635",
  6: "#2d1b1e",
  7: "#ff6b6b",
  8: "#000000",
};

const EXEC_SPRITE = {
  idle: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0],
    [0,1,2,3,2,2,3,2,1,0],
    [0,1,2,2,2,2,2,2,1,0],
    [0,1,4,4,4,4,4,4,1,0],
    [0,1,4,5,5,5,5,4,1,0],
    [0,1,4,5,6,6,5,4,1,0],
    [0,1,4,4,4,4,4,4,1,0],
    [0,0,4,4,0,0,4,4,0,0],
    [0,0,7,7,0,0,7,7,0,0],
    [0,0,8,8,0,0,8,8,0,0],
  ],
  alert: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0],
    [0,1,2,9,2,2,9,2,1,0],
    [0,1,2,2,2,2,2,2,1,0],
    [0,1,4,4,4,4,4,4,1,0],
    [0,1,4,5,5,5,5,4,1,0],
    [0,1,4,5,6,6,5,4,1,0],
    [0,1,4,4,4,4,4,4,1,0],
    [0,0,4,4,0,0,4,4,0,0],
    [0,0,7,7,0,0,7,7,0,0],
    [0,0,8,8,0,0,8,8,0,0],
  ],
};

function cloneEliteSpriteSet(base) {
  const c = {};
  for (const [k, frame] of Object.entries(base)) {
    c[k] = frame.map((r) => r.slice());
  }
  return c;
}

function buildBossSpriteSet(kind) {
  const s = cloneEliteSpriteSet(BOSS_SPRITE);
  if (kind === "whistle") {
    // 주차관리: 경광등/호루라기 포인트
    for (const key of ["idle", "angry"]) {
      s[key][0][4] = 7; s[key][0][7] = 7;
      s[key][2][5] = 3; s[key][2][6] = 3;
    }
  } else if (kind === "shield") {
    // 보안실장: 전면 방패형 실루엣
    for (const key of ["idle", "angry"]) {
      s[key][4][0] = 4; s[key][5][0] = 4; s[key][6][0] = 4;
      s[key][4][1] = 4; s[key][5][1] = 4; s[key][6][1] = 4;
    }
  } else if (kind === "laser") {
    // PPT 빌런: 레이저 포인터 코어
    for (const key of ["idle", "angry"]) {
      s[key][2][9] = 7;
      s[key][3][9] = 7;
      s[key][6][9] = 7;
    }
  } else if (kind === "gacha") {
    // 가챠 중독자: 랜덤 박스 테두리 느낌
    for (const key of ["idle", "angry"]) {
      s[key][1][3] = 4; s[key][1][8] = 4;
      s[key][9][3] = 4; s[key][9][8] = 4;
      s[key][5][5] = 7; s[key][5][6] = 7;
    }
  } else if (kind === "spider") {
    // 풀스택 거미: 다리 확장
    for (const key of ["idle", "angry"]) {
      s[key][8][0] = 5; s[key][8][11] = 5;
      s[key][9][0] = 5; s[key][9][11] = 5;
      s[key][10][1] = 6; s[key][10][10] = 6;
    }
  } else if (kind === "hunter") {
    // 버그 헌터: 잠자리채 코어
    for (const key of ["idle", "angry"]) {
      s[key][2][1] = 7;
      s[key][3][1] = 7;
      s[key][4][1] = 7;
      s[key][6][2] = 7;
    }
  } else if (kind === "speaker") {
    // 바이럴 확성기: 음파 포인트
    for (const key of ["idle", "angry"]) {
      s[key][2][2] = 7; s[key][2][9] = 7;
      s[key][4][2] = 7; s[key][4][9] = 7;
    }
  } else if (kind === "cash") {
    // 실적 압박맨: 돈다발 코어
    for (const key of ["idle", "angry"]) {
      s[key][7][4] = 7; s[key][7][7] = 7;
      s[key][8][4] = 7; s[key][8][7] = 7;
    }
  } else if (kind === "ceo") {
    // CEO: 중앙 왕관 라인
    for (const key of ["idle", "angry"]) {
      s[key][0][5] = 7; s[key][0][6] = 7;
      s[key][1][5] = 4; s[key][1][6] = 4;
      s[key][2][5] = 3; s[key][2][6] = 3;
    }
  }
  return s;
}

const BOSS_STYLE_SPRITES = {
  whistle: buildBossSpriteSet("whistle"),
  shield: buildBossSpriteSet("shield"),
  laser: buildBossSpriteSet("laser"),
  gacha: buildBossSpriteSet("gacha"),
  spider: buildBossSpriteSet("spider"),
  hunter: buildBossSpriteSet("hunter"),
  speaker: buildBossSpriteSet("speaker"),
  cash: buildBossSpriteSet("cash"),
  ceo: buildBossSpriteSet("ceo"),
};

function bossSpriteProfile(e) {
  const zone = e.zone || "";
  const name = e.name || "";
  if (zone === "parking" || name.includes("휘슬")) return { spriteSet: BOSS_STYLE_SPRITES.whistle, pixelSize: 2.95, spriteOffsetX: 10, lift: 0 };
  if (zone === "lobby" || name.includes("보안실장")) return { spriteSet: BOSS_STYLE_SPRITES.shield, pixelSize: 3.0, spriteOffsetX: 10, lift: 0 };
  if (zone === "showroom" || name.includes("PPT")) return { spriteSet: BOSS_STYLE_SPRITES.laser, pixelSize: 2.98, spriteOffsetX: 10, lift: 0 };
  if (zone === "mobile" || name.includes("가챠")) return { spriteSet: BOSS_STYLE_SPRITES.gacha, pixelSize: 3.02, spriteOffsetX: 10, lift: 0 };
  if (zone === "server" || name.includes("풀스택")) return { spriteSet: BOSS_STYLE_SPRITES.spider, pixelSize: 3.06, spriteOffsetX: 11, lift: 0 };
  if (zone === "glitch" || name.includes("버그 헌터")) return { spriteSet: BOSS_STYLE_SPRITES.hunter, pixelSize: 2.95, spriteOffsetX: 10, lift: 0 };
  if (zone === "marketing" || name.includes("바이럴")) return { spriteSet: BOSS_STYLE_SPRITES.speaker, pixelSize: 3.0, spriteOffsetX: 10, lift: 0 };
  if (zone === "support" || name.includes("실적")) return { spriteSet: BOSS_STYLE_SPRITES.cash, pixelSize: 3.0, spriteOffsetX: 10, lift: 0 };
  return { spriteSet: BOSS_STYLE_SPRITES.ceo, pixelSize: 3.08, spriteOffsetX: 11, lift: -1 };
}

function buildExecSpriteSet(kind) {
  const s = cloneEliteSpriteSet(EXEC_SPRITE);
  if (kind === "strategy") {
    for (const key of ["idle", "alert"]) {
      s[key][1][2] = 5; s[key][1][7] = 5;
      s[key][4][2] = 5; s[key][4][7] = 5;
    }
  } else if (kind === "finance") {
    for (const key of ["idle", "alert"]) {
      s[key][5][3] = 6; s[key][5][6] = 6;
      s[key][6][3] = 6; s[key][6][6] = 6;
    }
  } else if (kind === "hr") {
    for (const key of ["idle", "alert"]) {
      s[key][2][4] = 9; s[key][2][5] = 9;
      s[key][3][4] = 2; s[key][3][5] = 2;
    }
  } else if (kind === "legal") {
    for (const key of ["idle", "alert"]) {
      s[key][4][1] = 5; s[key][4][8] = 5;
      s[key][7][1] = 5; s[key][7][8] = 5;
    }
  }
  return s;
}

const EXEC_STYLE_SPRITES = {
  strategy: buildExecSpriteSet("strategy"),
  finance: buildExecSpriteSet("finance"),
  hr: buildExecSpriteSet("hr"),
  legal: buildExecSpriteSet("legal"),
};

function execSpriteProfile(e) {
  const name = e.name || "";
  if (name.includes("전략총괄")) return { spriteSet: EXEC_STYLE_SPRITES.strategy, pixelSize: 2.65, spriteOffsetX: 4, lift: 0 };
  if (name.includes("재무총괄")) return { spriteSet: EXEC_STYLE_SPRITES.finance, pixelSize: 2.62, spriteOffsetX: 4, lift: 0 };
  if (name.includes("인사총괄")) return { spriteSet: EXEC_STYLE_SPRITES.hr, pixelSize: 2.58, spriteOffsetX: 4, lift: 0 };
  return { spriteSet: EXEC_STYLE_SPRITES.legal, pixelSize: 2.6, spriteOffsetX: 4, lift: 0 };
}

const EXEC_PALETTE = {
  1: "#1a1a2e",
  2: "#f3d6c6",
  3: "#202a44",
  4: "#2f3f66",
  5: "#8aa4d9",
  6: "#f4e19d",
  7: "#1f2937",
  8: "#0f172a",
  9: "#ff6b6b",
};

const BOSS_ZONE_PALETTES = {
  parking: { ...BOSS_PALETTE, 2: "#607d9a", 5: "#35506d", 7: "#9ab7d8" },
  cafeteria: { ...BOSS_PALETTE, 2: "#c56f33", 5: "#7f3f1e", 7: "#ffb37c" },
  lobby: { ...BOSS_PALETTE, 2: "#95a6b7", 5: "#647789", 7: "#dbe8f5" },
  showroom: { ...BOSS_PALETTE, 2: "#2aa69b", 5: "#16746b", 7: "#85efe5" },
  mobile: { ...BOSS_PALETTE, 2: "#8d5cc0", 5: "#5a3a83", 7: "#d7b7ff" },
  server: { ...BOSS_PALETTE, 2: "#35a365", 5: "#206942", 7: "#aaf2c8" },
  glitch: { ...BOSS_PALETTE, 2: "#c65252", 5: "#7a2f2f", 7: "#ffb2b2" },
  marketing: { ...BOSS_PALETTE, 2: "#bea634", 5: "#7d6c22", 7: "#fff0a0" },
  support: { ...BOSS_PALETTE, 2: "#c46a32", 5: "#7d3f1f", 7: "#ffc39e" },
  executive: { ...BOSS_PALETTE, 2: "#9a64be", 5: "#643986", 7: "#e6b9ff" },
};

const EXEC_ZONE_PALETTES = {
  parking: { ...EXEC_PALETTE, 4: "#3c5a78", 5: "#87abd6" },
  cafeteria: { ...EXEC_PALETTE, 4: "#6a4a2e", 5: "#c79a6d" },
  lobby: { ...EXEC_PALETTE, 4: "#5d6f83", 5: "#b5c8db" },
  showroom: { ...EXEC_PALETTE, 4: "#2f8079", 5: "#83e0d7" },
  mobile: { ...EXEC_PALETTE, 4: "#684b87", 5: "#c6a0f2" },
  server: { ...EXEC_PALETTE, 4: "#3a7352", 5: "#9fd6b8" },
  glitch: { ...EXEC_PALETTE, 4: "#7a3f44", 5: "#e19b9f" },
  marketing: { ...EXEC_PALETTE, 4: "#7c6b37", 5: "#e3ce84" },
  support: { ...EXEC_PALETTE, 4: "#7e4e35", 5: "#e0a683" },
  executive: { ...EXEC_PALETTE, 4: "#5d3d74", 5: "#c89ae7" },
};

// 아이템 스프라이트
const ITEM_SPRITES = {
  heal: [
    [0,1,1,1,0],
    [1,2,2,2,1],
    [1,2,3,2,1],
    [1,2,2,2,1],
    [0,1,1,1,0],
  ],
  artifact: [
    [0,0,1,0,0],
    [0,1,2,1,0],
    [1,2,3,2,1],
    [0,1,2,1,0],
    [0,0,1,0,0],
  ],
};

const ITEM_PALETTES = {
  heal: { 1: "#2d6a4f", 2: "#40916c", 3: "#74c69d" },
  artifact: { 1: "#d4af37", 2: "#ffd700", 3: "#fff8dc" },
};

// ============================================
// 렌더링 함수
// ============================================

function drawBackground() {
  const theme = state.floor.theme;
  const zone = state.floor.info.zone;
  const ambient = ambientSpecByZone(zone);
  
  // 그라데이션 배경
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, theme.bg[0]);
  grad.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const bg = ART_ASSETS.backgrounds;
  if (bg?.sky?.complete && bg.sky.naturalWidth) {
    const layers = [
      { img: bg.sky, speed: 0.06, y: -20, h: HEIGHT * 0.72, alpha: 0.78 },
      { img: bg.mountains, speed: 0.12, y: 38, h: HEIGHT * 0.56, alpha: 0.68 },
      { img: bg.trees02, speed: 0.2, y: 98, h: HEIGHT * 0.5, alpha: 0.64 },
      { img: bg.trees01, speed: 0.3, y: 122, h: HEIGHT * 0.46, alpha: 0.72 },
    ];
    for (const layer of layers) {
      if (!layer.img?.complete || !layer.img.naturalWidth) continue;
      const scale = layer.h / layer.img.naturalHeight;
      const drawW = Math.max(WIDTH, Math.round(layer.img.naturalWidth * scale));
      const offset = -((state.cameraX * layer.speed) % drawW);
      for (let x = offset - drawW; x < WIDTH + drawW; x += drawW) {
        drawImageSprite(layer.img, x, layer.y, drawW, layer.h, false, layer.alpha);
      }
    }
    if (bg.mergedDark?.complete && bg.mergedDark.naturalWidth) {
      const mergedH = HEIGHT * 0.62;
      const mergedW = Math.round(bg.mergedDark.naturalWidth * (mergedH / bg.mergedDark.naturalHeight));
      const offset = -((state.cameraX * 0.16) % mergedW);
      for (let x = offset - mergedW; x < WIDTH + mergedW; x += mergedW) {
        drawImageSprite(bg.mergedDark, x, HEIGHT - mergedH - 16, mergedW, mergedH, false, 0.36);
      }
    }
    drawPixelRect(0, 0, WIDTH, HEIGHT, "rgba(6,10,18,0.36)");
  }

  // 대기 안개
  for (let i = 0; i < 3; i++) {
    const drift = (performance.now() * (0.004 + i * 0.0012) + i * 97) % (WIDTH + 240);
    const x = drift - 180;
    const y = 40 + i * 90;
    drawPixelRect(x, y, 320 + i * 40, 34 + i * 8, ambient.haze);
  }

  // 픽셀 아트 스타일 원경
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 20; i++) {
    const x = ((i * 157 - state.cameraX * 0.1) % (WIDTH + 100)) - 50;
    const y = 50 + (i * 23) % 150;
    const w = 30 + (i * 13) % 70;
    const h = 40 + (i * 17) % 80;
    drawPixelRect(x, y, w, h, "rgba(255,255,255,0.03)");
  }

  // 원경 건물/구조물
  for (let i = 0; i < 8; i++) {
    const x = ((i * 400 - state.cameraX * 0.2) % (WORLD_WIDTH + 400)) - 200;
    const h = 100 + (i * 37) % 150;
    drawPixelRect(x, GROUND_Y - h, 60, h, theme.wall + "40");
  }

  // 층별 원경 소품
  if (zone === "parking") {
    for (let i = 0; i < 6; i++) {
      const x = ((i * 290 - state.cameraX * 0.26) % (WORLD_WIDTH + 320)) - 140;
      drawPixelRect(x, GROUND_Y - 48, 90, 18, "rgba(180,200,220,0.14)");
      drawPixelRect(x + 10, GROUND_Y - 44, 18, 8, "rgba(230,240,255,0.16)");
    }
  } else if (zone === "cafeteria") {
    for (let i = 0; i < 7; i++) {
      const x = ((i * 250 - state.cameraX * 0.2) % (WORLD_WIDTH + 280)) - 120;
      drawPixelRect(x, GROUND_Y - 100, 46, 24, "rgba(255,210,150,0.11)");
      drawPixelRect(x + 6, GROUND_Y - 94, 34, 3, "rgba(255,230,180,0.2)");
    }
  } else if (zone === "server") {
    for (let i = 0; i < 9; i++) {
      const x = ((i * 220 - state.cameraX * 0.32) % (WORLD_WIDTH + 260)) - 120;
      drawPixelRect(x, GROUND_Y - 170, 3, 170, "rgba(130,255,190,0.18)");
      drawPixelRect(x + 5, GROUND_Y - 120, 2, 120, "rgba(120,225,255,0.15)");
    }
  } else if (zone === "showroom" || zone === "lobby") {
    for (let i = 0; i < 8; i++) {
      const x = ((i * 260 - state.cameraX * 0.24) % (WORLD_WIDTH + 300)) - 130;
      drawPixelRect(x, GROUND_Y - 150, 56, 150, "rgba(220,240,255,0.08)");
      drawPixelRect(x + 8, GROUND_Y - 130, 40, 2, "rgba(240,250,255,0.14)");
    }
  } else if (zone === "executive") {
    for (let i = 0; i < 7; i++) {
      const x = ((i * 300 - state.cameraX * 0.22) % (WORLD_WIDTH + 340)) - 140;
      drawPixelRect(x, GROUND_Y - 190, 64, 190, "rgba(240,210,255,0.07)");
      drawPixelRect(x + 14, GROUND_Y - 176, 36, 3, "rgba(255,230,255,0.16)");
    }
  }

  // 전경 분위기 레이어
  for (let i = 0; i < 12; i++) {
    const x = ((i * 180 - state.cameraX * 0.55) % (WORLD_WIDTH + 220)) - 100;
    const h = 32 + (i * 11) % 42;
    drawPixelRect(x, GROUND_Y - h, 18 + (i % 3) * 8, h, "rgba(0,0,0,0.12)");
  }

  // 층별 분위기 파티클
  const now = performance.now();
  for (let i = 0; i < 34; i++) {
    const px = ((i * 141 - state.cameraX * 0.18 + now * 0.01) % (WORLD_WIDTH + 180)) - 90;
    const py = 36 + ((i * 37 + now * 0.015) % (GROUND_Y - 120));
    const size = 1 + (i % 2);
    drawPixelRect(px, py, size, size, ambient.spark);
  }
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 220 - state.cameraX * 0.3 + now * 0.025) % (WORLD_WIDTH + 260)) - 120;
    const by = 90 + i * 56;
    drawPixelRect(bx, by, 120, 2, ambient.band);
  }
}

function drawStageFrontDecor() {
  const zone = state.floor.info.zone;
  for (let i = 0; i < 11; i++) {
    const x = ((i * 240 - state.cameraX * 0.78) % (WORLD_WIDTH + 260)) - 120;
    const y = GROUND_Y - 28;
    if (zone === "parking") {
      drawPixelRect(x, y, 54, 8, "rgba(190,210,230,0.18)");
      drawPixelRect(x + 8, y - 6, 22, 4, "rgba(220,235,250,0.16)");
    } else if (zone === "server") {
      drawPixelRect(x + 6, y - 24, 2, 24, "rgba(120,255,190,0.2)");
      drawPixelRect(x + 9, y - 14, 14, 2, "rgba(140,225,255,0.2)");
    } else if (zone === "marketing") {
      drawPixelRect(x, y - 14, 4, 14, "rgba(255,228,140,0.2)");
      drawPixelRect(x + 4, y - 14, 24, 3, "rgba(255,243,196,0.2)");
    } else if (zone === "executive") {
      drawPixelRect(x, y - 20, 3, 20, "rgba(255,232,192,0.24)");
      drawPixelRect(x + 4, y - 20, 16, 2, "rgba(255,232,192,0.24)");
      drawPixelRect(x + 2, y - 10, 12, 2, "rgba(255,210,250,0.16)");
    } else {
      drawPixelRect(x, y - 12, 20, 2, "rgba(255,255,255,0.14)");
      drawPixelRect(x + 2, y - 6, 14, 2, "rgba(255,255,255,0.08)");
    }
  }
}

function drawWorld() {
  ctx.save();
  const shakeX = state.cameraShake > 0 ? (Math.random() - 0.5) * state.cameraShake : 0;
  const shakeY = state.cameraShake > 0 ? (Math.random() - 0.5) * state.cameraShake * 0.6 : 0;
  ctx.translate(-state.cameraX + shakeX, shakeY);

  // 플랫폼 그리기 (픽셀 아트 타일)
  drawPlatforms();

  // 아이템 그리기
  for (const it of state.floor.pickups) {
    drawPickup(it);
  }

  // 적 공격 연출
  drawEnemyAttacks();

  // 적 그리기
  for (const e of state.floor.enemies) {
    drawEnemy(e);
    drawEnemyHpBar(e);
  }
  drawStageFrontDecor();

  // 플레이어 그리기
  const pl = state.player;
  drawPlayer(pl);
  drawAttackTelegraph(pl);
  drawPlayerHpBar(pl);

  // 출구 게이트
  if (state.floor.gateOpen) {
    drawGate(state.floor.gate);
  }
  if (state.floor.shop) {
    drawShop(state.floor.shop);
  }
  if (state.floor.eventRoom) {
    drawEventRoom(state.floor.eventRoom);
  }

  // 파티클
  drawProjectiles();
  drawParticles();
  drawDamageTexts();
  for (const e of state.floor.enemies) {
    drawEnemyNameplate(e);
  }

  ctx.restore();

  // 층 이름 메시지
  if (state.message && state.messageTimer > 0) {
    drawPixelRect(18, 16, 380, 40, "rgba(0,0,0,0.6)");
    ctx.fillStyle = "#eef5ff";
    ctx.font = "bold 15px monospace";
    const parts = state.message.split("\n");
    ctx.fillText(parts[0] || "", 28, 36);
    if (parts[1]) {
      ctx.font = "12px monospace";
      ctx.fillText(parts[1], 28, 54);
    }
  }

  if (state.bossIntroTimer > 0 && state.bossIntroName) {
    const t = Math.min(1, state.bossIntroTimer / 1800);
    const ui = state.floor?.info?.zone ? uiPaletteForZone(state.floor.info.zone) : uiPaletteForZone("executive");
    const w = 460;
    const h = 66;
    const x = WIDTH * 0.5 - w * 0.5;
    const y = 76 + (1 - t) * 8;
    drawPixelRect(x, y, w, h, "rgba(10,14,22,0.76)");
    drawPixelRect(x, y, w, 3, withAlpha(ui.accent, 0.9));
    drawPixelRect(x, y + h - 3, w, 3, withAlpha(ui.accentSoft, 0.86));
    ctx.fillStyle = "#ffd9cf";
    ctx.font = "bold 13px monospace";
    ctx.fillText("!! ELITE ENCOUNTER !!", x + 138, y + 24);
    ctx.fillStyle = "#fff3ef";
    ctx.font = "bold 18px monospace";
    ctx.fillText(state.bossIntroName, x + 40, y + 48);
  }

  if (state.ceoCutinTimer > 0) {
    const t = Math.min(1, state.ceoCutinTimer / 1350);
    const slide = (1 - t) * 120;
    const x = 42 - slide;
    const y = HEIGHT - 168;
    drawPixelRect(x, y, 440, 118, "rgba(16,10,24,0.82)");
    drawPixelRect(x, y, 6, 118, "rgba(244,188,255,0.9)");
    drawPixelRect(x + 6, y + 12, 424, 2, "rgba(255,228,255,0.48)");
    ctx.fillStyle = "#f5d8ff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(state.ceoCutinTitle, x + 16, y + 34);
    ctx.fillStyle = "#fff1ff";
    ctx.font = "bold 20px monospace";
    ctx.fillText("대표이사실 긴급 브리핑", x + 16, y + 64);
    ctx.fillStyle = "#f6eaff";
    ctx.font = "12px monospace";
    ctx.fillText(state.ceoCutinText, x + 16, y + 90);
  }
}

function drawScreenFx() {
  if (state.reducedFx) return;
  if (state.floor?.info?.zone) {
    const zone = state.floor.info.zone;
    const pulse = 0.55 + Math.abs(Math.sin(performance.now() * 0.0018)) * 0.45;
    if (zone === "parking") {
      drawPixelRect(0, HEIGHT - 90, WIDTH, 90, `rgba(150,185,220,${0.03 + pulse * 0.015})`);
      for (let x = 0; x < WIDTH; x += 68) {
        drawPixelRect(x + (performance.now() * 0.02) % 68, HEIGHT - 42, 12, 1, "rgba(225,238,255,0.08)");
      }
    } else if (zone === "showroom") {
      for (let i = 0; i < 6; i++) {
        const y = 70 + i * 84 + Math.sin(performance.now() * 0.001 + i) * 3;
        drawPixelRect(0, y, WIDTH, 1, `rgba(170,255,238,${0.06 + pulse * 0.03})`);
      }
    } else if (zone === "mobile") {
      for (let y = 0; y < HEIGHT; y += 5) {
        drawPixelRect(0, y, WIDTH, 1, "rgba(226,182,255,0.03)");
      }
      drawPixelRect(0, 0, WIDTH, HEIGHT, `rgba(196,126,255,${0.015 + pulse * 0.01})`);
    } else if (zone === "server") {
      const sweep = (performance.now() * 0.12) % (WIDTH + 180) - 90;
      drawPixelRect(sweep, 0, 46, HEIGHT, "rgba(150,255,198,0.06)");
      drawPixelRect(sweep + 10, 0, 2, HEIGHT, "rgba(205,255,228,0.09)");
    } else if (zone === "glitch") {
      const base = 0.02 + pulse * 0.02;
      drawPixelRect(0, 0, WIDTH, HEIGHT, `rgba(255,130,130,${base})`);
      for (let i = 0; i < 8; i++) {
        const y = (i * 73 + performance.now() * 0.18) % HEIGHT;
        drawPixelRect(0, y, WIDTH, 1, "rgba(255,196,196,0.06)");
      }
    } else if (zone === "marketing") {
      for (let i = 0; i < 12; i++) {
        const x = (i * 110 + performance.now() * 0.09) % (WIDTH + 40) - 20;
        drawPixelRect(x, 36 + (i % 3) * 26, 18, 2, "rgba(255,236,156,0.08)");
      }
    } else if (zone === "executive") {
      drawPixelRect(0, 0, WIDTH, 18, `rgba(246,220,255,${0.06 + pulse * 0.03})`);
      drawPixelRect(0, HEIGHT - 18, WIDTH, 18, `rgba(246,220,255,${0.06 + pulse * 0.03})`);
      for (let i = 0; i < 5; i++) {
        const x = 60 + i * 220 + Math.sin(performance.now() * 0.0015 + i) * 12;
        drawPixelRect(x, 24, 2, HEIGHT - 48, "rgba(255,232,198,0.05)");
      }
    }
  }
  for (const fx of state.screenFx) {
    const t = fx.life / Math.max(1, fx.maxLife);
    const alpha = Math.max(0, fx.strength * t);
    if (fx.mode === "scan") {
      for (let y = 0; y < HEIGHT; y += 6) {
        drawPixelRect(0, y, WIDTH, 2, `rgba(${fx.color}, ${alpha * 0.55})`);
      }
      drawPixelRect(0, 0, WIDTH, HEIGHT, `rgba(${fx.color}, ${alpha * 0.22})`);
    } else if (fx.mode === "vignette") {
      drawPixelRect(0, 0, WIDTH, 18, `rgba(${fx.color}, ${alpha})`);
      drawPixelRect(0, HEIGHT - 18, WIDTH, 18, `rgba(${fx.color}, ${alpha})`);
      drawPixelRect(0, 0, 18, HEIGHT, `rgba(${fx.color}, ${alpha * 0.8})`);
      drawPixelRect(WIDTH - 18, 0, 18, HEIGHT, `rgba(${fx.color}, ${alpha * 0.8})`);
    } else {
      drawPixelRect(0, 0, WIDTH, HEIGHT, `rgba(${fx.color}, ${alpha})`);
    }
  }
}

function drawPlatforms() {
  const theme = state.floor.theme;
  const zone = state.floor.info.zone;
  
  for (const p of state.floor.platforms) {
    if (p.y >= GROUND_Y) {
      // 바닥
      drawPixelRect(p.x, p.y, p.w, p.h, theme.floor);
      const tileArt = ART_ASSETS.tiles[tileArtKeyForZone(zone)];
      if (tileArt?.complete && tileArt.naturalWidth > 0) {
        const tileH = Math.max(10, Math.min(p.h, 18));
        const tileW = Math.max(24, Math.round(tileArt.naturalWidth * (tileH / tileArt.naturalHeight)));
        for (let tx = 0; tx < p.w; tx += tileW) {
          const drawW = Math.min(tileW, p.w - tx);
          drawImageSprite(tileArt, p.x + tx, p.y + p.h - tileH, drawW, tileH, false, 0.42);
        }
      }
      if (zone === "parking") {
        for (let tx = 0; tx < p.w; tx += 56) {
          drawPixelRect(p.x + tx, p.y + 2, 3, p.h - 2, "rgba(210,225,240,0.12)");
          drawPixelRect(p.x + tx + 6, p.y + 6, 36, 2, "rgba(190,210,230,0.16)");
        }
      } else if (zone === "cafeteria") {
        for (let tx = 0; tx < p.w; tx += 42) {
          drawPixelRect(p.x + tx, p.y + 2, 2, p.h - 2, "rgba(255,215,170,0.14)");
          drawPixelRect(p.x + tx + 4, p.y + 3, 30, 3, "rgba(255,235,195,0.14)");
        }
      } else if (zone === "server") {
        for (let tx = 0; tx < p.w; tx += 34) {
          drawPixelRect(p.x + tx, p.y + 1, 2, p.h - 1, "rgba(130,255,200,0.16)");
          drawPixelRect(p.x + tx + 3, p.y + 8, 24, 2, "rgba(110,220,255,0.14)");
        }
      } else if (zone === "mobile") {
        for (let tx = 0; tx < p.w; tx += 36) {
          drawPixelRect(p.x + tx, p.y + 1, 2, p.h - 1, "rgba(212,165,255,0.16)");
          drawPixelRect(p.x + tx + 4, p.y + 4, 24, 2, "rgba(244,208,255,0.14)");
          drawPixelRect(p.x + tx + 10, p.y + 10, 8, 2, "rgba(255,128,184,0.12)");
        }
      } else if (zone === "glitch") {
        for (let tx = 0; tx < p.w; tx += 30) {
          drawPixelRect(p.x + tx, p.y + 1, 2, p.h - 1, "rgba(255,140,140,0.15)");
          drawPixelRect(p.x + tx + 6, p.y + 5, 18, 1, "rgba(255,206,206,0.12)");
          drawPixelRect(p.x + tx + 8, p.y + 11, 10, 1, "rgba(255,110,160,0.12)");
        }
      } else if (zone === "marketing") {
        for (let tx = 0; tx < p.w; tx += 38) {
          drawPixelRect(p.x + tx, p.y + 1, 2, p.h - 1, "rgba(255,226,130,0.16)");
          drawPixelRect(p.x + tx + 6, p.y + 4, 24, 2, "rgba(255,244,186,0.12)");
        }
      } else if (zone === "support") {
        for (let tx = 0; tx < p.w; tx += 40) {
          drawPixelRect(p.x + tx, p.y + 1, 2, p.h - 1, "rgba(255,188,140,0.16)");
          drawPixelRect(p.x + tx + 4, p.y + 6, 30, 2, "rgba(255,220,186,0.12)");
          drawPixelRect(p.x + tx + 12, p.y + 11, 8, 1, "rgba(220,124,84,0.16)");
        }
      } else if (zone === "executive") {
        for (let tx = 0; tx < p.w; tx += 46) {
          drawPixelRect(p.x + tx, p.y + 2, 2, p.h - 2, "rgba(240,215,255,0.14)");
          drawPixelRect(p.x + tx + 5, p.y + 5, 32, 2, "rgba(250,230,255,0.12)");
        }
      } else {
        for (let tx = 0; tx < p.w; tx += 40) {
          drawPixelRect(p.x + tx, p.y, 2, p.h, theme.accent + "30");
          drawPixelRect(p.x + tx, p.y, 40, 3, theme.accent + "50");
        }
      }
    } else {
      // 공중 플랫폼
      drawPixelRect(p.x, p.y, p.w, p.h, theme.wall);
      drawPixelRect(p.x, p.y, p.w, 4, theme.accent);
      const tileArt = ART_ASSETS.tiles.brickWall;
      if (tileArt?.complete && tileArt.naturalWidth > 0) {
        const tileH = Math.max(10, Math.min(p.h - 2, 16));
        const tileW = Math.max(20, Math.round(tileArt.naturalWidth * (tileH / tileArt.naturalHeight)));
        for (let tx = 0; tx < p.w; tx += tileW) {
          const drawW = Math.min(tileW, p.w - tx);
          drawImageSprite(tileArt, p.x + tx, p.y + p.h - tileH, drawW, tileH, false, 0.33);
        }
      }
      // 타일 디테일
      for (let tx = 10; tx < p.w; tx += 30) {
        drawPixelRect(p.x + tx, p.y + 8, 4, 4, theme.accent + "60");
      }
    }
  }

  if (state.floor.info.n === 9) {
    const pulse = 0.58 + Math.abs(Math.sin(performance.now() * 0.0035)) * 0.32;
    drawPixelRect(390, 78, 650, 76, `rgba(32,16,40,${0.4 + pulse * 0.25})`);
    ctx.fillStyle = `rgba(255, 245, 220, ${0.68 + pulse * 0.3})`;
    ctx.font = "bold 38px monospace";
    ctx.fillText("우리는 남들이 가지 않는 길을 간다", 410, 128);
    ctx.fillStyle = `rgba(255, 245, 220, ${0.2 + pulse * 0.18})`;
    ctx.font = "bold 20px monospace";
    ctx.fillText("우리는 남들이 가지 않는 길을 간다", 540, 166);
  }
}

function drawPlayer(p) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const pixelSize = 2.6;
  const styleId = p.styleId || "striker";
  const palette = PLAYER_STYLE_PALETTES[styleId] || PLAYER_PALETTE;
  const styleSprites = PLAYER_STYLE_SPRITES[styleId] || PLAYER_SPRITE;
  const blink = p.invuln > 0 && Math.floor(performance.now() / 60) % 2 === 0;
  const bobAmp = styleId === "phantom" ? 1.9 : (styleId === "vanguard" ? 1.1 : 1.5);
  const bob = p.onGround ? Math.sin((p.walkAnim || 0) * 0.9) * bobAmp : 0;
  const attackKick = p.attackSwing > 0 ? (p.facing * (p.attackSwing / 160) * 2.5) : 0;
  const drawX = x + attackKick;
  const spriteVisualHeight = 16 * pixelSize;
  const drawY = y + (p.h - spriteVisualHeight) + bob;
  const playerArtKey = blink ? "hurt" : (!p.onGround ? "jump" : "stand");
  const playerArt = ART_ASSETS.player[playerArtKey];
  const playerFrame = ART_FRAME_SPECS.player[playerArtKey];
  const playerArtRatio = playerFrame ? (playerFrame.w / playerFrame.h) : 0.72;
  const playerArtH = p.h + 34;
  const playerArtW = Math.max(p.w + 20, Math.round(playerArtH * playerArtRatio));
  const playerArtX = Math.round(drawX + (p.w - playerArtW) * 0.5);
  const playerArtY = Math.round(y + p.h - playerArtH + bob + (p.onGround ? 2 : 0));
  const playerArtAlpha = blink ? 0.62 : 1;

  drawGroundShadow(x + p.w * 0.5, y + p.h + 3, 26, p.onGround ? 0.25 : 0.14);
  
  // 대시 효과
  if (p.dashTimer > 0) {
    const dashTint = withAlpha((PLAYER_STYLE_PALETTES[styleId] || PLAYER_PALETTE)[9], 0.35);
    for (let i = 1; i <= 3; i++) {
      const ghostX = drawX - p.facing * i * 20;
      const alpha = 0.3 - i * 0.08;
      ctx.globalAlpha = alpha;
      if (!drawImageSprite(playerArt, ghostX + (p.w - playerArtW) * 0.5, playerArtY, playerArtW, playerArtH, p.facing < 0, alpha, playerFrame)) {
        drawSprite(ghostX, drawY, pixelSize, styleSprites.idle, palette, p.facing < 0);
      }
      drawPixelRect(ghostX + 6, drawY + 16, 10, 2, dashTint);
    }
    ctx.globalAlpha = 1;
  }

  // 피격 시 반짝임
  if (blink) {
    ctx.globalAlpha = 0.5;
  }

  // 스프라이트 선택 (상태 기반)
  let sprite = styleSprites.idle;
  if (p.attackSwing > 0) {
    sprite = styleSprites.attack;
  } else if (p.dashTimer > 0) {
    sprite = styleSprites.dash;
  } else if (!p.onGround) {
    sprite = p.vy < -0.2 ? styleSprites.jump : styleSprites.fall;
  } else if (p.landTimer > 0) {
    sprite = styleSprites.land;
  } else if (Math.abs(p.vx) > 0.5 && p.onGround) {
    sprite = Math.sin(p.walkAnim) > 0 ? styleSprites.walk1 : styleSprites.walk2;
  }

  const drewPlayerArt = drawImageSprite(playerArt, playerArtX, playerArtY, playerArtW, playerArtH, p.facing < 0, playerArtAlpha, playerFrame);
  if (!drewPlayerArt) {
    drawSprite(drawX, drawY, pixelSize, sprite, palette, p.facing < 0);
    drawPlayerDeveloperDetails(p, drawX, drawY, styleId);
  }
  if (styleId === "vanguard") {
    drawPixelRect(drawX + 2, drawY + 18, 4, 9, "rgba(186,224,255,0.65)");
  } else if (styleId === "phantom") {
    drawPixelRect(drawX + 22, drawY + 8, 5, 2, "rgba(228,198,255,0.5)");
  }

  if (p.attackSwing > 0) {
    const t = p.attackSwing / 160;
    const sx = p.facing > 0 ? x + p.w + 4 : x - 10;
    const sy = drawY + 24 - (1 - t) * (styleId === "phantom" ? 5 : 3);
    drawKeyboardSwingFx(p, sx, sy, styleId);
  }

  if (p.weapon?.tier === "Legendary") {
    const pulse = 0.12 + Math.abs(Math.sin(performance.now() * 0.01)) * 0.12;
    drawPixelRect(drawX - 2, drawY - 2, p.w + 6, p.h + 6, `rgba(191,227,255,${pulse})`);
  }

  // 점프 중 효과
  if (!p.onGround) {
    drawPixelRect(x + 8, y + p.h + 4, 6, 3, "rgba(255,255,255,0.3)");
    drawPixelRect(x + 22, y + p.h + 4, 6, 3, "rgba(255,255,255,0.3)");
  }

  ctx.globalAlpha = 1;
}

function drawAttackTelegraph(p) {
  if (!p.lastAttackRange || p.attackSwing <= 0) return;
  const r = p.lastAttackRange;
  const t = p.attackSwing / 160;
  const tint = p.styleAttackTint || "#ffd369";
  const fill = withAlpha(tint, 0.11 + t * 0.15);
  drawPixelRect(r.x, r.y + 2, r.w, Math.max(6, r.h - 4), fill);
  const tipX = p.facing > 0 ? r.x + r.w - 4 : r.x;
  drawPixelRect(tipX, r.y + 8, 4, Math.max(8, r.h - 14), withAlpha(tint, 0.35));
}

function drawEnemy(e) {
  const x = Math.round(e.x);
  const y = Math.round(e.y);
  const isElite = e.type === "boss" || e.type === "exec";
  const eliteProfile = e.type === "boss"
    ? bossSpriteProfile(e)
    : (e.type === "exec" ? execSpriteProfile(e) : null);
  const mobProfile = e.type === "mob" ? mobVisualProfile(e) : null;
  const pixelSize = isElite ? (eliteProfile?.pixelSize || (e.type === "boss" ? 3 : 2.6)) : (mobProfile?.pixelSize || 2.2);
  const bob = e.type === "mob" ? Math.sin(e.walkAnim * 0.9 + (e.variant || 0)) * 1.5 : Math.sin(e.walkAnim * 0.35) * 1;
  const drawY = y + bob + (eliteProfile?.lift || 0);
  const tint = zoneTint(e.zone, e.variant || 0);
  
  if (e.hitFlash > 0) {
    ctx.globalAlpha = 0.5;
  }

  drawGroundShadow(x + e.w * 0.5, y + e.h + 4, e.type === "boss" ? 42 : (e.type === "exec" ? 34 : 22), e.type === "mob" ? 0.2 : 0.26);

  if (isElite) {
    const spriteSet = eliteProfile?.spriteSet || (e.type === "boss" ? BOSS_SPRITE : EXEC_SPRITE);
    const sprite = e.type === "boss"
      ? (e.hp < e.maxHp * 0.3 ? spriteSet.angry : spriteSet.idle)
      : (e.hp < e.maxHp * 0.4 ? spriteSet.alert : spriteSet.idle);
    const palette = e.type === "boss" ? bossPaletteByZone(e.zone) : execPaletteByZone(e.zone);
    const spriteOffsetX = eliteProfile?.spriteOffsetX ?? (e.type === "boss" ? 10 : 4);
    const eliteArtKey = eliteArtKeyForEnemy(e);
    const eliteArt = ART_ASSETS.monsters[eliteArtKey];
    const eliteFrame = ART_FRAME_SPECS.monsters[eliteArtKey];
    const eliteRatio = eliteFrame ? eliteFrame.w / eliteFrame.h : 1;
    const eliteArtH = e.h + (e.type === "boss" ? 66 : 54);
    const eliteArtW = Math.max(e.w + 24, Math.round(eliteArtH * eliteRatio));
    const eliteArtX = x + (e.w - eliteArtW) * 0.5;
    const eliteArtY = y + e.h - eliteArtH + (e.type === "boss" ? 8 : 10);
    const drewEliteArt = drawImageSprite(eliteArt, eliteArtX, eliteArtY, eliteArtW, eliteArtH, e.dir < 0, 0.96, eliteFrame);
    if (!drewEliteArt) {
      drawSprite(x - spriteOffsetX, drawY, pixelSize, sprite, palette, e.dir < 0);
    }
    drawEliteAccessory(e, x - spriteOffsetX, drawY);
    const auraAlpha = 0.1 + Math.abs(Math.sin(performance.now() * 0.006 + x * 0.01)) * 0.14;
    drawPixelRect(x - 18, drawY - 8, e.w + 34, e.h + 16, `${eliteAuraColor(e)}${auraAlpha})`);
    const auraUi = uiPaletteForZone(e.zone || "executive");
    const auraPulse = 0.14 + Math.abs(Math.sin(performance.now() * 0.005 + y * 0.02)) * 0.16;
    drawPixelRect(x - 12, drawY - 14, e.w + 22, 2, withAlpha(auraUi.accentSoft, auraPulse));
    drawPixelRect(x - 12, drawY + e.h + 6, e.w + 22, 2, withAlpha(auraUi.accent, auraPulse * 0.85));
    
    drawStatusPips(e, x - 8, y - 48);
  } else {
    // 일반 적 스프라이트
    const stride = Math.sin(e.walkAnim);
    const spriteSet = mobProfile?.spriteSet || MOB_SPRITE;
    const sprite = Math.abs(stride) < 0.2 ? spriteSet.idle : (stride > 0 ? spriteSet.walk1 : spriteSet.walk2);
    const mobPalette = mobPaletteByZone(e.zone);
    const mobLift = mobProfile?.lift || 2;
    const mobArtKey = monsterArtKeyForEnemy(e);
    const mobArt = ART_ASSETS.monsters[mobArtKey];
    const mobFrame = ART_FRAME_SPECS.monsters[mobArtKey];
    const mobArtRatio = mobFrame ? (mobFrame.w / mobFrame.h) : 1;
    const mobArtH = e.h + 28;
    const mobArtW = Math.max(e.w + 12, Math.round(mobArtH * mobArtRatio));
    const mobArtX = x + (e.w - mobArtW) * 0.5;
    const mobArtY = y + e.h - mobArtH + mobLift + 4;
    const drewMobArt = drawImageSprite(mobArt, mobArtX, mobArtY, mobArtW, mobArtH, e.dir < 0, 0.94, mobFrame);
    if (!drewMobArt) {
      drawSprite(x, drawY + mobLift, pixelSize, sprite, mobPalette, e.dir < 0);
      drawMobAccessory(e, x + 1, drawY + mobLift + 2, pixelSize);
      drawPixelRect(x - 1, drawY + 2, e.w + 2, e.h + 3, tint);
    } else {
      drawPixelRect(x - 1, drawY + 2, e.w + 2, e.h + 3, withAlpha("#ffffff", 0.04));
    }
    drawStatusPips(e, x - 6, y - 42);
  }

  ctx.globalAlpha = 1;
}

function drawPickup(it) {
  const pulse = 1 + Math.sin((performance.now() + it.x) * 0.008) * 0.12;
  const pixelSize = 3 * pulse;
  const x = it.x + (it.w - 5 * pixelSize) / 2;
  const y = it.y + (it.h - 5 * pixelSize) / 2 - 4;
  
  const bounce = Math.sin(performance.now() * 0.01) * 3;
  
  if (it.type === "heal") {
    drawSprite(x, y + bounce, pixelSize, ITEM_SPRITES.heal, ITEM_PALETTES.heal);
  } else {
    drawSprite(x, y + bounce, pixelSize, ITEM_SPRITES.artifact, ITEM_PALETTES.artifact);
  }
  
  // 빛나는 효과
  const glowAlpha = 0.3 + Math.sin(performance.now() * 0.01) * 0.2;
  drawPixelRect(it.x - 4, it.y - 4 + bounce, it.w + 8, it.h + 8, 
    it.type === "heal" ? `rgba(88,214,141,${glowAlpha})` : `rgba(244,211,94,${glowAlpha})`);
}

function drawGate(g) {
  const pulse = 0.65 + Math.sin(performance.now() * 0.008) * 0.2;
  
  // 게이트 프레임
  drawPixelRect(g.x, g.y, g.w, g.h, "#1a2742");
  drawPixelRect(g.x + 4, g.y + 4, g.w - 8, g.h - 8, "#2a4060");
  
  // 에너지 필드
  const gradient = ctx.createLinearGradient(g.x, g.y, g.x, g.y + g.h);
  gradient.addColorStop(0, `rgba(132, 182, 244, ${pulse * 0.3})`);
  gradient.addColorStop(0.5, `rgba(132, 182, 244, ${pulse})`);
  gradient.addColorStop(1, `rgba(132, 182, 244, ${pulse * 0.3})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(g.x + 8, g.y + 8, g.w - 16, g.h - 16);
  
  // 픽셀 장식
  drawPixelRect(g.x + 12, g.y + 20, g.w - 24, 4, `rgba(255,255,255,${pulse})`);
  drawPixelRect(g.x + 12, g.y + g.h - 24, g.w - 24, 4, `rgba(255,255,255,${pulse})`);
  
  // EXIT 텍스트
  ctx.fillStyle = "#d7ebff";
  ctx.font = "bold 12px monospace";
  ctx.fillText("EXIT", g.x + 6, g.y - 8);
}

function drawShop(shop) {
  drawPixelRect(shop.x, shop.y, shop.w, shop.h, "#3f2f1d");
  drawPixelRect(shop.x + 4, shop.y + 4, shop.w - 8, shop.h - 8, "#6a4b2a");
  drawPixelRect(shop.x + 8, shop.y + 24, shop.w - 16, 4, "#ffd369");
  ctx.fillStyle = "#ffebc1";
  ctx.font = "bold 12px monospace";
  ctx.fillText("SHOP", shop.x + 7, shop.y - 8);
  if (inShopZone() && state.mode === "playing") {
    drawPixelRect(shop.x - 8, shop.y - 26, shop.w + 16, 16, "rgba(0,0,0,0.65)");
    ctx.fillStyle = "#e6f1ff";
    ctx.font = "11px monospace";
    ctx.fillText("E: 상점 열기", shop.x - 2, shop.y - 14);
  }
}

function drawEventRoom(room) {
  if (!room || room.used) return;
  const pulse = 0.5 + Math.sin(performance.now() * 0.008) * 0.28;
  const border = room.color || "#9dd6ff";
  drawPixelRect(room.x, room.y, room.w, room.h, "rgba(14,20,30,0.9)");
  drawPixelRect(room.x + 3, room.y + 3, room.w - 6, room.h - 6, "rgba(20,34,52,0.92)");
  drawPixelRect(room.x + 7, room.y + 16, room.w - 14, 4, border);
  drawPixelRect(room.x + 7, room.y + room.h - 20, room.w - 14, 4, withAlpha(border, 0.8));
  drawPixelRect(room.x + 12, room.y + 30, room.w - 24, room.h - 48, withAlpha(border, 0.18 + pulse * 0.2));
  ctx.fillStyle = "#edf6ff";
  ctx.font = "bold 11px monospace";
  ctx.fillText("EVENT", room.x + 7, room.y - 8);
  ctx.font = "10px monospace";
  ctx.fillText(room.hint || "특수 이벤트", room.x - 4, room.y + room.h + 12);
  if (inEventRoomZone() && state.mode === "playing") {
    drawPixelRect(room.x - 12, room.y - 28, room.w + 24, 16, "rgba(0,0,0,0.68)");
    ctx.fillStyle = "#e6f1ff";
    ctx.font = "11px monospace";
    ctx.fillText("E: 이벤트 활성화", room.x - 6, room.y - 16);
  }
}

function drawProjectiles() {
  for (const prj of state.projectiles) {
    drawPixelRect(prj.x, prj.y, prj.w, prj.h, prj.color);
    drawPixelRect(prj.x - 2, prj.y + 2, 2, 4, "rgba(255,255,255,0.6)");
    drawPixelRect(prj.x + prj.w, prj.y + 2, 2, 4, "rgba(255,255,255,0.6)");
  }
}

function drawEnemyAttacks() {
  for (const tg of state.enemyTelegraphs) {
    const pulse = 0.16 + Math.abs(Math.sin(tg.life * 0.03)) * 0.18;
    drawPixelRect(tg.x, tg.y, tg.w, tg.h, withAlpha(tg.color, pulse));
    drawPixelRect(tg.x, tg.y, tg.w, 2, tg.border);
    drawPixelRect(tg.x, tg.y + tg.h - 2, tg.w, 2, tg.border);
    const tw = Math.max(48, (tg.label || "").length * 6 + 8);
    drawPixelRect(tg.x, tg.y - 14, tw, 11, "rgba(10,8,14,0.74)");
    drawPixelRect(tg.x, tg.y - 14, tw, 1, "rgba(255,240,210,0.22)");
    ctx.fillStyle = "#fff5e6";
    ctx.font = "bold 10px monospace";
    ctx.fillText(tg.label, tg.x + 4, tg.y - 4);
  }
  for (const hz of state.hazards) {
    drawPixelRect(hz.x, hz.y, hz.w, hz.h, hz.color);
    drawPixelRect(hz.x, hz.y, hz.w, 2, hz.border);
    drawPixelRect(hz.x, hz.y + hz.h - 2, hz.w, 2, hz.border);
    if (hz.label) {
      const tw = Math.max(48, hz.label.length * 6 + 8);
      drawPixelRect(hz.x, hz.y - 14, tw, 11, "rgba(10,8,14,0.72)");
      drawPixelRect(hz.x, hz.y - 14, tw, 1, "rgba(255,240,210,0.2)");
      ctx.fillStyle = "#fff5e6";
      ctx.font = "bold 10px monospace";
      ctx.fillText(hz.label, hz.x + 4, hz.y - 4);
    }
  }
  for (const prj of state.enemyProjectiles) {
    drawPixelRect(prj.x, prj.y, prj.w, prj.h, prj.color);
    drawPixelRect(prj.x + 1, prj.y + 1, prj.w - 2, prj.h - 2, "rgba(255,255,255,0.28)");
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    const size = Math.max(2, p.size * (p.life / p.maxLife));
    ctx.fillStyle = withAlpha(p.color, alpha);
    drawPixelRect(Math.round(p.x), Math.round(p.y), size, size, ctx.fillStyle);
  }
}

function drawDamageTexts() {
  for (const d of state.damageTexts) {
    const alpha = Math.max(0, Math.min(1, d.life / d.maxLife));
    ctx.fillStyle = withAlpha(d.color, alpha);
    ctx.font = `bold ${d.size}px monospace`;
    ctx.fillText(d.text, d.x, d.y);
  }
}

function objectiveLine() {
  if (!state.floor) return "";
  if (state.floor.info.safeZone) return "목표: B1에서 정비하고 E로 상층 이동";
  if (state.floor.eventRoom && !state.floor.eventRoom.used && state.floor.gateOpen) return "목표: 이벤트 룸(E) 또는 출구 게이트 이동";
  if (state.floor.eventRoom && !state.floor.eventRoom.used) return "목표: 특수 이벤트 룸 진입 후 E로 활성화";
  if (state.floor.gateOpen) return "목표: 출구 활성화 완료, 게이트로 이동";
  const left = state.floor.enemies.length;
  return `목표: 남은 적 ${left}체 처치`;
}

function drawEnemyHpBar(e) {
  const hpw = e.type === "boss" ? 112 : (e.type === "exec" ? 90 : 44);
  const x = e.x + (e.w - hpw) / 2;
  const y = (e.type === "boss" || e.type === "exec") ? (e.y - 10) : (e.y - 12);
  
  // 배경
  drawPixelRect(x - 1, y - 1, hpw + 2, 6, "#0e141f");
  // 체력바
  const hpRatio = Math.max(0, e.hp / e.maxHp);
  const hpColor = e.type === "boss" ? "#ff6464" : (e.type === "exec" ? "#d78bff" : "#ff7b72");
  drawPixelRect(x, y, hpw * hpRatio, 4, hpColor);
}

function drawEnemyNameplate(e) {
  if (e.hp <= 0) return;
  const isBoss = e.type === "boss";
  const isExec = e.type === "exec";
  const ui = uiPaletteForZone(e.zone || "parking");
  const color = isBoss ? "#ffe29b" : (isExec ? "#f5dcff" : "#d9ebff");
  const fontSize = isBoss ? 14 : (isExec ? 13 : 12);
  const labelWidth = Math.max(56, e.name.length * (fontSize * 0.62));
  const hpw = isBoss ? 112 : (isExec ? 90 : 44);
  const hpY = (isBoss || isExec) ? (e.y - 10) : (e.y - 12);
  const x = e.x + e.w * 0.5 - labelWidth * 0.5;
  const y = hpY - 16;
  const panel = isBoss ? "rgba(14,10,14,0.84)" : "rgba(7,11,17,0.78)";
  drawPixelRect(x - 4, y - 11, labelWidth + 8, 15, panel);
  drawPixelRect(x - 4, y - 11, labelWidth + 8, 1, withAlpha(ui.accentSoft, isBoss ? 0.56 : 0.42));
  drawPixelRect(x - 4, y + 2, labelWidth + 8, 1, withAlpha(ui.accentSoft, 0.2));
  if (isBoss || isExec) {
    drawPixelRect(x - 6, y - 8, 2, 8, withAlpha(ui.accent, 0.65));
    drawPixelRect(x + labelWidth + 4, y - 8, 2, 8, withAlpha(ui.accent, 0.65));
  }
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText(e.name, x, y);
  if (!isBoss && !isExec && hpw > 42) {
    drawPixelRect(e.x + (e.w - hpw) / 2 + hpw + 2, hpY, 2, 4, "rgba(255,255,255,0.45)");
  }
}

function drawBossTopBars() {
  const elites = state.floor.enemies
    .filter((e) => e.hp > 0 && (e.type === "boss" || e.type === "exec"))
    .sort((a, b) => {
      const aw = a.type === "boss" ? 0 : 1;
      const bw = b.type === "boss" ? 0 : 1;
      return aw - bw;
    })
    .slice(0, 3);
  for (let i = 0; i < elites.length; i++) {
    const e = elites[i];
    const ui = uiPaletteForZone(e.zone || "executive");
    const w = 330;
    const x = WIDTH * 0.5 - w * 0.5;
    const y = 86 + i * 24;
    drawPixelRect(x - 2, y - 12, w + 4, 18, "rgba(8,10,16,0.82)");
    drawPixelRect(x - 2, y - 12, w + 4, 1, withAlpha(ui.accent, 0.56));
    const ratio = Math.max(0, e.hp / e.maxHp);
    drawPixelRect(x, y - 6, w, 8, "#101823");
    const hpColor = e.type === "boss" ? withAlpha(ui.accent, 0.95) : withAlpha(ui.accentSoft, 0.9);
    drawPixelRect(x, y - 6, w * ratio, 8, hpColor);
    ctx.fillStyle = "#f8f1ff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`${e.name} ${Math.ceil(e.hp)}/${e.maxHp}`, x + 6, y - 8);
  }
}

function drawPlayerHpBar(p) {
  const bw = 44;
  const ratio = Math.max(0, p.hp / p.maxHp);
  const x = p.x + (p.w - bw) / 2;
  const y = p.y - 12;
  
  drawPixelRect(x - 1, y - 1, bw + 2, 6, "#0e141f");
  const color = ratio < 0.3 ? "#ff6b6b" : "#7de2d1";
  drawPixelRect(x, y, bw * ratio, 4, color);
}

function weaponPassiveStatus() {
  const p = state.player;
  const weapon = p.weapon;
  if (!weapon) {
    return {
      title: "무기 패시브",
      main: "장착 무기 없음",
      sub: "",
      active: "",
    };
  }
  const id = weapon.id;
  let main = weapon.feature || "기본 효과";
  if (id === "weapon_keyboard_blue") main = "청축: 타격 시 15% 치명";
  else if (id === "weapon_keyboard_red") main = "적축: 백어택 피해 증가";
  else if (id === "weapon_keyboard_rgb") main = "RGB: 타격 도트 점화";
  else if (id === "weapon_keyboard_aluminum") main = "알루미늄: 타격 경직";
  else if (id === "weapon_keyboard_capacitive") main = "무접점: 입력 안정화";
  else if (id === "weapon_keyboard_split") main = "스플릿: 추가 타격 예약";
  const sub = weapon.affix ? `${weapon.affix.label}: ${weapon.affix.feature}` : "";
  const active = state.weaponPassivePulse > 0 ? `발동: ${state.weaponPassiveHint}` : "상태: 대기";
  return {
    title: `${weapon.name} [${weapon.tier}]`,
    main,
    sub,
    active,
  };
}

function drawHudBars() {
  const p = state.player;
  const hpRatio = Math.max(0, p.hp / p.maxHp);
  const xpRatio = Math.max(0, p.xp / p.needXp);
  const runTime = state.runElapsedMs;
  const floor = state.floor.info;
  const ui = uiPaletteForZone(floor.zone);

  // HUD 배경
  drawPixelRect(18, 58, 304, 64, ui.panel);
  drawPixelRect(20, 60, 300, 60, ui.panelSoft);
  
  // HP 바
  drawPixelRect(28, 70, 224, 16, "#0e141f");
  const hpColor = hpRatio < 0.3 ? "#ff6b6b" : "#58d68d";
  drawPixelRect(30, 72, 220 * hpRatio, 12, hpColor);
  const livesIcon = ART_ASSETS.ui.lives;
  const livesFrame = ART_FRAME_SPECS.ui.lives;
  if (livesIcon?.complete && livesIcon.naturalWidth) {
    drawImageSprite(livesIcon, 34, 68, 14, 14, false, 0.95, livesFrame);
    drawImageSprite(livesIcon, 50, 68, 14, 14, false, 0.8, livesFrame);
    drawImageSprite(livesIcon, 66, 68, 14, 14, false, 0.65, livesFrame);
  }
  // HP 바 장식
  drawPixelRect(30, 72, 220, 2, "rgba(255,255,255,0.3)");
  
  // XP 바
  drawPixelRect(28, 94, 224, 12, "#0e141f");
  drawPixelRect(30, 96, 220 * xpRatio, 8, ui.accent);
  
  // 텍스트
  ctx.fillStyle = "#e6f1ff";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`, 260, 82);
  ctx.fillText(`LV${p.level}`, 260, 104);
  ctx.font = "11px monospace";
  ctx.fillText(`${p.styleName || "스타일 없음"}`, 258, 118);

  // 버프 아이콘 그리드
  drawPixelRect(340, 18, 154, 46, "rgba(8,12,18,0.8)");
  ctx.fillStyle = ui.accentSoft;
  ctx.font = "11px monospace";
  ctx.fillText("BUFF", 348, 34);
  const buffs = p.skillNames.slice(0, 6);
  for (let i = 0; i < 6; i++) {
    const x = 350 + (i % 3) * 46;
    const y = 40 + Math.floor(i / 3) * 18;
    drawPixelRect(x, y, 40, 14, withAlpha(ui.accent, 0.15));
    drawPixelRect(x, y, 40, 1, withAlpha(ui.accent, 0.65));
    if (buffs[i]) {
      ctx.fillStyle = ui.accentSoft;
      ctx.fillText(buffs[i].slice(0, 4), x + 4, y + 11);
    }
  }

  // 우측 상단: 미니맵 + 층 + 타임어택
  drawPixelRect(WIDTH - 300, 16, 282, 70, ui.panel);
  ctx.fillStyle = ui.accentSoft;
  ctx.font = "bold 12px monospace";
  ctx.fillText(`현재 층: ${floorLabel(floor.n)} (${floor.name})`, WIDTH - 292, 34);
  ctx.fillText(`Time Attack: ${formatDuration(runTime)}`, WIDTH - 292, 50);
  ctx.font = "10px monospace";
  ctx.fillText(objectiveLine(), WIDTH - 292, 80);
  if (ART_ASSETS.ui.boss?.complete && ART_ASSETS.ui.boss.naturalWidth) {
    drawImageSprite(ART_ASSETS.ui.boss, WIDTH - 74, 20, 18, 18, false, 0.92);
  }
  drawPixelRect(WIDTH - 292, 60, 240, 10, "#0e141f");
  const progress = Math.max(0, Math.min(1, p.x / (WORLD_WIDTH - p.w)));
  drawPixelRect(WIDTH - 292, 60, 240 * progress, 10, ui.accent);
  drawPixelRect(WIDTH - 55, 58, 6, 14, "#ffe08d");

  // 하단: 소비 슬롯 + 골드
  drawPixelRect(18, HEIGHT - 64, 290, 46, ui.panel);
  drawPixelRect(28, HEIGHT - 56, 64, 30, withAlpha(ui.accent, 0.24));
  drawPixelRect(100, HEIGHT - 56, 64, 30, withAlpha(ui.accent, 0.16));
  ctx.fillStyle = ui.accentSoft;
  ctx.font = "11px monospace";
  ctx.fillText(`Q: ${p.inventory[0] || "빈 슬롯"}`, 32, HEIGHT - 36);
  ctx.fillText(`E: ${p.inventory[1] || "빈 슬롯"}`, 104, HEIGHT - 36);
  ctx.font = "bold 12px monospace";
  ctx.fillText(`야근수당 ${p.gold}G`, 182, HEIGHT - 36);
  ctx.font = "10px monospace";
  ctx.fillText(`SFX ${(state.sfxVolume * 100).toFixed(0)}% (-/+)`, 182, HEIGHT - 24);
  if (state.comboHits > 0) {
    const comboAlpha = 0.4 + Math.min(0.5, state.comboTimer / 1800);
    drawPixelRect(WIDTH - 220, HEIGHT - 64, 196, 26, `rgba(24,16,32,${comboAlpha.toFixed(2)})`);
    drawPixelRect(WIDTH - 216, HEIGHT - 60, 188, 2, "rgba(255,215,145,0.65)");
    ctx.fillStyle = "#ffe3a5";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`COMBO x${state.comboHits} (${Math.round(comboMultiplier() * 100)}%)`, WIDTH - 212, HEIGHT - 42);
  }
  if (state.battleHeat > 0 || state.overdriveTimer > 0) {
    const heatX = WIDTH - 220;
    const heatY = HEIGHT - 92;
    const heatRatio = Math.max(0, Math.min(1, state.battleHeat / 100));
    drawPixelRect(heatX, heatY, 196, 20, "rgba(18,14,28,0.78)");
    drawPixelRect(heatX + 2, heatY + 2, 192, 16, "rgba(9,12,18,0.9)");
    const heatColor = state.overdriveTimer > 0 ? "#7de2d1" : "#ffb08a";
    drawPixelRect(heatX + 4, heatY + 5, 188 * heatRatio, 10, heatColor);
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "11px monospace";
    if (state.overdriveTimer > 0) {
      ctx.fillText(`OD${state.overdriveTier} ${Math.ceil(state.overdriveTimer / 1000)}s`, heatX + 8, heatY + 14);
    } else {
      ctx.fillText(`HEAT ${Math.round(state.battleHeat)}%`, heatX + 8, heatY + 14);
    }
  }
  const passive = weaponPassiveStatus();
  const passivePanelX = 322;
  const passivePanelY = HEIGHT - 64;
  const passivePulse = state.weaponPassivePulse > 0
    ? Math.min(0.3, state.weaponPassivePulse / 2600)
    : 0;
  drawPixelRect(passivePanelX, passivePanelY, 344, 46, `rgba(10,15,24,${(0.78 + passivePulse).toFixed(2)})`);
  drawPixelRect(passivePanelX + 2, passivePanelY + 2, 340, 42, `rgba(18,30,45,${(0.78 + passivePulse * 0.8).toFixed(2)})`);
  drawPixelRect(passivePanelX + 2, passivePanelY + 2, 340, 1, withAlpha(ui.accent, 0.65));
  ctx.fillStyle = ui.accentSoft;
  ctx.font = "bold 11px monospace";
  ctx.fillText(passive.title, passivePanelX + 10, passivePanelY + 15);
  ctx.font = "10px monospace";
  ctx.fillText(passive.main, passivePanelX + 10, passivePanelY + 27);
  if (passive.sub) {
    ctx.fillText(passive.sub, passivePanelX + 10, passivePanelY + 39);
  }
  ctx.fillStyle = state.weaponPassivePulse > 0 ? "#ffe7af" : "#ceddf5";
  ctx.fillText(passive.active, passivePanelX + 184, passivePanelY + 39);
  if (infoPanelsVisible) {
    const weaponLine = p.weapon ? `${p.weapon.name} (${p.weapon.tier}) / ${p.weapon.affix.label}` : "없음";
    const panelW = 410;
    const panelH = 92;
    const panelX = WIDTH - panelW - 18;
    const panelY = HEIGHT - panelH - 74;
    drawPixelRect(panelX, panelY, panelW, panelH, ui.panel);
    drawPixelRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4, ui.panelSoft);
    ctx.fillStyle = ui.accentSoft;
    ctx.font = "bold 11px monospace";
    ctx.fillText(`상태 요약 · Build ${APP_VERSION}`, panelX + 12, panelY + 20);
    ctx.font = "11px monospace";
    ctx.fillText(`층 ${floorLabel(floor.n)}  HP ${Math.ceil(p.hp)}/${p.maxHp}  LV ${p.level}  XP ${p.xp}/${p.needXp}`, panelX + 12, panelY + 38);
    ctx.fillText(`스타일 ${p.styleName || "미지정"}  Death ${state.runDeathCount}  BestCombo ${state.comboBest}`, panelX + 12, panelY + 54);
    ctx.fillText(`무기 ${weaponLine}`, panelX + 12, panelY + 70);
    ctx.fillText(`H: 조작법/로그/상태 숨기기`, panelX + 12, panelY + 86);
  }
  drawBossTopBars();
}

function withAlpha(hex, alpha) {
  return RenderSystem.withAlpha(hex, alpha);
}

function renderStats() {
  // 상태 정보는 캔버스 HUD(drawHudBars)에서 렌더링한다.
  statsEl.innerHTML = "";
}

// ============================================
// 게임 루프
// ============================================
let last = performance.now();
function loop(now) {
  const dt = Math.min(33, now - last);
  last = now;
  if (state.cameraShake > 0) state.cameraShake = Math.max(0, state.cameraShake - dt * 0.02);
  if (state.bossIntroTimer > 0) state.bossIntroTimer = Math.max(0, state.bossIntroTimer - dt);
  if (state.ceoCutinTimer > 0) state.ceoCutinTimer = Math.max(0, state.ceoCutinTimer - dt);
  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) state.comboHits = 0;
  }
  if (state.weaponPassivePulse > 0) {
    state.weaponPassivePulse = Math.max(0, state.weaponPassivePulse - dt);
    if (state.weaponPassivePulse <= 0) state.weaponPassiveHint = "";
  }
  state.battleHeat = Math.max(0, state.battleHeat - dt * (state.overdriveTimer > 0 ? 0.007 : 0.012));
  if (state.overdriveTimer > 0) {
    state.overdriveTimer = Math.max(0, state.overdriveTimer - dt);
    if (state.overdriveTimer <= 0) {
      state.overdriveTier = 0;
      log("오버드라이브 종료");
    }
  }
  state.screenFx = state.screenFx.filter((fx) => {
    fx.life -= dt;
    return fx.life > 0;
  });
  if (state.running) {
    state.runElapsedMs = now - state.runStartTs;
  }
  if (state.messageTimer > 0) {
    state.messageTimer = Math.max(0, state.messageTimer - dt);
  }
  if (state.running) {
    updatePlayer(dt);
    updateEnemies(dt);
    updatePickups();
    updateProjectiles(dt);
    updateEnemyAttacks(dt);
    tryExit();
    updateCamera();
  }
  updateParticles(dt);
  updateDamageTexts(dt);

  drawBackground();
  drawWorld();
  drawScreenFx();
  drawHudBars();
  renderStats();

  requestAnimationFrame(loop);
}

// ============================================
// 이벤트 핸들링
// ============================================
window.addEventListener("keydown", (e) => {
  if (!audioUnlocked) unlockAudio();
  const k = e.key;
  const lk = k.length === 1 ? k.toLowerCase() : k;
  if ([" ", "Shift", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
    e.preventDefault();
  }
  state.keys[k] = true;
  state.keys[lk] = true;

  if (lk === "h") {
    infoPanelsVisible = !infoPanelsVisible;
    applyInfoPanelsVisibility();
    return;
  }

  if (state.mode === "shop") {
    if (k === "1") buyFromShop(0);
    if (k === "2") buyFromShop(1);
    if (k === "3") buyFromShop(2);
    if (k === "Escape" || k === "e" || k === "E") closeShop();
    return;
  }

  if (state.mode === "clearChoice") {
    if (k === "1") restartAfterClear(false);
    if (k === "2") restartAfterClear(true);
    return;
  }

  if (state.mode === "choosingSkill") {
    if (k === "1") chooseSkill(0);
    if (k === "2") chooseSkill(1);
    if (k === "3") chooseSkill(2);
    return;
  }

  if (lk === "p") {
    togglePause();
    return;
  }

  if ((k === "-" || k === "_") && e.altKey) {
    state.sfxVolume = Math.max(0, state.sfxVolume - 0.05);
    saveSettings();
    log(`SFX 볼륨: ${(state.sfxVolume * 100).toFixed(0)}%`);
    return;
  }
  if ((k === "=" || k === "+") && e.altKey) {
    state.sfxVolume = Math.min(1, state.sfxVolume + 0.05);
    saveSettings();
    log(`SFX 볼륨: ${(state.sfxVolume * 100).toFixed(0)}%`);
    return;
  }

  if (k === "+" || k === "=") {
    easterEggMoveFloor(1);
    return;
  }
  if (k === "-" || k === "_") {
    easterEggMoveFloor(-1);
    return;
  }
  if (lk === "m") {
    state.sfxVolume = state.sfxVolume > 0 ? 0 : 0.55;
    saveSettings();
    log(`SFX ${state.sfxVolume > 0 ? "켜짐" : "음소거"}`);
  }
  if (lk === "v") {
    state.reducedFx = !state.reducedFx;
    saveSettings();
    log(`화면 이펙트: ${state.reducedFx ? "간소화" : "전체"}`);
  }

  if (lk === "q" && state.running) useConsumable(0);
  if (lk === "c" && state.running && state.floor.info.safeZone) {
    const next = nextCombatStyleId(state.player.styleId || "striker");
    applyCombatStyle(state.player, next);
    log(`전투 스타일 변경: ${state.player.styleName}`);
    saveRunSnapshot();
  }
  if (k === "e" || k === "E") {
    if (tryUseEventRoom()) return;
    if (state.floor.info.safeZone && inShopZone()) openShop();
    else tryExit();
  }
  if ((k === "r" || k === "R") && state.mode === "dead") restartAfterDeath();
});

window.addEventListener("keyup", (e) => {
  const k = e.key;
  const lk = k.length === 1 ? k.toLowerCase() : k;
  state.keys[k] = false;
  state.keys[lk] = false;
});

window.addEventListener("blur", () => {
  for (const k of Object.keys(state.keys)) state.keys[k] = false;
  if (state.mode === "playing") togglePause();
});

// ============================================
// 게임 시작
// ============================================
registerServiceWorker();
startRun();
applyInfoPanelsVisibility();
requestAnimationFrame(loop);
