import { isAuthenticated, secretsMatch } from "@/lib/auth";
import { importMachineCsv } from "@/lib/data/machine";
import { revalidatePath } from "next/cache";

// A day's report is a few hundred KB at most; anything bigger is a mistake.
const MAX_BODY_BYTES = 5 * 1024 * 1024;

/**
 * Ingest a washclub machine-report CSV.
 *
 *   POST /api/machine-import?branch=1   (body = raw CSV text)
 *
 * Auth: either the passcode cookie (a logged-in browser) OR a bearer token
 * matching MACHINE_IMPORT_TOKEN (for your export agents). The format is
 * auto-detected from the CSV header, so branch only controls storage labeling.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const branch = Number(url.searchParams.get("branch"));
  if (branch !== 1 && branch !== 2) {
    return Response.json(
      { error: "branch query param must be 1 or 2" },
      { status: 400 },
    );
  }

  const token = process.env.MACHINE_IMPORT_TOKEN;
  const bearer = request.headers.get("authorization");
  const tokenOk =
    !!token && !!bearer && secretsMatch(bearer, `Bearer ${token}`);
  const cookieOk = await isAuthenticated();
  if (!tokenOk && !cookieOk) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Body too large" }, { status: 413 });
  }

  const csvText = await request.text();
  if (csvText.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Body too large" }, { status: 413 });
  }
  if (!csvText.trim()) {
    return Response.json({ error: "Empty body" }, { status: 400 });
  }

  const summary = await importMachineCsv(branch, csvText);
  revalidatePath("/compare");
  revalidatePath("/branches");

  return Response.json({ ok: true, ...summary });
}
