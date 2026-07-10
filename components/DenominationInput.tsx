"use client";

import { formatBaht } from "@/lib/denominations";

export function parseDraft(draft: string): number {
  const parsed = Number.parseInt(draft, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Stack-counting input: the box holds the stack just counted, the + button
 * banks it and empties the box for the next stack, and the chip shows the
 * banked running count (tap the chip to pull it back into the box to fix a
 * mistake). What gets submitted is always bank + whatever is in the box, so
 * an un-banked final stack still counts on save.
 */
export function DenominationInput({
  name,
  label,
  value,
  unit,
  bank,
  draft,
  onDraftChange,
  onCommit,
  onRecall,
  muted = false,
}: {
  name: string;
  label: string;
  value: number;
  unit: "note" | "coin";
  bank: number;
  draft: string;
  onDraftChange: (draft: string) => void;
  onCommit: () => void;
  onRecall: () => void;
  muted?: boolean;
}) {
  const effective = bank + parseDraft(draft);
  const subtotal = effective * value;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border border-black/5 bg-brand-surface px-3.5 py-3 ${
        muted ? "opacity-80" : ""
      }`}
    >
      <input type="hidden" name={name} value={effective} />
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          unit === "note"
            ? "bg-brand-purple/10 text-brand-purple-dark"
            : "bg-brand-orange/10 text-brand-orange-dark"
        }`}
      >
        ฿{label}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-brand-muted">
          {unit === "note" ? "Banknote" : "Coin"} · ฿{value}
        </p>
        <div className="flex items-center gap-2">
          <p className="font-serif text-sm text-brand-navy">
            {formatBaht(subtotal)}
          </p>
          {bank > 0 && (
            <button
              type="button"
              onClick={onRecall}
              className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[11px] font-semibold text-brand-purple-dark transition active:scale-95"
              aria-label={`${bank} counted so far, tap to edit`}
            >
              {bank} ✎
            </button>
          )}
        </div>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={draft}
        placeholder="0"
        onChange={(e) => onDraftChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="w-16 rounded-xl border border-black/10 bg-black/[0.03] px-2.5 py-2 text-right text-lg font-semibold text-brand-navy outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30"
      />
      <button
        type="button"
        onClick={onCommit}
        disabled={parseDraft(draft) === 0}
        aria-label={`Add ${label} baht stack to count`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-orange text-xl font-bold text-white shadow-md shadow-brand-purple/20 transition-all active:scale-90 disabled:opacity-30 disabled:shadow-none"
      >
        +
      </button>
    </div>
  );
}
