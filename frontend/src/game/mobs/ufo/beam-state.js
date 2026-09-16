  function normalizeUfoBossBeamModeValue(mode) {
    return mode === "cooldown" || mode === "drain" ? mode : "tractor";
  }

  function ufoBossBeamDuration(mode) {
    if (mode === "cooldown") {
      return ufoBossNoBeamDuration;
    }
    if (mode === "drain") {
      return ufoBossDrainBeamDuration;
    }
    return ufoBossNormalBeamDuration;
  }

  function nextUfoBossBeamMode(mode) {
    if (mode === "tractor") {
      return "cooldown";
    }
    if (mode === "cooldown") {
      return "drain";
    }
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
    return Boolean(ufo && ufo.health > 0 && !isMobDisabled(ufo) && finiteOr(ufo.tractorDisabledTimer, 0) <= 0 && ufoBossBeamMode(ufo) !== "cooldown");
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
    ufo.beamAngle += clamp(turn, -ufoBeamMaxTurn * finiteOr(turnScale, 1) * dt, ufoBeamMaxTurn * finiteOr(turnScale, 1) * dt);
  }

  function ufoBeamHitStrength(ufo, targetPlayer) {
    if (!ufo || !targetPlayer) {
      return 0;
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;
    const relX = targetPlayer.x - originX;
    const relY = targetPlayer.y - originY;
    const forward = relX * dirX + relY * dirY;
    const side = relX * normalX + relY * normalY;
    const targetReach = Math.max(0, finiteOr(targetPlayer.radius, player.radius) * 0.5);
    const surfaceForward = clamp(forward - targetReach, 0, ufoTractorRange);
    const beamHalf = ufoTractorWidth * (1 - clamp(surfaceForward / ufoTractorRange, 0, 1) * 0.55) + targetReach;

    if (forward < -targetReach || forward - targetReach > ufoTractorRange || Math.abs(side) > beamHalf) {
      return 0;
    }
    return clamp(1 - surfaceForward / ufoTractorRange, 0.28, 1) * clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0.2, 1);
  }

  function applyUfoBossPlayerDrainBeam(ufo, target, dt) {
    if (!ufoHasPlayerDrainBeam(ufo)) {
      return;
    }

    const playerTarget = target && target.player ? target.player : player;
    steerUfoBeamToward(ufo, playerTarget.x, playerTarget.y, dt, 1.35);
    const hitStrength = ufoBeamHitStrength(ufo, playerTarget);
    if (hitStrength <= 0) {
      ufo.playerDrainTickTimer = Math.max(0, finiteOr(ufo.playerDrainTickTimer, 0) - dt);
      return;
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const drainInterval = ufoBossPlayerDrainTickInterval;
    ufo.playerDrainTickTimer = finiteOr(ufo.playerDrainTickTimer, 0) - dt;
    if (ufo.playerDrainTickTimer > 0) {
      return;
    }
    ufo.playerDrainTickTimer += drainInterval;

    const damage = difficultyMobDamage(bossScaledDamage(ufo, ufoBossPlayerDrainRate) * drainInterval * hitStrength);
    const impulseX = -dirX * 105 * hitStrength + finiteOr(ufo.vx, 0) * 0.12;
    const impulseY = -dirY * 105 * hitStrength + finiteOr(ufo.vy, 0) * 0.12;
    const beamColor = { r: 255, g: 73, b: 73 };

    if (target && target.familiarEnemy) {
      const enemy = target.player;
      knockMob(enemy, -dirX, -dirY, 105 * hitStrength);
      damageMob(enemy, damage, beamColor, mobName(enemy) + " drained by your UFO familiar.");
    } else if (target && target.familiar) {
      const familiar = target.player;
      knockMob(familiar, -dirX, -dirY, 105 * hitStrength);
      damageMob(familiar, damage, beamColor, "Your familiar was drained by the UFO boss.");
    } else if (target && target.local) {
      if (player.landed) {
        detachFromBody(120);
      }
      player.vx += impulseX;
      player.vy += impulseY;
      damageLocalPlayer(damage, {
        cause: "UFO boss drain beam",
        cooldown: 0.18,
        flash: 0.24
      });
    } else if (target && target.spacecraft && target.spacecraftComponent) {
      damageSpacecraftComponent(target.spacecraft, target.spacecraftComponent, damage, beamColor);
    } else if (target && target.remote && canDamageRemotePlayerFromPve(target.remote)) {
      sendRemoteEntityEffect(target.remote, {
        entityType: "player",
        sourceKind: "mob",
        cause: "UFO boss drain beam",
        damage,
        impulseX,
        impulseY,
        color: beamColor
      });
    }

    sparks.push({
      x: playerTarget.x,
      y: playerTarget.y,
      radius: 44,
      color: beamColor,
      life: 0.22,
      maxLife: 0.22
    });
    playSound("ufoSiphon", {
      throttleKey: "ufoBossDrain:" + ufo.id,
      throttle: 0.42,
      volume: 0.82
    });
  }

  function applyUfoTractorBeam(ufo, dt) {
    if (!ufoHasTractorBeam(ufo)) {
      return;
    }

    let bestParticle = null;
    let bestScore = Infinity;
    const playerBody = player.landed ? bodyById(player.landed.bodyId) : null;

    for (const particle of particles) {
      if (!canUfoTractorAffectParticle(particle) || !canUfoPreferTractorTarget(ufo, particle)) {
        continue;
      }

      const distance = Math.hypot(particle.x - ufo.x, particle.y - ufo.y);
      const surfaceDistance = Math.max(0, distance - Math.max(0, particle.radius || 0));
      let score = surfaceDistance + ufoTractorTargetPriority(ufo, particle) * 10000;
      if (particle === playerBody) {
        score = surfaceDistance * 0.18;
      } else if (particle.tier.solid) {
        score = surfaceDistance * 0.55 - particle.radius + ufoTractorTargetPriority(ufo, particle) * 10000;
      } else if (particle.tier.name === "particle") {
        score += 80;
      }

      if (surfaceDistance < ufoTractorRange && score < bestScore) {
        bestParticle = particle;
        bestScore = score;
      }
    }

    if (bestParticle) {
      steerUfoBeamToward(ufo, bestParticle.x, bestParticle.y, dt, 1);
    } else {
      const turn = shortestAngleDelta(ufo.beamAngle, ufo.rotation + Math.PI / 2);
      ufo.beamAngle += clamp(turn, -ufoBeamMaxTurn * 0.65 * dt, ufoBeamMaxTurn * 0.65 * dt);
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const originX = ufo.x + dirX * 26;
    const originY = ufo.y + dirY * 26;

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      if (!canUfoTractorAffectParticle(particle)) {
        continue;
      }

      const relX = particle.x - originX;
      const relY = particle.y - originY;
      const forward = relX * dirX + relY * dirY;
      const side = relX * normalX + relY * normalY;
      const bodyReach = particle.tier.solid ? Math.max(0, particle.radius || 0) : 0;
      const surfaceForward = clamp(forward - bodyReach, 0, ufoTractorRange);
      const beamHalf = ufoTractorWidth * (1 - clamp(surfaceForward / ufoTractorRange, 0, 1) * 0.55) + particle.radius * 0.45;

      if (forward < -bodyReach || forward - bodyReach > ufoTractorRange || Math.abs(side) > beamHalf) {
        continue;
      }

      const pullStrength = clamp(1 - surfaceForward / ufoTractorRange, 0.12, 1);
      const centerStrength = clamp(1 - Math.abs(side) / Math.max(1, beamHalf), 0, 1);
      const toOriginX = originX - particle.x;
      const toOriginY = originY - particle.y;

      if (shouldUfoSiphonBody(ufo, particle)) {
        drainBodyWithUfoTractor(ufo, particle, pullStrength, centerStrength, dt);
        continue;
      }

      const toOrigin = normalize(toOriginX, toOriginY);
      const cargoBoost = particle.ufoExtractedById === ufo.id ? 1.35 : 1;
      const solidDragScale = particle.tier.solid ? 0.62 : 1;
      const force = ufoTractorForce * pullStrength * (0.45 + centerStrength * 0.75) * cargoBoost * solidDragScale;

      particle.vx += (toOrigin.x * force - normalX * side * 7.5) * dt;
      particle.vy += (toOrigin.y * force - normalY * side * 7.5) * dt;

      if (Math.hypot(toOriginX, toOriginY) < ufo.radius + particle.radius * 1.05) {
        const speed = Math.hypot(particle.vx, particle.vy);
        if (shouldUfoImpactBody(ufo, particle)) {
          if (speed >= rivalBodyImpactSpeed && ufo.hitCooldown <= 0) {
            const damage = Math.min(90, 20 + Math.max(0, speed - rivalBodyImpactSpeed) * 0.18 + Math.sqrt(particle.mass) * 0.8);
            knockMob(ufo, toOrigin.x, toOrigin.y, 150 + speed * 0.34);
            triggerBossBodyEvade(ufo, particle, toOrigin.x, toOrigin.y, speed);
            damageMob(ufo, damage, particle.color, "UFO cracked by " + particle.tier.article + " " + particle.tier.name + ".", {
              notification: bodyDefeatNotificationOptions(ufo, particle, "cracked")
            });
            if (ufo.isBoss) {
              ufo.tractorDisabledTimer = Math.max(finiteOr(ufo.tractorDisabledTimer, 0), ufoBossTractorImpactDisableDuration);
            }
          }
          particle.vx -= toOrigin.x * (210 + speed * 0.18);
          particle.vy -= toOrigin.y * (210 + speed * 0.18);
          continue;
        }

        if (!canUfoAbsorbParticle(ufo, particle)) {
          continue;
        }

        sparks.push({
          x: particle.x,
          y: particle.y,
          radius: Math.max(18, particle.radius * 1.5),
          color: ufo.color,
          life: 0.2,
          maxLife: 0.2
        });
        particles.splice(i, 1);
      }
    }
  }

  function canUfoPreferTractorTarget(ufo, particle) {
    if (!particle || !particle.tier) {
      return false;
    }
    if (ufo && ufo.isBoss) {
      return particle.tier.name === "boulder" || particle.tier.name === "rock" || particle.tier.name === "particle" || isAsteroidOrLarger(particle);
    }
    return particle.tier.name === "rock" || particle.tier.name === "particle" || isAsteroidOrLarger(particle);
  }

  function ufoTractorTargetPriority(ufo, particle) {
    if (!particle || !particle.tier) {
      return 99;
    }
    if (ufo && ufo.isBoss) {
      if (particle.tier.name === "boulder") return 0;
      if (particle.tier.name === "rock") return 1;
      if (isAsteroidOrLarger(particle)) return 2;
      if (particle.tier.name === "particle") return 4;
      return 8;
    }
    if (particle.tier.name === "rock") return 0;
    if (isAsteroidOrLarger(particle)) return 2;
    if (particle.tier.name === "particle") return 4;
    return 8;
  }

