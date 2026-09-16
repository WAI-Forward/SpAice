  async function promptCrazyGamesLogin() {
    // build:crazygames:start
    if (accountState.busy || crazyGamesState.authPromptActive) {
      return;
    }

    crazyGamesState.authPromptActive = true;
    setAccountBusy(true);
    try {
      await initializeCrazyGamesIntegration();
      const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
      if (!sdk || !sdk.user || typeof sdk.user.showAuthPrompt !== "function") {
        crazyGamesState.authAvailable = false;
        setManualSaveStatus("CrazyGames login is unavailable here.", "error");
        return;
      }

      await sdk.user.showAuthPrompt();
      await handleCrazyGamesAuthChange("auth-prompt");
      setManualSaveStatus(isCrazyGamesUserSignedIn() ? "CrazyGames account ready." : "Continuing as guest.", "success");
    } catch (error) {
      if (isCrazyGamesAlreadySignedInError(error)) {
        await handleCrazyGamesAuthChange("auth-prompt-existing");
        setManualSaveStatus(isCrazyGamesUserSignedIn() ? "CrazyGames account ready." : "Continuing as guest.", "success");
      } else if (isCrazyGamesUnauthenticatedError(error)) {
        setManualSaveStatus("Continuing as guest.", "success");
      } else {
        setManualSaveStatus("CrazyGames login did not complete.", "error");
        console.warn("CrazyGames auth prompt failed.", error);
      }
    } finally {
      crazyGamesState.authPromptActive = false;
      setAccountBusy(false);
    }
    return;
    // build:crazygames:end
    // build:render:start
    if (accountState.busy || crazyGamesState.authPromptActive) {
      return;
    }

    crazyGamesState.authPromptActive = true;
    setAccountBusy(true);
    try {
      await initializeCrazyGamesIntegration();
      const sdk = crazyGamesState.sdk || (window.CrazyGames && window.CrazyGames.SDK);
      if (!sdk || !sdk.user || typeof sdk.user.showAuthPrompt !== "function") {
        crazyGamesState.authAvailable = false;
        setManualSaveStatus("CrazyGames login is unavailable here.", "error");
        return;
      }

      await sdk.user.showAuthPrompt();
      await authenticateWithCrazyGames();
    } catch (error) {
      if (isCrazyGamesAlreadySignedInError(error)) {
        await authenticateWithCrazyGames();
      } else if (isCrazyGamesUnauthenticatedError(error)) {
        setManualSaveStatus("Continuing as guest.", "success");
      } else {
        setManualSaveStatus("CrazyGames login did not complete.", "error");
        console.warn("CrazyGames auth prompt failed.", error);
      }
    } finally {
      crazyGamesState.authPromptActive = false;
      setAccountBusy(false);
    }
    // build:render:end
  }

  function renderSavedGames() {
    if (!savedGameList) {
      renderStartSavedGames();
      return;
    }

    savedGameList.textContent = "";

    if (!canUseManualSaves()) {
      const empty = document.createElement("p");
      empty.className = "settings-panel__save-empty";
      empty.textContent = "Log in to save and load worlds.";
      savedGameList.append(empty);
      renderStartSavedGames();
      return;
    }

    if (accountState.savesLoading) {
      const loading = document.createElement("p");
      loading.className = "settings-panel__save-empty";
      loading.textContent = "Loading saves...";
      savedGameList.append(loading);
      renderStartSavedGames();
      return;
    }

    if (!accountState.saves.length) {
      const empty = document.createElement("p");
      empty.className = "settings-panel__save-empty";
      empty.textContent = "No saved worlds yet.";
      savedGameList.append(empty);
      renderStartSavedGames();
      return;
    }

    for (const save of accountState.saves) {
      const currentSave = currentAccountSave();
      const isCurrentSave = Boolean(currentSave && currentSave.id === save.id);
      const row = document.createElement("div");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      const actions = document.createElement("div");
      const button = document.createElement("button");
      const deleteButton = document.createElement("button");
      row.className = "settings-panel__save-item";
      row.classList.toggle("is-current", isCurrentSave);
      details.className = "settings-panel__save-details";
      actions.className = "settings-panel__save-actions";
      name.textContent = save.name || "Saved world";
      meta.textContent = isCurrentSave ? "Current save" : "";
      button.className = "settings-panel__save-action";
      button.type = "button";
      button.dataset.saveId = save.id || "";
      button.disabled = accountState.busy;
      button.textContent = isCurrentSave ? "Reload" : "Load";
      deleteButton.className = "settings-panel__save-action settings-panel__save-action--danger";
      deleteButton.type = "button";
      deleteButton.dataset.saveDeleteId = save.id || "";
      deleteButton.disabled = accountState.busy;
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", 'Delete "' + (save.name || "Saved world") + '"');
      details.append(name);
      if (meta.textContent) {
        details.append(meta);
      }
      actions.append(button, deleteButton);
      row.append(details, actions);
      savedGameList.append(row);
    }
    renderStartSavedGames();
  }

  async function bootstrapAccountSession() {
    accountState.sessionLoading = true;
    updateAccountUi();
    const hadAccountTokenAtStart = Boolean(accountState.token);
    const storedAtStart = readStoredAccountSession();
    logAccountAuth("bootstrap start", {
      runtime: isItchRuntime() ? "itch" : isCrazyGamesRuntime() ? "crazygames" : isGamePixRuntime() ? "gamepix" : "backend",
      externalBackend: shouldUseExternalBackend(),
      hasStoredToken: Boolean(storedAtStart),
      hasAccountToken: hadAccountTokenAtStart
    });

    if (isPlatformLocalSaveRuntime()) {
      logAccountAuth("bootstrap skipped for platform-local save runtime");
      accountState.token = "";
      accountState.username = "";
      accountState.displayName = "";
      accountState.waiBirthdayMonthDay = "";
      clearCurrentAccountSave();
      accountState.sessionLoading = false;
      accountState.waiLinked = false;
      accountState.crazyGamesLinked = false;
      applySkinAccountState(null);
      updateAccountUi();
      await refreshCrazyGamesManualSaves();
      return;
    }

    const stored = storedAtStart;
    if (stored) {
      logAccountAuth("stored session found", {
        username: stored.username,
        waiLinked: stored.waiLinked,
        crazyGamesLinked: stored.crazyGamesLinked
      });
      accountState.token = stored.token;
      accountState.username = stored.username;
      accountState.displayName = stored.displayName || "";
      accountState.waiBirthdayMonthDay = "";
      accountState.waiLinked = stored.waiLinked === true;
      accountState.crazyGamesLinked = stored.crazyGamesLinked === true;
      updateAccountUi();
    }

    try {
      const data = await fetchPersistentJson("/api/auth/session", {
        headers: accountAuthHeaders()
      });
      applyAccountSession(data);
      await refreshAccountSaves();
      logAccountAuth("bootstrap success", {
        username: accountState.username,
        waiLinked: accountState.waiLinked,
        saveCount: accountState.saves.length
      });
    } catch (error) {
      accountState.token = "";
      accountState.username = "";
      accountState.displayName = "";
      accountState.waiBirthdayMonthDay = "";
      accountState.saves = [];
      clearCurrentAccountSave();
      accountState.sessionLoading = false;
      accountState.waiLinked = false;
      accountState.crazyGamesLinked = false;
      applySkinAccountState(null);
      writeStoredAccountSession();
      updateAccountUi();
      logAccountAuth("bootstrap failed", {
        status: error && error.status,
        path: error && error.requestPath,
        message: error && error.message,
        hadStoredToken: Boolean(stored),
        hadAccountToken: hadAccountTokenAtStart
      });
      console.warn("Clusternauts account session unavailable.", error);
    }
  }

  function applyAccountSession(data) {
    const account = data && data.account && typeof data.account === "object" ? data.account : {};
    accountState.token = typeof data.sessionToken === "string" ? data.sessionToken : accountState.token;
    accountState.username = sanitizeAccountUsername(account.username || accountState.username);
    accountState.displayName = sanitizePlayerName(account.waiDisplayName || account.crazyGamesUsername || account.username || accountState.username);
    accountState.waiBirthdayMonthDay = sanitizeMonthDay(account.waiBirthdayMonthDay || "");
    accountState.sessionLoading = false;
    accountState.waiLinked = account.waiLinked === true;
    accountState.crazyGamesLinked = account.crazyGamesLinked === true;
    applySkinAccountState(account);
    adoptLinkedPlayerId(account.linkedPlayerId);
    if (account.crazyGamesUsername) {
      player.name = sanitizePlayerName(account.crazyGamesUsername) || player.name;
      updatePublicNameValue();
    }
    writeStoredAccountSession();
    updateAccountUi();
  }

  async function submitAccountAuth(_createNew) {
    if (isCrazyGamesRuntime()) {
      await promptCrazyGamesLogin();
      return;
    }
    if (isGamePixRuntime()) {
      setManualSaveStatus("GamePix saves are stored locally.", "success");
      return;
    }

    // build:backend:start
    if (accountState.busy) {
      return;
    }

    openWaiLogin();
    // build:backend:end
  }

  // build:backend:start
  function waiLoginUrl() {
    if (!pendingWaiLoginAttemptId) {
      pendingWaiLoginAttemptId = createAuthDebugId();
    }
    const portalReturn = "/auth/portal-login-complete?auth_debug_id=" + encodeURIComponent(pendingWaiLoginAttemptId);
    const returnTo = isPortalBackendRuntime()
      ? portalReturn
      : `${window.location.pathname || "/"}${window.location.search || ""}${window.location.hash || ""}`;
    return backendRouteUrl(
      `/auth/login?return_to=${encodeURIComponent(returnTo)}&auth_debug_id=${encodeURIComponent(pendingWaiLoginAttemptId)}`
    );
  }

  function openWaiLogin() {
    pendingWaiLoginAttemptId = createAuthDebugId();
    const loginUrl = waiLoginUrl();
    setManualSaveStatus("Opening login...", "success");
    logAccountAuth("open login", {
      authDebugId: pendingWaiLoginAttemptId,
      portal: isPortalBackendRuntime(),
      backendOrigin: shouldUseExternalBackend() ? backendOrigin() : window.location.origin,
      loginUrl: redactAuthDebugUrl(loginUrl)
    });
    startAuthDebugPolling(pendingWaiLoginAttemptId, "open-login");

    if (!isPortalBackendRuntime()) {
      window.location.href = loginUrl;
      return;
    }

    const popup = window.open(loginUrl, "clusternauts-wai-login", "popup,width=520,height=760");
    if (popup) {
      logAccountAuth("login popup opened");
      setManualSaveStatus("Finish login in the login window.", "success");
      return;
    }

    logAccountAuth("login popup blocked");
    setManualSaveStatus("Allow popups or open the login link in a new tab.", "error");
  }

  function installAccountLoginMessageListener() {
    if (!isPortalBackendRuntime()) {
      return;
    }

    window.addEventListener("message", function (event) {
      if (!isTrustedBackendMessageOrigin(event.origin)) {
        logAccountAuth("ignored login message from untrusted origin", { origin: event.origin || "" });
        return;
      }
      const data = event.data && typeof event.data === "object" ? event.data : {};
      if (data.type !== "clusternauts:wai-login-complete") {
        logAccountAuth("ignored backend message with different type", {
          origin: event.origin || "",
          type: data.type || typeof event.data
        });
        return;
      }
      if (data.authDebugId && pendingWaiLoginAttemptId && data.authDebugId !== pendingWaiLoginAttemptId) {
        logAccountAuth("login completion attempt id mismatch", {
          expected: pendingWaiLoginAttemptId,
          received: data.authDebugId
        });
      }
      logAccountAuth("login completion message received", {
        authDebugId: data.authDebugId || pendingWaiLoginAttemptId,
        origin: event.origin || "",
        hasTransfer: Boolean(data.transfer)
      });
      startAuthDebugPolling(data.authDebugId || pendingWaiLoginAttemptId, "completion-message");
      setManualSaveStatus("Login complete. Loading saves...", "success");
      if (data.transfer) {
        void redeemPortalLoginTransfer(data.transfer, data.authDebugId || pendingWaiLoginAttemptId);
      } else {
        logAccountAuth("login completion missing transfer", {
          authDebugId: data.authDebugId || pendingWaiLoginAttemptId
        });
        void bootstrapAccountSession();
      }
    });

    window.addEventListener("focus", function () {
      if (pendingWaiLoginAttemptId) {
        logAccountAuth("window focused during pending login", { authDebugId: pendingWaiLoginAttemptId });
        void fetchAuthDebugEvents(pendingWaiLoginAttemptId, "focus");
      }
      if (!isAccountSignedIn() && !accountState.sessionLoading) {
        void bootstrapAccountSession();
      }
    });
  }

  function isPortalBackendRuntime() {
    return (isItchRuntime() || isGamePixRuntime()) && shouldUseExternalBackend();
  }

  function isTrustedBackendMessageOrigin(origin) {
    try {
      return new URL(origin).origin === new URL(backendOrigin()).origin;
    } catch {
      return false;
    }
  }

  function redactAuthDebugUrl(value) {
    return String(value || "").replace(/transfer=[^&]+/g, "transfer=redacted");
  }

  function startAuthDebugPolling(attemptId, reason) {
    const cleanAttemptId = String(attemptId || "").trim();
    if (!cleanAttemptId) {
      return;
    }
    pendingWaiLoginAttemptId = cleanAttemptId;
    authDebugPollStartedAt = performance.now();
    authDebugSeenEventCount = 0;
    if (authDebugPollTimer) {
      window.clearInterval(authDebugPollTimer);
    }
    logAccountAuth("auth debug polling start", { authDebugId: cleanAttemptId, reason });
    void fetchAuthDebugEvents(cleanAttemptId, reason);
    authDebugPollTimer = window.setInterval(function () {
      if (!pendingWaiLoginAttemptId || performance.now() - authDebugPollStartedAt > 120000) {
        stopAuthDebugPolling("timeout");
        return;
      }
      void fetchAuthDebugEvents(cleanAttemptId, "poll");
    }, 2000);
  }

  function stopAuthDebugPolling(reason) {
    if (authDebugPollTimer) {
      window.clearInterval(authDebugPollTimer);
      authDebugPollTimer = 0;
      logAccountAuth("auth debug polling stop", { authDebugId: pendingWaiLoginAttemptId, reason });
    }
  }

  async function fetchAuthDebugEvents(attemptId, reason) {
    const cleanAttemptId = String(attemptId || "").trim();
    if (!cleanAttemptId) {
      return;
    }

    try {
      const data = await fetchPersistentJson("/api/auth/debug?attempt=" + encodeURIComponent(cleanAttemptId));
      const events = Array.isArray(data.events) ? data.events : [];
      if (events.length !== authDebugSeenEventCount) {
        logAccountAuth("backend auth debug events", {
          authDebugId: cleanAttemptId,
          reason,
          eventCount: events.length,
          newEvents: events.slice(authDebugSeenEventCount)
        });
        authDebugSeenEventCount = events.length;
      }
    } catch (error) {
      logAccountAuth("backend auth debug fetch failed", {
        authDebugId: cleanAttemptId,
        reason,
        status: error && error.status,
        message: error && error.message
      });
    }
  }
