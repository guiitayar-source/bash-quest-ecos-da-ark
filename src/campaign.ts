import { playerDifficulty, type Difficulty, type Story } from './story'
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
    lore: 'O eletricista riscou o rótulo antigo do painel e cobriu a placa com verniz.',
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
    room: 'Depósito de suprimentos',
    short: 'Depósito',
    dir: 'deposito',
    title: 'Inventário em lote',
    desc: 'A partir de /ark/deposito, crie a pasta ativos, copie todos os .txt de caixas para lá, remova os .tmp corrompidos de caixas e reúna ativos/bateria-*.txt em /ark/deposito/baterias.txt.',
    goals: [
      'Criar ativos e copiar caixas/*.txt',
      'Remover caixas/*.tmp sem apagar os .txt',
      'Reunir ativos/bateria-*.txt em /ark/deposito/baterias.txt',
    ],
    hints: [
      'Volte à raiz do setor com cd /ark/deposito se tiver entrado em alguma subpasta. Crie ativos com mkdir ativos e copie os .txt com cp caixas/*.txt ativos.',
      'Remova apenas os temporários corrompidos com rm caixas/*.tmp. Confira com ls caixas.',
      'Na pasta /ark/deposito, junte as fichas de bateria usando cat ativos/bateria-*.txt > baterias.txt.',
    ],
    lore: 'As prateleiras guardam pilhas secas e filtros selados. Alguém marcou cada lote com giz branco.',
    restored:
      'O inventário foi limpo e catalogado. Os módulos de telemetria receberam energia reserva.',
    tools: ['*', 'rm'],
  },
  {
    room: 'Sala de telemetria',
    short: 'Telemetria',
    dir: 'telemetria',
    title: 'Fluxo de sensores',
    desc: 'Use pipes (|) sobre sensores.log: grave os alertas ordenados em alertas.txt, os 2 primeiros em prioridade.txt e o total de alertas em contagem.txt.',
    goals: [
      'Filtrar e ordenar ALERTA em alertas.txt',
      'Separar os 2 primeiros em prioridade.txt',
      'Gravar o total de alertas em contagem.txt',
    ],
    hints: [
      'Conecte grep e sort com o pipe: grep ALERTA sensores.log | sort > alertas.txt.',
      'Extraia as 2 primeiras linhas ordenadas com head -n 2 alertas.txt > prioridade.txt.',
      'Conte apenas o número de linhas enviando pelo pipe: cat alertas.txt | wc -l > contagem.txt.',
    ],
    lore: 'Os gráficos antigos mostram três semanas seguidas de vento forte sobre as torres externas.',
    restored:
      'O fluxo dos sensores estabilizou. Os alertas apontaram falhas na galeria de dutos.',
    tools: ['|', 'sort', 'wc', 'head', 'tail'],
  },
  {
    room: 'Galeria de dutos',
    short: 'Dutos',
    dir: 'dutos',
    title: 'Mapa das profundezas',
    desc: 'Mapeie todos os arquivos *.val dentro de setores ordenados em mapa.txt, extraia os códigos únicos de FALHA de historico.log em falhas.txt e copie setores/subsolo/v04.val para uma nova pasta inspecao.',
    goals: [
      'Mapear setores/*.val ordenados em mapa.txt',
      'Gravar falhas únicas em falhas.txt',
      'Copiar v04.val do subsolo para inspecao',
    ],
    hints: [
      'Busque em todas as subpastas e ordene: find setores -name "*.val" | sort > mapa.txt.',
      'Filtre FALHA, ordene e elimine repetições: grep FALHA historico.log | sort | uniq > falhas.txt.',
      'Crie a pasta com mkdir inspecao e copie o arquivo encontrado com cp setores/subsolo/v04.val inspecao.',
    ],
    lore: 'O ar circula mais frio perto do subsolo. Cada válvula traz gravado o nome do ramal que alimenta.',
    restored:
      'Os dutos foram mapeados e as válvulas isoladas. A passagem para a oficina de manutenção está livre.',
    tools: ['find', 'uniq'],
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
      'O boletim entrou na fila automática. A estação de controle aceitou sua chave.',
    tools: ['bash', 'variáveis'],
  },
  {
    room: 'Estação de controle',
    short: 'Controle',
    dir: 'controle',
    title: 'Ferramenta reutilizável',
    desc: 'Escreva resumo.sh usando o parâmetro "$1": filtre linhas EVENTO ordenadas em resumo.txt e acrescente o total de eventos ao fim. Dê permissão com chmod +x resumo.sh e execute ./resumo.sh diurno.log.',
    goals: [
      'Salvar resumo.sh e aplicar chmod +x',
      'Executar ./resumo.sh diurno.log',
      'Passar a validação com outro arquivo',
    ],
    hints: [
      'Dentro do script, "$1" representa o arquivo passado na chamada: grep EVENTO "$1" | sort > resumo.txt.',
      'Acrescente a contagem de linhas na última linha com grep EVENTO "$1" | wc -l >> resumo.txt.',
      'Salve resumo.sh, volte ao terminal, digite chmod +x resumo.sh e depois ./resumo.sh diurno.log.',
    ],
    lore: 'Um quadro de acrílico lista os comandos do turno. Noah anotou à margem: “um script bom serve para qualquer arquivo”.',
    restored:
      'O utilitário de resumo foi instalado no painel central. O laboratório de triagem está liberado.',
    tools: ['chmod', './', '$1'],
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
      'A triagem separou os sinais do silêncio. A câmara de quarentena destravou a comporta.',
    tools: ['if', '-s'],
  },
  {
    room: 'Câmara de quarentena',
    short: 'Quarentena',
    dir: 'quarentena',
    title: 'Protocolo de segurança',
    desc: 'Escreva validar.sh para classificar o caminho passado em "$1" e gravar em diagnostico.txt: “pasta” (-d), “valido” (-s), “vazio” (-f) ou “ausente”.',
    goals: [
      'Salvar validar.sh',
      'Executar validar.sh com um caminho',
      'Classificar os 4 casos na validação',
    ],
    hints: [
      'Use if [ -d "$1" ]; then ... elif [ -s "$1" ]; then ... elif [ -f "$1" ]; then ... else ... fi.',
      'A ordem importa: teste -s antes de -f, pois todo arquivo com conteúdo também passa em -f.',
      'Grave sempre com > diagnostico.txt (pasta, valido, vazio, ausente) e rode bash validar.sh lote/eco.frag.',
    ],
    lore: 'Nenhuma amostra entra no núcleo sem passar pelo filtro de quarentena. Pastas, arquivos vazios e caminhos quebrados têm destinos distintos.',
    restored:
      'O protocolo de quarentena foi aprovado. A comporta do Núcleo de memória finalmente se abriu.',
    tools: ['-f', '-d', 'elif'],
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
      'Você já domina *, if [ -s ] e variáveis. Use for arquivo in fragmentos/*.frag; do ... done para percorrer todos.',
      'Antes do laço, use > memoria.txt e > relatorio.txt para começar com arquivos vazios.',
      'Dentro do if, use cat "$arquivo" >> memoria.txt e echo "$arquivo" >> relatorio.txt.',
    ],
    lore: 'Uma placa no núcleo diz: “Como tudo na vida, nada passa sem deixar rastros”.',
    restored:
      'A ARK se lembra novamente. As mensagens da tripulação estão no arquivo central.',
    tools: ['for'],
  },
]

