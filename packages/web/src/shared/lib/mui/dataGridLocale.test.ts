import { describe, expect, it } from 'vitest';
import { getDataGridLocaleText, normalizeAppLocale } from './dataGridLocale';

describe('dataGridLocale', () => {
  it('normalizes zh variants to zh', () => {
    expect(normalizeAppLocale('zh-CN')).toBe('zh');
    expect(normalizeAppLocale('zh-TW')).toBe('zh');
    expect(normalizeAppLocale('en-US')).toBe('en');
    expect(normalizeAppLocale('ru-RU')).toBe('ru');
    expect(normalizeAppLocale('de-DE')).toBe('ru');
  });

  it('returns Simplified Chinese grid text for zh', () => {
    const zh = getDataGridLocaleText('zh-CN');
    const en = getDataGridLocaleText('en');
    const ru = getDataGridLocaleText('ru');
    expect(zh.noRowsLabel).not.toBe(en.noRowsLabel);
    expect(zh.noRowsLabel).not.toBe(ru.noRowsLabel);
    expect(zh.noRowsLabel).toContain('数据');
  });

  it('routes en and ru to their locales', () => {
    expect(getDataGridLocaleText('en-US').noRowsLabel).toBe(
      getDataGridLocaleText('en').noRowsLabel
    );
    expect(getDataGridLocaleText('ru').noRowsLabel).not.toBe(
      getDataGridLocaleText('en').noRowsLabel
    );
  });

  it('falls back to ru for unknown locales', () => {
    expect(getDataGridLocaleText('de').noRowsLabel).toBe(getDataGridLocaleText('ru').noRowsLabel);
  });

  it('localizes pagination rows text', () => {
    const zh = getDataGridLocaleText('zh').paginationDisplayedRows;
    expect(zh?.({ from: 1, to: 50, count: 120, estimated: undefined })).toBe('1–50，共 120 条');
    const ru = getDataGridLocaleText('ru').paginationDisplayedRows;
    expect(ru?.({ from: 1, to: 50, count: 120, estimated: undefined })).toBe('1–50 из 120');
  });
});
