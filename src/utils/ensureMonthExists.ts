import { supabase } from '../supabase_client';
import { replicateDebitsIfNeeded } from './replicateDebits';

export async function ensureMonthExists(): Promise<any> {
  const now = new Date();
  const monthName = now.toLocaleString('pt-BR', { month: 'long' }).toLowerCase(); // evitar inconsistências de caixa
  const year = now.getFullYear();

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData?.user?.id) {
    console.error('Erro ao obter usuário:', userError);
    return;
  }

  const userId = userData.user.id;

  const {
    data: existingMonth,
    error: fetchError,
  } = await supabase
    .from('month')
    .select('*')
    .eq('user_id', userId)
    .eq('name', monthName)
    .eq('year', year)
    .maybeSingle();

  if (fetchError) {
    console.error('Erro ao verificar mês existente:', fetchError);
    return ;
  }

  if (!existingMonth) {
    const { data: newMonth, error: insertError } = await supabase.from('month').insert({
      user_id: userId,
      name: monthName,
      year,
    }).select().single(); // precisa do .select() pra retornar o ID do mês criado

    if (insertError) {
      console.error('Erro ao criar mês:', insertError);
    } else if (newMonth) {
      // Buscar o mês anterior existente
      const { data: previousMonth } = await supabase
        .from('month')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .neq('id', newMonth.id) // evita pegar o recém-criado
        .limit(1)
        .single();

      if (previousMonth) {
        await replicateDebitsIfNeeded(previousMonth.id, newMonth.id);
      } else {
        console.warn('Nenhum mês anterior encontrado para replicar débitos.');
      }

      return newMonth;
    }
  } else {

      return existingMonth
  }
}
