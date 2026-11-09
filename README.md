# CTI Insights — Projeto Integrador SENAI

Envie a planilha de clientes, veja os erros **antes** de enviar e guarde só os dados válidos no banco.

## O caminho do dado (4 etapas)

| Etapa | Pasta | O que faz | Guia simples |
|---|---|---|---|
| 1. Front | `frontend/` | Lê o Excel, valida cada linha e envia só as válidas (axios) | `docs/FRONT-AXIOS.txt` |
| 2. Backend | `backend/` | Login (JWT), valida de novo e encaminha ao Python | `docs/BACKEND.txt` |
| 3. Ciência de dados | `analytics-python/` | Limpa, padroniza, calcula e **grava no banco** | `docs/CIENCIA-DE-DADOS.txt` |
| 4. Banco | `database/` | PostgreSQL no Azure (tabelas) | `database/README.md` |

Linhas com erro **nunca** vão para o banco: só aparecem para o usuário.

## Ordem para rodar (3 terminais)
1. `cd analytics-python` → `uvicorn api:app --port 8000`
2. `cd backend` → `mvn spring-boot:run`
3. `cd frontend` → `npm run dev` → abra http://localhost:5173

Cada pasta tem um `.env.example`: copie para `.env` e preencha.

## Testar antes do deploy
`python testes/testar_tudo.py` (veja `docs/TESTES.txt`). Para o deploy, o resultado deve ter **0 FALHA**.

## Planilha de exemplo
`sample-data/dados.xlsx`: 38 linhas, 32 válidas e 6 com erro. Resultado esperado no banco: 32 clientes, 6 segmentos, 4 consultores, 6 serviços, 61 contratos, média 2.261.250.

## Dashboard (gráficos lendo do banco)
Depois de enviar a planilha, abra **Gráficos** no menu (http://localhost:5173/dashboard).

```
Python grava ──► banco Neon (upload_lote + estatistica_lote) ──► Java lê (GET /api/dashboard) ──► Vue (DashboardView) ──► Chart.js
```
- **Python** (`analytics-python/`): não muda. Ele já grava o JSON das contas na tabela `estatistica_lote`.
- **Java** (`backend/`): `DashboardController` + `DashboardService` leem o banco e devolvem `{ lote, geradoEm, estatisticas }`.
- **Vue** (`frontend/`): `views/DashboardView.vue` mostra 5 cartões, 5 gráficos (`components/BaseChart.vue`), os maiores clientes e as frases.

Para conferir direto no Neon: `database/consultas-neon.sql`. Guia passo a passo: `docs/GUIA-FASTAPI-PROJETO-CTI.txt`.
