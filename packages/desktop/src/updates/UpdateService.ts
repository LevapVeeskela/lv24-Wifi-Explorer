import { app } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';

export type UpdateState =
  | 'unsupported'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error';

export type UpdateStatus = {
  state: UpdateState;
  currentVersion: string;
  enabled: boolean;
  availableVersion: string | null;
  progressPercent: number | null;
  message: string | null;
  platformSupported: boolean;
  packaged: boolean;
};

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 15_000;

function supportedPlatform(platform: NodeJS.Platform): boolean {
  // macOS auto-update requires a signed/notarized app; the public builds are
  // unsigned, so keep it manual until signing is available.
  return platform === 'win32' || platform === 'linux';
}

export class UpdateService {
  private status: UpdateStatus;
  private enabled = true;
  private initialTimer: ReturnType<typeof setTimeout> | null = null;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private manualCheck = false;

  constructor(private readonly getWindow: () => Electron.BrowserWindow | null) {
    const platformSupported = supportedPlatform(process.platform);
    this.status = {
      state: platformSupported && app.isPackaged ? 'idle' : 'unsupported',
      currentVersion: app.getVersion(),
      enabled: true,
      availableVersion: null,
      progressPercent: null,
      message: null,
      platformSupported,
      packaged: app.isPackaged,
    };
    this.attachEvents();
  }

  init(): void {
    if (!this.status.platformSupported || !app.isPackaged) {
      this.emit();
      return;
    }
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.logger = null;
    this.schedule();
    this.emit();
  }

  getStatus(): UpdateStatus {
    return { ...this.status };
  }

  setEnabled(enabled: boolean): UpdateStatus {
    this.enabled = enabled;
    this.status.enabled = enabled;
    if (!enabled) {
      this.clearTimers();
    } else if (this.status.platformSupported && app.isPackaged) {
      this.schedule();
    }
    this.emit();
    return this.getStatus();
  }

  async checkNow(): Promise<UpdateStatus> {
    if (!this.status.platformSupported || !app.isPackaged) {
      this.status.state = 'unsupported';
      this.emit();
      return this.getStatus();
    }
    this.manualCheck = true;
    await this.check();
    return this.getStatus();
  }

  install(): boolean {
    if (this.status.state !== 'downloaded') return false;
    this.status.message = null;
    autoUpdater.quitAndInstall(false, true);
    return true;
  }

  dispose(): void {
    this.clearTimers();
  }

  private schedule(): void {
    this.clearTimers();
    if (!this.enabled) return;
    this.initialTimer = setTimeout(() => {
      void this.check();
    }, INITIAL_DELAY_MS);
    this.initialTimer.unref?.();
    this.intervalTimer = setInterval(() => {
      void this.check();
    }, CHECK_INTERVAL_MS);
    this.intervalTimer.unref?.();
  }

  private clearTimers(): void {
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.initialTimer = null;
    this.intervalTimer = null;
  }

  private async check(): Promise<void> {
    if (this.status.state === 'checking' || this.status.state === 'downloading') return;
    this.status.state = 'checking';
    this.status.message = null;
    this.emit();
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo) {
        this.status.state = 'up-to-date';
        this.emit();
      }
    } catch (error) {
      this.fail(error);
    }
  }

  private download(): void {
    this.manualCheck = false;
    this.status.state = 'downloading';
    this.status.progressPercent = 0;
    this.emit();
    void autoUpdater.downloadUpdate().catch((error) => this.fail(error));
  }

  private fail(error: unknown): void {
    this.manualCheck = false;
    this.status.state = 'error';
    this.status.message =
      error instanceof Error ? error.message.slice(0, 240) : 'update check failed';
    this.status.progressPercent = null;
    this.emit();
  }

  private attachEvents(): void {
    autoUpdater.on('checking-for-update', () => {
      this.status.state = 'checking';
      this.status.message = null;
      this.emit();
    });
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.status.state = 'available';
      this.status.availableVersion = info.version;
      this.status.message = null;
      this.emit();
      if (this.enabled || this.manualCheck) this.download();
    });
    autoUpdater.on('update-not-available', () => {
      this.manualCheck = false;
      this.status.state = 'up-to-date';
      this.status.availableVersion = null;
      this.status.progressPercent = null;
      this.emit();
    });
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.status.state = 'downloading';
      this.status.progressPercent = Math.max(0, Math.min(100, Math.round(progress.percent)));
      this.emit();
    });
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.manualCheck = false;
      this.status.state = 'downloaded';
      this.status.availableVersion = info.version;
      this.status.progressPercent = 100;
      this.status.message = null;
      this.emit();
    });
    autoUpdater.on('error', (error: Error) => this.fail(error));
  }

  private emit(): void {
    const window = this.getWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send('updates:status', this.getStatus());
    }
  }
}
