  function drawProjectileDynamicLight(projectile, options) {
    if (!projectile) {
      return false;
    }

    const fade = clamp(finiteOr(projectile.life, 0) / Math.max(0.001, finiteOr(projectile.maxLife, 1)), 0, 1);
    const speed = Math.hypot(finiteOr(projectile.vx, 0), finiteOr(projectile.vy, 0)) || 1;
    const dirX = finiteOr(projectile.vx, 0) / speed;
    const dirY = finiteOr(projectile.vy, 0) / speed;
    const tailX = projectile.x - dirX * finiteOr(projectile.length, 40);
    const tailY = projectile.y - dirY * finiteOr(projectile.length, 40);
    const midX = (tailX + projectile.x) / 2;
    const midY = (tailY + projectile.y) / 2;
    const baseRadius = options && Number.isFinite(options.radius) ? options.radius : 142;
    const baseAlpha = options && Number.isFinite(options.alpha) ? options.alpha : 0.076;
    const warmth = options && Number.isFinite(options.warmth) ? options.warmth : 0.7;
    const color = projectile.rocket ? dynamicLightingFlameColor : projectile.color;

    let visible = drawWorldDynamicLight(projectile.x, projectile.y, baseRadius, color, baseAlpha * fade, {
      minRadius: 34,
      maxRadius: projectile.lightning ? 260 : projectile.rocket ? 230 : 180,
      warmth,
      core: 0.07
    });
    visible = drawWorldDynamicLight(midX, midY, baseRadius * 0.72, color, baseAlpha * 0.45 * fade, {
      minRadius: 24,
      maxRadius: projectile.lightning ? 210 : 140,
      warmth,
      core: 0.05
    }) || visible;
    return visible;
  }

  function drawProjectileDynamicLights() {
    const limit = Math.round(18 + renderQuality() * 28);
    let drawn = drawProjectileDynamicLightCollection(rivalProjectiles, 0, limit);
    drawn = drawProjectileDynamicLightCollection(playerLasers, drawn, limit);
    drawProjectileDynamicLightCollection(launcherMissiles, drawn, limit);
  }

  function drawProjectileDynamicLightCollection(collection, drawn, limit) {
    if (!Array.isArray(collection) || drawn >= limit) {
      return drawn;
    }

    for (const projectile of collection) {
      if (drawn >= limit) {
        return drawn;
      }
      if (!isWorldCircleNearView(projectile.x, projectile.y, finiteOr(projectile.length, 90), 360)) {
        continue;
      }

      const options = projectile.lightning
        ? { radius: 210, alpha: 0.095, warmth: 0.66 }
        : projectile.rocket
          ? { radius: 190, alpha: 0.084, warmth: 0.9 }
          : { radius: 140, alpha: 0.076, warmth: 0.72 };

      if (drawProjectileDynamicLight(projectile, options)) {
        drawn += 1;
      }
    }

    return drawn;
  }

  function drawGadgetDynamicLights(time) {
    const aim = getAim();
    const targets = activeGadgetGatherTargets(aim, Math.round(5 + renderQuality() * 7));
    if (!targets.length) {
      return;
    }

    const funnel = getFunnel(aim);
    const pulse = 0.88 + Math.sin(time * 0.012) * 0.12;
    const primary = targets[0].particle;
    drawWorldDynamicLight(funnel.mouthX, funnel.mouthY, 138, primary.color, 0.048 * pulse, {
      minRadius: 38,
      maxRadius: 168,
      warmth: 0.16,
      core: 0.06
    });
    drawWorldDynamicLight(funnel.x, funnel.y, 124, primary.color, 0.036 * pulse, {
      minRadius: 34,
      maxRadius: 150,
      warmth: 0.14,
      core: 0.05
    });

    let drawn = 0;
    for (const target of targets) {
      const particle = target.particle;
      const falloff = 1 - drawn / Math.max(1, targets.length) * 0.42;
      if (drawWorldDynamicLight(particle.x, particle.y, 42 + particle.radius * 2.8, particle.color, 0.026 * pulse * falloff, {
        minRadius: 18,
        maxRadius: 92,
        warmth: 0.12,
        core: 0.08
      })) {
        drawn += 1;
      }
    }
  }

  function isJetpackBoostFlameActive(dt = 1 / 60) {
    return !playerIsOnFoot() && isMoving() && canUseJetpackBoost(dt);
  }

  function drawPlayerDynamicLight(time) {
    if (!isJetpackBoostFlameActive(renderPerformance.lastFrameDt || 1 / 60)) {
      dynamicLightingPlayerBoost = 1;
      dynamicLightingPlayerBoostTime = time;
      return;
    }

    const exhaust = smoothedLocalJetpackExhaust(time);
    const boostTarget = 1.36;
    const boostDt = dynamicLightingPlayerBoostTime > 0
      ? clamp((time - dynamicLightingPlayerBoostTime) / 1000, 0, 0.08)
      : 1 / 60;
    dynamicLightingPlayerBoostTime = time;
    dynamicLightingPlayerBoost += (boostTarget - dynamicLightingPlayerBoost) * (1 - Math.exp(-boostDt * 8.5));

    const boost = dynamicLightingPlayerBoost;
    const pulse = 0.92 + Math.sin(time * 0.024) * 0.07 + Math.sin(time * 0.071) * 0.035;
    const bob = Math.sin(time * 0.004) * 2.4;
    const nozzleX = width / 2 + exhaust.x * (34 + boost * 8) * cameraZoom;
    const nozzleY = height / 2 + (bob + 50) * cameraZoom + exhaust.y * (34 + boost * 10) * cameraZoom;
    const radius = clamp(134 * cameraZoom * boost * pulse, 58, 188);
    drawScreenDynamicLight(nozzleX, nozzleY, radius, jetpackFlameLightColor, 0.102 * boost * pulse, 0.07);
    drawScreenDirectionalDynamicLight(
      nozzleX + exhaust.x * radius * 0.2,
      nozzleY + exhaust.y * radius * 0.2,
      exhaust.x,
      exhaust.y,
      clamp(178 * cameraZoom * boost, 76, 232),
      clamp(88 * cameraZoom * boost, 42, 124),
      jetpackFlameLightColor,
      0.052 * boost * pulse
    );
  }

  function dynamicStructureColor(structure) {
    if (structure.type === "battery") return { r: 157, g: 255, b: 122 };
    if (structure.type === "medbay") return { r: 123, g: 255, b: 173 };
    if (structure.type === "accumulator") return { r: 88, g: 226, b: 255 };
    if (structure.type === "turret") return { r: 255, g: 115, b: 173 };
    if (structure.type === "missile-launcher") return { r: 255, g: 184, b: 88 };
    if (structure.type === "shield-generator") return { r: 119, g: 167, b: 255 };
    if (structure.type === "communication-relay") return { r: 255, g: 184, b: 107 };
    if (structure.type === "jet") return dynamicLightingFlameColor;
    if (structure.type === "tether" || structure.type === "bridge") return { r: 169, g: 133, b: 255 };
    return { r: 255, g: 209, b: 102 };
  }

  function drawStructureDynamicLights(time) {
    for (const structure of structures) {
      if (!structure || structure.health <= 0) {
        continue;
      }
      if (!isWorldCircleNearView(structure.x, structure.y, 180, 760)) {
        continue;
      }

      const disabledScale = isStructureDisabled(structure) ? 0.42 : 1;
      const deploy = clamp(finiteOr(structure.deploy, 0), 0, 1);
      const activePulse = 0.9 + Math.sin(time * 0.006 + finiteOr(structure.wobble, 0)) * 0.1;
      let radius = 108 + deploy * 54;
      let alpha = (0.026 + deploy * 0.026) * activePulse * disabledScale;

      if (structure.type === "jet") {
        const thrust = clamp(finiteOr(structure.thrustAmount, 0), 0, 1);
        radius += 90 + thrust * 185;
        alpha += thrust * 0.074;

        if (thrust > 0.02) {
          const thrustDirection = finiteOr(structure.thrustDirection, 1) < 0 ? -1 : 1;
          const flameOffset = rotatePoint(0, (46 + thrust * 36) * thrustDirection, structure.angle + Math.PI / 2);
          drawWorldDynamicLight(structure.x + flameOffset.x, structure.y + flameOffset.y, 190 + thrust * 180, dynamicLightingFlameColor, 0.088 * thrust, {
            minRadius: 52,
            maxRadius: 300,
            warmth: 0.96,
            core: 0.06
          });
        }
      } else if (structure.type === "shield-generator") {
        alpha += clamp(finiteOr(structure.burstTimer, 0) / shieldGeneratorActiveDuration, 0, 1) * 0.054;
        radius += 64;
      } else if (structure.type === "missile-launcher") {
        alpha += clamp(finiteOr(structure.lockTimer, 0) / missileLauncherLockDuration, 0, 1) * 0.032;
      } else if (structure.type === "medbay") {
        alpha += clamp(finiteOr(structure.healPulse, 0), 0, 1) * 0.052;
        radius += 44;
      }

      drawWorldDynamicLight(structure.x, structure.y, radius, dynamicStructureColor(structure), alpha, {
        minRadius: 38,
        maxRadius: 280,
        warmth: structure.type === "jet" ? 0.95 : 0.8,
        core: 0.1
      });
    }
  }

  function drawMechanicalMobDynamicLights(time) {
    for (const ufo of ufos) {
      if (ufo.health <= 0) continue;
      if (!isWorldCircleNearView(ufo.x, ufo.y, 260, 460)) continue;
      const pulse = 0.9 + Math.sin(time * 0.008 + ufo.beamPulse) * 0.1;
      drawWorldDynamicLight(ufo.x, ufo.y, 188, ufo.color, 0.062 * pulse, { minRadius: 54, maxRadius: 260, warmth: 0.72, core: 0.12 });

      if (ufoHasActiveBeam(ufo)) {
        const beamX = ufo.x + Math.cos(ufo.beamAngle) * 210;
        const beamY = ufo.y + Math.sin(ufo.beamAngle) * 210;
        const beamColor = ufoHasPlayerDrainBeam(ufo) ? { r: 255, g: 73, b: 73 } : ufo.color;
        drawWorldDynamicLight(beamX, beamY, 190, beamColor, 0.028 * pulse, { minRadius: 46, maxRadius: 220, warmth: 0.68, core: 0.08 });
      }
    }

    for (const rambot of rambots) {
      if (rambot.health <= 0) continue;
      if (!isWorldCircleNearView(rambot.x, rambot.y, 240, 420)) continue;
      const charge = rambot.chargeTimer > 0 ? 1 : 0;
      drawWorldDynamicLight(rambot.x, rambot.y, 154 + charge * 110, rambot.color, 0.044 + charge * 0.044, { minRadius: 44, maxRadius: 240, warmth: 0.88, core: 0.1 });
    }

    for (const engineer of engineers) {
      if (engineer.health <= 0) continue;
      if (!isWorldCircleNearView(engineer.x, engineer.y, 230, 420)) continue;
      const heal = clamp(finiteOr(engineer.healPulse, 0) / 0.38, 0, 1);
      drawWorldDynamicLight(engineer.x, engineer.y, 145 + heal * 110, engineer.color, 0.042 + heal * 0.048, { minRadius: 42, maxRadius: 230, warmth: 0.78, core: 0.09 });
    }

    for (const tesla of teslas) {
      if (tesla.health <= 0) continue;
      if (!isWorldCircleNearView(tesla.x, tesla.y, 280, 460)) continue;
      const warmup = clamp(finiteOr(tesla.lightningWarmup, 0), 0, 1);
      const flash = clamp(finiteOr(tesla.lightningFlash, 0) / 0.32, 0, 1);
      drawWorldDynamicLight(tesla.x, tesla.y, 172 + warmup * 120, tesla.color, 0.06 + warmup * 0.034 + flash * 0.042, { minRadius: 52, maxRadius: 280, warmth: 0.72, core: 0.08 });
    }

    for (const rocket of rockets) {
      if (rocket.health <= 0) continue;
      if (!isWorldCircleNearView(rocket.x, rocket.y, 290, 460)) continue;
      const active = clamp(finiteOr(rocket.chargePower, 0), 0, 1) + (rocket.blastTimer > 0 ? 0.55 : 0) + (rocket.lockTimer > 0 ? 0.22 : 0);
      drawWorldDynamicLight(rocket.x, rocket.y, 168 + active * 140, rocket.color, 0.046 + active * 0.04, { minRadius: 46, maxRadius: 290, warmth: 0.88, core: 0.09 });
    }

    for (const fighter of fighters) {
      if (fighter.health <= 0) continue;
      if (!isWorldCircleNearView(fighter.x, fighter.y, 300, 460)) continue;
      const shield = clamp(finiteOr(fighter.shieldActive, 0) / 0.55, 0, 1);
      drawWorldDynamicLight(fighter.x, fighter.y, 172 + shield * 130, fighter.color, 0.044 + shield * 0.052, { minRadius: 48, maxRadius: 300, warmth: 0.72, core: 0.1 });
    }

    for (const beacon of mobBeacons) {
      if (!isMobBeaconRevealed(beacon)) continue;
      if (!isWorldCircleNearView(beacon.x, beacon.y, 340, 520)) continue;
      const warmup = clamp(finiteOr(beacon.age, 0) / mobBeaconWarmupDuration, 0, 1);
      const pulse = 0.86 + Math.sin(time * 0.007 + finiteOr(beacon.wobble, 0)) * 0.14;
      drawWorldDynamicLight(beacon.x, beacon.y, 190 + warmup * 120, beacon.color, (0.044 + warmup * 0.038) * pulse, { minRadius: 54, maxRadius: 340, warmth: 0.74, core: 0.1 });
    }
  }

  function drawDynamicLighting(time) {
    if (!dynamicLightingEnabled()) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(1, 2, 8, 0.28)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    drawParticleDynamicLights(time);
    drawSparkDynamicLights();
    drawPickupDynamicLights(time);
    drawProjectileDynamicLights();
    drawGadgetDynamicLights(time);
    drawPlayerDynamicLight(time);
    drawStructureDynamicLights(time);
    drawMechanicalMobDynamicLights(time);
    ctx.restore();
  }
