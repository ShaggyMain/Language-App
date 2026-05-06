import type { Language } from "./types";

export const LANGUAGES: { code: Language; name: string; flag: string; accent: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧", accent: "#3b82f6" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", accent: "#f59e0b" },
  { code: "es", name: "Español", flag: "🇪🇸", accent: "#ef4444" },
];

export function languageMeta(code: Language) {
  return LANGUAGES.find((l) => l.code === code)!;
}
