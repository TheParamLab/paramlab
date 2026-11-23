import { useSyncExternalStore } from "react";
import {
  MATERIALS,
  type MaterialId,
  PART_TYPES,
  type PartTypeId,
} from "~/components/landing/data";
import {
  calcPrice,
  clampBore,
  estimateMass,
} from "~/components/landing/pricing";
import type {
  DashboardOrder,
  DashboardSummaryMetrics,
  EngineerProfileData,
  PrintStageId,
  SavedPartPreset,
} from "~/types/dashboard";

export const STAGE_METADATA: Record<
  PrintStageId,
  {
    stepNumber: string;
    shortTitle: string;
    fullTitle: string;
    accentColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
  }
> = {
  manifold: {
    stepNumber: "01",
    shortTitle: "Проверка (Manifold)",
    fullTitle: "CAD-валидация сетки и допусков",
    accentColor: "#00D1FF",
    badgeBg: "bg-[#00D1FF]/10",
    badgeBorder: "border-[#00D1FF]/35",
    badgeText: "text-[#00D1FF]",
  },
  printing: {
    stepNumber: "02",
    shortTitle: "В печати",
    fullTitle: "Послойная экструзия в термокамере",
    accentColor: "#FF5C1A",
    badgeBg: "bg-[#FF5C1A]/12",
    badgeBorder: "border-[#FF5C1A]/45",
    badgeText: "text-[#FF5C1A]",
  },
  qc: {
    stepNumber: "03",
    shortTitle: "ОТК и упаковка",
    fullTitle: "Контроль со штангенциркулем ±0.1 мм",
    accentColor: "#F59E0B",
    badgeBg: "bg-[#F59E0B]/12",
    badgeBorder: "border-[#F59E0B]/40",
    badgeText: "text-[#F59E0B]",
  },
  shipping: {
    stepNumber: "04",
    shortTitle: "В пути",
    fullTitle: "Логистика до выбранного ПВЗ",
    accentColor: "#10B981",
    badgeBg: "bg-[#10B981]/12",
    badgeBorder: "border-[#10B981]/40",
    badgeText: "text-[#10B981]",
  },
  done: {
    stepNumber: "05",
    shortTitle: "Готово",
    fullTitle: "В пункте выдачи / Получено",
    accentColor: "#10B981",
    badgeBg: "bg-[#10B981]/15",
    badgeBorder: "border-[#10B981]/50",
    badgeText: "text-[#10B981]",
  },
};

export const STAGE_ORDER: readonly PrintStageId[] = [
  "manifold",
  "printing",
  "qc",
  "shipping",
  "done",
];

