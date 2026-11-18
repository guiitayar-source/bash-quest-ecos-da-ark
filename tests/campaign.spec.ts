import { test, expect, type Page } from '@playwright/test'
import { fresh } from '../src/campaign'

async function newGame(page: Page, name: string) {
  await page.getByRole('button', { name: /Novo jogo/ }).click()
  await page.getByLabel('Nome', { exact: true }).fill(name)
  await page.getByRole('radio', { name: 'Jade' }).check()
  await page.getByRole('button', { name: 'Começar jornada' }).click()
  await expect(page.locator('canvas')).toBeVisible()
}

async function continueLatest(page: Page) {
  await page.getByRole('button', { name: /Continuar/ }).click()
}
test('a campanha inteira pode ser concluída pela interface e retomada no editor', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ecos da ARK' })).toBeVisible()
  await newGame(page, 'Mara')
  await expect(
    page.getByRole('heading', { name: 'Cabine de despertar' }),
  ).toBeVisible()
  await expect(page.locator('#mission')).toBeVisible()
  await page.screenshot({ path: 'test-results/cabine.png', fullPage: true })
  const title = (name: string) =>
    expect(page.locator('#dialog-title')).toHaveText(name)
  const clickFloor = async (x: number, y: number) => {
    const canvas = page.locator('canvas')
    const b = await canvas.boundingBox()
    if (!b) throw Error('Visor ausente')
    await canvas.click({
      position: { x: (x * b.width) / 480, y: (y * b.height) / 270 },
    })
  }
  const approach = async (x: number, y: number, name: string) => {
    await clickFloor(x, y)
    await expect(page.locator('#interact button')).toContainText(name, {
      timeout: 6500,
    })
    await page.keyboard.press('e')
  }
  const command = async (line: string) => {
    await page.locator('#command').fill(line)
    await page.locator('#command').press('Enter')
  }
  const leave = async () => {
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog')).not.toBeVisible()
  }
  const next = async (i: number) => {
    await title(
      [
        'O despertar',
        'O corredor apagado',
        'O arquivo disperso',
        'Vozes no ruído',
        'Uma rotina para amanhã',
        'O pulso do fragmento',
      ][i - 1],
    )
    await page.getByRole('button', { name: 'Continuar exploração' }).click()
    // Walk clear of equipment before heading to the starboard airlock.
    await clickFloor(317, 149)
    await page.waitForTimeout(2700)
    await approach(411, 144, 'Corredor de manutenção')
    await expect(page.locator('#title')).toHaveText('Corredor de manutenção')
    await approach(
      70 + i * 56,
      119,
      ['Cabine', 'Energia', 'Arquivo', 'Rádio', 'Oficina', 'Triagem', 'Núcleo'][
        i
      ],
    )
    await expect(page.locator('#sector')).toHaveText('SETOR 0' + (i + 1))
  }
  const openTerminal = async () => {
    await approach(260, 123, 'Acessar terminal')
    await title('Terminal de bordo')
  }
  const editor = async (name: string, body: string, restore = false) => {
    await page.getByRole('button', { name: 'Editor de script' }).click()
    await page.locator('#filename').fill(name)
    await page.locator('#code').fill(body)
    if (restore) {
      await expect(page.locator('#saved')).toHaveText('Salvo localmente')
      await page.reload()
      await continueLatest(page)
      await title('Editor de script')
      await expect(page.locator('#code')).toHaveValue(body)
    }
    await page.getByRole('button', { name: 'Salvar arquivo' }).click()
    await title('Terminal de bordo')
    await command('bash ' + name)
  }
  await page.getByRole('button', { name: 'Manual', exact: true }).click()
  await title('man · Biblioteca do operador')
  await leave()
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(100)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('e')
  await title('Lara')
  await expect(page.locator('.npc-talk')).toContainText('Mara')
  await page.getByRole('button', { name: 'O que aconteceu lá fora?' }).click()
  await expect(page.locator('.npc-talk')).toContainText('Colapso')
  await page.getByRole('button', { name: 'Como posso ajudar?' }).click()
  await page.getByRole('button', { name: 'Vou falar com Noah' }).click()
  await approach(314, 144, 'Falar com Noah')
  await title('Noah')
  await page
    .getByRole('button', { name: 'Nunca usei esse terminal. Como começo?' })
    .click()
  await page.getByRole('button', { name: 'Vou tentar no terminal' }).click()
  await openTerminal()
  await expect(page.locator('.discoveries')).toContainText('NOVO · man')
  await expect(page.locator('.discoveries')).toContainText('NOVO · pwd')
  await page.screenshot({ path: 'test-results/man-conquista.png', fullPage: true })
  await command('man for')
  await expect(page.locator('.command-feedback')).toContainText('Ficha não adquirida')
  await command('echo prática livre')
  await expect(page.locator('#output')).toContainText('prática livre')
  await command('man')
  await expect(page.locator('#dialog-title')).toHaveText('man · Biblioteca do operador')
  await expect(page.locator('dialog')).not.toContainText('Repete um bloco para cada valor')
  await page.keyboard.press('Escape')
  await command('man pwd')
  await expect(page.locator('#dialog-title')).toHaveText('man · pwd')
  await expect(page.locator('dialog')).toContainText('Erro comum:')
  await page.screenshot({ path: 'test-results/man-ficha.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.locator('#command').fill('ls')
  await page.locator('dialog').getByRole('button', { name: 'Manual', exact: true }).click()
  await page.getByRole('button', { name: 'Voltar ao terminal' }).click()
  await expect(page.locator('#command')).toHaveValue('ls')
  await command('pwd')
  await command('ls')
  await expect(page.locator('#saved')).toHaveText('Salvo localmente')
  await page.reload()
  await continueLatest(page)
  await title('Terminal de bordo')
  await expect(page.locator('#output')).toContainText('mensagem.txt')
  await expect(page.locator('.discoveries')).toHaveCount(0)
  await command('cat mensagem.txt')
  await leave()
  await approach(314, 144, 'Falar com Noah')
  await page.getByRole('button', { name: 'Vou verificar o circuito' }).click()
  await next(1)
  await expect(page.locator('#mission')).toBeHidden()
  await expect(page.locator('#operator')).toBeHidden()
  await expect(page.locator('#toolbox')).toBeHidden()
  await page.getByRole('button', { name: 'Dica', exact: true }).click()
  await expect(page.locator('dialog')).toContainText('Examine a máquina')
  await leave()
  await expect(page.locator('#interact button').filter({ hasText: 'Examinar painel' })).toHaveCount(0)
  await approach(115, 135, 'Examinar painel')
  await title('Painel de distribuição')
  await leave()
  await page.keyboard.press('j')
  await expect(page.locator('dialog')).toContainText('etiqueta do painel identifica o circuito C07')
  await leave()
  await expect(page.locator('#saved')).toHaveText('Salvo localmente')
  await page.reload()
  await continueLatest(page)
  await page.keyboard.press('j')
  await expect(page.locator('dialog')).toContainText('etiqueta do painel identifica o circuito C07')
  await leave()
  await page.screenshot({ path: 'test-results/energia-painel.png', fullPage: true })
  await openTerminal()
  await command('cd circuitos')
  await command('cat c07.log')
  await leave()
  await approach(115, 135, 'Examinar painel')
  await page.getByRole('button', { name: 'Relé âmbar' }).click()
  await expect(page.locator('dialog')).not.toBeVisible()
  await expect(page.locator('#energy-objective')).toHaveText('Energia restaurada')
  await expect(page.locator('#mission')).toBeHidden()
  // Capture the sequence after several lamps have lit, before the success dialog.
  await page.waitForTimeout(1300)
  await expect(page.locator('dialog')).not.toBeVisible()
  await page.screenshot({ path: 'test-results/energia-restaurando.png', fullPage: true })
  await next(2)
  await expect(page.locator('#mission')).toBeVisible()
  await expect(page.locator('#operator')).toBeVisible()
  await openTerminal()
  await command('mkdir resgate')
  await command('cp equipe/*.txt resgate')
  await command('mv achados/rota.txt navegacao')
  await expect(page.getByRole('dialog').locator('.tguide')).toContainText(
    'Cópia para a enfermaria',
  )
  await command('cp equipe/iara.txt enfermaria/iara.txt')
  await next(3)
  await openTerminal()
  await command('grep SOS sinais.log')
  await command('echo recebido')
  await expect(page.locator('.radio-tip')).toContainText(
    'grep SOS sinais.log > contato.txt',
  )
  await command('grep SOS sinais.log > contato.txt')
  await expect(page.locator('.radio-tip')).toContainText(
    'echo recebido >> contato.txt',
  )
  await command('echo recebido > contato.txt')
  await expect(page.locator('.radio-tip')).toContainText(
    'contato.txt começa com recebido',
  )
  await command('grep SOS sinais.log > contato.txt')
  await command('echo recebido >> contato.txt')
  await expect(page.getByRole('dialog').locator('.tguide')).toContainText(
    'Teste de alcance',
  )
  await command('ls remessas')
  await command('mkdir escuta')
  await command('grep "SINAL OK" remessas/antena.log > escuta/transmissao.txt')
  await command('echo inspecionado >> escuta/transmissao.txt')
  await next(4)
  await openTerminal()
  await expect(
    page.getByRole('button', { name: 'Editor de script' }),
  ).toHaveCount(0)
  await command('cat turno.txt > previa.txt')
  await command('echo pronto >> previa.txt')
  await expect(page.locator('.tguide')).toContainText('Troca de turno')
  await expect(page.locator('#saved')).toHaveText('Salvo localmente')
  await page.reload()
  await continueLatest(page)
  await expect(page.locator('.tguide')).toContainText('Troca de turno')
  await command('cat "turno noturno.txt" > previa-noturna.txt')
  await command('echo pronto >> previa-noturna.txt')
  await expect(page.locator('.tguide')).toContainText('Guardando nomes em variáveis')
  await command('fonte="turno noturno.txt"')
  await command('cat "$fonte"')
  await expect(page.locator('.tguide')).toContainText('Reiniciando antes de repetir')
  await command('cat turno.txt > rascunho.txt')
  await command('> rascunho.txt')
  await editor(
    'rotina.sh',
    'fonte=turno.txt\ncat "$fonte" > boletim.txt\necho pronto >> boletim.txt',
    true,
  )
  await next(5)
  await openTerminal()
  await command('cat amostra.frag')
  await command('cat reserva.frag')
  await expect(page.locator('.tguide')).toContainText('Testando o pulso no terminal')
  await command('[ -s amostra.frag ]')
  await command('[ -s reserva.frag ]')
  await expect(page.locator('.tguide')).toContainText('Primeiro bloco condicional')
  await command('if [ -s amostra.frag ]; then echo pulso > checagem.txt; fi')
  await editor(
    'triagem.sh',
    'if [ -s amostra.frag ]; then\n echo legível > estado.txt\nelse\n echo vazio > estado.txt\nfi',
  )
  await next(6)
  await openTerminal()
  await expect(page.locator('.term-explorer')).toBeVisible()
  await page.locator('#command').fill('cat fragment')
  await page.locator('#command').press('Tab')
  await expect(page.locator('#command')).toHaveValue('cat fragmentos/')
  await page.locator('#command').fill('')
  await command('ls fragmentos')
  await command('cat fragmentos/*.frag')
  await expect(page.locator('.tguide')).toContainText('Percorrendo arquivos com for')
  await command('for arq in fragmentos/*.frag; do cat "$arq"; done')
  await editor(
    'recuperar.sh',
    '> memoria.txt\n> relatorio.txt\nfor arquivo in fragmentos/*.frag; do\n if [ -s "$arquivo" ]; then\n  cat "$arquivo" >> memoria.txt\n  echo "$arquivo" >> relatorio.txt\n fi\ndone',
  )
  await page.getByRole('button', { name: 'Continuar exploração' }).click()
  await title('A ARK se lembra')
  await expect(page.locator('dialog')).toContainText('Noah: encontramos')
  await leave()
  await expect(page.locator('#route-count')).toHaveText(
    '7 de 7 setores restaurados',
  )
  await openTerminal()
  await command('bash recuperar.sh')
  await leave()
  await expect(page.locator('#operator')).toContainText('700 XP')
  await page.getByRole('button', { name: /SETOR 03/ }).click()
  await page.getByRole('button', { name: 'Ir para este setor' }).click()
  await expect(page.locator('#title')).toHaveText('Arquivo da tripulação')
  expect(errors).toEqual([])
})

test('importa a campanha anterior e mantém dicas e recuperação de arquivos', async ({
  page,
}) => {
  await page.addInitScript((state) => {
    localStorage.setItem('bash-quest.ecos.v1', JSON.stringify(state))
  }, { ...fresh(), library: undefined })
  await page.goto('/')
  await page.getByRole('button', { name: /Carregar partida/ }).click()
  await page.getByRole('button', { name: /Campanha original/ }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'ls', exact: true }).click()
  await expect(page.locator('dialog')).toContainText('Lista nomes')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Consultar dica' }).click()
  await page.getByRole('button', { name: 'Revelar próxima dica' }).click()
  await expect(page.locator('dialog')).toContainText('pwd')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Acessar terminal' }).click()
  await page.locator('#command').fill('echo teste > mensagem.txt')
  await page.locator('#command').press('Enter')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Controles do jogo' }).click()
  await page
    .getByRole('button', { name: 'Restaurar arquivos deste setor' })
    .click()
  await page
    .getByRole('button', { name: 'Restaurar setor', exact: true })
    .click()
  await page.getByRole('button', { name: 'Acessar terminal' }).click()
  await page.locator('#command').fill('cat mensagem.txt')
  await page.locator('#command').press('Enter')
  await expect(page.locator('#output')).toContainText('ARK ainda respira')
})

