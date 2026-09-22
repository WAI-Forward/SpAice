  function bossChaseMaxSpeed(mob, baseMaxSpeed, desiredX, desiredY) {
    if (!mob) {
      return baseMaxSpeed;
    }
    let chaseMaxSpeed = baseMaxSpeed * (isPlayerTeamMob(mob) ? 1 : Math.max(1, finiteOr(mob.difficultySpeedMultiplier, 1)));
    if (mob.isBoss) {
      const speed = Math.hypot(finiteOr(mob.vx, 0), finiteOr(mob.vy, 0));
      const desiredLength = Math.hypot(finiteOr(desiredX, 0), finiteOr(desiredY, 0));
      const alignment = speed > 8 && desiredLength > 0.001
        ? clamp((mob.vx / speed) * (desiredX / desiredLength) + (mob.vy / speed) * (desiredY / desiredLength), 0, 1)
        : 0;
      const sustainedMotion = clamp((speed - baseMaxSpeed * 0.45) / Math.max(1, baseMaxSpeed * 0.9), 0, 1);
      chaseMaxSpeed = baseMaxSpeed *
        (MOB_BOSS_MAX_SPEED_MULTIPLIER + MOB_BOSS_DIRECTIONAL_SPEED_BONUS * alignment * sustainedMotion) *
        bossStatScaleForStars(bossStarRank(mob), MOB_BOSS_STAR_SPEED_MULTIPLIER);
    } else {
      chaseMaxSpeed = baseMaxSpeed * mobEliteStatScale(mob, MOB_ELITE_SPEED_MULTIPLIER);
    }
    if (finiteOr(mob.bossBodyEvadeTimer, 0) > 0) {
      return Math.max(chaseMaxSpeed, clamp(finiteOr(mob.bossBodyEvadeSpeedCap, 0), chaseMaxSpeed, BOSS_BODY_EVADE_MAX_SPEED));
    }
    return chaseMaxSpeed;
  }

  function normalizeUfoBossBeamModeValue(mode) {
    return mode === "cooldown" || mode === "drain" ? mode : "tractor";
  }

  function ufoBossBeamDuration(mode) {
    if (mode === "cooldown") return UFO_BOSS_NO_BEAM_DURATION;
    if (mode === "drain") return UFO_BOSS_DRAIN_BEAM_DURATION;
    return UFO_BOSS_NORMAL_BEAM_DURATION;
  }

  function nextUfoBossBeamMode(mode) {
    if (mode === "tractor") return "cooldown";
    if (mode === "cooldown") return "drain";
    return "tractor";
  }

  function updateUfoBossBeamState(ufo, dt) {
    if (!ufo || !ufo.isBoss) {
      return "tractor";
    }
    let mode = normalizeUfoBossBeamModeValue(ufo.bossBeamMode);
    let timer = finiteOr(ufo.bossBeamTimer, ufoBossBeamDuration(mode)) - dt;
    while (timer <= 0) {
      mode = nextUfoBossBeamMode(mode);
      timer += ufoBossBeamDuration(mode);
    }
    ufo.bossBeamMode = mode;
    ufo.bossBeamTimer = timer;
    return mode;
  }

  function ufoBossBeamMode(ufo) {
    return ufo && ufo.isBoss ? normalizeUfoBossBeamModeValue(ufo.bossBeamMode) : "tractor";
  }

  function ufoHasActiveBeam(ufo) {
    return Boolean(ufo && finiteOr(ufo.health, 0) > 0 && !isMobDisabled(ufo) && finiteOr(ufo.tractorDisabledTimer, 0) <= 0 && ufoBossBeamMode(ufo) !== "cooldown");
  }

  function ufoHasTractorBeam(ufo) {
    return ufoHasActiveBeam(ufo) && (!ufo.isBoss || ufoBossBeamMode(ufo) === "tractor");
  }

  function ufoHasPlayerDrainBeam(ufo) {
    return ufoHasActiveBeam(ufo) && ufo.isBoss && ufoBossBeamMode(ufo) === "drain";
  }

  function steerUfoBeamToward(ufo, targetX, targetY, dt, turnScale) {
    if (!Number.isFinite(ufo.beamAngle)) {
      ufo.beamAngle = Math.PI / 2;
    }
    const targetAngle = Math.atan2(targetY - ufo.y, targetX - ufo.x);
    const turn = shortestAngleDelta(ufo.beamAngle, targetAngle);
    ufo.beamAngle += clamp(turn, -UFO_BEAM_MAX_TURN * finiteOr(turnScale, 1) * dt, UFO_BEAM_MAX_TURN * finiteOr(turnScale, 1) * dt);
  }

  function ufoBeamHitStrength(ufo, target) {
    if (!ufo || !target) {
      return 0;
    }
    const dirX = Math.cos(finiteOr(ufo.beamAngle, Math.PI / 2));
    const dirY = Math.sin(finiteOr(ufo.beamAngle, Math.PI / 2));
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;
    const relX = target.x - originX;
    const relY = target.y - originY;
    const forward = relX * dirX + relY * dirY;
    const side = relX * normalX + relY * normalY;
    const targetReach = Math.max(0, finiteOr(target.radius, PLAYER_RADIUS) * 0.5);
    const surfaceForward = clamp(forward - targetReach, 0, UFO_TRACTOR_RANGE);
    const beamHalf = UFO_TRACTOR_WIDTH * (1 - clamp(surfaceForward / UFO_TRACTOR_RANGE, 0, 1) * 0.55) + targetReach;
    if (forward < -targetReach || forward - targetReach > UFO_TRACTOR_RANGE || Math.abs(side) > beamHalf) {
      return 0;
    }
    return clamp(1 - surfaceForward / UFO_TRACTOR_RANGE, 0.28, 1) * clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0.2, 1);
  }

  function tickBossAltAttackCooldown(mob, dt, seedHolder) {
    if (!mob || !mob.isBoss) {
      return false;
    }
    mob.altAttackCooldown = finiteOr(
      mob.altAttackCooldown,
      randomRange(seedHolder, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) * bossCooldownScaleForStars(bossStarRank(mob))
    ) - dt;
    return mob.altAttackCooldown <= 0;
  }

  function resetBossAltAttackCooldown(mob, seedHolder) {
    if (mob && mob.isBoss) {
      mob.altAttackCooldown = randomRange(seedHolder, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) * bossCooldownScaleForStars(bossStarRank(mob));
    }
  }

  function knockMob(mob, nx, ny, force) {
    if (!mob) {
      return;
    }
    mob.vx += nx * force;
    mob.vy += ny * force;
    if (mob.kind === "rambot") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.28);
      mob.chargeTimer = Math.max(0, (mob.chargeTimer || 0) - 0.22);
    } else if (mob.kind === "rocket") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.32);
      mob.lockTimer = 0;
      mob.volleyTimer = 0;
      mob.volleyShots = 0;
      mob.blastTimer = Math.max(0, (mob.blastTimer || 0) - 0.18);
    }
  }

  function isAsteroidOrLarger(body) {
    return Boolean(body && body.tier && finiteOr(body.tier.threshold, 0) >= 150);
  }

  function isBoulderBody(body) {
    return Boolean(body && body.tier && body.tier.name === "boulder");
  }

  function isAsteroidBody(body) {
    return Boolean(body && body.tier && body.tier.name === "asteroid");
  }

  function canUfoTractorAffectParticle(body) {
    return Boolean(
      body &&
      body.tier &&
      (body.tier.name === "particle" || body.tier.name === "rock" || isBoulderBody(body) || isAsteroidOrLarger(body))
    );
  }

  function canUfoAbsorbParticle(ufo, body) {
    return Boolean(
      body &&
      body.tier &&
      !body.survivalCampBody &&
      (
        body.tier.name === "particle" ||
        body.tier.name === "rock" ||
        (ufo && ufo.isBoss && isBoulderBody(body))
      )
    );
  }

  function shouldUfoImpactBody(ufo, body) {
    return ufo && ufo.isBoss ? isAsteroidBody(body) : isBoulderBody(body);
  }

  function shouldUfoSiphonBody(ufo, body) {
    if (ufo && ufo.isBoss) {
      return isAsteroidOrLarger(body) && !isAsteroidBody(body);
    }
    return isAsteroidOrLarger(body);
  }

  function canUfoPreferTractorTarget(ufo, body) {
    if (!body || !body.tier) {
      return false;
    }
    if (ufo && ufo.isBoss) {
      return body.tier.name === "boulder" || body.tier.name === "rock" || body.tier.name === "particle" || isAsteroidOrLarger(body);
    }
    return body.tier.name === "rock" || body.tier.name === "particle" || isAsteroidOrLarger(body);
  }

  function ufoTractorTargetPriority(ufo, body) {
    if (!body || !body.tier) {
      return 99;
    }
    if (ufo && ufo.isBoss) {
      if (body.tier.name === "boulder") return 0;
      if (body.tier.name === "rock") return 1;
      if (isAsteroidOrLarger(body)) return 2;
      if (body.tier.name === "particle") return 4;
      return 8;
    }
    if (body.tier.name === "rock") return 0;
    if (isAsteroidOrLarger(body)) return 2;
    if (body.tier.name === "particle") return 4;
    return 8;
  }

  function updateBodyAfterMassChange(body) {
    body.tier = clone(tierForMassAndStellarOutcome(body.mass, body.stellarOutcome));
    if (body.tier.name === "particle") body.ownerPlayerId = "";
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    body.textureSeed = finiteOr(body.textureSeed, 0) + 0.09;
  }

  function emitUfoSapParticle(state, seedHolder, ufo, body, fragmentMass, pullStrength, centerStrength) {
    const world = state.world;
    const id = Math.max(1, Math.floor(finiteOr(world.nextParticleId, 1)));
    const originX = ufo.x + Math.cos(ufo.beamAngle) * 26;
    const originY = ufo.y + Math.sin(ufo.beamAngle) * 26;
    const toUfo = normalize(originX - body.x, originY - body.y);
    const tangentX = -toUfo.y;
    const tangentY = toUfo.x;
    const fragmentRadius = radiusFromMass(fragmentMass);
    const surfaceX = body.x + toUfo.x * Math.max(1, finiteOr(body.radius, 1) + fragmentRadius + 5);
    const surfaceY = body.y + toUfo.y * Math.max(1, finiteOr(body.radius, 1) + fragmentRadius + 5);
    const pullSpeed = 170 + pullStrength * 170 + centerStrength * 120;
    const side = randomRange(seedHolder, -body.radius * 0.1, body.radius * 0.1);
    const jitter = randomRange(seedHolder, -34, 34);
    const speed = randomRange(seedHolder, pullSpeed * 0.75, pullSpeed * 1.2);
    const particle = normalizeParticle({
      id,
      x: surfaceX + tangentX * side,
      y: surfaceY + tangentY * side,
      vx: body.vx + toUfo.x * speed + tangentX * jitter,
      vy: body.vy + toUfo.y * speed + tangentY * jitter,
      mass: fragmentMass,
      color: body.color,
      textureSeed: finiteOr(body.textureSeed, 0) + randomRange(seedHolder, -0.5, 0.5),
      wobble: finiteOr(ufo.wobble, 0) + randomRange(seedHolder, -0.45, 0.45),
      spawnAge: 0,
      ufoSapTimer: UFO_SAP_CARGO_DURATION,
      ufoSapSourceGraceTimer: UFO_SAP_SOURCE_GRACE_DURATION,
      ufoExtractedById: ufo.id,
      ufoExtractedFromId: body.id
    }, id, seedHolder);
    world.particles.push(particle);
    world.nextParticleId = id + 1;
  }

  function drainBodyWithUfoTractor(state, seedHolder, ufo, body, pullStrength, centerStrength, dt) {
    if (!body || body.mass <= 1) {
      return;
    }
    const drain = Math.min(
      body.mass - 1,
      (UFO_BODY_DRAIN_RATE + Math.sqrt(body.mass) * 0.045) * pullStrength * (0.35 + centerStrength * 0.65) * dt
    );
    if (drain <= 0) {
      return;
    }

    body.mass -= drain;
    updateBodyAfterMassChange(body);
    body.textureSeed += drain * 0.013;
    body.ufoSapParticleBuffer = Math.max(0, finiteOr(body.ufoSapParticleBuffer, 0)) + drain;

    if (body.ufoSapParticleBuffer >= UFO_SAP_FRAGMENT_MASS) {
      const fragments = Math.min(
        UFO_SAP_MAX_FRAGMENTS_PER_BURST,
        Math.max(1, Math.floor(body.ufoSapParticleBuffer / UFO_SAP_FRAGMENT_MASS))
      );
      let remaining = body.ufoSapParticleBuffer;
      for (let i = 0; i < fragments; i += 1) {
        const fragmentMass = remaining / (fragments - i);
        remaining -= fragmentMass;
        emitUfoSapParticle(state, seedHolder, ufo, body, fragmentMass, pullStrength, centerStrength);
      }
      body.ufoSapParticleBuffer = Math.max(0, remaining);
    }
  }

  function applyUfoTractorBeam(state, seedHolder, ufo, dt, towTarget) {
    if (!ufoHasTractorBeam(ufo)) {
      return;
    }
    const world = state.world;
    const assignedSalvageBody = survivalSalvageBody(world, ufo);
    const usesSurvivalTowRules = ufoUsesSurvivalTowRules(state, ufo);
    let bestBody = assignedSalvageBody;
    let bestScore = Infinity;
    for (const body of assignedSalvageBody ? [] : world.particles || []) {
      if (!canUfoTractorAffectParticle(body) || !canUfoPreferTractorTarget(ufo, body)) {
        continue;
      }
      if (usesSurvivalTowRules && isAsteroidOrLarger(body)) {
        continue;
      }
      const distance = Math.hypot(body.x - ufo.x, body.y - ufo.y);
      const surfaceDistance = Math.max(0, distance - Math.max(0, finiteOr(body.radius, 0)));
      let score = surfaceDistance + ufoTractorTargetPriority(ufo, body) * 10000;
      if (body.tier.solid) {
        score = surfaceDistance * 0.55 - finiteOr(body.radius, 0) + ufoTractorTargetPriority(ufo, body) * 10000;
      } else if (body.tier.name === "particle") {
        score += 80;
      }
      if (surfaceDistance < UFO_TRACTOR_RANGE && score < bestScore) {
        bestBody = body;
        bestScore = score;
      }
    }
    if (!Number.isFinite(ufo.beamAngle)) {
      ufo.beamAngle = Math.PI / 2;
    }
    if (bestBody) {
      steerUfoBeamToward(ufo, bestBody.x, bestBody.y, dt, 1);
    } else {
      const turn = shortestAngleDelta(ufo.beamAngle, finiteOr(ufo.rotation, 0) + Math.PI / 2);
      ufo.beamAngle += clamp(turn, -UFO_BEAM_MAX_TURN * 0.65 * dt, UFO_BEAM_MAX_TURN * 0.65 * dt);
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;

    for (let i = world.particles.length - 1; i >= 0; i -= 1) {
      const body = world.particles[i];
      if (!canUfoTractorAffectParticle(body)) {
        continue;
      }

      const relX = body.x - originX;
      const relY = body.y - originY;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const bodyReach = body.tier.solid ? Math.max(0, finiteOr(body.radius, 0)) : 0;
      const surfaceForward = clamp(forward - bodyReach, 0, UFO_TRACTOR_RANGE);
      const beamHalf = UFO_TRACTOR_WIDTH * (1 - clamp(surfaceForward / UFO_TRACTOR_RANGE, 0, 1) * 0.55) + body.radius * 0.45;
      if (forward < -bodyReach || forward - bodyReach > UFO_TRACTOR_RANGE || Math.abs(side) > beamHalf) {
        continue;
      }

      const pullStrength = clamp(1 - surfaceForward / UFO_TRACTOR_RANGE, 0.12, 1);
      const centerStrength = clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0, 1);
      const toOriginX = originX - body.x;
      const toOriginY = originY - body.y;
      const isAssignedSalvageBody = body === assignedSalvageBody;

      if (usesSurvivalTowRules && (isAsteroidOrLarger(body) || (isAssignedSalvageBody && isBoulderBody(body)))) {
        if (isAssignedSalvageBody) {
          applyControlledSurvivalTow(state, ufo, body, towTarget, pullStrength, centerStrength, dt);
        }
        continue;
      }

      if (!isAssignedSalvageBody && !isSurvivalLogisticsUfo(state, ufo) && shouldUfoSiphonBody(ufo, body)) {
        drainBodyWithUfoTractor(state, seedHolder, ufo, body, pullStrength, centerStrength, dt);
        continue;
      }

      const toOrigin = normalize(toOriginX, toOriginY);
      const cargoBoost = body.ufoExtractedById === ufo.id ? 1.35 : 1;
      const solidDragScale = body.tier.solid ? 0.62 : 1;
      const force = UFO_TRACTOR_FORCE * pullStrength * (0.45 + centerStrength * 0.75) * cargoBoost * solidDragScale;
      body.vx += (toOrigin.x * force - normalX * side * 7.5) * dt;
      body.vy += (toOrigin.y * force - normalY * side * 7.5) * dt;

      if (Math.hypot(toOriginX, toOriginY) >= ufo.radius + body.radius * 1.05) {
        continue;
      }

      if (isAssignedSalvageBody) {
        continue;
      }

      const bodySpeed = Math.hypot(body.vx, body.vy);
      if (shouldUfoImpactBody(ufo, body)) {
        if (bodySpeed >= 110 && ufo.hitCooldown <= 0) {
          const damage = Math.min(90, 20 + Math.max(0, bodySpeed - 110) * 0.18 + Math.sqrt(body.mass) * 0.8);
          knockMob(ufo, toOrigin.x, toOrigin.y, 150 + bodySpeed * 0.34);
          triggerBossBodyEvade(ufo, body, toOrigin.x, toOrigin.y, bodySpeed);
          damageMob(state, ufo, damage, "ufo-tractor-impact", {
            playerId: controllingPlayerIdForBody(state, body),
            bodyId: body.id,
            cause: "ufo-tractor-impact",
            hostileActionType: "player-controlled-body-impact"
          });
          if (ufo.isBoss) {
            ufo.tractorDisabledTimer = Math.max(finiteOr(ufo.tractorDisabledTimer, 0), UFO_BOSS_TRACTOR_IMPACT_DISABLE_DURATION);
          }
        }
        body.vx -= toOrigin.x * (210 + bodySpeed * 0.18);
        body.vy -= toOrigin.y * (210 + bodySpeed * 0.18);
      } else if (canUfoAbsorbParticle(ufo, body)) {
        if (isSurvivalLogisticsUfo(state, ufo)) {
          addSurvivalUfoCargo(state, ufo, body);
        }
        world.particles.splice(i, 1);
        state.events.push({ type: "ufo.absorbedParticle", mobId: ufo.id, bodyId: body.id, tick: state.tick });
      }
    }
  }

  function ufoCleanupTarget(state, ufo) {
    const world = state && state.world ? state.world : null;
    if (!world || !Array.isArray(world.particles)) {
      return null;
    }

    let bestBody = null;
    let bestScore = Infinity;
    const maxDistance = ufo && ufo.isBoss ? 3600 : 3000;
    for (const body of world.particles) {
      if (!canUfoPreferTractorTarget(ufo, body)) {
        continue;
      }
      const distance = Math.hypot(body.x - ufo.x, body.y - ufo.y);
      if (distance > maxDistance + finiteOr(body.radius, 0)) {
        continue;
      }

      const priority = ufoTractorTargetPriority(ufo, body);
      if (priority > 2) {
        continue;
      }
      const eventBias = body.randomEventId === METEOR_SHOWER_EVENT_ID || body.randomEventId === PARTICLE_STORM_EVENT_ID ? -520 : 0;
      const sizeBias = ufo && ufo.isBoss && body.tier && body.tier.name === "boulder" ? -finiteOr(body.mass, 0) * 3.2 : -finiteOr(body.mass, 0) * 0.7;
      const score = priority * 10000 + distance + eventBias + sizeBias;
      if (score < bestScore) {
        bestBody = body;
        bestScore = score;
      }
    }

    return bestBody;
  }

  function updateUfoUndersideImpact(state, ufo, players) {
    if (!ufoHasTractorBeam(ufo)) {
      return;
    }

    const dirX = Math.cos(finiteOr(ufo.beamAngle, Math.PI / 2));
    const dirY = Math.sin(finiteOr(ufo.beamAngle, Math.PI / 2));
    const normalX = -dirY;
    const normalY = dirX;
    for (const target of players) {
      if (!target || target.health <= 0 || target.hitCooldown > 0 || target.invulnerableTimer > 0) {
        continue;
      }
      const relX = target.x - ufo.x;
      const relY = target.y - ufo.y;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const distance = Math.hypot(relX, relY);
      if (forward < 6 || forward > ufo.radius + target.radius * 0.85 || Math.abs(side) > 52 || distance > ufo.radius + target.radius * 0.72) {
        continue;
      }
      target.vx += dirX * 210 + finiteOr(ufo.vx, 0) * 0.38;
      target.vy += dirY * 210 + finiteOr(ufo.vy, 0) * 0.38;
      if (isCombatMobEntity(target)) {
        damageMob(state, target, bossScaledDamage(ufo, UFO_UNDERSIDE_DAMAGE), ufo.isBoss ? "UFO boss underside" : "UFO underside");
      } else if (damagePlayer(state, target, difficultyMobDamage(state, bossScaledDamage(ufo, UFO_UNDERSIDE_DAMAGE)), ufo.isBoss ? "UFO boss underside" : "UFO underside")) {
        state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: ufo.id, kind: "ufo", tick: state.tick });
      }
    }
  }

  function applyUfoBossPlayerDrainBeam(state, ufo, target, dt) {
    if (!ufoHasPlayerDrainBeam(ufo) || !target || finiteOr(target.health, 0) <= 0) {
      return;
    }
    steerUfoBeamToward(ufo, target.x, target.y, dt, 1.35);
    const hitStrength = ufoBeamHitStrength(ufo, target);
    if (hitStrength <= 0) {
      ufo.playerDrainTickTimer = Math.max(0, finiteOr(ufo.playerDrainTickTimer, 0) - dt);
      return;
    }

    ufo.playerDrainTickTimer = finiteOr(ufo.playerDrainTickTimer, 0) - dt;
    if (ufo.playerDrainTickTimer > 0) {
      return;
    }
    ufo.playerDrainTickTimer += UFO_BOSS_PLAYER_DRAIN_TICK_INTERVAL;

    const dirX = Math.cos(finiteOr(ufo.beamAngle, Math.PI / 2));
    const dirY = Math.sin(finiteOr(ufo.beamAngle, Math.PI / 2));
    const damage = difficultyMobDamage(state, bossScaledDamage(ufo, UFO_BOSS_PLAYER_DRAIN_RATE) * UFO_BOSS_PLAYER_DRAIN_TICK_INTERVAL * hitStrength);
    target.vx += -dirX * 105 * hitStrength + finiteOr(ufo.vx, 0) * 0.12;
    target.vy += -dirY * 105 * hitStrength + finiteOr(ufo.vy, 0) * 0.12;
    if (isCombatMobEntity(target)) {
      damageMob(state, target, damage, "UFO boss drain beam");
    } else if (damagePlayer(state, target, damage, "UFO boss drain beam")) {
      state.events.push({ type: "player.hitByMob", playerId: target.id, mobId: ufo.id, kind: "ufo", cause: "drain-beam", tick: state.tick });
    }
  }
