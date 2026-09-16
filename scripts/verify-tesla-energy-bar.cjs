"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "artifacts", "tesla-energy-bar");
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = Number(process.env.CDP_PORT || (9400 + Math.floor(Math.random() * 400)));
const url = process.env.TEST_URL || "http://127.0.0.1:3000/";
const viewport = { width: 480, height: 640 };

fs.mkdirSync(outDir, { recursive: true });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(endpoint) {
  return new Promise((resolve, reject) => {
    const request = http.get(endpoint, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
  });
}

async function waitForJson(endpoint, timeoutMs) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      return await getJson(endpoint);
    } catch (error) {
      lastError = error;
      await delay(100);
    }
  }
  throw lastError || new Error("Timed out waiting for " + endpoint);
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message || JSON.stringify(message.error)));
        } else {
          resolve(message.result || {});
        }
        return;
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) {
          listener(message.params || {});
        }
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const listeners = this.listeners.get(method) || [];
        this.listeners.set(method, listeners.filter((entry) => entry !== listener));
        resolve(params);
      };
      if (!this.listeners.has(method)) {
        this.listeners.set(method, []);
      }
      this.listeners.get(method).push(listener);
    });
  }
}

async function connectWebSocket(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return new CdpClient(socket);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result ? result.result.value : undefined;
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true
  });
  const filePath = path.join(outDir, name);
  fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

async function runAttempt(cdp, attempt) {
  const beforeSetup = await evaluate(cdp, `(() => {
    const h = window.__clusternautsTestHarness;
    h.startRun({
      difficulty: "medium",
      viewport: ${JSON.stringify(viewport)},
      input: { keys: [], mouse: { x: ${viewport.width * 0.72}, y: ${viewport.height * 0.5}, left: false, middle: false, right: false } }
    });
    h.setPlayerState({ x: 0, y: 0, vx: 0, vy: 0, health: 100, maxHealth: 100, energy: 82, maxEnergy: 100, hitCooldown: 0, cameraRoll: 0, toolDisabledTimer: 0 });
    h.setParticles([]);
    h.setTeslas([{
      id: 1,
      x: 0,
      y: -430,
      vx: 0,
      vy: 0,
      radius: 32,
      health: 150,
      maxHealth: 150,
      color: { r: 157, g: 255, b: 122 },
      shootCooldown: 0,
      lightningWarmup: 1,
      lightningFlash: 0,
      rotation: Math.PI,
      lightningAngle: Math.PI / 2,
      strafeSign: 1
    }]);
    return h.frame(1 / 60);
  })()`);

  const before = await screenshot(cdp, `attempt-${attempt}-before-tesla-hit.png`);
  let afterSnapshot = beforeSetup;
  let hitFrame = -1;

  for (let frame = 0; frame < 240; frame += 1) {
    afterSnapshot = await evaluate(cdp, `window.__clusternautsTestHarness.frame(1 / 60)`);
    if (afterSnapshot && afterSnapshot.player && afterSnapshot.player.toolDisabledTimer > 0) {
      hitFrame = frame + 1;
      break;
    }
  }

  const after = await screenshot(cdp, `attempt-${attempt}-after-tesla-hit.png`);
  const pixels = await evaluate(cdp, `(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const scaleX = canvas.width / window.innerWidth;
    const scaleY = canvas.height / window.innerHeight;
    const x = Math.round((window.innerWidth / 2 - 48) * scaleX);
    const y = Math.round((window.innerHeight / 2 + 116) * scaleY);
    const w = Math.round(116 * scaleX);
    const h = Math.round(28 * scaleY);
    const data = ctx.getImageData(x, y, w, h).data;
    let red = 0;
    let green = 0;
    let bright = 0;
    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      if (a > 120 && r > 170 && g < 95 && b < 110) red += 1;
      if (a > 120 && g > 120 && r < 150 && b < 140) green += 1;
      if (a > 120 && (r > 120 || g > 120 || b > 120)) bright += 1;
    }
    return { red, green, bright, region: { x, y, w, h }, width: canvas.width, height: canvas.height };
  })()`);

  return {
    attempt,
    before,
    after,
    hitFrame,
    passed: hitFrame > 0 && pixels.red > Math.max(24, pixels.green * 1.8),
    pixels,
    beforeToolDisabledTimer: beforeSetup.player.toolDisabledTimer,
    afterToolDisabledTimer: afterSnapshot.player.toolDisabledTimer,
    afterRenderStatus: afterSnapshot.renderStatus && afterSnapshot.renderStatus.playerEnergyBar,
    projectileCount: afterSnapshot.rivalProjectiles ? afterSnapshot.rivalProjectiles.length : null
  };
}

(async () => {
  console.error("[tesla-verify] starting");
  if (!fs.existsSync(chromePath)) {
    throw new Error("Chrome not found at " + chromePath);
  }

  const userDataDir = path.join(outDir, "chrome-profile-" + Date.now());
  const chrome = childProcess.spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + userDataDir,
    "--window-size=" + viewport.width + "," + viewport.height,
    "about:blank"
  ], {
    stdio: ["ignore", "ignore", "pipe"]
  });

  let stderr = "";
  const keepAlive = setInterval(() => {}, 1000);
  chrome.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    console.error("[tesla-verify] waiting for chrome");
    const tabs = await waitForJson("http://127.0.0.1:" + port + "/json", 10000);
    console.error("[tesla-verify] tabs=" + tabs.length);
    const target = tabs.find((tab) => tab.type === "page") || tabs[0];
    const cdp = await connectWebSocket(target.webSocketDebuggerUrl);
    console.error("[tesla-verify] connected");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: "window.__CLUSTERNAUTS_TEST__ = { skipAutoStart: true };"
    });
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url });
    await loaded;
    console.error("[tesla-verify] loaded");

    let ready = false;
    for (let i = 0; i < 50; i += 1) {
      ready = await evaluate(cdp, `Boolean(window.__clusternautsTestHarness && document.getElementById("game"))`);
      if (ready) break;
      await delay(100);
    }
    if (!ready) {
      throw new Error("Clusternauts harness was not ready in Chrome");
    }
    console.error("[tesla-verify] harness ready");

    const results = [];
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      console.error("[tesla-verify] attempt " + attempt);
      const result = await runAttempt(cdp, attempt);
      results.push(result);
      if (result.passed) break;
    }

    console.log(JSON.stringify({ ok: results.some((result) => result.passed), results }, null, 2));
  } finally {
    clearInterval(keepAlive);
    chrome.kill();
    if (stderr && process.env.VERBOSE_CHROME) {
      console.error(stderr);
    }
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
