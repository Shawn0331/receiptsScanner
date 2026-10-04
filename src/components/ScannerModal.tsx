import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import type { ReceiptScanResult, Category, CurrencyInfo } from '../types/receipt';
import { parseReceiptWithGemini, getMockScanResult } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { nativeService } from '../services/nativeService';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  baseCurrency?: CurrencyInfo;
  onScanComplete: (result: ReceiptScanResult, imageBlob: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  baseCurrency,
  onScanComplete,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelected = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('請選擇有效的圖片檔案 (.jpg, .png, .webp)');
      return;
    }

    // Read and compress image if necessary
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      startAiAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startAiAnalysis = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await parseReceiptWithGemini(imageDataUrl, categories, baseCurrency);
      onScanComplete(result, imageDataUrl);
      handleClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '辨識發票失敗，請檢查照片或重試。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseDemo = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    // Standard mock receipt image svg
    const mockImageSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%23ffffff"/><text x="50%" y="80" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="%231e293b">FamilyMart 日本涉谷門市</text><text x="50%" y="120" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">RECEIPT (JPY)</text><line x1="40" y1="150" x2="360" y2="150" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="40" y="190" font-family="sans-serif" font-size="15" fill="%23334155">極上黑咖啡 (Black Coffee)</text><text x="360" y="190" text-anchor="end" font-family="sans-serif" font-size="15" fill="%23334155">¥300</text><text x="40" y="230" font-family="sans-serif" font-size="15" fill="%23334155">北海道特濃牛乳生乳卷</text><text x="360" y="230" text-anchor="end" font-family="sans-serif" font-size="15" fill="%23334155">¥1200</text><text x="40" y="270" font-family="sans-serif" font-size="15" fill="%23334155">休足時間舒緩貼布</text><text x="360" y="270" text-anchor="end" font-family="sans-serif" font-size="15" fill="%23334155">¥1000</text><line x1="40" y1="310" x2="360" y2="310" stroke="%23cbd5e1"/><text x="40" y="350" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230f172a">總計 TOTAL</text><text x="360" y="350" text-anchor="end" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">¥2500</text></svg>`;
    
    setSelectedImage(mockImageSvg);
    await new Promise((r) => setTimeout(r, 1200));
    const demoResult = getMockScanResult(baseCurrency);
    onScanComplete(demoResult, mockImageSvg);
    setIsProcessing(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedImage(null);
    setIsProcessing(false);
    setErrorMessage(null);
    onClose();
  };

  const hasApiKey = storageService.hasApiKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">拍照 / 上傳發票收據</h2>
              <p className="text-xs text-slate-400">Gemini 視覺 AI 自動解析明細與分類</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!hasApiKey && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">目前使用「展示體驗模式」：</span>
                尚未設定 Google Gemini API Key。你可以點擊「試用示範發票」立即感受辨識效果，或至「設定」輸入你的 Key 開啟即時相機辨識。
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isProcessing ? (
            /* Scanning Animation State */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="relative w-48 h-64 bg-slate-100 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner mb-6">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Receipt Scan"
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
                {/* Luminous scanning beam */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]" />
              </div>

              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini 多模態模型分析中...</span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                正在辨識商店、日期、品項名稱、單價並自動比對合適的開銷分類與生活標籤
              </p>
            </div>
          ) : (
            /* Upload Options */
            <div className="space-y-4">
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelected(file);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelected(file);
                }}
              />

              {/* Take Photo Button (Primary for mobile) */}
              <button
                onClick={async () => {
                  nativeService.triggerHaptic('light');
                  if (nativeService.isNative()) {
                    try {
                      const dataUrl = await nativeService.takePhoto();
                      if (dataUrl) {
                        setSelectedImage(dataUrl);
                        startAiAnalysis(dataUrl);
                      }
                    } catch (err: any) {
                      setErrorMessage(err.message || '相機開啟失敗');
                    }
                  } else {
                    cameraInputRef.current?.click();
                  }
                }}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 active:scale-[0.99] transition-all"
              >
                <Camera className="w-5 h-5" />
                <span className="text-sm font-semibold">開啟相機拍照</span>
              </button>

              {/* Upload from Photo Album / Files */}
              <button
                onClick={async () => {
                  nativeService.triggerHaptic('light');
                  if (nativeService.isNative()) {
                    try {
                      const dataUrl = await nativeService.pickPhoto();
                      if (dataUrl) {
                        setSelectedImage(dataUrl);
                        startAiAnalysis(dataUrl);
                      }
                    } catch (err: any) {
                      setErrorMessage(err.message || '相簿選取失敗');
                    }
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="w-full py-4 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium flex items-center justify-center gap-3 border border-slate-200/80 active:scale-[0.99] transition-all"
              >
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-semibold">從相簿或電腦選擇照片</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-xs text-slate-400">或快速體驗</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Quick Demo Sample */}
              <button
                onClick={handleUseDemo}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>一鍵載入示範發票（7-11 咖啡與零食明細）</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
