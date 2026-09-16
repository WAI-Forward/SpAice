  function setDeveloperOverlayOpen(open) {
    developerMetricsState.open = Boolean(open);
    if (!developerOverlay) {
      return;
    }

    if (!developerMetricsState.open && developerOverlay.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    developerOverlay.classList.toggle("is-open", developerMetricsState.open);
    developerOverlay.setAttribute("aria-hidden", developerMetricsState.open ? "false" : "true");
    if (developerMetricsState.open) {
      updateDeveloperOverlay(true);
    } else {
      setDeveloperMetricsCopyStatus("");
    }
  }

  function toggleDeveloperOverlay() {
    setDeveloperOverlayOpen(!developerMetricsState.open);
  }

  function formatDeveloperNumber(value, digits) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "n/a";
    }
    if (Number.isFinite(Number(digits)) && digits > 0) {
      return number.toFixed(digits);
    }
    return Math.round(number).toLocaleString("en-US");
  }

  function formatDeveloperPercent(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(clamp(number, 0, 1) * 100) + "%" : "n/a";
  }

  function formatDeveloperBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) {
      return "n/a";
    }

    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;
    let scaled = value;
    while (scaled >= 1024 && unitIndex < units.length - 1) {
      scaled /= 1024;
      unitIndex += 1;
    }
    return (unitIndex === 0 ? Math.round(scaled) : scaled.toFixed(1)) + " " + units[unitIndex];
  }

  function developerMemorySummary() {
    const memory = window.performance && window.performance.memory ? window.performance.memory : null;
    if (!memory) {
      return "Memory: unavailable";
    }

    return "Memory: " + formatDeveloperBytes(memory.usedJSHeapSize) +
      " / " + formatDeveloperBytes(memory.totalJSHeapSize) +
      " (limit " + formatDeveloperBytes(memory.jsHeapSizeLimit) + ")";
  }

  function developerMobSummary() {
    const groups = [
      ["alien", rivals],
      ["ufo", ufos],
      ["rambot", rambots],
      ["engineer", engineers],
      ["tesla", teslas],
      ["rocket", rockets],
      ["fighter", fighters],
      ["beacon", mobBeacons]
    ];
    let total = 0;
    let bosses = 0;
    const parts = [];

    for (const group of groups) {
      const list = group[1];
      const count = Array.isArray(list) ? list.length : 0;
      total += count;
      bosses += Array.isArray(list) ? list.filter((mob) => mob && mob.isBoss).length : 0;
      parts.push(group[0] + " " + count);
    }

    return {
      total,
      bosses,
      detail: parts.join(", ")
    };
  }

  function developerMobTargetsLocalPlayer(mob) {
    if (
      !mob ||
      mob.health <= 0 ||
      isPlayerTeamMob(mob) ||
      isMobSummoning(mob) ||
      isMobDisabled(mob)
    ) {
      return false;
    }
    if (isSurvivalCampMob(mob) && finiteOr(mob.survivalCampAggroTimer, 0) <= 0) {
      return false;
    }
    if (deathState.active || player.health <= 0) {
      return false;
    }

    const target = combatTargetForMob(mob);
    return Boolean(target && target.local && target.player === player);
  }

  function developerLocalTargetingMobSummary() {
    const groups = [
      ["alien", rivals],
      ["ufo", ufos],
      ["rambot", rambots],
      ["engineer", engineers],
      ["tesla", teslas],
      ["rocket", rockets],
      ["fighter", fighters]
    ];
    let total = 0;
    let bosses = 0;
    let camp = 0;
    let stray = 0;
    const parts = [];
    const encounters = new Set();

    for (const group of groups) {
      const label = group[0];
      const list = Array.isArray(group[1]) ? group[1] : [];
      let count = 0;
      for (const mob of list) {
        if (developerMobTargetsLocalPlayer(mob)) {
          count += 1;
          if (mob.isBoss) {
            bosses += 1;
          }
          if (isSurvivalCampMob(mob)) {
            camp += 1;
            const encounterId = mob.survivalEncounterId || mob.survivalCampId || "";
            if (encounterId) {
              encounters.add(encounterId);
            }
          } else {
            stray += 1;
          }
        }
      }
      total += count;
      parts.push(label + " " + count);
    }

    return {
      total,
      bosses,
      camp,
      stray,
      encounters: encounters.size,
      detail: parts.join(", ")
    };
  }

  function addDeveloperWorldBound(bounds, x, y, radius) {
    const worldX = Number(x);
    const worldY = Number(y);
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) {
      return;
    }

    const r = Math.max(0, finiteOr(radius, 0));
    bounds.minX = Math.min(bounds.minX, worldX - r);
    bounds.minY = Math.min(bounds.minY, worldY - r);
    bounds.maxX = Math.max(bounds.maxX, worldX + r);
    bounds.maxY = Math.max(bounds.maxY, worldY + r);
    bounds.maxDistanceFromPlayer = Math.max(bounds.maxDistanceFromPlayer, Math.hypot(worldX - player.x, worldY - player.y) + r);
  }

  function addDeveloperListBounds(bounds, list, fallbackRadius) {
    if (!Array.isArray(list)) {
      return;
    }

    for (const entity of list) {
      if (!entity) {
        continue;
      }
      addDeveloperWorldBound(bounds, entity.x, entity.y, Number.isFinite(Number(entity.radius)) ? entity.radius : fallbackRadius);
    }
  }

  function developerWorldBounds() {
    const bounds = {
      minX: player.x,
      minY: player.y,
      maxX: player.x,
      maxY: player.y,
      maxDistanceFromPlayer: 0
    };

    addDeveloperWorldBound(bounds, player.x, player.y, player.radius);
    addDeveloperListBounds(bounds, particles, 8);
    addDeveloperListBounds(bounds, structures, 60);
    addDeveloperListBounds(bounds, spacecrafts, 220);
    addDeveloperListBounds(bounds, healthPickups, 18);
    addDeveloperListBounds(bounds, techPickups, 18);
    addDeveloperListBounds(bounds, rivals, 30);
    addDeveloperListBounds(bounds, ufos, 42);
    addDeveloperListBounds(bounds, rambots, 32);
    addDeveloperListBounds(bounds, engineers, 34);
    addDeveloperListBounds(bounds, teslas, 34);
    addDeveloperListBounds(bounds, rockets, 34);
    addDeveloperListBounds(bounds, fighters, 34);
    addDeveloperListBounds(bounds, mobBeacons, 48);
    addDeveloperListBounds(bounds, rivalProjectiles, 8);
    addDeveloperListBounds(bounds, playerLasers, 8);
    addDeveloperListBounds(bounds, launcherMissiles, 8);

    return {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      area: Math.max(0, (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)),
      radiusFromPlayer: bounds.maxDistanceFromPlayer
    };
  }

  function developerWorldMassSummary() {
    let totalMass = 0;
    let largestMass = 0;
    let majorBodies = 0;

    for (const particle of particles) {
      const mass = Math.max(0, finiteOr(particle && particle.mass, 0));
      totalMass += mass;
      largestMass = Math.max(largestMass, mass);
      if (mass >= mappedBodyThreshold) {
        majorBodies += 1;
      }
    }

    return {
      totalMass,
      largestMass,
      majorBodies
    };
  }

  function developerBodySummary() {
    const summary = {
      particle: 0,
      rock: 0,
      boulder: 0,
      asteroid: 0,
      moon: 0,
      planet: 0,
      stellar: 0,
      mapped: 0,
      largestTier: "none"
    };
    let largestMass = -1;

    for (const body of particles) {
      const tierName = developerBodyTierName(body);
      if (tierName === "particle") {
        summary.particle += 1;
      } else if (tierName === "rock") {
        summary.rock += 1;
      } else if (tierName === "boulder") {
        summary.boulder += 1;
      } else if (tierName === "asteroid") {
        summary.asteroid += 1;
      } else if (tierName === "moon") {
        summary.moon += 1;
      } else if (tierName === "planet") {
        summary.planet += 1;
      } else if (tierName === "star" || stellarOutcomeTierNames.includes(tierName)) {
        summary.stellar += 1;
      }
      if (finiteOr(body && body.mass, 0) >= mappedBodyThreshold) {
        summary.mapped += 1;
      }
      const mass = finiteOr(body && body.mass, 0);
      if (mass > largestMass) {
        largestMass = mass;
        summary.largestTier = tierName || "unknown";
      }
    }

    return summary;
  }

  function developerBodyTierName(body) {
    if (!body) {
      return "";
    }
    if (body.tier && body.tier.name) {
      return String(body.tier.name);
    }
    const mass = finiteOr(body.mass, 0);
    let tier = bodyTiers[0];
    for (const candidate of bodyTiers) {
      if (mass >= candidate.threshold) {
        tier = candidate;
      }
    }
    return tier && tier.name || "";
  }

  function developerSocketState() {
    if (!multiplayer.socket) {
      return "none";
    }

    return ["connecting", "open", "closing", "closed"][multiplayer.socket.readyState] || String(multiplayer.socket.readyState);
  }

  function developerRunMode() {
    if (isMultiplayerV2Active()) {
      return "party-v2";
    }
    if (isSharedWorldFollower()) {
      return "shared-follower";
    }
    if (isPartySessionActive()) {
      return "party";
    }
    if (multiplayer.connected) {
      return "online";
    }
    return "solo";
  }

  function developerPlayerCount() {
    if (multiplayer.v2 && multiplayer.v2.state && multiplayer.v2.state.players) {
      return Object.keys(multiplayer.v2.state.players).length;
    }
    if (multiplayer.partySession && Array.isArray(multiplayer.partySession.players)) {
      return multiplayer.partySession.players.length;
    }
    return 1 + (multiplayer.remoteUniverses ? multiplayer.remoteUniverses.size : 0);
  }

  function developerNetworkSummary() {
    const stats = multiplayer.networkStats || {};
    return {
      sentMessages: finiteOr(stats.sentMessages, 0),
      sentBytes: finiteOr(stats.sentBytes, 0),
      droppedMessages: finiteOr(stats.droppedMessages, 0),
      compactedMessages: finiteOr(stats.compactedMessages, 0),
      backpressureWarnings: finiteOr(stats.backpressureWarnings, 0),
      lastMessageType: stats.lastMessageType || "none",
      lastMessageBytes: finiteOr(stats.lastMessageBytes, 0),
      largestMessageType: stats.largestMessageType || "none",
      largestMessageBytes: finiteOr(stats.largestMessageBytes, 0),
      bufferedAmount: finiteOr(stats.bufferedAmount, multiplayer.socket ? multiplayer.socket.bufferedAmount : 0)
    };
  }

  function developerV2EntityCount() {
    const state = multiplayer.v2 && multiplayer.v2.state ? multiplayer.v2.state : null;
    const world = state && state.world ? state.world : null;
    if (!world) {
      return 0;
    }

    return [
      "particles",
      "structures",
      "healthPickups",
      "techPickups",
      "rivalProjectiles",
      "alienoids",
      "ufos",
      "rambots",
      "engineers",
      "teslas",
      "rockets",
      "fighters",
      "mobBeacons"
    ].reduce(function (total, key) {
      return total + (Array.isArray(world[key]) ? world[key].length : 0);
    }, 0);
  }
