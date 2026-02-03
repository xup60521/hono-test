import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./auth-schema.ts";

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
