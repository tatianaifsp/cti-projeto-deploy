<script setup>
// HomeView.vue — página inicial: apresenta o CTI Provedor e mostra o caminho do dado.
import { useAuthStore } from '../stores/auth' // para trocar os botões se já estiver logado
const auth = useAuthStore() // acesso ao login

// as 5 etapas do caminho do dado
const etapas = [
  { t: 'Vue + Pinia', d: 'Lê o Excel e valida cada linha no navegador.' },
  { t: 'Spring Boot', d: 'Confere de novo e encaminha os dados ao Python.' },
  { t: 'Python (ETL)', d: 'Limpa os dados e calcula os indicadores.' },
  { t: 'PostgreSQL', d: 'Guarda clientes, lotes e resultados.' },
  { t: 'Dashboard', d: 'Lê o banco e o Chart.js desenha os gráficos.' },
]
</script>

<template>
  <!-- página inteira: fonte IBM Plex Sans (carregada no index.html) -->
  <section class="font-['IBM_Plex_Sans',Arial,sans-serif] mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

    <!-- ===== Cabeçalho: 1 coluna no celular, 2 a partir do tablet ===== -->
    <header class="grid items-center gap-8 border-b border-slate-300 py-8 md:grid-cols-2 md:gap-12 md:py-12">

      <!-- texto e botões -->
      <div class="order-2 md:order-1">
        <h1 class="text-3xl font-semibold text-azul-escuro sm:text-4xl lg:text-5xl">CTI Provedor</h1>
        <p class="mt-3 text-base text-slate-600 sm:text-lg">Envio e análise de planilhas de clientes.</p>

        <!-- sobre a empresa -->
        <div class="mt-5 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
          <p>
            A CTI Comunicação de Dados e Tecnologia é um provedor de internet que registra
            seus dados comerciais em planilhas Excel: clientes, consultores, segmentos,
            nível do cliente (A, B ou C), faturamento e serviços contratados.
          </p>
          <p>
            Com o volume crescendo, ficou difícil enxergar nas planilhas quais segmentos
            faturam mais, como cada consultor está indo e onde estão os erros de cadastro.
            Este sistema recebe a planilha, separa as linhas com problema e transforma o
            restante em indicadores e gráficos.
          </p>
        </div>

        <!-- botões: ocupam a largura toda no celular, lado a lado no tablet/computador -->
        <div class="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
          <RouterLink v-if="auth.logado" to="/upload"
            class="rounded bg-azul-escuro px-5 py-3 text-center font-medium text-white hover:opacity-90">
            Enviar planilha
          </RouterLink>
          <template v-else>
            <RouterLink to="/login"
              class="rounded bg-azul-escuro px-5 py-3 text-center font-medium text-white hover:opacity-90">
              Entrar
            </RouterLink>
            <RouterLink to="/cadastro"
              class="rounded border border-slate-400 px-5 py-3 text-center font-medium text-azul-escuro hover:bg-slate-100">
              Criar conta
            </RouterLink>
          </template>
        </div>
      </div>

      <!-- imagem: arquivo em public/img/home.jpg (no celular aparece primeiro) -->
      <img src="../img/home.jpg" alt="Mapa do Brasil conectado a um data center"
        class="order-1 h-48 w-full rounded-lg object-cover shadow-md sm:h-64 md:order-2 md:h-80" />
    </header>

    <!-- ===== Caminho do dado ===== -->
    <div class="py-8 md:py-12">
      <h2 class="text-lg font-semibold text-azul-escuro sm:text-xl">Como os dados passam pelo sistema</h2>

      <!-- no celular: número + nome em cima, descrição embaixo; no tablet/computador: 3 colunas -->
      <ol class="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        <li v-for="(e, i) in etapas" :key="e.t"
          class="grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-1 py-4 sm:grid-cols-[3rem_12rem_1fr] sm:gap-x-4">
          <span class="tabular-nums text-slate-400">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="font-medium text-azul-escuro">{{ e.t }}</span>
          <span class="col-start-2 text-sm text-slate-600 sm:col-start-3 sm:text-base">{{ e.d }}</span>
        </li>
      </ol>
    </div>

  </section>
</template>