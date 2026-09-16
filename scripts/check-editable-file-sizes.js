"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const maxLines = Math.max(1, Math.floor(Number(process.env.CLUSTERNAUTS_MAX_SOURCE_LINES) || 500));
const extensions = new Set([".js", ".cjs", ".css", ".html"]);
const excludedDirs = new Set([".git", ".idea", "node_modules", "assets", "CrazyGames", "Itch", "GamePix", "artifacts", "data"]);
const excludedFiles = new Set([
  path.join("frontend", "index.html"),
  path.join("frontend", "src", "game.js"),
  path.join("frontend", "src", "mp-v2-sim.js"),
  path.join("frontend", "styles.css"),
  "index.html",
  "styles.css",
  path.join("src", "game.js"),
  path.join("src", "mp-v2-sim.js")
]);

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function isExcludedFile(filePath) {
  const relative = path.relative(repoRoot, filePath);
  return excludedFiles.has(relative);
}

function visit(dir, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) {
        visit(path.join(dir, entry.name), results);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (isExcludedFile(filePath) || !extensions.has(path.extname(entry.name))) {
      continue;
    }

    const sourceLines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    if (sourceLines[sourceLines.length - 1] === "") {
      sourceLines.pop();
    }
    const lines = sourceLines.length;
    if (lines > maxLines) {
      results.push({ filePath, lines });
    }
  }
}

const oversized = [];
visit(repoRoot, oversized);

if (oversized.length) {
  oversized.sort((a, b) => b.lines - a.lines || relativePath(a.filePath).localeCompare(relativePath(b.filePath)));
  console.error(`Editable source files over ${maxLines} lines:`);
  for (const entry of oversized) {
    console.error(`${String(entry.lines).padStart(5)} ${relativePath(entry.filePath)}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Editable source file size check passed: no files over ${maxLines} lines.`);
}
