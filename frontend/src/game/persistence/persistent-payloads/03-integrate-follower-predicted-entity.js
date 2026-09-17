  function integrateFollowerPredictedEntity(entity, dt) {
    if (!entity) {
      return false;
    }

    if (entity.tier) {
      if (entity.gadgetStabilized && length(entity.vx, entity.vy) > gadgetStabilizedBreakSpeed) {
        entity.gadgetStabilized = false;
      }
      if (!entity.tier.solid) {
        entity.vx += Math.sin(finiteOr(entity.wobble, 0) + performance.now() * 0.0007) * 4 * dt;
        entity.vy += Math.cos(finiteOr(entity.wobble, 0) * 1.7 + performance.now() * 0.0006) * 4 * dt;
        entity.vx *= Math.pow(0.82, dt);
        entity.vy *= Math.pow(0.82, dt);
      } else {
        applySolidBodyBackgroundDamping(entity, dt);
      }
      if (entity.gadgetStabilized && entity.tier.solid && length(entity.vx, entity.vy) <= gadgetStabilizedBreakSpeed) {
        entity.vx = 0;
        entity.vy = 0;
      }
    } else {
      entity.vx *= Math.pow(0.9, dt);
      entity.vy *= Math.pow(0.9, dt);
    }

    entity.x += finiteOr(entity.vx, 0) * dt;
    entity.y += finiteOr(entity.vy, 0) * dt;
    if (entity.tier) {
      integrateBodyAngularMotion(entity, dt);
    }
    return true;
  }

  function mobBossSnapshotFields(mob) {
    if (!mob || !mob.isBoss) {
      return {};
    }
    return {
      isBoss: true,
      bossBaseKind: mob.bossBaseKind || mob.kind,
      bossStars: bossStarRank(mob),
      minionCooldown: finiteOr(mob.minionCooldown, randomRange(mobBossMinionCooldownMin, mobBossMinionCooldownMax)),
      altAttackCooldown: finiteOr(mob.altAttackCooldown, randomRange(mobBossAltAttackCooldownMin, mobBossAltAttackCooldownMax)),
      bossBodyEvadeTimer: Math.max(0, finiteOr(mob.bossBodyEvadeTimer, 0)),
      bossBodyEvadeSpeedCap: clamp(finiteOr(mob.bossBodyEvadeSpeedCap, 0), 0, bossBodyEvadeMaxSpeed)
    };
  }

  function mobTeamSnapshotFields(mob) {
    const eliteStars = mobEliteStarRank(mob);
    return {
      team: isPlayerTeamMob(mob) ? "player" : "",
      familiarOwnerPlayerId: typeof (mob && mob.familiarOwnerPlayerId) === "string" ? mob.familiarOwnerPlayerId : "",
      familiarCommandX: finiteOr(mob && mob.familiarCommandX, mob && mob.x),
      familiarCommandY: finiteOr(mob && mob.familiarCommandY, mob && mob.y),
      familiarCommandTimer: Math.max(0, finiteOr(mob && mob.familiarCommandTimer, 0)),
      summonAge: Math.max(0, finiteOr(mob && mob.summonAge, 0)),
      summonDuration: Math.max(0, finiteOr(mob && mob.summonDuration, 0)),
      summonBaseRadius: Math.max(0, finiteOr(mob && mob.summonBaseRadius, mob && mob.radius)),
      summonSpinSpeed: finiteOr(mob && mob.summonSpinSpeed, 0),
      playerDamageAggroTimer: Math.max(0, finiteOr(mob && mob.playerDamageAggroTimer, 0)),
      playerDamageAggroTargetPlayerId: typeof (mob && mob.playerDamageAggroTargetPlayerId) === "string" ? mob.playerDamageAggroTargetPlayerId : "",
      survivalCampId: typeof (mob && mob.survivalCampId) === "string" ? mob.survivalCampId : "",
      survivalCampX: finiteOr(mob && mob.survivalCampX, 0),
      survivalCampY: finiteOr(mob && mob.survivalCampY, 0),
      survivalCampLeashRadius: Math.max(0, finiteOr(mob && mob.survivalCampLeashRadius, 0)),
      survivalCampAggroTimer: Math.max(0, finiteOr(mob && mob.survivalCampAggroTimer, 0)),
      survivalCampReturning: Boolean(mob && mob.survivalCampReturning),
      survivalCampSlotAngle: finiteOr(mob && mob.survivalCampSlotAngle, 0),
      survivalCampSlotRadius: Math.max(0, finiteOr(mob && mob.survivalCampSlotRadius, 0)),
      survivalMigrationCampId: typeof (mob && mob.survivalMigrationCampId) === "string" ? mob.survivalMigrationCampId : "",
      survivalMigrationCampX: finiteOr(mob && mob.survivalMigrationCampX, Number.NaN),
      survivalMigrationCampY: finiteOr(mob && mob.survivalMigrationCampY, Number.NaN),
      survivalMigrationStraightTime: Math.max(0, finiteOr(mob && mob.survivalMigrationStraightTime, 0)),
      survivalMigrationDirX: finiteOr(mob && mob.survivalMigrationDirX, 0),
      survivalMigrationDirY: finiteOr(mob && mob.survivalMigrationDirY, 0),
      survivalEncounterType: mob && ["camp", "migration", "salvage"].includes(mob.survivalEncounterType) ? mob.survivalEncounterType : "",
      survivalEncounterId: typeof (mob && mob.survivalEncounterId) === "string" ? mob.survivalEncounterId : "",
      survivalTargetPlayerId: typeof (mob && mob.survivalTargetPlayerId) === "string" ? mob.survivalTargetPlayerId : "",
      survivalSalvageBodyId: Math.max(0, Math.floor(finiteOr(mob && mob.survivalSalvageBodyId, 0))),
      survivalSalvageSourceCampId: typeof (mob && mob.survivalSalvageSourceCampId) === "string" ? mob.survivalSalvageSourceCampId : "",
      survivalSalvageTargetCampId: typeof (mob && mob.survivalSalvageTargetCampId) === "string" ? mob.survivalSalvageTargetCampId : "",
      survivalSalvageAge: Math.max(0, finiteOr(mob && mob.survivalSalvageAge, 0)),
      survivalCampBudget: Math.max(0, finiteOr(mob && mob.survivalCampBudget, 0)),
      survivalCampBand: typeof (mob && mob.survivalCampBand) === "string" ? mob.survivalCampBand : "",
      eliteStars,
      eliteGroupSize: eliteStars > 0 ? mobEliteRewardValue(mob) : 1
    };
  }

  function serializeRival(rival) {
    return {
      id: rival.id,
      x: rival.x,
      y: rival.y,
      vx: rival.vx,
      vy: rival.vy,
      radius: rival.radius,
      health: rival.health,
      maxHealth: rival.maxHealth,
      color: rival.color,
      flash: rival.flash,
      hitCooldown: rival.hitCooldown,
      disabledTimer: rival.disabledTimer,
      landed: rival.landed,
      residentTier: rival.residentTier,
      shootCooldown: rival.shootCooldown,
      strafeSign: rival.strafeSign,
      rotation: rival.rotation,
      wobble: rival.wobble,
      ...mobTeamSnapshotFields(rival),
      ...mobBossSnapshotFields(rival)
    };
  }
