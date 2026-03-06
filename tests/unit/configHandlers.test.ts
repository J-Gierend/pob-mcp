import { describe, it, expect, jest } from '@jest/globals';
import { handleSaveConfigPreset, handleLoadConfigPreset, ConfigPresetContext } from '../../src/handlers/configHandlers';

function makeContext(overrides?: Partial<ConfigPresetContext>): ConfigPresetContext {
  return {
    getLuaClient: () => ({
      getConfig: jest.fn<any>().mockResolvedValue({ someSetting: true }),
      setConfig: jest.fn<any>().mockResolvedValue(undefined),
    } as any),
    ensureLuaClient: jest.fn<any>().mockResolvedValue(undefined),
    pobDirectory: '/tmp/pob-test',
    ...overrides,
  };
}

describe('configHandlers path traversal', () => {
  it('should reject preset name with ../ traversal on save', async () => {
    const ctx = makeContext();
    await expect(handleSaveConfigPreset(ctx, '../../etc/evil')).rejects.toThrow(/path traversal|must be relative|outside base/i);
  });

  it('should reject preset name with ../ traversal on load', async () => {
    const ctx = makeContext();
    await expect(handleLoadConfigPreset(ctx, '../../etc/evil')).rejects.toThrow(/path traversal|must be relative|outside base/i);
  });

  it('should reject absolute path preset name on save', async () => {
    const ctx = makeContext();
    await expect(handleSaveConfigPreset(ctx, '/etc/passwd')).rejects.toThrow(/path traversal|must be relative|outside base/i);
  });

  it('should reject null bytes in preset name', async () => {
    const ctx = makeContext();
    await expect(handleSaveConfigPreset(ctx, 'foo\0bar')).rejects.toThrow(/null bytes/i);
  });
});
