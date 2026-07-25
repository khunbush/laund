"use client";

import { useState, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";

/** Shows the first `initialCount` items with a "Show all (n)" / "Show less"
 * toggle underneath. Everything is already loaded — the toggle is pure UI,
 * so expanding never waits on the network. */
export function ShowAllList({
  items,
  initialCount = 5,
}: {
  items: ReactNode[];
  initialCount?: number;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const collapsible = items.length > initialCount;
  return (
    <div className="flex flex-col gap-2">
      {collapsible && !expanded ? items.slice(0, initialCount) : items}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm font-semibold text-brand-navy/70 transition active:scale-[0.99]"
        >
          {expanded ? t("showLess") : t("showAll", { n: items.length })}
        </button>
      )}
    </div>
  );
}
