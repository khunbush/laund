"use client";

import { use } from "react";
import { useT } from "@/components/I18nProvider";
import { formatBaht } from "@/lib/denominations";
import { BRANCH_NAMES } from "@/lib/branchNames";
import { monthDay } from "@/lib/i18n";
import type { PendingMachine } from "@/lib/data/compare";

function day(lang: "en" | "th", iso: string) {
  return monthDay(lang, new Date(`${iso}T00:00:00Z`), true);
}

/**
 * What the machines took since the last laundry collection, shown under the
 * running total while counting. Today's sales only arrive with tonight's
 * upload, so the figure is a floor: counting less than it means cash is
 * definitely short — that's the only case flagged. Streams in after the form
 * (Home itself never waits on the database).
 */
export function MachineHint({
  pending,
  total,
  today,
}: {
  pending: Promise<PendingMachine | null>;
  total: number;
  today: string;
}) {
  const { lang, t } = useT();
  const data = use(pending);
  if (!data) return null;

  return (
    <div className="relative mt-3 flex flex-col gap-1 text-xs">
      {data.total > 0 && (
        <p className="text-white/70">
          {t("machinesSince", {
            amt: formatBaht(data.total),
            from: day(lang, data.since),
            to: day(lang, data.through),
          })}
          {data.through < today && (
            <span className="text-white/45"> · {t("todayArrivesTonight")}</span>
          )}
        </p>
      )}
      {data.total > 0 && total > 0 && total < data.total && (
        <p className="font-semibold text-[#f0b48a]">
          {t("belowMachines", { amt: formatBaht(data.total - total) })}
        </p>
      )}
      {data.stale.map((b) => (
        <p key={b.branch} className="font-semibold text-[#f0b48a]">
          ⚠️{" "}
          {t("uploadMissing", {
            name: BRANCH_NAMES[b.branch],
            date: day(lang, b.lastDate),
          })}
        </p>
      ))}
    </div>
  );
}
