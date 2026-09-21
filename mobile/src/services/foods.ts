import { supabase } from '@/lib/supabase';
import type { Food, FoodLog, Meal } from '@/types/database';

export async function searchLocalFoods(query: string): Promise<Food[]> {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);
  if (error) throw error;
  return data as Food[];
}

export async function createOrUpdateFood(
  food: Partial<Food> & Pick<Food, 'name' | 'calories_per_100g' | 'protein_per_100g' | 'carbs_per_100g' | 'fat_per_100g'>
): Promise<Food> {
  const { data: userData } = await supabase.auth.getUser();
  const createdBy = userData.user?.id;
  if (!createdBy) throw new Error('Utilisateur non authentifié');

  if (food.id) {
    const { data, error } = await supabase
      .from('foods')
      .update({ ...food })
      .eq('id', food.id)
      .select()
      .single();
    if (error) throw error;
    return data as Food;
  }

  const { data, error } = await supabase
    .from('foods')
    .insert({ ...food, created_by: createdBy, is_custom: true })
    .select()
    .single();
  if (error) throw error;
  return data as Food;
}

export async function logFood(params: {
  userId: string;
  foodId: string;
  quantityG: number;
  meal: Meal;
  loggedAt?: string;
}): Promise<FoodLog> {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: params.userId,
      food_id: params.foodId,
      quantity_g: params.quantityG,
      meal: params.meal,
      logged_at: params.loggedAt ?? new Date().toISOString(),
    })
    .select('*, food:foods(*)')
    .single();
  if (error) throw error;
  return data as FoodLog;
}

export async function deleteFoodLog(id: string): Promise<void> {
  const { error } = await supabase.from('food_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function getFoodLogsForDay(userId: string, isoDate: string): Promise<FoodLog[]> {
  const start = `${isoDate}T00:00:00.000Z`;
  const end = `${isoDate}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from('food_logs')
    .select('*, food:foods(*)')
    .eq('user_id', userId)
    .gte('logged_at', start)
    .lte('logged_at', end)
    .order('logged_at');
  if (error) throw error;
  return data as FoodLog[];
}
