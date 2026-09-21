import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { getOrCreateConversation } from '@/services/messages';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export default function CoacheMessagesScreen() {
  const { profile } = useAuth();
  const [coach, setCoach] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile?.coach_id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.coach_id).single();
      setCoach(data as Profile);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!coach || !profile) {
    return (
      <Screen>
        <Text style={{ color: '#8B9A94' }}>Aucun coach associé à votre compte pour le moment.</Text>
      </Screen>
    );
  }

  async function openChat() {
    if (!coach || !profile) return;
    const conversation = await getOrCreateConversation(coach.id, profile.id);
    router.push({ pathname: '/chat/[conversationId]', params: { conversationId: conversation.id, title: coach.full_name } });
  }

  return (
    <Screen>
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320' }}>{coach.full_name}</Text>
        <Text style={{ color: '#8B9A94', marginBottom: 12 }}>Votre coach</Text>
        <Button title="Ouvrir la conversation" onPress={openChat} />
      </Card>
    </Screen>
  );
}
