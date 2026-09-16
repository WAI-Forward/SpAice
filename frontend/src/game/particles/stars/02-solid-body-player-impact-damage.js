  function solidBodyPlayerImpactDamage(body, impactSpeed, baseDamage) {
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const speedDamage = Math.max(0, impactSpeed - solidBodyPlayerDamageSpeed) * 0.16;
    const massDamage = Math.sqrt(mass) * 0.55;
    return Math.min(80, baseDamage + speedDamage + massDamage);
  }

  function knockMob(mob, nx, ny, force) {
    if (mob.landed) {
      mob.landed = null;
      mob.residentTier = null;
    }

    mob.vx += nx * force;
    mob.vy += ny * force;

    if (mob.kind === "rambot") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.28);
      mob.chargeTimer = Math.max(0, (mob.chargeTimer || 0) - 0.22);
    } else if (mob.kind === "rocket") {
      mob.recoverTimer = Math.max(mob.recoverTimer || 0, 0.32);
      mob.lockTimer = 0;
      mob.volleyTimer = 0;
      mob.volleyShots = 0;
      mob.blastTimer = Math.max(0, (mob.blastTimer || 0) - 0.18);
    }
  }

  function attachRivalToBody(rival, body, residentTier) {
    rival.landed = {
      bodyId: body.id,
      angle: randomRange(0, Math.PI * 2),
      walkSpeed: randomRange(-18, 18)
    };
    rival.residentTier = residentTier || body.tier.name;
    rival.health = rival.maxHealth;
    rival.flash = Math.max(rival.flash, 0.12);
    applyRivalSurfaceConstraint(rival);
  }

  function nearestMobDistance(x, y, kind) {
    let nearestSq = Infinity;
    for (const mob of liveMobsForSpawnPlacement()) {
      const sameKind = kind === "alienoid"
        ? mob.kind === "alienoid"
        : kind === "satellite" || kind === "rocket"
        ? mob.kind === kind
        : mob.kind === kind;
      const weight = sameKind ? 1 : 0.55;
      const dx = x - mob.x;
      const dy = y - mob.y;
      const distanceSq = (dx * dx + dy * dy) / (weight * weight);
      if (distanceSq < nearestSq) {
        nearestSq = distanceSq;
      }
    }
    return Math.sqrt(nearestSq);
  }

  function mobSpawnMaxZoomedOutViewRadius() {
    const fixedZoom = Math.max(0.001, finiteOr(cameraZoomMin, 0.08));
    const spawnWidth = Math.max(640, finiteOr(width, 0));
    const spawnHeight = Math.max(360, finiteOr(height, 0));
    return Math.hypot(spawnWidth, spawnHeight) / (2 * fixedZoom);
  }

  function chooseMobSpawnPoint(kind, margin, spread, anchor, spawnAnchors) {
    const source = anchor || leastPopulatedMobSpawnAnchor(activeMobSpawnAnchors());
    const anchors = Array.isArray(spawnAnchors) && spawnAnchors.length ? spawnAnchors : activeMobSpawnAnchors();
    const viewportRadius = mobSpawnMaxZoomedOutViewRadius();
    const spawnMargin = Math.max(120, margin) + mobSpawnEdgePaddingBonus;
    const spawnSpread = Math.max(420, spread) * mobSpawnSpreadMultiplier;
    const minPlayerDistance = viewportRadius + spawnMargin;
    const maxDistance = minPlayerDistance + spawnSpread;
    const speed = Math.hypot(finiteOr(source.vx, 0), finiteOr(source.vy, 0));
    const moving = speed > 50;
    const travel = moving ? normalize(source.vx, source.vy) : { x: 0, y: 0 };
    let best = null;
    let bestValid = null;

    const attemptLimit = liveMobsForSpawnPlacement().length > 24 ? 24 : 36;
    for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
      const aheadBias = moving && Math.random() < 0.5;
      const angle = aheadBias
        ? Math.atan2(travel.y, travel.x) + randomRange(-1.15, 1.15)
        : randomRange(0, Math.PI * 2);
      const dist = randomRange(minPlayerDistance, maxDistance);
      const ahead = moving ? clamp(speed * randomRange(0.12, 1.2), 0, 760) : 0;
      const drift = rotatePoint(randomRange(-220, 220), randomRange(-220, 220), angle + Math.PI / 2);
      const x = source.x + travel.x * ahead + Math.cos(angle) * dist + drift.x;
      const y = source.y + travel.y * ahead + Math.sin(angle) * dist + drift.y;
      const nearestPlayer = nearestPartyAnchorDistance(x, y, anchors);
      const nearestMob = nearestMobDistance(x, y, kind);
      const tooCloseToPlayer = Math.max(0, minPlayerDistance - nearestPlayer);
      const tooFarFromSource = Math.max(0, Math.hypot(x - source.x, y - source.y) - maxDistance * 1.15);
      const score =
        nearestPlayer * 0.18 +
        nearestMob * 0.62 -
        tooCloseToPlayer * 10 -
        tooFarFromSource * 1.4;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (nearestPlayer >= minPlayerDistance && (!bestValid || score > bestValid.score)) {
        bestValid = { x, y, score };
      }
    }

    return bestValid || best || randomOffscreenPoint(spawnMargin, spawnSpread, source, cameraZoomMin);
  }

  function mobBeaconForKind(kind) {
    return mobBeacons.find((beacon) => beacon && beacon.beaconKind === kind) || null;
  }

  function isMobBeaconRevealed(beacon) {
    if (!beacon || beacon.health <= 0) {
      return false;
    }
    return Math.hypot(beacon.x - player.x, beacon.y - player.y) <= mobBeaconRevealDistance;
  }

  function nearestMobBeaconDistance(x, y, ignoreBeacon) {
    let nearest = Infinity;
    for (const beacon of mobBeacons) {
      if (!beacon || beacon === ignoreBeacon || beacon.health <= 0) {
        continue;
      }
      const distance = Math.hypot(x - beacon.x, y - beacon.y);
      if (distance < nearest) {
        nearest = distance;
      }
    }
    return nearest;
  }

  function nearestMobBeaconAnchor(beacon, anchors) {
    const source = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    let nearest = source[0] || player;
    let nearestDistance = Infinity;
    for (const anchor of source) {
      const distance = Math.hypot(beacon.x - anchor.x, beacon.y - anchor.y);
      if (distance < nearestDistance) {
        nearest = anchor;
        nearestDistance = distance;
      }
    }
    return {
      anchor: nearest,
      distance: Number.isFinite(nearestDistance) ? nearestDistance : 0
    };
  }

  function chooseMobBeaconSpawnPoint(kind, anchors) {
    const sourceAnchors = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    const source = leastPopulatedMobSpawnAnchor(sourceAnchors);
    let best = null;
    let bestValid = null;
    const tierIndex = Math.max(0, mobTierOrder.indexOf(kind));
    const baseAngle = tierIndex * 2.399963229728653 + randomRange(-0.55, 0.55);

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const angle = attempt < 8
        ? baseAngle + attempt * (Math.PI * 2 / 8) + randomRange(-0.18, 0.18)
        : randomRange(0, Math.PI * 2);
      const distance = randomRange(mobBeaconMinPlayerDistance, mobBeaconMaxPlayerDistance);
      const drift = rotatePoint(randomRange(-320, 320), randomRange(-320, 320), angle + Math.PI / 2);
      const x = source.x + Math.cos(angle) * distance + drift.x;
      const y = source.y + Math.sin(angle) * distance + drift.y;
      const nearestPlayer = nearestPartyAnchorDistance(x, y, sourceAnchors);
      const nearestBeacon = nearestMobBeaconDistance(x, y, null);
      const beaconSpacing = Number.isFinite(nearestBeacon) ? Math.min(nearestBeacon, mobBeaconPreferredSeparation * 2.4) : mobBeaconPreferredSeparation * 1.8;
      const tooCloseToPlayer = Math.max(0, mobBeaconMinPlayerDistance - nearestPlayer);
      const tooFarFromPlayer = Math.max(0, nearestPlayer - mobBeaconMaxPlayerDistance);
      const tooCloseToBeacon = Math.max(0, mobBeaconPreferredSeparation - beaconSpacing);
      const score = beaconSpacing * 0.9 + nearestPlayer * 0.12 - tooCloseToPlayer * 8 - tooFarFromPlayer * 2.5 - tooCloseToBeacon * 7;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
      if (
        nearestPlayer >= mobBeaconMinPlayerDistance &&
        nearestPlayer <= mobBeaconMaxPlayerDistance &&
        beaconSpacing >= mobBeaconPreferredSeparation &&
        (!bestValid || score > bestValid.score)
      ) {
        bestValid = { x, y, score };
      }
    }

    return bestValid || best || {
      x: source.x + mobBeaconMinPlayerDistance,
      y: source.y
    };
  }

  function replaceMobBeaconState(beacon, kind, spawn) {
    const next = createMobBeacon(kind, spawn.x, spawn.y);
    Object.assign(beacon, next);
    return beacon;
  }

  function ensureMobBeacon(kind, anchors) {
    let beacon = mobBeaconForKind(kind);
    if (beacon) {
      return beacon;
    }
    const spawn = chooseMobBeaconSpawnPoint(kind, anchors);
    beacon = createMobBeacon(kind, spawn.x, spawn.y);
    mobBeacons.push(beacon);
    return beacon;
  }

  function isMobBeaconReady(kind) {
    const beacon = mobBeaconForKind(kind);
    return Boolean(beacon && beacon.health > 0 && finiteOr(beacon.age, 0) >= mobBeaconWarmupDuration);
  }

  function updateMobBeaconMotion(beacon, anchors, dt) {
    const nearest = nearestMobBeaconAnchor(beacon, anchors);
    const anchor = nearest.anchor || player;
    const distance = Math.max(1, nearest.distance);
    const fromAnchorX = (beacon.x - anchor.x) / distance;
    const fromAnchorY = (beacon.y - anchor.y) / distance;
    const wave = finiteOr(beacon.wobble, 0) + finiteOr(beacon.age, 0) * 0.55;
    let ax = Math.cos(finiteOr(beacon.driftAngle, 0) + Math.sin(wave) * 0.4) * 16;
    let ay = Math.sin(finiteOr(beacon.driftAngle, 0) + Math.cos(wave * 0.73) * 0.4) * 16;

    const gadgetControlled = finiteOr(beacon.gadgetForceTimer, 0) > 0;
    if (!gadgetControlled && distance < mobBeaconMinPlayerDistance) {
      const strength = clamp((mobBeaconMinPlayerDistance - distance) / 900, 0.25, 2.2) * 54;
      ax += fromAnchorX * strength;
      ay += fromAnchorY * strength;
    } else if (!gadgetControlled && distance > mobBeaconMaxPlayerDistance) {
      const strength = clamp((distance - mobBeaconMaxPlayerDistance) / 1200, 0.35, 2.5) * 68;
      ax -= fromAnchorX * strength;
      ay -= fromAnchorY * strength;
    }

    for (const other of mobBeacons) {
      if (!other || other === beacon || other.health <= 0) {
        continue;
      }
      const dx = beacon.x - other.x;
      const dy = beacon.y - other.y;
      const spacing = Math.hypot(dx, dy) || 1;
      if (spacing >= mobBeaconPreferredSeparation) {
        continue;
      }
      const strength = (mobBeaconPreferredSeparation - spacing) / mobBeaconPreferredSeparation * 46;
      ax += dx / spacing * strength;
      ay += dy / spacing * strength;
    }

    beacon.vx += ax * dt;
    beacon.vy += ay * dt;
    beacon.vx *= Math.pow(0.9, dt);
    beacon.vy *= Math.pow(0.9, dt);
    const speed = Math.hypot(beacon.vx, beacon.vy);
    if (speed > mobBeaconMaxSpeed) {
      beacon.vx = (beacon.vx / speed) * mobBeaconMaxSpeed;
      beacon.vy = (beacon.vy / speed) * mobBeaconMaxSpeed;
    }
    beacon.x += beacon.vx * dt;
    beacon.y += beacon.vy * dt;
    beacon.rotation += (0.24 + Math.max(0, mobTierOrder.indexOf(beacon.beaconKind)) * 0.015) * dt * finiteOr(beacon.strafeSign, 1);
    beacon.driftAngle += 0.18 * dt * finiteOr(beacon.strafeSign, 1);
  }

  function updateMobBeacons(dt, anchors) {
    const sourceAnchors = Array.isArray(anchors) && anchors.length ? anchors : activeMobSpawnAnchors();
    for (const kind of mobTierOrder) {
      if (!isMobTierUnlocked(kind)) {
        continue;
      }
      const beacon = ensureMobBeacon(kind, sourceAnchors);
      beacon.hitCooldown = Math.max(0, finiteOr(beacon.hitCooldown, 0) - dt);
      beacon.disabledTimer = Math.max(0, finiteOr(beacon.disabledTimer, 0) - dt);
      beacon.flash = Math.max(0, finiteOr(beacon.flash, 0) - dt);
      beacon.gadgetForceTimer = Math.max(0, finiteOr(beacon.gadgetForceTimer, 0) - dt);
      tickMobBodyImpactCooldowns(beacon, dt);

      if (beacon.health <= 0) {
        beacon.respawnTimer = Math.max(0, finiteOr(beacon.respawnTimer, mobBeaconRespawnDuration) - dt);
        if (beacon.respawnTimer <= 0) {
          replaceMobBeaconState(beacon, kind, chooseMobBeaconSpawnPoint(kind, sourceAnchors));
        }
        continue;
      }

      beacon.age = Math.max(0, finiteOr(beacon.age, 0) + dt);
      beacon.respawnTimer = 0;
      updateMobBeaconMotion(beacon, sourceAnchors, dt);
    }
  }

  function spawnAlienoidNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("alienoid", 110, 360, anchor, anchors);
    rivals.push(createRival(spawn.x, spawn.y));
  }

  function spawnUfoNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("ufo", 180, 520, anchor, anchors);
    ufos.push(createUfo(spawn.x, spawn.y));
  }

  function spawnRambotNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("rambot", 220, 620, anchor, anchors);
    rambots.push(createRambot(spawn.x, spawn.y));
  }

  function spawnEngineerNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("engineer", 210, 600, anchor, anchors);
    engineers.push(createEngineer(spawn.x, spawn.y));
  }

  function spawnTeslaNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("tesla", 190, 560, anchor, anchors);
    teslas.push(createTesla(spawn.x, spawn.y));
  }

  function spawnSatelliteNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("satellite", 230, 680, anchor, anchors);
    rockets.push(createSatellite(spawn.x, spawn.y));
  }

  function spawnRocketNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("rocket", 320, 900, anchor, anchors);
    rockets.push(createRocket(spawn.x, spawn.y));
  }

  function spawnFighterNearPlayer(anchor, anchors) {
    const spawn = chooseMobSpawnPoint("fighter", 260, 760, anchor, anchors);
    fighters.push(createFighter(spawn.x, spawn.y));
  }

  function mobBossLabel(kind) {
    return (mobEntityBlueprints[kind] && mobEntityBlueprints[kind].label ? mobEntityBlueprints[kind].label : "Mob") + " boss";
  }

  function formatMobBeaconSuspensionDuration(seconds) {
    const total = Math.max(0, Math.ceil(finiteOr(seconds, mobBeaconRespawnDuration)));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return minutes + ":" + String(remainingSeconds).padStart(2, "0");
  }

  function mobBeaconSuspensionLabel(kind) {
    return mobObjectivePluralLabels[kind] || ((mobEntityBlueprints[kind] && mobEntityBlueprints[kind].label) || "Mobs");
  }

  function notifyMobBeaconSuspended(kind, seconds) {
    const mobKind = mobTierOrder.includes(kind) ? kind : "alienoid";
    updateGroupedNotificationText(
      "mob-beacon-suspended:" + mobKind,
      mobBeaconSuspensionLabel(mobKind) + " suspended for " + formatMobBeaconSuspensionDuration(seconds) + ".",
      { lifetime: 5200 }
    );
  }

  function mobBossProgressReady(kind) {
    return Math.max(0, mobBossProgressByKind[kind] || 0) >= mobBossDefeatsToUnlock;
  }

  function previousMobBossDefeated(kind) {
    const index = mobTierOrder.indexOf(kind);
    if (index <= 0) {
      return true;
    }
    const previousKind = mobTierOrder[index - 1];
    return Math.max(0, Math.floor(finiteOr(mobBossDefeatsByKind[previousKind], 0))) > 0;
  }

  function isMobBossUnlocked(kind) {
    return mobBossProgressReady(kind) && previousMobBossDefeated(kind);
  }

  function maybeNotifyMobBossUnlocked(kind) {
    if (!isMobBossUnlocked(kind)) {
      return;
    }
    maybeNotifyText(mobBossLabel(kind) + " sightings unlocked.", {
      groupKey: "mob-boss-unlocked:" + kind,
      lifetime: 4200
    });
  }

  function hasLiveMobBoss(kind) {
    return mobCollectionByKind(kind).some((mob) => mob && mob.kind === kind && mob.isBoss && mob.health > 0);
  }

  function liveMobBossCount(kind) {
    return mobCollectionByKind(kind).filter((mob) => mob && mob.kind === kind && mob.isBoss && mob.health > 0).length;
  }

  function mobBossSpawnPressure(kind) {
    return Math.min(3, liveMobBossCount(kind));
  }

  function mobBossWarningFor(kind) {
    return mobBossWarnings[kind] || null;
  }

  function maybeScheduleMobBoss(kind) {
    const warning = mobBossWarningFor(kind);
    if (!warning || warning.active || !isMobBossUnlocked(kind) || hasLiveMobBoss(kind)) {
      return;
    }

    warning.active = true;
    warning.timer = mobBossWarningDuration;
    warning.lastNoticeSecond = -1;
    updateMobBossCountdownNotice(kind, true);
  }

  function updateMobBossCountdownNotice(kind, force) {
    const warning = mobBossWarningFor(kind);
    if (!warning || !warning.active) {
      return;
    }
    const seconds = Math.max(0, Math.ceil(warning.timer));
    if (!force && warning.lastNoticeSecond === seconds) {
      return;
    }
    warning.lastNoticeSecond = seconds;
    updateGroupedNotificationText(
      "mob-boss-warning:" + kind,
      mobBossLabel(kind) + " inbound in " + seconds + "s.",
      { lifetime: 1500 }
    );
  }

  function spawnBossByKind(kind, anchor, anchors) {
    const spawn = chooseMobSpawnPoint(kind, 420, 980, anchor, anchors);
    const boss = createBossMob(kind, spawn.x, spawn.y);
    mobCollectionByKind(kind).push(boss);
    spawnBossEscortMobs(kind, boss);
    maybeNotifyText(mobBossLabel(kind) + " has arrived.", {
      groupKey: "mob-boss-arrival:" + kind,
      lifetime: 4200
    });
  }

  function spawnBossEscortMobs(kind, boss) {
    const collection = mobCollectionByKind(kind);
    const escortCount = Math.floor(randomRange(mobBossEscortSpawnMin, mobBossEscortSpawnMax + 1));
    const startAngle = randomRange(0, Math.PI * 2);

    for (let i = 0; i < escortCount; i += 1) {
      const angle = startAngle + (Math.PI * 2 * i) / escortCount + randomRange(-0.28, 0.28);
      const distance = Math.max(boss.radius * 1.35, randomRange(115, 210));
      const escort = createMobByKind(
        kind,
        boss.x + Math.cos(angle) * distance,
        boss.y + Math.sin(angle) * distance
      );
      escort.vx += Math.cos(angle) * randomRange(38, 96) + finiteOr(boss.vx, 0) * 0.12;
      escort.vy += Math.sin(angle) * randomRange(38, 96) + finiteOr(boss.vy, 0) * 0.12;
      collection.push(escort);
    }
  }

  function randomEngineerBossSummonKind() {
    const options = mobTierOrder.filter((kind) => kind !== "engineer" && isMobBeaconReady(kind));
    if (!options.length) {
      return "";
    }
    return options[Math.floor(randomRange(0, options.length))] || "";
  }

  function collectionPushMob(kind, mob) {
    const collection = mobCollectionByKind(kind);
    if (Array.isArray(collection)) {
      collection.push(mob);
    }
  }

