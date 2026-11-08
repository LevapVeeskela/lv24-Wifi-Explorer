import type { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid-pro';

export function emptySelectionModel(): GridRowSelectionModel {
  return { type: 'include', ids: new Set<GridRowId>() };
}

export function singleSelectionModel(id: GridRowId | null): GridRowSelectionModel {
  return {
    type: 'include',
    ids: id == null ? new Set() : new Set<GridRowId>([id]),
  };
}

export function firstSelectedRowId(model: GridRowSelectionModel): GridRowId | null {
  if (model.type !== 'include' || model.ids.size === 0) return null;
  return model.ids.values().next().value ?? null;
}

export function selectionCount(model: GridRowSelectionModel): number {
  return model.type === 'include' ? model.ids.size : 0;
}

export function isRowSelected(model: GridRowSelectionModel, id: GridRowId): boolean {
  return model.type === 'include' && model.ids.has(id);
}
