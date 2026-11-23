export const SITE_URL = "https://paramlab.ru";

export const NAV_LINKS = [
  { href: "#calculator", label: "Конфигуратор" },
  { href: "#advantages", label: "Лаборатория" },
  { href: "#templates", label: "Шаблоны CAD" },
  { href: "#workflow", label: "Цикл печати" },
  { href: "#faq", label: "Вопросы" },
] as const;

export interface Material {
  id: string;
  title: string;
  code: string;
  temp: string;
  description: string;
  /** Тариф, ₽ за грамм. */
  rate: number;
  /** Плотность, г/см³ — для оценки массы детали из генератора. */
  density: number;
  /** Карбоновый пластик: матовая текстура с углеволокном. */
  carbon?: boolean;
  /** Основной цвет детали на 3D CAD-вьюпорте. */
  color: string;
  /** Вторичный оттенок граней для глубины 3D-шейдинга. */
  shade: string;
  /** Акцент блика / ребер материала. */
  specular: string;
  /** Индекс прочности (МПа, для сравнения в Bento-сетке). */
  strengthMpa: number;
  /** Максимальная рабочая температура (°C). */
  maxTempC: number;
}

export const MATERIALS = [
  {
    id: "petg",
    title: "Базовый конструкционный",
    code: "PETG",
    temp: "до 75 °C",
    description: "Корпуса приборов, кронштейны, технические крепления",
    rate: 18,
    density: 1.27,
    color: "#384152",
    shade: "#232936",
    specular: "#64748B",
    strengthMpa: 52,
    maxTempC: 75,
  },
  {
    id: "abs",
    title: "Термостойкий технический",
    code: "ABS",
    temp: "до 105 °C",
    description: "Автомобильные узлы, кожухи станков, работа под нагрузкой",
    rate: 23,
    density: 1.05,
    color: "#2E3A46",
    shade: "#1D252E",
    specular: "#52667A",
    strengthMpa: 64,
    maxTempC: 105,
  },
  {
    id: "pa12",
    title: "Инженерный полиамид",
    code: "PA12 Nylon",
    temp: "до 135 °C",
    description: "Шестерни, силовые втулки скольжения, износостойкие узлы",
    rate: 32,
    density: 1.02,
    color: "#434957",
    shade: "#2A2E38",
    specular: "#8B95A8",
    strengthMpa: 78,
    maxTempC: 135,
  },
  {
    id: "petgcf",
    title: "Угленаполненный композит",
    code: "PETG-CF",
    temp: "до 115 °C",
    description: "Матрица с рубленым углеволокном (15% CF), высокая жесткость",
    rate: 36,
    density: 1.32,
    carbon: true,
    color: "#1E222B",
    shade: "#12151B",
    specular: "#485164",
    strengthMpa: 88,
    maxTempC: 115,
  },
] as const satisfies readonly Material[];

export type MaterialId = (typeof MATERIALS)[number]["id"];

export type DimensionKey = "d1" | "d2" | "h";
export type Dimensions = Record<DimensionKey, number>;

interface PartParameterMeta {
  code: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
}

interface PartTextParamMeta {
  code: string;
  label: string;
  placeholder: string;
  maxLength: number;
  initial: string;
  presets: readonly string[];
}

export type PartCategoryId =
  | "bearings"
  | "drives"
  | "enclosures"
  | "piping"
  | "mounting"
  | "storage"
  | "marking";

export interface PartCategoryMeta {
  id: PartCategoryId;
  label: string;
  shortLabel: string;
}

export const PART_CATEGORIES = [
  { id: "bearings", label: "Узлы трения и втулки", shortLabel: "Втулки" },
  { id: "drives", label: "Приводы и редукторы", shortLabel: "Приводы" },
  { id: "enclosures", label: "Приборостроение и РЭА", shortLabel: "Корпуса" },
  {
    id: "piping",
    label: "Аспирация, трубы и пневматика",
    shortLabel: "Патрубки",
  },
  {
    id: "mounting",
    label: "Станочная оснастка и крепеж",
    shortLabel: "Крепеж",
  },
  { id: "storage", label: "Лабораторное хранение", shortLabel: "Хранение" },
  {
    id: "marking",
    label: "Агротехника и маркировка",
    shortLabel: "Маркировка",
  },
] as const satisfies readonly PartCategoryMeta[];

export interface PartModelPreset {
  id: string;
  title: string;
  dimensions: Dimensions;
  labelText?: string;
}

