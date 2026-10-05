import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;

    if (req.cookies && typeof req.cookies.token === "string") {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            message: "Authentication token required. Please sign in.",
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not configured");
        return res.status(500).json({
            message: "Server configuration error: JWT_SECRET missing",
        });
    }

    try {
        const decoded = jwt.verify(token, secret) as { userId: string };
        req.user = { userId: decoded.userId };
        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please sign in again.",
        });
    }
}
