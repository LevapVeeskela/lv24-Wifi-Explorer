import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

import 'test_support.dart';

void main() {
  group('groupEss', () {
    test('groups visible BSS by ssidData and isolates hidden / IBSS', () {
      final a = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:01',
        ssid: 'Campus',
        band: WifiBand.ghz24,
        channel: 6,
      ));
      final b = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:02',
        ssid: 'Campus',
        band: WifiBand.ghz5,
        channel: 36,
        security: 'wpa3-personal',
      ));
      final hiddenA = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:10',
        hidden: true,
      ));
      final hiddenB = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:11',
        hidden: true,
      ));
      final ibss = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:00:00:20',
        ssid: 'Campus',
        ibss: true,
      ));

      final groups = groupEss([a, b, hiddenA, hiddenB, ibss]);
      final infra = groups.where((g) => g.kind == EssKind.infrastructure).toList();
      final hidden = groups.where((g) => g.kind == EssKind.hiddenSingleton).toList();
      final adhoc = groups.where((g) => g.kind == EssKind.ibss).toList();

      expect(infra, hasLength(1));
      expect(infra.first.bssCount, 2);
      expect(infra.first.key, essGroupKeyOf(a).key);
      expect(infra.first.securityMixed, isTrue);
      expect(infra.first.bandMix, [WifiBand.ghz24, WifiBand.ghz5]);

      expect(hidden, hasLength(2));
      expect(hidden.every((g) => g.bssCount == 1), isTrue);
      expect(hidden.first.key, isNot(hidden.last.key));

      expect(adhoc, hasLength(1));
      expect(adhoc.first.key, startsWith('ibss:'));
    });

    test('does not merge different ssidData', () {
      final groups = groupEss([
        makeObservedBss(MakeBssInput(
          bssid: '00:11:22:00:00:01',
          ssid: 'Alpha',
        )),
        makeObservedBss(MakeBssInput(
          bssid: '00:11:22:00:00:02',
          ssid: 'Beta',
        )),
      ]);
      expect(groups, hasLength(2));
    });
  });
}
