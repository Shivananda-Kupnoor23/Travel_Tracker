const cds = require('@sap/cds');

cds.on('bootstrap', async (app) => {
  // Deploy schema + seed data to in-memory SQLite before serving
  await cds.deploy('.').to('sqlite', { credentials: { database: ':memory:' } });
});

module.exports = cds.server;
