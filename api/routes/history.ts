import { auth } from "../../src/lib/auth";
import { redis } from "../../src/lib/redis";
import { Hono } from "hono";

interface RedisTaskData {
    status: string;
    progress: string | number;
    current: string | number;
    total: string | number;
    urls: string; // Stored as JSON.stringify
    error_message?: string;
    created_at?: string | number;
    provider?: string;
    model_id?: string;
    api_key_name?: string;
}

const app = new Hono()
    .get("/", async (c) => {
        try {
            const session = await auth.api.getSession({
                headers: c.req.raw.headers,
            });
            const userId = session?.session.userId;

            if (!userId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // 1. Get recent 20 task IDs for the user
            const taskIds = await redis.zrange(`user:tasks:${userId}`, 0, 19, {
                rev: true,
            });

            if (!taskIds || taskIds.length === 0) {
                return c.json([]);
            }

            // 2. Create Pipeline to batch fetch all Hash data
            const pipeline = redis.pipeline();
            taskIds.forEach((id) => {
                pipeline.hgetall(`task:${id}`);
            });

            // Execute
            const results = await pipeline.exec<RedisTaskData[]>();

            // 3. Format the result
            const history = taskIds
                .map((id, index) => {
                    const data = results[index];

                    // If data is expired or not found, return null
                    if (!data || Object.keys(data).length === 0) return null;

                    return {
                        taskId: id as string,
                        status: data.status,
                        progress: Number(data.progress || 0),
                        current: Number(data.current || 0),
                        total: Number(data.total || 0),
                        urls: data.urls ? data.urls : [],
                        errorMessage: data.error_message || null,
                        createdAt: data.created_at
                            ? Number(data.created_at)
                            : null,
                        provider: data.provider || null,
                        model: data.model_id || null,
                        apiKeyName: data.api_key_name || null,
                    };
                })
                .filter(Boolean); // Filter out nulls

            return c.json(history);
        } catch (error) {
            console.error("Upstash Redis Error:", error);
            return c.json({ error: "Internal Server Error" }, 500);
        }
    })
    .delete("/:taskId", async (c) => {
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });
        const userId = session?.session.userId;

        if (!userId) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const taskId = c.req.param("taskId");
        if (!taskId) {
            return c.json({ error: "Missing taskId" }, 400);
        }

        await redis.del(`task:${taskId}`);
        await redis.zrem(`user:tasks:${userId}`, taskId);

        return c.json({ success: true });
    });

export default app;
