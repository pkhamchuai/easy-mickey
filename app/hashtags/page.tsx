"use client";

import Link from "next/link";
import { useState } from "react";

const TWITTER_LIMIT = 280;

const HASHTAG_GROUPS = [
  {
    label: "11th Single",
    tags: ["#CGM48_LetMeKnow", "#KoiTsunjattaTH", "#BINGOTH", "#KibouResshaTH", "#CGM4811thSINGLE"],
  },
  {
    label: "CGM48 2nd Generation",
    tags: ["#EmmaCGM48", "#GinnaCGM48", "#JingjingCGM48", "#LookkedCGM48", "#NanaCGM48"],
  },
  {
    label: "CGM48 3rd Generation",
    tags: ["#KwanCGM48", "#LinglingCGM48", "#PloenCGM48", "#PraeCGM48"],
  },
  {
    label: "CGM48 4th Generation",
    tags: ["#ElseCGM48", "#HongyokCGM48", "#NishaCGM48", "#PraifaCGM48", "#SatangpoundCGM48", "#ShanaeCGM48", "#ValentineCGM48"],
  },
  {
    label: "CGM48 5th Generation",
    tags: ["#ChifaCGM48", "#LewlewCGM48", "#NamphetCGM48", "#PunponCGM48", "#TaraCGM48"],
  },
  {
    label: "ETC",
    tags: [
      "#CGM48", "#CGM481stGeneration", "#CGM482ndGeneration", "#CGM483rdGeneration",
      "#CGM484thGEN", "#CGM484thGeneration", "#CGM485thGeneration",
      "#CGM48PopupLive", "#CGM48PopupLiveOnTour", "#CGM48RESET", "#CGM48_StageRESET", "#CGM48TeamC",
      "🐭🍀", "🌟",
    ],
  },
  {
    label: "Former members",
    tags: [
      "#AliceyInJuly", "#Angelnpssn", "#AomPunyawee", "#Chaespr", "#ChampooKodcha",
      "#FallinFromFah", "#FortuneKeiths", "#FortunePundita", "#JadaeJayda", "#KaiwanManita", "#KaningV",
      "#Kimmeii", "#kylakh00", "#MarminkMani", "#Meenpitch", "#MELLFIAS", "#nenatwenty7", "#nenattarika",
      "#NeniePhitchayapha", "#PingPhorest", "#Pimwarin", "#Pitchameen", "#Pepo_Mellfias", "#PunchWatcharee",
      "#RinaIzuta", "#Runma333", "#RunmaShishida", "#SitaTeeradechsakul", "#Tinmatomato",
    ],
  },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default function HashtagsPage() {
  const [text, setText] = useState("");
  const remaining = TWITTER_LIMIT - text.length;
  const isOver = remaining < 0;
  const isNearLimit = remaining <= 20 && !isOver;

  function addTag(tag: string) {
    setText((prev) => {
      const spacer = prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : "";
      return prev + spacer + tag;
    });
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <main className="min-h-screen bg-[#0a0a12]">
      <header
        className="px-4 pb-6 pt-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,211,238,0.10) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#9896b0] transition-colors hover:text-[#f0eff8]"
          >
            <BackIcon />
            กลับหน้าแรก
          </Link>
          <h1 className="text-2xl font-bold text-[#f0eff8]">
            โพสต์บน X ด้วย # อื่น
          </h1>
          <p className="mt-1 text-sm text-[#6a6880]">
            คลิกเพื่อโพสต์บน X พร้อม # อื่น
          </p>
          <p className="mt-0.5 text-sm text-[#6a6880]">
            โปรดระวัง แค่ 3 hashtags แรกจะขึ้นใน tag เท่านั้น
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-16 pt-4 space-y-4">
        {/* Text field */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="พิมพ์ข้อความที่นี่..."
            rows={5}
            className="w-full rounded-2xl border border-[#2a2a3d] bg-[#13131e] px-4 py-3 text-sm leading-relaxed text-[#f0eff8] placeholder-[#4a4860] outline-none transition-colors focus:border-cyan-500/50 focus:ring-0 resize-none"
          />
          <span
            className={`absolute bottom-3 right-4 text-xs font-medium tabular-nums ${
              isOver
                ? "text-red-400"
                : isNearLimit
                ? "text-yellow-400"
                : "text-[#4a4860]"
            }`}
          >
            {remaining}
          </span>
        </div>

        {/* Post button */}
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex w-full items-center justify-center gap-3 rounded-2xl border py-4 text-base font-semibold transition-all active:scale-95 ${
            isOver || text.trim().length === 0
              ? "pointer-events-none border-[#2a2a3d] text-[#4a4860]"
              : "border-cyan-500/30 bg-gradient-to-r from-[#0d1a20] to-[#0a0f1a] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.1)] hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-[0_0_32px_rgba(34,211,238,0.2)]"
          }`}
        >
          <XIcon />
          โพสต์บน X
        </a>

        {/* Hashtag buttons grouped */}
        <div className="space-y-4">
          {HASHTAG_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#6a6880]">
                {group.label}
              </p>
              {group.tags.length === 0 ? (
                <p className="text-xs text-[#3a3850] italic">— coming soon —</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="rounded-full border border-[#2a2a3d] bg-[#13131e] px-3 py-1.5 text-sm text-[#9896b0] transition-all hover:border-cyan-500/40 hover:text-cyan-300 active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
