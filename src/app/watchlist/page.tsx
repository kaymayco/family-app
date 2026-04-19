"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Tv, Film, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type WatchItem = {
  id: string;
  title: string;
  type: "show" | "movie";
  for_who: "Kayla" | "Rosbin" | "Both";
  watched: boolean;
  rating: number | null;
  created_at: string;
};

const WHO_COLORS: Record<string, string> = {
  Kayla:  "bg-indigo-100 text-indigo-700 border-indigo-200",
  Rosbin: "bg-pink-100 text-pink-700 border-pink-200",
  Both:   "bg-green-100 text-green-700 border-green-200",
};

function StarRating({ value, onChange }: { value: number | null; onChange: (r: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); onChange(star); }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={16}
            className={`transition-colors ${(hover ?? value ?? 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function WatchListPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [type, setType] = useState<"show" | "movie">("movie");
  const [forWho, setForWho] = useState<"Kayla" | "Rosbin" | "Both">("Both");
  const [filter, setFilter] = useState<"all" | "to-watch" | "watched">("to-watch");
  const [whoFilter, setWhoFilter] = useState<"All" | "Kayla" | "Rosbin" | "Both">("All");

  useEffect(() => {
    supabase.from("watch_items").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setItems(data as WatchItem[]); setLoading(false); });

    const channel = supabase.channel("watch_items")
      .on("postgres_changes", { event: "*", schema: "public", table: "watch_items" }, () => {
        supabase.from("watch_items").select("*").order("created_at", { ascending: false })
          .then(({ data }) => { if (data) setItems(data as WatchItem[]); });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function add() {
    if (!input.trim()) return;
    const title = input.trim();
    setInput("");
    const { data } = await supabase.from("watch_items")
      .insert({ title, type, for_who: forWho, watched: false, rating: null })
      .select().single();
    if (data) setItems(prev => [data as WatchItem, ...prev]);
  }

  async function toggleWatched(item: WatchItem) {
    const watched = !item.watched;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, watched } : i));
    await supabase.from("watch_items").update({ watched }).eq("id", item.id);
  }

  async function setRating(item: WatchItem, rating: number) {
    // If clicking the same rating, clear it
    const newRating = item.rating === rating ? null : rating;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, rating: newRating } : i));
    await supabase.from("watch_items").update({ rating: newRating }).eq("id", item.id);
  }

  async function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("watch_items").delete().eq("id", id);
  }

  const filtered = items
    .filter(i => whoFilter === "All" || i.for_who === whoFilter)
    .filter(i => filter === "all" ? true : filter === "to-watch" ? !i.watched : i.watched);

  const toWatchCount = items.filter(i => !i.watched).length;
  const watchedCount = items.filter(i => i.watched).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>
          Watch List
        </h2>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          {toWatchCount} to watch · {watchedCount} watched
        </p>
      </div>

      {/* Add form */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0_#000] p-5 mb-5">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Add a show or movie..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="flex-1 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-gray-50"
          />
          <button onClick={add}
            className="px-4 py-2 bg-[#FF6B6B] border-2 border-black text-sm font-bold text-white shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-1">
            <Plus size={14} />
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Type */}
          <div className="flex gap-2">
            <button onClick={() => setType("movie")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 transition-all ${type === "movie" ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-300 hover:border-black"}`}>
              <Film size={12} /> Movie
            </button>
            <button onClick={() => setType("show")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 transition-all ${type === "show" ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-300 hover:border-black"}`}>
              <Tv size={12} /> Show
            </button>
          </div>

          {/* For who */}
          <div className="flex gap-2">
            {(["Kayla", "Rosbin", "Both"] as const).map((w) => (
              <button key={w} onClick={() => setForWho(w)}
                className={`px-3 py-1.5 text-xs font-bold border-2 rounded transition-all ${forWho === w ? WHO_COLORS[w] + " border-black shadow-[2px_2px_0_#000]" : "bg-white text-gray-400 border-gray-200 hover:border-black"}`}>
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex border-2 border-black overflow-hidden shadow-[2px_2px_0_#000]">
          {(["to-watch", "watched", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold border-r last:border-r-0 border-black transition-colors ${filter === f ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}>
              {f === "to-watch" ? "To Watch" : f === "watched" ? "Watched" : "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["All", "Kayla", "Rosbin", "Both"] as const).map((w) => (
            <button key={w} onClick={() => setWhoFilter(w)}
              className={`px-3 py-1.5 text-xs font-bold border-2 rounded transition-all ${
                whoFilter === w
                  ? w === "All" ? "bg-black text-white border-black" : WHO_COLORS[w] + " border-black"
                  : "bg-white text-gray-400 border-gray-200 hover:border-black"
              }`}>
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm font-medium">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Film size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nothing here — add something to watch!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <div key={item.id}
              className={`bg-white border-2 border-black shadow-[3px_3px_0_#000] px-4 py-3 flex items-center gap-3 group transition-all ${item.watched ? "opacity-60" : ""}`}>

              {/* Watch toggle */}
              <button onClick={() => toggleWatched(item)}
                className={`shrink-0 w-6 h-6 border-2 border-black flex items-center justify-center transition-colors ${item.watched ? "bg-black" : "bg-white hover:bg-gray-100"}`}>
                {item.watched && <span className="text-white text-xs font-black">✓</span>}
              </button>

              {/* Type icon */}
              <span className="shrink-0 text-gray-400">
                {item.type === "movie" ? <Film size={14} /> : <Tv size={14} />}
              </span>

              {/* Title */}
              <span className={`flex-1 text-sm font-semibold ${item.watched ? "line-through text-gray-400" : ""}`}>
                {item.title}
              </span>

              {/* Rating (only when watched) */}
              {item.watched && (
                <StarRating value={item.rating} onChange={(r) => setRating(item, r)} />
              )}

              {/* For who badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded shrink-0 ${WHO_COLORS[item.for_who]}`}>
                {item.for_who}
              </span>

              {/* Delete */}
              <button onClick={() => remove(item.id)}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
