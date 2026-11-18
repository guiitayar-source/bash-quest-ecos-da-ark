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
  await title('Manual de campo')
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
  await command('pwd')
  await command('ls')
  await expect(page.locator('#saved')).toHaveText('Salvo localmente')
  await page.reload()
  await continueLatest(page)
  await title('Terminal de bordo')
  await expect(page.locator('#output')).toContainText('mensagem.txt')
  await command('cat mensagem.txt')
  await leave()
  await approach(314, 144, 'Falar com Noah')
  await page.getByRole('button', { name: 'Vou verificar o circuito' }).click()
  await next(1)
  await approach(115, 135, 'Painel de distribuição')
  await title('Painel de distribuição')
  await leave()
  await openTerminal()
  await command('cd circuitos')
  await command('cat c07.log')
  await leave()
  await approach(115, 135, 'Painel de distribuição')
  await page.getByRole('button', { name: 'Relé âmbar' }).click()
  await next(2)
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
  await editor(
    'rotina.sh',
    'fonte=turno.txt\ncat "$fonte" > boletim.txt\necho pronto >> boletim.txt',
    true,
  )
  await next(5)
  await openTerminal()
  await command('cat amostra.frag')
  await command('cat reserva.frag')
  await editor(
    'triagem.sh',
    'if [ -s amostra.frag ]; then\n echo legível > estado.txt\nelse\n echo vazio > estado.txt\nfi',
  )
  await next(6)
  await openTerminal()
  await command('ls fragmentos')
  await command('cat fragmentos/*.frag')
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
  expect(errors).toEqual([])
})

test('importa a campanha anterior e mantém dicas e recuperação de arquivos', async ({
  page,
}) => {
  await page.addInitScript((state) => {
    localStorage.setItem('bash-quest.ecos.v1', JSON.stringify(state))
  }, fresh())
  await page.goto('/')
  await page.getByRole('button', { name: /Carregar partida/ }).click()
  await page.getByRole('button', { name: /Campanha original/ }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'ls', exact: true }).click()
  await expect(page.locator('dialog')).toContainText('Lista os nomes')
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
