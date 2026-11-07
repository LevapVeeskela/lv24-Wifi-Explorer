/// Security kinds aligned with CoreWLAN `CWSecurity` names.

enum SecurityKind {
  open,
  wep,
  wpaPersonal,
  wpaPersonalMixed,
  wpa2Personal,
  wpa3Personal,
  wpa3Transition,
  personalGeneric,
  dynamicWep,
  wpaEnterprise,
  wpaEnterpriseMixed,
  wpa2Enterprise,
  wpa3Enterprise,
  enterpriseGeneric,
  owe,
  oweTransition,
  unknown,
}

/// TS string values for tests / interchange.
SecurityKind securityKindFromString(String value) {
  switch (value) {
    case 'open':
      return SecurityKind.open;
    case 'wep':
      return SecurityKind.wep;
    case 'wpa-personal':
      return SecurityKind.wpaPersonal;
    case 'wpa-personal-mixed':
      return SecurityKind.wpaPersonalMixed;
    case 'wpa2-personal':
      return SecurityKind.wpa2Personal;
    case 'wpa3-personal':
      return SecurityKind.wpa3Personal;
    case 'wpa3-transition':
      return SecurityKind.wpa3Transition;
    case 'personal-generic':
      return SecurityKind.personalGeneric;
    case 'dynamic-wep':
      return SecurityKind.dynamicWep;
    case 'wpa-enterprise':
      return SecurityKind.wpaEnterprise;
    case 'wpa-enterprise-mixed':
      return SecurityKind.wpaEnterpriseMixed;
    case 'wpa2-enterprise':
      return SecurityKind.wpa2Enterprise;
    case 'wpa3-enterprise':
      return SecurityKind.wpa3Enterprise;
    case 'enterprise-generic':
      return SecurityKind.enterpriseGeneric;
    case 'owe':
      return SecurityKind.owe;
    case 'owe-transition':
      return SecurityKind.oweTransition;
    default:
      return SecurityKind.unknown;
  }
}

const securityPrimaryRank = <SecurityKind>[
  SecurityKind.unknown,
  SecurityKind.open,
  SecurityKind.wep,
  SecurityKind.dynamicWep,
  SecurityKind.personalGeneric,
  SecurityKind.wpaPersonal,
  SecurityKind.wpaPersonalMixed,
  SecurityKind.wpa2Personal,
  SecurityKind.oweTransition,
  SecurityKind.owe,
  SecurityKind.wpa3Transition,
  SecurityKind.wpa3Personal,
  SecurityKind.enterpriseGeneric,
  SecurityKind.wpaEnterprise,
  SecurityKind.wpaEnterpriseMixed,
  SecurityKind.wpa2Enterprise,
  SecurityKind.wpa3Enterprise,
];

enum SecurityAuthClass { open, enhancedOpen, personal, enterprise, unknown }

enum RsnHint { none, wpaIe, rsnIe, both, unparsed }

class SecurityView {
  const SecurityView({
    required this.flags,
    required this.primary,
    required this.authClass,
    required this.isOpen,
    required this.isSecure,
    required this.ieHint,
  });

  final List<SecurityKind> flags;
  final SecurityKind primary;
  final SecurityAuthClass authClass;
  final bool isOpen;
  final bool isSecure;
  final RsnHint ieHint;
}
