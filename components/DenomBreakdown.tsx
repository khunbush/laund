"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";

export function DenomBreakdown({ summary }: { summary: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="mt-0.5 block w-full text-left text-xs text-brand-muted"
    >
      {open ? (
        summary
      ) : (
        <span className="inline-flex items-center gap-1">
          {t("breakdown")}
          <span aria-hidden className="text-[10px]">
            ▸
          </span>
        </span>
      )}
    </button>
  );
}
