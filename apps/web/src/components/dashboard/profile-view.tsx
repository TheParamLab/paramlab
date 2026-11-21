"use client";

import { cn, Switch, toast } from "@paramlab/ui";
import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
  MOCK_ENGINEER_PROFILE,
  triggerTextDocumentDownload,
} from "~/lib/mock-dashboard";
import type {
  CarrierType,
  CompanyRequisites,
  EngineerProfileData,
  NotificationPreferences,
  PickupPointPreset,
} from "~/types/dashboard";
import { CopyableChip } from "./copyable-chip";

const contactsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Укажите имя и фамилию получателя (минимум 2 символа)"),
  roleTitle: z.string().trim().min(2, "Укажите должность или подразделение"),
  email: z.string().trim().email("Укажите корректный рабочий E-mail"),
  phone: z
    .string()
    .trim()
    .min(10, "Укажите контактный телефон (не менее 10 символов)"),
});

const pvzSchema = z.object({
  carrier: z.enum(["cdek", "ozon"]),
  city: z.string().trim().min(2, "Укажите город пункта выдачи"),
  address: z.string().trim().min(5, "Укажите улицу, дом и номер пункта выдачи"),
});

const requisitesSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(3, "Укажите полное наименование организации (ООО / ИП)"),
  inn: z
    .string()
    .trim()
    .regex(/^\d{10}(\d{2})?$/, "ИНН должен содержать 10 или 12 цифр"),
  kpp: z
    .string()
    .trim()
    .regex(/^(\d{9})?$/, "КПП должен содержать 9 цифр"),
  bik: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "БИК банка должен содержать 9 цифр"),
  checkingAccount: z
    .string()
    .trim()
    .regex(/^\d{20}$/, "Расчетный счет должен содержать 20 цифр"),
  edoOperator: z.string().trim().min(2, "Укажите оператора ЭДО"),
});

