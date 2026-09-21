  function drainBodyWithUfoTractor(ufo, body, pullStrength, centerStrength, dt) {
    if (body.mass <= 1) {
      return;
    }

    const previousTier = body.tier;
    const drain = Math.min(
      body.mass - 1,
      bossScaledDamage(ufo, ufoBodyDrainRate + Math.sqrt(body.mass) * 0.045) * pullStrength * (0.35 + centerStrength * 0.65) * dt
    );

    if (drain <= 0) {
      return;
    }

    playSound("ufoSiphon", {
      throttleKey: "ufoSiphon:" + ufo.id,
      throttle: 0.48,
      volume: clamp(0.55 + pullStrength * 0.45, 0.55, 1)
    });
    body.mass -= drain;
    updateBodyAfterMassChange(body, previousTier);
    body.textureSeed += drain * 0.013;
    emitUfoSapParticles(ufo, body, drain, pullStrength, centerStrength);
  }

  function updateBodyAfterMassChange(body, previousTier) {
    body.tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
    if (body.tier.name === "particle") body.ownerPlayerId = "";
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    normalizeBodyEnergy(body);
    body.textureSeed += 0.09;

    if (body.tier !== previousTier) {
      for (const rival of rivals) {
        if (rival.landed && rival.landed.bodyId === body.id) {
          rival.residentTier = body.tier.name;
        }
      }
    }
  }

  function emitMassParticle(body, x, y, vx, vy, mass) {
    const particle = createParticle(x, y, Math.max(0.001, finiteOr(mass, 1)), ejectedParticleColor(body));
    particle.vx = vx;
    particle.vy = vy;
    particles.push(particle);
    return particle;
  }

  function emitUfoSapParticles(ufo, body, lostMass, pullStrength, centerStrength) {
    body.ufoSapParticleBuffer = Math.max(0, finiteOr(body.ufoSapParticleBuffer, 0)) + lostMass;

    if (body.ufoSapParticleBuffer < ufoSapFragmentMass) {
      return;
    }

    const originX = ufo.x + Math.cos(ufo.beamAngle) * 26;
    const originY = ufo.y + Math.sin(ufo.beamAngle) * 26;
    const toUfo = normalize(originX - body.x, originY - body.y);
    const tangentX = -toUfo.y;
    const tangentY = toUfo.x;
    const pullSpeed = 170 + pullStrength * 170 + centerStrength * 120;
    const particlesToEmit = Math.min(
      ufoSapMaxFragmentsPerBurst,
      Math.max(1, Math.floor(body.ufoSapParticleBuffer / ufoSapFragmentMass))
    );
    let remainingMass = body.ufoSapParticleBuffer;
    let sparkX = body.x + toUfo.x * Math.max(1, body.radius + 2);
    let sparkY = body.y + toUfo.y * Math.max(1, body.radius + 2);

    for (let i = 0; i < particlesToEmit; i += 1) {
      const remainingParticles = particlesToEmit - i;
      const fragmentMass = remainingMass / remainingParticles;
      remainingMass -= fragmentMass;
      const fragmentRadius = radiusFromMass(fragmentMass);
      const surfaceX = body.x + toUfo.x * Math.max(1, body.radius + fragmentRadius + 5);
      const surfaceY = body.y + toUfo.y * Math.max(1, body.radius + fragmentRadius + 5);
      const side = randomRange(-body.radius * 0.1, body.radius * 0.1);
      const jitter = randomRange(-34, 34);
      const particle = emitMassParticle(
        body,
        surfaceX + tangentX * side,
        surfaceY + tangentY * side,
        body.vx + toUfo.x * randomRange(pullSpeed * 0.75, pullSpeed * 1.2) + tangentX * jitter,
        body.vy + toUfo.y * randomRange(pullSpeed * 0.75, pullSpeed * 1.2) + tangentY * jitter,
        fragmentMass
      );
      particle.ufoExtractedById = ufo.id;
      particle.ufoExtractedFromId = body.id;
      particle.ufoSapTimer = ufoSapCargoDuration;
      particle.ufoSapSourceGraceTimer = ufoSapSourceGraceDuration;
      particle.wobble = ufo.wobble + randomRange(-0.45, 0.45);
      sparkX = surfaceX;
      sparkY = surfaceY;
    }

    body.ufoSapParticleBuffer = Math.max(0, remainingMass);

    sparks.push({
      x: sparkX,
      y: sparkY,
      radius: Math.max(14, Math.min(42, body.radius * 0.16)),
      color: ufo.color,
      life: 0.18,
      maxLife: 0.18
    });
  }

  function burstBodyFragments(body, lostMass, originX, originY, dirX, dirY, color) {
    const pieces = Math.max(1, Math.min(28, Math.floor(lostMass)));
    const tangentX = -dirY;
    const tangentY = dirX;

    for (let i = 0; i < pieces; i += 1) {
      const side = randomRange(-body.radius * 0.11, body.radius * 0.11);
      const speed = randomRange(180, 370);
      const scatter = randomRange(-145, 145);
      emitMassParticle(
        body,
        originX + tangentX * side + dirX * randomRange(2, 12),
        originY + tangentY * side + dirY * randomRange(2, 12),
        body.vx + dirX * speed + tangentX * scatter,
        body.vy + dirY * speed + tangentY * scatter
      );
    }

    sparks.push({
      x: originX,
      y: originY,
      radius: Math.max(34, Math.min(110, body.radius * 0.32)),
      color: color || body.color,
      life: 0.34,
      maxLife: 0.34
    });
  }

  function shedBodyMass(body, amount, originX, originY, dirX, dirY, color) {
    if (!body || body.mass <= 1) {
      return 0;
    }

    const lostMass = Math.min(body.mass - 1, Math.max(0, Math.floor(amount)));
    if (lostMass <= 0) {
      return 0;
    }

    const previousTier = body.tier;
    body.mass -= lostMass;
    updateBodyAfterMassChange(body, previousTier);
    burstBodyFragments(body, lostMass, originX, originY, dirX, dirY, color || body.color);
    return lostMass;
  }

  function damageBodyWithRambot(rambot, body, nx, ny, impactSpeed) {
    const impactAngle = Math.atan2(ny, nx);
    const platingBlocker = platingBlockAtImpactAngle(body, impactAngle);
    if (platingBlocker) {
      const damage = difficultyMobDamage(structureRambotDamage + Math.max(0, impactSpeed - rambotBodyImpactSpeed) * 0.045);
      damageStructure(platingBlocker, damage, rambot.color);
      rambot.impactCooldown = 0.95;
      rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.65);
      rambot.chargeTimer = 0;
      rambot.vx += nx * 250;
      rambot.vy += ny * 250;
      playSound("mobHit", { throttleKey: "rambotPlateImpact" });
      return;
    }

    const drain = Math.min(
      36,
      rambotBodyImpactDrain + Math.sqrt(Math.max(1, body.mass)) * 0.045 + Math.max(0, impactSpeed - rambotBodyImpactSpeed) * 0.025
    );
    const originX = body.x + nx * body.radius;
    const originY = body.y + ny * body.radius;
    const lost = shedBodyMass(body, drain, originX, originY, nx, ny, body.color);

    if (lost <= 0) {
      return;
    }

    rambot.impactCooldown = 0.95;
    rambot.recoverTimer = Math.max(rambot.recoverTimer, 0.65);
    rambot.chargeTimer = 0;
    rambot.vx += nx * 250;
    rambot.vy += ny * 250;
    const recoil = clamp(lost / Math.max(1, body.mass), 0.015, 0.16) * 95;
    applyBodyVelocityChangeAtPoint(body, -nx * recoil, -ny * recoil, originX, originY, bodyConstraintTorqueResponse);
    playSound("mobHit", { throttleKey: "rambotBodyImpact" });
  }

  function updateUfoUndersideImpact(ufo) {
    if (!ufoHasTractorBeam(ufo) || player.hitCooldown > 0 || deathState.active || player.health <= 0) {
      return;
    }

    const dirX = Math.cos(ufo.beamAngle);
    const dirY = Math.sin(ufo.beamAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const relX = player.x - ufo.x;
    const relY = player.y - ufo.y;
    const forward = relX * dirX + relY * dirY;
    const side = relX * normalX + relY * normalY;
    const distance = Math.hypot(relX, relY);

    if (forward < 6 || forward > ufo.radius + player.radius * 0.85 || Math.abs(side) > 52 || distance > ufo.radius + player.radius * 0.72) {
      return;
    }

    if (player.landed) {
      detachFromBody(150);
    }

    player.vx += dirX * 210 + ufo.vx * 0.38;
    player.vy += dirY * 210 + ufo.vy * 0.38;
    damageLocalPlayer(difficultyMobDamage(bossScaledDamage(ufo, ufoUndersideDamage)), {
      cause: ufo.isBoss ? "UFO boss underside" : "UFO underside",
      cooldown: 0.85,
      flash: 0.3
    });

    sparks.push({
      x: player.x,
      y: player.y,
      radius: 48,
      color: ufo.color,
      life: 0.28,
      maxLife: 0.28
    });
  }
