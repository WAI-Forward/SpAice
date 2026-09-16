  function drawJetpackFlamePlumesOn(targetCtx, time, exhaust, boost, trailId, ownerKey, options) {
    const cleanTrailId = normalizedBoostTrailId(trailId);
    if (cleanTrailId === "trail-smoke") {
      drawSmokeJetpackTrailOn(targetCtx, time, exhaust, boost, ownerKey, options);
      return;
    }
    if (decorativeBoostTrailStyleForId(cleanTrailId)) {
      drawDecorativeJetpackTrailOn(targetCtx, time, exhaust, boost, cleanTrailId, ownerKey, options);
      return;
    }
    drawClassicJetpackFlamePlumesOn(targetCtx, time, exhaust, boost);
  }

  function drawJetpackFlamePlumes(time, exhaust, boost, trailId, ownerKey, options) {
    drawJetpackFlamePlumesOn(ctx, time, exhaust, boost, trailId, ownerKey, options);
  }

  function drawJetFlames(time) {
    const trailId = activeTrailId();
    const boosting = isJetpackBoostFlameActive(renderPerformance.lastFrameDt || 1 / 60);
    if (!boosting) {
      if (isStatefulBoostTrailId(trailId) && smokeTrailHasLivePuffs("local", time, trailId)) {
        drawJetpackFlamePlumes(
          time,
          { x: localJetpackExhaust.x, y: localJetpackExhaust.y },
          0,
          trailId,
          "local",
          { emit: false, drawFlame: false }
        );
      }
      return;
    }

    drawJetpackFlamePlumes(time, smoothedLocalJetpackExhaust(time), 1, trailId, "local");
  }

  function playerSurfaceRotation() {
    if (player.spacecraftInterior) {
      return 0;
    }
    if (!player.landed) {
      return 0;
    }

    const normal = {
      x: Math.cos(player.landed.angle),
      y: Math.sin(player.landed.angle)
    };
    const screenNormal = rotatePoint(normal.x, normal.y, cameraRoll);
    return Math.atan2(screenNormal.y, screenNormal.x) + Math.PI / 2;
  }

  function playerLocalToScreen(x, y, time, rotation) {
    const bob = playerIsOnFoot() ? 0 : Math.sin(time * 0.004) * 2.4;
    const point = rotatePoint(x, y, rotation);
    return {
      x: width / 2 + point.x,
      y: height / 2 + bob + point.y
    };
  }

  function drawGripArm(startX, startY, bendX, bendY, handX, handY, handAngle) {
    const suit = activeSkinPalette();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(bendX, bendY, handX, handY);
    ctx.stroke();

    ctx.strokeStyle = suit.arm || "#f8f5ec";
    ctx.lineWidth = 7.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(handAngle);
    ctx.fillStyle = suit.helmet || "#ffffff";
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(23, 27, 44, 0.65)";
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-2, i * 3);
      ctx.lineTo(7, i * 3 + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function gadgetScreenPoint(aim, time, x, y) {
    const centerX = width / 2;
    const centerY = height / 2 + (player.landed ? 0 : Math.sin(time * 0.004) * 2.4);
    const rotated = rotatePoint(x, y, aim.angle);
    return {
      x: centerX + rotated.x,
      y: centerY + rotated.y
    };
  }

  function drawHeldArm(startX, startY, hand, bendLift, handAngle, time, bodyRotation) {
    const shoulder = playerLocalToScreen(startX, startY, time, bodyRotation);
    const shoulderX = shoulder.x;
    const shoulderY = shoulder.y;
    const midX = (shoulderX + hand.x) / 2;
    const midY = (shoulderY + hand.y) / 2;
    const dx = hand.x - shoulderX;
    const dy = hand.y - shoulderY;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const bendX = midX + normalX * bendLift;
    const bendY = midY + normalY * bendLift;

    drawGripArm(shoulderX, shoulderY, bendX, bendY, hand.x, hand.y, handAngle);
  }

  function drawHeldArms(aim, time, layer) {
    const bodyRotation = playerSurfaceRotation();
    const topHand = gadgetScreenPoint(aim, time, 29, -9);
    const lowerHand = gadgetScreenPoint(aim, time, 46, 17);

    if (layer === "back") {
      drawHeldArm(-24, 24, topHand, -18, aim.angle - 0.18, time, bodyRotation);
      return;
    }

    drawHeldArm(24, 32, lowerHand, 18, aim.angle + 0.18, time, bodyRotation);
  }

