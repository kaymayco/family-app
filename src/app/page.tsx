"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, CheckSquare, ShoppingCart, Globe, Tv, FileText, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CalEvent = { id: string; date: string; title: string };
type TodoItem = { id: string; done: boolean; priority: string | null };
type ShoppingItem = { id: string; done: boolean; list_type: string };
type ImmigStep = { id: string; status: string };
type Note = { id: string; title: string };

const STEP_TITLES: Record<string, string> = {
  "1": "File I-130 Petition",
  "2": "I-130 Approved",
  "3": "File I-601A Waiver",
  "4": "Wait for I-601A Approval",
  "5": "NVC Processing",
  "6": "Schedule Consular Interview",
  "7": "Medical Exam",
  "8": "Consular Interview",
  "9": "Visa Issuance",
  "10": "Enter US & Receive Green Card",
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function Home() {
  const today = new Date();
  const tk = todayKey();

  const [calEvents, setCalEvents] = useState<CalEvent[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [steps, setSteps] = useState<ImmigStep[]>([]);
  const [watchCount, setWatchCount] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [evRes, todoRes, shopRes, stepRes, watchRes, noteRes] = await Promise.all([
        supabase.from("calendar_events").select("id,date,title").gte("date", tk).order("date").limit(5),
        supabase.from("todo_items").select("id,done,priority").eq("done", false),
        supabase.from("shopping_items").select("id,done,list_type").eq("done", false),
        supabase.from("immigration_steps").select("id,status").order("id"),
        supabase.from("watch_items").select("id", { count: "exact" }).eq("watched", false),
        supabase.from("notes").select("id,title").order("updated_at", { ascending: false }).limit(3),
      ]);
      if (evRes.data) setCalEvents(evRes.data);
      if (todoRes.data) setTodos(todoRes.data as TodoItem[]);
      if (shopRes.data) setShopping(shopRes.data as ShoppingItem[]);
      if (stepRes.data) setSteps(stepRes.data);
      setWatchCount(watchRes.count ?? 0);
      if (noteRes.data) setNotes(noteRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const todayEvents = calEvents.filter((e) => e.date === tk);
  const upcoming = calEvents.filter((e) => e.date > tk).slice(0, 3);
  const highPrio = todos.filter((i) => (i.priority ?? "none") === "high");
  const groceries = shopping.filter((i) => i.list_type === "grocery").length;
  const household = shopping.filter((i) => i.list_type === "household").length;
  const doneSteps = steps.filter((s) => s.status === "done").length;
  const currentStep = steps.find((s) => s.status === "in-progress") ?? steps.find((s) => s.status !== "done");

  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-widest"
          style={{ background: "#FFE566", border: "2px solid #000", letterSpacing: "0.1em" }}>
          {dateLabel.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 6vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "#000" }}>
          Hey Kayla,<br />
          <span style={{ color: "#FF85C1" }}>here&apos;s what&apos;s</span><br />
          going on.
        </h2>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm font-medium py-12 text-center">Loading your dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

          {/* ── Calendar ── */}
          <Link href="/calendar"
            className="block p-4 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
            style={{ background: "#FF85C1" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <CalendarDays size={15} /> Calendar
              </div>
              <ArrowRight size={13} />
            </div>
            {todayEvents.length > 0 ? (
              <div className="mb-2">
                <p className="text-[10px] font-black text-black/50 mb-1 uppercase tracking-wider">Today</p>
                {todayEvents.slice(0, 2).map((e) => (
                  <p key={e.id} className="text-sm font-bold leading-snug truncate">• {e.title}</p>
                ))}
                {todayEvents.length > 2 && <p className="text-xs font-bold opacity-60">+{todayEvents.length - 2} more</p>}
              </div>
            ) : (
              <p className="text-sm font-bold text-black/40 mb-2">Nothing today</p>
            )}
            {upcoming.length > 0 && (
              <div className="mt-2 border-t border-black/10 pt-2">
                <p className="text-[10px] font-black text-black/50 mb-1 uppercase tracking-wider">Coming up</p>
                {upcoming.map((e) => (
                  <p key={e.id} className="text-xs font-semibold truncate opacity-80">{fmtDate(e.date)} — {e.title}</p>
                ))}
              </div>
            )}
            {todayEvents.length === 0 && upcoming.length === 0 && (
              <p className="text-xs font-medium opacity-50 mt-1">No upcoming events</p>
            )}
          </Link>

          {/* ── To-Do ── */}
          <Link href="/todos"
            className="block p-4 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
            style={{ background: "#B8F02A" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <CheckSquare size={15} /> To-Do
              </div>
              <ArrowRight size={13} />
            </div>
            {todos.length === 0 ? (
              <p className="text-sm font-bold">All caught up! 🎉</p>
            ) : (
              <>
                <p className="text-3xl font-black leading-none">{todos.length}</p>
                <p className="text-xs font-bold text-black/60 mb-2">tasks pending</p>
                {highPrio.length > 0 ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500 text-white text-xs font-black w-fit">
                    <AlertCircle size={11} /> {highPrio.length} high priority
                  </div>
                ) : (
                  <p className="text-xs font-medium opacity-50">No urgent tasks</p>
                )}
              </>
            )}
          </Link>

          {/* ── Shopping ── */}
          <Link href="/shopping"
            className="block p-4 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
            style={{ background: "#FF8C42" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <ShoppingCart size={15} /> Shopping
              </div>
              <ArrowRight size={13} />
            </div>
            {groceries === 0 && household === 0 ? (
              <p className="text-sm font-bold">All stocked up!</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {groceries > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Groceries</span>
                    <span className="text-2xl font-black leading-none">{groceries}</span>
                  </div>
                )}
                {household > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Household</span>
                    <span className="text-2xl font-black leading-none">{household}</span>
                  </div>
                )}
                <p className="text-xs font-medium opacity-60 mt-1">items to pick up</p>
              </div>
            )}
          </Link>

          {/* ── Immigration ── */}
          <Link href="/immigration"
            className="block p-4 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
            style={{ background: "#C9B1FF" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <Globe size={15} /> Immigration
              </div>
              <ArrowRight size={13} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-black/10 h-2 overflow-hidden">
                <div className="bg-black h-2 transition-all"
                  style={{ width: `${steps.length ? (doneSteps / steps.length) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-black shrink-0">{doneSteps}/{steps.length}</span>
            </div>
            {currentStep && (
              <div>
                <p className="text-[10px] font-black text-black/50 uppercase tracking-wider mb-0.5">
                  {currentStep.status === "in-progress" ? "In Progress" : "Up Next"}
                </p>
                <p className="text-xs font-bold leading-snug">
                  Step {currentStep.id} — {STEP_TITLES[currentStep.id] ?? ""}
                </p>
              </div>
            )}
            {doneSteps === steps.length && steps.length > 0 && (
              <p className="text-sm font-bold">Journey complete! 🎉</p>
            )}
          </Link>

          {/* ── Notes ── */}
          <Link href="/notes"
            className="block p-4 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
            style={{ background: "#87D4F9" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <FileText size={15} /> Notes
              </div>
              <ArrowRight size={13} />
            </div>
            {notes.length === 0 ? (
              <p className="text-sm font-bold text-black/40">No notes yet</p>
            ) : (
              <>
                <p className="text-[10px] font-black text-black/50 mb-1 uppercase tracking-wider">Recent</p>
                {notes.map((n) => (
                  <p key={n.id} className="text-xs font-semibold truncate opacity-80">• {n.title}</p>
                ))}
              </>
            )}
          </Link>

          {/* ── Watch List ── */}
          <Link href="/watchlist"
            className="block p-4 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
            style={{ background: "#FF6B6B" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-white">
                <Tv size={15} /> Watch List
              </div>
              <ArrowRight size={13} className="text-white" />
            </div>
            <p className="text-4xl font-black text-white leading-none">{watchCount}</p>
            <p className="text-xs font-bold text-white/60 mt-1">
              {watchCount === 1 ? "thing to watch" : "things to watch"}
            </p>
          </Link>

        </div>
      )}
    </div>
  );
}
