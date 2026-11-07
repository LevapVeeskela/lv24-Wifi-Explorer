import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';

class ScanVendorFilterField extends StatefulWidget {
  const ScanVendorFilterField({
    super.key,
    required this.vendorQuery,
    required this.onChanged,
  });

  final String vendorQuery;
  final ValueChanged<String> onChanged;

  @override
  State<ScanVendorFilterField> createState() => _ScanVendorFilterFieldState();
}

class _ScanVendorFilterFieldState extends State<ScanVendorFilterField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.vendorQuery);
  }

  @override
  void didUpdateWidget(covariant ScanVendorFilterField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.vendorQuery != widget.vendorQuery &&
        widget.vendorQuery != _controller.text) {
      _controller.text = widget.vendorQuery;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Semantics(
      label: l10n.scanMessage('scan.details.vendor'),
      child: SizedBox(
        width: 140,
        child: TextField(
          controller: _controller,
          decoration: InputDecoration(
            isDense: true,
            hintText: l10n.scanMessage('scan.details.vendor'),
            border: const OutlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
          ),
          onChanged: widget.onChanged,
        ),
      ),
    );
  }
}
