import { createRequestHandler } from "@react-router/cloudflare";
import { getLoadContext, type Env } from "./load-context";

// @ts-ignore - This will be generated after build
import * as build from "./build/server";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const loadContext = getLoadContext(env);
    const handler = createRequestHandler(build, process.env.NODE_ENV);
    return handler(request, loadContext);
  },
};