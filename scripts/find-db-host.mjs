import pg from 'pg'

const password = process.env.SUPABASE_DB_PASSWORD
const ref = 'qorbssjmmwxnrgimfohb'
const hosts = [
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-1-ap-northeast-2.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
]

// Also try direct IPv6
const attempts = [
  {
    label: 'direct-ipv6',
    host: '2406:da18:1f5e:4100:f656:7ed4:4d3d:d169',
    port: 5432,
    user: 'postgres',
  },
  ...hosts.flatMap((host) => [
    { label: `${host}:5432`, host, port: 5432, user: `postgres.${ref}` },
    { label: `${host}:6543`, host, port: 6543, user: `postgres.${ref}` },
  ]),
]

for (const a of attempts) {
  const client = new pg.Client({
    host: a.host,
    port: a.port,
    database: 'postgres',
    user: a.user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  try {
    await client.connect()
    const r = await client.query('select current_database() as db, current_user as u')
    console.log('SUCCESS', a.label, JSON.stringify(r.rows[0]))
    await client.end()
    process.exit(0)
  } catch (e) {
    console.log('FAIL', a.label, e.message.split('\n')[0])
    try {
      await client.end()
    } catch {}
  }
}
console.log('NO_HOST_WORKED')
process.exit(1)
