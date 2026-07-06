"use client";

import { formatBaht } from "@/lib/denominations";

export function DenominationInput({
  name,
  label,
  value,
  unit,
  count,
  onChange,
  muted = false,
}: {
  name: string;
  label: string;
  value: number;
  unit: "note" | "coin";
  count: number;
  onChange: (count: number) => void;
  muted?: boolean;
}) {
  const subtotal = count * value;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-black/5 bg-brand-surface px-4 py-3 ${
        muted ? "opacity-80" : ""
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          unit === "note"
            ? "bg-brand-purple/10 text-brand-purple-dark"
            : "bg-brand-orange/10 text-brand-orange-dark"
        }`}
      >
        ฿{label}
      </div>
      <div className="flex-1">
        <p className="text-xs text-brand-muted">
          {unit === "note" ? "Banknote" : "Coin"} · ฿{value}
        </p>
        <p className="text-sm font-semibold text-brand-navy">
          {formatBaht(subtotal)}
        </p>
      </div>
      <input
        type="number"
        inputMode="numeric"
        name={name}
        min={0}
        step={1}
        value={count === 0 ? "" : count}
        placeholder="0"
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          onChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
        }}
        onFocus={(e) => e.target.select()}
        className="w-20 rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-right text-lg font-semibold text-brand-navy outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30"
      />
    </div>
  );
}
