import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { deleteFoodLog, getFoodLogsForDay } from '@/services/foods';
import type { FoodLog, Meal } from '@/types/database';

const MEALS: { key: Meal; label: string }[] = [
  { key: 'breakfast', label: 'Petit-déjeuner' },
  { key: 'lunch', label: 'Déjeuner' },
  { key: 'dinner', label: 'Dîner' },
  { key: 'snack', label: 'Collation' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalScreen() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const date = todayIso();

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await getFoodLogsForDay(profile.id, date);
    setLogs(data);
    setLoading(false);
  }, [profile, date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    await deleteFoodLog(id);
    load();
  }

  const totalCalories = logs.reduce((sum, log) => {
    const kcal100 = log.food?.calories_per_100g ?? 0;
    return sum + (kcal100 * log.quantity_g) / 100;
  }, 0);

  return (
    <Screen>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Card style={{ backgroundColor: '#2E7D6B' }}>
            <Text style={{ color: '#E7F1EE', fontSize: 13, fontWeight: '600' }}>Aujourd&apos;hui</Text>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{Math.round(totalCalories)} kcal</Text>
          </Card>
        }
        data={MEALS}
        keyExtractor={(item) => item.key}
        renderItem={({ item: meal }) => {
          const mealLogs = logs.filter((log) => log.meal === meal.key);
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320' }}>{meal.label}</Text>
                <Text
                  onPress={() => router.push({ pathname: '/food-log/search', params: { meal: meal.key } })}
                  style={{ color: '#2E7D6B', fontWeight: '700' }}
                >
                  + Ajouter
                </Text>
              </View>
              {mealLogs.length === 0 ? (
                <Text style={{ color: '#8B9A94' }}>Aucun aliment ajouté.</Text>
              ) : (
                mealLogs.map((log) => (
                  <View
                    key={log.id}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}
                  >
                    <Text style={{ color: '#3D4A45', flex: 1 }}>
                      {log.food?.name} — {log.quantity_g}g
                    </Text>
                    <Text style={{ color: '#8B9A94', marginRight: 10 }}>
                      {Math.round(((log.food?.calories_per_100g ?? 0) * log.quantity_g) / 100)} kcal
                    </Text>
                    <Text onPress={() => handleDelete(log.id)} style={{ color: '#C0453A' }}>
                      Suppr.
                    </Text>
                  </View>
                ))
              )}
            </Card>
          );
        }}
        ListEmptyComponent={!loading ? <Text>Aucun repas configuré.</Text> : null}
      />
    </Screen>
  );
}
