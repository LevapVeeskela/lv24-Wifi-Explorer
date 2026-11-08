import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { makeObservedBss } from '@/domain/testSupport';
import { observedBssToGridRow, type ScanGridRow } from '@/entities/bss';
import { FILTER_DEFAULTS } from '@/features/scan-filters';
import { ScanIntlProvider } from '@/shared/i18n';
import { FilterSidebar } from './FilterSidebar';

const ROWS: ScanGridRow[] = [
  observedBssToGridRow(
    makeObservedBss({ ssid: 'Cafe-2G', bssid: 'aa:bb:cc:00:00:01', band: 2.4, channel: 6 }),
    {}
  )!,
  observedBssToGridRow(
    makeObservedBss({ ssid: 'Cafe-5G', bssid: 'aa:bb:cc:00:00:02', band: 5, channel: 36 }),
    {}
  )!,
  observedBssToGridRow(
    makeObservedBss({
      ssid: 'Cafe-5G-2',
      bssid: 'aa:bb:cc:00:00:03',
      band: 5,
      channel: 44,
    }),
    {}
  )!,
];

function render(locale: 'ru' | 'en' | 'zh'): string {
  return renderToStaticMarkup(
    <ScanIntlProvider locale={locale}>
      <FilterSidebar rows={ROWS} filters={FILTER_DEFAULTS} onFiltersChange={() => {}} />
    </ScanIntlProvider>
  );
}

describe('FilterSidebar render', () => {
  it('renders facet sections and per-band counts in English', () => {
    const html = render('en');
    expect(html).toContain('Band');
    expect(html).toContain('Channel');
    expect(html).toContain('2.4 GHz (1)');
    expect(html).toContain('5 GHz (2)');
    expect(html).toContain('Selected networks only');
  });

  it('renders the same structure in Russian', () => {
    const html = render('ru');
    expect(html).toContain('Диапазон');
    expect(html).toContain('Канал');
    expect(html).toContain('2,4 ГГц (1)');
  });

  it('renders Simplified Chinese instead of falling back to Russian', () => {
    const html = render('zh');
    expect(html).toContain('频段');
    expect(html).toContain('信道');
    expect(html).toContain('仅所选网络');
    expect(html).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('shows the empty hint only when there are no rows', () => {
    const empty = renderToStaticMarkup(
      <ScanIntlProvider locale="en">
        <FilterSidebar rows={[]} filters={FILTER_DEFAULTS} onFiltersChange={() => {}} />
      </ScanIntlProvider>
    );
    expect(empty).toContain('No networks to filter yet.');
    expect(render('en')).not.toContain('No networks to filter yet.');
  });
});
