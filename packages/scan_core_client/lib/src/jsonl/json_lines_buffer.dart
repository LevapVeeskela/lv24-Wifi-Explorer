/// Buffers UTF-8 chunks into newline-delimited JSON lines.
class JsonLinesBuffer {
  String _buffer = '';

  Iterable<String> push(String chunk) sync* {
    _buffer += chunk;
    var index = _buffer.indexOf('\n');
    while (index != -1) {
      final line = _buffer.substring(0, index);
      _buffer = _buffer.substring(index + 1);
      yield line;
      index = _buffer.indexOf('\n');
    }
  }

  String? flushRemainder() {
    final trimmed = _buffer.trim();
    _buffer = '';
    if (trimmed.isEmpty) return null;
    return trimmed;
  }
}
