export const RescapeRAISystem = {
  updateEnemyAI(e, player, dt, worldWidth) {
    const dtSec = dt * 0.001;
    const dist = player.x - e.x;
    const absDist = Math.abs(dist);
    
    // 어그로 거리
    const aggro = (e.type === "boss" || e.type === "exec") ? 1200 : 500;
    if (absDist < aggro) {
      e.dir = dist > 0 ? 1 : -1;
    }

    if (e.stunTimer <= 0) {
      const speedMul = e.slowTimer > 0 ? 0.5 : 1;
      
      if (e.behavior === "kite") {
        // 거리 유지 (카이팅)
        if (absDist < 180) e.x -= e.dir * e.speed * speedMul * dtSec * 60;
        else if (absDist > 300) e.x += e.dir * e.speed * speedMul * dtSec * 60;
      } else if (e.behavior === "flank") {
        // 측면 기습
        const targetX = player.x + (dist > 0 ? -120 : 120);
        const flankDir = targetX > e.x ? 1 : -1;
        e.x += flankDir * e.speed * speedMul * dtSec * 60;
      } else {
        // 단순 추격
        if (absDist > 20) e.x += e.dir * e.speed * speedMul * dtSec * 60;
      }
    }
    
    // 월드 경계 제한
    e.x = Math.max(50, Math.min(worldWidth - 50 - e.w, e.x));
    e.walkAnim += dtSec * 6;
    
    // 타이머 업데이트
    if (e.stunTimer > 0) e.stunTimer -= dt;
    if (e.slowTimer > 0) e.slowTimer -= dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;
  }
};
