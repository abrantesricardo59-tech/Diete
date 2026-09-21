import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Button, Card, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { getOrCreateConversation } from '@/services/messages';
import { createProgram, getProgramsCreatedByCoach } from '@/services/training';
import { getWeightLogs } from '@/services/weight';
import type { ProgramExercise, TrainingProgram, WeightLog } from '@/types/database';

type DraftExercise = Omit<ProgramExercise, 'id' | 'program_id'>;

function emptyExercise(orderIndex: number): DraftExercise {
  return { name: '', sets: 3, reps: '10', rest_seconds: 60, order_index: orderIndex, notes: null };
}

export default function CoacheDetailScreen() {
  const { profile } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [programName, setProgramName] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyExercise(0)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !profile) return;
    const [weightData, programData] = await Promise.all([
      getWeightLogs(id),
      getProgramsCreatedByCoach(profile.id).then((list) => list.filter((p) => p.coache_id === id)),
    ]);
    setWeights(weightData.slice().reverse());
    setPrograms(programData);
  }, [id, profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function updateExercise(index: number, patch: Partial<DraftExercise>) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)));
  }

  function addExerciseRow() {
    setExercises((prev) => [...prev, emptyExercise(prev.length)]);
  }

  function removeExerciseRow(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateProgram() {
    if (!profile || !id) return;
    if (!programName.trim() || exercises.some((e) => !e.name.trim())) {
      setError('Donnez un nom au programme et à chaque exercice.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createProgram({
        coachId: profile.id,
        coacheId: id,
        name: programName.trim(),
        exercises,
      });
      setProgramName('');
      setExercises([emptyExercise(0)]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création du programme impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function openChat() {
    if (!profile || !id) return;
    const conversation = await getOrCreateConversation(profile.id, id);
    router.push({ pathname: '/chat/[conversationId]', params: { conversationId: conversation.id, title: name } });
  }

  const latest = weights[0]?.weight_kg;

  return (
    <ScrollView>
      <Screen>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1B2320', marginBottom: 12 }}>{name}</Text>

        <Card>
          <Text style={{ color: '#8B9A94', fontSize: 13 }}>Dernier poids</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#1B2320' }}>{latest != null ? `${latest} kg` : '—'}</Text>
        </Card>

        <Button title="Envoyer un message" onPress={openChat} />
        <View style={{ height: 16 }} />

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginBottom: 8 }}>Programmes assignés</Text>
        {programs.length === 0 ? (
          <Text style={{ color: '#8B9A94', marginBottom: 12 }}>Aucun programme pour l&apos;instant.</Text>
        ) : (
          programs.map((program) => (
            <Card key={program.id}>
              <Text style={{ fontWeight: '700', color: '#1B2320' }}>{program.name}</Text>
              {(program.exercises ?? []).map((exercise) => (
                <Text key={exercise.id} style={{ color: '#3D4A45' }}>
                  • {exercise.name} — {exercise.sets} x {exercise.reps}
                </Text>
              ))}
            </Card>
          ))
        )}

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginTop: 12, marginBottom: 8 }}>
          Créer un nouveau programme
        </Text>
        <Card>
          <TextField label="Nom du programme" value={programName} onChangeText={setProgramName} placeholder="Full body semaine 1" />

          {exercises.map((exercise, index) => (
            <View key={index} style={{ marginBottom: 10, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#EEF3F1', paddingTop: index > 0 ? 10 : 0 }}>
              <TextField
                label={`Exercice ${index + 1}`}
                value={exercise.name}
                onChangeText={(text) => updateExercise(index, { name: text })}
                placeholder="Squat"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Séries"
                    value={String(exercise.sets)}
                    onChangeText={(text) => updateExercise(index, { sets: Number(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Répétitions"
                    value={exercise.reps}
                    onChangeText={(text) => updateExercise(index, { reps: text })}
                    placeholder="10-12"
                  />
                </View>
              </View>
              {exercises.length > 1 && (
                <Text onPress={() => removeExerciseRow(index)} style={{ color: '#C0453A' }}>
                  Retirer cet exercice
                </Text>
              )}
            </View>
          ))}

          <Button title="+ Ajouter un exercice" variant="secondary" onPress={addExerciseRow} />
          <View style={{ height: 10 }} />
          <ErrorText>{error}</ErrorText>
          <Button title="Créer le programme" onPress={handleCreateProgram} loading={saving} />
        </Card>
      </Screen>
    </ScrollView>
  );
}
