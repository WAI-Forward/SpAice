async function handleAccountSaveRequest(request, response, url) {
  try {
    const session = await requireAccountSession(request);

    if (request.method === "GET" && url.pathname === "/api/saves") {
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        saves: await listAccountSaves(session.account.username)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/saves") {
      const body = await readJsonBody(request);
      const saved = await saveAccountGame(session.account.username, body);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        save: saved.metadata,
        saves: await listAccountSaves(session.account.username)
      });
      return;
    }

    const saveId = sanitizeText(url.pathname.slice("/api/saves/".length), 80);
    if (request.method === "GET" && saveId) {
      const save = await getAccountSave(session.account.username, saveId);
      if (!save) {
        writeJson(response, 404, { ok: false, message: "Save not found." });
        return;
      }

      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        save: save.metadata,
        payload: save.payload
      });
      return;
    }

    if (request.method === "DELETE" && saveId) {
      const deleted = await deleteAccountSave(session.account.username, saveId);
      if (!deleted) {
        writeJson(response, 404, { ok: false, message: "Save not found." });
        return;
      }

      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        saves: await listAccountSaves(session.account.username)
      });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Save endpoint not found." });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    logClusternautsError("save request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "Save request failed."
    });
  }
}

async function handleWorldRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/world/shared") {
      const { session, room } = await ensureSharedWorldSession();
      writeJson(response, 200, {
        ok: true,
        sharedWorld: buildSharedWorldStats(session, room)
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/world/state") {
      const playerId = sanitizeText(url.searchParams.get("playerId"), 80);
      writeJson(response, 200, await loadPersistentState(playerId));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/world/snapshot") {
      const body = await readJsonBody(request);
      const playerId = sanitizeText(body && body.playerId, 80);

      if (!playerId) {
        writeJson(response, 400, { ok: false, message: "Missing player id." });
        return;
      }

      writeJson(response, 200, await savePersistentState(playerId, body));
      return;
    }

    writeJson(response, 404, { ok: false, message: "World endpoint not found." });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    logClusternautsError("world request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, status, {
      ok: false,
      message: error instanceof Error ? error.message : "World persistence request failed."
    });
  }
}

async function handleClientErrorRequest(request, response) {
  try {
    if (request.method !== "POST") {
      writeJson(response, 405, { ok: false, message: "Client error endpoint requires POST." });
      return;
    }

    const body = await readJsonBody(request);
    const report = sanitizeClientErrorReport(body);
    logClusternautsError("client error", report);
    writeJson(response, 200, { ok: true });
  } catch (error) {
    logClusternautsError("client error report failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });
    writeJson(response, 500, { ok: false, message: "Client error report failed." });
  }
}

async function handleLeaderboardRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/leaderboard") {
      const limit = Math.floor(clampNumber(url.searchParams.get("limit"), 1, 100) || 40);
      const filters = {
        gameMode: normalizeLeaderboardGameModeFilter(url.searchParams.get("gameMode")),
        mode: normalizeLeaderboardModeFilter(url.searchParams.get("mode")),
        difficulty: normalizeLeaderboardDifficultyFilter(url.searchParams.get("difficulty"))
      };
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        entries: await listLeaderboardEntries(limit, filters)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/leaderboard") {
      const body = await readJsonBody(request);
      const entry = await saveLeaderboardEntry(body);
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        entry,
        entries: await listLeaderboardEntries(40, {
          gameMode: "all",
          mode: "all",
          difficulty: "all"
        })
      });
      return;
    }

    const entryId = sanitizeText(url.pathname.slice("/api/leaderboard/".length), 80);
    if (request.method === "PATCH" && entryId) {
      const body = await readJsonBody(request);
      const entry = await updateLeaderboardEntryName(entryId, body && body.playerId, body && body.name);
      if (!entry) {
        writeJson(response, 404, { ok: false, message: "Leaderboard entry not found." });
        return;
      }
      writeJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
        entry,
        entries: await listLeaderboardEntries(40, {
          gameMode: "all",
          mode: "all",
          difficulty: "all"
        })
      });
      return;
    }

    writeJson(response, 404, { ok: false, message: "Leaderboard endpoint not found." });
  } catch (error) {
    logClusternautsError("leaderboard request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Leaderboard request failed."
    });
  }
}

async function handleResetRequest(request, response, url) {
  try {
    if (request.method !== "POST") {
      writeJson(response, 405, { ok: false, message: "Reset endpoint requires POST." });
      return;
    }

    const body = await readJsonBody(request);
    const playerId = sanitizeText(body && body.playerId, 80);

    if (!playerId) {
      writeJson(response, 400, { ok: false, message: "Missing player id." });
      return;
    }

    if (url.pathname === "/api/reset/world") {
      const result = await resetPersistentWorldData();
      const sharedWorldReset = resetSharedWorldRuntime("world");
      logMultiplayer("world reset", { playerId, storage: result.storage, deleted: result.deleted });
      broadcastReset("world", playerId);
      finishSharedWorldRuntimeReset(sharedWorldReset, "world");
      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/reset/players") {
      const result = await resetPersistentPlayerData();
      const sharedWorldReset = resetSharedWorldRuntime("players");
      logMultiplayer("players reset", { playerId, storage: result.storage, deleted: result.deleted });
      broadcastReset("players", playerId);
      finishSharedWorldRuntimeReset(sharedWorldReset, "players");
      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/reset/all") {
      const result = await resetPersistentAllData();
      const sharedWorldReset = resetSharedWorldRuntime("all");
      logMultiplayer("all reset", { playerId, storage: result.storage, deleted: result.deleted });
      broadcastReset("all", playerId);
      finishSharedWorldRuntimeReset(sharedWorldReset, "all");
      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/reset/life") {
      const result = await resetPersistentLifeData(playerId);
      logMultiplayer("life reset", { playerId, storage: result.storage, deleted: result.deleted });
      relayToPlayer(playerId, { type: "reset.life", actorPlayerId: playerId });
      writeJson(response, 200, result);
      return;
    }

    writeJson(response, 404, { ok: false, message: "Reset endpoint not found." });
  } catch (error) {
    logClusternautsError("reset request error", {
      method: request.method,
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    writeJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Reset request failed."
    });
  }
}