const MOCK_ORDERS: DashboardOrder[] = [
  {
    id: "ord-891",
    orderNumber: "PL-2604-891",
    createdAt: "19 ноя 2026, 11:20",
    updatedAt: "Сегодня, 14:42",
    category: "active",
    currentStage: "printing",
    stageProgressPercent: 68,
    layerTelemetry: {
      currentLayer: 164,
      totalLayers: 240,
      chamberTempC: 65,
      nozzleTempC: 268,
      machineId: "COREXY-CELL-04",
      remainingMinutes: 42,
    },
    items: [
      {
        id: "itm-891-1",
        title: "Силовая втулка с опорным фланцем и фаской",
        materialId: "pa12",
        materialCode: "PA12 Nylon",
        materialTemp: "до 135 °C",
        quantity: 12,
        unitMassGrams: 34,
        totalMassGrams: 408,
        unitPriceRub: 870,
        totalPriceRub: 10440,
        parametricSpec: {
          partType: "bushing",
          templateCode: "CAD-BSH-01",
          dimensionLabel: "D56 × d32 × H48",
          dimensions: {
            d1: { code: "D", label: "Наружный диаметр", value: 56 },
            d2: { code: "d", label: "Внутренний канал", value: 32 },
            h: { code: "H", label: "Высота профиля", value: 48 },
          },
          tolerance: "ISO 2768-mK · ±0.1 мм",
          layerHeightMm: 0.2,
          infillPercent: 100,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: 13050,
    deliveryRub: 199,
    discountPercent: 20,
    totalRub: 10639,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: "OZON-1049827-RU",
      pvzCode: "OZN-4410",
      pvzAddress: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "Ожидается в ПВЗ 23 ноя",
    },
    invoiceAvailable: true,
    updNumber: "УПД-891/26",
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: "Сетка замкнута, стенка ≥ 12.0 мм, усадка PA12 +1.15% учтена",
        timestamp: "19 ноя, 11:21",
        telemetry: "MESH_OK // 0 NON-MANIFOLD EDGES",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "Станок COREXY-CELL-04 · Слой 164 / 240 (68%) · Сопло 268 °C",
        timestamp: "В работе · осталось ~42 мин",
        telemetry: "LAYER 164/240 · Z=32.8 мм · CHAMBER 65 °C",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Замер цифровым штангенциркулем Mitutoyo по 3 осям D / d / H",
      },
      {
        stage: "shipping",
        title: "Передача в логистику Ozon",
        subtitle: "Присвоен трек-номер OZON-1049827-RU",
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      },
    ],
  },
  {
    id: "ord-887",
    orderNumber: "PL-2604-887",
    createdAt: "18 ноя 2026, 16:05",
    updatedAt: "Сегодня, 12:15",
    category: "active",
    currentStage: "qc",
    stageProgressPercent: 100,
    items: [
      {
        id: "itm-887-1",
        title: "Корпус РЭА на DIN-рейку со стойками PCB",
        materialId: "petgcf",
        materialCode: "PETG-CF",
        materialTemp: "до 115 °C",
        quantity: 4,
        unitMassGrams: 78,
        totalMassGrams: 312,
        unitPriceRub: 2808,
        totalPriceRub: 11232,
        parametricSpec: {
          partType: "din-box",
          templateCode: "CAD-ENC-02",
          dimensionLabel: "L115 × W78 × H44",
          dimensions: {
            d1: { code: "L", label: "Длина корпуса", value: 115 },
            d2: { code: "W", label: "Ширина корпуса", value: 78 },
            h: { code: "H", label: "Высота корпуса", value: 44 },
          },
          tolerance: "IP54 · Стенка ≥ 2.4 мм",
          layerHeightMm: 0.2,
          infillPercent: 60,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: 11232,
    deliveryRub: 199,
    discountPercent: 0,
    totalRub: 11431,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: "OZON-9948271-RU",
      pvzCode: "OZN-4410",
      pvzAddress: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "Отгрузка сегодня до 18:00",
    },
    invoiceAvailable: true,
    updNumber: "УПД-887/26",
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: "Стойки М3 проверены, минимальная стенка 2.40 мм — норма",
        timestamp: "18 ноя, 16:06",
        telemetry: "WALL_CHECK: 2.40 MM PASS",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "220 / 220 слоев завершено · PETG-CF (15% углеволокно)",
        timestamp: "19 ноя, 09:40",
        telemetry: "220/220 LAYERS · 100%",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle:
          "Замер партии завершен: отклонение +0.04 мм (в допуске ±0.1 мм)",
        timestamp: "Сегодня, 12:15",
        telemetry: "QC_CALIPER_PASS // Δ +0.04 MM",
        qcMetrics: {
          nominalMm: "115.00 × 78.00 × 44.00 мм",
          measuredMm: "115.04 × 77.97 × 44.02 мм",
          deviationMm: "+0.04 / -0.03 мм",
          inspectorCode: "ОТК-ИНЖ-07 (Калибровка Mitutoyo #4412)",
          passed: true,
        },
      },
      {
        stage: "shipping",
        title: "Передача в логистику Ozon",
        subtitle: "Ожидает курьера магистральной сортировки",
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: "г. Москва, Ленинградский пр-т, д. 36",
      },
    ],
  },
  {
    id: "ord-879",
    orderNumber: "PL-2604-879",
    createdAt: "16 ноя 2026, 09:14",
    updatedAt: "Сегодня, 08:30",
    category: "active",
    currentStage: "shipping",
    stageProgressPercent: 85,
    items: [
      {
        id: "itm-879-1",
        title: "Прямозубая цилиндрическая шестерня привода",
        materialId: "pa12",
        materialCode: "PA12 Nylon",
        materialTemp: "до 135 °C",
        quantity: 6,
        unitMassGrams: 46,
        totalMassGrams: 276,
        unitPriceRub: 1472,
        totalPriceRub: 8832,
        parametricSpec: {
          partType: "gear",
          templateCode: "CAD-GR-03",
          dimensionLabel: "D72 × d20 × H24",
          dimensions: {
            d1: { code: "D", label: "Делительный диаметр", value: 72 },
            d2: { code: "d", label: "Посадочный вал", value: 20 },
            h: { code: "H", label: "Ширина венца", value: 24 },
          },
          tolerance: "DIN 3962 · α = 20° · ±0.1 мм",
          layerHeightMm: 0.16,
          infillPercent: 100,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: 8832,
    deliveryRub: 199,
    discountPercent: 0,
    totalRub: 9031,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: "OZON-1048551-RU",
      pvzCode: "OZN-4410",
      pvzAddress: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "В транзитном хабе Москва-Юг · Доставка завтра",
    },
    invoiceAvailable: true,
    updNumber: "УПД-879/26",
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: "Эвольвентный профиль Z=18, модуль m=4.0 проверен",
        timestamp: "16 ноя, 09:15",
        telemetry: "INVOLUTE_PROFILE_OK",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "150 / 150 слоев (шаг 0.16 мм) · Отжиг в сушильном шкафу 4 ч",
        timestamp: "17 ноя, 04:20",
        telemetry: "ANNEALED 85 °C · 4H",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Посадочный канал d20 H8 проверен калибром-пробкой",
        timestamp: "17 ноя, 11:05",
        qcMetrics: {
          nominalMm: "72.00 × 20.00 × 24.00 мм",
          measuredMm: "71.98 × 20.02 × 24.01 мм",
          deviationMm: "-0.02 / +0.02 мм",
          inspectorCode: "ОТК-ИНЖ-03 (Калибр-пробка 20H8)",
          passed: true,
        },
      },
      {
        stage: "shipping",
        title: "В пути до пункта выдачи Ozon",
        subtitle: "Покинуло сортировочный центр Москва-Магистральный",
        timestamp: "Сегодня, 08:30",
        telemetry: "TRACK: OZON-1048551-RU",
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      },
    ],
  },
  {
    id: "ord-894",
    orderNumber: "PL-2604-894",
    createdAt: "Сегодня, 14:10",
    updatedAt: "Сегодня, 14:11",
    category: "active",
    currentStage: "manifold",
    stageProgressPercent: 45,
    items: [
      {
        id: "itm-894-1",
        title: "Угловой кронштейн оптического датчика",
        materialId: "petgcf",
        materialCode: "PETG-CF",
        materialTemp: "до 115 °C",
        quantity: 10,
        unitMassGrams: 41,
        totalMassGrams: 410,
        unitPriceRub: 1180,
        totalPriceRub: 11800,
        parametricSpec: {
          partType: "bracket",
          templateCode: "CAD-BRK-06",
          dimensionLabel: "L68 × W44 × H52",
          dimensions: {
            d1: { code: "L", label: "Длина базы", value: 68 },
            d2: { code: "W", label: "Ширина кронштейна", value: 44 },
            h: { code: "H", label: "Высота опоры", value: 52 },
          },
          tolerance: "ISO 2768-mK · Отверстия H8",
          layerHeightMm: 0.2,
          infillPercent: 80,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: 14750,
    deliveryRub: 199,
    discountPercent: 20,
    totalRub: 11999,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: "OZON-1049910-RU",
      pvzCode: "OZN-4410",
      pvzAddress: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "Расчетная отправка 22 ноя",
    },
    invoiceAvailable: true,
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: "Генерация G-code и расчет траекторий ребер жесткости",
        timestamp: "Сегодня, 14:11",
        telemetry: "SLICING_GCODE // INFILL 80% GYROID",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "Назначен станок COREXY-CELL-02 (в очереди №1)",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Замер межцентрового расстояния крепежных пазов",
      },
      {
        stage: "shipping",
        title: "Передача в логистику Ozon",
        subtitle: "Резерв накладной OZON-1049910-RU",
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      },
    ],
  },
  {
    id: "ord-862",
    orderNumber: "PL-2603-862",
    createdAt: "10 ноя 2026, 13:40",
    updatedAt: "14 ноя 2026, 17:20",
    category: "completed",
    currentStage: "done",
    stageProgressPercent: 100,
    items: [
      {
        id: "itm-862-1",
        title: "Ступенчатый переходник аспирации станка ЧПУ",
        materialId: "abs",
        materialCode: "ABS",
        materialTemp: "до 105 °C",
        quantity: 2,
        unitMassGrams: 64,
        totalMassGrams: 128,
        unitPriceRub: 1472,
        totalPriceRub: 2944,
        parametricSpec: {
          partType: "adapter",
          templateCode: "CAD-ADP-04",
          dimensionLabel: "D1 100 × D2 63 × H85",
          dimensions: {
            d1: { code: "D1", label: "Диаметр ступени 1", value: 100 },
            d2: { code: "D2", label: "Диаметр ступени 2", value: 63 },
            h: { code: "H", label: "Общая длина", value: 85 },
          },
          tolerance: "Герметичный шов · ±0.15 мм",
          layerHeightMm: 0.2,
          infillPercent: 100,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: 2944,
    deliveryRub: 199,
    discountPercent: 0,
    totalRub: 3143,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: "OZON-8831204-RU",
      pvzCode: "OZN-4410",
      pvzAddress: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "Получен 14 ноя 2026",
      storageUntil: "Выдан по штрихкоду",
      barcodeCode: "OZN-7741-9021",
    },
    invoiceAvailable: true,
    updNumber: "УПД-862/26",
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: "Стенка 3.2 мм герметична, конусность без поддержек",
        timestamp: "10 ноя, 13:41",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "425 / 425 слоев завершено · ABS Технический",
        timestamp: "11 ноя, 06:15",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Контроль посадочных диаметров 100.0 и 63.0 мм пройден",
        timestamp: "11 ноя, 10:30",
        qcMetrics: {
          nominalMm: "100.00 × 63.00 × 85.00 мм",
          measuredMm: "100.03 × 62.98 × 85.04 мм",
          deviationMm: "+0.03 / -0.02 мм",
          inspectorCode: "ОТК-ИНЖ-07",
          passed: true,
        },
      },
      {
        stage: "shipping",
        title: "Доставлено в ПВЗ Ozon",
        subtitle: "Трек-номер OZON-8831204-RU",
        timestamp: "13 ноя, 14:10",
      },
      {
        stage: "done",
        title: "Заказ выдан клиенту",
        subtitle: "Закрывающие документы УПД-862/26 отправлены в ЭДО",
        timestamp: "14 ноя, 17:20",
      },
    ],
  },
  {
    id: "ord-841",
    orderNumber: "PL-2603-841",
    createdAt: "02 ноя 2026, 18:12",
    updatedAt: "06 ноя 2026, 15:05",
    category: "completed",
    currentStage: "done",
    stageProgressPercent: 100,
    items: [
      {
        id: "itm-841-1",
        title: "Модульный ложемент под твердосплавные фрезы",
        materialId: "petg",
        materialCode: "PETG",
        materialTemp: "до 75 °C",
        quantity: 5,
        unitMassGrams: 112,
        totalMassGrams: 560,
        unitPriceRub: 2016,
        totalPriceRub: 10080,
        parametricSpec: {
          partType: "organizer",
          templateCode: "CAD-ORG-07",
          dimensionLabel: "L180 × W120 × H38",
          dimensions: {
            d1: { code: "L", label: "Длина лотка", value: 180 },
            d2: { code: "W", label: "Ширина лотка", value: 120 },
            h: { code: "H", label: "Глубина ячейки", value: 38 },
          },
          tolerance: "Ячейки ±0.2 мм · R дно",
          layerHeightMm: 0.2,
          infillPercent: 40,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: 10080,
    deliveryRub: 199,
    discountPercent: 0,
    totalRub: 10279,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: "OZON-1046109-RU",
      pvzCode: "OZN-4410",
      pvzAddress: "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "Получен 06 ноя 2026",
    },
    invoiceAvailable: true,
    updNumber: "УПД-841/26",
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: "Сетка проверена, радиусное дно ячеек R4.0 мм",
        timestamp: "02 ноя, 18:13",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "190 / 190 слоев завершено · PETG Графит",
        timestamp: "03 ноя, 19:50",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Проверка геометрии стыков модульных лотков",
        timestamp: "04 ноя, 09:15",
      },
      {
        stage: "shipping",
        title: "Доставлено в ПВЗ Ozon",
        subtitle: "Трек-номер OZON-1046109-RU",
        timestamp: "05 ноя, 16:40",
      },
      {
        stage: "done",
        title: "Заказ выдан клиенту",
        subtitle: "Получен в ПВЗ на Ленинградском пр-те, 36",
        timestamp: "06 ноя, 15:05",
      },
    ],
  },
];

