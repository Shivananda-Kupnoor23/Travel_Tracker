const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

module.exports = cds.server;

cds.on('served', async () => {
  const db = cds.db;
  if (!db) return;

  try {
    // 1. Compile CDS model to SQL DDL and create tables
    const ddl = cds.compile.to.sql(cds.model);
    for (const sql of ddl) {
      try { await db.run(sql); } catch (e) { /* table may already exist */ }
    }
    console.log('DB tables created');

    // 2. Load CSV seed data
    const dataDir = path.join(__dirname, 'db', 'data');
    if (!fs.existsSync(dataDir)) {
      console.log('No seed data directory found');
      return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    for (const file of files) {
      const tableName = file.replace('.csv', '').replace(/\./g, '_');
      const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
      const lines = content.trim().split('\n');
      if (lines.length < 2) continue;

      const headers = lines[0].split(',').map(h => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parse (handles our data which has no commas in values)
        const values = line.split(',').map(v => v.trim());
        const cols = headers.map(h => `"${h}"`).join(',');
        const placeholders = headers.map(() => '?').join(',');

        try {
          await db.run(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`, values);
        } catch (e) { /* skip duplicate */ }
      }
    }
    console.log('Seed data loaded');
  } catch (e) {
    console.error('DB setup error:', e.message);
  }
});
