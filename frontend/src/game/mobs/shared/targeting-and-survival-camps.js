  function nearestHostileMobTarget(source) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of hostileCombatMobs()) {
      if (!mob || mob === source || mob.health <= 0 || isMobSummoning(mob)) {
        continue;
      }
      if (isSurvivalCampMob(mob) && finiteOr(mob.survivalCampAggroTimer, 0) <= 0) {
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

  function familiarEnemyCombatTarget(mob) {
    return {
      local: false,
      remote: null,
      familiarEnemy: true,
      player: mob,
      publicName: mobName(mob)
    };
  }

  function isSurvivalCampMob(mob) {
    return Boolean(
      mob &&
      mob.survivalCampId &&
      !isPlayerTeamMob(mob) &&
      !isHordeModeActive()
    );
  }

  function playerScoredSurvivalCampBodyIds() {
    return typeof connectedScoredBodyIds === "function" ? connectedScoredBodyIds() : new Set();
  }

  function isPlayerScoredSurvivalCampBody(body, scoredBodyIds) {
    const ids = scoredBodyIds || playerScoredSurvivalCampBodyIds();
    return Boolean(body && ids.has(Math.floor(finiteOr(body.id, 0))));
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

  function wakeSurvivalCamp(campId, targetPlayerId, reason, originX, originY) {
    const cleanCampId = String(campId || "");
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!cleanCampId || !cleanTargetPlayerId || isHordeModeActive()) {
      return false;
    }
    const wakeX = finiteOr(originX, 0);
    const wakeY = finiteOr(originY, 0);
    let woken = wakeSurvivalCampStructures(cleanCampId, wakeX, wakeY, cleanTargetPlayerId);
    for (const campMob of hostileCombatMobs()) {
      if (
        !campMob ||
        campMob.survivalCampId !== cleanCampId ||
        campMob.health <= 0 ||
        Math.hypot(campMob.x - wakeX, campMob.y - wakeY) > survivalCampWakeRadius
      ) {
        continue;
      }
      campMob.survivalCampAggroTimer = survivalCampAggroDuration;
      campMob.survivalCampReturning = false;
      campMob.survivalCampOrphanedByAggro = false;
      clearSurvivalCampMigrationState(campMob);
      campMob.survivalTargetPlayerId = cleanTargetPlayerId;
      campMob.survivalCampWakeReason = String(reason || "aggression");
      woken += 1;
    }
    return woken > 0;
  }

  function wakeSurvivalCampFromMob(mob, targetPlayerId) {
    if (!isSurvivalCampMob(mob)) {
      return false;
    }
    return wakeSurvivalCamp(
      mob.survivalCampId,
      targetPlayerId,
      "mob-damaged",
      finiteOr(mob.survivalCampX, mob.x),
      finiteOr(mob.survivalCampY, mob.y)
    );
  }

  function isSurvivalCampStructure(structure) {
    return Boolean(structure && structure.survivalCampId && !isHordeModeActive());
  }

  function wakeSurvivalCampStructures(campId, wakeX, wakeY, targetPlayerId) {
    const cleanCampId = String(campId || "");
    if (!cleanCampId || !Array.isArray(structures)) {
      return 0;
    }

    let woken = 0;
    for (const structure of structures) {
      if (
        !structure ||
        structure.survivalCampId !== cleanCampId ||
        finiteOr(structure.health, 0) <= 0 ||
        Math.hypot(finiteOr(structure.x, wakeX) - wakeX, finiteOr(structure.y, wakeY) - wakeY) > survivalCampWakeRadius
      ) {
        continue;
      }
      structure.survivalCampAggroTimer = survivalCampAggroDuration;
      structure.survivalTargetPlayerId = String(targetPlayerId || "");
      woken += 1;
    }
    return woken;
  }

  function wakeSurvivalCampFromStructure(structure, targetPlayerId) {
    if (!isSurvivalCampStructure(structure)) {
      return false;
    }

    const campId = structure.survivalCampId;
    return wakeSurvivalCamp(
      campId,
      targetPlayerId,
      structure.type === "container" ? "camp-theft" : "structure-damaged",
      finiteOr(structure.survivalCampX, structure.x),
      finiteOr(structure.survivalCampY, structure.y)
    );
  }

  function wakeSurvivalCampFromBody(body, targetPlayerId, options) {
    const allowScoredBody = Boolean(options && options.allowScoredBody);
    if (!body || !body.survivalCampBody || !body.survivalCampId || isHordeModeActive() || (!allowScoredBody && isPlayerScoredSurvivalCampBody(body))) {
      return false;
    }

    const campId = body.survivalCampId;
    return wakeSurvivalCamp(
      campId,
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

  function maybeWakeSurvivalCampFromMovedBody(body) {
    if (!body || !body.survivalCampBody || !body.survivalCampMovedByPlayer || body.survivalCampBodyMovedWakeSent || isPlayerScoredSurvivalCampBody(body)) {
      return false;
    }
    const home = ensureSurvivalCampBodyHome(body);
    if (!home || Math.hypot(finiteOr(body.x, home.x) - home.x, finiteOr(body.y, home.y) - home.y) < survivalCampBodyWakeDistance) {
      return false;
    }
    body.survivalCampBodyMovedWakeSent = true;
    return wakeSurvivalCampFromBody(body, body.survivalCampLastMoverPlayerId || "");
  }

  function survivalCampAnchorPoint(campId, fallbackX, fallbackY) {
    const cleanCampId = String(campId || "");
    if (!cleanCampId) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }

    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    const scoredBodyIds = playerScoredSurvivalCampBodyIds();
    for (const body of particles) {
      if (!body || !body.survivalCampBody || body.survivalCampId !== cleanCampId || isPlayerScoredSurvivalCampBody(body, scoredBodyIds)) {
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

  function nearestSurvivalCampAnchor(campId, x, y) {
    const ignoredCampId = String(campId || "");
    const camps = new Map();
    const scoredBodyIds = playerScoredSurvivalCampBodyIds();
    for (const body of particles) {
      if (!body || !body.survivalCampBody || !body.survivalCampId || body.survivalCampId === ignoredCampId || isPlayerScoredSurvivalCampBody(body, scoredBodyIds)) {
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
    Object.assign(mob, {
      survivalMigrationCampId: "",
      survivalMigrationCampX: Number.NaN,
      survivalMigrationCampY: Number.NaN,
      survivalMigrationStraightTime: 0,
      survivalMigrationDirX: 0,
      survivalMigrationDirY: 0
    });
  }

  function isSurvivalMigratingMob(mob) {
    return Boolean(
      mob &&
      !isPlayerTeamMob(mob) &&
      !isHordeModeActive() &&
      (mob.survivalEncounterType === "migration" || mob.survivalEncounterType === "salvage" || (!mob.survivalCampId && mob.survivalMigrationCampId))
    );
  }

  function nearbySurvivalMigrationTarget(mob) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const target of collectCombatPlayerTargets()) {
      if (!target || !target.player || target.player.health <= 0) continue;
      const distance = Math.hypot(target.player.x - mob.x, target.player.y - mob.y);
      if (distance <= survivalMigrationAggroRadius && distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function survivalTargetPlayerId(target) {
    return target && target.local
      ? String(player.id || "")
      : String(target && target.remote && target.remote.playerId || target && target.player && target.player.id || "");
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

  function survivalCampMigrationTarget(mob) {
    const migrationCampId = String(mob && mob.survivalMigrationCampId || "");
    if (migrationCampId) {
      const anchor = survivalCampAnchorPoint(migrationCampId, finiteOr(mob.survivalMigrationCampX, mob.x), finiteOr(mob.survivalMigrationCampY, mob.y));
      if (anchor.hasCampBody) {
        return { campId: migrationCampId, x: anchor.x, y: anchor.y };
      }
    }
    return nearestSurvivalCampAnchor(mob.survivalCampId, mob.x, mob.y);
  }

  function updateOrphanedSurvivalCampMobMigration(mob, dt) {
    const targetCamp = survivalCampMigrationTarget(mob);
    if (!targetCamp) {
      mob.survivalCampId = "";
      mob.survivalEncounterType = "migration";
      mob.survivalEncounterId = "";
      clearSurvivalCampMigrationState(mob);
      return true;
    }

    Object.assign(mob, { survivalMigrationCampId: targetCamp.campId, survivalMigrationCampX: targetCamp.x, survivalMigrationCampY: targetCamp.y });
    mob.survivalCampReturning = true;
    mob.survivalCampAggroTimer = 0;
    mob.survivalTargetPlayerId = "";
    mob.survivalCampOrphanedByAggro = false;

    const dx = targetCamp.x - mob.x;
    const dy = targetCamp.y - mob.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = Math.hypot(finiteOr(mob.vx, 0), finiteOr(mob.vy, 0));
    if (distance <= survivalCampIdleRadius * 0.58 && speed < 130) {
      mob.survivalCampId = targetCamp.campId;
      mob.survivalCampX = targetCamp.x;
      mob.survivalCampY = targetCamp.y;
      mob.survivalCampReturning = false;
      mob.survivalCampSlotAngle = Math.atan2(finiteOr(mob.y, targetCamp.y) - targetCamp.y, finiteOr(mob.x, targetCamp.x) - targetCamp.x);
      mob.survivalCampSlotRadius = clamp(distance, 120, survivalCampIdleRadius);
      mob.survivalEncounterType = "camp";
      mob.survivalEncounterId = targetCamp.campId;
      const resident = hostileCombatMobs().find((candidate) => candidate && candidate !== mob && candidate.health > 0 && candidate.survivalCampId === targetCamp.campId);
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
    const cruiseSpeed = 250 + (survivalMigrationMaxSpeed - 250) * momentum;
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

  function updateSurvivalCampMobHome(mob, dt) {
    if (mob && mob.survivalEncounterType === "salvage" && mob.survivalSalvageBodyId) {
      return false;
    }

    const campMob = isSurvivalCampMob(mob);
    const migratingMob = isSurvivalMigratingMob(mob) || Boolean(mob && !isPlayerTeamMob(mob) && !isHordeModeActive() && !mob.survivalCampId && mob.survivalEncounterType !== "hit-squad");
    if (!campMob && !migratingMob) return false;

    mob.survivalCampAggroTimer = Math.max(0, finiteOr(mob.survivalCampAggroTimer, 0) - dt);
    if (!campMob) {
      mob.survivalEncounterType = "migration";
      const nearbyTarget = nearbySurvivalMigrationTarget(mob);
      if (nearbyTarget) {
        mob.survivalCampAggroTimer = survivalMigrationAggroDuration;
        mob.survivalTargetPlayerId = survivalTargetPlayerId(nearbyTarget);
      }
      if (mob.survivalCampAggroTimer > 0 && mob.survivalTargetPlayerId) {
        return false;
      }
      mob.survivalTargetPlayerId = "";
      return updateOrphanedSurvivalCampMobMigration(mob, dt);
    }
    let campAnchor = survivalCampAnchorPoint(mob.survivalCampId, finiteOr(mob.survivalCampX, mob.x), finiteOr(mob.survivalCampY, mob.y));
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
      if (updateOrphanedSurvivalCampMobMigration(mob, dt)) {
        return true;
      }
      return false;
    }
    const campX = campAnchor.x;
    const campY = campAnchor.y;
    mob.survivalCampX = campX;
    mob.survivalCampY = campY;
    const leashRadius = Math.max(600, finiteOr(mob.survivalCampLeashRadius, survivalCampLeashRadius));
    const homeDx = campX - mob.x;
    const homeDy = campY - mob.y;
    const homeDistance = Math.hypot(homeDx, homeDy);

    if (mob.survivalCampAggroTimer > 0) {
      return false;
    }

    if (homeDistance > leashRadius || mob.survivalCampAggroTimer <= 0) {
      mob.survivalCampAggroTimer = 0;
      mob.survivalCampReturning = homeDistance > survivalCampReturnRadius;
      if (mob.survivalEncounterType === "camp") {
        mob.survivalTargetPlayerId = "";
      }
      clearSurvivalCampAttackState(mob);
    }

    const time = performance.now() * 0.001;
    const slotAngle = finiteOr(mob.survivalCampSlotAngle, finiteOr(mob.wobble, 0)) + Math.sin(time * 0.16 + finiteOr(mob.wobble, 0)) * 0.18;
    const slotRadius = clamp(finiteOr(mob.survivalCampSlotRadius, survivalCampIdleRadius * 0.65), 120, survivalCampIdleRadius);
    const targetX = campX + Math.cos(slotAngle) * slotRadius;
    const targetY = campY + Math.sin(slotAngle) * slotRadius;
    const toTargetX = targetX - mob.x;
    const toTargetY = targetY - mob.y;
    const targetDistance = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / targetDistance;
    const ny = toTargetY / targetDistance;
    const tangentX = -ny * finiteOr(mob.strafeSign, 1);
    const tangentY = nx * finiteOr(mob.strafeSign, 1);
    const returnForce = homeDistance > survivalCampReturnRadius ? 176 : targetDistance > 120 ? 92 : 22;
    const strafeForce = targetDistance < 240 ? 48 : 18;

    mob.vx += nx * returnForce * dt + tangentX * strafeForce * dt;
    mob.vy += ny * returnForce * dt + tangentY * strafeForce * dt;
    mob.vx += Math.sin(time * 0.7 + finiteOr(mob.wobble, 0)) * 9 * dt;
    mob.vy += Math.cos(time * 0.63 + finiteOr(mob.wobble, 0)) * 9 * dt;
    mob.vx *= Math.pow(homeDistance > survivalCampReturnRadius ? 0.76 : 0.62, dt);
    mob.vy *= Math.pow(homeDistance > survivalCampReturnRadius ? 0.76 : 0.62, dt);

    const speed = Math.hypot(mob.vx, mob.vy);
    const maxSpeed = homeDistance > survivalCampReturnRadius ? 250 : 118;
    if (speed > maxSpeed) {
      mob.vx = (mob.vx / speed) * maxSpeed;
      mob.vy = (mob.vy / speed) * maxSpeed;
    }

    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    if (homeDistance <= survivalCampReturnRadius * 0.72) {
      mob.survivalCampReturning = false;
    }
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
    return true;
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

  function survivalCampCombatTarget(mob) {
    const targetId = String(mob && mob.survivalTargetPlayerId || "");
    if (!targetId || isHordeModeActive() || typeof collectCombatPlayerTargets !== "function") {
      return null;
    }
    for (const target of collectCombatPlayerTargets()) {
      const playerId = target && target.local
        ? String(player.id || "")
        : String(target && target.remote && target.remote.playerId || target && target.player && target.player.id || "");
      if (playerId === targetId && target.player && target.player.health > 0) {
        return target;
      }
    }
    return null;
  }

  function combatTargetForMob(mob) {
    if (isPlayerTeamMob(mob)) {
      if (activeFamiliarCommand(mob)) {
        return null;
      }
      const target = nearestHostileMobTarget(mob);
      return target ? familiarEnemyCombatTarget(target.mob) : null;
    }
    if (mob && mob.survivalEncounterType === "hit-squad") {
      return null;
    }
    if (mob && (isSurvivalCampMob(mob) || isSurvivalMigratingMob(mob))) {
      if (finiteOr(mob.survivalCampAggroTimer, 0) <= 0) {
        return null;
      }
      if (!mob.survivalTargetPlayerId) {
        return null;
      }
      return survivalCampCombatTarget(mob);
    }
    return nearestCombatPlayerTarget(mob.x, mob.y);
  }
