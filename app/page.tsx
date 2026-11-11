import { existsSync } from "fs";
import { join } from "path";
import { HongyokLinks } from "@/components/HongyokLinks";
import { TwitterIntent } from "@/components/TwitterIntent";
import { PageViewCounter } from "@/components/PageViewCounter";

const SHOW_HANDSHAKE_EVENT = false;
const profileExt = ["jpg", "png"].find((ext) =>
  existsSync(join(process.cwd(), "public", `hongyok-profile.${ext}`))
);
const profileSrc = profileExt ? `/hongyok-profile.${profileExt}` : null;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a12]">
      {/* Hero */}
      <header
        className="relative px-4 pb-8 pt-14 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.14) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-lg">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
            Hongyok CGM48 Fansite
          </p>
          <h1
            className="mb-1 text-5xl font-bold"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Easy Mickey
          </h1>
          <p className="text-sm text-[#9896b0]">
            หงษ์หยก · Hongyok CGM48
          </p>

          {/* Profile image */}
          {profileSrc && (
            <div className="mx-auto mt-5 h-28 w-28 overflow-hidden rounded-full ring-2 ring-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profileSrc}
                alt="หงษ์หยก CGM48"
                className="h-full w-full object-cover object-top"
              />
            </div>
          )}

          {/* Decorative divider */}
          <div className="mx-auto mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
            <span className="text-cyan-400/40 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-lg space-y-10 px-4 pb-10 pt-2">
        <div>
          <a
            href="/ge-2026"
            className="flex w-full items-center justify-between rounded-2xl border border-cyan-500/30 bg-[#0d1a1f] px-5 py-4 transition hover:border-cyan-400/60 hover:bg-[#0f2028]"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💥🗳️</span>
              <div className="text-left">
                <p className="font-semibold" style={{ background: "linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Support Hongyok in GE2026
                </p>
                <p className="text-xs text-[#9896b0]">1 ตุลาคม – 12 พฤศจิกายน 2026</p>
              </div>
            </div>
            <span className="text-cyan-400/60 text-lg">›</span>
          </a>
        </div>
        <a
          href="/ge-2026/prediction"
          className="flex w-full items-center justify-between rounded-2xl border border-purple-400/30 bg-[#181225] px-5 py-4 transition hover:border-purple-300/60 hover:bg-[#21192e]"
        >
          <span className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">📊</span>
            <span>
              <span className="block font-semibold text-purple-200">คาดการณ์คะแนนโหวต GE2026</span>
            </span>
          </span>
          <span className="text-lg text-purple-300/60">›</span>
        </a>
        {SHOW_HANDSHAKE_EVENT && (
          <div>
            <a
              href="/letmeknow-handshake"
              className="flex w-full items-center justify-between rounded-2xl border border-pink-500/30 bg-[#200d17] px-5 py-4 transition hover:border-pink-400/60 hover:bg-[#28101d]"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💔</span>
                <div className="text-left">
                  <p className="font-semibold" style={{ background: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Let me know! Handshake Event
                  </p>
                  <p className="text-xs text-[#9896b0]">2 สิงหาคม 2026</p>
                </div>
              </div>
              <span className="text-pink-400/60 text-lg">›</span>
            </a>
          </div>
        )}
        <TwitterIntent />
        <HongyokLinks />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="mx-auto max-w-lg px-4 flex flex-col items-center gap-3">
          <PageViewCounter page="home" />
          <p className="text-xs text-[#9896b0]">
            Build and maintain by X:{" "}
            <a
              href="https://x.com/chibii39"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              @chibii39
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
