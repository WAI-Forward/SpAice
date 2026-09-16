  async function redeemPortalLoginTransfer(transfer, authDebugId) {
    if (accountState.busy) {
      logAccountAuth("portal transfer skipped because account is busy", { authDebugId: authDebugId || pendingWaiLoginAttemptId });
      return;
    }

    setAccountBusy(true);
    const cleanAuthDebugId = authDebugId || pendingWaiLoginAttemptId;
    logAccountAuth("portal transfer redeem start", { authDebugId: cleanAuthDebugId, hasTransfer: Boolean(transfer) });
    try {
      const data = await fetchPersistentJson("/api/auth/portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transfer, authDebugId: cleanAuthDebugId })
      });
      applyAccountSession(data);
      await refreshAccountSaves();
      setManualSaveStatus("Signed in.", "success");
      logAccountAuth("portal transfer redeem success", {
        authDebugId: cleanAuthDebugId,
        username: accountState.username,
        waiLinked: accountState.waiLinked,
        saveCount: accountState.saves.length
      });
      await fetchAuthDebugEvents(cleanAuthDebugId, "redeem-success");
      stopAuthDebugPolling("redeem-success");
    } catch (error) {
      setManualSaveStatus(backendErrorMessage(error, "Login did not complete. Try again."), "error");
      logAccountAuth("portal transfer redeem failed", {
        authDebugId: cleanAuthDebugId,
        status: error && error.status,
        path: error && error.requestPath,
        message: error && error.message
      });
      await fetchAuthDebugEvents(cleanAuthDebugId, "redeem-failed");
      console.warn("Clusternauts portal login transfer failed.", error);
      await bootstrapAccountSession();
    } finally {
      setAccountBusy(false);
    }
  }
  // build:backend:end

  async function logoutAccount() {
    if (isCrazyGamesRuntime()) {
      return await logoutCrazyGamesUser();
    }
    if (isGamePixRuntime()) {
      return false;
    }

    if (!isAccountSignedIn() || accountState.busy) {
      return;
    }

    setAccountBusy(true);
    try {
      await fetchPersistentJson("/api/auth/logout", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, accountAuthHeaders()),
        body: JSON.stringify({ sessionToken: accountState.token })
      });
    } catch (error) {
      console.warn("Clusternauts logout failed.", error);
    } finally {
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
      setManualSaveStatus("Logged out.", "success");
      setAccountBusy(false);
    }
  }

  async function logoutCrazyGamesUser() {
    if (accountState.busy || crazyGamesState.authPromptActive) {
      return false;
    }

    const logoutMethod = crazyGamesLogoutMethod();
    if (!logoutMethod) {
      setManualSaveStatus("Use your CrazyGames account menu to sign out.", "error");
      return false;
    }

    setAccountBusy(true);
    try {
      await Promise.resolve(logoutMethod());
      await handleCrazyGamesAuthChange("logout");
      if (isCrazyGamesUserSignedIn()) {
        setManualSaveStatus("Use your CrazyGames account menu to finish signing out.", "error");
        return false;
      }
      setManualSaveStatus("Logged out of CrazyGames.", "success");
      return true;
    } catch (error) {
      console.warn("CrazyGames logout failed.", error);
      await handleCrazyGamesAuthChange("logout-failed");
      setManualSaveStatus("Could not log out of CrazyGames here.", "error");
      return false;
    } finally {
      setAccountBusy(false);
    }
  }

  async function refreshAccountSaves() {
    if (isPlatformLocalSaveRuntime() && !isAccountSignedIn()) {
      await refreshCrazyGamesManualSaves();
      return;
    }

    if (!isAccountSignedIn() || accountState.savesLoading) {
      return;
    }

    accountState.savesLoading = true;
    renderSavedGames();
    try {
      const data = await fetchPersistentJson("/api/saves", {
        headers: accountAuthHeaders()
      });
      accountState.saves = Array.isArray(data.saves) ? data.saves : [];
    } catch (error) {
      setManualSaveStatus(backendErrorMessage(error, "Could not load saved games."), "error");
      console.warn("Clusternauts save list failed.", error);
    } finally {
      accountState.savesLoading = false;
      updateAccountUi();
    }
  }

  function buildRunSnapshot() {
    return {
      active: runState.active,
      difficulty: runState.difficultyId,
      gameMode: normalizeGameMode(runState.gameMode),
      lifeStats: {
        elapsed: Math.max(0, (performance.now() - lifeStats.startedAt) / 1000),
        maxMass: lifeStats.maxMass,
        maxTierName: lifeStats.maxTierName,
        mobsDefeated: lifeStats.mobsDefeated,
        techCollected: lifeStats.techCollected,
        mobScore: lifeStats.mobScore,
        currentScore: lifeStats.currentScore,
        bestScore: lifeStats.bestScore,
        bodyScore: lifeStats.bodyScore,
        bestBodyScore: lifeStats.bestBodyScore,
        scoredBodyMass: lifeStats.scoredBodyMass,
        bestScoredBodyMass: lifeStats.bestScoredBodyMass,
        scoredBodies: lifeStats.scoredBodies,
        bestScoredBodies: lifeStats.bestScoredBodies,
        absorbedParticleMass: lifeStats.absorbedParticleMass,
        absorbedParticleCount: lifeStats.absorbedParticleCount
      }
    };
  }
