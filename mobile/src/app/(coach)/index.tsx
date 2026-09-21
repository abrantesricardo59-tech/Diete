import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { getCoachesForCoach, getLatestWeightByCoache } from '@/services/coaching';
import type { Profile } from '@/types/database';

export default function CoachDashboardScreen() {
  const { profile } = useAuth();
  const [coaches, setCoaches] = useState<Profile[]>([]);
  const [latestWeight, setLatestWeight] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!profile) return;
    const list = await getCoachesForCoach(profile.id);
    setCoaches(list);
    const weights = await getLatestWeightByCoache(list.map((c) => c.id));
    setLatestWeight(weights);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <FlatList
        data={coaches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/(coach)/coache/[id]', params: { id: item.id, name: item.full_name } })}>
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320' }}>{item.full_name}</Text>
                <Text style={{ color: '#8B9A94' }}>
                  {latestWeight[item.id] != null ? `${latestWeight[item.id]} kg` : 'Pas de pesée récente'}
                </Text>
              </View>
              <Text style={{ color: '#2E7D6B', fontWeight: '700' }}>Voir →</Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#8B9A94' }}>
            Aucun coaché pour le moment. Partagez votre code coach (dans votre profil) pour qu&apos;ils rejoignent votre suivi.
          </Text>
        }
      />
    </Screen>
  );
}
