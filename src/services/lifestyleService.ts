import type { ExpenseItem, LifestyleScore } from '../types/receipt';

export function calculateLifestyleScore(items: ExpenseItem[]): LifestyleScore {
  let caffeineCount = 0;
  let caffeineSpending = 0;

  let guiltyCount = 0;
  let guiltySpending = 0;

  let healthyCount = 0;
  let healthySpending = 0;

  let homeCookingSpending = 0;
  let diningOutSpending = 0;

  for (const item of items) {
    const cost = item.price * (item.quantity || 1);
    const tags = item.lifestyleTags || [];

    if (tags.includes('caffeine')) {
      caffeineCount += (item.quantity || 1);
      caffeineSpending += cost;
    }
    if (tags.includes('sugar')) {
      guiltyCount += (item.quantity || 1);
      guiltySpending += cost;
    }
    if (tags.includes('healthy')) {
      healthyCount += (item.quantity || 1);
      healthySpending += cost;
    }
    if (tags.includes('home_cooking')) {
      homeCookingSpending += cost;
    }
    if (tags.includes('dining_out')) {
      diningOutSpending += cost;
    }
  }

  // Determine persona title & description
  let personaTitle = '✨ 探索生活成分的質感旅人';
  let personaDescription = '生活剛剛起步，記帳數據正持續累積中...';

  if (items.length > 0) {
    if (caffeineCount >= 5 || caffeineSpending > 300) {
      personaTitle = '☕ 靠冰美式續命的高階社畜';
      personaDescription = `本期已注入 ${caffeineCount} 杯咖啡因！血液中流淌的不是熱血，是冷萃與靈魂的堅持。`;
    } else if (guiltyCount >= 4 || guiltySpending > 400) {
      personaTitle = '🧋 快樂至上！全糖療癒家';
      personaDescription = '人生苦短，及時行樂。甜點與炸物是生活最溫柔的擁抱，熱量明天再說！';
    } else if (healthyCount >= 4 || homeCookingSpending > diningOutSpending * 1.5) {
      personaTitle = '🥦 精緻自律的料理魔法師';
      personaDescription = '生鮮超市與健康飲食佔領了生活高地，懂得照顧自己的身心與荷包。';
    } else if (diningOutSpending > 500) {
      personaTitle = '🍱 街頭巷尾的外食冒險家';
      personaDescription = '廚房是裝飾品，整座城市的餐廳都是你的專屬外食食堂。';
    } else {
      personaTitle = '🌿 均衡生活的智慧節奏師';
      personaDescription = '飲食、休閒與日用開銷維持著優雅的平衡，生活品質滿分！';
    }
  }

  return {
    caffeineCount,
    caffeineSpending,
    guiltyCount,
    guiltySpending,
    healthyCount,
    healthySpending,
    homeCookingSpending,
    diningOutSpending,
    personaTitle,
    personaDescription,
  };
}
