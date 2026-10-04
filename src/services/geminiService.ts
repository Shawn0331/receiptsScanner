import type { ReceiptScanResult, Category } from '../types/receipt';
import { storageService } from './storageService';

export async function parseReceiptWithGemini(
  base64Image: string,
  categories: Category[]
): Promise<ReceiptScanResult> {
  const apiKey = storageService.getApiKey();
  const modelName = storageService.getModelName();

  // If no API key is provided, return a realistic demo parse result so the user can test the UX immediately
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate AI processing delay
    return getMockScanResult();
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

  const prompt = `你是一個頂級的發票收據結構化辨識專家與生活風格分析師。
請仔細分析這張發票/收據照片，提取以下結構化資訊，並以繁體中文 (台灣) 與標準 JSON 格式輸出：

可選的消費分類包含：[${categoryNames}]。
請將每個品項分類至上述清單中最貼切的一項。若無法確定，請歸類為「其他開銷」。

此外，請為品項標記生活風格標籤 (lifestyleTags)：
- caffeine: 咖啡、濃縮、茶飲、含咖啡因飲料
- sugar: 珍珠奶茶、含糖飲料、甜點、蛋糕、手搖飲、炸物、零食
- healthy: 生鮮蔬果、雞胸肉、蛋、生鮮肉品、沙拉、燕麥、無糖優格
- home_cooking: 料理食材、調味料、米、生鮮超市食材
- dining_out: 餐廳、外食、便當、快餐
- entertainment: 電影、遊戲、KTV、玩具
- essential: 衛生紙、沐浴乳、日常必備品

並為特別有特色的品項給予一句超短趣味備註 (funNote)，例如：「☕ 咖啡因加載」、「🍟 罪惡感滿滿」、「🥦 健康自律」、「🏠 居家大廚」。

最後，給予這張發票一句幽默溫馨的 AI 生活觀察短評 (aiComment)。
如果發票上的日期缺失或模糊，請推算或使用今日日期（${todayStr}）。

請務必返回純 JSON 格式，不要包含任何額外的 Markdown 標籤或對話文字，格式範例如下：
{
  "storeName": "全聯福利中心",
  "purchaseDate": "${todayStr}",
  "totalAmount": 268,
  "items": [
    {
      "itemName": "林鳳營鮮乳",
      "price": 92,
      "quantity": 1,
      "suggestedCategory": "生鮮超市",
      "lifestyleTags": ["healthy", "home_cooking"],
      "funNote": "🥦 補給優質蛋白質"
    },
    {
      "itemName": "熱美式咖啡",
      "price": 45,
      "quantity": 1,
      "suggestedCategory": "餐飲食品",
      "lifestyleTags": ["caffeine"],
      "funNote": "☕ 續命咖啡因"
    }
  ],
  "aiComment": "採買了鮮乳跟咖啡，看來今天生活充滿朝氣！"
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
    // Clean potential markdown blocks if any
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: ReceiptScanResult = JSON.parse(cleanedJson);
    return parsed;
  } catch (err) {
    console.error('Failed to parse JSON from Gemini:', rawText, err);
    throw new Error('解析 AI 回傳結果失敗，請確保發票影像清晰並重試。');
  }
}

// Demo mock data when no API Key is present
export function getMockScanResult(): ReceiptScanResult {
  const today = new Date().toISOString().split('T')[0];
  return {
    storeName: '7-ELEVEN 概念門市',
    purchaseDate: today,
    totalAmount: 185,
    items: [
      {
        itemName: '特大杯美式咖啡 (冰)',
        price: 60,
        quantity: 1,
        suggestedCategory: '餐飲食品',
        lifestyleTags: ['caffeine'],
        funNote: '☕ 靈魂充能咖啡因',
      },
      {
        itemName: '波的多洋芋片蚵仔煎風味',
        price: 35,
        quantity: 1,
        suggestedCategory: '餐飲食品',
        lifestyleTags: ['sugar'],
        funNote: '🍟 罪惡感療癒零食',
      },
      {
        itemName: '舒潔抽取式衛生紙',
        price: 90,
        quantity: 1,
        suggestedCategory: '日常用品',
        lifestyleTags: ['essential'],
        funNote: '🧻 居家生存必備物資',
      },
    ],
    aiComment: '（示範資料）一杯冰美式加上洋芋片，打工人的經典療癒小確幸！☕✨',
  };
}
