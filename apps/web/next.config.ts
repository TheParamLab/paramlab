import type { NextConfig } from "next";

import "./src/env";

/**
 * Security headers applied to every response — the same pragmatic baseline
 * as `apps/app` (inline scripts are needed for the theme detector and JSON-LD).
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ")
  .concat(";");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const config: NextConfig = {
  output: "standalone",
  /** @acme/ui is consumed as TypeScript source (`exports` → src/). */
  transpilePackages: ["@acme/ui"],
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
