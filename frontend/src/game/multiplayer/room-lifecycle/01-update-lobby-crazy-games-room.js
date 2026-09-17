  function updateLobbyCrazyGamesRoom(reason) {
    if (!multiplayer.lobby) {
      return;
    }
    multiplayer.roomId = multiplayer.lobby.code || multiplayer.lobby.id;
    multiplayer.roomMode = "party-lobby";
    multiplayer.roomPlayerCount = lobbyPlayers().length;
    multiplayer.roomMaxPlayers = multiplayer.lobby.maxPlayers || crazyGamesRoomMaxPlayers;
    multiplayer.roomJoinable = multiplayer.lobby.status === "open" && multiplayer.roomPlayerCount < multiplayer.roomMaxPlayers;
    reportCrazyGamesRoom(reason || "lobby-state");
  }

  function activePartyJoinCode() {
    if (isSharedPublicWorldActive()) {
      return "";
    }
    if (multiplayer.partyJoinCode) {
      return multiplayer.partyJoinCode;
    }
    if (!multiplayer.partySession) {
      return "";
    }
    return sanitizeLobbyCode(multiplayer.partySession.joinCode || multiplayer.partySession.code || multiplayer.partySession.lobbyId);
  }

  function updateSettingsJoinCodeUi() {
    const code = activePartyJoinCode();
    if (settingsJoinCodeValue) {
      settingsJoinCodeValue.textContent = isSharedPublicWorldActive()
        ? (multiplayer.sharedTeamId ? "Team " + multiplayer.sharedTeamId.slice(-6).toUpperCase() : "Shared World")
        : code || "----";
    }
    if (copySettingsJoinCodeButton) {
      copySettingsJoinCodeButton.disabled = !code;
    }
  }

  function isPartySessionActive() {
    return Boolean(multiplayer.partySession && multiplayer.partySession.id);
  }

  function isSharedPublicWorldActive() {
    return Boolean(isPartySessionActive() && multiplayer.partySession.worldMode === "shared-public");
  }

  function isPartyHost() {
    return isPartySessionActive() && multiplayer.partyHostId === player.id;
  }

  function isSharedWorldFollower() {
    return isPartySessionActive() && !isPartyHost();
  }

  function leaveActiveSharedWorld(reason) {
    if (isSharedPublicWorldActive()) {
      sendMultiplayer({ type: "shared.world.leave", reason: reason || "client-reset" });
    }
  }

  function queryValue(name) {
    const href = String(window.location && window.location.href || "");
    const query = href.includes("?") ? href.slice(href.indexOf("?") + 1).split("#")[0] : "";
    if (!query) {
      return "";
    }
    for (const part of query.split("&")) {
      const pieces = part.split("=");
      const key = decodeURIComponent(pieces[0] || "").trim();
      if (key === name) {
        return decodeURIComponent(pieces.slice(1).join("=") || "");
      }
    }
    return "";
  }

  function queryFlagEnabled(name) {
    const value = queryValue(name).trim().toLowerCase();
    return value !== "" && value !== "0" && value !== "false" && value !== "off";
  }

  function joinedPlayerComponentListConfig(value) {
    return String(value || "").split(",").reduce(function (config, entry) {
      const key = entry.trim();
      if (Object.prototype.hasOwnProperty.call(joinedPlayerIsolationComponentDefaults, key)) {
        config[key] = true;
      }
      return config;
    }, {});
  }

  function configureJoinedPlayerIsolation(options) {
    const source = options && typeof options === "object" ? options : {};
    if (Object.prototype.hasOwnProperty.call(source, "enabled")) {
      joinedPlayerIsolation.enabled = source.enabled === true || source.enabled === "1" || source.enabled === "true";
    }
    const components = source.components && typeof source.components === "object" ? source.components : source;
    for (const key of Object.keys(joinedPlayerIsolationComponentDefaults)) {
      if (Object.prototype.hasOwnProperty.call(components, key)) {
        joinedPlayerIsolation.components[key] = components[key] === true || components[key] === "1" || components[key] === "true";
      }
    }
    return {
      enabled: joinedPlayerIsolation.enabled,
      components: { ...joinedPlayerIsolation.components }
    };
  }

  function initializeJoinedPlayerIsolation() {
    const windowConfig = window.CLUSTERNAUTS_JOINED_PLAYER_ISOLATION;
    const windowComponents = window.CLUSTERNAUTS_JOINED_PLAYER_COMPONENTS;
    if (windowConfig && typeof windowConfig === "object") {
      configureJoinedPlayerIsolation(windowConfig);
    } else if (windowConfig !== undefined) {
      configureJoinedPlayerIsolation({ enabled: windowConfig });
    }
    if (windowComponents && typeof windowComponents === "object") {
      configureJoinedPlayerIsolation({ components: windowComponents });
    }
    if (clusternautsTestConfig && clusternautsTestConfig.joinedPlayerIsolation) {
      configureJoinedPlayerIsolation(clusternautsTestConfig.joinedPlayerIsolation);
    }
    if (queryFlagEnabled("joinedPlayerIsolation")) {
      configureJoinedPlayerIsolation({ enabled: true });
    }
    const queryComponents = queryValue("joinedPlayerComponents");
    if (queryComponents) {
      configureJoinedPlayerIsolation({ components: joinedPlayerComponentListConfig(queryComponents) });
    }
    try {
      const stored = window.localStorage.getItem(joinedPlayerIsolationStorageKey);
      if (stored === "1" || stored === "true") {
        configureJoinedPlayerIsolation({ enabled: true });
      } else if (stored === "0" || stored === "false") {
        configureJoinedPlayerIsolation({ enabled: false });
      }
      const storedComponents = window.localStorage.getItem(joinedPlayerIsolationComponentsStorageKey);
      if (storedComponents) {
        try {
          configureJoinedPlayerIsolation({ components: JSON.parse(storedComponents) });
        } catch {
          configureJoinedPlayerIsolation({ components: joinedPlayerComponentListConfig(storedComponents) });
        }
      }
    } catch {
      // Ignore storage failures; URL/window/test flags still work.
    }
  }

  function isJoinedPlayerIsolationActive() {
    return Boolean(joinedPlayerIsolation.enabled && isSharedWorldFollower() && !isMultiplayerV2Active());
  }

  function joinedPlayerIsolationAllows(component) {
    if (!isJoinedPlayerIsolationActive()) {
      return true;
    }
    return joinedPlayerIsolation.components[component] === true;
  }

  initializeJoinedPlayerIsolation();

  function isPartyV2Session(session) {
    return Boolean(session && Number(session.netcodeVersion || 1) >= 2);
  }

  function isMultiplayerV2Active() {
    return Boolean(multiplayer.v2.active && multiplayer.v2.roomId && mpV2Sim);
  }

  function requestLandingToggle() {
    if (isMultiplayerV2Active()) {
      multiplayer.v2.landRequested = player.landed ? "takeoff" : "land";
      return true;
    }
    toggleLanding();
    return true;
  }

  function resetMultiplayerV2State() {
    multiplayer.v2.active = false;
    multiplayer.v2.roomId = "";
    multiplayer.v2.state = null;
    multiplayer.v2.authoritativeState = null;
    multiplayer.v2.inputSeq = 0;
    multiplayer.v2.clientTick = 0;
    multiplayer.v2.fixedAccumulator = 0;
    multiplayer.v2.sendAccumulator = 0;
    multiplayer.v2.lastSentInput = null;
    multiplayer.v2.pendingInputs = [];
    multiplayer.v2.pendingSnapshot = null;
    multiplayer.v2.landRequested = "";
    multiplayer.v2.familiarNetFireHeld = false;
    multiplayer.v2.familiarNetReleaseHeld = false;
    multiplayer.v2.lastServerTick = 0;
    multiplayer.v2.lastAckInputSeq = 0;
    multiplayer.v2.ignoreDeathEventsBeforeTick = 0;
    multiplayer.v2.respawnAckPending = false;
    multiplayer.v2.respawnRequestedAt = 0;
    multiplayer.v2.respawnRequestTick = 0;
    multiplayer.v2.visualBlend = null;
    multiplayer.v2.pendingMergeVisuals = [];
    multiplayer.v2.eventKeys = new Map();
    updateMultiplayerV2Perf({
      clientStepMs: 0,
      reconcileMs: 0,
      syncMs: 0,
      pendingInputs: 0,
      replayInputs: 0,
      droppedReplayInputs: 0,
      queuedSnapshots: 0,
      droppedSnapshots: 0,
      skippedSnapshots: 0,
      pendingSnapshotEvents: 0,
      ackMissing: 0,
      entityCount: 0
    });
  }

  function resetSoloMultiplayerSession() {
    leaveActiveSharedWorld("reset-session");
    resetMultiplayerV2State();
    multiplayer.partySession = null;
    multiplayer.partyJoinCode = "";
    multiplayer.partyMode = "solo";
    multiplayer.partyHostId = "";
    multiplayer.partyHostUniverseId = "";
    multiplayer.partyPlayerSnapshots.clear();
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.partyInputSeqByPlayer.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPhysicsSeq = 0;
    multiplayer.partyInputTimer = 0;
    multiplayer.partyInputSeq = 0;
    multiplayer.partyLastInputSnapshot = null;
    multiplayer.partySnapshotTimer = 0;
    multiplayer.partyRespawnInvulnerableTimer = 0;
    multiplayer.duels.clear();
    multiplayer.anomaly = null;
    multiplayer.lobby = null;
    multiplayer.lobbyInviteLink = "";
    multiplayer.lobbyLoadedSnapshot = null;
    multiplayer.lobbyLoadedSaveName = "";
    multiplayer.lobbyGameMode = "horde";
    multiplayer.sharedWorldJoinPending = false;
    multiplayer.sharedTeamId = "";
    multiplayer.sharedTeamMemberIds.clear();
    clearCurrentAccountSave();
    updateSettingsJoinCodeUi();
    updateOnlineUi();
  }

  function multiplayerV2EventKey(event) {
    if (!event || typeof event !== "object") {
      return "";
    }
    return [
      Math.max(0, Math.floor(finiteOr(event.tick, 0))),
      String(event.type || ""),
      String(event.kind || ""),
      String(event.mobId || ""),
      String(event.playerId || ""),
      String(event.projectileId || ""),
      String(event.pickupId || ""),
      String(event.keptId || ""),
      String(event.removedId || ""),
      String(event.cause || "")
    ].join(":");
  }

  function processMultiplayerV2BodyMergeEvent(event) {
    const mass = Math.max(1, finiteOr(event && event.mass, 1));
    const tier = event && event.tier && typeof event.tier === "object"
      ? event.tier
      : tierForMassAndStellarOutcome(mass, event && event.stellarOutcome);
    const previousTier = event && event.previousTier && typeof event.previousTier === "object"
      ? event.previousTier
      : tier;
    const graduated = event && Object.prototype.hasOwnProperty.call(event, "graduated")
      ? Boolean(event.graduated)
      : tier.threshold > previousTier.threshold;

    playSound(graduated ? "milestone" : "merge", {
      throttleKey: "mpV2BodyMerge",
      throttle: 0.09,
      volume: clamp(0.45 + Math.log2(mass) * 0.08, 0.45, 1.1)
    });
    queueMultiplayerV2BodyMergeVisual(event, mass);
    if (tier.name === "star" && (event.becameStar || previousTier.name !== "star")) {
      emitStarFormationBurst({
        x: finiteOr(event && event.x, player.x),
        y: finiteOr(event && event.y, player.y),
        radius: Math.max(1, finiteOr(event && event.radius, radiusFromMass(mass))),
        color: normalizeColorSnapshot(event && event.color, { r: 255, g: 188, b: 82 })
      }, Math.max(0, Math.floor(finiteOr(event && event.destroyedStructures, 0))));
      maybeNotifyText(
        finiteOr(event && event.destroyedStructures, 0) > 0
          ? "Planet collapsed into a star. Structures burned away."
          : "Planet collapsed into a star.",
        { groupKey: "star-formed" }
      );
    } else if (stellarOutcomeTierNames.includes(tier.name) && !stellarOutcomeTierNames.includes(previousTier.name)) {
      maybeNotifyText("Star collapsed into " + tier.article + " " + tier.name + ".", { groupKey: "stellar-branch-formed" });
    }
    recordObjectiveCreatedBodyMass(mass);
    maybeNotifyTier(tier, previousTier);
  }

  function multiplayerV2ParticleSnapshotById(world, id) {
    const bodyId = Math.max(0, Math.floor(finiteOr(id, 0)));
    if (!bodyId || !world || !Array.isArray(world.particles)) {
      return null;
    }
    return world.particles.find((body) => body && body.id === bodyId) || null;
  }

  function pushMultiplayerV2EventSpark(event, options) {
    const source = event && typeof event === "object" ? event : {};
    const fallback = options && options.fallbackColor ? options.fallbackColor : { r: 114, g: 244, b: 255 };
    sparks.push({
      x: finiteOr(source.x, player.x),
      y: finiteOr(source.y, player.y),
      radius: Math.max(1, finiteOr(options && options.radius, 38)),
      color: normalizeColorSnapshot(source.color, fallback),
      life: Math.max(0.05, finiteOr(options && options.life, 0.26)),
      maxLife: Math.max(0.05, finiteOr(options && options.maxLife, options && options.life ? options.life : 0.26)),
      empPulse: Boolean(options && options.empPulse)
    });
  }

  function queueMultiplayerV2BodyMergeVisual(event, mass) {
    const keptId = Math.max(0, Math.floor(finiteOr(event && event.keptId, 0)));
    const removedId = Math.max(0, Math.floor(finiteOr(event && event.removedId, 0)));
    const predictedWorld = multiplayer.v2.state && multiplayer.v2.state.world;
    const authoritativeWorld = multiplayer.v2.authoritativeState && multiplayer.v2.authoritativeState.world;
    const keptBody =
      bodyById(keptId) ||
      multiplayerV2ParticleSnapshotById(predictedWorld, keptId) ||
      multiplayerV2ParticleSnapshotById(authoritativeWorld, keptId);
    const removedBody =
      bodyById(removedId) ||
      multiplayerV2ParticleSnapshotById(predictedWorld, removedId) ||
      multiplayerV2ParticleSnapshotById(authoritativeWorld, removedId);
    const fallbackColor = normalizeColorSnapshot(
      (keptBody && keptBody.color) || (event && event.color),
      randomParticleColor()
    );
    const mergeX = finiteOr(event && event.x, keptBody ? keptBody.x : player.x);
    const mergeY = finiteOr(event && event.y, keptBody ? keptBody.y : player.y);
    const absorbedX = finiteOr(event && event.absorbedX, removedBody ? removedBody.x : mergeX);
    const absorbedY = finiteOr(event && event.absorbedY, removedBody ? removedBody.y : mergeY);
    const mergedRadius = Math.max(1, finiteOr(event && event.radius, keptBody ? keptBody.radius : radiusFromMass(mass)));
    const absorbedRadius = Math.max(1, finiteOr(event && event.absorbedRadius, removedBody ? removedBody.radius : 1));
    const color = normalizeColorSnapshot(
      (event && event.absorbedColor) || (removedBody && removedBody.color) || (event && event.color),
      fallbackColor
    );
    if (event && event.graduated && keptBody) {
      const promotionColor = shadeColor(normalizeColorSnapshot(event.color, fallbackColor), 88);
      keptBody.promotionStartedAt = performance.now();
      keptBody.promotionDuration = bodyPromotionEffectDuration;
      keptBody.promotionColor = promotionColor;
      keptBody.promotedFromTier = String(event.promotedFromTier || (event.previousTier && event.previousTier.name) || "");
      keptBody.promotedToTier = String(event.promotedToTier || (event.tier && event.tier.name) || "");
      sparks.push({
        keptId,
        x: mergeX,
        y: mergeY,
        radius: Math.max(mergedRadius * 2.65, 58),
        color: promotionColor,
        life: bodyPromotionEffectDuration,
        maxLife: bodyPromotionEffectDuration,
        promotionBurst: true
      });
    }
    const visual = {
      keptId,
      x: absorbedX,
      y: absorbedY,
      radius: Math.max(42, Math.min(150, Math.max(mergedRadius * 1.8, absorbedRadius * 4.2))),
      color,
      life: 0.46,
      maxLife: 0.46
    };
    sparks.push(visual);

    const mergeDistance = Math.hypot(mergeX - absorbedX, mergeY - absorbedY);
    if (mergeDistance > visual.radius * 0.45) {
      sparks.push({
        x: mergeX,
        y: mergeY,
        radius: Math.max(32, visual.radius * 0.62),
        color,
        life: 0.34,
        maxLife: 0.34
      });
    }
  }

  function flushMultiplayerV2MergeVisuals() {
    const visuals = multiplayer.v2.pendingMergeVisuals;
    if (!Array.isArray(visuals) || !visuals.length) {
      return;
    }
    for (const visual of visuals) {
      const body = bodyById(visual.keptId);
      sparks.push({
        x: finiteOr(visual.x, body ? body.x : player.x),
        y: finiteOr(visual.y, body ? body.y : player.y),
        radius: Math.max(1, finiteOr(visual.radius, body ? body.radius * 1.8 : 28)),
        color: normalizeColorSnapshot(visual.color, body && body.color ? body.color : randomParticleColor()),
        life: Math.max(0.05, finiteOr(visual.life, 0.42)),
        maxLife: Math.max(0.05, finiteOr(visual.maxLife, 0.42))
      });
    }
    visuals.length = 0;
  }

  function scoreMultiplayerV2MobDefeat(event) {
    if (event && event.isBeacon) {
      return;
    }
    const kind = String(event && event.kind || "alienoid");
    const representedCount = Math.max(1, Math.floor(finiteOr(event && event.representedCount, 1)));
    lifeStats.mobsDefeated += representedCount;
    lifeStats.mobScore += scoreMobKill(kind) * representedCount;
    if (mobDefeatsByKind[kind] !== undefined) {
      mobDefeatsByKind[kind] += representedCount;
    }
    if (event && event.isBoss && mobBossDefeatsByKind[kind] !== undefined) {
      mobBossDefeatsByKind[kind] += 1;
      if (mobBossProgressByKind[kind] !== undefined) {
        mobBossProgressByKind[kind] = 0;
      }
    } else if (mobBossProgressByKind[kind] !== undefined) {
      mobBossProgressByKind[kind] = Math.min(
        mobBossDefeatsToUnlock,
        Math.max(0, Math.floor(finiteOr(mobBossProgressByKind[kind], 0))) + representedCount
      );
    }
  }

  function multiplayerV2DeathCause(event) {
    const cause = String(event && event.cause || "");
    if (cause === "body-impact") {
      return "Crushing impact";
    }
    if (cause === "mob-contact") {
      return "Hostile contact";
    }
    if (cause === "projectile") {
      return "Contact fire";
    }
    return "Hull failure";
  }

  function markMultiplayerV2EventSeen(event) {
    const key = multiplayerV2EventKey(event);
    if (!key) {
      return false;
    }
    if (!multiplayer.v2.eventKeys || typeof multiplayer.v2.eventKeys.has !== "function") {
      multiplayer.v2.eventKeys = new Map();
    }
    const now = performance.now();
    for (const [eventKey, seenAt] of multiplayer.v2.eventKeys.entries()) {
      if (now - seenAt > 3500) {
        multiplayer.v2.eventKeys.delete(eventKey);
      }
    }
    if (multiplayer.v2.eventKeys.has(key)) {
      return false;
    }
    multiplayer.v2.eventKeys.set(key, now);
    return true;
  }
