import { type AuthType, auth } from "../src/lib/auth";
import { Hono } from "hono";
import decomposeRoute from "./routes/decompose";
import historyRoute from "./routes/history";
import modelsRoute from "./routes/models";
import toolsRoute from "./routes/tools";
import translationRoute from "./routes/translation";
import workflowRoute from "./routes/workflow";

const app = new Hono<{ Bindings: AuthType }>({ strict: false }).basePath(
    "/api",
);

app.on(["POST", "GET"], "/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

const routes = app
    .get("/hello", (c) => {
        return c.json({
            message: "Hello, world! from Hono",
            method: "GET",
        });
    })
    .route("/history", historyRoute)
    .route("/translation", translationRoute)
    .route("/tools", toolsRoute)
    .route("/decompose", decomposeRoute)
    .route("/models", modelsRoute)
    .route("/workflow", workflowRoute);

export default app;
export type AppType = typeof routes;
