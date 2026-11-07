import 'package:scan_domain/scan_domain.dart';

import 'from_observed_bss.dart';

/// Issue message keys (`scan.issue.lowSignal`, …) for one BSS vs the full snapshot.
List<String> computeIssueKeys(
  ObservedBss bss,
  List<ObservedBss> all, [
  EvaluateIssuesOptions? options,
]) {
  final self = scanIssueBssFromObserved(bss);
  final neighbors = all.map(scanIssueBssFromObserved).toList();
  return evaluateIssues(self, neighbors, options)
      .map((flag) => flag.i18nKey)
      .toList();
}
