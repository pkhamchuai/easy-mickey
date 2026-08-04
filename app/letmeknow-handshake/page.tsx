import Link from "next/link";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const handshakeText = "[💔🔍] #CGM48_LetMeKnow_Handshake";
const handshakeUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(handshakeText)}`;

const schedule = [
  {
    round: "Round 2: ชุดโลลิต้า + หูแมว",
    line: "12:00 - 13:00 LANE 5",
    close: "12:45",
    dot: "🔵",
    gradient: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
    border: "border-pink-500/30",
    bg: "bg-[#200d17]",
  },
  {
    round: "Round 5: ชุด Let me know",
    line: "15:00 - 16:00 LANE 3",
    close: "15:45",
    dot: "🟣",
    gradient: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
    border: "border-purple-500/30",
    bg: "bg-[#160d20]",
  },
  {
    round: "SPECIAL 2: ชุดรถบัสปาฏิหาริย์",
    line: null,
    close: null,
    start: "17:30",
    dot: "🟠",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
    border: "border-orange-500/30",
    bg: "bg-[#20150d]",
  },
];

export const metadata = {
  title: "Let me know! Handshake — Easy Mickey",
};

export default function LetMeKnowHandshakePage() {
  return (
    <main className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <header
        className="relative px-4 pb-8 pt-14 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(219,39,119,0.14) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-[#9896b0] hover:text-pink-400 transition"
          >
            ‹ กลับหน้าหลัก
          </Link>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
            CGM48 11th Single
          </p>
          <h1
            className="mb-1 text-3xl font-bold"
            style={{
              background: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            &ldquo;Koi Tsunjatta – Let me know!&rdquo;
            <br />
            Handshake Event
          </h1>
          <p className="mt-2 text-sm text-[#9896b0]">🗓️ 2 AUG 2026</p>
          <p className="text-sm text-[#9896b0]">
            📍 ลานกิจกรรมชั้น 4 หน้า Major Cineplex, Central Chiangmai Airport
          </p>
          <div className="mx-auto mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pink-500/30" />
            <span className="text-pink-400/40 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pink-500/30" />
          </div>
        </div>
      </header>

      {/* Post button */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <a
          href={handshakeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-pink-500/30 bg-gradient-to-r from-[#200d17] to-[#0a0f1a] py-4 text-base font-semibold text-pink-300 shadow-[0_0_24px_rgba(219,39,119,0.1)] transition-all hover:border-pink-400/60 hover:text-pink-200 hover:shadow-[0_0_32px_rgba(219,39,119,0.2)] active:scale-95"
        >
          <XIcon />
          โพสต์ #CGM48_LetMeKnow_Handshake
        </a>
      </div>

      {/* Schedule */}
      <div className="mx-auto max-w-lg space-y-8 px-4 pb-16 pt-8">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
            ตารางเวลาของ HONGYOK
          </h2>
          <div className="space-y-3">
            {schedule.map((slot) => (
              <div
                key={slot.round}
                className={`rounded-2xl border ${slot.border} ${slot.bg} p-4`}
              >
                <div className="flex gap-4">
                  <div className="w-16 shrink-0 pt-0.5 text-lg">{slot.dot}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-white">
                      {slot.round}
                    </p>
                    {slot.line && (
                      <p
                        className="mt-1 text-sm font-semibold"
                        style={{
                          background: slot.gradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {slot.line}
                      </p>
                    )}
                    {slot.close && (
                      <p className="mt-1 text-xs text-[#9896b0]">
                        เวลาปิดเลน (Lane Close): {slot.close}
                      </p>
                    )}
                    {slot.start && (
                      <p className="mt-1 text-xs text-[#9896b0]">
                        เริ่มเวลา: {slot.start}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="mx-auto max-w-lg px-4">
          <p className="text-xs text-[#9896b0]">
            Easy Mickey · Hongyok CGM48 Fansite
          </p>
        </div>
      </footer>
    </main>
  );
}
