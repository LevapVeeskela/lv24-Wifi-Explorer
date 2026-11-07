import 'string_storage.dart';

bool get isDesktopConfigPlatform => false;

StringStorage createPlatformStringStorage() => InMemoryStringStorage();

Future<StringStorage> ensurePlatformStringStorageReady() async =>
    InMemoryStringStorage();
