const cds = require('@sap/cds');

cds.on('bootstrap', async () => {
  // Ensure DB is deployed with schema and seed data in production
  const db = await cds.connect.to('db');
  await cds.deploy('./').to(db);
});

module.exports = cds.server;
