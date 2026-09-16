  async function readCrazyGamesInviteParams(game) {
    if (!game) {
      return null;
    }

    if (game.inviteParams && typeof game.inviteParams === "object") {
      return game.inviteParams;
    }

    if (typeof game.getInviteParam !== "function") {
      return null;
    }

    const params = {};
    for (const key of ["roomId", "roomName", "mode", "maxPlayers"]) {
      try {
        const value = await game.getInviteParam(key);
        if (value != null && value !== "") {
          params[key] = value;
        }
      } catch {
        // Missing invite params are normal on ordinary starts.
      }
    }
    return Object.keys(params).length ? params : null;
  }

  async function refreshCrazyGamesVisibleUser() {
    const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
    if (!sdk || !sdk.user || typeof sdk.user.getUser !== "function") {
      return;
    }

    try {
      const user = await sdk.user.getUser();
      crazyGamesState.user = user && typeof user === "object" ? user : null;
      if (crazyGamesState.user && crazyGamesState.user.username) {
        player.name = sanitizePlayerName(crazyGamesState.user.username) || player.name;
        updatePublicNameValue();
      }
    } catch {
      crazyGamesState.user = null;
    }
  }

  function configureCrazyGamesMultiplayer(game) {
    if (!game || crazyGamesState.roomJoinListener) {
      return;
    }

    crazyGamesState.instantMultiplayer = Boolean(game.isInstantMultiplayer || game.isInstantJoin);
    crazyGamesState.roomJoinListener = function (inviteParams) {
      handleCrazyGamesJoinParams(inviteParams, "join-listener");
    };

    if (typeof game.addJoinRoomListener === "function") {
      try {
        game.addJoinRoomListener(crazyGamesState.roomJoinListener);
      } catch (error) {
        console.warn("CrazyGames room join listener unavailable.", error);
      }
    }
  }

  async function handleCrazyGamesStartupMultiplayer(game) {
    if (!game || crazyGamesState.initialInviteHandled) {
      return;
    }

    crazyGamesState.initialInviteHandled = true;
    const inviteParams = await readCrazyGamesInviteParams(game);
    if (handleCrazyGamesJoinParams(inviteParams, "startup-invite")) {
      return;
    }

    if (crazyGamesState.instantMultiplayer && !crazyGamesState.instantMultiplayerHandled) {
      crazyGamesState.instantMultiplayerHandled = true;
      logCrazyGamesQa("instant multiplayer requested", {
        reason: "startup",
        isInstantMultiplayer: true
      });
      setStartMenuView("lobby", { push: false });
      setDifficultyScreenOpen(true);
      createLobby();
    }
  }
