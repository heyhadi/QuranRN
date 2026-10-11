export class HttpError extends Error {
    constructor(
        message: string,
        readonly status?: number,
    ) {
        super(message);
        this.name = "HttpError";
    }
}

const DEFAULT_TIMEOUT_MS = 15_000;

/** GET a JSON document, failing on non-2xx responses and after a timeout. */
export async function getJson<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new HttpError(`Request failed with status ${response.status}: ${url}`, response.status);
        }
        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        if (controller.signal.aborted) throw new HttpError(`Request timed out after ${timeoutMs}ms: ${url}`);
        throw new HttpError(`Network error: ${url}`);
    } finally {
        clearTimeout(timer);
    }
}
