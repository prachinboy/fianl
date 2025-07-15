
import { recommendHybrid } from './src/utils/recommendHybrid.node.js';

const liked_dishes = ["ผัดกะเพราไก่", "ต้มยำกุ้ง", "แกงเขียวหวานไก่"];

const testCases = [
  { name: "1. ไม่เลือกอะไรเลย", input: { meats: [], veggies: [], methods: [], favorite: "" } },
  { name: "2. เลือกเนื้อสัตว์อย่างเดียว (ไก่)", input: { meats: ["ไก่"], veggies: [], methods: [], favorite: "" } },
  { name: "3. เลือกวิธีทำไม่ตรงกับเนื้อสัตว์ (ต้ม + ไก่)", input: { meats: ["ไก่"], veggies: [], methods: ["ต้ม"], favorite: "" } },
  { name: "4. กรอกเมนูโปรด (ต้มยำกุ้ง)", input: { meats: [], veggies: [], methods: [], favorite: "ต้มยำกุ้ง" } },
  { name: "5. ไม่เลือกอะไรเลย แต่ LSTM ควรแนะนำได้", input: { meats: [], veggies: [], methods: [], favorite: "" } }
];

(async () => {
  for (const tc of testCases) {
    console.log(`\n===== ${tc.name} =====`);
    const results = await recommendHybrid(tc.input, liked_dishes);
    console.log(results.slice(0, 5));
  }
})();
