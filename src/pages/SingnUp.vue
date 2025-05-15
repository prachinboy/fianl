template
  div class=flex items-center justify-center min-h-screen bg-gray-100
    div class=w-full max-w-md p-8 bg-white rounded-lg shadow-lg
      h2 class=text-2xl font-bold text-center mb-6 text-gray-800สมัครสมาชิกh2
      form class=space-y-4
        div
          label class=block mb-1 text-gray-600 for=usernameชื่อผู้ใช้label
          input type=text id=username class=w-full px-4 py-2 border rounded-md focusoutline-none focusring-2 focusring-blue-400
        div
        div
          label class=block mb-1 text-gray-600 for=emailอีเมลlabel
          input type=email id=email class=w-full px-4 py-2 border rounded-md focusoutline-none focusring-2 focusring-blue-400
        div
        div
          label class=block mb-1 text-gray-600 for=passwordรหัสผ่านlabel
          input type=password id=password class=w-full px-4 py-2 border rounded-md focusoutline-none focusring-2 focusring-blue-400
        div
        button type=submit class=w-full bg-blue-500 text-white py-2 rounded-md hoverbg-blue-600
          สมัครสมาชิก
        button
      form
    div
  div
template

script setup
 ตอนนี้ยังไม่ต้องมีสคริปต์
script

style scoped
 ตอนนี้ใช้ TailwindCSS เป็นหลัก ยังไม่ต้องเขียน CSS เพิ่ม 
style
