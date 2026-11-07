import 'dart:convert';
import 'dart:io';

import 'oui_parse.dart';
import 'oui_types.dart';
import 'registry_paths.dart';

/// In-memory IEEE MA-L prefix → organization map.
class OuiRegistry {
  OuiRegistry._(this._byPrefix, this.meta);

  final Map<String, String> _byPrefix;
  final OuiRegistryMeta meta;

  OuiSource get datasetSource => meta.source;

  /// Load registry JSON from [path].
  factory OuiRegistry.fromFile(String path) {
    final raw = File(path).readAsStringSync();
    return OuiRegistry.fromJsonString(raw);
  }

  factory OuiRegistry.fromJsonString(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw FormatException('OUI registry root must be a JSON object');
    }
    return OuiRegistry.fromJson(decoded);
  }

  factory OuiRegistry.fromJson(Map<String, dynamic> json) {
    final metaJson = json['meta'];
    if (metaJson is! Map<String, dynamic>) {
      throw FormatException('OUI registry missing meta object');
    }
    final byPrefixJson = json['byPrefix'];
    if (byPrefixJson is! Map) {
      throw FormatException('OUI registry missing byPrefix map');
    }

    final byPrefix = <String, String>{};
    for (final entry in byPrefixJson.entries) {
      final key = entry.key.toString().trim().toLowerCase();
      final value = entry.value?.toString() ?? '';
      if (key.isNotEmpty && value.isNotEmpty) {
        byPrefix[key] = value;
      }
    }

    return OuiRegistry._(
      byPrefix,
      OuiRegistryMeta.fromJson(metaJson),
    );
  }

  /// Load the first existing [resources/oui/registry.json] under [repoRoot] or cwd.
  static OuiRegistry? tryLoad({String? repoRoot, List<String>? candidates}) {
    final path = resolveOuiRegistryPath(
      repoRoot: repoRoot,
      candidates: candidates,
    );
    if (path == null) return null;
    return OuiRegistry.fromFile(path);
  }

  /// IEEE MA-L organization for a normalized 24-bit prefix (`aa:bb:cc`).
  String? lookupOrganizationByPrefix(String oui) {
    final key = normalizeOuiPrefix(oui);
    if (!isValidOuiPrefix(key)) {
      return null;
    }
    final vendor = _byPrefix[key];
    if (vendor == null || vendor.isEmpty) {
      return null;
    }
    return vendor;
  }

  /// Resolve vendor for a BSSID using this registry.
  OuiLookupResult lookup(String bssid) {
    if (bssid.isEmpty) {
      return OuiLookupResult.unknown;
    }

    final parsed = parseBssid(bssid);
    if (parsed == null) {
      return OuiLookupResult.unknown;
    }

    final oui = parsed.oui;
    if (parsed.locallyAdministered) {
      return OuiLookupResult(
        oui: oui,
        vendor: null,
        source: OuiSource.unknown,
        randomized: true,
      );
    }

    final vendor = lookupOrganizationByPrefix(oui);
    if (vendor == null) {
      return OuiLookupResult(
        oui: oui,
        vendor: null,
        source: OuiSource.unknown,
        randomized: false,
      );
    }

    return OuiLookupResult(
      oui: oui,
      vendor: vendor,
      source: datasetSource,
      randomized: false,
    );
  }
}
