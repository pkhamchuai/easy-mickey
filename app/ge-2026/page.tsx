import Link from "next/link";

const agenda = [
  {
    title: "ช่วงเวลาโหวต",
    date: "1 ตุลาคม – 12 พฤศจิกายน 2026",
    dot: "🗳️",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    border: "border-sky-500/30",
    bg: "bg-[#0d1620]",
  },
  {
    title: "ประกาศผลครั้งสุดท้าย",
    date: "14 พฤศจิกายน 2026",
    dot: "💥",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
    border: "border-orange-500/30",
    bg: "bg-[#20150d]",
  },
];

export default function Ge2026Page() {
  return (
    <main className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <header
        className="relative px-4 pb-8 pt-14 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.14) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-[#9896b0] hover:text-cyan-400 transition"
          >
            ‹ กลับหน้าหลัก
          </Link>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
            BNK48 &amp; CGM48 GE2026
          </p>
          <h1
            className="mb-1 text-3xl font-bold"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Support Hongyok in GE2026
          </h1>
          <p className="text-sm text-[#9896b0]">
            ร่วมกันส่งหงษ์หยกไปสู่เส้นชัยใน GE 2026
          </p>
          <div className="mx-auto mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
            <span className="text-cyan-400/40 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
          </div>
        </div>
      </header>

      {/* Agenda */}
      <div className="mx-auto max-w-lg space-y-3 px-4 pb-16 pt-4">
        {agenda.map((item) => (
          <div
            key={item.title}
            className={`rounded-2xl border ${item.border} ${item.bg} p-4`}
          >
            <div className="flex gap-3">
              <span className="text-xl">{item.dot}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-white">
                  {item.title}
                </p>
                <p
                  className="mt-0.5 text-sm font-semibold"
                  style={{
                    background: item.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {item.date}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="mx-auto max-w-lg px-4">
          <p className="text-xs text-[#9896b0]">
            Easy Mickey · Mickey&apos;s House Fansite
          </p>
        </div>
      </footer>
    </main>
  );
}
