import { cookies } from "next/headers";
import { dictionaries, type Dictionary, type Lang, LANG_COOKIE } from "@/lib/dictionaries";

export * from "@/lib/dictionaries";

/** Server-side language from the cookie (default: Bengali). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return value === "en" ? "en" : "bn";
}

export async function getDict(): Promise<{ lang: Lang; d: Dictionary }> {
  const lang = await getLang();
  return { lang, d: dictionaries[lang] };
}
