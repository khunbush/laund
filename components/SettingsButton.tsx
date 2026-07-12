"use client";

import { useState, useTransition } from "react";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";
import { useT } from "@/components/I18nProvider";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "th", label: "ไทย" },
];

export function SettingsButton() {
  const { lang, t } = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(next: Lang) {
    if (next !== lang) {
      document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      // Full reload (not router.refresh): the client router cache keeps other
      // tabs' payloads for staleTimes.dynamic seconds, which would show the
      // old language when switching tabs. The SW is network-first for
      // navigations, so this always fetches fresh HTML.
      startTransition(() => window.location.reload());
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("settings")}
        className="rounded-full bg-black/5 px-3 py-1.5 text-base transition active:scale-95"
      >
        ⚙️
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-brand-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-brand-navy">
                ⚙️ {t("settings")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="rounded-full bg-black/5 px-2.5 py-1 text-sm font-bold text-brand-muted transition active:scale-95"
              >
                ✕
              </button>
            </div>
            <p className="mb-2 text-xs font-semibold text-brand-muted">
              {t("language")}
            </p>
            <div className="flex gap-1.5 rounded-full bg-black/5 p-1">
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={pending}
                  onClick={() => pick(o.value)}
                  className={`flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 ${
                    lang === o.value
                      ? "bg-brand-navy text-white shadow-sm"
                      : "text-brand-muted"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
