  function rogueTraderEventPosition(active) {
    const elapsed = Math.max(0, finiteOr(active && active.elapsed, 0));
    const duration = Math.max(1, finiteOr(active && active.duration, rogueTraderEventSettings.duration));
    const approachDuration = Math.max(0.5, rogueTraderEventSettings.approachDuration);
    const startX = finiteOr(active && active.startX, player.x + 1600);
    const startY = finiteOr(active && active.startY, player.y);
    const targetX = finiteOr(active && active.targetX, player.x + 920);
    const targetY = finiteOr(active && active.targetY, player.y);

    if (elapsed < approachDuration) {
      const t = smoothEventStep(elapsed / approachDuration);
      return {
        x: startX + (targetX - startX) * t,
        y: startY + (targetY - startY) * t,
        departing: false
      };
    }

    const serviceDuration = Math.max(0.5, duration - approachDuration);
    const t = clamp((elapsed - approachDuration) / serviceDuration, 0, 1);
    return {
      x: targetX + rogueTraderEventSettings.serviceDriftDistance * smoothEventStep(t),
      y: targetY,
      departing: false
    };
  }

  function rogueTraderPlayerClearance(craft) {
    const anchors = activePartyPlayerAnchors();
    const players = anchors.length ? anchors : [player];
    return players.reduce(function (minimum, anchor) {
      return Math.min(minimum, Math.hypot(craft.x - finiteOr(anchor.x, player.x), craft.y - finiteOr(anchor.y, player.y)));
    }, Infinity);
  }

  function beginRogueTraderDeparture(craft, reason) {
    if (!craft || craft.eventId !== rogueTraderEventId) {
      return false;
    }
    craft.rogueTraderDeparting = true;
    craft.rogueTraderDepartureReason = reason || "Rogue Trader departing.";
    craft.vx = rogueTraderEventSettings.leaveSpeed;
    craft.vy = finiteOr(craft.rogueTraderDepartureVy, rogueTraderEventSettings.leaveVerticalDrift);
    craft.rotation = 0;
    if (player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
      requestPlayerSpacecraftExit(craft, { speed: 260, reason: "Rogue Trader departing." });
    }
    if (multiplayer.trade && multiplayer.trade.kind === "npc" && multiplayer.trade.spacecraftId === craft.id) {
      closeTradeSession();
    }
    return true;
  }

  function updateRogueTraderDepartureCraft(craft, dt) {
    const seconds = Math.max(0, finiteOr(dt, 0));
    craft.vx = rogueTraderEventSettings.leaveSpeed;
    craft.vy = finiteOr(craft.vy, rogueTraderEventSettings.leaveVerticalDrift);
    craft.x += craft.vx * seconds;
    craft.y += craft.vy * seconds;
    craft.rotation = 0;
    if (player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
      requestPlayerSpacecraftExit(craft, { speed: 260, reason: "Rogue Trader departing." });
    }
    const rightClearance = craft.x - finiteOr(player.x, craft.x);
    return (
      rogueTraderPlayerClearance(craft) >= rogueTraderEventSettings.disappearDistance &&
      rightClearance >= rogueTraderEventSettings.disappearRightDistance
    );
  }

  function updateRogueTraderEventCraft(active, dt) {
    const craft = syncSpacecraftsToRandomEventState();
    if (!craft) {
      return null;
    }
    const previousX = craft.x;
    const previousY = craft.y;
    const position = rogueTraderEventPosition(active);
    craft.x = position.x;
    craft.y = position.y;
    craft.vx = dt > 0 ? (craft.x - previousX) / dt : 0;
    craft.vy = dt > 0 ? (craft.y - previousY) / dt : 0;
    craft.rotation = 0;
    updateSpacecraftWorldFields(craft);
    if (position.departing && player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
      requestPlayerSpacecraftExit(craft, { speed: 260, reason: "Rogue Trader departing." });
    }
    return craft;
  }

  function startRogueTraderEvent(active) {
    const region = chooseRogueTraderRegion();
    Object.assign(active, {
      title: "Rogue Trader",
      targetX: region.targetX,
      targetY: region.targetY,
      startX: region.startX,
      startY: region.startY,
      exitX: region.exitX,
      exitY: region.exitY,
      radius: region.radius
    });
    createRogueTraderEventCraft(active);
    updateRogueTraderEventCraft(active, 0);
    maybeNotifyText("Rogue Trader signal detected.", { groupKey: "random-event-rogue-trader" });
    playSound("ui", { throttle: 0.5 });
  }

  function updateRogueTraderEvent(active, dt) {
    updateRogueTraderEventCraft(active, Math.max(0, finiteOr(dt, 0)));
  }

  function finishRogueTraderEvent(active) {
    const craft = findRogueTraderEventCraft(active);
    if (craft) {
      beginRogueTraderDeparture(craft, "Rogue Trader departing.");
    }
    for (let i = spacecrafts.length - 1; i >= 0; i -= 1) {
      if (spacecrafts[i] && spacecrafts[i].eventId === rogueTraderEventId) {
        beginRogueTraderDeparture(spacecrafts[i], "Rogue Trader departing.");
      }
    }
    maybeNotifyText("Rogue Trader leaving local space.", { groupKey: "random-event-rogue-trader" });
  }

  function activeSpacecraftEventRegions(active) {
    const source = active || randomEventState.active;
    if (!source || source.id !== rogueTraderEventId) {
      return [];
    }
    const craft = findRogueTraderEventCraft(source);
    return [{
      id: rogueTraderEventId,
      label: "Trader",
      x: craft ? craft.x : finiteOr(source.targetX, player.x),
      y: craft ? craft.y : finiteOr(source.targetY, player.y),
      radius: Math.max(240, finiteOr(source.radius, rogueTraderEventSettings.radius)),
      color: rogueTraderMapColor,
      progress: clamp(finiteOr(source.elapsed, 0) / Math.max(1, finiteOr(source.duration, rogueTraderEventSettings.duration)), 0, 1)
    }];
  }

  registerRandomEvent({
    id: rogueTraderEventId,
    title: "Rogue Trader",
    duration: rogueTraderEventSettings.duration,
    weight: rogueTraderWeight,
    canStart: function () {
      return currentRunElapsedSeconds() >= rogueTraderEventSettings.earliestSpawnTime &&
        !deathState.active &&
        player.health > 0 &&
        !isPlayerInsideSpacecraft() &&
        spacecrafts.length === 0;
    },
    start: startRogueTraderEvent,
    update: updateRogueTraderEvent,
    finish: finishRogueTraderEvent
  });
