const SUNSET_HUES = [
  '#FB6E4A',
  '#A78BFA',
  '#34D399',
  '#FBBF24',
  '#38BDF8',
  '#FB7185',
  '#FCA98B',
  '#C4B5FD',
  '#6EE7B7',
  '#FCD34D',
  '#7DD3FC',
  '#FDA4AF',
] as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seriesColorForBssid(bssid: string): string {
  const index = hashString(bssid) % SUNSET_HUES.length;
  return SUNSET_HUES[index] ?? SUNSET_HUES[0];
}
