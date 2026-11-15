interface ServiceBinding {
  fetch: typeof fetch;
}

interface Env {
  ASSETS: ServiceBinding;
  INTERNAL_API_SECRET: string;
  ORTSSCHILDSPRINT_API: ServiceBinding;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const upstreamUrl = new URL(request.url);
      upstreamUrl.pathname = url.pathname.replace(/^\/api/, "") || "/";
      const upstreamRequest = new Request(upstreamUrl, request);
      if (url.pathname === "/api/signs") {
        upstreamRequest.headers.set(
          "X-Ortsschildsprint-Internal-Secret",
          env.INTERNAL_API_SECRET,
        );
      }

      return env.ORTSSCHILDSPRINT_API.fetch(upstreamRequest);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