const MOCK_PART_PRESETS: SavedPartPreset[] = [
  {
    id: "prs-bsh-042",
    presetCode: "PRS-BSH-042",
    title: "Втулка направляющая вала ЧПУ (ось Z)",
    notes: "Рабочий узел подачи шпинделя, посадка с натягом H7/k6",
    categoryLabel: "Узлы трения",
    partType: "bushing",
    materialId: "pa12",
    materialCode: "PA12 Nylon",
    dimensionFormula: "D56 × d32 × H48",
    dimensions: {
      d1: { code: "D", label: "Наружный Ø D", value: 56, min: 20, max: 160 },
      d2: {
        code: "d",
        label: "Внутренний канал d",
        value: 32,
        min: 8,
        max: 140,
      },
      h: { code: "H", label: "Высота профиля H", value: 48, min: 15, max: 140 },
    },
    tolerance: "ISO 2768-mK · ±0.1 мм",
    unitMassGrams: 34,
    estimatedPrintMinutes: 55,
    defaultQuantity: 12,
    lastOrderedAt: "19 ноя 2026",
    totalOrdersCount: 4,
    manifoldVerified: true,
    minWallMm: 12.0,
  },
  {
    id: "prs-enc-115",
    presetCode: "PRS-ENC-115",
    title: "Корпус контроллера RS-485 на DIN-рейку",
    notes: "Под печатную плату 105×68 мм, 4 стойки М3, защелка 35 мм",
    categoryLabel: "Приборостроение",
    partType: "din-box",
    materialId: "petgcf",
    materialCode: "PETG-CF",
    dimensionFormula: "L115 × W78 × H44",
    dimensions: {
      d1: {
        code: "L",
        label: "Длина корпуса L",
        value: 115,
        min: 40,
        max: 220,
      },
      d2: {
        code: "W",
        label: "Ширина корпуса W",
        value: 78,
        min: 30,
        max: 180,
      },
      h: { code: "H", label: "Высота корпуса H", value: 44, min: 20, max: 120 },
    },
    tolerance: "IP54 · Стенка ≥ 2.4 мм",
    unitMassGrams: 78,
    estimatedPrintMinutes: 110,
    defaultQuantity: 4,
    lastOrderedAt: "18 ноя 2026",
    totalOrdersCount: 7,
    manifoldVerified: true,
    minWallMm: 2.4,
  },
  {
    id: "prs-gr-072",
    presetCode: "PRS-GR-072",
    title: "Ведомая шестерня ленточного конвейера",
    notes: "Эвольвентный профиль α=20°, шпоночный паз 6 мм, отжиг 85 °C",
    categoryLabel: "Приводы и редукторы",
    partType: "gear",
    materialId: "pa12",
    materialCode: "PA12 Nylon",
    dimensionFormula: "D72 × d20 × H24",
    dimensions: {
      d1: { code: "D", label: "Делительный Ø D", value: 72, min: 28, max: 160 },
      d2: { code: "d", label: "Посадочный вал d", value: 20, min: 6, max: 90 },
      h: { code: "H", label: "Ширина венца H", value: 24, min: 10, max: 80 },
    },
    tolerance: "DIN 3962 · α = 20°",
    unitMassGrams: 46,
    estimatedPrintMinutes: 75,
    defaultQuantity: 6,
    lastOrderedAt: "16 ноя 2026",
    totalOrdersCount: 3,
    manifoldVerified: true,
    minWallMm: 4.5,
  },
  {
    id: "prs-brk-068",
    presetCode: "PRS-BRK-068",
    title: "Угловой кронштейн оптического энкодера",
    notes: "Усиленные косынки 45°, отверстия под винт М5 с потаем",
    categoryLabel: "Станочная оснастка",
    partType: "bracket",
    materialId: "petgcf",
    materialCode: "PETG-CF",
    dimensionFormula: "L68 × W44 × H52",
    dimensions: {
      d1: { code: "L", label: "Длина базы L", value: 68, min: 30, max: 160 },
      d2: { code: "W", label: "Ширина опоры W", value: 44, min: 20, max: 120 },
      h: { code: "H", label: "Высота полки H", value: 52, min: 20, max: 120 },
    },
    tolerance: "ISO 2768-mK · Отверстия H8",
    unitMassGrams: 41,
    estimatedPrintMinutes: 65,
    defaultQuantity: 10,
    lastOrderedAt: "Сегодня",
    totalOrdersCount: 5,
    manifoldVerified: true,
    minWallMm: 3.8,
  },
  {
    id: "prs-adp-100",
    presetCode: "PRS-ADP-100",
    title: "Переходник аспирационного рукава 100→63 мм",
    notes: "Гладкий внутренний конус без завихрений потока, буртик под хомут",
    categoryLabel: "Аспирация и пневматика",
    partType: "adapter",
    materialId: "abs",
    materialCode: "ABS",
    dimensionFormula: "D1 100 × D2 63 × H85",
    dimensions: {
      d1: {
        code: "D1",
        label: "Диаметр ступени D1",
        value: 100,
        min: 25,
        max: 200,
      },
      d2: {
        code: "D2",
        label: "Диаметр ступени D2",
        value: 63,
        min: 18,
        max: 160,
      },
      h: { code: "H", label: "Общая длина H", value: 85, min: 25, max: 160 },
    },
    tolerance: "Герметичный шов · ±0.15 мм",
    unitMassGrams: 64,
    estimatedPrintMinutes: 95,
    defaultQuantity: 2,
    lastOrderedAt: "10 ноя 2026",
    totalOrdersCount: 2,
    manifoldVerified: true,
    minWallMm: 2.8,
  },
  {
    id: "prs-org-180",
    presetCode: "PRS-ORG-180",
    title: "Инструментальный ложемент под фрезы Ø6–12 мм",
    notes: "Ячейки с радиусным дном и площадкой под лазерную маркировку",
    categoryLabel: "Лабораторное хранение",
    partType: "organizer",
    materialId: "petg",
    materialCode: "PETG",
    dimensionFormula: "L180 × W120 × H38",
    dimensions: {
      d1: { code: "L", label: "Длина лотка L", value: 180, min: 40, max: 220 },
      d2: { code: "W", label: "Ширина лотка W", value: 120, min: 40, max: 160 },
      h: { code: "H", label: "Глубина ячейки H", value: 38, min: 15, max: 90 },
    },
    tolerance: "Ячейки ±0.2 мм · R дно",
    unitMassGrams: 112,
    estimatedPrintMinutes: 145,
    defaultQuantity: 5,
    lastOrderedAt: "02 ноя 2026",
    totalOrdersCount: 2,
    manifoldVerified: true,
    minWallMm: 3.0,
  },
];

