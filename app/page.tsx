import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { HongyokLinks } from "@/components/HongyokLinks";
import { ScheduleTable } from "@/components/ScheduleTable";
import { TwitterIntent } from "@/components/TwitterIntent";

const profileExt = ["jpg", "png"].find((ext) =>
  existsSync(join(process.cwd(), "public", `hongyok-profile.${ext}`))
);
const profileSrc = profileExt ? `/hongyok-profile.${profileExt}` : null;

let lastUpdate = "";
try {
  lastUpdate = execSync('git log -1 --format=%cd --date=format:"%d-%m-%Y"').toString().trim();
} catch {
  lastUpdate = "";
}

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
            Mickey&apos;s House Fansite
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
            href="/bon-odori-2026"
            className="flex w-full items-center justify-between rounded-2xl border border-cyan-500/30 bg-[#0d1a1f] px-5 py-4 transition hover:border-cyan-400/60 hover:bg-[#0f2028]"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🌟</span>
              <div className="text-left">
                <p className="font-semibold" style={{ background: "linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  ตารางกิจกรรม Bon Odori 2026
                </p>
                <p className="text-xs text-[#9896b0]">24–26 กรกฎาคม 2026</p>
              </div>
            </div>
            <span className="text-cyan-400/60 text-lg">›</span>
          </a>
        </div>
        <TwitterIntent />
        <ScheduleTable />
        <HongyokLinks />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="mx-auto max-w-lg px-4 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mickeys-house-logo.png" alt="Mickey's House" className="h-[60px] w-[60px] rounded-full object-cover" />
          <p className="text-xs text-[#9896b0]">
            Build and maintain by Mickey&apos;s House.<br />Since 05-06-2026{lastUpdate && `. Last update ${lastUpdate}`}.
          </p>
        </div>
      </footer>
    </main>
  );
}
