// The virtual disk only contains ordinary files (strings) and directories (null).
export type Disk = Record<string, string | null>
export interface Session {
  disk: Disk
  cwd: string
  vars: Record<string, string>
  execs?: string[]
}
export interface Trace {
  cmd: string
  args: string[]
  cwd: string
}
export interface Result {
  out: string
  error: string
  status: number
  trace: Trace[]
}
function fail(message: string): never {
  throw new Error(message)
}
export function path(cwd: string, raw: string): string {
  const segments: string[] = []
  for (const part of (raw.startsWith('/') ? raw : cwd + '/' + raw).split('/')) {
    if (part === '..') segments.pop()
    else if (part && part !== '.') segments.push(part)
  }
  return '/' + segments.join('/')
}
export const parent = (p: string) => path(p, '..')
const base = (p: string) => p.split('/').pop() || '/'
const cmpC = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const children = (s: Session, p: string) =>
  Object.keys(s.disk)
    .filter((k) => k !== '/' && parent(k) === p)
    .sort(cmpC)
const dir = (s: Session, p: string) =>
  s.disk[p] === null || fail('Pasta não encontrada: ' + p)
function read(s: Session, p: string): string {
  const v = s.disk[p]
  return typeof v === 'string'
    ? v
    : fail(v === null ? 'É uma pasta: ' + p : 'Arquivo não encontrado: ' + p)
}
export function write(s: Session, p: string, v: string) {
  dir(s, parent(p))
  if (s.disk[p] === null) fail('É uma pasta: ' + p)
  if (v.length > 128_000)
    fail(
      'O arquivo ultrapassou o espaço de trabalho do terminal (128 mil caracteres).',
    )
  s.disk[p] = v
}
function splitLines(text: string): string[] {
  if (!text) return []
  const lines = text.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines
}
function globRegex(pattern: string): RegExp {
  let out = '^'
  for (const ch of pattern) {
    if (ch === '*') out += '.*'
    else if (ch === '?') out += '.'
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(out + '$')
}

function splitPipeline(line: string): string[] {
  const stages: string[] = []
  let buf = '',
    quote = '',
    escaped = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (escaped) {
      buf += c
      escaped = false
      continue
    }
    if (c === '\\' && quote !== "'") {
      buf += c
      escaped = true
      continue
    }
    if (!quote && c === '#' && (!buf || /\s$/.test(buf))) break
    if (c === quote) {
      quote = ''
      buf += c
      continue
    }
    if (!quote && (c === '"' || c === "'")) {
      quote = c
      buf += c
      continue
    }
    if (!quote && c === '|') {
      if (line[i + 1] === '|')
        fail('Este operador está fora do terminal didático: ||')
      if (!buf.trim())
        fail('Indique um comando antes e depois do pipe (|).')
      stages.push(buf.trim())
      buf = ''
      continue
    }
    buf += c
  }
  if (quote) fail('Feche as aspas antes de executar.')
  if (stages.length && !buf.trim())
    fail('Indique um comando antes e depois do pipe (|).')
  if (buf.trim()) stages.push(buf.trim())
  return stages
}

