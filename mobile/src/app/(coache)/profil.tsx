import { Text } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';

export default function CoacheProfileScreen() {
  const { profile, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <Screen>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1B2320' }}>{profile?.full_name}</Text>
        <Text style={{ color: '#8B9A94' }}>Coaché·e</Text>
      </Card>
      <Button title="Se déconnecter" variant="danger" onPress={handleSignOut} />
    </Screen>
  );
}
