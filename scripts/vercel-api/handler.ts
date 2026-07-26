import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { InjectOptions } from "fastify";
import { buildApp } from "../../packages/backend/dist/app.js";

type FastifyApp = Awaited<ReturnType<typeof buildApp>>;

let appPromise: Promise<FastifyApp> | undefined;

async function getApp(): Promise<FastifyApp> {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }

  return appPromise;
}

function toApiPath(req: VercelRequest): string {
  const queryPath = req.query.path;

  if (typeof queryPath === "string" && queryPath.length > 0) {
    return `/${queryPath}`;
  }

  if (Array.isArray(queryPath) && queryPath.length > 0) {
    return `/${queryPath.join("/")}`;
  }

  const url = req.url ?? "/";
  const withoutApiPrefix = url.replace(/^\/api(?=\/|$)/, "");
  const withoutQuery = withoutApiPrefix.split("?")[0] ?? withoutApiPrefix;
  return withoutQuery || "/";
}

function buildInjectOptions(req: VercelRequest): InjectOptions {
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }

    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  const options: InjectOptions = {
    method: (req.method ?? "GET").toUpperCase() as InjectOptions["method"],
    url: toApiPath(req),
    headers,
  };

  if (
    req.method &&
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.body !== undefined
  ) {
    options.payload =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (!headers["content-type"] && !headers["Content-Type"]) {
      headers["content-type"] = "application/json";
    }
  }

  return options;
}

async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const app = await getApp();
  const response = await app.inject(buildInjectOptions(req));

  res.statusCode = response.statusCode;

  for (const [key, value] of Object.entries(response.headers)) {
    if (value === undefined) {
      continue;
    }

    res.setHeader(key, value);
  }

  res.end(response.payload);
}

export default handler;

export const config = {
  api: {
    bodyParser: true,
  },
};
