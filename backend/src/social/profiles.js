function soloWorldId(playerId) {
  return `solo:${playerId || "anonymous"}`;
}

async function ensurePlayerProfile(playerId) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!cleanPlayerId) {
    return null;
  }

  const pool = await getDbPool();
  if (!pool) {
    const existing = memoryPersistence.profiles.get(cleanPlayerId);
    if (existing) {
      return normalizeProfile(existing, cleanPlayerId);
    }

    const profile = createPlayerProfile(cleanPlayerId);
    memoryPersistence.profiles.set(cleanPlayerId, profile);
    return profile;
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT state FROM clusternauts_player_profile WHERE player_id = $1", [cleanPlayerId]);
  if (result.rows[0] && result.rows[0].state) {
    return normalizeProfile(result.rows[0].state, cleanPlayerId);
  }

  const profile = createPlayerProfile(cleanPlayerId);
  await saveProfile(profile);
  return profile;
}

function createPlayerProfile(playerId) {
  return {
    playerId,
    universeId: soloWorldId(playerId),
    publicName: createRandomPublicName(),
    friends: [],
    createdAt: Date.now(),
    lastSeenAt: Date.now()
  };
}

function normalizeProfile(source, fallbackPlayerId) {
  const snapshot = source && typeof source === "object" ? source : {};
  const playerId = sanitizeText(snapshot.playerId, 80) || fallbackPlayerId;
  const friends = Array.isArray(snapshot.friends)
    ? snapshot.friends.map((friendId) => sanitizeText(friendId, 80)).filter(Boolean).filter(uniqueOnly)
    : [];

  return {
    playerId,
    universeId: soloWorldId(playerId),
    publicName: sanitizeText(snapshot.publicName, 32) || createRandomPublicName(),
    crazyGamesId: sanitizeDebugText(snapshot.crazyGamesId, 128),
    crazyGamesUsername: sanitizeDebugText(snapshot.crazyGamesUsername, 80),
    friends,
    createdAt: clampNumber(snapshot.createdAt, 0, Date.now()) || Date.now(),
    lastSeenAt: clampNumber(snapshot.lastSeenAt, 0, Date.now()) || Date.now()
  };
}

async function saveProfile(profile) {
  const normalized = normalizeProfile(profile, profile && profile.playerId);
  if (!normalized.playerId) {
    return normalized;
  }

  const pool = await getDbPool();
  if (!pool) {
    memoryPersistence.profiles.set(normalized.playerId, normalized);
    return normalized;
  }

  await ensureDatabaseSchema(pool);
  await pool.query(
    `INSERT INTO clusternauts_player_profile (player_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [normalized.playerId, JSON.stringify(normalized)]
  );
  return normalized;
}

async function listProfiles() {
  const pool = await getDbPool();
  if (!pool) {
    return Array.from(memoryPersistence.profiles.entries()).map(([playerId, profile]) => normalizeProfile(profile, playerId));
  }

  await ensureDatabaseSchema(pool);
  const result = await pool.query("SELECT player_id, state FROM clusternauts_player_profile ORDER BY updated_at DESC LIMIT 200");
  return result.rows.map((row) => normalizeProfile(row.state, row.player_id));
}

async function listVisiblePlayers(playerId, query, friendsOnly, relayOnly) {
  const ownProfile = await ensurePlayerProfile(playerId);
  const cleanQuery = String(query || "").trim().toLowerCase();
  const friendSet = new Set(ownProfile ? ownProfile.friends : []);
  const profiles = await listProfiles();
  const onlineIds = new Set(Array.from(clientsByPlayerId.keys()));

  return profiles
    .filter((profile) => profile.playerId !== playerId)
    .filter((profile) => !friendsOnly || friendSet.has(profile.playerId))
    .filter((profile) => !cleanQuery || profile.publicName.toLowerCase().includes(cleanQuery))
    .filter((profile) => !relayOnly || onlineIds.has(profile.playerId))
    .slice(0, 80)
    .map((profile) => {
      const onlineClient = firstOnlineClient(profile.playerId);
      const session = onlineClient ? partySessions.get(onlineClient.partySessionId) : null;
      return {
        playerId: profile.playerId,
        universeId: profile.universeId,
        publicName: profile.publicName,
        friend: friendSet.has(profile.playerId),
        online: onlineIds.has(profile.playerId),
        sharedWorld: isSharedWorldSession(session),
        worldMode: session && session.worldMode || "",
        hasCommunicationRelay: playerHasCommunicationRelay(profile.playerId),
        lastSeenAt: profile.lastSeenAt
      };
    });
}

function playerHasCommunicationRelay(playerId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return false;
  }

  for (const client of clients) {
    if (snapshotHasCommunicationRelay(client.lastSnapshot)) {
      return true;
    }
  }

  return false;
}

function snapshotHasCommunicationRelay(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return false;
  }

  if (snapshot.player && snapshot.player.hasCommunicationRelay) {
    return true;
  }

  const structures = snapshot.world && Array.isArray(snapshot.world.structures) ? snapshot.world.structures : [];
  return structures.some((structure) => (
    structure &&
    structure.type === "communication-relay" &&
    Number(structure.health) > 0
  ));
}

function canRelayLinkPlayers(playerId, targetPlayerId) {
  return Boolean(playerId && targetPlayerId && playerId !== targetPlayerId);
}

async function addFriendship(playerId, targetPlayerId) {
  const profile = await ensurePlayerProfile(playerId);
  const targetProfile = await ensurePlayerProfile(targetPlayerId);

  if (!profile || !targetProfile) {
    return null;
  }

  if (!profile.friends.includes(targetProfile.playerId)) {
    profile.friends.push(targetProfile.playerId);
  }
  if (!targetProfile.friends.includes(profile.playerId)) {
    targetProfile.friends.push(profile.playerId);
  }

  await saveProfile(profile);
  await saveProfile(targetProfile);
  return {
    player: profile,
    target: targetProfile
  };
}

function createRandomPublicName() {
  const adjectives = ["Nova", "Ion", "Solar", "Comet", "Pulse", "Orbit", "Vega", "Quasar", "Lunar", "Echo"];
  const nouns = ["Drifter", "Miner", "Pilot", "Signal", "Voyager", "Builder", "Ranger", "Spark", "Anchor", "Runner"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${noun} ${number}`;
}

function uniqueOnly(value, index, array) {
  return array.indexOf(value) === index;
}

function countOnlinePlayers() {
  return clientsByPlayerId.size;
}

function notifyProfileChanged(playerId) {
  const clients = clientsByPlayerId.get(playerId);
  if (!clients) {
    return;
  }

  for (const client of clients) {
    void sendClientBootstrap(client);
  }
}

