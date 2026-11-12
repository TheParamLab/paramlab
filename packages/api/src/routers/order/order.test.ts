import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Session } from "@acme/auth";
import { eq, OrderEvent, OrderItem } from "@acme/db";
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
    { fileName, fileSize: 1024, previewSize: 2048 },
    { context: api.context(session) },
  );
  api.upload(upload.file.key, 1024);
  if (upload.preview) api.upload(upload.preview.key, 2048);
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
      { fileName: "virus.exe", fileSize: 10 },
      { context: api.context(session) },
    );
    await expect(promise).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("scopes upload keys to the user and rejects foreign keys", async () => {
    const owner = await createSession(api.db);
    const thief = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "a.step", fileSize: 10 },
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
      await call(
        orderRouter.list,
        {},
        {
          context: api.context(other),
        },
      ),
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

describe("review fixes", () => {
  it("signs the declared size and refuses oversized uploads", async () => {
    const session = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "a.stl", fileSize: 4096, previewSize: 512 },
      { context: api.context(session) },
    );
    expect(upload.file.url).toEndWith("?size=4096");
    expect(upload.preview?.url).toEndWith("?size=512");

    await expect(
      call(
        partRouter.requestUpload,
        { fileName: "a.stl", fileSize: 100 * 1024 * 1024 + 1 },
        { context: api.context(session) },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      call(
        partRouter.requestUpload,
        { fileName: "a.stl", fileSize: 10, previewSize: 3 * 1024 * 1024 },
        { context: api.context(session) },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("recalculates mass for another material from the model volume", async () => {
    const session = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "a.stl", fileSize: 10 },
      { context: api.context(session) },
    );
    api.upload(upload.file.key, 10);
    // 100 см³: 64 г в PETG, 54 г в ASA.
    const part = await call(
      partRouter.create,
      {
        name: "Корпус",
        fileKey: upload.file.key,
        fileName: "a.stl",
        fileSize: 10,
        volumeCm3: 100,
        massGrams: 64,
        materialId: "petg",
      },
      { context: api.context(session) },
    );
    expect(part.volumeCm3).toBe(100);

    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "asa", quantity: 2 },
      { context: api.context(session) },
    );
    // 400 + 54 г × 2 шт. × 24 ₽ = 2 992 → 2 990 ₽
    expect(order.totalRub).toBe(2990);
    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found.items[0]?.massGrams).toBe(54);
  });

  it("keeps a manually corrected mass for every material", async () => {
    const session = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "a.stl", fileSize: 10 },
      { context: api.context(session) },
    );
    api.upload(upload.file.key, 10);
    const part = await call(
      partRouter.create,
      {
        name: "Корпус",
        fileKey: upload.file.key,
        fileName: "a.stl",
        fileSize: 10,
        volumeCm3: 100,
        massGrams: 80,
        materialId: "petg",
      },
      { context: api.context(session) },
    );
    expect(part.volumeCm3).toBeNull();
  });

  it("snapshots the model file on the order item", async () => {
    const session = await createSession(api.db);
    const part = await createPart(session);
    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "petg", quantity: 1 },
      { context: api.context(session) },
    );
    await call(
      partRouter.delete,
      { id: part.id },
      { context: api.context(session) },
    );

    const [item] = await api.db
      .select()
      .from(OrderItem)
      .where(eq(OrderItem.orderId, order.id));
    expect(item).toMatchObject({
      partId: null,
      fileKey: part.fileKey,
      fileName: "bushing.stl",
    });

    // Клиенту ключ S3 не отдаем.
    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found.items[0]).not.toHaveProperty("fileKey");
  });

  it("records no event when the order does not exist", async () => {
    const admin = await createSession(api.db, { role: "admin" });
    const id = crypto.randomUUID();
    await expect(
      call(
        adminOrdersRouter.setStatus,
        { id, status: "paid", note: "нет такого" },
        { context: api.context(admin) },
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(
      await api.db.select().from(OrderEvent).where(eq(OrderEvent.orderId, id)),
    ).toEqual([]);
  });

  it("stores the note with the stage event", async () => {
    const session = await createSession(api.db);
    const admin = await createSession(api.db, { role: "admin" });
    const part = await createPart(session);
    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "petg", quantity: 1 },
      { context: api.context(session) },
    );
    const updated = await call(
      adminOrdersRouter.setStatus,
      { id: order.id, status: "printing", note: "Стол 2" },
      { context: api.context(admin) },
    );
    expect(updated).toMatchObject({ id: order.id, status: "printing" });

    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found.events.at(-1)).toMatchObject({
      status: "printing",
      note: "Стол 2",
    });
  });
});