export const MOCK_ENGINEER_PROFILE: EngineerProfileData = {
  id: "usr-eng-409",
  fullName: "Алексей Соколов",
  roleTitle: "Ведущий инженер-конструктор АСУ ТП",
  email: "a.sokolov@kb-mechatronica.ru",
  phone: "+7 (926) 418-72-09",
  accountCode: "ENG-ID // PL-00409",
  memberSince: "Март 2025",
  serialDiscountTier: "Серийный профиль (−20% от 10 шт. + приоритет слота)",
  pickupPoints: [
    {
      id: "pvz-ozon-118",
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      code: "OZN-118",
      city: "Москва",
      address: "ул. Бауманская, д. 43/1 (5 мин от КБ)",
      schedule: "Ежедневно 09:00–21:00",
      isDefault: true,
    },
    {
      id: "pvz-ozon-4410",
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      code: "OZN-4410",
      city: "Москва",
      address: "Ленинградский пр-т, д. 36, стр. 11",
      schedule: "Ежедневно 09:00–22:00",
      isDefault: false,
    },
    {
      id: "pvz-ozon-spb",
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      code: "OZN-042",
      city: "Санкт-Петербург",
      address:
        "Кондратьевский пр-т, д. 15, корп. 3 (Производственная площадка №2)",
      schedule: "Пн–Сб 10:00–20:00",
      isDefault: false,
    },
  ],
  notifications: {
    telegramBotConnected: true,
    telegramHandle: "@sokolov_cad",
    onManifoldVerified: true,
    onPrintStarted: true,
    onQcPhotoReady: true,
    onArrivedAtPvz: true,
    emailDigest: false,
    edoAutoSend: true,
  },
  requisites: {
    enabled: true,
    legalName: "ООО «КБ Мехатроника и Привод»",
    inn: "7701948210",
    kpp: "770101001",
    ogrn: "1187746910284",
    legalAddress: "105005, г. Москва, ул. Бауманская, д. 43/1, оф. 308",
    bankName: "АО «ТБанк» г. Москва",
    bik: "044525974",
    checkingAccount: "40702810810000749102",
    edoOperator: "Контур.Диадок",
    edoId: "2BM-7701948210-770101001-202104150912441928371",
  },
};

