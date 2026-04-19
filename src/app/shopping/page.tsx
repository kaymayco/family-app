"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ShoppingCart, Package, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ShoppingItem = {
  id: string;
  text: string;
  category: string;
  done: boolean;
  list_type: "grocery" | "household" | "wishlist";
  for_who?: "Kayla" | "Rosbin" | "Both" | null;
};

const WHO_COLORS: Record<string, string> = {
  Kayla:  "bg-indigo-100 text-indigo-700 border-indigo-200",
  Rosbin: "bg-pink-100 text-pink-700 border-pink-200",
  Both:   "bg-green-100 text-green-700 border-green-200",
};

function useShoppingItems(listType: ShoppingItem["list_type"]) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("shopping_items").select("*").eq("list_type", listType).order("created_at")
      .then(({ data }) => { if (data) setItems(data as ShoppingItem[]); setLoading(false); });

    const channel = supabase.channel(`shopping_${listType}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping_items" }, () => {
        supabase.from("shopping_items").select("*").eq("list_type", listType).order("created_at")
          .then(({ data }) => { if (data) setItems(data as ShoppingItem[]); });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listType]);

  return { items, setItems, loading };
}

// ── Simple list (Groceries & Household) ──────────────────────────────────────
function SimpleList({
  listType,
  placeholder,
}: {
  listType: "grocery" | "household";
  placeholder: string;
}) {
  const { items, setItems, loading } = useShoppingItems(listType);
  const [input, setInput] = useState("");

  async function add() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    const { data } = await supabase.from("shopping_items")
      .insert({ text, list_type: listType, done: false, category: "" })
      .select().single();
    if (data) setItems(prev => [...prev, data as ShoppingItem]);
  }

  async function toggle(item: ShoppingItem) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
    await supabase.from("shopping_items").update({ done: !item.done }).eq("id", item.id);
  }

  async function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  async function clearDone() {
    const done = items.filter(i => i.done);
    setItems(prev => prev.filter(i => !i.done));
    await Promise.all(done.map(i => supabase.from("shopping_items").delete().eq("id", i.id)));
  }

  const active = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  return (
    <div>
      {/* Add input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-gray-50"
        />
        <button onClick={add}
          className="px-4 py-2 bg-[#B8F02A] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-1">
          <Plus size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center font-medium">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-300 py-4 text-center font-medium">Nothing here yet — add something!</div>
      ) : (
        <ul className="flex flex-col gap-1">
          {active.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2 px-1 group rounded hover:bg-gray-50">
              <button onClick={() => toggle(item)} className="text-gray-300 hover:text-black transition-colors shrink-0">
                <Circle size={20} />
              </button>
              <span className="flex-1 text-sm font-medium">{item.text}</span>
              <button onClick={() => remove(item.id)}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
          {done.length > 0 && (
            <>
              <li className="flex items-center gap-2 pt-2 pb-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Checked off</span>
                <button onClick={clearDone} className="text-[10px] font-bold text-gray-400 hover:text-red-400 underline">
                  Clear all
                </button>
                <div className="flex-1 h-px bg-gray-100" />
              </li>
              {done.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 px-1 group rounded">
                  <button onClick={() => toggle(item)} className="text-black shrink-0">
                    <CheckCircle2 size={20} />
                  </button>
                  <span className="flex-1 text-sm font-medium line-through text-gray-300">{item.text}</span>
                  <button onClick={() => remove(item.id)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Wish List ─────────────────────────────────────────────────────────────────
function WishList() {
  const { items, setItems, loading } = useShoppingItems("wishlist");
  const [input, setInput] = useState("");
  const [forWho, setForWho] = useState<"Kayla" | "Rosbin" | "Both">("Both");
  const [filterWho, setFilterWho] = useState<"All" | "Kayla" | "Rosbin" | "Both">("All");

  async function add() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    const { data } = await supabase.from("shopping_items")
      .insert({ text, list_type: "wishlist", done: false, for_who: forWho, category: "" })
      .select().single();
    if (data) setItems(prev => [...prev, data as ShoppingItem]);
  }

  async function toggle(item: ShoppingItem) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
    await supabase.from("shopping_items").update({ done: !item.done }).eq("id", item.id);
  }

  async function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  const filtered = items.filter(i => filterWho === "All" || i.for_who === filterWho);
  const active = filtered.filter(i => !i.done);
  const done = filtered.filter(i => i.done);

  return (
    <div>
      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Add to wish list..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-gray-50"
        />
        <button onClick={add}
          className="px-4 py-2 bg-[#B8F02A] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-1">
          <Plus size={14} />
        </button>
      </div>

      {/* For who selector (add) */}
      <div className="flex gap-2 mb-4">
        <span className="text-xs font-bold text-gray-400 self-center">For:</span>
        {(["Kayla", "Rosbin", "Both"] as const).map((w) => (
          <button key={w} onClick={() => setForWho(w)}
            className={`px-3 py-1 text-xs font-bold border-2 rounded transition-all ${
              forWho === w ? WHO_COLORS[w] + " border-black shadow-[2px_2px_0_#000]" : "bg-white text-gray-400 border-gray-200 hover:border-black"
            }`}>
            {w}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 pb-4 border-b-2 border-gray-100">
        <span className="text-xs font-bold text-gray-400 self-center">Show:</span>
        {(["All", "Kayla", "Rosbin", "Both"] as const).map((w) => (
          <button key={w} onClick={() => setFilterWho(w)}
            className={`px-3 py-1 text-xs font-bold border-2 rounded transition-all ${
              filterWho === w
                ? w === "All" ? "bg-black text-white border-black" : WHO_COLORS[w] + " border-black"
                : "bg-white text-gray-400 border-gray-200 hover:border-black"
            }`}>
            {w}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center font-medium">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-300 py-4 text-center font-medium">Nothing here yet!</div>
      ) : (
        <ul className="flex flex-col gap-1">
          {active.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2 px-1 group rounded hover:bg-gray-50">
              <button onClick={() => toggle(item)} className="text-gray-300 hover:text-black transition-colors shrink-0">
                <Circle size={20} />
              </button>
              <span className="flex-1 text-sm font-medium">{item.text}</span>
              {item.for_who && (
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded shrink-0 ${WHO_COLORS[item.for_who]}`}>
                  {item.for_who}
                </span>
              )}
              <button onClick={() => remove(item.id)}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
          {done.length > 0 && (
            <>
              <li className="flex items-center gap-2 pt-2 pb-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Got it / checked off</span>
                <div className="flex-1 h-px bg-gray-100" />
              </li>
              {done.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 px-1 group rounded">
                  <button onClick={() => toggle(item)} className="text-black shrink-0">
                    <CheckCircle2 size={20} />
                  </button>
                  <span className="flex-1 text-sm font-medium line-through text-gray-300">{item.text}</span>
                  {item.for_who && (
                    <span className="text-[10px] font-bold px-2 py-0.5 border rounded shrink-0 opacity-40 bg-gray-100 text-gray-400 border-gray-200">
                      {item.for_who}
                    </span>
                  )}
                  <button onClick={() => remove(item.id)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShoppingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>
        Shopping
      </h2>

      <div className="flex flex-col gap-5">

        {/* Groceries */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-black bg-[#B8F02A]">
            <ShoppingCart size={18} className="text-black" />
            <h3 className="font-black text-base" style={{ letterSpacing: "-0.02em" }}>Groceries</h3>
            <span className="text-xs font-bold text-black/50 ml-auto">weekly shop</span>
          </div>
          <div className="p-5">
            <SimpleList listType="grocery" placeholder="Add grocery item..." />
          </div>
        </div>

        {/* Household Needs */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-black bg-[#C9B1FF]">
            <Package size={18} className="text-black" />
            <h3 className="font-black text-base" style={{ letterSpacing: "-0.02em" }}>Household Needs</h3>
            <span className="text-xs font-bold text-black/50 ml-auto">supplies & essentials</span>
          </div>
          <div className="p-5">
            <SimpleList listType="household" placeholder="Add household item..." />
          </div>
        </div>

        {/* Wish List */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-black bg-[#FFD166]">
            <Star size={18} className="text-black" />
            <h3 className="font-black text-base" style={{ letterSpacing: "-0.02em" }}>Wish List</h3>
            <span className="text-xs font-bold text-black/50 ml-auto">want to buy or receive</span>
          </div>
          <div className="p-5">
            <WishList />
          </div>
        </div>

      </div>
    </div>
  );
}
