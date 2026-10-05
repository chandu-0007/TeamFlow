import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import z from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma, redis, connectRedis } from "@teamflow/db";

const SignupValidation = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const SigninValidation = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const ForgotPasswordValidation = z.object({
    email: z.string().email("Invalid email address"),
});

const ResetPasswordValidation = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        { userId },
        secret,
        { expiresIn: "7d" }
    );
}

function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

async function sendPasswordResetEmail(email: string, otp: string) {
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || "TeamFlow <noreply@teamflow.dev>",
            to: email,
            subject: "Reset your TeamFlow password",
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your TeamFlow account.</p>
                <p>Your password reset code is:</p>
                <h1 style="letter-spacing: 4px; color: #4F46E5;">${otp}</h1>
                <p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
            `,
        });
        console.log(`[AUTH] Password reset email sent to ${email}`);
    } catch (err: any) {
        console.warn(`[AUTH] SMTP delivery failed (${err.message}). Logging OTP to console for development testing:`);
        console.log(`\n========================================`);
        console.log(`🔑 PASSWORD RESET OTP for ${email}: [ ${otp} ]`);
        console.log(`========================================\n`);
    }
}

export async function signup(req: Request, res: Response) {
    const result = SignupValidation.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { name, email: rawEmail, password } = result.data;
    const email = rawEmail.trim().toLowerCase();

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "A user with this email already exists",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                emailVerified: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        const token = generateToken(user.id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });

        return res.status(201).json({
            message: "Signup successful",
            token,
            user,
        });
    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Internal server error during signup",
        });
    }
}

export async function signin(req: Request, res: Response) {
    const result = SigninValidation.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { email: rawEmail, password } = result.data;
    const email = rawEmail.trim().toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user.id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });

        return res.status(200).json({
            message: "Signin successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error("Signin error:", error);

        return res.status(500).json({
            message: "Internal server error during signin",
        });
    }
}

export async function getMe(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                emailVerifiedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error("GetMe error:", error);
        return res.status(500).json({
            message: "Internal server error fetching user profile",
        });
    }
}

export async function forgotPassword(req: Request, res: Response) {
    const result = ForgotPasswordValidation.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid email input",
            errors: result.error.flatten(),
        });
    }

    const email = result.data.email.trim().toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return 200 for security to prevent user enumeration
            return res.status(200).json({
                message: "If that email address is registered, a password reset code has been sent.",
            });
        }

        await connectRedis();

        // Check 60-second cooldown
        const cooldown = await redis.get(`pwd-reset-cooldown:${user.id}`);
        if (cooldown) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another reset code.",
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        await redis.set(`pwd-reset:${user.id}`, otp, { EX: 10 * 60 });
        await redis.set(`pwd-reset-cooldown:${user.id}`, "1", { EX: 60 });
        await redis.del(`pwd-reset-attempts:${user.id}`);

        await sendPasswordResetEmail(user.email, otp);

        return res.status(200).json({
            message: "Password reset code sent successfully.",
        });
    } catch (error) {
        console.error("ForgotPassword error:", error);
        return res.status(500).json({
            message: "Internal server error requesting password reset",
        });
    }
}

export async function resetPassword(req: Request, res: Response) {
    const result = ResetPasswordValidation.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { email: rawEmail, otp, newPassword } = result.data;
    const email = rawEmail.trim().toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid reset request or user does not exist",
            });
        }

        await connectRedis();

        // Check attempts to prevent brute-forcing
        const attemptsStr = await redis.get(`pwd-reset-attempts:${user.id}`);
        const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
        if (attempts >= 5) {
            await redis.del(`pwd-reset:${user.id}`);
            return res.status(429).json({
                message: "Too many failed attempts. Please request a new password reset code.",
            });
        }

        const storedOtp = await redis.get(`pwd-reset:${user.id}`);

        if (!storedOtp) {
            return res.status(400).json({
                message: "Reset code expired or not found. Please request a new one.",
            });
        }

        if (storedOtp !== otp) {
            await redis.set(`pwd-reset-attempts:${user.id}`, (attempts + 1).toString(), { EX: 10 * 60 });
            return res.status(400).json({
                message: "Invalid reset code",
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        await redis.del(`pwd-reset:${user.id}`);
        await redis.del(`pwd-reset-attempts:${user.id}`);
        await redis.del(`pwd-reset-cooldown:${user.id}`);

        return res.status(200).json({
            message: "Password reset successfully. You can now sign in with your new password.",
        });
    } catch (error) {
        console.error("ResetPassword error:", error);
        return res.status(500).json({
            message: "Internal server error resetting password",
        });
    }
}

export function logout(_req: Request, res: Response) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({
        message: "Logged out successfully",
    });
}
