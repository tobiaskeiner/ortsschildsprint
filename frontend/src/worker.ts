interface ServiceBinding {
  fetch: typeof fetch;
}

interface Env {
  ASSETS: ServiceBinding;
  ORTSSCHILDSPRINT_API: ServiceBinding;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const upstreamUrl = new URL(request.url);
      upstreamUrl.pathname = url.pathname.replace(/^\/api/, "") || "/";

      return env.ORTSSCHILDSPRINT_API.fetch(new Request(upstreamUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
