import { isNil } from '@flow/shared'
import axios, { AxiosError } from 'axios'
import axiosRetry from 'axios-retry'


export const flowAxios = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosRetry(flowAxios, {
    retryDelay: (_retryCount: number) => {
        return 2000
    },
    retries: 3,
    retryCondition: (error: AxiosError) => {
        return !isNil(error.response?.status) && error.response.status >= 500 && error.response.status < 600
    },
})

