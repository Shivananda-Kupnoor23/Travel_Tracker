const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

module.exports = cds.server;

cds.on('served', async () => {
  const db = cds.db;
  if (!db) return;

  try {
    // Create service-level tables (CDS queries these directly)
    await db.run(`CREATE TABLE IF NOT EXISTS TravelService_Employees (
      createdAt TEXT, createdBy TEXT, modifiedAt TEXT, modifiedBy TEXT,
      ID TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT,
      department TEXT, manager TEXT, role TEXT DEFAULT 'employee'
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS TravelService_Travels (
      createdAt TEXT, createdBy TEXT, modifiedAt TEXT, modifiedBy TEXT,
      ID TEXT PRIMARY KEY, employee_ID TEXT, travelType TEXT,
      fromCountry TEXT, toCountry TEXT, fromCity TEXT, toCity TEXT,
      startDate TEXT, endDate TEXT, purpose TEXT,
      status TEXT DEFAULT 'Planned', passportNumber TEXT, visaStatus TEXT
    )`);

    // Create namespace tables for chatbot raw SQL queries
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

    console.log('DB tables created');

    // Check if data already exists
    const existing = await db.run('SELECT COUNT(*) as c FROM TravelService_Employees');
    if (existing[0].c > 0) {
      console.log('Seed data already exists');
      return;
    }

    // Load CSV seed data into BOTH table sets
    const dataDir = path.join(__dirname, 'db', 'data');
    if (!fs.existsSync(dataDir)) {
      console.log('No seed data directory');
      return;
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
    for (const file of files) {
      const baseName = file.replace('.csv', '').replace(/[.\-]/g, '_');
      // Determine which service table to target
      const isEmployees = file.includes('Employees');
      const serviceName = isEmployees ? 'TravelService_Employees' : 'TravelService_Travels';
      const namespaceName = baseName; // travel_tracker_Employees or travel_tracker_Travels

      const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
      const lines = content.trim().split('\n');
      if (lines.length < 2) continue;

      const headers = lines[0].split(',').map(h => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map(v => v.trim());
        const cols = headers.map(h => '"' + h + '"').join(',');
        const placeholders = headers.map(() => '?').join(',');

        // Insert into service table
        try {
          await db.run(`INSERT INTO ${serviceName} (${cols}) VALUES (${placeholders})`, values);
        } catch (e) { /* skip */ }

        // Insert into namespace table
        try {
          await db.run(`INSERT INTO ${namespaceName} (${cols}) VALUES (${placeholders})`, values);
        } catch (e) { /* skip */ }
      }
      console.log(`Loaded data into ${serviceName} and ${namespaceName}`);
    }

    console.log('All seed data loaded');
  } catch (e) {
    console.error('DB setup error:', e.message);
  }
});
