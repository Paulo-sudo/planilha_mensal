import { useState } from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { applyTheme, currentTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      title={next === "dark" ? "Modo escuro" : "Modo claro"}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      className="icon-btn"
    >
      {theme === "dark" ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
    </button>
  );
}
