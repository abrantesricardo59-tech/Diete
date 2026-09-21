import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export async function getCoachesForCoach(coachId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('coach_id', coachId)
    .order('full_name');
  if (error) throw error;
  return data as Profile[];
}

export async function getLatestWeightByCoache(coacheIds: string[]) {
  if (coacheIds.length === 0) return {} as Record<string, number>;
  const { data, error } = await supabase
    .from('weight_logs')
    .select('user_id, weight_kg, logged_at')
    .in('user_id', coacheIds)
    .order('logged_at', { ascending: false });
  if (error) throw error;

  const latest: Record<string, number> = {};
  for (const row of data as { user_id: string; weight_kg: number }[]) {
    if (!(row.user_id in latest)) {
      latest[row.user_id] = row.weight_kg;
    }
  }
  return latest;
}