type Token = {
  value: string
  kind: 'word' | 'redirect'
  glob: boolean
  literal: boolean
}
function words(line: string, s: Session): Token[] {
  const tokens: Token[] = []
  let value = '',
    active = false,
    glob = false,
    literal = true,
    quote = ''
  const flush = () => {
    if (active) tokens.push({ value, kind: 'word', glob, literal })
    value = ''
    active = false
    glob = false
    literal = true
  }
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (!quote && /\s/.test(c)) {
      flush()
      continue
    }
    if (!quote && c === '#' && !active) break
    if (!quote && c === '>') {
      flush()
      const append = line[i + 1] === '>'
      if (append) i++
      tokens.push({
        value: append ? '>>' : '>',
        kind: 'redirect',
        glob: false,
        literal: true,
      })
      continue
    }
    if (!quote && /[<&`]/.test(c))
      fail('Este operador está fora do terminal didático: ' + c)
    if (c === '"' || c === "'") {
      if (!quote) {
        quote = c
        active = true
        literal = false
        continue
      }
      if (quote === c) {
        quote = ''
        continue
      }
    }
    if (
      c === '\\' &&
      quote !== "'" &&
      (!quote || /["$\\]/.test(line[i + 1] || ' '))
    ) {
      if (++i >= line.length) fail('Falta um caractere após a barra invertida.')
      value += line[i]
      active = true
      literal = false
      continue
    }
    if (c === '$' && quote !== "'") {
      const m = /^\$\{([A-Za-z_]\w*|\d+)\}|^\$([A-Za-z_]\w*|\d)/.exec(
        line.slice(i),
      )
      if (!m) fail('Use $nome, ${nome} ou $1 para ler uma variável ou parâmetro.')
      const key = m[1] || m[2]
      const expansion = Object.hasOwn(s.vars, key) ? s.vars[key] : ''
      i += m[0].length - 1
      if (quote || /^[A-Za-z_]\w*=/.test(value)) value += expansion
      else {
        for (const part of expansion.split(/(\s+)/)) {
          if (/\s/.test(part)) {
            flush()
            continue
          }
          if (part) {
            value += part
            active = true
            glob ||= part.includes('*')
          }
        }
      }
      continue
    }
    if (!quote && c === '*') glob = true
    value += c
    active = true
  }
  if (quote) fail('Feche as aspas antes de executar.')
  flush()
  return tokens
}
function expand(t: Token, s: Session): string[] {
  if (!t.glob) return [t.value]
  const slash = t.value.lastIndexOf('/'),
    prefix = t.value.slice(0, slash + 1),
    name = t.value.slice(slash + 1)
  const pattern = globRegex(name)
  const matches = children(s, path(s.cwd, prefix))
    .map(base)
    .filter(
      (n) => (!n.startsWith('.') || name.startsWith('.')) && pattern.test(n),
    )
  return matches.length ? matches.map((n) => prefix + n) : [t.value]
}

// Parse control flow before executing any command. Quotes protect separators.
function statements(source: string): string[] {
  const lines: string[] = []
  let buf = '',
    quote = '',
    escaped = false,
    comment = false
  const flush = () => {
    if (buf.trim()) lines.push(buf.trim())
    buf = ''
  }
  for (const c of source) {
    if (comment) {
      if (c === '\n') {
        comment = false
        flush()
      }
      continue
    }
    if (escaped) {
      buf += c
      escaped = false
      continue
    }
    if (c === '\\' && quote !== "'") {
      buf += c
      escaped = true
      continue
    }
    if (!quote && c === '#' && (!buf || /\s$/.test(buf))) {
      comment = true
      continue
    }
    if (!quote && (c === ';' || c === '\n')) {
      flush()
      continue
    }
    if (c === quote) quote = ''
    else if (!quote && (c === '"' || c === "'")) quote = c
    buf += c
  }
  if (quote) fail('Feche as aspas antes de executar.')
  flush()
  return lines.flatMap((l) =>
    /^(then|do|else)\s+/.test(l)
      ? [l.split(/\s/)[0], l.replace(/^\w+\s+/, '')]
      : [l],
  )
}
type Block = (
  | { kind: 'cmd'; line: string }
  | { kind: 'if'; test: string; yes: Block; no: Block }
  | { kind: 'for'; name: string; values: string; body: Block }
)[]
function parse(source: string): Block {
  const lines = statements(source)
  let i = 0
  const expect = (token: string) => {
    if (lines[i++] !== token)
      fail(
        'Estrutura incompleta. Esperado: ' +
          token +
          ' (verifique se fechou if/then/elif/else/fi ou for/do/done).',
      )
  }
  function parseIf(test: string): Block[number] {
    expect('then')
    const yes = block()
    let no: Block = []
    if (lines[i] && /^elif\s+/.test(lines[i])) {
      const nextTest = lines[i++].replace(/^elif\s+/, '')
      no = [parseIf(nextTest)]
    } else {
      if (lines[i] === 'else') {
        i++
        no = block()
      }
      expect('fi')
    }
    return { kind: 'if', test, yes, no }
  }
  function block(): Block {
    const result: Block = []
    while (
      i < lines.length &&
      !['then', 'else', 'fi', 'do', 'done'].includes(lines[i]) &&
      !/^elif\s+/.test(lines[i])
    ) {
      const l = lines[i++]
      if (/^if\s+/.test(l)) {
        result.push(parseIf(l.replace(/^if\s+/, '')))
      } else if (/^for\s+/.test(l)) {
        const m = /^for\s+([A-Za-z_]\w*)\s+in\s+(.+)$/.exec(l)
        if (!m) throw new Error('Use for nome in lista; do … done.')
        expect('do')
        const body = block()
        expect('done')
        result.push({ kind: 'for', name: m[1], values: m[2], body })
      } else result.push({ kind: 'cmd', line: l })
    }
    return result
  }
  const result = block()
  if (i !== lines.length) fail('Palavra inesperada: ' + lines[i])
  return result
}
export function run(s: Session, source: string): Result {
  s.execs ??= []
  const result: Result = { out: '', error: '', status: 0, trace: [] }
  let steps = 0
  function execBlock(
    nodes: Block,
    env: Session,
    depth: number,
    emit: (v: string) => void,
  ): number {
    let status = 0
    for (const node of nodes) {
      if (node.kind === 'cmd') status = pipeline(node.line, env, depth, emit)
      else if (node.kind === 'if')
        status = execBlock(
          pipeline(node.test, env, depth, emit) === 0 ? node.yes : node.no,
          env,
          depth,
          emit,
        )
      else
        for (const v of words(node.values, env).flatMap((t) =>
          expand(t, env),
        )) {
          if (++steps > 3000) fail('Limite de operações alcançado.')
          env.vars[node.name] = v
          status = execBlock(node.body, env, depth, emit)
        }
    }
    return status
  }
  function pipeline(
    line: string,
    env: Session,
    depth: number,
    emit: (v: string) => void,
  ): number {
    const stages = splitPipeline(line)
    if (!stages.length) return 0
    if (stages.length === 1) return command(stages[0], env, depth, emit)
    let piped: string | undefined
    let status = 0
    for (let idx = 0; idx < stages.length; idx++) {
      const last = idx === stages.length - 1
      let nextPipe = ''
      status = command(
        stages[idx],
        env,
        depth,
        last ? emit : (v) => (nextPipe += v),
        piped,
      )
      piped = nextPipe
    }
    return status
  }
  function execScript(
    rawTarget: string,
    scriptArgs: string[],
    env: Session,
    depth: number,
    output: (v: string) => void,
  ): number {
    const absPath = path(env.cwd, rawTarget)
    const body = read(env, absPath)
    const vars: Record<string, string> = Object.create(null)
    vars['0'] = rawTarget
    scriptArgs.forEach((arg, idx) => {
      vars[String(idx + 1)] = arg
    })
    return execBlock(
      parse(body),
      { ...env, vars },
      depth + 1,
      output,
    )
  }
  function command(
    line: string,
    env: Session,
    depth: number,
    emit: (v: string) => void,
    stdin?: string,
  ): number {
    if (++steps > 3000 || depth > 8) fail('Limite de operações alcançado.')
    env.execs ??= []
    let tokens = words(line, env),
      target = '',
      append = false
    const red = tokens.findIndex((t) => t.kind === 'redirect')
    if (red >= 0) {
      const dest = tokens[red + 1]
      if (
        !dest ||
        dest.kind !== 'word' ||
        tokens.slice(red + 2).some((t) => t.kind === 'redirect')
      )
        fail('Indique um arquivo após o redirecionamento.')
      target = path(env.cwd, dest.value)
      append = tokens[red].value === '>>'
      tokens = [...tokens.slice(0, red), ...tokens.slice(red + 2)]
      write(
        env,
        target,
        append && typeof env.disk[target] === 'string'
          ? (env.disk[target] as string)
          : '',
      )
    }
    const output = (v: string) => {
      if (target) write(env, target, read(env, target) + v)
      else emit(v)
    }
    if (!tokens.length) return 0
    const assignment = /^([A-Za-z_]\w*)=(.*)$/s.exec(tokens[0].value)
    if (tokens.length === 1 && assignment) {
      env.vars[assignment[1]] = assignment[2]
      return 0
    }
    const [cmd, ...args] = tokens.flatMap((t) => expand(t, env))
    const abs = (v: string) => path(env.cwd, v)
    const nargs = (min: number, max = Infinity) => {
      if (args.length < min || args.length > max)
        fail('Confira os argumentos de ' + cmd + ' no manual.')
    }
    result.trace.push({ cmd, args, cwd: env.cwd })
    switch (cmd) {
      case 'pwd':
        nargs(0, 0)
        output(env.cwd + '\n')
        break
      case 'cd':
        nargs(0, 1)
        {
          const p = abs(args[0] || '/ark')
          dir(env, p)
          env.cwd = p
        }
        break
      case 'ls': {
        if (args[0]?.startsWith('-'))
          fail('Nesta campanha, use ls, ls pasta ou ls padrão*.')
        const targets = args.length ? args : ['.']
        if (targets.length === 1) {
          const p = abs(targets[0])
          if (env.disk[p] === undefined) fail('Caminho não encontrado: ' + p)
          const names =
            env.disk[p] === null
              ? children(env, p)
                  .map(base)
                  .filter((x) => !x.startsWith('.'))
              : [targets[0]]
          if (names.length) output(names.join('\n') + '\n')
        } else {
          const files: string[] = []
          for (const a of targets) {
            const p = abs(a)
            if (env.disk[p] === undefined) fail('Caminho não encontrado: ' + p)
            files.push(a)
          }
          if (files.length) output(files.join('\n') + '\n')
        }
        break
      }
      case 'cat':
        if (args.length === 0 && stdin !== undefined) {
          output(stdin)
          break
        }
        nargs(1)
        for (const f of args) output(read(env, abs(f)))
        break
      case 'echo':
        output(args.join(' ') + '\n')
        break
      case 'mkdir':
        nargs(1)
        for (const a of args) {
          const p = abs(a)
          dir(env, parent(p))
          if (Object.hasOwn(env.disk, p)) fail('Já existe: ' + a)
          env.disk[p] = null
        }
        break
      case 'cp':
      case 'mv': {
        nargs(2)
        const dst = abs(args.at(-1)!)
        if (args.length > 2) dir(env, dst)
        for (const a of args.slice(0, -1)) {
          const from = abs(a),
            to = env.disk[dst] === null ? path(dst, base(from)) : dst
          if (from === to) fail('Origem e destino são iguais.')
          write(env, to, read(env, from))
          const wasExec = env.execs.includes(from)
          if (wasExec && !env.execs.includes(to)) env.execs.push(to)
          if (cmd === 'mv') {
            delete env.disk[from]
            env.execs = env.execs.filter((item) => item !== from)
          }
        }
        break
      }
      case 'rm': {
        let force = false
        const files: string[] = []
        for (const a of args) {
          if (a === '-f') force = true
          else if (/^-[rR]/.test(a) || a === '-rf' || a === '-fr')
            fail(
              'Remoção recursiva de pastas (-r) está desativada na estação. Remova apenas arquivos com rm.',
            )
          else if (a.startsWith('-'))
            fail('Confira os argumentos de rm no manual.')
          else files.push(a)
        }
        if (!files.length) fail('Indique o arquivo a remover com rm.')
        for (const f of files) {
          const p = abs(f)
          if (env.disk[p] === undefined) {
            if (force) continue
            fail('Arquivo não encontrado: ' + p)
          }
          if (env.disk[p] === null)
            fail('rm não remove pastas nesta campanha: ' + f)
          delete env.disk[p]
          env.execs = env.execs.filter((item) => item !== p)
        }
        break
      }
      case 'grep': {
        let ignoreCase = false
        const rest: string[] = []
        for (const a of args) {
          if (!rest.length && a === '-i') ignoreCase = true
          else rest.push(a)
        }
        if (!rest.length) fail('Confira os argumentos de grep no manual.')
        const re = new RegExp(rest[0], ignoreCase ? 'i' : '')
        const files = rest.slice(1)
        let found = false
        if (!files.length) {
          if (stdin === undefined)
            fail('Indique um arquivo ou conecte um comando com | antes de grep.')
          for (const l of splitLines(stdin))
            if (re.test(l)) {
              found = true
              output(l + '\n')
            }
          return found ? 0 : 1
        }
        for (const f of files) {
          for (const l of splitLines(read(env, abs(f))))
            if (re.test(l)) {
              found = true
              output((files.length > 1 ? f + ':' : '') + l + '\n')
            }
        }
        return found ? 0 : 1
      }
      case 'sort': {
        let reverse = false
        const files: string[] = []
        for (const a of args) {
          if (a === '-r') reverse = true
          else if (a.startsWith('-'))
            fail('Nesta campanha, use sort ou sort -r.')
          else files.push(a)
        }
        let text = ''
        if (files.length) {
          for (const f of files) text += read(env, abs(f))
        } else if (stdin !== undefined) {
          text = stdin
        } else {
          fail('Indique um arquivo ou conecte um comando com | antes de sort.')
        }
        const lines = splitLines(text).sort(cmpC)
        if (reverse) lines.reverse()
        if (lines.length) output(lines.join('\n') + '\n')
        break
      }
      case 'uniq': {
        const files: string[] = []
        for (const a of args) {
          if (a.startsWith('-'))
            fail('Nesta campanha, use uniq após sort (ex.: sort arquivo | uniq).')
          else files.push(a)
        }
        if (files.length > 1) fail('Confira os argumentos de uniq no manual.')
        const text = files.length
          ? read(env, abs(files[0]))
          : stdin !== undefined
            ? stdin
            : fail('Indique um arquivo ou conecte um comando com | antes de uniq.')
        const lines = splitLines(text)
        const deduped: string[] = []
        for (const l of lines) {
          if (!deduped.length || deduped.at(-1) !== l) deduped.push(l)
        }
        if (deduped.length) output(deduped.join('\n') + '\n')
        break
      }
      case 'wc': {
        let countLines = false,
          countWords = false,
          countBytes = false
        const files: string[] = []
        for (const a of args) {
          if (a === '-l') countLines = true
          else if (a === '-w') countWords = true
          else if (a === '-c') countBytes = true
          else if (a.startsWith('-'))
            fail('Nesta campanha, use wc -l para contar linhas.')
          else files.push(a)
        }
        if (!countLines && !countWords && !countBytes) {
          countLines = countWords = countBytes = true
        }
        const metrics = (text: string) => {
          const vals: number[] = []
          if (countLines) vals.push((text.match(/\n/g) || []).length)
          if (countWords)
            vals.push(text.trim() ? text.trim().split(/\s+/).length : 0)
          if (countBytes) vals.push(new TextEncoder().encode(text).length)
          return vals
        }
        if (!files.length) {
          if (stdin === undefined)
            fail('Indique um arquivo ou conecte um comando com | antes de wc -l.')
          output(metrics(stdin).join(' ') + '\n')
          break
        }
        const totals = metrics('')
        for (const f of files) {
          const m = metrics(read(env, abs(f)))
          m.forEach((v, idx) => (totals[idx] += v))
          output(m.join(' ') + ' ' + f + '\n')
        }
        if (files.length > 1) output(totals.join(' ') + ' total\n')
        break
      }
      case 'head':
      case 'tail': {
        let count = 10
        const files: string[] = []
        for (let idx = 0; idx < args.length; idx++) {
          const a = args[idx]
          if (a === '-n') {
            const rawN = args[++idx]
            if (!rawN || !/^\d+$/.test(rawN))
              fail('Informe um número inteiro após -n (ex.: ' + cmd + ' -n 2 arquivo).')
            count = Number(rawN)
          } else if (/^-\d+$/.test(a)) {
            count = Number(a.slice(1))
          } else if (a.startsWith('-')) {
            fail('Use ' + cmd + ' -n N arquivo (ex.: ' + cmd + ' -n 2 arquivo).')
          } else {
            files.push(a)
          }
        }
        const take = (text: string) => {
          const lines = splitLines(text)
          const slice =
            cmd === 'head'
              ? lines.slice(0, count)
              : count === 0
                ? []
                : lines.slice(-count)
          return slice.length ? slice.join('\n') + '\n' : ''
        }
        if (!files.length) {
          if (stdin === undefined)
            fail('Indique um arquivo ou conecte um comando com | antes de ' + cmd + '.')
          output(take(stdin))
          break
        }
        files.forEach((f, idx) => {
          if (files.length > 1)
            output((idx ? '\n' : '') + '==> ' + f + ' <==\n')
          output(take(read(env, abs(f))))
        })
        break
      }
      case 'find': {
        let start = '.'
        let idx = 0
        if (args[0] && !args[0].startsWith('-')) {
          start = args[0]
          idx = 1
        }
        let typeFilter: '' | 'f' | 'd' = ''
        let namePattern: RegExp | undefined
        while (idx < args.length) {
          const flag = args[idx++]
          if (flag === '-name') {
            const pat = args[idx++]
            if (!pat) fail('Informe um padrão após -name (ex.: -name "*.val").')
            namePattern = globRegex(pat)
          } else if (flag === '-type') {
            const t = args[idx++]
            if (t !== 'f' && t !== 'd')
              fail('Use -type f (arquivos) ou -type d (pastas).')
            typeFilter = t
          } else {
            fail('Nesta campanha, use find [pasta] [-type f|d] [-name "padrão"].')
          }
        }
        const startAbs = abs(start)
        if (env.disk[startAbs] === undefined)
          fail('Caminho não encontrado: ' + start)
        const prefix = startAbs === '/' ? '/' : startAbs + '/'
        const startClean = start === '/' ? '/' : start.replace(/\/+$/, '')
        const keys = Object.keys(env.disk)
          .filter((k) => k === startAbs || k.startsWith(prefix))
          .sort(cmpC)
        const out: string[] = []
        for (const k of keys) {
          const isDir = env.disk[k] === null
          if (typeFilter === 'f' && isDir) continue
          if (typeFilter === 'd' && !isDir) continue
          if (namePattern && !namePattern.test(base(k))) continue
          if (k === startAbs) out.push(start)
          else {
            const rel = k.slice(prefix.length)
            out.push(startClean === '/' ? '/' + rel : startClean + '/' + rel)
          }
        }
        if (out.length) output(out.join('\n') + '\n')
        break
      }
      case 'chmod': {
        nargs(2)
        const mode = args[0]
        const addExec = ['+x', 'u+x', 'a+x'].includes(mode)
        const remExec = ['-x', 'u-x', 'a-x'].includes(mode)
        if (!addExec && !remExec)
          fail('Nesta campanha, use chmod +x arquivo (ou chmod -x arquivo).')
        for (const f of args.slice(1)) {
          const p = abs(f)
          read(env, p)
          if (addExec) {
            if (!env.execs.includes(p)) env.execs.push(p)
          } else {
            env.execs = env.execs.filter((item) => item !== p)
          }
        }
        break
      }
      case '[':
      case 'test': {
        const a = [...args]
        if (cmd === '[' && a.pop() !== ']') fail('Separe o ] com um espaço.')
        if (a.length !== 2 || !['-s', '-f', '-d', '-e'].includes(a[0]))
          fail(
            'Use [ -s "$arquivo" ], [ -f "$arquivo" ] ou [ -d "$pasta" ] para testar caminhos.',
          )
        const v = env.disk[abs(a[1])]
        if (a[0] === '-s') return typeof v === 'string' && v.length > 0 ? 0 : 1
        if (a[0] === '-f') return typeof v === 'string' ? 0 : 1
        if (a[0] === '-d') return v === null ? 0 : 1
        return v !== undefined ? 0 : 1
      }
      case 'bash':
        nargs(1)
        return execScript(args[0], args.slice(1), env, depth, output)
      case 'unlink':
        fail('Para remover arquivos nesta estação, use rm nome-do-arquivo.')
      case 'touch':
        fail(
          'Para criar ou zerar um arquivo neste simulador, use > nome-do-arquivo.',
        )
      case 'nano':
      case 'vi':
      case 'vim':
      case 'code':
        fail(
          'Para escrever scripts ou arquivos de várias linhas, use a aba Editor de script.',
        )
      default: {
        if (cmd.includes('/')) {
          const p = abs(cmd)
          read(env, p)
          if (!env.execs.includes(p))
            fail(
              'Permissão negada: ' +
                cmd +
                '. Dê permissão de execução com chmod +x ' +
                base(p) +
                '.',
            )
          return execScript(cmd, args, env, depth, output)
        }
        fail(
          'Comando fora do terminal didático: ' +
            cmd +
            '. Consulte o manual de campo.',
        )
      }
    }
    return 0
  }
  try {
    result.status = execBlock(parse(source), s, 0, (v) => {
      if (result.out.length + v.length > 128_000)
        fail('Saída longa demais para o visor.')
      result.out += v
    })
  } catch (e) {
    result.status = 2
    result.error = e instanceof Error ? e.message : String(e)
  }
  return result
}
