import type { MaterialId, PartTypeId } from "~/components/landing/data";

/**
 * 5-этапный конвейер производства заказа ParamLab.
 */
export type PrintStageId = "manifold" | "printing" | "qc" | "shipping" | "done";

export type PrintStageState = "completed" | "active" | "upcoming";

interface PrintStageEvent {
  stage: PrintStageId;
  title: string;
  subtitle: string;
  timestamp?: string;
  telemetry?: string;
  qcMetrics?: {
    nominalMm: string;
    measuredMm: string;
    deviationMm: string;
    inspectorCode: string;
    passed: boolean;
  };
}

export type CarrierType = "ozon" | "cdek";

interface DeliveryInfo {
  carrier: CarrierType;
  carrierLabel: string;
  trackingNumber?: string;
  pvzCode: string;
  pvzAddress: string;
  etaText: string;
  storageUntil?: string;
  barcodeCode?: string;
}

interface ParametricSpec {
  partType: PartTypeId;
  templateCode: string;
  dimensionLabel: string; // e.g., "D56 × d32 × H48"
  dimensions: {
    d1: { code: string; label: string; value: number };
    d2: { code: string; label: string; value: number };
    h: { code: string; label: string; value: number };
  };
  tolerance: string;
  layerHeightMm: number;
  infillPercent: number;
  nozzleMm: number;
}

interface OrderItemSpec {
  id: string;
  title: string;
  materialId: MaterialId;
  materialCode: string;
  materialTemp: string;
  quantity: number;
  unitMassGrams: number;
  totalMassGrams: number;
  unitPriceRub: number;
  totalPriceRub: number;
  parametricSpec: ParametricSpec;
}

type DashboardOrderCategory = "active" | "completed";

export interface DashboardOrder {
  id: string;
  orderNumber: string; // e.g., "PL-2604-891"
  createdAt: string;
  updatedAt: string;
  category: DashboardOrderCategory;
  currentStage: PrintStageId;
  /** Прогресс текущего этапа (0..100), особенно для "printing" */
  stageProgressPercent: number;
  /** Текущий слой и всего слоев для активной печати */
  layerTelemetry?: {
    currentLayer: number;
    totalLayers: number;
    chamberTempC: number;
    nozzleTempC: number;
    machineId: string;
    remainingMinutes: number;
  };
  items: OrderItemSpec[];
  subtotalRub: number;
  deliveryRub: number;
  discountPercent: number;
  totalRub: number;
  delivery: DeliveryInfo;
  stages: PrintStageEvent[];
  invoiceAvailable: boolean;
  updNumber?: string;
}

export interface SavedPartPreset {
  id: string;
  presetCode: string; // e.g., "PRS-BSH-042"
  title: string;
  notes: string;
  categoryLabel: string;
  partType: PartTypeId;
  materialId: MaterialId;
  materialCode: string;
  dimensionFormula: string; // e.g., "D42 × T4 × H30"
  dimensions: {
    d1: {
      code: string;
      label: string;
      value: number;
      min: number;
      max: number;
    };
    d2: {
      code: string;
      label: string;
      value: number;
      min: number;
      max: number;
    };
    h: { code: string; label: string; value: number; min: number; max: number };
  };
  tolerance: string;
  unitMassGrams: number;
  estimatedPrintMinutes: number;
  defaultQuantity: number;
  lastOrderedAt?: string;
  totalOrdersCount: number;
  manifoldVerified: boolean;
  minWallMm: number;
}

export interface PickupPointPreset {
  id: string;
  carrier: CarrierType;
  carrierLabel: string;
  code: string;
  city: string;
  address: string;
  schedule: string;
  isDefault: boolean;
}

export interface NotificationPreferences {
  telegramBotConnected: boolean;
  telegramHandle: string;
  onManifoldVerified: boolean;
  onPrintStarted: boolean;
  onQcPhotoReady: boolean;
  onArrivedAtPvz: boolean;
  emailDigest: boolean;
  edoAutoSend: boolean;
}

export interface CompanyRequisites {
  enabled: boolean;
  legalName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  bankName: string;
  bik: string;
  checkingAccount: string;
  edoOperator: string;
  edoId: string;
}

export interface EngineerProfileData {
  id: string;
  fullName: string;
  roleTitle: string;
  email: string;
  phone: string;
  accountCode: string;
  memberSince: string;
  serialDiscountTier: string;
  pickupPoints: PickupPointPreset[];
  notifications: NotificationPreferences;
  requisites: CompanyRequisites;
}

export interface DashboardSummaryMetrics {
  activeInProduction: number;
  printingLayersNow: string;
  savedPresetsCount: number;
  readyForPickupCount: number;
  totalPartsPrinted: number;
  averageAccuracyMm: string;
}
