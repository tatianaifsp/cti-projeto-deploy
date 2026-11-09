// ============================================================================
// services/api.js — TODA conversa com o backend (Spring Boot) passa por aqui.
// Parte 1: a conexão (axios). Parte 2: uma função para cada rota do backend.
// ============================================================================
import axios from 'axios' // axios: biblioteca que faz chamadas HTTP (GET, POST...) de forma simples

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '') // endereço da API (vem do .env), sem "/" no final

export const api = axios.create({ baseURL: BASE, timeout: 60000 }) // cria a conexão: todo pedido começa em BASE e espera até 60 s

// O token JWT fica na store de login. Para não importar a store aqui (importação circular), a store nos entrega duas funções.
let pegarToken = () => null // função que devolve o token (trocada por configurarApi)
let aoExpirar = () => {} // função chamada quando o servidor responde 401

export function configurarApi({ getToken, onUnauthorized }) { // a store chama isto uma vez, no main.js
  pegarToken = getToken // guarda a função que lê o token
  aoExpirar = onUnauthorized // guarda a função que faz logout
}

api.interceptors.request.use((config) => { // INTERCEPTADOR: roda antes de TODO pedido
  const token = pegarToken() // lê o token salvo
  if (token) config.headers.Authorization = `Bearer ${token}` // anexa o token: o Spring Security lê este cabeçalho
  return config // segue com o pedido
})

api.interceptors.response.use( // INTERCEPTADOR: roda em TODA resposta
  (resposta) => resposta, // sucesso: não mexe
  (erro) => { // falha:
    const url = erro.config?.url || '' // qual rota falhou
    const publica = url.includes('/auth/login') || url.includes('/auth/register') // nessas rotas 401 = senha errada
    if (erro.response?.status === 401 && !publica) aoExpirar() // token vencido: sai e volta ao login
    return Promise.reject(erro) // repassa o erro para quem chamou
  },                                                        // fim da configuração
)                                                           // fim da chamada

// Transforma qualquer erro em uma frase para mostrar na tela. O backend responde erros como { "erro": "texto" }.
export function mensagemDeErro(erro) {                      // transforma o erro do axios numa mensagem em português
  if (erro?.response?.data?.erro) return erro.response.data.erro // mensagem escrita pelo backend
  if (erro?.response) return `Erro ${erro.response.status} no servidor.` // outro erro HTTP
  return 'Não consegui falar com o servidor. Ele está rodando? (mvn spring-boot:run)' // sem resposta: backend desligado
}

const corpo = (resposta) => resposta.data // o axios coloca a resposta em .data; esta função pega só ela

export const authService = { // ---- login e cadastro ----
  entrar: (email, senha) => api.post('/auth/login', { email, senha }).then(corpo), // POST /api/auth/login -> { token, usuario }
  cadastrar: (dados) => api.post('/auth/register', dados).then(corpo), // POST /api/auth/register (conta nasce PENDENTE)
  eu: () => api.get('/auth/me').then(corpo), // GET /api/auth/me -> confere se o token ainda vale
}

export const adminService = { // ---- liberação de acesso (só ADMIN) ----
  listar: (status) => api.get('/admin/usuarios', { params: { status } }).then(corpo), // GET lista usuários (filtra por status)
  alterarStatus: (id, status) => api.patch(`/admin/usuarios/${id}/status`, { status }).then(corpo), // PATCH APROVADO | BLOQUEADO | PENDENTE
}

export const uploadService = { // ---- envio da planilha ----
  enviarValidadas: (dados) => api.post('/uploads/validadas', dados).then(corpo), // POST só com as linhas aprovadas pelo Pinia
}

export const dashboardService = { // ---- dados dos gráficos ----
  obter: (loteId) => api.get('/dashboard', { params: { loteId } }).then(corpo), // GET /api/dashboard -> { lote, geradoEm, estatisticas }
  lotes: () => api.get('/dashboard/lotes').then(corpo), // GET /api/dashboard/lotes -> os últimos lotes gravados no banco
}
