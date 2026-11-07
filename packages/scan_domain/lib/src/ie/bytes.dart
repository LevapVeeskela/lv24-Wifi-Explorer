/// Hex without separators, lowercase.
String toHex(List<int> bytes) {
  final buffer = StringBuffer();
  for (final b in bytes) {
    buffer.write((b & 0xff).toRadixString(16).padLeft(2, '0'));
  }
  return buffer.toString();
}

String? formatOui(List<int> bytes) {
  if (bytes.length < 3) return null;
  String part(int i) => (bytes[i] & 0xff).toRadixString(16).padLeft(2, '0');
  return '${part(0)}:${part(1)}:${part(2)}';
}

int? u16le(List<int> bytes, int offset) {
  if (offset + 1 >= bytes.length) return null;
  return (bytes[offset] & 0xff) | ((bytes[offset + 1] & 0xff) << 8);
}

class IeTlv {
  const IeTlv({required this.id, required this.payload});

  final int id;
  final List<int> payload;
}

/// TLV walk: id + length + payload. Truncated tail is dropped, not invented.
List<IeTlv> walkIeTlvs(List<int> data) {
  final out = <IeTlv>[];
  var offset = 0;
  while (offset < data.length) {
    if (offset + 1 >= data.length) break;
    final id = data[offset] & 0xff;
    final len = data[offset + 1] & 0xff;
    if (offset + 2 + len > data.length) break;
    out.add(
      IeTlv(
        id: id,
        payload: List<int>.unmodifiable(
          data.sublist(offset + 2, offset + 2 + len),
        ),
      ),
    );
    offset += 2 + len;
  }
  return out;
}

String? asciiLetters(int a, int b) {
  if (a < 0x41 || a > 0x5a || b < 0x41 || b > 0x5a) return null;
  return String.fromCharCodes([a, b]);
}

String formatHexSpaced(List<int> bytes, {int chunk = 16}) {
  if (bytes.isEmpty) return '';
  final parts = <String>[];
  for (var i = 0; i < bytes.length; i += chunk) {
    final end = i + chunk > bytes.length ? bytes.length : i + chunk;
    parts.add(toHex(bytes.sublist(i, end)));
  }
  return parts.join(' ');
}
