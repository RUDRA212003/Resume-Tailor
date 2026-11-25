/**
 * Haptic Feedback Utility for Mobile PWA & Web Applications
 * Uses the Web Vibration API where supported (Android Chrome/Edge/Firefox).
 * Also integrates with Capacitor Haptics if running in native app shells.
 * Tuned with optimal millisecond durations to ensure physical ERM & LRA
 * phone vibration motors have sufficient spin-up time to be perceived.
 * Gracefully falls back in unsupported environments (iOS Safari, Desktop).
 */

class Haptics {
  private userHasInteracted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for initial user touch/interaction to unlock vibration permissions
      const unlock = () => {
        this.userHasInteracted = true;
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('click', unlock);
      };
      window.addEventListener('touchstart', unlock, { passive: true, once: true });
      window.addEventListener('pointerdown', unlock, { passive: true, once: true });
      window.addEventListener('click', unlock, { passive: true, once: true });
    }
  }

  /**
   * Explicitly notify that the user has interacted (e.g. tapped the intro screen).
   * Unlocks vibration in browsers that gate navigator.vibrate behind user activation.
   */
  public notifyUserInteraction(): void {
    this.userHasInteracted = true;
  }

  private isSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // Check for Capacitor native bridge first
    const cap = (window as unknown as { Capacitor?: { isPluginAvailable?: (name: string) => boolean; Plugins?: { Haptics?: unknown } } }).Capacitor;
    if (cap?.Plugins?.Haptics || cap?.isPluginAvailable?.('Haptics')) {
      return true;
    }

    // Check Web Vibration API
    if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
      return false;
    }

    // Respect accessibility preferences
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
    } catch (_) {}

    // Avoid vibrations on strictly non-touch desktop environments
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

      // Check Capacitor native plugin
      const cap = (window as unknown as { Capacitor?: { Plugins?: { Haptics?: { vibrate?: (opts: { duration: number }) => Promise<void> } } } }).Capacitor;
      if (cap?.Plugins?.Haptics?.vibrate) {
        const dur = Array.isArray(pattern) ? pattern[0] : pattern;
        cap.Plugins.Haptics.vibrate({ duration: dur }).catch(() => {});
        return true;
      }

      // Standard Web Vibration API
      // Normalizing to an array provides the most reliable execution across Android Chromium variants
      const normalizedPattern = Array.isArray(pattern) ? pattern : [pattern];
      return navigator.vibrate(normalizedPattern);
    } catch (_) {
      return false;
    }
  }

  /**
   * Subtle, crisp light pulse (28ms)
   * Optimal duration for mobile ERM and LRA actuators to overcome motor inertia
   * while feeling delicate and unobtrusive.
   * Ideal for item absorption, button taps, and filter chips.
   */
  light(): boolean {
    return this.trigger(28);
  }

  /**
   * Alias for light() tap feedback
   */
  tap(): boolean {
    return this.light();
  }

  /**
   * Selection tick (20ms)
   * Ideal for tab switching, segmented controls, and bottom navigation.
   */
  selection(): boolean {
    return this.trigger(20);
  }

  /**
   * Form control toggle tick (24ms)
   * Ideal for checkboxes, radio buttons, and switch toggles.
   */
  toggle(): boolean {
    return this.trigger(24);
  }

  /**
   * Loading start tactile indicator (20ms)
   */
  loadingStart(): boolean {
    return this.trigger(20);
  }

  /**
   * Loading complete with success [30ms, 50ms pause, 30ms]
   */
  loadingSuccess(): boolean {
    return this.success();
  }

  /**
   * Loading complete with failure [50ms, 60ms pause, 50ms]
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
   * Crisp double pulse [30ms, 50ms pause, 30ms]
   * Ideal for successful operations: login, generation complete, brand reveal, saved changes.
   */
  success(): boolean {
    return this.trigger([30, 50, 30]);
  }

  /**
   * Warning pattern [35ms, 50ms pause, 30ms]
   */
  warning(): boolean {
    return this.trigger([35, 50, 30]);
  }

  /**
   * Slightly stronger alert pulse [50ms, 60ms pause, 50ms]
   */
  error(): boolean {
    return this.trigger([50, 60, 50]);
  }

  /**
   * Medium impact pulse (45ms)
   * Ideal for box lid closing, bottom sheet expansion, modal open, or drag release.
   */
  impactMedium(): boolean {
    return this.trigger(45);
  }

  /**
   * Heavy impact pulse (65ms)
   * Ideal for destructive actions like delete confirmation.
   */
  impactHeavy(): boolean {
    return this.trigger(65);
  }
}

export const haptics = new Haptics();
