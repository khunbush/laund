"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/I18nProvider";

/** Re-fetches the current route's server data in place, so new machine
 * imports show up without force-closing and reopening the PWA. */
export function RefreshButton() {
  const router = useRouter();
  const { t } = useT();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      aria-label={t("refresh")}
      className="rounded-full bg-black/5 px-3 py-1.5 text-base text-brand-navy transition active:scale-95 disabled:opacity-60"
    >
      <span className={`inline-block ${pending ? "animate-spin" : ""}`}>
        ↻
      </span>
    </button>
  );
}
