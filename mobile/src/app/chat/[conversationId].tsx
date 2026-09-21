import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { getMessages, sendMessage, subscribeToConversation } from '@/services/messages';
import type { Message } from '@/types/database';

export default function ChatScreen() {
  const { profile } = useAuth();
  const { conversationId, title } = useLocalSearchParams<{ conversationId: string; title?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId) return;
    getMessages(conversationId).then(setMessages);
    const unsubscribe = subscribeToConversation(conversationId, (message) => {
      setMessages((prev) => [...prev, message]);
    });
    return unsubscribe;
  }, [conversationId]);

  async function handleSend() {
    if (!profile || !conversationId || !draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    await sendMessage({ conversationId, senderId: profile.id, body });
  }

  return (
    <>
      <Stack.Screen options={{ title: title || 'Messages' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <Screen style={{ paddingBottom: 12 }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.sender_id === profile?.id;
              return (
                <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginVertical: 4 }}>
                  <View
                    style={{
                      backgroundColor: mine ? '#2E7D6B' : '#E7F1EE',
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      maxWidth: '80%',
                    }}
                  >
                    <Text style={{ color: mine ? '#fff' : '#1B2320' }}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Écrire un message..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#D8E2DE',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: '#fff',
              }}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable
              onPress={handleSend}
              style={{ backgroundColor: '#2E7D6B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Envoyer</Text>
            </Pressable>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </>
  );
}
