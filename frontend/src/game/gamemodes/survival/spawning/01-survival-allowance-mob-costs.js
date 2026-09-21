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
    const threat = Math.max(0, finiteOr(settings.scoreThreat, 0));
    const preferredCost = Math.max(
      survivalAllowanceMobCosts.alienoid,
      budget * clamp(0.24 + threat * 0.035, 0.24, 0.62)
    );
    const candidates = [];
    for (let kindIndex = 0; kindIndex < mobTierOrder.length; kindIndex += 1) {
      const kind = mobTierOrder[kindIndex];
      const baseCost = survivalMobAllowanceCost(kind);
      const tierLift = Math.pow(kindIndex + 1, clamp(threat * 0.09, 0, 1));
      if (baseCost <= budget) {
        const fit = Math.exp(-Math.abs(Math.log(baseCost / preferredCost)) * 1.25);
        candidates.push({ kind, cost: baseCost, eliteStars: 0, eliteGroupSize: 1, isBoss: false, weight: fit * tierLift });
      }
      for (let stars = 1; stars <= mobEliteMaxStars; stars += 1) {
        const cost = survivalMobAllowanceCost(kind, { eliteStars: stars });
        if (cost <= budget) {
          const fit = Math.exp(-Math.abs(Math.log(cost / preferredCost)) * 1.12);
          candidates.push({
            kind,
            cost,
            eliteStars: stars,
            eliteGroupSize: stars * mobEliteCompressionSize,
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
    const settings = options && typeof options === "object" ? options : {};
    let remaining = Math.max(0, finiteOr(budget, 0));
    const entries = [];
    if (settings.forceBoss) {
      const bossCandidates = survivalAllowanceCandidateList(remaining, settings)
        .filter((candidate) => candidate.isBoss)
        .sort((a, b) => (
          mobTierOrder.indexOf(b.kind) - mobTierOrder.indexOf(a.kind) ||
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
    const signatureKinds = Array.isArray(settings.signatureKinds)
      ? settings.signatureKinds.filter((kind) => mobTierOrder.includes(kind) && survivalMobAllowanceCost(kind) <= remaining)
      : [];
    if (signatureKinds.length) {
      const signatureKind = signatureKinds[Math.floor(randomRange(0, signatureKinds.length))];
      const signatureCost = survivalMobAllowanceCost(signatureKind);
      entries.push({
        kind: signatureKind,
        cost: signatureCost,
        eliteStars: 0,
        eliteGroupSize: 1,
        isBoss: false,
        bossStars: 0
      });
      remaining -= signatureCost;
    }
    while (remaining >= survivalAllowanceMobCosts.alienoid && entries.length < 18) {
      const candidates = survivalAllowanceCandidateList(remaining, settings);
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

  function activeSurvivalEncounterCounts(players) {
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
      if (Array.isArray(players) && players.length && nearestPartyAnchorDistance(
        finiteOr(mob.survivalCampX, mob.x),
        finiteOr(mob.survivalCampY, mob.y),
        players
      ) > survivalCampActiveRadius) {
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

  function updateSurvivalExploration(players) {
    if (!Array.isArray(players) || !players.length) {
      return;
    }
    for (const entry of players) {
      const x = finiteOr(entry && entry.x, 0);
      const y = finiteOr(entry && entry.y, 0);
      if (!survivalSpawnState.exploredInitialized) {
        Object.assign(survivalSpawnState, { exploredInitialized: true, exploredMinX: x, exploredMaxX: x, exploredMinY: y, exploredMaxY: y });
        continue;
      }
      survivalSpawnState.exploredMinX = Math.min(survivalSpawnState.exploredMinX, x);
      survivalSpawnState.exploredMaxX = Math.max(survivalSpawnState.exploredMaxX, x);
      survivalSpawnState.exploredMinY = Math.min(survivalSpawnState.exploredMinY, y);
      survivalSpawnState.exploredMaxY = Math.max(survivalSpawnState.exploredMaxY, y);
    }
  }

  function survivalExploredSpan() {
    if (!survivalSpawnState.exploredInitialized) {
      return 0;
    }
    return Math.hypot(
      Math.max(0, finiteOr(survivalSpawnState.exploredMaxX, 0) - finiteOr(survivalSpawnState.exploredMinX, 0)),
      Math.max(0, finiteOr(survivalSpawnState.exploredMaxY, 0) - finiteOr(survivalSpawnState.exploredMinY, 0))
    );
  }

  function survivalScoreThreat(players) {
    const totalScore = (players || []).reduce((total, entry) => total + Math.max(0, finiteOr(entry && entry.score, 0)), 0);
    return Math.max(0, Math.log2(1 + totalScore / 6000));
  }

  function survivalScoreBudgetScale(scoreThreat) {
    return finiteOr(activeDifficulty().survivalBudgetScale, 1) * (1 + 0.075 * Math.pow(Math.max(0, scoreThreat), 1.35));
  }

  function survivalCampBands(combatProgress, playerCount, scoreThreat) {
    const playerBonus = Math.max(0, Math.min(crazyGamesRoomMaxPlayers - 1, Math.floor(finiteOr(playerCount, 1)) - 1));
    const effectiveProgress = combatProgress + Math.max(0, scoreThreat) * 300;
    const standardUnlocked = effectiveProgress >= survivalMobAllowanceCost("alienoid") * 3;
    const dangerousUnlocked = effectiveProgress >= survivalMobAllowanceCost("ufo") * 4;
    const bossUnlocked = effectiveProgress >= survivalMobAllowanceCost("rambot") * 8 || survivalCampBossProgressReady();
    const difficultyExpansion = finiteOr(activeDifficulty().survivalCampScale, 1) >= 1.1 ? 1 : 0;
    const expansion = clamp(
      Math.floor(survivalExploredSpan() / survivalCampExpansionDistance) + difficultyExpansion,
      0,
      survivalCampMaxExpansion
    );
    const extra = (index) => Math.floor((expansion + 3 - index) / 4);
    const budgetScale = survivalScoreBudgetScale(scoreThreat);
    const band = (id, target, minBudget, maxBudget, allowBosses, index, signatureKinds) => ({
      id,
      target: target > 0 ? target + extra(index) : 0,
      minBudget: Math.round(minBudget * budgetScale),
      maxBudget: Math.round(maxBudget * budgetScale),
      allowBosses,
      signatureKinds,
      scoreThreat,
      forceBoss: id === "boss" && scoreThreat >= 3.2
    });
    return [
      band("starter", 1 + playerBonus, 50, 170, false, 0, []),
      band("standard", 1 + (standardUnlocked ? 1 + playerBonus : 0), 220, 480, false, 1, ["ufo", "rambot"]),
      band("dangerous", 1 + (dangerousUnlocked ? 1 + Math.floor(playerBonus / 2) : 0), 520, 1050, false, 2, ["rambot", "engineer", "tesla"]),
      band("boss", bossUnlocked ? 1 : 0, 850, 3000, true, 3, [])
    ];
  }

  function chooseSurvivalCampBand(players) {
    const combatProgress = survivalCampCombatProgress();
    const scoreThreat = survivalScoreThreat(players);
    const counts = activeSurvivalEncounterCounts(players);
    const bands = survivalCampBands(combatProgress, players.length || 1, scoreThreat);
    const underfilled = bands.filter((band) => band.target > 0 && (counts[band.id] || 0) < band.target);
    if (!underfilled.length) {
      return null;
    }
    const band = counts.total === 0
      ? underfilled.find((candidate) => candidate.id === "starter") || underfilled[0]
      : underfilled.find((candidate) => (counts[candidate.id] || 0) === 0) || underfilled[0];
    const budget = clamp(randomRange(band.minBudget, band.maxBudget), 50, Math.max(50, band.maxBudget));
    return { ...band, budget: Math.max(50, Math.round(budget)), combatProgress, scoreThreat };
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
