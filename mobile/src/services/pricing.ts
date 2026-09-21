import { supabase } from '@/lib/supabase';
import type { PricingPlan } from '@/types/database';

export async function getPricingPlans(coachId: string): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('coach_id', coachId)
    .order('price_cents');
  if (error) throw error;
  return data as PricingPlan[];
}

export async function createPricingPlan(plan: Omit<PricingPlan, 'id' | 'created_at'>): Promise<PricingPlan> {
  const { data, error } = await supabase.from('pricing_plans').insert(plan).select().single();
  if (error) throw error;
  return data as PricingPlan;
}

export async function deletePricingPlan(id: string): Promise<void> {
  const { error } = await supabase.from('pricing_plans').delete().eq('id', id);
  if (error) throw error;
}

export function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(priceCents / 100);
}

export const INTERVAL_LABELS: Record<PricingPlan['interval'], string> = {
  once: 'paiement unique',
  monthly: '/ mois',
  quarterly: '/ trimestre',
  yearly: '/ an',
};
