const API_KEY_STORAGE = 'receiptlens_gemini_api_key';
const MODEL_NAME_STORAGE = 'receiptlens_gemini_model';

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
  }
};
