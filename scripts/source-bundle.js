"use strict";

const fs = require("fs");
const path = require("path");

const bundleOrderFile = "bundle-order.json";

function normalizeExtension(extension) {
  return extension.startsWith(".") ? extension : `.${extension}`;
}

function toBundlePath(filePath, partsDir) {
  return path.relative(partsDir, filePath).split(path.sep).join("/");
}

function listSourceFiles(partsDir, extension) {
  const wantedExtension = normalizeExtension(extension);
  const files = [];

  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === bundleOrderFile) {
        continue;
      }

      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(wantedExtension)) {
        files.push(entryPath);
      }
    }
  }

  visit(partsDir);
  return files.sort();
}

function readBundleOrder(partsDir, extension) {
  const wantedExtension = normalizeExtension(extension);
  const orderPath = path.join(partsDir, bundleOrderFile);
  if (!fs.existsSync(orderPath)) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(orderPath, "utf8"));
  if (!Array.isArray(manifest)) {
    throw new Error(`${orderPath} must contain an array of source file paths.`);
  }

  return manifest.map((entry) => {
    if (
      typeof entry !== "string" ||
      !entry.endsWith(wantedExtension) ||
      path.isAbsolute(entry) ||
      entry.includes("..")
    ) {
      throw new Error(`${orderPath} contains an invalid source path: ${JSON.stringify(entry)}`);
    }

    const filePath = path.join(partsDir, ...entry.split("/"));
    if (!fs.existsSync(filePath)) {
      throw new Error(`${orderPath} references a missing source file: ${entry}`);
    }
    return filePath;
  });
}

function orderedSourceFiles(partsDir, extension) {
  return readBundleOrder(partsDir, extension) || listSourceFiles(partsDir, extension);
}

function readDirectoryBundle(partsDir, extension) {
  return orderedSourceFiles(partsDir, extension)
    .map((filePath) => fs.readFileSync(filePath, "utf8").replace(/\s*$/, "\n"))
    .join("\n");
}

module.exports = {
  bundleOrderFile,
  listSourceFiles,
  orderedSourceFiles,
  readBundleOrder,
  readDirectoryBundle,
  toBundlePath
};
