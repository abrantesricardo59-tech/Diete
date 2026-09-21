import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'restaurant-outline', label: 'Journal alimentaire avec recherche de produits' },
  { icon: 'trending-up-outline', label: 'Suivi du poids et de la progression' },
  { icon: 'barbell-outline', label: "Programmes d'entraînement personnalisés" },
  { icon: 'calendar-outline', label: 'Prise de rendez-vous avec votre coach' },
  { icon: 'chatbubble-outline', label: 'Messagerie directe avec votre coach' },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Ionicons name="flame" size={32} color={colors.surface} />
        </View>
        <Text style={styles.title}>Diete Coaching</Text>
        <Text style={styles.subtitle}>Le suivi de votre coaching, tout simplement, dans votre poche.</Text>
      </View>

      <View style={styles.featureList}>
        {FEATURES.map((feature) => (
          <View key={feature.label} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button title="Créer un compte" onPress={() => router.push('/(auth)/signup')} />
        <View style={{ height: spacing.sm }} />
        <Button title="J'ai déjà un compte" variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  actions: {
    marginBottom: spacing.md,
  },
});
