import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import vuetify from './plugins/vuetify'
import { vueQueryPluginOptions } from './plugins/vue-query'
import App from './App.vue'
import router from './router'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(VueQueryPlugin, vueQueryPluginOptions)

app.mount('#app')
