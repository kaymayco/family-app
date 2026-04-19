"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, ChevronDown, ChevronRight, Upload, FileText, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StepStatus = "not-started" | "in-progress" | "done" | "waiting";
type Document = { id: string; step_id: string; name: string; done: boolean; file_url?: string };
type Step = { id: string; status: StepStatus; deadline: string; notes?: string };

const STEP_META: Record<string, { title: string; description: string; tip: string; seedDocs: string[] }> = {
  "1": {
    title: "File I-130 (Petition for Alien Relative)",
    description: "Filed by Kayla (US citizen) to establish the spousal relationship and sponsor Rosbin for permanent residency. This kicks off the entire immigration process.",
    tip: "✅ Completed!",
    seedDocs: [],
  },
  "2": {
    title: "I-130 Approved by USCIS",
    description: "USCIS reviewed and approved the petition. The case was then transferred to the National Visa Center (NVC) to begin immigrant visa processing.",
    tip: "✅ Completed!",
    seedDocs: [],
  },
  "3": {
    title: "File I-601A Provisional Unlawful Presence Waiver",
    description: "Because Rosbin entered without inspection and was a DACA recipient, leaving the US triggers a 10-year bar due to unlawful presence. The I-601A must be approved BEFORE leaving so Rosbin can safely attend the consular interview. Kayla must prove 'extreme hardship' if Rosbin cannot return.",
    tip: "⚠️ Current step. The hardship case is everything — more documentation = stronger case. A strong personal letter from Kayla and a psychological evaluation are highly recommended.",
    seedDocs: [
      "Completed Form I-601A",
      "Filing fee payment ($800)",
      "Proof of qualifying relationship (marriage certificate)",
      "Hardship letter from Kayla (detailed and personal)",
      "Psychological evaluation of Kayla",
      "Medical records (if health-related hardship)",
      "Financial records showing joint dependency",
      "Evidence of Kayla's ties to the US (job, family, property, community)",
      "Evidence of dangerous conditions in Rosbin's home country",
      "Proof of Rosbin's DACA status",
      "Evidence of life together (photos, lease, bills, travel, etc.)",
    ],
  },
  "4": {
    title: "Wait for I-601A Approval",
    description: "USCIS reviews the waiver. Processing can take several months to over a year. You'll receive a Notice of Action (NOA) when it's approved. The waiver is 'provisional' — it's only fully effective once the consular officer approves the visa.",
    tip: "💡 Use this waiting period to prepare all NVC documents so you're ready to move fast once approved.",
    seedDocs: [
      "Notice of Action (NOA) confirming receipt",
      "I-601A approval notice",
    ],
  },
  "5": {
    title: "NVC Processing (National Visa Center)",
    description: "The NVC manages visa processing after I-130 approval. You'll pay fees, submit the immigrant visa application (DS-260), and provide civil documents and financial support forms. NVC will send a Welcome Letter with your case number.",
    tip: "💡 Log in at ceac.state.gov with your NVC case number to submit documents online. Organize everything before starting.",
    seedDocs: [
      "NVC Welcome Letter (with case number)",
      "Immigrant visa fee paid ($325)",
      "Affidavit of Support fee paid ($120)",
      "Completed DS-260 (Immigrant Visa Application)",
      "Form I-864 Affidavit of Support (signed by Kayla)",
      "Kayla's tax returns (last 3 years)",
      "Kayla's W-2s and recent pay stubs",
      "Rosbin's birth certificate (with certified translation)",
      "Valid passport for Rosbin (6+ months validity)",
      "Marriage certificate (certified copy)",
      "Police certificate from every country Rosbin has lived in",
      "Any divorce decrees (if applicable)",
    ],
  },
  "6": {
    title: "Schedule Consular Interview",
    description: "Once NVC completes processing and forwards the case to the US Embassy in Rosbin's home country, you'll receive instructions to schedule the visa interview. Interview availability varies greatly by country.",
    tip: "💡 Check the embassy's appointment wait times early. You can often schedule far in advance.",
    seedDocs: [
      "Embassy notification / case forwarded letter",
      "Interview appointment confirmation",
    ],
  },
  "7": {
    title: "Medical Exam (In Home Country)",
    description: "Rosbin must complete a medical exam with an embassy-approved 'panel physician' in the home country before the interview. The doctor issues a sealed medical packet — do NOT open it, it gets handed directly to the consular officer.",
    tip: "💡 Bring complete vaccination records. If missing vaccines, you may need to get them at the exam — budget extra time. Check the embassy's approved physicians list.",
    seedDocs: [
      "Vaccination records / immunization history",
      "Medical exam appointment confirmed",
      "Sealed medical exam results (Form I-693) — do NOT open",
    ],
  },
  "8": {
    title: "Consular Interview at US Embassy",
    description: "Rosbin attends the immigrant visa interview at the US Embassy or Consulate in the home country. The officer reviews all documents and asks questions about the relationship and Rosbin's background. This is the final major hurdle.",
    tip: "💡 Bring originals AND copies of everything. Be consistent, honest, and calm. Strong joint evidence of your real relationship helps a lot. The I-601A waiver becomes effective here if the officer approves.",
    seedDocs: [
      "Valid passport",
      "Interview appointment letter",
      "DS-260 confirmation page (printed)",
      "I-601A approval notice",
      "Sealed medical exam packet",
      "Marriage certificate (original)",
      "Birth certificate (original + translation)",
      "Police certificates",
      "I-864 Affidavit of Support",
      "Kayla's financial evidence (tax returns, pay stubs)",
      "Photos of Rosbin and Kayla together",
      "Evidence of shared life (lease, bills, travel, etc.)",
    ],
  },
  "9": {
    title: "Visa Issuance",
    description: "If approved, the consular officer stamps an immigrant visa in Rosbin's passport. There may be a short processing wait. The visa is valid for 6 months from issuance — Rosbin must enter the US within that window. Pay the USCIS Immigrant Fee before entry.",
    tip: "💡 Pay the $220 USCIS Immigrant Fee at uscis.gov before Rosbin arrives in the US. Bring the sealed visa packet — do NOT open it.",
    seedDocs: [
      "Immigrant visa stamp in passport",
      "USCIS Immigrant Fee paid ($220) — pay before entering US",
      "Sealed visa packet from embassy",
    ],
  },
  "10": {
    title: "Enter the US & Receive Green Card",
    description: "Rosbin enters as a Lawful Permanent Resident (LPR). The CBP officer at the port of entry will process the sealed packet and stamp the passport as temporary proof. The green card will be mailed within a few weeks. If married less than 2 years at time of entry, the card is 'conditional' and requires filing I-751 to remove conditions.",
    tip: "💡 If conditional: mark your calendar for 90 days BEFORE the card's 2-year expiration — that's the filing window for I-751 (Remove Conditions on Residence).",
    seedDocs: [
      "Entry stamp from CBP at port of entry",
      "Green card received in mail",
      "If conditional green card: File I-751 within 90-day window before expiration",
    ],
  },
};

