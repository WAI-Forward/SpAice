  function updateLandedPlayer(state, player, input, dt) {
    const world = state && state.world;
    if (player && player.landed && player.landed.bridgeId) {
      updateBridgeLandedPlayer(state, player, input, dt);
      return;
    }

    const body = bodyById(world, player && player.landed && player.landed.bodyId);
    if (!world || !player || !body || !isLandableBody(body)) {
      detachPlayerFromBody(world, player, 120);
      return;
    }

    if (input.buttons.land && input.landAction !== "land") {
      detachPlayerFromBody(world, player, 190);
      player.moving = false;
      player.crouching = false;
      return;
    }

    const surfaceRadius = Math.max(
      24,
      finiteOr(body.radius, radiusFromMass(body.mass)) + surfaceExtensionAtAngle(world, body, player.landed.angle)
    );
    const tier = body.tier || tierForMass(body.mass);
    const asteroidWalkMultiplier = tier && tier.name === "asteroid" ? 0.78 : 1;
    const walkSpeed = (input.buttons.down ? 68 : 128) * asteroidWalkMultiplier;
    const holdActive = input.buttons.hold || input.toolMode === "hold";
    let walkDirection = 0;
    if (!holdActive && input.buttons.left) {
      walkDirection -= 1;
    }
    if (!holdActive && input.buttons.right) {
      walkDirection += 1;
    }
    walkDirection = clamp(walkDirection, -1, 1);

    player.landed.walkSpeed = walkDirection * walkSpeed;
    if (walkDirection) {
      player.walkCycle = finiteOr(player.walkCycle, 0) + (2.3 + Math.abs(player.landed.walkSpeed) * 0.052) * dt;
    }
    player.landed.walkCycle = finiteOr(player.walkCycle, 0);
    const previousAngle = finiteOr(player.landed.angle, 0);
    player.landed.angle = finiteOr(player.landed.angle, 0) + (player.landed.walkSpeed / surfaceRadius) * dt;
    const bridgeTransfer = findBridgeTransferFromBody(world, body.id, player.landed.angle, walkDirection);
    if (
      bridgeTransfer &&
      Math.abs(shortestAngleDelta(previousAngle, bridgeTransfer.endpoint.angle)) >= Math.abs(shortestAngleDelta(player.landed.angle, bridgeTransfer.endpoint.angle)) &&
      transferPlayerToBridge(world, player, bridgeTransfer, walkDirection, walkSpeed)
    ) {
      player.moving = Boolean(walkDirection);
      player.crouching = Boolean(input.buttons.down);
      return;
    }
    player.moving = Boolean(walkDirection);
    player.crouching = Boolean(input.buttons.down);
    applyLandedSurfaceConstraint(world, player);

    const suctionActive = isSuctionToolId(input.equippedTool) && (input.buttons.pull || input.buttons.push || input.buttons.hold);
    if (suctionActive) {
      player.energy = Math.max(0, finiteOr(player.energy, 0) - SUCTION_ENERGY_DRAIN * dt);
    }
    if (isSuctionToolId(input.equippedTool) && (input.buttons.pull || input.buttons.push)) {
      const strengthFactor = input.buttons.pull ? gadgetSuckFactor(player, input) : gadgetBlowFactor(player, input);
      if (applyGadgetThrustToBody(body, aimVector(input), input.buttons.pull ? 1 : -1, dt, strengthFactor, { x: player.x, y: player.y })) {
        markSurvivalCampBodyMovedByPlayer(body, player.id || "");
      }
    }
  }

  function firePlayerWeapon(state, player, input) {
    const weapon = weaponByToolId(player, input && input.equippedTool);
    if (!state || !state.world || !player || !weapon || !input || !input.buttons.fire) {
      return false;
    }
    if (hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    if (finiteOr(player.toolFireCooldown, 0) > 0 || finiteOr(player.energy, 0) < finiteOr(weapon.energyCost, PLAYER_WEAPON_DEFAULTS.energyCost)) {
      return false;
    }

    const aim = aimVector(input);
    const muzzleDistance = 80;
    const pelletCount = Math.max(1, Math.floor(finiteOr(weapon.pelletCount, 1)));
    const aimAngle = Math.atan2(aim.y, aim.x);
    const spread = Math.max(0, finiteOr(weapon.spread, 0));
    const seedHolder = {
      seed: (
        finiteOr(state.seed, 1) ^
        Math.imul(Math.max(1, Math.floor(finiteOr(state.tick, 0)) + 1), 2246822519) ^
        hashSeed(String(player.id || "player") + ":" + String(input.equippedTool || "weapon"))
      ) >>> 0
    };
    let firstProjectileId = 0;

    for (let i = 0; i < pelletCount; i += 1) {
      const lineT = pelletCount <= 1 ? 0 : i / (pelletCount - 1) * 2 - 1;
      const clusteredT = Math.sign(lineT) * Math.pow(Math.abs(lineT), 1.35);
      const angleJitter = pelletCount > 1 ? randomRange(seedHolder, -0.04, 0.04) : (spread > 0 ? randomRange(seedHolder, -spread, spread) * 0.55 : 0);
      const angleOffset = clusteredT * spread + angleJitter;
      const dirX = Math.cos(aimAngle + angleOffset);
      const dirY = Math.sin(aimAngle + angleOffset);
      const sideX = -dirY;
      const sideY = dirX;
      const muzzleScatter = pelletCount > 1 ? randomRange(seedHolder, -9, 9) : 0;
      const forwardScatter = pelletCount > 1 ? randomRange(seedHolder, -4, 8) : 0;
      const speed = finiteOr(weapon.speed, PLAYER_WEAPON_DEFAULTS.speed) + (pelletCount > 1 ? randomRange(seedHolder, 10, 120) : 0);
      const life = finiteOr(weapon.life, PLAYER_WEAPON_DEFAULTS.life) * (pelletCount > 1 ? randomRange(seedHolder, 0.9, 1.22) : 1);
      const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
      const projectile = normalizeEntity({
        id,
        kind: "player-projectile",
        x: player.x + dirX * (muzzleDistance + forwardScatter) + sideX * muzzleScatter,
        y: player.y + dirY * (muzzleDistance + forwardScatter) + sideY * muzzleScatter,
        vx: dirX * speed + finiteOr(player.vx, 0) * 0.18,
        vy: dirY * speed + finiteOr(player.vy, 0) * 0.18,
        radius: finiteOr(weapon.radius, PLAYER_WEAPON_DEFAULTS.radius),
        length: finiteOr(weapon.length, PLAYER_WEAPON_DEFAULTS.length),
        color: cloneColor(weapon.color || PLAYER_WEAPON_DEFAULTS.color),
        life,
        maxLife: life,
        damage: finiteOr(weapon.damage, PLAYER_WEAPON_DEFAULTS.damage),
        knockback: finiteOr(weapon.knockback, PLAYER_WEAPON_DEFAULTS.knockback),
        toolDisable: 0,
        cause: weapon.label || PLAYER_WEAPON_DEFAULTS.label,
        weaponLabel: weapon.label || PLAYER_WEAPON_DEFAULTS.label,
        sourcePlayerId: player.id || "",
        ownerPlayerId: player.id || "",
        piercesMobs: Boolean(weapon.piercesMobs),
        hitMobIds: []
      }, id, "projectile");

      state.world.rivalProjectiles.push(projectile);
      state.world.nextRivalProjectileId = projectile.id + 1;
      if (!firstProjectileId) {
        firstProjectileId = projectile.id;
      }
    }
    state.seed = seedHolder.seed >>> 0;
    player.energy = Math.max(0, finiteOr(player.energy, 0) - finiteOr(weapon.energyCost, PLAYER_WEAPON_DEFAULTS.energyCost));
    player.toolFireCooldown = finiteOr(weapon.cooldown, PLAYER_WEAPON_DEFAULTS.cooldown);
    if (!player.landed) {
      const slow = clamp(finiteOr(weapon.movementSlow, PLAYER_WEAPON_DEFAULTS.movementSlow), 0, 0.35);
      const immediateDrag = 1 - slow * 0.42;
      player.vx = player.vx * immediateDrag - aim.x * (24 + slow * 120);
      player.vy = player.vy * immediateDrag - aim.y * (24 + slow * 120);
    }
    state.events.push({
      type: "player.shot",
      playerId: player.id || "",
      projectileId: firstProjectileId,
      weapon: input.equippedTool,
      tick: state.tick
    });
    return true;
  }

  function firePlayerEmpTool(state, player, input) {
    if (!state || !state.world || !player || !input || !input.buttons.fire || !isEmpToolId(input.equippedTool)) {
      return false;
    }
    if (!playerHasTool(player, EMP_TOOL_ID) || hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    if (finiteOr(player.toolFireCooldown, 0) > 0 || finiteOr(player.energy, 0) < EMP_PULSE_ENERGY_COST) {
      return false;
    }

    player.energy = Math.max(0, finiteOr(player.energy, 0) - EMP_PULSE_ENERGY_COST);
    player.toolFireCooldown = EMP_PULSE_COOLDOWN;
    const range = EMP_PULSE_RANGE * toolUpgradeFactor(player, EMP_TOOL_ID, "range");
    const duration = EMP_PULSE_DISABLE_DURATION * toolUpgradeFactor(player, EMP_TOOL_ID, "duration");
    applyEmpPulse(state, player.x, player.y, range, duration, {
      affectMobs: true,
      affectPlayers: false,
      affectStructures: false,
      sourcePlayerId: player.id || "",
      sourceKind: "player",
      cause: "EMP tool",
      color: { r: 126, g: 232, b: 255 }
    });
    return true;
  }

  function pistonPunchSegment(player, input) {
    const aim = aimVector(input);
    return {
      ax: player.x + aim.x * 34,
      ay: player.y + aim.y * 34,
      bx: player.x + aim.x * PISTON_PUNCH_RANGE,
      by: player.y + aim.y * PISTON_PUNCH_RANGE,
      aim
    };
  }

  function findPistonPunchTarget(world, player, input) {
    const punch = pistonPunchSegment(player, input);
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || isPlayerTeamMob(mob)) {
        continue;
      }
      const radius = finiteOr(mob.radius, 28);
      const segmentDistance = distanceToSegment(mob.x, mob.y, punch.ax, punch.ay, punch.bx, punch.by);
      const playerDistance = Math.hypot(mob.x - player.x, mob.y - player.y);
      if (segmentDistance > radius + 24 || playerDistance > PISTON_PUNCH_RANGE + radius || playerDistance >= bestDistance) {
        continue;
      }
      best = mob;
      bestDistance = playerDistance;
    }
    return best;
  }

  function firePlayerPistonPunch(state, player, input) {
    if (!state || !state.world || !player || !input || !input.buttons.fire || !isPistonPunchToolId(input.equippedTool)) {
      return false;
    }
    if (!playerHasTool(player, PISTON_PUNCH_TOOL_ID) || hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }
    if (finiteOr(player.toolFireCooldown, 0) > 0 || finiteOr(player.energy, 0) < PISTON_PUNCH_ENERGY_COST) {
      return false;
    }

    const punch = pistonPunchSegment(player, input);
    const target = findPistonPunchTarget(state.world, player, input);
    player.energy = Math.max(0, finiteOr(player.energy, 0) - PISTON_PUNCH_ENERGY_COST);
    player.toolFireCooldown = PISTON_PUNCH_COOLDOWN;
    if (target) {
      target.vx += punch.aim.x * PISTON_PUNCH_KNOCKBACK;
      target.vy += punch.aim.y * PISTON_PUNCH_KNOCKBACK;
      damageMob(state, target, PISTON_PUNCH_DAMAGE, "Piston Punch", { playerId: player.id || "", cause: "piston-punch", hostileActionType: "direct-tool-damage" });
    }
    state.events.push({
      type: "player.pistonPunch",
      playerId: player.id || "",
      targetMobId: target ? target.id : 0,
      x: target ? target.x : punch.bx,
      y: target ? target.y : punch.by,
      tick: state.tick
    });
    return true;
  }

  function isPlayerTeamMob(mob) {
    return Boolean(mob && mob.team === "player");
  }

  function familiarOwnerIdForPlayer(player) {
    return String(player && player.id || "");
  }

  function isFamiliarOwnedByPlayer(mob, player) {
    const ownerId = familiarOwnerIdForPlayer(player);
    return Boolean(isPlayerTeamMob(mob) && ownerId && mob.familiarOwnerPlayerId === ownerId);
  }

  function hasLiveFamiliarForPlayer(world, player) {
    return allCombatMobs(world).some((mob) => mob && mob.health > 0 && isFamiliarOwnedByPlayer(mob, player));
  }

  function liveFamiliarsForPlayer(world, player) {
    return allCombatMobs(world).filter((mob) => mob && mob.health > 0 && isFamiliarOwnedByPlayer(mob, player));
  }

  function commandFamiliarsForPlayer(state, player, input) {
    const familiars = liveFamiliarsForPlayer(state.world, player);
    if (!familiars.length) {
      return false;
    }
    const aim = aimVector(input);
    const command = input && input.familiarCommand ? input.familiarCommand : {
      x: player.x + aim.x * FAMILIAR_NET_RANGE,
      y: player.y + aim.y * FAMILIAR_NET_RANGE
    };
    const x = finiteOr(command.x, player.x + aim.x * FAMILIAR_NET_RANGE);
    const y = finiteOr(command.y, player.y + aim.y * FAMILIAR_NET_RANGE);
    for (const familiar of familiars) {
      const dx = x - finiteOr(familiar.x, 0);
      const dy = y - finiteOr(familiar.y, 0);
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const towardSpeed = finiteOr(familiar.vx, 0) * nx + finiteOr(familiar.vy, 0) * ny;
      if (towardSpeed < 0) {
        familiar.vx -= nx * towardSpeed;
        familiar.vy -= ny * towardSpeed;
      }
      familiar.familiarCommandX = x;
      familiar.familiarCommandY = y;
      familiar.familiarCommandTimer = 8;
    }
    player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
    player.toolMode = "idle";
    state.events.push({ type: "familiarNet.command", playerId: player.id || "", x, y, tick: state.tick });
    return true;
  }

  function isCombatMobEntity(entity) {
    return Boolean(entity && MOB_TIER_ORDER.includes(entity.kind));
  }

  function playerTeamMobProjectileFields(mob) {
    return {
      team: isPlayerTeamMob(mob) ? "player" : "",
      ownerPlayerId: isPlayerTeamMob(mob) ? String(mob && mob.familiarOwnerPlayerId || "") : "",
      sourceMobId: mob && mob.id ? mob.id : 0
    };
  }

  function familiarHostileTargets(world, source) {
    return allCombatMobs(world).filter((mob) => mob && mob !== source && mob.health > 0 && !isPlayerTeamMob(mob));
  }

  function isMobSummoning(mob) {
    return Boolean(mob && finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0));
  }

  function familiarNetSwipeSegment(player, input) {
    const aim = aimVector(input);
    return {
      ax: player.x + aim.x * 24,
      ay: player.y + aim.y * 24,
      bx: player.x + aim.x * FAMILIAR_NET_RANGE,
      by: player.y + aim.y * FAMILIAR_NET_RANGE,
      aim
    };
  }

  function findFamiliarNetTarget(world, player, input) {
    const swipe = familiarNetSwipeSegment(player, input);
    let best = null;
    let bestScore = Infinity;
    const aimAngle = Math.atan2(swipe.aim.y, swipe.aim.x);
    for (const mob of allCombatMobs(world)) {
      if (!mob || mob.health <= 0 || mob.isBoss || isPlayerTeamMob(mob) || isMobSummoning(mob)) {
        continue;
      }
      const mobDx = mob.x - player.x;
      const mobDy = mob.y - player.y;
      const segmentDistance = distanceToSegment(mob.x, mob.y, swipe.ax, swipe.ay, swipe.bx, swipe.by);
      const playerDistance = Math.hypot(mobDx, mobDy);
      const mobAngle = Math.atan2(mobDy, mobDx);
      const angleDelta = Math.abs(shortestAngleDelta(aimAngle, mobAngle));
      const mobRadius = finiteOr(mob.radius, 28);
      const inSwipeLine = segmentDistance <= mobRadius + FAMILIAR_NET_CATCH_LINE_PADDING;
      const inSwipeArc = angleDelta <= FAMILIAR_NET_CATCH_HALF_ANGLE;
      if (playerDistance > FAMILIAR_NET_RANGE + mobRadius || (!inSwipeLine && !inSwipeArc)) {
        continue;
      }
      const score = playerDistance + angleDelta * 55 + segmentDistance * 0.3;
      if (score >= bestScore) {
        continue;
      }
      best = mob;
      bestScore = score;
    }
    return best;
  }

  function removeMobFromWorld(world, mob) {
    const collection = mob && mobCollectionByKind(world, mob.kind);
    if (!Array.isArray(collection)) {
      return false;
    }
    const index = collection.indexOf(mob);
    if (index < 0) {
      return false;
    }
    collection.splice(index, 1);
    return true;
  }

  function useFamiliarNet(state, player, input) {
    if (!state || !state.world || !player || !input || !isFamiliarNetToolId(input.equippedTool) || !playerHasTool(player, FAMILIAR_NET_TOOL_ID)) {
      return false;
    }
    const fireRequested = input.buttons.fire || input.toolMode === "fire";
    const releaseRequested = input.buttons.release || input.toolMode === "release" || input.buttons.push || input.toolMode === "push";
    const fireStarted = fireRequested && !player.familiarNetFireHeld;
    const releaseStarted = releaseRequested && !player.familiarNetReleaseHeld;
    player.familiarNetFireHeld = fireRequested;
    player.familiarNetReleaseHeld = releaseRequested;

    if (hasPlayerStatusEffect(player, "disabled") || finiteOr(player.toolFireCooldown, 0) > 0) {
      return false;
    }

    if (releaseStarted) {
      const seedHolder = { seed: hashSeed(String(state.tick || 0) + ":familiar-net-release:" + String(player.id || "")) };
      const capture = normalizeFamiliarNetCapture(player.familiarNetCapture);
      if (!capture) {
        if (commandFamiliarsForPlayer(state, player, input)) {
          player.familiarNetCapture = null;
          return true;
        }
        player.familiarNetCapture = null;
        player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
        player.toolMode = "idle";
        state.events.push({ type: "familiarNet.empty", playerId: player.id || "", tick: state.tick });
        return true;
      }
      if (hasLiveFamiliarForPlayer(state.world, player)) {
        player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
        player.toolMode = "idle";
        state.events.push({ type: "familiarNet.active", playerId: player.id || "", action: "release", tick: state.tick });
        return true;
      }
      const aim = aimVector(input);
      const mob = createMob(state.world, capture.kind, player.x + aim.x * 118, player.y + aim.y * 118, seedHolder, {
        team: "player",
        familiarOwnerPlayerId: familiarOwnerIdForPlayer(player),
        health: capture.health,
        maxHealth: capture.maxHealth,
        color: capture.color || undefined,
        summonAge: 0,
        summonDuration: 0.42,
        summonSpinSpeed: 8
      });
      mob.team = "player";
      mob.familiarOwnerPlayerId = familiarOwnerIdForPlayer(player);
      mob.summonBaseRadius = Math.max(1, finiteOr(mob.radius, 28));
      mob.radius = 0;
      mob.vx += aim.x * 140 + finiteOr(player.vx, 0) * 0.2;
      mob.vy += aim.y * 140 + finiteOr(player.vy, 0) * 0.2;
      mobCollectionByKind(state.world, mob.kind).push(mob);
      player.familiarNetCapture = null;
      player.toolFireCooldown = FAMILIAR_NET_RELEASE_COOLDOWN;
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.released", playerId: player.id || "", mobId: mob.id, kind: mob.kind, x: mob.x, y: mob.y, tick: state.tick });
      return true;
    }

    if (!fireStarted) {
      return false;
    }

    player.toolFireCooldown = FAMILIAR_NET_COOLDOWN;
    if (player.familiarNetCapture) {
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.full", playerId: player.id || "", tick: state.tick });
      return true;
    }
    if (hasLiveFamiliarForPlayer(state.world, player)) {
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.active", playerId: player.id || "", action: "catch", tick: state.tick });
      return true;
    }

    const target = findFamiliarNetTarget(state.world, player, input);
    if (!target) {
      const swipe = familiarNetSwipeSegment(player, input);
      player.toolMode = "idle";
      state.events.push({ type: "familiarNet.swung", playerId: player.id || "", x: swipe.bx, y: swipe.by, tick: state.tick });
      return true;
    }
    player.familiarNetCapture = {
      kind: target.kind,
      health: clamp(finiteOr(target.health, target.maxHealth), 1, finiteOr(target.maxHealth, target.health || 1)),
      maxHealth: Math.max(1, finiteOr(target.maxHealth, target.health || 1)),
      color: cloneColor(target.color)
    };
    removeMobFromWorld(state.world, target);
    player.toolMode = "idle";
    state.events.push({ type: "familiarNet.caught", playerId: player.id || "", mobId: target.id, kind: target.kind, x: target.x, y: target.y, tick: state.tick });
    return true;
  }

  function isRocketSuitInputActive(player, input) {
    return Boolean(
      player &&
      input &&
      isRocketSuitToolId(input.equippedTool) &&
      playerHasTool(player, ROCKET_SUIT_TOOL_ID) &&
      input.buttons.fire &&
      !hasPlayerStatusEffect(player, "disabled")
    );
  }
