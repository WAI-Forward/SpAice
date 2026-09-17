  function updateUfo(state, ufo, players, dt, seedHolder) {
    const targetInfo = nearestCombatPlayer(players, ufo);
    const target = targetInfo.player;
    const salvageTarget = survivalSalvageTowTarget(state, ufo, dt);
    const hostileSurvivalEncounter = ufo &&
      !isPlayerTeamMob(ufo) &&
      (ufo.survivalEncounterType === "camp" || isSurvivalCampMob(state, ufo));
    const cleanupBody = salvageTarget || isPlayerTeamMob(ufo) || hostileSurvivalEncounter ? null : ufoCleanupTarget(state, ufo);
    const beamMode = updateUfoBossBeamState(ufo, dt);
    const moveTarget = salvageTarget || (cleanupBody && !(ufo.isBoss && beamMode === "drain") ? cleanupBody : target);
    if (!moveTarget) {
      return;
    }
    const toTargetX = moveTarget.x - ufo.x;
    const toTargetY = moveTarget.y - ufo.y;
    const dist = Math.hypot(toTargetX, toTargetY) || 1;
    const nx = toTargetX / dist;
    const ny = toTargetY / dist;
    const tangentX = -ny * (Number(ufo.strafeSign) < 0 ? -1 : 1);
    const tangentY = nx * (Number(ufo.strafeSign) < 0 ? -1 : 1);
    const desiredDistance = salvageTarget ? 0 : cleanupBody && moveTarget === cleanupBody ? clamp(finiteOr(cleanupBody.radius, 0) + 350, 430, 660) : 430;
    const noBeamBoost = ufo.isBoss && beamMode === "cooldown" ? 1.34 : 1;
    const chaseForce = bossChaseForce(ufo, (dist > desiredDistance ? 92 : -44) * noBeamBoost);
    const strafeForce = bossStrafeForce(ufo, (dist < 880 ? 56 : 18) * noBeamBoost);

    ufo.vx += nx * chaseForce * dt + tangentX * strafeForce * dt;
    ufo.vy += ny * chaseForce * dt + tangentY * strafeForce * dt;
    ufo.vx += Math.sin(state.tick * 0.0348 + finiteOr(ufo.wobble, 0)) * 10 * dt;
    ufo.vy += Math.cos(state.tick * 0.0312 + finiteOr(ufo.wobble, 0)) * 10 * dt;
    ufo.vx *= Math.pow(0.75, dt);
    ufo.vy *= Math.pow(0.75, dt);

    const speed = Math.hypot(ufo.vx, ufo.vy);
    const maxSpeed = bossChaseMaxSpeed(ufo, (dist > 760 ? 170 : 132) * noBeamBoost, nx, ny);
    if (speed > maxSpeed) {
      ufo.vx = (ufo.vx / speed) * maxSpeed;
      ufo.vy = (ufo.vy / speed) * maxSpeed;
    }

    ufo.x += ufo.vx * dt;
    ufo.y += ufo.vy * dt;
    applyUfoTractorBeam(state, seedHolder, ufo, dt);
    if (target) {
      applyUfoBossPlayerDrainBeam(state, ufo, target, dt);
    }
    updateUfoUndersideImpact(state, ufo, players);
    ufo.rotation = finiteOr(ufo.beamAngle, Math.PI / 2) - Math.PI / 2;
  }

  function nearestCombatPlayer(players, mob) {
    let target = players[0] || null;
    let targetDistance = Infinity;
    for (const candidate of players) {
      const distance = Math.hypot(candidate.x - mob.x, candidate.y - mob.y);
      if (distance < targetDistance) {
        target = candidate;
        targetDistance = distance;
      }
    }
    return { player: target, distance: targetDistance };
  }

  function combatTargetsForMobs(state) {
    const targets = Object.values(state.players || {}).filter((entry) => entry && entry.health > 0 && !entry.spacecraftInterior);
    for (const mob of allCombatMobs(state.world)) {
      if (mob && mob.health > 0 && isPlayerTeamMob(mob)) {
        targets.push(mob);
      }
    }
    const hasInsidePlayer = Object.values(state.players || {}).some((entry) => entry && entry.health > 0 && entry.spacecraftInterior);
    if (targets.length || !hasInsidePlayer) {
      return targets;
    }
    return spacecraftComponentTargets(state.world);
  }

  function simTime(state) {
    return finiteOr(state && state.tick, 0) * TICK_DT;
  }

  function ensureMobMechanics(mob, seedHolder) {
    if (!mob || !mob.kind) {
      return;
    }
    mob.strafeSign = Number(mob.strafeSign) < 0 ? -1 : 1;
    mob.wobble = finiteOr(mob.wobble, randomRange(seedHolder, 0, Math.PI * 2));
    if (mob.kind === "rambot") {
      mob.chargeCooldown = Math.max(0, finiteOr(mob.chargeCooldown, randomRange(seedHolder, 1.2, 2.6)));
      mob.chargeTimer = Math.max(0, finiteOr(mob.chargeTimer, 0));
      mob.recoverTimer = Math.max(0, finiteOr(mob.recoverTimer, 0));
      mob.chargeDirX = finiteOr(mob.chargeDirX, 1);
      mob.chargeDirY = finiteOr(mob.chargeDirY, 0);
      mob.impactCooldown = Math.max(0, finiteOr(mob.impactCooldown, 0));
    } else if (mob.kind === "ufo") {
      mob.beamAngle = finiteOr(mob.beamAngle, Math.PI / 2);
      mob.beamPulse = finiteOr(mob.beamPulse, randomRange(seedHolder, 0, Math.PI * 2));
      mob.tractorDisabledTimer = Math.max(0, finiteOr(mob.tractorDisabledTimer, 0));
      mob.bossBeamMode = normalizeUfoBossBeamModeValue(mob.bossBeamMode);
      mob.bossBeamTimer = Math.max(0, finiteOr(mob.bossBeamTimer, UFO_BOSS_NORMAL_BEAM_DURATION));
      mob.playerDrainTickTimer = Math.max(0, finiteOr(mob.playerDrainTickTimer, 0));
    } else if (mob.kind === "engineer") {
      mob.healCooldown = Math.max(0, finiteOr(mob.healCooldown, randomRange(seedHolder, 0.35, 0.9)));
      mob.healPulse = Math.max(0, finiteOr(mob.healPulse, 0));
      mob.repairBeamAngle = finiteOr(mob.repairBeamAngle, 0);
      mob.targetKind = typeof mob.targetKind === "string" ? mob.targetKind : "";
      mob.targetId = Math.max(0, Math.floor(finiteOr(mob.targetId, 0)));
    } else if (mob.kind === "tesla") {
      mob.shootCooldown = Math.max(0, finiteOr(mob.shootCooldown, randomRange(seedHolder, 1.2, 2.5)));
      mob.lightningWarmup = clamp(finiteOr(mob.lightningWarmup, 0), 0, 1);
      mob.lightningFlash = Math.max(0, finiteOr(mob.lightningFlash, 0));
      mob.lightningAngle = finiteOr(mob.lightningAngle, 0);
    } else if (mob.kind === "satellite") {
      mob.scannerAngle = finiteOr(mob.scannerAngle, finiteOr(mob.rotation, 0) - Math.PI / 2);
      mob.scanProgress = clamp(finiteOr(mob.scanProgress, 0), 0, 1);
      mob.lockTimer = Math.max(0, finiteOr(mob.lockTimer, 0));
      mob.blastTimer = Math.max(0, finiteOr(mob.blastTimer, 0));
      mob.recoverTimer = Math.max(0, finiteOr(mob.recoverTimer, 0));
      mob.lockX = finiteOr(mob.lockX, mob.x);
      mob.lockY = finiteOr(mob.lockY, mob.y);
      mob.blastDirX = finiteOr(mob.blastDirX, 1);
      mob.blastDirY = finiteOr(mob.blastDirY, 0);
      mob.volleyTimer = Math.max(0, finiteOr(mob.volleyTimer, 0));
      mob.volleyShots = Math.max(0, Math.floor(finiteOr(mob.volleyShots, 0)));
      mob.impactCooldown = Math.max(0, finiteOr(mob.impactCooldown, 0));
    } else if (mob.kind === "rocket") {
      mob.chargeCooldown = Math.max(0, finiteOr(mob.chargeCooldown, randomRange(seedHolder, 0.6, 1.6)));
      mob.chargeTimer = Math.max(0, finiteOr(mob.chargeTimer, 0));
      mob.chargeDirX = finiteOr(mob.chargeDirX, Math.cos(finiteOr(mob.rotation, 0) - Math.PI / 2));
      mob.chargeDirY = finiteOr(mob.chargeDirY, Math.sin(finiteOr(mob.rotation, 0) - Math.PI / 2));
      mob.chargePower = clamp(finiteOr(mob.chargePower, 0), 0, 1);
      mob.recoverTimer = Math.max(0, finiteOr(mob.recoverTimer, 0));
      mob.lockX = finiteOr(mob.lockX, mob.x);
      mob.lockY = finiteOr(mob.lockY, mob.y);
      mob.impactCooldown = Math.max(0, finiteOr(mob.impactCooldown, 0));
      mob.blastTimer = Math.max(0, finiteOr(mob.blastTimer, 0));
    } else if (mob.kind === "fighter") {
      mob.shootCooldown = Math.max(0, finiteOr(mob.shootCooldown, randomRange(seedHolder, 1.0, 2.4)));
      mob.shieldCharge = clamp(finiteOr(mob.shieldCharge, FIGHTER_SHIELD_MAX_CHARGE), 0, FIGHTER_SHIELD_MAX_CHARGE);
      mob.shieldRecharge = clamp(finiteOr(mob.shieldRecharge, 0), 0, FIGHTER_SHIELD_CYCLE);
      mob.shieldActive = Math.max(0, finiteOr(mob.shieldActive, 0));
    }
  }

  function structureHitRadius(structure) {
    if (!structure || typeof structure !== "object") return 48;
    if (structure.type === "battery" || structure.type === "tether") return 42;
    if (structure.type === "container") return 48;
    if (structure.type === "trading-port") return 58;
    if (structure.type === "medbay") return 52;
    if (structure.type === "accumulator") return 44;
    if (structure.type === "jet" || structure.type === "bridge") return 46;
    if (structure.type === "shield-generator" || structure.type === "missile-launcher" || structure.type === "communication-relay") return 52;
    return structure.type === "plating-block" ? 48 : 48;
  }

  function nearestStructureTarget(world, x, y, maxRange, predicate) {
    let best = null;
    let bestDistance = Infinity;
    for (const structure of world.structures || []) {
      if (!structure || finiteOr(structure.health, 0) <= 0 || predicate && !predicate(structure)) {
        continue;
      }
      const distance = Math.hypot(finiteOr(structure.x, 0) - x, finiteOr(structure.y, 0) - y);
      if (distance > maxRange + structureHitRadius(structure) || distance >= bestDistance) {
        continue;
      }
      best = structure;
      bestDistance = distance;
    }
    return best;
  }

  function hasClearShotAtStructure(world, x, y, structure) {
    return !projectileBlockedBySolidBody(world, x, y, structure.x, structure.y, structureHitRadius(structure) * 0.14);
  }

  function damageStructure(state, structure, damage, cause) {
    if (!structure || finiteOr(structure.health, 0) <= 0) {
      return false;
    }
    if (structure.type === "tether") {
      return false;
    }
    if (isSurvivalCampStructure(state, structure)) {
      wakeSurvivalCampFromStructure(state, structure, "");
    }
    structure.health = Math.max(0, finiteOr(structure.health, 0) - Math.max(0, finiteOr(damage, 0)));
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.22);
    if (structure.health <= 0) {
      structure.disabledTimer = Math.max(finiteOr(structure.disabledTimer, 0), 1.2);
    }
    state.events.push({ type: "structure.hitByMob", structureId: structure.id, cause: cause || "mob", tick: state.tick });
    return structure.health <= 0;
  }

  function disableStructure(state, structure, duration, cause) {
    if (!structure || finiteOr(structure.health, 0) <= 0) {
      return false;
    }
    structure.disabledTimer = Math.max(finiteOr(structure.disabledTimer, 0), Math.max(0, finiteOr(duration, 0)));
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.18);
    state.events.push({ type: "structure.disabledByMob", structureId: structure.id, cause: cause || "mob", tick: state.tick });
    return true;
  }

  function repairStructure(state, structure, amount, cause) {
    if (!structure) {
      return false;
    }
    const maxHealth = Math.max(1, finiteOr(structure.maxHealth, structureMaxHealth(structure.type)));
    const current = clamp(finiteOr(structure.health, maxHealth), 0, maxHealth);
    const disabledTimer = Math.max(0, finiteOr(structure.disabledTimer, 0));
    if (current >= maxHealth && disabledTimer <= 0) {
      return false;
    }
    const repairAmount = Math.max(0, finiteOr(amount, 0));
    structure.maxHealth = maxHealth;
    structure.health = Math.min(maxHealth, current + repairAmount);
    structure.flash = Math.max(finiteOr(structure.flash, 0), 0.12);
    if (structure.health > 0 && disabledTimer > 0) {
      structure.disabledTimer = 0;
    } else if (structure.health > 0) {
      structure.disabledTimer = Math.min(finiteOr(structure.disabledTimer, 0), 0.4);
    }
    if (state && Array.isArray(state.events)) {
      state.events.push({ type: "structure.repairedByPlayer", structureId: structure.id, cause: cause || "spanner", tick: state.tick });
    }
    return true;
  }

  function structureTargetPointForPlayer(structure, player) {
    if (structure && isLinkedStructureType(structure.type)) {
      const firstDistance = Math.hypot(finiteOr(structure.x, 0) - player.x, finiteOr(structure.y, 0) - player.y);
      const x2 = finiteOr(structure.x2, structure.x);
      const y2 = finiteOr(structure.y2, structure.y);
      const secondDistance = Math.hypot(x2 - player.x, y2 - player.y);
      if (secondDistance < firstDistance) {
        return { x: x2, y: y2, playerDistance: secondDistance };
      }
    }
    return {
      x: finiteOr(structure && structure.x, 0),
      y: finiteOr(structure && structure.y, 0),
      playerDistance: Math.hypot(finiteOr(structure && structure.x, 0) - player.x, finiteOr(structure && structure.y, 0) - player.y)
    };
  }

  function findSpannerStructureTarget(world, player, input, options) {
    if (!world || !player || !input) {
      return null;
    }
    const damagedOnly = Boolean(options && options.damagedOnly);
    const aim = aimVector(input);
    const ax = player.x + aim.x * 18;
    const ay = player.y + aim.y * 18;
    const bx = player.x + aim.x * (SPANNER_REPAIR_RANGE + 86);
    const by = player.y + aim.y * (SPANNER_REPAIR_RANGE + 86);
    let best = null;
    let bestScore = Infinity;

    for (const structure of world.structures || []) {
      const maxHealth = Math.max(1, finiteOr(structure && structure.maxHealth, structureMaxHealth(structure && structure.type)));
      const health = clamp(finiteOr(structure && structure.health, maxHealth), 0, maxHealth);
      const disabledTimer = Math.max(0, finiteOr(structure && structure.disabledTimer, 0));
      if (!structure || (!damagedOnly && health <= 0) || (damagedOnly && health >= maxHealth && disabledTimer <= 0)) {
        continue;
      }
      const target = structureTargetPointForPlayer(structure, player);
      const hitRadius = structureHitRadius(structure);
      if (target.playerDistance > SPANNER_REPAIR_RANGE + hitRadius) {
        continue;
      }
      const segmentDistance = distanceToSegment(target.x, target.y, ax, ay, bx, by);
      if (segmentDistance > hitRadius + 42) {
        continue;
      }
      const score = segmentDistance + target.playerDistance * 0.18;
      if (score < bestScore) {
        best = structure;
        bestScore = score;
      }
    }

    return best;
  }

  function useSpannerOnStructure(state, player, input, dt) {
    if (!state || !state.world || !player || !input || !isSpannerToolId(input.equippedTool) || !playerHasTool(player, "spanner")) {
      return false;
    }
    if (hasPlayerStatusEffect(player, "disabled")) {
      return false;
    }

    if (input.buttons.fire) {
      const target = findSpannerStructureTarget(state.world, player, input, { damagedOnly: true });
      if (!target || !spendPlayerEnergy(player, SPANNER_REPAIR_ENERGY_DRAIN * dt)) {
        return false;
      }
      const amount = SPANNER_REPAIR_RATE * toolUpgradeFactor(player, "spanner", "repair-speed") * dt;
      return repairStructure(state, target, amount, "spanner");
    }

    if (input.buttons.dismantle || input.toolMode === "dismantle") {
      const target = findSpannerStructureTarget(state.world, player, input, { damagedOnly: false });
      if (!target || !spendPlayerEnergy(player, SPANNER_DISMANTLE_ENERGY_DRAIN * dt)) {
        return false;
      }
      const maxHealth = Math.max(1, finiteOr(target.maxHealth, structureMaxHealth(target.type)));
      const health = clamp(finiteOr(target.health, maxHealth), 0, maxHealth);
      target.maxHealth = maxHealth;
      target.health = Math.max(0, health - SPANNER_DISMANTLE_RATE * toolUpgradeFactor(player, "spanner", "dismantle-speed") * dt);
      target.flash = Math.max(finiteOr(target.flash, 0), 0.16);
      state.events.push({ type: "structure.dismantledByPlayer", structureId: target.id, playerId: player.id || "", tick: state.tick });
      if (target.health <= 0) {
        const index = state.world.structures.indexOf(target);
        if (index !== -1) {
          state.world.structures.splice(index, 1);
        }
        const refunded = refundRecipeCost(player, recipeByStructureType(target.type), 0.8);
        state.events.push({ type: "structure.removedBySpanner", structureId: target.id, playerId: player.id || "", refunded, tick: state.tick });
      }
      return true;
    }

    return false;
  }

  function playerTarget(player) {
    if (isCombatMobEntity(player)) {
      return {
        kind: "mob",
        mobTarget: true,
        targetMob: player,
        x: player.x,
        y: player.y,
        vx: finiteOr(player.vx, 0),
        vy: finiteOr(player.vy, 0),
        radius: finiteOr(player.radius, 28)
      };
    }
    if (player && player.spacecraftTarget) {
      return {
        kind: "spacecraft",
        player,
        spacecraftTarget: true,
        x: player.x,
        y: player.y,
        vx: finiteOr(player.vx, 0),
        vy: finiteOr(player.vy, 0),
        radius: finiteOr(player.radius, 32)
      };
    }
    return {
      kind: "player",
      player,
      x: player.x,
      y: player.y,
      vx: finiteOr(player.vx, 0),
      vy: finiteOr(player.vy, 0),
      radius: finiteOr(player.radius, PLAYER_RADIUS)
    };
  }

  function structureTarget(structure) {
    return {
      kind: "structure",
      structure,
      x: finiteOr(structure.x, 0),
      y: finiteOr(structure.y, 0),
      vx: 0,
      vy: 0,
      radius: structureHitRadius(structure)
    };
  }

  function hasClearShotAtCombatTarget(world, mob, target) {
    if (target && target.kind === "structure") {
      return hasClearShotAtStructure(world, mob.x, mob.y, target.structure);
    }
    if (target && target.kind === "spacecraft") {
      return !projectileBlockedBySolidBody(world, mob.x, mob.y, target.x, target.y, Math.max(4, target.radius * 0.18));
    }
    if (target && target.kind === "mob") {
      return !projectileBlockedBySolidBody(world, mob.x, mob.y, target.x, target.y, Math.max(4, target.radius * 0.2));
    }
    return target && target.player ? hasClearShotAtPlayer(world, mob, target.player) : false;
  }

  function projectileBlockedBySolidBody(world, ax, ay, bx, by, radius, ignoredBodyId) {
    for (const body of world.particles || []) {
      if (!body || !body.tier || !body.tier.solid) {
        continue;
      }
      if (ignoredBodyId && body.id === ignoredBodyId) {
        continue;
      }
      const hitDistance = solidContactRadius(body) + radius;
      if (distanceToSegment(body.x, body.y, ax, ay, bx, by) < hitDistance) {
        return body;
      }
    }
    return null;
  }

  function hasClearShotAtPlayer(world, mob, target) {
    return !projectileBlockedBySolidBody(world, mob.x, mob.y, target.x, target.y, Math.max(4, target.radius * 0.18));
  }

  function fireAlienoidLaser(state, mob, target, distance, seedHolder) {
    if (!target) {
      return;
    }
    const leadTime = clamp(distance / RIVAL_PROJECTILE_SPEED, 0, 1.35);
    const targetX = target.x + finiteOr(target.vx, 0) * leadTime * 0.72;
    const targetY = target.y + finiteOr(target.vy, 0) * leadTime * 0.72;
    const aim = normalize(targetX - mob.x, targetY - mob.y);
    const muzzleDistance = mob.radius + 18;
    const projectile = normalizeEntity({
      id: Math.max(1, Math.floor(finiteOr(state.world.nextRivalProjectileId, 1))),
      kind: "projectile",
      x: mob.x + aim.x * muzzleDistance,
      y: mob.y + aim.y * muzzleDistance,
      vx: aim.x * RIVAL_PROJECTILE_SPEED + finiteOr(mob.vx, 0) * 0.18,
      vy: aim.y * RIVAL_PROJECTILE_SPEED + finiteOr(mob.vy, 0) * 0.18,
      radius: 5,
      length: randomRange(seedHolder, 34, 46),
      color: shadeColor(mob.color, 64),
      life: 2.38,
      maxLife: 2.38,
      damage: bossScaledDamage(mob, RIVAL_PROJECTILE_DAMAGE),
      toolDisable: 0,
      cause: mob.isBoss ? "Alienoid boss laser" : "Alienoid laser",
      ...playerTeamMobProjectileFields(mob),
      targetPlayerId: target.id || ""
    }, state.world.nextRivalProjectileId || 1, "projectile");
    state.world.rivalProjectiles.push(projectile);
    state.world.nextRivalProjectileId = projectile.id + 1;
    mob.shootCooldown = randomRange(seedHolder, 4.5, 7.25) * (mob.isBoss ? 0.68 : 1);
    mob.rotation = Math.atan2(aim.y, aim.x) + Math.PI / 2;
    state.events.push({ type: "mob.shot", mobId: mob.id, kind: mob.kind || "alienoid", projectileId: projectile.id, tick: state.tick });
  }
