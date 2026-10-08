import { demoTables } from '@/lib/demo/data'

type Filter = {
  column: string
  op: 'eq' | 'in' | 'ilike' | 'not_is_null'
  value: unknown
}

type Embed = {
  alias: string
  table: string
  fk: string
  fields: string[] | null
  inner: boolean
}

type Result = {
  data: unknown
  error: null
  count: number | null
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function parseSelect(select: string): { columns: string[] | null; embeds: Embed[] } {
  if (select === '*' || select === '') {
    return { columns: null, embeds: [] }
  }

  const embeds: Embed[] = []
  const columns: string[] = []
  const embedRe =
    /([A-Za-z0-9_]+):([A-Za-z0-9_]+)(?:!([A-Za-z0-9_]+))?\(([^)]*)\)/g
  let stripped = select
  stripped = stripped.replace(embedRe, (_all, alias, table, hint, fields) => {
    const inner = hint === 'inner'
    const fkHint = inner ? '' : (hint as string | undefined)
    const fk = fkFromHint(table, fkHint, alias)
    embeds.push({
      alias,
      table,
      fk,
      fields: fields.trim() ? fields.split(',').map((part: string) => part.trim()) : null,
      inner,
    })
    return ''
  })

  stripped
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((column) => columns.push(column))

  return { columns: columns.length ? columns : null, embeds }
}

function fkFromHint(table: string, hint: string | undefined, alias: string): string {
  if (hint && hint.endsWith('_fkey')) {
    const withoutFkey = hint.slice(0, -5)
    const idx = withoutFkey.lastIndexOf('_')
    // courses_professor_id -> professor_id
    const parts = withoutFkey.split('_')
    if (parts.length >= 2) {
      return parts.slice(-2).join('_')
    }
    if (idx >= 0) return withoutFkey.slice(idx + 1)
  }
  if (table === 'courses' && alias === 'course') return 'course_id'
  if (table === 'profiles') {
    if (alias === 'professor') return 'professor_id'
    if (alias === 'student') return 'student_id'
    if (alias === 'actor') return 'actor_id'
    if (alias === 'advisor') return 'advisor_id'
  }
  return `${alias}_id`
}

function getByPath(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, row)
}

function applyEmbeds(
  rows: Record<string, unknown>[],
  fromTable: string,
  embeds: Embed[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const next = { ...row }
    for (const embed of embeds) {
      const localKey = embed.fk
      const relatedId = row[localKey]
      const related = (demoTables[embed.table] ?? []).find((item) => item.id === relatedId)
      if (!related) {
        next[embed.alias] = null
        continue
      }
      if (embed.fields) {
        const picked: Record<string, unknown> = {}
        for (const field of embed.fields) picked[field] = related[field]
        next[embed.alias] = picked
      } else {
        next[embed.alias] = clone(related)
      }
    }
    void fromTable
    return next
  })
}

class DemoQuery implements PromiseLike<Result> {
  private table: string
  private selectText = '*'
  private selectCount = false
  private head = false
  private filters: Filter[] = []
  private orderBy: { column: string; ascending: boolean }[] = []
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private limitTo: number | null = null
  private single = false

  constructor(table: string) {
    this.table = table
  }

  select(columns: string, options?: { count?: string; head?: boolean }) {
    this.selectText = columns
    this.selectCount = options?.count === 'exact'
    this.head = options?.head === true
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: 'eq', value })
    return this
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, op: 'in', value })
    return this
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ column, op: 'ilike', value: pattern })
    return this
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'is' && value === null) {
      this.filters.push({ column, op: 'not_is_null', value: null })
    }
    return this
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending !== false })
    return this
  }

  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  limit(count: number) {
    this.limitTo = count
    return this
  }

  maybeSingle() {
    this.single = true
    return this
  }

  private execute(): Result {
    const { embeds } = parseSelect(this.selectText)
    let rows = clone(demoTables[this.table] ?? [])

    if (embeds.length) {
      rows = applyEmbeds(rows, this.table, embeds)
    }

    for (const filter of this.filters) {
      rows = rows.filter((row) => {
        const actual = getByPath(row, filter.column)
        if (filter.op === 'eq') return actual === filter.value
        if (filter.op === 'in') return (filter.value as unknown[]).includes(actual)
        if (filter.op === 'not_is_null') return actual !== null && actual !== undefined && actual !== ''
        if (filter.op === 'ilike') {
          const needle = String(filter.value).replace(/%/g, '').toLowerCase()
          return String(actual ?? '').toLowerCase().includes(needle)
        }
        return true
      })
    }

    if (embeds.some((embed) => embed.inner)) {
      rows = rows.filter((row) =>
        embeds.every((embed) => !embed.inner || row[embed.alias] != null),
      )
    }

    for (const sort of [...this.orderBy].reverse()) {
      rows.sort((a, b) => {
        const av = getByPath(a, sort.column)
        const bv = getByPath(b, sort.column)
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (av < bv) return sort.ascending ? -1 : 1
        if (av > bv) return sort.ascending ? 1 : -1
        return 0
      })
    }

    const count = rows.length
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1)
    }
    if (this.limitTo !== null) {
      rows = rows.slice(0, this.limitTo)
    }

    if (this.head) {
      return { data: null, error: null, count }
    }
    if (this.single) {
      return { data: rows[0] ?? null, error: null, count: this.selectCount ? count : null }
    }
    return { data: rows, error: null, count: this.selectCount ? count : null }
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

export function createDemoServerClient() {
  return {
    from(table: string) {
      return new DemoQuery(table)
    },
    auth: {
      async getUser() {
        return { data: { user: null }, error: null }
      },
      async getSession() {
        return { data: { session: null }, error: null }
      },
      async signOut() {
        return { error: null }
      },
    },
    storage: {
      from() {
        return {
          getPublicUrl() {
            return { data: { publicUrl: '' } }
          },
        }
      },
    },
  }
}
