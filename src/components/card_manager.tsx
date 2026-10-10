import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { supabase } from "../supabase_client";
import AppearancePicker from "./appearance_picker";
import EntityTag from "./entity_tag";
import { CARD_ICONS, nextFreeColor, resolveCardIcon, resolveColor } from "../utils/appearance";

type Entity = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  due_day: number | null;
};

const table = "credit_cards";
const kind = "card";
const entityLabel = "cartão";

interface Props {
  title: string;
  subtitle: string;
  HeaderIcon: IconType;
}

export default function CardManager({ title, subtitle, HeaderIcon }: Props) {
  const [items, setItems] = useState<Entity[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CARD_ICONS[0].key);
  const [color, setColor] = useState("indigo");
  const [dueDay, setDueDay] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const resetForm = (list: Entity[]) => {
    setEditingId(null);
    setName("");
    setIcon(CARD_ICONS[0].key);
    setDueDay("");
    setColor(nextFreeColor(list.map((i) => i.color)));
  };

  const fetchItems = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user ? user.id : null)
      .order("name");

    if (error) {
      console.error(`Erro ao buscar ${table}:`, error);
      return [];
    }
    setItems(data ?? []);
    return data ?? [];
  };

  useEffect(() => {
    fetchItems().then(resetForm);
  }, []);

  const startEdit = (item: Entity) => {
    setFeedback(null);
    setEditingId(item.id);
    setName(item.name);
    setIcon(resolveCardIcon(item.icon).key);
    setColor(resolveColor(item.color, item.name).key);
    setDueDay(item.due_day ? String(item.due_day) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const due_day = dueDay ? parseInt(dueDay, 10) : null;
    const user = (await supabase.auth.getUser()).data.user;

    let error;
    if (editingId) {
      // nome não muda: os débitos referenciam o cartão pelo nome
      ({ error } = await supabase.from(table).update({ icon, color, due_day }).eq("id", editingId));

      // Vencimento mudou: replica nos débitos já lançados nesse cartão
      const previous = items.find((i) => i.id === editingId);
      if (!error && due_day && previous && previous.due_day !== due_day) {
        for (const debitTable of ["debits", "future_debits"]) {
          const { error: syncError } = await supabase
            .from(debitTable)
            .update({ due_date: String(due_day) })
            .eq("credit_card", previous.name)
            .eq("user_id", user ? user.id : null);
          if (syncError) console.error(`Erro ao atualizar vencimento em ${debitTable}:`, syncError);
        }
      }
    } else {
      ({ error } = await supabase.from(table).insert({
        name: name.toUpperCase(),
        icon,
        color,
        due_day,
        user_id: user ? user.id : null,
      }));
    }

    if (error) {
      console.error(error);
      setFeedback({ type: "error", text: `Erro ao salvar ${entityLabel}: ${error.message}` });
    } else {
      setFeedback({ type: "ok", text: editingId ? "Alterações salvas." : `${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} cadastrado.` });
      resetForm(await fetchItems());
    }
    setSaving(false);
  };

  return (
    <section className="card flex flex-col p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <HeaderIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!editingId}
            required
            className="input disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        <div>
          <label className="label">Dia do vencimento</label>
          <input
            type="number"
            min="1"
            max="31"
            placeholder="1 a 31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="input w-32"
          />
          <p className="mt-1 text-xs text-slate-500">Aplicado a todo débito lançado ou vinculado a este cartão.</p>
        </div>

        <AppearancePicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />

        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Prévia</span>
          <EntityTag kind={kind} name={name.toUpperCase() || entityLabel.toUpperCase()} icon={icon} color={color} />
        </div>

        {feedback && (
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              feedback.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.text}
          </p>
        )}

        <div className="flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={() => resetForm(items)} className="btn btn-secondary">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : `Cadastrar ${entityLabel}`}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cadastrados ({items.length})
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum {entityLabel} cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 py-2 ${editingId === item.id ? "opacity-50" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EntityTag kind={kind} name={item.name} icon={item.icon} color={item.color} iconOnly />
                  <span className="truncate text-sm font-medium text-slate-800">{item.name}</span>
                  {item.due_day && <span className="shrink-0 text-xs text-slate-500">vence dia {item.due_day}</span>}
                </div>
                <button type="button" title="Editar" onClick={() => startEdit(item)} className="icon-btn">
                  <HiOutlinePencilSquare className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
