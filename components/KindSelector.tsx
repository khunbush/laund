"use client";

import { SESSION_KINDS, type SessionKindValue } from "@/lib/kinds";
import { KIND_KEYS } from "@/lib/i18n";
import { useT } from "@/components/I18nProvider";

export function KindSelector({
  value,
  onChange,
}: {
  value: SessionKindValue;
  onChange: (kind: SessionKindValue) => void;
}) {
  const { t } = useT();
  return (
    <div className="flex gap-1.5 rounded-full bg-black/5 p-1">
      <input type="hidden" name="kind" value={value} />
      {SESSION_KINDS.map((k) => {
        const active = k.value === value;
        return (
          <button
            key={k.value}
            type="button"
            onClick={() => onChange(k.value)}
            className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-all active:scale-95 ${
              active
                ? "bg-brand-surface text-brand-navy shadow-sm"
                : "text-brand-muted"
            }`}
          >
            {k.emoji} {t(KIND_KEYS[k.value])}
          </button>
        );
      })}
    </div>
  );
}
