import type { appRouter } from "@paramlab/api";
import type { RouterClient } from "@orpc/server";

declare global {
  // eslint-disable-next-line no-var
  var $client: RouterClient<typeof appRouter> | undefined;
}
