import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Link, router } from 'expo-router';

import { Button, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';

export default function LoginScreen() {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPassword(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 4, color: '#1B2320' }}>Diete Coaching</Text>
          <Text style={{ fontSize: 15, color: '#5C6864', marginBottom: 28 }}>
            Connectez-vous pour suivre votre coaching.
          </Text>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="vous@exemple.com"
          />
          <TextField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <ErrorText>{error}</ErrorText>

          <Button title="Se connecter" onPress={handleSubmit} loading={loading} />

          <Link href="/(auth)/signup" style={{ marginTop: 20, textAlign: 'center', color: '#2E7D6B', fontWeight: '600' }}>
            Pas encore de compte ? Créer un compte
          </Link>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
