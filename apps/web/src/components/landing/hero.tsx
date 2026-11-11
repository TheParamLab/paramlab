import { BadgeCheck, CreditCard, FileBox, Ruler, Truck } from "lucide-react";
import { CalculatorTrigger } from "./calculator-context";
import { OrderCalculator } from "./order-calculator";

const TRUST = [
  { icon: BadgeCheck, text: "Финальная цена сразу на экране" },
  { icon: CreditCard, text: "Оплата картой или по счету для ИП/ООО" },
  { icon: Truck, text: "Отгрузка за 24–48 часов (от 199 ₽ в ПВЗ Ozon)" },
];

const SPECS = [
  "Инженерные полимеры до 370 °C",
  "Камера 320×320×300 мм",
  "Доставка в ПВЗ Ozon",
];

const cta =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors outline-none focus-visible:ring-3";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b">
      <div
        aria-hidden="true"
        className="bg-blueprint absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-70"
      />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-12 lg:items-start lg:px-8">
        <div className="flex flex-col gap-6 lg:col-span-6 lg:pt-6">
          <ul className="flex flex-wrap gap-1.5">
            {SPECS.map((spec) => (
              <li
                key={spec}
                className="bg-background rounded-md border px-2 py-1 font-mono text-xs"
              >
                {spec}
              </li>
            ))}
          </ul>
          <h1 className="text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl xl:text-5xl">
            Производство технических деталей и корпусов на заказ с расчетом за 5
            секунд
          </h1>
          <p className="text-muted-foreground max-w-xl text-base text-pretty sm:text-lg">
            Загрузите свою 3D-модель или задайте размеры втулки, переходника и
            шестерни прямо на сайте. Печатаем угленаполненным полиамидом, ASA и
            поликарбонатом — отправляем в пункт выдачи у вашего дома.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CalculatorTrigger
              tab="file"
              className={`${cta} bg-brand text-brand-foreground hover:bg-brand/85 focus-visible:ring-brand/50`}
            >
              <FileBox className="size-4" />
              Рассчитать по файлу STL / STEP
            </CalculatorTrigger>
            <CalculatorTrigger
              tab="generator"
              className={`${cta} bg-background hover:bg-muted focus-visible:ring-ring/50 border`}
            >
              <Ruler className="size-4" />
              Собрать деталь по размерам
            </CalculatorTrigger>
          </div>
          <ul className="flex flex-col gap-2.5 border-t pt-5 text-sm">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 lg:col-span-6">
          <OrderCalculator />
        </div>
      </div>
    </section>
  );
}
