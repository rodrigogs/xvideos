export type TransportResponse = {
  body: unknown;
  statusCode?: number;
  url: string;
};

export type TransportOptions = {
  url: string;
  headers: Record<string, string>;
  http2: boolean;
  responseType: 'text';
  throwHttpErrors: true;
  retry: { limit: 0 };
  timeout: { request: number };
  proxyUrl?: string;
};

export type Transport = (
  options: TransportOptions,
) => Promise<TransportResponse>;

export type RequestOptions = {
  headers?: Record<string, string>;
  sleep?: (milliseconds: number) => Promise<void>;
  transport?: Transport;
  /** Minimum spacing between request starts, shared process-wide. */
  minRequestIntervalMs?: number;
  /** Route requests through an HTTP(S) proxy. */
  proxyUrl?: string;
  /** Clock for the shared throttle (injectable for tests). */
  now?: () => number;
  /** Random source for retry backoff jitter (injectable for tests). */
  random?: () => number;
};

export type RequestResponse = {
  data: string;
  statusCode?: number;
  url: string;
};

export type RetryableError = Error & {
  code?: string;
  name?: string;
};
