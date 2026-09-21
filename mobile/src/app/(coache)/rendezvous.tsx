import { useCallback, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { bookSlot, cancelBooking, getBookableSlotsForCoache, getMyBookings } from '@/services/sessions';
import type { CoachingSession } from '@/types/database';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CoacheSessionsScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<CoachingSession[]>([]);
  const [slots, setSlots] = useState<CoachingSession[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.coach_id) return;
    const [bookingsData, slotsData] = await Promise.all([
      getMyBookings(profile.id),
      getBookableSlotsForCoache(profile.coach_id),
    ]);
    setBookings(bookingsData);
    setSlots(slotsData);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleBook(sessionId: string) {
    if (!profile) return;
    setBookingId(sessionId);
    setError(null);
    try {
      await bookSlot(sessionId, profile.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réservation impossible.');
    } finally {
      setBookingId(null);
    }
  }

  if (!profile?.coach_id) {
    return (
      <Screen>
        <Text style={{ color: '#8B9A94' }}>Aucun coach associé à votre compte pour le moment.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginBottom: 8 }}>Mes rendez-vous</Text>
      {bookings.length === 0 ? (
        <Text style={{ color: '#8B9A94', marginBottom: 16 }}>Aucun rendez-vous réservé.</Text>
      ) : (
        bookings.map((booking) => (
          <Card key={booking.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#1B2320' }}>{formatDateTime(booking.starts_at)}</Text>
            <Text onPress={() => cancelBooking(booking.id).then(load)} style={{ color: '#C0453A' }}>
              Annuler
            </Text>
          </Card>
        ))
      )}

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginVertical: 8 }}>Créneaux disponibles</Text>}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#1B2320' }}>{formatDateTime(item.starts_at)}</Text>
            <Text onPress={() => handleBook(item.id)} style={{ color: bookingId === item.id ? '#8B9A94' : '#2E7D6B', fontWeight: '700' }}>
              {bookingId === item.id ? '...' : 'Réserver'}
            </Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: '#8B9A94' }}>Aucun créneau disponible pour le moment.</Text>}
        ListFooterComponent={error ? <Text style={{ color: '#C0453A', marginTop: 8 }}>{error}</Text> : null}
      />
    </Screen>
  );
}
