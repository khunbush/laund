"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import {
  importMachineCsv,
  clearMachineData,
  type ImportSummary,
} from "@/lib/data/machine";

export type ClearResult =
  | { ok: true; deleted: number }
  | { ok: false; error: string };

export async function clearMachineBranch(
  branch: number,
): Promise<ClearResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }
  if (branch !== 1 && branch !== 2) {
    return { ok: false, error: "Invalid branch" };
  }
  const deleted = await clearMachineData(branch);
  revalidatePath("/compare");
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
  const summary = await importMachineCsv(branch, csvText);
  if (summary.daysImported === 0) {
    return {
      ok: false,
      error: "No rows found — is this the right export file?",
    };
  }

  revalidatePath("/compare");
  return { ok: true, summary };
}
