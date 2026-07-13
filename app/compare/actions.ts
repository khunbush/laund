"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import {
  importMachineCsv,
  clearMachineData,
  BranchMismatchError,
  type ImportSummary,
} from "@/lib/data/machine";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { BRANCH_NAMES } from "@/lib/branchNames";

export type ClearResult =
  | { ok: true; deleted: number }
  | { ok: false; error: string };

export async function clearMachineBranch(
  branch: number,
  date?: string,
): Promise<ClearResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }
  if (branch !== 1 && branch !== 2) {
    return { ok: false, error: "Invalid branch" };
  }
  if (
    date !== undefined &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T00:00:00.000Z`)))
  ) {
    return { ok: false, error: "Invalid date" };
  }
  const deleted = await clearMachineData(branch, date);
  revalidatePath("/compare");
  revalidatePath("/branches");
  return { ok: true, deleted };
}

export type UploadState =
  | { ok: true; summary: ImportSummary }
  | { ok: false; error: string }
  | null;

export async function uploadMachineCsv(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const branch = Number(formData.get("branch"));
  if (branch !== 1 && branch !== 2) {
    return { ok: false, error: "Pick a branch" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file" };
  }

  const csvText = await file.text();
  let summary: ImportSummary;
  try {
    summary = await importMachineCsv(branch, csvText);
  } catch (err) {
    if (err instanceof BranchMismatchError) {
      return {
        ok: false,
        error: t(await getLang(), "wrongBranchCsv", {
          name: BRANCH_NAMES[err.detectedBranch],
        }),
      };
    }
    throw err;
  }
  if (summary.daysImported === 0) {
    return {
      ok: false,
      error: "No rows found — is this the right export file?",
    };
  }

  revalidatePath("/compare");
  revalidatePath("/branches");
  return { ok: true, summary };
}
