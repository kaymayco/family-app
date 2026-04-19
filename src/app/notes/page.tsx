"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Note = { id: string; title: string; body: string; tag: string; created_at: string };

const TAGS = ["General", "Important", "Passwords", "Medical", "Finance", "Documents"];
const TAG_COLORS: Record<string, string> = {
  General: "bg-gray-100 text-gray-700",
  Important: "bg-red-100 text-red-700",
  Passwords: "bg-purple-100 text-purple-700",
  Medical: "bg-blue-100 text-blue-700",
  Finance: "bg-green-100 text-green-700",
  Documents: "bg-yellow-100 text-yellow-700",
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", tag: "General" });
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("notes").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) { setNotes(data); if (data[0]) setSelected(data[0].id); }
      setLoading(false);
    });

    const channel = supabase
      .channel("notes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => {
        supabase.from("notes").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          if (data) setNotes(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function addNote() {
    if (!form.title.trim()) return;
    const { data } = await supabase.from("notes").insert({ title: form.title.trim(), body: "", tag: form.tag }).select().single();
    if (data) setSelected(data.id);
    setShowForm(false);
    setForm({ title: "", tag: "General" });
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    setSelected(null);
  }

  async function updateNote(id: string, field: "title" | "body", value: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
    setSaving(true);
    await supabase.from("notes").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(false);
  }

  const filteredNotes = filter === "All" ? notes : notes.filter((n) => n.tag === filter);
  const activeNote = notes.find((n) => n.id === selected);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>Notes</h2>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#87D4F9] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000] hover:shadow-none transition-all">
          <Plus size={15} /> New Note
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["All", ...TAGS].map((tag) => (
          <button key={tag} onClick={() => setFilter(tag)}
            className="px-3 py-1 text-xs font-bold border-2 transition-all"
            style={{ background: filter === tag ? "#000" : "#fff", color: filter === tag ? "#fff" : "#000", borderColor: "#000" }}>
            {tag}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:h-[500px]">
        <div className="w-full md:w-60 shrink-0 flex flex-col gap-2 max-h-[240px] md:max-h-none overflow-y-auto">
          {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
          {!loading && filteredNotes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No notes yet</p>
            </div>
          )}
          {filteredNotes.map((note) => (
            <button key={note.id} onClick={() => setSelected(note.id)}
              className="text-left p-3 border-2 transition-all"
              style={{ borderColor: selected === note.id ? "#000" : "#e5e5e5", background: selected === note.id ? "#FFE566" : "#fff", boxShadow: selected === note.id ? "3px 3px 0 #000" : "none" }}>
              <p className="font-bold text-sm truncate">{note.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{note.body || "No content"}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-1.5 py-0.5 font-bold border border-black ${TAG_COLORS[note.tag]}`}>{note.tag}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white border-2 border-black shadow-[4px_4px_0_#000] overflow-hidden min-h-[300px] md:min-h-0">
          {!activeNote ? (
            <div className="h-full flex items-center justify-center text-gray-300">
              <div className="text-center">
                <FileText size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Select a note to view it</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black">
                <input value={activeNote.title} onChange={(e) => updateNote(activeNote.id, "title", e.target.value)}
                  className="font-bold text-gray-800 flex-1 outline-none bg-transparent" style={{ letterSpacing: "-0.02em" }} />
                <div className="flex items-center gap-3">
                  {saving && <span className="text-xs text-gray-400 font-medium">Saving...</span>}
                  <button onClick={() => deleteNote(activeNote.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <textarea value={activeNote.body} onChange={(e) => updateNote(activeNote.id, "body", e.target.value)}
                placeholder="Write your note here..."
                className="flex-1 p-5 text-sm text-gray-700 resize-none outline-none leading-relaxed" />
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black shadow-[6px_6px_0_#000] p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-4" style={{ letterSpacing: "-0.03em" }}>New Note</h3>
            <input autoFocus type="text" placeholder="Title..." value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              className="w-full border-2 border-black px-3 py-2 text-sm mb-3 outline-none focus:bg-gray-50" />
            <div className="flex gap-2 flex-wrap mb-4">
              {TAGS.map((tag) => (
                <button key={tag} onClick={() => setForm((f) => ({ ...f, tag }))}
                  className={`px-2 py-1 text-xs font-bold border-2 transition-all ${form.tag === tag ? TAG_COLORS[tag] + " border-black shadow-[2px_2px_0_#000]" : "bg-white text-gray-500 border-gray-300"}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border-2 border-black text-sm font-bold hover:bg-gray-50">Cancel</button>
              <button onClick={addNote} className="flex-1 py-2 bg-[#87D4F9] border-2 border-black text-sm font-bold shadow-[3px_3px_0_#000] hover:shadow-none transition-all">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
