  function interactionChoiceByKey(key) {
    return playerInteractionChoiceConfigs[key] || null;
  }

  function normalizeInteractionChoice(key) {
    return interactionChoiceByKey(key) ? key : "";
  }

  function isDuelingWith(playerId) {
    return Boolean(playerId && multiplayer.duels.has(playerId));
  }

  function sharedTeamIdForPlayer(playerId) {
    const id = String(playerId || "");
    if (!id) {
      return "";
    }
    if (id === player.id) {
      return String(multiplayer.sharedTeamId || "");
    }

    const target = findRemoteInteractionTargetByPlayerId(id);
    if (target && target.remote && target.remote.teamId) {
      return String(target.remote.teamId || "");
    }

    const remote = multiplayer.remoteUniverses.get("solo:" + id);
    if (remote && remote.teamId) {
      return String(remote.teamId || "");
    }

    const entry = multiplayer.partySession && Array.isArray(multiplayer.partySession.players)
      ? multiplayer.partySession.players.find((playerEntry) => playerEntry && playerEntry.playerId === id)
      : null;
    return String(entry && entry.teamId || "");
  }

  function isSharedWorldTeammate(playerId) {
    const localTeamId = String(multiplayer.sharedTeamId || "");
    return Boolean(isSharedPublicWorldActive() && localTeamId && sharedTeamIdForPlayer(playerId) === localTeamId);
  }

  function interactionChoicesForPlayer(playerId) {
    if (isSharedPublicWorldActive()) {
      return [
        playerInteractionChoiceConfigs.trade,
        isSharedWorldTeammate(playerId) ? playerInteractionChoiceConfigs["leave-team"] : playerInteractionChoiceConfigs.team
      ].filter(Boolean);
    }
    return [
      playerInteractionChoiceConfigs.trade,
      isDuelingWith(playerId) ? playerInteractionChoiceConfigs.truce : playerInteractionChoiceConfigs.duel
    ];
  }

  function interactionChoicesForTarget(target) {
    if (target && target.kind === "npc") {
      return [playerInteractionChoiceConfigs.trade];
    }
    return interactionChoicesForPlayer(playerIdForInteractionTarget(target));
  }

  function interactionMenuChoiceByKey(menu, key) {
    return menu && Array.isArray(menu.choices)
      ? menu.choices.find((choice) => choice && choice.key === key) || null
      : null;
  }

  function playerIdForInteractionTarget(target) {
    return target && target.remote ? target.remote.playerId || "" : "";
  }

  function interactionIdForTarget(target) {
    if (target && target.kind === "npc" && target.npc && target.spacecraft) {
      return "npc:" + target.spacecraft.id + ":" + target.npc.id;
    }
    return playerIdForInteractionTarget(target);
  }

  function findRemoteInteractionTargetByPlayerId(playerId) {
    if (!playerId) {
      return null;
    }

    for (const target of collectRemoteCombatPlayers()) {
      if (playerIdForInteractionTarget(target) === playerId) {
        return target;
      }
    }

    return null;
  }

  function findNearbyInteractionTarget() {
    let best = null;
    let bestDistance = Infinity;

    const npcTarget = findNearbyNpcInteractionTarget();
    if (npcTarget) {
      best = npcTarget;
      bestDistance = Math.hypot(npcTarget.player.x - player.x, npcTarget.player.y - player.y);
    }

    for (const target of collectRemoteCombatPlayers()) {
      const targetPlayerId = playerIdForInteractionTarget(target);
      if (!targetPlayerId) {
        continue;
      }

      const distance = Math.hypot(target.player.x - player.x, target.player.y - player.y);
      if (distance <= playerInteractionRange && distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    }

    return best;
  }

  function setPlayerInteractionMenu(open, target, requestedChoice) {
    if (!open || !target) {
      multiplayer.interactionMenu = null;
      if (playerInteractionPanel) {
        playerInteractionPanel.classList.remove("is-open");
        playerInteractionPanel.setAttribute("aria-hidden", "true");
      }
      updateTouchScreenUi();
      return;
    }

    const targetId = interactionIdForTarget(target);
    if (!targetId) {
      return;
    }

    const requested = normalizeInteractionChoice(requestedChoice);
    const choices = interactionChoicesForTarget(target);
    const selectedIndex = Math.max(
      0,
      choices.findIndex((choice) => choice.key === requested)
    );
    multiplayer.interactionMenu = {
      targetId,
      targetKind: target.kind === "npc" ? "npc" : "player",
      targetPlayerId: playerIdForInteractionTarget(target),
      targetNpcId: target.kind === "npc" && target.npc ? target.npc.id : "",
      targetSpacecraftId: target.kind === "npc" && target.spacecraft ? target.spacecraft.id : 0,
      targetName: target.publicName || target.player.name || "Contact",
      requestedChoice: requested,
      choices,
      selectedIndex
    };
    renderPlayerInteractionMenu();
    updateTouchScreenUi();
  }

  function renderPlayerInteractionMenu() {
    const menu = multiplayer.interactionMenu;
    if (!playerInteractionPanel || !playerInteractionChoices || !menu) {
      return;
    }

    if (playerInteractionName) {
      playerInteractionName.textContent = menu.requestedChoice
        ? menu.targetName + " is asking"
        : menu.targetName;
    }

    playerInteractionChoices.textContent = "";
    menu.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      const icon = document.createElement("span");
      const label = document.createElement("span");
      button.type = "button";
      button.className = "player-interaction__choice";
      button.dataset.choice = choice.key;
      if (index === menu.selectedIndex) {
        button.classList.add("is-selected");
      }
      if (choice.key === menu.requestedChoice) {
        button.classList.add("is-requested");
      }
      icon.className = "player-interaction__icon";
      icon.textContent = choice.icon;
      label.textContent = choice.label;
      button.append(icon, label);
      playerInteractionChoices.append(button);
    });

    playerInteractionPanel.classList.add("is-open");
    playerInteractionPanel.setAttribute("aria-hidden", "false");
  }

  function movePlayerInteractionSelection(delta) {
    const menu = multiplayer.interactionMenu;
    if (!menu) {
      return;
    }

    const count = menu.choices.length;
    menu.selectedIndex = (menu.selectedIndex + delta + count) % count;
    renderPlayerInteractionMenu();
  }

  function choosePlayerInteraction(choiceKey) {
    const menu = multiplayer.interactionMenu;
    const choice = normalizeInteractionChoice(choiceKey);
    if (!menu || !choice || !interactionMenuChoiceByKey(menu, choice)) {
      return;
    }

    if (menu.targetKind === "npc") {
      const target = findNpcInteractionTargetById(menu.targetSpacecraftId, menu.targetNpcId);
      if (choice === "trade" && target) {
        openNpcTradeSession(target.spacecraft, target.npc);
      } else {
        setPlayerInteractionMenu(false);
      }
      return;
    }

    if (choice === "leave-team") {
      sendMultiplayer({ type: "shared.team.leave" });
      maybeNotifyText("Leaving team.");
      setPlayerInteractionMenu(false);
      return;
    }

    sendMultiplayer({
      type: "interaction.choice",
      targetPlayerId: menu.targetPlayerId,
      choice
    });
    showRemoteInteractionEmote(player.id, choice, player.name || "You");
    maybeNotifyText("Asked " + menu.targetName + " to " + interactionChoiceByKey(choice).label.toLowerCase() + ".");
    setPlayerInteractionMenu(false);
  }

  function openIncomingInteractionMenu() {
    let newest = null;
    for (const interaction of multiplayer.incomingInteractions.values()) {
      if (!newest || interaction.receivedAt > newest.receivedAt) {
        newest = interaction;
      }
    }

    if (!newest) {
      return false;
    }

    const target = findRemoteInteractionTargetByPlayerId(newest.fromPlayerId) || {
      remote: { playerId: newest.fromPlayerId },
      player: { name: newest.fromName || "Contact" },
      publicName: newest.fromName || "Contact"
    };
    setPlayerInteractionMenu(true, target, newest.choice);
    return true;
  }

  function beginNearbyInteraction() {
    if (openIncomingInteractionMenu()) {
      return true;
    }

    const target = findNearbyInteractionTarget();
    if (!target) {
      return false;
    }

    setPlayerInteractionMenu(true, target, "");
    return true;
  }

  function handleInteractionRequest(message) {
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    const choice = normalizeInteractionChoice(message.choice);
    if (!fromPlayerId || !choice) {
      return;
    }

    const fromName = message.fromName || "Contact";
    multiplayer.incomingInteractions.set(fromPlayerId, {
      fromPlayerId,
      fromName,
      choice,
      receivedAt: performance.now()
    });
    showRemoteInteractionEmote(fromPlayerId, choice, fromName);
    maybeNotifyText(fromName + " wants to " + interactionChoiceByKey(choice).label.toLowerCase() + ". Press Enter to respond.");
  }

  function handleInteractionResult(message) {
    const choice = normalizeInteractionChoice(message.choice);
    const targetPlayerId = typeof message.targetPlayerId === "string" ? message.targetPlayerId : "";
    const fromPlayerId = typeof message.fromPlayerId === "string" ? message.fromPlayerId : "";
    const peerId = fromPlayerId === player.id ? targetPlayerId : fromPlayerId;
    const peerName = message.peerName || message.fromName || "Contact";

    if (choice) {
      multiplayer.incomingInteractions.delete(peerId);
    }

    if (message.accepted && choice === "trade") {
      openTradeSession(peerId, peerName);
      return;
    }

    if (message.accepted && choice === "duel") {
      if (peerId) {
        multiplayer.duels.add(peerId);
      }
      maybeNotifyText("Duel agreed with " + peerName + ". PvP is on.");
      return;
    }

    if (message.accepted && choice === "truce") {
      if (peerId) {
        multiplayer.duels.delete(peerId);
      }
      maybeNotifyText("Truce agreed with " + peerName + ". PvP is off.");
      return;
    }

    if (choice === "team") {
      if (message.accepted) {
        multiplayer.sharedTeamId = String(message.teamId || multiplayer.sharedTeamId || "");
        if (Array.isArray(message.members)) {
          multiplayer.sharedTeamMemberIds = new Set(message.members.map(String).filter(Boolean));
        }
        updateSettingsJoinCodeUi();
        if (multiplayer.panelOpen) {
          renderPlayerSearch();
        }
        maybeNotifyText(message.message && message.message !== "Joined team." ? message.message : "Joined team with " + peerName + ".");
      } else {
        maybeNotifyText(message.message || "Team up failed.");
      }
      return;
    }

    if (choice) {
      maybeNotifyText(peerName + " chose " + interactionChoiceByKey(choice).label + ".");
    }
  }

  function showRemoteInteractionEmote(playerId, choiceKey, fromName) {
    const choice = interactionChoiceByKey(choiceKey);
    if (!playerId || !choice) {
      return;
    }

    multiplayer.remoteEmotes.set(playerId, {
      playerId,
      label: choice.label,
      speech: choice.speech,
      emote: choice.emote,
      fromName: fromName || "Contact",
      life: 3.8,
      maxLife: 3.8
    });
  }

  function updateInteractionState(dt) {
    const now = performance.now();
    for (const [playerId, interaction] of multiplayer.incomingInteractions) {
      if (now - interaction.receivedAt > 18000) {
        multiplayer.incomingInteractions.delete(playerId);
      }
    }

    for (const [playerId, emote] of multiplayer.remoteEmotes) {
      emote.life -= dt;
      if (emote.life <= 0) {
        multiplayer.remoteEmotes.delete(playerId);
      }
    }

    if (multiplayer.interactionMenu) {
      const target = multiplayer.interactionMenu.targetKind === "npc"
        ? findNpcInteractionTargetById(multiplayer.interactionMenu.targetSpacecraftId, multiplayer.interactionMenu.targetNpcId)
        : findRemoteInteractionTargetByPlayerId(multiplayer.interactionMenu.targetPlayerId);
      if (!target || Math.hypot(target.player.x - player.x, target.player.y - player.y) > playerInteractionRange + 80) {
        setPlayerInteractionMenu(false);
      }
    }

    if (activeContainerStructureId && !activeContainerStructure()) {
      closeContainerSession();
    }

    if (activeTradePortStructureId && !activeTradePortStructure()) {
      closeTradePortSession();
    }
  }

