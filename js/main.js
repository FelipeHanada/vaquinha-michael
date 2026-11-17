/* Lê data/config.json + data/doacoes.csv e monta a página. */
import { buscarPorNome, calcularResumo, maioresDoacoes, ordenarDoacoes, parseDoacoes } from './doacoes.js';
import { lerData, situacao, tempoAte } from './contagem.js';

const CONFIG_URL = './data/config.json';
const CSV_URL = './data/doacoes.csv';
const DOACOES_POR_PAGINA = 6;
const RANKING_TAMANHO = 10;

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentualFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const $ = (seletor) => document.querySelector(seletor);

/* As datas do config estão no horário de Brasília: formata no mesmo fuso para não mudar de dia. */
const FUSO = 'America/Sao_Paulo';
const formatarDia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: FUSO });
const formatarDiaMesAno = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSO });
const formatarMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: FUSO });

const estado = {
  doacoes: [],
  busca: '',
  ordenacao: 'data-desc',
  pagina: 1
};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  ativarBotoesDeCopia();
  ativarControlesDoadores();
  ajustarColunaAdesiva();

  try {
    const [config, csv] = await Promise.all([carregarJSON(CONFIG_URL), carregarTexto(CSV_URL)]);

    aplicarConfig(config);
    estado.doacoes = parseDoacoes(csv);
    renderizarProgresso(Number(config.meta) || 0);
    iniciarContagem(config.competicao);
    renderizarDoadores();
    renderizarRanking();
  } catch (erro) {
    console.error('[vaquinha]', erro);
    mostrarErro();
  }
}

/* ---------------- Rede ---------------- */

