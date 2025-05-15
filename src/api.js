// src/api.js
import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5173',  // URL ที่เชื่อมต่อ API ของคุณ
  headers: {
    'Content-Type': 'application/json'
  }
})

export const signup = (userData) => API.post('/signup', userData)  // แน่ใจว่า path /signup ใช้ได้
export const login = (userData) => API.post('/login', userData)
