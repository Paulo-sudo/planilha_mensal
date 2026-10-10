import { NavLink } from "react-router-dom";
import { HiOutlineWallet } from "react-icons/hi2";

const links = [
  { to: "/faturamento", label: "Faturamento" },
  { to: "/operacoes", label: "Cadastros" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <HiOutlineWallet className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Planilha Mensal</span>
        </div>
        <nav className="flex gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `btn btn-sm ${isActive ? "bg-slate-100 text-slate-900" : "btn-ghost"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