async function requisitar(url) {
  const resposta = await fetch(url, { cache: 'no-store' });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${url}`);
  return resposta;
}

async function carregarJSON(url) {
  return (await requisitar(url)).json();
}

async function carregarTexto(url) {
  return (await requisitar(url)).text();
}

/* ---------------- Render ---------------- */

function aplicarConfig(config) {
  const links = config.links || {};
  document.querySelectorAll('[data-link]').forEach((el) => {
    const url = links[el.dataset.link];
    if (!url) return;

    el.href = url;
    if (el.hasAttribute('data-link-texto')) el.textContent = url;
  });

  const pix = config.pix || {};
  definirValor('#pix-chave', pix.chave || '');
  definirValor('#pix-codigo', pix.copiaECola || '');
  definirTexto('#pix-titular', pix.titular || '');

  const qr = $('#pix-qr');
  if (qr && pix.qrCode) qr.src = pix.qrCode;
}

function renderizarProgresso(meta) {
  const { total, percentual, falta } = calcularResumo(estado.doacoes, meta);
  const percentualNaBarra = Math.min(100, percentual);

  definirTexto('#valor-atual', brl.format(total));
  definirTexto('#valor-meta', brl.format(meta));
  definirTexto('#valor-falta', meta > 0 ? `Faltam ${brl.format(falta)}` : '');
  definirTexto('#percentual', `${percentualFmt.format(percentual)}%`);

  const barra = $('#barra-meta');
  const preenchimento = $('#barra-fill');

  if (barra) {
    barra.setAttribute('aria-valuenow', String(Math.round(percentualNaBarra)));
    barra.setAttribute('aria-valuetext', `${brl.format(total)} de ${brl.format(meta)}`);
  }
  if (preenchimento) preenchimento.style.width = `${percentualNaBarra}%`;

  definirTexto(
    '#progresso-status',
    meta > 0 && falta <= 0 ? 'Meta atingida. Obrigado a todo mundo que ajudou!' : ''
  );
}

function renderizarDoadores() {
  estado.pagina = 1;
  desenharDoadores();
}

/** Lista já filtrada pela busca e na ordem escolhida no seletor. */
function doacoesVisiveis() {
  return ordenarDoacoes(buscarPorNome(estado.doacoes, estado.busca), estado.ordenacao);
}

function desenharDoadores() {
  const lista = $('#lista-doadores');
  if (!lista) return;

  const visiveis = doacoesVisiveis();
  atualizarResumoDoadores(visiveis.length);

  lista.replaceChildren();

  if (!estado.doacoes.length) {
    lista.append(criarItem('Nenhuma doação registrada ainda.'));
    desenharPaginacao(0);
    return;
  }

  if (!visiveis.length) {
    lista.append(criarItem(`Nenhuma doação encontrada para "${estado.busca.trim()}".`));
    desenharPaginacao(0);
    return;
  }

  const totalPaginas = Math.ceil(visiveis.length / DOACOES_POR_PAGINA);
  estado.pagina = Math.min(Math.max(1, estado.pagina), totalPaginas);

  const inicio = (estado.pagina - 1) * DOACOES_POR_PAGINA;
  visiveis
    .slice(inicio, inicio + DOACOES_POR_PAGINA)
    .forEach((doacao) => lista.append(criarLinhaDoador(doacao)));

  desenharPaginacao(totalPaginas);
}

function atualizarResumoDoadores(encontradas) {
  const total = estado.doacoes.length;

  if (!total) {
    definirTexto('#doadores-resumo', '');
    return;
  }

  if (encontradas === total) {
    definirTexto(
      '#doadores-resumo',
      `${total} doaç${total === 1 ? 'ão' : 'ões'} recebida${total === 1 ? '' : 's'}`
    );
    return;
  }

  definirTexto('#doadores-resumo', `${encontradas} de ${total} doações`);
}

function criarLinhaDoador(doacao) {
  const dados = criar('div', 'text-break');
  dados.append(criar('div', 'fw-semibold', doacao.nome));

  if (doacao.mensagem) dados.append(criar('div', 'small', doacao.mensagem));
  if (doacao.data) dados.append(criar('div', 'small text-secondary', doacao.data.toLocaleDateString('pt-BR')));

  const linha = criar('li', 'list-group-item d-flex justify-content-between align-items-start gap-3');
  linha.append(dados, criar('span', 'text-success fw-semibold text-nowrap', brl.format(doacao.valor)));

  return linha;
}

function desenharPaginacao(totalPaginas) {
  const lista = $('#paginacao');
  if (!lista) return;

  const navegacao = lista.closest('nav');
  lista.replaceChildren();

  if (navegacao) navegacao.classList.toggle('d-none', totalPaginas <= 1);
  if (totalPaginas <= 1) return;

  adicionarBotaoPagina('Anterior', estado.pagina - 1, {
    desativado: estado.pagina === 1,
    titulo: 'Página anterior'
  });

  for (let numero = 1; numero <= totalPaginas; numero++) {
    adicionarBotaoPagina(String(numero), numero, {
      ativo: numero === estado.pagina,
      titulo: `Página ${numero}`
    });
  }

  adicionarBotaoPagina('Próxima', estado.pagina + 1, {
    desativado: estado.pagina === totalPaginas,
    titulo: 'Próxima página'
  });

  function adicionarBotaoPagina(rotulo, destino, { ativo = false, desativado = false, titulo = '' } = {}) {
    const item = criar('li', 'page-item' + (ativo ? ' active' : '') + (desativado ? ' disabled' : ''));
    const botao = criar('button', 'page-link', rotulo);
    botao.type = 'button';

    if (titulo) botao.setAttribute('aria-label', titulo);
    if (ativo) botao.setAttribute('aria-current', 'page');

    if (ativo || desativado) {
      botao.disabled = true;
    } else {
      botao.addEventListener('click', () => {
        estado.pagina = destino;
        desenharDoadores();
      });
    }

    item.append(botao);
    lista.append(item);
  }
}

function criarItem(texto) {
  return criar('li', 'list-group-item text-secondary', texto);
}

function criar(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function renderizarRanking() {
  const secao = $('#ranking-secao');
  const lista = $('#ranking-doacoes');
  if (!secao || !lista) return;

  const maiores = maioresDoacoes(estado.doacoes, RANKING_TAMANHO);
  secao.hidden = maiores.length === 0;
  lista.replaceChildren();

  maiores.forEach((doacao, indice) => {
    const posicao = criar('span', 'ranking-posicao', String(indice + 1));
    posicao.dataset.posicao = String(indice + 1);

    const item = criar('li', 'list-group-item d-flex align-items-center gap-2 px-0');
    item.append(
      posicao,
      criar('span', 'ranking-nome text-break', doacao.nome),
      criar('span', 'text-success fw-semibold text-nowrap', brl.format(doacao.valor))
    );

    lista.append(item);
  });
}

/* ---------------- Busca e ordenação dos doadores ---------------- */

function ativarControlesDoadores() {
  const busca = $('#busca-doadores');
  if (busca) {
    busca.addEventListener('input', () => {
      if (!estado.doacoes.length) return;

      estado.busca = busca.value;
      estado.pagina = 1;
      desenharDoadores();
    });
  }

  const ordenacao = $('#ordenacao-doadores');
  if (ordenacao) {
    ordenacao.addEventListener('change', () => {
      if (!estado.doacoes.length) return;

      estado.ordenacao = ordenacao.value;
      estado.pagina = 1;
      desenharDoadores();
    });
  }
}

/* ---------------- Contagem regressiva ---------------- */

/*
 * Os números são só decoração para os olhos: quem usa leitor de tela ouve a
 * legenda, que muda uma vez por dia (e não a cada segundo).
 */
function iniciarContagem(competicao) {
  const cartao = $('#contagem-card');
  const inicio = lerData(competicao && competicao.inicio);
  if (!cartao || !inicio) return;

  const fim = lerData(competicao && competicao.fim);
  const numeros = $('#contagem-numeros');
  let relogio = null;

  definirTexto('#contagem-periodo', formatarPeriodo(inicio, fim));

  cartao.hidden = false;
  desenhar();

  // Só vale bater o relógio enquanto a data de início não chega.
  if (situacao(inicio, fim) === 'antes') relogio = setInterval(desenhar, 1000);

  function desenhar() {
    const agora = new Date();
    const momento = situacao(inicio, fim, agora);

    if (momento === 'antes') {
      const { dias, horas, minutos, segundos } = tempoAte(inicio, agora);

      definirTexto('#contagem-dias', String(dias));
      definirTexto('#contagem-horas', doisDigitos(horas));
      definirTexto('#contagem-minutos', doisDigitos(minutos));
      definirTexto('#contagem-segundos', doisDigitos(segundos));
      definirTexto('#contagem-legenda', textoDaEspera(dias));
      return;
    }

    // Chegou a data: os números saem de cena e o relógio para de bater.
    if (numeros) numeros.hidden = true;
    definirTexto(
      '#contagem-legenda',
      momento === 'durante'
        ? 'A competição está acontecendo!'
        : 'A competição já aconteceu. Obrigado a quem ajudou!'
    );

    clearInterval(relogio);
    relogio = null;
  }
}

function formatarPeriodo(inicio, fim) {
  if (!fim) return formatarDiaMesAno.format(inicio);

  // Mesmo mês e ano: "13 a 17 de julho de 2027" em vez de repetir o mês.
  if (formatarMesAno.format(inicio) === formatarMesAno.format(fim)) {
    return `${formatarDia.format(inicio)} a ${formatarDiaMesAno.format(fim)}`;
  }

  return `${formatarDiaMesAno.format(inicio)} a ${formatarDiaMesAno.format(fim)}`;
}

function textoDaEspera(dias) {
  if (dias === 0) return 'Falta menos de 1 dia para a competição';
  return dias === 1 ? 'Falta 1 dia para a competição' : `Faltam ${dias} dias para a competição`;
}

/* ---------------- Copiar ---------------- */

function ativarBotoesDeCopia() {
  document.querySelectorAll('[data-copy-target]').forEach((botao) => {
    botao.addEventListener('click', () => copiarAlvoDoBotao(botao));
  });
}

async function copiarAlvoDoBotao(botao) {
  const alvo = document.getElementById(botao.dataset.copyTarget);
  if (!alvo) return;

  const texto = ('value' in alvo ? alvo.value : alvo.textContent).trim();
  if (!texto || !(await copiar(texto))) return;

  const rotuloOriginal = botao.textContent;
  botao.textContent = 'Copiado!';
  setTimeout(() => { botao.textContent = rotuloOriginal; }, 2000);
}

async function copiar(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (_) { /* tenta o fallback abaixo */ }

  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    const copiou = document.execCommand('copy');
    document.body.removeChild(area);
    return copiou;
  } catch (_) {
    return false;
  }
}

/* ---------------- Coluna que acompanha a rolagem ---------------- */

/*
 * Em telas grandes o bloco de doação fica preso enquanto a galeria rola.
 * Quando ele é mais alto que a janela, o `top` recebe um valor negativo para
 * que a base do bloco pare na base da tela, deixando o PIX e o convite do
 * PCUFF à vista. Quem controla o movimento é o `position: sticky` do CSS, no
 * compositor: nada é recalculado a cada quadro, então rolar rápido ou ir e
 * voltar com a página não treme.
 */
function ajustarColunaAdesiva() {
  const coluna = document.querySelector('.coluna-adesiva');
  if (!coluna) return;

  const desktop = window.matchMedia('(min-width: 992px)');

  // A altura do bloco não muda com a rolagem: mede só no load e no resize.
  function ajustar() {
    coluna.style.top = '';
    if (!desktop.matches) return;

    // A margem vem do CSS (`top`), para não existir o mesmo valor em dois lugares.
    const margem = parseFloat(window.getComputedStyle(coluna).top) || 0;
    const base = window.innerHeight - margem - coluna.offsetHeight;

    // `top` positivo já é o padrão do CSS: só mexe quando o bloco não cabe.
    if (base < margem) coluna.style.top = `${base}px`;
  }

  window.addEventListener('resize', ajustar);
  window.addEventListener('load', ajustar);
  desktop.addEventListener('change', ajustar);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ajustar).catch(() => {});
  }

  ajustar();
}

/* ---------------- Utilidades ---------------- */

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

function definirTexto(seletor, texto) {
  const elemento = $(seletor);
  if (elemento) elemento.textContent = texto;
}

function definirValor(seletor, valor) {
  const elemento = $(seletor);
  if (elemento) elemento.value = valor;
}

function mostrarErro() {
  const dica = location.protocol === 'file:'
    ? 'Abra a página por um servidor local (python -m http.server).'
    : 'Não foi possível carregar data/config.json e data/doacoes.csv.';

  definirTexto('#progresso-status', dica);
  definirTexto('#doadores-resumo', '');

  const lista = $('#lista-doadores');
  if (lista) lista.replaceChildren(criarItem(dica));
}
