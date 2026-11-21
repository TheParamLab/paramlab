import type { Metadata } from "next";
import { OrdersView } from "~/components/dashboard/orders-view";

export const metadata: Metadata = {
  title: "Пульт производства — Личный кабинет ParamLab",
  description:
    "Трекинг 5 этапов 3D-печати (Manifold, В печати, ОТК со штангенциркулем, В пути, Готово), паспорт заказа и быстрый повтор партий.",
};

export default function CabinetIndexPage() {
  return <OrdersView />;
}
