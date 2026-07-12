"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { asLang, LANG_COOKIE, t } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const lang = asLang(
    typeof document === "undefined"
      ? undefined
      : document.cookie
          .split("; ")
          .find((c) => c.startsWith(`${LANG_COOKIE}=`))
          ?.split("=")[1],
  );

  useEffect(() => {
    // Surfaced in Vercel logs for diagnosis.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/10 text-2xl">
        ⚠️
      </div>
      <h1 className="mt-4 text-xl font-bold text-brand-navy">
        {t(lang, "errTitle")}
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        {t(lang, "errBody")}
      </p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition active:scale-[0.98]"
        >
          {t(lang, "tryAgain")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-brand-navy transition active:scale-[0.98]"
        >
          {t(lang, "goHome")}
        </button>
      </div>
    </main>
  );
}
