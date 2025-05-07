import { useState } from 'react';
import { supabase } from '../../supabase_client';
import Background from '../background';
import { AiFillDelete } from 'react-icons/ai';
import coinGif from '../../assets/coin.gif'

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
      credit_card: type === 'future' ? selectCard : null,
      recurring,
      due_date: date || null,
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
      if (onSuccess) {
        onSuccess(); // ✅ agora só vai ser chamado se não for "future"
      }
    }
  
    setLoading(false);
  };

  return (
  <>
  {loading && (
    <Background>


      <img className='mx-auto' src={coinGif} alt="" />

    </Background>
  )}
  <div className='bg-white shadow-md rounded p-4 space-y-4 w-full max-w-md mx-auto mt-20 mb-20'>

{future.length > 0 && (
          <Background>
            <div className="mt-14 z-4 max-w-[850px]   mx-auto p-4 bg-white rounded">
              <p className="text-lg font-bold text-center text-indigo-800">
                Lançamentos Futuros
              </p>
              <p className="text-xl mb-2 font-bold text-center text-indigo-800">
                {new Date(new Date().setMonth(new Date().getMonth()))
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

                      </tr>
                    </thead>
                    <tbody>
                      {future.map((debit) => (
                        <tr
                          key={debit.id}
                          className={"border-t border-gray-400 bg-gray-200"}
                        >
                          <td className="px-4 py-2 font-medium  uppercase max-w-xs break-words">
                            <div className='flex justify-between'>

                           <label>  {debit.description}</label>
                           <label>{debit.installments
                              ? ` ${debit.current}/${debit.installments}`
                              : ""}</label>
                           <label>{debit.credit_card && (
  cards.find((c:any) => c.name === debit.credit_card)?.image && (
    <img
      src={cards.find((c:any) => c.name === debit.credit_card)!.image}
      alt={debit.credit_card}
      className="h-[30px] bg-white w-auto rounded ring ring-yellow-500"
    />
  )
)}</label>                            
                            </div>

                          </td>
                          <td className="px-4 py-2 font-medium  uppercase max-w-xs break-words">
                            <div className='flex justify-between'>

                            <p className={"font-bold "}>
                              {debit.value.toLocaleString("pt-br", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                                                    <AiFillDelete
                                                      className="text-red-800 h-[20px] w-[20px] cursor-pointer"
                                                      onClick={() =>{setLoading(false); handleDelete(debit.id)}}
                                                    />
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ul>

              <button
                onClick={() =>{setLoading(false); setFuture([])}}
                className="bg-yellow-600 mt-4 p-2 text-white font-bold hover:bg-yellow-800 rounded "
              >
                FECHAR
              </button>
            </div>
          </Background>
        )}
  {future.length == 0 && (
    <>
    
      <p className='text-lg text-indigo-800 font-bold'>{type == 'current'? "ADICIONAR DÉBITO" : type === 'future' ? "LANÇAMENTO FUTURO" : ""}</p>
      {type == 'future' &&(
        <>
        <button
        disabled={loading}
        onClick={()=>{
          setLoading(true)
          fetchFutureDebits()}
          } className='p-2 rounded bg-yellow-500 w-full text-blue-800 font-bold'>{loading ? "CARREGANDO..." : 'VISUALIZAR LANÇAMENTOS FUTUROS'}</button>
        </>
      )}
    <form onSubmit={handleSubmit} className="space-y-4">
      {cards.length && type === 'future' && (
            <div className="flex p-4 border-2 border-gray-300  rounded gap-3 flex-col">
              <p className='text-center font-bold'>SELECIONE O CARTÃO</p>
            {cards.map((card:any) => (
              <label
                key={card.id}
                className={`cursor-pointer border rounded-2xl p-2 shadow-sm flex items-center gap-3 ${
                  selectCard === card.name ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="creditCard"
                  value={card.name}
                  checked={selectCard === card.name}
                  onChange={() => handleChange(card.name)}
                  className="hidden"
                />
                <img src={card.image} alt={card.name} className="w-10 h-10 object-contain" />
                <span className="text-sm font-medium">{card.name}</span>
              </label>
            ))}
          </div>
      )}
      <div>
        <label className="block text-sm font-medium">Descrição</label>
        <input
          type="text"
          placeholder='Digite aqui'
          className="w-full border rounded px-3 py-2 mt-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      {type !== 'future' && (

      <div>
        <label className="block text-sm font-medium">Vencimento (somente o dia)</label>
        <input
          type="number"
          placeholder='Digite o dia'
          min="1"
          max= "31"
          className="w-full border rounded px-3 py-2 mt-1"
          value={date}
          onChange={(e) => setDate(e.target.value)}

        />
      </div>
      )}

      <div>
        <label className="block text-sm font-medium">Valor da Parcela (R$)</label>
        <input
          type="text"
          placeholder='Digite o valor'
          className="w-full border rounded px-3 py-2 mt-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Total de Parcelas</label>
        <input
          type="number"
          placeholder='Campo opcional'
          min="1"
          className="w-full border rounded px-3 py-2 mt-1"
          value={installments}
          onChange={(e) => setInstallments(e.target.value)}
        />
      </div>
{type !== 'future' && (

      <div>
        <label className="block text-sm font-medium">Parcela Atual</label>
        <input
          type="number"
          placeholder='Campo opcional'
          min="1"
          className="w-full border rounded px-3 py-2 mt-1"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
)}

{!installments.length && type !== 'future' && (

      <div className="flex items-center">
        <input
          id="recurring"
          type="checkbox"
          className="mr-2"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
        />
        <label htmlFor="recurring" className="text-sm">Recorrente</label>
      </div>
)}
<div className='justify-between w-full flex'>

{type === 'future' && selectCard ? (
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </button>

):type === 'current' ? (
  <button
  type="submit"
  disabled={loading}
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
>
  {loading ? 'Salvando...' : 'Salvar'}
</button>
) : (  <button
  type="submit"
  disabled={true}
  className="bg-gray-600 text-white px-4 py-2 rounded  transition"
>
  {'Salvar'}
</button>)}
      <button
        onClick={()=>{setAddDebit(null)}}

        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        { 'Fechar'}
      </button>
</div>
    </form>
    </>
  )}
  </div>
  </>
  );
}
