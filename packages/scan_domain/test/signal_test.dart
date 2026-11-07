import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

void main() {
  group('snrDbm', () {
    test('equals rssi minus noise when noise is valid', () {
      expect(snrDbm(-50, -90), 40);
      expect(snrDbm(-70, -80), 10);
      expect(snrDbm(-50, -20), -30);
      expect(snrDbm(-50, -120), 70);
    });

    test('returns null for invalid noise', () {
      expect(isNoiseValid(0), isFalse);
      expect(snrDbm(-50, 0), isNull);
      expect(snrDbm(-50, -19), isNull);
      expect(snrDbm(-50, -121), isNull);
      expect(snrDbm(-50, 127), isNull);
      expect(snrDbm(-50, double.nan), isNull);
    });
  });

  group('signalQuality', () {
    test('uses SNR table first', () {
      expect(signalQuality(-50, -90), SignalQuality.excellent);
      expect(signalQuality(-70, -80), SignalQuality.poor);
      expect(signalQuality(-70, -79), SignalQuality.unusable);
      expect(qualityBasisOf(-90), QualityBasis.snr);
    });

    test('falls back to RSSI when noise is invalid', () {
      expect(signalQuality(-50, 0), SignalQuality.excellent);
      expect(signalQuality(-60, 0), SignalQuality.good);
      expect(signalQuality(-81, 0), SignalQuality.unusable);
      expect(qualityBasisOf(0), QualityBasis.rssiFallback);
      expect(computeSignalView(-50, 0).snrDb, isNull);
      expect(computeSignalView(-50, 0).noiseDbm, isNull);
      expect(computeSignalView(-50, 0).qualityBasis, QualityBasis.rssiFallback);
    });
  });

  group('percentFromDbm', () {
    test('maps default zero=-100 / full=-50 linearly', () {
      expect(percentZeroDbm, -100);
      expect(percentFullDbm, -50);
      expect(percentFromDbm(-100), 0);
      expect(percentFromDbm(-50), 100);
      expect(percentFromDbm(-75), 50);
    });

    test('never returns a negative percent', () {
      expect(percentFromDbm(-200), 0);
      expect(percentFromDbm(-30), 100);
      expect(percentFromDbm(double.nan), 0);
      expect(percentFromDbm(-80, zeroDbm: -80, fullDbm: -80), 0);
      expect(percentFromDbm(-120, zeroDbm: -100, fullDbm: -50), greaterThanOrEqualTo(0));
    });
  });
}
