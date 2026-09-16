  const survivalAllowanceMobCosts = {
    alienoid: 50,
    ufo: 150,
    rambot: 240,
    engineer: 300,
    tesla: 360,
    satellite: 480,
    rocket: 520,
    fighter: 700
  };

  function survivalMobAllowanceCost(kind, options) {
    const baseCost = survivalAllowanceMobCosts[kind] || survivalAllowanceMobCosts.alienoid;
    const settings = options && typeof options === "object" ? options : {};
    if (settings.isBoss) {
      return Math.round(baseCost * (12 + Math.max(0, Math.floor(finiteOr(settings.bossStars, 0))) * 4));
    }
    const stars = mobEliteStarRankValue(settings.eliteStars);
    if (stars > 0) {
      return Math.round(baseCost * stars * mobEliteCompressionSize * 1.15);
    }
    return baseCost;
  }

  function survivalAllowanceCandidateList(budget, options) {
    const settings = options && typeof options === "object" ? options : {};
    const allowBosses = settings.allowBosses !== false;
    const candidates = [];
    for (const kind of mobTierOrder) {
      const baseCost = survivalMobAllowanceCost(kind);
      if (baseCost <= budget) {
        candidates.push({ kind, cost: baseCost, eliteStars: 0, eliteGroupSize: 1, isBoss: false, weight: 1 / Math.pow(baseCost, 1.15) });
      }
      for (let stars = 1; stars <= mobEliteMaxStars; stars += 1) {
        const cost = survivalMobAllowanceCost(kind, { eliteStars: stars });
        if (cost <= budget) {
          candidates.push({
            kind,
            cost,
            eliteStars: stars,
            eliteGroupSize: stars * mobEliteCompressionSize,
            isBoss: false,
            weight: 0.55 / Math.pow(cost, 1.1)
          });
        }
      }
      if (allowBosses) {
        for (let bossStars = 0; bossStars <= 2; bossStars += 1) {
          const cost = survivalMobAllowanceCost(kind, { isBoss: true, bossStars });
          if (cost <= budget) {
            candidates.push({
              kind,
              cost,
              eliteStars: 0,
              eliteGroupSize: 1,
              isBoss: true,
              bossStars,
              weight: 0.18 / Math.pow(cost, 1.04)
            });
          }
        }
      }
    }
    return candidates;
  }

  function chooseWeightedSurvivalCandidate(candidates) {
    const totalWeight = candidates.reduce((sum, candidate) => sum + Math.max(0, finiteOr(candidate.weight, 0)), 0);
    if (totalWeight <= 0) {
      return candidates[0] || null;
    }
    let roll = randomRange(0, totalWeight);
    for (const candidate of candidates) {
      roll -= Math.max(0, finiteOr(candidate.weight, 0));
      if (roll <= 0) {
        return candidate;
      }
    }
    return candidates[candidates.length - 1] || null;
  }

  function planSurvivalAllowanceMobs(budget, options) {
    let remaining = Math.max(0, finiteOr(budget, 0));
    const entries = [];
    while (remaining >= survivalAllowanceMobCosts.alienoid && entries.length < 18) {
      const candidates = survivalAllowanceCandidateList(remaining, options);
      if (!candidates.length) {
        break;
      }
      const choice = chooseWeightedSurvivalCandidate(candidates);
      if (!choice || choice.cost > remaining) {
        break;
      }
      entries.push({
        kind: choice.kind,
        cost: choice.cost,
        eliteStars: choice.eliteStars || 0,
        eliteGroupSize: choice.eliteGroupSize || 1,
        isBoss: Boolean(choice.isBoss),
        bossStars: Math.max(0, Math.floor(finiteOr(choice.bossStars, 0)))
      });
      remaining -= choice.cost;
    }
    return entries;
  }

  function activeSurvivalSpawnPlayers() {
    const players = [];
    const seen = new Set();
    function add(source) {
      if (!source || !Number.isFinite(Number(source.x)) || !Number.isFinite(Number(source.y))) {
        return;
      }
      const playerId = String(source.playerId || source.id || "");
      if (playerId && seen.has(playerId)) {
        return;
      }
      if (playerId) {
        seen.add(playerId);
      }
      players.push({
        id: playerId,
        playerId,
        x: source.x,
        y: source.y,
        vx: finiteOr(source.vx, 0),
        vy: finiteOr(source.vy, 0),
        radius: Math.max(1, finiteOr(source.radius, player.radius)),
        score: Math.max(1, Math.round(finiteOr(source.score, 1)))
      });
    }

    if (!deathState.active && player.health > 0) {
      add({
        id: player.id,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        radius: player.radius,
        score: Math.max(finiteOr(player.score, 1), finiteOr(lifeStats.currentScore, 1))
      });
    }

    if (isPartyHost() && multiplayer.partyPlayerSnapshots.size) {
      const now = performance.now();
      for (const [playerId, entry] of multiplayer.partyPlayerSnapshots) {
        if (!entry || now - finiteOr(entry.receivedAt, 0) > 2200) {
          continue;
        }
        const source = entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : {};
        const remotePlayer = predictPartyRemotePlayer(normalizeRemotePlayerSnapshot(source.player || source), entry.receivedAt);
        if (!remotePlayer || remotePlayer.health <= 0) {
          continue;
        }
        add({ ...remotePlayer, id: playerId, playerId, score: finiteOr(remotePlayer.score, source.score || 1) });
      }
    }

    return players.slice(0, crazyGamesRoomMaxPlayers);
  }

  function activeSurvivalEncounterCounts() {
    const seen = new Set();
    const counts = { starter: 0, standard: 0, dangerous: 0, boss: 0, total: 0 };
    for (const mob of hostileCombatMobs()) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      const encounterId = mob.survivalEncounterId || mob.survivalCampId || "";
      if (mob.survivalEncounterType !== "camp" || !encounterId || seen.has(encounterId)) {
        continue;
      }
      seen.add(encounterId);
      const band = mob.survivalCampBand || "starter";
      counts[band] = Math.max(0, counts[band] || 0) + 1;
      counts.total += 1;
    }
    return counts;
  }

  function survivalCampCombatProgress() {
    return mobTierOrder.reduce((total, kind) => (
      total + Math.max(0, Math.floor(finiteOr(mobDefeatsByKind[kind], 0))) * survivalMobAllowanceCost(kind)
    ), 0);
  }

  function survivalCampBossProgressReady() {
    return mobTierOrder.some((kind) => (
      Math.max(0, Math.floor(finiteOr(mobBossDefeatsByKind[kind], 0))) > 0 ||
      Math.max(0, Math.floor(finiteOr(mobBossProgressByKind[kind], 0))) >= mobBossDefeatsToUnlock
    ));
  }

  function survivalCampBands(combatProgress, playerCount) {
    const playerBonus = Math.max(0, Math.min(crazyGamesRoomMaxPlayers - 1, Math.floor(finiteOr(playerCount, 1)) - 1));
    const standardUnlocked = combatProgress >= survivalMobAllowanceCost("alienoid") * 3;
    const dangerousUnlocked = combatProgress >= survivalMobAllowanceCost("ufo") * 4;
    const bossUnlocked = combatProgress >= survivalMobAllowanceCost("rambot") * 8 || survivalCampBossProgressReady();
    return [
      { id: "starter", target: 2 + playerBonus, minBudget: 50, maxBudget: 170, allowBosses: false },
      { id: "standard", target: standardUnlocked ? 1 + playerBonus : 0, minBudget: 150, maxBudget: 340, allowBosses: false },
      { id: "dangerous", target: dangerousUnlocked ? 1 + Math.floor(playerBonus / 2) : 0, minBudget: 340, maxBudget: 760, allowBosses: false },
      { id: "boss", target: bossUnlocked ? 1 : 0, minBudget: 700, maxBudget: 1600, allowBosses: true }
    ];
  }

  function chooseSurvivalCampBand(players) {
    const combatProgress = survivalCampCombatProgress();
    const counts = activeSurvivalEncounterCounts();
    for (const band of survivalCampBands(combatProgress, players.length || 1)) {
      if (band.target > 0 && (counts[band.id] || 0) < band.target) {
        const budget = clamp(randomRange(band.minBudget, band.maxBudget), 50, Math.max(50, band.maxBudget));
        return { ...band, budget: Math.max(50, Math.round(budget)), combatProgress };
      }
    }
    return null;
  }

  function nearestSurvivalAllowanceCampDistance(x, y) {
    let nearest = Infinity;
    const seen = new Set();
    for (const mob of hostileCombatMobs()) {
      const encounterId = mob && (mob.survivalEncounterId || mob.survivalCampId);
      if (!mob || mob.survivalEncounterType !== "camp" || !encounterId || seen.has(encounterId)) {
        continue;
      }
      seen.add(encounterId);
      const distance = Math.hypot(x - finiteOr(mob.survivalCampX, mob.x), y - finiteOr(mob.survivalCampY, mob.y));
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function survivalFullZoomOutRadius() {
    return Math.hypot(width || 1280, height || 720) / (2 * Math.max(0.001, finiteOr(cameraZoomMin, 0.08)));
  }

  function chooseSurvivalAllowanceSpawnPoint(players, options) {
    const sourcePlayers = Array.isArray(players) && players.length ? players : activeSurvivalSpawnPlayers();
    const source = leastPopulatedMobSpawnAnchor(sourcePlayers);
    const settings = options && typeof options === "object" ? options : {};
    const minDistance = Math.max(
      finiteOr(settings.minDistance, survivalCampSpawnMinDistance),
      survivalFullZoomOutRadius() + finiteOr(settings.zoomPadding, survivalCampSpawnDistancePadding)
    );
    const spread = Math.max(1, finiteOr(settings.spread, survivalCampSpawnDistanceSpread));
    const preferredSeparation = Math.max(0, finiteOr(settings.preferredSeparation, survivalCampAllowancePreferredSeparation));
    let best = null;
    let bestValid = null;

    for (let attempt = 0; attempt < 72; attempt += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const distance = randomRange(minDistance, minDistance + spread);
      const side = angle + Math.PI / 2;
      const x = source.x + Math.cos(angle) * distance + Math.cos(side) * randomRange(-720, 720);
      const y = source.y + Math.sin(angle) * distance + Math.sin(side) * randomRange(-720, 720);
      const nearestPlayer = nearestPartyAnchorDistance(x, y, sourcePlayers);
      const nearestCamp = nearestSurvivalAllowanceCampDistance(x, y);
      const spacing = Number.isFinite(nearestCamp) ? Math.min(nearestCamp, preferredSeparation * 2.4) : preferredSeparation * 1.8;
      const tooCloseToPlayer = Math.max(0, minDistance - nearestPlayer);
      const tooCloseToCamp = Math.max(0, preferredSeparation - spacing);
      const score = nearestPlayer * 0.24 + spacing * 0.82 - tooCloseToPlayer * 9 - tooCloseToCamp * 6;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (nearestPlayer >= minDistance && spacing >= preferredSeparation && (!bestValid || score > bestValid.score)) {
        bestValid = { x, y, score };
      }
    }

    return bestValid || best || { x: source.x + minDistance, y: source.y };
  }

  const survivalCampStructureWeights = [
    { type: "turret", weight: 5 },
    { type: "container", weight: 4 },
    { type: "battery", weight: 4 },
    { type: "shield-generator", weight: 3 },
    { type: "missile-launcher", weight: 3 },
    { type: "accumulator", weight: 2 },
    { type: "plating-block", weight: 1 }
  ];

  function survivalCampMobPressure(entries) {
    return (entries || []).reduce((total, entry) => (
      total +
      Math.max(1, Math.floor(finiteOr(entry && entry.eliteGroupSize, 1))) +
      (entry && entry.isBoss ? 3 + Math.max(0, Math.floor(finiteOr(entry.bossStars, 0))) : 0)
    ), 0);
  }

  function survivalCampStructureTargetCount(entries, budget) {
    const pressure = survivalCampMobPressure(entries);
    if (pressure < 3 && finiteOr(budget, 0) < 180) {
      return 0;
    }
    return clamp(Math.floor((pressure + 1) / 3), 1, 6);
  }

  function survivalCampBodyMasses(budget, structureTargetCount) {
    const targetStructures = Math.max(0, Math.floor(finiteOr(structureTargetCount, 0)));
    const bodyBudget = clamp(
      Math.max(finiteOr(budget, 50) * 0.45, targetStructures * randomRange(560, 760)),
      25,
      4200
    );
    const bodyCount = clamp(Math.floor(2 + Math.log2(Math.max(1, finiteOr(budget, 50)) / 150) + targetStructures * 0.55), 2, 8);
    const masses = [];
    let remaining = bodyBudget;
    for (let i = 0; i < bodyCount; i += 1) {
      const slotsLeft = bodyCount - i;
      const average = remaining / Math.max(1, slotsLeft);
      const mass = i === bodyCount - 1 ? remaining : clamp(randomRange(average * 0.55, average * 1.55), 1, remaining - (slotsLeft - 1));
      masses.push(Math.max(1, mass));
      remaining = Math.max(0, remaining - mass);
    }
    if (!masses.some((mass) => mass >= survivalCampRadarBodyMinMass)) {
      masses[0] = survivalCampRadarBodyMinMass;
    }
    for (let i = 0; i < Math.min(targetStructures, masses.length); i += 1) {
      masses[i] = Math.max(masses[i], randomRange(structurePlacementTierThreshold * 1.04, structurePlacementTierThreshold * 1.95));
    }
    return masses;
  }

  function spawnSurvivalAllowanceCampBodies(campId, campX, campY, budget, structureTargetCount) {
    const masses = survivalCampBodyMasses(budget, structureTargetCount);
    const bodies = [];
    for (let i = 0; i < masses.length; i += 1) {
      const angle = randomRange(0, Math.PI * 2) + i * 2.399963229728653;
      const distance = i === 0 ? randomRange(0, 140) : randomRange(260, survivalCampIdleRadius * 1.16);
      const body = createParticle(campX + Math.cos(angle) * distance, campY + Math.sin(angle) * distance, masses[i], randomParticleColor());
      const tangent = angle + Math.PI / 2;
      const driftSpeed = clamp(Math.sqrt(Math.max(1, masses[i])) * 2.4, 18, 82);
      body.vx = Math.cos(tangent) * driftSpeed + randomRange(-12, 12);
      body.vy = Math.sin(tangent) * driftSpeed + randomRange(-12, 12);
      body.survivalCampId = campId;
      body.survivalCampX = campX;
      body.survivalCampY = campY;
      body.survivalCampHomeX = body.x;
      body.survivalCampHomeY = body.y;
      body.survivalCampBody = true;
      if (bodies.length && body.tier && body.tier.name !== "star") {
        body.orbitHostId = bodies[0].id;
        body.orbitDirection = Math.random() < 0.5 ? -1 : 1;
        body.orbitStrength = 0.35;
      }
      particles.push(body);
      bodies.push(body);
    }
    return bodies;
  }

  function chooseSurvivalCampStructureType(index, band) {
    if (index === 0) {
      return randomRange(0, 1) < 0.58 ? "turret" : "container";
    }
    if (index === 1) {
      return randomRange(0, 1) < 0.5 ? "battery" : "shield-generator";
    }
    if (band && (band.id === "dangerous" || band.id === "boss") && randomRange(0, 1) < 0.34) {
      return "missile-launcher";
    }
    const totalWeight = survivalCampStructureWeights.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = randomRange(0, totalWeight);
    for (const entry of survivalCampStructureWeights) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.type;
      }
    }
    return "turret";
  }

  function survivalCampContainerLoot(band, budget) {
    const loot = normalizeTradeOffer(null);
    const bandScale = band && band.id === "boss" ? 2.2 : band && band.id === "dangerous" ? 1.6 : band && band.id === "standard" ? 1.2 : 0.85;
    const rolls = clamp(Math.floor(randomRange(2, 5) + Math.log2(Math.max(2, finiteOr(budget, 50))) * 0.45), 2, 7);
    for (let i = 0; i < rolls; i += 1) {
      const tech = techTypes[Math.floor(randomRange(0, techTypes.length))];
      if (!tech) {
        continue;
      }
      loot[tech.key] += Math.max(1, Math.floor(randomRange(1, 4 + bandScale * 3)));
    }
    return loot;
  }

  function createSurvivalCampStructure(type, body, angle, campId, campX, campY, band, budget) {
    const surfaceOffset = surfaceExtensionAtAngle(body, angle);
    const centerOffset = structureCenterOffset(type, surfaceOffset);
    const structure = {
      id: nextStructureId++,
      type,
      ownerPlayerId: "survival-camp:" + campId,
      bodyId: body.id,
      linkedBodyId: 0,
      angle,
      linkedAngle: 0,
      surfaceOffset,
      linkedSurfaceOffset: 0,
      x: body.x + Math.cos(angle) * (body.radius + centerOffset),
      y: body.y + Math.sin(angle) * (body.radius + centerOffset),
      x2: body.x,
      y2: body.y,
      restLength: 0,
      restCenterDx: 0,
      restCenterDy: 0,
      aimAngle: angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: randomRange(0.2, 1.2),
      burstTimer: 0,
      burstCooldown: randomRange(0.4, accumulatorBurstInterval),
      healPulse: 0,
      missileCharge: type === "missile-launcher" ? randomRange(0.25, 0.85) : 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: body.x,
      targetY: body.y,
      targetCount: 0,
      health: structureMaxHealth(type),
      maxHealth: structureMaxHealth(type),
      disabledTimer: 0,
      flash: 0,
      tech: type === "container" ? survivalCampContainerLoot(band, budget) : normalizeTradeOffer(null),
      tradeOffers: [],
      tradeOfferSeq: 1,
      tradeVessel: null,
      survivalCampId: campId,
      survivalCampX: campX,
      survivalCampY: campY,
      survivalCampAggroTimer: 0,
      survivalEncounterType: "camp",
      survivalEncounterId: campId,
      survivalCampBudget: budget,
      survivalCampBand: band && band.id || "",
      survivalTargetPlayerId: "",
      wobble: randomRange(0, Math.PI * 2)
    };
    return structure;
  }

  function spawnSurvivalCampStructures(campId, campX, campY, band, entries, bodies) {
    const targetCount = survivalCampStructureTargetCount(entries, band && band.budget);
    if (targetCount <= 0 || !Array.isArray(bodies) || !bodies.length) {
      return 0;
    }
    const hostBodies = bodies.filter((body) => isStructureHostBodyForType(body, "turret"));
    if (!hostBodies.length) {
      return 0;
    }
    const placed = [];
    for (let i = 0; i < targetCount; i += 1) {
      const type = chooseSurvivalCampStructureType(i, band);
      const body = hostBodies[i % hostBodies.length];
      if (!isStructureHostBodyForType(body, type)) {
        continue;
      }
      const angle = randomRange(0, Math.PI * 2) + i * 2.399963229728653;
      placed.push(createSurvivalCampStructure(type, body, angle, campId, campX, campY, band, band && band.budget));
    }
    structures.push(...placed);
    return placed.length;
  }

  function spawnSurvivalAllowanceMob(entry, x, y, overrides) {
    const settings = {
      ...(overrides && typeof overrides === "object" ? overrides : {}),
      isBoss: Boolean(entry.isBoss),
      bossBaseKind: entry.isBoss ? entry.kind : "",
      bossStars: Math.max(0, Math.floor(finiteOr(entry.bossStars, 0))),
      eliteStars: entry.isBoss ? 0 : entry.eliteStars,
      eliteGroupSize: entry.isBoss ? 1 : entry.eliteGroupSize
    };
    const mob = createMobByKind(entry.kind, x, y, settings);
    mobCollectionByKind(entry.kind).push(mob);
    return mob;
  }

  function spawnSurvivalAllowanceCamp(band, players) {
    const entries = planSurvivalAllowanceMobs(band.budget, { allowBosses: band.allowBosses });
    if (!entries.length) {
      return false;
    }
    const center = chooseSurvivalAllowanceSpawnPoint(players, {
      minDistance: survivalCampSpawnMinDistance,
      zoomPadding: survivalCampSpawnDistancePadding,
      spread: survivalCampSpawnDistanceSpread,
      preferredSeparation: survivalCampAllowancePreferredSeparation
    });
    const campId = "survival-camp-" + nextSurvivalCampId++;
    const structureTargetCount = survivalCampStructureTargetCount(entries, band.budget);
    const campBodies = spawnSurvivalAllowanceCampBodies(campId, center.x, center.y, band.budget, structureTargetCount);
    spawnSurvivalCampStructures(campId, center.x, center.y, band, entries, campBodies);

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const angle = randomRange(0, Math.PI * 2) + i * 2.399963229728653;
      const radius = randomRange(180, survivalCampIdleRadius);
      const mob = spawnSurvivalAllowanceMob(
        entry,
        center.x + Math.cos(angle) * radius + randomRange(-80, 80),
        center.y + Math.sin(angle) * radius + randomRange(-80, 80),
        {
          survivalCampId: campId,
          survivalCampX: center.x,
          survivalCampY: center.y,
          survivalCampLeashRadius: survivalCampLeashRadius,
          survivalCampAggroTimer: 0,
          survivalCampReturning: false,
          survivalCampSlotAngle: angle,
          survivalCampSlotRadius: radius,
          survivalEncounterType: "camp",
          survivalEncounterId: campId,
          survivalCampBudget: band.budget,
          survivalCampBand: band.id
        }
      );
      mob.vx += Math.cos(angle + Math.PI / 2) * randomRange(10, 34);
      mob.vy += Math.sin(angle + Math.PI / 2) * randomRange(10, 34);
    }
    return true;
  }

  function updateSurvivalAllowanceCamps(nowSeconds, players) {
    if (nowSeconds < finiteOr(survivalSpawnState.nextCampCheckTick, survivalSpawnState.nextCampCheckAt || 0)) {
      return;
    }
    survivalSpawnState.nextCampCheckTick = nowSeconds + survivalCampCheckInterval;
    const band = chooseSurvivalCampBand(players);
    if (band) {
      spawnSurvivalAllowanceCamp(band, players);
    }
  }
