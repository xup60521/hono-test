import { zValidator } from "@hono/zod-validator";
import { encrypt } from "../../src/lib/cryptography";
import { novel_handler } from "../../src/lib/novel_handler/novel_handler";
import { Hono } from "hono";
import { z } from "zod";

const encryptSchema = z.object({
    text: z.string(),
});

const novelHandlerSchema = z.object({
    url: z.string().url(),
    with_Cookies: z.boolean().optional().default(false),
});

const app = new Hono()
    .post("/encrypt", zValidator("json", encryptSchema), async (c) => {
        try {
            const { text } = c.req.valid("json");
            const encrypted_string = encrypt(text);
            return c.json({ encrypted: encrypted_string });
        } catch (e) {
            console.error(e);
            return c.json({ error: "Invalid input" }, 400);
        }
    })
    .post(
        "/novel-handler",
        zValidator("json", novelHandlerSchema),
        async (c) => {
            try {
                const { url, with_Cookies } = c.req.valid("json");

                const result = await novel_handler(url, { with_Cookies });
                return c.json(result);
            } catch (e) {
                console.error(e);
                return c.json({ error: "Internal Server Error" }, 500);
            }
        }
    );

export default app;
