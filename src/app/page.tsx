"use client";

import Link from "next/link";
import { Calendar, CheckSquare, ShoppingCart, FileText, Plane } from "lucide-react";

const quickLinks = [
  { href: "/calendar", label: "Calendar", icon: Calendar, color: "bg-indigo-50 text-indigo-600", desc: "View upcoming events" },
  { href: "/todos", label: "To-Do Lists", icon: CheckSquare, color: "bg-green-50 text-green-600", desc: "Tasks to get done" },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart, color: "bg-orange-50 text-orange-600", desc: "Grocery & shopping lists" },
  { href: "/notes", label: "Notes", icon: FileText, color: "bg-yellow-50 text-yellow-600", desc: "Important info & reminders" },
  { href: "/immigration", label: "Immigration", icon: Plane, color: "bg-blue-50 text-blue-600", desc: "Track your process" },
];

export default function Home() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">{today}</p>
        <h2 className="text-3xl font-bold text-gray-800">Welcome home, Kayla</h2>
        <p className="text-gray-500 mt-1">Here&apos;s everything to keep your family on track.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map(({ href, label, icon: Icon, color, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
