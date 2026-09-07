"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { computeTotal, EMPTY_COUNTS, type DenomCounts } from "@/lib/denominations";

// Upper bound keeps totalBaht far below Postgres Int range even at ฿1000;
// a count past this is a typo, rejected with the friendly validation error.
const count = z.number().int().nonnegative().max(100_000);

const countsSchema = z.object({
  note1000: count,
  note500: count,
  note100: count,
  note50: count,
  note20: count,
  coin10: count,
  coin5: count,
  coin2: count,
  coin1: count,
});

const sessionInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  kind: z.enum(["LAUNDRY", "SNOOKER", "LUMP_SUM"]),
  counts: countsSchema,
  note: z.string().trim().max(500),
});

export type SessionActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function parseCountsFromFormData(formData: FormData): DenomCounts {
  const counts = { ...EMPTY_COUNTS };
  for (const key of Object.keys(counts) as (keyof DenomCounts)[]) {
    const raw = formData.get(key);
    const parsed = Number.parseInt(String(raw ?? "0"), 10);
    counts[key] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return counts;
}

function toDateOnlyUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function createSession(
  _prevState: SessionActionResult | undefined,
  formData: FormData,
): Promise<SessionActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = sessionInputSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    kind: String(formData.get("kind") ?? "LAUNDRY"),
    counts: parseCountsFromFormData(formData),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid session data" };
  }

  const { date, kind, counts, note } = parsed.data;
  const totalBaht = computeTotal(counts);

  const session = await prisma.collectionSession.create({
    data: {
      date: toDateOnlyUtc(date),
      kind,
      ...counts,
      totalBaht,
      note: note.length > 0 ? note : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/all-time");

  return { ok: true, id: session.id };
}

export async function setPaid(
  id: string,
  paid: boolean,
): Promise<SessionActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await prisma.collectionSession.update({ where: { id }, data: { paid } });
  } catch {
    return { ok: false, error: "Session not found" };
  }

  revalidatePath("/sessions");
  revalidatePath(`/sessions/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/all-time");

  return { ok: true, id };
}

export async function deleteSession(id: string): Promise<SessionActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await prisma.collectionSession.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Session not found" };
  }

  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/all-time");

  return { ok: true, id };
}

export async function updateSession(
  id: string,
  _prevState: SessionActionResult | undefined,
  formData: FormData,
): Promise<SessionActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = sessionInputSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    kind: String(formData.get("kind") ?? "LAUNDRY"),
    counts: parseCountsFromFormData(formData),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid session data" };
  }

  const { date, kind, counts, note } = parsed.data;
  const totalBaht = computeTotal(counts);

  try {
    await prisma.collectionSession.update({
      where: { id },
      data: {
        date: toDateOnlyUtc(date),
        kind,
        ...counts,
        totalBaht,
        note: note.length > 0 ? note : null,
      },
    });
  } catch {
    return { ok: false, error: "Session not found" };
  }

  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/all-time");

  return { ok: true, id };
}
