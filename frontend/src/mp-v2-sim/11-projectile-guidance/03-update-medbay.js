  function updateMedbay(state, structure, dt) {
    const body = bodyById(state.world, structure.bodyId);
    const players = state && state.players && typeof state.players === "object" ? Object.values(state.players) : [];
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.2, 0, 1);
    structure.healPulse = clamp(finiteOr(structure.healPulse, 0) - dt * 2.6, 0, 1);

    for (const player of players) {
      if (!player || finiteOr(player.health, 0) <= 0 || !playerInsideMedbay(player, body, structure)) {
        continue;
      }

      const maxHealth = Math.max(1, finiteOr(player.maxHealth, PLAYER_MAX_HEALTH));
      const missingHealth = Math.max(0, maxHealth - finiteOr(player.health, maxHealth));
      const maxHeal = Math.min(missingHealth, MEDBAY_HEAL_RATE * dt);
      const energyCost = MEDBAY_HEAL_RATE > 0 ? MEDBAY_ENERGY_DRAIN * (maxHeal / MEDBAY_HEAL_RATE) : 0;
      if (maxHeal <= 0 || !spendBodyEnergy(state.world, body, energyCost)) {
        continue;
      }

      player.health = Math.min(maxHealth, finiteOr(player.health, maxHealth) + maxHeal);
      structure.healPulse = 1;
    }
  }

  function fireCampLauncherMissile(state, structure, target) {
    const dist = Math.hypot(target.x - structure.x, target.y - structure.y);
    const leadTime = clamp(dist / LAUNCHER_MISSILE_SPEED, 0, 1.2);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.34;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.34;
    const aim = normalize(targetX - structure.x, targetY - structure.y);
    const color = { r: 255, g: 184, b: 88 };
    const muzzleDistance = 48;
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: structure.x + aim.x * muzzleDistance,
      y: structure.y + aim.y * muzzleDistance,
      vx: aim.x * LAUNCHER_MISSILE_SPEED,
      vy: aim.y * LAUNCHER_MISSILE_SPEED,
      radius: 10,
      length: 54,
      color,
      life: 2.85,
      maxLife: 2.85,
      damage: LAUNCHER_MISSILE_DAMAGE,
      knockback: LAUNCHER_MISSILE_KNOCKBACK,
      cause: "Camp missile launcher",
      rocket: true,
      targetX,
      targetY,
      targetPlayerId: String(target.id || ""),
      targetStructureId: 0,
      sourceStructureId: String(structure.id || ""),
      ignoredBodyId: structure.bodyId,
      hitMobIds: []
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    structure.missileCharge = 0;
    structure.lockTimer = 0;
    structure.beepTimer = 0;
    structure.targetX = targetX;
    structure.targetY = targetY;
    structure.targetCount = 1;
    structure.deploy = 1;
    structure.aimAngle = Math.atan2(aim.y, aim.x);
    state.events.push({ type: "structure.shot", structureId: structure.id, projectileId: projectile.id, tick: state.tick });
  }

  function updateCampMissileLauncher(state, structure, dt) {
    const body = bodyById(state.world, structure.bodyId);
    structure.missileCharge = clamp(finiteOr(structure.missileCharge, 0) + dt / MISSILE_LAUNCHER_PRODUCTION_TIME, 0, 1);
    structure.lockTimer = Math.max(0, finiteOr(structure.lockTimer, 0) - dt);
    structure.beepTimer = Math.max(0, finiteOr(structure.beepTimer, 0) - dt);

    if (structure.missileCharge < 1) {
      structure.targetCount = 0;
      structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 1.2, 0, 0.58 + structure.missileCharge * 0.28);
      structure.aimAngle = finiteOr(structure.aimAngle, structure.angle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, structure.angle), structure.angle), -1.7 * dt, 1.7 * dt);
      return;
    }

    const target = findCampStructurePlayerTarget(state, state.world, structure, MISSILE_LAUNCHER_RANGE);
    if (!target) {
      structure.targetCount = 0;
      structure.lockTimer = 0;
      structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 1.6, 0, 0.9);
      structure.aimAngle = finiteOr(structure.aimAngle, structure.angle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, structure.angle), structure.angle), -1.9 * dt, 1.9 * dt);
      return;
    }

    structure.targetX = target.x;
    structure.targetY = target.y;
    structure.targetCount = 1;
    const targetAngle = Math.atan2(target.y - structure.y, target.x - structure.x);
    structure.aimAngle = finiteOr(structure.aimAngle, structure.angle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, structure.angle), targetAngle), -3.4 * dt, 3.4 * dt);
    structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.4, 0, 1);

    if (structure.lockTimer <= 0) {
      structure.lockTimer = MISSILE_LAUNCHER_LOCK_DURATION;
      structure.beepTimer = 0;
      return;
    }
    if (structure.beepTimer <= 0) {
      structure.beepTimer = 0.2;
    }
    if (structure.lockTimer <= dt * 1.05 && spendBodyEnergy(state.world, body, MISSILE_LAUNCHER_ENERGY_COST)) {
      fireCampLauncherMissile(state, structure, target);
    }
  }

  function updateStructures(state, inputs, dt) {
    const structures = state && state.world && Array.isArray(state.world.structures) ? state.world.structures : [];
    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const structure = structures[i];
      if (!applyStructureSurfaceConstraint(state.world, structure)) {
        structures.splice(i, 1);
        continue;
      }

      const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
      structure.maxHealth = maxHealth;
      structure.health = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
      structure.disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0) - dt);
      structure.flash = Math.max(0, finiteOr(structure.flash, 0) - dt);
      structure.shootCooldown = Math.max(0, finiteOr(structure.shootCooldown, 0) - dt);
      if (isSurvivalCampStructure(state, structure)) {
        structure.survivalCampAggroTimer = Math.max(0, finiteOr(structure.survivalCampAggroTimer, 0) - dt);
        if (structure.survivalCampAggroTimer <= 0) {
          structure.survivalTargetPlayerId = "";
        }
      }

      if (structure.health <= 0 || isStructureDisabled(structure)) {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) - dt * 2.1, 0, 1);
        structure.thrustAmount = Math.max(0, finiteOr(structure.thrustAmount, 0) - dt * 4.5);
        continue;
      }

      if (structure.type === "plating-block") {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 4.2, 0, 1);
        continue;
      }
      if (structure.type === "battery") {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 3.4, 0, 1);
        continue;
      }
      if (structure.type === "medbay") {
        updateMedbay(state, structure, dt);
        continue;
      }
      if (structure.type === "accumulator") {
        updateAccumulator(state, structure, dt);
        continue;
      }
      if (structure.type === "shield-generator") {
        updateShieldGenerator(state, structure, dt);
        continue;
      }
      if (structure.type === "missile-launcher") {
        if (isSurvivalCampStructure(state, structure)) {
          updateCampMissileLauncher(state, structure, dt);
        }
        continue;
      }
      if (structure.type === "trading-port") {
        updateTradingPort(state, structure, dt);
        continue;
      }
      if (structure.type === "communication-relay") {
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.4, 0, 1);
        continue;
      }
      if (structure.type === "jet") {
        updateJet(state, structure, inputs || {}, dt);
        continue;
      }
      if (structure.type === "tether") {
        updateTether(state, structure, dt);
        continue;
      }
      if (structure.type === "bridge") {
        updateBridge(state, structure, dt);
        continue;
      }

      const target = structure.type === "turret" ? findTurretTarget(state, structure) : null;
      const normalAngle = finiteOr(structure.angle, 0);
      if (target) {
        const targetAngle = Math.atan2(target.y - structure.y, target.x - structure.x);
        structure.aimAngle = finiteOr(structure.aimAngle, normalAngle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, normalAngle), targetAngle), -4.2 * dt, 4.2 * dt);
        structure.deploy = clamp(finiteOr(structure.deploy, 0) + dt * 2.8, 0, 1);
        const dist = Math.hypot(target.x - structure.x, target.y - structure.y);
        const hostBody = bodyById(state.world, structure.bodyId);
        if (structure.deploy > 0.72 && structure.shootCooldown <= 0 && spendBodyEnergy(state.world, hostBody, TURRET_ENERGY_COST)) {
          fireTurretLaser(state, structure, target, dist);
        }
      } else {
        structure.aimAngle = finiteOr(structure.aimAngle, normalAngle) + clamp(shortestAngleDelta(finiteOr(structure.aimAngle, normalAngle), normalAngle), -2.2 * dt, 2.2 * dt);
        structure.deploy = clamp(finiteOr(structure.deploy, 0) - dt * 1.6, 0, 1);
      }
    }

    solveBridgeConstraints(state, dt);
    solveTetherConstraints(state, dt);
  }

  function resolveMobBodyCollisions(state) {
    const world = state.world;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0) {
        continue;
      }
      for (const body of world.particles || []) {
        if (!body || !body.tier || !body.tier.solid) {
          continue;
        }
        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = mob.radius + solidContactRadius(body);
        if (dist >= minDist) {
          continue;
        }

        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        const bodyShare = clamp(2.6 / (body.mass + 2.6), 0.006, 0.18);
        const mobShare = 1 - bodyShare;
        const bodySpeed = Math.hypot(body.vx, body.vy);
        const relativeVelocity = (mob.vx - body.vx) * nx + (mob.vy - body.vy) * ny;
        const impactSpeed = Math.max(0, -relativeVelocity);
        const canTriggerBodyDamage = bodySpeed > SOLID_BODY_DAMAGE_SPEED && mob.hitCooldown <= 0 && mobBodyImpactCooldown(mob, body) <= 0;
        const bodyDashActive = finiteOr(mob.bossBodyEvadeTimer, 0) > 0 && finiteOr(mob.hitCooldown, 0) > 0;
        const correctionDistance = canTriggerBodyDamage
          ? Math.min(overlap, 18)
          : bodyDashActive
            ? Math.min(overlap, 12)
            : overlap;
        mob.x += nx * correctionDistance * mobShare;
        mob.y += ny * correctionDistance * mobShare;
        body.x -= nx * correctionDistance * bodyShare;
        body.y -= ny * correctionDistance * bodyShare;

        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.96;
          const pointX = body.x + nx * bodyAngularInertiaRadius(body);
          const pointY = body.y + ny * bodyAngularInertiaRadius(body);
          mob.vx += nx * impulse * 0.86;
          mob.vy += ny * impulse * 0.86;
          applyBodyVelocityChangeAtPoint(body, -nx * impulse * bodyShare, -ny * impulse * bodyShare, pointX, pointY, BODY_CONSTRAINT_TORQUE_RESPONSE);
        }

        if (canTriggerBodyDamage) {
          const impactSpeedForDamage = Math.max(bodySpeed, impactSpeed);
          const damage = solidBodyImpactDamage(body, impactSpeedForDamage, 18);
          markMobDamagedByBody(mob, body);
          const force = bodyImpactKnockbackForce(body, impactSpeedForDamage);
          knockMob(mob, nx, ny, force);
          triggerBossBodyEvade(mob, body, nx, ny, impactSpeedForDamage);
          if (damageMob(state, mob, damage, "body-impact")) {
            break;
          }
        }
      }
    }
  }

  function resolveMobProjectileCollisions(state) {
    const world = state.world;
    for (const body of world.particles || []) {
      if (!body || !body.tier || body.tier.solid || body.tier.threshold < 10) {
        continue;
      }
      const bodySpeed = Math.hypot(body.vx, body.vy);
      if (bodySpeed < PROJECTILE_DAMAGE_SPEED) {
        continue;
      }

      let hit = false;
      for (const mob of allCombatMobs(world)) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0 || mobBodyImpactCooldown(mob, body) > 0) {
          continue;
        }
        const dx = mob.x - body.x;
        const dy = mob.y - body.y;
        const dist = Math.hypot(dx, dy) || 1;
        const hitDistance = mob.radius + body.radius * 1.12;
        if (dist > hitDistance) {
          continue;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const damage = projectileBodyImpactDamage(body, bodySpeed);
        markMobDamagedByBody(mob, body);
        knockMob(mob, nx, ny, 170 + bodySpeed * 0.38);
        triggerBossBodyEvade(mob, body, nx, ny, bodySpeed);
        body.vx *= 0.92;
        body.vy *= 0.92;
        damageMob(state, mob, damage, "projectile-impact");
        hit = true;
        break;
      }
      if (hit) {
        continue;
      }
    }
  }
