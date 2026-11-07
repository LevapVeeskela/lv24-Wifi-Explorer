import 'package:flutter/material.dart';

class DetailsNoteField extends StatefulWidget {
  const DetailsNoteField({
    super.key,
    required this.label,
    required this.value,
    required this.hint,
    required this.enabled,
    required this.onCommit,
  });

  final String label;
  final String value;
  final String hint;
  final bool enabled;
  final ValueChanged<String> onCommit;

  @override
  State<DetailsNoteField> createState() => _DetailsNoteFieldState();
}

class _DetailsNoteFieldState extends State<DetailsNoteField> {
  late final TextEditingController _controller;
  late final FocusNode _focus;
  String _lastCommitted = '';

  @override
  void initState() {
    super.initState();
    _lastCommitted = widget.value;
    _controller = TextEditingController(text: widget.value);
    _focus = FocusNode()..addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(covariant DetailsNoteField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _lastCommitted && widget.value != _controller.text) {
      _lastCommitted = widget.value;
      _controller.text = widget.value;
    }
    if (!widget.enabled && _focus.hasFocus) {
      _focus.unfocus();
    }
  }

  void _onFocusChange() {
    if (!_focus.hasFocus) _commit();
  }

  void _commit() {
    if (!widget.enabled) return;
    final next = _controller.text;
    if (next == _lastCommitted) return;
    _lastCommitted = next;
    widget.onCommit(next);
  }

  @override
  void dispose() {
    _focus.removeListener(_onFocusChange);
    _focus.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 132,
            child: Text(
              widget.label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focus,
              enabled: widget.enabled,
              minLines: 1,
              maxLines: 4,
              decoration: InputDecoration(
                isDense: true,
                hintText: widget.hint,
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) {
                _commit();
                _focus.unfocus();
              },
            ),
          ),
        ],
      ),
    );
  }
}
