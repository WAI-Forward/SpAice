  function costumeThemeForModel(model, suit) {
    const base = {
      body: suit.torso || "#f4f2ea",
      leg: suit.limb || "#d9dee8",
      head: suit.helmet || "#ffffff",
      trim: suit.panel || "#cfd7e7",
      accent: suit.accent || "#64e3ff",
      boot: "#20283a"
    };
    const themes = {
      pirate: { body: "#2c2238", leg: "#181827", head: "#f0d4b2", trim: "#7b3e24", accent: "#d94b4b", boot: "#11131c" },
      wizard: { body: "#3d318f", leg: "#27205f", head: "#e6ddff", trim: "#f0d275", accent: "#ffd166", boot: "#18142f" },
      cowboy: { body: "#8b4e29", leg: "#2f5c91", head: "#f0c899", trim: "#b6783d", accent: "#d94b4b", boot: "#3a2518" },
      ninja: { body: "#111827", leg: "#05070c", head: "#0b0f18", trim: "#3b4458", accent: "#66e0b8", boot: "#05070c" },
      viking: { body: "#6f442d", leg: "#4b2d20", head: "#efdbc3", trim: "#f2eadb", accent: "#58e2ff", boot: "#281b14" },
      samurai: { body: "#7f1d2d", leg: "#2f1f24", head: "#2b2630", trim: "#d0a64f", accent: "#ff6262", boot: "#161116" },
      diver: { body: "#7c4f2b", leg: "#4b3628", head: "#d0a64f", trim: "#2d6cdf", accent: "#58e2ff", boot: "#2b2119" },
      firefighter: { body: "#9f1f2e", leg: "#5d1f24", head: "#e5484d", trim: "#ffd166", accent: "#ffd166", boot: "#151922" },
      doctor: { body: "#f1f5f9", leg: "#58e2ff", head: "#f3d4bd", trim: "#58e2ff", accent: "#ef6262", boot: "#d8dee8" },
      clown: { body: "#f8fbff", leg: "#3578ff", head: "#ffffff", trim: "#a985ff", accent: "#ef6262", boot: "#ffdc7a" },
      santa: { body: "#c52835", leg: "#6b1d22", head: "#f2d0a2", trim: "#f8fbff", accent: "#f8fbff", boot: "#111827" },
      skeleton: { body: "#111827", leg: "#0b0f18", head: "#efe7d4", trim: "#f1ead8", accent: "#f1ead8", boot: "#05070c" },
      teddy: { body: "#a86b35", leg: "#7b4b2a", head: "#b8793d", trim: "#f2d0a2", accent: "#ffd166", boot: "#6b3f2a" }
    };
    return Object.assign(base, themes[model] || {});
  }

  function drawThemedCostumeBodyOn(targetCtx, targetWidth, targetHeight, time, localVelocity, bodyRotation, options) {
    const config = options && typeof options === "object" ? options : {};
    const model = config.model || "pirate";
    const suit = config.suit || activeSkinPalette();
    const theme = costumeThemeForModel(model, suit);
    const onFoot = config.onFoot !== undefined ? Boolean(config.onFoot) : playerIsOnFoot();
    const crouching = Boolean(config.crouching);
    const walkSpeed = finiteOr(config.walkSpeed, 0);
    const walkCycle = finiteOr(config.walkCycle, 0);
    const centerX = Number.isFinite(Number(config.centerX)) ? Number(config.centerX) : targetWidth / 2;
    const centerY = Number.isFinite(Number(config.centerY)) ? Number(config.centerY) : targetHeight / 2;
    const bob = onFoot ? 0 : Math.sin(time * 0.004) * 2.4;
    const lean = onFoot ? 0 : clamp(localVelocity.x / 460, -1, 1) * 0.14;
    const walking = !crouching && Math.abs(walkSpeed) > 1;
    const stride = walking ? clamp(Math.abs(walkSpeed) / 128, 0, 1) : 0;
    const leftStep = Math.sin(walkCycle) * 9 * stride;
    const rightStep = Math.sin(walkCycle + Math.PI) * 9 * stride;
    const walkBounce = walking ? Math.max(0, Math.sin(walkCycle * 2)) * 3 : 0;

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

    targetCtx.lineWidth = 16;
    targetCtx.beginPath();
    targetCtx.moveTo(-13, 54);
    targetCtx.lineTo(-14 + leftStep, 95);
    targetCtx.moveTo(13, 54);
    targetCtx.lineTo(14 + rightStep, 95);
    targetCtx.stroke();

    targetCtx.strokeStyle = theme.leg;
    targetCtx.lineWidth = 10;
    targetCtx.beginPath();
    targetCtx.moveTo(-13, 54);
    targetCtx.lineTo(-14 + leftStep, 91);
    targetCtx.moveTo(13, 54);
    targetCtx.lineTo(14 + rightStep, 91);
    targetCtx.stroke();

    targetCtx.fillStyle = theme.boot;
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 3;
    roundRectPathOn(targetCtx, -27 + leftStep, 88, 23, 11, 4);
    targetCtx.fill();
    targetCtx.stroke();
    roundRectPathOn(targetCtx, 4 + rightStep, 88, 23, 11, 4);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = theme.body;
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 4;
    roundRectPathOn(targetCtx, -27, 7, 54, 69, model === "teddy" ? 18 : 10);
    targetCtx.fill();
    targetCtx.stroke();

    drawCostumeBodyDetails(targetCtx, model, theme);

    targetCtx.fillStyle = theme.head;
    targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
    targetCtx.lineWidth = 4;
    if (model === "teddy") {
      targetCtx.beginPath();
      targetCtx.arc(-23, -53, 13, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.beginPath();
      targetCtx.arc(23, -53, 13, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();
    }
    targetCtx.beginPath();
    targetCtx.ellipse(0, -25, model === "teddy" ? 36 : 32, model === "skeleton" ? 35 : 37, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    drawCostumeHeadDetails(targetCtx, model, theme);
    targetCtx.restore();
  }

  function drawCostumeBodyDetails(targetCtx, model, theme) {
    targetCtx.save();
    if (model === "skeleton") {
      targetCtx.strokeStyle = theme.accent;
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.moveTo(0, 18);
      targetCtx.lineTo(0, 58);
      targetCtx.moveTo(-13, 30);
      targetCtx.lineTo(13, 30);
      targetCtx.moveTo(-15, 42);
      targetCtx.lineTo(15, 42);
      targetCtx.moveTo(-11, 56);
      targetCtx.lineTo(11, 56);
      targetCtx.stroke();
      targetCtx.restore();
      return;
    }

    if (model === "doctor") {
      targetCtx.fillStyle = "#ffffff";
      roundRectPathOn(targetCtx, -24, 11, 48, 64, 8);
      targetCtx.fill();
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.5)";
      targetCtx.lineWidth = 2;
      targetCtx.stroke();
      targetCtx.strokeStyle = theme.trim;
      targetCtx.lineWidth = 3;
      targetCtx.beginPath();
      targetCtx.moveTo(0, 15);
      targetCtx.lineTo(0, 72);
      targetCtx.stroke();
    } else if (model === "firefighter") {
      targetCtx.strokeStyle = theme.trim;
      targetCtx.lineWidth = 5;
      targetCtx.beginPath();
      targetCtx.moveTo(-22, 33);
      targetCtx.lineTo(22, 33);
      targetCtx.moveTo(-22, 58);
      targetCtx.lineTo(22, 58);
      targetCtx.stroke();
    } else if (model === "samurai") {
      targetCtx.strokeStyle = theme.trim;
      targetCtx.lineWidth = 5;
      for (let y = 20; y <= 56; y += 12) {
        targetCtx.beginPath();
        targetCtx.moveTo(-21, y);
        targetCtx.lineTo(21, y);
        targetCtx.stroke();
      }
    } else if (model === "clown") {
      targetCtx.fillStyle = theme.trim;
      targetCtx.beginPath();
      targetCtx.arc(-8, 31, 4, 0, Math.PI * 2);
      targetCtx.arc(8, 47, 4, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.fillStyle = theme.accent;
      targetCtx.beginPath();
      targetCtx.arc(8, 31, 4, 0, Math.PI * 2);
      targetCtx.arc(-8, 47, 4, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "santa") {
      targetCtx.fillStyle = theme.trim;
      roundRectPathOn(targetCtx, -5, 12, 10, 59, 3);
      targetCtx.fill();
      roundRectPathOn(targetCtx, -24, 66, 48, 8, 4);
      targetCtx.fill();
    } else if (model === "wizard") {
      targetCtx.fillStyle = theme.accent;
      for (const star of [[-10, 26], [11, 39], [-3, 55]]) {
        targetCtx.beginPath();
        targetCtx.arc(star[0], star[1], 3, 0, Math.PI * 2);
        targetCtx.fill();
      }
    } else if (model === "pirate" || model === "cowboy") {
      targetCtx.fillStyle = theme.accent;
      targetCtx.beginPath();
      targetCtx.moveTo(-24, 22);
      targetCtx.lineTo(24, 52);
      targetCtx.lineTo(18, 60);
      targetCtx.lineTo(-24, 30);
      targetCtx.closePath();
      targetCtx.fill();
    } else if (model === "diver") {
      targetCtx.fillStyle = theme.trim;
      roundRectPathOn(targetCtx, -18, 20, 36, 36, 8);
      targetCtx.fill();
      targetCtx.fillStyle = theme.accent;
      targetCtx.beginPath();
      targetCtx.arc(0, 38, 8, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "teddy") {
      targetCtx.fillStyle = theme.trim;
      targetCtx.beginPath();
      targetCtx.ellipse(0, 42, 16, 22, 0, 0, Math.PI * 2);
      targetCtx.fill();
    } else {
      targetCtx.fillStyle = theme.trim;
      roundRectPathOn(targetCtx, -17, 24, 34, 34, 7);
      targetCtx.fill();
    }
    targetCtx.restore();
  }

  function drawCostumeHeadDetails(targetCtx, model, theme) {
    targetCtx.save();
    if (model === "pirate") {
      targetCtx.fillStyle = theme.head;
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.moveTo(-36, -58);
      targetCtx.quadraticCurveTo(0, -79, 36, -58);
      targetCtx.quadraticCurveTo(18, -50, -18, -50);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.fillStyle = "rgba(5, 10, 18, 0.9)";
      targetCtx.beginPath();
      targetCtx.ellipse(9, -24, 12, 8, 0, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "wizard") {
      targetCtx.fillStyle = theme.body;
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.moveTo(-26, -55);
      targetCtx.lineTo(0, -105);
      targetCtx.lineTo(27, -55);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.fillStyle = theme.accent;
      targetCtx.beginPath();
      targetCtx.arc(0, -76, 4, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "cowboy") {
      targetCtx.fillStyle = theme.trim;
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 4;
      roundRectPathOn(targetCtx, -22, -74, 44, 22, 8);
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.beginPath();
      targetCtx.ellipse(0, -53, 43, 10, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();
    } else if (model === "ninja") {
      targetCtx.fillStyle = "rgba(5, 10, 18, 0.92)";
      roundRectPathOn(targetCtx, -23, -34, 46, 18, 6);
      targetCtx.fill();
      targetCtx.fillStyle = theme.accent;
      targetCtx.beginPath();
      targetCtx.ellipse(0, -25, 13, 5, 0, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "viking") {
      targetCtx.strokeStyle = theme.trim;
      targetCtx.lineWidth = 7;
      targetCtx.beginPath();
      targetCtx.moveTo(-26, -52);
      targetCtx.quadraticCurveTo(-55, -70, -47, -32);
      targetCtx.moveTo(26, -52);
      targetCtx.quadraticCurveTo(55, -70, 47, -32);
      targetCtx.stroke();
      targetCtx.fillStyle = "#9aa6b6";
      roundRectPathOn(targetCtx, -24, -63, 48, 19, 8);
      targetCtx.fill();
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 3;
      targetCtx.stroke();
    } else if (model === "samurai") {
      targetCtx.fillStyle = theme.head;
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.moveTo(-31, -55);
      targetCtx.quadraticCurveTo(0, -83, 31, -55);
      targetCtx.lineTo(22, -42);
      targetCtx.lineTo(-22, -42);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.fillStyle = theme.trim;
      roundRectPathOn(targetCtx, -4, -81, 8, 28, 3);
      targetCtx.fill();
    } else if (model === "diver") {
      targetCtx.strokeStyle = theme.trim;
      targetCtx.lineWidth = 7;
      targetCtx.beginPath();
      targetCtx.arc(0, -25, 24, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.fillStyle = "rgba(5, 20, 32, 0.86)";
      targetCtx.beginPath();
      targetCtx.arc(0, -25, 16, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.fillStyle = "rgba(88, 226, 255, 0.28)";
      targetCtx.beginPath();
      targetCtx.arc(6, -30, 7, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "firefighter") {
      targetCtx.fillStyle = theme.head;
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.ellipse(0, -56, 35, 14, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.fillStyle = theme.trim;
      roundRectPathOn(targetCtx, -7, -69, 14, 18, 4);
      targetCtx.fill();
    } else if (model === "doctor") {
      targetCtx.fillStyle = "#dffcff";
      roundRectPathOn(targetCtx, -25, -60, 50, 12, 5);
      targetCtx.fill();
      targetCtx.fillStyle = theme.accent;
      roundRectPathOn(targetCtx, -3, -62, 6, 16, 2);
      targetCtx.fill();
      roundRectPathOn(targetCtx, -8, -57, 16, 6, 2);
      targetCtx.fill();
    } else if (model === "clown") {
      for (const tuft of [[-24, -50, "#58e2ff"], [0, -62, "#ffd166"], [24, -50, "#ff73ad"]]) {
        targetCtx.fillStyle = tuft[2];
        targetCtx.beginPath();
        targetCtx.arc(tuft[0], tuft[1], 13, 0, Math.PI * 2);
        targetCtx.fill();
      }
      targetCtx.fillStyle = theme.accent;
      targetCtx.beginPath();
      targetCtx.arc(0, -21, 6, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "santa") {
      targetCtx.fillStyle = theme.helmet || "#c52835";
      targetCtx.strokeStyle = "rgba(23, 27, 44, 0.72)";
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.moveTo(-23, -54);
      targetCtx.quadraticCurveTo(-4, -96, 22, -62);
      targetCtx.lineTo(16, -48);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.fillStyle = theme.trim;
      roundRectPathOn(targetCtx, -28, -56, 52, 10, 5);
      targetCtx.fill();
      targetCtx.beginPath();
      targetCtx.arc(25, -62, 8, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.beginPath();
      targetCtx.ellipse(0, -4, 22, 16, 0, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (model === "skeleton") {
      targetCtx.fillStyle = "rgba(5, 10, 18, 0.86)";
      targetCtx.beginPath();
      targetCtx.ellipse(-10, -31, 6, 8, 0, 0, Math.PI * 2);
      targetCtx.ellipse(10, -31, 6, 8, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.strokeStyle = "rgba(5, 10, 18, 0.7)";
      targetCtx.lineWidth = 3;
      targetCtx.beginPath();
      targetCtx.moveTo(-10, -11);
      targetCtx.lineTo(10, -11);
      targetCtx.stroke();
    } else if (model === "teddy") {
      targetCtx.fillStyle = theme.trim;
      targetCtx.beginPath();
      targetCtx.ellipse(0, -21, 18, 13, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.fillStyle = "rgba(5, 10, 18, 0.78)";
      targetCtx.beginPath();
      targetCtx.arc(-10, -34, 3, 0, Math.PI * 2);
      targetCtx.arc(10, -34, 3, 0, Math.PI * 2);
      targetCtx.arc(0, -22, 4, 0, Math.PI * 2);
      targetCtx.fill();
    }
    targetCtx.restore();
  }