export interface PartType {
  id: string;
  categoryId: PartCategoryId;
  category: string;
  shortLabel: string;
  label: string;
  description: string;
  code: string;
  tolerance: string;
  recommendedMaterialId: MaterialId;
  /** Подписи ползунков и диапазоны размеров в Hero-конфигураторе. */
  dimensions: Record<DimensionKey, PartParameterMeta>;
  /** Готовые типоразмеры (быстрые пресеты внутри выбранной модели). */
  presets: readonly PartModelPreset[];
  /** Опциональная параметрическая надпись (например, для двухцветной бирки). */
  textParam?: PartTextParamMeta;
}

export const PART_TYPES = [
  {
    id: "bushing",
    categoryId: "bearings",
    category: "Узлы трения и втулки",
    shortLabel: "Втулка / Фланец",
    label: "Втулка / Фланец с центрирующим буртиком",
    description:
      "Силовая втулка скольжения с опорным буртиком для валов, шарниров и направляющих.",
    code: "CAD-BSH-01",
    tolerance: "ISO 2768-mK · ±0.1 мм",
    recommendedMaterialId: "pa12",
    presets: [
      {
        id: "bsh-std",
        title: "Ø56×32 · H48",
        dimensions: { d1: 56, d2: 32, h: 48 },
      },
      {
        id: "bsh-m12",
        title: "Под вал Ø12",
        dimensions: { d1: 28, d2: 12, h: 30 },
      },
      {
        id: "bsh-m20",
        title: "Под вал Ø20",
        dimensions: { d1: 42, d2: 20, h: 40 },
      },
      {
        id: "bsh-heavy",
        title: "Силовая Ø90",
        dimensions: { d1: 90, d2: 50, h: 65 },
      },
    ],
    dimensions: {
      d1: {
        code: "D",
        label: "Наружный диаметр D",
        unit: "мм",
        min: 20,
        max: 160,
        step: 1,
        initial: 56,
      },
      d2: {
        code: "d",
        label: "Внутренний канал d",
        unit: "мм",
        min: 8,
        max: 140,
        step: 1,
        initial: 32,
      },
      h: {
        code: "H",
        label: "Высота профиля H",
        unit: "мм",
        min: 15,
        max: 140,
        step: 1,
        initial: 48,
      },
    },
  },
  {
    id: "spacer-ring",
    categoryId: "bearings",
    category: "Узлы трения и втулки",
    shortLabel: "Дистанционная шайба",
    label: "Дистанционная втулка-проставка без буртика",
    description:
      "Точное проставочное кольцо с плоскопараллельными торцами для выставления осевых зазоров.",
    code: "CAD-SPC-09",
    tolerance: "Параллельность 0.08 мм",
    recommendedMaterialId: "pa12",
    presets: [
      {
        id: "spc-std",
        title: "Ø45×22 · H18",
        dimensions: { d1: 45, d2: 22, h: 18 },
      },
      {
        id: "spc-m10",
        title: "Шайба М10",
        dimensions: { d1: 26, d2: 10, h: 8 },
      },
      {
        id: "spc-m16",
        title: "Проставка М16",
        dimensions: { d1: 38, d2: 16, h: 25 },
      },
    ],
    dimensions: {
      d1: {
        code: "D",
        label: "Наружный диаметр D",
        unit: "мм",
        min: 16,
        max: 160,
        step: 1,
        initial: 45,
      },
      d2: {
        code: "d",
        label: "Посадочный канал d",
        unit: "мм",
        min: 6,
        max: 130,
        step: 1,
        initial: 22,
      },
      h: {
        code: "H",
        label: "Толщина кольца H",
        unit: "мм",
        min: 5,
        max: 120,
        step: 1,
        initial: 18,
      },
    },
  },
  {
    id: "din-box",
    categoryId: "enclosures",
    category: "Приборостроение и РЭА",
    shortLabel: "Корпус РЭА",
    label: "Корпус РЭА с монтажными стойками PCB",
    description:
      "Приборный бокс с угловыми бобышками под печатную плату и внешними крепежными проушинами.",
    code: "CAD-ENC-02",
    tolerance: "IP54 · Стенка ≥ 2.0 мм",
    recommendedMaterialId: "petgcf",
    presets: [
      {
        id: "enc-std",
        title: "110×74×42 мм",
        dimensions: { d1: 110, d2: 74, h: 42 },
      },
      {
        id: "enc-mini",
        title: "Мини-датчик 65×45",
        dimensions: { d1: 65, d2: 45, h: 28 },
      },
      {
        id: "enc-plc",
        title: "Блок ПЛК 160×110",
        dimensions: { d1: 160, d2: 110, h: 58 },
      },
    ],
    dimensions: {
      d1: {
        code: "L",
        label: "Длина корпуса L",
        unit: "мм",
        min: 40,
        max: 220,
        step: 1,
        initial: 110,
      },
      d2: {
        code: "W",
        label: "Ширина корпуса W",
        unit: "мм",
        min: 30,
        max: 180,
        step: 1,
        initial: 74,
      },
      h: {
        code: "H",
        label: "Высота корпуса H",
        unit: "мм",
        min: 20,
        max: 120,
        step: 1,
        initial: 42,
      },
    },
  },
  {
    id: "junction-box",
    categoryId: "enclosures",
    category: "Приборостроение и РЭА",
    shortLabel: "Распредкоробка",
    label: "Герметичная клеммная коробка с фланцами",
    description:
      "Усиленный распределительный бокс с утолщенным периметром под уплотнитель и кабельные вводы.",
    code: "CAD-JBX-10",
    tolerance: "IP65 · Буртик крышки",
    recommendedMaterialId: "abs",
    presets: [
      {
        id: "jbx-std",
        title: "120×90×55 мм",
        dimensions: { d1: 120, d2: 90, h: 55 },
      },
      {
        id: "jbx-sq",
        title: "Квадрат 100×100",
        dimensions: { d1: 100, d2: 100, h: 50 },
      },
      {
        id: "jbx-lg",
        title: "Силовая 180×130",
        dimensions: { d1: 180, d2: 130, h: 75 },
      },
    ],
    dimensions: {
      d1: {
        code: "L",
        label: "Длина коробки L",
        unit: "мм",
        min: 50,
        max: 220,
        step: 1,
        initial: 120,
      },
      d2: {
        code: "W",
        label: "Ширина коробки W",
        unit: "мм",
        min: 50,
        max: 180,
        step: 1,
        initial: 90,
      },
      h: {
        code: "H",
        label: "Глубина коробки H",
        unit: "мм",
        min: 25,
        max: 120,
        step: 1,
        initial: 55,
      },
    },
  },
  {
    id: "gear",
    categoryId: "drives",
    category: "Приводы и редукторы",
    shortLabel: "Шестерня",
    label: "Прямозубая цилиндрическая шестерня",
    description:
      "Зубчатое колесо с углом зацепления α = 20° и усиленной ступицей для приводных механизмов.",
    code: "CAD-GR-03",
    tolerance: "DIN 3962 · α = 20°",
    recommendedMaterialId: "pa12",
    presets: [
      {
        id: "gr-std",
        title: "Ø72×20 · H24",
        dimensions: { d1: 72, d2: 20, h: 24 },
      },
      {
        id: "gr-pinion",
        title: "Вал-шестерня Ø36",
        dimensions: { d1: 36, d2: 10, h: 18 },
      },
      {
        id: "gr-power",
        title: "Ведомая Ø120",
        dimensions: { d1: 120, d2: 32, h: 35 },
      },
    ],
    dimensions: {
      d1: {
        code: "D",
        label: "Делительный диаметр D",
        unit: "мм",
        min: 28,
        max: 160,
        step: 1,
        initial: 72,
      },
      d2: {
        code: "d",
        label: "Посадочный вал d",
        unit: "мм",
        min: 6,
        max: 90,
        step: 1,
        initial: 20,
      },
      h: {
        code: "H",
        label: "Ширина венца H",
        unit: "мм",
        min: 10,
        max: 80,
        step: 1,
        initial: 24,
      },
    },
  },
  {
    id: "belt-pulley",
    categoryId: "drives",
    category: "Приводы и редукторы",
    shortLabel: "Зубчатый шкив",
    label: "Шкив приводного ремня с ребордами",
    description:
      "Приводной шкив с боковыми удерживающими фланцами и центральным посадочным отверстием под вал.",
    code: "CAD-PLY-11",
    tolerance: "Биение ≤ 0.1 мм",
    recommendedMaterialId: "pa12",
    presets: [
      {
        id: "ply-std",
        title: "Ø64×16 · H28",
        dimensions: { d1: 64, d2: 16, h: 28 },
      },
      {
        id: "ply-gt2",
        title: "Малый Ø38×8",
        dimensions: { d1: 38, d2: 8, h: 20 },
      },
      {
        id: "ply-htd",
        title: "Силовой Ø96×25",
        dimensions: { d1: 96, d2: 25, h: 36 },
      },
    ],
    dimensions: {
      d1: {
        code: "D",
        label: "Рабочий диаметр шкива D",
        unit: "мм",
        min: 28,
        max: 150,
        step: 1,
        initial: 64,
      },
      d2: {
        code: "d",
        label: "Диаметр вала d",
        unit: "мм",
        min: 6,
        max: 80,
        step: 1,
        initial: 16,
      },
      h: {
        code: "H",
        label: "Ширина под ремень H",
        unit: "мм",
        min: 12,
        max: 80,
        step: 1,
        initial: 28,
      },
    },
  },
  {
    id: "adapter",
    categoryId: "piping",
    category: "Аспирация, трубы и пневматика",
    shortLabel: "Переходник",
    label: "Ступенчатый переходник воздуховода",
    description:
      "Конический адаптер для стыковки патрубков разного диаметра в системах вытяжки и аспирации.",
    code: "CAD-ADP-04",
    tolerance: "Герметичный шов · ±0.15 мм",
    recommendedMaterialId: "abs",
    presets: [
      {
        id: "adp-std",
        title: "Ø68 → Ø42 · H64",
        dimensions: { d1: 68, d2: 42, h: 64 },
      },
      {
        id: "adp-vac",
        title: "Пылесос 50→35",
        dimensions: { d1: 50, d2: 35, h: 58 },
      },
      {
        id: "adp-vent",
        title: "Вентканал 125→100",
        dimensions: { d1: 125, d2: 100, h: 85 },
      },
    ],
    dimensions: {
      d1: {
        code: "D1",
        label: "Диаметр ступени D1",
        unit: "мм",
        min: 25,
        max: 200,
        step: 1,
        initial: 68,
      },
      d2: {
        code: "D2",
        label: "Диаметр ступени D2",
        unit: "мм",
        min: 18,
        max: 160,
        step: 1,
        initial: 42,
      },
      h: {
        code: "H",
        label: "Общая длина H",
        unit: "мм",
        min: 25,
        max: 160,
        step: 1,
        initial: 64,
      },
    },
  },
  {
    id: "flange-nozzle",
    categoryId: "piping",
    category: "Аспирация, трубы и пневматика",
    shortLabel: "Фланцевый патрубок",
    label: "Врезной патрубок с монтажным фланцем",
    description:
      "Цилиндрический штуцер с широкой опорной плитой для подключения шлангов к корпусам и коллекторам.",
    code: "CAD-NZL-12",
    tolerance: "Фланец 4 мм · Герметично",
    recommendedMaterialId: "abs",
    presets: [
      {
        id: "nzl-std",
        title: "Плита Ø90 / Труба Ø50",
        dimensions: { d1: 90, d2: 50, h: 55 },
      },
      {
        id: "nzl-100",
        title: "Вытяжка Ø140 / Ø100",
        dimensions: { d1: 140, d2: 100, h: 70 },
      },
      {
        id: "nzl-compact",
        title: "Штуцер Ø60 / Ø28",
        dimensions: { d1: 60, d2: 28, h: 42 },
      },
    ],
    dimensions: {
      d1: {
        code: "D1",
        label: "Диаметр фланца D1",
        unit: "мм",
        min: 45,
        max: 200,
        step: 1,
        initial: 90,
      },
      d2: {
        code: "D2",
        label: "Диаметр патрубка D2",
        unit: "мм",
        min: 20,
        max: 150,
        step: 1,
        initial: 50,
      },
      h: {
        code: "H",
        label: "Вылет патрубка H",
        unit: "мм",
        min: 25,
        max: 140,
        step: 1,
        initial: 55,
      },
    },
  },
  {
    id: "end-cap",
    categoryId: "mounting",
    category: "Станочная оснастка и крепеж",
    shortLabel: "Крепление / Заглушка",
    label: "Опорный фланец-заглушка в профиль",
    description:
      "Торцевая опора и заглушка для конструкционного профиля и прямоугольных труб с посадкой внатяг.",
    code: "CAD-MNT-05",
    tolerance: "Натяг +0.15 мм",
    recommendedMaterialId: "petg",
    presets: [
      {
        id: "cap-60x40",
        title: "Профиль 60×40",
        dimensions: { d1: 60, d2: 40, h: 30 },
      },
      {
        id: "cap-40x40",
        title: "Станок 40×40",
        dimensions: { d1: 40, d2: 40, h: 25 },
      },
      {
        id: "cap-80x40",
        title: "Силовой 80×40",
        dimensions: { d1: 80, d2: 40, h: 35 },
      },
    ],
    dimensions: {
      d1: {
        code: "L",
        label: "Габарит профиля L",
        unit: "мм",
        min: 20,
        max: 160,
        step: 1,
        initial: 60,
      },
      d2: {
        code: "W",
        label: "Ширина посадки W",
        unit: "мм",
        min: 20,
        max: 160,
        step: 1,
        initial: 40,
      },
      h: {
        code: "H",
        label: "Глубина захода H",
        unit: "мм",
        min: 15,
        max: 100,
        step: 1,
        initial: 30,
      },
    },
  },
  {
    id: "bracket",
    categoryId: "mounting",
    category: "Станочная оснастка и крепеж",
    shortLabel: "Кронштейн",
    label: "Угловой кронштейн с ребрами жесткости",
    description:
      "Силовой L-образный уголок с двумя треугольными косынками жесткости для монтажа приводов и датчиков.",
    code: "CAD-BRK-06",
    tolerance: "ISO 2768-mK · Отверстия H8",
    recommendedMaterialId: "petgcf",
    presets: [
      {
        id: "brk-std",
        title: "68×44×52 мм",
        dimensions: { d1: 68, d2: 44, h: 52 },
      },
      {
        id: "brk-nema17",
        title: "Под NEMA17 (50×44)",
        dimensions: { d1: 50, d2: 44, h: 50 },
      },
      {
        id: "brk-heavy",
        title: "Консоль 110×65×85",
        dimensions: { d1: 110, d2: 65, h: 85 },
      },
    ],
    dimensions: {
      d1: {
        code: "L",
        label: "Длина базы L",
        unit: "мм",
        min: 30,
        max: 160,
        step: 1,
        initial: 68,
      },
      d2: {
        code: "W",
        label: "Ширина кронштейна W",
        unit: "мм",
        min: 20,
        max: 120,
        step: 1,
        initial: 44,
      },
      h: {
        code: "H",
        label: "Высота опоры H",
        unit: "мм",
        min: 20,
        max: 120,
        step: 1,
        initial: 52,
      },
    },
  },
  {
    id: "pipe-clamp",
    categoryId: "mounting",
    category: "Станочная оснастка и крепеж",
    shortLabel: "Опора вала / трубы",
    label: "Хомут-держатель трубы и направляющего вала",
    description:
      "Опорный блок с полукруглым ложементом и крепежными фланцами для фиксации труб, кабелей и валов.",
    code: "CAD-CLM-13",
    tolerance: "Посадка ±0.1 мм",
    recommendedMaterialId: "petgcf",
    presets: [
      {
        id: "clm-std",
        title: "База 76 · Труба Ø32",
        dimensions: { d1: 76, d2: 32, h: 28 },
      },
      {
        id: "clm-d20",
        title: "Опора вала Ø20",
        dimensions: { d1: 60, d2: 20, h: 24 },
      },
      {
        id: "clm-d50",
        title: "Хомут трубы Ø50",
        dimensions: { d1: 110, d2: 50, h: 36 },
      },
    ],
    dimensions: {
      d1: {
        code: "L",
        label: "Длина базы с ушами L",
        unit: "мм",
        min: 40,
        max: 160,
        step: 1,
        initial: 76,
      },
      d2: {
        code: "d",
        label: "Посадочный диаметр трубы d",
        unit: "мм",
        min: 12,
        max: 90,
        step: 1,
        initial: 32,
      },
      h: {
        code: "H",
        label: "Ширина прижима H",
        unit: "мм",
        min: 16,
        max: 80,
        step: 1,
        initial: 28,
      },
    },
  },
  {
    id: "organizer",
    categoryId: "storage",
    category: "Лабораторное хранение",
    shortLabel: "Органайзер",
    label: "Модульный ложемент с ячейками",
    description:
      "Инструментальный лоток с жесткими перегородками для хранения фрез, крепежа и радиокомпонентов.",
    code: "CAD-ORG-07",
    tolerance: "Ячейки ±0.2 мм · R дно",
    recommendedMaterialId: "petg",
    presets: [
      {
        id: "org-std",
        title: "140×95×36 мм",
        dimensions: { d1: 140, d2: 95, h: 36 },
      },
      {
        id: "org-grid2x1",
        title: "Кассета 100×60×30",
        dimensions: { d1: 100, d2: 60, h: 30 },
      },
      {
        id: "org-tray",
        title: "Лоток 200×140×48",
        dimensions: { d1: 200, d2: 140, h: 48 },
      },
    ],
    dimensions: {
      d1: {
        code: "L",
        label: "Длина лотка L",
        unit: "мм",
        min: 40,
        max: 220,
        step: 1,
        initial: 140,
      },
      d2: {
        code: "W",
        label: "Ширина лотка W",
        unit: "мм",
        min: 40,
        max: 160,
        step: 1,
        initial: 95,
      },
      h: {
        code: "H",
        label: "Глубина ячейки H",
        unit: "мм",
        min: 15,
        max: 90,
        step: 1,
        initial: 36,
      },
    },
  },
  {
    id: "plant-tag",
    categoryId: "marking",
    category: "Агротехника и маркировка",
    shortLabel: "Садовая бирка",
    label: "Двухцветная бирка-колышек с рельефной надписью",
    description:
      "Маркировочный колышек с продольным ребром жесткости и контрастным рельефным текстом.",
    code: "CAD-TAG-08",
    tolerance: "2 цвета (Z = 2.4 мм) · Ребро жесткости",
    recommendedMaterialId: "petg",
    presets: [
      {
        id: "tag-tomat",
        title: "124×26 · ТОМАТ",
        dimensions: { d1: 124, d2: 26, h: 3 },
        labelText: "ТОМАТ",
      },
      {
        id: "tag-perec",
        title: "110×24 · ПЕРЕЦ",
        dimensions: { d1: 110, d2: 24, h: 3 },
        labelText: "ПЕРЕЦ",
      },
      {
        id: "tag-bakl",
        title: "140×30 · БАКЛАЖАН",
        dimensions: { d1: 140, d2: 30, h: 4 },
        labelText: "БАКЛАЖАН",
      },
    ],
    textParam: {
      code: "TXT",
      label: "Надпись на бирке (кириллица / цифры)",
      placeholder: "Например: ТОМАТ",
      maxLength: 12,
      initial: "ТОМАТ",
      presets: ["ТОМАТ", "ПЕРЕЦ", "ОГУРЕЦ", "БАКЛАЖАН"],
    },
    dimensions: {
      d1: {
        code: "L",
        label: "Общая длина с колышком L",
        unit: "мм",
        min: 80,
        max: 150,
        step: 1,
        initial: 124,
      },
      d2: {
        code: "W",
        label: "Ширина таблички W",
        unit: "мм",
        min: 22,
        max: 36,
        step: 1,
        initial: 26,
      },
      h: {
        code: "H",
        label: "Общая толщина с рельефом H",
        unit: "мм",
        min: 3,
        max: 6,
        step: 1,
        initial: 3,
      },
    },
  },
] as const satisfies readonly PartType[];

