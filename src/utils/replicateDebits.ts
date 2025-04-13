import { supabase } from '../supabase_client';

export async function replicateDebitsIfNeeded(previousMonthId: string, newMonthId: string) {
  const { data: allDebits, error } = await supabase
    .from('debits')
    .select('*')
    .or(`month_id.eq.${previousMonthId},month_id.eq.${newMonthId}`);

  if (error || !allDebits) return;

  // Agrupar por dívidas com mesmo identificador (ex: description, ou use um campo unique se quiser)
  const grouped: Record<string, any[]> = {};
  allDebits.forEach((debit) => {
    const key = `${debit.description}-${debit.value}-${debit.installments}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(debit);
  });

  const newDebits = Object.values(grouped).flatMap((debits) => {
    const [sample] = debits;
    if (!sample.installments && !sample.recurring) return [];

    const highestCurrent = Math.max(...debits.map((d) => d.current || 0));

    if (sample.recurring || (sample.installments && highestCurrent < sample.installments)) {
      return [{
        ...sample,
        current: highestCurrent + 1,
        month_id: newMonthId,
        created_at: new Date().toISOString(),
      }];
    }

    return [];
  });

  const sanitized = newDebits.map(({ id, ...rest }) => rest);
  await supabase.from('debits').insert(sanitized);
}

  