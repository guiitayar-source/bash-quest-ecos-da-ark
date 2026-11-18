import Phaser from 'phaser'
import { chapters, type Save } from './campaign'
import { crew, suits, type NPC } from './story'
export type Spot = {
  kind: 'terminal' | 'machine' | 'airlock' | 'port' | 'log' | 'npc'
  x: number
  y: number
  name: string
  index?: number
  npc?: NPC
}
export function points(s: Save): Spot[] {
  if (s.room === -1)
    return chapters.map((c, i) => ({
      kind: 'port',
      x: 70 + i * 56,
      y: 128,
      name: c.short,
      index: i,
    }))
  const people: NPC[] =
    s.room === 0
      ? ['lara', 'noah']
      : [[3, 5, 6].includes(s.room) ? 'lara' : 'noah']
  return [
    ...people.map((npc): Spot => ({
      ...crew[npc],
      kind: 'npc',
      npc,
      name: 'Falar com ' + crew[npc].name,
    })),
    { kind: 'terminal', x: 260, y: 132, name: 'Terminal de bordo' },
    {
      kind: 'machine',
      x: 113,
      y: 145,
      name: s.room === 1 ? 'Examinar painel' : 'Inspecionar máquina',
    },
    { kind: 'airlock', x: 413, y: 149, name: 'Corredor de manutenção' },
    {
      kind: 'log',
      x: 358,
      y: 193,
      name:
        s.room === 6 && s.completed === 7
          ? 'Arquivo recuperado'
          : 'Registro da tripulação',
    },
  ]
}
export function nearby(s: Save) {
  return points(s)
    .map((p) => ({ p, d: Math.hypot(p.x - s.x, p.y - s.y) }))
    .filter((a) => a.d < 34)
    .sort((a, b) => a.d - b.d)[0]?.p
}
const blocked = (room: number, x: number, y: number) => {
  if (x < 45 || x > 434 || y < 119 || y > 211) return true
  if (room === -1)
    return (
      y < 130 ||
      (x < 83 && y > 172 && y < 197) ||
      (x > 365 && y > 166 && y < 204)
    )
  return (
    (x < 130 && y < 188) ||
    (x > 224 && x < 298 && y < 135) ||
    (x > 347 && x < 403 && y > 159 && y < 193) ||
    (x > 392 && y < 146)
  )
}
export function bootWorld(
  container: HTMLElement,
  s: Save,
  paused: () => boolean,
  changed: (moved: boolean) => void,
) {
  let sc: Station | undefined
  class Station extends Phaser.Scene {
    private bg!: Phaser.GameObjects.Image
    private shadow!: Phaser.GameObjects.Ellipse
    private actor!: Phaser.GameObjects.Image
    private visitors!: Record<
      NPC,
      { sprite: Phaser.GameObjects.Image; tag: Phaser.GameObjects.Text }
    >
    private glow!: Phaser.GameObjects.Graphics
    private markers!: Phaser.GameObjects.Graphics
    private keys = new Set<string>()
    private face = 1
    private tick = 0
    private last = ''
    private lastSpot = ''
    private target?: { x: number; y: number }
    private energyStart = -1
    private reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    restoreEnergy() {
      this.energyStart = this.time.now
    }
    preload() {
      for (let n = -1; n < 7; n++)
        for (let active = 0; active < (n === -1 ? 8 : 2); active++) {
          const id = 'room-' + n + '-' + active
          this.load.image(id, '/art/' + id + '.png')
        }
      for (const suit of suits)
        for (let i = 0; i < 3; i++)
          this.load.image(
            suit.id + i,
            '/art/player-' + suit.id + '-' + i + '.png',
          )
      for (const npc of ['lara', 'noah'] as const)
        this.load.image(npc, '/art/npc-' + npc + '.png')
    }
    create() {
      sc = this
      // The exploration layout can resize without a window resize when rooms change.
      const observer = new ResizeObserver(() => this.scale.refresh())
      observer.observe(container)
      this.events.once('shutdown', () => observer.disconnect())
      this.bg = this.add.image(0, 0, 'room-0-0').setOrigin(0)
      this.glow = this.add.graphics()
      this.shadow = this.add.ellipse(s.x, s.y, 16, 5, 0x101a22, 0.65)
      this.actor = this.add.image(s.x, s.y, 'ochre1').setOrigin(0.5, 0.92)
      const visitor = (npc: NPC) => {
        const { x, y, name } = crew[npc]
        return {
          sprite: this.add.image(x, y, npc).setOrigin(0.5, 0.92),
          tag: this.add
            .text(x, y - 27, name, {
              fontFamily: 'monospace',
              fontSize: '8px',
              color: '#f5dca6',
              backgroundColor: '#17201f',
              padding: { x: 3, y: 1 },
            })
            .setOrigin(0.5, 1)
            .setDepth(400),
        }
      }
      this.visitors = { lara: visitor('lara'), noah: visitor('noah') }
      this.markers = this.add.graphics().setDepth(500)
      const moveKeys = [
        'a',
        'w',
        's',
        'd',
        'arrowleft',
        'arrowright',
        'arrowup',
        'arrowdown',
      ]
      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase()
        if (!paused() && moveKeys.includes(key)) {
          e.preventDefault()
          this.keys.add(key)
          this.target = undefined
        }
      })
      window.addEventListener('keyup', (e) =>
        this.keys.delete(e.key.toLowerCase()),
      )
      window.addEventListener('blur', () => {
        this.keys.clear()
        this.target = undefined
      })
      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (paused()) return
        const pt = points(s).find(
          (q) => Math.hypot(p.x - q.x, p.y - (q.y - 10)) < 27,
        )
        this.target = pt
          ? {
              x: pt.kind === 'machine' ? 132 : pt.x,
              y: pt.kind === 'machine' ? 148 : Math.max(pt.y + 8, 140),
            }
          : { x: p.x, y: p.y }
      })
      this.refresh()
      changed(false)
    }
    refresh() {
      this.last = s.room + ':' + s.completed
      this.target = undefined
      this.keys.clear()
      this.bg.setTexture(
        'room-' +
          s.room +
          '-' +
          (s.room === -1
            ? Math.min(7, s.completed)
            : Number(s.completed > s.room)),
      )
      this.actor.setPosition(s.x, s.y)
      const visitors = points(s).filter((spot) => spot.kind === 'npc')
      for (const npc of ['lara', 'noah'] as const) {
        const visible = visitors.some((spot) => spot.npc === npc)
        this.visitors[npc].sprite.setVisible(visible).setDepth(crew[npc].y)
        this.visitors[npc].tag.setVisible(visible)
      }
      this.shadow.setPosition(s.x, s.y)
      this.lastSpot = ''
    }
    update(time: number, dt: number) {
      if (!this.actor) return
      if (paused()) {
        this.keys.clear()
        this.target = undefined
      }
      const k = this.keys,
        state = s.room + ':' + s.completed
      if (state !== this.last) this.refresh()
      let dx =
        Number(k.has('d') || k.has('arrowright')) -
        Number(k.has('a') || k.has('arrowleft'))
      let dy =
        Number(k.has('s') || k.has('arrowdown')) -
        Number(k.has('w') || k.has('arrowup'))
      if (this.target && !paused()) {
        const a = this.target.x - s.x,
          b = this.target.y - s.y
        if (Math.hypot(a, b) < 2) this.target = undefined
        else {
          dx = a
          dy = b
        }
      }
      const mag = Math.hypot(dx, dy)
      let moved = false
      if (mag && !paused()) {
        const speed = Math.min(35, dt) * 0.091,
          x = s.x + (dx / mag) * speed,
          y = s.y + (dy / mag) * speed
        const ox = s.x,
          oy = s.y
        if (!blocked(s.room, x, s.y)) s.x = x
        if (!blocked(s.room, s.x, y)) s.y = y
        moved = s.x !== ox || s.y !== oy
        if (!moved) this.target = undefined
        if (dx) this.face = Math.sign(dx)
      }
      this.actor
        .setTexture(
          (s.story?.player.suit ?? 'ochre') +
            (moved ? Math.floor(time / 140) % 3 : 1),
        )
        .setDepth(s.y)
        .setFlipX(this.face < 0)
        .setPosition(Math.round(s.x), Math.round(s.y))
      this.shadow.setPosition(Math.round(s.x), Math.round(s.y))
      const p = nearby(s),
        id = p?.name || ''
      if (id !== this.lastSpot || (moved && time - this.tick > 350)) {
        this.lastSpot = id
        this.tick = time
        changed(moved)
      }
      this.markers.clear()
      this.glow.clear()
      const bob = this.reduced.matches ? 0 : Math.floor(Math.sin(time / 340) * 1.2)
      for (const q of points(s)) {
        const active =
          q.kind === 'port'
            ? q.index === s.completed
            : q.kind === 'npc'
              ? s.room === 0 &&
                (q.npc === 'lara'
                  ? s.story?.step === 'wake'
                  : s.story?.step === 'meet-noah' ||
                    s.story?.step === 'debrief')
              : q.kind === 'terminal' &&
                s.room >= s.completed &&
                (s.room !== 0 || !s.story || s.story.step === 'terminal')
        if (!active) continue
        const x = q.x,
          y = q.y - (q.kind === 'terminal' ? 51 : 46) + bob
        this.markers.fillStyle(0x131e25).fillPoints(
          [
            { x: x - 6, y },
            { x, y: y - 6 },
            { x: x + 6, y },
            { x, y: y + 6 },
          ],
          true,
        )
        this.markers.fillStyle(0xc2f38b).fillPoints(
          [
            { x: x - 4, y },
            { x, y: y - 4 },
            { x: x + 4, y },
            { x, y: y + 4 },
          ],
          true,
        )
        this.markers
          .fillStyle(0x273926)
          .fillRect(x - 1, y - 2, 2, 3)
          .fillRect(x - 1, y + 2, 2, 1)
      }
      if (s.room >= 0) {
        if (s.room === 1 && s.completed <= 1) {
          // A restrained fault indicator on the distribution panel.
          this.glow.fillStyle(0xe7a65f, this.reduced.matches ? 0.65 : 0.45 + 0.2 * Math.sin(time / 900))
            .fillRect(106, 112, 3, 2)
        }
        for (let i = 8; i > 0; i--)
          this.glow
            .fillStyle(0x77ecaa, 0.014)
            .fillEllipse(260, 123, 6 + i * 7, 4 + i * 3)
        this.glow
          .fillStyle(0xc4ffb8, this.reduced.matches ? 0.75 : 0.6 + 0.3 * Math.sin(time / 450))
          .fillRect(239, 101, 4, 1)
        if (s.completed > s.room && s.room === 1) {
          const elapsed = this.energyStart < 0 ? Infinity : time - this.energyStart
          const count = this.reduced.matches ? 6 : Math.min(6, Math.floor(elapsed / 320) + 1)
          for (let i = 0; i < count; i++)
            this.glow.fillStyle(0xd5f8a9, 0.9).fillRect(113 + i * 60, 151, 6, 3)
        } else if (s.completed > s.room)
          for (let i = 0; i < 5; i++)
            this.glow
              .fillStyle(0xcaeaa4, this.reduced.matches ? 0.5 : 0.32 + 0.3 * Math.sin(time / 420 - i))
              .fillRect(65 + i * 72, 219, 10, 1)
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: container,
    width: 480,
    height: 270,
    pixelArt: true,
    antialias: false,
    backgroundColor: '#091016',
    banner: false,
    audio: { noAudio: true },
    scene: Station,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  })
  return { refresh: () => sc?.refresh(), restoreEnergy: () => sc?.restoreEnergy(), game }
}
