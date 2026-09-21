  function applyMultiplayerV2Snapshot(message) {
    if (!mpV2Sim || !message || !message.state) {
      return;
    }
    const reconcileStart = performance.now();
    if (!multiplayer.v2.active) {
      resetMultiplayerV2State();
      multiplayer.v2.active = true;
      multiplayer.v2.roomId = String(message.roomId || "");
    }
    const serverTick = multiplayerV2SnapshotTick(message);
    if (
      multiplayer.v2.lastServerTick > 0 &&
      serverTick + multiplayerV2StaleSnapshotTickTolerance < multiplayer.v2.lastServerTick
    ) {
      updateMultiplayerV2Perf({
        skippedSnapshots: finiteOr(multiplayer.v2.perf && multiplayer.v2.perf.skippedSnapshots, 0) + 1
      });
      return;
    }

    if (shouldSkipMultiplayerV2RespawnSnapshot(message)) {
      updateMultiplayerV2Perf({
        skippedSnapshots: finiteOr(multiplayer.v2.perf && multiplayer.v2.perf.skippedSnapshots, 0) + 1
      });
      return;
    }

    const ackResult = multiplayerV2LocalAckFromSnapshot(message);
    const ack = ackResult.value;
    multiplayer.v2.lastAckInputSeq = Math.max(multiplayer.v2.lastAckInputSeq, ack);
    multiplayer.v2.pendingInputs = multiplayer.v2.pendingInputs.filter((input) => input.seq > multiplayer.v2.lastAckInputSeq);
    multiplayer.v2.authoritativeState = mpV2Sim.serializeState(message.state);
    multiplayer.v2.lastServerTick = Math.max(multiplayer.v2.lastServerTick, serverTick);
    if (message.perf && typeof message.perf === "object") {
      updateMultiplayerV2Perf({
        serverStepMs: finiteOr(message.perf.stepMs, multiplayer.v2.perf && multiplayer.v2.perf.serverStepMs),
        serverSnapshotBytes: finiteOr(message.perf.snapshotBytes, multiplayer.v2.perf && multiplayer.v2.perf.serverSnapshotBytes),
        serverMaxInputQueue: finiteOr(message.perf.maxInputQueue, multiplayer.v2.perf && multiplayer.v2.perf.serverMaxInputQueue)
      });
    }
    if (message.sharedWorldStats) {
      applySharedWorldStats(message.sharedWorldStats);
    }
    processMultiplayerV2Events(message.events, { authoritative: true });

    const oldX = player.x;
    const oldY = player.y;
    let droppedReplayInputs = 0;
    if (multiplayer.v2.pendingInputs.length > multiplayerV2ReplayInputLimit) {
      droppedReplayInputs = multiplayer.v2.pendingInputs.length - multiplayerV2ReplayInputLimit;
      multiplayer.v2.pendingInputs.splice(0, droppedReplayInputs);
    }
    const replayInputs = multiplayer.v2.pendingInputs.map((input) => Object.assign({}, input));
    const replayOptions = multiplayerV2SimOptions({ dt: mpV2Sim.TICK_DT });
    multiplayer.v2.state = typeof mpV2Sim.replayLocalPlayerFromSnapshot === "function"
      ? mpV2Sim.replayLocalPlayerFromSnapshot(multiplayer.v2.authoritativeState, replayInputs, replayOptions)
      : mpV2Sim.replayFromSnapshot(multiplayer.v2.authoritativeState, replayInputs, replayOptions);
    syncMultiplayerV2StateToGame({ previousLocalX: oldX, previousLocalY: oldY, blendDt: mpV2Sim.TICK_DT });
    updateMultiplayerV2Perf({
      reconcileMs: performance.now() - reconcileStart,
      pendingInputs: multiplayer.v2.pendingInputs.length,
      replayInputs: replayInputs.length,
      droppedReplayInputs: finiteOr(multiplayer.v2.perf && multiplayer.v2.perf.droppedReplayInputs, 0) + droppedReplayInputs,
      ackMissing: finiteOr(multiplayer.v2.perf && multiplayer.v2.perf.ackMissing, 0) + (ackResult.missing ? 1 : 0),
      entityCount: multiplayerV2WorldEntityCount(message.state.world)
    });
  }

  function syncMultiplayerV2StateToGame(options) {
    const state = multiplayer.v2.state;
    if (!state || !state.players || !state.world) {
      return;
    }
    const local = state.players[player.id];
    if (local) {
      const previousHealth = player.health;
      const previousX = Number.isFinite(options && options.previousLocalX) ? options.previousLocalX : player.x;
      const previousY = Number.isFinite(options && options.previousLocalY) ? options.previousLocalY : player.y;
      const snapLocal = Boolean(options && options.snapLocal);
      const localLanding = normalizeLandingSnapshot(local.landed);
      const error = Math.hypot(local.x - previousX, local.y - previousY);
      const correctionBlend = frameRateIndependentBlend(
        multiplayerV2LocalCorrectionBlendPerFrame,
        options && options.blendDt
      );
      const blend = !snapLocal && !localLanding && error < 360 ? correctionBlend : 1;
      player.x = previousX + (finiteOr(local.x, previousX) - previousX) * blend;
      player.y = previousY + (finiteOr(local.y, previousY) - previousY) * blend;
      player.vx = finiteOr(local.vx, player.vx);
      player.vy = finiteOr(local.vy, player.vy);
      player.radius = finiteOr(local.radius, player.radius);
      player.maxHealth = clamp(finiteOr(local.maxHealth, player.maxHealth), 1, 100);
      player.health = clamp(finiteOr(local.health, player.health), 0, player.maxHealth);
      player.maxEnergy = clamp(finiteOr(local.maxEnergy, player.maxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
      player.energy = clamp(finiteOr(local.energy, player.energy), 0, player.maxEnergy);
      applySerializedPlayerStatusEffects({
        ...(local.statusEffects && typeof local.statusEffects === "object" ? local.statusEffects : {}),
        toolDisabledTimer: local.toolDisabledTimer
      });
      player.hitCooldown = Math.max(0, finiteOr(local.hitCooldown, player.hitCooldown || 0));
      player.landed = localLanding;
      player.spacecraftInterior = normalizeSpacecraftInteriorSnapshot(local.spacecraftInterior);
      player.walkCycle = finiteOr(local.walkCycle, player.walkCycle);
      cameraRoll = player.landed ? surfaceCameraRollForAngle(player.landed.angle) : (player.spacecraftInterior ? 0 : finiteOr(local.cameraRoll, cameraRoll));
      syncTechInventoryFromMultiplayerV2(local.tech);
      applyToolInventory(local.tools, local.equippedTool, local.equippedTools);
      applyToolUpgrades(local.toolUpgrades);
      familiarNetCapture = normalizeMultiplayerV2FamiliarNetCapture(local.familiarNetCapture);
      updateSharedTeamFromLocalSnapshot(local.teamId);
      if (!deathState.active && previousHealth > player.health && player.health > 0) {
        playSound("hit", { throttleKey: "mpV2LocalDamage", throttle: 0.08 });
      }
      if (!deathState.active && previousHealth > 0 && player.health <= 0) {
        beginPlayerDeath("Hull failure");
      }
    }

    const syncStart = performance.now();
    syncMultiplayerV2World(state.world);
    updateSyncedSpacecraftWorldFields();
    flushMultiplayerV2MergeVisuals();
    updateLifeStats();
    syncMultiplayerV2RemotePlayers(state);
    updateMultiplayerV2Perf({
      syncMs: performance.now() - syncStart,
      entityCount: multiplayerV2WorldEntityCount(state.world)
    });
    updateHud();
  }

  function normalizeMultiplayerV2FamiliarNetCapture(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }
    const kind = String(snapshot.kind || "");
    if (!mobTierOrder.includes(kind)) {
      return null;
    }
    const maxHealth = Math.max(1, finiteOr(snapshot.maxHealth, snapshot.health || 1));
    return {
      kind,
      health: clamp(finiteOr(snapshot.health, maxHealth), 1, maxHealth),
      maxHealth,
      color: snapshot.color ? normalizeColorSnapshot(snapshot.color, { r: 102, g: 224, b: 184 }) : null
    };
  }

  function syncTechInventoryFromMultiplayerV2(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }
    let changed = false;
    for (const tech of techTypes) {
      const nextValue = Math.max(0, Math.floor(finiteOr(snapshot[tech.key], techInventory[tech.key] || 0)));
      if (techInventory[tech.key] !== nextValue) {
        techInventory[tech.key] = nextValue;
        changed = true;
      }
    }
    if (changed) {
      updateTechUi();
    }
  }

  function updateSyncedSpacecraftWorldFields() {
    for (const craft of spacecrafts) {
      updateSpacecraftWorldFields(craft);
    }
  }

  function syncMultiplayerV2EntityList(target, sourceList, normalizer, options) {
    const incoming = Array.isArray(sourceList) ? sourceList : [];
    const authoritativeLiveById = new Map();
    if (options && Array.isArray(options.authoritativeList)) {
      for (const snapshot of options.authoritativeList) {
        const normalized = normalizer(snapshot);
        if (normalized && normalized.id !== undefined && normalized.id !== null && finiteOr(normalized.health, 1) > 0) {
          authoritativeLiveById.set(String(normalized.id), normalized);
        }
      }
    }
    const existingById = new Map();
    for (const entity of target) {
      if (entity && entity.id !== undefined && entity.id !== null) {
        existingById.set(String(entity.id), entity);
      }
    }

    const next = [];
    for (const snapshot of incoming) {
      let normalized = normalizer(snapshot);
      if (!normalized) {
        continue;
      }
      const id = String(normalized.id);
      if (authoritativeLiveById.size && finiteOr(normalized.health, 1) <= 0) {
        const authoritative = authoritativeLiveById.get(id);
        if (!authoritative) {
          continue;
        }
        normalized = authoritative;
      }
      const existing = existingById.get(String(normalized.id));
      if (existing) {
        Object.assign(existing, normalized);
        next.push(existing);
      } else {
        next.push(normalized);
      }
    }

    if (authoritativeLiveById.size) {
      const nextIds = new Set(next.map((entity) => String(entity.id)));
      for (const [id, authoritative] of authoritativeLiveById.entries()) {
        if (nextIds.has(id)) {
          continue;
        }
        const existing = existingById.get(id);
        if (existing) {
          Object.assign(existing, authoritative);
          next.push(existing);
        } else {
          next.push(authoritative);
        }
      }
    }

    target.length = 0;
    target.push(...next);
  }

  function syncMultiplayerV2World(world) {
    const source = world && typeof world === "object" ? world : {};
    const authoritativeWorld = multiplayer.v2.authoritativeState && multiplayer.v2.authoritativeState.world
      ? multiplayer.v2.authoritativeState.world
      : {};
    if (Array.isArray(source.claimedTechPickupIds)) {
      multiplayer.claimedTechPickupIds = new Set(source.claimedTechPickupIds.map(String));
    }
    if (Array.isArray(source.claimedHealthPickupIds)) {
      multiplayer.claimedHealthPickupIds = new Set(source.claimedHealthPickupIds.map(String));
    }
    if (Array.isArray(source.starDust)) {
      starDust.length = 0;
      starDust.push(...source.starDust.map(normalizeStarSnapshot).filter(Boolean));
    }
    syncMultiplayerV2EntityList(particles, source.particles, normalizeParticleSnapshot);
    syncMultiplayerV2EntityList(rivals, source.alienoids, normalizeRivalSnapshot, { authoritativeList: authoritativeWorld.alienoids });
    syncMultiplayerV2EntityList(ufos, source.ufos, normalizeUfoSnapshot, { authoritativeList: authoritativeWorld.ufos });
    syncMultiplayerV2EntityList(rambots, source.rambots, normalizeRambotSnapshot, { authoritativeList: authoritativeWorld.rambots });
    syncMultiplayerV2EntityList(engineers, source.engineers, normalizeEngineerSnapshot, { authoritativeList: authoritativeWorld.engineers });
    syncMultiplayerV2EntityList(teslas, source.teslas, normalizeTeslaSnapshot, { authoritativeList: authoritativeWorld.teslas });
    syncMultiplayerV2EntityList(rockets, source.rockets, normalizeRocketSnapshot, { authoritativeList: authoritativeWorld.rockets });
    syncMultiplayerV2EntityList(fighters, source.fighters, normalizeFighterSnapshot, { authoritativeList: authoritativeWorld.fighters });
    if (normalizeGameMode(source.gameMode || runState.gameMode) === "survival") {
      mobBeacons.length = 0;
    } else {
      syncMultiplayerV2EntityList(mobBeacons, source.mobBeacons, normalizeMobBeaconSnapshot);
    }
    syncMultiplayerV2EntityList(structures, source.structures, normalizeStructureSnapshot);
    if (Array.isArray(source.spacecrafts)) {
      syncMultiplayerV2EntityList(spacecrafts, source.spacecrafts, normalizeSpacecraftSnapshot);
    }
    syncMultiplayerV2EntityList(rivalProjectiles, source.rivalProjectiles, normalizeProjectileSnapshot);
    syncMultiplayerV2EntityList(techPickups, source.techPickups, normalizeTechPickupSnapshot);
    syncMultiplayerV2EntityList(healthPickups, source.healthPickups, normalizeHealthPickupSnapshot);
    if (source.randomEvents) {
      applyRandomEventState(source.randomEvents);
    }
    if (!Array.isArray(source.spacecrafts)) {
      syncSpacecraftsToRandomEventState();
    }
    nextParticleId = Math.max(finiteOr(source.nextParticleId, nextParticleId), particles.reduce((largest, body) => Math.max(largest, body.id + 1), 1));
    nextTechPickupId = Math.max(finiteOr(source.nextTechPickupId, nextTechPickupId), techPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1));
    nextHealthPickupId = Math.max(finiteOr(source.nextHealthPickupId, nextHealthPickupId), healthPickups.reduce((largest, pickup) => Math.max(largest, pickup.id + 1), 1));
    nextMobBeaconId = Math.max(finiteOr(source.nextMobBeaconId, nextMobBeaconId), mobBeacons.reduce((largest, beacon) => Math.max(largest, finiteOr(beacon.id, 0) + 1), 1));
    nextSurvivalCampId = Math.max(1, finiteOr(source.nextSurvivalCampId, nextSurvivalCampId));
    nextSpacecraftId = Math.max(finiteOr(source.nextSpacecraftId, nextSpacecraftId), spacecrafts.reduce((largest, craft) => Math.max(largest, finiteOr(craft.id, 0) + 1), 1));
  }

  function syncMultiplayerV2RemotePlayers(state) {
    const now = performance.now();
    const players = state && state.players ? state.players : {};
    for (const [remotePlayerId, remotePlayer] of Object.entries(players)) {
      if (!remotePlayer || remotePlayerId === player.id) {
        continue;
      }
      const remote = getRemoteUniverse("solo:" + remotePlayerId);
      remote.playerId = remotePlayerId;
      remote.publicName = remotePlayer.name || remote.publicName || remotePlayerId;
      remote.partySessionId = multiplayer.partySession ? multiplayer.partySession.id : "";
      remote.teamId = String(remotePlayer.teamId || "");
      remote.transform = createRemoteTransform(0, 0, 1, "overlap", "party");
      remote.displayTransform = remote.displayTransform || { ...remote.transform };
      remote.snapshot = normalizeRemoteSnapshot({
        player: {
          ...remotePlayer,
          equippedTool: remotePlayer.equippedTool || defaultToolId,
          toolMode: remotePlayer.toolMode || "idle",
          toolActive: remotePlayer.toolMode && remotePlayer.toolMode !== "idle"
        },
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
      remote.seenAt = now;
      addRemoteSnapshotFrame(remote, remote.snapshot, now / 1000);
    }
  }

  function stepMultiplayerV2Simulation(dt, includeExternalSystems) {
    if (!isMultiplayerV2Active()) {
      return;
    }
    flushQueuedMultiplayerV2Snapshot();
    if (!isMultiplayerV2Active()) {
      return;
    }
    const frameDt = multiplayerV2FrameDt(dt);
    updateGadgetAim(frameDt);
    if (multiplayer.v2.firstStepPending) {
      multiplayer.v2.firstStepPending = false;
      multiplayer.v2.fixedAccumulator += frameDt < mpV2Sim.TICK_DT
        ? Math.max(0, mpV2Sim.TICK_DT - frameDt)
        : 0.000001;
    }
    multiplayer.v2.fixedAccumulator = Math.min(multiplayerV2MaxAccumulator, multiplayer.v2.fixedAccumulator + frameDt);
    const stepStart = performance.now();
    let stepped = 0;
    while (multiplayer.v2.fixedAccumulator + 0.000001 >= mpV2Sim.TICK_DT && stepped < multiplayerV2MaxCatchUpSteps) {
      multiplayer.v2.fixedAccumulator -= mpV2Sim.TICK_DT;
      multiplayer.v2.clientTick += 1;
      const input = buildMultiplayerV2Input(multiplayer.v2.inputSeq + 1);
      multiplayer.v2.inputSeq = input.seq;
      mpV2Sim.step(
        multiplayer.v2.state,
        { [player.id]: input },
        multiplayerV2SimOptions({ dt: mpV2Sim.TICK_DT })
      );
      processMultiplayerV2Events(multiplayer.v2.state && multiplayer.v2.state.events);
      if (shouldSendMultiplayerV2Input(input) && sendMultiplayerV2Input(input)) {
        multiplayer.v2.pendingInputs.push(input);
        multiplayer.v2.lastSentInput = Object.assign({}, input, {
          buttons: input.buttons ? { ...input.buttons } : {}
        });
        while (multiplayer.v2.pendingInputs.length > multiplayerV2ReplayInputLimit * 2) {
          multiplayer.v2.pendingInputs.shift();
        }
      }
      stepped += 1;
    }
    if (stepped >= multiplayerV2MaxCatchUpSteps) {
      multiplayer.v2.fixedAccumulator = Math.min(multiplayer.v2.fixedAccumulator, mpV2Sim.TICK_DT * multiplayerV2MaxCatchUpSteps);
    }
    if (stepped) {
      updateMultiplayerV2Perf({
        clientStepMs: performance.now() - stepStart,
        pendingInputs: multiplayer.v2.pendingInputs.length,
        entityCount: multiplayerV2WorldEntityCount(multiplayer.v2.state && multiplayer.v2.state.world)
      });
    }
    syncMultiplayerV2StateToGame({ blendDt: frameDt || mpV2Sim.TICK_DT });
    updateRemoteVisualTransforms(frameDt);
    updateRemoteInteractions(frameDt);
    updateInteractionState(frameDt);
    pruneRemoteUniverses();
    updateSparks(frameDt);
    if (includeExternalSystems) {
      updateMultiplayer(frameDt);
    }
  }

  function applyPartyState(message) {
    const session = message && message.session && typeof message.session === "object" ? message.session : message;
    if (!session || typeof session !== "object") {
      return;
    }
    if (!multiplayer.partySession) {
      multiplayer.partySession = {
        id: String(session.sessionId || session.id || ""),
        lobbyId: String(session.lobbyId || ""),
        code: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
        joinCode: sanitizeLobbyCode(session.joinCode || session.code || session.lobbyId),
        maxPlayers: Math.max(1, Math.floor(finiteOr(session.maxPlayers, crazyGamesRoomMaxPlayers))),
        players: [],
        pvpMode: String(session.pvpMode || "party-off"),
        netcodeVersion: Math.max(1, Math.floor(finiteOr(session.netcodeVersion, 1))),
        worldMode: String(session.worldMode || "party"),
        gameMode: normalizeGameMode(session.gameMode),
        sharedWorld: Boolean(session.sharedWorld),
        teams: []
      };
    }
    multiplayer.partySession.id = String(session.sessionId || session.id || multiplayer.partySession.id || "");
    multiplayer.partySession.lobbyId = String(session.lobbyId || multiplayer.partySession.lobbyId || "");
    multiplayer.partySession.code = sanitizeLobbyCode(session.joinCode || session.code || multiplayer.partySession.code || multiplayer.partySession.lobbyId);
    multiplayer.partySession.joinCode = multiplayer.partySession.code;
    multiplayer.partySession.maxPlayers = Math.max(1, Math.floor(finiteOr(session.maxPlayers, multiplayer.partySession.maxPlayers || crazyGamesRoomMaxPlayers)));
    multiplayer.partySession.players = Array.isArray(session.players)
      ? session.players.map(normalizeLobbyPlayer).filter(Boolean)
      : multiplayer.partySession.players || [];
    multiplayer.partySession.pvpMode = String(session.pvpMode || multiplayer.partySession.pvpMode || "party-off");
    multiplayer.partySession.netcodeVersion = Math.max(1, Math.floor(finiteOr(session.netcodeVersion, multiplayer.partySession.netcodeVersion || 1)));
    multiplayer.partySession.worldMode = String(session.worldMode || multiplayer.partySession.worldMode || "party");
    multiplayer.partySession.gameMode = normalizeGameMode(session.gameMode || multiplayer.partySession.gameMode || (multiplayer.partySession.worldMode === "shared-public" ? "survival" : "horde"));
    multiplayer.partySession.sharedWorld = Boolean(session.sharedWorld || multiplayer.partySession.worldMode === "shared-public");
    if (multiplayer.partySession.sharedWorld && session.sharedWorldStats) {
      applySharedWorldStats(session.sharedWorldStats);
    }
    multiplayer.partySession.teams = Array.isArray(session.teams) ? session.teams : multiplayer.partySession.teams || [];
    multiplayer.partyJoinCode = multiplayer.partySession.joinCode;
    multiplayer.partyHostId = String(session.hostPlayerId || multiplayer.partyHostId || player.id);
    multiplayer.partyHostUniverseId = "solo:" + multiplayer.partyHostId;
    updateSharedTeamFromSession(multiplayer.partySession, { notifyJoins: true });
    updateSettingsJoinCodeUi();
  }
