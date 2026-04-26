import { gotScraping } from "got-scraping";

type TransportResponse = {
	body: unknown;
	statusCode?: number;
	url: string;
};

type Transport = (options: {
	url: string;
	headers: Record<string, string>;
	http2: boolean;
	responseType: "text";
	throwHttpErrors: true;
	retry: { limit: 0 };
	timeout: { request: number };
}) => Promise<TransportResponse>;

export const BASE_URL = "https://www.xvideos.com";

const DEFAULT_HEADERS = {
	"user-agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
	"accept-language": "en-US,en;q=0.9",
};

type RequestOptions = {
	headers?: Record<string, string>;
	sleep?: (milliseconds: number) => Promise<void>;
	transport?: Transport;
};

type RequestResponse = {
	data: string;
	statusCode?: number;
	url: string;
};

type RetryableError = Error & {
	code?: string;
	name?: string;
};

const REQUEST_TIMEOUT = 15_000;
const REQUEST_ATTEMPTS = 3;
const RETRYABLE_ERROR_CODES = new Set([
	"ECONNABORTED",
	"ECONNREFUSED",
	"ECONNRESET",
	"EAI_AGAIN",
	"ETIMEDOUT",
]);

export const resolveUrl = (path: string | undefined): string => {
	if (!path) {
		return "";
	}

	return new URL(path, BASE_URL).toString();
};

export const delay = async (milliseconds: number): Promise<void> => {
	await new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
};

export const shouldRetry = (error: unknown): error is RetryableError => {
	if (!(error instanceof Error)) {
		return false;
	}

	const retryableError = error as RetryableError;

	return (
		retryableError.name === "TimeoutError" ||
		(retryableError.code !== undefined &&
			RETRYABLE_ERROR_CODES.has(retryableError.code))
	);
};

export const createRequest = (options: RequestOptions = {}) => ({
	async get(path: string): Promise<RequestResponse> {
		const transport = options.transport ?? gotScraping;
		const sleep = options.sleep ?? delay;
		let attempt = 1;

		while (true) {
			try {
				const response = await transport({
					url: resolveUrl(path),
					headers: {
						...DEFAULT_HEADERS,
						...options.headers,
					},
					http2: false,
					responseType: "text",
					throwHttpErrors: true,
					retry: {
						limit: 0,
					},
					timeout: {
						request: REQUEST_TIMEOUT,
					},
				});

				return {
					data:
						typeof response.body === "string"
							? response.body
							: String(response.body),
					statusCode: response.statusCode,
					url: response.url,
				};
			} catch (error) {
				if (!shouldRetry(error) || attempt === REQUEST_ATTEMPTS) {
					throw error;
				}

				await sleep(attempt * 750);
				attempt += 1;
			}
		}
	},
});

export default {
	BASE_URL,
	createRequest,
	resolveUrl,
};
