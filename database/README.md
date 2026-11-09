# Banco de dados — PostgreSQL (Azure)

## O que fica guardado
| Tabela | O que guarda | Quem grava |
|---|---|---|
| `usuario` | login, senha criptografada, perfil e status | Backend (Java) |
| `upload_lote` | uma linha por planilha enviada (nome, status, contagens) | Python |
| `cliente` | clientes **válidos**: código, nome, nível, faturamento, cidade, UF | Python |
| `consultor`, `segmento`, `servico` | listas sem repetição | Python |
| `contrato` | qual cliente contratou qual serviço e quando | Python |
| `estatistica_lote` | o resultado das contas (JSON) para o dashboard | Python |

Linhas inválidas **não** são gravadas.

## Criar as tabelas
Não precisa fazer nada: o backend cria sozinho quando liga (`schema.sql` fica em `backend/src/main/resources/`).
`database/schema.sql` é a mesma cópia, para você olhar ou rodar no DBeaver. **Se mudar um, mude o outro.**

Se você já tinha tabelas de uma versão antiga, rode uma vez no DBeaver e reinicie o backend:
```sql
DROP TABLE IF EXISTS upload_linha, contrato, cliente CASCADE;
```

## Conferir depois de enviar `sample-data/dados.xlsx`
```sql
SELECT status, total_linhas, linhas_validas, linhas_invalidas FROM upload_lote;  -- PROCESSADO, 38, 32, 6
SELECT COUNT(*) FROM cliente;    -- 32
SELECT COUNT(*) FROM segmento;   -- 6
SELECT COUNT(*) FROM consultor;  -- 4
SELECT COUNT(*) FROM servico;    -- 6
SELECT COUNT(*) FROM contrato;   -- 61
SELECT resultado::json -> 'resumo' ->> 'media' FROM estatistica_lote;  -- 2261250
SELECT c.codigo_cti, c.nome, s.nome AS segmento, c.nivel, c.faturamento_anual
  FROM cliente c JOIN segmento s ON s.id = c.segmento_id ORDER BY c.nome;
```

## Neon (ou Azure)
O projeto funciona com qualquer PostgreSQL. No **Neon**, o link tem este formato:
`postgresql://USUARIO:SENHA@HOST/BANCO?sslmode=require&channel_binding=require`

| Onde | Como preencher |
|---|---|
| `backend/.env` | `DB_URL=jdbc:postgresql://HOST/BANCO?sslmode=require` (sem usuário, senha e `channel_binding`), `DB_USER`, `DB_PASSWORD` |
| `analytics-python/.env` | `DB_HOST=HOST`, `DB_PORT=5432`, `DB_NAME=BANCO`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE=require` |

O Neon "dorme" quando fica parado, então o primeiro pedido pode demorar alguns segundos. Não precisa de firewall.
Nunca coloque o link no Git nem em conversa: ele tem a senha.
No **Azure**: crie o banco no PostgreSQL Servidor Flexível e libere no firewall o seu IP e o dos serviços publicados.
