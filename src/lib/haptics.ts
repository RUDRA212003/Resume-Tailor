/**
 * Haptic Feedback Utility for Mobile PWA
 * Uses the Web Vibration API where supported (Android Chrome/Edge/Firefox).
 * Gracefully ignores unsupported environments (iOS Safari, Desktop) and respects accessibility.
 */

class Haptics {
  private isSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // 1. Check if navigator.vibrate is available
    if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
      return false;
    }

    // 2. Respect accessibility preferences (prefers-reduced-motion)
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
    } catch (_) {}

    // 3. Avoid vibrations on non-touch desktop environments
    const isTouch =
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    if (!isTouch) {
      return false;
    }

    return true;
  }

  private trigger(pattern: number | number[]): boolean {
    try {
      if (!this.isSupported()) return false;
      return navigator.vibrate(pattern);
    } catch (_) {
      return false;
    }
  }

  /**
   * Subtle light pulse (10-15ms)
   * Ideal for button taps, filter chips, and basic interactive controls.
   */
  light(): boolean {
    return this.trigger(12);
  }

  /**
   * Alias for light() tap feedback
   */
  tap(): boolean {
    return this.light();
  }

  /**
   * Selection tick (10ms)
   * Ideal for tab switching, segmented controls, and bottom navigation.
   */
  selection(): boolean {
    return this.trigger(10);
  }

  /**
   * Form control toggle tick (12ms)
   * Ideal for checkboxes, radio buttons, and switch toggles.
   */
  toggle(): boolean {
    return this.trigger(12);
  }

  /**
   * Loading start tactile indicator (10ms)
   * Informs user their action has been registered and is processing.
   */
  loadingStart(): boolean {
    return this.trigger(10);
  }

  /**
   * Loading complete with success [15ms, 60ms pause, 15ms]
   */
  loadingSuccess(): boolean {
    return this.success();
  }

  /**
   * Loading complete with failure [40ms, 60ms pause, 40ms]
   */
  loadingError(): boolean {
    return this.error();
  }

  /**
   * Context-aware button press haptic feedback
   */
  buttonPress(variant?: string): boolean {
    if (variant === 'danger') {
      return this.impactHeavy();
    }
    return this.light();
  }

  /**
   * Crisp double pulse [15ms, 60ms pause, 15ms]
   * Ideal for successful operations: login, generation complete, file download, saved changes.
   */
  success(): boolean {
    return this.trigger([15, 60, 15]);
  }

  /**
   * Warning pattern [25ms, 50ms pause, 20ms]
   * Ideal for auth prompts, rate limits, or gentle validation warnings.
   */
  warning(): boolean {
    return this.trigger([25, 50, 20]);
  }

  /**
   * Slightly stronger alert pulse [40ms, 60ms pause, 40ms]
   * Ideal for failed operations, upload errors, or required field errors.
   */
  error(): boolean {
    return this.trigger([40, 60, 40]);
  }

  /**
   * Medium impact pulse (25ms)
   * Ideal for bottom sheet expansion, modal open, or drag release.
   */
  impactMedium(): boolean {
    return this.trigger(25);
  }

  /**
   * Heavy impact pulse (40ms)
   * Ideal for destructive actions like delete confirmation.
   */
  impactHeavy(): boolean {
    return this.trigger(40);
  }
}

export const haptics = new Haptics();
