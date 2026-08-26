const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

module.exports = cds.server;

cds.on('served', async () => {
  const db = cds.db;
  if (!db) return;

  try {
    // 1. Create base tables
    await db.run(`CREATE TABLE IF NOT EXISTS travel_tracker_Employees (
      createdAt TEXT, createdBy TEXT, modifiedAt TEXT, modifiedBy TEXT,
      ID TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT,
      department TEXT, manager TEXT, role TEXT DEFAULT 'employee'
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS travel_tracker_Travels (
      createdAt TEXT, createdBy TEXT, modifiedAt TEXT, modifiedBy TEXT,
      ID TEXT PRIMARY KEY, employee_ID TEXT, travelType TEXT,
      fromCountry TEXT, toCountry TEXT, fromCity TEXT, toCity TEXT,
      startDate TEXT, endDate TEXT, purpose TEXT,
      status TEXT DEFAULT 'Planned', passportNumber TEXT, visaStatus TEXT
    )`);

    // 2. Create CDS service views (CDS queries these, not the base tables)
    await db.run(`CREATE VIEW IF NOT EXISTS TravelService_Employees AS SELECT * FROM travel_tracker_Employees`);
    await db.run(`CREATE VIEW IF NOT EXISTS TravelService_Travels AS SELECT * FROM travel_tracker_Travels`);

    console.log('DB tables and views created');

    // 3. Check if data already exists
    const existing = await db.run('SELECT COUNT(*) as c FROM travel_tracker_Employees');
    if (existing[0].c > 0) {
      console.log('Seed data already exists');
      return;
    }

    // 4. Load CSV seed data
    const dataDir = path.join(__dirname, 'db', 'data');
    if (!fs.existsSync(dataDir)) {
      console.log('No seed data directory');
      return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    for (const file of files) {
      // travel.tracker-Employees.csv -> travel_tracker_Employees
      const tableName = file.replace('.csv', '').replace(/[.\-]/g, '_');
      const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
      const lines = content.trim().split('\n');
      if (lines.length < 2) continue;

      const headers = lines[0].split(',').map(h => h.trim());
      let inserted = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const cols = headers.map(h => '"' + h + '"').join(',');
        const placeholders = headers.map(() => '?').join(',');

        try {
          await db.run(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`, values);
          inserted++;
        } catch (e) {
          console.log('Insert error:', tableName, e.message);
        }
      }
      console.log(`Loaded ${inserted} rows into ${tableName}`);
    }

    console.log('All seed data loaded');
  } catch (e) {
    console.error('DB setup error:', e.message);
  }
});
