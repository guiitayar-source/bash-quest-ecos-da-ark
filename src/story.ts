import { chapters, activePractice, type Save } from './campaign'

export const suits = [
  { id: 'ochre', name: 'Ocre', color: '#e4aa60' },
  { id: 'teal', name: 'Jade', color: '#7bc9ad' },
  { id: 'plum', name: 'Violeta', color: '#c798d1' },
] as const

export type Character = { name: string; suit: (typeof suits)[number]['id'] }
export type NPC = 'lara' | 'noah'
export const crew = {
  lara: { name: 'Lara', role: 'Batedora', x: 171, y: 147 },
  noah: { name: 'Noah', role: 'Técnico da ARK', x: 314, y: 151 },
}

export type Story = {
  player: Character
  step: 'wake' | 'meet-noah' | 'terminal' | 'debrief' | 'done'
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
  if (topic === 'how')
    return {
      line: practice?.hints[0] ?? chapters[s.room].hints[0],
      choices: [{ text: 'Vou experimentar' }],
    }
  return {
    line:
      s.completed > s.room
        ? chapters[s.room].restored
        : (practice?.brief ?? chapters[s.room].desc),
    choices: [
      { text: 'Por onde começo?', next: 'how' },
      { text: 'Vou investigar' },
    ],
  }
}
