import { supabase } from '@/lib/supabase';
import type { CoachingSession } from '@/types/database';

export async function createSlot(params: { coachId: string; startsAt: string; endsAt: string; notes?: string }): Promise<CoachingSession> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ coach_id: params.coachId, starts_at: params.startsAt, ends_at: params.endsAt, notes: params.notes ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as CoachingSession;
}

export async function getUpcomingSessionsForCoach(coachId: string): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, coache:profiles!sessions_coache_id_fkey(*)')
    .eq('coach_id', coachId)
    .neq('status', 'cancelled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw error;
  return data as CoachingSession[];
}

export async function getBookableSlotsForCoache(coachId: string): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('coach_id', coachId)
    .eq('status', 'open')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw error;
  return data as CoachingSession[];
}

export async function getMyBookings(coacheId: string): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('coache_id', coacheId)
    .eq('status', 'booked')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw error;
  return data as CoachingSession[];
}

export async function bookSlot(sessionId: string, coacheId: string): Promise<CoachingSession> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ coache_id: coacheId, status: 'booked' })
    .eq('id', sessionId)
    .eq('status', 'open')
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Ce créneau vient d’être réservé par quelqu’un d’autre.');
  return data as CoachingSession;
}

export async function cancelBooking(sessionId: string): Promise<void> {
  const { error } = await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', sessionId);
  if (error) throw error;
}

export async function deleteSlot(sessionId: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) throw error;
}
