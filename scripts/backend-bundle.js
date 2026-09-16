"use strict";

const Module = require("module");
const path = require("path");
const { readDirectoryBundle } = require("./source-bundle");

function readBackendSource(backendRoot) {
  return readDirectoryBundle(path.join(backendRoot, "src"), ".js");
}

function loadBackendServer(backendRoot, parentModule) {
  const filename = path.join(backendRoot, "server.bundle.js");
  const bundledModule = new Module(filename, parentModule || module.parent);
  bundledModule.filename = filename;
  bundledModule.paths = Module._nodeModulePaths(backendRoot);
  bundledModule._compile(readBackendSource(backendRoot), filename);
  return bundledModule.exports;
}

module.exports = {
  loadBackendServer,
  readBackendSource
};
