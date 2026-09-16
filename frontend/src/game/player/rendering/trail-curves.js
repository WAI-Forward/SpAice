  function orderedTrailPuffs(livePuffs, minAlpha) {
    const points = [];
    for (const puff of livePuffs) {
      const alpha = finiteOr(puff.renderAlpha, 0);
      if (alpha <= finiteOr(minAlpha, 0.02)) {
        continue;
      }
      points.push(puff);
    }
    points.sort(function (a, b) {
      return finiteOr(a.renderT, 0) - finiteOr(b.renderT, 0);
    });
    return points;
  }

  function trailPuffGroupsByNozzle(livePuffs) {
    const left = [];
    const right = [];
    for (const puff of orderedTrailPuffs(livePuffs, 0.02)) {
      const nozzleX = Number.isFinite(Number(puff.nozzleX)) ? Number(puff.nozzleX) : finiteOr(puff.x, 0);
      if (nozzleX < 0) {
        left.push(puff);
      } else {
        right.push(puff);
      }
    }
    return [left, right].filter(function (group) {
      return group.length >= 2;
    });
  }

  function trailCenterlinePoints(livePuffs, bucketCount) {
    const ordered = orderedTrailPuffs(livePuffs, 0.02);
    const count = Math.max(4, Math.min(18, Math.floor(finiteOr(bucketCount, 12))));
    const buckets = [];
    for (let i = 0; i < count; i += 1) {
      buckets.push({ x: 0, y: 0, t: 0, alpha: 0, count: 0 });
    }
    for (const puff of ordered) {
      const index = clamp(Math.floor(finiteOr(puff.renderT, 0) * (count - 1)), 0, count - 1);
      const bucket = buckets[index];
      const alpha = Math.max(0.001, finiteOr(puff.renderAlpha, 0));
      bucket.x += finiteOr(puff.renderX, 0) * alpha;
      bucket.y += finiteOr(puff.renderY, 0) * alpha;
      bucket.t += finiteOr(puff.renderT, 0) * alpha;
      bucket.alpha += alpha;
      bucket.count += 1;
    }
    const points = [];
    for (const bucket of buckets) {
      if (bucket.count <= 0 || bucket.alpha <= 0) {
        continue;
      }
      points.push({
        x: bucket.x / bucket.alpha,
        y: bucket.y / bucket.alpha,
        t: bucket.t / bucket.alpha,
        alpha: clamp(bucket.alpha / Math.max(1, bucket.count), 0, 1)
      });
    }
    return points;
  }

  function trailPointX(point) {
    return Number.isFinite(Number(point && point.renderX)) ? Number(point.renderX) : finiteOr(point && point.x, 0);
  }

  function trailPointY(point) {
    return Number.isFinite(Number(point && point.renderY)) ? Number(point.renderY) : finiteOr(point && point.y, 0);
  }

  function trailPointT(point) {
    return Number.isFinite(Number(point && point.renderT)) ? Number(point.renderT) : finiteOr(point && point.t, 0);
  }

  function trailNormalAtPoint(points, index) {
    if (!points || points.length < 2) {
      return { x: 0, y: 1 };
    }
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = trailPointX(next) - trailPointX(previous);
    const dy = trailPointY(next) - trailPointY(previous);
    const length = Math.hypot(dx, dy);
    if (length <= 0.001) {
      return { x: 0, y: 1 };
    }
    return { x: -dy / length, y: dx / length };
  }

  function drawTrailCurveOn(targetCtx, points, lineWidth, strokeStyle, options) {
    const config = options && typeof options === "object" ? options : {};
    if (!points || points.length < 2) {
      return;
    }
    const offset = finiteOr(config.offset, 0);
    const wave = finiteOr(config.wave, 0);
    const phase = finiteOr(config.phase, 0);
    targetCtx.strokeStyle = strokeStyle;
    targetCtx.lineWidth = Math.max(0.2, finiteOr(lineWidth, 1));
    targetCtx.lineCap = config.lineCap || "round";
    targetCtx.lineJoin = config.lineJoin || "round";
    targetCtx.beginPath();
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const normal = trailNormalAtPoint(points, index);
      const waveOffset = wave !== 0 ? Math.sin(trailPointT(point) * Math.PI * 5 + phase) * wave : 0;
      const x = trailPointX(point) + normal.x * (offset + waveOffset);
      const y = trailPointY(point) + normal.y * (offset + waveOffset);
      if (index === 0) {
        targetCtx.moveTo(x, y);
      } else {
        targetCtx.lineTo(x, y);
      }
    }
    targetCtx.stroke();
  }

  function smoothedTrailPoints(points, passes) {
    if (!Array.isArray(points) || points.length < 3) {
      return Array.isArray(points) ? points.slice() : [];
    }
    let smoothed = points.map(function (point) {
      return {
        x: trailPointX(point),
        y: trailPointY(point),
        t: trailPointT(point),
        alpha: finiteOr(point && point.alpha, finiteOr(point && point.renderAlpha, 1))
      };
    });
    const passCount = Math.max(1, Math.floor(finiteOr(passes, 1)));
    for (let pass = 0; pass < passCount; pass += 1) {
      const next = [smoothed[0]];
      for (let index = 1; index < smoothed.length - 1; index += 1) {
        const previous = smoothed[index - 1];
        const current = smoothed[index];
        const following = smoothed[index + 1];
        next.push({
          x: previous.x * 0.24 + current.x * 0.52 + following.x * 0.24,
          y: previous.y * 0.24 + current.y * 0.52 + following.y * 0.24,
          t: current.t,
          alpha: current.alpha
        });
      }
      next.push(smoothed[smoothed.length - 1]);
      smoothed = next;
    }
    return smoothed;
  }

  function transformedTrailPoint(points, index, options) {
    const config = options && typeof options === "object" ? options : {};
    const point = points[index];
    const normal = trailNormalAtPoint(points, index);
    const wave = finiteOr(config.wave, 0);
    const phase = finiteOr(config.phase, 0);
    const offset = finiteOr(config.offset, 0);
    const waveOffset = wave !== 0 ? Math.sin(trailPointT(point) * Math.PI * 4 + phase) * wave : 0;
    return {
      x: trailPointX(point) + normal.x * (offset + waveOffset),
      y: trailPointY(point) + normal.y * (offset + waveOffset)
    };
  }

  function drawSmoothTrailCurveOn(targetCtx, points, lineWidth, strokeStyle, options) {
    const config = options && typeof options === "object" ? options : {};
    if (!points || points.length < 2) {
      return;
    }
    targetCtx.strokeStyle = strokeStyle;
    targetCtx.lineWidth = Math.max(0.2, finiteOr(lineWidth, 1));
    targetCtx.lineCap = config.lineCap || "round";
    targetCtx.lineJoin = config.lineJoin || "round";
    targetCtx.beginPath();
    const first = transformedTrailPoint(points, 0, config);
    targetCtx.moveTo(first.x, first.y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = transformedTrailPoint(points, index, config);
      const following = transformedTrailPoint(points, index + 1, config);
      targetCtx.quadraticCurveTo(current.x, current.y, (current.x + following.x) / 2, (current.y + following.y) / 2);
    }
    const last = transformedTrailPoint(points, points.length - 1, config);
    targetCtx.lineTo(last.x, last.y);
    targetCtx.stroke();
  }

  function drawTaperedTrailRibbonOn(targetCtx, points, options) {
    const config = options && typeof options === "object" ? options : {};
    if (!points || points.length < 2) {
      return;
    }

    const sourceWidth = finiteOr(config.sourceWidth, 3);
    const fanWidth = finiteOr(config.fanWidth, 10);
    const fanPower = Math.max(0.1, finiteOr(config.fanPower, 0.7));
    const wave = finiteOr(config.wave, 0);
    const phase = finiteOr(config.phase, 0);
    const left = [];
    const right = [];

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const t = clamp(trailPointT(point), 0, 1);
      const normal = trailNormalAtPoint(points, index);
      const width = sourceWidth + fanWidth * Math.pow(t, fanPower);
      const ripple = wave !== 0 ? Math.sin(t * Math.PI * 5 + phase) * wave * (0.25 + t * 0.75) : 0;
      const x = trailPointX(point);
      const y = trailPointY(point);
      left.push({
        x: x + normal.x * (width + ripple),
        y: y + normal.y * (width + ripple)
      });
      right.push({
        x: x - normal.x * (width - ripple * 0.45),
        y: y - normal.y * (width - ripple * 0.45)
      });
    }

    targetCtx.fillStyle = config.fillStyle || "rgba(80, 220, 255, 0.4)";
    targetCtx.beginPath();
    targetCtx.moveTo(left[0].x, left[0].y);
    for (let index = 1; index < left.length; index += 1) {
      targetCtx.lineTo(left[index].x, left[index].y);
    }
    for (let index = right.length - 1; index >= 0; index -= 1) {
      targetCtx.lineTo(right[index].x, right[index].y);
    }
    targetCtx.closePath();
    targetCtx.fill();
  }

  function waterStreamWidthAt(t, sourceWidth, midWidth, tailWidth) {
    const age = clamp(t, 0, 1);
    const swell = Math.sin(age * Math.PI);
    return Math.max(0.4, finiteOr(sourceWidth, 4) * (1 - age) + finiteOr(tailWidth, 2) * age + finiteOr(midWidth, 8) * swell);
  }

  function transformedWaterStreamPoint(points, index, time, options) {
    const config = options && typeof options === "object" ? options : {};
    const point = points[index];
    const normal = trailNormalAtPoint(points, index);
    const t = clamp(trailPointT(point), 0, 1);
    const wave = finiteOr(config.wave, 0);
    const offset = finiteOr(config.offset, 0);
    const phase = finiteOr(config.phase, 0);
    const ripple = Math.sin(t * Math.PI * 6.5 - time * 0.012 + phase) * wave * (0.35 + t * 0.65);
    const shimmer = Math.sin(t * Math.PI * 13 + time * 0.018 + phase * 0.7) * wave * 0.18;
    return {
      x: trailPointX(point) + normal.x * (offset + ripple + shimmer),
      y: trailPointY(point) + normal.y * (offset + ripple + shimmer)
    };
  }

  function drawWaterStreamStrokeOn(targetCtx, points, time, options) {
    const config = options && typeof options === "object" ? options : {};
    if (!points || points.length < 2) {
      return;
    }

    targetCtx.lineCap = "round";
    targetCtx.lineJoin = "round";
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const t = clamp((trailPointT(previous) + trailPointT(current)) * 0.5, 0, 1);
      const fade = clamp((1 - t) * 1.32, 0, 1);
      if (fade <= 0.01) {
        continue;
      }
      const start = transformedWaterStreamPoint(points, index - 1, time, config);
      const end = transformedWaterStreamPoint(points, index, time, config);
      const sourceWidth = finiteOr(config.sourceWidth, 4);
      const midWidth = finiteOr(config.midWidth, 7);
      const tailWidth = finiteOr(config.tailWidth, 1.5);
      targetCtx.strokeStyle = config.colorFn
        ? config.colorFn(t, fade)
        : rgbaColor(92, 213, 255, finiteOr(config.alpha, 0.6) * fade);
      targetCtx.lineWidth = waterStreamWidthAt(t, sourceWidth, midWidth, tailWidth);
      targetCtx.beginPath();
      targetCtx.moveTo(start.x, start.y);
      targetCtx.quadraticCurveTo(
        (start.x + end.x) * 0.5,
        (start.y + end.y) * 0.5,
        end.x,
        end.y
      );
      targetCtx.stroke();
    }
  }

  function drawPixelSparkOn(targetCtx, x, y, size, alpha) {
    const pixel = Math.max(1, finiteOr(size, 2));
    targetCtx.fillStyle = rgbaColor(255, 255, 255, alpha);
    targetCtx.fillRect(x - pixel * 0.5, y - pixel * 0.5, pixel, pixel);
    targetCtx.fillRect(x - pixel * 1.7, y - pixel * 0.5, pixel, pixel);
    targetCtx.fillRect(x + pixel * 0.7, y - pixel * 0.5, pixel, pixel);
    targetCtx.fillRect(x - pixel * 0.5, y - pixel * 1.7, pixel, pixel);
    targetCtx.fillRect(x - pixel * 0.5, y + pixel * 0.7, pixel, pixel);
  }

  function drawMagicLightSparkOn(targetCtx, x, y, size, alpha, hue) {
    const sparkSize = Math.max(1, finiteOr(size, 3));
    const glow = targetCtx.createRadialGradient(x, y, 0, x, y, sparkSize * 2.8);
    glow.addColorStop(0, hslaColor(hue, 100, 92, alpha));
    glow.addColorStop(0.42, hslaColor(hue + 34, 96, 74, alpha * 0.45));
    glow.addColorStop(1, hslaColor(hue + 68, 94, 55, 0));
    targetCtx.fillStyle = glow;
    targetCtx.beginPath();
    targetCtx.arc(x, y, sparkSize * 2.8, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.strokeStyle = hslaColor(hue, 100, 94, alpha * 0.92);
    targetCtx.lineWidth = Math.max(0.8, sparkSize * 0.18);
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(x - sparkSize, y);
    targetCtx.lineTo(x + sparkSize, y);
    targetCtx.moveTo(x, y - sparkSize);
    targetCtx.lineTo(x, y + sparkSize);
    targetCtx.stroke();
  }

  function drawBatBackdropTrailOn(targetCtx, livePuffs, time) {
    const points = trailCenterlinePoints(livePuffs, 11);
    if (points.length < 2) {
      return;
    }
    targetCtx.save();
    targetCtx.globalCompositeOperation = "lighter";
    drawTrailCurveOn(targetCtx, points, 32, "rgba(169, 133, 255, 0.16)", { wave: 7, phase: time * 0.004 });
    drawTrailCurveOn(targetCtx, points, 18, "rgba(224, 196, 255, 0.13)", { wave: 4, phase: time * 0.006 + 1.2 });
    for (let i = 0; i < points.length; i += 2) {
      const point = points[i];
      const radius = 16 + Math.sin(time * 0.004 + i) * 3;
      const glow = targetCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 1.8);
      glow.addColorStop(0, "rgba(190, 152, 255, 0.22)");
      glow.addColorStop(0.5, "rgba(116, 91, 200, 0.14)");
      glow.addColorStop(1, "rgba(55, 42, 100, 0)");
      targetCtx.fillStyle = glow;
      targetCtx.beginPath();
      targetCtx.arc(point.x, point.y, radius * 1.8, 0, Math.PI * 2);
      targetCtx.fill();
    }
    targetCtx.restore();
  }

