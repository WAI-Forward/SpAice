  function drawSpacecrafts(time) {
    for (const craft of spacecrafts) {
      const radius = Math.hypot(craft.width, craft.height) * 0.62;
      if (!isWorldCircleNearView(craft.x, craft.y, radius, 420)) {
        continue;
      }
      drawSpacecraft(craft, time);
    }
  }

  function drawSpacecraft(craft, time) {
    const inside = player.spacecraftInterior && player.spacecraftInterior.spacecraftId === craft.id;
    ctx.save();
    ctx.translate(craft.x, craft.y);
    ctx.rotate(finiteOr(craft.rotation, 0));
    if (inside) {
      drawSpacecraftInterior(craft, time);
    } else {
      drawSpacecraftExterior(craft, time);
    }
    drawSpacecraftDoor(craft, inside, time);
    drawSpacecraftNpcs(craft, time, inside);
    ctx.restore();
  }

  function spacecraftHullPath(craft, inset) {
    const pad = Math.max(0, finiteOr(inset, 0));
    const left = -craft.width * 0.5 + pad;
    const right = craft.width * 0.5 - pad;
    const top = -craft.height * 0.5 + pad;
    const bottom = craft.height * 0.5 - pad;
    ctx.beginPath();
    ctx.moveTo(left + 42, 54);
    ctx.lineTo(left + 110, top + 92);
    ctx.lineTo(left + 304, top + 58);
    ctx.quadraticCurveTo(left + 442, top + 8, left + 612, top + 50);
    ctx.lineTo(right - 198, top + 76);
    ctx.quadraticCurveTo(right - 78, top + 84, right - 16, -20);
    ctx.lineTo(right + 6, 56);
    ctx.quadraticCurveTo(right - 74, bottom - 52, right - 226, bottom - 40);
    ctx.lineTo(left + 252, bottom - 34);
    ctx.quadraticCurveTo(left + 96, bottom - 32, left + 42, 54);
    ctx.closePath();
  }

  function spacecraftDoorMetrics(craft) {
    const door = craft.door || {};
    const x = finiteOr(door.x, -craft.width * 0.5);
    const y = finiteOr(door.y, 0);
    const h = finiteOr(door.height, 220);
    const w = finiteOr(door.width, 120);
    return {
      x,
      y,
      w,
      h,
      left: x - w * 0.36,
      right: x + w * 0.68,
      top: y - h * 0.5,
      bottom: y + h * 0.5
    };
  }

  function drawSpacecraftAirlockMouth(craft, inside, time) {
    const door = spacecraftDoorMetrics(craft);
    const pulse = 0.42 + Math.sin(time * 0.004) * 0.08;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const collarGradient = ctx.createLinearGradient(door.left, door.top, door.right + 34, door.bottom);
    collarGradient.addColorStop(0, inside ? "rgba(30, 36, 43, 0.94)" : "rgba(35, 42, 50, 0.98)");
    collarGradient.addColorStop(0.58, inside ? "rgba(18, 23, 30, 0.98)" : "rgba(27, 33, 41, 0.98)");
    collarGradient.addColorStop(1, "rgba(8, 11, 17, 0.98)");
    ctx.fillStyle = collarGradient;
    ctx.strokeStyle = "rgba(8, 10, 15, 0.96)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(door.left + 28, door.top + 8);
    ctx.lineTo(door.right + 20, door.top + 34);
    ctx.lineTo(door.right + 20, door.bottom - 34);
    ctx.lineTo(door.left + 28, door.bottom - 8);
    ctx.quadraticCurveTo(door.left - 18, door.y, door.left + 28, door.top + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(139, 151, 162, 0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(door.right - 6, door.top + 42);
    ctx.lineTo(door.right - 6, door.bottom - 42);
    ctx.moveTo(door.left + 42, door.top + 22);
    ctx.lineTo(door.right + 6, door.top + 44);
    ctx.moveTo(door.left + 42, door.bottom - 22);
    ctx.lineTo(door.right + 6, door.bottom - 44);
    ctx.stroke();

    ctx.fillStyle = inside ? "rgba(6, 9, 15, 0.82)" : "rgba(2, 5, 10, 0.92)";
    ctx.strokeStyle = "rgba(3, 5, 9, 0.94)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(door.left + 34, door.top + 26);
    ctx.lineTo(door.right - 18, door.top + 46);
    ctx.lineTo(door.right - 18, door.bottom - 46);
    ctx.lineTo(door.left + 32, door.bottom - 26);
    ctx.quadraticCurveTo(door.left - 2, door.y, door.left + 34, door.top + 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 209, 102, " + pulse + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(door.left + 40, door.top + 32);
    ctx.lineTo(door.right - 28, door.top + 50);
    ctx.lineTo(door.right - 28, door.bottom - 50);
    ctx.lineTo(door.left + 38, door.bottom - 32);
    ctx.stroke();

    ctx.strokeStyle = "rgba(123, 134, 143, 0.34)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const y = door.top + 56 + i * ((door.h - 112) / 3);
      ctx.beginPath();
      ctx.moveTo(door.left + 38, y);
      ctx.lineTo(door.right - 32, y + 5);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(14, 18, 24, 0.9)";
    roundRectPath(door.right - 18, door.top + 54, 14, door.h - 108, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawSpacecraftPlate(x, y, w, h, radius, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke || "rgba(10, 13, 18, 0.72)";
    ctx.lineWidth = 2;
    roundRectPath(x, y, w, h, radius);
    ctx.fill();
    ctx.stroke();
  }

  function spacecraftTextureUnit(seed, index) {
    const value = textureNoise(seed, index);
    return value - Math.floor(value);
  }

  function drawSpacecraftHullTexture(craft, time, inside) {
    const seed = craft.id * 37 + (inside ? 19 : 3);
    for (let i = 0; i < 24; i += 1) {
      const n = spacecraftTextureUnit(seed, i);
      const x = -craft.width * 0.42 + craft.width * ((n + i * 0.173) % 0.86);
      const y = -craft.height * 0.34 + craft.height * ((n * 1.91 + i * 0.117) % 0.58);
      const w = 28 + spacecraftTextureUnit(seed + 5, i) * 54;
      const h = 8 + spacecraftTextureUnit(seed + 11, i) * 16;
      const alpha = inside ? 0.28 : 0.42;
      ctx.fillStyle = i % 3 === 0
        ? "rgba(93, 101, 111, " + alpha + ")"
        : "rgba(18, 22, 29, " + (alpha * 0.9) + ")";
      roundRectPath(x, y, w, h, 3);
      ctx.fill();
    }

    ctx.strokeStyle = inside ? "rgba(110, 123, 132, 0.18)" : "rgba(136, 148, 158, 0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const x = -craft.width * 0.32 + i * craft.width * 0.12 + Math.sin(time * 0.001 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(x, -craft.height * 0.34);
      ctx.lineTo(x + 24, craft.height * 0.32);
      ctx.stroke();
    }
  }

  function drawSpacecraftSideThrusters(craft, time) {
    const baseX = -craft.width * 0.5 + 470;
    const nozzleY = 22;
    const pulse = 0.64 + Math.sin(time * 0.011) * 0.18;
    const nozzleX = baseX + Math.sin(time * 0.002) * 1.8;
    const flameLength = 150 + Math.sin(time * 0.018) * 24;
    const flameHalf = 34 + Math.sin(time * 0.014 + 1.2) * 4;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const recessGradient = ctx.createLinearGradient(nozzleX - 36, nozzleY - 46, nozzleX + 48, nozzleY + 46);
    recessGradient.addColorStop(0, "rgba(12, 16, 22, 0.82)");
    recessGradient.addColorStop(0.5, "rgba(29, 36, 44, 0.88)");
    recessGradient.addColorStop(1, "rgba(7, 10, 15, 0.9)");
    ctx.fillStyle = recessGradient;
    ctx.strokeStyle = "rgba(5, 7, 11, 0.84)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(nozzleX - 42, nozzleY - 48);
    ctx.lineTo(nozzleX + 30, nozzleY - 36);
    ctx.quadraticCurveTo(nozzleX + 58, nozzleY, nozzleX + 30, nozzleY + 36);
    ctx.lineTo(nozzleX - 42, nozzleY + 48);
    ctx.quadraticCurveTo(nozzleX - 58, nozzleY, nozzleX - 42, nozzleY - 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const glow = ctx.createRadialGradient(nozzleX - 62, nozzleY, 8, nozzleX - 76, nozzleY, flameLength * 0.72);
    glow.addColorStop(0, "rgba(255, 245, 154, " + (0.24 * pulse) + ")");
    glow.addColorStop(0.45, "rgba(255, 210, 42, " + (0.16 * pulse) + ")");
    glow.addColorStop(1, "rgba(255, 185, 35, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(nozzleX - flameLength * 0.52, nozzleY, flameLength * 0.68, flameHalf * 1.7, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 16; i += 1) {
      const lane = (i - 7.5) / 7.5;
      const jitter = Math.sin(time * 0.026 + i * 1.45);
      const startX = nozzleX - 16 - i * 1.3;
      const startY = nozzleY + lane * flameHalf * 0.62 + jitter * 3.5;
      const endX = nozzleX - flameLength * (0.36 + i * 0.026) - Math.max(0, jitter) * 12;
      const endY = nozzleY + lane * flameHalf * (1.05 + Math.abs(jitter) * 0.22) + jitter * 5;
      const strokeAlpha = 0.36 + (i % 4) * 0.1;

      ctx.strokeStyle = i % 4 === 0
        ? "rgba(255, 255, 196, " + strokeAlpha + ")"
        : "rgba(255, 220, 34, " + strokeAlpha + ")";
      ctx.lineWidth = i % 4 === 0 ? 2.8 : 1.7;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        (startX + endX) * 0.5,
        nozzleY + lane * flameHalf * 0.32 + jitter * 8,
        endX,
        endY
      );
      ctx.stroke();
    }

    const nozzleGradient = ctx.createLinearGradient(nozzleX - 34, nozzleY - 42, nozzleX + 34, nozzleY + 42);
    nozzleGradient.addColorStop(0, "rgba(9, 12, 18, 0.98)");
    nozzleGradient.addColorStop(0.42, "rgba(45, 52, 60, 0.98)");
    nozzleGradient.addColorStop(1, "rgba(94, 100, 108, 0.94)");
    ctx.fillStyle = nozzleGradient;
    ctx.strokeStyle = "rgba(4, 6, 10, 0.92)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(nozzleX - 34, nozzleY - 34);
    ctx.lineTo(nozzleX + 16, nozzleY - 26);
    ctx.quadraticCurveTo(nozzleX + 42, nozzleY, nozzleX + 16, nozzleY + 26);
    ctx.lineTo(nozzleX - 34, nozzleY + 34);
    ctx.quadraticCurveTo(nozzleX - 50, nozzleY, nozzleX - 34, nozzleY - 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(176, 186, 194, 0.4)";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(nozzleX - 25, nozzleY + i * 10);
      ctx.lineTo(nozzleX + 13, nozzleY + i * 6);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 235, 118, " + (0.62 * pulse) + ")";
    ctx.beginPath();
    ctx.ellipse(nozzleX - 34, nozzleY, 9, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawSpacecraftCockpit(craft, inside, time) {
    const right = craft.width * 0.5;
    const canopyX = right - 148;
    const canopyY = -82;
    const pulse = 0.74 + Math.sin(time * 0.004) * 0.08;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = inside ? "rgba(8, 15, 22, 0.62)" : "rgba(5, 12, 20, 0.72)";
    ctx.strokeStyle = "rgba(7, 10, 15, 0.82)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(canopyX - 66, canopyY - 44);
    ctx.quadraticCurveTo(canopyX + 4, canopyY - 76, canopyX + 86, canopyY - 40);
    ctx.quadraticCurveTo(canopyX + 112, canopyY - 5, canopyX + 78, canopyY + 38);
    ctx.quadraticCurveTo(canopyX + 10, canopyY + 58, canopyX - 70, canopyY + 34);
    ctx.quadraticCurveTo(canopyX - 92, canopyY - 2, canopyX - 66, canopyY - 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const glass = ctx.createLinearGradient(canopyX - 74, canopyY - 48, canopyX + 90, canopyY + 42);
    glass.addColorStop(0, "rgba(170, 247, 255, " + (0.44 * pulse) + ")");
    glass.addColorStop(0.42, "rgba(51, 122, 151, " + (0.34 * pulse) + ")");
    glass.addColorStop(1, "rgba(16, 33, 52, " + (0.82 * pulse) + ")");
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(canopyX - 50, canopyY - 32);
    ctx.quadraticCurveTo(canopyX + 8, canopyY - 56, canopyX + 68, canopyY - 28);
    ctx.quadraticCurveTo(canopyX + 88, canopyY - 2, canopyX + 58, canopyY + 24);
    ctx.quadraticCurveTo(canopyX + 2, canopyY + 40, canopyX - 54, canopyY + 22);
    ctx.quadraticCurveTo(canopyX - 70, canopyY - 4, canopyX - 50, canopyY - 32);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(214, 251, 255, 0.54)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canopyX - 34, canopyY - 28);
    ctx.quadraticCurveTo(canopyX + 8, canopyY - 42, canopyX + 50, canopyY - 24);
    ctx.moveTo(canopyX - 18, canopyY + 20);
    ctx.quadraticCurveTo(canopyX + 22, canopyY + 28, canopyX + 56, canopyY + 8);
    ctx.stroke();

    ctx.strokeStyle = "rgba(8, 12, 18, 0.62)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canopyX - 4, canopyY - 48);
    ctx.lineTo(canopyX + 4, canopyY + 34);
    ctx.moveTo(canopyX + 48, canopyY - 34);
    ctx.lineTo(canopyX + 22, canopyY + 30);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpacecraftExterior(craft, time) {
    const damaged = liveSpacecraftComponents(craft).length < craft.components.length;
    const hullPulse = damaged ? 0.08 + Math.sin(time * 0.018) * 0.05 : 0;
    ctx.save();
    spacecraftHullPath(craft, 0);
    ctx.fillStyle = "#20262e";
    ctx.fill();
    ctx.strokeStyle = "rgba(7, 9, 14, 0.9)";
    ctx.lineWidth = 7;
    ctx.stroke();

    spacecraftHullPath(craft, 10);
    ctx.fillStyle = "rgba(54, 61, 69, " + (0.96 - hullPulse) + ")";
    ctx.fill();
    ctx.strokeStyle = "rgba(137, 151, 163, 0.24)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();

    const roomColors = ["#394049", "#313842", "#44464a", "#2b3139"];
    let roomIndex = 0;
    for (const component of craft.components) {
      if (component.health <= 0) {
        continue;
      }
      if (component.kind !== "room") {
        continue;
      }
      const healthRatio = clamp(component.health / Math.max(1, component.maxHealth), 0, 1);
      const base = roomColors[roomIndex % roomColors.length];
      roomIndex += 1;
      ctx.fillStyle = healthRatio > 0.45 ? base : "#2b2527";
      ctx.strokeStyle = component.flash > 0 ? "rgba(255, 213, 122, 0.95)" : "rgba(151, 164, 179, 0.42)";
      ctx.lineWidth = component.flash > 0 ? 4 : 2;
      roundRectPath(component.x - component.w * 0.5 + 6, component.y - component.h * 0.5 + 8, component.w - 12, component.h - 16, 8);
      ctx.fill();
      ctx.stroke();
    }

    drawSpacecraftHullTexture(craft, time, false);
    drawSpacecraftSideThrusters(craft, time);

    for (const component of craft.components) {
      if (component.health <= 0 || component.kind === "room" || component.kind === "turret") {
        continue;
      }
      const x = component.x - component.w * 0.5;
      const y = component.y - component.h * 0.5;
      const fill = component.kind === "engine" ? "#4b3b38" : component.color || "#4a535a";
      drawSpacecraftPlate(x, y, component.w, component.h, 7, fill, component.flash > 0 ? "rgba(255, 213, 122, 0.9)" : "rgba(7, 9, 14, 0.72)");
      if (component.kind === "engine") {
        const pulse = 0.58 + Math.sin(time * 0.006) * 0.22;
        ctx.fillStyle = "rgba(255, 139, 82, " + (pulse * 0.58) + ")";
        ctx.beginPath();
        ctx.ellipse(component.x + component.w * 0.28, component.y + 44, 13, component.h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawSpacecraftCockpit(craft, false, time);

    ctx.restore();

    for (const component of craft.components) {
      if (component.health <= 0) {
        drawBrokenSpacecraftComponent(component);
      } else if (component.kind === "turret") {
        drawSpacecraftTurret(component, time);
      } else if (component.flash > 0 || component.health < component.maxHealth * 0.98) {
        ctx.save();
        ctx.translate(component.x, component.y);
        drawSpacecraftComponentHealth(component);
        ctx.restore();
      }
    }
  }

