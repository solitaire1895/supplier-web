export type Theme = "dark" | "light";

const KEY = "nexusply_settings";

/* GET CURRENT THEME */
export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const data = localStorage.getItem(KEY);
  if (!data) return "dark";

  const settings = JSON.parse(data);
  return settings.theme || "dark";
}

/* APPLY THEME */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/* INIT THEME */
export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}