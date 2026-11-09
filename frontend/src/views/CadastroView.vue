<script setup>                                              // código do componente (Vue 3, script setup)
// CadastroView.vue — cria a conta. Ela nasce PENDENTE: o administrador precisa liberar.
import { reactive, ref } from 'vue' // reactive: objeto com vários campos
import { useAuthStore } from '../stores/auth' // store de login
import { mensagemDeErro } from '../services/api' // erro em frase

const auth = useAuthStore() // acesso ao login
const form = reactive({ nome: '', email: '', senha: '', matricula: '', turma: '' }) // os campos do formulário
const erro = ref('') // mensagem de erro
const ok = ref('') // mensagem de sucesso
const carregando = ref(false) // desabilita o botão

async function cadastrar() { // submit
  erro.value = ''; ok.value = ''; carregando.value = true // começa
  try {                                                     // tenta cadastrar
    const r = await auth.cadastrar({ ...form }) // envia uma cópia dos campos
    ok.value = r.mensagem // "Cadastro recebido, aguarde a liberação"
  } catch (e) {                                             // se der erro, guarda a mensagem
    erro.value = mensagemDeErro(e) // ex.: "Já existe um cadastro com este e-mail."
  } finally {                                               // no final, sempre
    carregando.value = false                                // desliga o 'Enviando...'
  }
}
</script>

<template>                                                  <!-- início do HTML da página -->
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 mt-6"> <!-- caixa central do formulário -->
    <h1 class="text-2xl font-bold text-azul-escuro mb-4">Criar conta</h1> <!-- título -->
    <div v-if="ok" class="bg-green-50 text-verde rounded p-3"> <!-- depois de cadastrar -->
      {{ ok }} <RouterLink to="/login" class="font-semibold underline">Ir para o login</RouterLink> <!-- mensagem de sucesso e link para o login -->
    </div>
    <form v-else class="space-y-4" @submit.prevent="cadastrar"> <!-- formulário; ao enviar chama cadastrar() sem recarregar a página -->
      <label class="block text-sm font-semibold">Nome       <!-- campo nome -->
        <input v-model="form.nome" required class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável form.nome -->
      </label>
      <label class="block text-sm font-semibold">E-mail     <!-- campo e-mail -->
        <input v-model="form.email" type="email" required class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável form.email -->
      </label>
      <label class="block text-sm font-semibold">Senha <span class="font-normal text-cinza">(8+ caracteres, com letras e números)</span> <!-- campo senha (mínimo 8 caracteres) -->
        <input v-model="form.senha" type="password" required minlength="8" class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável form.senha -->
      </label>
      <div class="grid grid-cols-2 gap-3"> <!-- matrícula e turma lado a lado -->
        <label class="block text-sm font-semibold">Matrícula <!-- campo matrícula (opcional) -->
          <input v-model="form.matricula" class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável form.matricula -->
        </label>
        <label class="block text-sm font-semibold">Turma    <!-- campo turma (opcional) -->
          <input v-model="form.turma" class="mt-1 w-full border rounded px-3 py-2" /> <!-- v-model liga o campo à variável form.turma -->
        </label>
      </div>
      <p v-if="erro" class="text-vermelho text-sm bg-red-50 rounded p-2">{{ erro }}</p> <!-- mostra o erro, se houver -->
            <button :disabled="carregando" class="w-full bg-azul text-white font-semibold rounded py-2 hover:opacity-90 disabled:opacity-50"> 
        {{ carregando ? 'Enviando...' : 'Cadastrar' }}      <!-- texto muda enquanto envia -->
      </button>
    </form>
  </div>
</template>
