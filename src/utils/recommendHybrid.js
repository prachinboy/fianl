import recommendV3 from './recommendV3'
import recipes from '@/data/recipes.json'
import {
  fetchLogs,
  transformToTransactions,
  runApriori,
  suggestFromApriori
} from './apriori'

// input: userInput = { meats, veggies, methods, favorite }
// liked = ['ข้าวผัดไข่', 'ต้มจืด']
export const recommendHybrid = async (userInput, liked = []) => {
  // ✅ 1. Content-based จาก V3 (ส่ง recipes เข้า)
  const resultFromV3 = recommendV3(userInput, recipes)

  // ✅ 2. Apriori จาก logs
  const logs = await fetchLogs()
  const transactions = transformToTransactions(logs)
  const rules = await runApriori(transactions, 0.3, 0.6)
  const aprioriMenus = suggestFromApriori(liked, rules)

  // ✅ 3. รวมผลลัพธ์ ไม่ให้ซ้ำ
  const combined = [...resultFromV3]

  aprioriMenus.forEach(menu => {
    if (!combined.find(r => r.name === menu)) {
      combined.push({ name: menu, type: 'อื่นๆ', score: 0.5 })
    }
  })

  // ✅ 4. คืนเมนู 7 รายการ
  return combined.slice(0, 7)
}
