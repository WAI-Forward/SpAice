"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const frontendSrc = path.join(repoRoot, "frontend", "src");
const maxChunkLines = 900;

const gameChunkNames = {
  "00-runtime-state.js": [
    "00-runtime-state-01-dom-runtime.js",
    "00-runtime-state-02-difficulty-modes.js",
    "00-runtime-state-03-objectives-render-state.js"
  ],
  "01-storage-settings-controls-01-settings-input.js": [
    "01-storage-settings-controls-01a-settings-input.js",
    "01-storage-settings-controls-01b-touch-joysticks.js"
  ],
  "01-storage-settings-controls-03-objectives-events.js": [
    "01-storage-settings-controls-03a-objective-progress.js",
    "01-storage-settings-controls-03b-random-events.js"
  ],
  "02-menu-lobby-crazygames-02-multiplayer-v2.js": [
    "02-menu-lobby-crazygames-02a-room-lifecycle.js",
    "02-menu-lobby-crazygames-02b-snapshot-sync.js",
    "02-menu-lobby-crazygames-02c-party-physics-bridge.js"
  ],
  "02-menu-lobby-crazygames-04-sdk-auth-saves.js": [
    "02-menu-lobby-crazygames-04a-platform-session.js",
    "02-menu-lobby-crazygames-04b-portal-login-transfer.js"
  ],
  "03-persistence-network-02-death-respawn.js": [
    "03-persistence-network-02a-reset-respawn-flow.js",
    "03-persistence-network-02b-player-damage-death.js"
  ],
  "04-party-physics.js": [
    "04-party-physics-01-snapshots-collisions.js",
    "04-party-physics-02-interpolation-reconciliation.js"
  ],
  "05-world-snapshots-spawns-02-world-snapshots.js": [
    "05-world-snapshots-spawns-02a-persistent-payloads.js",
    "05-world-snapshots-spawns-02b-entity-serializers.js",
    "05-world-snapshots-spawns-02c-pickup-normalizers.js"
  ],
  "05-world-snapshots-spawns-04-mobs-stars-camera.js": [
    "05-world-snapshots-spawns-04a-particles-stars.js",
    "05-world-snapshots-spawns-04b-mob-waves-camera.js"
  ],
  "06-local-physics-controls-01-world-structures.js": [
    "06-local-physics-controls-01a-coordinates-collisions.js",
    "06-local-physics-controls-01b-structure-constraints.js"
  ],
  "06-local-physics-controls-03-gadgets-particles.js": [
    "06-local-physics-controls-03a-gadget-forces.js",
    "06-local-physics-controls-03b-party-prediction.js"
  ],
  "06-local-physics-controls-04-pickups-combat-tools.js": [
    "06-local-physics-controls-04a-pickups-combat-tools.js",
    "06-local-physics-controls-04b-repairs-tool-upgrades.js"
  ],
  "07-combat-and-entities-01-projectiles-shields-structures.js": [
    "07-combat-and-entities-01a-player-weapons.js",
    "07-combat-and-entities-01b-boss-projectile-motion.js",
    "07-combat-and-entities-01c-tethers-shields.js"
  ],
  "07-combat-and-entities-03-mob-ai.js": [
    "07-combat-and-entities-03a-hostile-targeting.js",
    "07-combat-and-entities-03b-special-mob-updates.js"
  ],
  "07-combat-and-entities-04-draw-bodies-mobs.js": [
    "07-combat-and-entities-04a-body-textures.js",
    "07-combat-and-entities-04b-mob-boss-drawing.js"
  ],
  "08-render-hud-map-02-remote-rendering.js": [
    "08-render-hud-map-02a-remote-universes.js",
    "08-render-hud-map-02b-remote-player-aim.js"
  ],
  "08-render-hud-map-03-player-rendering.js": [
    "08-render-hud-map-03a-gadget-player-drawing.js",
    "08-render-hud-map-03b-emp-remote-drawing.js"
  ],
  "08-render-hud-map-04-map-hud.js": [
    "08-render-hud-map-04a-status-map-hud.js",
    "08-render-hud-map-04b-developer-metrics.js"
  ],
  "09-game-loop-events-test-harness.js": [
    "09-game-loop-events-01-simulation-steps.js",
    "09-game-loop-events-02-test-harness.js",
    "09-game-loop-events-03-browser-events-startup.js"
  ]
};

