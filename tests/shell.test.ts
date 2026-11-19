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

const controlSummary = `grep EVENTO "$1" | sort > resumo.txt
grep EVENTO "$1" | wc -l >> resumo.txt`

const quarantineValidate = `if [ -d "$1" ]; then
  echo pasta > diagnostico.txt
elif [ -s "$1" ]; then
  echo valido > diagnostico.txt
elif [ -f "$1" ]; then
  echo vazio > diagnostico.txt
else
  echo ausente > diagnostico.txt
fi`

test('rotina, triagem e recuperação reproduzem o Bash com nomes com espaços, arquivo vazio e reexecução', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ark-'))
  try {
    const s: Session = {
      disk: { '/': null, '/ark': null, '/ark/fragmentos': null },
      cwd: '/ark',
      vars: {},
      execs: [],
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

test('navegação, arquivos, pipes, filtros, find, rm, chmod e elif correspondem ao Bash real', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ark-'))
  try {
    const s: Session = {
      cwd: '/ark',
      vars: {},
      execs: [],
      disk: {
        '/': null,
        '/ark': null,
        '/ark/sinal.txt': 'SOS ARK\nruído\n',
        '/ark/sensores.log':
          'OK 1\nALERTA B\nALERTA A\nALERTA B\nALERTA C\nOK 2\n',
        '/ark/sub': null,
        '/ark/sub/a': null,
        '/ark/sub/a/v1.val': 'x\n',
        '/ark/sub/b.val': 'y\n',
        '/ark/sub/c.tmp': 'lixo\n',
        '/ark/resumo.sh': controlSummary + '\n',
        '/ark/validar.sh': quarantineValidate + '\n',
        '/ark/turno extra.log':
          'EVENTO z\nruído\nEVENTO a\nEVENTO m\n',
        '/ark/vazio.frag': '',
      },
    }
    mkdirSync(join(cwd, 'sub/a'), { recursive: true })
    for (const [k, v] of Object.entries(s.disk)) {
      if (typeof v === 'string') writeFileSync(join(cwd, k.slice(5)), v)
    }
    const script = [
      'mkdir cabine; cp sinal.txt cabine; cd cabine; mv sinal.txt "sinal SOS"; ls; grep SOS "sinal SOS" > contato; echo recebido >> contato; cd ..; cat cabine/contato',
      'rm sub/c.tmp',
      'grep ALERTA sensores.log | sort | uniq > unicos.txt',
      'head -n 2 unicos.txt; tail -n 1 unicos.txt; cat unicos.txt | wc -l',
      'find sub -name "*.val" | sort',
      'chmod +x resumo.sh',
      './resumo.sh "turno extra.log"; cat resumo.txt',
      'bash validar.sh sub; cat diagnostico.txt',
      'bash validar.sh "turno extra.log"; cat diagnostico.txt',
      'bash validar.sh vazio.frag; cat diagnostico.txt',
      'bash validar.sh inexistente.frag; cat diagnostico.txt',
    ].join('\n')
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

test('execução direta com ./ exige chmod +x prévio', () => {
  const s = fresh()
  s.room = s.completed = 8
  s.cwd = '/ark/controle'
  const denied = run(s, './teste.sh ok')
  assert.match(denied.error, /Permissão negada/)
  assert.equal(run(s, 'chmod +x teste.sh').error, '')
  const ok = run(s, './teste.sh ok')
  assert.equal(ok.error, '')
  assert.equal(ok.out, 'Recebido: ok\n')
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

test('novos setores 5, 6, 7, 9 e 11 progridem com práticas e validação', () => {
  const s = fresh()
  // Setor 5 (index 4): Depósito
  s.room = s.completed = 4
  s.cwd = '/ark/deposito'
  record(s, run(s, 'ls caixas/*.txt'))
  assert.equal(advancePractice(s), 'Selecionando arquivos com *')
  record(s, run(s, 'rm descarte/rascunho.tmp'))
  assert.equal(advancePractice(s), 'Descarte seguro com rm')
  record(
    s,
    run(
      s,
      'mkdir ativos; cp caixas/*.txt ativos; rm caixas/*.tmp; cat ativos/bateria-*.txt > baterias.txt',
    ),
  )
  assert.equal(finish(s), true)

  // Setor 6 (index 5): Telemetria
  s.room = 5
  s.cwd = '/ark/telemetria'
  record(s, run(s, 'grep ALERTA sensores.log | wc -l'))
  assert.equal(advancePractice(s), 'Conectando comandos com pipe')
  record(s, run(s, 'tail -n 2 sensores.log'))
  assert.equal(advancePractice(s), 'Lendo o final de um registro')
  record(
    s,
    run(
      s,
      'grep ALERTA sensores.log | sort > alertas.txt; head -n 2 alertas.txt > prioridade.txt; cat alertas.txt | wc -l > contagem.txt',
    ),
  )
  assert.equal(finish(s), true)

  // Setor 7 (index 6): Dutos
  s.room = 6
  s.cwd = '/ark/dutos'
  record(s, run(s, 'find setores -name "*.val"'))
  assert.equal(advancePractice(s), 'Vasculhando subpastas com find')
  record(s, run(s, 'grep FALHA historico.log | sort | uniq'))
  assert.equal(advancePractice(s), 'Eliminando repetições com uniq')
  record(
    s,
    run(
      s,
      'find setores -name "*.val" | sort > mapa.txt; grep FALHA historico.log | sort | uniq > falhas.txt; mkdir inspecao; cp setores/subsolo/v04.val inspecao',
    ),
  )
  assert.equal(finish(s), true)

  // Setor 9 (index 8): Controle
  s.room = s.completed = 8
  s.cwd = '/ark/controle'
  record(s, run(s, 'chmod +x teste.sh; ./teste.sh ok'))
  assert.equal(advancePractice(s), 'Tornando um script executável')
  record(s, run(s, 'grep EVENTO diurno.log | sort'))
  assert.equal(advancePractice(s), 'Testando o filtro de eventos')
  s.disk[s.cwd + '/resumo.sh'] = controlSummary
  record(s, run(s, 'chmod +x resumo.sh; ./resumo.sh diurno.log'))
  assert.equal(finish(s), true)

  // Setor 11 (index 10): Quarentena
  s.room = s.completed = 10
  s.cwd = '/ark/quarentena'
  record(s, run(s, '[ -d lote ]; [ -f vazio.frag ]'))
  assert.equal(advancePractice(s), 'Diferenciando pastas e arquivos')
  s.disk[s.cwd + '/validar.sh'] = quarantineValidate
  record(s, run(s, 'bash validar.sh lote/eco.frag'))
  assert.equal(finish(s), true)
})

test('missão final rejeita uma saída fixa e exige solução reproduzível', () => {
  const s = fresh()
  s.room = s.completed = 11
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

test('o rádio aceita contato.txt correto de uma partida anterior e injeta novos setores', () => {
  const s = fresh()
  s.room = s.completed = 3
  s.cwd = '/ark/radio'
  s.disk[s.cwd + '/contato.txt'] = 'SOS oficina canal 7\nrecebido\n'
  delete s.trainingVersion
  delete s.disk[s.cwd + '/remessas/antena.log']
  delete s.disk['/ark/deposito/caixas/bateria-a.txt']
  updateTraining(s)
  assert.equal(s.disk['/ark/deposito/caixas/bateria-a.txt'], 'BATERIA A: carga 82%\n')
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
