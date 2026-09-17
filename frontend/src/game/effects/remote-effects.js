  function sendPartyHostEntityEffect(effect) {
    if (!isSharedWorldFollower() || !multiplayer.partyHostId || !effect) {
      return;
    }
    if (!joinedPlayerIsolationAllows("relayHostEntityEffects")) {
      return;
    }

    sendMultiplayer({
      type: "entity.effect",
      targetUniverseId: multiplayer.partyHostUniverseId || "solo:" + multiplayer.partyHostId,
      targetPlayerId: multiplayer.partyHostId,
      effect
    });
  }

  function sendThrottledRemoteEntityEffect(remote, key, cooldown, effect) {
    if (!remote || !key) {
      return;
    }

    if (!remote.effectCooldowns) {
      remote.effectCooldowns = new Map();
    }

    const now = performance.now();
    const nextAllowedAt = remote.effectCooldowns.get(key) || 0;
    if (now < nextAllowedAt) {
      return;
    }

    remote.effectCooldowns.set(key, now + cooldown * 1000);
    sendRemoteEntityEffect(remote, effect);
  }

  function updateRemoteInteractions(dt) {
    multiplayer.effectTimer = Math.max(0, multiplayer.effectTimer - dt);
    if (!multiplayer.connected || multiplayer.effectTimer > 0) {
      return;
    }

    const aim = getAim();
    const funnel = getFunnel(aim);
    const suctionActive = canUseSuctionControls() && isGadgetButtonPressed();
    const localGadgetState = suctionActive ? localGadgetStateForFrame(aim, funnel) : null;

    for (const remote of multiplayer.remoteUniverses.values()) {
      const snapshot = displaySnapshotFor(remote);
      if (!snapshot || !remote.transform || remote.transform.alpha < 0.72 || remote.transform.phase !== "overlap") {
        continue;
      }

      if (suctionActive && applyRemoteGadgetEffect(remote, localGadgetState, dt)) {
        multiplayer.effectTimer = remoteEffectInterval;
        return;
      }

      if (applyRemoteLaserEffect(remote)) {
        multiplayer.effectTimer = remoteEffectInterval;
        return;
      }
    }
  }

  function applyRemoteGadgetEffect(remote, localGadgetState, dt) {
    const snapshot = displaySnapshotFor(remote);
    const particlesSnapshot = snapshot && snapshot.world ? snapshot.world.particles || [] : [];
    const transform = displayTransformFor(remote);
    for (const particle of particlesSnapshot) {
      if (!isMappedBody(particle)) {
        continue;
      }

      const localBody = transformedRemoteEntity(particle, transform);
      if (!gadgetStateMayReachTarget(localGadgetState, localBody, 0)) {
        continue;
      }
      const beforeVx = localBody.vx;
      const beforeVy = localBody.vy;
      applyActorGadgetForces(localBody, localGadgetState, dt);

      const impulseX = localBody.vx - beforeVx;
      const impulseY = localBody.vy - beforeVy;
      if (Math.hypot(impulseX, impulseY) < 18) {
        continue;
      }

      sendRemoteEntityEffect(remote, {
        entityType: "particle",
        entityId: particle.id,
        sourceKind: "gadget",
        impulseX,
        impulseY
      });
      return true;
    }

    for (const mob of remoteCombatMobSnapshots(snapshot)) {
      if (!mob || mob.health <= 0) {
        continue;
      }

      const localMob = transformedRemoteEntity(mob, transform);
      if (!gadgetStateMayReachTarget(localGadgetState, localMob, 0)) {
        continue;
      }
      const beforeVx = localMob.vx;
      const beforeVy = localMob.vy;
      applyActorGadgetForces(localMob, localGadgetState, dt);

      const impulseX = localMob.vx - beforeVx;
      const impulseY = localMob.vy - beforeVy;
      if (Math.hypot(impulseX, impulseY) < 18) {
        continue;
      }

      sendRemoteEntityEffect(remote, {
        entityType: mob.kind,
        entityId: mob.id,
        sourceKind: "gadget",
        impulseX,
        impulseY
      });
      return true;
    }

    return false;
  }

  function applyRemoteLaserEffect(remote) {
    const snapshot = displaySnapshotFor(remote);
    if (!snapshot) {
      return false;
    }

    const transform = displayTransformFor(remote);
    const remoteMobs = remoteCombatMobSnapshots(snapshot);
    for (let i = playerLasers.length - 1; i >= 0; i -= 1) {
      const laser = playerLasers[i];
      const speed = Math.hypot(laser.vx, laser.vy) || 1;
      const dirX = laser.vx / speed;
      const dirY = laser.vy / speed;
      const tailX = laser.x - dirX * laser.length;
      const tailY = laser.y - dirY * laser.length;
      const piercesMobs = Boolean(laser.piercesMobs);
      const hitMobIds = Array.isArray(laser.hitMobIds) ? laser.hitMobIds : (laser.hitMobIds = []);
      let hitMob = false;

      for (const mob of remoteMobs) {
        if (!mob || mob.health <= 0 || mob.hitCooldown > 0) {
          continue;
        }
        const hitMobId = mob.kind + ":" + mob.id;
        if (hitMobIds.includes(hitMobId)) {
          continue;
        }

        const remoteMob = transformedRemoteEntity(mob, transform);
        const mobDist = distanceToSegment(remoteMob.x, remoteMob.y, tailX, tailY, laser.x, laser.y);
        if (mobDist >= remoteMob.radius + laser.radius) {
          continue;
        }

        if (mob.kind === "fighter" && finiteOr(mob.shieldCharge, 0) > 0) {
          reflectEntityVelocity(laser, dirX, dirY, 0.44, 260);
          laser.color = shadeColor(normalizeColorSnapshot(mob.color, { r: 119, g: 167, b: 255 }), 36);
          laser.damage = Math.max(8, (laser.damage || playerWeaponDefaults.damage) * 0.45);
          laser.life = Math.min(laser.life, 0.55);
          sparks.push({
            x: laser.x,
            y: laser.y,
            radius: 46,
            color: laser.color,
            life: 0.28,
            maxLife: 0.28
          });
          return true;
        }

        sendRemoteEntityEffect(remote, {
          entityType: mob.kind,
          entityId: mob.id,
          sourceKind: "player",
          damage: laser.damage || playerWeaponDefaults.damage,
          impulseX: dirX * (laser.knockback || playerWeaponDefaults.knockback),
          impulseY: dirY * (laser.knockback || playerWeaponDefaults.knockback),
          color: laser.color
        });
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 38,
          color: laser.color,
          life: 0.24,
          maxLife: 0.24
        });
        hitMobIds.push(hitMobId);
        hitMob = true;
        if (!piercesMobs) {
          playerLasers.splice(i, 1);
          return true;
        }
      }

      if (!snapshot.player) {
        if (hitMob) {
          return true;
        }
        continue;
      }

      const remotePlayer = transformedRemoteEntity(snapshot.player, transform);
      const playerDist = distanceToPlayerHurtboxSegment(remotePlayer, tailX, tailY, laser.x, laser.y);

      if (canDamageRemotePlayer(remote) && playerDist < (remotePlayer.radius || 34) * playerProjectileHurtboxScale + laser.radius) {
        sendRemoteEntityEffect(remote, {
          entityType: "player",
          sourceKind: "player",
          pvpOnly: true,
          cause: "Contact fire",
          damage: laser.damage || playerWeaponDefaults.damage,
          impulseX: dirX * (laser.knockback || playerWeaponDefaults.knockback),
          impulseY: dirY * (laser.knockback || playerWeaponDefaults.knockback),
          color: laser.color
        });
        sparks.push({
          x: laser.x,
          y: laser.y,
          radius: 42,
          color: laser.color,
          life: 0.28,
          maxLife: 0.28
        });
        playerLasers.splice(i, 1);
        return true;
      }

      if (hitMob) {
        return true;
      }
    }

    return false;
  }

  function applyRemoteEntityEffect(message) {
    const effect = message.effect && typeof message.effect === "object" ? message.effect : null;
    if (!effect || message.targetUniverseId !== multiplayer.universeId) {
      return;
    }

    const impulseX = finiteOr(effect.impulseX, 0);
    const impulseY = finiteOr(effect.impulseY, 0);
    const damage = Math.max(0, finiteOr(effect.damage, 0));
    const toolDisable = Math.max(0, finiteOr(effect.toolDisable, 0));

    if (effect.entityType === "player") {
      if (!canReceiveRemotePlayerEffect(message, effect)) {
        return;
      }
      if (multiplayer.partyRespawnInvulnerableTimer > 0 && damage > 0) {
        return;
      }
      if (player.landed && (Math.abs(impulseX) + Math.abs(impulseY) > 80 || damage > 0)) {
        detachFromBody(150);
      }
      player.vx += impulseX;
      player.vy += impulseY;
      if (damage > 0 && player.hitCooldown <= 0) {
        damageLocalPlayer(damage, {
          cause: remoteEffectCause(effect, normalizeEntityEffectSourceKind(effect) === "mob" ? "Hostile contact" : "Contact fire"),
          cooldown: 0.7,
          flash: 0.3
        });
        maybeNotifyText("Hull hit by " + remoteEffectCause(effect, message.fromPlayerId || "a contact") + ".");
      }
      if (toolDisable > 0) {
        jamLocalPlayerTools(toolDisable);
      }
      return;
    }

    const target = findOwnedEntity(effect.entityType, effect.entityId);
    if (!target) {
      return;
    }

    if (target.kind && (Math.abs(impulseX) + Math.abs(impulseY) > 40 || damage > 0)) {
      target.landed = null;
      target.residentTier = null;
    }
    target.vx += impulseX;
    target.vy += impulseY;
    if (damage > 0 && Number.isFinite(target.health)) {
      const color = normalizeColorSnapshot(effect.color, { r: 255, g: 115, b: 173 });
      if (target.kind) {
        damageMob(target, damage, color, mobName(target) + " dropped by " + (message.fromPlayerId || "a contact") + ".", {
          sourcePlayerId: message.fromPlayerId || ""
        });
      } else {
        target.health = Math.max(0, target.health - damage);
        target.hitCooldown = Math.max(target.hitCooldown || 0, 0.45);
        target.flash = Math.max(target.flash || 0, 0.24);
      }
    }
  }

  function findOwnedEntity(entityType, entityId) {
    const id = Number(entityId);
    const findById = (list) => list.find((entity) => entity.id === id) || null;

    if (entityType === "particle") {
      return findById(particles);
    }
    if (entityType === "alienoid") {
      return findById(rivals);
    }
    if (entityType === "ufo") {
      return findById(ufos);
    }
    if (entityType === "rambot") {
      return findById(rambots);
    }
    if (entityType === "engineer") {
      return findById(engineers);
    }
    if (entityType === "tesla") {
      return findById(teslas);
    }
    if (entityType === "rocket") {
      return findById(rockets);
    }
    if (entityType === "fighter") {
      return findById(fighters);
    }
    if (entityType === "beacon" || entityType === "mobBeacon") {
      return findById(mobBeacons);
    }
    return null;
  }
