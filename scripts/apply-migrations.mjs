import pg from 'pg'
import fs from 'fs'
import path from 'path'

const migrationsDir = 'supabase/migrations'
const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => path.join(migrationsDir, name))

if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD')
  process.exit(1)
}

// Direct db.*.supabase.co is IPv6-only on many projects; use Session pooler (IPv4).
const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.qorbssjmmwxnrgimfohb',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
})

await client.connect()
console.log('CONNECTED')

for (const file of files) {
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

const column = await client.query(
  `select column_name, data_type, column_default, is_nullable
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'profiles'
     and column_name = 'is_active'`,
)
console.log('is_active', column.rows[0] ?? null)

const tables = await client.query(
  "select tablename from pg_tables where schemaname='public' order by 1",
)
console.log('TABLES', tables.rows.map((x) => x.tablename).join(', '))
await client.end()
