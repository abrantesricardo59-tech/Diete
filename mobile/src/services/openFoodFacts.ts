// Open Food Facts is a free, collaborative, open food products database.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// We only use it as a read-only search source here. Anything a coach/coaché
// wants to edit gets forked into our own `foods` table (see services/foods.ts)
// instead of writing to the shared global database from inside the app.

const BASE_URL = 'https://world.openfoodfacts.org';

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_front_small_url?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

export interface OpenFoodFactsSearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_count: number;
}

export async function searchOpenFoodFacts(query: string, page = 1): Promise<OpenFoodFactsSearchResult> {
  const url = new URL(`${BASE_URL}/cgi/search.pl`);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('page', String(page));
  url.searchParams.set(
    'fields',
    'code,product_name,brands,image_front_small_url,nutriments'
  );

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with status ${response.status}`);
  }
  return response.json();
}

export async function getOpenFoodFactsProductByBarcode(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  const response = await fetch(`${BASE_URL}/api/v2/product/${barcode}.json?fields=code,product_name,brands,image_front_small_url,nutriments`);
  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed with status ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== 1) return null;
  return data.product as OpenFoodFactsProduct;
}

export function offProductToDraftFood(product: OpenFoodFactsProduct) {
  return {
    off_code: product.code,
    name: product.product_name || 'Produit sans nom',
    brand: product.brands ?? null,
    image_url: product.image_front_small_url ?? null,
    calories_per_100g: product.nutriments?.['energy-kcal_100g'] ?? 0,
    protein_per_100g: product.nutriments?.proteins_100g ?? 0,
    carbs_per_100g: product.nutriments?.carbohydrates_100g ?? 0,
    fat_per_100g: product.nutriments?.fat_100g ?? 0,
  };
}
