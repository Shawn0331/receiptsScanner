import { Key, CheckCircle2, Smartphone } from 'lucide-react';
import { storageService } from '../services/storageService';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenMobileConnect: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenMobileConnect,
  selectedMonth,
  onMonthChange,
}) => {
  const hasKey = storageService.hasApiKey();

  // Generate current and previous 5 months
  const getRecentMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      months.push({ val, label });
    }
    return months;
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <span className="text-xl">🧾</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">ReceiptLens</h1>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                AI Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">發票品項自動分類記帳</p>
          </div>
        </div>

        {/* Month Selector, Mobile Connect & Key Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="relative hidden xs:block sm:block">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="text-xs sm:text-sm font-medium bg-slate-100/80 hover:bg-slate-200/60 text-slate-700 py-1.5 px-2.5 rounded-xl border border-slate-200/60 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              {getRecentMonths().map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenMobileConnect}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-all shadow-xs"
            title="手機掃碼使用"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">手機使用</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              hasKey
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100 animate-pulse'
            }`}
            title={hasKey ? 'Gemini API Key 已設定' : '點擊設定 Gemini API Key'}
          >
            {hasKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">AI 已就緒</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>設定 Key</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
