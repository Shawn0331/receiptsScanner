import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Trash2, Calendar, Image, Globe } from 'lucide-react';
import type { Receipt, ExpenseItem, Category, CurrencyInfo } from '../types/receipt';
import { deleteReceiptAndItems } from '../db/database';

interface HistoryViewProps {
  receipts: Receipt[];
  items: ExpenseItem[];
  categories: Category[];
  baseCurrency?: CurrencyInfo;
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  receipts,
  items,
  categories,
  baseCurrency,
  onRefresh,
}) => {
  const currencySymbol = baseCurrency?.symbol || '$';
  const baseCode = baseCurrency?.code || 'MYR';
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Filter receipts based on store name or included item name
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesStore = receipt.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const receiptItems = items.filter((it) => it.receiptId === receipt.id);
    const matchesItem = receiptItems.some((it) =>
      it.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesStore || matchesItem;
  });

  const handleDelete = async (receiptId: string, storeName: string) => {
    if (window.confirm(`確定要刪除「${storeName}」這筆發票紀錄與所有品項嗎？`)) {
      await deleteReceiptAndItems(receiptId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜尋商店名稱或品項名稱（如：咖啡、全聯...）"
          className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200/80 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
        />
      </div>

      {/* Receipts List */}
      <div className="space-y-3">
        {filteredReceipts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-xs font-semibold text-slate-600">查無發票紀錄</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchTerm ? '試試其他關鍵字搜尋' : '尚未記錄任何發票'}
            </p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => {
            const receiptItems = items.filter((it) => it.receiptId === receipt.id);
            const isExpanded = expandedReceiptId === receipt.id;

            return (
              <div
                key={receipt.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedReceiptId(isExpanded ? null : receipt.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-100">
                      🧾
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-800">{receipt.storeName}</h3>
                        {receipt.imageBlob && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(receipt.imageBlob || null);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="查看發票原圖"
                          >
                            <Image className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {receipt.purchaseDate}
                        </span>
                        <span>·</span>
                        <span>{receiptItems.length} 項商品</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">
                        {currencySymbol} {receipt.totalAmount.toLocaleString()}
                      </span>
                      {receipt.originalCurrency && receipt.originalCurrency !== baseCode && (
                        <span className="text-[10px] text-sky-600 font-mono font-medium flex items-center justify-end gap-0.5">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{receipt.originalCurrency} {receipt.originalTotalAmount?.toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Line Items Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-2.5">
                    {receipt.notes && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/50 text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                        <span>💡</span>
                        <span>{receipt.notes}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      {receiptItems.map((item) => {
                        const cat = categoryMap.get(item.categoryId);
                        return (
                          <div
                            key={item.id}
                            className="p-2.5 bg-white rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                              {cat && (
                                <span
                                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                                  style={{ backgroundColor: `${cat.color}20` }}
                                >
                                  {cat.icon}
                                </span>
                              )}
                              <span className="font-semibold text-slate-700 truncate">
                                {item.itemName}
                              </span>
                              {item.funNote && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  {item.funNote}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 text-right">
                              <span className="text-[11px] text-slate-400">
                                ×{item.quantity || 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {currencySymbol} {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                </span>
                                {item.originalPrice !== undefined && receipt.originalCurrency && receipt.originalCurrency !== baseCode && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {receipt.originalCurrency} {(item.originalPrice * (item.quantity || 1)).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => handleDelete(receipt.id, receipt.storeName)}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除此發票</span>
                      </button>

                      {receipt.imageBlob && (
                        <button
                          onClick={() => setPreviewImage(receipt.imageBlob || null)}
                          className="text-xs text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>檢視發票大圖</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2">
            <img src={previewImage} alt="Receipt Detail Full" className="max-h-[80vh] object-contain rounded-xl" />
            <p className="text-center text-xs text-slate-400 py-1">點擊任意處關閉預覽</p>
          </div>
        </div>
      )}
    </div>
  );
};
