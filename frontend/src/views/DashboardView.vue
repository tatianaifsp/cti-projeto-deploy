<script setup>                                              // código do componente (Vue 3, script setup)
// DashboardView.vue — gráficos com os dados que o Python calculou e GRAVOU NO BANCO (Neon ou Azure).
// Caminho do dado: banco (estatistica_lote) -> Spring GET /api/dashboard -> esta tela -> Chart.js.
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue' // reactive: objeto reativo só desta tela
import { dashboardService, mensagemDeErro } from '../services/api' // chamadas ao backend (sem store: só esta tela usa)
import BaseChart from '../components/BaseChart.vue' // desenha gráficos
import KpiCard from '../components/KpiCard.vue' // cartão de número
import StatusBadge from '../components/StatusBadge.vue' // etiqueta de status

const moeda = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) // 1500 -> R$ 1.500,00
const numero = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 })) // 1234.5 -> 1.234,5
const dataHora = (t) => (t ? new Date(t).toLocaleString('pt-BR') : '—') // "2026-10-28T17:05:00" -> 28/10/2026 17:05:00

const dash = reactive({ // dados só desta tela (por isso não precisa de Pinia)
  lote: null, // o lote mostrado (status, totais)
  geradoEm: null, // quando o Python gravou as contas
  estatisticas: null, // JSON do Python (null enquanto o ETL não terminou)
  lotes: [], // histórico de lotes gravados no banco (para a caixa de escolha)
  erro: '', // mensagem de erro
  carregando: false, // true durante a busca
  async carregar(loteId) { // GET /api/dashboard
    this.carregando = true; this.erro = '' // começa
    try {                                                   // tenta buscar os dados
      const resp = await dashboardService.obter(loteId) // pede ao Spring, que lê o banco
      this.lote = resp.lote; this.geradoEm = resp.geradoEm; this.estatisticas = resp.estatisticas // guarda o lote e o JSON (ou null)
    } catch (e) {                                           // se der erro, guarda a mensagem
      this.lote = null; this.estatisticas = null; this.erro = mensagemDeErro(e) // 404 = ainda não há lote no banco
    } finally {                                             // no final, sempre
      this.carregando = false                               // desliga o 'Carregando...'
    }
  },                                                        // fecha a ação
  async carregarLotes() { // GET /api/dashboard/lotes
    try { this.lotes = await dashboardService.lotes() } catch { this.lotes = [] } // se falhar, a caixa fica vazia
  },                                                        // fecha a ação
})
const escolhido = ref('') // id do lote escolhido na caixa ('' = o mais recente)
const d = computed(() => dash.estatisticas) // atalho: d.value.resumo, d.value.porSegmento...
let relogio = null // guarda o timer de atualização

// Cada gráfico lê uma lista que o Python gravou no JSON e separa em "nomes" e "números".
const seg = computed(() => d.value?.porSegmento ?? []) // clientes por segmento
const niv = computed(() => d.value?.porNivel ?? []) // clientes por nível
const con = computed(() => d.value?.porConsultor ?? []) // faturamento por consultor
const ser = computed(() => d.value?.porServico ?? []) // serviços mais contratados
const mes = computed(() => d.value?.porMes ?? []) // contratações por mês
const top = computed(() => d.value?.topClientes ?? []) // os 5 maiores clientes

async function buscar() { // pede os dados ao Spring
  await dash.carregar(escolhido.value || undefined) // sem escolha: o Spring devolve o último lote PROCESSADO
  const processando = dash.lote?.status === 'PROCESSANDO' // o Python ainda está trabalhando?
  if (processando && !relogio) relogio = setInterval(buscar, 5000) // pergunta de novo a cada 5 s
  if (!processando && relogio) { clearInterval(relogio); relogio = null } // terminou (ou deu erro): para o timer
}

async function trocarLote() { // a pessoa escolheu outro lote na caixa
  if (relogio) { clearInterval(relogio); relogio = null } // para o timer antigo
  await buscar() // busca o lote escolhido
}

