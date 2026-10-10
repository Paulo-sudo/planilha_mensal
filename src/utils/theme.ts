export type Theme = "light" | "dark";

const KEY = "theme";

// A classe inicial é aplicada por um script em index.html (evita piscar branco ao carregar)
export const currentTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // sem storage (aba anônima etc.): vale só para esta sessão
  }
};
