const cds = require('@sap/cds');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 4004;

async function start() {
  // Deploy DB schema + seed data
  await cds.deploy('.').to('sqlite', ':memory:');
  console.log('DB deployed with seed data');

  // Serve CDS
  await cds.serve('all').in(app);
  console.log('CDS services loaded');

  // Start listening
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
