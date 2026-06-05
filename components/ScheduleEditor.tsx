"use client";

import { useEffect, useState } from "react";
import type { ScheduleDay, ScheduleEvent } from "./ScheduleTable";

const EMPTY_EVENT: ScheduleEvent = {
  time: "",
  title: "",
  location: "",
  note: "",
  hasHongyok: false,
};

export function ScheduleEditor({ token }: { token: string }) {
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((d) => setDays([...d].sort((a, b) => a.date.localeCompare(b.date))))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const r = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "content-type": "application/json", "x-tools-token": token },
        body: JSON.stringify(days),
      });
      setStatus(r.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2000);
    }
  }

  function updateDay(i: number, patch: Partial<ScheduleDay>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function updateEvent(dayIdx: number, evIdx: number, patch: Partial<ScheduleEvent>) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : { ...d, events: d.events.map((e, j) => (j === evIdx ? { ...e, ...patch } : e)) }
      )
    );
  }

  function addDay() {
    setDays((prev) => [...prev, { date: "", label: "", events: [{ ...EMPTY_EVENT }] }]);
  }

  function removeDay(i: number) {
    setDays((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addEvent(dayIdx: number) {
    setDays((prev) =>
      prev.map((d, i) => (i !== dayIdx ? d : { ...d, events: [...d.events, { ...EMPTY_EVENT }] }))
    );
  }

  function removeEvent(dayIdx: number, evIdx: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx ? d : { ...d, events: d.events.filter((_, j) => j !== evIdx) }
      )
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
          Schedule Editor
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6a6880]">
            {saving ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Error saving" : ""}
          </span>
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-lg border border-cyan-500/40 px-4 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#6a6880]">Loading…</p>
      ) : (
        <div className="space-y-6">
          {days.map((day, di) => (
            <div key={di} className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4">
              <div className="mb-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-1.5 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                  placeholder="Date (YYYY-MM-DD)"
                  value={day.date}
                  onChange={(e) => updateDay(di, { date: e.target.value })}
                />
                <input
                  className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-1.5 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                  placeholder="Label (e.g. อา 28 มิ.ย.)"
                  value={day.label}
                  onChange={(e) => updateDay(di, { label: e.target.value })}
                />
                <button
                  onClick={() => removeDay(di)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Remove day
                </button>
              </div>

              <div className="space-y-3">
                {day.events.map((ev, ei) => (
                  <div key={ei} className="rounded-xl border border-[#2a2a3d] bg-[#0d0d18] p-3">
                    <div className="mb-2 flex gap-2">
                      <input
                        className="w-24 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-1.5 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                        placeholder="Time"
                        value={ev.time}
                        onChange={(e) => updateEvent(di, ei, { time: e.target.value })}
                      />
                      <input
                        className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-1.5 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                        placeholder="Title"
                        value={ev.title}
                        onChange={(e) => updateEvent(di, ei, { title: e.target.value })}
                      />
                      <button
                        onClick={() => removeEvent(di, ei)}
                        className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-1.5 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                        placeholder="Location"
                        value={ev.location}
                        onChange={(e) => updateEvent(di, ei, { location: e.target.value })}
                      />
                      <input
                        className="flex-1 rounded-lg border border-[#2a2a3d] bg-[#0a0a12] px-3 py-1.5 text-sm text-[#f0eff8] placeholder-[#6a6880]"
                        placeholder="Note"
                        value={ev.note}
                        onChange={(e) => updateEvent(di, ei, { note: e.target.value })}
                      />
                      <label className="flex items-center gap-1.5 text-xs text-[#9896b0]">
                        <input
                          type="checkbox"
                          checked={ev.hasHongyok}
                          onChange={(e) => updateEvent(di, ei, { hasHongyok: e.target.checked })}
                          className="accent-cyan-400"
                        />
                        หงษ์หยก
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addEvent(di)}
                className="mt-3 rounded-lg border border-[#2a2a3d] px-3 py-1.5 text-xs text-[#9896b0] hover:border-cyan-500/30 hover:text-cyan-400"
              >
                + Add event
              </button>
            </div>
          ))}

          <button
            onClick={addDay}
            className="w-full rounded-2xl border border-dashed border-[#2a2a3d] py-3 text-sm text-[#6a6880] hover:border-cyan-500/30 hover:text-cyan-400"
          >
            + Add day
          </button>
        </div>
      )}
    </section>
  );
}
