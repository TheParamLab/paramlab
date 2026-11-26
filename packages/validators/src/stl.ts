/**
 * Разбор STL без каких-либо зависимостей: габариты и объем.
 * Единицы модели — миллиметры. Работает и в браузере, и на сервере.
 */

export interface StlMesh {
  /** По 9 чисел на треугольник: три вершины XYZ. */
  vertices: Float32Array;
  /** Габариты X × Y × Z, мм. */
  size: [number, number, number];
  volumeCm3: number;
}

/**
 * Разбор идёт синхронно в основном потоке, поэтому в браузере файлы крупнее
 * не разбираем. На сервере предел выше — см. `STL_SERVER_PARSE_MAX_BYTES`.
 */
export const STL_PARSE_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Потолок для серверного разбора в `part.create`: файл скачивается из
 * хранилища в память целиком, поэтому более крупные STL отклоняются.
 */
export const STL_SERVER_PARSE_MAX_BYTES = 50 * 1024 * 1024;

/** `null`, если это не бинарный STL. */
export function parseBinaryStl(buffer: ArrayBuffer): StlMesh | null {
  if (buffer.byteLength < 84) return null;
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  // Спецификация — ровно 50 байт на грань, но у файлов бывает хвост
  // (метаданные экспортера): читаем грани из начала, хвост игнорируем.
  if (triangles === 0 || 84 + triangles * 50 > buffer.byteLength) return null;

  const vertices = new Float32Array(triangles * 9);
  for (let i = 0; i < triangles; i++) {
    // 12 байт нормали, затем три вершины по три float32.
    const offset = 84 + i * 50 + 12;
    const base = i * 9;
    for (let j = 0; j < 9; j++) {
      vertices[base + j] = view.getFloat32(offset + j * 4, true);
    }
  }
  return meshFromVertices(vertices);
}

export function parseStl(buffer: ArrayBuffer): StlMesh | null {
  return parseBinaryStl(buffer) ?? parseAsciiStl(buffer);
}

function parseAsciiStl(buffer: ArrayBuffer): StlMesh | null {
  const text = new TextDecoder().decode(buffer);
  const values: number[] = [];
  let state: "body" | "outer-loop" | "vertices" | "end-facet" = "body";
  let vertexCount = 0;
  let triangleCount = 0;
  let ended = false;
  let hasHeader = false;

  let start = 0;
  while (start < text.length) {
    const newline = text.indexOf("\n", start);
    const end = newline === -1 ? text.length : newline;
    const line = text.slice(start, end).trim();
    start = end + 1;
    if (!line) continue;
    // Непустые строки после endsolid — файл склеен или поврежден.
    if (ended) return null;
    const keyword = line.toLowerCase();
    if (!hasHeader) {
      if (!/^solid(?:\s|$)/.test(keyword)) return null;
      hasHeader = true;
      continue;
    }

    if (state === "body") {
      if (/^facet\s+normal\s+\S+\s+\S+\s+\S+$/.test(keyword)) {
        state = "outer-loop";
        continue;
      }
      if (/^endsolid(?:\s|$)/.test(keyword)) {
        ended = true;
        continue;
      }
      return null;
    }

    if (state === "outer-loop") {
      if (!/^outer\s+loop$/.test(keyword)) return null;
      vertexCount = 0;
      state = "vertices";
      continue;
    }

    if (state === "vertices") {
      if (/^vertex(?:\s|$)/.test(keyword)) {
        if (vertexCount === 3) return null;
        const parts = line.split(/\s+/);
        if (parts.length !== 4) return null;
        const x = Number(parts[1]);
        const y = Number(parts[2]);
        const z = Number(parts[3]);
        if (![x, y, z].every(Number.isFinite)) return null;
        values.push(x, y, z);
        vertexCount += 1;
        continue;
      }
      if (keyword !== "endloop") return null;
      if (vertexCount !== 3) return null;
      state = "end-facet";
      continue;
    }

    if (keyword !== "endfacet") return null;
    triangleCount += 1;
    state = "body";
  }

  if (!ended || triangleCount === 0) return null;
  return meshFromVertices(Float32Array.from(values));
}

function meshFromVertices(vertices: Float32Array): StlMesh | null {
  if (vertices.length === 0 || vertices.length % 9 !== 0) return null;

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let volume = 0;

  for (let base = 0; base < vertices.length; base += 9) {
    for (let j = 0; j < 9; j++) {
      const value = vertices[base + j] ?? 0;
      // NaN и бесконечность ломают габариты и объём — файл не разобран.
      if (!Number.isFinite(value)) return null;
      const axis = j % 3;
      if (value < (min[axis] ?? 0)) min[axis] = value;
      if (value > (max[axis] ?? 0)) max[axis] = value;
    }
    const [ax = 0, ay = 0, az = 0, bx = 0, by = 0, bz = 0, cx = 0, cy = 0] =
      vertices.subarray(base, base + 9);
    const cz = vertices[base + 8] ?? 0;
    volume +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) /
      6;
  }

  if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) return null;

  return {
    vertices,
    size: [
      (max[0] ?? 0) - (min[0] ?? 0),
      (max[1] ?? 0) - (min[1] ?? 0),
      (max[2] ?? 0) - (min[2] ?? 0),
    ],
    volumeCm3: Math.abs(volume) / 1000,
  };
}
