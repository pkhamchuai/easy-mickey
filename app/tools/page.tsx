import Link from "next/link";
import { LiveCoverDownloader } from "@/components/LiveCoverDownloader";
import { Downloader } from "@/components/Downloader";
import { TokenGate } from "@/components/TokenGate";

type Props = { searchParams: Promise<{ token?: string }> };

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default async function ToolsPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const validTokens = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  if (!token || !validTokens.includes(token)) return <TokenGate />;

  return (
    <main className="min-h-screen bg-[#0a0a12]">
      <header className="border-b border-[#2a2a3d] px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
            Staff Tools
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-[#f0eff8]">
            Easy Mickey Tools
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-10">
        <LiveCoverDownloader token={token} />
        <Downloader token={token} />

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
            Schedule
          </h2>
          <Link
            href={`/tools/schedule?token=${encodeURIComponent(token)}`}
            className="flex items-center justify-between rounded-2xl border border-[#2a2a3d] bg-[#13131e] px-4 py-4 text-sm font-medium text-[#f0eff8] transition-all hover:border-cyan-500/30 hover:bg-[#0d1a1f] hover:text-cyan-300 active:scale-[0.98]"
          >
            Schedule Editor
            <ChevronIcon />
          </Link>
        </section>
      </div>
    </main>
  );
}
