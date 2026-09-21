import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';

export default function CoachProfileScreen() {
  const { profile, signOut } = useAuth();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!profile) return;
    await Clipboard.setStringAsync(profile.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
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

      <Button title="Se déconnecter" variant="danger" onPress={handleSignOut} />
    </Screen>
  );
}