export const MOCK_SUMMARY_METRICS: DashboardSummaryMetrics = {
  activeInProduction: 4,
  printingLayersNow: "164 / 240",
  savedPresetsCount: 6,
  readyForPickupCount: 1,
  totalPartsPrinted: 184,
  averageAccuracyMm: "±0.04 мм",
};

/**
 * Слой данных (Data Access Layer) — чистые функции для получения и пересчета
 * спецификаций пресетов и заказов. Готово к замене на oRPC / tRPC процедуры.
 */
export function calculateMinWallMm(
  partType: PartTypeId,
  dims: { d1: number; d2: number; h: number },
): number {
  if (partType === "bushing" || partType === "gear") {
    return Number(((dims.d1 - dims.d2) / 2).toFixed(1));
  }
  if (partType === "adapter") {
    return 2.8;
  }
  if (partType === "plant-tag") {
    return 2.4;
  }
  const wall = Math.max(2.4, Math.min(6, Math.min(dims.d1, dims.d2) * 0.06));
  return Number(wall.toFixed(1));
}

export function isManifoldWallValid(
  partType: PartTypeId,
  dims: { d1: number; d2: number; h: number },
): boolean {
  const minWall = calculateMinWallMm(partType, dims);
  if (partType === "bushing" || partType === "gear") {
    return dims.d2 <= clampBore(dims.d1, dims.d2) && minWall >= 2.0;
  }
  return minWall >= 2.0;
}

