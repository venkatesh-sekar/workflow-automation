import { isNil, spreadIfDefined } from '@flow/shared'
import { context, propagation } from '@opentelemetry/api'
import axios, { AxiosError, AxiosInstance, isAxiosError } from 'axios'
import axiosRetry from 'axios-retry'

export class FlowAxiosError extends Error {
    constructor(public error: AxiosError, message?: string) {
        super(message)
    }
}

export class FlowAxiosClient {

    private _axios: AxiosInstance
    constructor(baseUrl: string, apiToken: string) {
        this._axios = axios.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiToken}`,
            },
        })

        this._axios.interceptors.request.use((config) => {
            const traceHeaders: Record<string, string> = {}
            propagation.inject(context.active(), traceHeaders)
            Object.entries(traceHeaders).forEach(([key, value]) => {
                config.headers.set(key, value)
            })
            return config
        })

        axiosRetry(this._axios, {
            retries: 3,
            retryDelay: (retryCount: number) => {
                return retryCount * 5000
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            retryCondition: (error: any) => {
                return !isNil(error?.response?.status) && (error?.response?.status >= 500)
            },
        })
    }

    static isFlowAxiosError(error: unknown): error is FlowAxiosError {
        return error instanceof FlowAxiosError
    }

    async post<T>(url: string, data: unknown): Promise<T> {
        try {
            const response = await this._axios.post<T>(url, data)
            return response.data
        }
        catch (error) {
            if (isAxiosError(error)) {
                throw this.formatAxiosError(error)
            }
            else {
                throw error
            }
        }
    }

    async get<T>(url: string, opts: {
        params?: Record<string, string>
        responseType?: 'arraybuffer' | undefined
    }): Promise<T> {
        try {
            const response = await this._axios.get<T>(url, {
                ...spreadIfDefined('params', opts.params),
                ...spreadIfDefined('responseType', opts.responseType),
            })
            return response.data
        }
        catch (error) {
            if (isAxiosError(error)) {
                throw this.formatAxiosError(error)
            }
            else {
                throw error
            }
        }
    }

    private formatAxiosError(error: AxiosError): Error {
        const { request, response, message } = error
        const newError = new FlowAxiosError(error, JSON.stringify({
            message,
            request: request && {
                method: request.method,
                url: request.path,
            },
            response: response && {
                status: response.status,
                data: response.data,
            },
        }))
        return newError
    }
}
