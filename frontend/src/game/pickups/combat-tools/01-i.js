    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) {
        sparks.splice(i, 1);
      }
    }
    const sparkBudget = isPartySessionActive() || multiplayer.remoteUniverses.size ? 96 : 150;
    if (sparks.length > sparkBudget) {
      sparks.splice(0, sparks.length - sparkBudget);
    }
  }

  function playerPickupDistance(pickup) {
    const screenDelta = rotatePoint(pickup.x - player.x, pickup.y - player.y, cameraRoll);
    const local = rotatePoint(screenDelta.x, screenDelta.y, -playerSurfaceRotation());
    return distanceToSegment(local.x, local.y, 0, -48, 0, 88);
  }

  function playerCanCollectPickup(pickup) {
    return playerPickupDistance(pickup) < pickup.radius + 43;
  }

  function awardHealthPickup(pickup) {
    if (!pickup) {
      return;
    }
    player.health = Math.min(player.maxHealth, player.health + Math.max(0, finiteOr(pickup.heal, healthPickupHeal)));
    playSound("pickupHealth");
    sparks.push({
      x: player.x,
      y: player.y,
      radius: 46,
      color: { r: 101, g: 245, b: 154 },
      life: 0.26,
      maxLife: 0.26
    });
  }

  function updateHealthPickups(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const localGadgetState = localGadgetStateForFrame(aim, funnel);
    const suctionActive = localGadgetState.active;

    for (let i = healthPickups.length - 1; i >= 0; i -= 1) {
      const pickup = healthPickups[i];
      pickup.life -= dt;

      if (suctionActive && gadgetStateMayReachTarget(localGadgetState, pickup, 0)) {
        applyActorGadgetForces(pickup, localGadgetState, dt, { captureInFunnel: false, pullTowardActor: true });
      }

      const toPlayerX = player.x - pickup.x;
      const toPlayerY = player.y - pickup.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;
      const canHeal = player.health < player.maxHealth;

      if (canHeal && dist < 320) {
        const pull = clamp(1 - dist / 320, 0, 1);
        pickup.vx += (toPlayerX / dist) * (180 + pull * 520) * pull * dt;
        pickup.vy += (toPlayerY / dist) * (180 + pull * 520) * pull * dt;
      }

      pickup.vx *= Math.pow(0.28, dt);
      pickup.vy *= Math.pow(0.28, dt);
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;

      if (canHeal && playerCanCollectPickup(pickup)) {
        awardHealthPickup(pickup);
        healthPickups.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      const cullDistance = Math.max(width, height) * 1.55 + 900;
      if (pickup.life <= 0 || fromPlayer > cullDistance) {
        healthPickups.splice(i, 1);
      }
    }
  }

  function updateTechPickups(dt) {
    const aim = getAim();
    const funnel = getFunnel(aim);
    const localGadgetState = localGadgetStateForFrame(aim, funnel);
    const suctionActive = localGadgetState.active;

    for (let i = techPickups.length - 1; i >= 0; i -= 1) {
      const pickup = techPickups[i];
      pickup.life -= dt;
      pickup.rotation += (1.4 + Math.sin(pickup.wobble) * 0.4) * dt;

      if (suctionActive && gadgetStateMayReachTarget(localGadgetState, pickup, 0)) {
        applyActorGadgetForces(pickup, localGadgetState, dt, { captureInFunnel: false });
      }

      const toPlayerX = player.x - pickup.x;
      const toPlayerY = player.y - pickup.y;
      const dist = Math.hypot(toPlayerX, toPlayerY) || 1;

      if (dist < 360) {
        const pull = clamp(1 - dist / 360, 0, 1);
        pickup.vx += (toPlayerX / dist) * (150 + pull * 470) * pull * dt;
        pickup.vy += (toPlayerY / dist) * (150 + pull * 470) * pull * dt;
      }

      pickup.vx *= Math.pow(0.32, dt);
      pickup.vy *= Math.pow(0.32, dt);
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;

      if (playerCanCollectPickup(pickup)) {
        if (isPartySessionActive()) {
          if (!requestTechPickupClaim(pickup)) {
            continue;
          }
        } else {
          awardTechPickup(pickup);
        }
        techPickups.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      const cullDistance = Math.max(width, height) * 1.55 + 900;
      if (pickup.life <= 0 || fromPlayer > cullDistance) {
        techPickups.splice(i, 1);
      }
    }
  }

  function updateFollowerTechPickups() {
    for (let i = techPickups.length - 1; i >= 0; i -= 1) {
      const pickup = techPickups[i];
      if (!pickup || multiplayer.claimedTechPickupIds.has(String(pickup.id))) {
        techPickups.splice(i, 1);
        continue;
      }
      if (playerCanCollectPickup(pickup)) {
        if (!requestTechPickupClaim(pickup)) {
          continue;
        }
        techPickups.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      const cullDistance = Math.max(width, height) * 1.55 + 900;
      if (pickup.life <= 0 || fromPlayer > cullDistance) {
        techPickups.splice(i, 1);
      }
    }
  }

  function updateFollowerHealthPickups() {
    for (let i = healthPickups.length - 1; i >= 0; i -= 1) {
      const pickup = healthPickups[i];
      if (!pickup || multiplayer.claimedHealthPickupIds.has(String(pickup.id))) {
        healthPickups.splice(i, 1);
        continue;
      }
      if (player.health < player.maxHealth && playerCanCollectPickup(pickup)) {
        if (!requestHealthPickupClaim(pickup)) {
          continue;
        }
        healthPickups.splice(i, 1);
        continue;
      }

      const fromPlayer = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      const cullDistance = Math.max(width, height) * 1.55 + 900;
      if (pickup.life <= 0 || fromPlayer > cullDistance) {
        healthPickups.splice(i, 1);
      }
    }
  }

  function requestTechPickupClaim(pickup) {
    if (!pickup || multiplayer.claimedTechPickupIds.has(String(pickup.id))) {
      return false;
    }
    multiplayer.claimedTechPickupIds.add(String(pickup.id));
    const sent = sendMultiplayer({
      type: "party.tech.pickup",
      pickupId: pickup.id,
      key: pickup.key,
      x: pickup.x,
      y: pickup.y
    });
    if (!sent) {
      multiplayer.claimedTechPickupIds.delete(String(pickup.id));
    }
    return sent;
  }

  function requestHealthPickupClaim(pickup) {
    if (!pickup || multiplayer.claimedHealthPickupIds.has(String(pickup.id))) {
      return false;
    }
    multiplayer.claimedHealthPickupIds.add(String(pickup.id));
    const sent = sendMultiplayer({
      type: "party.health.pickup",
      pickupId: pickup.id,
      heal: pickup.heal,
      x: pickup.x,
      y: pickup.y
    });
    if (!sent) {
      multiplayer.claimedHealthPickupIds.delete(String(pickup.id));
      return false;
    }
    clearLocalPartyPhysicsSession("healthPickup", pickup.id);
    return true;
  }

  function awardTechPickup(pickup) {
    if (!pickup) {
      return;
    }
    techInventory[pickup.key] = Math.max(0, Math.floor(techInventory[pickup.key] || 0)) + 1;
    lifeStats.techCollected += 1;
    updateTechUi();
    playSound("pickupTech");
    maybeNotifyText("Gained 1 " + pickup.label, {
      groupKey: "tech-gained:" + pickup.key,
      format: function (count) {
        return "Gained " + count + " " + pickup.label;
      }
    });
    sparks.push({
      x: pickup.x,
      y: pickup.y,
      radius: 42,
      color: hslToRgb(330, 0.88, 0.64),
      life: 0.28,
      maxLife: 0.28
    });
  }

  function removeTechPickupById(pickupId) {
    const id = String(pickupId || "");
    if (!id) {
      return null;
    }
    const index = techPickups.findIndex((pickup) => String(pickup.id) === id);
    if (index < 0) {
      return null;
    }
    const pickup = techPickups[index];
    techPickups.splice(index, 1);
    return pickup;
  }

  function applyTechPickupClaim(message) {
    const pickupId = String(message && message.pickupId || "");
    if (!pickupId) {
      return;
    }
    const pickup = removeTechPickupById(pickupId) || techPickupFromClaim(message);
    multiplayer.claimedTechPickupIds.add(pickupId);
    if (message.claimedByPlayerId === player.id) {
      awardTechPickup(pickup);
    }
  }

  function removeHealthPickupById(pickupId) {
    const id = String(pickupId || "");
    if (!id) {
      return null;
    }
    const index = healthPickups.findIndex((pickup) => String(pickup.id) === id);
    if (index < 0) {
      return null;
    }
    const pickup = healthPickups[index];
    healthPickups.splice(index, 1);
    return pickup;
  }

  function applyHealthPickupClaim(message) {
    const pickupId = String(message && message.pickupId || "");
    if (!pickupId) {
      return;
    }
    const pickup = removeHealthPickupById(pickupId) || healthPickupFromClaim(message);
    multiplayer.claimedHealthPickupIds.add(pickupId);
    clearLocalPartyPhysicsSession("healthPickup", pickupId);
    if (message.claimedByPlayerId === player.id) {
      awardHealthPickup(pickup);
    }
  }

  function healthPickupFromClaim(message) {
    return {
      id: Math.max(1, Math.floor(finiteOr(message && message.pickupId, nextHealthPickupId))),
      x: finiteOr(message && message.x, player.x),
      y: finiteOr(message && message.y, player.y),
      vx: 0,
      vy: 0,
      radius: 14,
      heal: clamp(finiteOr(message && message.heal, healthPickupHeal), 1, 100),
      life: 0,
      maxLife: healthPickupLifetime,
      wobble: 0
    };
  }

  function techPickupFromClaim(message) {
    const tech = techTypes.find((candidate) => candidate.key === (message && message.key)) || techTypes[0];
    return {
      id: Math.max(1, Math.floor(finiteOr(message && message.pickupId, nextTechPickupId))),
      key: tech.key,
      label: tech.label,
      color: tech.color,
      x: finiteOr(message && message.x, player.x),
      y: finiteOr(message && message.y, player.y),
      vx: 0,
      vy: 0,
      radius: 15,
      life: 0,
      maxLife: techPickupLifetime,
      rotation: 0,
      wobble: 0
    };
  }

  function damageLocalPlayerOnStarContact(particle, nx, ny) {
    if (!isStarBody(particle) || player.hitCooldown > 0) {
      return;
    }

    player.vx += nx * starContactKnockback;
    player.vy += ny * starContactKnockback;
    if (damageLocalPlayer(starContactDamagePerSecond * starContactDamageCooldown, {
      cause: "Star contact",
      cooldown: starContactDamageCooldown,
      flash: 0.42
    })) {
      return;
    }
    maybeNotifyText("Star plasma is burning your hull.", { groupKey: "star-contact" });
    sparks.push({
      x: player.x - nx * player.radius * 0.35,
      y: player.y - ny * player.radius * 0.35,
      radius: 52,
      color: { r: 255, g: 196, b: 76 },
      life: 0.28,
      maxLife: 0.28,
      vx: nx * 90,
      vy: ny * 90
    });
  }

  function resolvePlayerBodyCollisions() {
    for (const particle of particles) {
      if (!particle.tier.solid) {
        continue;
      }
      if (player.landed && player.landed.bodyId === particle.id && !isStarBody(particle)) {
        continue;
      }

      const contact = playerCircleHurtboxContact(player, particle.x, particle.y, solidBodyContactRadius(particle), playerBodyHurtboxScale);
      if (!contact) {
        continue;
      }

      const nx = contact.nx;
      const ny = contact.ny;
      const overlap = contact.overlap;
      const bodyShare = clamp(4 / (particle.mass + 4), 0.03, 0.28);
      const playerShare = 1 - bodyShare;

      if (isSelfVacuumPulledBodyContact(player, particle, nx, ny)) {
        markSurvivalCampBodyMovedByPlayer(particle, player.id || "");
        resolveSelfVacuumPulledBodyContact(player, particle, nx, ny, overlap, 0.88);
        continue;
      }

      player.x += nx * overlap * playerShare;
      player.y += ny * overlap * playerShare;
      particle.x -= nx * overlap * bodyShare;
      particle.y -= ny * overlap * bodyShare;
      markSurvivalCampBodyMovedByPlayer(particle, player.id || "");

      const relativeVelocity = (player.vx - particle.vx) * nx + (player.vy - particle.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.92;
        const pointX = particle.x + nx * bodyAngularInertiaRadius(particle);
        const pointY = particle.y + ny * bodyAngularInertiaRadius(particle);
        player.vx += nx * impulse * 0.72;
        player.vy += ny * impulse * 0.72;
        applyBodyVelocityChangeAtPoint(particle, -nx * impulse * bodyShare, -ny * impulse * bodyShare, pointX, pointY, bodyConstraintTorqueResponse);
      }
      damageLocalPlayerOnStarContact(particle, nx, ny);
    }
  }

  function resolveFollowerPlayerBodyCollisions() {
    for (const particle of particles) {
      if (!particle.tier.solid) {
        continue;
      }
      if (player.landed && player.landed.bodyId === particle.id && !isStarBody(particle)) {
        continue;
      }

      const contact = playerCircleHurtboxContact(player, particle.x, particle.y, solidBodyContactRadius(particle), playerBodyHurtboxScale);
      if (!contact) {
        continue;
      }

      const nx = contact.nx;
      const ny = contact.ny;
      const overlap = contact.overlap;

      if (isSelfVacuumPulledBodyContact(player, particle, nx, ny)) {
        markSurvivalCampBodyMovedByPlayer(particle, player.id || "");
        resolveSelfVacuumPulledBodyContact(player, particle, nx, ny, overlap, 0.86);
        continue;
      }

      player.x += nx * overlap;
      player.y += ny * overlap;

      const relativeVelocity = (player.vx - particle.vx) * nx + (player.vy - particle.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.72;
        player.vx += nx * impulse;
        player.vy += ny * impulse;
      }
      damageLocalPlayerOnStarContact(particle, nx, ny);
    }
  }

  function allCombatMobs() {
    return rivals.concat(ufos, rambots, engineers, teslas, rockets, fighters, mobBeacons);
  }

  function isPlayerTeamMob(mob) {
    return Boolean(mob && mob.team === "player");
  }

  function hostileCombatMobs() {
    return allCombatMobs().filter((mob) => mob && mob.health > 0 && !isPlayerTeamMob(mob));
  }

  function familiarCombatMobs() {
    return allCombatMobs().filter((mob) => mob && mob.health > 0 && isPlayerTeamMob(mob));
  }

  function localFamiliarOwnerId() {
    return String(player && player.id || "local-player");
  }

  function isLocalPlayerFamiliar(mob) {
    if (!isPlayerTeamMob(mob)) {
      return false;
    }
    const ownerId = String(mob.familiarOwnerPlayerId || "");
    return !ownerId || ownerId === localFamiliarOwnerId();
  }

  function hasActiveLocalPlayerFamiliar() {
    return familiarCombatMobs().some(isLocalPlayerFamiliar);
  }

  function localPlayerFamiliars() {
    return familiarCombatMobs().filter(isLocalPlayerFamiliar);
  }
