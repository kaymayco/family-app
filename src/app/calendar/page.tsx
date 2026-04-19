"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  person: string;
  color: string;
};

type ViewMode = "month" | "week";

const COLORS = [
  { label: "Kayla", value: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { label: "Rosbin", value: "bg-pink-100 text-pink-700 border-pink-200" },
  { label: "Both", value: "bg-green-100 text-green-700 border-green-200" },
  { label: "Important", value: "bg-red-100 text-red-700 border-red-200" },
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [view, setView] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({ title: "", person: "Kayla", color: COLORS[0].value });
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<null | "syncing" | number | "error">(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const monthName = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekLabel = (() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (start.getMonth() === end.getMonth()) {
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return `${start.toLocaleDateString("en-US", { month: "short" })} – ${end.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  })();

  useEffect(() => {
    supabase.from("calendar_events").select("*").order("created_at").then(({ data }) => {
      if (data) setEvents(data);
      setLoading(false);
    });
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

  async function syncFromGoogle() {
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/google-calendar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncStatus(data.imported as number);
      setTimeout(() => setSyncStatus(null), 4000);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus(null), 4000);
    }
  }

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

  function openForm(dateKey: string) {
    setSelectedDate(dateKey);
    setForm({ title: "", person: "Kayla", color: COLORS[0].value });
    setShowForm(true);
  }

  function prevMonth() { setCurrent(new Date(year, month - 1)); }
  function nextMonth() { setCurrent(new Date(year, month + 1)); }
  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }
  function goToday() {
    const now = new Date();
    setCurrent(now);
    setWeekStart(getWeekStart(now));
  }

  const googleIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const syncLabel = syncStatus === "syncing"
    ? "Syncing…"
    : typeof syncStatus === "number"
    ? `Synced ${syncStatus} ✓`
    : syncStatus === "error"
    ? "Failed"
    : "Sync";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>Calendar</h2>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Google connect / sync button */}
          {!session ? (
            <button onClick={() => signIn("google")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border-2 border-black hover:bg-gray-50 transition-colors"
              style={{ boxShadow: "2px 2px 0 #000" }}>
              {googleIcon} <span className="hidden sm:inline">Connect Google Calendar</span><span className="sm:hidden">Connect Google</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={syncFromGoogle}
                disabled={syncStatus === "syncing"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border-2 border-black transition-colors disabled:opacity-60 ${
                  syncStatus === "error" ? "bg-red-100" : "bg-[#B8F02A] hover:bg-[#a8e020]"
                }`}
                style={{ boxShadow: "2px 2px 0 #000" }}>
                {googleIcon} {syncLabel}
              </button>
              <button onClick={() => signOut()}
                className="px-2 py-1.5 text-xs font-bold border-2 border-black hover:bg-gray-50 transition-colors text-gray-500"
                style={{ boxShadow: "2px 2px 0 #000" }} title="Disconnect">×</button>
            </div>
          )}

          {/* View toggle */}
          <div className="flex border-2 border-black overflow-hidden" style={{ boxShadow: "2px 2px 0 #000" }}>
            <button onClick={() => setView("month")}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${view === "month" ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}>
              Month
            </button>
            <button onClick={() => setView("week")}
              className={`px-3 py-1.5 text-xs font-bold border-l-2 border-black transition-colors ${view === "week" ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}>
              Week
            </button>
          </div>

          {/* Navigation */}
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-bold border-2 border-black hover:bg-gray-50">Today</button>
          <div className="flex items-center gap-1">
            <button onClick={view === "month" ? prevMonth : prevWeek} className="p-1.5 md:p-2 border-2 border-black hover:bg-gray-50"><ChevronLeft size={14} /></button>
            <span className="font-semibold text-gray-700 w-32 md:w-44 text-center text-xs md:text-sm">
              {view === "month" ? monthName : weekLabel}
            </span>
            <button onClick={view === "month" ? nextMonth : nextWeek} className="p-1.5 md:p-2 border-2 border-black hover:bg-gray-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 text-xs font-bold flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 border border-indigo-200 inline-block" />Kayla</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-pink-100 border border-pink-200 inline-block" />Rosbin</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-200 inline-block" />Both</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-200 inline-block" />Important</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-200 inline-block" />Google</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm font-medium">Loading...</div>
      ) : view === "month" ? (

        /* ── MONTH VIEW ── */
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          <div className="grid grid-cols-7 border-b-2 border-black">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] md:text-xs font-bold tracking-widest text-gray-500 uppercase">{d.slice(0, 1)}<span className="hidden sm:inline">{d.slice(1)}</span></div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateKey = day ? toKey(new Date(year, month, day)) : "";
              const dayEvents = events.filter((e) => e.date === dateKey);
              const isToday = dateKey === toKey(new Date());
              return (
                <div key={i}
                  onClick={() => day && openForm(dateKey)}
                  className={`min-h-[56px] md:min-h-[90px] p-1 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${!day ? "bg-gray-50/50 cursor-default" : ""}`}>
                  {day && (
                    <>
                      <span className={`text-xs md:text-sm font-bold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full mb-0.5 ${isToday ? "bg-black text-white" : "text-gray-700"}`}>
                        {day}
                      </span>
                      <div className="flex flex-col gap-px">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div key={ev.id} className={`flex items-center justify-between text-[9px] md:text-xs px-1 py-0.5 rounded border ${ev.color}`}>
                            <span className="font-semibold leading-tight truncate min-w-0">{ev.title}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeEvent(ev.id); }}
                              className="ml-0.5 shrink-0 opacity-50 hover:opacity-100 md:opacity-50"><X size={8} /></button>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[8px] md:text-[10px] text-gray-400 font-bold px-1">+{dayEvents.length - 2} more</div>
                        )}
                        {dayEvents.length === 0 && (
                          <div className="text-[8px] md:text-[10px] text-gray-300 font-medium px-0.5 hidden md:block">+ add</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      ) : (

        /* ── WEEK VIEW ── */
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          <div className="grid grid-cols-7 border-b-2 border-black">
            {weekDays.map((day, i) => {
              const isToday = toKey(day) === toKey(new Date());
              return (
                <div key={i} className="py-2 md:py-3 text-center border-r border-gray-100 last:border-r-0">
                  <div className="text-[9px] md:text-xs font-bold tracking-widest text-gray-500 uppercase mb-0.5">{DAYS_FULL[i].slice(0, 1)}<span className="hidden sm:inline">{DAYS_FULL[i].slice(1, 3)}</span></div>
                  <div className={`text-sm md:text-lg font-black mx-auto w-6 h-6 md:w-9 md:h-9 flex items-center justify-center rounded-full ${isToday ? "bg-black text-white" : "text-gray-800"}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[300px] md:min-h-[500px]">
            {weekDays.map((day, i) => {
              const dateKey = toKey(day);
              const dayEvents = events.filter((e) => e.date === dateKey);
              const isToday = dateKey === toKey(new Date());
              return (
                <div key={i}
                  onClick={() => openForm(dateKey)}
                  className={`p-1 md:p-2 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? "bg-blue-50/30" : ""}`}>
                  <div className="flex flex-col gap-1">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className={`text-[9px] md:text-xs px-1 md:px-2 py-1 md:py-1.5 rounded border ${ev.color}`}>
                        <div className="flex items-start justify-between gap-0.5">
                          <span className="font-bold leading-tight truncate">{ev.title}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeEvent(ev.id); }}
                            className="shrink-0 opacity-100 md:opacity-50 md:hover:opacity-100 mt-0.5"><X size={8} /></button>
                        </div>
                        <div className="hidden md:block text-[10px] mt-0.5 opacity-70 font-medium">{ev.person}</div>
                      </div>
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="hidden md:block text-[11px] text-gray-300 font-medium px-1 pt-1">+ add</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-5 w-full sm:max-w-sm sm:mx-4 sm:mb-0">
            <h3 className="font-bold text-base mb-3" style={{ letterSpacing: "-0.03em" }}>
              Add Event — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </h3>
            <input autoFocus type="text" placeholder="Event title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              className="w-full border-2 border-black px-3 py-2.5 text-sm mb-3 outline-none focus:bg-gray-50" />
            <div className="flex gap-1.5 mb-4">
              {COLORS.map((c) => (
                <button key={c.label} onClick={() => setForm((f) => ({ ...f, person: c.label, color: c.value }))}
                  className={`flex-1 text-xs py-2 rounded border font-bold transition-all ${c.value} ${form.person === c.label ? "ring-2 ring-black" : "opacity-60"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border-2 border-black text-sm font-bold hover:bg-gray-50">Cancel</button>
              <button onClick={addEvent} className="flex-1 py-2.5 bg-[#B8F02A] border-2 border-black text-sm font-bold shadow-[3px_3px_0px_#000] hover:shadow-none transition-all flex items-center justify-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