export function normalizePartDimensions(
  partType: PartTypeId,
  dims: { d1: number; d2: number; h: number },
): { d1: number; d2: number; h: number } {
  const partMeta = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const d1 = Math.max(
    partMeta.dimensions.d1.min,
    Math.min(partMeta.dimensions.d1.max, Math.round(dims.d1)),
  );
  const rawD2 = Math.max(
    partMeta.dimensions.d2.min,
    Math.min(partMeta.dimensions.d2.max, Math.round(dims.d2)),
  );
  const d2 =
    partType === "bushing" || partType === "gear"
      ? Math.max(partMeta.dimensions.d2.min, clampBore(d1, rawD2))
      : rawD2;
  const h = Math.max(
    partMeta.dimensions.h.min,
    Math.min(partMeta.dimensions.h.max, Math.round(dims.h)),
  );
  return { d1, d2, h };
}

export function calculatePresetPricing(
  preset: SavedPartPreset,
  materialId: MaterialId,
  quantity: number,
  customDims?: { d1: number; d2: number; h: number },
) {
  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];
  const safeQuantity = Math.max(1, Math.min(500, Math.round(quantity) || 1));
  const dims = customDims ?? {
    d1: preset.dimensions.d1.value,
    d2: preset.dimensions.d2.value,
    h: preset.dimensions.h.value,
  };
  const unitMassGrams = estimateMass(preset.partType, dims, material.density);
  const price = calcPrice({
    massGrams: unitMassGrams,
    rate: material.rate,
    quantity: safeQuantity,
    extras: 0,
  });

  return {
    material,
    unitMassGrams,
    totalMassGrams: price.totalMass,
    unitPriceRub: price.perPiece,
    totalPriceRub: price.total,
    discountApplied: price.series,
    printHours: price.printHours,
  };
}

export function formatDimensionFormula(
  partType: SavedPartPreset["partType"],
  dims: { d1: number; d2: number; h: number },
): string {
  if (partType === "bushing" || partType === "gear") {
    return `D${dims.d1} × d${dims.d2} × H${dims.h}`;
  }
  if (partType === "adapter") {
    return `D1 ${dims.d1} × D2 ${dims.d2} × H${dims.h}`;
  }
  return `L${dims.d1} × W${dims.d2} × H${dims.h}`;
}

/**
 * Единое клиентское хранилище mock-заказов и пресетов, чтобы действия
 * на странице /parts (отправка пресета в печать) сразу отображались на /orders.
 */
let ordersState: DashboardOrder[] = MOCK_ORDERS;
let presetsState: SavedPartPreset[] = MOCK_PART_PRESETS;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDashboardOrders() {
  return useSyncExternalStore(
    subscribe,
    () => ordersState,
    () => MOCK_ORDERS,
  );
}

export function useDashboardPresets() {
  return useSyncExternalStore(
    subscribe,
    () => presetsState,
    () => MOCK_PART_PRESETS,
  );
}

export function setDashboardPresets(
  updater: (prev: SavedPartPreset[]) => SavedPartPreset[],
) {
  presetsState = updater(presetsState);
  emitChange();
}

/**
 * Сбрасывает клиентское демо-хранилище к исходным данным. Вызывается при
 * выходе из аккаунта, чтобы введённые одним человеком названия деталей и
 * заметки не достались следующему пользователю этого же браузера.
 */
export function resetDashboardStore() {
  ordersState = MOCK_ORDERS;
  presetsState = MOCK_PART_PRESETS;
  emitChange();
}

