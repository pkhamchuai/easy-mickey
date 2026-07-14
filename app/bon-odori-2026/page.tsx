import Link from "next/link";

const schedule = [
  {
    day: "วันศุกร์ที่ 24 กรกฎาคม 2026",
    dayEn: "FRI 24 JULY 2026",
    date: "2026-07-24",
    dot: "🔵",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    border: "border-sky-500/30",
    bg: "bg-[#0d1620]",
    events: [
      { time: "15:00 - 16:00", activity: "บูธ Lucky Roulette" },
      { time: "18:00 - 19:00", activity: "บูธ Omikuji Suuji Battle" },
      { time: "19:00 - 20:00", activity: "บูธ HACHI CHA" },
    ],
  },
  {
    day: "วันเสาร์ที่ 25 กรกฎาคม 2026",
    dayEn: "SAT 25 JULY 2026",
    date: "2026-07-25",
    dot: "🟣",
    gradient: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
    border: "border-purple-500/30",
    bg: "bg-[#160d20]",
    events: [
      { time: "15:00 - 16:00", activity: "บูธ Plinko" },
      { time: "17:00 - 18:00", activity: "บูธ Cork Shateki (3-Patsu)" },
      { time: "18:00 - 19:00", activity: "บูธ Wanage" },
    ],
  },
  {
    day: "วันอาทิตย์ที่ 26 กรกฎาคม 2026",
    dayEn: "SUN 26 JULY 2026",
    date: "2026-07-26",
    dot: "🟠",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
    border: "border-orange-500/30",
    bg: "bg-[#20150d]",
    events: [
      { time: "12:00 - 13:00", activity: "จุดจำหน่าย OFFICIAL MERCHANDISE" },
      { time: "13:00 - 14:00", activity: "บูธ Lucky Roulette" },
      { time: "16:00 - 17:00", activity: "เวที BON ODORI CENTER STAGE" },
    ],
  },
];

export default function BonOdori2026Page() {
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
            ตารางกิจกรรม Bon Odori 2026
          </h1>
          <p className="text-sm text-[#9896b0]">
            หงษ์หยก · Hongyok CGM48 · 24–26 กรกฎาคม 2026
          </p>
          <div className="mx-auto mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
            <span className="text-cyan-400/40 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
          </div>
        </div>
      </header>

      {/* Info note */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="rounded-2xl border border-amber-500/30 bg-[#1a160d] p-4 text-sm text-[#d8d4c8]">
          <p>
            กิจกรรมที่เป็น <span className="font-semibold text-amber-300">โซนเกมงานวัด</span> ทั้งหมดใช้{" "}
            <span className="font-semibold text-amber-300">5 Tickets</span> ต่อการเล่น 1 รอบ
          </p>
          <p className="mt-1">
            ส่วนบูธ <span className="font-semibold text-amber-300">HACHI CHA</span> และ{" "}
            <span className="font-semibold text-amber-300">Official Merchandise</span> เป็นการชำระเงินซื้อตามปกติ
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div className="mx-auto max-w-lg space-y-8 px-4 pb-16 pt-4">
        {schedule.map((day) => (
          <section key={day.date}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
              <span>{day.dot}</span>
              <span>
                {day.day} ({day.dayEn})
              </span>
            </h2>
            <div className="space-y-3">
              {day.events.map((event, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border ${day.border} ${day.bg} p-4`}
                >
                  <div className="flex gap-4">
                    <div className="w-32 shrink-0 pt-0.5">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          background: day.gradient,
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
