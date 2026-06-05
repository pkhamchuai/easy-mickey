import Link from "next/link";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { TokenGate } from "@/components/TokenGate";

type Props = { searchParams: Promise<{ token?: string }> };

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default async function ToolsSchedulePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const validTokens = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  if (!token || !validTokens.includes(token)) return <TokenGate />;

  return (
    <main className="min-h-screen bg-[#0a0a12]">
      <header className="border-b border-[#2a2a3d] px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/tools?token=${encodeURIComponent(token)}`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-[#9896b0] transition-colors hover:text-[#f0eff8]"
          >
            <BackIcon />
            Back to Tools
          </Link>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
            Staff Tools
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-[#f0eff8]">
            Schedule Editor
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <ScheduleEditor token={token} />
      </div>
    </main>
  );
}
