<script setup>                                              // código do componente (Vue 3, script setup)
// StatusBadge.vue — etiqueta colorida com o status (PENDENTE, APROVADO, BLOQUEADO, PROCESSADO...).
import { computed } from 'vue' // computed: recalcula a cor quando o status muda
const props = defineProps({ status: String }) // recebe o texto do status
const cor = computed(() => ({ // escolhe a cor pelo status
  APROVADO: 'bg-green-100 text-verde', PROCESSADO: 'bg-green-100 text-verde', // verde: aprovado ou processado
  PENDENTE: 'bg-orange-100 text-orange-700', AGUARDANDO_ETL: 'bg-orange-100 text-orange-700', PROCESSANDO: 'bg-orange-100 text-orange-700', // laranja: pendente, aguardando ou processando
  BLOQUEADO: 'bg-red-100 text-vermelho', REJEITADO: 'bg-red-100 text-vermelho', ERRO: 'bg-red-100 text-vermelho', // vermelho: bloqueado, rejeitado ou erro no Python
}[props.status] || 'bg-gray-100 text-cinza')) // cor padrão: cinza
</script>

<template>                                                  <!-- início do HTML da etiqueta -->
  <span class="inline-block rounded-full px-3 py-0.5 text-xs font-semibold" :class="cor">{{ status }}</span> <!-- etiqueta colorida com o texto do status -->
</template>
