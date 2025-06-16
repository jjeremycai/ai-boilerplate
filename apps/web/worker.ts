import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import { getLoadContext, type Env } from "./load-context";

// @ts-ignore - This will be generated after build
import * as build from "./build/server";

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const loadContext = getLoadContext(env);
    const handler = createRequestHandler(build, process.env.NODE_ENV);
    return handler(request, loadContext);
  },
};