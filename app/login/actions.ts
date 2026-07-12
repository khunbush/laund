"use server";

import { redirect } from "next/navigation";
import { createSessionCookie, verifyPasscode } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const passcode = String(formData.get("passcode") ?? "");

  if (!passcode || !verifyPasscode(passcode)) {
    // Slow down brute-force guessing; the single real user never notices.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { error: t(await getLang(), "wrongPasscode") };
  }

  await createSessionCookie();
  redirect("/");
}
