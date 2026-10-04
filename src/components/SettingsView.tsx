import React, { useState, useRef } from 'react';
import { Key, Save, Download, Upload, Trash2, Plus, Sparkles, Check, Eye, EyeOff, Database, Globe, Coins } from 'lucide-react';
import type { Category, CurrencyInfo } from '../types/receipt';
import { storageService, SUPPORTED_CURRENCIES } from '../services/storageService';
import { db } from '../db/database';
import { exportToCsv, exportBackupJson, importBackupJson } from '../services/exportService';

interface SettingsViewProps {
  categories: Category[];
  onCategoriesChanged: () => void;
  onCurrencyChanged: () => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  onCategoriesChanged,
  onCurrencyChanged,
  onDataReset,
}) => {
  const [apiKey, setApiKey] = useState(storageService.getApiKey());
  const [modelName, setModelName] = useState(storageService.getModelName());
  const [showKey, setShowKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  // Currency State
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyInfo>(storageService.getBaseCurrency());
  const [currencySaveMessage, setCurrencySaveMessage] = useState<string | null>(null);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🛍️');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveApiKey = () => {
    storageService.setApiKey(apiKey);
    storageService.setModelName(modelName);
    setKeySaveMessage('API Key 與模型設定已成功儲存！');
    setTimeout(() => setKeySaveMessage(null), 3000);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const newCategory: Category = {
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon || '🏷️',
      color: newCatColor || '#10B981',
      isDefault: false,
    };
    await db.categories.add(newCategory);
    setNewCatName('');
    onCategoriesChanged();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`確定要刪除「${name}」這個分類嗎？`)) {
      await db.categories.delete(id);
      onCategoriesChanged();
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('確定要清除所有發票與記帳明細嗎？此操作無法撤銷！')) {
      await db.receipts.clear();
      await db.items.clear();
      onDataReset();
      alert('所有資料已成功清除');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importBackupJson(file);
      alert(`成功還原 ${res.count} 筆發票資料！`);
      onDataReset();
    } catch (err: any) {
      alert(`還原失敗：${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Gemini API Key Configuration */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Google Gemini API Key 設定</h2>
            <p className="text-xs text-slate-400">金鑰僅存於你的瀏覽器 LocalStorage，確保安全與隱私</p>
          </div>
        </div>

        {keySaveMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4" />
            <span>{keySaveMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="貼上你的 AI Studio API Key (AIzaSy...)"
                className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              可至 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 underline">Google AI Studio</a> 免費取得 API 金鑰。未填寫時可使用示範模式測試體驗。
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              AI 視覺模型版本
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash（最新推薦，速度快且辨識精準）</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash（經典穩定）</option>
            </select>
          </div>

          <button
            onClick={handleSaveApiKey}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>儲存設定</span>
          </button>
        </div>
      </div>

      {/* Base Currency Configuration */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">居住地主要幣別 (Base Currency)</h2>
            <p className="text-xs text-slate-400">出國旅行時掃描外幣發票，將自動換算為此幣別</p>
          </div>
        </div>

        {currencySaveMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4" />
            <span>{currencySaveMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                選擇常用貨幣
              </label>
              <select
                value={currentCurrency.code}
                onChange={(e) => {
                  const found = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) {
                    setCurrentCurrency(found);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                貨幣符號 (如: RM, $, NT$)
              </label>
              <input
                type="text"
                value={currentCurrency.symbol}
                onChange={(e) => setCurrentCurrency({ ...currentCurrency, symbol: e.target.value })}
                placeholder="貨幣符號"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <Globe className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              目前設定居住地貨幣為：<strong className="text-amber-950">{currentCurrency.name}</strong>（符號：<span className="font-bold">{currentCurrency.symbol}</span>）。出國拍攝外幣收據（如日圓 JPY、美金 USD），AI 會自動依即時匯率換算入帳！
            </div>
          </div>

          <button
            onClick={() => {
              storageService.setBaseCurrency(currentCurrency);
              setCurrencySaveMessage('居住地幣別已更新！');
              onCurrencyChanged();
              setTimeout(() => setCurrencySaveMessage(null), 3000);
            }}
            className="w-full py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>儲存幣別設定</span>
          </button>
        </div>
      </div>

      {/* Category Management */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">消費分類管理</h2>
            <p className="text-xs text-slate-400">AI 辨識發票時會自動歸納至以下分類</p>
          </div>
        </div>

        {/* Existing Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span>{cat.icon}</span>
                <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
              </div>
              {!cat.isDefault && (
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-slate-300 hover:text-rose-500 p-1"
                  title="刪除自訂分類"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Category Form */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            placeholder="圖示"
            className="w-12 px-2 py-2 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="新增分類名稱（如：寵物、健身）"
            className="flex-1 min-w-[140px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-9 h-8 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
          />
          <button
            onClick={handleAddCategory}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增</span>
          </button>
        </div>
      </div>

      {/* Data Backup & Export */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">資料備份與匯出</h2>
            <p className="text-xs text-slate-400">完全掌控你的個人消費記帳明細資料</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={exportToCsv}
            className="py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>匯出 CSV 報表</span>
          </button>

          <button
            onClick={exportBackupJson}
            className="py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>完整 JSON 備份</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>還原備份 JSON</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleClearAllData}
            className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1.5 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清除所有記帳資料</span>
          </button>
        </div>
      </div>
    </div>
  );
};
