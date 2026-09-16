  function handlePartyPhysicsEndRequest(message) {
    if (!isPartyHost()) {
      return;
    }
    const owner = partyPhysicsRequestOwner(message);
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const key = partyEntityKey(type, id);
    const entity = findPartyEntity(type, id);
    const claim = key ? partyPhysicsSession(type, id, performance.now()) : null;
    if ((!claim || claim.playerId !== owner) && message && message.reason === "collected" && type === "healthPickup") {
      const validation = validatePartyPhysicsRequest(message, { allowExistingOwner: true });
      if (!validation.ok) {
        sendPartyPhysicsHostReject(message, validation.reason, validation.entity);
        return;
      }
      removePartyEntity(type, id);
      multiplayer.partyPhysicsSessions.delete(key);
      sendPartyPhysicsHostAuthority("remove", validation, entity);
      return;
    }
    if (!owner || !key || !claim || claim.playerId !== owner) {
      sendPartyPhysicsHostReject(message, "end-not-owned", entity);
      return;
    }
    const incoming = normalizePartyEntityState(type, message && message.state);
    if (incoming && entity) {
      applyPartyEntityMotionState(entity, incoming, { positionBlend: 0.58, velocityBlend: 0.68 });
    }
    multiplayer.partyPhysicsSessions.delete(key);
    sendPartyPhysicsHostAuthority("end", { type, id, owner, seq: partyPhysicsRequestSeq(message) }, entity);
  }

  function applyPartyPhysicsAuthority(message) {
    if (!isPartySessionActive()) {
      return;
    }
    if (!joinedPlayerIsolationAllows("partyPhysicsAuthority")) {
      return;
    }
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const key = partyEntityKey(type, id);
    const owner = String(message && message.ownerPlayerId || "");
    const action = String(message && message.action || "update");
    if (!type || !id || !key || !owner) {
      return;
    }
    const now = performance.now();
    const entity = findPartyEntity(type, id);
    const incoming = normalizePartyEntityState(type, message && message.state);

    if (action === "end" || action === "release" || action === "remove") {
      multiplayer.partyPhysicsSessions.delete(key);
      if (owner === player.id) {
        multiplayer.localPartyPhysicsSessions.delete(key);
      }
      if (action === "remove") {
        if (type === "healthPickup") {
          multiplayer.claimedHealthPickupIds.add(String(id));
        }
        removePartyEntity(type, id);
        return;
      }
      if (entity && incoming) {
        applyPartyEntityMotionState(entity, incoming, { positionBlend: owner === player.id ? 0.28 : 0.58, velocityBlend: 0.64 });
        markEntitySmoothingTarget(entity, incoming, now);
      }
      return;
    }

    multiplayer.partyPhysicsSessions.set(key, {
      type,
      id,
      key,
      playerId: owner,
      seq: partyPhysicsRequestSeq(message),
      expiresAt: now + partyPhysicsSessionActiveHoldMs,
      accepted: true,
      receivedAt: now
    });

    if (owner === player.id) {
      const localClaim = multiplayer.localPartyPhysicsSessions.get(key);
      if (localClaim) {
        localClaim.accepted = true;
        localClaim.expiresAt = Math.max(finiteOr(localClaim.expiresAt, 0), now + partyPhysicsSessionLocalHoldMs);
      }
      return;
    }

    if (entity && incoming) {
      applyPartyEntityMotionState(entity, incoming, { positionBlend: 0.72, velocityBlend: 0.78 });
      markEntitySmoothingTarget(entity, incoming, now);
    }
  }
