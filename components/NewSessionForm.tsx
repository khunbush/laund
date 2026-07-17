"use client";

import { useActionState, useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { shortDate, type Lang } from "@/lib/i18n";
import { RunningTotalHero } from "@/components/RunningTotalHero";
import { DenominationInput, parseDraft } from "@/components/DenominationInput";
import { KindSelector } from "@/components/KindSelector";
import { createSession } from "@/lib/actions/sessions";
import type { SessionKindValue } from "@/lib/kinds";
import {
  DENOMINATIONS,
  EMPTY_COUNTS,
  computeTotal,
  type DenomCounts,
  type DenomKey,
} from "@/lib/denominations";

const notes = DENOMINATIONS.filter((d) => d.kind === "note");
const coins = DENOMINATIONS.filter((d) => d.kind === "coin");

export type DenomDrafts = Record<DenomKey, string>;

export const EMPTY_DRAFTS: DenomDrafts = {
  note1000: "",
  note500: "",
  note100: "",
  note50: "",
  note20: "",
  coin10: "",
  coin5: "",
  coin2: "",
  coin1: "",
};

export function effectiveCounts(
  bank: DenomCounts,
  drafts: DenomDrafts,
): DenomCounts {
  const out = { ...bank };
  for (const key of Object.keys(out) as DenomKey[]) {
    out[key] += parseDraft(drafts[key]);
  }
  return out;
}

function todayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayLabel(lang: Lang) {
  return shortDate(lang, new Date());
}

export function NewSessionForm() {
  const { lang, t } = useT();
  const [bank, setBank] = useState<DenomCounts>({ ...EMPTY_COUNTS });
  const [drafts, setDrafts] = useState<DenomDrafts>({ ...EMPTY_DRAFTS });
  const [kind, setKind] = useState<SessionKindValue>("LAUNDRY");
  const [note, setNote] = useState("");
  const [showMoreNotes, setShowMoreNotes] = useState(false);
  const [showMoreCoins, setShowMoreCoins] = useState(false);
  const [state, formAction, pending] = useActionState(createSession, undefined);

  const total = computeTotal(effectiveCounts(bank, drafts));
  const date = todayIso();

  function commit(key: DenomKey) {
    setBank((prev) => ({ ...prev, [key]: prev[key] + parseDraft(drafts[key]) }));
    setDrafts((prev) => ({ ...prev, [key]: "" }));
  }

  function quickAdd(key: DenomKey) {
    setBank((prev) => ({ ...prev, [key]: prev[key] + 100 }));
  }

  function recall(key: DenomKey) {
    setDrafts((prev) => ({
      ...prev,
      [key]: String(bank[key] + parseDraft(prev[key])),
    }));
    setBank((prev) => ({ ...prev, [key]: 0 }));
  }

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setBank({ ...EMPTY_COUNTS });
      setDrafts({ ...EMPTY_DRAFTS });
      setKind("LAUNDRY");
      setNote("");
    }
  }, [state]);

  function renderRow(d: (typeof DENOMINATIONS)[number], mutedRow = false) {
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
        onQuickAdd={() => quickAdd(d.key)}
        muted={mutedRow}
      />
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-5 pb-6">
      <input type="hidden" name="date" value={date} />

      <RunningTotalHero
        label={t("todaysCollection")}
        dateLabel={todayLabel(lang)}
        total={total}
      />

      <KindSelector value={kind} onChange={setKind} />

      {state && "error" in state && (
        <p className="rounded-xl bg-brand-orange/10 px-4 py-2 text-sm font-medium text-brand-orange-dark">
          {state.error}
        </p>
      )}
      {state && "ok" in state && state.ok && (
        <p className="rounded-xl bg-brand-purple/10 px-4 py-2 text-sm font-medium text-brand-purple-dark">
          {t("sessionSaved")}
        </p>
      )}

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-brand-muted">
          {t("notesSection")}
        </h2>
        <div className="flex flex-col gap-2">
          {notes.filter((d) => d.common).map((d) => renderRow(d))}
          {showMoreNotes &&
            notes.filter((d) => !d.common).map((d) => renderRow(d, true))}
        </div>
        <button
          type="button"
          onClick={() => setShowMoreNotes((v) => !v)}
          className="mt-2 px-1 text-xs font-medium text-brand-purple"
        >
          {showMoreNotes ? t("hideBigNotes") : t("showBigNotes")}
        </button>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-brand-muted">
          {t("coinsSection")}
        </h2>
        <div className="flex flex-col gap-2">
          {coins.filter((d) => d.common).map((d) => renderRow(d))}
          {showMoreCoins &&
            coins.filter((d) => !d.common).map((d) => renderRow(d, true))}
        </div>
        <button
          type="button"
          onClick={() => setShowMoreCoins((v) => !v)}
          className="mt-2 px-1 text-xs font-medium text-brand-purple"
        >
          {showMoreCoins ? t("hide2Coins") : t("show2Coins")}
        </button>
      </section>

      <div className="rounded-2xl border border-black/5 bg-brand-surface p-4">
        <label htmlFor="note" className="mb-1 block text-xs text-brand-muted">
          {t("noteOptional")}
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder={t("notePlaceholder")}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-brand-navy outline-none focus:border-brand-purple"
        />
      </div>

      <button
        type="submit"
        disabled={pending || total === 0}
        className="w-full rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-4 text-base font-semibold text-white shadow-xl shadow-brand-purple/25 transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending
          ? t("saving")
          : t("saveSession", { total: total.toLocaleString() })}
      </button>
    </form>
  );
}
