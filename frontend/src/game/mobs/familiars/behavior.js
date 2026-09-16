  function updateFamiliarMob(mob, dt) {
    if (!isPlayerTeamMob(mob)) {
      mob.vx *= Math.pow(0.34, dt);
      mob.vy *= Math.pow(0.34, dt);
      return true;
    }

    const command = activeFamiliarCommand(mob);
    if (command) {
      mob.familiarCommandTimer = Math.max(0, finiteOr(mob.familiarCommandTimer, 0) - dt);
      const dx = command.x - mob.x;
      const dy = command.y - mob.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist <= Math.max(34, mob.radius + 12) || mob.familiarCommandTimer <= 0) {
        clearFamiliarCommand(mob);
        mob.vx *= Math.pow(0.48, dt);
        mob.vy *= Math.pow(0.48, dt);
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        const slowRadius = Math.max(90, mob.radius * 3.2);
        const force = dist > slowRadius ? 260 : 128;
        mob.vx += nx * force * dt;
        mob.vy += ny * force * dt;
        mob.vx *= Math.pow(0.7, dt);
        mob.vy *= Math.pow(0.7, dt);
        const speed = Math.hypot(mob.vx, mob.vy);
        const maxSpeed = mob.kind === "rocket" || mob.kind === "fighter" ? 280 : mob.kind === "rambot" ? 245 : 220;
        if (speed > maxSpeed) {
          mob.vx = (mob.vx / speed) * maxSpeed;
          mob.vy = (mob.vy / speed) * maxSpeed;
        }
        mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
      }
      mob.x += mob.vx * dt;
      mob.y += mob.vy * dt;
      return true;
    }

    const target = nearestHostileMobTarget(mob);
    if (!target) {
      mob.vx *= Math.pow(0.7, dt);
      mob.vy *= Math.pow(0.7, dt);
      mob.x += mob.vx * dt;
      mob.y += mob.vy * dt;
      return true;
    }

    const enemy = target.mob;
    const dx = enemy.x - mob.x;
    const dy = enemy.y - mob.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const desiredDistance = Math.max(60, mob.radius + enemy.radius + 10);

    mob.vx += nx * (dist > desiredDistance ? 165 : -48) * dt + tangentX * 32 * dt;
    mob.vy += ny * (dist > desiredDistance ? 165 : -48) * dt + tangentY * 32 * dt;
    mob.vx *= Math.pow(0.74, dt);
    mob.vy *= Math.pow(0.74, dt);

    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = mob.kind === "rocket" || mob.kind === "fighter" ? 230 : mob.kind === "rambot" ? 210 : 175;
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }

    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;

    if (dist < mob.radius + enemy.radius + 14 && enemy.hitCooldown <= 0) {
      knockMob(enemy, nx, ny, 125);
      damageMob(enemy, familiarDamagePerSecond * dt * 6.5, mob.color, mobName(enemy) + " mauled by your familiar.", {
        sourcePlayerId: mob.familiarOwnerPlayerId || player.id || ""
      });
      mob.health = Math.max(0, finiteOr(mob.health, mob.maxHealth) - hostileFamiliarDamagePerSecond * dt * 3.5);
      mob.flash = Math.max(finiteOr(mob.flash, 0), 0.1);
    }

    return true;
  }
