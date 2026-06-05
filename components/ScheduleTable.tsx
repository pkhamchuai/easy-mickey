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

export async function ScheduleTable() {
  const days = await getSchedule();

  const allEvents = [...days].sort((a, b) => a.date.localeCompare(b.date)).flatMap((day) =>
    day.events
      .filter((e) => e.title !== "ไม่มีกำหนดการ")
      .map((e) => ({ ...e, dayLabel: day.label }))
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
                  <p className="text-sm font-semibold text-cyan-400">{event.time}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-[#f0eff8]">
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
