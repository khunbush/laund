"use server";

import { redirect } from "next/navigation";
import { createSessionCookie, verifyPasscode } from "@/lib/auth";

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
    return { error: "Incorrect passcode. Try again." };
  }

  await createSessionCookie();
  redirect("/");
}
