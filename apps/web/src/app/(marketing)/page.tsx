"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Command,
  Zap,
  ShieldCheck,
  Search,
  CheckCircle2,
  FolderKanban,
  Users,
  CircleDot,
  Check,
  Clock,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  CornerDownLeft,
} from "lucide-react";
import { useAuth } from "../../context/auth-context";

export default function MarketingPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"cycle" | "backlog" | "roadmap">("cycle");

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] selection:bg-white selection:text-black select-none font-sans overflow-x-hidden">
      {/* Linear Ambient Background - Subtle Grid & Spotlight */}
      <div className="fixed inset-0 pointer-events-none linear-grid opacity-70" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] linear-spotlight pointer-events-none" />

      {/* Top Announcement Bar */}
      <div className="relative z-50 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-center text-xs">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 text-[#8a8f98] hover:text-white transition-colors"
          >
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white font-medium">
              New
            </span>
            <span>TeamFlow 2026.04 — Purpose-built for high-velocity software teams</span>
            <ChevronRight className="w-3 h-3 text-[#62666d] group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>

      {/* Header / Navigation */}
      <header className="relative z-40 border-b border-white/[0.08] bg-[#08090a]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded bg-white text-[#08090a] flex items-center justify-center font-bold shadow-subtle group-hover:bg-neutral-200 transition-colors">
                <Layers className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                TeamFlow
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs text-[#8a8f98]">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#workflow" className="hover:text-white transition-colors">
                Method
              </a>
              <a href="#keyboard" className="hover:text-white transition-colors">
                Keyboard
              </a>
              <a href="#architecture" className="hover:text-white transition-colors">
                Architecture
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/workspace"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-[#08090a] text-xs font-semibold transition-colors shadow-subtle"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs text-[#8a8f98] hover:text-white transition-colors font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-[#08090a] text-xs font-semibold transition-colors shadow-subtle"
                >
                  <span>Sign up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#8a8f98]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[11px]">Linear Design Language &bull; High Information Density</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.04em] text-white leading-[1.05]">
            A better way <br />
            to build software.
          </h1>

          <p className="text-base sm:text-xl text-[#8a8f98] max-w-2xl mx-auto leading-relaxed font-normal">
            Meet the modern system for software development. Streamline issues, projects, and roadmaps with unprecedented speed and precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-white hover:bg-neutral-200 text-[#08090a] text-sm font-semibold transition-colors shadow-subtle"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#121316] hover:bg-[#18191c] border border-white/[0.08] hover:border-white/[0.15] text-[#8a8f98] hover:text-white text-sm font-medium transition-colors"
            >
              <span>Sign in to workspace</span>
            </Link>
          </div>
        </div>

        {/* Hero Interactive Mockup (Linear UI Preview Window) */}
        <div className="max-w-5xl mx-auto mt-16 rounded-xl border border-white/[0.1] bg-[#0d0e10] shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden">
          {/* Window Header */}
          <div className="h-10 bg-[#121316] border-b border-white/[0.08] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="text-2xs font-mono text-[#62666d] ml-2">TeamFlow / Acme Engineering / Sprint 24</span>
            </div>

            {/* Quick Command Trigger */}
            <div className="flex items-center gap-2 text-2xs font-mono text-[#8a8f98] bg-[#08090a] px-2.5 py-1 rounded border border-white/[0.08]">
              <Command className="w-3 h-3 text-[#62666d]" />
              <span>K Search or type command...</span>
            </div>
          </div>

          {/* Subheader: View Tabs */}
          <div className="h-10 border-b border-white/[0.06] bg-[#0d0e10] px-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("cycle")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === "cycle"
                    ? "bg-white/[0.08] text-white"
                    : "text-[#8a8f98] hover:text-white"
                }`}
              >
                Active Cycle
              </button>
              <button
                onClick={() => setActiveTab("backlog")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === "backlog"
                    ? "bg-white/[0.08] text-white"
                    : "text-[#8a8f98] hover:text-white"
                }`}
              >
                Backlog
              </button>
              <button
                onClick={() => setActiveTab("roadmap")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === "roadmap"
                    ? "bg-white/[0.08] text-white"
                    : "text-[#8a8f98] hover:text-white"
                }`}
              >
                Roadmap
              </button>
            </div>

            <div className="flex items-center gap-2 text-2xs text-[#62666d]">
              <span className="font-mono">14 issues</span>
              <span>&bull;</span>
              <span>Filter: All</span>
            </div>
          </div>

          {/* High-Density Linear Issue List */}
          <div className="divide-y divide-white/[0.06] text-left">
            <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-2xs font-mono text-[#62666d] w-16">TF-108</span>
                <span className="text-xs font-medium text-[#f7f8f8] group-hover:text-white transition-colors truncate">
                  Implement distributed rate limiter across Redis cluster
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-2xs font-mono text-[#8a8f98]">
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white border border-white/[0.1]">
                  In Progress
                </span>
                <span className="hidden sm:inline text-[#62666d]">Backend</span>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span className="text-2xs font-mono text-[#62666d] w-16">TF-107</span>
                <span className="text-xs font-medium text-[#f7f8f8] group-hover:text-white transition-colors truncate">
                  Fix PostgreSQL deadlock during concurrent organization member batch invite
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-2xs font-mono text-[#8a8f98]">
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Todo
                </span>
                <span className="hidden sm:inline text-[#62666d]">Database</span>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                <span className="text-2xs font-mono text-[#62666d] w-16">TF-106</span>
                <span className="text-xs font-medium text-[#f7f8f8] group-hover:text-white transition-colors truncate">
                  Migrate cookie sessions to HTTP-only SameSite strict tokens
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-2xs font-mono text-[#8a8f98]">
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white border border-white/[0.1]">
                  Done
                </span>
                <span className="hidden sm:inline text-[#62666d]">Security</span>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span className="text-2xs font-mono text-[#62666d] w-16">TF-105</span>
                <span className="text-xs font-medium text-[#f7f8f8] group-hover:text-white transition-colors truncate">
                  Refactor global search query parsing with PostgreSQL ILIKE multi-column index
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-2xs font-mono text-[#8a8f98]">
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white border border-white/[0.1]">
                  Done
                </span>
                <span className="hidden sm:inline text-[#62666d]">Infrastructure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section id="features" className="py-24 border-t border-white/[0.08] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="max-w-2xl space-y-3">
            <span className="text-2xs font-mono text-[#8a8f98] uppercase tracking-wider font-semibold">
              Engineered For Velocity
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Crafted to perfection. <br />
              Built for speed.
            </h2>
            <p className="text-sm sm:text-base text-[#8a8f98] leading-relaxed">
              Every detail is engineered to eliminate friction. Zero waiting, minimal clicks, and instant keyboard shortcuts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1 */}
            <div className="p-8 rounded-xl bg-[#0f1011] border border-white/[0.08] space-y-4 hover:border-white/[0.15] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Keyboard-First Navigation
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Triage tasks without lifting your fingers from the keys. Press <kbd className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">C</kbd> to create, <kbd className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">⌘K</kbd> to search, and navigate lists instantly.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="p-8 rounded-xl bg-[#0f1011] border border-white/[0.08] space-y-4 hover:border-white/[0.15] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Multi-Tenant Global Search
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Unified search engine indexing issues, projects, and teammates with debounced query optimization and tenant isolation.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="p-8 rounded-xl bg-[#0f1011] border border-white/[0.08] space-y-4 hover:border-white/[0.15] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                HTTP-Only Cookie Security
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Strict enterprise session security. Zero auth tokens exposed in localStorage, preventing XSS and token harvesting vulnerabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Pillars (Linear Method) */}
      <section id="workflow" className="py-24 border-t border-white/[0.08] bg-[#0a0b0d]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-2xs font-mono text-[#8a8f98] uppercase tracking-wider font-semibold">
              The Linear Method
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Direction and momentum.
            </h2>
            <p className="text-sm text-[#8a8f98] leading-relaxed">
              Software development is not a checklist. It is a continuous cadence of cycles, roadmaps, and triage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-xl bg-[#121316] border border-white/[0.08] space-y-4 hover:border-white/[0.15] transition-colors">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-white" />
                <span>01. CYCLES</span>
              </div>
              <h3 className="text-base font-semibold text-white">
                Build momentum
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Cycles focus work into manageable iteration sprints. Automated rollover keeps backlogs organized and teams unblocked.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-[#121316] border border-white/[0.08] space-y-4 hover:border-white/[0.15] transition-colors">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-white" />
                <span>02. ROADMAPS</span>
              </div>
              <h3 className="text-base font-semibold text-white">
                Set direction
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Connect individual daily tasks to overarching initiatives and quarterly company milestones without spreadsheet overhead.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-[#121316] border border-white/[0.08] space-y-4 hover:border-white/[0.15] transition-colors">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>03. TRIAGE</span>
              </div>
              <h3 className="text-base font-semibold text-white">
                Inbox zero for bugs
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Review, prioritize, and assign incoming bugs and requests before they clutter your active sprint backlog.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Showcase */}
      <section id="keyboard" className="py-24 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-2xs font-mono text-[#8a8f98] uppercase tracking-wider font-semibold">
              Power User Workflows
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Fly through tasks at the speed of thought.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { key: "C", action: "Create issue", desc: "Draft from anywhere" },
              { key: "⌘K", action: "Command palette", desc: "Global fuzzy search" },
              { key: "S", action: "Change status", desc: "Backlog to Done" },
              { key: "P", action: "Set priority", desc: "Low to Urgent" },
              { key: "ESC", action: "Close / Dismiss", desc: "Return to view" },
            ].map((shortcut) => (
              <div
                key={shortcut.key}
                className="p-4 rounded-lg bg-[#0f1011] border border-white/[0.08] space-y-2 hover:border-white/[0.15] transition-colors"
              >
                <kbd className="inline-block px-2 py-1 rounded bg-[#18191c] border border-white/[0.15] font-mono text-xs text-white font-bold">
                  {shortcut.key}
                </kbd>
                <div className="text-xs font-semibold text-white pt-1">{shortcut.action}</div>
                <div className="text-[11px] text-[#8a8f98]">{shortcut.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Standards */}
      <section id="architecture" className="py-24 border-t border-white/[0.08] bg-[#0a0b0d]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-2xs font-mono text-[#8a8f98] uppercase tracking-wider font-semibold">
              Enterprise Grade
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Built on uncompromising foundations.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-[#0f1011] border border-white/[0.08] space-y-2">
              <span className="text-xs font-semibold text-white block">
                Next.js App Router
              </span>
              <p className="text-2xs text-[#8a8f98] leading-relaxed">
                Streaming SSR, Turbopack builds, and modular route hierarchies.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0f1011] border border-white/[0.08] space-y-2">
              <span className="text-xs font-semibold text-white block">
                PostgreSQL ACID
              </span>
              <p className="text-2xs text-[#8a8f98] leading-relaxed">
                Relational foreign key constraints and isolated multi-tenant records.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0f1011] border border-white/[0.08] space-y-2">
              <span className="text-xs font-semibold text-white block">
                Zero Client Token Leakage
              </span>
              <p className="text-2xs text-[#8a8f98] leading-relaxed">
                Tamper-proof HTTP-only SameSite cookies protected against CSRF and XSS.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0f1011] border border-white/[0.08] space-y-2">
              <span className="text-xs font-semibold text-white block">
                Monochrome Aesthetic
              </span>
              <p className="text-2xs text-[#8a8f98] leading-relaxed">
                Linear-inspired high-contrast black and white productivity design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-24 border-t border-white/[0.08] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-white">
            Built for the teams of tomorrow. <br />
            Start building today.
          </h2>
          <p className="text-base text-[#8a8f98] max-w-xl mx-auto leading-relaxed">
            Create your workspace in seconds. Experience uncompromised software development velocity.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white hover:bg-neutral-200 text-[#08090a] text-sm font-semibold transition-colors shadow-subtle"
            >
              <span>Get started for free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-10 px-4 sm:px-6 bg-[#08090a]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62666d]">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-bold">
              <Layers className="w-3 h-3 text-black" />
            </div>
            <span className="font-semibold text-white">TeamFlow</span>
            <span>&copy; {new Date().getFullYear()} TeamFlow, Inc.</span>
          </div>

          <div className="flex items-center gap-6 text-[#8a8f98]">
            <Link href="/login" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Sign up
            </Link>
            <Link href="/workspace" className="hover:text-white transition-colors">
              Workspace
            </Link>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
