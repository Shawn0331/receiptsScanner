import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Store, Calendar, Sparkles, AlertCircle, ZoomIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ReceiptScanResult, Category, ExpenseItem, Receipt, LifestyleTag } from '../types/receipt';
import { saveReceiptWithItems } from '../db/database';
import { nativeService } from '../services/nativeService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: ReceiptScanResult | null;
  imageBlob: string | null;
  categories: Category[];
  onSaveSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  scanResult,
  imageBlob,
  categories,
  onSaveSuccess,
}) => {
  if (!isOpen || !scanResult) return null;

  // Local editable state
  const [storeName, setStoreName] = useState(scanResult.storeName || '未知商店');
  const [purchaseDate, setPurchaseDate] = useState(scanResult.purchaseDate || new Date().toISOString().split('T')[0]);
  const totalAmount = scanResult.totalAmount || 0;
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Initialize items with matched categoryId
  const [items, setItems] = useState<Array<{
    id: string;
    itemName: string;
    price: number;
    quantity: number;
    categoryId: string;
    lifestyleTags: LifestyleTag[];
    funNote?: string;
  }>>(() => {
    return scanResult.items.map((item, idx) => {
      // Find matching category ID or fallback to first or 'cat_other'
      const matched = categories.find((c) => c.name === item.suggestedCategory);
      const defaultId = categories.find((c) => c.id === 'cat_other')?.id || categories[0]?.id || 'cat_food';

      return {
        id: `item_${Date.now()}_${idx}`,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity || 1,
        categoryId: matched ? matched.id : defaultId,
        lifestyleTags: item.lifestyleTags || [],
        funNote: item.funNote,
      };
    });
  });

  const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdateItem = (id: string, field: string, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleAddItem = () => {
    const defaultCatId = categories[0]?.id || 'cat_food';
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random()}`,
        itemName: '新商品',
        price: 0,
        quantity: 1,
        categoryId: defaultCatId,
        lifestyleTags: [],
      },
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleConfirmSave = async () => {
    const receiptId = `receipt_${Date.now()}`;
    const newReceipt: Receipt = {
      id: receiptId,
      storeName,
      purchaseDate,
      totalAmount: calculatedSubtotal > 0 ? calculatedSubtotal : totalAmount,
      imageBlob: imageBlob || undefined,
      createdAt: new Date().toISOString(),
      itemCount: items.length,
      notes: scanResult.aiComment,
    };

    const expenseItems: ExpenseItem[] = items.map((it) => ({
      id: it.id,
      receiptId: receiptId,
      itemName: it.itemName,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      categoryId: it.categoryId,
      purchaseDate: purchaseDate,
      lifestyleTags: it.lifestyleTags,
      funNote: it.funNote,
    }));

    await saveReceiptWithItems(newReceipt, expenseItems);

    // Native haptic feedback
    nativeService.triggerHaptic('success');

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-base font-bold text-slate-800">核對發票與品項明細</h2>
              <p className="text-xs text-slate-400">確認品項名稱、金額及分類無誤後入帳</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* AI Comment Bubble if present */}
          {scanResult.aiComment && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 font-medium">
                {scanResult.aiComment}
              </div>
            </div>
          )}

          {/* Receipt Basic Info & Image Preview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            {/* Store Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Store className="w-3 h-3" /> 商店名稱
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 消費日期
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
              />
            </div>

            {/* Receipt Image Thumbnail */}
            {imageBlob && (
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div className="relative group cursor-pointer" onClick={() => setShowImageZoom(!showImageZoom)}>
                  <img
                    src={imageBlob}
                    alt="Receipt Thumbnail"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageZoom(!showImageZoom)}
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 underline sm:hidden"
                >
                  {showImageZoom ? '隱藏原圖' : '查看發票大圖'}
                </button>
              </div>
            )}
          </div>

          {/* Expanded Receipt Image Preview if toggled */}
          {showImageZoom && imageBlob && (
            <div className="p-2 bg-slate-900 rounded-2xl flex justify-center max-h-72 overflow-hidden border border-slate-800">
              <img src={imageBlob} alt="Receipt Detail" className="max-h-64 object-contain rounded-lg" />
            </div>
          )}

          {/* Items Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              發票品項明細 ({items.length} 項)
            </h3>
            <button
              onClick={handleAddItem}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增品項</span>
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-2.5">
            {items.map((item) => {
              const currentCategory = categories.find((c) => c.id === item.categoryId);

              return (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    {/* Item Name Input */}
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleUpdateItem(item.id, 'itemName', e.target.value)}
                      placeholder="商品品項名稱"
                      className="flex-1 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />

                    {/* Price Input */}
                    <div className="flex items-center w-24 relative">
                      <span className="absolute left-2.5 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleUpdateItem(item.id, 'price', Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      />
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="刪除此品項"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Selector & Playful tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: currentCategory?.color || '#cbd5e1' }}
                      />
                      <span className="text-[11px] text-slate-400 font-medium">分類：</span>
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleUpdateItem(item.id, 'categoryId', e.target.value)}
                        className="text-xs font-medium py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fun Note / Micro Lifestyle Tag */}
                    {item.funNote && (
                      <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        {item.funNote}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtotal Calculation & Check */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">品項試算總和</div>
              {totalAmount > 0 && totalAmount !== calculatedSubtotal && (
                <div className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  發票原標示總額 ${totalAmount}（品項總和 ${calculatedSubtotal}）
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-slate-900 tracking-tight">
                ${calculatedSubtotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmSave}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>確認入帳 (${calculatedSubtotal})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
