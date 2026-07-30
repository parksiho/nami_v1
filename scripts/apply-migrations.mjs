import pg from 'pg'
import fs from 'fs'

// Direct db.*.supabase.co is IPv6-only on many projects; use Session pooler (IPv4).
const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.qorbssjmmwxnrgimfohb',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
})

await client.connect()
console.log('CONNECTED')

for (const file of [
  'supabase/migrations/20260730000000_init.sql',
  'supabase/migrations/20260730000001_fix_rls_student_courses.sql',
]) {
  const sql = fs.readFileSync(file, 'utf8')
  console.log('APPLYING', file, 'bytes', sql.length)
  try {
    await client.query(sql)
    console.log('OK', file)
  } catch (e) {
    console.error('FAIL', file, e.message)
    process.exitCode = 1
    await client.end()
    process.exit(1)
  }
}

const r = await client.query(
  "select tablename from pg_tables where schemaname='public' order by 1",
)
console.log('TABLES', r.rows.map((x) => x.tablename).join(', '))
await client.end()
