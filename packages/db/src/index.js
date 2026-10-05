import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "redis";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";
if (!process.env.DATABASE_URL) {
    dotenv.config();
}
if (!process.env.DATABASE_URL) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
}
const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL || "",
});
export const prisma = new PrismaClient({
    adapter,
});
export const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});
redis.on("error", (err) => {
    console.error("Redis error:", err);
});
export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
    }
}
export * from "../generated/prisma/client.js";
