<script setup>                                              // código do componente (Vue 3, script setup)
// UploadView.vue — escolhe a planilha. O Pinia lê e valida; se deu certo, abre o relatório de erros.
import { ref } from 'vue' // ref: valores que mudam
import { useRouter } from 'vue-router' // para trocar de tela
import { useUploadStore, LIMITE_MB } from '../stores/upload' // store do upload

const upload = useUploadStore() // acesso à store
const router = useRouter() // acesso às rotas
const arrastando = ref(false) // true enquanto o arquivo está sobre a caixa

async function escolher(arquivo) { // recebe o arquivo (do clique ou do arrastar)
  const ok = await upload.analisarArquivo(arquivo) // lê e valida no navegador
  if (ok) router.push('/relatorio') // mostra o relatório de erros
}
function aoSoltar(e) { arrastando.value = false; escolher(e.dataTransfer.files[0]) } // soltou o arquivo na caixa
function aoSelecionar(e) { escolher(e.target.files[0]) } // escolheu pelo botão
</script>

<template>                                                  <!-- início do HTML da página -->
  <section class="max-w-2xl mx-auto">                       <!-- caixa principal -->
    <h1 class="text-2xl font-bold text-azul-escuro mb-1">Enviar planilha</h1> <!-- título -->
    <p class="text-cinza mb-4">Escolha o arquivo .xlsx (aba <b>upload_clientes</b>, até {{ LIMITE_MB }} MB). Antes de enviar ao servidor você vê os erros.</p> <!-- instrução: arquivo .xlsx, aba upload_clientes -->

    <label class="block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer bg-white transition"
      :class="arrastando ? 'border-vermelho bg-red-50' : 'border-azul'"
      @dragover.prevent="arrastando = true" @dragleave="arrastando = false" @drop.prevent="aoSoltar"> <!-- caixa de arrastar -->
      <input type="file" accept=".xlsx" class="hidden" @change="aoSelecionar" /> <!-- input escondido -->
      <p class="text-lg font-semibold text-azul">{{ upload.analisando ? 'Lendo a planilha...' : 'Arraste o arquivo aqui ou clique para escolher' }}</p> <!-- texto da área de arrastar -->
    </label>

    <p v-if="upload.erro" class="text-vermelho bg-red-50 rounded p-3 mt-4">{{ upload.erro }}</p> <!-- mostra o erro, se houver -->

    <div class="bg-azul-claro rounded-lg p-4 mt-6 text-sm"> <!-- lembrete das colunas -->
      <p class="font-semibold text-azul-escuro mb-1">Colunas esperadas</p> <!-- título da lista de colunas -->
      <p class="font-mono text-xs break-words">codigo_cliente, nome_cliente, consultor, segmento, nivel_cliente, faturamento_anual, servicos_contratados, data_contratacao, cidade, uf</p> <!-- as 10 colunas que a planilha precisa ter -->
    </div>
  </section>
</template>
