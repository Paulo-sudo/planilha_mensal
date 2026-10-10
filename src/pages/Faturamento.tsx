import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase_client";
import { ensureMonthExists } from "../utils/ensureMonthExists";
import DebitForm from "../components/forms/debit_form";
import Background from "../components/background";
import Header from "../components/header";
import Spinner from "../components/spinner";
import EntityTag from "../components/entity_tag";
import { findGroup, GROUPS } from "../utils/appearance";
import { brl, monthLabel } from "../utils/format";
import {
  HiChevronDown,
  HiChevronRight,
  HiOutlineArrowUturnLeft,
  HiChevronUp,
  HiChevronUpDown,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlineInboxStack,
  HiOutlinePlus,
  HiOutlineTag,
  HiOutlineTrash,
  HiXMark,
} from "react-icons/hi2";


type Debit = {
  id: string;
  description: string;
  value: number;
  installments: number | null;
  due_date: string | null;
  group: string | null;
  credit_card: string | null;
  current: number;
  recurring: boolean;
  paid: boolean;
  month_id: string;
};

type CardBill = {
  card: string;
  items: Debit[];
  total: number;
  paidCount: number;
};

type Row = { type: "debit"; debit: Debit } | { type: "card"; bill: CardBill };

type Cards = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  due_day: number | null;
};

