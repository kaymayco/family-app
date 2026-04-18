"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TodoList = { id: string; name: string };
type TodoItem = { id: string; list_id: string; text: string; done: boolean };

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
      if (itemsData) setItems(itemsData);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("todos")
      .on("postgres_changes", { event: "*", schema: "public", table: "todo_lists" }, () => {
        supabase.from("todo_lists").select("*").order("created_at").then(({ data }) => { if (data) setLists(data); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "todo_items" }, () => {
        supabase.from("todo_items").select("*").order("created_at").then(({ data }) => { if (data) setItems(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function addItem() {
    if (!input.trim() || !activeList) return;
    await supabase.from("todo_items").insert({ list_id: activeList, text: input.trim(), done: false });
    setInput("");
  }

  async function toggleItem(item: TodoItem) {
    await supabase.from("todo_items").update({ done: !item.done }).eq("id", item.id);
  }

  async function deleteItem(id: string) {
    await supabase.from("todo_items").delete().eq("id", id);
  }

  async function addList() {
    if (!newListName.trim()) return;
    const { data } = await supabase.from("todo_lists").insert({ name: newListName.trim() }).select().single();
    if (data) setActiveList(data.id);
    setNewListName("");
    setShowNewList(false);
  }

  const currentItems = items.filter((i) => i.list_id === activeList);
  const done = currentItems.filter((i) => i.done).length;

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
            <h3 className="font-bold" style={{ letterSpacing: "-0.02em" }}>{lists.find((l) => l.id === activeList)?.name}</h3>
            {currentItems.length > 0 && <span className="text-xs font-bold text-gray-400">{done}/{currentItems.length} done</span>}
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
            {currentItems.filter((i) => !i.done).map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                <button onClick={() => toggleItem(item)} className="text-gray-300 hover:text-black transition-colors"><Circle size={20} /></button>
                <span className="flex-1 text-sm">{item.text}</span>
                <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
              </li>
            ))}
            {currentItems.filter((i) => i.done).map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group opacity-40">
                <button onClick={() => toggleItem(item)} className="text-black"><CheckCircle2 size={20} /></button>
                <span className="flex-1 text-sm line-through">{item.text}</span>
                <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
