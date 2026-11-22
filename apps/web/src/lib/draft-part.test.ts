import { describe, expect, test } from "bun:test";
import {
  buildDraftPart,
  DRAFT_PART_STORAGE_KEY,
  formatDraftDimensionFormula,
  readDraftPartFromSearchParams,
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

  test("returns null when searchParams contain no draft fields", () => {
    const emptyParams = new URLSearchParams({ callbackUrl: "/orders" });
    expect(readDraftPartFromSearchParams(emptyParams)).toBeNull();
  });
});
