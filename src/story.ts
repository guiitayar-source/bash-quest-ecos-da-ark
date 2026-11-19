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
        'Três batidas no microfone era o sinal de turno do nosso antigo engenheiro de manutenção. Quero confirmar se é gravação automática ou alguém vivo lá dentro.',
    },
    restored: {
      line: 'Ouviu isso? A portadora estabilizou e o retorno veio da ala técnica. Antes de alcançarmos a Oficina, precisamos liberar energia reserva no Depósito de suprimentos.',
      extraPrompt: 'O que encontramos no Depósito?',
      extraLine:
        'Lotes de baterias e filtros misturados com arquivos temporários corrompidos. Lá você vai precisar operar vários arquivos de uma vez.',
    },
  },
  4: {
    active: {
      line: 'O Depósito acumulou lixo temporário junto das fichas de bateria. Copiar um por um levaria horas — use o curinga * para mover lotes inteiros e rm para descartar os .tmp corrompidos.',
      lorePrompt: 'Não é perigoso apagar arquivos com rm?',
      loreLine:
        'Por isso a regra de ouro aqui na ARK é testar o padrão com ls antes de rodar rm. Se der qualquer tropeço, o sistema de backup local restaura o setor.',
    },
    restored: {
      line: 'As pilhas boas estão catalogadas e o lixo saiu do caminho. A Sala de telemetria acabou de ligar o painel de sensores.',
      extraPrompt: 'Por que a Telemetria é o próximo passo?',
      extraLine:
        'Os sensores despejam dezenas de linhas fora de ordem. Lara precisa filtrar, ordenar e contar os alertas críticos.',
    },
  },
  5: {
    active: {
      line: 'Os sensores externos acordaram todos de uma vez e jogaram tudo no mesmo registro. Conectando comandos com o pipe |, dá para filtrar, ordenar e contar sem encher a pasta de arquivos temporários.',
      lorePrompt: 'De onde vêm esses sensores?',
      loreLine:
        'Das torres de ventilação na encosta. Se a pressão cai lá fora, significa que algum duto da estação está deixando entrar poeira.',
    },
    restored: {
      line: 'Os alertas prioritários estão na mesa e já sabemos quantos pontos falharam. O mapa aponta direto para a Galeria de dutos.',
      extraPrompt: 'O que tem na Galeria de dutos?',
      extraLine:
        'Subpastas dentro de subpastas de válvulas e um histórico cheio de códigos repetidos. Vamos precisar de busca profunda com find e limpeza com uniq.',
    },
  },
  6: {
    active: {
      line: 'Os dutos se ramificam em vários níveis de subpastas. O curinga * só enxerga um andar, mas find percorre toda a árvore e uniq tira os códigos duplicados depois de sort.',
      lorePrompt: 'Por que existem tantos ramais no subsolo?',
      loreLine:
        'A ARK foi cavada aproveitando túneis de resfriamento antigos. Sem o mapa certo, ninguém sabe qual válvula isola o ar da oficina.',
    },
    restored: {
      line: 'Todas as válvulas foram mapeadas e o ar voltou a circular limpo. Finalmente temos acesso seguro à Oficina de manutenção.',
      extraPrompt: 'O que nos espera na Oficina?',
      extraLine:
        'Lá os turnos ainda são copiados à mão toda madrugada. Chegou a hora de dar o próximo salto: transformar comandos em scripts reutilizáveis.',
    },
  },
  7: {
    active: {
      line: 'Toda madrugada eu copiava o turno anterior linha por linha para não perder o histórico quando a energia oscilava. Chegou a hora de ensinar o terminal a fazer isso sozinho.',
      lorePrompt: 'Por que criar um script em vez de digitar tudo de novo?',
      loreLine:
        'Um comando digitado resolve hoje. Um arquivo .sh documenta o processo para qualquer pessoa da estação repetir amanhã sem errar uma vírgula.',
    },
    restored: {
      line: 'O boletim rodou limpo e pode ser repetido quantas vezes precisarmos. Agora a Estação de controle quer uma ferramenta que funcione com qualquer log.',
      extraPrompt: 'Qual a diferença da Estação de controle?',
      extraLine:
        'Em vez de um arquivo fixo, seu script vai aceitar um parâmetro "$1" e virar um comando executável com chmod +x e ./',
    },
  },
  8: {
    active: {
      line: 'Aqui chegam logs de turnos diferentes o dia todo. Se o script receber o arquivo em "$1" e tiver permissão +x, qualquer operador roda ./resumo.sh passando o log do momento.',
      lorePrompt: 'Por que usar ./ na frente do nome do script?',
      loreLine:
        'Por segurança, o sistema não executa arquivos soltos da pasta atual por acidente. O ./ deixa claro que você quer rodar o programa daqui mesmo.',
    },
    restored: {
      line: 'Nosso primeiro utilitário próprio está no ar! Agora o Laboratório de triagem recebeu a credencial para processar as cápsulas que Lara recolheu.',
      extraPrompt: 'O que há no Laboratório de triagem?',
      extraLine:
        'Cápsulas de memória trazidas da encosta. Metade delas apagou na poeira estática — seu script vai precisar tomar decisões com if.',
    },
  },
  9: {
    active: {
      line: 'Trouxe essas cápsulas das torres soterradas. Por fora são idênticas, mas algumas guardam mensagens inteiras e outras têm zero bytes. Precisamos separar sinal de silêncio.',
      lorePrompt: 'Por que não abrir todas uma por uma?',
      loreLine:
        'No laboratório há dezenas esperando na fila do núcleo. Sem uma triagem automática que teste o tamanho do arquivo, perderíamos dias lendo cápsulas vazias.',
    },
    restored: {
      line: 'Seu filtro diferenciou cada cápsula sem hesitar. Antes do Núcleo, falta passar pela Câmara de quarentena para validar qualquer tipo de caminho.',
      extraPrompt: 'O que a Câmara de quarentena verifica?',
      extraLine:
        'Lá entram pastas inteiras, arquivos válidos, arquivos vazios e caminhos quebrados. Vamos combinar -d, -s, -f e elif num único protocolo.',
    },
  },
  10: {
    active: {
      line: 'A quarentena é a última barreira antes do Núcleo. Um único if/else não basta: precisamos classificar pastas (-d), arquivos com conteúdo (-s), arquivos vazios (-f) e caminhos ausentes usando elif.',
      lorePrompt: 'Por que testar -s antes de -f?',
      loreLine:
        'Porque todo arquivo com conteúdo também é um arquivo comum. Se você testar -f primeiro, ele captura tudo e nunca chega no ramo -s.',
    },
    restored: {
      line: 'Protocolo de segurança validado nos quatro cenários! A comporta blindada do Núcleo de memória acabou de destravar.',
      extraPrompt: 'O que nos espera no Núcleo?',
      extraLine:
        'Todos os fragmentos que conseguimos salvar do Colapso. Vamos unir tudo o que você aprendeu num laço for para devolver a memória à ARK.',
    },
  },
  11: {
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
        'Com todos os doze setores operantes — da energia ao núcleo — a torre volta a ser farol na superfície. O próximo turno já vai encontrar a casa acesa.',
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
