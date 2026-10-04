import React from 'react';
import { Camera, TrendingUp, Receipt as ReceiptIcon, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import type { Receipt, ExpenseItem, Category, LifestyleScore } from '../types/receipt';

interface DashboardViewProps {
  receipts: Receipt[];
  items: ExpenseItem[];
  categories: Category[];
  lifestyleScore: LifestyleScore;
  onStartScan: () => void;
  onViewHistory: () => void;
  onViewLifestyle: () => void;
  onSelectReceipt: (receiptId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  receipts,
  items,
  categories,
  lifestyleScore,
  onStartScan,
  onViewHistory,
  onViewLifestyle,
  onSelectReceipt,
}) => {
  const totalSpending = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  // Calculate spending per category
  const categorySpendingMap = new Map<string, number>();
  for (const item of items) {
    const prev = categorySpendingMap.get(item.categoryId) || 0;
    categorySpendingMap.set(item.categoryId, prev + item.price * (item.quantity || 1));
  }

  const categoryBreakdown = categories
    .map((cat) => ({
      ...cat,
      total: categorySpendingMap.get(cat.id) || 0,
      percentage: totalSpending > 0 ? ((categorySpendingMap.get(cat.id) || 0) / totalSpending) * 100 : 0,
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Recent 5 receipts
  const recentReceipts = [...receipts]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Spending Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-7 shadow-xl shadow-emerald-900/15">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200/90 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> 本期開銷總計
            </span>
            <span className="text-xs bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-emerald-100 font-medium border border-white/10">
              共 {receipts.length} 張發票 · {items.length} 個品項
            </span>
          </div>

          <div className="mb-6">
            <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold opacity-80">$</span>
              <span>{totalSpending.toLocaleString()}</span>
            </div>
            <p className="text-xs text-emerald-100/70 mt-1">
              品項皆透過 AI 視覺自動辨識與個別分類
            </p>
          </div>

          {/* Quick Action Bar */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              onClick={onStartScan}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-white text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>拍照辨識發票</span>
            </button>
            <button
              onClick={onViewLifestyle}
              className="py-2.5 px-3.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">生活稱號</span>
            </button>
          </div>
        </div>
      </div>

      {/* Playful Lifestyle Mini Banner */}
      {items.length > 0 && (
        <div
          onClick={onViewLifestyle}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between hover:border-emerald-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
              🧬
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>生活風格觀察：</span>
                <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                  {lifestyleScore.personaTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {lifestyleScore.caffeineCount > 0 && `☕ ${lifestyleScore.caffeineCount} 杯咖啡`}
                {lifestyleScore.guiltyCount > 0 && ` · 🧋 ${lifestyleScore.guiltyCount} 次罪惡美食`}
                {lifestyleScore.healthyCount > 0 && ` · 🥦 ${lifestyleScore.healthyCount} 樣自律生鮮`}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </div>
      )}

      {/* Category Breakdown Section */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>開銷分類佔比</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {categoryBreakdown.length} 個類別
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-2">🏷️</div>
            <p className="text-xs text-slate-500 font-medium">尚未記錄任何開銷</p>
            <p className="text-[11px] text-slate-400 mt-0.5">點擊下方拍照按鈕掃描第一張發票吧！</p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <span className="text-[11px] text-slate-400">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ${cat.total.toLocaleString()}
                  </span>
                </div>
                {/* Visual percentage bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(cat.percentage, 3)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Receipts Section */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <ReceiptIcon className="w-4 h-4 text-emerald-600" />
            <span>近期發票</span>
          </h2>
          <button
            onClick={onViewHistory}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
          >
            <span>查看全部</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentReceipts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-2">🧾</div>
            <p className="text-xs text-slate-500 font-medium">尚無發票明細</p>
            <p className="text-[11px] text-slate-400 mt-0.5">拍照辨識發票將即時在此列出</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentReceipts.map((rc) => (
              <div
                key={rc.id}
                onClick={() => onSelectReceipt(rc.id)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 -mx-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold border border-slate-200/60">
                    🧾
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{rc.storeName}</h3>
                    <p className="text-[11px] text-slate-400">
                      {rc.purchaseDate} · {rc.itemCount} 個品項
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900">
                    ${rc.totalAmount.toLocaleString()}
                  </span>
                  {rc.notes && (
                    <p className="text-[10px] text-emerald-600 truncate max-w-[120px]">
                      {rc.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
