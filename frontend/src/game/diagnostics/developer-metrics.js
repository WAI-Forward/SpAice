  function buildDeveloperMetricsText() {
    const frameDt = finiteOr(renderPerformance.lastFrameDt, 0);
    const fps = frameDt > 0 ? 1 / frameDt : 0;
    const mobs = developerMobSummary();
    const localTargetingMobs = developerLocalTargetingMobSummary();
    const world = developerWorldBounds();
    const mass = developerWorldMassSummary();
    const bodies = developerBodySummary();
    const network = developerNetworkSummary();
    const sharedStats = multiplayer.sharedWorldStats;
    const sharedWorld = sharedStats && sharedStats.world ? sharedStats.world : null;
    const sharedEvent = sharedWorld && sharedWorld.activeEvent && sharedWorld.activeEvent.id
      ? sharedWorld.activeEvent.id + " " + formatDeveloperNumber(sharedWorld.activeEvent.timer || 0, 1) + "s"
      : "none";
    const sharedTopPlayer = sharedStats && sharedStats.topPlayer
      ? sharedStats.topPlayer.publicName + " " + formatDeveloperNumber(sharedStats.topPlayer.score || 0) + " pts"
      : "n/a";
    const sharedMobBreakdown = sharedWorld && sharedWorld.mobBreakdown ? sharedWorld.mobBreakdown : {};
    const randomEventTimer = randomEventState.active
      ? Math.max(0, finiteOr(randomEventState.active.timer, finiteOr(randomEventState.active.duration, 0) - finiteOr(randomEventState.active.elapsed, 0)))
      : 0;
    const randomEvent = randomEventState.active && randomEventState.active.id && randomEventTimer > 0
      ? randomEventState.active.id + " " + formatDeveloperNumber(randomEventTimer, 1) + "s"
      : "none";
    const playerSpeed = Math.hypot(finiteOr(player.vx, 0), finiteOr(player.vy, 0));
    const deviceMemory = Number(navigator.deviceMemory);
    const deviceMemoryText = Number.isFinite(deviceMemory) ? deviceMemory + " GB" : "n/a";
    const v2Perf = multiplayer.v2 && multiplayer.v2.perf ? multiplayer.v2.perf : {};

    return [
      "Runtime",
      "  mode: " + developerRunMode() + " | active " + runState.active + " | paused " + gamePaused + " | death " + deathState.active,
      "  difficulty: " + runState.difficultyId + " | game: " + runState.gameMode + " | event: " + randomEvent,
      "  score: " + formatDeveloperNumber(lifeStats.currentScore) + " current, " + formatDeveloperNumber(lifeStats.bestScore) + " best",
      "",
      "Frame",
      "  fps: " + formatDeveloperNumber(fps, 1) + " | frame dt: " + formatDeveloperNumber(frameDt * 1000, 1) + " ms | frame: " + renderPerformance.frameId,
      "  render quality: " + formatDeveloperPercent(renderQuality()) + " | glow budgets: tiny " + renderBudgets.tinyParticleGlows + ", body " + renderBudgets.bodyGlows,
      "  viewport: " + width + "x" + height + " @ " + formatDeveloperNumber(dpr, 2) + " dpr | zoom " + formatDeveloperNumber(cameraZoom * 100) + "%",
      "",
      "World",
      "  size: " + formatDeveloperNumber(world.width) + " x " + formatDeveloperNumber(world.height) + " | area " + formatDeveloperNumber(world.area) + " | farthest " + formatDeveloperNumber(world.radiusFromPlayer),
      "  bodies: total " + particles.length + " / target " + targetParticles + " | major " + mass.majorBodies + " | mapped " + bodies.mapped,
      "  by tier: particle " + bodies.particle + ", rock " + bodies.rock + ", boulder " + bodies.boulder + ", asteroid " + bodies.asteroid,
      "  by tier: moon " + bodies.moon + ", planet " + bodies.planet + ", star+ " + bodies.stellar,
      "  mass: total " + formatDeveloperNumber(mass.totalMass) + " | largest " + formatDeveloperNumber(mass.largestMass) + " (" + bodies.largestTier + ")",
      "  structures: " + structures.length + " | spacecraft: " + spacecrafts.length + " | pickups: health " + healthPickups.length + ", tech " + techPickups.length,
      "",
      "Combat",
      "  mobs: " + mobs.total + " | bosses " + mobs.bosses,
      "  " + mobs.detail,
      "  projectiles: rival " + rivalProjectiles.length + ", lasers " + playerLasers.length + ", missiles " + launcherMissiles.length,
      "  effects: sparks " + sparks.length + ", star dust " + starDust.length,
      "",
      "Player",
      "  hp: " + formatDeveloperNumber(player.health, 1) + "/" + formatDeveloperNumber(player.maxHealth, 1) + " | energy " + formatDeveloperNumber(player.energy, 1) + "/" + formatDeveloperNumber(player.maxEnergy, 1),
      "  targeted by: " + localTargetingMobs.total + " mobs | bosses " + localTargetingMobs.bosses,
      "  targeter source: camp " + localTargetingMobs.camp + " in " + localTargetingMobs.encounters + " encounters | stray " + localTargetingMobs.stray,
      "  targeters: " + localTargetingMobs.detail,
      "  pos: " + formatDeveloperNumber(player.x) + ", " + formatDeveloperNumber(player.y) + " | speed " + formatDeveloperNumber(playerSpeed, 1),
      "  landed: " + (player.landed ? "body " + player.landed.bodyId : "no") + " | interior " + (player.spacecraftInterior ? player.spacecraftInterior.craftId : "no"),
      "",
      "Network",
      "  socket: " + developerSocketState() + " | connected " + multiplayer.connected + " | players " + developerPlayerCount() + " | room " + multiplayer.roomPlayerCount + "/" + multiplayer.roomMaxPlayers,
      "  sent: " + formatDeveloperNumber(network.sentMessages) + " msgs, " + formatDeveloperBytes(network.sentBytes) + " | last " + network.lastMessageType + " " + formatDeveloperBytes(network.lastMessageBytes),
      "  largest: " + network.largestMessageType + " " + formatDeveloperBytes(network.largestMessageBytes) + " | compacted " + formatDeveloperNumber(network.compactedMessages) + " | dropped " + formatDeveloperNumber(network.droppedMessages),
      "  buffered: " + formatDeveloperBytes(network.bufferedAmount) + " | backpressure " + formatDeveloperNumber(network.backpressureWarnings),
      "  remote universes: " + multiplayer.remoteUniverses.size + " | party snapshots " + multiplayer.partyPlayerSnapshots.size + " | online " + multiplayer.onlineCount,
      "  v2 active: " + Boolean(multiplayer.v2 && multiplayer.v2.active) + " | tick " + (multiplayer.v2 ? multiplayer.v2.clientTick : 0) + " | entities " + developerV2EntityCount(),
      "  v2 perf: step " + formatDeveloperNumber(v2Perf.clientStepMs, 1) + "ms | reconcile " + formatDeveloperNumber(v2Perf.reconcileMs, 1) + "ms | sync " + formatDeveloperNumber(v2Perf.syncMs, 1) + "ms",
      "  v2 queue: pending " + formatDeveloperNumber(v2Perf.pendingInputs) + " | replay " + formatDeveloperNumber(v2Perf.replayInputs) + " | snapshots dropped " + formatDeveloperNumber(v2Perf.droppedSnapshots) + " stale " + formatDeveloperNumber(v2Perf.skippedSnapshots),
      "  v2 server: step " + formatDeveloperNumber(v2Perf.serverStepMs, 1) + "ms | snapshot " + formatDeveloperBytes(v2Perf.serverSnapshotBytes) + " | input q " + formatDeveloperNumber(v2Perf.serverMaxInputQueue) + " | ack misses " + formatDeveloperNumber(v2Perf.ackMissing),
      "",
      "Shared World",
      "  status: " + (sharedStats ? sharedStats.status : "unknown") + " | age " + (sharedStats ? formatSharedWorldDuration(sharedStats.runningSeconds) : "n/a") + " | tick " + formatDeveloperNumber(sharedStats && sharedStats.tick),
      "  players: online " + formatDeveloperNumber(sharedStats && sharedStats.onlinePlayers) + "/" + formatDeveloperNumber(sharedStats && sharedStats.maxPlayers) + " | known " + formatDeveloperNumber(sharedStats && sharedStats.knownPlayers) + " | teams " + formatDeveloperNumber(sharedStats && sharedStats.teamCount),
      "  leader: " + sharedTopPlayer,
      "  world size: " + formatDeveloperNumber(sharedWorld && sharedWorld.width) + " x " + formatDeveloperNumber(sharedWorld && sharedWorld.height) + " | area " + formatDeveloperNumber(sharedWorld && sharedWorld.area) + " | radius " + formatDeveloperNumber(sharedWorld && sharedWorld.radiusFromOrigin),
      "  entities: total " + formatDeveloperNumber(sharedWorld && sharedWorld.entityCount) + " | bodies " + formatDeveloperNumber(sharedWorld && sharedWorld.particles) + " | structures " + formatDeveloperNumber(sharedWorld && sharedWorld.structures) + " | ships " + formatDeveloperNumber(sharedWorld && sharedWorld.spacecrafts),
      "  mobs: total " + formatDeveloperNumber(sharedWorld && sharedWorld.mobCount) + " | bosses " + formatDeveloperNumber(sharedWorld && sharedWorld.bosses) + " | beacons " + formatDeveloperNumber(sharedMobBreakdown.beacons),
      "  mob detail: alien " + formatDeveloperNumber(sharedMobBreakdown.alienoids) + ", ufo " + formatDeveloperNumber(sharedMobBreakdown.ufos) + ", rambot " + formatDeveloperNumber(sharedMobBreakdown.rambots) + ", engineer " + formatDeveloperNumber(sharedMobBreakdown.engineers),
      "  mob detail: tesla " + formatDeveloperNumber(sharedMobBreakdown.teslas) + ", rocket " + formatDeveloperNumber(sharedMobBreakdown.rockets) + ", fighter " + formatDeveloperNumber(sharedMobBreakdown.fighters),
      "  events: " + sharedEvent + " | black holes " + formatDeveloperNumber(sharedWorld && sharedWorld.blackHoles) + " | projectiles " + formatDeveloperNumber(sharedWorld && sharedWorld.projectiles) + " | pickups " + formatDeveloperNumber((sharedWorld && sharedWorld.techPickups) + (sharedWorld && sharedWorld.healthPickups)),
      "",
      "Device",
      "  " + developerMemorySummary(),
      "  cores: " + (navigator.hardwareConcurrency || "n/a") + " | device memory: " + deviceMemoryText
    ].join("\n");
  }

  function updateDeveloperOverlay(force) {
    if (!developerMetricsState.open || !developerMetricsText) {
      return;
    }

    const now = performance.now();
    if (developerMetricsState.copyStatusClearAt && now >= developerMetricsState.copyStatusClearAt) {
      setDeveloperMetricsCopyStatus("");
    }

    if (!force && now - developerMetricsState.lastUpdateAt < developerMetricsRefreshMs) {
      return;
    }

    developerMetricsState.lastUpdateAt = now;
    const text = buildDeveloperMetricsText();
    if (text !== developerMetricsState.lastText) {
      developerMetricsState.lastText = text;
      developerMetricsText.textContent = text;
    }
  }

  function setDeveloperMetricsCopyStatus(text) {
    if (!developerMetricsCopyStatus) {
      return;
    }

    developerMetricsCopyStatus.textContent = text || "";
    developerMetricsState.copyStatusClearAt = text ? performance.now() + 1800 : 0;
  }

  function copyDeveloperMetricsFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();
    if (!copied) {
      throw new Error("Copy command failed.");
    }
  }

  async function copyDeveloperMetricsToClipboard() {
    if (!developerMetricsText) {
      return;
    }

    updateDeveloperOverlay(true);
    const text = developerMetricsState.lastText || developerMetricsText.textContent || "";
    if (!text.trim()) {
      setDeveloperMetricsCopyStatus("No metrics to copy");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        copyDeveloperMetricsFallback(text);
      }
      setDeveloperMetricsCopyStatus("Copied metrics");
    } catch (error) {
      console.warn("[Clusternauts dev] clipboard copy failed", error);
      setDeveloperMetricsCopyStatus("Copy failed");
    }
  }

  function hudProgressSnapshot() {
    const frameId = currentRenderFrameId();
    const landedBodyId = player.landed ? player.landed.bodyId : null;
    const equipped = equippedToolId || "";
    const maxAge = isSuctionEquipped() ? 3 : 10;

    if (
      hudCache.progressSnapshot &&
      frameId - hudCache.progressFrameId < maxAge &&
      hudCache.progressParticleCount === particles.length &&
      hudCache.progressLandedBodyId === landedBodyId &&
      hudCache.progressEquippedToolId === equipped
    ) {
      return hudCache.progressSnapshot;
    }

    let largest = 1;
    let largestParticle = null;
    for (const particle of particles) {
      if (particle.mass > largest) {
        largest = particle.mass;
        largestParticle = particle;
      }
    }

    const progressBody = findBucketProgressBody() || findNearestProgressBody() || largestParticle;
    const progressMass = progressBody ? progressBody.mass : largest;
    const tier = progressBody ? progressBody.tier : bodyTiers[0];
    hudCache.progressFrameId = frameId;
    hudCache.progressParticleCount = particles.length;
    hudCache.progressLandedBodyId = landedBodyId;
    hudCache.progressEquippedToolId = equipped;
    hudCache.progressSnapshot = {
      mass: progressMass,
      tier,
      body: progressBody
    };
    return hudCache.progressSnapshot;
  }

  function maybeRenderOpenLeaderboard() {
    if (!leaderboard.open) {
      return;
    }

    const frameId = currentRenderFrameId();
    if (frameId - hudCache.leaderboardFrameId < 15) {
      return;
    }
    hudCache.leaderboardFrameId = frameId;
    renderLeaderboard();
  }

  function drawMapOverlay() {
    if (gameSettings.hudEnabled === false) {
      return;
    }

    if (isCompactHudViewport() && !mapHudOpen) {
      return;
    }

    const margin = width <= 560 ? 10 : 16;
    const size = Math.round(clamp(Math.min(width, height) * (width <= 560 ? 0.34 : 0.31), width <= 560 ? 160 : 190, width <= 560 ? 228 : 292));
    const x = width - margin - size;
    const compactControlsClearance = isCompactHudViewport() ? 58 : 0;
    const y = Math.max(margin, height - margin - compactControlsClearance - size);
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const mapRadius = size * 0.41;
    const bodies = mappedBodiesForFrame();
    const bodyMapContacts = collectMapBodyClusters(bodies);
    const remoteContacts = collectRemoteMapContacts();
    const spacecraftContacts = collectSpacecraftMapContacts();
    const campContacts = collectMapCampContacts();
    const eventRegions = activeRandomEventRegions();
    const hoverCandidates = [];
    let farthest = 0;

    for (const body of bodies) {
      farthest = Math.max(farthest, Math.hypot(body.x - player.x, body.y - player.y));
    }
    for (const contact of remoteContacts.bodies) {
      farthest = Math.max(farthest, Math.hypot(contact.body.x - player.x, contact.body.y - player.y));
    }
    for (const contact of remoteContacts.players) {
      farthest = Math.max(farthest, Math.hypot(contact.player.x - player.x, contact.player.y - player.y));
    }
    for (const contact of spacecraftContacts) {
      farthest = Math.max(farthest, Math.hypot(contact.craft.x - player.x, contact.craft.y - player.y));
    }
    for (const camp of campContacts) {
      farthest = Math.max(farthest, Math.hypot(camp.x - player.x, camp.y - player.y));
    }
    for (const region of eventRegions) {
      farthest = Math.max(farthest, Math.hypot(region.x - player.x, region.y - player.y) + finiteOr(region.radius, 0));
    }

    const range = clamp(farthest * 1.08, 1400, 9000);
    const activityCompass = collectMapActivityCompass({
      range,
      remoteContacts,
      spacecraftContacts,
      campContacts,
      eventRegions
    });

    ctx.save();
    ctx.fillStyle = "rgba(3, 8, 24, 0.72)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    roundRectPath(x, y, size, size, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(x + 1, y + 1, size - 2, size - 2);
    ctx.clip();

    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    ctx.strokeStyle = "rgba(88, 226, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i += 1) {
      const ringRadius = (mapRadius / 3) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      drawMapRangeLabel(centerX, centerY, ringRadius, formatMapDistance((range / 3) * i));
    }

    ctx.beginPath();
    ctx.moveTo(centerX - mapRadius, centerY);
    ctx.lineTo(centerX + mapRadius, centerY);
    ctx.moveTo(centerX, centerY - mapRadius);
    ctx.lineTo(centerX, centerY + mapRadius);
    ctx.stroke();

    drawMapActivityCompassLine(activityCompass, centerX, centerY, mapRadius, range);

    for (const region of eventRegions) {
      drawMapEventRegion(region, centerX, centerY, mapRadius, range);
      const marker = projectMapPoint(region.x, region.y, centerX, centerY, mapRadius, range);
      hoverCandidates.push(mapHoverCandidate("event", region, marker, {
        label: region.label || "Event region",
        color: region.color || particleStormMapColor,
        radius: clamp((finiteOr(region.radius, 0) / Math.max(1, range)) * (mapRadius - 14), 10, 22),
        priority: -2
      }));
    }

    for (const contact of spacecraftContacts) {
      const marker = projectMapPoint(contact.craft.x, contact.craft.y, centerX, centerY, mapRadius, range);
      drawMapSpacecraftMarker(contact, marker);
      hoverCandidates.push(mapHoverCandidate("spacecraft", contact.craft, marker, {
        label: contact.label || "Craft",
        color: contact.color || rogueTraderMapColor,
        radius: 12,
        priority: 1
      }));
    }

    for (const cluster of bodyMapContacts.clusters) {
      const marker = projectMapPoint(cluster.x, cluster.y, centerX, centerY, mapRadius, range);
      drawMapClusterMarker(cluster, marker, mapRadius, range);
      hoverCandidates.push(mapHoverCandidate("cluster", cluster, marker, {
        color: cluster.color,
        radius: mapClusterScreenRadius(cluster, mapRadius, range),
        priority: 2.5
      }));
    }

    for (const body of bodyMapContacts.singles) {
      const marker = projectMapPoint(body.x, body.y, centerX, centerY, mapRadius, range);
      drawMapBodyMarker(body, marker, { showDistance: body.tier.name === "moon" || body.tier.name === "planet" || isStarBody(body) || marker.clamped });
      hoverCandidates.push(mapHoverCandidate("body", body, marker, {
        radius: mapMarkerRadius(body.tier.name),
        priority: 2
      }));
    }

    for (const camp of campContacts) {
      const marker = projectMapPoint(camp.x, camp.y, centerX, centerY, mapRadius, range);
      drawMapCampMarker(camp, marker);
      hoverCandidates.push(mapHoverCandidate("camp", camp, marker, {
        color: camp.color,
        radius: 13,
        priority: 3
      }));
    }

    for (const contact of remoteContacts.bodies) {
      const marker = projectMapPoint(contact.body.x, contact.body.y, centerX, centerY, mapRadius, range);
      drawMapBodyMarker(
        contact.body,
        marker,
        { remote: true, alpha: contact.alpha, showDistance: true }
      );
      hoverCandidates.push(mapHoverCandidate("remote-body", contact.body, marker, {
        owner: contact.publicName || "Remote",
        color: { r: 88, g: 226, b: 255 },
        radius: mapMarkerRadius(contact.body.tier.name),
        priority: 1
      }));
    }

    for (const contact of remoteContacts.players) {
      const marker = projectMapPoint(contact.player.x, contact.player.y, centerX, centerY, mapRadius, range);
      drawMapPlayerMarker(contact, marker);
      hoverCandidates.push(mapHoverCandidate("player", contact.player, marker, {
        label: contact.publicName || "Remote player",
        color: { r: 255, g: 115, b: 173 },
        radius: 14,
        priority: 1
      }));
    }

    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = "#58e2ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX + 7, centerY + 7);
    ctx.lineTo(centerX, centerY + 3);
    ctx.lineTo(centerX - 7, centerY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const hoverTarget = selectMapHoverTarget(hoverCandidates, x, y, size);
    drawMapHoverHighlight(hoverTarget);

    ctx.restore();

    drawMapHoverPanel(hoverTarget, performance.now());
  }

  function updateHud() {
    updateDeveloperOverlay(false);
    syncMapMinimumBodyControlVisibility();

    if (gameSettings.hudEnabled === false) {
      return;
    }

    const healthPct = Math.round(clamp(player.health / player.maxHealth, 0, 1) * 100);
    setTextIfChanged(healthValue, "HP: " + healthPct + "%");
    setStyleWidthIfChanged(healthFill, healthPct + "%");
    if (energyValue && energyFill) {
      const energyPct = Math.round(playerEnergyPct() * 100);
      setTextIfChanged(energyValue, "EP: " + Math.round(player.energy) + "/" + Math.round(player.maxEnergy));
      setStyleWidthIfChanged(energyFill, energyPct + "%");
      energyFill.classList.toggle("is-disabled", areToolsDisabled());
    }
    updateDifficultyUi();
    if (scoreValue) {
      setTextIfChanged(scoreValue, Math.max(0, Math.round(lifeStats.bestScore || lifeStats.currentScore || 0)) + " pts");
    }
    updateMapSpeedometerHud();
    updatePlayerStatusEffectsHud();
    updateObjectiveState();
    updateTouchLandButton();

    const progressSnapshot = hudProgressSnapshot();
    const progressMass = progressSnapshot.mass;
    const tier = progressSnapshot.tier;
    const progressBody = progressSnapshot.body;
    const nextTier = nextTierAfter(tier);
    const roundedProgressMass = Math.max(0, Math.round(progressMass));
    const planetThreshold = thresholdForTierName("planet");
    const starThreshold = thresholdForTierName("star");
    const terminalStellar = stellarOutcomeTierNames.includes(tier.name);
    const stellarProgressActive = progressMass >= planetThreshold && (progressMass < stellarEvolutionEndThreshold || terminalStellar);
    const displayedGrowthRate = updateGrowthRateHud(progressBody, progressMass);
    setTextIfChanged(currentBodyLabel, formatTierName(tier.name).toUpperCase() + ":");
    if (stellarProgressActive) {
      const firstProgress = progressMass >= starThreshold
        ? 1
        : clamp((progressMass - planetThreshold) / Math.max(1, starThreshold - planetThreshold), 0, 1);
      const secondProgress = progressMass >= stellarEvolutionEndThreshold
        ? 1
        : progressMass >= starThreshold
          ? clamp((progressMass - starThreshold) / Math.max(1, stellarEvolutionEndThreshold - starThreshold), 0, 1)
          : 0;
      const growthRate = progressBody && progressBody.stellarGrowthStarted
        ? Math.max(0, finiteOr(progressBody.stellarGrowthRate, 0))
        : displayedGrowthRate;
      const predictedOutcome = terminalStellar
        ? tier.name
        : progressMass >= starThreshold
          ? stellarOutcomeForGrowthRate(growthRate)
          : "star";
      setTextIfChanged(nextMilestoneLabel, terminalStellar ? "MAX" : formatTierName(predictedOutcome).toUpperCase());
      setTextIfChanged(nextMilestoneValue, roundedProgressMass + " / " + Math.round(stellarEvolutionEndThreshold));
      setStyleWidthIfChanged(milestoneFill, Math.round(firstProgress * 50) + "%");
      setStyleWidthIfChanged(milestoneStellarFill, Math.round(secondProgress * 50) + "%");
      if (milestoneSplit) {
        milestoneSplit.classList.toggle("is-visible", true);
      }
      if (stellarRateLabel) {
        stellarRateLabel.hidden = progressMass < starThreshold || terminalStellar;
        setTextIfChanged(stellarRateLabel, "Rate " + formatGrowthRate(growthRate) + "/s -> " + formatTierName(predictedOutcome));
      }
      maybeRenderOpenLeaderboard();
      return;
    }
    setStyleWidthIfChanged(milestoneStellarFill, "0%");
    if (milestoneSplit) {
      milestoneSplit.classList.toggle("is-visible", false);
    }
    if (stellarRateLabel) {
      stellarRateLabel.hidden = true;
    }
    if (!nextTier) {
      setTextIfChanged(nextMilestoneLabel, "MAX");
      setTextIfChanged(nextMilestoneValue, roundedProgressMass + " / " + Math.round(tier.threshold) + "+");
      setStyleWidthIfChanged(milestoneFill, "100%");
      maybeRenderOpenLeaderboard();
      return;
    }

    const start = tier.threshold;
    const end = nextTier.threshold;
    const progress = clamp((progressMass - start) / (end - start), 0, 1);
    setTextIfChanged(nextMilestoneLabel, formatTierName(nextTier.name).toUpperCase());
    setTextIfChanged(nextMilestoneValue, roundedProgressMass + " / " + Math.round(end));
    setStyleWidthIfChanged(milestoneFill, Math.round(progress * 100) + "%");
    maybeRenderOpenLeaderboard();
  }
