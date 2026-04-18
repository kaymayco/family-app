"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

type TodoList = {
  id: string;
  name: string;
  items: TodoItem[];
};

const DEFAULT_LISTS: TodoList[] = [
  { id: "1", name: "House Tasks", items: [] },
  { id: "2", name: "Errands", items: [] },
  { id: "3", name: "Work", items: [] },
];

export default function TodosPage() {
  const [lists, setLists] = useState<TodoList[]>(DEFAULT_LISTS);
  const [activeList, setActiveList] = useState("1");
  const [input, setInput] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showNewList, setShowNewList] = useState(false);

  const current = lists.find((l) => l.id === activeList);

  function addItem() {
    if (!input.trim() || !current) return;
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeList
          ? { ...l, items: [...l.items, { id: crypto.randomUUID(), text: input.trim(), done: false }] }
          : l
      )
    );
    setInput("");
  }

  function toggleItem(itemId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeList
          ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : l
      )
    );
  }

  function deleteItem(itemId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeList ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
      )
    );
  }

  function addList() {
    if (!newListName.trim()) return;
    const newList = { id: crypto.randomUUID(), name: newListName.trim(), items: [] };
    setLists((prev) => [...prev, newList]);
    setActiveList(newList.id);
    setNewListName("");
    setShowNewList(false);
  }

  const done = current?.items.filter((i) => i.done).length ?? 0;
  const total = current?.items.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">To-Do Lists</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveList(l.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeList === l.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {l.name}
            <span className="ml-1.5 opacity-70">
              ({l.items.filter((i) => !i.done).length})
            </span>
          </button>
        ))}
        <button
          onClick={() => setShowNewList(true)}
          className="px-4 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          + New list
        </button>
      </div>

      {showNewList && (
        <div className="flex gap-2 mb-4">
          <input
            autoFocus
            type="text"
            placeholder="List name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addList()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button onClick={addList} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Add
          </button>
          <button onClick={() => setShowNewList(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}

      {current && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{current.name}</h3>
            {total > 0 && (
              <span className="text-xs text-gray-400">{done}/{total} done</span>
            )}
          </div>

          <div className="flex gap-2 p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Add a task..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button onClick={addItem} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>

          <ul className="divide-y divide-gray-50">
            {current.items.length === 0 && (
              <li className="px-5 py-8 text-center text-gray-400 text-sm">No tasks yet — add one above!</li>
            )}
            {current.items.filter((i) => !i.done).map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                <button onClick={() => toggleItem(item.id)} className="text-gray-300 hover:text-indigo-500 transition-colors">
                  <Circle size={20} />
                </button>
                <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
            {current.items.filter((i) => i.done).map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group opacity-50">
                <button onClick={() => toggleItem(item.id)} className="text-green-500">
                  <CheckCircle2 size={20} />
                </button>
                <span className="flex-1 text-sm text-gray-500 line-through">{item.text}</span>
                <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
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
