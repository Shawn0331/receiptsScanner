import type { CurrencyInfo } from '../types/receipt';

const API_KEY_STORAGE = 'receiptlens_gemini_api_key';
const MODEL_NAME_STORAGE = 'receiptlens_gemini_model';
const BASE_CURRENCY_STORAGE = 'receiptlens_base_currency';

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'MYR', symbol: 'RM', name: '馬來西亞令吉 (MYR)' },
  { code: 'TWD', symbol: 'NT$', name: '新台幣 (TWD)' },
  { code: 'USD', symbol: '$', name: '美元 (USD)' },
  { code: 'SGD', symbol: 'S$', name: '新加坡幣 (SGD)' },
  { code: 'JPY', symbol: '¥', name: '日圓 (JPY)' },
  { code: 'EUR', symbol: '€', name: '歐元 (EUR)' },
  { code: 'GBP', symbol: '£', name: '英鎊 (GBP)' },
  { code: 'HKD', symbol: 'HK$', name: '港幣 (HKD)' },
  { code: 'THB', symbol: '฿', name: '泰銖 (THB)' },
  { code: 'KRW', symbol: '₩', name: '韓圓 (KRW)' },
  { code: 'CNY', symbol: '¥', name: '人民幣 (CNY)' },
  { code: 'AUD', symbol: 'A$', name: '澳幣 (AUD)' },
];

export const storageService = {
  getApiKey(): string {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  },

  setApiKey(key: string): void {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  },

  removeApiKey(): void {
    localStorage.removeItem(API_KEY_STORAGE);
  },

  hasApiKey(): boolean {
    return !!localStorage.getItem(API_KEY_STORAGE)?.trim();
  },

  getModelName(): string {
    return localStorage.getItem(MODEL_NAME_STORAGE) || 'gemini-2.5-flash';
  },

  setModelName(model: string): void {
    localStorage.setItem(MODEL_NAME_STORAGE, model);
  },

  getBaseCurrency(): CurrencyInfo {
    const saved = localStorage.getItem(BASE_CURRENCY_STORAGE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Default to MYR (馬來西亞令吉)
    return SUPPORTED_CURRENCIES[0];
  },

  setBaseCurrency(currency: CurrencyInfo): void {
    localStorage.setItem(BASE_CURRENCY_STORAGE, JSON.stringify(currency));
  },
};
