// ============================================================================
// stores/upload.js — Pinia: o CORAÇÃO do projeto (não existe pasta utils: tudo fica aqui).
// 1) analisarArquivo: lê o Excel e valida cada linha no navegador.
// 2) liberarParaBackend: envia ao Spring Boot SOMENTE as linhas válidas. As inválidas nunca saem do navegador.
// As regras de validação são as MESMAS do Spring (ClienteValidacaoService.java): o front avisa na hora, o back confere de novo.
// ============================================================================
import { defineStore } from 'pinia' // cria a store
import { computed, ref } from 'vue' // ref e computed
import { readSheet } from 'read-excel-file/browser' // readSheet: lê uma aba do Excel no navegador (sem servidor)
import { uploadService, mensagemDeErro } from '../services/api' // chamada ao backend

export const LIMITE_MB = 5 // tamanho máximo do arquivo

// ---------------------------------------------------------------------------
// PARTE 1 — REGRAS DE VALIDAÇÃO (funções simples, usadas pela store lá embaixo)
// ---------------------------------------------------------------------------
// Colunas que a planilha precisa ter (nomes iguais aos do banco).
const COLUNAS = [ // lista com as 10 colunas
  'codigo_cliente', 'nome_cliente', 'consultor', 'segmento', 'nivel_cliente', // colunas 1 a 5
  'faturamento_anual', 'servicos_contratados', 'data_contratacao', 'cidade', 'uf', // colunas 6 a 10
]
// Estas 8 são obrigatórias. cidade e uf são opcionais.
const OBRIGATORIAS = COLUNAS.slice(0, 8) // pega as 8 primeiras

// Tamanho máximo de cada texto (igual ao banco de dados).
const TAMANHO_MAXIMO = { codigo_cliente: 60, nome_cliente: 255, consultor: 120, segmento: 80, nivel_cliente: 20, servicos_contratados: 400, cidade: 120, uf: 10 } // tamanho máximo de cada texto (igual ao banco)

// Segmentos aceitos: chave = texto simplificado, valor = nome oficial.
const SEGMENTOS = { ind: 'Indústria', industria: 'Indústria', comercio: 'Comércio', servicos: 'Serviços', servico: 'Serviços', saude: 'Saúde', educacao: 'Educação', tecnologia: 'Tecnologia' } // segmentos aceitos (texto simples -> nome oficial)

// Tira acento, deixa minúsculo e remove pontuação: "INDÚSTRIA" -> "industria", "IND." -> "ind".
function simplificar(texto) { // recebe um texto
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '') // separa o acento da letra e apaga o acento
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() // minúsculo, só letras/números
}

// Lê o faturamento. Aceita 1850000, 1850000.50, 1.850.000,50 e "R$ 1.850.000,50". Devolve número ou null.
function lerNumero(texto) { // recebe o texto digitado
  let t = texto.replace('R$', '').replace(/\s/g, '') // tira "R$" e espaços
  if (!/^-?[0-9.,]+$/.test(t)) return null // se tem letra, não é número
  const ponto = t.includes('.'), virgula = t.includes(',') // tem ponto? tem vírgula?
  if (ponto && virgula) { // formato 1.850.000,50 ou 1,850,000.50
    t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '') // o último símbolo é o decimal
  } else if (virgula) { // só vírgula
    t = (t.match(/,/g) || []).length > 1 ? t.replace(/,/g, '') : t.replace(',', '.') // 1,5 vira 1.5
  } else if (ponto && /^-?\d{1,3}(\.\d{3})+$/.test(t)) { // 1.850.000 é separador de milhar
    t = t.replace(/\./g, '') // tira os pontos
  }
  const n = Number(t) // converte para número
  return Number.isFinite(n) ? n : null // se não deu certo, null
}