onMounted(async () => { await dash.carregarLotes(); await buscar() }) // ao abrir: lista os lotes e mostra o mais recente
onBeforeUnmount(() => relogio && clearInterval(relogio)) // limpa o timer ao sair
</script>

<template>                                                  <!-- início do HTML da página -->
  <section>                                                 <!-- caixa principal -->
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4"> <!-- título + caixa de escolha -->
      <div>                                                 <!-- lado esquerdo -->
        <h1 class="text-2xl font-bold text-azul-escuro mb-1">Gráficos da carteira</h1> <!-- título da página -->
        <p v-if="dash.lote" class="text-cinza flex flex-wrap items-center gap-2"> <!-- mostra o lote só se já existir -->
          Lote {{ dash.lote.id }} · {{ dash.lote.arquivoNome }} · enviado em {{ dataHora(dash.lote.enviadoEm) }} <StatusBadge :status="dash.lote.status" /> <!-- id, arquivo, data e status -->
        </p>
      </div>
      <label v-if="dash.lotes.length" class="text-sm text-cinza flex flex-col gap-1"> <!-- caixa de escolha do lote -->
        Planilha (lote)
        <select v-model="escolhido" class="border rounded px-3 py-2 bg-white text-azul-escuro" @change="trocarLote"> <!-- ao trocar, busca de novo -->
          <option value="">Mais recente processado</option> <!-- padrão -->
          <option v-for="l in dash.lotes" :key="l.id" :value="l.id">#{{ l.id }} · {{ l.arquivoNome }} · {{ l.status }}</option> <!-- um item por lote do banco -->
        </select>
      </label>
    </div>

    <p v-if="dash.erro" class="bg-orange-50 text-orange-700 rounded p-3">{{ dash.erro }} <RouterLink to="/upload" class="underline font-semibold">Enviar planilha</RouterLink></p> <!-- mostra o erro (ex.: nenhum lote ainda) e o link para enviar -->
    <p v-else-if="dash.carregando && !d" class="text-cinza">Carregando...</p> <!-- enquanto carrega -->
    <p v-else-if="dash.lote?.status === 'ERRO'" class="bg-red-50 text-vermelho rounded p-3">O Python não conseguiu processar este lote: {{ dash.lote.mensagem }}</p> <!-- o Python gravou ERRO: mostra o motivo -->
    <p v-else-if="dash.lote && !d" class="bg-azul-claro text-azul-escuro rounded p-3">O Python está processando a planilha. Esta tela atualiza sozinha.</p> <!-- lote existe, mas o Python ainda não terminou -->

    <template v-if="d">                                     <!-- só mostra os gráficos se há dados -->
      <p class="text-xs text-cinza mb-3">Dados lidos do banco (tabela <b>estatistica_lote</b>) · calculados pelo Python em {{ dataHora(dash.geradoEm) }}</p> <!-- de onde vêm os números -->

      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"> <!-- cartões de resumo -->
        <KpiCard titulo="Clientes" :valor="String(d.resumo.totalClientes)" /> <!-- cartão: total de clientes -->
        <KpiCard titulo="Faturamento total" :valor="moeda(d.resumo.faturamentoTotal)" /> <!-- cartão: faturamento total -->
        <KpiCard titulo="Média" :valor="moeda(d.resumo.media)" destaque /> <!-- média calculada pelo Python -->
        <KpiCard titulo="Mediana" :valor="moeda(d.resumo.mediana)" /> <!-- cartão: mediana -->
        <KpiCard titulo="Desvio padrão" :valor="moeda(d.resumo.desvioPadrao)" /> <!-- cartão: desvio padrão -->
      </div>

      <div class="grid gap-4 lg:grid-cols-2"> <!-- 1 coluna no celular, 2 no computador -->
        <div class="bg-white rounded-lg p-4 shadow-sm">     <!-- caixa do gráfico 1 -->
          <h2 class="font-bold text-azul-escuro mb-2">Clientes por segmento</h2> <!-- título do gráfico -->
          <BaseChart tipo="bar" titulo="Clientes" :rotulos="seg.map((x) => x.segmento)" :valores="seg.map((x) => x.clientes)" /> <!-- barras: clientes por segmento (rótulos = nomes, valores = quantidades) -->
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">     <!-- caixa do gráfico 2 -->
          <h2 class="font-bold text-azul-escuro mb-2">Clientes por nível</h2> <!-- título do gráfico -->
          <BaseChart tipo="doughnut" :rotulos="niv.map((x) => 'Nível ' + x.nivel)" :valores="niv.map((x) => x.clientes)" /> <!-- rosca: clientes por nível A, B e C -->
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">     <!-- caixa do gráfico 3 -->
          <h2 class="font-bold text-azul-escuro mb-2">Faturamento por consultor</h2> <!-- título do gráfico -->
          <BaseChart tipo="bar" horizontal titulo="Faturamento" :rotulos="con.map((x) => x.consultor)" :valores="con.map((x) => x.faturamentoTotal)" /> <!-- barras deitadas: faturamento por consultor -->
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">     <!-- caixa do gráfico 4 -->
          <h2 class="font-bold text-azul-escuro mb-2">Serviços mais contratados</h2> <!-- título do gráfico -->
          <BaseChart tipo="bar" horizontal titulo="Contratos" :rotulos="ser.map((x) => x.servico)" :valores="ser.map((x) => x.contratos)" /> <!-- barras deitadas: serviços mais contratados -->
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm lg:col-span-2"> <!-- caixa do gráfico 5 (ocupa 2 colunas) -->
          <h2 class="font-bold text-azul-escuro mb-2">Contratações por mês</h2> <!-- título do gráfico -->
          <BaseChart tipo="line" titulo="Clientes" :rotulos="mes.map((x) => x.mes)" :valores="mes.map((x) => x.clientes)" /> <!-- linha: contratações por mês -->
        </div>
      </div>

      <div v-if="top.length" class="bg-white rounded-lg p-4 shadow-sm mt-6 overflow-x-auto"> <!-- tabela: os 5 maiores clientes -->
        <h2 class="font-bold text-azul-escuro mb-2">Maiores clientes</h2> <!-- título da tabela -->
        <table class="w-full text-sm">                      <!-- tabela -->
          <thead class="bg-azul-claro text-azul-escuro text-left"> <!-- cabeçalho -->
            <tr><th class="p-2">Código</th><th class="p-2">Cliente</th><th class="p-2">Segmento</th><th class="p-2">Nível</th><th class="p-2 text-right">Faturamento anual</th></tr> <!-- nomes das colunas -->
          </thead>
          <tbody>                                           <!-- corpo -->
            <tr v-for="c in top" :key="c.codigo" class="border-t"> <!-- uma linha por cliente -->
              <td class="p-2">{{ c.codigo }}</td><td class="p-2">{{ c.nome }}</td><td class="p-2">{{ c.segmento }}</td><td class="p-2">{{ c.nivel }}</td><td class="p-2 text-right">{{ moeda(c.faturamento) }}</td> <!-- valores -->
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="d.insights?.length" class="bg-azul-claro rounded-lg p-4 mt-6"> <!-- frases geradas pelo Python -->
        <h2 class="font-bold text-azul-escuro mb-2">O que os dados mostram</h2> <!-- título das frases -->
        <ul class="list-disc pl-5 space-y-1 text-sm"><li v-for="i in d.insights" :key="i">{{ i }}</li></ul> <!-- lista com as frases geradas pelo Python -->
      </div>
      <p class="text-xs text-cinza mt-4">Linhas recebidas: {{ numero(d.qualidade?.linhasRecebidas) }} · válidas: {{ numero(d.qualidade?.linhasValidas) }}</p> <!-- resumo da qualidade: linhas recebidas e válidas -->
    </template>
  </section>
</template>
