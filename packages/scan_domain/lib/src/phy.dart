/// PHY letters aligned with CoreWLAN `CWPHYMode`.

enum PhyLetter { a, b, g, n, ac, ax, be }

PhyLetter? phyLetterFromString(String value) {
  switch (value) {
    case 'a':
      return PhyLetter.a;
    case 'b':
      return PhyLetter.b;
    case 'g':
      return PhyLetter.g;
    case 'n':
      return PhyLetter.n;
    case 'ac':
      return PhyLetter.ac;
    case 'ax':
      return PhyLetter.ax;
    case 'be':
      return PhyLetter.be;
    default:
      return null;
  }
}

class PhyView {
  const PhyView({
    required this.supported,
    required this.highest,
    required this.display,
    this.source = 'api-supportsPHYMode',
  });

  final List<PhyLetter> supported;
  final PhyLetter? highest;
  final String display;
  final String source;
}
