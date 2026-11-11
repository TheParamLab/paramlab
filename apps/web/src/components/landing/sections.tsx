import { cn } from "@acme/ui";
import {
  ArrowRight,
  Calculator,
  Camera,
  Cpu,
  Crosshair,
  Factory,
  type LucideIcon,
  MapPin,
  Maximize,
  ScanBarcode,
  ScanSearch,
  Settings2,
  Square,
  Thermometer,
  Wind,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { CalculatorTrigger } from "./calculator-context";
import {
  DELIVERY_STEPS,
  GENERATORS,
  type PartTypeId,
  PRODUCTS,
  TARIFFS,
} from "./data";
import { APP_LINKS } from "./links";

const price = new Intl.NumberFormat("ru-RU");

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  muted,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-14 border-b", muted && "bg-muted/40")}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground mt-3 max-w-3xl text-pretty">
            {subtitle}
          </p>
        )}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Chip({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 font-mono text-xs whitespace-nowrap",
        dark && "border-foreground bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

const GENERATOR_ICONS: Record<PartTypeId, LucideIcon> = {
  adapter: Wind,
  bushing: Settings2,
  "din-box": Cpu,
  "end-cap": Square,
};

export function Generators() {
  return (
    <Section
      id="generators"
      eyebrow="01 · Параметрические генераторы"
      title="Нет 3D-модели? Соберите деталь за 1 минуту без конструктора"
      subtitle="80% типовых переходников, втулок и корпусов не требуют ручного черчения — задайте диаметры в генераторе, и сервер автоматически создаст 3D-модель под печать."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {GENERATORS.map((item) => {
          const Icon = GENERATOR_ICONS[item.partType];
          return (
            <article
              key={item.partType}
              className="bg-card flex flex-col gap-4 rounded-2xl border p-5"
            >
              <div className="flex items-center justify-between">
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <Chip dark={item.range === "PA6-CF"}>{item.range}</Chip>
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-muted-foreground flex-1 text-sm">
                {item.text}
              </p>
              <CalculatorTrigger
                tab="generator"
                partType={item.partType}
                className="flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:underline"
              >
                Открыть в генераторе
                <ArrowRight className="size-4" />
              </CalculatorTrigger>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

const LAYERS = Array.from({ length: 13 }, (_, i) => 18 + i * 8);
const label = "fill-foreground font-mono text-[10px]";

/** Слои пластика с вплавленной латунной втулкой и стальной шайбой. */
function InsertIllustration() {
  return (
    <svg
      viewBox="0 0 260 124"
      role="img"
      aria-label="Разрез детали: слои пластика, латунная втулка и стальная шайба"
      className="h-auto w-full"
    >
      <rect
        x="6"
        y="10"
        width="248"
        height="104"
        rx="4"
        className="fill-muted stroke-border"
      />
      {LAYERS.map((y) => (
        <line
          key={y}
          x1="6"
          x2="254"
          y1={y}
          y2={y}
          className="stroke-foreground/15"
        />
      ))}
      {/* Латунная втулка с насечкой */}
      <rect
        x="62"
        y="10"
        width="44"
        height="56"
        className="fill-warning/80 stroke-foreground"
      />
      {[20, 30, 40, 50, 60].map((y) => (
        <path
          key={y}
          d={`M62 ${y}l6-6M100 ${y}l6-6`}
          className="stroke-foreground"
        />
      ))}
      <rect
        x="76"
        y="10"
        width="16"
        height="56"
        className="fill-background stroke-foreground"
      />
      {[18, 26, 34, 42, 50, 58].map((y) => (
        <line
          key={y}
          x1="76"
          x2="92"
          y1={y + 3}
          y2={y}
          className="stroke-foreground/60"
        />
      ))}
      <text x="84" y="84" textAnchor="middle" className={label}>
        М4 · латунь
      </text>
      {/* Стальная закладная шайба */}
      <rect
        x="150"
        y="54"
        width="84"
        height="10"
        className="fill-foreground/70 stroke-foreground"
      />
      <rect x="184" y="54" width="16" height="10" className="fill-muted" />
      <text x="192" y="84" textAnchor="middle" className={label}>
        сталь · пауза печати
      </text>
      <path
        d="M192 46V24m-4 6 4-6 4 6"
        className="stroke-brand"
        fill="none"
        strokeWidth="1.5"
      />
      <text x="201" y="32" className="fill-brand font-mono text-[10px]">
        до 100 кг
      </text>
    </svg>
  );
}

const CAPABILITIES: {
  span: string;
  icon: LucideIcon;
  title: string;
  text: string;
  chips: string[];
  illustration?: boolean;
}[] = [
  {
    span: "md:col-span-4",
    icon: Wrench,
    title: "Армирование металлом и латунная резьба",
    text: "Впрессовываем на горячую латунные насечные втулки под винты М2.5–М8 и закладываем внутрь детали стальные шайбы, шпильки и сварные закладные пластины прямо на паузе печати. Резьба держит нагрузку на отрыв до 100 кг.",
    chips: ["М2.5–М8", "до 100 кг"],
    illustration: true,
  },
  {
    span: "md:col-span-2",
    icon: Thermometer,
    title: "Активная термокамера 65 °C",
    text: "Печать сложных инженерных полимеров (ASA, ABS, PC, PA-CF) идет в закрытой прогретой камере с прямой подачей нити из сушильной станции при 80 °C. Никаких трещин и расслоения по слоям.",
    chips: ["65 °C камера", "80 °C сушка"],
  },
  {
    span: "md:col-span-3",
    icon: Maximize,
    title: "Крупногабарит целиком (320×320×300 мм)",
    text: "Печатаем широкие автомобильные патрубки, сварочные кондукторы и приборные панели одной монолитной деталью без склейки.",
    chips: ["320×320×300 мм"],
  },
  {
    span: "md:col-span-3",
    icon: Crosshair,
    title: "Точность посадок под подшипники",
    text: "Кинематика CoreXY на ремнях мелкого шага 1.5GT и индивидуальная калибровка усадки полимера дают точные посадочные размеры без доработки напильником.",
    chips: ["±0.1 мм", "CoreXY · 1.5GT"],
  },
  {
    span: "md:col-span-3",
    icon: Factory,
    title: "Серийные партии для бизнеса (ИП / ООО)",
    text: "От 1 прототипа до партий в 50–500 корпусов. Оплата по счету без НДС, закрывающие документы (УПД в ЭДО / Диадок).",
    chips: ["1–500 шт.", "УПД · ЭДО"],
  },
  {
    span: "md:col-span-3",
    icon: ScanSearch,
    title: "Обратный инжиниринг по сломанному образцу",
    text: "Сломалась редкая шестерня или пластиковый узел, который продается только в сборе за 25 000 ₽? Пришлите фото на листе в клетку и 3 замера — отрисуем 3D-модель и усилим слабые места.",
    chips: ["фото + 3 замера"],
  },
];

export function Capabilities() {
  return (
    <Section
      id="capabilities"
      eyebrow="02 · Возможности производства"
      title="Инженерный стандарт ParamLab"
      muted
    >
      {/* Единый каркас: зазор в 1px поверх фона-границы дает тонкие линии. */}
      <div className="bg-border grid grid-cols-1 gap-px overflow-hidden rounded-2xl border md:grid-cols-6">
        {CAPABILITIES.map((item) => (
          <article
            key={item.title}
            className={cn(
              "bg-card flex flex-col gap-4 p-6",
              item.span,
              item.illustration && "lg:flex-row lg:items-center lg:gap-8",
            )}
          >
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <item.icon className="mr-1 size-5" />
                {item.chips.map((chip) => (
                  <Chip key={chip}>{chip}</Chip>
                ))}
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm text-pretty">
                {item.text}
              </p>
            </div>
            {item.illustration && (
              <div className="w-full max-w-xs shrink-0 lg:w-72">
                <InsertIllustration />
              </div>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}

export function Products() {
  return (
    <Section
      id="products"
      eyebrow="03 · Серийные приборы"
      title="Собственные разработки лаборатории ParamLab"
      subtitle="Серийные приборы автоматизации и контроля в корпусах из ударопрочного инженерного пластика ASA/PETG."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <article
            key={product.name}
            className="bg-card flex flex-col rounded-2xl border"
          >
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-semibold">
                  {product.name}
                </p>
                <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                  <span className="bg-success size-1.5 rounded-full" />
                  {product.availability}
                </span>
              </div>
              <h3 className="text-lg leading-snug font-semibold tracking-tight">
                {product.title}
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {product.specs.map((spec) => (
                  <li
                    key={spec}
                    className="rounded-md border px-1.5 py-0.5 font-mono text-xs"
                  >
                    {spec}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm text-pretty">
                {product.text}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-6">
              <p className="font-mono text-2xl font-semibold tracking-tight">
                {product.pricePrefix}
                {price.format(product.price)} ₽
              </p>
              <a
                href={APP_LINKS.signup}
                className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors"
              >
                {product.cta}
              </a>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

const STEP_ICONS = [Calculator, MapPin, Camera, ScanBarcode];

export function Delivery() {
  return (
    <Section
      id="delivery"
      eyebrow="04 · Логистика и оплата"
      title="4 шага до получения детали в пункте выдачи"
      muted
    >
      <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {DELIVERY_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Calculator;
          return (
            <li key={step.title} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-background flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold">
                  {index + 1}
                </span>
                <Icon className="text-muted-foreground size-5 shrink-0" />
                {/* Линия таймлайна до следующего шага */}
                {index < DELIVERY_STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="bg-border -mr-6 hidden h-px flex-1 lg:block"
                  />
                )}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                {step.text}
              </p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function Pricing() {
  return (
    <Section
      id="pricing"
      eyebrow="05 · Тарифы и условия"
      title="Цены и сроки — до заказа, без звонка менеджеру"
    >
      <div className="bg-border grid gap-px overflow-hidden rounded-2xl border md:grid-cols-2 lg:grid-cols-4">
        {TARIFFS.map((tariff) => (
          <article
            key={tariff.title}
            className="bg-card flex flex-col items-start gap-4 p-6"
          >
            <Chip>{tariff.formats}</Chip>
            <h3 className="font-semibold text-balance">{tariff.title}</h3>
            <p className="text-muted-foreground flex-1 text-sm text-pretty">
              {tariff.text}
            </p>
            <dl className="grid w-full grid-cols-2 gap-x-4 border-t pt-4">
              <div>
                <dt className="text-muted-foreground text-xs">
                  {tariff.priceLabel}
                </dt>
                <dd className="mt-1 font-mono text-lg font-semibold whitespace-nowrap">
                  {tariff.price}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Срок</dt>
                <dd className="mt-1 font-mono text-lg whitespace-nowrap">
                  {tariff.term}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </Section>
  );
}
