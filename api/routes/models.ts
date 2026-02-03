import { modelList } from "../../src/lib/model_list";
import { Hono } from "hono";

const app = new Hono().get("/:provider", async (c) => {
    const provider = c.req.param("provider");

    if (!(provider in modelList)) {
        return c.json({ error: "Invalid provider" }, 400);
    }

    const getter = modelList[provider as keyof typeof modelList];

    if (!getter) {
        return c.json({ error: "Invalid provider" }, 400);
    }

    try {
        const models = await getter();
        return c.json(models);
    } catch (e) {
        console.error(e);
        return c.json({ error: "Failed to fetch models" }, 500);
    }
});

export default app;
