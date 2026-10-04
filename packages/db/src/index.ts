import "dotenv/config";
import { createClient } from "redis";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
});


export const redis = createClient({
    url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
    }
}
