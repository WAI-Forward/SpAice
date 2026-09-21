  function nearestHostileMobTarget(source) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of hostileCombatMobs()) {
      if (!mob || mob === source || mob.health <= 0 || isMobSummoning(mob)) {
        continue;
      }
      if (isSurvivalCampMob(mob) && !["engage", "revenge"].includes(String(mob.survivalAiState || ""))) {
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

  function isSurvivalLogisticsUfo(mob) {
    return Boolean(
      mob &&
      mob.kind === "ufo" &&
      !isPlayerTeamMob(mob) &&
      !isHordeModeActive() &&
      (
        mob.survivalCampId ||
        mob.survivalEncounterType === "camp" ||
        mob.survivalEncounterType === "migration" ||
        mob.survivalEncounterType === "salvage" ||
        mob.survivalMigrationCampId
      )
    );
  }

  let survivalMobSimulationAnchors = null;

  function refreshSurvivalMobSimulationAnchors() {
    survivalMobSimulationAnchors = activePartyPlayerAnchors();
  }

  function shouldSleepDistantSurvivalMob(mob) {
    if (!isSurvivalCampMob(mob) || String(mob.survivalEncounterType || "camp") !== "camp") {
      return false;
    }
    // Anything already interacting with the player, returning from combat, or
    // carrying out camp logistics remains fully simulated regardless of range.
    if (
      ["engage", "revenge", "return", "migrate", "salvage"].includes(String(mob.survivalAiState || "")) ||
      finiteOr(mob.survivalCampAggroTimer, 0) > 0 ||
      finiteOr(mob.playerDamageAggroTimer, 0) > 0 ||
      mob.survivalSalvageBodyId ||
      mob.survivalMigrationCampId
    ) {
      return false;
    }
    const campX = finiteOr(mob.survivalCampX, mob.x);
    const campY = finiteOr(mob.survivalCampY, mob.y);
    const anchors = Array.isArray(survivalMobSimulationAnchors) && survivalMobSimulationAnchors.length
      ? survivalMobSimulationAnchors
      : activePartyPlayerAnchors();
    return nearestPartyAnchorDistance(campX, campY, anchors) > survivalCampFullSimulationRadius;
  }

  function shouldSleepDistantSurvivalStructure(structure) {
    if (!isSurvivalCampStructure(structure)) {
      return false;
    }
    if (
      finiteOr(structure.survivalCampAggroTimer, 0) > 0 ||
      finiteOr(structure.survivalAggroAlertTimer, 0) > 0 ||
      structure.survivalTargetPlayerId
    ) {
      return false;
    }
    const anchors = Array.isArray(survivalMobSimulationAnchors) && survivalMobSimulationAnchors.length
      ? survivalMobSimulationAnchors
      : activePartyPlayerAnchors();
    return nearestPartyAnchorDistance(
      finiteOr(structure.survivalCampX, structure.x),
      finiteOr(structure.survivalCampY, structure.y),
      anchors
    ) > survivalCampFullSimulationRadius;
  }

  let survivalCampSpatialRevision = 0;
  let survivalCampSpatialCacheRevision = -1;
  let survivalCampSpatialCache = null;

  function invalidateSurvivalCampSpatialCache() {
    survivalCampSpatialRevision += 1;
  }

  function currentSurvivalCampSpatialCache() {
    if (survivalCampSpatialCache && survivalCampSpatialCacheRevision === survivalCampSpatialRevision) {
      return survivalCampSpatialCache;
    }
    const scoredBodyIds = typeof connectedScoredBodyIds === "function" ? connectedScoredBodyIds() : new Set();
    const bodiesByCamp = new Map();
    const anchorsByCamp = new Map();
    for (const body of particles) {
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
    survivalCampSpatialCacheRevision = survivalCampSpatialRevision;
    survivalCampSpatialCache = { scoredBodyIds, bodiesByCamp, anchorsByCamp };
    return survivalCampSpatialCache;
  }

  function playerScoredSurvivalCampBodyIds() {
    return currentSurvivalCampSpatialCache().scoredBodyIds;
  }

  function survivalCampBodiesForId(campId) {
    return currentSurvivalCampSpatialCache().bodiesByCamp.get(String(campId || "")) || [];
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

  function survivalAiNow() {
    return performance.now() * 0.001;
  }

  function survivalMobKey(mob) {
    return String(mob && mob.kind || "mob") + ":" + String(mob && mob.id || 0);
  }

  function survivalEngagementStore() {
    if (!survivalSpawnState.engagements || typeof survivalSpawnState.engagements !== "object") {
      survivalSpawnState.engagements = {};
    }
    return survivalSpawnState.engagements;
  }

  function survivalTargetPlayerIdValue(target) {
    return target && target.local
      ? String(player.id || "")
      : String(target && target.remote && target.remote.playerId || target && target.player && target.player.id || "");
  }

  function survivalPartyIdForTarget(target) {
    const playerId = survivalTargetPlayerIdValue(target);
    if (!playerId) return "";
    const teamId = String(target && target.remote && target.remote.teamId || target && target.player && target.player.teamId || target && target.local && multiplayer.sharedTeamId || "");
    if (typeof isSharedPublicWorldActive === "function" && isSharedPublicWorldActive()) {
      return teamId ? "team:" + teamId : "player:" + playerId;
    }
    return "room-party";
  }

  function survivalTargetForPlayerId(playerId) {
    const cleanId = String(playerId || "");
    if (!cleanId || typeof collectCombatPlayerTargets !== "function") return null;
    return collectCombatPlayerTargets().find((target) => survivalTargetPlayerIdValue(target) === cleanId) || null;
  }

  function survivalCampFixedHome(campId, fallbackX, fallbackY) {
    let x = 0;
    let y = 0;
    let weight = 0;
    for (const body of particles) {
      if (!body || !body.survivalCampBody || body.survivalCampId !== campId) continue;
      const home = ensureSurvivalCampBodyHome(body);
      const bodyWeight = Math.max(1, Math.sqrt(Math.max(1, finiteOr(body.mass, 1))));
      x += finiteOr(home && home.x, fallbackX) * bodyWeight;
      y += finiteOr(home && home.y, fallbackY) * bodyWeight;
      weight += bodyWeight;
    }
    return weight > 0 ? { x: x / weight, y: y / weight } : { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0) };
  }

  function ensureSurvivalCampController(campId, fallbackX, fallbackY) {
    const cleanCampId = String(campId || "");
    if (!cleanCampId) return null;
    const store = survivalEngagementStore();
    let controller = store[cleanCampId];
    if (!controller || typeof controller !== "object") {
      const home = survivalCampFixedHome(cleanCampId, fallbackX, fallbackY);
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

  function syncSurvivalCampSquad(controller) {
    const members = hostileCombatMobs()
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
      if (controller.phase === "engage" || controller.phase === "revenge") {
        mob.survivalAiState = controller.phase;
      }
    }
  }

  function recordSurvivalHostileAction(campId, targetPlayerId, hostileActionType, originX, originY, threat) {
    const target = survivalTargetForPlayerId(targetPlayerId);
    const partyId = survivalPartyIdForTarget(target);
    const controller = ensureSurvivalCampController(campId, originX, originY);
    if (!controller || !partyId) return false;
    const now = survivalAiNow();
    const newlyAggroed = !["engage", "revenge"].includes(controller.phase);
    const party = controller.hostileParties[partyId] || { threat: 0, players: {}, lastHostileAt: 0 };
    party.threat = Math.max(0, finiteOr(party.threat, 0)) + Math.max(1, finiteOr(threat, 1));
    party.players[String(targetPlayerId)] = Math.max(0, finiteOr(party.players[String(targetPlayerId)], 0)) + Math.max(1, finiteOr(threat, 1));
    party.lastHostileAt = now;
    party.hostileActionType = String(hostileActionType || "attack");
    controller.hostileParties[partyId] = party;
    const currentThreat = finiteOr(controller.hostileParties[controller.primaryPartyId] && controller.hostileParties[controller.primaryPartyId].threat, 0);
    if (!controller.primaryPartyId || partyId === controller.primaryPartyId || party.threat >= currentThreat * survivalTargetSwitchThreatRatio) {
      controller.primaryPartyId = partyId;
    }
    controller.primaryAggressorId = String(targetPlayerId || "");
    controller.phase = "engage";
    controller.engagedAt = now;
    controller.targetLostAt = 0;
    syncSurvivalCampSquad(controller);
    if (newlyAggroed) {
      for (const mob of hostileCombatMobs()) {
        if (mob && mob.health > 0 && mob.survivalCampId === controller.campId) mob.survivalAggroAlertTimer = survivalAggroAlertDuration;
      }
    }
    return controller.squadIds.length > 0;
  }

  function wakeSurvivalCamp(campId, targetPlayerId, reason, originX, originY) {
    const cleanCampId = String(campId || "");
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!cleanCampId || !cleanTargetPlayerId || isHordeModeActive()) {
      return false;
    }
    const wakeX = finiteOr(originX, 0);
    const wakeY = finiteOr(originY, 0);
    const controller = ensureSurvivalCampController(cleanCampId, wakeX, wakeY);
    const newlyAggroed = Boolean(controller && !["engage", "revenge"].includes(controller.phase));
    if (!recordSurvivalHostileAction(cleanCampId, cleanTargetPlayerId, reason, wakeX, wakeY, 10)) {
      return false;
    }
    let woken = wakeSurvivalCampStructures(cleanCampId, wakeX, wakeY, cleanTargetPlayerId, newlyAggroed);
    for (const campMob of hostileCombatMobs()) {
      if (
        !campMob ||
        campMob.survivalCampId !== cleanCampId ||
        campMob.health <= 0
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
    return woken > 0;
  }

  function wakeSurvivalCampFromMob(mob, targetPlayerId) {
    if (!isSurvivalCampMob(mob)) {
      return false;
    }
    if (mob.kind === "ufo") {
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

  function aggroNearbyMobsFromPlayerDamage(damagedMob, targetPlayerId) {
    const cleanTargetPlayerId = String(targetPlayerId || "");
    if (!damagedMob || !cleanTargetPlayerId || isPlayerTeamMob(damagedMob)) {
      return false;
    }

    if (isSurvivalLogisticsUfo(damagedMob)) {
      damagedMob.playerDamageAggroTimer = 0;
      damagedMob.playerDamageAggroTargetPlayerId = "";
      damagedMob.survivalTargetPlayerId = "";
      return false;
    }
    if (isSurvivalCampMob(damagedMob)) {
      return wakeSurvivalCampFromMob(damagedMob, cleanTargetPlayerId);
    }
    if (isSurvivalMigratingMob(damagedMob)) {
      if (damagedMob.survivalAiState !== "migrant-skirmish") damagedMob.survivalAggroAlertTimer = survivalAggroAlertDuration;
      damagedMob.survivalAiState = "migrant-skirmish";
      damagedMob.survivalTargetPlayerId = cleanTargetPlayerId;
      return true;
    }
    damagedMob.playerDamageAggroTimer = survivalCampAggroDuration;
    damagedMob.playerDamageAggroTargetPlayerId = cleanTargetPlayerId;
    return true;
  }

  function isSurvivalCampStructure(structure) {
    return Boolean(structure && structure.survivalCampId && !isHordeModeActive());
  }

  function isMobOwnedStructure(structure) {
    const ownerPlayerId = String(structure && structure.ownerPlayerId || "");
    return Boolean(structure && (structure.survivalCampId || ownerPlayerId.startsWith("survival-camp:")));
  }

  function isSurvivalCampAttackingStructure(structure) {
    return Boolean(structure && (structure.type === "turret" || structure.type === "missile-launcher"));
  }

  function survivalCampControllerForStructure(structure) {
    if (!isSurvivalCampStructure(structure)) {
      return null;
    }
    return survivalEngagementStore()[String(structure.survivalCampId || "")] || null;
  }

  function wakeSurvivalCampStructures(campId, wakeX, wakeY, targetPlayerId, showAggroAlert) {
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
      if (showAggroAlert && isSurvivalCampAttackingStructure(structure)) {
        structure.survivalAggroAlertTimer = survivalAggroAlertDuration;
      }
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
    if (!body || !body.survivalCampBody || !body.survivalCampId || isHordeModeActive()) {
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
    if (!body) {
      return;
    }
    const controllingPlayerId = String(playerId || "");
    body.lastControllingPlayerId = controllingPlayerId;
    body.lastPlayerControlAt = survivalAiNow();
    body.lastPlayerControlBelowSpeedAt = 0;
    if (!body.survivalCampBody) return;
    ensureSurvivalCampBodyHome(body);
    body.survivalCampMovedByPlayer = true;
    body.survivalCampLastMoverPlayerId = controllingPlayerId;
  }

  function controllingPlayerIdForBody(body) {
    if (!body) return "";
    const speed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
    const now = survivalAiNow();
    if (body.lastControllingPlayerId) {
      if (speed >= solidBodyDamageSpeed) {
        body.lastPlayerControlBelowSpeedAt = 0;
      } else {
        body.lastPlayerControlBelowSpeedAt = finiteOr(body.lastPlayerControlBelowSpeedAt, 0) || now;
        if (now - body.lastPlayerControlBelowSpeedAt >= survivalBodyProvenanceTimeout) {
          body.lastControllingPlayerId = "";
        }
      }
    }
    if (body.lastControllingPlayerId) return String(body.lastControllingPlayerId);
    if (body.ownerPlayerId) return String(body.ownerPlayerId);
    return isPlayerScoredSurvivalCampBody(body) ? String(player.id || "") : "";
  }

  function survivalRambotDefenseTarget(mob) {
    if (!isSurvivalCampMob(mob) || mob.kind !== "rambot") {
      return null;
    }

    let best = null;
    let bestScore = Infinity;
    const campBodies = survivalCampBodiesForId(mob.survivalCampId);
    for (const protectedBody of campBodies) {
      const protectedMass = Math.max(1, finiteOr(protectedBody.mass, 1));
      const protectedRadius = solidBodyContactRadius(protectedBody);
      for (const body of particles) {
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
        const playerId = controllingPlayerIdForBody(body);
        if (!playerId) {
          continue;
        }

        const relativeX = finiteOr(body.x, 0) - finiteOr(protectedBody.x, 0);
        const relativeY = finiteOr(body.y, 0) - finiteOr(protectedBody.y, 0);
        const distance = Math.hypot(relativeX, relativeY) || 1;
        const contactDistance = solidBodyContactRadius(body) + protectedRadius;
        if (distance - contactDistance > survivalRambotDefenseScanRadius) {
          continue;
        }

        const velocityX = finiteOr(body.vx, 0) - finiteOr(protectedBody.vx, 0);
        const velocityY = finiteOr(body.vy, 0) - finiteOr(protectedBody.vy, 0);
        const closingSpeed = -(relativeX * velocityX + relativeY * velocityY) / distance;
        if (closingSpeed < survivalRambotDefenseMinClosingSpeed) {
          continue;
        }
        const velocitySquared = velocityX * velocityX + velocityY * velocityY;
        const timeToClosest = clamp(
          -(relativeX * velocityX + relativeY * velocityY) / Math.max(1, velocitySquared),
          0,
          survivalRambotDefenseLookahead
        );
        const closestX = relativeX + velocityX * timeToClosest;
        const closestY = relativeY + velocityY * timeToClosest;
        const closestDistance = Math.hypot(closestX, closestY);
        if (closestDistance > contactDistance + survivalRambotDefensePathPadding) {
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
          x: finiteOr(body.x, 0),
          y: finiteOr(body.y, 0),
          radius: solidBodyContactRadius(body)
        };
      }
    }
    return best;
  }

  function maybeWakeSurvivalCampFromMovedBody(body) {
    if (body && body.lastControllingPlayerId) controllingPlayerIdForBody(body);
    if (!body || !body.survivalCampBody || !body.survivalCampMovedByPlayer || body.survivalCampBodyMovedWakeSent) {
      return false;
    }
    const home = ensureSurvivalCampBodyHome(body);
    if (!home || Math.hypot(finiteOr(body.x, home.x) - home.x, finiteOr(body.y, home.y) - home.y) < survivalCampBodyWakeDistance) {
      return false;
    }
    const alerted = wakeSurvivalCampFromBody(body, body.survivalCampLastMoverPlayerId || "", { allowScoredBody: true });
    if (alerted) body.survivalCampBodyMovedWakeSent = true;
    return alerted;
  }

  function survivalCampAnchorPoint(campId, fallbackX, fallbackY) {
    const cleanCampId = String(campId || "");
    if (!cleanCampId) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }
    const anchor = currentSurvivalCampSpatialCache().anchorsByCamp.get(cleanCampId);
    if (!anchor || anchor.totalWeight <= 0) {
      return { x: finiteOr(fallbackX, 0), y: finiteOr(fallbackY, 0), hasCampBody: false };
    }
    return {
      x: anchor.weightedX / anchor.totalWeight,
      y: anchor.weightedY / anchor.totalWeight,
      hasCampBody: true
    };
  }

  function nearestSurvivalCampAnchor(campId, x, y) {
    const ignoredCampId = String(campId || "");
    const camps = new Map();
    const activeCampIds = new Set(hostileCombatMobs().filter((mob) => mob && mob.health > 0 && mob.survivalCampId).map((mob) => String(mob.survivalCampId)));
    const scoredBodyIds = playerScoredSurvivalCampBodyIds();
    for (const body of particles) {
      if (!body || !body.survivalCampBody || !body.survivalCampId || !activeCampIds.has(String(body.survivalCampId)) || body.survivalCampId === ignoredCampId || isPlayerScoredSurvivalCampBody(body, scoredBodyIds)) {
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
      mob.survivalAiState = "migrate";
      if (!Number.isFinite(Number(mob.survivalMigrationDirX)) || Math.hypot(finiteOr(mob.survivalMigrationDirX, 0), finiteOr(mob.survivalMigrationDirY, 0)) < 0.5) {
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
      mergeArrivingSurvivalCampMob(mob, targetCamp.campId);
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

  let survivalSeparationFrame = -1;
  let survivalSeparationBuckets = new Map();

  function survivalMobSeparation(mob) {
    const frame = Math.floor(performance.now() / 12);
    const cellSize = 180;
    if (survivalSeparationFrame !== frame) {
      survivalSeparationFrame = frame;
      survivalSeparationBuckets = new Map();
      for (const candidate of hostileCombatMobs()) {
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

  function survivalGuardPost(mob, controller) {
    const campBodies = survivalCampBodiesForId(controller.campId);
    const members = hostileCombatMobs()
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
      collisionEnvelope = Math.max(
        collisionEnvelope,
        Math.hypot(finiteOr(body.x, controller.homeX) - controller.homeX, finiteOr(body.y, controller.homeY) - controller.homeY) + finiteOr(body.radius, 0) + finiteOr(mob.radius, 28) + 100
      );
    }
    if (!(finiteOr(mob.survivalCampSlotRadius, 0) > 0)) {
      mob.survivalCampSlotAngle = -Math.PI / 2 + index * Math.PI * (3 - Math.sqrt(5));
      mob.survivalCampSlotRadius = Math.max(collisionEnvelope, survivalCampIdleRadius * (0.58 + (index % 3) * 0.1));
    }
    const angle = finiteOr(mob.survivalCampSlotAngle, finiteOr(mob.wobble, 0));
    const radius = Math.max(collisionEnvelope, finiteOr(mob.survivalCampSlotRadius, survivalCampIdleRadius * 0.65));
    return { x: controller.homeX + Math.cos(angle) * radius, y: controller.homeY + Math.sin(angle) * radius };
  }

  function survivalCampBodySurfaceDistance(mob, campId) {
    let nearest = Infinity;
    for (const body of survivalCampBodiesForId(campId)) {
      nearest = Math.min(nearest, Math.max(0, Math.hypot(body.x - mob.x, body.y - mob.y) - finiteOr(body.radius, 0)));
    }
    return nearest;
  }

  function steerSurvivalMobArrival(mob, goal, dt, returning) {
    const dx = goal.x - mob.x;
    const dy = goal.y - mob.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const desiredSpeed = returning ? clamp(distance * 0.72, 0, 270) : clamp(distance * 0.65, 0, 150);
    const steer = clamp(dt * (returning ? 3.6 : 4.8), 0, 1);
    const separation = survivalMobSeparation(mob);
    mob.vx += (nx * desiredSpeed - mob.vx) * steer + separation.x * 120 * dt;
    mob.vy += (ny * desiredSpeed - mob.vy) * steer + separation.y * 120 * dt;
    if (distance < 24) {
      mob.vx *= Math.pow(0.08, dt);
      mob.vy *= Math.pow(0.08, dt);
    }
    const previousDistance = finiteOr(mob.survivalGoalDistance, distance + 1);
    mob.survivalGoalProgressTimer = distance < previousDistance - 2
      ? 0
      : finiteOr(mob.survivalGoalProgressTimer, 0) + dt;
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
      for (const body of particles) {
        if (!body || !body.survivalCampBody || body.survivalCampId !== mob.survivalCampId || isPlayerScoredSurvivalCampBody(body)) continue;
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

  function applySurvivalPredictiveBodyAvoidance(mob, goal, dt) {
    goal = goal && (goal.spacecraftTarget ? goal : goal.player || goal);
    if (!mob || !goal || !Number.isFinite(goal.x) || !Number.isFinite(goal.y)) return;
    const goalDx = goal.x - mob.x;
    const goalDy = goal.y - mob.y;
    const goalDistance = Math.hypot(goalDx, goalDy);
    if (goalDistance < 1) return;
    const forwardX = goalDx / goalDistance;
    const forwardY = goalDy / goalDistance;
    const scanDistance = Math.min(goalDistance, 760);
    let obstruction = null;
    for (const body of particles) {
      if (!body || !body.tier || !body.tier.solid || body === mob) continue;
      const bodyDx = finiteOr(body.x, 0) - mob.x;
      const bodyDy = finiteOr(body.y, 0) - mob.y;
      const along = bodyDx * forwardX + bodyDy * forwardY;
      if (along <= 0 || along > scanDistance) continue;
      const lateral = bodyDx * -forwardY + bodyDy * forwardX;
      const clearance = Math.abs(lateral) - solidBodyContactRadius(body) - finiteOr(mob.radius, 28);
      if (clearance >= 130 || obstruction && clearance >= obstruction.clearance) continue;
      obstruction = { body, along, lateral, clearance };
    }
    if (!obstruction) {
      mob.survivalAvoidingBodyId = null;
      return;
    }
    const side = Math.abs(obstruction.lateral) > 8
      ? (obstruction.lateral > 0 ? -1 : 1)
      : ((Math.floor(finiteOr(mob.id, 0)) & 1) ? -1 : 1);
    const bodyRadius = solidBodyContactRadius(obstruction.body);
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

  function survivalTargetsForController(controller) {
    const result = [];
    const engagedMembers = hostileCombatMobs().filter((mob) => mob && mob.health > 0 && mob.survivalCampId === controller.campId);
    for (const target of typeof collectCombatPlayerTargets === "function" ? collectCombatPlayerTargets() : []) {
      if (!target || !target.player || target.player.health <= 0 || survivalPartyIdForTarget(target) !== controller.primaryPartyId) continue;
      let resolved = target;
      if (target.local && typeof isPlayerInsideSpacecraft === "function" && isPlayerInsideSpacecraft()) {
        const reference = engagedMembers[0] || controller;
        resolved = typeof nearestSpacecraftCombatTarget === "function"
          ? nearestSpacecraftCombatTarget(
              finiteOr(reference.x, controller.homeX),
              finiteOr(reference.y, controller.homeY),
              survivalAggroDisengageRadius
            )
          : null;
      }
      if (!resolved || !resolved.player && !resolved.spacecraftTarget) continue;
      const entity = resolved.player || resolved;
      const withinEngagement = engagedMembers.some((mob) => (
        Math.hypot(entity.x - mob.x, entity.y - mob.y) <= survivalAggroDisengageRadius
      ));
      if (withinEngagement) result.push(resolved);
    }
    return result;
  }

  function updateSurvivalCampMobHome(mob, dt) {
    if (mob && mob.survivalEncounterType === "salvage" && mob.survivalSalvageBodyId) {
      return false;
    }

    const campMob = isSurvivalCampMob(mob);
    const migratingMob = isSurvivalMigratingMob(mob) || Boolean(mob && !isPlayerTeamMob(mob) && !isHordeModeActive() && !mob.survivalCampId && mob.survivalEncounterType !== "hit-squad");
    if (!campMob && !migratingMob) return false;
    mob.survivalAggroAlertTimer = Math.max(0, finiteOr(mob.survivalAggroAlertTimer, 0) - dt);
    mob.survivalManeuverTimer = Math.max(0, finiteOr(mob.survivalManeuverTimer, 0) - dt);
    if (mob.survivalManeuverTimer <= 0) {
      mob.survivalManeuverActive = !mob.survivalManeuverActive;
      mob.survivalManeuverTimer = mob.survivalManeuverActive ? 0.55 + (mob.id % 4) * 0.09 : 1.7 + (mob.id % 5) * 0.23;
    }

    if (campMob && mob.kind === "rambot") {
      const defenseTarget = survivalRambotDefenseTarget(mob);
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
        return updateOrphanedSurvivalCampMobMigration(mob, dt);
      }
      const nearbyTarget = nearbySurvivalMigrationTarget(mob);
      if (nearbyTarget) {
        if (mob.survivalAiState !== "migrant-skirmish") mob.survivalAggroAlertTimer = survivalAggroAlertDuration;
        mob.survivalAiState = "migrant-skirmish";
        mob.survivalTargetPlayerId = survivalTargetPlayerId(nearbyTarget);
      }
      const skirmishTarget = survivalTargetForPlayerId(mob.survivalTargetPlayerId);
      if (
        mob.survivalAiState === "migrant-skirmish" &&
        skirmishTarget &&
        skirmishTarget.player &&
        skirmishTarget.player.health > 0 &&
        Math.hypot(skirmishTarget.player.x - mob.x, skirmishTarget.player.y - mob.y) <= survivalAggroDisengageRadius
      ) {
        applySurvivalPredictiveBodyAvoidance(mob, skirmishTarget, dt);
        return false;
      }
      mob.survivalAiState = "migrate";
      mob.survivalTargetPlayerId = "";
      return updateOrphanedSurvivalCampMobMigration(mob, dt);
    }
    const controller = ensureSurvivalCampController(mob.survivalCampId, finiteOr(mob.survivalCampX, mob.x), finiteOr(mob.survivalCampY, mob.y));
    if (mob.kind === "ufo") {
      mob.survivalCampAggroTimer = 0;
      mob.playerDamageAggroTimer = 0;
      mob.playerDamageAggroTargetPlayerId = "";
      mob.survivalTargetPlayerId = "";
      mob.survivalTargetEntityId = "";
      mob.survivalTargetPartyId = "";
      const campAnchor = survivalCampAnchorPoint(mob.survivalCampId, controller.homeX, controller.homeY);
      if (!campAnchor.hasCampBody) {
        delete survivalEngagementStore()[mob.survivalCampId];
        clearSurvivalCampMobIdentity(mob);
        mob.survivalAiState = "migrate";
        return updateOrphanedSurvivalCampMobMigration(mob, dt);
      }
      mob.survivalCampX = controller.homeX;
      mob.survivalCampY = controller.homeY;
      mob.survivalAiState = "guard";
      mob.survivalCampReturning = false;
      depositSurvivalUfoCargo(mob, mob.survivalCampId, mob.x, mob.y);
      const goal = survivalGuardPost(mob, controller);
      steerSurvivalMobArrival(mob, goal, dt, false);
      return true;
    }
    if (!mob.survivalAiState && finiteOr(mob.survivalCampAggroTimer, 0) > 0) {
      if (survivalTargetForPlayerId(mob.survivalTargetPlayerId)) {
        recordSurvivalHostileAction(mob.survivalCampId, mob.survivalTargetPlayerId, "legacy-aggro-migration", controller.homeX, controller.homeY, 1);
      } else {
        controller.phase = "return";
      }
    }
    mob.survivalCampAggroTimer = 0;
    mob.playerDamageAggroTimer = 0;
    let campAnchor = survivalCampAnchorPoint(mob.survivalCampId, controller.homeX, controller.homeY);
    if (!campAnchor.hasCampBody) {
      const now = survivalAiNow();
      if ((controller.phase === "engage" || controller.phase === "revenge") && !controller.destroyedAt) {
        controller.destroyedAt = now;
        delete controller.revengeUntil;
        controller.phase = "revenge";
        syncSurvivalCampSquad(controller);
      }
      if (controller.phase === "revenge" && survivalTargetsForController(controller).length > 0) {
        mob.survivalAiState = "revenge";
        applySurvivalPredictiveBodyAvoidance(mob, survivalCampCombatTarget(mob), dt);
        return false;
      }
      delete survivalEngagementStore()[mob.survivalCampId];
      clearSurvivalCampMobIdentity(mob);
      mob.survivalAiState = "migrate";
      return updateOrphanedSurvivalCampMobMigration(mob, dt);
    }
    const campX = controller.homeX;
    const campY = controller.homeY;
    mob.survivalCampX = campX;
    mob.survivalCampY = campY;
    if (controller.phase === "engage") {
      const validTargets = survivalTargetsForController(controller);
      if (validTargets.length) {
        controller.targetLostAt = 0;
        syncSurvivalCampSquad(controller);
        if (controller.squadIds.includes(survivalMobKey(mob))) {
          mob.survivalAiState = "engage";
          applySurvivalPredictiveBodyAvoidance(mob, survivalCampCombatTarget(mob), dt);
          return false;
        }
      } else {
        controller.targetLostAt = controller.targetLostAt || survivalAiNow();
        controller.phase = "return";
      }
    }
    if (controller.phase === "return") {
      mob.survivalAiState = "return";
      mob.survivalCampReturning = true;
      mob.survivalTargetPlayerId = "";
      clearSurvivalCampAttackState(mob);
    }
    const goal = survivalGuardPost(mob, controller);
    steerSurvivalMobArrival(mob, goal, dt, controller.phase === "return");
    const returnSettled = controller.phase === "return" && hostileCombatMobs()
      .filter((candidate) => candidate && candidate.health > 0 && candidate.survivalCampId === controller.campId)
      .every((candidate) => candidate.kind === "ufo"
        ? Math.hypot(candidate.x - campX, candidate.y - campY) <= survivalCampReturnRadius * 0.72
        : survivalCampBodySurfaceDistance(candidate, controller.campId) <= survivalCampPatrolRadius * 0.72);
    if (returnSettled && survivalAiNow() - finiteOr(controller.targetLostAt, survivalAiNow()) >= 0.5) {
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
    if (!mob || isHordeModeActive() || typeof collectCombatPlayerTargets !== "function") {
      return null;
    }
    if (mob.kind === "ufo" && (isSurvivalCampMob(mob) || isSurvivalMigratingMob(mob))) {
      return null;
    }
    if (mob.survivalAiState === "migrant-skirmish") {
      return survivalTargetForPlayerId(mob.survivalTargetPlayerId);
    }
    const controller = survivalEngagementStore()[String(mob.survivalCampId || "")];
    if (!controller || !["engage", "revenge"].includes(controller.phase) || !controller.squadIds.includes(survivalMobKey(mob))) return null;
    const targets = survivalTargetsForController(controller);
    if (!targets.length) return null;
    const now = survivalAiNow();
    const entityIdForTarget = (target) => target && target.spacecraftTarget
      ? String(target.id || "")
      : survivalTargetPlayerIdValue(target);
    const currentEntityId = String(mob.survivalTargetEntityId || "");
    const current = currentEntityId ? targets.find((target) => entityIdForTarget(target) === currentEntityId) : null;
    if (current && now < finiteOr(mob.survivalTargetLockUntil, 0)) return current;
    const squadIndex = Math.max(0, controller.squadIds.indexOf(survivalMobKey(mob)));
    const assigned = targets[squadIndex % targets.length];
    let next = current || assigned;
    if (current) {
      const playerThreat = controller.hostileParties[controller.primaryPartyId] && controller.hostileParties[controller.primaryPartyId].players || {};
      const currentThreat = finiteOr(playerThreat[survivalTargetPlayerIdValue(current)], 0);
      const highestThreatTarget = targets.reduce((best, target) => (
        finiteOr(playerThreat[survivalTargetPlayerIdValue(target)], 0) > finiteOr(playerThreat[survivalTargetPlayerIdValue(best)], 0) ? target : best
      ), current);
      const highestThreat = finiteOr(playerThreat[survivalTargetPlayerIdValue(highestThreatTarget)], 0);
      if (highestThreat > currentThreat * survivalTargetSwitchThreatRatio) next = highestThreatTarget;
    }
    mob.survivalTargetPlayerId = survivalTargetPlayerIdValue(next);
    mob.survivalTargetEntityId = entityIdForTarget(next);
    mob.survivalTargetPartyId = controller.primaryPartyId;
    if (!current || entityIdForTarget(current) !== mob.survivalTargetEntityId) mob.survivalTargetLockUntil = now + survivalTargetLockDuration;
    return next;
  }

  function playerDamageCombatTarget(mob) {
    if (!mob || finiteOr(mob.playerDamageAggroTimer, 0) <= 0) {
      return null;
    }
    const targetId = String(mob.playerDamageAggroTargetPlayerId || "");
    if (!targetId || typeof collectCombatPlayerTargets !== "function") {
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
    const survivalControlled = Boolean(mob && (isSurvivalCampMob(mob) || isSurvivalMigratingMob(mob)));
    const damageTarget = survivalControlled ? null : playerDamageCombatTarget(mob);
    if (damageTarget) {
      return damageTarget;
    }
    if (mob && mob.survivalEncounterType === "hit-squad") {
      return null;
    }
    if (mob && (isSurvivalCampMob(mob) || isSurvivalMigratingMob(mob))) {
      if (mob.kind === "ufo") {
        return null;
      }
      const defenseTarget = survivalRambotDefenseTarget(mob);
      if (defenseTarget) {
        return defenseTarget;
      }
      if (!["engage", "revenge", "migrant-skirmish"].includes(String(mob.survivalAiState || ""))) {
        return null;
      }
      return survivalCampCombatTarget(mob);
    }
    return nearestCombatPlayerTarget(mob.x, mob.y);
  }
