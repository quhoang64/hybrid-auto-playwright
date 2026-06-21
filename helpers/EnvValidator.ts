const REQUIRED_ENV_VARS = ['BASE_URL', 'USER_EMAIL', 'USER_PASSWORD'];

export function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n` +
        missing.map((k) => `   - ${k}`).join('\n') +
        `\n\n👉 Copy .env.example to .env and fill in the values.\n`,
    );
  }

  const baseUrl = process.env.BASE_URL!;
  try {
    new URL(baseUrl);
  } catch {
    throw new Error(
      `\n\n❌ BASE_URL is not a valid URL: "${baseUrl}"\n` +
        `   Expected format: https://your-app.com\n`,
    );
  }
}
