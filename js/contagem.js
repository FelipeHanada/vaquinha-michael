/*
 * Contagem regressiva para a competição.
 * Este módulo não depende do DOM: recebe datas e devolve números e a situação.
 */

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** Converte o valor do config em `Date`, ou devolve `null` quando a data não é válida. */
export function lerData(valor) {
  if (!valor) return null;

  const data = valor instanceof Date ? valor : new Date(String(valor).trim());
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Situação da competição no instante informado: `antes`, `durante` ou `depois`.
 * Devolve `null` quando a data de início não é válida.
 */
export function situacao(inicio, fim, agora = new Date()) {
  if (!inicio || Number.isNaN(inicio.getTime())) return null;
  if (agora < inicio) return 'antes';

  const termino = fim && !Number.isNaN(fim.getTime()) ? fim : null;
  return termino && agora > termino ? 'depois' : 'durante';
}

/** Tempo restante até o alvo, em dias, horas, minutos e segundos. Nunca é negativo. */
export function tempoAte(alvo, agora = new Date()) {
  const restante = Math.max(0, alvo.getTime() - agora.getTime());

  return {
    dias: Math.floor(restante / DIA),
    horas: Math.floor((restante % DIA) / HORA),
    minutos: Math.floor((restante % HORA) / MINUTO),
    segundos: Math.floor((restante % MINUTO) / SEGUNDO)
  };
}
