import { chapters, FINAL_CHAPTER, TOTAL_CHAPTERS, type Save } from './campaign'
import { path, parent } from './shell'

const NON_CMD_TOPICS = new Set([
  '..',
  '>',
  '>>',
  '|',
  'variáveis',
  '-s',
  '-f',
  '-d',
  '*',
  '$1',
  './',
  'elif',
])

export function operatorRank(completed: number): string {
  return (
    [
      'Recém-resgatado',
      'Batedor de Corredor',
      'Técnico de Linha',
      'Arquivista de Campo',
      'Operador de Rádio',
      'Curador de Inventário',
      'Analista de Sensores',
      'Cartógrafo de Dutos',
      'Engenheiro de Turno',
      'Especialista de Controle',
      'Inspetor de Triagem',
      'Guardião de Quarentena',
      'Guardião da ARK',
    ][Math.min(TOTAL_CHAPTERS, Math.max(0, completed))] ?? 'Operador'
  )
}

export interface DiskEntry {
  name: string
  relPath: string
  isDir: boolean
  size: number
}

export function diskEntries(s: Save, dir = s.cwd): DiskEntry[] {
  const prefix = dir === '/' ? '/' : dir + '/'
  const items: DiskEntry[] = []
  for (const [k, v] of Object.entries(s.disk)) {
    if (k === '/' || parent(k) !== dir) continue
    const name = k.slice(prefix.length)
    if (name.startsWith('.')) continue
    items.push({
      name,
      relPath: name,
      isDir: v === null,
      size: typeof v === 'string' ? v.length : 0,
    })
  }
  return items.sort((a, b) =>
    a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
  )
}

export function bashLint(source: string): string[] {
  const warnings: string[] = []
  const lines = source.split(/\r?\n/)
  let ifCount = 0
  let fiCount = 0
  let forCount = 0
  let doneCount = 0
  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (/^[A-Za-z_]\w*\s+=/.test(line) || /^[A-Za-z_]\w*=\s+\S/.test(line)) {
      warnings.push(
        `Linha ${idx + 1}: não deixe espaços em volta do "=" ao criar variáveis (ex.: fonte="turno.txt").`,
      )
    }
    if (/\[[^\s\]]/.test(line) || /[^\s\[]\]/.test(line)) {
      warnings.push(
        `Linha ${idx + 1}: deixe um espaço após "[" e antes de "]" no teste (ex.: [ -s "$arquivo" ]).`,
      )
    }
    if (/^(if|elif)\s+/.test(line) && !/;\s*then\b/.test(line)) {
      const next = lines[idx + 1]?.trim() ?? ''
      if (next !== 'then') {
        const kw = line.startsWith('elif') ? 'elif' : 'if'
        warnings.push(
          `Linha ${idx + 1}: o bloco "${kw}" precisa de "; then" (ou "then" na linha seguinte).`,
        )
      }
    }
    if (/^if\b/.test(line)) ifCount++
    if (/^fi\b/.test(line) || /;\s*fi\b/.test(line)) fiCount++
    if (/^for\b/.test(line)) forCount++
    if (/^done\b/.test(line) || /;\s*done\b/.test(line)) doneCount++
    const unquotedVar =
      /(^|[^"\\'])\$([A-Za-z_]\w*|\d)/.test(line) &&
      !/=/.test(line.split(/\s+/)[0] || '')
    if (unquotedVar && !/^\s*#/.test(line)) {
      warnings.push(
        `Linha ${idx + 1}: envolva a variável com aspas ("$nome" ou "$1") para não quebrar em arquivos com espaço.`,
      )
    }
  }
  if (ifCount > fiCount) warnings.unshift('Há um bloco "if" aberto sem "fi" no final.')
  if (forCount > doneCount) warnings.unshift('Há um laço "for" aberto sem "done" no final.')
  return [...new Set(warnings)].slice(0, 4)
}

function commonPrefix(values: string[]): string {
  if (!values.length) return ''
  let prefix = values[0]
  for (let i = 1; i < values.length; i++) {
    while (!values[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1)
      if (!prefix) return ''
    }
  }
  return prefix
}

export function completeCommand(
  s: Save,
  raw: string,
): { value: string; options: string[] } {
  // Find the last argument token, respecting an unclosed opening quote.
  let quote = ''
  let tokenStart = 0
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (!quote && /\s/.test(c)) {
      tokenStart = i + 1
    } else if (c === '"' || c === "'") {
      if (!quote) quote = c
      else if (quote === c) quote = ''
    }
  }
  const before = raw.slice(0, tokenStart)
  const token = raw.slice(tokenStart)
  const hasQuote = token.startsWith('"') || token.startsWith("'")
  const activeQuote = hasQuote ? token[0] : ''
  const clean = hasQuote ? token.slice(1) : token

  const isFirstToken = before.trim() === '' || /\|\s*$/.test(before)
  if (isFirstToken && !clean.includes('/') && !clean.startsWith('.')) {
    const pool = Array.from(
      new Set([
        'clear',
        'help',
        ...s.library.filter((t) => !NON_CMD_TOPICS.has(t)),
        ...chapters[Math.min(s.completed, FINAL_CHAPTER)].tools.filter(
          (t) => !NON_CMD_TOPICS.has(t),
        ),
      ]),
    ).sort()
    const matches = pool.filter((c) => c.startsWith(clean))
    if (!matches.length) return { value: raw, options: [] }
    if (matches.length === 1) {
      return { value: before + matches[0] + ' ', options: [] }
    }
    const prefix = commonPrefix(matches)
    return {
      value: prefix.length > clean.length ? before + prefix : raw,
      options: matches,
    }
  }

  const slash = clean.lastIndexOf('/')
  const dirPart = slash >= 0 ? clean.slice(0, slash + 1) : ''
  const namePart = slash >= 0 ? clean.slice(slash + 1) : clean
  const targetDir = path(s.cwd, dirPart || '.')
  if (s.disk[targetDir] !== null) return { value: raw, options: [] }

  const entries = diskEntries(s, targetDir).filter((e) =>
    e.name.startsWith(namePart),
  )
  if (!entries.length) return { value: raw, options: [] }

  const formatMatch = (e: DiskEntry) => {
    const rel = dirPart + e.name + (e.isDir ? '/' : '')
    if (hasQuote) return activeQuote + rel + (e.isDir ? '' : activeQuote)
    if (rel.includes(' ')) return '"' + rel + (e.isDir ? '' : '"')
    return rel
  }

  if (entries.length === 1) {
    const e = entries[0]
    return {
      value: before + formatMatch(e) + (e.isDir ? '' : ' '),
      options: [],
    }
  }

  const prefix = commonPrefix(entries.map((e) => e.name))
  if (prefix.length > namePart.length) {
    const next = dirPart + prefix
    return {
      value:
        before +
        (hasQuote ? activeQuote + next : next.includes(' ') ? '"' + next : next),
      options: entries.map((e) => e.name + (e.isDir ? '/' : '')),
    }
  }
  return {
    value: raw,
    options: entries.map((e) => e.name + (e.isDir ? '/' : '')),
  }
}
