"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ShoppingCart } from "lucide-react";

type ShoppingItem = {
  id: string;
  text: string;
  category: string;
  done: boolean;
};

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

  function addItem() {
    if (!input.trim()) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text: input.trim(), category, done: false }]);
    setInput("");
  }

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => !i.done));
  }

  const grouped = CATEGORIES.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat && !i.done);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const doneItems = items.filter((i) => i.done);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Shopping List</h2>
        {doneItems.length > 0 && (
          <button onClick={clearDone} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
            Clear checked ({doneItems.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Add item..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button onClick={addItem} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                category === cat
                  ? CATEGORY_COLORS[cat] + " border-transparent ring-2 ring-offset-1 ring-indigo-300"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Your list is empty — add some items!</p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>{cat}</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {catItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                <button onClick={() => toggle(item.id)} className="text-gray-300 hover:text-green-500 transition-colors">
                  <Circle size={20} />
                </button>
                <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {doneItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden opacity-50">
          <div className="px-5 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Checked off</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {doneItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 group">
                <button onClick={() => toggle(item.id)} className="text-green-500">
                  <CheckCircle2 size={20} />
                </button>
                <span className="flex-1 text-sm text-gray-500 line-through">{item.text}</span>
                <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
