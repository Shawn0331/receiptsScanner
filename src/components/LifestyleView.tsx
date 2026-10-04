import React from 'react';
import { Coffee, Heart, Utensils, Award, Camera } from 'lucide-react';
import type { ExpenseItem, LifestyleScore, CurrencyInfo } from '../types/receipt';

interface LifestyleViewProps {
  items: ExpenseItem[];
  lifestyleScore: LifestyleScore;
  baseCurrency?: CurrencyInfo;
  onStartScan: () => void;
}

export const LifestyleView: React.FC<LifestyleViewProps> = ({
  items,
  lifestyleScore,
  baseCurrency,
  onStartScan,
}) => {
  const currencySymbol = baseCurrency?.symbol || '$';
  const totalSpending = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  // Lifestyle percentages
  const caffeinePct = totalSpending > 0 ? (lifestyleScore.caffeineSpending / totalSpending) * 100 : 0;
  const guiltyPct = totalSpending > 0 ? (lifestyleScore.guiltySpending / totalSpending) * 100 : 0;
  const healthyPct = totalSpending > 0 ? (lifestyleScore.healthySpending / totalSpending) * 100 : 0;

  const cookingTotal = lifestyleScore.homeCookingSpending + lifestyleScore.diningOutSpending;
  const homeCookingPct = cookingTotal > 0 ? (lifestyleScore.homeCookingSpending / cookingTotal) * 100 : 50;

  return (
    <div className="space-y-6 pb-24">
      {/* Persona Spotlight Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-800 text-white p-6 sm:p-7 shadow-xl">
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>本期 AI 生活稱號</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              {lifestyleScore.personaTitle}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 font-medium leading-relaxed">
              {lifestyleScore.personaDescription}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/15">
              ☕ 咖啡因 {currencySymbol} {lifestyleScore.caffeineSpending.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/15">
              🧋 罪惡美食 {currencySymbol} {lifestyleScore.guiltySpending.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/15">
              🥦 自律生鮮 {currencySymbol} {lifestyleScore.healthySpending.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Lifestyle Radar / Dimension Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Dimension 1: Caffeine */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">咖啡因成癮度</h3>
                <p className="text-[10px] text-slate-400">日常咖啡與茶飲開銷</p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-600">
              {lifestyleScore.caffeineCount} 杯
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>花費比例</span>
              <span className="font-bold">{caffeinePct.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(caffeinePct * 2, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {lifestyleScore.caffeineCount > 0
              ? `平均每杯約 ${currencySymbol} ${Math.round(lifestyleScore.caffeineSpending / (lifestyleScore.caffeineCount || 1))}，續命能量充沛！`
              : '本期尚未檢測到咖啡開銷，看來是自然精神飽滿的一天！'}
          </p>
        </div>

        {/* Dimension 2: Guilty Pleasures */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold">
                <span>🧋</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">罪惡甜點指數</h3>
                <p className="text-[10px] text-slate-400">手搖飲、甜點與油炸零食</p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-600">
              {lifestyleScore.guiltyCount} 次
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>療癒花費佔比</span>
              <span className="font-bold">{guiltyPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(guiltyPct * 2, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {lifestyleScore.guiltyCount > 0
              ? `累積罪惡消費 ${currencySymbol} ${lifestyleScore.guiltySpending.toLocaleString()}，適時犒賞讓心靈感到幸福！`
              : '非常克制！本期沒有額外的高糖與罪惡零食支出。'}
          </p>
        </div>

        {/* Dimension 3: Healthy / Discipline */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                <Heart className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">健康自律指標</h3>
                <p className="text-[10px] text-slate-400">生鮮蔬果、蛋奶肉類健康物資</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600">
              {lifestyleScore.healthyCount} 項
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>生鮮健康比例</span>
              <span className="font-bold">{healthyPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(healthyPct * 2, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {lifestyleScore.healthyCount > 0
              ? `投入 ${currencySymbol} ${lifestyleScore.healthySpending.toLocaleString()} 在優質食材與健康上，身體會感謝你！`
              : '別忘了多去生鮮超市買點新鮮蔬果與雞蛋補充營養喔～'}
          </p>
        </div>

        {/* Dimension 4: Home Cooking vs Dining Out */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
                <Utensils className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">自煮 vs 外食比</h3>
                <p className="text-[10px] text-slate-400">料理食材支出 vs 餐廳外食</p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-700">
              {homeCookingPct > 50 ? '大廚自煮型' : '外食打工人'}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>🍳 自煮 {homeCookingPct.toFixed(0)}%</span>
              <span>🍱 外食 {(100 - homeCookingPct).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${homeCookingPct}%` }}
              />
              <div
                className="h-full bg-indigo-400 transition-all duration-500"
                style={{ width: `${100 - homeCookingPct}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {cookingTotal > 0
              ? `自煮採購 ${currencySymbol} ${lifestyleScore.homeCookingSpending} · 外食外送 ${currencySymbol} ${lifestyleScore.diningOutSpending}`
              : '持續記錄發票即可精準計算你的飲食習慣！'}
          </p>
        </div>
      </div>

      {/* Action to scan more */}
      <div className="pt-2 text-center">
        <button
          onClick={onStartScan}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          <span>掃描更多發票豐富生活分析</span>
        </button>
      </div>
    </div>
  );
};
