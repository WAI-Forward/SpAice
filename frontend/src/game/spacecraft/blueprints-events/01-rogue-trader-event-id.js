  const rogueTraderEventId = "rogue-trader";
  const rogueTraderMapColor = { r: 255, g: 184, b: 96 };
  const rogueTraderEventSettings = {
    duration: 62,
    approachDuration: 18,
    serviceDriftDistance: 150,
    leaveSpeed: 520,
    leaveVerticalDrift: -28,
    disappearDistance: 2200,
    disappearRightDistance: 1700,
    radius: 900,
    targetDistanceMin: 1800,
    targetDistanceMax: 2600,
    spawnDistance: 3600,
    earliestSpawnTime: 10 * 60
  };
  const traderSniperRange = 1780;

  const spacecraftBlueprints = {
    "rogue-trader": {
      id: "rogue-trader",
      name: "Rogue Trader",
      width: 1120,
      height: 420,
      x: 0,
      y: 0,
      rotation: 0,
      door: {
        x: -560,
        y: -38,
        width: 142,
        height: 278,
        depth: 148,
        threshold: 56
      },
      components: [
        { id: "airlock", kind: "room", label: "Airlock", x: -440, y: -35, w: 210, h: 250, floorInset: 26, maxHealth: 240, color: "#30343d" },
        { id: "cargo-room", kind: "room", label: "Cargo Hold", x: -245, y: -35, w: 300, h: 250, floorInset: 26, maxHealth: 320, color: "#2c3037" },
        { id: "market-room", kind: "room", label: "Trading Bay", x: 75, y: -35, w: 380, h: 250, floorInset: 26, maxHealth: 390, color: "#282d34" },
        { id: "engine-room", kind: "room", label: "Engine Room", x: 415, y: -35, w: 300, h: 250, floorInset: 26, maxHealth: 340, color: "#2a2e33" },
        { id: "port-turret", kind: "turret", label: "Port Turret", x: -95, y: -224, radius: 32, maxHealth: 155, angle: -Math.PI / 2 },
        { id: "generator", kind: "generator", label: "Generator", x: 80, y: 80, w: 102, h: 64, maxHealth: 180, color: "#596a44" },
        { id: "battery", kind: "battery", label: "Battery", x: -155, y: 82, w: 96, h: 62, maxHealth: 155, color: "#566641" },
        { id: "life-support", kind: "life-support", label: "Life Support", x: -210, y: -126, w: 116, h: 68, maxHealth: 155, color: "#426656" },
        { id: "shield-core", kind: "shields", label: "Shield Core", x: 220, y: -126, w: 104, h: 66, maxHealth: 170, color: "#44526f" },
        { id: "main-engine", kind: "engine", label: "Main Engine", x: 545, y: 8, w: 110, h: 190, maxHealth: 220, color: "#514846" }
      ],
      npcs: [
        {
          id: "rogue-trader",
          name: "Rogue Trader",
          x: 24,
          y: 22,
          speed: 70,
          offers: [
            { id: "weapon-for-plating", pay: { weapon: 3 }, receive: { plating: 2 } },
            { id: "plating-for-shield", pay: { plating: 4 }, receive: { shield: 2 } },
            { id: "energy-for-propulsion", pay: { energy: 3 }, receive: { propulsion: 2 } },
            { id: "repair-plating-for-weapon", pay: { repair: 2, plating: 1 }, receive: { weapon: 2 } }
          ]
        }
      ]
    }
  };

  function spacecraftBlueprintById(id) {
    return spacecraftBlueprints[id] || null;
  }

  function spacecraftHashUnit(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function spacecraftStringSeed(value) {
    const text = String(value || "");
    let seed = 0;
    for (let i = 0; i < text.length; i += 1) {
      seed += text.charCodeAt(i) * (i + 1);
    }
    return seed || 1;
  }

  function createSpacecraftFromBlueprint(blueprintId, overrides) {
    const blueprint = spacecraftBlueprintById(blueprintId) || spacecraftBlueprints["rogue-trader"];
    const settings = overrides || {};
    const craft = {
      id: Number.isFinite(Number(settings.id)) ? Math.max(1, Math.floor(Number(settings.id))) : nextSpacecraftId++,
      kind: "spacecraft",
      blueprintId: blueprint.id,
      name: String(settings.name || blueprint.name || "Spacecraft"),
      x: finiteOr(settings.x, blueprint.x || 0),
      y: finiteOr(settings.y, blueprint.y || 0),
      vx: finiteOr(settings.vx, 0),
      vy: finiteOr(settings.vy, 0),
      eventId: String(settings.eventId || ""),
      rotation: finiteOr(settings.rotation, blueprint.rotation || 0),
      width: finiteOr(settings.width, blueprint.width || 640),
      height: finiteOr(settings.height, blueprint.height || 320),
      door: Object.assign({}, blueprint.door || {}),
      components: [],
      npcs: []
    };

    craft.components = (blueprint.components || []).map((component) => createSpacecraftComponent(component));
    craft.npcs = (blueprint.npcs || []).map((npc) => createSpacecraftNpc(npc, craft));
    updateSpacecraftWorldFields(craft);
    return craft;
  }

  function createSpacecraftComponent(component) {
    const maxHealth = Math.max(1, finiteOr(component.maxHealth, 100));
    const seed = spacecraftStringSeed(component.id || component.kind);
    return {
      id: String(component.id || "component"),
      kind: String(component.kind || "room"),
      label: String(component.label || component.kind || "Component"),
      x: finiteOr(component.x, 0),
      y: finiteOr(component.y, 0),
      w: Math.max(1, finiteOr(component.w, finiteOr(component.radius, 24) * 2)),
      h: Math.max(1, finiteOr(component.h, finiteOr(component.radius, 24) * 2)),
      floorInset: Math.max(0, finiteOr(component.floorInset, 24)),
      radius: Math.max(1, finiteOr(component.radius, Math.max(finiteOr(component.w, 40), finiteOr(component.h, 40)) * 0.5)),
      angle: finiteOr(component.angle, 0),
      aimAngle: finiteOr(component.angle, 0),
      shootCooldown: 0.3 + spacecraftHashUnit(seed) * 1.1,
      disabledTimer: 0,
      flash: 0,
      maxHealth,
      health: maxHealth,
      color: component.color || "#30343d"
    };
  }

  function createSpacecraftNpc(npc, craft) {
    const seed = spacecraftStringSeed(npc.id || npc.name);
    return {
      id: String(npc.id || "npc"),
      name: String(npc.name || "Trader"),
      x: finiteOr(npc.x, 0),
      y: finiteOr(npc.y, 0),
      targetX: finiteOr(npc.x, 0),
      targetY: finiteOr(npc.y, 0),
      speed: Math.max(20, finiteOr(npc.speed, 60)),
      radius: 24,
      walkCycle: spacecraftHashUnit(seed) * Math.PI * 2,
      wanderIndex: 0,
      aimAngle: 0,
      crouching: false,
      combatTarget: false,
      sniperCooldown: 1.2 + spacecraftHashUnit(seed + 11) * 1.2,
      sniperShotIndex: 0,
      offers: (Array.isArray(npc.offers) ? npc.offers : []).map(normalizeNpcTradeOffer).filter(Boolean),
      spacecraftId: craft.id
    };
  }

  function normalizeNpcTradeOffer(offer) {
    if (!offer || typeof offer !== "object") {
      return null;
    }

    const pay = normalizeTradeOffer(offer.pay);
    const receive = normalizeTradeOffer(offer.receive);
    if (tradeOfferTotal(pay) <= 0 || tradeOfferTotal(receive) <= 0) {
      return null;
    }

    return {
      id: String(offer.id || "offer"),
      pay,
      receive
    };
  }

  function ensureDefaultSpacecrafts() {
    syncSpacecraftsToRandomEventState();
  }

  function seedSpacecrafts() {
    spacecrafts.length = 0;
    nextSpacecraftId = 1;
  }

  function serializeSpacecraft(craft) {
    return {
      id: craft.id,
      blueprintId: craft.blueprintId,
      name: craft.name,
      x: craft.x,
      y: craft.y,
      vx: craft.vx,
      vy: craft.vy,
      eventId: craft.eventId || "",
      rotation: craft.rotation,
      width: craft.width,
      height: craft.height,
      components: craft.components.map((component) => ({
        id: component.id,
        kind: component.kind,
        label: component.label,
        x: component.x,
        y: component.y,
        w: component.w,
        h: component.h,
        floorInset: component.floorInset,
        radius: component.radius,
        angle: component.angle,
        aimAngle: component.aimAngle,
        shootCooldown: component.shootCooldown,
        disabledTimer: component.disabledTimer,
        maxHealth: component.maxHealth,
        health: component.health,
        color: component.color
      })),
      npcs: craft.npcs.map((npc) => ({
        id: npc.id,
        name: npc.name,
        x: npc.x,
        y: npc.y,
        targetX: npc.targetX,
        targetY: npc.targetY,
        walkCycle: npc.walkCycle,
        wanderIndex: npc.wanderIndex,
        aimAngle: npc.aimAngle,
        crouching: Boolean(npc.crouching),
        combatTarget: Boolean(npc.combatTarget),
        sniperCooldown: npc.sniperCooldown,
        sniperShotIndex: npc.sniperShotIndex
      }))
    };
  }

  function normalizeSpacecraftSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const blueprintId = spacecraftBlueprintById(snapshot.blueprintId) ? snapshot.blueprintId : "rogue-trader";
    const craft = createSpacecraftFromBlueprint(blueprintId, {
      id: snapshot.id,
      name: snapshot.name,
      x: snapshot.x,
      y: snapshot.y,
      vx: snapshot.vx,
      vy: snapshot.vy,
      eventId: snapshot.eventId,
      rotation: snapshot.rotation,
      width: snapshot.width,
      height: snapshot.height
    });

    if (Array.isArray(snapshot.components)) {
      const byId = new Map(craft.components.map((component) => [component.id, component]));
      for (const source of snapshot.components) {
        const component = source && byId.get(String(source.id || ""));
        if (!component) {
          continue;
        }
        component.health = clamp(finiteOr(source.health, component.health), 0, Math.max(1, finiteOr(source.maxHealth, component.maxHealth)));
        component.maxHealth = Math.max(1, finiteOr(source.maxHealth, component.maxHealth));
        component.floorInset = Math.max(0, finiteOr(source.floorInset, component.floorInset));
        component.aimAngle = finiteOr(source.aimAngle, component.aimAngle);
        component.shootCooldown = Math.max(0, finiteOr(source.shootCooldown, component.shootCooldown));
        component.disabledTimer = Math.max(0, finiteOr(source.disabledTimer, 0));
      }
    }

    if (Array.isArray(snapshot.npcs)) {
      const byId = new Map(craft.npcs.map((npc) => [npc.id, npc]));
      for (const source of snapshot.npcs) {
        const npc = source && byId.get(String(source.id || ""));
        if (!npc) {
          continue;
        }
        npc.x = finiteOr(source.x, npc.x);
        npc.y = finiteOr(source.y, npc.y);
        npc.targetX = finiteOr(source.targetX, npc.targetX);
        npc.targetY = finiteOr(source.targetY, npc.targetY);
        npc.walkCycle = finiteOr(source.walkCycle, npc.walkCycle);
        npc.wanderIndex = Math.max(0, Math.floor(finiteOr(source.wanderIndex, npc.wanderIndex)));
        npc.aimAngle = finiteOr(source.aimAngle, npc.aimAngle);
        npc.crouching = Boolean(source.crouching);
        npc.combatTarget = Boolean(source.combatTarget);
        npc.sniperCooldown = Math.max(0, finiteOr(source.sniperCooldown, npc.sniperCooldown));
        npc.sniperShotIndex = Math.max(0, Math.floor(finiteOr(source.sniperShotIndex, npc.sniperShotIndex)));
      }
    }

    updateSpacecraftWorldFields(craft);
    return craft;
  }

  function normalizeSpacecraftInteriorSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    return {
      spacecraftId: Math.max(1, Math.floor(finiteOr(snapshot.spacecraftId, 0))),
      localX: finiteOr(snapshot.localX, 0),
      localY: finiteOr(snapshot.localY, 0),
      walkSpeed: finiteOr(snapshot.walkSpeed, 0),
      forceExit: Boolean(snapshot.forceExit),
      forceExitSpeed: Math.max(0, finiteOr(snapshot.forceExitSpeed, 0)),
      onFloor: snapshot.onFloor !== false
    };
  }

  function findSpacecraftById(id) {
    const numericId = Math.max(1, Math.floor(finiteOr(id, 0)));
    return spacecrafts.find((craft) => craft.id === numericId) || null;
  }

  function activePlayerSpacecraft() {
    return player.spacecraftInterior ? findSpacecraftById(player.spacecraftInterior.spacecraftId) : null;
  }

  function isPlayerInsideSpacecraft() {
    return Boolean(player.spacecraftInterior && activePlayerSpacecraft());
  }

  function playerIsOnFoot() {
    return Boolean(player.landed || isPlayerInsideSpacecraft());
  }

  function spacecraftLocalToWorld(craft, localX, localY) {
    const angle = finiteOr(craft.rotation, 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: craft.x + localX * cos - localY * sin,
      y: craft.y + localX * sin + localY * cos
    };
  }

  function spacecraftWorldToLocal(craft, worldX, worldY) {
    const angle = -finiteOr(craft.rotation, 0);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = worldX - craft.x;
    const dy = worldY - craft.y;
    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos
    };
  }

  function updateSpacecraftWorldFields(craft) {
    for (const component of craft.components) {
      const world = spacecraftLocalToWorld(craft, component.x, component.y);
      component.worldX = world.x;
      component.worldY = world.y;
      component.hitRadius = spacecraftComponentHitRadius(component);
    }
    for (const npc of craft.npcs) {
      const world = spacecraftLocalToWorld(craft, npc.x, npc.y);
      npc.worldX = world.x;
      npc.worldY = world.y;
    }
  }

  function rogueTraderWeight(state) {
    if (currentRunElapsedSeconds() < rogueTraderEventSettings.earliestSpawnTime) {
      return 0;
    }
    const history = Array.isArray(state && state.history) ? state.history : [];
    if (!history.length) {
      return 0.85;
    }
    const visits = randomEventHistoryCount(rogueTraderEventId);
    return visits <= 0 ? 0.65 : 0.14;
  }

  function activeRogueTraderEvent() {
    const active = randomEventState.active;
    return active && active.id === rogueTraderEventId ? active : null;
  }

  function chooseRogueTraderRegion() {
    const anchors = activePartyPlayerAnchors();
    const source = anchors[Math.floor(Math.random() * anchors.length)] || player;
    const targetDistance = randomRange(rogueTraderEventSettings.targetDistanceMin, rogueTraderEventSettings.targetDistanceMax);
    const verticalOffset = randomRange(-260, 140);
    const sourceX = finiteOr(source.x, player.x);
    const sourceY = finiteOr(source.y, player.y);
    const targetX = sourceX + targetDistance;
    const targetY = sourceY + verticalOffset;
    const spawnDistance = rogueTraderEventSettings.spawnDistance + randomRange(0, 260);
    return {
      targetX,
      targetY,
      startX: sourceX - spawnDistance,
      startY: targetY + randomRange(-120, 120),
      exitX: targetX + rogueTraderEventSettings.disappearRightDistance + 520,
      exitY: targetY + randomRange(-160, 120),
      radius: rogueTraderEventSettings.radius
    };
  }

  function findRogueTraderEventCraft(active) {
    if (active && active.spacecraftId) {
      const byId = findSpacecraftById(active.spacecraftId);
      if (byId && byId.eventId === rogueTraderEventId) {
        return byId;
      }
    }
    return spacecrafts.find((craft) => craft && craft.eventId === rogueTraderEventId) || null;
  }

  function createRogueTraderEventCraft(active) {
    const craft = createSpacecraftFromBlueprint("rogue-trader", {
      id: active && active.spacecraftId,
      x: finiteOr(active && active.startX, player.x + 1600),
      y: finiteOr(active && active.startY, player.y),
      eventId: rogueTraderEventId
    });
    craft.eventId = rogueTraderEventId;
    spacecrafts.push(craft);
    if (active) {
      active.spacecraftId = craft.id;
    }
    updateSpacecraftWorldFields(craft);
    return craft;
  }

  function removeSpacecraft(craft, reason) {
    if (!craft) {
      return;
    }
    if (player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id) {
      ejectPlayerFromSpacecraft(craft, reason || (craft.name + " leaving."));
    }
    const index = spacecrafts.indexOf(craft);
    if (index >= 0) {
      spacecrafts.splice(index, 1);
    }
  }

  function syncSpacecraftsToRandomEventState() {
    const active = activeRogueTraderEvent();
    if (!active) {
      for (let i = spacecrafts.length - 1; i >= 0; i -= 1) {
        removeSpacecraft(spacecrafts[i], "Rogue Trader departing.");
      }
      return null;
    }

    let craft = findRogueTraderEventCraft(active);
    if (!craft) {
      craft = createRogueTraderEventCraft(active);
    }
    active.spacecraftId = craft.id;
    for (let i = spacecrafts.length - 1; i >= 0; i -= 1) {
      const candidate = spacecrafts[i];
      if (candidate !== craft) {
        removeSpacecraft(candidate, "Rogue Trader departing.");
      }
    }
    return craft;
  }

  function smoothEventStep(value) {
    const t = clamp(finiteOr(value, 0), 0, 1);
    return t * t * (3 - 2 * t);
  }

