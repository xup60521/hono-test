import { Hono } from "hono";


const app = new Hono().basePath("/api").get("/", c => c.json({ message: "Hello from Hono!" }));

export default app;