export default function Faturamento() {
  const [loading, setLoading] = useState(true);
  const [debits, setDebits] = useState<Debit[]>([]);
  const [idMonth, setIdMonth] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    {}
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [anticipatingId, setAnticipatingId] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [totalPagos, setTotalPagos] = useState<number>(0);
  const [totalNaoPagos, setTotalNaoPagos] = useState<number>(0);

  const [anticipateCount, setAnticipateCount] = useState<number>(1);
  const [futureDebits, setFutureDebits] = useState<Debit[]>([]);

  const [futureValue, setFutureValue] = useState<number>(0);
  const [showFuture, setShowFuture] = useState(false);
  const [selectGroup, setSelectGroup] = useState<string | null>(null);
  const [selectCard, setSelectCard] = useState<string | null>(null);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>("created_at-D");
  const [filter, setFilter]=useState<string | null>(null);
  const [cards, setCards] = useState<Cards[]>([]);
  const [addDebit, setAddDebit] = useState<string | null>(null);
  const [originalDebits, setOriginalDebits] = useState<Debit[]>([]);
  const [selectGrouping, setSelectGrouping] = useState<{
    field: "group" | "credit_card";
    value: string;
  } | null>(null);
  const [activeGrouping, setActiveGrouping] = useState<{
    field: "group" | "credit_card";
    value: string;
  } | null>(null);
  const delay = (ms:any) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const handleGroupToggle = (groupName: string) => {
    if (!originalDebits.length) setOriginalDebits(debits);

    if (
      activeGrouping?.field === "group" &&
      activeGrouping.value === groupName
    ) {
      // Desativa
      //setDebits(originalDebits);
      setSelectGrouping(null);
      setActiveGrouping(null);
    } else {
      // Agrupa grupo

      const filtered = debits.filter((d) => d.group === groupName && !d.credit_card);
      const others = debits.filter((d) => !(d.group === groupName && !d.credit_card));
      if (!filtered.length) return;

      const total = filtered.reduce((acc, d) => acc + (d.value || 0), 0);
      const grouped: Debit = {
        id: "grouped-" + groupName,
        description: `byduuidTOTAL => ${groupName}`,
        value: total,
        paid: false,
        installments: null,
        credit_card: null,
        current: 0,
        recurring: false,
        due_date: filtered[0].due_date,
        group: filtered[0].group,
        month_id: filtered[0]?.month_id,
      };

      setDebits([grouped, ...others]);
      setActiveGrouping({ field: "group", value: groupName });
    }
  };

    const handleSortGroup = async (groupName: string) => {
      setLoading(true)
    console.log("GROUP", selectGrouping, activeGrouping, filter);
    await delay(500);
    setFilter(`group_${groupName}`)
    if (
      (selectGrouping?.field == "group" &&
      selectGrouping.value === groupName) || filter===`group_${groupName}`
    ) {
      const base = originalDebits.length > 0 ? originalDebits : debits;
      const ordenado = [...base].sort((a, b) => {
        if (a.group === groupName && b.group !== groupName) return -1;
        if (a.group !== groupName && b.group === groupName) return 1;
        return 0;
      });

      setDebits(ordenado);
      setSelectGrouping({ field: "group", value: groupName });
      handleGroupToggle(groupName);
    } else {
      const base = originalDebits.length > 0 ? originalDebits : debits;
      const ordenado = [...base].sort((a, b) => {
        if (a.group === groupName && b.group !== groupName) return -1;
        if (a.group !== groupName && b.group === groupName) return 1;
        return 0;
      });

      setDebits(ordenado);
      setSelectGrouping({ field: "group", value: groupName });
    }
    setLoading(false)
  };

  const navigate = useNavigate();

  const deletedGroupName = async (debitId: string) => {
    const { error } = await supabase
      .from("debits")
      .update({ group: null }) // atualiza o campo "group"
      .eq("id", debitId); // onde o ID do débito for igual ao selecionado

    if (error) {
      console.error("Erro ao atualizar grupo do débito:", error);
    } else {
      console.log("Grupo atualizado com sucesso");
      await fetchDebits(); // se quiser recarregar a lista após atualizar
    }
  };

  const setSelectedGroupName = async (name: string) => {
    const debitId = selectGroup;
    setSelectGroup(null);
    console.log(name);

    const { error } = await supabase
      .from("debits")
      .update({ group: name }) // atualiza o campo "group"
      .eq("id", debitId); // onde o ID do débito for igual ao selecionado

    if (error) {
      console.error("Erro ao atualizar grupo do débito:", error);
    } else {
      console.log("Grupo atualizado com sucesso");
      await fetchDebits(); // se quiser recarregar a lista após atualizar
    }
  };

  const deletedCardName = async (debitId: string) => {
    const { error } = await supabase
      .from("debits")
      .update({ credit_card: null }) // atualiza o campo "group"
      .eq("id", debitId); // onde o ID do débito for igual ao selecionado

    if (error) {
      console.error("Erro ao atualizar grupo do débito:", error);
    } else {
      console.log("Grupo atualizado com sucesso");
      await fetchDebits(); // se quiser recarregar a lista após atualizar
    }
  };

  const setSelectedCardName = async (name: string) => {
    const debitId = selectCard;
    setSelectCard(null);
    console.log(name);

    // Ao entrar no cartão, o débito passa a vencer no dia cadastrado no cartão
    const dueDay = cards.find((c) => c.name === name)?.due_day;
    const { error } = await supabase
      .from("debits")
      .update(dueDay ? { credit_card: name, due_date: String(dueDay) } : { credit_card: name })
      .eq("id", debitId); // onde o ID do débito for igual ao selecionado

    if (error) {
      console.error("Erro ao atualizar cartão do débito:", error);
    } else {
      console.log("Cartão atualizado com sucesso");
      await fetchDebits(); // se quiser recarregar a lista após atualizar
    }
  };

  const handleSort = async (filter: string) => {
    setLoading(true)
    await delay(200);
    console.log(filter, sort, loading);
    const a = sort?.split("-");
    if (a && a[0] == filter) {
      let b;
      a[1] == "D" ? (b = "A") : (b = "D");
      setSort(`${filter}-${b}`);
    } else if (a && a[0] != filter) {
      setSort(`${filter}-D`);
    } else {
      setSort(`${filter}-D`);
    }
  };



  useEffect(() => {
    if (!debits.length || !sort) return;
    setLoading(true)
    const [field, direction] = sort.split("-");
    const sorted = [...debits].sort((a: any, b: any) => {
      const aValue = field === "due_date" ? Number(a[field]) : a[field];
      const bValue = field === "due_date" ? Number(b[field]) : b[field];

      if (aValue < bValue) return direction === "D" ? 1 : -1;
      if (aValue > bValue) return direction === "D" ? -1 : 1;
      return 0;
    });

    // Recalcular os totais após ordenar
    const total = sorted.reduce((acc, d) => acc + (d.value || 0), 0);
    const totalPagos = sorted
      .filter((d) => d.paid)
      .reduce((acc, d) => acc + (d.value || 0), 0);
    const totalNaoPagos = total - totalPagos;

    setDebits(sorted);
    setTotal(total);
    setTotalPagos(totalPagos);
    setTotalNaoPagos(totalNaoPagos);
    setLoading(false)
  }, [sort]);

  const handleTogglePaid = async (debitId: string, paid: boolean) => {
    const { error } = await supabase
      .from("debits")
      .update({ paid })
      .eq("id", debitId);

    if (error) {
      console.error("Erro ao atualizar status de pagamento:", error);
    } else {
      setDebits((prev) =>
        prev.map((d) => (d.id === debitId ? { ...d, paid } : d))
      );
      await fetchDebits();
    }
  };

  // Paga (ou desmarca) todas as compras da fatura numa única atualização
  const handlePayCard = async (items: Debit[], paid: boolean) => {
    const ids = items.map((d) => d.id);
    const { error } = await supabase.from("debits").update({ paid }).in("id", ids);

    if (error) {
      console.error("Erro ao pagar fatura:", error);
    } else {
      setDebits((prev) => prev.map((d) => (ids.includes(d.id) ? { ...d, paid } : d)));
      await fetchDebits();
    }
  };

  const handleValueChange = async (id: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [id]: value }));
    await fetchDebits();
  };
  const handleAnticipateInstallments = async (debit: any) => {
    if (!debit || !anticipateCount) return;

    const entries = Array.from({ length: anticipateCount }, (_, index) => ({
      ...debit,
      current: debit.current + index + 1,
      created_at: new Date().toISOString(),
    }));

    const sanitized = entries.map(({ id, ...rest }) => rest);

    const { error } = await supabase.from("debits").insert(sanitized);
    if (error) {
      console.error("Erro ao antecipar parcelas:", error);
    } else {
      // Atualiza a lista localmente se quiser
      setDebits((prev) => [...prev, ...sanitized]);
      setAnticipatingId(null);
      setAnticipateCount(1);
      await fetchDebits();
    }
  };

  const handleFutureDebits = async () => {
    const { data: futureDebitsFromSupabase, error } = await supabase
      .from('future_debits')
      .select('*')
      .eq('month_id', idMonth); // mês atual
  
    if (error) {
      console.error("Erro ao buscar future_debits", error);
    }
  
    const data = debits;
    let FutureValue = 0;
    futureDebitsFromSupabase?.forEach((d) => {
      FutureValue += d.value || 0;
    });
    const grouped: Record<string, any[]> = {};
  
    data.forEach((debit) => {
      const key = `${debit.description}-${debit.value}-${debit.installments}`;
      grouped[key] = grouped[key] || [];
      grouped[key].push(debit);
    });
  
    const futureFromRecorrentesOuParcelas = Object.values(grouped).flatMap((debits) => {
      const [sample] = debits;
      if (!sample.installments && !sample.recurring) return [];
  
      const highestCurrent = Math.max(...debits.map((d) => d.current || 0));
  
      if (
        sample.recurring ||
        (sample.installments && highestCurrent < sample.installments)
      ) {
        FutureValue += sample.value;
        return [
          {
            ...sample,
            current: sample.installments ? highestCurrent + 1 : null,
            month_id: "proximo", // ou o id real do próximo mês
            preview: true,
          },
        ];
      }
  
      return [];
    });
  
    const futureFromSupabase = futureDebitsFromSupabase?.map((debit) => ({
      ...debit,
      preview: true,
      month_id: "proximo",
    })) ?? [];
  
    // Junta os dois
    const allFutureDebits = [...futureFromRecorrentesOuParcelas, ...futureFromSupabase];
  
    setFutureValue(FutureValue);
    setFutureDebits(allFutureDebits);
  };
  

  const fetchDebits = async () => {
    const a: any = sort?.split("-");
    const { data, error } = await supabase
      .from("debits")
      .select("*")
      .eq("month_id", idMonth)
      .order(a[0], { ascending: a[1] == "D" ? false : true });

    if (!error && data) {
      // Mantém a posição atual de cada débito (o banco não garante ordem entre empates,
      // então pagar/editar fazia a linha "pular"). Débitos novos entram no topo.
      setDebits((prev) => {
        const position = new Map(prev.map((d, i) => [d.id, i]));
        const known = data
          .filter((d) => position.has(d.id))
          .sort((a, b) => position.get(a.id)! - position.get(b.id)!);
        const added = data.filter((d) => !position.has(d.id));
        return [...added, ...known];
      });

      // Totais do mês atual
      const total = data.reduce((acc, d) => acc + (d.value || 0), 0);
      const totalPagos = data
        .filter((d) => d.paid)
        .reduce((acc, d) => acc + (d.value || 0), 0);
      const totalNaoPagos = total - totalPagos;

      setTotal(total);
      setTotalPagos(totalPagos);
      setTotalNaoPagos(totalNaoPagos);
    } else {
      console.error("Erro ao buscar débitos:", error);
      setDebits([]);
    }
    
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("debits").delete().eq("id", id);
    if (!error) {
      setDebits((prev) => prev.filter((d) => d.id !== id));
      await fetchDebits();
    } else {
      alert("Erro ao excluir dívida");
    }
  };

  const handleSaveValue = async (id: string) => {
    const newValue = parseFloat(editingValues[id]);

    if (isNaN(newValue)) return;

    const { error } = await supabase
      .from("debits")
      .update({ value: newValue })
      .eq("id", id);

    if (!error) {
      setDebits((prev) =>
        prev.map((debit) =>
          debit.id === id ? { ...debit, value: newValue } : debit
        )
      );
      setEditingValues((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      await fetchDebits();
      setEditingId(null);
    } else {
      console.error("Erro ao atualizar valor:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        navigate("/login");
        return;
      }

      const monthId = await ensureMonthExists();
      const user = (await supabase.auth.getUser()).data.user;
      if (monthId) {
        setIdMonth(monthId.id);
        const { data: cards } = await supabase
          .from("credit_cards")
          .select("*")
          .eq("user_id", user ? user.id : null);
        console.log(cards);
        setCards(cards ?? []);
        const { data: monthDebits } = await supabase
          .from("debits")
          .select("*")
          .eq("month_id", monthId.id)
          .order("created_at", { ascending: false });

        console.log(monthDebits);

        setDebits(monthDebits ?? []);
        if (monthDebits?.length) {
          const total = monthDebits.reduce((acc, d) => acc + (d.value || 0), 0);
          const totalPagos = monthDebits
            .filter((d) => d.paid)
            .reduce((acc, d) => acc + (d.value || 0), 0);
          const totalNaoPagos = total - totalPagos;

          console.log("Total:", total);
          console.log("Total pagos:", totalPagos);
          console.log("Total não pagos:", totalNaoPagos);

          setTotal(total);
          setTotalPagos(totalPagos);
          setTotalNaoPagos(totalNaoPagos);
        }
      }
      setLoading(false)
      
    };

    init();
  }, [navigate]);

  const sortIcon = (field: string) => {
    const [current, direction] = (sort ?? "").split("-");
    if (current !== field) return <HiChevronUpDown className="h-3.5 w-3.5 text-slate-400" />;
    return direction === "D" ? (
      <HiChevronDown className="h-3.5 w-3.5 text-indigo-600" />
    ) : (
      <HiChevronUp className="h-3.5 w-3.5 text-indigo-600" />
    );
  };

  const sortableTh = (field: string, label: string, className = "") => (
    <th className={`th ${className}`}>
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-900"
      >
        {label}
        {sortIcon(field)}
      </button>
    </th>
  );

  const placeholderClass =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 transition-colors hover:border-indigo-400 hover:text-indigo-600";

  // Compras no cartão nunca aparecem soltas: viram uma única linha de fatura por cartão
  const cardItems = new Map<string, Debit[]>();
  debits.forEach((d) => {
    if (!d.credit_card || d.description.includes("byduuid")) return;
    cardItems.set(d.credit_card, [...(cardItems.get(d.credit_card) ?? []), d]);
  });

  const rows: Row[] = [];
  const emittedCards = new Set<string>();
  debits.forEach((d) => {
    const items = d.credit_card ? cardItems.get(d.credit_card) : undefined;
    if (!items) {
      rows.push({ type: "debit", debit: d });
      return;
    }
    if (emittedCards.has(d.credit_card!)) return;
    emittedCards.add(d.credit_card!);
    rows.push({
      type: "card",
      bill: {
        card: d.credit_card!,
        items,
        total: items.reduce((acc, i) => acc + (i.value || 0), 0),
        paidCount: items.filter((i) => i.paid).length,
      },
    });
  });

  // Cartões ficam fixos no topo (por nome); a ordenação da tabela vale só para os outros débitos
  const cardBills = rows
    .flatMap((r) => (r.type === "card" ? [r.bill] : []))
    .sort((a, b) => a.card.localeCompare(b.card));
  const debitRows = rows.flatMap((r) => (r.type === "debit" ? [r.debit] : []));

  const openBill = openCard ? cardBills.find((b) => b.card === openCard) : undefined;
  const openBillPaid = !!openBill && openBill.paidCount === openBill.items.length;

  // Fatura ficou vazia (compras excluídas/tiradas do cartão): fecha a janela
  useEffect(() => {
    if (openCard && !openBill) setOpenCard(null);
  }, [openCard, openBill]);
  const cardInfo = (name: string) => cards.find((c) => c.name === name);

  // due_date guarda só o dia do mês corrente
  const dueStatus = (dueDate: string | null, paid: boolean) => {
    if (paid || !dueDate) return null;
    const daysLeft = Number(dueDate) - new Date().getDate();
    if (Number.isNaN(daysLeft)) return null;
    if (daysLeft < 0) return { tone: "overdue" as const, label: "Vencido" };
    if (daysLeft <= 2)
      return { tone: "soon" as const, label: daysLeft === 0 ? "Vence hoje" : `Vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}` };
    return null;
  };

  // Barra viva de 2px na borda + tom claro que desce até o branco numa curva única.
  // A "dica" de interpolação (22px) faz a queda ser mais rápida no início e a cauda suave,
  // sem várias paradas — são elas que criam faixas visíveis.
  const dueBar = (status: ReturnType<typeof dueStatus>) => {
    if (!status) return "";
    return status.tone === "overdue"
      ? "bg-[linear-gradient(to_right,#f43f5e_0_2px,#fecdd3_2px,22px,rgb(254_205_211/0)_64px)]"
      : "bg-[linear-gradient(to_right,#f97316_0_2px,#fed7aa_2px,22px,rgb(254_215_170/0)_64px)]";
  };

  const dueBadge = (status: ReturnType<typeof dueStatus>) =>
    status && (
      <span
        className={`badge ${
          status.tone === "overdue" ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200" : "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200"
        }`}
      >
        {status.label}
      </span>
    );

  const formatDue = (dueDate: string | null) =>
    dueDate
      ? `${dueDate.length == 1 ? "0" + dueDate : dueDate}${new Date().toLocaleDateString("pt-br").substring(2, 10)}`
      : null;

  const renderAmount = (debit: Debit, tone: string) =>
    editingId === debit.id ? (
      <input
        type="number"
        className="input w-32 py-1.5"
        value={editingValues[debit.id] ?? debit.value}
        onChange={(e) => handleValueChange(debit.id, e.target.value)}
      />
    ) : (
      <span className={`font-semibold tabular-nums ${tone}`}>{brl(debit.value)}</span>
    );

  const renderActions = (debit: Debit) => (
    <>
      {debit.installments ? (
        anticipatingId === debit.id ? (
          <>
            <select
              value={anticipateCount}
              onChange={(e) => setAnticipateCount(Number(e.target.value))}
              className="input w-auto py-1"
            >
              {Array.from({ length: debit.installments - debit.current }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}x
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => handleAnticipateInstallments(debit)}>
              Confirmar
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAnticipatingId(null)}>
              Cancelar
            </button>
          </>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setAnticipatingId(debit.id)}>
            Antecipar
          </button>
        )
      ) : editingId === debit.id ? (
        <>
          <button className="btn btn-primary btn-sm" onClick={() => handleSaveValue(debit.id)}>
            Salvar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
            Cancelar
          </button>
        </>
      ) : (
        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(debit.id)}>
          Alterar valor
        </button>
      )}

      <button
        type="button"
        title="Excluir"
        className="icon-btn hover:bg-rose-50 hover:text-rose-600"
        onClick={() => setConfirmDelete(debit.id)}
      >
        <HiOutlineTrash className="h-4 w-4" />
      </button>
    </>
  );

  const renderGroup = (debit: Debit, clickable: boolean) =>
    debit.group ? (
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Remover grupo"
          onClick={() => deletedGroupName(debit.id)}
          className="icon-btn p-1 hover:text-rose-600"
        >
          <HiXMark className="h-3.5 w-3.5" />
        </button>
        <EntityTag
          kind="group"
          name={debit.group}
          iconOnly
          title={clickable ? `Agrupar por ${findGroup(debit.group)?.label ?? debit.group}` : undefined}
          onClick={clickable ? () => handleSortGroup(debit.group!) : undefined}
        />
      </div>
    ) : (
      <button
        type="button"
        title="Vincular grupo"
        onClick={() => {
          setSelectGroup(debit.id);
        }}
        className={placeholderClass}
      >
        <HiOutlineTag className="h-4 w-4" />
      </button>
    );

  const paidPercent = total > 0 ? Math.round((totalPagos / total) * 100) : 0;

  return (
    <>
      {loading && (
        <Background>
          <Spinner />
        </Background>
      )}

      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Débitos mensais</p>
              <h1 className="text-2xl font-semibold text-slate-900">{monthLabel()}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  await handleFutureDebits();
                  setShowFuture(true);
                }}
                className="btn btn-ghost"
              >
                <HiOutlineEye className="h-4 w-4" />
                Prévia de {monthLabel(1).split(" ")[0].toLowerCase()}
              </button>
              <button
                disabled={cards.length == 0}
                onClick={() => setAddDebit("future")}
                className="btn btn-secondary"
              >
                <HiOutlineCalendarDays className="h-4 w-4" />
                Lançamento futuro
              </button>
              <button onClick={() => setAddDebit("current")} className="btn btn-primary">
                <HiOutlinePlus className="h-4 w-4" />
                Adicionar débito
              </button>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total do mês</p>
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <HiOutlineBanknotes className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{brl(total)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {debits.length} {debits.length === 1 ? "lançamento" : "lançamentos"}
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Pago</p>
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <HiOutlineCheckCircle className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600">{brl(totalPagos)}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-slate-500">{paidPercent}%</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">A pagar</p>
                <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <HiOutlineClock className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-600">{brl(totalNaoPagos)}</p>
            </div>
          </div>

          {addDebit && (
            <Background>
              <DebitForm
                type={addDebit}
                onSuccess={fetchDebits}
                cards={cards}
                setAddDebit={setAddDebit}
                monthId={idMonth || ""}
              />
            </Background>
          )}

          {showFuture && (
            <Background>
              <div className="modal max-w-2xl">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Prévia do próximo mês</h2>
                    <p className="text-sm text-slate-500">{monthLabel(1)} · simulado</p>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => setShowFuture(false)}>
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="th">Descrição</th>
                        <th className="th">Parcela</th>
                        <th className="th text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {futureDebits.map((debit) => (
                        <tr key={debit.id} className="hover:bg-slate-50">
                          <td className="td font-medium text-slate-900">{debit.description}</td>
                          <td className="td text-slate-600">
                            {debit.installments ? `${debit.current}/${debit.installments}` : "Avulso"}
                          </td>
                          <td className="td text-right font-semibold tabular-nums text-slate-900">
                            {brl(debit.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td className="td font-semibold text-slate-700" colSpan={2}>Total previsto</td>
                        <td className="td text-right text-base font-semibold tabular-nums text-indigo-600">
                          {brl(futureValue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={() => setShowFuture(false)} className="btn btn-secondary">
                    Fechar
                  </button>
                </div>
              </div>
            </Background>
          )}

          {selectCard && (
            <Background>
              <div className="modal max-w-sm">
                <h2 className="text-lg font-semibold text-slate-900">Vincular cartão</h2>
                <p className="mb-4 text-sm text-slate-500">Escolha o cartão de crédito deste débito.</p>
                <select
                  value={""}
                  onChange={(e) => setSelectedCardName(e.target.value)}
                  className="input"
                >
                  <option value="">Selecione o cartão</option>
                  {cards.map((cards) => (
                    <option key={cards.id} value={cards.name}>
                      {cards.name}
                    </option>
                  ))}
                </select>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setSelectCard(null)} className="btn btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </Background>
          )}

          {selectGroup && (
            <Background>
              <div className="modal max-w-sm">
                <h2 className="text-lg font-semibold text-slate-900">Vincular grupo</h2>
                <p className="mb-4 text-sm text-slate-500">Escolha o grupo deste débito.</p>
                <div className="grid grid-cols-2 gap-2">
                  {GROUPS.map((group) => (
                    <button
                      key={group.name}
                      type="button"
                      onClick={() => setSelectedGroupName(group.name)}
                      className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2 text-left text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
                    >
                      <EntityTag kind="group" name={group.name} iconOnly />
                      <span className="leading-tight">{group.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setSelectGroup(null)} className="btn btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </Background>
          )}

          {openBill && (
            <Background>
              <div className="modal max-w-3xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <EntityTag
                      kind="card"
                      name={openBill.card}
                      icon={cardInfo(openBill.card)?.icon}
                      color={cardInfo(openBill.card)?.color}
                      size="lg"
                      iconOnly
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">Fatura {openBill.card}</h2>
                        {openBillPaid && <span className="badge bg-emerald-100 text-emerald-700">Paga</span>}
                      </div>
                      <p className="text-sm text-slate-500">
                        {monthLabel()} · {openBill.items.length} {openBill.items.length === 1 ? "compra" : "compras"}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => setOpenCard(null)}>
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="th min-w-[220px]">Descrição</th>
                        <th className="th">Parcela</th>
                        <th className="th">Valor</th>
                        <th className="th text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {openBill.items.map((debit) => (
                        <tr key={debit.id} className={debit.paid ? "bg-emerald-50/60" : "hover:bg-slate-50"}>
                          <td className="td">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`font-medium ${debit.paid ? "text-slate-500" : "text-slate-900"}`}>
                                {debit.description}
                              </span>
                              {renderGroup(debit, false)}
                            </div>
                          </td>
                          <td className="td">
                            {debit.installments ? (
                              <span className="badge bg-slate-100 tabular-nums text-slate-700">
                                {debit.current}/{debit.installments}
                              </span>
                            ) : debit.recurring ? (
                              <span className="badge bg-indigo-50 text-indigo-700">
                                <HiOutlineArrowPath className="h-3 w-3" />
                                Recorrente
                              </span>
                            ) : (
                              <span className="text-slate-500">Avulso</span>
                            )}
                          </td>
                          <td className="td">
                            {renderAmount(debit, debit.paid ? "text-emerald-700" : "text-slate-900")}
                          </td>
                          <td className="td">
                            <div className="flex items-center justify-end gap-2">
                              {renderActions(debit)}
                              <button
                                type="button"
                                title="Tirar do cartão"
                                className="icon-btn"
                                onClick={() => deletedCardName(debit.id)}
                              >
                                <HiOutlineArrowUturnLeft className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td className="td font-semibold text-slate-700" colSpan={2}>Total da fatura</td>
                        <td className="td text-base font-semibold tabular-nums text-slate-900" colSpan={2}>
                          {brl(openBill.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button onClick={() => setOpenCard(null)} className="btn btn-secondary">
                    Fechar
                  </button>
                  {openBillPaid ? (
                    <button onClick={() => handlePayCard(openBill.items, false)} className="btn btn-secondary">
                      Desmarcar pagamento
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePayCard(openBill.items, true)}
                      className="btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    >
                      <HiOutlineCheckCircle className="h-4 w-4" />
                      Pagar fatura · {brl(openBill.total - openBill.items.filter((i) => i.paid).reduce((acc, i) => acc + i.value, 0))}
                    </button>
                  )}
                </div>
              </div>
            </Background>
          )}

          {confirmDelete && (
            <Background>
              <div className="modal max-w-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <HiOutlineTrash className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Excluir débito?</h2>
                <p className="mt-1 text-sm text-slate-500">Essa ação não pode ser desfeita.</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setConfirmDelete(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(confirmDelete);
                      setConfirmDelete(null);
                    }}
                    className="btn btn-danger"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </Background>
          )}

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Seus débitos</h2>
              {activeGrouping && (
                <span className="badge bg-indigo-50 text-indigo-700">
                  Agrupado por {activeGrouping.value}
                </span>
              )}
            </div>

            {debits.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <span className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
                  <HiOutlineInboxStack className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-slate-900">
                  {loading ? "Carregando..." : "Nenhum débito cadastrado"}
                </p>
                {!loading && (
                  <p className="mt-1 text-sm text-slate-500">Adicione o primeiro débito do mês para começar.</p>
                )}
              </div>
            ) : (
              <>
                {cardBills.length > 0 && (
                  <div className="border-b border-slate-200">
                    <p className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cartões
                    </p>
                    <ul className="divide-y divide-slate-100">
                      {cardBills.map((bill) => {
                        const info = cardInfo(bill.card);
                        const allPaid = bill.paidCount === bill.items.length;
                        const dueDay = info?.due_day ? String(info.due_day) : bill.items.find((i) => i.due_date)?.due_date ?? null;
                        const due = formatDue(dueDay);
                        const status = dueStatus(dueDay, allPaid);

                        return (
                          <li
                            key={bill.card}
                            className={`flex items-center gap-4 px-5 py-3 ${allPaid ? "bg-emerald-50/60" : `hover:bg-slate-50 ${dueBar(status)}`}`}
                          >
                            <input
                              type="checkbox"
                              title={status?.label ?? (allPaid ? "Desmarcar pagamento da fatura" : "Pagar fatura inteira")}
                              checked={allPaid}
                              onChange={() => handlePayCard(bill.items, !allPaid)}
                              className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
                            />

                            <button
                              type="button"
                              onClick={() => setOpenCard(bill.card)}
                              className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <EntityTag kind="card" name={bill.card} icon={info?.icon} color={info?.color} iconOnly />
                              <div className="min-w-0">
                                <p className={`truncate font-medium group-hover:text-indigo-700 ${allPaid ? "text-slate-500" : "text-slate-900"}`}>
                                  Fatura {bill.card}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {bill.items.length} {bill.items.length === 1 ? "compra" : "compras"}
                                  {bill.paidCount > 0 && !allPaid && ` · ${bill.paidCount} paga${bill.paidCount > 1 ? "s" : ""}`}
                                  {due && ` · vence ${due}`}
                                </p>
                              </div>
                            </button>

                            {allPaid && <span className="badge hidden bg-emerald-100 text-emerald-700 sm:inline-flex">Paga</span>}
                            {status && <span className="hidden sm:inline-flex">{dueBadge(status)}</span>}
                            <span className={`text-right font-semibold tabular-nums ${allPaid ? "text-emerald-700" : "text-slate-900"}`}>
                              {brl(bill.total)}
                            </span>
                            <button
                              type="button"
                              title="Ver compras"
                              onClick={() => setOpenCard(bill.card)}
                              className="icon-btn"
                            >
                              <HiChevronRight className="h-5 w-5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {debitRows.length > 0 && (
                  <>
                    {cardBills.length > 0 && (
                      <p className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Outros débitos
                      </p>
                    )}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            {sortableTh("paid", "Pago", "w-20")}
                            <th className="th min-w-[300px]">Descrição</th>
                            {sortableTh("value", "Valor", "min-w-[220px]")}
                            {sortableTh("due_date", "Vencimento")}
                            {sortableTh("installments", "Parcela")}
                            {sortableTh("recurring", "Tipo")}
                            <th className="th text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {debitRows.map((debit) => {
                            const isGrouped = debit.description.includes("byduuid");
                            const status = isGrouped ? null : dueStatus(debit.due_date, debit.paid);

                            return (
                              <tr
                                key={debit.id}
                                className={
                                  isGrouped
                                    ? "bg-indigo-50/70"
                                    : debit.paid
                                    ? "bg-emerald-50/60"
                                    : "hover:bg-slate-50"
                                }
                              >
                                <td className={`td ${dueBar(status)}`}>
                                  {!isGrouped && (
                                    <input
                                      type="checkbox"
                                      title={status?.label}
                                      checked={!!debit.paid}
                                      onChange={() => handleTogglePaid(debit.id, !debit.paid)}
                                      className="h-4 w-4 cursor-pointer accent-emerald-600"
                                    />
                                  )}
                                </td>

                                <td className="td">
                                  <div className="flex items-center justify-between gap-3">
                                    <span
                                      className={`uppercase ${
                                        isGrouped
                                          ? "font-semibold text-indigo-900"
                                          : debit.paid
                                          ? "font-medium text-slate-500"
                                          : "font-medium text-slate-900"
                                      }`}
                                    >
                                      {debit.description.replace("byduuid", "")}
                                    </span>
                                    {isGrouped ? (
                                      <EntityTag
                                        kind="group"
                                        name={debit.group ?? ""}
                                        iconOnly
                                        title="Desagrupar"
                                        onClick={() => handleSortGroup(debit.group!)}
                                      />
                                    ) : (
                                      renderGroup(debit, true)
                                    )}
                                  </div>
                                </td>

                                <td className="td">
                                  <div className="flex items-center justify-between gap-3">
                                    {renderAmount(
                                      debit,
                                      isGrouped ? "text-indigo-700" : debit.paid ? "text-emerald-700" : "text-slate-900"
                                    )}
                                    {!isGrouped && editingId !== debit.id && (
                                      <button
                                        type="button"
                                        title="Lançar no cartão"
                                        onClick={() => {
                                          setSelectCard(debit.id);
                                        }}
                                        className={placeholderClass}
                                      >
                                        <HiOutlineCreditCard className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td className="td tabular-nums text-slate-600">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {(!isGrouped && formatDue(debit.due_date)) || <span className="text-slate-300">—</span>}
                                    {dueBadge(status)}
                                  </div>
                                </td>

                                <td className="td">
                                  {isGrouped ? (
                                    <span className="text-slate-300">—</span>
                                  ) : debit.installments ? (
                                    <span className="badge bg-slate-100 tabular-nums text-slate-700">
                                      {debit.current}/{debit.installments}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">Avulso</span>
                                  )}
                                </td>

                                <td className="td">
                                  {debit.recurring ? (
                                    <span className="badge bg-indigo-50 text-indigo-700">
                                      <HiOutlineArrowPath className="h-3 w-3" />
                                      Recorrente
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>

                                <td className="td">
                                  <div className="flex items-center justify-end gap-2">
                                    {!isGrouped && renderActions(debit)}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
