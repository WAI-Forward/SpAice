function sanitizePartyCommandSource(source) {
  const data = source && typeof source === "object" ? source : {};
  const sourceNumber = (value, fallback, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  };
  return {
    x: sourceNumber(data.x, 0, -1000000, 1000000),
    y: sourceNumber(data.y, 0, -1000000, 1000000),
    radius: sourceNumber(data.radius, 34, 1, 120),
    directionX: sourceNumber(data.directionX, 1, -1, 1),
    directionY: sourceNumber(data.directionY, 0, -1, 1)
  };
}

function sanitizePartyCommand(message) {
  const command = sanitizeText(message.command, 32);
  if (command === "killAll") {
    return {
      command
    };
  }
  if (command === "tech") {
    const tech = sanitizeText(message.tech, 32).toLowerCase();
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 1000000)));
    return {
      command,
      tech: tech === "all" || techKeys.includes(tech) ? tech : "",
      amount
    };
  }
  if (command === "spawnBody") {
    const body = sanitizeText(message.body, 32).toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    const allowed = mpV2Sim.constants.BODY_TIERS.some((tier) => tier.name === body);
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 100)));
    return {
      command,
      body: allowed ? body : "",
      amount,
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnMob") {
    const mob = sanitizeText(message.mob, 32).toLowerCase().replace(/[-_\s]+/g, "");
    const allowed = mpV2Sim.constants.MOB_TIER_ORDER.includes(mob);
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 100)));
    return {
      command,
      mob: allowed ? mob : "",
      amount,
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnBoss") {
    const mob = sanitizeText(message.mob, 32).toLowerCase().replace(/[-_\s]+/g, "");
    const allowed = mpV2Sim.constants.MOB_TIER_ORDER.includes(mob);
    const amount = Math.max(1, Math.floor(clampNumber(message.amount, 1, 20)));
    return {
      command,
      mob: allowed ? mob : "",
      amount,
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnEvent") {
    const event = sanitizeText(message.event, 48).toLowerCase().replace(/[_\s]+/g, "-");
    return {
      command,
      event: event === "particle-storm" || event === "meteor-shower" || event === "rogue-trader" ? event : "",
      source: sanitizePartyCommandSource(message.source)
    };
  }
  if (command === "spawnNpc") {
    const npc = sanitizeText(message.npc, 32).toLowerCase().replace(/[-_\s]+/g, "");
    return {
      command,
      npc: npc === "trader" || npc === "roguetrader" ? "trader" : "",
      event: npc === "trader" || npc === "roguetrader" ? "rogue-trader" : "",
      source: sanitizePartyCommandSource(message.source)
    };
  }
  return { command: "" };
}

function handlePartyCommand(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }

  const payload = sanitizePartyCommand(message);
  if (!payload.command) {
    return;
  }

  if (isPartyV2Session(session)) {
    const room = partyV2Rooms.get(session.id);
    if (!room || !room.state) {
      return;
    }
    let changed = false;
    if (payload.command === "tech" && payload.tech) {
      changed = mpV2Sim.addTechToPlayer(room.state, client.playerId, payload.tech, payload.amount);
    } else if (payload.command === "spawnBody" && payload.body) {
      for (let i = 0; i < payload.amount; i += 1) {
        changed = Boolean(mpV2Sim.spawnBody(room.state, payload.body, payload.source)) || changed;
      }
    } else if (payload.command === "spawnMob" && payload.mob) {
      changed = mpV2Sim.spawnMob(room.state, payload.mob, payload.amount, payload.source) > 0;
    } else if (payload.command === "spawnBoss" && payload.mob) {
      changed = mpV2Sim.spawnBoss(room.state, payload.mob, payload.amount, payload.source) > 0;
    } else if (payload.command === "killAll") {
      changed = mpV2Sim.killAllMobs(room.state) > 0;
    } else if (payload.command === "spawnEvent" && payload.event) {
      changed = mpV2Sim.forceRandomEvent(room.state, payload.event);
    } else if (payload.command === "spawnNpc" && payload.event) {
      changed = mpV2Sim.forceRandomEvent(room.state, payload.event);
    }
    if (changed) {
      room.lastTouchedAt = Date.now();
      session.worldSnapshot = buildPartyV2StartSnapshot(room);
      sendPartyV2Snapshot(session, room);
    }
    return;
  }

  const canRelayHostCommand =
    (payload.command === "spawnBody" && payload.body) ||
    (payload.command === "spawnMob" && payload.mob) ||
    (payload.command === "spawnBoss" && payload.mob) ||
    (payload.command === "spawnEvent" && payload.event) ||
    (payload.command === "spawnNpc" && payload.npc) ||
    payload.command === "killAll";

  if (!canRelayHostCommand || session.hostPlayerId === client.playerId) {
    return;
  }

  relayToPlayer(session.hostPlayerId, {
    type: "party.command",
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    command: payload.command,
    body: payload.body,
    mob: payload.mob,
    event: payload.event,
    npc: payload.npc,
    amount: payload.amount,
    source: payload.source
  });
}

