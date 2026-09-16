async function handleWaiAuthRoute(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/auth/login") {
      redirectToWaiLogin(request, response, url.searchParams.get("return_to"), url);
      return;
    }

    if (request.method === "GET" && url.pathname === "/auth/launch/callback") {
      await handleWaiLaunchCallback(request, response, url);
      return;
    }

    if (request.method === "GET" && url.pathname === "/auth/portal-login-complete") {
      writePortalLoginCompletePage(response, url);
      return;
    }

    writeJson(response, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    logClusternautsError("wai auth route error", {
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown error"
    });
    writeJson(response, error && Number.isFinite(error.status) ? error.status : 500, {
      ok: false,
      message: error instanceof Error ? error.message : "WAi login failed."
    });
  }
}

function redirectToWaiLogin(request, response, returnTo, url) {
  const safeReturn = safeReturnPath(returnTo);
  const attemptId = authAttemptIdFromPath(safeReturn) || authAttemptIdFromUrl(url);
  logClusternautsAuth("wai login redirect", {
    attemptId,
    returnTo: safeReturn,
    portal: isPortalLoginCompletePath(safeReturn),
    websiteUrl,
    appLaunchUrl: `${websiteUrl}/auth/app-launch`,
    callbackParam: safeReturn,
    request: authRequestDetails(request)
  });
  const params = new URLSearchParams({
    app: "clusternauts",
    callback: safeReturn
  });
  response.writeHead(302, { Location: `${websiteUrl}/auth/app-launch?${params.toString()}` });
  response.end();
}

function writePortalLoginCompletePage(response, url) {
  const attemptId = authAttemptIdFromUrl(url);
  logClusternautsAuth("portal completion page served", {
    attemptId,
    hasTransfer: Boolean(url.searchParams.get("transfer")),
    queryKeys: Array.from(url.searchParams.keys()).sort()
  });
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Clusternauts Login Complete</title>
  </head>
  <body>
    <p>Login complete. You can close this window.</p>
    <script>
      (function () {
        var params = new URLSearchParams(window.location.search || "");
        var authDebugId = params.get("auth_debug_id") || "";
        var message = {
          type: "clusternauts:wai-login-complete",
          authDebugId: authDebugId,
          transfer: params.get("transfer") || ""
        };
        try {
          console.info("[Clusternauts auth] portal completion page loaded", {
            authDebugId: authDebugId,
            hasTransfer: Boolean(message.transfer),
            queryKeys: Array.from(params.keys()).sort()
          });
        } catch (error) {}
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, "*");
          }
        } catch (error) {}
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, "*");
          }
        } catch (error) {}
        window.setTimeout(function () {
          try {
            window.close();
          } catch (error) {}
        }, 250);
      }());
    </script>
  </body>
</html>`);
}

async function handleWaiLaunchCallback(request, response, url) {
  const attemptId = authAttemptIdFromUrl(url);
  const code = sanitizeDebugText(url.searchParams.get("code"), 2048);
  if (!code) {
    logClusternautsAuth("wai callback missing code", {
      attemptId,
      queryKeys: Array.from(url.searchParams.keys()).sort(),
      request: authRequestDetails(request)
    });
    redirectToWaiLogin(request, response, "/");
    return;
  }

  const callback = `${serviceBaseUrl(request)}/auth/launch/callback`;
  logClusternautsAuth("wai callback exchanging code", {
    attemptId,
    callback,
    returnTo: safeReturnPath(url.searchParams.get("return_to")),
    queryKeys: Array.from(url.searchParams.keys()).sort(),
    request: authRequestDetails(request)
  });
  const tokens = await exchangeWaiAuthorizationCode(code, callback);
  const payload = decodeWaiAccessTokenPayload(tokens && tokens.wf_access_token);
  if (!payload || !payload.user_id) {
    throwHttpError(401, "WAi account could not be verified.");
  }

  const result = await createWaiAccountSession(payload);
  const returnTo = safeReturnPath(url.searchParams.get("return_to"));
  const returnAttemptId = authAttemptIdFromPath(returnTo);
  const effectiveAttemptId = returnAttemptId || attemptId;
  const portalReturn = isPortalLoginCompletePath(returnTo);
  const redirectLocation = isPortalLoginCompletePath(returnTo)
    ? `${returnTo}?transfer=${encodeURIComponent(createPortalAuthTransfer(result.sessionToken))}`
    : returnTo;
  logClusternautsAuth("wai callback created session", {
    attemptId: effectiveAttemptId,
    username: result.account && result.account.username,
    waiLinked: Boolean(result.account && result.account.waiLinked),
    portal: portalReturn,
    redirectTo: portalReturn ? "/auth/portal-login-complete?transfer=redacted" : redirectLocation,
    returnTo,
    returnToHadAttemptId: Boolean(returnAttemptId),
    cookieSettings: cookieDebugDetails(request)
  });
  response.writeHead(302, {
    Location: redirectLocation,
    "Set-Cookie": buildAccountSessionCookie(request, result.sessionToken)
  });
  response.end();
}

function isPortalLoginCompletePath(pathValue) {
  return String(pathValue || "").split("?")[0] === "/auth/portal-login-complete";
}

function createPortalAuthTransfer(sessionToken) {
  const payload = Buffer.from(JSON.stringify({
    sessionToken,
    expiresAt: Date.now() + portalAuthTransferLifetimeMs,
    nonce: randomToken(12)
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", portalAuthTransferSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyPortalAuthTransfer(transferToken, attemptId) {
  const parts = String(transferToken || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    logClusternautsAuth("portal transfer rejected: malformed", {
      attemptId,
      hasTransfer: Boolean(transferToken),
      partCount: parts.length
    });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  const expected = crypto.createHmac("sha256", portalAuthTransferSecret).update(parts[0]).digest("base64url");
  const actual = parts[1];
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    logClusternautsAuth("portal transfer rejected: bad signature", {
      attemptId,
      payloadLength: parts[0].length,
      signatureLength: actual.length
    });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    logClusternautsAuth("portal transfer rejected: invalid payload json", { attemptId });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  if (!payload || payload.expiresAt <= Date.now()) {
    logClusternautsAuth("portal transfer rejected: expired", {
      attemptId,
      expiresAt: payload && payload.expiresAt,
      now: Date.now()
    });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }

  const sessionToken = sanitizeDebugText(payload.sessionToken, 200);
  if (!sessionToken) {
    logClusternautsAuth("portal transfer rejected: missing session token", { attemptId });
    throwHttpError(401, "Login transfer expired. Try logging in again.");
  }
  logClusternautsAuth("portal transfer accepted", {
    attemptId,
    expiresInMs: payload.expiresAt - Date.now()
  });
  return sessionToken;
}

async function exchangeWaiAuthorizationCode(code, callback) {
  const headers = { "content-type": "application/json" };
  if (coreTokenExchangeSecret) {
    headers.authorization = `Bearer ${coreTokenExchangeSecret}`;
  }

  let result;
  try {
    result = await fetch(`${websiteUrl}/auth/token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ code, callback })
    });
  } catch (error) {
    throwHttpError(503, "Could not reach WAi Forward login.");
  }

  if (!result.ok) {
    throwHttpError(401, `WAi login exchange failed with status ${result.status}.`);
  }
  return result.json();
}

