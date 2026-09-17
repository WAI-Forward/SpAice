  function normalizePickup(source, fallbackId, type) {
    const snapshot = source && typeof source === "object" ? source : {};
    const id = Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1)));
    if (type === "tech") {
      const key = TECH_KEYS.includes(snapshot.key) ? snapshot.key : "suction";
      return {
        id,
        key,
        label: key,
        color: normalizeColor(snapshot.color, { r: 255, g: 115, b: 173 }),
        x: finiteOr(snapshot.x, 0),
        y: finiteOr(snapshot.y, 0),
        vx: clamp(snapshot.vx, -2200, 2200),
        vy: clamp(snapshot.vy, -2200, 2200),
        radius: finiteOr(snapshot.radius, 15),
        life: clamp(snapshot.life, 0, 28),
        maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, 28)),
        rotation: finiteOr(snapshot.rotation, 0),
        wobble: finiteOr(snapshot.wobble, 0)
      };
    }
    return {
      id,
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      radius: finiteOr(snapshot.radius, 14),
      heal: clamp(snapshot.heal, 1, 100),
      life: clamp(snapshot.life, 0, HEALTH_PICKUP_LIFETIME),
      maxLife: Math.max(0.1, finiteOr(snapshot.maxLife, HEALTH_PICKUP_LIFETIME)),
      wobble: finiteOr(snapshot.wobble, 0)
    };
  }

  function bossStarRankValue(value) {
    return Math.max(0, Math.floor(finiteOr(value, 0)));
  }

  function bossStarRank(mob) {
    return mob && mob.isBoss ? bossStarRankValue(mob.bossStars) : 0;
  }

  function bossHealthScaleForStars(stars) {
    return 1 + bossStarRankValue(stars) * MOB_BOSS_STAR_HEALTH_MULTIPLIER;
  }

  function bossStatScaleForStars(stars, perStar) {
    return 1 + bossStarRankValue(stars) * Math.max(0, finiteOr(perStar, 0));
  }

  function bossCooldownScaleForStars(stars) {
    return clamp(1 - bossStarRankValue(stars) * MOB_BOSS_STAR_COOLDOWN_REDUCTION, 0.42, 1);
  }

  function mobEliteStarRankValue(value) {
    return clamp(Math.floor(finiteOr(value, 0)), 0, MOB_ELITE_MAX_STARS);
  }

  function mobEliteStarRank(mob) {
    return mob && !mob.isBoss ? mobEliteStarRankValue(mob.eliteStars) : 0;
  }

  function mobEliteRewardValue(mob) {
    const stars = mobEliteStarRank(mob);
    return stars > 0
      ? Math.max(1, Math.floor(finiteOr(mob && mob.eliteGroupSize, stars * MOB_ELITE_COMPRESSION_SIZE)))
      : 1;
  }

  function mobEliteHealthScale(stars) {
    return 1 + mobEliteStarRankValue(stars) * MOB_ELITE_HEALTH_MULTIPLIER;
  }

  function mobEliteRadiusScale(stars) {
    return 1 + mobEliteStarRankValue(stars) * MOB_ELITE_RADIUS_MULTIPLIER;
  }

  function mobEliteStatScale(mob, perStar) {
    const stars = mobEliteStarRank(mob);
    return stars > 0 ? 1 + stars * Math.max(0, finiteOr(perStar, 0)) : 1;
  }

  function mobEliteCooldownScale(mob) {
    const stars = mobEliteStarRank(mob);
    return stars > 0 ? clamp(1 - stars * MOB_ELITE_COOLDOWN_REDUCTION, 0.7, 1) : 1;
  }

  function normalizeEntity(source, fallbackId, kind) {
    const snapshot = source && typeof source === "object" ? source : {};
    const defaultMaxHealthByKind = {
      alienoid: 100,
      ufo: 130,
      rambot: 210,
      engineer: 140,
      tesla: 150,
      satellite: 180,
      rocket: 170,
      fighter: 230
    };
    const isBoss = Boolean(snapshot.isBoss);
    const bossStars = isBoss ? bossStarRankValue(snapshot.bossStars) : 0;
    const eliteStars = isBoss ? 0 : mobEliteStarRankValue(snapshot.eliteStars);
    const eliteGroupSize = eliteStars > 0
      ? Math.max(MOB_ELITE_COMPRESSION_SIZE, Math.floor(finiteOr(snapshot.eliteGroupSize, eliteStars * MOB_ELITE_COMPRESSION_SIZE)))
      : 1;
    const baseMaxHealth = defaultMaxHealthByKind[kind] || 130;
    const maxHealthCap = isBoss
      ? baseMaxHealth * MOB_BOSS_HEALTH_MULTIPLIER * bossHealthScaleForStars(bossStars)
      : baseMaxHealth * mobEliteHealthScale(eliteStars);
    const maxHealth = clamp(finiteOr(snapshot.maxHealth, maxHealthCap), 1, maxHealthCap);
    const baseRadius = finiteOr(snapshot.radius, 28);
    return {
      ...clone(snapshot),
      kind: snapshot.kind || kind,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      radius: Math.max(1, isBoss && !Number.isFinite(Number(snapshot.radius)) ? baseRadius * MOB_BOSS_RADIUS_MULTIPLIER : baseRadius),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      tractorDisabledTimer: kind === "ufo" ? Math.max(0, finiteOr(snapshot.tractorDisabledTimer, 0)) : undefined,
      bossBeamMode: kind === "ufo" ? normalizeUfoBossBeamModeValue(snapshot.bossBeamMode) : undefined,
      bossBeamTimer: kind === "ufo" ? Math.max(0, finiteOr(snapshot.bossBeamTimer, UFO_BOSS_NORMAL_BEAM_DURATION)) : undefined,
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      shootCooldown: Math.max(0, finiteOr(snapshot.shootCooldown, kind === "alienoid" ? 1.2 : 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      color: normalizeColor(snapshot.color, { r: 112, g: 226, b: 255 }),
      team: snapshot.team === "player" ? "player" : "",
      familiarOwnerPlayerId: typeof snapshot.familiarOwnerPlayerId === "string" ? snapshot.familiarOwnerPlayerId : "",
      familiarCommandX: finiteOr(snapshot.familiarCommandX, 0),
      familiarCommandY: finiteOr(snapshot.familiarCommandY, 0),
      familiarCommandTimer: Math.max(0, finiteOr(snapshot.familiarCommandTimer, 0)),
      summonAge: Math.max(0, finiteOr(snapshot.summonAge, 0)),
      summonDuration: Math.max(0, finiteOr(snapshot.summonDuration, 0)),
      summonBaseRadius: Math.max(0, finiteOr(snapshot.summonBaseRadius, baseRadius)),
      summonSpinSpeed: finiteOr(snapshot.summonSpinSpeed, 0),
      survivalCampId: typeof snapshot.survivalCampId === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot.survivalCampY, 0),
      survivalCampHomeX: finiteOr(snapshot.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(snapshot.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(snapshot.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(snapshot.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof snapshot.survivalCampLastMoverPlayerId === "string" ? snapshot.survivalCampLastMoverPlayerId : "",
      survivalCampLeashRadius: Math.max(0, finiteOr(snapshot.survivalCampLeashRadius, 0)),
      survivalCampAggroTimer: Math.max(0, finiteOr(snapshot.survivalCampAggroTimer, 0)),
      survivalCampReturning: Boolean(snapshot.survivalCampReturning),
      survivalCampSlotAngle: finiteOr(snapshot.survivalCampSlotAngle, 0),
      survivalCampSlotRadius: Math.max(0, finiteOr(snapshot.survivalCampSlotRadius, 0)),
      survivalMigrationCampId: typeof snapshot.survivalMigrationCampId === "string" ? snapshot.survivalMigrationCampId : "",
      survivalMigrationCampX: finiteOr(snapshot.survivalMigrationCampX, Number.NaN),
      survivalMigrationCampY: finiteOr(snapshot.survivalMigrationCampY, Number.NaN),
      survivalMigrationStraightTime: Math.max(0, finiteOr(snapshot.survivalMigrationStraightTime, 0)),
      survivalMigrationDirX: finiteOr(snapshot.survivalMigrationDirX, 0),
      survivalMigrationDirY: finiteOr(snapshot.survivalMigrationDirY, 0),
      survivalEncounterType: ["camp", "migration", "salvage"].includes(snapshot.survivalEncounterType) ? snapshot.survivalEncounterType : "",
      survivalEncounterId: typeof snapshot.survivalEncounterId === "string" ? snapshot.survivalEncounterId : "",
      survivalTargetPlayerId: typeof snapshot.survivalTargetPlayerId === "string" ? snapshot.survivalTargetPlayerId : "",
      survivalSalvageBodyId: Math.max(0, Math.floor(finiteOr(snapshot.survivalSalvageBodyId, 0))),
      survivalSalvageSourceCampId: typeof snapshot.survivalSalvageSourceCampId === "string" ? snapshot.survivalSalvageSourceCampId : "",
      survivalSalvageTargetCampId: typeof snapshot.survivalSalvageTargetCampId === "string" ? snapshot.survivalSalvageTargetCampId : "",
      survivalSalvageAge: Math.max(0, finiteOr(snapshot.survivalSalvageAge, 0)),
      survivalCampBudget: Math.max(0, finiteOr(snapshot.survivalCampBudget, 0)),
      survivalCampBand: typeof snapshot.survivalCampBand === "string" ? snapshot.survivalCampBand : "",
      eliteStars,
      eliteGroupSize,
      isBoss,
      bossBaseKind: isBoss ? String(snapshot.bossBaseKind || kind) : "",
      bossStars,
      minionCooldown: isBoss ? clamp(finiteOr(snapshot.minionCooldown, MOB_BOSS_MINION_COOLDOWN_MIN), 0, MOB_BOSS_MINION_COOLDOWN_MAX) : 0,
      altAttackCooldown: isBoss ? clamp(finiteOr(snapshot.altAttackCooldown, MOB_BOSS_ALT_ATTACK_COOLDOWN_MIN), 0, MOB_BOSS_ALT_ATTACK_COOLDOWN_MAX) : 0,
      bossBodyEvadeTimer: clamp(finiteOr(snapshot.bossBodyEvadeTimer, 0), 0, BOSS_BODY_EVADE_DURATION),
      bossBodyEvadeSpeedCap: clamp(finiteOr(snapshot.bossBodyEvadeSpeedCap, 0), 0, BOSS_BODY_EVADE_MAX_SPEED)
    };
  }

  function mobBeaconColor(kind) {
    if (kind === "ufo") return { r: 112, g: 226, b: 255 };
    if (kind === "rambot") return { r: 184, g: 196, b: 204 };
    if (kind === "engineer") return { r: 102, g: 224, b: 184 };
    if (kind === "tesla") return { r: 157, g: 255, b: 122 };
    if (kind === "satellite") return { r: 169, g: 133, b: 255 };
    if (kind === "rocket") return { r: 244, g: 150, b: 92 };
    if (kind === "fighter") return { r: 119, g: 167, b: 255 };
    return { r: 255, g: 115, b: 173 };
  }

  function mobBeaconMaxHealth(kind) {
    const tier = Math.max(0, MOB_TIER_ORDER.indexOf(kind));
    return 260 + tier * 34;
  }

  function isMobBeacon(entity) {
    return Boolean(entity && entity.isBeacon);
  }

  function mobEntityKind(entity) {
    const kind = isMobBeacon(entity) ? entity.beaconKind : entity && entity.kind;
    return MOB_TIER_ORDER.includes(kind) ? kind : "alienoid";
  }

  function normalizeMobBeacon(source, fallbackId) {
    const snapshot = source && typeof source === "object" ? source : {};
    const kind = MOB_TIER_ORDER.includes(snapshot.beaconKind)
      ? snapshot.beaconKind
      : MOB_TIER_ORDER.includes(snapshot.kind)
      ? snapshot.kind
      : "alienoid";
    const maxHealth = Math.max(1, finiteOr(snapshot.maxHealth, mobBeaconMaxHealth(kind)));
    return {
      kind: "beacon",
      beaconKind: kind,
      isBeacon: true,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId || 1))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: clamp(snapshot.vx, -2200, 2200),
      vy: clamp(snapshot.vy, -2200, 2200),
      radius: Math.max(12, finiteOr(snapshot.radius, 46)),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      color: normalizeColor(snapshot.color, mobBeaconColor(kind)),
      rotation: finiteOr(snapshot.rotation, 0),
      wobble: finiteOr(snapshot.wobble, 0),
      age: Math.max(0, finiteOr(snapshot.age, 0)),
      respawnTimer: clamp(finiteOr(snapshot.respawnTimer, 0), 0, MOB_BEACON_RESPAWN_DURATION),
      driftAngle: finiteOr(snapshot.driftAngle, 0),
      gadgetForceTimer: Math.max(0, finiteOr(snapshot.gadgetForceTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1
    };
  }

  function normalizeRandomEventState(source) {
    const snapshot = source && typeof source === "object" ? source : {};
    const activeSource = snapshot.active && typeof snapshot.active === "object" ? snapshot.active : null;
    let active = null;
    if (activeSource) {
      const duration = Math.max(1, finiteOr(activeSource.duration, 30));
      const elapsed = Math.max(0, finiteOr(activeSource.elapsed, 0));
      if (elapsed < duration) {
        active = {
          ...activeSource,
          duration,
          elapsed,
          timer: Math.max(0, finiteOr(activeSource.timer, duration - elapsed))
        };
      }
    }
    return {
      enabled: snapshot.enabled !== false,
      cooldown: Math.max(RANDOM_EVENT_MIN_COOLDOWN, finiteOr(snapshot.cooldown, RANDOM_EVENT_DEFAULT_COOLDOWN)),
      timer: Math.max(0, finiteOr(snapshot.timer, snapshot.cooldown || RANDOM_EVENT_DEFAULT_COOLDOWN)),
      active,
      history: Array.isArray(snapshot.history) ? snapshot.history.slice(-12).map((entry) => String(entry || "")).filter(Boolean) : []
    };
  }

  function serializeRandomEventState(source) {
    return normalizeRandomEventState(source);
  }

  function registerRandomEventDefinition(definition) {
    if (!definition || typeof definition !== "object" || !definition.id) {
      return false;
    }
    const id = String(definition.id);
    const index = RANDOM_EVENT_DEFINITIONS.findIndex((candidate) => candidate.id === id);
    const cleanDefinition = { ...definition, id };
    if (index >= 0) {
      RANDOM_EVENT_DEFINITIONS[index] = cleanDefinition;
    } else {
      RANDOM_EVENT_DEFINITIONS.push(cleanDefinition);
    }
    return true;
  }

  function randomEventHistoryCount(randomEvents, id) {
    const eventId = String(id || "");
    const history = Array.isArray(randomEvents && randomEvents.history) ? randomEvents.history : [];
    return history.reduce((count, entry) => count + (String(entry || "") === eventId ? 1 : 0), 0);
  }

  function activeRandomEventPlayers(state) {
    const players = Object.values(state && state.players || {}).filter((entry) => entry && finiteOr(entry.health, 0) > 0);
    if (players.length) {
      return players;
    }
    return Object.values(state && state.players || {}).filter(Boolean);
  }
