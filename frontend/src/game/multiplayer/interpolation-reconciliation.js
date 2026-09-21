  function interpolateRemoteSnapshot(fromSnapshot, toSnapshot, progress, lead) {
    const fromWorld = fromSnapshot && fromSnapshot.world ? fromSnapshot.world : {};
    const toWorld = toSnapshot && toSnapshot.world ? toSnapshot.world : {};

    return {
      player: interpolateRemoteEntity(
        fromSnapshot && fromSnapshot.player,
        toSnapshot && toSnapshot.player,
        progress,
        lead,
        { angleKeys: ["cameraRoll", "aimAngle", "aimLocalAngle", "visualAimLocalAngle"], scalarKeys: ["radius", "health", "maxHealth", "energy", "maxEnergy", "toolDisabledTimer", "walkCycle"] }
      ),
      world: {
        particles: interpolateRemoteEntityList(fromWorld.particles, toWorld.particles, progress, lead, {
          scalarKeys: ["mass", "radius", "energy", "maxEnergy"]
        }).map(refreshInterpolatedBody),
        alienoids: interpolateRemoteEntityList(fromWorld.alienoids, toWorld.alienoids, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer"]
        }),
        ufos: interpolateRemoteEntityList(fromWorld.ufos, toWorld.ufos, progress, lead, {
          angleKeys: ["rotation", "beamAngle"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer", "tractorDisabledTimer"]
        }),
        rambots: interpolateRemoteEntityList(fromWorld.rambots, toWorld.rambots, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer"]
        }),
        engineers: interpolateRemoteEntityList(fromWorld.engineers, toWorld.engineers, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer", "healPulse"]
        }),
        teslas: interpolateRemoteEntityList(fromWorld.teslas, toWorld.teslas, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer", "lightningWarmup", "lightningFlash"]
        }),
        rockets: interpolateRemoteEntityList(fromWorld.rockets, toWorld.rockets, progress, lead, {
          angleKeys: ["rotation", "scannerAngle"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer", "scanProgress", "lockTimer", "blastTimer", "volleyTimer", "volleyShots"]
        }),
        fighters: interpolateRemoteEntityList(fromWorld.fighters, toWorld.fighters, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "health", "maxHealth", "disabledTimer", "shieldCharge", "shieldActive", "shootCooldown"]
        }),
        structures: interpolateRemoteEntityList(fromWorld.structures, toWorld.structures, progress, lead, {
          angleKeys: ["angle", "linkedAngle", "aimAngle"],
          scalarKeys: ["x2", "y2", "deploy", "thrustAmount", "thrustDirection", "health", "maxHealth", "disabledTimer", "flash", "restLength", "restCenterDx", "restCenterDy", "bridgeAngleOffset", "bridgeLinkedAngleOffset", "linkedSurfaceOffset", "burstTimer", "burstCooldown", "missileCharge", "lockTimer", "beepTimer", "targetX", "targetY", "targetCount", "survivalAggroAlertTimer"]
        }),
        rivalProjectiles: interpolateRemoteEntityList(fromWorld.rivalProjectiles, toWorld.rivalProjectiles, progress, lead, {
          scalarKeys: ["radius", "length", "life", "maxLife"]
        }),
        techPickups: interpolateRemoteEntityList(fromWorld.techPickups, toWorld.techPickups, progress, lead, {
          angleKeys: ["rotation"],
          scalarKeys: ["radius", "life", "maxLife"]
        }),
        healthPickups: interpolateRemoteEntityList(fromWorld.healthPickups, toWorld.healthPickups, progress, lead, {
          scalarKeys: ["radius", "heal", "life", "maxLife"]
        })
      }
    };
  }

  function interpolateRemoteEntityList(fromList, toList, progress, lead, options) {
    const previousById = new Map();
    const sourceList = Array.isArray(fromList) ? fromList : [];
    const targetList = Array.isArray(toList) ? toList : [];

    for (const entity of sourceList) {
      if (entity && entity.id !== undefined && entity.id !== null) {
        previousById.set(String(entity.id), entity);
      }
    }

    return targetList
      .map((target) => {
        const previous = target && target.id !== undefined && target.id !== null
          ? previousById.get(String(target.id))
          : null;
        return interpolateRemoteEntity(previous, target, progress, lead, options);
      })
      .filter(Boolean);
  }

  function interpolateRemoteEntity(fromEntity, toEntity, progress, lead, options) {
    const source = toEntity || fromEntity;
    if (!source) {
      return null;
    }

    const result = cloneRemoteEntity(source);
    const fromX = finiteOr(fromEntity && fromEntity.x, finiteOr(source.x, 0));
    const fromY = finiteOr(fromEntity && fromEntity.y, finiteOr(source.y, 0));
    const toX = finiteOr(toEntity && toEntity.x, fromX);
    const toY = finiteOr(toEntity && toEntity.y, fromY);
    result.x = fromX + (toX - fromX) * progress + finiteOr(source.vx, 0) * lead;
    result.y = fromY + (toY - fromY) * progress + finiteOr(source.vy, 0) * lead;

    const scalarKeys = options && Array.isArray(options.scalarKeys) ? options.scalarKeys : [];
    for (const key of scalarKeys) {
      if (fromEntity && toEntity && Number.isFinite(Number(fromEntity[key])) && Number.isFinite(Number(toEntity[key]))) {
        result[key] = finiteOr(fromEntity[key], 0) + (finiteOr(toEntity[key], 0) - finiteOr(fromEntity[key], 0)) * progress;
      }
    }

    const angleKeys = options && Array.isArray(options.angleKeys) ? options.angleKeys : [];
    for (const key of angleKeys) {
      if (fromEntity && toEntity && Number.isFinite(Number(fromEntity[key])) && Number.isFinite(Number(toEntity[key]))) {
        const fromAngle = finiteOr(fromEntity[key], 0);
        result[key] = fromAngle + shortestAngleDelta(fromAngle, finiteOr(toEntity[key], fromAngle)) * progress;
      }
    }

    result.landed = interpolateRemoteLanding(fromEntity && fromEntity.landed, toEntity && toEntity.landed, progress, source.landed);
    return result;
  }

  function interpolateRemoteLanding(fromLanding, toLanding, progress, fallback) {
    if (!fromLanding || !toLanding || fromLanding.bodyId !== toLanding.bodyId) {
      return fallback ? { ...fallback } : null;
    }

    const angle = fromLanding.angle + shortestAngleDelta(fromLanding.angle, toLanding.angle) * progress;
    return {
      bodyId: toLanding.bodyId,
      bridgeId: toLanding.bridgeId || 0,
      bridgeT: finiteOr(fromLanding.bridgeT, 0) + (finiteOr(toLanding.bridgeT, 0) - finiteOr(fromLanding.bridgeT, 0)) * progress,
      bridgeSide: finiteOr(toLanding.bridgeSide, 1) < 0 ? -1 : 1,
      bridgeInputSign: finiteOr(toLanding.bridgeInputSign, 1) < 0 ? -1 : 1,
      angle,
      walkSpeed: finiteOr(fromLanding.walkSpeed, 0) + (finiteOr(toLanding.walkSpeed, 0) - finiteOr(fromLanding.walkSpeed, 0)) * progress,
      walkCycle: finiteOr(fromLanding.walkCycle, 0) + (finiteOr(toLanding.walkCycle, 0) - finiteOr(fromLanding.walkCycle, 0)) * progress
    };
  }

  function cloneRemoteEntity(entity) {
    return {
      ...entity,
      color: entity.color ? { ...entity.color } : entity.color,
      statusEffects: entity.statusEffects ? { ...entity.statusEffects } : entity.statusEffects,
      landed: entity.landed ? { ...entity.landed } : null
    };
  }

  function normalizeRemotePlayerStatusEffects(source, legacyDisabledTimer) {
    const effects = source && typeof source === "object" ? source : {};
    return {
      disabled: Math.max(0, finiteOr(effects.disabled, legacyDisabledTimer))
    };
  }

  function refreshInterpolatedBody(body) {
    if (!body) {
      return null;
    }

    body.mass = Math.max(1, finiteOr(body.mass, 1));
    body.tier = tierForMassAndStellarOutcome(body.mass, body.stellarOutcome);
    if (body.tier.name === "particle") body.ownerPlayerId = "";
    body.radius = radiusFromMassForTier(body.mass, body.tier);
    normalizeBodyEnergy(body);
    return body;
  }

  function clearOverlap(overlapId) {
    for (const [universeId, remote] of multiplayer.remoteUniverses) {
      if (remote.overlapId === overlapId) {
        multiplayer.remoteUniverses.delete(universeId);
      }
    }
    if (overlapId && multiplayer.roomId === overlapId) {
      clearCrazyGamesRoomState("overlap-ended");
    }
  }

  function pruneRemoteUniverses() {
    const now = performance.now();
    for (const [universeId, remote] of multiplayer.remoteUniverses) {
      if (now - remote.seenAt > remoteStaleMs) {
        multiplayer.remoteUniverses.delete(universeId);
      }
    }
  }

  function transformedRemoteEntity(entity, transform) {
    const transformed = Object.assign({}, entity, {
      x: finiteOr(entity.x, 0) + transform.offsetX,
      y: finiteOr(entity.y, 0) + transform.offsetY
    });
    if (Number.isFinite(Number(entity.x2)) && Number.isFinite(Number(entity.y2))) {
      transformed.x2 = finiteOr(entity.x2, 0) + transform.offsetX;
      transformed.y2 = finiteOr(entity.y2, 0) + transform.offsetY;
    }
    return transformed;
  }

  function isRemoteUniverseInteractive(remote) {
    const transform = displayTransformFor(remote);
    return Boolean(transform && transform.alpha >= 0.72 && transform.phase === "overlap");
  }

  function remoteCombatMobSnapshots(snapshot) {
    const world = snapshot && snapshot.world ? snapshot.world : {};
    return []
      .concat(world.alienoids || [])
      .concat(world.ufos || [])
      .concat(world.rambots || [])
      .concat(world.engineers || [])
      .concat(world.teslas || [])
      .concat(world.rockets || [])
      .concat(world.fighters || []);
  }

  let remoteContactCache = null;

  function remoteContactCacheForFrame() {
    const now = performance.now();
    if (
      remoteContactCache &&
      remoteContactCache.time === now &&
      remoteContactCache.remoteCount === multiplayer.remoteUniverses.size
    ) {
      return remoteContactCache;
    }

    const sharedBodies = [];
    const combatPlayers = [];
    const sharedBodyRange = multiplayer.bubbleRadius + 1800;
    const sharedBodyRangeSq = sharedBodyRange * sharedBodyRange;
    for (const remote of multiplayer.remoteUniverses.values()) {
      if (!isRemoteUniverseInteractive(remote)) {
        continue;
      }

      const snapshot = displaySnapshotFor(remote);
      const transform = displayTransformFor(remote);
      if (!snapshot || !transform) {
        continue;
      }

      const world = snapshot.world || {};
      if (Array.isArray(world.particles)) {
        for (const particle of world.particles) {
          if (sharedBodies.length >= remoteSharedBodyContactLimit) {
            break;
          }
          if (!isMappedBody(particle)) {
            continue;
          }

          const body = transformedRemoteEntity(particle, transform);
          const dx = body.x - player.x;
          const dy = body.y - player.y;
          if (dx * dx + dy * dy > sharedBodyRangeSq) {
            continue;
          }
          body.remoteContactRadius = body.tier && body.tier.solid ? solidBodyContactRadius(body) : finiteOr(body.radius, 0) * 1.08;

          sharedBodies.push({
            remote,
            source: particle,
            body
          });
        }
      }

      if (snapshot.player && snapshot.player.health > 0) {
        combatPlayers.push({
          local: false,
          remote,
          player: transformedRemoteEntity(snapshot.player, transform),
          publicName: remote.publicName || snapshot.player.name || "Contact"
        });
      }
    }

    remoteContactCache = {
      time: now,
      remoteCount: multiplayer.remoteUniverses.size,
      sharedBodies,
      combatPlayers
    };
    return remoteContactCache;
  }

  function collectRemoteSharedBodies() {
    return remoteContactCacheForFrame().sharedBodies;
  }

  function collectRemoteCombatPlayers() {
    return remoteContactCacheForFrame().combatPlayers;
  }

  function collectCombatPlayerTargets() {
    const targets = [
      {
        local: true,
        remote: null,
        player,
        publicName: player.name || "Player"
      }
    ].concat(collectRemoteCombatPlayers());
    if (typeof familiarCombatTargets === "function") {
      targets.push(...familiarCombatTargets());
    }
    return targets;
  }

  function nearestCombatPlayerTarget(x, y) {
    let best = null;
    let bestDistance = Infinity;
    const localPlayerInsideSpacecraft = isPlayerInsideSpacecraft();
    const spacecraftTarget = localPlayerInsideSpacecraft ? nearestSpacecraftCombatTarget(x, y, 2200) : null;

    for (const target of collectCombatPlayerTargets()) {
      if (!target.player || target.player.health <= 0) {
        continue;
      }
      if (target.local && localPlayerInsideSpacecraft) {
        continue;
      }

      const distance = Math.hypot(target.player.x - x, target.player.y - y);
      if (distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    }

    if (spacecraftTarget) {
      const spacecraftDistance = Math.hypot(spacecraftTarget.player.x - x, spacecraftTarget.player.y - y);
      if (!best || spacecraftDistance < bestDistance * 1.28 + 420) {
        return spacecraftTarget;
      }
    }

    return best || {
      local: true,
      remote: null,
      player,
      publicName: player.name || "Player"
    };
  }

  function sendRemoteEntityEffect(remote, effect) {
    if (!remote || !remote.universeId || !effect) {
      return;
    }

    sendMultiplayer({
      type: "entity.effect",
      targetUniverseId: remote.universeId,
      targetPlayerId: remote.playerId,
      effect
    });
  }
