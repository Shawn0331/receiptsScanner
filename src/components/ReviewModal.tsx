import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Store, Calendar, Sparkles, ZoomIn, Globe, ArrowRightLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ReceiptScanResult, Category, ExpenseItem, Receipt, LifestyleTag, CurrencyInfo } from '../types/receipt';
import { saveReceiptWithItems } from '../db/database';
import { nativeService } from '../services/nativeService';
import { storageService } from '../services/storageService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: ReceiptScanResult | null;
  imageBlob: string | null;
  categories: Category[];
  baseCurrency?: CurrencyInfo;
  onSaveSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  scanResult,
  imageBlob,
  categories,
  baseCurrency,
  onSaveSuccess,
}) => {
  if (!isOpen || !scanResult) return null;

  const userCurrency = baseCurrency || storageService.getBaseCurrency();

  // Currency & Exchange rate state
  const detectedCurrency = scanResult.detectedCurrency || userCurrency.code;
  const [exchangeRate, setExchangeRate] = useState<number>(
    scanResult.exchangeRate || 1.0
  );

  const isOverseas = detectedCurrency !== userCurrency.code;

  // Local editable receipt state
  const [storeName, setStoreName] = useState(scanResult.storeName || '未知商店');
  const [purchaseDate, setPurchaseDate] = useState(scanResult.purchaseDate || new Date().toISOString().split('T')[0]);
  const totalAmount = scanResult.totalAmount || 0;
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Initialize items with matched categoryId and dual prices
  const [items, setItems] = useState<Array<{
    id: string;
    itemName: string;
    price: number; // Converted price in user's base currency
    originalPrice: number; // Price in receipt's original currency
    quantity: number;
    categoryId: string;
    lifestyleTags: LifestyleTag[];
    funNote?: string;
  }>>(() => {
    return scanResult.items.map((item, idx) => {
      const matched = categories.find((c) => c.name === item.suggestedCategory);
      const defaultId = categories.find((c) => c.id === 'cat_other')?.id || categories[0]?.id || 'cat_food';
      const origPrice = item.originalPrice !== undefined ? item.originalPrice : item.price;
      const convPrice = item.price;

      return {
        id: `item_${Date.now()}_${idx}`,
        itemName: item.itemName,
        price: convPrice,
        originalPrice: origPrice,
        quantity: item.quantity || 1,
        categoryId: matched ? matched.id : defaultId,
        lifestyleTags: item.lifestyleTags || [],
        funNote: item.funNote,
      };
    });
  });

  const calculatedSubtotal = Math.round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;

  const originalSubtotal = Math.round(
    items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0) * 100
  ) / 100;

  // Handle Exchange Rate modification: recalculates converted price of all items
  const handleExchangeRateChange = (newRate: number) => {
    setExchangeRate(newRate);
    if (newRate > 0) {
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          price: Math.round(it.originalPrice * newRate * 100) / 100,
        }))
      );
    }
  };

  const handleUpdateItem = (id: string, field: string, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'originalPrice') {
          const newOrig = Number(val) || 0;
          return {
            ...it,
            originalPrice: newOrig,
            price: isOverseas ? Math.round(newOrig * exchangeRate * 100) / 100 : newOrig,
          };
        }
        return { ...it, [field]: val };
      })
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
        originalPrice: 0,
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
      currency: userCurrency.code,
      originalCurrency: detectedCurrency,
      exchangeRate: isOverseas ? exchangeRate : 1.0,
      originalTotalAmount: originalSubtotal,
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
      originalPrice: Number(it.originalPrice) || 0,
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Overseas Multi-Currency Conversion Card */}
          {isOverseas && (
            <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center text-xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <span>🌏 偵測到海外發票 ({detectedCurrency})</span>
                      <ArrowRightLeft className="w-3 h-3 text-sky-600" />
                      <span>自動換算為 {userCurrency.name}</span>
                    </h3>
                    <p className="text-[11px] text-sky-700/80">
                      AI 依收據日期估算參考匯率，你可手動微調以符合刷卡帳單
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-sky-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span>參考匯率：</span>
                  <span className="font-mono bg-white px-2 py-1 rounded-lg border border-sky-200 text-sky-900">
                    1 {detectedCurrency} =
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => handleExchangeRateChange(Number(e.target.value))}
                    className="w-24 px-2 py-1 text-xs font-bold font-mono bg-white border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                  <span>{userCurrency.code}</span>
                </div>

                <div className="text-[11px] text-sky-800 font-medium ml-auto">
                  原幣總計: <strong className="font-mono">{detectedCurrency} {originalSubtotal.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

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

                    {/* Dual Price Input: Shows original price if overseas */}
                    {isOverseas ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center w-20 relative">
                          <span className="absolute left-1.5 text-[10px] text-slate-400">{detectedCurrency}</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.originalPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'originalPrice', e.target.value)}
                            className="w-full pl-8 pr-1 py-1.5 text-xs font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">➔</span>
                        <div className="flex items-center w-24 relative">
                          <span className="absolute left-2 text-[10px] font-semibold text-emerald-600">{userCurrency.symbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(item.id, 'price', Number(e.target.value))}
                            className="w-full pl-7 pr-2 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center w-24 relative">
                        <span className="absolute left-2.5 text-xs text-slate-400">{userCurrency.symbol}</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, 'price', Number(e.target.value))}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                      </div>
                    )}

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
              <div className="text-xs text-slate-500 font-medium">
                換算後品項總和 ({userCurrency.name})
              </div>
              {isOverseas && (
                <div className="text-[11px] text-sky-700 flex items-center gap-1 mt-0.5">
                  原幣小計：{detectedCurrency} {originalSubtotal.toLocaleString()} (匯率 {exchangeRate})
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-slate-900 tracking-tight">
                {userCurrency.symbol} {calculatedSubtotal.toLocaleString()}
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
            <span>確認入帳 ({userCurrency.symbol} {calculatedSubtotal})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
