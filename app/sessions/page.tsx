import Link from "next/link";
import { listSessions } from "@/lib/data/sessions";
import { SessionsTable } from "@/components/SessionsTable";
import { BottomTabBar } from "@/components/BottomTabBar";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 20;
  const { sessions, total } = await listSessions({ page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
        <h1 className="mb-4 px-1 text-xl font-bold text-brand-navy">History</h1>
        <SessionsTable sessions={sessions} allowDelete />
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-1 text-sm text-brand-muted">
            <Link
              href={`/sessions?page=${Math.max(1, page - 1)}`}
              aria-disabled={page <= 1}
              className={`rounded-full px-3 py-1.5 transition active:scale-95 ${
                page <= 1
                  ? "pointer-events-none opacity-30"
                  : "font-medium text-brand-purple"
              }`}
            >
              ← Newer
            </Link>
            <span>
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/sessions?page=${Math.min(totalPages, page + 1)}`}
              aria-disabled={page >= totalPages}
              className={`rounded-full px-3 py-1.5 transition active:scale-95 ${
                page >= totalPages
                  ? "pointer-events-none opacity-30"
                  : "font-medium text-brand-purple"
              }`}
            >
              Older →
            </Link>
          </div>
        )}
      </main>
      <BottomTabBar />
    </div>
  );
}
