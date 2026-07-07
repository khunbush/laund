import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { KIND_LABELS } from "@/lib/kinds";

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessions = await prisma.collectionSession.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const header =
    "date,type,paid,note1000,note500,note100,note50,note20,coin10,coin5,coin2,coin1,total_baht,note,created_at";

  const rows = sessions.map((s) =>
    [
      s.date.toISOString().slice(0, 10),
      KIND_LABELS[s.kind],
      s.paid ? "yes" : "no",
      s.note1000,
      s.note500,
      s.note100,
      s.note50,
      s.note20,
      s.coin10,
      s.coin5,
      s.coin2,
      s.coin1,
      s.totalBaht,
      csvField(s.note ?? ""),
      s.createdAt.toISOString(),
    ].join(","),
  );

  const csv = [header, ...rows].join("\r\n") + "\r\n";
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laund-sessions-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
