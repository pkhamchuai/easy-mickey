import Link from "next/link";

const schedule = [
  {
    day: "Sat 4 July",
    date: "2026-07-04",
    events: [
      { time: "12:00 – 13:00", activity: "Stars of Memories (2 tickets)" },
      { time: "15:00 – 16:00", activity: "Hachi Cha & Merchandise" },
      { time: "16:00 – 17:00", activity: "Stars of Wishes (3 tickets)" },
      { time: "20:00 – 21:00", activity: "CGM48 11th Single 1st Performance" },
    ],
  },
  {
    day: "Sun 5 July",
    date: "2026-07-05",
    events: [
      { time: "12:00 – 13:00", activity: "Stars of Hope (1 ticket)" },
      { time: "13:00 – 14:00", activity: "Hachi Cha & Merchandise" },
      { time: "16:00 – 17:00", activity: "Group Hi-Touch" },
    ],
  },
];

export default function Tanabata2026Page() {
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
            Event Schedule
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
            ตารางกิจกรรม Tanabata 2026
          </h1>
          <p className="text-sm text-[#9896b0]">
            หงษ์หยก · Hongyok CGM48 · 4–5 กรกฎาคม 2026
          </p>
          <p className="mt-1 text-sm font-medium text-cyan-400/80">
            Venue: MAYA Chiang Mai
          </p>
          <div className="mx-auto mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
            <span className="text-cyan-400/40 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
          </div>
        </div>
      </header>

      {/* Schedule */}
      <div className="mx-auto max-w-lg space-y-8 px-4 pb-16 pt-4">
        {schedule.map((day) => (
          <section key={day.date}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
              {day.day}
            </h2>
            <div className="space-y-3">
              {day.events.map((event, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-cyan-500/30 bg-[#0d1a1f] p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-32 shrink-0 pt-0.5">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {event.time}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-white">
                        {event.activity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
