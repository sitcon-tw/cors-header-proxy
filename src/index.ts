export default {
  async fetch(request): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };

    const ALLOWED_FRONTEND_ORIGINS = new Set(["https://sitcon.org"]);

    const ALLOWED_TARGET_ORIGINS = new Set([
      "https://anchor.fm",
      "https://feeds.soundon.fm",
    ]);

    async function handleRequest(request) {
      const origin = request.headers.get("Origin");
      if (!origin || !ALLOWED_FRONTEND_ORIGINS.has(origin)) {
        return new Response("Forbidden: Origin not allowed or missing", {
          status: 403,
        });
      }

      const url = new URL(request.url);
      const apiUrl = url.searchParams.get("url");

      if (!apiUrl) {
        return new Response("Missing 'url' parameter", { status: 400 });
      }

      try {
        const targetUrl = new URL(apiUrl);
        if (!ALLOWED_TARGET_ORIGINS.has(targetUrl.origin)) {
          return new Response("Forbidden: Target URL origin not allowed", {
            status: 403,
          });
        }
      } catch (e) {
        return new Response("Invalid target URL", { status: 400 });
      }

      // Create a clean set of headers for the outgoing request
      const filteredRequestHeaders = new Headers();
      const allowedRequestHeaders = [
        "accept",
        "accept-language",
        "content-type",
        "user-agent",
      ];

      for (const header of allowedRequestHeaders) {
        const value = request.headers.get(header);
        if (value) {
          filteredRequestHeaders.set(header, value);
        }
      }

      // Rewrite request to point to API URL. This also makes the request mutable
      // so you can add the correct Origin header to make the API server think
      // that this request is not cross-site.
      request = new Request(apiUrl, {
        method: request.method,
        headers: filteredRequestHeaders,
        body: request.body,
        redirect: "follow",
      });
      request.headers.set("Origin", new URL(apiUrl).origin);
      let response = await fetch(request);
      // Recreate the response so you can modify the headers

      const filteredResponseHeaders = new Headers();
      const allowedResponseHeaders = [
        "cache-control",
        "content-encoding",
        "content-type",
        "date",
        "expires",
        "last-modified",
        "pragma",
      ];

      for (const header of allowedResponseHeaders) {
        const value = response.headers.get(header);
        if (value) {
          filteredResponseHeaders.set(header, value);
        }
      }

      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: filteredResponseHeaders,
      });

      // Set CORS headers
      response.headers.set("Access-Control-Allow-Origin", origin);

      // Append to/Add Vary header so browser will cache response correctly
      response.headers.append("Vary", "Origin");

      return response;
    }

    async function handleOptions(request) {
      const origin = request.headers.get("Origin");
      if (!origin || !ALLOWED_FRONTEND_ORIGINS.has(origin)) {
        return new Response("Forbidden: Origin not allowed or missing", {
          status: 403,
        });
      }

      if (
        origin !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
      ) {
        // Handle CORS preflight requests.
        return new Response(null, {
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": request.headers.get(
              "Access-Control-Request-Headers",
            ),
          },
        });
      } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
          headers: {
            Allow: "GET, HEAD, POST, OPTIONS",
          },
        });
      }
    }

    if (request.method === "OPTIONS") {
      // Handle CORS preflight requests
      return handleOptions(request);
    } else if (
      request.method === "GET" ||
      request.method === "HEAD" ||
      request.method === "POST"
    ) {
      // Handle requests to the API server
      return handleRequest(request);
    } else {
      return new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
    }
  },
} satisfies ExportedHandler;
