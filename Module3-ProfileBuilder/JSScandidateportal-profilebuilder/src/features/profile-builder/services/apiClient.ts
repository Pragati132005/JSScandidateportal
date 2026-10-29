/**
 * RADIX Talent Match - Unified API Client
 * Centralized fetch wrapper with timeout, status checking, and error formatting.
 */

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly responseBody?: unknown;

  constructor(message: string, status: number, responseBody?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

/**
 * Standard fetch with configurable timeout and error parsing.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 45000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let body: unknown;
    if (isJson) {
      body = await response.json().catch(() => null);
    } else {
      body = await response.text().catch(() => '');
    }

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (typeof b.detail === 'string') {
          message = b.detail;
        } else if (Array.isArray(b.detail)) {
          message = b.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
        } else if (typeof b.message === 'string') {
          message = b.message;
        } else if (typeof b.error === 'string') {
          message = b.error;
        }
      } else if (typeof body === 'string' && body.trim()) {
        message = body.slice(0, 300);
      }

      throw new ApiError(message, response.status, body);
    }

    return body as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs / 1000}s. Please verify the service is running.`, 408);
    }

    const msg = err instanceof Error ? err.message : 'Network error or service unreachable';
    throw new ApiError(`Network connection failure: ${msg}`, 0);
  }
}
