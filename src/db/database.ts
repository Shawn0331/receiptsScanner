import Dexie, { type Table } from 'dexie';
import type { Receipt, ExpenseItem, Category } from '../types/receipt';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: '餐飲食品', icon: '🍔', color: '#F97316', isDefault: true },
  { id: 'cat_grocery', name: '生鮮超市', icon: '🥦', color: '#10B981', isDefault: true },
  { id: 'cat_daily', name: '日常用品', icon: '🧻', color: '#06B6D4', isDefault: true },
  { id: 'cat_fun', name: '娛樂休閒', icon: '🎮', color: '#8B5CF6', isDefault: true },
  { id: 'cat_transport', name: '交通出行', icon: '🚗', color: '#3B82F6', isDefault: true },
  { id: 'cat_medical', name: '醫療保健', icon: '💊', color: '#EC4899', isDefault: true },
  { id: 'cat_tech', name: '3C 與設備', icon: '💻', color: '#6366F1', isDefault: true },
  { id: 'cat_house', name: '居家水電', icon: '🏠', color: '#EAB308', isDefault: true },
  { id: 'cat_other', name: '其他開銷', icon: '📦', color: '#6B7280', isDefault: true },
];

export class ReceiptLensDatabase extends Dexie {
  receipts!: Table<Receipt, string>;
  items!: Table<ExpenseItem, string>;
  categories!: Table<Category, string>;

  constructor() {
    super('ReceiptLensDB');
    this.version(1).stores({
      receipts: 'id, purchaseDate, createdAt, totalAmount',
      items: 'id, receiptId, categoryId, purchaseDate',
      categories: 'id, name, isDefault',
    });
  }
}

export const db = new ReceiptLensDatabase();

// Initialize default categories if not already present
export async function initializeDatabase() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}

// Database Helper functions
export async function saveReceiptWithItems(
  receipt: Receipt,
  items: ExpenseItem[]
): Promise<void> {
  await db.transaction('rw', db.receipts, db.items, async () => {
    await db.receipts.put(receipt);
    // Delete existing items for this receipt if editing
    await db.items.where('receiptId').equals(receipt.id).delete();
    await db.items.bulkAdd(items);
  });
}

export async function deleteReceiptAndItems(receiptId: string): Promise<void> {
  await db.transaction('rw', db.receipts, db.items, async () => {
    await db.receipts.delete(receiptId);
    await db.items.where('receiptId').equals(receiptId).delete();
  });
}

export async function getReceiptDetails(receiptId: string): Promise<{ receipt?: Receipt; items: ExpenseItem[] }> {
  const receipt = await db.receipts.get(receiptId);
  const items = await db.items.where('receiptId').equals(receiptId).toArray();
  return { receipt, items };
}
