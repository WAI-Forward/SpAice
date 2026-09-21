function handlePartyV2Input(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !isPartyV2Session(session) || !session.players.includes(client.playerId)) {
    return;
  }
  const room = partyV2Rooms.get(session.id);
  if (!room) {
    return;
  }

  if (message.roomId && message.roomId !== session.id && message.roomId !== session.lobbyId) {
    return;
  }

  addPartyV2Player(room, session, client.playerId);
  const input = mpV2Sim.sanitizeInput({
    seq: message.seq,
    clientTick: message.clientTick,
    aimAngle: message.aimAngle,
    aimLocalAngle: message.aimLocalAngle,
    equippedTool: message.equippedTool,
    toolMode: message.toolMode,
    familiarCommand: message.familiarCommand,
    buttons: message.buttons
  });
  input.playerId = client.playerId;

  const lastAck = room.lastAckByPlayerId.get(client.playerId) || 0;
  if (input.seq <= lastAck) {
    return;
  }

  const queue = room.inputQueues.get(client.playerId) || [];
  // Inputs normally arrive in sequence order. Preserve the stable ordering of
  // the previous full sort while avoiding it on that common path.
  if (!queue.length || input.seq >= queue[queue.length - 1].seq) {
    queue.push(input);
  } else {
    let insertAt = queue.length;
    while (insertAt > 0 && queue[insertAt - 1].seq > input.seq) {
      insertAt -= 1;
    }
    queue.splice(insertAt, 0, input);
  }
  while (queue.length > 120) {
    queue.shift();
  }
  room.inputQueues.set(client.playerId, queue);
  if (room.perf) {
    room.perf.maxInputQueue = Math.max(Number(room.perf.maxInputQueue) || 0, queue.length);
  }
  room.lastTouchedAt = Date.now();
  if (isSharedWorldSession(session)) {
    markSharedWorldDirty();
  }
}

function sanitizePartyV2Placement(source) {
  const placement = source && typeof source === "object" ? source : {};
  return {
    bodyId: Math.max(0, Math.floor(clampNumber(placement.bodyId, 0, 1000000000))),
    angle: clampNumber(placement.angle, -Math.PI * 64, Math.PI * 64)
  };
}

function handlePartyV2Action(client, message) {
  const session = partySessions.get(client.partySessionId);
  if (!session || !isPartyV2Session(session) || !session.players.includes(client.playerId)) {
    return;
  }

  const room = partyV2Rooms.get(session.id);
  if (!room) {
    return;
  }

  if (message.roomId && message.roomId !== session.id && message.roomId !== session.lobbyId) {
    return;
  }

  addPartyV2Player(room, session, client.playerId);

  const action = sanitizeText(message.action, 32);
  let changed = false;
  if (action === "craftTool") {
    changed = mpV2Sim.craftTool(room.state, client.playerId, sanitizeText(message.recipeId, 64));
  } else if (action === "upgradeTool") {
    changed = mpV2Sim.upgradeTool(
      room.state,
      client.playerId,
      sanitizeText(message.toolId, 64),
      sanitizeText(message.upgradeId, 64)
    );
  } else if (action === "setEquippedTools") {
    const equippedTools = Array.isArray(message.equippedTools)
      ? message.equippedTools.map((toolId) => sanitizeText(toolId, 64)).slice(0, 8)
      : [];
    changed = mpV2Sim.setEquippedTools(
      room.state,
      client.playerId,
      sanitizeText(message.equippedTool, 64),
      equippedTools
    );
  } else if (action === "placeStructure") {
    changed = mpV2Sim.placeStructure(
      room.state,
      client.playerId,
      sanitizeText(message.recipeId, 64),
      sanitizePartyV2Placement(message.placement),
      sanitizePartyV2Placement(message.linkedPlacement)
    );
  } else if (action === "transferContainerTech") {
    changed = mpV2Sim.transferContainerTech(
      room.state,
      client.playerId,
      Math.max(1, Math.floor(Number(message.structureId) || 0)),
      sanitizeText(message.techKey, 32),
      sanitizeText(message.mode, 16),
      Math.max(1, Math.min(999, Math.floor(Number(message.amount) || 1)))
    );
  } else if (action === "transferStructureTech") {
    changed = mpV2Sim.transferStructureTech(
      room.state,
      client.playerId,
      Math.max(1, Math.floor(Number(message.structureId) || 0)),
      sanitizeText(message.techKey, 32),
      sanitizeText(message.mode, 16),
      Math.max(1, Math.min(999, Math.floor(Number(message.amount) || 1)))
    );
  } else if (action === "setTradingPortOffer") {
    changed = mpV2Sim.setTradingPortOffer(
      room.state,
      client.playerId,
      Math.max(1, Math.floor(Number(message.structureId) || 0)),
      message.offer && typeof message.offer === "object" ? message.offer : null
    );
  } else if (action === "removeTradingPortOffer") {
    changed = mpV2Sim.removeTradingPortOffer(
      room.state,
      client.playerId,
      Math.max(1, Math.floor(Number(message.structureId) || 0)),
      sanitizeText(message.offerId, 64)
    );
  } else if (action === "acceptTradingPortOffer") {
    changed = mpV2Sim.acceptTradingPortOffer(
      room.state,
      client.playerId,
      Math.max(1, Math.floor(Number(message.structureId) || 0)),
      sanitizeText(message.offerId, 64)
    );
  } else if (action === "statusEffect") {
    changed = mpV2Sim.applyPlayerStatusEffect(
      room.state.players && room.state.players[client.playerId],
      sanitizeText(message.status, 32).toLowerCase(),
      Math.max(0, Math.min(300, Number(message.duration) || 0))
    );
  }

  if (!changed) {
    return;
  }

  room.lastTouchedAt = Date.now();
  session.worldSnapshot = buildPartyV2StartSnapshot(room);
  if (isSharedWorldSession(session)) {
    markSharedWorldDirty();
  }
  sendPartyV2Snapshot(session, room);
}

function popPartyV2Input(room, playerId) {
  const queue = room.inputQueues.get(playerId) || [];
  let next = null;
  while (queue.length) {
    const candidate = queue.shift();
    const lastAck = room.lastAckByPlayerId.get(playerId) || 0;
    if (candidate.seq > lastAck) {
      next = candidate;
      break;
    }
  }
  if (queue.length) {
    room.inputQueues.set(playerId, queue);
  } else {
    room.inputQueues.delete(playerId);
  }
  if (next) {
    room.lastInputs.set(playerId, next);
    room.lastAckByPlayerId.set(playerId, next.seq);
    return next;
  }
  return room.lastInputs.get(playerId) || { playerId, seq: room.lastAckByPlayerId.get(playerId) || 0 };
}
