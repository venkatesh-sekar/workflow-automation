import { z } from 'zod'


export const FlowMultipartFile = z.object({
    filename: z.string(),
    data: z.unknown(),
    type: z.literal('file'),
    mimetype: z.string().optional(),
})

export type FlowMultipartFile = z.infer<typeof FlowMultipartFile> & {
    data: Buffer
}

export const isMultipartFile = (value: unknown): value is FlowMultipartFile => {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'file' && 'filename' in value && 'data' in value && value.data instanceof Buffer
}
