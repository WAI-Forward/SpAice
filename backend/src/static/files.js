function sendFile(request, response, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const headers = staticFileHeaders(filePath, stats, extension);

    if (request.headers["if-none-match"] === headers.ETag) {
      response.writeHead(304, headers);
      response.end();
      return;
    }

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const shouldGzip = shouldGzipStaticFile(request, extension, data.length);
      if (!shouldGzip) {
        headers["Content-Length"] = data.length;
        response.writeHead(200, headers);
        response.end(request.method === "HEAD" ? undefined : data);
        return;
      }

      zlib.gzip(data, { level: 6 }, (gzipError, compressed) => {
        if (gzipError) {
          headers["Content-Length"] = data.length;
          response.writeHead(200, headers);
          response.end(request.method === "HEAD" ? undefined : data);
          return;
        }

        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = compressed.length;
        response.writeHead(200, headers);
        response.end(request.method === "HEAD" ? undefined : compressed);
      });
    });
  });
}

function staticFileHeaders(filePath, stats, extension) {
  return {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": staticCacheControl(filePath, extension),
    ETag: staticFileEtag(stats),
    "Last-Modified": stats.mtime.toUTCString(),
    Vary: "Accept-Encoding",
    "X-Content-Type-Options": "nosniff"
  };
}

function staticFileEtag(stats) {
  return `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
}

function staticCacheControl(filePath, extension) {
  if (path.basename(filePath).toLowerCase() === "index.html" || extension === ".html") {
    return "no-cache";
  }
  if (extension === ".js" || extension === ".css") {
    return "public, max-age=3600, must-revalidate";
  }
  return "public, max-age=86400";
}

function shouldGzipStaticFile(request, extension, byteLength) {
  if (!gzipStaticExtensions.has(extension) || byteLength < staticCompressionMinBytes) {
    return false;
  }
  return /\bgzip\b/i.test(String(request.headers["accept-encoding"] || ""));
}

