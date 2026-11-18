// The virtual disk only contains ordinary files (strings) and directories (null).
export type Disk = Record<string, string | null>
export interface Session {
  disk: Disk
  cwd: string
  vars: Record<string, string>
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
const children = (s: Session, p: string) =>
  Object.keys(s.disk)
    .filter((k) => k !== '/' && parent(k) === p)
    .sort()
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
    if (!quote && /[|<&`]/.test(c))
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
      const m = /^\$\{([A-Za-z_]\w*)\}|^\$([A-Za-z_]\w*)/.exec(line.slice(i))
      if (!m) fail('Use $nome ou ${nome} para ler uma variável.')
      const expansion = Object.hasOwn(s.vars, m[1] || m[2])
        ? s.vars[m[1] || m[2]]
        : ''
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
  const pattern = new RegExp(
    '^' +
      name
        .split('*')
        .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*') +
      '$',
  )
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
          ' (verifique se fechou if/then/else/fi ou for/do/done).',
      )
  }
  function block(): Block {
    const result: Block = []
    while (
      i < lines.length &&
      !['then', 'else', 'fi', 'do', 'done'].includes(lines[i])
    ) {
      const l = lines[i++]
      if (/^if\s+/.test(l)) {
        expect('then')
        const yes = block()
        let no: Block = []
        if (lines[i] === 'else') {
          i++
          no = block()
        }
        expect('fi')
        result.push({ kind: 'if', test: l.slice(3), yes, no })
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
      if (node.kind === 'cmd') status = command(node.line, env, depth, emit)
      else if (node.kind === 'if')
        status = execBlock(
          command(node.test, env, depth, emit) === 0 ? node.yes : node.no,
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
  function command(
    line: string,
    env: Session,
    depth: number,
    emit: (v: string) => void,
  ): number {
    if (++steps > 3000 || depth > 8) fail('Limite de operações alcançado.')
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
        nargs(0, 1)
        if (args[0]?.startsWith('-'))
          fail('Nesta campanha, use ls ou ls nome-da-pasta.')
        const p = abs(args[0] || '.')
        if (env.disk[p] === undefined) fail('Caminho não encontrado: ' + p)
        const names =
          env.disk[p] === null
            ? children(env, p)
                .map(base)
                .filter((x) => !x.startsWith('.'))
            : [args[0]]
        if (names.length) output(names.join('\n') + '\n')
        break
      }
      case 'cat':
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
          if (cmd === 'mv') delete env.disk[from]
        }
        break
      }
      case 'grep': {
        nargs(2)
        const re = new RegExp(args[0])
        let found = false
        for (const f of args.slice(1)) {
          const data = read(env, abs(f)).split('\n')
          if (data.at(-1) === '') data.pop()
          for (const l of data)
            if (re.test(l)) {
              found = true
              output((args.length > 2 ? f + ':' : '') + l + '\n')
            }
        }
        return found ? 0 : 1
      }
      case '[':
      case 'test': {
        const a = [...args]
        if (cmd === '[' && a.pop() !== ']') fail('Separe o ] com um espaço.')
        if (a.length !== 2 || a[0] !== '-s')
          fail('Use [ -s "$arquivo" ] para testar o tamanho.')
        const v = env.disk[abs(a[1])]
        return typeof v === 'string' && v.length > 0 ? 0 : 1
      }
      case 'bash':
        nargs(1, 1)
        return execBlock(
          parse(read(env, abs(args[0]))),
          { ...env, vars: Object.create(null) },
          depth + 1,
          output,
        )
      case 'rm':
      case 'unlink':
        fail(
          'Os registros da estação são protegidos contra rm. Use mv para mover ou > arquivo para esvaziar.',
        )
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
      default:
        fail(
          'Comando fora do terminal didático: ' +
            cmd +
            '. Consulte o manual de campo.',
        )
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
