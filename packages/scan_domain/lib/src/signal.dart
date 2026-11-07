/// Signal: RSSI, noise, SNR, quality labels, linear dBm percent.
///
/// SNR = rssi − noise (both dBm). Quality labels are UI heuristics, not IEEE.

enum SignalQuality { excellent, good, fair, poor, unusable }

enum QualityBasis { snr, rssiFallback }

class SignalView {
  const SignalView({
    required this.rssiDbm,
    required this.noiseDbm,
    required this.snrDb,
    required this.quality,
    required this.qualityBasis,
  });

  final double rssiDbm;
  final double? noiseDbm;
  final double? snrDb;
  final SignalQuality quality;
  final QualityBasis qualityBasis;
}

const noiseValidDbmMin = -120.0;
const noiseValidDbmMax = -20.0;

const noiseValidDbm = (min: noiseValidDbmMin, max: noiseValidDbmMax);

const snrQualityMinDb = <SignalQuality, double>{
  SignalQuality.excellent: 40,
  SignalQuality.good: 25,
  SignalQuality.fair: 15,
  SignalQuality.poor: 10,
  SignalQuality.unusable: double.negativeInfinity,
};

const rssiQualityMinDbm = <SignalQuality, double>{
  SignalQuality.excellent: -50,
  SignalQuality.good: -60,
  SignalQuality.fair: -70,
  SignalQuality.poor: -80,
  SignalQuality.unusable: double.negativeInfinity,
};

const percentZeroDbm = -100.0;
const percentFullDbm = -50.0;

const _qualityOrder = <SignalQuality>[
  SignalQuality.excellent,
  SignalQuality.good,
  SignalQuality.fair,
  SignalQuality.poor,
  SignalQuality.unusable,
];

bool isNoiseValid(double noiseDbm) {
  return noiseDbm.isFinite &&
      noiseDbm >= noiseValidDbmMin &&
      noiseDbm <= noiseValidDbmMax;
}

double? snrDbm(double rssiDbm, double noiseDbm) {
  if (!rssiDbm.isFinite || !isNoiseValid(noiseDbm)) return null;
  return rssiDbm - noiseDbm;
}

SignalQuality qualityFromTable(
  double value,
  Map<SignalQuality, double> table,
) {
  for (final label in _qualityOrder) {
    if (value >= table[label]!) return label;
  }
  return SignalQuality.unusable;
}

SignalQuality signalQuality(double rssiDbm, double noiseDbm) {
  final snr = snrDbm(rssiDbm, noiseDbm);
  if (snr != null) return qualityFromTable(snr, snrQualityMinDb);
  return qualityFromTable(rssiDbm, rssiQualityMinDbm);
}

QualityBasis qualityBasisOf(double noiseDbm) {
  return isNoiseValid(noiseDbm) ? QualityBasis.snr : QualityBasis.rssiFallback;
}

int percentFromDbm(
  double dbm, {
  double zeroDbm = percentZeroDbm,
  double fullDbm = percentFullDbm,
}) {
  if (!dbm.isFinite || !zeroDbm.isFinite || !fullDbm.isFinite) return 0;
  final span = fullDbm - zeroDbm;
  if (span == 0) return 0;
  final raw = (100 * (dbm - zeroDbm)) / span;
  if (!raw.isFinite) return 0;
  return raw.round().clamp(0, 100);
}

SignalView computeSignalView(double rssiDbm, double noiseRaw) {
  final noise = isNoiseValid(noiseRaw) ? noiseRaw : null;
  final snr = noise != null ? rssiDbm - noise : null;
  return SignalView(
    rssiDbm: rssiDbm,
    noiseDbm: noise,
    snrDb: snr,
    quality: signalQuality(rssiDbm, noiseRaw),
    qualityBasis: qualityBasisOf(noiseRaw),
  );
}
