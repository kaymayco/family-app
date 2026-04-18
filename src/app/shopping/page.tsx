"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ShoppingItem = { id: string; text: string; category: string; done: boolean };

const CATEGORIES = ["Produce", "Dairy", "Meat", "Pantry", "Household", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
  Produce: "bg-green-100 text-green-700",
  Dairy: "bg-blue-100 text-blue-700",
  Meat: "bg-red-100 text-red-700",
  Pantry: "bg-yellow-100 text-yellow-700",
  Household: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Produce");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("shopping_items").select("*").order("created_at").then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });

    const channel = supabase
      .channel("shopping_items")
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping_items" }, () => {
        supabase.from("shopping_items").select("*").order("created_at").then(({ data }) => {
          if (data) setItems(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function addItem() {
    if (!input.trim()) return;
    await supabase.from("shopping_items").insert({ text: input.trim(), category, done: false });
    setInput("");
  }

  async function toggle(item: ShoppingItem) {
    await supabase.from("shopping_items").update({ done: !item.done }).eq("id", item.id);
  }

  async function remove(id: string) {
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  async function clearDone() {
    await supabase.from("shopping_items").delete().eq("done", true);
  }

  const doneItems = items.filter((i) => i.done);
  const grouped = CATEGORIES.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat && !i.done);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>Shopping List</h2>
        {doneItems.length > 0 && (
          <button onClick={clearDone} className="text-xs font-bold border-2 border-black px-3 py-1.5 hover:bg-red-50 transition-colors">
            Clear checked ({doneItems.length})
          </button>
        )}
      </div>

      <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] p-4 mb-4">
        <div className="flex gap-2 mb-3">
          <input type="text" placeholder="Add item..." value={input}
            onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-gray-50" />
          <button onClick={addItem} className="px-4 py-2 bg-[#FF8C42] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-1">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs font-bold border-2 transition-all ${category === cat ? CATEGORY_COLORS[cat] + " border-black shadow-[2px_2px_0_#000]" : "bg-white text-gray-500 border-gray-300 hover:border-black"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm font-medium">Loading...</div>
      ) : (
        <>
          {items.filter(i => !i.done).length === 0 && doneItems.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Your list is empty — add some items!</p>
            </div>
          )}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="bg-white border-2 border-black shadow-[4px_4px_0_#000] mb-3">
              <div className="px-5 py-2.5 border-b-2 border-black flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 border border-black ${CATEGORY_COLORS[cat]}`}>{cat}</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {catItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                    <button onClick={() => toggle(item)} className="text-gray-300 hover:text-black transition-colors"><Circle size={20} /></button>
                    <span className="flex-1 text-sm">{item.text}</span>
                    <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {doneItems.length > 0 && (
            <div className="bg-white border-2 border-gray-200 opacity-50">
              <div className="px-5 py-2.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Checked off</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {doneItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3 group">
                    <button onClick={() => toggle(item)} className="text-black"><CheckCircle2 size={20} /></button>
                    <span className="flex-1 text-sm line-through text-gray-400">{item.text}</span>
                    <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
