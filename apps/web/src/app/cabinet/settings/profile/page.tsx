import type { Metadata } from "next";
import { ProfileView } from "~/components/dashboard/profile-view";

export const metadata: Metadata = {
  title: "Профиль инженера — ParamLab",
};

export default function SettingsProfilePage() {
  return <ProfileView />;
}
