"use strict";

const { loadBackendServer } = require("../scripts/backend-bundle");

module.exports = loadBackendServer(__dirname, module);
