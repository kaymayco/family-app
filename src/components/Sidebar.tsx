"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  CheckSquare,
  ShoppingCart,
  FileText,
  Plane,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/todos", label: "To-Do Lists", icon: CheckSquare },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/immigration", label: "Immigration", icon: Plane },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shadow-sm">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-bold text-indigo-700">Mayen Family</h1>
        <p className="text-xs text-gray-400 mt-0.5">Family Hub</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
