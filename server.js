const cds = require('@sap/cds');

module.exports = cds.server;

cds.once('served', async () => {
  const db = cds.services.db || await cds.connect.to('db');
  try {
    // Deploy using the already-loaded CDS model
    await cds.deploy(cds.model).to(db, { csvs: true });
    console.log('DB tables created and seed data loaded');
  } catch (e) {
    console.log('DB deploy:', e.message);
  }
});
