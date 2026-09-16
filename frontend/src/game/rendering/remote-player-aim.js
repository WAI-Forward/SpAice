  function remotePlayerVisualAimAngle(remotePlayer) {
    if (Number.isFinite(Number(remotePlayer.visualAimLocalAngle))) {
      return finiteOr(remotePlayer.visualAimLocalAngle, 0) - cameraRoll;
    }
    if (Number.isFinite(Number(remotePlayer.aimAngle))) {
      return finiteOr(remotePlayer.aimAngle, 0);
    }
    if (Number.isFinite(Number(remotePlayer.aimLocalAngle))) {
      return finiteOr(remotePlayer.aimLocalAngle, 0) - finiteOr(remotePlayer.cameraRoll, 0);
    }
    return Math.atan2(remotePlayer.vy || 0, remotePlayer.vx || 1);
  }

  function drawRemotePlayer(remotePlayer, publicName, time) {
    const quality = renderQuality();
    const aimAngle = remotePlayerVisualAimAngle(remotePlayer);
    const bodyRotation = remoteBodyRotation(remotePlayer);
    const bob = remotePlayerBob(remotePlayer, time);

    if (quality >= 0.58) {
      drawRemoteGadgetField(remotePlayer, aimAngle, time);
    }

    ctx.save();
    ctx.translate(remotePlayer.x, remotePlayer.y);
    ctx.shadowColor = "rgba(88, 226, 255, 0.42)";
    ctx.shadowBlur = quality >= 0.72 ? 18 : 0;
    drawRemoteAstronautSuit(remotePlayer, time, bob, bodyRotation);
    ctx.shadowBlur = 0;
    drawRemoteHeldArms(aimAngle, bob, bodyRotation, "back");
    drawRemoteTool(remotePlayer, aimAngle, bob, time);
    drawRemoteHeldArms(aimAngle, bob, bodyRotation, "front");
    ctx.restore();

    if (gameSettings.hudEnabled !== false) {
      const screen = worldToScreen(remotePlayer.x, remotePlayer.y);
      const pct = clamp(remotePlayer.health / Math.max(1, remotePlayer.maxHealth || 100), 0, 1);
      const energyPct = clamp(finiteOr(remotePlayer.energy, remotePlayer.maxEnergy || 100) / Math.max(1, finiteOr(remotePlayer.maxEnergy, 100)), 0, 1);
      const toolsDisabled = finiteOr(remotePlayer.toolDisabledTimer, 0) > 0;
      const label = publicName || remotePlayer.name || "Contact";
      const teammate = Boolean(isSharedPublicWorldActive() && multiplayer.sharedTeamId && remotePlayer.teamId === multiplayer.sharedTeamId);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgba(3, 8, 24, 0.62)";
      roundRectPath(screen.x - 37, screen.y - 91, 74, 8, 4);
      ctx.fill();
      ctx.fillStyle = pct > 0.55 ? "#61f59a" : pct > 0.28 ? "#f5d65b" : "#ff6262";
      roundRectPath(screen.x - 37, screen.y - 91, 74 * pct, 8, 4);
      ctx.fill();

      if (gameSettings.playerEnergyBar !== false && (energyPct < 0.995 || toolsDisabled)) {
        const energyColors = playerEnergyStatusBarColors(toolsDisabled, energyPct);
        drawPlayerStatusBar({
          x: screen.x - 37,
          y: screen.y + 72,
          width: 74,
          height: 8,
          pct: energyPct,
          alpha: 1,
          icon: "\u26a1",
          iconX: screen.x - 49,
          iconColor: energyColors.iconColor,
          glowColor: energyColors.glowColor,
          strokeColor: energyColors.strokeColor,
          fillStart: energyColors.fillStart,
          fillEnd: energyColors.fillEnd,
          blocked: toolsDisabled
        });
      }

      if (quality >= 0.64) {
        ctx.font = "800 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(3, 8, 24, 0.68)";
        const widthLabel = Math.min(160, ctx.measureText(label).width + 18);
        roundRectPath(screen.x - widthLabel / 2, screen.y - 120, widthLabel, 22, 8);
        ctx.fill();
        ctx.fillStyle = teammate ? "#9dff7a" : "#dffcff";
        ctx.fillText(label, screen.x, screen.y - 109, widthLabel - 10);
      }
      ctx.restore();

      if (quality >= 0.58) {
        drawRemoteInteractionBubble(remotePlayer, screen);
      }
    }
  }

  function drawRemoteInteractionBubble(remotePlayer, screen) {
    const emote = multiplayer.remoteEmotes.get(remotePlayer.id);
    if (!emote) {
      return;
    }

    const alpha = clamp(Math.min(1, emote.life / 0.45), 0, 1);
    const speech = emote.speech || emote.label || "";
    const symbol = emote.emote === "duel" ? "!" : emote.emote === "peace" ? "=" : emote.emote === "team" ? "+" : emote.emote === "leave" ? "-" : "$";
    const teamEmote = emote.emote === "team" || emote.emote === "leave";
    const y = screen.y - 154;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.font = "900 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bubbleWidth = Math.min(130, ctx.measureText(speech).width + 42);
    ctx.fillStyle = "rgba(3, 8, 24, 0.78)";
    ctx.strokeStyle = emote.emote === "duel" || emote.emote === "peace" ? "rgba(255, 229, 111, 0.72)" : teamEmote ? "rgba(157, 255, 122, 0.72)" : "rgba(88, 226, 255, 0.62)";
    ctx.lineWidth = 1.5;
    roundRectPath(screen.x - bubbleWidth / 2, y - 15, bubbleWidth, 30, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = emote.emote === "duel" || emote.emote === "peace" ? "#ffe56f" : teamEmote ? "#9dff7a" : "#58e2ff";
    ctx.fillText(symbol, screen.x - bubbleWidth / 2 + 17, y + 0.5, 18);
    ctx.fillStyle = "#f8fbff";
    ctx.fillText(speech, screen.x + 12, y + 0.5, bubbleWidth - 34);
    ctx.restore();
  }
