import type { Metadata } from "next";
import { NewOrderView } from "~/components/dashboard/new-order-view";

export const metadata: Metadata = {
  title: "Оформление заказа — Пульт производства ParamLab",
  description:
    "Подтверждение параметров черновика детали и выбор пункта выдачи Ozon ПВЗ.",
};

export default function NewOrderPage() {
  return <NewOrderView />;
}
