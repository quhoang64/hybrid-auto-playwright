import * as fs from 'fs';
import * as path from 'path';

export function loadTestData<T>(fileName: string): T {
  const filePath = path.resolve(__dirname, '../test-data/common', fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}
