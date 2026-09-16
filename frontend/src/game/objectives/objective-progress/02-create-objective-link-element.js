  function createObjectiveLinkElement(namespace, start, end, status, glow) {
    const line = document.createElementNS(namespace, "line");
    const points = objectiveEdgePoints(start, end);
    line.classList.add(glow ? "objective-tree__link-glow" : "objective-tree__link");
    line.classList.add("is-" + status);
    line.setAttribute("x1", points.start.x.toFixed(1));
    line.setAttribute("y1", points.start.y.toFixed(1));
    line.setAttribute("x2", points.end.x.toFixed(1));
    line.setAttribute("y2", points.end.y.toFixed(1));
    return line;
  }

  function createObjectiveLinkLayer(snapshots, size) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    const byId = new Map();

    svg.classList.add("objective-tree__links");
    svg.setAttribute("viewBox", "0 0 " + size.width + " " + size.height);
    svg.setAttribute("aria-hidden", "true");

    for (const snapshot of snapshots) {
      byId.set(snapshot.definition.id, snapshot);
    }

    for (const snapshot of snapshots) {
      const prerequisites = Array.isArray(snapshot.definition.prerequisites)
        ? snapshot.definition.prerequisites
        : (snapshot.definition.parent ? [snapshot.definition.parent] : []);
      for (const prerequisiteId of prerequisites) {
        const parent = byId.get(prerequisiteId);
        if (!parent) {
          continue;
        }

        const start = objectiveGraphPosition(parent.definition);
        const end = objectiveGraphPosition(snapshot.definition);
        const status = objectiveVisualStatus(snapshot);
        svg.append(
          createObjectiveLinkElement(namespace, start, end, status, true),
          createObjectiveLinkElement(namespace, start, end, status, false)
        );
      }
    }

    return svg;
  }

  function createObjectiveNode(snapshot, selected) {
    const definition = snapshot.definition;
    const progress = snapshot.progress;
    const position = objectiveGraphPosition(definition);
    const node = document.createElement("button");
    const icon = document.createElement("span");
    const selectable = objectiveCanSelect(snapshot);
    const selectedNode = selected && selected.definition.id === definition.id;

    node.className = "objective-node";
    node.type = "button";
    node.style.left = position.x + "px";
    node.style.top = position.y + "px";
    node.classList.add("is-" + objectiveVisualStatus(snapshot));
    node.classList.toggle("is-current", snapshot.current);
    node.classList.toggle("is-selected", selectedNode);
    node.dataset.objectiveId = definition.id;
    node.disabled = !selectable;
    node.title = definition.title + " - " + objectiveStatusText(snapshot);
    node.setAttribute("aria-label", definition.title + ". " + objectiveStatusText(snapshot) + ". " + objectiveHintText(definition));
    node.setAttribute("aria-pressed", selectedNode ? "true" : "false");

    icon.className = "objective-node__icon";
    icon.textContent = objectiveIconText(definition);

    node.addEventListener("click", function () {
      if (!selectable) {
        return;
      }
      objectiveState.selectedId = definition.id;
      objectiveState.renderSignature = "";
      renderObjectiveTree(true);
    });

    node.append(icon);
    return node;
  }

  function renderObjectiveDetail(snapshot, completeCount, totalCount) {
    if (!objectiveTreeDetail) {
      return;
    }

    objectiveTreeDetail.textContent = "";
    const eyebrow = document.createElement("div");
    const title = document.createElement("div");
    const description = document.createElement("p");
    const progress = document.createElement("div");

    eyebrow.className = "objective-detail__eyebrow";
    title.className = "objective-detail__title";
    description.className = "objective-detail__description";
    progress.className = "objective-detail__progress";

    if (snapshot) {
      const rewards = objectiveRewardEntries(snapshot.definition);
      eyebrow.textContent = objectiveStatusText(snapshot);
      title.textContent = snapshot.definition.title;
      description.textContent = objectiveHintText(snapshot.definition);
      progress.textContent = snapshot.progress.complete && !snapshot.definition.repeatable
        ? "Complete"
        : snapshot.progress.label || completeCount + " / " + totalCount + " complete";
      if (rewards.length || (snapshot.progress.complete && !snapshot.definition.repeatable)) {
        const reward = document.createElement("div");
        const rewardLabel = document.createElement("span");
        const rewardValue = document.createElement("strong");
        const claim = document.createElement("button");
        const claimed = objectiveIsClaimed(snapshot.definition);

        reward.className = "objective-detail__reward";
        rewardLabel.className = "objective-detail__reward-label";
        rewardValue.className = "objective-detail__reward-value";
        claim.className = "objective-detail__claim";
        rewardLabel.textContent = rewards.length ? "Reward" : "Objective";
        rewardValue.textContent = rewards.length ? objectiveRewardText(rewards) : (claimed ? "Claimed" : "Ready to claim");
        claim.type = "button";
        claim.textContent = claimed ? "Claimed" : "Claim";
        claim.disabled = claimed || !snapshot.progress.complete;
        claim.addEventListener("click", function () {
          claimObjectiveReward(snapshot.definition.id);
        });
        reward.append(rewardLabel, rewardValue, claim);
        objectiveTreeDetail.append(eyebrow, title, description, progress, reward);
        return;
      }
    } else {
      eyebrow.textContent = "Done";
      title.textContent = "Objective chain complete";
      description.textContent = "Keep growing, collecting tech, and pushing your total score.";
      progress.textContent = completeCount + " / " + totalCount + " complete";
    }

    objectiveTreeDetail.append(eyebrow, title, description, progress);
  }

  function renderObjectiveTree(force) {
    if (!objectiveTreeList && !objectiveSummary) {
      return;
    }

    const snapshots = objectiveSnapshots();
    const completeCount = snapshots.filter((snapshot) => snapshot.progress.complete && !snapshot.definition.repeatable).length;
    const totalCount = snapshots.filter((snapshot) => !snapshot.definition.repeatable).length;
    const current = snapshots.find((snapshot) => snapshot.current) || snapshots.find((snapshot) => snapshot.definition.repeatable);
    const selected = objectiveSelectedSnapshot(snapshots, current);
    const signature = objectiveRenderSignature(snapshots);
    updateObjectiveClaimUi(snapshots);

    if (!force && objectiveState.renderSignature === signature) {
      return;
    }
    objectiveState.renderSignature = signature;

    if (objectiveSummary) {
      const summary = current
        ? completeCount + " / " + totalCount + " done - " + current.definition.title
        : completeCount + " / " + totalCount + " done";
      setTextIfChanged(objectiveSummary, summary);
    }

    if (!objectivesOpen) {
      return;
    }

    renderObjectiveDetail(selected, completeCount, totalCount);

    if (!objectiveTreeList) {
      return;
    }

    objectiveState.scrollLeft = objectiveTreeList.scrollLeft;
    objectiveState.scrollTop = objectiveTreeList.scrollTop;
    objectiveTreeList.textContent = "";
    const graphSize = objectiveGraphSize(snapshots);
    const scaledGraphSize = objectiveScaledGraphSize(graphSize);
    const zoom = objectiveGraphZoom();
    const viewport = document.createElement("div");
    const graph = document.createElement("div");
    viewport.className = "objective-tree__viewport";
    viewport.style.width = scaledGraphSize.width + "px";
    viewport.style.height = scaledGraphSize.height + "px";
    graph.className = "objective-tree__graph";
    graph.style.width = graphSize.width + "px";
    graph.style.height = graphSize.height + "px";
    graph.style.transform = "scale(" + zoom.toFixed(3) + ")";
    graph.append(createObjectiveLinkLayer(snapshots, graphSize));

    for (const snapshot of snapshots) {
      graph.append(createObjectiveNode(snapshot, selected));
    }
    viewport.append(graph);
    objectiveTreeList.append(viewport);

    if (objectiveState.hasUserPanned) {
      objectiveTreeList.scrollLeft = objectiveState.scrollLeft;
      objectiveTreeList.scrollTop = objectiveState.scrollTop;
    } else if (selected) {
      const position = objectiveGraphPosition(selected.definition);
      objectiveTreeList.scrollLeft = Math.max(0, position.x * zoom - objectiveTreeList.clientWidth * 0.5);
      objectiveTreeList.scrollTop = Math.max(0, position.y * zoom - objectiveTreeList.clientHeight * 0.5);
    }
  }

  function updateObjectiveState() {
    const frameId = typeof currentRenderFrameId === "function" ? currentRenderFrameId() : 0;
    if (!objectivesOpen && frameId - objectiveState.lastUpdateFrameId < 15) {
      return;
    }
    objectiveState.lastUpdateFrameId = frameId;
    const before = Object.assign({}, objectiveState.completed);
    const snapshots = objectiveSnapshots();
    for (const snapshot of snapshots) {
      const id = snapshot.definition.id;
      if (snapshot.progress.complete && !before[id] && !snapshot.definition.repeatable) {
        maybeNotifyText("Objective complete: " + snapshot.definition.title, {
          groupKey: "objective:" + id,
          lifetime: 6200,
          actions: [{
            label: "View",
            onClick: function () {
              viewObjective(id);
            }
          }]
        });
      }
    }
    renderObjectiveTree(false);
  }

  function viewObjective(id) {
    objectiveState.selectedId = String(id || "");
    objectiveState.hasUserPanned = false;
    objectiveState.renderSignature = "";
    setObjectivesOpen(true);
    renderObjectiveTree(true);
  }

  function applyObjectiveRewardClaim(snapshot) {
    if (!objectiveCanClaim(snapshot)) {
      return null;
    }

    const rewards = objectiveRewardEntries(snapshot.definition);
    for (const reward of rewards) {
      if (reward.blueprintId) {
        continue;
      }
      const techKey = reward.techKey;
      const amount = Math.max(1, Math.floor(finiteOr(reward.amount, 1)));
      if (techTypes.some((tech) => tech.key === techKey)) {
        techInventory[techKey] = Math.max(0, Math.floor(techInventory[techKey] || 0)) + amount;
      }
    }

    objectiveState.claimed[snapshot.definition.id] = true;
    return rewards;
  }

  function claimObjectiveReward(id) {
    const objectiveId = String(id || "");
    const snapshot = objectiveSnapshots().find(function (candidate) {
      return candidate.definition.id === objectiveId;
    });
    const rewards = applyObjectiveRewardClaim(snapshot);
    if (!rewards) {
      return;
    }

    objectiveState.renderSignature = "";
    updateTechUi();
    renderObjectiveTree(true);
    playSound("pickupTech");
    maybeNotifyText(
      rewards.length ? "Claimed " + objectiveRewardText(rewards) + "." : "Claimed objective.",
      { groupKey: "objective-claim:" + objectiveId }
    );
  }

  function claimAllObjectiveRewards() {
    const claimable = objectiveClaimableSnapshots(objectiveSnapshots());
    if (!claimable.length) {
      return;
    }

    for (const snapshot of claimable) {
      applyObjectiveRewardClaim(snapshot);
    }

    objectiveState.renderSignature = "";
    updateTechUi();
    renderObjectiveTree(true);
    playSound("pickupTech");
    maybeNotifyText(
      "Claimed " + claimable.length + " objective reward" + (claimable.length === 1 ? "" : "s") + ".",
      { groupKey: "objective-claim-all" }
    );
  }

  function serializeObjectiveState() {
    return {
      completed: Object.keys(objectiveState.completed).filter((id) => objectiveState.completed[id] === true),
      claimed: Object.keys(objectiveState.claimed).filter((id) => objectiveState.claimed[id] === true),
      createdBodyMass: Math.max(0, finiteOr(objectiveState.createdBodyMass, 0))
    };
  }

  function applyObjectiveState(snapshot) {
    objectiveState.completed = Object.create(null);
    objectiveState.claimed = Object.create(null);
    objectiveState.createdBodyMass = Math.max(0, finiteOr(snapshot && snapshot.createdBodyMass, 0));
    objectiveState.selectedId = "";
    const source = snapshot && typeof snapshot === "object" && Array.isArray(snapshot.completed) ? snapshot.completed : [];
    for (const id of source) {
      if (objectiveDefinitions.some((definition) => definition.id === id)) {
        objectiveState.completed[id] = true;
      }
    }
    const claimed = snapshot && typeof snapshot === "object" && Array.isArray(snapshot.claimed) ? snapshot.claimed : [];
    for (const id of claimed) {
      if (objectiveDefinitions.some((definition) => definition.id === id)) {
        objectiveState.claimed[id] = true;
      }
    }
    objectiveState.renderSignature = "";
    objectiveState.lastUpdateFrameId = -1000;
    renderObjectiveTree(true);
  }

  function resetObjectiveState() {
    applyObjectiveState({ completed: [], claimed: [], createdBodyMass: 0 });
  }

  function serializeRandomEventState() {
    return {
      enabled: randomEventState.enabled !== false,
      cooldown: Math.max(randomEventMinimumCooldown, finiteOr(randomEventState.cooldown, randomEventDefaultCooldown)),
      timer: Math.max(0, finiteOr(randomEventState.timer, randomEventState.cooldown)),
      active: randomEventState.active && typeof randomEventState.active === "object" ? { ...randomEventState.active } : null,
      history: Array.isArray(randomEventState.history) ? randomEventState.history.slice(-12) : []
    };
  }

  function applyRandomEventState(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    randomEventState.enabled = source.enabled !== false;
    randomEventState.cooldown = Math.max(randomEventMinimumCooldown, finiteOr(source.cooldown, randomEventDefaultCooldown));
    randomEventState.timer = Math.max(0, finiteOr(source.timer, randomEventState.cooldown));
    if (source.active && typeof source.active === "object") {
      const duration = Math.max(1, finiteOr(source.active.duration, 30));
      const elapsed = Math.max(0, finiteOr(source.active.elapsed, 0));
      randomEventState.active = elapsed < duration
        ? {
          ...source.active,
          duration,
          elapsed,
          timer: Math.max(0, finiteOr(source.active.timer, duration - elapsed))
        }
        : null;
    } else {
      randomEventState.active = null;
    }
    randomEventState.history = Array.isArray(source.history) ? source.history.slice(-12).map((entry) => String(entry || "")).filter(Boolean) : [];
  }

  function resetRandomEventState() {
    applyRandomEventState({
      enabled: true,
      cooldown: randomEventDefaultCooldown,
      timer: randomEventDefaultCooldown,
      active: null,
      history: []
    });
  }

  function registerRandomEvent(definition) {
    if (!definition || typeof definition !== "object" || !definition.id) {
      return false;
    }
    const id = String(definition.id);
    const index = randomEventDefinitions.findIndex((candidate) => candidate.id === id);
    const cleanDefinition = { ...definition, id };
    if (index >= 0) {
      randomEventDefinitions[index] = cleanDefinition;
    } else {
      randomEventDefinitions.push(cleanDefinition);
    }
    return true;
  }

  function chooseRandomEventDefinition() {
    const candidates = randomEventDefinitions.map(function (definition) {
      if (definition.canStart && definition.canStart(randomEventState) === false) {
        return null;
      }
      let weight = typeof definition.weight === "function"
        ? definition.weight(randomEventState)
        : finiteOr(definition.weight, 1);
      weight = Math.max(0, finiteOr(weight, 0));
      return weight > 0 ? { definition, weight } : null;
    }).filter(Boolean);
    const totalWeight = candidates.reduce(function (total, candidate) {
      return total + candidate.weight;
    }, 0);
    if (totalWeight <= 0) {
      return null;
    }
    let roll = Math.random() * totalWeight;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) {
        return candidate.definition;
      }
    }
    return candidates[candidates.length - 1].definition;
  }

  function randomEventHistoryCount(id) {
    const eventId = String(id || "");
    if (!eventId || !Array.isArray(randomEventState.history)) {
      return 0;
    }
    return randomEventState.history.reduce(function (count, entry) {
      return count + (entry === eventId ? 1 : 0);
    }, 0);
  }
