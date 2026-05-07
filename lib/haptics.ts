/**
 * Thin wrapper around expo-haptics. All calls are best-effort and
 * silent: missing modules (web, jest, older devices) just no-op.
 */

import * as Haptics from "expo-haptics";

export function tapHaptic(): void {
  try {
    void Haptics.selectionAsync();
  } catch {
    // best-effort
  }
}

export function successHaptic(): void {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // best-effort
  }
}

export function errorHaptic(): void {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // best-effort
  }
}

export function warningHaptic(): void {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // best-effort
  }
}
