"use strict";

const fs = require("fs");
const path = require("path");
const { readGameSource, readHtmlSource, readSourceBundle, readStyleSource, writeGameBundle, writeSourceBundle } = require("./game-bundle");

const repoRoot = path.resolve(__dirname, "..");
const frontendRoot = path.join(repoRoot, "frontend");
const validTargets = new Set(["all", "render", "crazygames", "itch", "gamepix"]);
const requestedTarget = (process.argv[2] || "all").toLowerCase();
const defaultCrazyGamesBackendOrigin = "https://clusternauts-806779816452.us-central1.run.app";
const defaultItchBackendOrigin = defaultCrazyGamesBackendOrigin;
const defaultGamePixBackendOrigin = defaultCrazyGamesBackendOrigin;

if (!validTargets.has(requestedTarget)) {
  console.error("Usage: node scripts/build-platforms.js [all|render|crazygames|itch|gamepix]");
  process.exit(1);
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

function contentHash(...parts) {
  return require("crypto")
    .createHash("sha256")
    .update(parts.join("\n"))
    .digest("hex")
    .slice(0, 12);
}

function renderTemplate(content, platform) {
  let rendered = content.replace(
    /^[ \t]*<!-- build:([a-z]+):start -->\r?\n?([\s\S]*?)^[ \t]*<!-- build:\1:end -->\r?\n?/gm,
    function replacePlatformBlock(_match, blockPlatform, blockContent) {
      return shouldIncludeBuildBlock(blockPlatform, platform) ? blockContent : "";
    }
  );

  rendered = rendered.replace(
    /^[ \t]*\/\/ build:([a-z]+):start\r?\n?([\s\S]*?)^[ \t]*\/\/ build:\1:end\r?\n?/gm,
    function replacePlatformLineCommentBlock(_match, blockPlatform, blockContent) {
      return shouldIncludeBuildBlock(blockPlatform, platform) ? blockContent : "";
    }
  );

  rendered = rendered.replace(
    /^[ \t]*\/\* build:([a-z]+):start \*\/\r?\n?([\s\S]*?)^[ \t]*\/\* build:\1:end \*\/\r?\n?/gm,
    function replacePlatformBlockCommentBlock(_match, blockPlatform, blockContent) {
      return shouldIncludeBuildBlock(blockPlatform, platform) ? blockContent : "";
    }
  );

  if (platform !== "crazygames" && platform !== "gamepix") {
    if (platform === "itch") {
      const backendOrigin = String(process.env.CLUSTERNAUTS_ITCH_BACKEND_ORIGIN || process.env.CLUSTERNAUTS_BACKEND_ORIGIN || defaultItchBackendOrigin).replace(/\/+$/, "");
      if (backendOrigin && !/^https:\/\/[^/]+(?:\/.*)?$/i.test(backendOrigin)) {
        throw new Error("Itch builds require CLUSTERNAUTS_ITCH_BACKEND_ORIGIN to be an https URL when set.");
      }
      const backendScript = backendOrigin ? `      window.CLUSTERNAUTS_BACKEND_ORIGIN = ${JSON.stringify(backendOrigin)};\n` : "";
      return rendered.replace(/^[ \t]*\/\/ __CLUSTERNAUTS_ITCH_BACKEND_ORIGIN__\r?\n?/gm, backendScript);
    }
    return rendered;
  }

  const backendOrigin = String(
    platform === "gamepix"
      ? process.env.CLUSTERNAUTS_GAMEPIX_BACKEND_ORIGIN || process.env.CLUSTERNAUTS_BACKEND_ORIGIN || defaultGamePixBackendOrigin
      : process.env.CLUSTERNAUTS_BACKEND_ORIGIN || defaultCrazyGamesBackendOrigin
  ).replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+(?:\/.*)?$/i.test(backendOrigin)) {
    throw new Error(`${platform === "gamepix" ? "GamePix" : "CrazyGames"} builds require a backend origin to be an https URL.`);
  }
  return rendered.replace(/"__CLUSTERNAUTS_BACKEND_ORIGIN__"/g, JSON.stringify(backendOrigin));
}

function shouldIncludeBuildBlock(blockPlatform, platform) {
  return blockPlatform === platform ||
    (blockPlatform === "backend" && (platform === "render" || platform === "itch")) ||
    (blockPlatform === "render" && platform === "itch");
}

function buildPlatform(platform, targetRoot) {
  const indexTemplate = readHtmlSource(frontendRoot);
  const rawStylesContent = readStyleSource(frontendRoot);
  const stylesContent = renderTemplate(rawStylesContent, platform);
  const rawGameSource = readGameSource(frontendRoot);
  const gameSource = renderTemplate(rawGameSource, platform);
  const rawMpV2SimSource = readSourceBundle(frontendRoot, "mp-v2-sim");
  const mpV2SimSource = renderTemplate(rawMpV2SimSource, platform);
  const clientBuild = contentHash(platform, stylesContent, gameSource, mpV2SimSource);
  const indexContent = renderTemplate(indexTemplate, platform).replace(/__CLUSTERNAUTS_CLIENT_BUILD__/g, clientBuild);

  writeText(path.join(frontendRoot, "index.html"), indexTemplate);
  writeText(path.join(frontendRoot, "styles.css"), rawStylesContent);
  writeText(path.join(frontendRoot, "src", "game.js"), rawGameSource);
  writeText(path.join(frontendRoot, "src", "mp-v2-sim.js"), rawMpV2SimSource);
  writeText(path.join(targetRoot, "index.html"), indexContent);
  writeText(path.join(targetRoot, "styles.css"), stylesContent);
  writeSourceBundle(frontendRoot, targetRoot, "mp-v2-sim", mpV2SimSource);
  writeGameBundle(frontendRoot, targetRoot, gameSource);
  copyDirectory(path.join(frontendRoot, "assets"), path.join(targetRoot, "assets"));

  console.log(`Built ${platform} client at ${path.relative(repoRoot, targetRoot) || "."}`);
}

if (requestedTarget === "all" || requestedTarget === "render") {
  buildPlatform("render", repoRoot);
}

if (requestedTarget === "all" || requestedTarget === "crazygames") {
  buildPlatform("crazygames", path.join(repoRoot, "CrazyGames"));
}

if (requestedTarget === "all" || requestedTarget === "itch") {
  buildPlatform("itch", path.join(repoRoot, "Itch", "build"));
}

if (requestedTarget === "all" || requestedTarget === "gamepix") {
  buildPlatform("gamepix", path.join(repoRoot, "GamePix"));
}
