"use client";

import { useState } from "react";

const PREFIXES = [
  "https://app.bnk48.com/content-member-live-playback/",
  "https://app.bnk48.com/member-live/",
  "https://app.bnk48.com/member-playback/",
];

async function tryFetch(fullUrl: string, token: string) {
  const res = await fetch(
    `/api/live-cover?url=${encodeURIComponent(fullUrl)}`,
    { headers: { "x-tools-token": token } }
  );
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Failed");
  }
  return res;
}

export function LiveCoverDownloader({ token }: { token: string }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function download() {
    if (!url.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    const raw = url.trim();
    const isFullUrl = raw.startsWith("http://") || raw.startsWith("https://");
    const candidates = isFullUrl ? [raw] : PREFIXES.map((p) => p + raw);

    let res: Response | null = null;
    let lastError = "Failed";
    for (const candidate of candidates) {
      try {
        res = await tryFetch(candidate, token);
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Failed";
      }
    }

    if (!res) {
      setErrorMsg(lastError);
      setStatus("error");
      return;
    }

    try {
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;,\s]+)/i);
      const asciiMatch = disposition.match(/filename="([^"]+)"/);
      const filename = utf8Match
        ? decodeURIComponent(utf8Match[1])
        : asciiMatch?.[1] || "live-cover.jpg";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
        Live Cover Image
      </h2>
      <div className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4 space-y-3">
        <input
          className="w-full rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-2 text-sm text-[#f0eff8] placeholder-[#6a6880]"
          placeholder="Live ID or full URL"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setStatus("idle"); }}
        />
        <button
          onClick={download}
          disabled={!url.trim() || status === "loading"}
          className="w-full rounded-xl bg-cyan-500/20 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Downloading…" : "Live cover image"}
        </button>
        {status === "done" && (
          <p className="text-xs text-[#40E0D0]">Downloaded ✓</p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-400">{errorMsg}</p>
        )}
      </div>
    </section>
  );
}
