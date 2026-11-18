import type { Story } from './story'
import { path, run, type Disk, type Result, type Session } from './shell'

export const chapters = [
  {
    room: 'Cabine de despertar',
    short: 'Cabine',
    dir: 'cabine',
    title: 'O despertar',
    desc: 'Uma mensagem sobreviveu ao apagão. Descubra onde você está e leia o último registro da cabine.',
    goals: [
      'Localizar o terminal',
      'Identificar a pasta e listar os arquivos',
      'Ler a última mensagem',
    ],
    hints: [
      'A tela verde ainda tem energia. Aproxime-se e pressione E.',
      'No terminal, digite pwd e pressione Enter. Depois experimente ls.',
      'O ls revelou mensagem.txt. Use cat mensagem.txt para ler.',
    ],
    lore: 'Lara deixou um cobertor sobre a segunda cápsula. A etiqueta diz “volto antes do próximo turno”.',
    restored:
      'A trava da cabine se abriu. O corredor de manutenção está acessível.',
    tools: ['pwd', 'ls', 'cat'],
  },
  {
    room: 'Distribuição de energia',
    short: 'Energia',
    dir: 'energia',
    title: 'O corredor apagado',
    desc: 'A etiqueta na máquina identifica o circuito da porta. Cruze essa pista com os registros e acione o relé indicado.',
    goals: [
      'Examinar a etiqueta da máquina',
      'Ler o registro do circuito indicado',
      'Acionar o relé correto no painel',
    ],
    hints: [
      'Examine a máquina à esquerda. O número do circuito também é o nome do arquivo.',
      'Use ls, depois cd circuitos. Com cd .. você volta à pasta anterior.',
      'Leia cat /ark/energia/circuitos/c07.log. Examine a máquina outra vez para escolher o relé.',
    ],
    lore: 'O eletricista riscou o rótulo antigo. Sob o verniz novo ainda se lê C07.',
    restored: 'O relé fechou. As luzes do corredor acenderam em sequência.',
    tools: ['cd', '..'],
  },
  {
    room: 'Arquivo da tripulação',
    short: 'Arquivo',
    dir: 'arquivo',
    title: 'O arquivo disperso',
    desc: 'Crie resgate, copie os dois registros de equipe para lá e mova rota.txt de achados para navegacao.',
    goals: [
      'Criar a pasta resgate',
      'Copiar os dois registros de equipe',
      'Devolver rota.txt à navegação',
    ],
    hints: [
      'Use ls equipe e ls achados para inspecionar as origens.',
      'mkdir resgate cria a pasta. cp equipe/iara.txt resgate copia um registro.',
      'Copie também noah.txt. Mova a carta com mv achados/rota.txt navegacao.',
    ],
    lore: 'Dois nomes aparecem nos armários. As botas de Lara ainda estão cheias de pó da encosta.',
    restored:
      'Os fichários voltaram a girar. A rota até a antena foi recuperada.',
    tools: ['mkdir', 'cp', 'mv'],
  },
  {
    room: 'Central de rádio',
    short: 'Rádio',
    dir: 'radio',
    title: 'Vozes no ruído',
    desc: 'Em contato.txt, grave duas linhas: primeiro a transmissão SOS de sinais.log, depois a palavra recebido.',
    goals: [
      'Localizar a transmissão SOS',
      'Gravar o sinal em contato.txt',
      'Acrescentar recebido à 2ª linha de contato.txt',
    ],
    hints: [
      'grep SOS sinais.log mostra só a linha com o pedido de socorro.',
      'Grave a primeira linha com grep SOS sinais.log > contato.txt.',
      'Na linha de comando, digite echo recebido >> contato.txt. O >> acrescenta a confirmação ao fim do mesmo arquivo. Use cat contato.txt para conferir.',
    ],
    lore: 'O microfone permanece aberto. Entre dois pulsos de estática, alguém bate três vezes.',
    restored: 'A antena ganhou sinal. Uma voz da oficina respondeu ao chamado.',
    tools: ['grep', '>', 'echo', '>>'],
  },
  {
    room: 'Oficina de manutenção',
    short: 'Oficina',
    dir: 'oficina',
    title: 'Uma rotina para amanhã',
    desc: 'Transforme o procedimento do boletim em rotina.sh. Ao rodar o script, ele deve recriar boletim.txt com o conteúdo de turno.txt e a linha “pronto”.',
    goals: [
      'Salvar rotina.sh no editor',
      'Executar a rotina com bash',
      'Gerar o boletim reproduzível',
    ],
    hints: [
      'Abra o editor do terminal. Uma linha de script é um comando comum.',
      'Reaproveite os comandos da prévia: leia turno.txt para gravar boletim.txt e acrescente pronto. A variável fonte é uma opção para guardar o nome do arquivo.',
      'Salve como rotina.sh, volte ao terminal e execute bash rotina.sh.',
    ],
    lore: 'Toda madrugada alguém copiava o turno anterior à mão. No rodapé, uma promessa: “amanhã automatizo”.',
    restored:
      'O boletim entrou na fila automática. A bancada de triagem está disponível.',
    tools: ['bash', 'variáveis'],
  },
  {
    room: 'Laboratório de triagem',
    short: 'Triagem',
    dir: 'triagem',
    title: 'O pulso do fragmento',
    desc: 'Escreva triagem.sh para testar amostra.frag. Grave “legível” em estado.txt se tiver conteúdo, ou “vazio” se estiver vazia.',
    goals: [
      'Salvar triagem.sh',
      'Executar o teste da amostra',
      'Distinguir as duas condições',
    ],
    hints: [
      'O manual mostra um bloco if completo. O teste -s verifica se o arquivo tem conteúdo.',
      'Troque o exemplo do manual por amostra.frag. Nos dois ramos, redirecione a saída para estado.txt.',
      'Use exatamente legível e vazio nas saídas. Rode bash triagem.sh.',
    ],
    lore: 'As cápsulas têm a mesma aparência. Só o pulso elétrico distingue uma lembrança de um invólucro vazio.',
    restored:
      'A triagem separou os sinais do silêncio. O arquivo central aceitou sua credencial.',
    tools: ['if', '-s'],
  },
  {
    room: 'Núcleo de memória',
    short: 'Núcleo',
    dir: 'memoria',
    title: 'O serviço que não se lembra',
    desc: 'Escreva recuperar.sh. Percorra fragmentos/*.frag em ordem de nome. Para cada arquivo com conteúdo, acrescente sua mensagem a memoria.txt e seu caminho relativo a relatorio.txt. A cada execução, recrie as duas saídas.',
    goals: [
      'Salvar e executar recuperar.sh',
      'Recuperar mensagens e caminhos válidos',
      'Passar a verificação com novos fragmentos',
    ],
    hints: [
      'Você já sabe testar um arquivo. Use um for para repetir esse teste para cada caminho.',
      'Antes do laço, use > memoria.txt e > relatorio.txt para começar com arquivos vazios.',
      'Dentro do if, use cat "$arquivo" >> memoria.txt e echo "$arquivo" >> relatorio.txt.',
    ],
    lore: 'Uma placa no núcleo diz: “Como tudo na vida, nada passa sem deixar rastros”.',
    restored:
      'A ARK se lembra novamente. As mensagens da tripulação estão no arquivo central.',
    tools: ['for', '*'],
  },
]
export const manual: Record<string, [string, string]> = {
  pwd: ['Mostra o caminho da pasta em que você está.', 'pwd'],
  ls: ['Lista os nomes dentro de uma pasta.', 'ls'],
  cat: ['Lê um arquivo e mostra seu conteúdo.', 'cat mensagem.txt'],
  cd: [
    'Muda a pasta de trabalho. Um caminho iniciado por / começa na raiz.',
    'cd circuitos',
  ],
  '..': ['Representa a pasta acima da atual.', 'cd ..'],
  mkdir: ['Cria uma pasta.', 'mkdir resgate'],
  cp: ['Copia um arquivo e preserva o original.', 'cp equipe/iara.txt resgate'],
  mv: ['Move ou renomeia um arquivo.', 'mv achados/rota.txt navegacao'],
  grep: [
    'Mostra as linhas que contêm o padrão procurado.',
    'grep SOS sinais.log',
  ],
  '>': [
    'Cria ou substitui o conteúdo do arquivo com a saída.',
    'echo sinal > registro.txt',
  ],
  echo: ['Escreve uma linha de texto.', 'echo recebido'],
  '>>': [
    'Acrescenta a saída ao fim do arquivo.',
    'echo recebido >> contato.txt',
  ],
  bash: [
    'Executa as linhas de um arquivo de script em sequência.',
    'bash rotina.sh',
  ],
  variáveis: [
    'Guarde um valor sem espaços em torno do =. Use aspas ao ler a variável para preservar nomes com espaços.',
    'fonte="meu registro.txt"\ncat "$fonte"',
  ],
  if: [
    'Escolhe qual bloco executar conforme o resultado do teste.',
    'if [ -s "sinal.txt" ]; then\n  echo ativo\nelse\n  echo silêncio\nfi',
  ],
  '-s': [
    'O teste tem sucesso quando o arquivo contém pelo menos um byte. Separe os colchetes com espaços.',
    '[ -s "sinal.txt" ]',
  ],
  for: [
    'Repete o bloco entre do e done para cada caminho encontrado.',
    'for arquivo in sinais/*.txt; do\n  cat "$arquivo"\ndone',
  ],
  '*': [
    'Em um caminho sem aspas, combina nomes que seguem um padrão.',
    'ls fragmentos\ncat fragmentos/*.frag',
  ],
}
const home = (n: number) => '/ark/' + chapters[n].dir
export const scriptName = (n: number) =>
  ['rotina.sh', 'triagem.sh', 'recuperar.sh'][n - 4] || 'notas.sh'
