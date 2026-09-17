  function applyPartyStart(message) {
    const session = message && message.session && typeof message.session === "object" ? message.session : message;
    const difficulty = difficultyDefinitions[session.difficulty] ? session.difficulty : selectedLobbyDifficulty();
    multiplayer.partySession = {
      id: String(session.sessionId || session.id || ""),
      lobbyId: String(session.lobbyId || ""),
      code: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
      joinCode: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
      maxPlayers: Math.max(1, Math.floor(finiteOr(session.maxPlayers, crazyGamesRoomMaxPlayers))),
      players: Array.isArray(session.players) ? session.players.map(normalizeLobbyPlayer).filter(Boolean) : lobbyPlayers(),
      pvpMode: String(session.pvpMode || "party-off"),
      netcodeVersion: Math.max(1, Math.floor(finiteOr(session.netcodeVersion, 1))),
      worldMode: String(session.worldMode || "party"),
      gameMode: normalizeGameMode(session.gameMode || (session.worldMode === "shared-public" ? "survival" : "horde")),
      sharedWorld: Boolean(session.sharedWorld || session.worldMode === "shared-public"),
      teams: Array.isArray(session.teams) ? session.teams : []
    };
    if (multiplayer.partySession.sharedWorld && session.sharedWorldStats) {
      applySharedWorldStats(session.sharedWorldStats);
    }
    multiplayer.partyJoinCode = multiplayer.partySession.joinCode;
    multiplayer.partyMode = multiplayer.partySession.worldMode === "shared-public" ? "shared" : "party";
    multiplayer.partyHostId = String(session.hostPlayerId || message.hostPlayerId || player.id);
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    multiplayer.partyPlayerSnapshots.clear();
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    multiplayer.partyInputTimer = 0;
    multiplayer.partyInputSeq = 0;
    multiplayer.partyLastInputSnapshot = null;
    multiplayer.lobby = null;
    multiplayer.lobbyInviteLink = "";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    multiplayer.sharedWorldJoinPending = false;
    updateSharedTeamFromSession(multiplayer.partySession, { notifyJoins: false });
    clearCurrentAccountSave();
    updateOnlineUi();

    applyDifficulty(difficulty);
    applyGameMode(multiplayer.partySession.gameMode || (multiplayer.partySession.worldMode === "shared-public" ? "survival" : "horde"));
    resetLocalPlayerState();
    resetLocalWorldState();
    resetLifeStats();
    resetDeathState();

    if (isPartyV2Session(multiplayer.partySession) && startMultiplayerV2(message)) {
      runState.active = true;
      gamePaused = false;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
      setDifficultyScreenOpen(false);
      resetMouseButtons();
      resetFrameClock();
      updateHud();
      updateSettingsJoinCodeUi();
      connectMultiplayer();
      setCrazyGamesLoadingActive(false, "shared-world-start");
      setSharedWorldStatus(multiplayer.partySession.worldMode === "shared-public" ? "Joined shared world." : "", "success");
      maybeNotifyText(multiplayer.partySession.worldMode === "shared-public" ? "Joined public shared world." : "Joined server-authoritative shared world.");
      clearCrazyGamesRoomState("party-start-v2");
      return;
    }

    resetMultiplayerV2State();

    if (message.snapshot && typeof message.snapshot === "object") {
      if (message.snapshot.world) {
        applyWorldSnapshot(message.snapshot.world);
      }
      if (isPartyHost() && message.snapshot.player) {
        applyPlayerSnapshot(message.snapshot.player);
      }
    }

    runState.active = true;
    gamePaused = false;
    persistence.saveTimer = persistenceSaveInterval;
    persistence.pollTimer = persistencePollInterval;
    setDifficultyScreenOpen(false);
    resetMouseButtons();
    resetFrameClock();
    updateHud();
    updateSettingsJoinCodeUi();
    connectMultiplayer();
    maybeNotifyText(isPartyHost() ? "Shared world started." : "Joined shared world.");
    clearCrazyGamesRoomState("party-start");
  }

  function updateSharedTeamFromLocalSnapshot(teamId) {
    if (!isSharedPublicWorldActive()) {
      if (multiplayer.sharedTeamId) {
        multiplayer.sharedTeamId = "";
        updateSettingsJoinCodeUi();
      }
      return;
    }

    const nextTeamId = String(teamId || "");
    if (multiplayer.sharedTeamId !== nextTeamId) {
      multiplayer.sharedTeamId = nextTeamId;
      updateSettingsJoinCodeUi();
      if (multiplayer.panelOpen) {
        renderPlayerSearch();
      }
    }
  }

  function updateSharedTeamFromSession(session, options) {
    const sharedPublic = session && String(session.worldMode || "") === "shared-public";
    const previousTeamId = multiplayer.sharedTeamId || "";
    const previousMembers = multiplayer.sharedTeamMemberIds instanceof Set ? multiplayer.sharedTeamMemberIds : new Set();
    let teamId = "";
    let members = [];

    if (sharedPublic) {
      const localEntry = Array.isArray(session.players)
        ? session.players.find((entry) => entry && entry.playerId === player.id)
        : null;
      teamId = String(localEntry && localEntry.teamId || "");
      if (teamId && Array.isArray(session.teams)) {
        const team = session.teams.find((entry) => entry && String(entry.teamId || "") === teamId);
        members = Array.isArray(team && team.members) ? team.members.map(String).filter(Boolean) : [player.id];
      }
    }

    if (options && options.notifyJoins && sharedPublic && teamId && teamId === previousTeamId) {
      for (const memberId of members) {
        if (!memberId || memberId === player.id || previousMembers.has(memberId)) {
          continue;
        }
        const teammate = Array.isArray(session.players)
          ? session.players.find((entry) => entry && entry.playerId === memberId)
          : null;
        maybeNotifyText((teammate && teammate.publicName || "A player") + " joined your team.");
      }
    }

    multiplayer.sharedTeamId = teamId;
    multiplayer.sharedTeamMemberIds = new Set(members);
    updateSettingsJoinCodeUi();
    if (multiplayer.panelOpen) {
      renderPlayerSearch();
    }
  }

  function applyPartyHostChanged(message) {
    if (message && message.session) {
      applyPartyState(message);
    }
    multiplayer.partyHostId = String(message.hostPlayerId || "");
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    maybeNotifyText(isPartyHost() ? "You are now host." : "Host migrated.");
    if (message.snapshot && isPartyHost()) {
      applyWorldSnapshot(message.snapshot.world);
    }
  }

  function applyPartyWorldSnapshot(message) {
    if (!isPartySessionActive() || isPartyHost()) {
      return;
    }
    if (!joinedPlayerIsolationAllows("hostWorldSnapshots")) {
      return;
    }
    const snapshot = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : message;
    if (snapshot.world) {
      applyWorldSnapshot(snapshot.world, { smoothParticles: true, smoothEntities: true });
    }
    if (snapshot.player) {
      applyPartyPlayerSnapshot({
        fromPlayerId: multiplayer.partyHostId,
        publicName: message.hostName || "Host",
        snapshot: { player: snapshot.player }
      });
    }
  }

  function applyPartyPlayerSnapshot(message) {
    const fromPlayerId = String(message.fromPlayerId || message.playerId || "");
    if (!fromPlayerId || fromPlayerId === player.id) {
      return;
    }
    const source = message.snapshot && typeof message.snapshot === "object" ? message.snapshot : message;
    if (!joinedPlayerIsolationAllows("partyPlayerSnapshots")) {
      applyPartyPlayerVisualSnapshot(message, source);
      return;
    }
    const inputSeq = partyInputSeqFromSnapshot(source);
    if (inputSeq > 0) {
      const previousSeq = multiplayer.partyInputSeqByPlayer.get(fromPlayerId) || 0;
      if (inputSeq < previousSeq) {
        return;
      }
      multiplayer.partyInputSeqByPlayer.set(fromPlayerId, inputSeq);
    }
    multiplayer.partyPlayerSnapshots.set(fromPlayerId, {
      playerId: fromPlayerId,
      snapshot: source,
      receivedAt: performance.now()
    });
    const remote = getRemoteUniverse("solo:" + fromPlayerId);
    remote.playerId = fromPlayerId;
    remote.publicName = message.publicName || message.fromName || remote.publicName || fromPlayerId;
    remote.partySessionId = multiplayer.partySession ? multiplayer.partySession.id : "";
    remote.teamId = message.teamId || remote.teamId || "";
    remote.transform = createRemoteTransform(0, 0, 1, "overlap", multiplayer.anomaly ? "anomaly" : "party");
    remote.displayTransform = { ...remote.transform };
    remote.snapshot = normalizeRemoteSnapshot({
      player: source.player || source,
      world: {
        particles: [],
        alienoids: [],
        ufos: [],
        rambots: [],
        engineers: [],
        teslas: [],
        rockets: [],
        fighters: [],
        mobBeacons: [],
        structures: [],
        rivalProjectiles: [],
        techPickups: [],
        healthPickups: []
      }
    });
    remote.seenAt = performance.now();
    addRemoteSnapshotFrame(remote, remote.snapshot, remote.seenAt / 1000);
  }

  function applyPartyPlayerVisualSnapshot(message, source) {
    const fromPlayerId = String(message.fromPlayerId || message.playerId || "");
    const playerSource = source && source.player && typeof source.player === "object" ? source.player : source;
    const incomingPlayer = normalizeRemotePlayerSnapshot(playerSource);
    if (!fromPlayerId || !incomingPlayer) {
      return;
    }

    const remote = getRemoteUniverse("solo:" + fromPlayerId);
    remote.playerId = fromPlayerId;
    remote.publicName = message.publicName || message.fromName || remote.publicName || fromPlayerId;
    remote.partySessionId = multiplayer.partySession ? multiplayer.partySession.id : "";
    remote.teamId = message.teamId || remote.teamId || "";
    remote.transform = remote.transform || createRemoteTransform(0, 0, 1, "overlap", multiplayer.anomaly ? "anomaly" : "party");
    remote.displayTransform = remote.displayTransform || { ...remote.transform };

    const previousSnapshot = remote.snapshot || normalizeRemoteSnapshot({
      player: incomingPlayer,
      world: {
        particles: [],
        alienoids: [],
        ufos: [],
        rambots: [],
        engineers: [],
        teslas: [],
        rockets: [],
        fighters: [],
        mobBeacons: [],
        structures: [],
        rivalProjectiles: [],
        techPickups: [],
        healthPickups: []
      }
    });
    const previousPlayer = previousSnapshot && previousSnapshot.player ? previousSnapshot.player : incomingPlayer;
    const visualPlayer = {
      ...previousPlayer,
      id: incomingPlayer.id || previousPlayer.id || fromPlayerId,
      name: incomingPlayer.name || previousPlayer.name || remote.publicName,
      skinId: incomingPlayer.skinId || previousPlayer.skinId || "",
      trailId: incomingPlayer.trailId || previousPlayer.trailId || "",
      aimAngle: incomingPlayer.aimAngle,
      aimLocalAngle: incomingPlayer.aimLocalAngle,
      visualAimLocalAngle: incomingPlayer.visualAimLocalAngle,
      cameraRoll: incomingPlayer.cameraRoll,
      equippedTool: incomingPlayer.equippedTool,
      toolDisabledTimer: incomingPlayer.toolDisabledTimer,
      toolMode: incomingPlayer.toolMode,
      toolActive: incomingPlayer.toolActive,
      moving: incomingPlayer.moving,
      crouching: incomingPlayer.crouching
    };

    remote.snapshot = {
      player: visualPlayer,
      world: previousSnapshot.world || {
        particles: [],
        alienoids: [],
        ufos: [],
        rambots: [],
        engineers: [],
        teslas: [],
        rockets: [],
        fighters: [],
        mobBeacons: [],
        structures: [],
        rivalProjectiles: [],
        techPickups: [],
        healthPickups: []
      }
    };
    remote.seenAt = performance.now();
    addRemoteSnapshotFrame(remote, remote.snapshot, remote.seenAt / 1000);
  }

  function partySessionIncludesPlayer(playerId) {
    const id = String(playerId || "");
    return Boolean(
      id &&
      multiplayer.partySession &&
      Array.isArray(multiplayer.partySession.players) &&
      multiplayer.partySession.players.some((entry) => {
        if (!entry) {
          return false;
        }
        return String(entry.playerId || entry.id || entry) === id;
      })
    );
  }

  function partyPhysicsRequestOwner(message) {
    return String(message && (message.fromPlayerId || message.playerId || message.ownerPlayerId) || "");
  }

  function partyPhysicsRequestSeq(message) {
    return Math.max(0, Math.floor(finiteOr(message && message.seq, 0)));
  }

  function partyPhysicsRequestActor(message) {
    return normalizeRemotePlayerSnapshot(message && message.actor);
  }

  function partyPhysicsCorrectionLimit(type, entity) {
    const radius = Math.max(1, finiteOr(entity && entity.radius, 1));
    if (normalizePartyEntityType(type) === "particle" && entity && entity.tier && entity.tier.solid) {
      return Math.max(720, radius * 5.2);
    }
    return Math.max(980, radius * 7.5);
  }

  function hostLocalPartyPhysicsConflict(type, entity) {
    if (!isPartyHost() || !entity || !canUseSuctionControls()) {
      return false;
    }
    const state = localPartyGadgetState(buildPersistentPayload(false).player);
    if (!state) {
      return false;
    }
    const cleanType = normalizePartyEntityType(type);
    if (cleanType === "particle" && state.landedBodyId === entity.id && (state.left || state.right)) {
      return true;
    }
    if (!state.active) {
      return false;
    }
    if (cleanType === "particle" && !partyGadgetCanAffectParticle(state, entity)) {
      return false;
    }
    const probe = partyGadgetParticleProbe(state, entity, { padding: 24 });
    return Boolean(probe.force || probe.bucket);
  }

  function validatePartyPhysicsRequest(message, options) {
    if (!isPartyHost()) {
      return { ok: false, reason: "not-host" };
    }
    const owner = partyPhysicsRequestOwner(message);
    if (!partySessionIncludesPlayer(owner)) {
      return { ok: false, reason: "not-party-member" };
    }
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    const incoming = normalizePartyEntityState(type, message && message.state);
    const entity = findPartyEntity(type, id);
    if (!type || !id || !incoming || incoming.id !== id || !entity) {
      return { ok: false, reason: "missing-entity", type, id, owner };
    }
    const now = performance.now();
    const current = partyPhysicsSession(type, id, now);
    const seq = partyPhysicsRequestSeq(message);
    if (current && current.playerId && current.playerId !== owner) {
      return { ok: false, reason: "claimed", type, id, owner, entity };
    }
    if (current && seq > 0 && finiteOr(current.seq, 0) > 0 && seq < finiteOr(current.seq, 0)) {
      return { ok: false, reason: "stale", type, id, owner, entity };
    }
    if (!(options && options.allowExistingOwner) && hostLocalPartyPhysicsConflict(type, entity) && owner !== player.id) {
      return { ok: false, reason: "host-local-control", type, id, owner, entity };
    }

    const actor = partyPhysicsRequestActor(message);
    if (!actor) {
      return { ok: false, reason: "missing-actor", type, id, owner, entity };
    }
    const reach = gadgetForceReach * Math.max(0.1, finiteOr(message && message.rangeFactor, 1)) +
      Math.max(300, finiteOr(entity.radius, 1) * 3.4);
    const hostDistance = Math.hypot(entity.x - actor.x, entity.y - actor.y);
    const incomingDistance = Math.hypot(incoming.x - actor.x, incoming.y - actor.y);
    if (Math.min(hostDistance, incomingDistance) > reach) {
      return { ok: false, reason: "out-of-range", type, id, owner, entity };
    }

    const correctionDistance = Math.hypot(incoming.x - entity.x, incoming.y - entity.y);
    if (correctionDistance > partyPhysicsCorrectionLimit(type, entity)) {
      return { ok: false, reason: "correction-too-large", type, id, owner, entity };
    }

    return { ok: true, type, id, owner, entity, incoming, seq, actor };
  }

  function applyAcceptedPartyPhysicsSession(validation, message) {
    const now = performance.now();
    const active = message && message.active !== false;
    const lease = active ? partyPhysicsSessionActiveHoldMs : partyFollowerPredictionHoldMs;
    const key = partyEntityKey(validation.type, validation.id);
    multiplayer.partyPhysicsSessions.set(key, {
      type: validation.type,
      id: validation.id,
      key,
      playerId: validation.owner,
      seq: validation.seq,
      expiresAt: now + lease,
      accepted: true,
      receivedAt: now
    });

    const solidParticle = validation.type === "particle" && validation.entity && validation.entity.tier && validation.entity.tier.solid;
    applyPartyEntityMotionState(validation.entity, validation.incoming, {
      positionBlend: solidParticle ? 0.86 : 0.94,
      velocityBlend: solidParticle ? 0.82 : 0.92
    });
    if (validation.type === "particle") {
      validation.entity.gadgetStabilized = false;
    }
    return validation.entity;
  }

  function sendPartyPhysicsHostAuthority(action, validation, entity) {
    sendMultiplayer({
      type: "party.physics.authority",
      action,
      entityType: validation.type,
      entityId: validation.id,
      ownerPlayerId: validation.owner,
      seq: validation.seq,
      state: entity ? serializePartyEntity(validation.type, entity) : null
    });
  }

  function sendPartyPhysicsHostReject(message, reason, entity) {
    const type = normalizePartyEntityType(message && message.entityType);
    const id = partyEntityId(message && message.entityId);
    sendMultiplayer({
      type: "party.physics.reject",
      targetPlayerId: partyPhysicsRequestOwner(message),
      entityType: type,
      entityId: id,
      seq: partyPhysicsRequestSeq(message),
      reason,
      state: entity ? serializePartyEntity(type, entity) : null
    });
  }

  function handlePartyPhysicsSessionRequest(message) {
    const validation = validatePartyPhysicsRequest(message, {
      allowExistingOwner: message && message.type === "party.physics.state"
    });
    if (!validation.ok) {
      sendPartyPhysicsHostReject(message, validation.reason, validation.entity);
      return;
    }
    const entity = applyAcceptedPartyPhysicsSession(validation, message);
    sendPartyPhysicsHostAuthority(message.type === "party.physics.start" ? "start" : "state", validation, entity);
  }
