(function attachMonsterArchetypeSystem(global) {
  function resolveNameArchetype(name = "") {
    if (!name) return "base";
    const droneKeywords = ["드론", "로봇", "봇", "스캐너", "게이트", "차단기"];
    const watcherKeywords = ["비홀더", "CCTV", "스피커", "감시", "파수견", "로그"];
    const casterKeywords = ["정령", "요정", "주술", "잔향", "메아리"];
    const wispKeywords = ["유령", "망령", "잔상", "환영", "폴터가이스트"];
    const beastKeywords = ["거미", "히드라", "박쥐", "사냥개"];
    const crawlerKeywords = ["포식자", "거머리", "케이블", "덩굴", "떼"];
    const bulkyKeywords = ["골렘", "미믹", "병사", "파수", "집행관", "방패", "수금"];
    const glitchKeywords = ["404", "Null", "예외", "리그레션", "글리치"];
    const agentKeywords = ["암살자", "심사관", "검열관", "평가", "도장", "몰수자"];
    if (droneKeywords.some((k) => name.includes(k))) return "drone";
    if (watcherKeywords.some((k) => name.includes(k))) return "watcher";
    if (casterKeywords.some((k) => name.includes(k))) return "caster";
    if (wispKeywords.some((k) => name.includes(k))) return "wisp";
    if (beastKeywords.some((k) => name.includes(k))) return "beast";
    if (crawlerKeywords.some((k) => name.includes(k))) return "crawler";
    if (bulkyKeywords.some((k) => name.includes(k))) return "bulky";
    if (glitchKeywords.some((k) => name.includes(k))) return "glitcher";
    if (agentKeywords.some((k) => name.includes(k))) return "agent";
    return "base";
  }

  function zonePlan(zone) {
    const plan = {
      parking: ["bulky", "drone", "watcher"],
      cafeteria: ["bulky", "caster", "wisp"],
      lobby: ["watcher", "drone", "agent"],
      showroom: ["watcher", "caster", "agent"],
      mobile: ["drone", "caster", "wisp"],
      server: ["drone", "crawler", "watcher"],
      glitch: ["glitcher", "wisp", "agent"],
      marketing: ["caster", "watcher", "wisp"],
      support: ["bulky", "crawler", "drone"],
      executive: ["agent", "watcher", "bulky"],
    };
    return plan[zone] || ["bulky", "watcher", "wisp"];
  }

  function pickArchetype(zone, mobName, index, rand) {
    if (zone === "parking") {
      if (mobName.includes("세단")) return "drone";
      if (mobName.includes("매연")) return "wisp";
      if (mobName.includes("불법주차")) return "bulky";
      if (mobName.includes("후진 알람")) return "caster";
      if (mobName.includes("주차딱지")) return "agent";
      if (mobName.includes("차단기")) return "glitcher";
    }

    const planned = zonePlan(zone);
    let archetype = planned[index % planned.length];
    const byName = resolveNameArchetype(mobName);
    if (byName !== "base" && rand() < 0.24) {
      archetype = byName;
    }
    return archetype;
  }

  global.RescapeRMonsterArchetypeSystem = {
    resolveNameArchetype,
    zonePlan,
    pickArchetype,
  };
})(window);
