export type Lang = "english" | "bengali" | "hindi";

const LANG_KEY: Record<Lang, "en" | "bn" | "hi"> = {
  english: "en",
  bengali: "bn",
  hindi: "hi",
};

export function localize(
  field: unknown,
  lang: Lang | null | undefined = "english",
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  const key = LANG_KEY[lang ?? "english"];
  const obj = field as Record<string, string | undefined>;
  return obj[key] || obj.en || Object.values(obj).find((v) => !!v) || "";
}

export function examLabel(code: string | null | undefined): string {
  switch (code) {
    case "ssc_cgl":
      return "SSC CGL";
    case "ssc_chsl":
      return "SSC CHSL";
    case "wbcs":
      return "WBCS";
    case "wbpsc":
      return "WBPSC";
    case "railway":
      return "Railway";
    case "banking":
      return "Banking";
    case "police":
      return "Police";
    case "other":
      return "Other";
    default:
      return "—";
  }
}

export function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}
