import { supabase } from '../supabase_client';

interface NewDebit {
  description: string;
  value: number;
  installments: number;
  current: number;
  recurring: boolean;
  month_id: string;
}

export async function insertDebit(debit: NewDebit) {
  const { data, error } = await supabase.from('debits').insert(debit);

  if (error) {
    console.error('Erro ao inserir dívida:', error.message);
  }

  return data;
}
