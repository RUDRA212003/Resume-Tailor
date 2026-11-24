/**
 * Native Web Share API Utility for Mobile PWA
 * Allows users to share tailored resumes, links, or PDF files directly via the native OS share sheet.
 * Falls back to clipboard copy or direct download if unsupported.
 */

import { haptics } from './haptics';

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  files?: File[];
}

export const nativeShare = {
  /**
   * Checks if native sharing is available in the current browser.
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator;
  },

  /**
   * Checks if specific files can be shared natively.
   */
  canShareFiles(files: File[]): boolean {
    if (!this.isSupported() || typeof navigator.canShare !== 'function') {
      return false;
    }
    try {
      return navigator.canShare({ files });
    } catch (_) {
      return false;
    }
  },

  /**
   * Shares resume data or files using the native share sheet.
   */
  async share(options: ShareOptions): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'unsupported'; error?: string }> {
    const { title, text, url, files } = options;
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    // 1. Try Native Share API
    if (this.isSupported()) {
      try {
        const shareData: ShareData = {
          title,
          text: text || title,
          url: shareUrl,
        };

        if (files && files.length > 0 && this.canShareFiles(files)) {
          shareData.files = files;
        }

        await navigator.share(shareData);
        haptics.success();
        return { success: true, method: 'native' };
      } catch (err: any) {
        // User cancelled or aborted native share sheet
        if (err.name === 'AbortError') {
          return { success: false, method: 'native', error: 'Share cancelled' };
        }
        console.warn('Native share error, attempting fallback:', err);
      }
    }

    // 2. Fallback to Clipboard Copy
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        const copyContent = `${title}\n${text ? text + '\n' : ''}${shareUrl}`;
        await navigator.clipboard.writeText(copyContent);
        haptics.success();
        return { success: true, method: 'clipboard' };
      } catch (err: any) {
        haptics.error();
        return { success: false, method: 'clipboard', error: err.message };
      }
    }

    haptics.warning();
    return { success: false, method: 'unsupported', error: 'Sharing not supported on this browser.' };
  },
};