export function initialDisk(): Disk {
  const disk: Disk = { '/': null, '/ark': null }
  for (const c of chapters) disk['/ark/' + c.dir] = null
  function add(n: number, entries: Disk) {
    for (const [p, v] of Object.entries(entries)) disk[home(n) + '/' + p] = v
  }
  add(0, {
    'mensagem.txt':
      'Operador, a ARK ainda respira. A trava responde à leitura deste registro. Procure o circuito C07 no setor de energia. — Iara\n',
    'turno.log': '03:17 · queda de energia na eclusa.\n',
  })
  add(1, {
    circuitos: null,
    'circuitos/c07.log':
      'C07 → relé ÂMBAR. Acione a chave âmbar na máquina de distribuição.\n',
    'circuitos/c03.log': 'C03 → relé AZUL. Alimenta a bomba auxiliar.\n',
  })
  add(2, {
    equipe: null,
    'equipe/iara.txt': 'Iara – comunicações\n',
    'equipe/noah.txt': 'Noah – engenharia\n',
    achados: null,
    'achados/rota.txt': 'Rota 04: central de rádio\n',
    navegacao: null,
  })
  add(3, {
    'sinais.log': 'ruído 21:13\nSOS oficina canal 7\nportadora perdida\n',
  })
  add(4, { 'turno.txt': 'Turno de Iara: antena estável.\n' })
  add(5, { 'amostra.frag': 'um pulso\n' })
  Object.assign(disk, trainingFiles)
  add(6, {
    fragmentos: null,
    'fragmentos/01.frag': 'Iara: ainda ouço a estação.\n',
    'fragmentos/02.frag': '',
    'fragmentos/03 retorno.frag': 'Noah: encontramos o caminho de volta.\n',
  })
  return disk
}
const trainingFiles: Disk = {
  '/ark/arquivo/enfermaria': null,
  '/ark/radio/remessas': null,
  '/ark/radio/remessas/antena.log':
    'ruído noturno\nSINAL OK — alcance restabelecido\nescuta encerrada\n',
  '/ark/oficina/turno noturno.txt': 'Turno de Noah: válvulas inspecionadas.\n',
  '/ark/triagem/reserva.frag': '',
}

