import Link from "next/link";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
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

const singleText =
  "[💔🔍] #CGM48_LetMeKnow\n\n\n#KoiTsunjattaTH\n#BINGOTH #KibouResshaTH\n#CGM4811thSINGLE\n#CGM48";
const singleUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(singleText)}`;

const TREND_GROUPS = [
  {
    date: "1 ก.ค. 2569",
    buttons: [
      { time: "12:00", member: "Nana" },
      { time: "12:30", member: "Nisha" },
      { time: "13:00", member: "Ploen" },
    ],
  },
  {
    date: "2 ก.ค. 2569",
    buttons: [
      { time: "12:00", member: "Prae" },
      { time: "12:30", member: "Shanae" },
    ],
  },
  {
    date: "3 ก.ค. 2569",
    buttons: [{ time: "12:00", member: "Jingjing" }],
  },
];

function trendTweetUrl(member: string) {
  const text = `${member.toUpperCase()} LET ME KNOW\n#CGM48_LetMeKnow\n#${member}CGM48`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export const metadata = {
  title: "Single 11 — Easy Mickey",
};

export default function Single11Page() {
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
            Posts about CGM48 11th Single
          </h1>
          <p className="mt-1 text-sm text-[#6a6880]">
            คลิกเพื่อโพสต์เกี่ยวกับ CGM48 11th Single บน X
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <a
          href={singleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d1a20] to-[#0a0f1a] py-4 text-base font-semibold text-red-400 shadow-[0_0_24px_rgba(34,211,238,0.1)] transition-all hover:border-cyan-400/60 hover:text-red-300 hover:shadow-[0_0_32px_rgba(34,211,238,0.2)] active:scale-95"
        >
          <XIcon />
          โพสต์เกี่ยวกับ Single 11
        </a>

        <section className="mt-8">
          <h2 className="mb-3 text-2xl font-bold text-[#f0eff8]">
            Trend Tags บน X เริ่มก่อนเวลา 15 นาที
          </h2>

          <div className="space-y-5">
            {TREND_GROUPS.map((group) => (
              <div key={group.date}>
                <p className="mb-2 text-sm font-semibold text-[#f0eff8]">
                  {group.date}
                </p>
                <div className="space-y-2">
                  {group.buttons.map((b) => (
                    <a
                      key={`${group.date}-${b.member}`}
                      href={trendTweetUrl(b.member)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d1a20] to-[#0a0f1a] py-3 text-sm font-semibold text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.1)] transition-all hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-[0_0_32px_rgba(34,211,238,0.2)] active:scale-95"
                    >
                      <XIcon />
                      {b.time} {b.member}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
