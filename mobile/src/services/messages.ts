import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types/database';

export async function getOrCreateConversation(coachId: string, coacheId: string): Promise<Conversation> {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('coach_id', coachId)
    .eq('coache_id', coacheId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ coach_id: coachId, coache_id: coacheId })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function getConversationsForProfile(profileId: string, role: 'coach' | 'coache'): Promise<Conversation[]> {
  const column = role === 'coach' ? 'coach_id' : 'coache_id';
  const otherRelation = role === 'coach' ? 'coache:profiles!conversations_coache_id_fkey(*)' : 'coach:profiles!conversations_coach_id_fkey(*)';
  const { data, error } = await supabase
    .from('conversations')
    .select(`*, ${otherRelation}`)
    .eq(column, profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    other_profile: role === 'coach' ? row.coache : row.coach,
  })) as Conversation[];
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: params.conversationId, sender_id: params.senderId, body: params.body })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

export function subscribeToConversation(conversationId: string, onMessage: (message: Message) => void) {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
