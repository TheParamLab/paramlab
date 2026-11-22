import { expect, test } from "bun:test";
import { normalizeAuthCallback } from "./auth-callback";

test("uses the normalized path, query and fragment for same-origin URLs", () => {
  const origin = "https://example.test";

  expect(
    normalizeAuthCallback("./checkout/../orders?view=all#new", origin),
  ).toBe("/orders?view=all#new");
  expect(normalizeAuthCallback("https://example.test/orders", origin)).toBe(
    "/orders",
  );
  expect(normalizeAuthCallback("https://[", origin)).toBeNull();
  expect(
    normalizeAuthCallback("https://another.test/orders", origin),
  ).toBeNull();
  expect(
    normalizeAuthCallback(String.raw`/\another.test/orders`, origin),
  ).toBeNull();
  expect(normalizeAuthCallback("/checkout/..//orders", origin)).toBeNull();
  expect(normalizeAuthCallback("javascript:alert(1)", origin)).toBeNull();
  expect(normalizeAuthCallback(null, origin)).toBeNull();
});
