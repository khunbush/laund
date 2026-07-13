export type DenomKey =
  | "note1000"
  | "note500"
  | "note100"
  | "note50"
  | "note20"
  | "coin10"
  | "coin5"
  | "coin2"
  | "coin1";

export type DenomCounts = Record<DenomKey, number>;

export interface Denomination {
  key: DenomKey;
  label: string;
  value: number;
  kind: "note" | "coin";
  common: boolean;
}

export const DENOMINATIONS: Denomination[] = [
  { key: "note1000", label: "1000", value: 1000, kind: "note", common: false },
  { key: "note500", label: "500", value: 500, kind: "note", common: false },
  { key: "note100", label: "100", value: 100, kind: "note", common: true },
  { key: "note50", label: "50", value: 50, kind: "note", common: true },
  { key: "note20", label: "20", value: 20, kind: "note", common: true },
  { key: "coin10", label: "10", value: 10, kind: "coin", common: true },
  { key: "coin5", label: "5", value: 5, kind: "coin", common: true },
  { key: "coin2", label: "2", value: 2, kind: "coin", common: false },
  { key: "coin1", label: "1", value: 1, kind: "coin", common: true },
];

export const DENOMINATION_MAP: Record<DenomKey, Denomination> =
  Object.fromEntries(DENOMINATIONS.map((d) => [d.key, d])) as Record<
    DenomKey,
    Denomination
  >;

export const EMPTY_COUNTS: DenomCounts = {
  note1000: 0,
  note500: 0,
  note100: 0,
  note50: 0,
  note20: 0,
  coin10: 0,
  coin5: 0,
  coin2: 0,
  coin1: 0,
};

export function computeTotal(counts: Partial<DenomCounts>): number {
  return DENOMINATIONS.reduce(
    (sum, d) => sum + (counts[d.key] ?? 0) * d.value,
    0,
  );
}

export function formatBaht(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}฿${Math.abs(rounded).toLocaleString("en-US")}`;
}
