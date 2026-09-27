"use client";

import Link from "next/link";
import {
  Suspense,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useT } from "@/components/I18nProvider";
import { shortDate, type Lang } from "@/lib/i18n";
import { RunningTotalHero } from "@/components/RunningTotalHero";
import { DenominationInput, parseDraft } from "@/components/DenominationInput";
import { KindSelector } from "@/components/KindSelector";
import { MachineHint } from "@/components/MachineHint";
import {
  createSession,
  deleteSession,
  type SessionActionResult,
} from "@/lib/actions/sessions";
import type { PendingMachine } from "@/lib/data/compare";
import type { SessionKindValue } from "@/lib/kinds";
import {
  DENOMINATIONS,
  EMPTY_COUNTS,
  computeTotal,
  formatBaht,
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

// The in-progress count lives in localStorage so it survives iOS killing the
// backgrounded app (a phone call mid-count used to wipe every stack).
const DRAFT_KEY = "laund:count-draft:v1";

interface StoredDraft {
  bank: DenomCounts;
  drafts: DenomDrafts;
  kind: SessionKindValue;
  note: string;
}

function readDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<StoredDraft>;
    if (!d.bank || !d.drafts) return null;
    const bank = { ...EMPTY_COUNTS };
    const drafts = { ...EMPTY_DRAFTS };
    for (const key of Object.keys(bank) as DenomKey[]) {
      const b = Number(d.bank[key]);
      bank[key] = Number.isInteger(b) && b > 0 ? b : 0;
      drafts[key] = typeof d.drafts[key] === "string" ? d.drafts[key] : "";
    }
    const kind: SessionKindValue =
      d.kind === "SNOOKER" || d.kind === "LUMP_SUM" ? d.kind : "LAUNDRY";
    return { bank, drafts, kind, note: typeof d.note === "string" ? d.note : "" };
  } catch {
    return null;
  }
}

function writeDraft(d: StoredDraft | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private mode / storage blocked: the count just won't survive a restart.
  }
}

function isEmptyDraft(d: StoredDraft) {
  return (
    computeTotal(effectiveCounts(d.bank, d.drafts)) === 0 && d.note.trim() === ""
  );
}

/** What was just saved, so Undo can delete it and put the count back. */
interface SavedSnapshot {
  id: string;
  total: number;
  counts: DenomCounts;
  kind: SessionKindValue;
  note: string;
}

function snapshotFromForm(id: string, formData: FormData): SavedSnapshot {
  const counts = { ...EMPTY_COUNTS };
  for (const key of Object.keys(counts) as DenomKey[]) {
    counts[key] = parseDraft(String(formData.get(key) ?? ""));
  }
  const kind = String(formData.get("kind") ?? "LAUNDRY");
  return {
    id,
    total: computeTotal(counts),
    counts,
    kind: kind === "SNOOKER" || kind === "LUMP_SUM" ? kind : "LAUNDRY",
    note: String(formData.get("note") ?? ""),
  };
}

type SaveState =
  | (SessionActionResult & { snapshot?: SavedSnapshot })
  | undefined;

async function saveAction(
  prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const result = await createSession(prev, formData);
  return result.ok
    ? { ...result, snapshot: snapshotFromForm(result.id, formData) }
    : result;
}

