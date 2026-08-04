import type { Metadata } from "next";
import Link from "next/link";
import { YouTubePlayer } from "@/components/song-match/YouTubePlayer";
import { readPublicSongMatchCatalog } from "@/lib/song-match/public-catalog";
import { createSongStats } from "@/lib/song-match/stats";
import { youtubeVideoId } from "@/lib/song-match/youtube";

export const metadata: Metadata = {
  title: "สถิติเพลง GE 2026 — Easy Mickey",
  description: "ดูว่าแต่ละเพลงมีเมมเลือกกี่คน พร้อมอันดับที่เมมเลือก",
};

export const dynamic = "force-dynamic";

function SongVideo({ youtubeUrl, title }: { youtubeUrl: string; title: string }) {
  const videoId = youtubeVideoId(youtubeUrl);
  if (!videoId) return null;

  return <YouTubePlayer videoId={videoId} title={`${title} YouTube video`} className="mt-4" />;
}

export default async function SongMatchStatsPage() {
  const catalog = await readPublicSongMatchCatalog();
  const stats = createSongStats(catalog);

  return (
    <main className="min-h-screen bg-[#0a0a12] pb-16">
      <header
        className="px-4 pb-8 pt-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,114,182,0.13) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="inline-flex text-sm text-[#9896b0] transition hover:text-white">
            ‹ กลับหน้าแรก
          </Link>
          <p className="mt-7 text-xs font-medium uppercase tracking-[0.2em] text-pink-400/70">
            GE 2026 Song Match
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">สถิติเพลงที่เมมเลือก</h1>
          <p className="mt-2 text-sm text-[#9896b0]">
            {catalog.members.length} เมม · {stats.length} เพลง · เรียงจากเพลงที่ถูกเลือกมากที่สุด
          </p>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2">
        {stats.map((stat, index) => (
          <article key={stat.song.id} className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-400/10 text-sm font-bold text-pink-300">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/70">
                      {stat.song.artist || "ไม่ระบุวง"}
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold leading-snug text-white">
                      {stat.song.title}
                    </h2>
                  </div>
                  <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1 text-sm font-semibold text-pink-200">
                    {stat.selections.length} คน
                  </span>
                </div>

                <SongVideo youtubeUrl={stat.song.youtubeUrl} title={stat.song.title} />

                <ul className="mt-4 flex flex-wrap gap-2">
                  {stat.selections.map((selection) => (
                    <li key={selection.memberId} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-[#c8c6d6]">
                      {selection.memberName}{" "}
                      <span className="text-xs text-[#7f7d92]">(อันดับ {selection.rank})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}

        {stats.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2a2a3d] py-12 text-center text-sm text-[#6a6880] sm:col-span-2">
            ยังไม่มีข้อมูลเพลงจากเมมที่ Published
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 sm:col-span-2">
          <Link href="/games/song-match" className="rounded-xl border border-pink-500/30 py-3 text-center text-sm font-semibold text-pink-300 transition hover:bg-pink-500/10">
            เล่นเกม
          </Link>
          <Link href="/" className="rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-[#c8c6d6] transition hover:bg-white/5">
            กลับหน้าแรก
          </Link>
        </div>
      </section>
    </main>
  );
}
