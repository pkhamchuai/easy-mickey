import Link from "next/link";
import { SongMatchEditor } from "@/components/song-match/SongMatchEditor";
import { TokenGate } from "@/components/TokenGate";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function SongMatchToolsPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const validTokens = (process.env.TOOLS_TOKENS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!token || !validTokens.includes(token)) return <TokenGate />;

  return (
    <main className="min-h-screen bg-[#0a0a12]">
      <header className="border-b border-[#2a2a3d] px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <Link href={`/tools?token=${encodeURIComponent(token)}`} className="mb-3 inline-flex text-sm text-[#9896b0] transition hover:text-white">‹ Back to Tools</Link>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">Staff Tools</p>
          <h1 className="mt-0.5 text-2xl font-bold text-white">Song Match Data</h1>
          <p className="mt-1 text-sm text-[#6a6880]">จัดการเมม รูป และเพลงสามอันดับสำหรับเกม</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-16"><SongMatchEditor token={token} /></div>
    </main>
  );
}
