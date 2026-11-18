import { chapters, activePractice, type Save } from './campaign'

export const suits = [
  { id: 'ochre', name: 'Ocre', color: '#e4aa60' },
  { id: 'teal', name: 'Jade', color: '#7bc9ad' },
  { id: 'plum', name: 'Violeta', color: '#c798d1' },
] as const

export const difficulties = [
  {
    id: 'windows',
    name: 'Usuário Windows',
    tag: 'GUIADO',
    desc: 'Primeiro contato com terminal. Mostra árvore de arquivos ao lado do prompt, modelos no editor, passo a passo completo e erros explicados.',
  },
  {
    id: 'vibe',
    name: 'Vibe Coder',
    tag: 'EQUILIBRADO',
    desc: 'Já entende lógica, mas quer firmar a sintaxe do Bash. Inclui detector de armadilhas no editor e práticas essenciais.',
  },
  {
    id: 'dev',
    name: 'Dev',
    tag: 'AUTÔNOMO',
    desc: 'Acostumado com CLI. Vai direto aos desafios sem tutoriais prévios, sem dicas prontas na tela e com validação rigorosa.',
  },
] as const

export type Difficulty = (typeof difficulties)[number]['id']

export type Character = { name: string; suit: (typeof suits)[number]['id'] }
export type NPC = 'lara' | 'noah'
export const crew = {
  lara: { name: 'Lara', role: 'Batedora', x: 171, y: 147 },
  noah: { name: 'Noah', role: 'Técnico da ARK', x: 314, y: 151 },
}

export type Story = {
  player: Character
  step: 'wake' | 'meet-noah' | 'terminal' | 'debrief' | 'done'
  difficulty?: Difficulty
}

export function playerDifficulty(s: Save): Difficulty {
  return s.story?.difficulty ?? 'vibe'
}

type Dialogue = {
  line: string
  choices: Array<{
    text: string
    next?: string
    step?: Story['step']
    note?: string
  }>
}

const sectorDialogues: Record<
  number,
  {
    active: { line: string; loreLine: string; lorePrompt: string }
    restored: { line: string; extraLine: string; extraPrompt: string }
  }
