  const spawnBodyCommandNames = bodyTiers.concat(stellarBranchTiers)
    .filter((tier) => tier.threshold > 0)
    .map((tier) => tier.name.replace(/\s+/g, "-"));
  const spawnMobCommandNames = ["alienoid", "ufo", "rambot", "tesla", "engineer", "satellite", "rocket", "fighter"];
  const spawnBossCommandNames = spawnMobCommandNames.slice();
  const spawnEventCommandNames = ["particle-storm", "meteor-shower"];
  const spawnNpcCommandNames = ["trader"];

  function normalizeSpawnCommandToken(token) {
    return String(token || "").trim().toLowerCase().replace(/[-_\s]+/g, "");
  }

  function mobKindForCommandToken(token) {
    const normalized = normalizeSpawnCommandToken(token);
    if (normalized === "alien" || normalized === "alienoid") return "alienoid";
    if (normalized === "ufo") return "ufo";
    if (normalized === "rambot") return "rambot";
    if (normalized === "tesla") return "tesla";
    if (normalized === "engineer") return "engineer";
    if (normalized === "satellite") return "satellite";
    if (normalized === "rocket" || normalized === "rocketship") return "rocket";
    if (normalized === "fighter" || normalized === "fightership") return "fighter";
    return "";
  }

  function mobLabelForKind(kind) {
    if (kind === "ufo") return "UFO";
    if (kind === "rambot") return "Rambot";
    if (kind === "tesla") return "Tesla";
    if (kind === "engineer") return "Engineer";
    if (kind === "satellite") return "Satellite";
    if (kind === "rocket") return "Rocket ship";
    if (kind === "fighter") return "Fighter ship";
    return "Alienoid";
  }

  function randomEventIdForCommandToken(token) {
    const normalized = normalizeSpawnCommandToken(token);
    if (normalized === "particlestorm" || normalized === "storm") return particleStormEventId;
    if (normalized === "meteorshower" || normalized === "meteor" || normalized === "meteors" || normalized === "shower") return meteorShowerEventId;
    if (normalized === "roguetrader" || normalized === "trader") return rogueTraderEventId;
    return "";
  }

  function npcKindForCommandToken(token) {
    const normalized = normalizeSpawnCommandToken(token);
    if (normalized === "trader" || normalized === "roguetrader" || normalized === "spacecrafttrader") return "trader";
    return "";
  }

  function spawnEventLabel(eventId) {
    if (eventId === particleStormEventId) return "Particle storm";
    if (eventId === meteorShowerEventId) return "Meteor shower";
    if (eventId === rogueTraderEventId) return "Rogue Trader";
    return "Event";
  }

  function parseSpawnTargetAndAmount(rawTarget) {
    const parts = String(rawTarget || "").trim().split(/\s+/).filter(Boolean);
    let amount = 1;
    if (parts.length > 1) {
      const maybeAmount = Math.floor(Number(parts[parts.length - 1]));
      if (Number.isFinite(maybeAmount) && maybeAmount > 0) {
        amount = clamp(maybeAmount, 1, 100);
        parts.pop();
      }
    }
    return {
      target: parts.join(" "),
      amount
    };
  }

  function completeSpawnCommand() {
    if (!commandInput) {
      return;
    }
    const command = commandInput.value;
    const match = command.match(/^\/spawn\s+(body|mob|boss|event|npc)(?:\s+(.+))?$/i);
    if (!match) {
      commandInput.value = "/spawn ";
      commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
      updateCommandHint();
      return;
    }
    const category = match[1].toLowerCase();
    const names = category === "mob"
      ? spawnMobCommandNames
      : category === "boss"
        ? spawnBossCommandNames
        : category === "event"
          ? spawnEventCommandNames
          : category === "npc"
            ? spawnNpcCommandNames
            : spawnBodyCommandNames;
    const rawTarget = String(match[2] || "").trim();
    const amountMatch = rawTarget.match(/^(.*?)(?:\s+(\d+))?$/);
    const partialTarget = amountMatch ? amountMatch[1].trim() : rawTarget;
    const amountSuffix = amountMatch && amountMatch[2] ? " " + amountMatch[2] : "";
    const partial = normalizeSpawnCommandToken(partialTarget);
    const matches = names.filter((name) => !partial || normalizeSpawnCommandToken(name).startsWith(partial));
    if (!matches.length) {
      updateCommandHint();
      return;
    }
    if (!multiplayer.commandCompletions.length || multiplayer.commandCompletions.join("|") !== matches.join("|")) {
      multiplayer.commandCompletions = matches;
      multiplayer.commandCompletionIndex = 0;
    } else {
      multiplayer.commandCompletionIndex = (multiplayer.commandCompletionIndex + 1) % multiplayer.commandCompletions.length;
    }
    const selected = multiplayer.commandCompletions[multiplayer.commandCompletionIndex];
    commandInput.value = "/spawn " + category + " " + selected + amountSuffix;
    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
    updateCommandHint();
  }

  function matchingTeleportPlayers(partial) {
    const normalized = normalizeCommandPlayerToken(partial);
    return knownTeleportPlayers().filter((candidate) => {
      const name = String(candidate.publicName || "").toLowerCase();
      const id = String(candidate.playerId || "").toLowerCase();
      const token = commandPlayerToken(candidate.publicName).toLowerCase();
      return !normalized || name.includes(normalized) || id.includes(normalized) || token.includes(normalized.replace(/\s+/g, "_"));
    });
  }

  function updateCommandHint() {
    if (!commandHint || !commandInput) {
      return;
    }

    if (!multiplayer.commandUnlocked) {
      commandHint.textContent = "Type password to unlock commands";
      return;
    }

    const value = commandInput.value.trim();
    if (!value) {
      commandHint.textContent = "Available: /kill all, /status disabled <seconds>, /tp <player>, /spawn mob <type> <amount>, /spawn boss <type>";
      return;
    }

    if (/^\/kill(\s|$)/i.test(value)) {
      commandHint.textContent = "Kill: /kill all";
      return;
    }

    if (/^\/reset(\s|$)/i.test(value)) {
      commandHint.textContent = "Available: /reset world, /reset players, /reset all";
      return;
    }

    if (/^\/spawn(\s|$)/i.test(value)) {
      commandHint.textContent = "Spawn: mob, boss, body, event, npc. Bosses: alienoid, ufo, rambot, tesla, engineer, satellite, rocket, fighter.";
      return;
    }

    if (/^\/tech(\s|$)/i.test(value)) {
      commandHint.textContent = "Tech: all, suction, weapon, plating, energy, repair, target, propulsion, shield, communication";
      return;
    }

    if (/^\/status(\s|$)/i.test(value)) {
      commandHint.textContent = "Status: /status disabled <seconds>";
      return;
    }

    if (!/^\/tp(\s|$)/i.test(value)) {
      commandHint.textContent = "Available: /kill all, /status disabled <seconds>, /tp <player>, /spawn mob <type> <amount>, /spawn boss <type>";
      return;
    }

    const partial = value.replace(/^\/tp\s*/i, "");
    const matches = matchingTeleportPlayers(partial).slice(0, 6);
    if (!matches.length) {
      commandHint.textContent = "No matching players. Open online list or overlap first.";
      return;
    }

    commandHint.textContent = matches
      .map((candidate) => commandPlayerToken(candidate.publicName) + (candidate.live ? "" : " (no live position)"))
      .join("  ");
  }

  function completeTeleportCommand() {
    if (!commandInput) {
      return;
    }

    if (!multiplayer.commandUnlocked) {
      updateCommandHint();
      return;
    }

    const command = commandInput.value;
    if (!/^\/tp(\s|$)/i.test(command)) {
      if (/^\/spawn(\s|$)/i.test(command)) {
        completeSpawnCommand();
        return;
      }
      commandInput.value = "/tp ";
      updateCommandHint();
      return;
    }

    const partial = command.replace(/^\/tp\s*/i, "");
    const matches = matchingTeleportPlayers(partial);
    if (!matches.length) {
      updateCommandHint();
      return;
    }

    if (!multiplayer.commandCompletions.length || multiplayer.commandCompletions.map((item) => item.playerId).join("|") !== matches.map((item) => item.playerId).join("|")) {
      multiplayer.commandCompletions = matches;
      multiplayer.commandCompletionIndex = 0;
    } else {
      multiplayer.commandCompletionIndex = (multiplayer.commandCompletionIndex + 1) % multiplayer.commandCompletions.length;
    }

    const selected = multiplayer.commandCompletions[multiplayer.commandCompletionIndex];
    commandInput.value = "/tp " + commandPlayerToken(selected.publicName);
    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
    updateCommandHint();
  }

  function tryUnlockCommandConsole(rawCommand) {
    if (String(rawCommand || "") === commandPassword) {
      setCommandLockedState(false);
      maybeNotifyText("Commands unlocked.");
      return true;
    }

    maybeNotifyText("Incorrect password.");
    if (commandInput) {
      commandInput.value = "";
    }
    updateCommandHint();
    return false;
  }

  async function executeCommand(rawCommand) {
    if (!multiplayer.commandUnlocked) {
      tryUnlockCommandConsole(rawCommand);
      return;
    }

    const command = String(rawCommand || "").trim();
    if (!command) {
      setCommandOpen(false);
      return;
    }

    if (!command.startsWith("/")) {
      maybeNotifyText("Commands start with /.");
      setCommandOpen(false);
      return;
    }

    if (/^\/reset(\s|$)/i.test(command)) {
      const target = command.replace(/^\/reset\s*/i, "").trim().toLowerCase();
      await executeResetCommand(target);
      setCommandOpen(false);
      return;
    }

    if (/^\/spawn(\s|$)/i.test(command)) {
      executeSpawnCommand(command);
      setCommandOpen(false);
      return;
    }

    if (/^\/kill(\s|$)/i.test(command)) {
      executeKillCommand(command);
      setCommandOpen(false);
      return;
    }

    if (/^\/tech(\s|$)/i.test(command)) {
      executeTechCommand(command);
      setCommandOpen(false);
      return;
    }

    if (/^\/status(\s|$)/i.test(command)) {
      executeStatusCommand(command);
      setCommandOpen(false);
      return;
    }

    if (!/^\/tp(\s|$)/i.test(command)) {
      maybeNotifyText("Unknown command. Try /kill all, /status disabled 5, /spawn boss alienoid, /tech <type> <amount>, or /reset all.");
      setCommandOpen(false);
      return;
    }

    const targetToken = command.replace(/^\/tp\s*/i, "");
    if (!targetToken) {
      const livePlayers = knownTeleportPlayers().filter((candidate) => candidate.live);
      maybeNotifyText(livePlayers.length ? "Use Tab to choose: " + livePlayers.map((candidate) => commandPlayerToken(candidate.publicName)).join(", ") : "No live player positions yet.");
      updateCommandHint();
      return;
    }

    teleportToPlayer(targetToken);
    setCommandOpen(false);
  }

  function sendPartyCommand(payload) {
    if (!payload || !isPartySessionActive()) {
      return false;
    }
    return sendMultiplayer({
      type: "party.command",
      roomId: multiplayer.v2.roomId || (multiplayer.partySession && multiplayer.partySession.id) || "",
      ...payload
    });
  }

  function spawnBodyFromCommand(tier, source) {
    if (!tier || !source) {
      return null;
    }
    const mass = Math.max(1, tier.threshold);
    const direction = {
      x: finiteOr(source.directionX, 1),
      y: finiteOr(source.directionY, 0)
    };
    const directionLength = Math.hypot(direction.x, direction.y) || 1;
    const dirX = direction.x / directionLength;
    const dirY = direction.y / directionLength;
    const radius = radiusFromMassForTier(mass, tier);
    const originRadius = Math.max(1, finiteOr(source.radius, player.radius));
    const distance = Math.max(180, originRadius + radius + 120);
    const sideOffset = (((nextParticleId - 1) % 7) - 3) * Math.min(radius * 0.9 + 18, 160);
    const body = createParticle(
      finiteOr(source.x, player.x) + dirX * distance - dirY * sideOffset,
      finiteOr(source.y, player.y) + dirY * distance + dirX * sideOffset,
      mass,
      randomParticleColor()
    );
    body.vx = 0;
    body.vy = 0;
    if (stellarOutcomeTierNames.includes(tier.name)) {
      body.stellarOutcome = tier.name;
      body.stellarGrowthStarted = true;
      body.stellarGrowthRate = tier.name === "black hole"
        ? stellarGrowthRateBlackHoleThreshold
        : tier.name === "neutron star"
          ? stellarGrowthRateNeutronThreshold
          : 0;
      body.tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
      body.radius = radiusFromMassForTier(body.mass, body.tier);
    }
    particles.push(body);
    return body;
  }

  function spawnMobFromCommand(kind, source) {
    const anchor = {
      x: finiteOr(source && source.x, player.x),
      y: finiteOr(source && source.y, player.y),
      vx: finiteOr(player.vx, 0),
      vy: finiteOr(player.vy, 0),
      radius: finiteOr(source && source.radius, player.radius)
    };
    spawnMobByKind(kind, anchor);
  }

  function spawnBossFromCommand(kind, source) {
    const anchor = {
      x: finiteOr(source && source.x, player.x),
      y: finiteOr(source && source.y, player.y),
      vx: finiteOr(player.vx, 0),
      vy: finiteOr(player.vy, 0),
      radius: finiteOr(source && source.radius, player.radius)
    };
    spawnBossByKind(kind, anchor, activePartyPlayerAnchors());
  }

  function forceRandomEventFromCommand(eventId) {
    const definition = randomEventDefinitions.find((candidate) => candidate && candidate.id === eventId);
    if (!definition) {
      return false;
    }
    if (eventId === meteorShowerEventId && typeof meteorShowerCanStartAfterParticleStorms === "function" && !meteorShowerCanStartAfterParticleStorms()) {
      return false;
    }
    if (randomEventState.active) {
      finishRandomEvent("command");
    }
    randomEventState.enabled = true;
    return startRandomEvent(definition);
  }

  function localSpawnCommandSource() {
    const aimAngle = getCursorAimAngle();
    const direction = cameraLocalToWorld(Math.cos(aimAngle), Math.sin(aimAngle));
    return {
      x: player.x,
      y: player.y,
      radius: player.radius,
      directionX: direction.x,
      directionY: direction.y
    };
  }

