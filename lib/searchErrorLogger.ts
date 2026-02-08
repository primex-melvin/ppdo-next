/**
 * Search Error Logger
 *
 * Provides buffered error logging for the search system with automatic flushing.
 * Errors are batched and sent to analytics endpoint periodically or on critical errors.
 */

import { SearchError, SearchErrorType } from "@/types/searchErrors";

interface ErrorLogEntry {
  timestamp: number;
  error: SearchError;
  context: {
    query?: string;
    filters?: Record<string, string[]>;
    userId?: string;
    sessionId?: string;
  };
  userAgent: string;
  url: string;
}

interface SearchErrorLoggerConfig {
  flushInterval?: number; // milliseconds
  maxBufferSize?: number;
  endpoint?: string;
  enabled?: boolean;
}

class SearchErrorLogger {
  private logBuffer: ErrorLogEntry[] = [];
  private flushInterval: number;
  private maxBufferSize: number;
  private endpoint: string;
  private enabled: boolean;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;

  constructor(config: SearchErrorLoggerConfig = {}) {
    this.flushInterval = config.flushInterval ?? 5000; // 5 seconds
    this.maxBufferSize = config.maxBufferSize ?? 50;
    this.endpoint = config.endpoint ?? "/api/analytics/search-errors";
    this.enabled = config.enabled ?? process.env.NODE_ENV === "production";
    this.sessionId = this.generateSessionId();

    // Initialize flush timer and event listeners
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init(): void {
    // Flush logs periodically
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);

    // Flush on page unload
    window.addEventListener("beforeunload", () => this.flush());

    // Flush on visibility change (when page is hidden)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });
  }

  private generateSessionId(): string {
    if (typeof window !== "undefined" && window.crypto) {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log a search error with context
   */
  log(
    error: SearchError,
    context: Partial<ErrorLogEntry["context"]> = {}
  ): void {
    if (!this.enabled) {
      // In development, just console.warn
      if (process.env.NODE_ENV === "development") {
        console.warn("[SearchError]", error.type, error.message, context);
      }
      return;
    }

    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      error,
      context: {
        ...context,
        sessionId: this.sessionId,
      },
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    this.logBuffer.push(entry);

    // Immediate flush for critical errors
    if (this.isCritical(error)) {
      this.flush();
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Check if an error is critical and requires immediate logging
   */
  private isCritical(error: SearchError): boolean {
    return [
      SearchErrorType.SERVER_ERROR,
      SearchErrorType.RATE_LIMITED,
      SearchErrorType.UNAUTHORIZED,
    ].includes(error.type);
  }

  /**
   * Flush log buffer to analytics endpoint
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Use sendBeacon for reliability on page unload
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ logs })], {
          type: "application/json",
        });
        const success = navigator.sendBeacon(this.endpoint, blob);
        if (!success) {
          // Fallback to fetch
          await this.sendViaFetch(logs);
        }
      } else {
        await this.sendViaFetch(logs);
      }
    } catch (err) {
      // If flush fails, put logs back in buffer (but limit to avoid memory issues)
      const remainingCapacity = this.maxBufferSize - this.logBuffer.length;
      if (remainingCapacity > 0) {
        this.logBuffer.unshift(...logs.slice(0, remainingCapacity));
      }

      if (process.env.NODE_ENV === "development") {
        console.error("[SearchErrorLogger] Flush failed:", err);
      }
    }
  }

  /**
   * Send logs via fetch API
   */
  private async sendViaFetch(logs: ErrorLogEntry[]): Promise<void> {
    await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs }),
      keepalive: true,
    });
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.logBuffer.length;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Singleton instance
export const searchErrorLogger = new SearchErrorLogger();

// Export class for testing
export { SearchErrorLogger };
export type { ErrorLogEntry, SearchErrorLoggerConfig };
