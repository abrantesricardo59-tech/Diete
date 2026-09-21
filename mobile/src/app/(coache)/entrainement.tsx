import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { getProgramsForCoache, getWorkoutHistory, logWorkout } from '@/services/training';
import type { TrainingProgram, WorkoutLog } from '@/types/database';

export default function TrainingScreen() {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [programsData, historyData] = await Promise.all([
      getProgramsForCoache(profile.id),
      getWorkoutHistory(profile.id),
    ]);
    setPrograms(programsData);
    setHistory(historyData);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleMarkDone(program: TrainingProgram) {
    if (!profile) return;
    setLoggingId(program.id);
    try {
      await logWorkout({
        coacheId: profile.id,
        programId: program.id,
        sets: (program.exercises ?? []).map((exercise, index) => ({
          exercise_name: exercise.name,
          set_index: index,
          reps: null,
          weight_kg: null,
        })),
      });
      await load();
    } finally {
      setLoggingId(null);
    }
  }

  return (
    <Screen>
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#1B2320' }}>Programmes assignés</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320' }}>{item.name}</Text>
            {item.description ? <Text style={{ color: '#5C6864', marginBottom: 6 }}>{item.description}</Text> : null}
            {(item.exercises ?? [])
              .slice()
              .sort((a, b) => a.order_index - b.order_index)
              .map((exercise) => (
                <Text key={exercise.id} style={{ color: '#3D4A45', paddingVertical: 2 }}>
                  • {exercise.name} — {exercise.sets} x {exercise.reps}
                  {exercise.rest_seconds ? ` (repos ${exercise.rest_seconds}s)` : ''}
                </Text>
              ))}
            <View style={{ height: 10 }} />
            <Button
              title="Marquer la séance comme faite"
              onPress={() => handleMarkDone(item)}
              loading={loggingId === item.id}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: '#8B9A94' }}>Aucun programme assigné pour le moment.</Text>}
        ListFooterComponent={
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#1B2320' }}>Historique</Text>
            {history.length === 0 ? (
              <Text style={{ color: '#8B9A94' }}>Aucune séance enregistrée.</Text>
            ) : (
              history.map((log) => (
                <Card key={log.id}>
                  <Text style={{ color: '#3D4A45' }}>{new Date(log.performed_at).toLocaleDateString('fr-FR')}</Text>
                  <Text style={{ color: '#8B9A94' }}>{log.sets?.length ?? 0} exercices</Text>
                </Card>
              ))
            )}
          </View>
        }
      />
    </Screen>
  );
}
