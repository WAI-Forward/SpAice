  function drawGadgetField(aim) {
    const mode = localGadgetModeForRender();
    if (mode !== "pull" && mode !== "push" && mode !== "hold") {
      return;
    }

    const holding = mode === "hold";
    const pulling = mode === "pull";
    const centerX = width / 2;
    const centerY = height / 2;
    const mouthX = centerX + aim.local.x * funnelShape.rimX;
    const mouthY = centerY + aim.local.y * funnelShape.rimX;
    const normal = { x: -aim.local.y, y: aim.local.x };
    const rangeFactor = Math.max(0.1, currentGadgetRangeFactor());
    const fieldLength = holding ? gadgetHoldReach * rangeFactor - funnelShape.rimX : pulling ? 320 * rangeFactor : 250;
    const time = performance.now() * 0.004;
    const gatherColor = pulling ? activeGadgetGatherColor(aim) : null;
    const gatherLight = gatherColor ? normalizeDynamicLightColor(gatherColor, { r: 114, g: 244, b: 255 }) : null;
    const gatherMid = gatherLight ? mixColor(gatherLight, { r: 248, g: 251, b: 255 }, 4, 1) : null;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    if (holding) {
      drawGadgetHoldField(centerX, centerY, aim.local.x, aim.local.y, normal.x, normal.y, time, false, rangeFactor);
      ctx.restore();
      return;
    }

    for (let i = 0; i < 10; i += 1) {
      const t = i / 9;
      const side = (t - 0.5) * (holding ? 132 : pulling ? 150 : 122);
      const phase = Math.sin(time + i * 1.7) * 8;
      const startScale = pulling ? fieldLength : 18;
      const endScale = pulling ? 18 : fieldLength;
      const startX = mouthX + aim.local.x * startScale + normal.x * (side + phase);
      const startY = mouthY + aim.local.y * startScale + normal.y * (side + phase);
      const endX = mouthX + aim.local.x * endScale + normal.x * side * 0.18;
      const endY = mouthY + aim.local.y * endScale + normal.y * side * 0.18;

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      if (pulling) {
        if (gatherLight && gatherMid) {
          gradient.addColorStop(0, colorString(gatherLight, 0));
          gradient.addColorStop(0.58, colorString(gatherMid, 0.17));
          gradient.addColorStop(1, colorString(gatherLight, 0.42));
        } else {
          gradient.addColorStop(0, "rgba(114, 244, 255, 0)");
          gradient.addColorStop(0.58, "rgba(114, 244, 255, 0.17)");
          gradient.addColorStop(1, "rgba(229, 109, 255, 0.42)");
        }
      } else {
        gradient.addColorStop(0, "rgba(255, 229, 120, 0.44)");
        gradient.addColorStop(0.62, "rgba(255, 117, 79, 0.18)");
        gradient.addColorStop(1, "rgba(255, 117, 79, 0)");
      }

      strokeSoftGadgetCurve(
        startX,
        startY,
        (startX + endX) / 2 + normal.x * Math.sin(time * 0.7 + i) * 16,
        (startY + endY) / 2 + normal.y * Math.sin(time * 0.7 + i) * 16,
        endX,
        endY,
        gradient,
        pulling ? 1.45 : 2.1,
        pulling ? 2.3 : 2.8
      );
    }

    ctx.restore();
  }

  function roundRectPathOn(targetCtx, x, y, w, h, r) {
    const widthValue = finiteOr(w, 0);
    const heightValue = finiteOr(h, 0);
    if (widthValue <= 0 || heightValue <= 0) {
      targetCtx.beginPath();
      return;
    }
    const radius = Math.max(0, Math.min(Math.abs(finiteOr(r, 0)), widthValue / 2, heightValue / 2));
    targetCtx.beginPath();
    targetCtx.moveTo(x + radius, y);
    targetCtx.arcTo(x + widthValue, y, x + widthValue, y + heightValue, radius);
    targetCtx.arcTo(x + widthValue, y + heightValue, x, y + heightValue, radius);
    targetCtx.arcTo(x, y + heightValue, x, y, radius);
    targetCtx.arcTo(x, y, x + widthValue, y, radius);
    targetCtx.closePath();
  }

  function roundRectPath(x, y, w, h, r) {
    roundRectPathOn(ctx, x, y, w, h, r);
  }

  function jetpackLocalMoveVector() {
    let x = 0;
    let y = 0;
    if (isMovementKeyPressed("left")) {
      x -= 1;
    }
    if (isMovementKeyPressed("right")) {
      x += 1;
    }
    if (isMovementKeyPressed("up")) {
      y -= 1;
    }
    if (isMovementKeyPressed("down")) {
      y += 1;
    }

    const length = Math.hypot(x, y);
    if (length <= 0.001) {
      return { x: 0, y: -1 };
    }
    return {
      x: x / length,
      y: y / length
    };
  }

  function easeJetpackExhaustAngle(current, target, dt, response) {
    const blend = 1 - Math.exp(-Math.max(0, finiteOr(dt, 0)) * Math.max(0.001, finiteOr(response, 1)));
    const currentAngle = Number.isFinite(Number(current.angle))
      ? finiteOr(current.angle, Math.PI / 2)
      : Math.atan2(finiteOr(current.y, 1), finiteOr(current.x, 0));
    const targetAngle = Math.atan2(finiteOr(target.y, 1), finiteOr(target.x, 0));
    const easedAngle = currentAngle + shortestAngleDelta(currentAngle, targetAngle) * blend;
    return {
      x: Math.cos(easedAngle),
      y: Math.sin(easedAngle),
      angle: easedAngle
    };
  }

  function smoothedLocalJetpackExhaust(time) {
    const input = jetpackLocalMoveVector();
    const target = {
      x: -input.x,
      y: -input.y
    };
    const dt = localJetpackExhaust.time > 0
      ? clamp((time - localJetpackExhaust.time) / 1000, 0, 0.08)
      : 1 / 60;
    const smoothed = easeJetpackExhaustAngle(localJetpackExhaust, target, dt, jetpackDirectionSmoothing);
    localJetpackExhaust.x = smoothed.x;
    localJetpackExhaust.y = smoothed.y;
    localJetpackExhaust.angle = smoothed.angle;
    localJetpackExhaust.time = time;
    return smoothed;
  }

