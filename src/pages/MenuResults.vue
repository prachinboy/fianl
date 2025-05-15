<template>
    <div class="menu-results-container">
      <h1>เมนูอาหารที่คุณสามารถทำได้ (ในสัปดาห์นี้)</h1>
  
      <!-- ตารางแสดงผลเมนูอาหารรายสัปดาห์ -->
      <div v-if="menuItems.length">
        <table class="menu-table">
          <thead>
            <tr>
              <th>วัน</th>
              <th>เมนูอาหาร</th>
              <th>ประเภท</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in menuItems" :key="index">
              <td>{{ item.day }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.type }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>ไม่มีเมนูที่สามารถทำได้ในสัปดาห์นี้</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  // ตัวอย่างข้อมูลเมนู
  const menuItems = ref([
    { day: 'จันทร์', name: 'ไก่ทอด', type: 'เนื้อสัตว์' },
    { day: 'อังคาร', name: 'ผัดผัก', type: 'ผัก' },
    { day: 'พุธ', name: 'ข้าวต้มหมู', type: 'เนื้อสัตว์' },
    { day: 'พฤหัสบดี', name: 'ต้มยำกุ้ง', type: 'อาหารทะเล' },
    { day: 'ศุกร์', name: 'สลัดผัก', type: 'ผัก' },
    { day: 'เสาร์', name: 'ข้าวผัดไข่', type: 'ข้าว' },
    { day: 'อาทิตย์', name: 'แกงจืดหมูสับ', type: 'เนื้อสัตว์' },
  ])
  </script>
  
  <style scoped>
  .menu-results-container {
    max-width: 900px;
    margin: 2rem auto;
    text-align: center;
    background: #f9f9f9;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    font-size: 2rem;
    color: #6c63ff;
    margin-bottom: 1.5rem;
  }
  
  .menu-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 auto;
    text-align: left;
  }
  
  .menu-table th,
  .menu-table td {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
  }
  
  .menu-table th {
    background-color: #6c63ff;
    color: white;
    font-weight: bold;
  }
  
  .menu-table tr:nth-child(even) {
    background-color: #f3f3f3;
  }
  
  .menu-table tr:nth-child(odd) {
    background-color: #fafafa;
  }
  
  .menu-table tr:hover {
    background-color: #f2f2f2;
  }
  
  .menu-table td {
    font-size: 1.1rem;
  }
  
  .menu-table td:nth-child(2) {
    font-weight: bold;
  }
  </style>
  