> = {
  1: {
    active: {
      line: 'Os quadros de força daqui alimentam toda a ala norte. Sem o registro do circuito certo, acionar o relé errado pode queimar os fusíveis que ainda restam.',
      lorePrompt: 'Como você aguentou esse apagão sozinho?',
      loreLine:
        'Mantendo apenas as luzes de emergência e contando turnos no papel. Quando você e Lara chegaram, a bateria principal já estava no limite.',
    },
    restored: {
      line: 'Escuta esse zumbido constante? Os disjuntores seguraram a carga. Agora as portas do corredor estão liberadas até onde a fiação alcançar.',
      extraPrompt: 'Para onde vamos agora?',
      extraLine:
        'Siga pelo corredor até o Arquivo da tripulação. Precisamos saber quem ainda tem registro ativo na estação.',
    },
  },
  2: {
    active: {
      line: 'Quando o Colapso cortou a rede, os fichários misturaram arquivos de emergência com papéis de triagem. Precisamos organizar o resgate sem apagar os originais.',
      lorePrompt: 'Por que os arquivos assinam "Iara" e aqui chamam de Lara?',
      loreLine:
        'O crachá antigo dela era Iara — comunicações de superfície. Depois da tempestade de poeira, o visor riscado do rádio virou "Lara" e o apelido pegou entre quem sobrou.',
    },
    restored: {
      line: 'Os registros da equipe estão seguros e a carta de navegação voltou para o lugar certo. Agora temos coordenadas para tentar contato externo.',
      extraPrompt: 'Há chance de resposta lá fora?',
      extraLine:
        'Se a antena da Central de Rádio ainda estiver de pé, alguém nas torres vizinhas vai ouvir nosso pulso.',
    },
  },
  3: {
    active: {
      line: 'A tempestade lá fora joga estática pura na antena, mas entre um ruído e outro ainda passa código humano. Só precisamos filtrar o sinal real e responder.',
      lorePrompt: 'Você já ouviu essa voz da oficina antes?',
      loreLine:
        'Três batidas no microfone era o sinal de turno do nosso antigo engenheiro de manutenção. Quero confirmar se é gravação automática ou alguém vivo no setor 5.',
    },
    restored: {
      line: 'Ouviu isso? A portadora estabilizou e o retorno veio direto da Oficina de manutenção. Não estamos só nós três mantendo essas paredes de pé.',
      extraPrompt: 'O que acontece quando chegarmos à Oficina?',
      extraLine:
        'Noah comentou que os relatórios de turno lá são copiados à mão toda madrugada. Se automatizarmos isso, sobra fôlego para alcançar o Núcleo.',
    },
  },
  4: {
    active: {
      line: 'Toda madrugada eu copiava o turno anterior linha por linha para não perder o histórico quando a energia oscilava. Chegou a hora de ensinar o terminal a fazer isso sozinho.',
      lorePrompt: 'Por que criar um script em vez de digitar tudo de novo?',
      loreLine:
        'Um comando digitado resolve hoje. Um arquivo .sh documenta o processo para qualquer pessoa da estação repetir amanhã sem errar uma vírgula.',
    },
    restored: {
      line: 'O boletim rodou limpo e pode ser repetido quantas vezes precisarmos. Pela primeira vez em meses, dá para confiar que o turno de amanhã não vai se perder.',
      extraPrompt: 'O que há além da Oficina?',
      extraLine:
        'O Laboratório de triagem. Lara trouxe cápsulas de memória da encosta, mas metade delas apagou na poeira estática.',
    },
  },
  5: {
    active: {
      line: 'Trouxe essas cápsulas das torres soterradas. Por fora são idênticas, mas algumas guardam mensagens inteiras e outras têm zero bytes. Precisamos separar sinal de silêncio.',
      lorePrompt: 'Por que não abrir todas uma por uma?',
      loreLine:
        'No laboratório há dezenas esperando na fila do núcleo. Sem uma triagem automática que teste o tamanho do arquivo, perderíamos dias lendo cápsulas vazias.',
    },
    restored: {
      line: 'Seu filtro diferenciou cada cápsula sem hesitar. O Núcleo de memória finalmente reconheceu a credencial da triagem e abriu a última comporta.',
      extraPrompt: 'O que nos espera no Núcleo?',
      extraLine:
        'Todos os fragmentos que conseguimos salvar do Colapso. Escreva uma rotina que resista a nomes estranhos, arquivos vazios e novas levas de fragmentos.',
    },
  },
  6: {
    active: {
      line: 'Chegamos ao coração da ARK. Os fragmentos estão espalhados na pasta do núcleo — alguns com conteúdo, outros vazios, alguns com espaços no nome. O sistema precisa recuperar só o que sobreviveu.',
      lorePrompt: 'O que significa recuperar a memória da ARK?',
      loreLine:
        'Significa provar que a estação não é só concreto e bateria. Cada mensagem recuperada aqui vira mapa e história para quem ainda caminha na superfície.',
    },
    restored: {
      line: 'Funcionou. Cada fragmento legível foi reunido em ordem e catalogado no relatório. A ARK voltou a lembrar quem passou por aqui.',
      extraPrompt: 'E agora, para onde a estação vai?',
      extraLine:
        'Com energia, rádio e memória operantes, a torre volta a ser farol na superfície. O próximo turno já vai encontrar a casa acesa.',
    },
  },
}

