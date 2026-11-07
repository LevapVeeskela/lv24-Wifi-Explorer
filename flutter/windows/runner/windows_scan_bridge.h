#ifndef RUNNER_WINDOWS_SCAN_BRIDGE_H_
#define RUNNER_WINDOWS_SCAN_BRIDGE_H_

#include <flutter/binary_messenger.h>
#include <flutter/encodable_value.h>
#include <flutter/method_call.h>
#include <flutter/method_channel.h>
#include <flutter/method_result.h>

#include <memory>

/// Public Native Wifi v1 bridge (`WlanQueryInterface` +
/// `WlanGetAvailableNetworkList`). Associated link only; no monitor mode.
class WindowsScanBridge {
 public:
  explicit WindowsScanBridge(flutter::BinaryMessenger* messenger);
  ~WindowsScanBridge();

  WindowsScanBridge(const WindowsScanBridge&) = delete;
  WindowsScanBridge& operator=(const WindowsScanBridge&) = delete;

 private:
  void HandleMethodCall(
      const flutter::MethodCall<flutter::EncodableValue>& call,
      std::unique_ptr<flutter::MethodResult<flutter::EncodableValue>> result);

  std::unique_ptr<flutter::MethodChannel<flutter::EncodableValue>> channel_;
};

#endif  // RUNNER_WINDOWS_SCAN_BRIDGE_H_
