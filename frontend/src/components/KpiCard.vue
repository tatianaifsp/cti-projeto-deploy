<script setup>                                              // código do componente (Vue 3, script setup)
// KpiCard.vue — cartãozinho com um número grande (ex.: "Média: R$ 2.261.250").
defineProps({ titulo: String, valor: String, destaque: Boolean }) // defineProps: o que a tela pai nos entrega
</script>

<template>                                                  <!-- início do HTML do cartão -->
  <div class="bg-white rounded-lg shadow-sm border-t-4 p-4" :class="destaque ? 'border-vermelho' : 'border-azul'"> <!-- borda de cima colorida -->
    <p class="text-sm text-cinza">{{ titulo }}</p> <!-- rótulo -->
    <p class="text-2xl font-bold text-azul-escuro">{{ valor }}</p> <!-- número -->
  </div>
</template>
