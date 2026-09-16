  function chooseRandomEventDefinition(state, randomEvents) {
    const candidates = RANDOM_EVENT_DEFINITIONS.map((definition) => {
      if (definition.canStart && definition.canStart(state, randomEvents) === false) {
        return null;
      }
      const weight = Math.max(0, finiteOr(
        typeof definition.weight === "function" ? definition.weight(state, randomEvents) : definition.weight,
        1
      ));
      return weight > 0 ? { definition, weight } : null;
    }).filter(Boolean);
    const totalWeight = candidates.reduce((total, candidate) => total + candidate.weight, 0);
    if (totalWeight <= 0) {
      return null;
    }
    const seedHolder = { seed: Math.max(1, Math.floor(finiteOr(state && state.seed, 1))) >>> 0 };
    let roll = randomRange(seedHolder, 0, totalWeight);
    state.seed = seedHolder.seed >>> 0;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) {
        return candidate.definition;
      }
    }
    return candidates[candidates.length - 1].definition;
  }

  function finishRandomEvent(state, reason) {
    const randomEvents = state && state.world ? state.world.randomEvents : null;
    const active = randomEvents && randomEvents.active;
    if (!active) {
      return;
    }
    const definition = RANDOM_EVENT_DEFINITIONS.find((candidate) => candidate.id === active.id);
    if (definition && typeof definition.finish === "function") {
      definition.finish(state, active, reason || "complete");
    }
    randomEvents.active = null;
    randomEvents.timer = Math.max(RANDOM_EVENT_MIN_COOLDOWN, finiteOr(randomEvents.cooldown, RANDOM_EVENT_DEFAULT_COOLDOWN));
  }

  function startRandomEvent(state, randomEvents, definition) {
    if (!state || !randomEvents || !definition) {
      return false;
    }
    const eventState = {
      id: definition.id,
      elapsed: 0,
      duration: Math.max(1, finiteOr(definition.duration, 30))
    };
    randomEvents.active = eventState;
    randomEvents.history = Array.isArray(randomEvents.history) ? randomEvents.history : [];
    randomEvents.history.push(definition.id);
    randomEvents.history = randomEvents.history.slice(-12);
    if (typeof definition.start === "function") {
      definition.start(state, eventState);
    }
    return true;
  }

  function forceRandomEvent(state, eventId) {
    const randomEvents = state && state.world ? state.world.randomEvents : null;
    const id = String(eventId || "");
    const definition = RANDOM_EVENT_DEFINITIONS.find((candidate) => candidate.id === id);
    if (!randomEvents || !definition) {
      return false;
    }
    if (id === METEOR_SHOWER_EVENT_ID && !meteorShowerCanStartAfterParticleStorms(state, randomEvents)) {
      return false;
    }
    if (randomEvents.active) {
      finishRandomEvent(state, "command");
    }
    randomEvents.enabled = true;
    return startRandomEvent(state, randomEvents, definition);
  }

  function updateRandomEvents(state, dt) {
    const randomEvents = state && state.world ? state.world.randomEvents : null;
    if (!randomEvents || randomEvents.enabled === false || RANDOM_EVENT_DEFINITIONS.length === 0) {
      if (randomEvents && randomEvents.active) {
        finishRandomEvent(state, "disabled");
      }
      return;
    }

    if (randomEvents.active) {
      randomEvents.active.elapsed = Math.max(0, finiteOr(randomEvents.active.elapsed, 0) + dt);
      const definition = RANDOM_EVENT_DEFINITIONS.find((candidate) => candidate.id === randomEvents.active.id);
      if (definition && typeof definition.update === "function") {
        definition.update(state, randomEvents.active, dt);
      }
      if (!definition || randomEvents.active.elapsed >= Math.max(1, finiteOr(randomEvents.active.duration, 30))) {
        finishRandomEvent(state, "duration");
      }
      return;
    }

    randomEvents.timer = Math.max(0, finiteOr(randomEvents.timer, randomEvents.cooldown) - dt);
    if (randomEvents.timer <= 0) {
      if (!startRandomEvent(state, randomEvents, chooseRandomEventDefinition(state, randomEvents))) {
        randomEvents.timer = Math.max(RANDOM_EVENT_MIN_COOLDOWN, finiteOr(randomEvents.cooldown, RANDOM_EVENT_DEFAULT_COOLDOWN));
      }
    }
  }

  function particleStormWeight(state, randomEvents) {
    const history = Array.isArray(randomEvents && randomEvents.history) ? randomEvents.history : [];
    if (!history.length) {
      return 18;
    }
    return randomEventHistoryCount(randomEvents, PARTICLE_STORM_EVENT_ID) <= 0 ? 6 : 1.35;
  }

  function meteorShowerWeight(state, randomEvents) {
    if (!meteorShowerCanStartAfterParticleStorms(state, randomEvents)) {
      return 0;
    }
    return randomEventHistoryCount(randomEvents, METEOR_SHOWER_EVENT_ID) <= 0 ? 5 : 1.1;
  }

  function meteorShowerCanStartWithUfoBoss(state) {
    const world = state && state.world ? state.world : {};
    return Math.max(0, Math.floor(finiteOr(world.mobDefeatsByKind && world.mobDefeatsByKind.ufo, 0))) >= MOB_BOSS_DEFEATS_TO_UNLOCK;
  }

  function meteorShowerCanStartAfterParticleStorms(state, randomEvents) {
    return randomEventHistoryCount(randomEvents, PARTICLE_STORM_EVENT_ID) >= 3 && meteorShowerCanStartWithUfoBoss(state);
  }

  function chooseParticleStormRegion(state, seedHolder) {
    const anchors = activeRandomEventPlayers(state);
    const source = anchors.length ? anchors[Math.floor(randomRange(seedHolder, 0, anchors.length))] : { x: 0, y: 0, vx: 0, vy: 0 };
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const travelAngle = speed > 60 ? Math.atan2(source.vy, source.vx) : randomRange(seedHolder, 0, Math.PI * 2);
    const sideAngle = travelAngle + randomRange(seedHolder, -0.85, 0.85);
    const distance = randomRange(seedHolder, 920, 1520);
    return {
      x: finiteOr(source.x, 0) + Math.cos(sideAngle) * distance,
      y: finiteOr(source.y, 0) + Math.sin(sideAngle) * distance,
      radius: randomRange(seedHolder, PARTICLE_STORM_SETTINGS.radiusMin, PARTICLE_STORM_SETTINGS.radiusMax),
      windAngle: sideAngle + Math.PI + randomRange(seedHolder, -0.55, 0.55),
      phase: randomRange(seedHolder, 0, Math.PI * 2),
      maxParticles: PARTICLE_STORM_SETTINGS.maxActiveParticles
    };
  }

  function rogueTraderWeight(state, randomEvents) {
    const elapsed = Math.max(0, finiteOr(state && state.tick, 0) * TICK_DT);
    if (elapsed < ROGUE_TRADER_EVENT_SETTINGS.earliestSpawnTime) {
      return 0;
    }
    return randomEventHistoryCount(randomEvents, ROGUE_TRADER_EVENT_ID) <= 0 ? 0.65 : 0.14;
  }

  function chooseRogueTraderRegion(state, seedHolder) {
    const anchors = activeRandomEventPlayers(state);
    const source = anchors.length ? anchors[Math.floor(randomRange(seedHolder, 0, anchors.length))] : null;
    const sourceX = finiteOr(source && source.x, 0);
    const sourceY = finiteOr(source && source.y, 0);
    const targetDistance = randomRange(seedHolder, ROGUE_TRADER_EVENT_SETTINGS.targetDistanceMin, ROGUE_TRADER_EVENT_SETTINGS.targetDistanceMax);
    const verticalOffset = randomRange(seedHolder, -260, 140);
    const side = randomRange(seedHolder, 0, 1) < 0.84 ? 1 : -1;
    const targetX = sourceX + side * targetDistance;
    const targetY = sourceY + verticalOffset;
    return {
      title: "Rogue Trader",
      targetX,
      targetY,
      startX: targetX + side * ROGUE_TRADER_EVENT_SETTINGS.spawnDistance,
      startY: targetY + randomRange(seedHolder, -120, 120),
      exitX: targetX - side * ROGUE_TRADER_EVENT_SETTINGS.spawnDistance * 1.25,
      exitY: targetY + randomRange(seedHolder, -180, 160),
      radius: ROGUE_TRADER_EVENT_SETTINGS.radius
    };
  }

  function startRogueTraderEvent(state, active) {
    if (!state || !active) {
      return;
    }
    const world = state.world || {};
    const seedHolder = {
      seed: Math.max(
        1,
        Math.floor(
          finiteOr(state.seed, 1) +
          finiteOr(state.tick, 0) * 1103515245 +
          finiteOr(world.nextSpacecraftId, 1) * 2654435761 +
          finiteOr(world.nextParticleId, 1) * 1013904223
        )
      ) >>> 0
    };
    Object.assign(active, chooseRogueTraderRegion(state, seedHolder));
    state.seed = seedHolder.seed >>> 0;
    updateRogueTraderSpacecraft(state, active, 0);
    if (Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.started", id: ROGUE_TRADER_EVENT_ID, title: "Rogue Trader", tick: state.tick });
    }
  }

  function finishRogueTraderEvent(state) {
    const world = state && state.world;
    if (world && Array.isArray(world.spacecrafts)) {
      for (const craft of world.spacecrafts) {
        if (craft && craft.eventId === ROGUE_TRADER_EVENT_ID) {
          for (const player of Object.values(state.players || {})) {
            if (player && player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
              leavePlayerSpacecraftInterior(player, craft, { speed: 260 });
            }
          }
        }
      }
      world.spacecrafts = world.spacecrafts.filter((craft) => !(craft && craft.eventId === ROGUE_TRADER_EVENT_ID));
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "randomEvent.finished", id: ROGUE_TRADER_EVENT_ID, title: "Rogue Trader", tick: state.tick });
    }
  }

  function rogueTraderEventPosition(active) {
    const elapsed = Math.max(0, finiteOr(active && active.elapsed, 0));
    const duration = Math.max(1, finiteOr(active && active.duration, ROGUE_TRADER_EVENT_SETTINGS.duration));
    const approachDuration = Math.max(0.5, ROGUE_TRADER_EVENT_SETTINGS.approachDuration);
    const leaveDuration = Math.max(0.5, ROGUE_TRADER_EVENT_SETTINGS.leaveDuration);
    const serviceDuration = Math.max(0.5, duration - approachDuration - leaveDuration);
    const startX = finiteOr(active && active.startX, 0);
    const startY = finiteOr(active && active.startY, 0);
    const targetX = finiteOr(active && active.targetX, startX);
    const targetY = finiteOr(active && active.targetY, startY);
    const exitX = finiteOr(active && active.exitX, targetX);
    const exitY = finiteOr(active && active.exitY, targetY);

    if (elapsed < approachDuration) {
      const t = smoothEventStep(elapsed / approachDuration);
      return {
        x: startX + (targetX - startX) * t,
        y: startY + (targetY - startY) * t,
        departing: false
      };
    }
    if (elapsed < approachDuration + serviceDuration) {
      const t = smoothEventStep((elapsed - approachDuration) / serviceDuration);
      return {
        x: targetX + (exitX - targetX) * t * 0.08,
        y: targetY + (exitY - targetY) * t * 0.08,
        departing: false
      };
    }

    const t = smoothEventStep((elapsed - approachDuration - serviceDuration) / leaveDuration);
    return {
      x: targetX + (exitX - targetX) * t,
      y: targetY + (exitY - targetY) * t,
      departing: true
    };
  }

  function smoothEventStep(value) {
    const t = clamp(finiteOr(value, 0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function findRogueTraderSpacecraft(world, active) {
    const craftId = Math.max(0, Math.floor(finiteOr(active && active.spacecraftId, 0)));
    const spacecrafts = world && Array.isArray(world.spacecrafts) ? world.spacecrafts : [];
    if (craftId > 0) {
      const byId = spacecrafts.find((craft) => craft && Math.floor(finiteOr(craft.id, 0)) === craftId);
      if (byId) {
        return byId;
      }
    }
    return spacecrafts.find((craft) => craft && craft.eventId === ROGUE_TRADER_EVENT_ID) || null;
  }

  function createRogueTraderSpacecraft(world, active, position) {
    const id = Math.max(1, Math.floor(finiteOr(world.nextSpacecraftId, 1)));
    world.nextSpacecraftId = id + 1;
    const craft = normalizeSpacecraftState({
      id,
      blueprintId: ROGUE_TRADER_SPACECRAFT.blueprintId,
      name: ROGUE_TRADER_SPACECRAFT.name,
      x: position.x,
      y: position.y,
      eventId: ROGUE_TRADER_EVENT_ID,
      width: ROGUE_TRADER_SPACECRAFT.width,
      height: ROGUE_TRADER_SPACECRAFT.height
    }, id);
    active.spacecraftId = craft.id;
    world.spacecrafts.push(craft);
    return craft;
  }

  function updateRogueTraderSpacecraft(state, active, dt) {
    const world = state && state.world;
    if (!world || !active) {
      return null;
    }
    world.spacecrafts = Array.isArray(world.spacecrafts) ? world.spacecrafts : [];
    const position = rogueTraderEventPosition(active);
    let craft = findRogueTraderSpacecraft(world, active);
    if (!craft) {
      craft = createRogueTraderSpacecraft(world, active, position);
    }
    const seconds = Math.max(0, finiteOr(dt, 0));
    const previousX = finiteOr(craft.x, position.x);
    const previousY = finiteOr(craft.y, position.y);
    craft.x = position.x;
    craft.y = position.y;
    craft.vx = seconds > 0 ? (craft.x - previousX) / seconds : finiteOr(craft.vx, 0);
    craft.vy = seconds > 0 ? (craft.y - previousY) / seconds : finiteOr(craft.vy, 0);
    craft.eventId = ROGUE_TRADER_EVENT_ID;
    craft.blueprintId = ROGUE_TRADER_SPACECRAFT.blueprintId;
    craft.name = ROGUE_TRADER_SPACECRAFT.name;
    active.spacecraftId = craft.id;
    if (position.departing) {
      forcePlayersOutOfSpacecraft(state, craft, { speed: 260 });
    }
    return craft;
  }

  function spacecraftLocalToWorld(craft, localX, localY) {
    const angle = finiteOr(craft && craft.rotation, 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: finiteOr(craft && craft.x, 0) + localX * cos - localY * sin,
      y: finiteOr(craft && craft.y, 0) + localX * sin + localY * cos
    };
  }

  function spacecraftWorldToLocal(craft, worldX, worldY) {
    const angle = -finiteOr(craft && craft.rotation, 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = finiteOr(worldX, 0) - finiteOr(craft && craft.x, 0);
    const dy = finiteOr(worldY, 0) - finiteOr(craft && craft.y, 0);
    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos
    };
  }

  function spacecraftDoor(craft) {
    return craft && craft.door && typeof craft.door === "object"
      ? { ...ROGUE_TRADER_SPACECRAFT_DOOR, ...craft.door }
      : { ...ROGUE_TRADER_SPACECRAFT_DOOR };
  }

  function spacecraftRooms(craft) {
    return craft && Array.isArray(craft.components) && craft.components.some((component) => component && component.kind === "room")
      ? craft.components.filter((component) => component && component.kind === "room" && finiteOr(component.health, 1) > 0)
      : ROGUE_TRADER_SPACECRAFT_ROOMS;
  }

  function findSpacecraftByIdInWorld(world, id) {
    const numericId = Math.max(1, Math.floor(finiteOr(id, 0)));
    const spacecrafts = world && Array.isArray(world.spacecrafts) ? world.spacecrafts : [];
    return spacecrafts.find((craft) => craft && Math.floor(finiteOr(craft.id, 0)) === numericId) || null;
  }

  function spacecraftDoorContainsLocal(craft, localX, localY, padding) {
    const door = spacecraftDoor(craft);
    const pad = Math.max(0, finiteOr(padding, 0));
    const halfHeight = finiteOr(door.height, 120) * 0.5 + pad;
    const doorX = finiteOr(door.x, -finiteOr(craft && craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
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
    for (const room of spacecraftRooms(craft)) {
      const inset = Math.max(10, PLAYER_RADIUS * 0.24);
      const minX = finiteOr(room.x, 0) - finiteOr(room.w, 40) * 0.5 + inset;
      const maxX = finiteOr(room.x, 0) + finiteOr(room.w, 40) * 0.5 - inset;
      if (localX < minX || localX > maxX) {
        continue;
      }
      const floorY = finiteOr(room.y, 0) + finiteOr(room.h, 40) * 0.5 - Math.max(8, finiteOr(room.floorInset, 24));
      const centerY = floorY - PLAYER_FOOT_OFFSET;
      const delta = Math.abs(centerY - finiteOr(preferredY, centerY));
      if (delta < bestDelta) {
        best = { room, floorY, centerY, minX, maxX };
        bestDelta = delta;
      }
    }
    if (!best) {
      const airlock = spacecraftRooms(craft).find((room) => room.id === "airlock");
      const door = spacecraftDoor(craft);
      if (airlock) {
        const doorX = finiteOr(door.x, -finiteOr(craft && craft.width, ROGUE_TRADER_SPACECRAFT.width) * 0.5);
        const minX = doorX - 82;
        const maxX = finiteOr(airlock.x, 0) + finiteOr(airlock.w, 40) * 0.5 - Math.max(10, PLAYER_RADIUS * 0.24);
        const floorY = finiteOr(airlock.y, 0) + finiteOr(airlock.h, 40) * 0.5 - Math.max(8, finiteOr(airlock.floorInset, 24));
        const centerY = floorY - PLAYER_FOOT_OFFSET;
        if (
          localX >= minX &&
          localX <= maxX &&
          Math.abs(finiteOr(preferredY, centerY) - finiteOr(door.y, centerY)) <= finiteOr(door.height, 180) * 0.58
        ) {
          return { room: airlock, floorY, centerY, minX, maxX };
        }
      }
    }
    return best;
  }

  function enterPlayerSpacecraftInterior(player, craft, local) {
    const door = spacecraftDoor(craft);
    const entryX = finiteOr(local && local.x, finiteOr(door.x, -ROGUE_TRADER_SPACECRAFT.width * 0.5) + finiteOr(door.depth, 148) * 0.5);
    const floor = spacecraftFloorForX(craft, entryX, finiteOr(local && local.y, door.y));
    player.landed = null;
    player.spacecraftInterior = {
      spacecraftId: craft.id,
      localX: entryX,
      localY: floor ? floor.centerY : finiteOr(door.y, 0),
      walkSpeed: 0,
      forceExit: false,
      forceExitSpeed: 0,
      onFloor: true
    };
    player.vx = 0;
    player.vy = 0;
    player.cameraRoll = 0;
    return true;
  }

  function leavePlayerSpacecraftInterior(player, craft, options) {
    const settings = options || {};
    const local = player.spacecraftInterior || { localX: 0, localY: 0 };
    const door = spacecraftDoor(craft);
    const exitLocalX = finiteOr(settings.localX, finiteOr(door.x, -ROGUE_TRADER_SPACECRAFT.width * 0.5) - 74);
    const exitLocalY = finiteOr(settings.localY, local.localY);
    const world = spacecraftLocalToWorld(craft, exitLocalX, exitLocalY);
    const outward = spacecraftLocalToWorld(craft, exitLocalX - 1, exitLocalY);
    const dir = normalize(outward.x - world.x, outward.y - world.y);
    player.spacecraftInterior = null;
    player.x = world.x;
    player.y = world.y;
    player.vx = dir.x * finiteOr(settings.speed, 190) + finiteOr(craft.vx, 0);
    player.vy = dir.y * finiteOr(settings.speed, 190) + finiteOr(craft.vy, 0);
    player.cameraRoll = 0;
    return true;
  }

  function requestPlayerSpacecraftExit(player, craft, options) {
    if (!player || !craft || !player.spacecraftInterior || player.spacecraftInterior.spacecraftId !== craft.id) {
      return false;
    }
    const settings = options || {};
    player.spacecraftInterior.forceExit = true;
    player.spacecraftInterior.forceExitSpeed = Math.max(156, finiteOr(settings.speed, 210));
    return true;
  }

  function forcePlayersOutOfSpacecraft(state, craft, options) {
    if (!state || !state.players || !craft) {
      return 0;
    }
    let forced = 0;
    for (const player of Object.values(state.players)) {
      if (requestPlayerSpacecraftExit(player, craft, options)) {
        forced += 1;
      }
    }
    return forced;
  }

