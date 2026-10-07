"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi } from "../../../lib/api/auth";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export default function VerifyEmailPage() {
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!userId.trim() || !otp.trim()) {
      setErrorMsg("Please enter both User ID and the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.verifyEmailOtp(userId.trim(), otp.trim());
      setSuccessMsg(res.message || "Email verified successfully! You can now log in.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify code. Please check and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3">
          <Mail className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Verify your email
        </h1>
        <p className="text-xs text-text-secondary">
          Enter the verification code sent to your registered address.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          label="User ID"
          placeholder="e.g. usr_1234..."
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />

        <Input
          label="Verification Code (OTP)"
          placeholder="123456"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full flex items-center justify-center gap-2 mt-2"
          isLoading={isSubmitting}
        >
          <span>Verify Email</span>
        </Button>
      </form>

      <div className="pt-2 text-center border-t border-surface-border">
        <p className="text-xs text-text-secondary">
          Ready to sign in?{" "}
          <Link
            href="/login"
            className="text-white hover:underline font-medium transition-colors"
          >
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}
