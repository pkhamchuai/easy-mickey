"use client";

import { useState } from "react";

type Entry = { id: string; url: string; status: "idle" | "downloading" | "done" | "error" };

function newEntry(url = ""): Entry {
  return { id: crypto.randomUUID(), url, status: "idle" };
}

async function downloadViaProxy(url: string, token: string, customFilename?: string) {
  const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`, {
    headers: { "x-tools-token": token },
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const nameMatch = disposition.match(/filename="([^"]+)"/);
  const filename = customFilename ?? nameMatch?.[1] ?? "download";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function Downloader({ token }: { token: string }) {
  const [parseUrl, setParseUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([newEntry()]);
  const [parseMeta, setParseMeta] = useState<{ member: string; postId: string } | null>(null);

  async function parseImages() {
    if (!parseUrl.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const res = await fetch(`/api/parse-images?url=${encodeURIComponent(parseUrl.trim())}`, {
        headers: { "x-tools-token": token },
      });
      const { images, member, postId, error } = await res.json();
      if (error) throw new Error(error);
      if (!images?.length) throw new Error("No images found");
      setParseMeta({ member, postId });
      setEntries(images.map((url: string) => newEntry(url)));
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed");
    } finally {
      setParsing(false);
    }
  }

  function update(id: string, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addRow() {
    setEntries((prev) => [...prev, newEntry()]);
  }

  function removeRow(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function downloadOne(entry: Entry) {
    if (!entry.url.trim()) return;
    update(entry.id, { status: "downloading" });
    try {
      const index = entries.indexOf(entry) + 1;
      const ext = entry.url.split(".").pop()?.split("?")[0] || "jpg";
      const filename = parseMeta
        ? `${parseMeta.member}_${parseMeta.postId}_${index}.${ext}`
        : undefined;
      await downloadViaProxy(entry.url.trim(), token, filename);
      update(entry.id, { status: "done" });
    } catch {
      update(entry.id, { status: "error" });
    }
  }

  async function downloadAll() {
    for (const entry of entries) {
      if (entry.url.trim()) await downloadOne(entry);
    }
  }

  const statusLabel = (s: Entry["status"]) =>
    ({ idle: "", downloading: "↓", done: "✓", error: "✕" })[s];

  const statusColor = (s: Entry["status"]) =>
    ({ idle: "", downloading: "text-cyan-400", done: "text-green-400", error: "text-red-400" })[s];

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
        File Downloader
      </h2>
      <div className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4 space-y-4">

        {/* Parse timeline URL */}
        <div className="space-y-2">
          <p className="text-xs text-[#6a6880]">Paste a timeline URL to extract images</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-2 text-sm text-[#f0eff8] placeholder-[#6a6880]"
              placeholder="https://app.bnk48.com/timeline/content-member-timeline/…"
              value={parseUrl}
              onChange={(e) => { setParseUrl(e.target.value); setParseError(""); }}
            />
            <button
              onClick={parseImages}
              disabled={!parseUrl.trim() || parsing}
              className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {parsing ? "…" : "Get images"}
            </button>
          </div>
          {parseError && <p className="text-xs text-red-400">{parseError}</p>}
        </div>

        <div className="border-t border-[#2a2a3d]" />

        {/* URL list */}
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-2 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                placeholder="Image or video URL"
                value={entry.url}
                onChange={(e) => update(entry.id, { url: e.target.value, status: "idle" })}
              />
              <span className={`w-4 shrink-0 text-center text-sm ${statusColor(entry.status)}`}>
                {statusLabel(entry.status)}
              </span>
              <button
                onClick={() => downloadOne(entry)}
                disabled={!entry.url.trim() || entry.status === "downloading"}
                className="rounded-lg border border-[#2a2a3d] px-3 py-2 text-xs text-[#9896b0] hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              {entries.length > 1 && (
                <button
                  onClick={() => removeRow(entry.id)}
                  className="rounded-lg border border-red-500/30 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/10"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="rounded-lg border border-dashed border-[#2a2a3d] px-3 py-2 text-xs text-[#6a6880] hover:border-cyan-500/30 hover:text-cyan-400"
          >
            + Add URL
          </button>
          {entries.filter((e) => e.url.trim()).length > 1 && (
            <button
              onClick={downloadAll}
              className="rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
            >
              Download all
            </button>
          )}
        </div>

        <p className="text-xs text-[#6a6880]">
          Videos may not download if the host blocks direct access.
        </p>
      </div>
    </section>
  );
}
