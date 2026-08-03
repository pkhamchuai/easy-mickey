import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readPublicSongMatchCatalog } from "@/lib/song-match/public-catalog";
import { youtubeVideoId } from "@/lib/song-match/youtube";

type Props = {
  params: Promise<{ memberId: string }>;
};

export const metadata: Metadata = {
  title: "เพลงที่เมมเบอร์เลือก — Easy Mickey",
  description: "ดูและฟังเพลง GE 2026 สามอันดับที่เมมเบอร์เลือก",
};

export const dynamic = "force-dynamic";

export default async function SongMatchMemberPage({ params }: Props) {
  const { memberId } = await params;
  const catalog = await readPublicSongMatchCatalog();
  const member = catalog.members.find((item) => item.id === memberId);
  if (!member) notFound();

  const songsById = new Map(catalog.songs.map((song) => [song.id, song]));
  const picks = member.picks.flatMap((songId) => {
    const song = songsById.get(songId);
    return song ? [song] : [];
  });

  return (
    <main className="min-h-screen bg-[#0a0a12] pb-16">
      <header
        className="px-4 pb-8 pt-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,114,182,0.15) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-3xl">
          <Link href="/games/song-match/members" className="inline-flex text-sm text-[#9896b0] transition hover:text-white">
            ‹ ดูเมมเบอร์ทั้งหมด
          </Link>
          <div className="mt-7 flex items-center gap-4 sm:gap-5">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-pink-400/20 bg-[#1d1d2b] sm:h-32 sm:w-28">
              {/* รูปมาจาก URL ที่ผู้ดูแลกำหนดในฐานข้อมูล จึงไม่จำกัด hostname ผ่าน next/image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover object-top" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400/70">GE 2026 Song Match</p>
              <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">{member.name}</h1>
              <p className="mt-2 text-sm text-[#9896b0]">เพลงที่เลือก 3 อันดับ</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-5 px-4">
        {picks.map((song, index) => {
          const videoId = youtubeVideoId(song.youtubeUrl);
          return (
            <article key={song.id} className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-400/10 text-sm font-bold text-pink-300">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/70">{song.artist || "ไม่ระบุวง"}</p>
                  <h2 className="mt-0.5 text-lg font-semibold leading-snug text-white sm:text-xl">{song.title}</h2>
                </div>
              </div>
              {videoId && (
                <iframe
                  className="mt-4 aspect-video w-full rounded-xl border border-white/10"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={`${member.name} อันดับ ${index + 1}: ${song.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              )}
            </article>
          );
        })}

        <div className="grid grid-cols-2 gap-3 pt-3">
          <Link href="/games/song-match/members" className="rounded-xl border border-pink-500/30 py-3 text-center text-sm font-semibold text-pink-300 transition hover:bg-pink-500/10">
            ดูเมมทั้งหมด
          </Link>
          <Link href="/" className="rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-[#c8c6d6] transition hover:bg-white/5">
            กลับหน้าแรก
          </Link>
        </div>
      </section>
    </main>
  );
}
