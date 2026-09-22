  function ufoCleanupTarget(ufo) {
    let bestBody = null;
    let bestScore = Infinity;
    const maxDistance = (ufo && ufo.isBoss ? 3600 : 3000) + Math.max(width, height) * 0.55;

    for (const body of particles) {
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
      const eventBias = body.randomEventId === meteorShowerEventId || body.randomEventId === particleStormEventId ? -520 : 0;
      const sizeBias = ufo && ufo.isBoss && body.tier && body.tier.name === "boulder" ? -finiteOr(body.mass, 0) * 3.2 : -finiteOr(body.mass, 0) * 0.7;
      const score = priority * 10000 + distance + eventBias + sizeBias;
      if (score < bestScore) {
        bestBody = body;
        bestScore = score;
      }
    }

    return bestBody ? {
      kind: "body",
      body: bestBody,
      x: bestBody.x,
      y: bestBody.y,
      radius: bestBody.radius
    } : null;
  }

  function ufoAttackTarget(ufo, playerTarget) {
    if (playerTarget && playerTarget.familiarEnemy) {
      const targetPlayer = playerTarget.player;
      return {
        kind: "player",
        target: playerTarget,
        x: targetPlayer.x,
        y: targetPlayer.y,
        radius: targetPlayer.radius || player.radius
      };
    }

    const hostileSurvivalEncounter = ufo &&
      !isPlayerTeamMob(ufo) &&
      (ufo.survivalEncounterType === "camp" || isSurvivalCampMob(ufo));
    if (!hostileSurvivalEncounter) {
      const cleanup = ufoCleanupTarget(ufo);
      if (cleanup) {
        return cleanup;
      }
    }

    if (playerTarget && playerTarget.local && player.landed) {
      const body = bodyById(player.landed.bodyId);
      if (isAsteroidOrLarger(body)) {
        return {
          kind: "body",
          body,
          x: body.x,
          y: body.y,
          radius: body.radius
        };
      }
    }

    const targetPlayer = playerTarget && playerTarget.player ? playerTarget.player : player;
    return {
      kind: "player",
      target: playerTarget || { local: true, remote: null, player },
      x: targetPlayer.x,
      y: targetPlayer.y,
      radius: targetPlayer.radius || player.radius
    };
  }

  function updateUfos(dt) {
    for (let i = ufos.length - 1; i >= 0; i -= 1) {
      const ufo = ufos[i];
      tickMobDamageTimers(ufo, dt);
      ufo.tractorDisabledTimer = Math.max(0, finiteOr(ufo.tractorDisabledTimer, 0) - dt);
      ufo.flash = Math.max(0, ufo.flash - dt);

      if (ufo.health <= 0) {
        ufos.splice(i, 1);
        continue;
      }
      if (isMobSummoning(ufo)) {
        continue;
      }
      if (shouldSleepDistantSurvivalMob(ufo)) {
        continue;
      }
      updateBossSpawnPressure(ufo, dt);
      const beamMode = updateUfoBossBeamState(ufo, dt);
      if (isMobDisabled(ufo)) {
        ufo.tractorDisabledTimer = Math.max(finiteOr(ufo.tractorDisabledTimer, 0), finiteOr(ufo.disabledTimer, 0));
        ufo.playerDrainTickTimer = 0;
        updateDisabledMobDrift(ufo, dt);
        continue;
      }

      const salvageTarget = survivalSalvageTowTarget(ufo, dt);
      if (!salvageTarget && updateSurvivalCampMobHome(ufo, dt)) {
        continue;
      }

      const target = combatTargetForMob(ufo);
      if (!target && !salvageTarget) {
        updateFamiliarMob(ufo, dt);
        continue;
      }
      const targetPlayer = target && target.player ? target.player : null;
      const attackTarget = salvageTarget || (ufo.isBoss && beamMode === "drain" && targetPlayer ? {
        kind: "player",
        target,
        x: targetPlayer.x,
        y: targetPlayer.y,
        radius: targetPlayer.radius || player.radius
      } : ufoAttackTarget(ufo, target));
      const playerDist = targetPlayer ? Math.hypot(targetPlayer.x - ufo.x, targetPlayer.y - ufo.y) || 1 : 0;
      const toTargetX = attackTarget.x - ufo.x;
      const toTargetY = attackTarget.y - ufo.y;
      const dist = Math.hypot(toTargetX, toTargetY) || 1;

      if (!salvageTarget && targetPlayer && playerDist > Math.max(width, height) * 2.7 + 1800) {
        const spawn = relocatedMobOffscreenPoint(180, 560, targetPlayer);
        ufo.x = spawn.x;
        ufo.y = spawn.y;
        ufo.vx = randomRange(-24, 24);
        ufo.vy = randomRange(-24, 24);
        continue;
      }

      const nx = toTargetX / dist;
      const ny = toTargetY / dist;
      const tangentX = -ny * ufo.strafeSign;
      const tangentY = nx * ufo.strafeSign;
      const desiredDistance = attackTarget.kind === "salvage" ? 0 : attackTarget.kind === "body" ? clamp(attackTarget.radius + 350, 430, 660) : 430;
      const noBeamBoost = ufo.isBoss && beamMode === "cooldown" ? 1.34 : 1;
      if (salvageTarget) {
        const approachSpeed = clamp(dist * 0.72, 0, 150);
        const velocityBlend = Math.min(1, dt * 2.6);
        ufo.vx += (nx * approachSpeed - ufo.vx) * velocityBlend;
        ufo.vy += (ny * approachSpeed - ufo.vy) * velocityBlend;
      } else {
        const chaseForce = bossChaseForce(ufo, (dist > desiredDistance ? 92 : -44) * noBeamBoost);
        const strafeForce = bossStrafeForce(ufo, (dist < 880 ? 56 : 18) * noBeamBoost);
        ufo.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
        ufo.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
        ufo.vx += Math.sin(performance.now() * 0.00058 + ufo.wobble) * 10 * dt;
        ufo.vy += Math.cos(performance.now() * 0.00052 + ufo.wobble) * 10 * dt;
        ufo.vx *= Math.pow(0.75, dt);
        ufo.vy *= Math.pow(0.75, dt);
      }

      const speed = Math.hypot(ufo.vx, ufo.vy);
      const maxSpeed = bossChaseMaxSpeed(ufo, (dist > 760 ? 170 : 132) * noBeamBoost, nx, ny);
      if (speed > maxSpeed) {
        ufo.vx = (ufo.vx / speed) * maxSpeed;
        ufo.vy = (ufo.vy / speed) * maxSpeed;
      }

      ufo.x += ufo.vx * dt;
      ufo.y += ufo.vy * dt;
      const beamStartedAt = performance.now();
      applyUfoTractorBeam(ufo, dt, salvageTarget);
      addGamePhaseTime("beams", beamStartedAt);
      if (target) applyUfoBossPlayerDrainBeam(ufo, target, dt);
      if (!isPlayerTeamMob(ufo) && !isSurvivalLogisticsUfo(ufo)) {
        updateUfoUndersideImpact(ufo);
      }
      ufo.rotation = ufo.beamAngle - Math.PI / 2;
    }
  }
