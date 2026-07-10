import { buildSessionsCsv } from "@/lib/csv";
import { secretsMatch } from "@/lib/auth";

/**
 * Monthly CSV backup, triggered by Vercel Cron (see vercel.json). Vercel
 * sends `Authorization: Bearer ${CRON_SECRET}` automatically when that env
 * var is set on the project. Inert (503) until RESEND_API_KEY/BACKUP_EMAIL
 * are configured.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new Response("CRON_SECRET not configured", { status: 503 });
  }
  const bearer = request.headers.get("authorization");
  if (!bearer || !secretsMatch(bearer, `Bearer ${cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BACKUP_EMAIL;
  if (!apiKey || !to) {
    return new Response("Backup email not configured", { status: 503 });
  }

  const csv = await buildSessionsCsv();
  const today = new Date().toISOString().slice(0, 10);
  const rowCount = csv.trim().split("\r\n").length - 1;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Laund Backup <onboarding@resend.dev>",
      to: [to],
      subject: `Laund backup — ${today} (${rowCount} sessions)`,
      text: `Attached is your monthly Laund backup: every recorded session as of ${today} (${rowCount} rows). Keep it somewhere safe.`,
      attachments: [
        {
          filename: `laund-sessions-${today}.csv`,
          content: Buffer.from(csv, "utf-8").toString("base64"),
        },
      ],
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("Backup email failed:", resp.status, detail);
    return new Response(`Email send failed (${resp.status})`, { status: 502 });
  }

  return Response.json({ ok: true, rows: rowCount });
}
