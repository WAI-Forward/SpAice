  const SOLID_BODY_BACKGROUND_DAMPING = 0.992;

  function applySolidBodyBackgroundDamping(body, dt) {
    if (!body || !body.tier || !body.tier.solid || body.gadgetStabilized) {
      return;
    }
    body.vx *= Math.pow(SOLID_BODY_BACKGROUND_DAMPING, dt);
    body.vy *= Math.pow(SOLID_BODY_BACKGROUND_DAMPING, dt);
    if (Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0)) < 0.08) {
      body.vx = 0;
      body.vy = 0;
    }
  }

  function integrateBody(state, body, dt, tick) {
    if (!body) {
      return;
    }
    const tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
    body.tier = clone(tier);
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    decayGadgetPullContactIntent(body, dt);
    if (!tier.solid) {
      body.vx += Math.sin(body.wobble + tick * 0.011) * 4 * dt;
      body.vy += Math.cos(body.wobble * 1.7 + tick * 0.009) * 4 * dt;
      body.vx *= Math.pow(0.82, dt);
      body.vy *= Math.pow(0.82, dt);
    } else {
      applySolidBodyBackgroundDamping(body, dt);
    }
    body.ufoSapTimer = Math.max(0, finiteOr(body.ufoSapTimer, 0) - dt);
    body.ufoSapSourceGraceTimer = Math.max(0, finiteOr(body.ufoSapSourceGraceTimer, 0) - dt);
    body.spawnAge = Math.min(
      PARTICLE_SPAWN_TRANSITION_DURATION,
      Math.max(0, finiteOr(body.spawnAge, PARTICLE_SPAWN_TRANSITION_DURATION)) + dt
    );
    updateStarParticleEmission(state, body, dt);
    applyOrbitCaptureForces(body, state.world.particles, dt);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    maybeWakeSurvivalCampFromMovedBody(state, body);
    body.rotation = finiteOr(body.rotation, 0);
    body.angularVelocity = clamp(finiteOr(body.angularVelocity, 0), -BODY_MAX_ANGULAR_SPEED, BODY_MAX_ANGULAR_SPEED);
    if (Math.abs(body.angularVelocity) > 0.000001) {
      body.angularVelocity *= Math.pow(BODY_ANGULAR_VELOCITY_DAMPING, dt);
      const angleStep = body.angularVelocity * dt;
      if (Math.abs(angleStep) > 0.000001) {
        body.rotation += angleStep;
        rotateBodyMountedFrame(state, body.id, angleStep);
      }
    } else {
      body.angularVelocity = 0;
    }
  }

  function resolvePlayerBodyCollisions(state) {
    const players = Object.values(state.players || {});
    for (const body of state.world.particles) {
      if (!body.tier) {
        continue;
      }
      const solid = Boolean(body.tier.solid);
      for (const player of players) {
        if (player.health <= 0) {
          continue;
        }
        if (player.spacecraftInterior) {
          continue;
        }
        if (player.landed && player.landed.bodyId === body.id && !isStarBody(body)) {
          continue;
        }
        const dx = player.x - body.x;
        const dy = player.y - body.y;
        const rawDist = Math.hypot(dx, dy);
        const dist = rawDist || 1;
        const minDist = player.radius + (solid ? solidContactRadius(body) : body.radius * 0.96);
        if (dist >= minDist) {
          continue;
        }
        const nx = rawDist ? dx / dist : 1;
        const ny = rawDist ? dy / dist : 0;
        const overlap = minDist - dist;
        const bodyShare = solid ? clamp(4 / (body.mass + 4), 0.03, 0.28) : clamp(18 / (body.mass + 18), 0.48, 0.92);
        const playerShare = solid ? 1 - bodyShare : 1 - bodyShare;
        if (isSelfVacuumPulledBodyContact(player, body, nx, ny)) {
          markSurvivalCampBodyMovedByPlayer(body, player.id || "");
          resolveSelfVacuumPulledBodyContact(player, body, nx, ny, overlap, 0.88);
          continue;
        }
        player.x += nx * overlap * playerShare;
        player.y += ny * overlap * playerShare;
        body.x -= nx * overlap * bodyShare;
        body.y -= ny * overlap * bodyShare;
        markSurvivalCampBodyMovedByPlayer(body, player.id || "");
        const relativeVelocity = (player.vx - body.vx) * nx + (player.vy - body.vy) * ny;
        const incomingSpeed = Math.max(0, -relativeVelocity);
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * (solid ? 0.92 : 0.72);
          const playerImpulseShare = solid ? 0.72 : 0.18;
          const bodyImpulseShare = solid ? bodyShare : clamp(18 / (body.mass + 4), 0.35, 1.4);
          const pointX = finiteOr(body.x, 0) + nx * bodyAngularInertiaRadius(body);
          const pointY = finiteOr(body.y, 0) + ny * bodyAngularInertiaRadius(body);
          player.vx += nx * impulse * playerImpulseShare;
          player.vy += ny * impulse * playerImpulseShare;
          applyBodyVelocityChangeAtPoint(body, -nx * impulse * bodyImpulseShare, -ny * impulse * bodyImpulseShare, pointX, pointY, BODY_CONSTRAINT_TORQUE_RESPONSE);
        }
        const damageSpeed = SOLID_BODY_PLAYER_DAMAGE_SPEED;
        if (solid && incomingSpeed > damageSpeed && player.hitCooldown <= 0 && player.invulnerableTimer <= 0) {
          damagePlayer(state, player, Math.min(80, 10 + (incomingSpeed - damageSpeed) * 0.16 + Math.sqrt(body.mass) * 0.55), "body-impact");
        }
        if (isStarBody(body) && player.hitCooldown <= 0 && player.invulnerableTimer <= 0) {
          player.vx += nx * STAR_CONTACT_KNOCKBACK;
          player.vy += ny * STAR_CONTACT_KNOCKBACK;
          damagePlayer(state, player, STAR_CONTACT_DAMAGE_PER_SECOND * STAR_CONTACT_DAMAGE_COOLDOWN, "star-contact");
          state.events.push({
            type: "player.hitByStar",
            playerId: player.id,
            x: player.x,
            y: player.y,
            color: cloneColor(body.color),
            tick: state.tick
          });
        }
      }
    }
  }

  function isMergeBlockingTether(structure) {
    return Boolean(
      structure &&
      structure.type === "tether" &&
      finiteOr(structure.health, structureMaxHealth(structure.type)) > 0 &&
      !isStructureDisabled(structure) &&
      structure.bodyId &&
      structure.linkedBodyId &&
      structure.bodyId !== structure.linkedBodyId
    );
  }

  function areBodiesTetherConnected(world, a, b) {
    if (!world || !a || !b || a.id === b.id || !Array.isArray(world.structures)) {
      return false;
    }

    const targetId = b.id;
    const pending = [a.id];
    const visited = new Set(pending);

    while (pending.length) {
      const bodyId = pending.pop();

      for (const structure of world.structures) {
        if (!isMergeBlockingTether(structure)) {
          continue;
        }

        let nextBodyId = 0;
        if (structure.bodyId === bodyId) {
          nextBodyId = structure.linkedBodyId;
        } else if (structure.linkedBodyId === bodyId) {
          nextBodyId = structure.bodyId;
        }

        if (!nextBodyId || visited.has(nextBodyId)) {
          continue;
        }
        if (nextBodyId === targetId) {
          return true;
        }

        visited.add(nextBodyId);
        pending.push(nextBodyId);
      }
    }

    return false;
  }

  function resolveBodyBounce(a, b, dx, dy, minDist) {
    const rawDist = Math.hypot(dx, dy);
    const dist = rawDist || 1;
    const nx = rawDist ? dx / dist : 1;
    const ny = rawDist ? dy / dist : 0;
    const overlap = Math.max(0, minDist - dist);
    const firstMass = Math.max(1, finiteOr(a && a.mass, 1));
    const secondMass = Math.max(1, finiteOr(b && b.mass, 1));
    const totalMass = firstMass + secondMass;
    const firstShare = clamp(secondMass / totalMass, 0.08, 0.92);
    const secondShare = clamp(firstMass / totalMass, 0.08, 0.92);

    a.x -= nx * overlap * firstShare;
    a.y -= ny * overlap * firstShare;
    b.x += nx * overlap * secondShare;
    b.y += ny * overlap * secondShare;

    const relativeVelocity = (finiteOr(b.vx, 0) - finiteOr(a.vx, 0)) * nx +
      (finiteOr(b.vy, 0) - finiteOr(a.vy, 0)) * ny;
    if (relativeVelocity < 0) {
      const impulse = -relativeVelocity * 0.86;
      const contactX = (finiteOr(a.x, 0) + finiteOr(b.x, 0)) * 0.5;
      const contactY = (finiteOr(a.y, 0) + finiteOr(b.y, 0)) * 0.5;
      applyBodyVelocityChangeAtPoint(a, -nx * impulse * firstShare, -ny * impulse * firstShare, contactX, contactY, BODY_CONSTRAINT_TORQUE_RESPONSE);
      applyBodyVelocityChangeAtPoint(b, nx * impulse * secondShare, ny * impulse * secondShare, contactX, contactY, BODY_CONSTRAINT_TORQUE_RESPONSE);
    }
  }

  function damagePlayer(state, player, damage, cause) {
    if (player && player.spacecraftTarget) {
      return damageSpacecraftTarget(state, player, damage, cause);
    }
    if (!player || player.health <= 0 || player.invulnerableTimer > 0) {
      return false;
    }
    player.health = Math.max(0, player.health - Math.max(0, finiteOr(damage, 0)));
    player.hitCooldown = Math.max(player.hitCooldown || 0, 0.72);
    if (player.health <= 0) {
      player.respawnTimer = 2.4;
      state.events.push({
        type: "player.died",
        playerId: player.id,
        cause: cause || "unknown",
        tick: state.tick
      });
    }
    return true;
  }
