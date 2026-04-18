"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StepStatus = "not-started" | "in-progress" | "done" | "waiting";
type Document = { id: string; step_id: string; name: string; done: boolean };
type Step = { id: string; status: StepStatus; deadline: string };

const STEP_META: Record<string, { title: string; description: string }> = {
  "1": { title: "File I-130 (Petition for Alien Relative)", description: "USCIS form to establish the relationship between you and your spouse." },
  "2": { title: "Wait for I-130 Approval", description: "USCIS reviews and approves the petition. Timeline varies by category." },
  "3": { title: "National Visa Center (NVC) Processing", description: "After I-130 approval, case is transferred to NVC for visa processing." },
  "4": { title: "Medical Exam", description: "Appointment with a USCIS-approved civil surgeon." },
  "5": { title: "Consular Interview", description: "Visa interview at the U.S. Embassy or Consulate in home country." },
};

const STATUS_CONFIG: Record<StepStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  "not-started": { label: "Not Started", icon: Circle, color: "text-gray-500", bg: "bg-gray-100" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  "waiting": { label: "Waiting", icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50" },
  "done": { label: "Done", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
};

export default function ImmigrationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [expanded, setExpanded] = useState<string | null>("1");
  const [newDoc, setNewDoc] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: stepsData }, { data: docsData }] = await Promise.all([
        supabase.from("immigration_steps").select("*").order("id"),
        supabase.from("immigration_documents").select("*").order("created_at"),
      ]);
      if (stepsData) setSteps(stepsData);
      if (docsData) setDocs(docsData);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("immigration")
      .on("postgres_changes", { event: "*", schema: "public", table: "immigration_steps" }, () => {
        supabase.from("immigration_steps").select("*").order("id").then(({ data }) => { if (data) setSteps(data); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "immigration_documents" }, () => {
        supabase.from("immigration_documents").select("*").order("created_at").then(({ data }) => { if (data) setDocs(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(id: string, status: StepStatus) {
    await supabase.from("immigration_steps").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  }

  async function updateDeadline(id: string, deadline: string) {
    await supabase.from("immigration_steps").update({ deadline }).eq("id", id);
  }

  async function toggleDoc(doc: Document) {
    await supabase.from("immigration_documents").update({ done: !doc.done }).eq("id", doc.id);
  }

  async function addDoc(stepId: string) {
    const text = newDoc[stepId]?.trim();
    if (!text) return;
    await supabase.from("immigration_documents").insert({ step_id: stepId, name: text, done: false });
    setNewDoc((prev) => ({ ...prev, [stepId]: "" }));
  }

  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>Immigration Process</h2>
        <p className="text-sm text-gray-400 mt-1 font-medium">Tracking our spouse visa journey</p>
      </div>

      <div className="flex items-center gap-4 mb-6 bg-white border-2 border-black p-4 shadow-[4px_4px_0_#000]">
        <div className="flex-1 bg-gray-100 rounded-none h-3 overflow-hidden border border-black">
          <div className="bg-[#B8F02A] h-3 transition-all border-r border-black" style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }} />
        </div>
        <span className="text-sm font-bold shrink-0">{doneCount}/{steps.length} steps done</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm font-medium">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {steps.map((step, index) => {
            const meta = STEP_META[step.id];
            const StatusIcon = STATUS_CONFIG[step.status].icon;
            const isOpen = expanded === step.id;
            const stepDocs = docs.filter((d) => d.step_id === step.id);
            const docsDone = stepDocs.filter((d) => d.done).length;

            return (
              <div key={step.id} className="bg-white border-2 border-black shadow-[4px_4px_0_#000]">
                <button onClick={() => setExpanded(isOpen ? null : step.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="w-7 h-7 border-2 border-black flex items-center justify-center text-xs font-black shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ letterSpacing: "-0.01em" }}>{meta?.title}</p>
                    {step.deadline && <p className="text-xs text-gray-400 mt-0.5 font-medium">Deadline: {step.deadline}</p>}
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-black shrink-0 ${STATUS_CONFIG[step.status].bg} ${STATUS_CONFIG[step.status].color}`}>
                    <StatusIcon size={12} />{STATUS_CONFIG[step.status].label}
                  </span>
                  {isOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t-2 border-black pt-4">
                    <p className="text-sm text-gray-500 mb-4 font-medium">{meta?.description}</p>

                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(Object.keys(STATUS_CONFIG) as StepStatus[]).map((s) => (
                        <button key={s} onClick={() => updateStatus(step.id, s)}
                          className={`px-3 py-1 text-xs font-bold border-2 transition-all ${step.status === s ? STATUS_CONFIG[s].bg + " " + STATUS_CONFIG[s].color + " border-black shadow-[2px_2px_0_#000]" : "bg-white text-gray-500 border-gray-300 hover:border-black"}`}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">Deadline</label>
                      <input type="date" value={step.deadline} onChange={(e) => updateDeadline(step.id, e.target.value)}
                        className="border-2 border-black px-3 py-1.5 text-sm outline-none focus:bg-gray-50" />
                    </div>

                    {stepDocs.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Documents ({docsDone}/{stepDocs.length})</p>
                        <ul className="flex flex-col gap-1.5">
                          {stepDocs.map((doc) => (
                            <li key={doc.id} className="flex items-center gap-2">
                              <button onClick={() => toggleDoc(doc)} className={doc.done ? "text-black" : "text-gray-300 hover:text-black"}>
                                {doc.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </button>
                              <span className={`text-sm font-medium ${doc.done ? "line-through text-gray-400" : "text-gray-700"}`}>{doc.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input type="text" placeholder="Add document..." value={newDoc[step.id] ?? ""}
                        onChange={(e) => setNewDoc((prev) => ({ ...prev, [step.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addDoc(step.id)}
                        className="flex-1 border-2 border-black px-3 py-1.5 text-sm outline-none focus:bg-gray-50" />
                      <button onClick={() => addDoc(step.id)} className="px-3 py-1.5 bg-[#C9B1FF] border-2 border-black font-bold shadow-[2px_2px_0_#000] hover:shadow-none transition-all">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
