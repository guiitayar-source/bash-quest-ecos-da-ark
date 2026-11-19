import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './style.css'
import { playCue, type SoundCue } from './audio'
import { acquire, card, summary } from './manual'
import {
  createElement,
  Compass,
  BookOpen,
  NotebookText,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Monitor,
  Radio,
  ChevronRight,
  Lightbulb,
  Flag,
  MapPin,
  Keyboard,
  LockKeyhole,
  Check,
  Terminal,
  Boxes,
  SatelliteDish,
  Wrench,
  FlaskConical,
  Cpu,
  Power,
  Zap,
  Route,
  X,
  ArrowUpRight,
  FileCode,
  Save as SaveIcon,
  RotateCcw,
  Diamond,
  Activity,
  DoorOpen,
  CircleHelp,
  Folder,
  FileText,
  Search,
  Play,
  PanelRight,
  Package,
  GitBranch,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide'
import {
  chapters,
  TOTAL_CHAPTERS,
  FINAL_CHAPTER,
  isScriptChapter,
  defaultRunCommand,
  fresh,
  mark,
  record,
  radioTip,
  activePractice,
  advancePractice,
  editorAvailable,
  goals,
  finish,
  enter,
  scriptName,
  restoreRoom,
  diagnoseScript,
  starterTemplate,
} from './campaign'
import { run, path, write } from './shell'
import { bootWorld, nearby, type Spot } from './world'
import { deleteSlot, hydrate, importLegacy, slots, storeSlot, type Slot } from './saves'
import { frontMarkup, type MenuMode } from './front'
import { crew, conversation, difficulties, playerDifficulty, suits, type NPC } from './story'
import { bashLint, completeCommand, diskEntries, operatorRank } from './assist'
const icons = {
  Compass,
  BookOpen,
  NotebookText,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Monitor,
  Radio,
  ChevronRight,
  Lightbulb,
  Flag,
  MapPin,
  Keyboard,
  LockKeyhole,
  Check,
  Terminal,
  Boxes,
  SatelliteDish,
  Wrench,
  FlaskConical,
  Cpu,
  Power,
  Zap,
  Route,
  X,
  ArrowUpRight,
  FileCode,
  SaveIcon,
  RotateCcw,
  Diamond,
  Activity,
  DoorOpen,
  CircleHelp,
  Folder,
  FileText,
  Search,
  Play,
  PanelRight,
  Package,
  GitBranch,
  SlidersHorizontal,
  ShieldCheck,
}
const icon = (name: keyof typeof icons, size = 18) =>
  createElement(icons[name], {
    width: size,
    height: size,
    'stroke-width': 1.7,
    'aria-hidden': 'true',
  }).outerHTML
const sectorIcons: (keyof typeof icons)[] = [
  'Power',
  'Zap',
  'Boxes',
  'SatelliteDish',
  'Package',
  'Activity',
  'GitBranch',
  'Wrench',
  'SlidersHorizontal',
  'FlaskConical',
  'ShieldCheck',
  'Cpu',
]
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  )
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!
const s = fresh()
let activeId: string | undefined
let menuMode: MenuMode = 'title'
let menuEntries: Slot[] = []
let menuVisible = true
let menuBusy = false
let talking: { npc: NPC; topic: string } | undefined
let commandFeedback: { ok: boolean; text: string } | undefined
const practiceHints: Record<string, number> = {}
let modal = '',
  notice = '',
  heldTerminal = false,
  restoringEnergy = false,
  history: string[] = [],
  historyPos = 0,
  frame: ReturnType<typeof bootWorld> | undefined
const current = () => Math.min(s.completed, FINAL_CHAPTER)
const note = (text: string) => {
  if (!s.notes.includes(text)) s.notes.push(text)
}
const button = (act: string, label: string, cls = '', attrs = '') =>
  '<button type="button" data-act="' +
  act +
  '" class="' +
  cls +
  '" ' +
  attrs +
  '>' +
  label +
  '</button>'
