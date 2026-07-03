const required = [
  'VITE_APP_BACKEND_URL',
  'VITE_APP_AUTH_URL',
] as const;

function getEnv(key: (typeof required)[number]): string {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required env: ${key}. Copy .env.example to .env and set values.`);
  }
  return value;
}

export const env = {
  VITE_APP_BACKEND_URL: getEnv('VITE_APP_BACKEND_URL'),
  VITE_APP_AUTH_URL: getEnv('VITE_APP_AUTH_URL'),
};

export function validateEnv(): void {
  required.forEach(getEnv);
}
