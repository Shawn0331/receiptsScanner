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
  price: number;
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
  totalAmount: number;
  imageBlob?: string; // Base64 data URL
  createdAt: string; // ISO string
  notes?: string;
  itemCount: number;
}

export interface ReceiptScanResult {
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  items: Array<{
    itemName: string;
    price: number;
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