export const TOTAL_CHAPTERS = chapters.length
export const FINAL_CHAPTER = chapters.length - 1
export const isScriptChapter = (n: number) => n >= 7 && n < chapters.length

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
  '*': [
    'Em um caminho sem aspas, combina nomes que seguem um padrão.',
    'ls caixas/*.txt\ncat ativos/bateria-*.txt',
  ],
  rm: ['Remove arquivos permanentemente da pasta.', 'rm caixas/*.tmp'],
  '|': [
    'Liga a saída de um comando à entrada do comando seguinte.',
    'grep ALERTA sensores.log | sort',
  ],
  sort: ['Ordena linhas de texto em ordem alfabética.', 'sort alertas.txt'],
  wc: [
    'Conta linhas (-l), palavras (-w) ou bytes (-c) da entrada.',
    'cat alertas.txt | wc -l',
  ],
  head: [
    'Mostra as primeiras linhas de um arquivo ou pipe.',
    'head -n 2 alertas.txt',
  ],
  tail: [
    'Mostra as últimas linhas de um arquivo ou pipe.',
    'tail -n 2 sensores.log',
  ],
  find: [
    'Procura arquivos e pastas em todos os níveis abaixo de um caminho.',
    'find setores -name "*.val"',
  ],
  uniq: [
    'Remove linhas repetidas consecutivas (use após sort).',
    'sort historico.log | uniq',
  ],
  bash: [
    'Executa as linhas de um arquivo de script em sequência.',
    'bash rotina.sh',
  ],
  variáveis: [
    'Guarde um valor sem espaços em torno do =. Use aspas ao ler a variável para preservar nomes com espaços.',
    'fonte="meu registro.txt"\ncat "$fonte"',
  ],
  chmod: [
    'Altera a permissão de execução (+x ou -x) de um script.',
    'chmod +x resumo.sh',
  ],
  './': [
    'Executa diretamente um script executável na pasta atual.',
    './resumo.sh diurno.log',
  ],
  $1: [
    'Representa o primeiro argumento passado ao executar um script. Sempre use aspas: "$1".',
    'grep EVENTO "$1" | sort',
  ],
  if: [
    'Escolhe qual bloco executar conforme o resultado do teste.',
    'if [ -s "sinal.txt" ]; then\n  echo ativo\nelse\n  echo silêncio\nfi',
  ],
  '-s': [
    'O teste tem sucesso quando o arquivo contém pelo menos um byte. Separe os colchetes com espaços.',
    '[ -s "sinal.txt" ]',
  ],
  '-f': [
    'Verdadeiro quando o caminho é um arquivo comum (mesmo vazio).',
    '[ -f "$1" ]',
  ],
  '-d': ['Verdadeiro quando o caminho é uma pasta existente.', '[ -d "$1" ]'],
  elif: [
    'Adiciona uma nova condição ao bloco if quando o teste anterior falha.',
    'if [ -d "$1" ]; then\n  echo pasta\nelif [ -f "$1" ]; then\n  echo arquivo\nfi',
  ],
  for: [
    'Repete o bloco entre do e done para cada caminho encontrado.',
    'for arquivo in sinais/*.txt; do\n  cat "$arquivo"\ndone',
  ],
}

const home = (n: number) => '/ark/' + chapters[n].dir

export const scriptName = (n: number) =>
  ({
    7: 'rotina.sh',
    8: 'resumo.sh',
    9: 'triagem.sh',
    10: 'validar.sh',
    11: 'recuperar.sh',
  })[n] || 'notas.sh'

export function defaultRunCommand(s: Save, n: number, fileName: string): string {
  const quoted = fileName.includes(' ') ? '"' + fileName + '"' : fileName
  if (n === 8) {
    const abs = path(s.cwd, fileName)
    const runner = s.execs?.includes(abs) ? './' + quoted : 'bash ' + quoted
    return runner + ' diurno.log'
  }
  if (n === 10) return 'bash ' + quoted + ' lote/eco.frag'
  return 'bash ' + quoted
}

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
  add(4, {
    caixas: null,
    'caixas/bateria-a.txt': 'BATERIA A: carga 82%\n',
    'caixas/bateria-b.txt': 'BATERIA B: carga 64%\n',
    'caixas/filtro-01.txt': 'FILTRO 01: selo íntegro\n',
    'caixas/ruido-1.tmp': 'dados corrompidos\n',
    'caixas/ruido-2.tmp': 'dados corrompidos\n',
  })
  add(5, {
    'sensores.log':
      'OK 02 filtro nominal\nALERTA 04 pressão baixa\nOK 01 antena ativa\nALERTA 01 poeira densa\nALERTA 03 bateria fraca\nOK 03 vedação firme\nALERTA 02 vazamento sul\nOK 04 painel estável\n',
  })
  add(6, {
    setores: null,
    'setores/norte': null,
    'setores/norte/v01.val': 'FALHA-B\nOK\n',
    'setores/norte/ramal': null,
    'setores/norte/ramal/v02.val': 'FALHA-A\nFALHA-B\n',
    'setores/sul': null,
    'setores/sul/v03.val': 'OK\n',
    'setores/subsolo': null,
    'setores/subsolo/v04.val': 'FALHA-A\nFALHA-C\n',
    'setores/subsolo/nota.txt': 'manutenção pendente\n',
    'historico.log':
      'OK 10:00\nFALHA-B\nFALHA-A\nOK 10:15\nFALHA-B\nFALHA-C\nFALHA-A\n',
  })
  add(7, { 'turno.txt': 'Turno de Iara: antena estável.\n' })
  add(8, {
    'diurno.log':
      'ruído 08:00\nEVENTO painel estável\nEVENTO bomba ligada\nruído 11:20\n',
    'noturno.log': 'EVENTO gerador ativo\nruído 02:10\n',
  })
  add(9, { 'amostra.frag': 'um pulso\n' })
  add(10, {
    lote: null,
    'lote/eco.frag': 'Pulso confirmado.\n',
    'vazio.frag': '',
  })
  add(11, {
    fragmentos: null,
    'fragmentos/01.frag': 'Iara: ainda ouço a estação.\n',
    'fragmentos/02.frag': '',
    'fragmentos/03 retorno.frag': 'Noah: encontramos o caminho de volta.\n',
  })
  Object.assign(disk, trainingFiles)
  return disk
}

