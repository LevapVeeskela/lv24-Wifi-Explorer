/// <reference path="./shared/types/wifiExplorer.d.ts" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { applyMuiXLicense } from '@/shared/lib/mui/license';
import '@/shared/lib/theme/productFonts.css';

applyMuiXLicense();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('LV24 WiFi Explorer root container is missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
