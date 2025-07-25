const NODE_ENV = process.env.NODE_ENV || 'local';

console.log(`Environment: ${NODE_ENV}`);

const getEnvVar = (name: string, isRequired = false, defaultValue = ''): string => {
  const value = process.env[name];

  if (isRequired && value == null) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }

  return value ?? defaultValue;
};

export const config = {
  bot: {
    token: getEnvVar('BOT_TOKEN', true),
  },

  app: {
    env: NODE_ENV,
    dateFormat: 'yyyy-MM-dd',
    defaultTZ: 'America/New_York',
  },

  database: {
    url: getEnvVar('DATABASE_URL', true),
  },
};
