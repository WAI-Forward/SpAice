  function handleMultiplayerMessage(message) {
    if (!message || typeof message !== "object") {
      return;
    }

    if (message.type === "bootstrap") {
      applyMultiplayerProfile(message.profile);
      multiplayer.universeId = message.universeId || multiplayer.universeId;
      multiplayer.bubbleRadius = finiteOr(message.bubbleRadius, multiplayer.bubbleRadius);
      multiplayer.onlineCount = Math.max(0, Math.floor(finiteOr(message.onlineCount, multiplayer.onlineCount)));
      multiplayer.players = Array.isArray(message.players) ? message.players : multiplayer.players;
      updateOnlineUi();
      if (multiplayer.panelOpen) {
        renderPlayerSearch();
      }
      flushMultiplayerRoomRequests("bootstrap");
      flushLobbyRequests("bootstrap");
      flushSharedWorldRequests("bootstrap");
      return;
    }

    if (message.type === "error") {
      maybeNotifyText(message.message || "Multiplayer request failed.");
      return;
    }

    if (message.type === "presence.update") {
      multiplayer.onlineCount = Math.max(0, Math.floor(finiteOr(message.onlineCount, multiplayer.onlineCount)));
      updateOnlineUi();
      if (multiplayer.panelOpen) {
        void refreshPlayerSearch();
      }
      if (multiplayer.lobby) {
        void refreshLobbyPlayerSearch();
      }
      return;
    }

    if (message.type === "room.state") {
      applyCrazyGamesRoomState(message);
      return;
    }

    if (message.type === "room.player.joined") {
      maybeNotifyText((message.publicName || "A player") + " joined.");
      return;
    }

    if (message.type === "room.join.failed") {
      multiplayer.pendingJoinRoomId = "";
      multiplayer.joinRequestedRoomId = "";
      multiplayer.roomCreatePending = false;
      if (multiplayer.roomId === message.roomId) {
        clearCrazyGamesRoomState("join-failed");
      }
      maybeNotifyText(message.message || "Multiplayer room is unavailable.");
      return;
    }

    if (message.type === "lobby.state") {
      applyLobbyState(message);
      return;
    }

    if (message.type === "lobby.join.failed") {
      multiplayer.lobbyCreatePending = false;
      multiplayer.lobbyJoinPending = "";
      setCrazyGamesLoadingActive(false, "lobby-join-failed");
      clearCrazyGamesRoomState("lobby-join-failed");
      setLobbyStatus(message.message || "Lobby unavailable.", "error");
      maybeNotifyText(message.message || "Lobby unavailable.");
      setStartMenuView("multiplayer", { push: false });
      return;
    }

    if (message.type === "shared.world.join.failed") {
      multiplayer.sharedWorldJoinPending = false;
      setCrazyGamesLoadingActive(false, "shared-world-join-failed");
      setSharedWorldStatus(message.message || "Shared world unavailable.", "error");
      maybeNotifyText(message.message || "Shared world unavailable.");
      setStartMenuView("multiplayer", { push: false });
      return;
    }

    if (message.type === "lobby.invite") {
      multiplayer.pendingSignal = {
        kind: "lobby",
        lobbyId: message.lobbyId,
        code: message.code,
        fromPlayerId: message.fromPlayerId,
        fromName: message.fromName
      };
      if (signalName) {
        signalName.textContent = (message.fromName || "Player") + " invited you";
      }
      if (investigateSignal) {
        investigateSignal.textContent = "Join";
      }
      if (avoidSignal) {
        avoidSignal.textContent = "Decline";
      }
      if (signalPanel) {
        signalPanel.classList.add("is-open");
        signalPanel.setAttribute("aria-hidden", "false");
      }
      return;
    }

    if (message.type === "lobby.kicked") {
      multiplayer.lobby = null;
      multiplayer.lobbyInviteLink = "";
      setCrazyGamesLoadingActive(false, "lobby-kicked");
      clearCrazyGamesRoomState("lobby-kicked");
      setStartMenuView("multiplayer", { push: false });
      maybeNotifyText(message.message || "Removed from lobby.");
      return;
    }

    if (message.type === "party.start") {
      applyPartyStart(message);
      return;
    }

    if (message.type === "party.state") {
      applyPartyState(message);
      return;
    }

    if (message.type === "shared.team.left") {
      multiplayer.sharedTeamId = "";
      multiplayer.sharedTeamMemberIds.clear();
      updateSettingsJoinCodeUi();
      maybeNotifyText(message.message || "Left team.");
      if (multiplayer.panelOpen) {
        renderPlayerSearch();
      }
      return;
    }

    if (message.type === "mp.v2.snapshot") {
      if (typeof queueMultiplayerV2Snapshot === "function") {
        queueMultiplayerV2Snapshot(message);
      } else {
        applyMultiplayerV2Snapshot(message);
      }
      return;
    }

    if (message.type === "mp.v2.event") {
      return;
    }

    if (message.type === "party.host.changed") {
      applyPartyHostChanged(message);
      return;
    }

    if (message.type === "party.world.snapshot") {
      applyPartyWorldSnapshot(message);
      return;
    }

    if (message.type === "party.player.snapshot") {
      applyPartyPlayerSnapshot(message);
      return;
    }

    if (message.type === "player.respawn") {
      applyPartyPlayerSnapshot(message);
      return;
    }

    if (message.type === "party.tech.claimed") {
      applyTechPickupClaim(message);
      return;
    }

    if (message.type === "party.health.claimed") {
      applyHealthPickupClaim(message);
      return;
    }

    if (message.type === "party.command") {
      handlePartyCommand(message);
      return;
    }

    if (message.type === "party.physics.start" || message.type === "party.physics.state") {
      handlePartyPhysicsSessionRequest(message);
      return;
    }

    if (message.type === "party.physics.end") {
      handlePartyPhysicsEndRequest(message);
      return;
    }

    if (message.type === "party.physics.authority") {
      applyPartyPhysicsAuthority(message);
      return;
    }

    if (message.type === "party.physics.reject") {
      applyPartyPhysicsReject(message);
      return;
    }

    if (message.type === "anomaly.ready") {
      showAnomalyPrompt(message);
      return;
    }

    if (message.type === "anomaly.start") {
      multiplayer.anomaly = {
        id: message.encounterId || "",
        teamId: message.teamId || "",
        phase: "overlap",
        endsAt: finiteOr(message.endsAt, Date.now() + 90000)
      };
      maybeNotifyText("Anomaly investigated.");
      return;
    }

    if (message.type === "anomaly.end") {
      multiplayer.anomaly = null;
      maybeNotifyText("Anomaly separated.");
      return;
    }

    if (message.type === "signal.detected") {
      if (!multiplayer.friendJoinsEnabled) {
        sendMultiplayer({
          type: "signal.choice",
          signalId: message.signalId,
          choice: "avoid"
        });
        return;
      }
      showSignalPrompt(message);
      return;
    }

    if (message.type === "signal.ended") {
      hideSignalPrompt();
      if (message.reason === "timeout") {
        maybeNotifyText("Signal faded.");
      }
      return;
    }

    if (message.type === "overlap.start") {
      maybeNotifyText(message.mode === "friend" ? "Friend universe aligned." : "Universe overlap detected.");
      return;
    }

    if (message.type === "overlap.transform") {
      updateRemoteTransforms(message);
      return;
    }

    if (message.type === "overlap.snapshot") {
      applyRemoteSnapshot(message);
      return;
    }

    if (message.type === "overlap.end") {
      clearOverlap(message.overlapId);
      maybeNotifyText("Universe drift restored.");
      return;
    }

    if (message.type === "friend.invite") {
      if (!multiplayer.friendJoinsEnabled) {
        maybeNotifyText("Multiplayer Off");
        return;
      }
      showFriendInvite(message);
      return;
    }

    if (message.type === "friend.invite.sent") {
      maybeNotifyText(message.message || (message.online ? "Relay signal sent." : "Relay contact is offline."));
      if (multiplayer.panelOpen) {
        void refreshPlayerSearch();
      }
      return;
    }

    if (message.type === "player.death") {
      const transform = message.transform || {};
      spawnCommunicationTechDrop(
        finiteOr(message.x, 0) + finiteOr(transform.offsetX, 0),
        finiteOr(message.y, 0) + finiteOr(transform.offsetY, 0),
        finiteOr(message.vx, 0),
        finiteOr(message.vy, 0),
        message.fromName || "A contact"
      );
      return;
    }

    if (message.type === "interaction.request") {
      handleInteractionRequest(message);
      return;
    }

    if (message.type === "interaction.result") {
      handleInteractionResult(message);
      return;
    }

    if (message.type === "trade.offer") {
      handleTradeOffer(message);
      return;
    }

    if (message.type === "trade.accept") {
      handleTradeAccept(message);
      return;
    }

    if (message.type === "reset.world") {
      resetSharedWorldV2Boundary();
      resetLocalWorldState();
      if (message.actorPlayerId !== player.id) {
        maybeNotifyText("World data reset.");
      }
      return;
    }

    if (message.type === "reset.players") {
      resetSharedWorldV2Boundary();
      resetLocalPlayerState();
      resetDeathState();
      if (message.actorPlayerId !== player.id) {
        maybeNotifyText("Player data reset.");
      }
      return;
    }

    if (message.type === "reset.all") {
      resetSharedWorldV2Boundary();
      resetLocalPlayerState();
      resetLocalWorldState();
      resetDeathState();
      if (message.actorPlayerId !== player.id) {
        maybeNotifyText("World and player data reset.");
      }
      return;
    }

    if (message.type === "entity.effect") {
      applyRemoteEntityEffect(message);
    }
  }
