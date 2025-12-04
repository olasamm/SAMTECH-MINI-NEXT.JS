"use client";

import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-6 sm:px-6 lg:px-8">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-purple-500 to-cyan-400 text-lg font-black tracking-tight text-white shadow-soft">
                S
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-100">
                  SAMTECH MINI
                </p>
                <p className="text-xs text-slate-400">
                  Modern social micro-posting playground
                </p>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}


