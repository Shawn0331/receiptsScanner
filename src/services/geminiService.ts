import type { ReceiptScanResult, Category, CurrencyInfo } from '../types/receipt';
import { storageService } from './storageService';

export async function parseReceiptWithGemini(
  base64Image: string,
  categories: Category[],
  baseCurrency?: CurrencyInfo
): Promise<ReceiptScanResult> {
  const apiKey = storageService.getApiKey();
  let modelName = storageService.getModelName();
  if (!modelName || modelName.startsWith('gemini-2') || modelName.startsWith('gemini-1')) {
    modelName = 'gemini-3.8-flash';
  }
  const targetCurrency = baseCurrency || storageService.getBaseCurrency();

  // If no API key is provided, return a realistic demo parse result
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockScanResult(targetCurrency);
  }

  // Extract pure base64 and mime type from data URL
  const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('無效的圖片格式，請重新選擇發票照片');
  }

  const mimeType = match[1];
  const pureBase64 = match[2];

  const categoryNames = categories.map((c) => c.name).join('、');
  const todayStr = new Date().toISOString().split('T')[0];

  const prompt = `你是一個頂級的國際發票收據結構化辨識專家與生活風格分析師。
使用者的居住地主要貨幣為：${targetCurrency.name} (代碼: ${targetCurrency.code}, 符號: ${targetCurrency.symbol})。

請仔細分析這張發票/收據照片，提取以下結構化資訊：
1. 商店名稱 (storeName)、消費日期 (purchaseDate, 格式 YYYY-MM-DD，若模糊請使用 ${todayStr})。
2. 辨識收據所在的國家/發行貨幣代碼 (detectedCurrency)，例如：JPY (日圓)、MYR (馬幣)、TWD (新台幣)、USD (美元)、EUR (歐元)、THB (泰銖)、SGD (新幣) 等。
3. 匯率換算 (exchangeRate)：
   - 若 detectedCurrency 與 ${targetCurrency.code} 相同，則 exchangeRate 為 1.0。
   - 若 detectedCurrency 與 ${targetCurrency.code} 不同（例如拿了日本 JPY 的收據，但使用者居住在馬來西亞 MYR），請根據發票日期或近期市場參考匯率計算「1 單位原幣兌換為多少 ${targetCurrency.code}」（例如 1 JPY ≈ 0.031 MYR，則 exchangeRate 為 0.031；若 1 USD ≈ 4.72 MYR，則 exchangeRate 為 4.72）。
4. 金額換算：
   - originalTotalAmount: 發票上的原幣別總額。
   - totalAmount: 轉換為 ${targetCurrency.code} 的總金額（四捨五入至小數點後 2 位；若是整數亦可）。
5. 品項明細 (items)：
   - itemName: 商品品項名稱 (繁體中文或保持原名)。
   - originalPrice: 發票上的原幣單價。
   - price: 換算為 ${targetCurrency.code} 後的單價 (四捨五入至小數點後 2 位)。
   - quantity: 數量 (預設 1)。
   - suggestedCategory: 從 [${categoryNames}] 中挑選最貼切的分類，若無法確定請填「其他開銷」。
   - lifestyleTags: 可包含 caffeine (咖啡因/茶), sugar (甜點手搖炸物), healthy (生鮮蔬果健康), home_cooking (超市食材料理), dining_out (餐廳外食), entertainment (娛樂), essential (日常日用必備)。
   - funNote: 一句超短趣味微備註 (例如："☕ 咖啡因加載", "🍟 罪惡感滿滿", "🥦 健康自律")。
6. aiComment: 一句幽默溫馨的 AI 生活觀察短評。若為外幣海外消費，可幽默提及出國旅行/海外採購！

請務必返回純 JSON 格式，格式範例如下：
{
  "storeName": "FamilyMart 日本東京門市",
  "purchaseDate": "${todayStr}",
  "detectedCurrency": "JPY",
  "exchangeRate": 0.031,
  "originalTotalAmount": 1500,
  "totalAmount": 46.5,
  "items": [
    {
      "itemName": "特濃黑咖啡 (Black Coffee)",
      "originalPrice": 200,
      "price": 6.2,
      "quantity": 1,
      "suggestedCategory": "餐飲食品",
      "lifestyleTags": ["caffeine"],
      "funNote": "☕ 東京街頭續命咖啡"
    },
    {
      "itemName": "日式生乳卷 (Roll Cake)",
      "originalPrice": 1300,
      "price": 40.3,
      "quantity": 1,
      "suggestedCategory": "餐飲食品",
      "lifestyleTags": ["sugar"],
      "funNote": "🍰 出國旅遊必吃甜點"
    }
  ],
  "aiComment": "在日本便利商店大買甜點與黑咖啡，出國就是要好好犒賞自己！✈️🍰"
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: pureBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP 錯誤 ${response.status}`;
    throw new Error(`Gemini API 呼叫失敗：${errorMsg}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API 未回傳辨識文字');
  }

  try {
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: ReceiptScanResult = JSON.parse(cleanedJson);
    return parsed;
  } catch (err) {
    console.error('Failed to parse JSON from Gemini:', rawText, err);
    throw new Error('解析 AI 回傳結果失敗，請確保發票影像清晰並重試。');
  }
}

// Demo mock data with overseas currency conversion
export function getMockScanResult(baseCurrency?: CurrencyInfo): ReceiptScanResult {
  const today = new Date().toISOString().split('T')[0];
  const target = baseCurrency || storageService.getBaseCurrency();

  // If user base is MYR, simulate a Japanese JPY receipt!
  // If user base is JPY, simulate a US USD receipt!
  const isTargetMYR = target.code === 'MYR';
  const detectedCurrency = isTargetMYR ? 'JPY' : 'USD';
  const exchangeRate = isTargetMYR ? 0.031 : 155; // 1 JPY = 0.031 MYR; or 1 USD = 155 JPY
  const originalTotal = isTargetMYR ? 2500 : 25;
  const convertedTotal = Math.round(originalTotal * exchangeRate * 100) / 100;

  return {
    storeName: isTargetMYR ? 'FamilyMart 日本東京涉谷門市' : 'Starbucks Reserve Seattle',
    purchaseDate: today,
    detectedCurrency: detectedCurrency,
    exchangeRate: exchangeRate,
    originalTotalAmount: originalTotal,
    totalAmount: convertedTotal,
    items: [
      {
        itemName: isTargetMYR ? '極上黑咖啡 (Black Coffee)' : 'Nitro Cold Brew Coffee',
        originalPrice: isTargetMYR ? 300 : 6,
        price: Math.round((isTargetMYR ? 300 : 6) * exchangeRate * 100) / 100,
        quantity: 1,
        suggestedCategory: '餐飲食品',
        lifestyleTags: ['caffeine'],
        funNote: '☕ 海外旅行充能咖啡因',
      },
      {
        itemName: isTargetMYR ? '北海道特濃牛乳生乳卷' : 'Chocolate Croissant',
        originalPrice: isTargetMYR ? 1200 : 7,
        price: Math.round((isTargetMYR ? 1200 : 7) * exchangeRate * 100) / 100,
        quantity: 1,
        suggestedCategory: '餐飲食品',
        lifestyleTags: ['sugar'],
        funNote: '🍰 旅遊必備甜點罪惡感',
      },
      {
        itemName: isTargetMYR ? '休足時間舒緩貼布 (6入)' : 'Stainless Steel Tumbler',
        originalPrice: isTargetMYR ? 1000 : 12,
        price: Math.round((isTargetMYR ? 1000 : 12) * exchangeRate * 100) / 100,
        quantity: 1,
        suggestedCategory: '日常用品',
        lifestyleTags: ['essential'],
        funNote: '🧻 自由行萬步救援神物',
      },
    ],
    aiComment: `（示範資料：海外日本發票自動換算）偵測到日圓 (JPY) 發票，已依參考匯率換算為你的居住地貨幣 ${target.name}！✈️✨`,
  };
}
