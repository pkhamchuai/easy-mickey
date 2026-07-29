import Image from "next/image";
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

const centerSongs = [
  "1️⃣ Suki! Suki! Skip! (HKT48)",
  "2️⃣ Nagiichi (NMB48)",
  "3️⃣ Sentimental Train (AKB48)",
];

const centerSongVideos = [
  "SUjvUN0vztY",
  "XjuHFHxwvGI",
  "YAMF5Rypnrs",
];

const centerSongQuotes = [
  "ตอนหนูฟังครั้งแรกแล้วชอบเลยแบบชอบมากกกก ส่วนตัวหนูชอบเพลงที่เตะๆขา+เด้งๆดีดๆทั้งเพลงมากๆ ฟังแล้วรู้สึกคาวาอี้เหนียนเนี๊ยน",
  "เป็นอีกเพลงที่หนูชอบมากๆๆ ชอบเมโลดี้ของเพลงแล้วก็ความหมายเพลง หนูอยากเป็นเด็กผู้หญิงที่น่ารักที่สุดในชายหาด 2552525",
  "เป็นเพลงที่ขึ้นฟีดหนูมาก่อนที่หนูจะเข้าวงแต่จำไม่ค่อยได้แล้วว่าช่วงไหนแต่ตอนนั้นลองกดเข้าไปฟังแล้วชอบมากจนไปหาความหมายเพลงดูแล้วก็ติดเพลงนี้มาจนถึงทุกวันนี้เลยคิดไว้ว่าถ้ามีจีอีก็จะเขียนเพลงนี้ลงไปแน่ๆ ไอเลิฟมาก<3",
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

      {/* GE Application */}
      <section className="mx-auto max-w-lg px-4 pb-5 pt-4">
        <figure className="mx-auto w-3/4 overflow-hidden rounded-2xl border border-pink-400/20 bg-[#15101a]">
          <Image
            src="/HY_GE_application.jpg"
            alt="หงษ์หยก ควรประดิษฐ์ สมัคร BNK48 & CGM48 Senbatsu General Election 2026"
            width={1108}
            height={1477}
            sizes="(max-width: 512px) calc(100vw - 2rem), 480px"
            className="h-auto w-full"
            priority
          />
          <figcaption className="border-t border-white/5 px-4 py-3 text-sm leading-relaxed text-[#c8c6d6]">
            หงษ์หยก–หงษ์หยก ควรประดิษฐ์ (CGM48 Trainee) ได้ลงสมัคร
            BNK48 &amp; CGM48 Senbatsu General Election 2026 เมื่อวันที่ 29
            กรกฎาคม 2026 (13:27)
          </figcaption>
        </figure>
      </section>

      {/* Application Number Quote */}
      <section aria-label="คำพูดจากหงษ์หยก" className="mx-auto max-w-lg px-4 pb-7 pt-2">
        <blockquote className="rounded-2xl border border-pink-400/20 bg-pink-400/5 px-5 py-4">
          <span aria-hidden="true" className="block text-6xl leading-none text-pink-400/60">“</span>
          <p className="px-3 text-center text-lg font-semibold leading-relaxed text-pink-100">
            หนูเลือกอันดับ “27” เพราะหนูเกิดวันที่ 27
            แล้วก็พอลองดูเลขมงคลประจำวันเกิดตัวเองก็เป็นเลข 27 เหมือนกันพอดี
            ก็เลยนี่หล่ะๆเริ่ด! แล้วหนูเลือกส่งเวลา บ่ายโมง 27 นาทีเพราะว่า
            หนูเกิดวันที่ 27 เดือน 1 แล้วก็บวกกับเป็นเลข 127 พอดี นำโชคๆๆๆๆๆ
          </p>
          <span aria-hidden="true" className="block text-right text-6xl leading-none text-pink-400/60">”</span>
        </blockquote>
      </section>

      {/* Center Song Wishlist */}
      <section className="mx-auto max-w-lg px-4 pb-5">
        <div className="rounded-2xl border border-cyan-400/20 bg-[#0d1620] p-4">
          <h2 className="mb-3 font-semibold text-white">
            เพลงที่ต้องการเป็นเซ็นเตอร์
          </h2>
          <ol className="space-y-2">
            {centerSongs.map((song, index) => (
              <li
                key={song}
                className="rounded-xl bg-white/5 px-3 py-3 text-base text-[#c8c6d6]"
              >
                <p className="text-lg font-semibold leading-snug text-white">{song}</p>
                <blockquote className="mt-3 border-l-2 border-pink-400/40 pl-3 text-base leading-relaxed text-[#aaa8bc]">
                  “{centerSongQuotes[index]}”
                </blockquote>
                {centerSongVideos[index] && (
                  <iframe
                    className="mt-3 aspect-video w-full rounded-lg"
                    src={`https://www.youtube-nocookie.com/embed/${centerSongVideos[index]}`}
                    title={`${song} YouTube video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Agenda */}
      <div className="mx-auto max-w-lg space-y-3 px-4 pb-16 pt-3">
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
