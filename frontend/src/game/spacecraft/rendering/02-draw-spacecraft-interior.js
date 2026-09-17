  function drawSpacecraftInterior(craft, time) {
    ctx.save();
    spacecraftHullPath(craft, 0);
    ctx.fillStyle = "#0f1319";
    ctx.fill();
    ctx.strokeStyle = "rgba(4, 6, 10, 0.92)";
    ctx.lineWidth = 7;
    ctx.stroke();

    spacecraftHullPath(craft, 12);
    ctx.clip();
    ctx.fillStyle = "#171c23";
    ctx.fillRect(-craft.width * 0.5, -craft.height * 0.5, craft.width, craft.height);
    drawSpacecraftHullTexture(craft, time, true);

    for (const component of craft.components) {
      if (component.kind === "turret") {
        continue;
      }
      if (component.health <= 0) {
        drawBrokenSpacecraftComponent(component);
        continue;
      }

      if (component.kind === "room") {
        const floorY = component.y + component.h * 0.5 - Math.max(8, finiteOr(component.floorInset, 24));
        const ceilingY = component.y - component.h * 0.5 + 18;
        const left = component.x - component.w * 0.5;
        const right = component.x + component.w * 0.5;
        ctx.fillStyle = component.color || "#252b33";
        ctx.strokeStyle = component.flash > 0 ? "rgba(255, 213, 122, 0.95)" : "rgba(105, 118, 128, 0.3)";
        ctx.lineWidth = component.flash > 0 ? 4 : 2;
        roundRectPath(left + 4, ceilingY, component.w - 8, floorY - ceilingY + 8, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(8, 10, 14, 0.82)";
        roundRectPath(left + 2, floorY - 10, component.w - 4, 20, 5);
        ctx.fill();
        if (component.id === "airlock") {
          const door = craft.door || {};
          const thresholdLeft = finiteOr(door.x, -craft.width * 0.5) - 82;
          const thresholdWidth = Math.max(12, left - thresholdLeft + 16);
          roundRectPath(thresholdLeft, floorY - 10, thresholdWidth, 20, 5);
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(157, 169, 178, 0.32)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left + 10, floorY - 11);
        ctx.lineTo(right - 10, floorY - 11);
        ctx.stroke();
        if (component.id === "airlock") {
          const door = craft.door || {};
          const thresholdLeft = finiteOr(door.x, -craft.width * 0.5) - 82;
          ctx.beginPath();
          ctx.moveTo(thresholdLeft + 7, floorY - 11);
          ctx.lineTo(left + 16, floorY - 11);
          ctx.stroke();
        }

        ctx.strokeStyle = "rgba(104, 112, 119, 0.22)";
        ctx.lineWidth = 1.2;
        for (let x = left + 18; x < right - 12; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, floorY - 9);
          ctx.lineTo(x + 18, floorY + 8);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(9, 12, 16, 0.6)";
        roundRectPath(left + 7, ceilingY + 8, 6, floorY - ceilingY - 4, 3);
        ctx.fill();
      } else {
        ctx.fillStyle = component.color || "#4b535c";
        roundRectPath(component.x - component.w * 0.38, component.y - component.h * 0.34, component.w * 0.76, component.h * 0.68, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(230, 238, 240, 0.28)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(component.x, component.y);
      drawSpacecraftComponentHealth(component);
      ctx.restore();
    }
    drawSpacecraftCockpit(craft, true, time);
    ctx.restore();

    for (const component of craft.components) {
      if (component.kind === "turret" && component.health > 0) {
        drawSpacecraftTurret(component, time);
      }
    }
  }

  function drawBrokenSpacecraftComponent(component) {
    ctx.save();
    ctx.translate(component.x, component.y);
    ctx.strokeStyle = "rgba(255, 126, 92, 0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-component.w * 0.38, -component.h * 0.28);
    ctx.lineTo(component.w * 0.36, component.h * 0.32);
    ctx.moveTo(component.w * 0.3, -component.h * 0.34);
    ctx.lineTo(-component.w * 0.32, component.h * 0.24);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpacecraftDoor(craft, inside, time) {
    drawSpacecraftAirlockMouth(craft, inside, time);
  }

  function drawSpacecraftTurret(component, time) {
    ctx.save();
    ctx.translate(component.x, component.y);
    ctx.rotate(finiteOr(component.aimAngle, component.angle));
    ctx.fillStyle = component.flash > 0 ? "#ffd57a" : "#6a5964";
    ctx.strokeStyle = "rgba(18, 20, 28, 0.76)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, component.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#262b35";
    roundRectPath(4, -6, 46, 12, 4);
    ctx.fill();
    ctx.stroke();
    if (component.disabledTimer > 0 || component.health <= 0) {
      ctx.strokeStyle = "rgba(255, 126, 92, 0.82)";
      ctx.beginPath();
      ctx.moveTo(-15, -15);
      ctx.lineTo(15, 15);
      ctx.moveTo(15, -15);
      ctx.lineTo(-15, 15);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpacecraftComponentHealth(component) {
    const ratio = clamp(component.health / Math.max(1, component.maxHealth), 0, 1);
    if (ratio >= 0.98 && component.flash <= 0) {
      return;
    }
    const w = Math.min(86, Math.max(46, component.w * 0.45));
    const y = component.h * 0.5 - 14;
    ctx.fillStyle = "rgba(6, 8, 12, 0.72)";
    roundRectPath(-w * 0.5, y, w, 7, 3);
    ctx.fill();
    ctx.fillStyle = ratio > 0.45 ? "#9dff7a" : ratio > 0.2 ? "#ffd166" : "#ff7e5c";
    roundRectPath(-w * 0.5, y, w * ratio, 7, 3);
    ctx.fill();
  }

  function drawSpacecraftNpcs(craft, time, inside) {
    for (const npc of craft.npcs) {
      if (!inside && Math.hypot(npc.x - craft.door.x, npc.y - craft.door.y) > 130) {
        continue;
      }
      drawTraderNpc(npc, time);
    }
  }

  function drawTraderNpc(npc, time) {
    ctx.save();
    ctx.translate(npc.x, npc.y);
    const crouching = Boolean(npc.crouching);
    const moving = !crouching && Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) > 4;

    ctx.fillStyle = "rgba(5, 8, 13, 0.32)";
    ctx.beginPath();
    ctx.ellipse(0, 40, crouching ? 34 : 29, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -34);
    ctx.scale(0.78, 0.78);
    if (crouching) {
      ctx.translate(0, playerFootOffset);
      ctx.scale(1.08, 0.84);
      ctx.translate(0, -playerFootOffset);
    }
    drawTraderNpcBody(npc, time, moving ? npc.speed : 0);
    drawTraderNpcRifle(npc, time);
    ctx.restore();

    const screen = worldToScreen(npc.worldX, npc.worldY - 104);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(245, 237, 221, 0.86)";
    ctx.fillText(npc.name, screen.x, screen.y);
    ctx.restore();
  }

  function drawTraderNpcBody(npc, time, walkSpeed) {
    const outline = "rgba(23, 27, 44, 0.76)";
    const walkCycle = finiteOr(npc.walkCycle, 0);
    const walkBounce = walkSpeed > 1 ? Math.max(0, Math.sin(walkCycle * 2)) * 3 : 0;
    const coatGradient = ctx.createLinearGradient(-28, 12, 30, 84);
    coatGradient.addColorStop(0, "#a77a4e");
    coatGradient.addColorStop(0.48, "#765138");
    coatGradient.addColorStop(1, "#49362f");

    ctx.save();
    ctx.translate(0, -walkBounce);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = "#49352f";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-32, 10);
    ctx.quadraticCurveTo(-44, 38, -35, 82);
    ctx.lineTo(-9, 68);
    ctx.lineTo(9, 68);
    ctx.lineTo(35, 82);
    ctx.quadraticCurveTo(44, 38, 32, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#5d4438";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.ellipse(0, -23, 40, 43, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    drawCharacterBodyOn(ctx, 0, 0, time, { x: 0, y: 0 }, 0, {
      suit: {
        torso: "#78604a",
        limb: "#45505a",
        arm: "#8d704f",
        helmet: "#d2c39f",
        panel: "#43515a",
        accent: "#ffbd5d"
      },
      onFoot: true,
      crouching: false,
      walkCycle,
      walkSpeed,
      centerX: 0,
      centerY: 0
    });

    ctx.save();
    ctx.translate(0, -walkBounce);
    ctx.lineJoin = "round";
    ctx.strokeStyle = outline;

    ctx.fillStyle = coatGradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-27, 13);
    ctx.quadraticCurveTo(0, 2, 27, 13);
    ctx.lineTo(22, 59);
    ctx.lineTo(31, 84);
    ctx.lineTo(4, 72);
    ctx.lineTo(0, 45);
    ctx.lineTo(-5, 72);
    ctx.lineTo(-31, 84);
    ctx.lineTo(-22, 59);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#d7a45d";
    ctx.beginPath();
    ctx.moveTo(-25, 14);
    ctx.lineTo(-13, 10);
    ctx.lineTo(11, 56);
    ctx.lineTo(3, 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(23, 27, 44, 0.58)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#303a42";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    roundRectPath(-31, 49, 61, 11, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffc467";
    roundRectPath(-5, 49, 11, 11, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#69503e";
    roundRectPath(-42, 30, 17, 32, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffbd5d";
    roundRectPath(-38, 35, 9, 4, 2);
    ctx.fill();

    const visorGlow = ctx.createLinearGradient(-24, -42, 24, -5);
    visorGlow.addColorStop(0, "rgba(255, 221, 150, 0.86)");
    visorGlow.addColorStop(0.32, "rgba(255, 174, 70, 0.35)");
    visorGlow.addColorStop(1, "rgba(255, 128, 38, 0.06)");
    ctx.fillStyle = visorGlow;
    ctx.beginPath();
    ctx.ellipse(0, -24, 27, 21, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2a3037";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, -10);
    ctx.lineTo(11, -10);
    ctx.lineTo(8, 2);
    ctx.lineTo(-8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffbd5d";
    roundRectPath(-5, -6, 10, 3, 1.5);
    ctx.fill();
    ctx.restore();
  }

  function drawTraderNpcRifle(npc, time) {
    const aimAngle = finiteOr(npc.aimAngle, 0);
    const outline = "rgba(12, 16, 25, 0.9)";
    const pulse = 0.72 + Math.sin(time * 0.008) * 0.18;
    const walking = !npc.crouching && Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) > 4;
    const walkBounce = walking ? Math.max(0, Math.sin(finiteOr(npc.walkCycle, 0) * 2)) * 3 : 0;

    ctx.save();
    ctx.translate(25, 28 - walkBounce);
    ctx.rotate(aimAngle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = outline;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.quadraticCurveTo(15, 13, 35, 2);
    ctx.stroke();
    ctx.strokeStyle = "#8d704f";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = "#4b382f";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(17, -8);
    ctx.lineTo(38, -12);
    ctx.lineTo(49, 7);
    ctx.lineTo(24, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const rifleGradient = ctx.createLinearGradient(34, -10, 118, 10);
    rifleGradient.addColorStop(0, "#71808a");
    rifleGradient.addColorStop(0.45, "#34424c");
    rifleGradient.addColorStop(1, "#18232d");
    ctx.fillStyle = rifleGradient;
    roundRectPath(34, -10, 71, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#18222c";
    roundRectPath(95, -6, 35, 12, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d7a45d";
    roundRectPath(127, -4, 13, 8, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#202b35";
    roundRectPath(52, -22, 38, 9, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 183, 78, " + pulse + ")";
    ctx.beginPath();
    ctx.arc(84, -17.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4b382f";
    ctx.beginPath();
    ctx.moveTo(48, 8);
    ctx.lineTo(66, 8);
    ctx.lineTo(60, 29);
    ctx.lineTo(48, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#d2c39f";
    ctx.beginPath();
    ctx.arc(36, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
