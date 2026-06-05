"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TokenGate() {
  const [token, setToken] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim()) router.push(`/tools?token=${encodeURIComponent(token.trim())}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a12] px-4">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-center text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
          Staff Tools
        </p>
        <h1 className="mb-6 text-center text-2xl font-bold text-[#f0eff8]">
          Easy Mickey
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            className="w-full rounded-xl border border-[#2a2a3d] bg-[#13131e] px-4 py-3 text-sm text-[#f0eff8] placeholder-[#6a6880] focus:border-cyan-500/50 focus:outline-none"
            placeholder="Enter your token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full rounded-xl bg-cyan-500/20 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
