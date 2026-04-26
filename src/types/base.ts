export type TransportResponse = {
	body: unknown;
	statusCode?: number;
	url: string;
};

export type TransportOptions = {
	url: string;
	headers: Record<string, string>;
	http2: boolean;
	responseType: "text";
	throwHttpErrors: true;
	retry: { limit: 0 };
	timeout: { request: number };
};

export type Transport = (
	options: TransportOptions,
) => Promise<TransportResponse>;

export type RequestOptions = {
	headers?: Record<string, string>;
	sleep?: (milliseconds: number) => Promise<void>;
	transport?: Transport;
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
