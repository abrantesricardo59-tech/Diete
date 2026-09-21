import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { formatPrice, getPricingPlans, INTERVAL_LABELS } from '@/services/pricing';
import type { PricingPlan } from '@/types/database';

export default function CoacheProfileScreen() {
  const { profile, signOut } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  const load = useCallback(async () => {
    if (!profile?.coach_id) return;
    setPlans(await getPricingPlans(profile.coach_id));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <ScrollView>
      <Screen>
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1B2320' }}>{profile?.full_name}</Text>
          <Text style={{ color: '#8B9A94' }}>Coaché·e</Text>
        </Card>

        {plans.length > 0 && (
          <>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginBottom: 8 }}>Formules de mon coach</Text>
            {plans.map((plan) => (
              <Card key={plan.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', color: '#1B2320' }}>{plan.name}</Text>
                  <Text style={{ color: '#2E7D6B', fontWeight: '700' }}>
                    {formatPrice(plan.price_cents, plan.currency)} {INTERVAL_LABELS[plan.interval]}
                  </Text>
                </View>
                {plan.description ? <Text style={{ color: '#8B9A94', marginTop: 4 }}>{plan.description}</Text> : null}
              </Card>
            ))}
          </>
        )}

        <Button title="Se déconnecter" variant="danger" onPress={handleSignOut} />
      </Screen>
    </ScrollView>
  );
}