export function repeatDashboardOrder(source: DashboardOrder): DashboardOrder {
  const nextNumber = `PL-2604-${900 + ordersState.length}`;
  const repeatedOrder: DashboardOrder = {
    id: `ord-rep-${ordersState.length + 1}`,
    orderNumber: nextNumber,
    createdAt: "Только что",
    updatedAt: "Только что",
    category: "active",
    currentStage: "manifold",
    stageProgressPercent: 35,
    layerTelemetry: undefined,
    items: source.items.map((item, idx) => ({
      ...item,
      id: `${item.id}-rep-${ordersState.length + 1}-${idx}`,
    })),
    subtotalRub: source.subtotalRub,
    deliveryRub: source.deliveryRub,
    discountPercent: source.discountPercent,
    totalRub: source.totalRub,
    delivery: {
      carrier: source.delivery.carrier,
      carrierLabel: source.delivery.carrierLabel,
      trackingNumber: undefined,
      pvzCode: source.delivery.pvzCode,
      pvzAddress: source.delivery.pvzAddress,
      etaText: "Ожидает присвоения трек-номера после ОТК",
      storageUntil: undefined,
      barcodeCode: undefined,
    },
    invoiceAvailable: true,
    updNumber: undefined,
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: `Повторный запуск по паспорту ${source.orderNumber} · Геометрия подтверждена`,
        timestamp: "Только что",
        telemetry: "PRESET_CLONE // MANIFOLD_PASS",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "Резервирование слота в ячейке CoreXY",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Замер со штангенциркулем ±0.1 мм",
      },
      {
        stage: "shipping",
        title: `Передача в логистику (${source.delivery.carrierLabel})`,
        subtitle: source.delivery.pvzAddress,
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: source.delivery.pvzAddress,
      },
    ],
  };

  ordersState = [repeatedOrder, ...ordersState];
  emitChange();
  return repeatedOrder;
}

