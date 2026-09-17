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
      nextCampCheckTick: Math.max(0, Math.floor(finiteOr(snapshot.nextCampCheckTick, snapshot.nextCampCheckAt || 0))),
      exploredInitialized: Boolean(snapshot.exploredInitialized),
      exploredMinX: finiteOr(snapshot.exploredMinX, 0),
      exploredMaxX: finiteOr(snapshot.exploredMaxX, 0),
      exploredMinY: finiteOr(snapshot.exploredMinY, 0),
      exploredMaxY: finiteOr(snapshot.exploredMaxY, 0)
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
    const threat = Math.max(0, finiteOr(settings.scoreThreat, 0));
    const preferredCost = Math.max(
      SURVIVAL_ALLOWANCE_MOB_COSTS.alienoid,
      budget * clamp(0.24 + threat * 0.035, 0.24, 0.62)
    );
    const candidates = [];
    for (let kindIndex = 0; kindIndex < MOB_TIER_ORDER.length; kindIndex += 1) {
      const kind = MOB_TIER_ORDER[kindIndex];
      const baseCost = survivalMobAllowanceCost(kind);
      const tierLift = Math.pow(kindIndex + 1, clamp(threat * 0.09, 0, 1));
      if (baseCost <= budget) {
        const fit = Math.exp(-Math.abs(Math.log(baseCost / preferredCost)) * 1.25);
        candidates.push({ kind, cost: baseCost, eliteStars: 0, eliteGroupSize: 1, isBoss: false, weight: fit * tierLift });
      }
      for (let stars = 1; stars <= MOB_ELITE_MAX_STARS; stars += 1) {
        const cost = survivalMobAllowanceCost(kind, { eliteStars: stars });
        if (cost <= budget) {
          const fit = Math.exp(-Math.abs(Math.log(cost / preferredCost)) * 1.12);
          candidates.push({
            kind,
            cost,
            eliteStars: stars,
            eliteGroupSize: stars * MOB_ELITE_COMPRESSION_SIZE,
            isBoss: false,
            weight: (0.32 + Math.min(0.5, threat * 0.055)) * fit * tierLift
          });
        }
      }
      if (allowBosses) {
        for (let bossStars = 0; bossStars <= 2; bossStars += 1) {
          const cost = survivalMobAllowanceCost(kind, { isBoss: true, bossStars });
          if (cost <= budget) {
            const fit = Math.exp(-Math.abs(Math.log(cost / preferredCost)) * 0.95);
            candidates.push({
              kind,
              cost,
              eliteStars: 0,
              eliteGroupSize: 1,
              isBoss: true,
              bossStars,
              weight: (0.08 + Math.min(0.72, threat * 0.075)) * fit * tierLift
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
    if (settings.forceBoss) {
      const bossCandidates = survivalAllowanceCandidateList(remaining, settings)
        .filter((candidate) => candidate.isBoss)
        .sort((a, b) => (
          MOB_TIER_ORDER.indexOf(b.kind) - MOB_TIER_ORDER.indexOf(a.kind) ||
          finiteOr(a.bossStars, 0) - finiteOr(b.bossStars, 0)
        ));
      const boss = bossCandidates[0];
      if (boss) {
        entries.push({
          kind: boss.kind,
          cost: boss.cost,
          eliteStars: 0,
          eliteGroupSize: 1,
          isBoss: true,
          bossStars: Math.max(0, Math.floor(finiteOr(boss.bossStars, 0)))
        });
        remaining -= boss.cost;
      }
    }
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

  function activeSurvivalEncounterCounts(world, players) {
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
      if (Array.isArray(players) && players.length && nearestPlayerDistance(
        finiteOr(mob.survivalCampX, mob.x),
        finiteOr(mob.survivalCampY, mob.y),
        players
      ) > SURVIVAL_CAMP_ACTIVE_RADIUS) {
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

  function updateSurvivalExploration(spawnState, players) {
    if (!spawnState || !Array.isArray(players) || !players.length) {
      return;
    }
    for (const player of players) {
      const x = finiteOr(player && player.x, 0);
      const y = finiteOr(player && player.y, 0);
      if (!spawnState.exploredInitialized) {
        Object.assign(spawnState, { exploredInitialized: true, exploredMinX: x, exploredMaxX: x, exploredMinY: y, exploredMaxY: y });
        continue;
      }
      spawnState.exploredMinX = Math.min(spawnState.exploredMinX, x);
      spawnState.exploredMaxX = Math.max(spawnState.exploredMaxX, x);
      spawnState.exploredMinY = Math.min(spawnState.exploredMinY, y);
      spawnState.exploredMaxY = Math.max(spawnState.exploredMaxY, y);
    }
  }

  function survivalExploredSpan(spawnState) {
    if (!spawnState || !spawnState.exploredInitialized) {
      return 0;
    }
    return Math.hypot(
      Math.max(0, finiteOr(spawnState.exploredMaxX, 0) - finiteOr(spawnState.exploredMinX, 0)),
      Math.max(0, finiteOr(spawnState.exploredMaxY, 0) - finiteOr(spawnState.exploredMinY, 0))
    );
  }

  function survivalScoreThreat(players) {
    const totalScore = (players || []).reduce((total, player) => total + Math.max(0, finiteOr(player && player.score, 0)), 0);
    return Math.max(0, Math.log2(1 + totalScore / 6000));
  }

  function survivalScoreBudgetScale(state, scoreThreat) {
    const difficultyScale = finiteOr(difficultyMobSettings(state).survivalBudgetScale, 1);
    return difficultyScale * (1 + 0.075 * Math.pow(Math.max(0, scoreThreat), 1.35));
  }

  function survivalCampBands(state, world, combatProgress, playerCount, scoreThreat, spawnState) {
    const playerBonus = Math.max(0, Math.min(MAX_PLAYERS - 1, Math.floor(finiteOr(playerCount, 1)) - 1));
    const effectiveProgress = combatProgress + Math.max(0, scoreThreat) * 300;
    const standardUnlocked = effectiveProgress >= survivalMobAllowanceCost("alienoid") * 3;
    const dangerousUnlocked = effectiveProgress >= survivalMobAllowanceCost("ufo") * 4;
    const bossUnlocked = effectiveProgress >= survivalMobAllowanceCost("rambot") * 8 || survivalCampBossProgressReady(world);
    const difficultySettings = difficultyMobSettings(state);
    const difficultyExpansion = finiteOr(difficultySettings.survivalCampScale, 1) >= 1.1 ? 1 : 0;
    const expansion = clamp(
      Math.floor(survivalExploredSpan(spawnState) / SURVIVAL_CAMP_EXPANSION_DISTANCE) + difficultyExpansion,
      0,
      SURVIVAL_CAMP_MAX_EXPANSION
    );
    const extra = (index) => Math.floor((expansion + 3 - index) / 4);
    const budgetScale = survivalScoreBudgetScale(state, scoreThreat);
    const band = (id, target, minBudget, maxBudget, allowBosses, index) => ({
      id,
      target: target > 0 ? target + extra(index) : 0,
      minBudget: Math.round(minBudget * budgetScale),
      maxBudget: Math.round(maxBudget * budgetScale),
      allowBosses,
      scoreThreat,
      forceBoss: id === "boss" && scoreThreat >= 3.2
    });
    return [
      band("starter", 2 + playerBonus, 50, 180, false, 0),
      band("standard", standardUnlocked ? 1 + playerBonus : 0, 150, 380, false, 1),
      band("dangerous", dangerousUnlocked ? 1 + Math.floor(playerBonus / 2) : 0, 340, 900, false, 2),
      band("boss", bossUnlocked ? 1 : 0, 850, 3000, true, 3)
    ];
  }

  function chooseSurvivalCampBand(state, world, players, seedHolder, spawnState) {
    const combatProgress = survivalCampCombatProgress(world);
    const scoreThreat = survivalScoreThreat(players);
    const counts = activeSurvivalEncounterCounts(world, players);
    for (const band of survivalCampBands(state, world, combatProgress, players.length || 1, scoreThreat, spawnState)) {
      if (band.target > 0 && (counts[band.id] || 0) < band.target) {
        const budget = clamp(randomRange(seedHolder, band.minBudget, band.maxBudget), 50, Math.max(50, band.maxBudget));
        return { ...band, budget: Math.max(50, Math.round(budget)), combatProgress, scoreThreat };
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