const trainingFiles: Disk = {
  '/ark/arquivo/enfermaria': null,
  '/ark/radio/remessas': null,
  '/ark/radio/remessas/antena.log':
    'ruído noturno\nSINAL OK — alcance restabelecido\nescuta encerrada\n',
  '/ark/deposito/descarte': null,
  '/ark/deposito/descarte/rascunho.tmp': 'lixo de teste\n',
  '/ark/oficina/turno noturno.txt': 'Turno de Noah: válvulas inspecionadas.\n',
  '/ark/controle/teste.sh': 'echo "Recebido: $1"\n',
  '/ark/triagem/reserva.frag': '',
}

// Files for the extended 12-sector campaign are injected once into existing saves.
export function updateTraining(s: Save) {
  s.execs ??= []
  while (s.hints.length < chapters.length) s.hints.push(0)
  if (s.trainingVersion === 2) return
  const baseDisk = initialDisk()
  for (const [name, content] of Object.entries(baseDisk)) {
    const isNewSector = [
      '/ark/deposito',
      '/ark/telemetria',
      '/ark/dutos',
      '/ark/controle',
      '/ark/quarentena',
    ].some((prefix) => name === prefix || name.startsWith(prefix + '/'))
    if ((isNewSector || Object.hasOwn(trainingFiles, name)) && !Object.hasOwn(s.disk, name)) {
      s.disk[name] = content
    }
  }
  s.trainingVersion = 2
}

export interface Save extends Session {
  version: 1
  trainingVersion?: 1 | 2
  library: string[]
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
    trainingVersion: 2,
    library: [],
    disk: initialDisk(),
    cwd: home(0),
    vars: {},
    execs: [],
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
    if (
      n === 4 &&
      !r.error &&
      (t.cmd === 'cat' || t.cmd === 'ls') &&
      resolved.filter(
        (file) =>
          file.startsWith(h + '/caixas/') && file.endsWith('.txt'),
      ).length >= 3
    ) {
      mark(s, 'glob-caixas')
    }
    if (
      n === 5 &&
      !r.error &&
      t.cmd === 'tail' &&
      resolved.includes(h + '/sensores.log')
    ) {
      mark(s, 'checked-tail')
    }
    if (
      n === 6 &&
      !r.error &&
      t.cmd === 'find' &&
      r.out.includes('setores/subsolo/v04.val')
    ) {
      mark(s, 'found-vals')
    }
    if (n === 7 && !r.error) {
      if (
        typeof s.disk[h + '/rascunho.txt'] === 'string' &&
        (s.disk[h + '/rascunho.txt'] as string).length > 0
      )
        mark(s, 'wrote-rascunho')
      if (
        s.vars.fonte === 'turno noturno.txt' &&
        t.cmd === 'cat' &&
        resolved.includes(h + '/turno noturno.txt')
      )
        mark(s, 'practiced-var')
    }
    if (
      n === 8 &&
      !r.error &&
      t.cmd.includes('/') &&
      path(t.cwd, t.cmd) === h + '/teste.sh' &&
      r.out.includes('Recebido:')
    ) {
      mark(s, 'ran-teste-exec')
    }
    if (n === 9 && t.cmd === 'cat' && !r.error) {
      for (const sample of ['amostra.frag', 'reserva.frag'])
        if (resolved.includes(h + '/' + sample)) mark(s, 'inspected:' + sample)
    }
    if ((n === 9 || n === 10) && (t.cmd === '[' || t.cmd === 'test')) {
      const args = [...t.args]
      if (t.cmd !== '[' || args.pop() === ']') {
        if (args.length === 2) {
          const target = path(t.cwd, args[1])
          if (n === 9 && args[0] === '-s') {
            for (const sample of ['amostra.frag', 'reserva.frag'])
              if (target === h + '/' + sample) mark(s, 'tested:' + sample)
          }
          if (n === 10 && args[0] === '-d' && target === h + '/lote')
            mark(s, 'tested-d:lote')
          if (n === 10 && args[0] === '-f' && target === h + '/vazio.frag')
            mark(s, 'tested-f:vazio.frag')
        }
      }
    }
    if (
      n === 11 &&
      t.cmd === 'cat' &&
      !r.error &&
      r.out &&
      resolved.filter(
        (file) =>
          file.startsWith(h + '/fragmentos/') && file.endsWith('.frag'),
      ).length >= 2
    ) {
      mark(s, 'compared-fragments')
    }
    if (isScriptChapter(n) && !r.error) {
      const targetScript = h + '/' + scriptName(n)
      const ranViaBash = t.cmd === 'bash' && resolved[0] === targetScript
      const ranDirectly = t.cmd.includes('/') && path(t.cwd, t.cmd) === targetScript
      if (ranViaBash || ranDirectly) {
        if (n === 8) {
          if (ranDirectly && t.args.length >= 1) mark(s, 'ran8exec')
        } else if (n === 10) {
          if (
            (ranViaBash && t.args.length >= 2) ||
            (ranDirectly && t.args.length >= 1)
          )
            mark(s, 'ran10')
        } else {
          mark(s, 'ran' + n)
        }
      }
    }
  }
  if (
    n === 5 &&
    !r.error &&
    r.trace.some((t) => t.cmd === 'grep') &&
    r.trace.some((t) => t.cmd === 'wc' && t.args.includes('-l')) &&
    r.out.trim() === '4'
  ) {
    mark(s, 'piped-count')
  }
  if (
    n === 6 &&
    !r.error &&
    r.trace.some((t) => t.cmd === 'sort') &&
    r.trace.some((t) => t.cmd === 'uniq') &&
    r.out === 'FALHA-A\nFALHA-B\nFALHA-C\n'
  ) {
    mark(s, 'piped-uniq')
  }
  if (
    n === 8 &&
    !r.error &&
    r.trace.some((t) => t.cmd === 'grep') &&
    r.trace.some((t) => t.cmd === 'sort') &&
    r.out === 'EVENTO bomba ligada\nEVENTO painel estável\n'
  ) {
    mark(s, 'practiced-events')
  }
  if (
    n === 11 &&
    !r.error &&
    r.trace.filter(
      (t) =>
        t.cmd === 'cat' &&
        t.args.length === 1 &&
        path(t.cwd, t.args[0]).startsWith(h + '/fragmentos/'),
    ).length >= 3 &&
    r.out.includes('Iara: ainda ouço') &&
    r.out.includes('Noah: encontramos')
  ) {
    mark(s, 'practiced-for')
  }
}