export function NewSessionForm({
  machinePending,
}: {
  /** Streams in from the server; Home renders without waiting for it. */
  machinePending: Promise<PendingMachine | null>;
}) {
  const { lang, t } = useT();
  const [bank, setBank] = useState<DenomCounts>({ ...EMPTY_COUNTS });
  const [drafts, setDrafts] = useState<DenomDrafts>({ ...EMPTY_DRAFTS });
  const [kind, setKind] = useState<SessionKindValue>("LAUNDRY");
  const [note, setNote] = useState("");
  const [showMoreNotes, setShowMoreNotes] = useState(false);
  const [showMoreCoins, setShowMoreCoins] = useState(false);
  const [state, formAction, pending] = useActionState(saveAction, undefined);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  // The saved banner belongs to one save; Undo or a new edit dismisses it.
  const [savedShown, setSavedShown] = useState<SavedSnapshot | null>(null);
  const [undone, setUndone] = useState(false);
  const [undoing, startUndo] = useTransition();

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

  // Restore an unsaved count after the app was closed mid-count. Runs after
  // mount (localStorage doesn't exist during SSR).
  useEffect(() => {
    const d = readDraft();
    if (d && !isEmptyDraft(d)) {
      setBank(d.bank);
      setDrafts(d.drafts);
      setKind(d.kind);
      setNote(d.note);
      setRestored(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const d = { bank, drafts, kind, note };
    writeDraft(isEmptyDraft(d) ? null : d);
  }, [hydrated, bank, drafts, kind, note]);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setBank({ ...EMPTY_COUNTS });
      setDrafts({ ...EMPTY_DRAFTS });
      setKind("LAUNDRY");
      setNote("");
      setRestored(false);
      setUndone(false);
      setSavedShown(state.snapshot ?? null);
      writeDraft(null);
    }
  }, [state]);

  function clearDraft() {
    setBank({ ...EMPTY_COUNTS });
    setDrafts({ ...EMPTY_DRAFTS });
    setKind("LAUNDRY");
    setNote("");
    setRestored(false);
  }

  function undoSave(snap: SavedSnapshot) {
    startUndo(async () => {
      const res = await deleteSession(snap.id);
      if (!res.ok) return;
      setBank(snap.counts);
      setDrafts({ ...EMPTY_DRAFTS });
      setKind(snap.kind);
      setNote(snap.note);
      setSavedShown(null);
      setUndone(true);
    });
  }

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
    <form action={formAction} className="flex flex-1 flex-col gap-5 pb-4">
      <input type="hidden" name="date" value={date} />

      <RunningTotalHero
        label={t("todaysCollection")}
        dateLabel={todayLabel(lang)}
        total={total}
      >
        {kind === "LAUNDRY" && (
          <Suspense fallback={null}>
            <MachineHint pending={machinePending} total={total} today={date} />
          </Suspense>
        )}
      </RunningTotalHero>

      <KindSelector value={kind} onChange={setKind} />

      {restored && total > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-orange/10 px-4 py-2 text-sm font-medium text-brand-orange-dark">
          <span>↺ {t("draftRestored")}</span>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-brand-navy/70 transition active:scale-95"
          >
            {t("clearDraft")}
          </button>
        </div>
      )}
      {undone && (
        <p className="rounded-xl bg-brand-orange/10 px-4 py-2 text-sm font-medium text-brand-orange-dark">
          {t("undone")}
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

      {/* Pinned just above the tab bar so Save — and the total it shows —
          stay in reach while scrolling through the denominations. Messages
          about the save live here too, where the thumb just tapped. */}
      <div
        className="sticky z-[5] -mx-4 flex flex-col gap-2 bg-gradient-to-t from-background via-background/95 to-background/0 px-4 pt-4 pb-2"
        style={{ bottom: "var(--tabbar-h, 0px)" }}
      >
        {state && "error" in state && (
          <p className="rounded-xl border border-brand-orange/30 bg-brand-surface px-4 py-2 text-sm font-medium text-brand-orange-dark shadow-sm">
            {state.error}
          </p>
        )}
        {savedShown && total === 0 && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-green/25 bg-brand-surface px-4 py-2 text-sm font-medium text-brand-green-dark shadow-sm">
            <span>✓ {t("savedAmt", { amt: formatBaht(savedShown.total) })}</span>
            <span className="flex gap-1.5">
              <Link
                href={`/sessions/${savedShown.id}`}
                className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-brand-navy/70 transition active:scale-95"
              >
                {t("viewSession")}
              </Link>
              <button
                type="button"
                disabled={undoing}
                onClick={() => undoSave(savedShown)}
                className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-brand-navy/70 transition active:scale-95 disabled:opacity-60"
              >
                {undoing ? t("undoing") : t("undo")}
              </button>
            </span>
          </div>
        )}
        <button
          type="submit"
          disabled={pending || total === 0}
          className="w-full rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-4 text-base font-semibold text-white shadow-xl shadow-brand-purple/25 transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending
            ? t("saving")
            : t("saveSession", { total: total.toLocaleString() })}
        </button>
      </div>
    </form>
  );
}
