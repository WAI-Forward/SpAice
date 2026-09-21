  function normalizeUfoSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextUfoId;
    const boss = normalizeMobBossSnapshotFields(snapshot, "ufo", 130, 34);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind: "ufo",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, { r: 112, g: 226, b: 255 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      beamAngle: finiteOr(snapshot.beamAngle, Math.PI / 2),
      beamPulse: finiteOr(snapshot.beamPulse, randomRange(0, Math.PI * 2)),
      tractorDisabledTimer: Math.max(0, finiteOr(snapshot.tractorDisabledTimer, 0)),
      bossBeamMode: normalizeUfoBossBeamModeValue(snapshot.bossBeamMode),
      bossBeamTimer: Math.max(0, finiteOr(snapshot.bossBeamTimer, ufoBossNormalBeamDuration)),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      ...mobTeam,
      isBoss: boss.isBoss,
      bossBaseKind: boss.bossBaseKind,
      bossStars: boss.bossStars,
      minionCooldown: boss.minionCooldown,
      altAttackCooldown: boss.altAttackCooldown,
      bossBodyEvadeTimer: boss.bossBodyEvadeTimer,
      bossBodyEvadeSpeedCap: boss.bossBodyEvadeSpeedCap
    };
  }

  function normalizeRambotSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextRambotId;
    const boss = normalizeMobBossSnapshotFields(snapshot, "rambot", 210, 38);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind: "rambot",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, { r: 184, g: 196, b: 204 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      chargeCooldown: finiteOr(snapshot.chargeCooldown, randomRange(1.1, 2.4)),
      chargeTimer: finiteOr(snapshot.chargeTimer, 0),
      recoverTimer: finiteOr(snapshot.recoverTimer, 0),
      chargeDirX: finiteOr(snapshot.chargeDirX, 1),
      chargeDirY: finiteOr(snapshot.chargeDirY, 0),
      impactCooldown: finiteOr(snapshot.impactCooldown, 0),
      headAngle: finiteOr(snapshot.headAngle, finiteOr(snapshot.rotation, 0) - Math.PI / 2),
      pistonTimer: Math.max(0, finiteOr(snapshot.pistonTimer, 0)),
      pistonDuration: Math.max(0.1, finiteOr(snapshot.pistonDuration, rambotBossPistonDuration)),
      pistonHit: Boolean(snapshot.pistonHit),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      ...mobTeam,
      isBoss: boss.isBoss,
      bossBaseKind: boss.bossBaseKind,
      bossStars: boss.bossStars,
      minionCooldown: boss.minionCooldown,
      altAttackCooldown: boss.altAttackCooldown,
      bossBodyEvadeTimer: boss.bossBodyEvadeTimer,
      bossBodyEvadeSpeedCap: boss.bossBodyEvadeSpeedCap
    };
  }

  function normalizeEngineerSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextEngineerId;
    const boss = normalizeMobBossSnapshotFields(snapshot, "engineer", 140, 33);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind: "engineer",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, { r: 102, g: 224, b: 184 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      healCooldown: finiteOr(snapshot.healCooldown, randomRange(0.35, 0.9)),
      healPulse: finiteOr(snapshot.healPulse, 0),
      repairBeamAngle: finiteOr(snapshot.repairBeamAngle, 0),
      targetKind: typeof snapshot.targetKind === "string" ? snapshot.targetKind : "",
      targetId: Math.max(0, Math.floor(finiteOr(snapshot.targetId, 0))),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      ...mobTeam,
      isBoss: boss.isBoss,
      bossBaseKind: boss.bossBaseKind,
      bossStars: boss.bossStars,
      minionCooldown: boss.minionCooldown,
      altAttackCooldown: boss.altAttackCooldown,
      bossBodyEvadeTimer: boss.bossBodyEvadeTimer,
      bossBodyEvadeSpeedCap: boss.bossBodyEvadeSpeedCap
    };
  }

  function normalizeTeslaSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextTeslaId;
    const boss = normalizeMobBossSnapshotFields(snapshot, "tesla", 150, 32);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind: "tesla",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, { r: 157, g: 255, b: 122 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(1.2, 2.5)),
      lightningWarmup: finiteOr(snapshot.lightningWarmup, 0),
      lightningFlash: finiteOr(snapshot.lightningFlash, 0),
      lightningAngle: finiteOr(snapshot.lightningAngle, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      ...mobTeam,
      isBoss: boss.isBoss,
      bossBaseKind: boss.bossBaseKind,
      bossStars: boss.bossStars,
      minionCooldown: boss.minionCooldown,
      altAttackCooldown: boss.altAttackCooldown,
      bossBodyEvadeTimer: boss.bossBodyEvadeTimer,
      bossBodyEvadeSpeedCap: boss.bossBodyEvadeSpeedCap
    };
  }

  function normalizeRocketSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextRocketId;
    const legacyShooter = !Number.isFinite(Number(snapshot.chargeCooldown)) && Number.isFinite(Number(snapshot.scanProgress));
    const kind = snapshot.kind === "satellite" || legacyShooter ? "satellite" : "rocket";
    const maxHealth = kind === "satellite" ? 180 : 170;
    const baseRadius = kind === "satellite" ? 36 : 34;
    const boss = normalizeMobBossSnapshotFields(snapshot, kind, maxHealth, baseRadius);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, { r: 169, g: 133, b: 255 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      scannerAngle: finiteOr(snapshot.scannerAngle, 0),
      scanProgress: clamp(finiteOr(snapshot.scanProgress, 0), 0, 1),
      lockTimer: finiteOr(snapshot.lockTimer, 0),
      blastTimer: finiteOr(snapshot.blastTimer, 0),
      recoverTimer: finiteOr(snapshot.recoverTimer, 0),
      lockX: finiteOr(snapshot.lockX, 0),
      lockY: finiteOr(snapshot.lockY, 0),
      blastDirX: finiteOr(snapshot.blastDirX, 1),
      blastDirY: finiteOr(snapshot.blastDirY, 0),
      volleyTimer: finiteOr(snapshot.volleyTimer, 0),
      volleyShots: Math.max(0, Math.floor(finiteOr(snapshot.volleyShots, 0))),
      chargeCooldown: finiteOr(snapshot.chargeCooldown, randomRange(0.6, 1.6)),
      chargeTimer: finiteOr(snapshot.chargeTimer, 0),
      chargeDirX: finiteOr(snapshot.chargeDirX, 1),
      chargeDirY: finiteOr(snapshot.chargeDirY, 0),
      chargePower: clamp(finiteOr(snapshot.chargePower, 0), 0, 1),
      impactCooldown: finiteOr(snapshot.impactCooldown, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      ...mobTeam,
      isBoss: boss.isBoss,
      bossBaseKind: boss.bossBaseKind,
      bossStars: boss.bossStars,
      minionCooldown: boss.minionCooldown,
      altAttackCooldown: boss.altAttackCooldown,
      bossBodyEvadeTimer: boss.bossBodyEvadeTimer,
      bossBodyEvadeSpeedCap: boss.bossBodyEvadeSpeedCap
    };
  }

  function normalizeFighterSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallbackId = nextFighterId;
    const boss = normalizeMobBossSnapshotFields(snapshot, "fighter", 230, 40);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind: "fighter",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, { r: 119, g: 167, b: 255 }),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(1.0, 2.4)),
      machineGunShots: Math.max(0, Math.floor(finiteOr(snapshot.machineGunShots, 0))),
      machineGunTimer: Math.max(0, finiteOr(snapshot.machineGunTimer, 0)),
      shieldCharge: clamp(finiteOr(snapshot.shieldCharge, fighterShieldMaxCharge), 0, fighterShieldMaxCharge),
      shieldRecharge: clamp(finiteOr(snapshot.shieldRecharge, 0), 0, fighterShieldCycle),
      shieldActive: finiteOr(snapshot.shieldActive, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      ...mobTeam,
      isBoss: boss.isBoss,
      bossBaseKind: boss.bossBaseKind,
      bossStars: boss.bossStars,
      minionCooldown: boss.minionCooldown,
      altAttackCooldown: boss.altAttackCooldown,
      bossBodyEvadeTimer: boss.bossBodyEvadeTimer,
      bossBodyEvadeSpeedCap: boss.bossBodyEvadeSpeedCap
    };
  }

  function normalizeMobBeaconSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const kind = mobTierOrder.includes(snapshot.beaconKind)
      ? snapshot.beaconKind
      : mobTierOrder.includes(snapshot.kind)
      ? snapshot.kind
      : "alienoid";
    const maxHealth = Math.max(1, finiteOr(snapshot.maxHealth, mobBeaconMaxHealth(kind)));
    return {
      kind: "beacon",
      beaconKind: kind,
      isBeacon: true,
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextMobBeaconId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: Math.max(12, finiteOr(snapshot.radius, 46)),
      health: clamp(finiteOr(snapshot.health, maxHealth), 0, maxHealth),
      maxHealth,
      color: normalizeColorSnapshot(snapshot.color, mobBeaconColor(kind)),
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      hitCooldown: Math.max(0, finiteOr(snapshot.hitCooldown, 0)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      rotation: finiteOr(snapshot.rotation, 0),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      age: Math.max(0, finiteOr(snapshot.age, 0)),
      respawnTimer: clamp(finiteOr(snapshot.respawnTimer, 0), 0, mobBeaconRespawnDuration),
      driftAngle: finiteOr(snapshot.driftAngle, randomRange(0, Math.PI * 2)),
      gadgetForceTimer: Math.max(0, finiteOr(snapshot.gadgetForceTimer, 0)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1
    };
  }

  function normalizeStructureSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const type = isKnownStructureType(snapshot.type) ? snapshot.type : null;
    if (!type) {
      return null;
    }

    const angle = finiteOr(snapshot.angle, 0);
    const linkedAngle = finiteOr(snapshot.linkedAngle, angle + Math.PI);
    return {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, nextStructureId))),
      type,
      ownerPlayerId: String(snapshot.ownerPlayerId || ""),
      bodyId: Math.max(1, Math.floor(finiteOr(snapshot.bodyId, 1))),
      linkedBodyId: Math.max(0, Math.floor(finiteOr(snapshot.linkedBodyId, 0))),
      angle,
      linkedAngle,
      surfaceOffset: Math.max(0, finiteOr(snapshot.surfaceOffset, 0)),
      linkedSurfaceOffset: Math.max(0, finiteOr(snapshot.linkedSurfaceOffset, 0)),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      x2: finiteOr(snapshot.x2, snapshot.x),
      y2: finiteOr(snapshot.y2, snapshot.y),
      restLength: Math.max(0, finiteOr(snapshot.restLength, 0)),
      restCenterDx: finiteOr(snapshot.restCenterDx, 0),
      restCenterDy: finiteOr(snapshot.restCenterDy, 0),
      bridgeAngleOffset: Number.isFinite(Number(snapshot.bridgeAngleOffset)) ? finiteOr(snapshot.bridgeAngleOffset, 0) : undefined,
      bridgeLinkedAngleOffset: Number.isFinite(Number(snapshot.bridgeLinkedAngleOffset)) ? finiteOr(snapshot.bridgeLinkedAngleOffset, 0) : undefined,
      aimAngle: finiteOr(snapshot.aimAngle, angle),
      deploy: clamp(finiteOr(snapshot.deploy, 0), 0, 1),
      thrustAmount: clamp(finiteOr(snapshot.thrustAmount, 0), 0, 1),
      thrustDirection: finiteOr(snapshot.thrustDirection, 1) < 0 ? -1 : 1,
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(0.2, 0.8)),
      burstTimer: Math.max(0, finiteOr(snapshot.burstTimer, 0)),
      burstCooldown: Math.max(0, finiteOr(snapshot.burstCooldown, randomRange(0.4, accumulatorBurstInterval))),
      healPulse: clamp(finiteOr(snapshot.healPulse, 0), 0, 1),
      missileCharge: clamp(finiteOr(snapshot.missileCharge, type === "missile-launcher" ? randomRange(0, 0.45) : 0), 0, 1),
      lockTimer: Math.max(0, finiteOr(snapshot.lockTimer, 0)),
      beepTimer: Math.max(0, finiteOr(snapshot.beepTimer, 0)),
      targetX: finiteOr(snapshot.targetX, 0),
      targetY: finiteOr(snapshot.targetY, 0),
      targetCount: Math.max(0, Math.floor(finiteOr(snapshot.targetCount, 0))),
      health: clamp(finiteOr(snapshot.health, structureMaxHealth(type)), 0, structureMaxHealth(type)),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, structureMaxHealth(type)), 1, structureMaxHealth(type)),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      flash: Math.max(0, finiteOr(snapshot.flash, 0)),
      tech: type === "container" || type === "trading-port" ? normalizeTradeOffer(snapshot.tech) : undefined,
      tradeOffers: type === "trading-port" ? normalizeTradingPortOffers(snapshot.tradeOffers) : undefined,
      tradeOfferSeq: type === "trading-port" ? Math.max(1, Math.floor(finiteOr(snapshot.tradeOfferSeq, 1))) : undefined,
      tradeVessel: type === "trading-port" ? normalizeTradeVessel(snapshot.tradeVessel, {
        x: finiteOr(snapshot.x, 0),
        y: finiteOr(snapshot.y, 0)
      }) : undefined,
      survivalCampId: typeof snapshot.survivalCampId === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot.survivalCampY, 0),
      survivalCampAggroTimer: Math.max(0, finiteOr(snapshot.survivalCampAggroTimer, 0)),
      survivalAggroAlertTimer: Math.max(0, finiteOr(snapshot.survivalAggroAlertTimer, 0)),
      survivalEncounterType: snapshot.survivalEncounterType === "camp" ? "camp" : "",
      survivalEncounterId: typeof snapshot.survivalEncounterId === "string" ? snapshot.survivalEncounterId : "",
      survivalTargetPlayerId: typeof snapshot.survivalTargetPlayerId === "string" ? snapshot.survivalTargetPlayerId : "",
      survivalCampBudget: Math.max(0, finiteOr(snapshot.survivalCampBudget, 0)),
      survivalCampBand: typeof snapshot.survivalCampBand === "string" ? snapshot.survivalCampBand : "",
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2))
    };
  }

  function applyMobSpawnTimers(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const key of Object.keys(mobSpawnIntervals)) {
      mobSpawnTimers[key] = clamp(finiteOr(snapshot[key], mobSpawnTimers[key]), 0, difficultyMobSpawnInterval(key));
    }
  }

  function applyMobWaveState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    mobWaveTimer = clamp(finiteOr(snapshot.mobWaveTimer, mobWaveTimer), 0, difficultyMobWaveInterval());
    mobWaveCount = Math.max(0, Math.floor(finiteOr(snapshot.mobWaveCount, mobWaveCount)));
  }

  function applyMobSpawnRestState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    mobSpawnRestTimer = clamp(finiteOr(snapshot.mobSpawnRestTimer, mobSpawnRestTimer), 0, mobSpawnRestDuration);
    mobSpawnRestDrainTimer = clamp(finiteOr(snapshot.mobSpawnRestDrainTimer, mobSpawnRestDrainTimer), 0, mobSpawnRestDrainMaxDuration);
    mobSpawnRestCooldownTimer = clamp(finiteOr(snapshot.mobSpawnRestCooldownTimer, mobSpawnRestCooldownTimer), 0, mobSpawnRestCooldown);
  }

  function applyMobDefeatsByKind(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const kind of mobTierOrder) {
      mobDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(snapshot[kind], mobDefeatsByKind[kind])));
    }
  }

  function applyMobBossDefeatsByKind(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const kind of mobTierOrder) {
      mobBossDefeatsByKind[kind] = Math.max(0, Math.floor(finiteOr(snapshot[kind], mobBossDefeatsByKind[kind])));
    }
  }

  function estimateMobBossProgress(kind, defeatSnapshot, bossDefeatSnapshot) {
    const totalDefeats = Math.max(0, Math.floor(finiteOr(
      defeatSnapshot && typeof defeatSnapshot === "object" ? defeatSnapshot[kind] : mobDefeatsByKind[kind],
      mobDefeatsByKind[kind]
    )));
    const bossDefeats = Math.max(0, Math.floor(finiteOr(
      bossDefeatSnapshot && typeof bossDefeatSnapshot === "object" ? bossDefeatSnapshot[kind] : mobBossDefeatsByKind[kind],
      mobBossDefeatsByKind[kind]
    )));
    const regularDefeats = Math.max(0, totalDefeats - bossDefeats);
    const completedRegularDefeats = bossDefeats * mobBossDefeatsToUnlock;
    return clamp(regularDefeats - completedRegularDefeats, 0, mobBossDefeatsToUnlock);
  }

  function applyMobBossProgressByKind(snapshot, defeatSnapshot, bossDefeatSnapshot) {
    for (const kind of mobTierOrder) {
      if (snapshot && typeof snapshot === "object" && Object.prototype.hasOwnProperty.call(snapshot, kind)) {
        mobBossProgressByKind[kind] = clamp(
          Math.floor(finiteOr(snapshot[kind], mobBossProgressByKind[kind])),
          0,
          mobBossDefeatsToUnlock
        );
      } else {
        mobBossProgressByKind[kind] = estimateMobBossProgress(kind, defeatSnapshot, bossDefeatSnapshot);
      }
    }
  }

  function serializeMobBossWarnings() {
    const result = {};
    for (const kind of mobTierOrder) {
      const warning = mobBossWarnings[kind] || {};
      result[kind] = {
        active: Boolean(warning.active),
        timer: Math.max(0, finiteOr(warning.timer, 0)),
        lastNoticeSecond: Math.floor(finiteOr(warning.lastNoticeSecond, -1))
      };
    }
    return result;
  }

  function applyMobBossWarnings(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    for (const kind of mobTierOrder) {
      const warning = snapshot[kind] && typeof snapshot[kind] === "object" ? snapshot[kind] : {};
      mobBossWarnings[kind].active = Boolean(warning.active);
      mobBossWarnings[kind].timer = clamp(finiteOr(warning.timer, mobBossWarnings[kind].timer), 0, mobBossWarningDuration);
      mobBossWarnings[kind].lastNoticeSecond = Math.floor(finiteOr(warning.lastNoticeSecond, -1));
    }
  }

  function resetMobDefeatsByKind() {
    for (const kind of mobTierOrder) {
      mobDefeatsByKind[kind] = 0;
      mobBossDefeatsByKind[kind] = 0;
      mobBossProgressByKind[kind] = 0;
    }
    mobWaveCount = 0;
  }
