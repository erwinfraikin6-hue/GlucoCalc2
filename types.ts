
export interface UserSettings {
  icr: number; // Insulin-to-Carb Ratio
  isf: number; // Insulin Sensitivity Factor
  targetBg: number; // Target Blood Glucose (mg/dL)
  unit: 'mg/dL' | 'mmol/L';
}

export interface FoodEntry {
  id: string;
  timestamp: number;
  foodName: string;
  carbs: number;
  currentBg?: number;
  calculatedInsulin: number;
  portionDescription: string;
  imageUrl?: string;
}

export interface GeminiFoodResponse {
  foodName: string;
  carbsGrams: number;
  portionSize: string;
  confidence: number;
  explanation: string;
}
