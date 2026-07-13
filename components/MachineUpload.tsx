"use client";

import { useActionState, useRef } from "react";
import { uploadMachineCsv, type UploadState } from "@/app/compare/actions";
import { formatBaht } from "@/lib/denominations";
import { BRANCH_NAMES } from "@/lib/branchNames";
import { useT } from "@/components/I18nProvider";

export function MachineUpload() {
  const [state, action, pending] = useActionState<UploadState, FormData>(
    uploadMachineCsv,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const { t, tn } = useT();

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl border border-black/5 bg-brand-surface p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-brand-navy">
        {t("uploadCsv")}
      </h2>

      <div className="flex flex-col gap-2">
        <select
          name="branch"
          defaultValue="1"
          className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2.5 text-sm font-medium text-brand-navy outline-none focus:border-brand-purple"
        >
          <option value="1">{BRANCH_NAMES[1]}</option>
          <option value="2">{BRANCH_NAMES[2]}</option>
        </select>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-xs text-brand-navy file:mr-3 file:rounded-full file:border-0 file:bg-brand-purple/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-purple-dark"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? t("importing") : t("importCsv")}
        </button>
      </div>

      {state && !state.ok && (
        <p className="mt-3 rounded-xl bg-brand-orange/10 px-3 py-2 text-xs font-medium text-brand-orange-dark">
          {state.error}
        </p>
      )}
      {state && state.ok && (
        <p className="mt-3 rounded-xl bg-brand-green/10 px-3 py-2 text-xs font-medium text-brand-green-dark">
          {t("importResult", {
            branch:
              BRANCH_NAMES[state.summary.branch as 1 | 2] ??
              String(state.summary.branch),
            days: tn("days", state.summary.daysImported),
            amt: formatBaht(state.summary.totalRevenue),
            txns: state.summary.totalTxns,
          })}
          {state.summary.firstDate
            ? ` (${state.summary.firstDate} → ${state.summary.lastDate})`
            : ""}
          {state.summary.skipped > 0
            ? t("skippedCount", { n: state.summary.skipped })
            : ""}
        </p>
      )}
    </form>
  );
}
