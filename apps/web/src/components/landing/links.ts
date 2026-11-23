/** Ссылки на внутренние страницы: кабинет и вход живут на том же домене. */
export const APP_LINKS = {
  /** Личный кабинет; без сессии proxy отправит на вход. */
  cabinet: "/cabinet",
  /** Единый шлюз входа и регистрации без паролей (Passwordless-first). */
  signup: "/auth/login",
} as const;
