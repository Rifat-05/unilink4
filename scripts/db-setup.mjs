import { readFile } from 'node:fs/promises';
import { database, closeDatabase } from '../lib/db.js';
let client;
let locked = false;
try {
  client = await database().getConnection();
  const [[lock]] = await client.execute('SELECT GET_LOCK(?, 30) AS acquired', ['unilink-schema-setup']);
  if (Number(lock.acquired) !== 1) throw new Error('Another schema setup is running; retry later.');
  locked = true;
  // MySQL DDL commits implicitly. Run idempotent steps rather than claiming rollback.
  for (const statement of (await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8')).split(';').map(s => s.trim()).filter(Boolean)) {
    const index = /^CREATE INDEX (\w+) ON (\w+)/i.exec(statement);
    if (index) {
      const [existing] = await client.execute('SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?', [index[2], index[1]]);
      if (existing.length) continue;
    }
    await client.query(statement);
  }
  console.log('Database schema ready. No demo data or administrator was created.');
} finally {
  try { if (locked) await client.execute('SELECT RELEASE_LOCK(?)', ['unilink-schema-setup']); }
  finally { client?.release(); await closeDatabase(); }
}

