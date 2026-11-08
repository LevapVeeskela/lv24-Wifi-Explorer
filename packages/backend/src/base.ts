import type {
  ScanProvider,
  ScanProviderEvent,
  ScanProviderOptions,
  ScanProviderError,
  ScanSnapshotPayload,
} from './types';

/** Tiny typed event hub shared by all providers (no Node EventEmitter coupling). */
export abstract class BaseScanProvider implements ScanProvider {
  abstract readonly id: ScanProvider['id'];
  readonly platform: NodeJS.Platform = process.platform;
  private readonly listeners = new Set<(event: ScanProviderEvent) => void>();

  onEvent(listener: (event: ScanProviderEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected emit(event: ScanProviderEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  protected emitSnapshot(payload: ScanSnapshotPayload): void {
    this.emit({ type: 'snapshot', payload });
  }

  protected emitError(error: ScanProviderError): void {
    this.emit({ type: 'error', error });
  }

  abstract start(options: ScanProviderOptions): Promise<void>;
  abstract stop(): Promise<void>;
}
