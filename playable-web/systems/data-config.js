import { RescapeRUtils as Utils } from './utils.js';

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

const SKILL_TEMPLATES = [
  {
    id: "power",
    label: "강공",
    roll: () => {
      const v = Utils.randInt(10, 26) / 100;
      return { desc: `공격력 +${Utils.pctText(v)}`, tag: `강공+${Utils.pctText(v)}`, apply: (p) => { p.damageMul += v; } };
    },
  },
  {
    id: "vital",
    label: "강인함",
    roll: () => {
      const v = Utils.randInt(12, 36);
      return { desc: `HP +${v}`, tag: `강인함+${v}`, apply: (p) => { p.maxHp += v; p.hp += v; } };
    },
  },
  {
    id: "swift",
    label: "민첩",
    roll: () => {
      const v = Utils.randInt(6, 18) / 100;
      return { desc: `이동속도 +${Utils.pctText(v)}`, tag: `민첩+${Utils.pctText(v)}`, apply: (p) => { p.speedMul += v; } };
    },
  },
  {
    id: "blade",
    label: "연속베기",
    roll: () => {
      const v = Utils.randInt(8, 24) / 100;
      return { desc: `공격 쿨타임 -${Utils.pctText(v)}`, tag: `연속-${Utils.pctText(v)}`, apply: (p) => { p.attackCdMul *= (1 - v); } };
    },
  },
  {
    id: "dash",
    label: "가속대시",
    roll: () => {
      const v = Utils.randInt(10, 26) / 100;
      return { desc: `대시 쿨타임 -${Utils.pctText(v)}`, tag: `대시-${Utils.pctText(v)}`, apply: (p) => { p.dashCdMul *= (1 - v); } };
    },
  },
  {
    id: "leech",
    label: "흡혈",
    roll: () => {
      const v = Utils.randInt(2, 8);
      return { desc: `처치시 HP +${v}`, tag: `흡혈+${v}`, apply: (p) => { p.lifeStealOnKill += v; } };
    },
  },
  {
    id: "crit",
    label: "정밀사격",
    roll: () => {
      const v = Utils.randInt(4, 14) / 100;
      return { desc: `치명타 확률 +${Utils.pctText(v)}`, tag: `치확+${Utils.pctText(v)}`, apply: (p) => { p.critChance += v; } };
    },
  },
  {
    id: "critdmg",
    label: "치명강타",
    roll: () => {
      const v = Utils.randInt(12, 35) / 100;
      return { desc: `치명타 피해 +${Utils.pctText(v)}`, tag: `치피+${Utils.pctText(v)}`, apply: (p) => { p.critDamageMul += v; } };
    },
  },
  {
    id: "guard",
    label: "강철몸",
    roll: () => {
      const v = Utils.randInt(5, 16) / 100;
      return { desc: `받는 피해 -${Utils.pctText(v)}`, tag: `방어-${Utils.pctText(v)}`, apply: (p) => { p.damageTakenMul *= (1 - v); } };
    },
  },
  {
    id: "regen",
    label: "회복호흡",
    roll: () => {
      const v = Utils.randInt(1, 4);
      return { desc: `초당 HP +${v} 재생`, tag: `재생+${v}`, apply: (p) => { p.regenPerSec += v; } };
    },
  },
  {
    id: "reach",
    label: "리치확장",
    roll: () => {
      const v = Utils.randInt(4, 14);
      return { desc: `근접 사거리 +${v}`, tag: `사거리+${v}`, apply: (p) => { p.skillReachBonus += v; } };
    },
  },
  {
    id: "execute",
    label: "마무리",
    roll: () => {
      const threshold = Utils.randInt(20, 35) / 100;
      const mul = Utils.randInt(12, 35) / 100;
      return {
        desc: `적 HP ${Utils.pctText(threshold)} 이하 공격 시 피해 +${Utils.pctText(mul)}`,
        tag: `마무리+${Utils.pctText(mul)}`,
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

export const RescapeRConfig = {
  ART_ASSET_PATHS,
  ART_FRAME_SPECS,
  FLOOR_PLAN,
  THEMES,
  ELEVATOR_QUOTES,
  SKILL_TEMPLATES,
  itemCatalog,
  WEAPON_CATALOG,
  WEAPON_AFFIXES,
  SHOP_OPTIONS,
  ENEMY_MUTATORS,
  SPECIAL_EVENT_ROOM_BY_ZONE,
  PLAYER_CALLSIGN,
  MONSTER_NAME_POOL,
  EXECUTIVE_MINI_BOSSES,
  CHARACTER_STYLES,
};
