  const remoteDisplaySnapshotInterval = 1 / 30;
  const remoteSharedBodyContactLimit = 96;

  function partyInputSeqFromSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    const gadget = source.gadget && typeof source.gadget === "object" ? source.gadget : null;
    return Math.max(0, Math.floor(finiteOr(gadget && gadget.seq, 0)));
  }

  function isFriendlyPartyPlayer(playerId) {
    if (!playerId || !isPartySessionActive()) {
      return false;
    }
    return partyPlayerIds().has(playerId);
  }

  function canDamageRemotePlayer(remote) {
    if (!remote || !remote.playerId) {
      return false;
    }
    if (multiplayer.anomaly && remote.teamId && multiplayer.anomaly.teamId) {
      return remote.teamId !== multiplayer.anomaly.teamId;
    }
    if (isFriendlyPartyPlayer(remote.playerId)) {
      return false;
    }
    return isDuelingWith(remote.playerId);
  }

  function canDamageRemotePlayerFromPve(remote) {
    return Boolean(remote && remote.playerId);
  }

  function canReceiveDamageFromPlayer(fromPlayerId, fromTeamId) {
    if (!fromPlayerId) {
      return true;
    }
    if (multiplayer.anomaly && fromTeamId && multiplayer.anomaly.teamId) {
      return fromTeamId !== multiplayer.anomaly.teamId;
    }
    if (isFriendlyPartyPlayer(fromPlayerId)) {
      return false;
    }
    return isDuelingWith(fromPlayerId);
  }

  function normalizeEntityEffectSourceKind(effect) {
    const kind = typeof (effect && effect.sourceKind) === "string" ? effect.sourceKind : "";
    if (kind === "player" || kind === "mob" || kind === "environment" || kind === "gadget") {
      return kind;
    }
    if (effect && effect.pvpOnly === true) {
      return "player";
    }
    if (effect && effect.entityType === "player" && (finiteOr(effect.damage, 0) > 0 || finiteOr(effect.toolDisable, 0) > 0)) {
      return "player";
    }
    return "gadget";
  }

  function canReceiveRemotePlayerEffect(message, effect) {
    const damage = Math.max(0, finiteOr(effect && effect.damage, 0));
    const toolDisable = Math.max(0, finiteOr(effect && effect.toolDisable, 0));
    if (damage <= 0 && toolDisable <= 0) {
      return true;
    }

    const sourceKind = normalizeEntityEffectSourceKind(effect);
    if (sourceKind !== "player" && effect.pvpOnly !== true) {
      return true;
    }
    return canReceiveDamageFromPlayer(message.fromPlayerId, message.fromTeamId);
  }

  function remoteEffectCause(effect, fallback) {
    const cause = typeof (effect && effect.cause) === "string" ? effect.cause.trim().slice(0, 60) : "";
    return cause || fallback || "Contact fire";
  }

  function normalizePartyEntityType(type) {
    const value = String(type || "");
    if (value === "body" || value === "rock" || value === "boulder") {
      return "particle";
    }
    if (value === "rival") {
      return "alienoid";
    }
    if (value === "projectile") {
      return "rivalProjectile";
    }
    if (value === "mobBeacon") {
      return "beacon";
    }
    if (
      value === "particle" ||
      value === "techPickup" ||
      value === "healthPickup" ||
      value === "rivalProjectile" ||
      value === "beacon" ||
      value === "alienoid" ||
      value === "ufo" ||
      value === "rambot" ||
      value === "engineer" ||
      value === "tesla" ||
      value === "rocket" ||
      value === "fighter"
    ) {
      return value;
    }
    return "";
  }

  function partyEntityId(id) {
    return Math.max(1, Math.floor(finiteOr(id, 0)));
  }

  function partyEntityKey(type, id) {
    const cleanType = normalizePartyEntityType(type);
    const cleanId = partyEntityId(id);
    return cleanType && cleanId ? cleanType + ":" + cleanId : "";
  }

  function partyEntityCollection(type) {
    switch (normalizePartyEntityType(type)) {
      case "particle":
        return particles;
      case "techPickup":
        return techPickups;
      case "healthPickup":
        return healthPickups;
      case "rivalProjectile":
        return rivalProjectiles;
      case "beacon":
        return mobBeacons;
      case "alienoid":
        return rivals;
      case "ufo":
        return ufos;
      case "rambot":
        return rambots;
      case "engineer":
        return engineers;
      case "tesla":
        return teslas;
      case "rocket":
        return rockets;
      case "fighter":
        return fighters;
      default:
        return null;
    }
  }

  function findPartyEntity(type, id) {
    const collection = partyEntityCollection(type);
    const cleanId = partyEntityId(id);
    if (!collection || !cleanId) {
      return null;
    }
    return collection.find((entity) => entity && partyEntityId(entity.id) === cleanId) || null;
  }

  function removePartyEntity(type, id) {
    const collection = partyEntityCollection(type);
    const cleanId = partyEntityId(id);
    if (!collection || !cleanId) {
      return null;
    }
    const index = collection.findIndex((entity) => entity && partyEntityId(entity.id) === cleanId);
    if (index < 0) {
      return null;
    }
    const entity = collection[index];
    collection.splice(index, 1);
    return entity;
  }

  function serializePartyEntity(type, entity) {
    const cleanType = normalizePartyEntityType(type);
    if (!entity || !cleanType) {
      return null;
    }
    if (cleanType === "particle") {
      return serializeParticle(entity);
    }
    if (cleanType === "techPickup") {
      return serializeTechPickup(entity);
    }
    if (cleanType === "healthPickup") {
      return serializeHealthPickup(entity);
    }
    if (cleanType === "rivalProjectile") {
      return serializeProjectile(entity);
    }
    if (cleanType === "beacon") {
      return serializeMobBeacon(entity);
    }
    if (cleanType === "alienoid") {
      return serializeRival(entity);
    }
    if (cleanType === "ufo") {
      return serializeUfo(entity);
    }
    if (cleanType === "rambot") {
      return serializeRambot(entity);
    }
    if (cleanType === "engineer") {
      return serializeEngineer(entity);
    }
    if (cleanType === "tesla") {
      return serializeTesla(entity);
    }
    if (cleanType === "rocket") {
      return serializeRocket(entity);
    }
    if (cleanType === "fighter") {
      return serializeFighter(entity);
    }
    return null;
  }

  function normalizePartyEntityState(type, state) {
    const cleanType = normalizePartyEntityType(type);
    const source = state && typeof state === "object" ? state : {};
    const id = partyEntityId(source.id);
    if (!cleanType || !id) {
      return null;
    }
    return {
      ...source,
      id,
      x: clamp(finiteOr(source.x, 0), -1000000, 1000000),
      y: clamp(finiteOr(source.y, 0), -1000000, 1000000),
      vx: clamp(finiteOr(source.vx, 0), -2200, 2200),
      vy: clamp(finiteOr(source.vy, 0), -2200, 2200),
      radius: Math.max(1, finiteOr(source.radius, 1))
    };
  }

  function applyPartyEntityMotionState(entity, incoming, options) {
    if (!entity || !incoming) {
      return false;
    }
    const positionBlend = clamp(finiteOr(options && options.positionBlend, 1), 0, 1);
    const velocityBlend = clamp(finiteOr(options && options.velocityBlend, positionBlend), 0, 1);
    entity.x += (finiteOr(incoming.x, entity.x) - entity.x) * positionBlend;
    entity.y += (finiteOr(incoming.y, entity.y) - entity.y) * positionBlend;
    entity.vx += (finiteOr(incoming.vx, entity.vx) - entity.vx) * velocityBlend;
    entity.vy += (finiteOr(incoming.vy, entity.vy) - entity.vy) * velocityBlend;
    if (Number.isFinite(Number(incoming.life)) && Number.isFinite(Number(entity.life)) && options && options.copyLife) {
      entity.life = Math.max(0, finiteOr(incoming.life, entity.life));
    }
    return true;
  }

  function prunePartyPhysicsSessions(now) {
    const time = finiteOr(now, performance.now());
    for (const [key, session] of multiplayer.partyPhysicsSessions) {
      if (
        !session ||
        finiteOr(session.expiresAt, 0) <= time ||
        !findPartyEntity(session.type, session.id)
      ) {
        multiplayer.partyPhysicsSessions.delete(key);
      }
    }
    for (const [key, session] of multiplayer.localPartyPhysicsSessions) {
      if (
        !session ||
        finiteOr(session.expiresAt, 0) <= time ||
        !findPartyEntity(session.type, session.id)
      ) {
        if (session && !session.endSent) {
          sendPartyPhysicsEnd(session, "expired");
        }
        multiplayer.localPartyPhysicsSessions.delete(key);
        const shared = multiplayer.partyPhysicsSessions.get(key);
        if (shared && shared.playerId === player.id) {
          multiplayer.partyPhysicsSessions.delete(key);
        }
      }
    }
  }

  function partyPhysicsSession(type, id, now) {
    prunePartyPhysicsSessions(now);
    const key = partyEntityKey(type, id);
    return key ? multiplayer.partyPhysicsSessions.get(key) || null : null;
  }

  function localPartyPhysicsSession(type, id, now) {
    prunePartyPhysicsSessions(now);
    const key = partyEntityKey(type, id);
    return key ? multiplayer.localPartyPhysicsSessions.get(key) || null : null;
  }

  function hasLocalPartyPhysicsSession(type, id, now) {
    const session = localPartyPhysicsSession(type, id, now);
    return Boolean(session && session.playerId === player.id);
  }

  function partyPhysicsSnapshotActor() {
    return buildPersistentPayload(false).player;
  }

  function sendPartyPhysicsMessage(kind, session, entity, extra) {
    if (!session || !isPartySessionActive()) {
      return false;
    }
    const state = entity ? serializePartyEntity(session.type, entity) : null;
    const payload = {
      type: kind,
      entityType: session.type,
      entityId: session.id,
      seq: session.seq,
      state,
      actor: (extra && extra.actor) || session.actor || partyPhysicsSnapshotActor(),
      mode: (extra && extra.mode) || session.mode || "idle",
      rangeFactor: finiteOr(extra && extra.rangeFactor, finiteOr(session.rangeFactor, currentGadgetRangeFactor())),
      active: extra && Object.prototype.hasOwnProperty.call(extra, "active") ? extra.active !== false : session.active !== false
    };
    if (extra && extra.reason) {
      payload.reason = extra.reason;
    }
    return sendMultiplayer(payload);
  }

  function sendPartyPhysicsEnd(session, reason) {
    if (!session || session.endSent) {
      return false;
    }
    const sent = sendPartyPhysicsMessage("party.physics.end", session, findPartyEntity(session.type, session.id), {
      reason: reason || "ended",
      active: false
    });
    session.endSent = sent || session.endSent;
    return sent;
  }

  function markLocalPartyPhysicsSession(type, entity, now, options) {
    if (!isSharedWorldFollower() || !entity) {
      return null;
    }
    if (!joinedPlayerIsolationAllows("localPhysicsLeases")) {
      return null;
    }
    const cleanType = normalizePartyEntityType(type);
    const cleanId = partyEntityId(entity.id);
    const key = partyEntityKey(cleanType, cleanId);
    if (!key) {
      return null;
    }

    const time = finiteOr(now, performance.now());
    prunePartyPhysicsSessions(time);
    let session = multiplayer.localPartyPhysicsSessions.get(key);
    if (!session) {
      session = {
        type: cleanType,
        id: cleanId,
        key,
        playerId: player.id,
        seq: ++multiplayer.partyPhysicsSeq,
        expiresAt: time + partyPhysicsSessionLocalHoldMs,
        lastSentAt: 0,
        startSent: false,
        accepted: false,
        endSent: false,
        mode: options && options.mode ? options.mode : "idle",
        rangeFactor: finiteOr(options && options.rangeFactor, currentGadgetRangeFactor()),
        active: !(options && options.active === false),
        actor: options && options.actor ? options.actor : null
      };
      multiplayer.localPartyPhysicsSessions.set(key, session);
    }

    session.expiresAt = Math.max(finiteOr(session.expiresAt, 0), time + partyPhysicsSessionLocalHoldMs);
    session.mode = options && options.mode ? options.mode : session.mode;
    session.rangeFactor = finiteOr(options && options.rangeFactor, session.rangeFactor);
    session.active = !(options && options.active === false);
    session.actor = options && options.actor ? options.actor : session.actor;
    session.endSent = false;
    multiplayer.partyPhysicsSessions.set(key, {
      ...session,
      local: true
    });

    const force = options && options.force;
    const elapsed = time - finiteOr(session.lastSentAt, 0);
    const messageType = session.startSent ? "party.physics.state" : "party.physics.start";
    if (force || !session.lastSentAt || elapsed >= partyPhysicsSessionUpdateIntervalMs) {
      const sent = sendPartyPhysicsMessage(messageType, session, entity, {
        actor: session.actor,
        mode: session.mode,
        rangeFactor: session.rangeFactor,
        active: session.active
      });
      if (sent) {
        session.lastSentAt = time;
        session.startSent = true;
      }
    }
    return session;
  }

  function releaseLocalPartyPhysicsSession(type, id, reason) {
    const key = partyEntityKey(type, id);
    if (!key) {
      return false;
    }
    const session = multiplayer.localPartyPhysicsSessions.get(key);
    if (!session) {
      return false;
    }
    sendPartyPhysicsEnd(session, reason || "ended");
    multiplayer.localPartyPhysicsSessions.delete(key);
    const shared = multiplayer.partyPhysicsSessions.get(key);
    if (shared && shared.playerId === player.id) {
      multiplayer.partyPhysicsSessions.delete(key);
    }
    return true;
  }

  function clearLocalPartyPhysicsSession(type, id) {
    const key = partyEntityKey(type, id);
    if (!key) {
      return false;
    }
    multiplayer.localPartyPhysicsSessions.delete(key);
    const shared = multiplayer.partyPhysicsSessions.get(key);
    if (shared && shared.playerId === player.id) {
      multiplayer.partyPhysicsSessions.delete(key);
    }
    return true;
  }

  function releaseMissingLocalPartyPhysicsSessions(activeKeys, reason) {
    const keep = activeKeys || new Set();
    for (const [key, session] of Array.from(multiplayer.localPartyPhysicsSessions.entries())) {
      if (!keep.has(key)) {
        releaseLocalPartyPhysicsSession(session.type, session.id, reason || "inactive");
      }
    }
  }