test('Energia respeita movimento reduzido e permanece restaurada ao carregar', async ({ page }) => {
  const state = fresh()
  Object.assign(state, { room: 1, completed: 1, x: 132, y: 148, seen: ['label', 'circuit'] })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript((save) => {
    localStorage.setItem('bash-quest.ecos.v1', JSON.stringify(save))
  }, state)
  await page.goto('/')
  await page.getByRole('button', { name: /Carregar partida/ }).click()
  await page.getByRole('button', { name: /Campanha original/ }).click()
  await expect(page.locator('#mission')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Dica', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Dica', exact: true }).click()
  await expect(page.locator('dialog')).toContainText('Examine a máquina')
  await page.keyboard.press('Escape')
  await page.keyboard.press('m')
  await expect(page.locator('#dialog-title')).toHaveText('man · Biblioteca do operador')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Controles do jogo' }).click()
  await expect(page.locator('#dialog-title')).toHaveText('Controles da estação')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Examinar painel/ }).click()
  await page.getByRole('button', { name: 'Relé âmbar' }).click()
  await expect(page.locator('dialog')).not.toBeVisible()
  await expect(page.locator('#dialog-title')).toHaveText('O corredor apagado')
  await page.getByRole('button', { name: /Continuar exploração/ }).click()
  await expect(page.locator('#saved')).toHaveText('Salvo localmente')
  await page.reload()
  await continueLatest(page)
  await expect(page.locator('#energy-objective')).toHaveText('Energia restaurada')
  await page.getByRole('button', { name: /Examinar painel/ }).click()
  await expect(page.locator('dialog')).toContainText('painel está energizado')
  await expect(page.getByRole('button', { name: /Relé âmbar/ })).toHaveCount(0)
})

test('salva e carrega dois personagens independentes', async ({ page }) => {
  await page.goto('/')
  await newGame(page, 'Nara')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: /Salvar partida/ }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Partida salva.' }),
  ).toBeVisible()
  await newGame(page, 'Raul')
  await expect(page.locator('#operator')).toContainText('Raul')
  await page.reload()
  await page.getByRole('button', { name: /Carregar partida/ }).click()
  await expect(page.getByRole('button', { name: /Raul/ })).toBeVisible()
  await page.getByRole('button', { name: /Nara/ }).click()
  await expect(page.locator('#operator')).toContainText('Nara')
})

test('perfil Dev dispensa práticas e permite excluir partida salva', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Novo jogo/ }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Caio')
  await page.getByRole('radio', { name: /Dev/ }).check()
  await page.getByRole('button', { name: 'Começar jornada' }).click()
  await expect(page.locator('#operator')).toContainText('Dev')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: /Carregar partida/ }).click()
  await expect(page.getByRole('button', { name: /Caio/ })).toBeVisible()
  await page.getByRole('button', { name: 'Excluir' }).first().click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('button', { name: /Caio/ })).toHaveCount(0)
})