function sanitizePartyEntityType(value) {
  const clean = sanitizeText(value, 32);
  return [
    "particle",
    "techPickup",
    "healthPickup",
    "rivalProjectile",
    "alienoid",
    "ufo",
    "rambot",
    "engineer",
    "tesla",
    "rocket",
    "fighter"
  ].includes(clean) ? clean : "";
}

function sanitizePartyEntityState(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  const state = {
    id: Math.max(1, Math.floor(Number(source.id) || 0)),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2200, 2200),
    vy: clampNumber(source.vy, -2200, 2200),
    radius: clampNumber(source.radius, 1, 10000)
  };
  const optionalNumberKeys = [
    "mass",
    "energy",
    "maxEnergy",
    "textureSeed",
    "wobble",
    "pulse",
    "heal",
    "life",
    "maxLife",
    "rotation",
    "angularVelocity",
    "health",
    "maxHealth",
    "flash",
    "hitCooldown",
    "length",
    "damage",
    "toolDisable"
  ];
  for (const key of optionalNumberKeys) {
    if (Number.isFinite(Number(source[key]))) {
      state[key] = clampNumber(source[key], -1000000, 1000000);
    }
  }
  if (source.color && typeof source.color === "object") {
    state.color = normalizeColor(source.color);
  }
  for (const key of ["key", "kind", "cause"]) {
    if (typeof source[key] === "string") {
      state[key] = sanitizeText(source[key], 80);
    }
  }
  if (Object.prototype.hasOwnProperty.call(source, "lightning")) {
    state.lightning = Boolean(source.lightning);
  }
  if (Object.prototype.hasOwnProperty.call(source, "rocket")) {
    state.rocket = Boolean(source.rocket);
  }
  return state.id ? state : null;
}

function sanitizePartyEntityActor(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  return {
    id: sanitizeText(source.id, 80),
    name: sanitizeText(source.name, 32),
    x: clampNumber(source.x, -1000000, 1000000),
    y: clampNumber(source.y, -1000000, 1000000),
    vx: clampNumber(source.vx, -2200, 2200),
    vy: clampNumber(source.vy, -2200, 2200),
    radius: clampNumber(source.radius, 1, 120),
    health: clampNumber(source.health, 0, 100),
    maxHealth: clampNumber(source.maxHealth, 1, 100),
    energy: clampNumber(source.energy, 0, 260),
    maxEnergy: clampNumber(source.maxEnergy, 1, 260),
    equippedTool: sanitizeText(source.equippedTool, 40),
    toolMode: sanitizeText(source.toolMode, 16),
    aimAngle: clampNumber(source.aimAngle, -Math.PI * 16, Math.PI * 16),
    landed: source.landed && typeof source.landed === "object" ? normalizeLanding(source.landed) : null
  };
}

function sanitizePartyPhysicsPayload(message) {
  const type = sanitizePartyEntityType(message.entityType);
  const entityId = Math.max(1, Math.floor(Number(message.entityId) || 0));
  return {
    entityType: type,
    entityId,
    ownerPlayerId: sanitizeText(message.ownerPlayerId, 80),
    targetPlayerId: sanitizeText(message.targetPlayerId, 80),
    seq: Math.max(0, Math.floor(Number(message.seq) || 0)),
    action: sanitizeText(message.action, 24),
    reason: sanitizeText(message.reason, 80),
    mode: sanitizeText(message.mode, 16),
    active: message.active !== false,
    state: sanitizePartyEntityState(message.state),
    actor: sanitizePartyEntityActor(message.actor)
  };
}

function handlePartyPhysicsSession(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !session.players.includes(client.playerId)) {
    return;
  }
  if (isPartyV2Session(session)) {
    return;
  }

  const payload = sanitizePartyPhysicsPayload(message);
  if (!payload.entityType || !payload.entityId) {
    return;
  }

  if (message.type === "party.physics.authority" || message.type === "party.physics.reject") {
    if (session.hostPlayerId !== client.playerId) {
      return;
    }
    relayToParty(session, {
      type: message.type,
      fromPlayerId: client.playerId,
      publicName: client.profile ? client.profile.publicName : client.playerId,
      ...payload
    }, client.playerId);
    return;
  }

  const hostId = session.hostPlayerId;
  if (!hostId || hostId === client.playerId) {
    return;
  }
  relayToPlayer(hostId, {
    type: message.type,
    fromPlayerId: client.playerId,
    publicName: client.profile ? client.profile.publicName : client.playerId,
    ...payload
  });
}

