import { existsSync } from 'fs';
import path from 'path';

test('optimization types file exists', () => {
  expect(existsSync(path.resolve(__dirname, '../../src/types/optimization.ts'))).toBe(true);
});
