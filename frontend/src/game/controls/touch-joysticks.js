  function beginTouchFireJoystick(event) {
    if (!isTouchFireJoystickPointer(event) || deathState.active || !runState.active || touchControlState.active) {
      return false;
    }

    event.preventDefault();
    touchControlState.suppressMouseUntil = performance.now() + 900;
    updateTouchAimFromPointer(event);

    if (activePlacementRecipeId) {
      confirmStructurePlacement();
      return true;
    }

    if (handleTradePortClick()) {
      resetMouseButtons();
      return true;
    }

    if (handleContainerClick()) {
      resetMouseButtons();
      return true;
    }

    if (areToolsDisabled()) {
      resetMouseButtons();
      return true;
    }

    if (handleCommunicationRelayClick()) {
      resetMouseButtons();
      return true;
    }

    const now = performance.now();
    const tapDistance = Math.hypot(event.clientX - touchControlState.lastTapX, event.clientY - touchControlState.lastTapY);
    const doubleTap = now - touchControlState.lastTapAt <= touchDoubleTapWindow && tapDistance <= touchDoubleTapDistance;
    const fireButton = doubleTap ? "right" : "left";

    touchControlState.active = true;
    touchControlState.pointerId = event.pointerId;
    touchControlState.fireButton = fireButton;
    touchControlState.toolsSuppressed = false;
    touchControlState.lastTapAt = now;
    touchControlState.lastTapX = event.clientX;
    touchControlState.lastTapY = event.clientY;
    updateTouchFireJoystickFromPointer(event);

    if (touchFireJoystick && touchFireJoystick.setPointerCapture) {
      try {
        touchFireJoystick.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail if the browser already released the touch.
      }
    }

    if (isSuctionEquipped() && touchControlState.fireReady) {
      playSound(fireButton === "right" ? "gadgetBlow" : "gadgetSuck", { throttleKey: "gadget", throttle: 0.12 });
    }

    return true;
  }

  function updateTouchFireJoystick(event) {
    if (!touchControlState.active || event.pointerId !== touchControlState.pointerId) {
      return false;
    }

    event.preventDefault();
    updateTouchFireJoystickFromPointer(event);
    return true;
  }

  function endTouchFireJoystick(event) {
    if (!touchControlState.active || event.pointerId !== touchControlState.pointerId) {
      return false;
    }

    event.preventDefault();
    clearMouseButtonsOnly();
    resetTouchFireState();

    if (touchFireJoystick && touchFireJoystick.releasePointerCapture) {
      try {
        touchFireJoystick.releasePointerCapture(event.pointerId);
      } catch {
        // Some browsers release capture before pointerup is delivered.
      }
    }

    return true;
  }

  function isTouchGameplayPointer(event) {
    return Boolean(gameSettings.touchScreen && event && event.pointerType === "touch");
  }

  function isTouchPinchPointer(event) {
    if (!isTouchGameplayPointer(event) || deathState.active || !runState.active || isEditableEventTarget(event)) {
      return false;
    }
    return !isGameplayPointerBlocked(event);
  }

  function touchPinchPoints() {
    return Array.from(touchPinchState.pointers.values());
  }

  function beginTouchPinch(event) {
    if (!isTouchPinchPointer(event)) {
      return false;
    }

    touchPinchState.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });
    touchControlState.suppressMouseUntil = performance.now() + 900;

    if (touchPinchState.pointers.size < 2) {
      return false;
    }

    const points = touchPinchPoints();
    touchPinchState.active = true;
    touchPinchState.startDistance = Math.max(1, Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y));
    touchPinchState.startZoom = cameraZoom;
    event.preventDefault();
    return true;
  }

  function updateTouchPinch(event) {
    if (!touchPinchState.pointers.has(event.pointerId)) {
      return false;
    }

    touchPinchState.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (touchPinchState.pointers.size < 2) {
      return false;
    }

    const points = touchPinchPoints();
    const distance = Math.max(1, Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y));
    if (!touchPinchState.active) {
      touchPinchState.active = true;
      touchPinchState.startDistance = distance;
      touchPinchState.startZoom = cameraZoom;
    } else {
      setCameraZoom(touchPinchState.startZoom * (distance / Math.max(1, touchPinchState.startDistance)));
    }
    touchControlState.suppressMouseUntil = performance.now() + 900;
    event.preventDefault();
    return true;
  }

  function endTouchPinch(event) {
    if (!touchPinchState.pointers.has(event.pointerId)) {
      return false;
    }

    touchPinchState.pointers.delete(event.pointerId);
    if (touchPinchState.pointers.size < 2) {
      touchPinchState.active = false;
      touchPinchState.startDistance = 0;
      touchPinchState.startZoom = cameraZoom;
    }
    touchControlState.suppressMouseUntil = performance.now() + 900;
    event.preventDefault();
    return true;
  }

  function isGameplayPointerBlocked(event) {
    return Boolean(closestEventTarget(event, gameplayPointerBlockSelector));
  }

  function shouldSuppressSyntheticMouseEvent() {
    return Boolean(gameSettings.touchScreen && performance.now() < touchControlState.suppressMouseUntil);
  }

  function setTouchFireButton(button) {
    mouse.left = button === "left";
    mouse.middle = false;
    mouse.right = button === "right";
  }

  function isTouchBoostPressed() {
    return Boolean(gameSettings.touchScreen && touchJoystickState.active && touchJoystickState.boost);
  }

  function canShowTouchLandButton() {
    return Boolean(gameSettings.touchScreen && runState.active && !deathState.active && (player.landed || findNearestLandableBody()));
  }

  function updateTouchLandButton() {
    if (!touchLandButton) {
      return;
    }

    const visible = canShowTouchLandButton();
    if (touchLandButton.classList.contains("is-visible") !== visible) {
      touchLandButton.classList.toggle("is-visible", visible);
    }
    if (touchLandButton.hidden === visible) {
      touchLandButton.hidden = !visible;
    }

    const label = player.landed ? "Take off" : "Land";
    const ariaLabel = player.landed ? "Take off from body" : "Land on nearby body";
    if (touchLandButton.textContent !== label) {
      touchLandButton.textContent = label;
    }
    if (touchLandButton.getAttribute("aria-label") !== ariaLabel) {
      touchLandButton.setAttribute("aria-label", ariaLabel);
    }
  }

  function beginTouchControl(event) {
    if (beginTouchPinch(event)) {
      return;
    }
    if (beginTouchJoystick(event)) {
      return;
    }
    if (beginTouchFireJoystick(event)) {
      return;
    }

    if (!isTouchGameplayPointer(event) || deathState.active || !runState.active || isGameplayPointerBlocked(event)) {
      return;
    }
    event.preventDefault();
    touchControlState.suppressMouseUntil = performance.now() + 900;
  }

  function updateTouchControl(event) {
    if (updateTouchPinch(event)) {
      return;
    }
    if (updateTouchJoystick(event)) {
      return;
    }
    if (updateTouchFireJoystick(event)) {
      return;
    }
  }

  function endTouchControl(event) {
    const endedPinch = endTouchPinch(event);
    if (endTouchJoystick(event)) {
      return;
    }
    if (endTouchFireJoystick(event)) {
      return;
    }
    if (endedPinch) {
      return;
    }
  }

  function isGadgetButtonPressed() {
    return mouse.left || mouse.middle || mouse.right;
  }

  function isVacuumHoldActive() {
    return canUseSuctionControls() && mouse.middle;
  }

  function rotatePoint(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      x: x * c - y * s,
      y: x * s + y * c
    };
  }
