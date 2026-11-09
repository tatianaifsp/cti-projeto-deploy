<script setup>                                              // código do componente (Vue 3, script setup)
// RelatorioView.vue — RELATÓRIO DE ERROS da planilha + botão "Liberar para o back-end".
// Só as linhas válidas serão enviadas. As inválidas ficam aqui, para o usuário corrigir no Excel.
import { useUploadStore } from '../stores/upload' // dados já validados pelo Pinia
import KpiCard from '../components/KpiCard.vue' // cartão com número

const upload = useUploadStore() // acesso à store

async function liberar() { // clique no botão
  await upload.liberarParaBackend() // envia SÓ as válidas (o resultado fica em upload.lote)
}
</script>

<template>                                                  <!-- início do HTML da página -->
  <section>                                                 <!-- caixa principal -->
    <div v-if="!upload.arquivoNome" class="text-center py-16"> <!-- abriu direto, sem planilha -->
      <p class="text-cinza">Nenhuma planilha analisada ainda.</p> <!-- aviso quando ainda não há planilha -->
      <RouterLink to="/upload" class="inline-block mt-4 bg-azul text-white rounded px-5 py-2">Escolher planilha</RouterLink> <!-- link para escolher a planilha -->
    </div>

    <template v-else>                                       <!-- bloco mostrado quando há planilha -->
      <h1 class="text-2xl font-bold text-azul-escuro">Relatório da planilha</h1> <!-- título -->
      <p class="text-cinza mb-4">{{ upload.arquivoNome }}</p> <!-- nome do arquivo -->

      <p v-if="upload.colunasFaltando.length" class="bg-red-50 text-vermelho rounded p-3 mb-4"> <!-- planilha sem colunas -->
        Faltam colunas obrigatórias: <b>{{ upload.colunasFaltando.join(', ') }}</b>. Corrija o cabeçalho no Excel e envie de novo. <!-- aviso de colunas que faltam no cabeçalho -->
      </p>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"> <!-- 4 números -->
        <KpiCard titulo="Linhas lidas" :valor="String(upload.resultados.length)" /> <!-- cartão: linhas lidas -->
        <KpiCard titulo="Válidas (serão enviadas)" :valor="String(upload.validas.length)" /> <!-- cartão: válidas (serão enviadas) -->
        <KpiCard titulo="Com erro (não serão enviadas)" :valor="String(upload.invalidas.length)" destaque /> <!-- cartão: com erro (NÃO serão enviadas) -->
        <KpiCard titulo="Válidas com aviso" :valor="String(upload.comAviso.length)" /> <!-- cartão: válidas com aviso -->
      </div>

      <h2 class="text-lg font-bold text-azul-escuro mb-2">Linhas com erro</h2> <!-- título da tabela de erros -->
      <p v-if="!upload.invalidas.length" class="bg-green-50 text-verde rounded p-3">Nenhum erro encontrado. 🎉</p> <!-- mensagem quando não há erro -->
      <div v-else class="overflow-x-auto bg-white rounded-lg shadow-sm"> <!-- tabela de erros -->
        <table class="w-full text-sm">                      <!-- tabela das linhas com erro -->
          <thead class="bg-azul-claro text-azul-escuro text-left"> <!-- cabeçalho da tabela -->
            <tr><th class="p-3">Linha</th><th class="p-3">Código</th><th class="p-3">O que está errado</th></tr> <!-- nomes das colunas -->
          </thead>
          <tbody>                                           <!-- corpo da tabela -->
            <tr v-for="r in upload.invalidas" :key="r.numero" class="border-t align-top"> <!-- uma linha para cada registro com erro -->
              <td class="p-3 font-semibold">{{ r.numero }}</td> <!-- número da linha no Excel -->
              <td class="p-3">{{ r.valores.codigo_cliente || '—' }}</td> <!-- código do cliente da linha -->
              <td class="p-3"><ul class="list-disc pl-4 text-vermelho"><li v-for="e in r.erros" :key="e">{{ e }}</li></ul></td> <!-- um item por erro -->
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="upload.erro" class="text-vermelho bg-red-50 rounded p-3 mt-4">{{ upload.erro }}</p> <!-- mostra o erro do envio, se houver -->

      <p v-if="upload.lote" class="bg-green-50 text-verde rounded p-3 mt-4">Enviado! O Python gravou {{ upload.lote.linhasValidas }} linhas válidas no banco ({{ upload.lote.linhasInvalidas }} com erro ficaram de fora). <RouterLink to="/dashboard" class="underline font-semibold">Ver os gráficos</RouterLink></p> <!-- mensagem de sucesso depois do envio, com link para os gráficos -->

      <div class="flex flex-wrap gap-3 mt-6">               <!-- linha de botões -->
        <button :disabled="!upload.podeLiberar || upload.enviando" class="bg-vermelho text-white font-semibold rounded px-6 py-2 disabled:opacity-40" @click="liberar"> <!-- botão: só liga se há linhas válidas e não está enviando -->
          {{ upload.enviando ? 'Enviando...' : `Liberar ${upload.validas.length} linhas para o back-end` }} <!-- texto do botão -->
        </button>
        <RouterLink to="/upload" class="border border-azul text-azul rounded px-6 py-2" @click="upload.limpar()">Escolher outra planilha</RouterLink> <!-- link para escolher outra planilha -->
      </div>
      <p class="text-xs text-cinza mt-2">As linhas com erro não são enviadas. O Spring Boot ainda confere as válidas mais uma vez.</p> <!-- lembrete: o Spring confere de novo -->
    </template>
  </section>
</template>
