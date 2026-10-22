/**
 * Valores nutricionales orientativos por cada 100 g de porción comestible.
 * Preparación indicada en cada alimento: las marcas, cortes y métodos de cocción cambian los valores.
 */
export interface FoodCatalogItem {
  id: string;
  label: string;
  kcalPer100g: number;
  proteinPer100g: number;
  basis: string;
}

export const FOOD_CATALOG: FoodCatalogItem[] = [
  { id: "chicken-cooked", label: "Pechuga de pollo cocida sin piel", kcalPer100g: 165, proteinPer100g: 31, basis: "peso cocido" },
  { id: "turkey-cooked", label: "Pechuga de pavo cocida", kcalPer100g: 135, proteinPer100g: 29, basis: "peso cocido" },
  { id: "white-fish", label: "Pescado blanco cocido", kcalPer100g: 120, proteinPer100g: 26, basis: "peso cocido" },
  { id: "tuna-water", label: "Atún en agua escurrido", kcalPer100g: 116, proteinPer100g: 25.5, basis: "peso escurrido" },
  { id: "lean-beef", label: "Carne de res magra cocida", kcalPer100g: 217, proteinPer100g: 26, basis: "peso cocido" },
  { id: "egg-boiled", label: "Huevo duro", kcalPer100g: 155, proteinPer100g: 13, basis: "sin cáscara" },
  { id: "rice-cooked", label: "Arroz blanco cocido", kcalPer100g: 130, proteinPer100g: 2.7, basis: "peso cocido" },
  { id: "quinoa-cooked", label: "Quinua cocida", kcalPer100g: 120, proteinPer100g: 4.4, basis: "peso cocido" },
  { id: "potato-boiled", label: "Papa sancochada", kcalPer100g: 87, proteinPer100g: 1.9, basis: "peso cocido" },
  { id: "sweet-potato", label: "Camote cocido", kcalPer100g: 90, proteinPer100g: 2, basis: "peso cocido" },
  { id: "banana", label: "Plátano", kcalPer100g: 89, proteinPer100g: 1.1, basis: "sin cáscara" },
  { id: "avocado", label: "Palta", kcalPer100g: 160, proteinPer100g: 2, basis: "sin cáscara ni pepa" },
  { id: "broccoli", label: "Brócoli cocido", kcalPer100g: 35, proteinPer100g: 2.4, basis: "peso cocido" },
  { id: "oats-dry", label: "Avena seca", kcalPer100g: 389, proteinPer100g: 16.9, basis: "peso en seco" },
  { id: "almonds", label: "Almendras", kcalPer100g: 579, proteinPer100g: 21.2, basis: "peso comestible" },
  { id: "plain-yogurt", label: "Yogur natural (genérico)", kcalPer100g: 61, proteinPer100g: 3.5, basis: "según producto" },
  { id: "whey-powder", label: "Proteína whey en polvo (genérica)", kcalPer100g: 400, proteinPer100g: 80, basis: "polvo seco; revisar etiqueta" },
];

export function nutritionForGrams(food: FoodCatalogItem, grams: number) {
  return {
    kcal: Math.round((food.kcalPer100g * grams) / 100),
    protein: Math.round(((food.proteinPer100g * grams) / 100) * 10) / 10,
  };
}