// Lê a data (dd/mm/aaaa ou aaaa-mm-dd). Devolve "aaaa-mm-dd" ou null.
function lerData(texto) { // recebe o texto
  let ano, mes, dia // peças da data
  let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})/) // formato ISO: 2024-03-15
  if (m) { ano = +m[1]; mes = +m[2]; dia = +m[3] } // + converte texto em número
  else if ((m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) { ano = +m[3]; mes = +m[2]; dia = +m[1] } // formato BR: 15/03/2024
  else return null // nenhum formato bateu
  const d = new Date(Date.UTC(ano, mes - 1, dia)) // monta a data (mês começa em 0)
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null // 31/02 não existe
  if (ano < 1990) return null // ano antigo demais
  return d.toISOString().slice(0, 10) // devolve aaaa-mm-dd
}

// Valida TODAS as linhas. Entrada: [{ numero, campos:{coluna: texto} }]. Saída: uma lista com o resultado de cada linha.
function validarLinhas(linhas) { // recebe a lista de linhas lidas da planilha
  const codigosVistos = new Map() // código -> número da linha onde apareceu primeiro
  const hoje = new Date().toISOString().slice(0, 10) // data de hoje (para o aviso de data no futuro)
  return linhas.map((linha) => { // para cada linha...
    const erros = [] // lista de erros (bloqueiam a linha)
    const avisos = [] // lista de avisos (não bloqueiam)
    const v = {} // valores já limpos
    for (const col of COLUNAS) { // 1) limpa cada campo
      const bruto = linha.campos[col] ?? '' // texto original (vazio se não existe)
      const limpo = String(bruto).trim().replace(/\s{2,}/g, ' ') // tira espaços das pontas e duplicados
      if (limpo !== bruto && bruto !== '') avisos.push(`${col}: espaços extras removidos`) // avisa se mudou
      v[col] = limpo // guarda o valor limpo
      const max = TAMANHO_MAXIMO[col] // limite de tamanho desse campo
      if (max && limpo.length > max) erros.push(`${col}: excede ${max} caracteres`) // texto grande demais
    }
    for (const col of OBRIGATORIAS) if (!v[col]) erros.push(`${col}: campo obrigatório vazio`) // 2) obrigatórios

    if (v.codigo_cliente) { // 3) código: formato e duplicidade
      if (!/^[A-Za-z0-9_-]{1,60}$/.test(v.codigo_cliente)) erros.push("codigo_cliente: use apenas letras, números, '-' ou '_'") // formato
      const chave = v.codigo_cliente.toUpperCase() // CLI-1 e cli-1 são o mesmo código
      if (codigosVistos.has(chave)) erros.push(`codigo_cliente: código duplicado (já usado na linha ${codigosVistos.get(chave)})`) // repetido
      else codigosVistos.set(chave, linha.numero) // primeira vez: guarda a linha
    }
    if (v.segmento && !SEGMENTOS[simplificar(v.segmento)]) erros.push(`segmento: '${v.segmento}' não reconhecido (use Indústria, Comércio, Serviços, Saúde, Educação ou Tecnologia)`) // 4) segmento

    if (v.nivel_cliente && !['A', 'B', 'C'].includes(v.nivel_cliente.toUpperCase())) erros.push(`nivel_cliente: '${v.nivel_cliente}' inválido (use A, B ou C)`) // 5) nível

    if (v.faturamento_anual) { // 6) faturamento
      const n = lerNumero(v.faturamento_anual) // tenta virar número
      if (n === null) erros.push(`faturamento_anual: '${v.faturamento_anual}' não é um número`) // não é número
      else if (n < 0) erros.push('faturamento_anual: não pode ser negativo') // negativo
      else if (n >= 1e12) erros.push('faturamento_anual: valor acima do permitido') // absurdo
      else { if (n === 0) avisos.push('faturamento_anual: valor zerado'); v.faturamento_anual = n.toFixed(2) } // ok: guarda com 2 casas
    }
    if (v.servicos_contratados && v.servicos_contratados.split(';').every((s) => !s.trim())) erros.push('servicos_contratados: nenhum serviço informado') // 7) serviços separados por ;

    if (v.data_contratacao) { // 8) data
      const d = lerData(v.data_contratacao) // tenta ler
      if (!d) erros.push(`data_contratacao: '${v.data_contratacao}' não é uma data válida (use dd/mm/aaaa ou aaaa-mm-dd)`) // inválida
      else { if (d > hoje) avisos.push('data_contratacao: data no futuro'); v.data_contratacao = d } // ok
    }
    if (v.uf && !/^[A-Za-z]{2}$/.test(v.uf)) erros.push(`uf: '${v.uf}' inválida (use a sigla com 2 letras)`) // 9) UF opcional

    return { numero: linha.numero, valores: v, erros, avisos, valida: erros.length === 0 } // resultado da linha
  })
}

