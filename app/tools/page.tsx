import Link from "next/link";
import { kv } from "@vercel/kv";
import staffFallback from "@/data/tweet-templates-staff.json";
import { LiveCoverDownloader } from "@/components/LiveCoverDownloader";
import { Downloader } from "@/components/Downloader";
import { TokenGate } from "@/components/TokenGate";

type Template = { id: string; label: string; text: string };

async function getStaffTemplates(): Promise<Template[]> {
  try {
    const data = await kv.get<Template[]>("tweet-templates-staff");
    return data ?? staffFallback;
  } catch {
    return staffFallback;
  }
}

function thaiDate() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = String(now.getFullYear() + 543).slice(-2);
  return `${d}/${m}/${y}`;
}

function resolveTemplate(text: string) {
  return text.replace("{date}", thaiDate());
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

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

  const staffTemplates = await getStaffTemplates();

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
            X Posts
          </h2>
          <div className="space-y-2">
            {staffTemplates.map((t) => (
              <a
                key={t.id}
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(resolveTemplate(t.text))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a3d] bg-[#13131e] px-4 py-3 transition-all hover:border-cyan-500/40 hover:bg-[#0d1a1f] active:scale-[0.98]"
              >
                <span className="text-sm font-medium text-[#f0eff8]">{t.label || <span className="text-[#6a6880]">(no label)</span>}</span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/30 px-3 py-1 text-xs font-medium text-cyan-300">
                  <XIcon />
                  โพสต์
                </span>
              </a>
            ))}
            {staffTemplates.length === 0 && (
              <p className="text-sm text-[#6a6880]">No staff templates yet.</p>
            )}
          </div>
        </section>

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
