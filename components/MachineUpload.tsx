"use client";

import { useActionState, useRef } from "react";
import { uploadMachineCsv, type UploadState } from "@/app/compare/actions";
import { formatBaht } from "@/lib/denominations";

export function MachineUpload() {
  const [state, action, pending] = useActionState<UploadState, FormData>(
    uploadMachineCsv,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl border border-black/5 bg-brand-surface p-4"
    >
      <h2 className="mb-1 text-sm font-semibold text-brand-navy">
        Upload machine CSV
      </h2>
      <p className="mb-3 text-xs text-brand-muted">
        Export from a washclub branch, pick which branch, and upload. Re-uploading
        a date range just updates it.
      </p>

      <div className="flex flex-col gap-2">
        <select
          name="branch"
          defaultValue="1"
          className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2.5 text-sm font-medium text-brand-navy outline-none focus:border-brand-purple"
        >
          <option value="1">Branch 1 — washclub</option>
          <option value="2">Branch 2 — washclub v2</option>
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
          {pending ? "Importing…" : "Import CSV"}
        </button>
      </div>

      {state && !state.ok && (
        <p className="mt-3 rounded-xl bg-brand-orange/10 px-3 py-2 text-xs font-medium text-brand-orange-dark">
          {state.error}
        </p>
      )}
      {state && state.ok && (
        <p className="mt-3 rounded-xl bg-[#0ca30c]/10 px-3 py-2 text-xs font-medium text-[#0a7d0a]">
          Imported branch {state.summary.branch}:{" "}
          {state.summary.daysImported} day
          {state.summary.daysImported === 1 ? "" : "s"} ·{" "}
          {formatBaht(state.summary.totalRevenue)} · {state.summary.totalTxns}{" "}
          transactions
          {state.summary.firstDate
            ? ` (${state.summary.firstDate} → ${state.summary.lastDate})`
            : ""}
          {state.summary.skipped > 0
            ? ` · ${state.summary.skipped} skipped`
            : ""}
        </p>
      )}
    </form>
  );
}
