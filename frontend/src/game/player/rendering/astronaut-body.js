  function drawAstronautLegOn(targetCtx, x, hipY, footX, footY, bendX, bendY, suitColor, bootColor) {
    targetCtx.lineCap = "round";
    targetCtx.lineJoin = "round";
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    targetCtx.lineWidth = 18;
    targetCtx.beginPath();
    targetCtx.moveTo(x, hipY);
    targetCtx.quadraticCurveTo(bendX, bendY, footX, footY - 6);
    targetCtx.stroke();

    targetCtx.strokeStyle = suitColor;
    targetCtx.lineWidth = 12;
    targetCtx.stroke();

    targetCtx.save();
    targetCtx.translate(footX, footY);
    targetCtx.rotate((footX - x) * 0.012);
    targetCtx.fillStyle = bootColor;
    roundRectPathOn(targetCtx, -11, -5, 22, 11, 5);
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    targetCtx.lineWidth = 4;
    targetCtx.stroke();
    targetCtx.restore();
  }

  function drawAstronautLeg(x, hipY, footX, footY, bendX, bendY, suitColor, bootColor) {
    drawAstronautLegOn(ctx, x, hipY, footX, footY, bendX, bendY, suitColor, bootColor);
  }

  function drawAstronautLegsOn(targetCtx, walkCycle, walkSpeed, crouching, suitColor) {
    const walking = !crouching && Math.abs(walkSpeed || 0) > 1;
    const stride = walking ? clamp(Math.abs(walkSpeed) / 128, 0, 1) : 0;
    const phase = finiteOr(walkCycle, 0);
    const leftStep = Math.sin(phase);
    const rightStep = Math.sin(phase + Math.PI);
    const leftLift = walking ? Math.max(0, Math.cos(phase)) * 7 * stride : 0;
    const rightLift = walking ? Math.max(0, Math.cos(phase + Math.PI)) * 7 * stride : 0;
    const bootColor = "#f6f2e9";

    drawAstronautLegOn(
      targetCtx,
      -13,
      55,
      -13 + leftStep * 10 * stride,
      95 - leftLift,
      -15 - leftStep * 4 * stride,
      73 - leftLift * 0.5,
      suitColor,
      bootColor
    );
    drawAstronautLegOn(
      targetCtx,
      13,
      55,
      13 + rightStep * 10 * stride,
      95 - rightLift,
      15 - rightStep * 4 * stride,
      73 - rightLift * 0.5,
      suitColor,
      bootColor
    );
  }

  function drawAstronautLegs(walkCycle, walkSpeed, crouching, suitColor) {
    drawAstronautLegsOn(ctx, walkCycle, walkSpeed, crouching, suitColor);
  }

  function drawAstronautBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options) {
    const config = options && typeof options === "object" ? options : {};
    const onFoot = config.onFoot !== undefined ? Boolean(config.onFoot) : playerIsOnFoot();
    const crouching = Boolean(config.crouching);
    const suit = config.suit || activeSkinPalette();
    const walkSpeed = finiteOr(config.walkSpeed, 0);
    const walkCycle = finiteOr(config.walkCycle, 0);
    const bob = onFoot ? 0 : Math.sin(time * 0.004) * 2.4;
    const lean = onFoot ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;
    const walkBounce = onFoot && !crouching && Math.abs(walkSpeed) > 1
      ? Math.max(0, Math.sin(walkCycle * 2)) * 3
      : 0;
    const centerX = Number.isFinite(Number(config.centerX)) ? Number(config.centerX) : targetWidth / 2;
    const centerY = Number.isFinite(Number(config.centerY)) ? Number(config.centerY) : targetHeight / 2;

    targetCtx.save();
    targetCtx.translate(centerX, centerY + bob);
    targetCtx.rotate(bodyRotation);
    targetCtx.translate(0, -walkBounce);
    targetCtx.rotate(lean);
    if (crouching) {
      targetCtx.translate(0, playerFootOffset);
      targetCtx.scale(1.08, 0.84);
      targetCtx.translate(0, -playerFootOffset);
    }
    if (typeof config.drawJetFlames === "function") {
      config.drawJetFlames(time);
    }

    targetCtx.lineJoin = "round";
    targetCtx.lineCap = "round";
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.68)";
    targetCtx.lineWidth = 4;

    targetCtx.fillStyle = suit.torso || "#f4f2ea";
    roundRectPathOn(targetCtx, -22, 18, 44, 58, 13);
    targetCtx.fill();
    targetCtx.stroke();

    drawAstronautLegsOn(targetCtx, walkCycle, walkSpeed, crouching, suit.limb || "#d9dee8");

    targetCtx.fillStyle = suit.arm || "#f8f5ec";
    roundRectPathOn(targetCtx, -35, 22, 13, 28, 7);
    targetCtx.fill();
    targetCtx.stroke();
    roundRectPathOn(targetCtx, 22, 22, 13, 28, 7);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = suit.helmet || "#ffffff";
    targetCtx.beginPath();
    targetCtx.ellipse(0, -23, 38, 40, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = suit.helmet || "#ffffff";
    roundRectPathOn(targetCtx, -45, -29, 10, 25, 6);
    targetCtx.fill();
    targetCtx.stroke();
    roundRectPathOn(targetCtx, 35, -29, 10, 25, 6);
    targetCtx.fill();
    targetCtx.stroke();

    const visorGradient = targetCtx.createLinearGradient(-27, -48, 29, 8);
    visorGradient.addColorStop(0, "#172847");
    visorGradient.addColorStop(0.45, "#050a18");
    visorGradient.addColorStop(1, "#0d3f6a");
    targetCtx.fillStyle = visorGradient;
    targetCtx.beginPath();
    targetCtx.ellipse(0, -24, 28, 22, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = "rgba(255, 255, 255, 0.74)";
    targetCtx.beginPath();
    targetCtx.ellipse(-15, -34, 7, 4, -0.55, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = "rgba(54, 184, 255, 0.18)";
    targetCtx.beginPath();
    targetCtx.ellipse(12, -18, 11, 7, -0.35, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = suit.panel || "#cfd7e7";
    roundRectPathOn(targetCtx, -19, 27, 38, 26, 6);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = "#172033";
    roundRectPathOn(targetCtx, -11, 33, 9, 7, 3);
    targetCtx.fill();
    roundRectPathOn(targetCtx, 2, 33, 9, 7, 3);
    targetCtx.fill();

    targetCtx.fillStyle = "#ef6262";
    targetCtx.beginPath();
    targetCtx.arc(-7, 47, 2.5, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.fillStyle = suit.accent || "#64e3ff";
    targetCtx.beginPath();
    targetCtx.arc(7, 47, 2.5, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.restore();
  }

  function drawMedievalKnightBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options) {
    const config = options && typeof options === "object" ? options : {};
    const suit = config.suit || activeSkinPalette();
    const onFoot = config.onFoot !== undefined ? Boolean(config.onFoot) : playerIsOnFoot();
    const crouching = Boolean(config.crouching);
    const walkSpeed = finiteOr(config.walkSpeed, 0);
    const walkCycle = finiteOr(config.walkCycle, 0);
    const bob = onFoot ? 0 : Math.sin(time * 0.004) * 2.4;
    const lean = onFoot ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;
    const walking = !crouching && Math.abs(walkSpeed) > 1;
    const stride = walking ? clamp(Math.abs(walkSpeed) / 128, 0, 1) : 0;
    const leftStep = Math.sin(walkCycle) * 9 * stride;
    const rightStep = Math.sin(walkCycle + Math.PI) * 9 * stride;
    const walkBounce = walking ? Math.max(0, Math.sin(walkCycle * 2)) * 3 : 0;
    const centerX = Number.isFinite(Number(config.centerX)) ? Number(config.centerX) : targetWidth / 2;
    const centerY = Number.isFinite(Number(config.centerY)) ? Number(config.centerY) : targetHeight / 2;
    const metal = suit.torso || "#9aa6b6";
    const brightMetal = suit.helmet || "#d9dee8";
    const darkMetal = suit.limb || "#7d8998";
    const leather = suit.panel || "#6b3f2a";
    const tabard = suit.accent || "#d94b4b";

    targetCtx.save();
    targetCtx.translate(centerX, centerY + bob);
    targetCtx.rotate(bodyRotation);
    targetCtx.translate(0, -walkBounce);
    targetCtx.rotate(lean);
    if (crouching) {
      targetCtx.translate(0, playerFootOffset);
      targetCtx.scale(1.08, 0.84);
      targetCtx.translate(0, -playerFootOffset);
    }
    if (typeof config.drawJetFlames === "function") {
      config.drawJetFlames(time);
    }

    targetCtx.lineJoin = "round";
    targetCtx.lineCap = "round";
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 4;

    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 16;
    targetCtx.beginPath();
    targetCtx.moveTo(-13, 53);
    targetCtx.lineTo(-14 + leftStep, 95);
    targetCtx.moveTo(13, 53);
    targetCtx.lineTo(14 + rightStep, 95);
    targetCtx.stroke();

    targetCtx.strokeStyle = darkMetal;
    targetCtx.lineWidth = 10;
    targetCtx.beginPath();
    targetCtx.moveTo(-13, 53);
    targetCtx.lineTo(-14 + leftStep, 91);
    targetCtx.moveTo(13, 53);
    targetCtx.lineTo(14 + rightStep, 91);
    targetCtx.stroke();

    targetCtx.fillStyle = "#2a3140";
    roundRectPathOn(targetCtx, -27 + leftStep, 88, 23, 11, 4);
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 3;
    targetCtx.stroke();
    roundRectPathOn(targetCtx, 4 + rightStep, 88, 23, 11, 4);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = metal;
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 4;
    roundRectPathOn(targetCtx, -27, 9, 54, 65, 9);
    targetCtx.fill();
    targetCtx.stroke();

    const breastplate = targetCtx.createLinearGradient(-25, 10, 25, 70);
    breastplate.addColorStop(0, brightMetal);
    breastplate.addColorStop(0.48, metal);
    breastplate.addColorStop(1, darkMetal);
    targetCtx.fillStyle = breastplate;
    roundRectPathOn(targetCtx, -22, 13, 44, 54, 7);
    targetCtx.fill();

    targetCtx.fillStyle = tabard;
    targetCtx.beginPath();
    targetCtx.moveTo(-12, 17);
    targetCtx.lineTo(12, 17);
    targetCtx.lineTo(16, 72);
    targetCtx.lineTo(0, 63);
    targetCtx.lineTo(-16, 72);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.55)";
    targetCtx.lineWidth = 2;
    targetCtx.stroke();

    targetCtx.fillStyle = colorString({ r: 255, g: 229, b: 111 }, 0.82);
    roundRectPathOn(targetCtx, -3, 21, 6, 38, 2);
    targetCtx.fill();
    roundRectPathOn(targetCtx, -10, 34, 20, 6, 2);
    targetCtx.fill();

    targetCtx.fillStyle = leather;
    roundRectPathOn(targetCtx, -31, 58, 62, 10, 4);
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.6)";
    targetCtx.lineWidth = 2;
    targetCtx.stroke();

    const helmetGradient = targetCtx.createLinearGradient(-34, -62, 34, 4);
    helmetGradient.addColorStop(0, "#f3f5f8");
    helmetGradient.addColorStop(0.48, brightMetal);
    helmetGradient.addColorStop(1, darkMetal);
    targetCtx.fillStyle = helmetGradient;
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 4;
    targetCtx.beginPath();
    targetCtx.ellipse(0, -25, 34, 38, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = brightMetal;
    roundRectPathOn(targetCtx, -27, -56, 54, 28, 12);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = "rgba(5, 10, 18, 0.92)";
    roundRectPathOn(targetCtx, -21, -33, 42, 13, 5);
    targetCtx.fill();

    targetCtx.strokeStyle = "rgba(223, 252, 255, 0.26)";
    targetCtx.lineWidth = 2;
    for (let slit = -12; slit <= 12; slit += 8) {
      targetCtx.beginPath();
      targetCtx.moveTo(slit, -32);
      targetCtx.lineTo(slit + 2, -22);
      targetCtx.stroke();
    }

    targetCtx.fillStyle = tabard;
    targetCtx.beginPath();
    targetCtx.moveTo(24, -58);
    targetCtx.quadraticCurveTo(41, -66, 36, -42);
    targetCtx.quadraticCurveTo(30, -49, 21, -44);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.58)";
    targetCtx.lineWidth = 2;
    targetCtx.stroke();

    targetCtx.restore();
  }

