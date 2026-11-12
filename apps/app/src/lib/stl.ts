/**
 * Разбор бинарного STL в браузере: габариты, объем и PNG-превью без
 * 3D-библиотек. Единицы модели — миллиметры.
 */

export interface StlMesh {
  /** По 9 чисел на треугольник: три вершины XYZ. */
  vertices: Float32Array;
  /** Габариты X × Y × Z, мм. */
  size: [number, number, number];
  volumeCm3: number;
}

/** `null`, если это не бинарный STL (например, текстовый ASCII STL). */
export function parseBinaryStl(buffer: ArrayBuffer): StlMesh | null {
  if (buffer.byteLength < 84) return null;
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  if (triangles === 0 || 84 + triangles * 50 !== buffer.byteLength) return null;

  const vertices = new Float32Array(triangles * 9);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let volume = 0;

  for (let i = 0; i < triangles; i++) {
    // 12 байт нормали, затем три вершины по три float32.
    const offset = 84 + i * 50 + 12;
    const base = i * 9;
    for (let j = 0; j < 9; j++) {
      const value = view.getFloat32(offset + j * 4, true);
      vertices[base + j] = value;
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

/** Больше — превью рисуется слишком долго; деталь сохранится без него. */
const MAX_PREVIEW_TRIANGLES = 500_000;
const YAW = Math.PI / 4;
const TILT = Math.PI / 5;
/** Свет слева сверху со стороны зрителя (экранные X, Y и глубина). */
const LIGHT = [-0.35, 0.6, -0.72] as const;

/**
 * Изометрическое превью модели: плоская заливка граней с сортировкой по
 * глубине. Фон прозрачный, поэтому картинка подходит обеим темам.
 */
export async function renderStlPreview(
  mesh: StlMesh,
  pixels = 480,
): Promise<Blob | null> {
  const count = mesh.vertices.length / 9;
  if (count > MAX_PREVIEW_TRIANGLES) return null;

  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const cosYaw = Math.cos(YAW);
  const sinYaw = Math.sin(YAW);
  const cosTilt = Math.cos(TILT);
  const sinTilt = Math.sin(TILT);

  // Экранные координаты: x — вправо, y — вверх, z — глубина от зрителя.
  const projected = new Float32Array(mesh.vertices.length);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < mesh.vertices.length; i += 3) {
    const x = mesh.vertices[i] ?? 0;
    const y = mesh.vertices[i + 1] ?? 0;
    const z = mesh.vertices[i + 2] ?? 0;
    const rx = x * cosYaw - y * sinYaw;
    const ry = x * sinYaw + y * cosYaw;
    const sx = rx;
    const sy = ry * sinTilt + z * cosTilt;
    projected[i] = sx;
    projected[i + 1] = sy;
    projected[i + 2] = ry * cosTilt - z * sinTilt;
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
  }

  const faces: { index: number; depth: number; shade: number }[] = [];
  for (let i = 0; i < count; i++) {
    const p = projected.subarray(i * 9, i * 9 + 9);
    const [ax = 0, ay = 0, az = 0, bx = 0, by = 0, bz = 0, cx = 0, cy = 0] = p;
    const cz = p[8] ?? 0;
    const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    // Грань смотрит от зрителя — ее закрывают передние.
    if (nz >= 0) continue;
    const length = Math.hypot(nx, ny, nz) || 1;
    const lit = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / length;
    faces.push({
      index: i,
      depth: (az + bz + cz) / 3,
      shade: 0.4 + 0.6 * Math.max(0, lit),
    });
  }
  faces.sort((a, b) => b.depth - a.depth);

  const padding = pixels * 0.08;
  const scale =
    (pixels - padding * 2) / Math.max(maxX - minX, maxY - minY, 1e-6);
  const offsetX = (pixels - (maxX - minX) * scale) / 2;
  const offsetY = (pixels - (maxY - minY) * scale) / 2;
  const toX = (x: number) => offsetX + (x - minX) * scale;
  const toY = (y: number) => pixels - offsetY - (y - minY) * scale;

  context.lineJoin = "round";
  context.lineWidth = 0.6;
  for (const face of faces) {
    const p = projected.subarray(face.index * 9, face.index * 9 + 9);
    const lightness = Math.round(34 + face.shade * 48);
    const color = `hsl(215 12% ${lightness}%)`;
    context.fillStyle = color;
    // Обводка тем же цветом закрывает щели между соседними гранями.
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(toX(p[0] ?? 0), toY(p[1] ?? 0));
    context.lineTo(toX(p[3] ?? 0), toY(p[4] ?? 0));
    context.lineTo(toX(p[6] ?? 0), toY(p[7] ?? 0));
    context.closePath();
    context.fill();
    context.stroke();
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
