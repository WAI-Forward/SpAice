const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/healthz") {
    writeJson(response, 200, { ok: true, service: "clusternauts" });
    return;
  }

  if (url.pathname === "/auth/login" || url.pathname === "/auth/launch/callback" || url.pathname === "/auth/portal-login-complete") {
    void handleWaiAuthRoute(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    applyCorsHeaders(request, response);

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Cache-Control": "no-store"
      });
      response.end();
      return;
    }
  }

  if (url.pathname.startsWith("/api/auth/")) {
    void handleAuthRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/account") {
    void handleAccountRequest(request, response);
    return;
  }

  if (url.pathname === "/api/skins" || url.pathname.startsWith("/api/skins/")) {
    void handleSkinRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/stripe/status") {
    void handleStripeStatusRequest(request, response);
    return;
  }

  if (url.pathname === "/api/stripe/webhook") {
    void handleStripeWebhookRequest(request, response);
    return;
  }

  if (url.pathname === "/api/saves" || url.pathname.startsWith("/api/saves/")) {
    void handleAccountSaveRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/bootstrap" || url.pathname.startsWith("/api/players/") || url.pathname.startsWith("/api/friends/")) {
    void handleSocialRequest(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/reset/")) {
    void handleResetRequest(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/world/")) {
    void handleWorldRequest(request, response, url);
    return;
  }

  if (url.pathname.startsWith("/api/leaderboard")) {
    void handleLeaderboardRequest(request, response, url);
    return;
  }

  if (url.pathname === "/api/client-error") {
    void handleClientErrorRequest(request, response);
    return;
  }

  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(root, "." + requestedPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(request, response, filePath);
});

