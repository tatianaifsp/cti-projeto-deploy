// ============================================================================
// stores/auth.js — Pinia: quem está logado. Guarda o token JWT e os dados do usuário.
// ============================================================================
import { defineStore } from 'pinia' // defineStore: cria uma "store" (caixa de dados compartilhada entre as telas)
import { computed, ref } from 'vue' // ref: valor reativo; computed: valor calculado a partir de outros
import { authService, configurarApi } from '../services/api' // as chamadas de login/cadastro

const CHAVE = 'cti-sessao' // nome com que salvamos a sessão no navegador (localStorage)

function lerSessao() { // lê a sessão salva (se houver)
  try { return JSON.parse(localStorage.getItem(CHAVE)) || {} } catch { return {} } // se der erro, começa vazio
}

export const useAuthStore = defineStore('auth', () => { // nome da store: 'auth'
  const salva = lerSessao() // sessão guardada de uma visita anterior
  const token = ref(salva.token || '') // token JWT
  const usuario = ref(salva.usuario || null) // { nome, email, perfil... }

  const logado = computed(() => !!token.value) // true se existe token
  const ehAdmin = computed(() => usuario.value?.perfil === 'ADMIN') // true se é administrador

  function guardar() { localStorage.setItem(CHAVE, JSON.stringify({ token: token.value, usuario: usuario.value })) } // salva no navegador

  async function entrar(email, senha) { // faz login
    const resp = await authService.entrar(email, senha) // chama o backend (erro sobe para a tela)
    token.value = resp.token // guarda o token
    usuario.value = resp.usuario // guarda o usuário
    guardar() // persiste
  }

  async function cadastrar(dados) { return authService.cadastrar(dados) } // cria a conta (fica PENDENTE até o admin liberar)

  function sair() { // logout
    token.value = '' // apaga o token
    usuario.value = null // apaga o usuário
    localStorage.removeItem(CHAVE) // apaga do navegador
  }

  async function validarSessao() { // ao abrir o site: o token salvo ainda vale?
    if (!token.value) return // sem token, nada a fazer
    try { usuario.value = await authService.eu(); guardar() } catch { sair() } // inválido: sai
  }

  configurarApi({ getToken: () => token.value, onUnauthorized: sair }) // ensina o axios a usar o token e a sair quando expira

  return { token, usuario, logado, ehAdmin, entrar, cadastrar, sair, validarSessao } // o que as telas podem usar
})
