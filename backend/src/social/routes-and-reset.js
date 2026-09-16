async function handleSocialRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      const playerId = sanitizeText(url.searchParams.get("playerId"), 80);

      if (!playerId) {
        logMultiplayer("bootstrap rejected", { reason: "missing player id" });
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      const profile = await ensurePlayerProfile(playerId);
      logMultiplayer("bootstrap", {
        playerId,
        publicName: profile && profile.publicName,
        onlineCount: countOnlinePlayers()
      });
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        profile,
        onlineCount: countOnlinePlayers(),
        players: await listVisiblePlayers(playerId, "", false, false)
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/players/search") {
      const playerId = sanitizeText(url.searchParams.get("playerId"), 80);
      const query = sanitizeText(url.searchParams.get("q"), 40);
      const friendsOnly = url.searchParams.get("friendsOnly") === "true";
      const relayOnly = url.searchParams.get("relayOnly") === "true";

      if (!playerId) {
        logMultiplayer("player search rejected", { query, friendsOnly, relayOnly, reason: "missing player id" });
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      await ensurePlayerProfile(playerId);
      logMultiplayer("player search", { playerId, query, friendsOnly, relayOnly });
      writeJson(response, 200, {
        ok: true,
        players: await listVisiblePlayers(playerId, query, friendsOnly, relayOnly)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/friends/request") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body && body.playerId, 80);
      const targetPlayerId = sanitizeText(body && body.targetPlayerId, 80);

      if (!playerId || !targetPlayerId || playerId === targetPlayerId) {
        logMultiplayer("friend request rejected", {
          playerId,
          targetPlayerId,
          reason: "invalid friend request"
        });
        writeJson(response, 400, { ok: false, message: "Invalid friend request." });
        return;
      }

      if (!canRelayLinkPlayers(playerId, targetPlayerId)) {
        logMultiplayer("friend request rejected", {
          playerId,
          targetPlayerId,
          reason: "missing communication relay"
        });
        writeJson(response, 403, { ok: false, message: "Both players need online communication relays." });
        return;
      }

      const profiles = await addFriendship(playerId, targetPlayerId);
      logMultiplayer("friend request accepted", { playerId, targetPlayerId });
      notifyProfileChanged(playerId);
      notifyProfileChanged(targetPlayerId);
      writeJson(response, 200, { ok: true, profiles });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/friends/accept") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body && body.playerId, 80);
      const targetPlayerId = sanitizeText(body && body.targetPlayerId, 80);

      if (!playerId || !targetPlayerId || playerId === targetPlayerId) {
        logMultiplayer("friend accept rejected", {
          playerId,
          targetPlayerId,
          reason: "invalid friend accept"
        });
        writeJson(response, 400, { ok: false, message: "Invalid friend accept." });
        return;
      }

      if (!canRelayLinkPlayers(playerId, targetPlayerId)) {
        logMultiplayer("friend accept rejected", {
          playerId,
          targetPlayerId,
          reason: "missing communication relay"
        });
        writeJson(response, 403, { ok: false, message: "Both players need online communication relays." });
        return;
      }

      const profiles = await addFriendship(playerId, targetPlayerId);
      logMultiplayer("friend accept accepted", { playerId, targetPlayerId });
      notifyProfileChanged(playerId);
      notifyProfileChanged(targetPlayerId);
      writeJson(response, 200, { ok: true, profiles });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Social endpoint not found." });
  } catch (error) {
    logClusternautsError("social request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Social request failed."
    });
  }
}

async function resetPersistentWorldData() {
  await waitForSharedWorldSaveIdle();
  const pool = await getDbPool();

  if (!pool) {
    const deleted = memoryPersistence.worlds.size;
    const deletedSharedWorlds = memoryPersistence.sharedWorlds.size;
    memoryPersistence.worlds.clear();
    memoryPersistence.sharedWorlds.clear();
    overlaps.clear();
    return {
      ok: true,
      storage: "memory",
      reset: "world",
      deleted: {
        worlds: deleted,
        sharedWorlds: deletedSharedWorlds
      }
    };
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("DELETE FROM clusternauts_world_state");
  const sharedWorldResult = await pool.query("DELETE FROM clusternauts_shared_world_state");
  overlaps.clear();
  return {
    ok: true,
    storage: "database",
    reset: "world",
    deleted: {
      worlds: result.rowCount,
      sharedWorlds: sharedWorldResult.rowCount
    }
  };
}

async function resetPersistentPlayerData() {
  await waitForSharedWorldSaveIdle();
  const pool = await getDbPool();

  if (!pool) {
    const deleted = memoryPersistence.players.size;
    const deletedSharedPlayers = memoryPersistence.sharedPlayers.size;
    memoryPersistence.players.clear();
    memoryPersistence.sharedPlayers.clear();
    playerCooldowns.clear();
    return {
      ok: true,
      storage: "memory",
      reset: "players",
      deleted: {
        players: deleted,
        sharedPlayers: deletedSharedPlayers
      }
    };
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("DELETE FROM clusternauts_player_state");
  const sharedPlayerResult = await pool.query("DELETE FROM clusternauts_shared_player_state");
  playerCooldowns.clear();
  return {
    ok: true,
    storage: "database",
    reset: "players",
    deleted: {
      players: result.rowCount,
      sharedPlayers: sharedPlayerResult.rowCount
    }
  };
}

async function resetPersistentAllData() {
  await waitForSharedWorldSaveIdle();
  const pool = await getDbPool();

  if (!pool) {
    const deleted = {
      worlds: memoryPersistence.worlds.size,
      players: memoryPersistence.players.size,
      sharedWorlds: memoryPersistence.sharedWorlds.size,
      sharedPlayers: memoryPersistence.sharedPlayers.size
    };
    memoryPersistence.worlds.clear();
    memoryPersistence.players.clear();
    memoryPersistence.sharedWorlds.clear();
    memoryPersistence.sharedPlayers.clear();
    overlaps.clear();
    playerCooldowns.clear();
    return {
      ok: true,
      storage: "memory",
      reset: "all",
      deleted
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("DELETE FROM clusternauts_world_state");
  const playerResult = await pool.query("DELETE FROM clusternauts_player_state");
  const sharedWorldResult = await pool.query("DELETE FROM clusternauts_shared_world_state");
  const sharedPlayerResult = await pool.query("DELETE FROM clusternauts_shared_player_state");
  overlaps.clear();
  playerCooldowns.clear();
  return {
    ok: true,
    storage: "database",
    reset: "all",
    deleted: {
      worlds: worldResult.rowCount,
      players: playerResult.rowCount,
      sharedWorlds: sharedWorldResult.rowCount,
      sharedPlayers: sharedPlayerResult.rowCount
    }
  };
}

async function resetPersistentLifeData(playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  const worldId = soloWorldId(cleanPlayerId);
  const pool = await getDbPool();

  if (!pool) {
    const deletedWorld = memoryPersistence.worlds.delete(worldId) ? 1 : 0;
    const deletedPlayer = memoryPersistence.players.delete(cleanPlayerId) ? 1 : 0;
    const deletedProfile = memoryPersistence.profiles.delete(cleanPlayerId) ? 1 : 0;
    playerCooldowns.delete(cleanPlayerId);
    removePlayerFromMemoryFriendLists(cleanPlayerId);
    return {
      ok: true,
      storage: "memory",
      reset: "life",
      deleted: {
        worlds: deletedWorld,
        players: deletedPlayer,
        profiles: deletedProfile
      }
    };
  }

  await ensureDatabaseSchema(pool);
  const worldResult = await pool.query("DELETE FROM clusternauts_world_state WHERE id = $1", [worldId]);
  const playerResult = await pool.query("DELETE FROM clusternauts_player_state WHERE player_id = $1", [cleanPlayerId]);
  const profileResult = await pool.query("DELETE FROM clusternauts_player_profile WHERE player_id = $1", [cleanPlayerId]);
  await pool.query(
    `UPDATE clusternauts_player_profile
     SET state = jsonb_set(state, '{friends}', COALESCE(state->'friends', '[]'::jsonb) - $1::text),
         updated_at = now()
     WHERE COALESCE(state->'friends', '[]'::jsonb) ? $1::text`,
    [cleanPlayerId]
  );
  playerCooldowns.delete(cleanPlayerId);
  return {
    ok: true,
    storage: "database",
    reset: "life",
    deleted: {
      worlds: worldResult.rowCount,
      players: playerResult.rowCount,
      profiles: profileResult.rowCount
    }
  };
}

function removePlayerFromMemoryFriendLists(playerId) {
  for (const [profileId, profile] of memoryPersistence.profiles) {
    const normalized = normalizeProfile(profile, profileId);
    if (!normalized.friends.includes(playerId)) {
      continue;
    }

    normalized.friends = normalized.friends.filter((friendId) => friendId !== playerId);
    memoryPersistence.profiles.set(profileId, normalized);
  }
}

function broadcastReset(kind, actorPlayerId) {
  for (const client of sockets) {
    sendWsJson(client, {
      type: "reset." + kind,
      actorPlayerId
    });
  }
}

