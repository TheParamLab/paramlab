import type { Metadata } from "next";
import { PartsView } from "~/components/dashboard/parts-view";

export const metadata: Metadata = {
  title: "Библиотека параметрических деталей — ParamLab",
  description:
    "Сохранённые параметрические CAD-пресеты (D × T × H) с проверенной сеткой Manifold и быстрым повтором печати.",
};

export default function DashboardPartsPage() {
  return <PartsView />;
}