// ---------------------------------------------------------------------------
// PARTE 2 — LER O ARQUIVO .xlsx
// ---------------------------------------------------------------------------
// Deixa o cabeçalho "Código do Cliente " igual a "codigo_do_cliente" para comparar.
function normalizar(texto) { // recebe o texto do cabeçalho
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acentos
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') // minúsculo, "_" no lugar de espaços
}

// Transforma o valor de uma célula em texto (datas viram dd/mm/aaaa, números viram texto).
function celulaParaTexto(valor) { // recebe o valor da célula
  if (valor === null || valor === undefined) return '' // célula vazia
  if (valor instanceof Date) return valor.toISOString().slice(0, 10) // data do Excel vira aaaa-mm-dd
  return String(valor) // número ou texto vira texto
}

// Lê o arquivo. Devolve { linhas: [{ numero, campos }], colunasFaltando: [] }.
async function lerPlanilha(arquivo) { // async: leitura demora, então usamos await
  let tabela // vai guardar a matriz de linhas e colunas
  try {                                                     // tenta ler o arquivo
    tabela = await readSheet(arquivo, 'upload_clientes') // tenta a aba combinada
  } catch {                                                 // se não conseguir ler, devolve o erro
    tabela = await readSheet(arquivo) // se não existe, usa a primeira aba
  }
  if (!tabela.length) return { linhas: [], colunasFaltando: COLUNAS.slice(0, 8) } // arquivo vazio
  const cabecalho = tabela[0].map(normalizar) // primeira linha = nomes das colunas
  const colunasFaltando = COLUNAS.slice(0, 8).filter((c) => !cabecalho.includes(c)) // obrigatórias que não vieram
  const linhas = [] // resultado
  tabela.slice(1).forEach((celulas, i) => { // as linhas de dados começam depois do cabeçalho
    const campos = {} // um objeto { coluna: texto }
    cabecalho.forEach((nome, j) => { if (COLUNAS.includes(nome)) campos[nome] = celulaParaTexto(celulas[j]) }) // só colunas conhecidas
    if (Object.values(campos).every((t) => t.trim() === '')) return // ignora linha totalmente vazia
    linhas.push({ numero: i + 2, campos }) // numero = linha no Excel (1 é o cabeçalho)
  })
  return { linhas, colunasFaltando }                        // devolve as linhas lidas e as colunas que faltam
}

