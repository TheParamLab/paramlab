import { expect, it, spyOn } from "bun:test";
import { env } from "@paramlab/config";

import { ozonCheckClient, ozonDeliveryPointInfo } from "./ozon-delivery";

it("preserves int64 tokens without changing strings and validates eligibility", async () => {
  const client = env.OZON_DELIVERY_CLIENT_ID;
  const secret = env.OZON_DELIVERY_CLIENT_SECRET;
  env.OZON_DELIVERY_CLIENT_ID = "test-client";
  env.OZON_DELIVERY_CLIENT_SECRET = "test-secret";
  const fetch = spyOn(globalThis, "fetch");
  try {
    fetch.mockResolvedValueOnce(
      Response.json({ access_token: "test-token", expires_in: 120 }),
    );
    const address = 'Москва, 123456789012345, "корпус", [987654321012345]';
    fetch.mockResolvedValueOnce(
      new Response(
        `{"delivery_points":[{"delivery_point_id":9223372036854775807,"full_address":${JSON.stringify(address)}}]}`,
      ),
    );
    expect(
      (await ozonDeliveryPointInfo(["9223372036854775807"])).delivery_points,
    ).toEqual([
      { delivery_point_id: "9223372036854775807", full_address: address },
    ]);

    fetch.mockResolvedValueOnce(Response.json({ can_be_delivered: false }));
    await expect(ozonCheckClient("+79991234567")).resolves.toBe(false);
    fetch.mockResolvedValueOnce(Response.json({ can_be_delivered: "false" }));
    await expect(ozonCheckClient("+79991234567")).rejects.toThrow();
    fetch.mockResolvedValueOnce(Response.json({}));
    await expect(ozonCheckClient("+79991234567")).rejects.toThrow();
  } finally {
    fetch.mockRestore();
    env.OZON_DELIVERY_CLIENT_ID = client;
    env.OZON_DELIVERY_CLIENT_SECRET = secret;
  }
});