const STATUS_CONFIG: Record<StepStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  "not-started": { label: "Not Started", icon: Circle, color: "text-gray-500", bg: "bg-gray-100" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  "waiting": { label: "Waiting", icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50" },
  "done": { label: "Done ✓", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
};

export default function ImmigrationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [expanded, setExpanded] = useState<string | null>("3");
  const [newDoc, setNewDoc] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    await supabase.from("immigration_steps").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  }

  async function updateDeadline(id: string, deadline: string) {
    await supabase.from("immigration_steps").update({ deadline }).eq("id", id);
  }

  async function toggleDoc(doc: Document) {
    setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, done: !d.done } : d));
    await supabase.from("immigration_documents").update({ done: !doc.done }).eq("id", doc.id);
  }

  async function addDoc(stepId: string) {
    const text = newDoc[stepId]?.trim();
    if (!text) return;
    setNewDoc((prev) => ({ ...prev, [stepId]: "" }));
    const { data } = await supabase.from("immigration_documents")
      .insert({ step_id: stepId, name: text, done: false })
      .select().single();
    if (data) setDocs((prev) => [...prev, data as Document]);
  }

  async function deleteDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    await supabase.from("immigration_documents").delete().eq("id", id);
  }

  async function uploadFile(doc: Document, file: File) {
    setUploading(doc.id);
    try {
      const ext = file.name.split(".").pop() ?? "file";
      const path = `step-${doc.step_id}/${doc.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("immigration-docs")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("immigration-docs")
        .getPublicUrl(path);

      await supabase.from("immigration_documents").update({ file_url: publicUrl }).eq("id", doc.id);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed — make sure the 'immigration-docs' storage bucket exists in Supabase.");
    } finally {
      setUploading(null);
    }
  }

  async function removeFile(doc: Document) {
    await supabase.from("immigration_documents").update({ file_url: null }).eq("id", doc.id);
  }

  const doneCount = steps.filter((s) => s.status === "done").length;
  const totalSteps = Object.keys(STEP_META).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.03em" }}>
          Immigration Journey
        </h2>
        <p className="text-sm text-gray-400 mt-1 font-medium">Rosbin's path to permanent residency — DACA → Consular Processing</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-6 bg-white border-2 border-black p-4 shadow-[4px_4px_0_#000]">
        <div className="flex-1 bg-gray-100 rounded-none h-3 overflow-hidden border border-black">
          <div
            className="bg-[#B8F02A] h-3 transition-all border-r border-black"
            style={{ width: `${(doneCount / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold shrink-0">{doneCount}/{totalSteps} steps done</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm font-medium">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(STEP_META).map(([stepId, meta], index) => {
            const step = steps.find((s) => s.id === stepId);
            const status: StepStatus = step?.status ?? "not-started";
            const StatusIcon = STATUS_CONFIG[status].icon;
            const isOpen = expanded === stepId;
            const stepDocs = docs.filter((d) => d.step_id === stepId);
            const docsDone = stepDocs.filter((d) => d.done).length;
            const isCurrent = stepId === "3";

            return (
              <div
                key={stepId}
                className={`bg-white border-2 border-black ${isCurrent && status === "in-progress" ? "shadow-[4px_4px_0_#B8F02A]" : "shadow-[4px_4px_0_#000]"}`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : stepId)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-7 h-7 border-2 border-black flex items-center justify-center text-xs font-black shrink-0 ${status === "done" ? "bg-[#B8F02A]" : "bg-white"}`}>
                    {status === "done" ? "✓" : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ letterSpacing: "-0.01em" }}>{meta.title}</p>
                    {step?.deadline && (
                      <p className="text-xs text-gray-400 mt-0.5 font-medium">Deadline: {step.deadline}</p>
                    )}
                    {stepDocs.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 font-medium">
                        {docsDone}/{stepDocs.length} docs complete
                      </p>
                    )}
                  </div>
                  <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-black shrink-0 ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`}>
                    <StatusIcon size={12} />{STATUS_CONFIG[status].label}
                  </span>
                  <span className={`sm:hidden flex items-center justify-center w-6 h-6 shrink-0 ${STATUS_CONFIG[status].color}`}>
                    <StatusIcon size={16} />
                  </span>
                  {isOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t-2 border-black pt-4">
                    <p className="text-sm text-gray-600 mb-3 font-medium leading-relaxed">{meta.description}</p>

                    {meta.tip && (
                      <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs font-medium text-yellow-800 leading-relaxed">
                        {meta.tip}
                      </div>
                    )}

                    {/* Status buttons */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(Object.keys(STATUS_CONFIG) as StepStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => step && updateStatus(step.id, s)}
                          className={`px-3 py-1 text-xs font-bold border-2 transition-all ${
                            status === s
                              ? STATUS_CONFIG[s].bg + " " + STATUS_CONFIG[s].color + " border-black shadow-[2px_2px_0_#000]"
                              : "bg-white text-gray-500 border-gray-300 hover:border-black"
                          }`}
                        >
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>

                    {/* Deadline */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">Target / Deadline Date</label>
                      <input
                        type="date"
                        value={step?.deadline ?? ""}
                        onChange={(e) => step && updateDeadline(step.id, e.target.value)}
                        className="border-2 border-black px-3 py-1.5 text-sm outline-none focus:bg-gray-50"
                      />
                    </div>

                    {/* Documents / Checklist */}
                    {stepDocs.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                          Checklist ({docsDone}/{stepDocs.length} complete)
                        </p>
                        <ul className="flex flex-col gap-2">
                          {stepDocs.map((doc) => (
                            <li key={doc.id} className="flex items-start gap-2 group">
                              <button
                                onClick={() => toggleDoc(doc)}
                                className={`mt-0.5 shrink-0 ${doc.done ? "text-black" : "text-gray-300 hover:text-black"}`}
                              >
                                {doc.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </button>
                              <span className={`flex-1 text-sm font-medium leading-snug ${doc.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                                {doc.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {/* File attached */}
                                {doc.file_url ? (
                                  <div className="flex items-center gap-1">
                                    <a
                                      href={doc.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline"
                                    >
                                      <FileText size={12} />
                                      <ExternalLink size={10} />
                                    </a>
                                    <button onClick={() => removeFile(doc)} className="text-gray-300 hover:text-red-400 ml-1">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadFile(doc, file);
                                        e.target.value = "";
                                      }}
                                    />
                                    <button
                                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                                      disabled={uploading === doc.id}
                                      className="text-gray-300 hover:text-indigo-500 transition-colors"
                                      title="Attach file"
                                    >
                                      {uploading === doc.id ? (
                                        <span className="text-[10px] font-bold text-indigo-400">uploading...</span>
                                      ) : (
                                        <Upload size={12} />
                                      )}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => deleteDoc(doc.id)}
                                  className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1"
                                  title="Remove item"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Add document */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add checklist item..."
                        value={newDoc[stepId] ?? ""}
                        onChange={(e) => setNewDoc((prev) => ({ ...prev, [stepId]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addDoc(stepId)}
                        className="flex-1 border-2 border-black px-3 py-1.5 text-sm outline-none focus:bg-gray-50"
                      />
                      <button
                        onClick={() => addDoc(stepId)}
                        className="px-3 py-1.5 bg-[#C9B1FF] border-2 border-black font-bold shadow-[2px_2px_0_#000] hover:shadow-none transition-all"
                      >
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
