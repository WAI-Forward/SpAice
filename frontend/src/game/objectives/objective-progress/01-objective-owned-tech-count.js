  function objectiveMobTechKey(kind) {
    if (kind === "ufo") return "suction";
    if (kind === "rambot") return "plating";
    if (kind === "engineer") return "repair";
    if (kind === "tesla") return "energy";
    if (kind === "satellite") return "target";
    if (kind === "rocket") return "propulsion";
    if (kind === "fighter") return "shield";
    return "weapon";
  }

  function objectiveRewardMobKind(id) {
    const mobKindsByObjective = {
      kill_3_alienoids: "alienoid",
      kill_3_ufos: "ufo",
      kill_3_rambots: "rambot",
      kill_3_teslas: "tesla",
      kill_3_engineers: "engineer",
      kill_3_satellites: "satellite",
      kill_3_fighters: "fighter",
      kill_3_rockets: "rocket",
      kill_alienoid_boss: "alienoid",
      kill_ufo_boss: "ufo",
      kill_rambot_boss: "rambot",
      kill_tesla_boss: "tesla",
      kill_engineer_boss: "engineer",
      kill_satellite_boss: "satellite",
      kill_fighter_boss: "fighter",
      kill_rocket_boss: "rocket"
    };
    return mobKindsByObjective[id] || "";
  }

  function objectiveMobRewardTier(kind) {
    return Math.max(0, mobTierOrder.indexOf(kind));
  }

  function objectiveMobHealthRewardAmount(kind, boss) {
    const tier = objectiveMobRewardTier(kind);
    return (boss ? 24 : 10) + tier * (boss ? 4 : 2);
  }

  function objectiveMobRepairRewardAmount(kind, boss) {
    const tier = objectiveMobRewardTier(kind);
    if (tier < 2) {
      return 0;
    }
    return boss ? Math.max(1, Math.floor(tier / 2)) + 1 : Math.max(1, Math.floor((tier - 1) / 2));
  }

  function objectiveRewardEntries(definition) {
    const id = String(definition && definition.id || "");
    const fixedRewards = {
      reach_speed_520: { propulsion: 2 },
      reach_speed_1000: { propulsion: 4 },
      reach_speed_2000: { propulsion: 6, energy: 1 },
      make_laser_pistol: { weapon: 1 },
      create_rifle: { weapon: 2 },
      create_spanner: { repair: 1 },
      create_turret: { weapon: 1, plating: 1 },
      create_accumulator: { suction: 1, plating: 1 }
    };
    const fixed = fixedRewards[id];
    if (fixed) {
      return Object.keys(fixed).map(function (techKey) {
        return { techKey, amount: fixed[techKey] };
      });
    }

    const mobKind = objectiveRewardMobKind(id);
    if (mobKind) {
      const boss = id.indexOf("_boss") >= 0;
      const rewards = [{
        techKey: objectiveMobTechKey(mobKind),
        amount: boss ? 3 : 1
      }];
      rewards.push({ health: objectiveMobHealthRewardAmount(mobKind, boss) });
      const repairReward = objectiveMobRepairRewardAmount(mobKind, boss);
      if (repairReward > 0) {
        rewards.push({ techKey: "repair", amount: repairReward });
      }
      if (id === "kill_alienoid_boss") {
        rewards.push({ blueprintId: "shotgun", label: "Shotgun Blueprint" });
      }
      if (id === "kill_ufo_boss") {
        rewards.push({ blueprintId: visciousVacuumToolId, label: "Viscious Vacuum Blueprint" });
      }
      if (id === "kill_rambot_boss") {
        rewards.push({ blueprintId: pistonPunchToolId, label: "Piston Punch Blueprint" });
      }
      if (id === "kill_tesla_boss") {
        rewards.push({ blueprintId: empToolId, label: "EMP Blueprint" });
      }
      if (id === "kill_engineer_boss") {
        rewards.push({ blueprintId: familiarNetToolId, label: "Familiar Net Blueprint" });
      }
      if (id === "kill_satellite_boss") {
        rewards.push({ blueprintId: guidedLauncherToolId, label: "Guided Launcher Blueprint" });
      }
      if (id === "kill_rocket_boss") {
        rewards.push({ blueprintId: rocketSuitToolId, label: "Rocket Suit Blueprint" });
      }
      if (id === "kill_fighter_boss") {
        rewards.push({ blueprintId: machineGunToolId, label: "Machine Gun Blueprint" });
      }
      return rewards;
    }

    return [];
  }

  function objectiveTechLabel(techKey) {
    const tech = techTypes.find((candidate) => candidate.key === techKey);
    return tech ? tech.label : techKey;
  }

  function objectiveRewardText(entries) {
    if (!entries || !entries.length) {
      return "No reward";
    }
    return entries.map(function (entry) {
      if (entry.blueprintId) {
        return entry.label || "Blueprint";
      }
      if (entry.health) {
        return "+" + Math.max(1, Math.floor(finiteOr(entry.health, 1))) + " Health";
      }
      return Math.max(1, Math.floor(finiteOr(entry.amount, 1))) + " " + objectiveTechLabel(entry.techKey);
    }).join(" + ");
  }

  function objectiveIsClaimed(definition) {
    return Boolean(definition && objectiveState.claimed[definition.id] === true);
  }

  function objectiveIsAwaitingClaim(snapshot) {
    return Boolean(
      snapshot &&
      snapshot.progress.complete &&
      !snapshot.definition.repeatable &&
      !objectiveIsClaimed(snapshot.definition)
    );
  }

  function objectiveCanClaim(snapshot) {
    return objectiveIsAwaitingClaim(snapshot);
  }

  function objectiveClaimableSnapshots(snapshots) {
    return (Array.isArray(snapshots) ? snapshots : []).filter(objectiveCanClaim);
  }

  function updateObjectiveClaimUi(snapshots) {
    const claimableCount = objectiveClaimableSnapshots(snapshots).length;
    const hasUnclaimed = claimableCount > 0;
    if (objectiveToggle) {
      objectiveToggle.classList.toggle("is-unclaimed", hasUnclaimed);
      objectiveToggle.setAttribute(
        "aria-label",
        hasUnclaimed ? "Open objective tree. Objectives ready to claim." : "Toggle objective tree"
      );
    }
    if (objectiveClaimAll) {
      objectiveClaimAll.disabled = !hasUnclaimed;
      objectiveClaimAll.title = hasUnclaimed
        ? "Claim " + claimableCount + " completed objective reward" + (claimableCount === 1 ? "" : "s")
        : "No completed objective rewards to claim";
      objectiveClaimAll.setAttribute("aria-label", objectiveClaimAll.title);
    }
  }

  function recordObjectiveTravelSpeed(speed) {
    const value = Math.max(0, finiteOr(speed, 0));
    if (value > finiteOr(objectiveState.maxTravelSpeed, 0)) {
      objectiveState.maxTravelSpeed = value;
      objectiveState.renderSignature = "";
    }
  }

  function objectiveMaxTravelSpeed() {
    return Math.max(0, finiteOr(objectiveState.maxTravelSpeed, 0));
  }

  function recordObjectiveBuiltStructure(type) {
    const structureType = String(type || "");
    if (!structureType) {
      return;
    }
    const builtStructures = objectiveState.builtStructures && typeof objectiveState.builtStructures === "object"
      ? objectiveState.builtStructures
      : (objectiveState.builtStructures = Object.create(null));
    builtStructures[structureType] = Math.max(0, Math.floor(finiteOr(builtStructures[structureType], 0))) + 1;
    objectiveState.renderSignature = "";
  }

  function objectiveSpeedProgress(targetSpeed) {
    const target = Math.max(1, Math.floor(finiteOr(targetSpeed, 1)));
    const speed = objectiveMaxTravelSpeed();
    return {
      complete: speed >= target,
      value: speed,
      target,
      label: Math.min(Math.round(speed), target) + " / " + target + " speed"
    };
  }

  function objectiveMobBossProgress(kind) {
    const target = Math.max(1, Math.floor(finiteOr(mobBossDefeatsToUnlock, 30)));
    const defeats = Math.max(0, Math.floor(finiteOr(mobDefeatsByKind[kind], 0)));
    return {
      complete: defeats >= target,
      value: defeats,
      target,
      label: Math.min(defeats, target) + " / " + target + " defeated"
    };
  }

  function objectiveMobMetadata(kind) {
    const blueprint = mobEntityBlueprints[kind] || { label: "Mob" };
    const plural = mobObjectivePluralLabels[kind] || (blueprint.label + "s");
    return {
      icon: blueprint.label.charAt(0).toUpperCase(),
      hint: function () {
        return "Defeat " + previousMobTierDefeatsTarget(kind) + " " + plural + ".";
      },
      progress: function () {
        return objectiveMobKindProgress(kind, previousMobTierDefeatsTarget(kind));
      }
    };
  }

  function objectiveBossMetadata(kind) {
    const blueprint = mobEntityBlueprints[kind] || { label: "Mob" };
    return {
      icon: "!",
      hint: "Defeat the " + blueprint.label + " boss.",
      progress: function () {
        return objectiveBossDefeatProgress(kind);
      }
    };
  }

  function objectiveMobKindProgress(kind, targetCount) {
    const target = Math.max(1, Math.floor(finiteOr(targetCount, 3)));
    const defeats = Math.max(0, Math.floor(finiteOr(mobDefeatsByKind[kind], 0)));
    return {
      complete: defeats >= target,
      value: defeats,
      target,
      label: Math.min(defeats, target) + " / " + target + " defeated"
    };
  }

  function multiplayerMobTierUnlockPlayerCount() {
    if (!multiplayer || (!multiplayer.v2.active && multiplayer.partyMode !== "party" && !multiplayer.partySession)) {
      return 1;
    }

    const v2Players = multiplayer.v2 && multiplayer.v2.state && multiplayer.v2.state.players;
    if (v2Players && typeof v2Players === "object") {
      return Math.max(1, Math.min(crazyGamesRoomMaxPlayers, Object.keys(v2Players).length));
    }
    if (multiplayer.partySession && Array.isArray(multiplayer.partySession.players) && multiplayer.partySession.players.length) {
      return Math.max(1, Math.min(crazyGamesRoomMaxPlayers, multiplayer.partySession.players.length));
    }
    return Math.max(1, Math.min(crazyGamesRoomMaxPlayers, Math.floor(finiteOr(multiplayer.roomPlayerCount, 1))));
  }

  function mobTierDefeatsToUnlockNextTier(kind) {
    const index = mobTierOrder.indexOf(kind);
    return mobTierUnlockBaseDefeats + Math.max(0, index);
  }

  function previousMobTierDefeatsTarget(kind) {
    return mobTierDefeatsToUnlockNextTier(kind) * multiplayerMobTierUnlockPlayerCount();
  }

  function objectiveBossDefeatProgress(kind) {
    const defeats = Math.max(0, Math.floor(finiteOr(mobBossDefeatsByKind[kind], 0)));
    return {
      complete: defeats > 0,
      value: defeats,
      target: 1,
      label: Math.min(defeats, 1) + " / 1 defeated"
    };
  }

  function objectiveToolProgress(toolId) {
    const complete = unlockedToolIds.includes(toolId);
    const recipe = buildRecipes.find((candidate) => candidate.unlockToolId === toolId);
    return {
      complete,
      value: complete ? 1 : 0,
      target: 1,
      label: complete ? "Unlocked" : ((recipe && recipe.name) || "Tool") + " locked"
    };
  }

  function objectiveStructureProgress(type) {
    const counts = objectiveState.builtStructures && typeof objectiveState.builtStructures === "object"
      ? objectiveState.builtStructures
      : {};
    const count = Math.max(0, Math.floor(finiteOr(counts[type], 0)));
    return {
      complete: count > 0,
      value: count,
      target: 1,
      label: count > 0 ? count + " built" : "0 / 1 built"
    };
  }

  function objectiveProgress(definition) {
    const progress = definition && typeof definition.progress === "function" ? definition.progress() : {};
    const complete = Boolean(progress.complete || objectiveState.completed[definition.id]);
    if (progress.complete && !objectiveState.completed[definition.id]) {
      objectiveState.completed[definition.id] = true;
    }
    return {
      complete: Boolean(objectiveState.completed[definition.id] || complete),
      label: progress.label || "",
      value: finiteOr(progress.value, 0),
      target: finiteOr(progress.target, 0)
    };
  }

  function objectiveParentComplete(definition) {
    const prerequisites = Array.isArray(definition && definition.prerequisites)
      ? definition.prerequisites
      : (definition && definition.parent ? [definition.parent] : []);
    return prerequisites.every((id) => objectiveState.completed[id] === true);
  }

  function objectiveSnapshots() {
    let currentAssigned = false;
    return objectiveDefinitions.map(function (definition) {
      const progress = objectiveProgress(definition);
      const available = objectiveParentComplete(definition);
      const current = !currentAssigned && available && !progress.complete && !definition.repeatable;
      if (current) {
        currentAssigned = true;
      }
      return {
        definition,
        progress,
        available,
        current
      };
    });
  }

  function objectiveHintText(definition) {
    if (!definition) {
      return "";
    }
    if (typeof definition.hint === "function") {
      return definition.hint();
    }
    return definition.hint || "";
  }

  function objectiveRenderSignature(snapshots) {
    return snapshots.map(function (snapshot) {
      return [
        snapshot.definition.id,
        snapshot.progress.complete ? "1" : "0",
        objectiveIsClaimed(snapshot.definition) ? "1" : "0",
        objectiveRewardText(objectiveRewardEntries(snapshot.definition)),
        snapshot.current ? "1" : "0",
        snapshot.available ? "1" : "0",
        snapshot.progress.label,
        objectiveHintText(snapshot.definition)
      ].join(":");
    }).join("|") + "|" + (objectivesOpen ? "open" : "closed") + "|" + objectiveState.selectedId;
  }

  function objectiveStatusText(snapshot) {
    if (!snapshot) {
      return "Objective";
    }
    if (objectiveCanClaim(snapshot)) {
      return objectiveRewardEntries(snapshot.definition).length ? "Claim reward" : "Claim objective";
    }
    if (snapshot.progress.complete && !snapshot.definition.repeatable) {
      return objectiveIsClaimed(snapshot.definition) ? "Claimed" : "Complete";
    }
    if (snapshot.current) {
      return "Current";
    }
    if (!snapshot.available) {
      return "Locked";
    }
    return snapshot.definition.repeatable ? "Ongoing" : "Ready";
  }

  function objectiveCanSelect(snapshot) {
    return Boolean(snapshot);
  }

  function objectiveIconText(definition) {
    if (definition && definition.icon) {
      return definition.icon;
    }
    return String((definition && definition.title) || "?").trim().charAt(0).toUpperCase() || "?";
  }

  function objectiveVisualStatus(snapshot) {
    if (objectiveIsAwaitingClaim(snapshot)) {
      return "unclaimed";
    }
    if (snapshot.progress.complete && objectiveIsClaimed(snapshot.definition)) {
      return "claimed";
    }
    if (!snapshot || !snapshot.available) {
      return "locked";
    }
    return "unlocked";
  }

  function objectiveSelectedSnapshot(snapshots, current) {
    let selected = snapshots.find((snapshot) => snapshot.definition.id === objectiveState.selectedId && objectiveCanSelect(snapshot));
    if (!selected) {
      selected = current || snapshots.find((snapshot) => objectiveCanSelect(snapshot)) || snapshots[0] || null;
      objectiveState.selectedId = selected ? selected.definition.id : "";
    }
    return selected;
  }

  function objectiveGraphZoom() {
    return clamp(finiteOr(objectiveState.zoom, 1), 0.35, 1.8);
  }

  function objectiveScaledGraphSize(size) {
    const zoom = objectiveGraphZoom();
    return {
      width: Math.ceil(size.width * zoom),
      height: Math.ceil(size.height * zoom)
    };
  }

  function objectiveTreeInteractionScale() {
    return objectiveTreeList && objectiveTreeList.offsetWidth > 0
      ? Math.max(0.1, objectiveTreeList.getBoundingClientRect().width / objectiveTreeList.offsetWidth)
      : 1;
  }

  function objectiveEdgePoints(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (!dx && !dy) {
      return { start, end };
    }
    const halfWidth = Math.max(1, finiteOr(objectiveGraphLayout.nodeWidth, 184) * 0.5);
    const halfHeight = Math.max(1, finiteOr(objectiveGraphLayout.nodeHeight, 64) * 0.5);
    const xScale = Math.abs(dx) > 0.001 ? halfWidth / Math.abs(dx) : Infinity;
    const yScale = Math.abs(dy) > 0.001 ? halfHeight / Math.abs(dy) : Infinity;
    const scale = Math.min(xScale, yScale, 0.42);

    return {
      start: {
        x: start.x + dx * scale,
        y: start.y + dy * scale
      },
      end: {
        x: end.x - dx * scale,
        y: end.y - dy * scale
      }
    };
  }
