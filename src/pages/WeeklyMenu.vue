<template>
    <div class="weekly-menu-container">
      <h1>ตารางเมนูอาหารรายสัปดาห์</h1>
  
      <div class="menu-table">
        <h2>เมนูอาหารตามประเภทที่เลือก</h2>
        <table>
          <thead>
            <tr>
              <th>วัน</th>
              <th>เมนูอาหาร</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>วันจันทร์</td>
              <td>เมนูที่คุณเลือก</td>
            </tr>
            <tr>
              <td>วันอังคาร</td>
              <td>เมนูที่คุณเลือก</td>
            </tr>
            <!-- เพิ่มแถวสำหรับทุกวันในสัปดาห์ -->
          </tbody>
        </table>
      </div>
  
      <button @click="goBack">กลับ</button>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const goBack = () => {
    router.push('/menu-selection') // กลับไปยังหน้าเลือกประเภทเมนู
  }
  </script>
  
  <style scoped>
  .weekly-menu-container {
    padding: 2rem;
    background-color: #f4f7ff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    color: #6c63ff;
  }
  
  .menu-table {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  
  th, td {
    padding: 12px;
    border: 1px solid #ddd;
  }
  
  button {
    margin-top: 1rem;
    padding: 0.8rem 1.6rem;
    background-color: #6c63ff;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: background-color 0.3s ease;
  }
  
  button:hover {
    background-color: #5548c8;
  }
  </style>
  