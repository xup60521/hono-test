import { zValidator } from "@hono/zod-validator";
import { db } from "../../src/db";
import { account } from "../../src/db/auth-schema";
import { auth } from "../../src/lib/auth";
import { qstashClient } from "../../src/lib/qstash-client";
import { redis } from "../../src/lib/redis";
import { type WorkflowPayloadType } from "../../src/lib/utils";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const translateSchema = z.object({
    urls: z.array(z.string().url({ message: "Invalid URL format" })),
    provider: z.string().min(1, "Provider is required"),
    encrypted_api_key: z.string().min(1, "API key is required"),
    model_id: z.string().min(1, "Model ID is required"),
    concurrency: z.number().int().positive(),
    batch_size: z.number().int().positive(),
    folder_id: z.string().min(1, "Folder ID is required"),
    api_key_name: z.string().optional(),
});

const cancelSchema = z.object({ workflow_id: z.string() });

const app = new Hono()
    .post("/translate", zValidator("json", translateSchema), async (c) => {
        try {
            const data = c.req.valid("json");

            const session = await auth.api.getSession({
                headers: c.req.raw.headers,
            });
            if (!session?.session) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const userAccount = await db.query.account.findFirst({
                where: and(
                    eq(account.userId, session.user.id),
                    eq(account.providerId, "google")
                ),
            });

            const google_refresh_token = userAccount?.refreshToken;

            if (!google_refresh_token) {
                console.error("No Google Refresh Token found for this user");
                return c.json({ error: "No refresh token" }, 400);
            }

            const { userId } = userAccount;
            const payload = { ...data, user_id: userId } as WorkflowPayloadType;

            const { workflowRunId } = await qstashClient.trigger({
                url: process.env.BETTER_AUTH_URL! + "/api/workflow",
                headers: {
                    "Content-Type": "application/json",
                },
                body: payload,
                retries: 3,
                // keepTriggerConfig: true,
                // useFailureFunction: true,
            });

            await redis
                .pipeline()
                .zadd(`user:tasks:${userId}`, {
                    score: Date.now(),
                    member: workflowRunId,
                })
                .hset(`task:${workflowRunId}`, {
                    status: "starting",
                    progress: 0,
                    current: 0,
                    total: payload.urls.length,
                    urls: JSON.stringify(payload.urls),
                    created_at: Date.now(),
                    provider: payload.provider,
                    model_id: payload.model_id,
                    api_key_name: payload.api_key_name || "",
                })
                .expire(`task:${workflowRunId}`, 604800) // 7 days
                .exec();

            return c.json({ message: "ok", workflowRunId });
        } catch (e) {
            console.error(e);
            return c.json({ error: "Internal Server Error" }, 500);
        }
    })
    .post("/cancel", zValidator("json", cancelSchema), async (c) => {
        try {
            const { workflow_id } = c.req.valid("json");

            await qstashClient.cancel({ ids: [workflow_id] });
            await redis.hset(`task:${workflow_id}`, {
                status: "canceled",
            });

            return c.json({ message: "ok" });
        } catch (e) {
            console.error(e);
            return c.json({ error: "Internal Server Error" }, 500);
        }
    });

export default app;
