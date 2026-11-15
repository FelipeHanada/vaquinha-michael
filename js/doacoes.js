/*
 * Leitura de data/doacoes.csv e cálculo dos totais da vaquinha.
 * Este módulo não depende do DOM: recebe texto e devolve dados.
 */

const DELIMITADORES = [';', ',', '\t'];
const COLUNAS = ['data', 'nome', 'valor', 'mensagem'];

/** Transforma o conteúdo do CSV na lista de doações, da mais recente para a mais antiga. */
export function parseDoacoes(texto) {
  const csv = String(texto ?? '').replace(/^\uFEFF/, '');
  const linhas = parseCSV(csv, detectarDelimitador(csv)).filter(
    (campos) => campos.some((campo) => campo.trim() !== '') && !(campos[0] || '').trim().startsWith('#')
  );

  // Só o cabeçalho (ou nem isso): não há doação para mostrar.
  if (linhas.length < 2) return [];

  const colunas = mapearColunas(linhas[0]);

  return linhas
    .slice(1)
    .map((campos, ordem) => criarDoacao(campos, colunas, ordem))
    .filter(Boolean)
    .sort(compararPorData);
}

/** Total arrecadado, percentual e quanto falta para a meta. */
export function calcularResumo(doacoes, meta) {
  const total = doacoes.reduce((soma, doacao) => soma + doacao.valor, 0);
  const percentual = meta > 0 ? (total / meta) * 100 : 0;

  return { total, percentual, falta: Math.max(0, meta - total) };
}

/* ---------------- CSV ---------------- */

/** Escolhe o delimitador mais frequente na primeira linha útil do arquivo. */
function detectarDelimitador(texto) {
  const primeiraLinha = texto
    .split('\n')
    .map((linha) => linha.trim())
    .find((linha) => linha !== '' && !linha.startsWith('#') && DELIMITADORES.some((delim) => linha.includes(delim)));

  if (!primeiraLinha) return DELIMITADORES[0];

  return DELIMITADORES.map((delim) => ({
    delim,
    ocorrencias: primeiraLinha.split(delim).length
  })).reduce((melhor, atual) => (atual.ocorrencias > melhor.ocorrencias ? atual : melhor)).delim;
}

/** Divide o CSV em linhas e campos, respeitando aspas e quebras de linha. */
function parseCSV(texto, delim) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let aspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else aspas = false;
      } else campo += c;
      continue;
    }

    if (c === '"') aspas = true;
    else if (c === delim) { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }

  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

function mapearColunas(campos) {
  const nomes = campos.map(normalizarCabecalho);

  return Object.fromEntries(COLUNAS.map((coluna) => [coluna, nomes.indexOf(coluna)]));
}

function normalizarCabecalho(valor) {
  return String(valor).replace(/^\uFEFF/, '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function criarDoacao(campos, colunas, ordem) {
  const valor = parseValor(campo(campos, colunas.valor));
  if (!Number.isFinite(valor) || valor < 0) return null;

  const nome = campo(campos, colunas.nome);

  return {
    nome: ehAnonimo(nome) ? 'Anônimo' : nome,
    valor,
    data: parseData(campo(campos, colunas.data)),
    mensagem: campo(campos, colunas.mensagem),
    ordem
  };
}

function campo(campos, indice) {
  return indice >= 0 && indice < campos.length ? campos[indice].trim() : '';
}

function ehAnonimo(nome) {
  return nome === '' || /^an[oô]nimo$/i.test(nome);
}

function compararPorData(a, b) {
  const dataA = a.data ? a.data.getTime() : 0;
  const dataB = b.data ? b.data.getTime() : 0;

  return dataB - dataA || b.ordem - a.ordem;
}

/* ---------------- Valores e datas ---------------- */

function parseValor(bruto) {
  let s = String(bruto).replace(/[^\d.,-]/g, '');
  if (!s) return NaN;

  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/\.\d{3}(\D|$)/.test(s)) s = s.replace(/\./g, '');

  return parseFloat(s);
}

function parseData(bruto) {
  const s = String(bruto).trim();
  if (!s) return null;

  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    let ano = Number(m[3]);
    if (ano < 100) ano += 2000;
    return new Date(ano, Number(m[2]) - 1, Number(m[1]));
  }

  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  const data = new Date(s);
  return isNaN(data.getTime()) ? null : data;
}
