server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`[Clusternauts server] Port ${port} is already in use. Stop the other npm start window, or run with a different PORT.`);
    return;
  }

  if (error && error.code === "EACCES") {
    console.error(`[Clusternauts server] Permission denied while binding ${host}:${port}. Check Windows Firewall or run from a terminal with permission to accept network connections.`);
    return;
  }

  console.error("[Clusternauts server] Server error:", error);
});

process.on("uncaughtExceptionMonitor", (error) => {
  logClusternautsError("uncaught exception", {
    message: error instanceof Error ? error.message : "unknown error",
    stack: error instanceof Error ? error.stack : ""
  });
});

process.on("unhandledRejection", (reason) => {
  logClusternautsError("unhandled rejection", {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : ""
  });
});

server.listen(port, host, () => {
  console.log("Clusternauts is running at:");
  for (const advertisedHost of advertisedHosts) {
    console.log(`  http://${advertisedHost}:${port}`);
  }
});
