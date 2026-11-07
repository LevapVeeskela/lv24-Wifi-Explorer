/// Open thresholds for scan issue heuristics (documented in product help).
const scanIssueThresholds = (
  lowSignalRssiDbm: -70,
  lowSnrDb: 25,
  crowdedChannelMinNeighbors: 4,
  highUtilPct: 70,
  band24MinWidthMhz: 40,
);

const nonOverlapping24Channels = <int>[1, 6, 11];
