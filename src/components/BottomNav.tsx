import React from 'react';
import { LayoutDashboard, ReceiptText, Camera, Sparkles, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'history' | 'lifestyle' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onStartScan: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onStartScan,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'dashboard' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">總覽</span>
        </button>

        {/* History */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'history' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">明細</span>
        </button>

        {/* Center Floating Scan Button */}
        <div className="flex-1 flex justify-center -translate-y-4">
          <button
            onClick={onStartScan}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            aria-label="拍照掃描發票"
          >
            <Camera className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* Lifestyle / Fun DNA */}
        <button
          onClick={() => onTabChange('lifestyle')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'lifestyle' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">生活成分</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'settings' ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">設定</span>
        </button>
      </div>
    </nav>
  );
};
