import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';

import { Button, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import type { Role } from '@/types/database';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [role, setRole] = useState<Role>('coache');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachInviteCode, setCoachInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError('Renseignez votre nom, un email valide et un mot de passe de 6 caractères minimum.');
      return;
    }
    if (role === 'coache' && !coachInviteCode.trim()) {
      setError('Demandez le code coach à votre coach pour rejoindre son suivi.');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        coachInviteCode: coachInviteCode.trim(),
      });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création du compte impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Screen style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 4, color: '#1B2320' }}>Créer un compte</Text>
          <Text style={{ fontSize: 15, color: '#5C6864', marginBottom: 20 }}>
            Êtes-vous coach ou coaché·e ?
          </Text>

          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleOption, role === 'coache' && styles.roleOptionActive]}
              onPress={() => setRole('coache')}
            >
              <Text style={[styles.roleLabel, role === 'coache' && styles.roleLabelActive]}>Je suis coaché·e</Text>
            </Pressable>
            <Pressable
              style={[styles.roleOption, role === 'coach' && styles.roleOptionActive]}
              onPress={() => setRole('coach')}
            >
              <Text style={[styles.roleLabel, role === 'coach' && styles.roleLabelActive]}>Je suis coach</Text>
            </Pressable>
          </View>

          <TextField label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Jean Dupont" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="vous@exemple.com"
          />
          <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

          {role === 'coache' && (
            <TextField
              label="Code coach"
              value={coachInviteCode}
              onChangeText={setCoachInviteCode}
              placeholder="Fourni par votre coach"
              autoCapitalize="none"
            />
          )}

          <ErrorText>{error}</ErrorText>

          <Button title="Créer mon compte" onPress={handleSubmit} loading={loading} />

          <Link href="/(auth)/login" style={{ marginTop: 20, textAlign: 'center', color: '#2E7D6B', fontWeight: '600' }}>
            Déjà un compte ? Se connecter
          </Link>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E2DE',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#2E7D6B',
    borderColor: '#2E7D6B',
  },
  roleLabel: {
    fontWeight: '600',
    color: '#3D4A45',
  },
  roleLabelActive: {
    color: '#fff',
  },
});
