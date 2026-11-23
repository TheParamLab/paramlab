import { describe, expect, test } from "bun:test";
import {
  buildDraftPart,
  DRAFT_PART_STORAGE_KEY,
  formatDraftDimensionFormula,
  readDraftPartFromSearchParams,
  readDraftPartFromStorage,
  restoreDraftPart,
  saveDraftPart,
} from "./draft-part";

describe("draft-part", () => {
  test("formats bushing and gear formulas as D × T × H", () => {
    expect(
      formatDraftDimensionFormula("bushing", { d1: 42, d2: 34, h: 30 }),
    ).toBe("D42 × T4 × H30");
  });

  test("builds a complete draft part with PETG-CF defaults and computed price", () => {
    const draft = buildDraftPart({
      partType: "bushing",
      materialId: "petgcf",
      dimensions: { d1: 42, d2: 34, h: 30 },
      quantity: 2,
    });

    if (!draft) throw new Error("Expected a valid draft");

    expect(draft.partType).toBe("bushing");
    expect(draft.materialCode).toBe("PETG-CF");
    expect(draft.dimensionFormula).toBe("D42 × T4 × H30");
    expect(draft.quantity).toBe(2);
    expect(draft.totalPriceRub).toBeGreaterThan(0);
  });

  test("reads draft part from URLSearchParams JSON or individual query params", () => {
    const jsonParams = new URLSearchParams({
      [DRAFT_PART_STORAGE_KEY]: JSON.stringify({
        partType: "bushing",
        materialCode: "PETG-CF",
        dimensionFormula: "D42 × T4 × H30",
        dimensions: { d1: 42, d2: 34, h: 30 },
        quantity: 3,
        totalPriceRub: 1850,
      }),
    });

    const parsedFromJson = readDraftPartFromSearchParams(jsonParams);
    expect(parsedFromJson).not.toBeNull();
    expect(parsedFromJson?.dimensionFormula).toBe("D42 × T4 × H30");
    expect(parsedFromJson?.materialCode).toBe("PETG-CF");
    expect(parsedFromJson?.totalPriceRub).toBe(1850);

    const queryParams = new URLSearchParams({
      partType: "din-box",
      material: "pa12",
      d1: "110",
      d2: "74",
      h: "42",
      qty: "4",
    });

    const parsedFromQuery = readDraftPartFromSearchParams(queryParams);
    expect(parsedFromQuery).not.toBeNull();
    expect(parsedFromQuery?.partType).toBe("din-box");
    expect(parsedFromQuery?.materialCode).toBe("PA12 Nylon");
    expect(parsedFromQuery?.dimensionFormula).toBe("L110 × W74 × H42");
    expect(parsedFromQuery?.quantity).toBe(4);
  });

  test("keeps the same plant tag inscription through URL and saved-formula imports", () => {
    const query = new URLSearchParams({ partType: "plant-tag", text: "   " });
    const draft = readDraftPartFromSearchParams(query);
    expect(draft?.labelText).toBe("ТОМАТ");
    expect(draft?.dimensionFormula).toBe("L124 × W26 × H3 · «ТОМАТ»");

    const imported = buildDraftPart({
      partType: "plant-tag",
      labelText: "  баклажан 123456  ",
      dimensionFormula: "  L124 × W26 × H3  ",
    });
    expect(imported?.labelText).toBe("БАКЛАЖАН 123");
    expect(imported?.dimensionFormula).toBe("L124 × W26 × H3 · «БАКЛАЖАН 123»");
    expect(buildDraftPart({ ...imported })?.dimensionFormula).toBe(
      imported?.dimensionFormula,
    );
  });

  test("returns null when searchParams contain no draft fields", () => {
    const emptyParams = new URLSearchParams({ callbackUrl: "/orders" });
    expect(readDraftPartFromSearchParams(emptyParams)).toBeNull();
  });
});

function withDraftStorage(check: () => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const storage = () => {
    const items = new Map<string, string>();
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
    };
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage(), localStorage: storage() },
  });
  try {
    check();
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test("keeps stored metadata for the same configuration and for a marker-only URL", () => {
  withDraftStorage(() => {
    const draft = buildDraftPart({
      partType: "bushing",
      dimensions: { d1: 42, d2: 34, h: 30 },
      quantity: 2,
      city: "Казань",
    });
    if (!draft) throw new Error("Expected a valid draft");
    saveDraftPart(draft);

    const marker = new URLSearchParams({ draft: "1" });
    expect(readDraftPartFromSearchParams(marker)).toBeNull();
    expect(restoreDraftPart(marker)).toEqual(draft);

    const config = new URLSearchParams({
      partType: "bushing",
      d1: "42",
      d2: "34",
      h: "30",
      qty: "2",
    });
    expect(restoreDraftPart(config)).toEqual(draft);
    config.set("qty", "3");
    expect(restoreDraftPart(config)?.city).toBeUndefined();
    expect(readDraftPartFromStorage()?.quantity).toBe(3);
  });
});

test("validates template ranges before adjusting the bore and keeps missing-dimension defaults", () => {
  const query = new URLSearchParams({
    partType: "bushing",
    d1: "42",
    d2: "80",
  });
  expect(readDraftPartFromSearchParams(query)?.dimensions).toEqual({
    d1: 42,
    d2: 38,
    h: 48,
  });
  query.set("d2", "141");
  expect(readDraftPartFromSearchParams(query)).toBeNull();
  query.delete("d2");
  query.set("d1", "19.9");
  expect(readDraftPartFromSearchParams(query)).toBeNull();

  withDraftStorage(() => {
    window.localStorage.setItem(
      DRAFT_PART_STORAGE_KEY,
      JSON.stringify({
        partType: "gear",
        dimensions: { h: 81 },
      }),
    );
    expect(readDraftPartFromStorage()).toBeNull();
  });
});
