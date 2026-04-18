"use client";

import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";

type Note = {
  id: string;
  title: string;
  body: string;
  tag: string;
  createdAt: string;
};

const TAGS = ["General", "Important", "Passwords", "Medical", "Finance", "Documents"];

const TAG_COLORS: Record<string, string> = {
  General: "bg-gray-100 text-gray-600",
  Important: "bg-red-100 text-red-600",
  Passwords: "bg-purple-100 text-purple-600",
  Medical: "bg-blue-100 text-blue-600",
  Finance: "bg-green-100 text-green-600",
  Documents: "bg-yellow-100 text-yellow-600",
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", tag: "General" });
  const [filter, setFilter] = useState("All");

  function addNote() {
    if (!form.title.trim()) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      body: form.body.trim(),
      tag: form.tag,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelected(newNote.id);
    setShowForm(false);
    setForm({ title: "", body: "", tag: "General" });
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selected === id) setSelected(null);
  }

  function updateNote(id: string, field: "title" | "body", value: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  }

  const filteredNotes = filter === "All" ? notes : notes.filter((n) => n.tag === filter);
  const activeNote = notes.find((n) => n.id === selected);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus size={15} /> New Note
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["All", ...TAGS].map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === tag
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex gap-4 h-[500px]">
        <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {filteredNotes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No notes yet</p>
            </div>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelected(note.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selected === note.id
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-white border-gray-100 hover:border-gray-200"
              }`}
            >
              <p className="font-medium text-sm text-gray-800 truncate">{note.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{note.body || "No content"}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[note.tag]}`}>{note.tag}</span>
                <span className="text-xs text-gray-300">{note.createdAt}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {!activeNote ? (
            <div className="h-full flex items-center justify-center text-gray-300">
              <div className="text-center">
                <FileText size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a note to view it</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <input
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, "title", e.target.value)}
                  className="font-semibold text-gray-800 flex-1 outline-none bg-transparent"
                />
                <button onClick={() => deleteNote(activeNote.id)} className="text-gray-300 hover:text-red-400 ml-3 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                value={activeNote.body}
                onChange={(e) => updateNote(activeNote.id, "body", e.target.value)}
                placeholder="Write your note here..."
                className="flex-1 p-5 text-sm text-gray-700 resize-none outline-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-4">New Note</h3>
            <input
              autoFocus
              type="text"
              placeholder="Title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="flex gap-2 flex-wrap mb-4">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setForm((f) => ({ ...f, tag }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.tag === tag ? TAG_COLORS[tag] + " ring-2 ring-offset-1 ring-indigo-300" : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={addNote} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
