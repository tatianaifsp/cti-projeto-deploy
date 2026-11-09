<script setup>                                              // código do componente (Vue 3, script setup)
// AppHeader.vue — menu do topo. No celular vira um botão "☰" que abre/fecha a lista.
import { ref } from 'vue' // ref: guarda se o menu está aberto
import { useRouter } from 'vue-router' // useRouter: para trocar de tela pelo código
import { useAuthStore } from '../stores/auth' // quem está logado

const auth = useAuthStore() // acesso ao login
const router = useRouter() // acesso às rotas
const aberto = ref(false) // menu do celular começa fechado

function sair() { // clique em "Sair"
  auth.sair() // apaga a sessão
  aberto.value = false // fecha o menu
  router.push('/login') // vai para o login
}
</script>

<template>                                                  <!-- início do HTML do cabeçalho -->
  <header class="bg-azul text-white shadow"> <!-- faixa azul SENAI -->
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between"> <!-- logo à esquerda, menu à direita -->
      <RouterLink to="/" class="font-bold text-xl tracking-tight" @click="aberto = false"> <!-- logo: leva para a página inicial e fecha o menu -->
        CTI <span class="text-white/70">Insights</span> <!-- nome do projeto -->
      </RouterLink>                                         <!-- fim do logo -->
      <button class="md:hidden text-2xl px-2" @click="aberto = !aberto" aria-label="Abrir menu">☰</button> <!-- só aparece no celular -->

      <nav class="hidden md:flex items-center gap-5 text-sm font-semibold"> <!-- menu do computador -->
        <RouterLink to="/" class="hover:underline">Início</RouterLink> <!-- link Início -->
        <template v-if="auth.logado"> <!-- links só para quem entrou -->
          <RouterLink to="/upload" class="hover:underline">Enviar planilha</RouterLink> <!-- link Enviar planilha (só logado) -->
          <RouterLink to="/dashboard" class="hover:underline">Gráficos</RouterLink> <!-- link Gráficos: lê o banco (Neon/Azure) -->
          <RouterLink v-if="auth.ehAdmin" to="/admin/usuarios" class="hover:underline">Liberar acessos</RouterLink> <!-- só admin -->
          <span class="text-white/70">{{ auth.usuario?.nome }}</span> <!-- nome do usuário logado -->
          <button class="bg-white text-azul rounded px-3 py-1" @click="sair">Sair</button> <!-- botão Sair -->
        </template>
        <template v-else> <!-- visitante -->
          <RouterLink to="/login" class="hover:underline">Entrar</RouterLink> <!-- link Entrar (visitante) -->
          <RouterLink to="/cadastro" class="bg-white text-azul rounded px-3 py-1">Cadastrar</RouterLink> <!-- link Cadastrar (visitante) -->
        </template>
      </nav>
    </div>

    <nav v-if="aberto" class="md:hidden bg-azul-escuro px-4 py-3 flex flex-col gap-3 text-sm font-semibold"> <!-- menu do celular -->
      <RouterLink to="/" @click="aberto = false">Início</RouterLink> <!-- menu do celular: Início -->
      <template v-if="auth.logado">                         <!-- bloco do usuário logado -->
        <RouterLink to="/upload" @click="aberto = false">Enviar planilha</RouterLink> <!-- link Enviar planilha -->
        <RouterLink to="/dashboard" @click="aberto = false">Gráficos</RouterLink> <!-- link Gráficos -->
        <RouterLink v-if="auth.ehAdmin" to="/admin/usuarios" @click="aberto = false">Liberar acessos</RouterLink> <!-- link Liberar acessos (só ADMIN) -->
        <button class="text-left" @click="sair">Sair ({{ auth.usuario?.nome }})</button> <!-- botão Sair -->
      </template>
      <template v-else>                                     <!-- bloco do visitante -->
        <RouterLink to="/login" @click="aberto = false">Entrar</RouterLink> <!-- link Entrar -->
        <RouterLink to="/cadastro" @click="aberto = false">Cadastrar</RouterLink> <!-- link Cadastrar -->
      </template>
    </nav>
  </header>
</template>
