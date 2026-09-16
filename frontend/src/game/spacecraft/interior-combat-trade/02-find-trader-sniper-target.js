  function findTraderSniperTarget(craft, originX, originY, range) {
    const door = craft.door || {};
    const doorX = finiteOr(door.x, -craft.width * 0.5);
    const doorSideLimit = doorX + finiteOr(door.depth, 140) + 240;
    let best = null;
    let bestScore = Infinity;
    let fallback = null;
    let fallbackDistance = Infinity;

    for (const mob of allCombatMobs()) {
      if (!mob || mob.health <= 0) {
        continue;
      }
      const distance = Math.hypot(mob.x - originX, mob.y - originY);
      if (distance > range) {
        continue;
      }
      if (distance < fallbackDistance) {
        fallback = mob;
        fallbackDistance = distance;
      }
      const local = spacecraftWorldToLocal(craft, mob.x, mob.y);
      if (local.x > doorSideLimit) {
        continue;
      }
      const score = distance + Math.max(0, local.x - doorX) * 1.4;
      if (score < bestScore) {
        best = mob;
        bestScore = score;
      }
    }

    return best || fallback;
  }

  function fireSpacecraftDefenseLaser(craft, originX, originY, target, options) {
    const settings = options || {};
    const speed = finiteOr(settings.speed, turretLaserSpeed);
    const leadTime = clamp(Math.hypot(target.x - originX, target.y - originY) / speed, 0, 0.9);
    const aim = normalize(
      target.x + finiteOr(target.vx, 0) * leadTime * 0.45 - originX,
      target.y + finiteOr(target.vy, 0) * leadTime * 0.45 - originY
    );
    const color = settings.color || { r: 255, g: 115, b: 173 };
    const muzzleDistance = finiteOr(settings.muzzleDistance, 36);

    playerLasers.push({
      x: originX + aim.x * muzzleDistance,
      y: originY + aim.y * muzzleDistance,
      vx: aim.x * speed + finiteOr(craft.vx, 0) * 0.12,
      vy: aim.y * speed + finiteOr(craft.vy, 0) * 0.12,
      radius: finiteOr(settings.radius, 4),
      length: finiteOr(settings.length, 42),
      color,
      life: finiteOr(settings.life, 1.15),
      maxLife: finiteOr(settings.life, 1.15),
      damage: finiteOr(settings.damage, turretLaserDamage),
      knockback: finiteOr(settings.knockback, turretLaserKnockback),
      hitMessage: mobName(target) + " picked off by " + craft.name + ".",
      sourceX: originX,
      sourceY: originY,
      piercesMobs: Boolean(settings.piercesMobs),
      weaponLabel: settings.weaponLabel || "ship turret"
    });

    sparks.push({
      x: originX + aim.x * muzzleDistance,
      y: originY + aim.y * muzzleDistance,
      radius: finiteOr(settings.sparkRadius, 26),
      color,
      life: 0.16,
      maxLife: 0.16
    });
    playSound(settings.sound || "turret", { throttleKey: settings.throttleKey || "spacecraftTurret" });
    return Math.atan2(aim.y, aim.x);
  }

  function updateSpacecraftTurrets(craft, dt) {
    const powered = spacecraftHasLiveKind(craft, "generator") || spacecraftHasLiveKind(craft, "battery");
    for (const component of craft.components) {
      if (component.kind !== "turret") {
        continue;
      }
      component.shootCooldown = Math.max(0, finiteOr(component.shootCooldown, 0) - dt);
      component.flash = Math.max(0, finiteOr(component.flash, 0) - dt);
      if (component.health <= 0 || component.disabledTimer > 0 || !powered) {
        component.disabledTimer = Math.max(0, finiteOr(component.disabledTimer, 0) - dt);
        continue;
      }

      const target = findSpacecraftDefenseTarget(craft, component.worldX, component.worldY, 760);
      if (target) {
        const targetAngle = Math.atan2(target.y - component.worldY, target.x - component.worldX);
        component.aimAngle += clamp(shortestAngleDelta(component.aimAngle, targetAngle), -4.4 * dt, 4.4 * dt);
        if (component.shootCooldown <= 0) {
          fireSpacecraftDefenseLaser(craft, component.worldX, component.worldY, target, {
            damage: 26,
            length: 46,
            throttleKey: "spacecraftTurret:" + craft.id + ":" + component.id
          });
          component.shootCooldown = 1.9;
          component.flash = 0.2;
        }
      } else {
        component.aimAngle += clamp(shortestAngleDelta(component.aimAngle, component.angle + craft.rotation), -2.2 * dt, 2.2 * dt);
      }
    }
  }

  function updateSpacecraftNpc(craft, npc, dt) {
    const trading = multiplayer.trade && multiplayer.trade.kind === "npc" && multiplayer.trade.peerId === npc.id;
    const door = craft.door || {};
    const perchX = finiteOr(door.x, -craft.width * 0.5) - 28;
    const perchFloor = spacecraftFloorForX(craft, perchX, finiteOr(door.y, npc.y));
    const perchY = perchFloor ? perchFloor.floorY - 48 : finiteOr(door.y, npc.y);
    const perchWorld = spacecraftLocalToWorld(craft, perchX, perchY);
    const nearbyTarget = !trading ? findTraderSniperTarget(craft, perchWorld.x, perchWorld.y, traderSniperRange) : null;

    npc.combatTarget = Boolean(nearbyTarget);
    npc.crouching = Boolean(nearbyTarget && !trading);

    if (!trading && nearbyTarget) {
      npc.targetX = perchX;
      npc.targetY = perchY;
    } else if (!trading && Math.hypot(npc.x - npc.targetX, npc.y - npc.targetY) < 12) {
      const rooms = craft.components.filter((component) => component.kind === "room" && component.health > 0);
      const room = rooms.length ? rooms[npc.wanderIndex % rooms.length] : null;
      if (room) {
        const seed = spacecraftStringSeed(npc.id) + craft.id * 17 + npc.wanderIndex * 31;
        npc.targetX = room.x + (spacecraftHashUnit(seed) - 0.5) * room.w * 0.62;
        const floor = spacecraftFloorForX(craft, npc.targetX, npc.y);
        npc.targetY = floor ? floor.floorY - 42 : room.y + room.h * 0.32;
        npc.wanderIndex += 1;
      }
    }

    if (!trading) {
      const dx = npc.targetX - npc.x;
      const dy = npc.targetY - npc.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const step = Math.min(dist, npc.speed * dt);
        npc.x += dx / dist * step;
        npc.y += dy / dist * step;
        npc.walkCycle += (2.3 + npc.speed * 0.035) * dt;
        npc.aimAngle = Math.atan2(dy, dx);
      }
    }

    const world = spacecraftLocalToWorld(craft, npc.x, npc.y);
    npc.worldX = world.x;
    npc.worldY = world.y;
    npc.sniperCooldown = Math.max(0, finiteOr(npc.sniperCooldown, 0) - dt);

    if (nearbyTarget) {
      npc.aimAngle = Math.atan2(nearbyTarget.y - npc.worldY, nearbyTarget.x - npc.worldX) - finiteOr(craft.rotation, 0);
    }

    if (!trading && nearbyTarget && npc.sniperCooldown <= 0) {
      const shotAngle = fireSpacecraftDefenseLaser(craft, npc.worldX, npc.worldY, nearbyTarget, {
        speed: 1340,
        damage: 42,
        length: 96,
        radius: 4,
        life: 2.35,
        knockback: 320,
        color: { r: 255, g: 213, b: 122 },
        weaponLabel: "trader sniper",
        sound: "laser",
        throttleKey: "spacecraftSniper:" + craft.id + ":" + npc.id,
        sparkRadius: 20,
        piercesMobs: true
      });
      npc.aimAngle = shotAngle - finiteOr(craft.rotation, 0);
      npc.sniperShotIndex += 1;
      npc.sniperCooldown = 2.1 + spacecraftHashUnit(spacecraftStringSeed(npc.id) + npc.sniperShotIndex * 13) * 1.1;
    }
  }

  function updateSpacecrafts(dt) {
    const departingCraftsToRemove = [];
    for (const craft of spacecrafts) {
      if (!craft.eventId) {
        craft.x += finiteOr(craft.vx, 0) * dt;
        craft.y += finiteOr(craft.vy, 0) * dt;
      } else if (craft.eventId === rogueTraderEventId && craft.rogueTraderDeparting) {
        if (updateRogueTraderDepartureCraft(craft, dt)) {
          departingCraftsToRemove.push(craft);
        }
      }
      updateSpacecraftWorldFields(craft);
      for (const component of craft.components) {
        component.flash = Math.max(0, finiteOr(component.flash, 0) - dt);
        component.disabledTimer = Math.max(0, finiteOr(component.disabledTimer, 0) - dt);
      }
      for (const npc of craft.npcs) {
        updateSpacecraftNpc(craft, npc, dt);
      }
      updateSpacecraftTurrets(craft, dt);
      updateSpacecraftWorldFields(craft);
    }
    for (const craft of departingCraftsToRemove) {
      removeSpacecraft(craft, craft.rogueTraderDepartureReason || "Rogue Trader departing.");
    }
  }

  function findNpcInteractionTargetById(spacecraftId, npcId) {
    const craft = findSpacecraftById(spacecraftId);
    if (!craft) {
      return null;
    }
    const npc = craft.npcs.find((candidate) => candidate.id === npcId) || null;
    return npc ? { kind: "npc", spacecraft: craft, npc, player: { x: npc.worldX, y: npc.worldY, radius: npc.radius, health: 100 }, publicName: npc.name } : null;
  }

  function findNearbyNpcInteractionTarget() {
    let best = null;
    let bestDistance = Infinity;
    for (const craft of spacecrafts) {
      updateSpacecraftWorldFields(craft);
      for (const npc of craft.npcs) {
        const distance = Math.hypot(npc.worldX - player.x, npc.worldY - player.y);
        if (distance <= playerInteractionRange && distance < bestDistance) {
          best = { kind: "npc", spacecraft: craft, npc, player: { x: npc.worldX, y: npc.worldY, radius: npc.radius, health: 100 }, publicName: npc.name };
          bestDistance = distance;
        }
      }
    }
    return best;
  }

  function openNpcTradeSession(craft, npc) {
    if (!craft || !npc) {
      return;
    }
    const offers = npc.offers.map((offer) => ({
      id: offer.id,
      pay: normalizeTradeOffer(offer.pay),
      receive: normalizeTradeOffer(offer.receive)
    }));
    multiplayer.trade = {
      kind: "npc",
      peerId: npc.id,
      peerName: npc.name,
      spacecraftId: craft.id,
      npcId: npc.id,
      npcOffers: offers,
      selectedOfferIndex: 0,
      localOffer: normalizeTradeOffer(offers[0] && offers[0].pay),
      remoteOffer: normalizeTradeOffer(offers[0] && offers[0].receive),
      localSent: true,
      remoteSent: true,
      localAccepted: false,
      remoteAccepted: true,
      completed: false
    };
    setPlayerInteractionMenu(false);
    renderTradePanel();
  }

  function selectedNpcTradeOffer(trade) {
    if (!trade || trade.kind !== "npc" || !Array.isArray(trade.npcOffers) || !trade.npcOffers.length) {
      return null;
    }
    const index = clamp(Math.floor(finiteOr(trade.selectedOfferIndex, 0)), 0, trade.npcOffers.length - 1);
    return trade.npcOffers[index] || null;
  }

  function selectNpcTradeOffer(index) {
    const trade = multiplayer.trade;
    if (!trade || trade.kind !== "npc" || !Array.isArray(trade.npcOffers) || !trade.npcOffers.length) {
      return;
    }
    trade.selectedOfferIndex = clamp(Math.floor(finiteOr(index, 0)), 0, trade.npcOffers.length - 1);
    const offer = selectedNpcTradeOffer(trade);
    trade.localOffer = normalizeTradeOffer(offer && offer.pay);
    trade.remoteOffer = normalizeTradeOffer(offer && offer.receive);
    trade.completed = false;
    renderTradePanel();
  }

  function completeNpcTradeOffer() {
    const trade = multiplayer.trade;
    const offer = selectedNpcTradeOffer(trade);
    if (!trade || trade.kind !== "npc" || !offer) {
      return;
    }
    trade.localOffer = normalizeTradeOffer(offer.pay);
    trade.remoteOffer = normalizeTradeOffer(offer.receive);
    if (!canAffordTradeOffer(trade.localOffer)) {
      updateTradeStatus();
      return;
    }

    for (const tech of techTypes) {
      techInventory[tech.key] = Math.max(0, Math.floor(techInventory[tech.key] || 0) - Math.max(0, Math.floor(trade.localOffer[tech.key] || 0)));
      techInventory[tech.key] += Math.max(0, Math.floor(trade.remoteOffer[tech.key] || 0));
    }

    trade.completed = false;
    updateTechUi();
    void savePersistentState({ includeWorld: false });
    renderTradePanel();
    playSound("trade");
    maybeNotifyText("Trade complete with " + trade.peerName + ".");
  }

  function describeTradeSide(offer) {
    const parts = [];
    for (const tech of techTypes) {
      const amount = Math.max(0, Math.floor(offer && offer[tech.key] || 0));
      if (amount > 0) {
        parts.push(amount + " " + tech.label.replace(" Tech", ""));
      }
    }
    return parts.length ? parts.join(", ") : "nothing";
  }
