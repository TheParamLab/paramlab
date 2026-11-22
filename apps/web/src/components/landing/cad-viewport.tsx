"use client";

import { cn } from "@paramlab/ui";
import { Box, Grid3X3, Layers, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  useCalculator,
  type ViewportRenderMode,
} from "~/components/landing/calculator-context";
import {
  type DimensionKey,
  type Dimensions,
  MATERIALS,
  type Material,
  PART_TYPES,
  type PartTypeId,
} from "~/components/landing/data";
import { clampBore } from "~/components/landing/pricing";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Face3D {
  vertices: [Vec3, Vec3, Vec3, Vec3];
  normal: Vec3;
  centerY: number;
  isTop?: boolean;
  isInner?: boolean;
  isAccent?: boolean;
}

interface Callout3D {
  key: DimensionKey;
  code: string;
  value: number;
  start: Vec3;
  end: Vec3;
  labelPos: Vec3;
}

interface GeometryResult {
  faces: Face3D[];
  minY: number;
  maxY: number;
  callouts: Callout3D[];
  layerRadiusAtY?: (y: number) => number;
  isBoxy?: boolean;
  halfL?: number;
  halfW?: number;
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function quadFace(
  v0: Vec3,
  v1: Vec3,
  v2: Vec3,
  v3: Vec3,
  opts?: { isTop?: boolean; isInner?: boolean; isAccent?: boolean },
): Face3D {
  const n = normalize(cross(sub(v1, v0), sub(v3, v0)));
  const centerY = (v0.y + v1.y + v2.y + v3.y) * 0.25;
  return {
    vertices: [v0, v1, v2, v3],
    normal: n,
    centerY,
    isTop: opts?.isTop,
    isInner: opts?.isInner,
    isAccent: opts?.isAccent,
  };
}

function addPrismRing(
  faces: Face3D[],
  rOuterBottom: number,
  rOuterTop: number,
  rInnerBottom: number,
  rInnerTop: number,
  y0: number,
  y1: number,
  segments: number,
) {
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);

    const ob0: Vec3 = { x: rOuterBottom * c0, y: y0, z: rOuterBottom * s0 };
    const ob1: Vec3 = { x: rOuterBottom * c1, y: y0, z: rOuterBottom * s1 };
    const ot1: Vec3 = { x: rOuterTop * c1, y: y1, z: rOuterTop * s1 };
    const ot0: Vec3 = { x: rOuterTop * c0, y: y1, z: rOuterTop * s0 };

    const ib0: Vec3 = { x: rInnerBottom * c0, y: y0, z: rInnerBottom * s0 };
    const ib1: Vec3 = { x: rInnerBottom * c1, y: y0, z: rInnerBottom * s1 };
    const it1: Vec3 = { x: rInnerTop * c1, y: y1, z: rInnerTop * s1 };
    const it0: Vec3 = { x: rInnerTop * c0, y: y1, z: rInnerTop * s0 };

    // Наружная грань — нормали наружу
    faces.push(quadFace(ob0, ot0, ot1, ob1));
    // Внутренний канал — нормали внутрь
    faces.push(quadFace(ib1, it1, it0, ib0, { isInner: true }));
    // Верхнее кольцо
    faces.push(quadFace(ot0, ot1, it1, it0, { isTop: true }));
    // Нижнее кольцо
    faces.push(quadFace(ib0, ib1, ob1, ob0));
  }
}

function addBoxWall(
  faces: Face3D[],
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  opts?: { isAccent?: boolean },
) {
  const b00: Vec3 = { x: x0, y: y0, z: z0 };
  const b10: Vec3 = { x: x1, y: y0, z: z0 };
  const b11: Vec3 = { x: x1, y: y0, z: z1 };
  const b01: Vec3 = { x: x0, y: y0, z: z1 };

  const t00: Vec3 = { x: x0, y: y1, z: z0 };
  const t10: Vec3 = { x: x1, y: y1, z: z0 };
  const t11: Vec3 = { x: x1, y: y1, z: z1 };
  const t01: Vec3 = { x: x0, y: y1, z: z1 };

  faces.push(quadFace(b01, b11, t11, t01, opts)); // front +Z
  faces.push(quadFace(b10, b00, t00, t10, opts)); // back -Z
  faces.push(quadFace(b11, b10, t10, t11, opts)); // right +X
  faces.push(quadFace(b00, b01, t01, t00, opts)); // left -X
  faces.push(quadFace(t01, t11, t10, t00, { isTop: true, ...opts })); // top +Y
  faces.push(quadFace(b00, b10, b11, b01, opts)); // bottom -Y
}

function addTriangularRib(
  faces: Face3D[],
  xUpright: number,
  yBase: number,
  ribSize: number,
  zCenter: number,
  thickness: number,
) {
  const yTop = yBase + ribSize;
  const xOut = xUpright + ribSize;
  const zf = zCenter - thickness / 2;
  const zb = zCenter + thickness / 2;

  const A: Vec3 = { x: xUpright, y: yBase, z: zf };
  const B: Vec3 = { x: xUpright, y: yTop, z: zf };
  const C: Vec3 = { x: xOut, y: yBase, z: zf };
  const Ab: Vec3 = { x: xUpright, y: yBase, z: zb };
  const Bb: Vec3 = { x: xUpright, y: yTop, z: zb };
  const Cb: Vec3 = { x: xOut, y: yBase, z: zb };

  faces.push(quadFace(A, C, B, B)); // front face
  faces.push(quadFace(Ab, Bb, Cb, Cb)); // back face
  faces.push(quadFace(A, Ab, Bb, B)); // vertical side along upright
  faces.push(quadFace(A, C, Cb, Ab)); // bottom side along base top
  faces.push(quadFace(B, Bb, Cb, C)); // sloped hypotenuse side
}

