import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { getConversationsForProfile } from '@/services/messages';
import type { Conversation } from '@/types/database';

export default function CoachMessagesScreen() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await getConversationsForProfile(profile.id, 'coach');
    setConversations(data);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/chat/[conversationId]',
                params: { conversationId: item.id, title: item.other_profile?.full_name ?? '' },
              })
            }
          >
            <Card>
              <Text style={{ fontWeight: '700', color: '#1B2320' }}>{item.other_profile?.full_name}</Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color: '#8B9A94' }}>Aucune conversation pour le moment.</Text>}
      />
    </Screen>
  );
}
