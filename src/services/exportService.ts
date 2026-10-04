import { db } from '../db/database';
import type { Receipt, ExpenseItem } from '../types/receipt';

export async function exportToCsv(): Promise<void> {
  const receipts = await db.receipts.toArray();
  const items = await db.items.toArray();
  const categories = await db.categories.toArray();

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const receiptMap = new Map(receipts.map((r) => [r.id, r]));

  // CSV Headers: 日期, 商店, 品項, 單價, 數量, 小計, 分類, 生活標籤
  const headers = ['日期', '商店', '品項', '單價', '數量', '小計', '分類', '生活備註'];
  const rows = items.map((item) => {
    const receipt = receiptMap.get(item.receiptId);
    const date = item.purchaseDate || receipt?.purchaseDate || '';
    const store = receipt?.storeName || '未知商店';
    const catName = categoryMap.get(item.categoryId) || '未分類';
    const subtotal = item.price * (item.quantity || 1);
    const note = item.funNote || '';

    return [
      `"${date}"`,
      `"${store.replace(/"/g, '""')}"`,
      `"${item.itemName.replace(/"/g, '""')}"`,
      item.price,
      item.quantity || 1,
      subtotal,
      `"${catName}"`,
      `"${note.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ReceiptLens_開銷明細_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportBackupJson(): Promise<void> {
  const receipts = await db.receipts.toArray();
  const items = await db.items.toArray();
  const categories = await db.categories.toArray();

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    receipts,
    items,
    categories,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ReceiptLens_完整備份_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importBackupJson(file: File): Promise<{ success: boolean; count: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!data.receipts || !data.items) {
          throw new Error('備份檔案格式不正確');
        }

        await db.transaction('rw', db.receipts, db.items, async () => {
          await db.receipts.bulkPut(data.receipts as Receipt[]);
          await db.items.bulkPut(data.items as ExpenseItem[]);
        });

        resolve({ success: true, count: data.receipts.length });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('讀取檔案失敗'));
    reader.readAsText(file);
  });
}