const pad = (n: number) => String(n).padStart(2, '0')
let saveAttempt = 0
async function save() {
  if (!activeId) return false
  const slot = activeId
  const attempt = ++saveAttempt
  $('#saved').textContent = 'Salvando…'
  let saved = true
  try {
    await storeSlot(slot, s)
  } catch {
    saved = false
  }
  const status = document.querySelector('#saved')
  if (status && activeId === slot && saveAttempt === attempt)
    status.textContent = saved ? 'Salvo localmente' : 'Falha ao salvar'
  return saved
}
const tone = (cue: SoundCue = 'interface') => playCue(cue, () => s.sound)
let newAcquisitions: string[] = []
let manualTopic = ''
let manualSearch = ''
let returnScreen: 'terminal' | 'editor' = 'terminal'
let terminalInput = ''
let confirmDelete: number | undefined
let explorerOverride: boolean | undefined
$('#app').innerHTML =
  `<div id="front" class="front"></div><div id="journey" hidden><header><div class="top"><a class="brand" href="#" aria-label="Bash Quest, exploração"><img src="/ark.svg" alt=""><span>BASH<span class="brand-dot">_</span>QUEST<small>ECOS DA ARK</small></span></a>
<nav aria-label="Navegação principal">${button('world', icon('Compass') + 'Exploração', 'nav active')}${button('journal', icon('NotebookText') + 'Diário', 'nav')}${button('manual', icon('BookOpen') + 'Manual', 'nav')}</nav>
<div class="right-top">${button('menu', 'Menu', 'game-menu')}<span class="save"><i></i><span id="saved">Salvo localmente</span></span>${button('sound', '', 'square', 'aria-label="Ativar som"')}${button('controls', icon('CircleHelp'), 'square', 'aria-label="Controles do jogo"')}</div></div></header>
<main><div class="heading"><div><div class="eyebrow"><i class="slash"></i> ESTAÇÃO ARK <b>/</b> <span id="sector"></span></div><h1 id="title"></h1></div><div id="chapter-tag"></div></div>
<div class="layout"><section class="viewport card" id="viewport" aria-label="Visor de exploração"><div class="cardhead"><span class="cap">${icon('Monitor', 16)} Visor de exploração</span><div class="feed"><i></i> AO VIVO ${button('full', icon('Maximize', 15), 'plain', 'aria-label="Ampliar visor"')}</div></div>
<div class="stage"><div id="game"></div><div class="camera-label"><b></b><span id="cam"></span></div><div id="energy-objective" aria-live="polite"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div><div id="interact"></div></div>
<div class="bindings"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <em>ou</em> <span class="arrows">↑←↓→</span> Mover</span><span><kbd>E</kbd> Interagir</span><span><kbd>J</kbd> Diário</span><span><kbd>M</kbd> Manual</span>${button('hint', icon('Lightbulb', 14) + ' Dica', 'energy-hint', 'hidden')}</div></section>
<aside><section class="mission card" id="mission"></section><section class="operator card" id="operator"></section><section class="toolbox card" id="toolbox"></section></aside></div>
<section class="route card"><div class="routehead"><h2>${icon('Route', 20)} Rota da campanha</h2><span id="route-count"></span></div><div id="route"></div></section></main>
<footer><span><i></i> ARK OS <b>//</b> SISTEMA DE EXPLORAÇÃO</span><span>BASH QUEST <b>/</b> ECOS DA ARK</span></footer></div>
<dialog id="dialog" aria-labelledby="dialog-title"></dialog><div id="toast" role="status"></div>`
const dialog = $<HTMLDialogElement>('#dialog')
const front = $('#front')
const journey = $('#journey')
function displayMenu(mode: MenuMode, error = '') {
  menuVisible = true
  menuMode = mode
  journey.hidden = true
  front.hidden = false
  front.innerHTML = frontMarkup(mode, menuEntries, Boolean(activeId), error, confirmDelete)
  if (mode === 'new') $('#character-name').focus()
  else front.querySelector('button')?.focus({ preventScroll: true })
}
async function openMenu(mode: MenuMode = 'title', flush = true) {
  if (menuBusy) return
  menuBusy = true
  confirmDelete = undefined
  let message = ''
  try {
    if (flush && activeId && !(await save()))
      message = 'Não foi possível salvar a partida atual.'
    menuEntries = await slots()
  } catch {
    message = 'O banco de partidas está indisponível neste navegador.'
  } finally {
    menuBusy = false
  }
  displayMenu(mode, message)
}
function resumeJourney() {
  menuVisible = false
  front.hidden = true
  journey.hidden = false
  render()
  if (!frame) {
    frame = bootWorld(
      $('#game'),
      s,
      () => menuVisible || Boolean(modal) || restoringEnergy,
      (moved) => {
        syncInteraction()
        if (moved && !menuVisible) void save()
      },
    )
  } else {
    frame.game.scale.refresh()
    frame.refresh()
  }
  $('.nav').focus({ preventScroll: true })
}
function loadSlot(slot: Slot) {
  if (dialog.open) dialog.close()
  modal = ''
  heldTerminal = false
  commandFeedback = undefined
  confirmDelete = undefined
  explorerOverride = undefined
  manualSearch = ''
  const state = hydrate(slot.state)
  const resume = state.screen
  Object.assign(s, state, { story: state.story })
  history = []
  newAcquisitions = []
  terminalInput = ''
  historyPos = 0
  talking = undefined
  activeId = slot.id
  resumeJourney()
  if ((resume === 'terminal' || resume === 'editor') && s.room >= 0) {
    heldTerminal = true
    show(resume)
  } else if (s.completed === TOTAL_CHAPTERS && !s.endsSeen) show('credits')
}
front.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement
  if (form.id !== 'character-form') return
  event.preventDefault()
  if (menuBusy) return
  const fields = new FormData(form)
  const name = String(fields.get('name') || '').trim()
  const suit = suits.find((item) => item.id === fields.get('suit'))
  const difficulty =
    difficulties.find((item) => item.id === fields.get('difficulty'))?.id ??
    'windows'
  const input = $<HTMLInputElement>('#character-name')
  if (!name || !suit) {
    input.value = ''
    input.reportValidity()
    return
  }
  const state = fresh()
  state.story = { player: { name, suit: suit.id }, step: 'wake', difficulty }
  state.x = 174
  state.y = 170
  const id = crypto.randomUUID()
  menuBusy = true
  const submit = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  submit.disabled = true
  try {
    await storeSlot(id, state)
    loadSlot({ id, state, savedAt: Date.now() })
  } catch {
    const warning = document.createElement('p')
    warning.className = 'front-error'
    warning.setAttribute('role', 'alert')
    warning.textContent = 'Não foi possível criar a partida no banco local.'
    form.querySelector('.front-error')?.remove()
    form.append(warning)
    input.focus()
  } finally {
    menuBusy = false
    submit.disabled = false
  }
})
function openingObjective() {
  if (s.completed > 0 || !s.story) return
  switch (s.story.step) {
    case 'wake':
      return 'Converse com Lara junto às cápsulas.'
    case 'meet-noah':
      return 'Encontre Noah ao lado do console.'
    case 'debrief':
      return 'Conte a Noah o que descobriu sobre o circuito.'
  }
}

