const required = [
  'TEST_DB_HOST',
  'TEST_DB_PORT',
  'TEST_DB_USERNAME',
  'TEST_DB_PASSWORD',
  'TEST_DB_NAME',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required test DB env vars: ${missing.join(', ')}`,
  );
}

process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST;
process.env.DB_PORT = process.env.TEST_DB_PORT;
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME;
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;
process.env.DB_NAME = process.env.TEST_DB_NAME;
process.env.DB_SYNCHRONIZE = 'false';
process.env.DB_MIGRATIONS_RUN = 'true';
process.env.DB_LOGGING = process.env.TEST_DB_LOGGING ?? 'false';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-only-jwt-secret-32-chars-min';
