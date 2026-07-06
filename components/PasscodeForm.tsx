"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function PasscodeForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="passcode"
          className="mb-2 block text-sm font-medium text-brand-muted"
        >
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          className="w-full rounded-2xl border border-black/5 bg-black/5 px-4 py-3.5 text-lg tracking-widest text-brand-navy outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30"
        />
      </div>
      {state?.error && (
        <p className="text-sm font-medium text-brand-orange-dark">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-orange px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-purple/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
