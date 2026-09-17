import { LicenseInfo } from '@mui/x-license';

export function applyMuiXLicense(): void {
  const key = String(import.meta.env.VITE_MUI_LICENSE_KEY ?? '').trim();
  if (key) {
    LicenseInfo.setLicenseKey(key);
  }
}

applyMuiXLicense();
