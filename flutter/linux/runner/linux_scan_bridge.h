#ifndef RUNNER_LINUX_SCAN_BRIDGE_H_
#define RUNNER_LINUX_SCAN_BRIDGE_H_

#include <flutter_linux/flutter_linux.h>

G_BEGIN_DECLS

/// Registers `dev.lv24.wifi_explorer/linux_scan` on [view]'s engine.
void linux_scan_bridge_register(FlView* view);

G_END_DECLS

#endif  // RUNNER_LINUX_SCAN_BRIDGE_H_
