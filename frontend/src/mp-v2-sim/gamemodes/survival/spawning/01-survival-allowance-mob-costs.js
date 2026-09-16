  const SURVIVAL_ALLOWANCE_MOB_COSTS = {
    alienoid: 50,
    ufo: 150,
    rambot: 240,
    engineer: 300,
    tesla: 360,
    satellite: 480,
    rocket: 520,
    fighter: 700
  };

  function normalizeSurvivalSpawnState(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    return {
      nextCampCheckTick: Math.max(0, Math.floor(finiteOr(snapshot.nextCampCheckTick, snapshot.nextCampCheckAt || 0)))
    };
  }

  function ensureSurvivalSpawnState(world) {
    if (!world.survivalSpawnState || typeof world.survivalSpawnState !== "object") {
      world.survivalSpawnState = normalizeSurvivalSpawnState(null);
    }
    world.survivalSpawnState = normalizeSurvivalSpawnState(world.survivalSpawnState);
    return world.survivalSpawnState;
  }

  function serializeSurvivalSpawnState(source) {
    return normalizeSurvivalSpawnState(source);
  }

  function survivalMobAllowanceCost(kind, options) {
    const baseCost = SURVIVAL_ALLOWANCE_MOB_COSTS[kind] || SURVIVAL_ALLOWANCE_MOB_COSTS.alienoid;
    const settings = options && typeof options === "object" ? options : {};
    if (settings.isBoss) {
      return Math.round(baseCost * (12 + Math.max(0, Math.floor(finiteOr(settings.bossStars, 0))) * 4));
    }
    const stars = mobEliteStarRankValue(settings.eliteStars);
    if (stars > 0) {
      return Math.round(baseCost * stars * MOB_ELITE_COMPRESSION_SIZE * 1.15);
    }
    return baseCost;
  }

  function survivalAllowanceCandidateList(budget, options) {
    const settings = options && typeof options === "object" ? options : {};
    const allowBosses = settings.allowBosses !== false;
    const candidates = [];
    for (const kind of MOB_TIER_ORDER) {
      const baseCost = survivalMobAllowanceCost(kind);
      if (baseCost <= budget) {
        candidates.push({ kind, cost: baseCost, eliteStars: 0, eliteGroupSize: 1, isBoss: false, weight: 1 / Math.pow(baseCost, 1.15) });
      }
      for (let stars = 1; stars <= MOB_ELITE_MAX_STARS; stars += 1) {
        const cost = survivalMobAllowanceCost(kind, { eliteStars: stars });
        if (cost <= budget) {
          candidates.push({
            kind,
            cost,
            eliteStars: stars,
            eliteGroupSize: stars * MOB_ELITE_COMPRESSION_SIZE,
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

  function chooseWeightedSurvivalCandidate(candidates, seedHolder) {
    const totalWeight = candidates.reduce((sum, candidate) => sum + Math.max(0, finiteOr(candidate.weight, 0)), 0);
    if (totalWeight <= 0) {
      return candidates[0] || null;
    }
    let roll = randomRange(seedHolder, 0, totalWeight);
    for (const candidate of candidates) {
      roll -= Math.max(0, finiteOr(candidate.weight, 0));
      if (roll <= 0) {
        return candidate;
      }
    }
    return candidates[candidates.length - 1] || null;
  }

  function planSurvivalAllowanceMobs(budget, options) {
    const settings = options && typeof options === "object" ? options : {};
    const seedHolder = settings.seedHolder || { seed: 1 };
    let remaining = Math.max(0, finiteOr(budget, 0));
    const entries = [];
    while (remaining >= SURVIVAL_ALLOWANCE_MOB_COSTS.alienoid && entries.length < 18) {
      const candidates = survivalAllowanceCandidateList(remaining, settings);
      if (!candidates.length) {
        break;
      }
      const choice = chooseWeightedSurvivalCandidate(candidates, seedHolder);
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

  function activeSurvivalSpawnPlayers(state) {
    return Object.values(state.players || {}).filter((entry) => (
      entry &&
      finiteOr(entry.health, 0) > 0 &&
      !entry.spacecraftInterior &&
      Number.isFinite(Number(entry.x)) &&
      Number.isFinite(Number(entry.y))
    )).slice(0, MAX_PLAYERS).map((player) => ({
      ...player,
      id: String(player.id || ""),
      score: Math.max(1, Math.round(finiteOr(player.score, 1)))
    }));
  }

  function activeSurvivalEncounterCounts(world) {
    const seen = new Set();
    const counts = { starter: 0, standard: 0, dangerous: 0, boss: 0, total: 0 };
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob) || mob.survivalEncounterType !== "camp") {
        continue;
      }
      const encounterId = mob.survivalEncounterId || mob.survivalCampId || "";
      if (!encounterId || seen.has(encounterId)) {
        continue;
      }
      seen.add(encounterId);
      const band = mob.survivalCampBand || "starter";
      counts[band] = Math.max(0, counts[band] || 0) + 1;
      counts.total += 1;
    }
    return counts;
  }

  function survivalCampCombatProgress(world) {
    const defeats = world && world.mobDefeatsByKind && typeof world.mobDefeatsByKind === "object" ? world.mobDefeatsByKind : {};
    return MOB_TIER_ORDER.reduce((total, kind) => (
      total + Math.max(0, Math.floor(finiteOr(defeats[kind], 0))) * survivalMobAllowanceCost(kind)
    ), 0);
  }

  function survivalCampBossProgressReady(world) {
    const bossDefeats = world && world.mobBossDefeatsByKind && typeof world.mobBossDefeatsByKind === "object" ? world.mobBossDefeatsByKind : {};
    const bossProgress = world && world.mobBossProgressByKind && typeof world.mobBossProgressByKind === "object" ? world.mobBossProgressByKind : {};
    return MOB_TIER_ORDER.some((kind) => (
      Math.max(0, Math.floor(finiteOr(bossDefeats[kind], 0))) > 0 ||
      Math.max(0, Math.floor(finiteOr(bossProgress[kind], 0))) >= MOB_BOSS_DEFEATS_TO_UNLOCK
    ));
  }

  function survivalCampBands(world, combatProgress, playerCount) {
    const playerBonus = Math.max(0, Math.min(MAX_PLAYERS - 1, Math.floor(finiteOr(playerCount, 1)) - 1));
    const standardUnlocked = combatProgress >= survivalMobAllowanceCost("alienoid") * 3;
    const dangerousUnlocked = combatProgress >= survivalMobAllowanceCost("ufo") * 4;
    const bossUnlocked = combatProgress >= survivalMobAllowanceCost("rambot") * 8 || survivalCampBossProgressReady(world);
    return [
      { id: "starter", target: 2 + playerBonus, minBudget: 50, maxBudget: 170, allowBosses: false },
      { id: "standard", target: standardUnlocked ? 1 + playerBonus : 0, minBudget: 150, maxBudget: 340, allowBosses: false },
      { id: "dangerous", target: dangerousUnlocked ? 1 + Math.floor(playerBonus / 2) : 0, minBudget: 340, maxBudget: 760, allowBosses: false },
      { id: "boss", target: bossUnlocked ? 1 : 0, minBudget: 700, maxBudget: 1600, allowBosses: true }
    ];
  }

  function chooseSurvivalCampBand(world, players, seedHolder) {
    const combatProgress = survivalCampCombatProgress(world);
    const counts = activeSurvivalEncounterCounts(world);
    for (const band of survivalCampBands(world, combatProgress, players.length || 1)) {
      if (band.target > 0 && (counts[band.id] || 0) < band.target) {
        const budget = clamp(randomRange(seedHolder, band.minBudget, band.maxBudget), 50, Math.max(50, band.maxBudget));
        return { ...band, budget: Math.max(50, Math.round(budget)), combatProgress };
      }
    }
    return null;
  }

  function nearestSurvivalAllowanceCampDistance(world, x, y) {
    let nearest = Infinity;
    const seen = new Set();
    for (const mob of allCombatMobs(world)) {
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

  function chooseSurvivalAllowanceSpawnPoint(world, players, seedHolder, options) {
    const sourcePlayers = Array.isArray(players) && players.length ? players : [{ x: 0, y: 0, vx: 0, vy: 0 }];
    const source = leastPopulatedMobAnchor(world, sourcePlayers);
    const settings = options && typeof options === "object" ? options : {};
    const minDistance = Math.max(
      finiteOr(settings.minDistance, SURVIVAL_CAMP_SPAWN_MIN_DISTANCE),
      MOB_SPAWN_FULLY_ZOOMED_OUT_VIEW_RADIUS + finiteOr(settings.zoomPadding, SURVIVAL_CAMP_SPAWN_DISTANCE_PADDING)
    );
    const spread = Math.max(1, finiteOr(settings.spread, SURVIVAL_CAMP_SPAWN_DISTANCE_SPREAD));
    const preferredSeparation = Math.max(0, finiteOr(settings.preferredSeparation, SURVIVAL_CAMP_ALLOWANCE_PREFERRED_SEPARATION));
    let best = null;
    let bestValid = null;

    for (let attempt = 0; attempt < 72; attempt += 1) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const distance = randomRange(seedHolder, minDistance, minDistance + spread);
      const side = angle + Math.PI / 2;
      const x = source.x + Math.cos(angle) * distance + Math.cos(side) * randomRange(seedHolder, -720, 720);
      const y = source.y + Math.sin(angle) * distance + Math.sin(side) * randomRange(seedHolder, -720, 720);
      const nearestPlayer = nearestPlayerDistance(x, y, sourcePlayers);
      const nearestCamp = nearestSurvivalAllowanceCampDistance(world, x, y);
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

  const SURVIVAL_CAMP_STRUCTURE_WEIGHTS = [
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

  function survivalCampBodyMasses(budget, structureTargetCount, seedHolder) {
    const targetStructures = Math.max(0, Math.floor(finiteOr(structureTargetCount, 0)));
    const bodyBudget = clamp(
      Math.max(finiteOr(budget, 50) * 0.45, targetStructures * randomRange(seedHolder, 560, 760)),
      25,
      4200
    );
    const bodyCount = clamp(Math.floor(2 + Math.log2(Math.max(1, finiteOr(budget, 50)) / 150) + targetStructures * 0.55), 2, 8);
    const masses = [];
    let remaining = bodyBudget;
    for (let i = 0; i < bodyCount; i += 1) {
      const slotsLeft = bodyCount - i;
      const average = remaining / Math.max(1, slotsLeft);
      const mass = i === bodyCount - 1
        ? remaining
        : clamp(randomRange(seedHolder, average * 0.55, average * 1.55), 1, remaining - (slotsLeft - 1));
      masses.push(Math.max(1, mass));
      remaining = Math.max(0, remaining - mass);
    }
    if (!masses.some((mass) => mass >= SURVIVAL_CAMP_RADAR_BODY_MIN_MASS)) {
      masses[0] = SURVIVAL_CAMP_RADAR_BODY_MIN_MASS;
    }
    for (let i = 0; i < Math.min(targetStructures, masses.length); i += 1) {
      masses[i] = Math.max(masses[i], randomRange(seedHolder, STRUCTURE_PLACEMENT_TIER_THRESHOLD * 1.04, STRUCTURE_PLACEMENT_TIER_THRESHOLD * 1.95));
    }
    return masses;
  }

  function spawnSurvivalAllowanceCampBodies(state, campId, campX, campY, budget, structureTargetCount, seedHolder) {
    const world = state.world;
    const masses = survivalCampBodyMasses(budget, structureTargetCount, seedHolder);
    const bodies = [];
    for (let i = 0; i < masses.length; i += 1) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2) + i * 2.399963229728653;
      const distance = i === 0 ? randomRange(seedHolder, 0, 140) : randomRange(seedHolder, 260, SURVIVAL_CAMP_IDLE_RADIUS * 1.16);
      const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
      const body = normalizeParticle({
        id,
        x: campX + Math.cos(angle) * distance,
        y: campY + Math.sin(angle) * distance,
        mass: masses[i],
        color: randomParticleColor(seedHolder),
        survivalCampId: campId,
        survivalCampX: campX,
        survivalCampY: campY,
        survivalCampHomeX: campX + Math.cos(angle) * distance,
        survivalCampHomeY: campY + Math.sin(angle) * distance,
        survivalCampBody: true
      }, id, seedHolder);
      const tangent = angle + Math.PI / 2;
      const driftSpeed = clamp(Math.sqrt(Math.max(1, masses[i])) * 2.4, 18, 82);
      body.vx = Math.cos(tangent) * driftSpeed + randomRange(seedHolder, -12, 12);
      body.vy = Math.sin(tangent) * driftSpeed + randomRange(seedHolder, -12, 12);
      if (bodies.length && body.tier && body.tier.name !== "star") {
        body.orbitHostId = bodies[0].id;
        body.orbitDirection = randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1;
        body.orbitStrength = 0.35;
      }
      world.particles.push(body);
      bodies.push(body);
      world.nextParticleId = Math.max(world.nextParticleId, body.id + 1);
    }
    return bodies;
  }

  function chooseSurvivalCampStructureType(index, band, seedHolder) {
    if (index === 0) {
      return randomRange(seedHolder, 0, 1) < 0.58 ? "turret" : "container";
    }
    if (index === 1) {
      return randomRange(seedHolder, 0, 1) < 0.5 ? "battery" : "shield-generator";
    }
    if (band && (band.id === "dangerous" || band.id === "boss") && randomRange(seedHolder, 0, 1) < 0.34) {
      return "missile-launcher";
    }
    const totalWeight = SURVIVAL_CAMP_STRUCTURE_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = randomRange(seedHolder, 0, totalWeight);
    for (const entry of SURVIVAL_CAMP_STRUCTURE_WEIGHTS) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.type;
      }
    }
    return "turret";
  }

  function survivalCampContainerLoot(band, budget, seedHolder) {
    const loot = cloneTechInventory(null);
    const bandScale = band && band.id === "boss" ? 2.2 : band && band.id === "dangerous" ? 1.6 : band && band.id === "standard" ? 1.2 : 0.85;
    const rolls = clamp(Math.floor(randomRange(seedHolder, 2, 5) + Math.log2(Math.max(2, finiteOr(budget, 50))) * 0.45), 2, 7);
    for (let i = 0; i < rolls; i += 1) {
      const key = TECH_KEYS[Math.floor(randomRange(seedHolder, 0, TECH_KEYS.length))];
      if (key) {
        loot[key] += Math.max(1, Math.floor(randomRange(seedHolder, 1, 4 + bandScale * 3)));
      }
    }
    return loot;
  }

  function nextCampStructureId(world) {
    const nextId = Math.max(
      1,
      Math.floor(finiteOr(world.nextStructureId, 1)),
      Array.isArray(world.structures)
        ? world.structures.reduce((largest, structure) => Math.max(largest, Math.floor(finiteOr(structure && structure.id, 0)) + 1), 1)
        : 1
    );
    world.nextStructureId = nextId + 1;
    return nextId;
  }

  function createSurvivalCampStructure(state, type, body, angle, campId, campX, campY, band, budget, seedHolder) {
    const world = state.world;
    const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
    const centerOffset = structureCenterOffset(type, surfaceOffset);
    const radius = finiteOr(body.radius, radiusFromMass(body.mass));
    const maxHealth = structureMaxHealth(type);
    const x = body.x + Math.cos(angle) * (radius + centerOffset);
    const y = body.y + Math.sin(angle) * (radius + centerOffset);
    return {
      id: nextCampStructureId(world),
      type,
      ownerPlayerId: "survival-camp:" + campId,
      bodyId: body.id,
      linkedBodyId: 0,
      angle,
      linkedAngle: 0,
      surfaceOffset,
      linkedSurfaceOffset: 0,
      x,
      y,
      x2: x,
      y2: y,
      restLength: 0,
      restCenterDx: 0,
      restCenterDy: 0,
      aimAngle: angle,
      deploy: 0,
      thrustAmount: 0,
      thrustDirection: 1,
      shootCooldown: randomRange(seedHolder, 0.2, 1.2),
      burstTimer: 0,
      burstCooldown: randomRange(seedHolder, 0.4, ACCUMULATOR_BURST_INTERVAL),
      healPulse: 0,
      missileCharge: type === "missile-launcher" ? randomRange(seedHolder, 0.25, 0.85) : 0,
      lockTimer: 0,
      beepTimer: 0,
      targetX: x,
      targetY: y,
      targetCount: 0,
      health: maxHealth,
      maxHealth,
      disabledTimer: 0,
      flash: 0,
      tech: type === "container" ? survivalCampContainerLoot(band, budget, seedHolder) : cloneTechInventory(null),
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
      wobble: randomRange(seedHolder, 0, Math.PI * 2)
    };
  }

  function spawnSurvivalCampStructures(state, campId, campX, campY, band, entries, bodies, seedHolder) {
    const world = state.world;
    if (!Array.isArray(world.structures)) {
      world.structures = [];
    }
    const targetCount = survivalCampStructureTargetCount(entries, band && band.budget);
    if (targetCount <= 0 || !Array.isArray(bodies) || !bodies.length) {
      return 0;
    }
    const hostBodies = bodies.filter((body) => isStructureHostBodyForType(body, "turret"));
    if (!hostBodies.length) {
      return 0;
    }
    let placed = 0;
    for (let i = 0; i < targetCount; i += 1) {
      const type = chooseSurvivalCampStructureType(i, band, seedHolder);
      const body = hostBodies[i % hostBodies.length];
      if (!isStructureHostBodyForType(body, type)) {
        continue;
      }
      const angle = randomRange(seedHolder, 0, Math.PI * 2) + i * 2.399963229728653;
      world.structures.push(createSurvivalCampStructure(state, type, body, angle, campId, campX, campY, band, band && band.budget, seedHolder));
      placed += 1;
    }
    return placed;
  }

  function spawnSurvivalAllowanceMob(state, entry, x, y, seedHolder, overrides) {
    const settings = {
      ...(overrides && typeof overrides === "object" ? overrides : {}),
      isBoss: Boolean(entry.isBoss),
      bossBaseKind: entry.isBoss ? entry.kind : "",
      bossStars: Math.max(0, Math.floor(finiteOr(entry.bossStars, 0))),
      eliteStars: entry.isBoss ? 0 : entry.eliteStars,
      eliteGroupSize: entry.isBoss ? 1 : entry.eliteGroupSize
    };
    const mob = createMob(state.world, entry.kind, x, y, seedHolder, settings);
    mobCollectionByKind(state.world, entry.kind).push(mob);
    return mob;
  }

  function spawnSurvivalAllowanceCamp(state, band, players, seedHolder) {
    const entries = planSurvivalAllowanceMobs(band.budget, { allowBosses: band.allowBosses, seedHolder });
    if (!entries.length) {
      return false;
    }
    const center = chooseSurvivalAllowanceSpawnPoint(state.world, players, seedHolder, {
      minDistance: SURVIVAL_CAMP_SPAWN_MIN_DISTANCE,
      zoomPadding: SURVIVAL_CAMP_SPAWN_DISTANCE_PADDING,
      spread: SURVIVAL_CAMP_SPAWN_DISTANCE_SPREAD,
      preferredSeparation: SURVIVAL_CAMP_ALLOWANCE_PREFERRED_SEPARATION
    });
    const campIdNumber = Math.max(1, Math.floor(finiteOr(state.world.nextSurvivalCampId, 1)));
    const campId = "survival-camp-" + campIdNumber;
    state.world.nextSurvivalCampId = campIdNumber + 1;
    const structureTargetCount = survivalCampStructureTargetCount(entries, band.budget);
    const campBodies = spawnSurvivalAllowanceCampBodies(state, campId, center.x, center.y, band.budget, structureTargetCount, seedHolder);
    spawnSurvivalCampStructures(state, campId, center.x, center.y, band, entries, campBodies, seedHolder);

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const angle = randomRange(seedHolder, 0, Math.PI * 2) + i * 2.399963229728653;
      const radius = randomRange(seedHolder, 180, SURVIVAL_CAMP_IDLE_RADIUS);
      const mob = spawnSurvivalAllowanceMob(
        state,
        entry,
        center.x + Math.cos(angle) * radius + randomRange(seedHolder, -80, 80),
        center.y + Math.sin(angle) * radius + randomRange(seedHolder, -80, 80),
        seedHolder,
        {
          survivalCampId: campId,
          survivalCampX: center.x,
          survivalCampY: center.y,
          survivalCampLeashRadius: SURVIVAL_CAMP_LEASH_RADIUS,
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
      mob.vx += Math.cos(angle + Math.PI / 2) * randomRange(seedHolder, 10, 34);
      mob.vy += Math.sin(angle + Math.PI / 2) * randomRange(seedHolder, 10, 34);
    }
    state.events.push({ type: "mob.camp.spawned", campId, band: band.id, budget: band.budget, count: entries.length, tick: state.tick });
    return true;
  }

  function updateSurvivalAllowanceCamps(state, players, seedHolder) {
    const world = state.world;
    const spawnState = ensureSurvivalSpawnState(world);
    const nowTick = Math.max(0, Math.floor(finiteOr(state.tick, 0)));
    if (nowTick < finiteOr(spawnState.nextCampCheckTick, 0)) {
      return;
    }
    spawnState.nextCampCheckTick = nowTick + Math.round(SURVIVAL_CAMP_CHECK_INTERVAL * TICK_RATE);
    const band = chooseSurvivalCampBand(world, players, seedHolder);
    if (band) {
      spawnSurvivalAllowanceCamp(state, band, players, seedHolder);
    }
  }
