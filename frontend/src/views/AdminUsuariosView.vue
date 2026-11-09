<script setup>                                              // código do componente (Vue 3, script setup)
// AdminUsuariosView.vue — LIBERAÇÃO DE ACESSO: o administrador aprova ou bloqueia quem se cadastrou.
import { onMounted, ref } from 'vue' // onMounted: roda quando a tela abre
import { adminService, mensagemDeErro } from '../services/api' // chamadas ao backend
import StatusBadge from '../components/StatusBadge.vue' // etiqueta de status
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—') // ISO -> 19/10/2026 20:10

const usuarios = ref([]) // lista vinda do banco
const filtro = ref('PENDENTE') // mostra primeiro os pendentes
const erro = ref('') // mensagem de erro

async function carregar() { // busca a lista
  erro.value = ''                                           // limpa a mensagem de erro
  try { usuarios.value = await adminService.listar(filtro.value || undefined) } // '' = todos
  catch (e) { erro.value = mensagemDeErro(e) }              // se falhar, mostra o erro
}

async function mudar(u, status) { // clique em Aprovar / Bloquear
  try { Object.assign(u, await adminService.alterarStatus(u.id, status)) } // atualiza a linha com a resposta
  catch (e) { erro.value = mensagemDeErro(e) }              // se falhar, mostra o erro
}

onMounted(carregar) // carrega ao abrir
</script>

<template>                                                  <!-- início do HTML da página -->
  <section>                                                 <!-- caixa principal -->
    <h1 class="text-2xl font-bold text-azul-escuro mb-4">Liberação de acesso</h1> <!-- título -->
    <select v-model="filtro" class="border rounded px-3 py-2 mb-4 bg-white" @change="carregar"> <!-- filtro por status -->
      <option value="PENDENTE">Pendentes</option>           <!-- opção: só pendentes -->
      <option value="APROVADO">Aprovados</option>           <!-- opção: só aprovados -->
      <option value="BLOQUEADO">Bloqueados</option>         <!-- opção: só bloqueados -->
      <option value="">Todos</option>                       <!-- opção: todos -->
    </select>                                               <!-- fim do filtro -->
    <p v-if="erro" class="text-vermelho bg-red-50 rounded p-2 mb-3">{{ erro }}</p> <!-- mostra o erro, se houver -->
    <p v-if="!usuarios.length" class="text-cinza">Nenhum usuário nesta lista.</p> <!-- mensagem de lista vazia -->

    <div class="overflow-x-auto bg-white rounded-lg shadow-sm"> <!-- rolagem lateral no celular -->
      <table v-if="usuarios.length" class="w-full text-sm"> <!-- tabela de usuários (só aparece se há usuários) -->
        <thead class="bg-azul-claro text-azul-escuro text-left"> <!-- cabeçalho da tabela -->
          <tr><th class="p-3">Nome</th><th class="p-3">E-mail</th><th class="p-3">Turma</th><th class="p-3">Cadastro</th><th class="p-3">Status</th><th class="p-3">Ação</th></tr> <!-- nomes das colunas -->
        </thead>
        <tbody>                                             <!-- corpo da tabela -->
          <tr v-for="u in usuarios" :key="u.id" class="border-t"> <!-- uma linha por usuário -->
            <td class="p-3">{{ u.nome }}</td>               <!-- nome do usuário -->
            <td class="p-3">{{ u.email }}</td>              <!-- e-mail -->
            <td class="p-3">{{ u.turma || '—' }}</td>       <!-- turma (ou traço) -->
            <td class="p-3">{{ dataHora(u.criadoEm) }}</td> <!-- data do cadastro -->
            <td class="p-3"><StatusBadge :status="u.status" /></td> <!-- etiqueta colorida com o status -->
            <td class="p-3 space-x-2 whitespace-nowrap">    <!-- coluna dos botões -->
              <button v-if="u.status !== 'APROVADO'" class="bg-verde text-white rounded px-3 py-1" @click="mudar(u, 'APROVADO')">Aprovar</button> <!-- botão Aprovar (se ainda não aprovado) -->
              <button v-if="u.status !== 'BLOQUEADO' && u.perfil !== 'ADMIN'" class="bg-vermelho text-white rounded px-3 py-1" @click="mudar(u, 'BLOQUEADO')">Bloquear</button> <!-- botão Bloquear (não aparece para ADMIN) -->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
