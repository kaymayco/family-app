"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Priority = "none" | "low" | "medium" | "high";
type TodoList = { id: string; name: string };
type TodoItem = { id: string; list_id: string; text: string; done: boolean; priority: Priority };

const PRIORITY_CYCLE: Priority[] = ["none", "low", "medium", "high"];
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  none:   { label: "No priority", color: "text-gray-300",   dot: "bg-gray-200" },
  low:    { label: "Low",         color: "text-blue-400",   dot: "bg-blue-400" },
  medium: { label: "Medium",      color: "text-amber-400",  dot: "bg-amber-400" },
  high:   { label: "High",        color: "text-red-500",    dot: "bg-red-500" },
};

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };

function PriorityButton({ priority, onChange }: { priority: Priority; onChange: (p: Priority) => void }) {
  const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(priority) + 1) % PRIORITY_CYCLE.length];
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(next); }}
      title={cfg.label}
      className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-all hover:scale-110"
    >
      <span className={`w-3 h-3 rounded-full border-2 ${priority === "none" ? "border-gray-300 bg-transparent" : `border-transparent ${cfg.dot}`}`} />
    </button>
  );
}

export default function TodosPage() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [activeList, setActiveList] = useState<string>("");
  const [input, setInput] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: listsData }, { data: itemsData }] = await Promise.all([
        supabase.from("todo_lists").select("*").order("created_at"),
        supabase.from("todo_items").select("*").order("created_at"),
      ]);
      if (listsData) { setLists(listsData); if (!activeList && listsData[0]) setActiveList(listsData[0].id); }
      if (itemsData) setItems(itemsData as TodoItem[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("todos")
      .on("postgres_changes", { event: "*", schema: "public", table: "todo_lists" }, () => {
        supabase.from("todo_lists").select("*").order("created_at").then(({ data }) => { if (data) setLists(data); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "todo_items" }, () => {
        supabase.from("todo_items").select("*").order("created_at").then(({ data }) => { if (data) setItems(data as TodoItem[]); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function addItem() {
    if (!input.trim() || !activeList) return;
    const text = input.trim();
    setInput("");
    const { data } = await supabase.from("todo_items")
      .insert({ list_id: activeList, text, done: false, priority: "none" })
      .select().single();
    if (data) setItems((prev) => [...prev, data as TodoItem]);
  }

  async function toggleItem(item: TodoItem) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i));
    await supabase.from("todo_items").update({ done: !item.done }).eq("id", item.id);
  }

  async function setPriority(item: TodoItem, priority: Priority) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, priority } : i));
    await supabase.from("todo_items").update({ priority }).eq("id", item.id);
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("todo_items").delete().eq("id", id);
  }

  async function addList() {
    if (!newListName.trim()) return;
    const { data } = await supabase.from("todo_lists").insert({ name: newListName.trim() }).select().single();
    if (data) {
      setLists((prev) => [...prev, data as TodoList]);
      setActiveList(data.id);
    }
    setNewListName("");
    setShowNewList(false);
  }

  const currentItems = items.filter((i) => i.list_id === activeList);
  const done = currentItems.filter((i) => i.done).length;
  const activeItems = currentItems
    .filter((i) => !i.done)
    .sort((a, b) => PRIORITY_ORDER[a.priority ?? "none"] - PRIORITY_ORDER[b.priority ?? "none"]);
  const doneItems = currentItems.filter((i) => i.done);

  const highCount = activeItems.filter((i) => i.priority === "high").length;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>To-Do Lists</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {lists.map((l) => {
          const pending = items.filter((i) => i.list_id === l.id && !i.done).length;
          return (
            <button key={l.id} onClick={() => setActiveList(l.id)}
              className="px-4 py-1.5 text-sm font-bold border-2 border-black transition-all"
              style={{ background: activeList === l.id ? "#B8F02A" : "#fff", boxShadow: activeList === l.id ? "3px 3px 0 #000" : "none" }}>
              {l.name} ({pending})
            </button>
          );
        })}
        <button onClick={() => setShowNewList(true)}
          className="px-4 py-1.5 text-sm font-bold border-2 border-dashed border-black text-gray-400 hover:text-black transition-colors">
          + New list
        </button>
      </div>

      {showNewList && (
        <div className="flex gap-2 mb-4">
          <input autoFocus type="text" placeholder="List name..." value={newListName}
            onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addList()}
            className="flex-1 border-2 border-black px-3 py-2 text-sm outline-none" />
          <button onClick={addList} className="px-4 py-2 bg-[#B8F02A] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000]">Add</button>
          <button onClick={() => setShowNewList(false)} className="px-4 py-2 border-2 border-black text-sm font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm font-medium">Loading...</div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000]">
          <div className="px-5 py-4 border-b-2 border-black flex items-center justify-between">
            <div>
              <h3 className="font-bold" style={{ letterSpacing: "-0.02em" }}>{lists.find((l) => l.id === activeList)?.name}</h3>
              {highCount > 0 && (
                <p className="text-xs font-bold text-red-500 mt-0.5">{highCount} high priority</p>
              )}
            </div>
            {currentItems.length > 0 && <span className="text-xs font-bold text-gray-400">{done}/{currentItems.length} done</span>}
          </div>

          {/* Priority legend */}
          <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/50">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority:</span>
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <span key={p} className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                {PRIORITY_CONFIG[p].label}
              </span>
            ))}
          </div>

          <div className="flex gap-2 p-4 border-b border-gray-100">
            <input type="text" placeholder="Add a task..." value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-gray-50" />
            <button onClick={addItem} className="px-4 py-2 bg-[#B8F02A] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>

          <ul className="divide-y divide-gray-50">
            {currentItems.length === 0 && (
              <li className="px-5 py-10 text-center text-gray-400 text-sm font-medium">No tasks yet — add one above!</li>
            )}
            {activeItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 group">
                <PriorityButton priority={item.priority ?? "none"} onChange={(p) => setPriority(item, p)} />
                <button onClick={() => toggleItem(item)} className="text-gray-300 hover:text-black transition-colors shrink-0"><Circle size={20} /></button>
                <span className="flex-1 text-sm">{item.text}</span>
                {item.priority !== "none" && (
                  <span className={`text-[10px] font-black uppercase tracking-wide shrink-0 hidden sm:block ${PRIORITY_CONFIG[item.priority ?? "none"].color}`}>
                    {item.priority}
                  </span>
                )}
                <button onClick={() => deleteItem(item.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"><Trash2 size={15} /></button>
              </li>
            ))}
            {doneItems.length > 0 && (
              <>
                <li className="flex items-center gap-2 px-5 py-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Done</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </li>
                {doneItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 group opacity-40">
                    <span className="w-5 h-5 shrink-0" />
                    <button onClick={() => toggleItem(item)} className="text-black shrink-0"><CheckCircle2 size={20} /></button>
                    <span className="flex-1 text-sm line-through">{item.text}</span>
                    <button onClick={() => deleteItem(item.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"><Trash2 size={15} /></button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
