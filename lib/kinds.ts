export type SessionKindValue = "LAUNDRY" | "SNOOKER" | "LUMP_SUM";

export const SESSION_KINDS: {
  value: SessionKindValue;
  label: string;
  emoji: string;
}[] = [
  { value: "LAUNDRY", label: "Laundry", emoji: "🧺" },
  { value: "SNOOKER", label: "Snooker", emoji: "🎱" },
  { value: "LUMP_SUM", label: "Lump Sum", emoji: "💰" },
];

export const KIND_LABELS: Record<SessionKindValue, string> = {
  LAUNDRY: "Laundry",
  SNOOKER: "Snooker",
  LUMP_SUM: "Lump Sum",
};

export const KIND_EMOJI: Record<SessionKindValue, string> = {
  LAUNDRY: "🧺",
  SNOOKER: "🎱",
  LUMP_SUM: "💰",
};
