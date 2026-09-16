  function drawSmokeCloudPuffOn(targetCtx, x, y, radius, alpha, seed, time) {
    const lobeCount = 5;
    for (let lobe = 0; lobe < lobeCount; lobe += 1) {
      const isCore = lobe === 0;
      const angle = seed * 1.73 + lobe * (Math.PI * 2 / (lobeCount - 1)) + Math.sin(time * 0.0017 + seed + lobe) * 0.24;
      const distance = isCore ? 0 : radius * (0.28 + 0.1 * Math.sin(seed * 2.1 + lobe));
      const lobeRadius = radius * (isCore ? 0.92 : 0.48 + 0.16 * Math.sin(seed + lobe * 2.4));
      const lobeX = x + Math.cos(angle) * distance;
      const lobeY = y + Math.sin(angle) * distance * 0.74;
      const smoke = targetCtx.createRadialGradient(
        lobeX - lobeRadius * 0.22,
        lobeY - lobeRadius * 0.28,
        lobeRadius * 0.06,
        lobeX,
        lobeY,
        lobeRadius
      );

      smoke.addColorStop(0, "rgba(245, 248, 250, " + (alpha * 0.94) + ")");
      smoke.addColorStop(0.38, "rgba(177, 188, 199, " + (alpha * 0.8) + ")");
      smoke.addColorStop(0.74, "rgba(82, 94, 110, " + (alpha * 0.44) + ")");
      smoke.addColorStop(1, "rgba(38, 44, 56, 0)");
      targetCtx.fillStyle = smoke;
      targetCtx.beginPath();
      targetCtx.arc(lobeX, lobeY, Math.max(1, lobeRadius), 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.strokeStyle = "rgba(222, 232, 240, " + (alpha * 0.14) + ")";
      targetCtx.lineWidth = Math.max(0.8, lobeRadius * 0.045);
      targetCtx.stroke();
    }
  }

  function smokeTrailStateForKey(ownerKey, time, trailId) {
    const key = boostTrailStateKey(ownerKey, trailId || "trail-smoke");
    let state = smokeTrailStates.get(key);
    if (!state) {
      state = {
        puffs: [],
        lastEmitTime: time - 330,
        lastSeenTime: time,
        nextSeed: 1,
        trailId: normalizedBoostTrailId(trailId || "trail-smoke")
      };
      smokeTrailStates.set(key, state);
      return state;
    }

    if (time < finiteOr(state.lastSeenTime, 0) || time - finiteOr(state.lastSeenTime, 0) > 1400) {
      state.puffs = [];
      state.lastEmitTime = time - 330;
    }
    state.lastSeenTime = time;
    state.trailId = normalizedBoostTrailId(trailId || state.trailId || "trail-smoke");
    return state;
  }

  function smokeTrailHasLivePuffs(ownerKey, time, trailId) {
    const state = smokeTrailStates.get(boostTrailStateKey(ownerKey, trailId || "trail-smoke"));
    if (!state || !Array.isArray(state.puffs)) {
      return false;
    }
    const livePuffs = [];
    for (const puff of state.puffs) {
      const age = time - finiteOr(puff.birthTime, time);
      if (age < Math.max(1, finiteOr(puff.life, 900))) {
        livePuffs.push(puff);
      }
    }
    state.puffs = livePuffs;
    return livePuffs.length > 0;
  }

  function pruneSmokeTrailStates(time) {
    if (smokeTrailStates.size <= 80) {
      return;
    }
    const oldestAllowed = time - 2400;
    for (const [key, state] of smokeTrailStates) {
      if (finiteOr(state.lastSeenTime, 0) < oldestAllowed) {
        smokeTrailStates.delete(key);
      }
    }
    while (smokeTrailStates.size > 80) {
      const first = smokeTrailStates.keys().next();
      if (first.done) {
        break;
      }
      smokeTrailStates.delete(first.value);
    }
  }

  function emitSmokeTrailPuff(state, nozzleX, nozzleY, dirAngle, boostAmount, birthTime) {
    const seed = state.nextSeed || 1;
    state.nextSeed = seed + 1;
    const dirX = Math.cos(dirAngle);
    const dirY = Math.sin(dirAngle);
    const normalX = -dirY;
    const normalY = dirX;
    const jitter = Math.sin(seed * 12.9898) * 0.5 + Math.sin(seed * 4.1414) * 0.5;
    const sideSpeed = (Math.sin(seed * 7.233) * 22) + (nozzleX < 0 ? -4 : 4);

    state.puffs.push({
      birthTime,
      life: 840 + Math.abs(Math.sin(seed * 3.712)) * 300,
      x: nozzleX + dirX * (7 + boostAmount * 3) + normalX * jitter * 4,
      y: nozzleY + dirY * (7 + boostAmount * 3) + normalY * jitter * 4,
      dirX,
      dirY,
      normalX,
      normalY,
      sideSpeed,
      speed: 66 + boostAmount * 52 + Math.abs(Math.sin(seed * 5.31)) * 18,
      radius: 9.5 + boostAmount * 3 + Math.abs(Math.sin(seed * 2.57)) * 3.4,
      boostAmount,
      seed
    });
  }

  function emitSmokeTrailPuffs(state, time, exhaust, boostAmount) {
    const emitInterval = 62;
    const nozzleY = 43;
    const exhaustDir = Math.atan2(finiteOr(exhaust.y, 1), finiteOr(exhaust.x, 0));
    let emittedSteps = 0;

    while (state.lastEmitTime + emitInterval <= time && emittedSteps < 6) {
      state.lastEmitTime += emitInterval;
      for (const nozzleX of [-17, 17]) {
        const splay = nozzleX < 0 ? -0.13 : 0.13;
        emitSmokeTrailPuff(state, nozzleX, nozzleY, exhaustDir + splay, boostAmount, state.lastEmitTime);
      }
      emittedSteps += 1;
    }

    if (emittedSteps >= 6 && state.lastEmitTime + emitInterval < time) {
      state.lastEmitTime = time;
    }
  }

  function drawSmokeTrailPuffsOn(targetCtx, state, time, boostAmount) {
    const livePuffs = [];
    for (const puff of state.puffs) {
      const age = time - finiteOr(puff.birthTime, time);
      const life = Math.max(1, finiteOr(puff.life, 900));
      const t = clamp(age / life, 0, 1);
      const puffBoost = clamp(finiteOr(puff.boostAmount, boostAmount), 0, 1);
      if (t >= 1) {
        continue;
      }
      const ageSeconds = Math.max(0, age) / 1000;
      const fadeIn = clamp(t * 5.6, 0, 1);
      const fadeOut = clamp((1 - t) * 1.22, 0, 1);
      const alpha = (0.43 + puffBoost * 0.17) * fadeIn * Math.pow(fadeOut, 0.56);
      if (alpha < 0.02) {
        puff.renderAlpha = 0;
        livePuffs.push(puff);
        continue;
      }
      const curl = Math.sin(time * 0.0031 + puff.seed * 1.77) * (3 + t * 13);
      const distance = 5 + finiteOr(puff.speed, 80) * ageSeconds + t * t * (34 + puffBoost * 18);
      const side = finiteOr(puff.sideSpeed, 0) * ageSeconds + curl;

      livePuffs.push(puff);
      puff.renderT = t;
      puff.renderX = finiteOr(puff.x, 0) + finiteOr(puff.dirX, 0) * distance + finiteOr(puff.normalX, 0) * side;
      puff.renderY = finiteOr(puff.y, 0) + finiteOr(puff.dirY, 0) * distance + finiteOr(puff.normalY, 0) * side;
      puff.renderRadius = finiteOr(puff.radius, 10) + t * (33 + puffBoost * 12);
      puff.renderAlpha = alpha;
    }

    state.puffs = livePuffs;
    livePuffs.sort(function (a, b) {
      return finiteOr(b.renderT, 0) - finiteOr(a.renderT, 0);
    });
    for (const puff of livePuffs) {
      if (!Number.isFinite(Number(puff.renderAlpha)) || puff.renderAlpha <= 0) {
        continue;
      }
      drawSmokeCloudPuffOn(
        targetCtx,
        finiteOr(puff.renderX, 0),
        finiteOr(puff.renderY, 0),
        finiteOr(puff.renderRadius, 10),
        finiteOr(puff.renderAlpha, 0),
        finiteOr(puff.seed, 0),
        time
      );
    }
  }

