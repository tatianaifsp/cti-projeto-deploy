// ============================================================================
// main.js — onde o site começa: cria o app Vue e liga Pinia, rotas, fontes e CSS.
// ============================================================================
import { createApp } from 'vue' // createApp: cria a aplicação Vue
import { createPinia } from 'pinia' // createPinia: cria o gerenciador de estado
import '@fontsource/barlow/400.css' // fonte Barlow normal
import '@fontsource/barlow/600.css' // fonte Barlow seminegrito
import '@fontsource/barlow/700.css' // fonte Barlow negrito
import './style.css' // Tailwind + cores do SENAI
import App from './App.vue' // componente raiz
import router from './router' // as rotas
import { useAuthStore } from './stores/auth' // store de login

const app = createApp(App) // cria o app
app.use(createPinia()) // liga o Pinia (as stores passam a funcionar)
useAuthStore().validarSessao() // confere se o token salvo ainda vale
app.use(router) // liga as rotas
app.mount('#app') // desenha o app dentro de <div id="app">
