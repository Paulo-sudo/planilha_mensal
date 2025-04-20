import { supabase } from '../supabase_client';

export async function replicateDebitsIfNeeded(previousMonthId: string, newMonthId: string) {
  // Buscar débitos atuais e do novo mês
  const { data: allDebits, error } = await supabase
    .from('debits')
    .select('*')
    .or(`month_id.eq.${previousMonthId},month_id.eq.${newMonthId}`);

  if (error || !allDebits) return;

  // Buscar future_debits do mês anterior
  const { data: futureDebits, error: futureError } = await supabase
    .from('future_debits')
    .select('*')
    .eq('month_id', previousMonthId);

  if (futureError) {
    console.error("Erro ao buscar future_debits:", futureError);
    return;
  }

  // Agrupamento para replicação de recorrentes/parcelados
  const grouped: Record<string, any[]> = {};
  allDebits.forEach((debit) => {
    const key = `${debit.description}-${debit.value}-${debit.installments}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(debit);
  });

  const recurringOrInstallments = Object.values(grouped).flatMap((debits) => {
    const [sample] = debits;
    if (!sample.installments && !sample.recurring) return [];

    const highestCurrent = Math.max(...debits.map((d) => d.current || 0));

    if (sample.recurring || (sample.installments && highestCurrent < sample.installments)) {
      return [{
        ...sample,
        current: sample.installments ? highestCurrent + 1 : null,
        month_id: newMonthId,
        created_at: new Date().toISOString(),
      }];
    }

    return [];
  });

  // Migrar future_debits com current e installments preservados
  const mappedFutureDebits = (futureDebits || []).map((f) => ({
    ...f,
    paid: false,
    created_at: new Date().toISOString(),
    month_id: newMonthId,
  }));

  // Remover o campo `id` antes de inserir
  const sanitized = [...recurringOrInstallments, ...mappedFutureDebits].map(({ id, ...rest }) => rest);

  if (sanitized.length) {
    await supabase.from('debits').insert(sanitized);
  }
}
