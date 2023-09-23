import App from '../app.vue'
import { createSSRApp } from 'vue'

const app = createSSRApp(App)
app.mount('#root')
