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
      if (isSurvivalCampMob({ world, gameMode: world && world.gameMode }, mob) && !["engage", "revenge"].includes(String(mob.survivalAiState || ""))) {
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
      damageMob(state, enemy, FAMILIAR_DAMAGE_PER_SECOND * dt * 6.5, "familiar", { playerId: mob.familiarOwnerPlayerId || "", cause: "familiar", hostileActionType: "familiar-attack" });
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

  function isSurvivalLogisticsUfo(state, mob) {
    return Boolean(
      state &&
      mob &&
      mob.kind === "ufo" &&
      !isPlayerTeamMob(mob) &&
      !isHordeGameMode(state.gameMode || state.world && state.world.gameMode) &&
      (
        mob.survivalCampId ||
        mob.survivalEncounterType === "camp" ||
        mob.survivalEncounterType === "migration" ||
        mob.survivalEncounterType === "salvage" ||
        mob.survivalMigrationCampId
      )
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

  function isMobOwnedStructure(structure) {
    const ownerPlayerId = String(structure && structure.ownerPlayerId || "");
    return Boolean(structure && (structure.survivalCampId || ownerPlayerId.startsWith("survival-camp:")));
  }

  function isSurvivalCampAttackingStructure(structure) {
    return Boolean(structure && (structure.type === "turret" || structure.type === "missile-launcher"));
  }

  function survivalCampControllerForStructure(state, structure) {
    if (!isSurvivalCampStructure(state, structure)) {
      return null;
    }
    return survivalEngagementStore(state)[String(structure.survivalCampId || "")] || null;
  }

  const survivalCampSpatialCaches = new WeakMap();

  function buildPlayerScoredSurvivalCampBodyIds(state) {
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

  function currentSurvivalCampSpatialCache(state) {
    const tick = Math.max(0, Math.floor(finiteOr(state && state.tick, 0)));
    const existing = state && survivalCampSpatialCaches.get(state);
    if (existing && existing.tick === tick) return existing;
    const scoredBodyIds = buildPlayerScoredSurvivalCampBodyIds(state);
    const bodiesByCamp = new Map();
    const anchorsByCamp = new Map();
    for (const body of state && state.world && state.world.particles || []) {
      const campId = String(body && body.survivalCampId || "");
      if (!body || !body.survivalCampBody || !campId || scoredBodyIds.has(Math.floor(finiteOr(body.id, 0)))) continue;
      const campBodies = bodiesByCamp.get(campId) || [];
      campBodies.push(body);
      bodiesByCamp.set(campId, campBodies);
      const anchor = anchorsByCamp.get(campId) || { weightedX: 0, weightedY: 0, totalWeight: 0 };
      const weight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      anchor.weightedX += finiteOr(body.x, 0) * weight;
      anchor.weightedY += finiteOr(body.y, 0) * weight;
      anchor.totalWeight += weight;
      anchorsByCamp.set(campId, anchor);
    }
    const cache = { tick, scoredBodyIds, bodiesByCamp, anchorsByCamp };
    if (state) survivalCampSpatialCaches.set(state, cache);
    return cache;
  }

  function playerScoredSurvivalCampBodyIds(state) {
    return currentSurvivalCampSpatialCache(state).scoredBodyIds;
  }

  function survivalCampBodiesForId(state, campId) {
    return currentSurvivalCampSpatialCache(state).bodiesByCamp.get(String(campId || "")) || [];
  }

  function isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds) {
    const ids = scoredBodyIds || playerScoredSurvivalCampBodyIds(state);
    return Boolean(body && ids.has(Math.floor(finiteOr(body.id, 0))));
  }

  function survivalMobKey(mob) {
    return String(mob && mob.kind || "mob") + ":" + String(mob && mob.id || 0);
  }

  function survivalEngagementStore(state) {
    const spawnState = ensureSurvivalSpawnState(state.world);
    if (!spawnState.engagements || typeof spawnState.engagements !== "object") spawnState.engagements = {};
    return spawnState.engagements;
  }

  function survivalPartyIdForPlayer(state, player) {
    const playerId = String(player && player.id || "");
    if (!playerId) return "";
    const teamId = String(player && player.teamId || "");
    return state.worldMode === "shared-public"
      ? teamId ? "team:" + teamId : "player:" + playerId
      : "room-party";
  }

  function survivalCampFixedHome(state, campId, fallbackX, fallbackY) {
    let x = 0;
    let y = 0;
    let weight = 0;
    for (const body of state.world.particles || []) {
      if (!body || !body.survivalCampBody || body.survivalCampId !== campId) continue;
      const home = ensureSurvivalCampBodyHome(body);
      const bodyWeight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      x += finiteOr(home && home.x, fallbackX) * bodyWeight;
      y += finiteOr(home && home.y, fallbackY) * bodyWeight;
      weight += bodyWeight;
    }
    return weight > 0 ? { x: x / weight, y: y / weight } : { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0) };
  }

  function ensureSurvivalCampController(state, campId, fallbackX, fallbackY) {
    const cleanCampId = String(campId || "");
    if (!cleanCampId) return null;
    const store = survivalEngagementStore(state);
    let controller = store[cleanCampId];
    if (!controller || typeof controller !== "object") {
      const home = survivalCampFixedHome(state, cleanCampId, fallbackX, fallbackY);
      controller = store[cleanCampId] = {
        campId: cleanCampId,
        homeX: home.x,
        homeY: home.y,
        phase: "guard",
        primaryPartyId: "",
        primaryAggressorId: "",
        hostileParties: {},
        squadIds: [],
        reserveIds: [],
        engagedAt: 0,
        targetLostAt: 0,
        destroyedAt: 0
      };
    }
    return controller;
  }

  function survivalRoleForMob(mob, engineerAssigned) {
    if (mob.kind === "ufo") return "logistics";
    if (mob.kind === "engineer" && !engineerAssigned) return "support";
    if (mob.kind === "rambot") return "assault";
    if (mob.kind === "fighter" || mob.kind === "rocket") return "interceptor";
    return "ranged";
  }

  function syncSurvivalCampSquad(state, controller) {
    const members = allCombatMobs(state.world)
      .filter((mob) => mob && mob.health > 0 && mob.survivalCampId === controller.campId && !isPlayerTeamMob(mob))
      .sort((a, b) => survivalMobKey(a).localeCompare(survivalMobKey(b)));
    const combatMembers = members.filter((mob) => mob.kind !== "ufo");
    controller.squadIds = combatMembers.map(survivalMobKey);
    controller.reserveIds = [];
    let engineerAssigned = false;
    for (const mob of members) {
      const role = survivalRoleForMob(mob, engineerAssigned);
      if (role === "support") engineerAssigned = true;
      mob.survivalAiRole = role;
      if (role === "logistics") {
        mob.survivalAiState = mob.survivalSalvageBodyId ? "salvage" : "guard";
        mob.survivalTargetPlayerId = "";
        mob.survivalTargetEntityId = "";
        mob.survivalTargetPartyId = "";
        continue;
      }
      if (controller.phase === "engage" || controller.phase === "revenge") mob.survivalAiState = controller.phase;
    }
  }

  function recordSurvivalHostileAction(state, campId, targetPlayerId, hostileActionType, originX, originY, threat) {
    const player = state.players && state.players[String(targetPlayerId || "")];
    const partyId = survivalPartyIdForPlayer(state, player);
    const controller = ensureSurvivalCampController(state, campId, originX, originY);
    if (!controller || !partyId) return false;
    const now = simTime(state);
    const newlyAggroed = !["engage", "revenge"].includes(controller.phase);
    const party = controller.hostileParties[partyId] || { threat: 0, players: {}, lastHostileAt: 0 };
    party.threat = Math.max(0, finiteOr(party.threat, 0)) + Math.max(1, finiteOr(threat, 1));
    party.players[String(targetPlayerId)] = Math.max(0, finiteOr(party.players[String(targetPlayerId)], 0)) + Math.max(1, finiteOr(threat, 1));
    party.lastHostileAt = now;
    party.hostileActionType = String(hostileActionType || "attack");
    controller.hostileParties[partyId] = party;
    const currentThreat = finiteOr(controller.hostileParties[controller.primaryPartyId] && controller.hostileParties[controller.primaryPartyId].threat, 0);
    if (!controller.primaryPartyId || partyId === controller.primaryPartyId || party.threat >= currentThreat * SURVIVAL_TARGET_SWITCH_THREAT_RATIO) controller.primaryPartyId = partyId;
    controller.primaryAggressorId = String(targetPlayerId || "");
    controller.phase = "engage";
    controller.engagedAt = now;
    controller.targetLostAt = 0;
    syncSurvivalCampSquad(state, controller);
    if (newlyAggroed) {
      for (const mob of allCombatMobs(state.world)) {
        if (mob && mob.health > 0 && mob.survivalCampId === controller.campId) mob.survivalAggroAlertTimer = SURVIVAL_AGGRO_ALERT_DURATION;
      }
    }
    return controller.squadIds.length > 0;
  }

  function wakeSurvivalCampStructures(state, campId, wakeX, wakeY, targetPlayerId, showAggroAlert) {
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
      if (showAggroAlert && isSurvivalCampAttackingStructure(structure)) {
        structure.survivalAggroAlertTimer = SURVIVAL_AGGRO_ALERT_DURATION;
      }
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
    const controller = ensureSurvivalCampController(state, cleanCampId, wakeX, wakeY);
    const newlyAggroed = Boolean(controller && !["engage", "revenge"].includes(controller.phase));
    if (!recordSurvivalHostileAction(state, cleanCampId, cleanTargetPlayerId, reason, wakeX, wakeY, 10)) return false;
    let woken = wakeSurvivalCampStructures(state, cleanCampId, wakeX, wakeY, cleanTargetPlayerId, newlyAggroed);
    for (const campMob of allCombatMobs(world)) {
      if (
        !campMob ||
        campMob.survivalCampId !== cleanCampId ||
        campMob.health <= 0 ||
        isPlayerTeamMob(campMob)
      ) {
        continue;
      }
      if (campMob.kind === "ufo") {
        campMob.survivalAiState = campMob.survivalSalvageBodyId ? "salvage" : "guard";
        campMob.survivalTargetPlayerId = "";
        campMob.survivalTargetEntityId = "";
        campMob.survivalTargetPartyId = "";
        continue;
      }
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
    if (mob.kind === "ufo") {
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

    if (isSurvivalLogisticsUfo(state, damagedMob)) {
      damagedMob.playerDamageAggroTimer = 0;
      damagedMob.playerDamageAggroTargetPlayerId = "";
      damagedMob.survivalTargetPlayerId = "";
      return false;
    }
    if (isSurvivalCampMob(state, damagedMob)) return wakeSurvivalCampFromMob(state, damagedMob, cleanTargetPlayerId);
    if (isSurvivalMigratingMob(state, damagedMob)) {
      if (damagedMob.survivalAiState !== "migrant-skirmish") damagedMob.survivalAggroAlertTimer = SURVIVAL_AGGRO_ALERT_DURATION;
      damagedMob.survivalAiState = "migrant-skirmish";
      damagedMob.survivalTargetPlayerId = cleanTargetPlayerId;
      return true;
    }
    damagedMob.playerDamageAggroTimer = SURVIVAL_CAMP_AGGRO_DURATION;
    damagedMob.playerDamageAggroTargetPlayerId = cleanTargetPlayerId;
    return true;
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
    if (
      !state ||
      !body ||
      !body.survivalCampBody ||
      !body.survivalCampId ||
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
    if (!body) {
      return;
    }
    const controllingPlayerId = String(playerId || "");
    body.lastControllingPlayerId = controllingPlayerId;
    body.lastPlayerControlBelowSpeedAt = 0;
    if (!body.survivalCampBody) return;
    ensureSurvivalCampBodyHome(body);
    body.survivalCampMovedByPlayer = true;
    body.survivalCampLastMoverPlayerId = controllingPlayerId;
  }

  function maybeWakeSurvivalCampFromMovedBody(state, body) {
    if (body && body.lastControllingPlayerId) controllingPlayerIdForBody(state, body);
    if (!body || !body.survivalCampBody || !body.survivalCampMovedByPlayer || body.survivalCampBodyMovedWakeSent) {
      return false;
    }
    const home = ensureSurvivalCampBodyHome(body);
    if (!home || Math.hypot(finiteOr(body.x, home.x) - home.x, finiteOr(body.y, home.y) - home.y) < SURVIVAL_CAMP_BODY_WAKE_DISTANCE) {
      return false;
    }
    const alerted = wakeSurvivalCampFromBody(state, body, body.survivalCampLastMoverPlayerId || "", { allowScoredBody: true });
    if (alerted) body.survivalCampBodyMovedWakeSent = true;
    return alerted;
  }

  function controllingPlayerIdForBody(state, body) {
    if (!body) return "";
    const speed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
    const now = simTime(state);
    if (body.lastControllingPlayerId) {
      if (speed >= SOLID_BODY_DAMAGE_SPEED) body.lastPlayerControlBelowSpeedAt = 0;
      else {
        body.lastPlayerControlBelowSpeedAt = finiteOr(body.lastPlayerControlBelowSpeedAt, 0) || now;
        if (now - body.lastPlayerControlBelowSpeedAt >= SURVIVAL_BODY_PROVENANCE_TIMEOUT) body.lastControllingPlayerId = "";
      }
    }
    return String(body.lastControllingPlayerId || playerIdForScoredBody(state, body) || "");
  }

  function survivalRambotDefenseTarget(state, mob) {
    if (!isSurvivalCampMob(state, mob) || mob.kind !== "rambot") {
      return null;
    }

    let best = null;
    let bestScore = Infinity;
    const campBodies = survivalCampBodiesForId(state, mob.survivalCampId);
    for (const protectedBody of campBodies) {
      const protectedMass = Math.max(1, finiteOr(protectedBody.mass, 1));
      const protectedRadius = solidContactRadius(protectedBody);
      for (const body of state.world.particles || []) {
        if (
          !body ||
          body === protectedBody ||
          !body.tier ||
          !body.tier.solid ||
          body.survivalCampId === mob.survivalCampId ||
          finiteOr(body.mass, 0) < protectedMass
        ) {
          continue;
        }
        const playerId = controllingPlayerIdForBody(state, body);
        if (!playerId) {
          continue;
        }

        const relativeX = finiteOr(body.x, 0) - finiteOr(protectedBody.x, 0);
        const relativeY = finiteOr(body.y, 0) - finiteOr(protectedBody.y, 0);
        const distance = Math.hypot(relativeX, relativeY) || 1;
        const contactDistance = solidContactRadius(body) + protectedRadius;
        if (distance - contactDistance > SURVIVAL_RAMBOT_DEFENSE_SCAN_RADIUS) {
          continue;
        }

        const velocityX = finiteOr(body.vx, 0) - finiteOr(protectedBody.vx, 0);
        const velocityY = finiteOr(body.vy, 0) - finiteOr(protectedBody.vy, 0);
        const closingSpeed = -(relativeX * velocityX + relativeY * velocityY) / distance;
        if (closingSpeed < SURVIVAL_RAMBOT_DEFENSE_MIN_CLOSING_SPEED) {
          continue;
        }
        const velocitySquared = velocityX * velocityX + velocityY * velocityY;
        const timeToClosest = clamp(
          -(relativeX * velocityX + relativeY * velocityY) / Math.max(1, velocitySquared),
          0,
          SURVIVAL_RAMBOT_DEFENSE_LOOKAHEAD
        );
        const closestX = relativeX + velocityX * timeToClosest;
        const closestY = relativeY + velocityY * timeToClosest;
        const closestDistance = Math.hypot(closestX, closestY);
        if (closestDistance > contactDistance + SURVIVAL_RAMBOT_DEFENSE_PATH_PADDING) {
          continue;
        }

        const score = timeToClosest * 180 + Math.max(0, distance - contactDistance);
        if (score >= bestScore) {
          continue;
        }
        bestScore = score;
        best = {
          survivalDefenseBody: true,
          body,
          protectedBody,
          playerId,
          id: "defense-body:" + String(body.id || 0),
          x: finiteOr(body.x, 0),
          y: finiteOr(body.y, 0),
          vx: finiteOr(body.vx, 0),
          vy: finiteOr(body.vy, 0),
          radius: solidContactRadius(body),
          health: 1
        };
      }
    }
    return best;
  }

  function survivalCampAnchorPoint(state, campId, fallbackX, fallbackY) {
    const world = state && state.world;
    const cleanCampId = String(campId || "");
    if (!world || !Array.isArray(world.particles) || !cleanCampId) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }

    const anchor = currentSurvivalCampSpatialCache(state).anchorsByCamp.get(cleanCampId);
    if (!anchor || anchor.totalWeight <= 0) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }
    return {
      x: anchor.weightedX / anchor.totalWeight,
      y: anchor.weightedY / anchor.totalWeight,
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
    const activeCampIds = new Set(allCombatMobs(world).filter((mob) => mob && mob.health > 0 && mob.survivalCampId).map((mob) => String(mob.survivalCampId)));
    const scoredBodyIds = playerScoredSurvivalCampBodyIds(state);
    for (const body of world.particles) {
      if (!body || !body.survivalCampBody || !body.survivalCampId || !activeCampIds.has(String(body.survivalCampId)) || body.survivalCampId === ignoredCampId || isPlayerScoredSurvivalCampBody(state, body, scoredBodyIds)) {
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
      mob.survivalAiState = "migrate";
      if (Math.hypot(finiteOr(mob.survivalMigrationDirX, 0), finiteOr(mob.survivalMigrationDirY, 0)) < 0.5) {
        const angle = finiteOr(mob.wobble, 0) + finiteOr(mob.id, 0) * 0.73;
        mob.survivalMigrationDirX = Math.cos(angle);
        mob.survivalMigrationDirY = Math.sin(angle);
      }
      mob.vx += mob.survivalMigrationDirX * 150 * dt;
      mob.vy += mob.survivalMigrationDirY * 150 * dt;
      mob.vx *= Math.pow(0.9, dt);
      mob.vy *= Math.pow(0.9, dt);
      const speed = Math.hypot(mob.vx, mob.vy);
      if (speed > 340) {
        mob.vx = mob.vx / speed * 340;
        mob.vy = mob.vy / speed * 340;
      }
      mob.x += mob.vx * dt;
      mob.y += mob.vy * dt;
      mob.rotation = Math.atan2(mob.vy, mob.vx) + Math.PI / 2;
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
      mergeArrivingSurvivalCampMob(state, mob, targetCamp.campId);
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
    const travelForce = 190 + momentum * 240;
    mob.vx += nx * travelForce * dt;
    mob.vy += ny * travelForce * dt;
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

  let survivalSeparationTick = -1;
  let survivalSeparationBuckets = new Map();

  function survivalMobSeparation(state, mob) {
    const cellSize = 180;
    if (survivalSeparationTick !== state.tick) {
      survivalSeparationTick = state.tick;
      survivalSeparationBuckets = new Map();
      for (const candidate of allCombatMobs(state.world)) {
        if (!candidate || candidate.health <= 0 || isPlayerTeamMob(candidate)) continue;
        const key = Math.floor(candidate.x / cellSize) + ":" + Math.floor(candidate.y / cellSize);
        const bucket = survivalSeparationBuckets.get(key) || [];
        bucket.push(candidate);
        survivalSeparationBuckets.set(key, bucket);
      }
    }
    const cx = Math.floor(mob.x / cellSize);
    const cy = Math.floor(mob.y / cellSize);
    let x = 0;
    let y = 0;
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        for (const other of survivalSeparationBuckets.get((cx + ox) + ":" + (cy + oy)) || []) {
          if (other === mob) continue;
          const dx = mob.x - other.x;
          const dy = mob.y - other.y;
          const distance = Math.hypot(dx, dy) || 1;
          const desired = Math.max(92, finiteOr(mob.radius, 28) + finiteOr(other.radius, 28) + 42);
          if (distance >= desired) continue;
          const strength = (desired - distance) / desired;
          x += dx / distance * strength;
          y += dy / distance * strength;
        }
      }
    }
    return { x, y };
  }

  function survivalGuardPost(state, mob, controller) {
    const campBodies = survivalCampBodiesForId(state, controller.campId);
    const members = allCombatMobs(state.world)
      .filter((candidate) => candidate && candidate.health > 0 && candidate.survivalCampId === controller.campId)
      .sort((a, b) => survivalMobKey(a).localeCompare(survivalMobKey(b)));
    const index = Math.max(0, members.indexOf(mob));
    if (mob.kind !== "ufo" && campBodies.length) {
      const body = campBodies[index % campBodies.length];
      const angle = finiteOr(mob.survivalCampSlotAngle, -Math.PI / 2 + index * Math.PI * (3 - Math.sqrt(5)));
      const patrolOffset = finiteOr(mob.radius, 28) + 100 + Math.floor(index / campBodies.length) % 3 * 55;
      const radius = finiteOr(body.radius, 0) + patrolOffset;
      return { x: body.x + Math.cos(angle) * radius, y: body.y + Math.sin(angle) * radius };
    }
    let collisionEnvelope = 130;
    for (const body of campBodies) {
      collisionEnvelope = Math.max(collisionEnvelope, Math.hypot(body.x - controller.homeX, body.y - controller.homeY) + finiteOr(body.radius, 0) + finiteOr(mob.radius, 28) + 100);
    }
    if (!(finiteOr(mob.survivalCampSlotRadius, 0) > 0)) {
      mob.survivalCampSlotAngle = -Math.PI / 2 + index * Math.PI * (3 - Math.sqrt(5));
      mob.survivalCampSlotRadius = Math.max(collisionEnvelope, SURVIVAL_CAMP_IDLE_RADIUS * (0.58 + (index % 3) * 0.1));
    }
    const angle = finiteOr(mob.survivalCampSlotAngle, finiteOr(mob.wobble, 0));
    const radius = Math.max(collisionEnvelope, finiteOr(mob.survivalCampSlotRadius, SURVIVAL_CAMP_IDLE_RADIUS * 0.65));
    return { x: controller.homeX + Math.cos(angle) * radius, y: controller.homeY + Math.sin(angle) * radius };
  }

  function survivalCampBodySurfaceDistance(state, mob, campId) {
    let nearest = Infinity;
    for (const body of survivalCampBodiesForId(state, campId)) {
      nearest = Math.min(nearest, Math.max(0, Math.hypot(body.x - mob.x, body.y - mob.y) - finiteOr(body.radius, 0)));
    }
    return nearest;
  }

  function steerSurvivalMobArrival(state, mob, goal, dt, returning) {
    const dx = goal.x - mob.x;
    const dy = goal.y - mob.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const desiredSpeed = returning ? clamp(distance * 0.72, 0, 270) : clamp(distance * 0.65, 0, 150);
    const steer = clamp(dt * (returning ? 3.6 : 4.8), 0, 1);
    const separation = survivalMobSeparation(state, mob);
    mob.vx += (nx * desiredSpeed - mob.vx) * steer + separation.x * 120 * dt;
    mob.vy += (ny * desiredSpeed - mob.vy) * steer + separation.y * 120 * dt;
    if (distance < 24) {
      mob.vx *= Math.pow(0.08, dt);
      mob.vy *= Math.pow(0.08, dt);
    }
    const previousDistance = finiteOr(mob.survivalGoalDistance, distance + 1);
    mob.survivalGoalProgressTimer = distance < previousDistance - 2 ? 0 : finiteOr(mob.survivalGoalProgressTimer, 0) + dt;
    if (mob.survivalGoalProgressTimer >= 1) {
      mob.survivalGoalProgressTimer = 0;
      mob.survivalReplanCount = Math.max(0, Math.floor(finiteOr(mob.survivalReplanCount, 0))) + 1;
      mob.survivalCampSlotAngle = finiteOr(mob.survivalCampSlotAngle, 0) + Math.PI * (0.37 + (mob.id % 5) * 0.07);
    }
    mob.survivalGoalDistance = distance;
    mob.survivalGoalX = goal.x;
    mob.survivalGoalY = goal.y;
    mob.x += mob.vx * dt;
    mob.y += mob.vy * dt;
    if (mob.kind !== "ufo" && mob.survivalCampId) {
      for (const body of state.world.particles || []) {
        if (!body || !body.survivalCampBody || body.survivalCampId !== mob.survivalCampId || isPlayerScoredSurvivalCampBody(state, body)) continue;
        const dxFromBody = mob.x - body.x;
        const dyFromBody = mob.y - body.y;
        const distanceFromBody = Math.hypot(dxFromBody, dyFromBody);
        const minimumDistance = finiteOr(body.radius, 0) + finiteOr(mob.radius, 28) + 70;
        if (distanceFromBody >= minimumDistance) continue;
        const fallbackAngle = finiteOr(mob.survivalCampSlotAngle, 0);
        const outwardX = distanceFromBody > 0.001 ? dxFromBody / distanceFromBody : Math.cos(fallbackAngle);
        const outwardY = distanceFromBody > 0.001 ? dyFromBody / distanceFromBody : Math.sin(fallbackAngle);
        mob.x = body.x + outwardX * minimumDistance;
        mob.y = body.y + outwardY * minimumDistance;
        const inwardSpeed = mob.vx * outwardX + mob.vy * outwardY;
        if (inwardSpeed < 0) {
          mob.vx -= outwardX * inwardSpeed;
          mob.vy -= outwardY * inwardSpeed;
        }
      }
    }
    mob.rotation = Math.atan2(mob.vy || ny, mob.vx || nx) + Math.PI / 2;
  }

  function applySurvivalPredictiveBodyAvoidance(state, mob, goal, dt) {
    if (!mob || !goal || !Number.isFinite(goal.x) || !Number.isFinite(goal.y)) return;
    const goalDx = goal.x - mob.x;
    const goalDy = goal.y - mob.y;
    const goalDistance = Math.hypot(goalDx, goalDy);
    if (goalDistance < 1) return;
    const forwardX = goalDx / goalDistance;
    const forwardY = goalDy / goalDistance;
    const scanDistance = Math.min(goalDistance, 760);
    let obstruction = null;
    for (const body of state.world.particles || []) {
      if (!body || !body.tier || !body.tier.solid || body === mob) continue;
      const bodyDx = finiteOr(body.x, 0) - mob.x;
      const bodyDy = finiteOr(body.y, 0) - mob.y;
      const along = bodyDx * forwardX + bodyDy * forwardY;
      if (along <= 0 || along > scanDistance) continue;
      const lateral = bodyDx * -forwardY + bodyDy * forwardX;
      const clearance = Math.abs(lateral) - solidContactRadius(body) - finiteOr(mob.radius, 28);
      if (clearance >= 130 || obstruction && clearance >= obstruction.clearance) continue;
      obstruction = { body, lateral, clearance };
    }
    if (!obstruction) {
      mob.survivalAvoidingBodyId = null;
      return;
    }
    const side = Math.abs(obstruction.lateral) > 8
      ? (obstruction.lateral > 0 ? -1 : 1)
      : ((Math.floor(finiteOr(mob.id, 0)) & 1) ? -1 : 1);
    const bodyRadius = solidContactRadius(obstruction.body);
    const waypointX = obstruction.body.x + forwardX * Math.min(120, bodyRadius * 0.35) + -forwardY * side * (bodyRadius + finiteOr(mob.radius, 28) + 150);
    const waypointY = obstruction.body.y + forwardY * Math.min(120, bodyRadius * 0.35) + forwardX * side * (bodyRadius + finiteOr(mob.radius, 28) + 150);
    const waypointDx = waypointX - mob.x;
    const waypointDy = waypointY - mob.y;
    const waypointDistance = Math.hypot(waypointDx, waypointDy) || 1;
    const steer = clamp(dt * 6, 0, 1);
    mob.vx += (waypointDx / waypointDistance * 245 - mob.vx) * steer;
    mob.vy += (waypointDy / waypointDistance * 245 - mob.vy) * steer;
    mob.survivalAvoidingBodyId = obstruction.body.id;
    mob.survivalGoalX = waypointX;
    mob.survivalGoalY = waypointY;
  }

  function survivalTargetsForController(state, controller) {
    const targets = [];
    const engagedMembers = allCombatMobs(state.world).filter((mob) => mob && mob.health > 0 && mob.survivalCampId === controller.campId);
    for (const player of Object.values(state.players || {})) {
      if (!player || player.health <= 0 || survivalPartyIdForPlayer(state, player) !== controller.primaryPartyId) continue;
      if (player.spacecraftInterior) {
        const components = spacecraftComponentTargets(state.world).sort((a, b) => Math.hypot(a.x - controller.homeX, a.y - controller.homeY) - Math.hypot(b.x - controller.homeX, b.y - controller.homeY));
        const component = components[0];
        const withinEngagement = component && engagedMembers.some((mob) => (
          Math.hypot(component.x - mob.x, component.y - mob.y) <= SURVIVAL_AGGRO_DISENGAGE_RADIUS
        ));
        if (withinEngagement) {
          component.playerId = player.id;
          targets.push(component);
        }
      } else if (engagedMembers.some((mob) => (
        Math.hypot(player.x - mob.x, player.y - mob.y) <= SURVIVAL_AGGRO_DISENGAGE_RADIUS
      ))) {
        targets.push(player);
      }
    }
    return targets;
  }

  function survivalCombatTargetsForMob(state, mob) {
    if (mob.kind === "ufo" && (isSurvivalCampMob(state, mob) || isSurvivalMigratingMob(state, mob))) {
      return [];
    }
    const defenseTarget = survivalRambotDefenseTarget(state, mob);
    if (defenseTarget) {
      return [defenseTarget];
    }
    if (mob.survivalAiState === "migrant-skirmish") {
      const target = state.players && state.players[String(mob.survivalTargetPlayerId || "")];
      return target && target.health > 0 ? [target] : [];
    }
    const controller = survivalEngagementStore(state)[String(mob.survivalCampId || "")];
    if (!controller || !["engage", "revenge"].includes(controller.phase) || !controller.squadIds.includes(survivalMobKey(mob))) return [];
    const targets = survivalTargetsForController(state, controller);
    if (!targets.length) return [];
    const now = simTime(state);
    const playerIdForTarget = (target) => String(target && (target.playerId || target.id) || "");
    const entityIdForTarget = (target) => String(target && target.id || playerIdForTarget(target));
    const currentEntityId = String(mob.survivalTargetEntityId || "");
    const current = currentEntityId ? targets.find((target) => entityIdForTarget(target) === currentEntityId) : null;
    if (current && now < finiteOr(mob.survivalTargetLockUntil, 0)) return [current];
    const squadIndex = Math.max(0, controller.squadIds.indexOf(survivalMobKey(mob)));
    const assigned = targets[squadIndex % targets.length];
    let next = current || assigned;
    if (current) {
      const playerThreat = controller.hostileParties[controller.primaryPartyId] && controller.hostileParties[controller.primaryPartyId].players || {};
      const currentThreat = finiteOr(playerThreat[playerIdForTarget(current)], 0);
      const highestThreatTarget = targets.reduce((best, target) => (
        finiteOr(playerThreat[playerIdForTarget(target)], 0) > finiteOr(playerThreat[playerIdForTarget(best)], 0) ? target : best
      ), current);
      const highestThreat = finiteOr(playerThreat[playerIdForTarget(highestThreatTarget)], 0);
      if (highestThreat > currentThreat * SURVIVAL_TARGET_SWITCH_THREAT_RATIO) next = highestThreatTarget;
    }
    mob.survivalTargetPlayerId = playerIdForTarget(next);
    mob.survivalTargetEntityId = entityIdForTarget(next);
    mob.survivalTargetPartyId = controller.primaryPartyId;
    if (!current || entityIdForTarget(current) !== mob.survivalTargetEntityId) mob.survivalTargetLockUntil = now + SURVIVAL_TARGET_LOCK_DURATION;
    return [next];
  }

  function updateSurvivalCampMobHome(state, mob, dt) {
    if (mob && mob.survivalEncounterType === "salvage" && mob.survivalSalvageBodyId) {
      return false;
    }

    const campMob = isSurvivalCampMob(state, mob);
    const migratingMob = isSurvivalMigratingMob(state, mob) || Boolean(mob && !isPlayerTeamMob(mob) && !isHordeGameMode(state && state.gameMode) && !mob.survivalCampId && mob.survivalEncounterType !== "hit-squad");
    if (!campMob && !migratingMob) return false;
    mob.survivalAggroAlertTimer = Math.max(0, finiteOr(mob.survivalAggroAlertTimer, 0) - dt);
    mob.survivalManeuverTimer = Math.max(0, finiteOr(mob.survivalManeuverTimer, 0) - dt);
    if (mob.survivalManeuverTimer <= 0) {
      mob.survivalManeuverActive = !mob.survivalManeuverActive;
      mob.survivalManeuverTimer = mob.survivalManeuverActive ? 0.55 + (mob.id % 4) * 0.09 : 1.7 + (mob.id % 5) * 0.23;
    }

    if (campMob && mob.kind === "rambot") {
      const defenseTarget = survivalRambotDefenseTarget(state, mob);
      if (defenseTarget) {
        mob.survivalAiState = "defend-body";
        mob.survivalDefenseBodyId = defenseTarget.body.id;
        mob.survivalDefenseCampBodyId = defenseTarget.protectedBody.id;
        mob.survivalCampReturning = false;
        return false;
      }
      mob.survivalDefenseBodyId = null;
      mob.survivalDefenseCampBodyId = null;
    }

    if (!campMob) {
      mob.survivalEncounterType = "migration";
      if (mob.kind === "ufo") {
        mob.survivalAiState = "migrate";
        mob.survivalAggroAlertTimer = 0;
        mob.survivalTargetPlayerId = "";
        mob.survivalTargetEntityId = "";
        mob.survivalTargetPartyId = "";
        mob.playerDamageAggroTimer = 0;
        mob.playerDamageAggroTargetPlayerId = "";
        return updateOrphanedSurvivalCampMobMigration(state, mob, dt);
      }
      const nearbyPlayer = nearbySurvivalMigrationPlayer(state, mob);
      if (nearbyPlayer) {
        if (mob.survivalAiState !== "migrant-skirmish") mob.survivalAggroAlertTimer = SURVIVAL_AGGRO_ALERT_DURATION;
        mob.survivalAiState = "migrant-skirmish";
        mob.survivalTargetPlayerId = String(nearbyPlayer.id || "");
      }
      const skirmishTarget = state.players && state.players[String(mob.survivalTargetPlayerId || "")];
      if (
        mob.survivalAiState === "migrant-skirmish" &&
        skirmishTarget &&
        skirmishTarget.health > 0 &&
        Math.hypot(skirmishTarget.x - mob.x, skirmishTarget.y - mob.y) <= SURVIVAL_AGGRO_DISENGAGE_RADIUS
      ) {
        applySurvivalPredictiveBodyAvoidance(state, mob, skirmishTarget, dt);
        return false;
      }
      mob.survivalAiState = "migrate";
      mob.survivalTargetPlayerId = "";
      return updateOrphanedSurvivalCampMobMigration(state, mob, dt);
    }
    const controller = ensureSurvivalCampController(state, mob.survivalCampId, finiteOr(mob.survivalCampX, mob.x), finiteOr(mob.survivalCampY, mob.y));
    if (mob.kind === "ufo") {
      mob.survivalCampAggroTimer = 0;
      mob.playerDamageAggroTimer = 0;
      mob.playerDamageAggroTargetPlayerId = "";
      mob.survivalTargetPlayerId = "";
      mob.survivalTargetEntityId = "";
      mob.survivalTargetPartyId = "";
      const campAnchor = survivalCampAnchorPoint(state, mob.survivalCampId, controller.homeX, controller.homeY);
      if (!campAnchor.hasCampBody) {
        delete survivalEngagementStore(state)[mob.survivalCampId];
        clearSurvivalCampMobIdentity(mob);
        mob.survivalAiState = "migrate";
        return updateOrphanedSurvivalCampMobMigration(state, mob, dt);
      }
      mob.survivalCampX = controller.homeX;
      mob.survivalCampY = controller.homeY;
      mob.survivalAiState = "guard";
      mob.survivalCampReturning = false;
      depositSurvivalUfoCargo(state, mob, mob.survivalCampId, mob.x, mob.y);
      const goal = survivalGuardPost(state, mob, controller);
      steerSurvivalMobArrival(state, mob, goal, dt, false);
      return true;
    }
    if (!mob.survivalAiState && finiteOr(mob.survivalCampAggroTimer, 0) > 0) {
      const legacyTarget = state.players && state.players[String(mob.survivalTargetPlayerId || "")];
      if (legacyTarget && legacyTarget.health > 0) {
        recordSurvivalHostileAction(state, mob.survivalCampId, mob.survivalTargetPlayerId, "legacy-aggro-migration", controller.homeX, controller.homeY, 1);
      } else {
        controller.phase = "return";
      }
    }
    mob.survivalCampAggroTimer = 0;
    mob.playerDamageAggroTimer = 0;
    let campAnchor = survivalCampAnchorPoint(state, mob.survivalCampId, controller.homeX, controller.homeY);
    if (!campAnchor.hasCampBody) {
      const now = simTime(state);
      if ((controller.phase === "engage" || controller.phase === "revenge") && !controller.destroyedAt) {
        controller.destroyedAt = now;
        delete controller.revengeUntil;
        controller.phase = "revenge";
        syncSurvivalCampSquad(state, controller);
      }
      if (controller.phase === "revenge" && survivalTargetsForController(state, controller).length > 0) {
        mob.survivalAiState = "revenge";
        applySurvivalPredictiveBodyAvoidance(state, mob, survivalCombatTargetsForMob(state, mob)[0], dt);
        return false;
      }
      delete survivalEngagementStore(state)[mob.survivalCampId];
      clearSurvivalCampMobIdentity(mob);
      mob.survivalAiState = "migrate";
      return updateOrphanedSurvivalCampMobMigration(state, mob, dt);
    }
    const campX = controller.homeX;
    const campY = controller.homeY;
    mob.survivalCampX = campX;
    mob.survivalCampY = campY;
    if (controller.phase === "engage") {
      const validTargets = survivalTargetsForController(state, controller);
      if (validTargets.length) {
        controller.targetLostAt = 0;
        syncSurvivalCampSquad(state, controller);
        if (controller.squadIds.includes(survivalMobKey(mob))) {
          mob.survivalAiState = "engage";
          applySurvivalPredictiveBodyAvoidance(state, mob, survivalCombatTargetsForMob(state, mob)[0], dt);
          return false;
        }
      } else {
        controller.targetLostAt = controller.targetLostAt || simTime(state);
        controller.phase = "return";
      }
    }
    if (controller.phase === "return") {
      mob.survivalAiState = "return";
      mob.survivalCampReturning = true;
      mob.survivalTargetPlayerId = "";
      clearSurvivalCampAttackState(mob);
    }
    const goal = survivalGuardPost(state, mob, controller);
    steerSurvivalMobArrival(state, mob, goal, dt, controller.phase === "return");
    const returnSettled = controller.phase === "return" && allCombatMobs(state.world)
      .filter((candidate) => candidate && candidate.health > 0 && candidate.survivalCampId === controller.campId)
      .every((candidate) => candidate.kind === "ufo"
        ? Math.hypot(candidate.x - campX, candidate.y - campY) <= SURVIVAL_CAMP_RETURN_RADIUS * 0.72
        : survivalCampBodySurfaceDistance(state, candidate, controller.campId) <= SURVIVAL_CAMP_PATROL_RADIUS * 0.72);
    if (returnSettled && simTime(state) - finiteOr(controller.targetLostAt, simTime(state)) >= 0.5) {
      controller.phase = "guard";
      controller.primaryPartyId = "";
      controller.primaryAggressorId = "";
      controller.hostileParties = {};
      mob.survivalAiState = "guard";
      mob.survivalCampReturning = false;
    }
    if (controller.phase === "guard") mob.survivalAiState = "guard";
    return true;
  }

  function shouldSleepDistantSurvivalMob(state, mob, players) {
    if (
      !state ||
      !mob ||
      normalizeGameMode(state.gameMode || state.world && state.world.gameMode) !== "survival" ||
      isPlayerTeamMob(mob) ||
      !mob.survivalCampId ||
      String(mob.survivalEncounterType || "camp") !== "camp"
    ) {
      return false;
    }
    if (
      ["engage", "revenge", "return", "migrate", "salvage"].includes(String(mob.survivalAiState || "")) ||
      finiteOr(mob.survivalCampAggroTimer, 0) > 0 ||
      finiteOr(mob.playerDamageAggroTimer, 0) > 0 ||
      mob.survivalSalvageBodyId ||
      mob.survivalMigrationCampId
    ) {
      return false;
    }
    const activePlayers = Array.isArray(players) && players.length
      ? players
      : Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    if (!activePlayers.length) {
      return false;
    }
    return nearestPlayerDistance(
      finiteOr(mob.survivalCampX, mob.x),
      finiteOr(mob.survivalCampY, mob.y),
      activePlayers
    ) > SURVIVAL_CAMP_FULL_SIMULATION_RADIUS;
  }

  function shouldSleepDistantSurvivalStructure(state, structure, players) {
    if (!state || !structure || !isSurvivalCampStructure(state, structure)) {
      return false;
    }
    if (
      finiteOr(structure.survivalCampAggroTimer, 0) > 0 ||
      finiteOr(structure.survivalAggroAlertTimer, 0) > 0 ||
      structure.survivalTargetPlayerId
    ) {
      return false;
    }
    const activePlayers = Array.isArray(players) && players.length
      ? players
      : Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    if (!activePlayers.length) {
      return false;
    }
    return nearestPlayerDistance(
      finiteOr(structure.survivalCampX, structure.x),
      finiteOr(structure.survivalCampY, structure.y),
      activePlayers
    ) > SURVIVAL_CAMP_FULL_SIMULATION_RADIUS;
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
        if (shouldSleepDistantSurvivalMob(state, mob, players)) {
          continue;
        }
        mob.difficultySpeedMultiplier = isPlayerTeamMob(mob) ? 1 : Math.max(1, finiteOr(difficultyMobSettings(state).speedMultiplier, 1));
        mob.hitCooldown = Math.max(0, finiteOr(mob.hitCooldown, 0) - dt);
        mob.disabledTimer = Math.max(0, finiteOr(mob.disabledTimer, 0) - dt);
        const damageAggroTargetId = String(mob.playerDamageAggroTargetPlayerId || "");
        const damageAggroTarget = damageAggroTargetId ? state.players && state.players[damageAggroTargetId] : null;
        if (
          damageAggroTarget &&
          damageAggroTarget.health > 0 &&
          Math.hypot(damageAggroTarget.x - mob.x, damageAggroTarget.y - mob.y) <= SURVIVAL_AGGRO_DISENGAGE_RADIUS
        ) {
          mob.playerDamageAggroTimer = Math.max(1, finiteOr(mob.playerDamageAggroTimer, 0));
        } else {
          mob.playerDamageAggroTimer = 0;
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
        if (!isPlayerTeamMob(mob) && (isSurvivalCampMob(state, mob) || isSurvivalMigratingMob(state, mob))) {
          mobTargets = survivalCombatTargetsForMob(state, mob);
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
