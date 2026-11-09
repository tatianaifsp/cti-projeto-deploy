// ============================================================================
// router/index.js — quais telas existem, em qual endereço, e quem pode entrar.
// ============================================================================
import { createRouter, createWebHistory } from 'vue-router' // cria o roteador (troca de tela sem recarregar a página)
import { useAuthStore } from '../stores/auth' // para saber se está logado

const rotas = [ // lista de telas
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') }, // pública
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { soVisitante: true } }, // só para quem NÃO está logado
  { path: '/cadastro', name: 'cadastro', component: () => import('../views/CadastroView.vue'), meta: { soVisitante: true } }, // rota do cadastro (só para visitante)
  { path: '/upload', name: 'upload', component: () => import('../views/UploadView.vue'), meta: { requerLogin: true } }, // exige login
  { path: '/relatorio', name: 'relatorio', component: () => import('../views/RelatorioView.vue'), meta: { requerLogin: true } }, // rota do relatório (exige login)
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { requerLogin: true } }, // rota do dashboard (exige login)
  { path: '/admin/usuarios', name: 'admin', component: () => import('../views/AdminUsuariosView.vue'), meta: { requerLogin: true, requerAdmin: true } }, // só ADMIN
  { path: '/:qualquer(.*)*', name: 'naoencontrada', component: () => import('../views/NotFoundView.vue') }, // qualquer outro endereço
]

const router = createRouter({ history: createWebHistory(), routes: rotas, scrollBehavior: () => ({ top: 0 }) }) // cria o roteador

router.beforeEach((para) => { // GUARDA: roda antes de CADA troca de tela
  const auth = useAuthStore() // lê o estado do login
  if (para.meta.requerLogin && !auth.logado) return { name: 'login' } // precisa de login e não tem: vai para o login
  if (para.meta.requerAdmin && !auth.ehAdmin) return { name: 'home' } // precisa ser admin e não é: volta para a home
  if (para.meta.soVisitante && auth.logado) return { name: 'upload' } // já logado não vê login/cadastro
})

export default router                                       // exporta o router para o main.js usar