const mpV2ChunkNames = [
  "00-wrapper-constants-tools.js",
  "01-player-energy-body-utils.js",
  "02-spacecraft-normalization.js",
  "03-random-event-selection.js",
  "04-random-event-spawns.js",
  "05-duel-and-mob-targeting.js",
  "06-landed-player-physics.js",
  "07-particle-merging.js",
  "08-ambient-pickups.js",
  "09-ufo-behavior.js",
  "10-disabled-mob-drift.js",
  "11-projectile-guidance.js",
  "12-boss-pressure-serialization.js"
];

function readLines(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

function writeLines(filePath, lines) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function isBundleBoundary(line) {
  return (
    /^  (?:async\s+function|function|const|let|var|class)\b/.test(line) ||
    /^  (?:if\s*\(|window\.addEventListener|document\.addEventListener|canvas\.addEventListener)\b/.test(line) ||
    /^  return \{/.test(line) ||
    /^\}\(\)\);/.test(line) ||
    /^\}\)/.test(line)
  );
}

function splitLines(lines) {
  const chunks = [];
  let start = 0;

  while (start < lines.length) {
    const remaining = lines.length - start;
    if (remaining <= maxChunkLines) {
      chunks.push(lines.slice(start));
      break;
    }

    let cut = -1;
    const target = Math.min(lines.length, start + maxChunkLines);

    for (let index = target; index > start + 80; index -= 1) {
      if (isBundleBoundary(lines[index])) {
        cut = index;
        break;
      }
    }

    if (cut < 0) {
      for (let index = target; index < Math.min(lines.length, target + 220); index += 1) {
        if (isBundleBoundary(lines[index])) {
          cut = index;
          break;
        }
      }
    }

    if (cut < 0 || cut === start) {
      throw new Error(`Could not find a declaration boundary near line ${start + maxChunkLines}.`);
    }

    chunks.push(lines.slice(start, cut));
    start = cut;
  }

  return chunks;
}

function splitNamedFile(sourcePath, targetDir, names, removeSource) {
  const lines = readLines(sourcePath);
  const chunks = splitLines(lines);

  if (chunks.length !== names.length) {
    throw new Error(`${path.relative(repoRoot, sourcePath)} split into ${chunks.length} chunks, expected ${names.length}.`);
  }

  chunks.forEach((chunk, index) => {
    if (chunk.length > 1000) {
      throw new Error(`${names[index]} has ${chunk.length} lines.`);
    }
    writeLines(path.join(targetDir, names[index]), chunk);
  });

  if (removeSource) {
    fs.unlinkSync(sourcePath);
  }

  console.log(`Split ${path.relative(repoRoot, sourcePath)} into ${chunks.length} files.`);
}

function splitGameSources() {
  const gameDir = path.join(frontendSrc, "game");

  for (const [sourceName, names] of Object.entries(gameChunkNames)) {
    const sourcePath = path.join(gameDir, sourceName);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    splitNamedFile(sourcePath, gameDir, names, true);
  }
}

function splitMpV2SimSource() {
  const sourcePath = path.join(frontendSrc, "mp-v2-sim.js");
  const partsDir = path.join(frontendSrc, "mp-v2-sim");

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing ${path.relative(repoRoot, sourcePath)}.`);
  }

  if (fs.existsSync(partsDir) && fs.readdirSync(partsDir).some((entry) => entry.endsWith(".js"))) {
    console.log(`Skipped ${path.relative(repoRoot, partsDir)} because it already has source parts.`);
    return;
  }

  splitNamedFile(sourcePath, partsDir, mpV2ChunkNames, false);
}

splitGameSources();
splitMpV2SimSource();