export type PartTypeId = (typeof PART_TYPES)[number]["id"];

export interface ParametricTemplateCard {
  id: string;
  partType: PartTypeId;
  category: string;
  code: string;
  title: string;
  description: string;
  materialCode: string;
  presetDimensions: Dimensions;
  presetLabelText?: string;
  params: readonly {
    code: string;
    name: string;
    value: string;
  }[];
  visualKind:
    | "gear"
    | "enclosure"
    | "bushing"
    | "adapter"
    | "bracket"
    | "organizer"
    | "plant-tag";
}

export const TEMPLATE_SHOWCASE: readonly ParametricTemplateCard[] = [
  {
    id: "spur-gear",
    partType: "gear",
    category: "Приводы и редукторы",
    code: "TPL-GR-20",
    title: "Цилиндрическая шестерня со шпоночным пазом",
    description:
      "Эвольвентный профиль зуба α=20°, усиленная ступица и точная посадка на вал без люфта.",
    materialCode: "PA12 Nylon",
    presetDimensions: { d1: 76, d2: 20, h: 24 },
    params: [
      { code: "D", name: "Делительный Ø", value: "28–160 мм" },
      { code: "H", name: "Ширина венца", value: "10–80 мм" },
      { code: "Z", name: "Число зубьев", value: "по D" },
    ],
    visualKind: "gear",
  },
  {
    id: "rea-enclosure",
    partType: "din-box",
    category: "Приборостроение",
    code: "TPL-ENC-54",
    title: "Корпус РЭА на DIN-рейку и под печатную плату",
    description:
      "Внутренние бобышки под винты М3, вентиляционные пазы и защелка на профиль 35 мм.",
    materialCode: "PETG-CF",
    presetDimensions: { d1: 115, d2: 78, h: 44 },
    params: [
      { code: "D", name: "Габарит L×W", value: "40–220 мм" },
      { code: "H", name: "Высота бокса", value: "20–120 мм" },
      { code: "Z", name: "Сетка стоек PCB", value: "шаг 0.5 мм" },
    ],
    visualKind: "enclosure",
  },
  {
    id: "flange-bushing",
    partType: "bushing",
    category: "Узлы трения",
    code: "TPL-BSH-12",
    title: "Силовая втулка с опорным фланцем и фаской",
    description:
      "Замена бронзовых и капролоновых втулок для станков, рулевых реек и шарниров.",
    materialCode: "PA12 Nylon",
    presetDimensions: { d1: 58, d2: 32, h: 50 },
    params: [
      { code: "D", name: "Наружный Ø", value: "20–160 мм" },
      { code: "H", name: "Длина рабочей зоны", value: "15–140 мм" },
      { code: "Z", name: "Допуск канала", value: "H8 (±0.1 мм)" },
    ],
    visualKind: "bushing",
  },
  {
    id: "step-adapter",
    partType: "adapter",
    category: "Аспирация и пневматика",
    code: "TPL-ADP-08",
    title: "Конусный переходник воздуховодов и патрубков",
    description:
      "Плавный аэродинамический переход между разными диаметрами труб и пылесосов.",
    materialCode: "ABS",
    presetDimensions: { d1: 75, d2: 45, h: 68 },
    params: [
      { code: "D", name: "Диаметры D1 / D2", value: "18–200 мм" },
      { code: "H", name: "Длина муфты", value: "25–160 мм" },
      { code: "Z", name: "Толщина стенки", value: "2.0–4.5 мм" },
    ],
    visualKind: "adapter",
  },
  {
    id: "shaft-bracket",
    partType: "bracket",
    category: "Станочная оснастка",
    code: "TPL-BRK-19",
    title: "Фланцевое крепление вала и профиля",
    description:
      "Жесткий кронштейн с ребрами жесткости и потайными гнездами под крепеж М4–М6.",
    materialCode: "PETG-CF",
    presetDimensions: { d1: 68, d2: 44, h: 32 },
    params: [
      { code: "L", name: "Длина базы", value: "30–160 мм" },
      { code: "H", name: "Высота опоры", value: "20–120 мм" },
      { code: "Z", name: "Межцентровое", value: "по размеру" },
    ],
    visualKind: "bracket",
  },
  {
    id: "grid-organizer",
    partType: "organizer",
    category: "Лабораторное хранение",
    code: "TPL-ORG-42",
    title: "Модульный органайзер-ложемент под инструмент",
    description:
      "Точные ячейки с радиусным дном и маркировкой для оснастки, фрез и крепежа.",
    materialCode: "PETG",
    presetDimensions: { d1: 140, d2: 95, h: 36 },
    params: [
      { code: "L", name: "Длина лотка", value: "40–220 мм" },
      { code: "W", name: "Ширина лотка", value: "40–160 мм" },
      { code: "Z", name: "Число секций", value: "1–12 ячеек" },
    ],
    visualKind: "organizer",
  },
  {
    id: "seedling-plant-tag",
    partType: "plant-tag",
    category: "Агротехника и маркировка",
    code: "TPL-TAG-08",
    title: "Двухцветная бирка для рассады с вашей надписью",
    description:
      "Удлинённый колышек с ребром жесткости, контрастный рельефный текст и кант для двухцветной печати.",
    materialCode: "PETG",
    presetDimensions: { d1: 124, d2: 26, h: 3 },
    presetLabelText: "БАКЛАЖАН",
    params: [
      { code: "L", name: "Общая длина", value: "80–150 мм" },
      { code: "W", name: "Ширина головки", value: "22–36 мм" },
      { code: "TXT", name: "Текст рельефа", value: "до 12 симв." },
    ],
    visualKind: "plant-tag",
  },
  {
    id: "spacer-ring-card",
    partType: "spacer-ring",
    category: "Узлы трения",
    code: "TPL-SPC-09",
    title: "Дистанционная втулка-проставка без буртика",
    description:
      "Плоскопараллельная шайба и распорная втулка на вал для точной выставки осевых зазоров.",
    materialCode: "PA12 Nylon",
    presetDimensions: { d1: 45, d2: 22, h: 18 },
    params: [
      { code: "D", name: "Наружный Ø", value: "16–160 мм" },
      { code: "d", name: "Внутренний Ø", value: "6–130 мм" },
      { code: "H", name: "Толщина", value: "5–120 мм" },
    ],
    visualKind: "bushing",
  },
  {
    id: "belt-pulley-card",
    partType: "belt-pulley",
    category: "Приводы и редукторы",
    code: "TPL-PLY-11",
    title: "Шкив приводного ремня с боковыми ребордами",
    description:
      "Приводной шкив с удерживающими фланцами и точной посадкой на вал шагового или коллекторного двигателя.",
    materialCode: "PA12 Nylon",
    presetDimensions: { d1: 64, d2: 16, h: 28 },
    params: [
      { code: "D", name: "Рабочий Ø", value: "28–150 мм" },
      { code: "d", name: "Посадочный вал", value: "6–80 мм" },
      { code: "H", name: "Ширина ремня", value: "12–80 мм" },
    ],
    visualKind: "gear",
  },
  {
    id: "junction-box-card",
    partType: "junction-box",
    category: "Приборостроение",
    code: "TPL-JBX-10",
    title: "Герметичная распределительная коробка IP65",
    description:
      "Клеммный бокс с утолщенным периметром под уплотнение и боковыми монтажными фланцами.",
    materialCode: "ABS",
    presetDimensions: { d1: 120, d2: 90, h: 55 },
    params: [
      { code: "L", name: "Длина коробки", value: "50–220 мм" },
      { code: "W", name: "Ширина коробки", value: "50–180 мм" },
      { code: "H", name: "Глубина", value: "25–120 мм" },
    ],
    visualKind: "enclosure",
  },
  {
    id: "flange-nozzle-card",
    partType: "flange-nozzle",
    category: "Аспирация и пневматика",
    code: "TPL-NZL-12",
    title: "Врезной фланцевый патрубок для шланга",
    description:
      "Круглый штуцер с опорной монтажной плитой для подключения воздуховодов к кожухам станков.",
    materialCode: "ABS",
    presetDimensions: { d1: 90, d2: 50, h: 55 },
    params: [
      { code: "D1", name: "Фланец плиты", value: "45–200 мм" },
      { code: "D2", name: "Штуцер трубы", value: "20–150 мм" },
      { code: "H", name: "Вылет трубы", value: "25–140 мм" },
    ],
    visualKind: "adapter",
  },
  {
    id: "pipe-clamp-card",
    partType: "pipe-clamp",
    category: "Станочная оснастка",
    code: "TPL-CLM-13",
    title: "Опорный хомут-держатель трубы и вала",
    description:
      "Жесткая опора с полукруглым ложементом и прижимными ушами под крепеж для фиксации направляющих и магистралей.",
    materialCode: "PETG-CF",
    presetDimensions: { d1: 76, d2: 32, h: 28 },
    params: [
      { code: "L", name: "База с ушами", value: "40–160 мм" },
      { code: "d", name: "Диаметр трубы", value: "12–90 мм" },
      { code: "H", name: "Ширина прижима", value: "16–80 мм" },
    ],
    visualKind: "bracket",
  },
] as const;

