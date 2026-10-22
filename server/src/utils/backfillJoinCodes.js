const mongoose = require('mongoose');
const config = require('../config/env');
const Workspace = require('../models/Workspace');

async function backfill() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }
  const workspaces = await Workspace.find();
  for (const ws of workspaces) {
    if (!ws.joinCode) {
      ws.joinCode = Workspace.generateJoinCode();
      await ws.save();
      console.log(`Generated join code ${ws.joinCode} for "${ws.name}"`);
    }
  }
}

module.exports = backfill;
if (require.main === module) {
  backfill().then(() => mongoose.disconnect());
}
