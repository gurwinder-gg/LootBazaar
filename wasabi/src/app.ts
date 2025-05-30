import { Hono } from "hono";
import { logger } from "hono/logger";
import { userRouter } from "./users/info";
import { transactionRouter } from "./transactions";
import { chatRouter } from "./room";
import { leaderboardRouter } from "./users/leaderboard";

const app = new Hono()

app.use("*", logger());

app.route("/api/user", userRouter);
app.route("/api/transactions", transactionRouter);
app.route("/api/chat", chatRouter);
app.route("/api/leaderboard", leaderboardRouter);

export default app;
export type App = typeof app;
export const fetch = app.fetch;