function trialEnv(s: Save, n: number, variant: number) {
  const h = home(n),
    filename = h + '/' + scriptName(n),
    src = s.disk[filename]
  if (typeof src !== 'string') return
  const disk = initialDisk()
  disk[filename] = src
  const execs = s.execs?.includes(filename) ? [filename] : []
  const env: Session = { cwd: h, disk, vars: {}, execs }
  if (n === 7) disk[h + '/turno.txt'] = 'Novo turno de validação.\n'
  if (n === 8) {
    disk[h + '/turno extra.log'] =
      'EVENTO sensor beta\nruído 04:00\nEVENTO antena norte\nEVENTO painel central\n'
  }
  if (n === 9) disk[h + '/amostra.frag'] = variant ? '' : 'Pulso de teste.\n'
  if (n === 10) {
    disk[h + '/pasta teste'] = null
    disk[h + '/lote/eco valido.frag'] = 'Pulso de validação.\n'
    disk[h + '/vazio teste.frag'] = ''
  }
  if (n === 11) {
    for (const k of Object.keys(disk))
      if (k.startsWith(h + '/fragmentos/')) delete disk[k]
    const fixtures: Record<string, string> = {
      'a zero.frag': '',
      'b.frag': 'Retorno do teste.\n',
      'c eco.frag': 'Outro eco.\n',
      'ignorar.log': 'ruído\n',
    }
    if (playerDifficulty(s) === 'dev') {
      fixtures['d  duplo.frag'] = 'Espaço duplo.\n'
    }
    for (const [k, v] of Object.entries(fixtures))
      disk[h + '/fragmentos/' + k] = v
  }
  return { h, disk, env }
}

const quarantineCases = [
  { arg: 'pasta teste', expected: 'pasta\n', label: 'uma pasta' },
  { arg: 'lote/eco valido.frag', expected: 'valido\n', label: 'um arquivo com conteúdo' },
  { arg: 'vazio teste.frag', expected: 'vazio\n', label: 'um arquivo vazio' },
  { arg: 'nao existe.frag', expected: 'ausente\n', label: 'um caminho inexistente' },
]

const expectedControlSummary =
  'EVENTO antena norte\nEVENTO painel central\nEVENTO sensor beta\n3\n'

function scriptTrial(s: Save, n: number, variant: number): boolean {
  const setup = trialEnv(s, n, variant)
  if (!setup) return false
  const { h, disk, env } = setup
  for (let i = 0; i < 2; i++) {
    const cmd =
      n === 8
        ? './' + scriptName(8) + ' "turno extra.log"'
        : n === 10
          ? 'bash ' + scriptName(10) + ' "' + quarantineCases[variant].arg + '"'
          : 'bash ' + scriptName(n)
    const r = run(env, cmd)
    if (r.error) return false
    if (
      n === 7 &&
      disk[h + '/boletim.txt'] !== disk[h + '/turno.txt'] + 'pronto\n'
    )
      return false
    if (n === 8 && disk[h + '/resumo.txt'] !== expectedControlSummary)
      return false
    if (
      n === 9 &&
      disk[h + '/estado.txt'] !== (variant ? 'vazio\n' : 'legível\n')
    )
      return false
    if (
      n === 10 &&
      disk[h + '/diagnostico.txt'] !== quarantineCases[variant].expected
    )
      return false
    if (n === 11 && !recovered(disk)) return false
  }
  return true
}