describe("second review round", () => {
  it("requires the model to be uploaded with the declared size", async () => {
    const session = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "b.stl", fileSize: 10 },
      { context: api.context(session) },
    );
    const input = {
      name: "Без файла",
      fileKey: upload.file.key,
      fileName: "b.stl",
      fileSize: 10,
      massGrams: 10,
      materialId: "petg" as const,
    };
    await expect(
      call(partRouter.create, input, { context: api.context(session) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    api.upload(upload.file.key, 11);
    await expect(
      call(partRouter.create, input, { context: api.context(session) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    api.upload(upload.file.key, 10);
    const part = await call(partRouter.create, input, {
      context: api.context(session),
    });
    expect(part.fileSize).toBe(10);
  });

  it("rejects a file name whose format differs from the uploaded key", async () => {
    const session = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "b.stl", fileSize: 10 },
      { context: api.context(session) },
    );
    api.upload(upload.file.key, 10);
    await expect(
      call(
        partRouter.create,
        {
          name: "Подмена",
          fileKey: upload.file.key,
          fileName: "b.step",
          fileSize: 10,
          massGrams: 10,
          materialId: "petg",
        },
        { context: api.context(session) },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("drops a preview that was never uploaded", async () => {
    const session = await createSession(api.db);
    const upload = await call(
      partRouter.requestUpload,
      { fileName: "b.stl", fileSize: 10, previewSize: 5 },
      { context: api.context(session) },
    );
    api.upload(upload.file.key, 10);
    const part = await call(
      partRouter.create,
      {
        name: "Без превью",
        fileKey: upload.file.key,
        fileName: "b.stl",
        fileSize: 10,
        previewKey: upload.preview?.key ?? null,
        massGrams: 10,
        materialId: "petg",
      },
      { context: api.context(session) },
    );
    expect(part.previewKey).toBeNull();
  });

  it("paginates the order list", async () => {
    const session = await createSession(api.db);
    const part = await createPart(session);
    for (const quantity of [1, 2, 3]) {
      await call(
        orderRouter.create,
        { partId: part.id, materialId: "petg", quantity },
        { context: api.context(session) },
      );
    }
    const page = await call(
      orderRouter.list,
      { limit: 2, offset: 0 },
      { context: api.context(session) },
    );
    const rest = await call(
      orderRouter.list,
      { limit: 2, offset: 2 },
      { context: api.context(session) },
    );
    expect(page).toHaveLength(2);
    expect(rest).toHaveLength(1);
    expect(page[0]?.items).toHaveLength(1);
  });

  it("accepts only https tracking links", async () => {
    const admin = await createSession(api.db, { role: "admin" });
    await expect(
      call(
        adminOrdersRouter.setStatus,
        {
          id: crypto.randomUUID(),
          status: "shipped",
          trackingUrl: "http://track.example/1",
        },
        { context: api.context(admin) },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("event order", () => {
  it("orders events by write sequence, not by timestamp", async () => {
    const session = await createSession(api.db);
    const part = await createPart(session);
    const order = await call(
      orderRouter.create,
      { partId: part.id, materialId: "petg", quantity: 1 },
      { context: api.context(session) },
    );
    // Одинаковое и даже более раннее время не должно менять порядок.
    const past = new Date(0);
    await api.db
      .insert(OrderEvent)
      .values({ orderId: order.id, status: "paid", createdAt: past });
    await api.db
      .insert(OrderEvent)
      .values({ orderId: order.id, status: "printing", createdAt: past });

    const found = await call(
      orderRouter.byId,
      { id: order.id },
      { context: api.context(session) },
    );
    expect(found.events.map((e) => e.status)).toEqual([
      "pending_payment",
      "paid",
      "printing",
    ]);
  });
});
