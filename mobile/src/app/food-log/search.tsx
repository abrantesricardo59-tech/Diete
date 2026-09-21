import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, ErrorText, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { createOrUpdateFood, logFood, searchLocalFoods } from '@/services/foods';
import { offProductToDraftFood, searchOpenFoodFacts, type OpenFoodFactsProduct } from '@/services/openFoodFacts';
import type { Food, Meal } from '@/types/database';

type Result = { source: 'local'; food: Food } | { source: 'off'; product: OpenFoodFactsProduct };

export default function FoodSearchScreen() {
  const { profile } = useAuth();
  const { meal } = useLocalSearchParams<{ meal: Meal }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [saving, setSaving] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setSelectedFood(null);
    try {
      const [local, off] = await Promise.all([
        searchLocalFoods(query.trim()),
        searchOpenFoodFacts(query.trim()).catch(() => ({ products: [] as OpenFoodFactsProduct[] })),
      ]);
      const localResults: Result[] = local.map((food) => ({ source: 'local', food }));
      const offResults: Result[] = (off.products ?? [])
        .filter((p) => p.product_name)
        .map((product) => ({ source: 'off', product }));
      setResults([...localResults, ...offResults]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recherche impossible.');
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(result: Result) {
    if (result.source === 'local') {
      setSelectedFood(result.food);
      return;
    }
    // Fork the Open Food Facts product into our own editable catalog.
    const draft = offProductToDraftFood(result.product);
    const food = await createOrUpdateFood({ ...draft, is_custom: false });
    setSelectedFood(food);
  }

  async function handleConfirmLog() {
    if (!profile || !selectedFood || !meal) return;
    const quantityG = Number(quantity.replace(',', '.'));
    if (!quantityG || quantityG <= 0) {
      setError('Indiquez une quantité valide en grammes.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await logFood({ userId: profile.id, foodId: selectedFood.id, quantityG, meal });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ajout impossible.');
    } finally {
      setSaving(false);
    }
  }

  if (selectedFood) {
    const kcal = Math.round((selectedFood.calories_per_100g * Number(quantity || '0')) / 100);
    return (
      <Screen>
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1B2320' }}>{selectedFood.name}</Text>
          {selectedFood.brand ? <Text style={{ color: '#8B9A94' }}>{selectedFood.brand}</Text> : null}
          <Text style={{ color: '#5C6864', marginTop: 4 }}>
            {selectedFood.calories_per_100g} kcal / 100g · P {selectedFood.protein_per_100g}g · G{' '}
            {selectedFood.carbs_per_100g}g · L {selectedFood.fat_per_100g}g
          </Text>
        </Card>

        <TextField label="Quantité (g)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <Text style={{ color: '#5C6864', marginBottom: 12 }}>≈ {kcal} kcal</Text>

        <ErrorText>{error}</ErrorText>

        <Button title="Ajouter au journal" onPress={handleConfirmLog} loading={saving} />
        <View style={{ height: 8 }} />
        <Button title="Choisir un autre aliment" variant="secondary" onPress={() => setSelectedFood(null)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TextField
        label="Rechercher un aliment"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        placeholder="ex : yaourt nature, poulet, riz..."
        returnKeyType="search"
      />
      <Button title="Rechercher" onPress={handleSearch} loading={searching} />
      <ErrorText>{error}</ErrorText>

      <FlatList
        style={{ marginTop: 12 }}
        data={results}
        keyExtractor={(item, index) => (item.source === 'local' ? item.food.id : item.product.code) + index}
        renderItem={({ item }) => {
          const name = item.source === 'local' ? item.food.name : item.product.product_name;
          const brand = item.source === 'local' ? item.food.brand : item.product.brands;
          const image = item.source === 'local' ? item.food.image_url : item.product.image_front_small_url;
          return (
            <Pressable onPress={() => handleSelect(item)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {image ? (
                  <Image source={{ uri: image }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#E7F1EE' }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: '#1B2320' }}>{name}</Text>
                  {brand ? <Text style={{ color: '#8B9A94', fontSize: 12 }}>{brand}</Text> : null}
                </View>
                {item.source === 'local' ? (
                  <Text style={{ fontSize: 11, color: '#2E7D6B', fontWeight: '700' }}>MON CATALOGUE</Text>
                ) : null}
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={searching ? <ActivityIndicator /> : null}
      />
    </Screen>
  );
}