export function diagnoseScript(
  s: Save,
  n: number,
): { ok: boolean; reason?: string } {
  const h = home(n),
    filename = h + '/' + scriptName(n)
  if (typeof s.disk[filename] !== 'string') {
    return {
      ok: false,
      reason: 'Salve primeiro o arquivo ' + scriptName(n) + ' no Editor de script.',
    }
  }
  if (n === 7) {
    const setup = trialEnv(s, 7, 0)!
    const expected = setup.disk[h + '/turno.txt'] + 'pronto\n'
    const r1 = run(setup.env, 'bash ' + scriptName(7))
    if (r1.error) return { ok: false, reason: r1.error }
    const out1 = setup.disk[h + '/boletim.txt']
    if (typeof out1 !== 'string')
      return { ok: false, reason: 'O script não criou boletim.txt.' }
    if (out1 !== expected) {
      if (out1.includes('Turno de Iara'))
        return {
          ok: false,
          reason:
            'boletim.txt usou texto fixo em vez de ler o conteúdo atual de turno.txt.',
        }
      return {
        ok: false,
        reason:
          'boletim.txt deve conter o conteúdo de turno.txt seguido de uma linha com “pronto”.',
      }
    }
    const r2 = run(setup.env, 'bash ' + scriptName(7))
    if (r2.error) return { ok: false, reason: r2.error }
    if (setup.disk[h + '/boletim.txt'] !== expected) {
      return {
        ok: false,
        reason:
          'Na segunda execução, boletim.txt acumulou linhas antigas. Use > (um sinal) na primeira gravação para recriar o arquivo.',
      }
    }
    return { ok: true }
  }
  if (n === 8) {
    if (!s.execs?.includes(filename)) {
      return {
        ok: false,
        reason:
          'Aplique permissão de execução com chmod +x resumo.sh e execute ./resumo.sh diurno.log.',
      }
    }
    const setup = trialEnv(s, 8, 0)!
    const r1 = run(setup.env, './resumo.sh "turno extra.log"')
    if (r1.error) {
      if (r1.error.includes('Arquivo não encontrado')) {
        return {
          ok: false,
          reason:
            'Falha ao ler arquivo com espaço no nome. Use aspas em "$1" dentro do script.',
        }
      }
      return { ok: false, reason: r1.error }
    }
    const out1 = String(setup.disk[h + '/resumo.txt'] ?? '')
    if (!out1)
      return { ok: false, reason: 'O script não gravou nada em resumo.txt.' }
    if (out1.includes('bomba ligada')) {
      return {
        ok: false,
        reason:
          'O script leu diurno.log fixo em vez de usar o parâmetro "$1".',
      }
    }
    if (out1 !== expectedControlSummary) {
      return {
        ok: false,
        reason:
          'resumo.txt deve trazer as linhas EVENTO ordenadas com sort e, na última linha, o total de eventos (wc -l).',
      }
    }
    const r2 = run(setup.env, './resumo.sh "turno extra.log"')
    if (r2.error) return { ok: false, reason: r2.error }
    if (setup.disk[h + '/resumo.txt'] !== expectedControlSummary) {
      return {
        ok: false,
        reason:
          'Na segunda execução, resumo.txt acumulou linhas antigas. Use > na primeira linha e >> apenas para acrescentar a contagem.',
      }
    }
    if (!s.seen.includes('ran8exec')) {
      return {
        ok: false,
        reason:
          'Execute o script diretamente no terminal com ./resumo.sh diurno.log.',
      }
    }
    return { ok: true }
  }
  if (n === 9) {
    for (const variant of [0, 1]) {
      const setup = trialEnv(s, 9, variant)!
      const expected = variant ? 'vazio\n' : 'legível\n'
      const r1 = run(setup.env, 'bash ' + scriptName(9))
      if (r1.error) return { ok: false, reason: r1.error }
      const out1 = setup.disk[h + '/estado.txt']
      if (out1 !== expected) {
        return {
          ok: false,
          reason: variant
            ? 'Quando amostra.frag está vazio, estado.txt deve receber exatamente “vazio”.'
            : 'Quando amostra.frag tem conteúdo, estado.txt deve receber exatamente “legível”.',
        }
      }
      const r2 = run(setup.env, 'bash ' + scriptName(9))
      if (r2.error) return { ok: false, reason: r2.error }
      if (setup.disk[h + '/estado.txt'] !== expected) {
        return {
          ok: false,
          reason:
            'Na segunda execução, estado.txt acumulou linhas antigas. Use > em vez de >> nos dois ramos do if.',
        }
      }
    }
    return { ok: true }
  }
  if (n === 10) {
    for (let variant = 0; variant < quarantineCases.length; variant++) {
      const c = quarantineCases[variant]
      const setup = trialEnv(s, 10, variant)!
      const r1 = run(setup.env, 'bash validar.sh "' + c.arg + '"')
      if (r1.error) {
        if (r1.error.includes('testar caminhos') || r1.error.includes('Separe')) {
          return {
            ok: false,
            reason:
              'Falha ao testar caminho com espaço. Envolva "$1" com aspas em [ -d "$1" ], [ -s "$1" ] e [ -f "$1" ].',
          }
        }
        return { ok: false, reason: r1.error }
      }
      const out1 = setup.disk[h + '/diagnostico.txt']
      if (out1 !== c.expected) {
        return {
          ok: false,
          reason:
            'Para ' +
            c.label +
            ', diagnostico.txt deve receber exatamente “' +
            c.expected.trim() +
            '”. Confira a ordem -d, -s, -f e else.',
        }
      }
      const r2 = run(setup.env, 'bash validar.sh "' + c.arg + '"')
      if (r2.error) return { ok: false, reason: r2.error }
      if (setup.disk[h + '/diagnostico.txt'] !== c.expected) {
        return {
          ok: false,
          reason:
            'Na segunda execução, diagnostico.txt acumulou linhas. Use > em cada ramo.',
        }
      }
    }
    return { ok: true }
  }
  if (n === 11) {
    const setup = trialEnv(s, 11, 0)!
    const r1 = run(setup.env, 'bash ' + scriptName(11))
    if (r1.error) {
      if (
        r1.error.includes('Arquivo não encontrado') ||
        r1.error.includes('testar caminhos')
      ) {
        return {
          ok: false,
          reason:
            'Falha ao lidar com espaço no nome do arquivo. Use aspas em "$arquivo" dentro do if [ -s "$arquivo" ], cat e echo.',
        }
      }
      return { ok: false, reason: r1.error }
    }
    const mem1 = String(setup.disk[h + '/memoria.txt'] ?? '')
    const rel1 = String(setup.disk[h + '/relatorio.txt'] ?? '')
    if (!mem1 && !rel1) {
      return {
        ok: false,
        reason: 'O script não gravou dados em memoria.txt nem em relatorio.txt.',
      }
    }
    if (mem1.includes('ruído') || rel1.includes('ignorar.log')) {
      return {
        ok: false,
        reason:
          'O script leu ignorar.log. No laço for, selecione apenas fragmentos/*.frag.',
      }
    }
    if (rel1.includes('a zero.frag')) {
      return {
        ok: false,
        reason:
          'Um fragmento vazio entrou em relatorio.txt. Filtre com if [ -s "$arquivo" ].',
      }
    }
    if (rel1.includes('/ark/memoria/')) {
      return {
        ok: false,
        reason:
          'relatorio.txt recebeu caminho absoluto. Use o caminho relativo (ex.: fragmentos/01.frag).',
      }
    }
    if (!recovered(setup.disk)) {
      return {
        ok: false,
        reason:
          'Confira se relatorio.txt traz apenas os caminhos relativos dos fragmentos válidos e memoria.txt o conteúdo deles, na ordem dos nomes.',
      }
    }
    const r2 = run(setup.env, 'bash ' + scriptName(11))
    if (r2.error) return { ok: false, reason: r2.error }
    if (!recovered(setup.disk)) {
      return {
        ok: false,
        reason:
          'Na segunda execução, memoria.txt ou relatorio.txt acumulou dados antigos. Zere os dois arquivos com > memoria.txt e > relatorio.txt antes do laço for.',
      }
    }
    return { ok: true }
  }
  return { ok: true }
}