// Files for the extended campaign are injected once into existing saves.
export function updateTraining(s: Save) {
  if (s.trainingVersion === 1) return
  for (const [name, content] of Object.entries(trainingFiles)) {
    if (!Object.hasOwn(s.disk, name)) s.disk[name] = content
  }
  s.trainingVersion = 1
}

export interface Save extends Session {
  version: 1
  trainingVersion?: 1
  story?: Story
  completed: number
  room: number
  x: number
  y: number
  seen: string[]
  notes: string[]
  hints: number[]
  drafts: Record<string, { name: string; body: string }>
  sound: boolean
  screen: 'world' | 'terminal' | 'editor'
  log: string[]
  endsSeen: boolean
}
export function fresh(): Save {
  return {
    version: 1,
    trainingVersion: 1,
    disk: initialDisk(),
    cwd: home(0),
    vars: {},
    completed: 0,
    room: 0,
    x: 250,
    y: 156,
    seen: [],
    notes: [],
    hints: chapters.map(() => 0),
    drafts: {},
    sound: false,
    screen: 'world',
    log: [],
    endsSeen: false,
  }
}
export function mark(s: Save, key: string) {
  if (!s.seen.includes(key)) s.seen.push(key)
}
export function record(s: Save, r: Result) {
  if (s.room !== s.completed) return
  const n = s.room,
    h = home(n)
  for (const t of r.trace) {
    const resolved = t.args.map((a) => path(t.cwd, a))
    if (t.cmd === 'pwd' && t.cwd === h) mark(s, 'located')
    if (t.cmd === 'ls' && path(t.cwd, t.args[0] || '.') === h) mark(s, 'listed')
    if (
      t.cmd === 'cat' &&
      resolved.includes(home(0) + '/mensagem.txt') &&
      r.out.includes('ARK ainda respira')
    )
      mark(s, 'message')
    if (
      t.cmd === 'cat' &&
      resolved.includes(home(1) + '/circuitos/c07.log') &&
      r.out.includes('ÂMBAR')
    )
      mark(s, 'circuit')
    if (
      t.cmd === 'grep' &&
      resolved.includes(home(3) + '/sinais.log') &&
      (r.out.includes('SOS oficina') ||
        String(s.disk[home(3) + '/contato.txt']).includes('SOS oficina'))
    )
      mark(s, 'signal')
    if (t.cmd === 'cat' && !r.error) {
      if (n === 5) {
        for (const sample of ['amostra.frag', 'reserva.frag'])
          if (resolved.includes(h + '/' + sample))
            mark(s, 'inspected:' + sample)
      }
      if (
        n === 6 &&
        r.out &&
        resolved.filter(
          (file) =>
            file.startsWith(h + '/fragmentos/') && file.endsWith('.frag'),
        ).length >= 2
      )
        mark(s, 'compared-fragments')
    }
    if (t.cmd === 'bash' && resolved[0] === h + '/' + scriptName(n) && !r.error)
      mark(s, 'ran' + n)
  }
}
function scriptTrial(s: Save, n: number, variant: number): boolean {
  const h = home(n),
    filename = h + '/' + scriptName(n),
    src = s.disk[filename]
  if (typeof src !== 'string') return false
  const disk = initialDisk()
  disk[filename] = src
  const env: Session = { cwd: h, disk, vars: {} }
  if (n === 4) disk[h + '/turno.txt'] = 'Novo turno de validação.\n'
  if (n === 5) disk[h + '/amostra.frag'] = variant ? '' : 'Pulso de teste.\n'
  if (n === 6) {
    for (const k of Object.keys(disk))
      if (k.startsWith(h + '/fragmentos/')) delete disk[k]
    for (const [k, v] of Object.entries({
      'a zero.frag': '',
      'b.frag': 'Retorno do teste.\n',
      'c eco.frag': 'Outro eco.\n',
      'ignorar.log': 'ruído\n',
    }))
      disk[h + '/fragmentos/' + k] = v
  }
  for (let i = 0; i < 2; i++) {
    const r = run(env, 'bash ' + scriptName(n))
    if (r.error) return false
    if (
      n === 4 &&
      disk[h + '/boletim.txt'] !== disk[h + '/turno.txt'] + 'pronto\n'
    )
      return false
    if (
      n === 5 &&
      disk[h + '/estado.txt'] !== (variant ? 'vazio\n' : 'legível\n')
    )
      return false
    if (n === 6 && !recovered(disk)) return false
  }
  return true
}
function recovered(d: Disk) {
  const h = home(6),
    prefix = h + '/fragmentos/'
  const files = Object.keys(d)
    .filter(
      (k) =>
        k.startsWith(prefix) &&
        k.endsWith('.frag') &&
        typeof d[k] === 'string' &&
        d[k],
    )
    .sort()
  return (
    files.length > 0 &&
    d[h + '/memoria.txt'] === files.map((k) => d[k]).join('') &&
    d[h + '/relatorio.txt'] ===
      files.map((k) => k.slice(h.length + 1) + '\n').join('')
  )
}
const radioSignal = 'SOS oficina canal 7'
const capture = 'grep SOS sinais.log > contato.txt'
const acknowledge = 'echo recebido >> contato.txt'

