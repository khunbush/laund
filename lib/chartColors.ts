import type { DenomKey } from "@/lib/denominations";

// Fixed identity -> color assignment (never rank-based). coin2 is the rarest
// denomination and always folds into "Other" to keep the categorical set at 8.
export const DENOM_COLORS: Partial<Record<DenomKey, string>> = {
  note1000: "#2a78d6", // blue
  note500: "#1baf7a", // aqua
  note100: "#eda100", // yellow
  note50: "#008300", // green
  note20: "#4a3aa7", // violet
  coin10: "#e34948", // red
  coin5: "#e87ba4", // magenta
  coin1: "#eb6834", // orange
};

export const OTHER_COLOR = "#898781"; // muted gray, matches chrome/ink role

export const SEQUENTIAL_BAR_COLOR = "#7b61ff"; // brand purple, single-series bars
export const AXIS_MUTED = "#898781";
export const GRIDLINE = "#e1e0d9";

// Branch identity colors for machine-performance charts. Fixed per entity,
// never rank-based. Branch 2 uses the dark orange step so bars keep >= 3:1
// contrast on the white card surface (validated pair).
export const BRANCH_COLORS: Record<1 | 2, string> = {
  1: "#7b61ff",
  2: "#e65220",
};