// ---------------------------------------------------------------------------
// PARTE 3 — A STORE (o que as telas usam)
// ---------------------------------------------------------------------------
export const useUploadStore = defineStore('upload', () => { // cria a store 'upload' (guarda o estado da tela de upload)
  const arquivoNome = ref('') // nome do arquivo escolhido
  const resultados = ref([]) // resultado de CADA linha (válida ou não)
  const colunasFaltando = ref([]) // colunas obrigatórias que não existem na planilha
  const analisando = ref(false) // true enquanto lê o arquivo
  const enviando = ref(false) // true enquanto envia ao backend
  const erro = ref('') // mensagem de erro para a tela
  const lote = ref(null) // lote criado no backend depois do envio

  const validas = computed(() => resultados.value.filter((r) => r.valida)) // só as linhas boas
  const invalidas = computed(() => resultados.value.filter((r) => !r.valida)) // só as linhas com erro
  const comAviso = computed(() => resultados.value.filter((r) => r.valida && r.avisos.length)) // boas, mas com aviso
  const podeLiberar = computed(() => validas.value.length > 0 && !colunasFaltando.value.length) // botão "Liberar" habilitado?

  function limpar() { // volta ao começo (novo upload)
    arquivoNome.value = ''; resultados.value = []; colunasFaltando.value = []; erro.value = ''; lote.value = null // zera tudo para escolher outra planilha
  }

  async function analisarArquivo(arquivo) { // chamado pela tela de Upload
    limpar() // zera o que havia
    if (!arquivo) { erro.value = 'Escolha um arquivo.'; return false } // nenhum arquivo
    if (!arquivo.name.toLowerCase().endsWith('.xlsx')) { erro.value = 'Envie um arquivo .xlsx (Excel).'; return false } // só xlsx
    if (arquivo.size > LIMITE_MB * 1024 * 1024) { erro.value = `O arquivo tem mais de ${LIMITE_MB} MB.`; return false } // grande demais
    analisando.value = true // liga o "carregando"
    try {                                                   // tenta analisar a planilha
      const lida = await lerPlanilha(arquivo) // lê o Excel
      arquivoNome.value = arquivo.name // guarda o nome
      colunasFaltando.value = lida.colunasFaltando // colunas que faltam
      resultados.value = colunasFaltando.value.length ? [] : validarLinhas(lida.linhas) // valida (se a planilha tem as colunas)
      if (!colunasFaltando.value.length && !resultados.value.length) { erro.value = 'A planilha não tem linhas de dados.'; return false } // vazia
      return true // deu certo: a tela pode ir para o relatório
    } catch {                                               // se falhar, mostra o erro
      erro.value = 'Não consegui ler o arquivo. Ele é um .xlsx válido?' // arquivo corrompido
      return false                                          // avisa que não deu certo
    } finally {                                             // no final, sempre
      analisando.value = false // desliga o "carregando"
    }
  }

  async function liberarParaBackend() { // chamado pelo botão "Liberar para o back-end"
    if (!podeLiberar.value) return false // segurança: sem linhas válidas não envia
    enviando.value = true; erro.value = '' // começa o envio
    try {                                                   // tenta enviar só as linhas válidas
      const linhas = validas.value.map((r) => ({ // monta SÓ as linhas válidas (invalidas.value nunca entra aqui)
        numeroLinha: r.numero, // linha original no Excel
        codigoCliente: r.valores.codigo_cliente,            // código do cliente
        nomeCliente: r.valores.nome_cliente,                // nome do cliente
        consultor: r.valores.consultor,                     // consultor
        segmento: r.valores.segmento,                       // segmento
        nivelCliente: r.valores.nivel_cliente,              // nível (A, B ou C)
        faturamentoAnual: r.valores.faturamento_anual,      // faturamento anual
        servicosContratados: r.valores.servicos_contratados, // serviços separados por ;
        dataContratacao: r.valores.data_contratacao,        // data da contratação
        cidade: r.valores.cidade,                           // cidade
        uf: r.valores.uf,                                   // UF
      }))                                                   // fim da lista de linhas
      lote.value = await uploadService.enviarValidadas({ arquivoNome: arquivoNome.value, descartadas: invalidas.value.length, linhas }) // POST /api/uploads/validadas
      return true                                           // avisa que deu certo
    } catch (e) {                                           // se falhar, guarda a mensagem
      erro.value = mensagemDeErro(e) // mostra o motivo
      return false                                          // avisa que não deu certo
    } finally {                                             // no final, sempre
      enviando.value = false                                // desliga o 'Enviando...'
    }
  }

  return { arquivoNome, resultados, colunasFaltando, analisando, enviando, erro, lote, validas, invalidas, comAviso, podeLiberar, limpar, analisarArquivo, liberarParaBackend } // o que a store entrega às telas
})
