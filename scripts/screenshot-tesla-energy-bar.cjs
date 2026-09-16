"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "artifacts", "tesla-energy-bar");
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewport = { width: 480, height: 640 };

fs.mkdirSync(outDir, { recursive: true });

function scenarioScript(phase) {
  return `
    <script>
      window.__CLUSTERNAUTS_TEST__ = { skipAutoStart: true };
      window.__TESLA_VISUAL_PHASE__ = ${JSON.stringify(phase)};
      window.addEventListener("DOMContentLoaded", function () {
        function markStatus(text) {
          var status = document.getElementById("teslaVisualStatus");
          if (!status) {
            status = document.createElement("div");
            status.id = "teslaVisualStatus";
            status.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 6px;background:rgba(0,0,0,.72);color:#fff;font:12px monospace;pointer-events:none";
            document.body.appendChild(status);
          }
          status.textContent = text;
        }
        markStatus("boot");
        var h = window.__clusternautsTestHarness;
        if (!h) {
          document.body.dataset.teslaVisualStatus = "missing-harness";
          markStatus("missing-harness");
          return;
        }
        h.startRun({
          difficulty: "medium",
          cameraZoom: 1,
          viewport: { width: ${viewport.width}, height: ${viewport.height} },
          input: { keys: [], mouse: { x: ${Math.round(viewport.width * 0.72)}, y: ${Math.round(viewport.height * 0.5)}, left: false, middle: false, right: false } }
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
        var snap = h.frame(1 / 60);
        if (${JSON.stringify(phase)} === "after") {
          for (var frame = 0; frame < 240; frame += 1) {
            snap = h.frame(1 / 60);
            if (snap.player.toolDisabledTimer > 0) {
              break;
            }
          }
        }
        document.body.dataset.teslaVisualStatus = snap.player.toolDisabledTimer > 0 ? "disabled" : "enabled";
        document.body.dataset.teslaVisualTimer = String(snap.player.toolDisabledTimer || 0);
        document.body.dataset.teslaVisualFill = snap.renderStatus && snap.renderStatus.playerEnergyBar && snap.renderStatus.playerEnergyBar.colors
          ? snap.renderStatus.playerEnergyBar.colors.fillStart
          : "";
        var canvas = document.getElementById("game");
        if (canvas) {
          var copy = document.getElementById("teslaCanvasCopy");
          if (!copy) {
            copy = document.createElement("img");
            copy.id = "teslaCanvasCopy";
            copy.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:9000;pointer-events:none";
            document.body.appendChild(copy);
          }
          copy.src = canvas.toDataURL("image/png");
        }
        markStatus(document.body.dataset.teslaVisualStatus + " " + document.body.dataset.teslaVisualFill + " " + document.body.dataset.teslaVisualTimer + " zoom=" + snap.player.cameraZoom);
      });
    </script>`;
}

function makePage(phase) {
  const source = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const baseHref = pathToFileURL(root + path.sep).href;
  const injected = source.replace("<head>", "<head><base href=\"" + baseHref + "\">" + scenarioScript(phase));
  const filePath = path.join(outDir, "tesla-" + phase + ".html");
  fs.writeFileSync(filePath, injected);
  return filePath;
}

function runChromeScreenshot(pagePath, outPath, phase) {
  const userDataDir = path.join(outDir, "chrome-shot-profile-" + phase + "-" + Date.now());
  const pageUrl = pathToFileURL(pagePath).href;
  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-accelerated-2d-canvas",
    "--disable-features=CanvasOopRasterization,Accelerated2dCanvas",
    "--disable-software-rasterizer=false",
    "--disable-dev-shm-usage",
    "--use-angle=swiftshader",
    "--use-gl=swiftshader",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--disable-background-networking",
    "--user-data-dir=" + userDataDir,
    "--window-size=" + viewport.width + "," + viewport.height,
    "--screenshot=" + outPath,
    "--virtual-time-budget=10000",
    pageUrl
  ];
  const result = childProcess.spawnSync(chromePath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 30000
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error("Chrome screenshot failed: " + (result.stderr || result.stdout));
  }
}

for (const phase of ["before", "after"]) {
  const page = makePage(phase);
  const shot = path.join(outDir, "attempt-cli-" + phase + "-tesla-hit.png");
  runChromeScreenshot(page, shot, phase);
  console.log(phase + "=" + shot);
}
