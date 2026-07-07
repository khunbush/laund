import { isAuthenticated } from "@/lib/auth";
import { buildSessionsCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const csv = await buildSessionsCsv();
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laund-sessions-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
