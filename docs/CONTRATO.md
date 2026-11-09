# Contrato entre as partes (front, back e Python)

Resumo do que cada parte envia e recebe. Se mudar aqui, mude nas três pastas.

## 1. Colunas da planilha (aba `upload_clientes`)
| Coluna | Obrigatória | Regra |
|---|---|---|
| codigo_cliente | sim | letras, números, `-` ou `_`; não pode repetir |
| nome_cliente | sim | texto |
| consultor | sim | texto (o Python ajusta para "Nome Sobrenome") |
| segmento | sim | Indústria, Comércio, Serviços, Saúde, Educação ou Tecnologia (aceita "IND.", "industria"...) |
| nivel_cliente | sim | A, B ou C |
| faturamento_anual | sim | número ≥ 0 (aceita `1850000`, `1.850.000,50`, `R$ 1.850.000,50`) |
| servicos_contratados | sim | serviços separados por `;` |
| data_contratacao | sim | `dd/mm/aaaa` ou `aaaa-mm-dd` (a partir de 1990) |
| cidade | não | texto |
| uf | não | 2 letras |

## 2. Rotas do backend (Spring Boot, porta 8080)
| Método e rota | Quem pode | Para quê |
|---|---|---|
| `POST /api/auth/register` | todos | cria conta (fica PENDENTE) |
| `POST /api/auth/login` | todos | devolve o token JWT |
| `GET /api/auth/me` | logado | confere o token |
| `GET /api/admin/usuarios?status=PENDENTE` | ADMIN | lista usuários |
| `PATCH /api/admin/usuarios/{id}/status` | ADMIN | `{"status":"APROVADO"}` ou `BLOQUEADO` |
| `POST /api/uploads/validadas` | logado | valida e encaminha as linhas válidas ao Python (que cria o lote e grava) |

Toda rota (menos login e cadastro) pede o cabeçalho `Authorization: Bearer <token>`.
Erros voltam sempre assim: `{"erro": "mensagem"}`.

## 3. Corpo do `POST /api/uploads/validadas`
```json
{
  "arquivoNome": "dados.xlsx",
  "descartadas": 6,
  "linhas": [
    { "numeroLinha": 2, "codigoCliente": "CLI-001", "nomeCliente": "Padaria Sol", "consultor": "Ana Souza",
      "segmento": "Comércio", "nivelCliente": "A", "faturamentoAnual": "1850000.00",
      "servicosContratados": "Internet Dedicada; Firewall", "dataContratacao": "2024-03-15",
      "cidade": "Recife", "uf": "PE" }
  ]
}
```
`descartadas` = quantas linhas com erro o front deixou de fora (só entra na contagem do lote).
O Spring valida **de novo** cada linha enviada.

## 4. JSON que o Python grava em `estatistica_lote.resultado` (o dashboard lê isto)
```jsonc
{
  "resumo":       { "totalClientes": 0, "faturamentoTotal": 0, "media": 0, "mediana": 0, "desvioPadrao": 0,
                    "minimo": 0, "maximo": 0, "q1": 0, "q3": 0 },
  "porSegmento":  [ { "segmento": "", "clientes": 0, "percentual": 0, "media": 0, "mediana": 0 } ],
  "porNivel":     [ { "nivel": "A", "clientes": 0 } ],
  "porConsultor": [ { "consultor": "", "clientes": 0, "faturamentoTotal": 0 } ],
  "porServico":   [ { "servico": "", "contratos": 0, "percentual": 0 } ],
  "porMes":       [ { "mes": "2025-01", "clientes": 0 } ],
  "correlacao":   { "pearson": 0, "interpretacao": "" },
  "topClientes":  [ { "codigo": "", "nome": "", "faturamento": 0 } ],
  "qualidade":    { "linhasRecebidas": 0, "linhasValidas": 0, "linhasInvalidas": 0 },
  "insights":     [ "frase", "frase" ]
}
```
Valores sem sentido (NaN, infinito) viram `null`.
