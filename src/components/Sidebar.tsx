"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, CheckSquare, ShoppingCart, FileText, Globe, Tv } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", shortLabel: "Home", color: "#FFE566", icon: Home },
  { href: "/calendar", label: "Calendar", shortLabel: "Cal", color: "#FF85C1", icon: CalendarDays },
  { href: "/todos", label: "To-Do Lists", shortLabel: "To-Do", color: "#B8F02A", icon: CheckSquare },
  { href: "/shopping", label: "Shopping", shortLabel: "Shop", color: "#FF8C42", icon: ShoppingCart },
  { href: "/notes", label: "Notes", shortLabel: "Notes", color: "#87D4F9", icon: FileText },
  { href: "/immigration", label: "Immigration", shortLabel: "Visa", color: "#C9B1FF", icon: Globe },
  { href: "/watchlist", label: "Watch List", shortLabel: "Watch", color: "#FF6B6B", icon: Tv },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex w-52 shrink-0 flex-col py-8 px-0"
        style={{ borderRight: "3px solid #000", background: "#fff" }}
      >
        <div className="px-6 mb-10">
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#000", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            MAYEN<br />FAMILY ✦
          </h1>
        </div>

        <nav className="flex flex-col">
          {navItems.map(({ href, label, color, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center px-6 py-3 text-sm font-semibold tracking-tight transition-all"
                style={{ background: active ? color : "transparent", color: "#000", borderBottom: "1.5px solid #e8e8e8", fontWeight: active ? 700 : 500, letterSpacing: "-0.01em" }}>
                <Icon size={15} className="mr-2.5 shrink-0" />
                {label}
                {active && <span className="ml-auto">←</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pb-2">
          <p style={{ fontSize: "0.7rem", color: "#aaa", letterSpacing: "0.05em", fontWeight: 500 }}>
            EST. {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-white"
        style={{ borderTop: "3px solid #000" }}
      >
        {navItems.map(({ href, shortLabel, color, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ background: active ? color : "transparent", minHeight: "56px" }}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] font-bold" style={{ letterSpacing: "-0.01em" }}>
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
