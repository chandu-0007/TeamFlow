import type { Request, Response } from "express";
import z from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma, redis, connectRedis } from "@teamflow/db";

const EmailValidation = z.object({
    email: z.string().email("Invalid email address"),
});

const VerifyEmailValidation = z.object({
    email: z.string().email("Invalid email address").optional(),
    userId: z.string().optional(),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
}).refine(data => data.email || data.userId, {
    message: "Either email or userId must be provided",
});

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

function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

async function sendVerificationEmail(email: string, otp: string) {
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || "TeamFlow <noreply@teamflow.dev>",
            to: email,
            subject: "Verify your TeamFlow account",
            html: `
                <h2>Verify your TeamFlow account</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing: 4px; color: #2563EB;">${otp}</h1>
                <p>This code expires in 10 minutes.</p>
            `,
        });
        console.log(`[AUTH] Verification email sent to ${email}`);
    } catch (err: any) {
        console.warn(`[AUTH] SMTP delivery failed (${err.message}). Logging OTP to console for development testing:`);
        console.log(`✉️  EMAIL VERIFICATION OTP for ${email}: [ ${otp} ]`);
        
    }
}

// Generate OTP, store in Redis, and send to email (with dev console fallback)
export async function sendOtp(req: Request, res: Response) {
    const result = EmailValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const email = result.data.email.trim().toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({
                message: "No user found with this email address",
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                message: "This email address is already verified",
            });
        }

        await connectRedis();

        // Check 60-second cooldown
        const cooldown = await redis.get(`email-cooldown:${user.id}`);
        if (cooldown) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another verification code.",
            });
        }

        const otp = generateOtp();

        await redis.set(`email-verification:${user.id}`, otp, { EX: 10 * 60 });
        await redis.set(`email-cooldown:${user.id}`, "1", { EX: 60 });
        await redis.del(`email-attempts:${user.id}`);

        await sendVerificationEmail(user.email, otp);

        return res.status(200).json({
            userId: user.id,
            email: user.email,
            message: "Verification OTP sent successfully",
        });
    } catch (error) {
        console.error("SendOtp error:", error);

        return res.status(500).json({
            message: "Internal server error sending verification OTP",
        });
    }
}

// Verify OTP from Redis and update user record
export async function verifyEmail(req: Request, res: Response) {
    const result = VerifyEmailValidation.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { email: rawEmail, userId: rawUserId, otp } = result.data;

    try {
        await connectRedis();

        let user = null;
        if (rawEmail) {
            const email = rawEmail.trim().toLowerCase();
            user = await prisma.user.findUnique({ where: { email } });
        } else if (rawUserId) {
            user = await prisma.user.findUnique({ where: { id: rawUserId } });
        }

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.emailVerified) {
            return res.status(200).json({
                message: "Email is already verified",
            });
        }

        // Check attempts to prevent brute force
        const attemptsStr = await redis.get(`email-attempts:${user.id}`);
        const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
        if (attempts >= 5) {
            await redis.del(`email-verification:${user.id}`);
            return res.status(429).json({
                message: "Too many failed attempts. Please request a new verification code.",
            });
        }

        const storedOtp = await redis.get(`email-verification:${user.id}`);

        if (!storedOtp) {
            return res.status(400).json({
                message: "Verification code expired or not found. Please request a new code.",
            });
        }

        if (storedOtp !== otp) {
            await redis.set(`email-attempts:${user.id}`, (attempts + 1).toString(), { EX: 10 * 60 });
            return res.status(400).json({
                message: "Invalid verification code",
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        });

        await redis.del(`email-verification:${user.id}`);
        await redis.del(`email-attempts:${user.id}`);
        await redis.del(`email-cooldown:${user.id}`);

        return res.status(200).json({
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("VerifyEmail error:", error);

        return res.status(500).json({
            message: "Internal server error verifying email",
        });
    }
}
