import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, X, Copy, Check, Wifi, Globe } from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Local Wi-Fi Network URL
  const localWifiUrl = 'http://192.168.0.9:5174';

  const handleCopy = () => {
    navigator.clipboard.writeText(localWifiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">在手機上使用 ReceiptLens</h2>
              <p className="text-[11px] text-slate-400">同 Wi-Fi 掃碼立即同步體驗</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500/20 shadow-sm">
            <QRCodeSVG value={localWifiUrl} size={180} level="M" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>確保手機與電腦連接同一個 Wi-Fi</span>
            </div>
            <p className="text-[11px] text-slate-400">
              打開手機原生相機直接掃描上方 QR 碼即可開啟
            </p>
          </div>

          {/* Copy URL Box */}
          <div className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="flex-1 font-mono text-slate-600 truncate text-left pl-1">
              {localWifiUrl}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1 text-[11px] font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製' : '複製'}</span>
            </button>
          </div>

          {/* Tips Box */}
          <div className="w-full p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-left space-y-1.5 text-[11px] text-emerald-900">
            <div className="font-bold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span>手機拍照記帳小訣竅：</span>
            </div>
            <p className="text-emerald-800/80 leading-relaxed">
              1. 點擊畫面中央的綠色拍照按鈕，會直接呼叫手機鏡頭拍照。
              <br />
              2. 點擊手機 Safari「分享 ➔ 加入主畫面」，即可像原生 App 一樣放在手機桌面！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