export function ProfileView() {
  const [profile, setProfile] = useState<EngineerProfileData>(
    MOCK_ENGINEER_PROFILE,
  );
  const [fullName, setFullName] = useState(profile.fullName);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [contactError, setContactError] = useState<string | null>(null);

  const [pickupPoints, setPickupPoints] = useState<PickupPointPreset[]>(
    profile.pickupPoints,
  );
  const [isAddingPvz, setIsAddingPvz] = useState(false);
  const [newPvzCarrier, setNewPvzCarrier] = useState<CarrierType>("cdek");
  const [newPvzCity, setNewPvzCity] = useState("Москва");
  const [newPvzAddress, setNewPvzAddress] = useState("");
  const [pvzError, setPvzError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationPreferences>(
    profile.notifications,
  );
  const [requisites, setRequisites] = useState<CompanyRequisites>(
    profile.requisites,
  );
  const [requisitesError, setRequisitesError] = useState<string | null>(null);

  function handleSaveContacts(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContactError(null);
    const parsed = contactsSchema.safeParse({
      fullName,
      roleTitle,
      email,
      phone,
    });
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Проверьте контактные данные";
      setContactError(msg);
      toast.error(msg);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      fullName: parsed.data.fullName,
      roleTitle: parsed.data.roleTitle,
      phone: parsed.data.phone,
      email: parsed.data.email,
    }));
    toast.success("Контактные данные инженера сохранены");
  }

  function handleSelectDefaultPvz(pvzId: string) {
    setPickupPoints((prev) =>
      prev.map((item) => ({
        ...item,
        isDefault: item.id === pvzId,
      })),
    );
    const chosen = pickupPoints.find((p) => p.id === pvzId);
    if (chosen) {
      toast.success(
        `Пункт выдачи ${chosen.code} (${chosen.carrierLabel}) назначен основным`,
      );
    }
  }

  function handleAddPvz(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPvzError(null);
    const cityValue = newPvzCity.trim() || "Москва";
    const parsed = pvzSchema.safeParse({
      carrier: newPvzCarrier,
      city: cityValue,
      address: newPvzAddress,
    });
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Проверьте адрес пункта выдачи";
      setPvzError(msg);
      toast.error(msg);
      return;
    }

    const codePrefix = parsed.data.carrier === "cdek" ? "MSK" : "OZN";
    const randomCode = `${codePrefix}-${200 + pickupPoints.length * 19}`;
    const created: PickupPointPreset = {
      id: `pvz-${Date.now()}`,
      carrier: parsed.data.carrier,
      carrierLabel:
        parsed.data.carrier === "cdek" ? "СДЭК Экспресс" : "Ozon Посылка",
      code: randomCode,
      city: parsed.data.city,
      address: parsed.data.address,
      schedule: "Ежедневно 09:00–21:00",
      isDefault: true,
    };

    setPickupPoints((prev) => [
      created,
      ...prev.map((p) => ({ ...p, isDefault: false })),
    ]);
    setNewPvzAddress("");
    setIsAddingPvz(false);
    toast.success(`Добавлен новый ПВЗ ${randomCode}`);
  }

  function toggleNotification(key: keyof NotificationPreferences) {
    setNotifications((prev) => {
      const nextValue = !prev[key];
      return {
        ...prev,
        [key]: nextValue,
      };
    });
    toast.success("Настройки телеметрии и уведомлений обновлены");
  }

  function handleSaveRequisites(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRequisitesError(null);
    const parsed = requisitesSchema.safeParse({
      legalName: requisites.legalName,
      inn: requisites.inn,
      kpp: requisites.kpp,
      bik: requisites.bik,
      checkingAccount: requisites.checkingAccount,
      edoOperator: requisites.edoOperator,
    });
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ??
        "Проверьте реквизиты юридического лица";
      setRequisitesError(msg);
      toast.error(msg);
      return;
    }

    setRequisites((prev) => ({
      ...prev,
      ...parsed.data,
    }));
    toast.success(
      `Реквизиты ${parsed.data.legalName} (ИНН ${parsed.data.inn}) сохранены для автовыставления счетов и УПД`,
    );
  }

  function handleDownloadContractPdf() {
    const filename = `ParamLab_Contract_${requisites.inn || "Requisites"}.pdf`;
    const ok = triggerTextDocumentDownload(filename, [
      "PARAMLAB // КАРТОЧКА РЕКВИЗИТОВ И ТИПОВОЙ ДОГОВОР ПОСТАВКИ",
      `Заказчик: ${requisites.legalName}`,
      `ИНН / КПП: ${requisites.inn} / ${requisites.kpp}`,
      `Банк: ${requisites.bankName} (БИК ${requisites.bik})`,
      `Р/С: ${requisites.checkingAccount}`,
      `Оператор ЭДО: ${requisites.edoOperator} (${requisites.edoId})`,
      `Контактное лицо: ${profile.fullName} (${profile.email})`,
    ]);
    if (ok) {
      toast.success(
        `Карточка реквизитов и типовой договор поставки скачаны (${filename})`,
      );
    } else {
      toast.error("Не удалось сформировать файл договора для скачивания");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Верхняя карточка паспорта аккаунта */}
      <section className="flex flex-col justify-between gap-4 rounded-[16px] border border-[#262B36] bg-[#161920] p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#00D1FF]/50 bg-[#0E1014] font-mono text-lg font-bold text-[#00D1FF]">
            АС
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyableChip
                value={profile.accountCode}
                tooltipText="Скопировать ID инженера"
              />
              <span className="inline-flex items-center gap-1 rounded-md border border-[#10B981]/40 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#10B981]">
                <ShieldCheck className="size-3.5" />
                Верифицированный заказчик
              </span>
            </div>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-[#F2F4F7]">
              {profile.fullName}
            </h1>
            <p className="text-xs text-[#8A93A2]">
              {profile.roleTitle} · Тариф:{" "}
              <span className="font-mono text-[#F2F4F7]">
                {profile.serialDiscountTier}
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. ЛИЧНЫЕ ДАННЫЕ ИНЖЕНЕРА */}
        <section className="rounded-[16px] border border-[#262B36] bg-[#161920] p-5">
          <div className="flex items-center justify-between border-b border-[#262B36] pb-3.5">
            <div className="flex items-center gap-2">
              <User className="size-4 text-[#00D1FF]" />
              <h2 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                {"01 // Профиль инженера-заказчика"}
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#8A93A2]">
              С нами с {profile.memberSince}
            </span>
          </div>

          <form onSubmit={handleSaveContacts} className="mt-4 space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block font-mono text-xs text-[#8A93A2]"
                >
                  Имя и фамилия получателя
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setContactError(null);
                    setFullName(e.target.value);
                  }}
                  className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 text-sm text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-role"
                  className="block font-mono text-xs text-[#8A93A2]"
                >
                  Должность / подразделение
                </label>
                <input
                  id="profile-role"
                  type="text"
                  value={roleTitle}
                  onChange={(e) => {
                    setContactError(null);
                    setRoleTitle(e.target.value);
                  }}
                  className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 text-sm text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-email"
                  className="block font-mono text-xs text-[#8A93A2]"
                >
                  Рабочий E-mail (счета и акты ОТК)
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setContactError(null);
                    setEmail(e.target.value);
                  }}
                  className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="block font-mono text-xs text-[#8A93A2]"
                >
                  Телефон для СМС-кодов ПВЗ
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setContactError(null);
                    setPhone(e.target.value);
                  }}
                  className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs text-[#F2F4F7] tabular-nums focus:border-[#00D1FF] focus:outline-none"
                />
              </div>
            </div>

            {contactError && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-xs text-red-400"
              >
                {contactError}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#00D1FF]/50 bg-[#00D1FF]/15 px-4 font-mono text-xs font-semibold text-[#00D1FF] transition-colors hover:bg-[#00D1FF] hover:text-[#0E1014]"
              >
                <Save className="size-3.5" />
                Сохранить профиль
              </button>
            </div>
          </form>
        </section>

        {/* 2. УВЕДОМЛЕНИЯ О КОНВЕЙЕРЕ ПЕЧАТИ */}
        <section className="rounded-[16px] border border-[#262B36] bg-[#161920] p-5">
          <div className="flex items-center justify-between border-b border-[#262B36] pb-3.5">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-[#FF5C1A]" />
              <h2 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                {"02 // Телеметрия и уведомления этапов"}
              </h2>
            </div>
            <span className="rounded border border-[#10B981]/40 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[11px] text-[#10B981]">
              TG: {notifications.telegramHandle}
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#262B36]">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[#F2F4F7]">
                  Проверка геометрии (Manifold) и G-code
                </p>
                <p className="text-xs text-[#8A93A2]">
                  Мгновенный отчет об отсутствии самопересечений и толщине
                  стенок
                </p>
              </div>
              <Switch
                aria-label="Уведомления о проверке Manifold"
                checked={notifications.onManifoldVerified}
                onCheckedChange={() => toggleNotification("onManifoldVerified")}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[#F2F4F7]">
                  Старт печати и телеметрия станка CoreXY
                </p>
                <p className="text-xs text-[#8A93A2]">
                  Уведомление о назначении ячейки и прогрессе слоев
                </p>
              </div>
              <Switch
                aria-label="Уведомления о старте печати"
                checked={notifications.onPrintStarted}
                onCheckedChange={() => toggleNotification("onPrintStarted")}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[#F2F4F7]">
                  Фотопротокол ОТК со штангенциркулем
                </p>
                <p className="text-xs text-[#8A93A2]">
                  Отправка фактических замеров D × T × H перед упаковкой
                </p>
              </div>
              <Switch
                aria-label="Фотопротокол ОТК со штангенциркулем"
                checked={notifications.onQcPhotoReady}
                onCheckedChange={() => toggleNotification("onQcPhotoReady")}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[#F2F4F7]">
                  Прибытие в ПВЗ Ozon / СДЭК и штрихкод
                </p>
                <p className="text-xs text-[#8A93A2]">
                  Код получения посылки без паспорта сразу после приемки
                </p>
              </div>
              <Switch
                aria-label="Прибытие в ПВЗ"
                checked={notifications.onArrivedAtPvz}
                onCheckedChange={() => toggleNotification("onArrivedAtPvz")}
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-2.5">
              <div>
                <p className="text-sm font-semibold text-[#F2F4F7]">
                  Автоотправка УПД в ЭДО после выдачи
                </p>
                <p className="text-xs text-[#8A93A2]">
                  Синхронизация закрывающих документов с Контур.Диадок / СБИС
                </p>
              </div>
              <Switch
                aria-label="Автоотправка УПД в ЭДО"
                checked={notifications.edoAutoSend}
                onCheckedChange={() => toggleNotification("edoAutoSend")}
              />
            </div>
          </div>
        </section>

        {/* 3. СОХРАНЕННЫЕ ПУНКТЫ ВЫДАЧИ (ПВЗ СДЭК И OZON) */}
        <section className="rounded-[16px] border border-[#262B36] bg-[#161920] p-5">
          <div className="flex items-center justify-between border-b border-[#262B36] pb-3.5">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-[#10B981]" />
              <h2 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                {"03 // Пункты выдачи заказов (ПВЗ)"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingPvz((v) => !v)}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 font-mono text-xs text-[#00D1FF] transition-colors hover:border-[#00D1FF]"
            >
              <Plus className="size-3.5" />
              Добавить ПВЗ
            </button>
          </div>

          {isAddingPvz && (
            <form
              onSubmit={handleAddPvz}
              className="mt-4 space-y-3 rounded-[12px] border border-[#00D1FF]/40 bg-[#0E1014] p-3.5"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="pvz-carrier"
                    className="block font-mono text-[11px] text-[#8A93A2]"
                  >
                    Логистический оператор
                  </label>
                  <select
                    id="pvz-carrier"
                    value={newPvzCarrier}
                    onChange={(e) =>
                      setNewPvzCarrier(e.target.value as CarrierType)
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#161920] px-2.5 font-mono text-xs text-[#F2F4F7]"
                  >
                    <option value="cdek">СДЭК Экспресс</option>
                    <option value="ozon">Ozon Посылка</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="pvz-city"
                    className="block font-mono text-[11px] text-[#8A93A2]"
                  >
                    Город
                  </label>
                  <input
                    id="pvz-city"
                    type="text"
                    value={newPvzCity}
                    onChange={(e) => {
                      setPvzError(null);
                      setNewPvzCity(e.target.value);
                    }}
                    className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#161920] px-2.5 text-xs text-[#F2F4F7]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pvz-addr"
                  className="block font-mono text-[11px] text-[#8A93A2]"
                >
                  Точный адрес пункта выдачи
                </label>
                <input
                  id="pvz-addr"
                  type="text"
                  placeholder="ул. Профсоюзная, д. 56, ПВЗ №142"
                  value={newPvzAddress}
                  onChange={(e) => {
                    setPvzError(null);
                    setNewPvzAddress(e.target.value);
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#161920] px-2.5 text-xs text-[#F2F4F7]"
                />
              </div>

              {pvzError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 font-mono text-xs text-red-400"
                >
                  {pvzError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPvz(false)}
                  className="h-8 rounded-lg border border-[#262B36] px-3 font-mono text-xs text-[#8A93A2]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-lg bg-[#10B981] px-3 font-mono text-xs font-bold text-[#0E1014]"
                >
                  Сохранить ПВЗ
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 flex flex-col gap-2.5">
            {pickupPoints.map((pvz) => (
              <div
                key={pvz.id}
                className={cn(
                  "flex flex-col justify-between gap-3 rounded-[12px] border p-3.5 transition-colors sm:flex-row sm:items-center",
                  pvz.isDefault
                    ? "border-[#10B981]/60 bg-[#0E1014]"
                    : "border-[#262B36] bg-[#0E1014]/60 hover:border-[#8A93A2]/50",
                )}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#00D1FF]">
                      <Truck className="size-3.5" />
                      {pvz.carrierLabel}
                    </span>
                    <CopyableChip
                      value={pvz.code}
                      tooltipText="Скопировать код ПВЗ"
                    />
                    {pvz.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded bg-[#10B981]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#10B981]">
                        <CheckCircle2 className="size-3" />
                        ОСНОВНОЙ ПВЗ
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#F2F4F7]">
                    г. {pvz.city}, {pvz.address}
                  </p>
                  <p className="font-mono text-[11px] text-[#8A93A2]">
                    График: {pvz.schedule}
                  </p>
                </div>

                {!pvz.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSelectDefaultPvz(pvz.id)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border border-[#262B36] bg-[#161920] px-3 font-mono text-xs text-[#F2F4F7] transition-colors hover:border-[#10B981] hover:text-[#10B981] sm:self-center"
                  >
                    <Check className="size-3.5" />
                    Выбрать по умолчанию
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. РЕКВИЗИТЫ ЮРЛИЦА / ИП И ЭДО */}
        <section className="rounded-[16px] border border-[#262B36] bg-[#161920] p-5">
          <div className="flex items-center justify-between border-b border-[#262B36] pb-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#F59E0B]" />
              <h2 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                {"04 // Реквизиты ИП / ООО и ЭДО"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#8A93A2]">
                Оплата по счету
              </span>
              <Switch
                aria-label="Активировать реквизиты юридического лица"
                checked={requisites.enabled}
                onCheckedChange={(checked) =>
                  setRequisites((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
          </div>

          <form onSubmit={handleSaveRequisites} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="req-name"
                className="block font-mono text-xs text-[#8A93A2]"
              >
                Наименование организации
              </label>
              <input
                id="req-name"
                type="text"
                value={requisites.legalName}
                onChange={(e) => {
                  setRequisitesError(null);
                  setRequisites((prev) => ({
                    ...prev,
                    legalName: e.target.value,
                  }));
                }}
                className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 text-sm text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono tabular-nums">
              <div>
                <label
                  htmlFor="req-inn"
                  className="block text-[11px] text-[#8A93A2]"
                >
                  ИНН
                </label>
                <input
                  id="req-inn"
                  type="text"
                  value={requisites.inn}
                  onChange={(e) => {
                    setRequisitesError(null);
                    setRequisites((prev) => ({ ...prev, inn: e.target.value }));
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 text-xs font-semibold text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="req-kpp"
                  className="block text-[11px] text-[#8A93A2]"
                >
                  КПП
                </label>
                <input
                  id="req-kpp"
                  type="text"
                  value={requisites.kpp}
                  onChange={(e) => {
                    setRequisitesError(null);
                    setRequisites((prev) => ({ ...prev, kpp: e.target.value }));
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 text-xs font-semibold text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="req-bik"
                  className="block text-[11px] text-[#8A93A2]"
                >
                  БИК Банка
                </label>
                <input
                  id="req-bik"
                  type="text"
                  value={requisites.bik}
                  onChange={(e) => {
                    setRequisitesError(null);
                    setRequisites((prev) => ({ ...prev, bik: e.target.value }));
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 text-xs font-semibold text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="req-account"
                  className="block font-mono text-[11px] text-[#8A93A2]"
                >
                  Расчетный счет
                </label>
                <input
                  id="req-account"
                  type="text"
                  value={requisites.checkingAccount}
                  onChange={(e) => {
                    setRequisitesError(null);
                    setRequisites((prev) => ({
                      ...prev,
                      checkingAccount: e.target.value,
                    }));
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 font-mono text-xs text-[#F2F4F7] tabular-nums focus:border-[#00D1FF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="req-edo"
                  className="block font-mono text-[11px] text-[#8A93A2]"
                >
                  Оператор ЭДО
                </label>
                <input
                  id="req-edo"
                  type="text"
                  value={requisites.edoOperator}
                  onChange={(e) => {
                    setRequisitesError(null);
                    setRequisites((prev) => ({
                      ...prev,
                      edoOperator: e.target.value,
                    }));
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 font-mono text-xs text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                />
              </div>
            </div>

            {requisitesError && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-xs text-red-400"
              >
                {requisitesError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 py-2 font-mono text-xs">
              <span className="text-[11px] text-[#8A93A2]">ID ЭДО:</span>
              <CopyableChip
                value={requisites.edoId}
                label={`${requisites.edoId.slice(0, 24)}…`}
                tooltipText="Скопировать полный идентификатор участника ЭДО"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadContractPdf}
                className="inline-flex h-10 items-center gap-1.5 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs text-[#8A93A2] transition-colors hover:border-[#8A93A2] hover:text-[#F2F4F7]"
              >
                <FileText className="size-3.5 text-[#F59E0B]" />
                Договор поставки PDF
              </button>

              <button
                type="submit"
                className="cta-border-beam inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#FF5C1A] px-4 font-mono text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
              >
                <Save className="size-3.5" />
                Обновить реквизиты
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
