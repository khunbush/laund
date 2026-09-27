import { formatBaht } from "@/lib/denominations";
import { DENOM_KIND_COLORS } from "@/lib/chartColors";
import { t, type Lang } from "@/lib/i18n";

export interface DenomShare {
  key: string;
  label: string;
  kind: "note" | "coin";
  value: number;
}

/**
 * Share of all counted money carried by each denomination, as labeled bars in
 * note→coin order. Replaces a donut: with eight slices, several under 5%, a
 * ranked bar per row is far easier to read and needs no rainbow palette.
 */
export function DenomMix({ data, lang }: { data: DenomShare[]; lang: Lang }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <p className="rounded-2xl bg-brand-surface p-6 text-center text-sm text-brand-muted">
        {t(lang, "donutEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-brand-surface p-4">
      {data.map((d) => {
        const pct = (d.value / total) * 100;
        return (
          <div key={d.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-brand-navy">
                ฿{d.label}{" "}
                <span className="font-normal text-brand-muted">
                  {d.kind === "note" ? t(lang, "banknote") : t(lang, "coin")}
                </span>
              </span>
              <span className="text-brand-muted">
                {formatBaht(d.value)}
                <span className="ml-2 inline-block w-9 text-right font-semibold text-brand-navy">
                  {pct < 1 ? "<1" : pct.toFixed(0)}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(pct, 1.5)}%`,
                  backgroundColor: DENOM_KIND_COLORS[d.kind],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
