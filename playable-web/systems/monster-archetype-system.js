const MOB_ARCHETYPES = {
  parking: {
    "세단 미믹": { hp: 42, speed: 1.8, damage: 12, behavior: "chase", imgKey: "dark_guard" },
    "매연 유령": { hp: 34, speed: 2.2, damage: 10, behavior: "kite", imgKey: "necromancer" },
    "불법주차 골렘": { hp: 68, speed: 1.2, damage: 18, behavior: "flank", imgKey: "golem" },
  },
  cafeteria: {
    "식판 병사": { hp: 48, speed: 2.0, damage: 14, behavior: "chase", imgKey: "goblin" },
    "식권 수금봇": { hp: 40, speed: 2.4, damage: 12, behavior: "kite", imgKey: "bat" },
    "국밥 연기 요정": { hp: 36, speed: 2.6, damage: 11, behavior: "flank", imgKey: "frog" },
  },
  lobby: {
    "CCTV 비홀더": { hp: 52, speed: 1.9, damage: 15, behavior: "kite", imgKey: "dark_guard" },
    "출입게이트 파수견": { hp: 60, speed: 2.3, damage: 16, behavior: "chase", imgKey: "goblin_hog" },
    "QR 인증 파수병": { hp: 56, speed: 2.1, damage: 14, behavior: "flank", imgKey: "snail" },
  },
  showroom: {
    "마네킹 예스맨": { hp: 64, speed: 2.2, damage: 17, behavior: "chase", imgKey: "goblin" },
    "레이저 포인터령": { hp: 50, speed: 2.8, damage: 15, behavior: "kite", imgKey: "bat" },
    "유리벽 스토커": { hp: 58, speed: 2.4, damage: 16, behavior: "flank", imgKey: "necromancer" },
  },
  mobile: {
    "터치 제스처": { hp: 62, speed: 2.6, damage: 18, behavior: "chase", imgKey: "skull_slime" },
    "푸시 알림 떼": { hp: 48, speed: 3.2, damage: 14, behavior: "kite", imgKey: "bat" },
    "랜덤박스 임프": { hp: 70, speed: 2.0, damage: 20, behavior: "flank", imgKey: "goblin_hog" },
  },
  server: {
    "버그 떼": { hp: 68, speed: 2.8, damage: 19, behavior: "chase", imgKey: "mushroom" },
    "패킷 거머리": { hp: 54, speed: 3.4, damage: 16, behavior: "kite", imgKey: "bat" },
    "스택트레이스 망령": { hp: 76, speed: 2.2, damage: 22, behavior: "flank", imgKey: "necromancer" },
  },
  glitch: {
    "도플갱어": { hp: 80, speed: 2.5, damage: 21, behavior: "chase", imgKey: "skull_slime" },
    "404 잔상": { hp: 60, speed: 3.6, damage: 18, behavior: "kite", imgKey: "frog" },
    "Null 포식자": { hp: 88, speed: 2.1, damage: 24, behavior: "flank", imgKey: "golem" },
  },
  marketing: {
    "팝업창 방패병": { hp: 94, speed: 2.3, damage: 23, behavior: "chase", imgKey: "goblin" },
    "클릭베이트 박쥐": { hp: 66, speed: 3.8, damage: 20, behavior: "kite", imgKey: "bat" },
    "바이럴 스피커": { hp: 82, speed: 2.7, damage: 22, behavior: "flank", imgKey: "mushroom" },
  },
  support: {
    "콜센터 히드라": { hp: 105, speed: 2.4, damage: 26, behavior: "chase", imgKey: "snail" },
    "대기열 포식자": { hp: 78, speed: 4.0, damage: 22, behavior: "kite", imgKey: "bat" },
    "실적 스캐너": { hp: 96, speed: 2.8, damage: 25, behavior: "flank", imgKey: "dark_guard" },
  },
  executive: {
    "인사팀 암살자": { hp: 120, speed: 2.8, damage: 30, behavior: "chase", imgKey: "necromancer" },
    "결재 도장 골렘": { hp: 150, speed: 2.2, damage: 35, behavior: "flank", imgKey: "golem" },
    "리스크 심사관": { hp: 110, speed: 3.2, damage: 28, behavior: "kite", imgKey: "dark_guard" },
  },
};

export const RescapeRMonsterArchetypeSystem = {
  pickArchetype(zone, mobName, index, rand) {
    const zonePool = MOB_ARCHETYPES[zone] || MOB_ARCHETYPES.parking;
    const base = zonePool[mobName] || { hp: 40, speed: 2, damage: 10, behavior: "chase" };
    
    // 층수에 따른 스탯 보정
    const scale = 1 + index * 0.15;
    return {
      ...base,
      hp: Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      damage: Math.round(base.damage * (1 + index * 0.1)),
      xp: Math.round(15 * scale),
    };
  },

  zonePlan(zone) {
    return MOB_ARCHETYPES[zone] || MOB_ARCHETYPES.parking;
  }
};
