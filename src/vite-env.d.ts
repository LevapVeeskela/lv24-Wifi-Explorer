// oxlint-disable typescript/triple-slash-reference
/// <reference types="vite/client" />
/// <reference path="./shared/lib/theme/muiXThemeAugmentation.d.ts" />
/// <reference path="./shared/types/wifiExplorer.d.ts" />

interface ImportMetaEnv {
  readonly VITE_MUI_LICENSE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
