"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  person: string;
  color: string;
};

const COLORS = [
  { label: "Kayla", value: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { label: "Husband", value: "bg-pink-100 text-pink-700 border-pink-200" },
  { label: "Both", value: "bg-green-100 text-green-700 border-green-200" },
  { label: "Important", value: "bg-red-100 text-red-700 border-red-200" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({ title: "", person: "Kayla", color: COLORS[0].value });
  const [loading, setLoading] = useState(true);

  const year = current.getFullYear();
  const month = current.getMonth();
  const monthName = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  useEffect(() => {
    // Initial fetch
    supabase.from("calendar_events").select("*").order("created_at").then(({ data }) => {
      if (data) setEvents(data);
      setLoading(false);
    });

    // Real-time subscription
    const channel = supabase
      .channel("calendar_events")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events" }, () => {
        supabase.from("calendar_events").select("*").order("created_at").then(({ data }) => {
          if (data) setEvents(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function addEvent() {
    if (!form.title.trim()) return;
    await supabase.from("calendar_events").insert({
      title: form.title.trim(),
      date: selectedDate,
      person: form.person,
      color: form.color,
    });
    setShowForm(false);
  }

  async function removeEvent(id: string) {
    await supabase.from("calendar_events").delete().eq("id", id);
  }

  function openForm(day: number) {
    setSelectedDate(toKey(new Date(year, month, day)));
    setForm({ title: "", person: "Kayla", color: COLORS[0].value });
    setShowForm(true);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>Calendar</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-700 w-36 text-center">{monthName}</span>
          <button onClick={() => setCurrent(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm font-medium">Loading...</div>
      ) : (
        <div className="bg-white rounded-none border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          <div className="grid grid-cols-7 border-b-2 border-black">
            {DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-bold tracking-widest text-gray-500 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateKey = day ? toKey(new Date(year, month, day)) : "";
              const dayEvents = events.filter((e) => e.date === dateKey);
              const isToday = dateKey === toKey(new Date());
              return (
                <div
                  key={i}
                  onClick={() => day && openForm(day)}
                  className={`min-h-[80px] p-2 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${!day ? "bg-gray-50/50 cursor-default" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-black text-white" : "text-gray-700"}`}>{day}</span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {dayEvents.map((ev) => (
                          <div key={ev.id} className={`flex items-center justify-between text-xs px-1.5 py-0.5 rounded border ${ev.color}`}>
                            <span className="truncate">{ev.title}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeEvent(ev.id); }} className="ml-1 opacity-50 hover:opacity-100"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-4" style={{ letterSpacing: "-0.03em" }}>
              Add Event — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </h3>
            <input
              autoFocus
              type="text"
              placeholder="Event title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              className="w-full border-2 border-black px-3 py-2 text-sm mb-3 outline-none focus:bg-gray-50"
            />
            <div className="flex gap-2 mb-4">
              {COLORS.map((c) => (
                <button key={c.label} onClick={() => setForm((f) => ({ ...f, person: c.label, color: c.value }))}
                  className={`flex-1 text-xs py-1.5 rounded border font-bold transition-all ${c.value} ${form.person === c.label ? "ring-2 ring-black" : "opacity-60"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border-2 border-black text-sm font-bold hover:bg-gray-50">Cancel</button>
              <button onClick={addEvent} className="flex-1 py-2 bg-[#B8F02A] border-2 border-black text-sm font-bold shadow-[3px_3px_0px_#000] hover:shadow-none transition-all flex items-center justify-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
