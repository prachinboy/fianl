import recommendV3 from './recommendV3'
import recipes from '@/data/recipes.json'
import axios from 'axios'
import {
  fetchLogs,
  transformToTransactions,
  runApriori,
  suggestFromApriori
} from './apriori'

// input: userInput = { meats, veggies, methods, favorite }
// liked = ['ข้าวผัดไข่', 'ต้มจืด']
export const recommendHybrid = async (userInput, liked = []) => {
  // ✅ 1. Content-based จาก V3
  const resultFromV3 = recommendV3(userInput, recipes)

  // ✅ 2. Apriori
  const logs = await fetchLogs()
  const transactions = transformToTransactions(logs)
  const rules = await runApriori(transactions, 0.3, 0.6)
  const aprioriMenus = suggestFromApriori(liked, rules)

  // ✅ 3. LSTM API
  let lstmMenus = []
  try {
    const res = await axios.post('http://127.0.0.1:5000/recommend-lstm', {
      liked_dishes: liked
    })
    lstmMenus = res.data.recommendations || []
  } catch (err) {
    console.error('❌ LSTM API Error:', err)
  }

  // ✅ 4. รวมผลลัพธ์ทั้งหมด ไม่ให้ซ้ำ
  const combined = [...resultFromV3]

  const addIfNotExist = (menuName) => {
    if (!combined.find(r => r.name === menuName)) {
      combined.push({ name: menuName, type: 'อื่นๆ', score: 0.5 })
    }
  }

  aprioriMenus.forEach(addIfNotExist)
  lstmMenus.forEach(addIfNotExist)

  // ✅ 5. คืน 7 รายการแรก
  return combined.slice(0, 7)
}
