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
    });

    if (insertError) {
      console.error('Erro ao criar mês:', insertError);
    } else if (newMonth) {
        const monthId = (newMonth as any).id;
        await replicateDebitsIfNeeded(userId, monthId); // só chama se tiver mesmo um mês criado

      } else {
        console.warn('Mês criado, mas não retornou dados.'); // fallback de segurança
      }
      return newMonth;
  } else {

      return existingMonth
  }
}
