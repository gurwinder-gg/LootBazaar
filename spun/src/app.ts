import { Hono } from "hono";
import { chartRouter } from "./chart";
import { dataRouter } from "./data";
import { buyRouter } from "./buy/jup";
import { donateRouter } from "./actions/donate";
import { logger } from "hono/logger";
import { memoRouter } from "./actions/memo";
import { dynamicTransferRouter } from "./actions/dynamic";
import { pumpRouter } from "./pump";
import { walletRouter } from "./wallet";
import { upiRouter } from "./upi";
// import { proxyRouter } from "./proxy";
// import { serveStatic } from "hono/bun";

const app = new Hono()

app.use("*", logger());

const apiRoutes = app.basePath("/api")
                // .route("/proxy", proxyRouter)
                .route("buy", buyRouter)
                .route("data", dataRouter)
                .route("chart", chartRouter)
                .route("pump", pumpRouter)
                .route("wallet", walletRouter)
                .route("upi", upiRouter)
                .basePath("/actions")
                    .route("donate", donateRouter)
                    .route("memo", memoRouter)
                    .route("dynamic", dynamicTransferRouter);

export default app;
export type App = typeof app;
export const fetch = app.fetch;
