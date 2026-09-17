  function serializeUfo(ufo) {
    return {
      id: ufo.id,
      x: ufo.x,
      y: ufo.y,
      vx: ufo.vx,
      vy: ufo.vy,
      radius: ufo.radius,
      health: ufo.health,
      maxHealth: ufo.maxHealth,
      color: ufo.color,
      flash: ufo.flash,
      hitCooldown: ufo.hitCooldown,
      disabledTimer: ufo.disabledTimer,
      strafeSign: ufo.strafeSign,
      rotation: ufo.rotation,
      beamAngle: ufo.beamAngle,
      beamPulse: ufo.beamPulse,
      tractorDisabledTimer: ufo.tractorDisabledTimer,
      bossBeamMode: ufo.bossBeamMode,
      bossBeamTimer: ufo.bossBeamTimer,
      wobble: ufo.wobble,
      ...mobTeamSnapshotFields(ufo),
      ...mobBossSnapshotFields(ufo)
    };
  }

  function serializeRambot(rambot) {
    return {
      id: rambot.id,
      x: rambot.x,
      y: rambot.y,
      vx: rambot.vx,
      vy: rambot.vy,
      radius: rambot.radius,
      health: rambot.health,
      maxHealth: rambot.maxHealth,
      color: rambot.color,
      flash: rambot.flash,
      hitCooldown: rambot.hitCooldown,
      disabledTimer: rambot.disabledTimer,
      strafeSign: rambot.strafeSign,
      rotation: rambot.rotation,
      chargeCooldown: rambot.chargeCooldown,
      chargeTimer: rambot.chargeTimer,
      recoverTimer: rambot.recoverTimer,
      chargeDirX: rambot.chargeDirX,
      chargeDirY: rambot.chargeDirY,
      impactCooldown: rambot.impactCooldown,
      headAngle: rambot.headAngle,
      pistonTimer: rambot.pistonTimer,
      pistonDuration: rambot.pistonDuration,
      pistonHit: rambot.pistonHit,
      wobble: rambot.wobble,
      ...mobTeamSnapshotFields(rambot),
      ...mobBossSnapshotFields(rambot)
    };
  }

  function serializeEngineer(engineer) {
    return {
      id: engineer.id,
      x: engineer.x,
      y: engineer.y,
      vx: engineer.vx,
      vy: engineer.vy,
      radius: engineer.radius,
      health: engineer.health,
      maxHealth: engineer.maxHealth,
      color: engineer.color,
      flash: engineer.flash,
      hitCooldown: engineer.hitCooldown,
      disabledTimer: engineer.disabledTimer,
      strafeSign: engineer.strafeSign,
      rotation: engineer.rotation,
      healCooldown: engineer.healCooldown,
      healPulse: engineer.healPulse,
      repairBeamAngle: engineer.repairBeamAngle,
      targetKind: engineer.targetKind,
      targetId: engineer.targetId,
      wobble: engineer.wobble,
      ...mobTeamSnapshotFields(engineer),
      ...mobBossSnapshotFields(engineer)
    };
  }

  function serializeTesla(tesla) {
    return {
      id: tesla.id,
      x: tesla.x,
      y: tesla.y,
      vx: tesla.vx,
      vy: tesla.vy,
      radius: tesla.radius,
      health: tesla.health,
      maxHealth: tesla.maxHealth,
      color: tesla.color,
      flash: tesla.flash,
      hitCooldown: tesla.hitCooldown,
      disabledTimer: tesla.disabledTimer,
      strafeSign: tesla.strafeSign,
      rotation: tesla.rotation,
      shootCooldown: tesla.shootCooldown,
      lightningWarmup: tesla.lightningWarmup,
      lightningFlash: tesla.lightningFlash,
      lightningAngle: tesla.lightningAngle,
      wobble: tesla.wobble,
      ...mobTeamSnapshotFields(tesla),
      ...mobBossSnapshotFields(tesla)
    };
  }

  function serializeRocket(rocket) {
    return {
      kind: rocket.kind === "satellite" ? "satellite" : "rocket",
      id: rocket.id,
      x: rocket.x,
      y: rocket.y,
      vx: rocket.vx,
      vy: rocket.vy,
      radius: rocket.radius,
      health: rocket.health,
      maxHealth: rocket.maxHealth,
      color: rocket.color,
      flash: rocket.flash,
      hitCooldown: rocket.hitCooldown,
      disabledTimer: rocket.disabledTimer,
      strafeSign: rocket.strafeSign,
      rotation: rocket.rotation,
      scannerAngle: rocket.scannerAngle,
      scanProgress: rocket.scanProgress,
      lockTimer: rocket.lockTimer,
      blastTimer: rocket.blastTimer,
      recoverTimer: rocket.recoverTimer,
      lockX: rocket.lockX,
      lockY: rocket.lockY,
      blastDirX: rocket.blastDirX,
      blastDirY: rocket.blastDirY,
      volleyTimer: rocket.volleyTimer,
      volleyShots: rocket.volleyShots,
      chargeCooldown: rocket.chargeCooldown,
      chargeTimer: rocket.chargeTimer,
      chargeDirX: rocket.chargeDirX,
      chargeDirY: rocket.chargeDirY,
      chargePower: rocket.chargePower,
      impactCooldown: rocket.impactCooldown,
      wobble: rocket.wobble,
      ...mobTeamSnapshotFields(rocket),
      ...mobBossSnapshotFields(rocket)
    };
  }

  function serializeFighter(fighter) {
    return {
      id: fighter.id,
      x: fighter.x,
      y: fighter.y,
      vx: fighter.vx,
      vy: fighter.vy,
      radius: fighter.radius,
      health: fighter.health,
      maxHealth: fighter.maxHealth,
      color: fighter.color,
      flash: fighter.flash,
      hitCooldown: fighter.hitCooldown,
      disabledTimer: fighter.disabledTimer,
      strafeSign: fighter.strafeSign,
      rotation: fighter.rotation,
      shootCooldown: fighter.shootCooldown,
      machineGunShots: Math.max(0, Math.floor(finiteOr(fighter.machineGunShots, 0))),
      machineGunTimer: Math.max(0, finiteOr(fighter.machineGunTimer, 0)),
      shieldCharge: fighter.shieldCharge,
      shieldRecharge: fighter.shieldRecharge,
      shieldActive: fighter.shieldActive,
      wobble: fighter.wobble,
      ...mobTeamSnapshotFields(fighter),
      ...mobBossSnapshotFields(fighter)
    };
  }

  function serializeMobBeacon(beacon) {
    return {
      kind: "beacon",
      beaconKind: mobEntityKind(beacon),
      isBeacon: true,
      id: beacon.id,
      x: beacon.x,
      y: beacon.y,
      vx: beacon.vx,
      vy: beacon.vy,
      radius: beacon.radius,
      health: beacon.health,
      maxHealth: beacon.maxHealth,
      color: beacon.color,
      flash: beacon.flash,
      hitCooldown: beacon.hitCooldown,
      disabledTimer: beacon.disabledTimer,
      rotation: beacon.rotation,
      wobble: beacon.wobble,
      age: beacon.age,
      respawnTimer: beacon.respawnTimer,
      driftAngle: beacon.driftAngle,
      gadgetForceTimer: beacon.gadgetForceTimer,
      strafeSign: beacon.strafeSign
    };
  }

  function serializeProjectile(projectile) {
    return {
      id: projectile.id,
      x: projectile.x,
      y: projectile.y,
      vx: projectile.vx,
      vy: projectile.vy,
      radius: projectile.radius,
      length: projectile.length,
      color: projectile.color,
      life: projectile.life,
      maxLife: projectile.maxLife,
      damage: projectile.damage,
      toolDisable: projectile.toolDisable,
      cause: projectile.cause,
      team: projectile.team === "player" ? "player" : "",
      sourcePlayerId: projectile.sourcePlayerId,
      sourceStructureId: projectile.sourceStructureId,
      sourceMobId: projectile.sourceMobId,
      weaponLabel: projectile.weaponLabel,
      knockback: projectile.knockback,
      piercesMobs: Boolean(projectile.piercesMobs),
      hitMobIds: Array.isArray(projectile.hitMobIds) ? projectile.hitMobIds.slice() : [],
      ignoredBodyId: projectile.ignoredBodyId,
      lightning: Boolean(projectile.lightning),
      rocket: Boolean(projectile.rocket),
      heatSeeking: Boolean(projectile.heatSeeking),
      targetSpeed: projectile.targetSpeed,
      turnRate: projectile.turnRate
    };
  }

  function serializeTechPickup(pickup) {
    return {
      id: pickup.id,
      key: pickup.key,
      x: pickup.x,
      y: pickup.y,
      vx: pickup.vx,
      vy: pickup.vy,
      radius: pickup.radius,
      life: pickup.life,
      maxLife: pickup.maxLife,
      rotation: pickup.rotation,
      wobble: pickup.wobble
    };
  }

  function serializeHealthPickup(pickup) {
    return {
      id: pickup.id,
      x: pickup.x,
      y: pickup.y,
      vx: pickup.vx,
      vy: pickup.vy,
      radius: pickup.radius,
      heal: pickup.heal,
      life: pickup.life,
      maxLife: pickup.maxLife,
      wobble: pickup.wobble
    };
  }

  function serializeStructure(structure) {
    return {
      id: structure.id,
      type: structure.type,
      ownerPlayerId: structure.ownerPlayerId,
      bodyId: structure.bodyId,
      linkedBodyId: structure.linkedBodyId,
      angle: structure.angle,
      linkedAngle: structure.linkedAngle,
      surfaceOffset: structure.surfaceOffset,
      linkedSurfaceOffset: structure.linkedSurfaceOffset,
      x: structure.x,
      y: structure.y,
      x2: structure.x2,
      y2: structure.y2,
      restLength: structure.restLength,
      restCenterDx: structure.restCenterDx,
      restCenterDy: structure.restCenterDy,
      bridgeAngleOffset: structure.bridgeAngleOffset,
      bridgeLinkedAngleOffset: structure.bridgeLinkedAngleOffset,
      aimAngle: structure.aimAngle,
      deploy: structure.deploy,
      thrustAmount: structure.thrustAmount,
      thrustDirection: structure.thrustDirection,
      shootCooldown: structure.shootCooldown,
      burstTimer: structure.burstTimer,
      burstCooldown: structure.burstCooldown,
      healPulse: structure.healPulse,
      missileCharge: structure.missileCharge,
      lockTimer: structure.lockTimer,
      beepTimer: structure.beepTimer,
      targetX: structure.targetX,
      targetY: structure.targetY,
      targetCount: structure.targetCount,
      health: structure.health,
      maxHealth: structure.maxHealth,
      disabledTimer: structure.disabledTimer,
      flash: structure.flash,
      tech: structure.type === "container" || structure.type === "trading-port" ? normalizeTradeOffer(structure.tech) : undefined,
      tradeOffers: structure.type === "trading-port" ? normalizeTradingPortOffers(structure.tradeOffers) : undefined,
      tradeOfferSeq: structure.type === "trading-port" ? Math.max(1, Math.floor(finiteOr(structure.tradeOfferSeq, 1))) : undefined,
      tradeVessel: structure.type === "trading-port" ? normalizeTradeVessel(structure.tradeVessel, structure) : undefined,
      survivalCampId: structure.survivalCampId || "",
      survivalCampX: structure.survivalCampX,
      survivalCampY: structure.survivalCampY,
      survivalCampAggroTimer: structure.survivalCampAggroTimer,
      survivalEncounterType: structure.survivalEncounterType || "",
      survivalEncounterId: structure.survivalEncounterId || "",
      survivalTargetPlayerId: structure.survivalTargetPlayerId || "",
      survivalCampBudget: structure.survivalCampBudget,
      survivalCampBand: structure.survivalCampBand || "",
      wobble: structure.wobble
    };
  }

  function serializeStar(star) {
    return {
      x: star.x,
      y: star.y,
      r: star.r,
      a: star.a
    };
  }

  function normalizeParticleSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const mass = Math.max(1, finiteOr(snapshot.mass, 1));
    const stellarOutcome = normalizedStellarOutcomeName(snapshot.stellarOutcome);
    const tier = tierForMassAndStellarOutcome(mass, stellarOutcome);
    const fallbackId = nextParticleId;
    const particle = {
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      mass,
      radius: radiusFromMassForTier(mass, tier),
      tier,
      energy: finiteOr(snapshot.energy, Number.NaN),
      maxEnergy: finiteOr(snapshot.maxEnergy, Number.NaN),
      rotation: finiteOr(snapshot.rotation, 0),
      angularVelocity: clamp(finiteOr(snapshot.angularVelocity, 0), -bodyMaxAngularSpeed, bodyMaxAngularSpeed),
      textureSeed: finiteOr(snapshot.textureSeed, Math.random() * 1000),
      color: normalizeColorSnapshot(snapshot.color, randomParticleColor()),
      wobble: finiteOr(snapshot.wobble, randomRange(0, Math.PI * 2)),
      pulse: finiteOr(snapshot.pulse, randomRange(0.8, 1.25)),
      spawnAge: clamp(finiteOr(snapshot.spawnAge, particleSpawnTransitionDuration), 0, particleSpawnTransitionDuration),
      spawnSizeScale: finiteOr(snapshot.spawnSizeScale, 1),
      orbitHostId: Math.max(0, Math.floor(finiteOr(snapshot.orbitHostId, 0))),
      orbitRingIndex: Math.max(0, Math.floor(finiteOr(snapshot.orbitRingIndex, 0))),
      orbitDirection: finiteOr(snapshot.orbitDirection, 1) < 0 ? -1 : 1,
      orbitStrength: clamp(finiteOr(snapshot.orbitStrength, 0), 0, 1),
      orbitGrace: Math.max(0, finiteOr(snapshot.orbitGrace, 0)),
      starBirthAge: clamp(finiteOr(snapshot.starBirthAge, tier.name === "star" ? starBirthTransitionDuration : 0), 0, starBirthTransitionDuration),
      starEmissionAccumulator: Math.max(0, finiteOr(snapshot.starEmissionAccumulator, 0)),
      stellarGrowthStarted: Boolean(snapshot.stellarGrowthStarted),
      stellarGrowthRate: Math.max(0, finiteOr(snapshot.stellarGrowthRate, 0)),
      stellarGrowthLastSampleAt: Math.max(0, finiteOr(snapshot.stellarGrowthLastSampleAt, 0)),
      stellarOutcome,
      randomEventId: typeof snapshot.randomEventId === "string" ? snapshot.randomEventId : "",
      randomEventRegionX: finiteOr(snapshot.randomEventRegionX, Number.NaN),
      randomEventRegionY: finiteOr(snapshot.randomEventRegionY, Number.NaN),
      ufoSapTimer: Math.max(0, finiteOr(snapshot.ufoSapTimer, 0)),
      ufoSapSourceGraceTimer: Math.max(0, finiteOr(snapshot.ufoSapSourceGraceTimer, 0)),
      ufoExtractedById: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedById, 0))),
      ufoExtractedFromId: Math.max(0, Math.floor(finiteOr(snapshot.ufoExtractedFromId, 0))),
      ufoSapParticleBuffer: Math.max(0, finiteOr(snapshot.ufoSapParticleBuffer, 0)),
      survivalCampId: typeof snapshot.survivalCampId === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot.survivalCampY, 0),
      survivalCampHomeX: finiteOr(snapshot.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(snapshot.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(snapshot.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(snapshot.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof snapshot.survivalCampLastMoverPlayerId === "string" ? snapshot.survivalCampLastMoverPlayerId : "",
      survivalCampBody: Boolean(snapshot.survivalCampBody),
      ambientSpawnRock: Boolean(snapshot.ambientSpawnRock)
    };
    normalizeBodyEnergy(particle);
    return particle;
  }

  function normalizeMobBossSnapshotFields(snapshot, kind, baseHealth, baseRadius) {
    const isBoss = Boolean(snapshot && snapshot.isBoss);
    const bossStars = isBoss ? bossStarRankValue(snapshot.bossStars) : 0;
    const eliteStars = isBoss ? 0 : mobEliteStarRankValue(snapshot && snapshot.eliteStars);
    const eliteGroupSize = eliteStars > 0
      ? Math.max(mobEliteCompressionSize, Math.floor(finiteOr(snapshot && snapshot.eliteGroupSize, eliteStars * mobEliteCompressionSize)))
      : 1;
    return {
      isBoss,
      bossBaseKind: isBoss && snapshot.bossBaseKind && mobTierOrder.includes(snapshot.bossBaseKind) ? snapshot.bossBaseKind : (isBoss ? kind : ""),
      bossStars,
      eliteStars,
      eliteGroupSize,
      minionCooldown: isBoss
        ? clamp(finiteOr(snapshot.minionCooldown, randomRange(mobBossMinionCooldownMin, mobBossMinionCooldownMax)), 0, mobBossMinionCooldownMax)
        : 0,
      altAttackCooldown: isBoss
        ? clamp(finiteOr(snapshot.altAttackCooldown, randomRange(mobBossAltAttackCooldownMin, mobBossAltAttackCooldownMax)), 0, mobBossAltAttackCooldownMax)
        : 0,
      bossBodyEvadeTimer: clamp(finiteOr(snapshot.bossBodyEvadeTimer, 0), 0, bossBodyEvadeDuration),
      bossBodyEvadeSpeedCap: clamp(finiteOr(snapshot.bossBodyEvadeSpeedCap, 0), 0, bossBodyEvadeMaxSpeed),
      maxHealthCap: isBoss ? Math.max(baseHealth, baseHealth * mobBossHealthMultiplier * bossHealthScaleForStars(bossStars)) : baseHealth * mobEliteHealthScale(eliteStars),
      fallbackRadius: isBoss ? baseRadius * mobBossRadiusMultiplier : baseRadius * mobEliteRadiusScale(eliteStars)
    };
  }

  function normalizeMobTeamSnapshotFields(snapshot, fallbackRadius) {
    const eliteStars = snapshot && snapshot.isBoss ? 0 : mobEliteStarRankValue(snapshot && snapshot.eliteStars);
    return {
      team: snapshot && snapshot.team === "player" ? "player" : "",
      familiarOwnerPlayerId: typeof (snapshot && snapshot.familiarOwnerPlayerId) === "string" ? snapshot.familiarOwnerPlayerId : "",
      familiarCommandX: finiteOr(snapshot && snapshot.familiarCommandX, 0),
      familiarCommandY: finiteOr(snapshot && snapshot.familiarCommandY, 0),
      familiarCommandTimer: Math.max(0, finiteOr(snapshot && snapshot.familiarCommandTimer, 0)),
      summonAge: Math.max(0, finiteOr(snapshot && snapshot.summonAge, 0)),
      summonDuration: Math.max(0, finiteOr(snapshot && snapshot.summonDuration, 0)),
      summonBaseRadius: Math.max(0, finiteOr(snapshot && snapshot.summonBaseRadius, fallbackRadius)),
      summonSpinSpeed: finiteOr(snapshot && snapshot.summonSpinSpeed, 0),
      survivalCampId: typeof (snapshot && snapshot.survivalCampId) === "string" ? snapshot.survivalCampId : "",
      survivalCampX: finiteOr(snapshot && snapshot.survivalCampX, 0),
      survivalCampY: finiteOr(snapshot && snapshot.survivalCampY, 0),
      survivalCampHomeX: finiteOr(snapshot && snapshot.survivalCampHomeX, Number.NaN),
      survivalCampHomeY: finiteOr(snapshot && snapshot.survivalCampHomeY, Number.NaN),
      survivalCampMovedByPlayer: Boolean(snapshot && snapshot.survivalCampMovedByPlayer),
      survivalCampBodyMovedWakeSent: Boolean(snapshot && snapshot.survivalCampBodyMovedWakeSent),
      survivalCampLastMoverPlayerId: typeof (snapshot && snapshot.survivalCampLastMoverPlayerId) === "string" ? snapshot.survivalCampLastMoverPlayerId : "",
      survivalCampLeashRadius: Math.max(0, finiteOr(snapshot && snapshot.survivalCampLeashRadius, 0)),
      survivalCampAggroTimer: Math.max(0, finiteOr(snapshot && snapshot.survivalCampAggroTimer, 0)),
      survivalCampReturning: Boolean(snapshot && snapshot.survivalCampReturning),
      survivalCampSlotAngle: finiteOr(snapshot && snapshot.survivalCampSlotAngle, 0),
      survivalCampSlotRadius: Math.max(0, finiteOr(snapshot && snapshot.survivalCampSlotRadius, 0)),
      survivalMigrationCampId: typeof (snapshot && snapshot.survivalMigrationCampId) === "string" ? snapshot.survivalMigrationCampId : "",
      survivalMigrationCampX: finiteOr(snapshot && snapshot.survivalMigrationCampX, Number.NaN),
      survivalMigrationCampY: finiteOr(snapshot && snapshot.survivalMigrationCampY, Number.NaN),
      survivalMigrationStraightTime: Math.max(0, finiteOr(snapshot && snapshot.survivalMigrationStraightTime, 0)),
      survivalMigrationDirX: finiteOr(snapshot && snapshot.survivalMigrationDirX, 0),
      survivalMigrationDirY: finiteOr(snapshot && snapshot.survivalMigrationDirY, 0),
      survivalEncounterType: snapshot && ["camp", "migration", "salvage"].includes(snapshot.survivalEncounterType) ? snapshot.survivalEncounterType : "",
      survivalEncounterId: typeof (snapshot && snapshot.survivalEncounterId) === "string" ? snapshot.survivalEncounterId : "",
      survivalTargetPlayerId: typeof (snapshot && snapshot.survivalTargetPlayerId) === "string" ? snapshot.survivalTargetPlayerId : "",
      survivalSalvageBodyId: Math.max(0, Math.floor(finiteOr(snapshot && snapshot.survivalSalvageBodyId, 0))),
      survivalSalvageSourceCampId: typeof (snapshot && snapshot.survivalSalvageSourceCampId) === "string" ? snapshot.survivalSalvageSourceCampId : "",
      survivalSalvageTargetCampId: typeof (snapshot && snapshot.survivalSalvageTargetCampId) === "string" ? snapshot.survivalSalvageTargetCampId : "",
      survivalSalvageAge: Math.max(0, finiteOr(snapshot && snapshot.survivalSalvageAge, 0)),
      survivalCampBudget: Math.max(0, finiteOr(snapshot && snapshot.survivalCampBudget, 0)),
      survivalCampBand: typeof (snapshot && snapshot.survivalCampBand) === "string" ? snapshot.survivalCampBand : "",
      eliteStars,
      eliteGroupSize: eliteStars > 0 ? Math.max(mobEliteCompressionSize, Math.floor(finiteOr(snapshot && snapshot.eliteGroupSize, eliteStars * mobEliteCompressionSize))) : 1
    };
  }

  function normalizeRivalSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const fallback = randomAlienColor();
    const fallbackId = nextRivalId;
    const boss = normalizeMobBossSnapshotFields(snapshot, "alienoid", 100, 28);
    const mobTeam = normalizeMobTeamSnapshotFields(snapshot, boss.fallbackRadius);
    return {
      kind: "alienoid",
      id: Math.max(1, Math.floor(finiteOr(snapshot.id, fallbackId))),
      x: finiteOr(snapshot.x, 0),
      y: finiteOr(snapshot.y, 0),
      vx: finiteOr(snapshot.vx, 0),
      vy: finiteOr(snapshot.vy, 0),
      radius: finiteOr(snapshot.radius, boss.fallbackRadius),
      health: clamp(finiteOr(snapshot.health, boss.maxHealthCap), 0, boss.maxHealthCap),
      maxHealth: clamp(finiteOr(snapshot.maxHealth, boss.maxHealthCap), 1, boss.maxHealthCap),
      color: normalizeColorSnapshot(snapshot.color, fallback),
      flash: finiteOr(snapshot.flash, 0),
      hitCooldown: finiteOr(snapshot.hitCooldown, 0),
      disabledTimer: Math.max(0, finiteOr(snapshot.disabledTimer, 0)),
      landed: normalizeLandingSnapshot(snapshot.landed),
      residentTier: typeof snapshot.residentTier === "string" ? snapshot.residentTier : null,
      shootCooldown: finiteOr(snapshot.shootCooldown, randomRange(0.8, 2.1)),
      strafeSign: Number(snapshot.strafeSign) < 0 ? -1 : 1,
      rotation: finiteOr(snapshot.rotation, 0),
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
