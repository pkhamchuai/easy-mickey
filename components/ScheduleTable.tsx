import fallback from "@/data/schedule.json";
import { kv } from "@vercel/kv";

export type ScheduleEvent = {
  time: string;
  title: string;
  location: string;
  note: string;
  hasHongyok: boolean;
};

export type ScheduleDay = {
  date: string;
  label: string;
  events: ScheduleEvent[];
};

async function getSchedule(): Promise<ScheduleDay[]> {
  try {
    const data = await kv.get<ScheduleDay[]>("schedule");
    return data ?? (fallback as ScheduleDay[]);
  } catch {
    return fallback as ScheduleDay[];
  }
}

function getCountdown(dateStr: string): { text: string; className: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr);
  eventDate.setHours(0, 0, 0, 0);
  const diff = Math.round((eventDate.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) return { text: "Today", className: "text-[#40E0D0]" };
  if (diff < 0) return { text: "Passed", className: "text-[#6a6880]" };
  if (diff === 1) return { text: "In 1 day", className: "text-yellow-400" };
  return { text: `In ${diff} days`, className: "text-cyan-300" };
}

export async function ScheduleTable() {
  const days = await getSchedule();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 2);

  const allEvents = [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((day) => new Date(day.date) >= cutoff)
    .flatMap((day) =>
      day.events
        .filter((e) => e.title !== "ไม่มีกำหนดการ")
        .map((e) => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const eventDate = new Date(day.date); eventDate.setHours(0, 0, 0, 0);
          return { ...e, dayLabel: day.label, date: day.date, isPassed: eventDate < today };
        })
    );

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
        กำหนดการ มิถุนายน 2569
      </h2>

      {allEvents.length === 0 ? (
        <p className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] py-6 text-center text-sm text-[#6a6880]">
          ไม่มีกำหนดการ
        </p>
      ) : (
        <div className="space-y-3">
          {allEvents.map((event, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-4 ${
                event.hasHongyok
                  ? "border-cyan-500/30 bg-[#0d1a1f]"
                  : "border-[#2a2a3d] bg-[#13131e]"
              }`}
            >
              <div className="flex gap-4">
                <div className="w-28 shrink-0 pt-0.5">
                  <p className="text-xs text-[#6a6880]">{event.dayLabel}</p>
                  <p className={`text-sm font-semibold ${event.isPassed ? "text-[#6a6880]" : "text-pink-400/60"}`}>{event.time}</p>
                  <p className={`text-xs font-medium ${event.isPassed ? "text-[#6a6880]" : "text-pink-400/60"}`}>{getCountdown(event.date).text}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold leading-snug"
                    style={event.isPassed ? undefined : {
                      background: "linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {event.title}
                  </p>
                  {event.location && (
                    <p className="mt-0.5 text-sm text-[#9896b0]">
                      {event.location}
                    </p>
                  )}
                  {event.note && (
                    <span className="mt-2 inline-block rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                      {event.note}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
