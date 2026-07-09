"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/sessions", label: "History", icon: "🧾" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/compare", label: "Match", icon: "⚖️" },
  { href: "/branches", label: "Branches", icon: "🏪" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-10 border-t border-black/5 bg-brand-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition ${
                active ? "text-brand-purple" : "text-brand-muted"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
