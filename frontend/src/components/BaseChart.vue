<script setup>                                              // código do componente (Vue 3, script setup)
// BaseChart.vue — desenha UM gráfico com Chart.js. Todas as telas reutilizam este componente.
import { onMounted, onBeforeUnmount, ref, watch } from 'vue' // ciclo de vida: onMounted = "a tela abriu"
import { Chart, registerables } from 'chart.js' // Chart.js: a biblioteca que desenha gráficos no <canvas>

Chart.register(...registerables) // liga todos os tipos de gráfico (barra, linha, rosca...)

const props = defineProps({ // o que a tela entrega ao componente
  tipo: { type: String, default: 'bar' }, // 'bar' | 'line' | 'doughnut'
  rotulos: { type: Array, default: () => [] }, // nomes (eixo X): Comércio, Indústria...
  valores: { type: Array, default: () => [] }, // números (altura das barras)
  titulo: { type: String, default: '' }, // nome da série (aparece no tooltip)
  horizontal: Boolean, // true = barras deitadas
})

const canvas = ref(null) // aponta para o <canvas> do template
let grafico = null // guarda o gráfico atual para poder apagar depois
const CORES = ['#0060a9', '#d71920', '#f7941d', '#003e73', '#1f8a4c', '#52606d'] // paleta SENAI

function desenhar() { // monta e desenha o gráfico
  grafico?.destroy() // apaga o desenho antigo, se houver
  const rosca = props.tipo === 'doughnut' // rosca usa uma cor por fatia
  grafico = new Chart(canvas.value, { // cria o gráfico
    type: props.tipo, // tipo
    data: {                                                 // os dados do gráfico
      labels: props.rotulos, // nomes
      datasets: [{                                          // a série de valores
        label: props.titulo, // nome da série
        data: props.valores, // números vindos do banco
        backgroundColor: rosca ? CORES : '#0060a9', // fatias coloridas ou azul
        borderColor: '#0060a9', // cor da linha (gráfico de linha)
        tension: 0.3, // curva suave na linha
      }],                                                   // fim da série
    },                                                      // fim dos dados
    options: {                                              // opções visuais do gráfico
      locale: 'pt-BR', // números no padrão brasileiro: 5.000.000 (e não 5,000,000)
      indexAxis: props.horizontal ? 'y' : 'x', // 'y' deita as barras
      responsive: true, maintainAspectRatio: false, // ocupa a largura da caixa
      plugins: { legend: { display: rosca } }, // legenda só na rosca
      scales: rosca ? {} : { y: { beginAtZero: true } }, // eixo Y começa no zero
    },                                                      // fim das opções
  })
}

onMounted(desenhar) // desenha quando a tela abre
watch(() => [props.rotulos, props.valores], desenhar) // redesenha se os dados mudarem
onBeforeUnmount(() => grafico?.destroy()) // limpa ao sair da tela
</script>

<template>                                                  <!-- início do HTML: um canvas onde o Chart.js desenha -->
  <div class="h-64"> <!-- altura fixa da caixa do gráfico -->
    <canvas ref="canvas"></canvas> <!-- o quadro onde o Chart.js desenha -->
  </div>
</template>