function buildGeometry(
  partType: PartTypeId,
  dimensions: Dimensions,
): GeometryResult {
  const faces: Face3D[] = [];
  const { d1, d2, h } = dimensions;
  const halfH = h / 2;

  if (partType === "bushing") {
    const rOuter = d1 / 2;
    const bore = clampBore(d1, d2);
    const rInner = Math.max(3, bore / 2);
    const flangeR = rOuter + Math.max(5, d1 * 0.11);
    const flangeH = Math.min(h * 0.24, 12);
    const yBottom = -halfH;
    const yFlangeTop = yBottom + flangeH;
    const yTop = halfH;
    const segments = 28;

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const c0 = Math.cos(a0);
      const s0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const s1 = Math.sin(a1);

      const ib0: Vec3 = { x: rInner * c0, y: yBottom, z: rInner * s0 };
      const ib1: Vec3 = { x: rInner * c1, y: yBottom, z: rInner * s1 };
      const it1: Vec3 = { x: rInner * c1, y: yTop, z: rInner * s1 };
      const it0: Vec3 = { x: rInner * c0, y: yTop, z: rInner * s0 };

      const f0b: Vec3 = { x: flangeR * c0, y: yBottom, z: flangeR * s0 };
      const f1b: Vec3 = { x: flangeR * c1, y: yBottom, z: flangeR * s1 };
      const f0t: Vec3 = { x: flangeR * c0, y: yFlangeTop, z: flangeR * s0 };
      const f1t: Vec3 = { x: flangeR * c1, y: yFlangeTop, z: flangeR * s1 };

      const o0b: Vec3 = { x: rOuter * c0, y: yFlangeTop, z: rOuter * s0 };
      const o1b: Vec3 = { x: rOuter * c1, y: yFlangeTop, z: rOuter * s1 };
      const o0t: Vec3 = { x: rOuter * c0, y: yTop, z: rOuter * s0 };
      const o1t: Vec3 = { x: rOuter * c1, y: yTop, z: rOuter * s1 };

      // Внутренняя цилиндрическая поверхность на полную высоту
      faces.push(quadFace(ib1, it1, it0, ib0, { isInner: true }));
      // Наружная поверхность фланца
      faces.push(quadFace(f0b, f0t, f1t, f1b));
      // Горизонтальный ступенчатый буртик
      faces.push(quadFace(f0t, f1t, o1b, o0b, { isTop: true }));
      // Наружная поверхность основного тела
      faces.push(quadFace(o0b, o0t, o1t, o1b));
      // Нижняя крышка (rInner..flangeR)
      faces.push(quadFace(ib0, ib1, f1b, f0b));
      // Верхняя крышка (rInner..rOuter)
      faces.push(quadFace(o0t, o1t, it1, it0, { isTop: true }));
    }

    const callouts: Callout3D[] = [
      {
        key: "d1",
        code: "D",
        value: d1,
        start: { x: -rOuter, y: yTop + 6, z: 0 },
        end: { x: rOuter, y: yTop + 6, z: 0 },
        labelPos: { x: 0, y: yTop + 14, z: 0 },
      },
      {
        key: "d2",
        code: "d",
        value: bore,
        start: { x: -rInner, y: yTop + 3, z: 0 },
        end: { x: rInner, y: yTop + 3, z: 0 },
        labelPos: { x: 0, y: yTop + 22, z: 12 },
      },
      {
        key: "h",
        code: "H",
        value: h,
        start: { x: flangeR + 10, y: yBottom, z: 0 },
        end: { x: flangeR + 10, y: yTop, z: 0 },
        labelPos: { x: flangeR + 22, y: 0, z: 0 },
      },
    ];

    return {
      faces,
      minY: yBottom,
      maxY: yTop,
      callouts,
      layerRadiusAtY: (y) => (y <= yFlangeTop ? flangeR : rOuter),
    };
  }

  if (partType === "gear") {
    const pitchR = d1 / 2;
    const bore = clampBore(d1, d2);
    const rInner = Math.max(3, bore / 2);
    const teeth = Math.max(8, Math.round(d1 / 4));
    const steps = teeth * 4;
    let toothDepth = Math.max(2.6, Math.min(6.5, d1 * 0.065));
    let rRoot = Math.max(rInner + 3, pitchR - toothDepth * 0.55);
    let rTip = pitchR + toothDepth * 0.45;

    while (rRoot >= rTip && toothDepth > 0.5) {
      toothDepth -= 0.2;
      rRoot = Math.max(rInner + 3, pitchR - toothDepth * 0.55);
      rTip = pitchR + toothDepth * 0.45;
    }

    const y0 = -halfH;
    const y1 = halfH;

    for (let i = 0; i < steps; i++) {
      const mod0 = i % 4;
      const mod1 = (i + 1) % 4;
      const r0 = mod0 === 1 || mod0 === 2 ? rTip : rRoot;
      const r1 = mod1 === 1 || mod1 === 2 ? rTip : rRoot;

      const a0 = (i / steps) * Math.PI * 2;
      const a1 = ((i + 1) / steps) * Math.PI * 2;
      const c0 = Math.cos(a0);
      const s0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const s1 = Math.sin(a1);

      const ob0: Vec3 = { x: r0 * c0, y: y0, z: r0 * s0 };
      const ob1: Vec3 = { x: r1 * c1, y: y0, z: r1 * s1 };
      const ot1: Vec3 = { x: r1 * c1, y: y1, z: r1 * s1 };
      const ot0: Vec3 = { x: r0 * c0, y: y1, z: r0 * s0 };

      const ib0: Vec3 = { x: rInner * c0, y: y0, z: rInner * s0 };
      const ib1: Vec3 = { x: rInner * c1, y: y0, z: rInner * s1 };
      const it1: Vec3 = { x: rInner * c1, y: y1, z: rInner * s1 };
      const it0: Vec3 = { x: rInner * c0, y: y1, z: rInner * s0 };

      faces.push(quadFace(ob0, ot0, ot1, ob1));
      faces.push(quadFace(ib1, it1, it0, ib0, { isInner: true }));
      faces.push(quadFace(ot0, ot1, it1, it0, { isTop: true }));
      faces.push(quadFace(ib0, ib1, ob1, ob0));
    }

    const callouts: Callout3D[] = [
      {
        key: "d1",
        code: "D",
        value: d1,
        start: { x: -rTip, y: y1 + 7, z: 0 },
        end: { x: rTip, y: y1 + 7, z: 0 },
        labelPos: { x: 0, y: y1 + 16, z: 0 },
      },
      {
        key: "d2",
        code: "d",
        value: bore,
        start: { x: -rInner, y: y1 + 3, z: 0 },
        end: { x: rInner, y: y1 + 3, z: 0 },
        labelPos: { x: 0, y: y1 + 25, z: 14 },
      },
      {
        key: "h",
        code: "H",
        value: h,
        start: { x: rTip + 11, y: y0, z: 0 },
        end: { x: rTip + 11, y: y1, z: 0 },
        labelPos: { x: rTip + 24, y: 0, z: 0 },
      },
    ];

    return {
      faces,
      minY: y0,
      maxY: y1,
      callouts,
      layerRadiusAtY: () => rTip,
    };
  }

  if (partType === "adapter") {
    const r1 = d1 / 2;
    const r2 = d2 / 2;
    const wall = 2.8;
    const y0 = -halfH;
    const y1 = -halfH + h * 0.38;
    const y2 = -halfH + h * 0.64;
    const y3 = halfH;

    addPrismRing(
      faces,
      r1,
      r1,
      Math.max(3, r1 - wall),
      Math.max(3, r1 - wall),
      y0,
      y1,
      26,
    );
    addPrismRing(
      faces,
      r1,
      r2,
      Math.max(3, r1 - wall),
      Math.max(3, r2 - wall),
      y1,
      y2,
      26,
    );
    addPrismRing(
      faces,
      r2,
      r2,
      Math.max(3, r2 - wall),
      Math.max(3, r2 - wall),
      y2,
      y3,
      26,
    );

    const maxR = Math.max(r1, r2);
    const callouts: Callout3D[] = [
      {
        key: "d1",
        code: "D1",
        value: d1,
        start: { x: -r1, y: y0 - 5, z: 0 },
        end: { x: r1, y: y0 - 5, z: 0 },
        labelPos: { x: 0, y: y0 - 14, z: 0 },
      },
      {
        key: "d2",
        code: "D2",
        value: d2,
        start: { x: -r2, y: y3 + 6, z: 0 },
        end: { x: r2, y: y3 + 6, z: 0 },
        labelPos: { x: 0, y: y3 + 15, z: 0 },
      },
      {
        key: "h",
        code: "H",
        value: h,
        start: { x: maxR + 11, y: y0, z: 0 },
        end: { x: maxR + 11, y: y3, z: 0 },
        labelPos: { x: maxR + 23, y: 0, z: 0 },
      },
    ];

    return {
      faces,
      minY: y0,
      maxY: y3,
      callouts,
      layerRadiusAtY: (y) => {
        if (y <= y1) return r1;
        if (y >= y2) return r2;
        const t = (y - y1) / (y2 - y1);
        return r1 + (r2 - r1) * t;
      },
    };
  }

  if (partType === "bracket") {
    const L = d1;
    const W = d2;
    const H = h;
    const halfL = L / 2;
    const halfW = W / 2;
    const wall = Math.max(3.2, Math.min(6, Math.min(L, W) * 0.065));
    const y0 = -H / 2;
    const y1 = H / 2;
    const baseTop = y0 + wall;
    const xUpright = -halfL;

    // Основание
    addBoxWall(faces, -halfL, halfL, y0, baseTop, -halfW, halfW);
    // Вертикальная стенка
    addBoxWall(faces, xUpright, xUpright + wall, baseTop, y1, -halfW, halfW);

    // Треугольные ребра жесткости
    const ribSize = Math.min((y1 - baseTop) * 0.85, L * 0.35, H * 0.45);
    const ribThick = Math.min(wall, W * 0.18);
    if (ribSize > 4 && ribThick > 1.5) {
      const ribZ1 = halfW * 0.45;
      const ribZ2 = -halfW * 0.45;
      addTriangularRib(
        faces,
        xUpright + wall,
        baseTop,
        ribSize,
        ribZ1,
        ribThick,
      );
      addTriangularRib(
        faces,
        xUpright + wall,
        baseTop,
        ribSize,
        ribZ2,
        ribThick,
      );
    }

    const callouts: Callout3D[] = [
      {
        key: "d1",
        code: "L",
        value: L,
        start: { x: -halfL, y: y1 + 7, z: halfW },
        end: { x: halfL, y: y1 + 7, z: halfW },
        labelPos: { x: 0, y: y1 + 15, z: halfW },
      },
      {
        key: "d2",
        code: "W",
        value: W,
        start: { x: halfL + 10, y: y0, z: -halfW },
        end: { x: halfL + 10, y: y0, z: halfW },
        labelPos: { x: halfL + 20, y: y0, z: 0 },
      },
      {
        key: "h",
        code: "H",
        value: H,
        start: { x: -halfL - 12, y: y0, z: halfW },
        end: { x: -halfL - 12, y: y1, z: halfW },
        labelPos: { x: -halfL - 22, y: 0, z: halfW },
      },
    ];

    return {
      faces,
      minY: y0,
      maxY: y1,
      callouts,
      isBoxy: true,
      halfL,
      halfW,
    };
  }

  if (partType === "organizer") {
    const L = d1;
    const W = d2;
    const H = h;
    const halfL = L / 2;
    const halfW = W / 2;
    const wall = Math.max(2.8, Math.min(5, Math.min(L, W) * 0.055));
    const y0 = -H / 2;
    const y1 = H / 2;
    const floorY = y0 + wall;

    // Дно
    addBoxWall(faces, -halfL, halfL, y0, floorY, -halfW, halfW);
    // Стенки
    addBoxWall(faces, -halfL, halfL, floorY, y1, halfW - wall, halfW);
    addBoxWall(faces, -halfL, halfL, floorY, y1, -halfW, -halfW + wall);
    addBoxWall(
      faces,
      -halfL,
      -halfL + wall,
      floorY,
      y1,
      -halfW + wall,
      halfW - wall,
    );
    addBoxWall(
      faces,
      halfL - wall,
      halfL,
      floorY,
      y1,
      -halfW + wall,
      halfW - wall,
    );

    // Внутренние перегородки
    const innerL = L - 2 * wall;
    const dividerCount = Math.min(2, Math.max(1, Math.floor(L / 70)));
    const spacing = innerL / (dividerCount + 1);
    for (let i = 1; i <= dividerCount; i++) {
      const x = -halfL + wall + i * spacing;
      addBoxWall(
        faces,
        x - wall / 2,
        x + wall / 2,
        floorY,
        y1,
        -halfW + wall,
        halfW - wall,
      );
    }

    const callouts: Callout3D[] = [
      {
        key: "d1",
        code: "L",
        value: L,
        start: { x: -halfL, y: y1 + 7, z: halfW },
        end: { x: halfL, y: y1 + 7, z: halfW },
        labelPos: { x: 0, y: y1 + 15, z: halfW },
      },
      {
        key: "d2",
        code: "W",
        value: W,
        start: { x: halfL + 10, y: y0, z: -halfW },
        end: { x: halfL + 10, y: y0, z: halfW },
        labelPos: { x: halfL + 20, y: y0, z: 0 },
      },
      {
        key: "h",
        code: "H",
        value: H,
        start: { x: -halfL - 12, y: y0, z: halfW },
        end: { x: -halfL - 12, y: y1, z: halfW },
        labelPos: { x: -halfL - 22, y: 0, z: halfW },
      },
    ];

    return {
      faces,
      minY: y0,
      maxY: y1,
      callouts,
      isBoxy: true,
      halfL,
      halfW,
    };
  }

  if (partType === "plant-tag") {
    const L = d1;
    const W = d2;
    const H = Math.max(3, h);
    const halfL = L / 2;
    const halfW = W / 2;
    const y0 = -H / 2;
    const baseTop = y0 + H * 0.8;
    const y1 = H / 2;

    const tipX = -halfL;
    const neckX = -halfL + L * 0.48;
    const headStartX = -halfL + L * 0.52;
    const headEndX = halfL;
    const tipHalfW = 2.3;
    const neckHalfW = Math.min(halfW * 0.62, 7.5);

    // 1. Ножка-колышек (клин)
    const sb0: Vec3 = { x: tipX, y: y0, z: -tipHalfW };
    const sb1: Vec3 = { x: neckX, y: y0, z: -neckHalfW };
    const sb2: Vec3 = { x: neckX, y: y0, z: neckHalfW };
    const sb3: Vec3 = { x: tipX, y: y0, z: tipHalfW };
    const st0: Vec3 = { x: tipX, y: baseTop, z: -tipHalfW };
    const st1: Vec3 = { x: neckX, y: baseTop, z: -neckHalfW };
    const st2: Vec3 = { x: neckX, y: baseTop, z: neckHalfW };
    const st3: Vec3 = { x: tipX, y: baseTop, z: tipHalfW };

    faces.push(quadFace(sb3, sb2, st2, st3));
    faces.push(quadFace(sb1, sb0, st0, st1));
    faces.push(quadFace(sb0, sb3, st3, st0));
    faces.push(quadFace(st3, st2, st1, st0, { isTop: true }));
    faces.push(quadFace(sb0, sb1, sb2, sb3));

    // 2. Переходная галтель от ножки к головке
    const tb0: Vec3 = { x: neckX, y: y0, z: -neckHalfW };
    const tb1: Vec3 = { x: headStartX, y: y0, z: -halfW };
    const tb2: Vec3 = { x: headStartX, y: y0, z: halfW };
    const tb3: Vec3 = { x: neckX, y: y0, z: neckHalfW };
    const tt0: Vec3 = { x: neckX, y: baseTop, z: -neckHalfW };
    const tt1: Vec3 = { x: headStartX, y: baseTop, z: -halfW };
    const tt2: Vec3 = { x: headStartX, y: baseTop, z: halfW };
    const tt3: Vec3 = { x: neckX, y: baseTop, z: neckHalfW };

    faces.push(quadFace(tb3, tb2, tt2, tt3));
    faces.push(quadFace(tb1, tb0, tt0, tt1));
    faces.push(quadFace(tt3, tt2, tt1, tt0, { isTop: true }));
    faces.push(quadFace(tb0, tb1, tb2, tb3));

    // 3. Основная головка бирки (база Серого цвета)
    addBoxWall(faces, headStartX, headEndX, y0, baseTop, -halfW, halfW);

    // 4. Чёрный рельеф: продольное ребро жесткости на ножке + окантовка текстовой зоны
    const rimX0 = headStartX + 1.2;
    const rimX1 = headEndX - 6.8;
    const rimZ0 = -halfW + 1.8;
    const rimZ1 = halfW - 1.8;
    const rimW = 1.2;

    addBoxWall(faces, tipX + 7, rimX0, baseTop, y1, -1.3, 1.3, {
      isAccent: true,
    });
    addBoxWall(faces, rimX0, rimX1, baseTop, y1, rimZ1 - rimW, rimZ1, {
      isAccent: true,
    });
    addBoxWall(faces, rimX0, rimX1, baseTop, y1, rimZ0, rimZ0 + rimW, {
      isAccent: true,
    });
    addBoxWall(
      faces,
      rimX0,
      rimX0 + rimW,
      baseTop,
      y1,
      rimZ0 + rimW,
      rimZ1 - rimW,
      { isAccent: true },
    );
    addBoxWall(
      faces,
      rimX1 - rimW,
      rimX1,
      baseTop,
      y1,
      rimZ0 + rimW,
      rimZ1 - rimW,
      { isAccent: true },
    );

    const callouts: Callout3D[] = [
      {
        key: "d1",
        code: "L",
        value: L,
        start: { x: -halfL, y: y1 + 6, z: halfW },
        end: { x: halfL, y: y1 + 6, z: halfW },
        labelPos: { x: 0, y: y1 + 14, z: halfW },
      },
      {
        key: "d2",
        code: "W",
        value: W,
        start: { x: halfL + 8, y: y0, z: -halfW },
        end: { x: halfL + 8, y: y0, z: halfW },
        labelPos: { x: halfL + 18, y: y0, z: 0 },
      },
      {
        key: "h",
        code: "H",
        value: H,
        start: { x: -halfL - 10, y: y0, z: halfW },
        end: { x: -halfL - 10, y: y1, z: halfW },
        labelPos: { x: -halfL - 20, y: 0, z: halfW },
      },
    ];

    return {
      faces,
      minY: y0,
      maxY: y1,
      callouts,
      isBoxy: true,
      halfL,
      halfW,
    };
  }

  // Корпус РЭА ("din-box") или Крепление / Заглушка ("end-cap")
  const halfL = d1 / 2;
  const halfW = d2 / 2;
  const wall = Math.max(3.2, Math.min(6, Math.min(d1, d2) * 0.065));
  const y0 = -halfH;
  const y1 = halfH;
  const floorY = y0 + Math.min(5, h * 0.16);

  // Дно
  addBoxWall(faces, -halfL, halfL, y0, floorY, -halfW, halfW);
  // 4 стенки корпуса
  addBoxWall(faces, -halfL, halfL, floorY, y1, halfW - wall, halfW);
  addBoxWall(faces, -halfL, halfL, floorY, y1, -halfW, -halfW + wall);
  addBoxWall(
    faces,
    -halfL,
    -halfL + wall,
    floorY,
    y1,
    -halfW + wall,
    halfW - wall,
  );
  addBoxWall(
    faces,
    halfL - wall,
    halfL,
    floorY,
    y1,
    -halfW + wall,
    halfW - wall,
  );

  // Угловые монтажные стойки под плату
  const postSize = Math.min(7, wall * 1.45);
  const postH = y0 + h * 0.78;
  addBoxWall(
    faces,
    -halfL + wall,
    -halfL + wall + postSize,
    floorY,
    postH,
    -halfW + wall,
    -halfW + wall + postSize,
  );
  addBoxWall(
    faces,
    halfL - wall - postSize,
    halfL - wall,
    floorY,
    postH,
    -halfW + wall,
    -halfW + wall + postSize,
  );
  addBoxWall(
    faces,
    -halfL + wall,
    -halfL + wall + postSize,
    floorY,
    postH,
    halfW - wall - postSize,
    halfW - wall,
  );
  addBoxWall(
    faces,
    halfL - wall - postSize,
    halfL - wall,
    floorY,
    postH,
    halfW - wall - postSize,
    halfW - wall,
  );

  // Монтажные уши по бокам корпуса
  const earW = 9;
  const earThickness = Math.min(5, h * 0.16);
  addBoxWall(
    faces,
    -halfL - earW,
    -halfL,
    y0,
    y0 + earThickness,
    -halfW * 0.45,
    halfW * 0.45,
  );
  addBoxWall(
    faces,
    halfL,
    halfL + earW,
    y0,
    y0 + earThickness,
    -halfW * 0.45,
    halfW * 0.45,
  );

  const callouts: Callout3D[] = [
    {
      key: "d1",
      code: "L",
      value: d1,
      start: { x: -halfL, y: y1 + 7, z: halfW },
      end: { x: halfL, y: y1 + 7, z: halfW },
      labelPos: { x: 0, y: y1 + 15, z: halfW },
    },
    {
      key: "d2",
      code: "W",
      value: d2,
      start: { x: halfL + 10, y: y0, z: -halfW },
      end: { x: halfL + 10, y: y0, z: halfW },
      labelPos: { x: halfL + 20, y: y0, z: 0 },
    },
    {
      key: "h",
      code: "H",
      value: h,
      start: { x: -halfL - 12, y: y0, z: halfW },
      end: { x: -halfL - 12, y: y1, z: halfW },
      labelPos: { x: -halfL - 22, y: 0, z: halfW },
    },
  ];

  return {
    faces,
    minY: y0,
    maxY: y1,
    callouts,
    isBoxy: true,
    halfL,
    halfW,
  };
}

