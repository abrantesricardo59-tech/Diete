# Diete Coaching — app mobile

Application mobile (iOS/Android) pour le suivi de coaching : les coachés
suivent leur alimentation, leur poids et leurs séances d'entraînement, et
échangent avec leur coach en messagerie. Le coach a une vue d'ensemble de
tous ses coachés et peut leur créer des programmes.

## Stack technique

- **React Native + Expo (SDK 57)**, TypeScript, [Expo Router](https://docs.expo.dev/router/introduction/) pour la navigation par fichiers.
- **Supabase** : authentification par email/mot de passe, base Postgres (avec Row Level Security), messagerie en temps réel (Realtime), à terme le stockage des photos de progression.
- **Open Food Facts** : recherche d'aliments dans une base collaborative gratuite. Chaque produit sélectionné est "forké" dans une table `foods` propre à l'app pour que coach et coaché puissent le modifier (portions, valeurs nutritionnelles corrigées, produits maison) sans dépendre d'un compte Open Food Facts.

## Démarrer en local

```bash
npm install
cp .env.example .env   # puis renseignez vos clés Supabase (Settings > API)
npm run start           # ouvre Expo Dev Tools, scannez le QR code avec l'app Expo Go
```

Comme le projet utilise des modules natifs (expo-router, reanimated,
gesture-handler, image-picker...), l'app **Expo Go** suffit pour développer
tant qu'aucun module natif supplémentaire n'est ajouté. Pour une build de
production, utilisez [EAS Build](https://docs.expo.dev/build/introduction/).

## Base de données Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL du projet, exécutez dans l'ordre :
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
3. Activez Realtime sur la table `messages` (Database > Replication) pour que la messagerie soit instantanée.
4. Récupérez `Project URL` et `anon public key` dans Settings > API et mettez-les dans `.env`.

### Modèle de données (résumé)

- `profiles` : un coach ou un coaché (`role`), avec `coach_id` reliant un coaché à son coach.
- `foods` / `food_logs` : catalogue d'aliments éditable + journal alimentaire par repas.
- `weight_logs` : suivi du poids.
- `training_programs` / `program_exercises` : programmes créés par le coach pour un coaché.
- `workout_logs` / `workout_set_logs` : séances réalisées par le coaché.
- `conversations` / `messages` : messagerie coach ↔ coaché.

Toutes les tables sont protégées par des policies RLS : un coaché ne voit
que ses propres données (et celles de son coach), un coach ne voit que les
données de ses coachés (`supabase/migrations/0002_rls_policies.sql`).

### Rejoindre le suivi d'un coach

Il n'y a pas d'invitation par email pour l'instant : un coach partage son
**code coach** (visible dans son onglet Profil, c'est simplement son
identifiant) et le coaché le saisit à l'inscription pour être rattaché à
lui.

## Structure du projet

```
src/
  app/            écrans (Expo Router : chaque fichier = une route)
    (auth)/       connexion / inscription
    (coach)/      tableau de bord coach (liste des coachés, fiche coaché, messages, profil)
    (coache)/     espace coaché (journal alimentaire, poids, entraînement, messages, profil)
    chat/         écran de conversation partagé entre coach et coaché
    food-log/     recherche + ajout d'un aliment au journal (modal)
  components/     composants UI réutilisables
  lib/            client Supabase, contexte d'authentification
  services/       accès aux données (Supabase + Open Food Facts)
  types/          types du modèle de données
supabase/
  migrations/     schéma SQL + policies RLS
```

## Ce qui reste à faire

- Photos de progression (upload vers Supabase Storage).
- Notifications push (rappel de pesée, nouveau message) via `expo-notifications` + Edge Functions Supabase.
- Graphique d'évolution du poids (actuellement affiché en liste).
- Un vrai flux d'invitation (email) plutôt qu'un code à partager.
