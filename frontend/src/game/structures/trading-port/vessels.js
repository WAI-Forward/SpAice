  function cssHexColorToRgb(hex, fallback) {
    const text = String(hex || "").trim();
    const match = text.match(/^#([0-9a-f]{6})$/i);
    if (!match) {
      return fallback || { r: 255, g: 184, b: 107 };
    }
    const value = Number.parseInt(match[1], 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function findAutomatedTradingPortMatch(sourceStructure) {
    normalizeTradingPortState(sourceStructure);
    if (sourceStructure.tradeVessel && sourceStructure.tradeVessel.state !== "docked") {
      return null;
    }
    for (const sourceOffer of sourceStructure.tradeOffers) {
      if (!tradingPortOfferIsLive(sourceStructure, sourceOffer)) {
        continue;
      }
      let best = null;
      let bestDistance = Infinity;
      for (const targetStructure of structures) {
        if (
          !targetStructure ||
          targetStructure === sourceStructure ||
          targetStructure.type !== "trading-port" ||
          targetStructure.health <= 0 ||
          isStructureDisabled(targetStructure)
        ) {
          continue;
        }
        const distance = Math.hypot(targetStructure.x - sourceStructure.x, targetStructure.y - sourceStructure.y);
        if (distance > tradingPortRange || distance >= bestDistance) {
          continue;
        }
        normalizeTradingPortState(targetStructure);
        if (targetStructure.tradeVessel && targetStructure.tradeVessel.state !== "docked") {
          continue;
        }
        for (const targetOffer of targetStructure.tradeOffers) {
          if (!tradingPortOfferIsLive(targetStructure, targetOffer) || !tradingPortOffersCompatible(sourceOffer, targetOffer)) {
            continue;
          }
          best = { sourceOffer, targetStructure, targetOffer };
          bestDistance = distance;
        }
      }
      if (best) {
        return best;
      }
    }
    return null;
  }

  function launchTradingPortVessel(structure, match) {
    structure.tech = subtractOfferFromTech(structure.tech, match.sourceOffer.pay);
    structure.tradeVessel = {
      state: "outbound",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: tradingPortVesselMaxHealth,
      cooldown: 0,
      sourceStructureId: structure.id,
      targetStructureId: match.targetStructure.id,
      sourceOfferId: match.sourceOffer.id,
      targetOfferId: match.targetOffer.id,
      cargo: normalizeTradeOffer(match.sourceOffer.pay)
    };
  }

  function steeringPlayersForTradingVessel() {
    const result = [{ x: player.x, y: player.y, radius: player.radius }];
    if (typeof collectRemoteCombatPlayers === "function") {
      for (const target of collectRemoteCombatPlayers()) {
        if (target && target.player) {
          result.push(target.player);
        }
      }
    }
    return result;
  }

  function steerTradingPortVessel(vessel, destination, dt) {
    const toDest = normalize(destination.x - vessel.x, destination.y - vessel.y);
    let steerX = toDest.x;
    let steerY = toDest.y;
    for (const actor of steeringPlayersForTradingVessel()) {
      if (Math.hypot(actor.x - destination.x, actor.y - destination.y) < 190) {
        continue;
      }
      const dx = vessel.x - actor.x;
      const dy = vessel.y - actor.y;
      const distance = Math.hypot(dx, dy) || 1;
      const avoidRadius = 280 + finiteOr(actor.radius, 34);
      if (distance >= avoidRadius) {
        continue;
      }
      const force = Math.pow(1 - distance / avoidRadius, 1.8) * 2.6;
      steerX += dx / distance * force;
      steerY += dy / distance * force;
    }
    const desired = normalize(steerX, steerY);
    const destinationBody = typeof bodyById === "function" ? bodyById(destination.bodyId) : null;
    const baseVx = destinationBody ? finiteOr(destinationBody.vx, 0) : 0;
    const baseVy = destinationBody ? finiteOr(destinationBody.vy, 0) : 0;
    const targetSpeed = tradingPortVesselSpeed;
    vessel.vx += (baseVx + desired.x * targetSpeed - vessel.vx) * (1 - Math.pow(0.015, dt));
    vessel.vy += (baseVy + desired.y * targetSpeed - vessel.vy) * (1 - Math.pow(0.015, dt));
    const relativeVx = vessel.vx - baseVx;
    const relativeVy = vessel.vy - baseVy;
    const speed = Math.hypot(relativeVx, relativeVy);
    if (speed > targetSpeed) {
      vessel.vx = baseVx + relativeVx / speed * targetSpeed;
      vessel.vy = baseVy + relativeVy / speed * targetSpeed;
    }
    vessel.x += vessel.vx * dt;
    vessel.y += vessel.vy * dt;
    vessel.angle = Math.atan2(vessel.vy, vessel.vx);
  }

  function dropTradeVesselCargo(vessel) {
    const cargo = normalizeTradeOffer(vessel && vessel.cargo);
    for (const tech of techTypes) {
      const amount = Math.min(12, Math.max(0, Math.floor(cargo[tech.key] || 0)));
      for (let i = 0; i < amount; i += 1) {
        techPickups.push({
          id: nextTechPickupId++,
          key: tech.key,
          label: tech.label,
          color: cssHexColorToRgb(tech.color),
          x: finiteOr(vessel.x, player.x) + randomRange(-16, 16),
          y: finiteOr(vessel.y, player.y) + randomRange(-16, 16),
          vx: finiteOr(vessel.vx, 0) * 0.18 + randomRange(-180, 180),
          vy: finiteOr(vessel.vy, 0) * 0.18 + randomRange(-180, 180),
          radius: 15,
          life: techPickupLifetime,
          maxLife: techPickupLifetime,
          rotation: randomRange(0, Math.PI * 2),
          wobble: randomRange(0, Math.PI * 2)
        });
      }
    }
  }

  function destroyTradingPortVessel(structure, color) {
    const vessel = normalizeTradeVessel(structure && structure.tradeVessel, structure);
    if (!structure || vessel.state === "docked") {
      return false;
    }
    dropTradeVesselCargo(vessel);
    structure.tradeVessel = {
      state: "docked",
      x: structure.x,
      y: structure.y,
      vx: 0,
      vy: 0,
      angle: structure.angle,
      health: tradingPortVesselMaxHealth,
      cooldown: tradingPortVesselCooldown * 1.6,
      cargo: normalizeTradeOffer(null)
    };
    sparks.push({
      x: vessel.x,
      y: vessel.y,
      radius: 54,
      color: color || { r: 255, g: 184, b: 107 },
      life: 0.28,
      maxLife: 0.28
    });
    maybeNotifyText("Trading vessel intercepted.");
    return true;
  }

  function damageTradingPortVessel(structure, damage, color) {
    const vessel = normalizeTradeVessel(structure && structure.tradeVessel, structure);
    if (!structure || vessel.state === "docked") {
      return false;
    }
    vessel.health = Math.max(0, finiteOr(vessel.health, tradingPortVesselMaxHealth) - Math.max(0, finiteOr(damage, 0)));
    structure.tradeVessel = vessel;
    sparks.push({
      x: vessel.x,
      y: vessel.y,
      radius: 24,
      color: color || { r: 255, g: 184, b: 107 },
      life: 0.16,
      maxLife: 0.16
    });
    if (vessel.health <= 0) {
      return destroyTradingPortVessel(structure, color);
    }
    return true;
  }

  function tradeVesselHitBySegment(tailX, tailY, headX, headY, radius, damage, color) {
    for (const structure of structures) {
      if (!structure || structure.type !== "trading-port") {
        continue;
      }
      const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
      if (!vessel || vessel.state === "docked") {
        continue;
      }
      const distance = distanceToSegment(vessel.x, vessel.y, tailX, tailY, headX, headY);
      if (distance <= tradingPortVesselRadius + Math.max(0, finiteOr(radius, 0))) {
        return damageTradingPortVessel(structure, damage, color);
      }
    }
    return false;
  }

  function completeTradingPortVesselArrival(structure, target) {
    const vessel = normalizeTradeVessel(structure.tradeVessel, structure);
    if (!target || target.health <= 0 || isStructureDisabled(target)) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      structure.tradeVessel = vessel;
      return;
    }
    normalizeTradingPortState(target);
    const targetOffer = target.tradeOffers.find((offer) => offer.id === vessel.targetOfferId);
    const sourceOffer = structure.tradeOffers.find((offer) => offer.id === vessel.sourceOfferId);
    if (!tradingPortOfferIsLive(target, targetOffer) || !sourceOffer || !tradingPortOffersCompatible(sourceOffer, targetOffer)) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      structure.tradeVessel = vessel;
      return;
    }

    target.tech = addOfferToTech(subtractOfferFromTech(target.tech, targetOffer.pay), vessel.cargo);
    vessel.cargo = normalizeTradeOffer(targetOffer.pay);
    vessel.state = "returning";
    vessel.targetStructureId = structure.id;
    structure.tradeVessel = vessel;
    sparks.push({
      x: target.x,
      y: target.y,
      radius: 34,
      color: { r: 255, g: 184, b: 107 },
      life: 0.2,
      maxLife: 0.2
    });
  }

  function updateTradingPort(structure, dt) {
    normalizeTradingPortState(structure);
    structure.deploy = clamp((structure.deploy || 0) + dt * 2.7, 0, 1);
    const vessel = structure.tradeVessel;
    if (vessel.state === "docked") {
      vessel.x = structure.x;
      vessel.y = structure.y;
      vessel.health = tradingPortVesselMaxHealth;
      vessel.cooldown = Math.max(0, finiteOr(vessel.cooldown, 0) - dt);
      if (vessel.cooldown <= 0) {
        const match = findAutomatedTradingPortMatch(structure);
        if (match) {
          launchTradingPortVessel(structure, match);
        }
      }
      return;
    }

    const destination = vessel.state === "returning" ? structure : findTradingPortStructureById(vessel.targetStructureId);
    if (!destination) {
      vessel.state = "returning";
      vessel.targetStructureId = structure.id;
      steerTradingPortVessel(vessel, structure, dt);
    } else {
      steerTradingPortVessel(vessel, destination, dt);
      if (Math.hypot(vessel.x - destination.x, vessel.y - destination.y) <= 42) {
        if (vessel.state === "outbound") {
          completeTradingPortVesselArrival(structure, destination);
        } else {
          structure.tech = addOfferToTech(structure.tech, vessel.cargo);
          structure.tradeVessel = {
            state: "docked",
            x: structure.x,
            y: structure.y,
            vx: 0,
            vy: 0,
            angle: structure.angle,
            health: tradingPortVesselMaxHealth,
            cooldown: tradingPortVesselCooldown,
            cargo: normalizeTradeOffer(null)
          };
          playSound("trade", { throttleKey: "tradePortReturn:" + structure.id, throttle: 0.4 });
        }
      }
    }

    if (Math.random() < dt * 4.5) {
      sparks.push({
        x: vessel.x - Math.cos(vessel.angle) * 15 + randomRange(-4, 4),
        y: vessel.y - Math.sin(vessel.angle) * 15 + randomRange(-4, 4),
        radius: 12,
        color: { r: 255, g: 184, b: 107 },
        life: 0.12,
        maxLife: 0.12
      });
    }
  }

