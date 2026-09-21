import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Button, Card, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { addWeightLog, deleteWeightLog, getWeightLogs } from '@/services/weight';
import type { WeightLog } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function WeightScreen() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await getWeightLogs(profile.id);
    setLogs(data.slice().reverse());
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAdd() {
    if (!profile) return;
    const weightKg = Number(weight.replace(',', '.'));
    if (!weightKg || weightKg <= 0) {
      setError('Indiquez un poids valide en kg.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addWeightLog({ userId: profile.id, weightKg, loggedAt: todayIso() });
      setWeight('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le poids.");
    } finally {
      setSaving(false);
    }
  }

  const latest = logs[0]?.weight_kg;
  const previous = logs[1]?.weight_kg;
  const trend = latest != null && previous != null ? latest - previous : null;

  return (
    <Screen>
      <Card style={{ backgroundColor: '#2E7D6B' }}>
        <Text style={{ color: '#E7F1EE', fontSize: 13, fontWeight: '600' }}>Dernier poids</Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{latest != null ? `${latest} kg` : '—'}</Text>
        {trend != null && (
          <Text style={{ color: '#E7F1EE' }}>
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)} kg depuis la dernière pesée
          </Text>
        )}
      </Card>

      <Card>
        <TextField label="Nouveau poids (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="72.5" />
        <ErrorText>{error}</ErrorText>
        <Button title="Enregistrer" onPress={handleAdd} loading={saving} />
      </Card>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ color: '#3D4A45' }}>{item.logged_at}</Text>
            <Text style={{ fontWeight: '600', color: '#1B2320' }}>{item.weight_kg} kg</Text>
            <Text onPress={() => deleteWeightLog(item.id).then(load)} style={{ color: '#C0453A' }}>
              Suppr.
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#8B9A94' }}>Aucune pesée enregistrée.</Text>}
      />
    </Screen>
  );
}
