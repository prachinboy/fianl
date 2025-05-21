# 🔥 ระบบแนะนำเมนูด้วย Association Rule (จับมือทำตั้งแต่ต้น)
# ✅ ใช้ Python + pandas + mlxtend (ต้องติดตั้งก่อน)

# ติดตั้งคำสั่งใน Terminal (ครั้งเดียว)
# pip install pandas mlxtend

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

# 🔹 ขั้นตอนที่ 1: เตรียม log จำลอง (เมนูที่ถูกแนะนำในแต่ละรอบ)
logs = [
    ["ลาบหมู", "น้ำตกหมู", "ต้มแซ่บกระดูกอ่อน"],
    ["หมูผัดพริก", "ลาบหมู", "ข้าวผัดหมู"],
    ["ลาบหมู", "ไก่ทอด", "ต้มแซ่บกระดูกอ่อน"],
    ["หมูทอดกระเทียม", "ข้าวผัดหมู", "น้ำตกหมู"],
    ["ข้าวผัดหมู", "ไข่เจียว", "ต้มจืดเต้าหู้หมูสับ"],
    ["น้ำตกหมู", "หมูย่างจิ้มแจ่ว", "ข้าวเหนียว"],
    ["ลาบหมู", "ต้มแซ่บกระดูกอ่อน", "หมูย่างจิ้มแจ่ว"],
    ["ต้มแซ่บกระดูกอ่อน", "ต้มจืดเต้าหู้หมูสับ"],
    ["ลาบหมู", "หมูผัดพริก"],
    ["น้ำตกหมู", "หมูผัดพริก"]
]

# 🔹 ขั้นตอนที่ 2: แปลงข้อมูลให้อยู่ในรูปแบบตาราง
te = TransactionEncoder()
te_ary = te.fit(logs).transform(logs)
df = pd.DataFrame(te_ary, columns=te.columns_)

# 🔹 ขั้นตอนที่ 3: ใช้ Apriori เพื่อหาคู่เมนูที่ชอบร่วม
frequent_itemsets = apriori(df, min_support=0.3, use_colnames=True)

# 🔹 ขั้นตอนที่ 4: สร้างกฎแนะนำเมนู (Association Rules)
rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.7)

# 🔹 ขั้นตอนที่ 5: แสดงผลลัพธ์แบบอ่านง่าย
def show_rules(rules_df):
    for _, row in rules_df.iterrows():
        antecedents = ', '.join(list(row["antecedents"]))
        consequents = ', '.join(list(row["consequents"]))
        confidence = round(row["confidence"] * 100, 2)
        print(f"ถ้าผู้ใช้เลือก: [{antecedents}] → แนะนำ: [{consequents}] (ความมั่นใจ: {confidence}%)")

show_rules(rules)