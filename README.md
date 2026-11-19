# Bash Quest — Ecos da ARK

RPG de exploração em português brasileiro para computador com teclado. Depois do Colapso, Lara resgata você nas encostas do refúgio ARK. Crie um personagem e converse com Lara e Noah antes de explorar. A campanha acompanha a recuperação de doze setores da estação em progressão espiral — cada setor combina comandos anteriores com novos conceitos. O último desafio é escrever um script que identifica fragmentos legíveis, recupera suas mensagens e gera um relatório.

## Jogar no Linux

Execute `./jogar.sh` nesta pasta. O atalho instala as dependências na primeira execução, prepara o jogo e abre o navegador em **http://127.0.0.1:4173**. Mantenha o processo aberto enquanto joga. Encerre com Ctrl+C e use o mesmo atalho para voltar à partida.

Requer Node.js 22.12 ou posterior e npm. A instalação inicial usa a internet. O jogo, a arte, as fontes e o progresso ficam locais. Em outra plataforma, execute `npm ci` e `npm start`.

| Tecla              | Ação                               |
| ------------------ | ---------------------------------- |
| WASD ou setas      | Mover o personagem                 |
| E                  | Falar ou interagir de perto        |
| J ou M             | Abrir diário ou manual de campo    |
| Enter              | Executar a linha do terminal       |
| ↑ ou ↓ no terminal | Percorrer comandos recentes        |
| Esc                | Fechar a interface ou abrir o menu |

Também é possível clicar no piso e no botão de interação. A rota da campanha mostra quais portas do corredor estão liberadas. As fichas de ferramenta abrem exemplos de sintaxe. As dicas são opcionais.

## Progresso e terminal

Cada personagem tem uma partida separada no banco IndexedDB do navegador. O jogo salva posição, arquivos, rascunhos, conversas e missões automaticamente. Abra **Menu → Salvar partida** para gravar na hora ou **Carregar partida** para escolher um personagem. Se houver uma partida anterior, ela aparece como **Campanha original**. Use o mesmo navegador, perfil e endereço para retomar a partida. Se um comando apagar um arquivo necessário, abra **Controles do jogo → Restaurar arquivos deste setor**.

A estação usa um sistema de arquivos virtual. O terminal aceita os comandos do manual (`pwd`, `ls`, `cat`, `cd`, `mkdir`, `cp`, `mv`, `rm`, `grep`, `echo`, `sort`, `wc`, `head`, `tail`, `find`, `uniq`, `chmod`), pipes (`|`), variáveis e parâmetros (`$1`), aspas, glob com asterisco (`*`), redirecionamento (`>`, `>>`), scripts executáveis (`bash` e `./`), condições (`if`/`elif`/`else` com `-s`, `-f`, `-d`) e laço `for … in`. O terminal e o editor operam sobre o mesmo disco virtual. A verificação final também executa cada rotina com arquivos de teste em uma cópia isolada do estado.

## Desenvolvimento e verificação

- `npm run dev` inicia o Vite para desenvolvimento.
- `npm run build` verifica os tipos e gera a versão distribuível em `dist/`.
- `npm test` compara operações do interpretador com o Bash real e verifica a progressão das missões. Requer Bash instalado.
- `npm run test:e2e` percorre a campanha no navegador, verifica retomada e chega aos créditos pela interface. Usa o Google Chrome do sistema se disponível. Em outra instalação, defina `BASHQUEST_CHROME` com o caminho do navegador ou rode `npx playwright install chromium`.
- `python art/draw.py` e depois `python art/frontier.py` regeneram as cenas, os retratos e os trajes em pixel art. Requerem Pillow. Os PNGs estão incluídos no projeto.

O jogo usa TypeScript, Phaser e Vite. A interface usa ícones Lucide e fontes Barlow, Barlow Condensed e IBM Plex Mono, empacotadas localmente. A narrativa retoma a estação e a missão “O serviço que não se lembra” do Bash Quest original.

### Biblioteca `man` e habilidades

Cada personagem adquire `man` e as ferramentas de um setor ao acessar seu terminal pela primeira vez. As habilidades aparecem individualmente como **NOVO**, sem interromper a digitação; reabrir ou carregar não repete a conquista. A biblioteca mostra apenas fichas adquiridas, mas o terminal não restringe a prática livre. Digite `man` ou `man pwd` no terminal para abrir a biblioteca ou uma ficha; use Voltar ou Esc para retornar. A aba Manual também preserva o texto não enviado do terminal. Partidas antigas recebem silenciosamente as fichas dos setores já alcançados, sem alterar seus arquivos ou progresso.
