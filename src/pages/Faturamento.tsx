import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase_client";
import { ensureMonthExists } from "../utils/ensureMonthExists";
import DebitForm from "../components/forms/debit_form";
import Background from "../components/background";
import { AiFillDelete } from "react-icons/ai";
import { PiArrowsDownUpBold } from "react-icons/pi";
import { GrMoney } from "react-icons/gr";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { RiMoneyDollarBoxFill } from "react-icons/ri";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { RiDeleteBackFill } from "react-icons/ri";
import { MdOutlineAddCard } from "react-icons/md";


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

type Group = {
  id: string;
  name: string;
  image: string;
  future: boolean;
};

type Cards = {
  id: string;
  name: string;
  image: string;
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>("created_at-D");
  const [filter, setFilter]=useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
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

      const filtered = debits.filter((d) => d.group === groupName);
      const others = debits.filter((d) => d.group !== groupName);

      const total = filtered.reduce((acc, d) => acc + (d.value || 0), 0);
      const grouped: Debit = {
        id: "grouped-" + groupName,
        description: `byduuidTOTAL => ${groupName}`,
        value: total,
        paid: false,
        installments: null,
        credit_card: "uuid",
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

  const handleCardToggle = (cardName: string) => {
    if (!originalDebits.length) setOriginalDebits(debits);

    if (
      activeGrouping?.field === "credit_card" &&
      activeGrouping.value === cardName
    ) {
      // Desativa
      //setDebits(originalDebits);
      setSelectGrouping(null);
      setActiveGrouping(null);
    } else {
      // Agrupa cartão
      const filtered = debits.filter((d) => d.credit_card === cardName);
      const others = debits.filter((d) => d.credit_card !== cardName);

      const total = filtered.reduce((acc, d) => acc + (d.value || 0), 0);
      const grouped: Debit = {
        id: "card-" + cardName,
        description: `byduuidTOTAL => ${cardName}`,
        value: total,
        paid: false,
        installments: null,
        credit_card: filtered[0].credit_card,
        current: 0,
        recurring: false,
        due_date: filtered[0].due_date,
        group: "uuid",
        month_id: filtered[0]?.month_id,
      };

      setDebits([grouped, ...others]);
      setActiveGrouping({ field: "credit_card", value: cardName });
    }
  };

    const handleSortGroup = (groupName: string) => {
    console.log("GROUP", selectGrouping, activeGrouping, filter);
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
  };

  const handleSortCard = (cardName: string) => {
    console.log("Card", selectGrouping, activeGrouping);
    setFilter(`credit_card_${cardName}`)
    if (
      (selectGrouping?.field == "credit_card" &&
      selectGrouping.value === cardName) || filter === `credit_card_${cardName}`
    ) {
      const base = originalDebits.length > 0 ? originalDebits : debits;
      const ordenado = [...base].sort((a, b) => {
        if (a.credit_card === cardName && b.credit_card !== cardName) return -1;
        if (a.credit_card !== cardName && b.credit_card === cardName) return 1;
        return 0;
      });

      setDebits(ordenado);
      setSelectGrouping({ field: "credit_card", value: cardName });
      handleCardToggle(cardName);
    } else {
      const base = originalDebits.length > 0 ? originalDebits : debits;
      const ordenado = [...base].sort((a, b) => {
        if (a.credit_card === cardName && b.credit_card !== cardName) return -1;
        if (a.credit_card !== cardName && b.credit_card === cardName) return 1;
        return 0;
      });

      setDebits(ordenado);
      setSelectGrouping({ field: "credit_card", value: cardName });
    }
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

    const { error } = await supabase
      .from("debits")
      .update({ credit_card: name }) // atualiza o campo "group"
      .eq("id", debitId); // onde o ID do débito for igual ao selecionado

    if (error) {
      console.error("Erro ao atualizar cartão do débito:", error);
    } else {
      console.log("Cartão atualizado com sucesso");
      await fetchDebits(); // se quiser recarregar a lista após atualizar
    }
  };

  const handleSort = async (filter: string) => {
    console.log(filter, sort);
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
      setDebits(data);

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
        const { data: groups } = await supabase
          .from("groups")
          .select("*")
          .eq("user_id", user ? user.id : null);
        console.log(groups);
        setGroups(groups ?? []);
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

      setLoading(false);
    };

    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-indigo-950 h-[100%] min-h-screen w-[100%] py-16">
      <div className="p-6 bg-gray-100  rounded-md max-w-[1500px] mx-auto py-16">
        <p className="text-2xl font-bold  text-indigo-900 text-center">
          DEBITOS MENSAIS{" "}
        </p>
        <p className="text-2xl font-bold mb-4 text-indigo-900 text-center">
          {new Date()
            .toLocaleString("pt-BR", { month: "long", year: "numeric" })
            .toUpperCase()}
        </p>
        <div className="font-bold bg-white justify-between rounded flex flex-wrap shadow-md p-4 mb-6 gap-6 mx-auto">
          <div className="mx-auto flex justify-between w-[250px w-[250px]">
            <div className="flex gap-5 ">
              <GrMoney className="w-[40px] h-auto text-yellow-500" />
              <p className="my-auto">TOTAL</p>
            </div>

            <label className="text-blue-700 my-auto">
              {total.toLocaleString("pt-br", {
                style: "currency",
                currency: "BRL",
              })}
            </label>
          </div>

          <div className="mx-auto flex justify-between w-[250px] ">
            <div className="flex gap-6 ">
              <RiMoneyDollarCircleFill className="w-[40px] h-auto text-green-500" />
              <p className="my-auto">PAGO</p>
            </div>
            <label className=" text-green-500 my-auto">
              {totalPagos.toLocaleString("pt-br", {
                style: "currency",
                currency: "BRL",
              })}
            </label>
          </div>
          <div className="mx-auto flex justify-between w-[250px]">
            <div className="flex gap-2 ">
              <RiMoneyDollarBoxFill className="w-[40px] h-auto text-red-500" />
              <p className="my-auto">À PAGAR</p>
            </div>
            <label className="text-red-500 my-auto">
              {totalNaoPagos.toLocaleString("pt-br", {
                style: "currency",
                currency: "BRL",
              })}
            </label>
          </div>
        </div>

        {!addDebit ? (
          <div className="mb-4 mt-6 flex justify-between gap-2">
            <button
              onClick={() => setAddDebit('current')}
              className="p-2 text-white bg-red-600 hover:bg-red-700 font-bold rounded "
            >
              ADICIONAR DÉBITO
            </button>
            <button
            disabled = {cards.length== 0}
              onClick={() => setAddDebit('future')}
              className="p-2 text-white bg-yellow-500 hover:bg-yellow-600 font-bold rounded "
            >
              LANÇAMENTO FUTURO
            </button>
            {!showFuture && (
              <button
                onClick={async () => {
                  await handleFutureDebits();
                  setShowFuture(true);
                }}
                className=" px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded"
              >
                PREVIEW <br />
                {new Date(new Date().setMonth(new Date().getMonth() + 1))
                  .toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })
                  .toUpperCase()
                  .replace(" DE ", " / ")}
              </button>
            )}
          </div>
        ) : (
          <Background>
            <DebitForm
              type={addDebit}
              onSuccess={fetchDebits}
              cards = {cards}
              setAddDebit={setAddDebit}
              monthId={idMonth || ""}
            />
          </Background>
        )}
        
        <h2 className="text-xl font-semibold  text-indigo-900">SEUS DÉBITOS</h2>
        

        {showFuture && (
          <Background>
            <div className="mt-14 max-w-[650px]   mx-auto p-4 bg-white rounded">
              <p className="text-lg font-bold text-center text-indigo-800">
                Próximo Faturamento (Simulado)
              </p>
              <p className="text-xl mb-2 font-bold text-center text-indigo-800">
                {new Date(new Date().setMonth(new Date().getMonth() + 1))
                  .toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })
                  .toUpperCase()
                  .replace(" DE ", " / ")}
              </p>
              <ul className="space-y-2">
                <div className="w-full mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse bg-white shadow rounded-lg">
                    <thead className="">
                      <tr className="bg-indigo-950 text-white ">
                        <th className="px-4 py-2 min-w-[300px] text-left">
                          Descrição
                        </th>
                        <th className="px-4 py-2 min-w-[250px] text-left">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-left min-w-[150px]">
                          Parcela
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {futureDebits.map((debit) => (
                        <tr
                          key={debit.id}
                          className={"border-t border-gray-400 bg-gray-200"}
                        >
                          <td className="px-4 py-2 font-medium  uppercase max-w-xs break-words">
                            {debit.description}
                          </td>
                          <td className="px-4 py-2 font-medium  uppercase max-w-xs break-words">
                            <p className={"font-bold "}>
                              {debit.value.toLocaleString("pt-br", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </td>
                          <td className="px-4 py-2">
                            {debit.installments
                              ? `Parcela ${debit.current}/${debit.installments}`
                              : "Avulso"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ul>
              <div className="p-4 text-right">
                <p className="font-bold text-lg text-orange-700">
                  {futureValue.toLocaleString("pt-br", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowFuture(false)}
                className="bg-yellow-600 p-2 text-white font-bold hover:bg-yellow-800 rounded "
              >
                FECHAR
              </button>
            </div>
          </Background>
        )}
        {selectCard && (
          <Background>
            <div className="mt-14 max-w-[350px] gap-6  mx-auto p-4 bg-white rounded flex flex-col">
              <p className="text-lg font-bold text-center text-indigo-800">
                SELECIONE O CARTÃO DE CRÉDITO
              </p>
              <select
                value={""}
                onChange={(e) => setSelectedCardName(e.target.value)}
                className="border text-gray-500 border-gray-600 rounded px-3 py-2"
              >
                <option value="">Selecione o cartão</option>
                {cards.map((cards) => (
                  <option key={cards.id} value={cards.name}>
                    {cards.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSelectCard(null)}
                className="bg-yellow-500 p-2 text-white font-bold hover:bg-yellow-600 rounded "
              >
                FECHAR
              </button>
            </div>
          </Background>
        )}
        {selectGroup && (
          <Background>
            <div className="mt-14 max-w-[350px] gap-6  mx-auto p-4 bg-white rounded flex flex-col">
              <p className="text-lg font-bold text-center text-indigo-800">
                SELECIONE O GRUPO
              </p>
              <select
                value={""}
                onChange={(e) => setSelectedGroupName(e.target.value)}
                className="border text-gray-500 border-gray-600 rounded px-3 py-2"
              >
                <option value="">Selecione um grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSelectGroup(null)}
                className="bg-yellow-500 p-2 text-white font-bold hover:bg-yellow-600 rounded "
              >
                FECHAR
              </button>
            </div>
          </Background>
        )}
        {debits.length === 0 ? (
          <p className="text-gray-500">Nenhuma dívida cadastrada.</p>
        ) : (
          <div className="w-full mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse bg-white shadow rounded-lg">
              <thead>
                <tr className="bg-indigo-950 text-white">
                  <th className="px-4 pr-8  py-2 text-left border-r border-r-white relative">
                    Pago{" "}
                    <PiArrowsDownUpBold
                      onClick={() => {
                        handleSort("paid");
                      }}
                      className="rounded-full bg-white text-indigo-950 p-[1px] hover:bg-yellow-500 hover:text-white cursor-pointer my-auto absolute top-3 right-2"
                    />
                  </th>
                  <th className="border-r border-r-white px-4 py-2 min-w-[350px] text-left">
                    Descrição
                  </th>
                  <th className="px-4 pr-8 min-w-[250px]  py-2 text-left border-r border-r-white relative">
                    Valor{" "}
                    <PiArrowsDownUpBold
                      onClick={() => {
                        handleSort("value");
                      }}
                      className="rounded-full bg-white text-indigo-950 p-[1px] hover:bg-yellow-500 hover:text-white cursor-pointer my-auto absolute top-3 right-2"
                    />
                  </th>
                  <th className="px-4 pr-8  py-2 text-left border-r border-r-white relative">
                    Vencimento{" "}
                    <PiArrowsDownUpBold
                      onClick={() => {
                        handleSort("due_date");
                      }}
                      className="rounded-full bg-white text-indigo-950 p-[1px] hover:bg-yellow-500 hover:text-white cursor-pointer my-auto absolute top-3 right-2"
                    />
                  </th>
                  <th className="px-4 pr-8  py-2 text-left border-r border-r-white relative">
                    Parcela{" "}
                    <PiArrowsDownUpBold
                      onClick={() => {
                        handleSort("installments");
                      }}
                      className="rounded-full bg-white text-indigo-950 p-[1px] hover:bg-yellow-500 hover:text-white cursor-pointer my-auto absolute top-3 right-2"
                    />
                  </th>
                  <th className="px-4 py-2 pr-8 min-w-[150px] text-left border-r relative border-r-white">
                    Tipo{" "}
                    <PiArrowsDownUpBold
                      onClick={() => {
                        handleSort("recurring");
                      }}
                      className="rounded-full bg-white text-indigo-950 p-[1px] hover:bg-yellow-500 hover:text-white cursor-pointer my-auto absolute top-3 right-2"
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {debits.map((debit) => (
                  <tr
                    key={debit.id}
                    className={
                      debit.paid
                        ? "border-t border-gray-400 bg-green-200"
                        : debit.description.includes("byduuid")
                        ? "border-t border-gray-400 bg-indigo-200"
                        : "border-t border-gray-400 bg-white"
                    }
                  >
                    <td className="px-4 py-2 ">
                      {!debit.description.includes("byduuid") && (
                        <input
                          type="checkbox"
                          checked={!!debit.paid}
                          onChange={() =>
                            handleTogglePaid(debit.id, !debit.paid)
                          }
                          className="w-5 h-5 my-auto cursor-pointer"
                        />
                      )}
                    </td>
                    <td className=" py-2 font-medium  uppercase  break-words flex  justify-between">
                      <label className="my-auto">
                        {debit.description.replace("byduuid", "")}
                      </label>
                      {debit.group ? (
                        (() => {
                          const grupo = groups.find(
                            (g) => g.name === debit.group
                          );
                          return grupo ? (
                            <div className="flex ">
                              {!debit.description.includes("byduuid") && (
                                <RiDeleteBackFill
                                  onClick={() => deletedGroupName(debit.id)}
                                  className="text-orange-600 hover:text-red-700 cursor-pointer"
                                />
                              )}
                              <img
                                onClick={() => {
                                  handleSortGroup(grupo.name);
                                }}
                                className={debit.description.includes("byduuid") ?"h-[100px] bg-white  w-auto cursor-pointer rounded ring ring-yellow-500":"h-[40px] bg-white max-w-[80%] w-auto cursor-pointer rounded ring ring-yellow-500"}
                                src={grupo.image}
                                alt={grupo.name}
                              />
                            </div>
                          ) : null;
                        })()
                      ) : (
                        <div className="p-1">
                          <MdOutlineAddPhotoAlternate
                            onClick={() => {
                              setSelectGroup(debit.id);
                            }}
                            className="w-[30px] text-gray-500 cursor-pointer hover:text-yellow-500 h-auto"
                          />
                        </div>
                      )}
                    </td>
                    <td className=" px-2 py-2">
                      {editingId === debit.id ? (
                        <input
                          type="number"
                          className="border p-1 rounded w-24"
                          value={editingValues[debit.id] ?? debit.value}
                          onChange={(e) =>
                            handleValueChange(debit.id, e.target.value)
                          }
                        />
                      ) : (
                        <div
                          className={
                            debit.description.includes("byduuid")
                              ? "font-bold text-blue-800 flex justify-between"
                              : debit.paid
                              ? "font-bold text-green-700 flex justify-between"
                              : !debit.paid
                              ? "font-bold text-orange-500 flex justify-between"
                              : ""
                          }
                        >
                          <p className="my-auto">
                            {debit.value.toLocaleString("pt-br", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                          {debit.credit_card ? (
                            (() => {
                              const card = cards.find(
                                (g) => g.name === debit.credit_card
                              );
                              return card ? (
                                <div className="flex ">
                                  {!debit.description.includes("byduuid") && (
                                    <RiDeleteBackFill
                                      onClick={() => deletedCardName(debit.id)}
                                      className="text-orange-600 hover:text-red-700 cursor-pointer"
                                    />
                                  )}
                                  <img
                                    onClick={() => {
                                      handleSortCard(card.name);
                                    }}
                                    className={debit.description.includes("byduuid") ?"h-[100px] bg-white  w-auto cursor-pointer rounded ring ring-yellow-500":"h-[40px] bg-white max-w-[80%] w-auto cursor-pointer rounded ring ring-yellow-500"}
                                    src={card.image}
                                    alt={card.name}
                                  />
                                </div>
                              ) : null;
                            })()
                          ) : (
                            <div className="p-1">
                              <MdOutlineAddCard
                                onClick={() => {
                                  setSelectCard(debit.id);
                                }}
                                className="w-[30px] text-gray-500 cursor-pointer hover:text-yellow-500 h-auto"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {debit.due_date && !debit.description.includes("byduuid")
                        ? `${
                            debit.due_date.length == 1
                              ? "0" + debit.due_date
                              : debit.due_date
                          }${new Date()
                            .toLocaleDateString("pt-br")
                            .substring(2, 10)}`
                        : "- - -"}
                    </td>
                    <td className="px-4 py-2">
                      {debit.installments &&
                      !debit.description.includes("byduuid")
                        ? `Parcela ${debit.current}/${debit.installments}`
                        : !debit.description.includes("byduuid")
                        ? "Avulso"
                        : "- - -"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {debit.recurring ? "🔁 Recorrente" : "- - -"}
                    </td>
                    <td className="px-4 py-2 space-x-2 space-y-2 flex justify-between">
                      {/* Parcelado: Antecipar */}
                      {debit.installments &&
                      !debit.description.includes("byduuid") ? (
                        anticipatingId === debit.id ? (
                          <div className="flex gap-2 items-center">
                            <select
                              value={anticipateCount}
                              onChange={(e) =>
                                setAnticipateCount(Number(e.target.value))
                              }
                              className="border rounded px-2 py-1"
                            >
                              {Array.from(
                                { length: debit.installments - debit.current },
                                (_, i) => i + 1
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num}x
                                </option>
                              ))}
                            </select>
                            <button
                              className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600"
                              onClick={() =>
                                handleAnticipateInstallments(debit)
                              }
                            >
                              Confirmar
                            </button>
                            <button
                              className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
                              onClick={() => setAnticipatingId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            className="bg-yellow-500 text-white min-w-[120px] px-2 py-1 font-bold rounded hover:bg-yellow-600"
                            onClick={() => setAnticipatingId(debit.id)}
                          >
                            Antecipar
                          </button>
                        )
                      ) : editingId === debit.id &&
                        !debit.description.includes("byduuid") ? (
                        <div className="inline-flex gap-1">
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                            onClick={() => handleSaveValue(debit.id)}
                          >
                            Salvar
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          {!debit.description.includes("byduuid") && (
                            <button
                              className="bg-blue-500 min-w-[120px] text-white px-2 py-1 font-bold rounded hover:bg-blue-600"
                              onClick={() => setEditingId(debit.id)}
                            >
                              Alterar Valor
                            </button>
                          )}
                        </>
                      )}

                      {/* Botão Excluir */}
                      {confirmDelete && (
                        <Background>
                          <div className="bg-white max-w-[350px] p-6 rounded mx-auto mt-16 text-center ">
                            <p className="font-bold text-xl text-indigo-900">
                              Confirma a Exclusão do Débito?
                            </p>
                            <div className="flex justify-between mt-8 px-8">
                              <button
                                onClick={() => {
                                  handleDelete(confirmDelete);
                                  setConfirmDelete(null);
                                }}
                                className="p-2 font-bold text-white bg-green-600 rounded w-[70px]"
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDelete(null);
                                }}
                                className="p-2 font-bold text-white bg-red-600 rounded w-[70px]"
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </Background>
                      )}
                      {!debit.description.includes("byduuid") && (
                        <AiFillDelete
                          className="text-red-800 h-[20px] w-[20px] cursor-pointer"
                          onClick={() => setConfirmDelete(debit.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