function radioLines(s: Save): string[] {
  const contact = s.disk[home(3) + '/contato.txt']
  return typeof contact === 'string' && contact.trim()
    ? contact
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
    : []
}

export function radioTip(s: Save): string {
  if (s.cwd !== home(3)) return 'Volte à pasta da missão com cd /ark/radio.'
  const lines = radioLines(s)
  if (lines.length === 1 && lines[0] === radioSignal)
    return (
      'O SOS já está na primeira linha de contato.txt. Para acrescentar a segunda, digite: ' +
      acknowledge
    )
  if (
    !String(s.disk[home(3) + '/sinais.log'] ?? '')
      .split('\n')
      .includes(radioSignal)
  )
    return 'O registro sinais.log perdeu a transmissão original. Em Controles do jogo, “Restaurar arquivos deste setor” recupera o registro.'
  if (!lines.length)
    return 'Para salvar a linha que o grep encontra, digite: ' + capture
  let detail = 'Confira as linhas atuais com cat contato.txt.'
  if (lines[0] === 'recebido') {
    detail =
      'contato.txt começa com recebido. Um único > substitui o conteúdo anterior.'
  } else if (lines[0] === radioSignal && lines[1] !== 'recebido') {
    detail =
      'A segunda linha contém “' +
      lines[1].slice(0, 50) +
      '”. Ela deve conter “recebido”, com d.'
  } else if (lines[0] === radioSignal) {
    detail = 'contato.txt tem linhas extras após a confirmação.'
  }
  return (
    detail +
    ' Regrave a primeira linha com ' +
    capture +
    ' e depois use ' +
    acknowledge +
    '.'
  )
}

