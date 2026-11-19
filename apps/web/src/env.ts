import { env as baseEnv } from "@acme/config";
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    PORT: z.coerce.number().default(3000),
  },
  client: {
    /**
     * Optional override for the oRPC API origin. Leave unset to use the
     * built-in Next.js route handler at `/api/orpc` (recommended). Set it to
     * the URL of a standalone API server if you run the API separately.
     */
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});

// Re-export base env for convenience
export { baseEnv };
