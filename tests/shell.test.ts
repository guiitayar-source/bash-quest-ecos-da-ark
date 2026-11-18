import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, type Session } from '../src/shell'
import {
  activePractice,
  advancePractice,
  fresh,
  finish,
  record,
  updateTraining,
} from '../src/campaign'
const recovery = `> memoria.txt
> relatorio.txt
for arquivo in fragmentos/*.frag; do
  if [ -s "$arquivo" ]; then
    cat "$arquivo" >> memoria.txt
    echo "$arquivo" >> relatorio.txt
  fi
done`
test('rotina, triagem e recuperação reproduzem o Bash com nomes com espaços, arquivo vazio e reexecução', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ark-'))
  try {
    const s: Session = {
      disk: { '/': null, '/ark': null, '/ark/fragmentos': null },
      cwd: '/ark',
      vars: {},
    }
    mkdirSync(join(cwd, 'fragmentos'))
    const samples: Record<string, string> = {
      'fragmentos/a eco.frag': 'Primeira mensagem.\n',
      'fragmentos/b.frag': '',
      'fragmentos/c.frag': 'Última.\n',
      'turno.txt': 'Iara\n',
      'amostra.frag': '',
      'rotina.sh':
        'fonte=turno.txt\ncat "$fonte" > boletim.txt\necho pronto >> boletim.txt',
      'triagem.sh':
        'if [ -s amostra.frag ]; then\n echo legível > estado.txt\nelse\n echo vazio > estado.txt\nfi',
      'recuperar.sh': recovery,
    }
    for (const [file, data] of Object.entries(samples)) {
      writeFileSync(join(cwd, file), data)
      s.disk['/ark/' + file] = data
    }
    const script =
      'bash rotina.sh; bash triagem.sh; bash recuperar.sh; cat boletim.txt estado.txt memoria.txt relatorio.txt'
    for (let i = 0; i < 2; i++) {
      const expected = execFileSync('bash', ['-c', script], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, LC_ALL: 'C' },
      })
      const r = run(s, script)
      assert.equal(r.error, '')
      assert.equal(r.out, expected)
      for (const f of [
        'boletim.txt',
        'estado.txt',
        'memoria.txt',
        'relatorio.txt',
      ])
        assert.equal(s.disk['/ark/' + f], readFileSync(join(cwd, f), 'utf8'))
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
test('navegação, arquivos e busca correspondem ao Bash real', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ark-'))
  try {
    const s: Session = {
      cwd: '/',
      vars: {},
      disk: { '/': null, '/sinal.txt': 'SOS ARK\nruído\n' },
    }
    writeFileSync(join(cwd, 'sinal.txt'), s.disk['/sinal.txt']!)
    const script =
      'mkdir cabine; cp sinal.txt cabine; cd cabine; mv sinal.txt "sinal SOS"; ls; grep SOS "sinal SOS" > contato; echo recebido >> contato; cd ..; cat cabine/contato'
    const r = run(s, script)
    assert.equal(r.error, '')
    assert.equal(
      r.out,
      execFileSync('bash', ['-c', script], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, LC_ALL: 'C' },
      }),
    )
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
test('erros didáticos não concluem missões e recompensa não se repete', () => {
  const s = fresh()
  assert.match(run(s, 'xyz').error, /terminal didático/)
  assert.equal(finish(s), false)
  s.seen.push('terminal0')
  record(s, run(s, 'pwd; ls; cat mensagem.txt'))
  assert.equal(finish(s), true)
  assert.equal(finish(s), false)
})
test('missão final rejeita uma saída fixa e exige solução reproduzível', () => {
  const s = fresh()
  s.room = s.completed = 6
  s.cwd = '/ark/memoria'
  record(s, run(s, 'cat fragmentos/*.frag'))
  assert.equal(advancePractice(s), 'Padrão de memória')
  record(s, run(s, 'for arq in fragmentos/*.frag; do cat "$arq"; done'))
  assert.equal(advancePractice(s), 'Percorrendo arquivos com for')
  s.disk[s.cwd + '/recuperar.sh'] = recovery
  record(s, run(s, 'bash recuperar.sh'))
  s.disk[s.cwd + '/recuperar.sh'] = 'echo falso'
  assert.equal(finish(s), false)
  s.disk[s.cwd + '/recuperar.sh'] = recovery
  assert.equal(finish(s), true)
})

test('o rádio aceita contato.txt correto de uma partida anterior sem exigir o histórico do grep', () => {
  const s = fresh()
  s.room = s.completed = 3
  s.cwd = '/ark/radio'
  s.disk[s.cwd + '/contato.txt'] = 'SOS oficina canal 7\nrecebido\n'
  delete s.trainingVersion
  delete s.disk[s.cwd + '/remessas/antena.log']
  updateTraining(s)
  assert.equal(activePractice(s)?.id, 'alcance')
  assert.equal(finish(s), false)
  run(
    s,
    'mkdir escuta; grep "SINAL OK" remessas/antena.log > escuta/transmissao.txt; echo inspecionado >> escuta/transmissao.txt',
  )
  assert.equal(advancePractice(s), 'Teste de alcance')
  assert.equal(finish(s), true)
  assert.equal(finish(s), false)
})