export function goals(s: Save, n: number): boolean[] {
  if (n < s.completed || n >= 7) return [true, true, true]
  const has = (v: string) => s.seen.includes(v),
    h = home(n),
    d = s.disk,
    get = (f: string) => d[h + '/' + f]
  switch (n) {
    case 0:
      return [has('terminal0'), has('located') && has('listed'), has('message')]
    case 1:
      return [has('label'), has('circuit'), has('relay')]
    case 2:
      return [
        get('resgate') === null,
        ['iara', 'noah'].every(
          (x) =>
            get('resgate/' + x + '.txt') === initialCrew[x] &&
            get('equipe/' + x + '.txt') === initialCrew[x],
        ),
        get('navegacao/rota.txt') === 'Rota 04: central de rádio\n' &&
          get('achados/rota.txt') === undefined,
      ]
    case 3: {
      const lines = radioLines(s)
      const captured = lines[0] === radioSignal
      return [
        has('signal') || captured,
        captured,
        captured && lines.length === 2 && lines[1] === 'recebido',
      ]
    }
    case 4:
      return [
        typeof get(scriptName(n)) === 'string',
        has('ran4'),
        has('ran4') &&
          get('boletim.txt') === get('turno.txt') + 'pronto\n' &&
          scriptTrial(s, 4, 0),
      ]
    case 5:
      return [
        typeof get(scriptName(n)) === 'string',
        has('ran5'),
        has('ran5') &&
          get('estado.txt') ===
            (get('amostra.frag') ? 'legível\n' : 'vazio\n') &&
          scriptTrial(s, 5, 0) &&
          scriptTrial(s, 5, 1),
      ]
    default:
      return [
        has('ran6'),
        recovered(d),
        has('ran6') && recovered(d) && scriptTrial(s, 6, 0),
      ]
  }
}
interface Practice {
  id: string
  title: string
  voice: string
  brief: string
  hints: string[]
  check: (s: Save) => boolean
}

