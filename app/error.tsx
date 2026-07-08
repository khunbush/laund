"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

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
        Something hiccuped
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        That didn&apos;t load. Your data is safe — try again.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition active:scale-[0.98]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-brand-navy transition active:scale-[0.98]"
        >
          Go home
        </button>
      </div>
    </main>
  );
}
