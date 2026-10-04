import type { Request, Response } from "express";
import z, { email } from "zod"
import crypto from "crypto"
import { prisma, redis, connectRedis } from "@teamflow/db"
import nodemailer from "nodemailer";


const EmailValidation = z.object({
    email: z.email()
})

function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

async function sendVerificationEmail(
    email: string,
    otp: string
) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify your TeamFlow account",
        html: `
            <h2>Verify your TeamFlow account</h2>

            <p>Your verification code is:</p>

            <h1>${otp}</h1>

            <p>This code expires in 10 minutes.</p>
        `,
    });
}

// generate the otp and store in the redis and sned the otp to the email 
export async function SendOtp(req: Request, res: Response) {
    const result = EmailValidation.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { email } = result.data
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email",
            });
        }
        if(user.emailVerified){
            return res.status(404).json({
                message : "The email is already verified "
            })
        }

        await connectRedis()
        const otp = generateOtp();

        await redis.set(
            `email-verification:${user.id}`,
            otp,
            {
                EX: 10 * 60, 
            }
        );
        
        await sendVerificationEmail(user.email , otp )

        res.status(200).json({
            userId : user.id  , 
            message : "Verification OTP sent successfully "
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// verify the otp stored in the redis and user entered 
const VerifyEmailValidation = z.object({
    userId: z.string(),
    otp: z.string().length(6),
});

export async function verifyEmail(
    req: Request,
    res: Response
) {
    const result = VerifyEmailValidation.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
        });
    }

    const { userId, otp } = result.data;

    const storedOtp = await redis.get(
        `email-verification:${userId}`
    );

    if (!storedOtp) {
        return res.status(400).json({
            message: "OTP expired or not found",
        });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({
            message: "Invalid OTP",
        });
    }

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
        },
    });

    await redis.del(
        `email-verification:${userId}`
    );

    return res.status(200).json({
        message: "Email verified successfully",
    });
}