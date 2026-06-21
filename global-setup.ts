import dotenv from 'dotenv';
import path from 'path';
import { validateEnvironment } from '@helpers/EnvValidator';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
  validateEnvironment();
}
