import type { Metadata } from "next";
import { OrdersView } from "~/components/dashboard/orders-view";

export const metadata: Metadata = {
  title: "Заказы и печать — Пульт производства ParamLab",
  description:
    "Трекинг 5 этапов 3D-печати (Manifold, В печати, ОТК со штангенциркулем, В пути, Готово), паспорт заказа и быстрый повтор партий.",
};

export default function OrdersPage() {
  return <OrdersView />;
}
