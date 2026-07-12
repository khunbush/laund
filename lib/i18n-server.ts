import "server-only";
import { cookies } from "next/headers";
import { asLang, LANG_COOKIE, type Lang } from "@/lib/i18n";

/**
 * Current UI language from the lang cookie. Reading cookies opts the route
 * into dynamic rendering — fine here: most tab routes are already dynamic,
 * and the rest render fast (no extra DB work).
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return asLang(store.get(LANG_COOKIE)?.value);
}
