// vite.config.js — configuração do Vite (o programa que roda e empacota o front).
import { defineConfig } from 'vite' // defineConfig: ajuda o editor a sugerir as opções
import vue from '@vitejs/plugin-vue' // plugin que ensina o Vite a ler arquivos .vue
import tailwindcss from '@tailwindcss/vite' // plugin do Tailwind: gera o CSS das classes que usamos

export default defineConfig({ // exporta a configuração
  plugins: [vue(), tailwindcss()], // liga os dois plugins
  server: { port: 5173 }, // o site abre em http://localhost:5173
})
