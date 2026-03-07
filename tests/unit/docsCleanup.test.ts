import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function read(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function fileExists(relPath: string): boolean {
  return existsSync(path.join(ROOT, relPath));
}

describe('Phase 3: Dead Code Cleanup', () => {
  test('treeOptimizer.ts has no dead exported functions', () => {
    if (fileExists('src/treeOptimizer.ts')) {
      const content = read('src/treeOptimizer.ts');
      const deadExports = (content.match(/^export function/gm) || []).length;
      expect(deadExports).toBe(0);
    }
  });

  test('OptimizationConstraints type exists in src/types/optimization.ts', () => {
    expect(fileExists('src/types/optimization.ts')).toBe(true);
    const content = read('src/types/optimization.ts');
    expect(content).toContain('OptimizationConstraints');
  });

  test('ToolResponse type defined in only one file', () => {
    const responseUtils = read('src/server/responseUtils.ts');
    const toolRouter = read('src/server/toolRouter.ts');
    const inResponseUtils = responseUtils.includes('type ToolResponse');
    const inToolRouter = toolRouter.includes('type ToolResponse');
    expect(inResponseUtils && inToolRouter).toBe(false);
  });

  test('formatTimeAgo not exported from responseUtils', () => {
    const content = read('src/server/responseUtils.ts');
    expect(content).not.toContain('export function formatTimeAgo');
  });

  test('analyzeItemSlot not exported from itemAnalyzer', () => {
    const content = read('src/itemAnalyzer.ts');
    expect(content).not.toContain('export function analyzeItemSlot');
  });

  test('checkResistances not exported from itemAnalyzer', () => {
    const content = read('src/itemAnalyzer.ts');
    expect(content).not.toContain('export function checkResistances');
  });

  test('detectSkillType not exported from skillLinkOptimizer', () => {
    const content = read('src/skillLinkOptimizer.ts');
    expect(content).not.toContain('export function detectSkillType');
  });

  test('isSupportGem not exported from skillLinkOptimizer', () => {
    const content = read('src/skillLinkOptimizer.ts');
    expect(content).not.toContain('export function isSupportGem');
  });

  test('analyzeSkillGroup not exported from skillLinkOptimizer', () => {
    const content = read('src/skillLinkOptimizer.ts');
    expect(content).not.toContain('export function analyzeSkillGroup');
  });
});

describe('Phase 5: Stale dispatch entries', () => {
  test('toolRouter has no stale analyze_cluster_jewels entry', () => {
    const content = read('src/server/toolRouter.ts');
    expect(content).not.toContain('"analyze_cluster_jewels"');
  });
});

describe('Phase 4: Complexity Refactoring', () => {
  test('toolRouter uses dispatch table (no switch cases)', () => {
    const content = read('src/server/toolRouter.ts');
    const switchCases = (content.match(/case "/g) || []).length;
    expect(switchCases).toBe(0);
  });

  test('tradeContext not duplicated', () => {
    const content = read('src/server/toolRouter.ts');
    const count = (content.match(/const tradeContext = \{/g) || []).length;
    expect(count).toBeLessThanOrEqual(1);
  });
});