function rotatePoint(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;

  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;

  return { x: x1, y: y2, z: z2 };
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function shadeColor(
  material: Material,
  intensity: number,
  isTop?: boolean,
  isInner?: boolean,
): string {
  const [r1, g1, b1] = parseHexRgb(material.color);
  const [r0, g0, b0] = parseHexRgb(material.shade);
  const factor = Math.min(
    1,
    Math.max(0, intensity * (isTop ? 1.15 : 1) * (isInner ? 0.72 : 1)),
  );
  const r = Math.round(r0 + (r1 - r0) * factor);
  const g = Math.round(g0 + (g1 - g0) * factor);
  const b = Math.round(b0 + (b1 - b0) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function intersectEdgeAtY(a: Vec3, b: Vec3, cutY: number): Vec3 {
  const dy = b.y - a.y;
  if (Math.abs(dy) < 1e-9) return { x: a.x, y: cutY, z: a.z };
  const t = (cutY - a.y) / dy;
  return {
    x: a.x + (b.x - a.x) * t,
    y: cutY,
    z: a.z + (b.z - a.z) * t,
  };
}

function clipFaceAtY(face: Face3D, cutY: number): Vec3[] | null {
  const out: Vec3[] = [];
  const verts = face.vertices;
  const n = verts.length;

  for (let i = 0; i < n; i++) {
    const curr = verts[i];
    const next = verts[(i + 1) % n];
    if (!curr || !next) continue;
    const currIn = curr.y <= cutY;
    const nextIn = next.y <= cutY;

    if (currIn) out.push(curr);
    if (currIn !== nextIn) out.push(intersectEdgeAtY(curr, next, cutY));
  }

  return out.length > 0 ? out : null;
}

const RENDER_MODES: readonly {
  id: ViewportRenderMode;
  label: string;
  icon: typeof Box;
}[] = [
  { id: "solid", label: "Solid", icon: Box },
  { id: "wireframe", label: "Wireframe", icon: Grid3X3 },
  { id: "layers", label: "Слои", icon: Layers },
];

export function CadViewport3D() {
  const {
    partType,
    dimensions,
    materialId,
    labelText,
    activeDimension,
    renderMode,
    setRenderMode,
  } = useCalculator();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({ yaw: -0.62, pitch: 0.44 });
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    lastX: number;
    lastY: number;
  }>({ active: false, pointerId: null, lastX: 0, lastY: 0 });

  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(1);
  const [viewportVersion, setViewportVersion] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const printStartRef = useRef<number | null>(null);

  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];
  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const totalLayers = Math.max(10, Math.round(dimensions.h / 0.2));
  const currentLayer = Math.max(
    1,
    Math.min(totalLayers, Math.round(printProgress * totalLayers)),
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Анимация послойной печати
  useEffect(() => {
    if (prefersReducedMotion) {
      if (isPrinting) {
        setIsPrinting(false);
        setPrintProgress(1);
      }
      return;
    }
    if (!isPrinting) return;
    let rafId = 0;
    const durationMs = 5600;

    const tick = (now: number) => {
      if (printStartRef.current === null) {
        printStartRef.current = now;
      }
      const elapsed = now - printStartRef.current;
      const nextProgress = Math.min(1, Math.max(0.03, elapsed / durationMs));
      setPrintProgress(nextProgress);

      if (nextProgress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setIsPrinting(false);
        printStartRef.current = null;
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPrinting, prefersReducedMotion]);

  function togglePrintSimulation() {
    if (isPrinting) {
      setIsPrinting(false);
      printStartRef.current = null;
      setPrintProgress(1);
      return;
    }
    if (prefersReducedMotion) {
      setPrintProgress(1);
      return;
    }
    printStartRef.current = null;
    setPrintProgress(0.03);
    setIsPrinting(true);
  }

  function resetCamera() {
    rotationRef.current = { yaw: -0.62, pitch: 0.44 };
    setIsPrinting(false);
    setPrintProgress(1);
    setViewportVersion((v) => v + 1);
  }

  // Основной рендер-цикл High-DPI Canvas
  // biome-ignore lint/correctness/useExhaustiveDependencies: viewportVersion — искусственный триггер перерисовки после сброса ракурса
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;

    const render = (timestamp: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height));

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Радиальная подсветка рабочего стола
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.52,
        15,
        width * 0.5,
        height * 0.52,
        width * 0.62,
      );
      bgGrad.addColorStop(0, "rgba(0, 209, 255, 0.07)");
      bgGrad.addColorStop(0.55, "rgba(22, 25, 32, 0.25)");
      bgGrad.addColorStop(1, "rgba(14, 16, 20, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const { yaw, pitch } = rotationRef.current;
      const geometry = buildGeometry(partType, dimensions);

      // Авто-масштаб под габарит детали
      const maxSpan = Math.max(dimensions.d1, dimensions.d2, dimensions.h, 55);
      const scale = Math.min(width, height) / (maxSpan * 2.15);
      const centerX = width * 0.5;
      const centerY = height * 0.51;

      const project = (pt: Vec3) => {
        const r = rotatePoint(pt, yaw, pitch);
        const perspective = 1 + r.z / (maxSpan * 5.5);
        return {
          x: centerX + r.x * scale * perspective,
          y: centerY - r.y * scale * perspective,
          z: r.z,
        };
      };

      // 1. Отрисовка координатной сетки печатного стола (на уровне minY)
      const bedY = geometry.minY;
      const gridHalf = Math.max(dimensions.d1, dimensions.d2) * 0.78;
      const gridSteps = 6;
      ctx.lineWidth = 1;
      for (let i = -gridSteps; i <= gridSteps; i++) {
        const offset = (i / gridSteps) * gridHalf;
        const p1 = project({ x: -gridHalf, y: bedY, z: offset });
        const p2 = project({ x: gridHalf, y: bedY, z: offset });
        const p3 = project({ x: offset, y: bedY, z: -gridHalf });
        const p4 = project({ x: offset, y: bedY, z: gridHalf });

        ctx.strokeStyle =
          i === 0 ? "rgba(0, 209, 255, 0.28)" : "rgba(38, 43, 54, 0.65)";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // 2. Высота активного слоя при печати
      const activeCutY =
        geometry.minY + (geometry.maxY - geometry.minY) * printProgress;
      const shouldClip = isPrinting && printProgress < 1;

      // Вспомогательная отрисовка контура сечения на высоте y
      const drawLayerContour = (
        ly: number,
        strokeStyle: string,
        lineWidth: number,
      ) => {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        if (
          geometry.isBoxy &&
          geometry.halfL != null &&
          geometry.halfW != null
        ) {
          const corners = [
            { x: -geometry.halfL, y: ly, z: -geometry.halfW },
            { x: geometry.halfL, y: ly, z: -geometry.halfW },
            { x: geometry.halfL, y: ly, z: geometry.halfW },
            { x: -geometry.halfL, y: ly, z: geometry.halfW },
          ];
          for (let k = 0; k <= corners.length; k++) {
            const corner = corners[k % corners.length];
            if (!corner) continue;
            const p = project(corner);
            if (k === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        } else if (geometry.layerRadiusAtY) {
          const r = geometry.layerRadiusAtY(ly);
          const segs = 28;
          for (let k = 0; k <= segs; k++) {
            const ang = (k / segs) * Math.PI * 2;
            const p = project({
              x: Math.cos(ang) * r,
              y: ly,
              z: Math.sin(ang) * r,
            });
            if (k === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }

        ctx.stroke();
      };

      // 3. Отсечение и сортировка полигонов (алгоритм художника)
      const lightDir = normalize({ x: -0.45, y: 0.75, z: 0.55 });
      const preparedFaces = geometry.faces
        .map((face) => {
          const clipped = shouldClip
            ? clipFaceAtY(face, activeCutY)
            : [...face.vertices];
          if (!clipped || clipped.length < 3) return null;

          const projected = clipped.map(project);
          const avgZ =
            projected.reduce((sum, p) => sum + p.z, 0) / projected.length;
          const rotNormal = rotatePoint(face.normal, yaw, pitch);
          const intensity = Math.max(
            0.18,
            dot(rotNormal, lightDir) * 0.65 + 0.45,
          );
          return {
            face,
            projected,
            avgZ,
            intensity,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.avgZ - b.avgZ);

      // 4. Отрисовка 3D-граней детали
      for (const item of preparedFaces) {
        const projected = item.projected;
        if (projected.length < 3) continue;

        ctx.beginPath();
        for (let k = 0; k < projected.length; k++) {
          const p = projected[k];
          if (!p) continue;
          if (k === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();

        if (renderMode === "wireframe") {
          ctx.fillStyle = "rgba(14, 16, 20, 0.32)";
          ctx.fill();
          ctx.strokeStyle = item.face.isAccent
            ? "rgba(255, 92, 26, 0.85)"
            : "rgba(0, 209, 255, 0.65)";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (renderMode === "layers") {
          ctx.fillStyle = item.face.isAccent
            ? "rgb(20, 23, 29)"
            : shadeColor(
                material,
                item.intensity * 0.85,
                item.face.isTop,
                item.face.isInner,
              );
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 92, 26, 0.42)";
          ctx.lineWidth = 0.9;
          ctx.stroke();
        } else {
          // Solid режим
          ctx.fillStyle = item.face.isAccent
            ? "rgb(22, 25, 32)"
            : shadeColor(
                material,
                item.intensity,
                item.face.isTop,
                item.face.isInner,
              );
          ctx.fill();
          ctx.strokeStyle = item.face.isAccent
            ? "rgba(0, 209, 255, 0.32)"
            : "carbon" in material && material.carbon
              ? "rgba(0, 209, 255, 0.16)"
              : "rgba(242, 244, 247, 0.14)";
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      // 4b. Проекция рельефной надписи и отверстия подвеса для "plant-tag"
      if (partType === "plant-tag" && activeCutY >= geometry.maxY - 0.15) {
        const L = dimensions.d1;
        const halfL = L / 2;
        const headStartX = -halfL + L * 0.52;
        const headEndX = halfL;
        const rimX0 = headStartX + 1.2;
        const rimX1 = headEndX - 6.8;
        const textCenterX = (rimX0 + rimX1) * 0.5;
        const topY = geometry.maxY + 0.1;

        // Крепежное отверстие Ø 3.4 мм в головке
        const holeCenter = project({
          x: headEndX - 3.6,
          y: topY,
          z: 0,
        });
        ctx.fillStyle = "#0E1014";
        ctx.strokeStyle = "#00D1FF";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(
          holeCenter.x,
          holeCenter.y,
          Math.max(2.5, 1.7 * scale),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();

        // Проекция текста вдоль оси X головки бирки
        const cleanLabel = (labelText || "ТОМАТ").trim().slice(0, 12);
        if (cleanLabel.length > 0) {
          const pLeft = project({ x: rimX0 + 3, y: topY, z: 0 });
          const pRight = project({ x: rimX1 - 3, y: topY, z: 0 });
          const pTextCenter = project({ x: textCenterX, y: topY, z: 0 });
          const angle = Math.atan2(pRight.y - pLeft.y, pRight.x - pLeft.x);
          const spanPx = Math.hypot(pRight.x - pLeft.x, pRight.y - pLeft.y);
          const fontSizePx = Math.max(
            9,
            Math.min(18, (spanPx / Math.max(4.5, cleanLabel.length)) * 1.38),
          );

          ctx.save();
          ctx.translate(pTextCenter.x, pTextCenter.y);
          ctx.rotate(angle);
          ctx.font = `800 ${Math.round(fontSizePx)}px "JetBrains Mono", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 2.4;
          ctx.strokeStyle = "#0E1014";
          ctx.strokeText(cleanLabel, 0, 0);
          ctx.fillStyle = renderMode === "wireframe" ? "#00D1FF" : "#F2F4F7";
          ctx.fillText(cleanLabel, 0, 0);
          ctx.restore();
        }
      }

      // Горизонтальные изолинии слоев для режима "Слои" или во время печати
      if (renderMode === "layers" || isPrinting) {
        const sliceCount = 16;
        const sliceColor =
          renderMode === "layers"
            ? "rgba(255, 92, 26, 0.5)"
            : "rgba(255, 92, 26, 0.28)";

        for (let s = 1; s <= sliceCount; s++) {
          const ly =
            geometry.minY + ((geometry.maxY - geometry.minY) * s) / sliceCount;
          if (ly > activeCutY) break;
          drawLayerContour(ly, sliceColor, 1);
        }
      }

      // 5. Анимация активного сопла (#FF5C1A) при послойной печати
      if (isPrinting && printProgress < 1) {
        const nozzleAngle = timestamp * 0.0065;
        const orbitR = Math.max(dimensions.d1, dimensions.d2) * 0.36;
        const nozzleWorld: Vec3 = {
          x: Math.cos(nozzleAngle) * orbitR,
          y: activeCutY,
          z: Math.sin(nozzleAngle) * orbitR,
        };
        const nozzlePt = project(nozzleWorld);
        const nozzleTopPt = project({
          x: nozzleWorld.x,
          y: activeCutY + Math.max(14, dimensions.h * 0.25),
          z: nozzleWorld.z,
        });

        // Контур активного слоя по реальному сечению
        drawLayerContour(activeCutY, "#FF5C1A", 2);

        // Корпус хотэнда/сопла
        ctx.strokeStyle = "#F2F4F7";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nozzleTopPt.x, nozzleTopPt.y);
        ctx.lineTo(nozzlePt.x, nozzlePt.y);
        ctx.stroke();

        // Свечение точки экструзии #FF5C1A
        const glow = ctx.createRadialGradient(
          nozzlePt.x,
          nozzlePt.y,
          1,
          nozzlePt.x,
          nozzlePt.y,
          20,
        );
        glow.addColorStop(0, "rgba(255, 255, 255, 1)");
        glow.addColorStop(0.3, "rgba(255, 92, 26, 0.95)");
        glow.addColorStop(1, "rgba(255, 92, 26, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nozzlePt.x, nozzlePt.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Динамические CAD-выноски размеров поверх вьюпорта
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const callout of geometry.callouts) {
        const isHighlighted = activeDimension === callout.key;
        const pStart = project(callout.start);
        const pEnd = project(callout.end);
        const pLabel = project(callout.labelPos);
        const color = isHighlighted ? "#FF5C1A" : "#00D1FF";

        ctx.strokeStyle = color;
        ctx.lineWidth = isHighlighted ? 1.8 : 1.15;
        ctx.setLineDash(isHighlighted ? [] : [4, 3]);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Точки-маркеры на концах размерной линии
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pStart.x, pStart.y, isHighlighted ? 3.2 : 2.3, 0, Math.PI * 2);
        ctx.arc(pEnd.x, pEnd.y, isHighlighted ? 3.2 : 2.3, 0, Math.PI * 2);
        ctx.fill();

        // Плашка с числом в мм
        const text = `${callout.code}: ${callout.value} мм`;
        const metrics = ctx.measureText(text);
        const badgeW = metrics.width + 14;
        const badgeH = 22;

        ctx.fillStyle = isHighlighted
          ? "rgba(255, 92, 26, 0.95)"
          : "rgba(14, 16, 20, 0.88)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(
          pLabel.x - badgeW / 2,
          pLabel.y - badgeH / 2,
          badgeW,
          badgeH,
          6,
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHighlighted ? "#0E1014" : "#F2F4F7";
        ctx.fillText(text, pLabel.x, pLabel.y);
      }

      // 7. Индикатор осей X / Y / Z в левом нижнем углу вьюпорта
      const gizmoOrigin = { x: 46, y: height - 44 };
      const axisLen = 24;
      const axes: readonly { label: string; vec: Vec3; color: string }[] = [
        { label: "X", vec: { x: 1, y: 0, z: 0 }, color: "#FF5C1A" },
        { label: "Y", vec: { x: 0, y: 0, z: 1 }, color: "#00D1FF" },
        { label: "Z", vec: { x: 0, y: 1, z: 0 }, color: "#10B981" },
      ];

      ctx.font = '700 10px "JetBrains Mono", monospace';
      for (const axis of axes) {
        const r = rotatePoint(axis.vec, yaw, pitch);
        const ex = gizmoOrigin.x + r.x * axisLen;
        const ey = gizmoOrigin.y - r.y * axisLen;

        ctx.strokeStyle = axis.color;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(gizmoOrigin.x, gizmoOrigin.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.fillStyle = axis.color;
        ctx.fillText(
          axis.label,
          gizmoOrigin.x + r.x * (axisLen + 10),
          gizmoOrigin.y - r.y * (axisLen + 10),
        );
      }

      ctx.restore();

      if (isPrinting) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    frameId = window.requestAnimationFrame(render);
    const onResize = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(render);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, [
    partType,
    dimensions,
    material,
    labelText,
    activeDimension,
    renderMode,
    isPrinting,
    printProgress,
    viewportVersion,
  ]);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[24px] border border-[#262B36] bg-[#161920] shadow-2xl">
      {/* Верхняя панель CAD-вьюпорта */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262B36] bg-[#0E1014]/75 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-md border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-2 py-0.5 font-mono text-[11px] font-medium text-[#00D1FF]">
            CAD PREVIEW
          </span>
          <span className="font-mono text-xs text-[#8A93A2] tabular-nums">
            {part.code}
          </span>
          <span className="hidden font-mono text-xs text-[#8A93A2] sm:inline">
            · {part.tolerance}
          </span>
        </div>

        {/* Переключатель режимов Solid / Wireframe / Слои */}
        <fieldset
          aria-label="Режим отображения 3D-модели"
          className="flex items-center rounded-lg border border-[#262B36] bg-[#0E1014] p-0.5"
        >
          {RENDER_MODES.map((mode) => {
            const Icon = mode.icon;
            const active = renderMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={active}
                onClick={() => setRenderMode(mode.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-all duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                  active
                    ? "bg-[#161920] text-[#00D1FF] shadow-sm"
                    : "text-[#8A93A2] hover:text-[#F2F4F7]",
                )}
              >
                <Icon className="size-3.5" />
                {mode.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      {/* Интерактивный High-DPI 3D Canvas */}
      <div className="relative h-[360px] w-full select-none sm:h-[430px] lg:h-[470px]">
        <canvas
          ref={canvasRef}
          aria-label={`Интерактивный 3D CAD-вьюпорт: ${part.label}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = {
              active: true,
              pointerId: e.pointerId,
              lastX: e.clientX,
              lastY: e.clientY,
            };
          }}
          onPointerMove={(e) => {
            if (
              !dragRef.current.active ||
              e.pointerId !== dragRef.current.pointerId
            ) {
              return;
            }
            const dx = e.clientX - dragRef.current.lastX;
            const dy = e.clientY - dragRef.current.lastY;
            dragRef.current.lastX = e.clientX;
            dragRef.current.lastY = e.clientY;
            rotationRef.current = {
              yaw: rotationRef.current.yaw + dx * 0.011,
              pitch: Math.max(
                -0.25,
                Math.min(1.15, rotationRef.current.pitch + dy * 0.009),
              ),
            };
            setViewportVersion((v) => v + 1);
          }}
          onPointerUp={(e) => {
            if (
              !dragRef.current.active ||
              e.pointerId !== dragRef.current.pointerId
            ) {
              return;
            }
            e.currentTarget.releasePointerCapture(e.pointerId);
            dragRef.current = {
              ...dragRef.current,
              active: false,
              pointerId: null,
            };
            setViewportVersion((v) => v + 1);
          }}
          onPointerCancel={(e) => {
            if (
              !dragRef.current.active ||
              e.pointerId !== dragRef.current.pointerId
            ) {
              return;
            }
            e.currentTarget.releasePointerCapture(e.pointerId);
            dragRef.current = {
              ...dragRef.current,
              active: false,
              pointerId: null,
            };
            setViewportVersion((v) => v + 1);
          }}
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        />

        {/* HUD телеметрии слоя и прогресса печати */}
        <div className="pointer-events-none absolute top-3.5 right-3.5 flex flex-col items-end gap-1.5 rounded-xl border border-[#262B36] bg-[#0E1014]/90 px-3 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#8A93A2]">
            <span
              className={cn(
                "size-2 rounded-full",
                isPrinting
                  ? "animate-pulse bg-[#FF5C1A] shadow-[0_0_8px_#FF5C1A]"
                  : "bg-[#10B981]",
              )}
            />
            <span>{isPrinting ? "G-CODE T0: 255 °C" : "ГОТОВО К ПЕЧАТИ"}</span>
          </div>
          <div className="font-mono text-xs font-semibold text-[#F2F4F7] tabular-nums">
            Слой {currentLayer} / {totalLayers}{" "}
            <span className="text-[#00D1FF]">
              ({Math.round(printProgress * 100)}%)
            </span>
          </div>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-[#262B36]">
            <div
              className="h-full bg-[#FF5C1A] transition-[width] duration-150"
              style={{ width: `${Math.round(printProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Подсказка вращения */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 hidden rounded-lg border border-[#262B36]/80 bg-[#0E1014]/80 px-2.5 py-1 font-mono text-[11px] text-[#8A93A2] sm:block">
          ЛКМ / Тач — вращение 360° · Материал:{" "}
          <span className="text-[#F2F4F7]">{material.code}</span>
        </div>
      </div>

      {/* Нижняя панель управления симуляцией послойной печати */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#262B36] bg-[#0E1014]/75 px-4 py-3">
        <div className="flex items-center gap-3 font-mono text-xs text-[#8A93A2] tabular-nums">
          <span>
            Шаг слоя: <strong className="text-[#F2F4F7]">0.20 мм</strong>
          </span>
          <span className="text-[#262B36]">|</span>
          <span>
            Сопло: <strong className="text-[#FF5C1A]">0.4 мм</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCamera}
            aria-label="Сбросить ракурс 3D-модели"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#262B36] bg-[#161920] px-2.5 font-mono text-xs text-[#8A93A2] transition-colors hover:border-[#8A93A2]/50 hover:text-[#F2F4F7]"
          >
            <RotateCcw className="size-3.5" />
            Сброс
          </button>
          <button
            type="button"
            onClick={togglePrintSimulation}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 font-mono text-xs font-medium transition-all duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C1A]",
              isPrinting
                ? "border-[#FF5C1A] bg-[#FF5C1A]/15 text-[#FF5C1A]"
                : "border-[#FF5C1A]/60 bg-[#FF5C1A]/10 text-[#F2F4F7] hover:border-[#FF5C1A] hover:bg-[#FF5C1A]/20",
            )}
          >
            {isPrinting ? (
              <>
                <Pause className="size-3.5 text-[#FF5C1A]" />
                Остановить печать
              </>
            ) : (
              <>
                <Play className="size-3.5 text-[#FF5C1A]" />
                Послойная печать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