export const PRODUCTION_CYCLE = [
  {
    step: "01",
    code: "STEP_01 // PARAM_INPUT",
    metric: "~30 сек",
    title: "Задал размеры",
    description:
      "Настройка параметров в браузере за 30 секунд. Двигайте ползунки D, T и H — CAD-ядро перестраивает твердотельную геометрию без участия конструктора.",
  },
  {
    step: "02",
    code: "STEP_02 // MESH_VERIFY",
    metric: "100% фикс",
    title: "Проверил 3D и цену",
    description:
      "Расчетная оценка массы, времени печати и цены без скрытых доплат. Автоматический контроль толщины стенок и замкнутости сетки перед запуском станка.",
  },
  {
    step: "03",
    code: "STEP_03 // PRINT_DISPATCH",
    metric: "24–48 ч",
    title: "Забрал готовую деталь",
    description:
      "Печать в термокамере с точностью 0.1 мм, ОТК со штангенциркулем и отправка в ближайший ПВЗ Ozon по всей России.",
  },
] as const;

export const FAQ = [
  {
    question:
      "Какой пластик выбрать, если деталь работает под нагрузкой или при высокой температуре?",
    answer:
      "Для шестерен, втулок скольжения и деталей с трением выбирайте PA12 Nylon (до 135 °C) — он обладает низким коэффициентом трения и высокой усталостной прочностью. Для жестких корпусов и кронштейнов без усадки идеален PETG-CF с углеволокном. ABS подходит для кожухов и автокомпонентов (до 105 °C), а базовый PETG — для приборных корпусов и креплений в помещении.",
  },
  {
    question: "Насколько точно соблюдаются заданные в конфигураторе размеры?",
    answer:
      "Кинематика CoreXY с калибровкой коэффициента тепловой усадки под каждую партию филамента обеспечивает точность линейных размеров ±0.1 мм (допуск ISO 2768-m). Перед упаковкой каждая деталь проходит замер цифровым штангенциркулем.",
  },
  {
    question:
      "Что происходит, если я задам слишком тонкую стенку в параметрах?",
    answer:
      "Встроенный валидатор геометрии в реальном времени проверяет минимальную толщину стенки (от 2.0 мм для конструкционных деталей) и предупреждает, если внутренний диаметр слишком близок к наружному. Система автоматически удерживает безопасный конструктивный зазор.",
  },
  {
    question: "Как быстро заказ приедет в ПВЗ Ozon?",
    answer:
      "Производство занимает от 12 до 36 часов в зависимости от объема партии. Сразу после печати и проверки ОТК заказ передается в логистику Ozon — доставка в большинство городов РФ занимает 2–4 дня от 199 ₽.",
  },
  {
    question: "Работаете ли вы с юридическими лицами и серийными партиями?",
    answer:
      "Да. При заказе от 10 одинаковых деталей автоматически применяется серийный коэффициент (−20%). Выставляем счета для ИП и ООО, передаем закрывающие документы (УПД) через ЭДО.",
  },
] as const;
