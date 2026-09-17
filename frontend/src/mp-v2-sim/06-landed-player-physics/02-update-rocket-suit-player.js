  function updateRocketSuitPlayer(state, player, input, dt) {
    player.rocketSuitActive = false;
    if (!isRocketSuitInputActive(player, input)) {
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - ROCKET_SUIT_CHARGE_DECAY * dt);
      return false;
    }

    if (!canSpendPlayerEnergy(player, ROCKET_SUIT_ENERGY_DRAIN * dt)) {
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - ROCKET_SUIT_CHARGE_DECAY * dt);
      return false;
    }

    if (player.landed) {
      detachPlayerFromBody(state.world, player, 95);
    }

    player.energy = Math.max(0, finiteOr(player.energy, 0) - ROCKET_SUIT_ENERGY_DRAIN * dt);
    const aim = aimVector(input);
    const charge = clamp(finiteOr(player.rocketSuitCharge, 0) + ROCKET_SUIT_CHARGE_RATE * dt, 0, 1);
    const thrust = ROCKET_SUIT_BASE_THRUST + ROCKET_SUIT_CHARGE_THRUST * charge;
    player.rocketSuitCharge = charge;
    player.rocketSuitActive = true;
    player.vx += aim.x * thrust * dt;
    player.vy += aim.y * thrust * dt;

    const speed = Math.hypot(player.vx, player.vy);
    const minHitSpeed = ROCKET_IMPACT_SPEED * 0.7;
    if (speed > minHitSpeed) {
      for (const mob of allCombatMobs(state.world)) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0 || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
          continue;
        }
        const dx = mob.x - player.x;
        const dy = mob.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > finiteOr(mob.radius, 28) + finiteOr(player.radius, PLAYER_RADIUS) * 0.72) {
          continue;
        }
        const nx = dx / dist;
        const ny = dy / dist;
        knockMob(mob, nx, ny, ROCKET_SUIT_MOB_KNOCKBACK + speed * 0.22);
        damageMob(state, mob, ROCKET_SUIT_MOB_DAMAGE + Math.max(0, speed - minHitSpeed) * ROCKET_SUIT_MOB_DAMAGE_SPEED_SCALE, "Rocket Suit", player.id || "");
        player.vx -= nx * 120;
        player.vy -= ny * 120;
        break;
      }
    }

    return true;
  }

  function clearPersonalTetherForPlayer(player) {
    if (!player || !player.personalTether) {
      return false;
    }
    player.personalTether = null;
    return true;
  }

  function personalTetherAnchorForPlayer(world, tether) {
    const body = bodyById(world, tether && tether.bodyId);
    if (!body || !isLandableBody(body)) {
      return null;
    }
    const angle = finiteOr(tether.angle, 0);
    const surfaceOffset = Math.max(0, finiteOr(tether.surfaceOffset, 0));
    const radius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + surfaceOffset;
    return {
      body,
      x: finiteOr(body.x, 0) + Math.cos(angle) * radius,
      y: finiteOr(body.y, 0) + Math.sin(angle) * radius
    };
  }

  function findPersonalTetherTargetForPlayer(world, player, input) {
    if (!world || !Array.isArray(world.particles) || !player) {
      return null;
    }
    const aim = aimVector(input);
    const aimAngle = Math.atan2(aim.y, aim.x);
    let best = null;
    let bestScore = Infinity;
    for (const body of world.particles) {
      if (!isLandableBody(body)) {
        continue;
      }
      const dx = finiteOr(body.x, 0) - finiteOr(player.x, 0);
      const dy = finiteOr(body.y, 0) - finiteOr(player.y, 0);
      const projected = dx * aim.x + dy * aim.y;
      const perpendicular = Math.abs(dx * aim.y - dy * aim.x);
      const angle = Math.atan2(finiteOr(player.y, 0) - finiteOr(body.y, 0), finiteOr(player.x, 0) - finiteOr(body.x, 0));
      const surfaceOffset = surfaceExtensionAtAngle(world, body, angle);
      const contactRadius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + surfaceOffset;
      const playerDistance = Math.max(0, Math.hypot(dx, dy) - contactRadius);
      if (
        projected < -contactRadius ||
        playerDistance > PERSONAL_TETHER_MAX_ATTACH_DISTANCE ||
        perpendicular > contactRadius + PERSONAL_TETHER_AIM_PADDING
      ) {
        continue;
      }
      const angleDelta = Math.abs(shortestAngleDelta(aimAngle, Math.atan2(dy, dx)));
      const score = Math.max(0, perpendicular - contactRadius) + playerDistance * 0.08 + angleDelta * 18;
      if (score < bestScore) {
        bestScore = score;
        best = { body, angle, surfaceOffset };
      }
    }
    return best;
  }

  function attachPersonalTetherForPlayer(state, player, input) {
    if (!state || !state.world || !player || !playerHasTool(player, PERSONAL_TETHER_TOOL_ID)) {
      return false;
    }
    const target = findPersonalTetherTargetForPlayer(state.world, player, input);
    if (!target || !target.body) {
      state.events.push({ type: "personalTether.empty", playerId: player.id || "", tick: state.tick });
      return false;
    }
    const body = target.body;
    const surfaceRadius = Math.max(1, finiteOr(body.radius, radiusFromMass(body.mass))) + Math.max(0, finiteOr(target.surfaceOffset, 0));
    const anchorX = finiteOr(body.x, 0) + Math.cos(target.angle) * surfaceRadius;
    const anchorY = finiteOr(body.y, 0) + Math.sin(target.angle) * surfaceRadius;
    const length = Math.hypot(finiteOr(player.x, 0) - anchorX, finiteOr(player.y, 0) - anchorY);
    if (length > PERSONAL_TETHER_MAX_ATTACH_DISTANCE) {
      state.events.push({ type: "personalTether.empty", playerId: player.id || "", tick: state.tick });
      return false;
    }
    player.personalTether = {
      bodyId: body.id,
      angle: target.angle,
      surfaceOffset: Math.max(0, finiteOr(target.surfaceOffset, 0)),
      restLength: clamp(length, 80, PERSONAL_TETHER_MAX_REST_LENGTH),
      deploy: 0.15,
      wobble: seededRange(hashSeed(String(state.tick || 0) + ":personal-tether:" + String(player.id || "")), 0, Math.PI * 2).value
    };
    state.events.push({ type: "personalTether.attached", playerId: player.id || "", bodyId: body.id, tick: state.tick });
    return true;
  }

  function updatePersonalTetherPlayer(state, player, input, dt) {
    if (!state || !state.world || !player || !input) {
      return false;
    }
    const activeTool = isPersonalTetherToolId(input.equippedTool) && playerHasTool(player, PERSONAL_TETHER_TOOL_ID) && !hasPlayerStatusEffect(player, "disabled");
    const fireRequested = activeTool && (input.buttons.fire || input.toolMode === "fire");
    const releaseRequested = activeTool && (input.buttons.release || input.toolMode === "release");
    const fireStarted = fireRequested && !player.personalTetherFireHeld;
    const releaseStarted = releaseRequested && !player.personalTetherReleaseHeld;
    player.personalTetherFireHeld = fireRequested;
    player.personalTetherReleaseHeld = releaseRequested;

    if (releaseStarted) {
      if (clearPersonalTetherForPlayer(player)) {
        state.events.push({ type: "personalTether.detached", playerId: player.id || "", tick: state.tick });
      }
      player.toolMode = "idle";
    } else if (fireStarted) {
      attachPersonalTetherForPlayer(state, player, input);
      player.toolMode = "idle";
    }

    const tether = player.personalTether;
    if (!tether) {
      return false;
    }
    tether.deploy = clamp(finiteOr(tether.deploy, 0) + dt * 5.2, 0, 1);
    const anchor = personalTetherAnchorForPlayer(state.world, tether);
    if (!anchor) {
      clearPersonalTetherForPlayer(player);
      return false;
    }

    const dx = finiteOr(player.x, 0) - anchor.x;
    const dy = finiteOr(player.y, 0) - anchor.y;
    const distance = Math.hypot(dx, dy) || 1;
    const restLength = clamp(finiteOr(tether.restLength, distance), 80, PERSONAL_TETHER_MAX_REST_LENGTH);
    tether.restLength = restLength;
    const tautLength = restLength + PERSONAL_TETHER_GIVE;
    if (distance <= tautLength) {
      return true;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const extension = distance - tautLength;
    const relativeSpeed = (finiteOr(player.vx, 0) - finiteOr(anchor.body.vx, 0)) * nx +
      (finiteOr(player.vy, 0) - finiteOr(anchor.body.vy, 0)) * ny;
    const pullSpeed = Math.max(0, relativeSpeed);
    const bodyMassDamping = clamp(1 / Math.pow(Math.max(1, finiteOr(anchor.body.mass, 1)) / 420, 0.32), 0.09, 1.12);
    const bodyAcceleration = clamp(
      (extension * PERSONAL_TETHER_SPRING + pullSpeed * PERSONAL_TETHER_DAMPING) * bodyMassDamping,
      0,
      PERSONAL_TETHER_BODY_MAX_ACCELERATION
    );
    const playerAcceleration = clamp(
      extension * (PERSONAL_TETHER_SPRING + 1.4) + pullSpeed * (PERSONAL_TETHER_DAMPING + 1.2),
      0,
      PERSONAL_TETHER_PLAYER_MAX_ACCELERATION
    );
    applyBodyVelocityChangeAtPoint(anchor.body, nx * bodyAcceleration * dt, ny * bodyAcceleration * dt, anchor.x, anchor.y, BODY_CONSTRAINT_TORQUE_RESPONSE);
    markSurvivalCampBodyMovedByPlayer(anchor.body, player.id || "");
    player.vx -= nx * playerAcceleration * dt;
    player.vy -= ny * playerAcceleration * dt;

    if (extension > 180) {
      const correction = (extension - 180) * 0.08;
      anchor.body.x += nx * correction * bodyMassDamping;
      anchor.body.y += ny * correction * bodyMassDamping;
      player.x -= nx * correction * 0.42;
      player.y -= ny * correction * 0.42;
    }
    return true;
  }

  function stepPlayer(state, player, input, dt) {
    if (!player) {
      return;
    }
    player.energy = Math.min(
      finiteOr(player.maxEnergy, PLAYER_MAX_ENERGY),
      clamp(finiteOr(player.energy, finiteOr(player.maxEnergy, PLAYER_MAX_ENERGY)), 0, finiteOr(player.maxEnergy, PLAYER_MAX_ENERGY)) + PLAYER_ENERGY_REGEN * dt
    );
    const safeInput = sanitizeInput(input, player, { dt, requireEnergy: true });
    player.lastInputSeq = Math.max(player.lastInputSeq || 0, safeInput.seq);
    player.aimAngle = safeInput.aimAngle;
    player.aimLocalAngle = safeInput.aimLocalAngle;
    player.equippedTool = safeInput.equippedTool;
    player.toolMode = safeInput.toolMode;
    player.boosting = false;
    player.jetpackMoveX = 0;
    player.jetpackMoveY = -1;
    player.hitCooldown = Math.max(0, finiteOr(player.hitCooldown, 0) - dt);
    player.invulnerableTimer = Math.max(0, finiteOr(player.invulnerableTimer, 0) - dt);
    updatePlayerStatusEffects(player, dt);
    player.toolFireCooldown = Math.max(0, finiteOr(player.toolFireCooldown, 0) - dt);

    if (player.health <= 0) {
      player.respawnTimer = Math.max(0, finiteOr(player.respawnTimer, 0));
      player.moving = false;
      player.crouching = false;
      player.rocketSuitActive = false;
      player.rocketSuitCharge = 0;
      player.toolMode = "idle";
      player.landed = null;
      player.spacecraftInterior = null;
      clearPersonalTetherForPlayer(player);
      return;
    }

    if (player.spacecraftInterior) {
      updateSpacecraftInteriorPlayer(state, player, safeInput, dt);
      player.toolMode = "idle";
      player.rocketSuitActive = false;
      player.rocketSuitCharge = Math.max(0, finiteOr(player.rocketSuitCharge, 0) - ROCKET_SUIT_CHARGE_DECAY * dt);
      return;
    }

    // Preserve speed carried away from a moving surface. The normal jetpack
    // limit should cap new acceleration, not erase momentum on the next frame.
    const carriedSpeed = Math.hypot(finiteOr(player.vx, 0), finiteOr(player.vy, 0));
    const rocketSuitActive = updateRocketSuitPlayer(state, player, safeInput, dt);
    let landedThisFrame = false;
    if (safeInput.buttons.land && !player.landed && safeInput.landAction !== "takeoff") {
      landedThisFrame = togglePlayerLanding(state, player);
    }
    if (player.landed) {
      const landedInput = landedThisFrame
        ? { ...safeInput, buttons: { ...safeInput.buttons, land: false } }
        : safeInput;
      updateLandedPlayer(state, player, landedInput, dt);
      useSpannerOnStructure(state, player, landedInput, dt);
      firePlayerEmpTool(state, player, landedInput);
      useFamiliarNet(state, player, landedInput);
      updatePersonalTetherPlayer(state, player, landedInput, dt);
      firePlayerPistonPunch(state, player, landedInput);
      firePlayerWeapon(state, player, landedInput);
      return;
    }

    let localX = 0;
    let localY = 0;
    if (safeInput.buttons.left) localX -= 1;
    if (safeInput.buttons.right) localX += 1;
    if (safeInput.buttons.up) localY -= 1;
    if (safeInput.buttons.down) localY += 1;

    const vacuumHoldActive = isSuctionToolId(safeInput.equippedTool) && (safeInput.buttons.hold || safeInput.toolMode === "hold");
    const suctionActive = isSuctionToolId(safeInput.equippedTool) && (safeInput.buttons.pull || safeInput.buttons.push || safeInput.buttons.hold);
    const canBoost = safeInput.buttons.boost && !suctionActive;
    if (canBoost) {
      player.energy = Math.max(0, player.energy - JETPACK_BOOST_ENERGY_DRAIN * dt);
    }
    if (suctionActive) {
      player.energy = Math.max(0, player.energy - SUCTION_ENERGY_DRAIN * dt);
    }

    const move = localX || localY ? normalize(localX, localY) : null;
    if (!vacuumHoldActive && move) {
      const thrust = 640 * (suctionActive ? 0.56 : 1) * (canBoost ? JETPACK_BOOST_THRUST_MULTIPLIER : 1);
      player.vx += move.x * thrust * dt;
      player.vy += move.y * thrust * dt;
    }

    const speed = Math.hypot(player.vx, player.vy);
    const rocketSuitMaxSpeed = ROCKET_SUIT_BASE_MAX_SPEED + clamp(finiteOr(player.rocketSuitCharge, 0), 0, 1) * ROCKET_SUIT_CHARGE_MAX_SPEED;
    const controlledMaxSpeed = vacuumHoldActive ? 0 : (rocketSuitActive ? rocketSuitMaxSpeed : (suctionActive ? 275 : 430 * (canBoost ? JETPACK_BOOST_SPEED_MULTIPLIER : 1)));
    const maxSpeed = vacuumHoldActive ? 0 : Math.max(controlledMaxSpeed, carriedSpeed);
    if (speed > maxSpeed) {
      player.vx = (player.vx / speed) * maxSpeed;
      player.vy = (player.vy / speed) * maxSpeed;
    }

    const drag = Math.pow(0.58, dt);
    player.vx *= drag;
    player.vy *= drag;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    if (updatePlayerSpacecraftEntry(state, player)) {
      player.toolMode = "idle";
      return;
    }
    useSpannerOnStructure(state, player, safeInput, dt);
    firePlayerEmpTool(state, player, safeInput);
    useFamiliarNet(state, player, safeInput);
    updatePersonalTetherPlayer(state, player, safeInput, dt);
    firePlayerPistonPunch(state, player, safeInput);
    firePlayerWeapon(state, player, safeInput);
    player.moving = Boolean(move);
    player.boosting = Boolean(canBoost && move);
    if (move) {
      player.jetpackMoveX = move.x;
      player.jetpackMoveY = move.y;
    }
    player.crouching = false;
  }

  function solidContactRadius(body) {
    if (isStarBody(body)) {
      return Math.max(1, finiteOr(body.radius, 1)) * 1.06;
    }
    return body && body.tier && body.tier.solid ? Math.max(body.radius * 0.78, body.radius - 14) : finiteOr(body && body.radius, 1);
  }

  function starParticleColor(star) {
    return mixColor({ r: 255, g: 210, b: 92 }, normalizeColor(star && star.color, { r: 255, g: 140, b: 70 }), 3, 2);
  }

  function emitStarParticle(state, seedHolder, star) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.particles)) {
      return false;
    }
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    const tangent = randomRange(seedHolder, -62, 62);
    const spawnDistance = solidContactRadius(star) + randomRange(seedHolder, 58, 108);
    const mass = randomRange(seedHolder, 0, 1) < 0.78 ? 1 : 2;
    const id = world.nextParticleId++;
    const textureSeed = randomRange(seedHolder, 0, 1000);
    const particle = normalizeParticle({
      id,
      x: star.x + nx * spawnDistance,
      y: star.y + ny * spawnDistance,
      vx: finiteOr(star.vx, 0) * 0.35 + nx * randomRange(seedHolder, 78, 178) - ny * tangent,
      vy: finiteOr(star.vy, 0) * 0.35 + ny * randomRange(seedHolder, 78, 178) + nx * tangent,
      mass,
      color: starParticleColor(star),
      textureSeed,
      wobble: randomRange(seedHolder, 0, Math.PI * 2),
      pulse: randomRange(seedHolder, 0.8, 1.25),
      spawnAge: 0,
      spawnSizeScale: ambientSpawnSizeScale(id, textureSeed)
    }, id, seedHolder);
    world.particles.push(particle);
    return true;
  }

  function recycleAmbientParticleForStarEmission(world, star) {
    if (!world || !Array.isArray(world.particles)) {
      return false;
    }
    let removeIndex = -1;
    let removeScore = -Infinity;
    const protectedRadius = solidContactRadius(star) + 420;

    for (let i = 0; i < world.particles.length; i += 1) {
      const body = world.particles[i];
      if (
        !body ||
        body === star ||
        !body.tier ||
        body.tier.name !== "particle" ||
        body.randomEventId ||
        finiteOr(body.ufoSapTimer, 0) > 0
      ) {
        continue;
      }

      const distanceFromStar = Math.hypot(finiteOr(body.x, 0) - finiteOr(star.x, 0), finiteOr(body.y, 0) - finiteOr(star.y, 0));
      if (distanceFromStar < protectedRadius) {
        continue;
      }
      const score = distanceFromStar + Math.max(0, finiteOr(body.mass, 1) - 1) * 70;
      if (score > removeScore) {
        removeScore = score;
        removeIndex = i;
      }
    }

    if (removeIndex < 0) {
      return false;
    }
    world.particles.splice(removeIndex, 1);
    return true;
  }

  function updateStarParticleEmission(state, body, dt) {
    if (!isStarBody(body)) {
      return;
    }
    body.starBirthAge = Math.min(
      STAR_BIRTH_TRANSITION_DURATION,
      Math.max(0, finiteOr(body.starBirthAge, STAR_BIRTH_TRANSITION_DURATION)) + dt
    );
    body.starEmissionAccumulator = finiteOr(body.starEmissionAccumulator, 0) + starParticleEmissionRate(body) * dt;
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state && state.seed, 1))) >>> 0 };
    const playerCount = Math.max(1, Object.keys(state && state.players || {}).length);
    const particleBudget = AMBIENT_PARTICLE_PLAYFIELD_TARGET * playerCount * 4 + 56;
    let emitted = 0;
    while (
      body.starEmissionAccumulator >= 1 &&
      emitted < STAR_PARTICLE_EMISSION_MAX_PER_FRAME
    ) {
      if (state.world.particles.length >= particleBudget && !recycleAmbientParticleForStarEmission(state.world, body)) {
        break;
      }
      body.starEmissionAccumulator -= 1;
      if (!emitStarParticle(state, seedHolder, body)) {
        break;
      }
      emitted += 1;
    }
    state.seed = seedHolder.seed >>> 0;
  }

  function syncLandedPlayersToSurfaces(state) {
    if (!state || !state.players) {
      return;
    }
    for (const player of Object.values(state.players)) {
      if (player && player.landed && player.health > 0) {
        applyLandedSurfaceConstraint(state.world, player);
      }
    }
  }
