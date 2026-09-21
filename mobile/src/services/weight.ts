import { supabase } from '@/lib/supabase';
import type { WeightLog } from '@/types/database';

export async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return data as WeightLog[];
}

export async function addWeightLog(params: {
  userId: string;
  weightKg: number;
  loggedAt: string;
  note?: string;
}): Promise<WeightLog> {
  const { data, error } = await supabase
    .from('weight_logs')
    .insert({
      user_id: params.userId,
      weight_kg: params.weightKg,
      logged_at: params.loggedAt,
      note: params.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WeightLog;
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').delete().eq('id', id);
  if (error) throw error;
}
