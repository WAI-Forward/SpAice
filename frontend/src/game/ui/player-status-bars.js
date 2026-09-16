  function playerStatusBarAlpha(state, value, variant, time) {
    const changed = state.value === null ||
      Math.abs(finiteOr(value, 0) - finiteOr(state.value, 0)) > 0.002 ||
      state.variant !== variant;

    if (changed) {
      state.value = value;
      state.variant = variant;
      state.changedAt = time;
      return 1;
    }

    const settleDelay = 1000;
    const fadeDuration = 650;
    const minAlpha = 0.42;
    const age = Math.max(0, time - finiteOr(state.changedAt, time));
    const fade = clamp((age - settleDelay) / fadeDuration, 0, 1);
    return 1 - fade * (1 - minAlpha);
  }

  function isLocalPlayerEnergyDisabled() {
    return hasPlayerStatusEffect("disabled");
  }

  function playerEnergyStatusBarColors(disabled, pct) {
    if (disabled) {
      return {
        iconColor: "rgba(255, 45, 58, 1)",
        glowColor: "rgba(255, 0, 24, 0.72)",
        strokeColor: "rgba(255, 45, 58, 0.92)",
        fillStart: "#ff1f2f",
        fillEnd: "#ff1f2f"
      };
    }
    return {
      iconColor: "rgba(157, 255, 122, 0.98)",
      glowColor: "rgba(157, 255, 122, 0.42)",
      strokeColor: "rgba(255, 255, 255, 0.18)",
      fillStart: pct > 0.35 ? "#86f66e" : "#f5d65b",
      fillEnd: pct > 0.35 ? "#b8ff8f" : "#ffe981"
    };
  }

  function drawPlayerStatusBar(options) {
    const pct = clamp(options.pct, 0, 1);
    const fillWidth = options.width * pct;
    const iconY = options.y + options.height * 0.5;

    ctx.save();
    ctx.globalAlpha *= clamp(options.alpha, 0, 1);
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = options.glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = options.iconColor;
    ctx.fillText(options.icon, options.iconX, iconY);

    if (options.blocked) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 31, 47, 0.98)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(options.iconX, iconY, 6.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(options.iconX - 4.6, iconY + 4.6);
      ctx.lineTo(options.iconX + 4.6, iconY - 4.6);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(2, 5, 14, 0.62)";
    roundRectPath(options.x - 1, options.y - 1, options.width + 2, options.height + 2, options.height * 0.5 + 1);
    ctx.fill();

    ctx.strokeStyle = options.strokeColor;
    ctx.lineWidth = 1;
    roundRectPath(options.x - 1, options.y - 1, options.width + 2, options.height + 2, options.height * 0.5 + 1);
    ctx.stroke();

    if (fillWidth > 0.5) {
      const fill = ctx.createLinearGradient(options.x, options.y, options.x + options.width, options.y);
      fill.addColorStop(0, options.fillStart);
      fill.addColorStop(1, options.fillEnd);
      ctx.fillStyle = fill;
      roundRectPath(options.x, options.y, fillWidth, options.height, options.height * 0.5);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawPlayerStatusBars(time) {
    if (gameSettings.hudEnabled === false) {
      return;
    }
    const showHealthBar = gameSettings.playerHealthBar !== false;
    const showEnergyBar = gameSettings.playerEnergyBar !== false;
    if (!showHealthBar && !showEnergyBar) {
      return;
    }

    const pct = clamp(player.health / player.maxHealth, 0, 1);
    const energyPct = playerEnergyPct();
    const energyDisabled = isLocalPlayerEnergyDisabled();
    const barWidth = 76;
    const barHeight = 8;
    const barX = width / 2 - barWidth / 2;
    const zoomedOutBarBlend = clamp(
      (cameraZoom - cameraZoomMin) / Math.max(0.001, cameraZoomDefault - cameraZoomMin),
      0,
      1
    );
    const healthOffset = 56 + (Math.max(110, 114 * cameraZoom) - 56) * zoomedOutBarBlend;
    const energyOffset = 64 + (Math.max(118, 126 * cameraZoom) - 64) * zoomedOutBarBlend;
    const healthY = height / 2 - healthOffset;
    const iconX = barX - 12;
    const drawTime = Number.isFinite(Number(time)) ? time : performance.now();
    const healthFullThreshold = 0.995;
    const healthFullHideDelay = 1100;
    const healthWasFull = playerStatusBarState.health.value === null ||
      finiteOr(playerStatusBarState.health.value, 1) >= healthFullThreshold;
    const healthIsFull = pct >= healthFullThreshold;

    if (healthIsFull) {
      if (!healthWasFull && playerStatusBarState.health.fullAt <= 0) {
        playerStatusBarState.health.fullAt = drawTime;
      }
    } else {
      playerStatusBarState.health.fullAt = 0;
    }

    const showFilledHealthBar = healthIsFull &&
      playerStatusBarState.health.fullAt > 0 &&
      drawTime - playerStatusBarState.health.fullAt < healthFullHideDelay;
    if (showHealthBar && (!healthIsFull || showFilledHealthBar)) {
      const healthAlpha = playerStatusBarAlpha(playerStatusBarState.health, pct, "health", drawTime);
      const healthLow = pct <= 0.28;
      const healthMid = pct > 0.28 && pct <= 0.55;
      drawPlayerStatusBar({
        x: barX,
        y: healthY,
        width: barWidth,
        height: barHeight,
        pct,
        alpha: healthAlpha,
        icon: "\u2665",
        iconX,
        iconColor: healthLow ? "rgba(255, 112, 112, 0.98)" : "rgba(255, 132, 146, 0.98)",
        glowColor: "rgba(255, 90, 112, 0.45)",
        strokeColor: "rgba(255, 255, 255, 0.18)",
        fillStart: healthLow ? "#ff6262" : healthMid ? "#f5d65b" : "#53e68d",
        fillEnd: healthLow ? "#ff9b76" : healthMid ? "#ffe981" : "#79f7a3"
      });
    }

    if (showEnergyBar && (energyPct < 0.995 || energyDisabled)) {
      const energyY = height / 2 + energyOffset;
      const energyVariant = energyDisabled ? "disabled" : energyPct > 0.35 ? "energy" : "energy-low";
      const energyAlpha = playerStatusBarAlpha(playerStatusBarState.energy, energyPct, energyVariant, drawTime);
      const energyColors = playerEnergyStatusBarColors(energyDisabled, energyPct);
      drawPlayerStatusBar({
        x: barX,
        y: energyY,
        width: barWidth,
        height: barHeight,
        pct: energyPct,
        alpha: energyAlpha,
        icon: "\u26a1",
        iconX,
        iconColor: energyColors.iconColor,
        glowColor: energyColors.glowColor,
        strokeColor: energyColors.strokeColor,
        fillStart: energyColors.fillStart,
        fillEnd: energyColors.fillEnd,
        blocked: energyDisabled
      });
    }
  }

  function drawPlayerHealthBar(time) {
    drawPlayerStatusBars(time);
    return;

    if (gameSettings.hudEnabled === false) {
      return;
    }
    const showHealthBar = gameSettings.playerHealthBar !== false;
    const showEnergyBar = gameSettings.playerEnergyBar !== false;
    if (!showHealthBar && !showEnergyBar) {
      return;
    }

    const pct = clamp(player.health / player.maxHealth, 0, 1);
    const energyPct = playerEnergyPct();
    const barWidth = 74;
    const barHeight = 8;
    const barX = width / 2 - barWidth / 2;
    const healthY = height / 2 - 86 * cameraZoom;
    const iconX = barX - 11;

    ctx.save();
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (showHealthBar) {
      ctx.fillStyle = "rgba(255, 132, 146, 0.96)";
      ctx.fillText("♥", iconX, healthY + barHeight * 0.5);

      ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
      roundRectPath(barX, healthY, barWidth, barHeight, 4);
      ctx.fill();
      ctx.fillStyle = pct > 0.55 ? "#61f59a" : pct > 0.28 ? "#f5d65b" : "#ff6262";
      roundRectPath(barX, healthY, barWidth * pct, barHeight, 4);
      ctx.fill();
    }

    if (showEnergyBar && energyPct < 0.995) {
      const energyY = height / 2 + 82 * cameraZoom;
      ctx.fillStyle = "rgba(157, 255, 122, 0.96)";
      ctx.fillText("⚡", iconX, energyY + barHeight * 0.5);
      ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
      roundRectPath(barX, energyY, barWidth, barHeight, 4);
      ctx.fill();
      ctx.fillStyle = energyPct > 0.35 ? "#9dff7a" : "#f5d65b";
      roundRectPath(barX, energyY, barWidth * energyPct, barHeight, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.74);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.52)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawDeathVignette() {
    const progress = clamp(deathState.timer / deathAnimationDuration, 0, 1);
    const pulse = Math.sin(progress * Math.PI);
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.78);
    gradient.addColorStop(0, "rgba(255, 98, 98, " + (0.06 + pulse * 0.1) + ")");
    gradient.addColorStop(0.46, "rgba(12, 8, 24, " + (0.18 + progress * 0.24) + ")");
    gradient.addColorStop(1, "rgba(0, 0, 0, " + (0.42 + progress * 0.4) + ")");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (progress < 0.82) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 98, 98, " + (0.48 * (1 - progress)) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 80 + progress * Math.max(width, height) * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