export function starterTemplate(s: Save, n: number): string {
  if (playerDifficulty(s) === 'windows') {
    if (n === 7)
      return 'cat turno.txt > boletim.txt\n# Escreva aqui o comando que acrescenta "pronto" em boletim.txt.\n'
    if (n === 8)
      return 'grep EVENTO "$1" | sort > resumo.txt\n# Acrescente o total de linhas EVENTO com wc -l e >> resumo.txt\n'
    if (n === 9)
      return 'if [ -s "amostra.frag" ]; then\n  # grave "legível" em estado.txt com >\nelse\n  # grave "vazio" em estado.txt com >\nfi\n'
    if (n === 10)
      return 'if [ -d "$1" ]; then\n  echo pasta > diagnostico.txt\nelif [ -s "$1" ]; then\n  # grave "valido" em diagnostico.txt com >\nelif [ -f "$1" ]; then\n  # grave "vazio" em diagnostico.txt com >\nelse\n  # grave "ausente" em diagnostico.txt com >\nfi\n'
    if (n === 11)
      return '> memoria.txt\n> relatorio.txt\nfor arquivo in fragmentos/*.frag; do\n  # teste [ -s "$arquivo" ] e acrescente conteúdo e caminho com >>\ndone\n'
  }
  return n === 7
    ? 'cat turno.txt > boletim.txt\n# Escreva aqui o comando que acrescenta a confirmação.\n'
    : ''
}

function recovered(d: Disk) {
  const h = home(11),
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

const initialDeposit: Record<string, string> = {
  'bateria-a.txt': 'BATERIA A: carga 82%\n',
  'bateria-b.txt': 'BATERIA B: carga 64%\n',
  'filtro-01.txt': 'FILTRO 01: selo íntegro\n',
}
const expectedAlerts =
  'ALERTA 01 poeira densa\nALERTA 02 vazamento sul\nALERTA 03 bateria fraca\nALERTA 04 pressão baixa\n'
const expectedPriority = 'ALERTA 01 poeira densa\nALERTA 02 vazamento sul\n'
const expectedDuctMap =
  'setores/norte/ramal/v02.val\nsetores/norte/v01.val\nsetores/subsolo/v04.val\nsetores/sul/v03.val\n'

export function goals(s: Save, n: number): boolean[] {
  if (n < s.completed || n >= TOTAL_CHAPTERS) return [true, true, true]
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
    case 4: {
      const txtKeys = Object.keys(initialDeposit)
      const copied =
        get('ativos') === null &&
        txtKeys.every(
          (k) =>
            get('ativos/' + k) === initialDeposit[k] &&
            get('caixas/' + k) === initialDeposit[k],
        )
      const cleaned =
        get('caixas/ruido-1.tmp') === undefined &&
        get('caixas/ruido-2.tmp') === undefined &&
        txtKeys.every((k) => get('caixas/' + k) === initialDeposit[k])
      const merged =
        get('baterias.txt') ===
        initialDeposit['bateria-a.txt'] + initialDeposit['bateria-b.txt']
      return [copied, cleaned, merged]
    }
    case 5: {
      const alertsOk = get('alertas.txt') === expectedAlerts
      const priorityOk = get('prioridade.txt') === expectedPriority
      const countOk = String(get('contagem.txt') ?? '').trim() === '4'
      return [alertsOk, priorityOk, countOk]
    }
    case 6: {
      const mapOk = get('mapa.txt') === expectedDuctMap
      const uniqOk = get('falhas.txt') === 'FALHA-A\nFALHA-B\nFALHA-C\n'
      const copyOk =
        get('inspecao') === null &&
        get('inspecao/v04.val') === 'FALHA-A\nFALHA-C\n'
      return [mapOk, uniqOk, copyOk]
    }
    case 7:
      return [
        typeof get(scriptName(n)) === 'string',
        has('ran7'),
        has('ran7') &&
          get('boletim.txt') === get('turno.txt') + 'pronto\n' &&
          scriptTrial(s, 7, 0),
      ]
    case 8: {
      const execReady =
        typeof get(scriptName(n)) === 'string' &&
        Boolean(s.execs?.includes(h + '/' + scriptName(n)))
      return [
        execReady,
        has('ran8exec'),
        execReady && has('ran8exec') && scriptTrial(s, 8, 0),
      ]
    }
    case 9:
      return [
        typeof get(scriptName(n)) === 'string',
        has('ran9'),
        has('ran9') &&
          get('estado.txt') ===
            (get('amostra.frag') ? 'legível\n' : 'vazio\n') &&
          scriptTrial(s, 9, 0) &&
          scriptTrial(s, 9, 1),
      ]
    case 10:
      return [
        typeof get(scriptName(n)) === 'string',
        has('ran10'),
        has('ran10') &&
          [0, 1, 2, 3].every((variant) => scriptTrial(s, 10, variant)),
      ]
    default:
      return [
        has('ran11'),
        recovered(d),
        has('ran11') && recovered(d) && scriptTrial(s, 11, 0),
      ]
  }
}

