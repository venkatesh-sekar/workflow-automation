import { stdSerializers } from 'pino'

/* eslint-disable @typescript-eslint/no-explicit-any */
function sanitizeErr(err: Error): Record<string, unknown> {
    const serialized: Record<string, unknown> = stdSerializers.err(err)
    const raw = err as any

    if (raw.isAxiosError !== true) {
        return serialized
    }

    if (raw.config) {
        serialized['config'] = {
            url: raw.config.url,
            method: raw.config.method,
            baseURL: raw.config.baseURL,
            timeout: raw.config.timeout,
        }
    }

    delete serialized['request']

    if (raw.response) {
        const data = raw.response.data
        serialized['response'] = {
            status: raw.response.status,
            statusText: raw.response.statusText,
            data: typeof data === 'object' && data !== null
                ? { error: data.error, errors: data.errors }
                : data,
        }
    }

    return serialized
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const sharedSerializers = {
    err: sanitizeErr,
}
