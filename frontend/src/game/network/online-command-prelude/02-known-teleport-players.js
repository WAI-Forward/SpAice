  function knownTeleportPlayers() {
    const players = [];
    const seen = new Set();
    const addPlayer = (candidate) => {
      if (
        !candidate ||
        !candidate.playerId ||
        candidate.playerId === player.id ||
        seen.has(candidate.playerId) ||
        !candidate.online
      ) {
        return;
      }

      seen.add(candidate.playerId);
      players.push(candidate);
    };

    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!remote.playerId) {
        continue;
      }
      const snapshot = displaySnapshotFor(remote);
      addPlayer({
        playerId: remote.playerId,
        publicName: remote.publicName || remote.playerId,
        online: true,
        live: Boolean(snapshot && snapshot.player),
        remote
      });
    }

    for (const candidate of multiplayer.players || []) {
      addPlayer({
        playerId: candidate.playerId,
        publicName: candidate.publicName || candidate.playerId,
        online: Boolean(candidate.online),
        live: false,
        remote: null
      });
    }

    return players.sort((a, b) => {
      if (a.live !== b.live) {
        return a.live ? -1 : 1;
      }
      if (a.online !== b.online) {
        return a.online ? -1 : 1;
      }
      return String(a.publicName).localeCompare(String(b.publicName));
    });
  }

  function commandPlayerToken(name) {
    return String(name || "").trim().replace(/\s+/g, "_");
  }

  function normalizeCommandPlayerToken(token) {
    return String(token || "").trim().replace(/_/g, " ").toLowerCase();
  }
