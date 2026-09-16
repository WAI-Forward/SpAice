  const dynamicLightingWarmColor = { r: 255, g: 185, b: 116 };
  const dynamicLightingFlameColor = { r: 255, g: 206, b: 134 };
  const jetpackFlameLightColor = { r: 255, g: 218, b: 84 };
  const dynamicLightingMaxAlpha = 0.115;
  const gadgetGatherCache = {
    frameId: -1,
    limit: 0,
    targets: []
  };
  const mapBodyCache = {
    frameId: -1,
    sourceCount: -1,
    bodies: []
  };
  const hudCache = {
    progressFrameId: -1000,
    progressParticleCount: -1,
    progressLandedBodyId: null,
    progressEquippedToolId: "",
    progressSnapshot: null,
    leaderboardFrameId: -1000
  };
  let dynamicLightingPlayerBoost = 1;
  let dynamicLightingPlayerBoostTime = 0;
  const jetpackDirectionSmoothing = 7.6;
  const localJetpackExhaust = {
    x: 0,
    y: 1,
    angle: Math.PI / 2,
    time: 0
  };
  const remoteJetpackExhausts = new Map();
  const smokeTrailStates = new Map();

  function invalidateRenderCaches() {
    mapBodyCache.frameId = -1;
    mapBodyCache.sourceCount = -1;
    mapBodyCache.bodies = [];
    hudCache.progressFrameId = -1000;
    hudCache.progressParticleCount = -1;
    hudCache.progressLandedBodyId = null;
    hudCache.progressEquippedToolId = "";
    hudCache.progressSnapshot = null;
    hudCache.leaderboardFrameId = -1000;
    gadgetGatherCache.frameId = -1;
    gadgetGatherCache.limit = 0;
    gadgetGatherCache.targets = [];
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#06102d");
    gradient.addColorStop(0.5, "#080716");
    gradient.addColorStop(1, "#101234");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    const backgroundReach = Math.hypot(width, height) / Math.max(0.001, cameraZoom) + 240;
    ctx.fillStyle = "rgba(1, 3, 12, 0.18)";
    ctx.fillRect(player.x - backgroundReach, player.y - backgroundReach, backgroundReach * 2, backgroundReach * 2);

    for (const star of starDust) {
      const wrap = 7200;
      let x = star.x + Math.round((player.x - star.x) / wrap) * wrap;
      let y = star.y + Math.round((player.y - star.y) / wrap) * wrap;
      ctx.beginPath();
      ctx.fillStyle = "rgba(236, 247, 255, " + star.a + ")";
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawParticles(time) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.rotate(cameraRoll);
    ctx.translate(-player.x, -player.y);

    ctx.globalCompositeOperation = "lighter";

    for (const spark of sparks) {
      if (!isWorldCircleNearView(spark.x, spark.y, spark.radius, 220)) {
        continue;
      }
      const progress = 1 - spark.life / spark.maxLife;
      ctx.beginPath();
      if (spark.empPulse) {
        ctx.strokeStyle = colorString(spark.color, 0.62 * (1 - progress));
        ctx.lineWidth = 4.5 + (1 - progress) * 3;
        ctx.arc(spark.x, spark.y, spark.radius * clamp(progress, 0.04, 1), 0, Math.PI * 2);
      } else if (spark.promotionBurst) {
        const pulse = Math.sin(progress * Math.PI);
        ctx.strokeStyle = colorString(shadeColor(spark.color, 86), 0.5 * (1 - progress));
        ctx.lineWidth = 4 + pulse * 3;
        ctx.arc(spark.x, spark.y, spark.radius * (0.38 + progress * 0.82), 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = colorString(spark.color, 0.22 * (1 - progress));
        ctx.lineWidth = 1.8;
        ctx.arc(spark.x, spark.y, spark.radius * (0.76 + progress * 0.38), 0, Math.PI * 2);
      } else if (spark.summonTelegraph) {
        const pulse = 0.72 + Math.sin(performance.now() * 0.018) * 0.18;
        ctx.strokeStyle = colorString(spark.color, (0.5 + pulse * 0.2) * (1 - progress));
        ctx.lineWidth = 3.5;
        ctx.arc(spark.x, spark.y, spark.radius * (0.92 + progress * 0.08), 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = colorString(shadeColor(spark.color, 70), 0.28 * (1 - progress));
        ctx.lineWidth = 1.8;
        ctx.arc(spark.x, spark.y, spark.radius * 0.55 * (0.9 + pulse * 0.12), 0, Math.PI * 2);
      } else {
        ctx.strokeStyle = colorString(spark.color, 0.36 * (1 - progress));
        ctx.lineWidth = 2.5;
        ctx.arc(spark.x, spark.y, spark.radius * (0.65 + progress), 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    for (const particle of particles) {
      if (!isWorldCircleNearView(particle.x, particle.y, particle.radius, 340)) {
        continue;
      }
      drawBody(particle, time);
    }

    ctx.globalCompositeOperation = "source-over";
    drawSpacecrafts(time);

    for (const pickup of healthPickups) {
      if (!isWorldCircleNearView(pickup.x, pickup.y, 42, 180)) {
        continue;
      }
      drawHealthPickup(pickup, time);
    }
    for (const pickup of techPickups) {
      if (!isWorldCircleNearView(pickup.x, pickup.y, 42, 180)) {
        continue;
      }
      drawTechPickup(pickup, time);
    }

    ctx.restore();
  }

  function dynamicLightingEnabled() {
    return gameSettings.dynamicLighting !== false;
  }

  function normalizeDynamicLightColor(color, fallback) {
    if (
      color &&
      Number.isFinite(Number(color.r)) &&
      Number.isFinite(Number(color.g)) &&
      Number.isFinite(Number(color.b))
    ) {
      return {
        r: clamp(Math.round(Number(color.r)), 0, 255),
        g: clamp(Math.round(Number(color.g)), 0, 255),
        b: clamp(Math.round(Number(color.b)), 0, 255)
      };
    }

    if (typeof color === "string") {
      const match = color.trim().match(/^#([0-9a-f]{6})$/i);
      if (match) {
        const value = parseInt(match[1], 16);
        return {
          r: (value >> 16) & 255,
          g: (value >> 8) & 255,
          b: value & 255
        };
      }
    }

    return fallback || dynamicLightingWarmColor;
  }

  function dynamicLightTint(color, warmth) {
    const base = normalizeDynamicLightColor(color, dynamicLightingWarmColor);
    const warmWeight = clamp(Number(warmth) || 0.78, 0, 1);
    const sourceWeight = 1.12 - warmWeight * 0.72;
    return mixColor(base, dynamicLightingWarmColor, sourceWeight, warmWeight);
  }

  function drawScreenDynamicLight(x, y, radius, color, alpha, coreRatio) {
    const lightRadius = Math.max(1, finiteOr(radius, 0));
    if (
      x + lightRadius < 0 ||
      x - lightRadius > width ||
      y + lightRadius < 0 ||
      y - lightRadius > height
    ) {
      return false;
    }

    const lightAlpha = clamp(finiteOr(alpha, 0), 0, dynamicLightingMaxAlpha);
    if (lightAlpha <= 0) {
      return false;
    }

    const core = clamp(finiteOr(coreRatio, 0.12), 0.02, 0.38);
    const gradient = ctx.createRadialGradient(x, y, lightRadius * core, x, y, lightRadius);
    gradient.addColorStop(0, colorString(color, lightAlpha));
    gradient.addColorStop(0.38, colorString(color, lightAlpha * 0.38));
    gradient.addColorStop(1, colorString(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, lightRadius, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  function drawScreenDirectionalDynamicLight(x, y, dirX, dirY, length, widthSize, color, alpha) {
    const axisLength = Math.max(1, finiteOr(length, 0));
    const axisWidth = Math.max(1, finiteOr(widthSize, 0));
    const lightAlpha = clamp(finiteOr(alpha, 0), 0, dynamicLightingMaxAlpha);
    if (lightAlpha <= 0) {
      return false;
    }

    const lengthPadding = axisLength * 0.72;
    const widthPadding = axisWidth * 0.72;
    if (
      x + lengthPadding < 0 ||
      x - lengthPadding > width ||
      y + widthPadding < 0 ||
      y - widthPadding > height
    ) {
      return false;
    }

    const angle = Math.atan2(dirY || 1, dirX || 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(1, axisWidth / axisLength);
    const gradient = ctx.createRadialGradient(-axisLength * 0.36, 0, axisLength * 0.04, 0, 0, axisLength);
    gradient.addColorStop(0, colorString(color, lightAlpha));
    gradient.addColorStop(0.34, colorString(color, lightAlpha * 0.48));
    gradient.addColorStop(1, colorString(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, axisLength, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }

  function drawWorldDynamicLight(x, y, worldRadius, color, alpha, options) {
    const screen = worldToScreen(x, y);
    const minRadius = options && Number.isFinite(options.minRadius) ? options.minRadius : 24;
    const maxRadius = options && Number.isFinite(options.maxRadius) ? options.maxRadius : 620;
    const warmth = options && Number.isFinite(options.warmth) ? options.warmth : 0.82;
    const core = options && Number.isFinite(options.core) ? options.core : 0.12;
    const radius = clamp(Math.max(1, finiteOr(worldRadius, 0)) * cameraZoom, minRadius, maxRadius);
    return drawScreenDynamicLight(screen.x, screen.y, radius, dynamicLightTint(color, warmth), alpha, core);
  }

  function localGadgetModeForRender() {
    if (isMultiplayerV2Active()) {
      return multiplayerLocalToolModeForInput(renderPerformance.lastFrameDt || 1 / 60);
    }
    if (!canUseSuctionControls()) {
      return "idle";
    }
    if (mouse.middle) {
      return "hold";
    }
    if (mouse.left) {
      return "pull";
    }
    if (mouse.right) {
      return "push";
    }
    return "idle";
  }

  function localGadgetGatherState(aim) {
    const mode = localGadgetModeForRender();
    if (!aim || mode !== "pull") {
      return null;
    }

    return {
      actor: player,
      aimWorld: aim.world,
      funnel: getFunnel(aim),
      left: true,
      middle: false,
      right: false,
      suckFactor: currentGadgetSuckFactor(),
      rangeFactor: currentGadgetRangeFactor(),
      bucketActive: true,
      bucketPadding: 0,
      landedBodyId: player.landed ? player.landed.bodyId : null
    };
  }

  function activeGadgetGatherTargets(aim, limit) {
    const state = localGadgetGatherState(aim);
    if (!state) {
      gadgetGatherCache.frameId = -1;
      gadgetGatherCache.limit = 0;
      gadgetGatherCache.targets = [];
      return [];
    }

    const targetLimit = Math.max(1, Math.floor(finiteOr(limit, 1)));
    const gatherLimit = Math.max(targetLimit, 12);
    const frameId = currentRenderFrameId();
    if (gadgetGatherCache.frameId === frameId && gadgetGatherCache.limit >= targetLimit) {
      return gadgetGatherCache.targets.slice(0, targetLimit);
    }

    const gathered = [];
    for (const particle of particles) {
      if (!particle || !particle.color || !partyGadgetCanAffectParticle(state, particle)) {
        continue;
      }
      if (!isWorldCircleNearView(particle.x, particle.y, particle.radius, gadgetForceReachForState(state) + 220)) {
        continue;
      }

      const probe = partyGadgetParticleProbe(state, particle, { padding: 0 });
      if (!probe.force && !probe.bucket) {
        continue;
      }

      const sizeBias = Math.max(0, finiteOr(particle.radius, 0)) * 0.85;
      const score = (probe.bucket ? probe.score * 0.35 : probe.score + 84) + sizeBias;
      if (gathered.length < gatherLimit) {
        gathered.push({ particle, score, bucket: probe.bucket });
      } else {
        let worstIndex = 0;
        for (let i = 1; i < gathered.length; i += 1) {
          if (gathered[i].score > gathered[worstIndex].score) {
            worstIndex = i;
          }
        }
        if (score < gathered[worstIndex].score) {
          gathered[worstIndex] = { particle, score, bucket: probe.bucket };
        }
      }
    }

    gathered.sort((a, b) => a.score - b.score);
    gadgetGatherCache.frameId = frameId;
    gadgetGatherCache.limit = gatherLimit;
    gadgetGatherCache.targets = gathered;
    return gathered.slice(0, targetLimit);
  }

  function activeGadgetGatherColor(aim) {
    const targets = activeGadgetGatherTargets(aim, 1);
    return targets.length ? targets[0].particle.color : null;
  }

  function drawParticleDynamicLights(time) {
    let smallLights = 0;
    const smallLightLimit = Math.round(16 + renderQuality() * 34);

    for (const particle of particles) {
      if (!particle || !particle.tier) {
        continue;
      }
      if (!isWorldCircleNearView(particle.x, particle.y, particle.radius, 700)) {
        continue;
      }

      const pulse = 0.9 + Math.sin(time * 0.004 * particle.pulse + particle.id) * 0.1;
      if (particle.tier.name === "particle") {
        if (smallLights >= smallLightLimit) {
          continue;
        }

        const particleRadius = 44 + particle.radius * 2.4;
        if (drawWorldDynamicLight(particle.x, particle.y, particleRadius, particle.color, 0.034 * pulse, {
          minRadius: 20,
          maxRadius: 92,
          warmth: 0.9,
          core: 0.1
        })) {
          smallLights += 1;
        }
        continue;
      }

      const tierName = particle.tier.name;
      const tierScale = tierName === "star" ? 6.4 : tierName === "planet" ? 4.7 : tierName === "moon" ? 4.4 : tierName === "asteroid" ? 3.8 : 3.25;
      const tierAlpha = tierName === "star" ? 0.11 : tierName === "planet" ? 0.066 : tierName === "moon" ? 0.058 : tierName === "asteroid" ? 0.046 : 0.038;
      drawWorldDynamicLight(particle.x, particle.y, particle.radius * tierScale + 80, particle.color, tierAlpha * pulse, {
        minRadius: 56,
        maxRadius: tierName === "star" ? 960 : tierName === "planet" ? 680 : 540,
        warmth: tierName === "star" ? 0.96 : 0.78,
        core: tierName === "star" ? 0.24 : 0.16
      });
    }
  }

  function drawSparkDynamicLights() {
    let drawn = 0;
    const lightLimit = Math.round(10 + renderQuality() * 22);
    for (const spark of sparks) {
      if (drawn >= lightLimit) {
        return;
      }
      if (!isWorldCircleNearView(spark.x, spark.y, spark.radius, 260)) {
        continue;
      }

      const lifePct = clamp(finiteOr(spark.life, 0) / Math.max(0.001, finiteOr(spark.maxLife, 1)), 0, 1);
      if (drawWorldDynamicLight(spark.x, spark.y, spark.radius * 4.8 + 24, spark.color, 0.085 * lifePct, {
        minRadius: 28,
        maxRadius: 210,
        warmth: 0.18,
        core: 0.08
      })) {
        drawn += 1;
      }
    }
  }

  function drawPickupDynamicLights(time) {
    for (const pickup of healthPickups) {
      if (!isWorldCircleNearView(pickup.x, pickup.y, 96, 240)) {
        continue;
      }
      const fade = clamp(Math.min(finiteOr(pickup.life, 0), 1.6) / 1.6, 0, 1);
      const bob = Math.sin(time * 0.006 + pickup.wobble) * 2.5;
      drawWorldDynamicLight(pickup.x, pickup.y + bob, 96, { r: 123, g: 255, b: 173 }, 0.044 * fade, {
        minRadius: 36,
        maxRadius: 124,
        warmth: 0.68,
        core: 0.08
      });
    }

    for (const pickup of techPickups) {
      if (!isWorldCircleNearView(pickup.x, pickup.y, 104, 240)) {
        continue;
      }
      const fade = clamp(Math.min(finiteOr(pickup.life, 0), 1.8) / 1.8, 0, 1);
      const bob = Math.sin(time * 0.0065 + pickup.wobble) * 3;
      drawWorldDynamicLight(pickup.x, pickup.y + bob, 104, pickup.color, 0.04 * fade, {
        minRadius: 36,
        maxRadius: 132,
        warmth: 0.76,
        core: 0.08
      });
    }
  }
