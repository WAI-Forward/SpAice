  function processMultiplayerV2Events(events, options) {
    if (!Array.isArray(events)) {
      return;
    }
    const authoritative = Boolean(options && options.authoritative);
    for (const event of events) {
      if (event && event.type === "mob.defeated" && !authoritative) {
        continue;
      }
      if (!markMultiplayerV2EventSeen(event)) {
        continue;
      }
      if (event.type === "mob.hit") {
        playSound("mobHit", { throttleKey: "mpV2MobHit", throttle: 0.04 });
        pushMultiplayerV2EventSpark(event, { radius: 38, life: 0.24, fallbackColor: { r: 255, g: 236, b: 194 } });
      } else if (event.type === "mob.shielded") {
        pushMultiplayerV2EventSpark(event, { radius: 48, life: 0.28, fallbackColor: { r: 119, g: 167, b: 255 } });
      } else if (event.type === "mob.defeated") {
        scoreMultiplayerV2MobDefeat(event);
        playSound("mobDestroyed", { throttleKey: "mpV2MobDestroyed", throttle: 0.08 });
        pushMultiplayerV2EventSpark(event, { radius: 64, life: 0.36, fallbackColor: { r: 255, g: 236, b: 194 } });
      } else if (event.type === "mob.beacon.destroyed") {
        playSound("mobDestroyed", { throttleKey: "mpV2MobBeaconDestroyed", throttle: 0.08 });
        pushMultiplayerV2EventSpark(event, { radius: 78, life: 0.42, fallbackColor: { r: 255, g: 236, b: 194 } });
        notifyMobBeaconSuspended(String(event.kind || "alienoid"), finiteOr(event.suspendedSeconds, mobBeaconRespawnDuration));
      } else if (event.type === "mob.boss.warning") {
        const kind = String(event.kind || "alienoid");
        const seconds = Math.max(0, Math.ceil(finiteOr(event.seconds, 0)));
        updateGroupedNotificationText("mob-boss-warning:" + kind, mobBossLabel(kind) + " inbound in " + seconds + "s.", { lifetime: 1500 });
      } else if (event.type === "mob.boss.spawned") {
        maybeNotifyText(mobBossLabel(String(event.kind || "alienoid")) + " has arrived.", {
          groupKey: "mob-boss-arrival:" + String(event.kind || "alienoid"),
          lifetime: 4200
        });
        pushMultiplayerV2EventSpark(event, { radius: 92, life: 0.5, fallbackColor: { r: 255, g: 236, b: 194 } });
      } else if (event.type === "randomEvent.started") {
        const eventId = String(event.id || "");
        const title = String(event.title || (eventId === particleStormEventId ? "Particle storm" : eventId === meteorShowerEventId ? "Meteor shower" : eventId === rogueTraderEventId ? "Rogue Trader" : "Event"));
        maybeNotifyText(title + (eventId === particleStormEventId || eventId === meteorShowerEventId ? " detected." : " signal detected."), {
          groupKey: "random-event-" + eventId
        });
      } else if (event.type === "randomEvent.finished") {
        const eventId = String(event.id || "");
        const title = String(event.title || (eventId === particleStormEventId ? "Particle storm" : eventId === meteorShowerEventId ? "Meteor shower" : eventId === rogueTraderEventId ? "Rogue Trader" : "Event"));
        maybeNotifyText(title + (eventId === particleStormEventId || eventId === meteorShowerEventId ? " clearing." : " leaving local space."), {
          groupKey: "random-event-" + eventId
        });
      } else if (event.type === "player.shot") {
        playSound("laser", { throttleKey: "mpV2PlayerShot:" + String(event.projectileId || ""), throttle: 0.02 });
      } else if (event.type === "emp.pulse") {
        playSound("lightning", { throttleKey: "mpV2EmpPulse", throttle: 0.16, volume: 0.82 });
        pushMultiplayerV2EventSpark(event, { radius: finiteOr(event.radius, empPulseRange), life: 0.72, fallbackColor: { r: 126, g: 232, b: 255 }, empPulse: true });
      } else if (event.type === "familiarNet.swung") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(-1);
          playSound("mobHit", { throttleKey: "mpV2FamiliarNetMiss", throttle: 0.22, volume: 0.42 });
        }
      } else if (event.type === "familiarNet.full") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(-1);
          playSound("mobHit", { throttleKey: "mpV2FamiliarNetFull", throttle: 0.22, volume: 0.34 });
          maybeNotifyText("The familiar net is already holding one mob.");
        }
      } else if (event.type === "familiarNet.active") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(event.action === "release" ? 1 : -1);
          playSound("mobHit", { throttleKey: "mpV2FamiliarNetActive", throttle: 0.22, volume: 0.34 });
          maybeNotifyText("Your familiar is already out.");
        }
      } else if (event.type === "familiarNet.empty") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(1);
          playSound("mobHit", { throttleKey: "mpV2FamiliarNetEmpty", throttle: 0.22, volume: 0.28 });
        }
      } else if (event.type === "familiarNet.command") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(1);
          playSound("pickupTech", { throttleKey: "mpV2FamiliarNetCommand", throttle: 0.16, volume: 0.55 });
        }
        pushMultiplayerV2EventSpark(event, { radius: 42, life: 0.24, fallbackColor: { r: 102, g: 224, b: 184 } });
      } else if (event.type === "familiarNet.caught") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(-1);
          playSound("pickupTech", { throttleKey: "mpV2FamiliarNetCatch", throttle: 0.18 });
          maybeNotifyText("Caught " + mobName({ kind: event.kind }).toLowerCase() + " in the familiar net.");
        }
        pushMultiplayerV2EventSpark(event, { radius: 54, life: 0.32, fallbackColor: { r: 102, g: 224, b: 184 } });
      } else if (event.type === "familiarNet.released") {
        if (String(event.playerId || "") === player.id) {
          startFamiliarNetSwing(1);
          playSound("pickupHealth", { throttleKey: "mpV2FamiliarNetRelease", throttle: 0.18 });
          maybeNotifyText("Released familiar " + mobName({ kind: event.kind }).toLowerCase() + ".");
        }
        pushMultiplayerV2EventSpark(event, { radius: 82, life: 0.36, fallbackColor: { r: 102, g: 224, b: 184 } });
      } else if (event.type === "projectile.blocked") {
        pushMultiplayerV2EventSpark(event, { radius: 34, life: 0.22, fallbackColor: { r: 255, g: 115, b: 173 } });
      } else if (event.type === "structure.shieldBlockedProjectile") {
        pushMultiplayerV2EventSpark(event, { radius: 58, life: 0.28, fallbackColor: { r: 119, g: 167, b: 255 } });
      } else if (event.type === "player.hitByPlayerProjectile") {
        playSound("mobHit", { throttleKey: "mpV2PlayerProjectileHit", throttle: 0.06 });
        pushMultiplayerV2EventSpark(event, { radius: 42, life: 0.28, fallbackColor: { r: 255, g: 115, b: 173 } });
      } else if (event.type === "player.hitByMobProjectile" && String(event.playerId || "") === player.id) {
        playSound("hit", { throttleKey: "mpV2PlayerProjectileHit", throttle: 0.06 });
        pushMultiplayerV2EventSpark(event, { radius: 44, life: 0.34, fallbackColor: { r: 114, g: 244, b: 255 } });
      } else if (event.type === "player.hitByStar") {
        if (String(event.playerId || "") === player.id) {
          playSound("hit", { throttleKey: "mpV2StarContact", throttle: 0.25 });
          maybeNotifyText("Star plasma is burning your hull.", { groupKey: "star-contact" });
        }
        pushMultiplayerV2EventSpark(event, { radius: 58, life: 0.34, fallbackColor: { r: 255, g: 196, b: 76 } });
      } else if (event.type === "body.merged") {
        processMultiplayerV2BodyMergeEvent(event);
      } else if (event.type === "pickup.tech") {
        pushMultiplayerV2EventSpark(event, { radius: 42, life: 0.28, fallbackColor: hslToRgb(330, 0.88, 0.64) });
        if (String(event.playerId || "") === player.id) {
          playSound("pickupTech", { throttleKey: "mpV2PickupTech", throttle: 0.05 });
        }
      } else if (event.type === "pickup.health") {
        pushMultiplayerV2EventSpark(event, { radius: 46, life: 0.26, fallbackColor: { r: 101, g: 245, b: 154 } });
        if (String(event.playerId || "") === player.id) {
          playSound("pickupHealth", { throttleKey: "mpV2PickupHealth", throttle: 0.08 });
        }
      } else if (event.type === "player.died" && String(event.playerId || "") === player.id) {
        if (Math.floor(finiteOr(event.tick, 0)) <= Math.floor(finiteOr(multiplayer.v2.ignoreDeathEventsBeforeTick, 0))) {
          continue;
        }
        beginPlayerDeath(multiplayerV2DeathCause(event));
      }
    }
  }

  function partyV2StartState(message) {
    const snapshot = message && message.snapshot && typeof message.snapshot === "object" ? message.snapshot : null;
    if (snapshot && snapshot.v2 && snapshot.state) {
      return mpV2Sim.serializeState(snapshot.state);
    }
    const sessionPlayers = message && message.session && Array.isArray(message.session.players) ? message.session.players : lobbyPlayers();
    return mpV2Sim.createInitialState(snapshot || buildPersistentPayload(true), sessionPlayers, {
      seed: message && (message.sessionId || message.id || message.roomId || "client-v2"),
      maxPlayers: message && message.session ? message.session.maxPlayers : undefined
    });
  }

  function startMultiplayerV2(message) {
    if (!mpV2Sim) {
      maybeNotifyText("Multiplayer V2 unavailable.");
      return false;
    }
    const session = message && message.session && typeof message.session === "object" ? message.session : multiplayer.partySession;
    const roomId = String(session && (session.sessionId || session.id) || message && message.roomId || "");
    if (!roomId) {
      return false;
    }
    resetMultiplayerV2State();
    multiplayer.v2.active = true;
    multiplayer.v2.roomId = roomId;
    multiplayer.v2.state = partyV2StartState(message || {});
    multiplayer.v2.authoritativeState = mpV2Sim.serializeState(multiplayer.v2.state);
    multiplayer.v2.lastServerTick = multiplayer.v2.state.tick || 0;
    multiplayer.v2.lastAckInputSeq = 0;
    multiplayer.v2.pendingInputs = [];
    multiplayer.partyPhysicsSessions.clear();
    multiplayer.localPartyPhysicsSessions.clear();
    multiplayer.partyPlayerSnapshots.clear();
    syncMultiplayerV2StateToGame({ snapLocal: true });
    return true;
  }

  function buildMultiplayerV2Input(seq) {
    if (!isContinuousPlayerEnergyInputPressed()) {
      playerContinuousEnergyLocked = false;
    }
    const toolMode = multiplayerLocalToolModeForInput();
    if (toolMode === "fire" && isPistonPunchTool(equippedToolId)) {
      gadgetAngle = getCursorAimAngle();
    }
    const aim = getAim();
    const landAction = multiplayer.v2.landRequested === "takeoff" ? "takeoff" : multiplayer.v2.landRequested === "land" ? "land" : "";
    const familiarCommand = equippedToolId === familiarNetToolId && toolMode === "release"
      ? screenToWorld(mouse.x, mouse.y)
      : null;
    multiplayer.v2.landRequested = "";
    return {
      playerId: player.id,
      roomId: multiplayer.v2.roomId,
      seq,
      clientTick: multiplayer.v2.clientTick,
      aimAngle: Math.atan2(aim.world.y, aim.world.x),
      aimLocalAngle: aim.angle,
      equippedTool: equippedToolId || defaultToolId,
      toolMode,
      familiarCommand: familiarCommand ? { x: familiarCommand.x, y: familiarCommand.y } : null,
      buttons: {
        up: isMovementKeyPressed("up"),
        down: isMovementKeyPressed("down"),
        left: isMovementKeyPressed("left"),
        right: isMovementKeyPressed("right"),
        land: Boolean(landAction),
        landAction,
        boost: canSendMultiplayerBoostInput(),
        pull: toolMode === "pull",
        push: toolMode === "push",
        hold: toolMode === "hold",
        fire: toolMode === "fire",
        release: toolMode === "release",
        dismantle: toolMode === "dismantle"
      }
    };
  }

  function multiplayerV2FrameDt(dt) {
    return Math.min(multiplayerV2MaxFrameDt, Math.max(0, finiteOr(dt, 0)));
  }

  function multiplayerV2DuelPairsForPrediction() {
    const pairs = [];
    for (const peerId of multiplayer.duels || []) {
      const ids = [player.id, String(peerId || "")].filter(Boolean).sort();
      if (ids.length === 2 && ids[0] !== ids[1]) {
        pairs.push(ids.join("|"));
      }
    }
    return pairs;
  }

  function multiplayerV2SimOptions(patch) {
    const sharedPublic = isSharedPublicWorldActive();
    return {
      enableMobs: true,
      emitMobDamageParticles: false,
      duels: sharedPublic ? [] : multiplayerV2DuelPairsForPrediction(),
      pvpMode: sharedPublic ? "shared-public" : String(multiplayer.partySession && multiplayer.partySession.pvpMode || "party"),
      worldMode: sharedPublic ? "shared-public" : String(multiplayer.partySession && multiplayer.partySession.worldMode || "party"),
      gameMode: normalizeGameMode(multiplayer.partySession && multiplayer.partySession.gameMode || runState.gameMode),
      ...(patch || {})
    };
  }

  function frameRateIndependentBlend(perFrameBlend, dt) {
    const blend = clamp(finiteOr(perFrameBlend, 0), 0, 1);
    if (blend >= 1) {
      return 1;
    }
    const frames = Math.max(0, finiteOr(dt, 1 / 60)) * 60;
    return clamp(1 - Math.pow(1 - blend, frames), 0, 1);
  }

  function sendMultiplayerV2Input(input) {
    if (!input || !isMultiplayerV2Active()) {
      return false;
    }
    return sendMultiplayer({
      type: "mp.v2.input",
      roomId: multiplayer.v2.roomId,
      seq: input.seq,
      clientTick: input.clientTick,
      aimAngle: input.aimAngle,
      aimLocalAngle: input.aimLocalAngle,
      equippedTool: input.equippedTool,
      toolMode: input.toolMode,
      familiarCommand: input.familiarCommand || null,
      buttons: input.buttons
    });
  }

  function multiplayerV2ButtonChanged(previous, next) {
    const before = previous && previous.buttons || {};
    const after = next && next.buttons || {};
    for (const key of ["up", "down", "left", "right", "land", "boost", "pull", "push", "hold", "fire", "release", "dismantle"]) {
      if (Boolean(before[key]) !== Boolean(after[key])) {
        return true;
      }
    }
    return false;
  }

  function shouldSendMultiplayerV2Input(input) {
    if (!input) {
      return false;
    }
    const previous = multiplayer.v2.lastSentInput;
    if (!previous) {
      return true;
    }
    if (input.buttons && input.buttons.land) {
      return true;
    }
    if (input.familiarCommand) {
      return true;
    }
    if (input.equippedTool !== previous.equippedTool || input.toolMode !== previous.toolMode) {
      return true;
    }
    if (multiplayerV2ButtonChanged(previous, input)) {
      return true;
    }
    return Math.max(0, Math.floor(finiteOr(input.clientTick, 0))) % 2 === 0;
  }

  function applyLocalMultiplayerV2BuildAction(action) {
    if (!mpV2Sim || !isMultiplayerV2Active() || !multiplayer.v2.state || !action || typeof action !== "object") {
      return false;
    }

    let changed = false;
    if (action.action === "craftTool") {
      changed = mpV2Sim.craftTool(multiplayer.v2.state, player.id, action.recipeId);
    } else if (action.action === "upgradeTool") {
      changed = mpV2Sim.upgradeTool(multiplayer.v2.state, player.id, action.toolId, action.upgradeId);
    } else if (action.action === "setEquippedTools") {
      changed = mpV2Sim.setEquippedTools(multiplayer.v2.state, player.id, action.equippedTool, action.equippedTools);
    } else if (action.action === "placeStructure") {
      changed = mpV2Sim.placeStructure(multiplayer.v2.state, player.id, action.recipeId, action.placement, action.linkedPlacement);
    } else if (action.action === "transferContainerTech") {
      changed = mpV2Sim.transferContainerTech(
        multiplayer.v2.state,
        player.id,
        action.structureId,
        action.techKey,
        action.mode,
        action.amount
      );
    } else if (action.action === "transferStructureTech") {
      changed = mpV2Sim.transferStructureTech(
        multiplayer.v2.state,
        player.id,
        action.structureId,
        action.techKey,
        action.mode,
        action.amount
      );
    } else if (action.action === "setTradingPortOffer") {
      changed = mpV2Sim.setTradingPortOffer(
        multiplayer.v2.state,
        player.id,
        action.structureId,
        action.offer
      );
    } else if (action.action === "removeTradingPortOffer") {
      changed = mpV2Sim.removeTradingPortOffer(
        multiplayer.v2.state,
        player.id,
        action.structureId,
        action.offerId
      );
    } else if (action.action === "acceptTradingPortOffer") {
      changed = mpV2Sim.acceptTradingPortOffer(
        multiplayer.v2.state,
        player.id,
        action.structureId,
        action.offerId
      );
    } else if (action.action === "statusEffect") {
      changed = mpV2Sim.applyPlayerStatusEffect(multiplayer.v2.state.players[player.id], String(action.status || ""), finiteOr(action.duration, 0));
    }

    if (changed) {
      syncMultiplayerV2StateToGame({ snapLocal: true });
    }
    return changed;
  }

  function sendMultiplayerV2BuildAction(action) {
    if (!isMultiplayerV2Active() || !action || typeof action !== "object") {
      return false;
    }

    const sent = sendMultiplayer({
      type: "mp.v2.action",
      roomId: multiplayer.v2.roomId,
      ...action
    });
    if (sent) {
      applyLocalMultiplayerV2BuildAction(action);
    }
    return sent;
  }

  function multiplayerV2WorldEntityCount(world) {
    const source = world && typeof world === "object" ? world : {};
    return [
      "particles",
      "techPickups",
      "healthPickups",
      "alienoids",
      "ufos",
      "rambots",
      "engineers",
      "teslas",
      "rockets",
      "fighters",
      "mobBeacons",
      "rivalProjectiles",
      "structures"
    ].reduce((total, key) => total + (Array.isArray(source[key]) ? source[key].length : 0), 0);
  }

  function updateMultiplayerV2Perf(patch) {
    if (!multiplayer.v2.perf) {
      multiplayer.v2.perf = {};
    }
    Object.assign(multiplayer.v2.perf, patch || {});
    if (typeof window !== "undefined") {
      window.__clusternautsMultiplayerPerf = {
        ...(window.__clusternautsMultiplayerPerf || {}),
        v2: { ...multiplayer.v2.perf }
      };
    }
  }

  function multiplayerV2SnapshotTick(message) {
    const state = message && message.state && typeof message.state === "object" ? message.state : null;
    return Math.max(0, Math.floor(finiteOr(message && message.serverTick, state ? state.tick : 0)));
  }

  function multiplayerV2LocalAckFromSnapshot(message) {
    const ackSeq = message && message.ackInputSeq && typeof message.ackInputSeq === "object"
      ? message.ackInputSeq
      : null;
    if (!ackSeq) {
      return {
        value: multiplayer.v2.lastAckInputSeq,
        missing: false
      };
    }
    if (!Object.prototype.hasOwnProperty.call(ackSeq, player.id)) {
      return {
        value: multiplayer.v2.lastAckInputSeq,
        missing: true
      };
    }
    return {
      value: Math.max(0, Math.floor(finiteOr(ackSeq[player.id], multiplayer.v2.lastAckInputSeq))),
      missing: false
    };
  }

  function multiplayerV2LocalPlayerFromState(state) {
    const players = state && state.players && typeof state.players === "object" ? state.players : null;
    if (!players || !player.id) {
      return null;
    }
    return players[player.id] || null;
  }

  function clearMultiplayerV2RespawnAckPending() {
    multiplayer.v2.respawnAckPending = false;
    multiplayer.v2.respawnRequestedAt = 0;
    multiplayer.v2.respawnRequestTick = 0;
  }

  function markMultiplayerV2RespawnAckPending() {
    multiplayer.v2.respawnAckPending = true;
    multiplayer.v2.respawnRequestedAt = performance.now();
    multiplayer.v2.respawnRequestTick = Math.max(
      Math.floor(finiteOr(multiplayer.v2.lastServerTick, 0)),
      Math.floor(finiteOr(multiplayer.v2.state && multiplayer.v2.state.tick, 0))
    );
    multiplayer.v2.pendingSnapshot = null;
    updateMultiplayerV2Perf({
      pendingSnapshotEvents: 0
    });
  }
