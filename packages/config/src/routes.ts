const ROOTS = {
  DASHBOARD: "/cabinet",
  AUTH: "/auth",
  SETTINGS: "/cabinet/settings",
  PARTS: "/cabinet/parts",
  ORDERS: "/cabinet/orders",
} as const;

export const paths = {
  dashboard: {
    root: ROOTS.DASHBOARD,
  },
  parts: {
    root: ROOTS.PARTS,
  },
  orders: {
    root: ROOTS.ORDERS,
    byId: (id: string) => `${ROOTS.ORDERS}/${id}` as const,
  },
  auth: {
    root: ROOTS.AUTH,
    login: `${ROOTS.AUTH}/login`,
    signup: `${ROOTS.AUTH}/signup`,
    otp: `${ROOTS.AUTH}/otp`,
    forgotPassword: `${ROOTS.AUTH}/forgot-password`,
    resetPassword: `${ROOTS.AUTH}/reset-password`,
  },
  settings: {
    root: ROOTS.SETTINGS,
    profile: `${ROOTS.SETTINGS}/profile`,
    security: `${ROOTS.SETTINGS}/security`,
  },
} as const;
