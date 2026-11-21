import { PasswordForm } from "~/components/settings/password-form";
import {
  SettingsHeader,
  SettingsShell,
} from "~/components/settings/settings-shell";
import { SettingsSidebar } from "~/components/settings/settings-sidebar";

export default function SettingsSecurityPage() {
  return (
    <SettingsShell header={<SettingsHeader />} sidebar={<SettingsSidebar />}>
      <div className="flex flex-col gap-1 pb-6">
        <h2 className="text-lg font-bold tracking-tight text-[#F2F4F7]">
          Безопасность и пароль
        </h2>
        <p className="text-sm text-[#8A93A2]">
          Измените пароль, который вы используете для входа в пульт управления.
        </p>
      </div>
      <PasswordForm />
    </SettingsShell>
  );
}
