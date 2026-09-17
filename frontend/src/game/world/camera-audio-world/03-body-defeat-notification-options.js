  function bodyDefeatNotificationOptions(mob, body, verb) {
    const mobLabel = mobName(mob);
    const bodyName = body && body.tier ? body.tier.name : "body";
    const bodyArticle = body && body.tier ? body.tier.article : "a";
    const capitalVerb = verb.charAt(0).toUpperCase() + verb.slice(1);

    return {
      groupKey: "body-defeat:" + verb + ":" + mob.kind + ":" + bodyName,
      format: function (count) {
        if (count === 1) {
          return mobLabel + " " + verb + " by " + bodyArticle + " " + bodyName + ".";
        }
        return capitalVerb + " " + count + " " + pluralizeMobName(mobLabel) + " with " + pluralizeBodyName(bodyName) + ".";
      }
    };
  }

  function notificationIncrement(options) {
    const increment = Number(options && options.increment);
    return Number.isFinite(increment) ? Math.max(1, Math.floor(increment)) : 1;
  }

  function notificationInitialCount(options) {
    const count = Number(options && options.initialCount);
    return Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  }

  function notificationLifetime(options) {
    const lifetime = Number(options && options.lifetime);
    return Number.isFinite(lifetime) ? Math.max(700, lifetime) : 2200;
  }

  function scheduleNotificationRemoval(element, groupKey, options) {
    const group = groupKey ? notificationGroups.get(groupKey) : null;
    const lifetime = notificationLifetime(options);

    if (group) {
      window.clearTimeout(group.leaveTimer);
      window.clearTimeout(group.removeTimer);
      group.leaveTimer = window.setTimeout(function () {
        element.classList.add("is-leaving");
      }, lifetime);
      group.removeTimer = window.setTimeout(function () {
        if (notificationGroups.get(groupKey) === group) {
          notificationGroups.delete(groupKey);
        }
        element.remove();
      }, lifetime + 400);
      return;
    }

    window.setTimeout(function () {
      element.classList.add("is-leaving");
    }, lifetime);

    window.setTimeout(function () {
      element.remove();
    }, lifetime + 400);
  }

  function maybeNotifyText(message, options) {
    const groupKey = options && options.groupKey ? String(options.groupKey) : "";
    const formatter = options && typeof options.format === "function" ? options.format : null;

    if (groupKey && notificationGroups.has(groupKey)) {
      const group = notificationGroups.get(groupKey);
      group.count += notificationIncrement(options);
      group.format = formatter || group.format;
      group.actions = notificationActions(options) || group.actions;
      group.element.classList.remove("is-leaving");
      renderNotificationContent(group.element, group.format ? group.format(group.count) : message, group.actions);
      scheduleNotificationRemoval(group.element, groupKey, options);
      return;
    }

    const element = document.createElement("div");
    const initialCount = notificationInitialCount(options);
    const actions = notificationActions(options);
    element.className = "notification";
    renderNotificationContent(element, formatter ? formatter(initialCount) : message, actions);
    notifications.appendChild(element);

    if (groupKey) {
      notificationGroups.set(groupKey, {
        element,
        count: initialCount,
        format: formatter,
        actions,
        leaveTimer: 0,
        removeTimer: 0
      });
    }

    scheduleNotificationRemoval(element, groupKey, options);
  }

  function updateGroupedNotificationText(groupKey, message, options) {
    if (!groupKey) {
      maybeNotifyText(message, options);
      return;
    }

    const group = notificationGroups.get(String(groupKey));
    if (!group || !group.element) {
      maybeNotifyText(message, Object.assign({}, options, { groupKey: String(groupKey), increment: 0 }));
      return;
    }

    group.element.classList.remove("is-leaving");
    group.actions = notificationActions(options) || group.actions;
    renderNotificationContent(group.element, message, group.actions);
    scheduleNotificationRemoval(group.element, String(groupKey), options);
  }

  function notificationActions(options) {
    const actions = options && Array.isArray(options.actions) ? options.actions : [];
    const normalized = actions.filter(function (action) {
      return action && typeof action.label === "string" && typeof action.onClick === "function";
    });
    return normalized.length ? normalized : null;
  }

  function renderNotificationContent(element, message, actions) {
    element.textContent = "";
    const label = document.createElement("span");
    label.className = "notification__message";
    label.textContent = message;
    element.append(label);

    if (!actions || !actions.length) {
      return;
    }

    const actionList = document.createElement("span");
    actionList.className = "notification__actions";
    for (const action of actions) {
      const button = document.createElement("button");
      const stopNotificationPointer = function (event) {
        event.preventDefault();
        event.stopPropagation();
      };
      button.type = "button";
      button.className = "notification__action";
      button.textContent = action.label;
      button.addEventListener("pointerdown", stopNotificationPointer);
      button.addEventListener("pointerup", stopNotificationPointer);
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        action.onClick();
      });
      actionList.append(button);
    }
    element.append(actionList);
  }

  function maybeNotifyTier(tier, previousTier) {
    if (tier.name === "particle" || tier.threshold <= previousTier.threshold) {
      return;
    }

    const highestTier = celestialBodyBlueprints[lifeStats.maxTierName] || bodyTiers[0];
    if (highestTier && highestTier.threshold > tier.threshold) {
      return;
    }

    if (!highestTier || tier.threshold > highestTier.threshold) {
      lifeStats.maxMass = Math.max(lifeStats.maxMass, tier.threshold);
      lifeStats.maxTierName = tier.name;
    }

    maybeNotifyText("You have made " + tier.article + " " + tier.name + ".");
  }
