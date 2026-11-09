<script setup>                                              // código do componente (Vue 3, script setup)
// LoginView.vue — tela de login.
import { ref } from 'vue' // ref: valores que mudam
import { useRouter } from 'vue-router' // para ir a outra tela
import { useAuthStore } from '../stores/auth' // store de login
import { mensagemDeErro } from '../services/api' // transforma erro em frase

const auth = useAuthStore() // acesso ao login
const router = useRouter() // acesso às rotas
const email = ref('') // campo e-mail
const senha = ref('') // campo senha
const erro = ref('') // mensagem de erro
const carregando = ref(false) // desabilita o botão durante o pedido

async function entrar() { // submit do formulário
  erro.value = ''; carregando.value = true // começa
  try {                                                     // tenta entrar
    await auth.entrar(email.value, senha.value) // chama o backend
    router.push('/upload') // deu certo: vai para o upload
  } catch (e) {                                             // se der erro, mostra a mensagem
    erro.value = mensagemDeErro(e) // ex.: "Seu cadastro ainda aguarda a liberação"
  } finally {                                               // no final, sempre
    carregando.value = false                                // desliga o 'Entrando...'
  }
}
</script>

<template>                                                  <!-- início do HTML da página -->
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 mt-6"> <!-- cartão centralizado -->
    <h1 class="text-2xl font-bold text-azul-escuro mb-4">Entrar</h1> <!-- título -->
    <form class="space-y-4" @submit.prevent="entrar"> <!-- .prevent evita recarregar a página -->
      <label class="block text-sm font-semibold">E-mail     <!-- campo e-mail -->
        <input v-model="email" type="email" required class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável -->
      </label>
      <label class="block text-sm font-semibold">Senha      <!-- campo senha -->
        <input v-model="senha" type="password" required class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável senha -->
      </label>
      <p v-if="erro" class="text-vermelho text-sm bg-red-50 rounded p-2">{{ erro }}</p> <!-- só aparece se há erro -->
      <button :disabled="carregando" class="w-full bg-azul text-white font-semibold rounded py-2 disabled:opacity-50"> <!-- botão: fica desligado enquanto entra -->
        {{ carregando ? 'Entrando...' : 'Entrar' }}         <!-- texto muda enquanto entra -->
      </button>
    </form>
    <p class="text-sm text-cinza mt-4">Ainda não tem conta? <RouterLink to="/cadastro" class="text-azul font-semibold">Cadastre-se</RouterLink></p> <!-- link para o cadastro -->
  </div>
</template>
