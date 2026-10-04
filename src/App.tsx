import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, type TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { LifestyleView } from './components/LifestyleView';
import { SettingsView } from './components/SettingsView';
import { ScannerModal } from './components/ScannerModal';
import { ReviewModal } from './components/ReviewModal';
import { MobileConnectModal } from './components/MobileConnectModal';

import type { Receipt, ExpenseItem, Category, ReceiptScanResult, CurrencyInfo } from './types/receipt';
import { db, initializeDatabase } from './db/database';
import { calculateLifestyleScore } from './services/lifestyleService';
import { nativeService } from './services/nativeService';
import { storageService } from './services/storageService';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [baseCurrency, setBaseCurrency] = useState<CurrencyInfo>(() => storageService.getBaseCurrency());
  const [categories, setCategories] = useState<Category[]>([]);
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [allItems, setAllItems] = useState<ExpenseItem[]>([]);

  // Scanner, Review & Mobile Connect States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [scannedImageBlob, setScannedImageBlob] = useState<string | null>(null);

  // Load Database Data
  const loadData = useCallback(async () => {
    await initializeDatabase();
    const loadedCats = await db.categories.toArray();
    const loadedReceipts = await db.receipts.toArray();
    const loadedItems = await db.items.toArray();

    setCategories(loadedCats);
    setAllReceipts(loadedReceipts);
    setAllItems(loadedItems);
  }, []);

  useEffect(() => {
    loadData();
    nativeService.init();
  }, [loadData]);

  // Filter receipts & items by selected month
  const monthReceipts = allReceipts.filter((r) => r.purchaseDate?.startsWith(selectedMonth));
  const monthItems = allItems.filter((it) => it.purchaseDate?.startsWith(selectedMonth));

  // Compute Lifestyle Score for the current month
  const lifestyleScore = calculateLifestyleScore(monthItems.length > 0 ? monthItems : allItems);

  const handleScanComplete = (result: ReceiptScanResult, imageBlob: string) => {
    setScanResult(result);
    setScannedImageBlob(imageBlob);
    setIsReviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setCurrentTab('settings')}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-5">
        {currentTab === 'dashboard' && (
          <DashboardView
            receipts={monthReceipts}
            items={monthItems}
            categories={categories}
            lifestyleScore={lifestyleScore}
            baseCurrency={baseCurrency}
            onStartScan={() => setIsScannerOpen(true)}
            onViewHistory={() => setCurrentTab('history')}
            onViewLifestyle={() => setCurrentTab('lifestyle')}
            onSelectReceipt={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            receipts={allReceipts}
            items={allItems}
            categories={categories}
            baseCurrency={baseCurrency}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'lifestyle' && (
          <LifestyleView
            items={monthItems.length > 0 ? monthItems : allItems}
            lifestyleScore={lifestyleScore}
            baseCurrency={baseCurrency}
            onStartScan={() => setIsScannerOpen(true)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            categories={categories}
            onCategoriesChanged={loadData}
            onCurrencyChanged={() => setBaseCurrency(storageService.getBaseCurrency())}
            onDataReset={loadData}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onStartScan={() => setIsScannerOpen(true)}
      />

      {/* Camera / Upload Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        categories={categories}
        baseCurrency={baseCurrency}
        onScanComplete={handleScanComplete}
      />

      {/* Itemized Review & Category Editing Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        scanResult={scanResult}
        imageBlob={scannedImageBlob}
        categories={categories}
        baseCurrency={baseCurrency}
        onSaveSuccess={loadData}
      />

      {/* Mobile Connect QR Modal */}
      <MobileConnectModal
        isOpen={isMobileConnectOpen}
        onClose={() => setIsMobileConnectOpen(false)}
      />
    </div>
  );
}

export default App;
