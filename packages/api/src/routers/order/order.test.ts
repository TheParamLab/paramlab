import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Session } from "@acme/auth";
import { call } from "@orpc/server";

import { createSession, setupTestApi } from "../../../test/helpers";
import { adminOrdersRouter } from "../admin/orders";
import { partRouter } from "../part";
import { orderRouter } from ".";

let api: Awaited<ReturnType<typeof setupTestApi>>;

beforeAll(async () => {
  api = await setupTestApi();
});
afterAll(() => api.close());

/** Загружает «файл» и сохраняет деталь массой 50 г. */
async function createPart(session: Session, fileName = "bushing.stl") {
  const upload = await call(
    partRouter.requestUpload,
    { fileName, withPreview: true },
    { context: api.context(session) },
  );
  return call(
    partRouter.create,
    {
      name: "Втулка",
      fileKey: upload.file.key,
      fileName,
      fileSize: 1024,
      previewKey: upload.preview?.key ?? null,
      size: [40, 40, 25],
      massGrams: 50,
      materialId: "petg",
    },
    { context: api.context(session) },
  );
}

describe("part", () => {
  it("rejects unsupported file formats", async () => {
    const session = await createSession(api.db);
    const promise = call(
      partRouter.requestUpload,
      { fileName: "virus.exe" },
      { context: api.context(session) },
    );
    await expect(promise).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("scopes upload keys to the user and rejects foreign keys", async () => {
    const owner = await createSession(api.db);
    const thief = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "a.step" },
      { context: api.context(owner) },
    );
    expect(upload.file.key).toStartWith(`parts/${owner.user.id}/`);
    expect(upload.file.key).toEndWith(".step");
    expect(upload.preview).toBeNull();

    const promise = call(
      partRouter.create,
      {
        name: "Чужая",
        fileKey: upload.file.key,
        fileName: "a.step",
        fileSize: 10,
        massGrams: 10,
        materialId: "asa",
      },
      { context: api.context(thief) },
    );
    await expect(promise).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lists only the caller's parts, without the raw file key", async () => {
    const session = await createSession(api.db);
    const other = await createSession(api.db);
    const part = await createPart(session);
    await createPart(other);

    const list = await call(partRouter.list, undefined, {
      context: api.context(session),
    });
    expect(list.map((p) => p.id)).toEqual([part.id]);
    expect(list[0]).toMatchObject({
      format: "stl",
      sizeX: 40,
      massGrams: 50,
      lastOrder: null,
    });
    expect(list[0]?.previewUrl).toContain(`parts/${session.user.id}/`);
    expect(list[0]).not.toHaveProperty("fileKey");
  });

  it("does not let another user delete a part", async () => {
    const session = await createSession(api.db);
    const other = await createSession(api.db);
    const part = await createPart(session);

    await expect(
      call(partRouter.delete, { id: part.id }, { context: api.context(other) }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("order", () => {
  it("prices the order on the server and starts the tracker", async () => {
    const session = await createSession(api.db);
    const part = await createPart(session);

    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "petg", quantity: 10 },
      { context: api.context(session) },
    );
    // 400 + 50 г × 10 шт. × 18 ₽ × 0,8 (серия) = 7 600 ₽
    expect(order.totalRub).toBe(7600);
    expect(order.status).toBe("pending_payment");
    expect(order.number).toBeGreaterThanOrEqual(1001);

    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found.items).toHaveLength(1);
    expect(found.items[0]).toMatchObject({
      partName: "Втулка",
      quantity: 10,
      priceRub: 7600,
    });
    expect(found.events.map((e) => e.status)).toEqual(["pending_payment"]);

    const parts = await call(partRouter.list, undefined, {
      context: api.context(session),
    });
    expect(parts[0]?.lastOrder).toEqual({ quantity: 10, materialId: "petg" });
  });

  it("applies the minimum order price", async () => {
    const session = await createSession(api.db);
    const part = await createPart(session);
    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "petg", quantity: 1 },
      { context: api.context(session) },
    );
    expect(order.totalRub).toBe(1400);
  });

  it("does not order someone else's part or expose someone else's order", async () => {
    const owner = await createSession(api.db);
    const other = await createSession(api.db);
    const part = await createPart(owner);

    await expect(
      call(
        orderRouter.create,
        { partId: part.id, materialId: "petg", quantity: 1 },
        { context: api.context(other) },
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "petg", quantity: 1 },
      { context: api.context(owner) },
    );
    await expect(
      call(orderRouter.byId, { id: order.id }, { context: api.context(other) }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(
      await call(orderRouter.list, undefined, {
        context: api.context(other),
      }),
    ).toEqual([]);
  });

  it("keeps the order when the part is deleted", async () => {
    const session = await createSession(api.db);
    const part = await createPart(session);
    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "tpu", quantity: 2 },
      { context: api.context(session) },
    );
    await call(
      partRouter.delete,
      { id: part.id },
      { context: api.context(session) },
    );

    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found.items[0]).toMatchObject({ partId: null, partName: "Втулка" });
  });
});

describe("admin.orders.setStatus", () => {
  it("is forbidden for regular users", async () => {
    const session = await createSession(api.db);
    await expect(
      call(
        adminOrdersRouter.setStatus,
        { id: crypto.randomUUID(), status: "paid" },
        { context: api.context(session) },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("moves the order through stages and records events", async () => {
    const session = await createSession(api.db);
    const admin = await createSession(api.db, { role: "admin" });
    const part = await createPart(session);
    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "pa6cf", quantity: 1 },
      { context: api.context(session) },
    );

    await call(
      adminOrdersRouter.setStatus,
      { id: order.id, status: "paid" },
      { context: api.context(admin) },
    );
    await call(
      adminOrdersRouter.setStatus,
      {
        id: order.id,
        status: "shipped",
        carrier: "СДЭК",
        trackingNumber: "10012345678",
      },
      { context: api.context(admin) },
    );

    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found).toMatchObject({
      status: "shipped",
      carrier: "СДЭК",
      trackingNumber: "10012345678",
    });
    expect(found.events.map((e) => e.status)).toEqual([
      "pending_payment",
      "paid",
      "shipped",
    ]);
  });
});
