import { Client } from "@upstash/workflow";

export const qstashClient = new Client({
    // Local QStash server,
    baseUrl: process.env.QSTASH_URL!,
    token: process.env.QSTASH_TOKEN!,
});