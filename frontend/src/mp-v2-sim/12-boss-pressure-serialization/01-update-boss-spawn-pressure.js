  function updateBossSpawnPressure(state, mob) {
    if (!mob || !mob.isBoss || mob.health <= 0) {
      return;
    }
    if (state.world && (finiteOr(state.world.mobSpawnRestTimer, 0) > 0 || finiteOr(state.world.mobSpawnRestDrainTimer, 0) > 0)) {
      return;
    }
    if (!state.world) {
      return;
    }
    const interval = difficultyMobWaveInterval(state);
    state.world.mobWaveTimer = Math.min(
      finiteOr(state.world.mobWaveTimer, interval),
      interval * MOB_BOSS_SPAWN_TIMER_CEILING_SCALE
    );
  }

  function nearestHostileMobTarget(world, source) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob === source || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      if (isSurvivalCampMob({ world, gameMode: world && world.gameMode }, mob) && finiteOr(mob.survivalCampAggroTimer, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - source.x, mob.y - source.y);
      if (distance < bestDistance) {
        best = mob;
        bestDistance = distance;
      }
    }
    return best ? { mob: best, distance: bestDistance } : null;
  }

  function activeFamiliarCommand(mob) {
    if (!isPlayerTeamMob(mob) || finiteOr(mob.familiarCommandTimer, 0) <= 0) {
      return null;
    }
    if (!Number.isFinite(Number(mob.familiarCommandX)) || !Number.isFinite(Number(mob.familiarCommandY))) {
      mob.familiarCommandTimer = 0;
      return null;
    }
    return {
      x: finiteOr(mob.familiarCommandX, mob.x),
      y: finiteOr(mob.familiarCommandY, mob.y)
    };
  }

  function clearFamiliarCommand(mob) {
    mob.familiarCommandTimer = 0;
    mob.familiarCommandX = finiteOr(mob.x, 0);
    mob.familiarCommandY = finiteOr(mob.y, 0);
  }

  function updateFamiliarMob(state, mob, dt) {
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
      if (dist <= Math.max(34, finiteOr(mob.radius, 28) + 12) || mob.familiarCommandTimer <= 0) {
        clearFamiliarCommand(mob);
        mob.vx *= Math.pow(0.48, dt);
        mob.vy *= Math.pow(0.48, dt);
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        const slowRadius = Math.max(90, finiteOr(mob.radius, 28) * 3.2);
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
      mob.x += finiteOr(mob.vx, 0) * dt;
      mob.y += finiteOr(mob.vy, 0) * dt;
      return true;
    }

    const target = nearestHostileMobTarget(state.world, mob);
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
    const desiredDistance = Math.max(60, finiteOr(mob.radius, 28) + finiteOr(enemy.radius, 28) + 10);
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
    if (dist < finiteOr(mob.radius, 28) + finiteOr(enemy.radius, 28) + 14 && finiteOr(enemy.hitCooldown, 0) <= 0) {
      knockMob(enemy, nx, ny, 125);
      damageMob(state, enemy, FAMILIAR_DAMAGE_PER_SECOND * dt * 6.5, "familiar", mob.familiarOwnerPlayerId || "");
      mob.health = Math.max(0, finiteOr(mob.health, mob.maxHealth) - HOSTILE_FAMILIAR_DAMAGE_PER_SECOND * dt * 3.5);
      mob.flash = Math.max(finiteOr(mob.flash, 0), 0.1);
    }
    return true;
  }

  function isSurvivalCampMob(state, mob) {
    return Boolean(
      state &&
      mob &&
      mob.survivalCampId &&
      !isPlayerTeamMob(mob) &&
      !isHordeGameMode(state.gameMode || state.world && state.world.gameMode)
    );
  }

  function clearSurvivalCampAttackState(mob) {
    if (!mob) {
      return;
    }
    mob.lightningWarmup = 0;
    mob.lockTimer = 0;
    mob.volleyTimer = 0;
    mob.volleyShots = 0;
    mob.scanProgress = 0;
    mob.chargeTimer = 0;
    mob.chargePower = 0;
    mob.machineGunShots = 0;
    mob.pistonTimer = 0;
    mob.pistonHit = false;
    mob.recoverTimer = Math.max(0.16, finiteOr(mob.recoverTimer, 0));
  }

  function isSurvivalCampStructure(state, structure) {
    return Boolean(
      structure &&
      structure.survivalCampId &&
      !isHordeGameMode(state && (state.gameMode || state.world && state.world.gameMode))
    );
  }

  function playerScoredSurvivalCampBodyIds(state) {
    const ids = new Set();
    if (!state || !state.players || typeof playerScoredBodyIds !== "function") {
      return ids;
    }
    for (const player of Object.values(state.players)) {
      for (const bodyId of playerScoredBodyIds(state, player)) {
        ids.add(Math.floor(finiteOr(bodyId, 0)));
      }
    }
    return ids;
  }

  function isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds) {
    const ids = scoredBodyIds || playerScoredSurvivalCampBodyIds(state);
    return Boolean(body && ids.has(Math.floor(finiteOr(body.id, 0))));
  }

  function wakeSurvivalCampStructures(state, campId, wakeX, wakeY, targetPlayerId) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!world || !cleanCampId || !Array.isArray(world.structures)) {
      return 0;
    }

    let woken = 0;
    for (const structure of world.structures) {
      if (
        !structure ||
        structure.survivalCampId !== cleanCampId ||
        finiteOr(structure.health, 0) <= 0 ||
        Math.hypot(finiteOr(structure.x, wakeX) - wakeX, finiteOr(structure.y, wakeY) - wakeY) > SURVIVAL_CAMP_WAKE_RADIUS
      ) {
        continue;
      }
      structure.survivalCampAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
      structure.survivalTargetPlayerId = cleanTargetPlayerId;
      woken += 1;
    }
    return woken;
  }

  function wakeSurvivalCamp(state, campId, targetPlayerId, reason, originX, originY) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!state || !world || !cleanCampId || !cleanTargetPlayerId || isHordeGameMode(state.gameMode || world.gameMode)) {
      return false;
    }
    const wakeX = finiteOr(originX, 0);
    const wakeY = finiteOr(originY, 0);
    let woken = wakeSurvivalCampStructures(state, cleanCampId, wakeX, wakeY, cleanTargetPlayerId);
    for (const campMob of allCombatMobs(world)) {
      if (
        !campMob ||
        campMob.survivalCampId !== cleanCampId ||
        campMob.health <= 0 ||
        isPlayerTeamMob(campMob) ||
        Math.hypot(campMob.x - wakeX, campMob.y - wakeY) > SURVIVAL_CAMP_WAKE_RADIUS
      ) {
        continue;
      }
      campMob.survivalCampAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
      campMob.survivalCampReturning = false;
      campMob.survivalCampOrphanedByAggro = false;
      clearSurvivalCampMigrationState(campMob);
      campMob.survivalTargetPlayerId = cleanTargetPlayerId;
      campMob.survivalCampWakeReason = String(reason || "aggression");
      woken += 1;
    }
    if (woken > 0) {
      state.events.push({
        type: "mob.camp.woken",
        campId: cleanCampId,
        count: woken,
        targetPlayerId: cleanTargetPlayerId,
        reason: String(reason || "aggression"),
        tick: state.tick
      });
    }
    return woken > 0;
  }

  function wakeSurvivalCampFromMob(state, mob, targetPlayerId) {
    if (!isSurvivalCampMob(state, mob)) {
      return false;
    }
    return wakeSurvivalCamp(
      state,
      mob.survivalCampId,
      targetPlayerId,
      "mob-damaged",
      finiteOr(mob.survivalCampX, mob.x),
      finiteOr(mob.survivalCampY, mob.y)
    );
  }

  function aggroNearbyMobsFromPlayerDamage(state, damagedMob, targetPlayerId) {
    const world = state && state.world;
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!world || !damagedMob || !cleanTargetPlayerId || isPlayerTeamMob(damagedMob)) {
      return false;
    }

    let aggroed = 0;
    for (const nearbyMob of allCombatMobs(world)) {
      if (
        !nearbyMob ||
        nearbyMob.health <= 0 ||
        isPlayerTeamMob(nearbyMob) ||
        Math.hypot(nearbyMob.x - damagedMob.x, nearbyMob.y - damagedMob.y) > SURVIVAL_CAMP_WAKE_RADIUS
      ) {
        continue;
      }

      nearbyMob.playerDamageAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
      nearbyMob.playerDamageAggroTargetPlayerId = cleanTargetPlayerId;
      if (isSurvivalCampMob(state, nearbyMob) || isSurvivalMigratingMob(state, nearbyMob)) {
        nearbyMob.survivalCampAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
        nearbyMob.survivalTargetPlayerId = cleanTargetPlayerId;
        nearbyMob.survivalCampReturning = false;
        nearbyMob.survivalCampOrphanedByAggro = false;
      }
      aggroed += 1;
    }
    return aggroed > 0;
  }

  function wakeSurvivalCampFromStructure(state, structure, targetPlayerId) {
    if (!isSurvivalCampStructure(state, structure)) {
      return false;
    }
    return wakeSurvivalCamp(
      state,
      structure.survivalCampId,
      targetPlayerId,
      structure.type === "container" ? "camp-theft" : "structure-damaged",
      finiteOr(structure.survivalCampX, structure.x),
      finiteOr(structure.survivalCampY, structure.y)
    );
  }

  function wakeSurvivalCampFromBody(state, body, targetPlayerId, options) {
    const allowScoredBody = Boolean(options && options.allowScoredBody);
    if (
      !state ||
      !body ||
      !body.survivalCampBody ||
      !body.survivalCampId ||
      (!allowScoredBody && isPlayerScoredSurvivalCampBody(state, body)) ||
      isHordeGameMode(state.gameMode || state.world && state.world.gameMode)
    ) {
      return false;
    }

    return wakeSurvivalCamp(
      state,
      body.survivalCampId,
      targetPlayerId,
      "camp-body-interfered",
      finiteOr(body.survivalCampX, body.x),
      finiteOr(body.survivalCampY, body.y)
    );
  }

  function ensureSurvivalCampBodyHome(body) {
    if (!body || !body.survivalCampBody) {
      return null;
    }
    if (!Number.isFinite(Number(body.survivalCampHomeX)) || !Number.isFinite(Number(body.survivalCampHomeY))) {
      body.survivalCampHomeX = finiteOr(body.x, 0);
      body.survivalCampHomeY = finiteOr(body.y, 0);
    }
    return {
      x: finiteOr(body.survivalCampHomeX, body.x),
      y: finiteOr(body.survivalCampHomeY, body.y)
    };
  }

  function markSurvivalCampBodyMovedByPlayer(body, playerId) {
    if (!body || !body.survivalCampBody) {
      return;
    }
    ensureSurvivalCampBodyHome(body);
    body.survivalCampMovedByPlayer = true;
    body.survivalCampLastMoverPlayerId = String(playerId || "");
  }

  function maybeWakeSurvivalCampFromMovedBody(state, body) {
    if (!body || !body.survivalCampBody || !body.survivalCampMovedByPlayer || body.survivalCampBodyMovedWakeSent || isPlayerScoredSurvivalCampBody(state, body)) {
      return false;
    }
    const home = ensureSurvivalCampBodyHome(body);
    if (!home || Math.hypot(finiteOr(body.x, home.x) - home.x, finiteOr(body.y, home.y) - home.y) < SURVIVAL_CAMP_BODY_WAKE_DISTANCE) {
      return false;
    }
    body.survivalCampBodyMovedWakeSent = true;
    return wakeSurvivalCampFromBody(state, body, body.survivalCampLastMoverPlayerId || "");
  }

  function survivalCampAnchorPoint(state, campId, fallbackX, fallbackY) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    if (!world || !Array.isArray(world.particles) || !cleanCampId) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }

    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    const scoredBodyIds = playerScoredSurvivalCampBodyIds(state);
    for (const body of world.particles) {
      if (!body || !body.survivalCampBody || body.survivalCampId !== cleanCampId || isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds)) {
        continue;
      }
      const weight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      weightedX += finiteOr(body.x, fallbackX) * weight;
      weightedY += finiteOr(body.y, fallbackY) * weight;
      totalWeight += weight;
    }

    if (totalWeight <= 0) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }
    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      hasCampBody: true
    };
  }

  function nearestSurvivalCampAnchor(state, campId, x, y) {
    const world = state && state.world;
    const ignoredCampId = String(campId || "");
    if (!world || !Array.isArray(world.particles)) {
      return null;
    }

    const camps = new Map();
    const scoredBodyIds = playerScoredSurvivalCampBodyIds(state);
    for (const body of world.particles) {
      if (!body || !body.survivalCampBody || !body.survivalCampId || body.survivalCampId === ignoredCampId || isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds)) {
        continue;
      }
      const id = String(body.survivalCampId);
      const weight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      const current = camps.get(id) || { campId: id, weightedX: 0, weightedY: 0, totalWeight: 0 };
      current.weightedX += finiteOr(body.x, x) * weight;
      current.weightedY += finiteOr(body.y, y) * weight;
      current.totalWeight += weight;
      camps.set(id, current);
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (const camp of camps.values()) {
      if (camp.totalWeight <= 0) {
        continue;
      }
      const campX = camp.weightedX / camp.totalWeight;
      const campY = camp.weightedY / camp.totalWeight;
      const distance = Math.hypot(finiteOr(x, 0) - campX, finiteOr(y, 0) - campY);
      if (distance < nearestDistance) {
        nearest = { campId: camp.campId, x: campX, y: campY };
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function clearSurvivalCampMigrationState(mob) {
    mob.survivalMigrationCampId = "";
    mob.survivalMigrationCampX = Number.NaN;
    mob.survivalMigrationCampY = Number.NaN;
    mob.survivalMigrationStraightTime = 0;
    mob.survivalMigrationDirX = 0;
    mob.survivalMigrationDirY = 0;
  }

  function isSurvivalMigratingMob(state, mob) {
    return Boolean(
      mob &&
      !isPlayerTeamMob(mob) &&
      !isHordeGameMode(state && state.gameMode) &&
      (mob.survivalEncounterType === "migration" || mob.survivalEncounterType === "salvage" || (!mob.survivalCampId && mob.survivalMigrationCampId))
    );
  }

  function nearbySurvivalMigrationPlayer(state, mob) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const player of Object.values(state && state.players || {})) {
      if (!player || finiteOr(player.health, 0) <= 0 || player.spacecraftInterior) continue;
      const distance = Math.hypot(player.x - mob.x, player.y - mob.y);
      if (distance <= SURVIVAL_MIGRATION_AGGRO_RADIUS && distance < nearestDistance) {
        nearest = player;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function clearSurvivalCampMobIdentity(mob) {
    mob.survivalCampId = "";
    mob.survivalCampX = finiteOr(mob.x, 0);
    mob.survivalCampY = finiteOr(mob.y, 0);
    mob.survivalCampAggroTimer = 0;
    mob.survivalCampReturning = false;
    mob.survivalTargetPlayerId = "";
    mob.survivalCampOrphanedByAggro = false;
    clearSurvivalCampMigrationState(mob);
    if (mob.survivalEncounterType === "camp") {
      mob.survivalEncounterType = "";
      mob.survivalEncounterId = "";
      mob.survivalCampBudget = 0;
      mob.survivalCampBand = "";
    }
  }

  function survivalCampMigrationTarget(state, mob) {
    const migrationCampId = String(mob && mob.survivalMigrationCampId || "");
    if (migrationCampId) {
      const anchor = survivalCampAnchorPoint(
        state,
        migrationCampId,
        finiteOr(mob.survivalMigrationCampX, mob.x),
        finiteOr(mob.survivalMigrationCampY, mob.y)
      );
      if (anchor.hasCampBody) {
        return {
          campId: migrationCampId,
          x: anchor.x,
          y: anchor.y
        };
      }
    }
    return nearestSurvivalCampAnchor(state, mob.survivalCampId, mob.x, mob.y);
  }

  function updateOrphanedSurvivalCampMobMigration(state, mob, dt) {
    const targetCamp = survivalCampMigrationTarget(state, mob);
    if (!targetCamp) {
      mob.survivalCampId = "";
      mob.survivalEncounterType = "migration";
      mob.survivalEncounterId = "";
      clearSurvivalCampMigrationState(mob);
      return true;
    }

    mob.survivalMigrationCampId = targetCamp.campId;
    mob.survivalMigrationCampX = targetCamp.x;
    mob.survivalMigrationCampY = targetCamp.y;
    mob.survivalCampReturning = true;
    mob.survivalCampAggroTimer = 0;
    mob.survivalTargetPlayerId = "";
    mob.survivalCampOrphanedByAggro = false;

    const dx = targetCamp.x - mob.x;
    const dy = targetCamp.y - mob.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = Math.hypot(finiteOr(mob.vx, 0), finiteOr(mob.vy, 0));
    if (distance <= SURVIVAL_CAMP_IDLE_RADIUS * 0.58 && speed < 130) {
      mob.survivalCampId = targetCamp.campId;
      mob.survivalCampX = targetCamp.x;
      mob.survivalCampY = targetCamp.y;
      mob.survivalCampReturning = false;
      mob.survivalCampSlotAngle = Math.atan2(finiteOr(mob.y, targetCamp.y) - targetCamp.y, finiteOr(mob.x, targetCamp.x) - targetCamp.x);
      mob.survivalCampSlotRadius = clamp(distance, 120, SURVIVAL_CAMP_IDLE_RADIUS);
      mob.survivalEncounterType = "camp";
      mob.survivalEncounterId = targetCamp.campId;
      const resident = allCombatMobs(state.world).find((candidate) => candidate && candidate !== mob && candidate.health > 0 && candidate.survivalCampId === targetCamp.campId);
      if (resident) {
        mob.survivalCampBand = resident.survivalCampBand || mob.survivalCampBand || "starter";
        mob.survivalCampBudget = Math.max(finiteOr(mob.survivalCampBudget, 0), finiteOr(resident.survivalCampBudget, 0));
      }
      clearSurvivalCampMigrationState(mob);
      clearSurvivalCampAttackState(mob);
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const previousDirX = finiteOr(mob.survivalMigrationDirX, nx);
    const previousDirY = finiteOr(mob.survivalMigrationDirY, ny);
    const alignment = previousDirX * nx + previousDirY * ny;
    mob.survivalMigrationStraightTime = alignment > 0.96
      ? Math.min(8, finiteOr(mob.survivalMigrationStraightTime, 0) + dt)
      : Math.max(0, finiteOr(mob.survivalMigrationStraightTime, 0) - dt * 2.5);
    mob.survivalMigrationDirX = nx;
    mob.survivalMigrationDirY = ny;
    const momentum = clamp(mob.survivalMigrationStraightTime / 7, 0, 1);
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const travelForce = 190 + momentum * 240;
    mob.vx += nx * travelForce * dt + tangentX * 12 * (1 - momentum) * dt;
    mob.vy += ny * travelForce * dt + tangentY * 12 * (1 - momentum) * dt;
    mob.vx *= Math.pow(0.88, dt);
    mob.vy *= Math.pow(0.88, dt);
    const nextSpeed = Math.hypot(mob.vx, mob.vy);
    const cruiseSpeed = 250 + (SURVIVAL_MIGRATION_MAX_SPEED - 250) * momentum;
    const maxSpeed = distance < 2400 ? clamp(120 + distance * 0.2, 150, cruiseSpeed) : cruiseSpeed;
    if (nextSpeed > maxSpeed) {
      mob.vx = (mob.vx / nextSpeed) * maxSpeed;
      mob.vy = (mob.vy / nextSpeed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
    return true;
  }

  function updateSurvivalCampMobHome(state, mob, dt) {
    if (mob && mob.survivalEncounterType === "salvage" && mob.survivalSalvageBodyId) {
      return false;
    }

    const campMob = isSurvivalCampMob(state, mob);
    const migratingMob = isSurvivalMigratingMob(state, mob) || Boolean(mob && !isPlayerTeamMob(mob) && !isHordeGameMode(state && state.gameMode) && !mob.survivalCampId && mob.survivalEncounterType !== "hit-squad");
    if (!campMob && !migratingMob) return false;

    mob.survivalCampAggroTimer = Math.max(0, finiteOr(mob.survivalCampAggroTimer, 0) - dt);
    if (!campMob) {
      mob.survivalEncounterType = "migration";
      const nearbyPlayer = nearbySurvivalMigrationPlayer(state, mob);
      if (nearbyPlayer) {
        mob.survivalCampAggroTimer = SURVIVAL_MIGRATION_AGGRO_DURATION;
        mob.survivalTargetPlayerId = String(nearbyPlayer.id || "");
      }
      if (mob.survivalCampAggroTimer > 0 && mob.survivalTargetPlayerId) {
        return false;
      }
      mob.survivalTargetPlayerId = "";
      return updateOrphanedSurvivalCampMobMigration(state, mob, dt);
    }
    let campAnchor = survivalCampAnchorPoint(state, mob.survivalCampId, finiteOr(mob.survivalCampX, mob.x), finiteOr(mob.survivalCampY, mob.y));
    if (!campAnchor.hasCampBody) {
      if (mob.survivalCampAggroTimer > 0) {
        mob.survivalCampOrphanedByAggro = true;
        clearSurvivalCampMigrationState(mob);
        return false;
      }
      mob.survivalTargetPlayerId = "";
      if (mob.survivalCampOrphanedByAggro) {
        mob.survivalCampOrphanedByAggro = false;
      }
      if (updateOrphanedSurvivalCampMobMigration(state, mob, dt)) {
        return true;
      }
      return false;
    }
    const campX = campAnchor.x;
    const campY = campAnchor.y;
    mob.survivalCampX = campX;
    mob.survivalCampY = campY;
    const leashRadius = Math.max(600, finiteOr(mob.survivalCampLeashRadius, SURVIVAL_CAMP_LEASH_RADIUS));
    const homeDx = campX - mob.x;
    const homeDy = campY - mob.y;
    const homeDistance = Math.hypot(homeDx, homeDy);

    if (mob.survivalCampAggroTimer > 0) {
      return false;
    }

    if (homeDistance > leashRadius || mob.survivalCampAggroTimer <= 0) {
      mob.survivalCampAggroTimer = 0;
      mob.survivalCampReturning = homeDistance > SURVIVAL_CAMP_RETURN_RADIUS;
      if (mob.survivalEncounterType === "camp") {
        mob.survivalTargetPlayerId = "";
      }
      clearSurvivalCampAttackState(mob);
    }

    const time = simTime(state);
    const slotAngle = finiteOr(mob.survivalCampSlotAngle, finiteOr(mob.wobble, 0)) + Math.sin(time * 0.16 + finiteOr(mob.wobble, 0)) * 0.18;
    const slotRadius = clamp(finiteOr(mob.survivalCampSlotRadius, SURVIVAL_CAMP_IDLE_RADIUS * 0.65), 120, SURVIVAL_CAMP_IDLE_RADIUS);
    const targetX = campX + Math.cos(slotAngle) * slotRadius;
    const targetY = campY + Math.sin(slotAngle) * slotRadius;
    const toTargetX = targetX - mob.x;
    const toTargetY = targetY - mob.y;
    const targetDistance = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / targetDistance;
    const ny = toTargetY / targetDistance;
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const returnForce = homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 176 : targetDistance > 120 ? 92 : 22;
    const strafeForce = targetDistance < 240 ? 48 : 18;

    mob.vx += nx * returnForce * dt + tangentX * strafeForce * dt;
    mob.vy += ny * returnForce * dt + tangentY * strafeForce * dt;
    mob.vx += Math.sin(time * 0.7 + finiteOr(mob.wobble, 0)) * 9 * dt;
    mob.vy += Math.cos(time * 0.63 + finiteOr(mob.wobble, 0)) * 9 * dt;
    mob.vx *= Math.pow(homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 0.76 : 0.62, dt);
    mob.vy *= Math.pow(homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 0.76 : 0.62, dt);

    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = homeDistance > SURVIVAL_CAMP_RETURN_RADIUS ? 250 : 118;
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    if (homeDistance <= SURVIVAL_CAMP_RETURN_RADIUS * 0.72) {
      mob.survivalCampReturning = false;
    }
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
    return true;
  }

  function updateMobs(state, dt, options) {
    const players = combatTargetsForMobs(state);
    if (!players.length) {
      updateRivalProjectiles(state, dt, options);
      return;
    }
    const seedHolder = { seed: state.seed >>> 0 };
    for (const collectionName of MOB_COLLECTIONS) {
      const list = state.world[collectionName] || [];
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const mob = list[i];
        ensureMobMechanics(mob, seedHolder);
        mob.hitCooldown = Math.max(0, finiteOr(mob.hitCooldown, 0) - dt);
        mob.disabledTimer = Math.max(0, finiteOr(mob.disabledTimer, 0) - dt);
        mob.playerDamageAggroTimer = Math.max(0, finiteOr(mob.playerDamageAggroTimer, 0) - dt);
        if (mob.playerDamageAggroTimer <= 0) {
          mob.playerDamageAggroTargetPlayerId = "";
        }
        if (finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0)) {
          mob.summonAge = Math.min(mob.summonDuration, finiteOr(mob.summonAge, 0) + dt);
          const progress = clamp(mob.summonAge / Math.max(0.001, mob.summonDuration), 0, 1);
          const eased = progress * progress * (3 - progress * 2);
          mob.radius = Math.max(0.1, finiteOr(mob.summonBaseRadius, mob.radius) * eased);
          mob.rotation = finiteOr(mob.rotation, 0) + finiteOr(mob.summonSpinSpeed, 0) * (1 - progress * 0.65) * dt;
        } else if (finiteOr(mob.summonDuration, 0) > 0) {
          mob.radius = Math.max(1, finiteOr(mob.summonBaseRadius, mob.radius));
          mob.summonDuration = 0;
          mob.summonAge = 0;
          mob.summonSpinSpeed = 0;
        }
        mob.bossBodyEvadeTimer = Math.max(0, finiteOr(mob.bossBodyEvadeTimer, 0) - dt);
        if (mob.bossBodyEvadeTimer <= 0) {
          mob.bossBodyEvadeSpeedCap = 0;
        }
        if (mob.kind === "ufo" || mob.tractorDisabledTimer !== undefined) {
          mob.tractorDisabledTimer = Math.max(0, finiteOr(mob.tractorDisabledTimer, 0) - dt);
        }
        mob.flash = Math.max(0, finiteOr(mob.flash, 0) - dt);
        tickMobBodyImpactCooldowns(mob, dt);
        if (mob.health <= 0) {
          list.splice(i, 1);
          continue;
        }
        if (finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0)) {
          continue;
        }
        if (!isPlayerTeamMob(mob) && mob.survivalEncounterType === "hit-squad" && mob.playerDamageAggroTimer <= 0) {
          list.splice(i, 1);
          continue;
        }
        const damageTargetId = String(mob.playerDamageAggroTargetPlayerId || "");
        const damageTarget = mob.playerDamageAggroTimer > 0 && damageTargetId
          ? state.players && state.players[damageTargetId]
          : null;
        const hasDamageTarget = Boolean(damageTarget && finiteOr(damageTarget.health, 0) > 0 && !damageTarget.spacecraftInterior);
        let mobTargets = hasDamageTarget
          ? [damageTarget]
          : isPlayerTeamMob(mob) && activeFamiliarCommand(mob)
          ? []
          : isPlayerTeamMob(mob) ? familiarHostileTargets(state.world, mob) : players;
        if (!hasDamageTarget && !isPlayerTeamMob(mob) && (isSurvivalCampMob(state, mob) || isSurvivalMigratingMob(state, mob))) {
          const targetId = String(mob.survivalTargetPlayerId || "");
          const target = targetId ? state.players && state.players[targetId] : null;
          mobTargets = target && finiteOr(target.health, 0) > 0 && !target.spacecraftInterior ? [target] : [];
        }
        if (updateSurvivalCampMobHome(state, mob, dt)) {
          continue;
        }
        if (!mobTargets.length && !(mob.kind === "ufo" && mob.survivalSalvageBodyId)) {
          if (isPlayerTeamMob(mob)) {
            updateFamiliarMob(state, mob, dt);
          }
          continue;
        }
        updateBossSpawnPressure(state, mob);
        if (isMobDisabled(mob)) {
          updateDisabledMobDrift(state, mob, dt);
          continue;
        }
        if (collectionName === "alienoids" || mob.kind === "alienoid") {
          updateAlienoid(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "ufos" || mob.kind === "ufo") {
          updateUfo(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "rambots" || mob.kind === "rambot") {
          updateRambot(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "engineers" || mob.kind === "engineer") {
          updateEngineer(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "teslas" || mob.kind === "tesla") {
          updateTesla(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "rockets" || mob.kind === "rocket" || mob.kind === "satellite") {
          updateRocketMob(state, mob, mobTargets, dt, seedHolder);
          continue;
        }
        if (collectionName === "fighters" || mob.kind === "fighter") {
          updateFighter(state, mob, mobTargets, dt, seedHolder);
        }
      }
    }
    updateRivalProjectiles(state, dt, options);
    resolveMobBodyCollisions(state);
    resolveMobProjectileCollisions(state);
    state.seed = seedHolder.seed >>> 0;
  }

  function applyGadgets(state, inputs, dt) {
    const players = state.players || {};
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state.seed, 1))) >>> 0 };
    for (const [playerId, player] of Object.entries(players)) {
      const input = sanitizeInput(inputs[playerId], player, { dt, requireEnergy: true, allowCommittedToolMode: true });
      if (!input || player.health <= 0 || player.spacecraftInterior) {
        continue;
      }
      for (const body of state.world.particles) {
        if (!canPlayerGadgetAffectBody(state.world, player, body)) {
          continue;
        }
        applyGadgetForces(body, player, input, dt);
        drainBodyWithViciousVacuum(state, seedHolder, player, input, body, dt);
      }
      for (const pickup of state.world.techPickups) {
        applyGadgetForces(pickup, player, input, dt, { pickup: true, pullTowardActor: true });
      }
      for (const pickup of state.world.healthPickups) {
        applyGadgetForces(pickup, player, input, dt, { pickup: true });
      }
      for (const beacon of state.world.mobBeacons || []) {
        if (beacon && finiteOr(beacon.health, 0) > 0) {
          if (applyGadgetForces(beacon, player, input, dt, { captureInFunnel: false })) {
            beacon.gadgetForceTimer = 0.18;
          }
        }
      }
      if (isViciousVacuumToolId(input.equippedTool)) {
        for (const mob of allCombatMobs(state.world)) {
          applyViciousVacuumToMob(state, player, input, mob, dt);
        }
      }
    }
    state.seed = seedHolder.seed >>> 0;
  }

  function resolveGadgetBuckets(state, inputs, dt) {
    const players = state.players || {};
    for (const [playerId, player] of Object.entries(players)) {
      if (!player || player.health <= 0 || player.spacecraftInterior || !isSuctionToolId(player.equippedTool)) {
        continue;
      }
      const input = sanitizeInput(inputs[playerId], player, { dt, requireEnergy: true, allowCommittedToolMode: true });
      for (const body of state.world.particles) {
        if (!canPlayerGadgetAffectBody(state.world, player, body)) {
          continue;
        }
        resolveFunnelBucket(body, player, input, dt);
      }
    }
  }
