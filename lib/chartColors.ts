// Denomination-mix share bars: notes vs coins, echoing the Home badges' split.
// Coins use ochre, not the theme clay (clay vs terracotta fails the
// normal-vision separation floor). Validated pair on the #fbf7ee surface
// (CVD ΔE 12.5, normal 16.1); ochre sits under 3:1 contrast, which is why
// every bar row carries a text label and percentage.
export const DENOM_KIND_COLORS = {
  note: "#b1471e",
  coin: "#b88a2c",
} as const;

export const SEQUENTIAL_BAR_COLOR = "#b1471e"; // terracotta, single-series bars
export const AXIS_MUTED = "#8a7d68";
export const GRIDLINE = "#ddd0b8";

// Branch identity colors for machine-performance charts. Fixed per entity,
// never rank-based. Terracotta / forest pair; the green sits slightly above
// the theme's status green so it clears the categorical chroma floor and
// keeps protan ΔE > 12 against terracotta (validated pair).
export const BRANCH_COLORS: Record<1 | 2, string> = {
  1: "#b1471e",
  2: "#2f7040",
};