interface Practice {
  id: string
  title: string
  voice: string
  brief: string
  hints: string[]
  levels?: Difficulty[]
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
      levels: ['windows', 'vibe'],
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
      levels: ['windows', 'vibe'],
      check: (s) =>
        s.disk['/ark/radio/escuta/transmissao.txt'] ===
        'SINAL OK — alcance restabelecido\ninspecionado\n',
    },
  ],
  4: [
    {
      id: 'curingas',
      title: 'Selecionando arquivos com *',
      voice: 'Noah',
      brief:
        'A pasta caixas mistura fichas .txt com arquivos .tmp corrompidos. Em vez de digitar um nome de cada vez, use o curinga * para listar ou ler só os .txt: experimente ls caixas/*.txt ou cat caixas/*.txt.',
      hints: [
        'O asterisco * casa qualquer sequência de caracteres no nome.',
        'Execute ls caixas/*.txt (ou cat caixas/*.txt).',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('glob-caixas'),
    },
    {
      id: 'limpeza',
      title: 'Descarte seguro com rm',
      voice: 'Noah',
      brief:
        'Antes de limpar caixas, treine na área de descarte. Apague o arquivo descarte/rascunho.tmp usando rm. Lembre-se: rm remove definitivamente, mas o menu Controles sempre pode restaurar o setor se precisar.',
      hints: [
        'Verifique o arquivo com ls descarte antes de apagar.',
        'Execute rm descarte/rascunho.tmp.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.disk['/ark/deposito/descarte/rascunho.tmp'] === undefined,
    },
  ],
  5: [
    {
      id: 'pipe-contagem',
      title: 'Conectando comandos com pipe',
      voice: 'Lara',
      brief:
        'O símbolo | envia a saída de um comando direto para a entrada do próximo, sem precisar de arquivo intermediário. Descubra quantos alertas existem em sensores.log combinando grep e wc -l.',
      hints: [
        'Filtre ALERTA primeiro e envie o resultado para wc -l.',
        'Execute grep ALERTA sensores.log | wc -l.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('piped-count'),
    },
    {
      id: 'extremos',
      title: 'Lendo o final de um registro',
      voice: 'Lara',
      brief:
        'Logs costumam ser longos. Enquanto head -n N mostra o início, tail -n N mostra as últimas linhas. Confira as 2 últimas leituras de sensores.log com tail -n 2 sensores.log.',
      hints: [
        'Use a opção -n seguida do número de linhas desejado.',
        'Execute tail -n 2 sensores.log.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('checked-tail'),
    },
  ],
  6: [
    {
      id: 'busca-profunda',
      title: 'Vasculhando subpastas com find',
      voice: 'Noah',
      brief:
        'O curinga * olha apenas um nível de pasta. Na galeria de dutos há ramais dentro de ramais. Use find setores -name "*.val" para localizar todos os registros de válvula em qualquer profundidade.',
      hints: [
        'Coloque "*.val" entre aspas para que o find receba o padrão em vez do shell expandir antes.',
        'Execute find setores -name "*.val".',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('found-vals'),
    },
    {
      id: 'sem-duplicatas',
      title: 'Eliminando repetições com uniq',
      voice: 'Noah',
      brief:
        'O histórico repete os mesmos códigos de falha. O comando uniq elimina apenas duplicatas vizinhas — por isso sempre vem depois de sort. Teste grep FALHA historico.log | sort | uniq.',
      hints: [
        'Encadeie três estágios com dois pipes: grep, sort e uniq.',
        'Execute grep FALHA historico.log | sort | uniq.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('piped-uniq'),
    },
  ],
  7: [
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
      levels: ['windows', 'vibe'],
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
      levels: ['windows', 'vibe'],
      check: (s) =>
        s.disk['/ark/oficina/previa-noturna.txt'] ===
        trainingFiles['/ark/oficina/turno noturno.txt'] + 'pronto\n',
    },
    {
      id: 'variavel',
      title: 'Guardando nomes em variáveis',
      voice: 'Noah',
      brief:
        'Antes de automatizar, guarde o nome "turno noturno.txt" na variável fonte (sem espaços ao redor do =) e leia esse arquivo usando cat "$fonte".',
      hints: [
        'Atribua sem espaços perto do sinal de igual: fonte="turno noturno.txt".',
        'Depois leia com aspas para preservar o espaço: cat "$fonte".',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('practiced-var'),
    },
    {
      id: 'zerar',
      title: 'Reiniciando antes de repetir',
      voice: 'Noah',
      brief:
        'Se um script só usa >>, cada nova execução duplica o arquivo. Grave turno.txt em rascunho.txt e depois esvazie rascunho.txt usando apenas > rascunho.txt (sem comando à esquerda).',
      hints: [
        'Primeiro crie conteúdo: cat turno.txt > rascunho.txt.',
        'Depois zere o arquivo para 0 bytes com: > rascunho.txt.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) =>
        s.seen.includes('wrote-rascunho') &&
        s.disk['/ark/oficina/rascunho.txt'] === '',
    },
  ],
  8: [
    {
      id: 'permissao-exec',
      title: 'Tornando um script executável',
      voice: 'Noah',
      brief:
        'Deixei um script pronto chamado teste.sh que imprime o primeiro argumento "$1". Dê permissão de execução com chmod +x teste.sh e rode ./teste.sh ok para vê-lo responder.',
      hints: [
        'Primeiro libere a execução com chmod +x teste.sh.',
        'Depois rode diretamente na pasta atual: ./teste.sh ok.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) =>
        Boolean(s.execs?.includes('/ark/controle/teste.sh')) &&
        s.seen.includes('ran-teste-exec'),
    },
    {
      id: 'fluxo-eventos',
      title: 'Testando o filtro de eventos',
      voice: 'Noah',
      brief:
        'Antes de abrir o editor, valide o fluxo que o resumo.sh vai usar: filtre EVENTO em diurno.log e ordene com sort usando pipe.',
      hints: [
        'Reaproveite o pipe da Sala de telemetria.',
        'Execute grep EVENTO diurno.log | sort.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('practiced-events'),
    },
  ],
  9: [
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
      levels: ['windows', 'vibe'],
      check: (s) =>
        s.seen.includes('inspected:amostra.frag') &&
        s.seen.includes('inspected:reserva.frag'),
    },
    {
      id: 'teste-tamanho',
      title: 'Testando o pulso no terminal',
      voice: 'Lara',
      brief:
        'O comando [ -s arquivo ] verifica sem imprimir nada se o arquivo tem conteúdo (status 0) ou está vazio (status 1). Teste amostra.frag e reserva.frag no terminal antes de montar seu script.',
      hints: [
        'Deixe espaços após [ e antes de ].',
        'Execute [ -s amostra.frag ] e depois [ -s reserva.frag ].',
      ],
      levels: ['windows', 'vibe'],
      check: (s) =>
        s.seen.includes('tested:amostra.frag') &&
        s.seen.includes('tested:reserva.frag'),
    },
    {
      id: 'if-simples',
      title: 'Primeiro bloco condicional',
      voice: 'Lara',
      brief:
        'Combine o teste com if no terminal: se amostra.frag tiver conteúdo, grave “pulso” em checagem.txt usando if [ -s amostra.frag ]; then echo pulso > checagem.txt; fi.',
      hints: [
        'No terminal, separe as partes do if com ponto e vírgula (;).',
        'Digite: if [ -s amostra.frag ]; then echo pulso > checagem.txt; fi',
      ],
      levels: ['windows'],
      check: (s) => s.disk['/ark/triagem/checagem.txt'] === 'pulso\n',
    },
  ],
  10: [
    {
      id: 'testes-tipo',
      title: 'Diferenciando pastas e arquivos',
      voice: 'Lara',
      brief:
        'Além de -s (tamanho > 0), existem -d (é pasta) e -f (é arquivo comum, mesmo vazio). Teste [ -d lote ] e [ -f vazio.frag ] no terminal para ver ambos retornarem verdadeiro.',
      hints: [
        'Mantenha espaços dentro dos colchetes.',
        'Execute [ -d lote ] e depois [ -f vazio.frag ].',
      ],
      levels: ['windows', 'vibe'],
      check: (s) =>
        s.seen.includes('tested-d:lote') &&
        s.seen.includes('tested-f:vazio.frag'),
    },
    {
      id: 'elif-terminal',
      title: 'Encadeando decisões com elif',
      voice: 'Lara',
      brief:
        'Quando há mais de dois caminhos, elif testa uma segunda condição. Experimente no terminal: if [ -d vazio.frag ]; then echo pasta > ensaio.txt; elif [ -f vazio.frag ]; then echo arquivo > ensaio.txt; fi.',
      hints: [
        'Use ponto e vírgula entre o teste e then, e antes de elif e fi.',
        'Digite: if [ -d vazio.frag ]; then echo pasta > ensaio.txt; elif [ -f vazio.frag ]; then echo arquivo > ensaio.txt; fi',
      ],
      levels: ['windows'],
      check: (s) => s.disk['/ark/quarentena/ensaio.txt'] === 'arquivo\n',
    },
  ],
  11: [
    {
      id: 'fragmentos',
      title: 'Padrão de memória',
      voice: 'Lara',
      brief:
        'No núcleo, os arquivos cresceram em número. Reaproveite o curinga * aprendido no Depósito: liste fragmentos e leia todos os .frag juntos com cat fragmentos/*.frag.',
      hints: [
        'Combine o caminho da pasta com um curinga a partir da raiz do setor.',
        'Use ls fragmentos e depois cat fragmentos/*.frag.',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('compared-fragments'),
    },
    {
      id: 'laco-for',
      title: 'Percorrendo arquivos com for',
      voice: 'Lara',
      brief:
        'Agora use um laço for para ler cada fragmento um de cada vez: for arq in fragmentos/*.frag; do cat "$arq"; done. Note como as aspas protegem "03 retorno.frag".',
      hints: [
        'Se esquecer as aspas em "$arq", o espaço em "03 retorno.frag" quebra o caminho.',
        'Execute: for arq in fragmentos/*.frag; do cat "$arq"; done',
      ],
      levels: ['windows', 'vibe'],
      check: (s) => s.seen.includes('practiced-for'),
    },
  ],
}

const practiceKey = (step: Practice) => 'practice:' + step.id

export function activePractice(s: Save, n = s.completed) {
  if (n !== s.completed) return
  const diff = playerDifficulty(s)
  if (diff === 'dev') return
  if ((n === 2 || n === 3) && !goals(s, n).every(Boolean)) return
  return practices[n]?.find(
    (step) =>
      (!step.levels || step.levels.includes(diff)) &&
      !s.seen.includes(practiceKey(step)),
  )
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
  return (
    isScriptChapter(s.room) &&
    s.room <= s.completed &&
    !activePractice(s, s.room)
  )
}

const initialCrew: Record<string, string> = {
  iara: 'Iara – comunicações\n',
  noah: 'Noah – engenharia\n',
}

export function finish(s: Save) {
  if (
    s.completed < TOTAL_CHAPTERS &&
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
  if (n < 0 || n !== s.completed || n >= TOTAL_CHAPTERS) return
  const root = home(n) + '/',
    original = initialDisk()
  for (const k of Object.keys(s.disk)) if (k.startsWith(root)) delete s.disk[k]
  for (const [k, v] of Object.entries(original))
    if (k.startsWith(root)) s.disk[k] = v
  s.execs = (s.execs ?? []).filter((p) => !p.startsWith(root))
  const flags = [
    ['terminal0', 'located', 'listed', 'message'],
    ['label', 'circuit', 'relay'],
    [],
    ['signal'],
    ['glob-caixas'],
    ['piped-count', 'checked-tail'],
    ['found-vals', 'piped-uniq'],
    ['ran7', 'practiced-var', 'wrote-rascunho'],
    ['ran8exec', 'ran-teste-exec', 'practiced-events'],
    [
      'ran9',
      'inspected:amostra.frag',
      'inspected:reserva.frag',
      'tested:amostra.frag',
      'tested:reserva.frag',
    ],
    ['ran10', 'tested-d:lote', 'tested-f:vazio.frag'],
    ['ran11', 'compared-fragments', 'practiced-for'],
  ][n]
  const cleared = [...flags, ...(practices[n] ?? []).map(practiceKey)]
  s.seen = s.seen.filter((k) => !cleared.includes(k))
  delete s.drafts[n]
  s.cwd = home(n)
  s.vars = {}
  s.log = []
  s.screen = 'world'
}
