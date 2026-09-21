import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Button, Card, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { createSlot, deleteSlot, getUpcomingSessionsForCoach } from '@/services/sessions';
import type { CoachingSession } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CoachSessionsScreen() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setSessions(await getUpcomingSessionsForCoach(profile.id));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreateSlot() {
    if (!profile) return;
    setError(null);
    const startsAt = new Date(`${date}T${time}:00`);
    const durationMinutes = Number(duration);
    if (Number.isNaN(startsAt.getTime()) || !durationMinutes || durationMinutes <= 0) {
      setError('Vérifiez la date, l’heure (HH:mm) et la durée.');
      return;
    }
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);
    setSaving(true);
    try {
      await createSlot({ coachId: profile.id, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création du créneau impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Text style={{ fontWeight: '700', color: '#1B2320', marginBottom: 8 }}>Publier un créneau</Text>
        <TextField label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} placeholder="2026-09-25" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <TextField label="Heure (HH:mm)" value={time} onChangeText={setTime} placeholder="10:00" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Durée (min)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
          </View>
        </View>
        <ErrorText>{error}</ErrorText>
        <Button title="Publier ce créneau" onPress={handleCreateSlot} loading={saving} />
      </Card>

      <FlatList
        style={{ marginTop: 8 }}
        data={sessions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginBottom: 8 }}>Créneaux à venir</Text>}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '600', color: '#1B2320' }}>{formatDateTime(item.starts_at)}</Text>
              <Text style={{ color: item.status === 'booked' ? '#2E7D6B' : '#8B9A94' }}>
                {item.status === 'booked' ? `Réservé par ${item.coache?.full_name ?? 'un·e coaché·e'}` : 'Créneau libre'}
              </Text>
            </View>
            {item.status === 'open' && (
              <Text onPress={() => deleteSlot(item.id).then(load)} style={{ color: '#C0453A' }}>
                Suppr.
              </Text>
            )}
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: '#8B9A94' }}>Aucun créneau publié.</Text>}
      />
    </Screen>
  );
}
