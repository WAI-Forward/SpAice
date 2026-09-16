  function clumpOffset(index, count, seedHolder) {
    const angle = randomRange(seedHolder, 0, Math.PI * 2) + index * 2.399963229728653;
    const progress = count > 1 ? index / Math.max(1, count - 1) : 0;
    const radius = randomRange(seedHolder, MOB_WAVE_CLUMP_MIN_RADIUS, MOB_WAVE_CLUMP_MAX_RADIUS) * (0.72 + progress * 0.34);
    return {
      x: Math.cos(angle) * radius + randomRange(seedHolder, -22, 22),
      y: Math.sin(angle) * radius + randomRange(seedHolder, -22, 22)
    };
  }

  function splitMobWaveSlotsByAnchor(slots, players, seedHolder) {
    const groups = players.map(() => []);
    if (!groups.length) {
      return groups;
    }

    for (const kind of slots) {
      let leastCount = Infinity;
      const candidates = [];
      for (let i = 0; i < groups.length; i += 1) {
        if (groups[i].length < leastCount) {
          candidates.length = 0;
          leastCount = groups[i].length;
        }
        if (groups[i].length === leastCount) {
          candidates.push(i);
        }
      }
      const groupIndex = candidates[Math.floor(randomRange(seedHolder, 0, candidates.length))] || 0;
      groups[groupIndex].push(kind);
    }

    return groups;
  }

  function spawnMobWave(state, slots, players, seedHolder) {
    const world = state.world;
    const sourcePlayers = players.slice(0, MAX_PLAYERS);
    const groups = splitMobWaveSlotsByAnchor(slots, sourcePlayers, seedHolder);
    const spawnedKinds = new Set();

    for (let playerIndex = 0; playerIndex < groups.length; playerIndex += 1) {
      const kinds = groups[playerIndex];
      if (!kinds.length) {
        continue;
      }
      const center = chooseMobWaveClumpCenter(world, sourcePlayers[playerIndex], sourcePlayers, seedHolder);
      const entries = compressMobSpawnSlots(kinds);
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const offset = clumpOffset(i, entries.length, seedHolder);
        const mob = createMob(world, entry.kind, center.x + offset.x, center.y + offset.y, seedHolder, {
          eliteStars: entry.eliteStars,
          eliteGroupSize: entry.eliteGroupSize
        });
        mobCollectionByKind(world, entry.kind).push(mob);
        spawnedKinds.add(entry.kind);
      }
    }

    return spawnedKinds;
  }

  function nearestMobDistance(world, x, y, kind) {
    let nearest = Infinity;
    for (const collectionName of MOB_COLLECTIONS) {
      for (const mob of world[collectionName] || []) {
        if (!mob || mob.health <= 0) {
          continue;
        }
        const sameKind = mob.kind === kind;
        const weight = sameKind ? 1 : 0.55;
        const distance = Math.hypot(x - mob.x, y - mob.y) / weight;
        if (distance < nearest) {
          nearest = distance;
        }
      }
    }
    return nearest;
  }

  function leastPopulatedMobAnchor(world, players) {
    let best = players[0];
    let bestCount = Infinity;
    for (const player of players) {
      let count = 0;
      for (const collectionName of MOB_COLLECTIONS) {
        for (const mob of world[collectionName] || []) {
          if (mob && mob.health > 0 && Math.hypot(mob.x - player.x, mob.y - player.y) < 1300) {
            count += 1;
          }
        }
      }
      if (count < bestCount) {
        best = player;
        bestCount = count;
      }
    }
    return best;
  }

  function chooseMobSpawnPoint(world, kind, anchor, players, seedHolder) {
    const baseMinPlayerDistance = kind === "alienoid" ? 820 : kind === "ufo" || kind === "tesla" ? 900 : 980;
    const spawnSpread = (kind === "rocket" || kind === "fighter" ? 980 : 720) * MOB_SPAWN_SPREAD_MULTIPLIER;
    const minPlayerDistance = MOB_SPAWN_FULLY_ZOOMED_OUT_VIEW_RADIUS + baseMinPlayerDistance + MOB_SPAWN_DISTANCE_BONUS;
    const maxDistance = minPlayerDistance + spawnSpread;
    let best = null;
    let bestValid = null;
    for (let attempt = 0; attempt < 36; attempt += 1) {
      const angle = randomRange(seedHolder, 0, Math.PI * 2);
      const dist = randomRange(seedHolder, minPlayerDistance, maxDistance);
      const x = anchor.x + Math.cos(angle) * dist + randomRange(seedHolder, -220, 220);
      const y = anchor.y + Math.sin(angle) * dist + randomRange(seedHolder, -220, 220);
      const nearestPlayer = nearestPlayerDistance(x, y, players);
      const nearestMob = nearestMobDistance(world, x, y, kind);
      const tooCloseToPlayer = Math.max(0, minPlayerDistance - nearestPlayer);
      const score = nearestPlayer * 0.18 + nearestMob * 0.62 - tooCloseToPlayer * 10;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (nearestPlayer >= minPlayerDistance && (!bestValid || score > bestValid.score)) {
        bestValid = { x, y, score };
      }
    }
    return bestValid || best || { x: anchor.x + minPlayerDistance, y: anchor.y };
  }

  function mobBeaconForKind(world, kind) {
    const beacons = Array.isArray(world && world.mobBeacons) ? world.mobBeacons : [];
    return beacons.find((beacon) => beacon && beacon.beaconKind === kind) || null;
  }

  function nearestMobBeaconDistance(world, x, y, ignoreBeacon) {
    let nearest = Infinity;
    for (const beacon of world.mobBeacons || []) {
      if (!beacon || beacon === ignoreBeacon || finiteOr(beacon.health, 0) <= 0) {
        continue;
      }
      const distance = Math.hypot(x - beacon.x, y - beacon.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function nearestMobBeaconAnchor(beacon, players) {
    const source = Array.isArray(players) && players.length ? players : [{ x: 0, y: 0, vx: 0, vy: 0 }];
    let nearest = source[0];
    let nearestDistance = Infinity;
    for (const player of source) {
      const distance = Math.hypot(beacon.x - player.x, beacon.y - player.y);
      if (distance < nearestDistance) {
        nearest = player;
        nearestDistance = distance;
      }
    }
    return {
      anchor: nearest,
      distance: Number.isFinite(nearestDistance) ? nearestDistance : 0
    };
  }

  function chooseMobBeaconSpawnPoint(world, kind, players, seedHolder) {
    const sourcePlayers = Array.isArray(players) && players.length ? players : [{ x: 0, y: 0, vx: 0, vy: 0 }];
    const source = leastPopulatedMobAnchor(world, sourcePlayers);
    let best = null;
    let bestValid = null;
    const tierIndex = Math.max(0, MOB_TIER_ORDER.indexOf(kind));
    const baseAngle = tierIndex * 2.399963229728653 + randomRange(seedHolder, -0.55, 0.55);

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const angle = attempt < 8
        ? baseAngle + attempt * (Math.PI * 2 / 8) + randomRange(seedHolder, -0.18, 0.18)
        : randomRange(seedHolder, 0, Math.PI * 2);
      const distance = randomRange(seedHolder, MOB_BEACON_MIN_PLAYER_DISTANCE, MOB_BEACON_MAX_PLAYER_DISTANCE);
      const side = angle + Math.PI / 2;
      const x = source.x + Math.cos(angle) * distance + Math.cos(side) * randomRange(seedHolder, -320, 320);
      const y = source.y + Math.sin(angle) * distance + Math.sin(side) * randomRange(seedHolder, -320, 320);
      const nearestPlayer = nearestPlayerDistance(x, y, sourcePlayers);
      const nearestBeacon = nearestMobBeaconDistance(world, x, y, null);
      const beaconSpacing = Number.isFinite(nearestBeacon) ? Math.min(nearestBeacon, MOB_BEACON_PREFERRED_SEPARATION * 2.4) : MOB_BEACON_PREFERRED_SEPARATION * 1.8;
      const tooCloseToPlayer = Math.max(0, MOB_BEACON_MIN_PLAYER_DISTANCE - nearestPlayer);
      const tooFarFromPlayer = Math.max(0, nearestPlayer - MOB_BEACON_MAX_PLAYER_DISTANCE);
      const tooCloseToBeacon = Math.max(0, MOB_BEACON_PREFERRED_SEPARATION - beaconSpacing);
      const score = beaconSpacing * 0.9 + nearestPlayer * 0.12 - tooCloseToPlayer * 8 - tooFarFromPlayer * 2.5 - tooCloseToBeacon * 7;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (
        nearestPlayer >= MOB_BEACON_MIN_PLAYER_DISTANCE &&
        nearestPlayer <= MOB_BEACON_MAX_PLAYER_DISTANCE &&
        beaconSpacing >= MOB_BEACON_PREFERRED_SEPARATION &&
        (!bestValid || score > bestValid.score)
      ) {
        bestValid = { x, y, score };
      }
    }

    return bestValid || best || { x: source.x + MOB_BEACON_MIN_PLAYER_DISTANCE, y: source.y };
  }

  function createMobBeacon(world, kind, x, y, seedHolder, options) {
    const beaconKind = MOB_TIER_ORDER.includes(kind) ? kind : "alienoid";
    const id = Math.max(1, Math.floor(finiteOr(world.nextMobBeaconId, 1)));
    const maxHealth = mobBeaconMaxHealth(beaconKind);
    const angle = randomRange(seedHolder, 0, Math.PI * 2);
    const beacon = normalizeMobBeacon({
      ...(options && typeof options === "object" ? options : {}),
      id,
      kind: "beacon",
      beaconKind,
      isBeacon: true,
      x,
      y,
      vx: Math.cos(angle) * randomRange(seedHolder, 8, 24),
      vy: Math.sin(angle) * randomRange(seedHolder, 8, 24),
      radius: 46,
      health: maxHealth,
      maxHealth,
      color: mobBeaconColor(beaconKind),
      rotation: randomRange(seedHolder, 0, Math.PI * 2),
      wobble: randomRange(seedHolder, 0, Math.PI * 2),
      age: 0,
      respawnTimer: 0,
      driftAngle: randomRange(seedHolder, 0, Math.PI * 2),
      strafeSign: randomRange(seedHolder, 0, 1) < 0.5 ? -1 : 1
    }, id);
    world.nextMobBeaconId = id + 1;
    return beacon;
  }

  function replaceMobBeaconState(world, beacon, kind, spawn, seedHolder) {
    Object.assign(beacon, createMobBeacon(world, kind, spawn.x, spawn.y, seedHolder));
    return beacon;
  }

  function ensureMobBeacon(world, kind, players, seedHolder) {
    if (!Array.isArray(world.mobBeacons)) {
      world.mobBeacons = [];
    }
    let beacon = mobBeaconForKind(world, kind);
    if (beacon) {
      return beacon;
    }
    const spawn = chooseMobBeaconSpawnPoint(world, kind, players, seedHolder);
    beacon = createMobBeacon(world, kind, spawn.x, spawn.y, seedHolder);
    world.mobBeacons.push(beacon);
    return beacon;
  }

  function isMobBeaconReady(world, kind) {
    const beacon = mobBeaconForKind(world, kind);
    return Boolean(beacon && finiteOr(beacon.health, 0) > 0 && finiteOr(beacon.age, 0) >= MOB_BEACON_WARMUP_DURATION);
  }

  function updateMobBeaconMotion(world, beacon, players, dt) {
    const nearest = nearestMobBeaconAnchor(beacon, players);
    const anchor = nearest.anchor || { x: 0, y: 0 };
    const distance = Math.max(1, nearest.distance);
    const fromAnchorX = (beacon.x - anchor.x) / distance;
    const fromAnchorY = (beacon.y - anchor.y) / distance;
    const wave = finiteOr(beacon.wobble, 0) + finiteOr(beacon.age, 0) * 0.55;
    let ax = Math.cos(finiteOr(beacon.driftAngle, 0) + Math.sin(wave) * 0.4) * 16;
    let ay = Math.sin(finiteOr(beacon.driftAngle, 0) + Math.cos(wave * 0.73) * 0.4) * 16;

    const gadgetControlled = finiteOr(beacon.gadgetForceTimer, 0) > 0;
    if (!gadgetControlled && distance < MOB_BEACON_MIN_PLAYER_DISTANCE) {
      const strength = clamp((MOB_BEACON_MIN_PLAYER_DISTANCE - distance) / 900, 0.25, 2.2) * 54;
      ax += fromAnchorX * strength;
      ay += fromAnchorY * strength;
    } else if (!gadgetControlled && distance > MOB_BEACON_MAX_PLAYER_DISTANCE) {
      const strength = clamp((distance - MOB_BEACON_MAX_PLAYER_DISTANCE) / 1200, 0.35, 2.5) * 68;
      ax -= fromAnchorX * strength;
      ay -= fromAnchorY * strength;
    }

    for (const other of world.mobBeacons || []) {
      if (!other || other === beacon || finiteOr(other.health, 0) <= 0) {
        continue;
      }
      const dx = beacon.x - other.x;
      const dy = beacon.y - other.y;
      const spacing = Math.hypot(dx, dy) || 1;
      if (spacing >= MOB_BEACON_PREFERRED_SEPARATION) {
        continue;
      }
      const strength = (MOB_BEACON_PREFERRED_SEPARATION - spacing) / MOB_BEACON_PREFERRED_SEPARATION * 46;
      ax += dx / spacing * strength;
      ay += dy / spacing * strength;
    }

    beacon.vx += ax * dt;
    beacon.vy += ay * dt;
    beacon.vx *= Math.pow(0.9, dt);
    beacon.vy *= Math.pow(0.9, dt);
    const speed = Math.hypot(beacon.vx, beacon.vy);
    if (speed > MOB_BEACON_MAX_SPEED) {
      beacon.vx = (beacon.vx / speed) * MOB_BEACON_MAX_SPEED;
      beacon.vy = (beacon.vy / speed) * MOB_BEACON_MAX_SPEED;
    }
    beacon.x += beacon.vx * dt;
    beacon.y += beacon.vy * dt;
    beacon.rotation = finiteOr(beacon.rotation, 0) + (0.24 + Math.max(0, MOB_TIER_ORDER.indexOf(beacon.beaconKind)) * 0.015) * dt * finiteOr(beacon.strafeSign, 1);
    beacon.driftAngle = finiteOr(beacon.driftAngle, 0) + 0.18 * dt * finiteOr(beacon.strafeSign, 1);
  }

  function updateMobBeacons(state, players, dt, seedHolder) {
    const world = state.world;
    if (!Array.isArray(world.mobBeacons)) {
      world.mobBeacons = [];
    }
    for (const kind of MOB_TIER_ORDER) {
      if (!isMobTierUnlocked(state, world, kind)) {
        continue;
      }
      const beacon = ensureMobBeacon(world, kind, players, seedHolder);
      beacon.hitCooldown = Math.max(0, finiteOr(beacon.hitCooldown, 0) - dt);
      beacon.disabledTimer = Math.max(0, finiteOr(beacon.disabledTimer, 0) - dt);
      beacon.flash = Math.max(0, finiteOr(beacon.flash, 0) - dt);
      beacon.gadgetForceTimer = Math.max(0, finiteOr(beacon.gadgetForceTimer, 0) - dt);
      tickMobBodyImpactCooldowns(beacon, dt);

      if (finiteOr(beacon.health, 0) <= 0) {
        beacon.respawnTimer = Math.max(0, finiteOr(beacon.respawnTimer, MOB_BEACON_RESPAWN_DURATION) - dt);
        if (beacon.respawnTimer <= 0) {
          replaceMobBeaconState(world, beacon, kind, chooseMobBeaconSpawnPoint(world, kind, players, seedHolder), seedHolder);
        }
        continue;
      }

      beacon.age = Math.max(0, finiteOr(beacon.age, 0) + dt);
      beacon.respawnTimer = 0;
      updateMobBeaconMotion(world, beacon, players, dt);
    }
  }

