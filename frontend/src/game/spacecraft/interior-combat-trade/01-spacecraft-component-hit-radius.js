  function spacecraftComponentHitRadius(component) {
    if (component.kind === "turret") {
      return Math.max(16, finiteOr(component.radius, 28));
    }
    return Math.max(22, Math.hypot(finiteOr(component.w, 40), finiteOr(component.h, 40)) * 0.34);
  }

  function spacecraftComponentRectContains(component, localX, localY, padding) {
    const pad = Math.max(0, finiteOr(padding, 0));
    return (
      localX >= component.x - component.w * 0.5 + pad &&
      localX <= component.x + component.w * 0.5 - pad &&
      localY >= component.y - component.h * 0.5 + pad &&
      localY <= component.y + component.h * 0.5 - pad
    );
  }

  function spacecraftDoorContainsLocal(craft, localX, localY, padding) {
    const door = craft.door || {};
    const pad = Math.max(0, finiteOr(padding, 0));
    const halfHeight = finiteOr(door.height, 120) * 0.5 + pad;
    const doorX = finiteOr(door.x, -craft.width * 0.5);
    const depth = Math.max(60, finiteOr(door.depth, 100));
    return (
      Math.abs(localY - finiteOr(door.y, 0)) <= halfHeight &&
      localX >= doorX - 74 - pad &&
      localX <= doorX + depth + pad
    );
  }

  function spacecraftFloorForX(craft, localX, preferredY) {
    let best = null;
    let bestDelta = Infinity;
    for (const component of craft.components) {
      if (component.kind !== "room" || component.health <= 0) {
        continue;
      }
      const inset = Math.max(10, player.radius * 0.24);
      const minX = component.x - component.w * 0.5 + inset;
      const maxX = component.x + component.w * 0.5 - inset;
      if (localX < minX || localX > maxX) {
        continue;
      }
      const floorY = component.y + component.h * 0.5 - Math.max(8, finiteOr(component.floorInset, 24));
      const centerY = floorY - playerFootOffset;
      const delta = Math.abs(centerY - finiteOr(preferredY, centerY));
      if (delta < bestDelta) {
        best = {
          room: component,
          floorY,
          centerY,
          minX,
          maxX,
          ceilingY: component.y - component.h * 0.5 + 26
        };
        bestDelta = delta;
      }
    }
    if (!best) {
      const airlock = craft.components.find((component) => component.id === "airlock" && component.kind === "room" && component.health > 0);
      const door = craft.door || {};
      if (airlock) {
        const doorX = finiteOr(door.x, -craft.width * 0.5);
        const minX = doorX - 82;
        const maxX = airlock.x + airlock.w * 0.5 - Math.max(10, player.radius * 0.24);
        const floorY = airlock.y + airlock.h * 0.5 - Math.max(8, finiteOr(airlock.floorInset, 24));
        const centerY = floorY - playerFootOffset;
        if (
          localX >= minX &&
          localX <= maxX &&
          Math.abs(finiteOr(preferredY, centerY) - finiteOr(door.y, centerY)) <= finiteOr(door.height, 180) * 0.58
        ) {
          return {
            room: airlock,
            floorY,
            centerY,
            minX,
            maxX,
            ceilingY: airlock.y - airlock.h * 0.5 + 26
          };
        }
      }
    }
    return best;
  }

  function spacecraftCanStandAt(craft, localX, localY) {
    const floor = spacecraftFloorForX(craft, localX, localY);
    return Boolean(floor && Math.abs(localY - floor.centerY) <= 48);
  }

  function spacecraftComponentAtLocal(craft, localX, localY) {
    for (const component of craft.components) {
      if (component.health <= 0) {
        continue;
      }
      if (component.kind === "turret") {
        const dist = Math.hypot(localX - component.x, localY - component.y);
        if (dist <= component.radius + 14) {
          return component;
        }
        continue;
      }
      if (spacecraftComponentRectContains(component, localX, localY, 0)) {
        return component;
      }
    }
    return null;
  }

  function enterSpacecraftInterior(craft, local) {
    const entryX = finiteOr(local.x, craft.door.x + craft.door.depth * 0.5);
    const floor = spacecraftFloorForX(craft, entryX, finiteOr(local.y, craft.door.y));
    player.landed = null;
    player.spacecraftInterior = {
      spacecraftId: craft.id,
      localX: entryX,
      localY: floor ? floor.centerY : finiteOr(craft.door.y, 0),
      walkSpeed: 0,
      forceExit: false,
      forceExitSpeed: 0,
      onFloor: true
    };
    player.vx = 0;
    player.vy = 0;
    cameraRoll = 0;
    maybeNotifyText("Entered " + craft.name + ".");
  }

  function leaveSpacecraftInterior(craft, options) {
    const settings = options || {};
    const local = player.spacecraftInterior || {
      localX: finiteOr(craft.door && craft.door.x, -craft.width * 0.5) - 36,
      localY: finiteOr(craft.door && craft.door.y, 0)
    };
    const exitLocalX = finiteOr(settings.localX, finiteOr(craft.door && craft.door.x, -craft.width * 0.5) - 74);
    const exitLocalY = finiteOr(settings.localY, local.localY);
    const world = spacecraftLocalToWorld(craft, exitLocalX, exitLocalY);
    const outward = spacecraftLocalToWorld(craft, exitLocalX - 1, exitLocalY);
    const dir = normalize(outward.x - world.x, outward.y - world.y);
    player.spacecraftInterior = null;
    player.x = world.x;
    player.y = world.y;
    player.vx = dir.x * finiteOr(settings.speed, 190) + finiteOr(craft.vx, 0);
    player.vy = dir.y * finiteOr(settings.speed, 190) + finiteOr(craft.vy, 0);
    cameraRoll = 0;
    maybeNotifyText("Exited " + craft.name + ".");
  }

  function requestPlayerSpacecraftExit(craft, options) {
    if (!craft || !player.spacecraftInterior || player.spacecraftInterior.spacecraftId !== craft.id) {
      return false;
    }
    const settings = options || {};
    player.spacecraftInterior.forceExit = true;
    player.spacecraftInterior.forceExitSpeed = Math.max(156, finiteOr(settings.speed, 210));
    if (!player.spacecraftInterior.forceExitNotified) {
      player.spacecraftInterior.forceExitNotified = true;
      maybeNotifyText(settings.reason || (craft.name + " is leaving."));
    }
    return true;
  }

  function ejectPlayerFromSpacecraft(craft, reason) {
    const local = player.spacecraftInterior || { localX: 0, localY: 0 };
    const world = spacecraftLocalToWorld(craft, local.localX, local.localY);
    const dir = normalize(local.localX || -1, local.localY || 0.2);
    player.spacecraftInterior = null;
    player.x = world.x;
    player.y = world.y;
    player.vx = dir.x * 230 + finiteOr(craft.vx, 0);
    player.vy = dir.y * 230 + finiteOr(craft.vy, 0);
    cameraRoll = 0;
    maybeNotifyText(reason || (craft.name + " ruptured."));
  }

  function updatePlayerSpacecraftEntry() {
    if (player.spacecraftInterior || player.landed || deathState.active) {
      return;
    }

    for (const craft of spacecrafts) {
      updateSpacecraftWorldFields(craft);
      const local = spacecraftWorldToLocal(craft, player.x, player.y);
      const door = craft.door || {};
      const doorX = finiteOr(door.x, -craft.width * 0.5);
      const thresholdX = doorX + finiteOr(door.threshold, 40);
      const floor = spacecraftFloorForX(craft, local.x, local.y);
      if (
        local.x >= thresholdX - 30 &&
        local.x <= thresholdX + 74 &&
        spacecraftDoorContainsLocal(craft, local.x, local.y, 0) &&
        floor
      ) {
        enterSpacecraftInterior(craft, local);
        return;
      }
      resolvePlayerSpacecraftExteriorCollision(craft, local);
    }
  }

  function resolvePlayerSpacecraftExteriorCollision(craft, local) {
    if (spacecraftDoorContainsLocal(craft, local.x, local.y, 0)) {
      return;
    }

    const component = spacecraftComponentAtLocal(craft, local.x, local.y);
    if (!component || component.kind === "turret") {
      return;
    }

    const margin = Math.max(20, player.radius * 0.62);
    const left = component.x - component.w * 0.5 - margin;
    const right = component.x + component.w * 0.5 + margin;
    const top = component.y - component.h * 0.5 - margin;
    const bottom = component.y + component.h * 0.5 + margin;
    const distances = [
      { side: "left", value: Math.abs(local.x - left), x: left, y: local.y },
      { side: "right", value: Math.abs(right - local.x), x: right, y: local.y },
      { side: "top", value: Math.abs(local.y - top), x: local.x, y: top },
      { side: "bottom", value: Math.abs(bottom - local.y), x: local.x, y: bottom }
    ].sort((a, b) => a.value - b.value);
    const pushed = distances[0];
    const world = spacecraftLocalToWorld(craft, pushed.x, pushed.y);
    const normal = normalize(world.x - player.x, world.y - player.y);
    player.x = world.x;
    player.y = world.y;
    const outwardSpeed = Math.max(0, player.vx * normal.x + player.vy * normal.y);
    player.vx = normal.x * Math.max(120, outwardSpeed * 0.4);
    player.vy = normal.y * Math.max(120, outwardSpeed * 0.4);
    sparks.push({
      x: player.x,
      y: player.y,
      radius: 26,
      color: { r: 255, g: 213, b: 122 },
      life: 0.16,
      maxLife: 0.16
    });
  }

  function updateSpacecraftInteriorPlayer(dt) {
    const craft = activePlayerSpacecraft();
    if (!craft) {
      player.spacecraftInterior = null;
      return false;
    }

    updateSpacecraftWorldFields(craft);
    const state = player.spacecraftInterior;
    let localX = finiteOr(state.localX, 0);
    let localY = finiteOr(state.localY, 0);
    let inputX = 0;
    const forcedExit = Boolean(state.forceExit);

    if (forcedExit) {
      inputX = -1;
    } else if (!isVacuumHoldActive()) {
      if (isMovementKeyPressed("left")) inputX -= 1;
      if (isMovementKeyPressed("right")) inputX += 1;
    }

    const weaponSlowFactor = 1 - clamp(player.weaponSlow || 0, 0, weaponSlowMax) * 0.5;
    let floor = spacecraftFloorForX(craft, localX, localY);
    if (!floor) {
      ejectPlayerFromSpacecraft(craft, craft.name + " compartment broke open.");
      return true;
    }

    localY = floor.centerY;
    const walkDirection = inputX < 0 ? -1 : inputX > 0 ? 1 : 0;
    const forcedExitSpeed = Math.max(156, finiteOr(state.forceExitSpeed, 210));
    const walkSpeed = walkDirection ? (forcedExit ? forcedExitSpeed : 156 * weaponSlowFactor) : 0;
    if (walkDirection) {
      const nextX = localX + walkDirection * walkSpeed * dt;
      const nextFloor = spacecraftFloorForX(craft, nextX, localY);
      if (nextFloor) {
        floor = nextFloor;
        localX = clamp(nextX, floor.minX, floor.maxX);
        localY = floor.centerY;
        player.walkCycle += (2.2 + walkSpeed * 0.038) * dt;
      } else {
        localX = clamp(localX, floor.minX, floor.maxX);
        localY = floor.centerY;
      }
    }

    const door = craft.door || {};
    const doorX = finiteOr(door.x, -craft.width * 0.5);
    if (spacecraftDoorContainsLocal(craft, localX, localY, -8) && localX < doorX - 48) {
      leaveSpacecraftInterior(craft, { localX, localY, speed: forcedExit ? forcedExitSpeed : 210 });
      return true;
    }

    if (!spacecraftCanStandAt(craft, localX, localY)) {
      ejectPlayerFromSpacecraft(craft, craft.name + " compartment broke open.");
      return true;
    }

    state.localX = localX;
    state.localY = localY;
    state.walkSpeed = walkSpeed;
    state.forceExit = forcedExit;
    state.forceExitSpeed = forcedExit ? forcedExitSpeed : 0;
    state.onFloor = true;
    const world = spacecraftLocalToWorld(craft, localX, localY);
    player.x = world.x;
    player.y = world.y;
    player.vx = finiteOr(craft.vx, 0) + walkDirection * walkSpeed;
    player.vy = finiteOr(craft.vy, 0);
    cameraRoll += shortestAngleDelta(cameraRoll, 0) * (1 - Math.pow(0.02, dt));
    jumpQueued = false;
    return true;
  }

  function liveSpacecraftComponents(craft) {
    return craft.components.filter((component) => component.health > 0);
  }

  function spacecraftHasLiveKind(craft, kind) {
    return craft.components.some((component) => component.kind === kind && component.health > 0);
  }

  function nearestSpacecraftCombatTarget(x, y, maxRange) {
    const craft = activePlayerSpacecraft();
    if (!craft) {
      return null;
    }

    let best = null;
    let bestDistance = Infinity;
    const range = Math.max(1, finiteOr(maxRange, 1800));
    for (const component of liveSpacecraftComponents(craft)) {
      if (component.kind === "room" && component.id !== "airlock") {
        continue;
      }
      const dist = Math.hypot(component.worldX - x, component.worldY - y);
      const score = dist - (component.kind === "generator" || component.kind === "turret" ? 90 : 0);
      if (dist <= range + component.hitRadius && score < bestDistance) {
        best = component;
        bestDistance = score;
      }
    }

    if (!best) {
      best = liveSpacecraftComponents(craft)[0] || null;
    }

    if (!best) {
      return null;
    }

    return spacecraftComponentCombatTarget(craft, best);
  }

  function spacecraftComponentCombatTarget(craft, component) {
    return {
      local: false,
      remote: null,
      spacecraft: craft,
      spacecraftComponent: component,
      publicName: craft.name,
      player: {
        id: "spacecraft:" + craft.id + ":" + component.id,
        name: component.label,
        x: component.worldX,
        y: component.worldY,
        vx: finiteOr(craft.vx, 0),
        vy: finiteOr(craft.vy, 0),
        radius: component.hitRadius,
        health: component.health,
        maxHealth: component.maxHealth
      }
    };
  }

  function nearestSpacecraftComponentOnSegment(ax, ay, bx, by, radius, predicate) {
    let best = null;
    let bestDistance = Infinity;
    for (const craft of spacecrafts) {
      for (const component of liveSpacecraftComponents(craft)) {
        if (predicate && !predicate(craft, component)) {
          continue;
        }
        const hitRadius = component.hitRadius + Math.max(0, finiteOr(radius, 0));
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

  function damageSpacecraftComponent(craft, component, damage, color, message) {
    if (!craft || !component || component.health <= 0) {
      return false;
    }

    component.health = clamp(finiteOr(component.health, component.maxHealth) - Math.max(0, finiteOr(damage, 0)), 0, component.maxHealth);
    component.flash = 0.34;
    sparks.push({
      x: component.worldX,
      y: component.worldY,
      radius: component.hitRadius * 1.4,
      color: color || { r: 255, g: 184, b: 88 },
      life: 0.28,
      maxLife: 0.28
    });
    playSound("mobHit", { throttleKey: "spacecraftDamage" });

    if (component.health <= 0) {
      component.disabledTimer = Math.max(component.disabledTimer || 0, 1.2);
      maybeNotifyText(message || (craft.name + " " + component.label.toLowerCase() + " destroyed."));
      if (player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
        const local = player.spacecraftInterior;
        if (!spacecraftCanStandAt(craft, local.localX, local.localY)) {
          ejectPlayerFromSpacecraft(craft, craft.name + " compartment broke open.");
        }
      }
    }

    return component.health <= 0;
  }

  function damageSpacecraftComponentFromProjectile(projectile, tailX, tailY, hitRadius) {
    const target = nearestSpacecraftComponentOnSegment(
      tailX,
      tailY,
      projectile.x,
      projectile.y,
      hitRadius,
      (_craft, component) => component.kind !== "room" || component.id === "airlock" || projectile.rocket || projectile.lightning
    );
    if (!target) {
      return false;
    }

    const damage = projectile.lightning
      ? difficultyMobDamage(teslaLightningDamage)
      : difficultyMobDamage(projectile.rocket ? structureRocketDamage : finiteOr(projectile.damage, rivalProjectileDamage) * 0.82);
    damageSpacecraftComponent(target.craft, target.component, damage, projectile.color);
    return true;
  }

  function findSpacecraftDefenseTarget(craft, originX, originY, range) {
    let best = null;
    let bestDistance = Infinity;
    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0) {
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

