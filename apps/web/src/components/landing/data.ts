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

export interface PartType {
  id: string;
  shortLabel: string;
  label: string;
  code: string;
  tolerance: string;
  /** Подписи ползунков и диапазоны размеров в Hero-конфигураторе. */
  dimensions: Record<DimensionKey, PartParameterMeta>;
}

export const PART_TYPES = [
  {
    id: "bushing",
    shortLabel: "Втулка / Фланец",
    label: "Втулка / Фланец с центрирующим буртиком",
    code: "CAD-BSH-01",
    tolerance: "ISO 2768-mK · ±0.1 мм",
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
    id: "din-box",
    shortLabel: "Корпус РЭА",
    label: "Корпус РЭА с монтажными стойками PCB",
    code: "CAD-ENC-02",
    tolerance: "IP54 · Стенка ≥ 2.0 мм",
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
    id: "gear",
    shortLabel: "Шестерня",
    label: "Прямозубая цилиндрическая шестерня",
    code: "CAD-GR-03",
    tolerance: "DIN 3962 · α = 20°",
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
    id: "adapter",
    shortLabel: "Переходник",
    label: "Ступенчатый переходник воздуховода",
    code: "CAD-ADP-04",
    tolerance: "Герметичный шов · ±0.15 мм",
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
    id: "end-cap",
    shortLabel: "Крепление / Заглушка",
    label: "Опорный фланец-заглушка в профиль",
    code: "CAD-MNT-05",
    tolerance: "Натяг +0.15 мм",
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
    shortLabel: "Кронштейн",
    label: "Угловой кронштейн с ребрами жесткости",
    code: "CAD-BRK-06",
    tolerance: "ISO 2768-mK · Отверстия H8",
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
    id: "organizer",
    shortLabel: "Органайзер",
    label: "Модульный ложемент с ячейками",
    code: "CAD-ORG-07",
    tolerance: "Ячейки ±0.2 мм · R дно",
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
] as const satisfies readonly PartType[];

export type PartTypeId = (typeof PART_TYPES)[number]["id"];

/** Три основных шаблона для быстрого переключения в Hero. */
export const HERO_PART_TYPES: readonly PartTypeId[] = [
  "bushing",
  "din-box",
  "gear",
];

export interface ParametricTemplateCard {
  id: string;
  partType: PartTypeId;
  category: string;
  code: string;
  title: string;
  description: string;
  materialCode: string;
  presetDimensions: Dimensions;
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
    | "organizer";
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
