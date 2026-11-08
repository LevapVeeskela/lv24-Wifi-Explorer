import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ScanGridRow } from '@/entities/bss';
import type { ScanIssueId } from '@/features/scan-issues';

/** Data the page computes once per scan snapshot for the issues inspector. */
export type IssuesInspectorData = {
  rows: readonly ScanGridRow[];
  /** Precomputed row id → issue ids (from `computeIssueKeysForScan`). */
  issueIdsByRowId?: ReadonlyMap<string, readonly ScanIssueId[]>;
  selectedBssid?: string | null;
  onSelectBssid?: (bssid: string) => void;
};

const IssuesInspectorContext = createContext<IssuesInspectorData | null>(null);

export function IssuesInspectorProvider({
  value,
  children,
}: {
  value: IssuesInspectorData;
  children: ReactNode;
}) {
  return (
    <IssuesInspectorContext.Provider value={value}>{children}</IssuesInspectorContext.Provider>
  );
}

/** Null when the dock is rendered outside the workbench (e.g. stories/tests). */
export function useIssuesInspectorData(): IssuesInspectorData | null {
  return useContext(IssuesInspectorContext);
}
