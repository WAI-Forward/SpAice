  function showSignalPrompt(message) {
    multiplayer.pendingSignal = {
      kind: "signal",
      signalId: message.signalId,
      other: message.other || null
    };
    if (signalName) {
      signalName.textContent = message.other && message.other.publicName ? message.other.publicName : "Unknown contact";
    }
    if (investigateSignal) {
      investigateSignal.textContent = "Investigate";
    }
    if (avoidSignal) {
      avoidSignal.textContent = "Avoid";
    }
    if (signalPanel) {
      signalPanel.classList.add("is-open");
      signalPanel.setAttribute("aria-hidden", "false");
    }
  }

  function showFriendInvite(message) {
    multiplayer.pendingSignal = {
      kind: "friend",
      fromPlayerId: message.fromPlayerId,
      fromName: message.fromName
    };
    if (signalName) {
      signalName.textContent = (message.fromName || "Friend") + " invited you";
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
  }

  function showAnomalyPrompt(message) {
    multiplayer.pendingSignal = {
      kind: "anomaly",
      encounterId: message.encounterId,
      otherPartySize: Math.max(1, Math.floor(finiteOr(message.otherPartySize, 1)))
    };
    if (signalName) {
      signalName.textContent = "Equal party detected";
    }
    if (investigateSignal) {
      investigateSignal.textContent = "Investigate";
    }
    if (avoidSignal) {
      avoidSignal.textContent = "Flee";
    }
    if (signalPanel) {
      signalPanel.classList.add("is-open");
      signalPanel.setAttribute("aria-hidden", "false");
    }
  }

  function hideSignalPrompt() {
    multiplayer.pendingSignal = null;
    if (signalPanel) {
      signalPanel.classList.remove("is-open");
      signalPanel.setAttribute("aria-hidden", "true");
    }
  }

  function choosePendingSignal(choice) {
    const pending = multiplayer.pendingSignal;
    if (!pending) {
      return;
    }

    if (pending.kind === "friend") {
      if (choice === "investigate") {
        sendMultiplayer({
          type: "friend.accept",
          fromPlayerId: pending.fromPlayerId
        });
      }
      hideSignalPrompt();
      return;
    }

    if (pending.kind === "lobby") {
      if (choice === "investigate") {
        void acceptLobbyInvite(pending);
      } else {
        hideSignalPrompt();
      }
      return;
    }

    if (pending.kind === "anomaly") {
      sendMultiplayer({
        type: "anomaly.choice",
        encounterId: pending.encounterId,
        choice
      });
      hideSignalPrompt();
      return;
    }

    sendMultiplayer({
      type: "signal.choice",
      signalId: pending.signalId,
      choice
    });
    hideSignalPrompt();
  }