export function conversation(s: Save, npc: NPC, topic: string): Dialogue {
  const name = s.story?.player.name ?? 'Operador'
  if (s.room === 0 && s.story && s.story.step !== 'done') {
    if (npc === 'lara' && s.story?.step === 'wake') {
      if (topic === 'outside')
        return {
          line: 'Depois do Colapso, as cidades ficaram sem energia. Agora o pó cobre as estradas e cada torre que ainda acende vira um ponto de encontro. A ARK é uma dessas torres.',
          choices: [{ text: 'Como posso ajudar?', next: 'crew' }],
        }
      if (topic === 'rescue')
        return {
          line: 'Segui as marcas que você deixou no pó. Seu filtro tinha parado bem perto da entrada. As cápsulas ainda funcionam, mas eu precisei desligar o resto para manter você respirando.',
          choices: [{ text: 'Como posso ajudar?', next: 'crew' }],
        }
      if (topic === 'crew')
        return {
          line: 'A eclusa travou quando a energia caiu. Noah está junto ao terminal, do outro lado da sala. Ele sabe como abrir a passagem. Diga que eu mandei você.',
          choices: [
            {
              text: 'Vou falar com Noah',
              step: 'meet-noah',
              note: 'Lara me encontrou perto da entrada da ARK. Noah precisa de ajuda para levar energia à eclusa.',
            },
          ],
        }
      return {
        line:
          'Devagar, ' +
          name +
          '. Você está na ARK. Resgatei você do lado de fora, antes da última nuvem de poeira.',
        choices: [
          { text: 'O que aconteceu lá fora?', next: 'outside' },
          { text: 'Como você me encontrou?', next: 'rescue' },
        ],
      }
    }
    if (npc === 'noah') {
      if (s.story?.step === 'wake')
        return {
          line: 'Você acordou. Fale primeiro com Lara, junto às cápsulas. Foi ela quem trouxe você para cá.',
          choices: [{ text: 'Vou procurar Lara' }],
        }
      if (s.story?.step === 'meet-noah') {
        if (topic === 'commands')
          return {
            line: 'Comece com pwd. Ele mostra o caminho da pasta onde você está. Depois use ls para listar os arquivos. Quando encontrar mensagem.txt, cat mensagem.txt vai abrir o registro que Lara deixou para nós. Ela assina Iara no arquivo da tripulação.',
            choices: [
              {
                text: 'Vou tentar no terminal',
                step: 'terminal',
                note: 'Noah mostrou como encontrar meu lugar no terminal com pwd, descobrir arquivos com ls e ler um registro com cat.',
              },
            ],
          }
        return {
          line: 'A Lara mandou você? Ótimo. Nossos mapas antigos sumiram, mas os registros ainda estão no computador. Antes de puxarmos energia de outro setor, quero saber qual circuito ela anotou.',
          choices: [
            {
              text: 'Nunca usei esse terminal. Como começo?',
              next: 'commands',
            },
          ],
        }
      }
      if (s.story?.step === 'debrief')
        return {
          line: 'C07. Era o número que faltava. Vou soltar a trava local para você. Procure a porta de energia no corredor. Lá a etiqueta da máquina ajuda a encontrar o registro do circuito.',
          choices: [{ text: 'Vou verificar o circuito', step: 'done' }],
        }
      return {
        line: 'Se perder a noção de onde está, use pwd. Quando vir o arquivo da Lara, leia com cat e volte para me contar o número do circuito.',
        choices: [{ text: 'Voltar ao terminal' }],
      }
    }
    return {
      line: 'O Noah está perto do console à direita. A eclusa espera por vocês dois.',
      choices: [{ text: 'Voltar à cabine' }],
    }
  }

  const practice = activePractice(s, s.room)
  const sectorTalk = sectorDialogues[s.room]
  const diff = playerDifficulty(s)
  const restored = s.completed > s.room

  if (topic === 'how') {
    return {
      line:
        diff === 'dev'
          ? 'No modo Dev, os objetivos do setor resumem os critérios de aceitação. Use man apenas para consultar a sintaxe.'
          : (practice?.hints[0] ?? chapters[s.room].hints[0]),
      choices: [{ text: 'Vou experimentar' }],
    }
  }
  if (topic === 'lore' && sectorTalk) {
    return {
      line: restored ? sectorTalk.restored.extraLine : sectorTalk.active.loreLine,
      choices: [{ text: 'Entendido' }],
    }
  }

  if (sectorTalk) {
    const block = restored ? sectorTalk.restored : sectorTalk.active
    return {
      line: block.line,
      choices: [
        {
          text: restored ? sectorTalk.restored.extraPrompt : sectorTalk.active.lorePrompt,
          next: 'lore',
        },
        ...(!restored && diff !== 'dev'
          ? [{ text: 'Por onde começo?', next: 'how' }]
          : []),
        { text: restored ? 'Continuar explorando' : 'Vou investigar' },
      ],
    }
  }

  return {
    line: restored
      ? chapters[s.room].restored
      : (practice?.brief ?? chapters[s.room].desc),
    choices: [
      ...(diff !== 'dev' ? [{ text: 'Por onde começo?', next: 'how' }] : []),
      { text: 'Vou investigar' },
    ],
  }
}
