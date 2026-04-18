"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

type StepStatus = "not-started" | "in-progress" | "done" | "waiting";

type Document = {
  id: string;
  name: string;
  done: boolean;
};

type Step = {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  deadline: string;
  documents: Document[];
};

const STATUS_CONFIG: Record<StepStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  "not-started": { label: "Not Started", icon: Circle, color: "text-gray-400", bg: "bg-gray-100" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  waiting: { label: "Waiting", icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-50" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
};

const DEFAULT_STEPS: Step[] = [
  {
    id: "1",
    title: "File I-130 (Petition for Alien Relative)",
    description: "USCIS form to establish the relationship between you and your spouse.",
    status: "not-started",
    deadline: "",
    documents: [
      { id: "a", name: "Completed I-130 form", done: false },
      { id: "b", name: "Marriage certificate (certified copy)", done: false },
      { id: "c", name: "Passport photos", done: false },
      { id: "d", name: "Filing fee payment", done: false },
    ],
  },
  {
    id: "2",
    title: "Wait for I-130 Approval",
    description: "USCIS reviews and approves the petition. Timeline varies by category.",
    status: "not-started",
    deadline: "",
    documents: [],
  },
  {
    id: "3",
    title: "National Visa Center (NVC) Processing",
    description: "After I-130 approval, case is transferred to NVC for visa processing.",
    status: "not-started",
    deadline: "",
    documents: [
      { id: "e", name: "DS-261 (Online choice of agent)", done: false },
      { id: "f", name: "Financial documents (I-864)", done: false },
      { id: "g", name: "Civil documents (birth cert, police records)", done: false },
    ],
  },
  {
    id: "4",
    title: "Medical Exam",
    description: "Appointment with a USCIS-approved civil surgeon.",
    status: "not-started",
    deadline: "",
    documents: [
      { id: "h", name: "I-693 Medical Examination form", done: false },
      { id: "i", name: "Vaccination records", done: false },
    ],
  },
  {
    id: "5",
    title: "Consular Interview",
    description: "Visa interview at the U.S. Embassy or Consulate in home country.",
    status: "not-started",
    deadline: "",
    documents: [
      { id: "j", name: "DS-260 (Immigrant Visa Application)", done: false },
      { id: "k", name: "All original civil documents", done: false },
      { id: "l", name: "Passport valid for 6+ months", done: false },
    ],
  },
];

export default function ImmigrationPage() {
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [expanded, setExpanded] = useState<string | null>("1");
  const [newDoc, setNewDoc] = useState<Record<string, string>>({});

  function updateStatus(id: string, status: StepStatus) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  function toggleDoc(stepId: string, docId: string) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, documents: s.documents.map((d) => (d.id === docId ? { ...d, done: !d.done } : d)) }
          : s
      )
    );
  }

  function addDoc(stepId: string) {
    const text = newDoc[stepId]?.trim();
    if (!text) return;
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, documents: [...s.documents, { id: crypto.randomUUID(), name: text, done: false }] }
          : s
      )
    );
    setNewDoc((prev) => ({ ...prev, [stepId]: "" }));
  }

  function updateDeadline(id: string, deadline: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, deadline } : s)));
  }

  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Immigration Process</h2>
        <p className="text-sm text-gray-400 mt-1">Track your spouse visa / green card journey</p>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 shrink-0">{doneCount}/{steps.length} steps done</span>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const StatusIcon = STATUS_CONFIG[step.status].icon;
          const isOpen = expanded === step.id;
          const docsDone = step.documents.filter((d) => d.done).length;

          return (
            <div key={step.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : step.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{step.title}</p>
                  {step.deadline && (
                    <p className="text-xs text-gray-400 mt-0.5">Deadline: {step.deadline}</p>
                  )}
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[step.status].bg} ${STATUS_CONFIG[step.status].color} shrink-0`}>
                  <StatusIcon size={12} />
                  {STATUS_CONFIG[step.status].label}
                </span>
                {isOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500 mb-4">{step.description}</p>

                  <div className="flex gap-2 mb-4 flex-wrap">
                    {(Object.keys(STATUS_CONFIG) as StepStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(step.id, s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          step.status === s
                            ? STATUS_CONFIG[s].bg + " " + STATUS_CONFIG[s].color + " border-transparent ring-2 ring-offset-1 ring-indigo-300"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Deadline</label>
                    <input
                      type="date"
                      value={step.deadline}
                      onChange={(e) => updateDeadline(step.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  {step.documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Documents ({docsDone}/{step.documents.length})
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {step.documents.map((doc) => (
                          <li key={doc.id} className="flex items-center gap-2">
                            <button onClick={() => toggleDoc(step.id, doc.id)} className={doc.done ? "text-green-500" : "text-gray-300 hover:text-indigo-400"}>
                              {doc.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </button>
                            <span className={`text-sm ${doc.done ? "line-through text-gray-400" : "text-gray-700"}`}>{doc.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add document..."
                      value={newDoc[step.id] ?? ""}
                      onChange={(e) => setNewDoc((prev) => ({ ...prev, [step.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addDoc(step.id)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button onClick={() => addDoc(step.id)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
