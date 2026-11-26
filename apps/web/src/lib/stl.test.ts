import { describe, expect, test } from "bun:test";

import { parseStl } from "~/lib/stl";

const o = [0, 0, 0];
const x = [10, 0, 0];
const y = [0, 20, 0];
const z = [0, 0, 30];
const faces = [
  [o, y, x],
  [o, x, z],
  [o, z, y],
  [x, y, z],
];

function binaryTetrahedron() {
  const buffer = new ArrayBuffer(84 + faces.length * 50);
  const view = new DataView(buffer);
  view.setUint32(80, faces.length, true);
  faces.forEach((face, i) => {
    face.flat().forEach((value, j) => {
      view.setFloat32(84 + i * 50 + 12 + j * 4, value, true);
    });
  });
  return buffer;
}

function asciiTetrahedron() {
  const scientific = (value: number) => {
    if (value === 10) return "1e1";
    if (value === 20) return "2e1";
    if (value === 30) return "3e1";
    return String(value);
  };
  const body = faces
    .map((face) =>
      [
        "  facet normal 0 0 0",
        "    outer loop",
        ...face.map(
          (vertex) => `      vertex ${vertex.map(scientific).join(" ")}`,
        ),
        "    endloop",
        "  endfacet",
      ].join("\r\n"),
    )
    .join("\r\n");
  return new TextEncoder().encode(
    `solid tetrahedron\r\n${body}\r\nendsolid tetrahedron\r\n`,
  ).buffer;
}

describe("parseStl", () => {
  test("reads bounding box and volume of a binary STL", () => {
    const result = parseStl(binaryTetrahedron());
    expect(result?.size).toEqual([10, 20, 30]);
    expect(result?.volumeCm3).toBeCloseTo(1, 5);
    expect(result?.vertices.length).toBe(faces.length * 9);
  });

  test("reads bounding box and volume of an ASCII STL", () => {
    const result = parseStl(asciiTetrahedron());
    expect(result?.size).toEqual([10, 20, 30]);
    expect(result?.volumeCm3).toBeCloseTo(1, 5);
    expect(result?.vertices.length).toBe(faces.length * 9);
  });

  test("rejects an incomplete ASCII STL", () => {
    const broken = new TextEncoder().encode(
      [
        "solid broken",
        "  facet normal 0 0 0",
        "    outer loop",
        "      vertex 0 0 0",
        "    endloop",
        "  endfacet",
        "endsolid broken",
      ].join("\n"),
    );
    expect(parseStl(broken.buffer)).toBeNull();
  });

  test("rejects plain text", () => {
    expect(parseStl(new TextEncoder().encode("not an stl").buffer)).toBeNull();
  });
});
