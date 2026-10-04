# ReceiptLens 手機原生 App (.apk) 建置與安裝指南

我們已經成功將專案升級為支援 **Capacitor 原生應用程式架構**，並配置了完整的 Android 原生工程與 4 大硬體功能整合：
- 📸 **原生相機與相簿** (`@capacitor/camera`)
- 📳 **觸覺震動回饋** (`@capacitor/haptics`)
- 🎨 **沉浸式狀態列與啟動畫面** (`@capacitor/status-bar`, `splash-screen`)
- 🔔 **每晚記帳定時提醒通知** (`@capacitor/local-notifications`)

---

## 途徑一：GitHub Actions 雲端自動打包（最推薦，免裝 Android Studio）

專案中已配置好 `.github/workflows/build-apk.yml`。

### 操作步驟：
1. **將專案推送到你的 GitHub 儲存庫**：
   ```bash
   git init
   git add .
   git commit -m "feat: receiptlens app with capacitor & github actions"
   git branch -M main
   git remote add origin https://github.com/<你的用戶名>/receiptsScanner.git
   git push -u origin main
   ```
2. **自動編譯**：
   - 前往你的 GitHub 專案頁面 ➔ 點擊上方 **「Actions」** 分頁。
   - 會看到名為 **「Build Android APK」** 的工作流正在自動編譯（約 2~3 分鐘）。
3. **下載安裝**：
   - 編譯完成後，點擊進入該次執行紀錄，在下方 **Artifacts（產出物）** 區域即可看到 `ReceiptLens-Android-Debug-APK`。
   - 用手機瀏覽器打開該 GitHub 頁面點擊下載解壓縮，即可直接在 Android 手機上點擊安裝 `.apk` 體驗！

---

## 途徑二：本地端使用 Android Studio 編譯

如果你的電腦上已安裝 **Android Studio**：

1. **開啟 Android 專案**：
   ```bash
   npx cap open android
   ```
   *（這會自動喚起 Android Studio 並載入 `android/` 目錄）*
2. **在實體手機上執行**：
   - 手機開啟「開發者人員選項」並啟用「USB 偵錯」。
   - 用傳輸線連接電腦，在 Android Studio 上方選單選擇你的手機，點擊綠色 **Run (▶)** 按鈕，即可自動安裝至手機。
3. **產出 APK 檔案**：
   - 在 Android Studio 上方選單選擇：`Build` ➔ `Build Bundle(s) / APK(s)` ➔ `Build APK(s)`。
   - 編譯完成後點擊彈出的「locate」，即可取得 `app-debug.apk`。

---

## 日常修改程式碼後的同步指令

如果修改了前端網頁程式碼（如 React UI、樣式或邏輯），只需在終端機執行：
```bash
npm run build
npx cap sync
```
這會自動將最新的網頁打包檔案複製到原生 `android/` 目錄中！
