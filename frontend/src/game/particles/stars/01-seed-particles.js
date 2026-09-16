  function seedParticles() {
    particles.length = 0;
    const anchors = activePartyPlayerAnchors();
    const targetCount = activeParticleTargetCount(anchors);
    for (let i = 0; i < targetCount; i += 1) {
      spawnParticleNearPlayer(anchors.length > 1 ? mostUnderdenseParticleAnchor(anchors).anchor : undefined, {
        localFill: anchors.length > 1,
        playfieldFill: anchors.length > 1 && useParticlePlayfieldFill()
      });
    }
  }

  function createRival(x, y, overrides) {
    return createMobFromBlueprint("alienoid", x, y, Object.assign({
      landed: null,
      residentTier: null,
      shootCooldown: randomRange(0.8, 2.1),
    }, overrides));
  }

  function createUfo(x, y, overrides) {
    return createMobFromBlueprint("ufo", x, y, Object.assign({
      beamAngle: Math.PI / 2,
      beamPulse: randomRange(0, Math.PI * 2),
      tractorDisabledTimer: 0,
      bossBeamMode: "tractor",
      bossBeamTimer: ufoBossNormalBeamDuration,
      playerDrainTickTimer: 0
    }, overrides));
  }

  function createRambot(x, y, overrides) {
    return createMobFromBlueprint("rambot", x, y, Object.assign({
      chargeCooldown: randomRange(1.2, 2.6),
      chargeTimer: 0,
      recoverTimer: 0,
      chargeDirX: 1,
      chargeDirY: 0,
      impactCooldown: 0,
      headAngle: 0,
      pistonTimer: 0,
      pistonDuration: rambotBossPistonDuration,
      pistonHit: false
    }, overrides));
  }

  function createEngineer(x, y, overrides) {
    return createMobFromBlueprint("engineer", x, y, Object.assign({
      healCooldown: randomRange(0.35, 0.9),
      healPulse: 0,
      repairBeamAngle: 0,
      targetKind: "",
      targetId: 0
    }, overrides));
  }

  function createTesla(x, y, overrides) {
    return createMobFromBlueprint("tesla", x, y, Object.assign({
      shootCooldown: randomRange(1.2, 2.5),
      lightningWarmup: 0,
      lightningFlash: 0,
      lightningAngle: 0
    }, overrides));
  }

  function createSatellite(x, y, overrides) {
    return createMobFromBlueprint("satellite", x, y, Object.assign({
      scannerAngle: 0,
      scanProgress: 0,
      lockTimer: 0,
      blastTimer: 0,
      recoverTimer: 0,
      lockX: x,
      lockY: y,
      blastDirX: 1,
      blastDirY: 0,
      volleyTimer: 0,
      volleyShots: 0,
      impactCooldown: 0
    }, overrides));
  }

  function createRocket(x, y, overrides) {
    const angle = randomRange(0, Math.PI * 2);
    return createMobFromBlueprint("rocket", x, y, Object.assign({
      vx: Math.cos(angle) * randomRange(18, 44),
      vy: Math.sin(angle) * randomRange(18, 44),
      rotation: angle + Math.PI / 2,
      chargeCooldown: randomRange(0.6, 1.6),
      chargeTimer: 0,
      chargeDirX: Math.cos(angle),
      chargeDirY: Math.sin(angle),
      chargePower: 0,
      recoverTimer: 0,
      lockX: x,
      lockY: y,
      impactCooldown: 0,
      blastTimer: 0,
    }, overrides));
  }

  function createFighter(x, y, overrides) {
    return createMobFromBlueprint("fighter", x, y, Object.assign({
      shootCooldown: randomRange(1.0, 2.4),
      machineGunShots: 0,
      machineGunTimer: 0,
      shieldCharge: fighterShieldMaxCharge,
      shieldRecharge: 0,
      shieldActive: 0
    }, overrides));
  }

  function createHealthPickup(x, y, vx, vy) {
    const angle = randomRange(0, Math.PI * 2);
    const burst = randomRange(70, 145);
    return {
      id: nextHealthPickupId++,
      x,
      y,
      vx: vx * 0.18 + Math.cos(angle) * burst,
      vy: vy * 0.18 + Math.sin(angle) * burst,
      radius: 14,
      heal: healthPickupHeal,
      life: healthPickupLifetime,
      maxLife: healthPickupLifetime,
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function createTechPickup(techKey, x, y, vx, vy) {
    const tech = techTypes.find((candidate) => candidate.key === techKey) || techTypes[0];
    const angle = randomRange(0, Math.PI * 2);
    const burst = randomRange(60, 132);
    return {
      id: nextTechPickupId++,
      key: tech.key,
      label: tech.label,
      color: tech.color,
      x,
      y,
      vx: vx * 0.14 + Math.cos(angle) * burst,
      vy: vy * 0.14 + Math.sin(angle) * burst,
      radius: 15,
      life: techPickupLifetime,
      maxLife: techPickupLifetime,
      rotation: randomRange(0, Math.PI * 2),
      wobble: randomRange(0, Math.PI * 2)
    };
  }

  function mobBeaconVisual(kind) {
    return mobBeaconVisuals[kind] || mobBeaconVisuals.alienoid;
  }

  function mobBeaconColor(kind) {
    return mobBeaconVisual(kind).color || { r: 255, g: 115, b: 173 };
  }

  function isMobBeacon(entity) {
    return Boolean(entity && entity.isBeacon);
  }

  function mobEntityKind(entity) {
    const kind = isMobBeacon(entity) ? entity.beaconKind : entity && entity.kind;
    return mobTierOrder.includes(kind) ? kind : "alienoid";
  }

  function techKeyForMobKind(kind) {
    if (kind === "ufo") {
      return "suction";
    }
    if (kind === "rambot") {
      return "plating";
    }
    if (kind === "engineer") {
      return "repair";
    }
    if (kind === "tesla") {
      return "energy";
    }
    if (kind === "satellite") {
      return "target";
    }
    if (kind === "rocket") {
      return "propulsion";
    }
    if (kind === "fighter") {
      return "shield";
    }
    return "weapon";
  }

  function mobBeaconMaxHealth(kind) {
    const tier = Math.max(0, mobTierOrder.indexOf(kind));
    return 260 + tier * 34;
  }

  function createMobBeacon(kind, x, y, overrides) {
    const settings = overrides && typeof overrides === "object" ? overrides : {};
    const beaconKind = mobTierOrder.includes(kind) ? kind : "alienoid";
    const maxHealth = Math.max(1, finiteOr(settings.maxHealth, mobBeaconMaxHealth(beaconKind)));
    const id = Number.isFinite(Number(settings.id))
      ? Math.max(1, Math.floor(Number(settings.id)))
      : nextMobBeaconId++;
    return {
      kind: "beacon",
      beaconKind,
      isBeacon: true,
      id,
      x,
      y,
      vx: finiteOr(settings.vx, randomRange(-18, 18)),
      vy: finiteOr(settings.vy, randomRange(-18, 18)),
      radius: Math.max(12, finiteOr(settings.radius, 46)),
      health: clamp(finiteOr(settings.health, maxHealth), 0, maxHealth),
      maxHealth,
      color: normalizeColorSnapshot(settings.color, mobBeaconColor(beaconKind)),
      flash: Math.max(0, finiteOr(settings.flash, 0)),
      hitCooldown: Math.max(0, finiteOr(settings.hitCooldown, 0)),
      disabledTimer: Math.max(0, finiteOr(settings.disabledTimer, 0)),
      rotation: finiteOr(settings.rotation, randomRange(0, Math.PI * 2)),
      wobble: finiteOr(settings.wobble, randomRange(0, Math.PI * 2)),
      age: Math.max(0, finiteOr(settings.age, 0)),
      respawnTimer: Math.max(0, finiteOr(settings.respawnTimer, 0)),
      driftAngle: finiteOr(settings.driftAngle, randomRange(0, Math.PI * 2)),
      strafeSign: Number(settings.strafeSign) < 0 ? -1 : 1
    };
  }

  function dropHealthPickups(rival) {
    if (player.health >= player.maxHealth) {
      return;
    }

    const dropChance = difficultyHealthDropChance(rival.kind === "ufo" ? 0.32 : 0.28);
    const count = Math.random() < dropChance ? 1 : 0;

    for (let i = 0; i < count; i += 1) {
      healthPickups.push(createHealthPickup(rival.x, rival.y, rival.vx, rival.vy));
    }
  }

  function mobName(mob) {
    const kind = mobEntityKind(mob);
    const blueprint = mobEntityBlueprints[kind] || mobEntityBlueprints.alienoid;
    const stars = mobEliteStarRank(mob);
    return isMobBeacon(mob)
      ? blueprint.label + " beacon"
      : stars > 0
        ? stars + "-star " + blueprint.label
        : blueprint.label;
  }

  function difficultyTechDropCount() {
    const multiplier = Math.max(1, finiteOr(activeDifficulty().techDropMultiplier, 1));
    let count = Math.floor(multiplier);
    if (Math.random() < multiplier - count) {
      count += 1;
    }
    return count;
  }

  function dropMobTech(mob) {
    const kind = mobEntityKind(mob);
    const techKey = techKeyForMobKind(kind);
    const baseDropCount = isMobBeacon(mob) ? mobBeaconDropCount : mob.isBoss ? mobBossDropCount : difficultyTechDropCount();
    const dropCount = baseDropCount * mobEliteRewardValue(mob);
    for (let i = 0; i < dropCount; i += 1) {
      techPickups.push(createTechPickup(techKey, mob.x, mob.y, mob.vx, mob.vy));
    }
    if (!isMobBeacon(mob) && mob.defeatedBySpanner && isMechanicalMob(mob) && Math.random() < spannerTechBonusChance) {
      techPickups.push(createTechPickup(techKey, mob.x, mob.y, mob.vx, mob.vy));
    }
  }

  function emitMobDamageParticles(mob, damage, hitColor) {
    const particleBudget = isPartySessionActive() || multiplayer.remoteUniverses.size
      ? targetParticles * 1.9
      : targetParticles * 3;
    if (!mob || damage <= 0 || particles.length > particleBudget) {
      return;
    }

    const maxCount = isPartySessionActive() || multiplayer.remoteUniverses.size
      ? mobDamageParticleMultiplayerMax
      : mobDamageParticleMax;
    const scaledCount = Math.round(damage / mobDamagePerParticle + randomRange(-0.35, 0.35));
    const count = clamp(scaledCount, mobDamageParticleMin, maxCount);
    const baseColor = mob.color || hitColor || randomParticleColor();
    const particleColor = hitColor ? mixColor(baseColor, hitColor, 3, 2) : ejectedParticleColor(mob);

    for (let i = 0; i < count; i += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(82, 176);
      const spawnDistance = Math.max(4, mob.radius * randomRange(0.25, 0.75));
      const particle = createParticle(
        mob.x + Math.cos(angle) * spawnDistance,
        mob.y + Math.sin(angle) * spawnDistance,
        mobDamageParticleMass,
        ejectedParticleColor({ color: particleColor })
      );

      particle.vx = finiteOr(mob.vx, 0) * 0.32 + Math.cos(angle) * speed + randomRange(-22, 22);
      particle.vy = finiteOr(mob.vy, 0) * 0.32 + Math.sin(angle) * speed + randomRange(-22, 22);
      particles.push(particle);
    }
  }

  function damageMob(mob, damage, color, message, options) {
    if (mob.health <= 0) {
      return false;
    }

    mob.lastDamageTool = options && options.sourceTool ? options.sourceTool : "";
    mob.health = Math.max(0, mob.health - damage);
    mob.flash = 0.28;
    mob.hitCooldown = Math.max(finiteOr(mob.hitCooldown, 0), 0.42);
    emitMobDamageParticles(mob, damage, color);
    const sourcePlayerId = options && options.sourcePlayerId !== undefined && options.sourcePlayerId !== null
      ? String(options.sourcePlayerId || "")
      : options && options.sourceTool
        ? player.id || ""
        : "";
    wakeSurvivalCampFromMob(mob, sourcePlayerId);

    if (color) {
      sparks.push({
        x: mob.x,
        y: mob.y,
        radius: mob.radius * 2,
        color,
        life: 0.34,
        maxLife: 0.34
      });
    }

    if (mob.health <= 0) {
      mob.defeatedBySpanner = mob.lastDamageTool === "spanner";
      if (isMobBeacon(mob)) {
        mob.respawnTimer = mobBeaconRespawnDuration;
        mob.age = 0;
        dropMobTech(mob);
        notifyMobBeaconSuspended(mobEntityKind(mob), mob.respawnTimer);
      } else if (!isPlayerTeamMob(mob)) {
        const rewardValue = mobEliteRewardValue(mob);
        lifeStats.mobsDefeated += rewardValue;
        lifeStats.mobScore += scoreMobKill(mobEntityKind(mob)) * rewardValue;
        const kind = mobEntityKind(mob);
        if (mobDefeatsByKind[kind] !== undefined) {
          mobDefeatsByKind[kind] += rewardValue;
          if (!mob.isBoss && mobBossProgressByKind[kind] !== undefined) {
            mobBossProgressByKind[kind] = Math.min(
              mobBossDefeatsToUnlock,
              Math.max(0, Math.floor(finiteOr(mobBossProgressByKind[kind], 0))) + rewardValue
            );
          }
          if (!mob.isBoss && mobBossProgressByKind[kind] === mobBossDefeatsToUnlock) {
            maybeNotifyMobBossUnlocked(kind);
            maybeScheduleMobBoss(kind);
          }
        }
        if (mob.isBoss && mobBossDefeatsByKind[kind] !== undefined) {
          mobBossDefeatsByKind[kind] += 1;
          if (mobBossProgressByKind[kind] !== undefined) {
            mobBossProgressByKind[kind] = 0;
          }
          const nextBossKind = mobTierOrder[mobTierOrder.indexOf(kind) + 1];
          if (nextBossKind) {
            maybeNotifyMobBossUnlocked(nextBossKind);
          }
        }
        dropHealthPickups(mob);
        dropMobTech(mob);
      }
      playSound("mobDestroyed");
      maybeNotifyText(message || mobName(mob) + " knocked out.", options && options.notification);
      return true;
    }

    playSound("mobHit");
    return false;
  }

  function tickMobBodyImpactCooldowns(mob, dt) {
    if (!mob.bodyImpactCooldowns) {
      return;
    }

    for (const bodyId of Object.keys(mob.bodyImpactCooldowns)) {
      const remaining = finiteOr(mob.bodyImpactCooldowns[bodyId], 0) - dt;
      if (remaining > 0) {
        mob.bodyImpactCooldowns[bodyId] = remaining;
      } else {
        delete mob.bodyImpactCooldowns[bodyId];
      }
    }
  }

  function tickMobDamageTimers(mob, dt) {
    mob.hitCooldown = Math.max(0, mob.hitCooldown - dt);
    mob.disabledTimer = Math.max(0, finiteOr(mob.disabledTimer, 0) - dt);
    if (finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0)) {
      mob.summonAge = Math.min(mob.summonDuration, finiteOr(mob.summonAge, 0) + dt);
      const progress = clamp(mob.summonAge / Math.max(0.001, mob.summonDuration), 0, 1);
      const eased = progress * progress * (3 - progress * 2);
      mob.radius = Math.max(0.1, finiteOr(mob.summonBaseRadius, mob.radius) * eased);
      mob.rotation += finiteOr(mob.summonSpinSpeed, 0) * (1 - progress * 0.65) * dt;
    } else if (finiteOr(mob.summonDuration, 0) > 0) {
      mob.radius = Math.max(1, finiteOr(mob.summonBaseRadius, mob.radius));
      mob.summonDuration = 0;
      mob.summonAge = 0;
      mob.summonSpinSpeed = 0;
    }
    mob.bossBodyEvadeTimer = Math.max(0, finiteOr(mob.bossBodyEvadeTimer, 0) - dt);
    if (mob.bossBodyEvadeTimer <= 0) {
      mob.bossBodyEvadeSpeedCap = 0;
    }
    tickMobBodyImpactCooldowns(mob, dt);
  }

  function isMobSummoning(mob) {
    return Boolean(mob && finiteOr(mob.summonDuration, 0) > 0 && finiteOr(mob.summonAge, 0) < finiteOr(mob.summonDuration, 0));
  }

  function canDamageMobWithBody(mob, body) {
    const cooldowns = mob.bodyImpactCooldowns;
    return !cooldowns || finiteOr(cooldowns[body.id], 0) <= 0;
  }

  function markMobDamagedByBody(mob, body) {
    if (!mob.bodyImpactCooldowns) {
      mob.bodyImpactCooldowns = {};
    }
    mob.bodyImpactCooldowns[body.id] = bodyImpactRepeatDamageCooldown;
  }

  function triggerBossBodyEvade(mob, body, nx, ny, impactSpeed) {
    if (!mob || !body || !mob.isBoss) {
      return;
    }

    const bodySpeed = Math.hypot(finiteOr(body.vx, 0), finiteOr(body.vy, 0));
    const travelX = bodySpeed > 1 ? body.vx / bodySpeed : -nx;
    const travelY = bodySpeed > 1 ? body.vy / bodySpeed : -ny;
    const cross = travelX * ny - travelY * nx;
    const side = Math.abs(cross) > 0.02 ? Math.sign(cross) : (mob.strafeSign < 0 ? -1 : 1);
    const tangentX = -travelY * side;
    const tangentY = travelX * side;
    const evade = normalize(tangentX * 0.82 + nx * 0.38, tangentY * 0.82 + ny * 0.38);
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const boostSpeed = clamp(
      340 + Math.max(bodySpeed, finiteOr(impactSpeed, 0)) * 0.5 + Math.sqrt(mass) * 1.8,
      bossBodyEvadeMinSpeed,
      bossBodyEvadeMaxSpeed
    );
    const currentAlongEvade = finiteOr(mob.vx, 0) * evade.x + finiteOr(mob.vy, 0) * evade.y;
    const extraSpeed = Math.max(0, boostSpeed - currentAlongEvade);

    mob.vx += evade.x * extraSpeed;
    mob.vy += evade.y * extraSpeed;
    mob.strafeSign = side;
    mob.hitCooldown = Math.max(finiteOr(mob.hitCooldown, 0), 0.68);
    mob.bossBodyEvadeTimer = Math.max(finiteOr(mob.bossBodyEvadeTimer, 0), bossBodyEvadeDuration);
    mob.bossBodyEvadeSpeedCap = Math.max(finiteOr(mob.bossBodyEvadeSpeedCap, 0), boostSpeed * 1.08);
  }

  function bodyImpactKnockbackForce(body, bodySpeed) {
    const speedBonus = Math.max(0, bodySpeed - solidBodyDamageSpeed) * 0.34;
    const massBonus = Math.sqrt(Math.max(1, finiteOr(body.mass, 1))) * 2.45;
    return clamp(bodyImpactBaseKnockback + speedBonus + massBonus, bodyImpactBaseKnockback, bodyImpactMaxKnockback);
  }

  function solidBodyImpactDamage(body, impactSpeed, baseDamage) {
    const mass = Math.max(1, finiteOr(body.mass, 1));
    const speedDamage = Math.max(0, impactSpeed - solidBodyDamageSpeed) * 0.26;
    const massDamage = Math.pow(mass, 0.42) * 1.45;
    const damageCap = clamp(105 + Math.sqrt(mass) * 2.2, 120, 320);
    return Math.min(damageCap, baseDamage + speedDamage + massDamage);
  }
