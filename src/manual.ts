import { chapters, manual, type Save } from './campaign'

// Cards describe only the subset implemented by the station's simulator.
const details: Record<string, [string, string, string, string, string]> = {
  man: ['Abre esta biblioteca de fichas adquiridas.', 'man [tópico]', 'man pwd', 'Abre a ficha de pwd; sem tópico, lista as fichas.', 'O tópico precisa ter sido adquirido; man não é executado dentro de scripts.'],
  pwd: ['Mostra a pasta atual.', 'pwd', 'pwd', 'Exibe um caminho como /ark/cabine.', 'Não recebe argumentos.'],
  ls: ['Lista nomes de uma pasta.', 'ls [pasta]', 'ls /ark/cabine', 'Lista os arquivos da cabine, um por linha.', 'Opções como -l não estão disponíveis no simulador.'],
  cat: ['Mostra o conteúdo de arquivos.', 'cat arquivo', 'cat /ark/cabine/turno.log', 'Lê o registro indicado e imprime seu conteúdo.', 'Uma pasta não é um arquivo; arquivo vazio não imprime nada.'],
  cd: ['Muda a pasta atual.', 'cd [pasta]', 'cd /ark/cabine', 'Passa a trabalhar na pasta indicada.', 'Confira se a pasta existe; cd sem argumento vai a /ark.'],
  '..': ['Representa a pasta acima da atual.', 'cd ..', 'cd ..', 'Sobe um nível a partir da pasta atual.', '.. não é um comando independente.'],
  mkdir: ['Cria pastas.', 'mkdir pasta', 'mkdir /ark/cabine/rascunhos', 'Cria rascunhos dentro da cabine.', 'A pasta pai deve existir e o nome novo não pode existir.'],
  cp: ['Copia arquivos preservando a origem.', 'cp origem destino', 'cp /ark/cabine/turno.log /ark/cabine/copia.log', 'Cria uma cópia do registro.', 'Confira o destino: um arquivo existente é substituído.'],
  mv: ['Move ou renomeia arquivos.', 'mv origem destino', 'mv /ark/cabine/copia.log /ark/cabine/arquivo.log', 'Renomeia a cópia, se ela existir.', 'Diferente de cp, remove a origem; pode substituir o destino.'],
  grep: ['Busca linhas que correspondem a um padrão.', 'grep padrão arquivo', 'grep queda /ark/cabine/turno.log', 'Mostra linhas que contêm queda.', 'Sem correspondência retorna status 1; o padrão é expressão regular.'],
  '>': ['Redireciona saída, substituindo o arquivo. Sem comando à esquerda, esvazia o arquivo.', 'comando > arquivo  |  > arquivo', 'echo teste > /ark/cabine/nota.txt\n> /ark/cabine/nota.txt', 'Cria nota.txt com teste e depois o esvazia para 0 bytes.', 'Apaga o conteúdo anterior do destino; em scripts, use > arquivo no início para não acumular linhas antigas.'],
  echo: ['Produz uma linha de texto.', 'echo texto', 'echo teste', 'Imprime teste no terminal.', 'Use aspas para manter espaços em argumentos de outros comandos.'],
  '>>': ['Acrescenta saída ao fim de um arquivo.', 'comando >> arquivo', 'echo outra >> /ark/cabine/nota.txt', 'Acrescenta outra linha à nota, criando-a se necessário.', 'Não confunda com >, que substitui o conteúdo.'],
  bash: ['Executa um arquivo de script.', 'bash arquivo.sh', 'bash /ark/cabine/exemplo.sh', 'Executa as linhas do arquivo, se ele tiver sido criado.', 'Salve o script primeiro; apenas recursos do simulador funcionam.'],
  variáveis: ['Guardam valores para uso posterior.', 'nome=valor; echo "$nome"', 'nome="turno.log"\ncat "$nome"', 'Guarda um nome e lê esse arquivo na pasta atual.', 'Não coloque espaços em torno de =; cite a expansão com aspas.'],
  if: ['Escolhe um bloco conforme o status do teste.', 'if teste; then ...; else ...; fi', 'if [ -s /ark/cabine/turno.log ]; then\n  echo presente\nelse\n  echo vazio\nfi', 'Imprime presente se o registro tiver conteúdo.', 'Separe os colchetes com espaços e feche o bloco com fi.'],
  '-s': ['Testa se um arquivo tem conteúdo.', '[ -s arquivo ]', '[ -s /ark/cabine/turno.log ]', 'Retorna status 0 se houver conteúdo; não imprime texto.', 'Status 1 também ocorre para arquivo ausente.'],
  for: ['Repete um bloco para cada valor.', 'for nome in lista; do ...; done', 'for item in um dois; do\n  echo "$item"\ndone', 'Imprime um e depois dois.', 'Feche o bloco com done e use aspas ao expandir nomes.'],
  '*': ['Expande um padrão em nomes correspondentes.', 'comando pasta/*.extensão', 'cat /ark/cabine/*.log', 'Lê os arquivos .log da cabine.', 'Aspas em volta do * impedem a expansão; sem correspondência o padrão permanece literal.'],
}
export const topics = Object.keys(details)
export const card = (topic: string) => details[topic]
export const summary = (topic: string) => details[topic]?.[0] ?? manual[topic]?.[0] ?? ''
export function acquire(s: Save, sector: number): string[] {
  const gained = ['man', ...chapters[sector].tools].filter((topic) => !s.library.includes(topic))
  s.library.push(...gained)
  return gained
}
