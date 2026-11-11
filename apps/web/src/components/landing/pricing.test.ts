import { describe, expect, test } from "bun:test";
import { calcPrice, estimateMass, MIN_ORDER, parseBinaryStl } from "./pricing";

describe("calcPrice", () => {
  test("adds the machine start to mass × rate", () => {
    const price = calcPrice({
      massGrams: 85,
      rate: 18,
      quantity: 1,
      extras: 0,
    });
    expect(price.total).toBe(1930);
    expect(price.series).toBe(false);
  });

  test("never goes below the minimum order", () => {
    const price = calcPrice({
      massGrams: 10,
      rate: 18,
      quantity: 1,
      extras: 0,
    });
    expect(price.total).toBe(MIN_ORDER);
  });

  test("applies the series discount from 10 pieces", () => {
    const nine = calcPrice({
      massGrams: 100,
      rate: 20,
      quantity: 9,
      extras: 0,
    });
    const ten = calcPrice({
      massGrams: 100,
      rate: 20,
      quantity: 10,
      extras: 0,
    });
    expect(nine.total).toBe(400 + 100 * 9 * 20);
    expect(ten.series).toBe(true);
    expect(ten.total).toBe(400 + 100 * 10 * 20 * 0.8);
  });

  test("adds extras on top", () => {
    const price = calcPrice({
      massGrams: 100,
      rate: 20,
      quantity: 1,
      extras: 850,
    });
    expect(price.total).toBe(400 + 2000 + 850);
  });
});

describe("estimateMass", () => {
  test("grows with dimensions for every part type", () => {
    for (const type of ["adapter", "bushing", "din-box", "end-cap"] as const) {
      const small = estimateMass(type, { d1: 50, d2: 35, h: 30 }, 1.2);
      const large = estimateMass(type, { d1: 100, d2: 35, h: 30 }, 1.2);
      expect(small).toBeGreaterThan(0);
      expect(large).toBeGreaterThan(small);
    }
  });

  test("keeps a bushing wall when the bore exceeds the outer diameter", () => {
    expect(estimateMass("bushing", { d1: 20, d2: 200, h: 50 }, 1.2)).toBe(
      estimateMass("bushing", { d1: 20, d2: 16, h: 50 }, 1.2),
    );
  });
});

describe("parseBinaryStl", () => {
  test("reads bounding box and volume of a tetrahedron", () => {
    const o = [0, 0, 0];
    const x = [10, 0, 0];
    const y = [0, 20, 0];
    const z = [0, 0, 30];
    // Outward-facing winding.
    const faces = [
      [o, y, x],
      [o, x, z],
      [o, z, y],
      [x, y, z],
    ];
    const buffer = new ArrayBuffer(84 + faces.length * 50);
    const view = new DataView(buffer);
    view.setUint32(80, faces.length, true);
    faces.forEach((face, i) => {
      face.flat().forEach((value, j) => {
        view.setFloat32(84 + i * 50 + 12 + j * 4, value, true);
      });
    });

    const result = parseBinaryStl(buffer);
    expect(result?.size).toEqual([10, 20, 30]);
    expect(result?.volumeCm3).toBeCloseTo(1, 5);
  });

  test("rejects non-binary input", () => {
    expect(
      parseBinaryStl(new TextEncoder().encode("solid x").buffer),
    ).toBeNull();
  });
});
