<script setup>                                              // código do componente (Vue 3, script setup)
// App.vue — moldura de todas as telas: cabeçalho em cima, tela no meio, rodapé embaixo.
import AppHeader from './components/AppHeader.vue' // o menu de navegação
</script>

<template>                                                  <!-- início do HTML do app -->
  <div class="min-h-screen flex flex-col"> <!-- coluna que ocupa a tela toda -->
    <AppHeader /> <!-- menu -->
    <main class="flex-1 w-full max-w-6xl mx-auto px-4 py-6"> <!-- conteúdo centralizado, cresce para empurrar o rodapé -->
      <RouterView /> <!-- aqui entra a tela da rota atual -->
    </main>
    <footer class="bg-azul-escuro text-white text-sm text-center py-4"> <!-- rodapé azul escuro -->
      Projeto Integrador · SENAI · Análise de Desenvolvimento de Sistemas <!-- texto do rodapé -->
    </footer>                                               <!-- fim do rodapé -->
  </div>
</template>
