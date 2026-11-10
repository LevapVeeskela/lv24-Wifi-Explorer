import { CLI_VERSION } from './generated/version';

export { CLI_VERSION };

/** Exact stdout payload of `lv24-wifi --version`. */
export function formatVersion(): string {
  return `${CLI_VERSION}\n`;
}