export function createOrderFromPreset(
  preset: SavedPartPreset,
  payload: {
    materialId: MaterialId;
    quantity: number;
    dimensions: { d1: number; d2: number; h: number };
  },
): DashboardOrder {
  const partMeta =
    PART_TYPES.find((pt) => pt.id === preset.partType) ?? PART_TYPES[0];
  const pricing = calculatePresetPricing(
    preset,
    payload.materialId,
    payload.quantity,
    payload.dimensions,
  );
  const formula = formatDimensionFormula(preset.partType, payload.dimensions);
  const nextNumber = `PL-2604-${900 + ordersState.length}`;
  const defaultPvz =
    MOCK_ENGINEER_PROFILE.pickupPoints.find((p) => p.isDefault) ??
    MOCK_ENGINEER_PROFILE.pickupPoints[0];
  const deliveryRub = 199;

  const newOrder: DashboardOrder = {
    id: `ord-prs-${ordersState.length + 1}`,
    orderNumber: nextNumber,
    createdAt: "Только что",
    updatedAt: "Только что",
    category: "active",
    currentStage: "manifold",
    stageProgressPercent: 40,
    items: [
      {
        id: `itm-prs-${ordersState.length + 1}`,
        title: preset.title,
        materialId: pricing.material.id as MaterialId,
        materialCode: pricing.material.code,
        materialTemp: pricing.material.temp,
        quantity: payload.quantity,
        unitMassGrams: pricing.unitMassGrams,
        totalMassGrams: pricing.totalMassGrams,
        unitPriceRub: pricing.unitPriceRub,
        totalPriceRub: pricing.totalPriceRub,
        parametricSpec: {
          partType: preset.partType,
          templateCode: partMeta.code,
          dimensionLabel: formula,
          dimensions: {
            d1: {
              code: preset.dimensions.d1.code,
              label: preset.dimensions.d1.label,
              value: payload.dimensions.d1,
            },
            d2: {
              code: preset.dimensions.d2.code,
              label: preset.dimensions.d2.label,
              value: payload.dimensions.d2,
            },
            h: {
              code: preset.dimensions.h.code,
              label: preset.dimensions.h.label,
              value: payload.dimensions.h,
            },
          },
          tolerance: preset.tolerance,
          layerHeightMm: 0.2,
          infillPercent: 100,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: pricing.totalPriceRub,
    deliveryRub,
    discountPercent: 0,
    totalRub: pricing.totalPriceRub + deliveryRub,
    delivery: {
      carrier: defaultPvz?.carrier ?? "ozon",
      carrierLabel: defaultPvz?.carrierLabel ?? "Ozon Посылка",
      trackingNumber: undefined,
      pvzCode: defaultPvz?.code ?? "OZN-4410",
      pvzAddress: defaultPvz
        ? `г. ${defaultPvz.city}, ${defaultPvz.address}`
        : "г. Москва, Ленинградский пр-т, д. 36, стр. 11",
      etaText: "Ожидает присвоения трек-номера после ОТК",
    },
    invoiceAvailable: true,
    updNumber: undefined,
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: `Запуск из пресета ${preset.presetCode} (${formula}) · Сетка подтверждена`,
        timestamp: "Только что",
        telemetry: "PRESET_DISPATCH // MANIFOLD_OK",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "Резервирование слота в ячейке CoreXY",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Замер со штангенциркулем ±0.1 мм",
      },
      {
        stage: "shipping",
        title: `Передача в логистику (${defaultPvz?.carrierLabel ?? "Ozon Посылка"})`,
        subtitle: defaultPvz?.address ?? "ПВЗ по умолчанию",
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: defaultPvz?.address ?? "ПВЗ по умолчанию",
      },
    ],
  };

  ordersState = [newOrder, ...ordersState];
  presetsState = presetsState.map((p) =>
    p.id === preset.id
      ? {
          ...p,
          totalOrdersCount: p.totalOrdersCount + 1,
          lastOrderedAt: "Только что",
        }
      : p,
  );
  emitChange();
  return newOrder;
}

function draftOrdersKey(userId: string): string {
  return `paramlab_dashboard_draft_orders:${userId}`;
}

function readDraftOrders(userId: string): DashboardOrder[] {
  const raw = window.localStorage.getItem(draftOrdersKey(userId));
  if (raw === null) return [];
  const orders: unknown = JSON.parse(raw);
  if (!Array.isArray(orders)) throw new Error("Invalid saved orders");
  return orders;
}

export function restoreDashboardDraftOrders(userId: string) {
  try {
    const saved = readDraftOrders(userId);
    const existingIds = new Set(ordersState.map((order) => order.id));
    ordersState = [
      ...saved.filter((order) => !existingIds.has(order.id)),
      ...ordersState,
    ];
    emitChange();
  } catch {
    // Ignore unavailable storage on read. Checkout will report write failures.
  }
}

export function createOrderFromDraft(
  userId: string,
  draft: {
    partType: PartTypeId;
    templateCode: string;
    templateLabel: string;
    materialId: MaterialId;
    materialCode: string;
    materialTemp: string;
    dimensions: { d1: number; d2: number; h: number };
    dimensionFormula: string;
    quantity: number;
    unitMassGrams: number;
    totalMassGrams: number;
    totalPriceRub: number;
    deliveryRub: number;
  },
  pvz: {
    code: string;
    city: string;
    address: string;
  },
): DashboardOrder {
  const partMeta =
    PART_TYPES.find((pt) => pt.id === draft.partType) ?? PART_TYPES[0];
  const saved = readDraftOrders(userId);
  const id = crypto.randomUUID();
  const nextNumber = `PL-2604-${id.slice(0, 8).toUpperCase()}`;
  const unitPriceRub = Math.max(
    1,
    Math.round(draft.totalPriceRub / Math.max(1, draft.quantity)),
  );

  const newOrder: DashboardOrder = {
    id: `ord-drf-${id}`,
    orderNumber: nextNumber,
    createdAt: "Только что",
    updatedAt: "Только что",
    category: "active",
    currentStage: "manifold",
    stageProgressPercent: 45,
    items: [
      {
        id: `itm-drf-${id}`,
        title: draft.templateLabel,
        materialId: draft.materialId,
        materialCode: draft.materialCode,
        materialTemp: draft.materialTemp,
        quantity: draft.quantity,
        unitMassGrams: draft.unitMassGrams,
        totalMassGrams: draft.totalMassGrams,
        unitPriceRub,
        totalPriceRub: draft.totalPriceRub,
        parametricSpec: {
          partType: draft.partType,
          templateCode: draft.templateCode,
          dimensionLabel: draft.dimensionFormula,
          dimensions: {
            d1: {
              code: partMeta.dimensions.d1.code,
              label: partMeta.dimensions.d1.label,
              value: draft.dimensions.d1,
            },
            d2: {
              code: partMeta.dimensions.d2.code,
              label: partMeta.dimensions.d2.label,
              value: draft.dimensions.d2,
            },
            h: {
              code: partMeta.dimensions.h.code,
              label: partMeta.dimensions.h.label,
              value: draft.dimensions.h,
            },
          },
          tolerance: partMeta.tolerance,
          layerHeightMm: 0.2,
          infillPercent: 100,
          nozzleMm: 0.4,
        },
      },
    ],
    subtotalRub: draft.totalPriceRub,
    deliveryRub: draft.deliveryRub,
    discountPercent: 0,
    totalRub: draft.totalPriceRub + draft.deliveryRub,
    delivery: {
      carrier: "ozon",
      carrierLabel: "Ozon Посылка",
      trackingNumber: undefined,
      pvzCode: pvz.code,
      pvzAddress: `г. ${pvz.city}, ${pvz.address}`,
      etaText: "Ожидает присвоения трек-номера после ОТК",
    },
    invoiceAvailable: true,
    updNumber: undefined,
    stages: [
      {
        stage: "manifold",
        title: "Проверка геометрии (Manifold)",
        subtitle: `Черновик из конфигуратора (${draft.dimensionFormula}) · Сетка подтверждена`,
        timestamp: "Только что",
        telemetry: "CONFIGURATOR_DRAFT // MANIFOLD_OK",
      },
      {
        stage: "printing",
        title: "Печать партии в термокамере",
        subtitle: "Резервирование слота в ячейке CoreXY",
      },
      {
        stage: "qc",
        title: "Инструментальный ОТК и упаковка",
        subtitle: "Замер со штангенциркулем ±0.1 мм",
      },
      {
        stage: "shipping",
        title: "Передача в логистику (Ozon Посылка)",
        subtitle: `г. ${pvz.city}, ${pvz.address}`,
      },
      {
        stage: "done",
        title: "Готово к выдаче в ПВЗ",
        subtitle: `г. ${pvz.city}, ${pvz.address}`,
      },
    ],
  };

  window.localStorage.setItem(
    draftOrdersKey(userId),
    JSON.stringify([newOrder, ...saved]),
  );
  ordersState = [newOrder, ...ordersState];
  emitChange();
  return newOrder;
}

export function triggerTextDocumentDownload(
  filename: string,
  lines: string[],
): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const content = lines.join("\n");
  const blob = new Blob([content], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
