import type { Metadata } from "next";
import { ProfileView } from "~/components/dashboard/profile-view";

export const metadata: Metadata = {
  title: "Профиль инженера, ПВЗ и реквизиты ЭДО — ParamLab",
  description:
    "Управление пунктами выдачи СДЭК и Ozon, телеметрией этапов печати и реквизитами юридического лица для счетов и УПД.",
};

export default function DashboardProfilePage() {
  return <ProfileView />;
}
