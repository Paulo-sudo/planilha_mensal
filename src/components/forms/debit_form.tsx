import { useState } from 'react';
import { supabase } from '../../supabase_client';

interface Props {
  monthId: string;
  setAddDebit: (value: boolean) => void;
  onSuccess?: () => void;
}

export default function DebitForm({ monthId, setAddDebit, onSuccess }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [current, setCurrent] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [date, setDate]=useState('')
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedInstallments = installments ? parseInt(installments, 10) : null;
    console.log({
      description,
      value: parsedAmount,
      installments: parsedInstallments || null,
      current: current || null,
      due_date: date || null,
      recurring,
      month_id: monthId,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    }
  );
    

    const { error } = await supabase.from('debits').insert({
      description,
      value: parsedAmount,
      installments: parsedInstallments || null,
      current: current || null,
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
      setCurrent('')
      setDate('')
      setRecurring(false);

    }
  if (onSuccess) {
    onSuccess(); // 👈 chama a função que recarrega a lista
  }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-4 space-y-4 w-full max-w-md mx-auto mt-20">
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

      <div>
        <label className="block text-sm font-medium">Valor (R$)</label>
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

{!installments.length && (

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

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
      <button
        onClick={()=>{setAddDebit(false)}}

        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        { 'Fechar'}
      </button>
</div>
    </form>
  );
}
