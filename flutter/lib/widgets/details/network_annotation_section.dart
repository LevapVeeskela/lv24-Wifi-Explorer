import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/annotations/annotations.dart';
import '../../features/scan_details/bss_accessors.dart';
import 'details_note_field.dart';
import 'network_pin_color_row.dart';

class NetworkAnnotationSection extends StatelessWidget {
  const NetworkAnnotationSection({
    super.key,
    required this.bss,
    required this.controller,
  });

  final ObservedBss bss;
  final AnnotationsController controller;

  @override
  Widget build(BuildContext context) {
    final rawBssid = bssidOf(bss);
    final enabled = rawBssid != null && rawBssid.isNotEmpty;
    final bssid = rawBssid ?? '';

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final note = enabled ? (controller.textFor(bssid) ?? '') : '';
        final pinned = enabled ? controller.pinnedHexFor(bssid) : null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                OutlinedButton.icon(
                  onPressed: () => showImportAnnotationCsvDialog(
                    context,
                    controller: controller,
                  ),
                  icon: const Icon(Icons.upload_outlined, size: 18),
                  label: Text(context.annotationImportCsv),
                ),
                OutlinedButton.icon(
                  onPressed: controller.rules.isEmpty
                      ? null
                      : () => showExportAnnotationCsvDialog(
                            context,
                            controller: controller,
                          ),
                  icon: const Icon(Icons.download_outlined, size: 18),
                  label: Text(context.annotationExportCsv),
                ),
              ],
            ),
            const SizedBox(height: 8),
            DetailsNoteField(
              label: context.annotationNoteLabel,
              hint: context.annotationNoteHint,
              value: note,
              enabled: enabled,
              onCommit: (text) => controller.commitAnnotation(bssid, text),
            ),
            if (enabled)
              NetworkPinColorRow(
                label: context.annotationPinColorLabel,
                bssid: bssid,
                pinnedHex: pinned,
                enabled: enabled,
                autoLabel: context.annotationPinColorAuto,
                onPick: (hex) => controller.setPinColor(bssid, hex),
                onClear: () => controller.clearPinColor(bssid),
              ),
          ],
        );
      },
    );
  }
}