const practices: Partial<Record<number, Practice[]>> = {
  2: [
    {
      id: 'entrega',
      title: 'Cópia para a enfermaria',
      voice: 'Noah',
      brief:
        'O arquivo principal está organizado. A enfermaria também precisa da ficha de Iara. Mande uma cópia para a pasta enfermaria com o nome iara.txt e deixe a ficha original na equipe. O destino pode incluir o nome do arquivo, além da pasta.',
      hints: [
        'Você acabou de usar cp para manter o original. Agora o destino é outra pasta.',
        'Use cp equipe/iara.txt enfermaria/iara.txt.',
      ],
      check: (s) =>
        s.disk['/ark/arquivo/enfermaria/iara.txt'] === initialCrew.iara &&
        s.disk['/ark/arquivo/equipe/iara.txt'] === initialCrew.iara,
    },
  ],
  3: [
    {
      id: 'alcance',
      title: 'Teste de alcance',
      voice: 'Lara',
      brief:
        'Recebi sua confirmação. A antena respondeu de novo e guardou a prova na pasta remessas. Separe a linha que começa com SINAL OK. Crie a pasta escuta e deixe essa linha em escuta/transmissao.txt, seguida de inspecionado na segunda linha.',
      hints: [
        'Liste remessas para descobrir o nome do registro. Você já sabe criar a pasta de destino e gravar uma única linha.',
        'Use mkdir escuta. Depois, grep "SINAL OK" remessas/antena.log > escuta/transmissao.txt e echo inspecionado >> escuta/transmissao.txt.',
      ],
      check: (s) =>
        s.disk['/ark/radio/escuta/transmissao.txt'] ===
        'SINAL OK — alcance restabelecido\ninspecionado\n',
    },
  ],
  4: [
    {
      id: 'previa',
      title: 'Um boletim à mão',
      voice: 'Noah',
      brief:
        'A cada troca de turno, passo o relato para um boletim e marco que está pronto. Faça a primeira prévia aqui no terminal. Em previa.txt, grave todo o conteúdo de turno.txt e acrescente pronto em outra linha.',
      hints: [
        'No rádio você gravou só uma linha com grep. Aqui você quer o arquivo inteiro, então use cat. O > e o >> funcionam da mesma forma.',
        'Use cat turno.txt > previa.txt e depois echo pronto >> previa.txt. Confira com cat previa.txt.',
      ],
      check: (s) =>
        s.disk['/ark/oficina/previa.txt'] ===
        'Turno de Iara: antena estável.\npronto\n',
    },
    {
      id: 'noturno',
      title: 'Troca de turno',
      voice: 'Noah',
      brief:
        'Agora chegou o relato da noite. Prepare previa-noturna.txt com o conteúdo de turno noturno.txt e a mesma confirmação na última linha. Ponha o nome da fonte entre aspas para o terminal ler o espaço como parte do nome.',
      hints: [
        'Teste cat "turno noturno.txt" para ler o novo relato. O procedimento para gravar o boletim continua igual.',
        'Use cat "turno noturno.txt" > previa-noturna.txt e acrescente pronto com >>.',
      ],
      check: (s) =>
        s.disk['/ark/oficina/previa-noturna.txt'] ===
        trainingFiles['/ark/oficina/turno noturno.txt'] + 'pronto\n',
    },
  ],
  5: [
    {
      id: 'amostras',
      title: 'Duas cápsulas',
      voice: 'Lara',
      brief:
        'O sensor entregou dois arquivos, amostra.frag e reserva.frag. Leia os dois com cat. A reserva pode não mostrar nada: quando o arquivo está vazio, cat termina sem imprimir texto. A triagem vai precisar reconhecer as duas situações.',
      hints: [
        'Leia cada arquivo separadamente para ver de onde veio o pulso.',
        'Use cat amostra.frag e depois cat reserva.frag.',
      ],
      check: (s) =>
        s.seen.includes('inspected:amostra.frag') &&
        s.seen.includes('inspected:reserva.frag'),
    },
  ],
  6: [
    {
      id: 'fragmentos',
      title: 'Padrão de memória',
      voice: 'Lara',
      brief:
        'No núcleo, os arquivos cresceram em número. Liste fragmentos e leia os arquivos .frag juntos. O asterisco representa qualquer sequência de caracteres. O terminal expande *.frag em vários caminhos de uma vez, inclusive nomes com espaço.',
      hints: [
        'Combine o caminho da pasta com um curinga a partir da raiz do setor.',
        'Use ls fragmentos e depois cat fragmentos/*.frag.',
      ],
      check: (s) => s.seen.includes('compared-fragments'),
    },
  ],
}

