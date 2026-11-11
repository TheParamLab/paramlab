import { env } from "~/env";

const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

/** Ссылки в клиентское приложение (`apps/app`). */
export const APP_LINKS = {
  /** Личный кабинет; без сессии приложение само отправит на вход. */
  cabinet: appUrl,
  /** Оформление заказа начинается с регистрации. */
  signup: `${appUrl}/auth/signup`,
} as const;
