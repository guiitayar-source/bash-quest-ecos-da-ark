import { chapters } from './campaign'
import { suits } from './story'
import type { Slot } from './saves'

export type MenuMode = 'title' | 'new' | 'load'

const safe = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const menuButton = (act: string, label: string, cls = '') =>
  '<button type="button" class="front-button ' +
  cls +
  '" data-act="' +
  act +
  '">' +
  label +
  '</button>'
const brand = '<img src="/ark.svg" alt=""> <span>BASH QUEST</span>'

export function frontMarkup(
  mode: MenuMode,
  entries: Slot[],
  playing: boolean,
  error: string,
) {
  const header =
    '<div class="front-top"><span class="front-brand">' +
    brand +
    '</span>' +
    (playing ? menuButton('resume-session', 'Voltar à partida') : '') +
    '</div>'
  const alert = error
    ? '<p role="alert" class="front-error">' + safe(error) + '</p>'
    : ''
  if (mode === 'new') {
    return (
      header +
      '<section class="front-form"><h1>Crie seu personagem</h1><p>Lara encontrou você nas encostas da ARK. Como ela deve chamar você?</p>' +
      '<form id="character-form"><label for="character-name">Nome</label><input id="character-name" name="name" required maxlength="24" placeholder="Seu nome na ARK" autocomplete="off">' +
      '<fieldset><legend>Traje de exploração</legend><div class="suit-options">' +
      suits
        .map(
          (suit, i) =>
            '<label><input type="radio" name="suit" value="' +
            suit.id +
            '" ' +
            (i === 0 ? 'checked' : '') +
            '><span><img src="/art/player-' +
            suit.id +
            '-1.png" alt=""><b>' +
            suit.name +
            '</b></span></label>',
        )
        .join('') +
      '</div></fieldset>' +
      alert +
      '<div class="front-actions"><button class="front-button primary" type="submit">Começar jornada <span>→</span></button>' +
      menuButton('menu', 'Voltar') +
      '</div></form></section>'
    )
  }
  if (mode === 'load') {
    return (
      header +
      '<section class="front-form"><h1>Carregar partida</h1>' +
      alert +
      (entries.length
        ? '<div class="slot-list">' +
          entries
            .map((entry, i) => {
              const player = entry.state.story?.player
              const location =
                entry.state.room < 0
                  ? 'Corredor de manutenção'
                  : (chapters[entry.state.room]?.room ?? 'ARK')
              const date = new Date(entry.savedAt).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
              return menuButton(
                'load:' + i,
                '<img src="/art/player-' +
                  (player?.suit ?? 'ochre') +
                  '-1.png" alt=""><span><b>' +
                  safe(player?.name ?? 'Campanha original') +
                  '</b><small>' +
                  safe(location) +
                  ' · ' +
                  entry.state.completed +
                  '/7 setores</small></span><time>' +
                  date +
                  '</time><span aria-hidden="true">→</span>',
                'slot',
              )
            })
            .join('') +
          '</div>'
        : '<p>Você ainda não tem partidas salvas neste navegador.</p>') +
      '<div class="front-actions">' +
      menuButton('menu', 'Voltar') +
      '</div></section>'
    )
  }
  return (
    header +
    '<section class="front-home"><div class="front-setting"><i></i> REFÚGIO ARK · DEPOIS DO COLAPSO</div><h1>Ecos da <em>ARK</em></h1>' +
    '<p>A poeira engoliu as estradas. Dentro da ARK, duas pessoas mantêm acesa a luz que ainda guia quem vem de fora.</p>' +
    alert +
    '<div class="front-nav" aria-label="Menu principal">' +
    (entries.length && !playing
      ? menuButton('load:0', 'Continuar <span>→</span>', 'primary')
      : '') +
    menuButton(
      'new',
      'Novo jogo <span>+</span>',
      !entries.length ? 'primary' : '',
    ) +
    menuButton('listing', 'Carregar partida <span>↗</span>') +
    (playing ? menuButton('save-menu', 'Salvar partida <span>↓</span>') : '') +
    '</div></section><div class="front-caption"><span><i></i> ESTAÇÃO TERRESTRE ARK</span><span>31 °S · ÚLTIMO SINAL DE SUPERFÍCIE</span></div>'
  )
}
