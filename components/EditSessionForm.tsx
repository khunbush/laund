"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RunningTotalHero } from "@/components/RunningTotalHero";
import { DenominationInput, parseDraft } from "@/components/DenominationInput";
import {
  EMPTY_DRAFTS,
  effectiveCounts,
  type DenomDrafts,
} from "@/components/NewSessionForm";
import { updateSession } from "@/lib/actions/sessions";
import {
  DENOMINATIONS,
  computeTotal,
  formatBaht,
  type DenomCounts,
  type DenomKey,
} from "@/lib/denominations";

const notes = DENOMINATIONS.filter((d) => d.kind === "note");
const coins = DENOMINATIONS.filter((d) => d.kind === "coin");

export function EditSessionForm({
  sessionId,
  initialDate,
  initialCounts,
  initialNote,
  originalTotal,
}: {
  sessionId: string;
  initialDate: string;
  initialCounts: DenomCounts;
  initialNote: string;
  originalTotal: number;
}) {
  const router = useRouter();
  const [bank, setBank] = useState<DenomCounts>(initialCounts);
  const [drafts, setDrafts] = useState<DenomDrafts>({ ...EMPTY_DRAFTS });
  const [date, setDate] = useState(initialDate);
  const [note, setNote] = useState(initialNote);
  const boundUpdateSession = updateSession.bind(null, sessionId);
  const [state, formAction, pending] = useActionState(
    boundUpdateSession,
    undefined,
  );

  const total = computeTotal(effectiveCounts(bank, drafts));
  const totalChanged = total !== originalTotal;

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.push("/sessions");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function commit(key: DenomKey) {
    setBank((prev) => ({ ...prev, [key]: prev[key] + parseDraft(drafts[key]) }));
    setDrafts((prev) => ({ ...prev, [key]: "" }));
  }

  function recall(key: DenomKey) {
    setDrafts((prev) => ({
      ...prev,
      [key]: String(bank[key] + parseDraft(prev[key])),
    }));
    setBank((prev) => ({ ...prev, [key]: 0 }));
  }

  function renderRow(d: (typeof DENOMINATIONS)[number]) {
    return (
      <DenominationInput
        key={d.key}
        name={d.key}
        label={d.label}
        value={d.value}
        unit={d.kind}
        bank={bank[d.key]}
        draft={drafts[d.key]}
        onDraftChange={(v) => setDrafts((prev) => ({ ...prev, [d.key]: v }))}
        onCommit={() => commit(d.key)}
        onRecall={() => recall(d.key)}
      />
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-1 flex-col gap-5"
      style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <RunningTotalHero label="Session total" dateLabel={date} total={total} />

      {totalChanged && (
        <p className="rounded-xl bg-brand-orange/10 px-4 py-2 text-sm font-medium text-brand-orange-dark">
          Original total was {formatBaht(originalTotal)} — new total is{" "}
          {formatBaht(total)}.
        </p>
      )}
      {state && "error" in state && (
        <p className="rounded-xl bg-brand-orange/10 px-4 py-2 text-sm font-medium text-brand-orange-dark">
          {state.error}
        </p>
      )}

      <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
        <label htmlFor="date" className="mb-1 block text-xs text-brand-muted">
          Collection date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm font-medium text-brand-navy outline-none focus:border-brand-purple"
        />
      </div>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-brand-muted">
          Notes
        </h2>
        <div className="flex flex-col gap-2">{notes.map(renderRow)}</div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-brand-muted">
          Coins
        </h2>
        <div className="flex flex-col gap-2">{coins.map(renderRow)}</div>
      </section>

      <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
        <label htmlFor="note" className="mb-1 block text-xs text-brand-muted">
          Note (optional)
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder="e.g. coin machine jammed"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-brand-navy outline-none focus:border-brand-purple"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/sessions")}
          className="flex-1 rounded-full border border-black/10 px-6 py-3.5 text-sm font-semibold text-brand-navy transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-[2] rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
