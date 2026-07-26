import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { InjectOptions } from "fastify";
import { buildApp } from "./app.js";

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

function toApiPath(url: string): string {
  const withoutApiPrefix = url.replace(/^\/api(?=\/|$)/, "");
  return withoutApiPrefix || "/";
}

function buildInjectOptions(req: VercelRequest): InjectOptions {
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }

    headers[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  const options: InjectOptions = {
    method: (req.method ?? "GET").toUpperCase() as InjectOptions["method"],
    url: toApiPath(req.url ?? "/"),
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

export default async function handler(
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

export const config = {
  api: {
    bodyParser: true,
  },
};
