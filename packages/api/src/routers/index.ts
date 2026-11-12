/**
 * Root Router
 *
 * The single entry-point for the entire oRPC API.
 * Add new domain routers here and they become available everywhere
 * (Next.js handler, RSC clients, type-safe hooks, etc.).
 *
 * Current route map:
 *
 *   user.*          – current user profile & account settings  (protected)
 *   post.list       – paginated list of posts                  (public)
 *   post.byId       – single post by UUID                      (public)
 *   post.create     – create a post                            (protected)
 *   post.delete     – delete a post                            (admin)
 *   part.*          – library of the user's 3D parts            (protected)
 *   order.*         – orders and their tracker stages          (protected)
 *   admin.users.*   – user management                          (admin)
 *   admin.orders.*  – order stage management                   (admin)
 *   admin.stats.*   – system-wide statistics                   (admin)
 */

import { adminRouter } from "./admin";
import { orderRouter } from "./order";
import { partRouter } from "./part";
import { postRouter } from "./post";
import { userRouter } from "./user";

export const appRouter = {
  user: userRouter,
  post: postRouter,
  part: partRouter,
  order: orderRouter,
  admin: adminRouter,
};

export type AppRouter = typeof appRouter;
