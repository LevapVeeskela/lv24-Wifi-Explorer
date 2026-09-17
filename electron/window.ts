/** BrowserWindow options — pure module (no Electron import) for headless tests. */

export interface MainWindowConfig {
  title: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  show: boolean;
  autoHideMenuBar: boolean;
  webPreferences: {
    contextIsolation: boolean;
    nodeIntegration: boolean;
    sandbox: boolean;
    preload?: string;
  };
}

export function createMainWindowConfig(input: {
  preloadPath: string;
  title: string;
}): MainWindowConfig {
  return {
    title: input.title,
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: input.preloadPath,
    },
  };
}
