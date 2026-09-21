import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Button, Card, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { createPricingPlan, deletePricingPlan, formatPrice, getPricingPlans, INTERVAL_LABELS } from '@/services/pricing';
import type { PricingInterval, PricingPlan } from '@/types/database';

const INTERVALS: PricingInterval[] = ['monthly', 'quarterly', 'yearly', 'once'];

export default function CoachProfileScreen() {
  const { profile, signOut } = useAuth();
  const [copied, setCopied] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [interval, setInterval] = useState<PricingInterval>('monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setPlans(await getPricingPlans(profile.id));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCopy() {
    if (!profile) return;
    await Clipboard.setStringAsync(profile.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/welcome');
  }

  async function handleAddPlan() {
    if (!profile) return;
    const priceValue = Number(price.replace(',', '.'));
    if (!name.trim() || Number.isNaN(priceValue) || priceValue < 0) {
      setError('Indiquez un nom et un prix valides.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createPricingPlan({
        coach_id: profile.id,
        name: name.trim(),
        price_cents: Math.round(priceValue * 100),
        currency: 'EUR',
        interval,
        description: null,
      });
      setName('');
      setPrice('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création de la formule impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView>
      <Screen>
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1B2320' }}>{profile?.full_name}</Text>
          <Text style={{ color: '#8B9A94' }}>Coach</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: '#1B2320', marginBottom: 6 }}>Code coach</Text>
          <Text style={{ color: '#5C6864', marginBottom: 10 }}>
            Partagez ce code avec vos coachés : ils le saisissent à l&apos;inscription pour rejoindre votre suivi.
          </Text>
          <Text selectable style={{ fontFamily: 'monospace', color: '#2E7D6B', marginBottom: 10 }}>
            {profile?.id}
          </Text>
          <Button title={copied ? 'Copié !' : 'Copier le code'} variant="secondary" onPress={handleCopy} />
        </Card>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B2320', marginBottom: 8 }}>Mes formules</Text>
        <Text style={{ color: '#8B9A94', marginBottom: 8 }}>
          Affichées à vos coachés comme vitrine. Le paiement se fait pour l&apos;instant en dehors de l&apos;app.
        </Text>
        {plans.map((plan) => (
          <Card key={plan.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '600', color: '#1B2320' }}>{plan.name}</Text>
              <Text style={{ color: '#8B9A94' }}>
                {formatPrice(plan.price_cents, plan.currency)} {INTERVAL_LABELS[plan.interval]}
              </Text>
            </View>
            <Text onPress={() => deletePricingPlan(plan.id).then(load)} style={{ color: '#C0453A' }}>
              Suppr.
            </Text>
          </Card>
        ))}

        <Card>
          <TextField label="Nom de la formule" value={name} onChangeText={setName} placeholder="Suivi mensuel" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField label="Prix (€)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="79" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {INTERVALS.map((option) => (
              <Text
                key={option}
                onPress={() => setInterval(option)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: interval === option ? '#2E7D6B' : '#E7F1EE',
                  color: interval === option ? '#fff' : '#2E7D6B',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {INTERVAL_LABELS[option]}
              </Text>
            ))}
          </View>
          <ErrorText>{error}</ErrorText>
          <Button title="Ajouter la formule" variant="secondary" onPress={handleAddPlan} loading={saving} />
        </Card>

        <Button title="Se déconnecter" variant="danger" onPress={handleSignOut} />
      </Screen>
    </ScrollView>
  );
}
