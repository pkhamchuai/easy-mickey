"use client";

import { useState } from "react";

type Single = { id: string; label: string; folder: string };

const SINGLES: Single[] = [
  { id: "album3", label: "Album 3: Hokori no Oka", folder: "cgm48-10th-single" },
  { id: "single10", label: "Single 10: ได้(ด้าย)ไหม", folder: "cgm48-11th-single" },
  { id: "single11", label: "Single 11: Let me know", folder: "cgm48-let-me-know-single" },
];

const MEMBERS = [
  { name: "Chifa", cdn: "Chifa" },
  { name: "Else", cdn: "Else" },
  { name: "Emma", cdn: "Emma" },
  { name: "Ginna", cdn: "Ginna" },
  { name: "Hongyok", cdn: "Hongyok" },
  { name: "Jingjing", cdn: "Jingjing" },
  { name: "Kwan", cdn: "Kwan" },
  { name: "Lewlew", cdn: "Lewlew" },
  { name: "Lingling", cdn: "Lingling" },
  { name: "Lookked", cdn: "Lookked" },
  { name: "Namphet", cdn: "Namphet" },
  { name: "Nana", cdn: "Nana" },
  { name: "Nisha", cdn: "Nisha" },
  { name: "Ploen", cdn: "Ploen" },
  { name: "Prae", cdn: "Prae" },
  { name: "Praifa", cdn: "Praifa" },
  { name: "Punpon", cdn: "Punpon" },
  { name: "Satangpound", cdn: "Satangpound" },
  { name: "Shanae", cdn: "Shenae" },
  { name: "Tara", cdn: "Tara" },
  { name: "Valentine", cdn: "Valentine" },
];

const selectClass =
  "w-full rounded-2xl border border-[#2a2a3d] bg-[#13131e] px-4 py-3 text-sm font-medium text-[#f0eff8] outline-none transition-colors focus:border-cyan-500/50";

const buttonClass =
  "flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d1a20] to-[#0a0f1a] py-3 text-sm font-semibold text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.1)] transition-all hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-[0_0_32px_rgba(34,211,238,0.2)] active:scale-95 disabled:pointer-events-none disabled:opacity-40";

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function SingleImagePicker() {
  const [singleId, setSingleId] = useState("single11");
  const [memberName, setMemberName] = useState("Hongyok");
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const single = SINGLES.find((s) => s.id === singleId)!;
  const member = MEMBERS.find((m) => m.name === memberName)!;
  const imageUrl = `https://img.bnk48cdn.net/others/${single.folder}/half/H_${member.cdn}.png`;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadFile(
        `/api/single-image?single=${singleId}&member=${encodeURIComponent(memberName)}`,
        `${memberName}_${single.label}.png`
      );
    } catch {
      setImgError(true);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadAll() {
    setBulkProgress(`0/${MEMBERS.length}`);
    for (let i = 0; i < MEMBERS.length; i++) {
      const m = MEMBERS[i];
      setBulkProgress(`${i + 1}/${MEMBERS.length}`);
      try {
        await downloadFile(
          `/api/single-image?single=${singleId}&member=${encodeURIComponent(m.name)}`,
          `${m.name}_${single.label}.png`
        );
      } catch {
        // skip members whose image failed to fetch and continue with the rest
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    setBulkProgress("");
  }

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
        รูปโปรโมท Single
      </h2>

      <div className="space-y-3">
        <select
          value={singleId}
          onChange={(e) => {
            setSingleId(e.target.value);
            setImgError(false);
          }}
          className={selectClass}
        >
          {SINGLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={memberName}
          onChange={(e) => {
            setMemberName(e.target.value);
            setImgError(false);
          }}
          className={selectClass}
        >
          {MEMBERS.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a3d] bg-[#13131e]">
        {imgError ? (
          <p className="p-6 text-center text-sm text-[#6a6880]">
            ไม่พบรูปภาพสำหรับตัวเลือกนี้
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`${member.name} - ${single.label}`}
            className="w-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={handleDownload}
          disabled={downloading || imgError || bulkProgress !== ""}
          className={buttonClass}
        >
          {downloading ? "กำลังโหลด…" : `ดาวน์โหลดรูป ${member.name}`}
        </button>

        <button
          onClick={handleDownloadAll}
          disabled={bulkProgress !== "" || downloading}
          className={buttonClass}
        >
          {bulkProgress ? `กำลังโหลดทั้งหมด… ${bulkProgress}` : "ดาวน์โหลดรูปทุกคนของ Single นี้"}
        </button>
      </div>
    </section>
  );
}
