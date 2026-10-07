"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../../context/auth-context";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { signin, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect straight to workspace
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace("/workspace");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signin({ email: email.trim(), password });
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Sign in to your workspace
        </h1>
        <p className="text-xs text-text-secondary">
          Enter your credentials to access your projects and tasks.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          autoFocus
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full flex items-center justify-center gap-2 mt-2"
          isLoading={isSubmitting}
        >
          <span>Sign In</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </form>

      <div className="pt-2 text-center border-t border-surface-border">
        <p className="text-xs text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-white hover:underline font-medium transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
