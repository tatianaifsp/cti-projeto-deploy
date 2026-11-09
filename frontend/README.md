# Front-end — Vue 3 + Pinia + Axios

O que o site faz: o usuário entra, escolhe o Excel, vê os erros e envia **só as linhas válidas** ao backend.
Depois, a tela **Gráficos** mostra os dados que o Python gravou no banco (Neon ou Azure).

## Rodar
```
cd frontend
npm install
copy .env.example .env      (Mac/Linux: cp .env.example .env)
npm run dev                 (abre http://localhost:5173)
```
O `.env` tem uma linha: `VITE_API_URL=http://localhost:8080/api` (endereço do backend, terminando em `/api`).

## Como ele fala com o backend (3 passos)
1. A tela chama a **store** (`stores/upload.js`).
2. A store chama o **service** (`services/api.js`).
3. O service usa o **axios** e põe o token de login em todo pedido.

## Onde fica cada coisa
```
src/
├─ services/api.js     axios + uma função para cada rota do backend
├─ stores/auth.js      login e token
├─ stores/upload.js    lê o Excel, valida e envia
├─ views/              as telas (Login, Cadastro, Upload, Relatório, Liberar acessos, Dashboard)
├─ components/         peças reutilizáveis (cabeçalho, cartão, gráfico, etiqueta de status)
└─ router/index.js     as páginas e quem pode abrir cada uma
```

## Dashboard (gráficos lendo do banco)
O caminho do dado: **banco** (tabela `estatistica_lote`) → **Java** `GET /api/dashboard` → **`views/DashboardView.vue`** → **Chart.js**.

| Arquivo | O que faz |
|---|---|
| `views/DashboardView.vue` | a tela `/dashboard`: busca os dados, mostra 5 cartões, 5 gráficos, os maiores clientes e as frases do Python |
| `components/BaseChart.vue` | desenha **um** gráfico com Chart.js (barra, linha ou rosca); a tela usa 5 vezes |
| `components/KpiCard.vue` | cartão com um número grande (clientes, média, mediana...) |
| `components/StatusBadge.vue` | etiqueta colorida do status do lote (PROCESSADO, PROCESSANDO, ERRO) |
| `services/api.js` | `dashboardService.obter()` e `dashboardService.lotes()` chamam o Java |
| `router/index.js` | a rota `/dashboard` (só para quem fez login) |
| `components/AppHeader.vue` | o link **Gráficos** no menu |

O Chart.js já está no `package.json` (`npm install` instala). Para instalar num projeto novo: `npm install chart.js`.
Se o banco ainda não tem planilha, a tela mostra o aviso e o link **Enviar planilha**.

## Deploy
1. Coloque o endereço do backend publicado em `VITE_API_URL` (termina em `/api`).
2. `npm run build` e publique a pasta `dist/`.
3. Configure o "fallback para index.html" (as rotas do Vue).

Passo a passo completo: `../docs/FRONT-AXIOS.txt`
