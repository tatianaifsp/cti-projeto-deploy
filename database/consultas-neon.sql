-- =====================================================================
-- consultas-neon.sql — consultas para VER OS DADOS gravados no banco.
-- Funciona no Neon (SQL Editor) e no Azure (DBeaver > Editor SQL).
-- Como usar: copie UMA consulta por vez, cole no editor e clique em Run/Executar.
-- O "--" começa um comentário: o banco ignora.
-- Números esperados = depois de enviar sample-data/dados.xlsx uma vez.
-- =====================================================================


-- 1) OS LOTES: cada planilha enviada vira um lote.
--    Esperado: status PROCESSADO · 38 linhas · 32 válidas · 6 inválidas.
SELECT id, arquivo_nome, enviado_em, status,
       total_linhas, linhas_validas, linhas_invalidas, mensagem
  FROM upload_lote
 ORDER BY id DESC;


-- 2) QUANTOS REGISTROS TEM EM CADA TABELA (tudo de uma vez).
--    Esperado: cliente 32 · segmento 6 · consultor 4 · servico 6 · contrato 61.
SELECT 'upload_lote' AS tabela, COUNT(*) AS registros FROM upload_lote
UNION ALL SELECT 'cliente',          COUNT(*) FROM cliente
UNION ALL SELECT 'segmento',         COUNT(*) FROM segmento
UNION ALL SELECT 'consultor',        COUNT(*) FROM consultor
UNION ALL SELECT 'servico',          COUNT(*) FROM servico
UNION ALL SELECT 'contrato',         COUNT(*) FROM contrato
UNION ALL SELECT 'estatistica_lote', COUNT(*) FROM estatistica_lote;


-- 3) OS CLIENTES JÁ LIMPOS PELO PYTHON, com o nome do segmento e do consultor.
--    O cliente guarda só o NÚMERO (id) do segmento e do consultor; o JOIN busca o nome.
SELECT c.codigo_cti, c.nome, s.nome AS segmento, co.nome AS consultor,
       c.nivel, c.faturamento_anual, c.cidade, c.uf
  FROM cliente c
  JOIN segmento  s  ON s.id  = c.segmento_id
  JOIN consultor co ON co.id = c.consultor_id
 WHERE c.lote_id = (SELECT MAX(id) FROM upload_lote WHERE status = 'PROCESSADO')   -- só o último lote
 ORDER BY c.nome;


-- 4) QUAIS SERVIÇOS CADA CLIENTE CONTRATOU (tabela contrato).
SELECT c.nome AS cliente, sv.nome AS servico, ct.data_contratacao
  FROM contrato ct
  JOIN cliente c  ON c.id  = ct.cliente_id
  JOIN servico sv ON sv.id = ct.servico_id
 ORDER BY c.nome, sv.nome;


-- 5) O MESMO NÚMERO DO GRÁFICO "Clientes por segmento", calculado direto no banco.
SELECT s.nome AS segmento, COUNT(*) AS clientes, SUM(c.faturamento_anual) AS faturamento
  FROM cliente c
  JOIN segmento s ON s.id = c.segmento_id
 WHERE c.lote_id = (SELECT MAX(id) FROM upload_lote WHERE status = 'PROCESSADO')
 GROUP BY s.nome
 ORDER BY clientes DESC;


-- 6) O JSON QUE OS GRÁFICOS LEEM (tabela estatistica_lote).
--    É exatamente isto que o Spring entrega para a tela /dashboard.
SELECT lote_id, gerado_em, resultado
  FROM estatistica_lote
 ORDER BY lote_id DESC;


-- 7) PEGANDO PEDAÇOS DO JSON: média, mediana e total de clientes.
--    "->" entra num campo do JSON; "->>" devolve o valor como texto.
--    Esperado: média 2261250 · 32 clientes.
SELECT lote_id,
       resultado::json -> 'resumo' ->> 'totalClientes' AS clientes,
       resultado::json -> 'resumo' ->> 'media'         AS media,
       resultado::json -> 'resumo' ->> 'mediana'       AS mediana
  FROM estatistica_lote
 ORDER BY lote_id DESC;


-- 8) AS FRASES (insights) QUE APARECEM NO FIM DO DASHBOARD.
SELECT json_array_elements_text(resultado::json -> 'insights') AS frase
  FROM estatistica_lote
 WHERE lote_id = (SELECT MAX(lote_id) FROM estatistica_lote);


-- ---------------------------------------------------------------------
-- LIMPAR PARA TESTAR DE NOVO (CUIDADO: apaga os dados enviados!)
-- Apagar os lotes também apaga clientes, contratos e estatísticas (ON DELETE CASCADE).
-- Usuários NÃO são apagados. Tire o "--" da linha abaixo para rodar.
-- DELETE FROM upload_lote;
-- ---------------------------------------------------------------------
