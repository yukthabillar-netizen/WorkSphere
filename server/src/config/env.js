const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/worksphere',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'worksphere_jwt_access_secret_super_secret_key_12345',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'worksphere_jwt_refresh_secret_super_secret_key_67890',
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

module.exports = config;
