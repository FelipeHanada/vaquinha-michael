/* Lê data/config.json + data/doacoes.csv e monta a página. */
(function () {
  'use strict';

  const CONFIG_URL = './data/config.json';
  const CSV_URL = './data/doacoes.csv';
  const POR_PAGINA = 6;

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const $ = (s) => document.querySelector(s);

  let doacoes = [];
  let pagina = 1;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindCopy();

    try {
      const [config, csv] = await Promise.all([getJSON(CONFIG_URL), getText(CSV_URL)]);

      aplicarConfig(config);
      doacoes = parseDoacoes(csv);
      renderProgresso(config, doacoes);
      renderDoadores();
    } catch (e) {
      console.error('[vaquinha]', e);
      mostrarErro();
    }
  }

  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
    return r.json();
  }

  async function getText(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
    return r.text();
  }

  /* ---------------- CSV ---------------- */

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

  function parseDoacoes(texto) {
    const cabecalhoBruto = texto.trim().split('\n')[0];
    const delim = [';', ',', '\t'].sort((a, b) => cabecalhoBruto.split(b).length - cabecalhoBruto.split(a).length)[0];

    const linhas = parseCSV(texto.trim(), delim).filter(
      (l) => l.some((c) => c.trim() !== '') && !(l[0] || '').trim().startsWith('#')
    );

    if (!linhas.length) return [];

    const head = linhas.shift().map(chave);
    const iData = head.indexOf('data');
    const iNome = head.indexOf('nome');
    const iValor = head.indexOf('valor');
    const iMsg = head.indexOf('mensagem');

    const lista = [];

    linhas.forEach((celulas, ordem) => {
      const get = (i) => (i >= 0 && i < celulas.length ? celulas[i].trim() : '');

      const valor = parseValor(get(iValor));
      if (!Number.isFinite(valor) || valor <= 0) return;

      const nome = get(iNome);
      const anonimo = nome === '' || /^an[oô]nimo$/i.test(nome);

      lista.push({
        nome: anonimo ? 'Anônimo' : nome,
        valor,
        data: parseData(get(iData)),
        mensagem: get(iMsg),
        ordem
      });
    });

    lista.sort((a, b) => {
      const da = a.data ? a.data.getTime() : 0;
      const db = b.data ? b.data.getTime() : 0;
      return db - da || b.ordem - a.ordem;
    });

    return lista;
  }

  function chave(s) {
    return String(s).replace(/^\uFEFF/, '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

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

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ---------------- Render ---------------- */

  function aplicarConfig(cfg) {
    const links = cfg.links || {};
    document.querySelectorAll('[data-link]').forEach((el) => {
      if (links[el.dataset.link]) el.href = links[el.dataset.link];
    });

    const pix = cfg.pix || {};
    setVal('#pix-chave', pix.chave || '');
    setVal('#pix-codigo', pix.copiaECola || '');
    setTexto('#pix-titular', pix.titular || '');

    const qr = $('#pix-qr');
    if (qr && pix.qrCode) qr.src = pix.qrCode;
  }

  function renderProgresso(cfg, lista) {
    const meta = Number(cfg.meta) || 0;
    const total = lista.reduce((s, d) => s + d.valor, 0);
    const falta = Math.max(0, meta - total);
    const percentual = meta > 0 ? (total / meta) * 100 : 0;

    setTexto('#valor-atual', brl.format(total));
    setTexto('#valor-meta', brl.format(meta));
    setTexto('#valor-falta', meta > 0 ? `Faltam ${brl.format(falta)}` : '');
    setTexto('#percentual', `${pctFmt.format(percentual)}%`);

    const barra = $('#barra-meta');
    const fill = $('#barra-fill');

    if (barra) {
      barra.setAttribute('aria-valuenow', String(Math.min(100, Math.round(percentual))));
      barra.setAttribute('aria-valuetext', `${brl.format(total)} de ${brl.format(meta)}`);
    }
    if (fill) fill.style.width = `${Math.min(100, percentual)}%`;

    setTexto('#progresso-status', meta > 0 && falta <= 0 ? 'Meta atingida. Obrigado a todo mundo que ajudou!' : '');
  }

  function renderDoadores() {
    setTexto(
      '#doadores-resumo',
      doacoes.length ? `${doacoes.length} doaç${doacoes.length === 1 ? 'ão' : 'ões'} recebida${doacoes.length === 1 ? '' : 's'}` : ''
    );

    pagina = 1;
    desenharPagina();
  }

  function desenharPagina() {
    const lista = $('#lista-doadores');
    if (!lista) return;

    lista.innerHTML = '';

    if (!doacoes.length) {
      lista.appendChild(item('Nenhuma doação registrada ainda.'));
      montarPaginacao(0);
      return;
    }

    const totalPaginas = Math.ceil(doacoes.length / POR_PAGINA);
    pagina = Math.min(Math.max(1, pagina), totalPaginas);

    const inicio = (pagina - 1) * POR_PAGINA;
    doacoes.slice(inicio, inicio + POR_PAGINA).forEach((d) => lista.appendChild(linhaDoador(d)));

    montarPaginacao(totalPaginas);
  }

  function linhaDoador(d) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-start gap-3';

    const esquerda = document.createElement('div');
    esquerda.className = 'text-break';

    const nome = document.createElement('div');
    nome.className = 'fw-semibold';
    nome.textContent = d.nome;
    esquerda.appendChild(nome);

    if (d.mensagem) {
      const msg = document.createElement('div');
      msg.className = 'small';
      msg.textContent = d.mensagem;
      esquerda.appendChild(msg);
    }

    if (d.data) {
      const data = document.createElement('div');
      data.className = 'small text-secondary';
      data.textContent = d.data.toLocaleDateString('pt-BR');
      esquerda.appendChild(data);
    }

    const valor = document.createElement('span');
    valor.className = 'text-success fw-semibold text-nowrap';
    valor.textContent = brl.format(d.valor);

    li.append(esquerda, valor);
    return li;
  }

  function montarPaginacao(totalPaginas) {
    const lista = $('#paginacao');
    if (!lista) return;

    const wrapper = lista.closest('nav');
    lista.innerHTML = '';

    if (totalPaginas <= 1) {
      if (wrapper) wrapper.classList.add('d-none');
      return;
    }
    if (wrapper) wrapper.classList.remove('d-none');

    const adicionar = (rotulo, destino, opcoes) => {
      const { ativo = false, desativado = false, titulo = '' } = opcoes || {};

      const li = document.createElement('li');
      li.className = 'page-item' + (ativo ? ' active' : '') + (desativado ? ' disabled' : '');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-link';
      btn.textContent = rotulo;

      if (titulo) btn.setAttribute('aria-label', titulo);
      if (ativo) btn.setAttribute('aria-current', 'page');

      if (desativado || ativo) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          pagina = destino;
          desenharPagina();
        });
      }

      li.appendChild(btn);
      lista.appendChild(li);
    };

    adicionar('Anterior', pagina - 1, { desativado: pagina === 1, titulo: 'Página anterior' });

    for (let i = 1; i <= totalPaginas; i++) {
      adicionar(String(i), i, { ativo: i === pagina, titulo: `Página ${i}` });
    }

    adicionar('Próxima', pagina + 1, { desativado: pagina === totalPaginas, titulo: 'Próxima página' });
  }

  function item(texto) {
    const li = document.createElement('li');
    li.className = 'list-group-item text-secondary';
    li.textContent = texto;
    return li;
  }

  /* ---------------- Copiar ---------------- */

  function bindCopy() {
    document.querySelectorAll('[data-copy-target]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const alvo = document.getElementById(btn.dataset.copyTarget);
        if (!alvo) return;

        const texto = ('value' in alvo ? alvo.value : alvo.textContent).trim();
        if (!texto) return;

        if (!(await copiar(texto))) return;

        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        setTimeout(() => { btn.textContent = original; }, 2000);
      });
    });
  }

  async function copiar(texto) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        return true;
      }
    } catch (_) { /* fallback abaixo */ }

    try {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  /* ---------------- Utilidades ---------------- */

  function setTexto(sel, texto) {
    const el = $(sel);
    if (el) el.textContent = texto;
  }

  function setVal(sel, valor) {
    const el = $(sel);
    if (el) el.value = valor;
  }

  function mostrarErro() {
    const dica = location.protocol === 'file:'
      ? 'Abra a página por um servidor local (python -m http.server).'
      : 'Não foi possível carregar data/config.json e data/doacoes.csv.';

    setTexto('#progresso-status', dica);
    setTexto('#doadores-resumo', '');

    const lista = $('#lista-doadores');
    if (lista) {
      lista.innerHTML = '';
      lista.appendChild(item(dica));
    }
  }
})();
