import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/app/lv24_app.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Scan workbench shows demo chrome and start control', (tester) async {
    await tester.pumpWidget(const Lv24App());
    await tester.pump();

    expect(find.text('LV24 WiFi Explorer'), findsOneWidget);
    expect(find.text('Старт'), findsOneWidget);
    expect(find.textContaining('Демо'), findsWidgets);
  });
}
