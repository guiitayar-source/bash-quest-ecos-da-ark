import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './style.css'
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
} from 'lucide'
import {
  chapters,
  manual,
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
} from './campaign'
import { run, path, write } from './shell'
import { bootWorld, nearby, type Spot } from './world'
import { hydrate, importLegacy, slots, storeSlot, type Slot } from './saves'
import { frontMarkup, type MenuMode } from './front'
import { crew, conversation, suits, type NPC } from './story'
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
  'Wrench',
  'FlaskConical',
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
  history: string[] = [],
  historyPos = 0,
  frame: ReturnType<typeof bootWorld> | undefined
const current = () => Math.min(s.completed, 6)
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
let soundCtx: AudioContext | undefined
const soundNotes = {
  interface: [460],
  accepted: [520, 660],
  rejected: [310, 200],
  mission: [520, 660, 790, 1040],
}
function tone(cue: keyof typeof soundNotes = 'interface') {
  if (!s.sound) return
  try {
    soundCtx ??= new AudioContext()
    const context = soundCtx
    const notes = soundNotes[cue]
    void context
      .resume()
      .then(() => {
        if (!s.sound) return
        const start = context.currentTime
        for (const [i, frequency] of notes.entries()) {
          const at = start + i * 0.085
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = 'triangle'
          oscillator.frequency.value = frequency
          gain.gain.setValueAtTime(0.0001, at)
          gain.gain.exponentialRampToValueAtTime(0.037, at + 0.008)
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
          oscillator.connect(gain).connect(context.destination)
          oscillator.start(at)
          oscillator.stop(at + 0.13)
        }
      })
      .catch(() => {})
  } catch {
    /* Audio is optional. */
  }
}
$('#app').innerHTML =
  `<div id="front" class="front"></div><div id="journey" hidden><header><div class="top"><a class="brand" href="#" aria-label="Bash Quest, exploração"><img src="/ark.svg" alt=""><span>BASH<span class="brand-dot">_</span>QUEST<small>ECOS DA ARK</small></span></a>
<nav aria-label="Navegação principal">${button('world', icon('Compass') + 'Exploração', 'nav active')}${button('journal', icon('NotebookText') + 'Diário', 'nav')}${button('manual', icon('BookOpen') + 'Manual', 'nav')}</nav>
<div class="right-top">${button('menu', 'Menu', 'game-menu')}<span class="save"><i></i><span id="saved">Salvo localmente</span></span>${button('sound', '', 'square', 'aria-label="Ativar som"')}${button('controls', icon('CircleHelp'), 'square', 'aria-label="Controles do jogo"')}</div></div></header>
<main><div class="heading"><div><div class="eyebrow"><i class="slash"></i> ESTAÇÃO ARK <b>/</b> <span id="sector"></span></div><h1 id="title"></h1></div><div id="chapter-tag"></div></div>
<div class="layout"><section class="viewport card" id="viewport" aria-label="Visor de exploração"><div class="cardhead"><span class="cap">${icon('Monitor', 16)} Visor de exploração</span><div class="feed"><i></i> AO VIVO ${button('full', icon('Maximize', 15), 'plain', 'aria-label="Ampliar visor"')}</div></div>
<div class="stage"><div id="game"></div><div class="camera-label"><b></b><span id="cam"></span></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div><div id="interact"></div></div>
<div class="bindings"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <em>ou</em> <span class="arrows">↑←↓→</span> Mover</span><span><kbd>E</kbd> Interagir</span><span><kbd>J</kbd> Diário</span><span><kbd>M</kbd> Manual</span></div></section>
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
  front.innerHTML = frontMarkup(mode, menuEntries, Boolean(activeId), error)
  if (mode === 'new') $('#character-name').focus()
  else front.querySelector('button')?.focus({ preventScroll: true })
}
async function openMenu(mode: MenuMode = 'title', flush = true) {
  if (menuBusy) return
  menuBusy = true
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
      () => menuVisible || Boolean(modal),
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
  const state = hydrate(slot.state)
  const resume = state.screen
  Object.assign(s, state, { story: state.story })
  history = []
  historyPos = 0
  talking = undefined
  activeId = slot.id
  resumeJourney()
  if ((resume === 'terminal' || resume === 'editor') && s.room >= 0) {
    heldTerminal = true
    show(resume)
  } else if (s.completed === 7 && !s.endsSeen) show('credits')
}
front.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement
  if (form.id !== 'character-form') return
  event.preventDefault()
  if (menuBusy) return
  const fields = new FormData(form)
  const name = String(fields.get('name') || '').trim()
  const suit = suits.find((item) => item.id === fields.get('suit'))
  const input = $<HTMLInputElement>('#character-name')
  if (!name || !suit) {
    input.value = ''
    input.reportValidity()
    return
  }
  const state = fresh()
  state.story = { player: { name, suit: suit.id }, step: 'wake' }
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
    finished = s.completed === 7,
    g = goals(s, n),
    practice = activePractice(s, n),
    opening = openingObjective()
  $('#sector').textContent =
    s.room === -1 ? 'CONEXÃO ENTRE SETORES' : 'SETOR ' + pad(s.room + 1)
  $('#title').textContent =
    s.room === -1 ? 'Corredor de manutenção' : chapters[s.room].room
  $('#chapter-tag').innerHTML =
    '<span class="signal-bars"><i></i><i></i><i></i><i></i></span> ' +
    (finished
      ? 'CAMPANHA CONCLUÍDA'
      : 'CAPÍTULO ' + pad(n + 1) + ' <b>/ 07</b>')
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
  $('#operator').innerHTML =
    '<div class="avatar"><img src="/art/player-' +
    (s.story?.player.suit ?? 'ochre') +
    '-1.png" alt=""></div><div class="opbody"><div class="ophead"><span class="micro">OPERADOR</span><b>NV. ' +
    pad(s.completed + 1) +
    '</b></div><strong>' +
    esc(s.story?.player.name ?? (finished ? 'Guardião da ARK' : 'Explorador')) +
    '</strong><div class="xp"><i style="width:' +
    (s.completed / 7) * 100 +
    '%"></i></div><small>' +
    s.completed * 100 +
    ' XP <span>/ 700 XP</span></small></div>'
  const lesson = s.room < 0 ? n : s.room
  $('#toolbox').innerHTML =
    '<span class="cap">' +
    icon('Terminal', 15) +
    ' Ferramentas do setor</span><div class="chips">' +
    chapters[lesson].tools
      .map((tool, i) => button('tool:' + lesson + ':' + i, esc(tool)))
      .join('') +
    '</div>'
  $('#route-count').textContent = s.completed + ' de 7 setores restaurados'
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
  dialog.className = wide ? 'wide' : ''
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
  save()
  render()
  if (s.completed === 7 && !s.endsSeen) {
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
    const messages = [
      'Lara deixou uma mensagem para você na cabine. <code>pwd</code> mostra a pasta em que você está. <code>ls</code> lista o que ela guarda. Assim que encontrar o arquivo, use <code>cat</code> seguido do nome para ler o conteúdo.',
      'A etiqueta da máquina indica um circuito. Use <code>ls</code> para localizar a pasta dos registros. <code>cd</code> muda de pasta e <code>cd ..</code> volta à pasta acima. Depois de achar o registro, você já sabe como ler.',
      'Precisamos juntar as fichas sem perder os originais. <code>mkdir</code> cria uma pasta. <code>cp</code> deixa uma cópia no destino e conserva a origem. A rota, porém, está no lugar errado. Use <code>mv</code> para tirá-la de lá e colocá-la na navegação.',
      'O receptor gravou cada chiado. <code>grep SOS sinais.log</code> imprime só as linhas com SOS. O sinal pode ir direto para <code>contato.txt</code>. O <code>&gt;</code> cria o arquivo ou substitui o conteúdo dele. Depois, <code>echo</code> produz a linha de confirmação e <code>&gt;&gt;</code> a acrescenta ao mesmo arquivo.',
      'Você montou o boletim à mão em dois turnos. Agora a estação pode repetir o procedimento: salve os comandos no editor, um por linha. <code>bash rotina.sh</code> lê e executa essas instruções em ordem. O editor começa com a primeira linha do boletim.',
      'Você viu uma cápsula com pulso e outra vazia. <code>[ -s arquivo ]</code> verifica se existe conteúdo. O <code>if</code> usa o resultado desse teste para escolher entre dois caminhos. Use <code>echo</code> para gravar o estado escolhido.',
      'Você já abriu os fragmentos em grupo com <code>*.frag</code>. O <code>for</code> passa um caminho por vez ao seu código. Dentro dele, use a triagem que você acabou de aprender para recuperar só os fragmentos com conteúdo.',
    ]
    const localPractice = activePractice(s, s.room)
    const voice =
      localPractice?.voice ??
      (s.room === 0 ? 'NOAH' : s.room % 2 ? 'IARA' : 'NOAH')
    const onboarding =
      '<div class="transmission">' +
      esc(voice.toUpperCase()) +
      '</div>' +
      (localPractice
        ? '<strong>' +
          esc(localPractice.title) +
          '</strong><br>' +
          esc(localPractice.brief)
        : messages[s.room] +
          (s.room > 0 ? '<br><br>' + esc(chapters[s.room].desc) : ''))
    layout(
      'Terminal de bordo',
      'ARK OS / SESSÃO LOCAL',
      '<div class="termtabs">' +
        button('terminal', icon('Terminal', 15) + 'Terminal', 'selected') +
        (editorAvailable(s)
          ? button('editor', icon('FileCode', 15) + 'Editor de script')
          : '') +
        button('manual', icon('BookOpen', 15) + 'Manual') +
        '</div><div class="tguide">' +
        onboarding +
        '</div><div class="terminal-view"><pre id="output"></pre>' +
        (s.room === 3 && s.completed === 3 && !localPractice
          ? '<p class="radio-tip">' + esc(radioTip(s)) + '</p>'
          : '') +
        '<form id="command-form"><label for="command">ark:' +
        esc(s.cwd) +
        ' $</label><input id="command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando Bash"></form></div>' +
        (commandFeedback
          ? '<p class="command-feedback ' +
            (commandFeedback.ok ? 'accepted' : 'rejected') +
            '" role="status">' +
            icon(commandFeedback.ok ? 'Check' : 'X', 16) +
            esc(commandFeedback.text) +
            '</p>'
          : '') +
        '<div class="modfoot"><span><kbd>Enter</kbd> Executar &nbsp; <kbd>Esc</kbd> Voltar à estação</span><div class="terminal-actions">' +
        button('sound', '', 'square') +
        button('hint', icon('Lightbulb', 15) + ' Dica', 'textbtn') +
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
    input.focus()
    input.onkeydown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        historyPos = Math.max(
          0,
          Math.min(history.length, historyPos + (e.key === 'ArrowUp' ? -1 : 1)),
        )
        input.value = history[historyPos] || ''
      }
    }
    $('.terminal-view').scrollTop = $('.terminal-view').scrollHeight
  } else if (type === 'editor') {
    const d = (s.drafts[s.room] ??= {
      name: scriptName(s.room),
      body: String(
        s.disk[path(s.cwd, scriptName(s.room))] ??
          (s.room === 4
            ? 'cat turno.txt > boletim.txt\n# Escreva aqui o comando que acrescenta a confirmação.\n'
            : ''),
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
        '"></label><label class="field">Código Bash<textarea id="code" spellcheck="false" placeholder="# Escreva um comando por linha"></textarea></label><div class="modfoot"><span>Rascunho salvo ao digitar</span>' +
        button(
          'savefile',
          icon('SaveIcon', 16) + ' Salvar arquivo',
          'primary',
        ) +
        '</div>',
      true,
    )
    const area = $<HTMLTextAreaElement>('#code')
    area.value = d.body
    const draft = () => {
      d.body = area.value
      d.name = $<HTMLInputElement>('#filename').value
      save()
    }
    area.oninput = draft
    $('#filename').oninput = draft
    area.focus()
  } else if (type === 'manual') {
    const back = heldTerminal
      ? button('backterm', 'Voltar ao terminal', 'primary')
      : ''
    layout(
      'Manual de campo',
      'BIBLIOTECA DO OPERADOR',
      '<p class="intro">Comandos descobertos até o capítulo ' +
        pad(n + 1) +
        '. Experimente os exemplos no terminal.</p>' +
        chapters
          .slice(0, n + 1)
          .map(
            (ch, i) =>
              '<details ' +
              (i === n ? 'open' : '') +
              '><summary>' +
              pad(i + 1) +
              ' · ' +
              ch.title +
              '</summary>' +
              ch.tools
                .map(
                  (k) =>
                    '<article class="ref"><strong>' +
                    esc(k) +
                    '</strong><p>' +
                    esc(manual[k][0]) +
                    '</p><pre>' +
                    esc(manual[k][1]) +
                    '</pre></article>',
                )
                .join('') +
              '</details>',
          )
          .join('') +
        back,
    )
  } else if (type.startsWith('tool:')) {
    const [, a, b] = type.split(':')
    const term = chapters[Number(a)].tools[Number(b)]
    layout(
      term,
      'MANUAL DE CAMPO  /  ' + chapters[Number(a)].short.toUpperCase(),
      '<p>' +
        esc(manual[term][0]) +
        '</p><pre>' +
        esc(manual[term][1]) +
        '</pre>' +
        button('close', 'Voltar à exploração', 'primary'),
    )
  } else if (type === 'journal') {
    layout(
      'Diário de bordo',
      'MEMÓRIA DO OPERADOR',
      '<h3>Missão atual</h3><p>' +
        esc(
          s.completed === 7
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
        (s.completed === 7
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
    layout(
      'A ARK se lembra',
      'CAMPANHA CONCLUÍDA',
      '<div class="successbadge">' +
        icon('Cpu', 40) +
        '</div><p>O silêncio dá lugar às vozes de Lara e Noah. Sete setores voltaram à vida, e o próximo turno encontrará a estação acesa.</p><pre>' +
        esc(String(s.disk['/ark/memoria/memoria.txt'] || '')) +
        '</pre><h3>Créditos</h3><p>Universo e jogo original: Guilherme Tayar. Ecos da ARK é uma aventura criada a partir de Bash Quest e da missão “O serviço que não se lembra”.</p>' +
        button('close', 'Voltar à estação', 'primary'),
    )
  } else if (type === 'relay') {
    layout(
      'Painel de distribuição',
      'ETIQUETA DE LINHA  /  C07',
      '<p>A placa identifica o circuito <strong>C07</strong>. Consulte seu registro no terminal para descobrir qual relé alimenta o corredor.</p><div class="actions">' +
        button('relay:azul', 'Relé azul', 'outline') +
        button('relay:ambar', 'Relé âmbar', 'primary') +
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
        '</p>',
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
    show('success')
    return true
  }
  render()
  return false
}
function execute() {
  const input = $<HTMLInputElement>('#command'),
    line = input.value.trim()
  if (!line) return
  history.push(line)
  historyPos = history.length
  const prompt = s.cwd
  const r = run(s, line)
  s.log.push('ark:' + prompt + ' $ ' + line)
  if (r.out) s.log.push(r.out.trimEnd())
  const failure =
    r.error ||
    (r.status
      ? r.trace.at(-1)?.cmd === 'grep'
        ? 'O grep não encontrou nenhuma linha correspondente.'
        : 'O comando terminou com status ' + r.status + '.'
      : '')
  commandFeedback = failure
    ? { ok: false, text: 'Falha no comando. ' + failure }
    : { ok: true, text: 'Comando executado.' }
  if (failure) s.log.push('⚠ ' + failure)
  record(s, r)
  const practiced = !failure && advancePractice(s)
  if (practiced)
    commandFeedback = { ok: true, text: 'Tarefa concluída. ' + practiced + '.' }
  if (
    s.room >= 4 &&
    s.room === s.completed &&
    !activePractice(s) &&
    !r.error &&
    r.trace.some((t) => t.cmd === 'bash')
  ) {
    const checks = goals(s, s.room)
    if (!checks.every(Boolean)) {
      const problem =
        s.room === 6 && checks[1]
          ? 'O resultado inicial confere. Teste o script com outros nomes, um arquivo vazio e duas execuções seguidas.'
          : 'Confira este objetivo: ' +
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
  tone(commandFeedback.ok ? 'accepted' : 'rejected')
  show('terminal')
}
function moveRoom(n: number) {
  commandFeedback = undefined
  enter(s, n)
  frame?.refresh()
  tone()
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
      p.kind === 'log' && s.room === 6 && s.completed === 7
        ? String(s.disk['/ark/memoria/memoria.txt'])
        : p.kind === 'log'
          ? chapters[s.room].lore
          : [
              'A luz da cápsula pisca em direção ao terminal. O último registro foi salvo em mensagem.txt.',
              '',
              'Os armários têm etiquetas de origem e destino. Consulte as pastas com ls.',
              'A antena ainda recebe ruído e transmissões no mesmo registro.',
              'A bancada permite escrever várias linhas na aba Editor de script.',
              'O sensor diferencia arquivos pelo tamanho.',
              'A matriz aguarda as mensagens e o relatório de caminhos.',
            ][s.room]
    note(chapters[s.room].short + ' · ' + notice)
    render()
    show('inspect')
  }
}
async function action(act: string) {
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
    show('terminal')
    return
  }
  if (act === 'savefile') {
    const d = s.drafts[s.room]
    try {
      if (!d.name.trim()) throw new Error('Informe o nome do arquivo.')
      write(s, path(s.cwd, d.name), d.body)
      s.log.push('Editor · salvo ' + d.name)
      save()
      render()
      show('terminal')
      toast('Arquivo salvo: ' + d.name)
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
  close()
})
document.addEventListener('keydown', (e) => {
  if (
    e.repeat ||
    e.ctrlKey ||
    e.altKey ||
    e.metaKey ||
    dialog.open ||
    menuVisible
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
