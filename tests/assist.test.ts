import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bashLint, completeCommand, diskEntries } from '../src/assist'
import {
  activePractice,
  advancePractice,
  diagnoseScript,
  editorAvailable,
  fresh,
  record,
} from '../src/campaign'
import { run } from '../src/shell'
import { conversation } from '../src/story'

test('completeCommand completa comandos e caminhos com espaço usando aspas', () => {
  const s = fresh()
  s.library.push('man', 'pwd', 'ls', 'cat')
  const cmd = completeCommand(s, 'ca')
  assert.equal(cmd.value, 'cat ')

  s.room = s.completed = 6
  s.cwd = '/ark/memoria'
  const pathHit = completeCommand(s, 'cat fragmentos/03')
  assert.equal(pathHit.value, 'cat "fragmentos/03 retorno.frag" ')

  const multi = completeCommand(s, 'cat fragmentos/')
  assert.equal(multi.options.length, 3)
  assert.ok(diskEntries(s, '/ark/memoria/fragmentos').some((e) => e.size === 0))
})

test('bashLint detecta armadilhas comuns de sintaxe Bash', () => {
  const warnings = bashLint(
    'fonte = turno.txt\nif [-s $fonte]; then\n  cat $fonte\n',
  )
  assert.ok(warnings.some((w) => w.includes('espaços em volta do "="')))
  assert.ok(warnings.some((w) => w.includes('espaço após "["')))
  assert.ok(warnings.some((w) => w.includes('aspas')))
  assert.ok(warnings.some((w) => w.includes('sem "fi"')))
  assert.deepEqual(
    bashLint('fonte="turno.txt"\nif [ -s "$fonte" ]; then\n  cat "$fonte"\nfi\n'),
    [],
  )
})

test('diagnoseScript identifica falhas específicas em scripts de campanha', () => {
  const s = fresh()
  s.room = s.completed = 4
  s.cwd = '/ark/oficina'
  s.disk['/ark/oficina/rotina.sh'] =
    'cat turno.txt >> boletim.txt\necho pronto >> boletim.txt\n'
  const d4 = diagnoseScript(s, 4)
  assert.equal(d4.ok, false)
  assert.match(d4.reason || '', /segunda execução/i)

  s.room = s.completed = 6
  s.cwd = '/ark/memoria'
  s.disk['/ark/memoria/recuperar.sh'] =
    '> memoria.txt\n> relatorio.txt\nfor f in fragmentos/*.frag; do\n  if [ -s $f ]; then\n    cat $f >> memoria.txt\n    echo $f >> relatorio.txt\n  fi\ndone\n'
  const d6 = diagnoseScript(s, 6)
  assert.equal(d6.ok, false)
  assert.match(d6.reason || '', /espaço no nome|aspas/i)
})

test('níveis de dificuldade adaptam práticas e liberações do editor', () => {
  const win = fresh()
  win.story = { player: { name: 'Ana', suit: 'ochre' }, step: 'done', difficulty: 'windows' }
  win.room = win.completed = 5
  win.cwd = '/ark/triagem'
  record(win, run(win, 'cat amostra.frag; cat reserva.frag'))
  assert.equal(advancePractice(win), 'Duas cápsulas')
  assert.equal(activePractice(win)?.id, 'teste-tamanho')
  record(win, run(win, '[ -s amostra.frag ]; [ -s reserva.frag ]'))
  assert.equal(advancePractice(win), 'Testando o pulso no terminal')
  assert.equal(activePractice(win)?.id, 'if-simples')
  assert.equal(editorAvailable(win), false)

  const vibe = fresh()
  vibe.story = { player: { name: 'Leo', suit: 'teal' }, step: 'done', difficulty: 'vibe' }
  vibe.room = vibe.completed = 5
  vibe.cwd = '/ark/triagem'
  record(vibe, run(vibe, 'cat amostra.frag; cat reserva.frag'))
  advancePractice(vibe)
  record(vibe, run(vibe, '[ -s amostra.frag ]; [ -s reserva.frag ]'))
  advancePractice(vibe)
  // Vibe coder não precisa da prática extra de if-simples.
  assert.equal(activePractice(vibe), undefined)
  assert.equal(editorAvailable(vibe), true)

  const dev = fresh()
  dev.story = { player: { name: 'Gui', suit: 'plum' }, step: 'done', difficulty: 'dev' }
  dev.room = dev.completed = 5
  assert.equal(activePractice(dev), undefined)
  assert.equal(editorAvailable(dev), true)
})

test('setores 2 a 7 possuem diálogos contextuais próprios antes e após restauração', () => {
  const s = fresh()
  s.room = 2
  s.completed = 2
  const before = conversation(s, 'noah', '')
  assert.match(before.line, /Colapso|fichários/)
  const lore = conversation(s, 'noah', 'lore')
  assert.match(lore.line, /Iara/)
  s.completed = 3
  const after = conversation(s, 'noah', '')
  assert.match(after.line, /coordenadas/)
})
