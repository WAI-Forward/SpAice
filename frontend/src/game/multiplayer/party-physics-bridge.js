  function applyPartyPhysicsReject(message) {
    if (!joinedPlayerIsolationAllows("partyPhysicsRejects")) {
      return;
    }
    const targetPlayerId = String(message && message.targetPlayerId || "");
    if (targetPlayerId && targetPlayerId !== player.id) {
      return;
    }
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const key = partyEntityKey(type, id);
    if (!key) {
      return;
    }
    multiplayer.localPartyPhysicsSessions.delete(key);
    const claim = multiplayer.partyPhysicsSessions.get(key);
    if (claim && claim.playerId === player.id) {
      multiplayer.partyPhysicsSessions.delete(key);
    }
    const entity = findPartyEntity(type, id);
    const incoming = normalizePartyEntityState(type, message && message.state);
    if (entity && incoming) {
      applyPartyEntityMotionState(entity, incoming, { positionBlend: 0.84, velocityBlend: 0.9 });
      markEntitySmoothingTarget(entity, incoming, performance.now());
    }
  }
