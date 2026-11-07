import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

import 'test_support.dart';

void main() {
  group('occupancy score', () {
    test('scores overlapping BSS by rssi and width, labeled not CCA', () {
      final strong20 = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:01',
        band: WifiBand.ghz5,
        channel: 36,
        widthMhz: ChannelWidthMhz.mhz80,
        rssiDbm: -50,
      ));
      final bars = computeBandOccupancy([strong20], WifiBand.ghz5, selectedChannel: 36);
      expect(bars.every((bar) => bar.source == occupancyKind), isTrue);
      expect(bars.firstWhere((bar) => bar.channel == 36).selected, isTrue);

      final on36 = bars.firstWhere((bar) => bar.channel == 36).score;
      final on40 = bars.firstWhere((bar) => bar.channel == 40).score;
      final on48 = bars.firstWhere((bar) => bar.channel == 48).score;
      final on149 = bars.firstWhere((bar) => bar.channel == 149).score;
      expect(on36, greaterThan(0));
      expect(on40, greaterThan(0));
      expect(on48, greaterThan(0));
      expect(on149, 0);
      expect(on36, lessThanOrEqualTo(100));

      final weak = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:02',
        band: WifiBand.ghz5,
        channel: 36,
        widthMhz: ChannelWidthMhz.mhz20,
        rssiDbm: -90,
      ));
      expect(
        occupancyScore([strong20], WifiBand.ghz5, 36),
        greaterThan(occupancyScore([weak], WifiBand.ghz5, 36)),
      );
    });

    test('spreads 2.4 GHz 20 MHz energy onto overlapping neighbors', () {
      final ch6 = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:03',
        band: WifiBand.ghz24,
        channel: 6,
        widthMhz: ChannelWidthMhz.mhz20,
        rssiDbm: -50,
      ));
      expect(
        occupancyScore([ch6], WifiBand.ghz24, 6),
        greaterThan(occupancyScore([ch6], WifiBand.ghz24, 4)),
      );
      expect(occupancyScore([ch6], WifiBand.ghz24, 4), greaterThan(0));
      expect(occupancyScore([ch6], WifiBand.ghz24, 1), 0);
    });
  });
}
