  function updatePlayerSpacecraftEntry(state, player) {
    const world = state && state.world;
    if (!world || !player || player.spacecraftInterior || player.landed || player.health <= 0) {
      return false;
    }
    for (const craft of world.spacecrafts || []) {
      const local = spacecraftWorldToLocal(craft, player.x, player.y);
      const door = spacecraftDoor(craft);
      const doorX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
      const thresholdX = doorX + finiteOr(door.threshold, 40);
      const floor = spacecraftFloorForX(craft, local.x, local.y);
      if (
        local.x >= thresholdX - 30 &&
        local.x <= thresholdX + 74 &&
        spacecraftDoorContainsLocal(craft, local.x, local.y, 0) &&
        floor
      ) {
        return enterPlayerSpacecraftInterior(player, craft, local);
      }
    }
    return false;
  }

  function updateSpacecraftInteriorPlayer(state, player, input, dt) {
    const world = state && state.world;
    const craft = findSpacecraftByIdInWorld(world, player && player.spacecraftInterior && player.spacecraftInterior.spacecraftId);
    if (!world || !player || !craft) {
      if (player) {
        player.spacecraftInterior = null;
      }
      return false;
    }

    const interior = player.spacecraftInterior;
    let localX = finiteOr(interior.localX, 0);
    let localY = finiteOr(interior.localY, 0);
    let inputX = 0;
    const forcedExit = Boolean(interior.forceExit);
    if (forcedExit) {
      inputX = -1;
    } else if (!(input.buttons.hold || input.toolMode === "hold")) {
      if (input.buttons.left) inputX -= 1;
      if (input.buttons.right) inputX += 1;
    }
    const floor = spacecraftFloorForX(craft, localX, localY);
    if (!floor) {
      leavePlayerSpacecraftInterior(player, craft, { localX, localY, speed: 230 });
      return true;
    }

    localY = floor.centerY;
    const walkDirection = inputX < 0 ? -1 : inputX > 0 ? 1 : 0;
    const forcedExitSpeed = Math.max(156, finiteOr(interior.forceExitSpeed, 210));
    const walkSpeed = walkDirection ? (forcedExit ? forcedExitSpeed : 156) : 0;
    if (walkDirection) {
      const nextX = localX + walkDirection * walkSpeed * dt;
      const nextFloor = spacecraftFloorForX(craft, nextX, localY);
      if (nextFloor) {
        localX = clamp(nextX, nextFloor.minX, nextFloor.maxX);
        localY = nextFloor.centerY;
        player.walkCycle = finiteOr(player.walkCycle, 0) + (2.2 + walkSpeed * 0.038) * dt;
      } else {
        localX = clamp(localX, floor.minX, floor.maxX);
      }
    }

    const door = spacecraftDoor(craft);
    const doorX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
    if (spacecraftDoorContainsLocal(craft, localX, localY, -8) && localX < doorX - 48) {
      leavePlayerSpacecraftInterior(player, craft, { localX, localY, speed: forcedExit ? forcedExitSpeed : 210 });
      return true;
    }

    interior.localX = localX;
    interior.localY = localY;
    interior.walkSpeed = walkSpeed;
    interior.forceExit = forcedExit;
    interior.forceExitSpeed = forcedExit ? forcedExitSpeed : 0;
    interior.onFloor = true;
    const worldPosition = spacecraftLocalToWorld(craft, localX, localY);
    player.x = worldPosition.x;
    player.y = worldPosition.y;
    player.vx = finiteOr(craft.vx, 0) + walkDirection * walkSpeed;
    player.vy = finiteOr(craft.vy, 0);
    player.landed = null;
    player.cameraRoll = 0;
    player.moving = Boolean(walkDirection);
    player.crouching = false;
    return true;
  }

  function spacecraftComponentHitRadius(component) {
    if (!component) {
      return 32;
    }
    if (component.kind === "turret") {
      return Math.max(16, finiteOr(component.radius, 28));
    }
    return Math.max(22, Math.hypot(finiteOr(component.w, 40), finiteOr(component.h, 40)) * 0.34);
  }

  function updateSpacecraftWorldFields(craft) {
    if (!craft) {
      return;
    }
    for (const component of craft.components || []) {
      const world = spacecraftLocalToWorld(craft, component.x, component.y);
      component.worldX = world.x;
      component.worldY = world.y;
      component.hitRadius = spacecraftComponentHitRadius(component);
    }
    for (const npc of craft.npcs || []) {
      const world = spacecraftLocalToWorld(craft, npc.x, npc.y);
      npc.worldX = world.x;
      npc.worldY = world.y;
    }
  }

  function liveSpacecraftComponents(craft) {
    return (craft && Array.isArray(craft.components) ? craft.components : []).filter((component) => component && finiteOr(component.health, 0) > 0);
  }

  function spacecraftHasLiveKind(craft, kind) {
    return liveSpacecraftComponents(craft).some((component) => component.kind === kind);
  }

  function nearestSpacecraftComponentTarget(world, x, y, maxRange) {
    let best = null;
    let bestScore = Infinity;
    const range = Math.max(1, finiteOr(maxRange, 1800));
    for (const craft of world && world.spacecrafts || []) {
      updateSpacecraftWorldFields(craft);
      for (const component of liveSpacecraftComponents(craft)) {
        if (component.kind === "room" && component.id !== "airlock") {
          continue;
        }
        const distance = Math.hypot(component.worldX - x, component.worldY - y);
        if (distance > range + component.hitRadius) {
          continue;
        }
        const score = distance - (component.kind === "generator" || component.kind === "turret" ? 90 : 0);
        if (score < bestScore) {
          best = { craft, component };
          bestScore = score;
        }
      }
    }
    if (!best) {
      return null;
    }
    return {
      id: "spacecraft:" + best.craft.id + ":" + best.component.id,
      spacecraftTarget: true,
      spacecraftId: best.craft.id,
      spacecraftComponentId: best.component.id,
      x: best.component.worldX,
      y: best.component.worldY,
      vx: finiteOr(best.craft.vx, 0),
      vy: finiteOr(best.craft.vy, 0),
      radius: best.component.hitRadius,
      health: best.component.health,
      maxHealth: best.component.maxHealth
    };
  }

  function spacecraftComponentTargets(world) {
    const targets = [];
    for (const craft of world && world.spacecrafts || []) {
      updateSpacecraftWorldFields(craft);
      for (const component of liveSpacecraftComponents(craft)) {
        if (component.kind === "room" && component.id !== "airlock") {
          continue;
        }
        targets.push({
          id: "spacecraft:" + craft.id + ":" + component.id,
          spacecraftTarget: true,
          spacecraftId: craft.id,
          spacecraftComponentId: component.id,
          x: component.worldX,
          y: component.worldY,
          vx: finiteOr(craft.vx, 0),
          vy: finiteOr(craft.vy, 0),
          radius: component.hitRadius,
          health: component.health,
          maxHealth: component.maxHealth
        });
      }
    }
    return targets;
  }

  function damageSpacecraftComponent(state, craft, component, damage, cause) {
    if (!state || !craft || !component || finiteOr(component.health, 0) <= 0) {
      return false;
    }
    component.health = clamp(finiteOr(component.health, component.maxHealth) - Math.max(0, finiteOr(damage, 0)), 0, finiteOr(component.maxHealth, 1));
    component.flash = Math.max(finiteOr(component.flash, 0), 0.34);
    if (component.health <= 0) {
      component.disabledTimer = Math.max(finiteOr(component.disabledTimer, 0), 1.2);
    }
    state.events.push({
      type: "spacecraft.componentHit",
      spacecraftId: craft.id,
      componentId: component.id,
      damage: Math.max(0, finiteOr(damage, 0)),
      cause: cause || "mob",
      x: finiteOr(component.worldX, craft.x),
      y: finiteOr(component.worldY, craft.y),
      tick: state.tick
    });
    return component.health <= 0;
  }

  function damageSpacecraftTarget(state, target, damage, cause) {
    if (!target || !target.spacecraftTarget) {
      return false;
    }
    const craft = findSpacecraftByIdInWorld(state && state.world, target.spacecraftId);
    const component = craft && (craft.components || []).find((candidate) => candidate && candidate.id === target.spacecraftComponentId);
    return damageSpacecraftComponent(state, craft, component, damage, cause);
  }

  function nearestSpacecraftComponentOnSegment(world, ax, ay, bx, by, radius) {
    let best = null;
    let bestDistance = Infinity;
    for (const craft of world && world.spacecrafts || []) {
      updateSpacecraftWorldFields(craft);
      for (const component of liveSpacecraftComponents(craft)) {
        if (component.kind === "room" && component.id !== "airlock") {
          continue;
        }
        const hitRadius = spacecraftComponentHitRadius(component) + Math.max(0, finiteOr(radius, 0));
        const distance = distanceToSegment(component.worldX, component.worldY, ax, ay, bx, by);
        if (distance > hitRadius) {
          continue;
        }
        const fromStart = Math.hypot(component.worldX - ax, component.worldY - ay);
        if (fromStart < bestDistance) {
          best = { craft, component };
          bestDistance = fromStart;
        }
      }
    }
    return best;
  }

  function fireSpacecraftDefenseProjectile(state, craft, originX, originY, target, options) {
    if (!state || !state.world || !target) {
      return 0;
    }
    const settings = options || {};
    const speed = finiteOr(settings.speed, TURRET_LASER_SPEED);
    const leadTime = clamp(Math.hypot(target.x - originX, target.y - originY) / speed, 0, 0.9);
    const aim = normalize(
      target.x + finiteOr(target.vx, 0) * leadTime * 0.45 - originX,
      target.y + finiteOr(target.vy, 0) * leadTime * 0.45 - originY
    );
    const id = Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1)));
    const projectile = normalizeEntity({
      id,
      kind: "projectile",
      x: originX + aim.x * finiteOr(settings.muzzleDistance, 36),
      y: originY + aim.y * finiteOr(settings.muzzleDistance, 36),
      vx: aim.x * speed + finiteOr(craft.vx, 0) * 0.12,
      vy: aim.y * speed + finiteOr(craft.vy, 0) * 0.12,
      radius: finiteOr(settings.radius, 4),
      length: finiteOr(settings.length, 42),
      color: settings.color || { r: 255, g: 115, b: 173 },
      life: finiteOr(settings.life, 1.15),
      maxLife: finiteOr(settings.life, 1.15),
      damage: finiteOr(settings.damage, TURRET_LASER_DAMAGE),
      knockback: finiteOr(settings.knockback, TURRET_LASER_KNOCKBACK),
      cause: settings.weaponLabel || "ship turret",
      sourceStructureId: "spacecraft:" + craft.id + ":" + String(settings.sourceId || "weapon"),
      piercesMobs: Boolean(settings.piercesMobs)
    }, id, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = id + 1;
    state.events.push({ type: "spacecraft.shot", spacecraftId: craft.id, projectileId: projectile.id, weapon: settings.weaponLabel || "ship turret", tick: state.tick });
    return Math.atan2(aim.y, aim.x);
  }

  function findSpacecraftDefenseTarget(world, originX, originY, range) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || finiteOr(mob.health, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - originX, mob.y - originY);
      if (distance > range || distance >= bestDistance) {
        continue;
      }
      best = mob;
      bestDistance = distance;
    }
    return best;
  }

  function findTraderSniperTarget(world, craft, originX, originY, range) {
    const door = spacecraftDoor(craft);
    const doorX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
    const doorSideLimit = doorX + finiteOr(door.depth, 140) + 240;
    let best = null;
    let bestScore = Infinity;
    let fallback = null;
    let fallbackDistance = Infinity;
    for (const mob of allCombatMobs(world)) {
      if (!mob || finiteOr(mob.health, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - originX, mob.y - originY);
      if (distance > range) {
        continue;
      }
      if (distance < fallbackDistance) {
        fallback = mob;
        fallbackDistance = distance;
      }
      const local = spacecraftWorldToLocal(craft, mob.x, mob.y);
      if (local.x > doorSideLimit) {
        continue;
      }
      const score = distance + Math.max(0, local.x - doorX) * 1.4;
      if (score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }
    return best || fallback;
  }

  function updateSpacecraftTurrets(state, craft, dt) {
    const powered = spacecraftHasLiveKind(craft, "generator") || spacecraftHasLiveKind(craft, "battery");
    for (const component of craft.components || []) {
      component.flash = Math.max(0, finiteOr(component.flash, 0) - dt);
      component.disabledTimer = Math.max(0, finiteOr(component.disabledTimer, 0) - dt);
      if (component.kind !== "turret") {
        continue;
      }
      component.shootCooldown = Math.max(0, finiteOr(component.shootCooldown, 0) - dt);
      if (finiteOr(component.health, 0) <= 0 || component.disabledTimer > 0 || !powered) {
        continue;
      }
      const target = findSpacecraftDefenseTarget(state.world, component.worldX, component.worldY, 760);
      if (target) {
        const targetAngle = Math.atan2(target.y - component.worldY, target.x - component.worldX);
        component.aimAngle = finiteOr(component.aimAngle, component.angle) + clamp(shortestAngleDelta(finiteOr(component.aimAngle, component.angle), targetAngle), -4.4 * dt, 4.4 * dt);
        if (component.shootCooldown <= 0) {
          fireSpacecraftDefenseProjectile(state, craft, component.worldX, component.worldY, target, {
            damage: 26,
            length: 46,
            sourceId: component.id,
            weaponLabel: "ship turret"
          });
          component.shootCooldown = 1.9;
          component.flash = 0.2;
        }
      } else {
        component.aimAngle = finiteOr(component.aimAngle, component.angle) + clamp(shortestAngleDelta(finiteOr(component.aimAngle, component.angle), finiteOr(component.angle, 0) + finiteOr(craft.rotation, 0)), -2.2 * dt, 2.2 * dt);
      }
    }
  }

  function updateSpacecraftNpc(state, craft, npc, dt) {
    const door = spacecraftDoor(craft);
    const perchX = finiteOr(door.x, -finiteOr(craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5) - 28;
    const perchFloor = spacecraftFloorForX(craft, perchX, finiteOr(door.y, npc.y));
    const perchY = perchFloor ? perchFloor.floorY - 48 : finiteOr(door.y, npc.y);
    const perchWorld = spacecraftLocalToWorld(craft, perchX, perchY);
    const nearbyTarget = findTraderSniperTarget(state.world, craft, perchWorld.x, perchWorld.y, 1780);

    npc.combatTarget = Boolean(nearbyTarget);
    npc.crouching = Boolean(nearbyTarget);
    if (nearbyTarget) {
      npc.targetX = perchX;
      npc.targetY = perchY;
    } else if (Math.hypot(npc.x - npc.targetX, npc.y - npc.targetY) < 12) {
      const rooms = spacecraftRooms(craft);
      const room = rooms.length ? rooms[npc.wanderIndex % rooms.length] : null;
      if (room) {
        const seed = spacecraftStringSeed(npc.id) + craft.id * 17 + npc.wanderIndex * 31;
        npc.targetX = finiteOr(room.x, 0) + (spacecraftHashUnit(seed) - 0.5) * finiteOr(room.w, 80) * 0.62;
        const floor = spacecraftFloorForX(craft, npc.targetX, npc.y);
        npc.targetY = floor ? floor.floorY - 42 : finiteOr(room.y, 0) + finiteOr(room.h, 80) * 0.32;
        npc.wanderIndex += 1;
      }
    }

    const dx = npc.targetX - npc.x;
    const dy = npc.targetY - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const stepDistance = Math.min(dist, Math.max(20, finiteOr(npc.speed, 70)) * dt);
      npc.x += dx / dist * stepDistance;
      npc.y += dy / dist * stepDistance;
      npc.walkCycle += (2.3 + Math.max(20, finiteOr(npc.speed, 70)) * 0.035) * dt;
      npc.aimAngle = Math.atan2(dy, dx);
    }

    const worldPosition = spacecraftLocalToWorld(craft, npc.x, npc.y);
    npc.worldX = worldPosition.x;
    npc.worldY = worldPosition.y;
    npc.sniperCooldown = Math.max(0, finiteOr(npc.sniperCooldown, 0) - dt);
    if (nearbyTarget) {
      npc.aimAngle = Math.atan2(nearbyTarget.y - npc.worldY, nearbyTarget.x - npc.worldX) - finiteOr(craft.rotation, 0);
    }
    if (nearbyTarget && npc.sniperCooldown <= 0) {
      const shotAngle = fireSpacecraftDefenseProjectile(state, craft, npc.worldX, npc.worldY, nearbyTarget, {
        speed: 1340,
        damage: 42,
        length: 96,
        radius: 4,
        life: 2.35,
        knockback: 320,
        color: { r: 255, g: 213, b: 122 },
        weaponLabel: "trader sniper",
        sourceId: npc.id,
        sparkRadius: 20,
        piercesMobs: true
      });
      npc.aimAngle = shotAngle - finiteOr(craft.rotation, 0);
      npc.sniperShotIndex += 1;
      npc.sniperCooldown = 2.1 + spacecraftHashUnit(spacecraftStringSeed(npc.id) + npc.sniperShotIndex * 13) * 1.1;
    }
  }

  function updateSpacecrafts(state, dt) {
    const world = state && state.world;
    if (!world || !Array.isArray(world.spacecrafts)) {
      return;
    }
    for (const craft of world.spacecrafts) {
      updateSpacecraftWorldFields(craft);
      for (const npc of craft.npcs || []) {
        updateSpacecraftNpc(state, craft, npc, dt);
      }
      updateSpacecraftWorldFields(craft);
      updateSpacecraftTurrets(state, craft, dt);
      updateSpacecraftWorldFields(craft);
    }
  }

  function activeParticleStormParticles(world) {
    return (world && Array.isArray(world.particles) ? world.particles : []).filter((particle) => {
      return particle && particle.randomEventId === PARTICLE_STORM_EVENT_ID;
    });
  }

  function stormParticleColor(seedHolder) {
    const hue = randomRange(seedHolder, 0, 1) < 0.65 ? randomRange(seedHolder, 182, 215) : randomRange(seedHolder, 294, 334);
    return hslToRgb(hue, randomRange(seedHolder, 0.72, 0.94), randomRange(seedHolder, 0.54, 0.72));
  }

  function activeMeteorShowerParticles(world) {
    return (world && Array.isArray(world.particles) ? world.particles : []).filter((particle) => {
      return particle && particle.randomEventId === METEOR_SHOWER_EVENT_ID;
    });
  }

  function meteorBodyColor(seedHolder) {
    const palettes = [
      { r: 124, g: 118, b: 110 },
      { r: 164, g: 143, b: 116 },
      { r: 94, g: 104, b: 112 },
      { r: 142, g: 114, b: 91 },
      { r: 186, g: 154, b: 111 }
    ];
    return cloneColor(palettes[Math.floor(randomRange(seedHolder, 0, palettes.length))] || palettes[0]);
  }
