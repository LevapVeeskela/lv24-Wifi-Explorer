import 'package:scan_domain/scan_domain.dart';

import '../../features/scan_filters/scan_workbench_filters.dart';

const autoFilterMaxVendors = 16;

class BandFacet {
  const BandFacet({required this.id, required this.count});

  final BandFilterValue id;
  final int count;
}

class SecurityFacet {
  const SecurityFacet({required this.id, required this.count});

  final SecurityFilterValue id;
  final int count;
}

class VendorFacet {
  const VendorFacet({required this.label, required this.count});

  /// Display label; empty string means unknown vendor.
  final String label;
  final int count;
}

class AutoFilterFacets {
  const AutoFilterFacets({
    required this.bands,
    required this.security,
    required this.vendors,
  });

  final List<BandFacet> bands;
  final List<SecurityFacet> security;
  final List<VendorFacet> vendors;
}

const _bandFacetOrder = <BandFilterValue>[
  BandFilterValue.ghz24,
  BandFilterValue.ghz5,
  BandFilterValue.ghz6,
];

BandFilterValue? _bandFilterFromRow(WifiBand? band) {
  return switch (band) {
    WifiBand.ghz24 => BandFilterValue.ghz24,
    WifiBand.ghz5 => BandFilterValue.ghz5,
    WifiBand.ghz6 => BandFilterValue.ghz6,
    null => null,
  };
}

AutoFilterFacets buildAutoFilterFacets(List<ObservedBss> rows) {
  final bandCounts = <BandFilterValue, int>{};
  var openCount = 0;
  var secureCount = 0;
  final vendorByKey = <String, ({String label, int count})>{};

  for (final row in rows) {
    final bandId = _bandFilterFromRow(row.channel.band);
    if (bandId != null) {
      bandCounts[bandId] = (bandCounts[bandId] ?? 0) + 1;
    }
    if (row.security.isOpen) {
      openCount += 1;
    } else {
      secureCount += 1;
    }

    final label = (row.vendor.organization ?? '').trim();
    final key = label.toLowerCase();
    final existing = vendorByKey[key];
    if (existing != null) {
      vendorByKey[key] = (label: existing.label, count: existing.count + 1);
    } else {
      vendorByKey[key] = (label: label, count: 1);
    }
  }

  final bands = <BandFacet>[
    for (final id in _bandFacetOrder)
      if ((bandCounts[id] ?? 0) > 0)
        BandFacet(id: id, count: bandCounts[id]!),
  ];

  final security = <SecurityFacet>[
    if (openCount > 0)
      SecurityFacet(id: SecurityFilterValue.open, count: openCount),
    if (secureCount > 0)
      SecurityFacet(id: SecurityFilterValue.secure, count: secureCount),
  ];

  final vendors = vendorByKey.values.toList()
    ..sort((a, b) {
      final byCount = b.count.compareTo(a.count);
      if (byCount != 0) return byCount;
      return a.label.compareTo(b.label);
    });

  return AutoFilterFacets(
    bands: bands,
    security: security,
    vendors: vendors
        .take(autoFilterMaxVendors)
        .map((v) => VendorFacet(label: v.label, count: v.count))
        .toList(growable: false),
  );
}

bool vendorQueryMatchesLabel(String vendorQuery, String label) {
  final q = vendorQuery.trim().toLowerCase();
  if (q.isEmpty) return false;
  return q == label.trim().toLowerCase();
}
