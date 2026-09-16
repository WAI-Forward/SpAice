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
    if (crouching) {
      ctx.translate(0, 13);
      ctx.scale(1, 0.86);
    }
    const walk = crouching ? 0 : Math.sin(npc.walkCycle || 0) * 4;
    const oppositeWalk = Math.cos(npc.walkCycle || 0) * 3.5;
    const aimAngle = finiteOr(npc.aimAngle, 0);
    const shoulderBob = (crouching ? 7 : 0) + Math.sin((npc.walkCycle || 0) * 0.5) * 1.8;
    ctx.strokeStyle = "rgba(9, 11, 16, 0.82)";
    ctx.lineCap = "round";

    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(-17, 19 + walk);
    ctx.lineTo(-18, 36 + walk * 0.3);
    ctx.moveTo(12, -8);
    ctx.lineTo(15, 19 - walk);
    ctx.lineTo(18, 36 - walk * 0.3);
    ctx.stroke();

    ctx.fillStyle = "#302d2b";
    roundRectPath(-25, 32 + walk * 0.3, 18, 10, 4);
    ctx.fill();
    roundRectPath(7, 32 - walk * 0.3, 18, 10, 4);
    ctx.fill();

    ctx.fillStyle = "#6d5845";
    ctx.strokeStyle = "rgba(8, 10, 14, 0.84)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-24, -39 + shoulderBob);
    ctx.quadraticCurveTo(0, -52 + shoulderBob, 24, -39 + shoulderBob);
    ctx.lineTo(19, 15);
    ctx.quadraticCurveTo(0, 27, -19, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#3e332b";
    ctx.beginPath();
    ctx.moveTo(-9, -42 + shoulderBob);
    ctx.lineTo(0, 12);
    ctx.lineTo(10, -42 + shoulderBob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#caa98a";
    ctx.beginPath();
    ctx.arc(0, -65 + shoulderBob, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#42372f";
    ctx.beginPath();
    ctx.ellipse(0, -76 + shoulderBob, 24, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#172534";
    roundRectPath(-15, -70 + shoulderBob, 30, 10, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(113, 225, 236, 0.72)";
    ctx.beginPath();
    ctx.ellipse(-6, -65 + shoulderBob, 5.5, 3.5, -0.15, 0, Math.PI * 2);
    ctx.ellipse(7, -65 + shoulderBob, 5.5, 3.5, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(9, 11, 16, 0.82)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-18, -31 + shoulderBob);
    ctx.quadraticCurveTo(-34, -16 + walk * 0.25, -27, -1 + walk * 0.2);
    ctx.stroke();

    ctx.save();
    ctx.translate(18, -31 + shoulderBob);
    ctx.rotate(aimAngle);
    ctx.strokeStyle = "rgba(9, 11, 16, 0.82)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(20, oppositeWalk * 0.08);
    ctx.stroke();

    ctx.fillStyle = "#caa98a";
    ctx.beginPath();
    ctx.arc(21, oppositeWalk * 0.08, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#27313a";
    ctx.strokeStyle = "rgba(7, 9, 13, 0.86)";
    ctx.lineWidth = 3;
    roundRectPath(18, -7, 56, 12, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111821";
    roundRectPath(64, -4, 22, 6, 3);
    ctx.fill();
    ctx.fillStyle = "#5c4a38";
    roundRectPath(30, 5, 10, 13, 3);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    const screen = worldToScreen(npc.worldX, npc.worldY - 92);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(245, 237, 221, 0.86)";
    ctx.fillText(npc.name, screen.x, screen.y);
    ctx.restore();
  }