async function createWaiAccountSession(payload) {
  const userId = sanitizeDebugText(String(payload.user_id || ""), 128);
  const username = sanitizeAccountUsername("wai-" + hashToken(userId).slice(0, 20));
  const displayName = sanitizeDebugText(payload.display_name || payload.user_name || payload.email || "WAi Forward member", 80);
  const birthdayMonthDay = extractWaiBirthdayMonthDay(payload);
  const playerId = sanitizeText("wai-" + hashToken("player:" + userId).slice(0, 20), 80);
  let account = await getAccount(username);

  if (!account) {
    account = await createAccount(username, randomToken(32), playerId);
    account.waiUserId = userId;
    account.waiEmail = sanitizeDebugText(payload.email, 200);
    account.waiDisplayName = displayName;
  }

  account.linkedPlayerId = account.linkedPlayerId || playerId;
  account.waiUserId = userId;
  account.waiEmail = sanitizeDebugText(payload.email, 200);
  account.waiDisplayName = displayName;
  account.waiBirthdayMonthDay = birthdayMonthDay || account.waiBirthdayMonthDay || "";
  account.lastLoginAt = Date.now();
  await saveAccount(account);
  await linkWaiPlayerProfile(account.linkedPlayerId, payload);

  const token = randomToken(32);
  await saveAccountSession({
    tokenHash: hashToken(token),
    username: account.username,
    createdAt: Date.now(),
    expiresAt: Date.now() + sessionLifetimeMs
  });

  return {
    ok: true,
    serverTime: Date.now(),
    sessionToken: token,
    account: publicAccount(account)
  };
}

async function linkWaiPlayerProfile(playerId, payload) {
  const cleanPlayerId = sanitizeText(playerId, 80);
  if (!cleanPlayerId) {
    return;
  }
  const profile = await ensurePlayerProfile(cleanPlayerId);
  if (!profile) {
    return;
  }
  const displayName = sanitizeDebugText(payload.display_name || payload.user_name || payload.email, 80);
  profile.waiUserId = sanitizeDebugText(String(payload.user_id || ""), 128);
  profile.waiEmail = sanitizeDebugText(payload.email, 200);
  if (displayName) {
    profile.publicName = displayName;
  }
  await saveProfile(profile);
}

function decodeWaiAccessTokenPayload(token) {
  const parts = String(token || "").split(".");
  const compressed = parts[0] === "";
  const payloadPart = compressed ? parts[1] : parts[0];
  if (!payloadPart) {
    return null;
  }

  try {
    const payloadBytes = base64UrlToBuffer(payloadPart);
    const jsonBytes = compressed ? zlib.inflateSync(payloadBytes) : payloadBytes;
    return JSON.parse(jsonBytes.toString("utf8"));
  } catch (error) {
    logClusternautsError("wai token decode failed", { message: error instanceof Error ? error.message : "unknown error" });
    return null;
  }
}

