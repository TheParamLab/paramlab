import { adminOrdersRouter } from "./orders";
import { adminStatsRouter } from "./stats";
import { adminUsersRouter } from "./users";

export const adminRouter = {
  users: adminUsersRouter,
  stats: adminStatsRouter,
  orders: adminOrdersRouter,
};
