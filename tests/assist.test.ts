import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bashLint, completeCommand, diskEntries } from '../src/assist'
import {
  activePractice,
  advancePractice,
  chapters,
  diagnoseScript,
  editorAvailable,
  fresh,
  record,
} from '../src/campaign'
import { run } from '../src/shell'
import { conversation } from '../src/story'

test('completeCommand completa comandos, após pipes e caminhos com espaço usando aspas', () => {
  const s = fresh()
  s.library.push('man', 'pwd', 'ls', 'cat', 'grep', 'sort')
  const cmd = completeCommand(s, 'ca')
  assert.equal(cmd.value, 'cat ')

  const piped = completeCommand(s, 'grep ALERTA sensores.log | so')
  assert.equal(piped.value, 'grep ALERTA sensores.log | sort ')

  s.room = s.completed = 11
  s.cwd = '/ark/memoria'
  const pathHit = completeCommand(s, 'cat fragmentos/03')
  assert.equal(pathHit.value, 'cat "fragmentos/03 retorno.frag" ')

  const multi = completeCommand(s, 'cat fragmentos/')
  assert.equal(multi.options.length, 3)
  assert.ok(diskEntries(s, '/ark/memoria/fragmentos').some((e) => e.size === 0))
})

test('bashLint detecta armadilhas comuns de sintaxe Bash incluindo elif e $1', () => {
  const warnings = bashLint(
    'fonte = turno.txt\nif [-s $fonte]; then\n  cat $fonte\nelif [ -f $1 ]\n  echo vazio\n',
  )
  assert.ok(warnings.some((w) => w.includes('espaços em volta do "="')))
  assert.ok(warnings.some((w) => w.includes('espaço após "["')))
  assert.ok(warnings.some((w) => w.includes('aspas')))
  assert.ok(warnings.some((w) => w.includes('sem "fi"')))
  assert.deepEqual(
    bashLint(
      'fonte="turno.txt"\nif [ -d "$1" ]; then\n  echo pasta\nelif [ -s "$fonte" ]; then\n  cat "$fonte"\nfi\n',
    ),
    [],
  )
})

test('diagnoseScript identifica falhas específicas em scripts de campanha', () => {
  const s = fresh()
  s.room = s.completed = 7
  s.cwd = '/ark/oficina'
  s.disk['/ark/oficina/rotina.sh'] =
    'cat turno.txt >> boletim.txt\necho pronto >> boletim.txt\n'
  const d7 = diagnoseScript(s, 7)
  assert.equal(d7.ok, false)
  assert.match(d7.reason || '', /segunda execução/i)

  s.room = s.completed = 8
  s.cwd = '/ark/controle'
  s.disk['/ark/controle/resumo.sh'] =
    'grep EVENTO "$1" | sort > resumo.txt\ngrep EVENTO "$1" | wc -l >> resumo.txt\n'
  const d8 = diagnoseScript(s, 8)
  assert.equal(d8.ok, false)
  assert.match(d8.reason || '', /chmod \+x/i)

  s.room = s.completed = 10
  s.cwd = '/ark/quarentena'
  s.disk['/ark/quarentena/validar.sh'] =
    'if [ -f "$1" ]; then\n  echo vazio > diagnostico.txt\nelse\n  echo pasta > diagnostico.txt\nfi\n'
  const d10 = diagnoseScript(s, 10)
  assert.equal(d10.ok, false)
  assert.match(d10.reason || '', /valido|ausente|ordem/i)

  s.room = s.completed = 11
  s.cwd = '/ark/memoria'
  s.disk['/ark/memoria/recuperar.sh'] =
    '> memoria.txt\n> relatorio.txt\nfor f in fragmentos/*.frag; do\n  if [ -s $f ]; then\n    cat $f >> memoria.txt\n    echo $f >> relatorio.txt\n  fi\ndone\n'
  const d11 = diagnoseScript(s, 11)
  assert.equal(d11.ok, false)
  assert.match(d11.reason || '', /espaço no nome|aspas/i)
})

test('níveis de dificuldade adaptam práticas e liberações do editor', () => {
  const win = fresh()
  win.story = { player: { name: 'Ana', suit: 'ochre' }, step: 'done', difficulty: 'windows' }
  win.room = win.completed = 9
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
  vibe.room = vibe.completed = 9
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
  dev.room = dev.completed = 9
  assert.equal(activePractice(dev), undefined)
  assert.equal(editorAvailable(dev), true)
})

test('todos os setores 2 a 12 possuem diálogos contextuais próprios antes e após restauração', () => {
  for (let i = 1; i < chapters.length; i++) {
    const s = fresh()
    s.room = i
    s.completed = i
    const before = conversation(s, 'noah', '')
    assert.ok(before.line.length > 20, `Setor ${i + 1} sem fala ativa`)
    const lore = conversation(s, 'noah', 'lore')
    assert.ok(lore.line.length > 20, `Setor ${i + 1} sem lore`)
    s.completed = i + 1
    const after = conversation(s, 'noah', '')
    assert.notEqual(after.line, before.line, `Setor ${i + 1} sem fala restaurada`)
  }
})
