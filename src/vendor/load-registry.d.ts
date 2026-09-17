import type { LoadedOuiRegistry } from './lookup';

export const DATA_OUI_DIR: string;

export function resolveOuiRegistryPath(filePath?: string): string;

export function loadOuiRegistry(filePath?: string): LoadedOuiRegistry;
