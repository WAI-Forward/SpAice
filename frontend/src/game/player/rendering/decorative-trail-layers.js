  function drawWaterStreamTrailOn(targetCtx, livePuffs, time) {
    const centerPoints = smoothedTrailPoints(trailCenterlinePoints(livePuffs, 14), 4);
    if (centerPoints.length < 2) {
      return;
    }
    const nozzleGroups = trailPuffGroupsByNozzle(livePuffs);
    const streamGroups = nozzleGroups.length > 0 ? nozzleGroups : [orderedTrailPuffs(livePuffs, 0.02)];
    targetCtx.save();
    targetCtx.globalCompositeOperation = "lighter";

    for (let index = 0; index < centerPoints.length; index += 1) {
      const point = centerPoints[index];
      const t = clamp(trailPointT(point), 0, 1);
      const normal = trailNormalAtPoint(centerPoints, index);
      const side = Math.sin(time * 0.006 + index * 1.4) * (1.8 + t * 4.5);
      const radius = 10 + Math.sin(time * 0.004 + index) * 1.8 + Math.sin(t * Math.PI) * 14;
      const fade = clamp((1 - t) * 1.2, 0, 1);
      const x = trailPointX(point) + normal.x * side;
      const y = trailPointY(point) + normal.y * side;
      const mist = targetCtx.createRadialGradient(x, y, 0, x, y, radius);
      mist.addColorStop(0, "rgba(194, 252, 255, " + (0.12 * fade) + ")");
      mist.addColorStop(0.48, "rgba(66, 207, 255, " + (0.13 * fade) + ")");
      mist.addColorStop(1, "rgba(10, 112, 200, 0)");
      targetCtx.fillStyle = mist;
      targetCtx.beginPath();
      targetCtx.arc(x, y, radius, 0, Math.PI * 2);
      targetCtx.fill();
    }

    for (let groupIndex = 0; groupIndex < streamGroups.length; groupIndex += 1) {
      const points = smoothedTrailPoints(trailCenterlinePoints(streamGroups[groupIndex], 12), 4);
      if (points.length < 2) {
        continue;
      }
      const lanePhase = groupIndex * Math.PI + time * 0.001;
      drawWaterStreamStrokeOn(targetCtx, points, time, {
        sourceWidth: 8.5,
        midWidth: 8.2,
        tailWidth: 2.2,
        wave: 1.6,
        phase: lanePhase,
        colorFn: function (t, fade) {
          return rgbaColor(20, 120, 205, (0.18 + Math.sin(t * Math.PI) * 0.1) * fade);
        }
      });
      drawWaterStreamStrokeOn(targetCtx, points, time, {
        sourceWidth: 5.8,
        midWidth: 5.2,
        tailWidth: 1.3,
        wave: 1.05,
        phase: lanePhase + 0.9,
        colorFn: function (t, fade) {
          return rgbaColor(58, 205, 255, (0.44 + Math.sin(t * Math.PI) * 0.16) * fade);
        }
      });
      drawWaterStreamStrokeOn(targetCtx, points, time, {
        sourceWidth: 2.2,
        midWidth: 2.1,
        tailWidth: 0.6,
        wave: 0.74,
        offset: groupIndex % 2 === 0 ? -2.4 : 2.4,
        phase: lanePhase + 2.3,
        colorFn: function (t, fade) {
          return rgbaColor(235, 255, 255, (0.52 + Math.sin(t * Math.PI * 2 - time * 0.016) * 0.08) * fade);
        }
      });
      drawWaterStreamStrokeOn(targetCtx, points, time, {
        sourceWidth: 1.2,
        midWidth: 1.1,
        tailWidth: 0.4,
        wave: 1.2,
        offset: groupIndex % 2 === 0 ? 2.7 : -2.7,
        phase: lanePhase + 4.1,
        colorFn: function (t, fade) {
          return rgbaColor(156, 239, 255, (0.34 + trailSeedNoise(groupIndex + 3, t * 7) * 0.16) * fade);
        }
      });
    }

    drawWaterStreamStrokeOn(targetCtx, centerPoints, time, {
      sourceWidth: 3.2,
      midWidth: 3,
      tailWidth: 0.8,
      wave: 2.8,
      phase: time * 0.004 + 1.6,
      colorFn: function (t, fade) {
        return rgbaColor(182, 248, 255, 0.22 * fade);
      }
    });

    for (let index = 1; index < centerPoints.length; index += 2) {
      const point = centerPoints[index];
      const normal = trailNormalAtPoint(centerPoints, index);
      const t = clamp(trailPointT(point), 0, 1);
      const fade = clamp((1 - t) * 1.18, 0, 1);
      if (fade <= 0.02) {
        continue;
      }
      const foamSize = 1.6 + Math.sin(t * Math.PI) * 2.8 + trailSeedNoise(index, time * 0.001) * 2.2;
      const side = (trailSeedNoise(index, 3.2) - 0.5) * (8 + Math.sin(t * Math.PI) * 12);
      const foamX = trailPointX(point) + normal.x * side + Math.sin(time * 0.01 + index) * 1.2;
      const foamY = trailPointY(point) + normal.y * side;
      targetCtx.fillStyle = "rgba(231, 255, 255, " + (0.32 * fade) + ")";
      targetCtx.beginPath();
      targetCtx.arc(foamX, foamY, foamSize, 0, Math.PI * 2);
      targetCtx.fill();
      if (trailSeedNoise(index, 7.9) > 0.58) {
        targetCtx.strokeStyle = "rgba(235, 255, 255, " + (0.24 * fade) + ")";
        targetCtx.lineWidth = 0.9;
        targetCtx.beginPath();
        targetCtx.arc(foamX, foamY, foamSize * (1.7 + trailSeedNoise(index, 8.8)), time * 0.004, time * 0.004 + Math.PI * 1.35);
        targetCtx.stroke();
      }
    }
    targetCtx.restore();
  }

  function drawRainbowRibbonTrailOn(targetCtx, livePuffs, time) {
    const points = trailCenterlinePoints(livePuffs, 12);
    if (points.length < 2) {
      return;
    }
    const colors = [
      "rgba(255, 39, 32, 0.9)",
      "rgba(255, 143, 32, 0.9)",
      "rgba(255, 232, 54, 0.92)",
      "rgba(84, 240, 70, 0.9)",
      "rgba(53, 168, 255, 0.9)",
      "rgba(142, 84, 255, 0.9)"
    ];
    const bandWidth = 4.6;
    targetCtx.save();
    targetCtx.globalCompositeOperation = "source-over";
    drawTrailCurveOn(targetCtx, points, bandWidth * 7.2, "rgba(5, 10, 32, 0.18)", { lineCap: "butt", lineJoin: "miter" });
    for (let band = 0; band < colors.length; band += 1) {
      drawTrailCurveOn(targetCtx, points, bandWidth, colors[band], {
        offset: (band - (colors.length - 1) / 2) * bandWidth,
        lineCap: "butt",
        lineJoin: "miter"
      });
    }
    targetCtx.globalCompositeOperation = "lighter";
    for (let index = 1; index < points.length; index += 4) {
      const point = points[index];
      const normal = trailNormalAtPoint(points, index);
      const side = (trailSeedNoise(index, 4.2) > 0.5 ? 1 : -1) * (22 + trailSeedNoise(index, 5.1) * 18);
      drawPixelSparkOn(
        targetCtx,
        point.x + normal.x * side + Math.sin(time * 0.002 + index) * 3,
        point.y + normal.y * side,
        2.2 + trailSeedNoise(index, 6.4) * 1.4,
        0.5
      );
    }
    targetCtx.restore();
  }

  function drawPlasmaWaveTrailOn(targetCtx, livePuffs, time) {
    const points = trailCenterlinePoints(livePuffs, 13);
    if (points.length < 2) {
      return;
    }
    targetCtx.save();
    targetCtx.globalCompositeOperation = "lighter";
    drawTrailCurveOn(targetCtx, points, 18, "rgba(80, 230, 255, 0.16)", { wave: 8, phase: time * 0.008 });
    drawTrailCurveOn(targetCtx, points, 5.4, "rgba(118, 245, 255, 0.66)", { wave: 8.5, phase: time * 0.011 });
    drawTrailCurveOn(targetCtx, points, 4.4, "rgba(255, 112, 255, 0.58)", { wave: -7, phase: time * 0.012 + Math.PI });
    drawTrailCurveOn(targetCtx, points, 2.1, "rgba(255, 255, 255, 0.74)", { wave: 4.5, phase: time * 0.018 + 0.7 });
    for (let index = 1; index < points.length; index += 3) {
      const point = points[index];
      const normal = trailNormalAtPoint(points, index);
      const ringRadius = 5 + trailSeedNoise(index, time * 0.001) * 7;
      targetCtx.strokeStyle = "rgba(255, 140, 255, 0.28)";
      targetCtx.lineWidth = 1.2;
      targetCtx.beginPath();
      targetCtx.ellipse(point.x + normal.x * ringRadius * 0.8, point.y + normal.y * ringRadius * 0.8, ringRadius * 1.2, ringRadius * 0.52, time * 0.006 + index, 0, Math.PI * 2);
      targetCtx.stroke();
    }
    targetCtx.restore();
  }

  function drawMagicSparkTrailOn(targetCtx, livePuffs, time) {
    const points = trailCenterlinePoints(livePuffs, 12);
    if (points.length < 2) {
      return;
    }
    targetCtx.save();
    targetCtx.globalCompositeOperation = "lighter";
    drawTrailCurveOn(targetCtx, points, 14, "rgba(169, 133, 255, 0.12)", { wave: 6, phase: time * 0.004 });
    drawTrailCurveOn(targetCtx, points, 2.6, "rgba(255, 228, 255, 0.36)", { wave: 3, phase: time * 0.009 + 1.1 });
    for (let index = 0; index < points.length; index += 2) {
      const point = points[index];
      const normal = trailNormalAtPoint(points, index);
      const side = (trailSeedNoise(index, 2.4) - 0.5) * 28;
      const hue = 268 + trailSeedNoise(index, 8.4) * 88;
      drawMagicLightSparkOn(
        targetCtx,
        point.x + normal.x * side,
        point.y + normal.y * side,
        2.4 + trailSeedNoise(index, 9.7) * 4.6,
        0.45 + trailSeedNoise(index, time * 0.001) * 0.36,
        hue
      );
    }
    targetCtx.restore();
  }

  function drawDecorativeTrailLayerOn(targetCtx, style, livePuffs, time) {
    if (!style || !Array.isArray(livePuffs) || livePuffs.length < 2) {
      return;
    }
    switch (style.type) {
      case "water":
        drawWaterStreamTrailOn(targetCtx, livePuffs, time);
        break;
      case "magic":
        drawMagicSparkTrailOn(targetCtx, livePuffs, time);
        break;
      case "rainbow":
        drawRainbowRibbonTrailOn(targetCtx, livePuffs, time);
        break;
      case "plasma":
        drawPlasmaWaveTrailOn(targetCtx, livePuffs, time);
        break;
      case "bats":
        drawBatBackdropTrailOn(targetCtx, livePuffs, time);
        break;
      default:
        break;
    }
  }

  function drawDecorativeTrailParticleOn(targetCtx, style, puff, time) {
    const x = finiteOr(puff.renderX, 0);
    const y = finiteOr(puff.renderY, 0);
    const size = Math.max(1, finiteOr(puff.renderRadius, 5));
    const alpha = clamp(finiteOr(puff.renderAlpha, 0), 0, 1);
    if (alpha <= 0) {
      return;
    }

    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(finiteOr(puff.rotation, 0) + finiteOr(puff.spinSpeed, 0) * time * 0.001);
    switch (style.type) {
      case "water":
        drawWaterTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "magic":
        drawMagicTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "rainbow":
        drawRainbowTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "plasma":
        drawPlasmaTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "snow":
        drawSnowTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "bats":
        drawBatTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "hearts":
        drawHeartTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      case "flowers":
        drawFlowerTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
      default:
        drawRainbowTrailParticleOn(targetCtx, size, alpha, finiteOr(puff.seed, 0), time, puff);
        break;
    }
    targetCtx.restore();
  }

  function emitDecorativeTrailParticle(state, style, nozzleX, nozzleY, dirAngle, boostAmount, birthTime) {
    const seed = state.nextSeed || 1;
    state.nextSeed = seed + 1;
    const dirX = Math.cos(dirAngle);
    const dirY = Math.sin(dirAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const baseRadius = finiteOr(style.radius, 6);
    const seedA = Math.sin(seed * 12.9898);
    const seedB = Math.sin(seed * 7.233);
    const scaleMin = finiteOr(style.scaleMin, 0.5);
    const scaleMax = Math.max(scaleMin, finiteOr(style.scaleMax, 1.55));
    const scaleNoise = trailSeedNoise(seed, 0.43);
    const particleScale = scaleMin + (scaleMax - scaleMin) * scaleNoise;
    const sideOffset = (seedA * 0.5 + Math.sin(seed * 4.1414) * 0.5) * (5 + boostAmount * 4);
    const forwardOffset = 6 + boostAmount * 4 + Math.abs(Math.sin(seed * 1.97)) * 5;
    const sideBias = nozzleX < 0 ? -5 : 5;

    state.puffs.push({
      birthTime,
      life: finiteOr(style.life, 840) * (0.88 + Math.abs(Math.sin(seed * 3.712)) * 0.28),
      nozzleX,
      x: nozzleX + dirX * forwardOffset + normalX * sideOffset,
      y: nozzleY + dirY * forwardOffset + normalY * sideOffset,
      dirX,
      dirY,
      normalX,
      normalY,
      sideSpeed: seedB * finiteOr(style.sideSpeed, 26) + sideBias,
      speed: finiteOr(style.speed, 88) + boostAmount * 42 + Math.abs(Math.sin(seed * 5.31)) * 24,
      radius: baseRadius * particleScale * (0.92 + Math.abs(Math.sin(seed * 2.57)) * 0.22),
      boostAmount,
      rotation: dirAngle + Math.PI / 2 + Math.sin(seed * 5.71) * 0.65,
      spinSpeed: Math.sin(seed * 3.47) * (style.type === "bats" ? 2.6 : 1.8),
      variant: Math.floor(trailSeedNoise(seed, 1.92) * 4),
      particleScale,
      seed
    });

    if (state.puffs.length > 190) {
      state.puffs.splice(0, state.puffs.length - 190);
    }
  }

  function emitDecorativeTrailParticles(state, style, time, exhaust, boostAmount) {
    const emitInterval = Math.max(34, finiteOr(style.emitInterval, 54));
    const nozzleY = 43;
    const exhaustDir = Math.atan2(finiteOr(exhaust.y, 1), finiteOr(exhaust.x, 0));
    let emittedSteps = 0;

    while (state.lastEmitTime + emitInterval <= time && emittedSteps < 7) {
      state.lastEmitTime += emitInterval;
      for (const nozzleX of [-17, 17]) {
        const splay = nozzleX < 0 ? -0.13 : 0.13;
        emitDecorativeTrailParticle(state, style, nozzleX, nozzleY, exhaustDir + splay, boostAmount, state.lastEmitTime);
      }
      emittedSteps += 1;
    }

    if (emittedSteps >= 7 && state.lastEmitTime + emitInterval < time) {
      state.lastEmitTime = time;
    }
  }

  function drawDecorativeTrailParticlesOn(targetCtx, state, style, time, boostAmount) {
    const livePuffs = [];
    for (const puff of state.puffs) {
      const age = time - finiteOr(puff.birthTime, time);
      const life = Math.max(1, finiteOr(puff.life, finiteOr(style.life, 850)));
      const t = clamp(age / life, 0, 1);
      const puffBoost = clamp(finiteOr(puff.boostAmount, boostAmount), 0, 1);
      if (t >= 1) {
        continue;
      }
      const ageSeconds = Math.max(0, age) / 1000;
      const fadeIn = clamp(t * 6.4, 0, 1);
      const fadeOut = clamp((1 - t) * 1.34, 0, 1);
      const alpha = finiteOr(style.alpha, 0.82) * (0.74 + puffBoost * 0.2) * fadeIn * Math.pow(fadeOut, style.type === "bats" ? 0.88 : 0.62);
      if (alpha < 0.018) {
        puff.renderAlpha = 0;
        livePuffs.push(puff);
        continue;
      }
      const seed = finiteOr(puff.seed, 0);
      const wave = Math.sin(time * 0.0034 + seed * 1.77);
      const curlBase = style.type === "water" ? 4 : style.type === "bats" ? 24 : style.type === "snow" ? 17 : style.type === "flowers" ? 19 : 13;
      let curl = wave * (2 + t * curlBase);
      let distance = 4 + finiteOr(puff.speed, 86) * ageSeconds + t * t * (22 + puffBoost * 16);
      let side = finiteOr(puff.sideSpeed, 0) * ageSeconds + curl;
      let lift = 0;

      if (style.type === "water") {
        side = side * 0.76 + Math.sin(ageSeconds * 10 + seed) * (0.7 + t * 1.7);
        distance += Math.sin(ageSeconds * 9 + seed * 0.7) * (0.45 + t * 0.75);
      } else if (style.type === "magic") {
        side += Math.sin(ageSeconds * 7 + seed * 1.4) * (7 + t * 8);
        lift = Math.cos(ageSeconds * 5 + seed) * (2 + t * 5);
      } else if (style.type === "rainbow") {
        side += Math.sin(ageSeconds * 8 + seed) * (5 + t * 9);
      } else if (style.type === "plasma") {
        side += Math.sin(ageSeconds * 18 + seed * 2) * (3 + t * 7);
        distance += Math.sin(ageSeconds * 22 + seed) * (2 + t * 6);
      } else if (style.type === "snow") {
        distance *= 0.88;
        side += Math.sin(ageSeconds * 4.2 + seed) * (8 + t * 14);
        lift = -t * t * 10;
      } else if (style.type === "bats") {
        side += Math.sin(ageSeconds * 15 + seed) * (12 + t * 20);
        lift = Math.cos(ageSeconds * 11 + seed) * (4 + t * 10);
      } else if (style.type === "hearts") {
        side += Math.sin(ageSeconds * 5 + seed) * (8 + t * 12);
        lift = -t * t * (10 + finiteOr(puff.particleScale, 1) * 4);
      } else if (style.type === "flowers") {
        side += Math.sin(ageSeconds * 6.5 + seed) * (9 + t * 15);
        lift = Math.cos(ageSeconds * 5 + seed) * (3 + t * 7);
      }

      livePuffs.push(puff);
      puff.renderT = t;
      puff.renderX = finiteOr(puff.x, 0) + finiteOr(puff.dirX, 0) * distance + finiteOr(puff.normalX, 0) * side;
      puff.renderY = finiteOr(puff.y, 0) + finiteOr(puff.dirY, 0) * distance + finiteOr(puff.normalY, 0) * side + lift;
      puff.renderRadius = finiteOr(puff.radius, 6) * (1 + t * finiteOr(style.growth, 0.2));
      puff.renderAlpha = alpha;
    }

    state.puffs = livePuffs;
    drawDecorativeTrailLayerOn(targetCtx, style, livePuffs, time);
    livePuffs.sort(function (a, b) {
      return finiteOr(b.renderT, 0) - finiteOr(a.renderT, 0);
    });
    for (const puff of livePuffs) {
      drawDecorativeTrailParticleOn(targetCtx, style, puff, time);
    }
  }

  function drawSmokeJetpackTrailOn(targetCtx, time, exhaust, boost, ownerKey, options) {
    const config = options && typeof options === "object" ? options : {};
    const shouldEmit = config.emit !== false;
    const shouldDrawFlame = config.drawFlame !== false;
    const boostAmount = clamp(finiteOr(boost, 0), 0, 1);
    const state = smokeTrailStateForKey(ownerKey, time, "trail-smoke");
    if (shouldEmit) {
      emitSmokeTrailPuffs(state, time, exhaust, boostAmount);
    } else {
      state.lastEmitTime = time - 62;
    }

    targetCtx.save();
    targetCtx.globalCompositeOperation = "source-over";
    drawSmokeTrailPuffsOn(targetCtx, state, time, boostAmount);
    targetCtx.restore();
    pruneSmokeTrailStates(time);
    if (shouldDrawFlame) {
      drawClassicJetpackFlamePlumesOn(targetCtx, time, exhaust, 0.24 + boostAmount * 0.16);
    }
  }

  function drawDecorativeJetpackTrailOn(targetCtx, time, exhaust, boost, trailId, ownerKey, options) {
    const style = decorativeBoostTrailStyleForId(trailId);
    if (!style) {
      drawClassicJetpackFlamePlumesOn(targetCtx, time, exhaust, boost);
      return;
    }

    const config = options && typeof options === "object" ? options : {};
    const shouldEmit = config.emit !== false;
    const shouldDrawFlame = config.drawFlame !== false;
    const boostAmount = clamp(finiteOr(boost, 0), 0, 1);
    const state = smokeTrailStateForKey(ownerKey, time, trailId);
    if (shouldEmit) {
      emitDecorativeTrailParticles(state, style, time, exhaust, boostAmount);
    } else {
      state.lastEmitTime = time - Math.max(34, finiteOr(style.emitInterval, 54));
    }

    targetCtx.save();
    targetCtx.globalCompositeOperation = "source-over";
    drawDecorativeTrailParticlesOn(targetCtx, state, style, time, boostAmount);
    targetCtx.restore();
    pruneSmokeTrailStates(time);
    if (shouldDrawFlame) {
      drawClassicJetpackFlamePlumesOn(
        targetCtx,
        time,
        exhaust,
        finiteOr(style.flameBase, 0.14) + boostAmount * finiteOr(style.flameScale, 0.1)
      );
    }
  }

