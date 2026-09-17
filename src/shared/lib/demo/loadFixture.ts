/**
 * Bundled scan snapshots under `resources/fixtures/` (original demo data, not commercial dumps).
 */

import type { ScanSnapshot } from '@/domain/scan';

import scanSnapshotMain from '../../../../resources/fixtures/scan-snapshot.json';
import scanSnapshotMinimal from '../../../../resources/fixtures/scan-snapshot-minimal.json';

export type ScanFixtureId = 'scan-snapshot' | 'scan-snapshot-minimal';

const FIXTURES: Record<ScanFixtureId, ScanSnapshot> = {
  'scan-snapshot': scanSnapshotMain as unknown as ScanSnapshot,
  'scan-snapshot-minimal': scanSnapshotMinimal as unknown as ScanSnapshot,
};

/** Default full demo snapshot (11 BSS). */
export const DEFAULT_SCAN_FIXTURE_ID: ScanFixtureId = 'scan-snapshot';

export function loadScanSnapshotFixture(id: ScanFixtureId = DEFAULT_SCAN_FIXTURE_ID): ScanSnapshot {
  return FIXTURES[id];
}

/** BSSID of the associated link in bundled fixtures (Meridia-Office 5 GHz / 80 MHz). */
export function associatedBssidFromFixture(snapshot: ScanSnapshot): string | null {
  const bssid = snapshot.associated?.bssid;
  if (!bssid || bssid.status !== 'available') return null;
  return bssid.value;
}
