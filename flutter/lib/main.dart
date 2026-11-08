import 'package:flutter/widgets.dart';

import 'app/lv24_app.dart';
import 'shared/oui/scan_oui_registry.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await warmUpOuiRegistry();
  runApp(const Lv24App());
}
