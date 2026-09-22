  function buildLocalPartyGadgetSnapshot(playerSnapshot, seq) {
    if (!joinedPlayerIsolationAllows("partyInputGadgetState")) {
      return {
        seq,
        sentAt: performance.now(),
        active: false,
        mode: "idle",
        aimAngle: finiteOr(playerSnapshot && playerSnapshot.aimAngle, 0),
        x: finiteOr(playerSnapshot && playerSnapshot.x, player.x),
        y: finiteOr(playerSnapshot && playerSnapshot.y, player.y),
        vx: finiteOr(playerSnapshot && playerSnapshot.vx, player.vx),
        vy: finiteOr(playerSnapshot && playerSnapshot.vy, player.vy),
        landedBodyId: 0,
        landedThrustDirection: 0,
        suckFactor: 1,
        rangeFactor: 1,
        blowFactor: 1
      };
    }
    const state = localPartyGadgetState(playerSnapshot);
    const mode = state ? state.mode : "idle";
    const active = Boolean(state && state.active);
    const now = performance.now();
    const landedThrustDirection = state && state.landedBodyId && (state.left || state.right) ? (state.left ? 1 : -1) : 0;

    return {
      seq,
      sentAt: now,
      active,
      mode,
      aimAngle: finiteOr(playerSnapshot && playerSnapshot.aimAngle, 0),
      x: finiteOr(playerSnapshot && playerSnapshot.x, player.x),
      y: finiteOr(playerSnapshot && playerSnapshot.y, player.y),
      vx: finiteOr(playerSnapshot && playerSnapshot.vx, player.vx),
      vy: finiteOr(playerSnapshot && playerSnapshot.vy, player.vy),
      landedBodyId: state && state.landedBodyId ? state.landedBodyId : 0,
      landedThrustDirection,
      suckFactor: state ? state.suckFactor : 1,
      rangeFactor: state ? state.rangeFactor : 1,
      blowFactor: state ? state.blowFactor : 1
    };
  }

  function buildPartyInputSnapshot(seq) {
    const snapshot = buildPersistentPayload(false);
    return {
      player: snapshot.player,
      gadget: buildLocalPartyGadgetSnapshot(snapshot.player, seq)
    };
  }

  function partyInputMotionSharp(snapshot) {
    const previous = multiplayer.partyLastInputSnapshot;
    if (!snapshot || !previous || !snapshot.player || !previous.player) {
      return false;
    }

    const currentPlayer = snapshot.player;
    const previousPlayer = previous.player;
    const distance = Math.hypot(
      finiteOr(currentPlayer.x, 0) - finiteOr(previousPlayer.x, 0),
      finiteOr(currentPlayer.y, 0) - finiteOr(previousPlayer.y, 0)
    );
    const velocityDelta = Math.hypot(
      finiteOr(currentPlayer.vx, 0) - finiteOr(previousPlayer.vx, 0),
      finiteOr(currentPlayer.vy, 0) - finiteOr(previousPlayer.vy, 0)
    );
    const aimDelta = Math.abs(shortestAngleDelta(
      finiteOr(previous.gadget && previous.gadget.aimAngle, finiteOr(previousPlayer.aimAngle, 0)),
      finiteOr(snapshot.gadget && snapshot.gadget.aimAngle, finiteOr(currentPlayer.aimAngle, 0))
    ));
    const modeChanged = (previous.gadget && previous.gadget.mode) !== (snapshot.gadget && snapshot.gadget.mode);

    return modeChanged || aimDelta > 0.16 || distance > 70 || velocityDelta > 180;
  }

  function partyInputIntervalFor(snapshot) {
    const gadget = snapshot && snapshot.gadget;
    if ((gadget && (gadget.active || gadget.landedThrustDirection)) || partyInputMotionSharp(snapshot)) {
      return partyActiveInputInterval;
    }
    return partyInputInterval;
  }

  function hasRecentPartyGadgetActivity() {
    if (!isPartySessionActive()) {
      return false;
    }

    const local = buildLocalPartyGadgetSnapshot(buildPersistentPayload(false).player, multiplayer.partyInputSeq + 1);
    if (local.active || local.landedThrustDirection) {
      return true;
    }

    if (!isPartyHost()) {
      return false;
    }

    const now = performance.now();
    for (const entry of multiplayer.partyPlayerSnapshots.values()) {
      const snapshot = entry && entry.snapshot && typeof entry.snapshot === "object" ? entry.snapshot : null;
      const gadget = snapshot && snapshot.gadget && typeof snapshot.gadget === "object" ? snapshot.gadget : null;
      const remotePlayer = snapshot && snapshot.player && typeof snapshot.player === "object" ? snapshot.player : null;
      if (
        gadget &&
        (
          gadget.active ||
          gadget.landedThrustDirection
        ) &&
        now - finiteOr(entry.receivedAt, 0) <= partyGadgetIntentFreshMs
      ) {
        return true;
      }
      if (
        remotePlayer &&
        isPartyGadgetActiveMode(remotePlayer.toolMode) &&
        now - finiteOr(entry.receivedAt, 0) <= partyGadgetIntentFreshMs
      ) {
        return true;
      }
    }
    return false;
  }

  function buildRealtimeSnapshot() {
    return buildPersistentPayload(true);
  }

  function buildMultiplayerPresenceSnapshot() {
    return buildPersistentPayload(false);
  }

  function updateMultiplayer(dt) {
    if (!multiplayer.enabled) {
      return;
    }

    multiplayer.partyRespawnInvulnerableTimer = Math.max(0, multiplayer.partyRespawnInvulnerableTimer - dt);
    if (isPartySessionActive()) {
      prunePartyPhysicsSessions(performance.now());
    }

    if (!multiplayer.socket && multiplayer.reconnectTimer <= 0) {
      connectMultiplayer();
    }

    if (!multiplayer.socket && multiplayer.reconnectTimer > 0) {
      multiplayer.reconnectTimer -= dt;
    }

    multiplayer.partyInputTimer -= dt;
    if (multiplayer.connected && isPartySessionActive() && !isMultiplayerV2Active() && joinedPlayerIsolationAllows("partyInput") && multiplayer.partyInputTimer <= 0) {
      const snapshot = buildPartyInputSnapshot(multiplayer.partyInputSeq + 1);
      const inputInterval = partyInputIntervalFor(snapshot);
      multiplayer.partyInputTimer = inputInterval;
      multiplayer.partyInputSeq += 1;
      multiplayer.partyLastInputSnapshot = snapshot;
      sendMultiplayer({
        type: "party.input",
        snapshot
      });
    }

    multiplayer.snapshotTimer -= dt;
    const snapshotInterval = isMultiplayerV2Active() || isSharedWorldFollower()
      ? multiplayerSnapshotInterval
      : isPartyHost() && hasRecentPartyGadgetActivity()
      ? partyActiveWorldSnapshotInterval
      : isPartyHost()
      ? partyWorldSnapshotInterval
      : multiplayerSnapshotInterval;
    if (multiplayer.snapshotTimer > snapshotInterval) {
      multiplayer.snapshotTimer = snapshotInterval;
    }
    if (multiplayer.connected && multiplayer.snapshotTimer <= 0) {
      multiplayer.snapshotTimer = snapshotInterval;
      const hasOverlapConsumers = multiplayer.remoteUniverses.size > 0 || multiplayer.forceWorldSnapshot === true;
      const snapshot = isMultiplayerV2Active() || isSharedWorldFollower() || !hasOverlapConsumers
        ? buildMultiplayerPresenceSnapshot()
        : buildOverlapRealtimeSnapshot();
      const snapshotSent = sendMultiplayer({
        type: "input",
        multiplayerOptIn: Boolean(multiplayer.friendJoinsEnabled),
        snapshot
      });
      if (snapshotSent) multiplayer.forceWorldSnapshot = false;
      if (isPartySessionActive()) {
        if (isPartyHost() && !isMultiplayerV2Active()) {
          sendMultiplayer({
            type: "party.world.snapshot",
            snapshot: buildRealtimeSnapshot()
          });
        }
      }
    }

    updateRemoteVisualTransforms(dt);
    updateRemoteInteractions(dt);
    updateInteractionState(dt);
    pruneRemoteUniverses();
  }

  function createRemoteTransform(offsetX, offsetY, alpha, phase, mode) {
    return {
      offsetX: finiteOr(offsetX, 0),
      offsetY: finiteOr(offsetY, 0),
      alpha: clamp(finiteOr(alpha, 0), 0, 1),
      phase: phase || "approach",
      mode: mode || "random"
    };
  }

  function displayTransformFor(remote) {
    return remote.displayTransform || remote.transform || createRemoteTransform(0, 0, 0, "approach");
  }

  function isPermanentRemoteOverlap(remote) {
    const transform = displayTransformFor(remote);
    return transform.mode === "world-overlap" || transform.mode === "friend" || transform.mode === "party";
  }

  function displaySnapshotFor(remote) {
    return remote.displaySnapshot || remote.snapshot || null;
  }

  function updateRemoteVisualTransforms(dt) {
    const positionBlend = 1 - Math.pow(0.0008, dt);
    const alphaBlend = 1 - Math.pow(0.015, dt);
    const now = performance.now() / 1000;

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (remote.transform) {
        if (!remote.displayTransform) {
          remote.displayTransform = createRemoteTransform(
            remote.transform.offsetX,
            remote.transform.offsetY,
            remote.transform.alpha,
            remote.transform.phase,
            remote.transform.mode
          );
        } else {
          remote.displayTransform.offsetX += (remote.transform.offsetX - remote.displayTransform.offsetX) * positionBlend;
          remote.displayTransform.offsetY += (remote.transform.offsetY - remote.displayTransform.offsetY) * positionBlend;
          remote.displayTransform.alpha += (remote.transform.alpha - remote.displayTransform.alpha) * alphaBlend;
          remote.displayTransform.phase = remote.transform.phase;
          remote.displayTransform.mode = remote.transform.mode;
        }
      }

      remote.displaySnapshotTimer = finiteOr(remote.displaySnapshotTimer, remoteDisplaySnapshotInterval) + Math.max(0, finiteOr(dt, 0));
      const snapshotInterval = renderQualityBelow(0.68) ? remoteDisplaySnapshotInterval * 1.5 : remoteDisplaySnapshotInterval;
      if (!remote.displaySnapshot || remote.displaySnapshotDirty || remote.displaySnapshotTimer >= snapshotInterval) {
        remote.displaySnapshot = buildRemoteDisplaySnapshot(remote, now);
        remote.displaySnapshotTimer = 0;
        remote.displaySnapshotDirty = false;
      }
    }
  }

  function updateRemoteTransforms(message) {
    const transforms = Array.isArray(message.transforms) ? message.transforms : [];
    for (const transform of transforms) {
      if (!transform || !transform.universeId) {
        continue;
      }

      const remote = getRemoteUniverse(transform.universeId);
      remote.playerId = transform.playerId || remote.playerId;
      remote.publicName = transform.publicName || remote.publicName;
      remote.overlapId = message.overlapId || remote.overlapId;
      remote.partySessionId = transform.partySessionId || remote.partySessionId || "";
      remote.teamId = transform.teamId || remote.teamId || "";
      remote.transform = createRemoteTransform(
        finiteOr(transform.offsetX, remote.transform.offsetX || 0),
        finiteOr(transform.offsetY, remote.transform.offsetY || 0),
        finiteOr(transform.alpha, remote.transform.alpha || 0),
        transform.phase || message.phase || remote.transform.phase || "approach",
        message.mode || transform.mode || remote.transform.mode || "random"
      );
      if (!remote.displayTransform) {
        remote.displayTransform = {
          ...remote.transform,
          alpha: Math.min(remote.transform.alpha, 0.08)
        };
      }
      remote.seenAt = performance.now();
    }
  }

  function updateRemoteTransformFromSnapshot(remote, transform) {
    if (!transform) {
      return;
    }

    remote.transform = createRemoteTransform(
      finiteOr(transform.offsetX, remote.transform.offsetX || 0),
      finiteOr(transform.offsetY, remote.transform.offsetY || 0),
      finiteOr(transform.alpha, remote.transform.alpha || 0),
      transform.phase || remote.transform.phase,
      transform.mode || remote.transform.mode || "random"
    );

    if (!remote.displayTransform) {
      remote.displayTransform = {
        ...remote.transform,
        alpha: Math.min(remote.transform.alpha, 0.08)
      };
    }
  }

  function getRemoteUniverse(universeId) {
    if (!multiplayer.remoteUniverses.has(universeId)) {
      const initialTransform = createRemoteTransform(0, 0, 0, "approach");
      multiplayer.remoteUniverses.set(universeId, {
        universeId,
        playerId: "",
        publicName: "Unknown",
        overlapId: "",
        partySessionId: "",
        teamId: "",
        transform: initialTransform,
        displayTransform: { ...initialTransform },
        snapshot: null,
        displaySnapshot: null,
        snapshotFrames: [],
        effectCooldowns: new Map(),
        seenAt: performance.now()
      });
    }

    return multiplayer.remoteUniverses.get(universeId);
  }

  function applyRemoteSnapshot(message) {
    const universeId = message.universeId || (message.fromPlayerId ? "solo:" + message.fromPlayerId : "");
    if (!universeId || universeId === multiplayer.universeId) {
      return;
    }

    const remote = getRemoteUniverse(universeId);
    remote.playerId = message.fromPlayerId || remote.playerId;
    remote.publicName = message.publicName || remote.publicName;
    remote.overlapId = message.overlapId || remote.overlapId;
    updateRemoteTransformFromSnapshot(remote, message.transform);
    remote.snapshot = normalizeRemoteSnapshot(message.snapshot);
    remote.seenAt = performance.now();
    addRemoteSnapshotFrame(remote, remote.snapshot, remote.seenAt / 1000);
  }

  function normalizeRemoteSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    const world = source.world && typeof source.world === "object" ? source.world : {};
    return {
      player: normalizeRemotePlayerSnapshot(source.player),
      world: {
        particles: Array.isArray(world.particles) ? world.particles.map(normalizeParticleSnapshot).filter(Boolean) : [],
        alienoids: Array.isArray(world.alienoids) ? world.alienoids.map(normalizeRivalSnapshot).filter(Boolean) : [],
        ufos: Array.isArray(world.ufos) ? world.ufos.map(normalizeUfoSnapshot).filter(Boolean) : [],
        rambots: Array.isArray(world.rambots) ? world.rambots.map(normalizeRambotSnapshot).filter(Boolean) : [],
        engineers: Array.isArray(world.engineers) ? world.engineers.map(normalizeEngineerSnapshot).filter(Boolean) : [],
        teslas: Array.isArray(world.teslas) ? world.teslas.map(normalizeTeslaSnapshot).filter(Boolean) : [],
        rockets: Array.isArray(world.rockets) ? world.rockets.map(normalizeRocketSnapshot).filter(Boolean) : [],
        fighters: Array.isArray(world.fighters) ? world.fighters.map(normalizeFighterSnapshot).filter(Boolean) : [],
        mobBeacons: Array.isArray(world.mobBeacons) ? world.mobBeacons.map(normalizeMobBeaconSnapshot).filter(Boolean) : [],
        structures: Array.isArray(world.structures) ? world.structures.map(normalizeStructureSnapshot).filter(Boolean) : [],
        rivalProjectiles: Array.isArray(world.rivalProjectiles) ? world.rivalProjectiles.map(normalizeProjectileSnapshot).filter(Boolean) : [],
        techPickups: Array.isArray(world.techPickups) ? world.techPickups.map(normalizeTechPickupSnapshot).filter(Boolean) : [],
        healthPickups: Array.isArray(world.healthPickups) ? world.healthPickups.map(normalizeHealthPickupSnapshot).filter(Boolean) : []
      }
    };
  }

  function normalizeRemotePlayerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const maxHealth = clamp(finiteOr(snapshot.maxHealth, 100), 1, 100);
    const maxEnergy = clamp(finiteOr(snapshot.maxEnergy, playerBaseMaxEnergy), playerBaseMaxEnergy, playerMaxEnergyCap);
    const energy = clamp(finiteOr(snapshot.energy, maxEnergy), 0, maxEnergy);
    const equippedTool = toolCatalog.some((tool) => tool.id === snapshot.equippedTool) ? snapshot.equippedTool : null;
    const upgradeLevels = equippedTool && snapshot.toolUpgrades && snapshot.toolUpgrades[equippedTool] || {};
    const suckUpgrade = equippedTool && toolUpgradeById(equippedTool, "suck");
    const blowUpgrade = equippedTool && toolUpgradeById(equippedTool, "blow");
    const suckFactor = 1 + upgradeBonus(upgradeLevels.suck, suckUpgrade && suckUpgrade.bonusScale);
    const blowFactor = 1 + upgradeBonus(upgradeLevels.blow, blowUpgrade && blowUpgrade.bonusScale);
    const holdFactor = gadgetHoldBalanceFactor(suckFactor, blowFactor);
    const holdRangeFactor = Math.max(suckFactor, blowFactor);
    const statusEffects = normalizeRemotePlayerStatusEffects(snapshot.statusEffects, snapshot.toolDisabledTimer);
    const toolDisabledTimer = statusEffects.disabled;
    const toolMode = ["pull", "push", "hold", "fire", "release", "idle"].includes(snapshot.toolMode) ? snapshot.toolMode : "idle";
    const activeToolMode = equippedTool && actorCanAffordMultiplayerToolMode({ energy, toolDisabledTimer }, equippedTool, toolMode) ? toolMode : "idle";
    const camera = finiteOr(snapshot.cameraRoll, 0);
    const hasAimAngle = Number.isFinite(Number(snapshot.aimAngle));
    const hasAimLocalAngle = Number.isFinite(Number(snapshot.aimLocalAngle));
    const aimAngle = hasAimAngle ? finiteOr(snapshot.aimAngle, 0) : finiteOr(snapshot.aimLocalAngle, 0) - camera;
    const aimLocalAngle = hasAimLocalAngle ? finiteOr(snapshot.aimLocalAngle, 0) : null;
    const visualAimLocalAngle = hasAimLocalAngle ? aimLocalAngle : aimAngle + camera;
    return {
      id: typeof snapshot.id === "string" ? snapshot.id : "",
      name: typeof snapshot.name === "string" ? snapshot.name : "Player",
      teamId: String(snapshot.teamId || ""),
      skinId: normalizeCharacterSkinId(snapshot.skinId),
      trailId: normalizeTrailId(snapshot.trailId),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, 34),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      energy,
      maxEnergy,
      statusEffects,
      toolDisabledTimer,
      landed: normalizeLandingSnapshot(snapshot.landed),
      walkCycle: finiteOr(snapshot.walkCycle, snapshot.landed && snapshot.landed.walkCycle),
      cameraRoll: camera,
      hasCommunicationRelay: Boolean(snapshot.hasCommunicationRelay),
      aimAngle,
      aimLocalAngle,
      visualAimLocalAngle,
      equippedTool,
      holdFactor,
      holdRangeFactor,
      toolMode: activeToolMode,
      toolActive: Boolean(equippedTool && activeToolMode !== "idle" && (snapshot.toolActive || activeToolMode !== "idle")),
      moving: Boolean(snapshot.moving),
      boosting: snapshot.boosting === true ? true : snapshot.boosting === false ? false : null,
      jetpackMoveX: Number.isFinite(Number(snapshot.jetpackMoveX)) ? finiteOr(snapshot.jetpackMoveX, 0) : null,
      jetpackMoveY: Number.isFinite(Number(snapshot.jetpackMoveY)) ? finiteOr(snapshot.jetpackMoveY, -1) : null,
      crouching: Boolean(snapshot.crouching)
    };
  }

  function addRemoteSnapshotFrame(remote, snapshot, receivedAt) {
    if (!remote.snapshotFrames) {
      remote.snapshotFrames = [];
    }

    remote.snapshotFrames.push({ snapshot, receivedAt });
    remote.displaySnapshotDirty = true;
    while (remote.snapshotFrames.length > remoteSnapshotBufferLimit) {
      remote.snapshotFrames.shift();
    }

    if (!remote.displaySnapshot) {
      remote.displaySnapshot = snapshot;
    }
  }

  function buildRemoteDisplaySnapshot(remote, now) {
    const frames = remote.snapshotFrames || [];
    if (!frames.length) {
      return remote.snapshot;
    }

    const renderDelay = isMultiplayerV2Active() ? multiplayerV2RemoteSnapshotRenderDelay : remoteSnapshotRenderDelay;
    const extrapolateLimit = isMultiplayerV2Active() ? multiplayerV2RemoteSnapshotExtrapolateLimit : remoteSnapshotExtrapolateLimit;
    const renderAt = now - renderDelay;
    let previousFrame = null;
    let nextFrame = null;

    for (const frame of frames) {
      if (frame.receivedAt <= renderAt) {
        previousFrame = frame;
        continue;
      }

      nextFrame = frame;
      break;
    }

    if (!previousFrame) {
      return cloneRemoteSnapshot(nextFrame.snapshot);
    }

    if (!nextFrame) {
      const lead = clamp(renderAt - previousFrame.receivedAt, 0, extrapolateLimit);
      return interpolateRemoteSnapshot(previousFrame.snapshot, previousFrame.snapshot, 1, lead);
    }

    const interval = Math.max(0.001, nextFrame.receivedAt - previousFrame.receivedAt);
    const progress = clamp((renderAt - previousFrame.receivedAt) / interval, 0, 1);
    return interpolateRemoteSnapshot(previousFrame.snapshot, nextFrame.snapshot, progress, 0);
  }

  function cloneRemoteSnapshot(snapshot) {
    return interpolateRemoteSnapshot(snapshot, snapshot, 1, 0);
  }
