"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import type { MsgKey } from "@/lib/i18n";

// Line icons drawn in currentColor so the active/inactive tint follows the
// theme (emoji rendered in their own colors and looked pasted-on).
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const TABS: { href: string; label: MsgKey; icon: ReactNode }[] = [
  {
    href: "/",
    label: "tabHome",
    icon: (
      <Icon>
        <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
      </Icon>
    ),
  },
  {
    href: "/sessions",
    label: "tabHistory",
    icon: (
      <Icon>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </Icon>
    ),
  },
  {
    href: "/dashboard",
    label: "tabDashboard",
    icon: (
      <Icon>
        <path d="M5 20v-7M12 20V5M19 20v-10M3 20h18" />
      </Icon>
    ),
  },
  {
    href: "/compare",
    label: "tabMatch",
    icon: (
      <Icon>
        <path d="M12 4v16M8 20h8M5 7h14" />
        <path d="M5 7 2.5 13a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />
      </Icon>
    ),
  },
  {
    href: "/branches",
    label: "tabBranches",
    icon: (
      <Icon>
        <path d="M4 10.5V20h16v-9.5" />
        <path d="M3 4h18l-1.2 5a2.6 2.6 0 0 1-5 .2 2.8 2.8 0 0 1-5.6 0 2.6 2.6 0 0 1-5-.2z" />
        <path d="M10 20v-5h4v5" />
      </Icon>
    ),
  },
];

/** Tab contents; lives inside the Link so it can read the link's pending state
 * and light up the moment it's tapped, before the next page arrives. */
function TabInner({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  const { pending } = useLinkStatus();
  const on = active || pending;
  return (
    <span
      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition ${
        on ? "text-brand-purple" : "text-brand-muted"
      } ${pending ? "bg-brand-purple/10" : ""}`}
    >
      {icon}
      {label}
    </span>
  );
}

/**
 * Rendered once in the root layout (not per page) so it stays mounted across
 * tab switches instead of being torn down and redrawn with every page.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useT();
  const navRef = useRef<HTMLElement>(null);
  const hidden = pathname === "/login" || pathname.startsWith("/login/");

  // Publish the bar's height (it varies with the safe-area inset) so pinned
  // elements, like Home's Save bar, can sit just above it.
  useEffect(() => {
    const el = navRef.current;
    const root = document.documentElement;
    if (!el) {
      root.style.setProperty("--tabbar-h", "0px");
      return;
    }
    const update = () =>
      root.style.setProperty("--tabbar-h", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav
      ref={navRef}
      className="safe-bottom sticky bottom-0 z-10 border-t border-black/5 bg-brand-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} prefetch={true}>
              <TabInner active={active} icon={tab.icon} label={t(tab.label)} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
