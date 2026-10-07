import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "../context/toast-context";
import { AuthProvider } from "../context/auth-context";
import { WorkspaceProvider } from "../context/workspace-context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TeamFlow — High-Performance Workspace for Engineering Teams",
  description:
    "Purpose-built issue tracking, project planning, and engineering velocity for modern software organizations.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-surface text-text-primary min-h-screen antialiased selection:bg-white selection:text-black`}
      >
        <ToastProvider>
          <AuthProvider>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
