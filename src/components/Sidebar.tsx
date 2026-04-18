"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", color: "#FFE566" },
  { href: "/calendar", label: "Calendar", color: "#FF85C1" },
  { href: "/todos", label: "To-Do Lists", color: "#B8F02A" },
  { href: "/shopping", label: "Shopping", color: "#FF8C42" },
  { href: "/notes", label: "Notes", color: "#87D4F9" },
  { href: "/immigration", label: "Immigration", color: "#C9B1FF" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-52 shrink-0 flex flex-col py-8 px-0"
      style={{ borderRight: "3px solid #000", background: "#fff" }}
    >
      {/* Brand */}
      <div className="px-6 mb-10">
        <h1
          style={{
            fontFamily: "var(--font-space), sans-serif",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "#000",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          MAYEN<br />FAMILY ✦
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex flex-col">
        {navItems.map(({ href, label, color }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center px-6 py-3 text-sm font-semibold tracking-tight transition-all"
              style={{
                background: active ? color : "transparent",
                color: "#000",
                borderBottom: "1.5px solid #e8e8e8",
                fontWeight: active ? 700 : 500,
                letterSpacing: "-0.01em",
              }}
            >
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
  );
}
