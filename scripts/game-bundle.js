"use strict";

const fs = require("fs");
const path = require("path");
const {
  listSourceFiles,
  readBundleOrder,
  readDirectoryBundle
} = require("./source-bundle");

const bundleOrderFile = "bundle-order.json";

function readSourceBundle(frontendRoot, bundleName) {
  const srcRoot = path.join(frontendRoot, "src");
  const partsDir = path.join(srcRoot, bundleName);
  if (!fs.existsSync(partsDir)) {
    return fs.readFileSync(path.join(srcRoot, `${bundleName}.js`), "utf8");
  }

  return readDirectoryBundle(partsDir, ".js");
}

function readStyleSource(frontendRoot) {
  const partsDir = path.join(frontendRoot, "styles");
  if (!fs.existsSync(partsDir)) {
    return fs.readFileSync(path.join(frontendRoot, "styles.css"), "utf8");
  }
  return readDirectoryBundle(partsDir, ".css");
}

function readHtmlSource(frontendRoot) {
  const partsDir = path.join(frontendRoot, "html");
  if (!fs.existsSync(partsDir)) {
    return fs.readFileSync(path.join(frontendRoot, "index.html"), "utf8");
  }
  return readDirectoryBundle(partsDir, ".html");
}

function writeSourceBundle(frontendRoot, targetRoot, bundleName, source) {
  const outputPath = path.join(targetRoot, "src", `${bundleName}.js`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, typeof source === "string" ? source : readSourceBundle(frontendRoot, bundleName));
}

function readGameSource(frontendRoot) {
  return readSourceBundle(frontendRoot, "game");
}

function writeGameBundle(frontendRoot, targetRoot, source) {
  writeSourceBundle(frontendRoot, targetRoot, "game", source);
}

module.exports = {
  readSourceBundle,
  writeSourceBundle,
  readGameSource,
  writeGameBundle,
  readHtmlSource,
  readStyleSource,
  bundleOrderFile,
  listSourceFiles,
  readBundleOrder
};