const practiceKey = (step: Practice) => 'practice:' + step.id

export function activePractice(s: Save, n = s.completed) {
  if (n !== s.completed) return
  if ((n === 2 || n === 3) && !goals(s, n).every(Boolean)) return
  return practices[n]?.find((step) => !s.seen.includes(practiceKey(step)))
}

export function advancePractice(s: Save) {
  if (s.room !== s.completed) return
  const step = activePractice(s)
  if (step?.check(s)) {
    mark(s, practiceKey(step))
    return step.title
  }
}

export function editorAvailable(s: Save) {
  return s.room >= 4 && s.room <= s.completed && !activePractice(s, s.room)
}

const initialCrew: Record<string, string> = {
  iara: 'Iara – comunicações\n',
  noah: 'Noah – engenharia\n',
}
export function finish(s: Save) {
  if (
    s.completed < 7 &&
    s.room === s.completed &&
    !activePractice(s) &&
    (s.room !== 0 || !s.story || s.story.step === 'done') &&
    goals(s, s.completed).every(Boolean)
  ) {
    s.completed++
    return true
  }
  return false
}
export function enter(s: Save, n: number) {
  s.room = n
  s.x = n === -1 ? 244 : 382
  s.y = n === -1 ? 180 : 151
  s.screen = 'world'
  if (n >= 0) {
    s.cwd = home(n)
    s.log = []
  }
}

export function restoreRoom(s: Save) {
  const n = s.room
  if (n < 0 || n !== s.completed || n >= 7) return
  const root = home(n) + '/',
    original = initialDisk()
  for (const k of Object.keys(s.disk)) if (k.startsWith(root)) delete s.disk[k]
  for (const [k, v] of Object.entries(original))
    if (k.startsWith(root)) s.disk[k] = v
  const flags = [
    ['terminal0', 'located', 'listed', 'message'],
    ['label', 'circuit', 'relay'],
    [],
    ['signal'],
    ['ran4'],
    ['ran5', 'inspected:amostra.frag', 'inspected:reserva.frag'],
    ['ran6', 'compared-fragments'],
  ][n]
  const cleared = [...flags, ...(practices[n] ?? []).map(practiceKey)]
  s.seen = s.seen.filter((k) => !cleared.includes(k))
  delete s.drafts[n]
  s.cwd = home(n)
  s.vars = {}
  s.log = []
  s.screen = 'world'
}
