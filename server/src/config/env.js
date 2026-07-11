const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

function getEnvironmentValue(name, developmentFallback) {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (nodeEnv === 'production') {
    throw new Error(`${name} must be configured in production.`);
  }

  return developmentFallback;
}

function getBooleanValue(name, fallback) {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  clientUrl: getEnvironmentValue('CLIENT_URL', 'http://localhost:5173'),
  mongoUri: getEnvironmentValue('MONGO_URI', 'mongodb://127.0.0.1:27017/hrms_auth'),
  jwtAccessSecret: getEnvironmentValue('JWT_ACCESS_SECRET', 'change-me-access-secret'),
  jwtRefreshSecret: getEnvironmentValue('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
  accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_TTL || '7d',
  cookieName: process.env.REFRESH_COOKIE_NAME || 'hrms_refresh_token',
  adminEmail: getEnvironmentValue('SEED_ADMIN_EMAIL', 'admin@hrms.com'),
  adminPassword: getEnvironmentValue('SEED_ADMIN_PASSWORD', 'Admin@123'),
  employeeEmail: process.env.SEED_EMPLOYEE_EMAIL || 'employee@hrms.com',
  employeePassword: process.env.SEED_EMPLOYEE_PASSWORD || 'Employee@123',
  seedDemoData: getBooleanValue('SEED_DEMO_DATA', nodeEnv !== 'production'),
};

if (
  nodeEnv === 'production' &&
  (env.jwtAccessSecret === 'change-me-access-secret' ||
    env.jwtRefreshSecret === 'change-me-refresh-secret')
) {
  throw new Error('Production JWT secrets must not use development fallback values.');
}

if (nodeEnv === 'production' && env.jwtAccessSecret === env.jwtRefreshSecret) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
}

module.exports = env;
