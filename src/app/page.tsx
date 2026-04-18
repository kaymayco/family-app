"use client";

import Link from "next/link";

const cards = [
  {
    href: "/calendar",
    label: "Calendar",
    tag: "01 — SCHEDULE",
    desc: "Events, appointments & important dates",
    bg: "#FF85C1",
    rotate: "-1deg",
  },
  {
    href: "/todos",
    label: "To-Do Lists",
    tag: "02 — TASKS",
    desc: "Everything we need to get done",
    bg: "#B8F02A",
    rotate: "0.5deg",
  },
  {
    href: "/shopping",
    label: "Shopping",
    tag: "03 — LISTS",
    desc: "Groceries & things to pick up",
    bg: "#FF8C42",
    rotate: "-0.5deg",
  },
  {
    href: "/notes",
    label: "Notes",
    tag: "04 — INFO",
    desc: "Reminders, passwords & docs",
    bg: "#87D4F9",
    rotate: "1deg",
  },
  {
    href: "/immigration",
    label: "Immigration",
    tag: "05 — PROCESS",
    desc: "Tracking our visa journey step by step",
    bg: "#C9B1FF",
    rotate: "-0.5deg",
  },
];

export default function Home() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="mb-12">
        <div
          className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest"
          style={{ background: "#FFE566", border: "2px solid #000", letterSpacing: "0.1em" }}
        >
          {today.toUpperCase()}
        </div>
        <h2
          style={{
            fontFamily: "var(--font-space), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "#000",
          }}
        >
          Hey Kayla,<br />
          <span style={{ color: "#FF85C1" }}>what's on</span><br />
          today?
        </h2>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {cards.map(({ href, label, tag, desc, bg, rotate }) => (
          <Link
            key={href}
            href={href}
            className="group block p-5"
            style={{
              background: bg,
              border: "2.5px solid #000",
              boxShadow: "4px 4px 0px #000",
              transform: `rotate(${rotate})`,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) scale(1.02)";
              (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0px #000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = `rotate(${rotate})`;
              (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0px #000";
            }}
          >
            <p
              className="text-xs font-bold mb-3 tracking-wider"
              style={{ letterSpacing: "0.08em" }}
            >
              {tag}
            </p>
            <h3
              style={{
                fontFamily: "var(--font-space), sans-serif",
                fontWeight: 700,
                fontSize: "1.3rem",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#000",
              }}
            >
              {label}
            </h3>
            <p className="mt-2 text-xs font-medium leading-snug opacity-70">{desc}</p>
            <div
              className="mt-4 inline-block text-xs font-bold px-2 py-0.5"
              style={{ background: "#000", color: bg }}
            >
              OPEN →
            </div>
          </Link>
        ))}

        {/* Fun filler card */}
        <div
          className="p-5 flex flex-col justify-center items-center text-center"
          style={{
            background: "#fff",
            border: "2.5px dashed #000",
            transform: "rotate(0.5deg)",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "2rem" }}>✦</p>
          <p style={{ fontWeight: 600, fontSize: "0.8rem", letterSpacing: "0.05em", marginTop: "8px" }}>
            MORE SOON
          </p>
        </div>
      </div>
    </div>
  );
}
