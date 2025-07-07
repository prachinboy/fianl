import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast, { POSITION } from "vue-toastification"
import "vue-toastification/dist/index.css"
import './style.css'

const app = createApp(App)

app.use(router)
app.use(Toast, {
  position: POSITION.TOP_CENTER,
  timeout: 3000, // 3 วินาทีแล้วหาย
})

app.mount('#app')
