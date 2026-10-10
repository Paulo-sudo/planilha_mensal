// src/pages/Operacoes.tsx
import { useEffect } from "react";
import { supabase } from "../supabase_client";
import { useNavigate } from "react-router-dom";
import { HiOutlineCreditCard, HiOutlineRectangleGroup } from "react-icons/hi2";
import Header from "../components/header";
import CardManager from "../components/card_manager";
import EntityTag from "../components/entity_tag";
import { GROUPS } from "../utils/appearance";

export default function Operacoes() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Cadastros</h1>
          <p className="mt-1 text-sm text-slate-500">Grupos e cartões usados para organizar seus débitos.</p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <CardManager
            title="Cartões de crédito"
            subtitle="Mesmo ícone, cores diferentes para distinguir"
            HeaderIcon={HiOutlineCreditCard}
          />

          <section className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <HiOutlineRectangleGroup className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Grupos</h2>
                <p className="text-sm text-slate-500">Fixos — escolha um ao criar o débito</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {GROUPS.map((group) => (
                <li key={group.name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <EntityTag kind="group" name={group.name} iconOnly />
                  <span className="text-sm font-medium text-slate-800">{group.label}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
