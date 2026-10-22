const http = require('http');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server, config.clientUrl);

// Connect to Database and start listening
connectDB().then(() => {
  server.listen(config.port, () => {
    console.log(`🚀 WorkSphere Server running on http://localhost:${config.port} in ${config.env} mode`);
  });
}).catch((err) => {
  console.error('Failed to start server due to DB error:', err);
  process.exit(1);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('Stopping server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// WorkSphere Server initialized with workspace join-code & SMTP support


