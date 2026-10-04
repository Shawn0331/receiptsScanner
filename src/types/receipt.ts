export interface CurrencyInfo {
  code: string; // e.g. 'MYR', 'TWD', 'USD'
  symbol: string; // e.g. 'RM', 'NT$', '$'
  name: string; // e.g. '馬來西亞令吉 (MYR)'
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export type LifestyleTag = 'caffeine' | 'sugar' | 'healthy' | 'home_cooking' | 'dining_out' | 'entertainment' | 'essential';

export interface ExpenseItem {
  id: string;
  receiptId: string;
  itemName: string;
  price: number; // Converted price in base currency
  originalPrice?: number; // Price in receipt's original currency
  quantity: number;
  categoryId: string;
  purchaseDate: string; // YYYY-MM-DD
  lifestyleTags?: LifestyleTag[];
  funNote?: string;
}

export interface Receipt {
  id: string;
  storeName: string;
  purchaseDate: string; // YYYY-MM-DD
  totalAmount: number; // Converted total in base currency
  currency?: string; // Base currency code, e.g. 'MYR'
  originalCurrency?: string; // Receipt original currency, e.g. 'JPY'
  exchangeRate?: number; // e.g. 0.031
  originalTotalAmount?: number;
  imageBlob?: string; // Base64 data URL
  createdAt: string; // ISO string
  notes?: string;
  itemCount: number;
}

export interface ReceiptScanResult {
  storeName: string;
  purchaseDate: string;
  totalAmount: number; // in base currency
  detectedCurrency: string; // e.g. 'JPY', 'MYR', 'USD'
  exchangeRate: number; // 1 original = X base
  originalTotalAmount: number;
  items: Array<{
    itemName: string;
    price: number; // Converted price in base currency
    originalPrice?: number; // Original price in receipt currency
    quantity: number;
    suggestedCategory: string;
    lifestyleTags?: LifestyleTag[];
    funNote?: string;
  }>;
  aiComment?: string;
}

export interface LifestyleScore {
  caffeineCount: number;
  caffeineSpending: number;
  guiltyCount: number;
  guiltySpending: number;
  healthyCount: number;
  healthySpending: number;
  homeCookingSpending: number;
  diningOutSpending: number;
  personaTitle: string;
  personaDescription: string;
}
