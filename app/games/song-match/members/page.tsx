import type { Metadata } from "next";
import Link from "next/link";
import { readPublicSongMatchCatalog } from "@/lib/song-match/public-catalog";

export const metadata: Metadata = {
  title: "เพลงที่เมมเบอร์เลือก — Easy Mickey",
  description: "ดูเพลง GE 2026 สามอันดับที่เมมเบอร์แต่ละคนเลือก",
};

export const dynamic = "force-dynamic";

export default async function SongMatchMembersPage() {
  const catalog = await readPublicSongMatchCatalog();
  const songsById = new Map(catalog.songs.map((song) => [song.id, song]));

  return (
    <main className="min-h-screen bg-[#0a0a12] pb-16">
      <header
        className="px-4 pb-8 pt-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,114,182,0.13) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex text-sm text-[#9896b0] transition hover:text-white">
            ‹ กลับหน้าแรก
          </Link>
          <p className="mt-7 text-xs font-medium uppercase tracking-[0.2em] text-pink-400/70">
            GE 2026 Song Match
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">เพลงที่เมมเบอร์เลือก</h1>
          <p className="mt-2 text-sm text-[#9896b0]">
            {catalog.members.length} เมม · กดที่รูปเพื่อดูและฟังเพลงทั้ง 3 อันดับ
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-3 sm:px-4">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
          {catalog.members.map((member) => (
            <Link
              key={member.id}
              href={`/games/song-match/members/${encodeURIComponent(member.id)}`}
              className="group min-w-0 overflow-hidden rounded-xl border border-[#2a2a3d] bg-[#13131e] transition hover:-translate-y-0.5 hover:border-pink-400/50 hover:bg-[#181522] sm:rounded-2xl"
            >
              <div className="aspect-[3/4] overflow-hidden bg-[#1d1d2b]">
                {/* รูปมาจาก URL ที่ผู้ดูแลกำหนดในฐานข้อมูล จึงไม่จำกัด hostname ผ่าน next/image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-2 sm:p-4">
                <h2 className="truncate text-center text-sm font-semibold text-white sm:text-lg">
                  {member.name}
                </h2>
                <ol className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
                  {member.picks.map((songId, index) => {
                    const song = songsById.get(songId);
                    if (!song) return null;
                    return (
                      <li key={songId} className="flex min-w-0 items-start gap-1 text-[10px] leading-snug text-[#aaa8bc] sm:gap-1.5 sm:text-sm">
                        <span className="shrink-0 font-semibold text-pink-300">{index + 1}.</span>
                        <span className="line-clamp-2">{song.artist} - {song.title}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Link>
          ))}
        </div>

        {catalog.members.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2a2a3d] py-12 text-center text-sm text-[#6a6880]">
            ยังไม่มีข้อมูลเมมที่ Published
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link href="/games/song-match" className="rounded-xl border border-pink-500/30 py-3 text-center text-sm font-semibold text-pink-300 transition hover:bg-pink-500/10">
            เล่นเกม
          </Link>
          <Link href="/games/song-match/stats" className="rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-[#c8c6d6] transition hover:bg-white/5">
            ดูสถิติเพลง
          </Link>
        </div>
      </section>
    </main>
  );
}
