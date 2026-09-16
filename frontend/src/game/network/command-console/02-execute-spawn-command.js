  function executeSpawnCommand(command) {
    const match = command.match(/^\/spawn\s+(body|mob|boss|event|npc)(?:\s+(.+))?$/i);
    const category = match && match[1] ? match[1].toLowerCase() : "";
    const parsed = parseSpawnTargetAndAmount(match && match[2] ? match[2] : "");
    if (!match || !parsed.target) {
      maybeNotifyText("Use /spawn mob alienoid 3, /spawn boss ufo, /spawn event meteor-shower, or /spawn npc trader.");
      updateCommandHint();
      return;
    }

    const source = localSpawnCommandSource();
    if (category === "mob") {
      const kind = mobKindForCommandToken(parsed.target);
      if (!kind) {
        maybeNotifyText("Unknown mob. Try alienoid, ufo, rambot, tesla, engineer, satellite, rocket, or fighter.");
        return;
      }
      if (isMultiplayerV2Active() || isSharedWorldFollower()) {
        const sent = sendPartyCommand({
          command: "spawnMob",
          mob: kind,
          amount: parsed.amount,
          source
        });
        maybeNotifyText(sent ? "Spawned " + parsed.amount + " " + mobLabelForKind(kind) + (parsed.amount === 1 ? "." : "s.") : "Multiplayer command unavailable.");
        return;
      }
      for (let i = 0; i < parsed.amount; i += 1) {
        spawnMobFromCommand(kind, source);
      }
      maybeNotifyText("Spawned " + parsed.amount + " " + mobLabelForKind(kind) + (parsed.amount === 1 ? "." : "s."));
      void savePersistentState({ includeWorld: true });
      return;
    }

    if (category === "boss") {
      const kind = mobKindForCommandToken(parsed.target);
      if (!kind) {
        maybeNotifyText("Unknown boss. Try alienoid, ufo, rambot, tesla, engineer, satellite, rocket, or fighter.");
        return;
      }
      if (isMultiplayerV2Active() || isSharedWorldFollower()) {
        const sent = sendPartyCommand({
          command: "spawnBoss",
          mob: kind,
          amount: parsed.amount,
          source
        });
        maybeNotifyText(sent ? "Spawned " + parsed.amount + " " + mobBossLabel(kind) + (parsed.amount === 1 ? "." : "s.") : "Multiplayer command unavailable.");
        return;
      }
      for (let i = 0; i < parsed.amount; i += 1) {
        spawnBossFromCommand(kind, source);
      }
      void savePersistentState({ includeWorld: true });
      return;
    }

    if (category === "event" || category === "npc") {
      const eventId = category === "npc" ? (npcKindForCommandToken(parsed.target) ? rogueTraderEventId : "") : randomEventIdForCommandToken(parsed.target);
      if (!eventId) {
        maybeNotifyText(category === "npc" ? "Unknown NPC. Try trader." : "Unknown event. Try meteor-shower or particle-storm.");
        return;
      }
      if (isMultiplayerV2Active() || isSharedWorldFollower()) {
        const sent = sendPartyCommand({
          command: category === "npc" ? "spawnNpc" : "spawnEvent",
          npc: category === "npc" ? "trader" : "",
          event: eventId,
          source
        });
        maybeNotifyText(sent ? "Spawned " + spawnEventLabel(eventId) + "." : "Multiplayer command unavailable.");
        return;
      }
      if (forceRandomEventFromCommand(eventId)) {
        maybeNotifyText("Spawned " + spawnEventLabel(eventId) + ".");
        void savePersistentState({ includeWorld: true });
      } else {
        maybeNotifyText("Unable to spawn " + spawnEventLabel(eventId) + ".");
      }
      return;
    }

    const tier = bodyTierForCommandToken(parsed.target);
    if (!tier) {
      maybeNotifyText("Unknown body type. Try rock, boulder, asteroid, dwarf-moon, moon, planet, star, white-dwarf, neutron-star, or black-hole.");
      return;
    }

    if (isMultiplayerV2Active() || isSharedWorldFollower()) {
      const sent = sendPartyCommand({
        command: "spawnBody",
        body: tier.name,
        amount: parsed.amount,
        source
      });
      maybeNotifyText(sent ? "Spawned " + parsed.amount + " " + tier.name + (parsed.amount === 1 ? "." : "s.") : "Multiplayer command unavailable.");
      return;
    }

    for (let i = 0; i < parsed.amount; i += 1) {
      spawnBodyFromCommand(tier, source);
    }
    maybeNotifyText("Spawned " + parsed.amount + " " + tier.name + (parsed.amount === 1 ? "." : "s."));
    void savePersistentState({ includeWorld: true });
  }

  function killAllMobsFromCommand() {
    let killed = 0;
    for (const mob of hostileCombatMobs().slice()) {
      if (!mob || mob.health <= 0) {
        continue;
      }
      if (mob.kind === "fighter") {
        mob.shieldActive = 0;
        mob.shieldCharge = 0;
      }
      if (damageMob(mob, Math.max(1, finiteOr(mob.health, 0)), mob.color, "Killed mobs.", {
        groupKey: "command-kill-all",
        format: function (count) {
          return "Killed " + count + " mob" + (count === 1 ? "." : "s.");
        }
      })) {
        killed += 1;
      }
    }
    return killed;
  }

  function executeKillCommand(command) {
    const target = command.replace(/^\/kill\s*/i, "").trim().toLowerCase();
    if (target !== "all") {
      maybeNotifyText("Use /kill all.");
      updateCommandHint();
      return;
    }

    if (isMultiplayerV2Active() || isSharedWorldFollower()) {
      const sent = sendPartyCommand({
        command: "killAll"
      });
      maybeNotifyText(sent ? "Killed all mobs." : "Multiplayer command unavailable.");
      return;
    }

    const killed = killAllMobsFromCommand();
    if (killed <= 0) {
      maybeNotifyText("No mobs to kill.");
      return;
    }
    void savePersistentState({ includeWorld: true });
  }

  function techTypeForCommandToken(token) {
    const normalized = String(token || "")
      .trim()
      .toLowerCase()
      .replace(/[-_\s]+/g, "")
      .replace(/tech$/, "");
    return techTypes.find((tech) => tech.key.replace(/[-_\s]+/g, "") === normalized) || null;
  }

  function addTechFromCommand(tech, amount, all) {
    if (all) {
      for (const techType of techTypes) {
        techInventory[techType.key] = Math.max(0, Math.floor(techInventory[techType.key] || 0)) + amount;
      }
      updateTechUi();
      maybeNotifyText("Added " + amount + " of every tech type.");
      void savePersistentState({ includeWorld: false });
      return;
    }

    techInventory[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0)) + amount;
    updateTechUi();
    maybeNotifyText("Added " + amount + " " + tech.label.toLowerCase() + ".");
    void savePersistentState({ includeWorld: false });
  }

  function executeTechCommand(command) {
    const match = command.match(/^\/tech\s+([^\s]+)(?:\s+([^\s]+))?$/i);
    const techToken = match && match[1] ? match[1] : "";
    const normalizedTechToken = techToken.toLowerCase();
    const amountToken = match && match[2] ? match[2] : "";
    const tech = techTypeForCommandToken(techToken);
    const amount = Math.floor(Number(amountToken));
    const all = normalizedTechToken === "all";

    if ((!tech && !all) || !Number.isFinite(amount) || amount <= 0) {
      maybeNotifyText("Use /tech all 10, /tech weapon 10, /tech suction 25, etc.");
      updateCommandHint();
      return;
    }

    if (isMultiplayerV2Active()) {
      const sent = sendPartyCommand({
        command: "tech",
        tech: all ? "all" : tech.key,
        amount
      });
      maybeNotifyText(sent ? (all ? "Added " + amount + " of every tech type." : "Added " + amount + " " + tech.label.toLowerCase() + ".") : "Multiplayer command unavailable.");
      return;
    }

    addTechFromCommand(tech, amount, all);
  }

  function executeStatusCommand(command) {
    const match = command.match(/^\/status\s+([^\s]+)(?:\s+([^\s]+))?$/i);
    const status = match && match[1] ? String(match[1]).toLowerCase() : "";
    const seconds = match && match[2] ? Number(match[2]) : NaN;

    if (status !== "disabled" || !Number.isFinite(seconds) || seconds < 0) {
      maybeNotifyText("Use /status disabled <seconds>.");
      updateCommandHint();
      return;
    }

    const duration = clamp(seconds, 0, 300);
    if (duration <= 0) {
      applyPlayerStatusEffect("disabled", 0);
      resetMouseButtons();
      if (isMultiplayerV2Active() && multiplayer.v2.state && multiplayer.v2.state.players && multiplayer.v2.state.players[player.id]) {
        sendMultiplayerV2BuildAction({
          action: "statusEffect",
          status: "disabled",
          duration: 0
        });
      }
      maybeNotifyText("Disabled status cleared.");
      return;
    }

    if (isMultiplayerV2Active() && multiplayer.v2.state && multiplayer.v2.state.players && multiplayer.v2.state.players[player.id]) {
      const sent = sendMultiplayerV2BuildAction({
        action: "statusEffect",
        status: "disabled",
        duration
      });
      if (!sent) {
        applyPlayerStatusEffect("disabled", duration);
      }
    } else {
      applyPlayerStatusEffect("disabled", duration);
    }
    maybeNotifyText("Disabled for " + duration.toFixed(duration % 1 ? 1 : 0) + "s.");
  }

  function handlePartyCommand(message) {
    if (!isPartyHost() || isMultiplayerV2Active()) {
      return;
    }
    const command = String(message && message.command || "");
    if (command !== "spawnBody" && command !== "spawnMob" && command !== "spawnBoss" && command !== "spawnEvent" && command !== "spawnNpc" && command !== "killAll") {
      return;
    }
    const amount = clamp(Math.max(1, Math.floor(finiteOr(message.amount, 1))), 1, 100);
    const source = message.source && typeof message.source === "object" ? message.source : {};
    if (command === "killAll") {
      const killed = killAllMobsFromCommand();
      maybeNotifyText(killed > 0 ? (message.publicName || "A player") + " killed " + killed + " mob" + (killed === 1 ? "." : "s.") : "No mobs to kill.");
      if (killed > 0) {
        void savePersistentState({ includeWorld: true });
      }
      return;
    }
    if (command === "spawnMob") {
      const kind = mobKindForCommandToken(message.mob);
      if (!kind) {
        return;
      }
      for (let i = 0; i < amount; i += 1) {
        spawnMobFromCommand(kind, source);
      }
      maybeNotifyText((message.publicName || "A player") + " spawned " + amount + " " + mobLabelForKind(kind) + (amount === 1 ? "." : "s."));
      void savePersistentState({ includeWorld: true });
      return;
    }
    if (command === "spawnBoss") {
      const kind = mobKindForCommandToken(message.mob);
      if (!kind) {
        return;
      }
      for (let i = 0; i < amount; i += 1) {
        spawnBossFromCommand(kind, source);
      }
      maybeNotifyText((message.publicName || "A player") + " spawned " + amount + " " + mobBossLabel(kind) + (amount === 1 ? "." : "s."));
      void savePersistentState({ includeWorld: true });
      return;
    }
    if (command === "spawnEvent" || command === "spawnNpc") {
      const eventId = command === "spawnNpc" ? (npcKindForCommandToken(message.npc) ? rogueTraderEventId : "") : randomEventIdForCommandToken(message.event);
      if (!eventId || !forceRandomEventFromCommand(eventId)) {
        return;
      }
      maybeNotifyText((message.publicName || "A player") + " spawned " + spawnEventLabel(eventId) + ".");
      void savePersistentState({ includeWorld: true });
      return;
    }
    const tier = bodyTierForCommandToken(message.body);
    if (!tier) {
      return;
    }
    for (let i = 0; i < amount; i += 1) {
      spawnBodyFromCommand(tier, source);
    }
    maybeNotifyText((message.publicName || "A player") + " spawned " + amount + " " + tier.name + (amount === 1 ? "." : "s."));
    void savePersistentState({ includeWorld: true });
  }

  async function executeResetCommand(target) {
    if (target !== "world" && target !== "players" && target !== "all") {
      maybeNotifyText("Use /reset world, /reset players, or /reset all.");
      updateCommandHint();
      return;
    }

    if (persistence.resetInFlight) {
      maybeNotifyText("Reset already running.");
      return;
    }

    persistence.resetInFlight = true;

    try {
      await waitForPersistenceIdle();
      await fetchPersistentJson("/api/reset/" + target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id })
      });

      if (target === "world") {
        resetLocalWorldState();
        await savePersistentState({ includeWorld: true });
        maybeNotifyText("World data reset.");
      } else if (target === "players") {
        resetLocalPlayerState();
        resetDeathState();
        await savePersistentState({ includeWorld: false });
        maybeNotifyText("Player data reset.");
      } else {
        resetLocalPlayerState();
        resetLocalWorldState();
        resetDeathState();
        await savePersistentState({ includeWorld: true });
        maybeNotifyText("World and player data reset.");
      }
    } catch (error) {
      maybeNotifyText("Reset failed: " + (error instanceof Error ? error.message : "unknown error"));
    } finally {
      persistence.resetInFlight = false;
      persistence.saveTimer = persistenceSaveInterval;
      persistence.pollTimer = persistencePollInterval;
    }
  }

  function teleportToPlayer(targetToken) {
    const target = matchingTeleportPlayers(targetToken).find((candidate) => candidate.live) || matchingTeleportPlayers(targetToken)[0];
    if (!target) {
      maybeNotifyText("No player matched " + targetToken + ".");
      return;
    }

    const targetSnapshot = target.remote ? displaySnapshotFor(target.remote) : null;
    if (!target.remote || !targetSnapshot || !targetSnapshot.player) {
      maybeNotifyText(target.publicName + " has no live position yet. Overlap or invite them first.");
      return;
    }

    const remotePlayer = transformedRemoteEntity(targetSnapshot.player, displayTransformFor(target.remote));
    if (player.landed) {
      detachFromBody(120);
    }

    const angle = Math.atan2(player.y - remotePlayer.y, player.x - remotePlayer.x) || -Math.PI / 2;
    const offset = Math.max(150, (remotePlayer.radius || 34) + player.radius + 120);
    player.x = remotePlayer.x + Math.cos(angle) * offset;
    player.y = remotePlayer.y + Math.sin(angle) * offset;
    player.vx = 0;
    player.vy = 0;
    cameraRoll = 0;
    maybeNotifyText("Teleported near " + target.publicName + ".");
    void savePersistentState({ includeWorld: true });
    sendMultiplayer({
      type: "input",
      snapshot: buildRealtimeSnapshot()
    });
  }
