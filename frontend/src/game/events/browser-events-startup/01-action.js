  if (difficultyScreen) {
    difficultyScreen.addEventListener("click", function (event) {
      const action = closestEventTarget(event, "[data-menu-action]");
      if (action && action.dataset.menuAction) {
        event.preventDefault();
        handleStartMenuAction(action.dataset.menuAction, action);
        return;
      }

      const controlButton = closestEventTarget(event, "button[data-control-action]");
      if (controlButton) {
        event.preventDefault();
        pendingControlRemap = controlButton.dataset.controlAction || null;
        renderControlBindings();
        return;
      }

      const storeFilterButton = closestEventTarget(event, "[data-store-filter]");
      if (storeFilterButton && storeFilterButton.dataset.storeFilter) {
        event.preventDefault();
        toggleStoreFilter(storeFilterButton.dataset.storeFilter);
        return;
      }

      const storeSkinCard = closestEventTarget(event, "[data-store-skin-id]");
      if (storeSkinCard && storeSkinCard.dataset.storeSkinId) {
        event.preventDefault();
        setStorePreviewSkin(storeSkinCard.dataset.storeSkinId);
        return;
      }

      const lobbyDifficultyToggleTarget = closestEventTarget(event, "#lobbyDifficultyToggle");
      if (lobbyDifficultyToggleTarget) {
        event.preventDefault();
        setLobbyDifficultyMenuOpen(!(lobbyDifficultySelect && lobbyDifficultySelect.classList.contains("is-open")));
        return;
      }

      const lobbyDifficulty = closestEventTarget(event, "[data-lobby-difficulty]");
      if (lobbyDifficulty && lobbyDifficulty.dataset.lobbyDifficulty) {
        event.preventDefault();
        setLobbyDifficulty(lobbyDifficulty.dataset.lobbyDifficulty);
        setLobbyDifficultyMenuOpen(false);
        return;
      }

      if (!closestEventTarget(event, ".lobby-difficulty-select")) {
        setLobbyDifficultyMenuOpen(false);
      }

      const invite = closestEventTarget(event, "[data-lobby-invite]");
      if (invite && invite.dataset.lobbyInvite) {
        event.preventDefault();
        sendMultiplayer({ type: "lobby.invite", targetPlayerId: invite.dataset.lobbyInvite });
        setLobbyStatus("Invite sent.", "success");
        return;
      }

      const kick = closestEventTarget(event, "[data-lobby-kick]");
      if (kick && kick.dataset.lobbyKick) {
        event.preventDefault();
        sendMultiplayer({ type: "lobby.kick", targetPlayerId: kick.dataset.lobbyKick });
        return;
      }

      const button = closestEventTarget(event, ".difficulty-card");
      if (!button || !button.dataset.difficulty) {
        return;
      }
      if (startMenu.view !== "difficulty") {
        return;
      }
      void beginRunWithDifficulty(button.dataset.difficulty);
    });

    difficultyScreen.addEventListener("focusin", function (event) {
      const storeSkinCard = closestEventTarget(event, "[data-store-skin-id]");
      if (storeSkinCard && storeSkinCard.dataset.storeSkinId) {
        setStorePreviewSkin(storeSkinCard.dataset.storeSkinId);
      }
    });

    difficultyScreen.addEventListener("keydown", function (event) {
      if (event.code !== "Enter" && event.code !== "Space") {
        return;
      }
      const storeSkinCard = closestEventTarget(event, "[data-store-skin-id]");
      if (!storeSkinCard || !storeSkinCard.dataset.storeSkinId || closestEventTarget(event, "[data-menu-action]")) {
        return;
      }
      event.preventDefault();
      setStorePreviewSkin(storeSkinCard.dataset.storeSkinId);
    });
  }

  if (lobbyCodeInput) {
    lobbyCodeInput.addEventListener("keydown", function (event) {
      if (event.code === "Enter") {
        event.preventDefault();
        joinLobby(lobbyCodeInput.value);
      }
    });
  }

  if (lobbyPlayerSearch) {
    lobbyPlayerSearch.addEventListener("input", function () {
      window.clearTimeout(lobbyPlayerSearch._searchTimer);
      lobbyPlayerSearch._searchTimer = window.setTimeout(function () {
        void refreshLobbyPlayerSearch();
      }, 180);
    });
  }

  if (copyLobbyCodeButton) {
    copyLobbyCodeButton.addEventListener("click", function () {
      copyTextToClipboard(multiplayer.lobby && (multiplayer.lobby.code || multiplayer.lobby.id), "Lobby code copied.");
    });
  }

  if (commandInput) {
    commandInput.addEventListener("input", function () {
      multiplayer.commandCompletions = [];
      multiplayer.commandCompletionIndex = 0;
      updateCommandHint();
    });

    commandInput.addEventListener("keydown", function (event) {
      if (event.code === "Tab") {
        event.preventDefault();
        completeTeleportCommand();
        return;
      }

      if (event.code === "Enter") {
        event.preventDefault();
        void executeCommand(commandInput.value);
        return;
      }

      if (event.code === "Escape") {
        event.preventDefault();
        setCommandOpen(false);
      }
    });
  }

  if (playAgainButton) {
    playAgainButton.addEventListener("click", function () {
      void continueAfterDeath();
    });
  }

  if (deathMainMenuButton) {
    deathMainMenuButton.addEventListener("click", function () {
      exitDeathToMainMenu();
    });
  }

  if (deathLeaderboardForm) {
    deathLeaderboardForm.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  if (deathRunNameInput) {
    deathRunNameInput.addEventListener("blur", function () {
      void renameDeathLeaderboardRun();
    });
    deathRunNameInput.addEventListener("keydown", function (event) {
      if (event.code === "Enter") {
        event.preventDefault();
        deathRunNameInput.blur();
      }
    });
  }

  if (buildMenuTabs) {
    buildMenuTabs.addEventListener("click", function (event) {
      const tab = closestEventTarget(event, ".build-menu__tab");
      if (!tab) {
        return;
      }

      activeBuildFilter = tab.dataset.filter || "all";
      renderBuildMenu();
    });
  }

  if (buildMenuList) {
    buildMenuList.addEventListener("click", function (event) {
      const card = closestEventTarget(event, ".build-card");
      if (!card) {
        return;
      }

      selectedBuildRecipeId = card.dataset.recipeId;
      renderBuildMenu();
    });
  }

  if (buildMenuClose) {
    buildMenuClose.addEventListener("click", function () {
      setBuildMenuOpen(false);
    });
  }

  if (objectiveTreeClose) {
    objectiveTreeClose.addEventListener("click", function () {
      setObjectivesOpen(false);
    });
  }

  if (objectiveClaimAll) {
    objectiveClaimAll.addEventListener("click", claimAllObjectiveRewards);
  }

  if (objectiveTreeList) {
    objectiveTreeList.addEventListener("pointerdown", beginObjectiveTreePan);
    objectiveTreeList.addEventListener("pointermove", updateObjectiveTreePan);
    objectiveTreeList.addEventListener("pointerup", endObjectiveTreePan);
    objectiveTreeList.addEventListener("pointercancel", endObjectiveTreePan);
    objectiveTreeList.addEventListener("wheel", zoomObjectiveTree, { passive: false });
    objectiveTreeList.addEventListener("scroll", function () {
      if (!objectiveTreeList) {
        return;
      }
      objectiveState.scrollLeft = objectiveTreeList.scrollLeft;
      objectiveState.scrollTop = objectiveTreeList.scrollTop;
    }, { passive: true });
  }

  if (buildMenuDetail) {
    buildMenuDetail.addEventListener("click", function (event) {
      const upgradeAction = closestEventTarget(event, ".build-detail__upgrade-action");
      if (upgradeAction) {
        if (!upgradeAction.disabled) {
          upgradeTool(upgradeAction.dataset.toolId, upgradeAction.dataset.upgradeId);
        }
        return;
      }

      const action = closestEventTarget(event, ".build-detail__action");
      if (!action || action.disabled) {
        return;
      }

      craftRecipe(action.dataset.recipeId);
    });
  }

  if (toolHotbar) {
    toolHotbar.addEventListener("click", function (event) {
      const slot = closestEventTarget(event, ".tool-slot");
      if (!slot) {
        return;
      }

      selectTool(slot.dataset.toolId);
    });
  }

  if (playerInteractionChoices) {
    playerInteractionChoices.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-choice]");
      if (!button) {
        return;
      }

      choosePlayerInteraction(button.dataset.choice);
    });
  }

  if (tradeClose) {
    tradeClose.addEventListener("click", closeTradeSession);
  }

  if (containerClose) {
    containerClose.addEventListener("click", closeContainerSession);
  }

  if (tradeOfferList) {
    tradeOfferList.addEventListener("click", function (event) {
      const npcOffer = closestEventTarget(event, "button[data-npc-offer]");
      if (npcOffer) {
        selectNpcTradeOffer(Number(npcOffer.dataset.npcOffer));
        return;
      }
      const button = closestEventTarget(event, "button[data-trade-key]");
      if (!button) {
        return;
      }

      adjustTradeOffer(button.dataset.tradeKey, Number(button.dataset.tradeDelta) || 0);
    });
  }

  if (tradeSendOffer) {
    tradeSendOffer.addEventListener("click", sendTradeOffer);
  }

  if (tradeAccept) {
    tradeAccept.addEventListener("click", acceptTradeOffer);
  }

  if (tradePortClose) {
    tradePortClose.addEventListener("click", closeTradePortSession);
  }

  if (tradePortPanel) {
    tradePortPanel.addEventListener("click", function (event) {
      const offerButton = closestEventTarget(event, "button[data-trade-port-offer]");
      if (offerButton) {
        acceptTradePortOffer(offerButton.dataset.tradePortOffer);
        return;
      }

      const storageButton = closestEventTarget(event, "button[data-trade-port-storage-key]");
      if (storageButton) {
        transferTradePortTech(
          storageButton.dataset.tradePortStorageKey,
          storageButton.dataset.tradePortStorageMode,
          Number(storageButton.dataset.tradePortStorageAmount) || 1
        );
        return;
      }

      const resourceButton = closestEventTarget(event, "button[data-trade-port-key]");
      if (resourceButton) {
        adjustTradingPortOfferResource(
          resourceButton.dataset.tradePortKey,
          resourceButton.dataset.tradePortSide,
          Number(resourceButton.dataset.tradePortDelta) || 0
        );
      }
    });
  }

  if (tradePortAddOffer) {
    tradePortAddOffer.addEventListener("click", addTradePortOffer);
  }

  if (tradePortRemoveOffer) {
    tradePortRemoveOffer.addEventListener("click", removeSelectedTradePortOffer);
  }

  if (containerPanel) {
    containerPanel.addEventListener("click", function (event) {
      const button = closestEventTarget(event, "button[data-container-key]");
      if (!button) {
        return;
      }

      transferContainerTech(button.dataset.containerKey, button.dataset.containerMode, Number(button.dataset.containerAmount) || 1);
    });
  }

  if (developerMetricsCopy) {
    developerMetricsCopy.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      copyDeveloperMetricsToClipboard();
    });
  }

  if (developerMetricsMinimize) {
    developerMetricsMinimize.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleDeveloperOverlayMinimized();
    });
  }

  window.addEventListener("keydown", function (event) {
    if (pendingControlRemap) {
      event.preventDefault();
      event.stopImmediatePropagation();
      remapControl(pendingControlRemap, event.code);
      return;
    }

    if (!settingsOpen) {
      return;
    }

    if (event.code === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      setSettingsOpen(false);
    }
  });
