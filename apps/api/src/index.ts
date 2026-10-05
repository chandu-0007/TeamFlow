import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Ensure root .env is loaded in development and monorepo environments
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    dotenv.config();
}
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
}

import express from "express";
import type { Express } from "express";
import cookieParser from "cookie-parser";
import { connectRedis } from "@teamflow/db";
import authRouter from "./routes/auth.routes.js";
import organizationRouter from "./routes/organization.routes.js";
import projectRouter from "./routes/project.routes.js";

const app: Express = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration (supports cookies and Bearer tokens for clients/Postman)
app.use((req, res, next) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

// Health check
app.get("/health-check", (_req, res) => {
    return res.status(200).json({
        status: "ok",
        message: "TeamFlow API server is running successfully",
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/projects", projectRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled API error:", err);
    return res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, async () => {
    console.log(`TeamFlow API server is running on http://localhost:${PORT}`);
    try {
        await connectRedis();
        console.log("Connected to Redis successfully");
    } catch (err: any) {
        console.warn("Redis connection warning:", err.message);
    }
});

export default app;