function renderSound() {
  const label = s.sound ? 'Desativar som' : 'Ativar som'
  for (const toggle of document.querySelectorAll<HTMLButtonElement>(
    '[data-act=sound]',
  )) {
    toggle.innerHTML = icon(s.sound ? 'Volume2' : 'VolumeX')
    toggle.setAttribute('aria-label', label)
    toggle.title = label
  }
}
function syncInteraction() {
  const p = nearby(s),
    el = $('#interact')
  const label = p ? (p.kind === 'terminal' ? 'Acessar terminal' : p.name) : ''
  if (el.dataset.label === label) return
  el.dataset.label = label
  el.innerHTML = p
    ? button(
        'use',
        '<kbd>E</kbd> ' + esc(label) + ' ' + icon('ChevronRight', 14),
        'interact',
      )
    : ''
}
function render() {
  const n = current(),
    c = chapters[n],
    finished = s.completed === TOTAL_CHAPTERS,
    g = goals(s, n),
    practice = activePractice(s, n),
    opening = openingObjective()
  journey.classList.toggle('energy-sector', s.room === 1)
  $<HTMLButtonElement>('.energy-hint').hidden = s.room !== 1 || s.completed > 1
  $('#energy-objective').textContent = s.room !== 1 ? '' : s.completed > 1
    ? 'Energia restaurada'
    : !s.seen.includes('label') ? 'Examine o painel'
      : !s.seen.includes('circuit') ? 'Encontre o registro do circuito'
        : 'Acione o relé no painel'
  $('#sector').textContent =
    s.room === -1 ? 'CONEXÃO ENTRE SETORES' : 'SETOR ' + pad(s.room + 1)
  $('#title').textContent =
    s.room === -1 ? 'Corredor de manutenção' : chapters[s.room].room
  $('#chapter-tag').innerHTML =
    '<span class="signal-bars"><i></i><i></i><i></i><i></i></span> ' +
    (finished
      ? 'CAMPANHA CONCLUÍDA'
      : 'CAPÍTULO ' + pad(n + 1) + ' <b>/ ' + pad(TOTAL_CHAPTERS) + '</b>')
  $('#cam').textContent =
    'CAM ' +
    (s.room === -1 ? 'HUB' : pad(s.room + 1)) +
    '  /  ' +
    (s.room === -1 ? 'CORREDOR' : chapters[s.room].short.toUpperCase())
  $('#mission').innerHTML =
    '<div class="mission-cap"><span class="cap">' +
    icon('Flag', 15) +
    (finished ? 'Missão concluída' : 'Missão ativa') +
    '</span><span class="id">M–' +
    pad(n + 1) +
    '</span></div><h2>' +
    esc(practice?.title ?? c.title) +
    '</h2><p>' +
    esc(finished ? c.restored : (opening ?? practice?.brief ?? c.desc)) +
    '</p><div class="objectives">' +
    (opening ? [] : practice ? ['Concluir tarefa deste turno'] : c.goals)
      .map(
        (a, i) =>
          '<div class="goal ' +
          (practice
            ? 'next'
            : g[i]
              ? 'done'
              : i === g.indexOf(false)
                ? 'next'
                : '') +
          '"><span class="check">' +
          (!practice && g[i] ? icon('Check', 11) : '') +
          '</span>' +
          esc(a) +
          '</div>',
      )
      .join('') +
    '</div>' +
    button(
      finished ? 'credits' : 'hint',
      icon(finished ? 'BookOpen' : 'Lightbulb', 16) +
        (finished ? 'Ver créditos' : 'Consultar dica') +
        icon('ChevronRight', 14),
      'hint',
    )
  const diffMeta = difficulties.find((d) => d.id === playerDifficulty(s))
  $('#operator').innerHTML =
    '<div class="avatar"><img src="/art/player-' +
    (s.story?.player.suit ?? 'ochre') +
    '-1.png" alt=""></div><div class="opbody"><div class="ophead"><span class="micro">' +
    esc(operatorRank(s.completed).toUpperCase()) +
    '</span><b>NV. ' +
    pad(s.completed + 1) +
    '</b></div><strong>' +
    esc(s.story?.player.name ?? (finished ? 'Guardião da ARK' : 'Explorador')) +
    '</strong>' +
    (diffMeta
      ? '<div class="op-profile">' + esc(diffMeta.name) + '</div>'
      : '') +
    '<div class="xp"><i style="width:' +
    (s.completed / TOTAL_CHAPTERS) * 100 +
    '%"></i></div><small>' +
    s.completed * 100 +
    ' XP <span>/ ' +
    TOTAL_CHAPTERS * 100 +
    ' XP</span></small></div>'
  const lesson = s.room < 0 ? n : s.room
  $('#toolbox').innerHTML =
    '<span class="cap">' +
    icon('Terminal', 15) +
    ' Ferramentas do setor</span><div class="chips">' +
    chapters[lesson].tools
      .filter((tool) => s.library.includes(tool))
      .map((tool) => button('topic:' + tool, esc(tool)))
      .join('') +
    '</div>'
  $('#route-count').textContent =
    s.completed + ' de ' + TOTAL_CHAPTERS + ' setores restaurados'
  $('#route').innerHTML = chapters
    .map((c, i) =>
      button(
        'sector:' + i,
        '<span class="node">' +
          icon(sectorIcons[i], 19) +
          '</span><span class="route-txt"><small>SETOR ' +
          pad(i + 1) +
          '</small><strong>' +
          c.short +
          '</strong></span>' +
          (i > s.completed
            ? icon('LockKeyhole', 11)
            : i < s.completed
              ? icon('Check', 12)
              : '<i class="on-dot"></i>'),
        'route-item ' +
          (i === s.completed ? 'current' : i < s.completed ? 'restored' : ''),
        'title="Ver setor ' + pad(i + 1) + ' — ' + c.short + '"',
      ),
    )
    .join('')
  renderSound()
  syncInteraction()
  save()
}
function toast(t: string) {
  const el = $('#toast')
  ;(dialog.open ? dialog : document.body).appendChild(el)
  el.textContent = t
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 3000)
}
let toastTimer = 0
function layout(title: string, kicker: string, body: string, wide = false) {
  const status = document.querySelector('#toast')
  if (status) document.body.appendChild(status)
  dialog.className = [wide ? 'wide' : '', s.room === 1 && modal === 'terminal' ? 'energy-terminal' : ''].filter(Boolean).join(' ')
  dialog.innerHTML =
    '<div class="modalbar"><div><span class="micro">' +
    kicker +
    '</span><h2 id="dialog-title">' +
    esc(title) +
    '</h2></div>' +
    button('close', icon('X'), 'square', 'aria-label="Fechar"') +
    '</div><div class="modalbody">' +
    body +
    '</div>'
  if (!dialog.open) dialog.showModal()
  document
    .querySelectorAll('.nav')
    .forEach((el) =>
      el.classList.toggle(
        'active',
        (el as HTMLElement).dataset.act ===
          (['journal', 'manual'].includes(modal) ? modal : 'world'),
      ),
    )
}
function close() {
  talking = undefined
  const status = document.querySelector('#toast')
  if (status) document.body.appendChild(status)
  if (dialog.open) dialog.close()
  modal = ''
  commandFeedback = undefined
  s.screen = 'world'
  notice = ''
  heldTerminal = false
  newAcquisitions = []
  terminalInput = ''
  save()
  render()
  if (s.completed === TOTAL_CHAPTERS && !s.endsSeen) {
    show('credits')
    return
  }
  $('.nav').focus({ preventScroll: true })
}
function showDialogue() {
  if (!talking) return
  const { npc, topic } = talking
  const person = crew[npc]
  const exchange = conversation(s, npc, topic)
  modal = 'npc'
  layout(
    person.name,
    person.role,
    '<div class="npc-talk"><img src="/art/portrait-' +
      npc +
      '.png" alt=""><p>' +
      esc(exchange.line) +
      '</p></div><div class="npc-choices">' +
      exchange.choices
        .map((choice, i) => button('reply:' + i, esc(choice.text), 'outline'))
        .join('') +
      '</div>',
  )
}
function reply(index: number) {
  if (!talking) return
  const choice = conversation(s, talking.npc, talking.topic).choices[index]
  if (!choice) return
  tone()
  if (choice.note) note(choice.note)
  if (choice.step && s.story) s.story.step = choice.step
  if (choice.next) {
    talking.topic = choice.next
    showDialogue()
  } else {
    close()
    if (choice.step === 'done') progress()
  }
}
function show(type: string) {
  if (type === 'editor' && !editorAvailable(s)) type = 'terminal'
  modal = type
  if (type === 'terminal' || type === 'editor') {
    s.screen = type
    save()
  } else if (type !== 'manual' && type !== 'hint') {
    s.screen = 'world'
    save()
  }
  const n = current(),
    c = chapters[n],
    practice = activePractice(s, n)
  if (type === 'terminal') {
    const diff = playerDifficulty(s)
    const showExplorer = explorerOverride ?? diff === 'windows'
    const messages = [
      'Lara deixou uma mensagem para você na cabine. <code>pwd</code> mostra a pasta em que você está. <code>ls</code> lista o que ela guarda. Assim que encontrar o arquivo, use <code>cat</code> seguido do nome para ler o conteúdo.',
      'A etiqueta da máquina indica um circuito. Use <code>ls</code> para localizar a pasta dos registros. <code>cd</code> muda de pasta e <code>cd ..</code> volta à pasta acima. Depois de achar o registro, você já sabe como ler.',
      'Precisamos juntar as fichas sem perder os originais. <code>mkdir</code> cria uma pasta. <code>cp</code> deixa uma cópia no destino e conserva a origem. A rota, porém, está no lugar errado. Use <code>mv</code> para tirá-la de lá e colocá-la na navegação.',
      'O receptor gravou cada chiado. <code>grep SOS sinais.log</code> imprime só as linhas com SOS. O sinal pode ir direto para <code>contato.txt</code>. O <code>&gt;</code> cria o arquivo ou substitui o conteúdo dele. Depois, <code>echo</code> produz a linha de confirmação e <code>&gt;&gt;</code> a acrescenta ao mesmo arquivo.',
      'O depósito acumula dezenas de arquivos. Use o curinga <code>*</code> com <code>cp</code> e <code>cat</code> para operar lotes de uma vez, e <code>rm</code> para descartar apenas os arquivos temporários <code>.tmp</code>.',
      'Conecte comandos com o pipe <code>|</code>: filtre com <code>grep</code>, ordene com <code>sort</code>, recorte o topo ou o fim com <code>head</code>/<code>tail</code> e conte linhas com <code>wc -l</code>.',
      'Para encontrar arquivos escondidos em subpastas profundas, use <code>find setores -name "*.val"</code>. Combine <code>grep</code>, <code>sort</code> e <code>uniq</code> com pipes para eliminar linhas repetidas.',
      'Você montou o boletim à mão e testou variáveis. Agora a estação pode repetir o procedimento: salve os comandos no editor, um por linha. <code>bash rotina.sh</code> lê e executa essas instruções em ordem.',
      'Transforme seu fluxo em uma ferramenta que aceita qualquer arquivo via <code>"$1"</code>. Depois de salvar <code>resumo.sh</code>, dê permissão com <code>chmod +x resumo.sh</code> e rode <code>./resumo.sh diurno.log</code>.',
      'Você já testou cápsulas com <code>[ -s arquivo ]</code>. O <code>if</code> usa o resultado desse teste para escolher entre dois caminhos. Use <code>echo</code> com <code>&gt;</code> para gravar o estado escolhido.',
      'Classifique qualquer caminho recebido em <code>"$1"</code> encadeando <code>if</code>, <code>elif</code> e <code>else</code> com <code>-d</code> (pasta), <code>-s</code> (arquivo com conteúdo) e <code>-f</code> (arquivo vazio).',
      'Você já percorreu os fragmentos com <code>for</code> e <code>*.frag</code>. Agora reúna tudo: zere <code>memoria.txt</code> e <code>relatorio.txt</code> no início, teste cada arquivo com <code>if [ -s "$arquivo" ]</code> e acrescente conteúdo e caminho com <code>&gt;&gt;</code>.',
    ]
    const localPractice = activePractice(s, s.room)
    const voice =
      localPractice?.voice ??
      ([3, 5, 9, 10, 11].includes(s.room) ? 'LARA' : 'NOAH')
    const onboarding =
      '<div class="transmission">' +
      esc(diff === 'dev' ? 'MODO DEV · ESPECIFICAÇÃO' : voice.toUpperCase()) +
      '</div>' +
      (localPractice
        ? '<strong>' +
          esc(localPractice.title) +
          '</strong><br>' +
          esc(localPractice.brief)
        : diff === 'dev'
          ? esc(chapters[s.room].desc)
          : messages[s.room] +
            (s.room > 0 ? '<br><br>' + esc(chapters[s.room].desc) : ''))
    const roomGoals = goals(s, s.room)
    const goalStrip =
      '<div class="term-goals">' +
      (localPractice
        ? '<span class="term-goal next">' +
          icon('Flag', 12) +
          ' ' +
          esc(localPractice.title) +
          '</span>'
        : chapters[s.room].goals
            .map(
              (label, idx) =>
                '<span class="term-goal ' +
                (roomGoals[idx] ? 'done' : 'next') +
                '">' +
                icon(roomGoals[idx] ? 'Check' : 'Diamond', 11) +
                ' ' +
                esc(label) +
                '</span>',
            )
            .join('')) +
      '<div class="term-chips">' +
      chapters[s.room].tools
        .filter((tool) => s.library.includes(tool))
        .map((tool) => button('topic:' + tool, esc(tool), 'term-chip'))
        .join('') +
      '</div></div>'
    const explorerTree = (() => {
      if (!showExplorer) return ''
      const entries = diskEntries(s, s.cwd)
      const renderEntry = (entry: ReturnType<typeof diskEntries>[number]) => {
        const arg = entry.name.includes(' ')
          ? '"' + entry.name + (entry.isDir ? '/' : '"')
          : entry.name + (entry.isDir ? '/' : '')
        const nested = entry.isDir
          ? diskEntries(s, path(s.cwd, entry.name))
              .slice(0, 6)
              .map((sub) => {
                const subPath = entry.name + '/' + sub.name + (sub.isDir ? '/' : '')
                const subArg = subPath.includes(' ') ? '"' + subPath + '"' : subPath
                return button(
                  'insert:' + subArg,
                  icon(sub.isDir ? 'Folder' : 'FileText', 12) +
                    ' <span>' +
                    esc(sub.name) +
                    '</span><small>' +
                    (sub.isDir ? 'pasta' : sub.size === 0 ? 'vazio' : sub.size + ' B') +
                    '</small>',
                  'explorer-item nested',
                )
              })
              .join('')
          : ''
        return (
          button(
            'insert:' + arg,
            icon(entry.isDir ? 'Folder' : 'FileText', 13) +
              ' <span>' +
              esc(entry.name) +
              '</span><small>' +
              (entry.isDir ? 'pasta' : entry.size === 0 ? 'vazio' : entry.size + ' B') +
              '</small>',
            'explorer-item',
          ) + nested
        )
      }
      return (
        '<aside class="term-explorer" aria-label="Arquivos do setor"><div class="explorer-head"><span>' +
        icon('Folder', 13) +
        ' ' +
        esc(s.cwd) +
        '</span>' +
        (s.cwd !== '/' && s.cwd !== '/ark'
          ? button('insert:..', '..', 'explorer-up', 'title="Inserir .."')
          : '') +
        '</div><div class="explorer-list">' +
        (entries.length
          ? entries.map(renderEntry).join('')
          : '<p class="explorer-empty">Pasta vazia</p>') +
        '</div><small class="explorer-tip">Clique para inserir no comando</small></aside>'
      )
    })()
    layout(
      'Terminal de bordo',
      'ARK OS / SESSÃO LOCAL',
      '<div class="termtabs">' +
        button('terminal', icon('Terminal', 15) + 'Terminal', 'selected') +
        (editorAvailable(s)
          ? button('editor', icon('FileCode', 15) + 'Editor de script')
          : '') +
        button('manual', icon('BookOpen', 15) + 'Manual') +
        button(
          'toggle-explorer',
          icon('PanelRight', 15) + (showExplorer ? 'Ocultar arquivos' : 'Arquivos'),
          'termtab-right' + (showExplorer ? ' active' : ''),
        ) +
        '</div><div class="tguide">' +
        onboarding +
        (newAcquisitions.length
          ? '<div class="discoveries" aria-label="Habilidades adquiridas">' +
            newAcquisitions.map((topic) => '<p><b>NOVO · ' + esc(topic) + '</b> — ' + esc(summary(topic)) + '</p>').join('') +
            '</div>'
          : '') +
        '</div>' +
        goalStrip +
        '<div class="terminal-layout' +
        (showExplorer ? ' with-explorer' : '') +
        '"><div class="terminal-main"><div class="terminal-view"><pre id="output"></pre>' +
        (s.room === 3 && s.completed === 3 && !localPractice && diff !== 'dev'
          ? '<p class="radio-tip">' + esc(radioTip(s)) + '</p>'
          : '') +
        '<form id="command-form"><label for="command">ark:' +
        esc(s.cwd) +
        ' $</label><input id="command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando Bash"></form></div>' +
        '<p id="complete-hint" class="complete-hint" hidden></p>' +
        (commandFeedback
          ? '<p class="command-feedback ' +
            (commandFeedback.ok ? 'accepted' : 'rejected') +
            '" role="status">' +
            icon(commandFeedback.ok ? 'Check' : 'X', 16) +
            esc(commandFeedback.text) +
            '</p>'
          : '') +
        '</div>' +
        explorerTree +
        '</div><div class="modfoot"><span><kbd>Enter</kbd> Executar &nbsp; <kbd>Tab</kbd> Completar &nbsp; <kbd>Esc</kbd> Voltar à estação</span><div class="terminal-actions">' +
        button('sound', '', 'square') +
        (diff !== 'dev' ? button('hint', icon('Lightbulb', 15) + ' Dica', 'textbtn') : '') +
        '</div>' +
        '</div>',
      true,
    )
    renderSound()
    $('#output').textContent = s.log.join('\n')
    $('#command-form').addEventListener('submit', (e) => {
      e.preventDefault()
      execute()
    })
    const input = $<HTMLInputElement>('#command')
    const completeHint = $('#complete-hint')
    input.value = terminalInput
    input.oninput = () => {
      terminalInput = input.value
      completeHint.hidden = true
      completeHint.textContent = ''
    }
    input.focus()
    input.onkeydown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const result = completeCommand(s, input.value)
        input.value = result.value
        terminalInput = result.value
        if (result.options.length > 1) {
          completeHint.textContent = 'Opções: ' + result.options.join('  ')
          completeHint.hidden = false
        } else {
          completeHint.hidden = true
        }
        return
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        historyPos = Math.max(
          0,
          Math.min(history.length, historyPos + (e.key === 'ArrowUp' ? -1 : 1)),
        )
        input.value = history[historyPos] || ''
        terminalInput = input.value
      }
    }
    $('.terminal-view').scrollTop = $('.terminal-view').scrollHeight
  } else if (type === 'editor') {
    const diff = playerDifficulty(s)
    const d = (s.drafts[s.room] ??= {
      name: scriptName(s.room),
      body: String(
        s.disk[path(s.cwd, scriptName(s.room))] ?? starterTemplate(s, s.room),
      ),
    })
    layout(
      'Editor de script',
      'TERMINAL / OFICINA DE CÓDIGO',
      '<div class="termtabs">' +
        button('terminal', icon('Terminal', 15) + 'Terminal') +
        button(
          'editor',
          icon('FileCode', 15) + 'Editor de script',
          'selected',
        ) +
        button('manual', icon('BookOpen', 15) + 'Manual') +
        '</div><label class="field">Arquivo em ' +
        esc(s.cwd) +
        '<input id="filename" value="' +
        esc(d.name) +
        '"></label><label class="field">Código Bash<textarea id="code" spellcheck="false" placeholder="# Escreva um comando por linha"></textarea></label>' +
        '<div id="editor-lint" class="editor-lint" hidden></div>' +
        '<div class="modfoot"><span>Rascunho salvo ao digitar · <kbd>Tab</kbd> indenta · <kbd>Ctrl+Enter</kbd> executa</span><div class="actions">' +
        button(
          'savefile',
          icon('SaveIcon', 16) + ' Salvar arquivo',
          'outline',
        ) +
        button(
          'saveandrun',
          icon('Play', 15) + ' Salvar e executar',
          'primary',
        ) +
        '</div></div>',
      true,
    )
    const area = $<HTMLTextAreaElement>('#code')
    const lintBox = $('#editor-lint')
    area.value = d.body
    const updateLint = () => {
      if (diff === 'dev') {
        lintBox.hidden = true
        return
      }
      const notes = bashLint(area.value)
      if (!notes.length) {
        lintBox.hidden = true
        lintBox.innerHTML = ''
      } else {
        lintBox.hidden = false
        lintBox.innerHTML = notes.map((w) => '<p>⚠ ' + esc(w) + '</p>').join('')
      }
    }
    const draft = () => {
      d.body = area.value
      d.name = $<HTMLInputElement>('#filename').value
      updateLint()
      save()
    }
    updateLint()
    area.oninput = draft
    area.onkeydown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const start = area.selectionStart
        const end = area.selectionEnd
        area.value = area.value.slice(0, start) + '  ' + area.value.slice(end)
        area.selectionStart = area.selectionEnd = start + 2
        draft()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        void action('saveandrun')
      }
    }
    $('#filename').oninput = draft
    area.focus()
  } else if (type === 'manual') {
    const back = heldTerminal ? button('backterm', returnScreen === 'editor' ? 'Voltar ao editor' : 'Voltar ao terminal', 'primary') : ''
    const renderCards = (query: string) => {
      const q = query.trim().toLowerCase()
      const baseTerms = manualTopic ? [manualTopic] : s.library
      const filtered = q
        ? baseTerms.filter((topic) => {
            const data = card(topic)
            return (
              topic.toLowerCase().includes(q) ||
              (data && data.some((part) => part.toLowerCase().includes(q)))
            )
          })
        : baseTerms
      if (!filtered.length) {
        return s.library.length
          ? '<p>Nenhuma ficha corresponde à busca “' + esc(query) + '”.</p>'
          : '<p>A biblioteca man será adquirida no primeiro terminal.</p>'
      }
      const renderCard = (topic: string) => {
        const data = card(topic)
        if (!data) return ''
        return '<article class="ref"><h3>' + esc(topic) + '</h3><p><b>Finalidade:</b> ' + esc(data[0]) + '</p><p><b>Sintaxe:</b> <code>' + esc(data[1]) + '</code></p><p><b>Exemplo:</b></p><pre>' + esc(data[2]) + '</pre><p><b>Como ler e o que esperar:</b> ' + esc(data[3]) + '</p><p><b>Erro comum:</b> ' + esc(data[4]) + '</p></article>'
      }
      if (manualTopic || q) return filtered.map(renderCard).join('')
      const groups: string[] = []
      if (filtered.includes('man')) {
        groups.push('<h3>Sistema</h3>' + renderCard('man'))
      }
      chapters.forEach((ch, idx) => {
        const tools = ch.tools.filter((t) => filtered.includes(t))
        if (tools.length) {
          groups.push(
            '<h3>Setor ' +
              pad(idx + 1) +
              ' · ' +
              esc(ch.short) +
              '</h3>' +
              tools.map(renderCard).join(''),
          )
        }
      })
      return groups.join('')
    }
    layout(
      manualTopic ? 'man · ' + manualTopic : 'man · Biblioteca do operador',
      'BIBLIOTECA ADQUIRIDA',
      '<p class="intro">As fichas são adquiridas ao acessar o terminal de cada setor. A prática no terminal continua livre.</p>' +
        (!manualTopic && s.library.length > 1
          ? '<label class="manual-search">' +
            icon('Search', 15) +
            '<input id="manual-search" type="search" placeholder="Filtrar comandos ou conceitos..." value="' +
            esc(manualSearch) +
            '" autocomplete="off"></label>'
          : '') +
        '<div id="manual-results">' +
        renderCards(manualTopic ? '' : manualSearch) +
        '</div><div class="actions">' +
        (manualTopic ? button('manual-list', 'Todas as fichas', 'outline') : '') +
        back +
        '</div>',
      true,
    )
    const searchInput = document.querySelector<HTMLInputElement>('#manual-search')
    if (searchInput) {
      searchInput.oninput = () => {
        manualSearch = searchInput.value
        $('#manual-results').innerHTML = renderCards(manualSearch)
      }
    }
  } else if (type === 'journal') {
    layout(
      'Diário de bordo',
      'MEMÓRIA DO OPERADOR',
      '<h3>Missão atual</h3><p>' +
        esc(
          s.completed === TOTAL_CHAPTERS
            ? c.restored
            : practice
              ? practice.title + ' — ' + practice.brief
              : c.title + ' — ' + c.desc,
        ) +
        '</p><h3>Registros encontrados</h3>' +
        (s.notes.length
          ? s.notes.map((v) => '<p class="entry">' + esc(v) + '</p>').join('')
          : '<p>Examine máquinas e caixas da tripulação para registrar pistas.</p>') +
        '<h3>Setores restaurados</h3>' +
        (s.completed
          ? chapters
              .slice(0, s.completed)
              .map(
                (ch) =>
                  '<p class="entry">' +
                  icon('Check', 14) +
                  ' ' +
                  esc(ch.restored) +
                  '</p>',
              )
              .join('')
          : '<p>A primeira entrada será registrada ao abrir a trava da cabine.</p>'),
    )
  } else if (type === 'hint' && openingObjective()) {
    layout('Pista', 'CABINE DA ARK', '<p>' + esc(openingObjective()!) + '</p>')
  } else if (type === 'hint') {
    if (playerDifficulty(s) === 'dev') {
      layout(
        'Modo Dev · Sem dicas',
        (practice?.title ?? c.title).toUpperCase(),
        '<p>No perfil Dev as dicas passo a passo ficam desativadas. Consulte apenas as especificações do setor e o manual de sintaxe.</p><div class="actions">' +
          button('manual', 'Abrir manual', 'outline') +
          (heldTerminal ? button('backterm', 'Voltar ao terminal', 'primary') : '') +
          '</div>',
      )
      return
    }
    const hints = practice?.hints ?? c.hints
    const count = Math.max(
      1,
      practice ? (practiceHints[practice.id] ?? 0) : s.hints[n],
    )
    if (practice) practiceHints[practice.id] = count
    else s.hints[n] = count
    save()
    layout(
      'Dicas de campo',
      (practice?.title ?? c.title).toUpperCase(),
      hints
        .slice(0, count)
        .map(
          (v, i) =>
            '<p class="entry"><b>' + pad(i + 1) + '</b> ' + esc(v) + '</p>',
        )
        .join('') +
        '<div class="actions">' +
        (count < hints.length
          ? button('morehint', 'Revelar próxima dica', 'primary')
          : '') +
        (heldTerminal
          ? button('backterm', 'Voltar ao terminal', 'outline')
          : '') +
        '</div>',
    )
  } else if (type === 'controls') {
    layout(
      'Controles da estação',
      'EXPLORAÇÃO',
      '<div class="control-list">' +
        [
          ['W A S D / ↑ ← ↓ →', 'Mover o personagem'],
          ['E', 'Interagir com o objeto próximo'],
          ['J / M', 'Abrir diário ou manual'],
          ['Enter', 'Executar comando'],
          ['Esc', 'Voltar à exploração'],
        ]
          .map(
            ([a, b]) => '<div><kbd>' + a + '</kbd><span>' + b + '</span></div>',
          )
          .join('') +
        '</div><p>Você também pode clicar no piso para caminhar e usar o botão de interação quando estiver perto de um objeto.</p>' +
        (s.room === s.completed && s.room >= 0
          ? button('restore', 'Restaurar arquivos deste setor', 'outline')
          : ''),
    )
  } else if (type === 'restore') {
    layout(
      'Restaurar este setor?',
      'RECUPERAÇÃO LOCAL',
      '<p>Os arquivos, comandos e rascunhos deste setor voltarão ao estado inicial. Os setores já concluídos e as descobertas do diário ficam preservados.</p><div class="actions">' +
        button('confirmedRestore', 'Restaurar setor', 'primary') +
        button('close', 'Cancelar', 'outline') +
        '</div>',
    )
  } else if (type === 'success') {
    const i = s.completed - 1
    layout(
      chapters[i].title,
      'MISSÃO CONCLUÍDA  /  +100 XP',
      '<div class="successbadge">' +
        icon(sectorIcons[i], 34) +
        '</div><p>' +
        esc(chapters[i].restored) +
        '</p><p>' +
        (s.completed === TOTAL_CHAPTERS
          ? 'O arquivo pode ser lido junto às caixas do núcleo.'
          : 'Siga até a eclusa à direita e entre no corredor. A porta ' +
            pad(s.completed + 1) +
            ' leva a ' +
            chapters[s.completed].room +
            '.') +
        '</p>' +
        button(
          'close',
          'Continuar exploração ' + icon('ChevronRight', 15),
          'primary',
        ),
    )
  } else if (type === 'credits') {
    s.endsSeen = true
    save()
    const totalHints = s.hints.reduce((acc, v) => acc + v, 0)
    const diffLabel =
      difficulties.find((d) => d.id === playerDifficulty(s))?.name ?? 'Operador'
    layout(
      'A ARK se lembra',
      'CAMPANHA CONCLUÍDA',
      '<div class="successbadge">' +
        icon('Cpu', 40) +
        '</div><p>O silêncio dá lugar às vozes de Lara e Noah. Doze setores voltaram à vida, e o próximo turno encontrará a estação acesa.</p>' +
        '<p class="entry"><b>' +
        esc(operatorRank(s.completed)) +
        '</b> · Perfil ' +
        esc(diffLabel) +
        ' · ' +
        totalHints +
        ' dica(s) consultada(s).</p>' +
        '<h3>Memória recuperada</h3><pre>' +
        esc(String(s.disk['/ark/memoria/memoria.txt'] || '')) +
        '</pre><h3>Créditos</h3><p>Universo e jogo original: Guilherme Tayar. Ecos da ARK é uma aventura criada a partir de Bash Quest e da missão “O serviço que não se lembra”.</p>' +
        button('close', 'Voltar à estação', 'primary'),
    )
  } else if (type === 'relay') {
    layout(
      'Painel de distribuição',
      'ETIQUETA DE LINHA  /  C07',
      '<p>A placa identifica o circuito <strong>C07</strong>. ' +
        (s.completed > 1 ? 'O painel está energizado.' : 'Consulte seu registro no terminal para descobrir qual relé alimenta o corredor.') +
        '</p><div class="actions">' +
        (s.completed > 1 ? '' :
        button('relay:azul', 'Relé azul', 'outline') +
        button('relay:ambar', 'Relé âmbar', 'outline')) +
        '</div>',
    )
  } else if (type === 'inspect') {
    layout(
      'Registro de campo',
      'INVESTIGAÇÃO',
      '<p>' +
        esc(notice) +
        '</p>' +
        button('close', 'Voltar à exploração', 'primary'),
    )
  } else if (type.startsWith('sector:')) {
    const i = Number(type.split(':')[1])
    layout(
      chapters[i].room,
      'MAPA DA ESTAÇÃO  /  SETOR ' + pad(i + 1),
      '<h3>' +
        chapters[i].title +
        '</h3><p>' +
        esc(chapters[i].desc) +
        '</p><p class="entry">' +
        (i > s.completed
          ? 'Acesso selado. Restaure o setor anterior para liberar esta porta.'
          : s.room === i
            ? 'Você está neste setor.'
            : 'Acesso liberado pela porta ' +
              pad(i + 1) +
              ' do corredor de manutenção.') +
        '</p>' +
        (i <= s.completed && i !== s.room
          ? '<div class="actions">' +
            button('travel:' + i, 'Ir para este setor', 'primary') +
            '</div>'
          : ''),
    )
  }
}
function progress() {
  if (
    s.room === 0 &&
    s.story?.step === 'terminal' &&
    goals(s, 0).every(Boolean)
  ) {
    s.story.step = 'debrief'
    note(
      'Encontrei o circuito C07. Noah está esperando a confirmação perto do terminal.',
    )
    commandFeedback = {
      ok: true,
      text: 'Registro lido. Volte a Noah para liberar a eclusa.',
    }
  }
  if (finish(s)) {
    tone('mission')
    render()
    if (s.room === 1) {
      close()
      restoringEnergy = true
      frame?.restoreEnergy()
      window.setTimeout(() => {
        restoringEnergy = false
        if (!menuVisible && s.room === 1) show('success')
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 900 : 2400)
      return true
    }
    show('success')
    return true
  }
  render()
  return false
}
function execute(overrideLine?: string) {
  const input = document.querySelector<HTMLInputElement>('#command'),
    line = (overrideLine ?? input?.value ?? '').trim()
  if (!line) return
  history.push(line)
  historyPos = history.length
  const prompt = s.cwd
  terminalInput = ''
  if (line === 'clear') {
    s.log = []
    commandFeedback = { ok: true, text: 'Tela do terminal limpa.' }
    tone('accepted')
    show('terminal')
    return
  }
  if (line === 'help') {
    s.log.push('ark:' + prompt + ' $ help')
    if (s.library.includes('man')) {
      manualTopic = ''
      manualSearch = ''
      returnScreen = 'terminal'
      heldTerminal = true
      tone('accepted')
      show('manual')
    } else {
      s.log.push('Acesse o primeiro terminal e consulte as ferramentas adquiridas com man.')
      commandFeedback = { ok: true, text: 'Use man para abrir o manual de campo.' }
      tone('accepted')
      show('terminal')
    }
    return
  }
  const manMatch = /^man(?:\s+(\S+))?\s*$/.exec(line)
  if (manMatch && s.library.includes('man')) {
    const topic = manMatch[1] || ''
    s.log.push('ark:' + prompt + ' $ ' + line)
    if (topic && !s.library.includes(topic)) {
      s.log.push('Ficha não adquirida: ' + topic)
      commandFeedback = { ok: false, text: 'Ficha não adquirida: ' + topic }
      tone('rejected')
      show('terminal')
      return
    }
    manualTopic = topic
    manualSearch = ''
    returnScreen = 'terminal'
    heldTerminal = true
    tone('accepted')
    show('manual')
    return
  }
  const r = run(s, line)
  s.log.push('ark:' + prompt + ' $ ' + line)
  if (r.out) s.log.push(r.out.trimEnd())
  const lastTrace = r.trace.at(-1)
  const lastCmd = lastTrace?.cmd
  const isTestCmd = !r.error && (lastCmd === '[' || lastCmd === 'test')
  const failure =
    r.error ||
    (r.status && !isTestCmd
      ? lastCmd === 'grep'
        ? 'O grep não encontrou nenhuma linha correspondente.'
        : 'O comando terminou com status ' + r.status + '.'
      : '')
  if (isTestCmd) {
    const flag = lastTrace?.args[0] || '-s'
    const descMap: Record<string, [string, string]> = {
      '-s': ['arquivo tem conteúdo', 'arquivo vazio ou ausente'],
      '-f': ['é um arquivo comum', 'não é arquivo comum'],
      '-d': ['é uma pasta existente', 'não é pasta'],
      '-e': ['caminho existe', 'caminho ausente'],
    }
    const [okDesc, failDesc] = descMap[flag] ?? ['condição satisfeita', 'condição falsa']
    const okLabel =
      r.status === 0
        ? `Teste [ ${flag} ]: verdadeiro (status 0 — ${okDesc}).`
        : `Teste [ ${flag} ]: falso (status 1 — ${failDesc}).`
    s.log.push('→ ' + okLabel)
    commandFeedback = { ok: true, text: okLabel }
  } else {
    commandFeedback = failure
      ? { ok: false, text: 'Falha no comando. ' + failure }
      : { ok: true, text: 'Comando executado.' }
  }
  if (failure) s.log.push('⚠ ' + failure)
  record(s, r)
  const practiced = !failure && advancePractice(s)
  if (practiced)
    commandFeedback = { ok: true, text: 'Tarefa concluída. ' + practiced + '.' }
  if (
    isScriptChapter(s.room) &&
    s.room === s.completed &&
    !activePractice(s) &&
    !r.error &&
    r.trace.some((t) => t.cmd === 'bash' || t.cmd.includes('/'))
  ) {
    const checks = goals(s, s.room)
    if (!checks.every(Boolean)) {
      const diag = diagnoseScript(s, s.room)
      const problem =
        diag.reason ||
        'Confira este objetivo: ' +
          chapters[s.room].goals[checks.indexOf(false)] +
          '.'
      s.log.push('Verificação · ' + problem)
      if (!failure)
        commandFeedback = {
          ok: false,
          text: 'Verificação pendente. ' + problem,
        }
    }
  }
  s.log = s.log.slice(-100)
  if (failure) render()
  else if (progress()) return
  tone(failure ? 'rejected' : 'accepted')
  show('terminal')
}
function moveRoom(n: number) {
  commandFeedback = undefined
  enter(s, n)
  frame?.refresh()
  tone('door')
  render()
}
function interact(p?: Spot) {
  if (!p) return
  if (p.kind === 'npc' && p.npc) {
    talking = { npc: p.npc, topic: '' }
    tone()
    showDialogue()
    return
  }
  if (p.kind === 'terminal') {
    if (
      s.room === 0 &&
      (s.story?.step === 'wake' || s.story?.step === 'meet-noah')
    ) {
      toast(openingObjective()!)
      return
    }
    mark(s, 'terminal' + s.room)
    newAcquisitions = acquire(s, s.room)
    if (newAcquisitions.length) tone('unlock')
    heldTerminal = true
    render()
    show('terminal')
  }
  if (p.kind === 'port') {
    if (p.index! <= s.completed) moveRoom(p.index!)
    else toast('Porta selada. Conclua o setor anterior.')
  }
  if (p.kind === 'airlock') {
    if (s.room === 0 && !s.completed)
      toast('Trava sem energia. Leia a mensagem da cabine.')
    else moveRoom(-1)
  }
  if (p.kind === 'machine' && s.room === 1) {
    mark(s, 'label')
    note(
      'Distribuição de energia · A etiqueta do painel identifica o circuito C07.',
    )
    render()
    show('relay')
  } else if (p.kind === 'machine' || p.kind === 'log') {
    notice =
      p.kind === 'log' && s.room === FINAL_CHAPTER && s.completed === TOTAL_CHAPTERS
        ? String(s.disk['/ark/memoria/memoria.txt'])
        : p.kind === 'log'
          ? chapters[s.room].lore
          : [
              'A luz da cápsula pisca em direção ao terminal. O último registro foi salvo em mensagem.txt.',
              '',
              'Os armários têm etiquetas de origem e destino. Consulte as pastas com ls.',
              'A antena ainda recebe ruído e transmissões no mesmo registro.',
              'As caixas misturam registros .txt com arquivos temporários .tmp. Use * e rm com critério.',
              'O visor dos sensores transmite dezenas de leituras. Pipes (|) filtram e ordenam sem sujeira.',
              'Os dutos se ramificam em vários níveis. find alcança todas as subpastas.',
              'A bancada permite escrever várias linhas na aba Editor de script.',
              'O painel aceita ferramentas executáveis com chmod +x e parâmetros em "$1".',
              'O sensor diferencia arquivos pelo tamanho.',
              'A câmara de quarentena classifica pastas (-d), arquivos válidos (-s), vazios (-f) e ausentes.',
              'A matriz aguarda as mensagens e o relatório de caminhos.',
            ][s.room]
    note(chapters[s.room].short + ' · ' + notice)
    render()
    show('inspect')
  }
}
async function action(act: string) {
  if (restoringEnergy) return
  if (menuBusy) return
  if (act === 'menu' || act === 'new' || act === 'listing') {
    await openMenu(
      act === 'new' ? 'new' : act === 'listing' ? 'load' : 'title',
      !menuVisible,
    )
    return
  }
  if (act === 'resume-session' && activeId) {
    resumeJourney()
    return
  }
  if (act === 'save-menu' && activeId) {
    const saved = await save()
    await openMenu(menuMode, false)
    if (saved) toast('Partida salva.')
    else displayMenu(menuMode, 'Não foi possível salvar a partida.')
    return
  }
  if (act.startsWith('load:')) {
    const slot = menuEntries[Number(act.slice(5))]
    if (slot) loadSlot(slot)
    return
  }
  if (act.startsWith('ask-delete:')) {
    confirmDelete = Number(act.slice(11))
    displayMenu(menuMode)
    return
  }
  if (act === 'cancel-delete') {
    confirmDelete = undefined
    displayMenu(menuMode)
    return
  }
  if (act.startsWith('confirm-delete:')) {
    const idx = Number(act.slice(15))
    const slot = menuEntries[idx]
    if (slot) {
      await deleteSlot(slot.id)
      if (activeId === slot.id) activeId = undefined
      confirmDelete = undefined
      await openMenu('load', false)
      toast('Partida removida.')
    }
    return
  }
  if (act.startsWith('travel:')) {
    const idx = Number(act.slice(7))
    if (idx >= 0 && idx <= s.completed && idx !== s.room) {
      close()
      moveRoom(idx)
    }
    return
  }
  if (act === 'toggle-explorer') {
    const diff = playerDifficulty(s)
    explorerOverride = !(explorerOverride ?? diff === 'windows')
    if (modal === 'terminal') terminalInput = $<HTMLInputElement>('#command').value
    show('terminal')
    return
  }
  if (act.startsWith('insert:')) {
    const snippet = act.slice(7)
    const input = document.querySelector<HTMLInputElement>('#command')
    if (input) {
      const space = input.value && !/\s$/.test(input.value) ? ' ' : ''
      input.value = input.value + space + snippet
      terminalInput = input.value
      input.focus()
    }
    return
  }
  if (act.startsWith('reply:')) {
    reply(Number(act.slice(6)))
    return
  }
  if (act === 'close' || act === 'world') {
    close()
    return
  }
  if (act === 'use') {
    interact(nearby(s))
    return
  }
  if (act === 'sound') {
    s.sound = !s.sound
    renderSound()
    save()
    tone()
    return
  }
  if (act === 'full') {
    const vp = $('#viewport')
    if (document.fullscreenElement) await document.exitFullscreen()
    else
      try {
        await vp.requestFullscreen()
      } catch {
        vp.classList.toggle('expanded')
      }
    return
  }
  if (act === 'confirmedRestore') {
    restoreRoom(s)
    frame?.refresh()
    close()
    toast('Arquivos do setor restaurados.')
    return
  }
  if (act === 'morehint') {
    const practice = activePractice(s)
    if (practice)
      practiceHints[practice.id] = Math.min(
        practice.hints.length,
        (practiceHints[practice.id] ?? 1) + 1,
      )
    else s.hints[current()] = Math.min(3, s.hints[current()] + 1)
    show('hint')
    return
  }
  if (act === 'backterm') {
    show(returnScreen)
    return
  }
  if (act === 'savefile' || act === 'saveandrun') {
    const d = s.drafts[s.room]
    try {
      if (!d.name.trim()) throw new Error('Informe o nome do arquivo.')
      const fileName = d.name.trim()
      write(s, path(s.cwd, fileName), d.body)
      s.log.push('Editor · salvo ' + fileName)
      save()
      render()
      if (act === 'saveandrun') {
        execute(defaultRunCommand(s, s.room, fileName))
      } else {
        show('terminal')
        toast('Arquivo salvo: ' + fileName)
      }
    } catch (e) {
      toast((e as Error).message)
    }
    return
  }
  if (act.startsWith('relay:')) {
    if (!s.seen.includes('circuit')) {
      toast('Consulte primeiro o registro do circuito C07.')
      return
    }
    if (act === 'relay:azul') {
      toast('O relé azul só alimenta a bomba auxiliar.')
      return
    }
    mark(s, 'relay')
    if (!progress()) close()
    return
  }
  if (act === 'manual-list') { manualTopic = ''; show('manual'); return }
  if (act.startsWith('topic:')) {
    const topic = act.slice(6)
    if (s.library.includes(topic)) { manualTopic = topic; show('manual') }
    return
  }
  if (act === 'manual') {
    manualTopic = ''
    manualSearch = ''
  }
  if ((act === 'hint' || act === 'manual') && (modal === 'terminal' || modal === 'editor')) {
    returnScreen = modal
    if (modal === 'terminal') terminalInput = $<HTMLInputElement>('#command').value
  }
  if (
    (act === 'hint' || act === 'manual') &&
    (modal === 'terminal' || modal === 'editor')
  )
    heldTerminal = true
  show(act)
}
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
  if (btn) void action(btn.dataset.act!)
})
$('.brand').onclick = (e) => {
  e.preventDefault()
  close()
}
dialog.addEventListener('cancel', (e) => {
  e.preventDefault()
  if (modal === 'manual' && heldTerminal) show(returnScreen)
  else close()
})
document.addEventListener('keydown', (e) => {
  if (
    e.repeat ||
    e.ctrlKey ||
    e.altKey ||
    e.metaKey ||
    dialog.open ||
    menuVisible ||
    restoringEnergy
  )
    return
  const k = e.key.toLowerCase()
  if (k === 'escape') void openMenu()
  if (k === 'e') {
    e.preventDefault()
    interact(nearby(s))
  }
  if (k === 'm' || k === 'j') {
    e.preventDefault()
    if (k === 'm') {
      manualTopic = ''
      manualSearch = ''
    }
    show(k === 'm' ? 'manual' : 'journal')
  }
})
document.addEventListener('fullscreenchange', () => {
  $('[data-act=full]').innerHTML = icon(
    document.fullscreenElement ? 'Minimize' : 'Maximize',
    15,
  )
})
window.addEventListener('pagehide', save)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save()
})
displayMenu('title')
menuBusy = true
try {
  await importLegacy()
} catch {
  // The title menu reports database failures when it lists local saves.
} finally {
  menuBusy = false
}
await openMenu('title', false)
