import { useState } from 'react';
import { supabase } from '../../supabase_client';
import Background from '../background';
import Spinner from '../spinner';
import EntityTag from '../entity_tag';
import { HiOutlineEye, HiOutlineTag, HiOutlineTrash, HiXMark } from 'react-icons/hi2';
import { findGroup, GROUPS } from '../../utils/appearance';
import { brl, monthLabel } from '../../utils/format';

interface Props {
  monthId: string;
  setAddDebit: (value: string | null) => void;
  type: string;
  onSuccess?: () => void;
  cards:any
}
type FutureDebit = {
  id: string;
  description: string;
  value: number;
  installments: number | null;
  due_date: string | null;
  group: string | null;
  credit_card: string; // obrigatório
  current: number;
  recurring: boolean;
  paid: boolean; // pode até ficar como false sempre
  month_id: string; // mês em que foi lançado
  created_at: string; // opcional, bom pra rastrear
};
export default function DebitForm({ monthId, setAddDebit, onSuccess, cards, type }: Props) {
  console.log(cards, type);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [current, setCurrent] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [date, setDate]=useState('')
  const [loading, setLoading] = useState(false);
  const [selectCard, setSelectCard] = useState('')
  const [selectGroup, setSelectGroup] = useState('')
  const [future, setFuture] =useState<FutureDebit[]>([]);

  const handleChange = (id: string) => {
    setSelectCard(id);

  };

  async function fetchFutureDebits() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }
  
    const { data, error } = await supabase
      .from('future_debits')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_id', monthId)
      .order('created_at', { ascending: true });
  
    if (error) {
      console.error('Erro ao buscar future_debits:', error);
      return [];
    }
  console.log(data);
  
    setFuture(data)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("future_debits").delete().eq("id", id);
    if (!error) {
      setFuture((prev) => prev.filter((d) => d.id !== id));
      
    } else {
      alert("Erro ao excluir dívida");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // evita o submit padrão
  
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedInstallments = installments ? parseInt(installments, 10) : null;
    // Débito no cartão usa o vencimento cadastrado no cartão
    const dueDate = cardDueDay ? String(cardDueDay) : date || null;
  console.log({
    description,
    value: parsedAmount,
    installments: parsedInstallments || null,
    current: current || null,
    credit_card: type === 'future' ? selectCard : null,
    recurring,
    due_date: date || null,
    month_id: monthId,
    user_id: user?.id,
    created_at: new Date().toISOString(),
  });
  
    const { error } = await supabase.from(type === 'current' ? 'debits' : 'future_debits').insert({
      description,
      value: parsedAmount,
      installments: parsedInstallments || null,
      current: parsedInstallments  && type === 'future' ? 1 : parsedInstallments  && type === 'current' ? current : null,
      credit_card: selectCard || null,
      group: selectGroup || null,
      recurring,
      due_date: dueDate,
      month_id: monthId,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    });
  
    if (error) {
      console.error('Erro ao salvar débito:', error);
      alert('Erro ao salvar débito');
    } else {
      setDescription('');
      setAmount('');
      setInstallments('');
      setCurrent('');
      setDate('');
      setRecurring(false);
      setSelectGroup('');
      if (type === 'current') setSelectCard('');
      if (onSuccess) {
        onSuccess(); // ✅ agora só vai ser chamado se não for "future"
      }
    }
  
    setLoading(false);
  };

  const title = type === 'current' ? 'Adicionar débito' : type === 'future' ? 'Lançamento futuro' : '';
  const cardDueDay: number | null = selectCard ? cards.find((c: any) => c.name === selectCard)?.due_day ?? null : null;
  const canSubmit = type === 'current' || (type === 'future' && !!selectCard);

  return (
  <>
  {loading && future.length === 0 && (
    <Background>
      <Spinner />
    </Background>
  )}

  {future.length > 0 && (
    <Background>
      <div className="modal max-w-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Lançamentos futuros</h2>
            <p className="text-sm text-slate-500">{monthLabel()}</p>
          </div>
          <button type="button" className="icon-btn" onClick={() => { setLoading(false); setFuture([]) }}>
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Descrição</th>
                <th className="th">Parcela</th>
                <th className="th">Cartão</th>
                <th className="th text-right">Valor</th>
                <th className="th w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {future.map((debit) => {
                const card = cards.find((c: any) => c.name === debit.credit_card);
                return (
                  <tr key={debit.id} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-900">{debit.description}</td>
                    <td className="td text-slate-600">
                      {debit.installments ? `${debit.current}/${debit.installments}` : '—'}
                    </td>
                    <td className="td">
                      {card ? (
                        <EntityTag kind="card" name={card.name} icon={card.icon} color={card.color} iconOnly />
                      ) : (
                        <span className="text-slate-600">{debit.credit_card}</span>
                      )}
                    </td>
                    <td className="td text-right font-semibold tabular-nums text-slate-900">
                      {brl(debit.value)}
                    </td>
                    <td className="td">
                      <button
                        type="button"
                        title="Excluir"
                        className="icon-btn hover:text-rose-600"
                        onClick={() => { setLoading(false); handleDelete(debit.id) }}
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => { setLoading(false); setFuture([]) }} className="btn btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </Background>
  )}

  {future.length == 0 && (
    <div className="modal max-w-md">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            {type === 'future' ? 'Será lançado no próximo mês' : monthLabel()}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={() => { setAddDebit(null) }}>
          <HiXMark className="h-5 w-5" />
        </button>
      </div>

      {type == 'future' && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setLoading(true)
            fetchFutureDebits().finally(() => setLoading(false))
          }}
          className="btn btn-secondary mb-5 w-full"
        >
          <HiOutlineEye className="h-4 w-4" />
          {loading ? 'Carregando...' : 'Ver lançamentos futuros'}
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {cards.length > 0 && (type === 'future' || type === 'current') && (
          <div>
            <label className="label">
              Cartão {type === 'current' && <span className="font-normal text-slate-400">(opcional)</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cards.map((card: any) => (
                <label
                  key={card.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                    selectCard === card.name
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="creditCard"
                    value={card.name}
                    checked={selectCard === card.name}
                    onChange={() => handleChange(card.name)}
                    onClick={() => type === 'current' && selectCard === card.name && handleChange('')}
                    className="hidden"
                  />
                  <EntityTag kind="card" name={card.name} icon={card.icon} color={card.color} iconOnly />
                  <span className="truncate text-sm font-medium text-slate-700">{card.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">Descrição</label>
          <input
            type="text"
            placeholder="Ex.: Aluguel"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label className="label mb-0">Grupo</label>
            <span className="text-xs text-slate-500">{findGroup(selectGroup)?.label ?? 'Nenhum'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              title="Sem grupo"
              onClick={() => setSelectGroup('')}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dashed transition ${
                selectGroup === ''
                  ? 'border-indigo-400 text-indigo-600 ring-2 ring-indigo-500 ring-offset-1'
                  : 'border-slate-300 text-slate-400 hover:border-slate-400'
              }`}
            >
              <HiOutlineTag className="h-5 w-5" />
            </button>
            {GROUPS.map((group) => (
              <button
                key={group.name}
                type="button"
                onClick={() => setSelectGroup(group.name)}
                className={`rounded-lg transition ${
                  selectGroup === group.name ? 'ring-2 ring-indigo-500 ring-offset-1' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <EntityTag kind="group" name={group.name} size="lg" iconOnly />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={type === 'future' ? 'col-span-2' : ''}>
            <label className="label">Valor da parcela</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className="input pl-9"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {type !== 'future' && (
            <div>
              <label className="label">Dia do vencimento</label>
              <input
                type="number"
                placeholder="1 a 31"
                min="1"
                max="31"
                className="input disabled:bg-slate-50 disabled:text-slate-500"
                value={cardDueDay ? String(cardDueDay) : date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!!cardDueDay}
                title={cardDueDay ? 'Definido pelo cartão' : undefined}
              />
              {cardDueDay && <p className="mt-1 text-xs text-slate-500">Definido pelo cartão</p>}
            </div>
          )}

          <div className={type === 'future' ? 'col-span-2' : ''}>
            <label className="label">Total de parcelas</label>
            <input
              type="number"
              placeholder="Opcional"
              min="1"
              className="input"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </div>

          {type !== 'future' && (
            <div>
              <label className="label">Parcela atual</label>
              <input
                type="number"
                placeholder="Opcional"
                min="1"
                className="input"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
          )}
        </div>

        {!installments.length && type !== 'future' && (
          <label htmlFor="recurring" className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              id="recurring"
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-indigo-600"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            Débito recorrente (repete todo mês)
          </label>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={() => { setAddDebit(null) }} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading || !canSubmit} className="btn btn-primary">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )}
  </>
  );
}
